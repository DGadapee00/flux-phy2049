import * as THREE from 'three';
import { defineLab } from './define.js';
import { M } from '../scene/manim.js';
import { imageOf, principalRays, twoLenses, traceRay, fmtCm } from '../physics/optics.js';
import { RAY_COLORS, wipe, label, line, arrowAt, tick, drawBundle, frameCamera, imageMark } from '../scene/opticsBench.js';
import { kv, cells, eq } from '../ui/shared.js';

/** Microscope: final virtual image at the 25 cm near point. Telescope: final image at infinity. */
const NEAR_POINT = 25;
const relaxedTeleSep = (f1, f2, d_o) => 1 / (1 / f1 - 1 / d_o) + f2;
const nearPointMicroSep = (f1, f2, d_o) => 1 / (1 / f1 - 1 / d_o) + 1 / (1 / f2 + 1 / NEAR_POINT);

const SCENARIOS = [
  { id: 'conv-far', name: 'Converging, object beyond 2F — real, reduced', mode: 'single', type: 'conv', fAbs: 12, do: 36, ho: 8 },
  { id: 'conv-2f', name: 'Converging, object at 2F — real, same size', mode: 'single', type: 'conv', fAbs: 12, do: 24, ho: 8 },
  { id: 'conv-f2f', name: 'Converging, between F and 2F — real, enlarged', mode: 'single', type: 'conv', fAbs: 12, do: 18, ho: 5 },
  { id: 'conv-in', name: 'Converging, inside F — magnifying glass', mode: 'single', type: 'conv', fAbs: 12, do: 8, ho: 5 },
  { id: 'div', name: 'Diverging — always virtual, reduced', mode: 'single', type: 'div', fAbs: 12, do: 24, ho: 8 },
  { id: 'tele', name: 'Keplerian telescope — object 10 m away', mode: 'tele', type: 'conv', fAbs: 40, do: 1000, ho: 50, f2: 10, sep: relaxedTeleSep(40, 10, 1000) },
  { id: 'micro', name: 'Compound microscope — image at 25 cm', mode: 'micro', type: 'conv', fAbs: 4, do: 5, ho: 2, f2: 10, sep: nearPointMicroSep(4, 10, 5) },
];

function fOf(state) {
  return state.type === 'div' ? -state.fAbs : state.fAbs;
}

function drawLens(group, x, f, halfHeight) {
  const bow = f > 0 ? 1.4 : -1.4;
  const left = [];
  const right = [];
  for (let i = -16; i <= 16; i++) {
    const y = (i / 16) * halfHeight;
    const dx = bow * (1 - (y / halfHeight) ** 2) + (f > 0 ? 0 : 0.5);
    left.push({ x: x - dx, y });
    right.push({ x: x + dx, y });
  }
  group.add(line(left, { color: M.blue, width: 2.4 }));
  group.add(line(right, { color: M.blue, width: 2.4 }));
  group.add(line([{ x, y: -halfHeight }, { x, y: halfHeight }], { color: M.blue, width: 1, opacity: 0.5, dashed: true }));
}

/** Rays for a two-lens system, from the object tip through objective and eyepiece. */
function systemRays(state, sys) {
  const els = [
    { x: 0, f: state.fAbs },
    { x: state.sep, f: state.f2 },
  ];
  const obj = { x: -state.do, y: state.ho };
  const aperture = state.mode === 'tele' ? 7 : 3;
  const xEnd = state.sep + (state.mode === 'tele' ? 45 : 20);
  const xStart = -Math.min(state.do, state.mode === 'tele' ? 45 : state.do);
  return [0, aperture, -aperture].map((yHit) => {
    const slope = (yHit - obj.y) / (0 - obj.x);
    const start = { x: xStart, y: obj.y + slope * (xStart - obj.x) };
    const tr = traceRay(els, start, slope, xEnd);
    let extension = null;
    if (sys.i2 && !sys.i2.infinite && !sys.i2.real) {
      const xi = state.sep + sys.i2.di;
      extension = [tr.exit, { x: xi, y: tr.exit.y + tr.slope * (xi - tr.exit.x) }];
    }
    return { pts: tr.pts, extension, slope: tr.slope, slopeIn: slope };
  });
}

function framing(state) {
  if (state.mode === 'tele') return frameCamera([-45, 0, state.sep, state.sep + 45], [14]);
  if (state.mode === 'micro') {
    const sys = twoLenses({ f1: state.fAbs, f2: state.f2, do1: state.do, ho: state.ho, sep: state.sep });
    return frameCamera([-state.do, state.sep, state.sep + 20, state.sep + (sys.i2?.di ?? 0)], [sys.i2?.hi ?? 20, sys.i1?.hi ?? 8]);
  }
  const f = fOf(state);
  const img = imageOf({ f, do: state.do, ho: state.ho, kind: 'lens' });
  const xs = [-state.do, 0, f, -f, 10];
  if (!img.infinite) xs.push(img.imageX);
  return frameCamera(xs, [state.ho, img.hi]);
}

