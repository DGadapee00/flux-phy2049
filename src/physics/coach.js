import { K, EPS0 } from './constants.js';
import { dist } from './vec.js';
import { isClosed } from './surfaces.js';

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

function coachGauss(surface, charges, extraE, computed) {
  const closed = isClosed(surface.type);
  const o = surface.origin;
  const hasUniform = extraE && (extraE.x || extraE.y || extraE.z);

  if (surface.type === 'square') {
    const A = (2 * surface.R) ** 2;
    const ca = Math.cos(surface.tilt || 0);
    return {
      title: 'Open surface — flux, not Gauss',
      body: 'Φ_E = E · A = |E| A cosθ, with A = |A| n̂ pointing the way you choose. This square is not closed, so the right-hand side of Gauss’s law does not apply. Tilt it and watch cosθ kill the flux even though |E| is unchanged.',
      canFindE: false,
      Eguess: null,
      formula: `Φ = EA cosθ, A = ${(A).toFixed(2)} m², θ = ${(((surface.tilt || 0) * 180) / Math.PI).toFixed(0)}°, cosθ = ${ca.toFixed(2)}`,
    };
  }

  if (computed.nOn > 0) {
    return {
      title: 'Charge on the surface',
      body: 'A Gaussian surface should not cut through a point charge. Drag the charge fully inside or fully outside. “On the surface” is not a legal Q_in.',
      canFindE: false,
      Eguess: null,
    };
  }

  if (charges.length === 0 && !hasUniform) {
    return {
      title: 'Empty space',
      body: 'No charge, no flux. Add a charge, then drag it through the surface. Φ jumps only when Q_in changes — not when you resize the surface around the same enclosed charge.',
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
        title: 'Spherical symmetry — Gauss finds |E|',
        body: 'E has the same magnitude on every tile and is parallel to n̂, so ∮ E·dA = E · 4πR² = Q_in/ε₀. That is why |E| = k|q|/R². Grow the sphere: |E| falls, area grows, flux stays put.',
        canFindE: true,
        Eguess: E,
        formula: `|E| = k|q|/R² = Q_in/(4πε₀ R²)`,
      };
    }
    if (computed.nIn === 1) {
      return {
        title: 'Inside, but off-center',
        body: 'Gauss still says Φ = Q_in/ε₀. You cannot pull |E| out of the integral — the gold tiles (near side) are stronger than the far side. Flux is not EA here. This is the whole point of the law: net flux cares about Q_in, not where the charge sits.',
        canFindE: false,
        Eguess: null,
      };
    }
    return {
      title: 'Charge outside — net flux ≈ 0',
      body: 'Every field line that enters the volume also leaves it. Blue tiles (inward, E·n̂ < 0) cancel gold tiles (outward). Q_in = 0, so Φ = 0, even though E on the surface is not zero.',
      canFindE: false,
      Eguess: null,
    };
  }

  if (surface.type === 'sphere' && charges.length >= 2) {
    if (noneIn) {
      return {
        title: 'Nothing enclosed',
        body: 'Dipole or not, if Q_in = 0 the net flux is zero. Field lines can look busy on the surface and still sum to nothing.',
        canFindE: false,
        Eguess: null,
      };
    }
    const net = computed.Qin;
    if (Math.abs(net) < 1e-12 && computed.nIn >= 2) {
      return {
        title: 'Dipole inside — Q_in = 0',
        body: 'Both charges are inside, but they cancel. Net flux is zero even though the field on the surface is not. Gauss counts algebraic Q_in, not “how many charges.”',
        canFindE: false,
        Eguess: null,
      };
    }
    return {
      title: 'Superposition, then Gauss',
      body: 'Only the enclosed charges contribute to net flux. A charge outside still changes E on the tiles — look at the color pattern — but its in-and-out contributions cancel. Φ tracks Q_in only.',
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
        body: 'For an infinite line, E is radial (⊥ wall, ∥ caps). Caps contribute ~0 because E ⊥ n̂ there. Φ_wall = E · 2πRL = Q_in/ε₀, so |E| = 2kλ/R. The line in this lab is finite — match gets better if the line is long compared with L.',
        canFindE: true,
        Eguess: E,
        formula: `|E| = 2kλ/R, λ = Q_in/L`,
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
        body: 'Infinite sheet: E is perpendicular to the plane and the same on both sides. Wall flux ≈ 0. Two caps give Φ = 2EA = Q_in/ε₀, so |E| = σ/(2ε₀). This sheet is discrete, so the match is approximate.',
        canFindE: true,
        Eguess: E,
        formula: `|E| = σ/(2ε₀), σ = Q_in / (πR²)`,
      };
    }
  }

  if (surface.type === 'cube') {
    if (allIn && charges.length === 1 && offsetFromOrigin(charges[0], o) < 0.05) {
      return {
        title: 'Cube around a centered charge',
        body: 'Gauss still gives Φ = Q_in/ε₀, but |E| is not constant on a cube (corners are farther than face centers). Do not write Φ = EA for a cube unless E is uniform. Use a sphere if you want |E|.',
        canFindE: false,
        Eguess: null,
      };
    }
  }

  if (closed && computed.nIn > 0) {
    return {
      title: 'Gauss gives flux, not always |E|',
      body: 'The left-hand side is a surface integral of E·n̂. You may replace it with EA only when symmetry makes |E| constant and E ∥ n̂. Otherwise the colored tiles still add to Q_in/ε₀ — that equality is the law.',
      canFindE: false,
      Eguess: null,
    };
  }

  if (closed && noneIn) {
    return {
      title: 'Q_in = 0 ⇒ Φ = 0',
      body: 'Resize the surface, move outside charges, change their values — net flux stays near zero until a charge crosses in. That jump is Gauss’s law happening in front of you.',
      canFindE: false,
      Eguess: null,
    };
  }

  return {
    title: 'Closed surface',
    body: 'Φ_E = ∮ E · n̂ dA = Q_in/ε₀. Gold is outward flux, blue is inward. The numerical sum over tiles is a Riemann sum for that integral.',
    canFindE: false,
    Eguess: null,
  };
}

