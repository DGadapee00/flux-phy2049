import * as THREE from 'three';
import { CSS2DObject } from 'three/addons/renderers/CSS2DRenderer.js';
import { defineLab } from './define.js';
import { Arrow, M } from '../scene/manim.js';
import { UNITS_PER_METER } from '../physics/constants.js';
import { dot, len, normalize } from '../physics/vec.js';
import { kv, cells } from '../ui/shared.js';

const SCENARIOS = [
  { id: 'axes', name: 'x̂ and ŷ', a: { x: 1, y: 0, z: 0 }, b: { x: 0, y: 1, z: 0 } },
  { id: '345', name: '3-4-5 right angle', a: { x: 0.6, y: 0, z: 0 }, b: { x: 0, y: 0.8, z: 0 } },
  { id: 'obtuse', name: 'Obtuse — negative dot product', a: { x: 0.8, y: 0.2, z: 0 }, b: { x: -0.5, y: 0.6, z: 0 } },
  { id: 'acute', name: 'Acute in the xz plane', a: { x: 0.7, y: 0, z: 0.2 }, b: { x: 0.4, y: 0, z: 0.7 } },
];

function mag(v) {
  return len(v);
}

function angle(a, b) {
  const m = mag(a) * mag(b);
  if (m < 1e-12) return 0;
  return Math.acos(Math.min(1, Math.max(-1, dot(a, b) / m)));
}

function placeArrow(arr, tip, v, u) {
  const L = Math.hypot(v.x, v.y, v.z);
  const dir = new THREE.Vector3(v.x, v.y, v.z);
  if (L < 1e-6) dir.set(1, 0, 0);
  else dir.multiplyScalar(1 / L);
  arr.position.set(0, 0, 0);
  arr.setDirection(dir);
  arr.setLength(Math.max(0.05, L * u));
  tip.position.set(v.x * u, v.y * u, v.z * u);
}

function makeTip(color, letter) {
  const mesh = new THREE.Mesh(
    new THREE.SphereGeometry(0.12, 20, 14),
    new THREE.MeshBasicMaterial({ color, toneMapped: false }),
  );
  const el = document.createElement('div');
  el.className = 'probe-label';
  el.textContent = letter;
  const lab = new CSS2DObject(el);
  lab.position.set(0, 0.28, 0);
  mesh.add(lab);
  mesh.userData.which = letter;
  return mesh;
}

let dragWhich = null;

