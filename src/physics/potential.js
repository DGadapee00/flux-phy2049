import { K, SOFTEN } from './constants.js';
import { fieldAt } from './field.js';

/** Absolute potential V = Σ kq/r (V_∞ = 0) plus a uniform-field piece V = −E·r. */
export function potentialAt(p, charges, extraE = null, soften = SOFTEN) {
  let V = 0;
  const s2 = soften * soften;
  for (let i = 0; i < charges.length; i++) {
    const c = charges[i];
    const dx = p.x - c.x;
    const dy = p.y - c.y;
    const dz = p.z - c.z;
    const r2 = dx * dx + dy * dy + dz * dz;
    if (r2 < s2) continue;
    V += (K * c.q) / Math.sqrt(r2);
  }
  if (extraE) {
    V += -(extraE.x * p.x + extraE.y * p.y + extraE.z * p.z);
  }
  return V;
}

export function potentialContributions(p, charges, extraE = null) {
  const rows = charges.map((c) => ({
    id: c.id,
    q: c.q,
    V: potentialAt(p, [c]),
  }));
  if (extraE && (extraE.x || extraE.y || extraE.z)) {
    rows.push({
      id: 'uniform',
      q: 0,
      V: -(extraE.x * p.x + extraE.y * p.y + extraE.z * p.z),
    });
  }
  return rows;
}

export function potentialEnergy(q, V) {
  return q * V;
}

/** Work done by the field moving q from A to B: W = q(V_A − V_B) = −ΔPE. */
export function workByField(q, VA, VB) {
  return q * (VA - VB);
}

/** Numerical −dV/dx at p, compared with E_x. */
export function gradientCheck(p, charges, extraE = null, h = 0.012) {
  const Vp = potentialAt({ x: p.x + h, y: p.y, z: p.z }, charges, extraE);
  const Vm = potentialAt({ x: p.x - h, y: p.y, z: p.z }, charges, extraE);
  const dVdx = (Vp - Vm) / (2 * h);
  const E = fieldAt(p, charges, extraE);
  return { dVdx, Ex: E.x, negdVdx: -dVdx, E };
}

/**
 * Marching-squares contours of V(x,z) on the y = y0 plane.
 * Returns polylines { level, pts: [{x,y,z}] }.
 */
export function contourLines(charges, extraE, opts = {}) {
  const {
    y0 = 0,
    xmin = -1.05,
    xmax = 1.05,
    zmin = -1.05,
    zmax = 1.05,
    nx = 42,
    nz = 42,
    nLevels = 9,
  } = opts;
  const dx = (xmax - xmin) / (nx - 1);
  const dz = (zmax - zmin) / (nz - 1);
  const grid = new Float64Array(nx * nz);
  let vmin = Infinity;
  let vmax = -Infinity;
  for (let i = 0; i < nx; i++) {
    const x = xmin + i * dx;
    for (let j = 0; j < nz; j++) {
      const z = zmin + j * dz;
      const V = potentialAt({ x, y: y0, z }, charges, extraE);
      grid[i * nz + j] = V;
      if (Number.isFinite(V)) {
        if (V < vmin) vmin = V;
        if (V > vmax) vmax = V;
      }
    }
  }
  if (!Number.isFinite(vmin) || vmax - vmin < 1e-9) return { lines: [], vmin: 0, vmax: 0 };
  const span = vmax - vmin;
  const levels = [];
  for (let k = 1; k <= nLevels; k++) {
    levels.push(vmin + (span * k) / (nLevels + 1));
  }
  const lines = [];
  for (const level of levels) {
    const segs = [];
    for (let i = 0; i < nx - 1; i++) {
      for (let j = 0; j < nz - 1; j++) {
        const x0 = xmin + i * dx;
        const z0 = zmin + j * dz;
        const v00 = grid[i * nz + j];
        const v10 = grid[(i + 1) * nz + j];
        const v11 = grid[(i + 1) * nz + (j + 1)];
        const v01 = grid[i * nz + (j + 1)];
        const pts = [];
        lerpEdge(pts, x0, z0, x0 + dx, z0, v00, v10, level);
        lerpEdge(pts, x0 + dx, z0, x0 + dx, z0 + dz, v10, v11, level);
        lerpEdge(pts, x0, z0 + dz, x0 + dx, z0 + dz, v01, v11, level);
        lerpEdge(pts, x0, z0, x0, z0 + dz, v00, v01, level);
        if (pts.length >= 4) {
          segs.push([
            { x: pts[0], y: y0, z: pts[1] },
            { x: pts[2], y: y0, z: pts[3] },
          ]);
        }
      }
    }
    if (segs.length) lines.push({ level, segs });
  }
  return { lines, vmin, vmax };
}

function lerpEdge(out, x1, z1, x2, z2, v1, v2, level) {
  if (!Number.isFinite(v1) || !Number.isFinite(v2)) return;
  if ((v1 - level) * (v2 - level) > 0) return;
  if (v1 === v2) return;
  const t = (level - v1) / (v2 - v1);
  out.push(x1 + t * (x2 - x1), z1 + t * (z2 - z1));
}
