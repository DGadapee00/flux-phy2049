import * as THREE from 'three';
import { defineLab } from './define.js';
import { Arrow, M, fatLine, disposeTree } from '../scene/manim.js';
import { UNITS_PER_METER, MU0 } from '../physics/constants.js';
import { Bpolyline, BwireInfinite, BloopAxis, Bsolenoid, wireAlongY } from '../physics/bfield.js';
import { kv, cells, matchClass } from '../ui/shared.js';
import { sciHTML } from '../ui/format.js';

const SCENARIOS = [
  { id: 'wire', name: 'Long straight wire', kind: 'wire', I: 2, R: 0.12, L: 2.4, nTurns: 20, probe: { x: 0.12, y: 0, z: 0 } },
  { id: 'loop', name: 'Current loop, probe on axis', kind: 'loop', I: 3, R: 0.28, L: 0.4, nTurns: 1, probe: { x: 0, y: 0.2, z: 0 } },
  { id: 'solenoid', name: 'Solenoid (on axis)', kind: 'solenoid', I: 1.5, R: 0.16, L: 0.8, nTurns: 24, probe: { x: 0, y: 0, z: 0 } },
];

function fmtB(t) {
  if (!Number.isFinite(t)) return '—';
  const a = Math.abs(t);
  if (a >= 1) return `${t.toFixed(3)} T`;
  if (a >= 1e-3) return `${(t * 1e3).toFixed(2)} mT`;
  if (a >= 1e-6) return `${(t * 1e6).toFixed(2)} μT`;
  return `${sciHTML(t)} T`;
}

function wirePoints(state) {
  if (state.kind === 'wire') return wireAlongY(-state.L / 2, state.L / 2, 24);
  if (state.kind === 'loop') {
    const n = 48;
    const pts = [];
    for (let i = 0; i <= n; i++) {
      const phi = (i / n) * 2 * Math.PI;
      pts.push({ x: state.R * Math.cos(phi), y: 0, z: state.R * Math.sin(phi) });
    }
    return pts;
  }
  const pts = [];
  const n = state.nTurns * 16;
  for (let i = 0; i <= n; i++) {
    const t = i / n;
    const y = -state.L / 2 + t * state.L;
    const phi = t * state.nTurns * 2 * Math.PI;
    pts.push({ x: state.R * Math.cos(phi), y, z: state.R * Math.sin(phi) });
  }
  return pts;
}

function analyticB(state) {
  if (state.kind === 'wire') {
    const r = Math.hypot(state.probe.x, state.probe.z);
    const mag = r < 1e-6 ? 0 : BwireInfinite(state.I, r);
    return { mag, note: 'μ₀ I / 2πr (infinite)' };
  }
  if (state.kind === 'loop') {
    const z = state.probe.y;
    const mag = BloopAxis(state.I, state.R, z);
    return { mag, note: 'μ₀ I R² / 2(R²+z²)^{3/2}' };
  }
  const n = state.nTurns / state.L;
  return { mag: Bsolenoid(n, state.I), note: 'μ₀ n I (infinite solenoid)' };
}

