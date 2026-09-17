/**
 * Authoring kit for problem templates. A template is a *generator*: variables with ranges,
 * answers computed from them, and an optional hook that loads the matching lab so the sim
 * shows the same setup. See PROBLEMS.md.
 *
 * All values inside `$` are SI. Range variables are sampled in their display unit and
 * multiplied by `si`; choice variables carry their option value.
 */
import { K, EPS0, QE, MU0 } from '../physics/constants.js';

export { K, EPS0, QE, MU0 };
export const C_LIGHT = 3.0e8; // sheet value; the EM-wave lab computes 1/√(μ₀ε₀) ≈ 2.9986×10⁸
export const ME = 9.11e-31;
export const MP = 1.67e-27;
export const G = 9.8;
export const DEG = Math.PI / 180;

// ---------- variables ----------
export const range = (min, max, step, unit = '', si = 1, opts = {}) => ({ type: 'range', min, max, step, unit, si, ...opts });
export const choice = (...opts) => ({ type: 'choice', options: opts.map(([value, label]) => ({ value, label })) });
export const SIGN = choice([1, 'positive'], [-1, 'negative']);
export const UPDOWN = choice([1, 'upward'], [-1, 'downward']);

// ---------- parts ----------
/** Numeric answer. get($) returns SI; the student answers in `unit`, i.e. SI / scale. */
export const num = (id, get, unit, o = {}) => ({
  id,
  kind: 'numeric',
  get,
  unit,
  scale: o.scale ?? 1,
  tol: o.tol ?? 0.02,
  abs: o.abs ?? 0,
  wrap: o.wrap ?? 0, // 360 for direction angles: −30° and 330° are the same answer
  label: o.label ?? null,
});

/** Multiple choice. `correct` is an option value, an array (multi-select), or a function of $. */
export const mc = (id, options, correct, o = {}) => ({
  id,
  kind: 'choice',
  options: options.map(([value, label]) => ({ value, label })),
  correct,
  multi: !!o.multi,
  label: o.label ?? null,
});

export const tf = (id, correct, o = {}) => mc(id, [[1, 'True'], [0, 'False']], correct ? 1 : 0, o);

/**
 * Symbolic answer typed by the student, e.g. "2k*lam/R".
 * expr uses the engine's parser; `vars` are the symbols the student may use (plus k, eps0, mu0, pi).
 * `alias` maps typed Greek letters to symbol names (λ → lam). The check script confirms that
 * expr, evaluated with $, equals `get($)`.
 */
export const sym = (id, expr, vars, get, o = {}) => ({
  id,
  kind: 'symbolic',
  expr,
  vars,
  get,
  alias: o.alias ?? {},
  label: o.label ?? null,
});

/** Free response (sketches, derivation setup). Graded by the student against the rubric. */
export const self = (id, prompt, rubric) => ({ id, kind: 'self', label: prompt, rubric });

// ---------- common option sets ----------
export const DIR_X = [
  [1, '+x direction'],
  [-1, '−x direction'],
  [0, 'Zero (no direction)'],
];
export const RADIAL = [
  [1, 'Radially outward'],
  [-1, 'Radially inward'],
  [0, 'Zero field'],
];
export const POSNEG = [
  [1, 'Positive'],
  [-1, 'Negative'],
];
export const AXES6 = [
  [1, '+x'],
  [-1, '−x'],
  [2, '+y'],
  [-2, '−y'],
  [3, '+z'],
  [-3, '−z'],
  [0, 'Zero'],
];
/** Map a vector to the AXES6 code of its dominant component (0 if ~zero). */
export function axisCode(v) {
  const a = [Math.abs(v.x), Math.abs(v.y), Math.abs(v.z)];
  const m = Math.max(...a);
  if (m < 1e-30) return 0;
  const i = a.indexOf(m);
  return (i + 1) * Math.sign([v.x, v.y, v.z][i]);
}

// ---------- template ----------
export function problem(spec) {
  return {
    level: 1,
    topics: [],
    vars: {},
    derive: () => ({}),
    valid: () => true,
    hints: [],
    steps: () => [],
    sim: null,
    cases: [],
    ...spec,
  };
}

/** A worked instance, usually the worksheet's own numbers. want: partId → expected (display units). */
export const kase = (src, v, want, o = {}) => ({ src, v, want, key: o.key ?? null, note: o.note ?? null });

// ---------- sim helpers ----------
let uid = 5000;
/** Charge in the shape the charge-based labs use (ids far above scenarios.js' counter). */
export const charge = (q, x, y, z = 0, extra = {}) => ({ id: ++uid, q, x, y, z, ...extra });

/**
 * Scale a layout into the scene (~±maxR m) without changing the answer at the probe:
 * positions × s, charges × s^p, where p = 2 keeps E at the probe and p = 1 keeps V
 * (and the force between charges, keep: 'F'). Returns { s, charges, probe }.
 */
export function fitLayout(charges, probe, { maxR = 0.85, keep = 'E' } = {}) {
  const pts = [...charges, probe].filter(Boolean);
  const ext = Math.max(1e-9, ...pts.map((p) => Math.max(Math.abs(p.x), Math.abs(p.y), Math.abs(p.z || 0))));
  const s = Math.min(50, Math.max(1e-3, maxR / ext));
  const p = keep === 'E' ? 2 : 1;
  return {
    s,
    charges: charges.map((c) => ({ ...c, x: c.x * s, y: c.y * s, z: (c.z || 0) * s, q: c.q * s ** p })),
    probe: probe ? { x: probe.x * s, y: probe.y * s, z: (probe.z || 0) * s } : null,
  };
}

export const mag = (v) => Math.hypot(v.x, v.y, v.z || 0);
export const angleDeg = (x, y) => ((Math.atan2(y, x) * 180) / Math.PI + 360) % 360;
