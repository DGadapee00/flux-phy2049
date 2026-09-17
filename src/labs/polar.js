import * as THREE from 'three';
import { CSS2DObject } from 'three/addons/renderers/CSS2DRenderer.js';
import { defineLab } from './define.js';
import { Arrow, M, fatLine, fatSegments, disposeTree } from '../scene/manim.js';
import { UNITS_PER_METER } from '../physics/constants.js';
import { malusChain } from '../physics/polarization.js';
import { kv, cells, qv, eq } from '../ui/shared.js';
import { fmtIrr } from '../ui/format.js';

const SCENARIOS = [
  { id: 'three', name: 'Crossed + middle at 45° — light returns', n: 3, a: 0, b: 45, c: 90 },
  { id: 'crossed', name: 'Two polarizers, crossed — dark', n: 2, a: 0, b: 90, c: 90 },
  { id: '45', name: 'Two polarizers, 45°', n: 2, a: 0, b: 45, c: 90 },
  { id: 'parallel', name: 'Two polarizers, parallel', n: 2, a: 0, b: 0, c: 90 },
  { id: 'one', name: 'Unpolarized → one polarizer (I₀/2)', n: 1, a: 0, b: 45, c: 90 },
];

const I0 = 1000;
/** Beam along +x (meters). Polarizer planes are yz; an axis angle θ points along (0, cosθ, sinθ). */
const XS = [-0.38, 0, 0.38];
const X_SOURCE = -0.72;
const X_END = 0.72;
const R_POL = 0.2;
const E_LEN = 0.14;

function label(html, x, y, z) {
  const el = document.createElement('div');
  el.className = 'circuit-label';
  el.innerHTML = html;
  const o = new CSS2DObject(el);
  o.position.set(x, y, z);
  return o;
}

function polarizerMesh(u) {
  const g = new THREE.Group();
  const R = R_POL * u;
  const disk = new THREE.Mesh(
    new THREE.CircleGeometry(R, 48),
    new THREE.MeshBasicMaterial({ color: M.blueE, transparent: true, opacity: 0.25, side: THREE.DoubleSide, depthWrite: false, toneMapped: false }),
  );
  disk.rotation.y = Math.PI / 2;
  const rimPts = [];
  for (let i = 0; i <= 64; i++) {
    const a = (i / 64) * Math.PI * 2;
    rimPts.push(0, R * Math.cos(a), R * Math.sin(a));
  }
  const rim = fatLine(rimPts, { color: M.white, width: 2.2 });
  const stripes = [];
  for (let i = -3; i <= 3; i++) {
    const z = i * 0.045 * u;
    const half = Math.sqrt(Math.max(0, R * R - z * z)) * 0.92;
    stripes.push(0, -half, z, 0, half, z);
  }
  // The stripes turn with the axis; the rim does not.
  const axis = new THREE.Group();
  axis.add(fatSegments(stripes, { color: M.gold, width: 1.6, opacity: 0.85 }));
  g.add(disk, rim, axis);
  g.userData.axis = axis;
  return g;
}

/** Double-headed arrow: the line E oscillates along. */
function eGlyph(center, dir, len, color) {
  const g = new THREE.Group();
  if (len < 0.02) return g;
  g.add(new Arrow(dir.clone(), center.clone(), len, color, 0.24, 0.2, 0.025));
  g.add(new Arrow(dir.clone().multiplyScalar(-1), center.clone(), len, color, 0.24, 0.2, 0.025));
  return g;
}

