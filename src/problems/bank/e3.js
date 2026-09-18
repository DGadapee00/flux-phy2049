/** Exam 3 · Ch 38–39 (potential), 40 (capacitors), 41 (current, resistance), 42 (power). */
import { problem, kase, range, choice, SIGN, num, mc, sym, K, EPS0, QE, ME, MP, POSNEG, charge, layout, texNum } from '../kit.js';
import { DIELECTRICS } from '../../physics/capacitor.js';
import { MATERIALS } from '../../physics/circuit.js';

const E3 = { exam: 'e3' };
const kap = (id) => DIELECTRICS.find((d) => d.id === id).kappa;
const mat = (id) => MATERIALS.find((m) => m.id === id);
const MATS = choice(...['copper', 'aluminum', 'tungsten', 'iron', 'nichrome'].map((id) => [id, mat(id).name.toLowerCase()]));
const DIEL = choice(...['teflon', 'paper', 'nylon', 'rubber'].map((id) => [id, `${DIELECTRICS.find((d) => d.id === id).name.toLowerCase()} (κ = ${kap(id)})`]));

/** Potential lab: the problem's charges, its point B (the probe) and its point A. */
function potSetup(list, probe, pathA) {
  return (s, $) => layout(s, { charges: list($), probe: probe($), pathA: pathA ? pathA($) : null });
}

