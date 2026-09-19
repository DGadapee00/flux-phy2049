import { K, EPS0, QE, MU0, C } from './constants.js';
import { fieldAt } from './field.js';
import { sampleSphere, sampleCylinder, sampleCube, enclosedCharge } from './surfaces.js';
import { integrateFlux, gaussPrediction, matchQuality } from './flux.js';
import {
  paschen,
  paschenMin,
  paschenCurve,
  strengthVolts,
  sparkCheck,
  sphereSurfaceField,
  spherePotential,
  chargeForPotential,
  sphereCapacitance,
  sparkEnergy,
  P_ATM,
  GASES,
} from './breakdown.js';
import {
  linePerpField,
  linePerpNumerical,
  ringAxisField,
  ringAxisNumerical,
  linePerpPotential,
  linePerpPotentialNumerical,
  diskAxisField,
  diskAxisNumerical,
  diskAxisPotential,
  diskAxisPotentialNumerical,
  ringAxisPotential,
  ringAxisPotentialNumerical,
} from './analytic.js';
import { potentialAt } from './potential.js';
import { capacitorState } from './capacitor.js';
import { ohmState, powerState, bulbFromPower } from './circuit.js';
import { imageGrounded, imageIsolatedNeutral, conductorField, sigmaSphere } from './conductors.js';
import {
  BwireInfinite,
  BwireFinite,
  BloopAxis,
  Bsolenoid,
  BsolenoidFiniteAxis,
  Bpolyline,
  BlongWire,
  wireAlongY,
  loopPoints,
  helixPoints,
  ampereCirculation,
  amperianLoop,
  circleOverlapArea,
  enclosedFraction,
  mu0I,
  FparallelWires,
} from './bfield.js';
import {
  PARTICLES,
  trajectory,
  cyclotronRadius,
  cyclotronPeriod,
  wireForce,
  parallelWireForceNumerical,
} from './magforce.js';
import { solveCircuit, loopTerms, junctionTerms } from './mna.js';
import { CIRCUITS, netlist, equivalentR } from '../data/circuits.js';
import { expandingLoop, slidingBar, generator, dipoleLoop, fluxDipoleLoop, inducedCurrent, lenz } from './faraday.js';
import { acState } from './ac.js';
import { planeWave, intensityAvg, spectrumBand } from './emwave.js';
import { malusChain, malus } from './polarization.js';
import {
  doubleSlit,
  doubleSlitIntensity,
  singleSlit,
  singleSlitIntensity,
  grating,
  gratingIntensity,
  rayleigh,
  airyIntensity,
  besselJ1,
  thinFilm,
  michelson,
  sinc,
} from './waveoptics.js';
import { snell, criticalAngle, imageOf, twoLenses, principalRays, traceRay } from './optics.js';

let failed = 0;
let passed = 0;

/**
 * Relative check: |a − b| ≤ tol·|b|. When the expected value is exactly 0, `tol` is an absolute
 * tolerance (callers pass something like 0.05·scale). The old max(1, |b|) floor let every check on a
 * small SI quantity (B ~ 10⁻⁶ T, C ~ 10⁻⁹ F) pass no matter what the code returned.
 */
function approx(a, b, tol, name) {
  const scaleB = b !== 0 ? Math.abs(b) : 1;
  const good = Number.isFinite(a) && Math.abs(a - b) <= tol * scaleB;
  if (good) {
    passed += 1;
    console.log(`  PASS  ${name}`);
  } else {
    failed += 1;
    console.log(`  FAIL  ${name}`);
    console.log(`        got ${a}  expected ${b}  rel ${Math.abs(a - b) / scaleB}`);
  }
}

function ok(cond, name) {
  if (cond) {
    passed += 1;
    console.log(`  PASS  ${name}`);
  } else {
    failed += 1;
    console.log(`  FAIL  ${name}`);
  }
}

const origin = { x: 0, y: 0, z: 0 };
const Q = 1e-6;

console.log('Gauss lab self-test');

{
  const patches = sampleSphere(0.5, origin);
  const area = patches.reduce((s, p) => s + p.dA, 0);
  approx(area, 4 * Math.PI * 0.25, 0.01, 'sphere area ΣdA = 4πR²');
}

{
  const patches = sampleSphere(0.5, origin);
  const charges = [{ id: 1, q: Q, x: 0, y: 0, z: 0 }];
  const { Phi } = integrateFlux(patches, charges);
  const PhiG = gaussPrediction(Q);
  approx(Phi, PhiG, 0.02, 'centered charge: Φ ≈ Q/ε₀');
  const E = fieldAt({ x: 0.5, y: 0, z: 0 }, charges);
  approx(E.x, (K * Q) / 0.25, 0.002, 'E = kQ/R² on +x');
}

{
  const patches = sampleSphere(0.5, origin);
  const charges = [{ id: 1, q: Q, x: 0.22, y: 0.08, z: -0.1 }];
  const { Phi } = integrateFlux(patches, charges);
  approx(Phi, Q / EPS0, 0.04, 'off-center inside: Φ ≈ Q/ε₀');
  const enc = enclosedCharge(charges, { type: 'sphere', R: 0.5, L: 1, origin });
  ok(enc.Qin === Q, 'off-center counted as enclosed');
}

{
  const patches = sampleSphere(0.4, origin);
  const charges = [{ id: 1, q: Q, x: 0.9, y: 0, z: 0 }];
  const { Phi } = integrateFlux(patches, charges);
  const scale = Math.abs(Q / EPS0);
  approx(Phi / scale, 0, 0.04, 'outside charge: Φ/ (Q/ε₀) ≈ 0');
  ok(matchQuality(Phi, 0, Q).pct > 95, 'outside charge match is high vs characteristic flux');
  const enc = enclosedCharge(charges, { type: 'sphere', R: 0.4, L: 1, origin });
  ok(enc.Qin === 0, 'outside charge not enclosed');
}

{
  const patches = sampleSphere(0.5, origin);
  const charges = [
    { id: 1, q: Q, x: 0.1, y: 0, z: 0 },
    { id: 2, q: -Q, x: -0.12, y: 0.05, z: 0 },
  ];
  const { Phi } = integrateFlux(patches, charges);
  approx(Phi, 0, 0.05 * Math.abs(Q / EPS0), 'dipole inside: Φ ≈ 0');
}

{
  const patches = sampleCube(0.4, origin, 14);
  const area = patches.reduce((s, p) => s + p.dA, 0);
  approx(area, 6 * 0.8 * 0.8, 0.02, 'cube area');
  const charges = [{ id: 1, q: Q, x: 0, y: 0, z: 0 }];
  const { Phi } = integrateFlux(patches, charges);
  approx(Phi, Q / EPS0, 0.05, 'cube around centered charge: Φ ≈ Q/ε₀');
}

{
  const L = 0.6;
  const R = 0.3;
  const patches = sampleCylinder(R, L, origin, 40, 18, 8, true);
  const lambda = 2e-6;
  const n = 40;
  const dy = 1.2 / n;
  const charges = [];
  for (let i = 0; i < n; i++) {
    charges.push({ id: i, q: lambda * dy, x: 0, y: -0.6 + (i + 0.5) * dy, z: 0 });
  }
  const { Phi, PhiWall, PhiCap } = integrateFlux(patches, charges);
  const enc = enclosedCharge(charges, { type: 'cylinder', R, L, origin });
  approx(Phi, enc.Qin / EPS0, 0.08, 'finite line + cylinder: Φ ≈ Q_in/ε₀');
  ok(Math.abs(PhiCap) < 0.25 * Math.abs(PhiWall) + 1, 'caps smaller than wall for a line');
}

