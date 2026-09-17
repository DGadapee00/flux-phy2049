import { K, EPS0 } from './constants.js';
import { dist } from './vec.js';
import { isClosed } from './surfaces.js';
import { eq } from '../ui/shared.js';
import { sciTex } from '../ui/format.js';

/**
 * The explainer under each lab's readout. A body is prose with inline math between `$…$` plus
 * `eq(...)` display equations (src/ui/shared.js), so the panel reads like a page of a textbook:
 * a sentence, the equation it turns on, then what to do with it.
 */

function nearlyOnAxis(c, origin, tol = 0.03) {
  return Math.hypot(c.x - origin.x, c.z - origin.z) < tol;
}

function offsetFromOrigin(c, origin) {
  return dist(c, origin);
}

/**
 * Tell the student whether Gauss can be used to pull |E| out of the integral,
 * and write the short "why" in Montgomery's figure-first voice.
 */
export function coach(state, computed) {
  const { lab, surface, charges, extraE } = state;
  if (lab === 'gauss') return coachGauss(surface, charges, extraE, computed);
  if (lab === 'field') return coachField(charges, computed);
  if (lab === 'integral') return coachIntegral(state);
  if (lab === 'force') return coachForce(charges, computed);
  if (lab === 'potential') return coachPotential(state, computed);
  if (lab === 'capacitor') return coachCap(state, computed);
  if (lab === 'ohm') return coachOhm(state, computed);
  if (lab === 'power') return coachPower(state, computed);
  return { title: '', body: '', canFindE: false, Eguess: null };
}

