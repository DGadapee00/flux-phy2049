import * as THREE from 'three';
import { CSS2DObject } from 'three/addons/renderers/CSS2DRenderer.js';
import { defineLab } from './define.js';
import { Arrow, M, fatLine, disposeTree } from '../scene/manim.js';
import { UNITS_PER_METER, MU0 } from '../physics/constants.js';
import {
  Bpolyline,
  BwireInfinite,
  BwireFinite,
  BloopAxis,
  Bsolenoid,
  BsolenoidFiniteAxis,
  wireAlongY,
  loopPoints,
  helixPoints,
} from '../physics/bfield.js';
import { kv, cells, matchClass, qv } from '../ui/shared.js';
import { sciHTML } from '../ui/format.js';

const SCENARIOS = [
  { id: 'wire', name: 'Straight wire', kind: 'wire', I: 2, R: 0.12, L: 2.4, nTurns: 20, probe: { x: 0.12, y: 0, z: 0 } },
  { id: 'loop', name: 'Current loop, probe on axis', kind: 'loop', I: 3, R: 0.28, L: 0.4, nTurns: 1, probe: { x: 0, y: 0.2, z: 0 } },
  { id: 'solenoid', name: 'Solenoid, probe at center', kind: 'solenoid', I: 1.5, R: 0.16, L: 0.8, nTurns: 24, probe: { x: 0, y: 0, z: 0 } },
];

/** Probe counts as "on the axis" within 1 cm — the closed forms for loop and solenoid only hold there. */
const ON_AXIS = 0.01;

export function fmtB(t) {
  if (!Number.isFinite(t)) return '—';
  const a = Math.abs(t);
  if (a >= 1) return `${t.toFixed(3)} T`;
  if (a >= 1e-3) return `${(t * 1e3).toFixed(2)} mT`;
  if (a >= 1e-6) return `${(t * 1e6).toFixed(2)} μT`;
  return `${sciHTML(t)} T`;
}

function wirePoints(state) {
  if (state.kind === 'wire') return wireAlongY(-state.L / 2, state.L / 2, 24);
  if (state.kind === 'loop') return loopPoints(state.R, 48);
  return helixPoints(state.R, state.L, state.nTurns, 16);
}

/**
 * `exact` is the closed form for this same finite geometry — what Σ dB must reproduce.
 * `ideal` is the textbook limit (infinite wire, long solenoid) shown separately.
 */
function analyticB(state) {
  const p = state.probe;
  const rho = Math.hypot(p.x, p.z);
  const onAxis = rho < ON_AXIS;
  if (state.kind === 'wire') {
    return {
      exact: rho < 1e-6 ? null : BwireFinite(state.I, -state.L / 2, state.L / 2, p),
      exactNote: 'finite wire',
      ideal: rho < 1e-6 ? null : BwireInfinite(state.I, rho),
      idealNote: 'μ₀I/2πρ, infinite wire',
      onAxis: true,
    };
  }
  if (state.kind === 'loop') {
    return { exact: onAxis ? BloopAxis(state.I, state.R, p.y) : null, exactNote: 'loop, on axis', ideal: null, onAxis };
  }
  const n = state.nTurns / state.L;
  return {
    exact: onAxis ? BsolenoidFiniteAxis(n, state.I, state.L, state.R, p.y) : null,
    exactNote: 'finite solenoid, on axis',
    ideal: Bsolenoid(n, state.I),
    idealNote: 'μ₀nI, long solenoid',
    onAxis,
  };
}

function matchPct(num, exact) {
  if (exact == null) return null;
  const rel = Math.abs(num - Math.abs(exact)) / Math.max(Math.abs(exact), 1e-15);
  return Math.max(0, (1 - rel) * 100);
}