{
  const lambda = 2e-6;
  const L = 0.8;
  const d = 0.35;
  const closed = linePerpField(lambda, L, d);
  const num = linePerpNumerical(lambda, L, d, 48);
  approx(num.E.y, closed.E.y, 0.02, 'rod perpendicular: numerical vs analytic E_y');
  approx(num.E.x, 0, 0.05 * Math.abs(closed.E.y), 'rod perpendicular: E_x ≈ 0');
}

// P slid along the rod: the closed form has to track the Riemann sum everywhere, not just where
// the symmetry hides E_x. Ends, past the ends, and both signs.
{
  const lambda = 2e-6;
  const L = 0.8;
  const d = 0.35;
  for (const x0 of [0, 0.2, 0.4, 0.75, -0.4, -0.9]) {
    const closed = linePerpField(lambda, L, d, x0);
    const num = linePerpNumerical(lambda, L, d, 4000, x0);
    const scale = Math.max(Math.abs(closed.E.y), Math.abs(closed.E.x));
    approx(num.E.y, closed.E.y, 0.004, `rod x0=${x0}: E_y closed vs sum`);
    approx(num.E.x, closed.E.x, 0.004 * scale, `rod x0=${x0}: E_x closed vs sum`);

    const V = linePerpPotential(lambda, L, d, x0);
    const Vn = linePerpPotentialNumerical(lambda, L, d, 4000, x0);
    approx(Vn.V, V.V, 0.004, `rod x0=${x0}: V closed vs sum`);
  }

  // The bisector is the only place E_x vanishes, and x0 -> -x0 mirrors it.
  ok(Math.abs(linePerpField(lambda, L, d, 0).E.x) < 1e-9, 'rod: E_x = 0 only on the bisector');
  ok(Math.abs(linePerpField(lambda, L, d, 0.4).E.x) > 0.2 * Math.abs(linePerpField(lambda, L, d, 0.4).E.y),
    'rod above the end: E_x is a real fraction of E_y');
  approx(linePerpField(lambda, L, d, -0.4).E.x, -linePerpField(lambda, L, d, 0.4).E.x, 1e-9, 'rod: E_x is odd in x0');
  approx(linePerpField(lambda, L, d, -0.4).E.y, linePerpField(lambda, L, d, 0.4).E.y, 1e-9, 'rod: E_y is even in x0');

  // Far off the end the rod looks like a point charge at its centre.
  const far = 40;
  const pt = linePerpField(lambda, L, 1e-6, far);
  const Qtot = lambda * L;
  approx(Math.hypot(pt.E.x, pt.E.y), (K * Qtot) / (far * far), 0.001 * (K * Qtot) / (far * far),
    'rod from far off the end -> kQ/r^2');
}

{
  const Qr = 3e-6;
  const a = 0.3;
  const y = 0.4;
  const closed = ringAxisField(Qr, a, y);
  const num = ringAxisNumerical(Qr, a, y, 48);
  approx(num.E.y, closed.E.y, 0.02, 'ring on axis: numerical vs analytic E_y');
  approx(Math.hypot(num.E.x, num.E.z), 0, 0.04 * Math.abs(closed.E.y), 'ring: radial E cancels');
}

// Arc: the closed ring is the special case, so check the partial ones against the sum too.
{
  const Qr = 2.5e-6;
  const a = 0.32;
  for (const span of [2 * Math.PI, Math.PI, Math.PI / 2, 0.4]) {
    for (const y of [0, 0.38, -0.25]) {
      const closed = ringAxisField(Qr, a, y, span);
      const num = ringAxisNumerical(Qr, a, y, 8000, span);
      const scale = Math.max(Math.abs(closed.E.x), Math.abs(closed.E.y), 1);
      const deg = ((span * 180) / Math.PI).toFixed(0);
      // Absolute against the field's own scale, not relative: on a closed ring at y = 0 both E_x
      // and E_y are zero, and a relative test there compares two piles of rounding error.
      const near = (got, exp, name) => ok(Math.abs(got - exp) <= 0.002 * scale, name);
      near(num.E.x, closed.E.x, `arc ${deg}° y=${y}: E_x closed vs sum`);
      near(num.E.y, closed.E.y, `arc ${deg}° y=${y}: E_y closed vs sum`);
      near(num.E.z, 0, `arc ${deg}° y=${y}: E_z cancels`);
    }
  }

  // E_y does not know about the span; only E_x does.
  approx(ringAxisField(Qr, a, 0.38, Math.PI).E.y, ringAxisField(Qr, a, 0.38, 2 * Math.PI).E.y, 1e-9,
    'arc: E_y is independent of the span');
  ok(Math.abs(ringAxisField(Qr, a, 0.38, 2 * Math.PI).E.x) < 1e-9, 'closed ring: E_x = 0');

  // Half ring at the centre is the textbook 2kλ/R.
  const half = ringAxisField(Qr, a, 0, Math.PI);
  const lambda = Qr / (a * Math.PI);
  approx(Math.abs(half.E.x), (2 * K * lambda) / a, 1e-6 * ((2 * K * lambda) / a), 'half ring at centre: |E| = 2kλ/R');
  approx(half.E.y, 0, 1e-9, 'half ring at centre: no axial field');

  // A thin arc is a point charge at distance r.
  const thin = ringAxisField(Qr, a, 0, 1e-4);
  approx(Math.hypot(thin.E.x, thin.E.y), (K * Qr) / (a * a), 1e-6 * ((K * Qr) / (a * a)), 'vanishing arc -> kQ/r^2');
}

// Circular plate: radial Riemann sum, and both limits.
{
  const Qd = 2.5e-6;
  const R = 0.35;
  for (const y of [0.4, 0.05, 1.5, -0.4]) {
    const closed = diskAxisField(Qd, R, y);
    const num = diskAxisNumerical(Qd, R, y, 20000);
    approx(num.E.y, closed.E.y, 0.002 * Math.abs(closed.E.y), `plate y=${y}: E_y closed vs radial sum`);
    const V = diskAxisPotential(Qd, R, y);
    const Vn = diskAxisPotentialNumerical(Qd, R, y, 20000);
    approx(Vn.V, V.V, 0.002 * Math.abs(V.V), `plate y=${y}: V closed vs radial sum`);
  }

  const sigma = Qd / (Math.PI * R * R);
  approx(diskAxisField(Qd, R, 1e-7).E.y, 2 * Math.PI * K * sigma, 1e-3 * 2 * Math.PI * K * sigma,
    'plate at y -> 0 is the infinite sheet, 2πkσ');
  approx(diskAxisField(Qd, R, 60).E.y, (K * Qd) / 3600, 0.002 * ((K * Qd) / 3600),
    'plate from far away -> kQ/y^2');
  approx(diskAxisField(Qd, R, -0.4).E.y, -diskAxisField(Qd, R, 0.4).E.y, 1e-9, 'plate: E flips sign through the plate');

  // E = -dV/dy, checked numerically against the closed-form field.
  const h = 1e-5;
  const y0 = 0.4;
  const dV = (diskAxisPotential(Qd, R, y0 + h).V - diskAxisPotential(Qd, R, y0 - h).V) / (2 * h);
  approx(-dV, diskAxisField(Qd, R, y0).E.y, 1e-4 * Math.abs(diskAxisField(Qd, R, y0).E.y), 'plate: E_y = -dV/dy');
}

{
  const Q1 = 1e-6;
  const V = potentialAt({ x: 1, y: 0, z: 0 }, [{ id: 1, q: Q1, x: 0, y: 0, z: 0 }]);
  approx(V, K * Q1 / 1, 0.002, 'V = kq/r at 1 m');
}

{
  const lambda = 2e-6;
  const L = 0.8;
  const d = 0.35;
  const closed = linePerpPotential(lambda, L, d);
  const num = linePerpPotentialNumerical(lambda, L, d, 48);
  approx(num.V, closed.V, 0.03, 'rod V: numerical vs analytic');
}

