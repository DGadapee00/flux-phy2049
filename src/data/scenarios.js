let nextId = 1;

function ch(q_uC, x, y, z, extra = {}) {
  return { id: nextId++, q: q_uC * 1e-6, x, y, z, ...extra };
}

function resetIds() {
  nextId = 1;
}

const O = { x: 0, y: 0, z: 0 };

function lineCharges(lambda_uC_m, y0, y1, n) {
  const lambda = lambda_uC_m * 1e-6;
  const L = y1 - y0;
  const dy = L / n;
  const out = [];
  for (let i = 0; i < n; i++) {
    out.push({
      id: nextId++,
      q: lambda * dy,
      x: 0,
      y: y0 + (i + 0.5) * dy,
      z: 0,
      small: true,
    });
  }
  return out;
}

function sheetCharges(sigma_uC, half, n) {
  const sigma = sigma_uC * 1e-6;
  const ds = (2 * half) / n;
  const dq = sigma * ds * ds;
  const out = [];
  for (let i = 0; i < n; i++) {
    const x = -half + (i + 0.5) * ds;
    for (let j = 0; j < n; j++) {
      const z = -half + (j + 0.5) * ds;
      out.push({ id: nextId++, q: dq, x, y: 0, z, small: true });
    }
  }
  return out;
}

