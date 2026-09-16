# FLUX — Gauss & Electrostatics Lab

Interactive 3D simulator for PHY 2049 (Montgomery): Coulomb’s law, electric fields, the continuous-charge integral, electric flux, and Gauss’s law.

## Run

```bash
cd gauss-lab
npm install
npm start
```

If `npm start` is not defined, use:

```bash
npm run dev
```

Opens at http://localhost:5174/

Physics self-test (no browser):

```bash
npm test
```

## Labs

| Tab | What it is for |
|---|---|
| **Gauss** | Closed surface as a Riemann sum of tiles. Gold = outward flux (E·n̂ > 0), blue = inward. Numerical Σ E·ΔA is compared live to Q_in/ε₀. Drag a charge through the surface and watch flux jump only when Q_in changes. |
| **Field** | Point-charge field, field lines, superposition at a probe. E_net = Σ E_i with components. |
| **Integrals** | Finite line (perpendicular bisector) and ring on axis — the two sheet integrals. Play the sum: E_x cancels, E_y builds. |
| **Force** | Coulomb pairs and F_net = q E_others on the selected charge. |
| **Potential** | V = kq/r, ΔPE = qΔV, equipotentials, E = −dV/dx. Shift-click sets point A. |
| **Capacitor** | C = κε₀A/d, battery vs isolated, dielectrics, U = ½CV², breakdown. |
| **Ohm** | I = dq/dt, V = IR, R = ρL/A, drift velocity, ρ(T). |
| **Power** | P = IV = I²R = V²/R, DC vs AC, rms, 120 Vrms → 170 V peak. |

## Controls

- Drag to orbit, scroll to zoom
- Drag a charge in the xz plane; **Shift-drag** to change height
- Click empty space (Gauss / Field) to place the E probe
- `1–8` switch labs · `Space` plays the integral · `Delete` removes the selected charge · `+` / `−` add charges · `R` resets the camera

## What Gauss can and cannot do

The coach panel says when symmetry lets you pull |E| out of the integral (centered point + sphere, long line + cylinder, sheet + pillbox) and when it only gives flux (off-center charge, cube, mixed charges). That is the Exam 2 distinction: **Φ = Q_in/ε₀ is always true on a closed surface; Φ = EA is not.**
