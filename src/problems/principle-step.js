/**
 * The principle step: before working a problem, the student names the law that decides it.
 *
 * Experts file problems by principle, novices by surface (Chi, Feltovich & Glaser). Asking for
 * the principle first — and grading it — makes that choice a retrieval act of its own instead of
 * something the chapter heading gives away. No DOM; the panel (src/ui/problems.js) renders it.
 *
 * The four options are the template's primary principle and three that a student plausibly
 * confuses with it. A template's secondary principles are never offered: they are also true of
 * the problem, so picking one would be marked wrong for being half right. Nor is a near-twin
 * of the primary (TWINS).
 */
import { PRINCIPLES } from './principles.js';
import { rng, hashSeed } from './engine.js';

/** Principles that get mistaken for each other, most tempting first. */
const CONFUSED = {
  charge: ['energy', 'conductor', 'ohm', 'capacitance', 'superposition'],
  energy: ['newton', 'potential', 'power', 'field-force', 'charge'],
  coulomb: ['field-force', 'superposition', 'gauss', 'potential', 'newton'],
  superposition: ['coulomb', 'gauss', 'field-force', 'potential', 'vectors'],
  'field-force': ['coulomb', 'newton', 'potential', 'lorentz', 'superposition'],
  newton: ['energy', 'field-force', 'lorentz', 'coulomb', 'potential'],
  gauss: ['superposition', 'coulomb', 'conductor', 'ampere', 'potential'],
  conductor: ['gauss', 'charge', 'potential', 'capacitance', 'superposition'],
  potential: ['energy', 'field-force', 'superposition', 'capacitance', 'coulomb'],
  capacitance: ['potential', 'energy', 'charge', 'conductor', 'gauss'],
  ohm: ['power', 'energy', 'charge', 'capacitance', 'potential'],
  power: ['ohm', 'energy', 'wave-energy', 'charge', 'potential'],
  lorentz: ['newton', 'biot-savart', 'field-force', 'faraday', 'ampere'],
  'biot-savart': ['ampere', 'lorentz', 'superposition', 'faraday', 'magnetism'],
  ampere: ['biot-savart', 'gauss', 'faraday', 'lorentz', 'superposition'],
  magnetism: ['lorentz', 'biot-savart', 'faraday', 'conductor', 'ampere'],
  faraday: ['lorentz', 'inductance', 'ampere', 'energy', 'biot-savart'],
  inductance: ['faraday', 'ac', 'capacitance', 'energy', 'ampere'],
  ac: ['inductance', 'capacitance', 'ohm', 'power', 'faraday'],
  'em-wave': ['wave-energy', 'refraction', 'interference', 'polarization', 'faraday'],
  'wave-energy': ['em-wave', 'power', 'polarization', 'energy', 'newton'],
  polarization: ['wave-energy', 'em-wave', 'refraction', 'reflection', 'interference'],
  refraction: ['reflection', 'imaging', 'interference', 'em-wave', 'polarization'],
  reflection: ['refraction', 'imaging', 'interference', 'polarization', 'em-wave'],
  imaging: ['refraction', 'reflection', 'interference', 'em-wave', 'polarization'],
  interference: ['refraction', 'em-wave', 'imaging', 'polarization', 'reflection'],
};

/**
 * Pairs too close to use as each other's distractor: one is a special case or a restatement of
 * the other (U = qV; P = IV with V = IR; self-induction is Faraday's law; a lens images by
 * refraction). Marking a student wrong for picking the near-twin would punish sound reasoning.
 */
const TWINS = [
  ['energy', 'potential'],
  ['ohm', 'power'],
  ['faraday', 'inductance'],
  ['ac', 'capacitance'],
  ['ac', 'inductance'],
  ['imaging', 'refraction'],
  ['imaging', 'reflection'],
];
const twins = (a, b) => TWINS.some(([x, y]) => (x === a && y === b) || (x === b && y === a));

/** The value the "not sure" option carries. It is graded like a wrong pick. */
export const UNSURE = '?';

export const primaryOf = (tpl) => tpl.principles?.[0] || null;

/**
 * Whether a template gets the step. Not for the tool-kit entries (vector algebra, charge density):
 * "which principle decides this vector sum?" has one honest answer and teaches nothing.
 */
export function asksPrinciple(tpl) {
  const p = primaryOf(tpl);
  return !!p && !!PRINCIPLES[p] && PRINCIPLES[p].family !== 'Tools' && !!CONFUSED[p];
}

/** Four principle ids in a seeded order: the primary and three distractors. */
export function principleOptions(tpl, seed = 0) {
  const primary = primaryOf(tpl);
  const tags = new Set(tpl.principles);
  const rand = rng((hashSeed(tpl.id) ^ (seed * 2654435761)) >>> 0);
  const usable = (id) => !tags.has(id) && !twins(id, primary) && PRINCIPLES[id] && PRINCIPLES[id].family !== 'Tools';
  // The three most tempting that aren't also true of this problem, one of them sometimes swapped
  // for a less obvious one so the same three don't always travel together.
  const near = (CONFUSED[primary] || []).filter(usable);
  const picks = near.slice(0, 3);
  if (near.length > 3 && rand() < 0.5) picks[2] = near[3 + Math.floor(rand() * (near.length - 3))];
  const family = PRINCIPLES[primary].family;
  const rest = Object.keys(PRINCIPLES).filter((id) => usable(id) && !picks.includes(id) && id !== primary);
  rest.sort((a, b) => (PRINCIPLES[b].family === family) - (PRINCIPLES[a].family === family) || rand() - 0.5);
  while (picks.length < 3 && rest.length) picks.push(rest.shift());
  const out = [primary, ...picks];
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

export function gradePrinciple(tpl, pick) {
  return pick === primaryOf(tpl);
}
