import * as THREE from 'three';
import { CSS2DObject } from 'three/addons/renderers/CSS2DRenderer.js';
import { defineLab } from './define.js';
import { M, fatLine, fatSegments } from '../scene/manim.js';
import { UNITS_PER_METER } from '../physics/constants.js';
import { malusChain } from '../physics/polarization.js';
import { kv, cells, qv } from '../ui/shared.js';
import { fmtIrr } from '../ui/format.js';

const SCENARIOS = [
  { id: 'three', name: 'Crossed + middle at 45° — light returns', n: 3, a: 0, b: 45, c: 90 },
  { id: 'crossed', name: 'Two polarizers, crossed — dark', n: 2, a: 0, b: 90, c: 90 },
  { id: '45', name: 'Two polarizers, 45°', n: 2, a: 0, b: 45, c: 90 },
  { id: 'parallel', name: 'Two polarizers, parallel', n: 2, a: 0, b: 0, c: 90 },
  { id: 'one', name: 'Unpolarized → one polarizer (I₀/2)', n: 1, a: 0, b: 45, c: 90 },
];

const I0 = 1000;
const XS = [-1.05, -0.15, 0.75];

function label(html, x, y, z) {
  const el = document.createElement('div');
  el.className = 'circuit-label';
  el.innerHTML = html;
  const o = new CSS2DObject(el);
  o.position.set(x, y, z);
  o.userData.el = el;
  return o;
}

function polarizerMesh(u) {
  const g = new THREE.Group();
  const R = 0.38 * u;
  const disk = new THREE.Mesh(
    new THREE.CircleGeometry(R, 48),
    new THREE.MeshBasicMaterial({
      color: 0x1c758a,
      transparent: true,
      opacity: 0.28,
      side: THREE.DoubleSide,
      depthWrite: false,
      toneMapped: false,
    }),
  );
  const rim = new THREE.Mesh(
    new THREE.TorusGeometry(R, 0.02 * u, 8, 48),
    new THREE.MeshBasicMaterial({ color: M.white, toneMapped: false }),
  );
  disk.rotation.y = Math.PI / 2;
  rim.rotation.y = Math.PI / 2;
  const stripes = [];
  const half = 0.32 * u;
  for (let i = -3; i <= 3; i++) {
    const z = i * 0.09 * u;
    stripes.push(0, -half, z, 0, half, z);
  }
  const grid = fatSegments(stripes, { color: M.gold, width: 1.6 });
  g.add(disk, rim, grid);
  g.userData.grid = grid;
  return g;
}

function beamMesh(color, u) {
  const mat = new THREE.MeshBasicMaterial({
    color,
    transparent: true,
    opacity: 0.55,
    depthWrite: false,
    toneMapped: false,
  });
  const mesh = new THREE.Mesh(new THREE.CylinderGeometry(0.14 * u, 0.14 * u, 1, 20), mat);
  mesh.rotation.z = Math.PI / 2;
  mesh.userData.r0 = 0.14 * u;
  return mesh;
}

