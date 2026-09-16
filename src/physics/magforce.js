import { QE } from './constants.js';
import { cross, scale, add } from './vec.js';
import { Bpolyline, wireAlongY } from './bfield.js';

/** Masses as printed on Montgomery's sheet. */
export const PARTICLES = {
  proton: { id: 'proton', name: 'Proton', q: QE, m: 1.67e-27 },
  electron: { id: 'electron', name: 'Electron', q: -QE, m: 9.11e-31 },
};

/** F = q(E + v × B) */
export function lorentzForce(q, v, E, B) {
  return scale(add(E, cross(v, B)), q);
}

/** F = I L × B for a straight segment. */
export function wireForce(I, L, B) {
  return scale(cross(L, B), I);
}

export function cyclotronRadius(m, vPerp, q, B) {
  return (m * vPerp) / (Math.abs(q) * B);
}

export function cyclotronPeriod(m, q, B) {
  return (2 * Math.PI * m) / (Math.abs(q) * B);
}

/** Boris push: exact rotation in B, energy-conserving; the standard integrator for q v × B. */
export function borisStep(s, q, m, E, B, dt) {
  const h = (q * dt) / (2 * m);
  const vmx = s.vx + h * E.x;
  const vmy = s.vy + h * E.y;
  const vmz = s.vz + h * E.z;
  const tx = h * B.x;
  const ty = h * B.y;
  const tz = h * B.z;
  const t2 = tx * tx + ty * ty + tz * tz;
  const sx = (2 * tx) / (1 + t2);
  const sy = (2 * ty) / (1 + t2);
  const sz = (2 * tz) / (1 + t2);
  const vpx = vmx + (vmy * tz - vmz * ty);
  const vpy = vmy + (vmz * tx - vmx * tz);
  const vpz = vmz + (vmx * ty - vmy * tx);
  const vx = vmx + (vpy * sz - vpz * sy);
  const vy = vmy + (vpz * sx - vpx * sz);
  const vz = vmz + (vpx * sy - vpy * sx);
  s.vx = vx + h * E.x;
  s.vy = vy + h * E.y;
  s.vz = vz + h * E.z;
  s.x += s.vx * dt;
  s.y += s.vy * dt;
  s.z += s.vz * dt;
}

/**
 * Integrate a charged particle in uniform E and B from `start`.
 * Stops after tMax or when it leaves a sphere of radius `bound` (meters) around the origin.
 */
export function trajectory({ q, m, v0, E, B, tMax, steps = 1200, bound = 1.6, start = { x: 0, y: 0, z: 0 } }) {
  const dt = tMax / steps;
  const s = { x: start.x, y: start.y, z: start.z, vx: v0.x, vy: v0.y, vz: v0.z };
  const pts = [{ x: s.x, y: s.y, z: s.z, vx: s.vx, vy: s.vy, vz: s.vz, t: 0 }];
  let escaped = false;
  for (let i = 1; i <= steps; i++) {
    borisStep(s, q, m, E, B, dt);
    pts.push({ x: s.x, y: s.y, z: s.z, vx: s.vx, vy: s.vy, vz: s.vz, t: i * dt });
    if (s.x * s.x + s.y * s.y + s.z * s.z > bound * bound) {
      escaped = true;
      break;
    }
  }
  return { pts, dt, escaped };
}

/**
 * Force on a length L of wire 2 (x = d, current I2 along +ŷ) from a long wire 1 on the y-axis
 * (current I1 along +ŷ), by summing I₂ dl × B₁ with B₁ from Biot–Savart. Negative F.x = attraction.
 */
export function parallelWireForceNumerical(I1, I2, d, L, H = 6) {
  const wire1 = wireAlongY(-H, H, 240);
  const m = 40;
  const dy = L / m;
  const F = { x: 0, y: 0, z: 0 };
  for (let i = 0; i < m; i++) {
    const p = { x: d, y: -L / 2 + (i + 0.5) * dy, z: 0 };
    const B = Bpolyline(I1, wire1, p, 2);
    const dF = scale(cross({ x: 0, y: dy, z: 0 }, B), I2);
    F.x += dF.x;
    F.y += dF.y;
    F.z += dF.z;
  }
  return F;
}
