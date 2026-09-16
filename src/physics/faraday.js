import { MU0 } from './constants.js';

/** Area of a circular loop. */
export function loopArea(R) {
  return Math.PI * R * R;
}

/**
 * Flux of a magnetic dipole m ŷ through a coaxial loop of radius R in the xz plane,
 * dipole on the y-axis at y = z. Φ = (μ₀ m / 2) R² / (R²+z²)^{3/2}.
 */
export function fluxDipoleLoop(m, z, R) {
  const d = z * z + R * R;
  return ((MU0 * m) / 2) * (R * R) / Math.pow(d, 1.5);
}

/** Expanding (or shrinking) loop, N turns, uniform B along the axis. */
export function expandingLoop(B, R, Rdot, N = 1) {
  const Phi = N * B * loopArea(R);
  const dPhi_dt = N * B * 2 * Math.PI * R * Rdot;
  return { Phi, dPhi_dt, emf: -dPhi_dt };
}

/** Sliding bar: rails separated by width w, bar at position x, speed v = dx/dt. Φ = B w x. */
export function slidingBar(B, w, x, v) {
  const Phi = B * w * x;
  const dPhi_dt = B * w * v;
  return { Phi, dPhi_dt, emf: -dPhi_dt };
}

/**
 * Generator: N-turn loop, area A, uniform B, area vector at angle θ to B.
 * Φ = N B A cosθ, θ = ωt. ε = N B A ω sinθ.
 */
export function generator(N, B, A, omega, theta) {
  const Phi = N * B * A * Math.cos(theta);
  const dPhi_dt = -N * B * A * omega * Math.sin(theta);
  return { Phi, dPhi_dt, emf: -dPhi_dt };
}

/** Dipole approaching a coaxial loop. vz = dz/dt. */
export function dipoleLoop(m, z, R, vz) {
  const Phi = fluxDipoleLoop(m, z, R);
  const d = z * z + R * R;
  const dPhidz = -((MU0 * m) / 2) * R * R * 3 * z / Math.pow(d, 2.5);
  const dPhi_dt = dPhidz * vz;
  return { Phi, dPhi_dt, emf: -dPhi_dt };
}

/**
 * Lenz: induced current in the Exam 4 loop convention (counterclockwise from +y is +I, makes +B_y).
 * I = ε / R. If dΦ_y/dt > 0, ε < 0, I < 0 (clockwise) so the induced B is −ŷ.
 */
export function inducedCurrent(emf, Rloop) {
  if (!(Rloop > 0)) return 0;
  return emf / Rloop;
}

export function lenz(dPhi_dt) {
  if (Math.abs(dPhi_dt) < 1e-18) return { Isign: 0, inducedB: 0, text: 'Φ steady — no emf' };
  if (dPhi_dt > 0) {
    return {
      Isign: -1,
      inducedB: -1,
      text: 'Φ_y increasing → induced I is clockwise (from +y) so its B is −ŷ',
    };
  }
  return {
    Isign: 1,
    inducedB: 1,
    text: 'Φ_y decreasing → induced I is counterclockwise (from +y) so its B is +ŷ',
  };
}
