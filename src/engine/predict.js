/**
 * Predict first, the part without a DOM: run a prediction prompt (src/data/predictions.js)
 * through a lab's own physics and say what happened, so the panel and the checker grade the same
 * way. The lab's recompute runs on copies of its state with a stand-in scene, the way
 * problems-check runs problems, so measuring never touches what is on screen.
 */
import { headlessCtx } from '../problems/simbridge.js';

export const DEFAULT_FACTORS = [4, 2, 1, 0.5, 0.25];
const DEFAULT_TOL = 0.005;

export function cloneState(s) {
  try {
    return structuredClone(s);
  } catch {
    return JSON.parse(JSON.stringify(s));
  }
}

/** The watched quantities for a lab state. */
export function measure(lab, state, watch) {
  const s = cloneState(state);
  const c = {};
  lab.recompute(s, c, headlessCtx());
  return Object.fromEntries(watch.map((w) => [w.id, w.get(c, s)]));
}

/** Before and after the prompt's change, from the state as it stands (prep already applied). */
export function run(lab, state, prompt) {
  const before = measure(lab, state, prompt.watch);
  const next = cloneState(state);
  prompt.apply(next);
  const after = measure(lab, next, prompt.watch);
  return { before, after };
}

const near = (a, b, tol) => Math.abs(a - b) <= tol * Math.max(Math.abs(a), Math.abs(b)) || Math.max(Math.abs(a), Math.abs(b)) < 1e-40;

/** What actually happened to one watched quantity, in the prompt's answer vocabulary (null: none fits). */
export function outcome(prompt, w, before, after) {
  const tol = prompt.tol ?? DEFAULT_TOL;
  const mode = w.mode || prompt.mode;
  if (mode === 'bool') return !!after;
  const b = w.signed ? before : Math.abs(before);
  const a = w.signed ? after : Math.abs(after);
  if (mode === 'factor') {
    const factors = prompt.factors || DEFAULT_FACTORS;
    if (Math.abs(b) < 1e-40) return null;
    const r = a / b;
    let best = null;
    for (const f of factors) {
      const ok = f === 0 ? Math.abs(r) < Math.max(tol, 1e-3) : Math.sign(r) === Math.sign(f) && Math.abs(Math.log(r / f)) <= Math.log(1 + Math.max(tol, 0.005));
      if (ok) best = f;
    }
    return best;
  }
  if (near(a, b, tol)) return 'same';
  return a > b ? 'bigger' : 'smaller';
}

export function outcomes(prompt, before, after) {
  return Object.fromEntries(prompt.watch.map((w) => [w.id, outcome(prompt, w, before[w.id], after[w.id])]));
}

/** The choices offered for a watched quantity, as [value, label]. */
export function choices(prompt, w) {
  const mode = w?.mode || prompt.mode;
  if (mode === 'bool') return [[true, 'Yes'], [false, 'No']];
  if (mode === 'factor') return (prompt.factors || DEFAULT_FACTORS).map((f) => [f, factorLabel(f)]);
  return [['bigger', 'Bigger'], ['same', 'Same'], ['smaller', 'Smaller']];
}

export function factorLabel(f) {
  const frac = Math.abs(f - 1 / 3) < 1e-9 ? '⅓' : { 0.5: '½', 0.25: '¼', '-0.5': '−½' }[f];
  if (frac) return `×${frac}`;
  if (f === 0) return '→ 0';
  return `×${String(f).replace('-', '−')}`;
}

/** Whether the prompt's worked reasoning applies: the lab did what `expect` says. */
export const matchesExpect = (prompt, got) => prompt.watch.every((w) => got[w.id] === prompt.expect[w.id]);
