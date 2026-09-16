import * as THREE from 'three';
import { CSS2DObject } from 'three/addons/renderers/CSS2DRenderer.js';
import { defineLab } from './define.js';
import { Arrow, M, fatLine } from '../scene/manim.js';
import { VectorBatch } from '../scene/arrows.js';
import { UNITS_PER_METER, C_SHEET } from '../physics/constants.js';
import { planeWave, spectrumBand, wavelengthRGB } from '../physics/emwave.js';
import { kv, cells, qv } from '../ui/shared.js';
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

const X0 = -1.15;
const X1 = 1.15;
const LAM_VIS = 0.8;
const N_ARR = 20;
const N_CURVE = 96;
const T_CYCLE = 2;

function label(html, x, y, z) {
  const el = document.createElement('div');
  el.className = 'circuit-label';
  el.innerHTML = html;
  const o = new CSS2DObject(el);
  o.position.set(x, y, z);
  o.userData.el = el;
  return o;
}

function makeCurve() {
  const geo = new THREE.BufferGeometry();
  const pos = new Float32Array(N_CURVE * 3);
  geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  const mat = new THREE.LineBasicMaterial({ color: 0xffffff, toneMapped: false });
  return { line: new THREE.Line(geo, mat), pos };
}

export default defineLab({
  id: 'emwave',
  exam: 'e6',
  title: 'EM wave',
  hint: 'E, B, and S are mutually perpendicular — S = E × B / μ₀ along +x',
  live: true,
  orbit: true,
  camera: { pos: new THREE.Vector3(7.4, 4.6, 9.6), target: new THREE.Vector3(0, 0.2, 0) },
  keys: { ' ': 'sweep', r: 'reset', R: 'reset' },
  scenarios: SCENARIOS,
  defaultState() {
    return {
      scenarioId: 'green',
      lambda: 532e-9,
      E0: 200,
      anim: { playing: true, i: 0 },
    };
  },
  applyScenario(id, state) {
    const sc = SCENARIOS.find((s) => s.id === id) || SCENARIOS[0];
    state.scenarioId = sc.id;
    state.lambda = sc.lambda;
    state.E0 = sc.E0;
    state.anim = { playing: true, i: 0 };
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
          <p class="tiny">The drawing is stretched and slowed: a few wavelengths fit on screen and one cycle takes 2 s. The numbers are the real wave. E red (ŷ), B teal (ẑ), S gold (+x̂). ŷ × ẑ = x̂.</p>
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
    if ($('btn-em-play')) $('btn-em-play').textContent = state.anim.playing ? 'Pause' : 'Play';
    $('em-E0').value = state.E0;
    $('em-E0-val').textContent = fmtE(state.E0);
    $('em-logL').value = Math.log10(state.lambda);
    $('em-logL-val').textContent = fmtWaveLen(state.lambda);
  },
  init(ctx) {
    const u = UNITS_PER_METER;
    const group = new THREE.Group();
    ctx.scene.add(group);
    group.add(fatLine([X0 * u, 0, 0, X1 * u, 0, 0], { color: M.white, width: 1.8 }));
    const Ebatch = new VectorBatch(group, M.red);
    const Bbatch = new VectorBatch(group, 0x5cd0b3);
    const eCurve = makeCurve();
    const bCurve = makeCurve();
    eCurve.line.material.color.set(M.red);
    bCurve.line.material.color.set(0x5cd0b3);
    group.add(eCurve.line, bCurve.line);
    const Sarr = new Arrow(new THREE.Vector3(1, 0, 0), new THREE.Vector3(0, 0, 0), 1.6, M.gold, 0.3, 0.22, 0.03);
    group.add(Sarr);
    const eLab = label('<span style="color:#fc6255">E</span>', 0.15 * u, 1.15 * u, 0);
    const bLab = label('<span style="color:#5cd0b3">B</span>', 0.15 * u, 0, 1.15 * u);
    const sLab = label('<span style="color:#f0ac5f">S</span>', 1.35 * u, 0.25 * u, 0);
    const kLab = label('k̂', (X1 + 0.12) * u, -0.28 * u, 0);
    group.add(eLab, bLab, sLab, kLab);
    group.visible = false;
    return { group, Ebatch, Bbatch, eCurve, bCurve, Sarr };
  },
  enter(ctx, handle) {
    handle.group.visible = true;
  },
  exit(ctx, handle) {
    handle.group.visible = false;
  },
  recompute(state, computed, ctx) {
    const tDisp = (state.t ?? 0);
    const w = planeWave({ E0: state.E0, lambda: state.lambda, t: 0, x: 0 });
    computed.em = {
      ...w,
      band: spectrumBand(state.lambda),
      rgb: wavelengthRGB(state.lambda),
      tDisp,
      kVis: (2 * Math.PI) / LAM_VIS,
      omegaVis: (2 * Math.PI) / T_CYCLE,
    };
  },
  syncViews(state, computed, ctx) {
    const h = ctx.handle;
    const em = computed.em;
    if (!h || !em) return;
    const u = UNITS_PER_METER;
    const t = em.tDisp;
    const k = em.kVis;
    const om = em.omegaVis;
    const col = new THREE.Color(em.rgb.r, em.rgb.g, em.rgb.b);
    const vis = em.band.id === 'vis';

    h.Ebatch.begin();
    h.Bbatch.begin();
    for (let i = 0; i < N_ARR; i++) {
      const x = X0 + (i / (N_ARR - 1)) * (X1 - X0);
      const s = Math.sin(k * x - om * t);
      const eL = 0.72 * s * u;
      const bL = 0.72 * s * u;
      const origin = new THREE.Vector3(x * u, 0, 0);
      if (Math.abs(eL) > 0.02) {
        const dirE = new THREE.Vector3(0, Math.sign(eL) || 1, 0);
        h.Ebatch.push(origin, dirE, Math.abs(eL), vis ? col : new THREE.Color(M.red));
      }
      if (Math.abs(bL) > 0.02) {
        const dirB = new THREE.Vector3(0, 0, Math.sign(bL) || 1);
        h.Bbatch.push(origin, dirB, Math.abs(bL), new THREE.Color(0x5cd0b3));
      }
    }
    h.Ebatch.end(true);
    h.Bbatch.end(true);

    const pe = h.eCurve.pos;
    const pb = h.bCurve.pos;
    for (let i = 0; i < N_CURVE; i++) {
      const x = X0 + (i / (N_CURVE - 1)) * (X1 - X0);
      const s = Math.sin(k * x - om * t);
      pe[i * 3] = x * u;
      pe[i * 3 + 1] = 0.72 * s * u;
      pe[i * 3 + 2] = 0;
      pb[i * 3] = x * u;
      pb[i * 3 + 1] = 0;
      pb[i * 3 + 2] = 0.72 * s * u;
    }
    h.eCurve.line.geometry.attributes.position.needsUpdate = true;
    h.bCurve.line.geometry.attributes.position.needsUpdate = true;
    if (vis) h.eCurve.line.material.color.copy(col);
    else h.eCurve.line.material.color.set(M.red);

    const sMid = Math.sin(-om * t);
    h.Sarr.position.set(0, 0, 0);
    h.Sarr.visible = true;
    h.Sarr.setDirection(new THREE.Vector3(1, 0, 0));
    h.Sarr.setLength(0.7 + 0.9 * sMid * sMid, 0.28, 0.2);
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
    const rows = [
      kv('Band', w.band.name),
      kv('λ', fmtWaveLen(state.lambda)),
      kv('f = c/λ', fmtHz(w.f)),
      kv('c = 1/√(μ₀ε₀)', `${sciHTML(w.c)} m/s  (sheet ${sciHTML(C_SHEET)} )`),
      kv('E₀', fmtE(state.E0)),
      kv('B₀ = E₀/c', fmtB(w.B0)),
      kv('E₀/B₀', `${sciHTML(state.E0 / w.B0)} m/s`),
      kv('I = ½ c ε₀ E₀²', fmtIrr(w.Iavg)),
      kv('S = (E × B)/μ₀', '+x̂  (ŷ × ẑ)'),
    ];
    return rows.join('');
  },
  readout(state, computed) {
    const w = computed.em;
    if (!w) return '';
    return cells([
      ['Band', w.band.name, w.band.id === 'vis' ? 'ok' : ''],
      ['λ', fmtWaveLen(state.lambda), ''],
      ['f', fmtHz(w.f), ''],
      ['I avg', fmtIrr(w.Iavg), ''],
    ]);
  },
  coach(state, computed) {
    const w = computed.em;
    const band = w?.band?.name || '';
    return {
      title: `${band} — E, B, and the travel direction are a triad`,
      body: `A plane wave is E ŷ and B ẑ with E/B = c, traveling +x̂ because ŷ × ẑ = x̂. The Poynting vector S = (E × B)/μ₀ is the energy flow; its average is the intensity I = ½ c ε₀ E₀². Stretching λ here does not change that — only the HUD numbers are the real wave. Ch 54 is the spectrum slider: same wave, different λ.`,
    };
  },
});
