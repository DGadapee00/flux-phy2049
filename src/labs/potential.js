import * as THREE from 'three';
import { defineLab } from './define.js';
import { CHARGE_HTML, bindCharges, renderChargeList } from './charges-ui.js';
import { SCENARIOS } from '../data/scenarios.js';
import { fieldAt, contributionsAt, forceOn } from '../physics/field.js';
import { potentialAt, potentialContributions, potentialEnergy, workByField, gradientCheck } from '../physics/potential.js';
import { coachPotential } from '../physics/coach.js';
import { fmtV, fmtE, fmtEnergy, fmtCharge } from '../ui/format.js';
import { kv, cells } from '../ui/shared.js';
import { UNITS_PER_METER } from '../physics/constants.js';

export default defineLab({
  id: 'potential',
  exam: 'e3',
  title: 'Potential',
  hint: 'Click probe (B) · Shift-click sets A',
  orbit: true,
  probe: true,
  camera: { pos: new THREE.Vector3(5.6, 5.2, 9.8), target: new THREE.Vector3(0, 0, 0) },
  keys: { '+': 'add+', '=': 'add+', '-': 'add-', Delete: 'delete', Backspace: 'delete', r: 'reset', R: 'reset' },
  toggles: [
    { key: 'lines', label: 'Field lines' },
    { key: 'equipot', label: 'Equipotentials' },
  ],
  legend: { id: 'V', title: 'Potential V', low: 'low', high: 'high', barClass: 'legend-v' },
  scenarios: SCENARIOS.potential,
  defaultState() {
    return {
      scenarioId: 'v-plus',
      charges: [],
      extraE: { x: 0, y: 0, z: 0 },
      show: { flux: false, E: true, nHat: false, lines: true, forces: false, equipot: true },
      probe: { x: 0.5, y: 0, z: 0 },
      pathA: { x: 1, y: 0, z: 0 },
      qTest: 1e-6,
      selectedId: null,
      anim: { playing: false, i: 0 },
    };
  },
  controls() {
    return `
        ${CHARGE_HTML}
        <div class="lab-block">
          <label class="field">
            <span>Test charge q (for PE)</span>
            <div class="slider-row">
              <input type="range" id="q-test" min="-5" max="5" step="0.1" value="1" />
              <span class="mono val" id="q-test-val">+1.00 μC</span>
            </div>
          </label>
          <p class="tiny">Click empty space to move the probe (point B). Path A is the gold marker — ΔV and W use A → probe.</p>
        </div>`;
  },
  bind(api) {
    bindCharges(api);
    document.getElementById('q-test')?.addEventListener('input', (e) => {
      api.slice().qTest = Number(e.target.value) * 1e-6;
      api.bump(false);
    });
  },
  syncControls(state) {
    renderChargeList(state);
    const q = document.getElementById('q-test');
    if (q && state.qTest != null) {
      q.value = state.qTest * 1e6;
      document.getElementById('q-test-val').textContent = fmtCharge(state.qTest);
    }
  },
  recompute(state, computed) {
    computed.probeE = fieldAt(state.probe, state.charges, state.extraE);
    computed.contrib = contributionsAt(state.probe, state.charges, state.extraE);
    computed.V = potentialAt(state.probe, state.charges, state.extraE);
    computed.VA = potentialAt(state.pathA, state.charges, state.extraE);
    computed.PE = potentialEnergy(state.qTest, computed.V);
    computed.Wfield = workByField(state.qTest, computed.VA, computed.V);
    computed.grad = gradientCheck(state.probe, state.charges, state.extraE);
    computed.Vcontrib = potentialContributions(state.probe, state.charges, state.extraE);
    const xs = [];
    const Vs = [];
    for (let i = 0; i <= 40; i++) {
      const x = -1 + i * 0.05;
      xs.push(x);
      Vs.push(potentialAt({ x, y: state.probe.y, z: state.probe.z }, state.charges, state.extraE));
    }
    computed.Vx = { xs, Vs };
    const idx = state.charges.findIndex((c) => c.id === state.selectedId);
    computed.selectedForce = idx >= 0 && state.charges.length >= 2 ? forceOn(idx, state.charges) : null;
  },
  syncViews(state, computed, ctx) {
    const pool = ctx.pool;
    const charges = pool.charges();
    const probe = pool.probe();
    const lines = pool.lines();
    const equipot = pool.equipot();
    const pathA = pool.pathA();
    charges.setVisible(true);
    probe.setVisible(true);
    pathA.visible = true;
    charges.sync(state.charges, state.selectedId);
    probe.sync(state.probe, computed.probeE, `V = ${fmtV(computed.V)}`);
    lines.setVisible(!!state.show.lines);
    if (state.show.lines) lines.rebuild(state.charges, state.extraE);
    const eqOn = !!state.show.equipot;
    equipot.setVisible(eqOn);
    if (eqOn) equipot.rebuild(state.charges, state.extraE);
    const u = UNITS_PER_METER;
    pathA.position.set(state.pathA.x * u, state.pathA.y * u, state.pathA.z * u);
    ctx.grid.visible = true;
  },
  law: () => [String.raw`V = \dfrac{kq}{r} \qquad \Delta PE_E = q\,\Delta V`, String.raw`E_x = -\dfrac{dV}{dx}`],
  liveRows(state, computed) {
    const V = computed.V ?? 0;
    const VA = computed.VA ?? 0;
    const PE = computed.PE ?? 0;
    const W = computed.Wfield ?? 0;
    const g = computed.grad;
    const rows = [
      kv('V at probe (B)', fmtV(V)),
      kv('V at A', fmtV(VA)),
      kv('ΔV = V<sub>B</sub> − V<sub>A</sub>', fmtV(V - VA)),
      kv('PE<sub>E</sub> = q V', fmtEnergy(PE)),
      kv('W<sub>field</sub> A→B', fmtEnergy(W)),
    ];
    if (g) {
      rows.push(kv('E<sub>x</sub>', fmtE(g.Ex)));
      rows.push(kv('−dV/dx', fmtE(g.negdVdx)));
    }
    for (const row of computed.Vcontrib || []) {
      const name = row.id === 'uniform' ? 'uniform' : fmtCharge(row.q);
      rows.push(kv(name, fmtV(row.V)));
    }
    return rows.join('');
  },
  readout(state, computed) {
    const V = computed.V ?? 0;
    const VA = computed.VA ?? 0;
    return cells([
      ['V (probe)', fmtV(V), ''],
      ['PE_E', fmtEnergy(computed.PE ?? 0), ''],
      ['ΔV (A→B)', fmtV(V - VA), ''],
      ['W_field', fmtEnergy(computed.Wfield ?? 0), ''],
    ]);
  },
  plot(state, computed) {
    if (!computed.Vx) return null;
    return { type: 'Vx', xs: computed.Vx.xs, Vs: computed.Vx.Vs, xProbe: state.probe.x, xA: state.pathA?.x };
  },
  coach: (state, computed) => coachPotential(state, computed),
});
