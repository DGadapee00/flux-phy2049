import { SCENARIOS } from '../data/scenarios.js';
import { chargeLocation, isClosed } from '../physics/surfaces.js';
import { DIELECTRICS } from '../physics/capacitor.js';
import { MATERIALS } from '../physics/circuit.js';
import { fmtCharge, fmtE, fmtForce, fmtLen, fmtPhi, fmtV, fmtEnergy, fmtC, fmtR, fmtI, fmtP, sciHTML } from './format.js';
import { drawVx, drawAC } from './plot.js';
import katex from 'katex';

/** Color-coded circuit quantities, matched by the scene labels: V blue, I yellow, R green, P red. */
const TEX_MACROS = {
  '\\qV': '\\textcolor{#58C4DD}{V}',
  '\\qI': '\\textcolor{#F4D345}{I}',
  '\\qR': '\\textcolor{#83C167}{R}',
  '\\qP': '\\textcolor{#FC6255}{P}',
};

const texCache = new Map();
function tex(src) {
  let html = texCache.get(src);
  if (!html) {
    html = katex.renderToString(src, { throwOnError: false, displayMode: false, macros: TEX_MACROS });
    texCache.set(src, html);
  }
  return html;
}

export function createHUD(api) {
  const $ = (id) => document.getElementById(id);

  /** Typeset one formula per line; skip DOM work when unchanged (update runs every frame on live labs). */
  let lawKey = '';
  function setLaw(lines) {
    const key = lines.join('\n');
    if (key === lawKey) return;
    lawKey = key;
    $('law-line').innerHTML = lines.map((l) => `<div class="law-row">${tex(l)}</div>`).join('');
  }

  const scenario = $('scenario');
  const chargeList = $('charge-list');
  let chargeSig = '';
  let lastLab = '';

  function fillScenarios(lab) {
    const list = SCENARIOS[lab];
    scenario.innerHTML = list.map((s) => `<option value="${s.id}">${s.name}</option>`).join('');
  }

  document.getElementById('lab-tabs').addEventListener('click', (e) => {
    const btn = e.target.closest('[data-lab]');
    if (btn) api.setLab(btn.dataset.lab);
  });

  scenario.addEventListener('change', () => api.setScenario(scenario.value));

  document.getElementById('surface-type').addEventListener('click', (e) => {
    const btn = e.target.closest('[data-type]');
    if (btn) api.setSurfaceType(btn.dataset.type);
  });

  $('surf-R').addEventListener('input', (e) => api.setR(Number(e.target.value)));
  $('surf-L').addEventListener('input', (e) => api.setL(Number(e.target.value)));
  $('surf-tilt').addEventListener('input', (e) => api.setTilt(Number(e.target.value)));

  $('add-plus').addEventListener('click', () => api.addCharge(1));
  $('add-minus').addEventListener('click', () => api.addCharge(-1));
  $('del-charge').addEventListener('click', () => api.deleteSelected());
  $('btn-sweep').addEventListener('click', () => api.toggleSweep());
  $('btn-sweep-int').addEventListener('click', () => api.toggleSweep());
  $('btn-reset-cam').addEventListener('click', () => api.resetCamera());

  document.getElementById('toggles').addEventListener('click', (e) => {
    const btn = e.target.closest('[data-key]');
    if (btn) api.toggleShow(btn.dataset.key);
  });

  document.getElementById('integral-kind').addEventListener('click', (e) => {
    const btn = e.target.closest('[data-kind]');
    if (btn) api.setIntegralKind(btn.dataset.kind);
  });

  $('int-L').addEventListener('input', (e) => api.setIntegral('L', Number(e.target.value)));
  $('int-lambda').addEventListener('input', (e) => api.setIntegral('lambda', Number(e.target.value) * 1e-6));
  $('int-d').addEventListener('input', (e) => api.setIntegral('d', Number(e.target.value)));
  $('int-a').addEventListener('input', (e) => api.setIntegral('a', Number(e.target.value)));
  $('int-Q').addEventListener('input', (e) => api.setIntegral('Q', Number(e.target.value) * 1e-6));
  $('int-y').addEventListener('input', (e) => api.setIntegral('y', Number(e.target.value)));
  $('int-n').addEventListener('input', (e) => api.setIntegral('n', Number(e.target.value)));

  document.getElementById('int-qty')?.addEventListener('click', (e) => {
    const btn = e.target.closest('[data-qty]');
    if (btn) api.setIntegral('quantity', btn.dataset.qty);
  });

  $('q-test')?.addEventListener('input', (e) => api.setQTest(Number(e.target.value) * 1e-6));

  const capDie = $('cap-dielectric');
  capDie.innerHTML = DIELECTRICS.map((d) => `<option value="${d.id}">${d.name} (κ=${d.kappa})</option>`).join('');
  capDie.addEventListener('change', () => api.setCap('dielectric', capDie.value));
  $('cap-inserted').addEventListener('change', (e) => api.setCap('inserted', e.target.checked));
  $('cap-A').addEventListener('input', (e) => api.setCap('A', Number(e.target.value)));
  $('cap-d').addEventListener('input', (e) => api.setCap('d', Number(e.target.value)));
  $('cap-V').addEventListener('input', (e) => api.setCap('V', Number(e.target.value)));
  document.getElementById('cap-mode').addEventListener('click', (e) => {
    const btn = e.target.closest('[data-mode]');
    if (btn) api.setCap('mode', btn.dataset.mode);
  });

  const ohmMat = $('ohm-material');
  ohmMat.innerHTML = MATERIALS.map((m) => `<option value="${m.id}">${m.name}</option>`).join('');
  ohmMat.addEventListener('change', () => api.setOhm('material', ohmMat.value));
  $('ohm-L').addEventListener('input', (e) => api.setOhm('L', Number(e.target.value)));
  $('ohm-A').addEventListener('input', (e) => api.setOhm('A', Number(e.target.value) * 1e-6));
  $('ohm-V').addEventListener('input', (e) => api.setOhm('V', Number(e.target.value)));
  $('ohm-T').addEventListener('input', (e) => api.setOhm('T', Number(e.target.value)));

  document.getElementById('pwr-mode').addEventListener('click', (e) => {
    const btn = e.target.closest('[data-mode]');
    if (btn) api.setPower('mode', btn.dataset.mode);
  });
  $('pwr-V').addEventListener('input', (e) => {
    const v = Number(e.target.value);
    api.setPower('V', v);
    api.setPower('Vrms', v);
  });
  $('pwr-R').addEventListener('input', (e) => api.setPower('R', Number(e.target.value)));
  $('pwr-f').addEventListener('input', (e) => api.setPower('f', Number(e.target.value)));

  chargeList.addEventListener('input', (e) => {
    const item = e.target.closest('[data-id]');
    if (!item || e.target.type !== 'range') return;
    api.setChargeQ(Number(item.dataset.id), Number(e.target.value) * 1e-6);
  });
  chargeList.addEventListener('click', (e) => {
    const item = e.target.closest('[data-id]');
    if (item) api.selectCharge(Number(item.dataset.id));
  });

  window.addEventListener('keydown', (e) => {
    if (e.target.matches('input, select, textarea')) return;
    if (e.key === '1') api.setLab('gauss');
    if (e.key === '2') api.setLab('field');
    if (e.key === '3') api.setLab('integral');
    if (e.key === '4') api.setLab('force');
    if (e.key === '5') api.setLab('potential');
    if (e.key === '6') api.setLab('capacitor');
    if (e.key === '7') api.setLab('ohm');
    if (e.key === '8') api.setLab('power');
    if (e.key === ' ') {
      e.preventDefault();
      api.toggleSweep();
    }
    if (e.key === 'Delete' || e.key === 'Backspace') api.deleteSelected();
    if (e.key === 'r' || e.key === 'R') api.resetCamera();
    if (e.key === '=' || e.key === '+') api.addCharge(1);
    if (e.key === '-') api.addCharge(-1);
  });

  function setLabChrome(lab) {
    document.querySelectorAll('#lab-tabs .tab').forEach((b) => {
      const on = b.dataset.lab === lab;
      b.classList.toggle('active', on);
      b.setAttribute('aria-selected', on ? 'true' : 'false');
    });
    document.querySelectorAll('[data-for]').forEach((el) => {
      const labs = el.dataset.for.split(/\s+/);
      el.hidden = !labs.includes(lab);
    });
    $('legend').style.display = lab === 'gauss' ? '' : 'none';
    $('legend-V').hidden = lab !== 'potential';
    if (lab !== lastLab) {
      lastLab = lab;
      fillScenarios(lab);
    }
    const hints = {
      gauss: 'Drag a charge through the surface',
      field: 'Click empty space to place the probe',
      integral: 'Play the Riemann sum along dq',
      force: 'Select a charge to read F_net',
      potential: 'Click probe (B) · Shift-click sets A',
      capacitor: 'Insert a dielectric or switch battery / isolated',
      ohm: 'Heat the wire — R rises, I falls',
      power: 'Toggle AC to see rms vs peak',
    };
    $('hint-action').textContent = hints[lab];
    $('setup-hint').textContent = hints[lab];
  }

  function syncControls(state) {
    scenario.value = state.scenarioId;
    const t = state.surface.type;
    document.querySelectorAll('#surface-type [data-type]').forEach((b) => {
      b.classList.toggle('active', b.dataset.type === t);
    });
    $('wrap-L').hidden = !(t === 'cylinder' || t === 'pillbox');
    $('wrap-tilt').hidden = t !== 'square';
    $('r-label').textContent = t === 'cube' || t === 'square' ? 'Half-side a' : 'Radius R';
    $('surf-R').value = state.surface.R;
    $('surf-R-val').textContent = `${state.surface.R.toFixed(2)} m`;
    $('surf-L').value = state.surface.L;
    $('surf-L-val').textContent = `${state.surface.L.toFixed(2)} m`;
    $('surf-tilt').value = state.surface.tilt;
    $('surf-tilt-val').textContent = `${((state.surface.tilt * 180) / Math.PI).toFixed(0)}°`;

    document.querySelectorAll('#toggles [data-key]').forEach((b) => {
      const on = !!state.show[b.dataset.key];
      b.classList.toggle('active', on);
      b.setAttribute('aria-pressed', on ? 'true' : 'false');
    });

    const kind = state.integral.kind;
    document.querySelectorAll('#integral-kind [data-kind]').forEach((b) => {
      b.classList.toggle('active', b.dataset.kind === kind);
    });
    $('int-rod').hidden = kind !== 'rod';
    $('int-ring').hidden = kind !== 'ring';
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

    $('btn-sweep').textContent = state.anim.playing && state.lab === 'gauss' ? 'Stop integral' : 'Play ∮ E · dA';
    const qE = (state.integral.quantity || 'E') === 'E';
    $('btn-sweep-int').textContent = state.anim.playing && state.lab === 'integral' ? 'Stop sum' : qE ? 'Play ∫ dE' : 'Play ∫ dV';
    document.querySelectorAll('#int-qty [data-qty]').forEach((b) => {
      b.classList.toggle('active', b.dataset.qty === (state.integral.quantity || 'E'));
    });

    if (state.qTest != null && $('q-test')) {
      $('q-test').value = state.qTest * 1e6;
      $('q-test-val').textContent = fmtCharge(state.qTest);
    }
    if (state.cap) {
      document.querySelectorAll('#cap-mode [data-mode]').forEach((b) => {
        b.classList.toggle('active', b.dataset.mode === state.cap.mode);
      });
      $('cap-dielectric').value = state.cap.dielectric;
      $('cap-inserted').checked = state.cap.inserted !== false;
      $('cap-A').value = state.cap.A;
      $('cap-A-val').textContent = `${state.cap.A.toFixed(2)} m²`;
      $('cap-d').value = state.cap.d;
      $('cap-d-val').textContent = state.cap.d >= 0.01 ? `${(state.cap.d * 100).toFixed(1)} cm` : `${(state.cap.d * 1000).toFixed(1)} mm`;
      $('cap-V').value = state.cap.V;
      $('cap-V-val').textContent = fmtV(state.cap.V);
      $('wrap-cap-V').hidden = state.cap.mode !== 'battery';
    }
    if (state.ohm) {
      $('ohm-material').value = state.ohm.material;
      $('ohm-L').value = state.ohm.L;
      $('ohm-L-val').textContent = `${state.ohm.L.toFixed(1)} m`;
      $('ohm-A').value = state.ohm.A * 1e6;
      $('ohm-A-val').textContent = `${(state.ohm.A * 1e6).toFixed(2)} mm²`;
      $('ohm-V').value = state.ohm.V;
      $('ohm-V-val').textContent = fmtV(state.ohm.V);
      $('ohm-T').value = state.ohm.T;
      $('ohm-T-val').textContent = `${state.ohm.T.toFixed(0)} °C`;
    }
    if (state.power) {
      document.querySelectorAll('#pwr-mode [data-mode]').forEach((b) => {
        b.classList.toggle('active', b.dataset.mode === state.power.mode);
      });
      $('pwr-V').value = state.power.mode === 'ac' ? state.power.Vrms : state.power.V;
      $('pwr-V-label').textContent = state.power.mode === 'ac' ? 'V_rms' : 'Voltage V';
      $('pwr-V-val').textContent = fmtV(state.power.mode === 'ac' ? state.power.Vrms : state.power.V);
      $('pwr-R').value = state.power.R;
      $('pwr-R-val').textContent = fmtR(state.power.R);
      $('pwr-f').value = state.power.f;
      $('pwr-f-val').textContent = `${state.power.f} Hz`;
      $('wrap-pwr-f').hidden = state.power.mode !== 'ac';
    }
  }

  function renderChargeList(state) {
    const big = state.charges.filter((c) => !c.small);
    const small = state.charges.filter((c) => c.small);
    const sig = `${state.lab}|${big.map((c) => c.id).join(',')}|${small.length}|${state.selectedId}`;
    if (sig !== chargeSig) {
      chargeSig = sig;
      let html = '';
      if (small.length) {
        html += `<li class="charge-item" style="cursor:default"><span class="badge out">${small.length} elements</span><span style="grid-column:2/-1;color:var(--text-muted);font-size:11px">Line/sheet approximation — drag one in the scene to break symmetry.</span></li>`;
      }
      html += big
        .map((c) => {
          const loc = state.lab === 'gauss' && isClosed(state.surface.type) ? chargeLocation(c, state.surface) : '';
          const sel = c.id === state.selectedId ? ' selected' : '';
          const uC = (c.q * 1e6).toFixed(2);
          return `<li class="charge-item${sel}" data-id="${c.id}">
            <span class="mono" style="color:${c.q >= 0 ? 'var(--pos)' : 'var(--neg)'}">${fmtCharge(c.q)}</span>
            <input type="range" min="-5" max="5" step="0.1" value="${uC}" aria-label="Charge" />
            ${loc ? `<span class="badge ${loc}">${loc}</span>` : '<span></span>'}
          </li>`;
        })
        .join('');
      chargeList.innerHTML = html || '<li class="charge-item" style="cursor:default;color:var(--text-dim)">No point charges</li>';
    } else {
      chargeList.querySelectorAll('[data-id]').forEach((item) => {
        const id = Number(item.dataset.id);
        const c = state.charges.find((x) => x.id === id);
        if (!c) return;
        item.classList.toggle('selected', c.id === state.selectedId);
        const badge = item.querySelector('.badge');
        if (badge && state.lab === 'gauss' && isClosed(state.surface.type)) {
          const loc = chargeLocation(c, state.surface);
          badge.className = `badge ${loc}`;
          badge.textContent = loc;
        }
        const label = item.querySelector('.mono');
        if (label) {
          label.textContent = fmtCharge(c.q);
          label.style.color = c.q >= 0 ? 'var(--pos)' : 'var(--neg)';
        }
      });
    }
  }

  function matchClass(pct) {
    if (pct >= 97) return 'ok';
    if (pct >= 90) return 'warn';
    return 'bad';
  }

  function update(state, computed) {
    setLabChrome(state.lab);
    syncControls(state);
    renderChargeList(state);

    const live = $('eq-live');
    const title = $('insight-title');
    const body = $('insight-body');
    const readout = $('readout');
    const coach = computed.coach || { title: '', body: '' };
    title.textContent = coach.title;
    body.textContent = coach.body;
    $('mini-plot').hidden = true;

    if (state.lab === 'gauss') {
      const g = computed.gauss;
      const closed = g?.closed;
      setLaw(
        closed
          ? [String.raw`\Phi_E = \oint \vec{E}\cdot\hat{n}\,dA = \dfrac{Q_{\text{in}}}{\varepsilon_0}`]
          : [String.raw`\Phi_E = \vec{E}\cdot\vec{A} = |\vec{E}|\,A\cos\theta`],
      );
      const PhiShow = state.anim.playing && g ? g.runningPhi : g?.Phi;
      const rows = [];
      if (g) {
        rows.push(kv('Numerical Σ E·ΔA', fmtPhi(PhiShow)));
        if (closed) {
          rows.push(kv('Q<sub>in</sub>/ε<sub>0</sub>', fmtPhi(g.PhiG)));
          rows.push(kv('Match', `<span class="${matchClass(g.match.pct)}">${g.match.pct.toFixed(1)}%</span>`));
          rows.push(kv('Q<sub>in</sub>', fmtCharge(g.Qin)));
        } else {
          const A = g.area;
          const ca = Math.cos(state.surface.tilt || 0);
          const E = Math.hypot(state.extraE.x, state.extraE.y, state.extraE.z);
          rows.push(kv('|E| A cosθ', fmtPhi(E * A * ca)));
          rows.push(kv('A', `${A.toFixed(3)} m²`));
          rows.push(kv('cosθ', ca.toFixed(3)));
        }
        if (g.PhiWall || g.PhiCap) {
          rows.push(kv('Φ_wall', fmtPhi(g.PhiWall)));
          rows.push(kv('Φ_caps', fmtPhi(g.PhiCap)));
        }
        if (coach.canFindE && coach.Eguess != null) {
          rows.push(kv('|E| from Gauss', fmtE(coach.Eguess)));
        }
        if (coach.formula) rows.push(kv('Use', coach.formula));
      }
      live.innerHTML = rows.join('');
      readout.innerHTML = g
        ? cells([
            ['Φ numerical', fmtPhi(PhiShow), ''],
            [closed ? 'Q_in / ε₀' : '|E|A cosθ', closed ? fmtPhi(g.PhiG) : fmtPhi(Math.hypot(state.extraE.x, state.extraE.y, state.extraE.z) * g.area * Math.cos(state.surface.tilt || 0)), ''],
            [closed ? 'Match' : 'Tiles', closed ? `${g.match.pct.toFixed(1)}%` : `${g.samples.length} dA`, closed ? matchClass(g.match.pct) : ''],
            ['Enclosed', closed ? `${fmtCharge(g.Qin)} · ${g.nIn} in / ${g.nOut} out` : 'open surface', ''],
          ])
        : '';
    } else if (state.lab === 'field') {
      setLaw([String.raw`\vec{E} = \dfrac{kq}{r^2}\,\hat{r}`, String.raw`\vec{E}_{\text{net}} = \textstyle\sum_i \vec{E}_i`]);
      const E = computed.probeE || { x: 0, y: 0, z: 0 };
      const mag = Math.hypot(E.x, E.y, E.z);
      const rows = [
        kv('|E<sub>net</sub>|', fmtE(mag)),
        kv('E<sub>x</sub>', fmtE(E.x)),
        kv('E<sub>y</sub>', fmtE(E.y)),
        kv('E<sub>z</sub>', fmtE(E.z)),
        kv('Probe', `(${state.probe.x.toFixed(2)}, ${state.probe.y.toFixed(2)}, ${state.probe.z.toFixed(2)}) m`),
      ];
      for (const row of computed.contrib || []) {
        const name = row.id === 'uniform' ? 'uniform E' : fmtCharge(row.q);
        rows.push(kv(name, fmtE(row.mag)));
      }
      live.innerHTML = rows.join('');
      readout.innerHTML = cells([
        ['|E_net|', fmtE(mag), ''],
        ['E_x', fmtE(E.x), ''],
        ['E_y', fmtE(E.y), ''],
        ['E_z', fmtE(E.z), ''],
      ]);
    } else if (state.lab === 'integral') {
      const kind = state.integral.kind;
      const wantVLaw = (state.integral.quantity || 'E') === 'V';
      setLaw(
        wantVLaw
          ? kind === 'rod'
            ? [
                String.raw`V = k\lambda \displaystyle\int \frac{dx}{r}`,
                String.raw`= k\lambda \ln\!\left[\dfrac{\sqrt{(L/2)^2+d^2}+L/2}{\sqrt{(L/2)^2+d^2}-L/2}\right]`,
              ]
            : [String.raw`V = \dfrac{kQ}{\sqrt{a^2+y^2}} = \dfrac{k\lambda\,2\pi a}{\sqrt{a^2+y^2}}`]
          : kind === 'rod'
            ? [
                String.raw`d\vec{E} = \dfrac{k\,dq}{r^2}\,\hat{r}, \quad dq = \lambda\,dx`,
                String.raw`E_y = \dfrac{k\lambda}{d}\left(\sin\theta_1 + \sin\theta_2\right)`,
              ]
            : [String.raw`d\vec{E} = \dfrac{k\,dq}{r^2}\,\hat{r}`, String.raw`E_y = \dfrac{kQy}{(y^2+a^2)^{3/2}}`],
      );
      const I = computed.integral;
      const wantV = (state.integral.quantity || 'E') === 'V';
      if (I) {
        const p = I.partial;
        const a = I.analytic;
        if (wantV) {
          const rel = Math.abs((p.V ?? 0) - a.V) / Math.max(Math.abs(a.V), 1);
          const pct = Math.max(0, (1 - rel) * 100);
          live.innerHTML = [
            kv('Running V = Σ k dq/r', fmtV(p.V)),
            kv('Analytic V', fmtV(a.V)),
            kv('Match', `<span class="${matchClass(pct)}">${pct.toFixed(1)}%</span>`),
          ].join('');
          readout.innerHTML = cells([
            ['Σ dV', fmtV(p.V), ''],
            ['Analytic V', fmtV(a.V), ''],
            ['Match', `${pct.toFixed(1)}%`, matchClass(pct)],
            ['Note', 'V is a scalar', ''],
          ]);
        } else {
          const rel = Math.abs(p.mag - a.mag) / Math.max(a.mag, 1);
          const pct = Math.max(0, (1 - rel) * 100);
          live.innerHTML = [
            kv('Running E<sub>x</sub>', fmtE(p.x)),
            kv('Running E<sub>y</sub>', fmtE(p.y)),
            kv('Running |E|', fmtE(p.mag)),
            kv('Analytic |E|', fmtE(a.mag)),
            kv('Match', `<span class="${matchClass(pct)}">${pct.toFixed(1)}%</span>`),
            kind === 'rod'
              ? kv('θ', `${((I.analytic.theta * 180) / Math.PI).toFixed(1)}°  ·  r_end = ${fmtLen(I.analytic.rEnd)}`)
              : kv('r to ring', fmtLen(I.analytic.r)),
          ].join('');
          readout.innerHTML = cells([
            ['Σ dE (running)', fmtE(p.mag), ''],
            ['Analytic |E|', fmtE(a.mag), ''],
            ['E_x (should → 0)', fmtE(p.x), Math.abs(p.x) < 0.08 * Math.max(p.mag, 1) ? 'ok' : ''],
            ['E_y', fmtE(p.y), ''],
          ]);
        }
      }
    } else if (state.lab === 'force') {
      setLaw([String.raw`\vec{F}_E = \dfrac{k\,q_1 q_2}{r^2}\,\hat{r} \qquad \vec{F} = q\vec{E}`]);
      const F = computed.selectedForce;
      const sel = state.charges.find((c) => c.id === state.selectedId);
      const rows = [];
      if (sel && F) {
        const mag = Math.hypot(F.x, F.y, F.z);
        rows.push(kv('Selected', fmtCharge(sel.q)));
        rows.push(kv('|F<sub>net</sub>|', fmtForce(mag)));
        rows.push(kv('F<sub>x</sub>', fmtForce(F.x)));
        rows.push(kv('F<sub>y</sub>', fmtForce(F.y)));
        rows.push(kv('F<sub>z</sub>', fmtForce(F.z)));
      } else {
        rows.push(kv('Need', 'two or more charges'));
      }
      live.innerHTML = rows.join('');
      const mag = F ? Math.hypot(F.x, F.y, F.z) : 0;
      readout.innerHTML = cells([
        ['Selected', sel ? fmtCharge(sel.q) : '—', ''],
        ['|F_net|', F ? fmtForce(mag) : '—', ''],
        ['F_x', F ? fmtForce(F.x) : '—', ''],
        ['F_y', F ? fmtForce(F.y) : '—', ''],
      ]);
    } else if (state.lab === 'potential') {
      setLaw([String.raw`V = \dfrac{kq}{r} \qquad \Delta PE_E = q\,\Delta V`, String.raw`E_x = -\dfrac{dV}{dx}`]);
      const V = computed.V ?? 0;
      const VA = computed.VA ?? 0;
      const PE = computed.PE ?? 0;
      const W = computed.Wfield ?? 0;
      const g = computed.grad;
      const rows = [
        kv('V at probe (B)', fmtV(V)),
        kv('V at A', fmtV(VA)),
        kv('ΔV = V<sub>B</sub> − V<sub>A</sub>', fmtV(V - VA)),
        kv('PE<sub>E</sub> = q V', fmtEnergy(PE)),
        kv('W<sub>field</sub> A→B', fmtEnergy(W)),
      ];
      if (g) {
        rows.push(kv('E<sub>x</sub>', fmtE(g.Ex)));
        rows.push(kv('−dV/dx', fmtE(g.negdVdx)));
      }
      for (const row of computed.Vcontrib || []) {
        const name = row.id === 'uniform' ? 'uniform' : fmtCharge(row.q);
        rows.push(kv(name, fmtV(row.V)));
      }
      live.innerHTML = rows.join('');
      readout.innerHTML = cells([
        ['V (probe)', fmtV(V), ''],
        ['PE_E', fmtEnergy(PE), ''],
        ['ΔV (A→B)', fmtV(V - VA), ''],
        ['W_field', fmtEnergy(W), ''],
      ]);
      const plot = $('mini-plot');
      plot.hidden = false;
      if (computed.Vx) drawVx(plot, computed.Vx.xs, computed.Vx.Vs, state.probe.x, state.pathA?.x);
    } else if (state.lab === 'capacitor') {
      setLaw([String.raw`C = \dfrac{q}{\Delta V} = \dfrac{\kappa\varepsilon_0 A}{d}`, String.raw`E = \dfrac{V}{d} \qquad U = \tfrac{1}{2}CV^2`]);
      const r = computed.cap;
      if (r) {
        live.innerHTML = [
          kv('κ', String(r.kappa)),
          kv('C<sub>0</sub> (vacuum)', fmtC(r.C0)),
          kv('C', fmtC(r.C)),
          kv('V', fmtV(r.V)),
          kv('q = C V', fmtCharge(r.Q)),
          kv('E = V/d', fmtE(r.E)),
          kv('σ = q/A', `${sciHTML(r.sigma)} C/m²`),
          kv('U = ½CV²', fmtEnergy(r.U)),
          kv('V<sub>bd</sub> = (DS)d', Number.isFinite(r.Vbd) ? fmtV(r.Vbd) : '—'),
          kv('Breakdown', r.breakdown ? '<span class="bad">YES</span>' : '<span class="ok">no</span>'),
        ].join('');
        readout.innerHTML = cells([
          ['C', fmtC(r.C), ''],
          ['V', fmtV(r.V), r.breakdown ? 'bad' : ''],
          ['q', fmtCharge(r.Q), ''],
          ['U', fmtEnergy(r.U), r.breakdown ? 'bad' : 'ok'],
        ]);
      }
      $('mini-plot').hidden = true;
    } else if (state.lab === 'ohm') {
      setLaw([String.raw`I = \dfrac{dq}{dt} \qquad V = IR \qquad R = \dfrac{\rho L}{A}`]);
      const o = computed.ohm;
      if (o) {
        live.innerHTML = [
          kv('Material', o.mat.name),
          kv('ρ(T)', `${sciHTML(o.rho)} Ω·m`),
          kv('R = ρL/A', fmtR(o.Rgeo)),
          kv('R used', fmtR(o.R)),
          kv('I = V/R', fmtI(o.I)),
          kv('J = I/A', `${sciHTML(o.J)} A/m²`),
          kv('v<sub>d</sub> = J/(nq)', `${o.vd.toExponential(2)} m/s`),
          kv('E in wire', fmtE(o.E)),
          kv('P = IV', fmtP(o.P)),
          kv('e⁻ / s', sciHTML(o.Ne_per_s, 2)),
        ].join('');
        readout.innerHTML = cells([
          ['R', fmtR(o.R), ''],
          ['I', fmtI(o.I), ''],
          ['v_d', `${o.vd.toExponential(1)} m/s`, ''],
          ['P', fmtP(o.P), ''],
        ]);
      }
      $('mini-plot').hidden = true;
    } else if (state.lab === 'power') {
      const ac = state.power.mode === 'ac';
      setLaw(
        ac
          ? [
              String.raw`\qP_{\text{avg}} = \tfrac{1}{2} \qI_p \qV_p = \qI_{\text{rms}} \qV_{\text{rms}}`,
              String.raw`\qI_{\text{rms}} = \dfrac{\qI_p}{\sqrt{2}} \qquad \qV_p = \sqrt{2}\,\qV_{\text{rms}}`,
            ]
          : [String.raw`\qP = \qI\qV = \qI^2 \qR = \dfrac{\qV^2}{\qR}`],
      );
      const p = computed.power;
      if (p && ac) {
        live.innerHTML = [
          kv(tex(String.raw`\qV_{\text{rms}}`), qv('qV', fmtV(state.power.Vrms))),
          kv(tex(String.raw`\qV_p = \sqrt{2}\,\qV_{\text{rms}}`), qv('qV', fmtV(p.Vp))),
          kv(tex(String.raw`\qI_p = \qV_p/\qR`), qv('qI', fmtI(p.Ip))),
          kv(tex(String.raw`\qI_{\text{rms}} = \qI_p/\sqrt{2}`), qv('qI', fmtI(p.Irms))),
          kv(tex(String.raw`\qV(t)`), qv('qV', fmtV(p.V))),
          kv(tex(String.raw`\qI(t)`), qv('qI', fmtI(p.I))),
          kv(tex(String.raw`\qP(t) = \qI(t)\,\qV(t)`), qv('qP', fmtP(p.Pinst))),
          kv(tex(String.raw`\qP_{\text{avg}}`), qv('qP', fmtP(p.Pavg))),
        ].join('');
        readout.innerHTML = cells([
          ['V peak', fmtV(p.Vp), 'qV'],
          ['I rms', fmtI(p.Irms), 'qI'],
          ['P avg', fmtP(p.Pavg), 'qP'],
          ['P(t) now', fmtP(p.Pinst), 'qP'],
        ]);
        const plot = $('mini-plot');
        plot.hidden = false;
        drawAC(plot, state.power, computed.t || 0);
      } else if (p) {
        live.innerHTML = [
          kv(tex(String.raw`\qV`), qv('qV', fmtV(p.V))),
          kv(tex(String.raw`\qR`), qv('qR', fmtR(state.power.R))),
          kv(tex(String.raw`\qI = \qV/\qR`), qv('qI', fmtI(p.I))),
          kv(tex(String.raw`\qP = \qI\qV`), qv('qP', fmtP(p.P_IV))),
          kv(tex(String.raw`\qP = \qI^2\qR`), qv('qP', fmtP(p.P_I2R))),
          kv(tex(String.raw`\qP = \qV^2/\qR`), qv('qP', fmtP(p.P_V2R))),
        ].join('');
        readout.innerHTML = cells([
          ['Voltage', fmtV(p.V), 'qV'],
          ['Current', fmtI(p.I), 'qI'],
          ['Resistance', fmtR(state.power.R), 'qR'],
          ['Power', fmtP(p.P), 'qP'],
        ]);
        $('mini-plot').hidden = true;
      }
    }
  }

  fillScenarios('gauss');

  return { update, setLabChrome };
}

function qv(cls, v) {
  return `<span class="${cls}">${v}</span>`;
}

function kv(k, v) {
  return `<div class="row"><span class="k">${k}</span><span class="v">${v}</span></div>`;
}

function cells(items) {
  return items
    .map(
      ([label, value, cls]) =>
        `<div class="cell"><div class="label">${label}</div><div class="value ${cls || ''}">${value}</div></div>`,
    )
    .join('');
}

export { sciHTML };
