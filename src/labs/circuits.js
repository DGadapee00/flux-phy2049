import * as THREE from 'three';
import { defineLab } from './define.js';
import { SchematicView } from '../scene/schematic.js';
import { CIRCUITS, circuitById, netlist, equivalentR } from '../data/circuits.js';
import { solveCircuit, loopTerms, junctionTerms } from '../physics/mna.js';
import { kv, cells, qv } from '../ui/shared.js';
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

/** TeX for the current carried by an edge, in the direction it was assumed (a → b). */
function currentTex(e) {
  if (e.type === 'R') return String.raw`\qI_{${e.n}}`;
  if (e.type === 'W') return e.jname ? e.jname.replace(/I/g, String.raw`\qI`) : '';
  return String.raw`\qI`;
}

function termTex(e) {
  if (e.type === 'R') return String.raw`\qI_{${e.n}}\qR_{${e.n}}`;
  return String.raw`\textcolor{${EPS_COLOR}}{\varepsilon_{${e.n}}}`;
}

/** Walk the loop: battery − → + is +ε; crossing a resistor along the assumed current is −IR. */
function loopTex(loop, edges) {
  const byId = Object.fromEntries(edges.map((e) => [e.id, e]));
  let s = '';
  for (const [id, dir] of loop.path) {
    const e = byId[id];
    if (e.type === 'W') continue;
    const plus = e.type === 'V' ? dir > 0 : dir < 0;
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
  legend: { id: 'Vwire', title: 'Wire color = potential V', low: '0 V (ground)', high: 'highest', barClass: 'legend-v' },
  scenarios: CIRCUITS.map(({ id, name }) => ({ id, name })),
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
            <span>${isR ? `Resistor R<sub>${e.n}</sub>` : `Battery ε<sub>${e.n}</sub>`}</span>
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
        labels[e.id] = qv('qV', `ε<sub>${e.n}</sub> = ${fmtV(e.value)}`);
        continue;
      }
      const against = I < -1e-4 ? '<small>flows against the grey arrow</small>' : '';
      labels[e.id] =
        qv('qR', `<i>R</i><sub>${e.n}</sub> = ${fmtOhm(e.value)}`) +
        qv('qI', `<i>I</i><sub>${e.n}</sub> = ${fmtI(I)}`) +
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
    const key = c.layout.id;
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
      rows.push(kv('R<sub>eq</sub>', qv('qR', fmtOhm(c.Req))));
      rows.push(kv('I = ε / R<sub>eq</sub>', qv('qI', fmtI(bat.value / c.Req))));
    }
    for (const e of c.edges) {
      if (e.type !== 'R') continue;
      const I = c.sol.I[e.id];
      rows.push(kv(`I<sub>${e.n}</sub> · ΔV<sub>${e.n}</sub>`, `${qv('qI', fmtI(I))} · ${qv('qV', fmtV(Math.abs(I * e.value)))}`));
    }
    if (c.junction) {
      const terms = c.junction.terms
        .filter((t) => t.e.type !== 'W' || t.e.jname)
        .map((t) => signed(t.Iin, 3))
        .join(' ');
      rows.push(kv('Junction ΣI<sub>in</sub>', `${terms} = <span class="ok">${fmtI(clean(c.junction.sum))}</span>`));
    }
    for (const l of c.loops) {
      const terms = l.terms
        .filter((t) => t.e.type !== 'W')
        .map((t) => signed(t.dV))
        .join(' ');
      rows.push(kv(`Loop: ${l.name}`, `${terms} = <span class="ok">${fmtV(clean(l.sum))}</span>`));
    }
    rows.push(kv('P batteries Σ εI', qv('qP', fmtP(c.Pbat))));
    rows.push(kv('P resistors Σ I²R', qv('qP', fmtP(c.Pres))));
    return rows.join('');
  },
  readout(state, computed) {
    const c = computed.circ;
    if (!c) return '';
    const bat = c.edges.find((e) => e.type === 'V');
    return cells([
      [c.Req != null ? 'R_eq' : 'Battery 1 current', c.Req != null ? fmtOhm(c.Req) : fmtI(c.sol.I[bat.id]), c.Req != null ? 'qR' : 'qI'],
      ['Battery current', fmtI(c.sol.I[bat.id]), 'qI'],
      ['Loop rule max |ΣΔV|', fmtV(c.loopMax), 'ok'],
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
        body: `The same ${fmtI(I('R1'))} passes through every resistor, so the voltage divides in proportion to R: ΔV₂/ΔV₃ = R₂/R₃ = ${(v('R2') / v('R3')).toFixed(2)}. Adding a resistor in series always raises R_eq and lowers I.`,
      };
    }
    if (c.layout.id === 'parallel') {
      return {
        title: 'Parallel: same voltage, currents add',
        body: `Each branch sits directly across the battery, so each gets the full ε and I_k = ε/R_k. At the junction I = I₁ + I₂ + I₃ = ${fmtI(I('E1'))}. R_eq = ${fmtOhm(c.Req)} is smaller than the smallest branch — adding a branch always lowers R_eq.`,
      };
    }
    if (c.layout.id === 'combo') {
      return {
        title: 'Reduce from the inside out',
        body: `R₂ ∥ R₃ = ${fmtOhm((v('R2') * v('R3')) / (v('R2') + v('R3')))}, then add R₁ in series: R_eq = ${fmtOhm(c.Req)}. The full current ${fmtI(I('E1'))} goes through R₁, then splits: more through the smaller of R₂ and R₃.`,
      };
    }
    const neg = c.edges.filter((e) => e.type === 'R' && I(e.id) < -1e-4).map((e) => `I${'₀₁₂₃₄'[e.n]} = ${fmtI(I(e.id))}`);
    return {
      title: 'No single R_eq — use Kirchhoff',
      body: `Two batteries in different branches cannot be reduced to one resistor. Unknowns I₁, I₂, I₃: one junction rule at the top node plus one loop rule per loop gives three equations. ${
        neg.length ? `The solution has ${neg.join(', ')} — negative just means that current really runs opposite the direction assumed (the dots show it).` : 'Every current came out positive, so the assumed directions were right.'
      } Walk a loop: − → + across a battery is +ε, along the current through a resistor is −IR.`,
    };
  },
});
