# FLUX — PHY 2049

Interactive 3D labs for Montgomery’s Calculus Physics II. Exam units in the top row, labs as tabs, hash URLs so each lab is bookmarkable (`#/e3/potential`).

## Open the live app

**[https://flux-phy2049.pages.dev](https://flux-phy2049.pages.dev)** — no install. Works on a laptop, Chromebook, phone, or library machine.

Deep links work the same as locally, e.g. `#/e3/potential` or a single problem at `#/e4/circuits?p=e4.44.two-loop&s=0`.

The practice bank is built for phones: full-screen problem sheet, thumb-sized targets, inputs that
don't make Safari zoom. The 3D labs render and respond to touch, but they want a laptop.

Repo: https://github.com/DGadapee00/flux-phy2049 (`main`). Source only — no lecture notes,
worksheets, or Canvas files. **[DEPLOY.md](DEPLOY.md)** covers rebuilding and republishing, and what
a public build exposes. **[PROVENANCE.md](PROVENANCE.md)** accounts for exactly which course
material the problem bank draws on, and **[ERRATA.md](ERRATA.md)** lists the nine places the app's
physics disagrees with a printed answer key.

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

Press **P** (or the yellow **Practice** button) for the problem bank: 200 generated problems covering every syllabus chapter (V, 34–65), grouped by chapter with a mastery bar for each. Every chapter with a lab loads its problems straight into it.

1. **Open a problem.** It loads its own setup into the matching lab — the charges, distances and coordinates exactly as the question states them, with the scene scaled to fit (the note under the problem says what one grid square is worth). Nothing is rescaled, so the lab is reading the problem you are working. While it's unsolved, the lab's numbers are hidden: the readout, the equation panel, value labels in the scene, and the arrows that would show a direction answer. The geometry stays visible.
2. **Symbols before numbers.** Most multi-step problems open with the formula, not the arithmetic. Write it in symbols and the panel typesets it underneath as you go — what you see is what the grader read, so `a/b+c` shows a fraction over `b` alone and a missing bracket is visible while you type. A row of keys under the box inserts the problem's own symbols in their real glyphs (`λ`, `ε₀`, `μ₀`, `π`, `√`, `²`), which is the only way to enter them on a phone; typing works too, and `λ` and `lam` are the same thing. `/` opens a bracketed denominator with the caret inside it, typed or tapped, because `q/Aε₀` means (q/A)·ε₀ to a parser and `q/(Aε₀)` to a physicist. Meanwhile the panel reads the units off what you've typed and prints them under the box, `units: N/C ✓` or `units: C/m — this one should come out in N/C`. That's the exam habit of writing the problem in units first and checking it lands in the right place, confirmed while you write it. The numeric boxes stay locked until the formula is right, so the numbers go into an expression you've already justified. A practice exam turns the lock off.
3. **Answer and check.** Numbers accept `2.5e-6`, `2.5 × 10^-6`, or `2.5 μC`. A wrong part says why when it can (sign, power of ten, factor of 2, wrong quadrant), and you can try again. Sketch parts are compared with a rubric.
4. **The lab checks you.** Once it's solved, the lab's own value appears next to each answer. Change the setup to explore; **Reset to the problem** puts it back. **Peek** reveals the numbers early, but that attempt then won't count as a clean solve.
5. **Spaced review.** A clean solve (right on the first check, no hints, no peeking) schedules the problem further out: 1, 3, 7, 16, 35 days. A miss brings it back in 10 minutes. **Review due** mixes whatever is due across every exam. Your first attempt uses the worksheet's numbers when a sheet exists; after that the numbers change each time.
6. **Practice exam.** 8 problems across the exam's chapters, weighted toward what you haven't mastered, with a 50-minute timer, no hints and no feedback until you submit. Results show a score by chapter, and each problem opens with its worked solution.

Links open a specific version: `#/e2/field?p=e2.36a.collinear&s=0`. Progress is saved in this browser only. Authoring, answer-key notes and the checks: [PROBLEMS.md](PROBLEMS.md).

Every panel is typeset — including the practice panel, where the statement, hints and worked steps are set as mathematics rather than as ASCII. In the labs: the law at the top of the equation panel, the live rows under it, the explainer at the bottom, and the readout across the bottom of the screen all render their symbols with KaTeX, with the central equation of an explainer set on its own line.

## Setting up by hand

Every number in a setup is typed, not approximated: each charge has a box for **q** in μC, and a row of **x, y, z** boxes in the unit the scene is drawn at. The probe (P) and, in Potential, point A get the same rows. Every slider in the app has a box beside it for an exact value, and typing a value past a slider's end widens the slider rather than clamping it.

The number plane is labeled in real distance and the ticks change with the view, so a square is always a round length (5 cm, 50 cm, 1 m). Charge labs frame the layout automatically when it outgrows the view; **Fit view** reframes on demand. Dragging stays in the lab's work plane — the xy plane a problem is written in, or the xz floor for the 3D scenes — and snaps to half a square, so a drag lands on round numbers. Hold **Alt** to place freely.

## Exams

| Unit | Hash | Labs |
|---|---|---|
| Exam 1 · Ch V, 34–35 | `#/e1/vectors` | Vectors, Force |
| Exam 2 · Ch 36–37 | `#/e2/gauss` | Field, Integrals, Gauss, Conductors |
| Exam 3 · Ch 38–42 | `#/e3/potential` | Potential, Capacitor, Ohm, Power |
| Exam 4 · Ch 43–47 | `#/e4/circuits` | Circuits, Biot–Savart, Ampère, Mag force |
| Exam 5 · Ch 48–52 | `#/e5/faraday` | Faraday, AC |
| Exam 6 · Ch 53–57 | `#/e6/emwave` | EM wave, Polarization |
| Exam 7 · Ch 58–62 | `#/e7/refraction` | Refraction, Mirrors, Lenses |
| Wave optics · Ch 63–65 | `#/wave` | Interference, Diffraction, Thin film |

### Exam 4 labs

- **Circuits** (`#/e4/circuits`) — series, parallel, R₁ + (R₂∥R₃), and the Ch 44 two-battery circuit. Solved by nodal analysis; wires colored by potential, dots show real current, grey chevrons show the assumed direction. Junction and loop rules are evaluated live.
- **Biot–Savart** (`#/e4/biot`) — wire, loop, solenoid. Σ dB is compared with the exact formula for the *same finite* geometry; the ideal limit (μ₀I/2πρ, μ₀nI) is shown separately.
- **Ampère** (`#/e4/ampere`) — circular Amperian loop as a Riemann sum, pieces colored by B·dl. Centered, off-center, wire outside, two wires, inside a thick wire.
- **Mag force** (`#/e4/magforce`) — proton / electron orbits and a helix (Boris integration), velocity selector, F = I L × B, parallel wires.

### Exam 5 labs

- **Faraday** (`#/e5/faraday`) — moving magnet, growing loop, sliding bar, rotating generator. Live ε = −dΦ_B/dt; yellow chevrons are Lenz’s induced current (counterclockwise from +y is +I and makes +B_y).
- **AC** (`#/e5/ac`) — series R, RC, RL, RLC. Phasors and |Z|, φ, f₀. Tune through resonance and I peaks when X_L = X_C.

### Exam 6 labs

- **EM wave** (`#/e6/emwave`) — traveling plane wave, E ŷ, B ẑ, S along +x̂. E/B = c = 1/√(μ₀ε₀). Intensity I = ½ c ε₀ E₀². The drawing is stretched and slowed; the HUD has the real λ, f, and spectrum band (Ch 54).
- **Polarization** (`#/e6/polar`) — Malus I = I₀ cos²θ. Unpolarized → one filter is I₀/2. Crossed filters go dark; a 45° filter in the middle brings back I₀/8.

### Exam 7 labs

- **Refraction** (`#/e7/refraction`) — Snell n₁ sinθ₁ = n₂ sinθ₂, θᵣ = θ₁, TIR past θ_c = sin⁻¹(n₂/n₁). Rotation locked.
- **Mirrors** (`#/e7/mirrors`) — 1/f = 1/d_o + 1/d_i, m = −d_i/d_o. Concave f>0 / convex f<0. Three principal rays.
- **Lenses** (`#/e7/lenses`) — same equation. Converging / diverging, plus Keplerian telescope and compound-microscope two-lens scenarios.

### Wave optics labs

The bench in these three cannot be drawn to scale — slits sit tenths of a millimetre apart and the
screen is metres away — so the geometry is stretched and **the pattern is not**: every band on the
screen is painted pixel by pixel from the real I(θ) for the λ, d, a and L in the panel, and the
spacing you measure there is the Δy the panel reports.

- **Interference** (`#/wave/interference`) — Young's double slit. d sinθ = mλ, Δy = λL/d, the path-difference triangle at the slits, and any order marked on the screen. Switch on a finite slit width and the single-slit envelope appears over the fringes — at a = d/3 the m = 3 order goes missing, which you can watch happen.
- **Diffraction** (`#/wave/diffraction`) — three modes. Single slit (a sinθ = mλ for the *dark* fringes, central width 2λL/a, with the sinc² traced beside the screen), grating (d = 1/N, every order drawn out to m_max = ⌊d/λ⌋, peaks narrowing as 1/N), and Rayleigh resolution (θ_min = 1.22λ/D, two Airy patterns you can slide together until they merge).
- **Thin film** (`#/wave/thinfilm`) — the two reflected rays, each labelled with whether it flips by half a wavelength, the extra path 2nt, and t_min for bright and for dark. The swatch above the film is the colour it sends back in white light. Anti-reflection coating and soap bubble are both scenarios.

Sign conventions: B is along +ŷ in Mag force; Amperian loops and current loops run counterclockwise seen from +y, so current up counts as +I_enc and a positive loop current makes B point up. Faraday uses the same loop convention for Lenz. The EM wave uses E ŷ, B ẑ, travel +x̂ so ŷ × ẑ = x̂.

## Controls

- **P** opens Practice, **Esc** closes it
- Exam tabs **1–7 W**, or `[` / `]`; Back / Forward walk through the labs you visited
- Labs in the current exam: keys `1–9`
- Drag to orbit (Ohm / Power / Circuits / Refraction / Mirrors / Lenses lock rotation), scroll to zoom
- Drag a charge in the work plane; **Shift-drag** moves it along the third axis; **Alt** drops the snap
- Click empty space (Gauss / Field / Potential / Conductors / Biot–Savart) to place the probe
- `Space` plays the integral or sum · `Delete` removes a charge · `+` / `−` add charges · `R` resets the camera



