import * as THREE from 'three';
import { defineLab } from './define.js';
import { SCENARIOS } from '../data/scenarios.js';
import { capacitorState, DIELECTRICS } from '../physics/capacitor.js';
import { coachCap } from '../physics/coach.js';
import { fmtC, fmtV, fmtCharge, fmtE, fmtEnergy, sciHTML } from '../ui/format.js';
import { kv, cells } from '../ui/shared.js';

export default defineLab({
  id: 'capacitor',
  exam: 'e3',
  title: 'Capacitor',
  hint: 'Insert a dielectric or switch battery / isolated',
  orbit: true,
  camera: { pos: new THREE.Vector3(0.2, 2.2, 6.4), target: new THREE.Vector3(0, 0, 0) },
  // Big plates (the Ch 40 1.5 m² example) need the camera pulled back in proportion.
  cameraFor(state) {
    const side = Math.min(Math.max(Math.sqrt(state.cap?.A ?? 0.04), 0.18), 0.55);
    const k = Math.max(1, (side * 8 + 1) / 2.6);
    return { pos: new THREE.Vector3(0.2 * k, 2.2 * k, 6.4 * k), target: new THREE.Vector3(0, 0, 0) };
  },
  keys: { r: 'reset', R: 'reset' },
  scenarios: SCENARIOS.capacitor,
  defaultState() {
    return {
      scenarioId: 'cap-12v',
      cap: { A: 0.04, d: 0.05, V: 12, Q0: 8.496e-11, mode: 'battery', dielectric: 'air', inserted: true, fill: 1 },
      charges: [],
      extraE: { x: 0, y: 0, z: 0 },
      show: { flux: false, E: false, nHat: false, lines: false, forces: false },
      selectedId: null,
      anim: { playing: false, i: 0 },
    };
  },
  controls() {
    return `
        <div class="lab-block">
          <div class="seg" id="cap-mode">
            <button type="button" data-mode="battery" class="active">Battery (V fixed)</button>
            <button type="button" data-mode="isolated">Isolated (Q fixed)</button>
          </div>
          <label class="field">
            <span>Dielectric</span>
            <select id="cap-dielectric"></select>
          </label>
          <label class="row">
            <input type="checkbox" id="cap-inserted" checked />
            <span>Dielectric inserted</span>
          </label>
          <label class="field">
            <span>Plate area A</span>
            <div class="slider-row">
              <input type="range" id="cap-A" min="0.01" max="2" step="0.01" value="0.04" />
              <span class="mono val" id="cap-A-val">0.04 m²</span>
            </div>
          </label>
          <label class="field">
            <span>Separation d</span>
            <div class="slider-row">
              <input type="range" id="cap-d" min="0.001" max="0.12" step="0.001" value="0.05" />
              <span class="mono val" id="cap-d-val">5.0 cm</span>
            </div>
          </label>
          <label class="field" id="wrap-cap-V">
            <span>Voltage V</span>
            <div class="slider-row">
              <input type="range" id="cap-V" min="1" max="5000" step="1" value="12" />
              <span class="mono val" id="cap-V-val">12 V</span>
            </div>
          </label>
        </div>`;
  },
  bind(api) {
    const $ = (id) => document.getElementById(id);
    const capDie = $('cap-dielectric');
    capDie.innerHTML = DIELECTRICS.map((d) => `<option value="${d.id}">${d.name} (κ=${d.kappa})</option>`).join('');
    capDie.addEventListener('change', () => {
      api.slice().cap.dielectric = capDie.value;
      api.bump();
    });
    $('cap-inserted').addEventListener('change', (e) => {
      api.slice().cap.inserted = e.target.checked;
      api.bump();
    });
    $('cap-A').addEventListener('input', (e) => {
      api.slice().cap.A = Number(e.target.value);
      api.bump();
    });
    $('cap-d').addEventListener('input', (e) => {
      api.slice().cap.d = Number(e.target.value);
      api.bump();
    });
    $('cap-V').addEventListener('input', (e) => {
      api.slice().cap.V = Number(e.target.value);
      api.bump();
    });
    $('cap-mode').addEventListener('click', (e) => {
      const btn = e.target.closest('[data-mode]');
      if (!btn) return;
      const s = api.slice();
      if (btn.dataset.mode === 'isolated') {
        s.cap.Q0 = capacitorState({ ...s.cap, mode: 'battery' }).Q;
      }
      s.cap.mode = btn.dataset.mode;
      api.bump();
    });
  },
  syncControls(state) {
    const $ = (id) => document.getElementById(id);
    document.querySelectorAll('#cap-mode [data-mode]').forEach((b) => {
      b.classList.toggle('active', b.dataset.mode === state.cap.mode);
    });
    $('cap-dielectric').value = state.cap.dielectric;
    $('cap-inserted').checked = state.cap.inserted !== false;
    $('cap-A').value = state.cap.A;
    $('cap-A-val').textContent = `${state.cap.A.toFixed(2)} m²`;
    $('cap-d').value = state.cap.d;
    $('cap-d-val').textContent = state.cap.d >= 0.01 ? `${(state.cap.d * 100).toFixed(1)} cm` : `${(state.cap.d * 1000).toFixed(1)} mm`;
    $('cap-V').value = state.cap.V;
    $('cap-V-val').textContent = fmtV(state.cap.V);
    $('wrap-cap-V').hidden = state.cap.mode !== 'battery';
  },
  recompute(state, computed) {
    computed.cap = capacitorState(state.cap);
  },
  syncViews(state, computed, ctx) {
    const cap = ctx.pool.cap();
    cap.setVisible(true);
    if (computed.cap) cap.rebuild(state.cap, computed.cap);
    ctx.grid.visible = true;
  },
  law: () => [String.raw`C = \dfrac{q}{\Delta V} = \dfrac{\kappa\varepsilon_0 A}{d}`, String.raw`E = \dfrac{V}{d} \qquad U = \tfrac{1}{2}CV^2`],
  liveRows(state, computed) {
    const r = computed.cap;
    if (!r) return '';
    return [
      kv(String.raw`$\kappa$`, String(r.kappa)),
      kv(String.raw`$C_0$ (vacuum)`, fmtC(r.C0)),
      kv(String.raw`$C = \kappa C_0$`, fmtC(r.C)),
      kv(String.raw`$V$`, fmtV(r.V)),
      kv(String.raw`$q = CV$`, fmtCharge(r.Q)),
      kv(String.raw`$E = V/d$`, fmtE(r.E)),
      kv(String.raw`$\sigma = q/A$`, `${sciHTML(r.sigma)} C/m²`),
      kv(String.raw`$U = \tfrac{1}{2}CV^2$`, fmtEnergy(r.U)),
      kv(String.raw`$V_{\text{bd}} = (\text{DS})\,d$`, Number.isFinite(r.Vbd) ? fmtV(r.Vbd) : '—'),
      kv('Breakdown', r.breakdown ? '<span class="bad">YES</span>' : '<span class="ok">no</span>'),
    ].join('');
  },
  readout(state, computed) {
    const r = computed.cap;
    if (!r) return '';
    return cells([
      [String.raw`$C$`, fmtC(r.C), ''],
      [String.raw`$V$`, fmtV(r.V), r.breakdown ? 'bad' : ''],
      [String.raw`$q$`, fmtCharge(r.Q), ''],
      [String.raw`$U$`, fmtEnergy(r.U), r.breakdown ? 'bad' : 'ok'],
    ]);
  },
  coach: (state, computed) => coachCap(state, computed),
});
