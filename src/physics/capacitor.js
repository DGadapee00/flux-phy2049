import { EPS0 } from './constants.js';

/** κ and dielectric strength from Montgomery Ch 40 (p.4 table + Table 26.1). */
export const DIELECTRICS = [
  { id: 'vacuum', name: 'Vacuum', kappa: 1, DS: Infinity },
  { id: 'air', name: 'Air (dry)', kappa: 1.00059, DS: 3e6 },
  { id: 'teflon', name: 'Teflon', kappa: 2.1, DS: 60e6 },
  { id: 'paper', name: 'Paper', kappa: 3.3, DS: 16e6 },
  { id: 'rubber', name: 'Rubber', kappa: 6.7, DS: 12e6 },
  { id: 'nylon', name: 'Nylon (table)', kappa: 3.4, DS: 14e6 },
  { id: 'nylon410', name: 'Nylon (Ch 40 example κ=410)', kappa: 410, DS: 14e6 },
  { id: 'water', name: 'Water (pure)', kappa: 80.4, DS: Infinity },
];

export function dielectricById(id) {
  return DIELECTRICS.find((d) => d.id === id) || DIELECTRICS[1];
}

/**
 * Parallel-plate capacitor.
 * mode 'battery': V held fixed (power supply connected).
 * mode 'isolated': Q held fixed (disconnected after charging).
 */
export function capacitorState(cap) {
  const mat = dielectricById(cap.dielectric);
  const kappa = cap.inserted === false ? 1 : mat.kappa;
  const C0 = cap.Cset ? cap.Cset : (EPS0 * cap.A) / cap.d;
  const C = cap.Cset ? cap.Cset : kappa * ((EPS0 * cap.A) / cap.d);
  let V;
  let Q;
  if (cap.mode === 'isolated') {
    Q = cap.Q0;
    V = Q / C;
  } else {
    V = cap.V;
    Q = C * V;
  }
  const E0 = V / cap.d; // with the actual V after insertion
  const E = V / cap.d;
  const E_vac_sameQ = Q / (EPS0 * cap.A);
  const U = 0.5 * C * V * V;
  const sigma = Q / cap.A;
  const Vbd = Number.isFinite(mat.DS) ? mat.DS * cap.d : Infinity;
  const breakdown = Number.isFinite(mat.DS) && E > mat.DS;
  return {
    mat,
    kappa,
    C0,
    C,
    V,
    Q,
    E,
    E0,
    E_vac_sameQ,
    U,
    sigma,
    Vbd,
    breakdown,
    side: Math.sqrt(cap.A),
  };
}
