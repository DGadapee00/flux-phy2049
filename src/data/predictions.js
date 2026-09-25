/**
 * Predict first: "before you make this change, what happens to …?" for every lab.
 *
 * Watching a sim respond to a slider is a better textbook figure; committing to a prediction first
 * is what turns it into a test of your model that can fail (Sokoloff & Thornton's interactive
 * demonstrations). Each prompt names one change to the lab's setup and asks what it does to one to
 * three quantities. The student answers, the change is made in the lab, and the lab's own
 * computation grades the prediction — so a prompt's text can be wrong, but its grading can't.
 *
 * Prompt fields
 *   id, lab       unique id, and the lab it belongs to
 *   scenario      the preset it is written for; the prompt loads it unless the lab is already on it
 *   fits(s)       optional: the current setup already suits the prompt (then no preset is loaded)
 *   prep(s)       optional: put the setup into the starting state, before the student predicts
 *   ask           the change, as panel prose ($…$ is typeset)
 *   apply(s)      make the change
 *   watch         [{ id, label, get(c, s), fmt?(v), signed?, mode? }] — the quantities to predict;
 *                 a watch's own `mode` overrides the prompt's (a yes/no beside two magnitudes)
 *   mode          'dir' (bigger / smaller / same, on magnitudes unless `signed`), 'factor' (×4 … ×¼),
 *                 or 'bool' (yes / no; `get` returns a boolean and `label` is the question)
 *   factors       optional choices for 'factor' mode (default ×4, ×2, ×1, ×½, ×¼)
 *   tol           optional: how close is "the same" / "that factor" (default 0.5 %; a sum over
 *                 patches or a finite wire needs more)
 *   expect        { watchId: 'bigger' | 'smaller' | 'same' | factor | true | false } — the usual
 *                 outcome, which `why` explains. problems-check runs every prompt from its preset and
 *                 fails if the lab disagrees with `expect`; in the app, when a student's own setup
 *                 gives something else, the panel says so instead of showing `why`.
 *   why           one or two sentences: the reasoning behind the usual outcome
 */
import { fmtC, fmtV, fmtCharge, fmtE, fmtEnergy, fmtForce, fmtPhi, fmtR, fmtI, fmtP, fmtHz, fmtIrr, sciText } from '../ui/format.js';

const hyp = (v) => Math.hypot(v.x, v.y, v.z);
const deg = (r) => `${((r * 180) / Math.PI).toFixed(1)}°`;
const T = (x, unit) => `${sciText(x)} ${unit}`;
const plain = (x, unit = '', n = 3) => `${Number(x.toPrecision(n))}${unit ? ` ${unit}` : ''}`;
const cm = (m) => `${plain(m * 100)} cm`;

/** Move charge `i` so its distance from charge `j` scales by k, along the line between them. */
function stretch(s, i, j, k) {
  const a = s.charges[j];
  const b = s.charges[i];
  for (const ax of ['x', 'y', 'z']) b[ax] = a[ax] + k * (b[ax] - a[ax]);
}

const circuitEdge = (id) => ({
  I: (c) => Math.abs(c.circ.sol.I[id]),
  V: (c) => Math.abs(c.circ.sol.V[c.circ.edges.find((e) => e.id === id).a] - c.circ.sol.V[c.circ.edges.find((e) => e.id === id).b]),
  P: (c) => {
    const e = c.circ.edges.find((x) => x.id === id);
    return c.circ.sol.I[id] ** 2 * e.value;
  },
});

