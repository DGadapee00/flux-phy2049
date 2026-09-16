import * as THREE from 'three';
import { CSS2DObject } from 'three/addons/renderers/CSS2DRenderer.js';
import { defineLab } from './define.js';
import { Arrow, M, fatLine } from '../scene/manim.js';
import { acState, vOfT, iOfT } from '../physics/ac.js';
import { kv, cells, qv, tex } from '../ui/shared.js';
import { fmtV, fmtI, fmtR, fmtL, fmtC, fmtHz, fmtP } from '../ui/format.js';

const SCENARIOS = [
  { id: 'rlc', name: 'Series RLC — off resonance', hasL: true, hasC: true, R: 15, L: 0.08, C: 4e-5, f: 60, Vrms: 120 },
  { id: 'res', name: 'Series RLC — at resonance', hasL: true, hasC: true, R: 15, L: 0.08, C: 4e-5, f: 0, Vrms: 120 },
  { id: 'rc', name: 'Series RC', hasL: false, hasC: true, R: 100, L: 0.08, C: 2.5e-5, f: 60, Vrms: 120 },
  { id: 'rl', name: 'Series RL', hasL: true, hasC: false, R: 40, L: 0.12, C: 4e-5, f: 60, Vrms: 120 },
  { id: 'r', name: 'Resistor only', hasL: false, hasC: false, R: 80, L: 0.08, C: 4e-5, f: 60, Vrms: 120 },
];

function label(html, x, y, cls = 'circuit-label') {
  const el = document.createElement('div');
  el.className = cls;
  el.innerHTML = html;
  const o = new CSS2DObject(el);
  o.position.set(x, y, 0);
  o.userData.el = el;
  return o;
}

function applyRes(sc) {
  const s = { ...sc };
  if (sc.id === 'res' || (sc.hasL && sc.hasC && sc.f === 0)) {
    s.f = 1 / (2 * Math.PI * Math.sqrt(sc.L * sc.C));
  }
  return s;
}