export default defineLab({
  id: 'vectors',
  exam: 'e1',
  title: 'Vectors',
  hint: 'Drag a tip — components and a·b update',
  orbit: true,
  camera: { pos: new THREE.Vector3(4.8, 4.2, 8.4), target: new THREE.Vector3(0, 0.4, 0) },
  keys: { r: 'reset', R: 'reset' },
  scenarios: SCENARIOS,
  defaultState() {
    return {
      scenarioId: 'axes',
      a: { x: 1, y: 0, z: 0 },
      b: { x: 0, y: 1, z: 0 },
      charges: [],
      show: {},
      anim: { playing: false, i: 0 },
    };
  },
  applyScenario(id, state) {
    const sc = SCENARIOS.find((s) => s.id === id) || SCENARIOS[0];
    state.scenarioId = sc.id;
    state.a = { ...sc.a };
    state.b = { ...sc.b };
  },
  controls() {
    return `<p class="tiny">Montgomery’s Exam 1 sheet: <span class="mono">a = a<sub>x</sub> x̂ + a<sub>y</sub> ŷ</span>, |a| = √(a·a), a·b = |a||b|cosφ. Drag the labeled tips. Shift-drag for height (y).</p>`;
  },
  init(ctx) {
    const group = new THREE.Group();
    ctx.scene.add(group);
    const aArr = new Arrow(new THREE.Vector3(1, 0, 0), new THREE.Vector3(), 1, M.red);
    const bArr = new Arrow(new THREE.Vector3(0, 1, 0), new THREE.Vector3(), 1, M.blue);
    const aTip = makeTip(M.red, 'a');
    const bTip = makeTip(M.blue, 'b');
    group.add(aArr, bArr, aTip, bTip);
    group.visible = false;
    return { group, aArr, bArr, aTip, bTip };
  },
  enter(ctx, handle) {
    handle.group.visible = true;
  },
  exit(ctx, handle) {
    handle.group.visible = false;
  },
  recompute(state, computed) {
    const a = state.a;
    const b = state.b;
    const ma = mag(a);
    const mb = mag(b);
    const adb = dot(a, b);
    const phi = angle(a, b);
    computed.vec = {
      ma,
      mb,
      adb,
      phi,
      fromCos: ma * mb * Math.cos(phi),
      ahat: normalize(a),
      bhat: normalize(b),
      alpha: ma ? Math.acos(Math.min(1, Math.abs(a.x) / ma)) : 0,
      beta: ma ? Math.acos(Math.min(1, Math.abs(a.y) / ma)) : 0,
    };
  },
  syncViews(state, computed, ctx) {
    const h = ctx.handle;
    if (!h) return;
    const u = UNITS_PER_METER;
    placeArrow(h.aArr, h.aTip, state.a, u);
    placeArrow(h.bArr, h.bTip, state.b, u);
    ctx.grid.visible = true;
  },
  law: () => [
    String.raw`\vec{a} = a_x\,\hat{x} + a_y\,\hat{y} + a_z\,\hat{z}`,
    String.raw`\vec{a}\cdot\vec{b} = |\vec{a}|\,|\vec{b}|\cos\phi = a_x b_x + a_y b_y + a_z b_z`,
  ],
  liveRows(state, computed) {
    const a = state.a;
    const b = state.b;
    const v = computed.vec;
    if (!v) return '';
    const deg = (v.phi * 180) / Math.PI;
    return [
      kv('a<sub>x</sub>, a<sub>y</sub>, a<sub>z</sub>', `${a.x.toFixed(2)}, ${a.y.toFixed(2)}, ${a.z.toFixed(2)}`),
      kv('b<sub>x</sub>, b<sub>y</sub>, b<sub>z</sub>', `${b.x.toFixed(2)}, ${b.y.toFixed(2)}, ${b.z.toFixed(2)}`),
      kv('|a|', v.ma.toFixed(3)),
      kv('|b|', v.mb.toFixed(3)),
      kv('a · b (components)', v.adb.toFixed(3)),
      kv('|a||b|cosφ', v.fromCos.toFixed(3)),
      kv('φ', `${deg.toFixed(1)}°`),
      kv('α = cos⁻¹(a<sub>x</sub>/|a|)', `${((v.alpha * 180) / Math.PI).toFixed(1)}°`),
    ].join('');
  },
  readout(state, computed) {
    const v = computed.vec;
    if (!v) return '';
    return cells([
      ['|a|', v.ma.toFixed(2), ''],
      ['|b|', v.mb.toFixed(2), ''],
      ['a · b', v.adb.toFixed(2), v.adb < 0 ? 'warn' : 'ok'],
      ['φ', `${((v.phi * 180) / Math.PI).toFixed(0)}°`, ''],
    ]);
  },
  coach(state, computed) {
    const v = computed.vec;
    if (!v) return { title: 'Vectors', body: 'Drag the tips.' };
    if (Math.abs(v.adb) < 0.05) {
      return {
        title: 'Perpendicular — dot product is 0',
        body: 'a · b = 0 ⇔ φ = 90°. On the sheet, a · x̂ = a_x = |a| cos α. The two ways of writing the dot product (components vs |a||b|cosφ) always agree — that’s the check in the live table.',
      };
    }
    if (v.adb < 0) {
      return {
        title: 'Obtuse — negative work, negative flux pieces',
        body: 'φ > 90° so cosφ < 0 and a · b < 0. Same sign rule as E · n̂ on a Gaussian tile: inward flux is negative. The magnitude is still |a||b||cosφ|.',
      };
    }
    return {
      title: 'Components first, then the angle',
      body: 'Write a = a_x x̂ + a_y ŷ + a_z ẑ. |a| = √(a·a). The angle with the x-axis is α = cos⁻¹(a_x/|a|). Adding vectors is adding components — that is Exam 1, and it is how F_net and E_net are built later.',
    };
  },
  pointer: {
    down(e, ctx) {
      const handle = ctx.handle;
      if (!handle) return;
      const raycaster = new THREE.Raycaster();
      const pointer = new THREE.Vector2((e.clientX / window.innerWidth) * 2 - 1, -(e.clientY / window.innerHeight) * 2 + 1);
      raycaster.setFromCamera(pointer, ctx.camera);
      const hits = raycaster.intersectObjects([handle.aTip, handle.bTip], false);
      if (!hits.length) return;
      dragWhich = hits[0].object.userData.which === 'a' ? 'a' : 'b';
      ctx.controls.enabled = false;
    },
    move(e, ctx) {
      if (!dragWhich) return;
      const raycaster = new THREE.Raycaster();
      const pointer = new THREE.Vector2((e.clientX / window.innerWidth) * 2 - 1, -(e.clientY / window.innerHeight) * 2 + 1);
      raycaster.setFromCamera(pointer, ctx.camera);
      const plane = new THREE.Plane();
      const hit = new THREE.Vector3();
      const v = ctx.state[dragWhich];
      if (e.shiftKey) {
        plane.setFromNormalAndCoplanarPoint(new THREE.Vector3(0, 0, 1), new THREE.Vector3(0, 0, v.z * UNITS_PER_METER));
      } else {
        plane.setFromNormalAndCoplanarPoint(new THREE.Vector3(0, 1, 0), new THREE.Vector3(0, v.y * UNITS_PER_METER, 0));
      }
      if (raycaster.ray.intersectPlane(plane, hit)) {
        v.x = Math.max(-1.2, Math.min(1.2, hit.x / UNITS_PER_METER));
        if (e.shiftKey) v.y = Math.max(-1.1, Math.min(1.1, hit.y / UNITS_PER_METER));
        else v.z = Math.max(-1.2, Math.min(1.2, hit.z / UNITS_PER_METER));
        ctx.bump();
      }
    },
    up(e, ctx) {
      dragWhich = null;
      ctx.controls.enabled = true;
    },
  },
});
