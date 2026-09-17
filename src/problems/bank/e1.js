/** Exam 1 · Ch V (vectors), 34 (charge), 35 (Coulomb force). */
import { problem, kase, range, choice, SIGN, num, mc, K, QE, ME, MP, G, DEG, DIR_X, charge, layout, angleDeg, texNum } from '../kit.js';

const E1 = { exam: 'e1' };

export default [
  // ------------------------------------------------------------------ Ch V
  problem({
    ...E1, id: 'e1.v.mag-dir', ch: 'V', lab: 'vectors', title: 'Magnitude and direction from components', kind: 'numeric', topics: ['vectors'],
    vars: { ax: range(-9, 9, 1, '', 1, { exclude: [0] }), ay: range(-9, 9, 1, '', 1, { exclude: [0] }) },
    derive: ($) => ({ A: Math.hypot($.ax, $.ay), th: angleDeg($.ax, $.ay) }),
    text: (T) => `A vector is a = ${T.ax} x̂ + ${T.ay} ŷ. Find its magnitude and its direction, measured counterclockwise from the +x axis.`,
    parts: [num('A', ($) => $.A, '', { label: '|a|' }), num('th', ($) => $.th, '°', { label: 'θ from +x', abs: 0.6, tol: 0.005, wrap: 360 })],
    hints: [String.raw`$|\vec{a}| = \sqrt{a_x^2 + a_y^2}$`, String.raw`$\tan^{-1}(a_y/a_x)$ only gives the right angle in quadrants I and IV. Check which quadrant the vector is in.`],
    steps: ($, f) => [
      String.raw`$|\vec{a}| = \sqrt{(${texNum($.ax)})^2 + (${texNum($.ay)})^2} = ${texNum($.A)}$`,
      String.raw`$\theta$ = ${f($.th)}° (the quadrant comes from the signs of the components)`,
    ],
    sim: {
      scenario: 'axes',
      setup(s, $) {
        const k = 1.2 / Math.max(Math.abs($.ax), Math.abs($.ay));
        s.a = { x: $.ax * k, y: $.ay * k, z: 0 };
        s.b = { x: 1, y: 0, z: 0 };
        s._k = k;
        return `Drawn at ×${k.toFixed(2)} scale.`;
      },
      read: (c, s) => ({ A: c.vec.ma / s._k }),
    },
    cases: [kase('3-4-5', { ax: 3, ay: 4 }, { A: 5, th: 53.13 }), kase('quadrant II', { ax: -3, ay: 4 }, { A: 5, th: 126.87 })],
  }),
  problem({
    ...E1, id: 'e1.v.components', ch: 'V', lab: 'vectors', title: 'Components from magnitude and angle', kind: 'numeric', topics: ['vectors'],
    vars: { A: range(1, 50, 1), th: range(0, 355, 5, '°') },
    derive: ($) => ({ ax: $.A * Math.cos($.th * DEG), ay: $.A * Math.sin($.th * DEG) }),
    text: (T) => `A vector has magnitude ${T.A} and points ${T.th}° counterclockwise from +x. Find its x and y components.`,
    parts: [num('ax', ($) => $.ax, '', { label: 'aₓ', abs: 0.02 }), num('ay', ($) => $.ay, '', { label: String.raw`$a_y$`, abs: 0.02 })],
    steps: ($, f) => [
      String.raw`$a_x = A\cos\theta = ${texNum($.ax)}$`,
      String.raw`$a_y = A\sin\theta = ${texNum($.ay)}$`,
    ],
    sim: {
      scenario: 'axes',
      setup(s, $) {
        s.a = { x: 1.2 * Math.cos($.th * DEG), y: 1.2 * Math.sin($.th * DEG), z: 0 };
        s.b = { x: 1, y: 0, z: 0 };
      },
    },
    cases: [kase('hand', { A: 10, th: 30 }, { ax: 8.66, ay: 5 })],
  }),
  problem({
    ...E1, id: 'e1.v.dot', ch: 'V', lab: 'vectors', title: 'Dot product and the angle between two vectors', kind: 'numeric', level: 2, topics: ['vectors', 'dot-product'],
    vars: {
      ax: range(-6, 6, 1, '', 1, { exclude: [0] }), ay: range(-6, 6, 1),
      bx: range(-6, 6, 1), by: range(-6, 6, 1, '', 1, { exclude: [0] }),
    },
    derive: ($) => {
      const dot = $.ax * $.bx + $.ay * $.by;
      const phi = (Math.acos(dot / (Math.hypot($.ax, $.ay) * Math.hypot($.bx, $.by))) * 180) / Math.PI;
      return { dot, phi };
    },
    text: (T) => `a = ${T.ax} x̂ + ${T.ay} ŷ and b = ${T.bx} x̂ + ${T.by} ŷ. Find a·b and the angle φ between the vectors.`,
    parts: [num('dot', ($) => $.dot, '', { label: 'a·b', abs: 0.01 }), num('phi', ($) => $.phi, '°', { label: 'φ', abs: 0.6, tol: 0.005 })],
    hints: [String.raw`$\vec{a}\cdot\vec{b} = a_xb_x + a_yb_y = |\vec{a}||\vec{b}|\cos\varphi$`],
    steps: ($, f) => [
      String.raw`$\vec{a}\cdot\vec{b} = ${texNum($.dot)}$`,
      String.raw`$\cos\varphi = \dfrac{\vec{a}\cdot\vec{b}}{|\vec{a}||\vec{b}|} \;\Longrightarrow\; \varphi = ${texNum($.phi)}^\circ$`,
    ],
    sim: {
      scenario: 'axes',
      setup(s, $) {
        const k = 1.2 / Math.max(Math.abs($.ax), Math.abs($.ay), Math.abs($.bx), Math.abs($.by));
        s.a = { x: $.ax * k, y: $.ay * k, z: 0 };
        s.b = { x: $.bx * k, y: $.by * k, z: 0 };
        s._k = k;
        return `Drawn at ×${k.toFixed(2)} scale.`;
      },
      read: (c, s) => ({ dot: c.vec.adb / s._k ** 2, phi: (c.vec.phi * 180) / Math.PI }),
    },
    cases: [kase('perpendicular', { ax: 2, ay: 1, bx: -1, by: 2 }, { dot: 0, phi: 90 }), kase('hand', { ax: 3, ay: 4, bx: 4, by: 3 }, { dot: 24, phi: 16.26 })],
  }),
  problem({
    ...E1, id: 'e1.v.add', ch: 'V', lab: 'vectors', title: 'Adding two vectors given magnitudes and angles', kind: 'numeric', level: 2, topics: ['vectors'],
    vars: { A: range(2, 40, 1), a: range(0, 350, 10, '°'), B: range(2, 40, 1), b: range(0, 350, 10, '°') },
    derive: ($) => {
      const Rx = $.A * Math.cos($.a * DEG) + $.B * Math.cos($.b * DEG);
      const Ry = $.A * Math.sin($.a * DEG) + $.B * Math.sin($.b * DEG);
      return { Rx, Ry, R: Math.hypot(Rx, Ry), th: angleDeg(Rx, Ry) };
    },
    valid: ($) => $.R > 0.5,
    text: (T) => `Vector A has magnitude ${T.A} at ${T.a}°; vector B has magnitude ${T.B} at ${T.b}° (angles counterclockwise from +x). Find the magnitude and direction of R = A + B.`,
    parts: [num('R', ($) => $.R, '', { label: '|R|' }), num('th', ($) => $.th, '°', { label: String.raw`$\theta_R$`, abs: 0.6, tol: 0.005, wrap: 360 })],
    hints: ['Add components, not magnitudes.'],
    steps: ($, f) => [
      String.raw`$R_x = ${texNum($.Rx)}$, $R_y = ${texNum($.Ry)}$`,
      String.raw`$|\vec{R}| = ${texNum($.R)}$ at ${f($.th)}°`,
    ],
    sim: null,
    cases: [kase('hand', { A: 10, a: 0, B: 10, b: 90 }, { R: 14.14, th: 45 })],
  }),
  problem({
    ...E1, id: 'e1.v.cross', ch: 'V', lab: 'vectors', title: 'Cross product direction and size', kind: 'numeric', level: 2, topics: ['vectors', 'cross-product'],
    vars: { ax: range(-5, 5, 1), ay: range(-5, 5, 1), bx: range(-5, 5, 1), by: range(-5, 5, 1) },
    derive: ($) => ({ cz: $.ax * $.by - $.ay * $.bx }),
    valid: ($) => $.cz !== 0,
    text: (T) => `a = ${T.ax} x̂ + ${T.ay} ŷ and b = ${T.bx} x̂ + ${T.by} ŷ. Find a × b (its z component) and its direction.`,
    parts: [num('cz', ($) => Math.abs($.cz), '', { label: '|a × b|' }), mc('dir', [[1, '+ẑ (out of the page)'], [-1, '−ẑ (into the page)']], ($) => Math.sign($.cz), { label: 'Direction' })],
    hints: [String.raw`$(\vec{a}\times\vec{b})_z = a_xb_y - a_yb_x$`, String.raw`Right-hand rule: $\hat{x}\times\hat{y} = +\hat{z}$`],
    steps: ($, f) => [
      String.raw`$(\vec{a}\times\vec{b})_z = (${texNum($.ax)})(${texNum($.by)}) - (${texNum($.ay)})(${texNum($.bx)}) = ${texNum($.cz)}$`,
    ],
    cases: [kase('x̂ × ŷ', { ax: 1, ay: 0, bx: 0, by: 1 }, { cz: 1, dir: 1 })],
  }),
  problem({
    ...E1, id: 'e1.v.dot-sign', ch: 'V', lab: 'vectors', title: 'What the sign of a·b tells you', kind: 'conceptual', topics: ['vectors', 'dot-product'],
    vars: { phi: range(10, 170, 10, '°', 1, { exclude: [90] }) },
    text: (T) => `Two nonzero vectors are ${T.phi}° apart. What is the sign of a·b?`,
    parts: [mc('sign', [[1, 'Positive'], [-1, 'Negative'], [0, 'Zero']], ($) => Math.sign(Math.cos($.phi * DEG)))],
    steps: () => [String.raw`$\vec{a}\cdot\vec{b} = |\vec{a}||\vec{b}|\cos\varphi$: positive for $\varphi < 90^\circ$, zero at $90^\circ$, negative for $\varphi > 90^\circ$.`],
    sim: {
      scenario: 'axes',
      setup(s, $) {
        s.a = { x: 1, y: 0, z: 0 };
        s.b = { x: Math.cos($.phi * DEG), y: Math.sin($.phi * DEG), z: 0 };
      },
      read: (c) => ({ sign: Math.sign(Math.round(c.vec.adb * 1e9)) }),
    },
    cases: [kase('obtuse', { phi: 120 }, { sign: -1 })],
  }),

  // ------------------------------------------------------------------ Ch 34
  problem({
    ...E1, id: 'e1.34.electron-count', ch: '34', lab: 'force', title: 'Counting electrons', kind: 'numeric', topics: ['charge', 'quantization'],
    vars: { q: range(0.5, 50, 0.5, 'μC', 1e-6), s: SIGN },
    derive: ($) => ({ N: $.q / QE }),
    text: (T) => `An object has a net ${T.s} charge of ${T.q} μC. How many electrons were transferred to produce this charge, and were they added or removed?`,
    parts: [num('N', ($) => $.N, 'electrons'), mc('which', [[1, 'Electrons were removed'], [-1, 'Electrons were added']], ($) => $.s, { label: 'Gained or lost?' })],
    steps: ($, f) => [
      String.raw`$N = \dfrac{|q|}{e} = \dfrac{${texNum($.q)}}{1.6\times 10^{-19}} = ${texNum($.N)}$`,
      'A positive object lost electrons; a negative object gained them.',
    ],
    cases: [kase('hand', { q: 8, s: -1 }, { N: 5e13, which: -1 })],
  }),
  problem({
    ...E1, id: 'e1.34.touching-spheres', ch: '34', lab: 'force', title: 'Identical conducting spheres share charge', kind: 'numeric', topics: ['charge', 'conservation'],
    vars: { q1: range(-12, 12, 1, 'μC', 1e-6), q2: range(-12, 12, 1, 'μC', 1e-6), q3: range(-12, 12, 1, 'μC', 1e-6) },
    derive: ($) => {
      const a12 = ($.q1 + $.q2) / 2;
      const final3 = (a12 + $.q3) / 2;
      return { a12, final3 };
    },
    text: (T) => `Three identical conducting spheres carry ${T.q1} μC, ${T.q2} μC and ${T.q3} μC. Sphere 1 touches sphere 2 and they are separated. Then sphere 2 touches sphere 3. What is the final charge on sphere 1 and on sphere 3?`,
    parts: [num('s1', ($) => $.a12, 'μC', { scale: 1e-6, abs: 0.01, label: 'Sphere 1' }), num('s3', ($) => $.final3, 'μC', { scale: 1e-6, abs: 0.01, label: 'Sphere 3' })],
    hints: ['Identical conductors split their combined charge equally.'],
    steps: ($, f) => [
      String.raw`After 1–2: each has $\dfrac{q_1 + q_2}{2} = ${texNum($.a12 * 1e6)}\ \mu\text{C}$`,
      String.raw`After 2–3: each has $\dfrac{${texNum($.a12 * 1e6)} + q_3}{2} = ${texNum($.final3 * 1e6)}\ \mu\text{C}$`,
    ],
    cases: [kase('hand', { q1: 6, q2: -2, q3: 4 }, { s1: 2, s3: 3 })],
  }),
  problem({
    ...E1, id: 'e1.34.induction', ch: '34', lab: 'force', title: 'Charging by induction', kind: 'conceptual', topics: ['charge', 'induction'],
    vars: { rod: SIGN },
    text: (T) => `A ${T.rod} rod is brought near (not touching) a neutral metal sphere. While the rod is held there, the sphere is briefly grounded; then the ground is removed, and then the rod is taken away. What is the final charge on the sphere?`,
    parts: [mc('sign', [[1, 'Positive'], [-1, 'Negative'], [0, 'Neutral']], ($) => -$.rod)],
    steps: () => ['The rod pulls opposite charge up from ground (or pushes like charge down to it). With the ground removed first, the sphere keeps the charge opposite to the rod.'],
    cases: [kase('positive rod', { rod: 1 }, { sign: -1 })],
  }),
  problem({
    ...E1, id: 'e1.34.polarization', ch: '34', lab: 'force', title: 'Charged rod and neutral paper', kind: 'conceptual', topics: ['charge', 'polarization'],
    vars: { rod: SIGN },
    text: (T) => `A ${T.rod}ly charged comb is held near small neutral bits of paper. What happens?`,
    parts: [mc('ans', [[1, 'The paper is attracted'], [2, 'The paper is repelled'], [3, 'Nothing, because the paper is neutral'], [4, 'Attracted only if the comb is negative']], 1)],
    steps: () => [String.raw`The paper polarizes: charge opposite to the comb shifts to the near side, so the attraction beats the repulsion (the force goes as $1/r^2$). This happens for either sign.`],
    cases: [kase('negative comb', { rod: -1 }, { ans: 1 })],
  }),

  // ------------------------------------------------------------------ Ch 35
  problem({
    ...E1, id: 'e1.35.coulomb-pair', ch: '35', lab: 'force', title: 'Force between two point charges', kind: 'numeric', topics: ['coulomb'],
    vars: { q1: range(1, 10, 0.5, 'μC', 1e-6), s1: SIGN, q2: range(1, 10, 0.5, 'μC', 1e-6), s2: SIGN, r: range(2, 80, 1, 'cm', 1e-2) },
    derive: ($) => ({ F: (K * $.q1 * $.q2) / $.r ** 2 }),
    text: (T) => `A ${T.s1} ${T.q1} μC charge and a ${T.s2} ${T.q2} μC charge are ${T.r} cm apart. Find the magnitude of the force between them. Is it attractive or repulsive?`,
    parts: [num('F', ($) => $.F, 'N'), mc('type', [[1, 'Repulsive'], [-1, 'Attractive']], ($) => $.s1 * $.s2, { label: 'Type' })],
    steps: ($, f) => [
      String.raw`$F = \dfrac{k|q_1q_2|}{r^2} = ${texNum($.F)}\ \text{N}$`,
      'Like signs repel; opposite signs attract.',
    ],
    sim: {
      scenario: 'pair-repel',
      setup(s, $) {
        return layout(s, { charges: [charge($.s1 * $.q1, -$.r / 2, 0), charge($.s2 * $.q2, $.r / 2, 0)], select: 1 });
      },
      read: (c) => ({ F: Math.hypot(c.selectedForce.x, c.selectedForce.y), type: Math.sign(c.selectedForce.x) }),
    },
    cases: [kase('hand', { q1: 2, s1: 1, q2: 3, s2: -1, r: 30 }, { F: 0.599, type: -1 })],
  }),
  problem({
    ...E1, id: 'e1.35.distance', ch: '35', lab: 'force', title: 'Separation for a given force', kind: 'numeric', topics: ['coulomb'],
    vars: { q1: range(1, 10, 0.5, 'μC', 1e-6), q2: range(1, 10, 0.5, 'μC', 1e-6), F: range(0.1, 20, 0.1, 'N') },
    derive: ($) => ({ r: Math.sqrt((K * $.q1 * $.q2) / $.F) }),
    text: (T) => `How far apart must a ${T.q1} μC charge and a ${T.q2} μC charge be for the force between them to be ${T.F} N?`,
    parts: [num('r', ($) => $.r, 'm')],
    steps: ($, f) => [String.raw`$r = \sqrt{\dfrac{k q_1 q_2}{F}} = ${texNum($.r)}\ \text{m}$`],
    cases: [kase('hand', { q1: 4, q2: 5, F: 2 }, { r: 0.3 })],
  }),
  problem({
    ...E1, id: 'e1.35.three-inline', ch: '35', lab: 'force', title: 'Net force on the middle charge of three', kind: 'numeric', level: 2, topics: ['coulomb', 'superposition'],
    vars: {
      q1: range(1, 10, 1, 'μC', 1e-6), s1: SIGN, q2: range(1, 10, 1, 'μC', 1e-6), s2: SIGN,
      q3: range(1, 10, 1, 'μC', 1e-6), s3: SIGN, d1: range(5, 50, 1, 'cm', 1e-2), d2: range(5, 50, 1, 'cm', 1e-2),
    },
    derive: ($) => {
      const Q1 = $.s1 * $.q1;
      const Q2 = $.s2 * $.q2;
      const Q3 = $.s3 * $.q3;
      const F1 = (K * Q1 * Q2) / $.d1 ** 2; // + means pushed toward +x (away from q1)
      const F3 = (-K * Q3 * Q2) / $.d2 ** 2;
      return { Q1, Q2, Q3, F1, F3, Fx: F1 + F3 };
    },
    valid: ($) => Math.abs($.Fx) > 1e-3 * (Math.abs($.F1) + Math.abs($.F3)),
    text: (T) => `On the x-axis: q₁ = ${T.q1} μC (${T.s1}) at x = 0, q₂ = ${T.q2} μC (${T.s2}) at x = ${T.d1} cm, and q₃ = ${T.q3} μC (${T.s3}) at ${T.d2} cm to the right of q₂. Find the net force on q₂.`,
    parts: [num('F', ($) => Math.abs($.Fx), 'N', { label: '|F on q₂|' }), mc('dir', DIR_X.slice(0, 2), ($) => Math.sign($.Fx), { label: 'Direction' })],
    hints: [String.raw`Find each force separately with its direction, then add them as signed $x$ components.`],
    steps: ($, f) => [
      String.raw`From $q_1$: ${f($.F1)} N`,
      String.raw`From $q_3$: ${f($.F3)} N`,
      String.raw`Net: $F_x$ = ${f($.Fx)} N`,
    ],
    sim: {
      scenario: 'three',
      setup(s, $) {
        return layout(s, { charges: [charge($.Q1, 0, 0), charge($.Q2, $.d1, 0), charge($.Q3, $.d1 + $.d2, 0)], select: 1 });
      },
      read: (c) => ({ F: Math.abs(c.selectedForce.x), dir: Math.sign(c.selectedForce.x) }),
    },
    cases: [kase('hand', { q1: 2, s1: 1, q2: 1, s2: -1, q3: 3, s3: 1, d1: 20, d2: 30 }, { F: 0.1498, dir: -1 })],
  }),
  problem({
    ...E1, id: 'e1.35.equilibrium-point', ch: '35', lab: 'force', title: 'Where a third charge feels no force', kind: 'numeric', level: 2, topics: ['coulomb', 'equilibrium'],
    vars: { q1: range(1, 20, 1, 'μC', 1e-6), q2: range(1, 20, 1, 'μC', 1e-6), d: range(0.1, 2, 0.05, 'm') },
    derive: ($) => ({ x: $.d / (1 + Math.sqrt($.q2 / $.q1)) }),
    text: (T) => `Two positive charges, ${T.q1} μC at x = 0 and ${T.q2} μC at x = ${T.d} m, are fixed. Where between them can a third charge sit with zero net force?`,
    parts: [num('x', ($) => $.x, 'm', { label: 'x' })],
    hints: [String.raw`$\dfrac{kq_1q}{x^2} = \dfrac{kq_2q}{(d-x)^2}$ — the third charge cancels out.`],
    steps: ($, f) => [
      String.raw`$\dfrac{x}{d-x} = \sqrt{\dfrac{q_1}{q_2}} \;\Longrightarrow\; x = \dfrac{d}{1+\sqrt{q_2/q_1}} = ${texNum($.x)}\ \text{m}$`,
    ],
    sim: {
      scenario: 'three',
      setup(s, $) {
        return layout(s, { charges: [charge($.q1, 0, 0), charge(1e-6, $.x, 0), charge($.q2, $.d, 0)], select: 1 });
      },
      read: (c, s, $) => ({ '@net force on the test charge ≈ 0': [Math.hypot(c.selectedForce.x, c.selectedForce.y) / (K * $.q1 * 1e-6 / $.x ** 2), 0] }),
    },
    cases: [kase('hand', { q1: 4, q2: 1, d: 0.9 }, { x: 0.6 })],
  }),
  problem({
    ...E1, id: 'e1.35.right-triangle', ch: '35', lab: 'force', title: 'Net force from two charges at right angles', kind: 'numeric', level: 2, topics: ['coulomb', 'superposition', 'vectors'],
    vars: { q: range(1, 10, 0.5, 'μC', 1e-6), qa: range(1, 10, 0.5, 'μC', 1e-6), sa: SIGN, qb: range(1, 10, 0.5, 'μC', 1e-6), sb: SIGN, a: range(5, 50, 1, 'cm', 1e-2), b: range(5, 50, 1, 'cm', 1e-2) },
    derive: ($) => {
      const Fx = (K * $.q * $.sa * $.qa) / $.a ** 2; // qa at (−a, 0): like signs push +x
      const Fy = (K * $.q * $.sb * $.qb) / $.b ** 2; // qb at (0, −b)
      return { Fx, Fy, F: Math.hypot(Fx, Fy), th: angleDeg(Fx, Fy) };
    },
    text: (T) => `A +${T.q} μC charge sits at the origin. A ${T.sa} ${T.qa} μC charge is at (−${T.a} cm, 0) and a ${T.sb} ${T.qb} μC charge is at (0, −${T.b} cm). Find the net force on the charge at the origin.`,
    parts: [num('F', ($) => $.F, 'N', { label: '|F|' }), num('th', ($) => $.th, '°', { label: 'Direction from +x', abs: 0.6, tol: 0.005, wrap: 360 })],
    steps: ($, f) => [
      String.raw`$F_x$ = ${f($.Fx)} N, $F_y$ = ${f($.Fy)} N`,
      String.raw`$|\vec{F}|$ = ${f($.F)} N at ${f($.th)}°`,
    ],
    sim: {
      scenario: 'three',
      setup(s, $) {
        return layout(s, { charges: [charge($.sa * $.qa, -$.a, 0), charge($.q, 0, 0), charge($.sb * $.qb, 0, -$.b)], select: 1 });
      },
      read: (c) => ({ F: Math.hypot(c.selectedForce.x, c.selectedForce.y), th: angleDeg(c.selectedForce.x, c.selectedForce.y) }),
    },
    cases: [kase('hand', { q: 2, qa: 3, sa: 1, qb: 3, sb: 1, a: 30, b: 30 }, { F: 0.8476, th: 45 })],
  }),
  problem({
    ...E1, id: 'e1.35.hydrogen', ch: '35', lab: 'force', title: 'Electric vs gravitational force in hydrogen', kind: 'numeric', topics: ['coulomb', 'gravity'],
    vars: { r: range(0.3, 3, 0.01, '×10⁻¹⁰ m', 1e-10) },
    derive: ($) => {
      const Fe = (K * QE * QE) / $.r ** 2;
      const Fg = (6.67e-11 * ME * MP) / $.r ** 2;
      return { Fe, Fg, ratio: Fe / Fg };
    },
    text: (T) => `An electron and a proton are ${T.r} × 10⁻¹⁰ m apart. Find the electric force between them and the ratio $F_E/F_G$ (G = 6.67×10⁻¹¹ N·m²/kg²).`,
    parts: [num('Fe', ($) => $.Fe, 'N', { label: String.raw`$F_E$` }), num('ratio', ($) => $.ratio, '', { label: String.raw`$F_E / F_G$` })],
    steps: ($, f) => [
      String.raw`$F_E = \dfrac{ke^2}{r^2} = ${texNum($.Fe)}\ \text{N}$`,
      String.raw`$F_G = \dfrac{G m_e m_p}{r^2} = ${texNum($.Fg)}\ \text{N}$`,
      String.raw`$\dfrac{F_E}{F_G} = ${texNum($.ratio)}$ — the $1/r^2$ cancels, so the ratio does not depend on $r$.`,
    ],
    cases: [kase('Bohr radius', { r: 0.529 }, { Fe: 8.23e-8, ratio: 2.27e39 })],
  }),
  problem({
    ...E1, id: 'e1.35.hanging-spheres', ch: '35', lab: 'force', title: 'Two charged spheres hanging from threads', kind: 'numeric', level: 3, topics: ['coulomb', 'equilibrium'],
    vars: { m: range(0.5, 10, 0.5, 'g', 1e-3), L: range(0.1, 1, 0.05, 'm'), th: range(3, 30, 1, '°') },
    derive: ($) => {
      const r = 2 * $.L * Math.sin($.th * DEG);
      const F = $.m * G * Math.tan($.th * DEG);
      return { r, F, q: r * Math.sqrt(F / K) };
    },
    text: (T) => `Two identical ${T.m} g spheres hang from a common point on ${T.L} m threads. They carry equal charges and each thread makes ${T.th}° with the vertical. Find the charge on each sphere.`,
    parts: [num('q', ($) => $.q, 'C', { label: '|q|' })],
    hints: [
      String.raw`For each sphere $T\cos\theta = mg$ and $T\sin\theta = F_E$, so $F_E = mg\tan\theta$.`,
      String.raw`The separation is $r = 2L\sin\theta$.`,
    ],
    steps: ($, f) => [
      String.raw`$F_E = mg\tan\theta = ${texNum($.F)}\ \text{N}$`,
      String.raw`$r = 2L\sin\theta = ${texNum($.r)}\ \text{m}$`,
      String.raw`$q = r\sqrt{F_E/k} = ${texNum($.q)}\ \text{C}$`,
    ],
    cases: [kase('hand', { m: 3, L: 0.15, th: 5 }, { q: 1.40e-8 })],
  }),
  problem({
    ...E1, id: 'e1.35.scaling', ch: '35', lab: 'force', title: 'How the force scales', kind: 'numeric', topics: ['coulomb', 'proportional-reasoning'],
    vars: { a: choice([0.5, 'halved'], [1, 'unchanged'], [2, 'doubled'], [3, 'tripled']), b: choice([1, 'unchanged'], [2, 'doubled'], [4, 'quadrupled']), c: choice([0.5, 'halved'], [2, 'doubled'], [3, 'tripled']) },
    derive: ($) => ({ factor: ($.a * $.b) / $.c ** 2 }),
    text: (T) => `Two point charges exert a force F on each other. One charge is ${T.a}, the other is ${T.b}, and the distance between them is ${T.c}. The new force is what multiple of F?`,
    parts: [num('factor', ($) => $.factor, '× F', { tol: 0.001 })],
    steps: ($, f) => [
      String.raw`$F \propto \dfrac{q_1q_2}{r^2} \;\Longrightarrow\; \dfrac{(${texNum($.a)})(${texNum($.b)})}{(${texNum($.c)})^2} = ${texNum($.factor)}$`,
    ],
    cases: [kase('hand', { a: 2, b: 1, c: 2 }, { factor: 0.5 })],
  }),
];