export default defineLab({
  id: 'polar',
  exam: 'e6',
  title: 'Polarization',
  hint: 'Cross two polarizers, then slide a third in at 45° — light comes back',
  live: false,
  orbit: true,
  camera: { pos: new THREE.Vector3(2.4, 3.8, 11.2), target: new THREE.Vector3(0, 0, 0) },
  keys: { r: 'reset', R: 'reset' },
  scenarios: SCENARIOS,
  defaultState() {
    return { scenarioId: 'three', n: 3, a: 0, b: 45, c: 90, I0, anim: { playing: false, i: 0 } };
  },
  applyScenario(id, state) {
    const sc = SCENARIOS.find((s) => s.id === id) || SCENARIOS[0];
    state.scenarioId = sc.id;
    state.n = sc.n;
    state.a = sc.a;
    state.b = sc.b;
    state.c = sc.c;
  },
  controls() {
    return `
        <div class="lab-block">
          <div class="seg" id="pol-n">
            <button type="button" data-n="1">1 filter</button>
            <button type="button" data-n="2">2 filters</button>
            <button type="button" data-n="3" class="active">3 filters</button>
          </div>
          <label class="field">
            <span>P1 axis</span>
            <div class="slider-row">
              <input type="range" id="pol-a" min="0" max="180" step="1" value="0" />
              <span class="mono val" id="pol-a-val">0°</span>
            </div>
          </label>
          <label class="field" id="wrap-pol-b">
            <span>P2 axis</span>
            <div class="slider-row">
              <input type="range" id="pol-b" min="0" max="180" step="1" value="45" />
              <span class="mono val" id="pol-b-val">45°</span>
            </div>
          </label>
          <label class="field" id="wrap-pol-c">
            <span>P3 axis</span>
            <div class="slider-row">
              <input type="range" id="pol-c" min="0" max="180" step="1" value="90" />
              <span class="mono val" id="pol-c-val">90°</span>
            </div>
          </label>
          <p class="tiny">Unpolarized in, then Malus I = I₀ cos²θ at each polarizer. Gold lines are the transmission axis. Crossed filters go dark; a 45° filter in the middle brings light back (I₀/8).</p>
        </div>`;
  },
  bind(api) {
    const $ = (id) => document.getElementById(id);
    $('pol-n').addEventListener('click', (e) => {
      const btn = e.target.closest('[data-n]');
      if (!btn) return;
      api.slice().n = Number(btn.dataset.n);
      api.bump();
    });
    const ang = (id, key) =>
      $(id).addEventListener('input', (e) => {
        api.slice()[key] = Number(e.target.value);
        api.bump(false);
      });
    ang('pol-a', 'a');
    ang('pol-b', 'b');
    ang('pol-c', 'c');
  },
  syncControls(state) {
    const $ = (id) => document.getElementById(id);
    document.querySelectorAll('#pol-n [data-n]').forEach((b) => {
      b.classList.toggle('active', Number(b.dataset.n) === state.n);
    });
    $('pol-a').value = state.a;
    $('pol-a-val').textContent = `${state.a.toFixed(0)}°`;
    $('pol-b').value = state.b;
    $('pol-b-val').textContent = `${state.b.toFixed(0)}°`;
    $('pol-c').value = state.c;
    $('pol-c-val').textContent = `${state.c.toFixed(0)}°`;
    $('wrap-pol-b').hidden = state.n < 2;
    $('wrap-pol-c').hidden = state.n < 3;
  },
  init(ctx) {
    const u = UNITS_PER_METER;
    const group = new THREE.Group();
    ctx.scene.add(group);
    const pols = [polarizerMesh(u), polarizerMesh(u), polarizerMesh(u)];
    pols.forEach((p, i) => {
      p.position.set(XS[i] * u, 0, 0);
      group.add(p);
    });
    const beams = [beamMesh(0xece6e2, u), beamMesh(0xece6e2, u), beamMesh(0xece6e2, u), beamMesh(0xece6e2, u)];
    beams.forEach((b) => group.add(b));
    const labs = [
      label('source', -1.55 * u, 0.85 * u, 0),
      label('P1', XS[0] * u, 0.85 * u, 0),
      label('P2', XS[1] * u, 0.85 * u, 0),
      label('P3', XS[2] * u, 0.85 * u, 0),
    ];
    labs.forEach((l) => group.add(l));
    group.add(fatLine([-1.7 * u, 0, 0, 1.55 * u, 0, 0], { color: 0x444444, width: 1.2 }));
    group.visible = false;
    return { group, pols, beams, labs };
  },
  enter(ctx, handle) {
    handle.group.visible = true;
  },
  exit(ctx, handle) {
    handle.group.visible = false;
  },
  recompute(state, computed) {
    const angles = [state.a, state.b, state.c].slice(0, state.n);
    computed.pol = malusChain(state.I0, angles, null);
  },
  syncViews(state, computed, ctx) {
    const h = ctx.handle;
    const p = computed.pol;
    if (!h || !p) return;
    const u = UNITS_PER_METER;
    const angles = [state.a, state.b, state.c];
    for (let i = 0; i < 3; i++) {
      const on = i < state.n;
      h.pols[i].visible = on;
      h.labs[i + 1].visible = on;
      if (on) h.pols[i].rotation.x = (angles[i] * Math.PI) / 180;
    }
    const xs = [-1.55, ...XS.slice(0, state.n), 1.45];
    const Is = p.steps.map((s) => s.I);
    for (let i = 0; i < 4; i++) {
      const beam = h.beams[i];
      const on = i <= state.n;
      beam.visible = on;
      if (!on) continue;
      const x0 = xs[i];
      const x1 = xs[i + 1];
      const I = Is[i];
      const frac = Math.max(0, I / state.I0);
      const r = (0.05 + 0.12 * Math.sqrt(frac)) * u;
      const r0 = beam.userData.r0;
      beam.position.set(((x0 + x1) / 2) * u, 0, 0);
      beam.scale.set(r / r0, (x1 - x0) * u, r / r0);
      beam.material.opacity = 0.15 + 0.65 * frac;
      beam.visible = frac > 1e-4;
    }
    ctx.grid.visible = true;
  },
  law: () => [
    String.raw`I = I_0\cos^2\theta\qquad\text{(Malus)}`,
    String.raw`\text{unpolarized }\to\text{ polarizer: }I=I_0/2`,
  ],
  liveRows(state, computed) {
    const p = computed.pol;
    if (!p) return '';
    const rows = [kv('I₀ (unpolarized in)', fmtIrr(state.I0))];
    const names = ['after P1', 'after P2', 'after P3'];
    for (let i = 1; i < p.steps.length; i++) {
      const s = p.steps[i];
      const frac = s.I / state.I0;
      rows.push(kv(`${names[i - 1]} (${s.axis.toFixed(0)}°)`, `${fmtIrr(s.I)}  (${(frac * 100).toFixed(1)}% of I₀)`));
    }
    rows.push(kv('I / I₀', qv('qI', (p.I / state.I0).toFixed(3))));
    return rows.join('');
  },
  readout(state, computed) {
    const p = computed.pol;
    if (!p) return '';
    const frac = p.I / state.I0;
    const dark = frac < 0.02;
    const three = state.n === 3 && Math.abs(state.a) < 1 && Math.abs(state.c - 90) < 1;
    return cells([
      ['Filters', String(state.n), ''],
      ['I out', fmtIrr(p.I), dark ? 'bad' : 'ok'],
      ['I / I₀', frac.toFixed(3), three && frac > 0.1 ? 'ok' : ''],
      ['Malus', 'cos²θ', ''],
    ]);
  },
  coach(state, computed) {
    const p = computed.pol;
    const frac = p ? p.I / state.I0 : 0;
    if (state.n === 1) {
      return {
        title: 'One polarizer eats half of unpolarized light',
        body: 'Unpolarized light is a mix of all axes. A polarizer keeps the component along its gold lines and dumps the rest, so I = I₀/2 and what remains is linearly polarized.',
      };
    }
    if (state.n === 2 && Math.abs(((state.b - state.a + 90) % 180) - 90) < 4) {
      return {
        title: 'Crossed polarizers — Malus gives zero',
        body: 'θ = 90°, cosθ = 0, I = 0. The second filter is asked for a component the first one already threw away. Add a third filter in between at 45° (the “three filters” scenario) and light comes back: each step is only 45°, and (I₀/2)(½)(½) = I₀/8.',
      };
    }
    if (state.n === 3 && frac > 0.05) {
      return {
        title: 'A polarizer in the middle resurrects the beam',
        body: `P1 polarizes at ${state.a.toFixed(0)}°. P2 at ${state.b.toFixed(0)}° passes cos²Δ of that. P3 at ${state.c.toFixed(0)}° does it again. Crossed P1 and P3 would be dark alone; the middle axis gives the last filter something to project. For 0° / 45° / 90° that is I₀/8.`,
      };
    }
    return {
      title: 'Malus’s law is a projection',
      body: 'I = I₀ cos²θ compares two axes. Intensity follows the square because E projects as cosθ and I ∝ E². Turn a filter and watch the beam fatten or fade.',
    };
  },
});
