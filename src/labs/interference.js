import * as THREE from 'three';
import { CSS2DObject } from 'three/addons/renderers/CSS2DRenderer.js';
import { defineLab } from './define.js';
import { M, fatLine, fatSegments, markAnswer, setFatSegments, segmentCapacity } from '../scene/manim.js';
import { UNITS_PER_METER } from '../physics/constants.js';
import { doubleSlit, doubleSlitIntensity, wavelengthRGB } from '../physics/waveoptics.js';
import {
  CARD_DX, CARD_DZ, createCard, createRuler, createTank, curvePoints, drawTwoWaves, drawnL, drawnLambda, drawnLog, lengthUnit, niceCeil,
  paintScreen, stepVerdict,
} from '../scene/wavebench.js';
import { kv, cells, qv, eq } from '../ui/shared.js';

/**
 * Ch 63 · Young's double slit.
 *
 * The bench cannot be drawn to scale — the slits are tenths of a millimetre apart and the screen is
 * metres away — so the geometry is stretched and the *pattern* is real: every fringe on the screen
 * is painted from I(θ) for the λ, d and L in the panel, and the spacing you measure off the screen
 * is the Δy the panel reports.
 */

const SCENARIOS = [
  { id: 'young', name: 'Double slit · 600 nm, d = 0.2 mm, L = 2 m', lam: 600e-9, d: 0.2e-3, L: 2, m: 3, envelope: false, span: 0.03 },
  { id: 'wide', name: 'Slits far apart — fringes crowd together', lam: 600e-9, d: 0.8e-3, L: 2, m: 3, envelope: false, span: 0.03 },
  { id: 'narrow', name: 'Slits close together — fringes spread out', lam: 600e-9, d: 0.06e-3, L: 2, m: 1, envelope: false, span: 0.03 },
  { id: 'blue', name: 'Blue light — shorter λ, tighter fringes', lam: 450e-9, d: 0.2e-3, L: 2, m: 3, envelope: false, span: 0.03 },
  { id: 'envelope', name: 'With the single-slit envelope — a missing order', lam: 600e-9, d: 0.3e-3, L: 2, m: 3, envelope: true, span: 0.03 },
];

// The bench, in drawing metres (× UNITS_PER_METER for the scene). Nothing here is to scale except
// the pattern on the screen, which is measured by the ruler beside it.
const X_SOURCE = -0.38;
const X_SLITS = -0.17;
const BARRIER_H = 0.3;
const SCREEN_H = 0.33;
const BEAM = 0.16;
const CURVE_STEPS = 240;
// Below this the drawn crests are a few pixels apart and read as noise, so the ripples fade out.
const LAMBDA_DRAW_MIN = 0.006;

/** Drawn slit separation: a log stand-in that still grows and shrinks with the real d. */
const drawnSep = (d) => drawnLog(d, 0.02e-3, 2e-3, 0.06, 0.26);

/** The half-span the screen is fitted to: five bright fringes either side of the middle. */
function fitSpan(state) {
  return niceCeil((5 * state.lam * state.L) / state.d);
}

function label(html, anchorX = 0.5) {
  const el = document.createElement('div');
  el.className = 'circuit-label';
  el.innerHTML = html;
  const o = new CSS2DObject(el);
  o.center.set(anchorX, 0.5);
  return o;
}

const raycaster = new THREE.Raycaster();
const ndc = new THREE.Vector2();
const zPlane = new THREE.Plane(new THREE.Vector3(0, 0, 1), 0);
const hitPt = new THREE.Vector3();
let draggingP = false;

/** Where the pointer meets the bench, in drawing metres. */
function benchPoint(e, camera) {
  ndc.set((e.clientX / window.innerWidth) * 2 - 1, -(e.clientY / window.innerHeight) * 2 + 1);
  raycaster.setFromCamera(ndc, camera);
  if (!raycaster.ray.intersectPlane(zPlane, hitPt)) return null;
  return { x: hitPt.x / UNITS_PER_METER, y: hitPt.y / UNITS_PER_METER };
}