{
  const Qr = 3e-6;
  const a = 0.3;
  const y = 0.4;
  const closed = ringAxisPotential(Qr, a, y);
  const num = ringAxisPotentialNumerical(Qr, a, y, 48);
  approx(num.V, closed.V, 0.02, 'ring V: numerical vs analytic');
}

{
  const r = capacitorState({ A: 1.5, d: 2e-3, V: 12, mode: 'battery', dielectric: 'air', inserted: true });
  approx(r.C, 6.6375e-9, 0.02, 'Montgomery C = ε0 A/d (1.5 m², 2 mm)');
  approx(r.Q, 12 * r.C, 0.002, 'q = C ΔV');
}

{
  const base = { A: 1.5, d: 2e-3, V: 12, mode: 'battery', inserted: true };
  const r0 = capacitorState({ ...base, dielectric: 'air' });
  const rn = capacitorState({ ...base, dielectric: 'nylon410' });
  approx(rn.C / r0.C, 410, 0.01, 'nylon example: C = κ C0');
}

{
  const o = ohmState({ material: 'copper', L: 100, A: 3.3e-6, V: 9, T: 20 });
  approx(o.R, 0.521, 0.05, 'copper 100 m wire R = ρL/A');
  approx(o.I, 9 / o.R, 0.002, 'I = V/R');
}

{
  const b = bulbFromPower(60, 120);
  approx(b.R, 240, 0.002, '60 W / 120 V → 240 Ω');
  approx(b.I, 0.5, 0.002, '60 W / 120 V → 0.5 A');
}

{
  const p = powerState({ mode: 'ac', Vrms: 120, R: 240, f: 60 }, 0);
  approx(p.Vp, 120 * Math.SQRT2, 0.002, '120 Vrms → 170 V peak');
  approx(p.Pavg, 60, 0.02, 'P_avg = Vrms² / R = 60 W');
}

ok(Math.abs(QE - 1.6e-19) < 1e-21, 'q_e matches the sheet');
ok(Math.abs(MU0 - 4e-7 * Math.PI) < 1e-16, 'μ₀ = 4π×10⁻⁷');

console.log('\nConductors (image charges)');

{
  const q = 1e-6;
  const d = 0.5;
  const R = 0.2;
  const im = imageGrounded(q, d, R);
  const chg = [
    { id: 1, q, x: d, y: 0, z: 0 },
    { id: 2, q: im.q, x: im.x, y: 0, z: 0 },
  ];
  const scaleV = (K * q) / d;
  const Vs = [0, 0.7, 1.6, 2.5, Math.PI].map((th) => potentialAt({ x: R * Math.cos(th), y: R * Math.sin(th), z: 0 }, chg));
  ok(Vs.every((V) => Math.abs(V) < 1e-9 * scaleV), 'grounded sphere: q + image q′ give V = 0 everywhere on the surface');

  const { image, center } = imageIsolatedNeutral(q, d, R);
  const chg2 = [
    { id: 1, q, x: d, y: 0, z: 0 },
    { id: 2, q: image.q, x: image.x, y: 0, z: 0 },
    { id: 3, q: center.q, x: 0, y: 0, z: 0 },
  ];
  const V2 = [0, 1.1, 2.2, Math.PI].map((th) => potentialAt({ x: R * Math.cos(th), y: 0, z: R * Math.sin(th) }, chg2));
  ok(Math.max(...V2) - Math.min(...V2) < 1e-9 * scaleV, 'neutral isolated sphere: surface is an equipotential');
  approx(image.q + center.q, 0, 1e-12, 'neutral isolated sphere: induced charges sum to 0');

  // ∮ σ dA over the sphere, by quadrature in θ
  const integrate = (st) => {
    let acc = 0;
    const n = 4000;
    for (let i = 0; i < n; i++) {
      const th = ((i + 0.5) / n) * Math.PI;
      acc += sigmaSphere(st, { x: Math.cos(th), y: Math.sin(th), z: 0 }) * 2 * Math.PI * R * R * Math.sin(th) * (Math.PI / n);
    }
    return acc;
  };
  approx(integrate({ kind: 'grounded', R, q, d }), im.q, 1e-4, 'grounded: ∮ σ dA = q′ = −(R/d)q');
  approx(integrate({ kind: 'neutral', R, q, d }), 0, 1e-4 * q, 'neutral: ∮ σ dA = 0');
  ok(sigmaSphere({ kind: 'grounded', R, q, d }, { x: 1, y: 0, z: 0 }) < 0, 'grounded: σ facing a + charge is negative');
}

{
  const st = { kind: 'uniform', R: 0.3, Q: 2e-6, q: 0, d: 0, a: 0.2, b: 0.3 };
  approx(conductorField(st, { x: 0.1, y: 0, z: 0 }).mag, 0, 1e-12, 'E = 0 inside isolated sphere');
  approx(conductorField(st, { x: 0.6, y: 0, z: 0 }).mag, (K * 2e-6) / 0.36, 0.002, 'outside sphere E = kQ/r²');
  const cage = { kind: 'cage', R: 0.4, Q: 0, q: 1e-6, d: 0, a: 0.2, b: 0.4 };
  approx(conductorField(cage, { x: 0.3, y: 0, z: 0 }).mag, 0, 1e-12, 'E = 0 in Faraday-cage metal');
  approx(conductorField(cage, { x: 0.8, y: 0, z: 0 }).mag, (K * 1e-6) / 0.64, 0.002, 'outside isolated cage E = kq/r²');
}

console.log('\nBiot–Savart');

{
  const I = 2;
  const r = 0.05;
  const analytic = BwireInfinite(I, r);
  const B = Bpolyline(I, wireAlongY(-8, 8, 320), { x: r, y: 0, z: 0 }, 4);
  approx(-B.z, analytic, 0.01, 'long wire: B = μ₀I/2πr, along −ẑ at +x (thumb +ŷ)');
  approx(B.x, 0, 1e-3 * analytic, 'long wire: B_x = 0');
  approx(B.y, 0, 1e-3 * analytic, 'long wire: B_y = 0');
}

{
  const I = 3;
  const p = { x: 0.2, y: 0.35, z: 0 };
  const B = Bpolyline(I, wireAlongY(-0.6, 0.6, 60), p, 6);
  approx(Math.hypot(B.x, B.y, B.z), BwireFinite(I, -0.6, 0.6, p), 0.005, 'finite wire, off-center: Σ dB = (μ₀I/4πρ)(sinθ₂ − sinθ₁)');
}

{
  const I = 3;
  const R = 0.2;
  const z = 0.1;
  const B = Bpolyline(I, loopPoints(R, 96), { x: 0, y: z, z: 0 }, 4);
  approx(B.y, BloopAxis(I, R, z), 0.005, 'loop on axis: B_y = μ₀IR²/2(R²+z²)^{3/2} (counterclockwise → +ŷ)');
}

{
  const I = 1.5;
  const R = 0.16;
  const L = 0.8;
  const N = 24;
  const B = Bpolyline(I, helixPoints(R, L, N, 32), { x: 0, y: 0, z: 0 }, 2);
  const sheet = BsolenoidFiniteAxis(N / L, I, L, R, 0);
  approx(B.y, sheet, 0.02, 'helix solenoid at center ≈ finite current-sheet formula');
  ok(sheet < Bsolenoid(N / L, I), 'finite solenoid B < μ₀nI (ideal long-solenoid limit)');
}

console.log('\nAmpère');

{
  const I = 1.2;
  const pts = wireAlongY(-10, 10, 400);
  approx(ampereCirculation((p) => Bpolyline(I, pts, p, 2), 0.08, 32), mu0I(I), 0.01, 'Biot–Savart wire: ∮ B·dl = +μ₀I (counterclockwise from +y)');
}

