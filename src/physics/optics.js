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

function atX(a, b, x) {
  const dx = b.x - a.x;
  if (Math.abs(dx) < 1e-12) return { x, y: a.y };
  const t = (x - a.x) / dx;
  return { x, y: a.y + t * (b.y - a.y) };
}

function extend(p, dir, len) {
  const n = Math.hypot(dir.x, dir.y) || 1;
  return { x: p.x + (dir.x / n) * len, y: p.y + (dir.y / n) * len };
}

/**
 * Three principal rays for a thin lens (kind='lens') or spherical mirror (kind='mirror').
 * Coordinates in the same units as f, do, ho (cm).
 */
export function principalRays({ f, do: d_o, ho, kind = 'lens', span = 80 }) {
  const img = imageOf({ f, do: d_o, ho, kind });
  const obj = { x: -d_o, y: ho };
  const lensX = 0;
  const rays = [];
  const nearF = -f;

  // Ray 1: parallel to axis, then through (lens far / mirror) F.
  const hit1 = { x: lensX, y: ho };
  if (kind === 'lens') {
    const out1 = img.infinite ? extend(hit1, { x: 1, y: -ho / f }, span) : { x: img.imageX, y: img.hi };
    rays.push([obj, hit1, out1]);
  } else {
    const out1 = img.infinite ? extend(hit1, { x: -f, y: -ho }, span) : { x: img.imageX, y: img.hi };
    rays.push([obj, hit1, out1]);
  }

  // Ray 2: through the optical center (lens undeviated; mirror through C = 2f).
  if (kind === 'lens') {
    const out2 = img.infinite ? extend({ x: 0, y: 0 }, { x: d_o, y: -ho }, span) : { x: img.imageX, y: img.hi };
    rays.push([obj, { x: 0, y: 0 }, out2]);
  } else {
    const C = { x: -2 * f, y: 0 };
    const hit2 = atX(obj, C, 0);
    const out2 = img.infinite ? extend(hit2, { x: obj.x - hit2.x, y: obj.y - hit2.y }, span) : { x: img.imageX, y: img.hi };
    rays.push([obj, hit2, out2]);
  }

  // Ray 3: through near F, then parallel to the axis. Skip when the object sits on F.
  if (Math.abs(d_o - Math.abs(f)) > 1e-6) {
    const throughF = atX(obj, { x: nearF, y: 0 }, 0);
    if (kind === 'lens') {
      const out3 = { x: span, y: throughF.y };
      if (img.infinite) rays.push([obj, throughF, out3]);
      else rays.push([obj, throughF, { x: img.imageX, y: img.hi }]);
    } else {
      const out3 = { x: -span, y: throughF.y };
      if (Number.isFinite(throughF.y)) {
        rays.push([obj, throughF, img.infinite ? out3 : { x: img.imageX, y: img.hi }]);
      }
    }
  }

  return { img, obj, rays, F: nearF, C: kind === 'mirror' ? -2 * f : null };
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
