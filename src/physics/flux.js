import { EPS0 } from './constants.js';
import { fieldAt, fieldMag } from './field.js';
import { enclosedCharge, isClosed, sampleSurface, surfaceArea } from './surfaces.js';

export function integrateFlux(patches, charges, extraE = null) {
  let Phi = 0;
  let PhiWall = 0;
  let PhiCap = 0;
  let areaSum = 0;
  const samples = new Array(patches.length);
  for (let i = 0; i < patches.length; i++) {
    const p = patches[i];
    const E = fieldAt(p, charges, extraE);
    const En = E.x * p.nx + E.y * p.ny + E.z * p.nz;
    const dPhi = En * p.dA;
    Phi += dPhi;
    areaSum += p.dA;
    if (p.face === 'wall') PhiWall += dPhi;
    else if (p.face === 'cap+' || p.face === 'cap-') PhiCap += dPhi;
    samples[i] = { En, dPhi, mag: fieldMag(E), Ex: E.x, Ey: E.y, Ez: E.z };
  }
  return { Phi, PhiWall, PhiCap, areaSum, samples };
}

export function gaussPrediction(Qin) {
  return Qin / EPS0;
}

export function matchQuality(Phi, PhiG, Qabs = 0) {
  // When Q_in = 0, |Φ| itself is a bad scale (any residual looks like 0% match).
  // Compare against the flux those charges would produce if enclosed.
  const char = Math.max(Math.abs(PhiG), Math.abs(Qabs) / EPS0, 1e3);
  const rel = Math.abs(Phi - PhiG) / char;
  return { rel, pct: Math.max(0, (1 - rel) * 100) };
}

export function computeGauss(surface, charges, extraE = null) {
  const patches = sampleSurface(surface);
  const flux = integrateFlux(patches, charges, extraE);
  const enc = enclosedCharge(charges, surface);
  const closed = isClosed(surface.type);
  const PhiG = closed ? gaussPrediction(enc.Qin) : null;
  const Qabs = charges.reduce((s, c) => s + Math.abs(c.q), 0);
  const match = closed ? matchQuality(flux.Phi, PhiG, Qabs) : null;
  const area = surfaceArea(surface);
  return { patches, ...flux, ...enc, closed, PhiG, match, area };
}
