import { K } from './constants.js';

/**
 * Finite line along x, −L/2..L/2, uniform λ. P at perpendicular distance d, offset x0 along the
 * line: P = (x0, d, 0). x0 = 0 is the perpendicular bisector, x0 = ±L/2 sits above an end, and
 * |x0| > L/2 puts P off the end entirely.
 *
 * Measuring from P, the rod runs from u1 = −L/2 − x0 to u2 = L/2 − x0, and
 *
 *   E_y = (kλ/d)[ u2/r2 − u1/r1 ]   = (kλ/d)(sinθ1 + sinθ2)
 *   E_x = kλ[ 1/r2 − 1/r1 ]
 *
 * with r = √(u² + d²) at each end. On the bisector u1 = −u2, so E_x vanishes and E_y collapses to
 * the symmetric (kλ/d)(2 sinθ) — which is why the cancellation argument only works there.
 */
export function linePerpField(lambda, L, d, x0 = 0) {
  const u1 = -L / 2 - x0;
  const u2 = L / 2 - x0;
  const r1 = Math.hypot(u1, d);
  const r2 = Math.hypot(u2, d);
  // On the line itself, past an end (d = 0), there is no perpendicular component to divide out.
  const Ey = d > 0 ? ((K * lambda) / d) * (u2 / r2 - u1 / r1) : 0;
  const Ex = K * lambda * (1 / r2 - 1 / r1);
  return {
    E: { x: Ex, y: Ey, z: 0 },
    mag: Math.hypot(Ex, Ey),
    // Angles from the perpendicular at P out to each end, signed so that E_y = (kλ/d)(sinθ1+sinθ2).
    theta1: Math.atan2(-u1, d),
    theta2: Math.atan2(u2, d),
    r1,
    r2,
    // Kept for the symmetric case, where both ends are the same distance away.
    theta: Math.atan2(u2, d),
    rEnd: r2,
  };
}

/** Numerical Riemann sum for the same line, n slices. */
export function linePerpNumerical(lambda, L, d, n, x0 = 0) {
  const dx = L / n;
  const dq = lambda * dx;
  let Ex = 0;
  let Ey = 0;
  const pieces = [];
  for (let i = 0; i < n; i++) {
    const x = -L / 2 + (i + 0.5) * dx;
    const rx = x0 - x;
    const ry = d;
    const rz = 0;
    const r2 = rx * rx + ry * ry + rz * rz;
    const r = Math.sqrt(r2);
    const s = (K * dq) / (r2 * r);
    const dEx = s * rx;
    const dEy = s * ry;
    const dEz = 0;
    Ex += dEx;
    Ey += dEy;
    pieces.push({
      x,
      y: 0,
      z: 0,
      dq,
      r,
      rx,
      ry,
      rz,
      dE: { x: dEx, y: dEy, z: dEz },
      Px: x0,
      Py: d,
      Pz: 0,
    });
  }
  return { E: { x: Ex, y: Ey, z: 0 }, mag: Math.hypot(Ex, Ey), pieces };
}

/**
 * Arc of radius a in the xz plane, total Q spread uniformly, centred on +x and spanning `span`
 * radians. P on the axis at (0, y, 0). span = 2π is the closed ring.
 *
 * Every element is the same distance r = √(a²+y²) from P, so with λ = Q/(a·span):
 *
 *   E_y = kQy/r³                          — independent of span
 *   E_x = −2kQa·sin(span/2) / (span·r³)   — the piece symmetry kills on a closed ring
 *
 * E_y not depending on the span is worth noticing: closing the ring up changes nothing about the
 * axial field, it only cancels E_x. And at y = 0 with span = π this gives E_x = −2kQ/(πa²), the
 * textbook 2kλ/R at the centre of a semicircle.
 */
export function ringAxisField(Q, a, y, span = 2 * Math.PI) {
  const r2 = y * y + a * a;
  const r = Math.sqrt(r2);
  const r3 = r2 * r;
  const Ey = (K * Q * y) / r3;
  const Ex = (-2 * K * Q * a * Math.sin(span / 2)) / (span * r3);
  return { E: { x: Ex, y: Ey, z: 0 }, mag: Math.hypot(Ex, Ey), r, span };
}

