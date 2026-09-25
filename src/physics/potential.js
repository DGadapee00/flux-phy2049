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

export function potentialContributions(p, charges, extraE = null, soften = SOFTEN) {
  const rows = charges.map((c) => ({
    id: c.id,
    q: c.q,
    V: potentialAt(p, [c], null, soften),
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
export function gradientCheck(p, charges, extraE = null, h = 0.012, soften = SOFTEN) {
  const Vp = potentialAt({ x: p.x + h, y: p.y, z: p.z }, charges, extraE, soften);
  const Vm = potentialAt({ x: p.x - h, y: p.y, z: p.z }, charges, extraE, soften);
  const dVdx = (Vp - Vm) / (2 * h);
  const E = fieldAt(p, charges, extraE, soften);
  return { dVdx, Ex: E.x, negdVdx: -dVdx, E };
}

/**
 * Marching-squares contours of V on the work plane ('xz', the floor, or 'xy', standing up).
 * `half` is the half-width in meters — the labs pass the part of the scene that is on screen, so
 * the contours follow the view's scale instead of a fixed 1 m box. Returns segments in 3D.
 */
export function contourLines(charges, extraE, opts = {}) {
  const { plane = 'xz', half = 1.05, at = 0, n = 84, nLevels = 9, soften = SOFTEN } = opts;
  const [a1, a2] = plane === 'xy' ? ['x', 'y'] : ['x', 'z'];
  const off = plane === 'xy' ? 'z' : 'y';
  const min = -half;
  const d = (2 * half) / (n - 1);
  const grid = new Float64Array(n * n);
  const p = { x: 0, y: 0, z: 0 };
  p[off] = at;
  let vmin = Infinity;
  let vmax = -Infinity;
  for (let i = 0; i < n; i++) {
    p[a1] = min + i * d;
    for (let j = 0; j < n; j++) {
      p[a2] = min + j * d;
      const V = potentialAt(p, charges, extraE, soften);
      grid[i * n + j] = V;
      if (Number.isFinite(V)) {
        if (V < vmin) vmin = V;
        if (V > vmax) vmax = V;
      }
    }
  }
  if (!Number.isFinite(vmin) || vmax - vmin < 1e-9) return { lines: [], vmin: 0, vmax: 0 };
  /*
   * Levels at evenly spaced fractions of the view's area rather than of the V range. V ~ 1/r runs off
   * to huge values at a charge, so even steps in V put almost every ring in the few grid cells round
   * it (drawn as jagged octagons) and leave the rest of the view empty. Quantiles spread the rings
   * over what is on screen. V = 0 is kept as a level whenever it is in range: the dipole's
   * midplane, and every "where is V zero" problem, depend on seeing exactly that line.
   */
  const sorted = Array.from(grid).filter(Number.isFinite).sort((x, y) => x - y);
  const levels = [];
  for (let k = 1; k <= nLevels; k++) {
    const v = sorted[Math.min(sorted.length - 1, Math.floor((sorted.length * k) / (nLevels + 1)))];
    if (!levels.length || v - levels[levels.length - 1] > 1e-12 * (vmax - vmin)) levels.push(v);
  }
  if (vmin < 0 && vmax > 0 && levels.length) {
    let best = 0;
    levels.forEach((v, i) => {
      if (Math.abs(v) < Math.abs(levels[best])) best = i;
    });
    levels[best] = 0;
  }
  const point = (u, v) => {
    const q = { x: 0, y: 0, z: 0 };
    q[a1] = u;
    q[a2] = v;
    q[off] = at;
    return q;
  };
  const lines = [];
  for (const level of levels) {
    const segs = [];
    for (let i = 0; i < n - 1; i++) {
      for (let j = 0; j < n - 1; j++) {
        const u0 = min + i * d;
        const v0 = min + j * d;
        const v00 = grid[i * n + j];
        const v10 = grid[(i + 1) * n + j];
        const v11 = grid[(i + 1) * n + (j + 1)];
        const v01 = grid[i * n + (j + 1)];
        const pts = [];
        lerpEdge(pts, u0, v0, u0 + d, v0, v00, v10, level);
        lerpEdge(pts, u0 + d, v0, u0 + d, v0 + d, v10, v11, level);
        lerpEdge(pts, u0, v0 + d, u0 + d, v0 + d, v01, v11, level);
        lerpEdge(pts, u0, v0, u0, v0 + d, v00, v01, level);
        if (pts.length >= 4) segs.push([point(pts[0], pts[1]), point(pts[2], pts[3])]);
        // A saddle cell crosses the level four times: that is two segments, not one.
        if (pts.length >= 8) segs.push([point(pts[4], pts[5]), point(pts[6], pts[7])]);
      }
    }
    // Colour by rank (low → high), matching the legend, since the levels are no longer evenly spaced in V.
    if (segs.length) lines.push({ level, segs, t: (levels.indexOf(level) + 1) / (levels.length + 1) });
  }
  return { lines, vmin, vmax };
}

function lerpEdge(out, u1, v1p, u2, v2p, v1, v2, level) {
  if (!Number.isFinite(v1) || !Number.isFinite(v2)) return;
  if ((v1 - level) * (v2 - level) > 0) return;
  if (v1 === v2) return;
  const t = (level - v1) / (v2 - v1);
  out.push(u1 + t * (u2 - u1), v1p + t * (v2p - v1p));
}
