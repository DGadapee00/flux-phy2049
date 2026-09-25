/**
 * Exam 1 coaching: hint ladders (idea → set-up → first step) and, for each wrong option of a
 * multiple-choice part, the misconception behind picking it. Folded into the bank by
 * src/problems/index.js; scripts/problems-check.mjs confirms every id, part and option exists.
 *
 * `hints` continue after a template's own hints. `why[partId][optionValue]` is shown when a student
 * picks that option and it is wrong for this version.
 */
export default {
  'e1.v.components': {
    hints: [
      'Drop the vector onto each axis. With θ measured from +x, the x component is the side next to the angle and the y component is the side across from it.',
      String.raw`$a_x = A\cos\theta$ and $a_y = A\sin\theta$. Measured counterclockwise from $+x$, the signs come out right on their own.`,
    ],
  },
  'e1.v.dot': {
    hints: [
      String.raw`Find $|\vec{a}|$ and $|\vec{b}|$ with Pythagoras first; then $\cos\varphi = \dfrac{\vec{a}\cdot\vec{b}}{|\vec{a}||\vec{b}|}$.`,
      String.raw`A dot product of zero means the vectors are perpendicular: $\varphi = 90^\circ$ with no calculator.`,
    ],
  },
  'e1.v.add': {
    hints: [
      String.raw`Components of each: $A_x = A\cos\theta_A$, $A_y = A\sin\theta_A$, and the same for $\vec{B}$. Then $R_x = A_x + B_x$, $R_y = A_y + B_y$.`,
      String.raw`$|\vec{R}| = \sqrt{R_x^2 + R_y^2}$ and $\theta_R = \tan^{-1}(R_y/R_x)$ — then check the quadrant from the signs of $R_x$ and $R_y$.`,
    ],
  },
  'e1.v.cross': {
    why: {
      dir: {
        1: String.raw`$+\hat{z}$ needs $a_xb_y - a_yb_x > 0$. Recompute that z component and read its sign.`,
        [-1]: String.raw`$-\hat{z}$ needs $a_xb_y - a_yb_x < 0$. Recompute that z component and read its sign.`,
      },
    },
  },
  'e1.v.dot-sign': {
    hints: [
      String.raw`$\vec{a}\cdot\vec{b} = |\vec{a}||\vec{b}|\cos\varphi$. Magnitudes are never negative, so the sign is the sign of $\cos\varphi$.`,
      String.raw`$\cos\varphi$ is positive below $90^\circ$, zero at $90^\circ$ and negative above it.`,
    ],
    why: {
      sign: {
        1: String.raw`Past $90^\circ$ the vectors point more against each other than along each other, and $\cos\varphi < 0$.`,
        [-1]: String.raw`Below $90^\circ$ the vectors share some direction, so $\cos\varphi > 0$ and the dot product is positive.`,
        0: String.raw`The dot product is zero only at exactly $90^\circ$.`,
      },
    },
  },
  'e1.34.electron-count': {
    hints: [
      String.raw`Charge comes in whole electrons: $N = |q|/e$, with $e = 1.60\times10^{-19}$ C. Convert μC to C first.`,
      'Each electron is negative. Adding electrons makes an object negative; removing them leaves it positive.',
    ],
    why: {
      which: {
        1: 'Removing electrons leaves an object positive, but this object is negative.',
        [-1]: 'Adding electrons makes an object negative, but this object is positive — it lost electrons.',
      },
    },
  },
  'e1.34.touching-spheres': {
    hints: [
      'Do it in the order it happens. After spheres 1 and 2 touch, each holds half their total; sphere 2 then carries that into its contact with sphere 3.',
    ],
  },
  'e1.34.induction': {
    hints: [
      'While the rod is near, it pulls charge of the opposite sign toward the sphere and pushes like charge away.',
      'Grounding lets charge flow between the sphere and Earth while the rod is still there. Which sign does the rod hold on the sphere?',
      'The ground is removed before the rod, so the sphere keeps whatever the rod drew onto it.',
    ],
    why: {
      sign: {
        1: 'Charging by induction leaves the sphere with the sign opposite to the rod: grounding lets the rod pull opposite charge on, or push like charge off.',
        [-1]: 'Charging by induction leaves the sphere with the sign opposite to the rod: grounding lets the rod pull opposite charge on, or push like charge off.',
        0: 'It would end neutral only if the ground stayed connected until the rod was gone. Here the ground goes first, which traps the induced charge.',
      },
    },
  },
  'e1.34.polarization': {
    hints: [
      'Neutral does not mean nothing happens. The charges in each bit of paper can shift a little.',
      'The comb pulls opposite charge to the near side of each bit and pushes like charge to the far side. Which side is closer to the comb?',
    ],
    why: {
      ans: {
        2: 'The near side of the paper carries charge opposite to the comb, and it is closer, so the attraction beats the repulsion.',
        3: 'A neutral object still polarizes. Its opposite charge sits nearer the comb, and force grows as the distance shrinks.',
        4: 'No net charge is needed: polarization alone gives an attraction, for either sign of comb.',
      },
    },
  },
  'e1.35.coulomb-pair': {
    hints: [
      String.raw`$|\vec{F}| = \dfrac{k|q_1q_2|}{r^2}$ with $k = 8.99\times10^9\ \text{N·m}^2/\text{C}^2$. Use magnitudes; the signs only decide the direction.`,
      'Convert first: μC to C (× 10⁻⁶) and cm to m (× 10⁻²).',
    ],
    why: {
      type: {
        1: 'Repulsion needs like signs. These two charges have opposite signs.',
        [-1]: 'Attraction needs opposite signs. These two charges have the same sign.',
      },
    },
  },
  'e1.35.distance': {
    hints: [
      String.raw`Start from $F = \dfrac{kq_1q_2}{r^2}$ and solve for $r$ before putting numbers in.`,
      String.raw`$r = \sqrt{kq_1q_2/F}$. With the charges in coulombs and $F$ in newtons, $r$ comes out in metres.`,
    ],
  },
  'e1.35.three-inline': {
    hints: [
      'Opposite signs attract (the force on q₂ points toward the other charge); like signs repel (it points away).',
      'Watch the distances: q₃ is placed relative to q₂, not relative to the origin.',
    ],
    why: {
      dir: {
        1: 'Give each force its sign along x — toward the other charge if the signs are opposite, away if alike — then add. The bigger one wins.',
        [-1]: 'Give each force its sign along x — toward the other charge if the signs are opposite, away if alike — then add. The bigger one wins.',
      },
    },
  },
  'e1.35.equilibrium-point': {
    hints: [
      'Between two positive charges, the forces on a third charge point in opposite directions, so they can cancel. The balance point sits nearer the smaller charge.',
    ],
  },
  'e1.35.right-triangle': {
    hints: [
      'Each 3 μC charge repels the +2 μC charge, pushing it straight away from itself.',
      String.raw`The charge at $(-30\ \text{cm}, 0)$ pushes along $+x$; the one at $(0, -30\ \text{cm})$ pushes along $+y$. Size each with $kq_1q_2/r^2$.`,
      String.raw`Add as components: $|\vec{F}| = \sqrt{F_x^2 + F_y^2}$, direction $\tan^{-1}(F_y/F_x)$ from $+x$.`,
    ],
  },
  'e1.35.hydrogen': {
    hints: [
      String.raw`Both forces fall off as $1/r^2$: $F_E = \dfrac{ke^2}{r^2}$ and $F_G = \dfrac{Gm_em_p}{r^2}$.`,
      String.raw`In the ratio the $r^2$ cancels: $\dfrac{F_E}{F_G} = \dfrac{ke^2}{Gm_em_p}$, with $m_e = 9.11\times10^{-31}$ kg and $m_p = 1.67\times10^{-27}$ kg.`,
    ],
  },
  'e1.35.scaling': {
    hints: [
      String.raw`Write $F \propto \dfrac{q_1q_2}{r^2}$ and change one thing at a time.`,
      'Doubling one charge doubles F. Doubling the distance divides F by 2² = 4.',
    ],
  },
};
