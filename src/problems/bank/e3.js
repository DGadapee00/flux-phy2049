/** Exam 3 · Ch 38–39 (potential), 40 (capacitors), 41 (current, resistance), 42 (power). */
import { problem, kase, range, choice, SIGN, num, mc, sym, K, EPS0, QE, ME, MP, POSNEG, charge, fitLayout } from '../kit.js';
import { DIELECTRICS } from '../../physics/capacitor.js';
import { MATERIALS } from '../../physics/circuit.js';

const E3 = { exam: 'e3' };
const kap = (id) => DIELECTRICS.find((d) => d.id === id).kappa;
const mat = (id) => MATERIALS.find((m) => m.id === id);
const MATS = choice(...['copper', 'aluminum', 'tungsten', 'iron', 'nichrome'].map((id) => [id, mat(id).name.toLowerCase()]));
const DIEL = choice(...['teflon', 'paper', 'nylon', 'rubber'].map((id) => [id, `${DIELECTRICS.find((d) => d.id === id).name.toLowerCase()} (κ = ${kap(id)})`]));

/** Potential lab: charges + probe (point B) + pathA, scaled so V (and W = qΔV) are unchanged. */
function potSetup(list, probe, pathA) {
  return (s, $) => {
    const pts = [...list($), { ...probe($), q: 0 }, ...(pathA ? [{ ...pathA($), q: 0 }] : [])];
    const L = fitLayout(pts, null, { keep: 'V', maxR: 0.62 });
    const n = list($).length;
    s.charges = L.charges.slice(0, n).map((c) => ({ ...c, id: c.id }));
    s.probe = { x: L.charges[n].x, y: L.charges[n].y, z: 0 };
    if (pathA) s.pathA = { x: L.charges[n + 1].x, y: L.charges[n + 1].y, z: 0 };
    s.extraE = { x: 0, y: 0, z: 0 };
    s.selectedId = s.charges[0]?.id ?? null;
    return Math.abs(L.s - 1) > 1e-6 ? `Scaled to fit: positions ×${L.s.toPrecision(2)}, charges ×${L.s.toPrecision(2)} — V is unchanged.` : '';
  };
}

