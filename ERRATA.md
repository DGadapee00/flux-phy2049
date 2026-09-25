# Where the app and the answer keys disagree

Twenty-four places where a printed answer and the app's own physics came out differently, or where a
question needs a word of warning. Most were found by the app computing the quantity independently and
flagging the mismatch, and those are recorded in the code beside the problem they belong to
(`grep -rn "note: '" src/problems/bank/`). Entries 10–14 came out of a review of the Exam 3 material
against every printed answer, worked by hand, and entries 15–24 out of the same review of the Exam 4
sheets (Practice 43–47).

**Fourteen look like genuine slips. Four are convention differences or ambiguities where both answers
are defensible. Six are not disagreements at all** — cases where the app cannot see a printed figure,
where the question leaves a direction unstated, or where the wording or the physics deserves a note,
listed so the list is the whole list.

Everything below uses k = 1/(4πε₀) = 8.99 × 10⁹ N·m²/C² unless stated otherwise.

---

## Likely errors in the key

### 1 · Practice 36B #2 — wire length from Q and λ
> A uniform wire carries 0.02 C in total with λ = 10 μC/m. How long is it?

- **Key:** 0.2 m
- **App:** 2 000 m

L = Q/λ = 0.02 C ÷ 1×10⁻⁵ C/m = **2 × 10³ m**. The printed answer is off by 10⁴, which is what you
get from dividing by 10⁻¹ instead of 10⁻⁵ — a μ that did not make it through.

*Template `e2.36b.line-length`.*

### 2 · Practice 36B #4 — surface charge density on a shell
> A conducting shell (outer radius 0.5 m) has 8 μC on its outer surface. Find σ there.

- **Key:** 2.5 × 10⁻⁶ **C**
- **App:** 2.546 × 10⁻⁶ **C/m²**

The number is right; the unit is not. σ = Q/4πR² is a density.

Separately, the problem text reads "net negative charge of positive q", which reads like a
copy-editing leftover and confuses students about the sign.

*Template `e2.36b.shell-sigma`.*

### 3 · Practice 39 — comparing four charge arrangements, working for (b)
> +2q at r₀ and −q at 2r₀, with q = 1 μC and r₀ = 1 m.

- **Key's first term:** +1 800 V
- **Should be:** +18 000 V

k(2q)/r₀ = (9 × 10⁹)(2 × 10⁻⁶)/1 = **18 000 V**. A zero is missing.

**The key's final answer is correct**: 18 000 − 4 500 = 13 500 V, which is what the key states. Only
the intermediate line is wrong — but it is the line students copy while checking their work.

*Template `e3.39.compare-configs`.*

---

## Convention differences, not errors

These are places where the key and the app take a defensible position and land on different signs or
digits. Worth saying explicitly to students, since both appear in textbooks.

### 4 · Practice 36A #15 — field of a point charge
> q = 1.9 μC at r = 0.02 m.

- **Key:** 42 750 N/C — uses k = 9.0 × 10⁹
- **App:** 42 711 N/C — uses k = 1/(4πε₀) = 8.9918 × 10⁹

A 0.09% difference and nothing more. **The key is not wrong.** Flagged only because the app's
grader has to decide how tight a tolerance to accept, and this sets the floor.

### 5 · Practice 38 #4–5 — work, ΔV and ΔU for a pushed charge
> It takes 10 J of work by an external agent to push a 2 C charge through a uniform field.

- ΔV: key **+5 V**, app **+5 V** — agree.
- ΔU: key **−10 J**, app **+10 J**.

The key's sign reads the 10 J as work done *by the field*. The problem says an external agent does
the pushing, so the charge is moved **against** the field and its potential energy rises:
W_ext = ΔU = +10 J.

This is the single most common sign confusion in the chapter, so it is worth resolving one way or
the other in the key rather than leaving both readings live.

*Template `e3.38.work-and-deltaV`.*

### 6 · Practice 39 #8–10 — potential difference between two distances
> A +4 μC charge at the origin; find ΔV between a point 4.0 m away and one 2.0 m away.

- **Key:** +9 000 V
- **App:** +8 992 V, which is the same answer — **given the key's reading of the direction**.

The sheet phrases it "between x = 4.0 m and y = 2.0 m", which does not say which way the subtraction
runs. The key's sign implies V(2 m) − V(4 m), i.e. nearer minus farther. The app states the
direction explicitly in its own problem text to remove the ambiguity.

**Not an error** — a phrasing that costs students marks for guessing the wrong direction.

*Template `e3.39.deltaV-two-radii`.*

---

## Not disagreements — figure-dependent

The app has no way to read a printed figure, so these three were rebuilt or generalised rather than
reproduced. Listed so nothing is hidden.

