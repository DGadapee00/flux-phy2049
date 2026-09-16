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
];

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
  return null;
}
