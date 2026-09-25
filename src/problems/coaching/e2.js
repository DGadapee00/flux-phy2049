/** Exam 2 coaching (Ch 36–37) — see e1.js for the format. */
export default {
  'e2.36a.force-direction': {
    why: {
      dir: {
        0: String.raw`$\vec{F} = q\vec{E}$: a positive charge is pushed along the field, a negative one against it. Check the field's direction and the sign of $q$ again.`,
        90: 'The force is along the field line (or against it) — never sideways to it.',
        180: String.raw`$\vec{F} = q\vec{E}$: a positive charge is pushed along the field, a negative one against it. Check the field's direction and the sign of $q$ again.`,
        270: 'The force is along the field line (or against it) — never sideways to it.',
        [-1]: String.raw`Any charged object in a field feels $\vec{F} = q\vec{E}$. Only a neutral object feels no net force.`,
      },
    },
  },
  'e2.36a.proton-electron': {
    hints: [
      String.raw`The force is the same size for both: $|\vec{F}| = eE$. What is different?`,
      String.raw`$a = F/m$, and the electron is about 1836 times lighter than the proton.`,
    ],
    why: {
      which: {
        1: String.raw`Same force, $eE$, on both — and the proton is the heavy one, so it accelerates less.`,
        3: String.raw`The forces are equal, but $a = F/m$ and the masses differ by a factor of about 1836.`,
        4: String.raw`Both are charged, so both feel $eE$ and both accelerate.`,
      },
    },
  },
  'e2.36a.trajectory': {
    hints: [String.raw`An electron is negative, so the force $q\vec{E}$ points opposite to $\vec{E}$.`],
    why: {
      path: {
        1: String.raw`Which way is the force? $\vec{F} = q\vec{E}$ points along $\vec{E}$ for a positive charge and against it for a negative one.`,
        [-1]: String.raw`Which way is the force? $\vec{F} = q\vec{E}$ points along $\vec{E}$ for a positive charge and against it for a negative one.`,
        0: 'A straight line needs zero sideways force, but the field pushes the particle sideways the whole time.',
        2: 'A circle needs a force that turns with the velocity. This force is constant in size and direction, like gravity, so the path is a parabola.',
      },
    },
  },
  'e2.36a.plate-sign': {
    hints: [
      'Field lines start on positive charge and end on negative charge.',
      'The field points toward Plate 2, so the lines end there.',
    ],
    why: {
      sign: {
        1: 'Field lines point away from positive charge. A field pointing toward a plate means that plate is negative, and vice versa.',
        [-1]: 'Field lines point away from positive charge. A field pointing toward a plate means that plate is negative, and vice versa.',
        0: 'A neutral plate cannot be where field lines start or end.',
        2: 'The field direction does decide it: lines leave the positive plate and end on the negative one.',
      },
      uniform: {
        1: 'For large, close plates every point between them sees the same field, σ/ε₀, whatever its distance from either plate.',
        2: 'For large, close plates every point between them sees the same field, σ/ε₀, whatever its distance from either plate.',
      },
    },
  },
  'e2.36a.E-from-force': {
    hints: ['The field is the force per unit charge.', String.raw`$E = F/q$, with $q$ in coulombs (μC × 10⁻⁶).`],
  },
  'e2.36a.accel': {
    hints: [
      String.raw`Newton's second law with the electric force: $ma = qE$.`,
      String.raw`$a = eE/m_p$, with $e = 1.60\times10^{-19}$ C and $m_p = 1.67\times10^{-27}$ kg.`,
    ],
    why: {
      dir: {
        1: String.raw`$\vec{a}$ points along $q\vec{E}$: along $\vec{E}$ for a proton, opposite for an electron.`,
        [-1]: String.raw`$\vec{a}$ points along $q\vec{E}$: along $\vec{E}$ for a proton, opposite for an electron.`,
      },
    },
  },
  'e2.36a.E-from-accel': {
    hints: [String.raw`The only force is electric, so $ma = qE$.`, 'Solve for E, then convert: grams to kilograms, μC to C.'],
  },
  'e2.36a.tension': {
    hints: [
      String.raw`A negative charge feels a force opposite to $\vec{E}$. With $\vec{E}$ pointing down, which way is the electric force?`,
      String.raw`Balance the vertical forces: $T + F_{E,y} - mg = 0$.`,
    ],
  },
  'e2.36a.levitate-E': {
    hints: [String.raw`To hover, the electric force must equal the weight and point up: $|q|E = mg$.`, String.raw`A positive charge is pushed along $\vec{E}$, so $\vec{E}$ must point the way the force needs to go.`],
    why: {
      dir: {
        1: String.raw`The force must point up. For a negative charge that needs $\vec{E}$ pointing down.`,
        [-1]: String.raw`The force must point up. For a positive charge that needs $\vec{E}$ pointing up.`,
      },
    },
  },
  'e2.36a.levitate-q': {
    hints: [String.raw`Hovering means $|q|E = mg$; convert the mass to kilograms.`, String.raw`The electric force must point up. If $\vec{E}$ points down, which sign of $q$ makes $q\vec{E}$ point up?`],
    why: {
      sign: {
        1: String.raw`A positive charge is pushed along $\vec{E}$. With $\vec{E}$ down, that pushes the ball down too.`,
        [-1]: String.raw`A negative charge is pushed against $\vec{E}$. With $\vec{E}$ up, that pushes the ball down.`,
      },
    },
  },
  'e2.36a.point-field': {
    hints: [String.raw`A charged sphere acts like a point charge outside it: $E = kq/r^2$.`, 'Field lines point away from positive charge and toward negative charge.'],
    why: {
      dir: {
        1: 'The field points toward a negative charge.',
        [-1]: 'The field points away from a positive charge.',
      },
    },
  },
  'e2.36a.charge-from-field': {
    hints: [String.raw`Rearrange $E = k|q|/r^2$ for $|q|$, with $r$ in metres.`, 'Field lines point toward negative charge.'],
    why: {
      sign: {
        1: 'A field pointing toward the object means field lines end on it, so it is negative.',
        [-1]: 'A field pointing away from the object means field lines start on it, so it is positive.',
      },
    },
  },
  'e2.36a.between-two': {
    why: {
      dir: {
        1: 'Each field points away from a positive charge, toward a negative one. Decide the direction of each at P, then let the nearer (stronger) one win if they oppose.',
        [-1]: 'Each field points away from a positive charge, toward a negative one. Decide the direction of each at P, then let the nearer (stronger) one win if they oppose.',
        0: 'The fields cancel only at the exact midpoint of two equal like charges. P is nearer one of them.',
      },
    },
  },
  'e2.36a.collinear': {
    hints: ['Between a positive and a negative charge, both fields point the same way: away from the positive one, toward the negative one.'],
    why: {
      dir: {
        1: 'Work out each field direction at P (away from +, toward −) and add them as signed x components.',
        [-1]: 'Work out each field direction at P (away from +, toward −) and add them as signed x components.',
        0: 'Zero needs the two fields to cancel. Check whether they point the same way at P first.',
      },
    },
  },
  'e2.36a.zero-point': {
    why: { sign: { 1: 'Outside both charges, two like charges give fields in the same direction, which cannot cancel. q₂ must be opposite to q₁.' } },
  },
  'e2.36a.three-axes': {
    hints: [
      'Draw each field at the origin: away from the positive charges, toward the negative one.',
      'q₁ and q₃ are equal and the same distance away on opposite sides. What do their fields do together?',
      String.raw`What is left is q₂'s field alone: $E = kq_2/b^2$, pointing toward q₂.`,
    ],
  },
  'e2.36a.dipole': {
    why: {
      dir: {
        1: 'Below the midpoint, the + charge pushes the field away from itself and the − charge pulls it toward itself. Add the horizontal parts; they point from + toward −.',
        [-1]: 'Below the midpoint, the + charge pushes the field away from itself and the − charge pulls it toward itself. Add the horizontal parts; they point from + toward −.',
        2: 'P is the same distance from both charges, so the vertical parts of the two fields cancel.',
        [-2]: 'P is the same distance from both charges, so the vertical parts of the two fields cancel.',
      },
    },
  },
  'e2.36b.line-charge-total': {
    hints: ['λ is charge per metre.', String.raw`$Q = \lambda L$, with λ in C/m.`],
  },
  'e2.36b.line-length': {
    hints: ['λ is charge per metre, so length = total charge ÷ charge per metre.', String.raw`$L = Q/\lambda$ — convert λ from μC/m to C/m first.`],
  },
  'e2.36b.disk-radius': {
    hints: [String.raw`σ is charge per area: $Q = \sigma\,\pi R^2$.`, String.raw`Solve for $R$: $R = \sqrt{Q/(\pi\sigma)}$.`],
  },
  'e2.36b.volume-charge': {
    hints: ['ρ is charge per volume.', String.raw`$Q = \rho V$ with $V = \tfrac{4}{3}\pi R^3$, $R$ in metres.`],
  },
  'e2.36b.rod-bisector': {
    why: {
      Ex: {
        1: String.raw`Pair each slice at $+x$ with the one at $-x$: their $x$ components are equal and opposite, so $E_x$ cancels on the bisector.`,
        2: 'Every slice on one side has a mirror slice on the other side, so the x components cancel in pairs whatever their signs.',
      },
    },
  },
  'e2.36b.ring-axis': {
    why: {
      maxat: {
        1: 'At the centre every piece of the ring pulls equally in opposite directions, so E = 0 there.',
        3: String.raw`Set $dE/dy = 0$ for $E = kQy/(y^2 + a^2)^{3/2}$: the maximum is at $y = a/\sqrt{2}$, not at $y = a$.`,
        4: String.raw`Far away the field falls off like $kQ/y^2$, so it is small there.`,
      },
    },
  },
  'e2.36b.semicircle': {
    why: {
      Ex: { 1: String.raw`$2k\lambda/R$ is the size of $E_y$. For $E_x$, pieces at angle θ and π − θ have opposite $\cos\theta$ and cancel.` },
      dir: { 2: 'A positive charge pushes the field away from itself. The arc is above P, so the field at P points down, away from it.' },
    },
  },
  'e2.36b.disk-axis': {
    hints: [String.raw`A ring of radius $r$ and width $dr$ holds $dq = \sigma\,2\pi r\,dr$ and gives $dE = \dfrac{k\,dq\,s}{(s^2 + r^2)^{3/2}}$ on the axis.`],
  },
  'e2.36c.zero-flux': {
    hints: [
      String.raw`Gauss's law says $\Phi_E = q_{\text{enc}}/\varepsilon_0$. What does zero flux tell you about what is inside?`,
      'Think of a charge outside the surface: its field lines go in one side and out the other.',
    ],
    why: { tf: { 1: 'Zero flux only means zero enclosed charge. A charge outside sends field lines in and out of the surface, so the field on it is not zero.' } },
  },
  'e2.36c.surfaces': {
    hints: [
      String.raw`Gauss's law: $\Phi_E = q_{\text{enc}}/\varepsilon_0$. Shape and size do not matter.`,
      'For each surface add only the charges inside it, with their signs; charges outside count for nothing.',
    ],
  },
  'e2.36c.cavity': {
    hints: [
      String.raw`In equilibrium $\vec{E} = 0$ inside the metal. Draw a Gaussian surface in the metal around the cavity: what must it enclose?`,
      'Then use charge conservation: the conductor is neutral overall.',
    ],
    why: {
      stmts: {
        1: 'The inner surface is −q, but the conductor is neutral overall, so the outer surface must carry +q to balance it.',
        2: String.raw`A Gaussian surface in the metal must enclose zero charge, so the inner surface alone carries $-q$.`,
        3: 'In equilibrium the field inside the metal is zero.',
        5: 'Neutral overall does not mean nothing on each surface: −q gathers on the inner surface, which leaves +q on the outer one.',
      },
    },
  },
  'e2.36c.concentric': {
    why: {
      Eb_dir: {
        1: 'At r between the sphere and the shell, only the inner sphere is enclosed. Its sign decides the direction.',
        [-1]: 'At r between the sphere and the shell, only the inner sphere is enclosed. Its sign decides the direction.',
        0: 'The inner sphere is enclosed at this radius, so the field is not zero.',
      },
      Emetal: {
        1: 'This radius is inside the shell’s metal, and in equilibrium the field in a conductor is zero.',
        2: 'This radius is inside the shell’s metal, and in equilibrium the field in a conductor is zero.',
      },
      Ed_dir: {
        1: 'Outside everything, the field is set by the total charge (sphere plus shell). Its sign decides the direction.',
        [-1]: 'Outside everything, the field is set by the total charge (sphere plus shell). Its sign decides the direction.',
        0: 'Outside, the enclosed charge is the sphere plus the shell. That total is not zero here.',
      },
    },
  },
  'e2.36c.long-wire': {
    hints: [
      String.raw`Far from the ends, treat it as an infinite line with $\lambda = Q/L$.`,
      String.raw`A cylinder of radius $r$ and length $\ell$ around the wire: $E(2\pi r\ell) = \lambda\ell/\varepsilon_0$, so $E = \dfrac{\lambda}{2\pi\varepsilon_0 r} = \dfrac{2k\lambda}{r}$.`,
    ],
  },
  'e2.36c.sheet': {
    why: {
      dep: {
        1: String.raw`$1/r$ is a line charge. A large flat sheet gives a field that does not change with distance.`,
        2: String.raw`$1/r^2$ is a point charge. A large flat sheet gives a field that does not change with distance.`,
      },
    },
  },
  'e2.37.where-charge-goes': {
    hints: ['In a conductor the charges are free to move, and like charges repel.', 'They spread until the field inside the metal is zero. Where does that leave them?'],
    why: {
      ans: {
        1: 'In a conductor the charges are free to move. Like charges repel and spread out.',
        2: 'Any charge inside the metal would make a field there. In equilibrium it all moves to the surface.',
        4: 'Positive or negative, like charges repel, so excess charge of either sign ends on the surface.',
      },
    },
  },
  'e2.37.field-inside': {
    hints: ['Any field inside the metal would push the free charges along.', 'In equilibrium nothing is moving. What must the field inside be?'],
    why: {
      ans: {
        1: 'A field inside would move the free charges. In equilibrium they have rearranged until it is zero.',
        2: 'A field inside would move the free charges. In equilibrium they have rearranged until it is zero.',
        3: 'A field inside would move the free charges. In equilibrium they have rearranged until it is zero.',
        5: 'Not merely smaller: in equilibrium the field inside the metal is exactly zero.',
      },
    },
  },
  'e2.37.empty-cavity': {
    hints: ['Where does excess charge on a conductor end up?', 'A Gaussian surface inside the cavity encloses no charge, and nothing inside can hold a field up.'],
    why: {
      ans: {
        1: 'The net charge sits on the outer surface and produces no field inside an empty cavity.',
        2: 'With no charge in the cavity, the field there is zero.',
        3: 'With no charge in the cavity, the field there is zero.',
      },
    },
  },
  'e2.37.surface-field': {
    hints: ['Suppose the field had a part along the surface. What would it do to the free charges there?'],
    why: {
      ans: {
        2: 'A field along the surface would push charges across it. In equilibrium the field meets the surface at right angles.',
        3: 'A field along the surface would push charges across it. In equilibrium the field meets the surface at right angles.',
        4: 'Any sideways part would move charge, so in equilibrium the field is perpendicular to the surface.',
      },
    },
  },
  'e2.37.cube-induced': {
    hints: ['Free electrons move opposite to the field.', 'The electrons pile up on one face and leave the opposite face short of electrons. Which face is which?'],
    why: {
      ans: {
        1: 'Electrons move against the field and gather on the face the field points away from, making it negative.',
        [-1]: 'Electrons move against the field, so they leave the face the field points toward, which becomes positive.',
        0: 'The cube is neutral overall, but its charge separates: one face positive, the opposite face negative.',
        2: 'The field direction settles it: electrons move against the field.',
      },
    },
  },
  'e2.37.nested': {
    hints: [
      String.raw`$\vec{E} = 0$ in the metal, so a Gaussian surface drawn in the shell encloses zero net charge. That fixes the inner surface.`,
      'The inner and outer surfaces together must add up to the shell’s own net charge.',
    ],
  },
  'e2.37.lightning-cloud': {
    hints: ['A strike is a discharge between regions at very different potentials.'],
    why: {
      ans: {
        1: 'Positive strikes happen, but most cloud-to-ground strikes carry negative charge — either sign is possible.',
        2: 'Most cloud-to-ground strikes do carry negative charge, but positive strikes happen too, so either sign is possible.',
        4: 'A strike needs a large potential difference, so the cloud region involved does carry net charge.',
      },
    },
  },
  'e2.37.lightning-car': {
    hints: ['A metal car body is a closed conductor. Where does charge on a conductor sit, and what is the field inside?'],
    why: {
      ans: {
        2: 'The charge stays on the outer metal skin, which shields the inside: the field inside is ideally zero.',
        3: 'A closed conductor shields its inside completely in electrostatics. Ideally the field inside is zero.',
        4: 'The charge stays on the outer metal skin, which shields the inside: the field inside is ideally zero.',
      },
    },
  },
};