/**
 * Uniformly charged circular plate of radius R in the xz plane, total Q, P on the axis at (0,y,0).
 *
 * In polar coordinates on the plate, dq = σ (s ds)(dθ). Every point of the ring at radius s is the
 * same distance from P, so the θ integral is just 2π and the plate collapses to a stack of rings:
 *
 *   dq = 2πσ s ds,  dE_y = k·dq·y/(s²+y²)^{3/2},  E_y = 2πkσ[1 − |y|/√(y²+R²)] sgn(y)
 *
 * with σ = Q/(πR²). As R → ∞ the bracket → 1 and this is the infinite sheet, 2πkσ = σ/2ε₀.
 */
export function diskAxisField(Q, R, y) {
  const sigma = Q / (Math.PI * R * R);
  const ay = Math.abs(y);
  const Ey = 2 * Math.PI * K * sigma * Math.sign(y) * (1 - ay / Math.hypot(ay, R));
  return { E: { x: 0, y: Ey, z: 0 }, mag: Math.abs(Ey), sigma, rEdge: Math.hypot(R, y) };
}

/** Riemann sum over the plate's radius: n concentric rings, each already integrated over θ. */
export function diskAxisNumerical(Q, R, y, n, x0 = 0) {
  const sigma = Q / (Math.PI * R * R);
  const ds = R / n;
  let Ey = 0;
  const pieces = [];
  for (let i = 0; i < n; i++) {
    const sRad = (i + 0.5) * ds;
    const dq = sigma * 2 * Math.PI * sRad * ds;
    const r2 = sRad * sRad + y * y;
    const r = Math.sqrt(r2);
    const dEy = (K * dq * y) / (r2 * r);
    Ey += dEy;
    // Marker walks round by the golden angle so successive rings are told apart in the scene.
    const t = i * 2.39996323;
    pieces.push({
      x: sRad * Math.cos(t),
      y: 0,
      z: sRad * Math.sin(t),
      s: sRad,
      ds,
      dq,
      r,
      rx: -sRad * Math.cos(t),
      ry: y,
      rz: -sRad * Math.sin(t),
      dE: { x: 0, y: dEy, z: 0 },
      Px: x0,
      Py: y,
      Pz: 0,
    });
  }
  return { E: { x: 0, y: Ey, z: 0 }, mag: Math.abs(Ey), pieces, sigma };
}

export function diskAxisPotential(Q, R, y) {
  const sigma = Q / (Math.PI * R * R);
  const V = 2 * Math.PI * K * sigma * (Math.hypot(y, R) - Math.abs(y));
  return { V, sigma };
}

export function diskAxisPotentialNumerical(Q, R, y, n) {
  const sigma = Q / (Math.PI * R * R);
  const ds = R / n;
  let V = 0;
  const pieces = [];
  for (let i = 0; i < n; i++) {
    const sRad = (i + 0.5) * ds;
    const dq = sigma * 2 * Math.PI * sRad * ds;
    const r = Math.hypot(sRad, y);
    const dV = (K * dq) / r;
    V += dV;
    const t = i * 2.39996323;
    pieces.push({
      x: sRad * Math.cos(t),
      y: 0,
      z: sRad * Math.sin(t),
      s: sRad,
      ds,
      dq,
      r,
      rx: -sRad * Math.cos(t),
      ry: y,
      rz: -sRad * Math.sin(t),
      dE: { x: 0, y: 0, z: 0 },
      dV,
      Px: 0,
      Py: y,
      Pz: 0,
    });
  }
  return { V, pieces, sigma };
}

