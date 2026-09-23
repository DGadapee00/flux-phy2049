import * as THREE from 'three';
import { defineLab } from './define.js';
import { SCENARIOS } from '../data/scenarios.js';
import { ohmState, MATERIALS } from '../physics/circuit.js';
import { coachOhm } from '../physics/coach.js';
import { fmtR, fmtI, fmtP, fmtV, fmtE, sciHTML } from '../ui/format.js';
import { kv, cells } from '../ui/shared.js';

function circuitConfig(state, computed) {
  const o = computed.ohm;
  return {
    eq: 'ohm',
    source: 'dc',
    load: 'resistor',
    loadName: `${o.mat.name} wire · ${state.ohm.L.toFixed(1)} m`,
    V: state.ohm.V,
    I: o.I,
    R: o.R,
    P: o.P,
  };
}

export default defineLab({
  id: 'ohm',
  exam: 'e3',
  title: 'Ohm',
  hint: 'Heat the wire — R rises, I falls',
  live: true,
  orbit: false,
  camera: { pos: new THREE.Vector3(0, 0.35, 12), target: new THREE.Vector3(0, 0.35, 0) },
  keys: { r: 'reset', R: 'reset' },
  scenarios: SCENARIOS.ohm,
  defaultState() {
    return {
      scenarioId: 'ohm-headlight',
      ohm: { material: 'copper', L: 2, A: 1e-6, V: 12, T: 20 },
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
          <label class="field">
            <span>Material</span>
            <select id="ohm-material"></select>
          </label>
          <label class="field">
            <span>Length L</span>
            <div class="slider-row">
              <input type="range" id="ohm-L" min="0.1" max="100" step="0.1" value="2" />
              <span class="mono val" id="ohm-L-val">2.0 m</span>
            </div>
          </label>
          <label class="field">
            <span>Cross section A</span>
            <div class="slider-row">
              <input type="range" id="ohm-A" min="0.1" max="10" step="0.1" value="1" />
              <span class="mono val" id="ohm-A-val">1.00 mm²</span>
            </div>
          </label>
          <label class="field">
            <span>Voltage V</span>
            <div class="slider-row">
              <input type="range" id="ohm-V" min="1" max="120" step="1" value="12" />
              <span class="mono val" id="ohm-V-val">12 V</span>
            </div>
          </label>
          <label class="field">
            <span>Temperature T</span>
            <div class="slider-row">
              <input type="range" id="ohm-T" min="-20" max="1000" step="5" value="20" />
              <span class="mono val" id="ohm-T-val">20 °C</span>
            </div>
          </label>
        </div>`;
  },
  bind(api) {
    const $ = (id) => document.getElementById(id);
    const ohmMat = $('ohm-material');
    ohmMat.innerHTML = MATERIALS.map((m) => `<option value="${m.id}">${m.name}</option>`).join('');
    ohmMat.addEventListener('change', () => {
      api.slice().ohm.material = ohmMat.value;
      api.slice().ohm.Rlock = undefined;
      api.bump();
    });
    $('ohm-L').addEventListener('input', (e) => {
      api.slice().ohm.L = Number(e.target.value);
      api.slice().ohm.Rlock = undefined;
      api.bump();
    });
    $('ohm-A').addEventListener('input', (e) => {
      api.slice().ohm.A = Number(e.target.value) * 1e-6;
      api.slice().ohm.Rlock = undefined;
      api.bump();
    });
    $('ohm-V').addEventListener('input', (e) => {
      api.slice().ohm.V = Number(e.target.value);
      api.bump();
    });
    $('ohm-T').addEventListener('input', (e) => {
      api.slice().ohm.T = Number(e.target.value);
      api.slice().ohm.Rlock = undefined;
      api.bump();
    });
  },
  syncControls(state) {
    const $ = (id) => document.getElementById(id);
    // A problem can ask for a value past a slider's end (a wire at 2000 °C); widen it rather than
    // let the browser clamp the slider, and the number box beside it, to the old limit.
    const fit = (id, v) => {
      const el = $(id);
      if (v > Number(el.max)) el.max = String(v);
      if (v < Number(el.min)) el.min = String(v);
      el.value = v;
    };
    $('ohm-material').value = state.ohm.material;
    fit('ohm-L', state.ohm.L);
    $('ohm-L-val').textContent = `${state.ohm.L.toFixed(1)} m`;
    fit('ohm-A', state.ohm.A * 1e6);
    $('ohm-A-val').textContent = `${(state.ohm.A * 1e6).toFixed(2)} mm²`;
    fit('ohm-V', state.ohm.V);
    $('ohm-V-val').textContent = fmtV(state.ohm.V);
    fit('ohm-T', state.ohm.T);
    $('ohm-T-val').textContent = `${state.ohm.T.toFixed(0)} °C`;
  },
  recompute(state, computed) {
    computed.ohm = ohmState(state.ohm);
  },
  syncViews(state, computed, ctx) {
    const circuit = ctx.pool.circuit();
    circuit.setVisible(true);
    ctx.grid.visible = false;
  },
  afterFrame(dt, state, computed, ctx) {
    if (computed.ohm) ctx.pool.circuit().update(dt, circuitConfig(state, computed));
  },
  law: () => [String.raw`I = \dfrac{dq}{dt} \qquad V = IR \qquad R = \dfrac{\rho L}{A}`],
  liveRows(state, computed) {
    const o = computed.ohm;
    if (!o) return '';
    return [
      kv('Material', o.mat.name),
      kv(String.raw`$\rho(T)$`, `${sciHTML(o.rho)} Ω·m`),
      kv(String.raw`$R = \rho L/A$`, fmtR(o.Rgeo)),
      kv(String.raw`$R$ used`, fmtR(o.R)),
      kv(String.raw`$I = V/R$`, fmtI(o.I)),
      kv(String.raw`$J = I/A$`, `${sciHTML(o.J)} A/m²`),
      kv(String.raw`$v_d = J/(nq)$`, `${o.vd.toExponential(2)} m/s`),
      kv(String.raw`$E$ in the wire`, fmtE(o.E)),
      kv(String.raw`$P = IV$`, fmtP(o.P)),
      kv(String.raw`electrons per second`, sciHTML(o.Ne_per_s, 2)),
    ].join('');
  },
  readout(state, computed) {
    const o = computed.ohm;
    if (!o) return '';
    return cells([
      [String.raw`$R$`, fmtR(o.R), ''],
      [String.raw`$I$`, fmtI(o.I), ''],
      [String.raw`$v_d$`, `${o.vd.toExponential(1)} m/s`, ''],
      [String.raw`$P$`, fmtP(o.P), ''],
    ]);
  },
  coach: (state, computed) => coachOhm(state, computed),
});
