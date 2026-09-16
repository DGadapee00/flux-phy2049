import * as THREE from 'three';
import { CSS2DObject } from 'three/addons/renderers/CSS2DRenderer.js';
import { defineLab } from './define.js';
import { Arrow, M, fatLine, disposeTree } from '../scene/manim.js';
import { imageOf, principalRays, fmtCm } from '../physics/optics.js';
import { kv, cells } from '../ui/shared.js';

const SCENARIOS = [
  { id: 'concave-out', name: 'Concave, object beyond C — real reduced', type: 'concave', fAbs: 12, do: 36, ho: 8 },
  { id: 'concave-c', name: 'Concave, object at C — real same size', type: 'concave', fAbs: 12, do: 24, ho: 8 },
  { id: 'concave-f', name: 'Concave, between F and C — real enlarged', type: 'concave', fAbs: 12, do: 18, ho: 6 },
  { id: 'concave-in', name: 'Concave, inside F — virtual enlarged', type: 'concave', fAbs: 12, do: 8, ho: 6 },
  { id: 'convex', name: 'Convex — always virtual, reduced', type: 'convex', fAbs: 12, do: 20, ho: 8 },
];

const U = 0.26;

function label(html, x, y) {
  const el = document.createElement('div');
  el.className = 'circuit-label';
  el.innerHTML = html;
  const o = new CSS2DObject(el);
  o.position.set(x * U, y * U, 0.04);
  o.userData.el = el;
  return o;
}

function flat(pts) {
  const o = [];
  for (const p of pts) o.push(p.x * U, p.y * U, 0);
  return o;
}

function wipe(g) {
  while (g.children.length) {
    const ch = g.children[0];
    g.remove(ch);
    disposeTree(ch);
  }
}

function fOf(state) {
  return state.type === 'concave' ? state.fAbs : -state.fAbs;
}

function arrowVert(x, y, color) {
  const dir = new THREE.Vector3(0, Math.sign(y) || 1, 0);
  const len = Math.abs(y) * U;
  const origin = y >= 0 ? new THREE.Vector3(x * U, 0, 0) : new THREE.Vector3(x * U, y * U, 0);
  return new Arrow(dir, origin, Math.max(0.15, len), color, 0.22, 0.16, 0.018);
}

