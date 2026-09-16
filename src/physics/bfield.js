import { MU0 } from './constants.js';
import { cross, dot, len, scale } from './vec.js';

const FOURPI = 4 * Math.PI;
const SOFT = 1e-9;

/**
 * Biot–Savart for one segment: dB = (μ₀/4π) I (dl × r̂) / r²
 * `r` is the vector from the segment midpoint to the probe.
 */
export function dBiot(I, dl, r) {
  const rmag = len(r);
  if (rmag < SOFT) return { x: 0, y: 0, z: 0 };
  const cr = cross(dl, r);
  const k = (MU0 * I) / (FOURPI * rmag * rmag * rmag);
  return scale(cr, k);
}

/** Polyline wire: `points` are {x,y,z} vertices. Optional nSub subdivisions per segment. */
export function Bpolyline(I, points, probe, nSub = 8) {
  let Bx = 0;
  let By = 0;
  let Bz = 0;
  for (let s = 0; s < points.length - 1; s++) {
    const a = points[s];
    const b = points[s + 1];
    const dx = (b.x - a.x) / nSub;
    const dy = (b.y - a.y) / nSub;
    const dz = (b.z - a.z) / nSub;
    const dl = { x: dx, y: dy, z: dz };
    for (let i = 0; i < nSub; i++) {
      const mx = a.x + (i + 0.5) * dx;
      const my = a.y + (i + 0.5) * dy;
      const mz = a.z + (i + 0.5) * dz;
      const dB = dBiot(I, dl, { x: probe.x - mx, y: probe.y - my, z: probe.z - mz });
      Bx += dB.x;
      By += dB.y;
      Bz += dB.z;
    }
  }
  return { x: Bx, y: By, z: Bz };
}

/** Infinite straight wire along ŷ through the origin. B = (μ₀ I / 2π r) φ̂. */
export function BwireInfinite(I, r) {
  return (MU0 * I) / (2 * Math.PI * r);
}

/** Finite straight wire on the y-axis from y0 to y1: |B| = (μ₀I / 4πρ)(sinθ₂ − sinθ₁). */
export function BwireFinite(I, y0, y1, p) {
  const rho = Math.hypot(p.x, p.z);
  if (rho < 1e-9) return 0;
  const s1 = (y1 - p.y) / Math.hypot(y1 - p.y, rho);
  const s0 = (y0 - p.y) / Math.hypot(y0 - p.y, rho);
  return ((MU0 * I) / (4 * Math.PI * rho)) * (s1 - s0);
}

/**
 * Loop of radius R in the xz plane, probe on the y-axis at height z.
 * Positive I circulates counterclockwise seen from +y, so B points along +ŷ (right-hand rule).
 */
export function BloopAxis(I, R, z) {
  const d = R * R + z * z;
  return (MU0 * I * R * R) / (2 * Math.pow(d, 1.5));
}

/** Loop vertices, counterclockwise seen from +y (the orientation BloopAxis and amperianLoop assume). */
export function loopPoints(R, n = 48, y = 0) {
  const pts = [];
  for (let i = 0; i <= n; i++) {
    const phi = (i / n) * 2 * Math.PI;
    pts.push({ x: R * Math.cos(phi), y, z: -R * Math.sin(phi) });
  }
  return pts;
}

/** Helix of N turns, radius R, length L centered on the origin, counterclockwise seen from +y. */
export function helixPoints(R, L, N, perTurn = 16) {
  const pts = [];
  const n = N * perTurn;
  for (let i = 0; i <= n; i++) {
    const t = i / n;
    const phi = t * N * 2 * Math.PI;
    pts.push({ x: R * Math.cos(phi), y: -L / 2 + t * L, z: -R * Math.sin(phi) });
  }
  return pts;
}

/** Long solenoid: B = μ₀ n I along the axis, n = turns per meter. */
export function Bsolenoid(n, I) {
  return MU0 * n * I;
}

/** Finite solenoid (current sheet) on its axis, centered at y = 0: B = (μ₀nI/2)(cosα₂ − cosα₁). */
export function BsolenoidFiniteAxis(n, I, L, R, y) {
  const a = y + L / 2;
  const b = y - L / 2;
  return ((MU0 * n * I) / 2) * (a / Math.hypot(a, R) - b / Math.hypot(b, R));
}

