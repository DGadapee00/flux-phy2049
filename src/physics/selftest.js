import { K, EPS0, QE, MU0 } from './constants.js';
import { fieldAt } from './field.js';
import { sampleSphere, sampleCylinder, sampleCube, enclosedCharge } from './surfaces.js';
import { integrateFlux, gaussPrediction, matchQuality } from './flux.js';
import {
  linePerpField,
  linePerpNumerical,
  ringAxisField,
  ringAxisNumerical,
  linePerpPotential,
  linePerpPotentialNumerical,
  ringAxisPotential,
  ringAxisPotentialNumerical,
} from './analytic.js';
import { potentialAt } from './potential.js';
import { capacitorState } from './capacitor.js';
import { ohmState, powerState, bulbFromPower } from './circuit.js';
import {
  BwireInfinite,
  BloopAxis,
  Bsolenoid,
  Bpolyline,
  wireAlongY,
  ampereCirculation,
  mu0I,
  FparallelWires,
  cyclotronRadius,
} from './bfield.js';

let failed = 0;
let passed = 0;

function approx(a, b, tol, name) {
  const ok = Math.abs(a - b) <= tol * Math.max(1, Math.abs(b));
  if (ok) {
    passed += 1;
    console.log(`  PASS  ${name}`);
  } else {
    failed += 1;
    console.log(`  FAIL  ${name}`);
    console.log(`        got ${a}  expected ${b}  rel ${Math.abs(a - b) / Math.max(1, Math.abs(b))}`);
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
  approx(Phi, 0, 0.05 * Math.abs(Q / EPS0) || 1, 'dipole inside: Φ ≈ 0');
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

{
  const Qr = 3e-6;
  const a = 0.3;
  const y = 0.4;
  const closed = ringAxisField(Qr, a, y);
  const num = ringAxisNumerical(Qr, a, y, 48);
  approx(num.E.y, closed.E.y, 0.02, 'ring on axis: numerical vs analytic E_y');
  approx(Math.hypot(num.E.x, num.E.z), 0, 0.04 * Math.abs(closed.E.y), 'ring: radial E cancels');
}

{
  const Q = 1e-6;
  const V = potentialAt({ x: 1, y: 0, z: 0 }, [{ id: 1, q: Q, x: 0, y: 0, z: 0 }]);
  approx(V, K * Q / 1, 0.002, 'V = kq/r at 1 m');
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
  const r = capacitorState({
    A: 1.5,
    d: 2e-3,
    V: 12,
    mode: 'battery',
    dielectric: 'air',
    inserted: true,
  });
  approx(r.C, 6.6375e-9, 0.02, 'Montgomery C = ε0 A/d (1.5 m², 2 mm)');
  approx(r.Q, 12 * r.C, 0.002, 'q = C ΔV');
}

{
  const r0 = capacitorState({
    A: 1.5,
    d: 2e-3,
    V: 12,
    mode: 'battery',
    dielectric: 'air',
    inserted: true,
  });
  const rn = capacitorState({
    A: 1.5,
    d: 2e-3,
    V: 12,
    mode: 'battery',
    dielectric: 'nylon410',
    inserted: true,
  });
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

{
  const I = 2;
  const r = 0.05;
  const analytic = BwireInfinite(I, r);
  const pts = wireAlongY(-8, 8, 80);
  const B = Bpolyline(I, pts, { x: r, y: 0, z: 0 }, 4);
  approx(Math.abs(B.z), analytic, 0.03, 'long wire: |B| ≈ μ₀I/2πr');
  approx(B.x, 0, 0.05 * analytic, 'long wire: B_x ≈ 0');
  approx(B.y, 0, 0.05 * analytic, 'long wire: B_y ≈ 0');
}

{
  const I = 3;
  const R = 0.2;
  const z = 0.1;
  const analytic = BloopAxis(I, R, z);
  const n = 48;
  const pts = [];
  for (let i = 0; i <= n; i++) {
    const phi = (i / n) * 2 * Math.PI;
    pts.push({ x: R * Math.cos(phi), y: 0, z: R * Math.sin(phi) });
  }
  const B = Bpolyline(I, pts, { x: 0, y: z, z: 0 }, 6);
  approx(B.y, analytic, 0.04, 'loop on axis: B ≈ μ₀ I R² / 2(R²+z²)^{3/2}');
}

{
  approx(Bsolenoid(200, 1.5), MU0 * 200 * 1.5, 0.002, 'solenoid B = μ₀ n I');
}

{
  const I = 1.2;
  const pts = wireAlongY(-10, 10, 60);
  const circ = ampereCirculation((p) => Bpolyline(I, pts, p, 3), 0.08, 32);
  approx(circ, mu0I(I), 0.08, 'Ampère: ∮ B·dl ≈ μ₀ I_enc');
}

{
  approx(FparallelWires(3, 4, 2, 0.05), (MU0 * 3 * 4 * 2) / (2 * Math.PI * 0.05), 0.002, 'parallel wires F = μ₀ I₁ I₂ L / 2πd');
  approx(cyclotronRadius(1.67e-27, 1e6, 1.6e-19, 0.5), (1.67e-27 * 1e6) / (1.6e-19 * 0.5), 0.002, 'cyclotron r = mv/qB');
}

console.log(`\n${passed} passed, ${failed} failed`);
if (failed) process.exit(1);
