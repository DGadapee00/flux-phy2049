import * as THREE from 'three';
import { CSS2DObject } from 'three/addons/renderers/CSS2DRenderer.js';
import { defineLab } from './define.js';
import { Arrow, M, fatLine, updateFatLine } from '../scene/manim.js';
import { VectorBatch } from '../scene/arrows.js';
import { UNITS_PER_METER, C_SHEET } from '../physics/constants.js';
import { planeWave, spectrumBand, wavelengthRGB } from '../physics/emwave.js';
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
const TEAL = M.bVec;

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
  camera: { pos: new THREE.Vector3(8.5, 5.6, 14), target: new THREE.Vector3(0.7, 0.2, 0) },
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
              <input type="range" id="em-logL" min="-12" max="2" step="0.01" value="-6.27" />
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
    group.add(fatLine([X0 * u - 0.6, 0, 0, X1 * u + 0.6, 0, 0], { color: M.textMuted, width: 1.2, opacity: 0.7 }));
    const Ebatch = new VectorBatch(group, M.eVec);
    const Bbatch = new VectorBatch(group, TEAL);
    const zeros = new Array(N_CURVE * 3).fill(0);
    for (let i = 0; i < N_CURVE; i++) zeros[i * 3] = (X0 + (i / (N_CURVE - 1)) * (X1 - X0)) * u;
    const eCurve = fatLine(zeros, { color: M.eVec, width: 2 });
    const bCurve = fatLine(zeros, { color: TEAL, width: 2 });
    group.add(eCurve, bCurve);
    const Sarr = new Arrow(new THREE.Vector3(1, 0, 0), new THREE.Vector3((X1 + 0.12) * u, 0, 0), 1.6, M.accent, 0.28, 0.22, 0.038);
    Sarr.traverse((o) => { if (o.material) { o.material.transparent = true; o.material.opacity = 0.7; } });
    group.add(Sarr);
    const eLab = label('<i>E</i>', X0 * u - 0.2, (AMP + 0.06) * u, 0);
    const bLab = label('<span class="qB"><i>B</i></span>', X0 * u - 0.2, 0.2, (AMP + 0.06) * u);
    const sLab = label('<span style="color:#5BA8C9"><i>S</i>, direction of travel</span>', (X1 + 0.2) * u, 0.5, 0);
    group.add(eLab, bLab, sLab);
    group.visible = false;
    return { group, Ebatch, Bbatch, eCurve, bCurve, Sarr, eLab };
  },
  enter(ctx, handle) {
    handle.group.visible = true;
  },
  exit(ctx, handle) {
    handle.group.visible = false;
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
    const vis = em.band.id === 'vis';
    // Still tinted by λ, as the Setup note says — but pulled back toward the instrument warm so a
    // visible wavelength reads as a muted cast rather than a neon stripe.
    const eColor = vis
      ? new THREE.Color(em.rgb.r, em.rgb.g, em.rgb.b).lerp(new THREE.Color(M.eVec), 0.62)
      : new THREE.Color(M.eVec);
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
