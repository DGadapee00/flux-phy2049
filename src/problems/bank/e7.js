/** Exam 7 · Ch 58 (refraction), 59 (mirrors), 60 (lenses), 62 (optical instruments). Distances in cm. */
import { problem, kase, range, choice, num, mc, sym, DEG, texNum, texDeg, qty, pq } from '../kit.js';
import { MEDIA } from '../../physics/optics.js';

const E7 = { exam: 'e7' };
const nOf = (id) => MEDIA.find((m) => m.id === id).n;
const MED = (...ids) => choice(...ids.map((id) => [id, `${MEDIA.find((m) => m.id === id).name.toLowerCase()} (n = ${nOf(id)})`]));

const TYPES = [
  [1, 'real, inverted, reduced'],
  [2, 'real, inverted, same size'],
  [3, 'real, inverted, enlarged'],
  [4, 'virtual, upright, enlarged'],
  [5, 'virtual, upright, reduced'],
];
const typeCode = (di, m) => {
  const am = Math.abs(m);
  if (di > 0) return am > 1.02 ? 3 : am < 0.98 ? 1 : 2;
  return am > 1.02 ? 4 : 5;
};
const codeOfString = (s) => (TYPES.find(([, l]) => l === s) || [null])[0];

/** Mirror/lens: signed f, object distance → di, m, hi, type code. */
function image(f, d, ho) {
  const di = 1 / (1 / f - 1 / d);
  const m = -di / d;
  return { di, m, hi: m * ho, code: typeCode(di, m) };
}

