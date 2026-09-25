/**
 * Series RC circuit, charging from a battery or discharging with the battery removed (Ch 44).
 *
 * The capacitance is one capacitor or a pair, in parallel or in series; the pair acts as C_eq for
 * the time constant, and each capacitor's own charge and voltage follow from how they are joined.
 * Time is measured from the moment the switch closes. With the switch still open nothing flows: a
 * charging capacitor sits empty, a discharging one holds its starting voltage.
 *
 *   charging:     q = C_eq ε (1 − e^{−t/τ})   I = (ε/R) e^{−t/τ}    V_C + V_R = ε
 *   discharging:  q = C_eq V₀ e^{−t/τ}        I = (V₀/R) e^{−t/τ}   V_C = V_R  (no battery)
 */
export function equivalentC(net, C1, C2) {
  if (net === 'parallel') return C1 + C2;
  if (net === 'series') return (C1 * C2) / (C1 + C2);
  return C1;
}

export function rcState({ mode = 'charge', net = 'one', E, V0, R, C1, C2, t = 0, closed = false }) {
  const Ceq = equivalentC(net, C1, C2);
  const tau = R * Ceq;
  const charging = mode === 'charge';
  const src = charging ? E : V0; // the voltage that sets the scale: the battery's, or the starting charge's
  const k = closed ? Math.exp(-Math.max(0, t) / tau) : 1;
  const VC = charging ? (closed ? src * (1 - k) : 0) : src * k;
  const I = closed ? (src / R) * k : 0; // magnitude; its direction reverses on discharge
  const VR = I * R;
  const q = Ceq * VC;
  // Each capacitor: side by side they share V; one after the other they share q.
  const two = net !== 'one';
  const V1 = net === 'series' ? q / C1 : VC;
  const V2 = !two ? 0 : net === 'series' ? q / C2 : VC;
  return {
    Ceq,
    tau,
    k,
    charging,
    closed,
    t,
    n: t / tau,
    src,
    Qmax: Ceq * src, // the full charge: where charging ends, or where discharging starts
    Imax: src / R,
    q,
    I,
    VC,
    VR,
    U: 0.5 * Ceq * VC * VC,
    PR: I * I * R,
    Pbat: charging ? I * E : 0,
    loop: charging ? E - VR - VC : VC - VR, // the loop rule's leftover: zero at every instant
    two,
    V1,
    V2,
    Q1: C1 * V1,
    Q2: two ? C2 * V2 : 0,
  };
}

/** VC and I as fractions of their scale, over 0 … span·τ, for the plot. */
export function rcCurves(r, span = 6, n = 120) {
  const pts = [];
  for (let i = 0; i <= n; i++) {
    const x = (i / n) * span;
    const k = Math.exp(-x);
    pts.push({ x, vc: r.charging ? 1 - k : k, i: k });
  }
  return pts;
}