export const SCENARIOS = {
  gauss: [
    {
      id: 'center',
      name: 'Centered point charge',
      surface: { type: 'sphere', R: 0.45, L: 0.8, tilt: 0, origin: { ...O } },
      extraE: { x: 0, y: 0, z: 0 },
      charges: () => [ch(1, 0, 0, 0)],
      show: { flux: true, E: false, nHat: false, lines: false, forces: false },
    },
    {
      id: 'offcenter',
      name: 'Off-center, still inside',
      surface: { type: 'sphere', R: 0.5, L: 0.8, tilt: 0, origin: { ...O } },
      extraE: { x: 0, y: 0, z: 0 },
      charges: () => [ch(1, 0.34, 0.06, 0.16)],
      show: { flux: true, E: false, nHat: false, lines: false, forces: false },
    },
    {
      id: 'outside',
      name: 'Charge outside (Φ → 0)',
      surface: { type: 'sphere', R: 0.4, L: 0.8, tilt: 0, origin: { ...O } },
      extraE: { x: 0, y: 0, z: 0 },
      charges: () => [ch(1.5, 0.72, 0.08, 0.05)],
      show: { flux: true, E: false, nHat: false, lines: false, forces: false },
    },
    {
      id: 'dipole-in',
      name: 'Dipole inside (Q_in = 0)',
      surface: { type: 'sphere', R: 0.5, L: 0.8, tilt: 0, origin: { ...O } },
      extraE: { x: 0, y: 0, z: 0 },
      charges: () => [ch(1, 0.16, 0.04, 0), ch(-1, -0.16, -0.02, 0.04)],
      show: { flux: true, E: false, nHat: false, lines: true, forces: false },
    },
    {
      id: 'one-in-one-out',
      name: 'One in, one out',
      surface: { type: 'sphere', R: 0.42, L: 0.8, tilt: 0, origin: { ...O } },
      extraE: { x: 0, y: 0, z: 0 },
      charges: () => [ch(1, 0.1, 0, 0), ch(-1, 0.7, 0.05, 0.1)],
      show: { flux: true, E: false, nHat: false, lines: true, forces: false },
    },
    {
      id: 'line-cyl',
      name: 'Line + cylinder',
      surface: { type: 'cylinder', R: 0.32, L: 0.55, tilt: 0, origin: { ...O } },
      extraE: { x: 0, y: 0, z: 0 },
      charges: () => lineCharges(1.5, -0.7, 0.7, 18),
      show: { flux: true, E: true, nHat: false, lines: false, forces: false },
    },
    {
      id: 'sheet-pill',
      name: 'Sheet + pillbox',
      surface: { type: 'pillbox', R: 0.28, L: 0.18, tilt: 0, origin: { ...O } },
      extraE: { x: 0, y: 0, z: 0 },
      charges: () => sheetCharges(2, 0.55, 7),
      show: { flux: true, E: true, nHat: false, lines: false, forces: false },
    },
    {
      id: 'cube',
      name: 'Cube around a charge',
      surface: { type: 'cube', R: 0.38, L: 0.8, tilt: 0, origin: { ...O } },
      extraE: { x: 0, y: 0, z: 0 },
      charges: () => [ch(1, 0, 0, 0)],
      show: { flux: true, E: false, nHat: true, lines: false, forces: false },
    },
    {
      id: 'uniform-square',
      name: 'Uniform E through a square',
      surface: { type: 'square', R: 0.4, L: 0.8, tilt: 0.4, origin: { ...O } },
      extraE: { x: 0, y: 8e4, z: 0 },
      charges: () => [],
      show: { flux: true, E: true, nHat: true, lines: false, forces: false },
    },
  ],
  field: [
    {
      id: 'single-plus',
      name: 'Single + charge',
      extraE: { x: 0, y: 0, z: 0 },
      charges: () => [ch(1, 0, 0, 0)],
      probe: { x: 0.45, y: 0.2, z: 0 },
      show: { flux: false, E: true, nHat: false, lines: true, forces: false },
    },
    {
      id: 'single-minus',
      name: 'Single − charge',
      extraE: { x: 0, y: 0, z: 0 },
      charges: () => [ch(-1, 0, 0, 0)],
      probe: { x: 0.45, y: 0.2, z: 0 },
      show: { flux: false, E: true, nHat: false, lines: true, forces: false },
    },
    {
      id: 'dipole',
      name: 'Electric dipole',
      extraE: { x: 0, y: 0, z: 0 },
      charges: () => [ch(1.2, -0.28, 0, 0), ch(-1.2, 0.28, 0, 0)],
      probe: { x: 0, y: 0.4, z: 0 },
      show: { flux: false, E: true, nHat: false, lines: true, forces: false },
    },
    {
      id: 'two-plus',
      name: 'Two positives',
      extraE: { x: 0, y: 0, z: 0 },
      charges: () => [ch(1, -0.3, 0, 0), ch(1, 0.3, 0, 0)],
      probe: { x: 0, y: 0.35, z: 0 },
      show: { flux: false, E: true, nHat: false, lines: true, forces: false },
    },
    {
      id: 'quad',
      name: 'Three-charge superposition',
      extraE: { x: 0, y: 0, z: 0 },
      charges: () => [ch(2, -0.35, 0.1, 0), ch(-1, 0.3, 0.15, 0), ch(1, 0.05, -0.32, 0)],
      probe: { x: 0.05, y: 0.38, z: 0 },
      show: { flux: false, E: true, nHat: false, lines: true, forces: false },
    },
  ],
  integral: [
    {
      id: 'rod',
      name: 'Finite line, P on bisector',
      integral: { kind: 'rod', L: 0.8, lambda: 2e-6, d: 0.35, n: 20, x0: 0, Q: 2e-6, a: 0.3, y: 0.4 },
    },
    {
      // The symmetry case is the one every textbook does; this is the one that shows what the
      // symmetry was buying. Nothing cancels, so E_x survives and E points away from the rod.
      id: 'rod-end',
      name: 'Finite line, P above one end',
      integral: { kind: 'rod', L: 0.8, lambda: 2e-6, d: 0.35, n: 20, x0: 0.4, Q: 2e-6, a: 0.3, y: 0.4 },
    },
    {
      id: 'rod-off',
      name: 'Finite line, P off the end',
      integral: { kind: 'rod', L: 0.8, lambda: 2e-6, d: 0.35, n: 20, x0: 0.75, Q: 2e-6, a: 0.3, y: 0.4 },
    },
    {
      id: 'ring',
      name: 'Ring, P on axis',
      integral: { kind: 'ring', L: 0.8, lambda: 2e-6, d: 0.35, n: 24, x0: 0, Q: 2.5e-6, a: 0.32, y: 0.38, span: 2 * Math.PI, R: 0.35 },
    },
    {
      // The classic: at the centre of a semicircle E = 2kλ/R, pointing away from the arc.
      id: 'half-ring',
      name: 'Half ring, P at the centre',
      integral: { kind: 'ring', L: 0.8, lambda: 2e-6, d: 0.35, n: 24, x0: 0, Q: 2.5e-6, a: 0.32, y: 0, span: Math.PI, R: 0.35 },
    },
    {
      id: 'half-ring-axis',
      name: 'Half ring, P up the axis',
      integral: { kind: 'ring', L: 0.8, lambda: 2e-6, d: 0.35, n: 24, x0: 0, Q: 2.5e-6, a: 0.32, y: 0.38, span: Math.PI, R: 0.35 },
    },
    {
      id: 'disk',
      name: 'Circular plate, P on axis',
      integral: { kind: 'disk', L: 0.8, lambda: 2e-6, d: 0.35, n: 24, x0: 0, Q: 2.5e-6, a: 0.32, y: 0.4, span: 2 * Math.PI, R: 0.35 },
    },
    {
      // Close to a wide plate the bracket goes to 1 and the answer stops depending on distance.
      id: 'disk-sheet',
      name: 'Plate up close — the sheet limit',
      integral: { kind: 'disk', L: 0.8, lambda: 2e-6, d: 0.35, n: 24, x0: 0, Q: 2.5e-6, a: 0.32, y: 0.06, span: 2 * Math.PI, R: 1.0 },
    },
  ],
  force: [
    {
      id: 'pair-repel',
      name: 'Two positives (repel)',
      extraE: { x: 0, y: 0, z: 0 },
      charges: () => [ch(2, -0.25, 0, 0), ch(1, 0.28, 0.05, 0)],
      show: { flux: false, E: false, nHat: false, lines: false, forces: true },
    },
    {
      id: 'pair-attract',
      name: 'Opposite charges (attract)',
      extraE: { x: 0, y: 0, z: 0 },
      charges: () => [ch(1.5, -0.25, 0, 0), ch(-1.5, 0.28, 0.04, 0)],
      show: { flux: false, E: false, nHat: false, lines: false, forces: true },
    },
    {
      id: 'three',
      name: 'Net force on the middle charge',
      extraE: { x: 0, y: 0, z: 0 },
      charges: () => [ch(2, -0.4, 0, 0), ch(-1, 0, 0.08, 0), ch(1.5, 0.38, -0.05, 0)],
      show: { flux: false, E: false, nHat: false, lines: false, forces: true },
      selected: 1,
    },
  ],
  potential: [
    {
      id: 'v-plus',
      name: 'V = kq/r for a point charge',
      extraE: { x: 0, y: 0, z: 0 },
      charges: () => [ch(1, 0, 0, 0)],
      probe: { x: 0.5, y: 0, z: 0 },
      pathA: { x: 1, y: 0, z: 0 },
      show: { flux: false, E: true, nHat: false, lines: true, forces: false, equipot: true },
    },
    {
      id: 'v-dipole',
      name: 'Dipole — V = 0 on the midplane',
      extraE: { x: 0, y: 0, z: 0 },
      charges: () => [ch(1.5, -0.28, 0, 0), ch(-1.5, 0.28, 0, 0)],
      probe: { x: 0, y: 0.35, z: 0 },
      pathA: { x: 0.45, y: 0, z: 0 },
      show: { flux: false, E: true, nHat: false, lines: true, forces: false, equipot: true },
    },
    {
      id: 'v-ch39a',
      name: 'Ch 39 example (a) — V_P = 0',
      extraE: { x: 0, y: 0, z: 0 },
      charges: () => [ch(2, -0.8, 0, 0), ch(-1, 0, 0.4, 0)],
      probe: { x: 0, y: 0, z: 0 },
      pathA: { x: 0.4, y: 0, z: 0 },
      show: { flux: false, E: false, nHat: false, lines: true, forces: false, equipot: true },
    },
    {
      id: 'v-ch39b',
      name: 'Ch 39 example (b) — potentials add',
      extraE: { x: 0, y: 0, z: 0 },
      charges: () => [ch(2, -0.4, 0, 0), ch(-1, 0, 0.8, 0)],
      probe: { x: 0, y: 0, z: 0 },
      pathA: { x: 0.4, y: 0, z: 0 },
      show: { flux: false, E: false, nHat: false, lines: true, forces: false, equipot: true },
    },
    {
      id: 'v-plates',
      name: 'Uniform E — ΔV = −E Δx',
      extraE: { x: 2000, y: 0, z: 0 },
      charges: () => [],
      probe: { x: -0.05, y: 0, z: 0 },
      pathA: { x: 0.05, y: 0, z: 0 },
      show: { flux: false, E: true, nHat: false, lines: false, forces: false, equipot: true },
    },
  ],
  capacitor: [
    {
      id: 'cap-12v',
      name: '12 V parallel plates (air)',
      cap: { A: 0.04, d: 0.05, V: 12, Q0: 8.5e-12, mode: 'battery', dielectric: 'air', inserted: true, fill: 1 },
    },
    {
      id: 'cap-hw',
      name: 'Ch 40: 1.5 m², 2 mm, 12 V',
      cap: { A: 1.5, d: 0.002, V: 12, Q0: 8e-8, mode: 'battery', dielectric: 'air', inserted: true, fill: 1 },
    },
    {
      id: 'cap-nylon',
      name: 'Insert nylon (κ = 410), V held',
      cap: { A: 1.5, d: 0.002, V: 12, Q0: 8e-8, mode: 'battery', dielectric: 'nylon410', inserted: true, fill: 1 },
    },
    {
      id: 'cap-isolated',
      name: 'Disconnect, then insert teflon',
      cap: { A: 0.04, d: 0.05, V: 12, Q0: 8.496e-11, mode: 'isolated', dielectric: 'teflon', inserted: true, fill: 1 },
    },
    {
      id: 'cap-defib',
      name: 'Defibrillator 30 μF at 5 kV',
      cap: { A: 0.04, d: 0.05, V: 5000, Q0: 0.15, Cset: 30e-6, mode: 'battery', dielectric: 'air', inserted: true, fill: 1 },
    },
  ],
  ohm: [
    {
      id: 'ohm-headlight',
      name: 'Car headlight 12 V / 8 Ω',
      // A filament 0.4 m long (coiled) and 60 μm across: ρL/A really is 8 Ω, so the wire's own
      // numbers — E = V/L = ρJ, the drift speed — all describe the headlight on screen.
      ohm: { material: 'tungsten', L: 0.4, A: 2.8e-9, V: 12, T: 20 },
    },
    {
      id: 'ohm-cu100',
      name: 'Ch 41: 100 m copper wire, 9 V',
      ohm: { material: 'copper', L: 100, A: 3.3e-6, V: 9, T: 20 },
    },
    {
      id: 'ohm-nichrome',
      name: 'Nichrome heater, heat it up',
      ohm: { material: 'nichrome', L: 10, A: 2e-7, V: 120, T: 20 },
    },
    {
      id: 'ohm-hot',
      name: 'Nichrome at 1000 °C',
      ohm: { material: 'nichrome', L: 10, A: 2e-7, V: 120, T: 1000 },
    },
  ],
  power: [
    {
      id: 'pwr-60',
      name: '60 W bulb · 120 V DC',
      power: { mode: 'dc', V: 120, Vrms: 120, R: 240, f: 60, load: 'bulb' },
    },
    {
      id: 'pwr-100',
      name: '100 W bulb · 120 V DC (lower R, brighter)',
      power: { mode: 'dc', V: 120, Vrms: 120, R: 144, f: 60, load: 'bulb' },
    },
    {
      id: 'pwr-ac',
      name: 'Household AC · 60 W bulb on 120 V rms',
      power: { mode: 'ac', V: 120, Vrms: 120, R: 240, f: 60, load: 'bulb' },
    },
    {
      id: 'pwr-heater',
      name: 'Space heater · 18 Ω on 120 V',
      power: { mode: 'dc', V: 120, Vrms: 120, R: 18, f: 60, load: 'heater' },
    },
  ],
};

