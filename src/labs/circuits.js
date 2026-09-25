import * as THREE from 'three';
import { defineLab } from './define.js';
import { SchematicView } from '../scene/schematic.js';
import { CIRCUITS, circuitById, netlist, equivalentR } from '../data/circuits.js';
import { solveCircuit, loopTerms, junctionTerms } from '../physics/mna.js';
import { kv, cells, qv, eq } from '../ui/shared.js';
import { fmtV, fmtI as fmtIBase, fmtP, fmtR } from '../ui/format.js';

/** Like fmtI, but 0.99999 A (wires are 10⁻⁶ Ω, not 0) reads as 1.000 A instead of 999.99 mA. */
function fmtI(i) {
  return Math.abs(i) >= 0.9995 && Math.abs(i) < 1 ? `${i < 0 ? '−' : ''}1.000 A` : fmtIBase(i);
}

const EPS_COLOR = '#58C4DD';

function fmtOhm(r) {
  if (!Number.isFinite(r)) return '—';
  if (r >= 1e3 || r < 1) return fmtR(r);
  return `${Number.isInteger(r) ? r.toFixed(0) : r.toFixed(2)} Ω`;
}

/**
 * What a resistor is called, in HTML and TeX: R₁ and I₁ by default, R_A and I_A for bulb A, and
 * plain r / R with the single loop current I for a battery's internal resistance and its load.
 */
function names(e) {
  if (e.sym) {
    return {
      rH: `<i>${e.sym}</i>`,
      rT: e.sym === 'R' ? String.raw`\qR` : String.raw`\textcolor{#83C167}{${e.sym}}`,
      iH: '<i>I</i>',
      iT: String.raw`\qI`,
      slider: e.sym === 'r' ? 'Internal resistance <i>r</i>' : 'Load <i>R</i>',
    };
  }
  const s = e.tag ?? e.n;
  return { rH: `<i>R</i><sub>${s}</sub>`, rT: String.raw`\qR_{${s}}`, iH: `<i>I</i><sub>${s}</sub>`, iT: String.raw`\qI_{${s}}`, slider: e.bulb ? `Bulb ${e.tag}` : `Resistor R<sub>${s}</sub>` };
}

/** TeX for the current carried by an edge, in the direction it was assumed (a → b). */
function currentTex(e) {
  if (e.type === 'R') return names(e).iT;
  if (e.type === 'W') return e.jname ? e.jname.replace(/I/g, String.raw`\qI`) : '';
  return String.raw`\qI`;
}

function termTex(e) {
  if (e.type === 'R') return `${names(e).iT}${names(e).rT}`;
  return String.raw`\textcolor{${EPS_COLOR}}{\varepsilon_{${e.n}}}`;
}

/**
 * Walk the loop: battery − → + is +ε; crossing a resistor along the assumed current is −IR.
 * A battery set to a negative value is drawn turned round with ε = |value|, so its sign flips here.
 */
function loopTex(loop, edges) {
  const byId = Object.fromEntries(edges.map((e) => [e.id, e]));
  let s = '';
  for (const [id, dir] of loop.path) {
    const e = byId[id];
    if (e.type === 'W') continue;
    const plus = e.type === 'V' ? (dir > 0) !== (e.value < 0) : dir < 0;
    s += s ? (plus ? ' + ' : ' - ') : plus ? '' : '-';
    s += termTex(e);
  }
  return `${s} = 0`;
}

function junctionTex(node, edges) {
  // Resistor currents first, in subscript order, so it reads I = I₁ + I₂ + I₃.
  const order = (a, b) => (a.type === 'W') - (b.type === 'W') || (a.n || 0) - (b.n || 0);
  const side = (pick) => edges.filter(pick).sort(order).map(currentTex).filter(Boolean).join(' + ');
  return `${side((e) => e.b === node)} = ${side((e) => e.a === node)}`;
}

/** Hide floating-point residue (e.g. −2.8×10⁻⁹ A from 10⁻⁶ Ω wires) in the rule checks. */
const clean = (x, tol = 1e-6) => (Math.abs(x) < tol ? 0 : x);

