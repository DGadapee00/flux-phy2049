# FLUX — PHY 2049

Interactive 3D labs for Montgomery’s Calculus Physics II. Exam units in the top row, labs as tabs, hash URLs so each lab is bookmarkable (`#/e3/potential`).

## Open the live app

**[https://flux-phy2049.pages.dev](https://flux-phy2049.pages.dev)** — no install. Works on a laptop, Chromebook, phone, or library machine.

Deep links work the same as locally, e.g. `#/e3/potential` or a single problem at `#/e4/circuits?p=e4.44.two-loop&s=0`.

The practice bank is built for phones: full-screen problem sheet, thumb-sized targets, inputs that
don't make Safari zoom. The 3D labs render and respond to touch, but they want a laptop.

Repo: https://github.com/DGadapee00/flux-phy2049 (`main`). Source only — none of the course's
lecture notes, worksheets, or Canvas files. (`lessons/` holds handouts written from scratch for this
app; nothing in it reproduces course material.) **[DEPLOY.md](DEPLOY.md)** covers rebuilding and republishing, and what
a public build exposes. **[PROVENANCE.md](PROVENANCE.md)** accounts for exactly which course
material the problem bank draws on, and **[ERRATA.md](ERRATA.md)** lists the twenty-four places the app's
physics disagrees with a printed answer key, or where a question needs a note.

## Run locally

```bash
git clone https://github.com/DGadapee00/flux-phy2049.git
cd flux-phy2049
npm install
npm start
```

Opens at http://localhost:5174/

Already have a clone? `git pull` inside `flux-phy2049` before starting, so the server is running
the current code.

```bash
npm run deploy           # test, build, and publish to flux-phy2049.pages.dev (see DEPLOY.md)
npm run live             # what commit the live site is built from, and what it's missing
```

```bash
npm test                 # physics self-test (no browser) — analytic vs numerical, relative tolerances
node scripts/smoke.mjs   # all labs in a headless browser; original 8 vs scripts/baseline/values.json
node scripts/gallery.mjs [lab ...]   # screenshot every lab × scenario to scripts/output/gallery
node scripts/contact.mjs [regex]     # tile those screenshots into contact sheets for review
```

Playwright is not a dependency here. The three browser scripts borrow one from wherever the machine
keeps it (`scripts/playwright.mjs`): this project's own `node_modules`, a global install, or
`PLAYWRIGHT_PATH=/path/to/a/project/that/has/it`.

The self-test checks the code against independent methods rather than against itself: Biot–Savart sums vs closed forms, Ampère loops, Boris-integrated orbits, image-charge surface potentials, Kirchhoff rules on every circuit layout, −ΔΦ/Δt for Faraday, an RK4 simulation of each AC circuit vs its phasor current, and paraxial ray tracing that must land every principal ray on the computed image.

## Practice

Press **P** (or the yellow **Practice** button) for the problem bank: 258 generated problems covering every syllabus chapter (V, 34–65), grouped by chapter with a mastery bar for each, or by the principle that decides them. Every chapter with a lab loads its problems straight into it. **Group by: Principle** puts one law's problems side by side across chapters (Gauss on a sphere, a wire and a sheet), with the ones from earlier exams folded underneath and how often you've named that principle right.

1. **Open a problem.** It loads its own setup into the matching lab — the charges, distances and coordinates exactly as the question states them, with the scene scaled to fit (the note under the problem says what one grid square is worth). Nothing is rescaled, so the lab is reading the problem you are working. While it's unsolved, the lab's numbers are hidden: the readout, the equation panel, value labels in the scene, and the arrows that would show a direction answer, and scene pieces that would give it away (an image, the rays past a lens). The geometry stays visible, the names the question uses (q₁, P, I₂) stay labelled, and the scenario box reads "This problem's setup" rather than a preset name. On a phone, **Show lab** lowers the problem sheet so you can see the scene.
2. **Name the principle first.** Before the parts appear, the problem asks which principle decides it (conservation of energy, Gauss's law, Faraday's law, and so on), from four choices or "not sure". Experts sort problems by the law that governs them; novices sort by what they look like. Naming the law first makes you practise the expert's sort. A wrong or unsure pick shows the right principle, its statement and the cue that points to it, and that attempt won't count as a clean solve. The solution starts by naming the principle too, plus the other ideas the problem uses.
3. **Symbols before numbers.** Most multi-step problems open with the formula, not the arithmetic. Write it in symbols and the panel typesets it underneath as you go — what you see is what the grader read, so `a/b+c` shows a fraction over `b` alone and a missing bracket is visible while you type. A row of keys under the box inserts the problem's own symbols in their real glyphs (`λ`, `ε₀`, `μ₀`, `π`, `√`, `²`), which is the only way to enter them on a phone; typing works too, and `λ` and `lam` are the same thing. `/` opens a bracketed denominator with the caret inside it, typed or tapped, because `q/Aε₀` means (q/A)·ε₀ to a parser and `q/(Aε₀)` to a physicist. Meanwhile the panel reads the units off what you've typed and prints them under the box, `units: N/C ✓` or `units: C/m — this one should come out in N/C`. That's the exam habit of writing the problem in units first and checking it lands in the right place, confirmed while you write it. The numeric box for that quantity stays locked until its formula is right, so the numbers go into an expression you've already justified. A practice exam turns the lock off.
4. **Answer and check.** Numbers accept `2.5e-6`, `2.5 × 10^-6`, or `2.5 μC` — a typed unit is converted, and one of the wrong kind is pointed out. A wrong part says why when it can (sign, power of ten, factor of 2, wrong quadrant), and a wrong multiple-choice pick explains what is wrong with that choice. Every problem has hints, from the idea to the equation to the step people miss, and the worked solution puts the numbers into each formula with their units before the result. Sketch parts are compared with a rubric. After a missed attempt the panel asks what went wrong (applying a particular principle, seeing which idea to use, a slip, or misreading the question) and answers in kind. The list then shows the **principles you most often miss**, counted across every exam: principles named wrong in the principle step, ones you said you misapplied, and ones you didn't see. Each has a **Practise** button for up to five of its problems, weakest first. Mixed sets lean toward these principles.
5. **The lab checks you.** Once it's solved, the lab's own value appears next to each answer. Change the setup to explore; **Reset to the problem** puts it back. **Peek** reveals the numbers early, but that attempt then won't count as a clean solve.
6. **Spaced review and interleaving.** A clean solve (right on the first check, no hints, no peeking) schedules the problem further out: 1, 3, 7, 16, 35 days. A miss brings it back in 10 minutes. **Review due** mixes whatever is due across every exam. Working down a chapter's list, every fourth problem is one you've already met from an earlier chapter (the most overdue, else the weakest), so earlier material keeps coming back instead of one chapter being massed at a time. Your first attempt uses the worksheet's numbers when a sheet exists; after that the numbers change each time.
7. **Practice exam.** 8 problems across the exam's chapters, weighted toward what you haven't mastered, with a 50-minute timer, no hints and no feedback until you submit. Results show a score by chapter, and each problem opens with its worked solution.

Links open a specific version: `#/e2/field?p=e2.36a.collinear&s=0`. Progress is saved in this browser only. Authoring, answer-key notes and the checks: [PROBLEMS.md](PROBLEMS.md).

Every panel is typeset — including the practice panel, where the statement, hints and worked steps are set as mathematics rather than as ASCII. In the labs: the law at the top of the equation panel, the live rows under it, the explainer at the bottom, and the readout across the bottom of the screen all render their symbols with KaTeX, with the central equation of an explainer set on its own line.

## Predict first

Every lab has a **Predict first** card at the foot of its Setup panel: 53 short experiments across the 26 labs. Each one names a change ("the battery stays connected; pull the plates to twice the separation") and asks what it does to one to three quantities. You answer bigger / smaller / same, or by what factor, or yes / no. You answer while the lab still shows the setup before the change. **Make the change** then does it in the lab, and the card grades each prediction against the lab's own before-and-after values and gives the reasoning. **Undo** puts the setup back. **Try it** first loads the preset the experiment is written for, unless the lab is already on it. Several experiments aim at the classic wrong answers: a narrower slit gives a *wider* pattern, a period that doesn't depend on speed, a third polarizer that lets light *through*, a bigger Gaussian sphere with the same flux. The card hides while a practice problem is open, and a tally of right predictions stays in this browser.

## Setting up by hand

Every number in a setup is typed, not approximated: each charge has a box for **q** in μC, and a row of **x, y, z** boxes in the unit the scene is drawn at. The probe (P) and, in Potential, point A get the same rows. Every slider in the app has a box beside it for an exact value, and typing a value past a slider's end widens the slider rather than clamping it.

The number plane is labeled in real distance and the ticks change with the view, so a square is always a round length (5 cm, 50 cm, 1 m). Charge labs frame the layout automatically when it outgrows the view; **Fit view** reframes on demand. Dragging stays in the lab's work plane — the xy plane a problem is written in, or the xz floor for the 3D scenes — and snaps to half a square, so a drag lands on round numbers. Hold **Alt** to place freely.

## Exams

| Unit | Hash | Labs |
|---|---|---|
| Exam 1 · Ch V, 34–35 | `#/e1/vectors` | Vectors, Force |
| Exam 2 · Ch 36–37 | `#/e2/gauss` | Field, Integrals, Gauss, Conductors |
| Exam 3 · Ch 38–42 | `#/e3/potential` | Potential, Integrals, Capacitor, Ohm, Power, Breakdown |
| Exam 4 · Ch 43–47 | `#/e4/circuits` | Circuits, RC, Biot–Savart, Ampère, Mag force |
| Exam 5 · Ch 48–52 | `#/e5/faraday` | Faraday, AC |
| Exam 6 · Ch 53–57 | `#/e6/emwave` | EM wave, Polarization |
| Exam 7 · Ch 58–62 | `#/e7/refraction` | Refraction, Mirrors, Lenses |
| Wave optics · Ch 63–65 | `#/wave` | Interference, Diffraction, Thin film |

### Exam 3 labs

- **Potential** (`#/e3/potential`) — V = Σ kq/r for any charges you place, equipotentials, ΔV and the field's work from point A to the probe, a uniform field, and U = qV for a test charge of either sign.
- **Integrals** (`#/e3/integral`) — Exam 2's lab, listed here too and opened in its **∫ dV** mode: V from a rod (on its bisector, above an end, or on its own line past the end), a ring or arc, and a disk, as a Riemann sum next to the closed form. It is the lab behind the Ch 39 continuous-charge problems.
- **Capacitor** (`#/e3/capacitor`) — C = κε₀A/d, battery-connected against isolated when a dielectric goes in, and the energy stored.
- **Ohm** (`#/e3/ohm`) — R = ρL/A, ρ(T), drift speed, and I = V/R with the charges moving.
- **Power** (`#/e3/power`) — P = IV four ways, rms against peak, and P(t) for AC.
- **Breakdown** (`#/e3/breakdown`) — Paschen's law and the doorknob spark. Beyond the practice sheets: its problems are marked *extra* and kept out of mixed sets and practice exams.

### Exam 4 labs

- **Circuits** (`#/e4/circuits`) — fifteen layouts: series and parallel with three or four resistors, two in parallel, R₁ + (R₂∥R₃) with and without an R₄, R₁ ∥ (R₂ + R₃), two identical-bulb networks, one loop with two batteries, two- and three-battery Kirchhoff circuits, a battery with internal resistance, and three cells-and-bulb circuits side by side. Every circuit problem in the bank loads its own numbers into one of them. Solved by nodal analysis; wires colored by potential, dots show real current (hidden, with the node markers, while a problem is unsolved), grey chevrons show the assumed direction, and a battery set negative is drawn turned round. Junction and loop rules are evaluated live.
- **RC** (`#/e4/rc`) — a battery, switch, resistor and capacitor in one loop, or two capacitors in parallel or in series. Close the switch and the capacitor charges on a clock that fits five time constants into about six seconds; take the battery out and it discharges. You can scrub time in units of τ. The yellow dots are the current and slow to a stop as the capacitor fills. The plates brighten with their share of the charge. The plot draws V_C and I against t/τ with the present moment marked. Every RC and capacitor-pair problem in Ch 44 loads its own numbers into it.
- **Biot–Savart** (`#/e4/biot`) — wire, loop, solenoid. Σ dB is compared with the exact formula for the *same finite* geometry; the ideal limit (μ₀I/2πρ, μ₀nI) is shown separately.
- **Ampère** (`#/e4/ampere`) — circular Amperian loop as a Riemann sum, pieces colored by B·dl. Centered, off-center, wire outside, two wires, inside a thick wire.
- **Mag force** (`#/e4/magforce`) — proton / electron orbits and a helix (Boris integration), velocity selector, F = I L × B, parallel wires.

### Exam 5 labs

- **Faraday** (`#/e5/faraday`) — moving magnet, growing loop, sliding bar, rotating generator. Live ε = −dΦ_B/dt; yellow chevrons are Lenz’s induced current (counterclockwise from +y is +I and makes +B_y).
- **AC** (`#/e5/ac`) — series R, RC, RL, RLC. Phasors and |Z|, φ, f₀. Tune through resonance and I peaks when X_L = X_C.

### Exam 6 labs

- **EM wave** (`#/e6/emwave`) — traveling plane wave, E ŷ, B ẑ, S along +x̂. E/B = c = 1/√(μ₀ε₀). Intensity I = ½ c ε₀ E₀². The drawing is stretched and slowed, so a log-scale **spectrum ruler** (1 pm to 1 km) marks where this λ really sits, and what one wavelength is about the size of — an atom for X-rays, a house for FM radio (Ch 54).
- **Polarization** (`#/e6/polar`) — Malus I = I₀ cos²θ. Unpolarized → one filter is I₀/2. Crossed filters go dark; a 45° filter in the middle brings back I₀/8.

### Exam 7 labs

- **Refraction** (`#/e7/refraction`) — Snell n₁ sinθ₁ = n₂ sinθ₂, θᵣ = θ₁, TIR past θ_c = sin⁻¹(n₂/n₁). Rotation locked.
- **Mirrors** (`#/e7/mirrors`) — 1/f = 1/d_o + 1/d_i, m = −d_i/d_o. Concave f>0 / convex f<0. Three principal rays.
- **Lenses** (`#/e7/lenses`) — same equation. Converging / diverging, plus Keplerian telescope and compound-microscope two-lens scenarios.

### Wave optics labs

The bench in these three cannot be drawn to scale — slits sit tenths of a millimetre apart and the
screen is metres away — so the geometry is stretched and **the pattern is not**: every band on the
screen is painted pixel by pixel from the real I(θ) for the λ, d, a and L in the panel.

In Interference and Diffraction the screen **keeps its scale** while you slide, with a ruler beside it
in real units (mm for a flat screen, degrees for a grating, μrad for resolution). Narrow the slits and
you watch the pattern spread against a ruler that stays put; **Fit screen** refits on demand. Every
scenario in a lab shares one scale, so switching scenarios compares them honestly. Moving the screen
back (L) moves it back on the bench too. The screen is drawn as a card standing on the bench, turned
so you see the pattern on its face as bars of light — as it would look on a wall — with the
intensity curve I traced beside it on the same scale.

Behind the slits the light is drawn as **waves**: a plane wave up to the barrier, then an animated
ripple tank from each opening. The ripples use a stand-in wavelength chosen so the drawn geometry puts
its first order exactly where the real pattern does, so the dark, still lanes between the ripples
land on the dark bands of the screen. Untick *show the waves* for the ray diagram.

- **Interference** (`#/wave/interference`) — Young's double slit. d sinθ = mλ, Δy = λL/d. **Drag P** along the screen: the two paths to it are drawn, the extra length δ is laid along the longer one and ticked off in wavelengths, and an inset shows the wave from each slit arriving at P and their sum — crests lined up on a bright band, crest on trough on a dark one. Switch on a finite slit width and the single-slit envelope appears over the fringes — at a = d/3 the m = 3 order goes missing, which you can watch happen.
- **Diffraction** (`#/wave/diffraction`) — three modes. Single slit (a sinθ = mλ for the *dark* fringes, central width 2λL/a, with the sinc² traced beside the screen and a row of Huygens wavelets across the opening), grating (d = 1/N, every order drawn out to m_max = ⌊d/λ⌋ on a screen marked in angle, peaks narrowing as 1/N), and Rayleigh resolution (θ_min = 1.22λ/D: two sources, each with its own Airy curve in its own colour beside the screen, and their sum in white, with how deep the dip between them goes — about 73 % at the limit — until you slide them together into one hump).
- **Thin film** (`#/wave/thinfilm`) — the film is drawn to scale *with the wave*, so a quarter-wave film is a quarter of a drawn wavelength thick and the wave inside it is visibly n times shorter. Waves run along each ray and turn over at a reflection that flips; the two that leave the top, and an inset of them with their sum, show crest meeting crest or trough. Each reflection is labelled with whether it flips, beside the extra path 2nt and t_min for bright and for dark. Along the top, two strips show a wedge of this film from thin to thick: in the lab's laser light (bright and dark bands λ/2n apart) and in white light, in true colour — black at the thin end for a soap film, as a bubble goes just before it pops. Anti-reflection coating and soap bubble are both scenarios.

Sign conventions: B is along +ŷ in Mag force; Amperian loops and current loops run counterclockwise seen from +y, so current up counts as +I_enc and a positive loop current makes B point up. Faraday uses the same loop convention for Lenz. The EM wave uses E ŷ, B ẑ, travel +x̂ so ŷ × ẑ = x̂.

## Controls

- **P** opens Practice, **Esc** closes it
- Exam tabs **1–7 W**, or `[` / `]`; Back / Forward walk through the labs you visited
- Labs in the current exam: keys `1–9`
- Drag to orbit (Ohm / Power / Circuits / Refraction / Mirrors / Lenses lock rotation), scroll to zoom
- Drag a charge in the work plane; **Shift-drag** moves it along the third axis; **Alt** drops the snap
- Click empty space (Gauss / Field / Potential / Conductors / Biot–Savart) to place the probe
- `Space` plays the integral or sum · `Delete` removes a charge · `+` / `−` add charges · `R` resets the camera



