import * as THREE from 'three';
import { defineLab } from './define.js';
import {
  GASES, gasById, P_ATM, paschen, paschenMin, paschenCurve, strengthVolts,
  sparkCheck, spherePotential, chargeForPotential, sphereCapacitance, sparkEnergy, sphereSurfaceField,
} from '../physics/breakdown.js';
import { SparkView } from '../scene/spark.js';
import { fmtCharge } from '../ui/format.js';
import { kv, cells, eq, matchClass } from '../ui/shared.js';

const SCENARIOS = [
  { id: 'doorknob', name: 'Doorknob spark — you, charged, reaching for metal', R: 0.35, V: 18000, d: 0.004, p: P_ATM, gas: 'air' },
  { id: 'nospark', name: 'Same charge, hand further away', R: 0.35, V: 18000, d: 0.02, p: P_ATM, gas: 'air' },
  { id: 'minimum', name: 'At the Paschen minimum — the easiest gap to break', R: 0.35, V: 400, d: 1.1e-5, p: P_ATM, gas: 'air' },
  // Left of the minimum on purpose: p·d = 0.5 Pa·m against air's easiest point at 1.115, so this
  // gap holds 500 V — and *widening* it makes it break down, which is the whole point.
  { id: 'vacuum', name: 'Thin air — where a wider gap breaks down more easily', R: 0.35, V: 500, d: 0.02, p: 25, gas: 'air' },
  { id: 'neon', name: 'Low-pressure tube (helium)', R: 0.2, V: 600, d: 0.05, p: 400, gas: 'he' },
];

const fmtV = (v) => (!Number.isFinite(v) ? '—' : Math.abs(v) >= 1e6 ? `${(v / 1e6).toFixed(2)} MV` : Math.abs(v) >= 1e3 ? `${(v / 1e3).toFixed(2)} kV` : `${v.toFixed(0)} V`);
const fmtEf = (e) => (Math.abs(e) >= 1e6 ? `${(e / 1e6).toFixed(2)} MV/m` : `${(e / 1e3).toFixed(1)} kV/m`);
const fmtGap = (d) => (d < 1e-3 ? `${(d * 1e6).toFixed(1)} µm` : d < 1 ? `${(d * 1e3).toFixed(2)} mm` : `${d.toFixed(2)} m`);
const fmtP = (p) => (p >= 1000 ? `${(p / 1000).toFixed(1)} kPa (${(p / P_ATM).toFixed(2)} atm)` : `${p.toFixed(0)} Pa`);
const fmtU = (u) => (u >= 1 ? `${u.toFixed(2)} J` : u >= 1e-3 ? `${(u * 1e3).toFixed(2)} mJ` : `${(u * 1e6).toFixed(1)} µJ`);