function reqTex(layout) {
  if (layout.req === 'series') return String.raw`\qR_{\text{eq}} = \qR_1 + \qR_2 + \qR_3`;
  if (layout.req === 'parallel') return String.raw`\dfrac{1}{\qR_{\text{eq}}} = \dfrac{1}{\qR_1} + \dfrac{1}{\qR_2} + \dfrac{1}{\qR_3}`;
  if (layout.req === 'combo') return String.raw`\qR_{\text{eq}} = \qR_1 + \dfrac{\qR_2\qR_3}{\qR_2 + \qR_3}`;
  if (layout.req === 'series4') return String.raw`\qR_{\text{eq}} = \qR_1 + \qR_2 + \qR_3 + \qR_4`;
  if (layout.req === 'parallel4') return String.raw`\dfrac{1}{\qR_{\text{eq}}} = \dfrac{1}{\qR_1} + \dfrac{1}{\qR_2} + \dfrac{1}{\qR_3} + \dfrac{1}{\qR_4}`;
  if (layout.req === 'pair') return String.raw`\qR_{\text{eq}} = \dfrac{\qR_1\qR_2}{\qR_1 + \qR_2}`;
  if (layout.req === 'ladder') return String.raw`\qR_{\text{eq}} = \qR_1 + \dfrac{\qR_2\qR_3}{\qR_2 + \qR_3} + \qR_4`;
  if (layout.req === 'split') return String.raw`\dfrac{1}{\qR_{\text{eq}}} = \dfrac{1}{\qR_1} + \dfrac{1}{\qR_2 + \qR_3}`;
  if (layout.req === 'bulbsC') return String.raw`\qR_{\text{eq}} = \qR_C + \dfrac{\qR_A\qR_B}{\qR_A + \qR_B}`;
  if (layout.req === 'bulbsA') return String.raw`\dfrac{1}{\qR_{\text{eq}}} = \dfrac{1}{\qR_A} + \dfrac{1}{\qR_B + \qR_C}`;
  if (layout.req === 'internal') return String.raw`\qR_{\text{eq}} = \qR + \textcolor{#83C167}{r}`;
  return null;
}

function signed(x, digits = 2) {
  return `${x >= 0 ? '+' : '−'} ${Math.abs(x).toFixed(digits)}`;
}

