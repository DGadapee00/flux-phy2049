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

console.log(`\n${passed} passed, ${failed} failed`);
if (failed) process.exit(1);