export default defineLab({
  id: 'lenses',
  exam: 'e7',
  title: 'Lenses',
  hint: 'Same equation as the mirror — f > 0 converges',
  orbit: false,
  camera: frameCamera([-36, 0, 12, -12, 18], [8, -4]),
  cameraFor: framing,
  keys: { r: 'reset', R: 'reset' },
  scenarios: SCENARIOS,
  defaultState() {
    return { scenarioId: 'conv-far', mode: 'single', type: 'conv', fAbs: 12, do: 36, ho: 8, f2: 10, sep: 50, anim: { playing: false, i: 0 } };
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
    const slider = (id, text) => `
          <label class="field" id="wrap-${id}">
            <span id="${id}-label">${text}</span>
            <div class="slider-row">
              <input type="range" id="${id}" />
              <span class="mono val" id="${id}-val"></span>
            </div>
          </label>`;
    return `
        <div class="lab-block">
          <div class="seg" id="len-type">
            <button type="button" data-type="conv" class="active">Converging f&gt;0</button>
            <button type="button" data-type="div">Diverging f&lt;0</button>
          </div>
          ${slider('len-f', '<i>|f|</i>')}
          ${slider('len-do', 'Object distance <i>d</i><sub>o</sub>')}
          ${slider('len-ho', 'Object height <i>h</i><sub>o</sub>')}
          ${slider('len-f2', 'Eyepiece <i>f</i><sub>e</sub>')}
          ${slider('len-sep', 'Lens separation')}
          <button type="button" class="btn ghost" id="len-focus"></button>
          <p class="tiny" id="len-note"></p>
        </div>`;
  },
  bind(api) {
    const $ = (id) => document.getElementById(id);
    $('len-type').addEventListener('click', (e) => {
      const btn = e.target.closest('[data-type]');
      if (!btn) return;
      const s = api.slice();
      s.type = btn.dataset.type;
      if (s.mode !== 'single') Object.assign(s, { mode: 'single', scenarioId: s.type === 'div' ? 'div' : 'conv-far', fAbs: 12, do: 36, ho: 8 });
      api.bump();
      api.resetCamera();
    });
    const num = (id, key) => {
      $(id).addEventListener('input', (e) => {
        api.slice()[key] = Number(e.target.value);
        api.bump(false);
      });
      $(id).addEventListener('change', () => api.resetCamera());
    };
    num('len-f', 'fAbs');
    num('len-do', 'do');
    num('len-ho', 'ho');
    num('len-f2', 'f2');
    num('len-sep', 'sep');
    $('len-focus').addEventListener('click', () => {
      const s = api.slice();
      s.sep = s.mode === 'tele' ? relaxedTeleSep(s.fAbs, s.f2, s.do) : nearPointMicroSep(s.fAbs, s.f2, s.do);
      api.bump(false);
      api.resetCamera();
    });
  },
  syncControls(state) {
    const $ = (id) => document.getElementById(id);
    const two = state.mode !== 'single';
    const tele = state.mode === 'tele';
    document.querySelectorAll('#len-type [data-type]').forEach((b) => {
      b.classList.toggle('active', !two && b.dataset.type === state.type);
    });
    const set = (id, v, min, max, step, text) => {
      const el = $(id);
      el.min = min;
      el.max = max;
      el.step = step;
      if (document.activeElement !== el) el.value = v;
      $(`${id}-val`).textContent = text;
    };
    $('len-f-label').innerHTML = two ? 'Objective <i>f</i><sub>o</sub>' : '<i>|f|</i>';
    set('len-f', state.fAbs, two ? 2 : 6, two ? 60 : 50, 0.5, fmtCm(state.fAbs));
    set('len-do', state.do, tele ? 200 : two ? 4.2 : 4, tele ? 5000 : two ? 20 : 80, tele ? 10 : 0.1, fmtCm(state.do));
    set('len-ho', state.ho, tele ? 10 : 1, tele ? 200 : 16, 0.5, fmtCm(state.ho));
    set('len-f2', state.f2, 2, 20, 0.5, fmtCm(state.f2));
    set('len-sep', state.sep, 5, 90, 0.1, fmtCm(state.sep));
    $('wrap-len-f2').hidden = !two;
    $('wrap-len-sep').hidden = !two;
    $('len-focus').hidden = !two;
    $('len-focus').textContent = tele ? 'Focus for a relaxed eye (image at ∞)' : 'Put the final image at 25 cm';
    $('len-note').textContent = two
      ? tele
        ? 'The objective forms a small real image at its focus; the eyepiece, one f_e further on, sends every ray out parallel. What grows is the angle, not the size.'
        : 'A short-focus objective makes a large real intermediate image just inside the eyepiece focus; the eyepiece acts as a magnifier on it.'
      : '1/f = 1/d_o + 1/d_i, m = −d_i/d_o. Solid lines are real rays; dashed lines are extensions back to a virtual image. The view re-frames when you let go of a slider.';
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
    if (state.mode === 'single') {
      const f = fOf(state);
      const img = imageOf({ f, do: state.do, ho: state.ho, kind: 'lens' });
      const span = Math.max(40, Number.isFinite(img.di) ? Math.abs(img.di) + 15 : 40, 2 * Math.abs(f) + 10);
      computed.len = { mode: 'single', f, ...img, bundle: principalRays({ f, do: state.do, ho: state.ho, kind: 'lens', span }) };
      return;
    }
    const sys = twoLenses({ f1: state.fAbs, f2: state.f2, do1: state.do, ho: state.ho, sep: state.sep });
    const rays = systemRays(state, sys);
    const chief = rays[0];
    computed.len = {
      mode: state.mode,
      ...sys,
      rays,
      angularM: chief.slope / chief.slopeIn,
      angularIdeal: -state.fAbs / state.f2,
      tube: state.sep - state.fAbs - state.f2,
      microEstimate: -((state.sep - state.fAbs - state.f2) / state.fAbs) * (NEAR_POINT / state.f2),
    };
  },
  syncViews(state, computed, ctx) {
    const h = ctx.handle;
    const L = computed.len;
    if (!h || !L) return;
    wipe(h.draw);
    ctx.grid.visible = false;

    if (L.mode === 'single') {
      const halfH = Math.min(40, Math.max(14, state.ho + 6, Number.isFinite(L.hi) ? Math.abs(L.hi) + 6 : 0));
      const left = -(Math.max(state.do, 2 * Math.abs(L.f)) + 15);
      const right = Math.max(2 * Math.abs(L.f), Number.isFinite(L.di) ? Math.abs(L.di) : 0) + 15;
      h.draw.add(line([{ x: left, y: 0 }, { x: right, y: 0 }], { color: 0x666666, width: 1.5 }));
      drawLens(h.draw, 0, L.f, halfH);
      drawBundle(h.draw, L.bundle);
      h.draw.add(arrowAt(-state.do, state.ho, M.gold));
      h.draw.add(label('object', -state.do, state.ho + 3));
      if (!L.infinite && Number.isFinite(L.imageX)) {
        imageMark(h.draw, L.imageX, L.hi, L.real ? M.red : M.blue, L.real ? 'real image' : 'virtual image', L.hi + (L.hi >= 0 ? 3 : -3.5));
      }
      tick(h.draw, L.f, 'F', M.gold);
      tick(h.draw, -L.f, 'F', M.gold);
      if (L.f > 0) {
        tick(h.draw, 2 * L.f, '2F');
        tick(h.draw, -2 * L.f, '2F');
      }
      return;
    }

    const tele = L.mode === 'tele';
    const objH = tele ? 12 : Math.max(8, state.ho + 3);
    const eyeH = tele ? 12 : Math.max(10, Math.abs(L.i1?.hi ?? 0) + 3);
    const xLeft = tele ? -45 : -state.do - 6;
    const xRight = state.sep + (tele ? 45 : 20);
    h.draw.add(line([{ x: xLeft, y: 0 }, { x: xRight, y: 0 }], { color: 0x666666, width: 1.5 }));
    drawLens(h.draw, 0, state.fAbs, objH);
    drawLens(h.draw, state.sep, state.f2, eyeH);
    h.draw.add(label('objective', 0, objH + 3));
    h.draw.add(label('eyepiece', state.sep, eyeH + 3));
    L.rays.forEach((r, i) => {
      const color = RAY_COLORS[i % RAY_COLORS.length];
      h.draw.add(line(r.pts, { color, width: 2.2 }));
      if (r.extension) h.draw.add(line(r.extension, { color, width: 1.5, opacity: 0.7, dashed: true }));
    });
    if (tele) {
      h.draw.add(label(`← object ${fmtCm(state.do)} away`, -26, 12));
    } else {
      h.draw.add(arrowAt(-state.do, state.ho, M.gold));
      h.draw.add(label('object', -state.do, state.ho + 2.5));
    }
    if (L.i1 && !L.i1.infinite) {
      imageMark(h.draw, L.i1.imageX, L.i1.hi, M.yellow, 'intermediate (real)', L.i1.hi + (L.i1.hi >= 0 ? 2.5 : tele ? -7 : -3));
    }
    if (L.i2 && !L.i2.infinite && Number.isFinite(L.i2.di) && Math.abs(L.i2.di) < 400) {
      const x2 = state.sep + L.i2.di;
      imageMark(h.draw, x2, L.i2.hi, L.i2.real ? M.red : M.blue, L.i2.real ? 'final (real)' : 'final (virtual)', L.i2.hi + (L.i2.hi >= 0 ? 2.5 : -3));
    } else if (L.i2) {
      h.draw.add(label('final image at ∞ — rays leave parallel', state.sep + 30, -11));
    }
    tick(h.draw, state.fAbs, '<i>F</i><sub>o</sub>', M.gold);
    tick(h.draw, state.sep - state.f2, '<i>F</i><sub>e</sub>', M.gold);
  },
  law(state) {
    if (state.mode === 'tele') {
      return [String.raw`\dfrac{1}{f}=\dfrac{1}{d_o}+\dfrac{1}{d_i}\ \text{for each lens}`, String.raw`M_\theta=\dfrac{\theta_{\text{out}}}{\theta_{\text{in}}}\approx-\dfrac{f_o}{f_e}`];
    }
    if (state.mode === 'micro') {
      return [String.raw`M = m_o\,m_e = \left(-\dfrac{d_{i1}}{d_{o1}}\right)\left(-\dfrac{d_{i2}}{d_{o2}}\right)`, String.raw`M\approx-\dfrac{L}{f_o}\,\dfrac{25\ \text{cm}}{f_e}`];
    }
    return [String.raw`\dfrac{1}{f}=\dfrac{1}{d_o}+\dfrac{1}{d_i}`, String.raw`m=-\dfrac{d_i}{d_o}=\dfrac{h_i}{h_o}\qquad f>0\text{ converging}`];
  },
  liveRows(state, computed) {
    const L = computed.len;
    if (!L) return '';
    if (L.mode !== 'single') {
      const rows = [
        kv(String.raw`$f_o$ objective, $f_e$ eyepiece`, `${fmtCm(state.fAbs)}, ${fmtCm(state.f2)}`),
        kv('Separation', fmtCm(state.sep)),
        kv(String.raw`$d_o$`, fmtCm(state.do)),
        kv(String.raw`intermediate image $d_{i1}$`, L.i1?.infinite ? '∞' : fmtCm(L.i1.di)),
        kv(String.raw`eyepiece object distance $d_{o2}$`, Number.isFinite(L.do2) ? fmtCm(L.do2) : '∞'),
        kv(String.raw`final image $d_{i2}$`, !L.i2 || L.i2.infinite ? '∞' : fmtCm(L.i2.di)),
      ];
      if (L.mode === 'tele') {
        rows.push(kv(String.raw`$M_\theta$ traced (chief ray)`, L.angularM.toFixed(2)));
        rows.push(kv(String.raw`$-f_o/f_e$`, L.angularIdeal.toFixed(2)));
      } else {
        rows.push(kv(String.raw`$M = m_o m_e$ (exact)`, Number.isFinite(L.M) ? L.M.toFixed(1) : '∞'));
        rows.push(kv(String.raw`tube length $L = s - f_o - f_e$`, fmtCm(L.tube)));
        rows.push(kv(String.raw`$-(L/f_o)(25\,\text{cm}/f_e)$ estimate`, L.microEstimate.toFixed(1)));
      }
      return rows.join('');
    }
    return [
      kv(String.raw`$f$`, fmtCm(L.f)),
      kv(String.raw`$d_o$`, fmtCm(state.do)),
      kv(String.raw`$d_i$`, L.infinite ? '∞' : `${fmtCm(L.di)} ${L.di > 0 ? '(far side)' : '(object side)'}`),
      kv(String.raw`$1/d_o + 1/d_i$`, L.infinite ? `$1/f$ = ${(1 / L.f).toFixed(4)} cm⁻¹` : `${(1 / state.do + 1 / L.di).toFixed(4)} cm⁻¹`),
      kv(String.raw`$1/f$`, `${(1 / L.f).toFixed(4)} cm⁻¹`),
      kv(String.raw`$m = -d_i/d_o$`, L.infinite ? '∞' : L.m.toFixed(3)),
      kv(String.raw`$h_i$`, L.infinite ? '∞' : fmtCm(L.hi)),
      kv('Image', L.type),
    ].join('');
  },
  readout(state, computed) {
    const L = computed.len;
    if (!L) return '';
    if (L.mode === 'tele') {
      return cells([
        [String.raw`$M_\theta$ (traced)`, L.angularM.toFixed(2), ''],
        [String.raw`$-f_o/f_e$`, L.angularIdeal.toFixed(2), ''],
        ['Final image', !L.i2 || L.i2.infinite ? '∞' : fmtCm(L.i2.di), L.i2?.infinite ? 'ok' : ''],
        ['Separation', fmtCm(state.sep), ''],
      ]);
    }
    if (L.mode === 'micro') {
      return cells([
        [String.raw`$M$ exact`, Number.isFinite(L.M) ? L.M.toFixed(1) : '∞', ''],
        ['Estimate', L.microEstimate.toFixed(1), ''],
        ['Intermediate', L.i1?.infinite ? '∞' : fmtCm(L.i1.di), ''],
        ['Final image', !L.i2 || L.i2.infinite ? '∞' : fmtCm(L.i2.di), ''],
      ]);
    }
    return cells([
      [String.raw`$d_i$`, L.infinite ? '∞' : fmtCm(L.di), L.real ? 'ok' : ''],
      [String.raw`$m$`, L.infinite ? '∞' : L.m.toFixed(2), ''],
      ['Image', L.type, L.real ? '' : 'warn'],
      [String.raw`$f$`, fmtCm(L.f), ''],
    ]);
  },
  coach(state, computed) {
    const L = computed.len;
    if (state.mode === 'tele') {
      const relaxed = L?.i2?.infinite || (L?.i2 && Math.abs(L.i2.di) > 400);
      return {
        title: 'Telescope — it magnifies angles',
        body: [
          `The objective ($f_o$ = ${fmtCm(state.fAbs)}) images the distant object near its focus. ${
            relaxed
              ? 'That image sits at the eyepiece focus, so every ray leaves parallel — a relaxed eye sees it at infinity.'
              : 'Press “Focus for a relaxed eye” to move the eyepiece so that image lands on its focus.'
          }`,
          eq(String.raw`M_\theta \approx -\frac{f_o}{f_e} = ${L?.angularIdeal.toFixed(2)}`),
          `Compare the ray angles going in and coming out: the traced value is ${L?.angularM.toFixed(2)}. The minus sign means the view is inverted.`,
        ],
      };
    }
    if (state.mode === 'micro') {
      return {
        title: 'Microscope — two stages of magnification',
        body: [
          `The object sits just outside $f_o$, so the objective throws a large real, inverted image ($m_o$ = ${L?.i1 ? L.i1.m.toFixed(1) : '—'}). That image lands just inside the eyepiece focus, and the eyepiece works as a magnifying glass on it.`,
          eq(String.raw`M = m_o m_e = ${Number.isFinite(L?.M) ? L.M.toFixed(1) : '\infty'}`),
          `The textbook estimate $-(L/f_o)(25\\,\\text{cm}/f_e)$ = ${L?.microEstimate.toFixed(1)} is the same idea with the final image at infinity.`,
        ],
      };
    }
    if (state.type === 'div') {
      return {
        title: String.raw`Diverging lens — $f$ is negative`,
        body: [
          String.raw`Every refracted ray (solid) spreads away from the axis. Traced backward (dashed) they meet on the object side: a virtual, upright, reduced image.`,
          String.raw`Gold: parallel in, leaving as if from the near $F$. Teal: straight through the centre. Blue: aimed at the far $F$, leaving parallel.`,
        ],
      };
    }
    if (L?.infinite) {
      return {
        title: String.raw`Object at $F$ — rays leave parallel`,
        body: String.raw`A point source at the focus makes a parallel beam — a collimator, or a searchlight. Slide $d_o$ inside $F$ and the image turns virtual and enlarged: a magnifying glass.`,
      };
    }
    if (L?.real) {
      return {
        title: 'Real image — light really gathers on the far side',
        body: `${L.type}. Gold: parallel, then through $F$. Teal: straight through the centre. Blue: through the near $F$, then parallel. All three cross at $d_i$ = ${fmtCm(L.di)}, where a screen would show the image.`,
      };
    }
    return {
      title: String.raw`Magnifying glass — object inside $F$`,
      body: `The refracted rays (solid) still diverge after the lens, so they never cross. Extend them backward (dashed) and they meet ${fmtCm(-(L?.di ?? 0))} in front of the lens: ${L?.type}. That upright, enlarged image is what your eye sees.`,
    };
  },
});