export default defineLab({
  id: 'biot',
  exam: 'e4',
  title: 'Biot–Savart',
  hint: 'Play the dl sum — B at the probe is Σ dB',
  orbit: true,
  camera: { pos: new THREE.Vector3(4.8, 3.6, 8.8), target: new THREE.Vector3(0, 0, 0) },
  keys: { ' ': 'sweep', r: 'reset', R: 'reset' },
  scenarios: SCENARIOS,
  defaultState() {
    return {
      scenarioId: 'wire',
      kind: 'wire',
      I: 2,
      R: 0.12,
      L: 2.4,
      nTurns: 20,
      probe: { x: 0.12, y: 0, z: 0 },
      charges: [],
      show: {},
      anim: { playing: false, i: 0 },
    };
  },
  applyScenario(id, state) {
    const sc = SCENARIOS.find((s) => s.id === id) || SCENARIOS[0];
    state.scenarioId = sc.id;
    state.kind = sc.kind;
    state.I = sc.I;
    state.R = sc.R;
    state.L = sc.L;
    state.nTurns = sc.nTurns;
    state.probe = { ...sc.probe };
    state.anim = { playing: false, i: 0 };
  },
  controls() {
    return `
        <div class="lab-block">
          <label class="field">
            <span>Current I</span>
            <div class="slider-row">
              <input type="range" id="biot-I" min="0.2" max="8" step="0.1" value="2" />
              <span class="mono val" id="biot-I-val">2.0 A</span>
            </div>
          </label>
          <label class="field" id="wrap-biot-R">
            <span>Radius R</span>
            <div class="slider-row">
              <input type="range" id="biot-R" min="0.06" max="0.45" step="0.01" value="0.12" />
              <span class="mono val" id="biot-R-val">0.12 m</span>
            </div>
          </label>
          <label class="field" id="wrap-biot-L">
            <span>Length L</span>
            <div class="slider-row">
              <input type="range" id="biot-L" min="0.3" max="3" step="0.05" value="2.4" />
              <span class="mono val" id="biot-L-val">2.40 m</span>
            </div>
          </label>
          <button type="button" class="btn accent" id="btn-sweep-biot">Play Σ dB</button>
          <p class="tiny">dB = (μ₀/4π) I dl × r̂ / r² with μ₀ = 4π×10⁻⁷ T·m/A. The gold arrow is B at the probe. Play the sum to watch dl pieces add.</p>
        </div>`;
  },
  bind(api) {
    const $ = (id) => document.getElementById(id);
    $('biot-I').addEventListener('input', (e) => {
      api.slice().I = Number(e.target.value);
      api.bump();
    });
    $('biot-R').addEventListener('input', (e) => {
      api.slice().R = Number(e.target.value);
      api.bump();
    });
    $('biot-L').addEventListener('input', (e) => {
      api.slice().L = Number(e.target.value);
      api.bump();
    });
    $('btn-sweep-biot').addEventListener('click', () => api.toggleSweep());
  },
  syncControls(state) {
    const $ = (id) => document.getElementById(id);
    $('biot-I').value = state.I;
    $('biot-I-val').textContent = `${state.I.toFixed(1)} A`;
    $('biot-R').value = state.R;
    $('biot-R-val').textContent = `${state.R.toFixed(2)} m`;
    $('biot-L').value = state.L;
    $('biot-L-val').textContent = `${state.L.toFixed(2)} m`;
    $('wrap-biot-R').hidden = state.kind === 'wire';
    $('wrap-biot-L').hidden = state.kind === 'loop';
    if ($('btn-sweep-biot')) $('btn-sweep-biot').textContent = state.anim.playing ? 'Stop sum' : 'Play Σ dB';
  },
  init(ctx) {
    const group = new THREE.Group();
    ctx.scene.add(group);
    const Barrow = new Arrow(new THREE.Vector3(0, 0, 1), new THREE.Vector3(), 1, M.gold);
    group.add(Barrow);
    group.visible = false;
    return { group, Barrow, wire: null };
  },
  enter(ctx, handle) {
    handle.group.visible = true;
  },
  exit(ctx, handle) {
    handle.group.visible = false;
  },
  recompute(state, computed) {
    const pts = wirePoints(state);
    const nShow = state.anim.playing ? Math.max(2, Math.floor(state.anim.i)) : pts.length;
    const used = pts.slice(0, nShow);
    const Bnum = used.length >= 2 ? Bpolyline(state.I, used, state.probe, 4) : { x: 0, y: 0, z: 0 };
    const Bfull = Bpolyline(state.I, pts, state.probe, 4);
    const mag = Math.hypot(Bnum.x, Bnum.y, Bnum.z);
    const magFull = Math.hypot(Bfull.x, Bfull.y, Bfull.z);
    const an = analyticB(state);
    computed.biot = { Bnum, Bfull, mag, magFull, an, pts, nShow, mu0: MU0 };
  },
  syncViews(state, computed, ctx) {
    const h = ctx.handle;
    if (!h || !computed.biot) return;
    const u = UNITS_PER_METER;
    if (h.wire) {
      h.group.remove(h.wire);
      disposeTree(h.wire);
    }
    const pts = computed.biot.pts;
    const n = computed.biot.nShow;
    const flat = [];
    for (let i = 0; i < Math.min(n, pts.length); i++) {
      flat.push(pts[i].x * u, pts[i].y * u, pts[i].z * u);
    }
    if (flat.length >= 6) {
      h.wire = fatLine(flat, { color: M.yellow, width: 3 });
      h.group.add(h.wire);
    }
    const B = computed.biot.Bfull;
    const mag = computed.biot.magFull;
    const p = state.probe;
    h.Barrow.position.set(p.x * u, p.y * u, p.z * u);
    if (mag > 1e-16) {
      h.Barrow.visible = true;
      h.Barrow.setDirection(new THREE.Vector3(B.x, B.y, B.z));
      h.Barrow.setLength(Math.min(2.2, 0.4 + mag * 8e4));
    } else h.Barrow.visible = false;
    const probe = ctx.pool.probe();
    probe.setVisible(true);
    probe.sync(state.probe, { x: B.x, y: B.y, z: B.z }, `|B| = ${fmtB(mag)}`);
    ctx.grid.visible = true;
  },
  tick(dt, state, computed) {
    if (!state.anim.playing) return false;
    const nMax = computed.biot?.pts.length || 40;
    state.anim.i += dt * 18;
    if (state.anim.i >= nMax) {
      state.anim.i = nMax;
      state.anim.playing = false;
    }
    return true;
  },
  law: () => [
    String.raw`d\vec{B}=\dfrac{\mu_0}{4\pi}\dfrac{I\,d\vec{l}\times\hat{r}}{r^2}`,
    String.raw`\text{wire: }B=\dfrac{\mu_0 I}{2\pi r}\qquad\text{loop axis: }B=\dfrac{\mu_0 I R^2}{2(R^2+z^2)^{3/2}}`,
  ],
  liveRows(state, computed) {
    const b = computed.biot;
    if (!b) return '';
    const rel = Math.abs(b.magFull - b.an.mag) / Math.max(b.an.mag, 1e-12);
    const pct = Math.max(0, (1 - rel) * 100);
    return [
      kv('I', `${state.I.toFixed(2)} A`),
      kv('|B| numerical (full wire)', fmtB(b.magFull)),
      kv('|B| running', fmtB(b.mag)),
      kv(`Analytic (${b.an.note})`, fmtB(b.an.mag)),
      kv('Match', `<span class="${matchClass(pct)}">${pct.toFixed(1)}%</span>`),
      kv('B<sub>x</sub>, B<sub>y</sub>, B<sub>z</sub>', `${fmtB(b.Bfull.x)}, ${fmtB(b.Bfull.y)}, ${fmtB(b.Bfull.z)}`),
      kv('μ₀', '4π×10⁻⁷ T·m/A'),
    ].join('');
  },
  readout(state, computed) {
    const b = computed.biot;
    if (!b) return '';
    const rel = Math.abs(b.magFull - b.an.mag) / Math.max(b.an.mag, 1e-12);
    const pct = Math.max(0, (1 - rel) * 100);
    return cells([
      ['|B| num', fmtB(b.magFull), ''],
      ['Analytic', fmtB(b.an.mag), ''],
      ['Match', `${pct.toFixed(0)}%`, matchClass(pct)],
      ['I', `${state.I.toFixed(1)} A`, ''],
    ]);
  },
  coach(state, computed) {
    if (state.kind === 'wire') {
      return {
        title: 'Right-hand rule around a wire',
        body: 'Thumb along I, fingers curl in the B direction. |B| = μ₀ I / (2π r) falls as 1/r, not 1/r². The finite wire in this lab is long compared with r, so the numerical Σ dB sits close to the infinite-wire formula. Off the perpendicular, the match gets worse — Ampère needs that symmetry.',
      };
    }
    if (state.kind === 'loop') {
      return {
        title: 'Loop on axis',
        body: 'Every dl is the same distance from a point on the axis. Radial dB pieces cancel around the ring; the axial pieces add. That is why B = μ₀ I R² / 2(R²+z²)^{3/2} — same (R²+z²)^{3/2} you saw for the electric ring.',
      };
    }
    return {
      title: 'Solenoid',
      body: 'Tightly wound, long compared with R: B ≈ μ₀ n I along the axis and ≈ 0 outside. n = N/L. Ampère’s law with a rectangular loop through the wall is the fast way to this result; Biot–Savart on the helix is the slow way, and they agree on axis.',
    };
  },
});