export function ringAxisNumerical(Q, a, y, n, span = 2 * Math.PI) {
  const dq = Q / n;
  let Ex = 0;
  let Ey = 0;
  let Ez = 0;
  const pieces = [];
  for (let i = 0; i < n; i++) {
    // Centred on +x so a partial arc keeps its symmetry axis there and E_z still cancels.
    const phi = -span / 2 + ((i + 0.5) / n) * span;
    const sx = a * Math.cos(phi);
    const sy = 0;
    const sz = a * Math.sin(phi);
    const rx = 0 - sx;
    const ry = y - sy;
    const rz = 0 - sz;
    const r2 = rx * rx + ry * ry + rz * rz;
    const r = Math.sqrt(r2);
    const s = (K * dq) / (r2 * r);
    const dEx = s * rx;
    const dEy = s * ry;
    const dEz = s * rz;
    Ex += dEx;
    Ey += dEy;
    Ez += dEz;
    pieces.push({
      x: sx,
      y: sy,
      z: sz,
      dq,
      r,
      rx,
      ry,
      rz,
      dE: { x: dEx, y: dEy, z: dEz },
      Px: 0,
      Py: y,
      Pz: 0,
    });
  }
  return { E: { x: Ex, y: Ey, z: Ez }, mag: Math.hypot(Ex, Ey, Ez), pieces };
}

/** E from a sphere of charge using Gauss: inside r<R, Q_enc = Q (r/R)³ if uniform. */
export function sphereUniformE(Q, R, r) {
  const mag = r < R ? (K * Q * r) / (R * R * R) : (K * Q) / (r * r);
  return mag;
}

/**
 * Potential on the perpendicular bisector of a finite line, −L/2..L/2.
 * V = kλ ln[(√((L/2)²+d²) + L/2) / (√((L/2)²+d²) − L/2)]
 */
export function linePerpPotential(lambda, L, d, x0 = 0) {
  const u1 = -L / 2 - x0;
  const u2 = L / 2 - x0;
  // asinh(u/d) rather than ln(u + √(u²+d²)): the log form cancels to nothing once P is well off
  // the end, where u is large and negative and u + r is the difference of two near-equal numbers.
  // On the line past an end (d = 0, both ends on one side) the integral of du/|u| is a plain log:
  // V = kλ ln(far/near) — P a distance a beyond a rod of length L gives kλ ln[(L + a)/a].
  const V = d > 0
    ? K * lambda * (Math.asinh(u2 / d) - Math.asinh(u1 / d))
    : u1 * u2 > 0
      ? K * lambda * Math.log(Math.max(Math.abs(u1), Math.abs(u2)) / Math.min(Math.abs(u1), Math.abs(u2)))
      : Infinity;
  return { V, r1: Math.hypot(u1, d), r2: Math.hypot(u2, d), rEnd: Math.hypot(u2, d) };
}

export function linePerpPotentialNumerical(lambda, L, d, n, x0 = 0) {
  const dx = L / n;
  const dq = lambda * dx;
  let V = 0;
  const pieces = [];
  for (let i = 0; i < n; i++) {
    const x = -L / 2 + (i + 0.5) * dx;
    const r = Math.hypot(x - x0, d);
    const dV = (K * dq) / r;
    V += dV;
    pieces.push({
      x,
      y: 0,
      z: 0,
      dq,
      r,
      rx: x0 - x,
      ry: d,
      rz: 0,
      dE: { x: 0, y: 0, z: 0 },
      dV,
      Px: x0,
      Py: d,
      Pz: 0,
    });
  }
  return { V, pieces };
}

/** Ring on axis: V = k Q / √(a² + y²) = k λ 2π a / √(a² + y²) */
/** Every element sits at the same r, so V = kQ/r whatever the arc spans. */
export function ringAxisPotential(Q, a, y) {
  const r = Math.hypot(a, y);
  return { V: (K * Q) / r, r };
}

export function ringAxisPotentialNumerical(Q, a, y, n, span = 2 * Math.PI) {
  const dq = Q / n;
  let V = 0;
  const pieces = [];
  for (let i = 0; i < n; i++) {
    const phi = -span / 2 + ((i + 0.5) / n) * span;
    const sx = a * Math.cos(phi);
    const sz = a * Math.sin(phi);
    const r = Math.hypot(sx, y, sz);
    const dV = (K * dq) / r;
    V += dV;
    pieces.push({
      x: sx,
      y: 0,
      z: sz,
      dq,
      r,
      rx: -sx,
      ry: y,
      rz: -sz,
      dE: { x: 0, y: 0, z: 0 },
      dV,
      Px: 0,
      Py: y,
      Pz: 0,
    });
  }
  return { V, pieces };
}