### 7 · Practice 36C #2 — flux through several Gaussian surfaces
The charge layout was rebuilt from scratch to be consistent with the key's answers; the original
figure's arrangement is different. The physics drilled is the same.

### 8 · Practice 39 #21–25 — reading an equipotential map
The numbers depend on the printed map. The template drills the structure instead — ΔV between
labelled contours, W = qΔV, and W = 0 along an equipotential — with its own generated map.

### 9 · Practice 40 #4–8 — C, Q, V and the field between the plates
The sheet states the charge as 2 nC and the field as 5 650 V/m. Those are consistent with each other
to within rounding (σ/ε₀ with Q = 2 nC), so **the key is fine**; noted only because the chain of
intermediate values has to be read carefully to see it.

---

## Found in the Exam 3 review

Every answer on Practice 38–42 and Worksheet 3 was worked by hand ahead of the Exam 3 date. These are
the ones that disagree.

### 10 · Practice 39 #3 — speed of an electron through 550 V · *slip*
- **Key:** 1.37 × 10⁷ **J**
- **Should be:** **1.39 × 10⁷ m/s**

v = √(2eΔV/m) = √(2 · 1.60×10⁻¹⁹ · 550 / 9.11×10⁻³¹) = 1.39 × 10⁷ m/s. The question asks for a speed,
so the unit is wrong; the digits are also about 1.5% low.

### 11 · Practice 39 #26 — potential past the end of a line charge · *slip*
- **Key:** V = kλ[(L + a)/a]
- **Should be:** V = kλ **ln**[(L + a)/a]

The rod runs from x = a to x = L + a measured from P, and ∫dx/x = ln x. Without the logarithm the
key is not a potential at all (it does not even vanish as the rod shrinks to nothing).

*Template `e3.39.rod-axis-V`, which the Integrals lab checks against a Riemann sum.*

### 12 · Practice 41 #14A — current in a warmed copper wire · *slip*
- **Key:** 12.04 Ω
- **Should be:** **9.97 A**

The part asks how much *current* flows at 50 °C. 12.04 Ω is the resistance at 50 °C, one step short:
I = 120 V / 12.04 Ω = 9.97 A. (Part B, the 1.2 A drop, is right.)

### 13 · Practice 42 #13 — frequency "through the 50 Ω resistor" · *slip*
- **Key:** 60 Hz

"From the above problem … through the 50 Ω resistor" points back to #11, whose current is
(0.80 A) sin(240t): f = 240/2π = **38.2 Hz**. The key's 60 Hz is 377/2π, the frequency in #12 (the
blender). One of the two sentences is wrong; as written the key answers a different problem.

### 14 · Worksheet 3 #11 — work in a field that grows as x² · *ambiguity*
The formula writes $\vec{E} = [(6\ \text{N/(C·m}^2))x^2]\,\hat{x}$, along **+x**, but the figure draws
**E pointing left**. For the −200 μC charge moving from x = 1 m to 2 m that is the whole answer:
**−2.8 mJ** with the formula's direction, **+2.8 mJ** with the figure's. Worth settling before it is
graded.

*Template `e3.38.work-nonuniform`, which follows the formula and says so.*

**Also worth knowing, not an error:** Practice 39 #15's key (309 000 V) rounds √0.08 m to 0.28 m.
Exactly, V = 3.07 × 10⁵ V; both are fine at the precision the sheet works to.

---

## Found in the Exam 4 sheets

Every answer on Practice 43, 44, 45, 46 and 47 was worked by hand, reading battery polarities and
current directions off the figures. Seven printed answers disagree; each sheet item now has a
template whose first case is the sheet's own numbers, so all seven are checked on every build.

### 15 · Practice 43 #18–19 — one resistor alone, two in series beside it · *slip*
- **Key:** I1 = 0.32 A, I2 = 0.24 A, I3 = 0.08 A
- **Should be:** R₁ **0.24 A**, R₂ **0.08 A**, R₃ **0.08 A** (battery 0.32 A)

R₁ sits alone across the 12 V battery: 12/50 = 0.24 A. R₂ and R₃ share the other branch:
12/150 = 0.08 A each. The key's three numbers are the battery, R₁ and the R₂–R₃ branch, listed under
the resistor labels, so "I₁ = 0.32 A" reads as the current in R₁.

*Template `e4.43.branch-currents`.*

### 16 · Practice 43 #21 — three branches, three batteries · *slip*
- **Key:** I1 = 0.02 A, I2 = 0.08 A, I3 = 0.06 A
- **Should be:** R₁ **0.033 A**, R₂ 0.060 A, V₂ **0.093 A**

