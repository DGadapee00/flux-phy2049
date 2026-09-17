import * as THREE from 'three';
import { CHARGE_HTML, bindCharges, renderChargeList } from './charges-ui.js';
import { SCENARIOS } from '../data/scenarios.js';
import { forceOn } from '../physics/field.js';
import { coachForce } from '../physics/coach.js';
import { fmtCharge, fmtForce } from '../ui/format.js';
import { kv, cells } from '../ui/shared.js';
import { defaultView, softenFor } from '../engine/frame.js';
import { defineLab, planeCamera } from './define.js';

export default defineLab({
  id: 'force',
  exam: 'e1',
  title: 'Force',
  hint: 'Select a charge to read F_net',
  orbit: true,
  camera: { pos: new THREE.Vector3(5.6, 3.4, 8.8), target: new THREE.Vector3(0, 0, 0) },
  keys: { '+': 'add+', '=': 'add+', '-': 'add-', Delete: 'delete', Backspace: 'delete', r: 'reset', R: 'reset' },
  toggles: [{ key: 'forces', label: 'Forces' }],
  scenarios: SCENARIOS.force,
  frame: true,
  cameraFor: (state) => planeCamera(state) || undefined,
  defaultState() {
    return {
      scenarioId: 'pair-repel',
      view: defaultView(),
      charges: [],
      extraE: { x: 0, y: 0, z: 0 },
      show: { flux: false, E: false, nHat: false, lines: false, forces: true, equipot: false },
      selectedId: null,
      anim: { playing: false, i: 0 },
    };
  },
  controls: () => CHARGE_HTML,
  bind: bindCharges,
  syncControls: (state) => renderChargeList(state),
  recompute(state, computed) {
    const idx = state.charges.findIndex((c) => c.id === state.selectedId);
    const soft = softenFor(state.view);
    computed.selectedForce = idx >= 0 && state.charges.length >= 2 ? forceOn(idx, state.charges, soft) : null;
  },
  syncViews(state, computed, ctx) {
    const pool = ctx.pool;
    const charges = pool.charges();
    const forces = pool.forces();
    charges.setVisible(true);
    charges.sync(state.charges, state.selectedId);
    forces.setVisible(true);
    forces.rebuild(state.charges, state.selectedId, softenFor(state.view));
    ctx.grid.visible = true;
  },
  law: () => [String.raw`\vec{F}_E = \dfrac{k\,q_1 q_2}{r^2}\,\hat{r} \qquad \vec{F} = q\vec{E}`],
  liveRows(state, computed) {
    const F = computed.selectedForce;
    const sel = state.charges.find((c) => c.id === state.selectedId);
    const rows = [];
    if (sel && F) {
      const mag = Math.hypot(F.x, F.y, F.z);
      rows.push(kv('Selected', fmtCharge(sel.q)));
      rows.push(kv('|F<sub>net</sub>|', fmtForce(mag)));
      rows.push(kv('F<sub>x</sub>', fmtForce(F.x)));
      rows.push(kv('F<sub>y</sub>', fmtForce(F.y)));
      rows.push(kv('F<sub>z</sub>', fmtForce(F.z)));
    } else {
      rows.push(kv('Need', 'two or more charges'));
    }
    return rows.join('');
  },
  readout(state, computed) {
    const F = computed.selectedForce;
    const sel = state.charges.find((c) => c.id === state.selectedId);
    const mag = F ? Math.hypot(F.x, F.y, F.z) : 0;
    return cells([
      ['Selected', sel ? fmtCharge(sel.q) : '—', ''],
      ['|F_net|', F ? fmtForce(mag) : '—', ''],
      ['F_x', F ? fmtForce(F.x) : '—', ''],
      ['F_y', F ? fmtForce(F.y) : '—', ''],
    ]);
  },
  coach: (state) => coachForce(state.charges),
});
