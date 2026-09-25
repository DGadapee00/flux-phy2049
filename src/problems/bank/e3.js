/** Exam 3 · Ch 38–39 (potential), 40 (capacitors), 41 (current, resistance), 42 (power). */
import { problem, kase, range, choice, SIGN, num, mc, sym, K, EPS0, QE, ME, MP, POSNEG, charge, layout, texNum, qty, pq } from '../kit.js';
import { DIELECTRICS } from '../../physics/capacitor.js';
import { applyScenario } from '../../data/scenarios.js';
import { MATERIALS } from '../../physics/circuit.js';
import { paschen, paschenMin, strengthVolts, sphereCapacitance, sparkEnergy, chargeForPotential, P_ATM, GASES } from '../../physics/breakdown.js';

const E3 = { exam: 'e3' };
const kap = (id) => DIELECTRICS.find((d) => d.id === id).kappa;
const mat = (id) => MATERIALS.find((m) => m.id === id);
const MATS = choice(...['copper', 'aluminum', 'tungsten', 'iron', 'nichrome'].map((id) => [id, mat(id).name.toLowerCase()]));
const DIEL = choice(...['teflon', 'paper', 'nylon', 'rubber'].map((id) => [id, `${DIELECTRICS.find((d) => d.id === id).name.toLowerCase()} (κ = ${kap(id)})`]));

/** Potential lab: the problem's charges, its point B (the probe) and its point A. */
function potSetup(list, probe, pathA) {
  return (s, $) => layout(s, { charges: list($), probe: probe($), pathA: pathA ? pathA($) : null });
}

/**
 * A graph of V against x for a problem to read, as SVG markup: straight pieces through the points
 * (xs[i], Vs[i]), each labelled A, B, C… above its middle, on a grid ruled every metre and volt.
 */
function vGraphSVG(xs, Vs) {
  const W = 340;
  const H = 210;
  const L = 44;
  const Rt = W - 16;
  const T = 30; // room above the top tick for the axis title
  const B = H - 34;
  const xMax = xs[xs.length - 1];
  const vLo = Math.min(0, ...Vs) - 1;
  const vHi = Math.max(0, ...Vs) + 1;
  const X = (x) => L + ((Rt - L) * x) / xMax;
  const Y = (v) => B - ((B - T) * (v - vLo)) / (vHi - vLo);
  const out = [];
  for (let x = 0; x <= xMax; x++) out.push(`<line x1="${X(x)}" y1="${T}" x2="${X(x)}" y2="${B}" stroke="#2a2d33" />`);
  for (let v = Math.ceil(vLo); v <= vHi; v++) {
    out.push(`<line x1="${L}" y1="${Y(v)}" x2="${Rt}" y2="${Y(v)}" stroke="${v === 0 ? '#77716c' : '#2a2d33'}" />`);
    out.push(`<text x="${L - 6}" y="${Y(v) + 4}" text-anchor="end" font-size="11" fill="#aaa39e">${v}</text>`);
  }
  for (let x = 0; x <= xMax; x++) out.push(`<text x="${X(x)}" y="${B + 15}" text-anchor="middle" font-size="11" fill="#aaa39e">${x}</text>`);
  out.push(`<line x1="${L}" y1="${T}" x2="${L}" y2="${B}" stroke="#aaa39e" />`);
  out.push(`<text x="${L - 30}" y="${T - 14}" font-size="12" fill="#ece6e2">V (V)</text>`);
  out.push(`<text x="${Rt}" y="${B + 29}" text-anchor="end" font-size="12" fill="#ece6e2">x (m)</text>`);
  out.push(`<polyline points="${xs.map((x, i) => `${X(x)},${Y(Vs[i])}`).join(' ')}" fill="none" stroke="#58c4dd" stroke-width="2.5" />`);
  for (let i = 0; i < xs.length - 1; i++) {
    const xm = X((xs[i] + xs[i + 1]) / 2);
    const ym = Math.min(Y(Vs[i]), Y(Vs[i + 1])) - 8;
    out.push(`<text x="${xm}" y="${Math.max(T + 10, ym)}" text-anchor="middle" font-size="13" font-weight="600" fill="#f4d345">${'ABCDEF'[i]}</text>`);
  }
  return `<svg viewBox="0 0 ${W} ${H}" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Graph of V against x">${out.join('')}</svg>`;
}

/**
 * The current in an ac circuit against time, as SVG markup: a few cycles of a sine wave, with the
 * axis ruled at the peaks so the peak (not the rms value) is what a problem reads off it.
 */
function acGraphSVG(Ip) {
  const W = 340;
  const H = 170;
  const L = 44;
  const Rt = W - 16;
  const T = 18;
  const B = H - 22;
  const mid = (T + B) / 2;
  const amp = (B - T) / 2 - 6;
  const out = [];
  for (const [v, y] of [[Ip, mid - amp], [0, mid], [-Ip, mid + amp]]) {
    out.push(`<line x1="${L}" y1="${y}" x2="${Rt}" y2="${y}" stroke="${v === 0 ? '#77716c' : '#2a2d33'}"${v === 0 ? '' : ' stroke-dasharray="4 4"'} />`);
    out.push(`<text x="${L - 6}" y="${y + 4}" text-anchor="end" font-size="11" fill="#aaa39e">${v > 0 ? '+' : v < 0 ? '−' : ''}${Math.abs(v)}</text>`);
  }
  out.push(`<line x1="${L}" y1="${T - 6}" x2="${L}" y2="${B + 6}" stroke="#aaa39e" />`);
  out.push(`<text x="${L - 30}" y="${T - 6}" font-size="12" fill="#ece6e2">I (A)</text>`);
  out.push(`<text x="${Rt}" y="${mid - 6}" text-anchor="end" font-size="12" fill="#ece6e2">t</text>`);
  const end = Rt - 16; // the wave stops short of the t label
  const pts = [];
  for (let i = 0; i <= 280; i++) {
    const f = i / 280;
    pts.push(`${(L + (end - L) * f).toFixed(1)},${(mid - amp * Math.sin(2 * Math.PI * 3.5 * f)).toFixed(1)}`);
  }
  out.push(`<polyline points="${pts.join(' ')}" fill="none" stroke="#f4d345" stroke-width="2.5" />`);
  return `<svg viewBox="0 0 ${W} ${H}" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Graph of current against time">${out.join('')}</svg>`;
}

const PIECES = 'ABCDE';
const E_SIGNS = [[1, 'Positive (points toward +x)'], [0, 'Zero'], [-1, 'Negative (points toward −x)']];

