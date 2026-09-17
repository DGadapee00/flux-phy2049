import * as THREE from 'three';
import { CSS2DObject } from 'three/addons/renderers/CSS2DRenderer.js';
import { defineLab } from './define.js';
import { M, fatLine, fatSegments, markAnswer, setFatSegments, segmentCapacity } from '../scene/manim.js';
import { UNITS_PER_METER } from '../physics/constants.js';
import { doubleSlit, doubleSlitIntensity, wavelengthRGB } from '../physics/waveoptics.js';
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
  { id: 'young', name: 'Double slit · 600 nm, d = 0.2 mm, L = 2 m', lam: 600e-9, d: 0.2e-3, L: 2, m: 3, envelope: false },
  { id: 'wide', name: 'Slits far apart — fringes crowd together', lam: 600e-9, d: 0.8e-3, L: 2, m: 3, envelope: false },
  { id: 'narrow', name: 'Slits close together — fringes spread out', lam: 600e-9, d: 0.06e-3, L: 2, m: 2, envelope: false },
  { id: 'blue', name: 'Blue light — shorter λ, tighter fringes', lam: 450e-9, d: 0.2e-3, L: 2, m: 3, envelope: false },
  { id: 'envelope', name: 'With the single-slit envelope — a missing order', lam: 600e-9, d: 0.3e-3, L: 2, m: 3, envelope: true },
];

// The bench, in drawing metres (× UNITS_PER_METER for the scene). Nothing here is to scale.
// Everything sits left of centre so the screen and its labels stay clear of the Setup panel.
const X_SOURCE = -0.34;
const X_SLITS = -0.14;
const X_SCREEN = 0.28;
const BARRIER_H = 0.22;
const SCREEN_H = 0.33;
const SCREEN_W = 0.055;
const ORDERS_ON_SCREEN = 8;
const TEX_W = 8;
const TEX_H = 1024;

/** Drawn slit separation: a visible stand-in that still grows and shrinks with the real d. */
function drawnSep(d) {
  const t = Math.min(1, Math.max(0, (d - 0.05e-3) / (1e-3 - 0.05e-3)));
  return 0.05 + 0.13 * t;
}

/** How much of the screen one drawing-metre covers, chosen to show a useful number of fringes. */
function screenScale(ds) {
  const want = Math.max(Math.abs(ds.ySmall(ORDERS_ON_SCREEN)), 1e-6);
  return SCREEN_H / want; // drawing metres per real metre
}

function label(html, cls = 'circuit-label') {
  const el = document.createElement('div');
  el.className = cls;
  el.innerHTML = html;
  return new CSS2DObject(el);
}