{
  const I = 5;
  const Bf = (p) => BlongWire(I, 0, 0, 0, p);
  approx(amperianLoop(Bf, 0, 0, 0.3, 48).circ, MU0 * I, 1e-9, 'centered loop: ∮ B·dl = μ₀I');
  approx(amperianLoop(Bf, 0.18, 0.05, 0.3, 256).circ, MU0 * I, 1e-3, 'off-center loop: still μ₀I (B not constant on the loop)');
  approx(amperianLoop(Bf, 0.6, 0, 0.25, 256).circ, 0, 1e-3 * MU0 * I, 'wire outside the loop: ∮ B·dl = 0 though B ≠ 0');
  const a = 0.3;
  const r = 0.18;
  approx(amperianLoop((p) => BlongWire(6, 0, 0, a, p), 0, 0, r, 64).circ, (MU0 * 6 * r * r) / (a * a), 1e-9, 'inside a thick wire: I_enc = I r²/a²');
  approx(circleOverlapArea(1, 1, 1), 2 * Math.acos(0.5) - 0.5 * Math.sqrt(3), 1e-9, 'circle overlap (equal radii, d = R)');
  approx(enclosedFraction(0.2, 0, 0, 0.5, 0, 0.1), 0, 1e-12, 'disjoint wire: nothing enclosed');
  approx(enclosedFraction(0.5, 0, 0, 0.1, 0, 0.2), 1, 1e-12, 'wire fully inside loop: all enclosed');
}

console.log('\nMagnetic force');

{
  const L = { x: 0.5 * Math.sin(0.6), y: 0.5 * Math.cos(0.6), z: 0 };
  const F = wireForce(2, L, { x: 0, y: 0.3, z: 0 });
  approx(F.z, 2 * 0.5 * 0.3 * Math.sin(0.6), 1e-9, 'F = I L × B = ILB sinθ along ẑ');
}

{
  const d = 0.1;
  const an = FparallelWires(3, 4, 1, d);
  const F = parallelWireForceNumerical(3, 4, d, 1);
  approx(-F.x, an, 0.01, 'parallel wires: Σ I₂ dl × B₁ = μ₀I₁I₂L/2πd');
  ok(F.x < 0, 'same-direction currents attract');
  ok(parallelWireForceNumerical(3, -4, d, 1).x > 0, 'opposite currents repel');
}

{
  const p = PARTICLES.proton;
  const B = 0.2;
  const v = 1e7;
  const T = cyclotronPeriod(p.m, p.q, B);
  const tr = trajectory({ q: p.q, m: p.m, v0: { x: v, y: 0, z: 0 }, E: origin, B: { x: 0, y: B, z: 0 }, tMax: T, steps: 4000, bound: 100 });
  const zs = tr.pts.map((s) => s.z);
  const rNum = (Math.max(...zs) - Math.min(...zs)) / 2;
  approx(rNum, cyclotronRadius(p.m, v, p.q, B), 0.002, 'proton orbit (Boris push): r = mv/|q|B');
  const end = tr.pts[tr.pts.length - 1];
  approx(Math.hypot(end.x, end.z), 0, 0.01 * rNum, 'back at the start after T = 2πm/|q|B');
  ok(tr.pts[10].z > 0, 'proton, v = +x̂, B = +ŷ: F = qv × B bends toward +ẑ');

  const e = PARTICLES.electron;
  const Be = 1e-4;
  const tre = trajectory({ q: e.q, m: e.m, v0: { x: v, y: 0, z: 0 }, E: origin, B: { x: 0, y: Be, z: 0 }, tMax: cyclotronPeriod(e.m, e.q, Be) / 4, steps: 400, bound: 100 });
  ok(tre.pts[10].z < 0, 'electron bends the other way');

  const s30 = Math.sin(Math.PI / 6);
  const c30 = Math.cos(Math.PI / 6);
  const trh = trajectory({ q: p.q, m: p.m, v0: { x: v * c30, y: v * s30, z: 0 }, E: origin, B: { x: 0, y: B, z: 0 }, tMax: T, steps: 2000, bound: 100 });
  approx(trh.pts[trh.pts.length - 1].y, v * s30 * T, 1e-6, 'helix: pitch = v∥ T');

  const trs = trajectory({ q: p.q, m: p.m, v0: { x: v, y: 0, z: 0 }, E: { x: 0, y: 0, z: -v * B }, B: { x: 0, y: B, z: 0 }, tMax: 1e-7, steps: 500, bound: 100 });
  const es = trs.pts[trs.pts.length - 1];
  approx(es.z, 0, 1e-6, 'velocity selector: E = vB, no deflection');
  approx(es.x, v * 1e-7, 1e-6, 'velocity selector: moves at v');
}

console.log('\nCircuits (Kirchhoff)');

function solveLayout(id, values) {
  const layout = CIRCUITS.find((c) => c.id === id);
  const edges = netlist(layout, values);
  return { layout, edges, sol: solveCircuit(Object.keys(layout.nodes), edges, layout.ground) };
}

{
  const { layout, edges, sol } = solveLayout('series');
  approx(sol.I.R1, 1, 1e-3, 'series 12 V / (2+4+6) Ω: I = 1 A');
  approx(sol.I.R3, sol.I.R1, 1e-6, 'series: same current everywhere');
  approx(equivalentR(layout, edges), 12, 1e-9, 'series R_eq = ΣR');
  approx(sol.V.tm - sol.V.tr, 4, 1e-3, 'series: ΔV across R₂ = IR₂ = 4 V');
  approx(loopTerms(layout.loops[0].path, edges, sol).sum, 0, 1e-6, 'series loop rule: ΣΔV = 0');
}

{
  const { layout, edges, sol } = solveLayout('parallel');
  approx(sol.I.R1, 4, 1e-3, 'parallel: I₁ = 12 V / 3 Ω');
  approx(sol.I.R2, 2, 1e-3, 'parallel: I₂ = 12 V / 6 Ω');
  approx(sol.I.E1, 12 / equivalentR(layout, edges), 1e-3, 'parallel: battery current = V / R_eq');
  approx(junctionTerms('t1', edges, sol).sum, 0, 1e-6, 'parallel junction rule: ΣI_in = 0');
  for (const loop of layout.loops) approx(loopTerms(loop.path, edges, sol).sum, 0, 1e-6, `parallel loop rule: ${loop.name}`);
}

{
  const { layout, edges, sol } = solveLayout('combo');
  approx(sol.I.E1, 12 / (4 + 2), 1e-3, 'combo: I = V / (R₁ + R₂∥R₃) = 2 A');
  approx(sol.I.R2 + sol.I.R3, sol.I.R1, 1e-6, 'combo: I₁ splits into I₂ + I₃');
}

{
  const { layout, edges, sol } = solveLayout('twoloop');
  const Vt = 96 / 13;
  approx(sol.V.mt, Vt, 1e-4, 'two-loop: node voltage by hand (12−V)/2 + (6−V)/3 = V/4');
  approx(sol.I.R1, (12 - Vt) / 2, 1e-4, 'two-loop: I₁');
  approx(sol.I.R2, Vt / 4, 1e-4, 'two-loop: I₂');
  approx(sol.I.R3, (6 - Vt) / 3, 1e-4, 'two-loop: I₃ assumed into the junction');
  ok(sol.I.R3 < 0, 'two-loop: I₃ < 0 → it really flows out of the junction');
  approx(junctionTerms('mt', edges, sol).sum, 0, 1e-6, 'two-loop junction rule');
  for (const loop of layout.loops) approx(loopTerms(loop.path, edges, sol).sum, 0, 1e-6, `two-loop loop rule: ${loop.name}`);
}

