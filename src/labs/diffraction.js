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
import { kv, cells, qv, eq } from '../ui/shared.js';

/**
 * Ch 64 · one slit, a grating, and the resolution limit.
 *
 * Same honesty as the Interference lab: the bench is stretched, the pattern is not. Every band on
 * the screen is painted from the real I(θ) for the numbers in the panel.
 */

const SCENARIOS = [
  { id: 'single', name: 'Single slit · 633 nm, a = 0.10 mm, L = 2 m', mode: 'slit', lam: 633e-9, a: 0.1e-3, L: 2 },
  { id: 'narrow', name: 'Narrower slit — the pattern spreads out', mode: 'slit', lam: 633e-9, a: 0.03e-3, L: 2 },
  { id: 'grating', name: 'Grating · 600 lines/mm, 500 nm', mode: 'grating', lam: 500e-9, linesPerMM: 600, m: 2, L: 2 },
  { id: 'grating-dense', name: 'Grating · 1200 lines/mm — orders fly apart', mode: 'grating', lam: 500e-9, linesPerMM: 1200, m: 1, L: 2 },
  { id: 'rayleigh', name: 'Rayleigh · 5 mm aperture at 10 km', mode: 'rayleigh', lam: 550e-9, D: 5e-3, Lobj: 10e3, sepFactor: 1 },
];

const X_SOURCE = -0.34;
const X_APERTURE = -0.14;
const X_SCREEN = 0.28;
const BARRIER_H = 0.22;
const SCREEN_H = 0.33;
const SCREEN_W = 0.055;
const TEX_W = 8;
const TEX_H = 1024;

function label(html) {
  const el = document.createElement('div');
  el.className = 'circuit-label';
  el.innerHTML = html;
  return new CSS2DObject(el);
}