export default [
  // ================================================================= 58
  problem({
    ...E7, id: 'e7.58.snell', ch: '58', lab: 'refraction', title: "Snell's law", kind: 'numeric', topics: ['refraction'],
    vars: { m1: MED('air', 'water', 'glass', 'diamond'), m2: MED('air', 'water', 'glass', 'diamond'), th: range(5, 80, 5, '°') },
    derive: ($) => {
      const s = (nOf($.m1) * Math.sin($.th * DEG)) / nOf($.m2);
      return { s, th2: (Math.asin(Math.min(1, s)) * 180) / Math.PI };
    },
    valid: ($) => $.m1 !== $.m2 && $.s < 0.999,
    text: (T) => `Light in ${T.m1} strikes a flat boundary with ${T.m2} at ${T.th}° from the normal. Find the angle of refraction and the angle of reflection.`,
    parts: [num('th2', ($) => $.th2, '°', { label: 'θ₂', abs: 0.2, tol: 0.005 }), num('thr', ($) => $.th, '°', { label: String.raw`$\theta$ reflected`, abs: 0.1, tol: 0 }), mc('bend', [[1, 'Toward the normal'], [-1, 'Away from the normal']], ($) => (nOf($.m2) > nOf($.m1) ? 1 : -1), { label: 'The ray bends…' })],
    steps: ($, f) => [
      String.raw`$\sin\theta_2 = \dfrac{n_1\sin\theta_1}{n_2} = \dfrac{(${nOf($.m1)})\sin ${texDeg($.th)}}{${nOf($.m2)}} = ${texNum($.s)} \;\Longrightarrow\; \theta_2 = ${texDeg($.th2)}$`,
      String.raw`$\theta_r = \theta_1 = ${texDeg($.th)}$. Going into a ${nOf($.m2) > nOf($.m1) ? 'higher $n$ bends the ray toward' : 'lower $n$ bends the ray away from'} the normal.`,
    ],
    sim: {
      scenario: 'air-glass',
      setup: (s, $) => void Object.assign(s, { n1: $.m1, n2: $.m2, theta: $.th }),
      read: (c) => ({ th2: c.ref.theta2 / DEG, thr: c.ref.thetaR / DEG }),
    },
    cases: [kase('air → glass', { m1: 'air', m2: 'glass', th: 45 }, { th2: 28.13, thr: 45, bend: 1 }), kase('lab water → air', { m1: 'water', m2: 'air', th: 35 }, { th2: 49.7, bend: -1 })],
  }),
  problem({
    ...E7, id: 'e7.58.critical', ch: '58', lab: 'refraction', title: 'Critical angle', kind: 'numeric', topics: ['refraction', 'tir'],
    vars: { m1: MED('water', 'glass', 'diamond'), m2: MED('air', 'water', 'glass') },
    derive: ($) => ({ tc: (Math.asin(nOf($.m2) / nOf($.m1)) * 180) / Math.PI }),
    valid: ($) => nOf($.m1) > nOf($.m2),
    text: (T) => `Find the critical angle for light going from ${T.m1} into ${T.m2}.`,
    parts: [num('tc', ($) => $.tc, '°', { label: String.raw`$\theta_c$`, abs: 0.2, tol: 0.005 })],
    hints: [String.raw`Total internal reflection can only happen going from higher $n$ to lower $n$.`],
    steps: ($, f) => [String.raw`$\sin\theta_c = \dfrac{n_2}{n_1} = \dfrac{${nOf($.m2)}}{${nOf($.m1)}} \;\Longrightarrow\; \theta_c = ${texDeg($.tc)}$`],
    sim: {
      scenario: 'tir',
      setup: (s, $) => void Object.assign(s, { n1: $.m1, n2: $.m2, theta: 30 }),
      read: (c) => ({ tc: c.ref.thetaC / DEG }),
    },
    cases: [kase('water → air', { m1: 'water', m2: 'air' }, { tc: 48.75 }), kase('diamond → air', { m1: 'diamond', m2: 'air' }, { tc: 24.41 })],
  }),
  problem({
    ...E7, id: 'e7.58.tir', ch: '58', lab: 'refraction', title: 'Does it totally internally reflect?', kind: 'conceptual', topics: ['tir'],
    vars: { m1: MED('air', 'water', 'glass', 'diamond'), m2: MED('air', 'water', 'glass'), th: range(10, 85, 5, '°') },
    derive: ($) => {
      const s = (nOf($.m1) * Math.sin($.th * DEG)) / nOf($.m2);
      return { s, tir: s > 1 ? 1 : 0 };
    },
    valid: ($) => $.m1 !== $.m2 && Math.abs($.s - 1) > 0.01,
    text: (T) => `Light travels from ${T.m1} toward ${T.m2} at ${T.th}° from the normal. Is it totally internally reflected?`,
    parts: [mc('tir', [[1, 'Yes, total internal reflection'], [0, 'No, some light is transmitted']], ($) => $.tir)],
    steps: ($, f) => [String.raw`$\dfrac{n_1\sin\theta_1}{n_2} = \dfrac{(${nOf($.m1)})\sin ${texDeg($.th)}}{${nOf($.m2)}} = ${texNum($.s)}$ — total internal reflection happens when this exceeds 1, so ${$.tir ? 'yes' : 'no'}`],
    sim: {
      scenario: 'tir',
      setup: (s, $) => void Object.assign(s, { n1: $.m1, n2: $.m2, theta: $.th }),
      read: (c) => ({ tir: c.ref.tir ? 1 : 0 }),
    },
    cases: [kase('lab 55°', { m1: 'water', m2: 'air', th: 55 }, { tir: 1 }), kase('lab 35°', { m1: 'water', m2: 'air', th: 35 }, { tir: 0 })],
  }),
  problem({
    ...E7, id: 'e7.58.apparent-depth', ch: '58', lab: 'refraction', title: 'Apparent depth', kind: 'numeric', topics: ['refraction'],
    vars: { m: MED('water', 'glass', 'diamond'), d: range(0.1, 5, 0.1, 'm') },
    derive: ($) => ({ n: nOf($.m), dp: $.d / nOf($.m) }),
    text: (T) => `Looking straight down from air, how deep does an object ${T.d} m below the surface of ${T.m} appear to be?`,
    parts: [
      sym('dp_sym', 'd/n', { d: 'm', n: '1' }, ($) => $.dp, { unit: 'm', label: String.raw`$d'$ as a formula (use n for the index)` }),
      num('dp', ($) => $.dp, 'm'),
    ],
    steps: ($, f) => [String.raw`$d' = d\dfrac{n_{\text{air}}}{n} = ${pq($.d, 'm')}\dfrac{1}{${$.n}} = ${texNum($.dp)}\ \text{m}$ — it looks shallower`],
    cases: [kase('pool', { m: 'water', d: 2 }, { dp: 1.504 })],
  }),
  problem({
    ...E7, id: 'e7.58.dispersion', ch: '58', lab: 'refraction', title: 'Dispersion in a prism', kind: 'conceptual', topics: ['dispersion'],
    vars: { q: choice([1, 'is bent the most'], [2, 'travels fastest in the glass'], [3, 'has the largest index of refraction']) },
    text: (T) => `White light passes through a glass prism. Which color ${T.q}?`,
    parts: [mc('ans', [[1, 'Violet'], [2, 'Red'], [3, 'All colors the same']], ($) => ($.q === 2 ? 2 : 1))],
    steps: () => [String.raw`In glass $n$ is slightly larger for shorter wavelengths, so violet bends the most and travels slowest; red travels fastest.`],
    cases: [kase('fastest', { q: 2 }, { ans: 2 })],
  }),

  // ================================================================= 59
  problem({
    ...E7, id: 'e7.59.mirror', ch: '59', lab: 'mirrors', title: 'Image in a curved mirror', kind: 'numeric', level: 2, topics: ['mirrors'],
    vars: { type: choice(['concave', 'concave'], ['convex', 'convex']), fA: range(6, 30, 0.5, 'cm'), d: range(4, 60, 1, 'cm'), ho: range(1, 10, 0.5, 'cm') },
    derive: ($) => ({ f: $.type === 'concave' ? $.fA : -$.fA, ...image($.type === 'concave' ? $.fA : -$.fA, $.d, $.ho) }),
    valid: ($) => Math.abs($.d - $.fA) > 1 && Math.abs($.di) < 400 && Math.abs(Math.abs($.m) - 1) > 0.03,
    text: (T) => `A ${T.ho} cm tall object stands ${T.d} cm in front of a ${T.type} mirror with |f| = ${T.fA} cm. Find the image distance, magnification and image height, and describe the image.`,
    parts: [num('di', ($) => $.di, 'cm', { label: String.raw`$d_i$ (signed)` }), num('m', ($) => $.m, '', { label: 'm' }), num('hi', ($) => $.hi, 'cm', { label: String.raw`$h_i$` }), mc('type', TYPES, ($) => $.code, { label: 'Image' })],
    hints: [
      String.raw`$\dfrac{1}{f} = \dfrac{1}{d_o} + \dfrac{1}{d_i}$, with $f > 0$ for concave and $f < 0$ for convex.`,
      String.raw`$m = -\dfrac{d_i}{d_o}$. A positive $d_i$ means a real image in front of the mirror.`,
    ],
    steps: ($, f) => [
      String.raw`$\dfrac{1}{d_i} = \dfrac{1}{${texNum($.f)}} - \dfrac{1}{${texNum($.d)}} \;\Longrightarrow\; d_i = ${texNum($.di)}\ \text{cm}$`,
      String.raw`$m = -\dfrac{d_i}{d_o} = -\dfrac{${texNum($.di)}}{${texNum($.d)}} = ${texNum($.m)}$, $h_i = mh_o = (${texNum($.m)})${pq($.ho, 'cm')} = ${texNum($.hi)}\ \text{cm}$`,
    ],
    sim: {
      scenario: 'concave-out',
      setup: (s, $) => void Object.assign(s, { type: $.type, fAbs: $.fA, do: $.d, ho: $.ho }),
      read: (c) => ({ di: c.mir.di, m: c.mir.m, hi: c.mir.hi, type: codeOfString(c.mir.type) }),
    },
    cases: [
      kase('beyond C', { type: 'concave', fA: 12, d: 36, ho: 8 }, { di: 18, m: -0.5, hi: -4, type: 1 }),
      kase('inside F', { type: 'concave', fA: 12, d: 8, ho: 6 }, { di: -24, m: 3, hi: 18, type: 4 }),
      kase('convex', { type: 'convex', fA: 12, d: 20, ho: 8 }, { di: -7.5, m: 0.375, hi: 3, type: 5 }),
    ],
  }),
  problem({
    ...E7, id: 'e7.59.place-object', ch: '59', lab: 'mirrors', title: 'Where to put the object for a given magnification', kind: 'numeric', level: 2, topics: ['mirrors'],
    vars: { R: range(10, 60, 2, 'cm'), m: choice([-3, '−3 (real, inverted)'], [-2, '−2 (real, inverted)'], [-0.5, '−½ (real, inverted)'], [2, '+2 (virtual, upright)'], [3, '+3 (virtual, upright)']) },
    derive: ($) => {
      const f = $.R / 2;
      const d = f * (1 - 1 / $.m);
      return { f, d, di: -$.m * d };
    },
    text: (T) => `A concave mirror has a radius of curvature of ${T.R} cm. Where should an object go to get magnification m = ${T.m}? Where is the image?`,
    parts: [num('f', ($) => $.f, 'cm', { label: 'f' }), num('d', ($) => $.d, 'cm', { label: String.raw`$d_o$` }), num('di', ($) => $.di, 'cm', { label: String.raw`$d_i$ (signed)` })],
    hints: [String.raw`$f = R/2$. Substituting $d_i = -m\,d_o$ into the mirror equation gives $d_o = f\left(1 - \dfrac{1}{m}\right)$.`],
    steps: ($, f) => [
      String.raw`$f = \dfrac{R}{2} = \dfrac{${qty($.R, 'cm')}}{2} = ${texNum($.f)}\ \text{cm}$`,
      String.raw`$d_o = f\left(1 - \dfrac{1}{m}\right) = ${pq($.f, 'cm')}\left(1 - \dfrac{1}{${texNum($.m)}}\right) = ${texNum($.d)}\ \text{cm}$`,
      String.raw`$d_i = -m\,d_o = -(${texNum($.m)})${pq($.d, 'cm')} = ${texNum($.di)}\ \text{cm}$`,
    ],
    sim: {
      scenario: 'concave-f',
      setup: (s, $) => void Object.assign(s, { type: 'concave', fAbs: $.f, do: $.d }),
      read: (c) => ({ di: c.mir.di }),
    },
    cases: [kase('m = −2', { R: 30, m: -2 }, { f: 15, d: 22.5, di: 45 }), kase('m = +3', { R: 30, m: 3 }, { d: 10, di: -30 })],
  }),

  // ================================================================= 60
  problem({
    ...E7, id: 'e7.60.lens', ch: '60', lab: 'lenses', title: 'Image formed by a thin lens', kind: 'numeric', level: 2, topics: ['lenses'],
    vars: { type: choice(['conv', 'converging'], ['div', 'diverging']), fA: range(6, 30, 0.5, 'cm'), d: range(4, 60, 1, 'cm'), ho: range(1, 10, 0.5, 'cm') },
    derive: ($) => ({ f: $.type === 'conv' ? $.fA : -$.fA, ...image($.type === 'conv' ? $.fA : -$.fA, $.d, $.ho) }),
    valid: ($) => Math.abs($.d - $.fA) > 1 && Math.abs($.di) < 400 && Math.abs(Math.abs($.m) - 1) > 0.03,
    text: (T) => `A ${T.ho} cm object is ${T.d} cm from a ${T.type} lens with |f| = ${T.fA} cm. Find $d_i$, $m$ and $h_i$, and describe the image.`,
    parts: [num('di', ($) => $.di, 'cm', { label: String.raw`$d_i$ (signed)` }), num('m', ($) => $.m, ''), num('hi', ($) => $.hi, 'cm', { label: String.raw`$h_i$` }), mc('type', TYPES, ($) => $.code, { label: 'Image' })],
    hints: [String.raw`$f > 0$ for converging, $f < 0$ for diverging. A real image forms on the far side, $d_i > 0$.`],
    steps: ($) => [
      String.raw`$\dfrac{1}{d_i} = \dfrac{1}{f} - \dfrac{1}{d_o} = \dfrac{1}{${texNum($.f)}} - \dfrac{1}{${texNum($.d)}} \;\Longrightarrow\; d_i = ${texNum($.di)}\ \text{cm}$`,
      String.raw`$m = -\dfrac{d_i}{d_o} = -\dfrac{${texNum($.di)}}{${texNum($.d)}} = ${texNum($.m)}$, $h_i = mh_o = (${texNum($.m)})${pq($.ho, 'cm')} = ${texNum($.hi)}\ \text{cm}$`,
    ],
    sim: {
      scenario: 'conv-far',
      setup: (s, $) => void Object.assign(s, { mode: 'single', type: $.type, fAbs: $.fA, do: $.d, ho: $.ho }),
      read: (c) => ({ di: c.len.di, m: c.len.m, hi: c.len.hi, type: codeOfString(c.len.type) }),
    },
    cases: [
      kase('beyond 2F', { type: 'conv', fA: 12, d: 36, ho: 8 }, { di: 18, m: -0.5, hi: -4, type: 1 }),
      kase('between F and 2F', { type: 'conv', fA: 12, d: 18, ho: 5 }, { di: 36, m: -2, hi: -10, type: 3 }),
      kase('diverging', { type: 'div', fA: 12, d: 24, ho: 8 }, { di: -8, m: 0.3333, hi: 2.667, type: 5 }),
    ],
  }),
  problem({
    ...E7, id: 'e7.60.power', ch: '60', lab: 'lenses', title: 'Lens power and lenses in contact', kind: 'numeric', topics: ['lenses'],
    vars: { f1: range(-100, 100, 5, 'cm', 1e-2, { exclude: [0] }), f2: range(-100, 100, 5, 'cm', 1e-2, { exclude: [0] }) },
    derive: ($) => {
      const P = 1 / $.f1 + 1 / $.f2;
      return { P1: 1 / $.f1, P, f: 1 / P };
    },
    valid: ($) => Math.abs($.P) > 0.2,
    text: (T) => `Two thin lenses with f₁ = ${T.f1} cm and f₂ = ${T.f2} cm are placed in contact. Find the power of lens 1, the combined power, and the combined focal length.`,
    parts: [num('P1', ($) => $.P1, 'D', { label: 'P₁' }), num('P', ($) => $.P, 'D', { label: String.raw`$P_{\text{total}}$` }), num('f', ($) => $.f, 'cm', { scale: 1e-2, label: String.raw`$f_{\text{total}}$` })],
    hints: [String.raw`$P = 1/f$ with $f$ in metres. Powers of lenses in contact add.`],
    steps: ($, f) => [
      String.raw`$P_1 = \dfrac{1}{f_1} = \dfrac{1}{${qty($.f1, 'm')}} = ${texNum($.P1)}\ \text{D}$`,
      String.raw`$P = P_1 + P_2 = ${qty($.P1, 'D')} + \dfrac{1}{${qty($.f2, 'm')}} = ${texNum($.P)}\ \text{D}$`,
      String.raw`$f = \dfrac{1}{P} = \dfrac{1}{${qty($.P, 'D')}} = ${texNum($.f)}\ \text{m} = ${texNum($.f * 100)}\ \text{cm}$`,
    ],
    cases: [kase('hand', { f1: 20, f2: -50 }, { P1: 5, P: 3, f: 33.33 })],
  }),
  problem({
    ...E7, id: 'e7.60.two-lens', ch: '60', lab: 'lenses', title: 'Two-lens system', kind: 'numeric', level: 3, topics: ['lenses', 'instruments'],
    vars: { f1: range(3, 20, 1, 'cm'), f2: range(3, 20, 1, 'cm'), d: range(4, 40, 1, 'cm'), sep: range(10, 80, 1, 'cm') },
    derive: ($) => {
      const i1 = image($.f1, $.d, 1);
      const d2 = $.sep - i1.di;
      const i2 = image($.f2, d2, i1.m);
      return { di1: i1.di, m1: i1.m, d2, di2: i2.di, m2: i2.di / -d2, M: i1.m * (-i2.di / d2) };
    },
    valid: ($) => Math.abs($.d - $.f1) > 0.5 && $.di1 > 0 && $.d2 > 0.5 && Math.abs($.d2 - $.f2) > 0.5 && Math.abs($.di2) < 300,
    text: (T) => `Two converging lenses, f₁ = ${T.f1} cm and f₂ = ${T.f2} cm, are ${T.sep} cm apart. An object is ${T.d} cm in front of lens 1. Find the final image position (measured from lens 2) and the overall magnification.`,
    parts: [num('di1', ($) => $.di1, 'cm', { label: 'Image from lens 1' }), num('di2', ($) => $.di2, 'cm', { label: String.raw`Final $d_i$ (from lens 2, signed)` }), num('M', ($) => $.M, '', { label: String.raw`$M_{\text{total}}$` })],
    hints: [
      String.raw`Lens 1's image is the object for lens 2: $d_{o2} = s - d_{i1}$.`,
      'The magnifications multiply.',
    ],
    steps: ($, f) => [
      String.raw`Lens 1: $\dfrac{1}{d_{i1}} = \dfrac{1}{${texNum($.f1)}} - \dfrac{1}{${texNum($.d)}} \;\Longrightarrow\; d_{i1} = ${texNum($.di1)}\ \text{cm}$, $m_1 = -\dfrac{${texNum($.di1)}}{${texNum($.d)}} = ${texNum($.m1)}$`,
      String.raw`$d_{o2} = s - d_{i1} = ${qty($.sep, 'cm')} - ${qty($.di1, 'cm')} = ${texNum($.d2)}\ \text{cm}$`,
      String.raw`Lens 2: $\dfrac{1}{d_{i2}} = \dfrac{1}{${texNum($.f2)}} - \dfrac{1}{${texNum($.d2)}} \;\Longrightarrow\; d_{i2} = ${texNum($.di2)}\ \text{cm}$, $m_2 = -\dfrac{${texNum($.di2)}}{${texNum($.d2)}} = ${texNum($.m2)}$`,
      String.raw`$M = m_1 m_2 = (${texNum($.m1)})(${texNum($.m2)}) = ${texNum($.M)}$`,
    ],
    sim: {
      scenario: 'micro',
      setup: (s, $) => void Object.assign(s, { mode: 'micro', type: 'conv', fAbs: $.f1, f2: $.f2, do: $.d, sep: $.sep, ho: 2 }),
      read: (c) => ({ di1: c.len.i1.di, di2: c.len.i2.di, M: c.len.M }),
    },
    cases: [kase('hand', { f1: 10, f2: 15, d: 15, sep: 40 }, { di1: 30, di2: -30, M: -6 }), kase('lab microscope', { f1: 4, f2: 10, d: 5, sep: 27.142857142857146 }, { di1: 20, di2: -25, M: -14 })],
  }),

  // ================================================================= 62
  problem({
    ...E7, id: 'e7.62.magnifier', ch: '62', lab: 'lenses', title: 'Simple magnifier', kind: 'numeric', topics: ['instruments'],
    vars: { f: range(2, 20, 0.5, 'cm'), where: choice([1, 'at infinity (relaxed eye)'], [2, 'at the near point (25 cm)']) },
    derive: ($) => ({ M: $.where === 1 ? 25 / $.f : 1 + 25 / $.f }),
    text: (T) => `A magnifying glass has f = ${T.f} cm. What is its angular magnification when the image is ${T.where}?`,
    parts: [num('M', ($) => $.M, '×')],
    steps: ($, f) => [
      String.raw`Relaxed eye: $M = \dfrac{25}{f}$. Image at the near point: $M = 1 + \dfrac{25}{f}$.`,
      String.raw`$M = ${$.where === 1 ? '' : '1 + '}\dfrac{25\ \text{cm}}{${qty($.f, 'cm')}} = ${texNum($.M)}\times$`,
    ],
    sim: { scenario: 'conv-in', setup: (s, $) => void Object.assign(s, { mode: 'single', type: 'conv', fAbs: Math.max(6, $.f), do: 0.8 * Math.max(6, $.f) }) },
    cases: [kase('relaxed', { f: 5, where: 1 }, { M: 5 }), kase('near point', { f: 5, where: 2 }, { M: 6 })],
  }),
  problem({
    ...E7, id: 'e7.62.telescope', ch: '62', lab: 'lenses', title: 'Refracting telescope', kind: 'numeric', topics: ['instruments'],
    vars: { fo: range(20, 200, 5, 'cm'), fe: range(1, 10, 0.5, 'cm') },
    derive: ($) => ({ M: -$.fo / $.fe, L: $.fo + $.fe }),
    text: (T) => `A Keplerian telescope has an objective with f = ${T.fo} cm and an eyepiece with f = ${T.fe} cm. Find its angular magnification (relaxed eye) and its length.`,
    parts: [
      sym('M_sym', '-fo/fe', { fo: 'cm', fe: 'cm' }, ($) => $.M, { unit: '1', label: String.raw`$M$ as a formula (signed)` }),
      num('M', ($) => $.M, '×', { label: String.raw`$M$ (signed)` }),
      num('L', ($) => $.L, 'cm', { label: 'Tube length' }),
    ],
    steps: ($, f) => [
      String.raw`$M = -\dfrac{f_o}{f_e} = -\dfrac{${qty($.fo, 'cm')}}{${qty($.fe, 'cm')}} = ${texNum($.M)}$`,
      String.raw`$L = f_o + f_e = ${qty($.fo, 'cm')} + ${qty($.fe, 'cm')} = ${texNum($.L)}\ \text{cm}$`,
    ],
    sim: {
      scenario: 'tele',
      setup: (s, $) => void Object.assign(s, { mode: 'tele', fAbs: $.fo, f2: $.fe, do: 1e5, sep: $.fo + $.fe }),
      read: (c) => ({ M: c.len.angularIdeal }),
    },
    cases: [kase('lab', { fo: 40, fe: 10 }, { M: -4, L: 50 }), kase('hand', { fo: 100, fe: 2.5 }, { M: -40, L: 102.5 })],
  }),
  problem({
    ...E7, id: 'e7.62.microscope', ch: '62', lab: 'lenses', title: 'Compound microscope', kind: 'numeric', topics: ['instruments'],
    vars: { L: range(10, 25, 1, 'cm'), fo: range(0.2, 2, 0.1, 'cm'), fe: range(1, 5, 0.5, 'cm') },
    derive: ($) => ({ M: -($.L / $.fo) * (25 / $.fe) }),
    text: (T) => `A microscope has tube length ${T.L} cm, an objective with f = ${T.fo} cm, and an eyepiece with f = ${T.fe} cm. Estimate its overall magnification.`,
    parts: [num('M', ($) => $.M, '×', { label: 'M (signed)' })],
    steps: ($, f) => [String.raw`$M \approx -\dfrac{L}{f_o}\cdot\dfrac{25\ \text{cm}}{f_e} = -\dfrac{${qty($.L, 'cm')}}{${qty($.fo, 'cm')}}\cdot\dfrac{25\ \text{cm}}{${qty($.fe, 'cm')}} = ${texNum($.M)}$`],
    sim: { scenario: 'micro' },
    cases: [kase('hand', { L: 16, fo: 0.4, fe: 2.5 }, { M: -400 })],
  }),
  problem({
    ...E7, id: 'e7.62.eye', ch: '62', lab: 'lenses', title: 'Correcting vision', kind: 'numeric', level: 2, topics: ['instruments', 'eye'],
    vars: { kind: choice([1, 'nearsighted, with a far point of'], [2, 'farsighted, with a near point of']), p: range(30, 300, 10, 'cm') },
    derive: ($) => {
      const P = $.kind === 1 ? -100 / $.p : 4 - 100 / $.p;
      return { P, f: 100 / P };
    },
    valid: ($) => ($.kind === 1 ? true : $.p > 30),
    text: (T) => `A person is ${T.kind} ${T.p} cm. What contact lens power (in diopters) corrects this? (Use a normal near point of 25 cm.)`,
    parts: [num('P', ($) => $.P, 'D'), num('f', ($) => $.f, 'cm')],
    hints: [
      String.raw`Nearsighted: a distant object must form an image at the far point, so $f = -(\text{far point})$.`,
      String.raw`Farsighted: an object at 25 cm must form an image at the near point, so $\dfrac{1}{f} = \dfrac{1}{25} - \dfrac{1}{\text{NP}}$.`,
    ],
    steps: ($, f) => [String.raw`$P = ${texNum($.P)}\ \text{D}$ ($f = ${texNum($.f)}\ \text{cm}$)`],
    cases: [kase('myopia', { kind: 1, p: 200 }, { P: -0.5, f: -200 }), kase('hyperopia', { kind: 2, p: 100 }, { P: 3, f: 33.33 })],
  }),
];
