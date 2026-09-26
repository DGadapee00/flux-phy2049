import * as THREE from 'three';
import { CSS2DObject } from 'three/addons/renderers/CSS2DRenderer.js';
import { defineLab } from './define.js';
import { Arrow, M, Q, fatLine, updateFatLine, disposeTree } from '../scene/manim.js';
import { acState, vOfT, iOfT } from '../physics/ac.js';
import { kv, cells, qv, tex, eq } from '../ui/shared.js';
import { fmtV, fmtI, fmtR, fmtL, fmtC, fmtHz, fmtP } from '../ui/format.js';

const SCENARIOS = [
  { id: 'rlc', name: 'Series RLC — below resonance', hasL: true, hasC: true, R: 15, L: 0.08, C: 4e-5, f: 60, Vrms: 120 },
  { id: 'res', name: 'Series RLC — at resonance', hasL: true, hasC: true, R: 15, L: 0.08, C: 4e-5, f: 0, Vrms: 120 },
  { id: 'above', name: 'Series RLC — above resonance', hasL: true, hasC: true, R: 15, L: 0.08, C: 4e-5, f: 160, Vrms: 120 },
  { id: 'rc', name: 'Series RC', hasL: false, hasC: true, R: 100, L: 0.08, C: 2.5e-5, f: 60, Vrms: 120 },
  { id: 'rl', name: 'Series RL', hasL: true, hasC: false, R: 40, L: 0.12, C: 4e-5, f: 60, Vrms: 120 },
  { id: 'r', name: 'Resistor only', hasL: false, hasC: false, R: 80, L: 0.08, C: 4e-5, f: 60, Vrms: 120 },
];

/** Layout in scene units: circuit upper left, phasor diagram right. */
const CX0 = -4.4;
const CX1 = -0.2;
const CY0 = 0.2;
const CY1 = 2.6;
const PX = 2.4;
const PY = 0.4;
const RD = 2.3;

function withResonance(sc) {
  const s = { ...sc };
  if (sc.hasL && sc.hasC && sc.f === 0) s.f = 1 / (2 * Math.PI * Math.sqrt(sc.L * sc.C));
  return s;
}

function label(html, x, y, cls = 'circuit-label') {
  const el = document.createElement('div');
  el.className = cls;
  el.innerHTML = html;
  const o = new CSS2DObject(el);
  o.position.set(x, y, 0.02);
  return o;
}

function setHTML(obj, html) {
  if (obj.userData.html !== html) {
    obj.userData.html = html;
    obj.element.innerHTML = html;
  }
}

/** Series circuit along the top wire: source on the left side, R, L, C left to right. */
function buildCircuit(group, a) {
  const y = CY1;
  const slots = [
    { kind: 'R', x0: -3.6, x1: -2.8 },
    { kind: 'L', x0: -2.3, x1: -1.5, on: a.hasL },
    { kind: 'C', x0: -1.0, x1: -0.7, on: a.hasC },
  ];
  const wire = { color: M.white, width: 2.5 };
  let x = CX0;
  for (const s of slots) {
    const on = s.kind === 'R' || s.on;
    group.add(fatLine([x, y, 0, on ? s.x0 : s.x1, y, 0], wire));
    if (s.kind === 'R') {
      const pts = [s.x0, y, 0];
      for (let k = 0; k < 6; k++) pts.push(s.x0 + ((k + 0.5) / 6) * (s.x1 - s.x0), y + (k % 2 ? -0.16 : 0.16), 0);
      pts.push(s.x1, y, 0);
      group.add(fatLine(pts, { color: M.green, width: 3 }));
    } else if (s.kind === 'L' && on) {
      const pts = [];
      const loops = 4;
      const b = 0.13;
      const aStep = (s.x1 - s.x0) / (2 * Math.PI * loops);
      for (let i = 0; i <= 120; i++) {
        const t = (i / 120) * 2 * Math.PI * loops;
        pts.push(s.x0 + aStep * t - b * Math.sin(t) * 0.6, y + b - b * Math.cos(t), 0);
      }
      group.add(fatLine(pts, { color: M.teal, width: 3 }));
    } else if (s.kind === 'C' && on) {
      group.add(fatLine([s.x0, y - 0.3, 0, s.x0, y + 0.3, 0], { color: Q.C, width: 4 }));
      group.add(fatLine([s.x1, y - 0.3, 0, s.x1, y + 0.3, 0], { color: Q.C, width: 4 }));
    }
    x = s.x1;
  }
  group.add(fatLine([x, y, 0, CX1, y, 0, CX1, CY0, 0, CX0, CY0, 0, CX0, (CY0 + CY1) / 2 - 0.42, 0], wire));
  group.add(fatLine([CX0, (CY0 + CY1) / 2 + 0.42, 0, CX0, CY1, 0], wire));
  // AC source: circle with a sine wave.
  const cy = (CY0 + CY1) / 2;
  const ring = [];
  for (let i = 0; i <= 64; i++) ring.push(CX0 + 0.42 * Math.cos((i / 64) * 2 * Math.PI), cy + 0.42 * Math.sin((i / 64) * 2 * Math.PI), 0);
  group.add(fatLine(ring, { color: M.blue, width: 3 }));
  const sine = [];
  for (let i = 0; i <= 32; i++) {
    const t = i / 32;
    sine.push(CX0 - 0.26 + 0.52 * t, cy + 0.14 * Math.sin(t * 2 * Math.PI), 0);
  }
  group.add(fatLine(sine, { color: M.blue, width: 2.5 }));
}