console.log('\nFaraday / Lenz');

{
  const B = 0.4;
  const R = 0.25;
  const Rdot = 0.5;
  const N = 2;
  const r = expandingLoop(B, R, Rdot, N);
  approx(r.Phi, N * B * Math.PI * R * R, 1e-9, 'expanding loop: Φ = N B π R²');
  approx(r.emf, -N * B * 2 * Math.PI * R * Rdot, 1e-9, 'expanding loop: ε = −N B 2π R Ṙ');
}

{
  const B = 0.5;
  const w = 0.4;
  const v = 2;
  const r = slidingBar(B, w, 0.3, v);
  approx(r.Phi, B * w * 0.3, 1e-9, 'sliding bar: Φ = B w x');
  approx(r.emf, -B * w * v, 1e-9, 'sliding bar: ε = −B ℓ v');
}

{
  const N = 10;
  const B = 0.1;
  const A = 0.05;
  const omega = 12;
  const g0 = generator(N, B, A, omega, 0);
  approx(g0.Phi, N * B * A, 1e-9, 'generator t=0: Φ = NBA');
  approx(g0.emf, 0, 1e-9, 'generator t=0: ε = 0');
  const g90 = generator(N, B, A, omega, Math.PI / 2);
  approx(g90.Phi, 0, 1e-9, 'generator θ=90°: Φ = 0');
  approx(g90.emf, N * B * A * omega, 1e-9, 'generator θ=90°: ε = NBA ω');
}

{
  const m = 1.2;
  const z = 0.4;
  const R = 0.2;
  const vz = -0.3;
  const r = dipoleLoop(m, z, R, vz);
  const dt = 1e-6;
  const Phi2 = fluxDipoleLoop(m, z + vz * dt, R);
  approx(r.emf, -(Phi2 - r.Phi) / dt, 0.01, 'dipole loop: ε vs numerical −ΔΦ/Δt');
  ok(r.dPhi_dt > 0, 'dipole approaching (z>0, vz<0): Φ_y increases');
  ok(lenz(r.dPhi_dt).Isign < 0, 'Lenz: dΦ/dt > 0 → I clockwise (from +y)');
  approx(inducedCurrent(r.emf, 2), r.emf / 2, 1e-12, 'I = ε/R');
}

console.log('\nAC circuits');

{
  const L = 0.1;
  const C = 1e-5;
  const omega0 = 1 / Math.sqrt(L * C);
  const s = acState({ R: 10, L, C, f: omega0 / (2 * Math.PI), Vrms: 12, hasL: true, hasC: true });
  approx(s.XL, s.XC, 0.002, 'RLC resonance: X_L = X_C');
  approx(s.Z, 10, 0.002, 'RLC resonance: Z = R');
  approx(s.phi, 0, 0.002, 'RLC resonance: φ = 0');
  approx(s.Irms, 12 / 10, 0.002, 'RLC resonance: I = V/R is maximum');
  approx(s.f0, omega0 / (2 * Math.PI), 0.002, 'f₀ = 1/(2π√(LC))');
}

{
  const s = acState({ R: 100, L: 0, C: 1e-6, f: 1000, Vrms: 10, hasL: false, hasC: true });
  const XC = 1 / (2 * Math.PI * 1000 * 1e-6);
  approx(s.XC, XC, 0.002, 'RC: X_C = 1/ωC');
  approx(s.Z, Math.hypot(100, XC), 0.002, 'RC: |Z| = √(R²+X_C²)');
  ok(s.phi < 0, 'RC: φ < 0 (voltage lags current)');
}

{
  const s = acState({ R: 40, L: 0.08, C: 0, f: 60, Vrms: 120, hasL: true, hasC: false });
  approx(s.XL, 2 * Math.PI * 60 * 0.08, 0.002, 'RL: X_L = ωL');
  ok(s.phi > 0, 'RL: φ > 0 (voltage leads current)');
}

console.log('\nEM waves / Malus');

{
  approx(C, 1 / Math.sqrt(MU0 * EPS0), 1e-12, 'c = 1/√(μ₀ε₀)');
  approx(C, 2.998e8, 0.002, 'c ≈ 3.00×10⁸ m/s from sheet ε₀, μ₀');
}

{
  const E0 = 100;
  const w = planeWave({ E0, lambda: 500e-9, t: 0, x: 0 });
  approx(w.B0, E0 / C, 1e-12, 'B₀ = E₀/c');
  approx(w.f * 500e-9, C, 1e-12, 'c = f λ');
  approx(w.Iavg, intensityAvg(E0), 1e-12, 'I = ½ c ε₀ E₀²');
  approx(w.Iavg, (E0 * E0) / (2 * MU0 * C), 0.002, 'I = E₀² / (2 μ₀ c)');
  approx(w.Iavg, (E0 * w.B0) / (2 * MU0), 0.002, 'I = E₀ B₀ / (2 μ₀)');
  ok(spectrumBand(500e-9).id === 'vis', '500 nm is visible');
  ok(spectrumBand(0.125).id === 'microwave', '12.5 cm is microwave');
}

{
  const E0 = 50;
  const lambda = 1;
  const t = 0.3;
  const x = 0.2;
  const w = planeWave({ E0, lambda, t, x });
  const phase = (2 * Math.PI) / lambda * x - 2 * Math.PI * (C / lambda) * t;
  approx(w.Ey, E0 * Math.sin(phase), 1e-9, 'E_y = E₀ sin(kx − ωt)');
  approx(w.Bz * C, w.Ey, 1e-9, 'E/B = c at every instant');
  ok(w.Ey * w.Bz >= -1e-18, 'E_y and B_z same sign → S = (E×B)/μ₀ along +x');
}

{
  const I0 = 8;
  approx(malus(I0, 60), I0 * 0.25, 1e-9, 'Malus: I = I₀ cos²60° = I₀/4');
  approx(malusChain(I0, [0]).I, I0 / 2, 1e-9, 'unpolarized → one polarizer: I₀/2');
  approx(malusChain(I0, [0, 60]).I, I0 / 8, 1e-9, 'unpolarized → 0° then 60°: (I₀/2)cos²60° = I₀/8');
  approx(malusChain(I0, [0, 90]).I, 0, 1e-9, 'crossed polarizers: dark');
  approx(malusChain(I0, [0, 45, 90]).I, I0 / 8, 1e-9, '0° / 45° / 90°: I₀/8 — middle polarizer lets light through');
}

console.log('\nGeometric optics');

{
  const th1 = Math.PI / 4;
  const r = snell(1, th1, 1.5);
  approx(r.theta2, Math.asin(Math.sin(th1) / 1.5), 1e-9, 'air→glass 45°: n sinθ');
  ok(!r.tir, 'air→glass 45° is not TIR');
  approx(1 * Math.sin(th1), 1.5 * Math.sin(r.theta2), 1e-9, 'Snell: n₁ sinθ₁ = n₂ sinθ₂');
}

{
  const thc = criticalAngle(1.33, 1);
  approx(thc, Math.asin(1 / 1.33), 1e-9, 'water→air θ_c = sin⁻¹(1/1.33)');
  ok(snell(1.33, (55 * Math.PI) / 180, 1).tir, 'water→air 55° is TIR');
  ok(!snell(1.33, (35 * Math.PI) / 180, 1).tir, 'water→air 35° still transmits');
  ok(criticalAngle(1, 1.5) == null, 'no θ_c going air→glass');
}

{
  const m = imageOf({ f: 10, do: 30, ho: 8, kind: 'mirror' });
  approx(m.di, 15, 1e-9, 'concave f=10, d_o=30: d_i=15');
  approx(m.m, -0.5, 1e-9, 'm = −d_i/d_o = −1/2');
  approx(m.hi, -4, 1e-9, 'h_i = m h_o');
  ok(m.real && m.inverted, 'real inverted image');
}

