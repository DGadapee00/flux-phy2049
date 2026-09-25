/** Exam 3 coaching (Ch 38–42) — see e1.js for the format. */
export default {
  // ------------------------------------------------------------------ Ch 38
  'e3.38.point-V': {
    hints: [String.raw`$V = \dfrac{kq}{r}$ with $V = 0$ at infinity. Charge in coulombs, $r$ in metres.`],
  },
  'e3.38.work-radial': {
    hints: [String.raw`Find $V = kQ/r$ at the start and at the end, then $W = -q(V_{\text{end}} - V_{\text{start}})$.`],
    why: {
      ke: {
        1: 'With only the field acting, its work all goes into kinetic energy. Negative work by the field means K goes down.',
        [-1]: 'With only the field acting, its work all goes into kinetic energy. Positive work by the field means K goes up.',
      },
    },
  },
  'e3.38.uniform-dV': {
    why: {
      pe: {
        gain: String.raw`$\Delta U = q\,\Delta V$. Get the sign of $\Delta V$ from the motion ($V$ falls along $\vec{E}$), then multiply by the sign of $q$.`,
        lose: String.raw`$\Delta U = q\,\Delta V$. Get the sign of $\Delta V$ from the motion ($V$ falls along $\vec{E}$), then multiply by the sign of $q$.`,
      },
    },
  },
  'e3.38.accelerate': {
    hints: [
      String.raw`The field does work $|q|\,\Delta V$ on the electron, and all of it becomes kinetic energy: $K = |q|\,\Delta V$.`,
      'In electron-volts it is immediate: a charge e through ΔV volts gains ΔV eV.',
      String.raw`For the speed, $K = \tfrac12 mv^2$ with $m_e = 9.11\times10^{-31}$ kg, so $v = \sqrt{2K/m}$.`,
    ],
  },
  'e3.38.pair-energy': {
    hints: [
      String.raw`The potential energy of a pair is $U = \dfrac{kq_1q_2}{r}$, signs included (like signs give $U > 0$).`,
      String.raw`Brought in slowly from far away, where $U = 0$, the agent's work all goes into $U$: $W_{\text{ext}} = \Delta U$.`,
    ],
  },
  'e3.38.equipotentials': {
    hints: [
      String.raw`Along an equipotential $\Delta V = 0$. What does that make the work $W = -q\,\Delta V$?`,
      String.raw`$E_x = -dV/dx$: the field points the way $V$ drops fastest, which is straight across the equipotentials.`,
    ],
    why: {
      ans: {
        4: String.raw`$V$ drops along $\vec{E}$: $E_x = -dV/dx$ points toward lower potential.`,
        5: 'A point has only one potential, so it cannot sit on two different equipotentials — they never cross.',
        6: 'Closer equipotentials mean V changes faster with distance, so the field is stronger there, not weaker.',
      },
    },
  },
  'e3.38.E-from-V': {
    hints: [String.raw`Differentiate term by term: $\dfrac{d}{dx}(ax^2 + bx + 5) = 2ax + b$. Then put $x = x_0$ in and change the sign.`],
  },
  'e3.38.units-of': {
    why: {
      ans: {
        J: 'The joule is the unit of energy: potential energy and work.',
        'J/C': 'J/C — the volt — is the unit of electric potential, energy per unit charge.',
        'N/C': 'N/C (the same as V/m) is the unit of electric field.',
        'J/kg': 'J/kg is energy per kilogram — gravitational potential, not electric.',
        current: 'Current is charge per second. Potential is energy per charge.',
        field: 'Field is force per unit charge; potential is energy per unit charge.',
        mass: 'Energy per mass is gravitational potential. Electric potential is energy per coulomb of charge.',
      },
    },
  },
  'e3.38.work-and-deltaV': {
    hints: [String.raw`Assume it ends at rest as it started, so the agent's work all becomes potential energy: $\Delta U = W_{\text{ext}}$, then $\Delta V = \Delta U/q$.`],
  },
  'e3.38.field-potential-traps': {
    hints: ['Think of V as a height and E as the steepness. A flat stretch can be at any height.'],
    why: {
      ans: {
        T: String.raw`$\vec{E}$ is the slope of $V$, not its value. Midway between two equal positive charges $E = 0$ but $V$ is positive.`,
        F: String.raw`If $V$ is the same everywhere in the region, its slope is zero, so $E_x = -dV/dx = 0$ throughout.`,
        zero: String.raw`$V = 0$ at a point says nothing about the slope there. Midway between $+q$ and $-q$, $V = 0$ while $E$ is large.`,
        nonzero: 'V = 0 does not force a field either: it can be zero there (far from all charges) or not (between +q and −q).',
      },
    },
  },
  'e3.38.charge-moves': {
    why: {
      ans: {
        'both-up': ($) =>
          $.what === 'proton-perp'
            ? 'Moving across the field lines keeps it on one equipotential, so nothing changes.'
            : String.raw`Along $\vec{E}$ the potential falls, and for a positive charge $U = qV$ falls with it.`,
        'both-down': 'Moving perpendicular to the field keeps it on one equipotential, so V and U stay the same.',
        'both-same': String.raw`Along $\vec{E}$ the potential drops, so both $V$ and $U = qV$ change.`,
        split: ($) =>
          $.what === 'proton-perp'
            ? 'Moving across the field lines keeps it on one equipotential, so nothing changes.'
            : String.raw`For a positive charge $U = qV$ moves the same way as $V$. They can only move in opposite directions for a negative charge.`,
        'high-to-low': String.raw`That is what a positive charge does. A negative charge is pushed against $\vec{E}$, toward higher potential.`,
        equip: 'A free charge is pushed along or against the field, and that carries it across the equipotentials.',
      },
    },
  },
  'e3.38.V-poly-field': {
    hints: ['Differentiate V(x) first, then put the value of x in.'],
  },
  'e3.38.pe-rank': {
    why: {
      ans: {
        p1: String.raw`For a negative charge $U = qV$ is largest where $V$ is lowest — near $-Q$, not $+Q$.`,
        p2: String.raw`At the midpoint $V = 0$, so $U = 0$. There is a spot where $U$ is positive.`,
        p3: String.raw`For a positive charge $U = qV$ is largest where $V$ is highest — near $+Q$.`,
        p4: String.raw`Far away $V \to 0$, so $U \to 0$. Near one of the charges $U$ is positive.`,
        downDown: String.raw`Along $\vec{E}$ the potential does fall, but an electron's $U = qV$ has the opposite sign, so it rises.`,
        upUp: String.raw`Moving along $\vec{E}$, the potential falls.`,
        downUp: String.raw`Along $\vec{E}$ the potential falls, not rises; the electron's energy is what goes up.`,
        Udown: 'Pulling opposite charges apart takes work against their attraction, so U rises (from negative toward zero).',
        Usame: String.raw`$U = kq_1q_2/r$ changes with $r$. For opposite charges it climbs toward zero as they separate.`,
      },
    },
  },
  'e3.38.moving-charge-energy': {
    why: {
      ans: {
        Vdown: String.raw`It is moving against $\vec{E}$, and $V$ rises in that direction whatever the sign of the charge.`,
        Vup: String.raw`It is moving along $\vec{E}$, and $V$ falls in that direction whatever the sign of the charge.`,
        Uup: String.raw`$U = qV$: find which way $V$ goes, then multiply by the sign of $q$.`,
        Udown: String.raw`$U = qV$: find which way $V$ goes, then multiply by the sign of $q$.`,
        Kup: String.raw`$K + U$ stays fixed when only the electric force acts, so $K$ moves opposite to $U$.`,
        Kdown: String.raw`$K + U$ stays fixed when only the electric force acts, so $K$ moves opposite to $U$.`,
      },
    },
  },
  'e3.38.uniform-rank': {
    why: {
      ans: {
        same: 'A uniform field means V falls at a steady rate along it — not that V is the same everywhere.',
        Chigh: String.raw`$V$ falls along $\vec{E}$. C is further along the field, so it is lower.`,
        AgtB: 'A and B differ only across the field, so they share an equipotential: equal V.',
        CmostU: String.raw`For a positive charge $U = qV$ follows $V$, and $V$ is lowest at C, further along the field.`,
        sameU: String.raw`$V$ changes along the field, so $U = qV$ does too.`,
        AmostU: 'A and B sit on one equipotential, so a charge has the same U at both.',
      },
    },
  },
  // ------------------------------------------------------------------ Ch 39
  'e3.39.two-charges-V': {
    hints: [String.raw`$V = kq_1/r_1 + kq_2/r_2$ with each charge's own sign, each $r$ measured from the origin.`],
  },
  'e3.39.zero-V-point': {
    hints: [
      String.raw`$V$ is a scalar: at the point, the two potentials must cancel, $\dfrac{kq_1}{x} = \dfrac{k|q_2|}{d - x}$.`,
      'Solve for x. The point lands nearer the smaller charge.',
    ],
    why: {
      E0: { 1: 'V = 0 is not E = 0. Between opposite charges both fields point toward the negative one and add.' },
    },
  },
  'e3.39.sphere-V': {
    why: {
      inside: {
        2: 'Zero is the field inside, not the potential. With E = 0, V stays at its surface value kQ/R.',
        3: 'kQ/r holds only outside. Inside E = 0, so V stops changing and stays at kQ/R.',
      },
    },
  },
  'e3.39.compare-configs': {
    why: {
      sign: {
        1: String.raw`Add $k(2q)/r_1$ and $k(-q)/r_2$ with this arrangement's distances. Equal-size terms cancel.`,
        0: String.raw`Add $k(2q)/r_1$ and $k(-q)/r_2$ with this arrangement's distances. The terms are not equal here.`,
        [-1]: String.raw`Add $k(2q)/r_1$ and $k(-q)/r_2$ with this arrangement's distances. The $2q$ term is never the smaller one here.`,
      },
      same: {
        ab: '(a) and (b) swap which charge is nearer, so the totals differ.',
        bc: '(b) has the 2q charge at r₀; (c) has both at 2r₀. The distances differ, so the potentials do.',
        cd: '(c) has both at 2r₀; (d) has the −q charge at r₀. The distances differ, so the potentials do.',
      },
    },
  },
  'e3.39.deltaV-two-radii': {
    hints: ['Nearer means higher V for a positive charge, so this ΔV should come out positive.'],
  },
  'e3.39.equipotential-props': {
    why: {
      ans: {
        dielectric: 'A dielectric is an insulating material, not a surface of constant potential.',
        gauss: 'A Gaussian surface is any closed surface chosen for Gauss’s law; V need not be constant on it.',
        parallel: 'If E ran along the surface, moving along it would change V. So E crosses it at right angles.',
        flat: 'Around a point charge the equipotentials are spheres; they are flat only in a uniform field.',
        smaller: 'Closer surfaces mean the same step in V over a shorter distance — a steeper slope and a stronger field.',
        fieldWork: String.raw`On an equipotential $\Delta V = 0$, so $W = -q\,\Delta V = 0$ whatever the sign of $q$.`,
        needed: String.raw`On an equipotential $\Delta V = 0$, so no work is needed whatever the sign of $q$.`,
        distance: 'Only the potential difference matters, and it is zero along an equipotential, however far you go.',
      },
    },
  },
  'e3.39.speed-with-v0': {
    hints: [String.raw`Energy: $\tfrac12 mv_f^2 = \tfrac12 mv_0^2 + q\,\Delta V$. Solve for $v_f$ — do not just add a speed to $v_0$.`],
  },
  'e3.39.equipotential-map': {
    hints: [String.raw`$W_{\text{ext}} = q\,\Delta V = q(V_{\text{end}} - V_{\text{start}})$. Points on the same surface have $\Delta V = 0$.`],
  },
  'e3.39.arc-center-V': {
    why: {
      double: {
        half: 'Doubling R doubles the charge on the arc (Q = λπR) as well as the distance, so the two cancel.',
        twice: 'Doubling R doubles the charge on the arc, but each piece is also twice as far away, so V does not change.',
      },
    },
  },
  // ------------------------------------------------------------------ Ch 40
  'e3.40.parallel-plate': {
    hints: [
      String.raw`$C = \dfrac{\varepsilon_0 A}{d}$, with $d$ in metres.`,
      String.raw`Then $Q = CV$, $E = V/d$ and $U = \tfrac12 CV^2 = \dfrac{\varepsilon_0 A V^2}{2d}$.`,
    ],
  },
  'e3.40.dielectric-battery': {
    hints: [
      'While the battery stays connected, V is fixed.',
      String.raw`$C = \kappa C_0$, so $Q = CV$ goes up by κ. With $V$ and $d$ unchanged, $E = V/d$ is unchanged.`,
    ],
  },
  'e3.40.dielectric-isolated': {
    hints: [
      'Disconnected, the charge has nowhere to go: Q is fixed.',
      String.raw`$C = \kappa C_0$, so $V = Q/C$ and $U = Q^2/2C$ both drop by κ, and $E = V/d$ drops with $V$.`,
    ],
    why: {
      where: {
        2: 'The plates are isolated, so no charge can leave them.',
        3: 'The battery was disconnected before the slab went in, so nothing can flow back to it.',
      },
    },
  },
  'e3.40.energy': {
    hints: [
      String.raw`$Q = CV$ with $C$ in farads (μF × 10⁻⁶) and $V$ in volts (kV × 10³).`,
      String.raw`$U = \tfrac12 CV^2$ — square the voltage before multiplying.`,
    ],
  },
  'e3.40.increase-C': {
    why: {
      ans: {
        charge: String.raw`More charge raises $V$ in proportion, so $C = Q/V$ stays the same.`,
        voltage: String.raw`A higher $V$ brings more charge in proportion, so $C = Q/V$ stays the same.`,
        apart: String.raw`$C = \varepsilon_0 A/d$: a larger gap lowers $C$.`,
        topos: 'Field lines leave positive charge and end on negative charge.',
        along: 'Between the plates the field runs straight from one plate to the other, across the gap.',
        inverse: String.raw`$C = \kappa C_0$, so κ is the factor itself, not its reciprocal.`,
        needV: String.raw`$C = \kappa C_0$ holds at any voltage: κ is just the ratio $C/C_0$.`,
      },
    },
  },
  'e3.40.gap-holds': {
    why: {
      sparks: {
        yes: 'Compare the field in the gap with 3 MV/m: here it is below, so the rule says the gap holds.',
        no: 'Compare the field in the gap with 3 MV/m: here it is above, so the rule says the gap breaks down.',
      },
    },
  },
  'e3.40.paschen-min': {
    why: {
      why: {
        many: 'Left of the minimum there is less gas, not more: p·d is small.',
        none: 'Left of the minimum the breakdown voltage rises again — the curve has a floor.',
      },
    },
  },
  'e3.40.wider-gap': {
    why: {
      which: {
        narrow: 'At 20 Pa the narrow gap has p·d below the Paschen minimum, where breakdown gets harder, not easier.',
        same: 'Their p·d values differ, and V_b depends on p·d, so the voltages differ.',
      },
      why: {
        rule: 'The 3 MV/m rule works well for air near one atmosphere; it fails at low pressure, where p·d is small.',
        temp: 'Nothing about temperature differs here. The difference is p·d.',
      },
    },
  },
  // ------------------------------------------------------------------ Ch 41
  'e3.41.wire-R': {
    hints: [String.raw`$R = \dfrac{\rho L}{A}$ with $A$ in m² — $1\ \text{mm}^2 = 10^{-6}\ \text{m}^2$.`, String.raw`Then Ohm's law: $I = V/R$.`],
  },
  'e3.41.temperature': {
    hints: [String.raw`Resistance grows linearly with temperature: $R = R_0[1 + \alpha(T - T_0)]$.`, 'T₀ is the temperature at which R = R₀ (here 20 °C).'],
  },
  'e3.41.drift': {
    hints: [
      String.raw`$R = \rho L/A$ first, then $I = V/R$.`,
      String.raw`$J = I/A$, $E = V/L$, and $v_d = \dfrac{J}{ne} = \dfrac{I}{neA}$.`,
    ],
  },
  'e3.41.charge-flow': {
    hints: [String.raw`$I = \Delta Q/\Delta t$, with $\Delta t$ in seconds.`, 'Each electron carries e = 1.60 × 10⁻¹⁹ C, so electrons per second = I/e.'],
  },
  'e3.41.stretch': {
    hints: [String.raw`Length × n and area ÷ n: $R = \dfrac{\rho(nL)}{A/n} = n^2R_0$.`],
  },
  'e3.41.non-ohmic': {
    why: {
      ans: {
        1: 'A straight I–V line through the origin is what an ohmic resistor gives. This device’s resistance changes with conditions.',
        0: 'A metal at a fixed temperature has a constant R, so its I–V graph is a straight line through the origin.',
      },
    },
  },
  'e3.41.ohm-basics': {
    hints: ['Identify what you are given. Charge and time give current; two of V, I and R give the third.'],
  },
  'e3.41.geometry-concepts': {
    why: {
      ans: {
        x2: ($) =>
          $.ask === 'rho-half'
            ? 'Resistivity belongs to the material, not the shape of the wire.'
            : String.raw`$R = \rho L/(\pi r^2)$: the radius enters squared, so halving it multiplies $R$ by 4.`,
        x4: ($) =>
          $.ask === 'rho-half'
            ? 'Resistivity belongs to the material, not the shape of the wire.'
            : String.raw`Halving $L$ halves $R$, and halving $r$ quarters $A$ (×4 on $R$): overall ×2.`,
        quarter: String.raw`A smaller area means more resistance: $R \propto 1/r^2$ goes up by 4.`,
        same: ($) =>
          ({
            'half-radius': String.raw`$A = \pi r^2$ shrinks, so $R = \rho L/A$ grows.`,
            thicker: 'A thicker wire has a larger A, so less resistance.',
            heat: 'Heating a metal raises its resistivity, so R goes up.',
            'both-half': String.raw`Halving $L$ halves $R$, but halving $r$ multiplies it by 4: overall ×2.`,
          })[$.ask] || 'Work it out from R = ρL/A.',
        half: String.raw`Halving $L$ halves $R$, but halving $r$ multiplies it by 4: overall ×2.`,
        more: 'A thicker wire has more room for current: larger A, less resistance.',
        down: 'In a metal, heating makes the ions vibrate more and scatter the electrons more, so R rises.',
        const: 'Non-ohmic means R changes with the voltage — the I–V graph is not a straight line.',
        light: 'The signal travels at nearly c; the electrons themselves drift very slowly.',
        sound: 'Much slower than that: electrons drift at well under a millimetre per second in a typical wire.',
      },
    },
  },
  'e3.41.across-resistor': {
    why: {
      ans: {
        moreA: 'Charge is conserved and does not pile up in the resistor, so the current in equals the current out. It uses up energy, not current.',
        moreB: 'Charge is conserved and does not pile up in the resistor, so the current in equals the current out.',
        highB: 'Conventional current flows from high potential to low through a resistor, so a is higher.',
        sameV: 'There is a voltage drop IR across the resistor, so the ends are at different potentials.',
        gainU: 'Charges lose potential energy in a resistor; it becomes heat.',
        sameU: 'The charges drop through a potential difference IR, so their potential energy falls.',
      },
    },
  },
  'e3.41.block-R': {
    why: {
      hi: {
        0: String.raw`Along the shortest edge the path is short and the face is wide: that is the smallest $R = \rho L/A$.`,
        1: 'The longest edge gives both the longest path and the smallest face, so it has the largest R.',
        3: String.raw`$R = \rho L/A$ depends on which faces the current enters through, so the three are different.`,
      },
    },
  },
  // ------------------------------------------------------------------ Ch 42
  'e3.42.bulb': {
    hints: ['The rating means the bulb draws 60 W when it has 120 V across it.', String.raw`$P = V^2/R$ gives $R$; $P = IV$ gives $I$.`],
  },
  'e3.42.ac-rms': {
    hints: [String.raw`Peak and rms: $V_p = \sqrt{2}\,V_{\text{rms}}$.`, String.raw`Use rms values in the DC formulas: $I_{\text{rms}} = V_{\text{rms}}/R$, $P_{\text{avg}} = V_{\text{rms}}^2/R$.`],
  },
  'e3.42.cost': {
    hints: ['Energy = power × time. Work in kilowatts and hours to get kWh straight away.', '1500 W = 1.5 kW, and the time is 3 h per day × 30 days. Then multiply by the price per kWh.'],
  },
  'e3.42.two-bulbs': {
    why: {
      brighter: {
        1: String.raw`In series the current is the same, so $P = I^2R$ is larger for the larger $R$ — the lower-rated bulb.`,
        2: String.raw`In series the current is the same, so $P = I^2R$ is larger for the larger $R$ — the lower-rated bulb.`,
      },
    },
  },
  'e3.42.heater': {
    hints: [String.raw`$P = V^2/R$.`, String.raw`Heat delivered $Q = Pt$ with $t$ in seconds; then $\Delta T = Q/(mc)$.`],
  },
  'e3.42.fuse': {
    why: {
      trip: {
        1: 'Compare the total current with the breaker rating: this one is under it.',
        0: 'Compare the total current with the breaker rating: this one is over it, so the breaker opens.',
      },
    },
  },
  'e3.42.grounding': {
    why: {
      ans: {
        reference: 'That describes the earthed wire of the supply, which sets a common zero of potential.',
        path: 'That is what the ground wire on an appliance’s case does. This question is about something else.',
        limit: 'That is what a fuse or breaker does.',
        voltage: 'Voltage drives the current, but the damage is done by the current through the body.',
        power: 'The damage is done by the current through the body.',
      },
    },
  },
  'e3.42.body-current': {
    why: {
      band: {
        none: 'Work out I = V/R and compare with about 1 mA, where a current starts to be felt.',
        felt: 'Work out I = V/R and compare with the bands: under about 1 mA it is not felt; above about 100 mA it can be fatal.',
        fatal: 'Work out I = V/R: it is below about 100 mA here. Still dangerous — but not in the fatal band the notes use.',
      },
    },
  },
  'e3.42.power-basics': {
    hints: ['Then use whichever of P = IV or V = IR finishes the job.'],
  },
  'e3.42.concepts': {
    why: {
      ans: {
        smallR: String.raw`In series the current is the same, so $P = I^2R$ is larger in the larger resistance.`,
        same: ($) =>
          ({
            series: String.raw`The current is the same in series, but $P = I^2R$ also depends on $R$.`,
            brighter: String.raw`At the same voltage $P = V^2/R$, so the lamps' resistances must differ.`,
            transmission: String.raw`The line loss is $I^2R$. The same power at a higher voltage needs less current, so less is lost.`,
          })[$.ask] || '',
        greater: String.raw`On the same supply $P = V^2/R$: more power means less resistance.`,
        highI: String.raw`Line loss is $I^2R$, so high current wastes the most. Transmit at high voltage and low current.`,
        voltage: 'Voltage drives it, but it is the current through the body that does the damage.',
        power: 'It is the current through the body that does the damage.',
      },
    },
  },
};
