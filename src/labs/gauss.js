import * as THREE from 'three';
import { defineLab } from './define.js';
import { CHARGE_HTML, bindCharges, renderChargeList } from './charges-ui.js';
import { SCENARIOS } from '../data/scenarios.js';
import { computeGauss } from '../physics/flux.js';
import { coachGauss } from '../physics/coach.js';
import { isClosed } from '../physics/surfaces.js';
import { fmtPhi, fmtCharge, fmtE } from '../ui/format.js';
import { kv, cells, matchClass } from '../ui/shared.js';

export default defineLab({
  id: 'gauss',
  exam: 'e2',
  title: 'Gauss',
  hint: 'Drag a charge through the surface',
  orbit: true,
  live: false,
  camera: { pos: new THREE.Vector3(7.2, 4.8, 11.4), target: new THREE.Vector3(0, 0, 0) },
  keys: { ' ': 'sweep', '+': 'add+', '=': 'add+', '-': 'add-', Delete: 'delete', Backspace: 'delete', r: 'reset', R: 'reset' },
  toggles: [
    { key: 'flux', label: 'Flux color' },
    { key: 'E', label: 'E arrows' },
    { key: 'nHat', label: 'n̂' },
    { key: 'lines', label: 'Field lines' },
    { key: 'forces', label: 'Forces' },
  ],
  legend: { id: 'flux', title: 'E · n̂', low: 'inward (−)', high: 'outward (+)' },
  scenarios: SCENARIOS.gauss,
  defaultState() {
    return {
      scenarioId: 'center',
      charges: [],
      surface: { type: 'sphere', R: 0.45, L: 0.55, tilt: 0, origin: { x: 0, y: 0, z: 0 } },
      extraE: { x: 0, y: 0, z: 0 },
      show: { flux: true, E: false, nHat: false, lines: false, forces: false, equipot: true },
      probe: { x: 0.5, y: 0.18, z: 0 },
      selectedId: null,
      anim: { playing: false, i: 0 },
    };
  },
  controls() {
    return `
        <div class="lab-block">
          <div class="row wrap">
            <span class="mini-label">Gaussian surface</span>
            <div class="seg" id="surface-type">
              <button type="button" data-type="sphere" class="active">Sphere</button>
              <button type="button" data-type="cylinder">Cylinder</button>
              <button type="button" data-type="cube">Cube</button>
              <button type="button" data-type="pillbox">Pillbox</button>
              <button type="button" data-type="square">Square</button>
            </div>
          </div>
          <label class="field">
            <span id="r-label">Radius R</span>
            <div class="slider-row">
              <input type="range" id="surf-R" min="0.18" max="0.9" step="0.01" value="0.45" />
              <span class="mono val" id="surf-R-val">0.45 m</span>
            </div>
          </label>
          <label class="field" id="wrap-L">
            <span>Length L</span>
            <div class="slider-row">
              <input type="range" id="surf-L" min="0.12" max="1.2" step="0.01" value="0.55" />
              <span class="mono val" id="surf-L-val">0.55 m</span>
            </div>
          </label>
          <label class="field" id="wrap-tilt">
            <span>Tilt θ of n̂</span>
            <div class="slider-row">
              <input type="range" id="surf-tilt" min="0" max="1.57" step="0.01" value="0" />
              <span class="mono val" id="surf-tilt-val">0°</span>
            </div>
          </label>
          <button type="button" class="btn accent" id="btn-sweep">Play ∮ E · dA</button>
        </div>
        ${CHARGE_HTML}`;
  },
  bind(api) {
    const $ = (id) => document.getElementById(id);
    $('surface-type').addEventListener('click', (e) => {
      const btn = e.target.closest('[data-type]');
      if (!btn) return;
      const type = btn.dataset.type;
      const s = api.slice();
      s.surface.type = type;
      if (type === 'pillbox' && s.surface.L > 0.35) s.surface.L = 0.18;
      if (type === 'cylinder' && s.surface.L < 0.3) s.surface.L = 0.55;
      api.bump();
    });
    $('surf-R').addEventListener('input', (e) => {
      api.slice().surface.R = Number(e.target.value);
      api.bump();
    });
    $('surf-L').addEventListener('input', (e) => {
      api.slice().surface.L = Number(e.target.value);
      api.bump();
    });
    $('surf-tilt').addEventListener('input', (e) => {
      api.slice().surface.tilt = Number(e.target.value);
      api.bump();
    });
    $('btn-sweep').addEventListener('click', () => api.toggleSweep());
    bindCharges(api);
  },
  syncControls(state) {
    const $ = (id) => document.getElementById(id);
    const t = state.surface.type;
    document.querySelectorAll('#surface-type [data-type]').forEach((b) => {
      b.classList.toggle('active', b.dataset.type === t);
    });
    if ($('wrap-L')) $('wrap-L').hidden = !(t === 'cylinder' || t === 'pillbox');
    if ($('wrap-tilt')) $('wrap-tilt').hidden = t !== 'square';
    if ($('r-label')) $('r-label').textContent = t === 'cube' || t === 'square' ? 'Half-side a' : 'Radius R';
    if ($('surf-R')) {
      $('surf-R').value = state.surface.R;
      $('surf-R-val').textContent = `${state.surface.R.toFixed(2)} m`;
    }
    if ($('surf-L')) {
      $('surf-L').value = state.surface.L;
      $('surf-L-val').textContent = `${state.surface.L.toFixed(2)} m`;
    }
    if ($('surf-tilt')) {
      $('surf-tilt').value = state.surface.tilt;
      $('surf-tilt-val').textContent = `${((state.surface.tilt * 180) / Math.PI).toFixed(0)}°`;
    }
    if ($('btn-sweep')) $('btn-sweep').textContent = state.anim.playing ? 'Stop integral' : 'Play ∮ E · dA';
    renderChargeList(state, { gauss: true });
  },
  recompute(state, computed) {
    const g = computeGauss(state.surface, state.charges, state.extraE);
    if (state.anim.playing) {
      const i = Math.min(g.samples.length, Math.floor(state.anim.i));
      let acc = 0;
      for (let k = 0; k < i; k++) acc += g.samples[k].dPhi;
      g.runningPhi = acc;
    } else {
      g.runningPhi = g.Phi;
    }
    computed.gauss = g;
    computed.nIn = g.nIn;
    computed.nOut = g.nOut;
    computed.nOn = g.nOn;
    computed.Qin = g.Qin;
  },
  syncViews(state, computed, ctx) {
    const pool = ctx.pool;
    const charges = pool.charges();
    const patches = pool.patches();
    const arrows = pool.arrows();
    const lines = pool.lines();
    const forces = pool.forces();
    charges.setVisible(true);
    patches.setVisible(true);
    arrows.setVisible(true);
    charges.sync(state.charges, state.selectedId);
    if (computed.gauss) {
      patches.syncWire(state.surface);
      patches.sync(computed.gauss.patches, computed.gauss.samples, state.anim, state.show.flux);
      arrows.sync(computed.gauss.patches, computed.gauss.samples, state.show.E, state.show.nHat);
    }
    lines.setVisible(!!state.show.lines);
    if (state.show.lines) lines.rebuild(state.charges, state.extraE);
    const forceOn = !!state.show.forces;
    forces.setVisible(forceOn);
    if (forceOn) forces.rebuild(state.charges, state.selectedId);
    ctx.grid.visible = true;
  },
  tick(dt, state, computed) {
    if (!state.anim.playing) return false;
    const nMax = computed.gauss?.patches.length || 800;
    state.anim.i += dt * 380;
    if (state.anim.i >= nMax) {
      state.anim.i = nMax;
      state.anim.playing = false;
    }
    return true;
  },
  law(state, computed) {
    const closed = computed.gauss?.closed ?? isClosed(state.surface.type);
    return closed
      ? [String.raw`\Phi_E = \oint \vec{E}\cdot\hat{n}\,dA = \dfrac{Q_{\text{in}}}{\varepsilon_0}`]
      : [String.raw`\Phi_E = \vec{E}\cdot\vec{A} = |\vec{E}|\,A\cos\theta`];
  },
  liveRows(state, computed) {
    const g = computed.gauss;
    const coach = computed.coach || {};
    const closed = g?.closed;
    const PhiShow = state.anim.playing && g ? g.runningPhi : g?.Phi;
    const rows = [];
    if (!g) return '';
    rows.push(kv('Numerical Σ E·ΔA', fmtPhi(PhiShow)));
    if (closed) {
      rows.push(kv('Q<sub>in</sub>/ε<sub>0</sub>', fmtPhi(g.PhiG)));
      rows.push(kv('Match', `<span class="${matchClass(g.match.pct)}">${g.match.pct.toFixed(1)}%</span>`));
      rows.push(kv('Q<sub>in</sub>', fmtCharge(g.Qin)));
    } else {
      const A = g.area;
      const ca = Math.cos(state.surface.tilt || 0);
      const E = Math.hypot(state.extraE.x, state.extraE.y, state.extraE.z);
      rows.push(kv('|E| A cosθ', fmtPhi(E * A * ca)));
      rows.push(kv('A', `${A.toFixed(3)} m²`));
      rows.push(kv('cosθ', ca.toFixed(3)));
    }
    if (g.PhiWall || g.PhiCap) {
      rows.push(kv('Φ_wall', fmtPhi(g.PhiWall)));
      rows.push(kv('Φ_caps', fmtPhi(g.PhiCap)));
    }
    if (coach.canFindE && coach.Eguess != null) rows.push(kv('|E| from Gauss', fmtE(coach.Eguess)));
    if (coach.formula) rows.push(kv('Use', coach.formula));
    return rows.join('');
  },
  readout(state, computed) {
    const g = computed.gauss;
    if (!g) return '';
    const closed = g.closed;
    const PhiShow = state.anim.playing ? g.runningPhi : g.Phi;
    return cells([
      ['Φ numerical', fmtPhi(PhiShow), ''],
      [
        closed ? 'Q_in / ε₀' : '|E|A cosθ',
        closed
          ? fmtPhi(g.PhiG)
          : fmtPhi(Math.hypot(state.extraE.x, state.extraE.y, state.extraE.z) * g.area * Math.cos(state.surface.tilt || 0)),
        '',
      ],
      [closed ? 'Match' : 'Tiles', closed ? `${g.match.pct.toFixed(1)}%` : `${g.samples.length} dA`, closed ? matchClass(g.match.pct) : ''],
      ['Enclosed', closed ? `${fmtCharge(g.Qin)} · ${g.nIn} in / ${g.nOut} out` : 'open surface', ''],
    ]);
  },
  coach(state, computed) {
    return coachGauss(state.surface, state.charges, state.extraE, computed);
  },
});
