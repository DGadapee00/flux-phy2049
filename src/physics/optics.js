/** Geometric optics for Montgomery PHY 2049: Snell, TIR, thin lens / spherical mirror. */

export const MEDIA = [
  { id: 'air', name: 'Air', n: 1.0 },
  { id: 'water', name: 'Water', n: 1.33 },
  { id: 'glass', name: 'Glass', n: 1.5 },
  { id: 'diamond', name: 'Diamond', n: 2.42 },
];

export function mediaById(id) {
  return MEDIA.find((m) => m.id === id) || MEDIA[0];
}

/** Critical angle for TIR going n1 → n2. Null if n1 ≤ n2. */
export function criticalAngle(n1, n2) {
  if (n1 <= n2) return null;
  return Math.asin(n2 / n1);
}

/**
 * Snell's law. Angles from the normal, radians, in [0, π/2).
 * Reflected angle always equals θ1. θ2 is null on TIR.
 */
export function snell(n1, theta1, n2) {
  const thetaC = criticalAngle(n1, n2);
  const s2 = (n1 / n2) * Math.sin(theta1);
  if (thetaC != null && theta1 > thetaC + 1e-12) {
    return { tir: true, theta2: null, thetaR: theta1, thetaC };
  }
  const s = Math.max(-1, Math.min(1, s2));
  return { tir: false, theta2: Math.asin(s), thetaR: theta1, thetaC };
}

function describeImage(di, m) {
  if (!Number.isFinite(di)) return 'at infinity';
  const loc = di > 0 ? 'real' : 'virtual';
  const ori = m < 0 ? 'inverted' : 'upright';
  const am = Math.abs(m);
  const size = am > 1.02 ? 'enlarged' : am < 0.98 ? 'reduced' : 'same size';
  return `${loc}, ${ori}, ${size}`;
}

/**
 * Thin-lens / spherical-mirror equation.
 * f > 0 converging (convex lens, concave mirror). do > 0 real object.
 * 1/f = 1/do + 1/di,  m = −di/do = hi/ho.
 * kind 'lens': real image at x = +di (right). kind 'mirror': real image at x = −di (in front).
 */
export function imageOf({ f, do: d_o, ho = 1, kind = 'lens' }) {
  const inv = 1 / f - 1 / d_o;
  if (!Number.isFinite(d_o) || Math.abs(d_o) < 1e-12 || Math.abs(inv) < 1e-12) {
    return {
      di: Infinity,
      m: Infinity,
      hi: Infinity,
      real: false,
      inverted: false,
      infinite: true,
      type: 'at infinity',
      objectX: -d_o,
      imageX: kind === 'mirror' ? -Infinity : Infinity,
    };
  }
  const di = 1 / inv;
  const m = -di / d_o;
  const hi = m * ho;
  return {
    di,
    m,
    hi,
    real: di > 0,
    inverted: m < 0,
    infinite: false,
    type: describeImage(di, m),
    objectX: -d_o,
    imageX: kind === 'mirror' ? -di : di,
  };
}

/** Lens 1 at x=0, lens 2 at x=sep. do2 = sep − di1. */
export function twoLenses({ f1, f2, do1, ho, sep }) {
  const i1 = imageOf({ f: f1, do: do1, ho, kind: 'lens' });
  if (i1.infinite) return { i1, i2: null, do2: Infinity, M: Infinity };
  const do2 = sep - i1.di;
  const i2 = imageOf({ f: f2, do: do2, ho: i1.hi, kind: 'lens' });
  const M = i2.infinite ? Infinity : i2.hi / ho;
  return { i1, i2, do2, M };
}

/**
 * Paraxial thin-element ray transfer. elements: [{ x, f }] in order along +x.
 * Between elements y changes by slope·Δx; at an element slope → slope − y/f.
 * A mirror is traced as a lens and unfolded by the caller (outgoing x → −x).
 * Returns the vertices from the start, through each element, to xEnd, plus the final slope.
 */
export function traceRay(elements, start, slope, xEnd) {
  const pts = [{ x: start.x, y: start.y }];
  let x = start.x;
  let y = start.y;
  let m = slope;
  for (const el of elements) {
    y += m * (el.x - x);
    x = el.x;
    pts.push({ x, y });
    m -= y / el.f;
  }
  pts.push({ x: xEnd, y: y + m * (xEnd - x) });
  return { pts, slope: m, exit: { x, y } };
}

/**
 * The three principal rays from the object tip, for a thin lens (kind 'lens') or spherical mirror
 * (kind 'mirror'), element at x = 0, object at x = −d_o. Units follow f, d_o, h_o (cm).
 *
 * Each ray is split the way a diagram should draw it:
 *   incoming  — object tip → element (always a real ray, solid)
 *   outgoing  — element → far edge (the real refracted / reflected ray, solid)
 *   extension — element → virtual image, backward along the outgoing ray (dashed), or null
 *
 * Lens rays: parallel → F, through the center, through the near F → parallel.
 * Mirror rays: parallel → F, toward C (reflects back on itself), through F → parallel.
 */
export function principalRays({ f, do: d_o, ho, kind = 'lens', span = 80 }) {
  const img = imageOf({ f, do: d_o, ho, kind });
  const obj = { x: -d_o, y: ho };
  const defs = [{ name: kind === 'mirror' ? 'parallel → F' : 'parallel → F', m: 0 }];
  if (kind === 'lens') defs.push({ name: 'through the center', m: -ho / d_o });
  else if (Math.abs(d_o - 2 * f) > 1e-6) defs.push({ name: 'toward C', m: -ho / (d_o - 2 * f) });
  else defs.push({ name: 'to the vertex', m: -ho / d_o });
  if (Math.abs(d_o - f) > 1e-6) defs.push({ name: 'through F → parallel', m: -ho / (d_o - f) });

  // Unfold: a mirror is a lens whose outgoing side is flipped back toward the object.
  const sx = kind === 'mirror' ? -1 : 1;
  const reach = Math.max(span, Number.isFinite(img.di) ? Math.abs(img.di) + 15 : span);
  const rays = defs.map(({ name, m }) => {
    const y = ho + m * d_o;
    const mOut = m - y / f;
    const hit = { x: 0, y };
    const out = { x: sx * reach, y: y + mOut * reach };
    const extension = !img.infinite && !img.real ? [hit, { x: sx * img.di, y: y + mOut * img.di }] : null;
    return { name, incoming: [obj, hit], outgoing: [hit, out], extension, slopeOut: sx * mOut };
  });
  return { img, obj, rays, F: -f, C: kind === 'mirror' ? -2 * f : null };
}

export function fmtCm(x) {
  if (!Number.isFinite(x)) return '∞';
  const a = Math.abs(x);
  const s = x < 0 ? '−' : '';
  if (a >= 100) return `${s}${(a / 100).toFixed(2)} m`;
  return `${s}${a.toFixed(1)} cm`;
}

export function fmtDeg(rad) {
  return `${((rad * 180) / Math.PI).toFixed(1)}°`;
}
