import * as THREE from 'three';
import { defineLab } from './define.js';
import { SCENARIOS } from '../data/scenarios.js';
import { powerState } from '../physics/circuit.js';
import { coachPower } from '../physics/coach.js';
import { fmtV, fmtI, fmtP, fmtR } from '../ui/format.js';
import { kv, cells, tex, qv } from '../ui/shared.js';

function circuitConfig(state, computed) {
  const p = computed.power;
  const pw = state.power;
  const load = pw.load || 'bulb';
  const ac = pw.mode === 'ac';
  const Vnom = ac ? pw.Vrms : pw.V;
  const loadName = load === 'bulb' ? `${Math.round((Vnom * Vnom) / pw.R)} W bulb` : 'Space heater';
  return ac
    ? { eq: 'power', source: 'ac', load, loadName, V: p.V, I: p.I, R: pw.R, P: p.Pinst, Ip: p.Ip, Vrms: pw.Vrms, Pavg: p.Pavg, f: pw.f, phase: p.omega * computed.t }
    : { eq: 'power', source: 'dc', load, loadName, V: p.V, I: p.I, R: pw.R, P: p.P };
}

export default defineLab({
  id: 'power',
  exam: 'e3',
  title: 'Power',
  hint: 'Toggle AC to see rms vs peak',
  live: true,
  orbit: false,
  camera: { pos: new THREE.Vector3(0, 0.35, 12), target: new THREE.Vector3(0, 0.35, 0) },
  keys: { r: 'reset', R: 'reset' },
  scenarios: SCENARIOS.power,
  defaultState() {
    return {
      scenarioId: 'pwr-60',
      power: { mode: 'dc', V: 120, Vrms: 120, R: 240, f: 60 },
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
          <div class="seg" id="pwr-mode">
            <button type="button" data-mode="dc" class="active">DC</button>
            <button type="button" data-mode="ac">AC</button>
          </div>
          <label class="field">
            <span id="pwr-V-label">Voltage V</span>
            <div class="slider-row">
              <input type="range" id="pwr-V" min="1" max="240" step="1" value="120" />
              <span class="mono val" id="pwr-V-val">120 V</span>
            </div>
          </label>
          <label class="field">
            <span>Resistance R</span>
            <div class="slider-row">
              <input type="range" id="pwr-R" min="1" max="400" step="1" value="240" />
              <span class="mono val" id="pwr-R-val">240 Ω</span>
            </div>
          </label>
          <label class="field" id="wrap-pwr-f">
            <span>Frequency f</span>
            <div class="slider-row">
              <input type="range" id="pwr-f" min="10" max="120" step="1" value="60" />
              <span class="mono val" id="pwr-f-val">60 Hz</span>
            </div>
          </label>
        </div>`;
  },
  bind(api) {
    const $ = (id) => document.getElementById(id);
    $('pwr-mode').addEventListener('click', (e) => {
      const btn = e.target.closest('[data-mode]');
      if (!btn) return;
      api.slice().power.mode = btn.dataset.mode;
      api.bump();
    });
    $('pwr-V').addEventListener('input', (e) => {
      const v = Number(e.target.value);
      api.slice().power.V = v;
      api.slice().power.Vrms = v;
      api.bump();
    });
    $('pwr-R').addEventListener('input', (e) => {
      api.slice().power.R = Number(e.target.value);
      api.bump();
    });
    $('pwr-f').addEventListener('input', (e) => {
      api.slice().power.f = Number(e.target.value);
      api.bump();
    });
  },
  syncControls(state) {
    const $ = (id) => document.getElementById(id);
    document.querySelectorAll('#pwr-mode [data-mode]').forEach((b) => {
      b.classList.toggle('active', b.dataset.mode === state.power.mode);
    });
    $('pwr-V').value = state.power.mode === 'ac' ? state.power.Vrms : state.power.V;
    $('pwr-V-label').textContent = state.power.mode === 'ac' ? 'V_rms' : 'Voltage V';
    $('pwr-V-val').textContent = fmtV(state.power.mode === 'ac' ? state.power.Vrms : state.power.V);
    $('pwr-R').value = state.power.R;
    $('pwr-R-val').textContent = fmtR(state.power.R);
    $('pwr-f').value = state.power.f;
    $('pwr-f-val').textContent = `${state.power.f} Hz`;
    $('wrap-pwr-f').hidden = state.power.mode !== 'ac';
  },
  recompute(state, computed, ctx) {
    computed.t = ctx.clock.elapsedTime / (2 * state.power.f);
    computed.power = powerState(state.power, computed.t);
  },
  syncViews(state, computed, ctx) {
    ctx.pool.circuit().setVisible(true);
    ctx.grid.visible = false;
  },
  afterFrame(dt, state, computed, ctx) {
    if (computed.power) ctx.pool.circuit().update(dt, circuitConfig(state, computed));
  },
  law(state) {
    const ac = state.power.mode === 'ac';
    return ac
      ? [
          String.raw`\qP_{\text{avg}} = \tfrac{1}{2} \qI_p \qV_p = \qI_{\text{rms}} \qV_{\text{rms}}`,
          String.raw`\qI_{\text{rms}} = \dfrac{\qI_p}{\sqrt{2}} \qquad \qV_p = \sqrt{2}\,\qV_{\text{rms}}`,
        ]
      : [String.raw`\qP = \qI\qV = \qI^2 \qR = \dfrac{\qV^2}{\qR}`];
  },
  liveRows(state, computed) {
    const p = computed.power;
    const ac = state.power.mode === 'ac';
    if (!p) return '';
    if (ac) {
      return [
        kv(tex(String.raw`\qV_{\text{rms}}`), qv('qV', fmtV(state.power.Vrms))),
        kv(tex(String.raw`\qV_p = \sqrt{2}\,\qV_{\text{rms}}`), qv('qV', fmtV(p.Vp))),
        kv(tex(String.raw`\qI_p = \qV_p/\qR`), qv('qI', fmtI(p.Ip))),
        kv(tex(String.raw`\qI_{\text{rms}} = \qI_p/\sqrt{2}`), qv('qI', fmtI(p.Irms))),
        kv(tex(String.raw`\qV(t)`), qv('qV', fmtV(p.V))),
        kv(tex(String.raw`\qI(t)`), qv('qI', fmtI(p.I))),
        kv(tex(String.raw`\qP(t) = \qI(t)\,\qV(t)`), qv('qP', fmtP(p.Pinst))),
        kv(tex(String.raw`\qP_{\text{avg}}`), qv('qP', fmtP(p.Pavg))),
      ].join('');
    }
    return [
      kv(tex(String.raw`\qV`), qv('qV', fmtV(p.V))),
      kv(tex(String.raw`\qR`), qv('qR', fmtR(state.power.R))),
      kv(tex(String.raw`\qI = \qV/\qR`), qv('qI', fmtI(p.I))),
      kv(tex(String.raw`\qP = \qI\qV`), qv('qP', fmtP(p.P_IV))),
      kv(tex(String.raw`\qP = \qI^2\qR`), qv('qP', fmtP(p.P_I2R))),
      kv(tex(String.raw`\qP = \qV^2/\qR`), qv('qP', fmtP(p.P_V2R))),
    ].join('');
  },
  readout(state, computed) {
    const p = computed.power;
    if (!p) return '';
    if (state.power.mode === 'ac') {
      return cells([
        ['V peak', fmtV(p.Vp), 'qV'],
        ['I rms', fmtI(p.Irms), 'qI'],
        ['P avg', fmtP(p.Pavg), 'qP'],
        ['P(t) now', fmtP(p.Pinst), 'qP'],
      ]);
    }
    return cells([
      ['Voltage', fmtV(p.V), 'qV'],
      ['Current', fmtI(p.I), 'qI'],
      ['Resistance', fmtR(state.power.R), 'qR'],
      ['Power', fmtP(p.P), 'qP'],
    ]);
  },
  plot(state, computed) {
    if (state.power.mode !== 'ac') return null;
    return { type: 'ac', power: state.power, t: computed.t || 0 };
  },
  coach: (state, computed) => coachPower(state, computed),
});
