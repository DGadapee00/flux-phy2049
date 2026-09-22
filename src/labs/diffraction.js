import * as THREE from 'three';
import { CSS2DObject } from 'three/addons/renderers/CSS2DRenderer.js';
import { defineLab } from './define.js';
import { M, fatLine, fatSegments, markAnswer, setFatSegments, segmentCapacity } from '../scene/manim.js';
import { UNITS_PER_METER } from '../physics/constants.js';
import {
  singleSlit,
  singleSlitIntensity,
  grating,
  gratingIntensity,
  rayleigh,
  airyIntensity,
  wavelengthRGB,
} from '../physics/waveoptics.js';
import { angleUnit, createRuler, createTank, drawnL, drawnLambda, drawnLog, lengthUnit, niceCeil, paintScreen } from '../scene/wavebench.js';
import { kv, cells, qv, eq } from '../ui/shared.js';

/**
 * Ch 64 · one slit, a grating, and the resolution limit.
 *
 * Same honesty as the Interference lab: the bench is stretched, the pattern is not. Every band on
 * the screen is painted from the real I(θ) for the numbers in the panel, against a ruler that keeps
 * its scale (src/scene/wavebench.js). A single slit's screen is flat and read in mm; a grating's
 * orders swing out to wide angles, so its screen is read in degrees; the resolution screen, in the
 * microradians an Airy disk actually spans.
 */

const SCENARIOS = [
  { id: 'single', name: 'Single slit · 633 nm, a = 0.10 mm, L = 2 m', mode: 'slit', lam: 633e-9, a: 0.1e-3, L: 2, span: 0.05 },
  { id: 'narrow', name: 'Narrower slit — the pattern spreads out', mode: 'slit', lam: 633e-9, a: 0.03e-3, L: 2, span: 0.05 },
  { id: 'grating', name: 'Grating · 600 lines/mm, 500 nm', mode: 'grating', lam: 500e-9, linesPerMM: 600, m: 2, L: 2 },
  { id: 'grating-dense', name: 'Grating · 1200 lines/mm — orders fly apart', mode: 'grating', lam: 500e-9, linesPerMM: 1200, m: 1, L: 2 },
  { id: 'rayleigh', name: 'Rayleigh · 5 mm aperture at 10 km', mode: 'rayleigh', lam: 550e-9, D: 5e-3, Lobj: 10e3, sepFactor: 1, span: 5e-4 },
];

const X_SOURCE = -0.38;
const X_APERTURE = -0.17;
const BARRIER_H = 0.3;
const SCREEN_H = 0.33;
const SCREEN_W = 0.04;
const BEAM = 0.2;
const TEX_W = 8;
const TEX_H = 1024;
const LAMBDA_DRAW_MIN = 0.006;
// A grating's screen covers every angle there is, so it never needs refitting.
const GRATING_SPAN = Math.PI / 2;
const GRATING_MAX_DRAWN = 9;

function label(html, anchorX = 0.5) {
  const el = document.createElement('div');
  el.className = 'circuit-label';
  el.innerHTML = html;
  const o = new CSS2DObject(el);
  o.center.set(anchorX, 0.5);
  return o;
}

/**
 * The screen's half-span when it is fitted: for one slit, real metres that take in the first two
 * minima each side; for resolution, radians across a couple of Airy rings.
 */
function fitSpan(state) {
  if (state.mode === 'rayleigh') return niceCeil((3.4 * 1.22 * state.lam) / state.D);
  return niceCeil((2.5 * state.lam * state.L) / state.a);
}

/** Drawn slit width, and drawn grating pitch: log stand-ins that follow the real a and d. */
const drawnA = (a) => drawnLog(a, 0.01e-3, 1e-3, 0.02, 0.2);
const drawnPitch = (d) => drawnLog(d, 0.5e-6, 20e-6, 0.05, 0.14);