{
  const L = imageOf({ f: 12, do: 36, ho: 8, kind: 'lens' });
  approx(L.di, 18, 1e-9, 'lens f=12, d_o=36: d_i=18');
  approx(L.m, -0.5, 1e-9, 'same algebra as the mirror');
  ok(L.imageX > 0, 'real lens image is on the far side');
}

{
  const v = imageOf({ f: -20, do: 20, ho: 6, kind: 'mirror' });
  approx(v.di, -10, 1e-9, 'convex f=−20, d_o=20: d_i=−10');
  ok(!v.real && !v.inverted, 'convex: virtual upright');
  approx(v.m, 0.5, 1e-9, 'convex |m| < 1');
}

{
  const sys = twoLenses({ f1: 10, f2: 10, do1: 20, ho: 4, sep: 30 });
  approx(sys.i1.di, 20, 1e-9, 'two-lens: first image at 20 cm');
  approx(sys.do2, 10, 1e-9, 'eyepiece sees object at its F');
  ok(sys.i2.infinite, 'Keplerian: final image at infinity');
}

console.log('\nFaraday: ε against a finite-difference −ΔΦ/Δt');

{
  const dt = 1e-7;
  const e = expandingLoop(0.4, 0.25, 0.5, 2);
  approx(e.emf, -(expandingLoop(0.4, 0.25 + 0.5 * dt, 0.5, 2).Phi - e.Phi) / dt, 1e-5, 'expanding loop: ε = −ΔΦ/Δt');
  const b = slidingBar(0.5, 0.4, 0.3, 2);
  approx(b.emf, -(slidingBar(0.5, 0.4, 0.3 + 2 * dt, 2).Phi - b.Phi) / dt, 1e-6, 'sliding bar: ε = −ΔΦ/Δt');
  const w = 12;
  const th = 0.7;
  const g = generator(10, 0.1, 0.05, w, th);
  const dPhi = generator(10, 0.1, 0.05, w, th + w * dt).Phi - generator(10, 0.1, 0.05, w, th - w * dt).Phi;
  approx(g.emf, -dPhi / (2 * dt), 1e-6, 'generator: ε = NBAω sinωt = −ΔΦ/Δt');
}

console.log('\nRay tracing (paraxial)');

/** Every outgoing ray, extended as a straight line, passes through (x, y). */
function raysMeet(bundle, x, y, tol) {
  return bundle.rays.every((r) => {
    const [a, b] = r.outgoing;
    const yy = a.y + ((b.y - a.y) / (b.x - a.x)) * (x - a.x);
    return Math.abs(yy - y) <= tol;
  });
}

{
  const lens = principalRays({ f: 12, do: 36, ho: 8, kind: 'lens' });
  ok(lens.rays.length === 3, 'lens: three principal rays');
  ok(raysMeet(lens, 18, -4, 1e-9), 'converging lens: all three rays cross at the real image (18 cm, −4 cm)');
  ok(lens.rays.every((r) => r.extension === null && r.outgoing[1].x > 0), 'real image: no dashed extensions, rays continue to the right');

  const mag = principalRays({ f: 12, do: 8, ho: 6, kind: 'lens' });
  ok(raysMeet(mag, -24, 18, 1e-9), 'magnifier (inside F): outgoing rays extended backward meet at the virtual image (−24 cm, 18 cm)');
  ok(mag.rays.every((r) => r.outgoing[1].x > 0 && r.extension && Math.abs(r.extension[1].x + 24) < 1e-9), 'virtual image: real rays go right, dashed extensions go back to the image');

  const div = principalRays({ f: -12, do: 24, ho: 8, kind: 'lens' });
  const dimg = imageOf({ f: -12, do: 24, ho: 8 });
  ok(raysMeet(div, dimg.di, dimg.hi, 1e-9), 'diverging lens: extensions meet at the virtual image');
  approx(div.rays[2].slopeOut, 0, 1e-12, 'diverging lens: ray aimed at the far F leaves parallel');

  const cm = principalRays({ f: 10, do: 30, ho: 8, kind: 'mirror' });
  ok(raysMeet(cm, -15, -4, 1e-9), 'concave mirror: reflected rays cross at the real image in front (−15 cm, −4 cm)');
  ok(cm.rays.every((r) => r.outgoing[1].x < 0), 'mirror: reflected rays head back toward the object side');
  const toC = cm.rays[1];
  const mIn = (toC.incoming[1].y - toC.incoming[0].y) / (toC.incoming[1].x - toC.incoming[0].x);
  approx(toC.slopeOut, mIn, 1e-12, 'mirror: ray aimed at C reflects back along itself');

  const inside = principalRays({ f: 12, do: 8, ho: 6, kind: 'mirror' });
  ok(raysMeet(inside, 24, 18, 1e-9), 'concave mirror inside F: extensions meet behind the mirror (+24 cm)');
  const vx = principalRays({ f: -20, do: 20, ho: 6, kind: 'mirror' });
  ok(raysMeet(vx, 10, 3, 1e-9), 'convex mirror: extensions meet at the virtual image (+10 cm, 3 cm)');
}

{
  // Keplerian telescope focused for a relaxed eye: intermediate image at the eyepiece focus.
  const f1 = 40;
  const f2 = 10;
  const d_o = 1000;
  const di1 = 1 / (1 / f1 - 1 / d_o);
  const sep = di1 + f2;
  const els = [
    { x: 0, f: f1 },
    { x: sep, f: f2 },
  ];
  const chief = traceRay(els, { x: -d_o, y: 50 }, -50 / d_o, sep + 40);
  const marginal = traceRay(els, { x: -d_o, y: 50 }, (8 - 50) / d_o, sep + 40);
  approx(marginal.slope, chief.slope, 1e-9, 'telescope: every ray leaves the eyepiece parallel (image at ∞)');
  approx(chief.slope / (-50 / d_o), 1 - sep / f2, 1e-9, 'telescope: angular magnification from the chief ray = 1 − sep/f₂');
  approx(1 - (f1 + f2) / f2, -f1 / f2, 1e-12, 'telescope: at sep = f₁ + f₂ that is −f₁/f₂');

  // Microscope with the final virtual image at the 25 cm near point.
  const fo = 4;
  const fe = 10;
  const d1 = 5;
  const sepM = 1 / (1 / fo - 1 / d1) + 1 / (1 / fe + 1 / 25);
  const sys = twoLenses({ f1: fo, f2: fe, do1: d1, ho: 2, sep: sepM });
  approx(sys.i2.di, -25, 1e-9, 'microscope: final virtual image at the near point');
  const xImg = sepM + sys.i2.di;
  const elsM = [
    { x: 0, f: fo },
    { x: sepM, f: fe },
  ];
  const meet = [2, 0, -1].every((yHit) => {
    const r = traceRay(elsM, { x: -d1, y: 2 }, (yHit - 2) / d1, sepM + 10);
    return Math.abs(r.exit.y + r.slope * (xImg - r.exit.x) - sys.i2.hi) < 1e-9;
  });
  ok(meet, 'microscope: rays through both lenses extend back to the final image');
}

console.log('\nAC: phasor current against a time-domain simulation');

