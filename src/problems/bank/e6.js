/** Exam 6 · Ch 53 (EM waves), 54 (spectrum), 55 (intensity), 56 (polarization), 57 (intro to optics). */
import { problem, kase, range, choice, num, mc, EPS0, C_LIGHT, DEG, AXES6, axisCode , texNum } from '../kit.js';
import { BANDS, spectrumBand } from '../../physics/emwave.js';
import { MEDIA } from '../../physics/optics.js';

const E6 = { exam: 'e6' };
const BAND_OPTS = BANDS.map((b) => [b.id, b.name]);
const nOf = (id) => MEDIA.find((m) => m.id === id).n;

export default [
  // ================================================================= 53
  problem({
    ...E6, id: 'e6.53.f-from-lambda', ch: '53', lab: 'emwave', title: 'Frequency from wavelength', kind: 'numeric', topics: ['em-waves'],
    vars: { lam: range(300, 800, 5, 'nm', 1e-9) },
    derive: ($) => ({ f: C_LIGHT / $.lam, T: $.lam / C_LIGHT }),
    text: (T) => `Light has a wavelength of ${T.lam} nm in vacuum. Find its frequency and period.`,
    parts: [num('f', ($) => $.f, 'Hz'), num('T', ($) => $.T, 's')],
    steps: ($, f) => [
      String.raw`$f = \dfrac{c}{\lambda} = ${texNum($.f)}\ \text{Hz}$`,
      String.raw`$T = \dfrac{1}{f} = ${texNum($.T)}\ \text{s}$`,
    ],
    sim: {
      scenario: 'green',
      setup: (s, $) => void (s.lambda = $.lam),
      read: (c) => ({ f: c.em.f }),
    },
    cases: [kase('green laser', { lam: 532 }, { f: 5.639e14, T: 1.773e-15 })],
  }),
  problem({
    ...E6, id: 'e6.53.B-from-E', ch: '53', lab: 'emwave', title: 'Magnetic amplitude from electric amplitude', kind: 'numeric', topics: ['em-waves'],
    vars: { E0: range(1, 2000, 1, 'V/m') },
    derive: ($) => ({ B0: $.E0 / C_LIGHT }),
    text: (T) => `An EM wave in vacuum has an electric field amplitude of ${T.E0} V/m. What is its magnetic field amplitude?`,
    parts: [num('B0', ($) => $.B0, 'T')],
    steps: ($, f) => [String.raw`$B_0 = \dfrac{E_0}{c} = ${texNum($.B0)}\ \text{T}$`],
    sim: {
      scenario: 'green',
      setup: (s, $) => void (s.E0 = $.E0),
      read: (c) => ({ B0: c.em.B0 }),
    },
    cases: [kase('lab default', { E0: 200 }, { B0: 6.667e-7 })],
  }),
  problem({
    ...E6, id: 'e6.53.direction', ch: '53', lab: 'emwave', title: 'Direction of travel from E and B', kind: 'conceptual', topics: ['em-waves', 'poynting'],
    vars: { Ed: choice([2, '+y'], [-2, '−y'], [3, '+z'], [-3, '−z']), Bd: choice([1, '+x'], [-1, '−x'], [2, '+y'], [-2, '−y'], [3, '+z'], [-3, '−z']) },
    derive: ($) => {
      const u = (c) => ({ x: (Math.abs(c) === 1) * Math.sign(c), y: (Math.abs(c) === 2) * Math.sign(c), z: (Math.abs(c) === 3) * Math.sign(c) });
      const a = u($.Ed);
      const b = u($.Bd);
      return { code: axisCode({ x: a.y * b.z - a.z * b.y, y: a.z * b.x - a.x * b.z, z: a.x * b.y - a.y * b.x }) };
    },
    valid: ($) => Math.abs($.Ed) !== Math.abs($.Bd),
    text: (T) => `At some instant, a plane wave's E points ${T.Ed} and its B points ${T.Bd}. Which way is the wave traveling?`,
    parts: [mc('dir', AXES6.filter(([v]) => v !== 0), ($) => $.code)],
    hints: [String.raw`The wave travels along $\vec{S} = \dfrac{\vec{E}\times\vec{B}}{\mu_0}$.`],
    steps: () => [String.raw`Use the right-hand rule for $\vec{E}\times\vec{B}$. In the lab $\vec{E}$ is along $\hat{y}$ and $\vec{B}$ along $\hat{z}$, so $\hat{y}\times\hat{z} = \hat{x}$.`],
    sim: { scenario: 'green' },
    cases: [kase('lab', { Ed: 2, Bd: 3 }, { dir: 1 })],
  }),
  problem({
    ...E6, id: 'e6.53.wave-eq', ch: '53', lab: 'emwave', title: 'Reading a wave equation', kind: 'numeric', level: 2, topics: ['em-waves'],
    vars: { k: range(1, 50, 0.5, '×10⁶ rad/m', 1e6), E0: range(1, 500, 1, 'V/m') },
    derive: ($) => {
      const lam = (2 * Math.PI) / $.k;
      return { lam, w: $.k * C_LIGHT, f: C_LIGHT / lam, B0: $.E0 / C_LIGHT };
    },
    text: (T) => `E(x, t) = ${T.E0} sin[(${T.k} × 10⁶ rad/m)x − ωt] ŷ V/m in vacuum. Find λ, ω, f and B₀.`,
    parts: [num('lam', ($) => $.lam, 'm', { label: 'λ' }), num('w', ($) => $.w, 'rad/s', { label: 'ω' }), num('f', ($) => $.f, 'Hz'), num('B0', ($) => $.B0, 'T', { label: 'B₀' })],
    steps: ($, f) => [
      String.raw`$\lambda = \dfrac{2\pi}{k} = ${texNum($.lam)}\ \text{m}$`,
      String.raw`$\omega = ck = ${texNum($.w)}\ \text{rad/s}$`,
      String.raw`$f = \dfrac{\omega}{2\pi} = ${texNum($.f)}\ \text{Hz}$`,
      String.raw`$B_0 = \dfrac{E_0}{c} = ${texNum($.B0)}\ \text{T}$`,
    ],
    cases: [kase('hand', { k: 10, E0: 30 }, { lam: 6.2832e-7, w: 3e15, f: 4.7746e14, B0: 1e-7 })],
  }),

  // ================================================================= 54
  problem({
    ...E6, id: 'e6.54.band', ch: '54', lab: 'emwave', title: 'Which part of the spectrum?', kind: 'conceptual', topics: ['spectrum'],
    vars: { e: range(-13, 2, 0.5, '(log₁₀ λ in m)') },
    derive: ($) => ({ lam: 10 ** $.e, band: spectrumBand(10 ** $.e).id }),
    valid: ($) => BANDS.every((b) => Math.abs(Math.log10($.lam / Math.max(b.min, 1e-30))) > 0.05),
    text: (T, $, f) => `Electromagnetic radiation has a wavelength of ${f($.lam)} m. Which band is it in?`,
    parts: [mc('band', BAND_OPTS, ($) => $.band)],
    steps: () => ['From longest to shortest wavelength: radio > 1 m, microwave 1 mm–1 m, infrared 700 nm–1 mm, visible 400–700 nm, UV 10–400 nm, X-ray 0.01–10 nm, gamma < 0.01 nm.'],
    sim: {
      scenario: 'green',
      setup: (s, $) => void (s.lambda = $.lam),
      read: (c) => ({ band: c.em.band.id }),
    },
    cases: [kase('Wi-Fi', { e: -1 }, { band: 'microwave' }), kase('ultraviolet', { e: -6.5 }, { band: 'uv' })],
  }),
  problem({
    ...E6, id: 'e6.54.order', ch: '54', lab: 'emwave', title: 'Ordering the spectrum', kind: 'conceptual', topics: ['spectrum'],
    vars: { a: choice(...BAND_OPTS.map(([id, n], i) => [i, n])), b: choice(...BAND_OPTS.map(([id, n], i) => [i, n])), qty: choice([1, 'higher frequency'], [2, 'longer wavelength'], [3, 'higher speed in vacuum']) },
    valid: ($) => $.a !== $.b,
    text: (T) => `Which has the ${T.qty}: ${T.a} or ${T.b}?`,
    parts: [mc('ans', [[1, 'The first one'], [2, 'The second one'], [0, 'They are the same']], ($) => ($.qty === 3 ? 0 : ($.qty === 1) === $.a > $.b ? 1 : 2))],
    steps: () => ['All EM waves travel at c in vacuum. From lowest to highest frequency (longest to shortest wavelength): radio, microwave, infrared, visible, ultraviolet, X-ray, gamma.'],
    cases: [kase('x-ray vs radio frequency', { a: 5, b: 0, qty: 1 }, { ans: 1 }), kase('speed', { a: 1, b: 3, qty: 3 }, { ans: 0 })],
  }),

  // ================================================================= 55
  problem({
    ...E6, id: 'e6.55.intensity', ch: '55', lab: 'emwave', title: 'Intensity from field amplitude', kind: 'numeric', topics: ['intensity'],
    vars: { E0: range(1, 2000, 1, 'V/m') },
    derive: ($) => ({ I: 0.5 * C_LIGHT * EPS0 * $.E0 ** 2 }),
    text: (T) => `What is the average intensity of an EM wave with E₀ = ${T.E0} V/m?`,
    parts: [num('I', ($) => $.I, 'W/m²')],
    steps: ($, f) => [String.raw`$I = \tfrac{1}{2}c\varepsilon_0 E_0^2 = ${texNum($.I)}\ \text{W/m}^2$`],
    sim: {
      scenario: 'sun',
      setup: (s, $) => void (s.E0 = $.E0),
      read: (c) => ({ I: c.em.Iavg }),
    },
    cases: [kase('lab default', { E0: 200 }, { I: 53.1 })],
  }),
  problem({
    ...E6, id: 'e6.55.E-from-I', ch: '55', lab: 'emwave', title: 'Field amplitudes from intensity', kind: 'numeric', topics: ['intensity'],
    vars: { I: range(10, 5000, 10, 'W/m²') },
    derive: ($) => {
      const E0 = Math.sqrt((2 * $.I) / (C_LIGHT * EPS0));
      return { E0, B0: E0 / C_LIGHT };
    },
    text: (T) => `Sunlight reaching a surface has an intensity of ${T.I} W/m². Find E₀ and B₀.`,
    parts: [num('E0', ($) => $.E0, 'V/m'), num('B0', ($) => $.B0, 'T')],
    steps: ($, f) => [
      String.raw`$E_0 = \sqrt{\dfrac{2I}{c\varepsilon_0}} = ${texNum($.E0)}\ \text{V/m}$`,
      String.raw`$B_0 = \dfrac{E_0}{c} = ${texNum($.B0)}\ \text{T}$`,
    ],
    sim: {
      scenario: 'sun',
      setup: (s, $) => void (s.E0 = $.E0),
      read: (c, s, $) => ({ '@I in the lab': [c.em.Iavg, $.I] }),
    },
    cases: [kase('sunlight', { I: 1000 }, { E0: 868.2, B0: 2.894e-6 })],
  }),
  problem({
    ...E6, id: 'e6.55.point-source', ch: '55', lab: 'emwave', title: 'Intensity from a point source', kind: 'numeric', topics: ['intensity'],
    vars: { P: range(1, 1000, 1, 'W'), r: range(0.5, 50, 0.5, 'm') },
    derive: ($) => {
      const I = $.P / (4 * Math.PI * $.r ** 2);
      return { I, E0: Math.sqrt((2 * I) / (C_LIGHT * EPS0)) };
    },
    text: (T) => `A ${T.P} W source radiates equally in all directions. Find the intensity and E₀ ${T.r} m away.`,
    parts: [num('I', ($) => $.I, 'W/m²'), num('E0', ($) => $.E0, 'V/m')],
    steps: ($, f) => [
      String.raw`$I = \dfrac{P}{4\pi r^2} = ${texNum($.I)}\ \text{W/m}^2$`,
      String.raw`$E_0 = \sqrt{\dfrac{2I}{c\varepsilon_0}} = ${texNum($.E0)}\ \text{V/m}$`,
    ],
    cases: [kase('hand', { P: 100, r: 2 }, { I: 1.989, E0: 38.72 })],
  }),
  problem({
    ...E6, id: 'e6.55.pressure', ch: '55', lab: 'emwave', title: 'Radiation pressure on a sail', kind: 'numeric', level: 2, topics: ['intensity', 'radiation-pressure'],
    vars: { I: range(100, 2000, 10, 'W/m²'), A: range(1, 1000, 1, 'm²'), surf: choice([1, 'absorbs all the light'], [2, 'reflects all the light']) },
    derive: ($) => ({ p: ($.surf * $.I) / C_LIGHT, F: ($.surf * $.I * $.A) / C_LIGHT }),
    text: (T) => `Light of intensity ${T.I} W/m² hits a ${T.A} m² sail head-on. The sail ${T.surf}. Find the radiation pressure and the force.`,
    parts: [num('p', ($) => $.p, 'Pa'), num('F', ($) => $.F, 'N')],
    steps: ($, f) => [
      String.raw`$p = \dfrac{I}{c}$ if absorbed, $\dfrac{2I}{c}$ if reflected $= ${texNum($.p)}\ \text{Pa}$`,
      String.raw`$F = pA = ${texNum($.F)}\ \text{N}$`,
    ],
    cases: [kase('reflecting', { I: 1360, A: 100, surf: 2 }, { p: 9.067e-6, F: 9.067e-4 })],
  }),

  // ================================================================= 56
  problem({
    ...E6, id: 'e6.56.malus-two', ch: '56', lab: 'polar', title: 'Unpolarized light through two polarizers', kind: 'numeric', topics: ['polarization', 'malus'],
    vars: { I0: range(10, 2000, 10, 'W/m²'), th: range(0, 90, 5, '°') },
    derive: ($) => ({ I1: $.I0 / 2, I: ($.I0 / 2) * Math.cos($.th * DEG) ** 2 }),
    text: (T) => `Unpolarized light of intensity ${T.I0} W/m² passes through two polarizers whose axes are ${T.th}° apart. Find the intensity after each one.`,
    parts: [num('I1', ($) => $.I1, 'W/m²', { label: 'After the first' }), num('I', ($) => $.I, 'W/m²', { label: 'After the second', abs: 1e-6 })],
    steps: ($, f) => [
      String.raw`The first polarizer passes half: $${texNum($.I1)}\ \text{W/m}^2$`,
      String.raw`Malus: $I = I_1\cos^2\theta = ${texNum($.I)}\ \text{W/m}^2$`,
    ],
    sim: {
      scenario: '45',
      setup: (s, $) => void Object.assign(s, { n: 2, a: 0, b: $.th }),
      read: (c, s, $) => ({ I1: (c.pol.steps[1].I / s.I0) * $.I0, I: (c.pol.I / s.I0) * $.I0 }),
    },
    cases: [kase('45°', { I0: 1000, th: 45 }, { I1: 500, I: 250 })],
  }),
  problem({
    ...E6, id: 'e6.56.malus-three', ch: '56', lab: 'polar', title: 'Three polarizers', kind: 'numeric', level: 2, topics: ['polarization', 'malus'],
    vars: { I0: range(10, 2000, 10, 'W/m²'), a: range(0, 90, 5, '°'), b: range(0, 180, 5, '°') },
    derive: ($) => ({ I: ($.I0 / 2) * Math.cos($.a * DEG) ** 2 * Math.cos(($.b - $.a) * DEG) ** 2 }),
    text: (T) => `Unpolarized light (${T.I0} W/m²) passes through three polarizers with axes at 0°, ${T.a}° and ${T.b}°. Find the final intensity.`,
    parts: [num('I', ($) => $.I, 'W/m²', { abs: 1e-6 })],
    hints: ['Apply Malus using the angle between each pair of neighbouring filters.'],
    steps: ($, f) => [
      String.raw`$I = \tfrac{1}{2}I_0\cos^2(${f($.a)}^\circ)\cos^2(${f($.b - $.a)}^\circ) = ${texNum($.I)}\ \text{W/m}^2$`,
    ],
    sim: {
      scenario: 'three',
      setup: (s, $) => void Object.assign(s, { n: 3, a: 0, b: $.a, c: $.b }),
      read: (c, s, $) => ({ I: (c.pol.I / s.I0) * $.I0 }),
    },
    cases: [kase('crossed + 45°', { I0: 1000, a: 45, b: 90 }, { I: 125 })],
  }),
  problem({
    ...E6, id: 'e6.56.polarized-in', ch: '56', lab: 'polar', title: 'Polarized light through one filter', kind: 'numeric', topics: ['polarization', 'malus'],
    vars: { I0: range(10, 2000, 10, 'W/m²'), th: range(0, 90, 5, '°') },
    derive: ($) => ({ I: $.I0 * Math.cos($.th * DEG) ** 2 }),
    text: (T) => `Vertically polarized light of intensity ${T.I0} W/m² hits a polarizer whose axis is ${T.th}° from vertical. Find the transmitted intensity.`,
    parts: [num('I', ($) => $.I, 'W/m²', { abs: 1e-6 })],
    steps: ($, f) => [
      String.raw`$I = I_0\cos^2\theta = ${texNum($.I)}\ \text{W/m}^2$ — no factor of $\tfrac{1}{2}$, because the light is already polarized`,
    ],
    sim: {
      scenario: '45',
      setup: (s, $) => void Object.assign(s, { n: 2, a: 0, b: $.th }),
      read: (c, s, $) => ({ I: (c.pol.I / c.pol.steps[1].I) * $.I0 }),
    },
    cases: [kase('hand', { I0: 800, th: 30 }, { I: 600 })],
  }),
  problem({
    ...E6, id: 'e6.56.brewster', ch: '56', lab: 'refraction', title: "Brewster's angle", kind: 'numeric', topics: ['polarization', 'reflection'],
    vars: { m1: choice(['air', 'air'], ['water', 'water']), m2: choice(['water', 'water'], ['glass', 'glass'], ['diamond', 'diamond']) },
    derive: ($) => {
      const tB = (Math.atan(nOf($.m2) / nOf($.m1)) * 180) / Math.PI;
      return { tB, tr: 90 - tB };
    },
    valid: ($) => $.m1 !== $.m2,
    text: (T, $) => `Light in ${T.m1} (n = ${nOf($.m1)}) reflects off ${T.m2} (n = ${nOf($.m2)}). At what angle of incidence is the reflected light completely polarized, and what is the refraction angle then?`,
    parts: [num('tB', ($) => $.tB, '°', { label: String.raw`$\theta_B$`, abs: 0.2, tol: 0.005 }), num('tr', ($) => $.tr, '°', { label: String.raw`$\theta$ refracted`, abs: 0.2, tol: 0.005 })],
    steps: ($, f) => [
      String.raw`$\tan\theta_B = \dfrac{n_2}{n_1} \;\Longrightarrow\; \theta_B$ = ${f($.tB)}°`,
      String.raw`The reflected and refracted rays are $90^\circ$ apart, so $\theta_r$ = ${f($.tr)}°`,
    ],
    sim: {
      scenario: 'air-glass',
      setup: (s, $) => void Object.assign(s, { n1: $.m1, n2: $.m2, theta: Math.round($.tB * 2) / 2 }),
      read: (c, s, $) => ({ '@θ₁ + θ₂ ≈ 90° at Brewster (to 0.5°)': [(c.ref.th1 + c.ref.theta2) / DEG, 90] }),
    },
    cases: [kase('air → glass', { m1: 'air', m2: 'glass' }, { tB: 56.31, tr: 33.69 })],
  }),

  // ================================================================= 57
  problem({
    ...E6, id: 'e6.57.in-medium', ch: '57', lab: 'refraction', title: 'Light inside a medium', kind: 'numeric', topics: ['optics', 'index'],
    vars: { m: choice(['water', 'water'], ['glass', 'glass'], ['diamond', 'diamond']), lam: range(400, 700, 5, 'nm', 1e-9) },
    derive: ($) => ({ n: nOf($.m), v: C_LIGHT / nOf($.m), ln: $.lam / nOf($.m), f: C_LIGHT / $.lam }),
    text: (T, $) => `Light with a vacuum wavelength of ${T.lam} nm enters ${T.m} (n = ${$.n}). Find its speed, its wavelength, and its frequency in the ${T.m}.`,
    parts: [num('v', ($) => $.v, 'm/s'), num('ln', ($) => $.ln, 'nm', { scale: 1e-9, label: 'λ in the medium' }), num('f', ($) => $.f, 'Hz')],
    steps: ($, f) => [
      String.raw`$v = \dfrac{c}{n} = ${texNum($.v)}\ \text{m/s}$`,
      String.raw`$\lambda_n = \dfrac{\lambda_0}{n} = ${texNum($.ln * 1e9)}\ \text{nm}$`,
      String.raw`$f$ does not change: ${f($.f)} Hz`,
    ],
    sim: { scenario: 'air-water', setup: (s, $) => void Object.assign(s, { n1: 'air', n2: $.m }) },
    cases: [kase('water', { m: 'water', lam: 600 }, { v: 2.2556e8, ln: 451.1, f: 5e14 })],
  }),
  problem({
    ...E6, id: 'e6.57.what-changes', ch: '57', lab: 'refraction', title: 'What changes when light enters glass?', kind: 'conceptual', topics: ['optics', 'index'],
    vars: { q: choice([1, 'speed'], [2, 'wavelength'], [3, 'frequency'], [4, 'color we perceive']) },
    text: (T) => `Light passes from air into glass. What happens to its ${T.q}?`,
    parts: [mc('ans', [[-1, 'Decreases'], [0, 'Stays the same'], [1, 'Increases']], ($) => ($.q <= 2 ? -1 : 0))],
    steps: () => [String.raw`$v = c/n$ and $\lambda = \lambda_0/n$ both drop. The frequency — and so the perceived colour — is set by the source and stays the same.`],
    cases: [kase('frequency', { q: 3 }, { ans: 0 })],
  }),
  problem({
    ...E6, id: 'e6.57.plane-mirror', ch: '57', lab: 'mirrors', title: 'Plane mirror', kind: 'numeric', topics: ['reflection'],
    vars: { d: range(0.5, 10, 0.5, 'm'), h: range(1, 2.2, 0.05, 'm'), v: range(0.5, 3, 0.5, 'm/s') },
    derive: ($) => ({ sep: 2 * $.d, closing: 2 * $.v, mirror: $.h / 2 }),
    text: (T) => `You stand ${T.d} m in front of a plane mirror and are ${T.h} m tall. How far away does your image appear? How fast does your image approach you if you walk toward the mirror at ${T.v} m/s? What is the minimum mirror height needed to see your whole body?`,
    parts: [num('sep', ($) => $.sep, 'm', { label: 'Distance to the image' }), num('closing', ($) => $.closing, 'm/s', { label: 'Approach speed' }), num('mirror', ($) => $.mirror, 'm', { label: 'Minimum mirror height' })],
    steps: ($, f) => [`The image is as far behind the mirror as you are in front: ${f($.sep)} m from you`, `You and your image both move → ${f($.closing)} m/s`, `By the law of reflection, the mirror needs half your height: ${f($.mirror)} m`],
    cases: [kase('hand', { d: 3, h: 1.8, v: 1 }, { sep: 6, closing: 2, mirror: 0.9 })],
  }),
  problem({
    ...E6, id: 'e6.57.two-mirrors', ch: '57', lab: 'mirrors', title: 'Images in two angled mirrors', kind: 'numeric', topics: ['reflection'],
    vars: { a: choice([90, '90°'], [72, '72°'], [60, '60°'], [45, '45°'], [36, '36°'], [30, '30°']) },
    derive: ($) => ({ N: 360 / $.a - 1 }),
    text: (T) => `Two plane mirrors meet at ${T.a}. How many images of an object between them do you see?`,
    parts: [num('N', ($) => $.N, 'images', { tol: 0 })],
    steps: ($, f) => [String.raw`$N = \dfrac{360^\circ}{\alpha} - 1 = ${texNum($.N)}$`],
    cases: [kase('60°', { a: 60 }, { N: 5 })],
  }),
];