export default defineLab({
  id: 'interference',
  exam: 'wave',
  title: 'Interference',
  hint: 'Drag P along the screen — the two waves arrive in step on the bright bands and cancel on the dark ones',
  orbit: false,
  camera: { pos: new THREE.Vector3(0, 0, 11.2), target: new THREE.Vector3(0, 0, 0) },
  keys: { r: 'reset', R: 'reset' },
  scenarios: SCENARIOS,
  defaultState() {
    return { scenarioId: 'young', lam: 600e-9, d: 0.2e-3, L: 2, m: 3, envelope: false, aOverD: 1 / 3, span: 0.03, yP: 0, waves: true };
  },
  applyScenario(id, state) {
    const sc = SCENARIOS.find((s) => s.id === id) || SCENARIOS[0];
    // The screen is sized on the next recompute, once the setup is final: a problem changes λ, d and L
    // after this. Left as the scenario had it, every scenario shares one scale so they compare.
    Object.assign(state, { scenarioId: sc.id, lam: sc.lam, d: sc.d, L: sc.L, m: sc.m, envelope: sc.envelope, span: null, spanFrom: sc.id, yP: 0 });
  },
  controls() {
    return `
        <div class="lab-block">
          <label class="field">
            <span>Wavelength λ</span>
            <div class="slider-row">
              <input type="range" id="if-lam" min="380" max="720" step="1" value="600" />
              <span class="mono val" id="if-lam-val">600 nm</span>
              <input type="number" class="num" id="if-lam-num" min="200" max="1200" step="1" value="600" />
            </div>
          </label>
          <label class="field">
            <span>Slit separation d</span>
            <div class="slider-row">
              <input type="range" id="if-d" min="0.02" max="1.5" step="0.01" value="0.2" />
              <span class="mono val" id="if-d-val">0.200 mm</span>
              <input type="number" class="num" id="if-d-num" min="0.005" max="20" step="0.005" value="0.2" />
            </div>
          </label>
          <label class="field">
            <span>Screen distance L</span>
            <div class="slider-row">
              <input type="range" id="if-L" min="0.3" max="6" step="0.05" value="2" />
              <span class="mono val" id="if-L-val">2.00 m</span>
              <input type="number" class="num" id="if-L-num" min="0.05" max="50" step="0.05" value="2" />
            </div>
          </label>
          <label class="field">
            <span>Order m to mark</span>
            <div class="slider-row">
              <input type="range" id="if-m" min="0" max="8" step="1" value="3" />
              <span class="mono val" id="if-m-val">m = 3</span>
            </div>
          </label>
          <label class="check"><input type="checkbox" id="if-env" /> <span>each slit has width a = d/3 (adds the diffraction envelope)</span></label>
          <label class="check"><input type="checkbox" id="if-waves" checked /> <span>show the waves (off: rays only)</span></label>
          <button type="button" class="btn ghost" id="if-fit">Fit screen to the pattern</button>
          <p class="tiny">Drag <b>P</b> up and down the screen. The screen keeps its scale while you slide — read the pattern off the ruler, in real units. The bench itself is stretched: real slits are far closer together and the screen metres away, so the ripples use a stand-in wavelength chosen to land on the same bands.</p>
        </div>`;
  },
  bind(api) {
    const $ = (id) => document.getElementById(id);
    const pair = (id, key, toSI, fromSI) => {
      const s = $(`if-${id}`);
      const n = $(`if-${id}-num`);
      s.addEventListener('input', (e) => {
        api.slice()[key] = toSI(Number(e.target.value));
        api.bump(false);
      });
      if (n) {
        n.addEventListener('change', (e) => {
          const v = Number(e.target.value);
          if (!Number.isFinite(v) || v <= 0) return;
          api.slice()[key] = toSI(v);
          // Typing past a slider's end widens it, the way every other lab does.
          if (v < Number(s.min)) s.min = String(v);
          if (v > Number(s.max)) s.max = String(v);
          api.bump(false);
        });
      }
      return { s, n, fromSI };
    };
    pair('lam', 'lam', (v) => v * 1e-9, (v) => v * 1e9);
    pair('d', 'd', (v) => v * 1e-3, (v) => v * 1e3);
    pair('L', 'L', (v) => v, (v) => v);
    $('if-m').addEventListener('input', (e) => {
      api.slice().m = Number(e.target.value);
      api.bump(false);
    });
    $('if-env').addEventListener('change', (e) => {
      api.slice().envelope = e.target.checked;
      api.bump(false);
    });
    $('if-waves').addEventListener('change', (e) => {
      api.slice().waves = e.target.checked;
      api.bump(false);
    });
    $('if-fit').addEventListener('click', () => {
      Object.assign(api.slice(), { span: null, spanFrom: null });
      api.bump(false);
    });
  },
  syncControls(state) {
    const $ = (id) => document.getElementById(id);
    const set = (id, val, text, num) => {
      const s = $(`if-${id}`);
      if (s) {
        if (val > Number(s.max)) s.max = String(val);
        if (val < Number(s.min)) s.min = String(val);
        s.value = String(val);
      }
      const v = $(`if-${id}-val`);
      if (v) v.textContent = text;
      const n = $(`if-${id}-num`);
      if (n && document.activeElement !== n) n.value = String(num ?? val);
    };
    set('lam', state.lam * 1e9, `${(state.lam * 1e9).toFixed(0)} nm`);
    set('d', state.d * 1e3, `${(state.d * 1e3).toFixed(3)} mm`);
    set('L', state.L, `${state.L.toFixed(2)} m`);
    set('m', state.m, `m = ${state.m}`);
    const env = $('if-env');
    if (env) env.checked = !!state.envelope;
    const waves = $('if-waves');
    if (waves) waves.checked = state.waves !== false;
  },
  init(ctx) {
    const u = UNITS_PER_METER;
    const group = new THREE.Group();
    ctx.scene.add(group);

    const tank = createTank(group);
    const axis = fatSegments(segmentCapacity(1), { color: 0x4a4a4a, width: 1.2 });
    group.add(axis);
    const barrier = fatSegments(segmentCapacity(8), { color: M.white, width: 3 });
    group.add(barrier);
    // The screen: a card turned to show its face, the fringes painted on it.
    const card = createCard(group, SCREEN_H);
    const ruler = createRuler(group);
    // I(y) beside the screen, on the ruler's scale, with a dot where P sits on it.
    const curve = fatLine(new Array((CURVE_STEPS + 1) * 3).fill(0), { color: M.teal, width: 1.8, opacity: 0.9 });
    group.add(curve);
    const curveDot = new THREE.Mesh(new THREE.CircleGeometry(0.06, 20), new THREE.MeshBasicMaterial({ color: M.teal }));
    group.add(curveDot);

    const rays = fatSegments(segmentCapacity(8), { color: M.gold, width: 1.6 });
    group.add(rays);
    // The two paths to P, and the extra length δ the lower one travels, ticked off in wavelengths.
    const paths = fatSegments(segmentCapacity(2), { color: M.white, width: 1.4, opacity: 0.85 });
    group.add(paths);
    const pathMark = fatSegments(segmentCapacity(24), { color: M.teal, width: 3 });
    group.add(pathMark);
    const pDot = new THREE.Mesh(new THREE.CircleGeometry(0.075, 24), new THREE.MeshBasicMaterial({ color: M.white }));
    const pRing = new THREE.Mesh(new THREE.RingGeometry(0.11, 0.14, 32), new THREE.MeshBasicMaterial({ color: M.white }));
    group.add(pDot, pRing);
    // The marker that points at the answer (which fringe is order m) is an answer, so it hides
    // in blind mode along with the readout.
    const marker = fatSegments(segmentCapacity(2), { color: M.gold, width: 3 });
    markAnswer(marker);
    group.add(marker);

    const labels = {
      d: label('d'),
      L: label('L'),
      order: label('m', 1),
      source: label('λ'),
      P: label('P', 1),
    };
    markAnswer(labels.order);
    Object.values(labels).forEach((l) => group.add(l));

    // The inset: what arrives at P from each slit, and what they add up to.
    const insetEl = document.createElement('div');
    insetEl.className = 'wave-inset';
    insetEl.innerHTML = '<div class="wave-inset-title">What arrives at P</div><canvas width="360" height="200"></canvas>';
    const inset = new CSS2DObject(insetEl);
    inset.center.set(0, 1); // bottom-left corner at the anchor
    group.add(inset);
    const insetCaptionEl = document.createElement('div');
    insetCaptionEl.className = 'wave-inset-caption';
    const insetCaption = new CSS2DObject(insetCaptionEl);
    insetCaption.center.set(0, 0);
    markAnswer(insetCaption);
    group.add(insetCaption);

    group.visible = false;
    return {
      group, tank, axis, barrier, card, curve, curveDot, ruler, rays, paths, pathMark, pDot, pRing, marker, labels,
      inset, insetCanvas: insetEl.querySelector('canvas'), insetCaption, geo: null,
    };
  },
  enter(ctx, handle) {
    handle.group.visible = true;
  },
  exit(ctx, handle) {
    handle.group.visible = false;
  },
  pointer: {
    down(e, ctx) {
      const g = ctx.handle?.geo;
      const p = g && benchPoint(e, ctx.camera);
      if (!p) return;
      // Anywhere on or just beside the screen picks up P, and puts it there.
      if (p.x < g.xScreen - 0.06 || p.x > g.xScreen + CARD_DX + 0.03 || Math.abs(p.y) > SCREEN_H + 0.03) return;
      draggingP = true;
      ctx.controls.enabled = false;
      this.move(e, ctx);
    },
    move(e, ctx) {
      if (!draggingP) return;
      const g = ctx.handle?.geo;
      const p = g && benchPoint(e, ctx.camera);
      if (!p) return;
      const yd = Math.max(-SCREEN_H, Math.min(SCREEN_H, p.y));
      ctx.state.yP = (yd / SCREEN_H) * g.span;
      ctx.bump(false);
    },
    up(e, ctx) {
      draggingP = false;
      ctx.controls.enabled = true;
    },
  },
  recompute(state, computed) {
    if (!(state.span > 0)) {
      const sc = SCENARIOS.find((x) => x.id === state.spanFrom);
      const same = sc && sc.lam === state.lam && sc.d === state.d && sc.L === state.L;
      state.span = same ? sc.span : fitSpan(state);
      state.spanFrom = null;
    }
    const a = state.envelope ? state.d * state.aOverD : 0;
    const ds = doubleSlit({ lambda: state.lam, d: state.d, L: state.L, a });
    const th = ds.thetaBright(state.m);
    // P, clamped to the screen: its angle, the path difference there, and the brightness.
    const yP = Math.max(-state.span, Math.min(state.span, state.yP ?? 0));
    const thetaP = Math.atan2(yP, state.L);
    const deltaP = state.d * Math.sin(thetaP);
    computed.interf = {
      dy: ds.dy,
      y: ds.ySmall(state.m),
      yExact: ds.yBright(state.m),
      theta: th,
      thetaDeg: th == null ? null : (th * 180) / Math.PI,
      delta: state.m * state.lam, // path difference at that order
      maxOrder: ds.maxOrder,
      a,
      exists: th != null,
      ds,
      span: state.span,
      yP,
      thetaP,
      deltaP,
      cyclesP: deltaP / state.lam,
      IP: doubleSlitIntensity(thetaP, { lambda: state.lam, d: state.d, a }),
    };
  },
  syncViews(state, computed, ctx) {
    const h = ctx.handle;
    const c = computed.interf;
    if (!h || !c) return;
    const u = UNITS_PER_METER;
    const sep = drawnSep(state.d);
    const half = sep / 2;
    const Ld = drawnL(state.L);
    const xScreen = X_SLITS + Ld;
    const span = c.span;
    const toDraw = (y) => (y / span) * SCREEN_H; // real metres on the screen → drawing metres
    const clampD = (y) => Math.max(-SCREEN_H, Math.min(SCREEN_H, y));
    const rgb = wavelengthRGB(state.lam);
    const beamColor = new THREE.Color(`rgb(${rgb.r},${rgb.g},${rgb.b})`);
    h.geo = { xScreen, span };

    setFatSegments(h.axis, [X_SOURCE * u, 0, 0, xScreen * u, 0, 0]);
    h.card.place(xScreen);
    h.ruler.update({ x: xScreen + CARD_DX + 0.012, z: CARD_DZ, halfH: SCREEN_H, span, units: lengthUnit });

    // Barrier with two gaps at ±half, each as wide as the slit (a stand-in when there's no envelope).
    const gap = state.envelope ? Math.max(0.006, (sep * state.aOverD) / 2) : 0.012;
    const seg = [];
    const push = (y0, y1) => seg.push(X_SLITS * u, y0 * u, 0, X_SLITS * u, y1 * u, 0);
    push(-BARRIER_H, -half - gap);
    push(-half + gap, half - gap);
    push(half + gap, BARRIER_H);
    setFatSegments(h.barrier, seg);

    // Fringe pattern painted from the real intensity, against the fixed ruler.
    const Iy = (y) => doubleSlitIntensity(Math.atan2(y, state.L), { lambda: state.lam, d: state.d, a: c.a });
    paintScreen(h.card.canvas, rgb, span, Iy);
    h.card.texture.needsUpdate = true;
    const prof = [];
    for (let i = 0; i <= CURVE_STEPS; i++) {
      const y = -span + (2 * span * i) / CURVE_STEPS;
      prof.push([y, Iy(y)]);
    }
    h.curve.geometry.setPositions(curvePoints(prof, { x: xScreen, span, halfH: SCREEN_H }));

    // The ripples: a plane wave up to the barrier, then a circular wave out of each slit. The drawn
    // wavelength is whatever sends the drawn geometry's first bright fringe to the real one's place.
    const y1 = c.ds.yBright(1);
    const lamD = y1 == null ? sep * 1.2 : drawnLambda(sep, toDraw(y1), Ld);
    const sources = [];
    const sub = state.envelope ? 6 : 1;
    for (const yc of [half, -half]) {
      for (let i = 0; i < sub; i++) {
        const off = sub === 1 ? 0 : ((i + 0.5) / sub - 0.5) * 2 * gap;
        sources.push([X_SLITS, yc + off]);
      }
    }
    const fade = Math.max(0, Math.min(1, (lamD - 0.6 * LAMBDA_DRAW_MIN) / (0.4 * LAMBDA_DRAW_MIN)));
    h.tank.mesh.visible = state.waves !== false && fade > 0;
    h.tank.update({
      sources, lambda: lamD, xSource: X_SOURCE, xBarrier: X_SLITS, xScreen, beam: BEAM, halfH: SCREEN_H,
      color: beamColor, alpha: 0.95 * fade, rRef: Ld,
    });

    // Rays view: source → each slit → the marked order.
    const yOrder = c.exists ? clampD(toDraw(c.yExact)) : 0;
    const r = [];
    if (state.waves === false) {
      r.push(X_SOURCE * u, 0, 0, X_SLITS * u, -half * u, 0);
      r.push(X_SOURCE * u, 0, 0, X_SLITS * u, half * u, 0);
      if (c.exists) {
        r.push(X_SLITS * u, -half * u, 0, xScreen * u, yOrder * u, 0);
        r.push(X_SLITS * u, half * u, 0, xScreen * u, yOrder * u, 0);
      }
    }
    setFatSegments(h.rays, r);
    h.rays.material.color.copy(beamColor);

    // P: the two paths, and δ laid along the lower one as a run of wavelengths.
    const yPd = clampD(toDraw(c.yP));
    setFatSegments(h.paths, [
      X_SLITS * u, half * u, 0, xScreen * u, yPd * u, 0,
      X_SLITS * u, -half * u, 0, xScreen * u, yPd * u, 0,
    ]);
    const pm = [];
    const cyc = Math.abs(c.cyclesP);
    if (cyc > 0.02) {
      // The longer path starts at the slit farther from P.
      const y0 = c.yP >= 0 ? -half : half;
      const dx = xScreen - X_SLITS;
      const dy = yPd - y0;
      const len = Math.hypot(dx, dy);
      const ux = dx / len;
      const uy = dy / len;
      const run = Math.min(cyc, 12) * lamD;
      pm.push(X_SLITS * u, y0 * u, 0, (X_SLITS + ux * run) * u, (y0 + uy * run) * u, 0);
      // A cross tick at every whole wavelength along δ.
      const nx = -uy;
      const ny = ux;
      for (let k = 0; k <= Math.min(Math.floor(cyc), 12); k++) {
        const cx = X_SLITS + ux * k * lamD;
        const cy = y0 + uy * k * lamD;
        pm.push((cx - nx * 0.012) * u, (cy - ny * 0.012) * u, 0, (cx + nx * 0.012) * u, (cy + ny * 0.012) * u, 0);
      }
    }
    setFatSegments(h.pathMark, pm);
    h.pDot.position.set(xScreen * u, yPd * u, 0.02);
    h.pRing.position.set(xScreen * u, yPd * u, 0.02);
    h.curveDot.position.set((xScreen - 0.02 - 0.14 * c.IP) * u, yPd * u, 0.03);

    // Tick at the marked order, on the side the paths come in from.
    const mk = [];
    if (c.exists) mk.push((xScreen - 0.05) * u, yOrder * u, 0, (xScreen - 0.005) * u, yOrder * u, 0);
    setFatSegments(h.marker, mk);

    const L = h.labels;
    L.source.position.set((X_SOURCE + 0.05) * u, (BEAM + 0.03) * u, 0);
    L.source.element.innerHTML = `${(state.lam * 1e9).toFixed(0)} nm`;
    L.d.position.set(X_SLITS * u, -(BARRIER_H + 0.03) * u, 0);
    L.d.element.innerHTML = `d = ${(state.d * 1e3).toFixed(3)} mm`;
    L.L.position.set(((X_SLITS + xScreen) / 2) * u, -(SCREEN_H + 0.035) * u, 0);
    L.L.element.innerHTML = `L = ${state.L.toFixed(2)} m &middot; bench not to scale`;
    L.order.visible = c.exists;
    L.order.position.set((xScreen - 0.055) * u, (yOrder + 0.022) * u, 0);
    L.order.element.innerHTML = c.exists ? `m = ${state.m}` : '';
    L.P.position.set((xScreen - 0.025) * u, (yPd - 0.035) * u, 0);
    L.P.element.innerHTML = 'P';

    h.inset.position.set((X_SOURCE + 0.015) * u, (SCREEN_H + 0.02) * u, 0);
    h.insetCaption.position.set((X_SOURCE + 0.015) * u, (SCREEN_H + 0.02) * u, 0);
    h.insetCaption.element.innerHTML = `δ = ${cyc.toFixed(2)} λ &middot; ${stepVerdict(cyc)}`;

    ctx.grid.visible = false;
  },
  afterFrame(dt, state, computed, ctx) {
    const h = ctx.handle;
    const c = computed.interf;
    if (!h || !c) return;
    h.tank.tick(dt);
    drawTwoWaves(h.insetCanvas, h.tank.phase(), [0, c.cyclesP], wavelengthRGB(state.lam), ['slit 1', 'slit 2', 'sum']);
  },
  law: () => [
    String.raw`d\sin\theta = m\lambda\quad\text{(bright)}`,
    String.raw`d\sin\theta = \left(m+\tfrac12\right)\lambda\quad\text{(dark)}`,
    String.raw`y_m \approx \frac{m\lambda L}{d},\qquad \Delta y = \frac{\lambda L}{d}`,
  ],
  liveRows(state, computed) {
    const c = computed.interf;
    if (!c) return '';
    const rows = [
      kv(String.raw`$\lambda$`, `${(state.lam * 1e9).toFixed(0)} nm`),
      kv('$d$', `${(state.d * 1e3).toFixed(3)} mm`),
      kv('$L$', `${state.L.toFixed(2)} m`),
      kv(String.raw`$\Delta y = \lambda L/d$`, qv('qV', `${(c.dy * 1e3).toFixed(3)} mm`)),
    ];
    if (c.exists) {
      rows.push(kv(`path difference at $m = ${state.m}$`, `${(c.delta * 1e9).toFixed(0)} nm = ${state.m}λ`));
      rows.push(kv(`$\\theta_{${state.m}}$`, `${c.thetaDeg.toFixed(3)}°`));
      rows.push(kv(`$y_{${state.m}}$`, qv('qV', `${(c.y * 1e3).toFixed(2)} mm`)));
    } else {
      rows.push(kv(`$m = ${state.m}$`, 'past sinθ = 1 — that order does not exist'));
    }
    if (c.a) rows.push(kv('slit width $a$', `${(c.a * 1e3).toFixed(3)} mm (envelope on)`));
    rows.push(kv('$y_P$', `${(c.yP * 1e3).toFixed(2)} mm`));
    rows.push(kv(String.raw`$\delta_P = d\sin\theta_P$`, qv('qV', `${(c.deltaP * 1e9).toFixed(0)} nm = ${c.cyclesP.toFixed(2)}λ`)));
    rows.push(kv('$I_P/I_0$', qv('qV', c.IP.toFixed(2))));
    return rows.join('');
  },
  readout(state, computed) {
    const c = computed.interf;
    if (!c) return '';
    return cells([
      [String.raw`$\Delta y$`, `${(c.dy * 1e3).toFixed(3)} mm`, 'ok'],
      [`$y_{${state.m}}$`, c.exists ? `${(c.y * 1e3).toFixed(2)} mm` : '—', ''],
      [`$\\theta_{${state.m}}$`, c.exists ? `${c.thetaDeg.toFixed(3)}°` : '—', ''],
      [String.raw`$\delta$ at P`, `${Math.abs(c.cyclesP).toFixed(2)}λ`, ''],
    ]);
  },
  coach(state, computed) {
    const c = computed.interf;
    if (c && !c.exists) {
      return {
        title: `There is no m = ${state.m} fringe here`,
        body: [
          String.raw`The order exists only while $\sin\theta = m\lambda/d$ stays at or below 1, so the last one you can see is $m_{\max} = \lfloor d/\lambda \rfloor$.`,
          `With d = ${(state.d * 1e3).toFixed(3)} mm and λ = ${(state.lam * 1e9).toFixed(0)} nm that is m = ${c.maxOrder}. Widen the slits or shorten the wavelength and more orders appear.`,
        ],
      };
    }
    if (state.envelope) {
      return {
        title: 'Two effects at once: fringes inside an envelope',
        body: [
          String.raw`The slits interfere with each other — that is the fine comb of fringes, spaced $\Delta y = \lambda L/d$. Each slit also diffracts on its own, and that wider single-slit pattern sets how bright each fringe is allowed to be.`,
          String.raw`Where the envelope has a zero, the fringe underneath it disappears. With $a = d/3$ the $m = 3$ order goes missing, because $d\sin\theta = 3\lambda$ and $a\sin\theta = \lambda$ ask for the same angle:`,
          eq(String.raw`I = \underbrace{\cos^2\!\left(\frac{\pi d\sin\theta}{\lambda}\right)}_{\text{two slits}} \cdot \underbrace{\left[\frac{\sin(\pi a\sin\theta/\lambda)}{\pi a \sin\theta/\lambda}\right]^2}_{\text{one slit}}`),
        ],
      };
    }
    return {
      title: 'The fringe spacing is a ratio, not a wavelength',
      body: [
        String.raw`Light leaves both slits in step. Going to a point on the screen at angle $\theta$, the path from the farther slit is longer by $\delta = d\sin\theta$ — the teal run along it, ticked off in wavelengths. Drag P and watch the inset. A whole number of wavelengths in that gap means the waves arrive in step and the screen is bright:`,
        eq(String.raw`d\sin\theta = m\lambda`),
        String.raw`For the small angles of a real bench, $\sin\theta \approx \tan\theta = y/L$, and the bright fringes come out evenly spaced:`,
        eq(String.raw`\Delta y = \frac{\lambda L}{d}`),
        String.raw`So $\Delta y$ scales with $\lambda$ and $L$ and against $d$ — 600 nm light is invisible on its own, but the millimetres between fringes are not, and that is how the wavelength gets measured.`,
      ],
    };
  },
});
