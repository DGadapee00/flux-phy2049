import { K } from './constants.js';
import { fieldAt } from './field.js';

/** Grounded conducting sphere, radius R, point charge q on the x-axis at x = d > R. */
export function imageGrounded(q, d, R) {
  return { q: -(R / d) * q, x: (R * R) / d };
}

/**
 * Isolated neutral sphere: image of grounded plus a compensating charge −q' at the center
 * so the sphere's net charge stays 0.
 */
export function imageIsolatedNeutral(q, d, R) {
  const g = imageGrounded(q, d, R);
  return { image: g, center: { q: -g.q, x: 0 } };
}

/** Uniform surface charge on an isolated sphere. */
export function sigmaUniform(Q, R) {
  return Q / (4 * Math.PI * R * R);
}

/**
 * Surface charge density on the (outer) sphere in direction `dir` from the center.
 * Grounded / neutral: the point charge sits on +x at distance d, so cosθ = dir.x.
 * Grounded: σ = −q(d² − R²) / [4πR (R² + d² − 2Rd cosθ)^{3/2}], which integrates to q′ = −qR/d.
 * Neutral isolated: add the uniform +qR/d spread so the total is zero.
 */
export function sigmaSphere(state, dir) {
  const { kind, R, q, d, Q, b } = state;
  if (kind === 'uniform') return Q / (4 * Math.PI * R * R);
  if (kind === 'cage') return q / (4 * Math.PI * b * b);
  const cos = dir.x / Math.hypot(dir.x, dir.y, dir.z);
  const g = (-q * (d * d - R * R)) / (4 * Math.PI * R * Math.pow(R * R + d * d - 2 * R * d * cos, 1.5));
  if (kind === 'grounded') return g;
  return g + (q * R) / d / (4 * Math.PI * R * R);
}

export function EoutsideSphere(Q, r) {
  return (K * Q) / (r * r);
}

/**
 * Build the point-charge list that reproduces E outside a sphere, and E = 0 inside the metal.
 * region: 'solid' | 'shell'
 */
export function conductorCharges(state) {
  const { kind, q, d, R, Q, a, b } = state;
  if (kind === 'uniform') {
    return [{ id: 1, q: Q, x: 0, y: 0, z: 0, virtual: true }];
  }
  if (kind === 'grounded') {
    const im = imageGrounded(q, d, R);
    return [
      { id: 1, q, x: d, y: 0, z: 0 },
      { id: 2, q: im.q, x: im.x, y: 0, z: 0, virtual: true },
    ];
  }
  if (kind === 'neutral') {
    const { image, center } = imageIsolatedNeutral(q, d, R);
    return [
      { id: 1, q, x: d, y: 0, z: 0 },
      { id: 2, q: image.q, x: image.x, y: 0, z: 0, virtual: true },
      { id: 3, q: center.q, x: 0, y: 0, z: 0, virtual: true },
    ];
  }
  if (kind === 'cage') {
    const inner = q;
    return [
      { id: 1, q: inner, x: 0, y: 0, z: 0 },
      { id: 2, q: -inner, x: 0, y: 0, z: 0, virtual: true, note: 'inner-surface' },
      { id: 3, q: inner, x: 0, y: 0, z: 0, virtual: true, note: 'outer-surface' },
    ];
  }
  return [];
}

/**
 * Exact E for the conductor scenarios. Inside the metal it is identically 0.
 * p is the probe. Sphere/shell centered at the origin.
 */
export function conductorField(state, p) {
  const r = Math.hypot(p.x, p.y, p.z);
  if (state.kind === 'uniform') {
    if (r < state.R) return { x: 0, y: 0, z: 0, region: 'metal', mag: 0 };
    const mag = EoutsideSphere(state.Q, r);
    const s = mag / r;
    return { x: s * p.x, y: s * p.y, z: s * p.z, region: 'outside', mag };
  }
  if (state.kind === 'grounded' || state.kind === 'neutral') {
    if (r < state.R) return { x: 0, y: 0, z: 0, region: 'metal', mag: 0 };
    const charges = conductorCharges(state);
    const E = fieldAt(p, charges);
    const mag = Math.hypot(E.x, E.y, E.z);
    return { ...E, region: 'outside', mag };
  }
  if (state.kind === 'cage') {
    const a = state.a;
    const b = state.b;
    if (r < a && r > 1e-6) {
      const mag = EoutsideSphere(state.q, r);
      const s = mag / r;
      return { x: s * p.x, y: s * p.y, z: s * p.z, region: 'cavity', mag };
    }
    if (r >= a && r <= b) return { x: 0, y: 0, z: 0, region: 'metal', mag: 0 };
    const mag = EoutsideSphere(state.q, r);
    const s = mag / r;
    return { x: s * p.x, y: s * p.y, z: s * p.z, region: 'outside', mag };
  }
  return { x: 0, y: 0, z: 0, region: '?', mag: 0 };
}
