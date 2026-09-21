/**
 * What the symbols in each lab mean, and what they are measured in.
 *
 * The base-SI expansion of every entry is computed from `unit` through parseUnit(), not typed out
 * here, so it cannot drift from the dimensional-analysis engine the symbolic answers are graded
 * with. `unit` is the unit the course writes; `equals` is the equivalent form worth recognising
 * (V is J/C, and also N·m/C); `from` is the relation the unit comes from.
 */
import { parseUnit } from '../physics/units.js';

export const QUANTITIES = {
  // --- charge, force, field ---
  q: { sym: 'q', name: 'Charge', unit: 'C', unitName: 'coulomb', equals: 'A·s', from: 'q = It' },
  F: { sym: '\\vec F', name: 'Force', unit: 'N', unitName: 'newton', equals: 'kg·m/s²', from: 'F = \\dfrac{kq_1q_2}{r^2}' },
  E: { sym: '\\vec E', name: 'Electric field', unit: 'N/C', unitName: 'newton per coulomb', equals: 'V/m', from: 'E = \\dfrac{F}{q} = -\\dfrac{dV}{dx}' },
  k: { sym: 'k', name: 'Coulomb constant', unit: 'N*m^2/C^2', unitName: '', equals: '8.99×10⁹ N·m²/C²', from: 'k = \\dfrac{1}{4\\pi\\varepsilon_0}', constant: true },
  eps0: { sym: '\\varepsilon_0', name: 'Permittivity of free space', unit: 'C^2/(N*m^2)', unitName: '', equals: '8.85×10⁻¹² C²/(N·m²)', from: '\\varepsilon_0 = \\dfrac{1}{4\\pi k}', constant: true },

  // --- energy and potential ---
  U: { sym: 'U_E', name: 'Electric potential energy', unit: 'J', unitName: 'joule', equals: 'N·m', from: 'U_E = qV' },
  V: { sym: 'V', name: 'Electric potential', unit: 'V', unitName: 'volt', equals: 'J/C', from: 'V = \\dfrac{U_E}{q} = \\dfrac{kq}{r}' },
  dV: { sym: '\\Delta V', name: 'Potential difference', unit: 'V', unitName: 'volt', equals: 'J/C', from: '\\Delta V = V_B - V_A' },
  W: { sym: 'W', name: 'Work', unit: 'J', unitName: 'joule', equals: 'N·m', from: 'W = -q\\,\\Delta V' },

  // --- distributions and flux ---
  r: { sym: 'r', name: 'Distance (also d, L)', unit: 'm', unitName: 'metre', equals: '', from: '' },
  A: { sym: 'A', name: 'Area', unit: 'm^2', unitName: '', equals: '', from: '' },
  sigma: { sym: '\\sigma', name: 'Surface charge density', unit: 'C/m^2', unitName: '', equals: '', from: '\\sigma = \\dfrac{q}{A}' },
  lambda: { sym: '\\lambda', name: 'Linear charge density', unit: 'C/m', unitName: '', equals: '', from: '\\lambda = \\dfrac{q}{L}' },
  rho: { sym: '\\rho', name: 'Volume charge density', unit: 'C/m^3', unitName: '', equals: '', from: '\\rho = \\dfrac{q}{\\mathcal{V}}' },
  phiE: { sym: '\\Phi_E', name: 'Electric flux', unit: 'N*m^2/C', unitName: '', equals: 'V·m', from: '\\Phi_E = \\oint \\vec E \\cdot d\\vec A = \\dfrac{q_{enc}}{\\varepsilon_0}' },

  // --- capacitance ---
  C: { sym: 'C', name: 'Capacitance', unit: 'F', unitName: 'farad', equals: 'C/V', from: 'C = \\dfrac{q}{\\Delta V} = \\dfrac{\\kappa\\varepsilon_0 A}{d}' },
  kappa: { sym: '\\kappa', name: 'Dielectric constant', unit: '1', unitName: '', equals: 'a pure number', from: '\\kappa = \\dfrac{C}{C_0}' },
  Ucap: { sym: 'U', name: 'Stored energy', unit: 'J', unitName: 'joule', equals: 'N·m', from: 'U = \\tfrac12 C(\\Delta V)^2' },

  // --- current and circuits ---
  I: { sym: 'I', name: 'Current', unit: 'A', unitName: 'ampere', equals: 'C/s', from: 'I = \\dfrac{dq}{dt}' },
  R: { sym: 'R', name: 'Resistance', unit: 'ohm', unitName: 'ohm', equals: 'V/A', from: 'R = \\dfrac{\\Delta V}{I}' },
  rhoR: { sym: '\\rho', name: 'Resistivity', unit: 'ohm*m', unitName: '', equals: 'Ω·m', from: 'R = \\dfrac{\\rho L}{A}' },
  P: { sym: 'P', name: 'Power', unit: 'W', unitName: 'watt', equals: 'J/s', from: 'P = I\\,\\Delta V = I^2R' },
  emf: { sym: '\\varepsilon', name: 'emf', unit: 'V', unitName: 'volt', equals: 'J/C', from: '\\varepsilon = I(R + r)' },

  // --- magnetism ---
  B: { sym: '\\vec B', name: 'Magnetic field', unit: 'T', unitName: 'tesla', equals: 'N/(A·m) = Wb/m²', from: 'F = qvB\\sin\\theta' },
  mu0: { sym: '\\mu_0', name: 'Permeability of free space', unit: 'T*m/A', unitName: '', equals: '4π×10⁻⁷ T·m/A', from: '\\mu_0 = 4\\pi\\times10^{-7}', constant: true },
  phiB: { sym: '\\Phi_B', name: 'Magnetic flux', unit: 'Wb', unitName: 'weber', equals: 'T·m²', from: '\\Phi_B = \\int \\vec B \\cdot d\\vec A' },
  L: { sym: 'L', name: 'Inductance', unit: 'H', unitName: 'henry', equals: 'Wb/A = V·s/A', from: '\\varepsilon = -L\\dfrac{dI}{dt}' },

  // --- AC and waves ---
  f: { sym: 'f', name: 'Frequency', unit: 'Hz', unitName: 'hertz', equals: '1/s', from: 'f = \\dfrac{1}{T}' },
  omega: { sym: '\\omega', name: 'Angular frequency', unit: 'rad/s', unitName: '', equals: 'rad/s', from: '\\omega = 2\\pi f' },
  X: { sym: 'X', name: 'Reactance (X_L, X_C)', unit: 'ohm', unitName: 'ohm', equals: 'V/A', from: 'X_L = \\omega L,\\quad X_C = \\dfrac{1}{\\omega C}' },
  Z: { sym: 'Z', name: 'Impedance', unit: 'ohm', unitName: 'ohm', equals: 'V/A', from: 'Z = \\sqrt{R^2 + (X_L - X_C)^2}' },
  S: { sym: 'S', name: 'Intensity', unit: 'W/m^2', unitName: '', equals: 'J/(s·m²)', from: 'S = \\dfrac{P}{A}' },
  c: { sym: 'c', name: 'Speed of light', unit: 'm/s', unitName: '', equals: '3.00×10⁸ m/s', from: 'c = \\dfrac{1}{\\sqrt{\\mu_0\\varepsilon_0}}', constant: true },
  wavelength: { sym: '\\lambda', name: 'Wavelength', unit: 'm', unitName: 'metre', equals: 'often nm', from: '\\lambda = \\dfrac{v}{f}' },

  // --- optics ---
  n: { sym: 'n', name: 'Index of refraction', unit: '1', unitName: '', equals: 'a pure number', from: 'n = \\dfrac{c}{v}' },
  fLens: { sym: 'f', name: 'Focal length', unit: 'm', unitName: 'metre', equals: '', from: '\\dfrac1f = \\dfrac1{d_o} + \\dfrac1{d_i}' },
  Pwr: { sym: 'P', name: 'Lens power', unit: 'D', unitName: 'diopter', equals: '1/m', from: 'P = \\dfrac{1}{f}' },
  M: { sym: 'm', name: 'Magnification', unit: '1', unitName: '', equals: 'a pure number', from: 'm = -\\dfrac{d_i}{d_o}' },
};

