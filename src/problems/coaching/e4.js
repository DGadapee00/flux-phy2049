/** Exam 4 coaching (Ch 43–47) — see e1.js for the format. */
const RHR_F = String.raw`Use $\vec{F} = q\vec{v}\times\vec{B}$: $\hat{x}\times\hat{y} = \hat{z}$, $\hat{y}\times\hat{z} = \hat{x}$, $\hat{z}\times\hat{x} = \hat{y}$, reversed for the opposite order — and flipped again for a negative charge.`;
const RHR_B = String.raw`Thumb along the current, fingers curl the way $\vec{B}$ goes: $d\vec{B} \propto I\,d\vec{l}\times\hat{r}$, with $\hat{r}$ from the wire to the point.`;

export default {
  'e4.43.series': {
    hints: [
      String.raw`In series, resistances add: $R_{\text{eq}} = R_1 + R_2 + R_3$, and one current flows through all of them.`,
      String.raw`$I = \varepsilon/R_{\text{eq}}$; then $V_2 = IR_2$ and $P = \varepsilon I$.`,
    ],
  },
  'e4.43.parallel': {
    hints: [
      String.raw`In parallel, every branch has the full battery voltage, and $\dfrac{1}{R_{\text{eq}}} = \dfrac{1}{R_1} + \dfrac{1}{R_2} + \dfrac{1}{R_3}$.`,
      String.raw`Total current $I = \varepsilon/R_{\text{eq}}$; the current in one branch is $\varepsilon/R$ for that branch.`,
    ],
  },
  'e4.43.combo': {
    hints: [
      String.raw`Reduce the parallel pair first: $R_{23} = \dfrac{R_2R_3}{R_2 + R_3}$. Then it is in series with $R_1$.`,
      String.raw`$I_1 = \varepsilon/R_{\text{eq}}$ flows through $R_1$ and splits at the pair. The pair has $V = I_1R_{23}$ across it, so $I_3 = V/R_3$.`,
    ],
  },
  'e4.43.add-resistor': {
    hints: [
      'In series a new resistor adds to the path; in parallel it adds another path.',
      String.raw`Find what happens to $R_{\text{eq}}$ first; the battery current $I = \varepsilon/R_{\text{eq}}$ moves the opposite way.`,
    ],
    why: {
      ans: {
        1: 'A resistor added in series makes the one path longer: the resistance rises and the current falls.',
        [-1]: 'A resistor added in parallel is an extra path: the total resistance falls and the battery current rises.',
        0: 'Any added resistor changes the equivalent resistance, in series or in parallel.',
      },
    },
  },
  'e4.44.terminal': {
    hints: [
      String.raw`The internal resistance is in series with the load: $I = \dfrac{\varepsilon}{R + r}$.`,
      String.raw`Terminal voltage $V = \varepsilon - Ir$ (the same as $IR$), and the power lost inside is $I^2r$.`,
    ],
  },
  'e4.44.rc-charge': {
    hints: [String.raw`Put $t$ and $\tau = RC$ in: after one time constant the capacitor holds $1 - e^{-1} \approx 63\%$ of its final charge.`],
  },
  'e4.44.rc-discharge': {
    hints: [
      String.raw`Discharging: $q = q_0\,e^{-t/RC}$.`,
      String.raw`Set $q/q_0$ to the fraction and take logs: $t = -RC\ln(q/q_0)$.`,
    ],
  },
  'e4.44.rules': {
    hints: ['Junction rule: what flows into a point flows out. Loop rule: the potential changes around a closed path add to zero.'],
    why: {
      ans: {
        1: 'Charge is what the junction rule conserves: current in equals current out. The loop rule is about energy per unit charge.',
        2: 'Energy is what the loop rule conserves. The junction rule says charge does not pile up at a point.',
        3: 'Neither Kirchhoff rule involves momentum.',
        4: 'Current density is not a conserved quantity; the junction rule is about charge.',
      },
    },
  },
  'e4.45.magnets': {
    hints: ['Magnetic poles always come in pairs, and field lines form closed loops: out of N, into S outside the magnet.'],
    why: {
      ans: {
        7: 'There are no isolated magnetic poles: each piece is a complete magnet with an N and an S.',
        8: 'The magnetism comes from the aligned material all through the bar, so each half is still a magnet.',
        10: 'Opposite poles attract, so the compass N end points toward a magnetic south pole.',
        11: 'A compass lines up along the field, not across it.',
        5: 'Outside the magnet the lines leave the N pole and enter the S pole.',
        6: 'Field lines always close on themselves: outside they run N to S, inside S to N.',
        9: 'A compass N end is drawn to it, and opposite poles attract — so it is a magnetic south pole.',
      },
    },
  },
  'e4.46.force-mag': {
    hints: [String.raw`$F = |q|vB\sin\theta$, with θ between $\vec{v}$ and $\vec{B}$.`, 'At 90°, sin θ = 1. A proton carries e = 1.60 × 10⁻¹⁹ C.'],
  },
  'e4.46.rhr': {
    why: {
      dir: {
        1: RHR_F,
        [-1]: String.raw`$\vec{F}$ is perpendicular to both $\vec{v}$ and $\vec{B}$, so it cannot point along either of them.`,
        2: String.raw`$\vec{F}$ is perpendicular to both $\vec{v}$ and $\vec{B}$, so it cannot point along either of them.`,
        [-2]: String.raw`$\vec{F}$ is perpendicular to both $\vec{v}$ and $\vec{B}$, so it cannot point along either of them.`,
        3: RHR_F,
        [-3]: RHR_F,
        0: String.raw`The force is zero only when $\vec{v}$ is parallel to $\vec{B}$. Here they are at right angles.`,
      },
    },
  },
  'e4.46.circle': {
    hints: [
      String.raw`The magnetic force supplies the centripetal force: $|q|vB = \dfrac{mv^2}{r}$.`,
      String.raw`$r = \dfrac{mv}{|q|B}$, and the period is $T = \dfrac{2\pi r}{v}$.`,
    ],
    why: {
      dep: {
        2: String.raw`A faster particle does move on a bigger circle, but $r \propto v$, so $T = 2\pi r/v = 2\pi m/(|q|B)$ is unchanged.`,
        3: String.raw`A faster particle covers more ground, but on a proportionally bigger circle: $T = 2\pi m/(|q|B)$ has no $v$ in it.`,
      },
    },
  },
  'e4.46.selector': {
    hints: [
      'Straight through means the electric and magnetic forces cancel.',
      String.raw`$qE = qvB$, so $v = E/B$ — notice what cancels.`,
    ],
    why: {
      dep: {
        1: String.raw`$q$ appears on both sides of $qE = qvB$ and cancels, so any charge with $v = E/B$ goes straight.`,
        2: 'The mass never enters the force balance, so it does not matter.',
      },
    },
  },
  'e4.46.wire-force': {
    hints: [String.raw`$F = ILB\sin\theta$, with θ between the wire and $\vec{B}$.`],
  },
  'e4.46.spectrometer': {
    hints: [
      String.raw`First the speed from energy: $\tfrac12 mv^2 = |q|\,\Delta V$.`,
      String.raw`Then the circle: $r = \dfrac{mv}{|q|B}$.`,
    ],
  },
  'e4.46.torque': {
    hints: [
      String.raw`Magnetic moment of a coil: $\mu = NIA$, with $A$ in m² (a 10 cm square is 0.01 m²).`,
      String.raw`Torque $\tau = \mu B\sin\theta$, with θ between the coil's normal and $\vec{B}$.`,
    ],
  },
  'e4.47.long-wire': {
    hints: [String.raw`$B = \dfrac{\mu_0 I}{2\pi\rho}$ around a long straight wire, with $\mu_0 = 4\pi\times10^{-7}$ T·m/A and ρ in metres.`],
  },
  'e4.47.rhr-wire': {
    why: {
      dir: {
        1: RHR_B,
        [-1]: RHR_B,
        2: String.raw`$\vec{B}$ circles the wire, so it is never along the current.`,
        [-2]: String.raw`$\vec{B}$ circles the wire, so it is never along the current.`,
        3: RHR_B,
        [-3]: RHR_B,
        0: 'A current always makes a field around it; it is zero only infinitely far away.',
      },
    },
  },
  'e4.47.loop': {
    hints: [String.raw`On the axis every piece of the loop is the same distance $\sqrt{R^2 + y^2}$ away, and the sideways parts cancel.`],
  },
  'e4.47.solenoid': {
    hints: [String.raw`$n = N/L$ is turns per metre.`, String.raw`Inside a long solenoid $B = \mu_0 nI$, the same everywhere inside.`],
  },
  'e4.47.parallel-wires': {
    hints: [
      String.raw`Each wire sits in the other's field $B = \mu_0 I/(2\pi d)$, so the force per metre is $\dfrac{F}{L} = \dfrac{\mu_0 I_1 I_2}{2\pi d}$.`,
      'The direction: parallel currents attract; antiparallel currents repel.',
    ],
    why: {
      type: {
        1: 'Antiparallel currents repel — the opposite of charges.',
        [-1]: 'Parallel currents attract — the opposite of like charges.',
      },
    },
  },
  'e4.47.two-wires-B': {
    hints: [String.raw`Find each wire's $B = \mu_0 I/(2\pi r)$ at the point, then decide with the right-hand rule whether they add or cancel.`],
  },
};
