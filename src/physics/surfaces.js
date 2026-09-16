import { SURFACE_EPS } from './constants.js';
import { dist } from './vec.js';

function pushPatch(patches, p, n, u, v, w, h, dA, face) {
  patches.push({
    x: p.x,
    y: p.y,
    z: p.z,
    nx: n.x,
    ny: n.y,
    nz: n.z,
    ux: u.x,
    uy: u.y,
    uz: u.z,
    vx: v.x,
    vy: v.y,
    vz: v.z,
    w,
    h,
    dA,
    face,
  });
}

export function sampleSphere(R, origin, nTheta = 22, nPhi = 44) {
  const patches = [];
  const dTheta = Math.PI / nTheta;
  const dPhi = (2 * Math.PI) / nPhi;
  const o = origin;
  for (let i = 0; i < nTheta; i++) {
    const theta = (i + 0.5) * dTheta;
    const st = Math.sin(theta);
    const ct = Math.cos(theta);
    const dA = R * R * st * dTheta * dPhi;
    const h = R * dTheta;
    const w = R * st * dPhi;
    for (let j = 0; j < nPhi; j++) {
      const phi = (j + 0.5) * dPhi;
      const cp = Math.cos(phi);
      const sp = Math.sin(phi);
      const n = { x: st * cp, y: ct, z: st * sp };
      const u = { x: -sp, y: 0, z: cp };
      const v = { x: ct * cp, y: -st, z: ct * sp };
      const p = { x: o.x + R * n.x, y: o.y + R * n.y, z: o.z + R * n.z };
      pushPatch(patches, p, n, u, v, w, h, dA, 'sphere');
    }
  }
  return patches;
}

export function sampleCylinder(R, L, origin, nPhi = 36, nY = 16, nRad = 8, caps = true) {
  const patches = [];
  const o = origin;
  const dPhi = (2 * Math.PI) / nPhi;
  const dY = L / nY;
  const y0 = o.y - L / 2;

  for (let i = 0; i < nY; i++) {
    const y = y0 + (i + 0.5) * dY;
    for (let j = 0; j < nPhi; j++) {
      const phi = (j + 0.5) * dPhi;
      const cp = Math.cos(phi);
      const sp = Math.sin(phi);
      const n = { x: cp, y: 0, z: sp };
      const u = { x: -sp, y: 0, z: cp };
      const v = { x: 0, y: 1, z: 0 };
      const p = { x: o.x + R * cp, y, z: o.z + R * sp };
      const dA = R * dPhi * dY;
      pushPatch(patches, p, n, u, v, R * dPhi, dY, dA, 'wall');
    }
  }

  if (caps) {
    const dR = R / nRad;
    for (const sign of [1, -1]) {
      const y = o.y + sign * (L / 2);
      const n = { x: 0, y: sign, z: 0 };
      const u = { x: 1, y: 0, z: 0 };
      const v = { x: 0, y: 0, z: 1 };
      for (let i = 0; i < nRad; i++) {
        const rho0 = i * dR;
        const rho1 = (i + 1) * dR;
        const rho = 0.5 * (rho0 + rho1);
        const nPhiCap = Math.max(8, Math.round(nPhi * (rho / R)));
        const dPhiC = (2 * Math.PI) / nPhiCap;
        const dARing = Math.PI * (rho1 * rho1 - rho0 * rho0) / nPhiCap;
        const w = rho * dPhiC;
        const h = dR;
        for (let j = 0; j < nPhiCap; j++) {
          const phi = (j + 0.5) * dPhiC;
          const cp = Math.cos(phi);
          const sp = Math.sin(phi);
          const p = { x: o.x + rho * cp, y, z: o.z + rho * sp };
          const uu = { x: -sp, y: 0, z: cp };
          const vv = { x: -cp, y: 0, z: -sp };
          pushPatch(patches, p, n, uu, vv, w, h, dARing, sign > 0 ? 'cap+' : 'cap-');
        }
      }
    }
  }
  return patches;
}

export function sampleCube(half, origin, n = 12) {
  const patches = [];
  const o = origin;
  const s = 2 * half;
  const ds = s / n;
  const dA = ds * ds;
  const faces = [
    { n: { x: 1, y: 0, z: 0 }, u: { x: 0, y: 0, z: 1 }, v: { x: 0, y: 1, z: 0 }, c: { x: half, y: 0, z: 0 } },
    { n: { x: -1, y: 0, z: 0 }, u: { x: 0, y: 0, z: -1 }, v: { x: 0, y: 1, z: 0 }, c: { x: -half, y: 0, z: 0 } },
    { n: { x: 0, y: 1, z: 0 }, u: { x: 1, y: 0, z: 0 }, v: { x: 0, y: 0, z: 1 }, c: { x: 0, y: half, z: 0 } },
    { n: { x: 0, y: -1, z: 0 }, u: { x: 1, y: 0, z: 0 }, v: { x: 0, y: 0, z: -1 }, c: { x: 0, y: -half, z: 0 } },
    { n: { x: 0, y: 0, z: 1 }, u: { x: 1, y: 0, z: 0 }, v: { x: 0, y: 1, z: 0 }, c: { x: 0, y: 0, z: half } },
    { n: { x: 0, y: 0, z: -1 }, u: { x: -1, y: 0, z: 0 }, v: { x: 0, y: 1, z: 0 }, c: { x: 0, y: 0, z: -half } },
  ];
  for (const f of faces) {
    for (let i = 0; i < n; i++) {
      const a = -half + (i + 0.5) * ds;
      for (let j = 0; j < n; j++) {
        const b = -half + (j + 0.5) * ds;
        const p = {
          x: o.x + f.c.x + f.u.x * a + f.v.x * b,
          y: o.y + f.c.y + f.u.y * a + f.v.y * b,
          z: o.z + f.c.z + f.u.z * a + f.v.z * b,
        };
        pushPatch(patches, p, f.n, f.u, f.v, ds, ds, dA, 'cube');
      }
    }
  }
  return patches;
}

