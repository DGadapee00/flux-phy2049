import * as THREE from 'three';
import { CSS2DObject } from 'three/addons/renderers/CSS2DRenderer.js';
import { defineLab } from './define.js';
import { Arrow, M, fatLine, disposeTree } from '../scene/manim.js';
import { imageOf, principalRays, twoLenses, fmtCm } from '../physics/optics.js';
import { kv, cells } from '../ui/shared.js';

const SCENARIOS = [
  { id: 'conv-far', name: 'Converging, object beyond 2F — real reduced', mode: 'single', type: 'conv', fAbs: 12, do: 36, ho: 8 },
  { id: 'conv-2f', name: 'Converging, object at 2F — real same size', mode: 'single', type: 'conv', fAbs: 12, do: 24, ho: 8 },
  { id: 'conv-in', name: 'Converging, inside F — virtual enlarged', mode: 'single', type: 'conv', fAbs: 12, do: 8, ho: 6 },
  { id: 'div', name: 'Diverging — always virtual, reduced', mode: 'single', type: 'div', fAbs: 12, do: 24, ho: 8 },
  { id: 'tele', name: 'Keplerian telescope (two lenses)', mode: 'tele', type: 'conv', fAbs: 40, do: 200, ho: 8, f2: 10, sep: 50 },
  { id: 'micro', name: 'Compound microscope (two lenses)', mode: 'micro', type: 'conv', fAbs: 8, do: 10, ho: 4, f2: 12, sep: 42 },
];

const U = 0.22;

function label(html, x, y) {
  const el = document.createElement('div');
  el.className = 'circuit-label';
  el.innerHTML = html;
  const o = new CSS2DObject(el);
  o.position.set(x * U, y * U, 0.04);
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
  return state.type === 'div' ? -state.fAbs : state.fAbs;
}

function arrowVert(x, y, color) {
  const dir = new THREE.Vector3(0, Math.sign(y) || 1, 0);
  const len = Math.abs(y) * U;
  const origin = y >= 0 ? new THREE.Vector3(x * U, 0, 0) : new THREE.Vector3(x * U, y * U, 0);
  return new Arrow(dir, origin, Math.max(0.15, len), color, 0.22, 0.16, 0.018);
}

function drawLens(group, x, f) {
  const h = 16;
  const bow = f > 0 ? 1.6 : -1.6;
  const left = [];
  const right = [];
  for (let i = -12; i <= 12; i++) {
    const y = (i / 12) * h;
    const dx = bow * (1 - (y / h) * (y / h));
    left.push((x - dx) * U, y * U, 0);
    right.push((x + dx) * U, y * U, 0);
  }
  group.add(fatLine(left, { color: 0x58c4dd, width: 2.4 }));
  group.add(fatLine(right, { color: 0x58c4dd, width: 2.4 }));
  group.add(fatLine([x * U, -h * U, 0, x * U, h * U, 0], { color: 0x58c4dd, width: 1.2, dashed: true }));
}

