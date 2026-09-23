import * as THREE from 'three';
import { CSS2DObject } from 'three/addons/renderers/CSS2DRenderer.js';
import { defineLab } from './define.js';
import { Arrow, M, fatLine, updateFatLine } from '../scene/manim.js';
import { VectorBatch } from '../scene/arrows.js';
import { UNITS_PER_METER, C_SHEET } from '../physics/constants.js';
import { planeWave, spectrumBand, wavelengthRGB, BANDS } from '../physics/emwave.js';
import { kv, cells, eq } from '../ui/shared.js';
import { fmtE, fmtHz, fmtWaveLen, fmtIrr, sciHTML } from '../ui/format.js';
import { fmtB } from './biot.js';

const SCENARIOS = [
  { id: 'green', name: 'Green light · 532 nm', lambda: 532e-9, E0: 200 },
  { id: 'red', name: 'Red light · 650 nm', lambda: 650e-9, E0: 200 },
  { id: 'violet', name: 'Violet · 420 nm', lambda: 420e-9, E0: 200 },
  { id: 'sun', name: 'Sunlight-scale E₀ (~1000 W/m²)', lambda: 550e-9, E0: 870 },
  { id: 'wifi', name: 'Wi-Fi 2.4 GHz · 12.5 cm', lambda: 0.125, E0: 5 },
  { id: 'micro', name: 'Microwave oven · 12.2 cm', lambda: 0.122, E0: 2000 },
  { id: 'radio', name: 'FM radio · 3.0 m (100 MHz)', lambda: 3.0, E0: 1 },
  { id: 'xray', name: 'Soft X-ray · 1 nm', lambda: 1e-9, E0: 50 },
];

/** Drawing (not physics) scale, in meters of scene: two wavelengths along x, fixed amplitude. */
const X0 = -0.7;
const X1 = 0.7;
const LAM_VIS = 0.7;
const AMP = 0.3;
const N_ARR = 24;
const N_CURVE = 97;
const T_CYCLE = 2;
const TEAL = M.teal;

/*
 * The spectrum ruler. The wave in the scene is drawn the same size whatever λ is (it has to be, to
 * be seen), so on its own it hides the one thing Ch 54 is about: λ spans some fifteen powers of ten.
 * The ruler is a log scale from 1 pm to 1 km with each band, a marker at this λ, and things the size
 * of one wavelength — so moving from radio to X-ray visibly travels across the page.
 */
const RULER_LO = -12; // log10 m
const RULER_HI = 3;
const SIZES = [
  [-10, 'atom'],
  [-8, 'virus'],
  [-5, 'cell'],
  [-3.3, 'pinhead'],
  [-1, 'hand'],
  [1, 'house'],
  [2.5, 'stadium'],
];
const BAND_COLOR = { radio: '#8a6a4a', microwave: '#a3743f', ir: '#9e3b2f', vis: null, uv: '#6b4fa0', xray: '#3f6f9e', gamma: '#2f8f7f' };
const pct = (lg) => (100 * (lg - RULER_LO)) / (RULER_HI - RULER_LO);

function rulerHTML() {
  const segs = BANDS.map((b) => {
    const lo = Math.max(RULER_LO, b.min > 0 ? Math.log10(b.min) : RULER_LO);
    const hi = Math.min(RULER_HI, Number.isFinite(b.max) ? Math.log10(b.max) : RULER_HI);
    const bg = b.id === 'vis'
      ? 'linear-gradient(to right, #7a3cff, #3c6cff, #2fd3a0, #d8e33a, #ff8a2a, #e33a2a)'
      : BAND_COLOR[b.id];
    return `<div class="spec-band" style="left:${pct(lo)}%;width:${pct(hi) - pct(lo)}%;background:${bg}"><span>${b.id === 'vis' ? '' : b.name}</span></div>`;
  }).join('');
  const ticks = [];
  for (let e = RULER_LO; e <= RULER_HI; e += 3) {
    const t = e === 0 ? '1 m' : e === -3 ? '1 mm' : e === -6 ? '1 μm' : e === -9 ? '1 nm' : e === -12 ? '1 pm' : e === 3 ? '1 km' : `10<sup>${e}</sup> m`;
    ticks.push(`<div class="spec-tick" style="left:${pct(e)}%"><span>${t}</span></div>`);
  }
  const sizes = SIZES.map(([lg, name]) => `<div class="spec-size" style="left:${pct(lg)}%">${name}</div>`).join('');
  return `<div class="spec-title">One wavelength of this wave is… <span id="spec-now"></span></div>
    <div class="spec-bar">${segs}<div class="spec-vis-label" style="left:${pct(-6.25)}%">visible</div><div class="spec-marker" id="spec-marker"></div></div>
    <div class="spec-ticks">${ticks.join('')}</div>
    <div class="spec-sizes">${sizes}</div>`;
}

