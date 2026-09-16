export function sciHTML(x, digits = 2) {
  if (!Number.isFinite(x)) return '—';
  if (Math.abs(x) < 1e-18) return '0';
  const [m, e] = Number(x).toExponential(digits).split('e');
  const exp = Number(e);
  const mant = m.replace(/\.?0+$/, '');
  return `${mant}×10<sup>${exp}</sup>`;
}

export function sciText(x, digits = 2) {
  if (!Number.isFinite(x)) return '—';
  if (Math.abs(x) < 1e-18) return '0';
  return Number(x).toExponential(digits);
}

export function fmtCharge(q) {
  if (!Number.isFinite(q) || Math.abs(q) < 1e-18) return '0';
  const uC = q * 1e6;
  if (Math.abs(uC) >= 0.095) {
    const s = uC >= 0 ? '+' : '';
    return `${s}${uC.toFixed(2)} μC`;
  }
  const nC = q * 1e9;
  const s = nC >= 0 ? '+' : '';
  return `${s}${nC.toFixed(1)} nC`;
}

export function fmtLambda(lambda) {
  const u = lambda * 1e6;
  const s = u >= 0 ? '+' : '';
  return `${s}${u.toFixed(2)} μC/m`;
}

export function fmtE(mag) {
  if (!Number.isFinite(mag)) return '—';
  const a = Math.abs(mag);
  if (a < 1e-3) return '0';
  if (a >= 1e6) return `${(mag / 1e6).toFixed(2)} MN/C`;
  if (a >= 1e3) return `${(mag / 1e3).toFixed(2)} kN/C`;
  if (a >= 1) return `${mag.toFixed(1)} N/C`;
  return `${sciText(mag)} N/C`;
}

export function fmtPhi(x) {
  if (!Number.isFinite(x)) return '—';
  return `${sciHTML(x)} N·m²/C`;
}

export function fmtPhiText(x) {
  if (!Number.isFinite(x)) return '—';
  return `${sciText(x)} N·m²/C`;
}

export function fmtForce(mag) {
  const a = Math.abs(mag);
  if (a >= 1) return `${mag.toFixed(3)} N`;
  if (a >= 1e-3) return `${(mag * 1e3).toFixed(2)} mN`;
  if (a >= 1e-6) return `${(mag * 1e6).toFixed(2)} μN`;
  return `${sciText(mag)} N`;
}

export function fmtLen(m) {
  if (Math.abs(m) >= 0.1) return `${m.toFixed(2)} m`;
  return `${(m * 100).toFixed(1)} cm`;
}

export function fmtV(v) {
  if (!Number.isFinite(v)) return '—';
  const a = Math.abs(v);
  if (a < 1e-3) return '0';
  const s = v < 0 ? '−' : '';
  const x = Math.abs(v);
  if (x >= 1e6) return `${s}${(x / 1e6).toFixed(2)} MV`;
  if (x >= 1e3) return `${s}${(x / 1e3).toFixed(2)} kV`;
  if (x >= 1) return `${s}${x.toFixed(2)} V`;
  if (x >= 1e-3) return `${s}${(x * 1e3).toFixed(2)} mV`;
  return `${s}${sciText(x)} V`;
}

export function fmtEnergy(j) {
  if (!Number.isFinite(j)) return '—';
  const a = Math.abs(j);
  const s = j < 0 ? '−' : '';
  if (a >= 1) return `${s}${a.toFixed(3)} J`;
  if (a >= 1e-3) return `${s}${(a * 1e3).toFixed(2)} mJ`;
  if (a >= 1e-6) return `${s}${(a * 1e6).toFixed(2)} μJ`;
  if (a >= 1e-9) return `${s}${(a * 1e9).toFixed(2)} nJ`;
  if (a >= 1e-12) return `${s}${(a * 1e12).toFixed(2)} pJ`;
  const eV = a / 1.6e-19;
  if (eV >= 0.1 && eV < 1e6) return `${s}${eV.toFixed(2)} eV`;
  return `${s}${sciText(a)} J`;
}

export function fmtC(c) {
  if (!Number.isFinite(c)) return '—';
  if (c >= 1e-3) return `${(c * 1e3).toFixed(2)} mF`;
  if (c >= 1e-6) return `${(c * 1e6).toFixed(2)} μF`;
  if (c >= 1e-9) return `${(c * 1e9).toFixed(2)} nF`;
  if (c >= 1e-12) return `${(c * 1e12).toFixed(2)} pF`;
  return `${sciText(c)} F`;
}

export function fmtR(r) {
  if (!Number.isFinite(r)) return '—';
  if (r >= 1e6) return `${(r / 1e6).toFixed(2)} MΩ`;
  if (r >= 1e3) return `${(r / 1e3).toFixed(2)} kΩ`;
  if (r >= 1) return `${r.toFixed(3)} Ω`;
  if (r >= 1e-3) return `${(r * 1e3).toFixed(2)} mΩ`;
  return `${sciText(r)} Ω`;
}

export function fmtI(i) {
  if (!Number.isFinite(i)) return '—';
  const s = i < 0 ? '−' : '';
  const a = Math.abs(i);
  if (a >= 1) return `${s}${a.toFixed(3)} A`;
  if (a >= 1e-3) return `${s}${(a * 1e3).toFixed(2)} mA`;
  if (a >= 1e-6) return `${s}${(a * 1e6).toFixed(2)} μA`;
  return `${s}${sciText(a)} A`;
}

export function fmtP(p) {
  if (!Number.isFinite(p)) return '—';
  const s = p < 0 ? '−' : '';
  const a = Math.abs(p);
  if (a >= 1e6) return `${s}${(a / 1e6).toFixed(2)} MW`;
  if (a >= 1e3) return `${s}${(a / 1e3).toFixed(2)} kW`;
  if (a >= 1) return `${s}${a.toFixed(2)} W`;
  if (a >= 1e-3) return `${s}${(a * 1e3).toFixed(2)} mW`;
  return `${s}${sciText(a)} W`;
}

export function signedSci(x, digits = 2) {
  if (!Number.isFinite(x)) return '—';
  if (Math.abs(x) < 1e-18) return '0';
  const sign = x < 0 ? '−' : '';
  return sign + sciHTML(Math.abs(x), digits);
}
