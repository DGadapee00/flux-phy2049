import * as THREE from 'three';
import { defineLab } from './define.js';
import { conductorField, imageGrounded, imageIsolatedNeutral, sigmaUniform, sigmaSphere, EoutsideSphere } from '../physics/conductors.js';
import { fmtE, fmtCharge } from '../ui/format.js';
import { kv, cells } from '../ui/shared.js';
import { UNITS_PER_METER } from '../physics/constants.js';
import { POS_COLOR, NEG_COLOR } from '../scene/manim.js';

const _neutral = new THREE.Color(0x3a3d44);
const _pos = new THREE.Color(POS_COLOR);
const _neg = new THREE.Color(NEG_COLOR);
const _c = new THREE.Color();

/** Vertex colors by σ: red +, blue −, charcoal ≈ 0 (sqrt so small σ still reads). */
function paintSigma(mesh, sigmaAt, sMax) {
  const pos = mesh.geometry.attributes.position;
  const col = mesh.geometry.attributes.color;
  for (let i = 0; i < pos.count; i++) {
    const s = sigmaAt({ x: pos.getX(i), y: pos.getY(i), z: pos.getZ(i) });
    const t = Math.max(-1, Math.min(1, s / (sMax || 1)));
    _c.copy(_neutral).lerp(t >= 0 ? _pos : _neg, Math.sqrt(Math.abs(t)));
    col.setXYZ(i, _c.r, _c.g, _c.b);
  }
  col.needsUpdate = true;
}

function sigmaSphereMesh(w, h) {
  const geo = new THREE.SphereGeometry(1, w, h);
  geo.setAttribute('color', new THREE.BufferAttribute(new Float32Array(geo.attributes.position.count * 3), 3));
  const mat = new THREE.MeshStandardMaterial({
    color: 0xffffff,
    vertexColors: true,
    metalness: 0.15,
    roughness: 0.45,
    transparent: true,
    opacity: 0.62,
    side: THREE.DoubleSide,
    depthWrite: false,
  });
  return new THREE.Mesh(geo, mat);
}

const SCENARIOS = [
  { id: 'uniform', name: 'Isolated sphere, charge on the surface', kind: 'uniform', R: 0.35, Q: 2e-6, q: 0, d: 0.7, a: 0.22, b: 0.38 },
  { id: 'grounded', name: 'Grounded sphere + outside point charge', kind: 'grounded', R: 0.32, Q: 0, q: 1.5e-6, d: 0.7, a: 0.22, b: 0.38 },
  { id: 'neutral', name: 'Neutral isolated sphere + outside q', kind: 'neutral', R: 0.32, Q: 0, q: 1.5e-6, d: 0.7, a: 0.22, b: 0.38 },
  { id: 'cage', name: 'Faraday cage — charge in the cavity', kind: 'cage', R: 0.35, Q: 0, q: 1e-6, d: 0, a: 0.22, b: 0.4 },
];