export default defineLab({
  id: 'ac',
  exam: 'e5',
  title: 'AC',
  hint: String.raw`Tune $f$ through resonance — $I$ peaks when $X_L = X_C$`,
  live: true,
  orbit: false,
  camera: { pos: new THREE.Vector3(-0.4, 0.9, 16.5), target: new THREE.Vector3(-0.4, 0.9, 0) },
  keys: { r: 'reset', R: 'reset' },
  scenarios: SCENARIOS,
  defaultState() {
    const s = withResonance(SCENARIOS[0]);
    return { scenarioId: s.id, hasL: s.hasL, hasC: s.hasC, R: s.R, L: s.L, C: s.C, f: s.f, Vrms: s.Vrms, anim: { playing: false, i: 0 } };
  },
  applyScenario(id, state) {
    const sc = withResonance(SCENARIOS.find((s) => s.id === id) || SCENARIOS[0]);
    Object.assign(state, { scenarioId: sc.id, hasL: sc.hasL, hasC: sc.hasC, R: sc.R, L: sc.L, C: sc.C, f: sc.f, Vrms: sc.Vrms });
  },
  controls() {
    const slider = (id, text, min, max, step, cls = '') => `
          <label class="field" id="wrap-${id}">
            <span>${text}</span>
            <div class="slider-row">
              <input type="range" id="${id}" min="${min}" max="${max}" step="${step}" />
              <span class="mono val ${cls}" id="${id}-val"></span>
            </div>
          </label>`;
    return `
        <div class="lab-block">
          ${slider('ac-V', 'V_rms', 10, 240, 1, 'qV')}
          ${slider('ac-R', 'R', 1, 200, 1, 'qR')}
          ${slider('ac-L', 'L', 0.01, 0.4, 0.005)}
          ${slider('ac-C', 'C (μF)', 5, 200, 1)}
          ${slider('ac-f', 'Frequency f', 10, 400, 1)}
          <button type="button" class="btn accent" id="btn-ac-res">Tune f to f₀</button>
          <p class="tiny">Phasors turn counterclockwise at ω (slowed to one turn per 2 s). Their vertical shadows are v(t) and i(t) — the plot below. V<sub>R</sub> points along I, V<sub>L</sub> leads I by 90°, V<sub>C</sub> lags by 90°, and laid tip to tail they land exactly on V.</p>
        </div>`;
  },
  bind(api) {
    const $ = (id) => document.getElementById(id);
    const on = (id, key, scale = 1) =>
      $(id).addEventListener('input', (e) => {
        api.slice()[key] = Number(e.target.value) * scale;
        api.bump(false);
      });
    on('ac-V', 'Vrms');
    on('ac-R', 'R');
    on('ac-L', 'L');
    on('ac-C', 'C', 1e-6);
    on('ac-f', 'f');
    $('btn-ac-res').addEventListener('click', () => {
      const s = api.slice();
      if (s.hasL && s.hasC) s.f = 1 / (2 * Math.PI * Math.sqrt(s.L * s.C));
      api.bump(false);
    });
  },
  syncControls(state) {
    const $ = (id) => document.getElementById(id);
    const set = (id, v, text) => {
      if (document.activeElement !== $(id)) $(id).value = v;
      $(`${id}-val`).textContent = text;
    };
    set('ac-V', state.Vrms, fmtV(state.Vrms));
    set('ac-R', state.R, fmtR(state.R).replace('.000', ''));
    set('ac-L', state.L, fmtL(state.L));
    set('ac-C', state.C * 1e6, fmtC(state.C));
    set('ac-f', state.f, fmtHz(state.f));
    $('wrap-ac-L').hidden = !state.hasL;
    $('wrap-ac-C').hidden = !state.hasC;
    $('btn-ac-res').hidden = !(state.hasL && state.hasC);
  },
  init(ctx) {
    const group = new THREE.Group();
    ctx.scene.add(group);
    const circuit = new THREE.Group();
    group.add(circuit);

    const ring = [];
    for (let i = 0; i <= 96; i++) ring.push(PX + Math.cos((i / 96) * 2 * Math.PI), PY + Math.sin((i / 96) * 2 * Math.PI), 0);
    const circle = fatLine(ring, { color: M.blue, width: 1.2, opacity: 0.3 });
    group.add(circle);
    group.add(fatLine([PX - RD - 0.3, PY, 0, PX + RD + 0.3, PY, 0], { color: 0x444444, width: 1.2 }));
    group.add(fatLine([PX, PY - RD - 0.3, 0, PX, PY + RD + 0.3, 0], { color: 0x666666, width: 1.4 }));

    const arrow = (color, shaft) => new Arrow(new THREE.Vector3(1, 0, 0), new THREE.Vector3(PX, PY, 0), 1, color, 0.3, 0.22, shaft);
    const arrows = { V: arrow(M.blue, 0.04), I: arrow(Q.I, 0.04), VR: arrow(M.green, 0.028), VL: arrow(M.teal, 0.028), VC: arrow(Q.C, 0.028) };
    Object.values(arrows).forEach((a) => group.add(a));
    const projV = fatLine([0, 0, 0, 1, 0, 0], { color: M.blue, width: 1.4, opacity: 0.55 });
    const projI = fatLine([0, 0, 0, 1, 0, 0], { color: Q.I, width: 1.4, opacity: 0.55 });
    group.add(projV, projI);

    const labels = {
      V: label(qv('qV', '<i>V</i>'), 0, 0),
      I: label(qv('qI', '<i>I</i>'), 0, 0),
      VR: label('<span style="color:#83C167"><i>V</i><sub>R</sub></span>', 0, 0),
      VL: label('<span style="color:#5CD0B3"><i>V</i><sub>L</sub></span>', 0, 0),
      VC: label('<span style="color:#F0AC5F"><i>V</i><sub>C</sub></span>', 0, 0),
      title: label('<small>phasors · vertical shadow = instantaneous value</small>', PX, PY + RD + 0.75),
      src: label('', CX0 + 1.3, CY0 - 0.55),
      // R and C above the wire, L below it, so the three never run into each other.
      R: label('', -3.2, CY1 + 0.62),
      L: label('', -1.9, CY1 - 0.62),
      C: label('', -0.85, CY1 + 0.62),
    };
    Object.values(labels).forEach((l) => group.add(l));
    group.visible = false;
    return { group, circuit, circle, arrows, projV, projI, labels, key: '' };
  },
  enter(ctx, handle) {
    handle.group.visible = true;
  },
  exit(ctx, handle) {
    handle.group.visible = false;
  },
  recompute(state, computed, ctx) {
    computed.t = ctx.clock.elapsedTime / (2 * state.f);
    computed.ac = acState(state);
    computed.vNow = vOfT(computed.ac, computed.t);
    computed.iNow = iOfT(computed.ac, computed.t);
  },
  syncViews(state, computed, ctx) {
    const h = ctx.handle;
    const a = computed.ac;
    if (!h || !a) return;
    ctx.grid.visible = false;

    const key = `${a.hasL}|${a.hasC}`;
    if (key !== h.key) {
      h.key = key;
      while (h.circuit.children.length) {
        const ch = h.circuit.children[0];
        h.circuit.remove(ch);
        disposeTree(ch);
      }
      buildCircuit(h.circuit, a);
    }
    setHTML(h.labels.src, `${qv('qV', `<i>V</i><sub>rms</sub> = ${fmtV(a.Vrms)}`)}<small>${fmtHz(state.f)}</small>`);
    setHTML(h.labels.R, qv('qR', `<i>R</i> = ${fmtR(state.R).replace('.000', '')}`));
    setHTML(h.labels.L, `<span style="color:#5CD0B3"><i>L</i> = ${fmtL(state.L)}</span>`);
    setHTML(h.labels.C, `<span style="color:#F0AC5F"><i>C</i> = ${fmtC(state.C)}</span>`);
    h.labels.L.visible = a.hasL;
    h.labels.C.visible = a.hasC;

    // Phasor angles: V at ωt, I (and V_R) at ωt − φ, V_L 90° ahead of I, V_C 90° behind.
    const wt = a.omega * (computed.t || 0);
    const thI = wt - a.phi;
    const reach = Math.max(a.Vp, a.VRp + Math.max(a.VLp, a.VCp), 1e-9);
    const k = RD / reach;
    // V and I are labelled past their tips. The V_R → V_L → V_C chain ends exactly on V's tip, so
    // its labels sit beside the middle of each arrow instead, where they cannot land on V's.
    const place = (arr, lab, x0, y0, len, th, on = true, side = 0) => {
      arr.visible = on && len > 1e-3;
      lab.visible = arr.visible;
      if (!arr.visible) return { x: x0, y: y0 };
      const dx = Math.cos(th);
      const dy = Math.sin(th);
      arr.position.set(x0, y0, 0.02);
      arr.setDirection(new THREE.Vector3(dx, dy, 0));
      arr.setLength(len, Math.min(0.3, len * 0.45), 0.22);
      if (side) lab.position.set(x0 + dx * len * 0.5 - dy * 0.32 * side, y0 + dy * len * 0.5 + dx * 0.32 * side, 0.02);
      else lab.position.set(x0 + dx * (len + 0.28), y0 + dy * (len + 0.28), 0.02);
      return { x: x0 + dx * len, y: y0 + dy * len };
    };
    h.circle.scale.set(a.Vp * k, a.Vp * k, 1);
    h.circle.position.set(PX - PX * a.Vp * k, PY - PY * a.Vp * k, 0);
    const vTip = place(h.arrows.V, h.labels.V, PX, PY, a.Vp * k, wt);
    const iLen = 0.75 * RD;
    const iTip = place(h.arrows.I, h.labels.I, PX, PY, iLen, thI);
    const p1 = place(h.arrows.VR, h.labels.VR, PX, PY, a.VRp * k, thI, true, -1);
    const p2 = place(h.arrows.VL, h.labels.VL, p1.x, p1.y, a.VLp * k, thI + Math.PI / 2, a.hasL, -1);
    place(h.arrows.VC, h.labels.VC, p2.x, p2.y, a.VCp * k, thI - Math.PI / 2, a.hasC, 1);
    updateFatLine(h.projV, [vTip.x, vTip.y, 0.01, PX, vTip.y, 0.01]);
    updateFatLine(h.projI, [iTip.x, iTip.y, 0.01, PX, iTip.y, 0.01]);
  },
  law(state, computed) {
    const a = computed.ac;
    const z = String.raw`Z = \sqrt{\qR^2+(X_L-X_C)^2}\qquad \qI_{\text{rms}}=\dfrac{\qV_{\text{rms}}}{Z}`;
    const x = String.raw`X_L=\omega L\qquad X_C=\dfrac{1}{\omega C}`;
    const phi = String.raw`\varphi=\tan^{-1}\dfrac{X_L-X_C}{\qR}`;
    if (a?.hasL && a?.hasC) return [z, x, phi, String.raw`\omega_0 = \dfrac{1}{\sqrt{LC}}\qquad Q=\dfrac{\omega_0 L}{\qR}`];
    return [z, x, phi];
  },
  liveRows(state, computed) {
    const a = computed.ac;
    if (!a) return '';
    const deg = (a.phi * 180) / Math.PI;
    const rows = [
      kv(tex(String.raw`\qV_{\text{rms}}`), qv('qV', fmtV(a.Vrms))),
      kv(tex(String.raw`\qI_{\text{rms}}=\qV_{\text{rms}}/Z`), qv('qI', fmtI(a.Irms))),
      kv(String.raw`$|Z|$`, `${a.Z.toFixed(2)} Ω`),
      kv(String.raw`$\varphi$ ($V$ leads $I$)`, `${deg >= 0 ? '+' : '−'}${Math.abs(deg).toFixed(1)}°`),
      kv(String.raw`$X_L = \omega L$`, a.hasL ? `${a.XL.toFixed(2)} Ω` : '—'),
      kv(String.raw`$X_C = 1/\omega C$`, a.hasC ? `${a.XC.toFixed(2)} Ω` : '—'),
      kv(String.raw`$V_R = IR$ (rms)`, fmtV(a.VR)),
    ];
    if (a.hasL) rows.push(kv(String.raw`$V_L = IX_L$ (rms)`, fmtV(a.VL)));
    if (a.hasC) rows.push(kv(String.raw`$V_C = IX_C$ (rms)`, fmtV(a.VC)));
    rows.push(kv(String.raw`$\sqrt{V_R^2 + (V_L-V_C)^2}$`, String.raw`${fmtV(Math.hypot(a.VR, a.VL - a.VC))} = $V_{\text{rms}}$`));
    if (a.f0 != null) {
      rows.push(kv(String.raw`$f_0 = 1/2\pi\sqrt{LC}$`, fmtHz(a.f0)));
      if (a.Q != null) rows.push(kv(String.raw`$Q = \omega_0 L/R$`, a.Q.toFixed(2)));
    }
    rows.push(kv(String.raw`$P_{\text{avg}} = I_{\text{rms}}V_{\text{rms}}\cos\varphi$`, qv('qP', fmtP(a.Pavg))));
    return rows.join('');
  },
  readout(state, computed) {
    const a = computed.ac;
    if (!a) return '';
    const near = a.f0 != null && Math.abs(state.f - a.f0) / a.f0 < 0.03;
    return cells([
      [String.raw`$I_{\text{rms}}$`, fmtI(a.Irms), 'qI'],
      [String.raw`$|Z|$`, `${a.Z.toFixed(1)} Ω`, near ? 'ok' : ''],
      [String.raw`$\varphi$`, `${((a.phi * 180) / Math.PI).toFixed(0)}°`, Math.abs(a.phi) < 0.05 ? 'ok' : ''],
      [String.raw`$f_0$`, a.f0 == null ? '—' : fmtHz(a.f0), near ? 'ok' : ''],
    ]);
  },
  plot(state, computed) {
    const a = computed.ac;
    return a ? { type: 'vi', omega: a.omega, phi: a.phi, t: computed.t || 0 } : null;
  },
  coach(state, computed) {
    const a = computed.ac;
    if (!a) return { title: 'AC', body: [eq(String.raw`Z = \sqrt{R^2 + (X_L-X_C)^2}`)] };
    const deg = Math.abs((a.phi * 180) / Math.PI).toFixed(0);
    if (a.hasL && a.hasC) {
      if (Math.abs(state.f - a.f0) / a.f0 < 0.04) {
        return {
          title: String.raw`Resonance — $X_L = X_C$, $Z = R$`,
          body: [
            `At $f_0$ = ${a.f0.toFixed(1)} Hz, $V_L$ and $V_C$ are equal and opposite: in the phasor chain they cancel and $V_R$ alone reaches $V$, so $\\varphi = 0$ and $I = V/R$ is as large as it gets.`,
            `Each of $V_L$ and $V_C$ is still $Q$ = ${a.Q?.toFixed(1)} times $V$ — the parts can see more voltage than the source does.`,
          ],
        };
      }
      if (a.phi > 0) {
        return {
          title: 'Above resonance — inductive',
          body: `$X_L > X_C$, so the teal $V_L$ outruns the purple $V_C$ and the chain swings $V$ ahead of $I$ by $\\varphi$ = ${deg}°. Lower $f$ toward $f_0$ = ${a.f0.toFixed(1)} Hz and watch $I$ grow.`,
        };
      }
      return {
        title: 'Below resonance — capacitive',
        body: `$X_C > X_L$, so $V_C$ wins and $V$ lags $I$ by ${deg}° — the current leads. Raise $f$ toward $f_0$ = ${a.f0.toFixed(1)} Hz: $X_C = 1/\\omega C$ falls, $X_L = \\omega L$ rises, and they meet there.`,
      };
    }
    if (a.hasC) {
      return {
        title: 'RC — current leads voltage',
        body: [
          `$V_R$ (along $I$) and $V_C$ (90° behind $I$) form a right triangle whose hypotenuse is $V$, so $V$ lags $I$ by ${deg}°.`,
          String.raw`At high $f$, $X_C \to 0$ and the capacitor acts like a wire; at low $f$, $X_C \to \infty$ and it acts like a gap.`,
        ],
      };
    }
    if (a.hasL) {
      return {
        title: 'RL — voltage leads current',
        body: [
          `$V_L$ is 90° ahead of $I$, so $V$ leads $I$ by ${deg}°.`,
          String.raw`At high $f$, $X_L$ grows and the inductor chokes the current. The average power is still $I_{\text{rms}}V_{\text{rms}}\cos\varphi$ — only the resistor dissipates.`,
        ],
      };
    }
    return {
      title: 'Resistor only — in phase',
      body: String.raw`No reactance, so $Z = R$ and $\varphi = 0$: $V$ and $I$ turn together, and the Ch 42 result $P_{\text{avg}} = I_{\text{rms}}V_{\text{rms}}$ applies unchanged.`,
    };
  },
});