export default defineLab({
  id: 'diffraction',
  exam: 'wave',
  title: 'Diffraction',
  hint: 'Narrow the slit and the pattern spreads — squeeze the light and it fights back',
  orbit: false,
  camera: { pos: new THREE.Vector3(0, 0, 11.2), target: new THREE.Vector3(0, 0, 0) },
  keys: { r: 'reset', R: 'reset' },
  scenarios: SCENARIOS,
  defaultState() {
    return {
      scenarioId: 'single', mode: 'slit', lam: 633e-9, a: 0.1e-3, L: 2, linesPerMM: 600, m: 2, D: 5e-3, Lobj: 10e3, sepFactor: 1,
      spans: { slit: 0.05, rayleigh: 5e-4 }, spanFrom: null, waves: true,
    };
  },
  applyScenario(id, state) {
    const sc = SCENARIOS.find((s) => s.id === id) || SCENARIOS[0];
    Object.assign(state, { scenarioId: sc.id, mode: sc.mode });
    for (const k of ['lam', 'a', 'L', 'linesPerMM', 'm', 'D', 'Lobj', 'sepFactor']) {
      if (sc[k] !== undefined) state[k] = sc[k];
    }
    // Sized on the next recompute, once a problem has had its say (see Interference).
    state.spans = { ...(state.spans || {}), [sc.mode]: null };
    state.spanFrom = sc.id;
  },
  controls() {
    return `
        <div class="lab-block">
          <div class="seg" id="df-mode">
            <button type="button" data-mode="slit" class="active">Single slit</button>
            <button type="button" data-mode="grating">Grating</button>
            <button type="button" data-mode="rayleigh">Resolution</button>
          </div>
          <label class="field">
            <span>Wavelength λ</span>
            <div class="slider-row">
              <input type="range" id="df-lam" min="380" max="720" step="1" value="633" />
              <span class="mono val" id="df-lam-val">633 nm</span>
              <input type="number" class="num" id="df-lam-num" min="200" max="1200" step="1" value="633" />
            </div>
          </label>
          <label class="field" id="wrap-df-a">
            <span>Slit width a</span>
            <div class="slider-row">
              <input type="range" id="df-a" min="0.01" max="1" step="0.005" value="0.1" />
              <span class="mono val" id="df-a-val">0.100 mm</span>
              <input type="number" class="num" id="df-a-num" min="0.002" max="10" step="0.002" value="0.1" />
            </div>
          </label>
          <label class="field" id="wrap-df-N">
            <span>Grating lines per mm</span>
            <div class="slider-row">
              <input type="range" id="df-N" min="50" max="2000" step="10" value="600" />
              <span class="mono val" id="df-N-val">600 /mm</span>
              <input type="number" class="num" id="df-N-num" min="10" max="6000" step="10" value="600" />
            </div>
          </label>
          <label class="field" id="wrap-df-m">
            <span>Order m to mark</span>
            <div class="slider-row">
              <input type="range" id="df-m" min="0" max="6" step="1" value="2" />
              <span class="mono val" id="df-m-val">m = 2</span>
            </div>
          </label>
          <label class="field" id="wrap-df-D">
            <span>Aperture D</span>
            <div class="slider-row">
              <input type="range" id="df-D" min="0.5" max="200" step="0.5" value="5" />
              <span class="mono val" id="df-D-val">5.0 mm</span>
              <input type="number" class="num" id="df-D-num" min="0.1" max="5000" step="0.1" value="5" />
            </div>
          </label>
          <label class="field" id="wrap-df-sep">
            <span>Source separation (× θ<sub>min</sub>)</span>
            <div class="slider-row">
              <input type="range" id="df-sep" min="0.2" max="3" step="0.05" value="1" />
              <span class="mono val" id="df-sep-val">1.00 × θmin</span>
            </div>
          </label>
          <label class="field" id="wrap-df-L">
            <span id="df-L-label">Screen distance L</span>
            <div class="slider-row">
              <input type="range" id="df-L" min="0.3" max="6" step="0.05" value="2" />
              <span class="mono val" id="df-L-val">2.00 m</span>
              <input type="number" class="num" id="df-L-num" min="0.05" max="50" step="0.05" value="2" />
            </div>
          </label>
          <label class="check" id="wrap-df-waves"><input type="checkbox" id="df-waves" checked /> <span>show the waves (off: rays only)</span></label>
          <button type="button" class="btn ghost" id="df-fit">Fit screen to the pattern</button>
          <p class="tiny">The screen keeps its scale while you slide, so what you see grow and shrink is the pattern — read it off the ruler. The bench is stretched; the pattern is not. It is painted from the real I(θ) for the numbers above — sinc² for one slit, the N-slit function for a grating, the Airy disk for a round aperture. A grating's screen is marked in angle.</p>
        </div>`;
  },
  bind(api) {
    const $ = (id) => document.getElementById(id);
    $('df-mode').addEventListener('click', (e) => {
      const btn = e.target.closest('[data-mode]');
      if (!btn) return;
      api.slice().mode = btn.dataset.mode;
      api.bump();
    });
    const pair = (id, key, toSI) => {
      const s = $(`df-${id}`);
      const n = $(`df-${id}-num`);
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
    pair('a', 'a', (v) => v * 1e-3);
    pair('N', 'linesPerMM', (v) => v);
    pair('D', 'D', (v) => v * 1e-3);
    pair('L', 'L', (v) => v);
    $('df-m').addEventListener('input', (e) => {
      api.slice().m = Number(e.target.value);
      api.bump(false);
    });
    $('df-sep').addEventListener('input', (e) => {
      api.slice().sepFactor = Number(e.target.value);
      api.bump(false);
    });
    $('df-waves').addEventListener('change', (e) => {
      api.slice().waves = e.target.checked;
      api.bump(false);
    });
    $('df-fit').addEventListener('click', () => {
      const st = api.slice();
      st.spans = { ...(st.spans || {}), [st.mode]: null };
      st.spanFrom = null;
      api.bump(false);
    });
  },
  syncControls(state) {
    const $ = (id) => document.getElementById(id);
    const set = (id, val, text) => {
      const s = $(`df-${id}`);
      if (s) {
        if (val > Number(s.max)) s.max = String(val);
        if (val < Number(s.min)) s.min = String(val);
        s.value = String(val);
      }
      const v = $(`df-${id}-val`);
      if (v) v.textContent = text;
      const n = $(`df-${id}-num`);
      if (n && document.activeElement !== n) n.value = String(val);
    };
    document.querySelectorAll('#df-mode [data-mode]').forEach((b) => b.classList.toggle('active', b.dataset.mode === state.mode));
    set('lam', state.lam * 1e9, `${(state.lam * 1e9).toFixed(0)} nm`);
    set('a', state.a * 1e3, `${(state.a * 1e3).toFixed(3)} mm`);
    set('N', state.linesPerMM, `${state.linesPerMM.toFixed(0)} /mm`);
    set('m', state.m, `m = ${state.m}`);
    set('D', state.D * 1e3, `${(state.D * 1e3).toFixed(1)} mm`);
    set('sep', state.sepFactor, `${state.sepFactor.toFixed(2)} × θmin`);
    const rayl = state.mode === 'rayleigh';
    set('L', rayl ? state.Lobj / 1e3 : state.L, rayl ? `${(state.Lobj / 1e3).toFixed(1)} km` : `${state.L.toFixed(2)} m`);
    const show = (id, on) => {
      const el = $(`wrap-df-${id}`);
      if (el) el.hidden = !on;
    };
    show('a', state.mode === 'slit');
    show('waves', !rayl);
    show('L', state.mode !== 'grating');
    const fit = $('df-fit');
    if (fit) fit.hidden = state.mode === 'grating';
    const waves = $('df-waves');
    if (waves) waves.checked = state.waves !== false;
    show('N', state.mode === 'grating');
    show('m', state.mode === 'grating');
    show('D', rayl);
    show('sep', rayl);
    const lab = $('df-L-label');
    if (lab) lab.textContent = rayl ? 'Distance to the objects' : 'Screen distance L';
  },
  init(ctx) {
    const u = UNITS_PER_METER;
    const group = new THREE.Group();
    ctx.scene.add(group);
    const tank = createTank(group);
    const axis = fatSegments(segmentCapacity(1), { color: 0x4a4a4a, width: 1.2 });
    group.add(axis);
    // Built at full capacity: a grating comb needs far more segments than a single slit.
    const barrier = fatSegments(segmentCapacity(64), { color: M.white, width: 3 });
    group.add(barrier);
    const frame = fatSegments(segmentCapacity(1), { color: 0x8a8a8a, width: 2 });
    group.add(frame);

    const canvas = document.createElement('canvas');
    canvas.width = TEX_W;
    canvas.height = TEX_H;
    const texture = new THREE.CanvasTexture(canvas);
    texture.minFilter = THREE.LinearFilter;
    texture.magFilter = THREE.LinearFilter;
    const screen = new THREE.Mesh(
      new THREE.PlaneGeometry(SCREEN_W * u, 2 * SCREEN_H * u),
      new THREE.MeshBasicMaterial({ map: texture, toneMapped: false }),
    );
    group.add(screen);
    const ruler = createRuler(group);

    const rays = fatSegments(segmentCapacity(64), { color: M.gold, width: 1.6 });
    group.add(rays);
    const marker = fatSegments(segmentCapacity(8), { color: M.gold, width: 3 });
    markAnswer(marker);
    group.add(marker);
    // A Line2 needs at least one segment up front; syncViews replaces these points every frame.
    const envelope = fatLine([0, 0, 0, 0, 0, 0], { color: M.teal, width: 1.8, opacity: 0.9 });
    group.add(envelope);

    const labels = { source: label(''), aperture: label(''), order: label('', 1), note: label('') };
    markAnswer(labels.order);
    Object.values(labels).forEach((l) => group.add(l));
    group.visible = false;
    return { group, tank, axis, barrier, frame, screen, canvas, texture, ruler, rays, marker, envelope, labels };
  },
  enter(ctx, handle) {
    handle.group.visible = true;
  },
  exit(ctx, handle) {
    handle.group.visible = false;
  },
  recompute(state, computed) {
    if (!state.spans) state.spans = {};
    if (state.mode !== 'grating' && !(state.spans[state.mode] > 0)) {
      const sc = SCENARIOS.find((x) => x.id === state.spanFrom);
      const keys = ['lam', 'a', 'L', 'D'];
      const same = sc && sc.mode === state.mode && keys.every((k) => sc[k] === undefined || sc[k] === state[k]);
      state.spans[state.mode] = same && sc.span ? sc.span : fitSpan(state);
      state.spanFrom = null;
    }
    const ss = singleSlit({ lambda: state.lam, a: state.a, L: state.L });
    const g = grating({ lambda: state.lam, linesPerM: state.linesPerMM * 1e3, N: 12 });
    const r = rayleigh({ lambda: state.lam, D: state.D, L: state.Lobj });
    const thOrder = g.thetaOrder(state.m);
    computed.diff = {
      mode: state.mode,
      ss,
      g,
      r,
      span: state.mode === 'grating' ? GRATING_SPAN : state.spans[state.mode],
      theta1: ss.theta1,
      theta1Deg: ss.theta1 == null ? null : (ss.theta1 * 180) / Math.PI,
      width: ss.width,
      d: g.d,
      thetaOrder: thOrder,
      thetaOrderDeg: thOrder == null ? null : (thOrder * 180) / Math.PI,
      maxOrder: g.maxOrder,
      thetaMin: r.thetaMin,
      separation: r.separation,
      resolved: state.sepFactor >= 1,
    };
  },
  syncViews(state, computed, ctx) {
    const h = ctx.handle;
    const c = computed.diff;
    if (!h || !c) return;
    const u = UNITS_PER_METER;
    const rgb = wavelengthRGB(state.lam);
    const beam = new THREE.Color(`rgb(${rgb.r},${rgb.g},${rgb.b})`);
    const span = c.span;
    const slit = state.mode === 'slit';
    const rayl = state.mode === 'rayleigh';
    // Only the single slit's screen moves with L; the other two are read in angle.
    const Ld = drawnL(slit ? state.L : 2);
    const xScreen = X_APERTURE + Ld;
    // Screen coordinate of a direction θ: real metres (L tanθ) for the slit, the angle itself otherwise.
    const coordOf = (theta) => (slit ? state.L * Math.tan(theta) : theta);
    const thetaOf = (v) => (slit ? Math.atan2(v, state.L) : v);
    const yOf = (theta) => Math.max(-SCREEN_H, Math.min(SCREEN_H, (coordOf(theta) / span) * SCREEN_H));

    setFatSegments(h.axis, [X_SOURCE * u, 0, 0, xScreen * u, 0, 0]);
    setFatSegments(h.frame, [xScreen * u, -SCREEN_H * u, 0, xScreen * u, SCREEN_H * u, 0]);
    h.screen.position.set((xScreen + SCREEN_W / 2) * u, 0, 0);
    h.ruler.update({ x: xScreen + SCREEN_W, halfH: SCREEN_H, span, units: slit ? lengthUnit : angleUnit, want: slit || rayl ? 3 : 5 });

    // The aperture, drawn as one gap, a comb of slits, or a round hole seen edge-on. The same
    // openings are where the ripples start.
    const seg = [];
    const sources = [];
    let lamD = null;
    if (state.mode === 'grating') {
      const pitch = drawnPitch(c.d);
      const n = Math.min((GRATING_MAX_DRAWN - 1) / 2, Math.floor(0.2 / pitch));
      const open = Math.min(0.01, pitch / 4);
      let y = -BARRIER_H;
      for (let i = -n; i <= n; i++) {
        seg.push(X_APERTURE * u, y * u, 0, X_APERTURE * u, (i * pitch - open) * u, 0);
        y = i * pitch + open;
        sources.push([X_APERTURE, i * pitch]);
      }
      seg.push(X_APERTURE * u, y * u, 0, X_APERTURE * u, BARRIER_H * u, 0);
      const th1 = c.g.thetaOrder(1);
      lamD = th1 == null ? pitch * 1.2 : drawnLambda(pitch, yOf(th1), Ld);
    } else {
      const half = rayl ? 0.075 : drawnA(state.a) / 2;
      seg.push(X_APERTURE * u, -BARRIER_H * u, 0, X_APERTURE * u, -half * u, 0);
      seg.push(X_APERTURE * u, half * u, 0, X_APERTURE * u, BARRIER_H * u, 0);
      if (slit) {
        // Huygens: a row of wavelets across the opening.
        const n = 16;
        for (let i = 0; i < n; i++) sources.push([X_APERTURE, ((i + 0.5) / n - 0.5) * 2 * half]);
        lamD = c.theta1 == null ? 2 * half * 1.2 : drawnLambda(2 * half, yOf(c.theta1), Ld);
      }
    }
    setFatSegments(h.barrier, seg);
    const fade = lamD == null ? 0 : Math.max(0, Math.min(1, (lamD - 0.6 * LAMBDA_DRAW_MIN) / (0.4 * LAMBDA_DRAW_MIN)));
    h.tank.mesh.visible = !rayl && state.waves !== false && fade > 0;
    if (h.tank.mesh.visible) {
      h.tank.update({
        sources, lambda: lamD, xSource: X_SOURCE, xBarrier: X_APERTURE, xScreen, beam: BEAM, halfH: SCREEN_H,
        color: beam, alpha: 0.95 * fade, rRef: Ld,
      });
    }

    // Paint the screen from the real intensity for this mode.
    const sep = c.thetaMin * state.sepFactor;
    let I;
    if (slit) I = (v) => singleSlitIntensity(thetaOf(v), { lambda: state.lam, a: state.a });
    else if (state.mode === 'grating') I = (v) => gratingIntensity(v, { lambda: state.lam, d: c.d, N: 12 });
    else {
      I = (v) => 0.5 * airyIntensity(v - sep / 2, { lambda: state.lam, D: state.D })
        + 0.5 * airyIntensity(v + sep / 2, { lambda: state.lam, D: state.D });
    }
    paintScreen(h.canvas, rgb, span, I, state.mode === 'grating' ? 12 : 6);
    h.texture.needsUpdate = true;

    // Rays: in the rays view, in to the aperture and out to whatever this mode marks. The Rayleigh
    // view has no ripples, so its two incoming directions always show.
    const showRays = rayl || state.waves === false;
    const rays = [];
    if (showRays && !rayl) rays.push(X_SOURCE * u, 0, 0, X_APERTURE * u, 0, 0);
    const marks = [];
    const tick = (y) => marks.push((xScreen - 0.05) * u, y * u, 0, (xScreen - 0.005) * u, y * u, 0);
    if (slit && c.theta1 != null) {
      for (const s of [1, -1]) {
        const y = yOf(s * c.theta1);
        if (showRays) rays.push(X_APERTURE * u, 0, 0, xScreen * u, y * u, 0);
        tick(y);
      }
    } else if (state.mode === 'grating') {
      if (showRays) {
        for (let m = -c.maxOrder; m <= c.maxOrder; m++) {
          const th = c.g.thetaOrder(m);
          if (th == null) continue;
          rays.push(X_APERTURE * u, 0, 0, xScreen * u, yOf(th) * u, 0);
        }
      }
      if (c.thetaOrder != null) tick(yOf(c.thetaOrder));
    } else if (rayl) {
      for (const s of [1, -1]) {
        const y = yOf((s * sep) / 2);
        rays.push(X_SOURCE * u, s * 0.12 * u, 0, X_APERTURE * u, 0, 0);
        tick(y);
      }
    }
    setFatSegments(h.rays, rays);
    h.rays.material.color.copy(beam);
    setFatSegments(h.marker, marks);

    // For one slit, trace sinc² beside the screen: the shape the bands are painted from.
    const env = [];
    if (slit) {
      const steps = 160;
      for (let i = 0; i <= steps; i++) {
        const v = -span + (2 * span * i) / steps;
        const Iv = singleSlitIntensity(thetaOf(v), { lambda: state.lam, a: state.a });
        env.push((xScreen - 0.02 - 0.14 * Iv) * u, ((v / span) * SCREEN_H) * u, 0.01);
      }
    }
    h.envelope.visible = env.length > 0;
    if (env.length) h.envelope.geometry.setPositions(env);

    const L = h.labels;
    L.source.position.set((X_SOURCE + 0.05) * u, (BEAM + 0.03) * u, 0);
    L.source.element.innerHTML = `${(state.lam * 1e9).toFixed(0)} nm`;
    L.aperture.position.set(X_APERTURE * u, -(BARRIER_H + 0.03) * u, 0);
    L.aperture.element.innerHTML =
      slit ? `a = ${(state.a * 1e3).toFixed(3)} mm`
        : state.mode === 'grating' ? `${state.linesPerMM.toFixed(0)} lines/mm &middot; d = ${(c.d * 1e6).toFixed(3)} μm`
          : `D = ${(state.D * 1e3).toFixed(1)} mm`;
    const yLab = rayl ? yOf(sep / 2) + 0.05 : yOf(state.mode === 'grating' ? c.thetaOrder ?? 0 : c.theta1 ?? 0);
    L.order.position.set((xScreen - 0.055) * u, yLab * u, 0);
    L.order.element.innerHTML =
      slit ? (c.theta1 == null ? '' : `θ₁ = ${c.theta1Deg.toFixed(2)}°`)
        : state.mode === 'grating' ? (c.thetaOrder == null ? '' : `m = ${state.m}`)
          : c.resolved ? 'resolved' : 'not resolved';
    L.note.position.set(((X_APERTURE + xScreen) / 2) * u, -(SCREEN_H + 0.035) * u, 0);
    L.note.element.innerHTML =
      rayl ? `${(state.Lobj / 1e3).toFixed(1)} km away &middot; screen marked in angle`
        : state.mode === 'grating' ? 'screen marked in angle θ &middot; bench not to scale'
          : `L = ${state.L.toFixed(2)} m &middot; bench not to scale`;

    ctx.grid.visible = false;
  },
  afterFrame(dt, state, computed, ctx) {
    if (ctx.handle?.tank) ctx.handle.tank.tick(dt);
  },
  law(state) {
    if (state.mode === 'grating') {
      return [String.raw`d\sin\theta = m\lambda`, String.raw`d = \frac{1}{N},\qquad m_{\max} = \left\lfloor \frac{d}{\lambda} \right\rfloor`];
    }
    if (state.mode === 'rayleigh') {
      return [String.raw`\theta_{\min} = \frac{1.22\,\lambda}{D}`, String.raw`s = \theta_{\min} L`];
    }
    return [String.raw`a\sin\theta = m\lambda\quad (m = 1, 2, \dots\ \text{dark})`, String.raw`w = \frac{2\lambda L}{a}`];
  },
  liveRows(state, computed) {
    const c = computed.diff;
    if (!c) return '';
    const rows = [kv(String.raw`$\lambda$`, `${(state.lam * 1e9).toFixed(0)} nm`)];
    if (state.mode === 'slit') {
      rows.push(kv('$a$', `${(state.a * 1e3).toFixed(3)} mm`));
      rows.push(kv('$L$', `${state.L.toFixed(2)} m`));
      rows.push(kv(String.raw`$\sin\theta_1 = \lambda/a$`, (state.lam / state.a).toFixed(5)));
      rows.push(kv(String.raw`$\theta_1$`, c.theta1Deg == null ? 'no minimum — λ > a' : qv('qV', `${c.theta1Deg.toFixed(3)}°`)));
      rows.push(kv(String.raw`$w = 2\lambda L/a$`, qv('qV', `${(c.width * 1e3).toFixed(2)} mm`)));
    } else if (state.mode === 'grating') {
      rows.push(kv('lines/mm', state.linesPerMM.toFixed(0)));
      rows.push(kv('$d = 1/N$', qv('qV', `${(c.d * 1e6).toFixed(4)} μm`)));
      rows.push(kv(`$\\sin\\theta_{${state.m}} = m\\lambda/d$`, c.thetaOrder == null ? '> 1 — no such order' : ((state.m * state.lam) / c.d).toFixed(5)));
      rows.push(kv(`$\\theta_{${state.m}}$`, c.thetaOrderDeg == null ? '—' : qv('qV', `${c.thetaOrderDeg.toFixed(3)}°`)));
      rows.push(kv(String.raw`$m_{\max} = \lfloor d/\lambda \rfloor$`, qv('qV', String(c.maxOrder))));
    } else {
      rows.push(kv('$D$', `${(state.D * 1e3).toFixed(2)} mm`));
      rows.push(kv('distance', `${(state.Lobj / 1e3).toFixed(2)} km`));
      rows.push(kv(String.raw`$\theta_{\min} = 1.22\lambda/D$`, qv('qV', `${c.thetaMin.toExponential(3)} rad`)));
      rows.push(kv(String.raw`$s = \theta_{\min}L$`, qv('qV', `${c.separation.toFixed(3)} m`)));
      rows.push(kv('sources apart by', `${state.sepFactor.toFixed(2)} θ_min`));
    }
    return rows.join('');
  },
  readout(state, computed) {
    const c = computed.diff;
    if (!c) return '';
    if (state.mode === 'grating') {
      return cells([
        ['$d$', `${(c.d * 1e6).toFixed(4)} μm`, 'ok'],
        [`$\\theta_{${state.m}}$`, c.thetaOrderDeg == null ? '—' : `${c.thetaOrderDeg.toFixed(3)}°`, ''],
        [String.raw`$m_{\max}$`, String(c.maxOrder), ''],
        ['orders visible', String(2 * c.maxOrder + 1), ''],
      ]);
    }
    if (state.mode === 'rayleigh') {
      return cells([
        [String.raw`$\theta_{\min}$`, `${c.thetaMin.toExponential(3)} rad`, 'ok'],
        ['$s$ at that range', `${c.separation.toFixed(3)} m`, ''],
        ['sources apart', `${state.sepFactor.toFixed(2)} θ_min`, ''],
        ['verdict', c.resolved ? 'resolved' : 'not resolved', c.resolved ? 'ok' : 'bad'],
      ]);
    }
    return cells([
      [String.raw`$\theta_1$`, c.theta1Deg == null ? '—' : `${c.theta1Deg.toFixed(3)}°`, 'ok'],
      ['central width $w$', `${(c.width * 1e3).toFixed(2)} mm`, ''],
      ['$a/\\lambda$', (state.a / state.lam).toFixed(1), ''],
      ['minima at', 'a sinθ = mλ', ''],
    ]);
  },
  coach(state, computed) {
    const c = computed.diff;
    if (state.mode === 'grating') {
      return {
        title: 'A grating asks the same question as two slits, but insists on the answer',
        body: [
          String.raw`The condition is the one from the double slit, $d\sin\theta = m\lambda$ — but with thousands of slits instead of two, a direction that is even slightly off has some slit's light to cancel it. The maxima go from broad fringes to thin lines:`,
          eq(String.raw`d\sin\theta = m\lambda,\qquad d = \frac{1}{N}`),
          String.raw`$N$ is lines per unit length, so more lines means a smaller $d$ and orders that swing further out. Push far enough and $\sin\theta$ would have to exceed 1, which is why only $m \le \lfloor d/\lambda \rfloor$ exists` + (c ? ` — here ${c.maxOrder}.` : '.'),
        ],
      };
    }
    if (state.mode === 'rayleigh') {
      return {
        title: 'Resolution is diffraction, not magnification',
        body: [
          String.raw`Every aperture spreads the light that passes it into an Airy disk of angular radius $1.22\lambda/D$. Two sources are just resolvable when one's peak sits on the other's first dark ring:`,
          eq(String.raw`\theta_{\min} = \frac{1.22\,\lambda}{D}`),
          String.raw`Slide the separation below $1\times\theta_{\min}$ and the two peaks on the screen merge into one hump — no amount of magnification separates them again. A bigger $D$ is the only fix, which is why telescopes are built wide, not just long.`,
        ],
      };
    }
    return {
      title: 'One slit fights back: the narrower it is, the wider the light spreads',
      body: [
        String.raw`Treat the slit as a row of sources across its own width. The first dark direction is where the top half exactly cancels the bottom half — every source in the top paired with one a distance $a/2$ below it, half a wavelength out of step:`,
        eq(String.raw`a\sin\theta = m\lambda,\qquad m = 1, 2, \dots`),
        String.raw`Those are the dark fringes, not the bright ones — which is the trap: the same-looking equation that means bright for two slits means dark for one. The bright middle spans the space between the first minima on each side,`,
        eq(String.raw`w = \frac{2\lambda L}{a}`),
        String.raw`so halving $a$ doubles $w$` + (c && c.theta1 == null ? ' — and once λ exceeds a, there is no minimum at all: the light spills into every direction.' : '.'),
      ],
    };
  },
});