export const PREDICTIONS = [
  // ------------------------------------------------------------------ Exam 1
  {
    id: 'vec-scale-b',
    lab: 'vectors',
    scenario: 'acute',
    ask: 'Double the length of $\\vec{B}$, keeping its direction.',
    apply(s) {
      for (const ax of ['x', 'y', 'z']) s.b[ax] *= 2;
    },
    watch: [
      { id: 'dot', label: '$\\vec{A}\\cdot\\vec{B}$', get: (c) => c.vec.adb, fmt: (v) => plain(v), signed: true },
      { id: 'phi', label: 'the angle $\\phi$ between them', get: (c) => c.vec.phi, fmt: deg },
    ],
    mode: 'factor',
    expect: { dot: 2, phi: 1 },
    why: '$\\vec{A}\\cdot\\vec{B} = AB\\cos\\phi$: doubling $B$ doubles the product, and the angle depends only on the directions.',
  },
  {
    id: 'vec-reverse-b',
    lab: 'vectors',
    scenario: 'acute',
    ask: 'Reverse $\\vec{B}$ so it points the opposite way.',
    apply(s) {
      for (const ax of ['x', 'y', 'z']) s.b[ax] = -s.b[ax];
    },
    watch: [{ id: 'dot', label: '$\\vec{A}\\cdot\\vec{B}$', get: (c) => c.vec.adb, fmt: (v) => plain(v), signed: true }],
    mode: 'factor',
    factors: [2, 1, 0, -1, -2],
    expect: { dot: -1 },
    why: 'The angle becomes $180^\\circ - \\phi$ and $\\cos(180^\\circ - \\phi) = -\\cos\\phi$: same size, opposite sign.',
  },
  {
    id: 'force-double-r',
    lab: 'force',
    scenario: 'pair-repel',
    fits: (s) => s.charges?.length === 2,
    ask: 'Move $q_2$ straight away from $q_1$ until they are twice as far apart.',
    prep(s) {
      s.selectedId = s.charges[0].id;
    },
    apply(s) {
      stretch(s, 1, 0, 2);
    },
    watch: [{ id: 'F', label: 'the force on $q_1$', get: (c) => hyp(c.selectedForce), fmt: fmtForce }],
    mode: 'factor',
    expect: { F: 0.25 },
    why: 'Coulomb’s law goes as $1/r^2$: twice the distance, a quarter of the force.',
  },
  {
    id: 'force-double-q2',
    lab: 'force',
    scenario: 'pair-repel',
    fits: (s) => s.charges?.length === 2,
    ask: 'Double the charge $q_2$. Predict the force on each charge.',
    prep(s) {
      s.selectedId = s.charges[0].id;
    },
    apply(s) {
      s.charges[1].q *= 2;
    },
    watch: [{ id: 'F', label: 'the force on $q_1$', get: (c) => hyp(c.selectedForce), fmt: fmtForce }],
    mode: 'factor',
    expect: { F: 2 },
    why: '$F = k|q_1 q_2|/r^2$ is proportional to each charge. And by Newton’s third law the force on $q_2$ doubles too — the pair always push equally hard.',
  },
  {
    id: 'force-flip-q2',
    lab: 'force',
    scenario: 'pair-repel',
    fits: (s) => s.charges?.length === 2,
    ask: 'Flip the sign of $q_2$, keeping its size.',
    prep(s) {
      s.selectedId = s.charges[0].id;
    },
    apply(s) {
      s.charges[1].q = -s.charges[1].q;
    },
    watch: [{ id: 'F', label: 'the size of the force on $q_1$', get: (c) => hyp(c.selectedForce), fmt: fmtForce }],
    mode: 'dir',
    expect: { F: 'same' },
    why: 'Only the product’s sign changed, so the force turns from a push into a pull of exactly the same size.',
  },

  // ------------------------------------------------------------------ Exam 2
  {
    id: 'field-double-r',
    lab: 'field',
    scenario: 'single-plus',
    fits: (s) => s.charges?.length === 1,
    ask: 'Move the probe straight out from the charge to twice its distance.',
    apply(s) {
      const q = s.charges[0];
      for (const ax of ['x', 'y', 'z']) s.probe[ax] = q[ax] + 2 * (s.probe[ax] - q[ax]);
    },
    watch: [{ id: 'E', label: '$|\\vec{E}|$ at the probe', get: (c) => hyp(c.probeE), fmt: fmtE }],
    mode: 'factor',
    expect: { E: 0.25 },
    why: 'A point charge’s field is $kq/r^2$. Nothing about the probe matters except where it is.',
  },
  {
    id: 'field-double-q',
    lab: 'field',
    scenario: 'single-plus',
    fits: (s) => s.charges?.length === 1,
    ask: 'Double the charge that makes the field. The probe stays put.',
    apply(s) {
      s.charges[0].q *= 2;
    },
    watch: [{ id: 'E', label: '$|\\vec{E}|$ at the probe', get: (c) => hyp(c.probeE), fmt: fmtE }],
    mode: 'factor',
    expect: { E: 2 },
    why: 'The field is proportional to its source charge — superpose two copies of the same charge and you get twice the field.',
  },
  {
    id: 'rod-double-lambda',
    lab: 'integral',
    scenario: 'rod',
    fits: (s) => s.integral?.kind === 'rod' && s.integral.quantity === 'E',
    ask: 'Double the rod’s charge per length $\\lambda$, same length.',
    apply(s) {
      s.integral.lambda *= 2;
      s.integral.Q *= 2;
    },
    watch: [{ id: 'E', label: '$|\\vec{E}|$ at the point', get: (c) => c.integral.analytic.mag, fmt: fmtE }],
    mode: 'factor',
    expect: { E: 2 },
    why: 'Every piece $dq = \\lambda\\,dx$ doubles, so every $d\\vec{E}$ doubles, and so does their sum.',
  },
  {
    id: 'rod-double-d',
    lab: 'integral',
    scenario: 'rod',
    fits: (s) => s.integral?.kind === 'rod' && s.integral.quantity === 'E',
    ask: 'Move the field point to twice its distance $d$ from the rod.',
    apply(s) {
      s.integral.d *= 2;
    },
    watch: [{ id: 'E', label: '$|\\vec{E}|$ at the point', get: (c) => c.integral.analytic.mag, fmt: fmtE }],
    mode: 'factor',
    factors: [1, 0.5, 1 / 3, 0.25],
    tol: 0.04,
    expect: { E: 1 / 3 },
    why: 'Up close a rod looks like an infinite line, $E \\propto 1/d$ (×½); far away it looks like a point, $E \\propto 1/d^2$ (×¼). At this distance it is in between: about ×⅓.',
  },
  {
    id: 'gauss-move-inside',
    lab: 'gauss',
    scenario: 'center',
    ask: 'Slide the charge off-center, still inside the sphere.',
    apply(s) {
      s.charges[0].x += 0.2;
    },
    watch: [
      { id: 'Phi', label: 'the flux through the sphere', get: (c) => c.gauss.Phi, fmt: fmtPhi },
      { id: 'Emax', label: '$E$ on the nearest patch of the surface', get: (c) => Math.max(...c.gauss.samples.map((p) => p.mag)), fmt: fmtE },
    ],
    mode: 'dir',
    tol: 0.02,
    expect: { Phi: 'same', Emax: 'bigger' },
    why: 'The field on the surface changes — much stronger on the near side — but the flux counts only the charge enclosed: $\\Phi = Q_{\\text{enc}}/\\varepsilon_0$.',
  },
  {
    id: 'gauss-bigger-sphere',
    lab: 'gauss',
    scenario: 'center',
    ask: 'Double the radius of the Gaussian sphere around the charge.',
    apply(s) {
      s.surface.R *= 2;
    },
    watch: [{ id: 'Phi', label: 'the flux through the sphere', get: (c) => c.gauss.Phi, fmt: fmtPhi }],
    mode: 'factor',
    tol: 0.02,
    expect: { Phi: 1 },
    why: 'The area grows as $r^2$ and the field falls as $1/r^2$: the product, the flux, does not change. Only $Q_{\\text{enc}}$ decides it.',
  },
  {
    id: 'conductor-bigger-sphere',
    lab: 'conductors',
    scenario: 'uniform',
    ask: 'Make the charged metal sphere larger (radius 0.35 m → 0.5 m), same charge. The probe stays outside it.',
    prep(s) {
      s.R = 0.35;
      s.probe = { x: 0.62, y: 0, z: 0 };
    },
    apply(s) {
      s.R = 0.5;
    },
    watch: [
      { id: 'E', label: '$E$ at the probe', get: (c) => c.cond.mag, fmt: fmtE },
      { id: 'sigma', label: 'the surface charge density $\\sigma$', get: (c) => c.sigma, fmt: (v) => T(v, 'C/m²') },
    ],
    mode: 'dir',
    expect: { E: 'same', sigma: 'smaller' },
    why: 'Outside, a charged sphere’s field is $kQ/r^2$ whatever its size (Gauss). The same charge spread over more area is thinner: $\\sigma = Q/4\\pi R^2$.',
  },

  // ------------------------------------------------------------------ Exam 3
  {
    id: 'potential-double-r',
    lab: 'potential',
    scenario: 'v-plus',
    fits: (s) => s.charges?.length === 1,
    ask: 'Move the probe straight out to twice its distance from the charge.',
    apply(s) {
      const q = s.charges[0];
      for (const ax of ['x', 'y', 'z']) s.probe[ax] = q[ax] + 2 * (s.probe[ax] - q[ax]);
    },
    watch: [
      { id: 'V', label: 'the potential $V$', get: (c) => c.V, fmt: fmtV, signed: true },
      { id: 'E', label: '$|\\vec{E}|$', get: (c) => hyp(c.probeE), fmt: fmtE },
    ],
    mode: 'factor',
    expect: { V: 0.5, E: 0.25 },
    why: '$V = kq/r$ but $E = kq/r^2$: potential falls off one power more slowly than the field.',
  },
  {
    id: 'potential-flip',
    lab: 'potential',
    scenario: 'v-plus',
    fits: (s) => s.charges?.length === 1,
    ask: 'Flip the sign of the charge.',
    apply(s) {
      s.charges[0].q = -s.charges[0].q;
    },
    watch: [{ id: 'V', label: 'the potential $V$ at the probe', get: (c) => c.V, fmt: fmtV, signed: true }],
    mode: 'factor',
    factors: [2, 1, 0, -1, -2],
    expect: { V: -1 },
    why: 'Potential is a signed scalar, $kq/r$: a negative charge makes a potential well as deep as the positive one’s hill is high.',
  },
  {
    id: 'cap-battery-double-d',
    lab: 'capacitor',
    scenario: 'cap-12v',
    fits: (s) => s.cap?.mode === 'battery' && s.cap.d <= 0.06,
    ask: 'The battery stays connected. Pull the plates apart to twice the separation $d$.',
    apply(s) {
      s.cap.d *= 2;
    },
    watch: [
      { id: 'C', label: '$C$', get: (c) => c.cap.C, fmt: fmtC },
      { id: 'Q', label: 'the charge $q$', get: (c) => c.cap.Q, fmt: fmtCharge },
      { id: 'U', label: 'stored energy $U$', get: (c) => c.cap.U, fmt: fmtEnergy },
    ],
    mode: 'factor',
    expect: { C: 0.5, Q: 0.5, U: 0.5 },
    why: '$C = \\kappa\\varepsilon_0 A/d$ halves. The battery holds $V$ fixed, so $q = CV$ and $U = \\tfrac12 CV^2$ halve with it — charge flows back into the battery.',
  },
  {
    id: 'cap-isolated-double-d',
    lab: 'capacitor',
    scenario: 'cap-isolated',
    fits: (s) => s.cap?.mode === 'isolated' && s.cap.d <= 0.06,
    ask: 'The capacitor is disconnected (isolated). Pull the plates apart to twice the separation $d$.',
    apply(s) {
      s.cap.d *= 2;
    },
    watch: [
      { id: 'Q', label: 'the charge $q$', get: (c) => c.cap.Q, fmt: fmtCharge },
      { id: 'V', label: 'the voltage $V$', get: (c) => c.cap.V, fmt: fmtV },
      { id: 'U', label: 'stored energy $U$', get: (c) => c.cap.U, fmt: fmtEnergy },
    ],
    mode: 'factor',
    expect: { Q: 1, V: 2, U: 2 },
    why: 'Isolated plates keep their charge. $C$ halves, so $V = q/C$ doubles and $U = q^2/2C$ doubles — the extra energy is the work you did pulling the plates apart.',
  },
  {
    id: 'cap-dielectric-battery',
    lab: 'capacitor',
    scenario: 'cap-12v',
    ask: 'The battery stays connected. Slide a slab of paper ($\\kappa = 3.3$) between the plates.',
    prep(s) {
      s.cap.mode = 'battery';
      s.cap.dielectric = 'air';
      s.cap.inserted = true;
    },
    apply(s) {
      s.cap.dielectric = 'paper';
    },
    watch: [
      { id: 'C', label: '$C$', get: (c) => c.cap.C, fmt: fmtC },
      { id: 'Q', label: 'the charge $q$', get: (c) => c.cap.Q, fmt: fmtCharge },
      { id: 'E', label: 'the field $E$ between the plates', get: (c) => c.cap.E, fmt: fmtE },
    ],
    mode: 'dir',
    expect: { C: 'bigger', Q: 'bigger', E: 'same' },
    why: '$C$ grows by $\\kappa$, and with $V$ held by the battery more charge flows on. $E = V/d$ is set by the battery and the gap, so it does not change.',
  },
  {
    id: 'ohm-double-L',
    lab: 'ohm',
    scenario: 'ohm-headlight',
    ask: 'Use a wire twice as long, same material, thickness and voltage.',
    apply(s) {
      s.ohm.L *= 2;
    },
    watch: [
      { id: 'R', label: 'resistance $R$', get: (c) => c.ohm.R, fmt: fmtR },
      { id: 'I', label: 'current $I$', get: (c) => c.ohm.I, fmt: fmtI },
      { id: 'P', label: 'power $P$', get: (c) => c.ohm.P, fmt: fmtP },
    ],
    mode: 'factor',
    expect: { R: 2, I: 0.5, P: 0.5 },
    why: '$R = \\rho L/A$ doubles. At fixed $V$, $I = V/R$ halves, and so does $P = V^2/R$.',
  },
  {
    id: 'ohm-double-A',
    lab: 'ohm',
    scenario: 'ohm-headlight',
    ask: 'Use a wire with twice the cross-sectional area, same length and voltage.',
    apply(s) {
      s.ohm.A *= 2;
    },
    watch: [
      { id: 'R', label: 'resistance $R$', get: (c) => c.ohm.R, fmt: fmtR },
      { id: 'I', label: 'current $I$', get: (c) => c.ohm.I, fmt: fmtI },
      { id: 'J', label: 'current density $J$', get: (c) => c.ohm.J, fmt: (v) => T(v, 'A/m²') },
    ],
    mode: 'factor',
    expect: { R: 0.5, I: 2, J: 1 },
    why: 'Two wires side by side: half the resistance, twice the current. But $J = I/A$ — and so the drift speed — stays the same, because $E = V/L$ did not change.',
  },
  {
    id: 'ohm-heat',
    lab: 'ohm',
    scenario: 'ohm-headlight',
    ask: 'Heat the tungsten filament from 20 °C to 500 °C, same voltage.',
    prep(s) {
      s.ohm.T = 20;
    },
    apply(s) {
      s.ohm.T = 500;
    },
    watch: [
      { id: 'R', label: 'resistance $R$', get: (c) => c.ohm.R, fmt: fmtR },
      { id: 'I', label: 'current $I$', get: (c) => c.ohm.I, fmt: fmtI },
    ],
    mode: 'dir',
    expect: { R: 'bigger', I: 'smaller' },
    why: 'A metal’s resistivity rises with temperature, $\\rho = \\rho_0[1 + \\alpha(T - T_0)]$. That is why a bulb draws its biggest current the instant it is switched on, while cold.',
  },
  {
    id: 'power-double-R',
    lab: 'power',
    scenario: 'pwr-60',
    fits: (s) => s.power?.mode === 'dc',
    ask: 'Same outlet voltage: swap in a bulb with twice the resistance.',
    prep(s) {
      if (s.power.R > 200) s.power.R = 120;
    },
    apply(s) {
      s.power.R *= 2;
    },
    watch: [
      { id: 'I', label: 'current $I$', get: (c) => c.power.I, fmt: fmtI },
      { id: 'P', label: 'power $P$', get: (c) => c.power.P, fmt: fmtP },
    ],
    mode: 'factor',
    expect: { I: 0.5, P: 0.5 },
    why: 'With $V$ fixed, use $P = V^2/R$: twice the resistance, half the power — a dimmer bulb. $P = I^2R$ suggests the opposite only if you forget that $I$ halves too.',
  },
  {
    id: 'power-double-V',
    lab: 'power',
    scenario: 'pwr-60',
    fits: (s) => s.power?.mode === 'dc' && s.power.V <= 120,
    ask: 'Same bulb, twice the voltage.',
    apply(s) {
      s.power.V *= 2;
    },
    watch: [
      { id: 'I', label: 'current $I$', get: (c) => c.power.I, fmt: fmtI },
      { id: 'P', label: 'power $P$', get: (c) => c.power.P, fmt: fmtP },
    ],
    mode: 'factor',
    expect: { I: 2, P: 4 },
    why: 'Twice the voltage drives twice the current through the same $R$, and $P = IV$ gets both factors: ×4. (A real filament heats up and its $R$ rises, so it falls a little short.)',
  },
  {
    id: 'breakdown-wider-gap',
    lab: 'breakdown',
    scenario: 'doorknob',
    ask: 'Keep the same voltage but double the gap $d$ between hand and doorknob.',
    apply(s) {
      s.bd.d *= 2;
    },
    watch: [
      { id: 'E', label: 'the field in the gap', get: (c) => c.bd.E, fmt: fmtE },
      { id: 'spark', label: 'Does it still spark (by the dielectric-strength rule)?', get: (c) => !!c.bd.sparksStrength, mode: 'bool' },
    ],
    mode: 'dir',
    expect: { E: 'smaller', spark: false },
    why: '$E \\approx \\Delta V/d$ halves, to 2.25 MV/m — below air’s dielectric strength of about 3 MV/m, so the gap holds.',
  },

  // ------------------------------------------------------------------ Exam 4
  {
    id: 'circ-series-raise-R3',
    lab: 'circuits',
    scenario: 'series',
    ask: 'Raise $R_3$ from 6 Ω to 18 Ω.',
    prep(s) {
      s.values = {};
    },
    apply(s) {
      s.values.R3 = 18;
    },
    watch: [
      { id: 'I', label: 'the current', get: circuitEdge('R1').I, fmt: fmtI },
      { id: 'V1', label: 'the voltage across $R_1$', get: circuitEdge('R1').V, fmt: fmtV },
      { id: 'V3', label: 'the voltage across $R_3$', get: circuitEdge('R3').V, fmt: fmtV },
    ],
    mode: 'dir',
    expect: { I: 'smaller', V1: 'smaller', V3: 'bigger' },
    why: 'More total resistance means less current everywhere in the loop, so $R_1$ drops less voltage. The battery’s 12 V still has to be used up around the loop, so $R_3$ takes a bigger share.',
  },
  {
    id: 'circ-parallel-raise-R2',
    lab: 'circuits',
    scenario: 'parallel',
    ask: 'Raise $R_2$ to 30 Ω.',
    prep(s) {
      s.values = {};
    },
    apply(s) {
      s.values.R2 = 30;
    },
    watch: [
      { id: 'I1', label: 'the current in $R_1$', get: circuitEdge('R1').I, fmt: fmtI },
      { id: 'Ibat', label: 'the battery’s current', get: circuitEdge('E1').I, fmt: fmtI },
    ],
    mode: 'dir',
    expect: { I1: 'same', Ibat: 'smaller' },
    why: 'Each branch sits across the full battery voltage on its own, so $R_1$’s current is untouched. The battery supplies the sum of the branches, and one branch now takes less.',
  },
  {
    id: 'circ-bulbs-dim-B',
    lab: 'circuits',
    scenario: 'bulbsC',
    ask: 'Bulb C is in series with the pair A ∥ B. Raise bulb B’s resistance from 10 Ω to 30 Ω.',
    prep(s) {
      s.values = {};
    },
    apply(s) {
      s.values.B = 30;
    },
    watch: [
      { id: 'A', label: 'bulb A’s brightness (power)', get: circuitEdge('A').P, fmt: fmtP },
      { id: 'C', label: 'bulb C’s brightness (power)', get: circuitEdge('C').P, fmt: fmtP },
    ],
    mode: 'dir',
    expect: { A: 'bigger', C: 'smaller' },
    why: 'The pair’s resistance rises, so less current flows through C: C dims and takes a smaller share of the voltage. That leaves more voltage across the pair, so A — whose resistance did not change — gets brighter.',
  },
  {
    id: 'rc-double-R',
    lab: 'rc',
    scenario: 'charge',
    fits: (s) => s.mode === 'charge' && s.net === 'one',
    ask: 'Before closing the switch, double the resistance $R$.',
    prep(s) {
      s.t = 0;
      s.closed = false;
    },
    apply(s) {
      s.R *= 2;
    },
    watch: [
      { id: 'tau', label: 'the time constant $\\tau$', get: (c) => c.rc.tau, fmt: (v) => `${plain(v)} s` },
      { id: 'Q', label: 'the charge it ends up with', get: (c) => c.rc.Qmax, fmt: fmtCharge },
      { id: 'I0', label: 'the current the instant the switch closes', get: (c) => c.rc.Imax, fmt: fmtI },
    ],
    mode: 'factor',
    expect: { tau: 2, Q: 1, I0: 0.5 },
    why: 'The final charge is $C\\varepsilon$ — the resistor has no say in it. What $R$ controls is how fast charge can get there: half the starting current $\\varepsilon/R$, so twice the time constant $RC$.',
  },
  {
    id: 'rc-one-more-tau',
    lab: 'rc',
    scenario: 'charge',
    fits: (s) => s.mode === 'charge',
    ask: 'The capacitor has been charging for one time constant. Let it run one more ($t = \\tau \\to 2\\tau$).',
    prep(s) {
      s.closed = true;
      s.t = s.R * (s.net === 'parallel' ? s.C1 + s.C2 : s.net === 'series' ? (s.C1 * s.C2) / (s.C1 + s.C2) : s.C1);
    },
    apply(s) {
      s.t *= 2;
    },
    watch: [
      { id: 'I', label: 'the current', get: (c) => c.rc.I, fmt: fmtI },
      { id: 'left', label: 'the charge still to come, $q_{\\max} - q$', get: (c) => c.rc.Qmax - c.rc.q, fmt: fmtCharge },
    ],
    mode: 'factor',
    factors: [1, 0.5, 0.37, 0.25, 0],
    tol: 0.01,
    expect: { I: 0.37, left: 0.37 },
    why: 'An exponential shrinks by the same factor, $e^{-1} \\approx 0.37$, every time constant — whatever is left of the gap, not a fixed amount. So a capacitor is 63% full at $\\tau$, 86% at $2\\tau$, and never quite 100%.',
  },
  {
    id: 'rc-series-to-parallel',
    lab: 'rc',
    scenario: 'series',
    fits: (s) => s.mode === 'charge' && s.net === 'series',
    ask: 'Rewire the two capacitors from one-after-the-other (series) to side-by-side (parallel).',
    prep(s) {
      s.t = 0;
      s.closed = false;
    },
    apply(s) {
      s.net = 'parallel';
    },
    watch: [
      { id: 'tau', label: 'the time constant', get: (c) => c.rc.tau, fmt: (v) => `${plain(v * 1000)} ms` },
      { id: 'Q', label: 'the total charge stored at the end', get: (c) => c.rc.Qmax, fmt: fmtCharge },
    ],
    mode: 'dir',
    expect: { tau: 'bigger', Q: 'bigger' },
    why: 'In parallel the capacitances add, $C_{\\text{eq}} = C_1 + C_2$; in series $C_{\\text{eq}}$ is smaller than either. More capacitance holds more charge at the same $\\varepsilon$ and takes longer to fill through the same $R$.',
  },
  {
    id: 'biot-wire-double-r',
    lab: 'biot',
    scenario: 'wire',
    ask: 'Move the probe to twice its distance from the wire.',
    prep(s) {
      s.probe = { x: 0.12, y: 0, z: 0 };
    },
    apply(s) {
      s.probe.x *= 2;
    },
    watch: [{ id: 'B', label: '$B$ at the probe', get: (c) => c.biot.mag, fmt: (v) => T(v, 'T') }],
    mode: 'factor',
    tol: 0.03,
    expect: { B: 0.5 },
    why: 'A long straight wire gives $B = \\mu_0 I/2\\pi r$: $1/r$, not $1/r^2$. (This wire is finite, so it comes out a hair under ×½.)',
  },
  {
    id: 'biot-loop-double-I',
    lab: 'biot',
    scenario: 'loop',
    ask: 'Double the current in the loop.',
    apply(s) {
      s.I *= 2;
    },
    watch: [{ id: 'B', label: '$B$ at the probe', get: (c) => c.biot.mag, fmt: (v) => T(v, 'T') }],
    mode: 'factor',
    expect: { B: 2 },
    why: 'Every current element’s $d\\vec{B} \\propto I\\,d\\vec{l}\\times\\hat{r}/r^2$ doubles, so the sum does too.',
  },
  {
    id: 'ampere-bigger-loop',
    lab: 'ampere',
    scenario: 'center',
    ask: 'Double the radius of the Ampère loop around the wire.',
    apply(s) {
      s.r *= 2;
    },
    watch: [
      { id: 'B', label: '$B$ on the loop', get: (c) => c.amp.Bsym, fmt: (v) => T(v, 'T') },
      { id: 'circ', label: '$\\oint \\vec{B}\\cdot d\\vec{l}$', get: (c) => c.amp.circ, fmt: (v) => T(v, 'T·m') },
    ],
    mode: 'factor',
    tol: 0.01,
    expect: { B: 0.5, circ: 1 },
    why: 'The field on the loop halves, but the loop is twice as long: $\\oint \\vec{B}\\cdot d\\vec{l} = \\mu_0 I_{\\text{enc}}$, and the enclosed current did not change.',
  },
  {
    id: 'magforce-double-v',
    lab: 'magforce',
    scenario: 'proton',
    ask: 'Launch the proton at twice the speed, same field.',
    apply(s) {
      s.v *= 2;
    },
    watch: [
      { id: 'r', label: 'the radius of its circle', get: (c) => c.mf.run.rA, fmt: (v) => cm(v) },
      { id: 'T', label: 'the time for one lap', get: (c) => c.mf.run.T, fmt: (v) => T(v, 's') },
    ],
    mode: 'factor',
    expect: { r: 2, T: 1 },
    why: '$qvB = mv^2/r$ gives $r = mv/qB$: twice as fast, twice the radius. The lap is twice as long too, so the period $T = 2\\pi m/qB$ does not depend on speed at all — the principle behind the cyclotron.',
  },
  {
    id: 'magforce-wire-parallel',
    lab: 'magforce',
    scenario: 'wire',
    ask: 'Turn the wire so its current runs along $\\vec{B}$ ($\\theta = 0$).',
    prep(s) {
      s.theta = 90;
    },
    apply(s) {
      s.theta = 0;
    },
    watch: [{ id: 'F', label: 'the force on the wire', get: (c) => c.mf.Fmag, fmt: fmtForce }],
    mode: 'factor',
    factors: [2, 1, 0.5, 0],
    expect: { F: 0 },
    why: '$F = ILB\\sin\\theta$: a current along the field feels no magnetic force.',
  },
  {
    id: 'magforce-parallel-double-d',
    lab: 'magforce',
    scenario: 'parallel',
    ask: 'Move the two parallel wires twice as far apart.',
    apply(s) {
      s.d *= 2;
    },
    watch: [{ id: 'F', label: 'the force between them', get: (c) => c.mf.Fmag ?? hyp(c.mf.F), fmt: fmtForce }],
    mode: 'factor',
    expect: { F: 0.5 },
    why: 'Each wire sits in the other’s field $\\mu_0 I/2\\pi d$, so $F/L = \\mu_0 I_1 I_2/2\\pi d$ goes as $1/d$.',
  },

  // ------------------------------------------------------------------ Exam 5
  {
    id: 'faraday-bar-double-B',
    lab: 'faraday',
    scenario: 'bar',
    ask: 'Double the magnetic field while the bar slides the same way.',
    prep(s) {
      s.t = 0;
      if (s.B > 0.5) s.B = 0.5;
    },
    apply(s) {
      s.B *= 2;
    },
    watch: [
      { id: 'emf', label: 'the emf', get: (c) => c.far.emf, fmt: (v) => `${plain(Math.abs(v) * 1000)} mV` },
      { id: 'I', label: 'the current', get: (c) => c.far.I, fmt: (v) => `${plain(Math.abs(v) * 1000)} mA` },
    ],
    mode: 'factor',
    expect: { emf: 2, I: 2 },
    why: 'Motional emf is $\\varepsilon = BLv$ — the rate the swept area gathers flux — and the loop’s resistance is unchanged, so the current follows.',
  },
  {
    id: 'faraday-bar-double-Rloop',
    lab: 'faraday',
    scenario: 'bar',
    ask: 'Double the resistance of the circuit. The bar slides the same way.',
    prep(s) {
      s.t = 0;
      if (s.Rloop > 10) s.Rloop = 2;
    },
    apply(s) {
      s.Rloop *= 2;
    },
    watch: [
      { id: 'emf', label: 'the emf', get: (c) => c.far.emf, fmt: (v) => `${plain(Math.abs(v) * 1000)} mV` },
      { id: 'I', label: 'the current', get: (c) => c.far.I, fmt: (v) => `${plain(Math.abs(v) * 1000)} mA` },
    ],
    mode: 'factor',
    expect: { emf: 1, I: 0.5 },
    why: 'The emf comes from the changing flux alone; resistance only decides how much current it can drive, $I = \\varepsilon/R$.',
  },
  {
    id: 'ac-raise-f',
    lab: 'ac',
    scenario: 'rlc',
    ask: 'Raise the frequency from 60 Hz to 120 Hz.',
    prep(s) {
      s.f = 60;
    },
    apply(s) {
      s.f = 120;
    },
    watch: [
      { id: 'XL', label: '$X_L$', get: (c) => c.ac.XL, fmt: fmtR },
      { id: 'XC', label: '$X_C$', get: (c) => c.ac.XC, fmt: fmtR },
    ],
    mode: 'factor',
    expect: { XL: 2, XC: 0.5 },
    why: '$X_L = \\omega L$ grows with frequency — an inductor fights fast changes. $X_C = 1/\\omega C$ shrinks — a capacitor passes fast changes easily.',
  },
  {
    id: 'ac-toward-resonance',
    lab: 'ac',
    scenario: 'rlc',
    ask: 'This circuit is below resonance ($f_0 \\approx 89$ Hz). Raise $f$ from 60 Hz to 85 Hz.',
    prep(s) {
      s.f = 60;
    },
    apply(s) {
      s.f = 85;
    },
    watch: [
      { id: 'Z', label: 'the impedance $Z$', get: (c) => c.ac.Z, fmt: fmtR },
      { id: 'I', label: '$I_{\\text{rms}}$', get: (c) => c.ac.Irms, fmt: fmtI },
    ],
    mode: 'dir',
    expect: { Z: 'smaller', I: 'bigger' },
    why: 'Closer to resonance $X_L$ and $X_C$ nearly cancel, so $Z = \\sqrt{R^2 + (X_L - X_C)^2}$ falls toward $R$ and the current climbs.',
  },

  // ------------------------------------------------------------------ Exam 6
  {
    id: 'em-double-E0',
    lab: 'emwave',
    scenario: 'green',
    ask: 'Double the wave’s electric-field amplitude $E_0$, same wavelength.',
    apply(s) {
      s.E0 *= 2;
    },
    watch: [
      { id: 'B0', label: '$B_0$', get: (c) => c.em.B0, fmt: (v) => T(v, 'T') },
      { id: 'I', label: 'the intensity', get: (c) => c.em.Iavg, fmt: fmtIrr },
    ],
    mode: 'factor',
    expect: { B0: 2, I: 4 },
    why: '$B_0 = E_0/c$ keeps step with $E_0$, and intensity goes as the square: $I = \\tfrac12 c\\varepsilon_0 E_0^2$.',
  },
  {
    id: 'em-halve-lambda',
    lab: 'emwave',
    scenario: 'green',
    ask: 'Halve the wavelength.',
    apply(s) {
      s.lambda /= 2;
    },
    watch: [
      { id: 'f', label: 'the frequency', get: (c) => c.em.f, fmt: fmtHz },
      { id: 'c', label: 'the speed', get: (c) => c.em.c, fmt: (v) => T(v, 'm/s') },
    ],
    mode: 'factor',
    expect: { f: 2, c: 1 },
    why: 'In vacuum every EM wave moves at $c$; $c = f\\lambda$ then makes the frequency double.',
  },
  {
    id: 'polar-third',
    lab: 'polar',
    scenario: 'crossed',
    ask: 'Two crossed polarizers (0° and 90°) pass no light. Slip a third one at 45° between them.',
    prep(s) {
      s.n = 2;
      s.a = 0;
      s.b = 90;
    },
    apply(s) {
      s.n = 3;
      s.b = 45;
      s.c = 90;
    },
    watch: [{ id: 'I', label: 'the light getting through', get: (c) => c.pol.I, fmt: fmtIrr }],
    mode: 'dir',
    expect: { I: 'bigger' },
    why: 'Each polarizer passes the component along its own axis. The 45° sheet turns the light halfway, so the last sheet has something to pass: $I_0 \\cdot \\tfrac12 \\cdot \\cos^2 45^\\circ \\cdot \\cos^2 45^\\circ = I_0/8$.',
  },
  {
    id: 'polar-rotate-60',
    lab: 'polar',
    scenario: 'parallel',
    ask: 'Rotate the second polarizer from parallel to 60° from the first.',
    prep(s) {
      s.n = 2;
      s.a = 0;
      s.b = 0;
    },
    apply(s) {
      s.b = 60;
    },
    watch: [{ id: 'I', label: 'the light getting through', get: (c) => c.pol.I, fmt: fmtIrr }],
    mode: 'factor',
    expect: { I: 0.25 },
    why: 'Malus’s law, $I = I_1\\cos^2\\theta$, and $\\cos^2 60^\\circ = \\tfrac14$ — not a half, as “60 out of 90 degrees” suggests.',
  },

  // ------------------------------------------------------------------ Exam 7
  {
    id: 'refr-steeper',
    lab: 'refraction',
    scenario: 'air-glass',
    ask: 'Tilt the incoming ray from 45° to 60° from the normal.',
    prep(s) {
      s.theta = 45;
    },
    apply(s) {
      s.theta = 60;
    },
    watch: [
      { id: 't2', label: 'the refracted angle', get: (c) => c.ref.theta2, fmt: deg },
      { id: 'ratio', label: '$\\sin\\theta_1/\\sin\\theta_2$', get: (c) => Math.sin(c.ref.th1) / Math.sin(c.ref.theta2), fmt: (v) => plain(v) },
    ],
    mode: 'dir',
    expect: { t2: 'bigger', ratio: 'same' },
    why: 'The refracted ray tilts more too, but Snell’s law fixes the ratio of the sines at $n_2/n_1$.',
  },
  {
    id: 'refr-tir',
    lab: 'refraction',
    scenario: 'water-air',
    ask: 'Light goes from water into air. Tilt the ray from 40° to 55° from the normal.',
    prep(s) {
      s.theta = 40;
    },
    apply(s) {
      s.theta = 55;
    },
    watch: [{ id: 'out', label: 'Does any light get out into the air?', get: (c) => !c.ref.tir }],
    mode: 'bool',
    expect: { out: false },
    why: 'Past the critical angle, $\\sin\\theta_c = n_2/n_1 = 1/1.33$, so about 48.8°, Snell’s law has no solution: total internal reflection.',
  },
  {
    id: 'mirror-closer',
    lab: 'mirrors',
    scenario: 'concave-out',
    ask: 'Move the object from 36 cm to 18 cm in front of the concave mirror ($f$ = 12 cm).',
    prep(s) {
      s.do = 36;
    },
    apply(s) {
      s.do = 18;
    },
    watch: [
      { id: 'di', label: 'the image distance', get: (c) => c.mir.di, fmt: (v) => `${plain(v)} cm` },
      { id: 'h', label: 'the image size', get: (c) => c.mir.hi, fmt: (v) => `${plain(Math.abs(v))} cm` },
    ],
    mode: 'dir',
    expect: { di: 'bigger', h: 'bigger' },
    why: '$1/d_o + 1/d_i = 1/f$: as the object comes in toward F, the image runs out and grows ($m = -d_i/d_o$). Here it goes from half size to twice size.',
  },
  {
    id: 'mirror-inside-f',
    lab: 'mirrors',
    scenario: 'concave-out',
    ask: 'Move the object inside the focal point, 8 cm from the mirror.',
    prep(s) {
      s.do = 36;
    },
    apply(s) {
      s.do = 8;
    },
    watch: [{ id: 'real', label: 'Is the image real (can it land on a screen)?', get: (c) => !!c.mir.real }],
    mode: 'bool',
    expect: { real: false },
    why: 'Inside F the reflected rays spread apart; they only seem to come from a point behind the mirror, so the image is virtual (and upright, enlarged).',
  },
  {
    id: 'lens-shorter-f',
    lab: 'lenses',
    scenario: 'conv-far',
    ask: 'Swap in a stronger lens: focal length 12 cm → 6 cm. The object stays 36 cm away.',
    prep(s) {
      s.mode = 'single';
      s.fAbs = 12;
      s.do = 36;
    },
    apply(s) {
      s.fAbs = 6;
    },
    watch: [
      { id: 'di', label: 'the image distance', get: (c) => c.len.di, fmt: (v) => `${plain(v)} cm` },
      { id: 'h', label: 'the image size', get: (c) => c.len.hi, fmt: (v) => `${plain(Math.abs(v))} cm` },
    ],
    mode: 'dir',
    expect: { di: 'smaller', h: 'smaller' },
    why: 'A stronger lens bends rays more, so they meet sooner: $d_i$ drops from 18 cm to 7.2 cm, and $m = -d_i/d_o$ shrinks with it.',
  },
  {
    id: 'young-double-d',
    lab: 'interference',
    scenario: 'young',
    ask: 'Move the two slits twice as far apart.',
    apply(s) {
      s.d *= 2;
    },
    watch: [{ id: 'dy', label: 'the fringe spacing', get: (c) => c.interf.dy, fmt: (v) => `${plain(v * 1000)} mm` }],
    mode: 'factor',
    expect: { dy: 0.5 },
    why: 'Bright fringes sit where $d\\sin\\theta = m\\lambda$. Wider slits need a smaller angle for the same path difference: $\\Delta y = \\lambda L/d$ halves.',
  },
  {
    id: 'young-longer-L',
    lab: 'interference',
    scenario: 'young',
    ask: 'Move the screen twice as far from the slits.',
    apply(s) {
      s.L *= 2;
    },
    watch: [{ id: 'dy', label: 'the fringe spacing', get: (c) => c.interf.dy, fmt: (v) => `${plain(v * 1000)} mm` }],
    mode: 'factor',
    expect: { dy: 2 },
    why: 'The angles are set by $d$ and $\\lambda$; a screen twice as far away spreads the same angles over twice the width.',
  },
  {
    id: 'slit-narrower',
    lab: 'diffraction',
    scenario: 'single',
    ask: 'Make the single slit half as wide.',
    apply(s) {
      s.a /= 2;
    },
    watch: [{ id: 'w', label: 'the width of the central bright band', get: (c) => c.diff.width, fmt: (v) => `${plain(v * 100)} cm` }],
    mode: 'factor',
    expect: { w: 2 },
    why: 'The first dark fringe is at $a\\sin\\theta = \\lambda$: squeezing the slit spreads the light out. Narrower slit, wider pattern.',
  },
  {
    id: 'grating-more-lines',
    lab: 'diffraction',
    scenario: 'grating',
    ask: 'Use a grating with more lines per millimeter: 600 → 800.',
    prep(s) {
      s.linesPerMM = 600;
      s.m = 1;
    },
    apply(s) {
      s.linesPerMM = 800;
    },
    watch: [{ id: 'th', label: 'the angle of the first-order line', get: (c) => c.diff.thetaOrder, fmt: deg }],
    mode: 'dir',
    expect: { th: 'bigger' },
    why: 'More lines per mm means a smaller spacing $d$, and $d\\sin\\theta = m\\lambda$ then needs a bigger angle: the orders spread out.',
  },
  {
    id: 'film-double-t',
    lab: 'thinfilm',
    scenario: 'soap',
    ask: 'The soap film reflects 600 nm light brightly. Double its thickness.',
    apply(s) {
      s.t *= 2;
    },
    watch: [{ id: 'bright', label: 'Is the reflection still bright?', get: (c) => !!c.film.bright }],
    mode: 'bool',
    expect: { bright: false },
    why: 'The extra round trip adds $2nt$ of path. Doubling $t$ adds half a wavelength more, which turns constructive into destructive interference.',
  },
];

export const predictionsFor = (labId) => PREDICTIONS.filter((p) => p.lab === labId);
