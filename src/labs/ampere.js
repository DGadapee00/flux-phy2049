import * as THREE from 'three';
import { CSS2DObject } from 'three/addons/renderers/CSS2DRenderer.js';
import { defineLab } from './define.js';
import { Arrow, M, fatLine, fatSegments, disposeTree } from '../scene/manim.js';
import { VectorBatch } from '../scene/arrows.js';
import { UNITS_PER_METER, MU0 } from '../physics/constants.js';
import { BlongWire, amperianLoop, enclosedFraction } from '../physics/bfield.js';
import { kv, cells, matchClass, qv } from '../ui/shared.js';
import { sciHTML } from '../ui/format.js';
import { fmtB } from './biot.js';

const TAU = Math.PI * 2;
const Y_LOOP = 0.03;

const SCENARIOS = [
  { id: 'center', name: 'Long wire, centered loop — symmetry', wires: [{ I: 5, x: 0, z: 0, a: 0 }], r: 0.3, cx: 0, cz: 0 },
  { id: 'offcenter', name: 'Same wire, off-center loop', wires: [{ I: 5, x: 0, z: 0, a: 0 }], r: 0.3, cx: 0.17, cz: 0.06 },
  { id: 'outside', name: 'Wire outside the loop — I_enc = 0', wires: [{ I: 5, x: 0.48, z: 0, a: 0 }], r: 0.25, cx: 0, cz: 0 },
  {
    id: 'two',
    name: 'Two wires, opposite currents',
    wires: [
      { I: 5, x: -0.12, z: 0, a: 0 },
      { I: -3, x: 0.14, z: 0.04, a: 0 },
    ],
    r: 0.36,
    cx: 0,
    cz: 0,
  },
  { id: 'thick', name: 'Thick wire (uniform J), loop inside', wires: [{ I: 6, x: 0, z: 0, a: 0.3 }], r: 0.18, cx: 0, cz: 0 },
];

function totalB(wires) {
  return (p) => {
    const B = { x: 0, y: 0, z: 0 };
    for (const w of wires) {
      const b = BlongWire(w.I, w.x, w.z, w.a, p);
      B.x += b.x;
      B.z += b.z;
    }
    return B;
  };
}

function fmtCirc(x) {
  if (!Number.isFinite(x)) return '—';
  if (Math.abs(x) < 1e-13) return '0 T·m';
  return `${sciHTML(x, 3)} T·m`;
}

function label(html, x, y, z, cls = 'circuit-label') {
  const el = document.createElement('div');
  el.className = cls;
  el.innerHTML = html;
  const o = new CSS2DObject(el);
  o.position.set(x, y, z);
  return o;
}

const _neutral = new THREE.Color(0x2c2e33);
const _plus = new THREE.Color(M.yellow);
const _minus = new THREE.Color(M.blue);
const _dim = new THREE.Color(0x2a2b30);
const _c = new THREE.Color();