/** Which quantities each lab actually puts on screen, most important first. */
export const LAB_UNITS = {
  vectors: ['r', 'A'],
  force: ['F', 'q', 'r', 'k'],
  field: ['E', 'q', 'r', 'F', 'k'],
  integral: ['E', 'lambda', 'sigma', 'q', 'r', 'k'],
  gauss: ['phiE', 'E', 'q', 'A', 'eps0', 'sigma'],
  conductors: ['E', 'sigma', 'q', 'V', 'r'],
  potential: ['V', 'U', 'dV', 'W', 'E', 'q', 'r', 'k'],
  capacitor: ['C', 'V', 'q', 'E', 'Ucap', 'kappa', 'A', 'sigma', 'eps0'],
  breakdown: ['E', 'V', 'C', 'Ucap', 'q', 'r'],
  ohm: ['I', 'V', 'R', 'rhoR', 'P'],
  power: ['P', 'I', 'V', 'R', 'U'],
  circuits: ['I', 'V', 'R', 'emf', 'P', 'C'],
  biot: ['B', 'I', 'r', 'mu0'],
  ampere: ['B', 'I', 'r', 'mu0'],
  magforce: ['F', 'B', 'q', 'I', 'r'],
  faraday: ['phiB', 'emf', 'B', 'A', 'I', 'R'],
  ac: ['Z', 'X', 'omega', 'f', 'I', 'V', 'R', 'C', 'L', 'P'],
  emwave: ['E', 'B', 'S', 'c', 'f', 'wavelength'],
  polar: ['S', 'E', 'n'],
  refraction: ['n', 'c', 'wavelength'],
  mirrors: ['fLens', 'M', 'r'],
  lenses: ['fLens', 'Pwr', 'M', 'n'],
  interference: ['wavelength', 'r', 'S'],
  diffraction: ['wavelength', 'r', 'S'],
  thinfilm: ['wavelength', 'n', 'r'],
};

const BASE = ['kg', 'm', 's', 'A'];
const SUP = { '-': '⁻', 0: '⁰', 1: '¹', 2: '²', 3: '³', 4: '⁴', 5: '⁵', 6: '⁶', 7: '⁷', 8: '⁸', 9: '⁹' };
const sup = (n) => String(n).split('').map((ch) => SUP[ch] ?? ch).join('');

/** Always expand to base SI, unlike formatDim() which stops at a named unit if it finds one. */
export function baseUnits(unit) {
  let dim;
  try {
    dim = parseUnit(unit);
  } catch {
    return '';
  }
  const parts = dim.map((e, i) => (e === 0 ? null : e === 1 ? BASE[i] : BASE[i] + sup(e))).filter(Boolean);
  return parts.length ? parts.join('·') : 'dimensionless';
}

/** The quantities for a lab, resolved and ready to render. */
export function unitsForLab(labId) {
  return (LAB_UNITS[labId] || []).map((id) => {
    const qty = QUANTITIES[id];
    return qty ? { id, ...qty, base: baseUnits(qty.unit) } : null;
  }).filter(Boolean);
}