export function coachGauss(surface, charges, extraE, computed) {
  const closed = isClosed(surface.type);
  const o = surface.origin;
  const hasUniform = extraE && (extraE.x || extraE.y || extraE.z);

  if (surface.type === 'square') {
    const A = (2 * surface.R) ** 2;
    const ca = Math.cos(surface.tilt || 0);
    return {
      title: 'Open surface — flux, not Gauss',
      body: String.raw`$\vec{A} = A\,\hat{n}$ points the way you choose. This square is not closed, so the right-hand side of Gauss's law does not apply. Tilt it and watch $\cos\theta$ kill the flux even though $|\vec{E}|$ is unchanged.`,
      canFindE: false,
      Eguess: null,
      formula: `$A = ${A.toFixed(2)}\\ \\text{m}^2,\\ \\theta = ${(((surface.tilt || 0) * 180) / Math.PI).toFixed(0)}^\\circ,\\ \\cos\\theta = ${ca.toFixed(2)}$`,
    };
  }

  if (computed.nOn > 0) {
    return {
      title: 'Charge on the surface',
      body: String.raw`A Gaussian surface should not cut through a point charge. Drag the charge fully inside or fully outside — "on the surface" is not a legal $Q_{\text{in}}$.`,
      canFindE: false,
      Eguess: null,
    };
  }

  if (charges.length === 0 && !hasUniform) {
    return {
      title: 'Empty space',
      body: String.raw`No charge, no flux. Add a charge, then drag it through the surface. $\Phi_E$ jumps only when $Q_{\text{in}}$ changes — not when you resize the surface around the same enclosed charge.`,
      canFindE: false,
      Eguess: null,
    };
  }

  const allIn = computed.nIn === charges.length && computed.nOut === 0;
  const noneIn = computed.nIn === 0;

  if (surface.type === 'sphere' && charges.length === 1) {
    const c = charges[0];
    const d = offsetFromOrigin(c, o);
    if (computed.nIn === 1 && d < 0.05) {
      const E = (K * Math.abs(c.q)) / (surface.R * surface.R);
      return {
        title: String.raw`Spherical symmetry — Gauss finds $|\vec{E}|$`,
        body: [
          String.raw`$|\vec{E}|$ is the same on every tile and $\vec{E}\parallel\hat{n}$, so the integral collapses to a product:`,
          eq(String.raw`\oint \vec{E}\cdot\hat{n}\,dA = |\vec{E}|\,(4\pi R^2) = \frac{Q_{\text{in}}}{\varepsilon_0}`),
          String.raw`That is where $|\vec{E}| = k|q|/R^2$ comes from. Grow the sphere: $|\vec{E}|$ falls as $1/R^2$, the area grows as $R^2$, and the flux stays put.`,
        ],
        canFindE: true,
        Eguess: E,
        formula: String.raw`$|\vec{E}| = \dfrac{k|q|}{R^2} = \dfrac{Q_{\text{in}}}{4\pi\varepsilon_0 R^2}$`,
      };
    }
    if (computed.nIn === 1) {
      return {
        title: 'Inside, but off-center',
        body: [
          String.raw`Gauss still gives $\Phi_E = Q_{\text{in}}/\varepsilon_0$, but you cannot pull $|\vec{E}|$ out of the integral: the gold tiles on the near side are stronger than the far side, so`,
          eq(String.raw`\oint \vec{E}\cdot\hat{n}\,dA \neq |\vec{E}|\,A \quad\text{here.}`),
          String.raw`This is the whole point of the law — the net flux cares about $Q_{\text{in}}$, not about where inside the charge sits.`,
        ],
        canFindE: false,
        Eguess: null,
      };
    }
    return {
      title: String.raw`Charge outside — net flux $\approx 0$`,
      body: [
        String.raw`Every field line that enters the volume also leaves it, so the blue tiles ($\vec{E}\cdot\hat{n} < 0$) cancel the gold ones ($\vec{E}\cdot\hat{n} > 0$):`,
        eq(String.raw`Q_{\text{in}} = 0 \;\Longrightarrow\; \Phi_E = 0`),
        String.raw`even though $\vec{E}$ on the surface is nowhere near zero.`,
      ],
      canFindE: false,
      Eguess: null,
    };
  }

  if (surface.type === 'sphere' && charges.length >= 2) {
    if (noneIn) {
      return {
        title: 'Nothing enclosed',
        body: String.raw`Dipole or not, if $Q_{\text{in}} = 0$ the net flux is zero. The field on the surface can look busy and still sum to nothing.`,
        canFindE: false,
        Eguess: null,
      };
    }
    const net = computed.Qin;
    if (Math.abs(net) < 1e-12 && computed.nIn >= 2) {
      return {
        title: String.raw`Dipole inside — $Q_{\text{in}} = 0$`,
        body: String.raw`Both charges are inside, but they cancel: $Q_{\text{in}} = (+q) + (-q) = 0$, so $\Phi_E = 0$ even though $\vec{E}$ on the surface is not zero. Gauss counts algebraic charge, not how many charges.`,
        canFindE: false,
        Eguess: null,
      };
    }
    return {
      title: 'Superposition, then Gauss',
      body: String.raw`Only the enclosed charges contribute to the net flux. A charge outside still changes $\vec{E}$ on the tiles — look at the colour pattern — but its inward and outward contributions cancel, so $\Phi_E$ tracks $Q_{\text{in}}$ alone.`,
      canFindE: false,
      Eguess: null,
    };
  }

  if ((surface.type === 'cylinder' || surface.type === 'pillbox') && charges.length >= 3) {
    const onAxis = charges.filter((c) => nearlyOnAxis(c, o, 0.06));
    const spreadY = charges.length
      ? Math.max(...charges.map((c) => c.y)) - Math.min(...charges.map((c) => c.y))
      : 0;
    if (onAxis.length >= charges.length - 1 && spreadY > surface.L * 0.8) {
      const Qin = computed.Qin;
      const lambda = Qin / surface.L;
      const E = (2 * K * Math.abs(lambda)) / surface.R;
      return {
        title: 'Cylindrical symmetry',
        body: [
          String.raw`For an infinite line $\vec{E}$ is radial: perpendicular to the wall, parallel to the caps. The caps contribute nothing because $\vec{E}\perp\hat{n}$ there, so all of the flux crosses the wall:`,
          eq(String.raw`|\vec{E}|\,(2\pi R L) = \frac{Q_{\text{in}}}{\varepsilon_0} \quad\Longrightarrow\quad |\vec{E}| = \frac{2k\lambda}{R}`),
          String.raw`The line in this lab is finite, so the match improves as the line gets long compared with $L$.`,
        ],
        canFindE: true,
        Eguess: E,
        formula: String.raw`$|\vec{E}| = \dfrac{2k\lambda}{R},\quad \lambda = \dfrac{Q_{\text{in}}}{L}$`,
      };
    }
  }

  if (surface.type === 'pillbox' && charges.length >= 8) {
    const sheet = charges.every((c) => Math.abs(c.y - o.y) < 0.04);
    if (sheet) {
      const A = Math.PI * surface.R * surface.R;
      const sigma = computed.Qin / A;
      const E = Math.abs(sigma) / (2 * EPS0);
      return {
        title: 'Planar symmetry (pillbox)',
        body: [
          String.raw`For an infinite sheet $\vec{E}$ is perpendicular to the plane and the same on both sides. The wall flux is zero and the two caps each give $|\vec{E}|A$:`,
          eq(String.raw`2|\vec{E}|A = \frac{Q_{\text{in}}}{\varepsilon_0} \quad\Longrightarrow\quad |\vec{E}| = \frac{\sigma}{2\varepsilon_0}`),
          String.raw`Note what is missing: no distance. This sheet is built from discrete charges, so the match is approximate.`,
        ],
        canFindE: true,
        Eguess: E,
        formula: String.raw`$|\vec{E}| = \dfrac{\sigma}{2\varepsilon_0},\quad \sigma = \dfrac{Q_{\text{in}}}{\pi R^2}$`,
      };
    }
  }

  if (surface.type === 'cube') {
    if (allIn && charges.length === 1 && offsetFromOrigin(charges[0], o) < 0.05) {
      return {
        title: 'Cube around a centered charge',
        body: [
          String.raw`Gauss still gives $\Phi_E = Q_{\text{in}}/\varepsilon_0$, but $|\vec{E}|$ is not constant on a cube — the corners are farther away than the face centers. So`,
          eq(String.raw`\Phi_E \neq |\vec{E}|A \quad\text{for a cube.}`),
          String.raw`Write $\Phi_E = |\vec{E}|A$ only when $|\vec{E}|$ is uniform on the surface. Switch to a sphere if you want $|\vec{E}|$.`,
        ],
        canFindE: false,
        Eguess: null,
      };
    }
  }

  if (closed && computed.nIn > 0) {
    return {
      title: String.raw`Gauss gives flux, not always $|\vec{E}|$`,
      body: [
        String.raw`The left-hand side is a surface integral of $\vec{E}\cdot\hat{n}$. You may replace it with $|\vec{E}|A$ only when symmetry makes $|\vec{E}|$ constant and $\vec{E}\parallel\hat{n}$. Otherwise the coloured tiles still add to`,
        eq(String.raw`\oint \vec{E}\cdot\hat{n}\,dA = \frac{Q_{\text{in}}}{\varepsilon_0}`),
        'and that equality is the law.',
      ],
      canFindE: false,
      Eguess: null,
    };
  }

  if (closed && noneIn) {
    return {
      title: String.raw`$Q_{\text{in}} = 0 \Rightarrow \Phi_E = 0$`,
      body: String.raw`Resize the surface, move the outside charges, change their values — the net flux stays near zero until a charge crosses in. That jump is Gauss's law happening in front of you.`,
      canFindE: false,
      Eguess: null,
    };
  }

  return {
    title: 'Closed surface',
    body: [
      eq(String.raw`\Phi_E = \oint \vec{E}\cdot\hat{n}\,dA = \frac{Q_{\text{in}}}{\varepsilon_0}`),
      String.raw`Gold is outward flux, blue is inward. The numerical sum over the tiles is a Riemann sum for that integral.`,
    ],
    canFindE: false,
    Eguess: null,
  };
}

