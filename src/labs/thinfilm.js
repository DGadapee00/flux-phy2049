import * as THREE from 'three';
import { CSS2DObject } from 'three/addons/renderers/CSS2DRenderer.js';
import { defineLab } from './define.js';
import { M, fatLine, fatSegments, markAnswer, setFatSegments, segmentCapacity, updateFatLine } from '../scene/manim.js';
import { UNITS_PER_METER } from '../physics/constants.js';
import { thinFilm, wavelengthRGB } from '../physics/waveoptics.js';
import { drawTwoWaves, stepVerdict } from '../scene/wavebench.js';
import { kv, cells, qv, eq } from '../ui/shared.js';

/**
 * Ch 65 · thin-film interference.
 *
 * Two reflections come back from the film: one off the top, one off the bottom. Whether they add
 * or cancel depends on the extra 2t the second one travels *and* on which reflections flip by half
 * a wavelength.
 *
 * The film is drawn to scale *with the wave*: the drawn thickness and the drawn wavelength share one
 * scale, so a quarter-wave film really is a quarter of a drawn wavelength thick, the wave inside it
 * really is n times shorter, and the two waves that leave the top carry the real phase difference.
 * A flip shows as the wave turning over at the surface. Only the angle is stretched: the rays come
 * in a little off straight so the two reflections can be told apart, while every number is the
 * straight-on (normal incidence) one the course uses.
 */

const MEDIA = [
  { n: 1, label: 'air' },
  { n: 1.33, label: 'water' },
  { n: 1.5, label: 'glass' },
  { n: 1.9, label: 'a high-index layer' },
];

const SCENARIOS = [
  { id: 'soap', name: 'Soap film in air · 600 nm', nf: 1.33, ns: 1, lam: 600e-9, want: 'bright' },
  { id: 'ar', name: 'MgF₂ on glass — the anti-reflection coating', nf: 1.38, ns: 1.5, lam: 550e-9, want: 'dark' },
  { id: 'oil', name: 'Oil on water', nf: 1.5, ns: 1.33, lam: 580e-9, want: 'bright' },
  { id: 'coat', name: 'Low-index film on a high-index layer', nf: 1.4, ns: 1.9, lam: 520e-9, want: 'dark' },
];

const X_L = -0.3;
const X_R = 0.3;
const Y_TOP = 0.0;
const SUB_H = 0.2;
// Drawing metres per real metre for the film and the wave alike: 600 nm draws as 0.09.
const K = 0.09 / 600e-9;
const TILT = (14 * Math.PI) / 180; // off straight-on, only so the two reflections separate
const HIT_X = -0.14;
const RAY_LEN = 0.3;
const AMP = 0.016;
const WAVE_PTS = 90;
// The thickness strips across the top: what a wedge of this film looks like, thin to thick.
const STRIP_Y1 = 0.475; // laser-light strip centre
const STRIP_Y2 = 0.425; // white-light strip centre
const STRIP_H = 0.04;
const STRIP_TEX = 512;

function label(html, anchorX = 0.5) {
  const el = document.createElement('div');
  el.className = 'circuit-label';
  el.innerHTML = html;
  const o = new CSS2DObject(el);
  o.center.set(anchorX, 0.5);
  return o;
}

/**
 * The colour this film reflects in white light: every visible wavelength, weighted by how well it
 * comes back, against what a perfect mirror would send back. So a film that cancels everything
 * looks black (a soap film just before it pops) and one that returns everything looks white.
 */
const WHITE = (() => {
  let r = 0;
  let g = 0;
  let b = 0;
  for (let nm = 400; nm <= 700; nm += 5) {
    const c = wavelengthRGB(nm * 1e-9);
    r += c.r;
    g += c.g;
    b += c.b;
  }
  return { r, g, b };
})();
function reflectedColor(nf, ns, t) {
  let r = 0;
  let g = 0;
  let b = 0;
  for (let nm = 400; nm <= 700; nm += 5) {
    const lam = nm * 1e-9;
    const R = thinFilm({ nFilm: nf, nSub: ns, lambda: lam, t }).reflectance;
    const c = wavelengthRGB(lam);
    r += c.r * R;
    g += c.g * R;
    b += c.b * R;
  }
  const ch = (v, w) => Math.round(245 * Math.pow(v / w, 0.8));
  return { r: ch(r, WHITE.r), g: ch(g, WHITE.g), b: ch(b, WHITE.b) };
}