/** Open square of side 2R, tilted about x by `tilt` radians. n̂ = (0, cosα, sinα). */
export function sampleSquare(half, origin, tilt = 0, n = 16) {
  const patches = [];
  const o = origin;
  const ca = Math.cos(tilt);
  const sa = Math.sin(tilt);
  const N = { x: 0, y: ca, z: sa };
  const U = { x: 1, y: 0, z: 0 };
  const V = { x: 0, y: -sa, z: ca };
  const s = 2 * half;
  const ds = s / n;
  const dA = ds * ds;
  for (let i = 0; i < n; i++) {
    const a = -half + (i + 0.5) * ds;
    for (let j = 0; j < n; j++) {
      const b = -half + (j + 0.5) * ds;
      const p = {
        x: o.x + U.x * a + V.x * b,
        y: o.y + U.y * a + V.y * b,
        z: o.z + U.z * a + V.z * b,
      };
      pushPatch(patches, p, N, U, V, ds, ds, dA, 'square');
    }
  }
  return patches;
}

export function sampleSurface(surface) {
  const o = surface.origin;
  const R = surface.R;
  const L = surface.L;
  switch (surface.type) {
    case 'sphere':
      return sampleSphere(R, o);
    case 'cylinder':
      return sampleCylinder(R, L, o, 36, 14, 7, true);
    case 'pillbox':
      return sampleCylinder(R, L, o, 32, 4, 8, true);
    case 'cube':
      return sampleCube(R, o, 12);
    case 'square':
      return sampleSquare(R, o, surface.tilt || 0, 16);
    default:
      return sampleSphere(R, o);
  }
}

export function isClosed(type) {
  return type !== 'square';
}

export function chargeLocation(c, surface) {
  const o = surface.origin;
  const dx = c.x - o.x;
  const dy = c.y - o.y;
  const dz = c.z - o.z;
  const R = surface.R;
  const L = surface.L;
  switch (surface.type) {
    case 'sphere': {
      const d = Math.sqrt(dx * dx + dy * dy + dz * dz);
      if (Math.abs(d - R) < SURFACE_EPS) return 'on';
      return d < R ? 'in' : 'out';
    }
    case 'cylinder':
    case 'pillbox': {
      const rho = Math.sqrt(dx * dx + dz * dz);
      const ay = Math.abs(dy);
      const onWall = Math.abs(rho - R) < SURFACE_EPS && ay <= L / 2 + SURFACE_EPS;
      const onCap = Math.abs(ay - L / 2) < SURFACE_EPS && rho <= R + SURFACE_EPS;
      if (onWall || onCap) return 'on';
      return rho < R && ay < L / 2 ? 'in' : 'out';
    }
    case 'cube': {
      const ax = Math.abs(dx);
      const ay = Math.abs(dy);
      const az = Math.abs(dz);
      const inside = ax < R && ay < R && az < R;
      const outside = ax > R || ay > R || az > R;
      if (!inside && !outside) return 'on';
      if (
        (Math.abs(ax - R) < SURFACE_EPS && ay <= R + SURFACE_EPS && az <= R + SURFACE_EPS) ||
        (Math.abs(ay - R) < SURFACE_EPS && ax <= R + SURFACE_EPS && az <= R + SURFACE_EPS) ||
        (Math.abs(az - R) < SURFACE_EPS && ax <= R + SURFACE_EPS && ay <= R + SURFACE_EPS)
      ) {
        return 'on';
      }
      return inside ? 'in' : 'out';
    }
    default:
      return 'out';
  }
}

export function enclosedCharge(charges, surface) {
  if (!isClosed(surface.type)) return { Qin: 0, nIn: 0, nOn: 0, nOut: 0 };
  let Qin = 0;
  let nIn = 0;
  let nOn = 0;
  let nOut = 0;
  for (const c of charges) {
    const loc = chargeLocation(c, surface);
    if (loc === 'in') {
      Qin += c.q;
      nIn += 1;
    } else if (loc === 'on') {
      nOn += 1;
    } else {
      nOut += 1;
    }
  }
  return { Qin, nIn, nOn, nOut };
}

export function surfaceArea(surface) {
  const R = surface.R;
  const L = surface.L;
  switch (surface.type) {
    case 'sphere':
      return 4 * Math.PI * R * R;
    case 'cylinder':
      return 2 * Math.PI * R * L + 2 * Math.PI * R * R;
    case 'pillbox':
      return 2 * Math.PI * R * L + 2 * Math.PI * R * R;
    case 'cube':
      return 6 * (2 * R) * (2 * R);
    case 'square':
      return (2 * R) * (2 * R);
    default:
      return 0;
  }
}

export { dist };