/** Half the angular range the screen shows, per mode — enough to see the structure, not more. */
function halfAngle(state, c) {
  if (state.mode === 'slit') return Math.min(Math.PI / 2, 3.2 * (c.ss.theta1 ?? 0.3));
  if (state.mode === 'grating') {
    const last = c.g.thetaOrder(c.g.maxOrder) ?? Math.PI / 2.2;
    return Math.min(Math.PI / 2, last * 1.12 + 0.05);
  }
  return 3.4 * c.r.thetaMin;
}

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
    return { scenarioId: 'single', mode: 'slit', lam: 633e-9, a: 0.1e-3, L: 2, linesPerMM: 600, m: 2, D: 5e-3, Lobj: 10e3, sepFactor: 1, slitsDrawn: 6 };
  },
  applyScenario(id, state) {
    const sc = SCENARIOS.find((s) => s.id === id) || SCENARIOS[0];
    Object.assign(state, { scenarioId: sc.id, mode: sc.mode });
    for (const k of ['lam', 'a', 'L', 'linesPerMM', 'm', 'D', 'Lobj', 'sepFactor']) {
      if (sc[k] !== undefined) state[k] = sc[k];
    }
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
          <p class="tiny">The bench is stretched; the pattern is not. The screen is painted from the real I(θ) for the numbers above — sinc² for one slit, the N-slit function for a grating, the Airy disk for a round aperture.</p>
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
    group.add(fatLine([X_SOURCE * u, 0, 0, X_SCREEN * u, 0, 0], { color: M.gridLine, width: 1, opacity: 0.5 }));
    // Built at full capacity: a grating comb needs far more segments than a single slit.
    const barrier = fatSegments(segmentCapacity(64), { color: M.textMuted, width: 2 });
    group.add(barrier);
    group.add(fatLine([X_SCREEN * u, -SCREEN_H * u, 0, X_SCREEN * u, SCREEN_H * u, 0], { color: M.textMuted, width: 1.2, opacity: 0.7 }));

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
    screen.position.set((X_SCREEN + SCREEN_W / 2) * u, 0, 0);
    group.add(screen);

    const rays = fatSegments(segmentCapacity(64), { color: M.eVec, width: 1.2, opacity: 0.85 });
    group.add(rays);
    const marker = fatSegments(segmentCapacity(8), { color: M.accent, width: 2 });
    markAnswer(marker);
    group.add(marker);
    // A Line2 needs at least one segment up front; syncViews replaces these points every frame.
    const envelope = fatLine([0, 0, 0, 0, 0, 0], { color: M.bVec, width: 1.4, opacity: 0.75 });
    group.add(envelope);

    const labels = { source: label(''), aperture: label(''), order: label(''), note: label('') };
    markAnswer(labels.order);
    Object.values(labels).forEach((l) => group.add(l));
    group.visible = false;
    return { group, barrier, screen, canvas, texture, rays, marker, envelope, labels };
  },
  enter(ctx, handle) {
    handle.group.visible = true;
  },
  exit(ctx, handle) {
    handle.group.visible = false;
  },
  recompute(state, computed) {
    const ss = singleSlit({ lambda: state.lam, a: state.a, L: state.L });
    const g = grating({ lambda: state.lam, linesPerM: state.linesPerMM * 1e3, N: 12 });
    const r = rayleigh({ lambda: state.lam, D: state.D, L: state.Lobj });
    const thOrder = g.thetaOrder(state.m);
    computed.diff = {
      mode: state.mode,
      ss,
      g,
      r,
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
    const thMax = halfAngle(state, c);

    // The aperture, drawn as one gap, a comb of slits, or a round hole seen edge-on.
    const seg = [];
    if (state.mode === 'grating') {
      const pitch = 0.055;
      const n = state.slitsDrawn;
      for (let i = -n; i <= n; i++) {
        const y = i * pitch;
        seg.push(X_APERTURE * u, (y + 0.012) * u, 0, X_APERTURE * u, (y + pitch - 0.012) * u, 0);
      }
    } else {
      const half = state.mode === 'rayleigh' ? 0.075 : Math.max(0.012, Math.min(0.08, 0.012 + state.a * 90));
      seg.push(X_APERTURE * u, -BARRIER_H * u, 0, X_APERTURE * u, -half * u, 0);
      seg.push(X_APERTURE * u, half * u, 0, X_APERTURE * u, BARRIER_H * u, 0);
    }
    setFatSegments(h.barrier, seg);

    // Paint the screen from the real intensity for this mode.
    const g2 = h.canvas.getContext('2d');
    const img = g2.createImageData(TEX_W, TEX_H);
    const sep = c.thetaMin * state.sepFactor;
    for (let row = 0; row < TEX_H; row++) {
      const frac = 0.5 - row / (TEX_H - 1);
      const theta = frac * 2 * thMax;
      let I;
      if (state.mode === 'slit') I = singleSlitIntensity(theta, { lambda: state.lam, a: state.a });
      else if (state.mode === 'grating') I = gratingIntensity(theta, { lambda: state.lam, d: c.d, N: 12 });
      else {
        I = 0.5 * airyIntensity(theta - sep / 2, { lambda: state.lam, D: state.D })
          + 0.5 * airyIntensity(theta + sep / 2, { lambda: state.lam, D: state.D });
      }
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

    const yOf = (theta) => Math.max(-SCREEN_H, Math.min(SCREEN_H, (theta / (2 * thMax)) * 2 * SCREEN_H));

    // Rays in, and out to whatever this mode marks.
    const rays = [];
    rays.push(X_SOURCE * u, 0, 0, X_APERTURE * u, 0, 0);
    const marks = [];
    if (state.mode === 'slit' && c.theta1 != null) {
      for (const s of [1, -1]) {
        const y = yOf(s * c.theta1);
        rays.push(X_APERTURE * u, 0, 0, X_SCREEN * u, y * u, 0);
        marks.push((X_SCREEN + SCREEN_W) * u, y * u, 0, (X_SCREEN + SCREEN_W + 0.06) * u, y * u, 0);
      }
    } else if (state.mode === 'grating' && c.thetaOrder != null) {
      for (let m = -c.maxOrder; m <= c.maxOrder; m++) {
        const th = c.g.thetaOrder(m);
        if (th == null) continue;
        const y = yOf(th);
        rays.push(X_APERTURE * u, 0, 0, X_SCREEN * u, y * u, 0);
      }
      const y = yOf(c.thetaOrder);
      marks.push((X_SCREEN + SCREEN_W) * u, y * u, 0, (X_SCREEN + SCREEN_W + 0.07) * u, y * u, 0);
    } else if (state.mode === 'rayleigh') {
      for (const s of [1, -1]) {
        const y = yOf((s * sep) / 2);
        rays.push(X_SOURCE * u, y * 0.7 * u, 0, X_APERTURE * u, 0, 0);
        marks.push((X_SCREEN + SCREEN_W) * u, y * u, 0, (X_SCREEN + SCREEN_W + 0.06) * u, y * u, 0);
      }
    }
    setFatSegments(h.rays, rays);
    h.rays.material.color.copy(beam);
    setFatSegments(h.marker, marks);

    // For a grating, trace the single-slit-style envelope as a curve beside the screen.
    const env = [];
    if (state.mode === 'slit') {
      const steps = 120;
      for (let i = 0; i <= steps; i++) {
        const theta = -thMax + (2 * thMax * i) / steps;
        const I = singleSlitIntensity(theta, { lambda: state.lam, a: state.a });
        env.push((X_SCREEN - 0.02 - 0.16 * I) * u, yOf(theta) * u, 0);
      }
    }
    h.envelope.visible = env.length > 0;
    if (env.length) h.envelope.geometry.setPositions(env);

    const L = h.labels;
    L.source.position.set((X_SOURCE + 0.02) * u, 0.09 * u, 0);
    L.source.element.innerHTML = `${(state.lam * 1e9).toFixed(0)} nm`;
    L.aperture.position.set((X_APERTURE - 0.02) * u, -0.27 * u, 0);
    L.aperture.element.innerHTML =
      state.mode === 'slit' ? `a = ${(state.a * 1e3).toFixed(3)} mm`
        : state.mode === 'grating' ? `${state.linesPerMM.toFixed(0)} lines/mm &middot; d = ${(c.d * 1e6).toFixed(3)} μm`
          : `D = ${(state.D * 1e3).toFixed(1)} mm`;
    L.order.position.set((X_SCREEN + 0.07) * u, yOf(state.mode === 'grating' ? c.thetaOrder ?? 0 : c.theta1 ?? 0) * u, 0);
    L.order.element.innerHTML =
      state.mode === 'slit' ? (c.theta1 == null ? '' : `θ₁ = ${c.theta1Deg.toFixed(2)}°`)
        : state.mode === 'grating' ? (c.thetaOrder == null ? '' : `m = ${state.m}`)
          : c.resolved ? 'resolved' : 'not resolved';
    L.note.position.set(((X_APERTURE + X_SCREEN) / 2) * u, -0.3 * u, 0);
    L.note.element.innerHTML =
      state.mode === 'rayleigh'
        ? `${(state.Lobj / 1e3).toFixed(1)} km away &middot; not to scale`
        : `L = ${state.L.toFixed(2)} m &middot; not to scale`;

    ctx.grid.visible = false;
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
