import * as THREE from 'three';
import { CSS2DObject } from 'three/addons/renderers/CSS2DRenderer.js';
import { defineLab } from './define.js';
import { Arrow, M, fatLine, fatSegments, disposeTree } from '../scene/manim.js';
import { dot, len, normalize } from '../physics/vec.js';
import { kv, cells, eq } from '../ui/shared.js';

/** Vectors are dimensionless here; draw 1 unit as 4 scene units so |a| ≈ 1 fits on screen. */
const S = 4;

const SCENARIOS = [
  { id: 'axes', name: 'x̂ and ŷ', a: { x: 1, y: 0, z: 0 }, b: { x: 0, y: 1, z: 0 } },
  { id: '345', name: '3-4-5: a = 0.6 x̂ + 0.8 ŷ, b = x̂', a: { x: 0.6, y: 0.8, z: 0 }, b: { x: 1, y: 0, z: 0 } },
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

/** Dashed drop lines to the floor and the axes (components), plus the φ arc between a and b. */
function rebuildGuides(h, state, u) {
  if (h.guides) {
    h.group.remove(h.guides);
    disposeTree(h.guides);
  }
  const g = new THREE.Group();
  for (const [v, color] of [
    [state.a, M.purple],
    [state.b, M.green],
  ]) {
    const segs = [];
    if (Math.abs(v.y) > 1e-3) segs.push(v.x * u, v.y * u, v.z * u, v.x * u, 0, v.z * u);
    if (Math.abs(v.z) > 1e-3) segs.push(v.x * u, 0, v.z * u, v.x * u, 0, 0);
    if (Math.abs(v.x) > 1e-3 && Math.abs(v.z) > 1e-3) segs.push(v.x * u, 0, v.z * u, 0, 0, v.z * u);
    if (Math.abs(v.x) > 1e-3 && Math.abs(v.y) > 1e-3 && Math.abs(v.z) < 1e-3) segs.push(v.x * u, v.y * u, 0, 0, v.y * u, 0);
    if (segs.length) {
      const s = fatSegments(segs, { color, width: 1.6, opacity: 0.6, dashed: true });
      s.computeLineDistances();
      g.add(s);
    }
  }
  const ma = mag(state.a);
  const mb = mag(state.b);
  const phi = angle(state.a, state.b);
  const s = Math.sin(phi);
  if (ma > 1e-3 && mb > 1e-3 && s > 1e-3) {
    const ah = normalize(state.a);
    const bh = normalize(state.b);
    const r = 0.35 * Math.min(ma, mb) * u;
    const pts = [];
    for (let i = 0; i <= 40; i++) {
      const t = i / 40;
      const k1 = Math.sin((1 - t) * phi) / s;
      const k2 = Math.sin(t * phi) / s;
      pts.push((k1 * ah.x + k2 * bh.x) * r, (k1 * ah.y + k2 * bh.y) * r, (k1 * ah.z + k2 * bh.z) * r);
    }
    g.add(fatLine(pts, { color: M.white, width: 2, opacity: 0.8 }));
    const el = document.createElement('div');
    el.className = 'probe-label';
    el.style.color = 'var(--yellow)';
    el.textContent = 'φ';
    const lab = new CSS2DObject(el);
    const mid = 0.5;
    const k = Math.sin((1 - mid) * phi) / s;
    lab.position.set((k * ah.x + k * bh.x) * r * 1.45, (k * ah.y + k * bh.y) * r * 1.45, (k * ah.z + k * bh.z) * r * 1.45);
    g.add(lab);
  }
  h.guides = g;
  h.group.add(g);
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
    const aArr = new Arrow(new THREE.Vector3(1, 0, 0), new THREE.Vector3(), 1, M.purple);
    const bArr = new Arrow(new THREE.Vector3(0, 1, 0), new THREE.Vector3(), 1, M.green);
    const aTip = makeTip(M.purple, 'a');
    const bTip = makeTip(M.green, 'b');
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
      // Direction angles with +x̂ and +ŷ: cos α = a_x/|a| keeps its sign (α > 90° when a_x < 0).
      alpha: ma ? Math.acos(Math.max(-1, Math.min(1, a.x / ma))) : 0,
      beta: ma ? Math.acos(Math.max(-1, Math.min(1, a.y / ma))) : 0,
    };
  },
  syncViews(state, computed, ctx) {
    const h = ctx.handle;
    if (!h) return;
    const u = S;
    placeArrow(h.aArr, h.aTip, state.a, u);
    placeArrow(h.bArr, h.bTip, state.b, u);
    rebuildGuides(h, state, u);
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
      kv(String.raw`$a_x$, $a_y$, $a_z$`, `${a.x.toFixed(2)}, ${a.y.toFixed(2)}, ${a.z.toFixed(2)}`),
      kv(String.raw`$b_x$, $b_y$, $b_z$`, `${b.x.toFixed(2)}, ${b.y.toFixed(2)}, ${b.z.toFixed(2)}`),
      kv(String.raw`$|\vec{a}|$`, v.ma.toFixed(3)),
      kv(String.raw`$|\vec{b}|$`, v.mb.toFixed(3)),
      kv(String.raw`$\vec{a}\cdot\vec{b}$ (components)`, v.adb.toFixed(3)),
      kv(String.raw`$|\vec{a}||\vec{b}|\cos\varphi$`, v.fromCos.toFixed(3)),
      kv(String.raw`$\varphi$`, `${deg.toFixed(1)}°`),
      kv(String.raw`$\alpha = \cos^{-1}(a_x/|\vec{a}|)$`, `${((v.alpha * 180) / Math.PI).toFixed(1)}°`),
      kv(String.raw`$\beta = \cos^{-1}(a_y/|\vec{a}|)$`, `${((v.beta * 180) / Math.PI).toFixed(1)}°`),
    ].join('');
  },
  readout(state, computed) {
    const v = computed.vec;
    if (!v) return '';
    return cells([
      [String.raw`$|\vec{a}|$`, v.ma.toFixed(2), ''],
      [String.raw`$|\vec{b}|$`, v.mb.toFixed(2), ''],
      [String.raw`$\vec{a}\cdot\vec{b}$`, v.adb.toFixed(2), v.adb < 0 ? 'warn' : 'ok'],
      [String.raw`$\varphi$`, `${((v.phi * 180) / Math.PI).toFixed(0)}°`, ''],
    ]);
  },
  coach(state, computed) {
    const v = computed.vec;
    if (!v) return { title: 'Vectors', body: 'Drag the tips of the arrows.' };
    if (Math.abs(v.adb) < 0.05) {
      return {
        title: 'Perpendicular — the dot product is zero',
        body: [
          eq(String.raw`\vec{a}\cdot\vec{b} = 0 \iff \varphi = 90^\circ`),
          String.raw`On the sheet, $\vec{a}\cdot\hat{x} = a_x = |\vec{a}|\cos\alpha$. The two ways of writing the dot product — components, or $|\vec{a}||\vec{b}|\cos\varphi$ — always agree, and that is the check in the live table.`,
        ],
      };
    }
    if (v.adb < 0) {
      return {
        title: 'Obtuse — negative work, negative flux pieces',
        body: String.raw`$\varphi > 90^\circ$, so $\cos\varphi < 0$ and $\vec{a}\cdot\vec{b} < 0$. It is the same sign rule as $\vec{E}\cdot\hat{n}$ on a Gaussian tile, where inward flux counts negative. The size is still $|\vec{a}||\vec{b}||\cos\varphi|$.`,
      };
    }
    return {
      title: 'Components first, then the angle',
      body: [
        eq(String.raw`\vec{a} = a_x\hat{x} + a_y\hat{y} + a_z\hat{z}, \qquad |\vec{a}| = \sqrt{\vec{a}\cdot\vec{a}}`),
        String.raw`The angle with the $x$-axis is $\alpha = \cos^{-1}(a_x/|\vec{a}|)$. Adding vectors is adding components — that is Exam 1, and it is how $\vec{F}_{\text{net}}$ and $\vec{E}_{\text{net}}$ get built later.`,
      ],
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
        plane.setFromNormalAndCoplanarPoint(new THREE.Vector3(0, 0, 1), new THREE.Vector3(0, 0, v.z * S));
      } else {
        plane.setFromNormalAndCoplanarPoint(new THREE.Vector3(0, 1, 0), new THREE.Vector3(0, v.y * S, 0));
      }
      if (raycaster.ray.intersectPlane(plane, hit)) {
        v.x = Math.max(-1.2, Math.min(1.2, hit.x / S));
        if (e.shiftKey) v.y = Math.max(-1.1, Math.min(1.1, hit.y / S));
        else v.z = Math.max(-1.2, Math.min(1.2, hit.z / S));
        ctx.bump();
      }
    },
    up(e, ctx) {
      dragWhich = null;
      ctx.controls.enabled = true;
    },
  },
});
