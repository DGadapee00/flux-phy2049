/**
 * Fixed DC layouts for the Circuits lab (Ch 43–44). Pure data so selftest.js checks the same
 * netlists the scene draws.
 *
 * nodes: id → [x, y] in scene units (flat schematic, camera looks down −z)
 * edges: { id, type: 'R' | 'V' | 'W', a, b, value, n (subscript), side (+1/−1 label side), jname }
 *   V: + terminal at b.  Current I is reported a → b.
 * loops: [{ name, path: [[edgeId, +1 | −1]] }]  (−1 = walk the edge b → a)
 * junction: node id for the junction-rule readout
 */
export const CIRCUITS = [
  {
    id: 'series',
    name: 'Series — one path, same current',
    ground: 'bl',
    nodes: { bl: [-2.6, -1.1], tl: [-2.6, 1.6], tm: [0, 1.6], tr: [2.6, 1.6], br: [2.6, -1.1] },
    edges: [
      { id: 'E1', type: 'V', a: 'bl', b: 'tl', value: 12, n: 1, side: -1 },
      { id: 'R1', type: 'R', a: 'tl', b: 'tm', value: 2, n: 1, side: 1 },
      { id: 'R2', type: 'R', a: 'tm', b: 'tr', value: 4, n: 2, side: 1 },
      { id: 'R3', type: 'R', a: 'tr', b: 'br', value: 6, n: 3, side: 1 },
      { id: 'w1', type: 'W', a: 'br', b: 'bl' },
    ],
    loops: [{ name: 'Loop', path: [['E1', 1], ['R1', 1], ['R2', 1], ['R3', 1], ['w1', 1]] }],
    junction: null,
    req: 'series',
  },
  {
    id: 'parallel',
    name: 'Parallel — same V, currents add',
    ground: 'bl',
    nodes: {
      bl: [-2.6, -1.1],
      tl: [-2.6, 1.6],
      t1: [-0.8, 1.6],
      t2: [0.8, 1.6],
      t3: [2.4, 1.6],
      b1: [-0.8, -1.1],
      b2: [0.8, -1.1],
      b3: [2.4, -1.1],
    },
    edges: [
      { id: 'E1', type: 'V', a: 'bl', b: 'tl', value: 12, n: 1, side: -1 },
      { id: 'wA', type: 'W', a: 'tl', b: 't1', jname: String.raw`I` },
      { id: 'wB', type: 'W', a: 't1', b: 't2', jname: String.raw`I_2 + I_3` },
      { id: 'wC', type: 'W', a: 't2', b: 't3' },
      { id: 'R1', type: 'R', a: 't1', b: 'b1', value: 3, n: 1, side: 1 },
      { id: 'R2', type: 'R', a: 't2', b: 'b2', value: 6, n: 2, side: 1 },
      { id: 'R3', type: 'R', a: 't3', b: 'b3', value: 12, n: 3, side: 1 },
      { id: 'wD', type: 'W', a: 'b3', b: 'b2' },
      { id: 'wE', type: 'W', a: 'b2', b: 'b1' },
      { id: 'wF', type: 'W', a: 'b1', b: 'bl' },
    ],
    loops: [
      { name: 'Outer left', path: [['E1', 1], ['wA', 1], ['R1', 1], ['wF', 1]] },
      { name: 'R₁–R₂ loop', path: [['wB', 1], ['R2', 1], ['wE', 1], ['R1', -1]] },
    ],
    junction: 't1',
    req: 'parallel',
  },
  {
    id: 'combo',
    name: 'Series + parallel — R₁ + (R₂ ∥ R₃)',
    ground: 'bl',
    nodes: { bl: [-2.6, -1.1], tl: [-2.6, 1.6], t1: [0, 1.6], t2: [2.4, 1.6], b1: [0, -1.1], b2: [2.4, -1.1] },
    edges: [
      { id: 'E1', type: 'V', a: 'bl', b: 'tl', value: 12, n: 1, side: -1 },
      { id: 'R1', type: 'R', a: 'tl', b: 't1', value: 4, n: 1, side: 1 },
      { id: 'R2', type: 'R', a: 't1', b: 'b1', value: 6, n: 2, side: 1 },
      { id: 'wB', type: 'W', a: 't1', b: 't2', jname: String.raw`I_3` },
      { id: 'R3', type: 'R', a: 't2', b: 'b2', value: 3, n: 3, side: 1 },
      { id: 'wE', type: 'W', a: 'b2', b: 'b1' },
      { id: 'wF', type: 'W', a: 'b1', b: 'bl' },
    ],
    loops: [
      { name: 'Left loop', path: [['E1', 1], ['R1', 1], ['R2', 1], ['wF', 1]] },
      { name: 'Right loop', path: [['wB', 1], ['R3', 1], ['wE', 1], ['R2', -1]] },
    ],
    junction: 't1',
    req: 'combo',
  },
  {
    id: 'twoloop',
    name: 'Two loops, two batteries (Ch 44)',
    ground: 'lb',
    nodes: { lb: [-2.6, -1.1], lt: [-2.6, 1.6], mt: [0, 1.6], mb: [0, -1.1], rt: [2.6, 1.6], rb: [2.6, -1.1] },
    edges: [
      { id: 'E1', type: 'V', a: 'lb', b: 'lt', value: 12, n: 1, side: -1 },
      { id: 'R1', type: 'R', a: 'lt', b: 'mt', value: 2, n: 1, side: 1 },
      { id: 'R2', type: 'R', a: 'mt', b: 'mb', value: 4, n: 2, side: 1 },
      // I₃ assumed to flow *into* the junction, like I₁ — the usual textbook guess. It comes out negative.
      { id: 'R3', type: 'R', a: 'rt', b: 'mt', value: 3, n: 3, side: -1 },
      { id: 'E2', type: 'V', a: 'rb', b: 'rt', value: 6, n: 2, side: 1 },
      { id: 'wL', type: 'W', a: 'mb', b: 'lb' },
      { id: 'wR', type: 'W', a: 'rb', b: 'mb' },
    ],
    loops: [
      { name: 'Left loop', path: [['E1', 1], ['R1', 1], ['R2', 1], ['wL', 1]] },
      { name: 'Right loop', path: [['R2', -1], ['R3', -1], ['E2', -1], ['wR', 1]] },
    ],
    junction: 'mt',
    req: null,
  },
  {
    id: 'series4',
    name: 'Four in series',
    ground: 'bl',
    nodes: { bl: [-2.6, -1.1], tl: [-2.6, 1.6], tm: [0, 1.6], tr: [2.6, 1.6], br: [2.6, -1.1] },
    edges: [
      { id: 'E1', type: 'V', a: 'bl', b: 'tl', value: 12, n: 1, side: -1 },
      { id: 'R1', type: 'R', a: 'tl', b: 'tm', value: 2, n: 1, side: 1 },
      { id: 'R2', type: 'R', a: 'tm', b: 'tr', value: 4, n: 2, side: 1 },
      { id: 'R3', type: 'R', a: 'tr', b: 'br', value: 6, n: 3, side: 1 },
      { id: 'R4', type: 'R', a: 'br', b: 'bl', value: 8, n: 4, side: 1 },
    ],
    loops: [{ name: 'Loop', path: [['E1', 1], ['R1', 1], ['R2', 1], ['R3', 1], ['R4', 1]] }],
    junction: null,
    req: 'series4',
  },
  {
    id: 'parallel4',
    name: 'Four in parallel',
    ground: 'bl',
    // Resistors alternate between the upper and lower half of their branch, so each label sits beside
    // a plain wire rather than on top of the next resistor.
    nodes: {
      bl: [-3, -1.1], tl: [-3, 1.6],
      t1: [-1.5, 1.6], t2: [0, 1.6], t3: [1.5, 1.6], t4: [3, 1.6],
      m1: [-1.5, 0.25], m2: [0, 0.25], m3: [1.5, 0.25], m4: [3, 0.25],
      b1: [-1.5, -1.1], b2: [0, -1.1], b3: [1.5, -1.1], b4: [3, -1.1],
    },
    edges: [
      { id: 'E1', type: 'V', a: 'bl', b: 'tl', value: 12, n: 1, side: -1 },
      { id: 'wA', type: 'W', a: 'tl', b: 't1', jname: String.raw`I` },
      { id: 'wB', type: 'W', a: 't1', b: 't2', jname: String.raw`I_2 + I_3 + I_4` },
      { id: 'wC', type: 'W', a: 't2', b: 't3' },
      { id: 'wD', type: 'W', a: 't3', b: 't4' },
      { id: 'R1', type: 'R', a: 't1', b: 'm1', value: 3, n: 1, side: 1 },
      { id: 'v1', type: 'W', a: 'm1', b: 'b1' },
      { id: 'v2', type: 'W', a: 't2', b: 'm2' },
      { id: 'R2', type: 'R', a: 'm2', b: 'b2', value: 6, n: 2, side: 1 },
      { id: 'R3', type: 'R', a: 't3', b: 'm3', value: 12, n: 3, side: 1 },
      { id: 'v3', type: 'W', a: 'm3', b: 'b3' },
      { id: 'v4', type: 'W', a: 't4', b: 'm4' },
      { id: 'R4', type: 'R', a: 'm4', b: 'b4', value: 4, n: 4, side: 1 },
      { id: 'wE', type: 'W', a: 'b4', b: 'b3' },
      { id: 'wF', type: 'W', a: 'b3', b: 'b2' },
      { id: 'wG', type: 'W', a: 'b2', b: 'b1' },
      { id: 'wH', type: 'W', a: 'b1', b: 'bl' },
    ],
    loops: [
      { name: 'Outer left', path: [['E1', 1], ['wA', 1], ['R1', 1], ['v1', 1], ['wH', 1]] },
      { name: 'R₁–R₂ loop', path: [['wB', 1], ['v2', 1], ['R2', 1], ['wG', 1], ['v1', -1], ['R1', -1]] },
    ],
    junction: 't1',
    req: 'parallel4',
  },
  {
    id: 'pair',
    name: 'Two in parallel',
    ground: 'bl',
    nodes: { bl: [-2.6, -1.1], tl: [-2.6, 1.6], t1: [0, 1.6], t2: [2.4, 1.6], b1: [0, -1.1], b2: [2.4, -1.1] },
    edges: [
      { id: 'E1', type: 'V', a: 'bl', b: 'tl', value: 12, n: 1, side: -1 },
      { id: 'wA', type: 'W', a: 'tl', b: 't1', jname: String.raw`I` },
      { id: 'R1', type: 'R', a: 't1', b: 'b1', value: 4, n: 1, side: 1 },
      { id: 'wB', type: 'W', a: 't1', b: 't2', jname: String.raw`I_2` },
      { id: 'R2', type: 'R', a: 't2', b: 'b2', value: 12, n: 2, side: 1 },
      { id: 'wE', type: 'W', a: 'b2', b: 'b1' },
      { id: 'wF', type: 'W', a: 'b1', b: 'bl' },
    ],
    loops: [
      { name: 'Left loop', path: [['E1', 1], ['wA', 1], ['R1', 1], ['wF', 1]] },
      { name: 'Right loop', path: [['wB', 1], ['R2', 1], ['wE', 1], ['R1', -1]] },
    ],
    junction: 't1',
    req: 'pair',
  },
  {
    id: 'ladder',
    name: 'Series, parallel, series — R₁ + (R₂ ∥ R₃) + R₄',
    ground: 'bl',
    nodes: { bl: [-2.6, -1.1], tl: [-2.6, 1.6], t1: [0, 1.6], t2: [2.4, 1.6], b1: [0, -1.1], b2: [2.4, -1.1] },
    edges: [
      { id: 'E1', type: 'V', a: 'bl', b: 'tl', value: 12, n: 1, side: -1 },
      { id: 'R1', type: 'R', a: 'tl', b: 't1', value: 2, n: 1, side: 1 },
      { id: 'R2', type: 'R', a: 't1', b: 'b1', value: 6, n: 2, side: 1 },
      { id: 'wB', type: 'W', a: 't1', b: 't2', jname: String.raw`I_3` },
      { id: 'R3', type: 'R', a: 't2', b: 'b2', value: 3, n: 3, side: 1 },
      { id: 'wE', type: 'W', a: 'b2', b: 'b1' },
      { id: 'R4', type: 'R', a: 'b1', b: 'bl', value: 4, n: 4, side: 1 },
    ],
    loops: [
      { name: 'Left loop', path: [['E1', 1], ['R1', 1], ['R2', 1], ['R4', 1]] },
      { name: 'Right loop', path: [['wB', 1], ['R3', 1], ['wE', 1], ['R2', -1]] },
    ],
    junction: 't1',
    req: 'ladder',
  },
  {
    id: 'split',
    name: 'Two branches — R₁ ∥ (R₂ + R₃)',
    ground: 'bl',
    nodes: { bl: [-2.6, -1.1], tl: [-2.6, 1.6], t1: [0, 1.6], b1: [0, -1.1], t2: [2.4, 1.6], m2: [2.4, 0.25], b2: [2.4, -1.1] },
    edges: [
      { id: 'E1', type: 'V', a: 'bl', b: 'tl', value: 12, n: 1, side: -1 },
      { id: 'wA', type: 'W', a: 'tl', b: 't1', jname: String.raw`I` },
      { id: 'R1', type: 'R', a: 't1', b: 'b1', value: 6, n: 1, side: 1 },
      { id: 'wB', type: 'W', a: 't1', b: 't2', jname: String.raw`I_2` },
      { id: 'R2', type: 'R', a: 't2', b: 'm2', value: 4, n: 2, side: 1 },
      { id: 'R3', type: 'R', a: 'm2', b: 'b2', value: 2, n: 3, side: 1 },
      { id: 'wE', type: 'W', a: 'b2', b: 'b1' },
      { id: 'wF', type: 'W', a: 'b1', b: 'bl' },
    ],
    loops: [
      { name: 'Left loop', path: [['E1', 1], ['wA', 1], ['R1', 1], ['wF', 1]] },
      { name: 'Right loop', path: [['wB', 1], ['R2', 1], ['R3', 1], ['wE', 1], ['R1', -1]] },
    ],
    junction: 't1',
    req: 'split',
  },
  {
    id: 'bulbsC',
    name: 'Three bulbs — C, then A ∥ B',
    ground: 'bl',
    nodes: { bl: [-2.6, -1.1], tl: [-2.6, 1.6], t1: [0, 1.6], t2: [2.4, 1.6], b1: [0, -1.1], b2: [2.4, -1.1] },
    edges: [
      { id: 'E1', type: 'V', a: 'bl', b: 'tl', value: 12, n: 1, side: -1 },
      { id: 'wA', type: 'W', a: 'tl', b: 't1', jname: String.raw`I` },
      { id: 'A', type: 'R', a: 't1', b: 'b1', value: 10, n: 1, tag: 'A', bulb: true, side: 1 },
      { id: 'wB', type: 'W', a: 't1', b: 't2', jname: String.raw`I_B` },
      { id: 'B', type: 'R', a: 't2', b: 'b2', value: 10, n: 2, tag: 'B', bulb: true, side: 1 },
      { id: 'wE', type: 'W', a: 'b2', b: 'b1' },
      { id: 'C', type: 'R', a: 'b1', b: 'bl', value: 10, n: 3, tag: 'C', bulb: true, side: 1 },
    ],
    loops: [
      { name: 'Left loop', path: [['E1', 1], ['wA', 1], ['A', 1], ['C', 1]] },
      { name: 'Right loop', path: [['wB', 1], ['B', 1], ['wE', 1], ['A', -1]] },
    ],
    junction: 't1',
    req: 'bulbsC',
  },
  {
    id: 'bulbsA',
    name: 'Three bulbs — A ∥ (B + C)',
    ground: 'bl',
    nodes: { bl: [-2.6, -1.1], tl: [-2.6, 1.6], t1: [0, 1.6], b1: [0, -1.1], t2: [2.4, 1.6], m2: [2.4, 0.25], b2: [2.4, -1.1] },
    edges: [
      { id: 'E1', type: 'V', a: 'bl', b: 'tl', value: 12, n: 1, side: -1 },
      { id: 'wA', type: 'W', a: 'tl', b: 't1', jname: String.raw`I` },
      { id: 'A', type: 'R', a: 't1', b: 'b1', value: 10, n: 1, tag: 'A', bulb: true, side: 1 },
      { id: 'wB', type: 'W', a: 't1', b: 't2', jname: String.raw`I_B` },
      { id: 'B', type: 'R', a: 't2', b: 'm2', value: 10, n: 2, tag: 'B', bulb: true, side: 1 },
      { id: 'C', type: 'R', a: 'm2', b: 'b2', value: 10, n: 3, tag: 'C', bulb: true, side: 1 },
      { id: 'wE', type: 'W', a: 'b2', b: 'b1' },
      { id: 'wF', type: 'W', a: 'b1', b: 'bl' },
    ],
    loops: [
      { name: 'Left loop', path: [['E1', 1], ['wA', 1], ['A', 1], ['wF', 1]] },
      { name: 'Right loop', path: [['wB', 1], ['B', 1], ['C', 1], ['wE', 1], ['A', -1]] },
    ],
    junction: 't1',
    req: 'bulbsA',
  },
  {
    id: 'loop2',
    name: 'One loop, two batteries',
    ground: 'bl',
    nodes: { bl: [-2.6, -1.1], tl: [-2.6, 1.6], tm: [0, 1.6], tr: [2.6, 1.6], br: [2.6, -1.1], bm: [0, -1.1] },
    edges: [
      { id: 'E1', type: 'V', a: 'bl', b: 'tl', value: 12, n: 1, side: -1 },
      { id: 'R1', type: 'R', a: 'tl', b: 'tm', value: 2, n: 1, side: 1 },
      { id: 'R2', type: 'R', a: 'tm', b: 'tr', value: 4, n: 2, side: 1 },
      { id: 'R3', type: 'R', a: 'tr', b: 'br', value: 3, n: 3, side: 1 },
      { id: 'R4', type: 'R', a: 'br', b: 'bm', value: 3, n: 4, side: 1 },
      // + terminal at bl: walking the loop clockwise this battery aids E1; a negative value opposes it.
      { id: 'E2', type: 'V', a: 'bm', b: 'bl', value: -6, n: 2, side: 1 },
    ],
    loops: [{ name: 'Loop', path: [['E1', 1], ['R1', 1], ['R2', 1], ['R3', 1], ['R4', 1], ['E2', 1]] }],
    junction: null,
    req: null,
  },
  {
    id: 'threebranch',
    name: 'Three branches, three batteries',
    ground: 'mb',
    nodes: { lb: [-2.6, -1.1], lt: [-2.6, 1.6], mt: [0, 1.6], mb: [0, -1.1], rt: [2.6, 1.6], rb: [2.6, -1.1] },
    edges: [
      // Left branch: bottom wire through R4, up through ε₁, along the top through R1 to the junction.
      { id: 'R4', type: 'R', a: 'mb', b: 'lb', value: 200, n: 4, side: 1 },
      // Battery labels all sit inside the loops (clear of the screen edge on a phone); ε₂'s rides
      // high so it does not meet ε₃'s.
      { id: 'E1', type: 'V', a: 'lb', b: 'lt', value: 10, n: 1, side: -1 },
      { id: 'R1', type: 'R', a: 'lt', b: 'mt', value: 100, n: 1, side: 1 },
      // Middle branch: ε₂ alone, + at the top junction.
      { id: 'E2', type: 'V', a: 'mb', b: 'mt', value: 20, n: 2, side: -1, slide: 0.75 },
      // Right branch: bottom wire through R3, up through ε₃, along the top through R2 to the junction.
      { id: 'R3', type: 'R', a: 'mb', b: 'rb', value: 50, n: 3, side: -1 },
      { id: 'E3', type: 'V', a: 'rb', b: 'rt', value: 5, n: 3, side: 1 },
      { id: 'R2', type: 'R', a: 'rt', b: 'mt', value: 200, n: 2, side: -1 },
    ],
    loops: [
      { name: 'Left loop', path: [['R4', 1], ['E1', 1], ['R1', 1], ['E2', -1]] },
      { name: 'Right loop', path: [['R3', 1], ['E3', 1], ['R2', 1], ['E2', -1]] },
    ],
    junction: 'mt',
    req: null,
  },
  {
    id: 'internal',
    name: 'Battery with internal resistance',
    ground: 'bl',
    nodes: { bl: [-2.6, -1.1], lm: [-2.6, 0.25], tl: [-2.6, 1.6], tr: [2.6, 1.6], br: [2.6, -1.1] },
    edges: [
      { id: 'E1', type: 'V', a: 'bl', b: 'lm', value: 12, n: 1, side: -1, slide: 0 },
      { id: 'r', type: 'R', a: 'lm', b: 'tl', value: 0.5, n: 'r', sym: 'r', side: -1 },
      { id: 'wT', type: 'W', a: 'tl', b: 'tr' },
      { id: 'R', type: 'R', a: 'tr', b: 'br', value: 5.5, n: 'R', sym: 'R', side: 1 },
      { id: 'wB', type: 'W', a: 'br', b: 'bl' },
    ],
    loops: [{ name: 'Loop', path: [['E1', 1], ['r', 1], ['wT', 1], ['R', 1], ['wB', 1]] }],
    junction: null,
    req: 'internal',
    terminal: ['bl', 'tl'],
  },
  ...['ABC', 'BCA', 'CAB'].map(cellsLayout),
];

