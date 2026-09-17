import * as THREE from 'three';
import { CSS2DObject } from 'three/addons/renderers/CSS2DRenderer.js';
import { defineLab } from './define.js';
import { Arrow, M, fatLine, disposeTree, makeChargeTexture, POS_COLOR, NEG_COLOR } from '../scene/manim.js';
import { VectorBatch } from '../scene/arrows.js';
import { UNITS_PER_METER, MU0 } from '../physics/constants.js';
import { PARTICLES, trajectory, cyclotronRadius, cyclotronPeriod, wireForce, parallelWireForceNumerical, lorentzForce } from '../physics/magforce.js';
import { FparallelWires } from '../physics/bfield.js';
import { kv, cells, matchClass, qv, eq } from '../ui/shared.js';
import { sciHTML, fmtForce } from '../ui/format.js';
import { fmtB } from './biot.js';

/**
 * Color code for magnetism: B teal, E purple, v white, F gold (as in Force), I yellow (as in circuits).
 * B always points along +ŷ (up) for the particle and wire scenarios.
 */
const SCENARIOS = [
  { id: 'proton', name: 'Proton in uniform B — circle', kind: 'particle', particle: 'proton', v: 1e7, B: 0.2, pitch: 0 },
  { id: 'electron', name: 'Electron, same speed — curls the other way', kind: 'particle', particle: 'electron', v: 1e7, B: 1.1e-4, pitch: 0 },
  { id: 'helix', name: 'v not ⊥ B — helix', kind: 'particle', particle: 'proton', v: 1e7, B: 0.2, pitch: 12 },
  { id: 'selector', name: 'Crossed E and B — velocity selector', kind: 'selector', particle: 'proton', v: 1e7, B: 0.2, E: 2e6, pitch: 0 },
  { id: 'wire', name: 'Current-carrying wire in B: F = I L × B', kind: 'wire', I: 4, L: 0.6, B: 0.5, theta: 90 },
  { id: 'parallel', name: 'Two parallel wires', kind: 'parallel', I1: 20, I2: 20, d: 0.25 },
];

const CAMS = {
  particle: { pos: new THREE.Vector3(3.5, 15.5, 10.5), target: new THREE.Vector3(0, 0, 0) },
  selector: { pos: new THREE.Vector3(3.5, 15.5, 10.5), target: new THREE.Vector3(0, 0, 0) },
  wire: { pos: new THREE.Vector3(6.5, 4, 10), target: new THREE.Vector3(0, 0.8, 0) },
  parallel: { pos: new THREE.Vector3(5.5, 4.5, 10.5), target: new THREE.Vector3(0, 0, 0) },
};

const deg = (d) => (d * Math.PI) / 180;
const strip = (html) => html.replace(/<[^>]+>/g, '');

/** Scientific notation without format.js's 10⁻¹⁸ cutoff (sciHTML turns a proton mass into "0"). */
function sci(x, digits = 2) {
  if (!Number.isFinite(x) || x === 0) return '0';
  const [m, e] = Math.abs(x).toExponential(digits).split('e');
  return `${x < 0 ? '−' : ''}${m}×10<sup>${Number(e) < 0 ? '−' : ''}${Math.abs(Number(e))}</sup>`;
}

function fmtSpeed(v) {
  return `${sciHTML(v, 2)} m/s`;
}

function fmtLen(m) {
  if (!Number.isFinite(m)) return '—';
  if (Math.abs(m) >= 1) return `${m.toFixed(2)} m`;
  if (Math.abs(m) >= 0.01) return `${(m * 100).toFixed(1)} cm`;
  return `${sciHTML(m, 2)} m`;
}

function fmtTime(t) {
  if (t >= 1e-3) return `${(t * 1e3).toFixed(2)} ms`;
  if (t >= 1e-6) return `${(t * 1e6).toFixed(2)} μs`;
  return `${(t * 1e9).toFixed(2)} ns`;
}

function label(html, x, y, z, cls = 'circuit-label') {
  const el = document.createElement('div');
  el.className = cls;
  el.innerHTML = html;
  const o = new CSS2DObject(el);
  o.position.set(x, y, z);
  return o;
}

