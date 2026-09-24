/**
 * Exam 2 · Ch 36 (A: field of point charges, B: continuous distributions, C: flux and Gauss)
 * and Ch 37 (conductors). Cases tagged "#n" come from Montgomery's practice sheets and reproduce
 * the printed key; the notes flag the two key errors found.
 */
import { problem, kase, range, choice, SIGN, UPDOWN, num, mc, tf, sym, self, K, EPS0, QE, ME, MP, G, DEG, DIR_X, RADIAL, POSNEG, charge, layout, angleDeg, texNum } from '../kit.js';

const E2 = { exam: 'e2' };
const A = { ...E2, ch: '36A' };
const B = { ...E2, ch: '36B' };
const Cc = { ...E2, ch: '36C' };
const C37 = { ...E2, ch: '37' };

/** Field lab: the problem's charges and probe, at the problem's own coordinates. */
function fieldSetup(list, probe) {
  return (s, $) => layout(s, { charges: list($), probe: probe($) });
}
const probeE = (c) => c.probeE;
const Emag = (c) => Math.hypot(c.probeE.x, c.probeE.y, c.probeE.z);

export default [
  // ================================================================= 36A
  problem({
    ...A, id: 'e2.36a.force-direction', lab: 'field', src: 'Practice 36A #1–2', title: 'Force direction on a charge in a uniform field', kind: 'conceptual', topics: ['field-definition'],
    vars: { ang: choice([0, 'to the right'], [90, 'upward'], [180, 'to the left'], [270, 'downward']), s: SIGN },
    derive: ($) => ({ Fang: ($.ang + (1 - $.s) * 90) % 360 }),
    text: (T) => `An electric field points ${T.ang}. An object with a net ${T.s} charge is placed in it. Which way is the force on the object?`,
    parts: [mc('dir', [[0, 'To the right'], [90, 'Upward'], [180, 'To the left'], [270, 'Downward'], [-1, 'No force']], ($) => $.Fang)],
    hints: [String.raw`$\vec{F} = q\vec{E}$. The sign of $q$ decides whether $\vec{F}$ is along $\vec{E}$ or opposite to it.`],
    steps: () => [String.raw`A positive charge is pushed along $\vec{E}$; a negative charge is pushed opposite to it.`],
    sim: {
      scenario: 'single-plus',
      setup(s, $) {
        // "Upward" is +y: drawn in the x–y plane, seen from above, like the other 36A setups.
        layout(s, { charges: [charge($.s * 1e-6, 0, 0), charge(1e-12, 0.6, 0.6)], probe: { x: 0.3, y: 0.3 } });
        s.extraE = { x: 5e4 * Math.cos($.ang * DEG), y: 5e4 * Math.sin($.ang * DEG), z: 0 };
      },
    },
    cases: [kase('#1', { ang: 180, s: 1 }, { dir: 180 }, { key: 'A' }), kase('#2', { ang: 180, s: -1 }, { dir: 0 }, { key: 'B' })],
  }),
  problem({
    ...A, id: 'e2.36a.proton-electron', lab: 'field', src: 'Practice 36A #5', title: 'Proton vs electron in the same field', kind: 'conceptual', topics: ['field-definition', 'kinematics'],
    text: () => 'A proton and an electron are placed in the same uniform electric field. Which has the greater acceleration?',
    parts: [mc('which', [[1, 'The proton'], [2, 'The electron'], [3, 'Both the same'], [4, 'Neither accelerates']], 2)],
    steps: () => [String.raw`Both feel $|\vec{F}| = eE$. Since $a = F/m$ and $m_e \approx m_p/1836$, the electron's acceleration is about 1836 times larger.`],
    cases: [kase('#5', {}, { which: 2 }, { key: 'B' })],
  }),
  problem({
    ...A, id: 'e2.36a.trajectory', lab: 'field', src: 'Practice 36A #6', title: 'Particle entering a uniform field', kind: 'conceptual', topics: ['field-definition', 'kinematics'],
    vars: { p: choice([-1, 'An electron'], [1, 'A proton']), Ed: UPDOWN },
    text: (T) => `${T.p} moving to the right enters a uniform electric field directed ${T.Ed}. What path does it follow in the field?`,
    parts: [mc('path', [[1, 'Parabola curving upward'], [-1, 'Parabola curving downward'], [0, 'Straight line'], [2, 'Circular arc']], ($) => $.p * $.Ed)],
    hints: ['Constant force perpendicular to the initial velocity works like projectile motion.'],
    steps: () => [String.raw`$q\vec{E}$ is constant, so the path is a parabola. A negative charge is pushed opposite to $\vec{E}$.`],
    cases: [kase('#6', { p: -1, Ed: 1 }, { path: -1 }, { key: 'D (trajectory Z)' })],
  }),
  problem({
    ...A, id: 'e2.36a.plate-sign', lab: 'field', src: 'Practice 36A #3–4', title: 'Plate charge from field direction', kind: 'conceptual', topics: ['field-lines'],
    vars: { dir: choice([-1, 'from right to left (toward Plate 2)'], [1, 'from left to right (away from Plate 2)']) },
    text: (T) => `Plate 2 is on the left and Plate 1 is on the right. The field between them points ${T.dir}. What must the charge on Plate 2 be?`,
    parts: [mc('sign', [[1, 'Positive'], [-1, 'Negative'], [0, 'Neutral'], [2, 'Cannot tell']], ($) => $.dir), mc('uniform', [[1, 'Strongest near Plate 1'], [2, 'Strongest near Plate 2'], [3, 'The same everywhere between the plates']], 3, { label: 'Between ideal parallel plates, the field is…' })],
    steps: () => ['Field lines leave positive charge and end on negative charge. Between large parallel plates, the field is uniform.'],
    cases: [kase('#4', { dir: -1 }, { sign: -1 }, { key: 'B' })],
  }),
  problem({
    ...A, id: 'e2.36a.square-corner', lab: 'field', src: 'Practice 36A #7 (generalized)', title: 'Net field at the empty corner of a square', kind: 'numeric', level: 2, topics: ['superposition', 'vectors'],
    vars: { q: range(1, 10, 1, 'μC', 1e-6), d: range(5, 30, 1, 'cm', 1e-2), s1: SIGN, s2: SIGN, s3: SIGN },
    derive: ($) => {
      const e = (K * $.q) / $.d ** 2;
      const diag = e / (2 * Math.SQRT2);
      const Ex = $.s1 * e + $.s2 * diag;
      const Ey = $.s3 * e + $.s2 * diag;
      return { Ex, Ey, E: Math.hypot(Ex, Ey), th: angleDeg(Ex, Ey) };
    },
    text: (T) => `Three ${T.q} μC charges sit on three corners of a square of side ${T.d} cm: ${T.s1} at top-left, ${T.s2} at bottom-left, ${T.s3} at bottom-right. Find the net electric field at the empty top-right corner.`,
    parts: [num('E', ($) => $.E, 'N/C', { label: '|E|' }), num('th', ($) => $.th, '°', { label: 'Direction (from +x)', abs: 1, tol: 0.005, wrap: 360 })],
    hints: [
      String.raw`Put the empty corner at $(d, d)$ and the bottom-left charge at the origin.`,
      String.raw`The diagonal charge is $\sqrt{2}\,d$ away, so its field is $kq/2d^2$, with equal $x$ and $y$ components.`,
    ],
    steps: ($, f) => [
      String.raw`$E_x$ = ${f($.Ex)} N/C, $E_y$ = ${f($.Ey)} N/C`,
      String.raw`$|\vec{E}|$ = ${f($.E)} N/C at ${f($.th)}°`,
    ],
    sim: {
      scenario: 'quad',
      setup: fieldSetup(($) => [charge($.s1 * $.q, 0, $.d), charge($.s2 * $.q, 0, 0), charge($.s3 * $.q, $.d, 0)], ($) => ({ x: $.d, y: $.d, z: 0 })),
      read: (c) => ({ E: Emag(c), th: angleDeg(c.probeE.x, c.probeE.y) }),
    },
    cases: [kase('hand', { q: 2, d: 10, s1: 1, s2: -1, s3: 1 }, { E: 1.643e6, th: 45 })],
  }),
  problem({
    ...A, id: 'e2.36a.E-from-force', lab: 'field', src: 'Practice 36A #8', title: 'Field strength from force', kind: 'numeric', topics: ['field-definition'],
    vars: { F: range(1, 20, 0.5, 'N'), q: range(1, 10, 0.5, 'μC', 1e-6) },
    derive: ($) => ({ E: $.F / $.q }),
    text: (T) => `A ${T.F} N force acts on a ${T.q} μC charge in a uniform electric field. What is the field's magnitude?`,
    parts: [num('E', ($) => $.E, 'N/C')],
    steps: ($, f) => [String.raw`$E = \dfrac{F}{q} = ${texNum($.E)}\ \text{N/C}$`],
    cases: [kase('#8', { F: 6, q: 3 }, { E: 2e6 }, { key: '2 x 10^6 N/C' })],
  }),
  problem({
    ...A, id: 'e2.36a.accel', lab: 'field', src: 'Practice 36A #9', title: 'Acceleration of a proton or electron', kind: 'numeric', topics: ['field-definition', 'kinematics'],
    vars: { p: choice([1, 'proton'], [-1, 'electron']), E: range(100, 2000, 50, 'N/C') },
    derive: ($) => ({ a: (QE * $.E) / ($.p > 0 ? MP : ME) }),
    text: (T) => `${/^[aeiou]/i.test(T.p) ? 'An' : 'A'} ${T.p} is placed in a ${T.E} N/C electric field that points in the +x direction. Find the magnitude and direction of its acceleration.`,
    parts: [num('a', ($) => $.a, 'm/s²'), mc('dir', [[1, '+x'], [-1, '−x']], ($) => $.p, { label: 'Direction' })],
    steps: ($, f) => [
      String.raw`$a = \dfrac{eE}{m} = ${texNum($.a)}\ \text{m/s}^2$`,
      String.raw`A proton accelerates along $\vec{E}$; an electron accelerates opposite to it.`,
    ],
    cases: [kase('#9', { p: 1, E: 700 }, { a: 6.707e10, dir: 1 }, { key: '6.7 x 10^10 m/s^2' })],
  }),
  problem({
    ...A, id: 'e2.36a.E-from-accel', lab: 'field', src: 'Practice 36A #10', title: 'Field from measured acceleration', kind: 'numeric', topics: ['field-definition'],
    vars: { q: range(1, 10, 0.5, 'μC', 1e-6), a: range(0.001, 0.02, 0.001, 'm/s²'), m: range(1, 10, 0.5, 'g', 1e-3) },
    derive: ($) => ({ E: ($.m * $.a) / $.q }),
    text: (T) => `A small object carrying ${T.q} μC accelerates at ${T.a} m/s² on a frictionless surface, due only to an electric field. Its mass is ${T.m} g. Find the field strength.`,
    parts: [
      sym('E_sym', 'm*a/q', { m: 'kg', a: 'm/s²', q: 'C' }, ($) => $.E, { unit: 'N/C', label: String.raw`$E$ as a formula` }),
      num('E', ($) => $.E, 'N/C'),
    ],
    steps: ($, f) => [String.raw`$E = \dfrac{ma}{q} = ${texNum($.E)}\ \text{N/C}$ (convert grams to kilograms and μC to C first)`],
    cases: [kase('#10', { q: 5, a: 0.005, m: 2 }, { E: 2 }, { key: '2 N/C' })],
  }),
  problem({
    ...A, id: 'e2.36a.tension', lab: 'field', src: 'Practice 36A #11', title: 'Thread tension with a vertical field', kind: 'numeric', level: 2, topics: ['field-definition', 'equilibrium'],
    vars: { m: range(0.01, 0.1, 0.005, 'kg'), q: range(10, 100, 5, 'μC', 1e-6), s: SIGN, E: range(500, 5000, 100, 'N/C'), Ed: UPDOWN },
    derive: ($) => {
      const Fup = $.s * $.q * $.Ed * $.E;
      return { Fup, T: $.m * G - Fup };
    },
    valid: ($) => $.T > 0.005,
    text: (T) => `A ${T.m} kg insulating sphere with a ${T.s} ${T.q} μC charge hangs from a vertical silk thread. A uniform ${T.E} N/C field directed ${T.Ed} is switched on. What is the tension in the thread?`,
    parts: [num('T', ($) => $.T, 'N')],
    hints: [String.raw`Take up as positive. The electric force on the sphere is $qE_y$, signs included.`],
    steps: ($, f) => [
      String.raw`$mg = ${texNum($.m * G)}\ \text{N}$`,
      String.raw`$F_E$ (up) $= ${texNum($.Fup)}\ \text{N}$`,
      String.raw`$T = mg - F_E = ${texNum($.T)}\ \text{N}$`,
    ],
    cases: [kase('#11', { m: 0.05, q: 60, s: -1, E: 3000, Ed: -1 }, { T: 0.31 }, { key: '0.31 N' })],
  }),
  problem({
    ...A, id: 'e2.36a.levitate-E', lab: 'field', src: 'Practice 36A #12', title: 'Field that balances the weight', kind: 'numeric', topics: ['equilibrium'],
    vars: { q: range(1, 10, 0.5, 'μC', 1e-6), s: SIGN, m: range(1, 10, 0.5, '×10⁻³ kg', 1e-3) },
    derive: ($) => ({ E: ($.m * G) / $.q }),
    text: (T) => `A particle with a ${T.s} ${T.q} μC charge has a mass of ${T.m} × 10⁻³ kg. What electric field (magnitude and direction) will exactly balance its weight?`,
    parts: [
      sym('E_sym', 'm*g/q', { m: 'kg', q: 'C' }, ($) => $.E, { unit: 'N/C', label: String.raw`$E$ as a formula (g is gravity)` }),
      num('E', ($) => $.E, 'N/C'),
      mc('dir', [[1, 'Upward'], [-1, 'Downward']], ($) => $.s, { label: 'Direction' }),
    ],
    steps: ($, f) => [String.raw`$|q|E = mg \;\Longrightarrow\; E = ${texNum($.E)}\ \text{N/C}$, pointing so that $q\vec{E}$ is upward`],
    cases: [kase('#12', { q: 4, s: 1, m: 5 }, { E: 12250, dir: 1 }, { key: '12,250 N/C' })],
  }),
  problem({
    ...A, id: 'e2.36a.levitate-q', lab: 'field', src: 'Practice 36A #13', title: 'Charge needed to levitate a ball', kind: 'numeric', topics: ['equilibrium'],
    vars: { m: range(0.05, 0.5, 0.01, 'g', 1e-3), E: range(1000, 10000, 500, 'N/C'), Ed: UPDOWN },
    derive: ($) => ({ q: ($.m * G) / $.E }),
    text: (T) => `A ${T.m} g Styrofoam ball is in a ${T.E} N/C field pointing ${T.Ed}. What charge (magnitude and sign) must it carry to stay suspended?`,
    parts: [num('q', ($) => $.q, 'C', { label: '|q|' }), mc('sign', POSNEG, ($) => $.Ed, { label: 'Sign' })],
    steps: ($, f) => [
      String.raw`$|q| = \dfrac{mg}{E} = ${texNum($.q)}\ \text{C}$`,
      String.raw`$q\vec{E}$ must point up, so $q$ is positive if $\vec{E}$ points up and negative if it points down.`,
    ],
    cases: [kase('#13', { m: 0.12, E: 6000, Ed: -1 }, { q: 1.96e-7, sign: -1 }, { key: '1.96 x 10^-7 C' })],
  }),
  problem({
    ...A, id: 'e2.36a.point-field', lab: 'field', src: 'Practice 36A #14–15', title: 'Field of a point charge', kind: 'numeric', topics: ['point-charge'],
    vars: { q: range(1, 100, 1, 'nC', 1e-9), s: SIGN, r: range(0.02, 3, 0.01, 'm') },
    derive: ($) => ({ E: (K * $.q) / $.r ** 2 }),
    text: (T) => `What are the magnitude and direction of the electric field ${T.r} m from a ${T.s} ${T.q} nC charged sphere?`,
    parts: [
      sym('E_sym', 'k*q/r^2', { q: 'C', r: 'm' }, ($) => $.E, { unit: 'N/C', label: String.raw`$E$ as a formula` }),
      num('E', ($) => $.E, 'N/C'),
      mc('dir', [[1, 'Away from the sphere'], [-1, 'Toward the sphere']], ($) => $.s, { label: 'Direction' }),
    ],
    steps: ($, f) => [
      String.raw`$E = \dfrac{kq}{r^2} = ${texNum($.E)}\ \text{N/C}$`,
      String.raw`It points away from a positive charge and toward a negative one.`,
    ],
    sim: {
      scenario: 'single-plus',
      setup: fieldSetup(($) => [charge($.s * $.q, 0, 0)], ($) => ({ x: $.r, y: 0, z: 0 })),
      read: (c) => ({ E: Emag(c), dir: Math.sign(c.probeE.x) }),
    },
    cases: [
      kase('#14', { q: 50, s: 1, r: 1.5 }, { E: 199.7, dir: 1 }, { key: '200 N/C directed away' }),
      kase('#15', { q: 1.9, s: 1, r: 0.02 }, { E: 42690 }, { key: '42,750 N/C', note: 'Key used k = 9.0×10⁹; the app uses 1/(4πε₀) (0.1% lower).' }),
    ],
  }),
  problem({
    ...A, id: 'e2.36a.charge-from-field', lab: 'field', src: 'Practice 36A #16', title: 'Source charge from a measured field', kind: 'numeric', topics: ['point-charge'],
    vars: { E: range(10000, 500000, 5000, 'N/C'), r: range(1, 10, 0.1, 'cm', 1e-2), dir: choice([-1, 'toward'], [1, 'away from']) },
    derive: ($) => ({ q: ($.E * $.r ** 2) / K }),
    text: (T) => `${T.r} cm from a small object, the electric field points ${T.dir} the object with a strength of ${T.E} N/C. What is the object's charge?`,
    parts: [
      sym('q_sym', 'E*r^2/k', { E: 'N/C', r: 'm' }, ($) => $.q, { unit: 'C', label: String.raw`$|q|$ as a formula` }),
      num('q', ($) => $.q, 'C', { label: String.raw`$|q|$` }),
      mc('sign', POSNEG, ($) => $.dir, { label: 'Sign' }),
    ],
    steps: ($, f) => [
      String.raw`$|q| = \dfrac{Er^2}{k} = ${texNum($.q)}\ \text{C}$`,
      String.raw`A field pointing toward the object means its charge is negative.`,
    ],
    sim: {
      scenario: 'single-plus',
      setup: fieldSetup(($) => [charge($.dir * $.q, 0, 0)], ($) => ({ x: $.r, y: 0, z: 0 })),
      read: (c, s, $) => ({ sign: Math.sign(c.probeE.x), '@|E| at P': [Emag(c), $.E] }),
    },
    cases: [kase('#16', { E: 180000, r: 2.8, dir: -1 }, { q: 1.57e-8, sign: -1 }, { key: '1.57 x 10^-8 C' })],
  }),
  problem({
    ...A, id: 'e2.36a.between-two', lab: 'field', src: 'Practice 36A #17–18', title: 'Field direction between two equal charges', kind: 'conceptual', topics: ['superposition'],
    vars: { s1: SIGN, s2: SIGN },
    derive: ($) => ({ Ex: $.s1 / 0.49 - $.s2 / 0.09 }),
    text: (T) => `Charge 1 (${T.s1}) is on the left and charge 2 (${T.s2}) is on the right, with equal magnitudes. Point P lies between them, closer to charge 2. Which way does the net field at P point?`,
    parts: [mc('dir', DIR_X, ($) => Math.sign($.Ex))],
    hints: [String.raw`The closer charge contributes the stronger field, as $1/r^2$.`],
    steps: () => [String.raw`Each field points away from a positive charge and toward a negative one. The nearer charge wins unless both fields point the same way.`],
    sim: {
      scenario: 'two-plus',
      setup: fieldSetup(($) => [charge($.s1 * 1e-6, -0.5, 0), charge($.s2 * 1e-6, 0.5, 0)], () => ({ x: 0.2, y: 0, z: 0 })),
      read: (c) => ({ dir: Math.sign(c.probeE.x) }),
    },
    cases: [kase('#17', { s1: 1, s2: 1 }, { dir: -1 }, { key: 'B' }), kase('#18', { s1: 1, s2: -1 }, { dir: 1 }, { key: 'A' })],
  }),
  problem({
    ...A, id: 'e2.36a.collinear', lab: 'field', src: 'Practice 36A #19–22', title: 'Net field on the line of two charges', kind: 'numeric', level: 2, topics: ['superposition'],
    vars: { q1: range(1, 20, 1, 'μC', 1e-6), s1: SIGN, q2: range(1, 20, 1, 'μC', 1e-6), s2: SIGN, x2: range(0.2, 1, 0.05, 'm'), xp: range(-0.5, 1.5, 0.05, 'm') },
    derive: ($) => {
      const Q1 = $.s1 * $.q1;
      const Q2 = $.s2 * $.q2;
      const E1 = (K * Q1 * Math.sign($.xp)) / $.xp ** 2;
      const E2 = (K * Q2 * Math.sign($.xp - $.x2)) / ($.xp - $.x2) ** 2;
      return { Q1, Q2, E1, E2, Ex: E1 + E2 };
    },
    valid: ($) => Math.abs($.xp) > 0.04 && Math.abs($.xp - $.x2) > 0.04,
    text: (T) => `q₁ = ${T.q1} μC (${T.s1}) is at the origin and q₂ = ${T.q2} μC (${T.s2}) is at x = ${T.x2} m. Find the net electric field at P, x = ${T.xp} m.`,
    parts: [num('E', ($) => Math.abs($.Ex), 'N/C', { label: '|E|' }), mc('dir', DIR_X, ($) => Math.sign($.Ex), { label: 'Direction' })],
    hints: [String.raw`Write each field as a signed $x$ component: $E = kQ\,\dfrac{\text{sign}(x_P - x_i)}{(x_P - x_i)^2}$.`],
    steps: ($, f) => [
      String.raw`From $q_1$: ${f($.E1)} N/C`,
      String.raw`From $q_2$: ${f($.E2)} N/C`,
      String.raw`$E_x$ = ${f($.Ex)} N/C`,
    ],
    sim: {
      scenario: 'dipole',
      setup: fieldSetup(($) => [charge($.Q1, 0, 0), charge($.Q2, $.x2, 0)], ($) => ({ x: $.xp, y: 0, z: 0 })),
      read: (c) => ({ E: Math.abs(c.probeE.x), dir: Math.sign(c.probeE.x) }),
    },
    cases: [
      kase('#19', { q1: 20, s1: 1, q2: 8, s2: -1, x2: 0.2, xp: 0.1 }, { E: 2.517e7, dir: 1 }, { key: '2.52 x 10^7 N/C' }),
      kase('#20', { q1: 2, s1: 1, q2: 4, s2: -1, x2: 1, xp: 0.2 }, { E: 5.055e5, dir: 1 }, { key: '5.06 x 10^5 N/C' }),
      kase('#21', { q1: 2, s1: -1, q2: 4, s2: -1, x2: 1, xp: 0.2 }, { E: 3.933e5, dir: -1 }, { key: '3.94 x 10^5 N/C, −x' }),
      kase('#22', { q1: 2, s1: -1, q2: 4, s2: 1, x2: 0.2, xp: 1 }, { E: 3.820e4, dir: 1 }, { key: '3.83 x 10^4 N/C, +x' }),
    ],
  }),
  problem({
    ...A, id: 'e2.36a.zero-point', lab: 'field', src: 'Practice 36A #23', title: 'Choose q₂ so the field vanishes at P', kind: 'numeric', level: 2, topics: ['superposition'],
    vars: { q1: range(1, 10, 0.5, 'μC', 1e-6), d: range(10, 60, 5, 'cm', 1e-2), D: range(0.5, 5, 0.5, 'm') },
    derive: ($) => ({ q2: $.q1 * (($.D + $.d) / $.D) ** 2 }),
    text: (T) => `A +${T.q1} μC charge is at x = 0 and an unknown q₂ is at x = +${T.d} cm. The net field is zero at x = −${T.D} m. Find q₂.`,
    parts: [
      sym('q2_sym', 'q1*((D + d)/D)^2', { q1: 'C', d: 'm', D: 'm' }, ($) => $.q2, { unit: 'C', label: String.raw`$|q_2|$ as a formula` }),
      num('q2', ($) => $.q2, 'μC', { scale: 1e-6, label: String.raw`$|q_2|$` }),
      mc('sign', POSNEG, -1, { label: 'Sign' }),
    ],
    hints: [String.raw`$P$ is outside both charges, so the fields can cancel only if the charges have opposite signs.`],
    steps: ($, f) => [
      String.raw`$\dfrac{kq_1}{D^2} = \dfrac{k|q_2|}{(D+d)^2} \;\Longrightarrow\; |q_2| = ${texNum($.q2 * 1e6)}\ \mu\text{C}$, negative`,
    ],
    sim: {
      scenario: 'dipole',
      setup: fieldSetup(($) => [charge($.q1, 0, 0), charge(-$.q2, $.d, 0)], ($) => ({ x: -$.D, y: 0, z: 0 })),
      read: (c, s, $) => ({ '@E at P ≈ 0 (relative)': [Emag(c) / ((K * $.q1) / $.D ** 2), 0] }),
    },
    cases: [kase('#23', { q1: 7, d: 40, D: 3 }, { q2: 8.99, sign: -1 }, { key: '9.0 x 10^-6 C' })],
  }),
  problem({
    ...A, id: 'e2.36a.three-axes', lab: 'field', src: 'Practice 36A #24–25', title: 'Field at the origin from three charges', kind: 'numeric', level: 2, topics: ['superposition', 'vectors'],
    vars: { q1: range(1, 10, 1, 'μC', 1e-6), s1: SIGN, q2: range(1, 10, 1, 'μC', 1e-6), s2: SIGN, q3: range(1, 10, 1, 'μC', 1e-6), s3: SIGN, a: range(10, 80, 5, 'cm', 1e-2), b: range(10, 50, 5, 'cm', 1e-2) },
    derive: ($) => {
      const Ex = (K * ($.s1 * $.q1 - $.s3 * $.q3)) / $.a ** 2;
      const Ey = (-K * $.s2 * $.q2) / $.b ** 2;
      return { Ex, Ey, E: Math.hypot(Ex, Ey), al: angleDeg(Ex, Ey) };
    },
    text: (T) => `q₁ = ${T.q1} μC (${T.s1}) is at x = −${T.a} cm, q₂ = ${T.q2} μC (${T.s2}) is at y = +${T.b} cm, and q₃ = ${T.q3} μC (${T.s3}) is at x = +${T.a} cm. Find the field at the origin.`,
    parts: [num('E', ($) => $.E, 'N/C', { label: '|E|' }), num('al', ($) => $.al, '°', { label: 'α (from +x)', abs: 1, tol: 0.005, wrap: 360 })],
    steps: ($, f) => [
      String.raw`$E_x = \dfrac{k(q_1 - q_3)}{a^2} = ${texNum($.Ex)}\ \text{N/C}$`,
      String.raw`$E_y = -\dfrac{kq_2}{b^2} = ${texNum($.Ey)}\ \text{N/C}$`,
      String.raw`$|\vec{E}|$ = ${f($.E)} N/C at $\alpha$ = ${f($.al)}°`,
    ],
    sim: {
      scenario: 'quad',
      setup: fieldSetup(($) => [charge($.s1 * $.q1, -$.a, 0), charge($.s2 * $.q2, 0, $.b), charge($.s3 * $.q3, $.a, 0)], () => ({ x: 0, y: 0, z: 0 })),
      read: (c) => ({ E: Emag(c), al: angleDeg(c.probeE.x, c.probeE.y) }),
    },
    cases: [
      kase('#24', { q1: 8, s1: 1, q2: 6, s2: -1, q3: 8, s3: 1, a: 50, b: 20 }, { E: 1.348e6, al: 90 }, { key: '1.35 x 10^6 N/C, α = 90°' }),
      kase('#25', { q1: 8, s1: 1, q2: 6, s2: -1, q3: 8, s3: -1, a: 50, b: 20 }, { E: 1.466e6, al: 66.9 }, { key: '1.47 x 10^6 N/C, α = 67°' }),
    ],
  }),
  problem({
    ...A, id: 'e2.36a.dipole', lab: 'field', src: 'Practice 36A #26', title: 'Dipole field on the perpendicular bisector', kind: 'numeric', level: 2, topics: ['dipole', 'superposition'],
    vars: { q: range(1, 10, 0.5, 'μC', 1e-6), r1: range(4, 20, 1, 'cm', 1e-2), r2: range(4, 20, 1, 'cm', 1e-2), pos: choice([1, 'right'], [-1, 'left']) },
    derive: ($) => ({ E: (2 * K * $.q * ($.r1 / 2)) / $.r2 ** 3, h: Math.sqrt(Math.max(0, $.r2 ** 2 - ($.r1 / 2) ** 2)) }),
    valid: ($) => $.r2 > $.r1 / 2 + 0.01,
    text: (T) => `A dipole: −${T.q} μC and +${T.q} μC charges are ${T.r1} cm apart, with the positive charge on the ${T.pos}. Point P is ${T.r2} cm from each charge, below their midpoint. Find the field at P.`,
    parts: [
      sym('E_sym', 'k*q*r1/r2^3', { q: 'C', r1: 'm', r2: 'm' }, ($) => $.E, { unit: 'N/C', label: String.raw`$|\vec{E}|$ as a formula` }),
      num('E', ($) => $.E, 'N/C', { label: String.raw`$|\vec{E}|$` }),
      mc('dir', [[1, '+x'], [-1, '−x'], [2, '+y'], [-2, '−y']], ($) => -$.pos, { label: 'Direction' }),
    ],
    hints: [String.raw`The vertical components cancel. Each horizontal component is $\dfrac{kq}{r_2^2}\cdot\dfrac{r_1/2}{r_2}$.`],
    steps: ($, f) => [
      String.raw`Each charge gives $\dfrac{kq}{r_2^2} = ${texNum((K * $.q) / $.r2 ** 2)}\ \text{N/C}$`,
      String.raw`Adding the horizontal parts gives ${f($.E)} N/C, pointing from $+$ toward $-$`,
    ],
    sim: {
      scenario: 'dipole',
      setup: fieldSetup(($) => [charge($.q, ($.pos * $.r1) / 2, 0), charge(-$.q, (-$.pos * $.r1) / 2, 0)], ($) => ({ x: 0, y: -$.h, z: 0 })),
      read: (c) => ({ E: Emag(c), dir: Math.sign(c.probeE.x) }),
    },
    cases: [kase('#26', { q: 6, r1: 10, r2: 7, pos: 1 }, { E: 1.572e7, dir: -1 }, { key: '1.57 x 10^7 N/C along −x' })],
  }),

  // ================================================================= 36B
  problem({
    ...B, id: 'e2.36b.line-charge-total', lab: 'integral', src: 'Practice 36B #1', title: 'Total charge from λ', kind: 'numeric', topics: ['charge-density'],
    vars: { lam: range(1, 50, 1, 'μC/m', 1e-6), L: range(0.1, 2, 0.05, 'm') },
    derive: ($) => ({ Q: $.lam * $.L }),
    text: (T) => `A uniform wire has λ = ${T.lam} μC/m. What is the total charge on ${T.L} m of it?`,
    parts: [num('Q', ($) => $.Q, 'C')],
    steps: ($, f) => [String.raw`$Q = \lambda L = ${texNum($.Q)}\ \text{C}$`],
    cases: [kase('#1', { lam: 10, L: 0.25 }, { Q: 2.5e-6 }, { key: '2.5 x 10^-6 C' })],
  }),
  problem({
    ...B, id: 'e2.36b.line-length', lab: 'integral', src: 'Practice 36B #2', title: 'Wire length from Q and λ', kind: 'numeric', topics: ['charge-density'],
    vars: { Q: range(0.001, 0.05, 0.001, 'C'), lam: range(1, 50, 1, 'μC/m', 1e-6) },
    derive: ($) => ({ L: $.Q / $.lam }),
    text: (T) => `A uniform wire carries ${T.Q} C in total with λ = ${T.lam} μC/m. How long is it?`,
    parts: [num('L', ($) => $.L, 'm')],
    steps: ($, f) => [String.raw`$L = \dfrac{Q}{\lambda} = ${texNum($.L)}\ \text{m}$`],
    cases: [kase('#2', { Q: 0.02, lam: 10 }, { L: 2000 }, { key: '0.2 m', note: 'ANSWER KEY ERROR: 0.02 C ÷ 1×10⁻⁵ C/m = 2000 m, not 0.2 m.' })],
  }),
  problem({
    ...B, id: 'e2.36b.disk-radius', lab: 'integral', src: 'Practice 36B #3', title: 'Disk radius from σ', kind: 'numeric', topics: ['charge-density'],
    vars: { Q: range(0.5, 10, 0.5, 'μC', 1e-6), sig: range(1, 20, 0.5, 'μC/m²', 1e-6) },
    derive: ($) => ({ R: Math.sqrt($.Q / (Math.PI * $.sig)) }),
    text: (T) => `A circular disk carries ${T.Q} μC with σ = ${T.sig} μC/m². What is its radius?`,
    parts: [
      sym('R_sym', 'sqrt(Q/(pi*sig))', { Q: 'C', sig: 'C/m²' }, ($) => $.R, { unit: 'm', label: String.raw`$R$ as a formula` }),
      num('R', ($) => $.R, 'm'),
    ],
    steps: ($, f) => [String.raw`$R = \sqrt{\dfrac{Q}{\pi\sigma}} = ${texNum($.R)}\ \text{m}$`],
    cases: [kase('#3', { Q: 2, sig: 5 }, { R: 0.357 }, { key: '0.36 m' })],
  }),
  problem({
    ...B, id: 'e2.36b.shell-sigma', lab: 'conductors', src: 'Practice 36B #4', title: 'Surface charge density on a shell', kind: 'numeric', topics: ['charge-density', 'conductors'],
    vars: { Q: range(1, 20, 1, 'μC', 1e-6), Ro: range(0.2, 0.55, 0.05, 'm'), Ri: range(0.1, 0.5, 0.05, 'm') },
    derive: ($) => ({ sigma: $.Q / (4 * Math.PI * $.Ro ** 2) }),
    valid: ($) => $.Ri < $.Ro - 0.04,
    text: (T) => `A conducting spherical shell (outer radius ${T.Ro} m, inner radius ${T.Ri} m) has ${T.Q} μC on its outer surface. What is the surface charge density there?`,
    parts: [num('sigma', ($) => $.sigma, 'C/m²')],
    hints: ['Only the outer radius matters for the outer surface.'],
    steps: ($, f) => [String.raw`$\sigma = \dfrac{Q}{4\pi R_{\text{out}}^2} = ${texNum($.sigma)}\ \text{C/m}^2$`],
    sim: {
      scenario: 'uniform',
      setup(s, $) {
        s.R = $.Ro;
        s.Q = $.Q;
      },
      read: (c) => ({ sigma: c.sigma }),
    },
    cases: [kase('#4', { Q: 8, Ro: 0.5, Ri: 0.4 }, { sigma: 2.546e-6 }, { key: '2.5 x 10^-6 C', note: 'Key gives the units as C; they should be C/m². The problem text also says "net negative charge of positive q".' })],
  }),
  problem({
    ...B, id: 'e2.36b.volume-charge', lab: 'integral', src: 'Practice 36B #5', title: 'Total charge from ρ', kind: 'numeric', topics: ['charge-density'],
    vars: { rho: range(1, 20, 0.5, '×10⁻⁵ C/m³', 1e-5), R: range(1, 20, 1, 'cm', 1e-2) },
    derive: ($) => ({ Q: ($.rho * 4 * Math.PI * $.R ** 3) / 3 }),
    text: (T) => `A sphere of radius ${T.R} cm has a uniform ρ = ${T.rho} × 10⁻⁵ C/m³. What is its total charge?`,
    parts: [
      sym('Q_sym', 'rho*4*pi*R^3/3', { rho: 'C/m³', R: 'm' }, ($) => $.Q, { unit: 'C', label: String.raw`$Q$ as a formula` }),
      num('Q', ($) => $.Q, 'C'),
    ],
    steps: ($, f) => [String.raw`$Q = \rho\cdot\tfrac{4}{3}\pi R^3 = ${texNum($.Q)}\ \text{C}$`],
    cases: [kase('#5', { rho: 7, R: 5 }, { Q: 3.665e-8 }, { key: '3.66 x 10^-8 C' })],
  }),
  problem({
    ...B, id: 'e2.36b.rod-bisector', lab: 'integral', src: 'Practice 36B #6', title: 'Finite line charge — field on the bisector', kind: 'derivation', level: 3, topics: ['continuous-distribution', 'integration'],
    vars: { lam: range(-5, 5, 0.1, 'μC/m', 1e-6, { exclude: [0] }), L: range(0.3, 1.4, 0.01, 'm'), d: range(0.12, 0.9, 0.01, 'm') },
    derive: ($) => ({ Ey: (K * $.lam * $.L) / ($.d * Math.sqrt($.d ** 2 + $.L ** 2 / 4)) }),
    text: (T) => `A straight wire of length L = ${T.L} m lies on the x-axis, centered at the origin, with λ = ${T.lam} μC/m. Point P is a distance d = ${T.d} m directly above the center.`,
    parts: [
      self('setup', 'Sketch dq, r, θ and dE on the diagram.', 'dq = λ dx at x; r = √(x² + d²); dE points from dq toward P (if λ > 0); cos θ = d/r.'),
      mc('Ex', [[0, 'Eₓ = 0 by symmetry'], [1, 'Eₓ = kλL/d²'], [2, 'Eₓ depends on the sign of x']], 0, { label: 'x component' }),
      sym('Ey_sym', 'k*lam*L/(d*sqrt(d^2 + L^2/4))', { lam: 'C/m', L: 'm', d: 'm' }, ($) => $.Ey, { unit: 'N/C', label: String.raw`$E_y$ as a formula (use k, lam, L, d)` }),
      num('Ey', ($) => $.Ey, 'N/C', { label: String.raw`$E_y$ (signed)` }),
    ],
    hints: [
      String.raw`$dE_y = \dfrac{k\lambda d\,dx}{(x^2+d^2)^{3/2}}$`,
      String.raw`$\displaystyle\int \frac{dx}{(x^2+d^2)^{3/2}} = \frac{x}{d^2\sqrt{x^2+d^2}}$`,
    ],
    steps: ($, f) => [
      String.raw`$dq = \lambda\,dx$ and $r^2 = x^2 + d^2$`,
      String.raw`The $dE_x$ contributions cancel in $\pm$ pairs, so $E_x = 0$.`,
      String.raw`$E_y = \displaystyle\int_{-L/2}^{L/2} \frac{k\lambda d\,dx}{(x^2+d^2)^{3/2}} = \frac{k\lambda L}{d\sqrt{d^2 + L^2/4}}$`,
      String.raw`$E_y = ${texNum($.Ey)}\ \text{N/C}$`,
    ],
    sim: {
      scenario: 'rod',
      setup(s, $) {
        Object.assign(s.integral, { kind: 'rod', L: $.L, lambda: $.lam, d: $.d, quantity: 'E' });
      },
      read: (c) => ({ Ey: c.integral.analytic.E.y, Ey_sym: c.integral.analytic.E.y }),
    },
    cases: [kase('hand', { lam: 2, L: 0.8, d: 0.35 }, { Ey: 77337 })],
  }),
  problem({
    ...B, id: 'e2.36b.ring-axis', lab: 'integral', src: 'Ch 36B lecture example', title: 'Charged ring — field on the axis', kind: 'derivation', level: 2, topics: ['continuous-distribution', 'integration'],
    vars: { Q: range(-5, 5, 0.1, 'μC', 1e-6, { exclude: [0] }), a: range(0.1, 0.6, 0.01, 'm'), y: range(0.05, 0.9, 0.01, 'm') },
    derive: ($) => ({ Ey: (K * $.Q * $.y) / ($.y ** 2 + $.a ** 2) ** 1.5 }),
    text: (T) => `A ring of radius a = ${T.a} m carries Q = ${T.Q} μC spread uniformly. Find the field on its axis, y = ${T.y} m from the center.`,
    parts: [
      sym('Ey_sym', 'k*Q*y/(y^2 + a^2)^(3/2)', { Q: 'C', y: 'm', a: 'm' }, ($) => $.Ey, { unit: 'N/C', label: String.raw`$E_y$ as a formula (use k, Q, y, a)` }),
      num('Ey', ($) => $.Ey, 'N/C', { label: String.raw`$E_y$ (signed)` }),
      mc('maxat', [[1, 'At the center (y = 0)'], [2, 'At y = a/√2'], [3, 'At y = a'], [4, 'Very far away']], 2, { label: 'Where on the axis is |E| largest?' }),
    ],
    hints: [
      String.raw`Every $dq$ is the same distance $\sqrt{y^2+a^2}$ from $P$.`,
      String.raw`Components perpendicular to the axis cancel; the axial part carries a factor $y/r$.`,
    ],
    steps: ($, f) => [
      String.raw`$dE_y = \dfrac{k\,dq\,y}{(y^2+a^2)^{3/2}}$, and summing over the ring gives $\dfrac{kQy}{(y^2+a^2)^{3/2}}$`,
      String.raw`$E_y = ${texNum($.Ey)}\ \text{N/C}$`,
      String.raw`$\dfrac{d|\vec{E}|}{dy} = 0$ at $y = a/\sqrt{2}$`,
    ],
    sim: {
      scenario: 'ring',
      setup(s, $) {
        Object.assign(s.integral, { kind: 'ring', Q: $.Q, a: $.a, y: $.y, quantity: 'E' });
      },
      read: (c) => ({ Ey: c.integral.analytic.E.y, Ey_sym: c.integral.analytic.E.y }),
    },
    cases: [kase('hand', { Q: 2.5, a: 0.32, y: 0.38 }, { Ey: 69671, maxat: 2 })],
  }),
  problem({
    ...B, id: 'e2.36b.rod-axis', lab: 'integral', src: 'Practice 36B #7', title: 'Finite line charge — field on its own axis', kind: 'derivation', level: 3, topics: ['continuous-distribution', 'integration'],
    vars: { lam: range(1, 50, 1, 'nC/m', 1e-9), L: range(0.2, 3, 0.1, 'm'), d: range(0.05, 1, 0.05, 'm') },
    derive: ($) => ({ Ex: (K * $.lam * $.L) / ($.d * ($.L + $.d)) }),
    text: (T) => `A thin wire runs from x = 0 to x = L = ${T.L} m with λ = ${T.lam} nC/m. Find the field at P on the x-axis, d = ${T.d} m beyond the right end.`,
    parts: [
      self('setup', 'Label dq, its distance to P, and dE.', 'dq = λ dx at x; distance = L + d − x; every dE points along +x.'),
      sym('Ex_sym', 'k*lam*L/(d*(L + d))', { lam: 'C/m', L: 'm', d: 'm' }, ($) => $.Ex, { unit: 'N/C', label: String.raw`$E_x$ as a formula` }),
      num('Ex', ($) => $.Ex, 'N/C'),
    ],
    hints: [
      'There are no components to cancel here.',
      String.raw`$\displaystyle\int_0^L \frac{dx}{(L+d-x)^2} = \frac{1}{d} - \frac{1}{L+d}$`,
    ],
    steps: ($, f) => [
      String.raw`$E = k\lambda\left[\dfrac{1}{d} - \dfrac{1}{L+d}\right] = \dfrac{k\lambda L}{d(L+d)}$`,
      String.raw`$E = ${texNum($.Ex)}\ \text{N/C}$ along $+x$`,
    ],
    cases: [kase('hand', { lam: 10, L: 1, d: 0.5 }, { Ex: 119.8 })],
  }),
  problem({
    ...B, id: 'e2.36b.semicircle', lab: 'integral', src: 'Practice 36B #8', title: 'Semicircular wire — field at the center', kind: 'derivation', level: 3, topics: ['continuous-distribution', 'integration', 'symmetry'],
    vars: { lam: range(1, 50, 1, 'nC/m', 1e-9), R: range(0.05, 1, 0.05, 'm') },
    derive: ($) => ({ E: (2 * K * $.lam) / $.R }),
    text: (T) => `A thin wire bent into a semicircle of radius R = ${T.R} m lies in the upper half-plane, centered on P at the origin, with λ = ${T.lam} nC/m (positive). Find the field at P.`,
    parts: [
      self('setup', 'Label dq, R, θ and dE.', 'dq = λR dθ at angle θ; dE points from dq toward P, i.e. along −(cos θ, sin θ).'),
      mc('Ex', [[0, 'Eₓ = 0: the cos θ terms cancel from 0 to π'], [1, 'Eₓ = 2kλ/R']], 0, { label: 'Show that Eₓ = 0' }),
      sym('E_sym', '2*k*lam/R', { lam: 'C/m', R: 'm' }, ($) => $.E, { unit: 'N/C', label: String.raw`$|E_y|$ as a formula` }),
      num('E', ($) => $.E, 'N/C', { label: '|E|' }),
      mc('dir', [[-2, '−y (away from the arc)'], [2, '+y (toward the arc)']], -2, { label: 'Direction' }),
    ],
    hints: [
      String.raw`$dE = \dfrac{k\lambda R\,d\theta}{R^2} = \dfrac{k\lambda}{R}\,d\theta$`,
      String.raw`$\displaystyle\int_0^\pi \sin\theta\,d\theta = 2$ and $\displaystyle\int_0^\pi \cos\theta\,d\theta = 0$`,
    ],
    steps: ($, f) => [
      String.raw`$E_x = -\dfrac{k\lambda}{R}\displaystyle\int \cos\theta\,d\theta = 0$`,
      String.raw`$E_y = -\dfrac{k\lambda}{R}\displaystyle\int \sin\theta\,d\theta = -\dfrac{2k\lambda}{R} = -${texNum($.E)}\ \text{N/C}$`,
    ],
    cases: [kase('hand', { lam: 10, R: 0.2 }, { E: 898.8, dir: -2 })],
  }),
  problem({
    ...B, id: 'e2.36b.disk-axis', lab: 'integral', src: 'Practice 36B #9', title: 'Charged disk — field on the axis', kind: 'derivation', level: 3, topics: ['continuous-distribution', 'integration'],
    vars: { sig: range(1, 50, 1, 'nC/m²', 1e-9), R: range(0.05, 1, 0.05, 'm'), s: range(0.02, 1, 0.02, 'm') },
    derive: ($) => ({ E: 2 * Math.PI * K * $.sig * (1 - $.s / Math.hypot($.s, $.R)) }),
    text: (T) => `A disk of radius R = ${T.R} m has a uniform σ = ${T.sig} nC/m² (positive). Find the field on its axis, s = ${T.s} m from the center.`,
    parts: [
      self('setup', 'Break the disk into rings and label one.', 'Ring of radius r and width dr: dq = σ·2πr dr; dE = k dq·s/(s² + r²)^{3/2} along the axis.'),
      sym('E_sym', '2*pi*k*sig*(1 - s/sqrt(s^2 + R^2))', { sig: 'C/m²', s: 'm', R: 'm' }, ($) => $.E, { unit: 'N/C', label: String.raw`$E$ as a formula (use k, sig, s, R)` }),
      num('E', ($) => $.E, 'N/C'),
      num('sheet', ($) => $.sig / (2 * EPS0), 'N/C', { label: 'Limit R → ∞ (infinite sheet)' }),
    ],
    hints: [String.raw`Use the ring result, then substitute $u = s^2 + r^2$.`],
    steps: ($, f) => [
      String.raw`$E = \displaystyle\int_0^R \frac{k\sigma\,2\pi r s\,dr}{(s^2+r^2)^{3/2}} = 2\pi k\sigma\left[1 - \frac{s}{\sqrt{s^2+R^2}}\right]$`,
      String.raw`$E = ${texNum($.E)}\ \text{N/C}$; for an infinite sheet $\dfrac{\sigma}{2\varepsilon_0} = ${texNum($.sig / (2 * EPS0))}\ \text{N/C}$`,
    ],
    cases: [kase('hand', { sig: 10, R: 0.3, s: 0.2 }, { E: 251.5, sheet: 564.97 })],
  }),

  // ================================================================= 36C
  problem({
    ...Cc, id: 'e2.36c.zero-flux', lab: 'gauss', src: 'Practice 36C #1', title: 'Zero flux vs zero field', kind: 'conceptual', topics: ['flux', 'gauss'],
    text: () => 'True or false: if the electric flux through a closed surface is zero, the electric field on that surface must be zero.',
    parts: [tf('tf', false)],
    steps: () => [String.raw`False. Zero flux means zero *enclosed* charge; field lines from an outside charge still enter and leave the surface, and $\vec{E}$ on it is not zero.`],
    sim: {
      scenario: 'outside',
      read: (c) => ({ '@Φ ≈ 0 with a charge outside (fraction of q/ε₀)': [c.gauss.Phi * EPS0 / 1.5e-6, 0] }),
    },
    cases: [kase('#1', {}, { tf: 0 }, { key: 'B' })],
  }),
  problem({
    ...Cc, id: 'e2.36c.surfaces', lab: 'gauss', src: 'Practice 36C #2 (generalized)', title: 'Flux through several Gaussian surfaces', kind: 'numeric', level: 2, topics: ['flux', 'gauss'],
    vars: { n1: range(-3, 3, 1, '', 1, { exclude: [0] }), n2: range(-3, 3, 1, '', 1, { exclude: [0] }), n3: range(-3, 3, 1, '', 1, { exclude: [0] }) },
    text: (T) => `Charges q₁ = ${T.n1}q, q₂ = ${T.n2}q and q₃ = ${T.n3}q sit in a row. Surface a encloses q₁ only, b encloses q₁ and q₂, c encloses q₂ and q₃, and d encloses all three. Give the flux through each surface in units of q/ε₀.`,
    parts: [
      num('a', ($) => $.n1, 'q/ε₀', { abs: 0.01, label: String.raw`$\Phi_a$` }),
      num('b', ($) => $.n1 + $.n2, 'q/ε₀', { abs: 0.01, label: String.raw`$\Phi_b$` }),
      num('c', ($) => $.n2 + $.n3, 'q/ε₀', { abs: 0.01, label: String.raw`$\Phi_c$` }),
      num('d', ($) => $.n1 + $.n2 + $.n3, 'q/ε₀', { abs: 0.01, label: String.raw`$\Phi_d$` }),
    ],
    steps: () => [String.raw`$\Phi_E = \dfrac{q_{\text{enc}}}{\varepsilon_0}$ for each surface. Charges outside a surface contribute nothing, whatever its shape.`],
    sim: {
      scenario: 'one-in-one-out',
      setup(s, $) {
        s.surface = { type: 'sphere', R: 0.45, L: 0.8, tilt: 0, origin: { x: 0, y: 0, z: 0 } };
        s.charges = [charge($.n1 * 1e-6, -0.18, 0), charge($.n2 * 1e-6, 0.18, 0.02), charge($.n3 * 1e-6, 0.75, 0)];
        s.selectedId = s.charges[0].id;
        return 'The sphere plays surface b (it encloses q₁ and q₂). q = 1 μC.';
      },
      read: (c) => ({ b: c.Qin / 1e-6, '@numerical Φ·ε₀/q vs Q_in/q': [(c.gauss.Phi * EPS0) / 1e-6, c.Qin / 1e-6] }),
    },
    cases: [kase('#2 (reconstructed)', { n1: 2, n2: -1, n3: 1 }, { a: 2, b: 1, c: 0, d: 2 }, { key: 'A) b  B) c  C) 2q/ε₀', note: 'Charge layout rebuilt to match the key; the original figure is different.' })],
  }),
  problem({
    ...Cc, id: 'e2.36c.cavity', lab: 'conductors', src: 'Practice 36C #3', title: 'Charge in the cavity of a neutral conductor', kind: 'conceptual', topics: ['conductors', 'gauss'],
    vars: { q: range(1, 20, 1, 'μC') },
    text: (T) => `A neutral conductor has a hollow cavity. A +${T.q} μC charge sits in the cavity without touching the walls. Which statements are true? (Select all that apply.)`,
    parts: [
      mc('stmts', [
        [1, 'The inner surface is −q and the outer surface has no excess charge'],
        [2, 'Each surface carries −q/2'],
        [3, 'The field inside the metal points away from +q'],
        [4, 'The outer surface is +q and the inner surface is −q'],
        [5, 'Neither surface has excess charge, because the conductor is neutral'],
      ], [4], { multi: true }),
    ],
    steps: () => [
      String.raw`$\vec{E} = 0$ inside the metal, so a Gaussian surface drawn there encloses zero charge and the inner surface must hold $-q$.`,
      String.raw`The conductor is neutral overall, so the outer surface holds $+q$.`,
    ],
    sim: {
      scenario: 'cage',
      setup(s, $) {
        s.q = $.q * 1e-6;
      },
    },
    cases: [kase('#3', { q: 10 }, { stmts: [4] }, { key: 'D' })],
  }),
  problem({
    ...Cc, id: 'e2.36c.hoop-flux', lab: 'gauss', src: 'Practice 36C #4', title: 'Flux through a tilted hoop', kind: 'numeric', topics: ['flux'],
    vars: { r: range(2, 30, 1, 'cm', 1e-2), E: range(100, 2000, 50, 'N/C'), th: range(10, 80, 5, '°') },
    derive: ($) => ({ Phi: $.E * Math.PI * $.r ** 2 * Math.sin($.th * DEG) }),
    text: (T) => `A hoop of radius ${T.r} cm is in a uniform ${T.E} N/C field. The plane of the hoop makes ${T.th}° with the field lines. Find the flux through it.`,
    parts: [num('Phi', ($) => $.Phi, 'N·m²/C', { label: 'Φ' })],
    hints: [String.raw`The given angle is measured from the plane, not from the area vector $\hat{n}$.`],
    steps: ($, f) => [
      String.raw`The angle between $\vec{E}$ and $\hat{n}$ is $90^\circ - \theta$, so $\Phi_E = EA\sin\theta = ${texNum($.Phi)}\ \text{N}\cdot\text{m}^2\text{/C}$`,
    ],
    sim: {
      scenario: 'uniform-square',
      setup(s, $) {
        s.surface = { ...s.surface, type: 'square', R: Math.sqrt(Math.PI) * $.r / 2 };
        s.extraE = { x: 0, y: $.E, z: 0 };
        return 'The lab uses a square with the same area as the hoop. Set its tilt so n̂ makes 90° − θ with E.';
      },
    },
    cases: [kase('#4', { r: 6, E: 400, th: 45 }, { Phi: 3.2 }, { key: '3.2 N·m²/C' })],
  }),
  problem({
    ...Cc, id: 'e2.36c.rect-flux', lab: 'gauss', src: 'Practice 36C #5', title: 'Flux of E = m x² ẑ through a rectangle', kind: 'derivation', level: 2, topics: ['flux', 'integration'],
    vars: { m: range(10, 500, 10, 'N/(C·m²)'), a: range(0.1, 2, 0.1, 'm'), b: range(0.1, 2, 0.1, 'm') },
    derive: ($) => ({ Phi: ($.m * $.a * $.b ** 3) / 3 }),
    text: (T) => `A rectangle in the x–y plane spans 0 ≤ x ≤ b and 0 ≤ y ≤ a (b = ${T.b} m, a = ${T.a} m). The field is E = m x² ẑ with m = ${T.m} N/(C·m²). Find the flux.`,
    parts: [
      sym('Phi_sym', 'm*a*b^3/3', { m: 'N/(C·m²)', a: 'm', b: 'm' }, ($) => $.Phi, { unit: 'N·m²/C', label: String.raw`$\Phi_E$ as a formula` }),
      num('Phi', ($) => $.Phi, 'N·m²/C'),
    ],
    hints: [String.raw`Use strips of constant $x$: $dA = a\,dx$.`],
    steps: ($, f) => [
      String.raw`$\Phi_E = \displaystyle\int_0^b m x^2 a\,dx = \frac{mab^3}{3} = ${texNum($.Phi)}\ \text{N}\cdot\text{m}^2\text{/C}$`,
    ],
    cases: [kase('hand', { m: 100, a: 1, b: 0.5 }, { Phi: 4.1667 })],
  }),
  problem({
    ...Cc, id: 'e2.36c.hoop-nonuniform', lab: 'gauss', src: 'Practice 36C #6', title: 'Flux of E(r) = a + b√r through a hoop', kind: 'derivation', level: 3, topics: ['flux', 'integration'],
    vars: { a: range(10, 500, 10, 'N/C'), b: range(10, 500, 10, 'N/(C·m^½)'), R: range(0.1, 2, 0.1, 'm') },
    derive: ($) => ({ Phi: Math.PI * $.a * $.R ** 2 + ((4 * Math.PI) / 5) * $.b * $.R ** 2.5 }),
    text: (T) => `A hoop of radius R = ${T.R} m is perpendicular to E(r) = (a + b√r) x̂, where r is measured from its center; a = ${T.a} N/C, b = ${T.b} N/(C·m^½). Find the flux.`,
    parts: [
      sym('Phi_sym', 'pi*a*R^2 + 4*pi/5*b*R^(5/2)', { a: 'N/C', b: 'N/(C·m^0.5)', R: 'm' }, ($) => $.Phi, { unit: 'N·m²/C', label: String.raw`$\Phi_E$ as a formula` }),
      num('Phi', ($) => $.Phi, 'N·m²/C'),
    ],
    hints: [String.raw`Use rings: $dA = 2\pi r\,dr$.`, String.raw`$\displaystyle\int r^{3/2}\,dr = \tfrac{2}{5}r^{5/2}$`],
    steps: ($, f) => [
      String.raw`$\Phi_E = \displaystyle\int_0^R (a + b\sqrt{r})\,2\pi r\,dr = \pi a R^2 + \frac{4\pi}{5}bR^{5/2} = ${texNum($.Phi)}\ \text{N}\cdot\text{m}^2\text{/C}$`,
    ],
    cases: [kase('hand', { a: 100, b: 50, R: 1 }, { Phi: 439.82 })],
  }),
  problem({
    ...Cc, id: 'e2.36c.concentric', lab: 'conductors', src: 'Practice 36C #7', title: 'Solid sphere inside a conducting shell', kind: 'numeric', level: 3, topics: ['gauss', 'conductors', 'spherical-symmetry'],
    vars: { q1: range(1, 10, 0.5, 'μC', 1e-6), s1: SIGN, q2: range(1, 10, 0.5, 'μC', 1e-6), s2: SIGN, R1: range(5, 15, 1, 'cm', 1e-2), R2: range(16, 25, 1, 'cm', 1e-2), R3: range(26, 40, 1, 'cm', 1e-2), fb: range(0.1, 0.9, 0.1), fd: range(1.1, 2, 0.1) },
    derive: ($) => {
      const Q1 = $.s1 * $.q1;
      const Qout = Q1 + $.s2 * $.q2;
      const rb = $.R1 + $.fb * ($.R2 - $.R1);
      const rd = $.fd * $.R3;
      return { Q1, Qout, rb, rd, Eb: (K * Q1) / rb ** 2, Ed: (K * Qout) / rd ** 2 };
    },
    valid: ($) => Math.abs($.Qout) > 1e-9,
    text: (T, $, f) => `A solid conducting sphere (R₁ = ${T.R1} cm) carries ${T.q1} μC (${T.s1}). It sits at the center of a conducting shell (R₂ = ${T.R2} cm inside, R₃ = ${T.R3} cm outside) that carries a net ${T.q2} μC (${T.s2}). Find the surface charges on the shell and the field at r = ${f($.rb * 100)} cm and r = ${f($.rd * 100)} cm.`,
    parts: [
      num('Qin', ($) => -$.Q1, 'μC', { scale: 1e-6, abs: 0.01, label: 'Inner surface of the shell' }),
      num('Qout', ($) => $.Qout, 'μC', { scale: 1e-6, abs: 0.01, label: 'Outer surface of the shell' }),
      num('Eb', ($) => Math.abs($.Eb), 'N/C', { label: (T, $, f) => `|E| at r = ${f($.rb * 100)} cm` }),
      mc('Eb_dir', RADIAL, ($) => Math.sign($.Q1), { label: 'Its direction' }),
      mc('Emetal', [[0, 'Zero'], [1, 'kq₁/r²'], [2, 'k(q₁ + q₂)/r²']], 0, { label: 'E inside the shell material (R₂ < r < R₃)' }),
      num('Ed', ($) => Math.abs($.Ed), 'N/C', { label: (T, $, f) => `|E| at r = ${f($.rd * 100)} cm` }),
      mc('Ed_dir', RADIAL, ($) => Math.sign($.Qout), { label: 'Its direction' }),
    ],
    hints: [
      String.raw`$\vec{E} = 0$ inside the metal — use that to find the charge on the inner surface.`,
      'Outside everything, only the total charge matters.',
    ],
    steps: ($, f) => [
      String.raw`inner surface $= -q_1 = ${texNum(-$.Q1 * 1e6)}\ \mu\text{C}$, outer surface $= q_1 + q_2 = ${texNum($.Qout * 1e6)}\ \mu\text{C}$`,
      String.raw`$R_1 < r < R_2$: $E = \dfrac{kq_1}{r^2} = ${texNum($.Eb)}\ \text{N/C}$`,
      String.raw`$r > R_3$: $E = \dfrac{k(q_1+q_2)}{r^2} = ${texNum($.Ed)}\ \text{N/C}$`,
    ],
    cases: [kase('#7', { q1: 5, s1: 1, q2: 8, s2: -1, R1: 10, R2: 20, R3: 30, fb: 0.5, fd: 35 / 30 }, { Qin: -5, Qout: -3, Eb: 1.998e6, Eb_dir: 1, Emetal: 0, Ed: 2.201e5, Ed_dir: -1 }, { key: 'A) −5 μC, −3 μC  C) 2×10⁶  E) 2.2×10⁵ N/C' })],
  }),
  problem({
    ...Cc, id: 'e2.36c.insulating-sphere', lab: 'gauss', src: 'Practice 36C #8', title: 'Uniformly charged insulating sphere', kind: 'numeric', level: 2, topics: ['gauss', 'spherical-symmetry'],
    vars: { Q: range(1, 30, 1, 'μC', 1e-6), R: range(5, 40, 1, 'cm', 1e-2), f: range(0.1, 2, 0.05) },
    derive: ($) => {
      const r = $.f * $.R;
      return { r, E: r < $.R ? (K * $.Q * r) / $.R ** 3 : (K * $.Q) / r ** 2 };
    },
    valid: ($) => Math.abs($.f - 1) > 0.01,
    text: (T, $, f) => `A non-conducting sphere of radius ${T.R} cm has ${T.Q} μC spread uniformly through its volume. What is |E| at ${f($.r * 100)} cm from the center?`,
    parts: [num('E', ($) => $.E, 'N/C')],
    hints: [String.raw`Inside, the enclosed charge is $Q(r/R)^3$.`],
    steps: ($, f) => [
      String.raw`Inside: $E = \dfrac{kQr}{R^3}$. Outside: $E = \dfrac{kQ}{r^2}$.`,
      String.raw`$E = ${texNum($.E)}\ \text{N/C}$`,
    ],
    cases: [kase('#8', { Q: 15, R: 20, f: 0.6 }, { E: 2.022e6 }, { key: '2.0 x 10^6 N/C' })],
  }),
  problem({
    ...Cc, id: 'e2.36c.long-wire', lab: 'gauss', src: 'Practice 36C #9', title: 'Long wire via Gauss', kind: 'numeric', topics: ['gauss', 'cylindrical-symmetry'],
    vars: { Q: range(1, 20, 0.5, 'μC', 1e-6), Lw: range(10, 100, 5, 'm'), r: range(5, 50, 1, 'cm', 1e-2) },
    derive: ($) => ({ E: (2 * K * $.Q) / ($.Lw * $.r) }),
    text: (T) => `A ${T.Lw} m wire carries ${T.Q} μC spread uniformly. Use Gauss's law to find |E| ${T.r} cm from the wire, far from its ends.`,
    parts: [
      sym('E_sym', '2*k*Q/(Lw*r)', { Q: 'C', Lw: 'm', r: 'm' }, ($) => $.E, { unit: 'N/C', label: String.raw`$E$ as a formula` }),
      num('E', ($) => $.E, 'N/C'),
    ],
    steps: ($, f) => [
      String.raw`$\lambda = Q/L$, and a cylindrical Gaussian surface gives $E\,(2\pi r\ell) = \dfrac{\lambda\ell}{\varepsilon_0}$`,
      String.raw`$E = \dfrac{2k\lambda}{r} = ${texNum($.E)}\ \text{N/C}$`,
    ],
    cases: [kase('#9', { Q: 4, Lw: 50, r: 20 }, { E: 7190 }, { key: '7.2 x 10^3 N/C' })],
  }),
  problem({
    ...Cc, id: 'e2.36c.sheet', lab: 'gauss', src: 'Ch 36C (planar symmetry)', title: 'Infinite sheet and parallel plates', kind: 'numeric', level: 2, topics: ['gauss', 'planar-symmetry'],
    vars: { sig: range(1, 50, 1, 'nC/m²', 1e-9), n: choice([1, 'a single large sheet'], [2, 'the region between two large plates with +σ and −σ']) },
    derive: ($) => ({ E: ($.n * $.sig) / (2 * EPS0) }),
    text: (T) => `Surface charge density σ = ${T.sig} nC/m². Find |E| for ${T.n}.`,
    parts: [num('E', ($) => $.E, 'N/C'), mc('dep', [[1, 'Falls off as 1/r'], [2, 'Falls off as 1/r²'], [3, 'Does not depend on distance']], 3, { label: 'How does it depend on distance from the plane?' })],
    hints: ['With a pillbox, both caps carry flux for a single sheet.'],
    steps: ($, f) => [
      String.raw`One sheet gives $E = \dfrac{\sigma}{2\varepsilon_0}$; between the plates the two fields add to $E = \dfrac{\sigma}{\varepsilon_0}$.`,
      String.raw`$E = ${texNum($.E)}\ \text{N/C}$, independent of the distance`,
    ],
    sim: { scenario: 'sheet-pill' },
    cases: [kase('hand', { sig: 10, n: 2 }, { E: 1130, dep: 3 })],
  }),

  // ================================================================= 37
  problem({
    ...C37, id: 'e2.37.where-charge-goes', lab: 'conductors', src: 'Practice 37 #1', title: 'Where excess charge goes', kind: 'conceptual', topics: ['conductors'],
    text: () => 'A +4 μC charge is placed on a solid conducting sphere. What happens to that charge?',
    parts: [mc('ans', [[1, 'It stays where it was placed'], [2, 'It spreads through the volume'], [3, 'It moves to the surface and spreads out uniformly'], [4, 'It depends on the sign']], 3)],
    steps: () => [String.raw`Like charges repel until $\vec{E} = 0$ inside the metal, so all the excess charge ends up on the surface — uniformly, for a sphere.`],
    sim: { scenario: 'uniform', setup: (s) => void (s.Q = 4e-6) },
    cases: [kase('#1', {}, { ans: 3 }, { key: 'C' })],
  }),
  problem({
    ...C37, id: 'e2.37.field-inside', lab: 'conductors', src: 'Practice 37 #2, #6', title: 'Field inside a conductor', kind: 'conceptual', topics: ['conductors'],
    vars: { sit: choice([1, 'a solid conducting sphere carrying +4 μC'], [2, 'a solid aluminum cube in an upward external field']) },
    text: (T) => `In electrostatic equilibrium, what is the electric field inside the material of ${T.sit}?`,
    parts: [mc('ans', [[1, 'The same as outside'], [2, 'Pointing outward'], [3, 'Pointing inward'], [4, 'Zero'], [5, 'Smaller than outside, but not zero']], 4)],
    steps: () => [String.raw`Free charges rearrange until the field inside the conductor is exactly zero, $\vec{E} = 0$.`],
    sim: {
      scenario: 'uniform',
      setup(s) {
        s.probe = { x: 0.1, y: 0.05, z: 0 };
      },
      read: (c) => ({ '@E inside the metal': [c.cond.mag, 0] }),
    },
    cases: [kase('#2', { sit: 1 }, { ans: 4 }, { key: 'D' }), kase('#6', { sit: 2 }, { ans: 4 }, { key: 'B' })],
  }),
  problem({
    ...C37, id: 'e2.37.empty-cavity', lab: 'conductors', src: 'Practice 37 #3', title: 'Field in an empty cavity', kind: 'conceptual', topics: ['conductors', 'gauss'],
    text: () => 'A +4 μC charge is placed on a hollow conducting sphere with nothing inside. What is the field inside the empty cavity?',
    parts: [mc('ans', [[1, 'Set by the net charge'], [2, 'Pointing outward'], [3, 'Pointing inward'], [4, 'Zero']], 4)],
    steps: () => [String.raw`There is no charge in the cavity and all the excess sits on the outer surface, so $\vec{E} = 0$ in the cavity.`],
    cases: [kase('#3', {}, { ans: 4 }, { key: 'D' })],
  }),
  problem({
    ...C37, id: 'e2.37.surface-field', lab: 'conductors', src: 'Practice 37 #4', title: 'Field direction at a conductor surface', kind: 'conceptual', topics: ['conductors', 'field-lines'],
    text: () => 'Field lines leaving the surface of a conductor in equilibrium are:',
    parts: [mc('ans', [[1, 'Always perpendicular to the surface'], [2, 'Always parallel to the surface'], [3, 'Along the surface'], [4, 'At random angles']], 1)],
    steps: () => [String.raw`Any component along the surface would push charges around, so in equilibrium $\vec{E}$ is perpendicular to the surface.`],
    sim: { scenario: 'neutral' },
    cases: [kase('#4', {}, { ans: 1 }, { key: 'A' })],
  }),
  problem({
    ...C37, id: 'e2.37.cube-induced', lab: 'conductors', src: 'Practice 37 #5', title: 'Induced charge on a conductor in a field', kind: 'conceptual', topics: ['conductors', 'induction'],
    vars: { Ed: UPDOWN, face: choice([1, 'top'], [-1, 'bottom']) },
    text: (T) => `A neutral aluminum cube rests on a wooden table in a uniform external field directed ${T.Ed}. What is the charge on its ${T.face} face?`,
    parts: [mc('ans', [[1, 'Positive'], [-1, 'Negative'], [0, 'Neutral'], [2, 'Cannot tell']], ($) => $.Ed * $.face)],
    steps: () => [String.raw`Electrons move opposite to $\vec{E}$: the face that $\vec{E}$ points toward is left positive, and the opposite face becomes negative.`],
    cases: [kase('#5', { Ed: 1, face: 1 }, { ans: 1 }, { key: 'A' })],
  }),
  problem({
    ...C37, id: 'e2.37.nested', lab: 'conductors', src: 'Practice 37 #7–8 (generalized)', title: 'Charges induced on a surrounding shell', kind: 'numeric', level: 2, topics: ['conductors', 'gauss'],
    vars: { q: range(1, 10, 1, 'μC', 1e-6), s: SIGN, Q: range(-10, 10, 1, 'μC', 1e-6) },
    text: (T) => `A small sphere with ${T.q} μC (${T.s}) sits inside a conducting shell without touching it. The shell's own net charge is ${T.Q} μC. After equilibrium, what charge is on the shell's inner surface, and on its outer surface?`,
    parts: [num('inner', ($) => -$.s * $.q, 'μC', { scale: 1e-6, abs: 0.01, label: 'Inner surface' }), num('outer', ($) => $.s * $.q + $.Q, 'μC', { scale: 1e-6, abs: 0.01, label: 'Outer surface' })],
    steps: () => [
      String.raw`$\vec{E} = 0$ in the metal, so the inner surface carries $-q$.`,
      String.raw`Charge conservation then gives the outer surface $Q_{\text{shell}} + q$.`,
    ],
    sim: {
      scenario: 'cage',
      setup(s, $) {
        s.q = $.s * $.q;
      },
    },
    cases: [kase('#7–8', { q: 4, s: 1, Q: 0 }, { inner: -4, outer: 4 }, { key: '#7 B (+q outside), #8 A (−q inside)' })],
  }),
  problem({
    ...C37, id: 'e2.37.lightning-cloud', lab: 'conductors', src: 'Practice 37 #9', title: 'Charge on a thundercloud', kind: 'conceptual', topics: ['conductors', 'applications'],
    text: () => 'What kind of charge does a cloud have when lightning strikes the ground?',
    parts: [mc('ans', [[1, 'Positive'], [2, 'Negative'], [3, 'Either sign'], [4, 'No net charge']], 3)],
    steps: () => ['A strike is a discharge between regions at very different potentials. Cloud-to-ground strikes can carry either sign of charge.'],
    cases: [kase('#9', {}, { ans: 3 }, { key: 'C' })],
  }),
  problem({
    ...C37, id: 'e2.37.lightning-car', lab: 'conductors', src: 'Practice 37 #10', title: 'Inside a car struck by lightning', kind: 'conceptual', topics: ['conductors', 'applications'],
    text: () => 'When a car is struck by lightning, the electric field inside the car is:',
    parts: [mc('ans', [[1, 'Zero'], [2, 'Huge, and it lasts longer than the strike'], [3, 'Small but not zero'], [4, 'Huge but brief']], 1)],
    steps: () => [String.raw`The metal body is a closed conductor. Charge stays on its outer surface, so it shields the inside like a Faraday cage and $\vec{E}$ inside is ideally zero.`],
    sim: { scenario: 'cage' },
    cases: [kase('#10', {}, { ans: 1 }, { key: 'A' })],
  }),
];