function coachField(charges, computed) {
  if (charges.length === 0) {
    return {
      title: 'Place charges',
      body: 'The field is the force per unit positive test charge. Click + / −, then drop the probe (the white marker) and read E_net = Σ E_i.',
      canFindE: false,
    };
  }
  if (charges.length === 1) {
    const sign = charges[0].q >= 0 ? 'away from' : 'toward';
    return {
      title: 'Point charge',
      body: `E = (k q / r²) r̂. Field lines leave + and enter −. They are ${sign} this charge. Spacing is the magnitude: tight near the charge, sparse far away.`,
      canFindE: false,
    };
  }
  const pos = charges.filter((c) => c.q > 0).length;
  const neg = charges.filter((c) => c.q < 0).length;
  if (pos === 1 && neg === 1) {
    return {
      title: 'Dipole',
      body: 'At the probe, add vectors: E_net = E₊ + E₋. Lines start on + and end on −. On the perpendicular bisector the two fields add; on the axis they can oppose.',
      canFindE: false,
    };
  }
  return {
    title: 'Superposition',
    body: `E_net = Σ E_i at the probe. The table lists each contribution. ${computed?.probe ? 'Resolve into x, y, z, then add components — same move as on the equation sheet.' : 'Drag the probe to a point from a homework problem.'}`,
    canFindE: false,
  };
}

function coachIntegral(state) {
  const kind = state.integral.kind;
  if (kind === 'rod') {
    return {
      title: 'Line charge — perpendicular bisector',
      body: 'dq = λ dx. Each slice sends dE = k dq/r² r̂ toward P. The x-components cancel in pairs; the y-components add. The sheet integral ∫ dx/(x²+d²)^{3/2} is this picture. Play the sum and watch E_x die while E_y builds.',
      canFindE: true,
    };
  }
  return {
    title: 'Ring on axis',
    body: 'Every dq is the same distance from P, so |dE| is constant. Radial pieces cancel around the ring; the axial pieces add. That is why E = k Q y / (y²+a²)^{3/2} — the same (x²+a²)^{3/2} integral as on the sheet.',
    canFindE: true,
  };
}

function coachForce(charges) {
  if (charges.length < 2) {
    return {
      title: 'Coulomb’s law',
      body: 'F_E = (k q₁ q₂ / r²) r̂. Like charges repel, opposite attract. Add a second charge to see the pair of forces (Newton 3: equal magnitude, opposite direction).',
      canFindE: false,
    };
  }
  return {
    title: 'Net force is a vector sum',
    body: 'On the selected charge, F_net = Σ F_i = q E_others. The gold arrow is the net. Thin arrows are the pairs. If you needed equilibrium you would set ΣF_x = 0 and ΣF_y = 0.',
    canFindE: false,
  };
}

