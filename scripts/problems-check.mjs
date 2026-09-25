#!/usr/bin/env node
/**
 * Problem-bank check (no browser):
 *   node scripts/problems-check.mjs [--samples N] [--only idPrefix] [--list]
 *
 * For every template:
 *   1. worked cases reproduce their expected answers (the worksheet key where one exists)
 *   2. N seeded samples satisfy valid(), give finite answers, and give choice answers that are options
 *   3. text, labels, steps render without throwing or printing "undefined"/"NaN"
 *   4. symbolic keys equal get($); the grader accepts the key and rejects a perturbed one
 *   5. sim agreement: load the instance into the real lab (applyProblem), run lab.recompute
 *      headless, and compare sim.read(...) with the problem's own answers
 */
import { PROBLEMS, CHAPTER_ORDER, CHAPTER_TITLES, problemsForExam } from '../src/problems/index.js';
import { createProgress, memoryStorage, pickSet, pickInterleave, INTERVAL_DAYS } from '../src/problems/progress.js';
import { build, instance, render, expected, withinTol, evalSymbolic, gradeSymbolic, grade, parseNumber, parseExpr, dimensionOf , exprToTex, choiceOptions } from '../src/problems/engine.js';
import { parseUnit, dimEqual, formatDim } from '../src/physics/units.js';
import { applyProblem, headlessCtx } from '../src/problems/simbridge.js';
import { mathProse } from '../src/ui/shared.js';
import { loadLab } from '../src/labs/load.js';
import { LAB_META, EXAMS } from '../src/data/catalog.js';
import { SEQUENCE } from '../src/problems/sequence.js';
import COACHING from '../src/problems/coaching/index.js';
import { PRINCIPLES, PRINCIPLE_TAGS } from '../src/problems/principles.js';
import { asksPrinciple, principleOptions, primaryOf } from '../src/problems/principle-step.js';
import { PREDICTIONS } from '../src/data/predictions.js';
import { guidanceFor, chapterSkill, exampleSeed, workedExample } from '../src/problems/fading.js';
import { run as runPrediction, outcomes as predictionOutcomes, choices as predictionChoices } from '../src/engine/predict.js';
import { applyScenario } from '../src/data/scenarios.js';

const args = process.argv.slice(2);
const opt = (name, dflt) => {
  const i = args.indexOf(name);
  return i >= 0 ? args[i + 1] : dflt;
};
const SAMPLES = Number(opt('--samples', 60));
const ONLY = opt('--only', '');


const errors = [];
const notes = [];
let simChecks = 0;
const err = (id, msg) => errors.push(`${id}: ${msg}`);