export default defineLab({
  id: 'circuits',
  exam: 'e4',
  title: 'Circuits',
  hint: 'Change a resistor or battery — Kirchhoff checks update live',
  orbit: false,
  camera: { pos: new THREE.Vector3(0, 0.25, 12.5), target: new THREE.Vector3(0, 0.25, 0) },
  keys: { r: 'reset', R: 'reset' },
  legend: { id: 'Vwire', title: 'Wire color = potential V', low: '0 V (ground)', high: 'highest', barClass: 'legend-cvd' },
  // Layouts marked problemOnly are variants a problem loads; the Scenario menu lists one of each kind.
  scenarios: CIRCUITS.filter((c) => !c.problemOnly).map(({ id, name }) => ({ id, name })),
  defaultState() {
    return { scenarioId: 'series', values: {}, show: {}, anim: { playing: false, i: 0 } };
  },
  applyScenario(id, state) {
    state.scenarioId = circuitById(id).id;
    state.values = {};
  },
  controls() {
    return `
        <div class="lab-block" id="circ-sliders"></div>
        <p class="tiny">Grey chevrons: the direction each current was <em>assumed</em> when writing the rules. Yellow dots: where charge actually flows. A negative I just means the dots run against the chevron.</p>`;
  },
  bind(api) {
    document.getElementById('circ-sliders').addEventListener('input', (e) => {
      const id = e.target.dataset.edge;
      if (!id) return;
      api.slice().values[id] = Number(e.target.value);
      api.bump();
    });
  },
  syncControls(state) {
    const host = document.getElementById('circ-sliders');
    if (!host) return;
    const layout = circuitById(state.scenarioId);
    const edges = netlist(layout, state.values);
    if (host.dataset.sig !== layout.id) {
      host.dataset.sig = layout.id;
      host.innerHTML = edges
        .filter((e) => e.type !== 'W')
        .map((e) => {
          const isR = e.type === 'R';
          return `
          <label class="field">
            <span>${isR ? names(e).slider : `Battery ε<sub>${e.n}</sub>`}</span>
            <div class="slider-row">
              <input type="range" data-edge="${e.id}" min="${isR ? 1 : 1}" max="${isR ? 30 : 24}" step="${isR ? 1 : 0.5}" />
              <span class="mono val ${isR ? 'qR' : 'qV'}" id="circ-val-${e.id}"></span>
            </div>
          </label>`;
        })
        .join('');
    }
    for (const e of edges) {
      if (e.type === 'W') continue;
      const input = host.querySelector(`[data-edge="${e.id}"]`);
      if (input && document.activeElement !== input) input.value = e.value;
      const val = document.getElementById(`circ-val-${e.id}`);
      if (val) val.textContent = e.type === 'R' ? fmtOhm(e.value) : fmtV(e.value);
    }
  },
  init(ctx) {
    const view = new SchematicView(ctx.scene);
    view.setVisible(false);
    return { view };
  },
  enter(ctx, handle) {
    handle.view.setVisible(true);
  },
  exit(ctx, handle) {
    handle.view.setVisible(false);
  },
  recompute(state, computed) {
    const layout = circuitById(state.scenarioId);
    const edges = netlist(layout, state.values);
    const sol = solveCircuit(Object.keys(layout.nodes), edges, layout.ground);
    const loops = layout.loops.map((l) => ({ ...l, ...loopTerms(l.path, edges, sol) }));
    const junction = layout.junction ? junctionTerms(layout.junction, edges, sol) : null;
    const vmax = Math.max(...Object.values(sol.V));
    const Pbat = edges.filter((e) => e.type === 'V').reduce((acc, e) => acc + e.value * sol.I[e.id], 0);
    const Pres = edges.filter((e) => e.type === 'R').reduce((acc, e) => acc + sol.I[e.id] ** 2 * e.value, 0);

    const labels = {};
    for (const e of edges) {
      if (e.type === 'W') continue;
      const I = sol.I[e.id];
      if (e.type === 'V') {
        // A negative value is drawn as the battery turned round, so the label gives its size.
        labels[e.id] = qv('qV', `ε<sub>${e.n}</sub> = ${fmtV(Math.abs(e.value))}`);
        continue;
      }
      const nm = names(e);
      const against = I < -1e-4 ? '<small>flows against the grey arrow</small>' : '';
      labels[e.id] =
        (e.bulb ? `<span class="lbl-name circuit-bulb">Bulb ${e.tag}</span>` : '') +
        qv('qR', `${nm.rH} = ${fmtOhm(e.value)}`) +
        // Name and value in separate spans, so a problem can hide the value and still say which is I₂.
        qv('qI', `<span class="lbl-name">${nm.iH}</span> = <span class="lbl-val">${fmtI(I)}</span>`) +
        `<small>ΔV = ${fmtV(Math.abs(I * e.value))}</small>${against}`;
    }
    computed.circ = {
      layout,
      edges,
      sol,
      loops,
      junction,
      vmax,
      Req: equivalentR(layout, edges),
      Pbat,
      Pres,
      labels,
      loopMax: Math.max(...loops.map((l) => Math.abs(l.sum))),
    };
  },
  syncViews(state, computed, ctx) {
    const h = ctx.handle;
    const c = computed.circ;
    if (!h || !c) return;
    ctx.grid.visible = false;
    // A battery turned round (negative value) is drawn with its plates swapped, so rebuild on a flip.
    const key = `${c.layout.id}:${c.edges.map((e) => (e.type === 'V' && e.value < 0 ? '-' : '+')).join('')}`;
    if (h.view.key !== key) {
      h.view.key = key;
      h.view.build(c.layout, c.edges);
    }
  },
  afterFrame(dt, state, computed, ctx) {
    const c = computed.circ;
    if (!c || !ctx.handle) return;
    ctx.handle.view.update(dt, c.sol, c.vmax, c.labels, c.junction ? '<small>junction · ΣI = 0</small>' : null);
  },
  law(state, computed) {
    const c = computed.circ;
    if (!c) return [];
    const lines = [];
    const req = reqTex(c.layout);
    if (req) lines.push(req);
    if (c.layout.junction) lines.push(String.raw`\text{junction: }` + junctionTex(c.layout.junction, c.edges));
    for (const l of c.layout.loops) lines.push(String.raw`\text{loop: }` + loopTex(l, c.edges));
    return lines;
  },
  liveRows(state, computed) {
    const c = computed.circ;
    if (!c) return '';
    const rows = [];
    const bat = c.edges.find((e) => e.type === 'V');
    if (c.Req != null) {
      rows.push(kv(String.raw`$\qR_{\text{eq}}$`, qv('qR', fmtOhm(c.Req))));
      rows.push(kv(String.raw`$\qI = \varepsilon/\qR_{\text{eq}}$`, qv('qI', fmtI(bat.value / c.Req))));
    }
    for (const e of c.edges) {
      if (e.type !== 'R') continue;
      const I = c.sol.I[e.id];
      const nm = names(e);
      rows.push(kv(`$${nm.iT}$ · $\\Delta \\qV$ across $${nm.rT}$`, `${qv('qI', fmtI(I))} · ${qv('qV', fmtV(Math.abs(I * e.value)))}`));
    }
    if (c.layout.terminal) {
      const [lo, hi] = c.layout.terminal;
      rows.push(kv(String.raw`Terminal voltage $V_{ab} = \varepsilon - I\textcolor{#83C167}{r}$`, qv('qV', fmtV(c.sol.V[hi] - c.sol.V[lo]))));
    }
    if (c.junction) {
      const terms = c.junction.terms
        .filter((t) => t.e.type !== 'W' || t.e.jname)
        .map((t) => signed(t.Iin, 3))
        .join(' ');
      rows.push(kv(String.raw`Junction: $\sum \qI_{\text{in}}$`, `${terms} = <span class="ok">${fmtI(clean(c.junction.sum))}</span>`));
    }
    for (const l of c.loops) {
      const terms = l.terms
        .filter((t) => t.e.type !== 'W')
        .map((t) => signed(t.dV))
        .join(' ');
      rows.push(kv(`Loop: ${l.name}`, `${terms} = <span class="ok">${fmtV(clean(l.sum))}</span>`));
    }
    rows.push(kv(String.raw`Batteries: $\sum \varepsilon\qI$`, qv('qP', fmtP(c.Pbat))));
    rows.push(kv(String.raw`Resistors: $\sum \qI^2\qR$`, qv('qP', fmtP(c.Pres))));
    return rows.join('');
  },
  readout(state, computed) {
    const c = computed.circ;
    if (!c) return '';
    const bat = c.edges.find((e) => e.type === 'V');
    return cells([
      [c.Req != null ? String.raw`$R_{\text{eq}}$` : 'Battery 1 current', c.Req != null ? fmtOhm(c.Req) : fmtI(c.sol.I[bat.id]), c.Req != null ? 'qR' : 'qI'],
      ['Battery current', fmtI(c.sol.I[bat.id]), 'qI'],
      [String.raw`Loop rule, max $|\sum \Delta V|$`, fmtV(c.loopMax), 'ok'],
      ['Power delivered', fmtP(c.Pbat), 'qP'],
    ]);
  },
  coach(state, computed) {
    const c = computed.circ;
    if (!c) return { title: '', body: '' };
    const I = (id) => c.sol.I[id];
    const v = (id) => c.edges.find((e) => e.id === id)?.value;
    if (c.layout.id === 'series') {
      return {
        title: 'Series: one path, one current',
        body: [
          `The same ${fmtI(I('R1'))} passes through every resistor, so the voltage divides in proportion to the resistance:`,
          eq(String.raw`\frac{\Delta V_2}{\Delta V_3} = \frac{R_2}{R_3} = ${(v('R2') / v('R3')).toFixed(2)}`),
          String.raw`Adding a resistor in series always raises $R_{\text{eq}}$ and lowers $I$.`,
        ],
      };
    }
    if (c.layout.id === 'parallel') {
      return {
        title: 'Parallel: same voltage, currents add',
        body: [
          String.raw`Each branch sits directly across the battery, so each gets the full $\varepsilon$ and carries $I_k = \varepsilon/R_k$; at the junction those currents add.`,
          `$R_{\\text{eq}}$ = ${fmtOhm(c.Req)} is smaller than the smallest branch — adding a branch always lowers it.`,
        ],
      };
    }
    if (c.layout.id === 'combo') {
      return {
        title: 'Reduce from the inside out',
        body: [
          eq(String.raw`R_{\text{eq}} = R_1 + \frac{R_2R_3}{R_2+R_3}`),
          `$R_2 \\parallel R_3$ = ${fmtOhm((v('R2') * v('R3')) / (v('R2') + v('R3')))}, and $R_1$ adds in series. The full current ${fmtI(I('E1'))} runs through $R_1$ and then splits, with more going through the smaller of $R_2$ and $R_3$.`,
        ],
      };
    }
    const reduce = {
      series4: {
        title: 'Series: one path, one current',
        body: [String.raw`All four resistors carry the same current, so $R_{\text{eq}}$ is their sum and each takes a share of the voltage in proportion to its resistance, $\Delta V_k = IR_k$.`],
      },
      parallel4: {
        title: 'Parallel: same voltage, currents add',
        body: [String.raw`Every branch has the full $\varepsilon$, so $I_k = \varepsilon/R_k$ and the battery supplies their sum. $R_{\text{eq}}$ is below the smallest of the four.`],
      },
      pair: {
        title: 'Two in parallel',
        body: [eq(String.raw`R_{\text{eq}} = \frac{R_1R_2}{R_1+R_2}`), 'Both resistors have the battery voltage across them; the smaller one takes the larger share of the current.'],
      },
      ladder: {
        title: 'Reduce from the inside out',
        body: [String.raw`Collapse $R_2 \parallel R_3$ first; then $R_1$, the pair and $R_4$ are in series. $R_1$ and $R_4$ carry the full current, and it splits across the pair.`],
      },
      split: {
        title: 'Two branches across one battery',
        body: [String.raw`Each branch has the full $\varepsilon$: $R_1$ alone carries $\varepsilon/R_1$, and $R_2$ and $R_3$, one after the other, share $\varepsilon/(R_2 + R_3)$. The battery supplies both.`],
      },
      bulbsC: {
        title: 'Identical bulbs: follow the current',
        body: ['C sits in the unbranched wire, so it carries everything; A and B split that current between them. With equal resistance, brightness goes with current.'],
      },
      bulbsA: {
        title: 'Identical bulbs: follow the current',
        body: ['Each branch has the full battery voltage. A is alone on its branch; B and C share theirs, so that branch has twice the resistance and half the current.'],
      },
      internal: {
        title: 'A real battery: emf minus the internal drop',
        body: [eq(String.raw`V_{ab} = \varepsilon - Ir`), String.raw`The same current flows through $r$ and the load, so $I = \varepsilon/(R + r)$. The load gets $V_{ab}I$; the rest, $I^2r$, heats the battery.`],
      },
      loop2: {
        title: 'One loop: add the emfs, then divide',
        body: [String.raw`With only one path there is one current. Batteries that push the same way add; opposing ones subtract: $I = \dfrac{\sum\varepsilon}{\sum R}$.`],
      },
    }[c.layout.id];
    if (reduce) return reduce;
    if (c.layout.id.startsWith('cells')) {
      return {
        title: 'Cells: count the voltage around each loop',
        body: ['Three separate circuits. Walk around each one: a cell entered at its − end adds its emf, one entered at its + end subtracts it. Twice the voltage across the same bulb means twice the current.'],
      };
    }
    const neg = c.edges.filter((e) => e.type === 'R' && I(e.id) < -1e-4).map((e) => `I${'₀₁₂₃₄'[e.n]} = ${fmtI(I(e.id))}`);
    return {
      title: String.raw`No single $R_{\text{eq}}$ — use Kirchhoff`,
      body: [
        String.raw`Batteries in different branches cannot be reduced to one resistor. The junction rule at the top node and one loop rule per loop — the equations at the top of this panel — pin the currents down.`,
        neg.length
          ? `The solution has ${neg.join(', ')} — a negative current just means it really runs opposite to the direction assumed (the dots show which way).`
          : 'Every current came out positive, so the assumed directions were right.',
        String.raw`Walking a loop: $- \to +$ across a battery is $+\varepsilon$, and along the current through a resistor is $-IR$.`,
      ],
    };
  },
});
