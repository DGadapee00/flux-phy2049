import { K } from './constants.js';

/**
 * Finite line along x, −L/2..L/2, uniform λ.
 * P on the perpendicular bisector at (0, d, 0).
 * E = (kλ/d)(sinθ1 + sinθ2) ŷ, with θ1 = θ2 = atan((L/2)/d).
 */
export function linePerpField(lambda, L, d) {
  const half = L / 2;
  const rEnd = Math.hypot(half, d);
  const sinT = half / rEnd;
  const Ey = ((K * lambda) / d) * (2 * sinT);
  return {
    E: { x: 0, y: Ey, z: 0 },
    mag: Math.abs(Ey),
    theta: Math.asin(Math.min(1, sinT)),
    rEnd,
  };
}

/** Numerical Riemann sum for the same line, n slices. */
export function linePerpNumerical(lambda, L, d, n) {
  const dx = L / n;
  const dq = lambda * dx;
  let Ex = 0;
  let Ey = 0;
  const pieces = [];
  for (let i = 0; i < n; i++) {
    const x = -L / 2 + (i + 0.5) * dx;
    const rx = 0 - x;
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
      Px: 0,
      Py: d,
      Pz: 0,
    });
  }
  return { E: { x: Ex, y: Ey, z: 0 }, mag: Math.hypot(Ex, Ey), pieces };
}

/**
 * Ring of radius a in the xz plane, total Q, P on axis at (0, y, 0).
 * E = k Q y / (y² + a²)^{3/2} ŷ
 */
export function ringAxisField(Q, a, y) {
  const r2 = y * y + a * a;
  const Ey = (K * Q * y) / Math.pow(r2, 1.5);
  return { E: { x: 0, y: Ey, z: 0 }, mag: Math.abs(Ey), r: Math.sqrt(r2) };
}

export function ringAxisNumerical(Q, a, y, n) {
  const dq = Q / n;
  let Ex = 0;
  let Ey = 0;
  let Ez = 0;
  const pieces = [];
  for (let i = 0; i < n; i++) {
    const phi = ((i + 0.5) / n) * 2 * Math.PI;
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
export function linePerpPotential(lambda, L, d) {
  const half = L / 2;
  const rEnd = Math.hypot(half, d);
  const V = K * lambda * Math.log((rEnd + half) / (rEnd - half));
  return { V, rEnd };
}

export function linePerpPotentialNumerical(lambda, L, d, n) {
  const dx = L / n;
  const dq = lambda * dx;
  let V = 0;
  const pieces = [];
  for (let i = 0; i < n; i++) {
    const x = -L / 2 + (i + 0.5) * dx;
    const r = Math.hypot(x, d);
    const dV = (K * dq) / r;
    V += dV;
    pieces.push({
      x,
      y: 0,
      z: 0,
      dq,
      r,
      rx: -x,
      ry: d,
      rz: 0,
      dE: { x: 0, y: 0, z: 0 },
      dV,
      Px: 0,
      Py: d,
      Pz: 0,
    });
  }
  return { V, pieces };
}

/** Ring on axis: V = k Q / √(a² + y²) = k λ 2π a / √(a² + y²) */
export function ringAxisPotential(Q, a, y) {
  const r = Math.hypot(a, y);
  return { V: (K * Q) / r, r };
}

export function ringAxisPotentialNumerical(Q, a, y, n) {
  const dq = Q / n;
  let V = 0;
  const pieces = [];
  for (let i = 0; i < n; i++) {
    const phi = ((i + 0.5) / n) * 2 * Math.PI;
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
