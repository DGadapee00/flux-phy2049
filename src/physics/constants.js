/** SI constants as used with Montgomery's PHY 2049 sheet.
 *  k is taken as 1/(4πϵ₀) so numerical flux matches Q_in/ϵ₀.
 *  The sheet rounds k to 9.0×10⁹; we display that and compute with 8.99×10⁹.
 */
export const EPS0 = 8.85e-12;
export const K = 1 / (4 * Math.PI * EPS0);
export const K_SHEET = 9.0e9;
export const QE = 1.6e-19;

/** 1 Three.js unit = 0.125 m so a ~0.5 m Gaussian sphere reads well. */
export const UNITS_PER_METER = 8;

export const SOFTEN = 0.018;
export const SURFACE_EPS = 0.012;
