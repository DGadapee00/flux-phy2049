import * as THREE from 'three';
import { defineLab } from './define.js';
import { SCENARIOS } from '../data/scenarios.js';
import {
  linePerpField,
  ringAxisField,
  linePerpPotential,
  ringAxisPotential,
} from '../physics/analytic.js';
import { coachIntegral } from '../physics/coach.js';
import { fmtE, fmtV, fmtCharge, fmtLen } from '../ui/format.js';
import { kv, cells, matchClass } from '../ui/shared.js';
import { UNITS_PER_METER } from '../physics/constants.js';

function fmtFrom(mag) {
  const a = Math.abs(mag);
  if (a >= 1e3) return `${(mag / 1e3).toFixed(2)} kN/C`;
  return `${mag.toFixed(0)} N/C`;
}

export default defineLab({
  id: 'integral',
  exam: 'e2',
  title: 'Integrals',
  hint: 'Play the Riemann sum along dq',
  orbit: true,
  camera: { pos: new THREE.Vector3(2.4, 5.2, 11.2), target: new THREE.Vector3(0, 1.4, 0) },
  keys: { ' ': 'sweep', r: 'reset', R: 'reset' },
  scenarios: SCENARIOS.integral,
  defaultState() {
    return {
      scenarioId: 'rod',
      integral: { kind: 'rod', L: 0.8, lambda: 2e-6, d: 0.35, n: 20, Q: 2.5e-6, a: 0.32, y: 0.38, quantity: 'E' },
      charges: [],
      extraE: { x: 0, y: 0, z: 0 },
      show: { flux: false, E: false, nHat: false, lines: false, forces: false },
      selectedId: null,
      anim: { playing: false, i: 0 },
    };
  },
  controls() {
    return `
        <div class="lab-block">
          <div class="seg" id="integral-kind">
            <button type="button" data-kind="rod" class="active">Line charge</button>
            <button type="button" data-kind="ring">Ring</button>
          </div>
          <div id="int-rod">
            <label class="field">
              <span>Length L</span>
              <div class="slider-row">
                <input type="range" id="int-L" min="0.3" max="1.4" step="0.01" value="0.8" />
                <span class="mono val" id="int-L-val">0.80 m</span>
              </div>
            </label>
            <label class="field">
              <span>λ</span>
              <div class="slider-row">
                <input type="range" id="int-lambda" min="-5" max="5" step="0.1" value="2" />
                <span class="mono val" id="int-lambda-val">+2.00 μC/m</span>
              </div>
            </label>
            <label class="field">
              <span>Distance d to P</span>
              <div class="slider-row">
                <input type="range" id="int-d" min="0.12" max="0.9" step="0.01" value="0.35" />
                <span class="mono val" id="int-d-val">0.35 m</span>
              </div>
            </label>
          </div>
          <div id="int-ring" hidden>
            <label class="field">
              <span>Radius a</span>
              <div class="slider-row">
                <input type="range" id="int-a" min="0.12" max="0.7" step="0.01" value="0.32" />
                <span class="mono val" id="int-a-val">0.32 m</span>
              </div>
            </label>
            <label class="field">
              <span>Q</span>
              <div class="slider-row">
                <input type="range" id="int-Q" min="-5" max="5" step="0.1" value="2.5" />
                <span class="mono val" id="int-Q-val">+2.50 μC</span>
              </div>
            </label>
            <label class="field">
              <span>Axis distance y</span>
              <div class="slider-row">
                <input type="range" id="int-y" min="-0.8" max="0.8" step="0.01" value="0.38" />
                <span class="mono val" id="int-y-val">0.38 m</span>
              </div>
            </label>
          </div>
          <label class="field">
            <span>Slices n (Riemann sum)</span>
            <div class="slider-row">
              <input type="range" id="int-n" min="6" max="48" step="1" value="20" />
              <span class="mono val" id="int-n-val">20</span>
            </div>
          </label>
          <div class="seg" id="int-qty">
            <button type="button" data-qty="E" class="active">∫ dE</button>
            <button type="button" data-qty="V">∫ dV = k dq/r</button>
          </div>
          <button type="button" class="btn accent" id="btn-sweep-int">Play ∫ dE</button>
        </div>`;
  },
  bind(api) {
    const $ = (id) => document.getElementById(id);
    $('integral-kind').addEventListener('click', (e) => {
      const btn = e.target.closest('[data-kind]');
      if (!btn) return;
      const kind = btn.dataset.kind;
      const s = api.slice();
      s.integral.kind = kind;
      s.scenarioId = kind === 'ring' ? 'ring' : 'rod';
      const sc = SCENARIOS.integral.find((x) => x.id === s.scenarioId);
      if (sc?.integral) Object.assign(s.integral, sc.integral, { kind });
      s.anim = { playing: false, i: 0 };
      api.bump();
    });
    $('int-L').addEventListener('input', (e) => {
      api.slice().integral.L = Number(e.target.value);
      api.bump();
    });
    $('int-lambda').addEventListener('input', (e) => {
      api.slice().integral.lambda = Number(e.target.value) * 1e-6;
      api.bump();
    });
    $('int-d').addEventListener('input', (e) => {
      api.slice().integral.d = Number(e.target.value);
      api.bump();
    });
    $('int-a').addEventListener('input', (e) => {
      api.slice().integral.a = Number(e.target.value);
      api.bump();
    });
    $('int-Q').addEventListener('input', (e) => {
      api.slice().integral.Q = Number(e.target.value) * 1e-6;
      api.bump();
    });
    $('int-y').addEventListener('input', (e) => {
      api.slice().integral.y = Number(e.target.value);
      api.bump();
    });
    $('int-n').addEventListener('input', (e) => {
      api.slice().integral.n = Number(e.target.value);
      api.bump();
    });
    $('int-qty').addEventListener('click', (e) => {
      const btn = e.target.closest('[data-qty]');
      if (!btn) return;
      api.slice().integral.quantity = btn.dataset.qty;
      api.bump();
    });
    $('btn-sweep-int').addEventListener('click', () => api.toggleSweep());
  },
  syncControls(state) {
    const $ = (id) => document.getElementById(id);
    const kind = state.integral.kind;
    document.querySelectorAll('#integral-kind [data-kind]').forEach((b) => {
      b.classList.toggle('active', b.dataset.kind === kind);
    });
    if ($('int-rod')) $('int-rod').hidden = kind !== 'rod';
    if ($('int-ring')) $('int-ring').hidden = kind !== 'ring';
    $('int-L').value = state.integral.L;
    $('int-L-val').textContent = `${state.integral.L.toFixed(2)} m`;
    $('int-lambda').value = state.integral.lambda * 1e6;
    $('int-lambda-val').textContent = `${state.integral.lambda >= 0 ? '+' : ''}${(state.integral.lambda * 1e6).toFixed(2)} μC/m`;
    $('int-d').value = state.integral.d;
    $('int-d-val').textContent = `${state.integral.d.toFixed(2)} m`;
    $('int-a').value = state.integral.a;
    $('int-a-val').textContent = `${state.integral.a.toFixed(2)} m`;
    $('int-Q').value = state.integral.Q * 1e6;
    $('int-Q-val').textContent = fmtCharge(state.integral.Q);
    $('int-y').value = state.integral.y;
    $('int-y-val').textContent = `${state.integral.y.toFixed(2)} m`;
    $('int-n').value = state.integral.n;
    $('int-n-val').textContent = String(state.integral.n);
    const qE = (state.integral.quantity || 'E') === 'E';
    if ($('btn-sweep-int')) $('btn-sweep-int').textContent = state.anim.playing ? 'Stop sum' : qE ? 'Play ∫ dE' : 'Play ∫ dV';
    document.querySelectorAll('#int-qty [data-qty]').forEach((b) => {
      b.classList.toggle('active', b.dataset.qty === (state.integral.quantity || 'E'));
    });
  },
  recompute(state, computed, ctx) {
    const distView = ctx.pool.dist();
    const nShow = state.anim.playing ? state.anim.i : state.integral.n + 1;
    const data = distView.rebuild(state.integral, nShow);
    const wantV = (state.integral.quantity || 'E') === 'V';
    const analytic = wantV
      ? state.integral.kind === 'rod'
        ? linePerpPotential(state.integral.lambda, state.integral.L, state.integral.d)
        : ringAxisPotential(state.integral.Q, state.integral.a, state.integral.y)
      : state.integral.kind === 'rod'
        ? linePerpField(state.integral.lambda, state.integral.L, state.integral.d)
        : ringAxisField(state.integral.Q, state.integral.a, state.integral.y);
    computed.integral = { pieces: data.pieces, partial: distView.partial, analytic };
    const P = { x: 0, y: state.integral.kind === 'ring' ? state.integral.y : state.integral.d, z: 0 };
    distView.labelEl.textContent = wantV
      ? `V = ${fmtV(distView.partial.V)}  vs  ${fmtV(analytic.V)}`
      : `|E| = ${fmtFrom(computed.integral.partial.mag)}  vs  ${fmtFrom(analytic.mag)}`;
    distView.label.position.set(P.x * UNITS_PER_METER, P.y * UNITS_PER_METER + 0.4, P.z * UNITS_PER_METER);
  },
  syncViews(state, computed, ctx) {
    ctx.pool.dist().setVisible(true);
    ctx.grid.visible = true;
  },
  tick(dt, state) {
    if (!state.anim.playing) return false;
    const nMax = state.integral.n;
    state.anim.i += dt * 12;
    if (state.anim.i >= nMax) {
      state.anim.i = nMax;
      state.anim.playing = false;
    }
    return true;
  },
  law(state) {
    const kind = state.integral.kind;
    const wantVLaw = (state.integral.quantity || 'E') === 'V';
    if (wantVLaw) {
      return kind === 'rod'
        ? [
            String.raw`V = k\lambda \displaystyle\int \frac{dx}{r}`,
            String.raw`= k\lambda \ln\!\left[\dfrac{\sqrt{(L/2)^2+d^2}+L/2}{\sqrt{(L/2)^2+d^2}-L/2}\right]`,
          ]
        : [String.raw`V = \dfrac{kQ}{\sqrt{a^2+y^2}} = \dfrac{k\lambda\,2\pi a}{\sqrt{a^2+y^2}}`];
    }
    return kind === 'rod'
      ? [
          String.raw`d\vec{E} = \dfrac{k\,dq}{r^2}\,\hat{r}, \quad dq = \lambda\,dx`,
          String.raw`E_y = \dfrac{k\lambda}{d}\left(\sin\theta_1 + \sin\theta_2\right)`,
        ]
      : [String.raw`d\vec{E} = \dfrac{k\,dq}{r^2}\,\hat{r}`, String.raw`E_y = \dfrac{kQy}{(y^2+a^2)^{3/2}}`];
  },
  liveRows(state, computed) {
    const I = computed.integral;
    if (!I) return '';
    const kind = state.integral.kind;
    const wantV = (state.integral.quantity || 'E') === 'V';
    const p = I.partial;
    const a = I.analytic;
    if (wantV) {
      const rel = Math.abs((p.V ?? 0) - a.V) / Math.max(Math.abs(a.V), 1);
      const pct = Math.max(0, (1 - rel) * 100);
      return [
        kv('Running V = Σ k dq/r', fmtV(p.V)),
        kv('Analytic V', fmtV(a.V)),
        kv('Match', `<span class="${matchClass(pct)}">${pct.toFixed(1)}%</span>`),
      ].join('');
    }
    const rel = Math.abs(p.mag - a.mag) / Math.max(a.mag, 1);
    const pct = Math.max(0, (1 - rel) * 100);
    return [
      kv('Running E<sub>x</sub>', fmtE(p.x)),
      kv('Running E<sub>y</sub>', fmtE(p.y)),
      kv('Running |E|', fmtE(p.mag)),
      kv('Analytic |E|', fmtE(a.mag)),
      kv('Match', `<span class="${matchClass(pct)}">${pct.toFixed(1)}%</span>`),
      kind === 'rod'
        ? kv('θ', `${((I.analytic.theta * 180) / Math.PI).toFixed(1)}°  ·  r_end = ${fmtLen(I.analytic.rEnd)}`)
        : kv('r to ring', fmtLen(I.analytic.r)),
    ].join('');
  },
  readout(state, computed) {
    const I = computed.integral;
    if (!I) return '';
    const p = I.partial;
    const a = I.analytic;
    const wantV = (state.integral.quantity || 'E') === 'V';
    if (wantV) {
      const rel = Math.abs((p.V ?? 0) - a.V) / Math.max(Math.abs(a.V), 1);
      const pct = Math.max(0, (1 - rel) * 100);
      return cells([
        ['Σ dV', fmtV(p.V), ''],
        ['Analytic V', fmtV(a.V), ''],
        ['Match', `${pct.toFixed(1)}%`, matchClass(pct)],
        ['Note', 'V is a scalar', ''],
      ]);
    }
    const rel = Math.abs(p.mag - a.mag) / Math.max(a.mag, 1);
    const pct = Math.max(0, (1 - rel) * 100);
    return cells([
      ['Σ dE (running)', fmtE(p.mag), ''],
      ['Analytic |E|', fmtE(a.mag), ''],
      ['E_x (should → 0)', fmtE(p.x), Math.abs(p.x) < 0.08 * Math.max(p.mag, 1) ? 'ok' : ''],
      ['E_y', fmtE(p.y), ''],
    ]);
  },
  coach: (state) => coachIntegral(state),
});
