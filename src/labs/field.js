import * as THREE from 'three';
import { CHARGE_HTML, bindCharges, renderChargeList } from './charges-ui.js';
import { SCENARIOS } from '../data/scenarios.js';
import { fieldAt, contributionsAt, forceOn } from '../physics/field.js';
import { coachField } from '../physics/coach.js';
import { fmtE, fmtCharge, fmtPoint } from '../ui/format.js';
import { kv, cells } from '../ui/shared.js';
import { defaultView, softenFor } from '../engine/frame.js';
import { defineLab, planeCamera } from './define.js';

export default defineLab({
  id: 'field',
  exam: 'e2',
  title: 'Field',
  hint: 'Click empty space to place the probe',
  // The field lines are coloured by |E| on the same ramp as a potential map; say so.
  legend: { id: 'E', title: 'Field-line colour: |E|', low: 'weak', high: 'strong', barClass: 'legend-v' },
  orbit: true,
  probe: true,
  camera: { pos: new THREE.Vector3(5.8, 4.4, 9.6), target: new THREE.Vector3(0, 0, 0) },
  keys: { '+': 'add+', '=': 'add+', '-': 'add-', Delete: 'delete', Backspace: 'delete', r: 'reset', R: 'reset' },
  toggles: [
    { key: 'lines', label: 'Field lines' },
    { key: 'forces', label: 'Forces' },
  ],
  scenarios: SCENARIOS.field,
  /** Positions are the student's to set, so the view follows them (see engine/frame.js). */
  frame: true,
  cameraFor: (state) => planeCamera(state) || undefined,
  defaultState() {
    return {
      scenarioId: 'single-plus',
      view: defaultView(),
      charges: [],
      extraE: { x: 0, y: 0, z: 0 },
      show: { flux: false, E: true, nHat: false, lines: true, forces: false, equipot: false },
      probe: { x: 0.45, y: 0.2, z: 0 },
      selectedId: null,
      anim: { playing: false, i: 0 },
    };
  },
  controls: () => CHARGE_HTML,
  bind: bindCharges,
  syncControls: (state) => renderChargeList(state),
  recompute(state, computed) {
    const soft = softenFor(state.view);
    computed.probeE = fieldAt(state.probe, state.charges, state.extraE, soft);
    computed.contrib = contributionsAt(state.probe, state.charges, state.extraE, soft);
    const idx = state.charges.findIndex((c) => c.id === state.selectedId);
    computed.selectedForce = idx >= 0 && state.charges.length >= 2 ? forceOn(idx, state.charges, soft) : null;
  },
  syncViews(state, computed, ctx) {
    const pool = ctx.pool;
    const charges = pool.charges();
    const probe = pool.probe();
    const lines = pool.lines();
    const forces = pool.forces();
    charges.setVisible(true);
    probe.setVisible(true);
    charges.sync(state.charges, state.selectedId);
    probe.sync(state.probe, computed.probeE, '', state.hideProbeTag ? '' : state.probeTag || 'P');
    lines.setVisible(!!state.show.lines);
    const soft = softenFor(state.view);
    if (state.show.lines) lines.rebuild(state.charges, state.extraE, soft);
    const forceOnLab = !!state.show.forces;
    forces.setVisible(forceOnLab);
    if (forceOnLab) forces.rebuild(state.charges, state.selectedId, soft);
    ctx.grid.visible = true;
  },
  law: () => [String.raw`\vec{E} = \dfrac{kq}{r^2}\,\hat{r}`, String.raw`\vec{E}_{\text{net}} = \textstyle\sum_i \vec{E}_i`],
  liveRows(state, computed) {
    const E = computed.probeE || { x: 0, y: 0, z: 0 };
    const mag = Math.hypot(E.x, E.y, E.z);
    const rows = [
      kv(String.raw`$|\vec{E}_{\text{net}}|$`, fmtE(mag)),
      kv(String.raw`$E_x$`, fmtE(E.x)),
      kv(String.raw`$E_y$`, fmtE(E.y)),
      kv(String.raw`$E_z$`, fmtE(E.z)),
      kv(String.raw`Probe $P$`, fmtPoint(state.probe)),
    ];
    for (const row of computed.contrib || []) {
      const name = row.id === 'uniform' ? 'uniform E' : fmtCharge(row.q);
      rows.push(kv(name, fmtE(row.mag)));
    }
    return rows.join('');
  },
  readout(state, computed) {
    const E = computed.probeE || { x: 0, y: 0, z: 0 };
    const mag = Math.hypot(E.x, E.y, E.z);
    return cells([
      [String.raw`$|\vec{E}_{\text{net}}|$`, fmtE(mag), ''],
      [String.raw`$E_x$`, fmtE(E.x), ''],
      [String.raw`$E_y$`, fmtE(E.y), ''],
      [String.raw`$E_z$`, fmtE(E.z), ''],
    ]);
  },
  coach: (state, computed) => coachField(state.charges, computed),
});
