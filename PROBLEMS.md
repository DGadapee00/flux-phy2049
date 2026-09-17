# Problems — the missions for each lab

FLUX's labs show the physics. The problem bank gives each lab something to solve. Every problem is a **generator**:

- It samples fresh numbers.
- It computes the answers.
- It loads the matching lab into exactly that setup.

After the student answers, the lab confirms the result.

**Status:** built. The bank, engine and checks are described below; §4 describes how the Practice panel uses them.

```
npm test                              # physics self-test + problem check
node scripts/problems-check.mjs --samples 200 --list   # deeper run, with notes and lab usage
```

## 1. What's here

| Path | Role |
|---|---|
| `src/problems/kit.js` | Authoring helpers: `problem`, `range`, `choice`, `num`, `mc`, `tf`, `sym`, `self`, `kase`, `charge`, `layout`, constants |
| `src/problems/engine.js` | Seeded sampling, `instance`, `render`, `grade`, number parser, symbolic grader. No DOM and no Three.js |
| `src/problems/simbridge.js` | `applyProblem(lab, slice, inst)` loads an instance into a lab's state slice; `headlessCtx()` is for Node |
| `src/problems/index.js` | `PROBLEMS`, `problemById`, `problemsForExam`, `problemsForLab`, `CHAPTER_ORDER`, `CHAPTER_TITLES` |
| `src/problems/progress.js` | Per-problem history, Leitner-box spaced review, `pickSet` for mixed sets and practice exams. No DOM; storage is injected |
| `src/problems/bank/e1.js … e7.js, wave.js` | 179 templates covering every chapter on the Fall 2026 syllabus (V, 34–65) |
| `src/ui/problems.js`, `src/styles/practice.css` | The Practice panel (§4) |
| `scripts/problems-check.mjs` | Test runner (see §3) |

Coverage by exam: e1 18 · e2 46 · e3 29 · e4 24 · e5 19 · e6 18 · e7 14 · wave 11. Every chapter has at least one template. Ch 36–37 reproduce Montgomery's practice sheets, and those cases carry the printed key.

**Answer-key issues found** (they show up as NOTE lines in `--list`):

- 36B #2: the answer is 2000 m, not 0.2 m.
- 36B #4: the units should be C/m², not C.
- 36A #15: the key used k = 9.0×10⁹.

## 2. Template contract

```js
problem({
  id: 'e2.36a.collinear',            // stable forever; progress is stored under it
  exam: 'e2', ch: '36A', lab: 'field', // lab may belong to another exam (e.g. Ch 39 uses Integrals)
  src: 'Practice 36A #19–22', title, kind: 'numeric' | 'conceptual' | 'derivation', level: 1–3, topics: [],
  vars: { q1: range(1, 20, 1, 'μC', 1e-6), s1: SIGN, … },  // display value × si → SI in $
  derive: ($) => ({ Ex, … }),         // everything in SI
  valid: ($) => bool,                 // resample until true
  text: (T, $, f) => `…${T.q1} μC…`,  // T = display strings, f = 3-sig-fig formatter
  parts: [ num('E', $ => |Ex|, 'N/C'), mc('dir', DIR_X, $ => sign(Ex)), sym(...), self(...) ],
  hints: [...], steps: ($, f, T) => [...],
  sim: {
    scenario: 'dipole',               // base scenario, applied first
    setup(slice, $) { … return 'optional note' },  // mutate the lab slice
    read(computed, slice, $) { return { E: |computed.probeE| } },  // lab value for each part id (SI)
  },
  cases: [ kase('#20', { … }, { E: 5.055e5, dir: 1 }, { key: '5.06 x 10^5 N/C', note }) ],
})
```

- Numeric parts: `get($)` is in SI. The student answers in `unit`, which is SI ÷ `scale`. The default tolerance is 2% (`tol`), and `abs` sets an absolute floor.
- Choice parts: `correct` is a value, an array (with `multi`), or a function of `$`.
- `sym(id, 'k*lam*L/(d*sqrt(d^2+L^2/4))', ['lam','L','d'], get)`: students type things like `2k lam/R` or `kQ/r^2` (Greek letters are fine). The grader compares the two expressions at random points.
- `read` may also return `'@label': [got, want]` for checks that aren't answers (e.g. "V at the point ≈ 0").
- `layout(slice, { charges, probe, pathA, plane, select })` loads the problem's own numbers: the positions in metres and the charges exactly as stated, plus a `view` (`{ upm, plane }`) that scales the scene to them. A distance in the question is the distance on screen, so the lab can be rebuilt by hand from the text. It returns the note shown under the problem ("Set to the problem's own numbers · 1 grid square = 10 cm").

  This replaced `fitLayout`, which scaled positions into a fixed-size scene and compensated on the charges (×s² for E, ×s for V and F). The answer was right, but the separation on screen was never the separation in the question, so the sim could not be used alongside the worked problem.