export default [
  // ================================================================= 38
  problem({
    ...E3, id: 'e3.38.point-V', ch: '38', lab: 'potential', title: 'Potential of a point charge', kind: 'numeric', topics: ['potential'],
    vars: { q: range(0.5, 5, 0.1, 'μC', 1e-6), s: SIGN, r: range(0.1, 3, 0.05, 'm') },
    derive: ($) => ({ V: (K * $.s * $.q) / $.r }),
    text: (T) => `Find the electric potential ${T.r} m from a ${T.s} ${T.q} μC point charge (V = 0 at infinity).`,
    parts: [num('V', ($) => $.V, 'V')],
    hints: [String.raw`$V$ is a scalar and keeps the sign of $q$.`],
    steps: ($, f) => [String.raw`$V = \dfrac{kq}{r} = \dfrac{${pq(K, 'N·m²/C²')}${pq($.s * $.q, 'C')}}{${qty($.r, 'm')}} = ${texNum($.V)}\ \text{V}$`],
    sim: {
      scenario: 'v-plus',
      setup: potSetup(($) => [charge($.s * $.q, 0, 0)], ($) => ({ x: $.r, y: 0 })),
      read: (c) => ({ V: c.V }),
    },
    cases: [kase('hand', { q: 1, s: 1, r: 0.5 }, { V: 17975 })],
  }),
  problem({
    ...E3, id: 'e3.38.work-radial', ch: '38', lab: 'potential', title: 'Work done by the field on a test charge', kind: 'numeric', level: 2, topics: ['potential', 'work'],
    vars: { Q: range(0.5, 5, 0.5, 'μC', 1e-6), sQ: SIGN, q0: range(0.5, 5, 0.5, 'μC', 1e-6), s0: SIGN, rA: range(0.2, 2, 0.1, 'm'), rB: range(0.2, 2, 0.1, 'm') },
    derive: ($) => {
      const VA = (K * $.sQ * $.Q) / $.rA;
      const VB = (K * $.sQ * $.Q) / $.rB;
      return { VA, VB, W: -$.s0 * $.q0 * (VB - VA) };
    },
    valid: ($) => Math.abs($.rA - $.rB) > 0.05,
    text: (T) => `A ${T.sQ} ${T.Q} μC charge is fixed at the origin. A ${T.s0} ${T.q0} μC test charge moves from ${T.rA} m to ${T.rB} m from it. How much work does the electric field do?`,
    parts: [num('W', ($) => $.W, 'J', { label: String.raw`$W_{\text{field}}$ (signed)` }), mc('ke', [[1, 'Its kinetic energy increases'], [-1, 'Its kinetic energy decreases']], ($) => Math.sign($.W), { label: 'If only the field acts…' })],
    hints: [String.raw`$W_{\text{field}} = -q\,\Delta V = -q(V_B - V_A)$`],
    steps: ($, f) => [
      String.raw`$V_A = \dfrac{kQ}{r_A} = \dfrac{${pq(K, 'N·m²/C²')}${pq($.sQ * $.Q, 'C')}}{${qty($.rA, 'm')}} = ${texNum($.VA)}\ \text{V}$`,
      String.raw`$V_B = \dfrac{kQ}{r_B} = \dfrac{${pq(K, 'N·m²/C²')}${pq($.sQ * $.Q, 'C')}}{${qty($.rB, 'm')}} = ${texNum($.VB)}\ \text{V}$`,
      String.raw`$W = -q(V_B - V_A) = -${pq($.s0 * $.q0, 'C')}\left[${pq($.VB, 'V')} - ${pq($.VA, 'V')}\right] = ${texNum($.W)}\ \text{J}$`,
    ],
    sim: {
      scenario: 'v-plus',
      setup(s, $) {
        const note = potSetup(() => [charge($.sQ * $.Q, 0, 0)], () => ({ x: $.rB, y: 0 }), () => ({ x: $.rA, y: 0 }))(s, $);
        s.qTest = $.s0 * $.q0;
        return note;
      },
      read: (c) => ({ W: c.Wfield }),
    },
    cases: [kase('hand', { Q: 1, sQ: 1, q0: 1, s0: 1, rA: 1, rB: 0.5 }, { W: -8.988e-3, ke: -1 })],
  }),
  problem({
    ...E3, id: 'e3.38.uniform-dV', ch: '38', lab: 'potential', src: 'Class Activity 3 #5', title: 'ΔV in a uniform field', kind: 'numeric', topics: ['potential'],
    vars: { E: range(100, 5000, 100, 'N/C'), d: range(1, 50, 1, 'cm', 1e-2), dir: choice([1, 'along'], [-1, 'against']), q: range(5, 500, 5, 'μC', 1e-6), s: SIGN },
    derive: ($) => {
      const dV = -$.E * $.dir * $.d;
      const dU = $.s * $.q * dV;
      return { dV, W: -dU, dU };
    },
    text: (T) => String.raw`In a uniform ${T.E} N/C field, a ${T.s} ${T.q} μC charge moves ${T.d} cm ${T.dir} the field direction. Find $\Delta V = V_B - V_A$, the work done by the field, and the change in the charge's potential energy. Does it gain or lose potential energy?`,
    parts: [
      num('dV', ($) => $.dV, 'V', { label: 'ΔV' }),
      num('W', ($) => $.W, 'J', { label: String.raw`$W_{\text{field}}$` }),
      num('dU', ($) => $.dU, 'J', { label: String.raw`$\Delta U$` }),
      mc('pe', [['gain', 'It gains potential energy'], ['lose', 'It loses potential energy']], ($) => ($.dU > 0 ? 'gain' : 'lose'), { label: 'Does it gain or lose potential energy?' }),
    ],
    hints: [String.raw`$\Delta V = -\vec{E}\cdot\Delta\vec{r}$ — moving along $\vec{E}$ lowers the potential.`, String.raw`$\Delta U = q\,\Delta V$, and the field's work is its negative: $W = -\Delta U$.`],
    steps: ($, f) => [
      String.raw`$\Delta V = -Ed\cos\theta = -${pq($.E, 'N/C')}${pq($.d, 'm')}\cos ${$.dir > 0 ? 0 : 180}^\circ = ${texNum($.dV)}\ \text{V}$`,
      String.raw`$W = -q\,\Delta V = -${pq($.s * $.q, 'C')}${pq($.dV, 'V')} = ${texNum($.W)}\ \text{J}$`,
      String.raw`$\Delta U = q\,\Delta V = -W = ${texNum($.dU)}\ \text{J}$, so it ${$.dU > 0 ? 'gains' : 'loses'} potential energy.`,
    ],
    sim: {
      scenario: 'v-plates',
      setup(s, $) {
        s.charges = [];
        s.extraE = { x: $.E, y: 0, z: 0 };
        s.pathA = { x: (-$.dir * $.d) / 2, y: 0, z: 0 };
        s.probe = { x: ($.dir * $.d) / 2, y: 0, z: 0 };
        s.qTest = $.s * $.q;
      },
      read: (c) => ({ dV: c.V - c.VA, W: c.Wfield, dU: -c.Wfield }),
    },
    cases: [
      kase('Class Activity 3 #5', { E: 800, d: 15, dir: 1, q: 500, s: 1 }, { dV: -120, W: 0.06, dU: -0.06, pe: 'lose' }),
      kase('hand', { E: 2000, d: 10, dir: 1, q: 1, s: 1 }, { dV: -200, W: 2e-4, dU: -2e-4, pe: 'lose' }),
    ],
  }),
  problem({
    ...E3, id: 'e3.38.accelerate', ch: '38', lab: 'potential', title: 'Speed after accelerating through ΔV', kind: 'numeric', topics: ['potential', 'energy'],
    vars: { p: choice([-1, 'An electron'], [1, 'A proton']), V: range(10, 5000, 10, 'V') },
    derive: ($) => ({ m: $.p > 0 ? MP : ME, K: QE * $.V, v: Math.sqrt((2 * QE * $.V) / ($.p > 0 ? MP : ME)) }),
    text: (T) => `${T.p} starts from rest and is accelerated through a potential difference of ${T.V} V. Find its kinetic energy (J and eV) and its final speed.`,
    parts: [num('KJ', ($) => $.K, 'J', { label: 'K (J)' }), num('KeV', ($) => $.V, 'eV', { label: 'K (eV)' }), num('v', ($) => $.v, 'm/s')],
    steps: ($, f) => [
      String.raw`$K = |q|\,\Delta V = ${pq(QE, 'C')}${pq($.V, 'V')} = ${texNum($.K)}\ \text{J} = ${texNum($.V)}\ \text{eV}$`,
      String.raw`$v = \sqrt{\dfrac{2K}{m}} = \sqrt{\dfrac{2${pq($.K, 'J')}}{${qty($.m, 'kg')}}} = ${texNum($.v)}\ \text{m/s}$`,
    ],
    cases: [kase('hand', { p: -1, V: 100 }, { KJ: 1.6e-17, KeV: 100, v: 5.927e6 })],
  }),
  problem({
    ...E3, id: 'e3.38.pair-energy', ch: '38', lab: 'potential', title: 'Potential energy of two charges', kind: 'numeric', topics: ['potential-energy'],
    vars: { q1: range(0.5, 10, 0.5, 'μC', 1e-6), s1: SIGN, q2: range(0.5, 10, 0.5, 'μC', 1e-6), s2: SIGN, r: range(0.05, 2, 0.05, 'm') },
    derive: ($) => ({ U: (K * $.s1 * $.q1 * $.s2 * $.q2) / $.r }),
    text: (T) => `A ${T.s1} ${T.q1} μC charge and a ${T.s2} ${T.q2} μC charge are ${T.r} m apart. What is their electric potential energy? How much work did an external agent do to bring them together from far away, at rest?`,
    parts: [num('U', ($) => $.U, 'J', { label: 'U' }), num('W', ($) => $.U, 'J', { label: String.raw`$W_{\text{ext}}$` })],
    steps: ($, f) => [String.raw`$U = \dfrac{kq_1q_2}{r} = \dfrac{${pq(K, 'N·m²/C²')}${pq($.s1 * $.q1, 'C')}${pq($.s2 * $.q2, 'C')}}{${qty($.r, 'm')}} = ${texNum($.U)}\ \text{J}$, and $W_{\text{ext}} = \Delta U = U$`],
    sim: {
      scenario: 'v-plus',
      setup(s, $) {
        // q1 in the scene; q2 rides the probe, drawn as a charge, so the lab's PE is the pair's U.
        const note = potSetup(() => [charge($.s1 * $.q1, 0, 0, 0, { name: 'q₁' })], () => ({ x: $.r, y: 0 }))(s, $);
        s.qTest = $.s2 * $.q2;
        s.probeName = 'q₂';
        s.hideA = true;
        return `${note}. q₂ is the probe: the colors and field lines are from q₁ alone, the field q₂ is brought into.`;
      },
      read: (c) => ({ U: c.PE }),
    },
    cases: [kase('hand', { q1: 2, s1: 1, q2: 3, s2: 1, r: 0.3 }, { U: 0.1798 })],
  }),
  problem({
    ...E3, id: 'e3.38.system-energy', ch: '38', lab: 'potential', title: 'Energy of a three-charge system', kind: 'numeric', level: 2, topics: ['potential-energy', 'superposition'],
    vars: {
      q1: range(1, 5, 0.1, 'μC', 1e-6),
      q2: range(1, 5, 0.1, 'μC', 1e-6),
      q3: range(1, 5, 0.1, 'μC', 1e-6),
      r12: range(10, 30, 1, 'cm', 0.01),
      r23: range(10, 30, 1, 'cm', 0.01),
      r13: range(10, 40, 1, 'cm', 0.01),
    },
    derive: ($) => {
      const U12 = (K * $.q1 * $.q2) / $.r12;
      const U13 = (K * $.q1 * $.q3) / $.r13;
      const U23 = (K * $.q2 * $.q3) / $.r23;
      // Place the triangle so the lab can draw it: q1 at the origin, q2 on the x axis.
      const x3 = ($.r12 ** 2 + $.r13 ** 2 - $.r23 ** 2) / (2 * $.r12);
      const y3sq = $.r13 ** 2 - x3 ** 2;
      return { U12, U13, U23, U3: U13 + U23, U: U12 + U13 + U23, x3, y3: Math.sqrt(Math.max(0, y3sq)), y3sq };
    },
    // The three separations have to describe a real triangle, with some margin so it is not a sliver.
    valid: ($) => $.y3sq > 0.0015 && $.r12 + $.r23 > $.r13 * 1.05 && $.r12 + $.r13 > $.r23 * 1.05 && $.r13 + $.r23 > $.r12 * 1.05,
    text: (T) => `Three positive point charges are held at the corners of a triangle: q₁ = ${T.q1} μC, q₂ = ${T.q2} μC and q₃ = ${T.q3} μC, with r₁₂ = ${T.r12} cm, r₂₃ = ${T.r23} cm and r₁₃ = ${T.r13} cm. Assembling them one at a time from far away, find the work stored at each step and the total potential energy of the system.`,
    parts: [
      sym('U_sym', 'k*(q1*q2/r12 + q1*q3/r13 + q2*q3/r23)', { q1: 'C', q2: 'C', q3: 'C', r12: 'm', r13: 'm', r23: 'm' }, ($) => $.U, { unit: 'J', label: String.raw`$U_{\text{system}}$ as a formula` }),
      num('U12', ($) => $.U12, 'J', { label: String.raw`bringing in $q_2$` }),
      num('U3', ($) => $.U3, 'J', { label: String.raw`bringing in $q_3$` }),
      num('U', ($) => $.U, 'J', { label: String.raw`$U_{\text{system}}$` }),
    ],
    hints: [
      String.raw`The first charge costs nothing — there is nothing to push against yet.`,
      String.raw`Each later charge pays for every charge already placed, so count each *pair* once: $U = k\left(\dfrac{q_1q_2}{r_{12}} + \dfrac{q_1q_3}{r_{13}} + \dfrac{q_2q_3}{r_{23}}\right)$.`,
    ],
    steps: ($, f) => [
      String.raw`$U_{1} = 0$ — no work to place the first charge.`,
      String.raw`$U_{2} = \dfrac{kq_1q_2}{r_{12}} = \dfrac{${pq(K, 'N·m²/C²')}${pq($.q1, 'C')}${pq($.q2, 'C')}}{${qty($.r12, 'm')}} = ${texNum($.U12)}\ \text{J}$`,
      String.raw`$U_{3} = \dfrac{kq_1q_3}{r_{13}} + \dfrac{kq_2q_3}{r_{23}} = ${qty($.U13, 'J')} + ${qty($.U23, 'J')} = ${texNum($.U3)}\ \text{J}$`,
      String.raw`$U_{\text{system}} = U_2 + U_3 = ${qty($.U12, 'J')} + ${qty($.U3, 'J')} = ${texNum($.U)}\ \text{J}$ — three pairs, each counted once.`,
    ],
    sim: {
      scenario: 'v-plus',
      setup(s, $) {
        // q1 and q2 in the scene; q3 rides the probe, drawn as a charge, so the lab's PE is exactly
        // the third step. Point A plays no part in assembling the charges, so it is hidden.
        const note = potSetup(
          () => [charge($.q1, 0, 0, 0, { name: 'q₁' }), charge($.q2, $.r12, 0, 0, { name: 'q₂' })],
          () => ({ x: $.x3, y: $.y3 }),
        )(s, $);
        s.qTest = $.q3;
        s.probeName = 'q₃';
        s.hideA = true;
        return `${note}. q₃ is the probe, placed last: the colors and field lines are from q₁ and q₂ alone, the field it is brought into.`;
      },
      read: (c) => ({ U3: c.PE }),
    },
    cases: [kase('notes', { q1: 3.1, q2: 2.5, q3: 2.0, r12: 17, r23: 20, r13: 25 }, { U12: 0.4098, U3: 0.4476, U: 0.8574 }, { key: '0.41 J + 0.448 J = 0.86 J' })],
  }),
  problem({
    ...E3, id: 'e3.38.equipotentials', ch: '38', lab: 'potential', title: 'Equipotentials and the field', kind: 'conceptual', topics: ['potential', 'equipotential'],
    text: () => 'Which statements about equipotential surfaces and the electric field are true? (Select all that apply.)',
    parts: [
      mc('ans', [
        [1, 'Moving a charge along an equipotential, the field does zero work'],
        [2, 'E is perpendicular to the equipotentials'],
        [3, 'E points toward lower potential'],
        [4, 'E points toward higher potential'],
        [5, 'Two different equipotentials can cross'],
        [6, 'Where equipotentials are closer together, E is weaker'],
      ], [1, 2, 3], { multi: true }),
    ],
    steps: () => [
      String.raw`$\Delta V = 0$ along an equipotential, so $W = -q\,\Delta V = 0$.`,
      String.raw`$\vec{E}$ is perpendicular to the equipotentials and points downhill in $V$, since $E_x = -dV/dx$.`,
      String.raw`A point has only one potential, so equipotentials never cross. Closely spaced ones mean a steep $V$, so $\vec{E}$ is stronger there.`,
    ],
    sim: { scenario: 'v-dipole' },
    cases: [kase('all true ones', {}, { ans: [1, 2, 3] })],
  }),
  problem({
    ...E3, id: 'e3.38.E-from-V', ch: '38', lab: 'potential', title: 'E from V(x)', kind: 'derivation', level: 2, topics: ['potential', 'gradient'],
    vars: { a: range(-10, 10, 1, 'V/m²', 1, { exclude: [0] }), b: range(-20, 20, 1, 'V/m'), x0: range(-3, 3, 0.5, 'm') },
    derive: ($) => ({ Ex: -(2 * $.a * $.x0 + $.b) }),
    text: (T) => `The potential along the x-axis is V(x) = ax² + bx + 5 V, with a = ${T.a} V/m², b = ${T.b} V/m and x in m. Find Eₓ at x = ${T.x0} m.`,
    parts: [
      sym('Ex_sym', '-(2*a*x0 + b)', { a: 'V/m²', b: 'V/m', x0: 'm' }, ($) => $.Ex, { unit: 'V/m', label: String.raw`$E_x$ as a formula (use a, b, x0)` }),
      num('Ex', ($) => $.Ex, 'V/m', { abs: 0.01 }),
    ],
    hints: [String.raw`$E_x = -\dfrac{dV}{dx}$`],
    steps: ($, f) => [
      String.raw`$E_x = -\dfrac{dV}{dx} = -(2ax + b)$`,
      String.raw`At $x = x_0$: $E_x = -\left[2${pq($.a, 'V/m²')}${pq($.x0, 'm')} + ${pq($.b, 'V/m')}\right] = ${texNum($.Ex)}\ \text{V/m}$`,
    ],
    cases: [kase('hand', { a: 3, b: -4, x0: 2 }, { Ex: -8 })],
  }),

  // ================================================================= 39
  problem({
    ...E3, id: 'e3.39.two-charges-V', ch: '39', lab: 'potential', title: 'Potential at a point from two charges', kind: 'numeric', topics: ['potential', 'superposition'],
    vars: { q1: range(0.5, 5, 0.5, 'μC', 1e-6), s1: SIGN, a: range(0.2, 1.5, 0.1, 'm'), q2: range(0.5, 5, 0.5, 'μC', 1e-6), s2: SIGN, b: range(0.2, 1.5, 0.1, 'm') },
    derive: ($) => ({ V: K * (($.s1 * $.q1) / $.a + ($.s2 * $.q2) / $.b) }),
    text: (T) => `q₁ = ${T.q1} μC (${T.s1}) is at (−${T.a} m, 0) and q₂ = ${T.q2} μC (${T.s2}) is at (0, ${T.b} m). Find the potential at the origin.`,
    parts: [num('V', ($) => $.V, 'V', { abs: 1 })],
    hints: ['Potentials add as scalars — no components needed.'],
    steps: ($, f) => [String.raw`$V = k\left(\dfrac{q_1}{a} + \dfrac{q_2}{b}\right) = ${pq(K, 'N·m²/C²')}\left(\dfrac{${qty($.s1 * $.q1, 'C')}}{${qty($.a, 'm')}} + \dfrac{${qty($.s2 * $.q2, 'C')}}{${qty($.b, 'm')}}\right) = ${texNum($.V)}\ \text{V}$`],
    sim: {
      scenario: 'v-ch39a',
      setup: potSetup(($) => [charge($.s1 * $.q1, -$.a, 0), charge($.s2 * $.q2, 0, $.b)], () => ({ x: 0, y: 0 })),
      read: (c) => ({ V: c.V }),
    },
    cases: [kase('Ch 39 example (a)', { q1: 2, s1: 1, a: 0.8, q2: 1, s2: -1, b: 0.4 }, { V: 0 }), kase('Ch 39 example (b)', { q1: 2, s1: 1, a: 0.4, q2: 1, s2: -1, b: 0.8 }, { V: 33705 })],
  }),
  problem({
    ...E3, id: 'e3.39.three-charges-V', ch: '39', lab: 'potential', src: 'Class Activity 3 #9', title: 'Potential from three charges at the corners', kind: 'numeric', level: 2, topics: ['potential', 'superposition'],
    vars: {
      q1: range(1, 10, 1, 'nC', 1e-9), s1: SIGN, q2: range(1, 10, 1, 'nC', 1e-9), s2: SIGN, q3: range(1, 10, 1, 'nC', 1e-9), s3: SIGN,
      r1: range(0.05, 0.5, 0.05, 'm'), r2: range(0.05, 0.5, 0.05, 'm'),
    },
    derive: ($) => {
      const d1 = Math.hypot($.r1, $.r2);
      return { d1, V: K * (($.s1 * $.q1) / d1 + ($.s2 * $.q2) / $.r2 + ($.s3 * $.q3) / $.r1) };
    },
    text: (T, $, f) => `q₁ = ${T.q1} nC (${T.s1}) sits at the origin, q₂ = ${T.q2} nC (${T.s2}) at (${T.r1} m, 0) and q₃ = ${T.q3} nC (${T.s3}) at (0, −${T.r2} m). Point P is at (${T.r1} m, −${T.r2} m), the fourth corner of the rectangle. Find the electric potential at P relative to infinity.`,
    parts: [num('V', ($) => $.V, 'V', { abs: 0.05 })],
    hints: [
      'Find each charge’s distance to P first: two are sides of the rectangle, one is its diagonal.',
      String.raw`$V$ is a scalar: add $kq/r$ for each charge, signs included. No components.`,
    ],
    steps: ($) => [
      String.raw`$r_{1P} = \sqrt{${texNum($.r1)}^2 + ${texNum($.r2)}^2} = ${texNum($.d1)}\ \text{m}$, $r_{2P} = ${texNum($.r2)}\ \text{m}$, $r_{3P} = ${texNum($.r1)}\ \text{m}$`,
      String.raw`$V_P = k\left(\dfrac{q_1}{r_{1P}} + \dfrac{q_2}{r_{2P}} + \dfrac{q_3}{r_{3P}}\right) = ${pq(K, 'N·m²/C²')}\left(\dfrac{${qty($.s1 * $.q1, 'C')}}{${qty($.d1, 'm')}} + \dfrac{${qty($.s2 * $.q2, 'C')}}{${qty($.r2, 'm')}} + \dfrac{${qty($.s3 * $.q3, 'C')}}{${qty($.r1, 'm')}}\right) = ${texNum($.V)}\ \text{V}$`,
    ],
    sim: {
      scenario: 'v-ch39a',
      setup: potSetup(
        ($) => [charge($.s1 * $.q1, 0, 0), charge($.s2 * $.q2, $.r1, 0), charge($.s3 * $.q3, 0, -$.r2)],
        ($) => ({ x: $.r1, y: -$.r2 }),
      ),
      read: (c) => ({ V: c.V }),
    },
    cases: [kase('Class Activity 3 #9', { q1: 8, s1: 1, q2: 2, s2: -1, q3: 2, s3: -1, r1: 0.1, r2: 0.3 }, { V: -12.31 })],
  }),
  problem({
    ...E3, id: 'e3.39.zero-V-point', ch: '39', lab: 'potential', title: 'Where V = 0 between opposite charges', kind: 'numeric', level: 2, topics: ['potential', 'superposition'],
    vars: { q1: range(1, 10, 1, 'μC', 1e-6), q2: range(1, 10, 1, 'μC', 1e-6), d: range(0.2, 2, 0.1, 'm') },
    derive: ($) => ({ x: ($.d * $.q1) / ($.q1 + $.q2) }),
    text: (T) => `A +${T.q1} μC charge is at x = 0 and a −${T.q2} μC charge is at x = ${T.d} m. Where between them is V = 0?`,
    parts: [
      sym('x_sym', 'd*q1/(q1 + q2)', { q1: 'C', q2: 'C', d: 'm' }, ($) => $.x, { unit: 'm', label: String.raw`$x$ as a formula` }),
      num('x', ($) => $.x, 'm'),
      mc('E0', [[1, 'Yes, E = 0 there too'], [0, 'No, E is not zero there']], 0, { label: String.raw`Is $\vec{E}$ zero at that point?` }),
    ],
    steps: ($, f) => [
      String.raw`$\dfrac{kq_1}{x} = \dfrac{k|q_2|}{d-x} \;\Longrightarrow\; x = \dfrac{dq_1}{q_1 + |q_2|} = \dfrac{${pq($.d, 'm')}(${texNum($.q1 * 1e6)}\ \mu\text{C})}{(${texNum($.q1 * 1e6)} + ${texNum($.q2 * 1e6)})\ \mu\text{C}} = ${texNum($.x)}\ \text{m}$`,
      String.raw`Between opposite charges both fields point toward the negative one, so $\vec{E} \neq 0$ there.`,
    ],
    sim: {
      scenario: 'v-dipole',
      setup: potSetup(($) => [charge($.q1, 0, 0), charge(-$.q2, $.d, 0)], ($) => ({ x: $.x, y: 0 })),
      read: (c, s, $) => ({ '@V at the point, as a fraction of kq₁/d': [c.V / ((K * $.q1) / $.d), 0] }),
    },
    cases: [kase('hand', { q1: 2, q2: 1, d: 0.9 }, { x: 0.6, E0: 0 })],
  }),
  problem({
    ...E3, id: 'e3.39.ring-V', ch: '39', lab: 'integral', title: 'Potential on the axis of a ring', kind: 'derivation', level: 2, topics: ['potential', 'continuous-distribution'],
    vars: { Q: range(-5, 5, 0.1, 'μC', 1e-6, { exclude: [0] }), a: range(0.1, 0.6, 0.01, 'm'), y: range(0, 0.9, 0.01, 'm') },
    derive: ($) => ({ V: (K * $.Q) / Math.hypot($.a, $.y) }),
    text: (T) => `A ring of radius ${T.a} m carries ${T.Q} μC. Find V on its axis, ${T.y} m from the center.`,
    parts: [
      sym('V_sym', 'k*Q/sqrt(a^2 + y^2)', { Q: 'C', a: 'm', y: 'm' }, ($) => $.V, { unit: 'V', label: String.raw`$V$ as a formula` }),
      num('V', ($) => $.V, 'V'),
    ],
    hints: [String.raw`Every $dq$ is the same distance from $P$, and $V$ is a scalar, so nothing cancels.`],
    steps: ($, f) => [
      String.raw`$V = \displaystyle\int \frac{k\,dq}{r} = \frac{kQ}{\sqrt{a^2+y^2}}$`,
      String.raw`$V = \dfrac{${pq(K, 'N·m²/C²')}${pq($.Q, 'C')}}{\sqrt{${pq($.a, 'm')}^2 + ${pq($.y, 'm')}^2}} = ${texNum($.V)}\ \text{V}$`,
    ],
    sim: {
      scenario: 'ring',
      setup(s, $) {
        Object.assign(s.integral, { kind: 'ring', Q: $.Q, a: $.a, y: $.y, quantity: 'V' });
      },
      read: (c) => ({ V: c.integral.analytic.V, V_sym: c.integral.analytic.V }),
    },
    cases: [kase('hand', { Q: 2.5, a: 0.32, y: 0.38 }, { V: 45230 })],
  }),
  problem({
    ...E3, id: 'e3.39.rod-V', ch: '39', lab: 'integral', title: 'Potential on the bisector of a line charge', kind: 'derivation', level: 3, topics: ['potential', 'continuous-distribution'],
    vars: { lam: range(-5, 5, 0.1, 'μC/m', 1e-6, { exclude: [0] }), L: range(0.3, 1.4, 0.01, 'm'), d: range(0.12, 0.9, 0.01, 'm') },
    derive: ($) => {
      const re = Math.hypot($.L / 2, $.d);
      return { V: K * $.lam * Math.log((re + $.L / 2) / (re - $.L / 2)) };
    },
    text: (T) => `A line charge of length ${T.L} m and λ = ${T.lam} μC/m lies on the x-axis, centered on the origin. Find V at (0, ${T.d} m).`,
    parts: [
      sym('V_sym', 'k*lam*ln((sqrt(L^2/4 + d^2) + L/2)/(sqrt(L^2/4 + d^2) - L/2))', { lam: 'C/m', L: 'm', d: 'm' }, ($) => $.V, { unit: 'V', label: String.raw`$V$ as a formula` }),
      num('V', ($) => $.V, 'V'),
    ],
    hints: [String.raw`$\displaystyle\int \frac{dx}{\sqrt{x^2+d^2}} = \ln\!\left(x + \sqrt{x^2+d^2}\right)$`],
    steps: ($, f) => [
      String.raw`$V = k\lambda\displaystyle\int_{-L/2}^{L/2} \frac{dx}{\sqrt{x^2+d^2}} = k\lambda\ln\!\left[\frac{\sqrt{L^2/4 + d^2} + L/2}{\sqrt{L^2/4 + d^2} - L/2}\right]$`,
      String.raw`$\sqrt{L^2/4 + d^2} = \sqrt{${pq($.L / 2, 'm')}^2 + ${pq($.d, 'm')}^2} = ${qty(Math.hypot($.L / 2, $.d), 'm')}$`,
      String.raw`$V = ${pq(K, 'N·m²/C²')}${pq($.lam, 'C/m')}\ln\!\left[\dfrac{${texNum(Math.hypot($.L / 2, $.d))} + ${texNum($.L / 2)}}{${texNum(Math.hypot($.L / 2, $.d))} - ${texNum($.L / 2)}}\right] = ${texNum($.V)}\ \text{V}$`,
    ],
    sim: {
      scenario: 'rod',
      setup(s, $) {
        Object.assign(s.integral, { kind: 'rod', L: $.L, lambda: $.lam, d: $.d, quantity: 'V' });
      },
      read: (c) => ({ V: c.integral.analytic.V, V_sym: c.integral.analytic.V }),
    },
    cases: [kase('hand', { lam: 2, L: 0.8, d: 0.35 }, { V: 35193 })],
  }),
  problem({
    ...E3, id: 'e3.39.sphere-V', ch: '39', lab: 'conductors', title: 'Potential of a charged conducting sphere', kind: 'numeric', level: 2, topics: ['potential', 'conductors'],
    vars: { Q: range(0.5, 10, 0.5, 'μC', 1e-6), R: range(0.1, 0.5, 0.05, 'm'), f: range(0.2, 3, 0.1) },
    derive: ($) => {
      const r = $.f * $.R;
      return { r, V: (K * $.Q) / Math.max(r, $.R) };
    },
    text: (T, $, f) => `A conducting sphere of radius ${T.R} m carries ${T.Q} μC. Find the potential ${f($.r)} m from its center.`,
    parts: [num('V', ($) => $.V, 'V'), mc('inside', [[1, 'Constant, equal to kQ/R'], [2, 'Zero'], [3, 'kQ/r, growing toward the center']], 1, { label: 'Inside the sphere, V is…' })],
    hints: [String.raw`$\vec{E} = 0$ inside, so $V$ does not change there.`],
    steps: ($, f) => [
      String.raw`$r \ge R$: $V = \dfrac{kQ}{r}$.  $r \le R$: $V = \dfrac{kQ}{R}$.`,
      String.raw`Here $r = ${qty($.r, 'm')}$ ${$.r >= $.R ? '≥' : '<'} $R$, so $V = \dfrac{${pq(K, 'N·m²/C²')}${pq($.Q, 'C')}}{${qty(Math.max($.r, $.R), 'm')}} = ${texNum($.V)}\ \text{V}$`,
    ],
    sim: { scenario: 'uniform', setup: (s, $) => void Object.assign(s, { Q: $.Q, R: Math.min(0.55, $.R) }) },
    cases: [kase('hand', { Q: 2, R: 0.35, f: 0.6 }, { V: 51360, inside: 1 })],
  }),

  problem({
    ...E3, id: 'e3.39.compare-configs', ch: '39', lab: 'potential', title: 'Comparing four charge arrangements', kind: 'numeric', level: 2, topics: ['potential', 'superposition', 'ranking'],
    vars: {
      cfg: choice(['a', '(a)'], ['b', '(b)'], ['c', '(c)'], ['d', '(d)']),
      q: range(0.5, 4, 0.5, 'μC', 1e-6),
      r0: range(0.5, 2, 0.25, 'm'),
    },
    derive: ($) => {
      // Each arrangement puts +2q and −q at either r₀ or 2r₀ from P. (a) and (d) differ on the
      // page but put both charges at the same distances, which is the whole point of the question.
      const D = { a: [2, 1], b: [1, 2], c: [2, 2], d: [2, 1] }[$.cfg];
      const [na, nb] = D;
      const V = (K * 2 * $.q) / (na * $.r0) - (K * $.q) / (nb * $.r0);
      return { na, nb, V, sign: Math.sign(Number(V.toFixed(6))) };
    },
    text: (T, $) => `A point P has a +2q charge and a −q charge near it, each sitting either r₀ or 2r₀ away. The four arrangements are (a) 2q at 2r₀ and −q at r₀; (b) 2q at r₀ and −q at 2r₀; (c) both at 2r₀; (d) 2q at 2r₀ and −q at r₀, on opposite sides of P. With q = ${T.q} μC and r₀ = ${T.r0} m, find the total potential at P for arrangement ${T.cfg}.`,
    parts: [
      num('V', ($) => $.V, 'V', { label: String.raw`$V_P$`, abs: 1 }),
      mc('sign', [[1, 'positive'], [0, 'zero'], [-1, 'negative']], ($) => $.sign, { label: String.raw`Sign of $V_P$` }),
      mc('same', [['ad', '(a) and (d)'], ['ab', '(a) and (b)'], ['bc', '(b) and (c)'], ['cd', '(c) and (d)']], 'ad', { label: 'Which two arrangements give the same potential?' }),
    ],
    hints: [
      String.raw`Potential is a scalar: add the numbers with their signs, no components and no angles.`,
      String.raw`Only the distance to P matters, not which side a charge sits on — so two arrangements that look different on the page can give the same $V$.`,
    ],
    steps: ($, f, T) => [
      String.raw`$V_P = \dfrac{k(2q)}{${$.na}r_0} + \dfrac{k(-q)}{${$.nb}r_0} = ${texNum((K * 2 * $.q) / ($.na * $.r0))} + (${texNum(-(K * $.q) / ($.nb * $.r0))}) = ${texNum($.V)}\ \text{V}$`,
      String.raw`(a) and (d) place both charges at the same two distances, so they give the same potential even though the pictures differ — distance is all $V$ cares about.`,
    ],
    sim: {
      scenario: 'v-plus',
      // P at the origin, the two charges on either side at their stated distances.
      setup: potSetup(
        ($) => [charge(2 * $.q, $.na * $.r0, 0), charge(-$.q, -$.nb * $.r0, 0)],
        () => ({ x: 0, y: 0 }),
      ),
      read: (c) => ({ V: c.V }),
    },
    cases: [
      kase('notes (b)', { cfg: 'b', q: 1, r0: 1 }, { V: 13485, sign: 1, same: 'ad' }, { key: '+13,500 V', note: 'Key writes the first term as +1800 V; k(2q)/r₀ with q = 1 μC, r₀ = 1 m is +18,000 V. The stated total, 13,500 V, is right.' }),
      kase('notes (a)', { cfg: 'a', q: 1, r0: 1 }, { V: 0, sign: 0, same: 'ad' }, { key: '0 V' }),
      kase('notes (c)', { cfg: 'c', q: 1, r0: 1 }, { V: 4495, sign: 1, same: 'ad' }, { key: '+4,500 V' }),
    ],
  }),
  problem({
    ...E3, id: 'e3.38.units-of', ch: '38', src: 'Practice 38 #1–3', title: 'Units: potential, energy, field', kind: 'conceptual', topics: ['potential', 'units'],
    vars: { q: choice(['U', 'electric potential energy'], ['V', 'electric potential'], ['E', 'electric field'], ['ratio', 'electric potential, as a ratio']) },
    text: (T, $) => ($.q === 'ratio'
      ? 'Electric potential, measured in volts, is the ratio of electric potential energy to what?'
      : `What are the units of ${T.q}?`),
    parts: [
      mc('ans', ($) => ($.q === 'ratio'
        ? [['current', 'the electric current'], ['charge', 'the amount of electric charge'], ['field', 'the electric field'], ['mass', 'the mass of the object']]
        : [['J', 'J'], ['J/C', 'J/C'], ['N/C', 'N/C'], ['J/kg', 'J/kg']]),
        ($) => ({ U: 'J', V: 'J/C', E: 'N/C', ratio: 'charge' })[$.q]),
    ],
    hints: [String.raw`$V = U/q$, so a volt is a joule per coulomb; the energy itself is just joules.`],
    steps: ($) => [
      $.q === 'E'
        ? String.raw`$\vec{E}$ is force per charge, N/C — which is the same thing as V/m.`
        : String.raw`$U$ is an energy (J). $V = U/q$ is energy per unit charge (J/C = V), which is why potential is the *ratio* of potential energy to charge.`,
    ],
    cases: [
      kase('#1', { q: 'U' }, { ans: 'J' }, { key: 'C) J' }),
      kase('#2', { q: 'V' }, { ans: 'J/C' }, { key: 'B) J/C' }),
      kase('#3', { q: 'ratio' }, { ans: 'charge' }, { key: 'B) charge' }),
    ],
  }),
  problem({
    ...E3, id: 'e3.38.work-and-deltaV', ch: '38', src: 'Practice 38 #4–5', title: 'Work, ΔV and ΔU for a pushed charge', kind: 'numeric', topics: ['potential', 'work', 'potential-energy'],
    vars: { W: range(2, 40, 1, 'J'), q: range(0.5, 5, 0.5, 'C') },
    derive: ($) => ({ dV: $.W / $.q, dU: $.W }),
    text: (T) => `It takes ${T.W} J of work by an external agent to push an object carrying ${T.q} C of net charge through a uniform electric field. Find the change in the object's potential, and the change in its potential energy.`,
    parts: [
      num('dV', ($) => $.dV, 'V', { label: String.raw`$\Delta V$` }),
      num('dU', ($) => $.dU, 'J', { label: String.raw`$\Delta U$` }),
    ],
    hints: [String.raw`$W_{\text{ext}} = \Delta U = q\,\Delta V$. Work done *against* the field raises the energy.`],
    steps: ($, f) => [
      String.raw`$\Delta U = W_{\text{ext}} = ${texNum($.dU)}\ \text{J}$`,
      String.raw`$\Delta V = \dfrac{\Delta U}{q} = \dfrac{${texNum($.W)}}{${texNum($.q)}} = ${texNum($.dV)}\ \text{V}$`,
    ],
    cases: [kase('#4–5', { W: 10, q: 2 }, { dV: 5, dU: 10 }, { key: '4) A) 5 V   5) A) −10 J', note: 'The key gives ΔU as −10 J, taking the work as done BY the field. Pushing against the field, the object gains 10 J.' })],
  }),
  problem({
    ...E3, id: 'e3.38.field-potential-traps', ch: '38', src: 'Practice 38 #11–12, 16', title: 'Does zero field mean zero potential?', kind: 'conceptual', level: 2, topics: ['potential', 'gradient'],
    vars: {
      claim: choice(
        ['E0V0', 'If the electric field is zero at a point, the potential must be zero there.'],
        ['Vconst', 'If the potential is constant throughout a region, the electric field is zero everywhere in that region.'],
        ['V0E', 'If the electric potential at a point is zero, what must the electric field there be?'],
      ),
    },
    text: (T) => T.claim,
    parts: [
      mc('ans', ($) => ($.claim === 'V0E'
        ? [['zero', 'Zero'], ['nonzero', 'Not zero'], ['unknown', 'Impossible to determine from the information given']]
        : [['T', 'True'], ['F', 'False']]),
        ($) => ({ E0V0: 'F', Vconst: 'T', V0E: 'unknown' })[$.claim]),
    ],
    hints: [String.raw`$\vec{E}$ is the *slope* of $V$, not its value: $E_x = -\dfrac{dV}{dx}$.`],
    steps: ($) => [
      $.claim === 'E0V0'
        ? String.raw`False. Midway between two equal positive charges $\vec{E} = 0$, but $V$ is large and positive. A flat graph can sit at any height.`
        : $.claim === 'Vconst'
          ? String.raw`True. Constant $V$ means zero slope in every direction, and $\vec{E} = -\nabla V$, so $\vec{E} = 0$.`
          : String.raw`Neither. $V = 0$ fixes the height, not the slope — midway between $+q$ and $-q$, $V = 0$ while $\vec{E}$ is at its largest.`,
    ],
    cases: [
      kase('#11', { claim: 'E0V0' }, { ans: 'F' }, { key: 'B) False' }),
      kase('#12', { claim: 'Vconst' }, { ans: 'T' }, { key: 'A) True' }),
      kase('#16', { claim: 'V0E' }, { ans: 'unknown' }, { key: 'E) impossible to determine' }),
    ],
  }),
  problem({
    ...E3, id: 'e3.38.charge-moves', ch: '38', src: 'Practice 38 #13–15', title: 'Which way does the charge go?', kind: 'conceptual', level: 2, topics: ['potential', 'energy'],
    vars: {
      what: choice(
        ['proton-along', 'A proton moves in the direction of the electric field. What happens to its potential energy and its electric potential?'],
        ['neg-free', 'A negative charge is free to move in an electric field. Which way does it go?'],
        ['proton-perp', 'A proton moves perpendicular to the electric field lines. What happens to its potential and its potential energy?'],
      ),
    },
    text: (T) => T.what,
    parts: [
      mc('ans', ($) => ($.what === 'neg-free'
        ? [
            ['high-to-low', 'From high potential toward low potential'],
            ['low-to-high', 'From low potential toward high potential'],
            ['equip', 'Along an equipotential, so its potential stays the same'],
          ]
        : [
            ['both-up', 'Both its potential energy and its electric potential increase'],
            ['both-down', 'Both its potential energy and its electric potential decrease'],
            ['both-same', 'Both its electric potential and its potential energy stay the same'],
            ['split', 'Its electric potential decreases, but its potential energy increases'],
          ]), ($) => ({ 'proton-along': 'both-down', 'neg-free': 'low-to-high', 'proton-perp': 'both-same' })[$.what]),
    ],
    hints: [
      String.raw`$\vec{E}$ points from high $V$ toward low $V$. A positive charge released freely runs downhill in $V$; a negative one runs uphill.`,
      String.raw`$U = qV$, so for a proton $U$ and $V$ move together; for an electron they move oppositely.`,
    ],
    steps: ($) => [
      $.what === 'proton-along'
        ? String.raw`Moving along $\vec{E}$ is moving toward lower $V$. For a positive charge $U = qV$ falls too — both decrease.`
        : $.what === 'neg-free'
          ? String.raw`A negative charge feels a force opposite $\vec{E}$, so it moves toward *higher* potential. That still lowers its energy, because $U = qV$ with $q < 0$.`
          : String.raw`Perpendicular to the field lines is along an equipotential: $V$ does not change, so neither does $U = qV$.`,
    ],
    cases: [
      kase('#13', { what: 'proton-along' }, { ans: 'both-down' }, { key: 'C)' }),
      kase('#14', { what: 'neg-free' }, { ans: 'low-to-high' }, { key: 'D)' }),
      kase('#15', { what: 'proton-perp' }, { ans: 'both-same' }, { key: 'E)' }),
    ],
  }),
  problem({
    ...E3, id: 'e3.38.V-poly-field', ch: '38', src: 'Practice 38 #23', title: 'E from a polynomial V(x)', kind: 'numeric', level: 2, topics: ['potential', 'gradient'],
    vars: { a: range(1, 6, 1, 'V/m'), b: range(1, 4, 1, 'V/m²'), x: range(0, 3, 0.5, 'm') },
    derive: ($) => ({ Ex: -($.a - 2 * $.b * $.x) }),
    text: (T) => `Along the x-axis the electric potential is V(x) = (${T.a} V/m)x − (${T.b} V/m²)x². Find the x component of the electric field at x = ${T.x} m.`,
    parts: [
      sym('E_sym', '-(a - 2*b*x)', { a: 'V/m', b: 'V/m^2', x: 'm' }, ($) => $.Ex, { unit: 'V/m', label: String.raw`$E_x$ as a formula` }),
      num('Ex', ($) => $.Ex, 'V/m', { label: String.raw`$E_x$`, abs: 0.01 }),
    ],
    hints: [String.raw`$E_x = -\dfrac{dV}{dx}$ — differentiate, then substitute. Do not divide $V$ by $x$.`],
    steps: ($, f) => [
      String.raw`$\dfrac{dV}{dx} = ${texNum($.a)} - 2(${texNum($.b)})x$`,
      String.raw`$E_x = -\dfrac{dV}{dx} = ${texNum($.Ex)}\ \text{V/m}$ at $x = ${texNum($.x)}$ m`,
    ],
    cases: [
      kase('#23A', { a: 2, b: 1, x: 0 }, { Ex: -2 }, { key: '(−2 V/m) x̂' }),
      kase('#23B', { a: 2, b: 1, x: 1 }, { Ex: 0 }, { key: '(0 V/m) x̂' }),
    ],
  }),
  problem({
    ...E3, id: 'e3.38.work-nonuniform', ch: '38', src: 'Worksheet 3 #11', title: 'Work in a field that changes with x', kind: 'derivation', level: 3, topics: ['potential', 'work', 'integral'],
    vars: {
      q: range(10, 500, 10, 'μC', 1e-6), s: SIGN,
      c: range(1, 12, 1, 'N/(C·m²)'), dir: choice([1, '+x̂'], [-1, '−x̂']),
      xB: range(0, 3, 0.5, 'm'), xA: range(0.5, 4, 0.5, 'm'),
    },
    derive: ($) => {
      const cs = $.dir * $.c; // E_x = cs·x²
      const I = (cs * ($.xA ** 3 - $.xB ** 3)) / 3; // ∫ E_x dx from B to A
      return { cs, W: $.s * $.q * I, dV: -I };
    },
    valid: ($) => $.xA !== $.xB,
    text: (T, $) => String.raw`A ${T.s} ${T.q} μC charge moves along the x-axis from point B at x = ${T.xB} m to point A at x = ${T.xA} m, through an electric field $\vec{E} = [(${T.c}\ \text{N/(C·m}^2\text{)})\,x^2]\,(${$.dir > 0 ? '+' : '-'}\hat{x})$. Find the work the field does on the charge, and the potential difference $V_A - V_B$.`,
    parts: [
      sym('W_sym', 'q*c*(xA^3 - xB^3)/3', { q: 'C', c: 'N/(C*m^2)', xA: 'm', xB: 'm' }, ($) => ($.q * $.c * ($.xA ** 3 - $.xB ** 3)) / 3, {
        unit: 'J', label: String.raw`$W$ as a formula for a positive $q$ and $\vec{E}$ along $+\hat{x}$ (use q, c, xA, xB)`,
      }),
      num('W', ($) => $.W, 'J', { label: String.raw`$W_{\text{field}}$ (signed)` }),
      num('dV', ($) => $.dV, 'V', { label: String.raw`$V_A - V_B$` }),
    ],
    hints: [
      String.raw`The field changes along the path, so $W = qEd$ does not apply. Add up $dW = qE_x\,dx$: $W = q\displaystyle\int_{x_B}^{x_A} E_x\,dx$.`,
      String.raw`Keep every sign: $q$ carries its own, $E_x$ is negative if $\vec{E}$ points along $-\hat{x}$, and $V_A - V_B = -\displaystyle\int_B^A E_x\,dx = -W/q$.`,
    ],
    steps: ($) => [
      String.raw`$W = q\displaystyle\int_{x_B}^{x_A} E_x\,dx = q\,c\left[\frac{x^3}{3}\right]_{x_B}^{x_A}$, with $c = ${qty($.cs, 'N/(C·m²)')}$ (signed by the direction of $\vec{E}$)`,
      String.raw`$W = ${pq($.s * $.q, 'C')}${pq($.cs, 'N/(C·m²)')}\,\dfrac{${pq($.xA, 'm')}^3 - ${pq($.xB, 'm')}^3}{3} = ${texNum($.W)}\ \text{J}$`,
      String.raw`$V_A - V_B = -\displaystyle\int_{x_B}^{x_A} E_x\,dx = -\dfrac{W}{q} = -\dfrac{${qty($.W, 'J')}}{${qty($.s * $.q, 'C')}} = ${texNum($.dV)}\ \text{V}$`,
      $.W > 0
        ? 'The field does positive work: left to itself the charge would speed up along this path.'
        : 'The field does negative work: something else has to push the charge along this path.',
    ],
    cases: [kase('Worksheet 3 #11, field as the formula writes it (+x̂)', { q: 200, s: -1, c: 6, dir: 1, xB: 1, xA: 2 }, { W: -2.8e-3, dV: -14 }, {
      note: 'The worksheet formula says E points along +x̂ but its figure draws E to the left. Along +x̂ the field does −2.8 mJ on the −200 μC charge; along −x̂ it would be +2.8 mJ.',
    })],
  }),
  problem({
    ...E3, id: 'e3.38.V-graph', ch: '38', src: 'Practice 38 #20–22, Worksheet 3 #5', title: 'Reading E off a graph of V', kind: 'numeric', level: 2, topics: ['potential', 'gradient', 'graphs'],
    vars: {
      V0: range(-2, 2, 1, 'V'), V1: range(-5, 6, 1, 'V'), V2: range(-5, 6, 1, 'V'), V3: range(-6, 6, 1, 'V'),
      w1: range(1, 3, 1, 'm'), w2: range(1, 3, 1, 'm'), w3: range(1, 3, 1, 'm'),
    },
    derive: ($) => {
      const E = [-($.V1 - $.V0) / $.w1, -($.V2 - $.V1) / $.w2, -($.V3 - $.V2) / $.w3];
      const mags = E.map(Math.abs);
      const top = Math.max(...mags);
      return { EA: E[0], EB: E[1], EC: E[2], biggest: mags.indexOf(top), top, sorted: [...mags].sort((a, b) => b - a) };
    },
    // One segment clearly the steepest, and at least two that slope, so the question has teeth.
    valid: ($) => $.sorted[0] - $.sorted[1] >= 0.5 && $.sorted[1] > 0,
    text: () => 'The graph shows the electric potential V along the x-axis. It is made of three straight pieces, A, B and C. Find the x component of the electric field on each piece, and say where the field is strongest.',
    figure: ($) => vGraphSVG([0, $.w1, $.w1 + $.w2, $.w1 + $.w2 + $.w3], [$.V0, $.V1, $.V2, $.V3]),
    parts: [
      num('EA', ($) => $.EA, 'V/m', { label: String.raw`$E_x$ on A`, abs: 0.05 }),
      num('EB', ($) => $.EB, 'V/m', { label: String.raw`$E_x$ on B`, abs: 0.05 }),
      num('EC', ($) => $.EC, 'V/m', { label: String.raw`$E_x$ on C`, abs: 0.05 }),
      mc('big', [[0, 'On A'], [1, 'On B'], [2, 'On C']], ($) => $.biggest, { label: 'Where is the field strongest?' }),
    ],
    hints: [
      String.raw`$E_x = -\dfrac{dV}{dx}$: the field is minus the *slope* of the graph, not its height. A flat piece has $E = 0$ however high it sits.`,
      'Uphill in V means E points toward −x; downhill means +x. The steepest piece, whichever way it slopes, has the strongest field.',
    ],
    steps: ($) => [
      String.raw`A: $E_x = -\dfrac{${texNum($.V1)} - (${texNum($.V0)})}{${texNum($.w1)}} = ${texNum($.EA)}\ \text{V/m}$`,
      String.raw`B: $E_x = -\dfrac{${texNum($.V2)} - (${texNum($.V1)})}{${texNum($.w2)}} = ${texNum($.EB)}\ \text{V/m}$`,
      String.raw`C: $E_x = -\dfrac{${texNum($.V3)} - (${texNum($.V2)})}{${texNum($.w3)}} = ${texNum($.EC)}\ \text{V/m}$`,
      `The steepest piece is ${'ABC'[$.biggest]}, so that is where |E| is largest — the sign only says which way it points.`,
    ],
    cases: [
      // Practice 38 #20–21: 0 → 4 V over 3 m, then down to −4 V by 4 m, then flat.
      kase('Practice 38 #20–21', { V0: 0, V1: 4, V2: -4, V3: -4, w1: 3, w2: 1, w3: 2 }, { EA: -1.333, EB: 8, EC: 0, big: 1 }, {
        key: '#20 A) from r = 3 m to 4 m; #21 1.33 V/m',
      }),
    ],
  }),
  problem({
    ...E3, id: 'e3.38.V-graph-E', ch: '38', src: 'Class Activity 3 #7', title: 'Sketching E from a graph of V', kind: 'conceptual', level: 2, topics: ['potential', 'gradient', 'graphs'],
    vars: {
      V0: range(-4, 4, 1, 'V'), V1: range(-4, 4, 1, 'V'), V2: range(-4, 4, 1, 'V'), V3: range(-4, 4, 1, 'V'), V4: range(-4, 4, 1, 'V'), V5: range(-4, 4, 1, 'V'),
      w1: range(1, 2, 1, 'm'), w2: range(1, 2, 1, 'm'), w3: range(1, 2, 1, 'm'), w4: range(1, 2, 1, 'm'), w5: range(1, 2, 1, 'm'),
    },
    derive: ($) => {
      const Vs = [$.V0, $.V1, $.V2, $.V3, $.V4, $.V5];
      const ws = [$.w1, $.w2, $.w3, $.w4, $.w5];
      const E = ws.map((w, i) => (Vs[i + 1] === Vs[i] ? 0 : -(Vs[i + 1] - Vs[i]) / w));
      const mags = E.map(Math.abs);
      const sorted = [...mags].sort((a, b) => b - a);
      return { Vs, ws, E, sign: E.map(Math.sign), biggest: mags.indexOf(sorted[0]), sorted };
    },
    // Like the class sheet's graph: a flat piece, a rising one, a falling one, and one clearly steepest.
    valid: ($) => $.sign.includes(0) && $.sign.includes(1) && $.sign.includes(-1) && $.sorted[0] - $.sorted[1] >= 1,
    text: () => 'The graph shows the electric potential V along the x-axis, in five straight pieces A to E. Sketch $E_x$ against $x$: on each piece, is $E_x$ positive, negative or zero, and on which piece is the field strongest?',
    figure: ($) => vGraphSVG([0, ...$.ws.map((_, i) => $.ws.slice(0, i + 1).reduce((a, b) => a + b, 0))], $.Vs),
    parts: [
      ...[...PIECES].map((p, i) => mc(`s${p}`, E_SIGNS, ($) => $.sign[i], { label: `$E_x$ on ${p}` })),
      mc('big', [...PIECES].map((p, i) => [i, `On ${p}`]), ($) => $.biggest, { label: 'Where is the field strongest?' }),
    ],
    hints: [
      String.raw`$E_x = -\dfrac{dV}{dx}$: read the *slope* of each piece, not its height. Flat means $E_x = 0$, even where $V$ is large or negative.`,
      'V falling to the right means E points toward +x; V rising means E points toward −x. The E graph is a flat step on each piece, tallest where V is steepest.',
    ],
    steps: ($) => [
      ...$.E.map((e, i) => {
        const dV = $.Vs[i + 1] - $.Vs[i];
        if (!dV) return String.raw`${PIECES[i]}: V is flat, so $E_x = 0$.`;
        return String.raw`${PIECES[i]}: V ${dV > 0 ? 'rises' : 'falls'} ${Math.abs(dV)} V over ${$.ws[i]} m, so $E_x = ${texNum(e)}\ \text{V/m}$ (toward ${e > 0 ? '+' : '−'}x).`;
      }),
      `So the E graph is a flat step on each piece, zero on the flat ones, and tallest on ${PIECES[$.biggest]}, the steepest piece of V.`,
    ],
    cases: [
      // The class sheet's shape, on our own numbers: flat, a steep drop, flat, a gentle rise, a steep drop.
      kase('Class Activity 3 #7', { V0: 3, V1: 3, V2: -2, V3: -2, V4: 1, V5: -3, w1: 2, w2: 1, w3: 1, w4: 2, w5: 1 }, { sA: 0, sB: 1, sC: 0, sD: -1, sE: 1, big: 1 }),
    ],
  }),
  problem({
    ...E3, id: 'e3.38.V-cubic', ch: '38', src: 'Worksheet 3 #13', title: 'Where the field vanishes, from V(x)', kind: 'numeric', level: 3, topics: ['potential', 'gradient'],
    vars: { a: range(1, 4, 1, 'V/m³'), b: range(-24, -3, 1, 'V/m²'), c: range(1, 30, 1, 'V/m'), d: range(0, 5, 1, 'V') },
    derive: ($) => {
      // E = 0 where dV/dx = 3a x² + 2b x + c = 0.
      const disc = 4 * $.b * $.b - 12 * $.a * $.c;
      const r = Math.sqrt(Math.max(disc, 0));
      const x1 = (-2 * $.b - r) / (6 * $.a);
      const x2 = (-2 * $.b + r) / (6 * $.a);
      const V = (x) => $.a * x ** 3 + $.b * x ** 2 + $.c * x + $.d;
      return { disc, x1, x2, dV: V(x2) - V(x1) };
    },
    valid: ($) => $.disc > 20 && $.x1 > 0.1 && $.x2 < 12 && $.x2 - $.x1 > 0.5,
    text: (T) => String.raw`Along the x-axis the potential is $V(x) = (${T.a}\ \text{V/m}^3)x^3 - (${String(-Number(T.b))}\ \text{V/m}^2)x^2 + (${T.c}\ \text{V/m})x + ${T.d}\ \text{V}$. Find the two positions where the electric field is zero, and the potential difference between them, $V(x_2) - V(x_1)$ with $x_1 < x_2$.`,
    parts: [
      num('x1', ($) => $.x1, 'm', { label: String.raw`$x_1$ (the smaller)` }),
      num('x2', ($) => $.x2, 'm', { label: String.raw`$x_2$ (the larger)` }),
      num('dV', ($) => $.dV, 'V', { label: String.raw`$V(x_2) - V(x_1)$`, abs: 0.05 }),
    ],
    hints: [
      String.raw`$E_x = -\dfrac{dV}{dx}$, so $E = 0$ exactly where $\dfrac{dV}{dx} = 0$ — the flat spots of $V(x)$. That is a quadratic: use the quadratic formula.`,
      String.raw`The potential difference comes from $V$ itself, not from its derivative: put each $x$ back into $V(x)$ and subtract.`,
    ],
    steps: ($) => [
      String.raw`$\dfrac{dV}{dx} = ${texNum(3 * $.a)}x^2 ${$.b < 0 ? '-' : '+'} ${texNum(Math.abs(2 * $.b))}x + ${texNum($.c)} = 0$`,
      String.raw`$x = \dfrac{${texNum(-2 * $.b)} \pm \sqrt{${texNum(4 * $.b * $.b)} - ${texNum(12 * $.a * $.c)}}}{${texNum(6 * $.a)}} \;\Rightarrow\; x_1 = ${texNum($.x1)}\ \text{m},\ x_2 = ${texNum($.x2)}\ \text{m}$`,
      String.raw`$V(x_2) - V(x_1) = ${texNum($.a)}(x_2^3 - x_1^3) ${$.b < 0 ? '-' : '+'} ${texNum(Math.abs($.b))}(x_2^2 - x_1^2) + ${texNum($.c)}(x_2 - x_1) = ${texNum($.dV)}\ \text{V}$ (the constant ${texNum($.d)} V cancels)`,
    ],
    cases: [kase('Worksheet 3 #13', { a: 3, b: -18, c: 20, d: 2 }, { x1: 0.6667, x2: 3.333, dV: -28.44 })],
  }),
  problem({
    ...E3, id: 'e3.38.uniform-path', ch: '38', lab: 'potential', src: 'Worksheet 3 #2, #4', title: 'Uniform field: only the part along E counts', kind: 'numeric', level: 2, topics: ['potential', 'work'],
    vars: {
      E: range(200, 3000, 100, 'N/C'), r1: range(0.1, 0.6, 0.1, 'm'), r2: range(0.1, 0.8, 0.1, 'm'),
      q: range(10, 400, 10, 'μC', 1e-6), s: SIGN, m: range(1, 50, 1, 'g', 1e-3),
    },
    derive: ($) => {
      // Field along +x. B at the origin, A a distance r1 across the field, C a distance r2 along it.
      const dV = -$.E * $.r2; // V_C − V_A: only the displacement along E counts
      return { dV, Wext: $.s * $.q * dV, r3: Math.hypot($.r1, $.r2) };
    },
    text: (T, $, f) => `A uniform ${T.E} N/C field points along +x. Point B is at the origin, point A is ${T.r1} m from B straight across the field (along −z), and point C is ${T.r2} m from B along the field (along x) — so A and C are ${f($.r3)} m apart. A ${T.s} ${T.q} μC sphere of mass ${T.m} g is carried slowly from A to C. Find $V_C - V_A$, $V_B - V_A$, and the work the carrier must do.`,
    parts: [
      num('dV', ($) => $.dV, 'V', { label: String.raw`$V_C - V_A$` }),
      num('dVBA', () => 0, 'V', { label: String.raw`$V_B - V_A$`, abs: 0.01 }),
      num('Wext', ($) => $.Wext, 'J', { label: String.raw`$W_{\text{ext}}$, A → C` }),
    ],
    hints: [
      String.raw`$\Delta V = -\vec{E}\cdot\Delta\vec{r}$: only the part of the move along $\vec{E}$ changes $V$. The distance across the field, the straight-line distance, and the mass do not enter.`,
      String.raw`Carried slowly, the kinetic energy does not change, so $W_{\text{ext}} = \Delta U = q\,\Delta V$.`,
    ],
    steps: ($) => [
      String.raw`A and B lie on the same equipotential (the move between them is across the field): $V_B - V_A = 0$.`,
      String.raw`$V_C - V_A = V_C - V_B = -E\,r_2 = -${pq($.E, 'N/C')}${pq($.r2, 'm')} = ${texNum($.dV)}\ \text{V}$`,
      String.raw`$W_{\text{ext}} = q\,(V_C - V_A) = ${pq($.s * $.q, 'C')}${pq($.dV, 'V')} = ${texNum($.Wext)}\ \text{J}$ — the mass and the ${texNum($.r3)} m diagonal were never needed.`,
    ],
    sim: {
      scenario: 'v-plates',
      setup(s, $) {
        s.charges = [];
        s.extraE = { x: $.E, y: 0, z: 0 };
        // All in the xz work plane: A across the field from B, C along it. The probe is C.
        s.pathA = { x: 0, y: 0, z: -$.r1 };
        s.marks = [
          { label: 'B', x: 0, y: 0, z: 0 },
          { label: 'C', x: $.r2, y: 0, z: 0 },
        ];
        s.probe = { x: $.r2, y: 0, z: 0 };
        s.hideProbeTag = true; // the probe sits on the C mark
        s.qTest = $.s * $.q;
      },
      read: (c) => ({ dV: c.V - c.VA }),
    },
    cases: [kase('Worksheet 3 #4', { E: 1000, r1: 0.3, r2: 0.4, q: 200, s: 1, m: 20 }, { dV: -400, dVBA: 0, Wext: -0.08 })],
  }),
  problem({
    ...E3, id: 'e3.38.pe-rank', ch: '38', lab: 'potential', src: 'Worksheet 3 #1, #3, Class Activity 3 #1, #4', title: 'Where is the potential energy largest?', kind: 'conceptual', level: 2, topics: ['potential', 'energy'],
    vars: {
      ask: choice(
        ['neg-max', 'A +Q and a −Q charge sit on the x-axis. A small negative test charge can be placed at P₁ (close to +Q), P₂ (the midpoint), P₃ (close to −Q) or P₄ (very far away). Where is its potential energy largest?'],
        ['pos-max', 'A +Q and a −Q charge sit on the x-axis. A small positive test charge can be placed at P₁ (close to +Q), P₂ (the midpoint), P₃ (close to −Q) or P₄ (very far away). Where is its potential energy largest?'],
        ['electron-along', 'An electron moves in the direction of the electric field. What happens to its potential energy and to the electric potential where it is?'],
        ['pair-apart', 'Two point charges of opposite sign are pulled farther and farther apart. What happens to the potential energy of the pair?'],
      ),
    },
    text: (T) => T.ask,
    parts: [
      mc('ans', ($) => ({
        'electron-along': [
          ['downDown', 'Both its potential energy and the electric potential decrease'],
          ['upUp', 'Both its potential energy and the electric potential increase'],
          ['upDown', 'Its potential energy increases and the electric potential decreases'],
          ['downUp', 'Its potential energy decreases and the electric potential increases'],
        ],
        'pair-apart': [['Udown', 'It decreases'], ['Usame', 'It stays the same'], ['Uup', 'It increases']],
      })[$.ask] ?? [['p1', 'At P₁, close to +Q'], ['p2', 'At P₂, the midpoint'], ['p3', 'At P₃, close to −Q'], ['p4', 'At P₄, far away']],
      ($) => ({ 'neg-max': 'p3', 'pos-max': 'p1', 'electron-along': 'upDown', 'pair-apart': 'Uup' })[$.ask]),
    ],
    hints: [String.raw`$U = qV$. First find where $V$ is high and low (high near $+Q$, low near $-Q$, zero at the midpoint and far away), then let the sign of $q$ flip the ranking.`],
    steps: ($) => [
      $.ask === 'neg-max'
        ? String.raw`$V$ is most negative near $-Q$. With $q < 0$, $U = qV$ is then most *positive*: a negative charge has its largest potential energy where the potential is lowest.`
        : $.ask === 'pos-max'
          ? String.raw`$V$ is highest near $+Q$, and with $q > 0$, $U = qV$ follows $V$: largest at P₁.`
          : $.ask === 'pair-apart'
            ? String.raw`$U = \dfrac{kq_1q_2}{r}$ is *negative* for opposite charges. Pulling them apart makes $r$ larger and $U$ less negative — closer to zero, so it increases. You have to do work to separate things that attract.`
            : String.raw`Along $\vec{E}$ the potential always falls. The electron's $q$ is negative, so $U = qV$ rises as $V$ falls — it is being pushed against the force on it, so it slows down and its kinetic energy drops.`,
    ],
    sim: {
      scenario: 'v-dipole',
      setup(s, $) {
        // Every version is drawn in the x–y plane, seen from above, like the other point-charge setups.
        if ($.ask === 'electron-along') {
          applyScenario('potential', 'v-plates', s);
          layout(s, { pathA: { x: -0.15, y: 0 }, probe: { x: 0.15, y: 0 } });
          s.extraE = { x: 2000, y: 0, z: 0 };
          s.qTest = -1e-6;
          return 'A −1 μC test charge stands in for the electron (only its sign matters). It starts at A and moves along E to the probe.';
        }
        if ($.ask === 'pair-apart') {
          applyScenario('potential', 'v-plus', s);
          layout(s, { charges: [charge(1e-6, 0, 0)], pathA: { x: 0.15, y: 0 }, probe: { x: 0.45, y: 0 } });
          s.qTest = -1e-6;
          return 'One charge is fixed at the origin. The other, the −1 μC test charge, starts at A and is pulled out to the probe.';
        }
        // The four candidate spots, with V and U = qV under each once the problem is solved. Field
        // lines off, so the V colors read clearly.
        layout(s, {
          charges: [charge(2e-6, -0.4, 0), charge(-2e-6, 0.4, 0)],
          probe: { x: 0, y: -0.45 },
          marks: [
            { id: 'p1', label: 'P₁', x: -0.2, y: 0 },
            { id: 'p2', label: 'P₂', x: 0, y: 0 },
            { id: 'p3', label: 'P₃', x: 0.2, y: 0 },
            { id: 'p4', label: 'P₄ (far away)', x: 0, y: 0.6 },
          ],
        });
        s.markShow = 'VU';
        s.hideA = true;
        s.show.lines = false;
        s.qTest = $.ask === 'neg-max' ? -1e-6 : 1e-6;
        return 'P₄ stands in for “very far away”: the lab can’t draw infinity, so it sits out on the line halfway between the charges, where V matches its value far away. The white probe is the test charge; click to move it.';
      },
      read(c, s, $) {
        if ($.ask === 'neg-max' || $.ask === 'pos-max') {
          const U = c.marks.map((m) => m.U);
          return { ans: s.marks[U.indexOf(Math.max(...U))].id };
        }
        const dV = c.V - c.VA;
        const dU = s.qTest * dV;
        if ($.ask === 'pair-apart') return { ans: dU > 0 ? 'Uup' : dU < 0 ? 'Udown' : 'Usame' };
        if (dU === 0 || dV === 0) return {};
        return { ans: `${dU > 0 ? 'up' : 'down'}${dV > 0 ? 'Up' : 'Down'}` };
      },
    },
    cases: [
      kase('negative test charge', { ask: 'neg-max' }, { ans: 'p3' }),
      kase('Worksheet 3 #3', { ask: 'electron-along' }, { ans: 'upDown' }),
      kase('Class Activity 3 #1', { ask: 'pair-apart' }, { ans: 'Uup' }),
    ],
  }),
  problem({
    ...E3, id: 'e3.38.moving-charge-energy', ch: '38', lab: 'potential', src: 'Class Activity 3 #4', title: 'A moving charge: V, U and K together', kind: 'conceptual', level: 2, topics: ['potential', 'energy'],
    vars: {
      p: choice(['electron', 'electron'], ['proton', 'proton']),
      dir: choice([1, 'along'], [-1, 'against']),
    },
    derive: ($) => {
      const q = $.p === 'electron' ? -1 : 1;
      const dV = -$.dir; // along E the potential falls
      const dU = q * dV; // U = qV
      return { q, dV, dU, dK: -dU }; // only the electric force acts, so K + U is fixed
    },
    text: (T, $) => `${$.p === 'electron' ? 'An' : 'A'} ${T.p} is already moving, and it travels ${T.dir} the direction of a uniform electric field with only the electric force acting on it. Which statements are true?`,
    parts: [
      mc('ans', [
        ['Vdown', 'It moves toward lower electric potential'],
        ['Vup', 'It moves toward higher electric potential'],
        ['Uup', 'Its electric potential energy increases'],
        ['Udown', 'Its electric potential energy decreases'],
        ['Kup', 'Its kinetic energy increases'],
        ['Kdown', 'Its kinetic energy decreases'],
      ], ($) => [$.dV < 0 ? 'Vdown' : 'Vup', $.dU > 0 ? 'Uup' : 'Udown', $.dK > 0 ? 'Kup' : 'Kdown'], { multi: true }),
    ],
    hints: [
      String.raw`Three separate questions: which way $V$ goes (only the direction of motion relative to $\vec{E}$ matters), which way $U = qV$ goes (the sign of $q$ matters), and which way $K$ goes ($K + U$ stays fixed).`,
    ],
    steps: ($) => [
      $.dV < 0 ? String.raw`Along $\vec{E}$ the potential falls, so it moves toward lower $V$.` : String.raw`Against $\vec{E}$ the potential rises, so it moves toward higher $V$.`,
      String.raw`$U = qV$ with $q ${$.q < 0 ? '<' : '>'} 0$, so $U$ ${$.dU > 0 ? 'increases' : 'decreases'}${$.q < 0 ? ', the opposite way to $V$' : ', the same way as $V$'}.`,
      String.raw`Only the electric force acts, so $K + U$ is constant: $K$ ${$.dK > 0 ? 'increases and it speeds up' : 'decreases and it slows down'}. It is moving ${$.dK > 0 ? 'with' : 'against'} the force on it.`,
    ],
    sim: {
      scenario: 'v-plates',
      setup(s, $) {
        layout(s, { pathA: { x: -0.15 * $.dir, y: 0 }, probe: { x: 0.15 * $.dir, y: 0 } });
        s.extraE = { x: 2000, y: 0, z: 0 };
        s.qTest = $.q * 1e-6;
        return `A ${$.q < 0 ? '−' : '+'}1 μC test charge stands in for the ${$.p} (only its sign matters). It starts at A and moves to the probe.`;
      },
      read(c, s) {
        const dV = c.V - c.VA;
        const dU = s.qTest * dV;
        if (!dV) return {};
        return { ans: [dV < 0 ? 'Vdown' : 'Vup', dU > 0 ? 'Uup' : 'Udown', dU > 0 ? 'Kdown' : 'Kup'] };
      },
    },
    cases: [
      kase('Class Activity 3 #4', { p: 'electron', dir: 1 }, { ans: ['Vdown', 'Uup', 'Kdown'] }),
      kase('proton against E', { p: 'proton', dir: -1 }, { ans: ['Vup', 'Uup', 'Kdown'] }),
    ],
  }),
  problem({
    ...E3, id: 'e3.38.uniform-rank', ch: '38', lab: 'potential', src: 'Class Activity 3 #2–3', title: 'Uniform field: which point is highest?', kind: 'conceptual', topics: ['potential', 'energy'],
    vars: {
      ask: choice(
        ['V', 'A uniform field points to the right. A and B sit one above the other on the left; C is further right. How do the electric potentials at A, B and C compare?'],
        ['U', 'A uniform field points to the right. A and B sit one above the other on the left; C is further right. Where does a positive charge have the most electric potential energy?'],
      ),
    },
    text: (T) => T.ask,
    parts: [
      mc('ans', ($) => ($.ask === 'V'
        ? [
            ['same', 'All three are the same, because the field is uniform'],
            ['Chigh', 'A and B are equal, and C is higher'],
            ['ABhigh', 'A and B are equal, and C is lower'],
            ['AgtB', 'A is higher than B, and B is higher than C'],
          ]
        : [
            ['CmostU', 'At C'],
            ['sameU', 'The same at all three, because the field is uniform'],
            ['ABmostU', 'At A and B equally, more than at C'],
            ['AmostU', 'At A, more than at B or C'],
          ]), ($) => ($.ask === 'V' ? 'ABhigh' : 'ABmostU')),
    ],
    hints: [String.raw`$\Delta V = -\vec{E}\cdot\Delta\vec{r}$: only motion *along* $\vec{E}$ changes $V$. A move across the field stays on one equipotential.`],
    steps: ($) => [
      String.raw`A and B differ only across the field, so they share an equipotential. C is further along $\vec{E}$, and $V$ falls along $\vec{E}$, so $V_C < V_A = V_B$.`,
      $.ask === 'U'
        ? String.raw`For $q > 0$, $U = qV$ follows $V$: largest at A and B. "Uniform field" means uniform *force*, not uniform potential.`
        : 'A uniform field means the potential falls at a steady rate — not that it is the same everywhere.',
    ],
    sim: {
      scenario: 'v-plates',
      setup(s) {
        s.charges = [];
        s.extraE = { x: 1000, y: 0, z: 0 };
        s.pathA = { x: -0.1, y: 0, z: -0.08 };
        // All in the xz work plane: A is the gold path marker, B sits in front of it (across E), C further along E.
        // The probe starts on C.
        s.marks = [
          { label: 'B', x: -0.1, y: 0, z: 0 },
          { label: 'C', x: 0.1, y: 0, z: 0 },
        ];
        s.probe = { x: 0.1, y: 0, z: 0 };
        s.hideProbeTag = true; // the probe sits on the C mark
        s.qTest = 1e-6;
      },
    },
    cases: [kase('Class Activity 3 #3', { ask: 'V' }, { ans: 'ABhigh' }), kase('Class Activity 3 #2', { ask: 'U' }, { ans: 'ABmostU' })],
  }),
  problem({
    ...E3, id: 'e3.38.uniform-zero-V', ch: '38', lab: 'potential', src: 'Class Activity 3 #6', title: 'Uniform field: the field, V at B, and where V = 0', kind: 'numeric', level: 2, topics: ['potential'],
    vars: { dV: range(20, 400, 10, 'V'), d: range(0.1, 1.5, 0.05, 'm'), VA: range(100, 1000, 10, 'V') },
    derive: ($) => {
      const E = $.dV / $.d;
      const VB = $.VA - $.dV;
      return { E, VB, zB: VB / E };
    },
    valid: ($) => $.VA > $.dV,
    text: (T) => `A uniform electric field points from A toward B, which are ${T.d} m apart, and the potential difference between them is ${T.dV} V. A is at ${T.VA} V. Find the field strength, the potential at B, and how far past B (continuing along the field) the potential is zero.`,
    parts: [
      num('E', ($) => $.E, 'V/m'),
      num('VB', ($) => $.VB, 'V', { label: String.raw`$V_B$` }),
      num('zB', ($) => $.zB, 'm', { label: 'Distance past B to V = 0' }),
    ],
    hints: [
      String.raw`$|\Delta V| = E\,d$ in a uniform field, and $V$ falls in the direction $\vec{E}$ points.`,
      String.raw`Keep going along $\vec{E}$ from B: $V$ keeps falling at $E$ volts per metre until it reaches zero.`,
    ],
    steps: ($) => [
      String.raw`$E = \dfrac{\Delta V}{d} = \dfrac{${qty($.dV, 'V')}}{${qty($.d, 'm')}} = ${texNum($.E)}\ \text{V/m}$`,
      String.raw`$V_B = V_A - \Delta V = ${qty($.VA, 'V')} - ${qty($.dV, 'V')} = ${texNum($.VB)}\ \text{V}$ — lower, because B is downstream along $\vec{E}$.`,
      String.raw`$V = 0$ a further $\dfrac{V_B}{E} = \dfrac{${qty($.VB, 'V')}}{${qty($.E, 'V/m')}} = ${texNum($.zB)}\ \text{m}$ past B, on the side away from A.`,
    ],
    sim: {
      scenario: 'v-plates',
      // Field along −x with V = 0 at the origin: then V = E·x, so A sits at x = V_A/E and B at V_B/E.
      setup(s, $) {
        s.charges = [];
        s.extraE = { x: -$.E, y: 0, z: 0 };
        s.pathA = { x: $.VA / $.E, y: 0, z: 0 };
        s.probe = { x: $.VB / $.E, y: 0, z: 0 };
        s.qTest = 1e-6;
      },
      read: (c, s, $) => ({ VB: c.V, '@V at A': [c.VA, $.VA] }),
    },
    cases: [kase('Class Activity 3 #6', { dV: 120, d: 0.5, VA: 200 }, { E: 240, VB: 80, zB: 0.3333 })],
  }),
  problem({
    ...E3, id: 'e3.39.speed-with-v0', ch: '39', src: 'Practice 39 #4', title: 'Final speed when it was already moving', kind: 'numeric', level: 2, topics: ['potential', 'energy'],
    vars: { v0: range(0.5, 4, 0.1, '×10⁵ m/s', 1e5), V: range(50, 400, 10, 'V') },
    // q and m are in scope so the symbolic answer can be written the way the sheet states it.
    derive: ($) => ({ q: QE, m: MP, vf: Math.sqrt($.v0 ** 2 + (2 * QE * $.V) / MP) }),
    text: (T) => `A proton already moving at ${T.v0} × 10⁵ m/s is accelerated through a further potential difference of ${T.V} V. What is its final speed? (q = 1.60 × 10⁻¹⁹ C, m_proton = 1.67 × 10⁻²⁷ kg)`,
    parts: [
      sym('v_sym', 'sqrt(v0^2 + 2*q*V/m)', { v0: 'm/s', V: 'V', q: 'C', m: 'kg' }, ($) => $.vf, { unit: 'm/s', label: String.raw`$v_f$ as a formula` }),
      num('vf', ($) => $.vf, 'm/s', { label: String.raw`$v_f$` }),
    ],
    hints: [
      String.raw`Energy, not kinematics: $\tfrac12 mv_f^2 - \tfrac12 mv_0^2 = q\Delta V$.`,
      String.raw`The starting speed does not vanish — you cannot use $v_f = \sqrt{2q\Delta V/m}$ unless the particle started at rest.`,
    ],
    steps: ($, f) => [
      String.raw`$\tfrac12 mv_f^2 = \tfrac12 mv_0^2 + q\Delta V$`,
      String.raw`$v_f = \sqrt{v_0^2 + \dfrac{2q\Delta V}{m}} = \sqrt{${pq($.v0, 'm/s')}^2 + \dfrac{2${pq(QE, 'C')}${pq($.V, 'V')}}{${qty(MP, 'kg')}}} = ${texNum($.vf)}\ \text{m/s}$`,
    ],
    cases: [kase('#4', { v0: 1.5, V: 100 }, { vf: 2.046e5 }, { key: '2.05 × 10⁵ m/s' })],
  }),
  problem({
    ...E3, id: 'e3.39.deltaV-two-radii', ch: '39', lab: 'potential', src: 'Practice 39 #8–10', title: 'Potential difference between two distances', kind: 'numeric', level: 2, topics: ['potential'],
    vars: { q: range(1, 8, 0.5, 'μC', 1e-6), s: SIGN, r1: range(1, 6, 0.5, 'm'), r2: range(0.5, 4, 0.5, 'm') },
    derive: ($) => {
      const V1 = (K * $.s * $.q) / $.r1;
      const V2 = (K * $.s * $.q) / $.r2;
      return { V1, V2, dV: V2 - V1 };
    },
    valid: ($) => $.r2 < $.r1 - 0.4,
    text: (T) => `A sphere carrying a ${T.s} ${T.q} μC net charge sits at the origin. Find the potential difference between a point ${T.r1} m away and a point ${T.r2} m away — that is, V at the nearer point minus V at the farther one.`,
    parts: [
      num('dV', ($) => $.dV, 'V', { label: String.raw`$\Delta V$` }),
    ],
    hints: [String.raw`$V$ depends only on the distance, so work out $kq/r$ at each radius and subtract. The direction you subtract sets the sign.`],
    steps: ($, f) => [
      String.raw`$V(${texNum($.r2)}\,\text{m}) = ${texNum($.V2)}\ \text{V}$, $V(${texNum($.r1)}\,\text{m}) = ${texNum($.V1)}\ \text{V}$`,
      String.raw`$\Delta V = ${texNum($.V2)} - (${texNum($.V1)}) = ${texNum($.dV)}\ \text{V}$`,
    ],
    sim: {
      scenario: 'v-plus',
      setup: potSetup(($) => [charge($.s * $.q, 0, 0)], ($) => ({ x: $.r2, y: 0 }), ($) => ({ x: $.r1, y: 0 })),
      read: (c) => ({ dV: c.V - c.VA }),
    },
    cases: [
      kase('#8', { q: 4, s: 1, r1: 4, r2: 2 }, { dV: 8987 }, { key: '+9000 V', note: 'The sheet phrases it "between x = 4.0 m and y = 2.0 m"; the key\'s sign means V(2 m) − V(4 m).' }),
      kase('#9', { q: 4, s: -1, r1: 4, r2: 2 }, { dV: -8987 }, { key: '−9000 V' }),
    ],
  }),
  problem({
    ...E3, id: 'e3.39.equipotential-map', ch: '39', src: 'Practice 39 #21–25, Class Activity 3 #13', title: 'Reading an equipotential map', kind: 'numeric', level: 3, topics: ['potential', 'equipotential', 'work'],
    vars: {
      VA: range(-200, -40, 20, 'V'),
      step: range(20, 80, 20, 'V'),
      q: range(1, 8, 1, 'μC', 1e-6),
    },
    derive: ($) => {
      // Six equally spaced equipotentials, A (lowest) through G (highest); H sits on G's surface.
      const VG = $.VA + 6 * $.step;
      const dV = $.VA - VG; // A relative to G
      return { VG, dV, Wga: $.q * (VG - $.VA) * -1, WgaAbs: Math.abs($.q * dV), Wgh: 0, ve: Math.sqrt((2 * QE * Math.abs(3 * $.step)) / ME) };
    },
    text: (T) => `An equipotential map between two charged conductors is labelled A, B, … G, with A at ${T.VA} V and each successive surface ${T.step} V higher, so G is the highest. Point H lies on the same surface as G. (a) Find V_A − V_G. (b) Find the work needed to move a +${T.q} μC charge from G to A. (c) Find the work needed to move it from G to H.`,
    parts: [
      num('dV', ($) => $.dV, 'V', { label: String.raw`$V_A - V_G$` }),
      num('Wga', ($) => $.Wga, 'J', { label: String.raw`$W_{G \to A}$` }),
      num('Wgh', ($) => $.Wgh, 'J', { label: String.raw`$W_{G \to H}$`, abs: 1e-12 }),
    ],
    hints: [
      String.raw`$W = q\,\Delta V$ with $\Delta V = V_{\text{final}} - V_{\text{initial}}$.`,
      String.raw`H is on the same equipotential as G, so $\Delta V = 0$ — and the path between them does not matter.`,
    ],
    steps: ($, f) => [
      String.raw`$V_G = V_A + 6\times${qty($.step, 'V')} = ${qty($.VG, 'V')}$, so $V_A - V_G = ${qty($.VA, 'V')} - ${qty($.VG, 'V')} = ${texNum($.dV)}\ \text{V}$`,
      String.raw`$W_{G\to A} = q(V_A - V_G) = ${pq($.q, 'C')}${pq($.dV, 'V')} = ${texNum($.Wga)}\ \text{J}$`,
      String.raw`$W_{G\to H} = q(V_H - V_G) = 0$ — H and G are on the same equipotential.`,
    ],
    cases: [kase('#21–23', { VA: -160, step: 20, q: 4 }, { dV: -120, Wga: -4.8e-4, Wgh: 0 }, { key: '21) −320 V  22) 1.28×10⁻³ J  23) 0 J', note: 'Values depend on the printed map; the structure (ΔV, W = qΔV, and W = 0 along an equipotential) is what this template drills.' })],
  }),
  problem({
    ...E3, id: 'e3.39.equipotential-props', ch: '39', src: 'Practice 39 #18–20, Class Activity 3 #12', title: 'What an equipotential surface is', kind: 'conceptual', topics: ['potential', 'equipotential'],
    vars: {
      ask: choice(
        ['name', 'A surface on which every point is at the same potential is called'],
        ['orient', 'An equipotential surface must be'],
        ['spacing', 'The closer together the equipotential surfaces are drawn, the'],
        ['work', 'A negative charge is carried from point A to point B along an equipotential surface. What must be true?'],
      ),
    },
    text: (T) => T.ask,
    parts: [
      mc('ans', ($) => ({
        name: [['dielectric', 'a dielectric surface'], ['equip', 'an equipotential surface'], ['gauss', 'a Gaussian surface']],
        orient: [['parallel', 'parallel to the electric field at every point'], ['perp', 'perpendicular to the electric field at every point'], ['flat', 'a flat plane']],
        spacing: [
          ['smaller', 'smaller the change in potential over a given distance, and the weaker the electric field'],
          ['bigger', 'larger the change in potential over a given distance, and the stronger the electric field'],
        ],
        work: [
          ['fieldWork', 'The field does positive work on it, because the charge is negative'],
          ['needed', 'Some work is required, because the charge is negative'],
          ['none', 'No work is required'],
          ['distance', 'The work depends on the distance from A to B'],
        ],
      })[$.ask], ($) => ({ name: 'equip', orient: 'perp', spacing: 'bigger', work: 'none' })[$.ask]),
    ],
    hints: [String.raw`$\vec{E}$ points straight downhill in $V$, and the steepest descent is always perpendicular to a level surface.`],
    steps: ($) => [
      $.ask === 'orient'
        ? String.raw`If $\vec{E}$ had a component along the surface, moving along it would change $V$ — and then it would not be an equipotential.`
        : $.ask === 'spacing'
          ? String.raw`$|\vec{E}| = \left|\dfrac{dV}{dx}\right|$: crowded surfaces mean a steep slope, which means a strong field. On a topographic map, closely spaced contours mean a steep hill.`
          : $.ask === 'work'
            ? String.raw`$W = q\,\Delta V$, and along an equipotential $\Delta V = 0$, so no work is needed, whatever the sign of the charge and however far apart A and B are.`
            : String.raw`"Equipotential" literally means equal potential — every point on the surface is at the same $V$.`,
    ],
    cases: [
      kase('#18', { ask: 'name' }, { ans: 'equip' }, { key: 'E)' }),
      kase('#19', { ask: 'orient' }, { ans: 'perp' }, { key: 'B)' }),
      kase('#20', { ask: 'spacing' }, { ans: 'bigger' }, { key: 'A)' }),
      kase('Class Activity 3 #12', { ask: 'work' }, { ans: 'none' }),
    ],
  }),
  problem({
    ...E3, id: 'e3.39.sphere-accelerate', ch: '39', src: 'Worksheet 3 #6, Practice 39 #1–2, Class Activity 3 #8', title: 'A charged sphere accelerated through ΔV', kind: 'numeric', topics: ['potential', 'energy'],
    vars: { m: range(0.5, 20, 0.5, 'g', 1e-3), q: range(5, 200, 5, 'μC', 1e-6), V: range(500, 20000, 500, 'V') },
    derive: ($) => {
      const K = $.q * $.V;
      return { K, v: Math.sqrt((2 * K) / $.m) };
    },
    text: (T) => `A small sphere of mass ${T.m} g carrying +${T.q} μC starts from rest and is accelerated through a potential difference of ${T.V} V. Find the kinetic energy it gains and its final speed.`,
    parts: [
      sym('v_sym', 'sqrt(2*q*V/m)', { q: 'C', V: 'V', m: 'kg' }, ($) => $.v, { unit: 'm/s', label: String.raw`$v$ as a formula` }),
      num('K', ($) => $.K, 'J', { label: String.raw`$\Delta K$` }),
      num('v', ($) => $.v, 'm/s'),
    ],
    hints: [String.raw`Energy is conserved: the field's work $|q|\Delta V$ all becomes kinetic energy, $\tfrac12 mv^2 = |q|\,\Delta V$. Convert grams to kilograms first.`],
    steps: ($) => [
      String.raw`$\Delta K = |q|\,\Delta V = ${pq($.q, 'C')}${pq($.V, 'V')} = ${texNum($.K)}\ \text{J}$`,
      String.raw`$v = \sqrt{\dfrac{2\,\Delta K}{m}} = \sqrt{\dfrac{2${pq($.K, 'J')}}{${qty($.m, 'kg')}}} = ${texNum($.v)}\ \text{m/s}$`,
    ],
    cases: [
      kase('Worksheet 3 #6', { m: 2, q: 50, V: 10000 }, { K: 0.5, v: 22.36 }),
      kase('Class Activity 3 #8', { m: 0.02, q: 100, V: 100 }, { K: 0.01, v: 31.62 }),
    ],
  }),
  problem({
    ...E3, id: 'e3.39.rod-axis-V', ch: '39', lab: 'integral', src: 'Practice 39 #26, Class Activity 3 #10', title: 'Potential past the end of a line charge', kind: 'derivation', level: 3, topics: ['potential', 'continuous-distribution'],
    vars: { lam: range(-5, 5, 0.1, 'μC/m', 1e-6, { exclude: [0] }), L: range(0.2, 1.2, 0.05, 'm'), a: range(0.05, 0.8, 0.05, 'm') },
    derive: ($) => ({ V: K * $.lam * Math.log(($.L + $.a) / $.a) }),
    text: (T) => `A thin rod of length ${T.L} m carries a uniform λ = ${T.lam} μC/m. Point P lies on the rod's own line, ${T.a} m beyond one end. Find the potential at P.`,
    parts: [
      sym('V_sym', 'k*lam*ln((L + a)/a)', { lam: 'C/m', L: 'm', a: 'm' }, ($) => $.V, { unit: 'V', label: String.raw`$V$ as a formula` }),
      num('V', ($) => $.V, 'V'),
    ],
    hints: [
      String.raw`Put the origin at P and slice the rod: a piece $dx$ at distance $x$ from P carries $dq = \lambda\,dx$ and adds $dV = k\lambda\,dx/x$. The rod runs from $x = a$ to $x = L + a$.`,
      String.raw`$\displaystyle\int \frac{dx}{x} = \ln x$ — so the answer has a logarithm in it.`,
    ],
    steps: ($) => [
      String.raw`$V = \displaystyle\int \frac{k\,dq}{r} = k\lambda\int_{a}^{L+a} \frac{dx}{x} = k\lambda\ln\!\left(\frac{L+a}{a}\right)$`,
      String.raw`$V = ${pq(K, 'N·m²/C²')}${pq($.lam, 'C/m')}\ln\!\left(\dfrac{${qty($.L + $.a, 'm')}}{${qty($.a, 'm')}}\right) = ${texNum($.V)}\ \text{V}$`,
    ],
    sim: {
      scenario: 'rod-off',
      setup(s, $) {
        Object.assign(s.integral, { kind: 'rod', L: $.L, lambda: $.lam, d: 0, x0: $.L / 2 + $.a, quantity: 'V' });
      },
      read: (c) => ({ V: c.integral.analytic.V, V_sym: c.integral.analytic.V }),
    },
    cases: [kase('Practice 39 #26, with numbers', { lam: 2, L: 0.8, a: 0.2 }, { V: 28930 }, {
      key: 'V = kλ[(L + a)/a]',
      note: 'The key drops the logarithm. ∫ dx/x from a to L + a is ln[(L + a)/a], so V = kλ ln[(L + a)/a]; as printed the key is not even dimensionally a potential per unit λ.',
    })],
  }),
  problem({
    ...E3, id: 'e3.39.arc-center-V', ch: '39', lab: 'integral', src: 'Practice 39 #27', title: 'Potential at the centre of a semicircle', kind: 'derivation', level: 2, topics: ['potential', 'continuous-distribution'],
    vars: { lam: range(-5, 5, 0.1, 'μC/m', 1e-6, { exclude: [0] }), R: range(0.05, 0.6, 0.01, 'm') },
    derive: ($) => ({ V: K * $.lam * Math.PI }),
    text: (T) => `A thin wire bent into a semicircle of radius ${T.R} m carries a uniform λ = ${T.lam} μC/m. Find the potential at the centre of the circle. Then: if the radius were doubled with the same λ, what would happen to V?`,
    parts: [
      sym('V_sym', 'k*lam*pi', { lam: 'C/m' }, ($) => $.V, { unit: 'V', label: String.raw`$V$ as a formula` }),
      num('V', ($) => $.V, 'V'),
      mc('double', [['same', 'It stays the same'], ['half', 'It halves'], ['twice', 'It doubles']], 'same', { label: 'Radius doubled, same λ' }),
    ],
    hints: [
      String.raw`Every piece of the arc is the same distance $R$ from the centre, and $V$ is a scalar, so nothing cancels: $V = kQ/R$ with $Q = \lambda\cdot\pi R$.`,
    ],
    steps: ($) => [
      String.raw`$dq = \lambda R\,d\theta$, all at $r = R$: $V = \displaystyle\int_0^{\pi} \frac{k\lambda R\,d\theta}{R} = k\lambda\pi = ${pq(K, 'N·m²/C²')}${pq($.lam, 'C/m')}\pi = ${texNum($.V)}\ \text{V}$`,
      String.raw`$R$ cancels: a bigger arc holds more charge ($\propto R$) but holds it farther away ($\propto 1/R$), so $V$ does not change.`,
    ],
    sim: {
      scenario: 'half-ring',
      setup(s, $) {
        Object.assign(s.integral, { kind: 'ring', Q: $.lam * Math.PI * $.R, a: $.R, R: $.R, y: 0, span: Math.PI, quantity: 'V' });
      },
      read: (c) => ({ V: c.integral.analytic.V, V_sym: c.integral.analytic.V }),
    },
    cases: [kase('Practice 39 #27, with numbers', { lam: 1, R: 0.3 }, { V: 28235, double: 'same' }, { key: 'V = kλπ' })],
  }),
  problem({
    ...E3, id: 'e3.39.disk-V', ch: '39', lab: 'integral', src: 'Practice 39 #28, Class Activity 3 #11', title: 'Potential on the axis of a charged disk', kind: 'derivation', level: 3, topics: ['potential', 'continuous-distribution'],
    vars: { sig: range(0.5, 10, 0.5, 'μC/m²', 1e-6), R: range(0.05, 0.5, 0.01, 'm'), s: range(0.02, 0.8, 0.01, 'm') },
    derive: ($) => ({ V: 2 * Math.PI * K * $.sig * (Math.hypot($.R, $.s) - $.s) }),
    text: (T) => `A thin disk of radius ${T.R} m carries a uniform σ = ${T.sig} μC/m². Find the potential on its axis, ${T.s} m from the centre.`,
    parts: [
      sym('V_sym', '2*pi*k*sig*(sqrt(R^2 + s^2) - s)', { sig: 'C/m^2', R: 'm', s: 'm' }, ($) => $.V, { unit: 'V', label: String.raw`$V$ as a formula` }),
      num('V', ($) => $.V, 'V'),
    ],
    hints: [
      String.raw`Slice the disk into rings. A ring of radius $r'$ and width $dr'$ carries $dq = \sigma\,2\pi r'\,dr'$, and all of it is $\sqrt{r'^2 + s^2}$ from P.`,
      String.raw`$\displaystyle\int_0^R \frac{r'\,dr'}{\sqrt{r'^2+s^2}} = \sqrt{R^2+s^2} - s$`,
    ],
    steps: ($) => [
      String.raw`$V = \displaystyle\int_0^R \frac{k\,\sigma\,2\pi r'\,dr'}{\sqrt{r'^2+s^2}} = 2\pi k\sigma\left(\sqrt{R^2+s^2} - s\right)$`,
      String.raw`$V = 2\pi${pq(K, 'N·m²/C²')}${pq($.sig, 'C/m²')}\left(\sqrt{${pq($.R, 'm')}^2 + ${pq($.s, 'm')}^2} - ${qty($.s, 'm')}\right) = ${texNum($.V)}\ \text{V}$`,
    ],
    sim: {
      scenario: 'disk',
      setup(s, $) {
        Object.assign(s.integral, { kind: 'disk', Q: $.sig * Math.PI * $.R * $.R, R: $.R, y: $.s, quantity: 'V' });
      },
      read: (c) => ({ V: c.integral.analytic.V, V_sym: c.integral.analytic.V }),
    },
    cases: [kase('Practice 39 #28, with numbers', { sig: 2, R: 0.2, s: 0.15 }, { V: 11294 }, { key: 'V = 2πkσ[√(R² + s²) − s]' })],
  }),
  // ================================================================= 40
  problem({
    ...E3, id: 'e3.40.parallel-plate', ch: '40', lab: 'capacitor', title: 'Parallel-plate capacitor', kind: 'numeric', topics: ['capacitance'],
    vars: { A: range(0.01, 2, 0.01, 'm²'), d: range(1, 120, 1, 'mm', 1e-3), V: range(1, 240, 1, 'V') },
    derive: ($) => {
      const C = (EPS0 * $.A) / $.d;
      return { C, Q: C * $.V, E: $.V / $.d, U: 0.5 * C * $.V ** 2 };
    },
    text: (T) => `An air-filled parallel-plate capacitor (treat as vacuum) has plates of area ${T.A} m² separated by ${T.d} mm and is connected to a ${T.V} V battery. Find C, Q, E between the plates, and the stored energy.`,
    parts: [
      sym('U_sym', 'eps0*A*V^2/(2*d)', { A: 'm²', d: 'm', V: 'V' }, ($) => $.U, { unit: 'J', label: String.raw`$U$ as a formula in $A$, $d$, $V$` }),
      num('C', ($) => $.C, 'pF', { scale: 1e-12 }),
      num('Q', ($) => $.Q, 'C'),
      num('E', ($) => $.E, 'V/m'),
      num('U', ($) => $.U, 'J'),
    ],
    steps: ($, f) => [
      String.raw`$C = \dfrac{\varepsilon_0 A}{d} = \dfrac{${pq(EPS0, 'C²/N·m²')}${pq($.A, 'm²')}}{${qty($.d, 'm')}} = ${texNum($.C)}\ \text{F}$`,
      String.raw`$Q = CV = ${pq($.C, 'F')}${pq($.V, 'V')} = ${texNum($.Q)}\ \text{C}$`,
      String.raw`$E = \dfrac{V}{d} = \dfrac{${qty($.V, 'V')}}{${qty($.d, 'm')}} = ${texNum($.E)}\ \text{V/m}$`,
      String.raw`$U = \tfrac{1}{2}CV^2 = \tfrac12${pq($.C, 'F')}${pq($.V, 'V')}^2 = ${texNum($.U)}\ \text{J}$`,
    ],
    sim: {
      scenario: 'cap-12v',
      setup(s, $) {
        s.cap = { A: $.A, d: $.d, V: $.V, Q0: $.Q, mode: 'battery', dielectric: 'vacuum', inserted: true, fill: 1 };
      },
      read: (c) => ({ C: c.cap.C, Q: c.cap.Q, E: c.cap.E, U: c.cap.U }),
    },
    cases: [kase('12 V lab default', { A: 0.04, d: 50, V: 12 }, { C: 7.08, Q: 8.496e-11, E: 240, U: 5.098e-10 }), kase('Ch 40 HW', { A: 1.5, d: 2, V: 12 }, { C: 6637.5 })],
  }),
  problem({
    ...E3, id: 'e3.40.dielectric-battery', ch: '40', lab: 'capacitor', title: 'Inserting a dielectric with the battery connected', kind: 'numeric', level: 2, topics: ['capacitance', 'dielectrics'],
    vars: { A: range(0.01, 2, 0.01, 'm²'), d: range(1, 120, 1, 'mm', 1e-3), V: range(1, 240, 1, 'V'), m: DIEL },
    derive: ($) => {
      const k = kap($.m);
      const C0 = (EPS0 * $.A) / $.d;
      return { k, C0, C: k * C0, Q: k * C0 * $.V };
    },
    text: (T) => `A vacuum capacitor (A = ${T.A} m², d = ${T.d} mm) stays connected to a ${T.V} V battery while a slab of ${T.m} fills the gap. Find the new C and Q, and the factor by which E between the plates changes.`,
    parts: [num('C', ($) => $.C, 'pF', { scale: 1e-12 }), num('Q', ($) => $.Q, 'C'), num('Efac', () => 1, '× E₀', { tol: 0.001, label: 'E / E₀' })],
    steps: ($, f) => [
      String.raw`$C_0 = \dfrac{\varepsilon_0 A}{d} = \dfrac{${pq(EPS0, 'C²/N·m²')}${pq($.A, 'm²')}}{${qty($.d, 'm')}} = ${texNum($.C0)}\ \text{F}$`,
      String.raw`$C = \kappa C_0 = (${texNum($.k)})${pq($.C0, 'F')} = ${texNum($.C)}\ \text{F}$`,
      String.raw`$V$ stays fixed, so $Q = CV = ${pq($.C, 'F')}${pq($.V, 'V')} = ${texNum($.Q)}\ \text{C}$`,
      String.raw`$E = V/d$ is unchanged — a factor of 1`,
    ],
    sim: {
      scenario: 'cap-nylon',
      setup(s, $) {
        s.cap = { A: $.A, d: $.d, V: $.V, Q0: $.C0 * $.V, mode: 'battery', dielectric: $.m, inserted: true, fill: 1 };
      },
      read: (c) => ({ C: c.cap.C, Q: c.cap.Q }),
    },
    cases: [kase('hand', { A: 0.04, d: 50, V: 12, m: 'teflon' }, { C: 14.868, Q: 1.784e-10, Efac: 1 })],
  }),
  problem({
    ...E3, id: 'e3.40.C-dielectric', ch: '40', lab: 'capacitor', src: 'Class Activity 3 #15', title: 'Capacitance with a dielectric', kind: 'numeric', topics: ['capacitance', 'dielectrics'],
    vars: { A: range(0.01, 0.5, 0.01, 'm²'), d: range(0.1, 5, 0.1, 'mm', 1e-3), kap: range(1.5, 8, 0.1, '') },
    derive: ($) => ({ C: ($.kap * EPS0 * $.A) / $.d }),
    text: (T) => `The plates of a parallel-plate capacitor each have an area of ${T.A} m² and sit ${T.d} mm apart, with a dielectric of constant κ = ${T.kap} filling the gap. What is its capacitance?`,
    parts: [num('C', ($) => $.C, 'nF', { scale: 1e-9 })],
    hints: [String.raw`A dielectric multiplies the vacuum capacitance by $\kappa$: $C = \dfrac{\kappa\varepsilon_0 A}{d}$. Put $d$ in metres first.`],
    steps: ($) => [String.raw`$C = \dfrac{\kappa\varepsilon_0 A}{d} = \dfrac{(${texNum($.kap)})(8.85\times 10^{-12})(${texNum($.A)})}{${texNum($.d)}} = ${texNum($.C)}\ \text{F}$`],
    cases: [kase('Class Activity 3 #15', { A: 0.06, d: 0.4, kap: 2.4 }, { C: 3.186 })],
  }),
  problem({
    ...E3, id: 'e3.40.dielectric-isolated', ch: '40', lab: 'capacitor', src: 'Class Activity 3 #14', title: 'Inserting a dielectric after disconnecting', kind: 'numeric', level: 2, topics: ['capacitance', 'dielectrics', 'energy'],
    vars: { A: range(0.01, 2, 0.01, 'm²'), d: range(1, 120, 1, 'mm', 1e-3), V0: range(1, 240, 1, 'V'), m: DIEL },
    derive: ($) => {
      const k = kap($.m);
      const C0 = (EPS0 * $.A) / $.d;
      const Q = C0 * $.V0;
      return { k, C0, Q, V: $.V0 / k, U0: 0.5 * C0 * $.V0 ** 2, U: (0.5 * C0 * $.V0 ** 2) / k };
    },
    text: (T) => `A vacuum capacitor (A = ${T.A} m², d = ${T.d} mm) is charged to ${T.V0} V and then disconnected. A slab of ${T.m} is slid in to fill the gap. Find the new voltage and stored energy, and the factor by which the field between the plates changes.`,
    parts: [num('V', ($) => $.V, 'V'), num('U', ($) => $.U, 'J'), num('Efac', ($) => 1 / $.k, '× E₀', { label: 'E / E₀' }), mc('where', [[1, 'The energy went into pulling the slab in (work on the slab)'], [2, 'Charge leaked away'], [3, 'It flowed back into the battery']], 1, { label: 'Where did the missing energy go?' })],
    steps: ($, f) => [
      String.raw`$C_0 = \dfrac{\varepsilon_0 A}{d} = \dfrac{${pq(EPS0, 'C²/N·m²')}${pq($.A, 'm²')}}{${qty($.d, 'm')}} = ${texNum($.C0)}\ \text{F}$; $Q = C_0V_0 = ${texNum($.Q)}\ \text{C}$ stays fixed, and $C$ becomes $\kappa C_0$`,
      String.raw`$V = \dfrac{V_0}{\kappa} = \dfrac{${qty($.V0, 'V')}}{${texNum($.k)}} = ${texNum($.V)}\ \text{V}$`,
      String.raw`$U_0 = \tfrac12 C_0V_0^2 = \tfrac12${pq($.C0, 'F')}${pq($.V0, 'V')}^2 = ${texNum($.U0)}\ \text{J}$, so $U = \dfrac{U_0}{\kappa} = ${texNum($.U)}\ \text{J}$`,
      String.raw`$E = V/d$ falls with $V$: $E/E_0 = 1/\kappa = 1/${texNum($.k)} = ${texNum(1 / $.k)}$, so the field gets weaker.`,
    ],
    sim: {
      scenario: 'cap-isolated',
      setup(s, $) {
        s.cap = { A: $.A, d: $.d, V: $.V0, Q0: $.Q, mode: 'isolated', dielectric: $.m, inserted: true, fill: 1 };
      },
      read: (c) => ({ V: c.cap.V, U: c.cap.U }),
    },
    cases: [kase('hand', { A: 0.04, d: 50, V0: 12, m: 'teflon' }, { V: 5.714, U: 2.4274e-10, Efac: 0.4762, where: 1 })],
  }),
  problem({
    ...E3, id: 'e3.40.combo', ch: '40', lab: 'capacitor', src: 'Practice 44 #9', title: 'Capacitors in series and parallel', kind: 'numeric', level: 2, topics: ['capacitance', 'networks'],
    vars: { C1: range(1, 20, 1, 'μF', 1e-6), C2: range(1, 20, 1, 'μF', 1e-6), C3: range(1, 20, 1, 'μF', 1e-6), V: range(3, 60, 1, 'V') },
    derive: ($) => {
      const C23 = $.C2 + $.C3;
      const Ceq = ($.C1 * C23) / ($.C1 + C23);
      const Q1 = Ceq * $.V;
      return { C23, Ceq, Q1, V1: Q1 / $.C1, V2: Q1 / C23, Q3: ($.C3 * Q1) / C23 };
    },
    text: (T) => `C₁ = ${T.C1} μF is in series with the parallel pair C₂ = ${T.C2} μF and C₃ = ${T.C3} μF, across a ${T.V} V battery. Find $C_{\\text{eq}}$, the charge on C₁, the voltage across C₂, and the charge on C₃.`,
    parts: [num('Ceq', ($) => $.Ceq, 'μF', { scale: 1e-6 }), num('Q1', ($) => $.Q1, 'μC', { scale: 1e-6 }), num('V2', ($) => $.V2, 'V'), num('Q3', ($) => $.Q3, 'μC', { scale: 1e-6 })],
    hints: [
      String.raw`Parallel capacitors add; series capacitors add as reciprocals, $\dfrac{1}{C} = \sum \dfrac{1}{C_i}$.`,
      'Capacitors in series carry the same charge.',
    ],
    steps: ($, f) => [
      String.raw`$C_{23} = C_2 + C_3 = ${qty($.C2 * 1e6, 'μF')} + ${qty($.C3 * 1e6, 'μF')} = ${texNum($.C23 * 1e6)}\ \mu\text{F}$`,
      String.raw`$C_{\text{eq}} = \dfrac{C_1C_{23}}{C_1 + C_{23}} = \dfrac{(${texNum($.C1 * 1e6)})(${texNum($.C23 * 1e6)})}{${texNum($.C1 * 1e6)} + ${texNum($.C23 * 1e6)}}\ \mu\text{F} = ${texNum($.Ceq * 1e6)}\ \mu\text{F}$`,
      String.raw`$Q_1 = C_{\text{eq}}V = ${pq($.Ceq, 'F')}${pq($.V, 'V')} = ${texNum($.Q1 * 1e6)}\ \mu\text{C}$`,
      String.raw`$V_2 = \dfrac{Q_1}{C_{23}} = \dfrac{${qty($.Q1, 'C')}}{${qty($.C23, 'F')}} = ${texNum($.V2)}\ \text{V}$ — the same across $C_3$, which sits in parallel with $C_2$`,
      String.raw`$Q_3 = C_3V_2 = ${pq($.C3, 'F')}${pq($.V2, 'V')} = ${texNum($.Q3 * 1e6)}\ \mu\text{C}$`,
    ],
    cases: [
      kase('#9', { C1: 4, C2: 3, C3: 2, V: 12 }, { Ceq: 2.2222, Q1: 26.667, V2: 5.3333, Q3: 10.667 }, {
        key: 'A) 2.22 μF  B) q1 = 2.67 x 10-5 C, q2 = 1.6 x 10-5 C, q3 = 1.07 x 10-6 C',
        note: 'q3 = C3·V23 = (2.0 μF)(5.33 V) = 1.07 × 10⁻⁵ C; the key prints 10⁻⁶. The other two charges, 26.7 μC and 16 μC, match, and the three must satisfy q1 = q2 + q3.',
      }),
      kase('hand', { C1: 6, C2: 4, C3: 2, V: 12 }, { Ceq: 3, Q1: 36, V2: 6, Q3: 12 }),
    ],
  }),
  problem({
    ...E3, id: 'e3.40.energy', ch: '40', lab: 'capacitor', title: 'Energy stored in a capacitor', kind: 'numeric', topics: ['capacitance', 'energy'],
    vars: { C: range(1, 200, 1, 'μF', 1e-6), V: range(0.5, 10, 0.5, 'kV', 1e3) },
    derive: ($) => ({ U: 0.5 * $.C * $.V ** 2, Q: $.C * $.V }),
    text: (T) => `A defibrillator's ${T.C} μF capacitor is charged to ${T.V} kV. How much charge and energy does it store?`,
    parts: [
      sym('U_sym', 'C*V^2/2', { C: 'F', V: 'V' }, ($) => $.U, { unit: 'J', label: String.raw`$U$ as a formula` }),
      num('Q', ($) => $.Q, 'C'),
      num('U', ($) => $.U, 'J'),
    ],
    steps: ($, f) => [
      String.raw`$Q = CV = ${pq($.C, 'F')}${pq($.V, 'V')} = ${texNum($.Q)}\ \text{C}$`,
      String.raw`$U = \tfrac{1}{2}CV^2 = \tfrac12${pq($.C, 'F')}${pq($.V, 'V')}^2 = ${texNum($.U)}\ \text{J}$`,
    ],
    sim: {
      scenario: 'cap-defib',
      setup(s, $) {
        s.cap = { ...s.cap, Cset: $.C, V: $.V, mode: 'battery' };
      },
      read: (c) => ({ Q: c.cap.Q, U: c.cap.U }),
    },
    cases: [kase('lab defib', { C: 30, V: 5 }, { Q: 0.15, U: 375 })],
  }),
  problem({
    ...E3, id: 'e3.40.C-for-energy', ch: '40', lab: 'capacitor', src: 'Class Activity 3 #16', title: 'Sizing a capacitor for an energy', kind: 'numeric', topics: ['capacitance', 'energy'],
    vars: { U: range(0.5, 10, 0.5, 'J'), V: range(20, 600, 10, 'V') },
    derive: ($) => ({ C: (2 * $.U) / $.V ** 2, Q: (2 * $.U) / $.V }),
    text: (T) => `A capacitor charged to ${T.V} V has to store ${T.U} J, enough to start a small motor. What capacitance does it need, and what charge will it hold?`,
    parts: [
      sym('C_sym', '2*U/V^2', { U: 'J', V: 'V' }, ($) => $.C, { unit: 'F', label: String.raw`$C$ as a formula` }),
      num('C', ($) => $.C, 'μF', { scale: 1e-6 }),
      num('Q', ($) => $.Q, 'mC', { scale: 1e-3 }),
    ],
    hints: [String.raw`Turn $U = \tfrac12 CV^2$ around for $C$; then $Q = CV$.`],
    steps: ($) => [
      String.raw`$U = \tfrac12 CV^2 \;\Rightarrow\; C = \dfrac{2U}{V^2} = \dfrac{2${pq($.U, 'J')}}{${pq($.V, 'V')}^2} = ${texNum($.C)}\ \text{F}$`,
      String.raw`$Q = CV = ${pq($.C, 'F')}${pq($.V, 'V')} = ${texNum($.Q)}\ \text{C}$`,
    ],
    sim: {
      scenario: 'cap-defib',
      setup(s, $) {
        s.cap = { ...s.cap, Cset: $.C, V: $.V, mode: 'battery' };
      },
      read: (c, s, $) => ({ Q: c.cap.Q, '@energy the lab stores (J)': [c.cap.U, $.U] }),
    },
    cases: [kase('Class Activity 3 #16', { U: 2, V: 120 }, { C: 277.8, Q: 33.33 })],
  }),
  problem({
    ...E3, id: 'e3.40.scaling', ch: '40', lab: 'capacitor', title: 'What changes when you change the capacitor?', kind: 'numeric', level: 2, topics: ['capacitance', 'proportional-reasoning'],
    vars: {
      act: choice([1, 'the plate separation is doubled'], [2, 'the plate separation is halved'], [3, 'the plate area is doubled'], [4, 'a κ = 2 dielectric fills the gap']),
      mode: choice([1, 'stays connected to the battery'], [2, 'is disconnected first (isolated)']),
      qty: choice(['C', 'C'], ['Q', 'Q'], ['V', 'V'], ['E', 'E between the plates'], ['U', 'the stored energy U']),
    },
    derive: ($) => {
      const c = { 1: 0.5, 2: 2, 3: 2, 4: 2 }[$.act];
      const dfac = { 1: 2, 2: 0.5, 3: 1, 4: 1 }[$.act];
      const Vf = $.mode === 1 ? 1 : 1 / c;
      const Qf = $.mode === 1 ? c : 1;
      const f = { C: c, Q: Qf, V: Vf, E: Vf / dfac, U: $.mode === 1 ? c : 1 / c }[$.qty];
      return { f, c, dfac, Vf, Qf };
    },
    text: (T) => `A charged parallel-plate capacitor ${T.mode}. Then ${T.act}. By what factor does ${T.qty} change?`,
    parts: [num('f', ($) => $.f, '× original', { tol: 0.001 })],
    hints: [
      String.raw`Battery connected: $V$ is fixed. Isolated: $Q$ is fixed.`,
      String.raw`$C = \dfrac{\kappa\varepsilon_0 A}{d}$, $E = \dfrac{V}{d}$, $U = \tfrac{1}{2}CV^2 = \dfrac{Q^2}{2C}$`,
    ],
    steps: ($) => [
      String.raw`$C = \dfrac{\kappa\varepsilon_0 A}{d}$, so $C \to ${texNum($.c)}\,C$`,
      $.mode === 1
        ? String.raw`The battery holds $V$ fixed, so $Q = CV \to ${texNum($.Qf)}\,Q$`
        : String.raw`Isolated, $Q$ is fixed, so $V = Q/C \to ${texNum($.Vf)}\,V$`,
      ({
        C: String.raw`Factor $= ${texNum($.f)}$`,
        Q: String.raw`Factor $= ${texNum($.f)}$`,
        V: String.raw`Factor $= ${texNum($.f)}$`,
        E: String.raw`$E = V/d$, and $d \to ${texNum($.dfac)}\,d$: $E \to \dfrac{${texNum($.Vf)}}{${texNum($.dfac)}}\,E = ${texNum($.f)}\,E$`,
        U: $.mode === 1
          ? String.raw`$U = \tfrac12 CV^2$ with $V$ fixed: $U \to ${texNum($.f)}\,U$`
          : String.raw`$U = \dfrac{Q^2}{2C}$ with $Q$ fixed: $U \to ${texNum($.f)}\,U$`,
      })[$.qty],
    ],
    cases: [kase('battery, d×2, U', { act: 1, mode: 1, qty: 'U' }, { f: 0.5 }), kase('isolated, κ, V', { act: 4, mode: 2, qty: 'V' }, { f: 0.5 }), kase('isolated, d×2, E', { act: 1, mode: 2, qty: 'E' }, { f: 1 })],
  }),

  problem({
    ...E3, id: 'e3.40.basics', ch: '40', lab: 'capacitor', src: 'Practice 40 #4–8', title: 'C, Q, V and the field between the plates', kind: 'numeric', topics: ['capacitance'],
    vars: {
      ask: choice(['C', 'C from Q and V'], ['Q', 'Q from C and V'], ['V', 'V from the energy to move a charge'], ['Efield', 'E from V and d'], ['Esigma', 'E from the charge and the plate area']),
      Q: range(1, 10, 0.5, 'μC', 1e-6),
      V: range(20, 200, 10, 'V'),
      C: range(0.5, 10, 0.5, 'μF', 1e-6),
      d: range(1, 10, 1, 'cm', 0.01),
      A: range(0.01, 0.2, 0.01, 'm²'),
      qm: range(1, 10, 0.5, 'μC', 1e-6),
      W: range(0.1, 1, 0.05, 'mJ', 1e-3),
    },
    derive: ($) => ({
      Cval: $.Q / $.V,
      Qval: $.C * $.V,
      Vval: $.W / $.qm,
      Ed: $.V / $.d,
      Esig: $.Q / (EPS0 * $.A),
    }),
    text: (T, $) => ({
      C: `When each plate of an air-filled capacitor carries ${T.Q} μC, the potential difference between the plates is ${T.V} V. What is its capacitance?`,
      Q: `What charge appears on the plates of a ${T.C} μF capacitor charged to ${T.V} V?`,
      V: `Moving a ${T.qm} μC positive charge from the negative plate to the positive plate of a capacitor takes ${T.W} mJ. What is the potential difference between the plates?`,
      Efield: `The plates of a parallel-plate capacitor are ${T.d} cm apart with ${T.V} V between them. What is the electric field between the plates?`,
      Esigma: `A parallel-plate capacitor with air between the plates has a plate area of ${T.A} m² and ${T.Q} μC on each plate. What is the electric field between the plates? (ε₀ = 8.85 × 10⁻¹² C²/N·m²)`,
    })[$.ask],
    parts: [
      num('ans', ($) => ({ C: $.Cval, Q: $.Qval, V: $.Vval, Efield: $.Ed, Esigma: $.Esig })[$.ask],
        ($) => ({ C: 'F', Q: 'C', V: 'V', Efield: 'V/m', Esigma: 'V/m' })[$.ask], { label: (T, $) => ({ C: 'C', Q: 'Q', V: String.raw`$\Delta V$`, Efield: 'E', Esigma: 'E' })[$.ask] }),
    ],
    hints: [
      String.raw`$C = \dfrac{Q}{V}$ — capacitance is set by geometry, not by how much charge you put on.`,
      String.raw`Between parallel plates the field is uniform: $E = \dfrac{V}{d} = \dfrac{\sigma}{\varepsilon_0} = \dfrac{Q}{\varepsilon_0 A}$.`,
    ],
    steps: ($, f) => [
      ({
        C: String.raw`$C = \dfrac{Q}{V} = \dfrac{${qty($.Q, 'C')}}{${qty($.V, 'V')}} = ${texNum($.Cval)}\ \text{F}$`,
        Q: String.raw`$Q = CV = ${pq($.C, 'F')}${pq($.V, 'V')} = ${texNum($.Qval)}\ \text{C}$`,
        V: String.raw`$\Delta V = \dfrac{W}{q} = \dfrac{${qty($.W, 'J')}}{${qty($.qm, 'C')}} = ${texNum($.Vval)}\ \text{V}$`,
        Efield: String.raw`$E = \dfrac{V}{d} = \dfrac{${qty($.V, 'V')}}{${qty($.d, 'm')}} = ${texNum($.Ed)}\ \text{V/m}$`,
        Esigma: String.raw`$E = \dfrac{Q}{\varepsilon_0 A} = \dfrac{${qty($.Q, 'C')}}{${pq(EPS0, 'C²/N·m²')}${pq($.A, 'm²')}} = ${texNum($.Esig)}\ \text{V/m}$`,
      })[$.ask],
    ],
    cases: [
      kase('#4', { ask: 'C', Q: 4, V: 80, C: 2, d: 6, A: 0.04, qm: 5, W: 0.3 }, { ans: 5e-8 }, { key: '5 × 10⁻⁸ F' }),
      kase('#5', { ask: 'Q', Q: 4, V: 100, C: 2, d: 6, A: 0.04, qm: 5, W: 0.3 }, { ans: 2e-4 }, { key: '2 × 10⁻⁴ C' }),
      kase('#6', { ask: 'V', Q: 4, V: 80, C: 2, d: 6, A: 0.04, qm: 5, W: 0.3 }, { ans: 60 }, { key: '60 V' }),
      kase('#7', { ask: 'Efield', Q: 4, V: 60, C: 2, d: 6, A: 0.04, qm: 5, W: 0.3 }, { ans: 1000 }, { key: '1,000 V/m' }),
      kase('#8', { ask: 'Esigma', Q: 2e-3, V: 80, C: 2, d: 6, A: 0.04, qm: 5, W: 0.3 }, { ans: 5650 }, { key: '5650 V/m', note: 'Sheet states the charge as 2 nC; 5650 V/m follows from 2 nC only if ε₀A is read as 8.85e-12 × 0.04 — the printed value matches σ/ε₀ with Q = 2 nC to within rounding.' }),
    ],
  }),
  problem({
    ...E3, id: 'e3.40.increase-C', ch: '40', src: 'Practice 40 #1–3', title: 'What changes the capacitance?', kind: 'conceptual', topics: ['capacitance', 'dielectrics'],
    vars: {
      ask: choice(
        ['increase', 'Which of these increases the capacitance of a parallel-plate capacitor?'],
        ['kappa', 'Inserting a dielectric raises a capacitor’s capacitance by a factor of 4. What is the dielectric constant of the material?'],
        ['direction', 'Between two oppositely charged parallel plates, which way does the electric field point?'],
      ),
      factor: range(2, 8, 1, ''),
    },
    derive: ($) => ({ k: $.factor }),
    text: (T, $) => ($.ask === 'kappa'
      ? `Inserting a dielectric raises a capacitor's capacitance by a factor of ${T.factor}. What is the dielectric constant of the material?`
      : T.ask),
    parts: [
      mc('ans', ($) => ({
        increase: [
          ['charge', 'Putting more charge on the plates'],
          ['voltage', 'Raising the potential between the plates'],
          ['dielectric', 'Introducing a dielectric between the plates'],
          ['apart', 'Moving the plates farther apart'],
        ],
        kappa: [
          ['inverse', 'It is the reciprocal of that factor'],
          ['equal', 'It equals the factor the capacitance went up by'],
          ['needV', 'It cannot be found without knowing the voltage'],
        ],
        direction: [
          ['topos', 'From the negative plate toward the positive plate'],
          ['toneg', 'From the positive plate toward the negative plate'],
          ['along', 'Parallel to the plates'],
        ],
      })[$.ask], ($) => ({ increase: 'dielectric', kappa: 'equal', direction: 'toneg' })[$.ask]),
    ],
    hints: [String.raw`$C = \dfrac{\kappa\varepsilon_0 A}{d}$ — only the geometry and the filling appear. $Q$ and $V$ do not.`],
    steps: ($, f) => [
      $.ask === 'increase'
        ? String.raw`Adding charge raises $Q$ and $V$ together, leaving $C = Q/V$ alone. A dielectric changes the capacitor itself, by $\kappa$.`
        : $.ask === 'kappa'
          ? String.raw`$C_{\text{new}} = \kappa C$, so a factor of ${f($.k)} means $\kappa = ${f($.k)}$.`
          : String.raw`$\vec{E}$ points away from positive charge and toward negative, so between the plates it runs from the positive plate to the negative one.`,
    ],
    cases: [
      kase('#2', { ask: 'increase', factor: 4 }, { ans: 'dielectric' }, { key: 'C)' }),
      kase('#3', { ask: 'kappa', factor: 4 }, { ans: 'equal' }, { key: 'C) 4' }),
    ],
  }),
  // ----------------------------------------------------------------- 40 · breakdown
  problem({
    ...E3, id: 'e3.40.spark-energy', enrichment: true, ch: '40', lab: 'breakdown', title: 'Energy in a doorknob spark', kind: 'numeric', level: 2, topics: ['capacitance', 'energy', 'breakdown'],
    vars: { R: range(0.2, 0.6, 0.05, 'm'), V: range(5, 30, 1, 'kV', 1e3) },
    derive: ($) => {
      const C = sphereCapacitance($.R);
      return { C, Q: chargeForPotential($.V, $.R), U: sparkEnergy(C, $.V) };
    },
    text: (T) => `Treat a person as an isolated conducting sphere of radius ${T.R} m. Scuffing across a carpet raises them to ${T.V} kV. Find their self-capacitance and the energy released when they discharge to a doorknob.`,
    parts: [
      sym('C_sym', '4*pi*eps0*R', { R: 'm' }, ($) => $.C, { unit: 'F', label: String.raw`$C$ as a formula` }),
      num('C', ($) => $.C, 'F'),
      num('U', ($) => $.U, 'J', { label: String.raw`$U$ released` }),
    ],
    hints: [String.raw`An isolated sphere has $C = 4\pi\varepsilon_0 R$; the stored energy is $U = \tfrac12 CV^2$.`],
    steps: ($, f) => [
      String.raw`$C = 4\pi\varepsilon_0 R = 4\pi${pq(EPS0, 'C²/N·m²')}${pq($.R, 'm')} = ${texNum($.C)}\ \text{F}$`,
      String.raw`$U = \tfrac12 CV^2 = \tfrac12${pq($.C, 'F')}${pq($.V, 'V')}^2 = ${texNum($.U)}\ \text{J}$`,
    ],
    sim: { scenario: 'doorknob', setup: (s, $) => { s.bd = { ...s.bd, R: $.R, V: $.V }; }, read: (c) => ({ C: c.bd.C, U: c.bd.U }) },
    cases: [kase('10 kV on a 0.35 m sphere', { R: 0.35, V: 10 }, { C: 3.894e-11, U: 1.947e-3 })],
  }),
  problem({
    ...E3, id: 'e3.40.gap-holds', enrichment: true, ch: '40', lab: 'breakdown', title: 'Will the gap break down?', kind: 'numeric', level: 2, topics: ['breakdown', 'dielectrics'],
    vars: { V: range(2, 40, 1, 'kV', 1e3), d: range(1, 12, 1, 'mm', 1e-3) },
    derive: ($) => ({ E: $.V / $.d, Vs: strengthVolts($.d), Vp: paschen(P_ATM, $.d) }),
    text: (T) => `A charged body sits ${T.d} mm from a grounded plate in dry air at one atmosphere, with ${T.V} kV across the gap. Find the field in the gap, and the voltage the gap would hold on the 3 MV/m dielectric-strength rule.`,
    parts: [
      num('E', ($) => $.E, 'V/m', { label: String.raw`$E$ in the gap` }),
      num('Vs', ($) => $.Vs, 'V', { label: String.raw`$V_b$ from $E_{\text{DS}}d$` }),
      mc('sparks', [['yes', 'Yes'], ['no', 'No']], ($) => ($.E >= 3e6 ? 'yes' : 'no'), { label: 'Does it break down by that rule?' }),
    ],
    hints: [String.raw`A uniform gap has $E = V/d$, and the rule says it lets go once $E$ reaches the dielectric strength.`],
    steps: ($, f) => [
      String.raw`$E = \dfrac{V}{d} = \dfrac{${qty($.V, 'V')}}{${qty($.d, 'm')}} = ${texNum($.E)}\ \text{V/m}$`,
      String.raw`$V_b = E_{\text{DS}}\,d = (3\times10^6\ \text{V/m})${pq($.d, 'm')} = ${texNum($.Vs)}\ \text{V}$`,
    ],
    sim: { scenario: 'doorknob', setup: (s, $) => { s.bd = { ...s.bd, V: $.V, d: $.d, p: P_ATM, gas: 'air' }; }, read: (c) => ({ E: c.bd.E, Vs: c.bd.Vstrength }) },
    cases: [kase('18 kV across 4 mm', { V: 18, d: 4 }, { E: 4.5e6, Vs: 12000, sparks: 'yes' })],
  }),
  problem({
    ...E3, id: 'e3.40.paschen-min', enrichment: true, ch: '40', lab: 'breakdown', title: 'The easiest gap to break down', kind: 'numeric', level: 3, topics: ['breakdown'],
    vars: { gas: choice(...GASES.map((g) => [g.id, g.name.toLowerCase()])) },
    derive: ($) => {
      const g = GASES.find((x) => x.id === $.gas);
      const m = paschenMin(g);
      return { Vmin: m.V, pd: m.pd, dAtm: m.d };
    },
    text: (T) => `Paschen's law gives the breakdown voltage of a gap as a function of the product of pressure and separation, p·d. For ${T.gas}, find the smallest voltage that can break down a gap at all, and the value of p·d at which it happens.`,
    parts: [
      num('Vmin', ($) => $.Vmin, 'V', { label: String.raw`$V_{\min}$` }),
      num('pd', ($) => $.pd, 'Pa·m', { label: String.raw`$p\,d$ at the minimum` }),
      mc('why', [
        ['few', 'Below it there is too little gas for an avalanche to build'],
        ['many', 'Below it there is so much gas that electrons cannot accelerate'],
        ['none', 'Nothing special happens below it'],
      ], 'few', { label: 'Why does the curve turn back up to the left of the minimum?' }),
    ],
    hints: [String.raw`Differentiating Paschen's law gives $(pd)_{\min} = e\ln(1+1/\gamma)/A$ and $V_{\min} = (B/A)\,e\ln(1+1/\gamma)$.`],
    steps: ($, f) => [String.raw`$V_{\min} = ${texNum($.Vmin)}\ \text{V at } pd = ${texNum($.pd)}\ \text{Pa·m}$`],
    sim: { scenario: 'minimum', setup: (s, $) => { s.bd = { ...s.bd, gas: $.gas }; }, read: (c) => ({ Vmin: c.bd.min.V, pd: c.bd.min.pd }) },
    cases: [kase('air', { gas: 'air' }, { Vmin: 305.3, pd: 1.115, why: 'few' })],
  }),
  problem({
    ...E3, id: 'e3.40.wider-gap', enrichment: true, ch: '40', lab: 'breakdown', title: 'A wider gap that breaks down more easily', kind: 'conceptual', level: 3, topics: ['breakdown'],
    vars: { p: range(10, 40, 5, 'Pa') },
    derive: ($) => {
      const dNarrow = 0.01;
      const dWide = 0.06;
      return { Vn: paschen($.p, dNarrow), Vw: paschen($.p, dWide), dNarrow, dWide };
    },
    text: (T) => `In a chamber at ${T.p} Pa, compare a 1.0 cm gap with a 6.0 cm gap. The 3 MV/m rule says the wider gap must hold six times the voltage.`,
    parts: [
      mc('which', [
        ['wide', 'The 6.0 cm gap breaks down at a LOWER voltage than the 1.0 cm gap'],
        ['narrow', 'The 1.0 cm gap breaks down at a lower voltage, as the rule predicts'],
        ['same', 'They break down at the same voltage'],
      ], ($) => ($.Vw < $.Vn ? 'wide' : 'narrow'), { label: 'Which actually breaks down first?' }),
      mc('why', [
        ['left', 'At this pressure the narrow gap sits left of the Paschen minimum, where less gas means a harder breakdown'],
        ['rule', 'The 3 MV/m rule is simply wrong at all pressures'],
        ['temp', 'Temperature differences between the gaps'],
      ], 'left', { label: 'Why?' }),
    ],
    hints: [String.raw`Breakdown depends on $p\,d$, not on $d$ alone. Work out $p\,d$ for each gap and compare both with the minimum at $1.115$ Pa·m.`],
    steps: ($, f) => [
      String.raw`$p\,d = ${texNum($.p * $.dNarrow)}$ and $${texNum($.p * $.dWide)}$ Pa·m`,
      Number.isFinite($.Vn)
        ? String.raw`$V_b = ${texNum($.Vn)}$ V and $${texNum($.Vw)}$ V`
        : String.raw`The 1.0 cm gap is so far left of the minimum that Paschen's law gives no breakdown at any voltage; the 6.0 cm gap breaks down at $${texNum($.Vw)}$ V`,
    ],
    cases: [kase('20 Pa', { p: 20 }, { which: 'wide', why: 'left' })],
  }),

  // ================================================================= 41
  problem({
    ...E3, id: 'e3.41.wire-R', ch: '41', lab: 'ohm', title: 'Resistance of a wire', kind: 'numeric', topics: ['resistance', 'ohms-law'],
    vars: { m: MATS, L: range(0.5, 100, 0.5, 'm'), A: range(0.1, 10, 0.1, 'mm²', 1e-6), V: range(1, 120, 1, 'V') },
    derive: ($) => {
      const R = (mat($.m).rho * $.L) / $.A;
      return { rho: mat($.m).rho, R, I: $.V / R };
    },
    text: (T, $, f) => `A ${T.m} wire (ρ = ${f($.rho)} Ω·m) is ${T.L} m long with a ${T.A} mm² cross section. Find its resistance and the current when ${T.V} V is applied.`,
    parts: [
      sym('R_sym', 'rho*L/A', { rho: 'Ω·m', L: 'm', A: 'm²' }, ($) => $.R, { unit: 'Ω', label: String.raw`$R$ as a formula (use rho, L, A)` }),
      num('R', ($) => $.R, 'Ω'),
      num('I', ($) => $.I, 'A'),
    ],
    steps: ($, f) => [
      String.raw`$R = \dfrac{\rho L}{A} = \dfrac{${pq($.rho, 'Ω·m')}${pq($.L, 'm')}}{${qty($.A, 'm²')}} = ${texNum($.R)}\ \Omega$`,
      String.raw`$I = \dfrac{V}{R} = \dfrac{${qty($.V, 'V')}}{${qty($.R, 'Ω')}} = ${texNum($.I)}\ \text{A}$`,
    ],
    sim: {
      scenario: 'ohm-cu100',
      setup(s, $) {
        s.ohm = { material: $.m, L: $.L, A: $.A, V: $.V, T: 20 };
      },
      read: (c) => ({ R: c.ohm.R, I: c.ohm.I }),
    },
    cases: [kase('Ch 41 copper', { m: 'copper', L: 100, A: 3.3, V: 9 }, { R: 0.5212, I: 17.27 })],
  }),
  problem({
    ...E3, id: 'e3.41.temperature', ch: '41', lab: 'ohm', title: 'Resistance changes with temperature', kind: 'numeric', topics: ['resistance', 'temperature'],
    vars: { m: MATS, L: range(1, 50, 1, 'm'), A: range(0.1, 5, 0.1, 'mm²', 1e-6), T: range(-50, 1200, 10, '°C') },
    derive: ($) => {
      const R0 = (mat($.m).rho * $.L) / $.A;
      return { R0, alpha: mat($.m).alpha, R: R0 * (1 + mat($.m).alpha * ($.T - 20)) };
    },
    text: (T, $, f) => `A ${T.m} wire (α = ${f($.alpha)} /°C) has R₀ = ${f($.R0)} Ω at 20 °C. What is its resistance at ${T.T} °C?`,
    parts: [num('R', ($) => $.R, 'Ω')],
    steps: ($) => [
      String.raw`$R_0 = \dfrac{\rho L}{A} = \dfrac{${pq(mat($.m).rho, 'Ω·m')}${pq($.L, 'm')}}{${qty($.A, 'm²')}} = ${texNum($.R0)}\ \Omega$ at 20 °C`,
      String.raw`$R = R_0\left[1 + \alpha(T - 20\,^\circ\text{C})\right] = ${pq($.R0, 'Ω')}\left[1 + ${pq($.alpha, '/°C')}(${texNum($.T - 20)}\ ^\circ\text{C})\right] = ${texNum($.R)}\ \Omega$`,
    ],
    sim: {
      scenario: 'ohm-hot',
      setup(s, $) {
        s.ohm = { material: $.m, L: $.L, A: $.A, V: 12, T: $.T };
      },
      read: (c) => ({ R: c.ohm.R }),
    },
    cases: [kase('nichrome at 1000 °C', { m: 'nichrome', L: 10, A: 0.2, T: 1000 }, { R: 69.6 })],
  }),
  problem({
    ...E3, id: 'e3.41.drift', ch: '41', lab: 'ohm', title: 'Drift velocity, current density, and E in a wire', kind: 'numeric', level: 2, topics: ['current', 'drift-velocity'],
    vars: { L: range(1, 100, 1, 'm'), A: range(0.5, 10, 0.1, 'mm²', 1e-6), V: range(1, 24, 1, 'V') },
    derive: ($) => {
      const Cu = mat('copper');
      const I = ($.V * $.A) / (Cu.rho * $.L);
      return { I, J: I / $.A, E: $.V / $.L, vd: I / (Cu.n * QE * $.A) };
    },
    text: (T) => `A copper wire (ρ = 1.72×10⁻⁸ Ω·m, n = 8.5×10²⁸ electrons/m³) is ${T.L} m long with a ${T.A} mm² cross section, across ${T.V} V. Find the current, the current density, the field inside the wire, and the electron drift speed.`,
    parts: [num('I', ($) => $.I, 'A'), num('J', ($) => $.J, 'A/m²'), num('E', ($) => $.E, 'V/m'), num('vd', ($) => $.vd, 'm/s')],
    steps: ($, f) => [
      String.raw`$I = \dfrac{V}{R} = \dfrac{VA}{\rho L} = \dfrac{${pq($.V, 'V')}${pq($.A, 'm²')}}{${pq(mat('copper').rho, 'Ω·m')}${pq($.L, 'm')}} = ${texNum($.I)}\ \text{A}$`,
      String.raw`$J = \dfrac{I}{A} = \dfrac{${qty($.I, 'A')}}{${qty($.A, 'm²')}} = ${texNum($.J)}\ \text{A/m}^2$`,
      String.raw`$E = \dfrac{V}{L} = \dfrac{${qty($.V, 'V')}}{${qty($.L, 'm')}} = ${texNum($.E)}\ \text{V/m}$`,
      String.raw`$v_d = \dfrac{I}{neA} = \dfrac{${qty($.I, 'A')}}{${pq(mat('copper').n, 'm⁻³')}${pq(QE, 'C')}${pq($.A, 'm²')}} = ${texNum($.vd)}\ \text{m/s}$ — very slow`,
    ],
    sim: {
      scenario: 'ohm-cu100',
      setup(s, $) {
        s.ohm = { material: 'copper', L: $.L, A: $.A, V: $.V, T: 20 };
      },
      read: (c) => ({ I: c.ohm.I, J: c.ohm.J, E: c.ohm.E, vd: c.ohm.vd }),
    },
    cases: [kase('Ch 41 copper', { L: 100, A: 3.3, V: 9 }, { I: 17.27, J: 5.233e6, E: 0.09, vd: 3.848e-4 })],
  }),
  problem({
    ...E3, id: 'e3.41.charge-flow', ch: '41', lab: 'ohm', title: 'Current from charge flow', kind: 'numeric', topics: ['current'],
    vars: { Q: range(1, 500, 1, 'C'), t: range(0.5, 30, 0.5, 'min', 60) },
    derive: ($) => ({ I: $.Q / $.t, N: $.Q / $.t / QE }),
    text: (T) => `${T.Q} C of charge passes through a wire in ${T.t} min. What is the average current, and how many electrons pass each second?`,
    parts: [num('I', ($) => $.I, 'A'), num('N', ($) => $.N, 'electrons/s')],
    steps: ($, f) => [
      String.raw`$I = \dfrac{\Delta Q}{\Delta t} = \dfrac{${qty($.Q, 'C')}}{${qty($.t, 's')}} = ${texNum($.I)}\ \text{A}$ (minutes to seconds first)`,
      String.raw`$N = \dfrac{I}{e} = \dfrac{${qty($.I, 'C/s')}}{${qty(QE, 'C')}} = ${texNum($.N)}$ per second`,
    ],
    cases: [kase('hand', { Q: 30, t: 2 }, { I: 0.25, N: 1.5625e18 })],
  }),
  problem({
    ...E3, id: 'e3.41.stretch', ch: '41', lab: 'ohm', title: 'Stretching a wire', kind: 'numeric', topics: ['resistance', 'proportional-reasoning'],
    vars: { n: range(1.5, 4, 0.5), R0: range(1, 50, 1, 'Ω') },
    derive: ($) => ({ R: $.R0 * $.n ** 2 }),
    text: (T) => `A ${T.R0} Ω wire is drawn out to ${T.n} times its original length, keeping its volume the same. What is its new resistance?`,
    parts: [
      sym('R_sym', 'n^2*R0', { n: '1', R0: 'Ω' }, ($) => $.R, { unit: 'Ω', label: String.raw`$R$ as a formula` }),
      num('R', ($) => $.R, 'Ω'),
    ],
    hints: [String.raw`The volume is constant, so $A$ shrinks by the same factor that $L$ grows.`],
    steps: ($, f) => [String.raw`$R = \dfrac{\rho(nL)}{A/n} = n^2 R_0 = (${texNum($.n)})^2${pq($.R0, 'Ω')} = ${texNum($.R)}\ \Omega$`],
    cases: [kase('double', { n: 2, R0: 10 }, { R: 40 })],
  }),

  problem({
    ...E3, id: 'e3.41.non-ohmic', ch: '41', title: 'Ohmic or not?', kind: 'conceptual', topics: ['resistance', 'ohms-law', 'non-ohmic'],
    vars: {
      device: choice(
        ['nichrome', 'a nichrome heating wire held at a steady temperature'],
        ['diode', 'a diode'],
        ['semi', 'a semiconductor'],
        ['bulb', 'a filament bulb in the instant after it is switched on'],
        ['copper', 'a copper wire at constant temperature'],
      ),
    },
    derive: ($) => ({ ohmic: $.device === 'nichrome' || $.device === 'copper' ? 1 : 0 }),
    text: (T) => `Does ${T.device} obey Ohm's law — that is, is the slope of its I vs. V graph constant?`,
    parts: [
      mc('ans', [[1, 'Yes — I vs. V is a straight line through the origin'], [0, 'No — the slope of I vs. V changes']], ($) => $.ohmic, { label: 'Ohmic?' }),
    ],
    hints: [String.raw`"Ohmic" is a statement about the *graph*, not about whether $R = V/I$ can be computed. $R = V/I$ always can be; for a non-ohmic device the answer just keeps changing.`],
    steps: ($) => [
      $.ohmic
        ? String.raw`A metal at a fixed temperature has a constant resistance, so $I$ is proportional to $V$ and the graph is a straight line.`
        : String.raw`Semiconductors, diodes and a filament that is still heating up all change resistance as conditions change, so the slope of $I$ vs. $V$ is not constant.`,
      String.raw`A bulb is the sharpest case: cold, its filament resistance is low and the current surges; a moment later it is hot, $R$ has risen and the current settles.`,
    ],
    cases: [kase('diode', { device: 'diode' }, { ans: 0 }), kase('copper', { device: 'copper' }, { ans: 1 })],
  }),
  problem({
    ...E3, id: 'e3.41.ohm-basics', ch: '41', lab: 'ohm', src: 'Practice 41 #3, 5–8', title: 'Ohm’s law, four ways', kind: 'numeric', topics: ['current', 'resistance', 'ohms-law'],
    vars: {
      ask: choice(['I-from-Q', 'current from charge and time'], ['V', 'voltage across a resistor'], ['I', 'current through a resistor'], ['R', 'resistance from V and I']),
      Q: range(0.1, 2, 0.01, 'C'),
      t: range(0.1, 2, 0.05, 's'),
      Ir: range(0.5, 8, 0.5, 'A'),
      Rr: range(5, 4000, 5, 'Ω'),
      Vs: range(10, 240, 10, 'V'),
    },
    derive: ($) => ({ Iq: $.Q / $.t, Vr: $.Ir * $.Rr, Ir2: $.Vs / $.Rr, Rv: $.Vs / $.Ir }),
    text: (T, $) => ({
      'I-from-Q': `What current flows in a wire if ${T.Q} C of charge passes a point in ${T.t} s?`,
      V: `${T.Ir} A flows through a ${T.Rr} Ω resistor. What is the potential difference across it?`,
      I: `A ${T.Rr} Ω resistor is connected across a ${T.Vs} V source. What current flows through it?`,
      R: `A ${T.Vs} V battery drives ${T.Ir} A through a light bulb. What is the bulb's resistance?`,
    })[$.ask],
    parts: [num('ans', ($) => ({ 'I-from-Q': $.Iq, V: $.Vr, I: $.Ir2, R: $.Rv })[$.ask], ($) => ({ 'I-from-Q': 'A', V: 'V', I: 'A', R: 'Ω' })[$.ask], { label: (T, $) => ({ 'I-from-Q': 'I', V: 'V', I: 'I', R: 'R' })[$.ask] })],
    hints: [String.raw`$I = \dfrac{\Delta Q}{\Delta t}$ defines current; $V = IR$ relates the three circuit quantities.`],
    steps: ($, f) => [
      ({
        'I-from-Q': String.raw`$I = \dfrac{Q}{t} = \dfrac{${qty($.Q, 'C')}}{${qty($.t, 's')}} = ${texNum($.Iq)}\ \text{A}$`,
        V: String.raw`$V = IR = ${pq($.Ir, 'A')}${pq($.Rr, 'Ω')} = ${texNum($.Vr)}\ \text{V}$`,
        I: String.raw`$I = \dfrac{V}{R} = \dfrac{${qty($.Vs, 'V')}}{${qty($.Rr, 'Ω')}} = ${texNum($.Ir2)}\ \text{A}$`,
        R: String.raw`$R = \dfrac{V}{I} = \dfrac{${qty($.Vs, 'V')}}{${qty($.Ir, 'A')}} = ${texNum($.Rv)}\ \Omega$`,
      })[$.ask],
    ],
    cases: [
      kase('#3', { ask: 'I-from-Q', Q: 0.67, t: 0.3, Ir: 5, Rr: 10, Vs: 12 }, { ans: 2.2333 }, { key: '2.23 A' }),
      kase('#5', { ask: 'V', Q: 1, t: 1, Ir: 5, Rr: 10, Vs: 12 }, { ans: 50 }, { key: '50 V' }),
      kase('#6', { ask: 'I', Q: 1, t: 1, Ir: 5, Rr: 4000, Vs: 220 }, { ans: 0.055 }, { key: '0.055 A' }),
      kase('#7', { ask: 'R', Q: 1, t: 1, Ir: 2, Rr: 10, Vs: 12 }, { ans: 6 }, { key: '6 Ω' }),
    ],
  }),
  problem({
    ...E3, id: 'e3.41.geometry-concepts', ch: '41', src: 'Practice 41 #9–10, 13, 17, Class Activity 3 #18, #21–22', title: 'How geometry and temperature change R', kind: 'conceptual', topics: ['resistance', 'proportional-reasoning'],
    vars: {
      ask: choice(
        ['half-radius', 'The radius of a round wire is halved, with its length unchanged. What happens to its resistance?'],
        ['thicker', 'Two copper wires have the same length but different thickness. The thicker one has'],
        ['heat', 'A copper wire is heated. Its electrical resistance'],
        ['nonohmic', 'If a material is non-ohmic, what do we know about its resistance?'],
        ['both-half', 'A round wire has its length AND its radius both cut in half. What happens to its resistance?'],
        ['rho-half', 'A round wire has its length and its radius both cut in half. What happens to its resistivity?'],
        ['drift', 'When current flows in a metal wire, how fast are the electrons themselves moving along it?'],
      ),
    },
    text: (T) => T.ask,
    parts: [
      mc('ans', ($) => ({
        'half-radius': [['x2', 'It increases by a factor of 2'], ['x4', 'It increases by a factor of 4'], ['quarter', 'It drops to a quarter'], ['same', 'It does not change']],
        thicker: [['more', 'more resistance'], ['less', 'less resistance'], ['same', 'the same resistance']],
        heat: [['down', 'decreases'], ['up', 'increases'], ['same', 'does not change']],
        nonohmic: [['const', 'It stays constant as the voltage changes'], ['notconst', 'It does not stay constant as the voltage changes']],
        'both-half': [['half', 'It halves'], ['same', 'It does not change'], ['x2', 'It increases by a factor of 2'], ['x4', 'It increases by a factor of 4']],
        'rho-half': [['x2', 'It increases by a factor of 2'], ['x4', 'It increases by a factor of 4'], ['same', 'It does not change']],
        drift: [['light', 'At nearly the speed of light'], ['sound', 'About as fast as sound travels in air'], ['slow', 'Slowly, well under a millimetre per second']],
      })[$.ask], ($) => ({ 'half-radius': 'x4', thicker: 'less', heat: 'up', nonohmic: 'notconst', 'both-half': 'x2', 'rho-half': 'same', drift: 'slow' })[$.ask]),
    ],
    hints: [String.raw`$R = \dfrac{\rho L}{A}$ with $A = \pi r^2$ — so $R$ goes as $1/r^2$, not $1/r$.`],
    steps: ($) => [
      $.ask === 'half-radius'
        ? String.raw`Halving $r$ quarters the area, and $R \propto 1/A$, so $R$ goes up by 4. This is the one people miss by forgetting the square.`
        : $.ask === 'thicker'
          ? String.raw`More cross-section is more room for the current: bigger $A$, smaller $R$.`
          : $.ask === 'heat'
            ? String.raw`In a metal, heating makes the lattice vibrate harder and scatter electrons more, so $\rho$ and $R$ rise.`
            : $.ask === 'nonohmic'
              ? String.raw`Non-ohmic means the $I$ vs $V$ graph is not a straight line, so the ratio $V/I$ — the resistance — changes as you move along it.`
              : $.ask === 'both-half'
                ? String.raw`$R = \rho L/\pi r^2$: halving $L$ halves $R$, halving $r$ quarters the area and multiplies $R$ by 4. Together: $\tfrac12 \times 4 = 2$, so $R \to 2R$.`
                : $.ask === 'rho-half'
                  ? String.raw`Resistivity $\rho$ belongs to the *material*, not the shape. Cutting the wire changes $R$, never $\rho$.`
                  : String.raw`The signal travels at nearly $c$, but each electron only drifts — $v_d = I/(neA)$ is typically a fraction of a mm/s. The Ohm lab shows $v_d$ for its wire.`,
    ],
    cases: [
      kase('#9', { ask: 'half-radius' }, { ans: 'x4' }, { key: 'D) increased by a factor of 4' }),
      kase('#10', { ask: 'thicker' }, { ans: 'less' }, { key: 'B) less resistance' }),
      kase('#13', { ask: 'heat' }, { ans: 'up' }, { key: 'C) increases' }),
      kase('#17', { ask: 'nonohmic' }, { ans: 'notconst' }, { key: 'B)' }),
      kase('Class Activity 3 #21a', { ask: 'both-half' }, { ans: 'x2' }),
      kase('Class Activity 3 #21b', { ask: 'rho-half' }, { ans: 'same' }),
      kase('Class Activity 3 #18', { ask: 'drift' }, { ans: 'slow' }),
    ],
  }),
  problem({
    ...E3, id: 'e3.41.across-resistor', ch: '41', lab: 'circuits', src: 'Class Activity 3 #17', title: 'Current and potential across a resistor', kind: 'conceptual', topics: ['current', 'potential'],
    vars: {
      ask: choice(
        ['current', 'Conventional current flows from a to b through a resistor. How does the current at a compare with the current at b?'],
        ['potential', 'Conventional current flows from a to b through a resistor. Which end is at the higher electric potential?'],
        ['energy', 'Conventional current flows from a to b through a resistor. What happens to the charges’ electric potential energy as they pass through?'],
      ),
    },
    text: (T) => T.ask,
    parts: [
      mc('ans', ($) => ({
        current: [['moreA', 'There is more current at a: the resistor uses some up'], ['sameI', 'The current is the same at a and b'], ['moreB', 'There is more current at b']],
        potential: [['highB', 'b is at the higher potential'], ['highA', 'a is at the higher potential'], ['sameV', 'a and b are at the same potential']],
        energy: [['gainU', 'They gain electric potential energy'], ['loseU', 'They lose electric potential energy'], ['sameU', 'Their electric potential energy does not change']],
      })[$.ask], ($) => ({ current: 'sameI', potential: 'highA', energy: 'loseU' })[$.ask]),
    ],
    hints: ['Charge is conserved: whatever enters the resistor each second leaves it. What the resistor takes is energy, not charge.'],
    steps: ($) => [
      $.ask === 'current'
        ? 'No charge piles up inside, so the same current flows in and out. A resistor uses up energy, never current.'
        : $.ask === 'potential'
          ? String.raw`Current flows downhill in potential through a resistor, so a is higher: $V_a - V_b = IR$.`
          : String.raw`Positive charge drops by $IR$ in potential, so it loses $q\,IR$ of potential energy, which the resistor turns into heat at the rate $P = I^2R$.`,
    ],
    sim: { scenario: 'series' },
    cases: [
      kase('Class Activity 3 #17 C', { ask: 'current' }, { ans: 'sameI' }),
      kase('Class Activity 3 #17 E', { ask: 'potential' }, { ans: 'highA' }),
      kase('Class Activity 3 #17 F', { ask: 'energy' }, { ans: 'loseU' }),
    ],
  }),
  problem({
    ...E3, id: 'e3.41.block-R', ch: '41', src: 'Worksheet 3 #8', title: 'Which way through the block?', kind: 'numeric', level: 2, topics: ['resistance', 'proportional-reasoning'],
    vars: { a: range(1, 3, 1, 'cm', 1e-2), b: range(2, 6, 1, 'cm', 1e-2), c: range(6, 15, 1, 'cm', 1e-2) },
    derive: ($) => {
      // Current along each edge in turn, entering through the face made by the other two.
      const R = [$.a / ($.b * $.c), $.b / ($.a * $.c), $.c / ($.a * $.b)]; // × ρ
      const hi = R.indexOf(Math.max(...R));
      const lo = R.indexOf(Math.min(...R));
      return { hi, ratio: R[hi] / R[lo] };
    },
    valid: ($) => $.a < $.b && $.b < $.c,
    text: (T) => `A copper block measures ${T.a} cm × ${T.b} cm × ${T.c} cm. Wires can be attached to any pair of opposite faces, so the current runs along one of the three edges. Which way gives the largest resistance, and how many times larger is it than the smallest?`,
    parts: [
      mc('hi', [[0, 'Along the shortest edge'], [1, 'Along the middle edge'], [2, 'Along the longest edge'], [3, 'All three are the same']], ($) => $.hi, { label: 'Largest resistance' }),
      num('ratio', ($) => $.ratio, '', { label: String.raw`$R_{\max}/R_{\min}$` }),
    ],
    hints: [String.raw`$R = \rho L/A$: the current wants to be short and wide. The largest $R$ is the longest path through the smallest face.`],
    steps: ($, f, T) => [
      String.raw`Along the longest edge: $L = ${T.c}$ cm through a ${T.a} × ${T.b} cm face — the longest path and the smallest area together.`,
      String.raw`Along the shortest edge: $L = ${T.a}$ cm through a ${T.b} × ${T.c} cm face.`,
      String.raw`$\dfrac{R_{\max}}{R_{\min}} = \dfrac{${T.c}/(${T.a}\cdot${T.b})}{${T.a}/(${T.b}\cdot${T.c})} = \dfrac{${T.c}^2}{${T.a}^2} = ${texNum($.ratio)}$`,
    ],
    cases: [kase('Worksheet 3 #8', { a: 1, b: 4, c: 10 }, { hi: 2, ratio: 100 })],
  }),
  // ================================================================= 42
  problem({
    ...E3, id: 'e3.42.bulb', ch: '42', lab: 'power', title: 'Bulb resistance from its rating', kind: 'numeric', topics: ['power'],
    vars: { P: range(5, 200, 5, 'W'), V: range(12, 240, 12, 'V') },
    derive: ($) => ({ R: $.V ** 2 / $.P, I: $.P / $.V }),
    text: (T) => `A bulb is rated ${T.P} W at ${T.V} V. Find its operating resistance and current.`,
    parts: [
      sym('R_sym', 'V^2/P', { V: 'V', P: 'W' }, ($) => $.R, { unit: 'Ω', label: String.raw`$R$ as a formula` }),
      num('R', ($) => $.R, 'Ω'),
      num('I', ($) => $.I, 'A'),
    ],
    steps: ($, f) => [
      String.raw`$R = \dfrac{V^2}{P} = \dfrac{${pq($.V, 'V')}^2}{${qty($.P, 'W')}} = ${texNum($.R)}\ \Omega$`,
      String.raw`$I = \dfrac{P}{V} = \dfrac{${qty($.P, 'W')}}{${qty($.V, 'V')}} = ${texNum($.I)}\ \text{A}$`,
    ],
    sim: {
      scenario: 'pwr-60',
      setup(s, $) {
        s.power = { ...s.power, mode: 'dc', V: $.V, R: $.R };
      },
      read: (c, s, $) => ({ I: c.power.I, '@P from the lab': [c.power.P, $.P] }),
    },
    cases: [kase('60 W', { P: 60, V: 120 }, { R: 240, I: 0.5 }), kase('100 W', { P: 100, V: 120 }, { R: 144, I: 0.8333 })],
  }),
  problem({
    ...E3, id: 'e3.42.ac-rms', ch: '42', lab: 'power', title: 'RMS values and average power', kind: 'numeric', topics: ['power', 'rms'],
    vars: { Vrms: range(12, 240, 12, 'V'), R: range(10, 400, 10, 'Ω') },
    derive: ($) => ({ Vp: $.Vrms * Math.SQRT2, Irms: $.Vrms / $.R, P: $.Vrms ** 2 / $.R }),
    text: (T) => `A ${T.R} Ω resistor is connected to a ${T.Vrms} V (rms) AC outlet. Find the peak voltage, the rms current, and the average power.`,
    parts: [
      sym('P_sym', 'Vrms^2/R', { Vrms: 'V', R: 'Ω' }, ($) => $.P, { unit: 'W', label: String.raw`$P_{\text{avg}}$ as a formula` }),
      num('Vp', ($) => $.Vp, 'V'),
      num('Irms', ($) => $.Irms, 'A'),
      num('P', ($) => $.P, 'W'),
    ],
    steps: ($, f) => [
      String.raw`$V_p = \sqrt{2}\,V_{\text{rms}} = \sqrt{2}${pq($.Vrms, 'V')} = ${texNum($.Vp)}\ \text{V}$`,
      String.raw`$I_{\text{rms}} = \dfrac{V_{\text{rms}}}{R} = \dfrac{${qty($.Vrms, 'V')}}{${qty($.R, 'Ω')}} = ${texNum($.Irms)}\ \text{A}$`,
      String.raw`$P_{\text{avg}} = I_{\text{rms}}V_{\text{rms}} = ${pq($.Irms, 'A')}${pq($.Vrms, 'V')} = ${texNum($.P)}\ \text{W}$`,
    ],
    sim: {
      scenario: 'pwr-ac',
      setup(s, $) {
        s.power = { ...s.power, mode: 'ac', Vrms: $.Vrms, R: $.R };
      },
      read: (c) => ({ Vp: c.power.Vp, Irms: c.power.Irms, P: c.power.Pavg }),
    },
    cases: [kase('household', { Vrms: 120, R: 240 }, { Vp: 169.7, Irms: 0.5, P: 60 })],
  }),
  problem({
    ...E3, id: 'e3.42.cost', ch: '42', lab: 'power', title: 'Cost of electrical energy', kind: 'numeric', topics: ['power', 'energy'],
    vars: { P: range(50, 3000, 50, 'W'), h: range(0.5, 12, 0.5, 'h/day'), days: range(7, 31, 1, 'days'), rate: range(8, 40, 1, '¢/kWh') },
    derive: ($) => {
      const kWh = ($.P / 1000) * $.h * $.days;
      return { kWh, cost: (kWh * $.rate) / 100 };
    },
    text: (T) => `A ${T.P} W appliance runs ${T.h} hours a day for ${T.days} days. At ${T.rate}¢ per kWh, how much energy does it use and what does it cost?`,
    parts: [num('kWh', ($) => $.kWh, 'kWh'), num('cost', ($) => $.cost, '$', { abs: 0.01 })],
    steps: ($, f) => [
      String.raw`$E = Pt = ${pq($.P / 1000, 'kW')}${pq($.h, 'h/day')}${pq($.days, 'days')} = ${texNum($.kWh)}\ \text{kWh}$`,
      String.raw`Cost $= ${pq($.kWh, 'kWh')}${pq($.rate / 100, 'dollars/kWh')} = ${$.cost.toFixed(2)}$ dollars`,
    ],
    cases: [kase('space heater', { P: 1500, h: 3, days: 30, rate: 15 }, { kWh: 135, cost: 20.25 })],
  }),
  problem({
    ...E3, id: 'e3.42.two-bulbs', ch: '42', lab: 'power', title: 'Which bulb is brighter?', kind: 'numeric', level: 2, topics: ['power', 'circuits'],
    vars: { P1: range(20, 150, 10, 'W'), P2: range(20, 150, 10, 'W'), cfg: choice([1, 'in series'], [2, 'in parallel']) },
    derive: ($) => {
      const R1 = 120 ** 2 / $.P1;
      const R2 = 120 ** 2 / $.P2;
      const p1 = $.cfg === 1 ? (120 / (R1 + R2)) ** 2 * R1 : $.P1;
      const p2 = $.cfg === 1 ? (120 / (R1 + R2)) ** 2 * R2 : $.P2;
      return { R1, R2, p1, p2 };
    },
    valid: ($) => $.P1 !== $.P2,
    text: (T) => `Bulb 1 is rated ${T.P1} W and bulb 2 is rated ${T.P2} W, both at 120 V. They are connected ${T.cfg} across 120 V. Find the power delivered to bulb 1, and say which bulb glows brighter.`,
    parts: [num('p1', ($) => $.p1, 'W', { label: 'P₁' }), mc('brighter', [[1, 'Bulb 1'], [2, 'Bulb 2']], ($) => ($.p1 > $.p2 ? 1 : 2), { label: 'Brighter' })],
    hints: [String.raw`Find each $R$ from its rating, $R = V^2/P$. In series use $P = I^2R$; in parallel each bulb gets its full 120 V.`],
    steps: ($, f) => [
      String.raw`$R_1 = ${texNum($.R1)}\ \Omega$, $R_2 = ${texNum($.R2)}\ \Omega$`,
      String.raw`$P_1 = ${texNum($.p1)}\ \text{W}$, $P_2 = ${texNum($.p2)}\ \text{W}$`,
    ],
    cases: [kase('series', { P1: 60, P2: 100, cfg: 1 }, { p1: 23.44, brighter: 1 }), kase('parallel', { P1: 60, P2: 100, cfg: 2 }, { p1: 60, brighter: 2 })],
  }),
  problem({
    ...E3, id: 'e3.42.heater', ch: '42', lab: 'power', title: 'Heating water with a resistor', kind: 'numeric', topics: ['power', 'energy'],
    vars: { V: range(12, 240, 12, 'V'), R: range(5, 100, 1, 'Ω'), t: range(1, 20, 1, 'min', 60), m: range(0.2, 5, 0.1, 'kg') },
    derive: ($) => {
      const P = $.V ** 2 / $.R;
      return { P, Q: P * $.t, dT: (P * $.t) / ($.m * 4186) };
    },
    text: (T) => `A heater with R = ${T.R} Ω on ${T.V} V runs for ${T.t} min in ${T.m} kg of water (c = 4186 J/kg·°C). Find its power, the energy delivered, and the temperature rise (assume no losses).`,
    parts: [
      sym('Q_sym', 'V^2*t/R', { V: 'V', R: 'Ω', t: 's' }, ($) => $.Q, { unit: 'J', label: String.raw`the heat $Q$ as a formula` }),
      num('P', ($) => $.P, 'W'),
      num('Q', ($) => $.Q, 'J'),
      num('dT', ($) => $.dT, '°C'),
    ],
    steps: ($, f) => [
      String.raw`$P = \dfrac{V^2}{R} = \dfrac{${pq($.V, 'V')}^2}{${qty($.R, 'Ω')}} = ${texNum($.P)}\ \text{W}$`,
      String.raw`$Q = Pt = ${pq($.P, 'W')}${pq($.t, 's')} = ${texNum($.Q)}\ \text{J}$`,
      String.raw`$\Delta T = \dfrac{Q}{mc} = \dfrac{${qty($.Q, 'J')}}{${pq($.m, 'kg')}${pq(4186, 'J/kg·°C')}} = ${texNum($.dT)}\,^\circ\text{C}$`,
    ],
    sim: {
      scenario: 'pwr-heater',
      setup(s, $) {
        s.power = { ...s.power, mode: 'dc', V: $.V, R: $.R };
      },
      read: (c) => ({ P: c.power.P }),
    },
    cases: [kase('hand', { V: 120, R: 18, t: 5, m: 1 }, { P: 800, Q: 240000, dT: 57.33 })],
  }),
  problem({
    ...E3, id: 'e3.42.fuse', ch: '42', lab: 'power', title: 'Will the breaker trip?', kind: 'numeric', topics: ['power', 'current'],
    vars: { P1: range(100, 1800, 100, 'W'), P2: range(100, 1800, 100, 'W'), P3: range(0, 1500, 100, 'W'), Imax: choice([15, '15 A'], [20, '20 A']) },
    derive: ($) => ({ I: ($.P1 + $.P2 + $.P3) / 120 }),
    text: (T) => `Appliances of ${T.P1} W, ${T.P2} W and ${T.P3} W run at the same time on one 120 V household circuit with a ${T.Imax} breaker. What total current do they draw? Does the breaker trip?`,
    parts: [num('I', ($) => $.I, 'A'), mc('trip', [[1, 'Yes, it trips'], [0, 'No']], ($) => ($.I > $.Imax ? 1 : 0), { label: 'Does it trip?' })],
    hints: ['Household outlets are in parallel, so the currents add.'],
    steps: ($, f) => [
      String.raw`$I = \dfrac{\sum P}{V} = \dfrac{(${texNum($.P1)} + ${texNum($.P2)} + ${texNum($.P3)})\ \text{W}}{120\ \text{V}} = ${texNum($.I)}\ \text{A}$`,
      String.raw`${$.I > $.Imax ? 'More' : 'Less'} than the ${$.Imax} A rating, so the breaker ${$.I > $.Imax ? 'trips' : 'holds'}.`,
    ],
    cases: [kase('kitchen', { P1: 1200, P2: 800, P3: 500, Imax: 15 }, { I: 20.83, trip: 1 })],
  }),
  problem({
    ...E3, id: 'e3.42.grounding', ch: '42', title: 'What the ground wire is for', kind: 'conceptual', topics: ['power', 'safety', 'grounding'],
    vars: {
      ask: choice(
        ['why', 'Why is one wire of a household circuit connected to earth?'],
        ['drill', 'A drill with a metal case develops a short between the hot wire and the case. What does the grounding wire do?'],
        ['breaker', 'What is a breaker or fuse there to do?'],
        ['what-hurts', 'In an electric shock, what actually causes the damage?'],
      ),
    },
    text: (T) => T.ask,
    parts: [
      mc(
        'ans',
        // The first three questions are about three jobs that are easy to mix up, so each offers all three.
        ($) => ($.ask === 'what-hurts'
          ? [['voltage', 'The voltage of the source'], ['current', 'The current through the body'], ['power', 'The power of the source']]
          : [
              ['reference', 'It fixes a common zero of potential, so every device is measured against the same reference'],
              ['path', 'It gives the current a low-resistance path to earth so it does not travel through the person touching the case'],
              ['limit', 'It opens the circuit when the current exceeds what the wiring can safely carry, before the wire overheats'],
            ]),
        ($) => ({ why: 'reference', drill: 'path', breaker: 'limit', 'what-hurts': 'current' })[$.ask],
      ),
    ],
    hints: ['The ground does two separate jobs: it sets a common reference, and it gives fault current somewhere to go that is not you.'],
    steps: ($) => [
      $.ask === 'why'
        ? 'Earth is the same conductor for everyone, so calling it 0 V means every device sees the same voltage.'
        : $.ask === 'drill'
          ? 'Without the ground wire the only path from the shorted case to earth runs down the arm and through the body. The ground wire is a far better conductor, so the current goes there instead.'
          : $.ask === 'breaker'
            ? 'It trips on excess current and opens the circuit, so the wiring cannot overheat and start a fire.'
            : 'A few mA is a tingle; above about 100 mA can be fatal. Voltage drives the current, but it is the current through the body that matters.',
    ],
    cases: [kase('drill', { ask: 'drill' }, { ans: 'path' }), kase('breaker', { ask: 'breaker' }, { ans: 'limit' })],
  }),
  problem({
    ...E3, id: 'e3.42.body-current', ch: '42', title: 'Current through the body', kind: 'numeric', level: 2, topics: ['power', 'ohms-law', 'safety'],
    vars: {
      V: choice([12, 12], [24, 24], [120, 120], [240, 240]),
      skin: choice(['dry', 'dry skin (about 100 kΩ hand to hand)'], ['wet', 'wet skin (about 1.5 kΩ hand to hand)']),
    },
    derive: ($) => {
      const R = $.skin === 'dry' ? 100e3 : 1500;
      const I = $.V / R;
      const mA = I * 1e3;
      // The thresholds the notes give: a few mA is felt, above ~100 mA can be fatal.
      const band = mA < 1 ? 'none' : mA < 100 ? 'felt' : 'fatal';
      return { R, I, mA, band, P: $.V * I };
    },
    text: (T) => `A person contacts a ${T.V} V source hand to hand with ${T.skin}. How much current flows through them, and how serious is it?`,
    parts: [
      num('I', ($) => $.I, 'mA', { scale: 1e-3, label: 'I' }),
      mc(
        'band',
        [['none', 'Below the threshold of sensation'], ['felt', 'Felt — from a tingle up to a painful, muscle-locking shock'], ['fatal', 'Above about 100 mA — potentially fatal']],
        ($) => $.band,
        { label: 'How serious?' },
      ),
    ],
    hints: [
      String.raw`It is still just Ohm's law: $I = V/R$, with the body as the resistor.`,
      String.raw`The same voltage is harmless through dry skin and dangerous through wet skin, because $R$ drops by a factor of about 60.`,
    ],
    steps: ($, f) => [
      String.raw`$I = \dfrac{V}{R} = \dfrac{${$.V}}{${texNum($.R)}} = ${texNum($.mA)}\ \text{mA}$`,
      $.band === 'fatal'
        ? 'Above roughly 100 mA, so this one is potentially fatal — which is why wet hands and mains voltage are a genuinely dangerous combination.'
        : $.band === 'felt'
          ? 'Enough to feel, and possibly enough to lock the muscles so the person cannot let go.'
          : 'Below the threshold of sensation.',
    ],
    cases: [
      kase('120 V, wet', { V: 120, skin: 'wet' }, { I: 80, band: 'felt' }),
      kase('120 V, dry', { V: 120, skin: 'dry' }, { I: 1.2, band: 'felt' }),
      kase('240 V, wet', { V: 240, skin: 'wet' }, { I: 160, band: 'fatal' }),
    ],
  }),
  problem({
    ...E3, id: 'e3.42.power-basics', ch: '42', lab: 'power', src: 'Practice 42 #1–4', title: 'Power, four ways', kind: 'numeric', topics: ['power'],
    vars: {
      ask: choice(['P', 'P from V and R'], ['R', 'R from P and V'], ['I', 'I from P and V'], ['both', 'R and I from P and V']),
      V: range(12, 240, 6, 'V'),
      R: range(10, 400, 10, 'Ω'),
      P: range(25, 200, 5, 'W'),
    },
    // The current the scenario actually carries — from V and R when those are the givens,
    // otherwise from P and V — so the second part means something in every branch.
    derive: ($) => ({ Pv: $.V ** 2 / $.R, Rp: $.V ** 2 / $.P, Ip: $.ask === 'P' ? $.V / $.R : $.P / $.V }),
    text: (T, $) => ({
      P: `A light bulb running at ${T.V} V dc has a resistance of ${T.R} Ω. How much power does it dissipate?`,
      R: `A ${T.P} W light runs on a ${T.V} V supply. What is its resistance?`,
      I: `A ${T.P} W heater is connected to a ${T.V} V source. What current flows through it?`,
      both: `A ${T.P} W motor runs from a ${T.V} V supply. Find its resistance and the current it draws.`,
    })[$.ask],
    parts: [
      num('ans', ($) => ({ P: $.Pv, R: $.Rp, I: $.Ip, both: $.Rp })[$.ask], ($) => ({ P: 'W', R: 'Ω', I: 'A', both: 'Ω' })[$.ask], { label: (T, $) => ({ P: 'P', R: 'R', I: 'I', both: 'R' })[$.ask] }),
      num('I2', ($) => $.Ip, 'A', { label: 'Current drawn' }),
    ],
    hints: [String.raw`$P = IV = I^2R = \dfrac{V^2}{R}$ — pick the form that uses what you were given.`],
    steps: ($, f) => [
      ({
        P: String.raw`$P = \dfrac{V^2}{R} = \dfrac{${pq($.V, 'V')}^2}{${qty($.R, 'Ω')}} = ${texNum($.Pv)}\ \text{W}$`,
        R: String.raw`$R = \dfrac{V^2}{P} = \dfrac{${pq($.V, 'V')}^2}{${qty($.P, 'W')}} = ${texNum($.Rp)}\ \Omega$`,
        I: String.raw`$I = \dfrac{P}{V} = \dfrac{${qty($.P, 'W')}}{${qty($.V, 'V')}} = ${texNum($.Ip)}\ \text{A}$`,
        both: String.raw`$R = \dfrac{V^2}{P} = \dfrac{${pq($.V, 'V')}^2}{${qty($.P, 'W')}} = ${texNum($.Rp)}\ \Omega$ and $I = \dfrac{P}{V} = \dfrac{${qty($.P, 'W')}}{${qty($.V, 'V')}} = ${texNum($.Ip)}\ \text{A}$`,
      })[$.ask],
    ],
    cases: [
      kase('#1', { ask: 'P', V: 120, R: 200, P: 100 }, { ans: 72, I2: 0.6 }, { key: '72 W' }),
      kase('#2', { ask: 'R', V: 12, R: 100, P: 150 }, { ans: 0.96, I2: 12.5 }, { key: '0.96 Ω' }),
      kase('#3', { ask: 'I', V: 110, R: 100, P: 100 }, { ans: 0.909, I2: 0.909 }, { key: '0.91 A' }),
      kase('#4', { ask: 'both', V: 12, R: 100, P: 100 }, { ans: 1.44, I2: 8.333 }, { key: 'A) 1.44 Ω  B) 8.33 A' }),
    ],
  }),
  problem({
    ...E3, id: 'e3.42.R-from-P-I', ch: '42', lab: 'power', src: 'Class Activity 3 #19', title: 'Resistance from power and current', kind: 'numeric', topics: ['power'],
    vars: { P: range(1, 100, 1, 'W'), I: range(0.1, 5, 0.1, 'A') },
    derive: ($) => ({ R: $.P / $.I ** 2, V: $.P / $.I }),
    valid: ($) => $.R >= 0.5 && $.R <= 5000,
    text: (T) => `A lamp uses ${T.P} W while ${T.I} A flows through it. What is its resistance, and what voltage is across it?`,
    parts: [num('R', ($) => $.R, 'Ω'), num('V', ($) => $.V, 'V')],
    hints: [String.raw`You were given $P$ and $I$, so use the form with those two: $P = I^2R$.`],
    steps: ($) => [
      String.raw`$R = \dfrac{P}{I^2} = \dfrac{${qty($.P, 'W')}}{${pq($.I, 'A')}^2} = ${texNum($.R)}\ \Omega$`,
      String.raw`$V = \dfrac{P}{I} = \dfrac{${qty($.P, 'W')}}{${qty($.I, 'A')}} = ${texNum($.V)}\ \text{V}$`,
    ],
    sim: {
      scenario: 'pwr-60',
      setup(s, $) {
        s.power = { ...s.power, mode: 'dc', V: $.V, R: $.R, load: 'bulb' };
      },
      read: (c, s, $) => ({ '@power the lab dissipates (W)': [c.power.P, $.P], '@current the lab draws (A)': [c.power.I, $.I] }),
    },
    cases: [kase('Class Activity 3 #19', { P: 5, I: 0.5 }, { R: 20, V: 10 })],
  }),
  problem({
    ...E3, id: 'e3.42.hot-wire', ch: '42', lab: 'ohm', src: 'Class Activity 3 #23', title: 'Power of a wire, cold and glowing', kind: 'numeric', level: 3, topics: ['power', 'resistance', 'temperature'],
    vars: { L: range(1, 10, 0.5, 'm'), r: range(0.1, 0.5, 0.05, 'mm', 1e-3), V: range(12, 240, 12, 'V'), T: range(200, 2000, 100, '°C') },
    derive: ($) => {
      const Nc = mat('nichrome');
      const A = Math.PI * $.r ** 2;
      const R20 = (Nc.rho * $.L) / A;
      const RT = R20 * (1 + Nc.alpha * ($.T - 20));
      return { rho: Nc.rho, A, R20, RT, P20: ($.V * $.V) / R20, PT: ($.V * $.V) / RT };
    },
    text: (T) => `A nichrome wire (ρ = 1.00×10⁻⁶ Ω·m at 20 °C, α = 4.0×10⁻⁴ /°C) is ${T.L} m long with a radius of ${T.r} mm, connected across ${T.V} V. Find the power it dissipates at 20 °C, and at ${T.T} °C once it glows.`,
    parts: [
      sym('P_sym', 'V^2*pi*r^2/(rho*L)', { V: 'V', r: 'm', rho: 'Ω*m', L: 'm' }, ($) => $.P20, { unit: 'W', label: String.raw`$P$ at 20 °C as a formula (use V, r, ρ, L)` }),
      num('P20', ($) => $.P20, 'W', { label: String.raw`$P$ at 20 °C` }),
      num('PT', ($) => $.PT, 'W', { label: 'P when hot' }),
    ],
    hints: [
      String.raw`$R = \rho L/A$ with $A = \pi r^2$, then $P = V^2/R$ — the voltage is what the supply fixes.`,
      String.raw`Hot: $R_T = R_{20}\left[1 + \alpha(T - 20\,^\circ\text{C})\right]$. More resistance at the same voltage means *less* power.`,
    ],
    steps: ($) => [
      String.raw`$R_{20} = \dfrac{\rho L}{\pi r^2} = ${texNum($.R20)}\ \Omega$, so $P_{20} = \dfrac{V^2}{R_{20}} = ${texNum($.P20)}\ \text{W}$`,
      String.raw`$R_T = R_{20}\left[1 + \alpha\,\Delta T\right] = ${texNum($.RT)}\ \Omega$, so $P_T = ${texNum($.PT)}\ \text{W}$`,
    ],
    sim: {
      scenario: 'ohm-hot',
      setup(s, $) {
        s.ohm = { material: 'nichrome', L: $.L, A: Math.PI * $.r ** 2, V: $.V, T: $.T };
      },
      read: (c) => ({ PT: c.ohm.P }),
    },
    cases: [kase('Class Activity 3 #23', { L: 4, r: 0.2, V: 120, T: 2000 }, { P20: 452.4, PT: 252.4 })],
  }),
  problem({
    ...E3, id: 'e3.42.ac-from-equation', ch: '42', src: 'Practice 42 #11–13', title: 'Reading an ac current equation', kind: 'numeric', level: 2, topics: ['power', 'rms', 'ac'],
    vars: { Ip: range(0.2, 3, 0.1, 'A'), w: range(120, 400, 1, 'rad/s'), R: range(10, 200, 10, 'Ω') },
    derive: ($) => ({ Irms: $.Ip / Math.SQRT2, f: $.w / (2 * Math.PI), P: ($.Ip / Math.SQRT2) ** 2 * $.R }),
    text: (T) => `The current through a ${T.R} Ω resistor is I = (${T.Ip} A) sin[(${T.w}/s)t], with t in seconds. Find the rms current, the frequency, and the average power dissipated.`,
    parts: [
      num('Irms', ($) => $.Irms, 'A', { label: String.raw`$I_{\text{rms}}$` }),
      num('f', ($) => $.f, 'Hz', { label: 'f' }),
      num('P', ($) => $.P, 'W', { label: String.raw`$P_{\text{avg}}$` }),
    ],
    hints: [
      String.raw`The number in front of the sine is the *peak*, so $I_{\text{rms}} = I_p/\sqrt{2}$.`,
      String.raw`The number multiplying $t$ is $\omega$, not $f$: $f = \omega/2\pi$.`,
      String.raw`Average power uses rms values: $P = I_{\text{rms}}^2 R$.`,
    ],
    steps: ($, f) => [
      String.raw`$I_{\text{rms}} = \dfrac{I_p}{\sqrt{2}} = \dfrac{${qty($.Ip, 'A')}}{\sqrt{2}} = ${texNum($.Irms)}\ \text{A}$`,
      String.raw`$f = \dfrac{\omega}{2\pi} = \dfrac{${qty($.w, 'rad/s')}}{2\pi} = ${texNum($.f)}\ \text{Hz}$`,
      String.raw`$P_{\text{avg}} = I_{\text{rms}}^2R = ${pq($.Irms, 'A')}^2${pq($.R, 'Ω')} = ${texNum($.P)}\ \text{W}$`,
    ],
    cases: [kase('#11, #13', { Ip: 0.8, w: 240, R: 50 }, { Irms: 0.5657, f: 38.2, P: 16 }, { key: '0.57 A; 38.2 Hz' })],
  }),
  problem({
    ...E3, id: 'e3.42.ac-graph', ch: '42', lab: 'power', src: 'Class Activity 3 #20', title: 'Reading an ac current graph', kind: 'numeric', level: 2, topics: ['power', 'rms', 'ac'],
    vars: { Ip: range(2, 15, 1, 'A'), grid: choice(['us', '120 V (rms), 60 Hz'], ['eu', '230 V (rms), 50 Hz']) },
    derive: ($) => {
      const Vrms = $.grid === 'eu' ? 230 : 120;
      const Irms = $.Ip / Math.SQRT2;
      return { Vrms, Irms, R: Vrms / Irms, P: Irms * Vrms };
    },
    text: (T) => `The graph shows the current through a toaster's heating element when it is plugged into a ${T.grid} outlet. Find the rms current, the element's resistance, and the average power it uses.`,
    figure: ($) => acGraphSVG($.Ip),
    parts: [
      num('Irms', ($) => $.Irms, 'A', { label: String.raw`$I_{\text{rms}}$` }),
      num('R', ($) => $.R, 'Ω'),
      num('P', ($) => $.P, 'W', { label: String.raw`$P_{\text{avg}}$` }),
    ],
    hints: [
      'The graph gives the peak current. The outlet rating is already an rms value.',
      String.raw`$I_{\text{rms}} = I_p/\sqrt{2}$, then $R = V_{\text{rms}}/I_{\text{rms}}$ and $P_{\text{avg}} = I_{\text{rms}}V_{\text{rms}}$.`,
    ],
    steps: ($) => [
      String.raw`The peak is ${texNum($.Ip)} A, so $I_{\text{rms}} = \dfrac{${qty($.Ip, 'A')}}{\sqrt{2}} = ${texNum($.Irms)}\ \text{A}$`,
      String.raw`$R = \dfrac{V_{\text{rms}}}{I_{\text{rms}}} = \dfrac{${qty($.Vrms, 'V')}}{${qty($.Irms, 'A')}} = ${texNum($.R)}\ \Omega$`,
      String.raw`$P_{\text{avg}} = I_{\text{rms}}V_{\text{rms}} = ${pq($.Irms, 'A')}${pq($.Vrms, 'V')} = ${texNum($.P)}\ \text{W}$`,
    ],
    sim: {
      scenario: 'pwr-ac',
      setup(s, $) {
        s.power = { ...s.power, mode: 'ac', Vrms: $.Vrms, R: $.R, f: $.grid === 'eu' ? 50 : 60, load: 'heater' };
      },
      read: (c, s, $) => ({ Irms: c.power.Irms, P: c.power.Pavg, '@peak current in the lab (A)': [c.power.Ip, $.Ip] }),
    },
    cases: [kase('Class Activity 3 #20', { Ip: 10, grid: 'us' }, { Irms: 7.071, R: 16.97, P: 848.5 })],
  }),
  problem({
    ...E3, id: 'e3.42.concepts', ch: '42', src: 'Practice 42 #5–6, 14–15', title: 'Power in series, and power transmission', kind: 'conceptual', level: 2, topics: ['power', 'circuits'],
    vars: {
      ask: choice(
        ['series', 'A battery drives two resistors in series, one 5 Ω and one 10 Ω. In which is energy dissipated at the higher rate?'],
        ['brighter', 'A 100 W lamp glows brighter than a 25 W lamp on the same supply. The 100 W lamp’s resistance is'],
        ['transmission', 'What is the most efficient way to transmit electrical energy over power lines?'],
        ['harm', 'Which electrical property of a source is most dangerous to the human body?'],
      ),
    },
    text: (T) => T.ask,
    parts: [
      mc('ans', ($) => ({
        series: [['smallR', 'In the smaller resistance'], ['bigR', 'In the larger resistance'], ['same', 'At the same rate in both']],
        brighter: [['greater', 'greater than the 25 W lamp’s'], ['less', 'less than the 25 W lamp’s'], ['same', 'the same as the 25 W lamp’s']],
        transmission: [
          ['highI', 'At high current and low voltage'],
          ['highV', 'At high voltage and low current'],
          ['same', 'It makes no difference, since the same power is sent either way'],
        ],
        harm: [['voltage', 'The voltage'], ['current', 'The current'], ['power', 'The power']],
      })[$.ask], ($) => ({ series: 'bigR', brighter: 'less', transmission: 'highV', harm: 'current' })[$.ask]),
    ],
    hints: [
      String.raw`In series the current is shared, so use the form of the power law that holds $I$ fixed: $P = I^2R$.`,
      String.raw`On a fixed supply voltage the bulbs share $V$, so use $P = V^2/R$ instead — the bigger power belongs to the smaller resistance.`,
    ],
    steps: ($) => [
      $.ask === 'series'
        ? String.raw`Same $I$ through both, and $P = I^2R$, so the larger resistance dissipates more. (Reaching for $P = V^2/R$ here gives the wrong answer, because the two resistors do not share the same $V$.)`
        : $.ask === 'brighter'
          ? String.raw`Both sit across the same $V$, so $P = V^2/R$: more power means *less* resistance. This is the mirror image of the series case — which formula is right depends on what is shared.`
          : $.ask === 'transmission'
            ? String.raw`Line loss is $I^2R$. For a given delivered power $P = IV$, raising $V$ lowers $I$, and the loss falls as the square.`
            : String.raw`Voltage drives it, but current through the body does the damage — a few mA is felt, and over about 100 mA can be fatal.`,
    ],
    cases: [
      kase('#5', { ask: 'series' }, { ans: 'bigR' }, { key: 'A) the 10 Ω resistor' }),
      kase('#6', { ask: 'brighter' }, { ans: 'less' }, { key: 'A) less' }),
      kase('#14', { ask: 'transmission' }, { ans: 'highV' }, { key: 'B) High voltage' }),
      kase('#15', { ask: 'harm' }, { ans: 'current' }, { key: 'B) Current' }),
    ],
  }),
];