export function applyScenario(lab, id, state) {
  const list = SCENARIOS[lab];
  const sc = list.find((s) => s.id === id) || list[0];
  resetIds();
  state.scenarioId = sc.id;
  if (sc.surface) {
    state.surface = {
      type: sc.surface.type,
      R: sc.surface.R,
      L: sc.surface.L,
      tilt: sc.surface.tilt || 0,
      origin: { ...sc.surface.origin },
    };
  }
  if (sc.extraE) state.extraE = { ...sc.extraE };
  if (sc.charges) state.charges = sc.charges();
  if (sc.show) Object.assign(state.show, sc.show);
  if (sc.probe) Object.assign(state.probe, sc.probe);
  if (sc.integral) Object.assign(state.integral, sc.integral);
  if (sc.cap) state.cap = { ...sc.cap };
  if (sc.ohm) state.ohm = { ...sc.ohm };
  if (sc.power) state.power = { ...sc.power };
  if (sc.pathA) state.pathA = { ...sc.pathA };
  state.probeTag = sc.probeTag || '';
  state.hideProbeTag = false;
  if (lab === 'potential') {
    state.marks = (sc.marks || []).map((m) => ({ ...m }));
    state.markShow = sc.markShow || '';
    state.hideA = !!sc.hideA;
    state.probeName = sc.probeName || '';
  }
  if (lab === 'capacitor' || lab === 'ohm' || lab === 'power') {
    if (!sc.charges) state.charges = [];
  }
  if (typeof sc.selected === 'number' && state.charges[sc.selected]) {
    state.selectedId = state.charges[sc.selected].id;
  } else {
    state.selectedId = state.charges[0]?.id ?? null;
  }
  state.anim = { playing: false, i: 0, acc: 0 };
  state.dirty = true;
  return sc;
}

export function newCharge(q_uC, existing) {
  const n = existing.length;
  const ang = n * 1.2;
  const r = 0.28 + (n % 4) * 0.08;
  return {
    id: nextId++,
    q: q_uC * 1e-6,
    x: r * Math.cos(ang),
    y: 0.02 * n,
    z: r * Math.sin(ang),
  };
}