/** Run the particle once per parameter change; the frame loop only walks along the stored path. */
function particleRun(state) {
  const P = PARTICLES[state.particle];
  const selector = state.kind === 'selector';
  const alpha = selector ? 0 : deg(state.pitch);
  const vPerp = state.v * Math.cos(alpha);
  const vPar = state.v * Math.sin(alpha);
  const B = { x: 0, y: state.B, z: 0 };
  const E = selector ? { x: 0, y: 0, z: -state.E } : { x: 0, y: 0, z: 0 };
  const T = cyclotronPeriod(P.m, P.q, state.B);
  const rA = cyclotronRadius(P.m, vPerp, P.q, state.B);
  const sgn = Math.sign(P.q);

  let start;
  let tMax;
  let turns;
  if (selector) {
    start = { x: -1.3, y: 0, z: 0 };
    tMax = 2.6 / state.v;
    turns = tMax / T;
  } else {
    const pitchLen = vPar * T;
    turns = pitchLen > 1e-9 ? Math.max(0.6, Math.min(2, 1.0 / pitchLen)) : 1;
    tMax = turns * T;
    // Center the circle on the origin when it fits in view (center is at start + sgn·r ẑ).
    start = { x: 0, y: -0.5 * vPar * tMax, z: rA <= 1.1 ? -sgn * rA : 0 };
  }
  const steps = Math.min(4000, Math.max(720, Math.ceil(Math.min(turns, 20) * 480)));
  const tr = trajectory({ q: P.q, m: P.m, v0: { x: vPerp, y: vPar, z: 0 }, E, B, tMax, steps, bound: 1.3, start });

  let rNum = null;
  if (!selector && !tr.escaped) {
    const firstTurn = tr.pts.filter((p) => p.t <= T + 1e-15);
    const xs = firstTurn.map((p) => p.x);
    rNum = (Math.max(...xs) - Math.min(...xs)) / 2;
  }
  const last = tr.pts[tr.pts.length - 1];
  const F0 = lorentzForce(P.q, { x: vPerp, y: vPar, z: 0 }, E, B);
  return {
    P,
    E,
    Bv: B,
    T,
    rA,
    rNum,
    vPerp,
    vPar,
    turns,
    tMax,
    tr,
    speedRatio: Math.hypot(last.vx, last.vy, last.vz) / state.v,
    Fmag: Math.hypot(F0.x, F0.y, F0.z),
    FE: Math.abs(P.q) * state.E,
    FB: Math.abs(P.q) * state.v * state.B,
    vSelect: state.E / state.B,
  };
}