/**
 * Three little circuits side by side, bulbs A, B and C, for "which arrangement of cells…" questions.
 * `order` gives the letters for one cell, two cells turned against each other, and two cells aiding.
 * The circuits share no wire, so each has its own ground.
 */
function cellsLayout(order) {
  const [one, rev, aid] = [...order];
  const nodes = {};
  const edges = [];
  const loops = [];
  ['A', 'B', 'C'].forEach((L, i) => {
    // Fits the free space between the side panels (about ±4.4 scene units) with the cell plates.
    const cx = (i - 1) * 3.0;
    Object.assign(nodes, { [`${L}bl`]: [cx - 0.8, -1.1], [`${L}ml`]: [cx - 0.8, 0.25], [`${L}tl`]: [cx - 0.8, 1.6], [`${L}tr`]: [cx + 0.8, 1.6], [`${L}br`]: [cx + 0.8, -1.1] });
    const cells =
      L === one
        ? [{ id: `${L}1`, type: 'V', a: `${L}bl`, b: `${L}tl`, value: 1.5, n: `${L}`, side: -1, slide: 0 }]
        : [
            // Labels inside the loop (side flips with the edge's direction) and level with each cell.
            { id: `${L}1`, type: 'V', a: `${L}bl`, b: `${L}ml`, value: 1.5, n: `${L}1`, side: -1, slide: 0 },
            L === rev
              ? { id: `${L}2`, type: 'V', a: `${L}tl`, b: `${L}ml`, value: 1.5, n: `${L}2`, side: 1, slide: 0 }
              : { id: `${L}2`, type: 'V', a: `${L}ml`, b: `${L}tl`, value: 1.5, n: `${L}2`, side: -1, slide: 0 },
          ];
    edges.push(
      ...cells,
      { id: L, type: 'R', a: `${L}tl`, b: `${L}tr`, value: 3, n: L, tag: L, bulb: true, side: 1 },
      { id: `${L}w1`, type: 'W', a: `${L}tr`, b: `${L}br` },
      { id: `${L}w2`, type: 'W', a: `${L}br`, b: `${L}bl` },
    );
    const walk = L === one ? [[`${L}1`, 1]] : L === rev ? [[`${L}1`, 1], [`${L}2`, -1]] : [[`${L}1`, 1], [`${L}2`, 1]];
    loops.push({ name: `Circuit ${L}`, path: [...walk, [L, 1], [`${L}w1`, 1], [`${L}w2`, 1]] });
  });
  return {
    id: `cells-${order}`,
    name: 'Cells aiding or opposing',
    problemOnly: order !== 'ABC',
    ground: ['Abl', 'Bbl', 'Cbl'],
    nodes,
    edges,
    loops,
    junction: null,
    req: null,
  };
}