export default defineLab({
  id: 'interference',
  exam: 'wave',
  title: 'Interference',
  hint: 'Two slits, one screen — slide d and λ and watch the fringes breathe',
  orbit: false,
  camera: { pos: new THREE.Vector3(0, 0, 11.2), target: new THREE.Vector3(0, 0, 0) },
  keys: { r: 'reset', R: 'reset' },
  scenarios: SCENARIOS,
  defaultState() {
    return { scenarioId: 'young', lam: 600e-9, d: 0.2e-3, L: 2, m: 3, envelope: false, aOverD: 1 / 3 };
  },
  applyScenario(id, state) {
    const sc = SCENARIOS.find((s) => s.id === id) || SCENARIOS[0];
    Object.assign(state, { scenarioId: sc.id, lam: sc.lam, d: sc.d, L: sc.L, m: sc.m, envelope: sc.envelope });
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
          <p class="tiny">The bench is stretched — real slits are far closer together than this, and the screen is metres away. The fringes on the screen are not: they are painted from the real I(θ) for the λ, d and L above, so the spacing there is the Δy in the panel.</p>
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
  },
  init(ctx) {
    const u = UNITS_PER_METER;
    const group = new THREE.Group();
    ctx.scene.add(group);

    // Source, bench axis, barrier and screen frame.
    group.add(fatLine([X_SOURCE * u, 0, 0, X_SCREEN * u, 0, 0], { color: M.gridLine, width: 1, opacity: 0.5 }));
    const barrier = fatSegments(segmentCapacity(8), { color: M.textMuted, width: 2 });
    group.add(barrier);
    group.add(
      fatLine(
        [X_SCREEN * u, -SCREEN_H * u, 0, X_SCREEN * u, SCREEN_H * u, 0],
        { color: M.textMuted, width: 1.2, opacity: 0.7 },
      ),
    );

    // The screen itself: a strip carrying the fringe pattern as a texture.
    const canvas = document.createElement('canvas');
    canvas.width = TEX_W;
    canvas.height = TEX_H;
    const texture = new THREE.CanvasTexture(canvas);
    texture.minFilter = THREE.LinearFilter;
    texture.magFilter = THREE.LinearFilter;
    const screen = new THREE.Mesh(
      new THREE.PlaneGeometry(SCREEN_W * u, 2 * SCREEN_H * u),
      new THREE.MeshBasicMaterial({ map: texture, toneMapped: false, transparent: false }),
    );
    screen.position.set((X_SCREEN + SCREEN_W / 2) * u, 0, 0);
    group.add(screen);

    const rays = fatSegments(segmentCapacity(8), { color: M.eVec, width: 1.2, opacity: 0.85 });
    group.add(rays);
    const pathMark = fatSegments(segmentCapacity(4), { color: M.bVec, width: 1.6 });
    group.add(pathMark);
    // The marker that points at the answer (which fringe is order m) is an answer, so it hides
    // in blind mode along with the readout.
    const marker = fatSegments(segmentCapacity(4), { color: M.accent, width: 2 });
    markAnswer(marker);
    group.add(marker);

    const labels = {
      d: label('d'),
      L: label('L'),
      order: label('m'),
      spacing: label('Δy'),
      source: label('λ'),
    };
    markAnswer(labels.order);
    markAnswer(labels.spacing);
    Object.values(labels).forEach((l) => group.add(l));

    group.visible = false;
    return { group, barrier, screen, canvas, texture, rays, pathMark, marker, labels };
  },
  enter(ctx, handle) {
    handle.group.visible = true;
  },
  exit(ctx, handle) {
    handle.group.visible = false;
  },
  recompute(state, computed) {
    const a = state.envelope ? state.d * state.aOverD : 0;
    const ds = doubleSlit({ lambda: state.lam, d: state.d, L: state.L, a });
    const th = ds.thetaBright(state.m);
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
    };
  },
  syncViews(state, computed, ctx) {
    const h = ctx.handle;
    const c = computed.interf;
    if (!h || !c) return;
    const u = UNITS_PER_METER;
    const sep = drawnSep(state.d);
    const half = sep / 2;
    const scale = screenScale(c.ds);
    const rgb = wavelengthRGB(state.lam);
    const beamColor = new THREE.Color(`rgb(${rgb.r},${rgb.g},${rgb.b})`);

    // Barrier with two gaps at ±half.
    const seg = [];
    const push = (y0, y1) => seg.push(X_SLITS * u, y0 * u, 0, X_SLITS * u, y1 * u, 0);
    const gap = 0.016;
    push(-BARRIER_H, -half - gap);
    push(-half + gap, half - gap);
    push(half + gap, BARRIER_H);
    setFatSegments(h.barrier, seg);

    // Fringe pattern painted from the real intensity.
    const g2 = h.canvas.getContext('2d');
    const img = g2.createImageData(TEX_W, TEX_H);
    for (let row = 0; row < TEX_H; row++) {
      // Texture rows run top → bottom; the screen's +y is up.
      const frac = 0.5 - row / (TEX_H - 1); // +0.5 … −0.5
      const yDraw = frac * 2 * SCREEN_H; // drawing metres from the axis
      const yReal = yDraw / scale; // real metres on the screen
      const theta = Math.atan2(yReal, state.L);
      const I = doubleSlitIntensity(theta, { lambda: state.lam, d: state.d, a: c.a });
      for (let col = 0; col < TEX_W; col++) {
        const i = (row * TEX_W + col) * 4;
        img.data[i] = rgb.r * I;
        img.data[i + 1] = rgb.g * I;
        img.data[i + 2] = rgb.b * I;
        img.data[i + 3] = 255;
      }
    }
    g2.putImageData(img, 0, 0);
    h.texture.needsUpdate = true;

    // Rays: source → each slit → the marked order.
    const yOrder = c.exists ? Math.max(-SCREEN_H, Math.min(SCREEN_H, c.y * scale)) : 0;
    const r = [];
    r.push(X_SOURCE * u, 0, 0, X_SLITS * u, -half * u, 0);
    r.push(X_SOURCE * u, 0, 0, X_SLITS * u, half * u, 0);
    if (c.exists) {
      r.push(X_SLITS * u, -half * u, 0, X_SCREEN * u, yOrder * u, 0);
      r.push(X_SLITS * u, half * u, 0, X_SCREEN * u, yOrder * u, 0);
    }
    setFatSegments(h.rays, r);
    h.rays.material.color.copy(beamColor);

    // The little right triangle at the slits: the extra path δ = d sinθ the lower ray travels.
    const pm = [];
    if (c.exists && state.m !== 0) {
      const dirX = X_SCREEN - X_SLITS;
      const dirY = yOrder - half;
      const len = Math.hypot(dirX, dirY);
      const ux = dirX / len;
      const uy = dirY / len;
      const drop = sep * Math.abs(Math.sin(c.theta)) * 6; // exaggerated, like the rest of the bench
      const footX = X_SLITS + ux * drop;
      const footY = -half + uy * drop;
      pm.push(X_SLITS * u, -half * u, 0, footX * u, footY * u, 0);
      pm.push(X_SLITS * u, half * u, 0, footX * u, footY * u, 0);
    }
    setFatSegments(h.pathMark, pm);

    // Tick marks at the marked order and at one fringe spacing.
    const mk = [];
    if (c.exists) {
      mk.push((X_SCREEN + SCREEN_W) * u, yOrder * u, 0, (X_SCREEN + SCREEN_W + 0.07) * u, yOrder * u, 0);
      const yNext = Math.max(-SCREEN_H, Math.min(SCREEN_H, (c.y + c.dy) * scale));
      mk.push((X_SCREEN + SCREEN_W) * u, yNext * u, 0, (X_SCREEN + SCREEN_W + 0.05) * u, yNext * u, 0);
    }
    setFatSegments(h.marker, mk);

    const L = h.labels;
    L.source.position.set((X_SOURCE + 0.02) * u, 0.09 * u, 0);
    L.source.element.innerHTML = `${(state.lam * 1e9).toFixed(0)} nm`;
    L.d.position.set((X_SLITS - 0.02) * u, -0.27 * u, 0);
    L.d.element.innerHTML = `d = ${(state.d * 1e3).toFixed(3)} mm`;
    L.L.position.set(((X_SLITS + X_SCREEN) / 2) * u, -0.3 * u, 0);
    L.L.element.innerHTML = `L = ${state.L.toFixed(2)} m &middot; not to scale`;
    L.order.visible = c.exists;
    L.order.position.set((X_SCREEN + 0.07) * u, yOrder * u, 0);
    L.order.element.innerHTML = c.exists ? `m = ${state.m}` : '';
    L.spacing.visible = c.exists;
    L.spacing.position.set((X_SCREEN + 0.07) * u, (yOrder + 0.075) * u, 0);
    L.spacing.element.innerHTML = `&Delta;y = ${(c.dy * 1e3).toFixed(2)} mm`;

    ctx.grid.visible = false;
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
    return rows.join('');
  },
  readout(state, computed) {
    const c = computed.interf;
    if (!c) return '';
    return cells([
      [String.raw`$\Delta y$`, `${(c.dy * 1e3).toFixed(3)} mm`, 'ok'],
      [`$y_{${state.m}}$`, c.exists ? `${(c.y * 1e3).toFixed(2)} mm` : '—', ''],
      [`$\\theta_{${state.m}}$`, c.exists ? `${c.thetaDeg.toFixed(3)}°` : '—', ''],
      ['highest order', String(c.maxOrder), ''],
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
        String.raw`Light leaves both slits in step. Going to a point on the screen at angle $\theta$, the lower path is longer by $\delta = d\sin\theta$ — the little teal triangle. A whole number of wavelengths in that gap means the waves arrive in step and the screen is bright:`,
        eq(String.raw`d\sin\theta = m\lambda`),
        String.raw`For the small angles of a real bench, $\sin\theta \approx \tan\theta = y/L$, and the bright fringes come out evenly spaced:`,
        eq(String.raw`\Delta y = \frac{\lambda L}{d}`),
        String.raw`So $\Delta y$ scales with $\lambda$ and $L$ and against $d$ — 600 nm light is invisible on its own, but the millimetres between fringes are not, and that is how the wavelength gets measured.`,
      ],
    };
  },
});
