import { C, EPS0, MU0 } from './constants.js';

/** Average intensity of a harmonic plane wave: I = ½ c ε₀ E₀² = E₀² / (2 μ₀ c) = E₀ B₀ / (2 μ₀). */
export function intensityAvg(E0) {
  return 0.5 * C * EPS0 * E0 * E0;
}

export function B0fromE(E0) {
  return E0 / C;
}

/**
 * Right-handed plane wave traveling +x̂:
 * E = E₀ sin(kx − ωt) ŷ,  B = (E₀/c) sin(kx − ωt) ẑ,  S = (E × B)/μ₀ along +x̂.
 */
export function planeWave({ E0, lambda, t = 0, x = 0 }) {
  const f = C / lambda;
  const k = (2 * Math.PI) / lambda;
  const omega = 2 * Math.PI * f;
  const s = Math.sin(k * x - omega * t);
  const Ey = E0 * s;
  const Bz = (E0 / C) * s;
  const B0 = E0 / C;
  const Iavg = intensityAvg(E0);
  const Sx = (Ey * Bz) / MU0;
  return {
    c: C,
    f,
    k,
    omega,
    Ey,
    Bz,
    E: { x: 0, y: Ey, z: 0 },
    B: { x: 0, y: 0, z: Bz },
    B0,
    Iavg,
    Sx,
    Savg: Iavg,
  };
}

export const BANDS = [
  { id: 'radio', name: 'Radio', min: 1, max: Infinity },
  { id: 'microwave', name: 'Microwave', min: 1e-3, max: 1 },
  { id: 'ir', name: 'Infrared', min: 7e-7, max: 1e-3 },
  { id: 'vis', name: 'Visible', min: 4e-7, max: 7e-7 },
  { id: 'uv', name: 'Ultraviolet', min: 1e-8, max: 4e-7 },
  { id: 'xray', name: 'X-ray', min: 1e-11, max: 1e-8 },
  { id: 'gamma', name: 'Gamma', min: 0, max: 1e-11 },
];

export function spectrumBand(lambda) {
  for (const b of BANDS) {
    if (lambda >= b.min && lambda < b.max) return b;
  }
  return BANDS[0];
}

/** Rough visible RGB for λ in meters. Outside 380–780 nm returns a cool grey. */
export function wavelengthRGB(lambda) {
  const nm = lambda * 1e9;
  if (nm < 380 || nm > 780) return { r: 0.82, g: 0.84, b: 0.9 };
  let r = 0;
  let g = 0;
  let b = 0;
  if (nm < 440) {
    r = (440 - nm) / 60;
    b = 1;
  } else if (nm < 490) {
    g = (nm - 440) / 50;
    b = 1;
  } else if (nm < 510) {
    g = 1;
    b = (510 - nm) / 20;
  } else if (nm < 580) {
    r = (nm - 510) / 70;
    g = 1;
  } else if (nm < 645) {
    r = 1;
    g = (645 - nm) / 65;
  } else {
    r = 1;
  }
  let fade = 1;
  if (nm < 420) fade = 0.35 + 0.65 * (nm - 380) / 40;
  if (nm > 700) fade = 0.35 + 0.65 * (780 - nm) / 80;
  return { r: r * fade, g: g * fade, b: b * fade };
}