/** RK4 on the series circuit L di/dt + Ri + q/C = V_p sin ωt, after the transient has died. */
function phasorError(p) {
  const s = acState(p);
  const w = 2 * Math.PI * p.f;
  const Vp = p.Vrms * Math.SQRT2;
  const hasL = p.hasL && p.L > 0;
  const hasC = p.hasC && p.C > 0;
  const spc = 2000;
  const cycles = 60;
  const dt = 1 / p.f / spc;
  const V = (t) => Vp * Math.sin(w * t);
  const vc = (q) => (hasC ? q / p.C : 0);
  // With L: state (q, i). Without L the current is algebraic: i = (V − q/C)/R.
  const f = (t, q, i) => (hasL ? [i, (V(t) - p.R * i - vc(q)) / p.L] : [(V(t) - vc(q)) / p.R, 0]);
  let q = 0;
  let i = 0;
  let t = 0;
  let worst = 0;
  for (let n = 0; n < cycles * spc; n++) {
    const k1 = f(t, q, i);
    const k2 = f(t + dt / 2, q + (dt / 2) * k1[0], i + (dt / 2) * k1[1]);
    const k3 = f(t + dt / 2, q + (dt / 2) * k2[0], i + (dt / 2) * k2[1]);
    const k4 = f(t + dt, q + dt * k3[0], i + dt * k3[1]);
    q += (dt / 6) * (k1[0] + 2 * k2[0] + 2 * k3[0] + k4[0]);
    i += (dt / 6) * (k1[1] + 2 * k2[1] + 2 * k3[1] + k4[1]);
    t += dt;
    if (n >= (cycles - 1) * spc) {
      const iNow = hasL ? i : (V(t) - vc(q)) / p.R;
      worst = Math.max(worst, Math.abs(iNow - s.Ip * Math.sin(w * t - s.phi)));
    }
  }
  return worst / s.Ip;
}

{
  const L = 0.08;
  const Cc = 4e-5;
  approx(phasorError({ R: 15, L, C: Cc, f: 60, Vrms: 120, hasL: true, hasC: true }), 0, 1e-3, 'RLC off resonance: I_p sin(ωt − φ) matches the ODE');
  approx(phasorError({ R: 15, L, C: Cc, f: 1 / (2 * Math.PI * Math.sqrt(L * Cc)), Vrms: 120, hasL: true, hasC: true }), 0, 1e-3, 'RLC at resonance: matches the ODE');
  approx(phasorError({ R: 100, L: 0, C: 2.5e-5, f: 60, Vrms: 120, hasL: false, hasC: true }), 0, 1e-3, 'RC: matches the ODE (current leads)');
  approx(phasorError({ R: 40, L: 0.12, C: 0, f: 60, Vrms: 120, hasL: true, hasC: false }), 0, 1e-3, 'RL: matches the ODE (current lags)');
}

console.log('\nWave optics: interference, diffraction, thin films');

// The fringe formulas against a direct sum of the two slits' fields — no shared algebra.
{
  const lambda = 600e-9;
  const d = 0.2e-3;
  const L = 2;
  const ds = doubleSlit({ lambda, d, L });
  approx(ds.dy, 6e-3, 1e-9, 'double slit: Δy = λL/d = 6.00 mm');
  approx(ds.ySmall(3), 18e-3, 1e-9, 'double slit: y₃ = 3λL/d = 18.0 mm');
  // Exact vs small-angle: at these numbers they agree to better than a part in 10⁴.
  approx(ds.yBright(3), ds.ySmall(3), 1e-4, 'double slit: L tanθ ≈ mλL/d at small angles');

  // Add the two slits as phasors and check the maxima land where thetaBright says.
  const amp = (theta) => {
    const k = (2 * Math.PI) / lambda;
    let re = 0;
    let im = 0;
    for (const y of [-d / 2, d / 2]) {
      const phase = -k * y * Math.sin(theta);
      re += Math.cos(phase);
      im += Math.sin(phase);
    }
    return (re * re + im * im) / 4;
  };
  for (const m of [0, 1, 2]) {
    const th = ds.thetaBright(m);
    approx(amp(th), 1, 1e-9, `double slit: two-phasor sum is maximal at the m = ${m} bright angle`);
    approx(doubleSlitIntensity(th, { lambda, d }), 1, 1e-9, `double slit: I is 1 at m = ${m}`);
  }
  for (const m of [0, 1]) {
    const th = ds.thetaDark(m);
    approx(amp(th), 0, 1e-9, `double slit: the phasors cancel at the m = ${m} dark angle`);
  }
  ok(ds.thetaBright(ds.maxOrder + 1) === null, 'double slit: an order past sinθ = 1 does not exist');
}

// Single slit: the sinc² zeros must sit exactly on a sinθ = mλ, and the envelope must kill
// the two-slit orders where d/a is an integer (the classic "missing order").
{
  const lambda = 633e-9;
  const a = 0.1e-3;
  const L = 2;
  const ss = singleSlit({ lambda, a, L });
  approx(ss.width, 25.32e-3, 1e-3, 'single slit: central width 2λL/a = 25.3 mm');
  approx((ss.theta1 * 180) / Math.PI, 0.3627, 1e-3, 'single slit: first minimum at 0.363°');
  for (const m of [1, 2, 3]) {
    approx(singleSlitIntensity(ss.thetaDark(m), { lambda, a }), 0, 1e-12, `single slit: I = 0 at the m = ${m} minimum`);
  }
  approx(singleSlitIntensity(0, { lambda, a }), 1, 1e-12, 'single slit: I = 1 straight ahead');
  // Numerically, the first side lobe sits near sinθ = 1.43 λ/a and is about 4.7% of the peak.
  let best = 0;
  let bestTh = 0;
  for (let i = 1; i < 4000; i++) {
    const th = ss.thetaDark(1) + ((ss.thetaDark(2) - ss.thetaDark(1)) * i) / 4000;
    const I = singleSlitIntensity(th, { lambda, a });
    if (I > best) { best = I; bestTh = th; }
  }
  approx(best, 0.0472, 0.02, 'single slit: first side lobe is ≈4.7% of the peak');
  approx((Math.sin(bestTh) * a) / lambda, 1.4303, 0.01, 'single slit: that lobe sits at sinθ ≈ 1.43 λ/a');

  const missing = doubleSlit({ lambda, d: 3 * a, L, a });
  approx(doubleSlitIntensity(missing.thetaBright(3), { lambda, d: 3 * a, a }), 0, 1e-12, 'double slit: the m = 3 order is missing when d = 3a');
}

// Grating: sharper than two slits, same maxima; m_max from d/λ.
{
  const g = grating({ lambda: 500e-9, linesPerM: 600e3, N: 12 });
  approx(g.d, 1.6667e-6, 1e-4, 'grating: 600 lines/mm → d = 1.667 μm');
  approx((g.thetaOrder(2) * 180) / Math.PI, 36.87, 1e-4, 'grating: m = 2 at 36.87°');
  ok(g.maxOrder === 3, 'grating: highest order is 3');
  ok(g.thetaOrder(4) === null, 'grating: m = 4 would need sinθ > 1');
  for (const m of [0, 1, 2, 3]) {
    approx(gratingIntensity(g.thetaOrder(m), { lambda: 500e-9, d: g.d, N: 12 }), 1, 1e-6, `grating: full brightness at m = ${m}`);
  }
  // N slits put N−2 subsidiary maxima between orders, and the principal peak narrows as 1/N.
  const halfWidth = (N) => {
    const gg = grating({ lambda: 500e-9, linesPerM: 600e3, N });
    let th = 0;
    while (gratingIntensity(th, { lambda: 500e-9, d: gg.d, N }) > 0.5) th += 1e-7;
    return th;
  };
  const w8 = halfWidth(8);
  const w32 = halfWidth(32);
  approx(w8 / w32, 4, 0.03, 'grating: the principal maximum narrows as 1/N');
}