## 3. What the check proves

For every template, `scripts/problems-check.mjs` confirms that:

1. Each worked case reproduces its expected answers, and the grader accepts those values when typed.
2. N seeded samples are valid and finite, and every choice answer is one of the options.
3. The text, labels, and steps never render `undefined` or `NaN`.
4. Each symbolic key equals `get($)`, and the grader rejects a key scaled by ×1.1.
5. **The problem and the lab agree.** The script loads the instance into the real lab with `applyProblem`, runs `lab.recompute` headless, and compares `sim.read` with the problem's answers. That's about 25,000 comparisons at 200 samples.

A deliberate formula error and a flipped direction answer were each caught by (1) and (5). All templates with a `sim` are also loaded into the running app by `scripts/smoke.mjs`, which fails on any page error.

## 4. In the app

`src/ui/problems.js` owns the panel. `src/main.js` owns lab switching and exposes `openProblemInApp(inst)`, which switches to the template's lab, runs `applyProblem`, frames the camera, and writes the URL.

- **Panel.** `P` or the Practice button in the header. The list shows the current exam grouped by chapter. Each problem has a status dot (new, learning, due, missed, mastered), each chapter has a mastery bar, and there are kind filters and a "this lab only" filter. The panel takes the left column. While it is open, the 3D view shifts right (a projection offset) so the scene stays centered in the free space. Wave optics has no labs yet, so its exam opens straight into the list.
- **Blind mode.** While an attempt is unsolved and not peeked, `body.problem-blind` hides `#eq-live`, `#insight`, `#mini-plot` and `#readout`. `veilNode` masks in-scene labels that carry numbers or verdicts ("real image", "attract"). It keeps givens drawn as `.qV`, `.qR` and `.qB` spans, charge labels, axis labels, and focal marks. Arrows that would give a direction away (probe E, forces, the net dE, B at the probe) are wrapped in `markAnswer()`, which puts them on `ANSWER_LAYER`; the camera turns that layer off. When you add a lab, wrap any such arrow in `markAnswer`.
- **Answering.** Numeric inputs (`parseNumber` ignores a trailing unit), radio or checkbox choices, a symbolic input with a live parse message, and rubric self-checks. Check grades every answered part, and wrong parts can be retried. The attempt finishes when every part is right or the solution is opened.
- **Lab agreement.** After finishing (or peeking), `sim.read` runs against the live `computed` state, and each part shows the lab's value with "agrees" or "differs". This turns off if the student changes the setup; "Reset to the problem" restores it.
- **URL.** `#/<exam>/<lab>?p=<id>&s=<seed>` opens that instance. `parseHash` stays backward compatible. Practice exams don't write the query.
- **Progress.** `localStorage['flux.problems.v1']` stores `{ attempts, solved, clean, peeks, hints, box, due, lastSeed, lastOk }` per id. A clean solve moves the problem up a box, due again in 10 min, 1, 3, 7, 16 or 35 days. A solve that needed help drops a box (never below 1). A miss or an opened solution resets it to box 0. **Review due** walks every due problem across exams. First attempts use seed 0 (the worksheet numbers); later attempts use fresh seeds.
- **Practice exam.** `pickSet` chooses 8 problems round-robin across the exam's chapters, weakest first, with at most a quarter conceptual. There is a 50-minute timer and no hints or feedback. Answers autosave to `localStorage['flux.exam.v1']`, so a reload can resume. Submitting grades every non-sketch part, records each problem for spaced review, and shows the score by chapter. Each problem then opens in review mode with the worked solution.
- **Tests.** `npm test` also runs the progress and `pickSet` checks. `scripts/smoke.mjs` loads every problem that has a lab setup into the running app. It walks a Circuits problem through blind mode (wrong answer, feedback, right answer, lab agrees, recorded) and runs a practice exam to its results.

## 5. Adding problems from a new worksheet

1. Pick the bank file for the exam. Write each worksheet problem as a template whose `cases[0]` is the worksheet's numbers, with the printed key in `key`.
2. If the key looks wrong, work it by hand. If the key really is wrong, keep the correct `want` and explain in `note` (see 36B #2).
3. Choose ranges that match the worksheet's style and use `valid()` to avoid degenerate cases. Sliders no longer bound a setup — every slider has a box that takes an exact value and widens its range — but keep the numbers in a range the lab can draw.
4. Attach `sim` when a lab can show the setup, and add `read` whenever the lab computes the same quantity. That comparison is the strongest test here.
5. Run `node scripts/problems-check.mjs --only <id-prefix> --samples 300`.
