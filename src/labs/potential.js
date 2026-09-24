import * as THREE from 'three';
import { defineLab, planeCamera } from './define.js';
import { CHARGE_HTML, bindCharges, renderChargeList } from './charges-ui.js';
import { SCENARIOS } from '../data/scenarios.js';
import { fieldAt, contributionsAt, forceOn } from '../physics/field.js';
import { potentialAt, potentialContributions, potentialEnergy, workByField, gradientCheck } from '../physics/potential.js';
import { coachPotential } from '../physics/coach.js';
import { fmtV, fmtE, fmtEnergy, fmtCharge } from '../ui/format.js';
import { kv, cells } from '../ui/shared.js';
import { sceneScale, softenFor, contourSoftenFor, stepFor, defaultView, GRID_HALF } from '../engine/frame.js';

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
  frame: true,
  cameraFor: (state) => planeCamera(state) || undefined,
  defaultState() {
    return {
      scenarioId: 'v-plus',
      view: defaultView(),
      charges: [],
      extraE: { x: 0, y: 0, z: 0 },
      show: { flux: false, E: true, nHat: false, lines: true, forces: false, equipot: true },
      probe: { x: 0.5, y: 0, z: 0 },
      pathA: { x: 1, y: 0, z: 0 },
      // Problem-named points; markShow picks their value lines: 'V', 'U' or 'VU'.
      marks: [],
      markShow: '',
      // A problem with no use for the path start hides it; shift-click brings it back.
      hideA: false,
      // A problem whose test charge is one of its named charges (q₃ …) draws the probe as it.
      probeName: '',
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
          <p class="tiny">Charge spread along a rod, a ring, an arc or a disk: the <a href="#/e3/integral">Integrals</a> tab adds up V = ∫ k dq/r piece by piece.</p>
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
    const soft = softenFor(state.view);
    computed.probeE = fieldAt(state.probe, state.charges, state.extraE, soft);
    computed.contrib = contributionsAt(state.probe, state.charges, state.extraE, soft);
    computed.V = potentialAt(state.probe, state.charges, state.extraE, soft);
    computed.VA = potentialAt(state.pathA, state.charges, state.extraE, soft);
    computed.PE = potentialEnergy(state.qTest, computed.V);
    computed.Wfield = workByField(state.qTest, computed.VA, computed.V);
    computed.grad = gradientCheck(state.probe, state.charges, state.extraE, stepFor(state.view), soft);
    computed.Vcontrib = potentialContributions(state.probe, state.charges, state.extraE, soft);
    computed.marks = (state.marks || []).map((m) => {
      const V = potentialAt(m, state.charges, state.extraE, soft);
      return { V, U: potentialEnergy(state.qTest, V) };
    });
    // V(x) across the visible width, so the plot follows the view instead of a fixed ±1 m.
    const half = state.view ? 5 / state.view.upm : 1;
    const xs = [];
    const Vs = [];
    for (let i = 0; i <= 40; i++) {
      const x = -half + (i * half) / 20;
      xs.push(x);
      Vs.push(potentialAt({ x, y: state.probe.y, z: state.probe.z }, state.charges, state.extraE, soft));
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
    const marks = pool.marks();
    charges.setVisible(true);
    probe.setVisible(true);
    pathA.visible = !state.hideA;
    charges.sync(state.charges, state.selectedId);
    probe.sync(state.probe, computed.probeE, `V = ${fmtV(computed.V)}`);
    if (state.probeName) {
      probe.setAsCharge(true);
      const tc = pool.testCharge();
      tc.setVisible(true);
      tc.sync([{ id: 'test', q: state.qTest, name: state.probeName, ...state.probe }], null);
    }
    lines.setVisible(!!state.show.lines);
    const soft = softenFor(state.view);
    if (state.show.lines) lines.rebuild(state.charges, state.extraE, soft);
    const eqOn = !!state.show.equipot;
    equipot.setVisible(eqOn);
    if (eqOn) {
      /*
       * Contour the work plane — the one the grid is drawn in and the charges are laid out in —
       * over the part of it that is on screen.
       *
       * The slice used to be taken at the probe's out-of-plane coordinate. The dipole scenario
       * starts its probe at y = 35 cm, an off-axis point of the midplane chosen to show that V = 0
       * across the whole plane and not merely at the midpoint, and that lifted the equipotentials
       * 35 cm clear of the charges: rings floating above the grid, drawn for a slice nothing else
       * in the scene was on.
       */
      const plane = state.view?.plane || 'xz';
      const half = (GRID_HALF - 1) / sceneScale();
      const at = 0;
      equipot.rebuild(state.charges, state.extraE, { plane, half, at, soften: contourSoftenFor(state.view) });
    }
    const u = sceneScale();
    pathA.position.set(state.pathA.x * u, state.pathA.y * u, state.pathA.z * u);
    const show = state.markShow || '';
    const markLines = (computed.marks || []).map(({ V, U }) => [
      show.includes('V') ? `V = ${fmtV(V)}` : '',
      show.includes('U') ? `U = ${fmtEnergy(U)}` : '',
    ].filter(Boolean));
    marks.setVisible(true);
    marks.sync(state.marks || [], u, markLines);
    ctx.grid.visible = true;
  },
  law: () => [String.raw`V = \dfrac{kq}{r} \qquad \Delta PE_E = q\,\Delta V`, String.raw`E_x = -\dfrac{dV}{dx}`],
  liveRows(state, computed) {
    const V = computed.V ?? 0;
    const VA = computed.VA ?? 0;
    const PE = computed.PE ?? 0;
    const W = computed.Wfield ?? 0;
    const g = computed.grad;
    const rows = state.hideA
      ? [kv(String.raw`$V$ at the probe`, fmtV(V)), kv(String.raw`$PE_E = qV$`, fmtEnergy(PE))]
      : [
          kv(String.raw`$V$ at the probe ($B$)`, fmtV(V)),
          kv(String.raw`$V$ at $A$`, fmtV(VA)),
          kv(String.raw`$\Delta V = V_B - V_A$`, fmtV(V - VA)),
          kv(String.raw`$PE_E = qV$`, fmtEnergy(PE)),
          kv(String.raw`$W_{\text{field}}$, $A \to B$`, fmtEnergy(W)),
        ];
    if (g) {
      rows.push(kv(String.raw`$E_x$`, fmtE(g.Ex)));
      rows.push(kv(String.raw`$-dV/dx$`, fmtE(g.negdVdx)));
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
    const here = [
      [String.raw`$V$ at the probe`, fmtV(V), ''],
      [String.raw`$PE_E$`, fmtEnergy(computed.PE ?? 0), ''],
    ];
    if (state.hideA) return cells(here);
    return cells([
      ...here,
      [String.raw`$\Delta V\ (A \to B)$`, fmtV(V - VA), ''],
      [String.raw`$W_{\text{field}}$`, fmtEnergy(computed.Wfield ?? 0), ''],
    ]);
  },
  plot(state, computed) {
    if (!computed.Vx) return null;
    return { type: 'Vx', xs: computed.Vx.xs, Vs: computed.Vx.Vs, xProbe: state.probe.x, xA: state.hideA ? null : state.pathA?.x };
  },
  coach: (state, computed) => coachPotential(state, computed),
});
