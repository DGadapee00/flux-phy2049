/** Exam 4 · Ch 43–44 (DC circuits, Kirchhoff, RC), 45 (magnetism), 46 (magnetic force), 47 (B from currents). */
import { problem, kase, range, choice, SIGN, UPDOWN, num, mc, MU0, QE, ME, MP, DEG, AXES6, axisCode , texNum } from '../kit.js';

const E4 = { exam: 'e4' };
const PART = choice(['proton', 'a proton'], ['electron', 'an electron']);
const pq = (p) => (p === 'proton' ? QE : -QE);
const pm = (p) => (p === 'proton' ? MP : ME);
const vals = (s, o) => {
  s.values = { ...o };
};

export default [
  // ================================================================= 43
  problem({
    ...E4, id: 'e4.43.series', ch: '43', lab: 'circuits', title: 'Three resistors in series', kind: 'numeric', topics: ['circuits', 'series'],
    vars: { E: range(3, 24, 1, 'V'), R1: range(1, 20, 1, 'Ω'), R2: range(1, 20, 1, 'Ω'), R3: range(1, 20, 1, 'Ω') },
    derive: ($) => {
      const Req = $.R1 + $.R2 + $.R3;
      const I = $.E / Req;
      return { Req, I, V2: I * $.R2, P: $.E * I };
    },
    text: (T) => `A ${T.E} V battery drives R₁ = ${T.R1} Ω, R₂ = ${T.R2} Ω and R₃ = ${T.R3} Ω in series. Find $R_{\\text{eq}}$, the current, the voltage across R₂, and the power delivered by the battery.`,
    parts: [num('Req', ($) => $.Req, 'Ω'), num('I', ($) => $.I, 'A'), num('V2', ($) => $.V2, 'V'), num('P', ($) => $.P, 'W')],
    steps: ($, f) => [
      String.raw`$R_{\text{eq}} = ${texNum($.Req)}\ \Omega$`,
      String.raw`$I = \dfrac{\varepsilon}{R_{\text{eq}}} = ${texNum($.I)}\ \text{A}$ — the same through every resistor`,
      String.raw`$V_2 = IR_2 = ${texNum($.V2)}\ \text{V}$`,
      String.raw`$P = \varepsilon I = ${texNum($.P)}\ \text{W}$`,
    ],
    sim: {
      scenario: 'series',
      setup: (s, $) => vals(s, { E1: $.E, R1: $.R1, R2: $.R2, R3: $.R3 }),
      read: (c) => ({ I: c.circ.sol.I.R1, V2: c.circ.sol.V.tm - c.circ.sol.V.tr }),
    },
    cases: [kase('lab default', { E: 12, R1: 2, R2: 4, R3: 6 }, { Req: 12, I: 1, V2: 4, P: 12 })],
  }),
  problem({
    ...E4, id: 'e4.43.parallel', ch: '43', lab: 'circuits', title: 'Three resistors in parallel', kind: 'numeric', topics: ['circuits', 'parallel'],
    vars: { E: range(3, 24, 1, 'V'), R1: range(1, 30, 1, 'Ω'), R2: range(1, 30, 1, 'Ω'), R3: range(1, 30, 1, 'Ω') },
    derive: ($) => {
      const Req = 1 / (1 / $.R1 + 1 / $.R2 + 1 / $.R3);
      return { Req, I: $.E / Req, I2: $.E / $.R2 };
    },
    text: (T) => `R₁ = ${T.R1} Ω, R₂ = ${T.R2} Ω and R₃ = ${T.R3} Ω are in parallel across a ${T.E} V battery. Find $R_{\\text{eq}}$, the total current, and the current through R₂.`,
    parts: [num('Req', ($) => $.Req, 'Ω'), num('I', ($) => $.I, 'A'), num('I2', ($) => $.I2, 'A')],
    steps: ($, f) => [
      String.raw`$\dfrac{1}{R_{\text{eq}}} = \sum \dfrac{1}{R_i} \;\Longrightarrow\; R_{\text{eq}} = ${texNum($.Req)}\ \Omega$`,
      String.raw`$I = ${texNum($.I)}\ \text{A}$`,
      String.raw`Each branch has the full ${f($.E)} V, so $I_2 = ${texNum($.I2)}\ \text{A}$`,
    ],
    sim: {
      scenario: 'parallel',
      setup: (s, $) => vals(s, { E1: $.E, R1: $.R1, R2: $.R2, R3: $.R3 }),
      read: (c) => ({ I: c.circ.sol.I.E1, I2: c.circ.sol.I.R2 }),
    },
    cases: [kase('lab default', { E: 12, R1: 3, R2: 6, R3: 12 }, { Req: 1.714, I: 7, I2: 2 })],
  }),
  problem({
    ...E4, id: 'e4.43.combo', ch: '43', lab: 'circuits', title: 'R₁ in series with R₂ ∥ R₃', kind: 'numeric', level: 2, topics: ['circuits', 'series', 'parallel'],
    vars: { E: range(3, 24, 1, 'V'), R1: range(1, 20, 1, 'Ω'), R2: range(1, 20, 1, 'Ω'), R3: range(1, 20, 1, 'Ω') },
    derive: ($) => {
      const Rp = ($.R2 * $.R3) / ($.R2 + $.R3);
      const Req = $.R1 + Rp;
      const I1 = $.E / Req;
      return { Rp, Req, I1, Vp: I1 * Rp, I3: (I1 * Rp) / $.R3 };
    },
    text: (T) => `R₁ = ${T.R1} Ω is in series with the parallel pair R₂ = ${T.R2} Ω and R₃ = ${T.R3} Ω, across a ${T.E} V battery. Find $R_{\\text{eq}}$, the current through R₁, and the current through R₃.`,
    parts: [num('Req', ($) => $.Req, 'Ω'), num('I1', ($) => $.I1, 'A'), num('I3', ($) => $.I3, 'A')],
    steps: ($, f) => [
      String.raw`$R_2 \parallel R_3 = ${texNum($.Rp)}\ \Omega \;\Longrightarrow\; R_{\text{eq}} = ${texNum($.Req)}\ \Omega$`,
      String.raw`$I_1 = ${texNum($.I1)}\ \text{A}$`,
      String.raw`$V$ across the pair $= ${texNum($.Vp)}\ \text{V} \;\Longrightarrow\; I_3 = ${texNum($.I3)}\ \text{A}$`,
    ],
    sim: {
      scenario: 'combo',
      setup: (s, $) => vals(s, { E1: $.E, R1: $.R1, R2: $.R2, R3: $.R3 }),
      read: (c) => ({ I1: c.circ.sol.I.R1, I3: c.circ.sol.I.R3 }),
    },
    cases: [kase('lab default', { E: 12, R1: 4, R2: 6, R3: 3 }, { Req: 6, I1: 2, I3: 1.3333 })],
  }),
  problem({
    ...E4, id: 'e4.43.add-resistor', ch: '43', lab: 'circuits', title: 'Adding a resistor', kind: 'conceptual', topics: ['circuits'],
    vars: { how: choice([1, 'in series with'], [2, 'in parallel with']), qty: choice([1, 'the total resistance'], [2, 'the current from the battery']) },
    text: (T) => `A third resistor is added ${T.how} two resistors already connected across a battery. What happens to ${T.qty}?`,
    parts: [mc('ans', [[1, 'It increases'], [-1, 'It decreases'], [0, 'It stays the same']], ($) => ($.how === 1 ? 1 : -1) * ($.qty === 1 ? 1 : -1))],
    steps: () => [
      String.raw`A resistor in series adds resistance; one in parallel adds another path, so $R_{\\text{eq}}$ drops.`,
      String.raw`$I = \varepsilon/R_{\text{eq}}$ moves the opposite way.`,
    ],
    cases: [kase('parallel, current', { how: 2, qty: 2 }, { ans: 1 })],
  }),

  // ================================================================= 44
  problem({
    ...E4, id: 'e4.44.two-loop', ch: '44', lab: 'circuits', title: 'Two batteries, two loops (Kirchhoff)', kind: 'numeric', level: 3, topics: ['circuits', 'kirchhoff'],
    vars: { E1: range(2, 24, 1, 'V'), E2: range(2, 24, 1, 'V'), R1: range(1, 10, 1, 'Ω'), R2: range(1, 10, 1, 'Ω'), R3: range(1, 10, 1, 'Ω') },
    derive: ($) => {
      const Vm = ($.E1 / $.R1 + $.E2 / $.R3) / (1 / $.R1 + 1 / $.R2 + 1 / $.R3);
      return { Vm, I1: ($.E1 - Vm) / $.R1, I2: Vm / $.R2, I3: ($.E2 - Vm) / $.R3 };
    },
    text: (T) => `Left branch: ε₁ = ${T.E1} V in series with R₁ = ${T.R1} Ω. Middle branch: R₂ = ${T.R2} Ω. Right branch: ε₂ = ${T.E2} V in series with R₃ = ${T.R3} Ω. Both batteries have their + terminal toward the top junction. Taking I₁ and I₃ as flowing into the top junction and I₂ as flowing down through R₂, find all three currents (signed).`,
    parts: [num('I1', ($) => $.I1, 'A', { abs: 0.005 }), num('I2', ($) => $.I2, 'A', { abs: 0.005 }), num('I3', ($) => $.I3, 'A', { abs: 0.005 })],
    hints: [
      String.raw`Junction: $I_1 + I_3 = I_2$`,
      String.raw`Left loop: $\varepsilon_1 - I_1R_1 - I_2R_2 = 0$. Right loop: $\varepsilon_2 - I_3R_3 - I_2R_2 = 0$.`,
      'A negative answer just means the current flows opposite to the direction you assumed.',
    ],
    steps: ($, f) => [
      String.raw`Potential at the top junction $= ${texNum($.Vm)}\ \text{V}$`,
      String.raw`$I_1 = ${texNum($.I1)}\ \text{A}$, $I_2 = ${texNum($.I2)}\ \text{A}$, $I_3 = ${texNum($.I3)}\ \text{A}$`,
    ],
    sim: {
      scenario: 'twoloop',
      setup: (s, $) => vals(s, { E1: $.E1, E2: $.E2, R1: $.R1, R2: $.R2, R3: $.R3 }),
      read: (c) => ({ I1: c.circ.sol.I.R1, I2: c.circ.sol.I.R2, I3: c.circ.sol.I.R3 }),
    },
    cases: [kase('Ch 44 example', { E1: 12, E2: 6, R1: 2, R2: 4, R3: 3 }, { I1: 2.3077, I2: 1.8462, I3: -0.4615 })],
  }),
  problem({
    ...E4, id: 'e4.44.terminal', ch: '44', lab: 'circuits', title: 'Internal resistance and terminal voltage', kind: 'numeric', topics: ['circuits', 'emf'],
    vars: { E: range(1.5, 24, 0.5, 'V'), r: range(0.1, 2, 0.1, 'Ω'), R: range(1, 30, 0.5, 'Ω') },
    derive: ($) => {
      const I = $.E / ($.R + $.r);
      return { I, V: $.E - I * $.r, Pr: I * I * $.r };
    },
    text: (T) => `A battery with emf ${T.E} V and internal resistance ${T.r} Ω drives a ${T.R} Ω load. Find the current, the terminal voltage, and the power wasted inside the battery.`,
    parts: [num('I', ($) => $.I, 'A'), num('V', ($) => $.V, 'V'), num('Pr', ($) => $.Pr, 'W')],
    steps: ($, f) => [
      String.raw`$I = \dfrac{\varepsilon}{R + r} = ${texNum($.I)}\ \text{A}$`,
      String.raw`$V = \varepsilon - Ir = ${texNum($.V)}\ \text{V}$`,
      String.raw`$P_r = I^2 r = ${texNum($.Pr)}\ \text{W}$`,
    ],
    cases: [kase('hand', { E: 12, r: 0.5, R: 5.5 }, { I: 2, V: 11, Pr: 2 })],
  }),
  problem({
    ...E4, id: 'e4.44.rc-charge', ch: '44', lab: 'circuits', title: 'Charging an RC circuit', kind: 'numeric', level: 2, topics: ['circuits', 'rc'],
    vars: { R: range(1, 100, 1, 'kΩ', 1e3), C: range(10, 1000, 10, 'μF', 1e-6), E: range(3, 24, 1, 'V'), n: range(0.2, 4, 0.1, 'τ') },
    derive: ($) => {
      const tau = $.R * $.C;
      const t = $.n * tau;
      return { tau, t, q: $.C * $.E * (1 - Math.exp(-$.n)), I: ($.E / $.R) * Math.exp(-$.n) };
    },
    text: (T, $, f) => `An uncharged ${T.C} μF capacitor is connected through ${T.R} kΩ to a ${T.E} V battery at t = 0. Find the time constant, and the charge and current at t = ${f($.t)} s.`,
    parts: [num('tau', ($) => $.tau, 's', { label: 'τ' }), num('q', ($) => $.q, 'C'), num('I', ($) => $.I, 'A')],
    hints: [String.raw`$q(t) = C\varepsilon\left(1 - e^{-t/\tau}\right)$ and $I(t) = \dfrac{\varepsilon}{R}e^{-t/\tau}$`],
    steps: ($, f) => [
      String.raw`$\tau = RC = ${texNum($.tau)}\ \text{s}$`,
      String.raw`$q = ${texNum($.q)}\ \text{C}$`,
      String.raw`$I = ${texNum($.I)}\ \text{A}$`,
    ],
    cases: [kase('hand', { R: 10, C: 100, E: 12, n: 1 }, { tau: 1, q: 7.585e-4, I: 4.415e-4 })],
  }),
  problem({
    ...E4, id: 'e4.44.rc-discharge', ch: '44', lab: 'circuits', title: 'Discharging a capacitor', kind: 'numeric', level: 2, topics: ['circuits', 'rc'],
    vars: { R: range(0.5, 50, 0.5, 'kΩ', 1e3), C: range(5, 500, 5, 'μF', 1e-6), f: range(0.05, 0.9, 0.05) },
    derive: ($) => ({ tau: $.R * $.C, t: -$.R * $.C * Math.log($.f) }),
    text: (T) => `A charged ${T.C} μF capacitor discharges through ${T.R} kΩ. How long until its charge falls to ${T.f} of the starting value?`,
    parts: [num('t', ($) => $.t, 's')],
    steps: ($, f) => [
      String.raw`$q = q_0 e^{-t/RC} \;\Longrightarrow\; t = -RC\ln(${texNum($.f)}) = ${texNum($.t)}\ \text{s}$`,
    ],
    cases: [kase('hand', { R: 2, C: 50, f: 0.25 }, { t: 0.1386 })],
  }),
  problem({
    ...E4, id: 'e4.44.rules', ch: '44', lab: 'circuits', title: "What Kirchhoff's rules conserve", kind: 'conceptual', topics: ['kirchhoff'],
    vars: { rule: choice([1, 'junction rule'], [2, 'loop rule']) },
    text: (T) => `Kirchhoff's ${T.rule} is a statement of conservation of…`,
    parts: [mc('ans', [[1, 'Charge'], [2, 'Energy'], [3, 'Momentum'], [4, 'Current density']], ($) => $.rule)],
    steps: () => ['Junction: charge in = charge out. Loop: going around a closed path, the potential changes add to zero (energy per unit charge).'],
    sim: { scenario: 'twoloop' },
    cases: [kase('loop', { rule: 2 }, { ans: 2 })],
  }),

  // ================================================================= 45
  problem({
    ...E4, id: 'e4.45.magnets', ch: '45', lab: 'biot', title: 'Magnets and field lines', kind: 'conceptual', topics: ['magnetism'],
    vars: { ask: choice([1, 'Outside a bar magnet, field lines run…'], [2, 'If a bar magnet is cut in half, you get…'], [3, "The Earth's geographic North Pole is near…"], [4, 'A compass needle\'s north pole points…']) },
    text: (T) => T.ask,
    parts: [mc('ans', [[1, 'from the N pole to the S pole'], [2, 'two smaller magnets, each with N and S poles'], [3, 'a magnetic south pole'], [4, 'along the local field, toward a magnetic south pole'], [5, 'from S to N']], ($) => $.ask)],
    steps: () => ['Field lines leave N and enter S outside a magnet. There are no isolated magnetic poles. A compass N pole is drawn toward a magnetic S pole, which is why the Arctic has one.'],
    cases: [kase('cut', { ask: 2 }, { ans: 2 })],
  }),

  // ================================================================= 46
  problem({
    ...E4, id: 'e4.46.force-mag', ch: '46', lab: 'magforce', title: 'Magnetic force on a moving charge', kind: 'numeric', topics: ['magnetic-force'],
    vars: { p: PART, v: range(1, 50, 1, '×10⁶ m/s', 1e6), B: range(0.05, 2, 0.05, 'T'), th: range(10, 90, 5, '°') },
    derive: ($) => ({ F: QE * $.v * $.B * Math.sin($.th * DEG) }),
    text: (T) => `${T.p} moves at ${T.v} × 10⁶ m/s at ${T.th}° to a ${T.B} T magnetic field. What is the magnitude of the magnetic force on it?`,
    parts: [num('F', ($) => $.F, 'N')],
    steps: ($, f) => [String.raw`$F = |q|vB\sin\theta = ${texNum($.F)}\ \text{N}$`],
    sim: {
      scenario: 'helix',
      setup(s, $) {
        Object.assign(s, { kind: 'particle', particle: $.p, v: $.v, B: $.B, pitch: 90 - $.th });
      },
      read: (c) => ({ F: c.mf.run.Fmag }),
    },
    cases: [kase('hand', { p: 'proton', v: 10, B: 0.2, th: 90 }, { F: 3.2e-13 })],
  }),
  problem({
    ...E4, id: 'e4.46.rhr', ch: '46', lab: 'magforce', title: 'Right-hand rule: direction of F', kind: 'conceptual', topics: ['magnetic-force', 'right-hand-rule'],
    vars: { p: PART, vdir: choice([1, '+x'], [-1, '−x'], [3, '+z'], [-3, '−z']), Bdir: choice([2, '+y'], [-2, '−y']) },
    derive: ($) => {
      const u = (c) => ({ x: (Math.abs(c) === 1) * Math.sign(c), y: (Math.abs(c) === 2) * Math.sign(c), z: (Math.abs(c) === 3) * Math.sign(c) });
      const a = u($.vdir);
      const b = u($.Bdir);
      const cr = { x: a.y * b.z - a.z * b.y, y: a.z * b.x - a.x * b.z, z: a.x * b.y - a.y * b.x };
      const s = Math.sign(pq($.p));
      return { code: axisCode({ x: s * cr.x, y: s * cr.y, z: s * cr.z }) };
    },
    text: (T) => `${T.p} moves in the ${T.vdir} direction through a magnetic field that points ${T.Bdir}. Which way is the magnetic force?`,
    parts: [mc('dir', AXES6, ($) => $.code)],
    hints: [
      String.raw`$\vec{F} = q\vec{v}\times\vec{B}$; for a negative charge, flip the result.`,
      String.raw`$\hat{x}\times\hat{y} = \hat{z}$, $\hat{y}\times\hat{z} = \hat{x}$, $\hat{z}\times\hat{x} = \hat{y}$`,
    ],
    steps: () => [String.raw`Point your fingers along $\vec{v}$ and curl them toward $\vec{B}$; your thumb gives $\vec{v}\times\vec{B}$. Reverse it for an electron.`],
    cases: [kase('proton +x in +y', { p: 'proton', vdir: 1, Bdir: 2 }, { dir: 3 }), kase('electron +z in +y', { p: 'electron', vdir: 3, Bdir: 2 }, { dir: 1 })],
  }),
  problem({
    ...E4, id: 'e4.46.circle', ch: '46', lab: 'magforce', title: 'Circular motion in a magnetic field', kind: 'numeric', level: 2, topics: ['magnetic-force', 'circular-motion'],
    vars: { p: PART, v: range(0.5, 30, 0.5, '×10⁶ m/s', 1e6), B: range(0.01, 1, 0.01, 'T') },
    derive: ($) => ({ r: (pm($.p) * $.v) / (QE * $.B), T: (2 * Math.PI * pm($.p)) / (QE * $.B) }),
    text: (T) => `${T.p} moves at ${T.v} × 10⁶ m/s perpendicular to a uniform ${T.B} T field. Find the radius of its path and its period.`,
    parts: [num('r', ($) => $.r, 'm'), num('T', ($) => $.T, 's'), mc('dep', [[1, 'The period does not depend on speed'], [2, 'Faster particles take longer to go around'], [3, 'Faster particles go around sooner']], 1, { label: 'How does T depend on v?' })],
    steps: ($, f) => [
      String.raw`$qvB = \dfrac{mv^2}{r} \;\Longrightarrow\; r = \dfrac{mv}{|q|B} = ${texNum($.r)}\ \text{m}$`,
      String.raw`$T = \dfrac{2\pi r}{v} = \dfrac{2\pi m}{|q|B} = ${texNum($.T)}\ \text{s}$ — no $v$ in it`,
    ],
    sim: {
      scenario: 'proton',
      setup(s, $) {
        Object.assign(s, { kind: 'particle', particle: $.p, v: $.v, B: $.B, pitch: 0 });
      },
      read: (c) => ({ r: c.mf.run.rA, T: c.mf.run.T }),
    },
    cases: [kase('lab default', { p: 'proton', v: 10, B: 0.2 }, { r: 0.5219, T: 3.279e-7, dep: 1 })],
  }),
  problem({
    ...E4, id: 'e4.46.selector', ch: '46', lab: 'magforce', title: 'Velocity selector', kind: 'numeric', topics: ['magnetic-force'],
    vars: { E: range(1, 50, 1, '×10⁵ V/m', 1e5), B: range(0.05, 1, 0.05, 'T') },
    derive: ($) => ({ v: $.E / $.B }),
    text: (T) => `Crossed fields E = ${T.E} × 10⁵ V/m and B = ${T.B} T. What speed passes straight through? Does the answer depend on the particle's charge or mass?`,
    parts: [num('v', ($) => $.v, 'm/s'), mc('dep', [[0, 'No, it is the same for any charge and mass'], [1, 'Yes, it depends on q'], [2, 'Yes, it depends on m']], 0, { label: 'Depends on q or m?' })],
    steps: ($, f) => [String.raw`$qE = qvB \;\Longrightarrow\; v = \dfrac{E}{B} = ${texNum($.v)}\ \text{m/s}$`],
    sim: {
      scenario: 'selector',
      setup(s, $) {
        Object.assign(s, { kind: 'selector', E: $.E, B: $.B, v: $.v });
      },
      read: (c) => ({ v: c.mf.run.vSelect }),
    },
    cases: [kase('lab default', { E: 20, B: 0.2 }, { v: 1e7, dep: 0 })],
  }),
  problem({
    ...E4, id: 'e4.46.wire-force', ch: '46', lab: 'magforce', title: 'Force on a current-carrying wire', kind: 'numeric', topics: ['magnetic-force'],
    vars: { I: range(0.5, 20, 0.5, 'A'), L: range(0.1, 2, 0.05, 'm'), B: range(0.05, 2, 0.05, 'T'), th: range(10, 90, 5, '°') },
    derive: ($) => ({ F: $.I * $.L * $.B * Math.sin($.th * DEG) }),
    text: (T) => `A ${T.L} m wire carrying ${T.I} A makes ${T.th}° with a ${T.B} T field. Find the force on it.`,
    parts: [num('F', ($) => $.F, 'N')],
    steps: ($, f) => [String.raw`$F = ILB\sin\theta = ${texNum($.F)}\ \text{N}$`],
    sim: {
      scenario: 'wire',
      setup(s, $) {
        Object.assign(s, { kind: 'wire', I: $.I, L: $.L, B: $.B, theta: $.th });
      },
      read: (c) => ({ F: c.mf.Fmag }),
    },
    cases: [kase('lab default', { I: 4, L: 0.6, B: 0.5, th: 90 }, { F: 1.2 })],
  }),
  problem({
    ...E4, id: 'e4.46.spectrometer', ch: '46', lab: 'magforce', title: 'Mass spectrometer', kind: 'numeric', level: 2, topics: ['magnetic-force', 'energy'],
    vars: { p: PART, V: range(100, 5000, 100, 'V'), B: range(0.01, 0.5, 0.01, 'T') },
    derive: ($) => {
      const v = Math.sqrt((2 * QE * $.V) / pm($.p));
      return { v, r: (pm($.p) * v) / (QE * $.B) };
    },
    text: (T) => `${T.p} is accelerated from rest through ${T.V} V and then enters a ${T.B} T field at right angles. Find its speed and the radius of its path.`,
    parts: [num('v', ($) => $.v, 'm/s'), num('r', ($) => $.r, 'm')],
    steps: ($, f) => [
      String.raw`$\tfrac{1}{2}mv^2 = |q|V \;\Longrightarrow\; v = ${texNum($.v)}\ \text{m/s}$`,
      String.raw`$r = \dfrac{mv}{|q|B} = ${texNum($.r)}\ \text{m}$`,
    ],
    cases: [kase('hand', { p: 'proton', V: 1000, B: 0.1 }, { v: 4.377e5, r: 0.04569 })],
  }),
  problem({
    ...E4, id: 'e4.46.torque', ch: '46', lab: 'magforce', title: 'Torque on a current loop', kind: 'numeric', topics: ['magnetic-force', 'torque'],
    vars: { N: range(1, 200, 1, 'turns'), I: range(0.1, 10, 0.1, 'A'), a: range(2, 30, 1, 'cm', 1e-2), B: range(0.05, 1, 0.05, 'T'), th: range(0, 90, 5, '°') },
    derive: ($) => {
      const mu = $.N * $.I * $.a ** 2;
      return { mu, tau: mu * $.B * Math.sin($.th * DEG) };
    },
    text: (T) => `A square coil ${T.a} cm on a side has ${T.N} turns and carries ${T.I} A. Its normal makes ${T.th}° with a ${T.B} T field. Find its magnetic moment and the torque on it.`,
    parts: [num('mu', ($) => $.mu, 'A·m²', { label: 'μ' }), num('tau', ($) => $.tau, 'N·m', { label: 'τ', abs: 1e-6 })],
    steps: ($, f) => [
      String.raw`$\mu = NIA = ${texNum($.mu)}\ \text{A}\cdot\text{m}^2$`,
      String.raw`$\tau = \mu B\sin\theta = ${texNum($.tau)}\ \text{N}\cdot\text{m}$`,
    ],
    cases: [kase('hand', { N: 50, I: 2, a: 10, B: 0.3, th: 90 }, { mu: 1, tau: 0.3 })],
  }),

  // ================================================================= 47
  problem({
    ...E4, id: 'e4.47.long-wire', ch: '47', lab: 'biot', title: 'B near a long straight wire', kind: 'numeric', topics: ['biot-savart', 'ampere'],
    vars: { I: range(0.5, 8, 0.1, 'A'), rho: range(2, 50, 1, 'cm', 1e-2) },
    derive: ($) => ({ B: (MU0 * $.I) / (2 * Math.PI * $.rho) }),
    text: (T) => `How strong is the magnetic field ${T.rho} cm from a long straight wire carrying ${T.I} A?`,
    parts: [num('B', ($) => $.B, 'T')],
    steps: ($, f) => [String.raw`$B = \dfrac{\mu_0 I}{2\pi\rho} = ${texNum($.B)}\ \text{T}$`],
    sim: {
      scenario: 'wire',
      setup(s, $) {
        Object.assign(s, { I: $.I, probe: { x: $.rho, y: 0, z: 0 } });
      },
      read: (c) => ({ B: c.biot.an.ideal }),
    },
    cases: [kase('lab default', { I: 2, rho: 12 }, { B: 3.333e-6 })],
  }),
  problem({
    ...E4, id: 'e4.47.rhr-wire', ch: '47', lab: 'biot', title: 'Direction of B around a wire', kind: 'conceptual', topics: ['right-hand-rule'],
    vars: { Id: UPDOWN, at: choice([1, 'on the +x side'], [-1, 'on the −x side'], [3, 'on the +z side'], [-3, 'on the −z side']) },
    derive: ($) => {
      const map = { 1: -3, [-1]: 3, 3: 1, [-3]: -1 };
      return { code: $.Id * map[$.at] };
    },
    text: (T) => `A long wire runs along the y-axis carrying current ${T.Id === 'upward' ? 'in the +y direction' : 'in the −y direction'}. What is the direction of B at a point ${T.at} of the wire?`,
    parts: [mc('dir', AXES6, ($) => $.code)],
    hints: [String.raw`Thumb along $I$, fingers curl the way $\vec{B}$ points — equivalently $d\vec{B} \propto I\,d\vec{l}\times\hat{r}$.`],
    steps: () => [String.raw`$\hat{y}\times\hat{x} = -\hat{z}$ and $\hat{y}\times\hat{z} = +\hat{x}$. Reverse the result for downward current.`],
    sim: {
      scenario: 'wire',
      setup(s, $) {
        const d = 0.12;
        const r = { 1: { x: d, y: 0, z: 0 }, [-1]: { x: -d, y: 0, z: 0 }, 3: { x: 0, y: 0, z: d }, [-3]: { x: 0, y: 0, z: -d } }[$.at];
        Object.assign(s, { I: 2 * $.Id, probe: r });
      },
      read: (c) => ({ dir: axisCode(c.biot.Bnum) }),
    },
    cases: [kase('up, +x', { Id: 1, at: 1 }, { dir: -3 })],
  }),
  problem({
    ...E4, id: 'e4.47.loop', ch: '47', lab: 'biot', title: 'B on the axis of a current loop', kind: 'numeric', level: 2, topics: ['biot-savart'],
    vars: { N: range(1, 50, 1, 'turns'), I: range(0.5, 8, 0.1, 'A'), R: range(5, 40, 1, 'cm', 1e-2), y: range(0, 40, 1, 'cm', 1e-2) },
    derive: ($) => ({ B: (MU0 * $.N * $.I * $.R ** 2) / (2 * ($.R ** 2 + $.y ** 2) ** 1.5) }),
    text: (T) => `A flat circular coil of ${T.N} turns and radius ${T.R} cm carries ${T.I} A. Find B on its axis ${T.y} cm from the center.`,
    parts: [num('B', ($) => $.B, 'T')],
    hints: [String.raw`At the center, $y = 0$, this reduces to $\dfrac{\mu_0 NI}{2R}$.`],
    steps: ($, f) => [
      String.raw`$B = \dfrac{\mu_0 N I R^2}{2(R^2+y^2)^{3/2}} = ${texNum($.B)}\ \text{T}$`,
    ],
    sim: {
      scenario: 'loop',
      setup(s, $) {
        Object.assign(s, { I: $.I, R: $.R, nTurns: 1, probe: { x: 0, y: $.y, z: 0 } });
        s._N = $.N;
        return $.N > 1 ? `The lab draws one turn; multiply its B by N = ${$.N}.` : '';
      },
      read: (c, s) => ({ B: c.biot.an.exact * s._N }),
    },
    cases: [kase('lab default', { N: 1, I: 3, R: 28, y: 20 }, { B: 3.627e-6 }), kase('center', { N: 10, I: 2, R: 10, y: 0 }, { B: 1.2566e-4 })],
  }),
  problem({
    ...E4, id: 'e4.47.solenoid', ch: '47', lab: 'biot', title: 'Field inside a long solenoid', kind: 'numeric', topics: ['ampere', 'solenoid'],
    vars: { N: range(100, 5000, 100, 'turns'), L: range(0.1, 1, 0.05, 'm'), I: range(0.1, 10, 0.1, 'A') },
    derive: ($) => ({ n: $.N / $.L, B: (MU0 * $.N * $.I) / $.L }),
    text: (T) => `A solenoid ${T.L} m long has ${T.N} turns and carries ${T.I} A. Find n and the field inside.`,
    parts: [num('n', ($) => $.n, 'turns/m'), num('B', ($) => $.B, 'T')],
    steps: ($, f) => [
      String.raw`$n = \dfrac{N}{L} = ${texNum($.n)}\ \text{m}^{-1}$`,
      String.raw`$B = \mu_0 n I = ${texNum($.B)}\ \text{T}$`,
    ],
    sim: {
      scenario: 'solenoid',
      setup(s, $) {
        const shown = 24;
        Object.assign(s, { L: Math.min($.L, 1.2), nTurns: shown, I: ($.I * ($.N / $.L) * Math.min($.L, 1.2)) / shown });
        return `The lab draws ${shown} turns with the current scaled so n·I matches.`;
      },
      read: (c) => ({ B: c.biot.an.ideal }),
    },
    cases: [kase('hand', { N: 1000, L: 0.5, I: 2 }, { n: 2000, B: 5.027e-3 })],
  }),
  problem({
    ...E4, id: 'e4.47.parallel-wires', ch: '47', lab: 'magforce', title: 'Force between parallel wires', kind: 'numeric', topics: ['magnetic-force', 'ampere'],
    vars: { I1: range(1, 50, 1, 'A'), I2: range(1, 50, 1, 'A'), same: choice([1, 'the same direction'], [-1, 'opposite directions']), d: range(2, 50, 1, 'cm', 1e-2) },
    derive: ($) => ({ FL: (MU0 * $.I1 * $.I2) / (2 * Math.PI * $.d) }),
    text: (T) => `Two long parallel wires ${T.d} cm apart carry ${T.I1} A and ${T.I2} A in ${T.same}. Find the force per meter between them. Do they attract or repel?`,
    parts: [num('FL', ($) => $.FL, 'N/m', { label: 'F/L' }), mc('type', [[1, 'Attract'], [-1, 'Repel']], ($) => $.same, { label: 'Attract or repel?' })],
    steps: ($, f) => [
      String.raw`$\dfrac{F}{L} = \dfrac{\mu_0 I_1 I_2}{2\pi d} = ${texNum($.FL)}\ \text{N/m}$`,
      'Parallel currents attract; antiparallel currents repel.',
    ],
    sim: {
      scenario: 'parallel',
      setup(s, $) {
        Object.assign(s, { kind: 'parallel', I1: $.I1, I2: $.same * $.I2, d: $.d });
      },
      read: (c) => ({ FL: Math.abs(c.mf.an), type: c.mf.attract ? 1 : -1 }),
    },
    cases: [kase('lab default', { I1: 20, I2: 20, same: 1, d: 25 }, { FL: 3.2e-4, type: 1 })],
  }),
  problem({
    ...E4, id: 'e4.47.thick-wire', ch: '47', lab: 'ampere', title: "Ampère's law inside and outside a thick wire", kind: 'numeric', level: 2, topics: ['ampere'],
    vars: { I: range(1, 20, 1, 'A'), a: range(0.1, 0.4, 0.01, 'm'), f: range(0.1, 2, 0.05) },
    derive: ($) => {
      const r = $.f * $.a;
      return { r, B: r < $.a ? (MU0 * $.I * r) / (2 * Math.PI * $.a ** 2) : (MU0 * $.I) / (2 * Math.PI * r) };
    },
    valid: ($) => Math.abs($.f - 1) > 0.01 && $.r <= 0.8,
    text: (T, $, f) => `A long solid wire of radius ${T.a} m carries ${T.I} A spread uniformly over its cross section. Find B at r = ${f($.r)} m from the axis.`,
    parts: [num('B', ($) => $.B, 'T')],
    hints: [String.raw`Inside the wire, $I_{\text{enc}} = I\dfrac{r^2}{a^2}$.`],
    steps: ($, f) => [
      String.raw`$r < a$: $B = \dfrac{\mu_0 I r}{2\pi a^2}$.  $r > a$: $B = \dfrac{\mu_0 I}{2\pi r}$.`,
      String.raw`$B = ${texNum($.B)}\ \text{T}$`,
    ],
    sim: {
      scenario: 'thick',
      setup(s, $) {
        s.wires = [{ I: $.I, x: 0, z: 0, a: $.a }];
        s.r = $.r;
        s.cx = 0;
        s.cz = 0;
      },
      read: (c) => ({ B: c.amp.Bsym }),
    },
    cases: [kase('lab default', { I: 6, a: 0.3, f: 0.6 }, { B: 2.4e-6 })],
  }),
  problem({
    ...E4, id: 'e4.47.two-wires-B', ch: '47', lab: 'ampere', title: 'Net B between two parallel wires', kind: 'numeric', level: 2, topics: ['superposition', 'biot-savart'],
    vars: { I1: range(1, 30, 1, 'A'), I2: range(1, 30, 1, 'A'), same: choice([1, 'the same direction'], [-1, 'opposite directions']), d: range(5, 50, 1, 'cm', 1e-2), f: range(0.1, 0.9, 0.1) },
    derive: ($) => {
      const r1 = $.f * $.d;
      const r2 = $.d - r1;
      const B = (MU0 / (2 * Math.PI)) * ($.I1 / r1 - $.same * ($.I2 / r2));
      return { r1, r2, B: Math.abs(B) };
    },
    text: (T, $, f) => `Two long parallel wires ${T.d} cm apart carry ${T.I1} A and ${T.I2} A in ${T.same}. Find |B| at the point on the line between them that is ${f($.r1 * 100)} cm from wire 1.`,
    parts: [num('B', ($) => $.B, 'T', { abs: 1e-9 })],
    hints: ['Between the wires, parallel currents make opposite fields and antiparallel currents make fields in the same direction.'],
    steps: ($, f) => [
      String.raw`$B_1 = \dfrac{\mu_0 I_1}{2\pi r_1}$, $B_2 = \dfrac{\mu_0 I_2}{2\pi r_2}$`,
      String.raw`Combining them gives $B = ${texNum($.B)}\ \text{T}$`,
    ],
    cases: [kase('opposite, midpoint', { I1: 10, I2: 10, same: -1, d: 20, f: 0.5 }, { B: 4e-5 })],
  }),
];