export default defineLab({
  id: 'conductors',
  exam: 'e2',
  title: 'Conductors',
  hint: 'Move the probe: E = 0 in the metal',
  orbit: true,
  probe: true,
  legend: { id: 'sigma', title: 'Surface charge σ', low: '− induced', high: '+', barClass: 'legend-sigma' },
  camera: { pos: new THREE.Vector3(6.2, 4.2, 9.4), target: new THREE.Vector3(0, 0, 0) },
  keys: { r: 'reset', R: 'reset' },
  scenarios: SCENARIOS,
  defaultState() {
    return {
      scenarioId: 'uniform',
      kind: 'uniform',
      R: 0.35,
      Q: 2e-6,
      q: 1.5e-6,
      d: 0.7,
      a: 0.22,
      b: 0.38,
      probe: { x: 0.55, y: 0.05, z: 0 },
      charges: [],
      show: {},
      anim: { playing: false, i: 0 },
    };
  },
  applyScenario(id, state) {
    const sc = SCENARIOS.find((s) => s.id === id) || SCENARIOS[0];
    state.scenarioId = sc.id;
    state.kind = sc.kind;
    state.R = sc.R;
    state.Q = sc.Q;
    state.q = sc.q;
    state.d = sc.d;
    state.a = sc.a;
    state.b = sc.b;
    if (sc.kind === 'cage') state.probe = { x: 0.5, y: 0.05, z: 0 };
    else if (sc.kind === 'uniform') state.probe = { x: 0.55, y: 0.05, z: 0 };
    else state.probe = { x: 0.15, y: 0.05, z: 0 };
  },
  controls() {
    return `
        <div class="lab-block">
          <label class="field">
            <span>Sphere / outer radius</span>
            <div class="slider-row">
              <input type="range" id="con-R" min="0.18" max="0.55" step="0.01" value="0.35" />
              <span class="mono val" id="con-R-val">0.35 m</span>
            </div>
          </label>
          <label class="field" id="wrap-con-Q">
            <span>Q on the sphere</span>
            <div class="slider-row">
              <input type="range" id="con-Q" min="-5" max="5" step="0.1" value="2" />
              <span class="mono val" id="con-Q-val">+2.00 μC</span>
            </div>
          </label>
          <label class="field" id="wrap-con-q">
            <span>Point charge q</span>
            <div class="slider-row">
              <input type="range" id="con-q" min="-5" max="5" step="0.1" value="1.5" />
              <span class="mono val" id="con-q-val">+1.50 μC</span>
            </div>
          </label>
          <label class="field" id="wrap-con-d">
            <span>Distance d of q</span>
            <div class="slider-row">
              <input type="range" id="con-d" min="0.4" max="1.2" step="0.01" value="0.7" />
              <span class="mono val" id="con-d-val">0.70 m</span>
            </div>
          </label>
          <p class="tiny">E inside the metal is identically 0. Outside we use the image-charge solution for a sphere (not a Riemann-sum Gauss engine). A Gaussian surface drawn in the metal has Q_in = 0, so Gauss agrees.</p>
        </div>`;
  },
  bind(api) {
    const $ = (id) => document.getElementById(id);
    $('con-R').addEventListener('input', (e) => {
      const s = api.slice();
      s.R = Number(e.target.value);
      s.b = Math.max(s.R, s.a + 0.04);
      s.d = Math.max(s.d, s.R + 0.08);
      api.bump();
    });
    $('con-Q').addEventListener('input', (e) => {
      api.slice().Q = Number(e.target.value) * 1e-6;
      api.bump();
    });
    $('con-q').addEventListener('input', (e) => {
      api.slice().q = Number(e.target.value) * 1e-6;
      api.bump();
    });
    $('con-d').addEventListener('input', (e) => {
      const s = api.slice();
      s.d = Math.max(s.R + 0.08, Number(e.target.value));
      api.bump();
    });
  },
  syncControls(state) {
    const $ = (id) => document.getElementById(id);
    $('con-R').value = state.R;
    $('con-R-val').textContent = `${state.R.toFixed(2)} m`;
    $('con-Q').value = state.Q * 1e6;
    $('con-Q-val').textContent = fmtCharge(state.Q);
    $('con-q').value = state.q * 1e6;
    $('con-q-val').textContent = fmtCharge(state.q);
    $('con-d').value = state.d;
    $('con-d-val').textContent = `${state.d.toFixed(2)} m`;
    $('wrap-con-Q').hidden = state.kind !== 'uniform';
    $('wrap-con-q').hidden = state.kind === 'uniform';
    $('wrap-con-d').hidden = state.kind === 'uniform' || state.kind === 'cage';
  },
  init(ctx) {
    const group = new THREE.Group();
    ctx.scene.add(group);
    const sphere = sigmaSphereMesh(72, 48);
    const inner = sigmaSphereMesh(48, 32);
    const qMesh = new THREE.Mesh(
      new THREE.SphereGeometry(0.11, 20, 14),
      new THREE.MeshBasicMaterial({ color: POS_COLOR, toneMapped: false }),
    );
    group.add(sphere, inner, qMesh);
    group.visible = false;
    return { group, sphere, inner, qMesh };
  },
  enter(ctx, handle) {
    handle.group.visible = true;
  },
  exit(ctx, handle) {
    handle.group.visible = false;
  },
  recompute(state, computed) {
    computed.cond = conductorField(state, state.probe);
    if (state.kind === 'grounded') computed.image = imageGrounded(state.q, state.d, state.R);
    else if (state.kind === 'neutral') computed.image = imageIsolatedNeutral(state.q, state.d, state.R);
    else computed.image = null;
    computed.sigma = state.kind === 'uniform' ? sigmaUniform(state.Q, state.R) : null;
    computed.Eout = state.kind === 'uniform' ? EoutsideSphere(state.Q, Math.max(state.R, Math.hypot(state.probe.x, state.probe.y, state.probe.z))) : null;
  },
  syncViews(state, computed, ctx) {
    const h = ctx.handle;
    if (!h) return;
    const u = UNITS_PER_METER;
    const outer = state.kind === 'cage' ? state.b : state.R;
    h.sphere.scale.setScalar(outer * u);
    h.inner.visible = state.kind === 'cage';
    if (state.kind === 'cage') h.inner.scale.setScalar(state.a * u);
    h.qMesh.visible = state.kind !== 'uniform';
    if (state.kind === 'cage') h.qMesh.position.set(0, 0, 0);
    else if (state.kind !== 'uniform') h.qMesh.position.set(state.d * u, 0, 0);
    h.qMesh.material.color.setHex(state.q >= 0 ? POS_COLOR : NEG_COLOR);

    const sigmaInner = state.kind === 'cage' ? -state.q / (4 * Math.PI * state.a * state.a) : 0;
    let sMax = Math.abs(sigmaInner);
    for (const c of [1, 0, -1]) sMax = Math.max(sMax, Math.abs(sigmaSphere(state, { x: c, y: Math.sqrt(1 - c * c), z: 0 })));
    paintSigma(h.sphere, (dir) => sigmaSphere(state, dir), sMax);
    if (state.kind === 'cage') paintSigma(h.inner, () => sigmaInner, sMax);
    const probe = ctx.pool.probe();
    probe.setVisible(true);
    probe.sync(state.probe, computed.cond, computed.cond.region === 'metal' ? 'E = 0' : '');
    ctx.grid.visible = true;
  },
  law(state) {
    if (state.kind === 'cage') {
      return [String.raw`E=0\text{ in the metal}`, String.raw`\text{cavity: }E=\dfrac{kq}{r^2}\quad\text{outside isolated: }E=\dfrac{kq}{r^2}`];
    }
    if (state.kind === 'uniform') {
      return [String.raw`E=0\text{ for }r<R\qquad E=\dfrac{kQ}{r^2}\text{ for }r>R`, String.raw`\sigma=\dfrac{Q}{4\pi R^2}`];
    }
    return [String.raw`q'=-\dfrac{R}{d}q\qquad d'=\dfrac{R^2}{d}`, String.raw`E=0\text{ inside the conductor}`];
  },
  liveRows(state, computed) {
    const E = computed.cond;
    if (!E) return '';
    const rows = [
      kv('Region', E.region),
      kv('|E| at probe', fmtE(E.mag)),
      kv('E<sub>x</sub>', fmtE(E.x)),
      kv('Probe', `(${state.probe.x.toFixed(2)}, ${state.probe.y.toFixed(2)}, ${state.probe.z.toFixed(2)}) m`),
    ];
    if (computed.sigma != null) rows.push(kv('σ = Q/4πR²', `${computed.sigma.toExponential(2)} C/m²`));
    if (state.kind === 'grounded' || state.kind === 'neutral') {
      rows.push(kv('σ facing q (θ = 0)', `${sigmaSphere(state, { x: 1, y: 0, z: 0 }).toExponential(2)} C/m²`));
      rows.push(kv('σ far side (θ = π)', `${sigmaSphere(state, { x: -1, y: 0, z: 0 }).toExponential(2)} C/m²`));
    }
    if (state.kind === 'grounded' && computed.image) {
      rows.push(kv("q' = −(R/d)q", fmtCharge(computed.image.q)));
      rows.push(kv("d' = R²/d", `${computed.image.x.toFixed(3)} m`));
    }
    if (state.kind === 'neutral' && computed.image) {
      rows.push(kv("image q'", fmtCharge(computed.image.image.q)));
      rows.push(kv('center (so Q_net = 0)', fmtCharge(computed.image.center.q)));
    }
    if (state.kind === 'cage') {
      rows.push(kv('Inner surface', fmtCharge(-state.q)));
      rows.push(kv('Outer surface (isolated)', fmtCharge(state.q)));
    }
    return rows.join('');
  },
  readout(state, computed) {
    const E = computed.cond;
    if (!E) return '';
    return cells([
      ['Region', E.region, E.region === 'metal' ? 'ok' : ''],
      ['|E|', fmtE(E.mag), E.region === 'metal' ? 'ok' : ''],
      ['E_x', fmtE(E.x), ''],
      ['R', `${state.R.toFixed(2)} m`, ''],
    ]);
  },
  coach(state, computed) {
    const E = computed.cond;
    if (state.kind === 'uniform') {
      return {
        title: 'Charge lives on the surface',
        body: 'Free electrons run until E = 0 everywhere inside the metal. Gauss: a surface inside the conductor encloses Q_in = 0, so E = 0. Outside, the sphere looks like a point Q at the center: E = kQ/r². σ = Q/(4πR²) is uniform only because of spherical symmetry.',
      };
    }
    if (state.kind === 'cage') {
      return {
        title: 'Faraday cage',
        body: 'A Gaussian surface drawn in the metal has Q_in = 0, so E = 0 in the conductor no matter what charge sits in the cavity. The inner surface carries −q (to cancel the cavity charge). If the shell is isolated the outer surface carries +q, and the field outside is the same as a point q at the center.',
      };
    }
    if (E?.region === 'metal') {
      return {
        title: 'E = 0 in the metal — exact',
        body: 'The image charge is placed so the sphere is an equipotential. Superposition of q and q′ then gives identically zero field for r < R. Gauss cannot give you the nonuniform σ on the surface, but it still says the flux through a Gaussian surface in the metal is zero.',
      };
    }
    return {
      title: 'Image charge for a sphere',
      body: `q′ = −(R/d) q sits at d′ = R²/d. For a grounded sphere that is the whole story. For a neutral isolated sphere we put −q′ at the center so the net charge on the conductor stays 0. This is exact for a sphere — not for a cube.`,
    };
  },
});