/**
 * Infinitely long straight wire parallel to ŷ through (x0, z0), radius a, uniform J.
 * +I flows along +ŷ. Inside the wire only I·ρ²/a² is enclosed.
 */
export function BlongWire(I, x0, z0, a, p) {
  const rx = p.x - x0;
  const rz = p.z - z0;
  const rho2 = rx * rx + rz * rz;
  if (rho2 < 1e-18) return { x: 0, y: 0, z: 0 };
  const rho = Math.sqrt(rho2);
  const Iin = rho >= a ? I : (I * rho2) / (a * a);
  const mag = (MU0 * Iin) / (2 * Math.PI * rho);
  // φ̂ = ŷ × ρ̂
  return { x: mag * (rz / rho), y: 0, z: -mag * (rx / rho) };
}

/**
 * Circular Amperian loop in the xz plane centered at (cx, cz), counterclockwise seen from +y,
 * so current along +ŷ counts as positive I_enc. Midpoint rule with n pieces.
 */
export function amperianLoop(Bfn, cx, cz, R, n = 64) {
  const pieces = [];
  let circ = 0;
  const dphi = (2 * Math.PI) / n;
  for (let i = 0; i < n; i++) {
    const phi = (i + 0.5) * dphi;
    const p = { x: cx + R * Math.cos(phi), y: 0, z: cz - R * Math.sin(phi) };
    const dl = { x: -R * Math.sin(phi) * dphi, y: 0, z: -R * Math.cos(phi) * dphi };
    const B = Bfn(p);
    const bdl = dot(B, dl);
    circ += bdl;
    pieces.push({ p, dl, B, bdl, phi });
  }
  return { circ, pieces };
}

/** Area of intersection of two circles (radii r1, r2, centers d apart). */
export function circleOverlapArea(r1, r2, d) {
  if (d >= r1 + r2) return 0;
  if (d <= Math.abs(r1 - r2)) return Math.PI * Math.min(r1, r2) ** 2;
  const a1 = r1 * r1 * Math.acos((d * d + r1 * r1 - r2 * r2) / (2 * d * r1));
  const a2 = r2 * r2 * Math.acos((d * d + r2 * r2 - r1 * r1) / (2 * d * r2));
  const k = 0.5 * Math.sqrt((-d + r1 + r2) * (d + r1 - r2) * (d - r1 + r2) * (d + r1 + r2));
  return a1 + a2 - k;
}

/** Fraction of a wire's current (radius a, uniform J, center x0,z0) passing through a loop (R at cx,cz). */
export function enclosedFraction(R, cx, cz, x0, z0, a) {
  const d = Math.hypot(x0 - cx, z0 - cz);
  if (a < 1e-6) return d < R ? 1 : 0;
  return circleOverlapArea(R, a, d) / (Math.PI * a * a);
}

/** Parallel-wire force magnitude on length L: F = μ₀ I₁ I₂ L / (2π d). Attractive if currents same direction. */
export function FparallelWires(I1, I2, L, d) {
  return (MU0 * I1 * I2 * L) / (2 * Math.PI * d);
}

/** Cyclotron radius r = mv / (qB). */
export function cyclotronRadius(m, v, q, B) {
  return (m * v) / (Math.abs(q) * B);
}

/** ∮ B · dl around a circular loop of radius R centered on the origin (counterclockwise from +y). */
export function ampereCirculation(Bfn, R, n = 64) {
  return amperianLoop(Bfn, 0, 0, R, n).circ;
}

export function mu0I(Ienc) {
  return MU0 * Ienc;
}

/** Finite wire along y from y0 to y1, at x=z=0. Convenience for the long-wire numerical test. */
export function wireAlongY(y0, y1, n = 40) {
  const pts = [];
  for (let i = 0; i <= n; i++) {
    const t = i / n;
    pts.push({ x: 0, y: y0 + (y1 - y0) * t, z: 0 });
  }
  return pts;
}