export default [
  // ================================================================= 38
  problem({
    ...E3, id: 'e3.38.point-V', ch: '38', lab: 'potential', title: 'Potential of a point charge', kind: 'numeric', topics: ['potential'],
    vars: { q: range(0.5, 5, 0.1, 'μC', 1e-6), s: SIGN, r: range(0.1, 3, 0.05, 'm') },
    derive: ($) => ({ V: (K * $.s * $.q) / $.r }),
    text: (T) => `Find the electric potential ${T.r} m from a ${T.s} ${T.q} μC point charge (V = 0 at infinity).`,
    parts: [num('V', ($) => $.V, 'V')],
    hints: ['V is a scalar and keeps the sign of q.'],
    steps: ($, f) => [`V = kq/r = ${f($.V)} V`],
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
    parts: [num('W', ($) => $.W, 'J', { label: 'W_field (signed)' }), mc('ke', [[1, 'Its kinetic energy increases'], [-1, 'Its kinetic energy decreases']], ($) => Math.sign($.W), { label: 'If only the field acts…' })],
    hints: ['W_field = −qΔV = −q(V_B − V_A)'],
    steps: ($, f) => [`V_A = ${f($.VA)} V, V_B = ${f($.VB)} V`, `W = −q(V_B − V_A) = ${f($.W)} J`],
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
    text: (T) => `In a uniform ${T.E} N/C field, a ${T.s} ${T.q} μC charge moves ${T.d} cm ${T.dir} the field direction. Find ΔV = V_B − V_A and the work done by the field.`,
    parts: [num('dV', ($) => $.dV, 'V', { label: 'ΔV' }), num('W', ($) => $.W, 'J', { label: 'W_field' })],
    hints: ['ΔV = −E·Δr. Moving along E lowers the potential.'],
    steps: ($, f) => [`ΔV = −E d cos θ = ${f($.dV)} V`, `W = −qΔV = ${f($.W)} J`],
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
    steps: ($, f) => [`K = |q|ΔV = ${f($.K)} J = ${f($.V)} eV`, `v = √(2K/m) = ${f($.v)} m/s`],
    cases: [kase('hand', { p: -1, V: 100 }, { KJ: 1.6e-17, KeV: 100, v: 5.927e6 })],
  }),
  problem({
    ...E3, id: 'e3.38.pair-energy', ch: '38', lab: 'potential', title: 'Potential energy of two charges', kind: 'numeric', topics: ['potential-energy'],
    vars: { q1: range(0.5, 10, 0.5, 'μC', 1e-6), s1: SIGN, q2: range(0.5, 10, 0.5, 'μC', 1e-6), s2: SIGN, r: range(0.05, 2, 0.05, 'm') },
    derive: ($) => ({ U: (K * $.s1 * $.q1 * $.s2 * $.q2) / $.r }),
    text: (T) => `A ${T.s1} ${T.q1} μC charge and a ${T.s2} ${T.q2} μC charge are ${T.r} m apart. What is their electric potential energy? How much work did an external agent do to bring them together from far away, at rest?`,
    parts: [num('U', ($) => $.U, 'J', { label: 'U' }), num('W', ($) => $.U, 'J', { label: 'W_ext' })],
    steps: ($, f) => [`U = kq₁q₂/r = ${f($.U)} J, and W_ext = ΔU = U`],
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
    steps: () => ['ΔV = 0 along an equipotential, so W = −qΔV = 0.', 'E is perpendicular to equipotentials and points downhill in V (Eₓ = −dV/dx).', 'A point has only one potential, so equipotentials never cross. Closely spaced equipotentials mean a steep V, so E is stronger there.'],
    sim: { scenario: 'v-dipole' },
    cases: [kase('all true ones', {}, { ans: [1, 2, 3] })],
  }),
  problem({
    ...E3, id: 'e3.38.E-from-V', ch: '38', lab: 'potential', title: 'E from V(x)', kind: 'derivation', level: 2, topics: ['potential', 'gradient'],
    vars: { a: range(-10, 10, 1, 'V/m²', 1, { exclude: [0] }), b: range(-20, 20, 1, 'V/m'), x0: range(-3, 3, 0.5, 'm') },
    derive: ($) => ({ Ex: -(2 * $.a * $.x0 + $.b) }),
    text: (T) => `The potential along the x-axis is V(x) = ${T.a}x² + ${T.b}x + 5 (V, with x in m). Find Eₓ at x = ${T.x0} m.`,
    parts: [sym('Ex_sym', '-(2*a*x0 + b)', ['a', 'b', 'x0'], ($) => $.Ex, { label: 'Eₓ as a formula (use a, b, x0)' }), num('Ex', ($) => $.Ex, 'V/m', { abs: 0.01 })],
    hints: ['Eₓ = −dV/dx'],
    steps: ($, f) => ['Eₓ = −dV/dx = −(2ax + b)', `At x = x₀: Eₓ = ${f($.Ex)} V/m`],
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
    steps: ($, f) => [`V = k(q₁/a + q₂/b) = ${f($.V)} V`],
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
    parts: [num('x', ($) => $.x, 'm'), mc('E0', [[1, 'Yes, E = 0 there too'], [0, 'No, E is not zero there']], 0, { label: 'Is E zero at that point?' })],
    steps: ($, f) => [`kq₁/x = k|q₂|/(d − x) → x = d·q₁/(q₁ + |q₂|) = ${f($.x)} m`, 'Between opposite charges, both fields point toward the negative charge, so E ≠ 0.'],
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
    parts: [sym('V_sym', 'k*Q/sqrt(a^2 + y^2)', ['Q', 'a', 'y'], ($) => $.V, { label: 'V as a formula' }), num('V', ($) => $.V, 'V')],
    hints: ['Every dq is the same distance from P, and V is a scalar, so nothing cancels.'],
    steps: ($, f) => [`V = ∫k dq/r = kQ/√(a² + y²) = ${f($.V)} V`],
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
    parts: [sym('V_sym', 'k*lam*ln((sqrt(L^2/4 + d^2) + L/2)/(sqrt(L^2/4 + d^2) - L/2))', ['lam', 'L', 'd'], ($) => $.V, { label: 'V as a formula' }), num('V', ($) => $.V, 'V')],
    hints: ['∫ dx/√(x² + d²) = ln(x + √(x² + d²))'],
    steps: ($, f) => ['V = kλ∫dx/√(x² + d²) over −L/2..L/2 = kλ ln[(√(L²/4 + d²) + L/2)/(√(L²/4 + d²) − L/2)]', `V = ${f($.V)} V`],
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
    hints: ['E = 0 inside, so V doesn\'t change there.'],
    steps: ($, f) => [`r ≥ R: V = kQ/r;  r ≤ R: V = kQ/R.  V = ${f($.V)} V`],
    sim: { scenario: 'uniform', setup: (s, $) => void Object.assign(s, { Q: $.Q, R: Math.min(0.55, $.R) }) },
    cases: [kase('hand', { Q: 2, R: 0.35, f: 0.6 }, { V: 51360, inside: 1 })],
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
    parts: [num('C', ($) => $.C, 'pF', { scale: 1e-12 }), num('Q', ($) => $.Q, 'C'), num('E', ($) => $.E, 'V/m'), num('U', ($) => $.U, 'J')],
    steps: ($, f) => [`C = ε₀A/d = ${f($.C)} F`, `Q = CV = ${f($.Q)} C`, `E = V/d = ${f($.E)} V/m`, `U = ½CV² = ${f($.U)} J`],
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
    steps: ($, f) => [`C = κC₀ = ${f($.C)} F`, `V stays fixed, so Q = κC₀V = ${f($.Q)} C`, 'E = V/d is unchanged (factor 1)'],
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
    steps: ($, f) => [`Q stays fixed at ${f($.Q)} C and C becomes κC₀`, `V = V₀/κ = ${f($.V)} V`, `U = U₀/κ = ${f($.U)} J (it was ${f($.U0)} J)`],
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
    text: (T) => `C₁ = ${T.C1} μF is in series with the parallel pair C₂ = ${T.C2} μF and C₃ = ${T.C3} μF, across a ${T.V} V battery. Find C_eq, the charge on C₁, and the voltage across C₂.`,
    parts: [num('Ceq', ($) => $.Ceq, 'μF', { scale: 1e-6 }), num('Q1', ($) => $.Q1, 'μC', { scale: 1e-6 }), num('V2', ($) => $.V2, 'V')],
    hints: ['Parallel capacitors add; series capacitors add as reciprocals.', 'Capacitors in series carry the same charge.'],
    steps: ($, f) => [`C₂₃ = ${f($.C23 * 1e6)} μF`, `C_eq = ${f($.Ceq * 1e6)} μF`, `Q₁ = C_eq V = ${f($.Q1 * 1e6)} μC`, `V₂ = Q₁/C₂₃ = ${f($.V2)} V`],
    cases: [kase('hand', { C1: 6, C2: 4, C3: 2, V: 12 }, { Ceq: 3, Q1: 36, V2: 6 })],
  }),
  problem({
    ...E3, id: 'e3.40.energy', ch: '40', lab: 'capacitor', title: 'Energy stored in a capacitor', kind: 'numeric', topics: ['capacitance', 'energy'],
    vars: { C: range(1, 200, 1, 'μF', 1e-6), V: range(0.5, 10, 0.5, 'kV', 1e3) },
    derive: ($) => ({ U: 0.5 * $.C * $.V ** 2, Q: $.C * $.V }),
    text: (T) => `A defibrillator's ${T.C} μF capacitor is charged to ${T.V} kV. How much charge and energy does it store?`,
    parts: [num('Q', ($) => $.Q, 'C'), num('U', ($) => $.U, 'J')],
    steps: ($, f) => [`Q = CV = ${f($.Q)} C`, `U = ½CV² = ${f($.U)} J`],
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
    hints: ['Battery connected: V is fixed. Isolated: Q is fixed.', 'C = κε₀A/d, E = V/d, U = ½CV² = Q²/2C'],
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
    parts: [num('R', ($) => $.R, 'Ω'), num('I', ($) => $.I, 'A')],
    steps: ($, f) => [`R = ρL/A = ${f($.R)} Ω`, `I = V/R = ${f($.I)} A`],
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
    steps: ($, f) => [`R = R₀[1 + α(T − 20 °C)] = ${f($.R)} Ω`],
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
    steps: ($, f) => [`I = V/R = ${f($.I)} A`, `J = I/A = ${f($.J)} A/m²`, `E = V/L = ${f($.E)} V/m`, `v_d = I/(neA) = ${f($.vd)} m/s — very slow`],
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
    steps: ($, f) => [`I = ΔQ/Δt = ${f($.I)} A`, `N = I/e = ${f($.N)} per second`],
    cases: [kase('hand', { Q: 30, t: 2 }, { I: 0.25, N: 1.5625e18 })],
  }),
  problem({
    ...E3, id: 'e3.41.stretch', ch: '41', lab: 'ohm', title: 'Stretching a wire', kind: 'numeric', topics: ['resistance', 'proportional-reasoning'],
    vars: { n: range(1.5, 4, 0.5), R0: range(1, 50, 1, 'Ω') },
    derive: ($) => ({ R: $.R0 * $.n ** 2 }),
    text: (T) => `A ${T.R0} Ω wire is drawn out to ${T.n} times its original length, keeping its volume the same. What is its new resistance?`,
    parts: [num('R', ($) => $.R, 'Ω')],
    hints: ['Constant volume: A shrinks by the same factor that L grows.'],
    steps: ($, f) => [`R = ρ(nL)/(A/n) = n²R₀ = ${f($.R)} Ω`],
    cases: [kase('double', { n: 2, R0: 10 }, { R: 40 })],
  }),

  // ================================================================= 42
  problem({
    ...E3, id: 'e3.42.bulb', ch: '42', lab: 'power', title: 'Bulb resistance from its rating', kind: 'numeric', topics: ['power'],
    vars: { P: range(5, 200, 5, 'W'), V: range(12, 240, 12, 'V') },
    derive: ($) => ({ R: $.V ** 2 / $.P, I: $.P / $.V }),
    text: (T) => `A bulb is rated ${T.P} W at ${T.V} V. Find its operating resistance and current.`,
    parts: [num('R', ($) => $.R, 'Ω'), num('I', ($) => $.I, 'A')],
    steps: ($, f) => [`R = V²/P = ${f($.R)} Ω`, `I = P/V = ${f($.I)} A`],
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
    parts: [num('Vp', ($) => $.Vp, 'V'), num('Irms', ($) => $.Irms, 'A'), num('P', ($) => $.P, 'W')],
    steps: ($, f) => [`V_p = √2·V_rms = ${f($.Vp)} V`, `I_rms = V_rms/R = ${f($.Irms)} A`, `P_avg = I_rms V_rms = ${f($.P)} W`],
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
    steps: ($, f) => [`E = P·t = ${f($.kWh)} kWh`, `Cost = ${f($.cost)} dollars`],
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
    hints: ['Find each R from its rating (R = V²/P). In series use P = I²R; in parallel each bulb gets its full 120 V.'],
    steps: ($, f) => [`R₁ = ${f($.R1)} Ω, R₂ = ${f($.R2)} Ω`, `P₁ = ${f($.p1)} W, P₂ = ${f($.p2)} W`],
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
    parts: [num('P', ($) => $.P, 'W'), num('Q', ($) => $.Q, 'J'), num('dT', ($) => $.dT, '°C')],
    steps: ($, f) => [`P = V²/R = ${f($.P)} W`, `Q = Pt = ${f($.Q)} J`, `ΔT = Q/(mc) = ${f($.dT)} °C`],
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
    steps: ($, f) => [`I = ΣP/V = ${f($.I)} A`],
    cases: [kase('kitchen', { P1: 1200, P2: 800, P3: 500, Imax: 15 }, { I: 20.83, trip: 1 })],
  }),
];