V₂ sits alone in the middle branch, so it holds the two junctions 20 V apart and each outer branch
is its own loop. Right: (20 − 5)/250 = 0.060 A, as the key says. Left: (20 − 10)/300 = 0.033 A. No
choice of battery polarity gives 0.02 A in R₁ — the only possibilities are 0.033 A and 0.10 A — and
the 0.08 A for V₂ follows from the wrong 0.02 A.

*Template `e4.43.three-branch`.*

### 17 · Practice 43 #22 — two batteries, one shared resistor · *slip*
- **Key:** I1 = 1.55 A, I2 = 0.29 A, I3 = 1.27 A
- **Should be:** R₁ 1.55 A, R₂ **1.27 A**, R₃ **0.284 A**

Both batteries are drawn facing the same way along the bottom wire, so around the outer loop they
oppose. The top junction sits at 1.14 V: R₂ carries (−9 − 1.14)/8 = −1.27 A and R₃ carries
1.14/4 = 0.284 A. The key swaps I₂ and I₃, and 0.284 rounds to 0.28, not 0.29. (The sheet also lists
V₃ = 5 V, which is not in the circuit.)

*Template `e4.43.two-battery-bridge`, which the Circuits lab solves independently. It names the
resistors as the lab draws them (middle R₂, right R₃) and says so beside the sheet's case.*

### 18 · Practice 44 #5 — power in the load resistor · *slip*
- **Key:** 344.4 W
- **Should be:** **444 W**

With 8.3 A drawn from the 95.0 V, 5.0 Ω battery, the terminal voltage is 95.0 − 41.5 = 53.5 V and
the resistor gets V_ab·I = 53.5 × 8.3 = 444 W. The key's 344.4 W is I²r = (8.3)²(5.0), the power lost
inside the battery.

*Template `e4.44.battery-terminal`.*

### 19 · Practice 44 #9 — charge on C₃ · *slip*
- **Key:** q3 = 1.07 × 10⁻⁶ C
- **Should be:** **1.07 × 10⁻⁵ C**

C₂ and C₃ share 5.33 V, so q₃ = (2.0 μF)(5.33 V) = 10.7 μC. The exponent is off by one; the check
q₁ = q₂ + q₃ (26.7 = 16 + 10.7 μC) shows it.

*Template `e3.40.combo`, which now asks for q₃ too.*

### 20 · Practice 44 #16C — voltage across the resistor while discharging · *slip*
- **Key:** 18.6 V
- **Should be:** **5.4 V**

This circuit is just the capacitor, a switch and the resistor — no battery — so the loop rule makes
V_R = V_C at every instant: 5.4 V at 30 s. The key's 18.6 V is 24 − 5.4, the resistor's share in the
charging circuit of #14. The sheet also calls the part a "50 μC capacitor"; it means 50 μF.

*Template `e4.44.rc-discharge-state`.*

### 21 · Practice 46 #7 — force on a proton at 7000 m/s · *slip*
- **Key:** 6.27 × 10⁻¹⁶ N
- **Should be:** **6.72 × 10⁻¹⁶ N**

F = (1.6 × 10⁻¹⁹ C)(7000 m/s)(0.60 T) = 6.72 × 10⁻¹⁶ N — the key has two digits transposed.

*Template `e4.46.qvB-solve`.*

### 22 · Practice 46 #14, Practice 47 #5–7 — directions the question does not fix · *unstated*
The keys give "into the page" or "out of page" for four answers whose questions state no current
direction or geometry (#14 has no figure at all; 47 #5 asks only for the size). The sizes all check:
0.208 N, 6.67 × 10⁻⁷ T, 3.0 × 10⁻⁵ T and 6.67 × 10⁻⁶ T, and those are what the templates grade.

### 23 · Practice 47 #17 — an iron-core solenoid at 78 T · *physics note*
The arithmetic is right for the stated μ = 6.5 × 10⁻³ T·m/A: B = μnI = 78 T. But iron saturates near
2 T, so a real iron core would give nowhere near 78 T; B = μnI only holds well below saturation. The
template gives the key's number and says so in the worked solution.

### 24 · Practice 44 #10–12 — the same option twice · *wording*
Options A and C are identical ("equal to the battery's terminal voltage") in all three questions, so
#11's answer is both A and C. The template offers three distinct choices.

---

## How these were found

Not by proofreading. Every printed answer in the bank is stored as a test fixture, and
`npm run test` recomputes each one from the app's own physics — which is itself checked against a
second independent method in 413 further assertions. A mismatch fails the build. Entries 1–9 are
the mismatches that survived investigation; everything else in the bank agrees with the key to within
rounding. Entries 10–14 were found by working the Exam 3 sheets by hand, and the ones with a
template (11 and 14) are now checked the same way. Entries 15–24 were found by working the Exam 4
sheets by hand; every one of them has a template, so all are checked on every build.