export default defineLab({
  id: 'polar',
  exam: 'e6',
  title: 'Polarization',
  hint: 'Cross two polarizers, then slide a third in at 45° — light comes back',
  live: false,
  orbit: true,
  camera: { pos: new THREE.Vector3(4.6, 3.4, 12), target: new THREE.Vector3(0, 0, 0) },
  keys: { r: 'reset', R: 'reset' },
  scenarios: SCENARIOS,
  defaultState() {
    return { scenarioId: 'three', n: 3, a: 0, b: 45, c: 90, I0, anim: { playing: false, i: 0 } };
  },
  applyScenario(id, state) {
    const sc = SCENARIOS.find((s) => s.id === id) || SCENARIOS[0];
    Object.assign(state, { scenarioId: sc.id, n: sc.n, a: sc.a, b: sc.b, c: sc.c });
  },
  controls() {
    const slider = (id, text, v) => `
          <label class="field" id="wrap-${id}">
            <span>${text}</span>
            <div class="slider-row">
              <input type="range" id="${id}" min="0" max="180" step="1" value="${v}" />
              <span class="mono val" id="${id}-val">${v}°</span>
            </div>
          </label>`;
    return `
        <div class="lab-block">
          <div class="seg" id="pol-n">
            <button type="button" data-n="1">1 filter</button>
            <button type="button" data-n="2">2 filters</button>
            <button type="button" data-n="3" class="active">3 filters</button>
          </div>
          ${slider('pol-a', 'P1 axis (from vertical)', 0)}
          ${slider('pol-b', 'P2 axis', 45)}
          ${slider('pol-c', 'P3 axis', 90)}
          <p class="tiny">Unpolarized light in, then Malus I = I₀cos²θ at each polarizer, θ = angle between successive axes. Gold stripes are the transmission axis. The white double arrows show the direction E oscillates and how big it is (E ∝ √I).</p>
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
    document.querySelectorAll('#pol-n [data-n]').forEach((b) => b.classList.toggle('active', Number(b.dataset.n) === state.n));
    for (const k of ['a', 'b', 'c']) {
      $(`pol-${k}`).value = state[k];
      $(`pol-${k}-val`).textContent = `${state[k].toFixed(0)}°`;
    }
    $('wrap-pol-b').hidden = state.n < 2;
    $('wrap-pol-c').hidden = state.n < 3;
  },
  init(ctx) {
    const u = UNITS_PER_METER;
    const group = new THREE.Group();
    ctx.scene.add(group);
    const pols = XS.map((x) => {
      const p = polarizerMesh(u);
      p.position.set(x * u, 0, 0);
      group.add(p);
      return p;
    });
    const beams = [0, 1, 2, 3].map(() => {
      const mesh = new THREE.Mesh(
        new THREE.CylinderGeometry(1, 1, 1, 24, 1, true),
        new THREE.MeshBasicMaterial({ color: M.yellow, transparent: true, opacity: 0.4, depthWrite: false, toneMapped: false }),
      );
      mesh.rotation.z = Math.PI / 2;
      group.add(mesh);
      return mesh;
    });
    const labs = [label('unpolarized', X_SOURCE * u, 0.3 * u, 0), ...XS.map((x, i) => label(`P${i + 1}`, x * u, (R_POL + 0.07) * u, 0))];
    labs.forEach((l) => group.add(l));
    group.add(fatLine([X_SOURCE * u - 0.4, 0, 0, X_END * u, 0, 0], { color: 0x555555, width: 1.2 }));
    const glyphs = new THREE.Group();
    group.add(glyphs);
    group.visible = false;
    return { group, pols, beams, labs, glyphs };
  },
  enter(ctx, handle) {
    handle.group.visible = true;
  },
  exit(ctx, handle) {
    handle.group.visible = false;
  },
  recompute(state, computed) {
    computed.pol = malusChain(state.I0, [state.a, state.b, state.c].slice(0, state.n), null);
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
      if (on) h.pols[i].userData.axis.rotation.x = (angles[i] * Math.PI) / 180;
    }

    while (h.glyphs.children.length) {
      const ch = h.glyphs.children[0];
      h.glyphs.remove(ch);
      disposeTree(ch);
    }
    const xs = [X_SOURCE, ...XS.slice(0, state.n), X_END];
    for (let i = 0; i < 4; i++) {
      const beam = h.beams[i];
      if (i > state.n) {
        beam.visible = false;
        continue;
      }
      const frac = Math.max(0, p.steps[i].I / state.I0);
      const x0 = xs[i];
      const x1 = xs[i + 1];
      const r = (0.012 + 0.035 * Math.sqrt(frac)) * u;
      beam.visible = frac > 1e-4;
      beam.position.set(((x0 + x1) / 2) * u, 0, 0);
      beam.scale.set(r, (x1 - x0) * u, r);
      beam.material.opacity = 0.1 + 0.45 * frac;

      const center = new THREE.Vector3(((x0 + x1) / 2) * u, 0, 0);
      const len = E_LEN * Math.sqrt(frac) * u;
      if (i === 0) {
        for (const deg of [0, 45, 90, 135]) {
          const a = (deg * Math.PI) / 180;
          h.glyphs.add(eGlyph(center, new THREE.Vector3(0, Math.cos(a), Math.sin(a)), len, M.white));
        }
      } else if (frac > 1e-4) {
        const a = (angles[i - 1] * Math.PI) / 180;
        h.glyphs.add(eGlyph(center, new THREE.Vector3(0, Math.cos(a), Math.sin(a)), len, M.white));
      }
    }
    ctx.grid.visible = true;
  },
  law: () => [String.raw`I = I_0\cos^2\theta\qquad\text{(Malus)}`, String.raw`\text{unpolarized }\to\text{ polarizer: }I=I_0/2`],
  liveRows(state, computed) {
    const p = computed.pol;
    if (!p) return '';
    const rows = [kv(String.raw`$I_0$ (unpolarized in)`, fmtIrr(state.I0))];
    for (let i = 1; i < p.steps.length; i++) {
      const s = p.steps[i];
      const prev = p.steps[i - 1];
      const how = prev.axis == null ? String.raw`$\times \tfrac{1}{2}$` : `$\\times \\cos^2 ${Math.abs(s.axis - prev.axis).toFixed(0)}^\\circ$`;
      rows.push(kv(`after $P_${i}$ (${s.axis.toFixed(0)}°, ${how})`, `${fmtIrr(s.I)} (${((s.I / state.I0) * 100).toFixed(1)}%)`));
    }
    rows.push(kv(String.raw`$I/I_0$`, qv('qI', (p.I / state.I0).toFixed(3))));
    return rows.join('');
  },
  readout(state, computed) {
    const p = computed.pol;
    if (!p) return '';
    const frac = p.I / state.I0;
    const last = state.n >= 2 ? Math.abs([state.a, state.b, state.c][state.n - 1] - [state.a, state.b, state.c][state.n - 2]) : null;
    return cells([
      ['Filters', String(state.n), ''],
      [String.raw`$I$ out`, fmtIrr(p.I), frac < 0.02 ? 'bad' : 'ok'],
      [String.raw`$I/I_0$`, frac.toFixed(3), ''],
      [String.raw`last $\theta$`, last == null ? '— (unpolarized in)' : `${last.toFixed(0)}°`, ''],
    ]);
  },
  coach(state, computed) {
    const p = computed.pol;
    const frac = p ? p.I / state.I0 : 0;
    if (state.n === 1) {
      return {
        title: 'One polarizer passes half of unpolarized light',
        body: [
          String.raw`Unpolarized light has $\vec{E}$ pointing every which way — the star of arrows. A polarizer keeps only the component along its gold axis, and averaging $\cos^2$ over every direction gives one half:`,
          eq(String.raw`I = \tfrac{1}{2}I_0`),
          'What comes out oscillates along a single line.',
        ],
      };
    }
    if (state.n === 2 && Math.abs(((state.b - state.a + 90) % 180) - 90) < 4) {
      return {
        title: 'Crossed polarizers — Malus gives zero',
        body: [
          String.raw`At $\theta = 90^\circ$, $\cos^2\theta = 0$: the second filter asks for the component of $\vec{E}$ along an axis perpendicular to the light it receives, and there is none.`,
          String.raw`Put a third filter between them at $45^\circ$ and the light comes back:`,
          eq(String.raw`\tfrac{1}{2}I_0 \cdot \tfrac{1}{2} \cdot \tfrac{1}{2} = \tfrac{1}{8}I_0`),
        ],
      };
    }
    if (state.n === 3 && frac > 0.05) {
      return {
        title: 'A filter in the middle brings the light back',
        body: [
          `$P_1$ at ${state.a.toFixed(0)}° passes $\\tfrac{1}{2}I_0$. $P_2$ at ${state.b.toFixed(0)}° keeps $\\cos^2$ of the angle between them and rotates the $\\vec{E}$ arrow onto its own axis; $P_3$ at ${state.c.toFixed(0)}° does the same.`,
          String.raw`$P_1$ and $P_3$ alone would be crossed, but $P_2$ leaves $P_3$ something to keep — at $0^\circ/45^\circ/90^\circ$ that is $\tfrac{1}{8}I_0$.`,
        ],
      };
    }
    return {
      title: 'Malus’s law is a projection, squared',
      body: [
        String.raw`Only the component along the axis gets through, so $E_{\text{out}} = E_{\text{in}}\cos\theta$. Intensity goes as $E^2$:`,
        eq(String.raw`I = I_0\cos^2\theta`),
        'Watch the white arrow shrink as you turn a filter away from the one before it.',
      ],
    };
  },
});