export default defineLab({
  id: 'mirrors',
  exam: 'e7',
  title: 'Mirrors',
  hint: 'Move the object through F — the image jumps from real to virtual',
  orbit: false,
  camera: { pos: new THREE.Vector3(-4, 0.2, 16), target: new THREE.Vector3(-4, 0.2, 0) },
  keys: { r: 'reset', R: 'reset' },
  scenarios: SCENARIOS,
  defaultState() {
    return { scenarioId: 'concave-out', type: 'concave', fAbs: 12, do: 36, ho: 8, anim: { playing: false, i: 0 } };
  },
  applyScenario(id, state) {
    const sc = SCENARIOS.find((s) => s.id === id) || SCENARIOS[0];
    Object.assign(state, { scenarioId: sc.id, type: sc.type, fAbs: sc.fAbs, do: sc.do, ho: sc.ho });
  },
  controls() {
    return `
        <div class="lab-block">
          <div class="seg" id="mir-type">
            <button type="button" data-type="concave" class="active">Concave f&gt;0</button>
            <button type="button" data-type="convex">Convex f&lt;0</button>
          </div>
          <label class="field">
            <span>|f|</span>
            <div class="slider-row">
              <input type="range" id="mir-f" min="6" max="30" step="0.5" value="12" />
              <span class="mono val" id="mir-f-val">12 cm</span>
            </div>
          </label>
          <label class="field">
            <span>Object distance d_o</span>
            <div class="slider-row">
              <input type="range" id="mir-do" min="5" max="70" step="0.5" value="36" />
              <span class="mono val" id="mir-do-val">36 cm</span>
            </div>
          </label>
          <label class="field">
            <span>Object height h_o</span>
            <div class="slider-row">
              <input type="range" id="mir-ho" min="2" max="16" step="0.5" value="8" />
              <span class="mono val" id="mir-ho-val">8.0 cm</span>
            </div>
          </label>
          <p class="tiny">1/f = 1/d_o + 1/d_i, m = −d_i/d_o = h_i/h_o. Concave (f&gt;0) can make a real inverted image; convex (f&lt;0) is always virtual, upright, reduced.</p>
        </div>`;
  },
  bind(api) {
    const $ = (id) => document.getElementById(id);
    $('mir-type').addEventListener('click', (e) => {
      const btn = e.target.closest('[data-type]');
      if (!btn) return;
      api.slice().type = btn.dataset.type;
      api.bump();
    });
    $('mir-f').addEventListener('input', (e) => {
      api.slice().fAbs = Number(e.target.value);
      api.bump(false);
    });
    $('mir-do').addEventListener('input', (e) => {
      api.slice().do = Number(e.target.value);
      api.bump(false);
    });
    $('mir-ho').addEventListener('input', (e) => {
      api.slice().ho = Number(e.target.value);
      api.bump(false);
    });
  },
  syncControls(state) {
    const $ = (id) => document.getElementById(id);
    document.querySelectorAll('#mir-type [data-type]').forEach((b) => {
      b.classList.toggle('active', b.dataset.type === state.type);
    });
    $('mir-f').value = state.fAbs;
    $('mir-f-val').textContent = fmtCm(state.fAbs);
    $('mir-do').value = state.do;
    $('mir-do-val').textContent = fmtCm(state.do);
    $('mir-ho').value = state.ho;
    $('mir-ho-val').textContent = fmtCm(state.ho);
  },
  init(ctx) {
    const group = new THREE.Group();
    ctx.scene.add(group);
    const draw = new THREE.Group();
    group.add(draw);
    group.visible = false;
    return { group, draw };
  },
  enter(ctx, handle) {
    handle.group.visible = true;
  },
  exit(ctx, handle) {
    handle.group.visible = false;
  },
  recompute(state, computed) {
    const f = fOf(state);
    computed.mir = {
      f,
      ...imageOf({ f, do: state.do, ho: state.ho, kind: 'mirror' }),
      bundle: principalRays({ f, do: state.do, ho: state.ho, kind: 'mirror', span: 80 }),
    };
  },
  syncViews(state, computed, ctx) {
    const h = ctx.handle;
    const m = computed.mir;
    if (!h || !m) return;
    wipe(h.draw);
    const f = m.f;
    h.draw.add(fatLine([-80 * U, 0, 0, 25 * U, 0, 0], { color: 0x666666, width: 1.5 }));
    const pts = [];
    for (let i = -16; i <= 16; i++) {
      const y = i * 1.2;
      const x = f > 0 ? -(y * y) / (4 * f) : (y * y) / (4 * Math.abs(f));
      pts.push(x * U, y * U, 0);
    }
    h.draw.add(fatLine(pts, { color: M.white, width: 3.4 }));

    const colors = [M.gold, 0x5cd0b3, M.blue];
    m.bundle.rays.forEach((ray, i) => {
      if (ray.length < 2) return;
      h.draw.add(fatLine(flat(ray), { color: colors[i % 3], width: 2.2, dashed: !m.real && !m.infinite }));
    });

    h.draw.add(arrowVert(-state.do, state.ho, M.gold));
    h.draw.add(label('object', -state.do, state.ho + 2.2));
    if (!m.infinite && Number.isFinite(m.imageX)) {
      h.draw.add(arrowVert(m.imageX, m.hi, m.real ? 0xfc6255 : M.blue));
      h.draw.add(label(m.real ? 'real image' : 'virtual image', m.imageX, m.hi + (m.hi >= 0 ? 2.2 : -3)));
    }
    h.draw.add(label('F', -f, -3.2));
    h.draw.add(label('C', -2 * f, -3.2));
    h.draw.add(label('V', 1.5, -3.2));
    // ticks
    h.draw.add(fatLine([-f * U, -0.4 * U, 0, -f * U, 0.4 * U, 0], { color: M.gold, width: 2 }));
    h.draw.add(fatLine([-2 * f * U, -0.4 * U, 0, -2 * f * U, 0.4 * U, 0], { color: M.white, width: 2 }));
    ctx.grid.visible = false;
  },
  law: () => [
    String.raw`\dfrac{1}{f}=\dfrac{1}{d_o}+\dfrac{1}{d_i}`,
    String.raw`m=-\dfrac{d_i}{d_o}=\dfrac{h_i}{h_o}\qquad f>0\text{ concave}`,
  ],
  liveRows(state, computed) {
    const m = computed.mir;
    if (!m) return '';
    return [
      kv('f', fmtCm(m.f)),
      kv('d_o', fmtCm(state.do)),
      kv('d_i', m.infinite ? '∞' : fmtCm(m.di)),
      kv('1/f', (1 / m.f).toFixed(3) + ' cm⁻¹'),
      kv('1/d_o + 1/d_i', m.infinite ? '1/f' : (1 / state.do + 1 / m.di).toFixed(3) + ' cm⁻¹'),
      kv('m = −d_i/d_o', m.infinite ? '∞' : m.m.toFixed(2)),
      kv('h_i', m.infinite ? '∞' : fmtCm(m.hi)),
      kv('Image', m.type),
    ].join('');
  },
  readout(state, computed) {
    const m = computed.mir;
    if (!m) return '';
    return cells([
      ['d_i', m.infinite ? '∞' : fmtCm(m.di), m.real ? 'ok' : ''],
      ['m', m.infinite ? '∞' : m.m.toFixed(2), ''],
      ['Image', m.type, m.real ? '' : 'warn'],
      ['f', fmtCm(m.f), ''],
    ]);
  },
  coach(state, computed) {
    const m = computed.mir;
    if (state.type === 'convex') {
      return {
        title: 'Convex mirror — f is negative',
        body: 'Diverging, like a diverging lens. The image is always virtual, upright, and reduced, behind the mirror (d_i < 0). Car side mirrors are this: you see a wide field, and objects are closer than they appear because |m| < 1.',
      };
    }
    if (m?.infinite) {
      return {
        title: 'Object at F — rays come out parallel',
        body: '1/d_i = 0 so the image is at infinity. A concave mirror with a bulb at F is a spotlight. Nudge d_o either side of F and the image snaps from real (inverted) to virtual (upright).',
      };
    }
    if (m?.real) {
      return {
        title: 'Real image — on the same side as the object',
        body: `${m.type}. d_i > 0 means the rays actually cross in front of the mirror. Gold / teal / blue are the three principal rays: parallel→F, through C, through F→parallel. They meet at the image.`,
      };
    }
    return {
      title: 'Virtual image — behind the mirror',
      body: `Object is inside F, so d_i < 0. The reflected rays diverge; your eye traces them back through the glass. ${m?.type}. Makeup mirrors put your face inside F on purpose.`,
    };
  },
});