export default defineLab({
  id: 'magforce',
  exam: 'e4',
  title: 'Mag force',
  hint: 'F = q v × B — the sign of × is the whole point',
  orbit: true,
  camera: CAMS.particle,
  cameraFor: (state) => CAMS[state.kind] || CAMS.particle,
  keys: { r: 'reset', R: 'reset' },
  scenarios: SCENARIOS,
  defaultState() {
    return {
      scenarioId: 'proton',
      kind: 'particle',
      particle: 'proton',
      v: 1e7,
      B: 0.2,
      pitch: 0,
      E: 2e6,
      I: 4,
      L: 0.6,
      theta: 90,
      I1: 20,
      I2: 20,
      d: 0.25,
      show: {},
      anim: { playing: false, i: 0 },
    };
  },
  applyScenario(id, state) {
    const sc = SCENARIOS.find((s) => s.id === id) || SCENARIOS[0];
    const { name, ...rest } = sc;
    Object.assign(state, rest, { scenarioId: sc.id });
  },
  controls() {
    const slider = (id, text, min, max, step, cls = '', kinds = '') => `
          <label class="field" id="wrap-${id}" data-kinds="${kinds}">
            <span>${text}</span>
            <div class="slider-row">
              <input type="range" id="${id}" min="${min}" max="${max}" step="${step}" />
              <span class="mono val ${cls}" id="${id}-val"></span>
            </div>
          </label>`;
    return `
        <div class="lab-block">
          <div class="seg" id="mf-particle" data-kinds="particle selector">
            <button type="button" data-p="proton">Proton (+e)</button>
            <button type="button" data-p="electron">Electron (−e)</button>
          </div>
          ${slider('mf-v', 'Speed v (log)', 5, 7.6, 0.01, '', 'particle selector')}
          ${slider('mf-B', 'Field B (log, along +y)', -5, 0, 0.01, 'qB', 'particle selector wire')}
          ${slider('mf-pitch', 'Angle of v above the xz plane', 0, 45, 1, '', 'particle')}
          ${slider('mf-E', 'Field E (log, along −z)', 3, 7, 0.01, '', 'selector')}
          ${slider('mf-I', 'Current I', -10, 10, 0.5, 'qI', 'wire')}
          ${slider('mf-L', 'Wire length L', 0.1, 1.2, 0.01, '', 'wire')}
          ${slider('mf-theta', 'Angle θ between L and B', 0, 180, 1, '', 'wire')}
          ${slider('mf-I1', 'Wire 1 current I₁ (+ = up)', -40, 40, 1, 'qI', 'parallel')}
          ${slider('mf-I2', 'Wire 2 current I₂ (+ = up)', -40, 40, 1, 'qI', 'parallel')}
          ${slider('mf-d', 'Separation d', 0.05, 0.8, 0.01, '', 'parallel')}
          <p class="tiny">Teal arrows: B. Purple: E. White: v. Gold: F. Motion is slowed so one orbit takes a few seconds; the numbers are real SI values.</p>
        </div>`;
  },
  bind(api) {
    const $ = (id) => document.getElementById(id);
    const on = (id, fn) =>
      $(id).addEventListener('input', (e) => {
        fn(api.slice(), Number(e.target.value));
        api.bump();
      });
    on('mf-v', (s, v) => (s.v = 10 ** v));
    on('mf-B', (s, v) => (s.B = 10 ** v));
    on('mf-E', (s, v) => (s.E = 10 ** v));
    on('mf-pitch', (s, v) => (s.pitch = v));
    on('mf-I', (s, v) => (s.I = v));
    on('mf-L', (s, v) => (s.L = v));
    on('mf-theta', (s, v) => (s.theta = v));
    on('mf-I1', (s, v) => (s.I1 = v));
    on('mf-I2', (s, v) => (s.I2 = v));
    on('mf-d', (s, v) => (s.d = v));
    $('mf-particle').addEventListener('click', (e) => {
      const btn = e.target.closest('[data-p]');
      if (!btn) return;
      api.slice().particle = btn.dataset.p;
      api.bump();
    });
  },
  syncControls(state) {
    const $ = (id) => document.getElementById(id);
    document.querySelectorAll('#lab-controls [data-kinds]').forEach((el) => {
      el.hidden = !el.dataset.kinds.split(' ').includes(state.kind);
    });
    document.querySelectorAll('#mf-particle [data-p]').forEach((b) => b.classList.toggle('active', b.dataset.p === state.particle));
    const set = (id, v, text) => {
      $(id).value = v;
      $(`${id}-val`).innerHTML = text;
    };
    set('mf-v', Math.log10(state.v), fmtSpeed(state.v));
    set('mf-B', Math.log10(state.B), fmtB(state.B));
    set('mf-E', Math.log10(state.E), `${sciHTML(state.E, 2)} V/m`);
    set('mf-pitch', state.pitch, `${state.pitch.toFixed(0)}°`);
    set('mf-I', state.I, `${state.I.toFixed(1)} A`);
    set('mf-L', state.L, `${state.L.toFixed(2)} m`);
    set('mf-theta', state.theta, `${state.theta.toFixed(0)}°`);
    set('mf-I1', state.I1, `${state.I1.toFixed(0)} A`);
    set('mf-I2', state.I2, `${state.I2.toFixed(0)} A`);
    set('mf-d', state.d, `${state.d.toFixed(2)} m`);
  },
  init(ctx) {
    const group = new THREE.Group();
    ctx.scene.add(group);
    const Bfield = new VectorBatch(group, M.teal);
    const Efield = new VectorBatch(group, M.purple);
    const dotPos = makeChargeTexture(POS_COLOR, 1);
    const dotNeg = makeChargeTexture(NEG_COLOR, -1);
    const particle = new THREE.Sprite(new THREE.SpriteMaterial({ map: dotPos, transparent: true, depthWrite: false, toneMapped: false }));
    particle.scale.setScalar(0.6);
    particle.renderOrder = 5;
    const vArrow = new Arrow(new THREE.Vector3(1, 0, 0), new THREE.Vector3(), 2.2, M.white, 0.45, 0.36, 0.06);
    const fArrow = new Arrow(new THREE.Vector3(0, 0, 1), new THREE.Vector3(), 2, M.gold, 0.45, 0.36, 0.075);
    group.add(particle, vArrow, fArrow);
    group.visible = false;
    return { group, Bfield, Efield, particle, dotPos, dotNeg, vArrow, fArrow, scene: null, key: '', time: 0 };
  },
  enter(ctx, handle) {
    handle.group.visible = true;
  },
  exit(ctx, handle) {
    handle.group.visible = false;
  },
  recompute(state, computed) {
    if (state.kind === 'particle' || state.kind === 'selector') {
      computed.mf = { kind: state.kind, run: particleRun(state) };
    } else if (state.kind === 'wire') {
      const th = deg(state.theta);
      const L = { x: state.L * Math.sin(th), y: state.L * Math.cos(th), z: 0 };
      const F = wireForce(state.I, L, { x: 0, y: state.B, z: 0 });
      computed.mf = { kind: 'wire', L, F, Fmag: Math.abs(F.z), formula: Math.abs(state.I * state.L * state.B * Math.sin(th)) };
    } else {
      const F = parallelWireForceNumerical(state.I1, state.I2, state.d, 1);
      const an = FparallelWires(state.I1, state.I2, 1, state.d);
      const rel = Math.abs(Math.abs(F.x) - Math.abs(an)) / Math.max(Math.abs(an), 1e-15);
      computed.mf = {
        kind: 'parallel',
        F,
        an,
        pct: Math.max(0, (1 - rel) * 100),
        attract: F.x < 0,
        B1: (MU0 * Math.abs(state.I1)) / (2 * Math.PI * state.d),
      };
    }
  },
  syncViews(state, computed, ctx) {
    const h = ctx.handle;
    const c = computed.mf;
    if (!h || !c) return;
    const u = UNITS_PER_METER;
    ctx.grid.visible = true;

    const key = JSON.stringify([state.kind, state.particle, state.v, state.B, state.pitch, state.E, state.I, state.L, state.theta, state.I1, state.I2, state.d]);
    if (key === h.key) return;
    h.key = key;
    if (h.scene) {
      h.group.remove(h.scene);
      disposeTree(h.scene);
    }
    const g = new THREE.Group();
    h.scene = g;
    h.group.add(g);

    const up = new THREE.Vector3(0, 1, 0);
    const o = new THREE.Vector3();
    h.Bfield.begin();
    h.Efield.begin();
    const particleKind = c.kind === 'particle' || c.kind === 'selector';
    h.particle.visible = particleKind;
    h.vArrow.visible = particleKind;
    h.fArrow.visible = particleKind;

    if (particleKind) {
      const run = c.run;
      for (let x = -6; x <= 6; x += 3) for (let z = -6; z <= 6; z += 3) h.Bfield.push(o.set(x, -0.6, z), up, 1.2);
      if (c.kind === 'selector') {
        const dz = new THREE.Vector3(0, 0, -1);
        for (let x = -9; x <= 9; x += 3) h.Efield.push(o.set(x, 1.4, 1.2), dz, 1.6);
      }
      const flat = [];
      for (const p of run.tr.pts) flat.push(p.x * u, p.y * u, p.z * u);
      g.add(fatLine(flat, { color: run.P.q > 0 ? POS_COLOR : NEG_COLOR, width: 2.5, opacity: 0.55 }));
      h.particle.material.map = run.P.q > 0 ? h.dotPos : h.dotNeg;
      h.particle.material.needsUpdate = true;
      g.add(label(`<span class="qB"><i>B</i> = ${strip(fmtB(state.B))} ↑</span>`, 8.5, 1.2, -8.5));
      if (c.kind === 'selector') g.add(label(`<span style="color:var(--purple,#9A72AC)"><i>E</i> = ${strip(sciHTML(state.E, 2))} V/m</span>`, 0, 2.6, 1.2));
    } else if (c.kind === 'wire') {
      for (let x = -6; x <= 6; x += 3) for (let z = -6; z <= 6; z += 3) h.Bfield.push(o.set(x, -2.2, z), up, 1.1);
      const Ld = new THREE.Vector3(c.L.x, c.L.y, 0).normalize();
      const half = (state.L / 2) * u;
      const a = Ld.clone().multiplyScalar(-half);
      const b = Ld.clone().multiplyScalar(half);
      g.add(fatLine([a.x, a.y + 0.8, 0, b.x, b.y + 0.8, 0], { color: M.yellow, width: 5 }));
      if (Math.abs(state.I) > 1e-9) {
        const dir = Ld.clone().multiplyScalar(Math.sign(state.I));
        g.add(new Arrow(dir, new THREE.Vector3(0, 0.8, 0).addScaledVector(dir, half * 0.55), 0.45, M.yellow, 0.36, 0.36, 0.001));
      }
      g.add(new Arrow(up, new THREE.Vector3(-3.4, -1, 0), 3.2, M.teal, 0.36, 0.28, 0.05));
      g.add(label('<span class="qB"><i>B</i></span>', -3.9, 1.6, 0));
      const arc = [];
      const R = 1.3;
      const th = deg(state.theta);
      for (let i = 0; i <= 40; i++) {
        const t = (i / 40) * th;
        arc.push(R * Math.sin(t), 0.8 + R * Math.cos(t), 0.01);
      }
      g.add(fatLine(arc, { color: M.white, width: 2, opacity: 0.8 }));
      g.add(label('θ', 1.75 * Math.sin(th / 2), 0.8 + 1.75 * Math.cos(th / 2), 0));
      if (c.Fmag > 1e-12) {
        const Fd = new THREE.Vector3(0, 0, Math.sign(c.F.z));
        const Lf = 0.8 + 2.2 * Math.tanh(c.Fmag / 1.5);
        g.add(new Arrow(Fd, new THREE.Vector3(0, 0.8, 0), Lf, M.gold, 0.4, 0.3, 0.06));
        g.add(label(`<span style="color:var(--e-vec,#D4B07A)"><i>F</i> = ${strip(fmtForce(c.Fmag))}</span>`, 0.4, 0.2, Fd.z * (Lf + 0.5)));
      } else {
        g.add(label('<span style="color:var(--e-vec,#D4B07A)"><i>F</i> = 0 (L ∥ B)</span>', 0.6, -0.3, 0));
      }
      g.add(label(qv('qI', `<i>I</i> = ${state.I.toFixed(1)} A`), b.x + 0.6, b.y + 1.3, 0));
    } else {
      const x1 = (-state.d / 2) * u;
      const x2 = (state.d / 2) * u;
      [
        [x1, state.I1, 1],
        [x2, state.I2, 2],
      ].forEach(([x, I, k]) => {
        g.add(fatLine([x, -3, 0, x, 3, 0], { color: M.yellow, width: 4 }));
        if (Math.abs(I) > 1e-9) {
          const dir = new THREE.Vector3(0, Math.sign(I), 0);
          for (const yy of [1.8, -1.8]) g.add(new Arrow(dir, new THREE.Vector3(x, yy - 0.2 * dir.y, 0), 0.4, M.yellow, 0.34, 0.34, 0.001));
        }
        g.add(label(qv('qI', `<i>I</i><sub>${k}</sub> = ${I.toFixed(0)} A`), x, 3.4, 0));
      });
      // Wire 1's field line through wire 2 (dashed teal circle) and B₁ at wire 2.
      const ring = [];
      const rr = state.d * u;
      for (let i = 0; i <= 96; i++) ring.push(x1 + rr * Math.cos((i / 96) * 2 * Math.PI), 0, rr * Math.sin((i / 96) * 2 * Math.PI));
      const ringLine = fatLine(ring, { color: M.teal, width: 1.6, opacity: 0.7, dashed: true });
      g.add(ringLine);
      if (Math.abs(state.I1) > 1e-9) {
        // B from +ŷ current at +x̂ offset points along −ẑ.
        const Bd = new THREE.Vector3(0, 0, -Math.sign(state.I1));
        g.add(new Arrow(Bd, new THREE.Vector3(x2, 0, 0), 1.6, M.teal, 0.34, 0.26, 0.045));
        g.add(label(`<span class="qB"><i>B</i><sub>1</sub> = ${strip(fmtB(c.B1))}</span>`, x2 + 0.3, -0.5, Bd.z * 2.1));
      }
      const Fx = c.F.x;
      if (Math.abs(Fx) > 1e-15) {
        const Lf = 0.9 + 1.6 * Math.tanh(Math.abs(Fx) / 2e-4);
        const d2 = new THREE.Vector3(Math.sign(Fx), 0, 0);
        g.add(new Arrow(d2, new THREE.Vector3(x2, 0.9, 0), Lf, M.gold, 0.36, 0.28, 0.055));
        g.add(new Arrow(d2.clone().multiplyScalar(-1), new THREE.Vector3(x1, 0.9, 0), Lf, M.gold, 0.36, 0.28, 0.055));
        g.add(label(`<span style="color:var(--e-vec,#D4B07A)">${c.attract ? 'attract' : 'repel'} · <i>F</i>/<i>L</i> = ${strip(fmtForce(Math.abs(Fx)))}/m</span>`, 0, -2.2, 0));
      }
    }
    h.Bfield.end(c.kind !== 'parallel');
    h.Efield.end(c.kind === 'selector');
    h.time = 0;
  },
  afterFrame(dt, state, computed, ctx) {
    const h = ctx.handle;
    const c = computed.mf;
    if (!h || !c || !(c.kind === 'particle' || c.kind === 'selector')) return;
    const run = c.run;
    const pts = run.tr.pts;
    const u = UNITS_PER_METER;
    // Display clock: ~3.5 s per orbit (or per pass through the selector), independent of the real period.
    const D = c.kind === 'selector' ? 3 : Math.max(2.5, (pts[pts.length - 1].t / run.T) * 3.5);
    h.time = (h.time + dt) % D;
    const idx = Math.min(pts.length - 1, Math.floor((h.time / D) * (pts.length - 1)));
    const p = pts[idx];
    h.particle.position.set(p.x * u, p.y * u, p.z * u);
    const v = new THREE.Vector3(p.vx, p.vy, p.vz);
    h.vArrow.position.copy(h.particle.position);
    h.vArrow.setDirection(v);
    h.vArrow.setLength(2.2, 0.45, 0.36);
    const F = lorentzForce(run.P.q, { x: p.vx, y: p.vy, z: p.vz }, run.E, run.Bv);
    const Fm = Math.hypot(F.x, F.y, F.z);
    h.fArrow.visible = Fm > 1e-6 * run.FB;
    if (h.fArrow.visible) {
      h.fArrow.position.copy(h.particle.position);
      h.fArrow.setDirection(new THREE.Vector3(F.x, F.y, F.z));
      h.fArrow.setLength(2, 0.45, 0.36);
    }
  },
  law(state) {
    if (state.kind === 'selector') return [String.raw`\vec{F} = q\,(\vec{E} + \vec{v}\times\vec{B})`, String.raw`F_{\text{net}} = 0 \iff v = \dfrac{E}{B}`];
    if (state.kind === 'wire') return [String.raw`\vec{F} = \qI\,\vec{L}\times\vec{B}`, String.raw`|\vec{F}| = \qI L B\sin\theta`];
    if (state.kind === 'parallel') return [String.raw`\dfrac{F}{L} = \dfrac{\mu_0\,\qI_1\qI_2}{2\pi d}`, String.raw`B_1 = \dfrac{\mu_0 \qI_1}{2\pi d},\quad \vec{F}_2 = \qI_2\vec{L}\times\vec{B}_1`];
    return [String.raw`\vec{F} = q\,\vec{v}\times\vec{B}`, String.raw`r = \dfrac{m v_\perp}{|q|B}\qquad T = \dfrac{2\pi m}{|q|B}`];
  },
  liveRows(state, computed) {
    const c = computed.mf;
    if (!c) return '';
    if (c.kind === 'wire') {
      const pct = c.formula > 0 ? Math.max(0, (1 - Math.abs(c.Fmag - c.formula) / c.formula) * 100) : 100;
      return [
        kv(String.raw`$I$`, qv('qI', `${state.I.toFixed(1)} A`)),
        kv(String.raw`$L$, $\theta$`, `${state.L.toFixed(2)} m, ${state.theta.toFixed(0)}°`),
        kv(String.raw`$B$`, fmtB(state.B)),
        kv(String.raw`$\vec{F} = I\vec{L}\times\vec{B}$`, `(${fmtForce(c.F.x)}, ${fmtForce(c.F.y)}, ${fmtForce(c.F.z)})`),
        kv(String.raw`$ILB\sin\theta$`, fmtForce(c.formula)),
        kv('Match', `<span class="${matchClass(pct)}">${pct.toFixed(1)}%</span>`),
        kv('Direction', c.Fmag < 1e-12 ? String.raw`none — $\vec{L} \parallel \vec{B}$` : c.F.z > 0 ? String.raw`$+\hat{z}$ (toward you)` : String.raw`$-\hat{z}$ (away)`),
      ].join('');
    }
    if (c.kind === 'parallel') {
      return [
        kv(String.raw`$I_1$, $I_2$`, qv('qI', `${state.I1.toFixed(0)} A, ${state.I2.toFixed(0)} A`)),
        kv(String.raw`$d$`, `${state.d.toFixed(2)} m`),
        kv(String.raw`$B_1$ at wire 2`, fmtB(c.B1)),
        kv(String.raw`Numerical $\sum I_2\,d\vec{l}\times\vec{B}_1 / L$`, `${fmtForce(Math.abs(c.F.x))}/m`),
        kv(String.raw`$\mu_0 I_1 I_2 / 2\pi d$`, `${fmtForce(Math.abs(c.an))}/m`),
        kv('Match', `<span class="${matchClass(c.pct)}">${c.pct.toFixed(1)}%</span>`),
        kv('Result', c.attract ? 'attract (same direction)' : 'repel (opposite)'),
      ].join('');
    }
    const r = c.run;
    const rows = [
      kv('Particle', `${r.P.name}, $q$ = ${r.P.q > 0 ? '+' : '−'}1.6×10<sup>−19</sup> C, $m$ = ${sci(r.P.m)} kg`),
      kv(String.raw`$v$`, fmtSpeed(state.v)),
      kv(String.raw`$B$`, fmtB(state.B)),
    ];
    if (c.kind === 'selector') {
      const pass = Math.abs(state.v - r.vSelect) / r.vSelect < 0.01;
      rows.push(kv(String.raw`$E$`, `${sciHTML(state.E, 2)} V/m`));
      rows.push(kv(String.raw`$qE$ (electric)`, fmtForce(r.FE)));
      rows.push(kv(String.raw`$qvB$ (magnetic)`, fmtForce(r.FB)));
      rows.push(kv(String.raw`Selected speed $E/B$`, fmtSpeed(r.vSelect)));
      rows.push(kv('Result', pass ? '<span class="ok">passes straight</span>' : `<span class="warn">deflects ${state.v > r.vSelect ? '(too fast: magnetic wins)' : '(too slow: electric wins)'}</span>`));
      return rows.join('');
    }
    const pct = r.rNum == null ? null : Math.max(0, (1 - Math.abs(r.rNum - r.rA) / r.rA) * 100);
    if (state.pitch > 0) rows.push(kv(String.raw`$v_\perp$, $v_\parallel$`, `${fmtSpeed(r.vPerp)}, ${fmtSpeed(r.vPar)}`));
    rows.push(kv(String.raw`$r = mv_\perp/|q|B$`, fmtLen(r.rA)));
    rows.push(kv(String.raw`$r$ numerical (orbit width / 2)`, r.rNum == null ? 'orbit leaves the view' : fmtLen(r.rNum)));
    if (pct != null) rows.push(kv('Match', `<span class="${matchClass(pct)}">${pct.toFixed(2)}%</span>`));
    rows.push(kv(String.raw`$T = 2\pi m/|q|B$`, fmtTime(r.T)));
    if (state.pitch > 0) rows.push(kv(String.raw`Pitch $v_\parallel T$`, fmtLen(r.vPar * r.T)));
    rows.push(kv(String.raw`$|\vec{F}| = |q|v_\perp B$`, fmtForce(r.Fmag)));
    rows.push(kv(String.raw`$|\vec{v}|$ after the run / before`, r.speedRatio.toFixed(6)));
    return rows.join('');
  },
  readout(state, computed) {
    const c = computed.mf;
    if (!c) return '';
    if (c.kind === 'wire') {
      return cells([
        [String.raw`$|\vec{F}|$`, fmtForce(c.Fmag), ''],
        [String.raw`$ILB\sin\theta$`, fmtForce(c.formula), ''],
        [String.raw`$\theta$`, `${state.theta.toFixed(0)}°`, ''],
        [String.raw`$I$`, `${state.I.toFixed(1)} A`, 'qI'],
      ]);
    }
    if (c.kind === 'parallel') {
      return cells([
        [String.raw`$F/L$ numerical`, `${fmtForce(Math.abs(c.F.x))}/m`, ''],
        [String.raw`$\mu_0 I_1 I_2/2\pi d$`, `${fmtForce(Math.abs(c.an))}/m`, ''],
        ['Match', `${c.pct.toFixed(1)}%`, matchClass(c.pct)],
        ['Result', c.attract ? 'attract' : 'repel', ''],
      ]);
    }
    const r = c.run;
    if (c.kind === 'selector') {
      return cells([
        [String.raw`$qE$`, fmtForce(r.FE), ''],
        [String.raw`$qvB$`, fmtForce(r.FB), ''],
        [String.raw`$E/B$`, fmtSpeed(r.vSelect), ''],
        [String.raw`$v$`, fmtSpeed(state.v), Math.abs(state.v - r.vSelect) / r.vSelect < 0.01 ? 'ok' : 'warn'],
      ]);
    }
    const pct = r.rNum == null ? null : Math.max(0, (1 - Math.abs(r.rNum - r.rA) / r.rA) * 100);
    return cells([
      [String.raw`$r = mv_\perp/|q|B$`, fmtLen(r.rA), ''],
      [String.raw`$r$ numerical`, r.rNum == null ? '—' : fmtLen(r.rNum), ''],
      ['Match', pct == null ? '—' : `${pct.toFixed(2)}%`, pct == null ? '' : matchClass(pct)],
      [String.raw`Period $T$`, fmtTime(r.T), ''],
    ]);
  },
  coach(state, computed) {
    const c = computed.mf;
    if (!c) return { title: '', body: '' };
    if (c.kind === 'wire') {
      return {
        title: String.raw`Only the part of $\vec{L}$ perpendicular to $\vec{B}$ pushes`,
        body: [
          eq(String.raw`\vec{F} = I\vec{L}\times\vec{B}, \qquad |\vec{F}| = ILB\sin\theta`),
          String.raw`The force is largest at $\theta = 90^\circ$ and vanishes at $0^\circ$ or $180^\circ$, with the wire along $\vec{B}$. Right-hand rule: fingers along $I\vec{L}$, curl toward $\vec{B}$, thumb gives $\vec{F}$. Flip the sign of $I$ and $\vec{F}$ reverses.`,
        ],
      };
    }
    if (c.kind === 'parallel') {
      return {
        title: c.attract ? 'Same direction → attract' : 'Opposite directions → repel',
        body: [
          String.raw`Wire 1 makes $B_1 = \mu_0 I_1/2\pi d$ at wire 2 (teal, circling wire 1), and wire 2 then feels $\vec{F} = I_2\vec{L}\times\vec{B}_1$:`,
          eq(String.raw`\frac{F}{L} = \frac{\mu_0 I_1 I_2}{2\pi d}`),
          String.raw`Newton's third law gives wire 1 the equal and opposite push. Halve $d$ and $F/L$ doubles — it falls as $1/d$, not $1/d^2$.`,
        ],
      };
    }
    const r = c.run;
    if (c.kind === 'selector') {
      return {
        title: String.raw`Velocity selector: $qE = qvB$`,
        body: [
          `The electric force $qE$ does not care about speed; the magnetic force $qvB$ does. They cancel at one speed only:`,
          eq(String.raw`v = \frac{E}{B} = ${strip(fmtSpeed(r.vSelect))}`),
          String.raw`Faster particles curve toward the magnetic force, slower ones toward the electric force. The charge cancels out, so electrons are selected at the same speed.`,
        ],
      };
    }
    if (state.pitch > 0) {
      return {
        title: String.raw`Helix: $\vec{B}$ only turns $v_\perp$`,
        body: [
          String.raw`$\vec{v}\times\vec{B}$ has no component along $\vec{B}$, so $v_\parallel$ is untouched and the particle drifts along $\vec{B}$ while it circles:`,
          eq(String.raw`r = \frac{mv_\perp}{|q|B}, \qquad T = \frac{2\pi m}{|q|B}, \qquad \text{pitch} = v_\parallel T`),
          String.raw`The period does not depend on the speed at all.`,
        ],
      };
    }
    return {
      title: r.P.q > 0 ? String.raw`$\vec{F}\perp\vec{v}$: the speed never changes` : String.raw`Negative charge: same $|\vec{F}|$, opposite direction`,
      body:
        r.P.q > 0
          ? [
              String.raw`$\vec{F} = q\vec{v}\times\vec{B}$ is always perpendicular to $\vec{v}$, so it does no work — $|\vec{v}|$ after the run is ${r.speedRatio.toFixed(6)} of the start. It only turns $\vec{v}$:`,
              eq(String.raw`r = \frac{mv}{|q|B} = ${strip(fmtLen(r.rA))}`),
              String.raw`Seen from above with $\vec{B}$ up, a positive charge goes clockwise.`,
            ]
          : [
              String.raw`$q < 0$ flips $\vec{v}\times\vec{B}$, so the electron curls counterclockwise seen from above.`,
              `Its mass is about 1840× smaller, which is why $B$ only needs to be ${fmtB(state.B)} for a circle of the same size.`,
            ],
    };
  },
});