export default [
  // ================================================================= 38
  problem({
    ...E3, id: 'e3.38.point-V', ch: '38', lab: 'potential', title: 'Potential of a point charge', kind: 'numeric', topics: ['potential'],
    vars: { q: range(0.5, 5, 0.1, 'μC', 1e-6), s: SIGN, r: range(0.1, 3, 0.05, 'm') },
    derive: ($) => ({ V: (K * $.s * $.q) / $.r }),
    text: (T) => `Find the electric potential ${T.r} m from a ${T.s} ${T.q} μC point charge (V = 0 at infinity).`,
    parts: [num('V', ($) => $.V, 'V')],
    hints: [String.raw`$V$ is a scalar and keeps the sign of $q$.`],
    steps: ($, f) => [String.raw`$V = \dfrac{kq}{r} = ${texNum($.V)}\ \text{V}$`],
    sim: {
      scenario: 'v-plus',
      setup: potSetup(($) => [charge($.s * $.q, 0, 0)], ($) => ({ x: $.r, y: 0 }), ($) => ({ x: 2 * $.r, y: 0 })),
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
      String.raw`$V_A = ${texNum($.VA)}\ \text{V}$, $V_B = ${texNum($.VB)}\ \text{V}$`,
      String.raw`$W = -q(V_B - V_A) = ${texNum($.W)}\ \text{J}$`,
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
    ...E3, id: 'e3.38.uniform-dV', ch: '38', lab: 'potential', title: 'ΔV in a uniform field', kind: 'numeric', topics: ['potential'],
    vars: { E: range(100, 5000, 100, 'N/C'), d: range(1, 50, 1, 'cm', 1e-2), dir: choice([1, 'along'], [-1, 'against']), q: range(1, 10, 1, 'μC', 1e-6), s: SIGN },
    derive: ($) => {
      const dV = -$.E * $.dir * $.d;
      return { dV, W: -$.s * $.q * dV };
    },
    text: (T) => `In a uniform ${T.E} N/C field, a ${T.s} ${T.q} μC charge moves ${T.d} cm ${T.dir} the field direction. Find $\Delta V = V_B - V_A$ and the work done by the field.`,
    parts: [num('dV', ($) => $.dV, 'V', { label: 'ΔV' }), num('W', ($) => $.W, 'J', { label: String.raw`$W_{\text{field}}$` })],
    hints: [String.raw`$\Delta V = -\vec{E}\cdot\Delta\vec{r}$ — moving along $\vec{E}$ lowers the potential.`],
    steps: ($, f) => [
      String.raw`$\Delta V = -Ed\cos\theta = ${texNum($.dV)}\ \text{V}$`,
      String.raw`$W = -q\,\Delta V = ${texNum($.W)}\ \text{J}$`,
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
      read: (c) => ({ dV: c.V - c.VA, W: c.Wfield }),
    },
    cases: [kase('hand', { E: 2000, d: 10, dir: 1, q: 1, s: 1 }, { dV: -200, W: 2e-4 })],
  }),
  problem({
    ...E3, id: 'e3.38.accelerate', ch: '38', lab: 'potential', title: 'Speed after accelerating through ΔV', kind: 'numeric', topics: ['potential', 'energy'],
    vars: { p: choice([-1, 'An electron'], [1, 'A proton']), V: range(10, 5000, 10, 'V') },
    derive: ($) => ({ m: $.p > 0 ? MP : ME, K: QE * $.V, v: Math.sqrt((2 * QE * $.V) / ($.p > 0 ? MP : ME)) }),
    text: (T) => `${T.p} starts from rest and is accelerated through a potential difference of ${T.V} V. Find its kinetic energy (J and eV) and its final speed.`,
    parts: [num('KJ', ($) => $.K, 'J', { label: 'K (J)' }), num('KeV', ($) => $.V, 'eV', { label: 'K (eV)' }), num('v', ($) => $.v, 'm/s')],
    steps: ($, f) => [
      String.raw`$K = |q|\,\Delta V = ${texNum($.K)}\ \text{J} = ${texNum($.V)}\ \text{eV}$`,
      String.raw`$v = \sqrt{\dfrac{2K}{m}} = ${texNum($.v)}\ \text{m/s}$`,
    ],
    cases: [kase('hand', { p: -1, V: 100 }, { KJ: 1.6e-17, KeV: 100, v: 5.927e6 })],
  }),
  problem({
    ...E3, id: 'e3.38.pair-energy', ch: '38', lab: 'potential', title: 'Potential energy of two charges', kind: 'numeric', topics: ['potential-energy'],
    vars: { q1: range(0.5, 10, 0.5, 'μC', 1e-6), s1: SIGN, q2: range(0.5, 10, 0.5, 'μC', 1e-6), s2: SIGN, r: range(0.05, 2, 0.05, 'm') },
    derive: ($) => ({ U: (K * $.s1 * $.q1 * $.s2 * $.q2) / $.r }),
    text: (T) => `A ${T.s1} ${T.q1} μC charge and a ${T.s2} ${T.q2} μC charge are ${T.r} m apart. What is their electric potential energy? How much work did an external agent do to bring them together from far away, at rest?`,
    parts: [num('U', ($) => $.U, 'J', { label: 'U' }), num('W', ($) => $.U, 'J', { label: String.raw`$W_{\text{ext}}$` })],
    steps: ($, f) => [String.raw`$U = \dfrac{kq_1q_2}{r} = ${texNum($.U)}\ \text{J}$, and $W_{\text{ext}} = \Delta U = U$`],
    sim: {
      scenario: 'v-plus',
      setup(s, $) {
        const note = potSetup(() => [charge($.s1 * $.q1, 0, 0)], () => ({ x: $.r, y: 0 }), () => ({ x: 3 * $.r, y: 0 }))(s, $);
        s.qTest = $.s2 * $.q2;
        return note;
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
      String.raw`$U_{2} = \dfrac{kq_1q_2}{r_{12}} = ${texNum($.U12)}\ \text{J}$`,
      String.raw`$U_{3} = \dfrac{kq_1q_3}{r_{13}} + \dfrac{kq_2q_3}{r_{23}} = ${texNum($.U13)} + ${texNum($.U23)} = ${texNum($.U3)}\ \text{J}$`,
      String.raw`$U_{\text{system}} = ${texNum($.U)}\ \text{J}$ — three pairs, each counted once.`,
    ],
    sim: {
      scenario: 'v-plus',
      setup(s, $) {
        // q1 and q2 in the scene; q3 rides the probe, so the lab's PE is exactly the third step.
        const note = potSetup(
          () => [charge($.q1, 0, 0), charge($.q2, $.r12, 0)],
          () => ({ x: $.x3, y: $.y3 }),
          () => ({ x: $.r12 / 2, y: -$.r13 }),
        )(s, $);
        s.qTest = $.q3;
        return note;
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
    text: (T) => `The potential along the x-axis is V(x) = ${T.a}x² + ${T.b}x + 5 (V, with x in m). Find Eₓ at x = ${T.x0} m.`,
    parts: [
      sym('Ex_sym', '-(2*a*x0 + b)', { a: 'V/m²', b: 'V/m', x0: 'm' }, ($) => $.Ex, { unit: 'V/m', label: String.raw`$E_x$ as a formula (use a, b, x0)` }),
      num('Ex', ($) => $.Ex, 'V/m', { abs: 0.01 }),
    ],
    hints: [String.raw`$E_x = -\dfrac{dV}{dx}$`],
    steps: ($, f) => [
      String.raw`$E_x = -\dfrac{dV}{dx} = -(2ax + b)$`,
      String.raw`At $x = x_0$: $E_x = ${texNum($.Ex)}\ \text{V/m}$`,
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
    steps: ($, f) => [String.raw`$V = k\left(\dfrac{q_1}{a} + \dfrac{q_2}{b}\right) = ${texNum($.V)}\ \text{V}$`],
    sim: {
      scenario: 'v-ch39a',
      setup: potSetup(($) => [charge($.s1 * $.q1, -$.a, 0), charge($.s2 * $.q2, 0, $.b)], () => ({ x: 0, y: 0 }), ($) => ({ x: $.a / 2, y: 0 })),
      read: (c) => ({ V: c.V }),
    },
    cases: [kase('Ch 39 example (a)', { q1: 2, s1: 1, a: 0.8, q2: 1, s2: -1, b: 0.4 }, { V: 0 }), kase('Ch 39 example (b)', { q1: 2, s1: 1, a: 0.4, q2: 1, s2: -1, b: 0.8 }, { V: 33705 })],
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
      String.raw`$\dfrac{kq_1}{x} = \dfrac{k|q_2|}{d-x} \;\Longrightarrow\; x = \dfrac{dq_1}{q_1 + |q_2|} = ${texNum($.x)}\ \text{m}$`,
      String.raw`Between opposite charges both fields point toward the negative one, so $\vec{E} \neq 0$ there.`,
    ],
    sim: {
      scenario: 'v-dipole',
      setup: potSetup(($) => [charge($.q1, 0, 0), charge(-$.q2, $.d, 0)], ($) => ({ x: $.x, y: 0 }), ($) => ({ x: -$.d / 2, y: 0 })),
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
      String.raw`$V = \displaystyle\int \frac{k\,dq}{r} = \frac{kQ}{\sqrt{a^2+y^2}} = ${texNum($.V)}\ \text{V}$`,
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
      String.raw`$V = ${texNum($.V)}\ \text{V}$`,
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
      String.raw`$V = ${texNum($.V)}\ \text{V}$`,
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
        ($) => ({ x: 0, y: 3 * $.r0 }),
      ),
      read: (c) => ({ V: c.V }),
    },
    cases: [
      kase('notes (b)', { cfg: 'b', q: 1, r0: 1 }, { V: 13485, sign: 1, same: 'ad' }, { key: '+13,500 V', note: 'Key writes the first term as +1800 V; k(2q)/r₀ with q = 1 μC, r₀ = 1 m is +18,000 V. The stated total, 13,500 V, is right.' }),
      kase('notes (a)', { cfg: 'a', q: 1, r0: 1 }, { V: 0, sign: 0, same: 'ad' }, { key: '0 V' }),
      kase('notes (c)', { cfg: 'c', q: 1, r0: 1 }, { V: 4495, sign: 1, same: 'ad' }, { key: '+4,500 V' }),
    ],
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
      String.raw`$C = \dfrac{\varepsilon_0 A}{d} = ${texNum($.C)}\ \text{F}$`,
      String.raw`$Q = CV = ${texNum($.Q)}\ \text{C}$`,
      String.raw`$E = \dfrac{V}{d} = ${texNum($.E)}\ \text{V/m}$`,
      String.raw`$U = \tfrac{1}{2}CV^2 = ${texNum($.U)}\ \text{J}$`,
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
      String.raw`$C = \kappa C_0 = ${texNum($.C)}\ \text{F}$`,
      String.raw`$V$ stays fixed, so $Q = \kappa C_0 V = ${texNum($.Q)}\ \text{C}$`,
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
    ...E3, id: 'e3.40.dielectric-isolated', ch: '40', lab: 'capacitor', title: 'Inserting a dielectric after disconnecting', kind: 'numeric', level: 2, topics: ['capacitance', 'dielectrics', 'energy'],
    vars: { A: range(0.01, 2, 0.01, 'm²'), d: range(1, 120, 1, 'mm', 1e-3), V0: range(1, 240, 1, 'V'), m: DIEL },
    derive: ($) => {
      const k = kap($.m);
      const C0 = (EPS0 * $.A) / $.d;
      const Q = C0 * $.V0;
      return { k, C0, Q, V: $.V0 / k, U0: 0.5 * C0 * $.V0 ** 2, U: (0.5 * C0 * $.V0 ** 2) / k };
    },
    text: (T) => `A vacuum capacitor (A = ${T.A} m², d = ${T.d} mm) is charged to ${T.V0} V and then disconnected. A slab of ${T.m} is slid in to fill the gap. Find the new voltage and stored energy.`,
    parts: [num('V', ($) => $.V, 'V'), num('U', ($) => $.U, 'J'), mc('where', [[1, 'The energy went into pulling the slab in (work on the slab)'], [2, 'Charge leaked away'], [3, 'The energy increased']], 1, { label: 'Where did the missing energy go?' })],
    steps: ($, f) => [
      String.raw`$Q$ stays fixed at ${f($.Q)} C, and $C$ becomes $\kappa C_0$`,
      String.raw`$V = \dfrac{V_0}{\kappa} = ${texNum($.V)}\ \text{V}$`,
      String.raw`$U = \dfrac{U_0}{\kappa} = ${texNum($.U)}\ \text{J}$ (it was ${f($.U0)} J)`,
    ],
    sim: {
      scenario: 'cap-isolated',
      setup(s, $) {
        s.cap = { A: $.A, d: $.d, V: $.V0, Q0: $.Q, mode: 'isolated', dielectric: $.m, inserted: true, fill: 1 };
      },
      read: (c) => ({ V: c.cap.V, U: c.cap.U }),
    },
    cases: [kase('hand', { A: 0.04, d: 50, V0: 12, m: 'teflon' }, { V: 5.714, U: 2.4274e-10, where: 1 })],
  }),
  problem({
    ...E3, id: 'e3.40.combo', ch: '40', lab: 'capacitor', title: 'Capacitors in series and parallel', kind: 'numeric', level: 2, topics: ['capacitance', 'networks'],
    vars: { C1: range(1, 20, 1, 'μF', 1e-6), C2: range(1, 20, 1, 'μF', 1e-6), C3: range(1, 20, 1, 'μF', 1e-6), V: range(3, 60, 1, 'V') },
    derive: ($) => {
      const C23 = $.C2 + $.C3;
      const Ceq = ($.C1 * C23) / ($.C1 + C23);
      const Q1 = Ceq * $.V;
      return { C23, Ceq, Q1, V1: Q1 / $.C1, V2: Q1 / C23 };
    },
    text: (T) => `C₁ = ${T.C1} μF is in series with the parallel pair C₂ = ${T.C2} μF and C₃ = ${T.C3} μF, across a ${T.V} V battery. Find $C_{\\text{eq}}$, the charge on C₁, and the voltage across C₂.`,
    parts: [num('Ceq', ($) => $.Ceq, 'μF', { scale: 1e-6 }), num('Q1', ($) => $.Q1, 'μC', { scale: 1e-6 }), num('V2', ($) => $.V2, 'V')],
    hints: [
      String.raw`Parallel capacitors add; series capacitors add as reciprocals, $\dfrac{1}{C} = \sum \dfrac{1}{C_i}$.`,
      'Capacitors in series carry the same charge.',
    ],
    steps: ($, f) => [
      String.raw`$C_{23} = ${texNum($.C23 * 1e6)}\ \mu\text{F}$`,
      String.raw`$C_{\text{eq}} = ${texNum($.Ceq * 1e6)}\ \mu\text{F}$`,
      String.raw`$Q_1 = C_{\text{eq}}V = ${texNum($.Q1 * 1e6)}\ \mu\text{C}$`,
      String.raw`$V_2 = \dfrac{Q_1}{C_{23}} = ${texNum($.V2)}\ \text{V}$`,
    ],
    cases: [kase('hand', { C1: 6, C2: 4, C3: 2, V: 12 }, { Ceq: 3, Q1: 36, V2: 6 })],
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
      String.raw`$Q = CV = ${texNum($.Q)}\ \text{C}$`,
      String.raw`$U = \tfrac{1}{2}CV^2 = ${texNum($.U)}\ \text{J}$`,
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
      return { f };
    },
    text: (T) => `A charged parallel-plate capacitor ${T.mode}. Then ${T.act}. By what factor does ${T.qty} change?`,
    parts: [num('f', ($) => $.f, '× original', { tol: 0.001 })],
    hints: [
      String.raw`Battery connected: $V$ is fixed. Isolated: $Q$ is fixed.`,
      String.raw`$C = \dfrac{\kappa\varepsilon_0 A}{d}$, $E = \dfrac{V}{d}$, $U = \tfrac{1}{2}CV^2 = \dfrac{Q^2}{2C}$`,
    ],
    steps: ($, f) => [`Factor = ${f($.f)}`],
    cases: [kase('battery, d×2, U', { act: 1, mode: 1, qty: 'U' }, { f: 0.5 }), kase('isolated, κ, V', { act: 4, mode: 2, qty: 'V' }, { f: 0.5 }), kase('isolated, d×2, E', { act: 1, mode: 2, qty: 'E' }, { f: 1 })],
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
      String.raw`$R = \dfrac{\rho L}{A} = ${texNum($.R)}\ \Omega$`,
      String.raw`$I = \dfrac{V}{R} = ${texNum($.I)}\ \text{A}$`,
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
    steps: ($, f) => [String.raw`$R = R_0\left[1 + \alpha(T - 20\,^\circ\text{C})\right] = ${texNum($.R)}\ \Omega$`],
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
      String.raw`$I = \dfrac{V}{R} = ${texNum($.I)}\ \text{A}$`,
      String.raw`$J = \dfrac{I}{A} = ${texNum($.J)}\ \text{A/m}^2$`,
      String.raw`$E = \dfrac{V}{L} = ${texNum($.E)}\ \text{V/m}$`,
      String.raw`$v_d = \dfrac{I}{neA} = ${texNum($.vd)}\ \text{m/s}$ — very slow`,
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
      String.raw`$I = \dfrac{\Delta Q}{\Delta t} = ${texNum($.I)}\ \text{A}$`,
      String.raw`$N = \dfrac{I}{e} = ${texNum($.N)}$ per second`,
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
    steps: ($, f) => [String.raw`$R = \dfrac{\rho(nL)}{A/n} = n^2 R_0 = ${texNum($.R)}\ \Omega$`],
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
      String.raw`$R = \dfrac{V^2}{P} = ${texNum($.R)}\ \Omega$`,
      String.raw`$I = \dfrac{P}{V} = ${texNum($.I)}\ \text{A}$`,
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
      String.raw`$V_p = \sqrt{2}\,V_{\text{rms}} = ${texNum($.Vp)}\ \text{V}$`,
      String.raw`$I_{\text{rms}} = \dfrac{V_{\text{rms}}}{R} = ${texNum($.Irms)}\ \text{A}$`,
      String.raw`$P_{\text{avg}} = I_{\text{rms}}V_{\text{rms}} = ${texNum($.P)}\ \text{W}$`,
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
      String.raw`$E = Pt = ${texNum($.kWh)}\ \text{kWh}$`,
      `Cost = ${f($.cost)} dollars`,
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
      String.raw`$P = \dfrac{V^2}{R} = ${texNum($.P)}\ \text{W}$`,
      String.raw`$Q = Pt = ${texNum($.Q)}\ \text{J}$`,
      String.raw`$\Delta T = \dfrac{Q}{mc} = ${texNum($.dT)}\,^\circ\text{C}$`,
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
    steps: ($, f) => [String.raw`$I = \dfrac{\sum P}{V} = ${texNum($.I)}\ \text{A}$`],
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
        [
          ['reference', 'It fixes a common zero of potential, so every device is measured against the same reference'],
          ['path', 'It gives the current a low-resistance path to earth so it does not travel through the person touching the case'],
          ['limit', 'It opens the circuit when the current exceeds what the wiring can safely carry, before the wire overheats'],
          ['current', 'The current — the voltage is what drives it, but the current through the body is what does the harm'],
        ],
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
];