function checkRender(tpl, inst) {
  const r = render(inst);
  if (r.figure != null && (!/^<svg[\s>]/.test(r.figure) || /undefined|NaN/.test(r.figure))) err(tpl.id, 'figure is not clean SVG markup');
  const strings = [r.text, ...r.parts.map((p) => `${p.label ?? ''} ${(p.options || []).map((o) => o.label).join(' ')} ${p.rubric ?? ''}`), ...r.parts.flatMap((p) => (p.options || []).map((o) => o.why || '')), ...r.steps, ...r.hints];
  const blob = strings.join('\n');
  if (/undefined|NaN|\[object/.test(blob)) err(tpl.id, `rendered text contains undefined/NaN:\n${blob.slice(0, 300)}`);
  // The panel typesets `$…$` (src/ui/shared.js); KaTeX marks what it cannot parse instead of throwing.
  for (const s of strings) {
    const html = mathProse(s);
    if (html.includes('katex-error')) err(tpl.id, `KaTeX cannot parse this: ${s}`);
  }
}

function checkAnswers(tpl, inst, label) {
  for (const p of tpl.parts) {
    const want = expected(p, inst.$);
    if (p.kind === 'numeric' && !Number.isFinite(want)) err(tpl.id, `${label} part ${p.id} not finite (${JSON.stringify(inst.values)})`);
    if (p.kind === 'choice') {
      const list = choiceOptions(p, inst.$);
      const opts = new Set(list.map((o) => o.value));
      for (const w of [].concat(want)) if (!opts.has(w)) err(tpl.id, `${label} part ${p.id} answer ${w} not among options (${JSON.stringify(inst.values)})`);
      // One list per question: no option offered twice, and at least one wrong answer to rule out.
      if (opts.size !== list.length) err(tpl.id, `${label} part ${p.id} offers the same option value twice`);
      const labels = list.map((o) => (typeof o.label === 'function' ? o.label(inst.T, inst.$) : o.label));
      if (new Set(labels).size !== labels.length) err(tpl.id, `${label} part ${p.id} offers the same option text twice`);
      if (list.length < 2) err(tpl.id, `${label} part ${p.id} has fewer than two options`);
    }
    if (p.kind === 'symbolic') {
      const a = evalSymbolic(p, inst.$);
      const b = p.get(inst.$);
      if (!(Math.abs(a - b) <= 1e-9 * Math.max(1, Math.abs(b)))) err(tpl.id, `${label} symbolic ${p.id}: key gives ${a}, get() gives ${b}`);
      // The key has to come out in the unit the part claims — the same check the student does by hand.
      if (p.unit && p.units) {
        try {
          const got = dimensionOf(parseExpr(p.expr, p.vars, p.alias), p.units);
          if (!dimEqual(got, parseUnit(p.unit))) {
            err(tpl.id, `symbolic ${p.id}: the key is in ${formatDim(got)}, but the part says ${p.unit}`);
          }
        } catch (e) {
          err(tpl.id, `symbolic ${p.id}: units — ${e.message}`);
        }
      } else if (p.unit || p.units) {
        err(tpl.id, `symbolic ${p.id}: declare both the symbol units and the answer unit, or neither`);
      }
    }
  }
}

async function checkSim(tpl, inst, label) {
  if (!tpl.sim) return;
  const lab = await loadLab(tpl.lab);
  if (!lab) return err(tpl.id, `unknown lab ${tpl.lab}`);
  const slice = lab.defaultState();
  applyProblem(lab, slice, inst);
  if (!tpl.sim.read) return;
  const computed = {};
  const ctx = headlessCtx();
  lab.recompute(slice, computed, ctx);
  const got = tpl.sim.read(computed, slice, inst.$);
  for (const [key, val] of Object.entries(got)) {
    simChecks++;
    if (key.startsWith('@')) {
      const [g, w] = val;
      if (!(Math.abs(g - w) <= Math.max(1e-3, 0.02 * Math.abs(w)))) err(tpl.id, `${label} sim ${key}: ${g} vs ${w} (${JSON.stringify(inst.values)})`);
      continue;
    }
    const part = tpl.parts.find((p) => p.id === key);
    if (!part) {
      err(tpl.id, `sim.read returned unknown part ${key}`);
      continue;
    }
    if (part.kind === 'choice') {
      const want = expected(part, inst.$);
      // A select-all part answers with a list: same members, in any order.
      const same = (a) => JSON.stringify([].concat(a).sort());
      if (same(val) !== same(want)) err(tpl.id, `${label} sim ${key}: lab says ${val}, problem says ${want} (${JSON.stringify(inst.values)})`);
    } else {
      const want = part.get(inst.$);
      const p2 = { ...part, abs: (part.abs ?? 0) * (part.scale ?? 1) };
      if (!withinTol(val, want, p2)) err(tpl.id, `${label} sim ${key}: lab ${val.toPrecision(5)} vs problem ${want.toPrecision(5)} (${JSON.stringify(inst.values)})`);
    }
  }
}

const seen = new Set();
const labsUsed = {};
for (const tpl of PROBLEMS) {
  if (ONLY && !tpl.id.startsWith(ONLY)) continue;
  if (seen.has(tpl.id)) err(tpl.id, 'duplicate id');
  seen.add(tpl.id);
  if (!EXAMS.some((e) => e.id === tpl.exam)) err(tpl.id, `unknown exam ${tpl.exam}`);
  if (tpl.lab && !LAB_META[tpl.lab]) err(tpl.id, `unknown lab ${tpl.lab}`);
  if (tpl.lab && LAB_META[tpl.lab] && LAB_META[tpl.lab].exam !== tpl.exam) notes.push(`${tpl.id}: lives in exam ${tpl.exam} but uses lab ${tpl.lab} (${LAB_META[tpl.lab].exam})`);
  if (!CHAPTER_ORDER.includes(tpl.ch)) err(tpl.id, `unknown chapter ${tpl.ch}`);
  if (!CHAPTER_TITLES[tpl.ch]) err(tpl.id, `chapter ${tpl.ch} has no title`);
  if (tpl.sim && !tpl.lab) err(tpl.id, 'sim without lab');
  if (!tpl.cases.length) err(tpl.id, 'no worked case');
  labsUsed[tpl.lab || '(none)'] = (labsUsed[tpl.lab || '(none)'] || 0) + 1;

  // 1. worked cases
  for (const c of tpl.cases) {
    let inst;
    try {
      inst = build(tpl, c.v);
    } catch (e) {
      err(tpl.id, `case ${c.src}: ${e.message}`);
      continue;
    }
    if (!tpl.valid(inst.$)) err(tpl.id, `case ${c.src} fails valid()`);
    for (const [pid, want] of Object.entries(c.want)) {
      const part = tpl.parts.find((p) => p.id === pid);
      if (!part) {
        err(tpl.id, `case ${c.src}: no part ${pid}`);
        continue;
      }
      const got = expected(part, inst.$);
      const ok =
        part.kind === 'numeric'
          ? withinTol(got, want, { tol: 0.01, abs: Math.max(part.abs ?? 0, 1e-9) })
          : JSON.stringify([].concat(got).sort()) === JSON.stringify([].concat(want).sort());
      if (!ok) err(tpl.id, `case ${c.src} part ${pid}: got ${typeof got === 'number' ? got.toPrecision(5) : JSON.stringify(got)}, expected ${JSON.stringify(want)}`);
      // the grader must accept the expected value as typed by a student
      if (part.kind === 'numeric' && !grade(part, inst.$, String(want)).correct && withinTol(got, want, { tol: 0.01, abs: part.abs ?? 0 })) {
        err(tpl.id, `case ${c.src} part ${pid}: grader rejects ${want}`);
      }
    }
    if (c.note) notes.push(`${tpl.id} [${c.src}] ${c.note}`);
    checkAnswers(tpl, inst, `case ${c.src}`);
    checkRender(tpl, inst);
    try {
      await checkSim(tpl, inst, `case ${c.src}`);
    } catch (e) {
      err(tpl.id, `case ${c.src} sim threw: ${e.stack.split('\n').slice(0, 3).join(' | ')}`);
    }
  }

  // 2–5. random samples
  const n = Object.keys(tpl.vars).length ? SAMPLES : 1;
  for (let seed = 1; seed <= n; seed++) {
    let inst;
    try {
      inst = instance(tpl, seed);
    } catch (e) {
      err(tpl.id, e.message);
      break;
    }
    checkAnswers(tpl, inst, `seed ${seed}`);
    try {
      checkRender(tpl, inst);
    } catch (e) {
      err(tpl.id, `render threw: ${e.message}`);
    }
    if (seed <= 3) {
      for (const p of tpl.parts.filter((q) => q.kind === 'symbolic')) {
        if (!gradeSymbolic(p, p.expr).correct) err(tpl.id, `grader rejects its own key for ${p.id}`);
        if (gradeSymbolic(p, `(${p.expr})*1.1`).correct) err(tpl.id, `grader accepts a wrong answer for ${p.id}`);
      }
    }
    try {
      await checkSim(tpl, inst, `seed ${seed}`);
    } catch (e) {
      err(tpl.id, `seed ${seed} sim threw: ${e.stack.split('\n').slice(0, 3).join(' | ')}`);
      break;
    }
  }
}

// grader self-test
for (const [s, v] of [
  ['2.52e7', 2.52e7], ['2.52x10^7', 2.52e7], ['2.52 × 10^-7', 2.52e-7], ['−3', -3], ['1/2', 0.5], ['2.5×10⁻⁶', 2.5e-6],
  // students type units and spaces; the unit is ignored, never misread as part of the number
  ['2.5 A', 2.5], ['3.3e-5 C/m²', 3.3e-5], ['1.6 × 10^-19 C', 1.6e-19], ['5e13 electrons', 5e13], ['$20.25', 20.25], ['-30 °', -30],
]) {
  if (parseNumber(s) !== v) err('engine', `parseNumber(${s}) = ${parseNumber(s)}`);
}
if (!Number.isNaN(parseNumber('abc'))) err('engine', 'parseNumber accepts text');

// A chapter's learning path must name each of its templates exactly once, and nothing else.
for (const [ch, stages] of Object.entries(SEQUENCE)) {
  const listed = stages.flatMap(([, ids]) => ids);
  const inBank = PROBLEMS.filter((p) => p.ch === ch).map((p) => p.id);
  for (const id of listed) if (!inBank.includes(id)) err('sequence', `Ch ${ch} lists ${id}, which is not a Ch ${ch} template`);
  for (const id of inBank) if (!listed.includes(id)) err('sequence', `Ch ${ch} leaves out ${id}`);
  const dup = listed.filter((id, i) => listed.indexOf(id) !== i);
  if (dup.length) err('sequence', `Ch ${ch} lists ${dup.join(', ')} twice`);
}
{
  const angle = { kind: 'numeric', get: () => 330, scale: 1, tol: 0.005, abs: 0.6, wrap: 360, unit: '°' };
  if (!grade(angle, {}, '-30').correct) err('engine', 'wrapped angle: −30° should equal 330°');
  if (grade(angle, {}, '150').correct) err('engine', 'wrapped angle: 150° accepted for 330°');
  const plain = { kind: 'numeric', get: () => 2.5e-6, scale: 1, tol: 0.02, abs: 0, unit: 'C' };
  if (!/10\^3/.test(grade(plain, {}, '2.5e-3').feedback)) err('engine', 'power-of-ten feedback missing');
  if (!/sign/.test(grade(plain, {}, '-2.5e-6').feedback)) err('engine', 'wrong-sign feedback missing');
}

// practice progress: spaced review and set picking
{
  const p = createProgress(memoryStorage());
  const t0 = Date.parse('2026-09-01T12:00:00Z');
  const DAY = 864e5;
  let it = p.record('e2.36a.collinear', { correct: true, clean: true, now: t0 });
  if (it.box !== 1 || it.due !== t0 + INTERVAL_DAYS[1] * DAY) err('progress', `clean solve should move to box 1, due in ${INTERVAL_DAYS[1]} day(s)`);
  it = p.record('e2.36a.collinear', { correct: true, clean: true, now: t0 + DAY });
  if (it.box !== 2) err('progress', 'second clean solve should reach box 2');
  it = p.record('e2.36a.collinear', { correct: true, clean: false, hints: 1, now: t0 + 2 * DAY });
  if (it.box !== 1) err('progress', 'solving with help should drop one box');
  it = p.record('e2.36a.collinear', { correct: false, revealed: true, now: t0 + 3 * DAY });
  if (it.box !== 0 || p.status('e2.36a.collinear', t0 + 3 * DAY) !== 'missed') err('progress', 'a miss should reset to box 0 and show as missed');
  if (p.dueIds(['e2.36a.collinear', 'e2.36a.dipole'], t0 + 4 * DAY).join() !== 'e2.36a.collinear') err('progress', 'dueIds should list only seen, overdue problems');
  if (p.nextSeed('e2.36a.dipole') !== 0 || p.nextSeed('e2.36a.collinear') === 0) err('progress', 'first attempt uses the worksheet (seed 0), later ones fresh numbers');

  for (const exam of ['e1', 'e2', 'e3', 'e4', 'e5', 'e6', 'e7', 'wave']) {
    const tpls = problemsForExam(exam);
    const n = Math.min(8, tpls.length);
    const a = pickSet(tpls, p, { n, seed: 42 });
    const b = pickSet(tpls, p, { n, seed: 42 });
    const chapters = new Set(tpls.map((t) => t.ch));
    if (a.length !== n) err('pickSet', `${exam}: picked ${a.length} of ${n}`);
    if (new Set(a.map((t) => t.id)).size !== a.length) err('pickSet', `${exam}: duplicate problem`);
    if (a.map((t) => t.id).join() !== b.map((t) => t.id).join()) err('pickSet', `${exam}: same seed gave different sets`);
    // Coverage and the conceptual cap must hold for every shuffle, not just one lucky seed.
    for (let seed = 0; seed < 200; seed++) {
      const s = pickSet(tpls, p, { n, seed });
      if (new Set(s.map((t) => t.ch)).size < Math.min(n, chapters.size)) {
        err('pickSet', `${exam}: set skips chapters it had room for (seed ${seed})`);
        break;
      }
      if (s.filter((t) => t.kind === 'conceptual').length > Math.max(1, Math.floor(n * 0.25))) {
        err('pickSet', `${exam}: too many conceptual problems (seed ${seed})`);
        break;
      }
    }
  }
}

/*
 * Every reference formula must render. The practice panel typesets what the parser understood, so
 * an expression the emitter cannot handle would leave a student staring at a blank preview with no
 * way to tell whether their formula was read correctly.
 */
for (const tpl of PROBLEMS) {
  for (const part of tpl.parts.filter((p) => p.kind === 'symbolic')) {
    const t = exprToTex(part.expr, part.vars, part.alias);
    if (!t) err(tpl.id, `symbolic ${part.id}: "${part.expr}" does not render to TeX`);
    else if (/undefined|NaN/.test(t)) err(tpl.id, `symbolic ${part.id}: TeX came out as "${t}"`);
  }
}

/*
 * Coaching (src/problems/coaching/) is keyed by id, part and option value, so a typo would simply
 * never show. Every key must name something real, and a "why" must belong to an option that is
 * wrong in at least one version — an explanation of why the right answer is wrong helps no one.
 */
for (const [id, c] of Object.entries(COACHING)) {
  const tpl = PROBLEMS.find((t) => t.id === id);
  if (!tpl) {
    err(id, 'coaching names a template that does not exist');
    continue;
  }
  if (c.hints && !Array.isArray(c.hints)) err(id, 'coaching hints must be a list');
  for (const [pid, whys] of Object.entries(c.why || {})) {
    const part = tpl.parts.find((p) => p.id === pid);
    if (!part || part.kind !== 'choice') {
      err(id, `coaching why: no choice part "${pid}"`);
      continue;
    }
    const seenVals = new Set();
    const wrongSomewhere = new Set();
    for (let sd = 0; sd < 40; sd++) {
      let inst;
      try {
        inst = instance(tpl, sd);
      } catch {
        continue;
      }
      const want = [].concat(expected(part, inst.$));
      for (const o of choiceOptions(part, inst.$)) {
        seenVals.add(String(o.value));
        if (!want.includes(o.value)) wrongSomewhere.add(String(o.value));
      }
    }
    for (const v of Object.keys(whys)) {
      if (!seenVals.has(v)) err(id, `coaching why ${pid}: no option with value ${v}`);
      else if (!wrongSomewhere.has(v)) err(id, `coaching why ${pid}: option ${v} is right in every version`);
    }
  }
}

/*
 * Principle tags (src/problems/principles.js) are still a draft for the instructor, but they must
 * stay complete: every template tagged, every tag a defined principle, no tags for ids that are gone.
 */
for (const t of PROBLEMS) {
  const tags = PRINCIPLE_TAGS[t.id];
  if (!tags || !tags.length) err(t.id, 'no principle tags');
  else {
    for (const g of tags) if (!PRINCIPLES[g]) err(t.id, `principle "${g}" is not defined`);
    if (new Set(tags).size !== tags.length) err(t.id, 'principle listed twice');
    if (tags.length > 3) err(t.id, 'more than one primary and two secondary principles');
  }
}
for (const id of Object.keys(PRINCIPLE_TAGS)) if (!PROBLEMS.some((t) => t.id === id)) err(id, 'principle tags name a template that does not exist');
for (const g of Object.keys(PRINCIPLES)) if (!Object.values(PRINCIPLE_TAGS).some((tags) => tags.includes(g))) err(g, 'principle is never used');

/*
 * The principle step: four distinct defined principles, the primary among them, none of the
 * template's secondary principles (those are also true, so offering one would mark a half-right
 * answer wrong), and the same four for the same seed.
 */
let stepped = 0;
for (const t of PROBLEMS) {
  if (t.principles !== PRINCIPLE_TAGS[t.id]) err(t.id, 'principle tags not folded into the template');
  if (!asksPrinciple(t)) continue;
  stepped++;
  for (const seed of [0, 1, 2, 7, 12345]) {
    const o = principleOptions(t, seed);
    if (o.length !== 4 || new Set(o).size !== 4) err(t.id, `principle step: options ${o.join(',')} are not four distinct`);
    if (!o.includes(primaryOf(t))) err(t.id, 'principle step: primary not offered');
    if (o.some((id) => id !== primaryOf(t) && t.principles.includes(id))) err(t.id, 'principle step: offers a secondary principle as a distractor');
    if (o.some((id) => !PRINCIPLES[id])) err(t.id, 'principle step: undefined option');
    if (o.join() !== principleOptions(t, seed).join()) err(t.id, 'principle step: same seed, different options');
  }
}
if (stepped < PROBLEMS.length * 0.9) err('principle step', `only ${stepped} of ${PROBLEMS.length} templates get it`);

/*
 * Interleaving: only earlier chapters, only problems already met, the most overdue first, then
 * the weakest not tried in the last half day; nothing when nothing earlier qualifies.
 */
{
  const DAY = 864e5;
  const now = 100 * DAY;
  const p = createProgress(memoryStorage());
  const tpl = (id) => PROBLEMS.find((t) => t.id === id);
  const e3 = PROBLEMS.filter((t) => t.ch === '38' && !t.enrichment);
  const e4 = PROBLEMS.filter((t) => t.ch === '43' && !t.enrichment);
  const pool = PROBLEMS.filter((t) => !t.enrichment);
  if (pickInterleave(pool, p, { ch: '43', now })) err('interleave', 'picked something with no history');
  p.record(e4[0].id, { correct: false, seed: 1, now: now - 3 * DAY });
  if (pickInterleave(pool, p, { ch: '43', now })) err('interleave', 'picked from the same chapter');
  p.record(e3[0].id, { correct: true, clean: true, seed: 1, now: now - 2 * DAY }); // box 1, due after 1 day: overdue by 1 day
  p.record(e3[1].id, { correct: false, seed: 1, now: now - 5 * DAY }); // box 0: overdue by ~5 days
  let got = pickInterleave(pool, p, { ch: '43', now });
  if (got?.id !== e3[1].id) err('interleave', `expected the most overdue ${e3[1].id}, got ${got?.id}`);
  got = pickInterleave(pool, p, { ch: '43', now, exclude: [e3[1].id] });
  if (got?.id !== e3[0].id) err('interleave', `exclude ignored: got ${got?.id}`);
  const p2 = createProgress(memoryStorage());
  p2.record(e3[2].id, { correct: true, clean: true, seed: 1, now: now - 0.9 * DAY }); // box 1, not yet due, 0.9 d ago
  p2.record(e3[3].id, { correct: true, clean: true, seed: 1, now: now - 0.1 * DAY }); // tried two hours ago
  got = pickInterleave(pool, p2, { ch: '43', now });
  if (got?.id !== e3[2].id) err('interleave', `expected the weak one not tried today, got ${got?.id}`);
  if (pickInterleave(pool, p2, { ch: '36A', now })) err('interleave', 'picked from a later chapter');
  if (!tpl(e3[0].id)) err('interleave', 'fixture missing');
}

/*
 * Principles most often missed: a wrong principle pick counts against the problem's primary, a
 * "misapplied X" answer against X, "didn't see which idea" against the primary; slips and
 * misreadings are counted apart. And pickSet's weight moves a weak principle's problem forward.
 */
{
  const p = createProgress(memoryStorage());
  const byId = (id) => PROBLEMS.find((t) => t.id === id);
  const a = byId('e4.43.series'); // primary energy
  const b = byId('e2.36c.long-wire'); // primary gauss
  p.record(a.id, { correct: false, seed: 1, principle: { ok: false } });
  p.noteGap(a.id, 'which');
  p.record(b.id, { correct: true, seed: 1, principle: { ok: true } });
  p.record(b.id, { correct: false, seed: 2, principle: { ok: false } });
  p.noteGap(b.id, 'charge');
  p.noteGap(b.id, 'slip');
  const { list, other } = p.principleMisses(PROBLEMS);
  const row = (id) => list.find((r) => r.id === id);
  if (row('energy')?.misnamed !== 1 || row('energy')?.unseen !== 1 || row('energy')?.total !== 2) err('principle misses', `energy row wrong: ${JSON.stringify(row('energy'))}`);
  if (row('gauss')?.misnamed !== 1 || row('gauss')?.asked !== 2) err('principle misses', `gauss row wrong: ${JSON.stringify(row('gauss'))}`);
  if (row('charge')?.misapplied !== 1) err('principle misses', `charge row wrong: ${JSON.stringify(row('charge'))}`);
  if (other.slip !== 1 || other.read !== 0) err('principle misses', `slips wrong: ${JSON.stringify(other)}`);
  if (list[0]?.id !== 'energy') err('principle misses', `most missed should be energy, got ${list[0]?.id}`);
  // weight: among one chapter's unseen problems, the weighted one comes first for every seed
  const ch43 = PROBLEMS.filter((t) => t.ch === '43' && !t.enrichment);
  const target = ch43.find((t) => primaryOf(t) === 'charge');
  const fresh = createProgress(memoryStorage());
  for (let seed = 1; seed <= 20; seed++) {
    const got = pickSet(ch43, fresh, { n: 1, seed, weight: (t) => (t.id === target.id ? 1 : 0) });
    if (got[0]?.id !== target.id) err('pickSet weight', `seed ${seed}: picked ${got[0]?.id}, not the weighted ${target.id}`);
  }
}

/*
 * Fading worked examples: new to a chapter → a full example with other numbers; each problem solved
 * right in the chapter hides one more of the steps; working problems only; nothing on "again" or
 * for a template already solved. And every working template can produce an example whose numbers
 * differ from the student's and whose prose renders.
 */
{
  const p = createProgress(memoryStorage());
  const ch44 = PROBLEMS.filter((t) => t.ch === '44' && t.kind === 'numeric');
  const three = ch44.find((t) => render(instance(t, 0)).steps.length >= 3);
  const steps = render(instance(three, 0)).steps.length;
  const g0 = guidanceFor(three, p, { templates: PROBLEMS, seed: 0, steps });
  if (g0?.level !== 'example') err('fading', `new to Ch 44 should get a worked example, got ${JSON.stringify(g0)}`);
  const others = ch44.filter((t) => t.id !== three.id);
  p.record(others[0].id, { correct: true, seed: 1, guided: true, rightFirst: true });
  const g1 = guidanceFor(three, p, { templates: PROBLEMS, seed: 0, steps });
  if (g1?.level !== 'faded' || g1.shown !== steps - 1) err('fading', `one solved should hide one step, got ${JSON.stringify(g1)}`);
  p.record(others[1].id, { correct: true, clean: true, seed: 1 });
  const g2 = guidanceFor(three, p, { templates: PROBLEMS, seed: 0, steps });
  if (steps >= 3 && (g2?.level !== 'faded' || g2.shown !== steps - 2)) err('fading', `two solved should hide two steps, got ${JSON.stringify(g2)}`);
  p.record(others[2].id, { correct: false, seed: 1, guided: true, rightFirst: false });
  if (chapterSkill(PROBLEMS, p, '44') !== 2) err('fading', 'a missed guided attempt should not count as readiness');
  if (guidanceFor(three, p, { templates: PROBLEMS, seed: 0, steps, again: true })) err('fading', '"again" should not be guided');
  const concept = PROBLEMS.find((t) => t.kind === 'conceptual' && t.ch === '44');
  if (guidanceFor(concept, createProgress(memoryStorage()), { templates: PROBLEMS, seed: 0, steps: 1 })) err('fading', 'a concept question should not be guided');
  p.record(three.id, { correct: true, seed: 1, guided: true, rightFirst: true });
  if (guidanceFor(three, p, { templates: PROBLEMS, seed: 0, steps })) err('fading', 'a template already solved should not be guided');
  for (const t of PROBLEMS.filter((x) => x.kind !== 'conceptual')) {
    for (const seed of [0, 3]) {
      const ex = exampleSeed(t, seed);
      if (ex == null) {
        err(t.id, 'fading: no example with numbers different from the student\'s');
        continue;
      }
      const w = workedExample(t, ex);
      if (!w.steps.length) err(t.id, 'fading: worked example has no steps');
      for (const line of [w.text, ...w.steps]) if (/undefined|NaN/.test(mathProse(line))) err(t.id, `fading: example prose broken: ${line.slice(0, 50)}`);
    }
  }
}

/*
 * Predict first (src/data/predictions.js): every lab has prompts; each prompt starts from its
 * preset, runs through the lab's own physics, and the lab agrees with what the prompt's `expect`
 * (and so its explanation) says. Every expected answer is one of the offered choices, and the
 * prose typesets.
 */
{
  const seenIds = new Set();
  for (const labId of new Set(EXAMS.flatMap((e) => e.labs))) {
    if (!PREDICTIONS.some((p) => p.lab === labId)) err(`predict ${labId}`, 'lab has no prediction prompts');
  }
  for (const p of PREDICTIONS) {
    const id = `predict ${p.id}`;
    if (seenIds.has(p.id)) err(id, 'duplicate id');
    seenIds.add(p.id);
    const lab = await loadLab(p.lab);
    if (!lab) {
      err(id, `no lab ${p.lab}`);
      continue;
    }
    const list = typeof lab.scenarios === 'function' ? lab.scenarios() : lab.scenarios || [];
    if (!list.some((sc) => sc.id === p.scenario)) err(id, `lab ${p.lab} has no preset "${p.scenario}"`);
    const s = lab.defaultState();
    try {
      if (lab.applyScenario) lab.applyScenario(p.scenario, s);
      else applyScenario(lab.id, p.scenario, s);
      if (p.fits && !p.fits(s)) err(id, 'its own preset does not fit it');
      p.prep?.(s);
      const { before, after } = runPrediction(lab, s, p);
      const got = predictionOutcomes(p, before, after);
      for (const w of p.watch) {
        const mode = w.mode || p.mode;
        if (mode !== 'bool' && !(Number.isFinite(before[w.id]) && Number.isFinite(after[w.id]))) err(id, `${w.id}: not a finite number (${before[w.id]} → ${after[w.id]})`);
        if (!(w.id in p.expect)) err(id, `${w.id}: no expected outcome`);
        else if (!predictionChoices(p, w).some(([v]) => v === p.expect[w.id])) err(id, `${w.id}: expected ${p.expect[w.id]} is not among the choices`);
        if (got[w.id] !== p.expect[w.id]) err(id, `${w.id}: the lab says ${got[w.id]} (${before[w.id]} → ${after[w.id]}), the prompt expects ${p.expect[w.id]}`);
      }
      for (const text of [p.ask, p.why, ...p.watch.map((w) => w.label)]) {
        const html = mathProse(text);
        if (/katex-error|undefined|NaN/.test(html)) err(id, `prose does not typeset: ${text.slice(0, 60)}`);
      }
    } catch (e) {
      err(id, `throws: ${e.message}`);
    }
  }
}

const noHints = PROBLEMS.filter((t) => !t.hints.length).map((t) => t.id);
if (args.includes('--list') && noHints.length) console.log(`templates with no hints (${noHints.length}):`, noHints.join(' '));

const byExam = {};
const byCh = {};
for (const p of PROBLEMS) {
  byExam[p.exam] = (byExam[p.exam] || 0) + 1;
  byCh[p.ch] = (byCh[p.ch] || 0) + 1;
}
console.log(`${seen.size} templates · ${PROBLEMS.reduce((a, p) => a + p.cases.length, 0)} worked cases · ${simChecks} sim comparisons`);
console.log('by exam:', Object.entries(byExam).map(([k, v]) => `${k}:${v}`).join('  '));
console.log('by chapter:', CHAPTER_ORDER.map((c) => `${c}:${byCh[c] || 0}`).join('  '));
if (args.includes('--list')) {
  console.log('by lab:', labsUsed);
  for (const n of notes) console.log('NOTE ', n);
}
for (const e of errors) console.log('FAIL ', e);
console.log(errors.length ? `${errors.length} failure(s)` : 'problems: all checks passed');
process.exit(errors.length ? 1 : 0);
