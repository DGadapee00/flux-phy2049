# FLUX — PHY 2049

Interactive 3D labs for Montgomery’s Calculus Physics II. One app at http://localhost:5174/ — exam units in the top row, labs as tabs, hash URLs so each lab is bookmarkable (`#/e3/potential`).

Private GitHub remote (create the empty repo, then): `git remote add origin https://github.com/DGadapee00/flux-phy2049.git`

## Run

```bash
cd gauss-lab
npm install
npm start
```

Opens at http://localhost:5174/

```bash
npm test          # physics self-test (no browser)
node scripts/smoke.mjs   # 8 labs vs scripts/baseline/values.json
```

## Exams

| Unit | Hash | Labs |
|---|---|---|
| Exam 1 · Ch V, 34–35 | `#/e1/force` | Force (Vectors next) |
| Exam 2 · Ch 36–37 | `#/e2/gauss` | Field, Integrals, Gauss (Conductors next) |
| Exam 3 · Ch 38–42 | `#/e3/potential` | Potential, Capacitor, Ohm, Power |
| Exam 4–7, Wave | `#/e4` … `#/wave` | Coming — Biot–Savart, Ampère, Faraday, optics |

## Controls

- Exam tabs **1–7 W**, or `[` / `]`
- Labs in the current exam: keys `1–9`
- Drag to orbit (Ohm / Power lock rotation), scroll to zoom
- Drag a charge in the xz plane; **Shift-drag** for height
- Click empty space (Gauss / Field / Potential) to place the probe
- `Space` plays the integral · `Delete` removes a charge · `+` / `−` add charges · `R` resets the camera

Phone layout (< ~720 px) is out of scope for now.

## What Gauss can and cannot do

Φ = Q_in/ε₀ is always true on a closed surface; Φ = EA is not. The coach panel says when symmetry lets you pull |E| out.
