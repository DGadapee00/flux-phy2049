import { K, SOFTEN } from './constants.js';
import { distSq, len } from './vec.js';

/** E at point p from a list of point charges. extraE is a uniform field (N/C). */
export function fieldAt(p, charges, extraE = null, soften = SOFTEN) {
  let Ex = extraE ? extraE.x : 0;
  let Ey = extraE ? extraE.y : 0;
  let Ez = extraE ? extraE.z : 0;
  const s2 = soften * soften;
  for (let i = 0; i < charges.length; i++) {
    const c = charges[i];
    const dx = p.x - c.x;
    const dy = p.y - c.y;
    const dz = p.z - c.z;
    const r2 = dx * dx + dy * dy + dz * dz;
    if (r2 < s2) continue;
    const r = Math.sqrt(r2);
    const s = (K * c.q) / (r2 * r);
    Ex += s * dx;
    Ey += s * dy;
    Ez += s * dz;
  }
  return { x: Ex, y: Ey, z: Ez };
}

export function fieldMag(E) {
  return Math.sqrt(E.x * E.x + E.y * E.y + E.z * E.z);
}

/** Per-charge field contributions at p (superposition table). */
export function contributionsAt(p, charges, extraE = null, soften = SOFTEN) {
  const rows = charges.map((c) => {
    const E = fieldAt(p, [c], null, soften);
    return { id: c.id, q: c.q, E, mag: fieldMag(E) };
  });
  if (extraE && (extraE.x || extraE.y || extraE.z)) {
    rows.push({ id: 'uniform', q: 0, E: { ...extraE }, mag: fieldMag(extraE) });
  }
  return rows;
}

/** Force on charge i from all others: F = q E_others. */
export function forceOn(index, charges, soften = SOFTEN) {
  const c = charges[index];
  const others = charges.filter((_, j) => j !== index);
  const E = fieldAt(c, others, null, soften);
  return { x: c.q * E.x, y: c.q * E.y, z: c.q * E.z, E };
}

export function allForces(charges, soften = SOFTEN) {
  return charges.map((_, i) => forceOn(i, charges, soften));
}

/** Coulomb pair force on a from b (force on a). */
export function pairForce(a, b) {
  const dx = a.x - b.x;
  const dy = a.y - b.y;
  const dz = a.z - b.z;
  const r2 = dx * dx + dy * dy + dz * dz;
  if (r2 < 1e-12) return { x: 0, y: 0, z: 0, mag: 0, r: 0 };
  const r = Math.sqrt(r2);
  const mag = (K * a.q * b.q) / r2;
  const s = mag / r;
  return { x: s * dx, y: s * dy, z: s * dz, mag: Math.abs(mag), r, signed: mag };
}

export function nearCharge(p, charges, rad = 0.045) {
  const r2 = rad * rad;
  for (const c of charges) {
    if (distSq(p, c) < r2) return c;
  }
  return null;
}

export { len };