/** Cone chevrons along the conductor showing the direction of +I, plus an I label. */
function currentGuides(pts, kind, u) {
  const g = new THREE.Group();
  const count = kind === 'wire' ? 4 : kind === 'loop' ? 6 : 10;
  const n = pts.length - 1;
  for (let k = 0; k < count; k++) {
    const i = Math.min(n - 1, Math.floor(((k + 0.5) / count) * n));
    const a = pts[i];
    const c = pts[i + 1];
    const dir = new THREE.Vector3(c.x - a.x, c.y - a.y, c.z - a.z).normalize();
    const mid = new THREE.Vector3(((a.x + c.x) / 2) * u, ((a.y + c.y) / 2) * u, ((a.z + c.z) / 2) * u);
    const L = 0.4;
    g.add(new Arrow(dir, mid.addScaledVector(dir, -L / 2), L, M.yellow, 0.3, 0.3, 0.001));
  }
  const el = document.createElement('div');
  el.className = 'circuit-label';
  const label = new CSS2DObject(el);
  const a = pts[Math.floor(n * 0.15)];
  label.position.set(a.x * u + 0.55, a.y * u + 0.35, a.z * u);
  g.add(label);
  g.userData.label = el;
  return g;
}

export default defineLab({
  id: 'biot',
  exam: 'e4',
  title: 'Biot–Savart',
  hint: 'Play the dl sum — B at the probe is Σ dB',
  orbit: true,
  probe: true,
  camera: { pos: new THREE.Vector3(4.8, 3.6, 8.8), target: new THREE.Vector3(0, 0, 0) },
  cameraFor(state) {
    if (state.kind === 'solenoid') return { pos: new THREE.Vector3(8, 3.5, 14), target: new THREE.Vector3(0, 0, 0) };
    if (state.kind === 'loop') return { pos: new THREE.Vector3(5, 4.6, 10), target: new THREE.Vector3(0, 0.9, 0) };
    return { pos: new THREE.Vector3(4.8, 3.6, 8.8), target: new THREE.Vector3(0, 0, 0) };
  },
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
      show: {},
      anim: { playing: false, i: 0 },
    };
  },
  applyScenario(id, state) {
    const sc = SCENARIOS.find((s) => s.id === id) || SCENARIOS[0];
    Object.assign(state, { scenarioId: sc.id, kind: sc.kind, I: sc.I, R: sc.R, L: sc.L, nTurns: sc.nTurns });
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
              <span class="mono val qI" id="biot-I-val">2.0 A</span>
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
          <label class="field" id="wrap-biot-N">
            <span>Turns N</span>
            <div class="slider-row">
              <input type="range" id="biot-N" min="4" max="40" step="1" value="24" />
              <span class="mono val" id="biot-N-val">24</span>
            </div>
          </label>
          <button type="button" class="btn ghost" id="btn-biot-axis">Put probe on the axis</button>
          <button type="button" class="btn accent" id="btn-sweep-biot">Play Σ dB</button>
          <p class="tiny">dB = (μ₀/4π) I dl × r̂ / r², μ₀ = 4π×10⁻⁷ T·m/A. Yellow chevrons show +I. The teal arrow is B at the probe; click empty floor to move the probe.</p>
        </div>`;
  },
  bind(api) {
    const $ = (id) => document.getElementById(id);
    const num = (id, key) =>
      $(id).addEventListener('input', (e) => {
        api.slice()[key] = Number(e.target.value);
        api.bump();
      });
    num('biot-I', 'I');
    num('biot-R', 'R');
    num('biot-L', 'L');
    num('biot-N', 'nTurns');
    $('btn-biot-axis').addEventListener('click', () => {
      const s = api.slice();
      s.probe.x = 0;
      s.probe.z = 0;
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
    $('biot-N').value = state.nTurns;
    $('biot-N-val').textContent = String(state.nTurns);
    $('wrap-biot-R').hidden = state.kind === 'wire';
    $('wrap-biot-L').hidden = state.kind === 'loop';
    $('wrap-biot-N').hidden = state.kind !== 'solenoid';
    $('btn-biot-axis').hidden = state.kind === 'wire';
    $('btn-sweep-biot').textContent = state.anim.playing ? 'Stop sum' : 'Play Σ dB';
  },
  init(ctx) {
    const group = new THREE.Group();
    ctx.scene.add(group);
    const Barrow = new Arrow(new THREE.Vector3(0, 0, 1), new THREE.Vector3(), 1, M.teal, 0.32, 0.24, 0.045);
    group.add(Barrow);
    group.visible = false;
    return { group, Barrow, wire: null, guides: null, wireKey: '', guideKey: '' };
  },
  enter(ctx, handle) {
    handle.group.visible = true;
  },
  exit(ctx, handle) {
    handle.group.visible = false;
  },
  recompute(state, computed) {
    const pts = wirePoints(state);
    const playing = state.anim.playing;
    const nShow = playing ? Math.max(2, Math.min(pts.length, Math.floor(state.anim.i))) : pts.length;
    const Bnum = Bpolyline(state.I, pts.slice(0, nShow), state.probe, 4);
    const Bfull = nShow >= pts.length ? Bnum : Bpolyline(state.I, pts, state.probe, 4);
    computed.biot = {
      Bnum,
      Bfull,
      mag: Math.hypot(Bnum.x, Bnum.y, Bnum.z),
      magFull: Math.hypot(Bfull.x, Bfull.y, Bfull.z),
      an: analyticB(state),
      pts,
      nShow,
      playing,
      mu0: MU0,
    };
  },
  syncViews(state, computed, ctx) {
    const h = ctx.handle;
    const b = computed.biot;
    if (!h || !b) return;
    const u = UNITS_PER_METER;

    const geomKey = `${state.kind}|${state.R}|${state.L}|${state.nTurns}`;
    const wireKey = `${geomKey}|${b.nShow}`;
    if (wireKey !== h.wireKey) {
      h.wireKey = wireKey;
      if (h.wire) {
        h.group.remove(h.wire);
        disposeTree(h.wire);
        h.wire = null;
      }
      const flat = [];
      for (let i = 0; i < b.nShow; i++) flat.push(b.pts[i].x * u, b.pts[i].y * u, b.pts[i].z * u);
      if (flat.length >= 6) {
        h.wire = fatLine(flat, { color: M.yellow, width: 3.5 });
        h.group.add(h.wire);
      }
    }
    if (geomKey !== h.guideKey) {
      h.guideKey = geomKey;
      if (h.guides) {
        h.group.remove(h.guides);
        disposeTree(h.guides);
      }
      h.guides = currentGuides(b.pts, state.kind, u);
      h.group.add(h.guides);
    }
    h.guides.userData.label.innerHTML = qv('qI', `<i>I</i> = ${state.I.toFixed(1)} A`);

    const B = b.playing ? b.Bnum : b.Bfull;
    const mag = b.playing ? b.mag : b.magFull;
    const Bref = (MU0 * state.I) / (2 * Math.PI * 0.15);
    const p = state.probe;
    h.Barrow.position.set(p.x * u, p.y * u, p.z * u);
    h.Barrow.visible = mag > 1e-15;
    if (h.Barrow.visible) {
      h.Barrow.setDirection(new THREE.Vector3(B.x, B.y, B.z));
      h.Barrow.setLength(0.5 + 1.9 * Math.tanh(mag / Bref), 0.32, 0.24);
    }
    const probe = ctx.pool.probe();
    probe.setVisible(true);
    probe.sync(state.probe, { x: 0, y: 0, z: 0 }, `|B| = ${fmtB(mag).replace(/<[^>]+>/g, '')}`);
    ctx.grid.visible = true;
  },
  tick(dt, state, computed) {
    if (!state.anim.playing) return false;
    const nMax = computed.biot?.pts.length || 40;
    state.anim.i += dt * Math.max(18, nMax / 5);
    if (state.anim.i >= nMax) {
      state.anim.i = nMax;
      state.anim.playing = false;
    }
    return true;
  },
  law(state) {
    const dB = String.raw`d\vec{B}=\dfrac{\mu_0}{4\pi}\dfrac{\qI\,d\vec{l}\times\hat{r}}{r^2}`;
    if (state.kind === 'wire') {
      return [dB, String.raw`B=\dfrac{\mu_0\qI}{4\pi\rho}(\sin\theta_2-\sin\theta_1)\;\xrightarrow{\,L\to\infty\,}\;\dfrac{\mu_0\qI}{2\pi\rho}`];
    }
    if (state.kind === 'loop') return [dB, String.raw`B_{\text{axis}}=\dfrac{\mu_0\qI R^2}{2(R^2+z^2)^{3/2}}`];
    return [dB, String.raw`B_{\text{axis}}=\dfrac{\mu_0 n\qI}{2}(\cos\alpha_2-\cos\alpha_1)\;\xrightarrow{\,L\gg R\,}\;\mu_0 n\qI`];
  },
  liveRows(state, computed) {
    const b = computed.biot;
    if (!b) return '';
    const pct = matchPct(b.magFull, b.an.exact);
    const rows = [kv('I', qv('qI', `${state.I.toFixed(2)} A`)), kv('|B| numerical Σ dB', fmtB(b.magFull))];
    if (b.playing) rows.push(kv(`|B| running (${b.nShow}/${b.pts.length} pts)`, fmtB(b.mag)));
    rows.push(kv(`Exact: ${b.an.exactNote}`, b.an.exact == null ? '— (move probe to the axis)' : fmtB(Math.abs(b.an.exact))));
    if (pct != null) rows.push(kv('Match', `<span class="${matchClass(pct)}">${pct.toFixed(1)}%</span>`));
    if (b.an.ideal != null) rows.push(kv(`Ideal: ${b.an.idealNote}`, fmtB(b.an.ideal)));
    rows.push(kv('B<sub>x</sub>, B<sub>y</sub>, B<sub>z</sub>', `${fmtB(b.Bfull.x)}, ${fmtB(b.Bfull.y)}, ${fmtB(b.Bfull.z)}`));
    return rows.join('');
  },
  readout(state, computed) {
    const b = computed.biot;
    if (!b) return '';
    const pct = matchPct(b.magFull, b.an.exact);
    return cells([
      ['|B| Σ dB', fmtB(b.magFull), ''],
      ['Exact', b.an.exact == null ? 'off axis' : fmtB(Math.abs(b.an.exact)), ''],
      ['Match', pct == null ? '—' : `${pct.toFixed(1)}%`, pct == null ? '' : matchClass(pct)],
      ['Ideal limit', b.an.ideal == null ? '—' : fmtB(b.an.ideal), ''],
    ]);
  },
  coach(state, computed) {
    const b = computed.biot;
    if (state.kind === 'wire') {
      const ratio = b?.an.exact && b?.an.ideal ? (b.an.exact / b.an.ideal) * 100 : null;
      return {
        title: 'Right-hand rule around a wire',
        body: `Thumb along I (the chevrons), fingers curl the way B points. For a finite wire B = (μ₀I/4πρ)(sinθ₂ − sinθ₁); as L → ∞ both angles go to ±90° and you get μ₀I/2πρ. Here the finite wire gives ${ratio ? ratio.toFixed(1) : '—'}% of the infinite-wire value — shrink L or move the probe out and watch that drop.`,
      };
    }
    if (!b?.an.onAxis) {
      return {
        title: 'Off the axis — no closed form here',
        body: 'The on-axis formula relies on symmetry: every dl is the same distance from the probe and the sideways dB pieces cancel. Off the axis they do not, so the numerical Σ dB is the answer. Use “Put probe on the axis” to compare with the formula again.',
      };
    }
    if (state.kind === 'loop') {
      return {
        title: 'Loop on axis',
        body: 'Every dl is the same distance from a point on the axis. The radial dB pieces cancel around the ring and the axial pieces add, giving μ₀IR²/2(R²+z²)^{3/2} — the same (R²+z²)^{3/2} as the charged ring. Current counterclockwise seen from above → B points up.',
      };
    }
    const n = state.nTurns / state.L;
    const frac = b?.an.exact && b?.an.ideal ? (b.an.exact / b.an.ideal) * 100 : null;
    return {
      title: 'Solenoid: μ₀nI is the long-solenoid limit',
      body: `n = N/L = ${n.toFixed(1)} turns/m. At the center of this coil B is ${frac ? frac.toFixed(1) : '—'}% of μ₀nI because L is only ${(state.L / state.R).toFixed(1)}× R. Stretch L (keeping n by adding turns) and it approaches μ₀nI. Ampère’s law with a rectangular loop is the fast route to μ₀nI; it assumes B ≈ 0 outside.`,
    };
  },
});