export default defineLab({
  id: 'ac',
  exam: 'e5',
  title: 'AC',
  hint: 'Tune f through resonance — I peaks when X_L = X_C',
  live: true,
  orbit: false,
  camera: { pos: new THREE.Vector3(0.4, 0.15, 13), target: new THREE.Vector3(0.4, 0.15, 0) },
  keys: { r: 'reset', R: 'reset' },
  scenarios: SCENARIOS,
  defaultState() {
    const s = applyRes(SCENARIOS[0]);
    return {
      scenarioId: s.id,
      hasL: s.hasL,
      hasC: s.hasC,
      R: s.R,
      L: s.L,
      C: s.C,
      f: s.f,
      Vrms: s.Vrms,
      anim: { playing: false, i: 0 },
    };
  },
  applyScenario(id, state) {
    const raw = SCENARIOS.find((s) => s.id === id) || SCENARIOS[0];
    const sc = applyRes(raw);
    Object.assign(state, {
      scenarioId: sc.id,
      hasL: sc.hasL,
      hasC: sc.hasC,
      R: sc.R,
      L: sc.L,
      C: sc.C,
      f: sc.f,
      Vrms: sc.Vrms,
    });
  },
  controls() {
    return `
        <div class="lab-block">
          <label class="field">
            <span>V_rms</span>
            <div class="slider-row">
              <input type="range" id="ac-V" min="10" max="240" step="1" value="120" />
              <span class="mono val qV" id="ac-V-val">120 V</span>
            </div>
          </label>
          <label class="field">
            <span>R</span>
            <div class="slider-row">
              <input type="range" id="ac-R" min="1" max="200" step="1" value="15" />
              <span class="mono val qR" id="ac-R-val">15 Ω</span>
            </div>
          </label>
          <label class="field" id="wrap-ac-L">
            <span>L</span>
            <div class="slider-row">
              <input type="range" id="ac-L" min="0.01" max="0.4" step="0.005" value="0.08" />
              <span class="mono val" id="ac-L-val">80 mH</span>
            </div>
          </label>
          <label class="field" id="wrap-ac-C">
            <span>C</span>
            <div class="slider-row">
              <input type="range" id="ac-C" min="5" max="200" step="1" value="40" />
              <span class="mono val" id="ac-C-val">40 μF</span>
            </div>
          </label>
          <label class="field">
            <span>Frequency f</span>
            <div class="slider-row">
              <input type="range" id="ac-f" min="10" max="400" step="1" value="60" />
              <span class="mono val" id="ac-f-val">60 Hz</span>
            </div>
          </label>
          <button type="button" class="btn accent" id="btn-ac-res" hidden>Tune f to f₀</button>
          <p class="tiny">Phasors: V blue (reference), I yellow. V<sub>R</sub> along I, V<sub>L</sub> leads I by 90°, V<sub>C</sub> lags I by 90°. Slow-motion: one cycle takes 2 s.</p>
        </div>`;
  },
  bind(api) {
    const $ = (id) => document.getElementById(id);
    $('ac-V').addEventListener('input', (e) => {
      api.slice().Vrms = Number(e.target.value);
      api.bump(false);
    });
    $('ac-R').addEventListener('input', (e) => {
      api.slice().R = Number(e.target.value);
      api.bump(false);
    });
    $('ac-L').addEventListener('input', (e) => {
      api.slice().L = Number(e.target.value);
      api.bump(false);
    });
    $('ac-C').addEventListener('input', (e) => {
      api.slice().C = Number(e.target.value) * 1e-6;
      api.bump(false);
    });
    $('ac-f').addEventListener('input', (e) => {
      api.slice().f = Number(e.target.value);
      api.bump(false);
    });
    $('btn-ac-res').addEventListener('click', () => {
      const s = api.slice();
      if (s.hasL && s.hasC && s.L > 0 && s.C > 0) s.f = 1 / (2 * Math.PI * Math.sqrt(s.L * s.C));
      api.bump(false);
    });
  },
  syncControls(state) {
    const $ = (id) => document.getElementById(id);
    $('ac-V').value = state.Vrms;
    $('ac-V-val').textContent = fmtV(state.Vrms);
    $('ac-R').value = state.R;
    $('ac-R-val').textContent = fmtR(state.R);
    $('ac-L').value = state.L;
    $('ac-L-val').textContent = fmtL(state.L);
    $('ac-C').value = state.C * 1e6;
    $('ac-C-val').textContent = fmtC(state.C);
    $('ac-f').value = state.f;
    $('ac-f-val').textContent = fmtHz(state.f);
    $('wrap-ac-L').hidden = !state.hasL;
    $('wrap-ac-C').hidden = !state.hasC;
    $('btn-ac-res').hidden = !(state.hasL && state.hasC);
  },
  init(ctx) {
    const group = new THREE.Group();
    ctx.scene.add(group);

    const yTop = 1.55;
    const yBot = -0.85;
    const x0 = -4.3;
    const x1 = 0.4;
    group.add(fatLine([x0, yBot, 0, x0, yTop, 0, x1, yTop, 0, x1, yBot, 0, x0, yBot, 0], { color: M.white, width: 2 }));

    const src = new THREE.Group();
    src.add(fatLine([x0 - 0.02, yBot + 0.55, 0, x0 - 0.02, yBot + 1.15, 0], { color: M.blue, width: 5 }));
    src.add(fatLine([x0 + 0.12, yBot + 0.7, 0, x0 + 0.12, yBot + 1.0, 0], { color: M.blue, width: 3 }));
    src.add(label(qv('qV', 'V'), x0 - 0.55, yBot + 0.85));
    group.add(src);

    const rBox = new THREE.Mesh(
      new THREE.BoxGeometry(0.9, 0.35, 0.08),
      new THREE.MeshBasicMaterial({ color: M.green, toneMapped: false }),
    );
    rBox.position.set(-2.6, yTop, 0);
    group.add(rBox);
    const rLab = label(qv('qR', 'R'), -2.6, yTop + 0.42);
    group.add(rLab);

    const coil = new THREE.Group();
    for (let i = 0; i < 5; i++) {
      const c = new THREE.Mesh(
        new THREE.TorusGeometry(0.16, 0.035, 8, 16),
        new THREE.MeshBasicMaterial({ color: 0x5cd0b3, toneMapped: false }),
      );
      c.rotation.y = Math.PI / 2;
      c.position.set(-1.15 + i * 0.18, yTop, 0);
      coil.add(c);
    }
    group.add(coil);
    const lLab = label('L', -0.8, yTop + 0.45);
    group.add(lLab);

    const cap = new THREE.Group();
    cap.add(fatLine([-0.15, yTop - 0.28, 0, -0.15, yTop + 0.28, 0], { color: M.gold, width: 5 }));
    cap.add(fatLine([0.05, yTop - 0.28, 0, 0.05, yTop + 0.28, 0], { color: M.gold, width: 5 }));
    cap.position.x = -0.05;
    group.add(cap);
    const cLab = label('C', 0.05, yTop + 0.45);
    group.add(cLab);

    const ox = 2.55;
    const oy = 0.15;
    const Varr = new Arrow(new THREE.Vector3(1, 0, 0), new THREE.Vector3(ox, oy, 0), 2.2, M.blue, 0.28, 0.2, 0.03);
    const Iarr = new Arrow(new THREE.Vector3(1, 0, 0), new THREE.Vector3(ox, oy, 0), 2.2, M.yellow, 0.28, 0.2, 0.03);
    const VRarr = new Arrow(new THREE.Vector3(1, 0, 0), new THREE.Vector3(ox, oy, 0), 1, M.green, 0.22, 0.16, 0.022);
    const VLarr = new Arrow(new THREE.Vector3(1, 0, 0), new THREE.Vector3(ox, oy, 0), 1, 0x5cd0b3, 0.22, 0.16, 0.022);
    const VCarr = new Arrow(new THREE.Vector3(1, 0, 0), new THREE.Vector3(ox, oy, 0), 1, M.gold, 0.22, 0.16, 0.022);
    group.add(Varr, Iarr, VRarr, VLarr, VCarr);
    const axes = fatLine([ox - 0.2, oy, 0, ox + 2.5, oy, 0, ox, oy - 2.2, 0, ox, oy + 2.2, 0], { color: 0x444444, width: 1.2 });
    group.add(axes);
    const vLab = label(qv('qV', 'V'), ox + 2.35, oy + 0.22);
    const iLab = label(qv('qI', 'I'), ox + 1.6, oy - 0.35);
    group.add(vLab, iLab);
    const title = label('phasors', ox + 0.9, oy + 2.35);
    group.add(title);

    group.visible = false;
    return { group, coil, cap, lLab, cLab, Varr, Iarr, VRarr, VLarr, VCarr, iLab, ox, oy };
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
    h.coil.visible = a.hasL;
    h.lLab.visible = a.hasL;
    h.cap.visible = a.hasC;
    h.cLab.visible = a.hasC;
    ctx.grid.visible = false;

    const ox = h.ox;
    const oy = h.oy;
    const vScale = 2.15 / Math.max(a.Vp, 1e-9);
    const set = (arr, vx, vy, on) => {
      arr.visible = on && Math.hypot(vx, vy) > 1e-6;
      if (!arr.visible) return;
      const L = Math.hypot(vx, vy);
      arr.position.set(ox, oy, 0.02);
      arr.setDirection(new THREE.Vector3(vx, vy, 0));
      arr.setLength(L, 0.24, 0.18);
    };
    set(h.Varr, a.Vp * vScale, 0, true);
    const c = Math.cos(-a.phi);
    const s = Math.sin(-a.phi);
    const iLen = 2.15;
    set(h.Iarr, iLen * c, iLen * s, true);
    set(h.VRarr, a.VRp * vScale * c, a.VRp * vScale * s, true);
    set(h.VLarr, a.VLp * vScale * -s, a.VLp * vScale * c, a.hasL);
    set(h.VCarr, a.VCp * vScale * s, a.VCp * vScale * -c, a.hasC);
    h.iLab.position.set(ox + iLen * c * 0.72, oy + iLen * s * 0.72 - 0.28, 0);
  },
  law(state, computed) {
    const a = computed.ac;
    const z = String.raw`\qZ = \sqrt{\qR^2+(X_L-X_C)^2}\qquad X_L=\omega L\qquad X_C=1/\omega C`;
    if (a?.hasL && a?.hasC) {
      return [z, String.raw`\omega_0 = 1/\sqrt{LC}\qquad \varphi=\tan^{-1}\dfrac{X_L-X_C}{\qR}`];
    }
    return [z, String.raw`\varphi=\tan^{-1}\dfrac{X_L-X_C}{\qR}\qquad \qI=\qV/\qZ`];
  },
  liveRows(state, computed) {
    const a = computed.ac;
    if (!a) return '';
    const deg = (a.phi * 180) / Math.PI;
    const rows = [
      kv(tex(String.raw`\qV_{\text{rms}}`), qv('qV', fmtV(a.Vrms))),
      kv(tex(String.raw`\qI_{\text{rms}}=\qV/\qZ`), qv('qI', fmtI(a.Irms))),
      kv('|Z|', `${a.Z.toFixed(2)} Ω`),
      kv('φ (V leads I)', `${deg >= 0 ? '+' : '−'}${Math.abs(deg).toFixed(1)}°`),
      kv('X<sub>L</sub> = ωL', a.hasL ? `${a.XL.toFixed(2)} Ω` : '—'),
      kv('X<sub>C</sub> = 1/ωC', a.hasC ? `${a.XC.toFixed(2)} Ω` : '—'),
      kv('V<sub>R</sub> = I R', qv('qV', fmtV(a.VR))),
    ];
    if (a.hasL) rows.push(kv('V<sub>L</sub> = I X<sub>L</sub>', fmtV(a.VL)));
    if (a.hasC) rows.push(kv('V<sub>C</sub> = I X<sub>C</sub>', fmtV(a.VC)));
    if (a.f0 != null) {
      rows.push(kv('f₀ = 1/(2π√(LC))', fmtHz(a.f0)));
      rows.push(kv('Q = ω₀L/R', a.Q.toFixed(2)));
    }
    rows.push(kv('P<sub>avg</sub> = I V cosφ', qv('qP', fmtP(a.Pavg))));
    rows.push(kv('V(t), I(t) now', `${qv('qV', fmtV(computed.vNow))} , ${qv('qI', fmtI(computed.iNow))}`));
    return rows.join('');
  },
  readout(state, computed) {
    const a = computed.ac;
    if (!a) return '';
    const near = a.f0 != null && Math.abs(state.f - a.f0) / a.f0 < 0.03;
    return cells([
      ['I rms', fmtI(a.Irms), 'qI'],
      ['|Z|', `${a.Z.toFixed(1)} Ω`, near ? 'ok' : ''],
      ['φ', `${((a.phi * 180) / Math.PI).toFixed(0)}°`, Math.abs(a.phi) < 0.05 ? 'ok' : ''],
      ['f₀', a.f0 == null ? '—' : fmtHz(a.f0), near ? 'ok' : ''],
    ]);
  },
  plot(state, computed) {
    const a = computed.ac;
    if (!a) return null;
    return { type: 'vi', omega: a.omega, phi: a.phi, t: computed.t || 0 };
  },
  coach(state, computed) {
    const a = computed.ac;
    if (!a) return { title: 'AC', body: '' };
    if (a.hasL && a.hasC) {
      const near = Math.abs(state.f - a.f0) / a.f0 < 0.04;
      if (near) {
        return {
          title: 'Resonance — X_L = X_C, Z = R',
          body: `ω₀ = 1/√(LC) so f₀ = ${a.f0.toFixed(1)} Hz. The inductor and capacitor voltages cancel (they are 180° apart), current is V/R, and φ = 0. Q = ω₀L/R = ${a.Q.toFixed(1)} says how sharp the peak is.`,
        };
      }
      if (a.phi > 0) {
        return {
          title: 'Above resonance — inductive',
          body: `X_L > X_C so the net reactance is inductive. Voltage leads current by φ = ${((a.phi * 180) / Math.PI).toFixed(0)}°. Turn f down toward f₀ = ${a.f0.toFixed(1)} Hz and watch I climb.`,
        };
      }
      return {
        title: 'Below resonance — capacitive',
        body: `X_C > X_L, φ < 0: current leads voltage. Same as a capacitor dominating. f₀ = ${a.f0.toFixed(1)} Hz is where they cancel.`,
      };
    }
    if (a.hasC && !a.hasL) {
      return {
        title: 'RC — current leads',
        body: 'X_C = 1/ωC. High frequency: capacitor looks like a wire (X_C → 0). Low frequency: it looks open. φ = tan⁻¹(−X_C/R) < 0, so I leads V. V_R and V_C are 90° apart; they add as a phasor hypotenuse equal to V.',
      };
    }
    if (a.hasL && !a.hasC) {
      return {
        title: 'RL — voltage leads',
        body: 'X_L = ωL. High frequency: inductor looks open. φ = tan⁻¹(X_L/R) > 0, V leads I. Instantaneous P = I(t)V(t) still averages to I_rms V_rms cosφ.',
      };
    }
    return {
      title: 'Resistor — φ = 0',
      body: 'No reactance, Z = R, I = V/R in phase with V. This is the Ch 42 AC power case: P_avg = I_rms V_rms.',
    };
  },
});
