# Lessons

Interactive-lesson handouts written for FLUX, in the format the course already uses — activities,
numbered questions, ruled answer space, upload to Canvas.

| File | Replaces | Labs used |
|---|---|---|
| [Interactive Lesson 1 — Static Electricity](Interactive-Lesson-1-Static-Electricity-FLUX.docx) | PhET *Balloons and Static Electricity* and *John Travoltage* | Exam 1 → Force; Exam 2 → Conductors |

## What is and is not in here

Everything in these documents is written from scratch against the simulator. **No course material of
any kind is reproduced** — no problem text, no figures, no answer keys, nothing from a worksheet or
a Canvas page. The screenshots are of this app. The repository's source-only rule is intact.

Lesson 1 is a conversion of an existing PhET lesson, so it keeps that lesson's learning objectives
and question count. Its last page is a coverage table stating plainly which objectives transfer to
FLUX and which do not — polarization and conservation of charge under induction do; triboelectric
charging and breakdown in air do not, and the PhET activity is the better tool for those. A lesson
that quietly drops a stated objective would be worse than one that says so.

## Regenerating a lesson

The `.docx` files are built from scripts in `src/`, so they can be edited and rebuilt rather than
hand-patched. `docx` is not a dependency of the app — install it just for this:

```bash
npm install --no-save docx
node lessons/src/lesson-1.cjs
```

That rewrites the `.docx` in place. The scripts are CommonJS (`.cjs`) because the app's
`package.json` sets `"type": "module"`.

Screenshots live beside the script. To refresh one, run the app, set the lab up as the lesson
describes, and capture at 1500×900 with `deviceScaleFactor: 2`.
