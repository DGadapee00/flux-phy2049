/**
 * Wave optics · Ch 63 (interference), 64 (diffraction), 65 (thin films). On the final exam.
 * Each template loads the Interference, Diffraction or Thin film lab into its own numbers, and
 * `read` hands back the lab's value for every answer so the check script compares the two.
 */
import { problem, kase, range, choice, num, mc, sym, DEG , texNum } from '../kit.js';

const W = { exam: 'wave' };

export default [
  // ================================================================= 63
  problem({
    ...W, lab: 'interference', id: 'wave.63.double-slit', ch: '63', title: 'Double-slit bright fringes', kind: 'numeric', topics: ['interference'],
    vars: { lam: range(400, 700, 5, 'nm', 1e-9), d: range(0.05, 1, 0.05, 'mm', 1e-3), L: range(0.5, 5, 0.1, 'm'), m: range(1, 5, 1) },
    derive: ($) => ({ y: ($.m * $.lam * $.L) / $.d, dy: ($.lam * $.L) / $.d }),
    text: (T) => `Light of wavelength ${T.lam} nm passes through two slits ${T.d} mm apart onto a screen ${T.L} m away. Find the position of the m = ${T.m} bright fringe and the fringe spacing.`,
    parts: [
      sym('dy_sym', 'lam*L/d', { lam: 'm', L: 'm', d: 'm' }, ($) => $.dy, { unit: 'm', label: String.raw`the fringe spacing $\Delta y$ as a formula` }),
      num('y', ($) => $.y, 'mm', { scale: 1e-3, label: String.raw`$y_m$` }),
      num('dy', ($) => $.dy, 'mm', { scale: 1e-3, label: String.raw`$\Delta y$` }),
    ],
    hints: [String.raw`Bright fringes: $d\sin\theta = m\lambda$. For small angles, $y = \dfrac{m\lambda L}{d}$.`],
    steps: ($, f) => [
      String.raw`$y = \dfrac{m\lambda L}{d} = ${texNum($.y * 1e3)}\ \text{mm}$`,
      String.raw`$\Delta y = \dfrac{\lambda L}{d} = ${texNum($.dy * 1e3)}\ \text{mm}$`,
    ],
    sim: {
      scenario: 'young',
      setup: (st, $) => void Object.assign(st, { lam: $.lam, d: $.d, L: $.L, m: $.m, envelope: false }),
      read: (c) => ({ y: c.interf.y, dy: c.interf.dy, dy_sym: c.interf.dy }),
    },
    cases: [kase('hand', { lam: 600, d: 0.2, L: 2, m: 3 }, { y: 18, dy: 6 })],
  }),
  problem({
    ...W, lab: 'interference', id: 'wave.63.find-lambda', ch: '63', title: 'Wavelength from fringe spacing', kind: 'numeric', topics: ['interference'],
    vars: { dy: range(1, 10, 0.1, 'mm', 1e-3), d: range(0.1, 1, 0.05, 'mm', 1e-3), L: range(0.5, 5, 0.1, 'm') },
    derive: ($) => ({ lam: ($.dy * $.d) / $.L }),
    valid: ($) => $.lam > 3.5e-7 && $.lam < 8e-7,
    text: (T) => `Neighboring bright fringes are ${T.dy} mm apart on a screen ${T.L} m from a double slit with d = ${T.d} mm. What is the wavelength?`,
    parts: [
      sym('lam_sym', 'dy*d/L', { dy: 'm', d: 'm', L: 'm' }, ($) => $.lam, { unit: 'm', label: String.raw`$\lambda$ as a formula` }),
      num('lam', ($) => $.lam, 'nm', { scale: 1e-9, label: String.raw`$\lambda$` }),
    ],
    steps: ($, f) => [String.raw`$\lambda = \dfrac{\Delta y\,d}{L} = ${texNum($.lam * 1e9)}\ \text{nm}$`],
    sim: {
      scenario: 'young',
      // The lab is driven by λ, so set it to the answer and let the lab reproduce the stated Δy.
      setup: (st, $) => void Object.assign(st, { lam: $.lam, d: $.d, L: $.L, m: 1, envelope: false }),
      read: (c, st, $) => ({ '@fringe spacing': [c.interf.dy, $.dy] }),
    },
    cases: [kase('hand', { dy: 4.5, d: 0.25, L: 1.5 }, { lam: 750 })],
  }),
  problem({
    ...W, lab: 'interference', id: 'wave.63.dark-angle', ch: '63', title: 'Angle of a dark fringe', kind: 'numeric', topics: ['interference'],
    vars: { lam: range(400, 700, 5, 'nm', 1e-9), d: range(0.01, 0.5, 0.01, 'mm', 1e-3), m: range(0, 4, 1) },
    derive: ($) => {
      const s = (($.m + 0.5) * $.lam) / $.d;
      return { s, th: (Math.asin(s) * 180) / Math.PI };
    },
    valid: ($) => $.s < 0.95,
    text: (T) => `For a double slit with d = ${T.d} mm and λ = ${T.lam} nm, at what angle is the m = ${T.m} dark fringe (m = 0 is the first dark fringe)?`,
    parts: [num('th', ($) => $.th, '°', { label: 'θ', abs: 0.002 })],
    hints: [String.raw`Dark fringes: $d\sin\theta = \left(m + \tfrac{1}{2}\right)\lambda$`],
    steps: ($, f) => [
      String.raw`$\sin\theta = \dfrac{(m + \tfrac{1}{2})\lambda}{d} = ${texNum($.s)} \;\Longrightarrow\; \theta$ = ${f($.th)}°`,
    ],
    sim: {
      scenario: 'young',
      setup: (st, $) => void Object.assign(st, { lam: $.lam, d: $.d, L: 2, m: $.m, envelope: false }),
      read: (c, st, $) => ({ th: (c.interf.ds.thetaDark($.m) * 180) / Math.PI }),
    },
    cases: [kase('first dark', { lam: 500, d: 0.1, m: 0 }, { th: 0.1432 })],
  }),
  problem({
    ...W, id: 'wave.63.what-if', ch: '63', title: 'How the fringe pattern responds', kind: 'conceptual', topics: ['interference'],
    vars: { change: choice([1, 'the slit separation d is decreased'], [2, 'the wavelength is increased'], [3, 'the screen is moved closer'], [4, 'the whole setup is submerged in water']) },
    text: (T) => `In a double-slit experiment, ${T.change}. What happens to the fringe spacing?`,
    parts: [mc('ans', [[1, 'It increases'], [-1, 'It decreases'], [0, 'It stays the same']], ($) => ({ 1: 1, 2: 1, 3: -1, 4: -1 })[$.change])],
    steps: () => [String.raw`$\Delta y = \dfrac{\lambda L}{d}$. In water the wavelength becomes $\lambda/n$, so the spacing shrinks.`],
    cases: [kase('water', { change: 4 }, { ans: -1 })],
  }),
  problem({
    ...W, id: 'wave.63.michelson', ch: '63', title: 'Michelson interferometer fringe count', kind: 'numeric', topics: ['interference'],
    vars: { dd: range(0.01, 1, 0.01, 'mm', 1e-3), lam: range(400, 700, 0.1, 'nm', 1e-9) },
    derive: ($) => ({ N: (2 * $.dd) / $.lam }),
    text: (T) => `One mirror of a Michelson interferometer moves ${T.dd} mm, using ${T.lam} nm light. How many bright fringes pass the detector?`,
    parts: [num('N', ($) => $.N, 'fringes', { abs: 1, tol: 0.005 })],
    hints: ["The light path changes by twice the mirror's displacement."],
    steps: ($, f) => [String.raw`$N = \dfrac{2\Delta d}{\lambda} = ${texNum($.N)}$`],
    cases: [kase('HeNe', { dd: 0.1, lam: 632.8 }, { N: 316.06 })],
  }),

  // ================================================================= 64
  problem({
    ...W, lab: 'diffraction', id: 'wave.64.single-slit', ch: '64', title: 'Single-slit central maximum', kind: 'numeric', topics: ['diffraction'],
    vars: { lam: range(400, 700, 1, 'nm', 1e-9), a: range(0.02, 1, 0.01, 'mm', 1e-3), L: range(0.5, 5, 0.1, 'm') },
    derive: ($) => ({ th: (Math.asin($.lam / $.a) * 180) / Math.PI, w: (2 * $.lam * $.L) / $.a }),
    text: (T) => `Light of wavelength ${T.lam} nm passes through a single slit ${T.a} mm wide onto a screen ${T.L} m away. Find the angle of the first dark fringe and the width of the central bright maximum.`,
    parts: [
      sym('w_sym', '2*lam*L/a', { lam: 'm', L: 'm', a: 'm' }, ($) => $.w, { unit: 'm', label: String.raw`the central width as a formula` }),
      num('th', ($) => $.th, '°', { label: String.raw`$\theta_1$`, abs: 0.002 }),
      num('w', ($) => $.w, 'mm', { scale: 1e-3, label: 'Central width' }),
    ],
    hints: [String.raw`Dark fringes: $a\sin\theta = m\lambda$ for $m = 1, 2, \dots$. The central maximum spans from $-\theta_1$ to $+\theta_1$.`],
    steps: ($, f) => [
      String.raw`$\sin\theta_1 = \dfrac{\lambda}{a} \;\Longrightarrow\; \theta_1$ = ${f($.th)}°`,
      String.raw`$w = \dfrac{2\lambda L}{a} = ${texNum($.w * 1e3)}\ \text{mm}$`,
    ],
    sim: {
      scenario: 'single',
      setup: (st, $) => void Object.assign(st, { mode: 'slit', lam: $.lam, a: $.a, L: $.L }),
      read: (c) => ({ th: c.diff.theta1Deg, w: c.diff.width, w_sym: c.diff.width }),
    },
    cases: [kase('HeNe', { lam: 633, a: 0.1, L: 2 }, { th: 0.3627, w: 25.32 })],
  }),
  problem({
    ...W, lab: 'diffraction', id: 'wave.64.grating', ch: '64', title: 'Diffraction grating', kind: 'numeric', level: 2, topics: ['diffraction', 'grating'],
    vars: { N: range(100, 1200, 50, 'lines/mm', 1e3), lam: range(400, 700, 5, 'nm', 1e-9), m: range(1, 3, 1) },
    derive: ($) => {
      const d = 1 / $.N;
      const s = ($.m * $.lam) / d;
      return { d, s, th: (Math.asin(s) * 180) / Math.PI, mmax: Math.floor(d / $.lam) };
    },
    valid: ($) => $.s < 0.98 && $.d / $.lam - $.mmax > 0.01,
    text: (T) => `A grating has ${T.N} lines/mm and is lit with ${T.lam} nm light. Find the line spacing, the angle of the m = ${T.m} maximum, and the highest order you can see.`,
    parts: [num('d', ($) => $.d, 'μm', { scale: 1e-6, label: 'd' }), num('th', ($) => $.th, '°', { label: String.raw`$\theta_m$`, abs: 0.05, tol: 0.005 }), num('mmax', ($) => $.mmax, '', { label: 'Highest order', tol: 0 })],
    steps: ($, f) => [
      String.raw`$d = \dfrac{1}{N} = ${texNum($.d * 1e6)}\ \mu\text{m}$`,
      String.raw`$\sin\theta = \dfrac{m\lambda}{d} \;\Longrightarrow\; \theta$ = ${f($.th)}°`,
      String.raw`$m_{\max} = \left\lfloor \dfrac{d}{\lambda} \right\rfloor = ${texNum($.mmax)}$`,
    ],
    sim: {
      scenario: 'grating',
      setup: (st, $) => void Object.assign(st, { mode: 'grating', lam: $.lam, linesPerMM: $.N / 1e3, m: $.m, L: 2 }),
      read: (c) => ({ d: c.diff.d, th: c.diff.thetaOrderDeg, mmax: c.diff.maxOrder }),
    },
    cases: [kase('hand', { N: 600, lam: 500, m: 2 }, { d: 1.6667, th: 36.87, mmax: 3 })],
  }),
  problem({
    ...W, lab: 'diffraction', id: 'wave.64.rayleigh', ch: '64', title: 'Resolving power (Rayleigh)', kind: 'numeric', topics: ['diffraction', 'resolution'],
    vars: { D: range(1, 500, 1, 'mm', 1e-3), lam: range(400, 700, 10, 'nm', 1e-9), L: range(0.1, 100, 0.1, 'km', 1e3) },
    derive: ($) => {
      const th = (1.22 * $.lam) / $.D;
      return { th, s: th * $.L };
    },
    text: (T) => `An aperture ${T.D} mm across views objects ${T.L} km away in ${T.lam} nm light. Find the minimum resolvable angle and the smallest separation it can resolve at that distance.`,
    parts: [
      sym('s_sym', '1.22*lam*L/D', { lam: 'm', L: 'm', D: 'm' }, ($) => $.s, { unit: 'm', label: String.raw`the separation as a formula` }),
      num('th', ($) => $.th, 'rad', { label: String.raw`$\theta_{\min}$` }),
      num('s', ($) => $.s, 'm', { label: 'Separation' }),
    ],
    steps: ($, f) => [
      String.raw`$\theta = \dfrac{1.22\lambda}{D} = ${texNum($.th)}\ \text{rad}$`,
      String.raw`$s = \theta L = ${texNum($.s)}\ \text{m}$`,
    ],
    sim: {
      scenario: 'rayleigh',
      setup: (st, $) => void Object.assign(st, { mode: 'rayleigh', lam: $.lam, D: $.D, Lobj: $.L, sepFactor: 1 }),
      read: (c) => ({ th: c.diff.thetaMin, s: c.diff.separation, s_sym: c.diff.separation }),
    },
    cases: [kase('eye', { D: 5, lam: 550, L: 10 }, { th: 1.342e-4, s: 1.342 })],
  }),
  problem({
    ...W, id: 'wave.64.what-if', ch: '64', title: 'How the diffraction pattern responds', kind: 'conceptual', topics: ['diffraction'],
    vars: { change: choice([1, 'the slit is made wider'], [2, 'red light is replaced with blue'], [3, 'the grating has more lines per mm']) },
    text: (T) => `What happens to the angular spread of the pattern when ${T.change}?`,
    parts: [mc('ans', [[1, 'It spreads out more'], [-1, 'It narrows'], [0, 'No change']], ($) => ({ 1: -1, 2: -1, 3: 1 })[$.change])],
    steps: () => [String.raw`$\sin\theta \propto \lambda/a$ for a slit, or $\lambda/d$ for a grating: a wider slit or a shorter wavelength narrows the pattern, and a smaller $d$ (more lines per mm) spreads it out.`],
    cases: [kase('wider', { change: 1 }, { ans: -1 })],
  }),

  // ================================================================= 65
  problem({
    ...W, lab: 'thinfilm', id: 'wave.65.thin-film', ch: '65', title: 'Minimum thin-film thickness', kind: 'numeric', level: 3, topics: ['thin-film', 'interference'],
    vars: {
      nf: range(1.2, 2.4, 0.01, ''),
      sub: choice([1, 'air (a soap film or bubble)'], [1.33, 'water'], [1.5, 'glass (n = 1.50)'], [1.9, 'a high-index layer (n = 1.90)']),
      want: choice([1, 'strongly reflected (bright)'], [-1, 'not reflected (dark)']),
      lam: range(400, 700, 5, 'nm', 1e-9),
    },
    derive: ($) => {
      const shifts = 1 + ($.sub > $.nf ? 1 : 0); // top surface always flips (air → film, n_f > 1)
      const odd = shifts % 2 === 1;
      // odd shifts: bright at 2nt = (m+½)λ, dark at 2nt = mλ (m ≥ 1); even: the reverse
      const brightQuarter = odd;
      const quarter = $.want === 1 ? brightQuarter : !brightQuarter;
      return { shifts, t: quarter ? $.lam / (4 * $.nf) : $.lam / (2 * $.nf) };
    },
    valid: ($) => Math.abs($.sub - $.nf) > 0.03,
    text: (T) => `A film with n = ${T.nf} sits in air on top of ${T.sub}. Light of ${T.lam} nm arrives at normal incidence. What is the minimum nonzero film thickness that makes this wavelength ${T.want}?`,
    parts: [
      mc('shifts', [[0, 'None'], [1, 'One'], [2, 'Two']], ($) => $.shifts, { label: 'How many reflections have a half-wave phase shift?' }),
      num('t', ($) => $.t, 'nm', { scale: 1e-9, label: String.raw`$t_{\min}$` }),
    ],
    hints: [
      String.raw`A reflection off a higher-$n$ medium adds a half-wavelength shift.`,
      String.raw`Use $\lambda_{\text{film}} = \lambda/n$. One shift: bright at $2t = \left(m + \tfrac{1}{2}\right)\lambda_{\text{film}}$. Zero or two shifts: bright at $2t = m\lambda_{\text{film}}$.`,
    ],
    steps: ($, f) => [
      `Phase-shifting reflections: ${f($.shifts)}`,
      String.raw`$t_{\min} = ${texNum($.t * 1e9)}\ \text{nm}$`,
    ],
    sim: {
      scenario: 'soap',
      setup: (st, $) => void Object.assign(st, { nf: $.nf, ns: $.sub, lam: $.lam, t: $.t }),
      read: (c) => ({ shifts: c.film.shifts, t: c.film.reflectance > 0.5 ? c.film.tBright : c.film.tDark }),
    },
    cases: [
      kase('soap bubble, bright', { nf: 1.33, sub: 1, want: 1, lam: 600 }, { shifts: 1, t: 112.78 }),
      kase('MgF₂ AR coating, dark', { nf: 1.38, sub: 1.5, want: -1, lam: 550 }, { shifts: 2, t: 99.64 }),
      kase('soap bubble, dark', { nf: 1.33, sub: 1, want: -1, lam: 600 }, { t: 225.56 }),
    ],
  }),
  problem({
    ...W, id: 'wave.65.phase-shift', ch: '65', title: 'Phase shift on reflection', kind: 'conceptual', topics: ['thin-film'],
    vars: { from: choice([1, 'air'], [1.33, 'water'], [1.5, 'glass']), to: choice([1, 'air'], [1.33, 'water'], [1.5, 'glass']) },
    valid: ($) => $.from !== $.to,
    text: (T) => `Light traveling in ${T.from} reflects off a boundary with ${T.to}. Does the reflected wave pick up a half-wavelength (180°) phase shift?`,
    parts: [mc('ans', [[1, 'Yes'], [0, 'No']], ($) => ($.to > $.from ? 1 : 0))],
    steps: () => [String.raw`There is a $180^\circ$ shift only when the light reflects off a medium with a higher index of refraction.`],
    cases: [kase('air → glass', { from: 1, to: 1.5 }, { ans: 1 })],
  }),
];