/** The strip's thickness range: the slider's, or further if a thicker film was typed in. */
const stripMax = (t) => Math.max(800e-9, t * 1.1);

function wavePath(n) {
  return fatLine(new Array(n * 3).fill(0), { color: M.white, width: 2.2 });
}

export default defineLab({
  id: 'thinfilm',
  exam: 'wave',
  title: 'Thin film',
  hint: 'Count the half-wave flips first — they decide whether λ/4 is bright or dark',
  orbit: false,
  camera: { pos: new THREE.Vector3(0, 0.6, 10.6), target: new THREE.Vector3(0, 0.6, 0) },
  keys: { r: 'reset', R: 'reset' },
  scenarios: SCENARIOS,
  defaultState() {
    return { scenarioId: 'soap', nf: 1.33, ns: 1, lam: 600e-9, t: 112.78e-9 };
  },
  applyScenario(id, state) {
    const sc = SCENARIOS.find((s) => s.id === id) || SCENARIOS[0];
    const f = thinFilm({ nFilm: sc.nf, nSub: sc.ns, lambda: sc.lam });
    Object.assign(state, { scenarioId: sc.id, nf: sc.nf, ns: sc.ns, lam: sc.lam, t: sc.want === 'dark' ? f.tDark : f.tBright });
  },
  controls() {
    return `
        <div class="lab-block">
          <label class="field">
            <span>Wavelength λ</span>
            <div class="slider-row">
              <input type="range" id="tf-lam" min="380" max="720" step="1" value="600" />
              <span class="mono val" id="tf-lam-val">600 nm</span>
              <input type="number" class="num" id="tf-lam-num" min="200" max="1200" step="1" value="600" />
            </div>
          </label>
          <label class="field">
            <span>Film index n<sub>film</sub></span>
            <div class="slider-row">
              <input type="range" id="tf-nf" min="1.05" max="2.6" step="0.01" value="1.33" />
              <span class="mono val" id="tf-nf-val">1.33</span>
              <input type="number" class="num" id="tf-nf-num" min="1.01" max="4" step="0.01" value="1.33" />
            </div>
          </label>
          <label class="field">
            <span>What is underneath</span>
            <select id="tf-ns">
              ${MEDIA.map((m) => `<option value="${m.n}">${m.label} (n = ${m.n.toFixed(2)})</option>`).join('')}
            </select>
          </label>
          <label class="field">
            <span>Film thickness t</span>
            <div class="slider-row">
              <input type="range" id="tf-t" min="1" max="800" step="1" value="113" />
              <span class="mono val" id="tf-t-val">113 nm</span>
              <input type="number" class="num" id="tf-t-num" min="1" max="5000" step="1" value="113" />
            </div>
          </label>
          <div class="seg" id="tf-snap">
            <button type="button" data-snap="bright">thinnest bright</button>
            <button type="button" data-snap="dark">thinnest dark</button>
          </div>
          <p class="tiny">The film is drawn to scale with the wave: a 150 nm film is a quarter of a drawn 600 nm wavelength thick. The rays come in a little off straight only so the two reflections separate; every number is the straight-on one. The strips along the top are a wedge of this film, thin to thick — in the laser light above, and in white light, where the white line marks this t.</p>
        </div>`;
  },
  bind(api) {
    const $ = (id) => document.getElementById(id);
    const pair = (id, key, toSI) => {
      const s = $(`tf-${id}`);
      const n = $(`tf-${id}-num`);
      s.addEventListener('input', (e) => {
        api.slice()[key] = toSI(Number(e.target.value));
        api.bump(false);
      });
      if (n) {
        n.addEventListener('change', (e) => {
          const v = Number(e.target.value);
          if (!Number.isFinite(v) || v <= 0) return;
          api.slice()[key] = toSI(v);
          if (v < Number(s.min)) s.min = String(v);
          if (v > Number(s.max)) s.max = String(v);
          api.bump(false);
        });
      }
    };
    pair('lam', 'lam', (v) => v * 1e-9);
    pair('nf', 'nf', (v) => v);
    pair('t', 't', (v) => v * 1e-9);
    $('tf-ns').addEventListener('change', (e) => {
      api.slice().ns = Number(e.target.value);
      api.bump(false);
    });
    $('tf-snap').addEventListener('click', (e) => {
      const btn = e.target.closest('[data-snap]');
      if (!btn) return;
      const st = api.slice();
      const f = thinFilm({ nFilm: st.nf, nSub: st.ns, lambda: st.lam });
      st.t = btn.dataset.snap === 'dark' ? f.tDark : f.tBright;
      api.bump(false);
    });
  },
  syncControls(state) {
    const $ = (id) => document.getElementById(id);
    const set = (id, val, text) => {
      const s = $(`tf-${id}`);
      if (s) {
        if (val > Number(s.max)) s.max = String(val);
        if (val < Number(s.min)) s.min = String(val);
        s.value = String(val);
      }
      const v = $(`tf-${id}-val`);
      if (v) v.textContent = text;
      const n = $(`tf-${id}-num`);
      if (n && document.activeElement !== n) n.value = String(val);
    };
    set('lam', state.lam * 1e9, `${(state.lam * 1e9).toFixed(0)} nm`);
    set('nf', state.nf, state.nf.toFixed(2));
    set('t', Math.round(state.t * 1e9), `${(state.t * 1e9).toFixed(1)} nm`);
    const sel = $('tf-ns');
    if (sel) sel.value = String(state.ns);
  },
  init(ctx) {
    const u = UNITS_PER_METER;
    const group = new THREE.Group();
    ctx.scene.add(group);

    // Unit-height slab and substrate, scaled to the film's drawn thickness every sync.
    const slab = new THREE.Mesh(
      new THREE.PlaneGeometry((X_R - X_L) * u, 1),
      new THREE.MeshBasicMaterial({ color: 0x2c5a6a, transparent: true, opacity: 0.55, toneMapped: false, side: THREE.DoubleSide }),
    );
    group.add(slab);
    const substrate = new THREE.Mesh(
      new THREE.PlaneGeometry((X_R - X_L) * u, SUB_H * u),
      new THREE.MeshBasicMaterial({ color: 0x2a2f3a, transparent: true, opacity: 0.85, toneMapped: false, side: THREE.DoubleSide }),
    );
    group.add(substrate);
    const faces = fatSegments(segmentCapacity(2), { color: M.white, width: 2 });
    group.add(faces);

    // Faint straight rays under the waves, so the path reads even where the wave is small.
    const rays = fatSegments(segmentCapacity(5), { color: 0x6a6a6a, width: 1.2 });
    group.add(rays);
    const waves = {
      in: wavePath(WAVE_PTS),
      top: wavePath(WAVE_PTS),
      down: wavePath(24),
      up: wavePath(24),
      out: wavePath(WAVE_PTS),
    };
    waves.top.material.color.set(M.teal);
    waves.down.material.color.set(M.gold);
    waves.up.material.color.set(M.gold);
    waves.out.material.color.set(M.gold);
    Object.values(waves).forEach((w) => group.add(w));
    // How the two reflected waves line up is the answer to every problem here, and the wave inside
    // the film shows whether the bottom reflection flips.
    markAnswer(waves.top);
    markAnswer(waves.down);
    markAnswer(waves.up);
    markAnswer(waves.out);

    // Strips: thickness from 0 to the right, under laser light and under white light.
    const mkStrip = (y) => {
      const canvas = document.createElement('canvas');
      canvas.width = STRIP_TEX;
      canvas.height = 4;
      const texture = new THREE.CanvasTexture(canvas);
      const mesh = new THREE.Mesh(
        new THREE.PlaneGeometry((X_R - X_L) * u, STRIP_H * u),
        new THREE.MeshBasicMaterial({ map: texture, toneMapped: false }),
      );
      mesh.position.set(((X_L + X_R) / 2) * u, y * u, 0);
      markAnswer(mesh);
      group.add(mesh);
      return { canvas, texture, mesh };
    };
    const stripLaser = mkStrip(STRIP_Y1);
    const stripWhite = mkStrip(STRIP_Y2);
    const stripTicks = fatSegments(segmentCapacity(12), { color: 0x9a9a9a, width: 1.2 });
    group.add(stripTicks);
    const stripMark = fatSegments(segmentCapacity(2), { color: M.white, width: 2.4 });
    markAnswer(stripMark);
    group.add(stripMark);
    const tickLabels = [];
    for (let i = 0; i < 9; i++) {
      const l = label('');
      l.element.classList.add('tick-small');
      group.add(l);
      tickLabels.push(l);
    }

    const labels = {
      top: label('', 0),
      bottom: label('', 0),
      film: label('', 1),
      sub: label('', 0),
      verdict: label(''),
      laser: label('', 0),
      white: label('<small>white light</small>', 0),
      wedge: label('<small>a wedge of this film, thin → thick</small>', 0),
    };
    // Which reflections flip is itself a question the problems ask.
    markAnswer(labels.verdict);
    markAnswer(labels.top);
    markAnswer(labels.bottom);
    Object.values(labels).forEach((l) => group.add(l));

    const insetEl = document.createElement('div');
    insetEl.className = 'wave-inset';
    insetEl.innerHTML = '<div class="wave-inset-title">The two reflected waves</div><canvas width="360" height="200"></canvas>';
    const inset = new CSS2DObject(insetEl);
    inset.center.set(0, 1);
    markAnswer(inset);
    group.add(inset);
    const captionEl = document.createElement('div');
    captionEl.className = 'wave-inset-caption';
    const caption = new CSS2DObject(captionEl);
    caption.center.set(0, 0);
    markAnswer(caption);
    group.add(caption);

    group.visible = false;
    return {
      group, slab, substrate, faces, rays, waves, stripLaser, stripWhite, stripTicks, stripMark, tickLabels, labels,
      inset, insetCanvas: insetEl.querySelector('canvas'), caption, phase: 0, geo: null,
    };
  },
  enter(ctx, handle) {
    handle.group.visible = true;
  },
  exit(ctx, handle) {
    handle.group.visible = false;
  },
  recompute(state, computed) {
    const f = thinFilm({ nFilm: state.nf, nSub: state.ns, lambda: state.lam, t: state.t });
    computed.film = {
      shifts: f.shifts,
      topShift: state.nf > 1,
      bottomShift: state.ns > state.nf,
      lambdaFilm: f.lambdaFilm,
      tBright: f.tBright,
      tDark: f.tDark,
      reflectance: f.reflectance,
      pathWaves: f.pathWaves,
      extraPath: 2 * state.nf * state.t,
      bright: f.reflectance > 0.5,
    };
  },
  syncViews(state, computed, ctx) {
    const h = ctx.handle;
    const c = computed.film;
    if (!h || !c) return;
    const u = UNITS_PER_METER;
    const rgb = wavelengthRGB(state.lam);

    // The film, to scale with the wave (never thinner than a hairline, so a 1 nm film still shows).
    const td = Math.max(0.002, state.t * K);
    h.slab.scale.set(1, td * u, 1);
    h.slab.position.set(0, (Y_TOP - td / 2) * u, 0);
    h.substrate.position.set(0, (Y_TOP - td - SUB_H / 2) * u, 0);
    h.faces.material.color.set(M.white);
    setFatSegments(h.faces, [
      X_L * u, Y_TOP * u, 0, X_R * u, Y_TOP * u, 0,
      X_L * u, (Y_TOP - td) * u, 0, X_R * u, (Y_TOP - td) * u, 0,
    ]);

    // Ray geometry: in from the upper left, off the top at A; down to B, back up to C, out.
    const sin = Math.sin(TILT);
    const cos = Math.cos(TILT);
    const thT = Math.asin(sin / state.nf);
    const A = [HIT_X, Y_TOP];
    const B = [HIT_X + td * Math.tan(thT), Y_TOP - td];
    const C = [HIT_X + 2 * td * Math.tan(thT), Y_TOP];
    const In0 = [A[0] - RAY_LEN * sin, A[1] + RAY_LEN * cos];
    const Top1 = [A[0] + RAY_LEN * sin, A[1] + RAY_LEN * cos];
    const Out1 = [C[0] + RAY_LEN * sin, C[1] + RAY_LEN * cos];
    const P = (p) => [p[0] * u, p[1] * u, 0];
    setFatSegments(h.rays, [...P(In0), ...P(A), ...P(A), ...P(Top1), ...P(A), ...P(B), ...P(B), ...P(C), ...P(C), ...P(Out1)]);
    const lamD = state.lam * K;
    h.geo = {
      A, B, C, In0, Top1, Out1, lamD,
      ell: Math.hypot(B[0] - A[0], B[1] - A[1]),
      // Phases, in radians, that the real physics gives each wave at the top surface.
      flipTop: c.topShift ? Math.PI : 0,
      flipBot: c.bottomShift ? Math.PI : 0,
      film: (2 * Math.PI * c.extraPath) / state.lam,
    };
    h.waves.in.material.color.setRGB(rgb.r / 255, rgb.g / 255, rgb.b / 255);

    // Strips: the laser strip bright where 2nt puts this λ in step, the white strip in true colour.
    const tMax = stripMax(state.t);
    const paint = (strip, fn) => {
      const g2 = strip.canvas.getContext('2d');
      const img = g2.createImageData(STRIP_TEX, 4);
      for (let i = 0; i < STRIP_TEX; i++) {
        const col = fn(((i + 0.5) / STRIP_TEX) * tMax);
        for (let j = 0; j < 4; j++) {
          const k = (j * STRIP_TEX + i) * 4;
          img.data[k] = col.r;
          img.data[k + 1] = col.g;
          img.data[k + 2] = col.b;
          img.data[k + 3] = 255;
        }
      }
      g2.putImageData(img, 0, 0);
      strip.texture.needsUpdate = true;
    };
    paint(h.stripLaser, (t) => {
      const R = thinFilm({ nFilm: state.nf, nSub: state.ns, lambda: state.lam, t }).reflectance;
      return { r: rgb.r * R, g: rgb.g * R, b: rgb.b * R };
    });
    paint(h.stripWhite, (t) => reflectedColor(state.nf, state.ns, t));
    const xOfT = (t) => X_L + ((X_R - X_L) * t) / tMax;
    const ticks = [];
    const step = tMax > 1200e-9 ? 500e-9 : 200e-9;
    let li = 0;
    for (let t = 0; t <= tMax + 1e-12; t += step) {
      const x = xOfT(t);
      ticks.push(x * u, (STRIP_Y2 - STRIP_H / 2) * u, 0, x * u, (STRIP_Y2 - STRIP_H / 2 - 0.012) * u, 0);
      if (li < h.tickLabels.length) {
        const l = h.tickLabels[li++];
        l.visible = true;
        l.position.set(x * u, (STRIP_Y2 - STRIP_H / 2 - 0.03) * u, 0);
        const last = t + step > tMax + 1e-12;
        l.element.innerHTML = `<small>${Math.round(t * 1e9)}${last ? ' nm' : ''}</small>`;
      }
    }
    for (; li < h.tickLabels.length; li++) h.tickLabels[li].visible = false;
    setFatSegments(h.stripTicks, ticks);
    const xt = xOfT(state.t);
    setFatSegments(h.stripMark, [xt * u, (STRIP_Y2 - STRIP_H / 2 - 0.004) * u, 0.01, xt * u, (STRIP_Y1 + STRIP_H / 2 + 0.012) * u, 0.01]);

    const L = h.labels;
    L.laser.position.set((X_R + 0.012) * u, STRIP_Y1 * u, 0);
    L.laser.element.innerHTML = `<small>${(state.lam * 1e9).toFixed(0)} nm light</small>`;
    L.white.position.set((X_R + 0.012) * u, STRIP_Y2 * u, 0);
    L.wedge.position.set(X_L * u, (STRIP_Y1 + STRIP_H / 2 + 0.022) * u, 0);
    L.top.position.set((A[0] + 0.07) * u, (Y_TOP + 0.03) * u, 0);
    L.top.element.innerHTML = c.topShift ? 'top reflection: <b>½λ flip</b>' : 'top reflection: no flip';
    L.bottom.position.set((B[0] + 0.07) * u, (Y_TOP - td - 0.035) * u, 0);
    L.bottom.element.innerHTML = c.bottomShift ? 'bottom reflection: <b>½λ flip</b>' : 'bottom reflection: no flip';
    L.film.position.set((X_R - 0.012) * u, (Y_TOP - td / 2 + (td < 0.03 ? 0.025 : 0)) * u, 0);
    L.film.element.innerHTML = `<small>film n = ${state.nf.toFixed(2)} &middot; t = ${(state.t * 1e9).toFixed(1)} nm</small>`;
    L.sub.position.set((X_L + 0.012) * u, (Y_TOP - td - SUB_H / 2) * u, 0);
    L.sub.element.innerHTML = `<small>underneath: n = ${state.ns.toFixed(2)}</small>`;
    L.verdict.position.set(HIT_X * u, (Y_TOP + RAY_LEN + 0.035) * u, 0);
    L.verdict.element.innerHTML = c.bright
      ? `<b>${(state.lam * 1e9).toFixed(0)} nm comes back strongly</b>`
      : `${(state.lam * 1e9).toFixed(0)} nm is cancelled`;

    h.inset.position.set(0.08 * u, (Y_TOP + 0.13) * u, 0);
    h.caption.position.set(0.08 * u, (Y_TOP + 0.13) * u, 0);
    h.caption.element.innerHTML = `2nt = ${(c.extraPath / state.lam).toFixed(2)}λ${c.shifts ? ` + ${c.shifts} flip${c.shifts > 1 ? 's' : ''}` : ''} &middot; ${stepVerdict(c.pathWaves)}`;

    ctx.grid.visible = false;
  },
  afterFrame(dt, state, computed, ctx) {
    const h = ctx.handle;
    const g = h?.geo;
    const c = computed.film;
    if (!g || !c) return;
    const u = UNITS_PER_METER;
    const k = (2 * Math.PI) / g.lamD;
    // Crests drift at a fixed drawn speed, about 6 cm of bench a second.
    h.phase = (h.phase + k * 0.06 * dt) % (2 * Math.PI * 1000);
    const w = h.phase;
    const kf = g.ell > 0 ? g.film / (2 * g.ell) : 0;
    // Lay a wave along the segment p0→p1: phaseAt(s) for s in drawing metres along it.
    const lay = (line, n, p0, p1, phaseAt) => {
      const dx = p1[0] - p0[0];
      const dy = p1[1] - p0[1];
      const len = Math.hypot(dx, dy) || 1e-9;
      const nx = -dy / len;
      const ny = dx / len;
      const out = new Array(n * 3);
      for (let i = 0; i < n; i++) {
        const s = (len * i) / (n - 1);
        const a = AMP * Math.cos(phaseAt(s) - w);
        out[i * 3] = (p0[0] + (dx * s) / len + nx * a) * u;
        out[i * 3 + 1] = (p0[1] + (dy * s) / len + ny * a) * u;
        out[i * 3 + 2] = 0.01;
      }
      updateFatLine(line, out);
    };
    const inLen = Math.hypot(g.A[0] - g.In0[0], g.A[1] - g.In0[1]);
    // Phase zero at A for the arriving wave; everything after is measured from there.
    lay(h.waves.in, WAVE_PTS, g.In0, g.A, (s) => k * (s - inLen));
    lay(h.waves.top, WAVE_PTS, g.A, g.Top1, (s) => k * s + g.flipTop);
    lay(h.waves.down, 24, g.A, g.B, (s) => kf * s);
    lay(h.waves.up, 24, g.B, g.C, (s) => kf * (g.ell + s) + g.flipBot);
    // Out of the top, referenced to the same wavefronts as the top reflection, so the two can be
    // compared crest for crest.
    const along = (g.C[0] - g.A[0]) * Math.sin(TILT);
    lay(h.waves.out, WAVE_PTS, g.C, g.Out1, (s) => k * (s + along) + g.film + g.flipBot);
    drawTwoWaves(
      h.insetCanvas, w, [c.topShift ? 0.5 : 0, c.extraPath / state.lam + (c.bottomShift ? 0.5 : 0)],
      wavelengthRGB(state.lam), ['off top', 'off bottom', 'together'],
    );
  },
  law: () => [
    String.raw`\lambda_{\text{film}} = \frac{\lambda}{n_{\text{film}}}`,
    String.raw`\text{odd number of flips: }2t = \left(m+\tfrac12\right)\lambda_{\text{film}}\ \text{bright}`,
    String.raw`\text{even: }2t = m\lambda_{\text{film}}\ \text{bright}`,
  ],
  liveRows(state, computed) {
    const c = computed.film;
    if (!c) return '';
    return [
      kv(String.raw`$\lambda$ (in air)`, `${(state.lam * 1e9).toFixed(0)} nm`),
      kv(String.raw`$\lambda_{\text{film}} = \lambda/n$`, `${(c.lambdaFilm * 1e9).toFixed(1)} nm`),
      kv('half-wave flips', qv('qV', `${c.shifts} (${c.topShift ? 'top' : '—'}${c.bottomShift ? ' + bottom' : ''})`)),
      kv('extra path $2nt$', `${(c.extraPath * 1e9).toFixed(1)} nm = ${(c.extraPath / state.lam).toFixed(3)}λ`),
      kv('total, with the flips', `${c.pathWaves.toFixed(3)}λ`),
      kv(String.raw`thinnest bright $t$`, qv('qV', `${(c.tBright * 1e9).toFixed(2)} nm`)),
      kv(String.raw`thinnest dark $t$`, qv('qV', `${(c.tDark * 1e9).toFixed(2)} nm`)),
    ].join('');
  },
  readout(state, computed) {
    const c = computed.film;
    if (!c) return '';
    return cells([
      ['flips', String(c.shifts), ''],
      [String.raw`$t_{\text{bright}}$`, `${(c.tBright * 1e9).toFixed(2)} nm`, 'ok'],
      [String.raw`$t_{\text{dark}}$`, `${(c.tDark * 1e9).toFixed(2)} nm`, ''],
      ['reflected now', `${(c.reflectance * 100).toFixed(0)}%`, c.bright ? 'ok' : 'bad'],
    ]);
  },
  coach(state, computed) {
    const c = computed.film;
    if (!c) return { title: '', body: '' };
    const odd = c.shifts % 2 === 1;
    return {
      title: `${c.shifts} half-wave flip${c.shifts === 1 ? '' : 's'} — so ${odd ? 'a quarter-wave film is bright' : 'a quarter-wave film is dark'}`,
      body: [
        String.raw`Two rays come back: one off the top of the film, one off the bottom. The second travels an extra $2t$ inside the film, where the wavelength is shorter:`,
        eq(String.raw`\lambda_{\text{film}} = \frac{\lambda}{n_{\text{film}}}`),
        String.raw`That alone would say "bright when $2t$ is a whole number of $\lambda_{\text{film}}$". But a reflection off a higher index flips the wave by half a wavelength, and here ${c.topShift ? 'the top' : 'neither the top'}${c.bottomShift ? ' and the bottom' : c.topShift ? ' but not the bottom' : ''} do${c.shifts === 1 ? 'es' : ''}.`,
        odd
          ? String.raw`One flip is an odd number, so the two rays start out already half a wavelength apart. The extra path has to make up the other half:`
          : String.raw`${c.shifts === 0 ? 'No flips' : 'Two flips'} cancel out — the rays start in step, so the extra path has to be a whole number of wavelengths:`,
        eq(odd
          ? String.raw`2t = \left(m + \tfrac12\right)\lambda_{\text{film}} \;\Rightarrow\; t_{\min} = \frac{\lambda}{4n}`
          : String.raw`2t = m\lambda_{\text{film}} \;\Rightarrow\; t_{\min} = \frac{\lambda}{2n}`),
        String.raw`That is the whole trick of an anti-reflection coating: pick a film whose index sits between air and glass so both reflections flip, and a quarter-wave layer then cancels instead of reinforcing.`,
      ],
    };
  },
});
