import { QE } from './constants.js';

/** Resistivity at 20 °C and α from Montgomery Ch 41. n ≈ 8.5×10²⁸ m⁻³ for Cu. */
export const MATERIALS = [
  { id: 'copper', name: 'Copper', rho: 1.72e-8, alpha: 4.0e-3, n: 8.5e28 },
  { id: 'aluminum', name: 'Aluminum', rho: 2.82e-8, alpha: 4.3e-3, n: 6.0e28 },
  { id: 'gold', name: 'Gold', rho: 2.44e-8, alpha: 3.4e-3, n: 5.9e28 },
  { id: 'tungsten', name: 'Tungsten', rho: 5.6e-8, alpha: 4.5e-3, n: 6.3e28 },
  { id: 'iron', name: 'Iron', rho: 9.7e-8, alpha: 5.0e-3, n: 8.5e28 },
  { id: 'nichrome', name: 'Nichrome', rho: 1.0e-6, alpha: 0.4e-3, n: 9.0e28 },
  { id: 'carbon', name: 'Carbon', rho: 3.5e-5, alpha: -0.5e-3, n: 1e28 },
];

export function materialById(id) {
  return MATERIALS.find((m) => m.id === id) || MATERIALS[0];
}

export function ohmState(ohm) {
  const mat = materialById(ohm.material);
  const T0 = 20;
  const rho = mat.rho * (1 + mat.alpha * (ohm.T - T0));
  const Rgeo = (rho * ohm.L) / ohm.A;
  const R = ohm.Rlock != null ? ohm.Rlock : Rgeo;
  const I = ohm.V / R;
  const J = I / ohm.A;
  const vd = J / (mat.n * QE);
  const P = I * ohm.V;
  const E = ohm.V / ohm.L;
  const Ne_per_s = I / QE;
  return { mat, rho, R, Rgeo, I, J, vd, P, E, Ne_per_s, T0 };
}

export function powerState(pwr, t = 0) {
  if (pwr.mode === 'ac') {
    const Vp = pwr.Vrms * Math.SQRT2;
    const omega = 2 * Math.PI * pwr.f;
    const V = Vp * Math.sin(omega * t);
    const Ip = Vp / pwr.R;
    const I = Ip * Math.sin(omega * t);
    const Pinst = I * V;
    const Pavg = 0.5 * Ip * Vp;
    const Irms = Ip / Math.SQRT2;
    const Prms = Irms * pwr.Vrms;
    return { Vp, Ip, V, I, Pinst, Pavg, Irms, Prms, omega };
  }
  const V = pwr.V;
  const I = V / pwr.R;
  const P = I * V;
  return { V, I, P, P_IV: I * V, P_I2R: I * I * pwr.R, P_V2R: (V * V) / pwr.R };
}

export function bulbFromPower(P, V) {
  const R = (V * V) / P;
  const I = P / V;
  return { R, I, P };
}