export function coachField(charges, computed) {
  if (charges.length === 0) {
    return {
      title: 'Place charges',
      body: [
        String.raw`The field is the force per unit positive test charge, $\vec{E} = \vec{F}/q_0$. Click $+$ or $-$, drop the probe (the white marker), and read`,
        eq(String.raw`\vec{E}_{\text{net}} = \textstyle\sum_i \vec{E}_i`),
      ],
      canFindE: false,
    };
  }
  if (charges.length === 1) {
    const sign = charges[0].q >= 0 ? 'away from' : 'toward';
    return {
      title: 'Point charge',
      body: [
        eq(String.raw`\vec{E} = \frac{kq}{r^2}\,\hat{r}`),
        `Field lines leave $+$ and enter $-$, so here they point ${sign} this charge. Their spacing is the magnitude: tight near the charge, sparse far away.`,
      ],
      canFindE: false,
    };
  }
  const pos = charges.filter((c) => c.q > 0).length;
  const neg = charges.filter((c) => c.q < 0).length;
  if (pos === 1 && neg === 1) {
    return {
      title: 'Dipole',
      body: [
        String.raw`At the probe, add the two fields as vectors:`,
        eq(String.raw`\vec{E}_{\text{net}} = \vec{E}_{+} + \vec{E}_{-}`),
        String.raw`Lines start on $+$ and end on $-$. On the perpendicular bisector the two fields reinforce; on the axis between the charges they oppose.`,
      ],
      canFindE: false,
    };
  }
  return {
    title: 'Superposition',
    body: [
      eq(String.raw`\vec{E}_{\text{net}} = \textstyle\sum_i \vec{E}_i \quad\text{at the probe}`),
      `The table lists each contribution. ${
        computed?.probe
          ? String.raw`Resolve each one into $x$, $y$ and $z$, then add components — the same move as on the equation sheet.`
          : 'Drag the probe to a point from a homework problem.'
      }`,
    ],
    canFindE: false,
  };
}

