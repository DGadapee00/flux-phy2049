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

/** Loop of radius R in the xz plane, current I, probe on the y-axis at y = z. */
export function BloopAxis(I, R, z) {
  const d = R * R + z * z;
  return (MU0 * I * R * R) / (2 * Math.pow(d, 1.5));
}

/** Long solenoid: B = μ₀ n I along the axis, n = turns per meter. */
export function Bsolenoid(n, I) {
  return MU0 * n * I;
}

/** Parallel-wire force magnitude on length L: F = μ₀ I₁ I₂ L / (2π d). Attractive if currents same direction. */
export function FparallelWires(I1, I2, L, d) {
  return (MU0 * I1 * I2 * L) / (2 * Math.PI * d);
}

/** Cyclotron radius r = mv / (qB). */
export function cyclotronRadius(m, v, q, B) {
  return (m * v) / (Math.abs(q) * B);
}

/**
 * ∮ B · dl around a circular Amperian loop of radius R in the xz plane, centered on the origin.
 * `Bfn(probe) -> {x,y,z}` is the field. Returns the circulation and μ₀ I_enc if Ienc is given.
 */
export function ampereCirculation(Bfn, R, n = 64) {
  let acc = 0;
  const dphi = (2 * Math.PI) / n;
  for (let i = 0; i < n; i++) {
    const phi = (i + 0.5) * dphi;
    const p = { x: R * Math.cos(phi), y: 0, z: R * Math.sin(phi) };
    const B = Bfn(p);
    const dl = { x: -R * Math.sin(phi) * dphi, y: 0, z: R * Math.cos(phi) * dphi };
    acc += dot(B, dl);
  }
  return acc;
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

