import * as THREE from 'three';
import { CSS2DObject } from 'three/addons/renderers/CSS2DRenderer.js';
import { defineLab } from './define.js';
import { M, fatLine, fatSegments, markAnswer, setFatSegments, segmentCapacity } from '../scene/manim.js';
import { UNITS_PER_METER } from '../physics/constants.js';
import { thinFilm, wavelengthRGB } from '../physics/waveoptics.js';
import { kv, cells, qv, eq } from '../ui/shared.js';

/**
 * Ch 65 · thin-film interference.
 *
 * Two reflections come back from the film: one off the top, one off the bottom. Whether they add
 * or cancel depends on the extra 2t the second one travels *and* on which reflections flip by half
 * a wavelength. The slab is drawn thick enough to see; the numbers are the real ones.
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
const FILM_DRAW = 0.16; // the slab's drawn thickness, fixed; the real t is in the panel
const SUB_H = 0.2;
const RAY_DX = 0.17;
const RAY_UP = 0.26;
const SWATCH_W = 128;

function label(html) {
  const el = document.createElement('div');
  el.className = 'circuit-label';
  el.innerHTML = html;
  return new CSS2DObject(el);
}

/** The colour this film reflects: every visible wavelength, weighted by how well it comes back. */
function reflectedColor(nf, ns, t) {
  let r = 0;
  let g = 0;
  let b = 0;
  let w = 0;
  for (let nm = 400; nm <= 700; nm += 5) {
    const lam = nm * 1e-9;
    const f = thinFilm({ nFilm: nf, nSub: ns, lambda: lam, t });
    const c = wavelengthRGB(lam);
    r += c.r * f.reflectance;
    g += c.g * f.reflectance;
    b += c.b * f.reflectance;
    w += 1;
  }
  const peak = Math.max(r, g, b, 1e-6);
  const norm = 235 / peak;
  return { r: Math.round(r * norm), g: Math.round(g * norm), b: Math.round(b * norm), avg: (r + g + b) / (3 * 255 * w) };
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
          <p class="tiny">The slab is drawn at a fixed thickness so the two rays stay apart — the real t is the one in the panel. The swatch is the colour this film sends back in white light: every visible wavelength, weighted by how well it survives the round trip.</p>
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

    const slab = new THREE.Mesh(
      new THREE.PlaneGeometry((X_R - X_L) * u, FILM_DRAW * u),
      new THREE.MeshBasicMaterial({ color: M.blueE, transparent: true, opacity: 0.3, toneMapped: false, side: THREE.DoubleSide }),
    );
    slab.position.set(0, (Y_TOP - FILM_DRAW / 2) * u, 0);
    group.add(slab);

    const substrate = new THREE.Mesh(
      new THREE.PlaneGeometry((X_R - X_L) * u, SUB_H * u),
      new THREE.MeshBasicMaterial({ color: 0x2a2f3a, transparent: true, opacity: 0.85, toneMapped: false, side: THREE.DoubleSide }),
    );
    substrate.position.set(0, (Y_TOP - FILM_DRAW - SUB_H / 2) * u, 0);
    group.add(substrate);

    group.add(fatLine([X_L * u, Y_TOP * u, 0, X_R * u, Y_TOP * u, 0], { color: M.white, width: 2.2 }));
    group.add(fatLine([X_L * u, (Y_TOP - FILM_DRAW) * u, 0, X_R * u, (Y_TOP - FILM_DRAW) * u, 0], { color: M.white, width: 2.2 }));

    const rayIn = fatSegments(segmentCapacity(4), { color: M.gold, width: 2.4 });
    const rayTop = fatSegments(segmentCapacity(4), { color: M.gold, width: 2.6 });
    const rayBot = fatSegments(segmentCapacity(6), { color: M.gold, width: 2.6 });
    group.add(rayIn, rayTop, rayBot);
    // How the two reflected rays combine is the answer to every problem here.
    markAnswer(rayTop);
    markAnswer(rayBot);

    const swatchCanvas = document.createElement('canvas');
    swatchCanvas.width = SWATCH_W;
    swatchCanvas.height = 8;
    const swatchTex = new THREE.CanvasTexture(swatchCanvas);
    const swatch = new THREE.Mesh(
      new THREE.PlaneGeometry(0.34 * u, 0.075 * u),
      new THREE.MeshBasicMaterial({ map: swatchTex, toneMapped: false }),
    );
    swatch.position.set(0, (Y_TOP + 0.42) * u, 0);
    markAnswer(swatch);
    group.add(swatch);

    const labels = {
      top: label(''),
      bottom: label(''),
      film: label(''),
      sub: label(''),
      verdict: label(''),
      swatch: label('reflected colour'),
    };
    markAnswer(labels.verdict);
    markAnswer(labels.top);
    markAnswer(labels.bottom);
    Object.values(labels).forEach((l) => group.add(l));
    group.visible = false;
    return { group, slab, substrate, rayIn, rayTop, rayBot, swatch, swatchCanvas, swatchTex, labels };
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
    const beam = new THREE.Color(`rgb(${rgb.r},${rgb.g},${rgb.b})`);

    const hitX = -0.05;
    // Incoming ray, drawn at a slant so the two reflections are distinguishable (physics is normal
    // incidence, as every problem in Ch 65 assumes).
    setFatSegments(h.rayIn, [(hitX - RAY_DX) * u, (Y_TOP + RAY_UP) * u, 0, hitX * u, Y_TOP * u, 0]);
    setFatSegments(h.rayTop, [hitX * u, Y_TOP * u, 0, (hitX + RAY_DX) * u, (Y_TOP + RAY_UP) * u, 0]);
    // Down through the film, back off the substrate, out the top.
    const innerDX = 0.05;
    const outX = hitX + 2 * innerDX;
    setFatSegments(h.rayBot, [
      hitX * u, Y_TOP * u, 0, (hitX + innerDX) * u, (Y_TOP - FILM_DRAW) * u, 0,
      (hitX + innerDX) * u, (Y_TOP - FILM_DRAW) * u, 0, outX * u, Y_TOP * u, 0,
      outX * u, Y_TOP * u, 0, (outX + RAY_DX) * u, (Y_TOP + RAY_UP) * u, 0,
    ]);
    h.rayIn.material.color.copy(beam);
    h.rayTop.material.color.copy(beam);
    h.rayBot.material.color.copy(beam);

    h.slab.material.color.set(c.bright ? 0x2f6f5f : 0x33405a);

    // The swatch: what this film sends back in white light.
    const col = reflectedColor(state.nf, state.ns, state.t);
    const g2 = h.swatchCanvas.getContext('2d');
    g2.fillStyle = `rgb(${col.r},${col.g},${col.b})`;
    g2.fillRect(0, 0, SWATCH_W, 8);
    h.swatchTex.needsUpdate = true;

    const L = h.labels;
    L.top.position.set((hitX - 0.05) * u, (Y_TOP + 0.12) * u, 0);
    L.top.element.innerHTML = c.topShift
      ? 'top reflection: <b>½λ flip</b>'
      : 'top reflection: no flip';
    L.bottom.position.set((hitX + 0.2) * u, (Y_TOP - FILM_DRAW - 0.07) * u, 0);
    L.bottom.element.innerHTML = c.bottomShift
      ? 'bottom reflection: <b>½λ flip</b>'
      : 'bottom reflection: no flip';
    L.film.position.set((X_L + 0.17) * u, (Y_TOP - FILM_DRAW / 2) * u, 0);
    L.film.element.innerHTML = `film n = ${state.nf.toFixed(2)} &middot; t = ${(state.t * 1e9).toFixed(1)} nm`;
    L.sub.position.set((X_L + 0.08) * u, (Y_TOP - FILM_DRAW - SUB_H / 2) * u, 0);
    L.sub.element.innerHTML = `n = ${state.ns.toFixed(2)}`;
    L.verdict.position.set(0, (Y_TOP + 0.3) * u, 0);
    L.verdict.element.innerHTML = c.bright
      ? `<b>${(state.lam * 1e9).toFixed(0)} nm comes back strongly</b>`
      : `${(state.lam * 1e9).toFixed(0)} nm is cancelled`;
    L.swatch.position.set(0, (Y_TOP + 0.5) * u, 0);

    ctx.grid.visible = false;
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
