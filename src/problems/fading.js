/**
 * Fading worked examples (Renkl & Atkinson): for someone new to a chapter, studying a worked
 * example and then solving a problem like it teaches more than solving cold. As they get problems
 * right, the help is withdrawn a step at a time, from the end (backward fading), until they work
 * alone. No DOM; the panel renders what this decides.
 *
 *   level 'example' — nothing in the chapter solved yet: a complete worked example of the same
 *                     template with different numbers, then the student's own problem.
 *   level 'faded'   — the first `shown` steps of the student's own solution are worked; the rest
 *                     are theirs. Each problem solved in the chapter hides one more step.
 *   null            — working alone: the chapter is under their belt, or this template is.
 *
 * "Solved" here means right on the first check without hints, peeking or a missed principle,
 * whether or not an example was on screen: the fading is about readiness, not about grading.
 * Only numeric and derivation problems take part — a worked example of a multiple-choice question
 * with other numbers would all but give its answer away.
 */
import { instance, render } from './engine.js';

const GUIDED_KINDS = new Set(['numeric', 'derivation']);

/** How many of a chapter's working problems this student has solved right first time. */
export function chapterSkill(templates, progress, ch) {
  return templates.filter((t) => t.ch === ch && GUIDED_KINDS.has(t.kind) && solvedRight(progress.get(t.id))).length;
}

const solvedRight = (it) => !!it && ((it.clean || 0) > 0 || (it.gOk || 0) > 0);

/** A different seed for the worked example, one whose numbers are not the student's. */
export function exampleSeed(tpl, seed) {
  const mine = JSON.stringify(instance(tpl, seed).$);
  for (let k = 1; k <= 12; k++) {
    const s = ((seed + 7919 * k) % 99991) + 1;
    try {
      if (JSON.stringify(instance(tpl, s).$) !== mine) return s;
    } catch {
      /* an invalid draw: try the next */
    }
  }
  return null;
}

/**
 * What help this attempt gets. `steps` is the length of the template's worked solution for this
 * instance; `again` marks "same problem, new numbers" straight after seeing its solution.
 */
export function guidanceFor(tpl, progress, { templates, seed, steps, again = false }) {
  if (again || !GUIDED_KINDS.has(tpl.kind) || !steps) return null;
  if (solvedRight(progress.get(tpl.id))) return null;
  const skill = chapterSkill(templates, progress, tpl.ch);
  if (skill === 0) {
    const ex = exampleSeed(tpl, seed);
    if (ex == null) return null;
    return { level: 'example', exampleSeed: ex, skill };
  }
  const shown = steps - skill;
  return shown >= 1 ? { level: 'faded', shown, of: steps, skill } : null;
}

/** The worked example itself: its statement and steps, with the example's own numbers. */
export function workedExample(tpl, seed) {
  const view = render(instance(tpl, seed));
  return { text: view.text, steps: view.steps };
}
