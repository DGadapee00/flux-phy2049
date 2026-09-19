/**
 * Dielectric breakdown of a gas gap — the physics behind a spark.
 *
 * Two descriptions, and they do not agree — which is the lesson, not a defect:
 *
 *   1. The constant-strength rule every textbook starts with: air lets go at E = 3 MV/m, so a gap
 *      d holds V_b = E_DS · d. Linear in d, silent about pressure. It is an engineering fit to
 *      measurements at millimetre-to-centimetre gaps at one atmosphere, and it is good there.
 *   2. Paschen's law, from the Townsend avalanche: breakdown depends on the product p·d rather
 *      than on p and d separately, and the curve has a minimum. Below that minimum a *wider* gap
 *      breaks down at a *lower* voltage — something the constant-strength rule cannot express.
 *
 * The Townsend coefficients below are a fit anchored near the Paschen minimum, so at atmospheric
 * millimetre gaps this law overestimates by roughly 60%: about 5 kV across 1 mm against a measured
 * 3 kV. That is a real and well-known limitation of a single (A, B) pair across many decades of
 * p·d, and the lab shows both numbers rather than hiding it. Knowing which description is trusted
 * where is the thing worth carrying out of the chapter.
 *
 * The internal check is numerical against analytic, in the usual style: the closed-form minimum
 * below is verified against a numerical search of the curve, and the p·d scaling is verified by
 * halving one and doubling the other.
 */
import { K, EPS0 } from './constants.js';

/**
 * Townsend coefficients in SI, (Pa·m)⁻¹ and V/(Pa·m), converted from the usual cm·Torr tables by
 * ×100/133.322 = ×0.75006. γ is the cathode's secondary-emission coefficient — the electrons a
 * positive ion knocks loose when it lands, which is what makes the avalanche self-sustaining.
 *
 * Air (15 cm⁻¹Torr⁻¹, 365 V cm⁻¹Torr⁻¹) is the one to trust; the others are single-pair fits whose
 * published values vary by tens of percent between sources, and are here to show that the curve
 * moves with the gas, not to be read off to three figures.
 */
export const GASES = [
  { id: 'air', name: 'Air', A: 11.25, B: 273.8, gamma: 0.01 },
  { id: 'n2', name: 'Nitrogen', A: 9.0, B: 256.5, gamma: 0.01 },
  { id: 'ar', name: 'Argon', A: 9.0, B: 135.0, gamma: 0.01 },
  { id: 'he', name: 'Helium', A: 2.25, B: 25.5, gamma: 0.01 },
];

export const gasById = (id) => GASES.find((g) => g.id === id) || GASES[0];

/** Standard atmosphere, Pa. */
export const P_ATM = 101325;

/**
 * Paschen's law: the voltage a gap of `d` metres at `p` pascals will hold.
 *
 *   V_b = B·p·d / [ ln(A·p·d) − ln( ln(1 + 1/γ) ) ]
 *
 * The denominator vanishes as p·d falls to the point where an electron can cross the gap without
 * hitting anything; below that there are too few collisions to avalanche at any voltage, and the
 * law returns Infinity rather than a negative number.
 */
export function paschen(p, d, gas = GASES[0]) {
  const pd = p * d;
  if (!(pd > 0)) return Infinity;
  const lnG = Math.log(1 + 1 / gas.gamma);
  const den = Math.log(gas.A * pd) - Math.log(lnG);
  if (den <= 0) return Infinity;
  return (gas.B * pd) / den;
}

/**
 * The minimum of the Paschen curve, in closed form.
 * Differentiating the expression above gives (p·d)_min = e·ln(1+1/γ)/A, and substituting back
 * gives V_min = (B/A)·e·ln(1+1/γ). For air this is ~305 V — the accepted figure sits in the
 * 300–360 V band depending on whose A, B and γ you take.
 */
export function paschenMin(gas = GASES[0]) {
  const lnG = Math.log(1 + 1 / gas.gamma);
  const pd = (Math.E * lnG) / gas.A;
  return { pd, V: (gas.B / gas.A) * Math.E * lnG, d: pd / P_ATM };
}

/** The simple rule: a constant dielectric strength, so V scales with the gap. */
export const strengthVolts = (d, DS = 3e6) => DS * d;

/** Field in a uniform gap. */
export const gapField = (V, d) => V / d;

/** Field at the surface of an isolated sphere carrying Q — where a spark starts on a charged body. */
export const sphereSurfaceField = (Q, R) => (K * Q) / (R * R);

/** A sphere's potential, and the charge that potential implies. */
export const spherePotential = (Q, R) => (K * Q) / R;
export const chargeForPotential = (V, R) => (V * R) / K;

/** Self-capacitance of an isolated sphere, C = 4πε₀R — what a charged person roughly is. */
export const sphereCapacitance = (R) => 4 * Math.PI * EPS0 * R;

/**
 * Does this gap spark, and by which criterion?
 *
 * `V` is the potential difference across a gap `d` in a gas at pressure `p`. Both criteria are
 * reported so the lab can show them disagreeing.
 */
export function sparkCheck({ V, d, p = P_ATM, gas = GASES[0], DS = 3e6 }) {
  const Vp = paschen(p, d, gas);
  const Vs = strengthVolts(d, DS);
  return {
    E: gapField(V, d),
    Vpaschen: Vp,
    Vstrength: Vs,
    sparksPaschen: V >= Vp,
    sparksStrength: V >= Vs,
    // How far past (or short of) the Paschen threshold, as a fraction.
    margin: Number.isFinite(Vp) && Vp > 0 ? V / Vp - 1 : -1,
    agree: Number.isFinite(Vp) ? Math.abs(Vp - Vs) / Math.max(Vp, Vs) : 1,
  };
}

/** Energy dumped by a spark that discharges capacitance C from V to zero. */
export const sparkEnergy = (C, V) => 0.5 * C * V * V;

/** Paschen curve samples for the plot, log-spaced in p·d. */
export function paschenCurve(gas = GASES[0], n = 160, pdLo = 1e-2, pdHi = 1e3) {
  const pts = [];
  for (let i = 0; i <= n; i++) {
    const pd = pdLo * (pdHi / pdLo) ** (i / n);
    const V = paschen(pd, 1, gas);
    if (Number.isFinite(V) && V < 1e6) pts.push({ pd, V });
  }
  return pts;
}