// Rayleigh / Airy: θ_min must be the first zero of the Airy pattern.
{
  const r = rayleigh({ lambda: 550e-9, D: 5e-3, L: 10e3 });
  approx(r.thetaMin, 1.342e-4, 1e-3, 'Rayleigh: θ_min = 1.22λ/D = 1.34×10⁻⁴ rad');
  approx(r.separation, 1.342, 1e-3, 'Rayleigh: 1.34 m at 10 km');
  approx(airyIntensity(r.thetaMin, { lambda: 550e-9, D: 5e-3 }), 0, 2e-6, 'Airy: intensity vanishes at θ_min');
  approx(airyIntensity(0, { lambda: 550e-9, D: 5e-3 }), 1, 1e-9, 'Airy: peak is 1 on axis');
  // J₁ against its known zeros and a value from tables.
  approx(besselJ1(3.8317059702), 0, 1e-9, 'J₁ zero at 3.8317');
  approx(besselJ1(7.0155866698), 0, 1e-9, 'J₁ zero at 7.0156');
  approx(besselJ1(1), 0.4400505857, 1e-9, 'J₁(1) = 0.44005');
  approx(besselJ1(15), 0.2051040386, 2e-3, 'J₁(15) from the asymptotic branch');
}

// Thin films: count the shifts, then check against a direct phase sum of the two reflections.
{
  // Soap film in air: one shift (air→film only), so λ/4 is bright.
  const soap = thinFilm({ nFilm: 1.33, nSub: 1, lambda: 600e-9 });
  ok(soap.shifts === 1, 'soap film in air: one phase-shifting reflection');
  approx(soap.tBright, 112.78e-9, 1e-3, 'soap film: thinnest bright film is 112.8 nm');
  approx(soap.tDark, 225.56e-9, 1e-3, 'soap film: thinnest dark film is 225.6 nm');

  // MgF₂ on glass: two shifts, so λ/4 is now the dark one — that is how a coating kills a reflection.
  const ar = thinFilm({ nFilm: 1.38, nSub: 1.5, lambda: 550e-9 });
  ok(ar.shifts === 2, 'MgF₂ on glass: two phase-shifting reflections');
  approx(ar.tDark, 99.64e-9, 1e-3, 'AR coating: a quarter-wave layer cancels the reflection');
  approx(ar.tBright, 199.28e-9, 1e-3, 'AR coating: a half-wave layer reflects strongly');

  // The reflectance model must agree with adding the two reflected waves by hand.
  for (const film of [soap, ar]) {
    const { nFilm, nSub, lambda } = film === soap
      ? { nFilm: 1.33, nSub: 1, lambda: 600e-9 }
      : { nFilm: 1.38, nSub: 1.5, lambda: 550e-9 };
    for (const t of [40e-9, 99.64e-9, 150e-9, 225.56e-9]) {
      const f = thinFilm({ nFilm, nSub, lambda, t });
      const extra = f.shifts % 2 === 1 ? Math.PI : 0;
      const delta = (2 * Math.PI * 2 * nFilm * t) / lambda + extra;
      const byHand = (2 + 2 * Math.cos(delta)) / 4; // |1 + e^{iδ}|² / 4
      // Absolute, not relative: reflectance runs 0…1 and one of these thicknesses sits on a zero.
      approx(f.reflectance - byHand, 0, 1e-12, `thin film: reflectance matches the phasor sum at t = ${(t * 1e9).toFixed(0)} nm`);
    }
    approx(thinFilm({ nFilm, nSub, lambda, t: film.tBright }).reflectance, 1, 1e-9, 'thin film: the bright thickness reflects fully');
    approx(thinFilm({ nFilm, nSub, lambda, t: film.tDark }).reflectance, 0, 1e-12, 'thin film: the dark thickness cancels');
  }
}

// Michelson: the path changes by twice the mirror travel.
{
  const m = michelson({ dd: 0.1e-3, lambda: 632.8e-9 });
  approx(m.N, 316.06, 1e-4, 'Michelson: 316 fringes for a 0.1 mm mirror move at 632.8 nm');
  approx(m.pathChange, 0.2e-3, 1e-12, 'Michelson: the path changes by 2Δd');
  approx(sinc(0), 1, 1e-12, 'sinc(0) = 1');
  approx(sinc(Math.PI), 0, 1e-12, 'sinc(π) = 0');
}

// ---------------------------------------------------------------- gas breakdown
{
  for (const gas of GASES) {
    // The closed-form minimum against a numerical search of the curve it claims to minimise.
    const m = paschenMin(gas);
    let bestPd = m.pd;
    let bestV = Infinity;
    for (let i = 0; i <= 20000; i++) {
      const pd = 0.05 * (200 / 0.05) ** (i / 20000);
      const V = paschen(pd, 1, gas);
      if (V < bestV) { bestV = V; bestPd = pd; }
    }
    approx(bestV, m.V, 1e-4, `${gas.name}: Paschen minimum, numerical vs closed form`);
    approx(bestPd, m.pd, 2e-3, `${gas.name}: p·d at the minimum, numerical vs closed form`);

    // Breakdown depends on the product p·d, not on p and d apart.
    approx(paschen(2 * P_ATM, 0.0005, gas), paschen(P_ATM, 0.001, gas), 1e-12, `${gas.name}: V_b depends on p·d only`);

    // Above the minimum the curve rises; below it, it rises too — that is the whole point.
    const up = paschen(P_ATM, 0.01, gas);
    ok(up > m.V, `${gas.name}: above the minimum the curve rises`);
    ok(paschen(m.pd * 0.25, 1, gas) > m.V, `${gas.name}: below the minimum it rises again`);
  }

  // Too few collisions to avalanche at any voltage.
  ok(!Number.isFinite(paschen(1e-9, 1e-9)), 'vanishing p·d cannot break down at any voltage');

  // Air's minimum sits in the accepted band.
  const air = paschenMin(GASES[0]);
  ok(air.V > 300 && air.V < 360, `air's Paschen minimum is in the 300–360 V band (got ${air.V.toFixed(0)})`);
  ok(air.d > 5e-6 && air.d < 2e-5, 'air breaks down most easily at ~10 µm at one atmosphere');

  // The sampled curve never dips under the analytic minimum.
  const lowest = Math.min(...paschenCurve(GASES[0]).map((q) => q.V));
  ok(lowest >= air.V - 1e-6, 'no sampled point of the curve falls below the closed-form minimum');
}

{
  // Sphere relations, each checked against another.
  const R = 0.4;
  const V = 25000;
  const Q = chargeForPotential(V, R);
  approx(spherePotential(Q, R), V, 1e-12, 'chargeForPotential inverts spherePotential');
  approx(sphereSurfaceField(Q, R), V / R, 1e-12, 'at the surface E = V/R');
  approx(Q, sphereCapacitance(R) * V, 1e-12, 'Q = CV for an isolated sphere');
  approx(sparkEnergy(sphereCapacitance(R), V), 0.5 * Q * V, 1e-12, 'spark energy = ½QV');

  // The constant-strength rule is linear in the gap; Paschen is not.
  approx(strengthVolts(0.002) / strengthVolts(0.001), 2, 1e-12, '3 MV/m rule is linear in the gap');
  const r = paschen(P_ATM, 0.002) / paschen(P_ATM, 0.001);
  ok(r > 1 && r < 2, 'Paschen grows with the gap but sub-linearly at atmospheric pressure');

  // Both criteria agree that a big enough voltage sparks and a small enough one does not.
  ok(sparkCheck({ V: 1e6, d: 0.001 }).sparksPaschen && sparkCheck({ V: 1e6, d: 0.001 }).sparksStrength, '1 MV across 1 mm sparks either way');
  ok(!sparkCheck({ V: 1, d: 0.001 }).sparksPaschen && !sparkCheck({ V: 1, d: 0.001 }).sparksStrength, '1 V across 1 mm sparks neither way');
}

console.log(`\n${passed} passed, ${failed} failed`);
if (failed) process.exit(1);
