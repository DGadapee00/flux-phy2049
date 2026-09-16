# FLUX — PHY 2049

Interactive 3D labs for Montgomery’s Calculus Physics II. One app at http://localhost:5174/ — exam units in the top row, labs as tabs, hash URLs so each lab is bookmarkable (`#/e3/potential`).

Private repo: https://github.com/DGadapee00/flux-phy2049 (`main`). Source only — no lecture notes, worksheets, or Canvas files.

## Run

```bash
cd gauss-lab
npm install
npm start
```

Opens at http://localhost:5174/

```bash
npm test                 # physics self-test (no browser) — analytic vs numerical, relative tolerances
node scripts/smoke.mjs   # all labs in a headless browser; original 8 vs scripts/baseline/values.json
node scripts/gallery.mjs [lab ...]   # screenshot every lab × scenario to scripts/output/gallery
node scripts/contact.mjs [regex]     # tile those screenshots into contact sheets for review
```

The self-test checks the code against independent methods rather than against itself: Biot–Savart sums vs closed forms, Ampère loops, Boris-integrated orbits, image-charge surface potentials, Kirchhoff rules on every circuit layout, −ΔΦ/Δt for Faraday, an RK4 simulation of each AC circuit vs its phasor current, and paraxial ray tracing that must land every principal ray on the computed image.

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
| Wave | `#/wave` | Coming — interference, diffraction, thin film |

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

Sign conventions: B is along +ŷ in Mag force; Amperian loops and current loops run counterclockwise seen from +y, so current up counts as +I_enc and a positive loop current makes B point up. Faraday uses the same loop convention for Lenz. The EM wave uses E ŷ, B ẑ, travel +x̂ so ŷ × ẑ = x̂.

## Controls

- Exam tabs **1–7 W**, or `[` / `]`; Back / Forward walk through the labs you visited
- Labs in the current exam: keys `1–9`
- Drag to orbit (Ohm / Power / Circuits / Refraction / Mirrors / Lenses lock rotation), scroll to zoom
- Drag a charge in the xz plane; **Shift-drag** for height
- Click empty space (Gauss / Field / Potential / Conductors / Biot–Savart) to place the probe
- `Space` plays the integral or sum · `Delete` removes a charge · `+` / `−` add charges · `R` resets the camera

Phone layout (< ~720 px) is out of scope for now.

## What Gauss can and cannot do

Φ = Q_in/ε₀ is always true on a closed surface; Φ = EA is not. The coach panel says when symmetry lets you pull |E| out.
