# Provenance and academic integrity

*A one-page account of what course material this project does and does not contain, prepared for
the instructor. Every number below is countable from the repository; the commands are at the end.*

## What this is

FLUX is a study tool: 24 interactive 3D labs plus a bank of generated practice problems, covering
the syllabus chapters. It runs in a browser at <https://flux-phy2049.pages.dev> with nothing to
install. It was written by a student in the course, for the course.

Its purpose is a **second opinion**. When a student works a problem, the matching lab computes the
same quantity by a different route — a Riemann sum against a closed form, a Kirchhoff solve against
a measured loop, ray tracing against the lens equation — and says whether the two agree. The app is
not a place to look up answers; it is a place to find out whether your own answer survives contact
with the physics.

## What of the course's material is in the repository

| | |
|---|---|
| Problem templates | **200** |
| …that cite a practice sheet (`src: 'Practice 39 #8–10'`) | **62** |
| …that use a printed answer as a ground-truth check | **55** |
| Individual printed answers stored | **92**, across 268 worked cases |
| Templates checked only against physics the app computes itself | **145** |

So roughly **three quarters of the bank owes nothing to the course's answer keys.** Where a printed
answer is used, it is used as a test fixture — a check that the app's own physics reproduces the
number the sheet gives — and the source is cited in the code beside it.

## What is *not* in the repository

- No lecture notes, worksheets, slides, exams, or Canvas files, in any format.
- No scans, screenshots, or PDFs of course documents.
- No copied problem text. Every problem statement in the bank is written fresh and generated from
  randomised parameters, so two students opening the same problem see different numbers.
- No figures. Problems that depend on a printed figure were either rebuilt from scratch with our
  own geometry or left out; those are flagged in the code.

The repository has been source-only since its first commit, and the README has said so throughout.
Git history is available if useful.

## How the physics is verified

The app does not trust itself. `npm test` runs **307 assertions**, each checking a result against an
independent method rather than against a stored value — Biot–Savart sums against closed forms,
Ampère loops, Boris-integrated orbits, image-charge surface potentials, Kirchhoff's rules on every
circuit layout, −ΔΦ/Δt for Faraday, RK4 integration of each AC circuit against its phasor current,
and paraxial ray tracing that must land every principal ray on the computed image. A further check
runs all 200 templates through **8,903 comparisons** against the labs.

This is why the app can disagree with an answer key and be worth listening to. See
[ERRATA.md](ERRATA.md) for the nine places it does, three of which look like genuine slips.

## Where it is hosted, and who can read it

Public on Cloudflare Pages, at an unlisted URL, with `robots.txt` and an `X-Robots-Tag` header
asking search engines to skip it. It will not surface in a search for a problem's wording.

**That is a courtesy, not a lock.** Anyone given the link can read everything, including the 92
printed answers. If those practice sheets are reused from term to term, that is worth deciding
deliberately rather than by default. Two remedies, either of which can be done the same day:

1. **Gate it.** Cloudflare Access restricts the site to a named list of email addresses, free for up
   to 50 users. Setup is about fifteen minutes and is documented in [DEPLOY.md](DEPLOY.md).
2. **Remove the printed answers.** Deleting the 92 `key` values costs nothing functionally — those
   55 templates would simply be checked against the app's own physics, like the other 145.

## Student data

None leaves the device. Progress is kept in the browser's `localStorage`, per browser. There are no
accounts, no server, no database, no analytics and no telemetry. Nothing is transmitted anywhere,
and no one — including the author — can see who used it or how they did.

## If it were used in the course

Four things worth settling early rather than late:

- **Ownership and licence.** It is currently a student's private repository. Course infrastructure
  needs an explicit answer about who owns it and under what terms.
- **Maintenance.** Who fixes it after the author graduates. The test suite makes changes safe to
  make, but someone has to make them.
- **Accessibility.** This is the honest weak point. The labs are a WebGL canvas that leans on colour
  and pointer interaction; there are keyboard shortcuts but no screen-reader story. That is
  acceptable for an optional study aid and becomes a real obligation if it is ever required work.
- **Cost.** Zero. Cloudflare Pages' free tier covers it, with no per-student fee at any class size.

## Checking these numbers

```bash
grep -c "src: '" src/problems/bank/*.js        # templates citing a practice sheet
grep -c "key: "  src/problems/bank/*.js        # printed answers stored as test fixtures
grep -rn "note: '" src/problems/bank/*.js      # every recorded disagreement
npm test                                       # the 307 independent physics checks
```