export function circuitById(id) {
  return CIRCUITS.find((c) => c.id === id) || CIRCUITS[0];
}

/** Netlist with slider overrides applied: values[edgeId] replaces edge.value. */
export function netlist(layout, values = {}) {
  return layout.edges.map((e) => (values[e.id] != null ? { ...e, value: values[e.id] } : e));
}

/** Equivalent resistance seen by the battery, for the layouts where the textbook formula applies. */
export function equivalentR(layout, edges) {
  const R = Object.fromEntries(edges.filter((e) => e.type === 'R').map((e) => [e.id, e.value]));
  if (layout.req === 'series') return R.R1 + R.R2 + R.R3;
  if (layout.req === 'parallel') return 1 / (1 / R.R1 + 1 / R.R2 + 1 / R.R3);
  if (layout.req === 'combo') return R.R1 + (R.R2 * R.R3) / (R.R2 + R.R3);
  if (layout.req === 'series4') return R.R1 + R.R2 + R.R3 + R.R4;
  if (layout.req === 'parallel4') return 1 / (1 / R.R1 + 1 / R.R2 + 1 / R.R3 + 1 / R.R4);
  if (layout.req === 'pair') return (R.R1 * R.R2) / (R.R1 + R.R2);
  if (layout.req === 'ladder') return R.R1 + (R.R2 * R.R3) / (R.R2 + R.R3) + R.R4;
  if (layout.req === 'split') return 1 / (1 / R.R1 + 1 / (R.R2 + R.R3));
  if (layout.req === 'bulbsC') return R.C + (R.A * R.B) / (R.A + R.B);
  if (layout.req === 'bulbsA') return 1 / (1 / R.A + 1 / (R.B + R.C));
  if (layout.req === 'internal') return R.R + R.r;
  return null;
}
