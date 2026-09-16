/**
 * Series AC circuit. V is the reference phasor along the real axis.
 * φ = atan2(X_L − X_C, R) is the angle by which V leads I (positive = inductive).
 */
export function acState({ R, L, C, f, Vrms, hasL = true, hasC = true }) {
  const omega = 2 * Math.PI * f;
  const XL = hasL && L > 0 ? omega * L : 0;
  const XC = hasC && C > 0 ? 1 / (omega * C) : 0;
  const X = XL - XC;
  const Z = Math.hypot(R, X);
  const phi = Math.atan2(X, R);
  const Vp = Vrms * Math.SQRT2;
  const Ip = Z > 0 ? Vp / Z : 0;
  const Irms = Ip / Math.SQRT2;
  const VR = Irms * R;
  const VL = Irms * XL;
  const VC = Irms * XC;
  const omega0 = hasL && hasC && L > 0 && C > 0 ? 1 / Math.sqrt(L * C) : null;
  const f0 = omega0 != null ? omega0 / (2 * Math.PI) : null;
  const Q = omega0 != null && R > 0 ? (omega0 * L) / R : null;
  const pf = Math.cos(phi);
  const Pavg = Irms * Vrms * pf;
  return {
    omega,
    XL,
    XC,
    X,
    Z,
    phi,
    Vp,
    Ip,
    Irms,
    Vrms,
    VR,
    VL,
    VC,
    VRp: Ip * R,
    VLp: Ip * XL,
    VCp: Ip * XC,
    omega0,
    f0,
    Q,
    pf,
    Pavg,
    hasL: hasL && L > 0,
    hasC: hasC && C > 0,
  };
}

export function vOfT(s, t) {
  return s.Vp * Math.sin(s.omega * t);
}

export function iOfT(s, t) {
  return s.Ip * Math.sin(s.omega * t - s.phi);
}
