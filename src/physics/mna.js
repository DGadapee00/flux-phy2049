/**
 * DC circuit solver (modified nodal analysis) for the fixed Circuits layouts.
 *
 * edges: { id, type: 'R' | 'V' | 'W', a, b, value }
 *   R: resistor of `value` ohms between a and b
 *   V: ideal source of `value` volts, + terminal at b (V_b − V_a = value)
 *   W: wire — modelled as a tiny resistor so every branch, wires included, gets a current
 * Currents are reported a → b (through a source that is − to +).
 */
export const WIRE_R = 1e-6;

export function solveCircuit(nodes, edges, ground) {
  const idx = new Map();
  let k = 0;
  for (const n of nodes) if (n !== ground) idx.set(n, k++);
  const sources = edges.filter((e) => e.type === 'V');
  const N = k + sources.length;
  const A = Array.from({ length: N }, () => new Float64Array(N));
  const z = new Float64Array(N);
  const at = (n) => (n === ground ? -1 : idx.get(n));

  for (const e of edges) {
    if (e.type === 'V') continue;
    const g = 1 / (e.type === 'W' ? WIRE_R : e.value);
    const ia = at(e.a);
    const ib = at(e.b);
    if (ia >= 0) A[ia][ia] += g;
    if (ib >= 0) A[ib][ib] += g;
    if (ia >= 0 && ib >= 0) {
      A[ia][ib] -= g;
      A[ib][ia] -= g;
    }
  }
  sources.forEach((e, j) => {
    const row = k + j;
    const ia = at(e.a);
    const ib = at(e.b);
    // KCL: source current leaves node a and enters node b.
    if (ia >= 0) {
      A[ia][row] += 1;
      A[row][ia] -= 1;
    }
    if (ib >= 0) {
      A[ib][row] -= 1;
      A[row][ib] += 1;
    }
    z[row] = e.value;
  });

  const x = gaussSolve(A, z);
  const V = {};
  for (const n of nodes) V[n] = n === ground ? 0 : x[idx.get(n)];
  const I = {};
  for (const e of edges) {
    if (e.type === 'V') I[e.id] = x[k + sources.indexOf(e)];
    else I[e.id] = (V[e.a] - V[e.b]) / (e.type === 'W' ? WIRE_R : e.value);
  }
  return { V, I };
}

/** Gaussian elimination with partial pivoting. */
function gaussSolve(A, b) {
  const n = b.length;
  const M = A.map((row) => Float64Array.from(row));
  const y = Float64Array.from(b);
  for (let c = 0; c < n; c++) {
    let p = c;
    for (let r = c + 1; r < n; r++) if (Math.abs(M[r][c]) > Math.abs(M[p][c])) p = r;
    [M[c], M[p]] = [M[p], M[c]];
    [y[c], y[p]] = [y[p], y[c]];
    const piv = M[c][c] || 1e-30;
    for (let r = c + 1; r < n; r++) {
      const f = M[r][c] / piv;
      if (!f) continue;
      for (let j = c; j < n; j++) M[r][j] -= f * M[c][j];
      y[r] -= f * y[c];
    }
  }
  const x = new Float64Array(n);
  for (let r = n - 1; r >= 0; r--) {
    let s = y[r];
    for (let j = r + 1; j < n; j++) s -= M[r][j] * x[j];
    x[r] = s / (M[r][r] || 1e-30);
  }
  return x;
}

/**
 * Kirchhoff loop rule terms. `loop` is [[edgeId, +1 | −1], ...] (−1 = traversed b → a).
 * Resistor/wire: ΔV = −s·I·R. Source: ΔV = +s·ε.
 */
export function loopTerms(loop, edges, sol) {
  const byId = Object.fromEntries(edges.map((e) => [e.id, e]));
  const terms = loop.map(([id, s]) => {
    const e = byId[id];
    const I = sol.I[id];
    const dV = e.type === 'V' ? s * e.value : -s * I * (e.type === 'W' ? WIRE_R : e.value);
    return { e, s, I, dV };
  });
  return { terms, sum: terms.reduce((acc, t) => acc + t.dV, 0) };
}

/** Junction rule at a node: currents in (positive) from every incident edge. */
export function junctionTerms(node, edges, sol) {
  const terms = [];
  for (const e of edges) {
    if (e.b === node) terms.push({ e, Iin: sol.I[e.id] });
    else if (e.a === node) terms.push({ e, Iin: -sol.I[e.id] });
  }
  return { terms, sum: terms.reduce((acc, t) => acc + t.Iin, 0) };
}