export default defineLab({
  id: 'lenses',
  exam: 'e7',
  title: 'Lenses',
  hint: 'Same equation as the mirror — f > 0 converges',
  orbit: false,
  camera: { pos: new THREE.Vector3(4, 0.2, 17), target: new THREE.Vector3(4, 0.2, 0) },
  cameraFor(state) {
    if (state.mode === 'tele') return { pos: new THREE.Vector3(15, 0.3, 28), target: new THREE.Vector3(15, 0.3, 0) };
    if (state.mode === 'micro') return { pos: new THREE.Vector3(12, 0.3, 20), target: new THREE.Vector3(12, 0.3, 0) };
    return { pos: new THREE.Vector3(4, 0.2, 17), target: new THREE.Vector3(4, 0.2, 0) };
  },
  keys: { r: 'reset', R: 'reset' },
  scenarios: SCENARIOS,
  defaultState() {
    return {
      scenarioId: 'conv-far',
      mode: 'single',
      type: 'conv',
      fAbs: 12,
      do: 36,
      ho: 8,
      f2: 10,
      sep: 50,
      anim: { playing: false, i: 0 },
    };
  },
  applyScenario(id, state) {
    const sc = SCENARIOS.find((s) => s.id === id) || SCENARIOS[0];
    Object.assign(state, {
      scenarioId: sc.id,
      mode: sc.mode,
      type: sc.type,
      fAbs: sc.fAbs,
      do: sc.do,
      ho: sc.ho,
      f2: sc.f2 ?? 10,
      sep: sc.sep ?? 50,
    });
  },
  controls() {
    return `
        <div class="lab-block">
          <div class="seg" id="len-type">
            <button type="button" data-type="conv" class="active">Converging f&gt;0</button>
            <button type="button" data-type="div">Diverging f&lt;0</button>
          </div>
          <label class="field">
            <span>|f| (objective)</span>
            <div class="slider-row">
              <input type="range" id="len-f" min="6" max="50" step="0.5" value="12" />
              <span class="mono val" id="len-f-val">12 cm</span>
            </div>
          </label>
          <label class="field">
            <span>Object distance d_o</span>
            <div class="slider-row">
              <input type="range" id="len-do" min="5" max="80" step="0.5" value="36" />
              <span class="mono val" id="len-do-val">36 cm</span>
            </div>
          </label>
          <label class="field">
            <span>Object height h_o</span>
            <div class="slider-row">
              <input type="range" id="len-ho" min="2" max="16" step="0.5" value="8" />
              <span class="mono val" id="len-ho-val">8.0 cm</span>
            </div>
          </label>
          <label class="field" id="wrap-len-f2">
            <span>Eyepiece f₂</span>
            <div class="slider-row">
              <input type="range" id="len-f2" min="4" max="20" step="0.5" value="10" />
              <span class="mono val" id="len-f2-val">10 cm</span>
            </div>
          </label>
          <label class="field" id="wrap-len-sep">
            <span>Lens separation</span>
            <div class="slider-row">
              <input type="range" id="len-sep" min="20" max="80" step="1" value="50" />
              <span class="mono val" id="len-sep-val">50 cm</span>
            </div>
          </label>
          <p class="tiny">Same equation as the mirror. A telescope is two converging lenses about f₁+f₂ apart; a microscope puts a real intermediate image at the eyepiece’s front focus.</p>
        </div>`;
  },
  bind(api) {
    const $ = (id) => document.getElementById(id);
    $('len-type').addEventListener('click', (e) => {
      const btn = e.target.closest('[data-type]');
      if (!btn) return;
      api.slice().type = btn.dataset.type;
      api.slice().mode = 'single';
      api.bump();
    });
    const num = (id, key) =>
      $(id).addEventListener('input', (e) => {
        api.slice()[key] = Number(e.target.value);
        api.bump(false);
      });
    num('len-f', 'fAbs');
    num('len-do', 'do');
    num('len-ho', 'ho');
    num('len-f2', 'f2');
    num('len-sep', 'sep');
  },
  syncControls(state) {
    const $ = (id) => document.getElementById(id);
    document.querySelectorAll('#len-type [data-type]').forEach((b) => {
      b.classList.toggle('active', b.dataset.type === state.type);
    });
    $('len-f').value = state.fAbs;
    $('len-f-val').textContent = fmtCm(state.fAbs);
    $('len-do').value = state.do;
    $('len-do-val').textContent = fmtCm(state.do);
    $('len-ho').value = state.ho;
    $('len-ho-val').textContent = fmtCm(state.ho);
    $('len-f2').value = state.f2;
    $('len-f2-val').textContent = fmtCm(state.f2);
    $('len-sep').value = state.sep;
    $('len-sep-val').textContent = fmtCm(state.sep);
    const two = state.mode !== 'single';
    $('wrap-len-f2').hidden = !two;
    $('wrap-len-sep').hidden = !two;
    $('len-type').hidden = two;
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
    if (state.mode === 'single') {
      computed.len = {
        mode: 'single',
        f,
        ...imageOf({ f, do: state.do, ho: state.ho, kind: 'lens' }),
        bundle: principalRays({ f, do: state.do, ho: state.ho, kind: 'lens', span: 90 }),
      };
      return;
    }
    const sys = twoLenses({ f1: state.fAbs, f2: state.f2, do1: state.do, ho: state.ho, sep: state.sep });
    computed.len = { mode: state.mode, f: state.fAbs, ...sys };
  },
  syncViews(state, computed, ctx) {
    const h = ctx.handle;
    const L = computed.len;
    if (!h || !L) return;
    wipe(h.draw);
    h.draw.add(fatLine([-90 * U, 0, 0, 120 * U, 0, 0], { color: 0x666666, width: 1.5 }));

    if (L.mode === 'single') {
      drawLens(h.draw, 0, L.f);
      const colors = [M.gold, 0x5cd0b3, M.blue];
      L.bundle.rays.forEach((ray, i) => {
        if (ray.length < 2) return;
        h.draw.add(fatLine(flat(ray), { color: colors[i % 3], width: 2.2, dashed: !L.real && !L.infinite }));
      });
      h.draw.add(arrowVert(-state.do, state.ho, M.gold));
      h.draw.add(label('object', -state.do, state.ho + 2.4));
      if (!L.infinite && Number.isFinite(L.imageX)) {
        h.draw.add(arrowVert(L.imageX, L.hi, L.real ? 0xfc6255 : M.blue));
        h.draw.add(label(L.real ? 'real image' : 'virtual image', L.imageX, L.hi + (L.hi >= 0 ? 2.4 : -3.2)));
      }
      h.draw.add(label('F', L.f, -3.4));
      h.draw.add(label("F'", -L.f, -3.4));
      h.draw.add(fatLine([L.f * U, -0.4 * U, 0, L.f * U, 0.4 * U, 0], { color: M.gold, width: 2 }));
      h.draw.add(fatLine([-L.f * U, -0.4 * U, 0, -L.f * U, 0.4 * U, 0], { color: M.gold, width: 2 }));
    } else {
      drawLens(h.draw, 0, state.fAbs);
      drawLens(h.draw, state.sep, state.f2);
      h.draw.add(label('objective', 0, 18));
      h.draw.add(label('eyepiece', state.sep, 18));
      h.draw.add(arrowVert(-state.do, state.ho, M.gold));
      h.draw.add(label('object', -state.do, state.ho + 2.4));
      if (L.i1 && !L.i1.infinite) {
        h.draw.add(arrowVert(L.i1.imageX, L.i1.hi, 0xf4d345));
        h.draw.add(label('intermediate', L.i1.imageX, L.i1.hi + (L.i1.hi >= 0 ? 2.2 : -3)));
      }
      if (L.i2 && !L.i2.infinite && Number.isFinite(L.i2.imageX)) {
        const x2 = state.sep + L.i2.imageX;
        h.draw.add(arrowVert(x2, L.i2.hi, L.i2.real ? 0xfc6255 : M.blue));
        h.draw.add(label(L.i2.real ? 'final real' : 'final virtual', x2, L.i2.hi + (L.i2.hi >= 0 ? 2.4 : -3.2)));
      }
      h.draw.add(fatLine([state.fAbs * U, -0.4 * U, 0, state.fAbs * U, 0.4 * U, 0], { color: M.gold, width: 2 }));
      h.draw.add(fatLine([(state.sep - state.f2) * U, -0.4 * U, 0, (state.sep - state.f2) * U, 0.4 * U, 0], { color: M.gold, width: 2 }));
    }
    ctx.grid.visible = false;
  },
  law(state) {
    if (state.mode === 'tele') {
      return [String.raw`\dfrac{1}{f}=\dfrac{1}{d_o}+\dfrac{1}{d_i}`, String.raw`M_{\text{telescope}}\approx -f_o/f_e`];
    }
    if (state.mode === 'micro') {
      return [String.raw`\dfrac{1}{f}=\dfrac{1}{d_o}+\dfrac{1}{d_i}`, String.raw`M_{\text{microscope}}\approx -\dfrac{L}{f_o}\dfrac{25\,\text{cm}}{f_e}`];
    }
    return [
      String.raw`\dfrac{1}{f}=\dfrac{1}{d_o}+\dfrac{1}{d_i}`,
      String.raw`m=-\dfrac{d_i}{d_o}=\dfrac{h_i}{h_o}\qquad f>0\text{ converging}`,
    ];
  },
  liveRows(state, computed) {
    const L = computed.len;
    if (!L) return '';
    if (L.mode !== 'single') {
      const rows = [
        kv('f₁ objective', fmtCm(state.fAbs)),
        kv('f₂ eyepiece', fmtCm(state.f2)),
        kv('separation', fmtCm(state.sep)),
        kv('d_o', fmtCm(state.do)),
        kv('intermediate d_i', L.i1?.infinite ? '∞' : fmtCm(L.i1.di)),
        kv('d_o for eyepiece', Number.isFinite(L.do2) ? fmtCm(L.do2) : '∞'),
        kv('final d_i', !L.i2 || L.i2.infinite ? '∞' : fmtCm(L.i2.di)),
        kv('M = h_final / h_o', !Number.isFinite(L.M) ? '∞' : L.M.toFixed(2)),
      ];
      if (state.mode === 'tele') rows.push(kv('−f₁/f₂ (angular)', (-state.fAbs / state.f2).toFixed(2)));
      return rows.join('');
    }
    return [
      kv('f', fmtCm(L.f)),
      kv('d_o', fmtCm(state.do)),
      kv('d_i', L.infinite ? '∞' : fmtCm(L.di)),
      kv('1/f', (1 / L.f).toFixed(3) + ' cm⁻¹'),
      kv('1/d_o + 1/d_i', L.infinite ? '1/f' : (1 / state.do + 1 / L.di).toFixed(3) + ' cm⁻¹'),
      kv('m', L.infinite ? '∞' : L.m.toFixed(2)),
      kv('h_i', L.infinite ? '∞' : fmtCm(L.hi)),
      kv('Image', L.type),
    ].join('');
  },
  readout(state, computed) {
    const L = computed.len;
    if (!L) return '';
    if (L.mode !== 'single') {
      return cells([
        ['M', !Number.isFinite(L.M) ? '∞' : L.M.toFixed(2), ''],
        ['intermediate', L.i1?.infinite ? '∞' : fmtCm(L.i1.di), ''],
        ['final d_i', !L.i2 || L.i2.infinite ? '∞' : fmtCm(L.i2.di), ''],
        ['−f₁/f₂', (-state.fAbs / state.f2).toFixed(2), ''],
      ]);
    }
    return cells([
      ['d_i', L.infinite ? '∞' : fmtCm(L.di), L.real ? 'ok' : ''],
      ['m', L.infinite ? '∞' : L.m.toFixed(2), ''],
      ['Image', L.type, L.real ? '' : 'warn'],
      ['f', fmtCm(L.f), ''],
    ]);
  },
  coach(state, computed) {
    const L = computed.len;
    if (state.mode === 'tele') {
      return {
        title: 'Telescope — objective + eyepiece',
        body: `Two converging lenses about f₁+f₂ apart. The objective makes a real image near the eyepiece’s front focus; the eyepiece then sends those rays out nearly parallel (image at infinity, relaxed eye). Angular magnification ≈ −f_o/f_e = ${(-state.fAbs / state.f2).toFixed(1)}.`,
      };
    }
    if (state.mode === 'micro') {
      return {
        title: 'Microscope — short f objective',
        body: 'The objective sits close to a small object (d_o just beyond f) and throws a large real intermediate image. The eyepiece uses that as its object. Total M is (objective linear mag) × (eyepiece angular mag).',
      };
    }
    if (state.type === 'div') {
      return {
        title: 'Diverging lens — f is negative',
        body: 'Always a virtual, upright, reduced image on the same side as the object. Same algebra as a convex mirror. The three rays still work: parallel in, as if from F on the incoming side; through the center; toward the far F, then parallel.',
      };
    }
    if (L?.infinite) {
      return {
        title: 'Object at F — collimated output',
        body: 'A point source at F is how you make a beam of parallel rays (searchlight, collimator). Slide d_o inside F and the image becomes virtual and enlarged — a magnifying glass.',
      };
    }
    return {
      title: L?.real ? 'Real image — opposite side of the lens' : 'Virtual image — same side as the object',
      body: `${L?.type}. 1/f = 1/d_o + 1/d_i is the whole machine. Gold / teal / blue are parallel→F, through the center, through F→parallel. They meet at the image, even when you have to extend them backward (virtual).`,
    };
  },
});