export function coachIntegral(state) {
  const kind = state.integral.kind;
  if (kind === 'rod') {
    return {
      title: 'Line charge — perpendicular bisector',
      body: [
        String.raw`Each slice carries $dq = \lambda\,dx$ and sends $d\vec{E} = k\,dq/r^2\,\hat{r}$ toward $P$. The $x$-components cancel in pairs and the $y$-components add, which leaves`,
        eq(String.raw`E_y = k\lambda d\int \frac{dx}{(x^2+d^2)^{3/2}}`),
        String.raw`That integral is this picture. Play the sum and watch $E_x$ die while $E_y$ builds.`,
      ],
      canFindE: true,
    };
  }
  return {
    title: 'Ring on axis',
    body: [
      String.raw`Every $dq$ is the same distance from $P$, so $|d\vec{E}|$ is constant around the ring. The radial pieces cancel and the axial pieces add:`,
      eq(String.raw`E_y = \frac{kQy}{(y^2+a^2)^{3/2}}`),
      String.raw`— the same $(\,\cdot\,)^{3/2}$ denominator as on the sheet.`,
    ],
    canFindE: true,
  };
}

export function coachForce(charges) {
  if (charges.length < 2) {
    return {
      title: "Coulomb's law",
      body: [
        eq(String.raw`\vec{F}_E = \frac{k q_1 q_2}{r^2}\,\hat{r}`),
        String.raw`Like charges repel, opposite charges attract. Add a second charge to see the pair of forces — Newton's third law: equal magnitude, opposite direction.`,
      ],
      canFindE: false,
    };
  }
  return {
    title: 'Net force is a vector sum',
    body: [
      String.raw`On the selected charge,`,
      eq(String.raw`\vec{F}_{\text{net}} = \textstyle\sum_i \vec{F}_i = q\,\vec{E}_{\text{others}}`),
      String.raw`The gold arrow is the net force; the thin arrows are the pairs. For an equilibrium problem you would set $\sum F_x = 0$ and $\sum F_y = 0$.`,
    ],
    canFindE: false,
  };
}

export function coachPotential(state, computed) {
  const V = computed.V;
  if (state.extraE && Math.hypot(state.extraE.x, state.extraE.y, state.extraE.z) > 1) {
    return {
      title: String.raw`Uniform field — $\Delta V = -E\,\Delta x$`,
      body: [
        String.raw`$\vec{E}$ is constant, so $V$ falls linearly along the field and the equipotentials are equally spaced planes perpendicular to it.`,
        String.raw`Potential is not potential energy: $\Delta PE_E = q\,\Delta V$, so a positive charge loses $PE_E$ running downhill with $\vec{E}$.`,
      ],
    };
  }
  if (state.charges.length === 1) {
    return {
      title: 'Absolute potential of a point charge',
      body: String.raw`With $V_\infty = 0$, $V = kq/r$ is a scalar — no direction, only a sign. The field points downhill, $E_r = -dV/dr$, so tight equipotentials mean a steep slope and a strong field.`,
    };
  }
  if (state.charges.length >= 2) {
    const nearZero = Math.abs(V) < 50;
    return {
      title: 'Scalar superposition',
      body: nearZero
        ? [
            eq(String.raw`V_{\text{total}} = \textstyle\sum_i \frac{kq_i}{r_i}`),
            String.raw`Opposite signs can cancel where $\vec{E}$ does not: here the potentials cancel while the fields add. Zero potential is not zero field.`,
          ]
        : [
            String.raw`Add the potentials as signed numbers, not as vectors. The work the field does is then`,
            eq(String.raw`W_{\text{field}} = q\,(V_A - V_B)`),
            String.raw`which is zero along an equipotential, where $\vec{F}\perp d\vec{s}$.`,
          ],
    };
  }
  return {
    title: 'Electric potential',
    body: [
      eq(String.raw`V = \frac{PE_E}{q}`),
      String.raw`Place charges, drop the probe, and compare $-dV/dx$ with $E_x$. The contours are a topographic map of voltage.`,
    ],
  };
}