export default defineLab({
  id: 'ampere',
  exam: 'e4',
  title: 'Ampère',
  hint: 'Play ∮ B · dl — only enclosed current survives',
  orbit: true,
  camera: { pos: new THREE.Vector3(3.2, 8.2, 8.2), target: new THREE.Vector3(0, 0, 0) },
  keys: { ' ': 'sweep', r: 'reset', R: 'reset' },
  legend: { id: 'bdl', title: 'B · dl per piece', low: 'against dl (−)', high: 'along dl (+)', barClass: 'legend-bdl' },
  scenarios: SCENARIOS,
  defaultState() {
    return { scenarioId: 'center', wires: [], r: 0.3, cx: 0, cz: 0, n: 32, show: {}, anim: { playing: false, i: 0 } };
  },
  applyScenario(id, state) {
    const sc = SCENARIOS.find((s) => s.id === id) || SCENARIOS[0];
    state.scenarioId = sc.id;
    state.wires = sc.wires.map((w) => ({ ...w }));
    state.r = sc.r;
    state.cx = sc.cx;
    state.cz = sc.cz;
    state.anim = { playing: false, i: 0 };
  },
  controls() {
    const slider = (id, label, min, max, step, cls = '') => `
          <label class="field" id="wrap-${id}">
            <span>${label}</span>
            <div class="slider-row">
              <input type="range" id="${id}" min="${min}" max="${max}" step="${step}" />
              <span class="mono val ${cls}" id="${id}-val"></span>
            </div>
          </label>`;
    return `
        <div class="lab-block">
          ${slider('amp-r', 'Loop radius r', 0.05, 0.6, 0.01)}
          ${slider('amp-cx', 'Loop center x', -0.5, 0.5, 0.01)}
          ${slider('amp-cz', 'Loop center z', -0.5, 0.5, 0.01)}
          ${slider('amp-n', 'Pieces n (Riemann sum)', 8, 128, 4)}
          ${slider('amp-I1', 'Wire 1 current I₁ (+ = up)', -10, 10, 0.5, 'qI')}
          ${slider('amp-I2', 'Wire 2 current I₂ (+ = up)', -10, 10, 0.5, 'qI')}
          ${slider('amp-a', 'Wire radius a', 0.1, 0.45, 0.01)}
          <button type="button" class="btn accent" id="btn-sweep-amp">Play ∮ B · dl</button>
          <p class="tiny">The loop runs counterclockwise seen from above (white chevrons), so current up (+ŷ) counts as positive I_enc — right-hand rule. Gold pieces: B along dl. Blue: against.</p>
        </div>`;
  },
  bind(api) {
    const $ = (id) => document.getElementById(id);
    const on = (id, fn) =>
      $(id).addEventListener('input', (e) => {
        fn(api.slice(), Number(e.target.value));
        api.bump();
      });
    on('amp-r', (s, v) => (s.r = v));
    on('amp-cx', (s, v) => (s.cx = v));
    on('amp-cz', (s, v) => (s.cz = v));
    on('amp-n', (s, v) => (s.n = v));
    on('amp-I1', (s, v) => s.wires[0] && (s.wires[0].I = v));
    on('amp-I2', (s, v) => s.wires[1] && (s.wires[1].I = v));
    on('amp-a', (s, v) => s.wires[0] && (s.wires[0].a = v));
    $('btn-sweep-amp').addEventListener('click', () => api.toggleSweep());
  },
  syncControls(state) {
    const $ = (id) => document.getElementById(id);
    const set = (id, v, text) => {
      $(id).value = v;
      $(`${id}-val`).textContent = text;
    };
    set('amp-r', state.r, `${state.r.toFixed(2)} m`);
    set('amp-cx', state.cx, `${state.cx.toFixed(2)} m`);
    set('amp-cz', state.cz, `${state.cz.toFixed(2)} m`);
    set('amp-n', state.n, String(state.n));
    const [w1, w2] = state.wires;
    if (w1) set('amp-I1', w1.I, `${w1.I.toFixed(1)} A`);
    if (w2) set('amp-I2', w2.I, `${w2.I.toFixed(1)} A`);
    if (w1?.a) set('amp-a', w1.a, `${w1.a.toFixed(2)} m`);
    $('wrap-amp-I2').hidden = !w2;
    $('wrap-amp-a').hidden = !w1?.a;
    $('btn-sweep-amp').textContent = state.anim.playing ? 'Stop sum' : 'Play ∮ B · dl';
  },
  init(ctx) {
    const group = new THREE.Group();
    ctx.scene.add(group);
    const Bvec = new VectorBatch(group, M.teal);
    group.visible = false;
    return { group, Bvec, wires: null, loop: null, frame: null, wireKey: '', frameKey: '' };
  },
  enter(ctx, handle) {
    handle.group.visible = true;
  },
  exit(ctx, handle) {
    handle.group.visible = false;
  },
  recompute(state, computed) {
    const n = Math.round(state.n);
    const loop = amperianLoop(totalB(state.wires), state.cx, state.cz, state.r, n);
    const cut = state.anim.playing ? Math.min(n, Math.floor(state.anim.i)) : n;
    let running = 0;
    for (let i = 0; i < cut; i++) running += loop.pieces[i].bdl;

    const enc = state.wires.map((w) => ({ w, frac: enclosedFraction(state.r, state.cx, state.cz, w.x, w.z, w.a) }));
    const Ienc = enc.reduce((acc, t) => acc + t.w.I * t.frac, 0);
    const target = MU0 * Ienc;
    const Iabs = state.wires.reduce((acc, w) => acc + Math.abs(w.I), 0);
    const scale = Math.max(Math.abs(target), 0.05 * MU0 * Iabs, 1e-15);
    const pct = Math.max(0, (1 - Math.abs(loop.circ - target) / scale) * 100);

    const Bt = loop.pieces.map((p) => p.bdl / Math.hypot(p.dl.x, p.dl.z));
    const Bmag = loop.pieces.map((p) => Math.hypot(p.B.x, p.B.z));
    const concentric = state.wires.every((w) => Math.hypot(w.x - state.cx, w.z - state.cz) < 1e-3);
    computed.amp = {
      pieces: loop.pieces,
      circ: loop.circ,
      running,
      cut,
      n,
      enc,
      Ienc,
      target,
      pct,
      BtMin: Math.min(...Bt),
      BtMax: Math.max(...Bt),
      BmagMax: Math.max(...Bmag, 1e-15),
      maxBdl: Math.max(...loop.pieces.map((p) => Math.abs(p.bdl)), 1e-18),
      concentric,
      Bsym: concentric ? target / (TAU * state.r) : null,
    };
  },
  syncViews(state, computed, ctx) {
    const h = ctx.handle;
    const a = computed.amp;
    if (!h || !a) return;
    const u = UNITS_PER_METER;

    const wireKey = JSON.stringify(state.wires);
    if (wireKey !== h.wireKey) {
      h.wireKey = wireKey;
      if (h.wires) {
        h.group.remove(h.wires);
        disposeTree(h.wires);
      }
      const g = new THREE.Group();
      state.wires.forEach((w, k) => {
        const x = w.x * u;
        const z = w.z * u;
        if (w.a > 0) {
          const cyl = new THREE.Mesh(
            new THREE.CylinderGeometry(w.a * u, w.a * u, 5.6, 64, 1, true),
            new THREE.MeshBasicMaterial({ color: M.yellow, transparent: true, opacity: 0.08, side: THREE.DoubleSide, depthWrite: false }),
          );
          cyl.position.set(x, 0, z);
          g.add(cyl);
          const rim = [];
          for (let i = 0; i <= 96; i++) rim.push(x + w.a * u * Math.cos((i / 96) * TAU), 0.02, z + w.a * u * Math.sin((i / 96) * TAU));
          g.add(fatLine(rim, { color: M.yellow, width: 1.5, opacity: 0.6 }));
        }
        g.add(fatLine([x, -2.8, z, x, 2.8, z], { color: M.yellow, width: w.a > 0 ? 2 : 4, opacity: w.a > 0 ? 0.55 : 1 }));
        if (Math.abs(w.I) > 1e-9) {
          const dir = new THREE.Vector3(0, Math.sign(w.I), 0);
          for (const yy of [1.7, -1.7]) g.add(new Arrow(dir, new THREE.Vector3(x, yy - 0.2 * dir.y, z), 0.4, M.yellow, 0.34, 0.34, 0.001));
        }
        g.add(label(qv('qI', `<i>I</i><sub>${k + 1}</sub> = ${w.I.toFixed(1)} A`), x, 3.15, z));
      });
      h.wires = g;
      h.group.add(g);
    }

    // The flat disc the loop bounds (what I_enc pierces) and the orientation chevrons.
    const frameKey = `${state.r}|${state.cx}|${state.cz}`;
    if (frameKey !== h.frameKey) {
      h.frameKey = frameKey;
      if (h.frame) {
        h.group.remove(h.frame);
        disposeTree(h.frame);
      }
      const g = new THREE.Group();
      const disc = new THREE.Mesh(
        new THREE.CircleGeometry(state.r * u, 96),
        new THREE.MeshBasicMaterial({ color: M.white, transparent: true, opacity: 0.05, side: THREE.DoubleSide, depthWrite: false }),
      );
      disc.rotation.x = -Math.PI / 2;
      disc.position.set(state.cx * u, 0.01, state.cz * u);
      g.add(disc);
      for (let k = 0; k < 4; k++) {
        const phi = TAU * (k / 4 + 1 / 8);
        const p = new THREE.Vector3((state.cx + (state.r - 0.04) * Math.cos(phi)) * u, Y_LOOP, (state.cz - (state.r - 0.04) * Math.sin(phi)) * u);
        const dir = new THREE.Vector3(-Math.sin(phi), 0, -Math.cos(phi));
        g.add(new Arrow(dir, p.addScaledVector(dir, -0.15), 0.3, M.white, 0.24, 0.18, 0.001));
      }
      h.frame = g;
      h.group.add(g);
    }

    if (h.loop) {
      h.group.remove(h.loop);
      disposeTree(h.loop);
    }
    const pos = [];
    const col = [];
    const dphi = TAU / a.n;
    const sub = Math.max(2, Math.round(96 / a.n));
    a.pieces.forEach((p, i) => {
      const active = i < a.cut;
      const current = state.anim.playing && i === a.cut - 1;
      if (current) _c.set(0xffffff);
      else if (!active) _c.copy(_dim);
      else {
        const t = p.bdl / a.maxBdl;
        _c.copy(_neutral).lerp(t >= 0 ? _plus : _minus, Math.sqrt(Math.min(1, Math.abs(t))));
      }
      const half = 0.42 * dphi;
      for (let s = 0; s < sub; s++) {
        const f0 = p.phi - half + (2 * half * s) / sub;
        const f1 = p.phi - half + (2 * half * (s + 1)) / sub;
        pos.push((state.cx + state.r * Math.cos(f0)) * u, Y_LOOP, (state.cz - state.r * Math.sin(f0)) * u);
        pos.push((state.cx + state.r * Math.cos(f1)) * u, Y_LOOP, (state.cz - state.r * Math.sin(f1)) * u);
        col.push(_c.r, _c.g, _c.b, _c.r, _c.g, _c.b);
      }
    });
    h.loop = fatSegments(pos, { colors: col, width: 7 });
    h.group.add(h.loop);

    // B arrows sit just outside the loop (centered on each sample) so the colored B·dl pieces stay visible.
    h.Bvec.begin();
    const o = new THREE.Vector3();
    const d = new THREE.Vector3();
    const stride = Math.max(1, Math.ceil(a.n / 24));
    a.pieces.forEach((p, i) => {
      if (i >= a.cut || i % stride) return;
      const m = Math.hypot(p.B.x, p.B.z);
      if (m < 1e-15) return;
      const L = 0.3 + 0.9 * (m / a.BmagMax);
      const rx = Math.cos(p.phi);
      const rz = -Math.sin(p.phi);
      d.set(p.B.x / m, 0, p.B.z / m);
      o.set(p.p.x * u + rx * 0.55, 0.12, p.p.z * u + rz * 0.55).addScaledVector(d, -L / 2);
      h.Bvec.push(o, d, L);
    });
    h.Bvec.end(true);
    ctx.grid.visible = true;
  },
  tick(dt, state, computed) {
    if (!state.anim.playing) return false;
    const n = computed.amp?.n || state.n;
    state.anim.i += dt * (n / 3);
    if (state.anim.i >= n) {
      state.anim.i = n;
      state.anim.playing = false;
    }
    return true;
  },
  law(state, computed) {
    const a = computed.amp;
    const lines = [String.raw`\oint \vec{B}\cdot d\vec{l} = \mu_0\,\qI_{\text{enc}}`];
    const thick = state.wires.some((w) => w.a > 0);
    if (thick) lines.push(String.raw`r<a:\quad \qI_{\text{enc}} = \qI\,\dfrac{r^2}{a^2}\;\Rightarrow\; B = \dfrac{\mu_0 \qI r}{2\pi a^2}`);
    else if (a?.concentric) lines.push(String.raw`\text{symmetry: } B\,(2\pi r) = \mu_0\qI_{\text{enc}} \;\Rightarrow\; B = \dfrac{\mu_0 \qI_{\text{enc}}}{2\pi r}`);
    else lines.push(String.raw`\text{no symmetry: } B \text{ varies along the loop}`);
    return lines;
  },
  liveRows(state, computed) {
    const a = computed.amp;
    if (!a) return '';
    const rows = [kv('∮ B·dl numerical (Σ over n)', fmtCirc(a.circ))];
    if (state.anim.playing) rows.push(kv(`Running (${a.cut}/${a.n} pieces)`, fmtCirc(a.running)));
    rows.push(kv('μ₀ I<sub>enc</sub>', fmtCirc(a.target)));
    rows.push(kv('Match', `<span class="${matchClass(a.pct)}">${a.pct.toFixed(1)}%</span>`));
    a.enc.forEach(({ w, frac }, k) => {
      const where = frac >= 1 - 1e-9 ? 'inside' : frac <= 1e-9 ? 'outside' : `${(frac * 100).toFixed(1)}% of J inside`;
      rows.push(kv(`I<sub>${k + 1}</sub> (${where})`, qv('qI', `${(w.I * frac).toFixed(2)} A counted`)));
    });
    rows.push(kv('I<sub>enc</sub>', qv('qI', `${a.Ienc.toFixed(2)} A`)));
    rows.push(kv('B along dl on the loop', `${fmtB(a.BtMin)} … ${fmtB(a.BtMax)}`));
    if (a.Bsym != null) rows.push(kv('B = μ₀I<sub>enc</sub>/2πr', fmtB(a.Bsym)));
    return rows.join('');
  },
  readout(state, computed) {
    const a = computed.amp;
    if (!a) return '';
    return cells([
      ['∮ B·dl', fmtCirc(state.anim.playing ? a.running : a.circ), ''],
      ['μ₀ I_enc', fmtCirc(a.target), ''],
      ['Match', `${a.pct.toFixed(1)}%`, matchClass(a.pct)],
      ['I_enc', `${a.Ienc.toFixed(2)} A`, 'qI'],
    ]);
  },
  coach(state, computed) {
    const a = computed.amp;
    if (!a) return { title: 'Ampère’s law', body: '' };
    const thickInside = state.wires.some((w) => w.a > 0 && Math.hypot(w.x - state.cx, w.z - state.cz) + state.r <= w.a + 1e-9);
    const anyOutsideField = a.enc.some((t) => t.frac < 1e-9 && Math.abs(t.w.I) > 0);
    if (thickInside) {
      return {
        title: 'Inside the wire: only part of I is enclosed',
        body: `With uniform J the loop encloses I·r²/a² = ${a.Ienc.toFixed(2)} A. Symmetry still holds, so B(2πr) = μ₀I r²/a² and B = μ₀Ir/(2πa²) — it grows linearly with r inside and falls as 1/r outside. Slide r past a and watch I_enc stop growing.`,
      };
    }
    if (Math.abs(a.Ienc) < 1e-9 && anyOutsideField) {
      return {
        title: 'B ≠ 0 on the loop, but ∮ B·dl = 0',
        body: 'The wire is outside, so I_enc = 0. On the near side B runs against dl (blue); on the far side it runs along dl (gold) but is weaker over a longer stretch. Those pieces cancel exactly. Zero circulation does not mean zero field.',
      };
    }
    if (a.concentric && state.wires.length === 1) {
      return {
        title: 'Symmetry lets you pull B out of the integral',
        body: `Every piece is the same distance from the wire, so B·dl = B dl all the way around (the loop is uniformly gold). Then ∮ B·dl = B(2πr) = μ₀I_enc gives B = ${fmtB(a.Bsym).replace(/<[^>]+>/g, '')}. That step is only legal because B is constant on the loop.`,
      };
    }
    if (state.wires.length > 1) {
      return {
        title: 'I_enc is a signed sum',
        body: `Right-hand rule with the loop direction: current up counts +, current down counts −. Here I_enc = ${a.enc.map((t) => `${t.w.I >= 0 ? '+' : '−'}${Math.abs(t.w.I * t.frac).toFixed(1)}`).join(' ')} A = ${a.Ienc.toFixed(2)} A. The law is exact, but B on the loop is lopsided, so you cannot solve for B with Ampère alone.`,
      };
    }
    return {
      title: 'Still μ₀I_enc — but you cannot solve for B',
      body: `The circulation is unchanged (${a.pct.toFixed(1)}% match) because the same current is enclosed. B along dl now ranges from ${fmtB(a.BtMin).replace(/<[^>]+>/g, '')} to ${fmtB(a.BtMax).replace(/<[^>]+>/g, '')}, so B(2πr) is not the integral. Ampère is always true; it is only useful when symmetry makes B constant on the loop.`,
    };
  },
});