export default defineLab({
  id: 'breakdown',
  exam: 'e3',
  title: 'Breakdown',
  hint: 'Raise V or close the gap until the air lets go',
  orbit: true,
  camera: { pos: new THREE.Vector3(0.6, 3.4, 8.6), target: new THREE.Vector3(0, 0, 0) },
  keys: { r: 'reset', R: 'reset' },
  scenarios: SCENARIOS,
  defaultState() {
    return { scenarioId: 'doorknob', bd: { R: 0.35, V: 18000, d: 0.004, p: P_ATM, gas: 'air' }, charges: [], show: {} };
  },
  applyScenario(id, state) {
    const sc = SCENARIOS.find((s) => s.id === id) || SCENARIOS[0];
    state.scenarioId = sc.id;
    state.bd = { R: sc.R, V: sc.V, d: sc.d, p: sc.p, gas: sc.gas };
  },
  controls() {
    return `
        <div class="lab-block">
          <label class="field">
            <span>Potential of the body V</span>
            <div class="slider-row">
              <input type="range" id="bd-V" min="100" max="60000" step="100" value="18000" />
              <span class="mono val" id="bd-V-val">18.00 kV</span>
            </div>
          </label>
          <label class="field">
            <span>Gap d</span>
            <div class="slider-row">
              <input type="range" id="bd-d" min="-5.3" max="-1.4" step="0.01" value="-2.4" />
              <span class="mono val" id="bd-d-val">4.00 mm</span>
            </div>
          </label>
          <label class="field">
            <span>Pressure p</span>
            <div class="slider-row">
              <input type="range" id="bd-p" min="0" max="5.3" step="0.01" value="5.006" />
              <span class="mono val" id="bd-p-val">101 kPa</span>
            </div>
          </label>
          <label class="field">
            <span>Body radius R</span>
            <div class="slider-row">
              <input type="range" id="bd-R" min="0.05" max="0.6" step="0.01" value="0.35" />
              <span class="mono val" id="bd-R-val">0.35 m</span>
            </div>
          </label>
          <label class="field">
            <span>Gas</span>
            <select id="bd-gas"></select>
          </label>
          <p class="tiny">The gap and the pressure are on log sliders — the interesting physics covers four decades of p·d. Charging is stipulated, not modelled: rubbing is not something with an equation behind it, so V is a slider rather than an animation.</p>
        </div>`;
  },
  bind(api) {
    const $ = (id) => document.getElementById(id);
    $('bd-gas').innerHTML = GASES.map((g) => `<option value="${g.id}">${g.name}</option>`).join('');
    $('bd-V').addEventListener('input', (e) => { api.slice().bd.V = Number(e.target.value); api.bump(); });
    $('bd-d').addEventListener('input', (e) => { api.slice().bd.d = 10 ** Number(e.target.value); api.bump(); });
    $('bd-p').addEventListener('input', (e) => { api.slice().bd.p = 10 ** Number(e.target.value); api.bump(); });
    $('bd-R').addEventListener('input', (e) => { api.slice().bd.R = Number(e.target.value); api.bump(); });
    $('bd-gas').addEventListener('change', (e) => { api.slice().bd.gas = e.target.value; api.bump(); });
  },
  syncControls(state) {
    const $ = (id) => document.getElementById(id);
    const b = state.bd;
    $('bd-V').value = b.V;
    $('bd-V-val').textContent = fmtV(b.V);
    $('bd-d').value = Math.log10(b.d);
    $('bd-d-val').textContent = fmtGap(b.d);
    $('bd-p').value = Math.log10(b.p);
    $('bd-p-val').textContent = fmtP(b.p);
    $('bd-R').value = b.R;
    $('bd-R-val').textContent = `${b.R.toFixed(2)} m`;
    $('bd-gas').value = b.gas;
  },
  init(ctx) {
    return { view: new SparkView(ctx.scene) };
  },
  enter(ctx, handle) {
    handle.view.setVisible(true);
    ctx.grid.visible = false;
  },
  exit(ctx, handle) {
    handle.view.setVisible(false);
    ctx.grid.visible = true;
  },
  recompute(state, computed) {
    const b = state.bd;
    const gas = gasById(b.gas);
    const chk = sparkCheck({ V: b.V, d: b.d, p: b.p, gas });
    const Q = chargeForPotential(b.V, b.R);
    const C = sphereCapacitance(b.R);
    computed.bd = {
      ...chk,
      gas,
      Q,
      C,
      U: sparkEnergy(C, b.V),
      Esurf: sphereSurfaceField(Q, b.R),
      pd: b.p * b.d,
      min: paschenMin(gas),
      curve: paschenCurve(gas),
    };
  },
  syncViews(state, computed, ctx) {
    const r = computed.bd;
    // The gap spans five decades on its slider and the body barely changes, so the drawn gap is
    // log-mapped into a band that stays visible at both ends. Every number on screen is the real
    // one; only the picture is stretched.
    const lg = Math.log10(state.bd.d);
    const f = Math.min(1, Math.max(0, (lg - Math.log10(5e-6)) / (Math.log10(0.05) - Math.log10(5e-6))));
    ctx.handle.view.sync({
      r: 1.05,
      g: 0.22 + 2.1 * f,
      sparks: r.sparksPaschen,
      heat: Math.max(0, 1 + r.margin),
      t: ctx.clock.getElapsedTime(),
    });
  },
  tick: () => true,
  law(state) {
    const g = gasById(state.bd.gas).name;
    return [
      String.raw`V_b = \dfrac{B\,pd}{\ln(A\,pd) - \ln\!\left[\ln\!\left(1 + \frac{1}{\gamma}\right)\right]} \quad\text{(${g})}`,
      String.raw`\text{or the shop rule } \; V_b = E_{\text{DS}}\,d, \quad E_{\text{DS}} = 3\ \text{MV/m}`,
    ];
  },
  liveRows(state, computed) {
    const r = computed.bd;
    if (!r) return '';
    const pct = Math.max(0, 100 * (1 - Math.abs(r.Vpaschen - r.Vstrength) / Math.max(r.Vpaschen, r.Vstrength)));
    // Six rows, not nine: the plot below has to stay on screen, and the minimum it marks is the
    // yellow dot on the curve rather than another line of text.
    return [
      kv(String.raw`$p\,d$`, `${r.pd.toPrecision(3)} Pa·m`),
      kv(String.raw`$V_b$ (Paschen)`, fmtV(r.Vpaschen)),
      kv(String.raw`$V_b$ (3 MV/m rule)`, fmtV(r.Vstrength)),
      kv('The two agree to', `<span class="${matchClass(pct)}">${pct.toFixed(0)}%</span>`),
      kv(String.raw`$Q,\ C$ of the body`, `${fmtCharge(r.Q)} · ${(r.C * 1e12).toFixed(1)} pF`),
      // The energy is already in the readout; this row is the plot's yellow dot as a number, and
      // nothing else on screen reports it.
      kv('Easiest gap for this gas', `${fmtV(r.min.V)} at ${r.min.pd.toPrecision(3)} Pa·m`),
    ].join('');
  },
  readout(state, computed) {
    const r = computed.bd;
    if (!r) return '';
    return cells([
      [String.raw`$E$ in the gap`, fmtEf(r.E), r.sparksPaschen ? 'bad' : ''],
      [String.raw`$V_b$ needed`, fmtV(r.Vpaschen), ''],
      ['Spark', r.sparksPaschen ? 'YES' : 'no', r.sparksPaschen ? 'bad' : 'ok'],
      ['Energy released', r.sparksPaschen ? fmtU(r.U) : '—', ''],
    ]);
  },
  plot(state, computed) {
    const r = computed.bd;
    return r ? { type: 'paschen', curve: r.curve, pd: r.pd, V: state.bd.V, min: r.min, sparks: r.sparksPaschen } : null;
  },
  coach(state, computed) {
    const r = computed.bd;
    if (!r) return { title: 'Breakdown', body: [] };
    const belowMin = r.pd < r.min.pd;
    if (r.sparksPaschen) {
      return {
        title: 'It lets go',
        body: [
          String.raw`${fmtV(state.bd.V)} across ${fmtGap(state.bd.d)} is past what this gap holds (${fmtV(r.Vpaschen)}). One free electron ionises what it hits, those do the same, and the avalanche shorts the gap.`,
          eq(String.raw`U = \tfrac12 CV^2 = ${fmtU(r.U)}`),
          String.raw`It stings because that arrives in nanoseconds, not because it is large.`,
        ],
        canFindE: true,
      };
    }
    if (belowMin) {
      return {
        title: 'Left of the minimum — thin air holds off',
        body: [
          String.raw`$p\,d$ is ${r.pd.toPrecision(3)} Pa·m, left of this gas's easiest point at ${r.min.pd.toPrecision(3)}. So little gas is in the gap that an electron crosses without hitting much, and no avalanche builds however hard you pull.`,
          String.raw`Widen the gap from here and it breaks down more easily — the opposite of the 3 MV/m rule, and why vacuum insulates.`,
        ],
        canFindE: true,
      };
    }
    return {
      title: 'The gap holds',
      body: [
        String.raw`${fmtV(state.bd.V)} across ${fmtGap(state.bd.d)} needs ${fmtV(r.Vpaschen)}, so nothing happens. Raise $V$ or close the gap and watch the point climb onto the curve.`,
        String.raw`The two rules above differ by ${(100 * Math.abs(r.Vpaschen - r.Vstrength) / Math.max(r.Vpaschen, r.Vstrength)).toFixed(0)}% here. Neither is wrong; they are fitted in different places.`,
      ],
      canFindE: true,
    };
  },
});