export function coachCap(state, computed) {
  const r = computed.cap;
  if (!r) {
    return {
      title: 'Capacitor',
      body: [
        String.raw`Two plates carrying $+Q$ and $-Q$.`,
        eq(String.raw`C = \frac{q}{\Delta V} = \frac{\kappa\varepsilon_0 A}{d}`),
      ],
    };
  }
  if (r.breakdown) {
    return {
      title: String.raw`Breakdown — $E$ past the dielectric strength`,
      body: [
        eq(String.raw`V_{\text{bd}} = (\text{DS})\,d`),
        `This field is past the dielectric strength of ${r.mat.name}. The insulator avalanches and the capacitor is destroyed — increase $d$ or pick a stronger dielectric.`,
      ],
    };
  }
  if (state.cap.Cset) {
    return {
      title: String.raw`Stored energy $U = \tfrac{1}{2}CV^2$`,
      body: [
        String.raw`The energy lives in the field between the plates. A defibrillator dumps it fast:`,
        eq(String.raw`P = \frac{U}{\Delta t}`),
        String.raw`$P$ is large because $\Delta t$ is small. Discharge capacitors before you touch them.`,
      ],
    };
  }
  if (state.cap.mode === 'battery') {
    return {
      title: 'Power supply holds $V$ fixed',
      body: [
        eq(String.raw`C = \frac{\kappa\varepsilon_0 A}{d}, \qquad q = CV`),
        String.raw`Inserting a dielectric ($\kappa > 1$) raises $C$, so $q$ rises and the supply pushes more charge on, while $E = V/d$ stays put as long as the battery is connected. Shrink $d$ or grow $A$ and $C$ rises.`,
      ],
    };
  }
  return {
    title: String.raw`Isolated plates — $Q$ fixed`,
    body: [
      String.raw`Disconnected, $Q$ cannot change. Insert a dielectric and $C$ rises, so both`,
      eq(String.raw`V = \frac{Q}{C} \quad\text{and}\quad E = \frac{V}{d}`),
      String.raw`fall. That is the opposite of the battery-connected case — Montgomery's nylon example is the battery case.`,
    ],
  };
}

export function coachOhm(state, computed) {
  const o = computed.ohm;
  if (!o) {
    return { title: "Ohm's law", body: String.raw`$V = IR$ with $R = \rho L/A$.` };
  }
  return {
    title: 'Current is a flow of charge',
    body: [
      eq(String.raw`I = \frac{dq}{dt}, \qquad v_d = \frac{J}{nq}`),
      `Conventional current is positive charge moving from $+$ to $-$; the electrons actually crawl the other way at the drift speed, here $${sciTex(o.vd)}\\ \\text{m/s}$. The signal itself is the field, which is set up at nearly $c$.`,
      String.raw`Heat the wire and $\rho = \rho_0[1 + \alpha\,\Delta T]$ rises, so $R$ rises and $I$ falls.`,
    ],
  };
}

export function coachPower(state, computed) {
  const pw = state.power;
  const p = computed.power;
  if (pw.mode === 'ac') {
    const Vp = pw.Vrms * Math.SQRT2;
    const Pavg = (pw.Vrms * pw.Vrms) / pw.R;
    return {
      title: 'rms means "the same average power as DC"',
      body: [
        String.raw`Slowed down, one cycle takes 2 s. The charges slosh back and forth instead of circulating, and the bulb flickers twice per cycle because $P(t) = I(t)V(t) \propto \sin^2$ is never negative.`,
        eq(String.raw`V_p = \sqrt{2}\,V_{\text{rms}} = ${Vp.toFixed(0)}\ \text{V}, \qquad \bar{P} = ${Pavg.toFixed(1)}\ \text{W}`),
        `That average is the same power as ${pw.Vrms} V of steady DC.`,
      ],
    };
  }
  const I = p ? p.I : pw.V / pw.R;
  const P = I * pw.V;
  if ((pw.load || 'bulb') === 'heater') {
    return {
      title: 'Heaters are low-$R$ on purpose',
      body: [
        eq(String.raw`I = \frac{V}{R} = ${I.toFixed(2)}\ \text{A}, \qquad P = I^2R = ${P.toFixed(0)}\ \text{W}`),
        `At ${pw.V} V a ${pw.R} Ω element draws that much current — compare how fast the charges move with the bulb scenarios. Large $I$ is also why cords warm up: their loss is $I^2R_{\\text{wire}}$.`,
      ],
    };
  }
  return {
    title: 'Brighter bulb = less resistance',
    body: [
      String.raw`At fixed $V$, $R = V^2/P$: a 60 W bulb is 240 Ω and a 100 W bulb is 144 Ω. Here`,
      eq(String.raw`I = ${I.toFixed(3)}\ \text{A}, \qquad P = ${P.toFixed(1)}\ \text{W}`),
      String.raw`The three power rows always agree — $P = IV$, $I^2R$ and $V^2/R$ are one law rewritten with $V = IR$.`,
    ],
  };
}