function coachPotential(state, computed) {
  const V = computed.V;
  if (state.extraE && Math.hypot(state.extraE.x, state.extraE.y, state.extraE.z) > 1) {
    return {
      title: 'Uniform field — ΔV = −E Δx',
      body: 'E is constant, so V falls linearly along the field. Equipotentials are equally spaced planes, perpendicular to E. Potential is not PE: ΔPE_E = q ΔV. A positive charge loses PE running “downhill” with E.',
    };
  }
  if (state.charges.length === 1) {
    return {
      title: 'Absolute potential of a point charge',
      body: 'V = kq/r with V_∞ = 0. V is a scalar — no direction. E = −dV/dr points downhill, toward decreasing V. Tight equipotentials mean a steep slope and a strong E.',
    };
  }
  if (state.charges.length >= 2) {
    const nearZero = Math.abs(V) < 50;
    return {
      title: 'Scalar superposition',
      body: nearZero
        ? 'V_total = Σ kq_i/r_i. Opposite signs can cancel even though E does not. On this midplane the potentials cancel; the fields add. Zero potential is not zero field.'
        : 'Add the potentials as signed numbers, not vectors. Then ΔPE = q ΔV and W_field = q(V_A − V_B). Moving on an equipotential does no work (φ = 90°).',
    };
  }
  return {
    title: 'Electric potential',
    body: 'V = PE_E / q. Place charges, drop the probe, read V and −dV/dx versus E_x. The contours are a topographic map of voltage.',
  };
}

function coachCap(state, computed) {
  const r = computed.cap;
  if (!r) {
    return { title: 'Capacitor', body: 'Two plates, +Q and −Q. C = q/ΔV = κε₀A/d.' };
  }
  if (r.breakdown) {
    return {
      title: 'Breakdown — E > dielectric strength',
      body: `V_bd = (DS) d. This field is past the dielectric strength of ${r.mat.name}. The insulator avalanches and the capacitor is destroyed. Increase d or pick a stronger dielectric.`,
    };
  }
  if (state.cap.Cset) {
    return {
      title: 'Stored energy U = ½ C V²',
      body: 'The energy lives in the field between the plates. A defibrillator dumps that energy fast: P is large because Δt is small. Discharge capacitors before you touch them.',
    };
  }
  if (state.cap.mode === 'battery') {
    return {
      title: 'Power supply holds V fixed',
      body: 'C = κε₀A/d. Inserting a dielectric (κ > 1) raises C, so q = C V rises and the supply pushes more charge on. E = V/d stays the same while the battery is connected. Shrink d → C up. Grow A → C up.',
    };
  }
  return {
    title: 'Isolated plates — Q fixed',
    body: 'Disconnected, Q cannot change. Insert a dielectric and C rises, so V = Q/C and E = V/d both fall. That is the opposite of the battery-connected case. Montgomery’s nylon example is the battery case.',
  };
}

function coachOhm(state, computed) {
  const o = computed.ohm;
  if (!o) return { title: 'Ohm’s law', body: 'V = IR. R = ρL/A.' };
  return {
    title: 'Current is a flow of charge',
    body: `I = dq/dt. Conventional current is + charge from + to −; electrons actually crawl the other way at drift speed v_d = J/(nq) — here ${o.vd.toExponential(2)} m/s. The signal is the field, which is set up at nearly c. Heat the wire: ρ = ρ₀[1+αΔT], R up, I down.`,
  };
}

function coachPower(state, computed) {
  const pw = state.power;
  const p = computed.power;
  if (pw.mode === 'ac') {
    const Vp = pw.Vrms * Math.SQRT2;
    const Pavg = (pw.Vrms * pw.Vrms) / pw.R;
    return {
      title: 'rms means “same average power as DC”',
      body: `Slowed down: one cycle takes 2 s. The charges slosh back and forth instead of circulating, and the bulb flickers twice per cycle because P(t) = I(t)·V(t) ∝ sin² is never negative. The peak is V_p = √2·V_rms = ${Vp.toFixed(0)} V, but the average ½·I_p·V_p = I_rms·V_rms = ${Pavg.toFixed(1)} W — the same power as ${pw.Vrms} V of steady DC.`,
    };
  }
  const I = p ? p.I : pw.V / pw.R;
  const P = I * pw.V;
  if ((pw.load || 'bulb') === 'heater') {
    return {
      title: 'Heaters are low-R on purpose',
      body: `At ${pw.V} V, R = ${pw.R} Ω draws I = V/R = ${I.toFixed(2)} A, so P = I²R = ${P.toFixed(0)} W. Compare how fast the charges move with the bulb scenarios. Large I is also why cords warm up: their loss is I²·R_wire.`,
    };
  }
  return {
    title: 'Brighter bulb = less resistance',
    body: `At fixed V, R = V²/P: a 60 W bulb is 240 Ω and a 100 W bulb is 144 Ω. Here R = ${pw.R} Ω gives I = ${I.toFixed(3)} A and P = ${P.toFixed(1)} W. The three power rows always agree — P = IV, I²R and V²/R are one law rewritten with V = IR.`,
  };
}