function label(html, x, y, z) {
  const el = document.createElement('div');
  el.className = 'circuit-label';
  el.innerHTML = html;
  const o = new CSS2DObject(el);
  o.position.set(x, y, z);
  o.userData.el = el;
  return o;
}

export default defineLab({
  id: 'emwave',
  exam: 'e6',
  title: 'EM wave',
  hint: 'E, B, and the direction of travel are mutually perpendicular — S = E × B / μ₀',
  live: true,
  orbit: true,
  // Aimed a little low so the wave sits above the spectrum ruler at the bottom of the screen.
  camera: { pos: new THREE.Vector3(8.5, 4.6, 15), target: new THREE.Vector3(0.7, -1.3, 0) },
  keys: { ' ': 'sweep', r: 'reset', R: 'reset' },
  scenarios: SCENARIOS,
  defaultState() {
    return { scenarioId: 'green', lambda: 532e-9, E0: 200, t: 0, anim: { playing: true, i: 0 } };
  },
  applyScenario(id, state) {
    const sc = SCENARIOS.find((s) => s.id === id) || SCENARIOS[0];
    Object.assign(state, { scenarioId: sc.id, lambda: sc.lambda, E0: sc.E0, anim: { playing: true, i: 0 } });
  },
  controls() {
    return `
        <div class="lab-block">
          <button type="button" class="btn accent" id="btn-em-play">Pause</button>
          <label class="field">
            <span>E₀</span>
            <div class="slider-row">
              <input type="range" id="em-E0" min="1" max="2000" step="1" value="200" />
              <span class="mono val" id="em-E0-val">200 N/C</span>
            </div>
          </label>
          <label class="field">
            <span>Wavelength λ (log)</span>
            <div class="slider-row">
              <input type="range" id="em-logL" min="-12" max="2" step="0.01" value="-6.27" data-log="10" data-box-unit="m" />
              <span class="mono val" id="em-logL-val">532 nm</span>
            </div>
          </label>
          <p class="tiny">The picture is stretched and slowed — two wavelengths on screen, one cycle every 2 s, E and B drawn the same height — but every number in the panel is the real wave. E along ŷ (colored by λ when visible), B along ẑ in teal, travel along +x̂ because ŷ × ẑ = x̂.</p>
        </div>`;
  },
  bind(api) {
    const $ = (id) => document.getElementById(id);
    $('btn-em-play').addEventListener('click', () => api.toggleSweep());
    $('em-E0').addEventListener('input', (e) => {
      api.slice().E0 = Number(e.target.value);
      api.bump(false);
    });
    $('em-logL').addEventListener('input', (e) => {
      api.slice().lambda = 10 ** Number(e.target.value);
      api.bump(false);
    });
  },
  syncControls(state) {
    const $ = (id) => document.getElementById(id);
    $('btn-em-play').textContent = state.anim.playing ? 'Pause' : 'Play';
    $('em-E0').value = state.E0;
    $('em-E0-val').textContent = fmtE(state.E0);
    $('em-logL').value = Math.log10(state.lambda);
    $('em-logL-val').textContent = fmtWaveLen(state.lambda);
  },
  init(ctx) {
    const u = UNITS_PER_METER;
    const group = new THREE.Group();
    ctx.scene.add(group);
    group.add(fatLine([X0 * u - 0.6, 0, 0, X1 * u + 0.6, 0, 0], { color: M.white, width: 1.8 }));
    const Ebatch = new VectorBatch(group, M.red);
    const Bbatch = new VectorBatch(group, TEAL);
    const zeros = new Array(N_CURVE * 3).fill(0);
    for (let i = 0; i < N_CURVE; i++) zeros[i * 3] = (X0 + (i / (N_CURVE - 1)) * (X1 - X0)) * u;
    const eCurve = fatLine(zeros, { color: M.red, width: 3 });
    const bCurve = fatLine(zeros, { color: TEAL, width: 3 });
    group.add(eCurve, bCurve);
    const Sarr = new Arrow(new THREE.Vector3(1, 0, 0), new THREE.Vector3((X1 + 0.12) * u, 0, 0), 1.6, M.gold, 0.34, 0.26, 0.05);
    group.add(Sarr);
    const eLab = label('<i>E</i>', X0 * u - 0.2, (AMP + 0.06) * u, 0);
    const bLab = label('<span class="qB"><i>B</i></span>', X0 * u - 0.2, 0.2, (AMP + 0.06) * u);
    const sLab = label('<span style="color:#F0AC5F"><i>S</i>, direction of travel</span>', (X1 + 0.2) * u, 0.5, 0);
    group.add(eLab, bLab, sLab);
    group.visible = false;
    const ruler = document.createElement('div');
    ruler.className = 'hud panel spectrum-ruler';
    ruler.innerHTML = rulerHTML();
    ruler.hidden = true;
    document.body.appendChild(ruler);
    return { group, Ebatch, Bbatch, eCurve, bCurve, Sarr, eLab, ruler };
  },
  enter(ctx, handle) {
    handle.group.visible = true;
    handle.ruler.hidden = false;
  },
  exit(ctx, handle) {
    handle.group.visible = false;
    handle.ruler.hidden = true;
  },
  recompute(state, computed) {
    const w = planeWave({ E0: state.E0, lambda: state.lambda, t: 0, x: 0 });
    computed.em = { ...w, band: spectrumBand(state.lambda), rgb: wavelengthRGB(state.lambda), tDisp: state.t ?? 0 };
  },
  syncViews(state, computed, ctx) {
    const h = ctx.handle;
    const em = computed.em;
    if (!h || !em) return;
    const u = UNITS_PER_METER;
    const k = (2 * Math.PI) / LAM_VIS;
    const om = (2 * Math.PI) / T_CYCLE;
    const t = em.tDisp;
    const lg = Math.log10(state.lambda);
    const m = h.ruler.querySelector('#spec-marker');
    if (m) m.style.left = `${Math.max(0, Math.min(100, pct(lg)))}%`;
    const now = h.ruler.querySelector('#spec-now');
    if (now) {
      const near = SIZES.reduce((a, s) => (Math.abs(s[0] - lg) < Math.abs(a[0] - lg) ? s : a));
      now.innerHTML = `${fmtWaveLen(state.lambda)} — ${em.band.name.toLowerCase()}, about the size of a${/^[aeiou]/.test(near[1]) ? 'n' : ''} ${near[1]}`;
    }
    const vis = em.band.id === 'vis';
    const eColor = vis ? new THREE.Color(em.rgb.r, em.rgb.g, em.rgb.b) : new THREE.Color(M.red);
    const bColor = new THREE.Color(TEAL);

    h.Ebatch.begin();
    h.Bbatch.begin();
    const origin = new THREE.Vector3();
    const up = new THREE.Vector3(0, 1, 0);
    const down = new THREE.Vector3(0, -1, 0);
    const out = new THREE.Vector3(0, 0, 1);
    const inn = new THREE.Vector3(0, 0, -1);
    for (let i = 0; i < N_ARR; i++) {
      const x = X0 + (i / (N_ARR - 1)) * (X1 - X0);
      const L = AMP * Math.sin(k * x - om * t) * u;
      if (Math.abs(L) < 0.06) continue;
      origin.set(x * u, 0, 0);
      h.Ebatch.push(origin, L > 0 ? up : down, Math.abs(L), eColor);
      h.Bbatch.push(origin, L > 0 ? out : inn, Math.abs(L), bColor);
    }
    h.Ebatch.end(true);
    h.Bbatch.end(true);

    const pe = new Array(N_CURVE * 3);
    const pb = new Array(N_CURVE * 3);
    for (let i = 0; i < N_CURVE; i++) {
      const x = X0 + (i / (N_CURVE - 1)) * (X1 - X0);
      const s = AMP * Math.sin(k * x - om * t) * u;
      pe[i * 3] = x * u;
      pe[i * 3 + 1] = s;
      pe[i * 3 + 2] = 0;
      pb[i * 3] = x * u;
      pb[i * 3 + 1] = 0;
      pb[i * 3 + 2] = s;
    }
    updateFatLine(h.eCurve, pe);
    updateFatLine(h.bCurve, pb);
    h.eCurve.material.color.copy(eColor);
    h.eLab.element.style.color = `#${eColor.getHexString()}`;

    // |S| at the front of the drawing pulses as sin², always along +x.
    const s = Math.sin(k * X1 - om * t);
    h.Sarr.setLength(0.6 + 1.4 * s * s, 0.34, 0.26);
    ctx.grid.visible = true;
  },
  tick(dt, state) {
    if (!state.anim.playing) return false;
    state.t = (state.t || 0) + dt;
    return true;
  },
  law: () => [
    String.raw`\vec{E}\perp\vec{B}\perp\hat{k},\quad \dfrac{E}{B}=c=\dfrac{1}{\sqrt{\mu_0\varepsilon_0}}`,
    String.raw`I=\tfrac12 c\varepsilon_0 E_0^2=\dfrac{E_0 B_0}{2\mu_0},\quad c=f\lambda`,
  ],
  liveRows(state, computed) {
    const w = computed.em;
    if (!w) return '';
    return [
      kv('Band', w.band.name),
      kv(String.raw`$\lambda$`, fmtWaveLen(state.lambda)),
      kv(String.raw`$f = c/\lambda$`, fmtHz(w.f)),
      kv(String.raw`$c = 1/\sqrt{\mu_0\varepsilon_0}$`, `${sciHTML(w.c, 3)} m/s (sheet ${sciHTML(C_SHEET)})`),
      kv(String.raw`$E_0$`, fmtE(state.E0)),
      kv(String.raw`$B_0 = E_0/c$`, fmtB(w.B0)),
      kv(String.raw`$I = \tfrac{1}{2}c\varepsilon_0 E_0^2$`, fmtIrr(w.Iavg)),
      kv(String.raw`direction of $\vec{S} = \vec{E}\times\vec{B}$`, String.raw`$+\hat{x}$ ($\hat{y}\times\hat{z} = \hat{x}$)`),
    ].join('');
  },
  readout(state, computed) {
    const w = computed.em;
    if (!w) return '';
    return cells([
      ['Band', w.band.name, w.band.id === 'vis' ? 'ok' : ''],
      [String.raw`$f$`, fmtHz(w.f), ''],
      [String.raw`$B_0$`, fmtB(w.B0), ''],
      [String.raw`$I_{\text{avg}}$`, fmtIrr(w.Iavg), ''],
    ]);
  },
  coach(state, computed) {
    const w = computed.em;
    const band = w?.band?.name || '';
    return {
      title: `${band}: $\\vec{E}$, $\\vec{B}$ and the travel direction form a right-handed triad`,
      body: [
        `$\\vec{E}$ is along $\\hat{y}$ and $\\vec{B}$ along $\\hat{z}$, in phase, with $E/B = c$ at every instant — which is why $B_0 = E_0/c$ is so small (${w ? fmtB(w.B0) : '—'} here). The energy flows along $\\vec{S} = (\\vec{E}\\times\\vec{B})/\\mu_0$, and its average is the intensity:`,
        eq(String.raw`I = \tfrac{1}{2}c\varepsilon_0 E_0^2`),
        String.raw`Double $E_0$ and $I$ goes up four times. Sliding $\lambda$ across the spectrum changes $f = c/\lambda$, but not $c$ and not the geometry.`,
      ],
    };
  },
});
