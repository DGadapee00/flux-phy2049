/** Exam 4 · Ch 43–44 (DC circuits, Kirchhoff, RC), 45 (magnetism), 46 (magnetic force), 47 (B from currents). */
import { problem, kase, range, choice, SIGN, UPDOWN, num, mc, sym, self, MU0, QE, ME, MP, DEG, AXES6, axisCode, texNum, texDeg, qty, pq as pv } from '../kit.js';

const E4 = { exam: 'e4' };
const PART = choice(['proton', 'a proton'], ['electron', 'an electron']);
const pq = (p) => (p === 'proton' ? QE : -QE);
const pm = (p) => (p === 'proton' ? MP : ME);
const vals = (s, o) => {
  s.values = { ...o };
};
/** Directions on a printed page: right = +x, up the page = +y, out of the page = +z. */
const PAGE_DIRS = [['right', 'Right'], ['left', 'Left'], ['up', 'Up the page'], ['down', 'Down the page'], ['in', 'Into the page'], ['out', 'Out of the page']];

export default [
  // ================================================================= 43
  problem({
    ...E4, id: 'e4.43.series', ch: '43', lab: 'circuits', title: 'Three resistors in series', kind: 'numeric', topics: ['circuits', 'series'],
    vars: { E: range(3, 24, 1, 'V'), R1: range(1, 20, 1, 'Ω'), R2: range(1, 20, 1, 'Ω'), R3: range(1, 20, 1, 'Ω') },
    derive: ($) => {
      const Req = $.R1 + $.R2 + $.R3;
      const I = $.E / Req;
      return { Req, I, V2: I * $.R2, P: $.E * I };
    },
    text: (T) => `A ${T.E} V battery drives R₁ = ${T.R1} Ω, R₂ = ${T.R2} Ω and R₃ = ${T.R3} Ω in series. Find $R_{\\text{eq}}$, the current, the voltage across R₂, and the power delivered by the battery.`,
    parts: [
      sym('V2_sym', 'E*R2/(R1 + R2 + R3)', { E: 'V', R1: 'Ω', R2: 'Ω', R3: 'Ω' }, ($) => $.V2, { unit: 'V', label: String.raw`$V_2$ as a formula` }),
      num('Req', ($) => $.Req, 'Ω'),
      num('I', ($) => $.I, 'A'),
      num('V2', ($) => $.V2, 'V'),
      num('P', ($) => $.P, 'W'),
    ],
    steps: ($, f) => [
      String.raw`$R_{\text{eq}} = R_1 + R_2 + R_3 = (${texNum($.R1)} + ${texNum($.R2)} + ${texNum($.R3)})\ \Omega = ${texNum($.Req)}\ \Omega$`,
      String.raw`$I = \dfrac{\varepsilon}{R_{\text{eq}}} = \dfrac{${qty($.E, 'V')}}{${qty($.Req, 'Ω')}} = ${texNum($.I)}\ \text{A}$ — the same through every resistor`,
      String.raw`$V_2 = IR_2 = ${pv($.I, 'A')}${pv($.R2, 'Ω')} = ${texNum($.V2)}\ \text{V}$`,
      String.raw`$P = \varepsilon I = ${pv($.E, 'V')}${pv($.I, 'A')} = ${texNum($.P)}\ \text{W}$`,
    ],
    sim: {
      scenario: 'series',
      setup: (s, $) => vals(s, { E1: $.E, R1: $.R1, R2: $.R2, R3: $.R3 }),
      read: (c) => ({ I: c.circ.sol.I.R1, V2: c.circ.sol.V.tm - c.circ.sol.V.tr }),
    },
    cases: [kase('lab default', { E: 12, R1: 2, R2: 4, R3: 6 }, { Req: 12, I: 1, V2: 4, P: 12 })],
  }),
  problem({
    ...E4, id: 'e4.43.parallel', ch: '43', lab: 'circuits', title: 'Three resistors in parallel', kind: 'numeric', topics: ['circuits', 'parallel'],
    vars: { E: range(3, 24, 1, 'V'), R1: range(1, 30, 1, 'Ω'), R2: range(1, 30, 1, 'Ω'), R3: range(1, 30, 1, 'Ω') },
    derive: ($) => {
      const Req = 1 / (1 / $.R1 + 1 / $.R2 + 1 / $.R3);
      return { Req, I: $.E / Req, I2: $.E / $.R2 };
    },
    text: (T) => `R₁ = ${T.R1} Ω, R₂ = ${T.R2} Ω and R₃ = ${T.R3} Ω are in parallel across a ${T.E} V battery. Find $R_{\\text{eq}}$, the total current, and the current through R₂.`,
    parts: [
      sym('Req_sym', '1/(1/R1 + 1/R2 + 1/R3)', { R1: 'Ω', R2: 'Ω', R3: 'Ω' }, ($) => $.Req, { unit: 'Ω', label: String.raw`$R_{\text{eq}}$ as a formula` }),
      num('Req', ($) => $.Req, 'Ω'),
      num('I', ($) => $.I, 'A'),
      num('I2', ($) => $.I2, 'A'),
    ],
    steps: ($, f) => [
      String.raw`$\dfrac{1}{R_{\text{eq}}} = \dfrac{1}{${qty($.R1, 'Ω')}} + \dfrac{1}{${qty($.R2, 'Ω')}} + \dfrac{1}{${qty($.R3, 'Ω')}} \;\Longrightarrow\; R_{\text{eq}} = ${texNum($.Req)}\ \Omega$`,
      String.raw`$I = \dfrac{\varepsilon}{R_{\text{eq}}} = \dfrac{${qty($.E, 'V')}}{${qty($.Req, 'Ω')}} = ${texNum($.I)}\ \text{A}$`,
      String.raw`Each branch has the full battery voltage, so $I_2 = \dfrac{\varepsilon}{R_2} = \dfrac{${qty($.E, 'V')}}{${qty($.R2, 'Ω')}} = ${texNum($.I2)}\ \text{A}$`,
    ],
    sim: {
      scenario: 'parallel',
      setup: (s, $) => vals(s, { E1: $.E, R1: $.R1, R2: $.R2, R3: $.R3 }),
      read: (c) => ({ I: c.circ.sol.I.E1, I2: c.circ.sol.I.R2 }),
    },
    cases: [kase('lab default', { E: 12, R1: 3, R2: 6, R3: 12 }, { Req: 1.714, I: 7, I2: 2 })],
  }),
  problem({
    ...E4, id: 'e4.43.combo', ch: '43', lab: 'circuits', title: 'R₁ in series with R₂ ∥ R₃', kind: 'numeric', level: 2, topics: ['circuits', 'series', 'parallel'],
    vars: { E: range(3, 24, 1, 'V'), R1: range(1, 20, 1, 'Ω'), R2: range(1, 20, 1, 'Ω'), R3: range(1, 20, 1, 'Ω') },
    derive: ($) => {
      const Rp = ($.R2 * $.R3) / ($.R2 + $.R3);
      const Req = $.R1 + Rp;
      const I1 = $.E / Req;
      return { Rp, Req, I1, Vp: I1 * Rp, I3: (I1 * Rp) / $.R3 };
    },
    text: (T) => `R₁ = ${T.R1} Ω is in series with the parallel pair R₂ = ${T.R2} Ω and R₃ = ${T.R3} Ω, across a ${T.E} V battery. Find $R_{\\text{eq}}$, the current through R₁, and the current through R₃.`,
    parts: [
      sym('Req_sym', 'R1 + R2*R3/(R2 + R3)', { R1: 'Ω', R2: 'Ω', R3: 'Ω' }, ($) => $.Req, { unit: 'Ω', label: String.raw`$R_{\text{eq}}$ as a formula` }),
      num('Req', ($) => $.Req, 'Ω'),
      num('I1', ($) => $.I1, 'A'),
      num('I3', ($) => $.I3, 'A'),
    ],
    steps: ($, f) => [
      String.raw`$R_{23} = \dfrac{R_2R_3}{R_2 + R_3} = \dfrac{(${texNum($.R2)})(${texNum($.R3)})}{${texNum($.R2)} + ${texNum($.R3)}}\ \Omega = ${texNum($.Rp)}\ \Omega$, so $R_{\text{eq}} = R_1 + R_{23} = ${texNum($.Req)}\ \Omega$`,
      String.raw`$I_1 = \dfrac{\varepsilon}{R_{\text{eq}}} = \dfrac{${qty($.E, 'V')}}{${qty($.Req, 'Ω')}} = ${texNum($.I1)}\ \text{A}$`,
      String.raw`$V_{23} = I_1R_{23} = ${pv($.I1, 'A')}${pv($.Rp, 'Ω')} = ${texNum($.Vp)}\ \text{V} \;\Longrightarrow\; I_3 = \dfrac{V_{23}}{R_3} = \dfrac{${qty($.Vp, 'V')}}{${qty($.R3, 'Ω')}} = ${texNum($.I3)}\ \text{A}$`,
    ],
    sim: {
      scenario: 'combo',
      setup: (s, $) => vals(s, { E1: $.E, R1: $.R1, R2: $.R2, R3: $.R3 }),
      read: (c) => ({ I1: c.circ.sol.I.R1, I3: c.circ.sol.I.R3 }),
    },
    cases: [kase('lab default', { E: 12, R1: 4, R2: 6, R3: 3 }, { Req: 6, I1: 2, I3: 1.3333 })],
  }),
  problem({
    ...E4, id: 'e4.43.add-resistor', ch: '43', lab: 'circuits', title: 'Adding a resistor', kind: 'conceptual', topics: ['circuits'],
    vars: { how: choice([1, 'in series with'], [2, 'in parallel with']), qty: choice([1, 'the total resistance'], [2, 'the current from the battery']) },
    text: (T) => `A third resistor is added ${T.how} two resistors already connected across a battery. What happens to ${T.qty}?`,
    parts: [mc('ans', [[1, 'It increases'], [-1, 'It decreases'], [0, 'It stays the same']], ($) => ($.how === 1 ? 1 : -1) * ($.qty === 1 ? 1 : -1))],
    steps: () => [
      String.raw`A resistor in series adds resistance; one in parallel adds another path, so $R_{\text{eq}}$ drops.`,
      String.raw`$I = \varepsilon/R_{\text{eq}}$ moves the opposite way.`,
    ],
    cases: [kase('parallel, current', { how: 2, qty: 2 }, { ans: 1 })],
  }),
  problem({
    ...E4, id: 'e4.43.series-parallel-ideas', ch: '43', lab: 'circuits', src: 'Practice 43 #1–3', title: 'Series or parallel? The ideas', kind: 'conceptual', topics: ['circuits', 'series', 'parallel'],
    vars: {
      ask: choice(
        ['out', 'Five lamps run from one supply. When one of them burns out, the other four stay lit. How are the lamps wired?'],
        ['current', 'Two identical lamps are connected in series across a battery, and then in parallel across the same battery. Compared with the series connection, the current drawn from the battery in parallel is…'],
        ['req', 'Resistors connected in parallel have an equivalent resistance that is…'],
      ),
    },
    text: (T) => T.ask,
    parts: [
      mc('ans', ($) => ({
        out: [
          ['series', 'In series', 'In series there is only one path; one dead lamp breaks it and every lamp goes out.'],
          ['parallel', 'In parallel'],
          ['either', 'It could be either', 'A series string has one path, so a burnt-out lamp stops all the current. Only parallel wiring keeps the other paths complete.'],
        ],
        current: [
          ['less', 'Less', String.raw`In parallel each lamp gets the full battery voltage, and $R_{\text{eq}}$ is smaller than either lamp — so the battery supplies more, not less.`],
          ['more', 'More'],
          ['same', 'The same', String.raw`The battery current is $\varepsilon/R_{\text{eq}}$, and $R_{\text{eq}}$ is 4 times smaller in parallel than in series for two identical lamps.`],
          ['depends', 'Sometimes more, sometimes less', String.raw`For fixed lamps and a fixed battery it is always more: parallel always has the smaller $R_{\text{eq}}$.`],
        ],
        req: [
          ['always', 'Always less than the smallest resistor in the group'],
          ['often', 'Usually, but not always, less than the smallest', 'Adding a parallel path always adds a place for current to go, so the equivalent is always below the smallest one — not just usually.'],
          ['half', 'Half of the smallest resistor', 'Half the value is the special case of two equal resistors, not the rule.'],
          ['more', 'More than the largest resistor', 'That is the rule for series. Parallel paths lower the resistance.'],
        ],
      })[$.ask], ($) => ({ out: 'parallel', current: 'more', req: 'always' })[$.ask]),
    ],
    hints: [
      'Series: one path, one current, resistances add. Parallel: several paths, the same voltage across each, and the equivalent resistance drops.',
      String.raw`For parallel, $\dfrac{1}{R_{\text{eq}}} = \sum\dfrac{1}{R_i}$ — every term adds, so $1/R_{\text{eq}}$ is bigger than any single $1/R_i$.`,
    ],
    steps: ($) => [
      ({
        out: 'Each lamp has its own path from the supply and back, so one opening leaves the others complete: parallel.',
        current: String.raw`Series: $R_{\text{eq}} = 2R$, so $I = \varepsilon/2R$. Parallel: $R_{\text{eq}} = R/2$, so $I = 2\varepsilon/R$ — four times more.`,
        req: String.raw`$\dfrac{1}{R_{\text{eq}}} = \dfrac{1}{R_1} + \dfrac{1}{R_2} + \dots > \dfrac{1}{R_{\min}}$, so $R_{\text{eq}} < R_{\min}$ every time.`,
      })[$.ask],
    ],
    cases: [
      kase('#1', { ask: 'out' }, { ans: 'parallel' }, { key: 'B) parallel' }),
      kase('#2', { ask: 'current' }, { ans: 'more' }, { key: 'C) more' }),
      kase('#3', { ask: 'req' }, { ans: 'always' }, { key: 'A) always less than the resistance of the lowest resistor' }),
    ],
  }),
  problem({
    ...E4, id: 'e4.43.four-resistors', ch: '43', lab: 'circuits', src: 'Practice 43 #5–6', title: 'Four resistors in series or in parallel', kind: 'numeric', topics: ['circuits', 'series', 'parallel'],
    vars: {
      mode: choice([1, 'in series'], [2, 'in parallel']),
      E: range(3, 48, 1, 'V'),
      R1: range(5, 100, 5, 'Ω'), R2: range(5, 100, 5, 'Ω'), R3: range(5, 100, 5, 'Ω'), R4: range(5, 100, 5, 'Ω'),
      k: choice([1, 'R₁'], [2, 'R₂'], [3, 'R₃'], [4, 'R₄']),
    },
    derive: ($) => {
      const Rs = [$.R1, $.R2, $.R3, $.R4];
      const Req = $.mode === 1 ? Rs.reduce((a, b) => a + b, 0) : 1 / Rs.reduce((a, b) => a + 1 / b, 0);
      const I = $.E / Req;
      const Rk = Rs[$.k - 1];
      const Ik = $.mode === 1 ? I : $.E / Rk;
      return { Rs, Req, I, Rk, Ik, Vk: $.mode === 1 ? I * Rk : $.E, P: $.E * I };
    },
    text: (T) => `Four resistors — R₁ = ${T.R1} Ω, R₂ = ${T.R2} Ω, R₃ = ${T.R3} Ω and R₄ = ${T.R4} Ω — are connected ${T.mode} across a ${T.E} V dc supply. Find the equivalent resistance, the current from the supply, the current through ${T.k} and the voltage across it, and the power the supply delivers.`,
    parts: [
      num('Req', ($) => $.Req, 'Ω', { label: String.raw`$R_{\text{eq}}$` }),
      num('I', ($) => $.I, 'A', { label: 'Supply current' }),
      num('Ik', ($) => $.Ik, 'A', { label: (T) => `Current through ${T.k}` }),
      num('Vk', ($) => $.Vk, 'V', { label: (T) => `Voltage across ${T.k}` }),
      num('P', ($) => $.P, 'W', { label: 'Power delivered' }),
    ],
    hints: [
      String.raw`Series: $R_{\text{eq}} = \sum R_i$ and one current flows through all of them. Parallel: $\dfrac{1}{R_{\text{eq}}} = \sum \dfrac{1}{R_i}$ and every resistor has the full supply voltage.`,
      String.raw`The supply delivers $P = \varepsilon I$ — the same as adding $I_i^2R_i$ over all four.`,
    ],
    steps: ($) => [
      $.mode === 1
        ? String.raw`$R_{\text{eq}} = R_1 + R_2 + R_3 + R_4 = (${$.Rs.map((r) => texNum(r)).join(' + ')})\ \Omega = ${texNum($.Req)}\ \Omega$`
        : String.raw`$\dfrac{1}{R_{\text{eq}}} = ${$.Rs.map((r) => String.raw`\dfrac{1}{${texNum(r)}}`).join(' + ')}\ \Omega^{-1} \;\Longrightarrow\; R_{\text{eq}} = ${texNum($.Req)}\ \Omega$`,
      String.raw`$I = \dfrac{\varepsilon}{R_{\text{eq}}} = \dfrac{${qty($.E, 'V')}}{${qty($.Req, 'Ω')}} = ${texNum($.I)}\ \text{A}$`,
      $.mode === 1
        ? String.raw`In series every resistor carries $${texNum($.I)}\ \text{A}$, so $V_${$.k} = IR_${$.k} = ${pv($.I, 'A')}${pv($.Rk, 'Ω')} = ${texNum($.Vk)}\ \text{V}$`
        : String.raw`In parallel every resistor has the full $${texNum($.E)}\ \text{V}$, so $I_${$.k} = \dfrac{\varepsilon}{R_${$.k}} = \dfrac{${qty($.E, 'V')}}{${qty($.Rk, 'Ω')}} = ${texNum($.Ik)}\ \text{A}$`,
      String.raw`$P = \varepsilon I = ${pv($.E, 'V')}${pv($.I, 'A')} = ${texNum($.P)}\ \text{W}$`,
    ],
    sim: {
      scenario: 'series4',
      setup(s, $) {
        s.scenarioId = $.mode === 1 ? 'series4' : 'parallel4';
        vals(s, { E1: $.E, R1: $.R1, R2: $.R2, R3: $.R3, R4: $.R4 });
      },
      read: (c, s, $) => {
        const Ik = Math.abs(c.circ.sol.I[`R${$.k}`]);
        return { Req: c.circ.Req, I: Math.abs(c.circ.sol.I.E1), Ik, Vk: Ik * $.Rk, P: c.circ.Pbat };
      },
    },
    cases: [
      kase('#5', { mode: 1, E: 12, R1: 20, R2: 40, R3: 60, R4: 80, k: 3 }, { Req: 200, I: 0.06, Ik: 0.06, Vk: 3.6, P: 0.72 }, { key: 'A) 200 Ω  B) 0.06 A  C) 0.06 A  D) V3 = 3.6 V  E) 0.72 W' }),
      kase('#6', { mode: 2, E: 12, R1: 20, R2: 40, R3: 60, R4: 80, k: 1 }, { Req: 9.6, I: 1.25, Ik: 0.6, Vk: 12, P: 15 }, { key: 'A) 9.6 Ω  B) 1.25 A  C) I1 = 0.6 A  D) 12 V  E) 15 W' }),
    ],
  }),
  problem({
    ...E4, id: 'e4.43.parallel-from-total', ch: '43', lab: 'circuits', src: 'Practice 43 #7–8', title: 'A parallel pair, given the total current', kind: 'numeric', topics: ['circuits', 'parallel'],
    vars: { R1: range(1, 30, 1, 'Ω'), R2: range(1, 60, 1, 'Ω'), I: range(0.5, 10, 0.5, 'A'), w: choice([1, 'R₁'], [2, 'R₂']) },
    derive: ($) => {
      const Req = ($.R1 * $.R2) / ($.R1 + $.R2);
      const V = $.I * Req;
      return { Req, V, Iw: V / ($.w === 1 ? $.R1 : $.R2), Rw: $.w === 1 ? $.R1 : $.R2 };
    },
    valid: ($) => $.R1 !== $.R2,
    text: (T) => `R₁ = ${T.R1} Ω and R₂ = ${T.R2} Ω are connected in parallel across a dc supply. The total current from the supply is ${T.I} A. Find the supply voltage and the current through ${T.w}.`,
    parts: [
      sym('V_sym', 'I*R1*R2/(R1 + R2)', { I: 'A', R1: 'Ω', R2: 'Ω' }, ($) => $.V, { unit: 'V', label: String.raw`the supply voltage $V$ as a formula` }),
      num('V', ($) => $.V, 'V', { label: 'Supply voltage' }),
      num('Iw', ($) => $.Iw, 'A', { label: (T) => `Current through ${T.w}` }),
    ],
    hints: [
      String.raw`Find the pair's equivalent first: $R_{\text{eq}} = \dfrac{R_1R_2}{R_1 + R_2}$, then $V = IR_{\text{eq}}$.`,
      'Both resistors have that same voltage across them; the smaller resistor takes the bigger share of the current.',
    ],
    steps: ($) => [
      String.raw`$R_{\text{eq}} = \dfrac{R_1R_2}{R_1 + R_2} = \dfrac{(${texNum($.R1)})(${texNum($.R2)})}{${texNum($.R1)} + ${texNum($.R2)}}\ \Omega = ${texNum($.Req)}\ \Omega$`,
      String.raw`$V = IR_{\text{eq}} = ${pv($.I, 'A')}${pv($.Req, 'Ω')} = ${texNum($.V)}\ \text{V}$`,
      String.raw`$I_${$.w} = \dfrac{V}{R_${$.w}} = \dfrac{${qty($.V, 'V')}}{${qty($.Rw, 'Ω')}} = ${texNum($.Iw)}\ \text{A}$`,
    ],
    sim: {
      scenario: 'pair',
      // The lab is driven by a battery, so it gets the voltage worked out from the total current;
      // it then has to reproduce that total current on its own.
      setup: (s, $) => vals(s, { E1: $.V, R1: $.R1, R2: $.R2 }),
      read: (c, s, $) => ({ Iw: Math.abs(c.circ.sol.I[`R${$.w}`]), '@battery current = the stated total': [c.circ.sol.I.E1, $.I] }),
    },
    cases: [kase('#7–8', { R1: 4, R2: 12, I: 2, w: 2 }, { V: 6, Iw: 0.5 }, { key: '7) 6 V  8) 0.5 A' })],
  }),
  problem({
    ...E4, id: 'e4.43.bulb-networks', ch: '43', lab: 'circuits', src: 'Practice 43 #9–12', title: 'Identical bulbs: nodes, current and brightness', kind: 'conceptual', topics: ['circuits', 'series', 'parallel'],
    vars: {
      net: choice(
        ['Cser', 'Bulb C sits in the wire next to the battery, so all the battery current passes through it. After C the circuit splits into two branches, one holding bulb A and the other bulb B, which join again before returning to the battery.'],
        ['Aown', 'Two branches run across the battery. One branch holds bulb A alone; the other holds bulbs B and C one after the other.'],
      ),
      ask: choice(['nodes', 'How many nodes (points where three or more wires meet) does the circuit have?'], ['current', 'Which bulb carries the most current?'], ['bright', 'Which bulb shines brightest?']),
    },
    text: (T) => `Three identical bulbs are connected to an ideal battery. ${T.net} ${T.ask}`,
    parts: [
      mc('ans', ($) => ($.ask === 'nodes'
        ? [
            [1, '1', 'A node is where current splits or joins; a split needs one point and the rejoin another.'],
            [2, '2'],
            [3, '3', 'Count only the points where three or more wires meet — the bends and the bulb ends are not nodes.'],
            [4, '4', 'Count only the points where three or more wires meet — the bends and the bulb ends are not nodes.'],
            [0, '0', 'The circuit splits into two branches, so there are points where three wires meet.'],
          ]
        : [
            ['A', 'Bulb A', () => ($.net === 'Cser' ? 'A and B split the current that went through C, so each gets only half of it.' : '')],
            ['B', 'Bulb B', () => ($.net === 'Cser' ? 'A and B split the current that went through C, so each gets only half of it.' : 'B shares its branch with C, so that branch has twice the resistance of A’s and carries half the current.')],
            ['C', 'Bulb C', () => ($.net === 'Cser' ? '' : 'C shares its branch with B, so that branch has twice the resistance of A’s and carries half the current.')],
            ['AB', 'A and B equally', 'A and B do carry equal currents, but C carries both of theirs added together.'],
            ['BC', 'B and C equally', 'B and C carry the same current as each other, but their branch has twice the resistance of A’s, so A carries twice as much.'],
            ['same', 'All the same', 'Only bulbs in a single series string share one current. Here the circuit splits, so the currents differ.'],
          ]), ($) => ($.ask === 'nodes' ? 2 : $.net === 'Cser' ? 'C' : 'A')),
    ],
    hints: [
      'Current splits at a node and rejoins at another; bulbs in the same unbranched wire carry the same current.',
      String.raw`Identical bulbs have the same $R$, so brightness $P = I^2R$ follows the current.`,
    ],
    steps: ($) => [
      $.net === 'Cser'
        ? String.raw`C carries the whole current $I$. At the first node it splits equally between A and B ($I/2$ each), and the two halves rejoin at the second node.`
        : String.raw`Each branch has the full battery voltage. A's branch has resistance $R$, the B–C branch $2R$, so A carries $\varepsilon/R$ and B and C each carry $\varepsilon/2R$.`,
      ({ nodes: 'The two points where the branches split and rejoin are the nodes: 2.', current: `Most current: bulb ${$.net === 'Cser' ? 'C' : 'A'}.`, bright: String.raw`$P = I^2R$ with equal $R$: the bulb with the most current, ${$.net === 'Cser' ? 'C' : 'A'}, is brightest.` })[$.ask],
    ],
    sim: {
      scenario: 'bulbsC',
      setup(s, $) {
        s.scenarioId = $.net === 'Cser' ? 'bulbsC' : 'bulbsA';
        vals(s, { E1: 12, A: 10, B: 10, C: 10 });
        return 'Identical bulbs, each drawn as a 10 Ω resistor, on a 12 V battery.';
      },
      read: (c, s, $) => {
        if ($.ask === 'nodes') {
          const deg = {};
          for (const e of c.circ.edges) for (const n of [e.a, e.b]) deg[n] = (deg[n] || 0) + 1;
          return { ans: Object.values(deg).filter((d) => d >= 3).length };
        }
        const I = ['A', 'B', 'C'].map((L) => [L, Math.abs(c.circ.sol.I[L])]).sort((a, b) => b[1] - a[1]);
        return { ans: I[0][0] };
      },
    },
    cases: [
      kase('#9', { net: 'Cser', ask: 'nodes' }, { ans: 2 }, { key: 'B) 2' }),
      kase('#10', { net: 'Cser', ask: 'current' }, { ans: 'C' }, { key: 'C) Bulb C' }),
      kase('#11', { net: 'Cser', ask: 'bright' }, { ans: 'C' }, { key: 'C) Bulb C' }),
      kase('#12', { net: 'Aown', ask: 'current' }, { ans: 'A' }, { key: 'A) Bulb A' }),
    ],
  }),
  problem({
    ...E4, id: 'e4.43.series-pair-series', ch: '43', lab: 'circuits', src: 'Practice 43 #13–17', title: 'A parallel pair between two series resistors', kind: 'numeric', level: 2, topics: ['circuits', 'series', 'parallel'],
    vars: { V: range(6, 60, 1, 'V'), R1: range(5, 50, 5, 'Ω'), R2: range(5, 60, 5, 'Ω'), R3: range(5, 60, 5, 'Ω'), R4: range(5, 50, 5, 'Ω') },
    derive: ($) => {
      const Rp = ($.R2 * $.R3) / ($.R2 + $.R3);
      const Req = $.R1 + Rp + $.R4;
      const I = $.V / Req;
      return { Rp, Req, I, V1: I * $.R1, Vp: I * Rp, I3: (I * Rp) / $.R3 };
    },
    text: (T) => `An ideal ${T.V} V battery drives one loop: from its + terminal the current passes R₁ = ${T.R1} Ω, then a parallel pair R₂ = ${T.R2} Ω and R₃ = ${T.R3} Ω, then R₄ = ${T.R4} Ω, and back to the battery. Find the equivalent resistance, the current through R₁, the voltage across R₁ and across R₂, and the current through R₃.`,
    parts: [
      sym('Req_sym', 'R1 + R2*R3/(R2 + R3) + R4', { R1: 'Ω', R2: 'Ω', R3: 'Ω', R4: 'Ω' }, ($) => $.Req, { unit: 'Ω', label: String.raw`$R_{\text{eq}}$ as a formula` }),
      num('Req', ($) => $.Req, 'Ω', { label: String.raw`$R_{\text{eq}}$` }),
      num('I', ($) => $.I, 'A', { label: 'Current through R₁' }),
      num('V1', ($) => $.V1, 'V', { label: 'Voltage across R₁' }),
      num('V2', ($) => $.Vp, 'V', { label: 'Voltage across R₂' }),
      num('I3', ($) => $.I3, 'A', { label: 'Current through R₃' }),
    ],
    hints: [
      String.raw`Collapse the pair first: $R_{23} = \dfrac{R_2R_3}{R_2 + R_3}$. Then $R_1$, $R_{23}$ and $R_4$ are in series.`,
      String.raw`R₁ carries the battery current. The pair has $V_{23} = IR_{23}$ across it — the same across R₂ and across R₃ — and $I_3 = V_{23}/R_3$.`,
    ],
    steps: ($) => [
      String.raw`$R_{23} = \dfrac{(${texNum($.R2)})(${texNum($.R3)})}{${texNum($.R2)} + ${texNum($.R3)}}\ \Omega = ${texNum($.Rp)}\ \Omega$, so $R_{\text{eq}} = R_1 + R_{23} + R_4 = (${texNum($.R1)} + ${texNum($.Rp)} + ${texNum($.R4)})\ \Omega = ${texNum($.Req)}\ \Omega$`,
      String.raw`$I = \dfrac{V}{R_{\text{eq}}} = \dfrac{${qty($.V, 'V')}}{${qty($.Req, 'Ω')}} = ${texNum($.I)}\ \text{A}$, and $V_1 = IR_1 = ${pv($.I, 'A')}${pv($.R1, 'Ω')} = ${texNum($.V1)}\ \text{V}$`,
      String.raw`$V_2 = V_3 = IR_{23} = ${pv($.I, 'A')}${pv($.Rp, 'Ω')} = ${texNum($.Vp)}\ \text{V}$, so $I_3 = \dfrac{V_3}{R_3} = \dfrac{${qty($.Vp, 'V')}}{${qty($.R3, 'Ω')}} = ${texNum($.I3)}\ \text{A}$`,
    ],
    sim: {
      scenario: 'ladder',
      setup: (s, $) => vals(s, { E1: $.V, R1: $.R1, R2: $.R2, R3: $.R3, R4: $.R4 }),
      read: (c, s, $) => ({ Req: c.circ.Req, I: Math.abs(c.circ.sol.I.R1), V1: Math.abs(c.circ.sol.I.R1) * $.R1, V2: Math.abs(c.circ.sol.I.R2) * $.R2, I3: Math.abs(c.circ.sol.I.R3) }),
    },
    cases: [kase('#13–17', { V: 40, R1: 10, R2: 20, R3: 20, R4: 30 }, { Req: 50, I: 0.8, V1: 8, V2: 8, I3: 0.4 }, { key: '13) 50 Ω  14) 0.8 A  15) 8 V  16) 8 V  17) 0.4 A' })],
  }),
  problem({
    ...E4, id: 'e4.43.branch-currents', ch: '43', lab: 'circuits', src: 'Practice 43 #18–19', title: 'One resistor on its own, two in series beside it', kind: 'numeric', topics: ['circuits', 'parallel', 'kirchhoff'],
    vars: { V: range(3, 48, 1, 'V'), R1: range(10, 200, 10, 'Ω'), R2: range(10, 200, 10, 'Ω'), R3: range(10, 200, 10, 'Ω') },
    derive: ($) => {
      const I1 = $.V / $.R1;
      const I23 = $.V / ($.R2 + $.R3);
      return { I1, I23, Ib: I1 + I23 };
    },
    text: (T) => `Two branches run across an ideal ${T.V} V battery. One holds R₁ = ${T.R1} Ω by itself; the other holds R₂ = ${T.R2} Ω and R₃ = ${T.R3} Ω in series. Find the current through each resistor and the current from the battery.`,
    parts: [
      num('I1', ($) => $.I1, 'A', { label: 'Through R₁' }),
      num('I2', ($) => $.I23, 'A', { label: 'Through R₂' }),
      num('I3', ($) => $.I23, 'A', { label: 'Through R₃' }),
      num('Ib', ($) => $.Ib, 'A', { label: 'From the battery' }),
    ],
    hints: [
      'Each branch is connected straight across the battery, so each has the full battery voltage.',
      String.raw`R₂ and R₃ share one branch, so they carry the same current, $\dfrac{V}{R_2 + R_3}$. The battery supplies both branches: $I = I_1 + I_{23}$ (Kirchhoff's junction rule gives the same).`,
    ],
    steps: ($) => [
      String.raw`$I_1 = \dfrac{V}{R_1} = \dfrac{${qty($.V, 'V')}}{${qty($.R1, 'Ω')}} = ${texNum($.I1)}\ \text{A}$`,
      String.raw`$I_2 = I_3 = \dfrac{V}{R_2 + R_3} = \dfrac{${qty($.V, 'V')}}{${qty($.R2 + $.R3, 'Ω')}} = ${texNum($.I23)}\ \text{A}$`,
      String.raw`Junction rule: $I = I_1 + I_2 = ${qty($.I1, 'A')} + ${qty($.I23, 'A')} = ${texNum($.Ib)}\ \text{A}$`,
    ],
    sim: {
      scenario: 'split',
      setup: (s, $) => vals(s, { E1: $.V, R1: $.R1, R2: $.R2, R3: $.R3 }),
      read: (c) => ({ I1: Math.abs(c.circ.sol.I.R1), I2: Math.abs(c.circ.sol.I.R2), I3: Math.abs(c.circ.sol.I.R3), Ib: Math.abs(c.circ.sol.I.E1) }),
    },
    cases: [
      kase('#18–19', { V: 12, R1: 50, R2: 100, R3: 50 }, { I1: 0.24, I2: 0.08, I3: 0.08, Ib: 0.32 }, {
        key: 'I1 = 0.32 A, I2 = 0.24 A, I3 = 0.08 A',
        note: 'The key lists the battery current (0.32 A), the R₁ current (0.24 A) and the R₂–R₃ branch current (0.08 A) under the labels I₁, I₂, I₃. Through the resistors named in the question, R₁ carries 0.24 A and R₂ and R₃ each carry 0.08 A.',
      }),
    ],
  }),
  problem({
    ...E4, id: 'e4.43.single-loop', ch: '43', lab: 'circuits', src: 'Practice 43 #20', title: 'One loop, two batteries', kind: 'numeric', topics: ['circuits', 'kirchhoff'],
    vars: {
      E1: range(2, 24, 1, 'V'), E2: range(1, 24, 1, 'V'), aid: choice([1, 'the same way round, so they push current the same way'], [-1, 'opposite ways round, so they push against each other']),
      R1: range(10, 300, 10, 'Ω'), R2: range(10, 300, 10, 'Ω'), R3: range(10, 300, 10, 'Ω'), R4: range(10, 300, 10, 'Ω'),
    },
    derive: ($) => {
      const Rt = $.R1 + $.R2 + $.R3 + $.R4;
      const net = $.E1 + $.aid * $.E2;
      return { Rt, net, I: Math.abs(net) / Rt };
    },
    valid: ($) => Math.abs($.net) >= 1,
    text: (T) => `A single loop holds two ideal batteries, ε₁ = ${T.E1} V and ε₂ = ${T.E2} V, and four resistors, R₁ = ${T.R1} Ω, R₂ = ${T.R2} Ω, R₃ = ${T.R3} Ω and R₄ = ${T.R4} Ω. The batteries are connected ${T.aid}. Find the current in the loop.`,
    parts: [num('I', ($) => $.I, 'A', { label: '|I|' })],
    hints: [
      String.raw`Kirchhoff's loop rule: going once around, the emfs and the $IR$ drops add to zero, $\sum\varepsilon = I\sum R$.`,
      'Batteries that push the same way add their emfs; batteries that oppose subtract. There is only one current, because there is only one path.',
    ],
    steps: ($) => [
      String.raw`Net emf: $${texNum($.E1)}\ \text{V} ${$.aid > 0 ? '+' : '-'} ${texNum($.E2)}\ \text{V} = ${texNum($.net)}\ \text{V}$; total resistance $${texNum($.Rt)}\ \Omega$`,
      String.raw`$|I| = \dfrac{|\sum\varepsilon|}{\sum R} = \dfrac{${qty(Math.abs($.net), 'V')}}{${qty($.Rt, 'Ω')}} = ${texNum($.I)}\ \text{A}$, flowing the way ${$.net > 0 ? 'ε₁' : 'ε₂'} pushes`,
    ],
    sim: {
      scenario: 'loop2',
      // The layout's ε₂ aids ε₁ when positive; a negative value is the battery turned round.
      setup: (s, $) => vals(s, { E1: $.E1, E2: $.aid * $.E2, R1: $.R1, R2: $.R2, R3: $.R3, R4: $.R4 }),
      read: (c) => ({ I: Math.abs(c.circ.sol.I.R1) }),
    },
    cases: [kase('#20', { E1: 10, E2: 5, aid: -1, R1: 100, R2: 200, R3: 50, R4: 200 }, { I: 0.009091 }, { key: '0.009 A' })],
  }),
  problem({
    ...E4, id: 'e4.43.three-branch', ch: '43', lab: 'circuits', src: 'Practice 43 #21', title: 'Three branches, three batteries (Kirchhoff)', kind: 'numeric', level: 3, topics: ['circuits', 'kirchhoff'],
    vars: {
      E1: range(2, 24, 1, 'V'), E2: range(2, 30, 1, 'V'), E3: range(1, 24, 1, 'V'),
      R1: range(10, 300, 10, 'Ω'), R4: range(10, 300, 10, 'Ω'), R2: range(10, 300, 10, 'Ω'), R3: range(10, 300, 10, 'Ω'),
    },
    derive: ($) => {
      const IL = ($.E1 - $.E2) / ($.R1 + $.R4); // into the top junction through the left branch
      const IR = ($.E3 - $.E2) / ($.R2 + $.R3); // into the top junction through the right branch
      return { IL, IR, IM: -(IL + IR) }; // out of ε₂'s + terminal, into the top junction
    },
    valid: ($) => Math.abs($.IL) > 1e-3 && Math.abs($.IR) > 1e-3 && Math.abs($.IM) > 1e-3,
    text: (T) => `Three branches join a top junction to a bottom junction. The left branch holds battery ε₁ = ${T.E1} V with R₁ = ${T.R1} Ω and R₄ = ${T.R4} Ω. The middle branch is battery ε₂ = ${T.E2} V alone, its + terminal at the top junction. The right branch holds battery ε₃ = ${T.E3} V with R₂ = ${T.R2} Ω and R₃ = ${T.R3} Ω. ε₁ and ε₃ are each turned to push current up toward the top junction. Find the size of the current through R₁, through R₂, and through ε₂.`,
    parts: [
      num('IR1', ($) => Math.abs($.IL), 'A', { label: 'Through R₁', abs: 2e-4 }),
      num('IR2', ($) => Math.abs($.IR), 'A', { label: 'Through R₂', abs: 2e-4 }),
      num('IE2', ($) => Math.abs($.IM), 'A', { label: 'Through ε₂', abs: 2e-4 }),
    ],
    hints: [
      String.raw`The middle battery is an ideal source by itself, so it fixes the top junction at $\varepsilon_2$ above the bottom one. That splits the problem into two separate loops.`,
      String.raw`Left loop: $\varepsilon_1 - I_L(R_1 + R_4) - \varepsilon_2 = 0$. Right loop: $\varepsilon_3 - I_R(R_2 + R_3) - \varepsilon_2 = 0$. Then the junction rule gives the battery's current.`,
    ],
    steps: ($) => [
      String.raw`Left branch: $I_L = \dfrac{\varepsilon_1 - \varepsilon_2}{R_1 + R_4} = \dfrac{${qty($.E1, 'V')} - ${qty($.E2, 'V')}}{${qty($.R1 + $.R4, 'Ω')}} = ${texNum($.IL)}\ \text{A}$${$.IL < 0 ? ' (the minus sign: it flows down, away from the top junction)' : ''}`,
      String.raw`Right branch: $I_R = \dfrac{\varepsilon_3 - \varepsilon_2}{R_2 + R_3} = \dfrac{${qty($.E3, 'V')} - ${qty($.E2, 'V')}}{${qty($.R2 + $.R3, 'Ω')}} = ${texNum($.IR)}\ \text{A}$`,
      String.raw`Junction rule at the top: $\varepsilon_2$ supplies $-(I_L + I_R) = ${texNum($.IM)}\ \text{A}$, so $|I| = ${texNum(Math.abs($.IM))}\ \text{A}$ through it`,
    ],
    sim: {
      scenario: 'threebranch',
      setup: (s, $) => vals(s, { E1: $.E1, E2: $.E2, E3: $.E3, R1: $.R1, R2: $.R2, R3: $.R3, R4: $.R4 }),
      read: (c) => ({ IR1: Math.abs(c.circ.sol.I.R1), IR2: Math.abs(c.circ.sol.I.R2), IE2: Math.abs(c.circ.sol.I.E2) }),
    },
    cases: [
      kase('#21', { E1: 10, E2: 20, E3: 5, R1: 100, R4: 200, R2: 200, R3: 50 }, { IR1: 0.03333, IR2: 0.06, IE2: 0.09333 }, {
        key: 'I1 = 0.02 A, I2 = 0.08 A, I3 = 0.06 A',
        note: 'The middle battery holds the junctions 20 V apart, so each outer branch is its own loop. R₂ and R₃ carry (20 − 5)/250 = 0.060 A, as the key says, and R₁ and R₄ carry (20 − 10)/300 = 0.033 A. No choice of battery polarity gives 0.02 A in R₁ (the possibilities are 0.033 A and 0.10 A), and ε₂ then carries 0.093 A, not 0.08 A.',
      }),
    ],
  }),
  problem({
    ...E4, id: 'e4.43.two-battery-bridge', ch: '43', lab: 'circuits', src: 'Practice 43 #22', title: 'Two batteries, one shared resistor (Kirchhoff)', kind: 'numeric', level: 3, topics: ['circuits', 'kirchhoff'],
    vars: {
      E1: range(2, 24, 1, 'V'), E2: range(2, 24, 1, 'V'), p2: choice([1, 'also pushes current toward the top junction'], [-1, 'is turned the other way, pushing current away from the top junction']),
      R1: range(1, 20, 1, 'Ω'), R2: range(1, 20, 1, 'Ω'), R3: range(1, 20, 1, 'Ω'),
    },
    derive: ($) => {
      const e2 = $.p2 * $.E2;
      const Vt = ($.E1 / $.R1 + e2 / $.R3) / (1 / $.R1 + 1 / $.R2 + 1 / $.R3);
      return { e2, Vt, I1: ($.E1 - Vt) / $.R1, I2: Vt / $.R2, I3: (e2 - Vt) / $.R3 };
    },
    valid: ($) => Math.abs($.I1) > 0.01 && Math.abs($.I2) > 0.01 && Math.abs($.I3) > 0.01,
    text: (T) => `R₂ = ${T.R2} Ω connects a top junction to a bottom junction. On the left, battery ε₁ = ${T.E1} V and R₁ = ${T.R1} Ω make a second path between the junctions, with ε₁ pushing current toward the top junction. On the right, battery ε₂ = ${T.E2} V and R₃ = ${T.R3} Ω make a third path; ε₂ ${T.p2}. Find the size of the current through R₁, R₂ and R₃.`,
    parts: [
      num('I1', ($) => Math.abs($.I1), 'A', { label: 'Through R₁', abs: 0.003 }),
      num('I2', ($) => Math.abs($.I2), 'A', { label: 'Through R₂', abs: 0.003 }),
      num('I3', ($) => Math.abs($.I3), 'A', { label: 'Through R₃', abs: 0.003 }),
    ],
    hints: [
      String.raw`Junction: $I_1 + I_3 = I_2$, with $I_1$ and $I_3$ flowing into the top junction and $I_2$ down through the middle resistor R₂.`,
      String.raw`Two loops, each through R₂: $\varepsilon_1 - I_1R_1 - I_2R_2 = 0$ and $(\pm\varepsilon_2) - I_3R_3 - I_2R_2 = 0$, with the sign of ε₂ set by which way it faces.`,
      'A negative current only means it flows opposite to the direction you assumed; the size is what is asked.',
    ],
    steps: ($) => [
      String.raw`Call the top junction's potential $V$ (bottom = 0). Then $I_1 = \dfrac{\varepsilon_1 - V}{R_1}$, $I_3 = \dfrac{${$.p2 > 0 ? '' : '-'}\varepsilon_2 - V}{R_3}$, $I_2 = \dfrac{V}{R_2}$, and $I_1 + I_3 = I_2$ gives`,
      String.raw`$V = \dfrac{\varepsilon_1/R_1 ${$.p2 > 0 ? '+' : '-'} \varepsilon_2/R_3}{1/R_1 + 1/R_2 + 1/R_3} = \dfrac{${texNum($.E1)}/${texNum($.R1)} ${$.p2 > 0 ? '+' : '-'} ${texNum($.E2)}/${texNum($.R3)}}{1/${texNum($.R1)} + 1/${texNum($.R2)} + 1/${texNum($.R3)}}\ \text{V} = ${texNum($.Vt)}\ \text{V}$`,
      String.raw`$I_1 = \dfrac{${qty($.E1, 'V')} - ${qty($.Vt, 'V')}}{${qty($.R1, 'Ω')}} = ${texNum($.I1)}\ \text{A}$, $I_2 = \dfrac{${qty($.Vt, 'V')}}{${qty($.R2, 'Ω')}} = ${texNum($.I2)}\ \text{A}$, $I_3 = \dfrac{${qty($.e2, 'V')} - ${qty($.Vt, 'V')}}{${qty($.R3, 'Ω')}} = ${texNum($.I3)}\ \text{A}$`,
    ],
    sim: {
      scenario: 'twoloop',
      setup: (s, $) => vals(s, { E1: $.E1, E2: $.e2, R1: $.R1, R2: $.R2, R3: $.R3 }),
      read: (c) => ({ I1: Math.abs(c.circ.sol.I.R1), I2: Math.abs(c.circ.sol.I.R2), I3: Math.abs(c.circ.sol.I.R3) }),
    },
    cases: [
      kase('#22', { E1: 12, E2: 9, p2: -1, R1: 7, R2: 4, R3: 8 }, { I1: 1.5517, I2: 0.2845, I3: 1.2672 }, {
        key: 'I1 = 1.55 A, I2 = 0.29 A, I3 = 1.27 A',
        note: 'This template names the resistors as the Circuits lab draws them: R₂ in the middle, R₃ on the right. The sheet calls the middle one (4 Ω) R₃ and the right one (8 Ω) R₂, and in its own labels the key swaps I₂ and I₃: the 8 Ω resistor carries 1.27 A and the 4 Ω one 0.284 A, which rounds to 0.28 A, not 0.29 A. With the batteries as drawn (both facing the same way along the bottom wire, so ε₂ opposes ε₁ around the outer loop) the top junction sits at 1.14 V. The sheet also lists V₃ = 5 V, which is not in the circuit.',
      }),
    ],
  }),
  problem({
    ...E4, id: 'e4.44.two-loop', ch: '44', lab: 'circuits', title: 'Two batteries, two loops (Kirchhoff)', kind: 'numeric', level: 3, topics: ['circuits', 'kirchhoff'],
    vars: { E1: range(2, 24, 1, 'V'), E2: range(2, 24, 1, 'V'), R1: range(1, 10, 1, 'Ω'), R2: range(1, 10, 1, 'Ω'), R3: range(1, 10, 1, 'Ω') },
    derive: ($) => {
      const Vm = ($.E1 / $.R1 + $.E2 / $.R3) / (1 / $.R1 + 1 / $.R2 + 1 / $.R3);
      return { Vm, I1: ($.E1 - Vm) / $.R1, I2: Vm / $.R2, I3: ($.E2 - Vm) / $.R3 };
    },
    text: (T) => `Left branch: ε₁ = ${T.E1} V in series with R₁ = ${T.R1} Ω. Middle branch: R₂ = ${T.R2} Ω. Right branch: ε₂ = ${T.E2} V in series with R₃ = ${T.R3} Ω. Both batteries have their + terminal toward the top junction. Taking I₁ and I₃ as flowing into the top junction and I₂ as flowing down through R₂, find all three currents (signed).`,
    parts: [num('I1', ($) => $.I1, 'A', { abs: 0.005 }), num('I2', ($) => $.I2, 'A', { abs: 0.005 }), num('I3', ($) => $.I3, 'A', { abs: 0.005 })],
    hints: [
      String.raw`Junction: $I_1 + I_3 = I_2$`,
      String.raw`Left loop: $\varepsilon_1 - I_1R_1 - I_2R_2 = 0$. Right loop: $\varepsilon_2 - I_3R_3 - I_2R_2 = 0$.`,
      'A negative answer just means the current flows opposite to the direction you assumed.',
    ],
    steps: ($, f) => [
      String.raw`Call the top junction's potential $V$ (bottom = 0). Then $I_1 = \dfrac{\varepsilon_1 - V}{R_1}$, $I_2 = \dfrac{V}{R_2}$, $I_3 = \dfrac{\varepsilon_2 - V}{R_3}$, and the junction rule gives`,
      String.raw`$V = \dfrac{\varepsilon_1/R_1 + \varepsilon_2/R_3}{1/R_1 + 1/R_2 + 1/R_3} = \dfrac{${texNum($.E1)}/${texNum($.R1)} + ${texNum($.E2)}/${texNum($.R3)}}{1/${texNum($.R1)} + 1/${texNum($.R2)} + 1/${texNum($.R3)}}\ \text{V} = ${texNum($.Vm)}\ \text{V}$`,
      String.raw`$I_1 = \dfrac{${qty($.E1, 'V')} - ${qty($.Vm, 'V')}}{${qty($.R1, 'Ω')}} = ${texNum($.I1)}\ \text{A}$, $I_2 = \dfrac{${qty($.Vm, 'V')}}{${qty($.R2, 'Ω')}} = ${texNum($.I2)}\ \text{A}$, $I_3 = \dfrac{${qty($.E2, 'V')} - ${qty($.Vm, 'V')}}{${qty($.R3, 'Ω')}} = ${texNum($.I3)}\ \text{A}$`,
    ],
    sim: {
      scenario: 'twoloop',
      setup: (s, $) => vals(s, { E1: $.E1, E2: $.E2, R1: $.R1, R2: $.R2, R3: $.R3 }),
      read: (c) => ({ I1: c.circ.sol.I.R1, I2: c.circ.sol.I.R2, I3: c.circ.sol.I.R3 }),
    },
    cases: [kase('Ch 44 example', { E1: 12, E2: 6, R1: 2, R2: 4, R3: 3 }, { I1: 2.3077, I2: 1.8462, I3: -0.4615 })],
  }),
  problem({
    ...E4, id: 'e4.44.terminal', ch: '44', lab: 'circuits', title: 'Internal resistance and terminal voltage', kind: 'numeric', topics: ['circuits', 'emf'],
    vars: { E: range(1.5, 24, 0.5, 'V'), r: range(0.1, 2, 0.1, 'Ω'), R: range(1, 30, 0.5, 'Ω') },
    derive: ($) => {
      const I = $.E / ($.R + $.r);
      return { I, V: $.E - I * $.r, Pr: I * I * $.r };
    },
    text: (T) => `A battery with emf ${T.E} V and internal resistance ${T.r} Ω drives a ${T.R} Ω load. Find the current, the terminal voltage, and the power wasted inside the battery.`,
    parts: [
      sym('V_sym', 'E*R/(R + r)', { E: 'V', R: 'Ω', r: 'Ω' }, ($) => $.V, { unit: 'V', label: String.raw`the terminal voltage $V$ as a formula` }),
      num('I', ($) => $.I, 'A'),
      num('V', ($) => $.V, 'V'),
      num('Pr', ($) => $.Pr, 'W'),
    ],
    steps: ($, f) => [
      String.raw`$I = \dfrac{\varepsilon}{R + r} = \dfrac{${qty($.E, 'V')}}{${qty($.R, 'Ω')} + ${qty($.r, 'Ω')}} = ${texNum($.I)}\ \text{A}$`,
      String.raw`$V = \varepsilon - Ir = ${qty($.E, 'V')} - ${pv($.I, 'A')}${pv($.r, 'Ω')} = ${texNum($.V)}\ \text{V}$`,
      String.raw`$P_r = I^2 r = ${pv($.I, 'A')}^2${pv($.r, 'Ω')} = ${texNum($.Pr)}\ \text{W}$`,
    ],
    sim: {
      scenario: 'internal',
      setup: (s, $) => vals(s, { E1: $.E, r: $.r, R: $.R }),
      read: (c) => ({ I: Math.abs(c.circ.sol.I.R), V: c.circ.sol.V.tl - c.circ.sol.V.bl, Pr: c.circ.sol.I.r ** 2 * c.circ.edges.find((e) => e.id === 'r').value }),
    },
    cases: [kase('hand', { E: 12, r: 0.5, R: 5.5 }, { I: 2, V: 11, Pr: 2 })],
  }),
  problem({
    ...E4, id: 'e4.44.rc-charge', ch: '44', src: 'Practice 44 #14A–D', title: 'Charging an RC circuit', kind: 'numeric', level: 2, topics: ['circuits', 'rc'],
    vars: { R: range(1, 1000, 1, 'kΩ', 1e3), C: range(10, 1000, 10, 'μF', 1e-6), E: range(3, 24, 1, 'V'), n: range(0.2, 4, 0.1, 'τ') },
    derive: ($) => {
      const tau = $.R * $.C;
      const t = $.n * tau;
      const k = Math.exp(-$.n);
      return { tau, t, k, q: $.C * $.E * (1 - k), I: ($.E / $.R) * k, VC: $.E * (1 - k), VR: $.E * k };
    },
    text: (T, $, f) => `An uncharged ${T.C} μF capacitor is connected through ${T.R} kΩ to a ${T.E} V battery at t = 0. Find the time constant, and at t = ${f($.t)} s the charge, the current, and the voltages across the capacitor and the resistor.`,
    parts: [
      sym('tau_sym', 'R*C', { R: 'Ω', C: 'F' }, ($) => $.tau, { unit: 's', label: String.raw`$\tau$ as a formula` }),
      num('tau', ($) => $.tau, 's', { label: 'τ' }), num('q', ($) => $.q, 'C'), num('I', ($) => $.I, 'A'),
      num('VC', ($) => $.VC, 'V', { label: String.raw`$V_C$` }), num('VR', ($) => $.VR, 'V', { label: String.raw`$V_R$` })],
    hints: [String.raw`$q(t) = C\varepsilon\left(1 - e^{-t/\tau}\right)$ and $I(t) = \dfrac{\varepsilon}{R}e^{-t/\tau}$`],
    steps: ($, f) => [
      String.raw`$\tau = RC = ${pv($.R, 'Ω')}${pv($.C, 'F')} = ${texNum($.tau)}\ \text{s}$, so $t/\tau = ${texNum($.n)}$`,
      String.raw`$q = C\varepsilon\left(1 - e^{-t/\tau}\right) = ${pv($.C, 'F')}${pv($.E, 'V')}\left(1 - e^{-${texNum($.n)}}\right) = ${texNum($.q)}\ \text{C}$`,
      String.raw`$I = \dfrac{\varepsilon}{R}e^{-t/\tau} = \dfrac{${qty($.E, 'V')}}{${qty($.R, 'Ω')}}e^{-${texNum($.n)}} = ${texNum($.I)}\ \text{A}$`,
      String.raw`$V_C = \dfrac{q}{C} = ${texNum($.VC)}\ \text{V}$ and $V_R = IR = ${texNum($.VR)}\ \text{V}$ — together they make up the battery's $${texNum($.E)}\ \text{V}$`,
    ],
    cases: [
      kase('#14A–D', { R: 400, C: 50, E: 24, n: 1.5 }, { tau: 20, q: 9.3225e-4, I: 1.3388e-5, VC: 18.645, VR: 5.3551 }, { key: 'A) 9.32 x 10-4 C  B) 18.6 V  C) 1.34 x 10-5 A  D) 5.4 V' }),
      kase('hand', { R: 10, C: 100, E: 12, n: 1 }, { tau: 1, q: 7.585e-4, I: 4.415e-4 }),
    ],
  }),
  problem({
    ...E4, id: 'e4.44.rc-discharge', ch: '44', title: 'Discharging a capacitor', kind: 'numeric', level: 2, topics: ['circuits', 'rc'],
    vars: { R: range(0.5, 50, 0.5, 'kΩ', 1e3), C: range(5, 500, 5, 'μF', 1e-6), f: range(0.05, 0.9, 0.05) },
    derive: ($) => ({ tau: $.R * $.C, t: -$.R * $.C * Math.log($.f) }),
    text: (T) => `A charged ${T.C} μF capacitor discharges through ${T.R} kΩ. How long until its charge falls to ${T.f} of the starting value?`,
    parts: [num('t', ($) => $.t, 's')],
    steps: ($, f) => [
      String.raw`$q = q_0 e^{-t/RC} \;\Longrightarrow\; t = -RC\ln(${texNum($.f)}) = ${texNum($.t)}\ \text{s}$`,
    ],
    cases: [kase('hand', { R: 2, C: 50, f: 0.25 }, { t: 0.1386 })],
  }),
  problem({
    ...E4, id: 'e4.44.rules', ch: '44', lab: 'circuits', src: 'Practice 43 #4', title: "What Kirchhoff's rules conserve", kind: 'conceptual', topics: ['kirchhoff'],
    vars: { rule: choice([1, 'junction rule'], [2, 'loop rule']) },
    text: (T) => `Kirchhoff's ${T.rule} is a statement of conservation of…`,
    parts: [mc('ans', [[1, 'Charge'], [2, 'Energy'], [3, 'Momentum'], [4, 'Current density']], ($) => $.rule)],
    steps: () => ['Junction: charge in = charge out. Loop: going around a closed path, the potential changes add to zero (energy per unit charge).'],
    sim: { scenario: 'twoloop' },
    cases: [kase('loop', { rule: 2 }, { ans: 2 }), kase('#4', { rule: 1 }, { ans: 1 }, { key: 'B) the law of conservation of charge' })],
  }),
  problem({
    ...E4, id: 'e4.44.cells-and-bulb', ch: '44', lab: 'circuits', src: 'Practice 44 #1–3', title: 'Cells aiding or opposing', kind: 'conceptual', topics: ['circuits', 'emf'],
    vars: {
      perm: choice(['ABC', 'A, B, C'], ['BCA', 'B, C, A'], ['CAB', 'C, A, B']),
      ask: choice(['bright', 'In which arrangement does the bulb shine brightest?'], ['dark', 'In which arrangement does the bulb not light at all?'], ['current', 'In which arrangement does the bulb draw the most current?']),
    },
    derive: ($) => {
      // Letters for: one cell, two cells with one reversed, two cells aiding.
      const [one, rev, aid] = [...$.perm];
      return { one, rev, aid };
    },
    text: (T, $) => {
      const d = { [$.one]: 'a single cell across the bulb', [$.rev]: 'two cells in series across the bulb, the second one turned around so the two face each other', [$.aid]: 'two cells in series across the bulb, both facing the same way' };
      return `Identical ideal cells are wired to identical bulbs in three arrangements. A: ${d.A}. B: ${d.B}. C: ${d.C}. ${T.ask}`;
    },
    parts: [
      mc('ans', ($) => {
        const why = (L) => {
          if ($.ask === 'dark') return L === $.one ? 'A single cell still drives current through its bulb.' : L === $.aid ? 'These two cells face the same way and add — this bulb is the brightest, not dark.' : '';
          return L === $.one ? 'One cell gives only half the voltage of two cells facing the same way.' : L === $.rev ? 'These two cells face each other and cancel, so that bulb stays dark.' : '';
        };
        const opts = ['A', 'B', 'C'].map((L) => [L, L, why(L)]);
        return $.ask === 'dark' ? opts : [...opts, ['same', 'All the same', 'The voltage across the bulb differs: one cell, two cells, and none (two cells cancelling).']];
      }, ($) => ($.ask === 'dark' ? $.rev : $.aid)),
    ],
    hints: [
      'Walk around each loop adding the cell voltages: a cell entered at its − end adds its emf, one entered at its + end subtracts it.',
      String.raw`The same bulb with twice the voltage carries twice the current and glows with four times the power, $P = V^2/R$.`,
    ],
    steps: ($) => [
      `${$.one}: one emf across the bulb. ${$.aid}: the cells add, 2ε across the bulb. ${$.rev}: the cells cancel, 0 across the bulb.`,
      ({ bright: `Brightest: ${$.aid}.`, dark: `No light: ${$.rev} — the net emf is zero.`, current: `Most current: ${$.aid}, with twice the voltage across the same bulb.` })[$.ask],
    ],
    sim: {
      scenario: 'cells-ABC',
      setup(s, $) {
        s.scenarioId = `cells-${$.perm}`;
        vals(s, {});
        return 'All three arrangements side by side: 1.5 V cells, identical 3 Ω bulbs.';
      },
      read: (c, s, $) => {
        const I = ['A', 'B', 'C'].map((L) => [L, Math.abs(c.circ.sol.I[L])]);
        if ($.ask === 'dark') return { ans: I.find(([, i]) => i < 1e-6)[0] };
        return { ans: I.sort((a, b) => b[1] - a[1])[0][0] };
      },
    },
    cases: [
      kase('#1', { perm: 'ABC', ask: 'bright' }, { ans: 'C' }, { key: 'C) C' }),
      kase('#2', { perm: 'ABC', ask: 'dark' }, { ans: 'B' }, { key: 'B) B' }),
      kase('#3', { perm: 'ABC', ask: 'current' }, { ans: 'C' }, { key: 'C) C' }),
    ],
  }),
  problem({
    ...E4, id: 'e4.44.battery-terminal', ch: '44', lab: 'circuits', src: 'Practice 44 #4–6', title: 'emf, internal resistance and terminal voltage', kind: 'numeric', topics: ['circuits', 'emf'],
    vars: {
      ask: choice(['r', 'the internal resistance'], ['P', 'the power delivered to the external resistor'], ['I', 'the current through the battery']),
      E: range(6, 120, 0.5, 'V'), r: range(0.1, 10, 0.1, 'Ω'), I: range(0.5, 20, 0.1, 'A'),
    },
    derive: ($) => {
      const Vt = $.E - $.I * $.r;
      return { Vt, PR: Vt * $.I, Pr: $.I * $.I * $.r, ans: { r: $.r, P: Vt * $.I, I: $.I }[$.ask] };
    },
    valid: ($) => $.Vt > 0.15 * $.E,
    text: (T, $, f) => ({
      r: `A battery with emf ${T.E} V delivers ${T.I} A to a load, and while it does, the voltage across its terminals drops to ${f($.Vt)} V. Find its internal resistance.`,
      P: `A battery has emf ${T.E} V and internal resistance ${T.r} Ω. A resistor connected across its terminals draws ${T.I} A. Find the power dissipated in that resistor.`,
      I: `A battery has emf ${T.E} V and internal resistance ${T.r} Ω. While it runs a load, its terminal voltage is ${f($.Vt)} V. Find the current through the battery, and say which way it flows.`,
    })[$.ask],
    parts: [
      num('ans', ($) => $.ans, ($) => ({ r: 'Ω', P: 'W', I: 'A' })[$.ask], { label: (T) => `${T.ask[0].toUpperCase()}${T.ask.slice(1)}` }),
    ],
    hints: [
      String.raw`Model the battery as an ideal emf in series with $r$. The terminal voltage is what is left after the internal drop: $V_{ab} = \varepsilon - Ir$.`,
      String.raw`The external resistor gets $P_R = V_{ab}I$. The power $I^2r$ is lost inside the battery — do not mix the two up.`,
    ],
    steps: ($) => [
      ({
        r: String.raw`$V_{ab} = \varepsilon - Ir \;\Longrightarrow\; r = \dfrac{\varepsilon - V_{ab}}{I} = \dfrac{${qty($.E, 'V')} - ${qty($.Vt, 'V')}}{${qty($.I, 'A')}} = ${texNum($.r)}\ \Omega$`,
        P: String.raw`$V_{ab} = \varepsilon - Ir = ${qty($.E, 'V')} - ${pv($.I, 'A')}${pv($.r, 'Ω')} = ${texNum($.Vt)}\ \text{V}$`,
        I: String.raw`$V_{ab} = \varepsilon - Ir \;\Longrightarrow\; I = \dfrac{\varepsilon - V_{ab}}{r} = \dfrac{${qty($.E, 'V')} - ${qty($.Vt, 'V')}}{${qty($.r, 'Ω')}} = ${texNum($.I)}\ \text{A}$`,
      })[$.ask],
      ({
        r: String.raw`Check: $I^2r = ${texNum($.Pr)}\ \text{W}$ is lost inside the battery.`,
        P: String.raw`$P_R = V_{ab}I = ${pv($.Vt, 'V')}${pv($.I, 'A')} = ${texNum($.PR)}\ \text{W}$ (the other $I^2r = ${texNum($.Pr)}\ \text{W}$ heats the battery)`,
        I: String.raw`$V_{ab} < \varepsilon$, so the battery is discharging: the current leaves its + terminal and flows through the battery from − to +.`,
      })[$.ask],
    ],
    sim: {
      scenario: 'internal',
      // The load is whatever resistance draws the stated current: R = V_ab / I.
      setup: (s, $) => vals(s, { E1: $.E, r: $.r, R: $.Vt / $.I }),
      read: (c, s, $) => {
        const I = Math.abs(c.circ.sol.I.R);
        const Vab = c.circ.sol.V.tl - c.circ.sol.V.bl;
        if ($.ask === 'r') return { '@terminal voltage': [Vab, $.Vt] };
        return { ans: $.ask === 'P' ? Vab * I : I };
      },
    },
    cases: [
      kase('#4', { ask: 'r', E: 12, r: 8 / 3, I: 1.5 }, { ans: 2.6667 }, { key: '2.67 Ω' }),
      kase('#5', { ask: 'P', E: 95, r: 5, I: 8.3 }, { ans: 444.05 }, {
        key: '344.4 W',
        note: '344.4 W is I²r = (8.3 A)²(5.0 Ω), the power lost inside the battery. The resistor R gets V_ab·I = (95.0 − 41.5) V × 8.3 A = 444 W.',
      }),
      kase('#6', { ask: 'I', E: 31, r: 2, I: 6.8 }, { ans: 6.8 }, { key: '6.8 A' }),
    ],
  }),
  problem({
    ...E4, id: 'e4.44.capacitor-pair', ch: '44', src: 'Practice 44 #7–8', title: 'Two capacitors in parallel or in series', kind: 'numeric', topics: ['capacitance', 'networks'],
    vars: { mode: choice([1, 'in parallel'], [2, 'in series']), V: range(3, 48, 1, 'V'), C1: range(0.5, 20, 0.5, 'μF', 1e-6), C2: range(0.5, 20, 0.5, 'μF', 1e-6) },
    derive: ($) => {
      const Ceq = $.mode === 1 ? $.C1 + $.C2 : ($.C1 * $.C2) / ($.C1 + $.C2);
      const Q1 = $.mode === 1 ? $.C1 * $.V : Ceq * $.V;
      return { Ceq, Q1, V1: Q1 / $.C1 };
    },
    valid: ($) => $.C1 !== $.C2,
    text: (T) => `C₁ = ${T.C1} μF and C₂ = ${T.C2} μF are connected ${T.mode} across a ${T.V} V battery and allowed to charge fully. Find the equivalent capacitance, the charge on C₁ and the voltage across C₁.`,
    parts: [
      num('Ceq', ($) => $.Ceq, 'μF', { scale: 1e-6, label: String.raw`$C_{\text{eq}}$` }),
      num('Q1', ($) => $.Q1, 'C', { label: 'Charge on C₁' }),
      num('V1', ($) => $.V1, 'V', { label: 'Voltage across C₁' }),
    ],
    hints: [
      String.raw`Capacitors combine the opposite way to resistors: in parallel $C_{\text{eq}} = C_1 + C_2$; in series $\dfrac{1}{C_{\text{eq}}} = \dfrac{1}{C_1} + \dfrac{1}{C_2}$.`,
      'In parallel each capacitor has the full battery voltage. In series each carries the same charge, the charge on the equivalent capacitor.',
    ],
    steps: ($) => ($.mode === 1
      ? [
          String.raw`$C_{\text{eq}} = C_1 + C_2 = (${texNum($.C1 * 1e6)} + ${texNum($.C2 * 1e6)})\ \mu\text{F} = ${texNum($.Ceq * 1e6)}\ \mu\text{F}$`,
          String.raw`Each has the full ${texNum($.V)} V: $Q_1 = C_1V = ${pv($.C1, 'F')}${pv($.V, 'V')} = ${texNum($.Q1)}\ \text{C}$, and $V_1 = ${texNum($.V1)}\ \text{V}$`,
        ]
      : [
          String.raw`$C_{\text{eq}} = \dfrac{C_1C_2}{C_1 + C_2} = \dfrac{(${texNum($.C1 * 1e6)})(${texNum($.C2 * 1e6)})}{${texNum($.C1 * 1e6)} + ${texNum($.C2 * 1e6)}}\ \mu\text{F} = ${texNum($.Ceq * 1e6)}\ \mu\text{F}$`,
          String.raw`Both carry the same charge: $Q_1 = C_{\text{eq}}V = ${pv($.Ceq, 'F')}${pv($.V, 'V')} = ${texNum($.Q1)}\ \text{C}$`,
          String.raw`$V_1 = \dfrac{Q_1}{C_1} = \dfrac{${qty($.Q1, 'C')}}{${qty($.C1, 'F')}} = ${texNum($.V1)}\ \text{V}$ — the smaller capacitor takes the larger share of the voltage`,
        ]),
    cases: [
      kase('#7', { mode: 1, V: 12, C1: 2, C2: 4 }, { Ceq: 6, Q1: 2.4e-5, V1: 12 }, { key: 'A) 6 μF  B) 2.4 x 10-5 C' }),
      kase('#8', { mode: 2, V: 12, C1: 2, C2: 4 }, { Ceq: 1.3333, Q1: 1.6e-5, V1: 8 }, { key: 'A) 1.33 μF  B) 1.6 x 10-5 C  C) 8 V' }),
    ],
  }),
  problem({
    ...E4, id: 'e4.44.rc-limits', ch: '44', src: 'Practice 44 #10–13', title: 'An RC circuit at the start and at the end', kind: 'conceptual', topics: ['circuits', 'rc'],
    vars: {
      ask: choice(
        ['C0', 'At the instant the switch closes, the voltage across the capacitor is…'],
        ['R0', 'At the instant the switch closes, the voltage across the resistor is…'],
        ['Rinf', 'Long after the switch closes, once the capacitor is fully charged, the voltage across the resistor is…'],
        ['Cinf', 'Long after the switch closes, once the capacitor is fully charged, the voltage across the capacitor is…'],
        ['bulb', 'The resistor is replaced by a light bulb. After the switch closes, the bulb…'],
      ),
    },
    text: (T) => `A dc supply, a switch, a resistor and an uncharged capacitor are connected in series. ${T.ask}`,
    parts: [
      mc('ans', ($) => ($.ask === 'bulb'
        ? [
            ['dim', 'starts bright, then dims until it goes out'],
            ['brighter', 'gets steadily brighter, then stays at that brightness', 'The current is largest at the start, when the empty capacitor offers no opposition, and falls from there.'],
            ['dipback', 'starts bright, dims, then brightens again once the capacitor is charged', 'A charged capacitor blocks dc: once it is full, no current flows at all.'],
            ['late', 'is dim until the capacitor is charged, then comes on fully', 'It is the other way round: the current flows while the capacitor is charging, not after.'],
            ['steady', 'comes on and stays at the same brightness', String.raw`The current is $\dfrac{\varepsilon}{R}e^{-t/RC}$ — it decays, so the brightness does too.`],
          ]
        : [
            ['full', 'Equal to the supply voltage', () => ($.ask === 'C0' ? 'An uncharged capacitor has no voltage across it; it takes time for charge to build up.' : $.ask === 'Rinf' ? 'Once the capacitor is full the current stops, and with no current there is no IR drop.' : '')],
            ['between', 'Between zero and the supply voltage', 'That is true only partway through charging, not at the very start or the very end.'],
            ['zero', 'Zero', () => ($.ask === 'R0' ? 'At the start the empty capacitor has no voltage, so the whole supply voltage appears across the resistor.' : $.ask === 'Cinf' ? 'A fully charged capacitor holds the whole supply voltage; that is what stops the current.' : '')],
          ]), ($) => ({ C0: 'zero', R0: 'full', Rinf: 'zero', Cinf: 'full', bulb: 'dim' })[$.ask]),
    ],
    hints: [
      String.raw`The loop rule holds at every instant: $\varepsilon = V_R + V_C$, with $V_C = q/C$ and $V_R = IR$.`,
      'At the start q = 0, so V_C = 0. At the end the current has stopped, so V_R = 0.',
    ],
    steps: ($) => [
      ({
        C0: String.raw`At $t = 0$ the capacitor holds no charge, so $V_C = q/C = 0$.`,
        R0: String.raw`$V_C = 0$ at $t = 0$, so the loop rule leaves $V_R = \varepsilon$: the full supply voltage.`,
        Rinf: String.raw`When the capacitor is full, $I = 0$, so $V_R = IR = 0$.`,
        Cinf: String.raw`$V_R = 0$ at the end, so $V_C = \varepsilon$.`,
        bulb: String.raw`$I = \dfrac{\varepsilon}{R}e^{-t/RC}$: largest at the start and decaying to zero, so the bulb starts bright and fades out.`,
      })[$.ask],
    ],
    cases: [
      kase('#10', { ask: 'C0' }, { ans: 'zero' }, { key: 'D) zero' }),
      kase('#11', { ask: 'R0' }, { ans: 'full' }, { key: "A) equal to the battery's terminal voltage", note: 'The sheet offers "equal to the battery\'s terminal voltage" twice, as A and as C, in #10–12; either letter is the same answer.' }),
      kase('#12', { ask: 'Rinf' }, { ans: 'zero' }, { key: 'D) zero' }),
      kase('#13', { ask: 'bulb' }, { ans: 'dim' }, { key: 'B) It starts out bright then gets dimmer until it goes out' }),
    ],
  }),
  problem({
    ...E4, id: 'e4.44.rc-from-tau', ch: '44', src: 'Practice 44 #15', title: 'From the time constant to R and the charge', kind: 'numeric', topics: ['circuits', 'rc'],
    vars: { C: range(0.5, 100, 0.5, 'μF', 1e-6), V: range(3, 48, 1, 'V'), tau: range(0.5, 20, 0.5, 's'), n: choice([1, 'one time constant'], [2, 'two time constants'], [3, 'three time constants']) },
    derive: ($) => {
      const Q = $.C * $.V;
      return { R: $.tau / $.C, Q, q: Q * (1 - Math.exp(-$.n)) };
    },
    text: (T) => `An uncharged ${T.C} μF capacitor, a resistor, a ${T.V} V battery and an open switch are connected in series. The switch closes at t = 0, and the circuit's time constant is ${T.tau} s. Find R, the charge the capacitor ends up with, and its charge after ${T.n}.`,
    parts: [
      num('R', ($) => $.R, 'Ω'),
      num('Q', ($) => $.Q, 'C', { label: String.raw`$Q_{\max}$` }),
      num('q', ($) => $.q, 'C', { label: (T) => `Charge after ${T.n}` }),
    ],
    hints: [
      String.raw`$\tau = RC$, so $R = \tau/C$ (with $C$ in farads).`,
      String.raw`The final charge is $Q = C\varepsilon$, and $q(t) = Q\left(1 - e^{-t/\tau}\right)$ — after one time constant that is $1 - e^{-1} \approx 63\%$ of $Q$.`,
    ],
    steps: ($) => [
      String.raw`$R = \dfrac{\tau}{C} = \dfrac{${qty($.tau, 's')}}{${qty($.C, 'F')}} = ${texNum($.R)}\ \Omega$`,
      String.raw`$Q = C\varepsilon = ${pv($.C, 'F')}${pv($.V, 'V')} = ${texNum($.Q)}\ \text{C}$`,
      String.raw`$q = Q\left(1 - e^{-${$.n}}\right) = ${pv($.Q, 'C')}(${texNum(1 - Math.exp(-$.n))}) = ${texNum($.q)}\ \text{C}$`,
    ],
    cases: [kase('#15', { C: 5, V: 12, tau: 4, n: 1 }, { R: 8e5, Q: 6e-5, q: 3.793e-5 }, { key: 'A) 8 x 10^5 Ω  B) 6 x 10-5 C  C) 3.79 x 10-5 C' })],
  }),
  problem({
    ...E4, id: 'e4.44.rc-time-to-V', ch: '44', src: 'Practice 44 #14E, #16D', title: 'How long until the capacitor reaches a voltage?', kind: 'numeric', level: 2, topics: ['circuits', 'rc'],
    vars: { mode: choice([1, 'charge'], [2, 'discharge']), R: range(1, 1000, 1, 'kΩ', 1e3), C: range(1, 500, 1, 'μF', 1e-6), V0: range(3, 48, 1, 'V'), f: range(0.05, 0.95, 0.05) },
    derive: ($) => {
      const tau = $.R * $.C;
      const Vt = $.f * $.V0;
      return { tau, Vt, t: $.mode === 1 ? -tau * Math.log(1 - $.f) : -tau * Math.log($.f) };
    },
    text: (T, $, f) => ($.mode === 1
      ? `An uncharged ${T.C} μF capacitor charges through ${T.R} kΩ from a ${T.V0} V supply. How long after the switch closes does the capacitor's voltage reach ${f($.Vt)} V?`
      : `A ${T.C} μF capacitor charged to ${T.V0} V discharges through ${T.R} kΩ. How long until its voltage has fallen to ${f($.Vt)} V?`),
    parts: [num('t', ($) => $.t, 's')],
    hints: [
      String.raw`Charging: $V_C = \varepsilon\left(1 - e^{-t/RC}\right)$. Discharging: $V_C = V_0\,e^{-t/RC}$.`,
      String.raw`Isolate the exponential, then take the natural log of both sides: $t = -RC\ln(\dots)$.`,
    ],
    steps: ($) => [
      String.raw`$\tau = RC = ${pv($.R, 'Ω')}${pv($.C, 'F')} = ${texNum($.tau)}\ \text{s}$`,
      $.mode === 1
        ? String.raw`$e^{-t/\tau} = 1 - \dfrac{V_C}{\varepsilon} = 1 - \dfrac{${texNum($.Vt)}}{${texNum($.V0)}} \;\Longrightarrow\; t = -\tau\ln\!\left(${texNum(1 - $.f)}\right) = ${texNum($.t)}\ \text{s}$`
        : String.raw`$e^{-t/\tau} = \dfrac{V_C}{V_0} = \dfrac{${texNum($.Vt)}}{${texNum($.V0)}} \;\Longrightarrow\; t = -\tau\ln\!\left(${texNum($.f)}\right) = ${texNum($.t)}\ \text{s}$`,
    ],
    cases: [
      kase('#14E', { mode: 1, R: 400, C: 50, V0: 24, f: 20 / 24 }, { t: 35.835 }, { key: '35.8 s' }),
      kase('#16D', { mode: 2, R: 400, C: 50, V0: 24, f: 2 / 24 }, { t: 49.698 }, { key: '50 s' }),
    ],
  }),
  problem({
    ...E4, id: 'e4.44.rc-discharge-state', ch: '44', src: 'Practice 44 #16A–C', title: 'A discharging capacitor partway through', kind: 'numeric', level: 2, topics: ['circuits', 'rc'],
    vars: { R: range(1, 1000, 1, 'kΩ', 1e3), C: range(1, 500, 1, 'μF', 1e-6), V0: range(3, 48, 1, 'V'), n: range(0.2, 4, 0.1, 'τ') },
    derive: ($) => {
      const tau = $.R * $.C;
      const k = Math.exp(-$.n);
      return { tau, t: $.n * tau, k, q: $.C * $.V0 * k, VC: $.V0 * k };
    },
    text: (T, $, f) => `A ${T.C} μF capacitor charged to ${T.V0} V is connected in series with a switch and a ${T.R} kΩ resistor — no battery. The switch closes at t = 0. At t = ${f($.t)} s, find the charge on the capacitor, the voltage across it, and the voltage across the resistor.`,
    parts: [
      num('q', ($) => $.q, 'C'),
      num('VC', ($) => $.VC, 'V', { label: String.raw`$V_C$` }),
      num('VR', ($) => $.VC, 'V', { label: String.raw`$V_R$` }),
    ],
    hints: [
      String.raw`Discharging: $q = CV_0\,e^{-t/RC}$ and $V_C = V_0\,e^{-t/RC}$.`,
      String.raw`With no battery the loop rule reads $V_C - V_R = 0$: the resistor has the capacitor's own voltage across it at every instant.`,
    ],
    steps: ($) => [
      String.raw`$\tau = RC = ${pv($.R, 'Ω')}${pv($.C, 'F')} = ${texNum($.tau)}\ \text{s}$, so $t/\tau = ${texNum($.n)}$ and $e^{-t/\tau} = ${texNum($.k)}$`,
      String.raw`$q = CV_0e^{-t/\tau} = ${pv($.C, 'F')}${pv($.V0, 'V')}(${texNum($.k)}) = ${texNum($.q)}\ \text{C}$, and $V_C = V_0e^{-t/\tau} = ${texNum($.VC)}\ \text{V}$`,
      String.raw`No battery in the loop: $V_R = V_C = ${texNum($.VC)}\ \text{V}$`,
    ],
    cases: [
      kase('#16A–C', { R: 400, C: 50, V0: 24, n: 1.5 }, { q: 2.6776e-4, VC: 5.3551, VR: 5.3551 }, {
        key: 'A) 2.7 x 10-4 C  B) 5.4 V  C) 18.6 V',
        note: 'With no battery in the loop, the resistor has the capacitor\'s own voltage across it: 5.4 V at 30 s. The key\'s 18.6 V is 24 − 5.4 V, the resistor\'s share in the charging circuit of #14. The sheet also calls the part a "50 μC capacitor"; it means 50 μF.',
      }),
    ],
  }),

  // ================================================================= 45
  problem({
    ...E4, id: 'e4.45.magnets', ch: '45', lab: 'biot', src: 'Practice 45 #3, #6, #11', title: 'Magnets and field lines', kind: 'conceptual', topics: ['magnetism'],
    vars: { ask: choice([1, 'Outside a bar magnet, field lines run…'], [2, 'If a bar magnet is cut in half, you get…'], [3, "The Earth's geographic North Pole is near…"], [4, 'A compass needle\'s north pole points…']) },
    text: (T) => T.ask,
    parts: [
      mc('ans', ($) => ({
        1: [[5, 'from the S pole to the N pole'], [1, 'from the N pole to the S pole'], [6, 'straight out of both poles, never returning']],
        2: [[7, 'an isolated N pole and an isolated S pole'], [2, 'two smaller magnets, each with N and S poles'], [8, 'two pieces that are no longer magnetic']],
        3: [[9, 'a magnetic north pole'], [3, 'a magnetic south pole']],
        4: [[10, 'along the local field, toward a magnetic north pole'], [4, 'along the local field, toward a magnetic south pole'], [11, 'across the local field, at right angles to it']],
      })[$.ask], ($) => $.ask),
    ],
    steps: () => ['Field lines leave N and enter S outside a magnet. There are no isolated magnetic poles. A compass N pole is drawn toward a magnetic S pole, which is why the Arctic has one.'],
    cases: [
      kase('#3', { ask: 1 }, { ans: 1 }, { key: 'A) north to south' }),
      kase('#6', { ask: 2 }, { ans: 2 }, { key: 'B) have two magnets' }),
      kase('#11', { ask: 4 }, { ans: 4 }, { key: 'B) the magnetic south pole' }),
    ],
  }),
  problem({
    ...E4, id: 'e4.45.sources-materials', ch: '45', lab: 'biot', src: 'Practice 45 #1–2, 4–5, 7–10, 12', title: 'Where magnetism comes from, and what iron does with it', kind: 'conceptual', topics: ['magnetism'],
    vars: {
      ask: choice(
        ['source', 'Ultimately, every magnetic field is produced by…'],
        ['unit', 'The SI unit of the magnetic field B is the…'],
        ['align', 'A bar magnet free to turn settles in a uniform magnetic field. The end of the magnet that points in the direction of B is…'],
        ['isolate', 'An electric charge can exist on its own. A single magnetic pole…'],
        ['iron', 'A piece of iron becomes a magnet when…'],
        ['mu', 'Compared with air, the permeability of a ferromagnetic material such as iron is…'],
        ['clips', 'A chain of paper clips hangs from the north pole of a magnet. The bottom end of the lowest clip is…'],
        ['domains', 'When a ferromagnetic material is placed in an external magnetic field, the net field of its domains becomes…'],
        ['earth', "The strength of the Earth's magnetic field at its surface is roughly…"],
      ),
    },
    text: (T) => T.ask,
    parts: [
      mc('ans', ($) => ({
        source: [
          ['iron', 'Small pieces of iron', 'Iron concentrates a field, but a current in a copper wire makes one with no iron anywhere.'],
          ['ferro', 'Ferromagnetic materials', 'Ferromagnets are one place magnetism shows up; the field of a bare current-carrying wire needs no ferromagnet.'],
          ['domains', 'Domains of aligned atoms', 'Domains explain why iron is magnetic, but they are made of electrons in motion and spinning — moving charge underneath.'],
          ['moving', 'Moving electric charge'],
        ],
        unit: [
          ['N', 'Newton', 'The newton is a force. B is force per (charge × speed): N/(C·m/s), which has its own name.'],
          ['T', 'Tesla'],
          ['Wb', 'Weber', 'The weber is magnetic flux, B times area.'],
          ['F', 'Farad', 'The farad is capacitance.'],
        ],
        align: [
          ['N', 'Its north pole'],
          ['S', 'Its south pole', 'A magnet lines up the way a compass needle does: north end along B.'],
          ['either', 'Either end — it depends on the magnet', 'The torque on a magnet always turns its north end to point along B.'],
        ],
        isolate: [
          ['yes', 'Can exist on its own too', 'No isolated magnetic pole has ever been found: every magnet, however small, has both a north and a south.'],
          ['no', 'Has never been found on its own'],
          ['iron', 'Can exist on its own only inside iron', 'Even inside iron every domain has both poles.'],
        ],
        iron: [
          ['stop', 'Its electrons stop moving and point one way', 'Electrons never stop; it is the direction of their spins that lines up.'],
          ['ions', 'Positive ions gather at one end and negative at the other', 'That would be an electric dipole, not a magnet.'],
          ['charges', 'Its atoms turn so their + charge faces one way', 'Separating charge makes an electric field, not a magnetic one.'],
          ['spins', 'The spins of its electrons line up'],
        ],
        mu: [
          ['much', 'Much greater'],
          ['bit', 'A little greater', 'Iron’s permeability is hundreds to thousands of times that of air, not a little more.'],
          ['same', 'About the same', 'That is true of most materials, but not of ferromagnets.'],
          ['less', 'Less', 'Materials with μ below μ₀ (diamagnets) are only slightly below it, and iron is the opposite case.'],
        ],
        clips: [
          ['N', 'A north pole'],
          ['S', 'A south pole', 'Each clip is magnetised along the chain. Its top touches the magnet’s N, so its top is S and its bottom is N — and so on down.'],
          ['none', 'Not a pole at all', 'Each clip is magnetised by the one above it, so every clip has poles at both ends.'],
        ],
        domains: [
          ['larger', 'Larger'],
          ['smaller', 'Smaller', 'Domains lined up with the field grow at the expense of the others, so the net field increases.'],
          ['zero', 'Zero', 'Zero is where it starts, with the domains pointing every which way. The external field lines them up.'],
        ],
        earth: [
          ['3e-5', String.raw`$3\times10^{-5}\ \text{T}$ (tens of microtesla)`],
          ['3e-2', String.raw`$3\times10^{-2}\ \text{T}$`, 'That is a strong fridge magnet held right against something — about a thousand times Earth’s field.'],
          ['3e2', String.raw`$3\times10^{2}\ \text{T}$`, 'Hundreds of tesla are only reached briefly, in special laboratories.'],
          ['3e5', String.raw`$3\times10^{5}\ \text{T}$`, 'Fields that size exist only near neutron stars.'],
        ],
      })[$.ask], ($) => ({ source: 'moving', unit: 'T', align: 'N', isolate: 'no', iron: 'spins', mu: 'much', clips: 'N', domains: 'larger', earth: '3e-5' })[$.ask]),
    ],
    hints: [
      'All magnetism comes from moving charge: currents, and the motion and spin of electrons in atoms.',
      'In iron the atomic magnets line up in domains; an outside field grows the domains that point its way. A magnet, or a magnetised clip, always has an N end and an S end.',
    ],
    steps: ($) => [
      ({
        source: 'Moving electric charge — currents in wires, and the orbital motion and spin of electrons in atoms.',
        unit: String.raw`The tesla: $1\ \text{T} = 1\ \text{N}/(\text{A}\cdot\text{m})$.`,
        align: 'Like a compass needle, the magnet turns until its north pole points along B.',
        isolate: 'Magnetic poles always come in N–S pairs; cutting a magnet makes two smaller magnets.',
        iron: 'Each iron atom is a tiny magnet because of its electrons’ spins; the iron is a magnet when those spins line up.',
        mu: 'A ferromagnet has a permeability hundreds to thousands of times that of air.',
        clips: 'Each clip becomes a magnet with its S end toward the N above it, so every bottom end — including the last — is a north pole.',
        domains: 'Domains aligned with the outside field grow and others turn toward it, so the net field gets larger.',
        earth: String.raw`Roughly $25$–$65\ \mu\text{T}$, i.e. about $3\times10^{-5}$ to $6\times10^{-5}\ \text{T}$.`,
      })[$.ask],
    ],
    cases: [
      kase('#1', { ask: 'source' }, { ans: 'moving' }, { key: 'D) moving electric charge' }),
      kase('#2', { ask: 'unit' }, { ans: 'T' }, { key: 'B) Tesla' }),
      kase('#4', { ask: 'align' }, { ans: 'N' }, { key: 'A) A is a north pole and B is a south pole' }),
      kase('#5', { ask: 'isolate' }, { ans: 'no' }, { key: 'B) cannot be isolated' }),
      kase('#7', { ask: 'iron' }, { ans: 'spins' }, { key: 'D) the net spins of its electrons are in the same direction' }),
      kase('#8', { ask: 'mu' }, { ans: 'much' }, { key: 'A) much greater than the permeability of air' }),
      kase('#9', { ask: 'clips' }, { ans: 'N' }, { key: 'C) north pole' }),
      kase('#10', { ask: 'domains' }, { ans: 'larger' }, { key: 'C) larger' }),
      kase('#12', { ask: 'earth' }, { ans: '3e-5' }, { key: 'A) 3 x 10-5 T' }),
    ],
  }),

  // ================================================================= 46
  problem({
    ...E4, id: 'e4.46.force-mag', ch: '46', lab: 'magforce', title: 'Magnetic force on a moving charge', kind: 'numeric', topics: ['magnetic-force'],
    vars: { p: PART, v: range(1, 50, 1, '×10⁶ m/s', 1e6), B: range(0.05, 2, 0.05, 'T'), th: range(10, 90, 5, '°') },
    derive: ($) => ({ F: QE * $.v * $.B * Math.sin($.th * DEG) }),
    text: (T) => `${T.p} moves at ${T.v} × 10⁶ m/s at ${T.th}° to a ${T.B} T magnetic field. What is the magnitude of the magnetic force on it?`,
    parts: [num('F', ($) => $.F, 'N')],
    steps: ($, f) => [String.raw`$F = |q|vB\sin\theta = ${pv(QE, 'C')}${pv($.v, 'm/s')}${pv($.B, 'T')}\sin ${texDeg($.th)} = ${texNum($.F)}\ \text{N}$`],
    sim: {
      scenario: 'helix',
      setup(s, $) {
        Object.assign(s, { kind: 'particle', particle: $.p, v: $.v, B: $.B, pitch: 90 - $.th });
      },
      read: (c) => ({ F: c.mf.run.Fmag }),
    },
    cases: [kase('hand', { p: 'proton', v: 10, B: 0.2, th: 90 }, { F: 3.2e-13 })],
  }),
  problem({
    ...E4, id: 'e4.46.rhr', ch: '46', lab: 'magforce', title: 'Right-hand rule: direction of F', kind: 'conceptual', topics: ['magnetic-force', 'right-hand-rule'],
    vars: { p: PART, vdir: choice([1, '+x'], [-1, '−x'], [3, '+z'], [-3, '−z']), Bdir: choice([2, '+y'], [-2, '−y']) },
    derive: ($) => {
      const u = (c) => ({ x: (Math.abs(c) === 1) * Math.sign(c), y: (Math.abs(c) === 2) * Math.sign(c), z: (Math.abs(c) === 3) * Math.sign(c) });
      const a = u($.vdir);
      const b = u($.Bdir);
      const cr = { x: a.y * b.z - a.z * b.y, y: a.z * b.x - a.x * b.z, z: a.x * b.y - a.y * b.x };
      const s = Math.sign(pq($.p));
      return { code: axisCode({ x: s * cr.x, y: s * cr.y, z: s * cr.z }) };
    },
    text: (T) => `${T.p} moves in the ${T.vdir} direction through a magnetic field that points ${T.Bdir}. Which way is the magnetic force?`,
    parts: [mc('dir', AXES6, ($) => $.code)],
    hints: [
      String.raw`$\vec{F} = q\vec{v}\times\vec{B}$; for a negative charge, flip the result.`,
      String.raw`$\hat{x}\times\hat{y} = \hat{z}$, $\hat{y}\times\hat{z} = \hat{x}$, $\hat{z}\times\hat{x} = \hat{y}$`,
    ],
    steps: () => [String.raw`Point your fingers along $\vec{v}$ and curl them toward $\vec{B}$; your thumb gives $\vec{v}\times\vec{B}$. Reverse it for an electron.`],
    cases: [kase('proton +x in +y', { p: 'proton', vdir: 1, Bdir: 2 }, { dir: 3 }), kase('electron +z in +y', { p: 'electron', vdir: 3, Bdir: 2 }, { dir: 1 })],
  }),
  problem({
    ...E4, id: 'e4.46.circle', ch: '46', lab: 'magforce', title: 'Circular motion in a magnetic field', kind: 'numeric', level: 2, topics: ['magnetic-force', 'circular-motion'],
    vars: { p: PART, v: range(0.5, 30, 0.5, '×10⁶ m/s', 1e6), B: range(0.01, 1, 0.01, 'T') },
    derive: ($) => ({ r: (pm($.p) * $.v) / (QE * $.B), T: (2 * Math.PI * pm($.p)) / (QE * $.B) }),
    text: (T) => `${T.p} moves at ${T.v} × 10⁶ m/s perpendicular to a uniform ${T.B} T field. Find the radius of its path and its period.`,
    parts: [num('r', ($) => $.r, 'm'), num('T', ($) => $.T, 's'), mc('dep', [[1, 'The period does not depend on speed'], [2, 'Faster particles take longer to go around'], [3, 'Faster particles go around sooner']], 1, { label: 'How does T depend on v?' })],
    steps: ($, f) => [
      String.raw`$qvB = \dfrac{mv^2}{r} \;\Longrightarrow\; r = \dfrac{mv}{|q|B} = \dfrac{${pv(pm($.p), 'kg')}${pv($.v, 'm/s')}}{${pv(QE, 'C')}${pv($.B, 'T')}} = ${texNum($.r)}\ \text{m}$`,
      String.raw`$T = \dfrac{2\pi r}{v} = \dfrac{2\pi m}{|q|B} = \dfrac{2\pi${pv(pm($.p), 'kg')}}{${pv(QE, 'C')}${pv($.B, 'T')}} = ${texNum($.T)}\ \text{s}$ — no $v$ in it`,
    ],
    sim: {
      scenario: 'proton',
      setup(s, $) {
        Object.assign(s, { kind: 'particle', particle: $.p, v: $.v, B: $.B, pitch: 0 });
      },
      read: (c) => ({ r: c.mf.run.rA, T: c.mf.run.T }),
    },
    cases: [kase('lab default', { p: 'proton', v: 10, B: 0.2 }, { r: 0.5219, T: 3.279e-7, dep: 1 })],
  }),
  problem({
    ...E4, id: 'e4.46.selector', ch: '46', lab: 'magforce', title: 'Velocity selector', kind: 'numeric', topics: ['magnetic-force'],
    vars: { E: range(1, 50, 1, '×10⁵ V/m', 1e5), B: range(0.05, 1, 0.05, 'T') },
    derive: ($) => ({ v: $.E / $.B }),
    text: (T) => `Crossed fields E = ${T.E} × 10⁵ V/m and B = ${T.B} T. What speed passes straight through? Does the answer depend on the particle's charge or mass?`,
    parts: [
      sym('v_sym', 'E/B', { E: 'V/m', B: 'T' }, ($) => $.v, { unit: 'm/s', label: String.raw`$v$ as a formula` }),
      num('v', ($) => $.v, 'm/s'), mc('dep', [[0, 'No, it is the same for any charge and mass'], [1, 'Yes, it depends on q'], [2, 'Yes, it depends on m']], 0, { label: 'Depends on q or m?' })],
    steps: ($, f) => [String.raw`$qE = qvB \;\Longrightarrow\; v = \dfrac{E}{B} = \dfrac{${qty($.E, 'V/m')}}{${qty($.B, 'T')}} = ${texNum($.v)}\ \text{m/s}$`],
    sim: {
      scenario: 'selector',
      setup(s, $) {
        Object.assign(s, { kind: 'selector', E: $.E, B: $.B, v: $.v });
      },
      read: (c) => ({ v: c.mf.run.vSelect }),
    },
    cases: [kase('lab default', { E: 20, B: 0.2 }, { v: 1e7, dep: 0 })],
  }),
  problem({
    ...E4, id: 'e4.46.wire-force', ch: '46', lab: 'magforce', src: 'Practice 46 #14', title: 'Force on a current-carrying wire', kind: 'numeric', topics: ['magnetic-force'],
    vars: { I: range(0.5, 20, 0.5, 'A'), L: range(0.1, 2, 0.05, 'm'), B: range(0.05, 2, 0.05, 'T'), th: range(10, 90, 5, '°') },
    derive: ($) => ({ F: $.I * $.L * $.B * Math.sin($.th * DEG) }),
    text: (T) => `A ${T.L} m wire carrying ${T.I} A makes ${T.th}° with a ${T.B} T field. Find the force on it.`,
    parts: [num('F', ($) => $.F, 'N')],
    steps: ($, f) => [String.raw`$F = ILB\sin\theta = ${pv($.I, 'A')}${pv($.L, 'm')}${pv($.B, 'T')}\sin ${texDeg($.th)} = ${texNum($.F)}\ \text{N}$`],
    sim: {
      scenario: 'wire',
      setup(s, $) {
        Object.assign(s, { kind: 'wire', I: $.I, L: $.L, B: $.B, theta: $.th });
      },
      read: (c) => ({ F: c.mf.Fmag }),
    },
    cases: [
      kase('#14', { I: 2, L: 0.6, B: 0.2, th: 60 }, { F: 0.2078 }, { key: '0.2 N into the page', note: 'The sheet gives no figure or directions for this one, so "into the page" cannot be checked; the size is ILB sin 60° = 0.208 N.' }),
      kase('lab default', { I: 4, L: 0.6, B: 0.5, th: 90 }, { F: 1.2 }),
    ],
  }),
  problem({
    ...E4, id: 'e4.46.spectrometer', ch: '46', lab: 'magforce', title: 'Mass spectrometer', kind: 'numeric', level: 2, topics: ['magnetic-force', 'energy'],
    vars: { p: PART, V: range(100, 5000, 100, 'V'), B: range(0.01, 0.5, 0.01, 'T') },
    derive: ($) => {
      const v = Math.sqrt((2 * QE * $.V) / pm($.p));
      return { v, r: (pm($.p) * v) / (QE * $.B) };
    },
    text: (T) => `${T.p} is accelerated from rest through ${T.V} V and then enters a ${T.B} T field at right angles. Find its speed and the radius of its path.`,
    parts: [num('v', ($) => $.v, 'm/s'), num('r', ($) => $.r, 'm')],
    steps: ($, f) => [
      String.raw`$\tfrac{1}{2}mv^2 = |q|V \;\Longrightarrow\; v = \sqrt{\dfrac{2|q|V}{m}} = \sqrt{\dfrac{2${pv(QE, 'C')}${pv($.V, 'V')}}{${qty(pm($.p), 'kg')}}} = ${texNum($.v)}\ \text{m/s}$`,
      String.raw`$r = \dfrac{mv}{|q|B} = \dfrac{${pv(pm($.p), 'kg')}${pv($.v, 'm/s')}}{${pv(QE, 'C')}${pv($.B, 'T')}} = ${texNum($.r)}\ \text{m}$`,
    ],
    cases: [kase('hand', { p: 'proton', V: 1000, B: 0.1 }, { v: 4.377e5, r: 0.04569 })],
  }),
  problem({
    ...E4, id: 'e4.46.torque', ch: '46', lab: 'magforce', title: 'Torque on a current loop', kind: 'numeric', topics: ['magnetic-force', 'torque'],
    vars: { N: range(1, 200, 1, 'turns'), I: range(0.1, 10, 0.1, 'A'), a: range(2, 30, 1, 'cm', 1e-2), B: range(0.05, 1, 0.05, 'T'), th: range(0, 90, 5, '°') },
    derive: ($) => {
      const mu = $.N * $.I * $.a ** 2;
      return { mu, tau: mu * $.B * Math.sin($.th * DEG) };
    },
    text: (T) => `A square coil ${T.a} cm on a side has ${T.N} turns and carries ${T.I} A. Its normal makes ${T.th}° with a ${T.B} T field. Find its magnetic moment and the torque on it.`,
    parts: [num('mu', ($) => $.mu, 'A·m²', { label: 'μ' }), num('tau', ($) => $.tau, 'N·m', { label: 'τ', abs: 1e-6 })],
    steps: ($, f) => [
      String.raw`$\mu = NIA = (${texNum($.N)})${pv($.I, 'A')}${pv($.a, 'm')}^2 = ${texNum($.mu)}\ \text{A}\cdot\text{m}^2$`,
      String.raw`$\tau = \mu B\sin\theta = ${pv($.mu, 'A·m²')}${pv($.B, 'T')}\sin ${texDeg($.th)} = ${texNum($.tau)}\ \text{N}\cdot\text{m}$`,
    ],
    cases: [kase('hand', { N: 50, I: 2, a: 10, B: 0.3, th: 90 }, { mu: 1, tau: 0.3 })],
  }),

  problem({
    ...E4, id: 'e4.46.what-B-does', ch: '46', lab: 'magforce', src: 'Practice 46 #1–4, #8, #13', title: 'What a magnetic field can and cannot do', kind: 'conceptual', topics: ['magnetic-force'],
    vars: {
      ask: choice(
        ['interact', 'A moving electric charge can be pushed by…'],
        ['max', 'An electron moves through a magnetic field. The magnetic force on it is largest when it moves…'],
        ['speed', 'Which field can make a moving electron speed up?'],
        ['turn', 'Which field can change an electron’s direction but never its speed?'],
        ['rest', 'A proton sits at rest in a uniform magnetic field. The magnetic force on it is…'],
        ['wire', 'The magnetic force on a current-carrying wire in a magnetic field is largest when the current is…'],
      ),
    },
    text: (T) => T.ask,
    parts: [
      mc('ans', ($) => ({
        interact: [
          ['E', 'An electric field only', 'A moving charge also feels a magnetic force, qv × B. Only a charge at rest ignores B.'],
          ['both', 'An electric field or a magnetic field'],
          ['B', 'A magnetic field only', 'Any charge, moving or not, feels an electric field: F = qE.'],
          ['none', 'Neither', 'Charges feel both fields; that is how motors, CRTs and particle accelerators work.'],
        ],
        max: [
          ['along', 'Along the field', String.raw`$F = |q|vB\sin\theta$, and $\sin 0^\circ = 0$: moving along B gives no force at all.`],
          ['perp', 'At right angles to the field'],
          ['angle', 'At some angle other than 90° to the field', String.raw`$\sin\theta$ peaks at $90^\circ$; any other angle gives less.`],
          ['against', 'Exactly opposite to the field', String.raw`$\sin 180^\circ = 0$: anti-parallel motion feels no magnetic force either.`],
        ],
        speed: [
          ['B', 'Only a magnetic field', 'The magnetic force is always perpendicular to the velocity, so it does no work and cannot change the speed.'],
          ['either', 'Either field', 'Only the electric force can do work on the electron. The magnetic force is always sideways to the motion.'],
          ['E', 'Only an electric field'],
          ['none', 'Neither', 'An electric field does work on a charge and changes its speed — that is how an accelerator works.'],
        ],
        turn: [
          ['E', 'An electric field', 'An electric field generally has a component along the motion, so it changes the speed too.'],
          ['B', 'A magnetic field'],
          ['both', 'Both', 'Only the magnetic force is guaranteed perpendicular to the velocity.'],
          ['none', 'Neither', 'A magnetic force, always at right angles to v, bends the path without changing the speed.'],
        ],
        rest: [
          ['zero', 'Zero'],
          ['qB', String.raw`$eB$, pointing along the field`, String.raw`$F = qvB\sin\theta$ has $v$ in it: with $v = 0$ there is no magnetic force.`],
          ['dep', 'It depends on which way the field points', 'No direction of B can push a charge that is not moving.'],
        ],
        wire: [
          ['along', 'Along the field lines', String.raw`$F = ILB\sin\theta$ vanishes when the current runs along B.`],
          ['against', 'Opposite to the field lines', String.raw`$\sin 180^\circ = 0$ — no force.`],
          ['perp', 'Perpendicular to the field lines'],
          ['zero-angle', 'At 0° to the field lines', String.raw`$\sin 0^\circ = 0$ — no force.`],
        ],
      })[$.ask], ($) => ({ interact: 'both', max: 'perp', speed: 'E', turn: 'B', rest: 'zero', wire: 'perp' })[$.ask]),
    ],
    hints: [
      String.raw`$\vec{F} = q\vec{E} + q\vec{v}\times\vec{B}$. The magnetic part needs motion, and it is always perpendicular to $\vec{v}$.`,
      String.raw`Its size is $|q|vB\sin\theta$ (for a wire, $ILB\sin\theta$): largest at $90^\circ$, zero along or against B. A force perpendicular to the motion does no work.`,
    ],
    steps: ($) => [
      ({
        interact: 'A moving charge feels both: qE from an electric field and qv × B from a magnetic one.',
        max: String.raw`$F = |q|vB\sin\theta$ is largest at $\theta = 90^\circ$.`,
        speed: String.raw`Only the electric force does work ($W = qE\cdot d$); the magnetic force is perpendicular to $\vec{v}$ and does none.`,
        turn: 'The magnetic force is always perpendicular to the velocity: it turns the path and leaves the speed alone.',
        rest: String.raw`$v = 0$, so $F = qvB\sin\theta = 0$.`,
        wire: String.raw`$F = ILB\sin\theta$ is largest at $\theta = 90^\circ$: current perpendicular to B.`,
      })[$.ask],
    ],
    cases: [
      kase('#1', { ask: 'interact' }, { ans: 'both' }, { key: 'B) an electric field or a magnetic field' }),
      kase('#2', { ask: 'max' }, { ans: 'perp' }, { key: 'B) perpendicular to the magnetic field direction' }),
      kase('#3', { ask: 'speed' }, { ans: 'E' }, { key: 'C) only an electric field' }),
      kase('#4', { ask: 'turn' }, { ans: 'B' }, { key: 'B) magnetic field' }),
      kase('#8', { ask: 'rest' }, { ans: 'zero' }, { key: '0 N' }),
      kase('#13', { ask: 'wire' }, { ans: 'perp' }, { key: 'D) the current is perpendicular to the magnetic field lines' }),
    ],
  }),
  problem({
    ...E4, id: 'e4.46.page-rhr', ch: '46', lab: 'magforce', src: 'Practice 46 #5', title: 'Force on + and − charges, drawn on the page', kind: 'conceptual', topics: ['magnetic-force', 'right-hand-rule'],
    vars: { v: choice(['up', 'up the page'], ['down', 'down the page'], ['right', 'to the right'], ['left', 'to the left']), B: choice([-1, 'into the page'], [1, 'out of the page']) },
    derive: ($) => {
      const vv = { up: [0, 1], down: [0, -1], right: [1, 0], left: [-1, 0] }[$.v];
      // v × B with B = ±ẑ: (vx, vy, 0) × (0, 0, b) = (vy·b, −vx·b, 0)
      const f = [vv[1] * $.B, -vv[0] * $.B];
      const name = (x, y) => (x > 0 ? 'right' : x < 0 ? 'left' : y > 0 ? 'up' : 'down');
      return { pos: name(f[0], f[1]), neg: name(-f[0], -f[1]) };
    },
    text: (T) => `A charged sphere moves ${T.v} into a uniform magnetic field that points ${T.B}. Which way is the magnetic force on it the moment it enters, if the sphere is positively charged? If it is negatively charged?`,
    parts: [
      mc('pos', PAGE_DIRS, ($) => $.pos, { label: 'Positive sphere' }),
      mc('neg', PAGE_DIRS, ($) => $.neg, { label: 'Negative sphere' }),
    ],
    hints: [
      String.raw`$\vec{F} = q\vec{v}\times\vec{B}$. Take right $= \hat{x}$, up the page $= \hat{y}$, out of the page $= \hat{z}$.`,
      String.raw`The force is perpendicular to both $\vec{v}$ and $\vec{B}$, so with B through the page it lies in the page. A negative charge gets the opposite direction.`,
    ],
    steps: ($) => [
      String.raw`$\vec{v}$ points ${{ up: 'up the page', down: 'down the page', right: 'right', left: 'left' }[$.v]} and $\vec{B}$ ${$.B > 0 ? 'out of' : 'into'} the page, so $\vec{v}\times\vec{B}$ points ${{ up: 'up the page', down: 'down the page', right: 'right', left: 'left' }[$.pos]}.`,
      `Positive: ${$.pos}. Negative: the opposite, ${$.neg}.`,
    ],
    cases: [kase('#5', { v: 'up', B: -1 }, { pos: 'left', neg: 'right' }, { key: 'D) positive left, negative right' })],
  }),
  problem({
    ...E4, id: 'e4.46.track-sign', ch: '46', lab: 'magforce', src: 'Practice 46 #6', title: 'Reading a charge’s sign from its track', kind: 'conceptual', topics: ['magnetic-force', 'right-hand-rule'],
    vars: { B: choice([1, 'out of the page'], [-1, 'into the page']), turn: choice([-1, 'curves clockwise'], [1, 'curves counterclockwise'], [0, 'goes straight through']) },
    derive: ($) => ({ sign: $.turn === 0 ? 0 : $.turn === $.B ? -1 : 1 }),
    text: (T) => `In a region where the magnetic field points ${T.B}, a particle's track ${T.turn} as seen from the front of the page. What is the particle's charge?`,
    parts: [
      mc('sign', [
        [1, 'Positive', ($) => ($.turn === 0 ? 'A charged particle would be bent sideways by qv × B; a straight track means no magnetic force.' : 'Work out qv × B for a positive charge: it would bend the other way.')],
        [-1, 'Negative', ($) => ($.turn === 0 ? 'A charged particle would be bent sideways by qv × B; a straight track means no magnetic force.' : 'Work out qv × B for a negative charge: it would bend the other way.')],
        [0, 'Neutral', 'A neutral particle feels no magnetic force and goes straight; this track bends.'],
      ], ($) => $.sign),
    ],
    hints: [
      String.raw`The magnetic force $q\vec{v}\times\vec{B}$ points toward the centre of the curve.`,
      String.raw`With $\vec{B}$ out of the page, a positive charge moving right ($\hat{x}\times\hat{z} = -\hat{y}$) is pushed down: it circles clockwise. A negative charge circles the other way; reversing B flips both.`,
    ],
    steps: ($) => [
      String.raw`Positive charges circle ${$.B > 0 ? 'clockwise' : 'counterclockwise'} in a field ${$.B > 0 ? 'out of' : 'into'} the page; negative ones circle the opposite way; neutral ones go straight.`,
      `This track ${$.turn === 0 ? 'is straight: neutral' : `${$.turn > 0 ? 'curves counterclockwise' : 'curves clockwise'}: ${$.sign > 0 ? 'positive' : 'negative'}`}.`,
    ],
    cases: [
      kase('#6, track 1', { B: 1, turn: 1 }, { sign: -1 }, { key: 'D) 1 is negative, 2 is neutral, and 3 is positive' }),
      kase('#6, track 2', { B: 1, turn: 0 }, { sign: 0 }),
      kase('#6, track 3', { B: 1, turn: -1 }, { sign: 1 }),
    ],
  }),
  problem({
    ...E4, id: 'e4.46.force-direction', ch: '46', lab: 'magforce', src: 'Practice 46 #9–10', title: 'Size and direction of qv × B', kind: 'numeric', topics: ['magnetic-force', 'right-hand-rule'],
    vars: { s: SIGN, q: range(0.005, 0.1, 0.005, 'C'), v: range(10, 500, 10, 'm/s'), B: range(0.1, 2, 0.1, 'T'), th: range(30, 150, 15, '°') },
    derive: ($) => ({ F: $.q * $.v * $.B * Math.sin($.th * DEG), dir: $.s > 0 ? 'in' : 'out' }),
    text: (T) => `A uniform ${T.B} T field points in the +x direction, to the right across the page. A ${T.s} ${T.q} C charge moves at ${T.v} m/s in the plane of the page, ${T.th}° counterclockwise from +x. Find the size and direction of the magnetic force on it.`,
    parts: [
      num('F', ($) => $.F, 'N', { label: '|F|' }),
      mc('dir', [['in', 'Into the page'], ['out', 'Out of the page'], ['page', 'In the plane of the page', String.raw`$\vec{F}$ is perpendicular to both $\vec{v}$ and $\vec{B}$, and both lie in the page — so $\vec{F}$ points through it.`]], ($) => $.dir, { label: 'Direction' }),
    ],
    hints: [
      String.raw`$|F| = |q|vB\sin\theta$ with θ the angle between $\vec{v}$ and $\vec{B}$.`,
      String.raw`$\vec{v}\times\vec{B}$ with $\vec{v}$ at an angle above $+\hat{x}$ and $\vec{B}$ along $+\hat{x}$: $\hat{y}\times\hat{x} = -\hat{z}$, into the page. Flip it for a negative charge.`,
    ],
    steps: ($) => [
      String.raw`$|F| = |q|vB\sin\theta = ${pv($.q, 'C')}${pv($.v, 'm/s')}${pv($.B, 'T')}\sin ${texDeg($.th)} = ${texNum($.F)}\ \text{N}$`,
      String.raw`$\vec{v}\times\vec{B}$ points into the page (the $\hat{y}$ part of $\vec{v}$ crossed with $\hat{x}$ gives $-\hat{z}$); the charge is ${$.s > 0 ? 'positive, so the force is into the page' : 'negative, so the force is reversed: out of the page'}.`,
    ],
    cases: [
      kase('#9', { s: 1, q: 0.03, v: 100, B: 0.4, th: 90 }, { F: 1.2, dir: 'in' }, { key: '1.2 N into the page' }),
      kase('#10', { s: -1, q: 0.03, v: 100, B: 0.4, th: 30 }, { F: 0.6, dir: 'out' }, { key: '0.6 N out of the page' }),
    ],
  }),
  problem({
    ...E4, id: 'e4.46.qvB-solve', ch: '46', lab: 'magforce', src: 'Practice 46 #7, #11', title: 'F = qvB, forwards and backwards', kind: 'numeric', topics: ['magnetic-force'],
    vars: { ask: choice(['F', 'force'], ['B', 'field']), m: range(1, 9.9, 0.1), pw: range(3, 7, 1), B: range(0.01, 2, 0.01, 'T') },
    derive: ($) => {
      const v = $.m * 10 ** $.pw;
      return { v, F: QE * v * $.B };
    },
    text: (T, $, f) => ($.ask === 'F'
      ? `A proton moves at ${f($.v)} m/s at right angles to a ${T.B} T magnetic field. What is the magnetic force on it?`
      : `A positive ion carrying charge +e moves at ${f($.v)} m/s at right angles to a uniform magnetic field and feels a magnetic force of ${f($.F)} N. How strong is the field?`),
    parts: [num('ans', ($) => ($.ask === 'F' ? $.F : $.B), ($) => ($.ask === 'F' ? 'N' : 'T'), { label: ($T, $) => ($.ask === 'F' ? '|F|' : 'B') })],
    hints: [
      String.raw`$F = |q|vB\sin\theta$, and "at right angles" means $\sin\theta = 1$.`,
      String.raw`The charge is $e = 1.6\times10^{-19}$ C. To find B, divide: $B = \dfrac{F}{|q|v}$.`,
    ],
    steps: ($) => [
      $.ask === 'F'
        ? String.raw`$F = evB = ${pv(QE, 'C')}${pv($.v, 'm/s')}${pv($.B, 'T')} = ${texNum($.F)}\ \text{N}$`
        : String.raw`$B = \dfrac{F}{ev} = \dfrac{${qty($.F, 'N')}}{${pv(QE, 'C')}${pv($.v, 'm/s')}} = ${texNum($.B)}\ \text{T}$`,
    ],
    cases: [
      kase('#7', { ask: 'F', m: 7, pw: 3, B: 0.6 }, { ans: 6.72e-16 }, { key: '6.27 x 10-16 N', note: 'F = (1.6 × 10⁻¹⁹ C)(7000 m/s)(0.60 T) = 6.72 × 10⁻¹⁶ N. The key has the digits 7 and 2 transposed.' }),
      kase('#11', { ask: 'B', m: 5, pw: 7, B: 0.03 }, { ans: 0.03 }, { key: '0.03 T' }),
    ],
  }),
  problem({
    ...E4, id: 'e4.46.charge-from-orbit', ch: '46', lab: 'magforce', src: 'Practice 46 #12', title: 'The charge, from the circle it moves on', kind: 'numeric', topics: ['magnetic-force', 'circular-motion'],
    vars: { m: range(0.5, 10, 0.5, 'g', 1e-3), B: range(0.5, 10, 0.5, 'T'), r: range(0.05, 1, 0.05, 'm'), v: range(1, 20, 1, 'm/s') },
    derive: ($) => ({ q: ($.m * $.v) / ($.r * $.B) }),
    text: (T) => `A charged particle of mass ${T.m} g moves at ${T.v} m/s in a circle of radius ${T.r} m, at right angles to a ${T.B} T magnetic field. What is the size of its charge?`,
    parts: [
      sym('q_sym', 'm*v/(r*B)', { m: 'kg', v: 'm/s', r: 'm', B: 'T' }, ($) => $.q, { unit: 'C', label: String.raw`$|q|$ as a formula` }),
      num('q', ($) => $.q, 'C', { label: '|q|' }),
    ],
    hints: [
      String.raw`The magnetic force is the centripetal force: $|q|vB = \dfrac{mv^2}{r}$.`,
      String.raw`One $v$ cancels: $|q| = \dfrac{mv}{rB}$. Mass in kilograms.`,
    ],
    steps: ($) => [
      String.raw`$|q|vB = \dfrac{mv^2}{r} \;\Longrightarrow\; |q| = \dfrac{mv}{rB} = \dfrac{${pv($.m, 'kg')}${pv($.v, 'm/s')}}{${pv($.r, 'm')}${pv($.B, 'T')}} = ${texNum($.q)}\ \text{C}$`,
    ],
    cases: [kase('#12', { m: 2, B: 6, r: 0.2, v: 5 }, { q: 8.333e-3 }, { key: '0.0083 C' })],
  }),
  problem({
    ...E4, id: 'e4.46.coil-sides', ch: '46', lab: 'magforce', src: 'Practice 46 #15–16', title: 'Forces on the four sides of a coil', kind: 'conceptual', topics: ['magnetic-force', 'torque'],
    vars: {
      cw: choice([1, 'A → B → C → D (clockwise as you look at it)'], [-1, 'A → D → C → B (counterclockwise as you look at it)']),
      side: choice(['AB', 'AB, the left side'], ['BC', 'BC, the top'], ['CD', 'CD, the right side'], ['DA', 'DA, the bottom']),
    },
    derive: ($) => {
      // B points +x (N pole on the left). Clockwise: AB up, BC right, CD down, DA left.
      const up = { AB: [0, 1], BC: [1, 0], CD: [0, -1], DA: [-1, 0] }[$.side];
      const I = [up[0] * $.cw, up[1] * $.cw];
      // I × B with B = x̂: (Ix, Iy, 0) × (1, 0, 0) = (0, 0, −Iy)
      const fz = -I[1];
      return { ans: fz > 0 ? 'out' : fz < 0 ? 'in' : 'zero' };
    },
    text: (T) => `A rectangular coil ABCD stands in the plane of the page between the poles of a magnet: the N pole on the left, the S pole on the right. A is the bottom-left corner, B the top-left, C the top-right, D the bottom-right. Current flows around it ${T.cw}. What is the direction of the magnetic force on side ${T.side}?`,
    parts: [
      mc('ans', [
        ['in', 'Into the page'],
        ['out', 'Out of the page'],
        ['alongB', 'Along the magnetic field', 'The force is perpendicular to the field, never along it.'],
        ['againstB', 'Opposite to the magnetic field', 'The force is perpendicular to the field, never against it.'],
        ['zero', 'Zero', ($) => ($.side === 'AB' || $.side === 'CD' ? 'This side is perpendicular to B, so it feels the full ILB.' : '')],
      ], ($) => $.ans),
    ],
    hints: [
      String.raw`B runs from N to S: left to right across the page. $\vec{F} = I\vec{L}\times\vec{B}$.`,
      'The top and bottom sides run parallel or anti-parallel to B, so they feel no force. The vertical sides are pushed through the page, one each way — that pair makes the torque that turns a motor.',
    ],
    steps: ($) => [
      `With the current ${$.cw > 0 ? 'clockwise' : 'counterclockwise'}, side ${$.side} carries current ${{ AB: $.cw > 0 ? 'up' : 'down', BC: $.cw > 0 ? 'to the right' : 'to the left', CD: $.cw > 0 ? 'down' : 'up', DA: $.cw > 0 ? 'to the left' : 'to the right' }[$.side]}.`,
      $.ans === 'zero'
        ? String.raw`That is along the line of $\vec{B}$, so $\vec{L}\times\vec{B} = 0$: no force.`
        : String.raw`$\vec{L}\times\vec{B}$ with $\vec{B}$ to the right points ${$.ans === 'out' ? 'out of' : 'into'} the page.`,
    ],
    cases: [
      kase('#15', { cw: 1, side: 'BC' }, { ans: 'zero' }, { key: 'E) The force is zero.' }),
      kase('#16', { cw: 1, side: 'CD' }, { ans: 'out' }, { key: 'B) perpendicular to and out of the page' }),
    ],
  }),
  problem({
    ...E4, id: 'e4.46.spectrometer-mass', ch: '46', lab: 'magforce', src: 'Practice 46 #17', title: 'Mass spectrometer: find the mass', kind: 'numeric', level: 2, topics: ['magnetic-force', 'energy'],
    vars: { q: range(0.5, 10, 0.5, 'μC', 1e-6), V: range(50, 1000, 50, 'V'), B: range(0.5, 5, 0.5, 'T'), r: range(0.05, 1, 0.05, 'm') },
    derive: ($) => {
      const m = ($.q * $.B ** 2 * $.r ** 2) / (2 * $.V);
      return { m, v: (2 * $.V) / ($.B * $.r) };
    },
    text: (T) => `A particle carrying +${T.q} μC is accelerated from rest through ${T.V} V, then enters a ${T.B} T magnetic field at right angles and moves on a circle of radius ${T.r} m. What is its mass?`,
    parts: [
      sym('m_sym', 'q*B^2*r^2/(2*V)', { q: 'C', B: 'T', r: 'm', V: 'V' }, ($) => $.m, { unit: 'kg', label: String.raw`$m$ as a formula` }),
      num('m', ($) => $.m, 'kg'),
    ],
    hints: [
      String.raw`Two facts: energy, $qV = \tfrac12 mv^2$, and the circle, $r = \dfrac{mv}{qB}$.`,
      String.raw`Eliminate $v$: from the circle $v = qBr/m$; put it into the energy equation and solve, $m = \dfrac{qB^2r^2}{2V}$.`,
    ],
    steps: ($) => [
      String.raw`$qV = \tfrac12 mv^2$ and $v = \dfrac{qBr}{m}$ give $qV = \dfrac{q^2B^2r^2}{2m}$`,
      String.raw`$m = \dfrac{qB^2r^2}{2V} = \dfrac{${pv($.q, 'C')}${pv($.B, 'T')}^2${pv($.r, 'm')}^2}{2${pv($.V, 'V')}} = ${texNum($.m)}\ \text{kg}$`,
    ],
    cases: [kase('#17', { q: 2, V: 200, B: 3, r: 0.3 }, { m: 4.05e-9 }, { key: '4.05 x 10-9 kg' })],
  }),
  problem({
    ...E4, id: 'e4.46.undeflected', ch: '46', lab: 'magforce', src: 'Practice 46 #18', title: 'Crossed fields: the speed that goes straight', kind: 'numeric', topics: ['magnetic-force'],
    vars: { E: range(100, 5000, 100, 'N/C'), B: range(0.5, 10, 0.5, 'T'), m: range(1, 10, 0.5, 'g', 1e-3) },
    derive: ($) => ({ v: $.E / $.B }),
    text: (T) => `A charged particle of mass ${T.m} g moves at right angles to a ${T.B} T magnetic field. A uniform ${T.E} N/C electric field, at right angles to both the field and the motion, also acts on it. At what speed does it pass through without being deflected?`,
    parts: [
      num('v', ($) => $.v, 'm/s'),
      mc('mass', [['no', 'No'], ['yes', 'Yes', String.raw`The two forces are $qE$ and $qvB$; both are proportional to $q$ and neither involves $m$. Balancing them never uses the mass.`]], 'no', { label: 'Does the answer depend on the mass?' }),
    ],
    hints: [
      String.raw`Undeflected means the electric and magnetic forces cancel: $qE = qvB$.`,
      String.raw`The charge cancels, and the mass was never in it: $v = E/B$.`,
    ],
    steps: ($) => [String.raw`$qE = qvB \;\Longrightarrow\; v = \dfrac{E}{B} = \dfrac{${qty($.E, 'N/C')}}{${qty($.B, 'T')}} = ${texNum($.v)}\ \text{m/s}$ — the ${texNum($.m * 1e3)} g mass plays no part`],
    cases: [kase('#18', { E: 1200, B: 6, m: 2 }, { v: 200, mass: 'no' }, { key: '200 m/s' })],
  }),

  // ================================================================= 47
  problem({
    ...E4, id: 'e4.47.long-wire', ch: '47', lab: 'biot', src: 'Practice 47 #4–5', title: 'B near a long straight wire', kind: 'numeric', topics: ['biot-savart', 'ampere'],
    vars: { I: range(0.5, 8, 0.1, 'A'), rho: range(2, 100, 1, 'cm', 1e-2) },
    derive: ($) => ({ B: (MU0 * $.I) / (2 * Math.PI * $.rho) }),
    text: (T) => `How strong is the magnetic field ${T.rho} cm from a long straight wire carrying ${T.I} A?`,
    parts: [
      sym('B_sym', 'mu0*I/(2*pi*rho)', { I: 'A', rho: 'm' }, ($) => $.B, { unit: 'T', label: String.raw`$B$ as a formula ($\rho$ is the distance)` }),
      num('B', ($) => $.B, 'T')],
    steps: ($, f) => [String.raw`$B = \dfrac{\mu_0 I}{2\pi\rho} = \dfrac{${pv(MU0, 'T·m/A')}${pv($.I, 'A')}}{2\pi${pv($.rho, 'm')}} = ${texNum($.B)}\ \text{T}$`],
    sim: {
      scenario: 'wire',
      setup(s, $) {
        Object.assign(s, { I: $.I, probe: { x: $.rho, y: 0, z: 0 } });
      },
      read: (c) => ({ B: c.biot.an.ideal }),
    },
    cases: [
      kase('#4', { I: 4, rho: 2 }, { B: 4e-5 }, { key: '4 x 10-5 T and out of page' }),
      kase('#5', { I: 2, rho: 60 }, { B: 6.667e-7 }, { key: '6.67 x 10-7 T and into the page', note: 'The question asks only for the size. "Into the page" assumes the current runs in +y, which the sheet does not say.' }),
      kase('lab default', { I: 2, rho: 12 }, { B: 3.333e-6 }),
    ],
  }),
  problem({
    ...E4, id: 'e4.47.rhr-wire', ch: '47', lab: 'biot', title: 'Direction of B around a wire', kind: 'conceptual', topics: ['right-hand-rule'],
    vars: { Id: UPDOWN, at: choice([1, 'on the +x side'], [-1, 'on the −x side'], [3, 'on the +z side'], [-3, 'on the −z side']) },
    derive: ($) => {
      const map = { 1: -3, [-1]: 3, 3: 1, [-3]: -1 };
      return { code: $.Id * map[$.at] };
    },
    text: (T) => `A long wire runs along the y-axis carrying current ${T.Id === 'upward' ? 'in the +y direction' : 'in the −y direction'}. What is the direction of B at a point ${T.at} of the wire?`,
    parts: [mc('dir', AXES6, ($) => $.code)],
    hints: [String.raw`Thumb along $I$, fingers curl the way $\vec{B}$ points — equivalently $d\vec{B} \propto I\,d\vec{l}\times\hat{r}$.`],
    steps: () => [String.raw`$\hat{y}\times\hat{x} = -\hat{z}$ and $\hat{y}\times\hat{z} = +\hat{x}$. Reverse the result for downward current.`],
    sim: {
      scenario: 'wire',
      setup(s, $) {
        const d = 0.12;
        const r = { 1: { x: d, y: 0, z: 0 }, [-1]: { x: -d, y: 0, z: 0 }, 3: { x: 0, y: 0, z: d }, [-3]: { x: 0, y: 0, z: -d } }[$.at];
        Object.assign(s, { I: 2 * $.Id, probe: r });
      },
      read: (c) => ({ dir: axisCode(c.biot.Bnum) }),
    },
    cases: [kase('up, +x', { Id: 1, at: 1 }, { dir: -3 })],
  }),
  problem({
    ...E4, id: 'e4.47.loop', ch: '47', lab: 'biot', src: 'Practice 47 #9, #21', title: 'B on the axis of a current loop', kind: 'numeric', level: 2, topics: ['biot-savart'],
    vars: { N: range(1, 50, 1, 'turns'), I: range(0.5, 8, 0.1, 'A'), R: range(2, 40, 1, 'cm', 1e-2), y: range(0, 40, 1, 'cm', 1e-2) },
    derive: ($) => ({ B: (MU0 * $.N * $.I * $.R ** 2) / (2 * ($.R ** 2 + $.y ** 2) ** 1.5) }),
    text: (T, $) => `A flat circular coil of ${T.N} turn${$.N === 1 ? '' : 's'} and radius ${T.R} cm carries ${T.I} A. Find B on its axis ${T.y} cm from the center.`,
    parts: [
      sym('B_sym', 'mu0*N*I*R^2/(2*(R^2 + y^2)^(3/2))', { N: '1', I: 'A', R: 'm', y: 'm' }, ($) => $.B, { unit: 'T', label: String.raw`$B$ as a formula` }),
      num('B', ($) => $.B, 'T'),
    ],
    hints: [String.raw`At the center, $y = 0$, this reduces to $\dfrac{\mu_0 NI}{2R}$.`],
    steps: ($, f) => [
      String.raw`$B = \dfrac{\mu_0 N I R^2}{2(R^2+y^2)^{3/2}} = \dfrac{${pv(MU0, 'T·m/A')}(${texNum($.N)})${pv($.I, 'A')}${pv($.R, 'm')}^2}{2\left[${pv($.R, 'm')}^2 + ${pv($.y, 'm')}^2\right]^{3/2}} = ${texNum($.B)}\ \text{T}$`,
    ],
    sim: {
      scenario: 'loop',
      setup(s, $) {
        Object.assign(s, { I: $.I, R: $.R, nTurns: 1, probe: { x: 0, y: $.y, z: 0 } });
        s._N = $.N;
        return $.N > 1 ? `The lab draws one turn; multiply its B by N = ${$.N}.` : '';
      },
      read: (c, s) => ({ B: c.biot.an.exact * s._N }),
    },
    cases: [
      kase('#9', { N: 1, I: 2, R: 4, y: 0 }, { B: 3.1416e-5 }, { key: '3.14 x 10-5 T and out of page' }),
      kase('lab default', { N: 1, I: 3, R: 28, y: 20 }, { B: 3.627e-6 }),
      kase('center', { N: 10, I: 2, R: 10, y: 0 }, { B: 1.2566e-4 }),
    ],
  }),
  problem({
    ...E4, id: 'e4.47.solenoid', ch: '47', lab: 'biot', src: 'Practice 47 #16', title: 'Field inside a long solenoid', kind: 'numeric', topics: ['ampere', 'solenoid'],
    vars: { N: range(100, 5000, 100, 'turns'), L: range(0.1, 1, 0.05, 'm'), I: range(0.1, 20, 0.1, 'A') },
    derive: ($) => ({ n: $.N / $.L, B: (MU0 * $.N * $.I) / $.L }),
    text: (T) => `A solenoid ${T.L} m long has ${T.N} turns and carries ${T.I} A. Find n and the field inside.`,
    parts: [
      sym('B_sym', 'mu0*N*I/L', { N: '1', I: 'A', L: 'm' }, ($) => $.B, { unit: 'T', label: String.raw`$B$ as a formula` }),
      num('n', ($) => $.n, 'turns/m'), num('B', ($) => $.B, 'T')],
    steps: ($, f) => [
      String.raw`$n = \dfrac{N}{L} = \dfrac{${texNum($.N)}}{${qty($.L, 'm')}} = ${texNum($.n)}\ \text{m}^{-1}$`,
      String.raw`$B = \mu_0 n I = ${pv(MU0, 'T·m/A')}${pv($.n, 'm⁻¹')}${pv($.I, 'A')} = ${texNum($.B)}\ \text{T}$`,
    ],
    sim: {
      scenario: 'solenoid',
      setup(s, $) {
        const shown = 24;
        Object.assign(s, { L: Math.min($.L, 1.2), nTurns: shown, I: ($.I * ($.N / $.L) * Math.min($.L, 1.2)) / shown });
        return `The lab draws ${shown} turns with the current scaled so n·I matches.`;
      },
      read: (c) => ({ B: c.biot.an.ideal }),
    },
    cases: [kase('#16', { N: 400, L: 0.4, I: 12 }, { n: 1000, B: 0.01508 }, { key: '0.015 T', note: 'The sheet also gives the radius, 0.040 m; for a long solenoid the field inside does not depend on it.' }), kase('hand', { N: 1000, L: 0.5, I: 2 }, { n: 2000, B: 5.027e-3 })],
  }),
  problem({
    ...E4, id: 'e4.47.parallel-wires', ch: '47', lab: 'magforce', src: 'Practice 47 #13–14', title: 'Force between parallel wires', kind: 'numeric', topics: ['magnetic-force', 'ampere'],
    vars: { I1: range(1, 60, 1, 'A'), I2: range(1, 60, 1, 'A'), same: choice([1, 'the same direction'], [-1, 'opposite directions']), d: range(0.2, 50, 0.1, 'cm', 1e-2), L: range(0.1, 5, 0.1, 'm') },
    derive: ($) => {
      const FL = (MU0 * $.I1 * $.I2) / (2 * Math.PI * $.d);
      return { FL, F: FL * $.L };
    },
    text: (T) => `Two long parallel wires ${T.d} cm apart carry ${T.I1} A and ${T.I2} A in ${T.same}. Find the force per metre between them and the force on a ${T.L} m length of either wire. Do they attract or repel?`,
    parts: [
      sym('FL_sym', 'mu0*I1*I2/(2*pi*d)', { I1: 'A', I2: 'A', d: 'm' }, ($) => $.FL, { unit: 'N/m', label: String.raw`$F/L$ as a formula` }),
      num('FL', ($) => $.FL, 'N/m', { label: String.raw`$F/L$` }),
      num('F', ($) => $.F, 'N', { label: (T) => `Force on ${T.L} m` }),
      mc('type', [[1, 'Attract'], [-1, 'Repel']], ($) => $.same, { label: 'Attract or repel?' }),
    ],
    steps: ($, f) => [
      String.raw`$\dfrac{F}{L} = \dfrac{\mu_0 I_1 I_2}{2\pi d} = \dfrac{${pv(MU0, 'T·m/A')}${pv($.I1, 'A')}${pv($.I2, 'A')}}{2\pi${pv($.d, 'm')}} = ${texNum($.FL)}\ \text{N/m}$`,
      String.raw`$F = \dfrac{F}{L}\cdot L = ${pv($.FL, 'N/m')}${pv($.L, 'm')} = ${texNum($.F)}\ \text{N}$`,
      'Parallel currents attract; antiparallel currents repel.',
    ],
    sim: {
      scenario: 'parallel',
      setup(s, $) {
        Object.assign(s, { kind: 'parallel', I1: $.I1, I2: $.same * $.I2, d: $.d });
      },
      read: (c) => ({ FL: Math.abs(c.mf.an), type: c.mf.attract ? 1 : -1 }),
    },
    cases: [
      kase('#13', { I1: 5, I2: 8, same: -1, d: 30, L: 0.5 }, { FL: 2.667e-5, F: 1.333e-5, type: -1 }, { key: '1.33 x 10-5 N and repulsive' }),
      kase('#14', { I1: 40, I2: 60, same: 1, d: 0.2, L: 1.2 }, { FL: 0.24, F: 0.288, type: 1 }, { key: '0.29 N and attractive' }),
      kase('lab default', { I1: 20, I2: 20, same: 1, d: 25, L: 1 }, { FL: 3.2e-4, F: 3.2e-4, type: 1 }),
    ],
  }),
  problem({
    ...E4, id: 'e4.47.thick-wire', ch: '47', lab: 'ampere', title: "Ampère's law inside and outside a thick wire", kind: 'numeric', level: 2, topics: ['ampere'],
    vars: { I: range(1, 20, 1, 'A'), a: range(0.1, 0.4, 0.01, 'm'), f: range(0.1, 2, 0.05) },
    derive: ($) => {
      const r = $.f * $.a;
      return { r, B: r < $.a ? (MU0 * $.I * r) / (2 * Math.PI * $.a ** 2) : (MU0 * $.I) / (2 * Math.PI * r) };
    },
    valid: ($) => Math.abs($.f - 1) > 0.01 && $.r <= 0.8,
    text: (T, $, f) => `A long solid wire of radius ${T.a} m carries ${T.I} A spread uniformly over its cross section. Find B at r = ${f($.r)} m from the axis.`,
    parts: [num('B', ($) => $.B, 'T')],
    hints: [String.raw`Inside the wire, $I_{\text{enc}} = I\dfrac{r^2}{a^2}$.`],
    steps: ($, f) => [
      String.raw`$r < a$: $B = \dfrac{\mu_0 I r}{2\pi a^2}$.  $r > a$: $B = \dfrac{\mu_0 I}{2\pi r}$.`,
      $.r < $.a
        ? String.raw`Here $r < a$: $B = \dfrac{\mu_0 I r}{2\pi a^2} = \dfrac{${pv(MU0, 'T·m/A')}${pv($.I, 'A')}${pv($.r, 'm')}}{2\pi${pv($.a, 'm')}^2} = ${texNum($.B)}\ \text{T}$`
        : String.raw`Here $r > a$: $B = \dfrac{\mu_0 I}{2\pi r} = \dfrac{${pv(MU0, 'T·m/A')}${pv($.I, 'A')}}{2\pi${pv($.r, 'm')}} = ${texNum($.B)}\ \text{T}$`,
    ],
    sim: {
      scenario: 'thick',
      setup(s, $) {
        s.wires = [{ I: $.I, x: 0, z: 0, a: $.a }];
        s.r = $.r;
        s.cx = 0;
        s.cz = 0;
      },
      read: (c) => ({ B: c.amp.Bsym }),
    },
    cases: [kase('lab default', { I: 6, a: 0.3, f: 0.6 }, { B: 2.4e-6 })],
  }),
  problem({
    ...E4, id: 'e4.47.two-wires-B', ch: '47', lab: 'ampere', src: 'Practice 47 #6', title: 'Net B between two parallel wires', kind: 'numeric', level: 2, topics: ['superposition', 'biot-savart'],
    vars: { I1: range(1, 30, 1, 'A'), I2: range(1, 30, 1, 'A'), same: choice([1, 'the same direction'], [-1, 'opposite directions']), d: range(5, 50, 1, 'cm', 1e-2), f: range(0.1, 0.9, 0.1) },
    derive: ($) => {
      const r1 = $.f * $.d;
      const r2 = $.d - r1;
      const B = (MU0 / (2 * Math.PI)) * ($.I1 / r1 - $.same * ($.I2 / r2));
      return { r1, r2, B: Math.abs(B) };
    },
    text: (T, $, f) => `Two long parallel wires ${T.d} cm apart carry ${T.I1} A and ${T.I2} A in ${T.same}. Find |B| at the point on the line between them that is ${f($.r1 * 100)} cm from wire 1.`,
    parts: [num('B', ($) => $.B, 'T', { abs: 1e-9 })],
    hints: ['Between the wires, parallel currents make opposite fields and antiparallel currents make fields in the same direction.'],
    steps: ($, f) => [
      String.raw`$B_1 = \dfrac{\mu_0 I_1}{2\pi r_1} = \dfrac{${pv(MU0, 'T·m/A')}${pv($.I1, 'A')}}{2\pi${pv($.r1, 'm')}} = ${texNum((MU0 * $.I1) / (2 * Math.PI * $.r1))}\ \text{T}$`,
      String.raw`$B_2 = \dfrac{\mu_0 I_2}{2\pi r_2} = \dfrac{${pv(MU0, 'T·m/A')}${pv($.I2, 'A')}}{2\pi${pv($.r2, 'm')}} = ${texNum((MU0 * $.I2) / (2 * Math.PI * $.r2))}\ \text{T}$`,
      String.raw`Between the wires the fields ${$.same > 0 ? 'point opposite ways, so they subtract' : 'point the same way, so they add'}: $B = ${texNum($.B)}\ \text{T}$`,
    ],
    cases: [
      kase('#6', { I1: 20, I2: 5, same: 1, d: 20, f: 0.5 }, { B: 3e-5 }, { key: '3 x 10-5 T and into the page', note: 'The size checks. The direction depends on which way the currents run and which side each wire is on, which the sheet does not say.' }),
      kase('opposite, midpoint', { I1: 10, I2: 10, same: -1, d: 20, f: 0.5 }, { B: 4e-5 }),
    ],
  }),
  problem({
    ...E4, id: 'e4.47.field-pictures', ch: '47', lab: 'biot', src: 'Practice 47 #1–3, #8, #10–11', title: 'Fields and forces from currents, by picture', kind: 'conceptual', topics: ['biot-savart', 'right-hand-rule'],
    vars: {
      ask: choice(['lines', 'lines'], ['wires', 'wires'], ['point', 'point'], ['loop', 'loop'], ['rings', 'rings'], ['cancel', 'cancel']),
      flip: choice([1, 'as stated'], [-1, 'reversed']),
    },
    text: (T, $) => ({
      lines: 'The magnetic field lines around a long straight current-carrying wire…',
      wires: `Two long straight wires lie side by side on a table, carrying currents in ${$.flip > 0 ? 'the same direction' : 'opposite directions'}. What do they do?`,
      point: `A long straight wire lies along the x-axis carrying current in the ${$.flip > 0 ? '+x' : '−x'} direction. What is the direction of its magnetic field at a point on the +y axis?`,
      loop: `A loop of wire lies flat on a table. Seen from above, its current runs ${$.flip > 0 ? 'counterclockwise' : 'clockwise'}. Inside the loop, its magnetic field…`,
      rings: `One ring of wire sits directly above another. Seen from above, the top ring's current runs clockwise and the bottom ring's runs ${$.flip > 0 ? 'counterclockwise' : 'clockwise'}. What is the direction of the magnetic force on the top ring from the bottom one?`,
      cancel: `A circular loop lies just above a long straight wire in the plane of the page. The wire's current runs to the ${$.flip > 0 ? 'right' : 'left'}. Which way must the loop's current circulate to make the field at the loop's centre zero?`,
    })[$.ask],
    parts: [
      mc('ans', ($) => ({
        lines: [
          ['circle', 'Circle the wire in closed loops'],
          ['radial', 'Point straight out from the wire', 'Radial lines belong to the electric field of a line charge. Magnetic field lines around a current close on themselves.'],
          ['both', 'Both circle it and point out from it', 'B is everywhere tangent to circles around the wire; it has no radial part.'],
        ],
        wires: [
          ['attract', 'They pull toward each other', () => ($.flip < 0 ? 'Antiparallel currents repel — the opposite of what like charges do.' : '')],
          ['repel', 'They push apart', () => ($.flip > 0 ? 'Parallel currents attract — the opposite of what like charges do.' : '')],
          ['lift', 'One lifts while the other is pressed into the table', 'Each wire feels a force toward or away from the other, in the plane of the table — not up or down.'],
        ],
        point: [
          ['out', 'Out of the page', () => ($.flip < 0 ? String.raw`$d\vec{l}\times\hat{r}$ for current along $-\hat{x}$ and a point toward $+\hat{y}$ is $-\hat{x}\times\hat{y} = -\hat{z}$: into the page.` : '')],
          ['in', 'Into the page', () => ($.flip > 0 ? String.raw`$\hat{x}\times\hat{y} = +\hat{z}$: the field above a wire carrying current to the right comes out of the page.` : '')],
          ['alongI', 'Along the wire', 'B circles the wire; it never points along the current.'],
          ['away', 'Straight away from the wire (+y)', 'B circles the wire; it has no part pointing away from it.'],
        ],
        loop: [
          ['up', 'Points up, out of the table', () => ($.flip < 0 ? 'Curl the fingers of your right hand clockwise: your thumb points down into the table.' : '')],
          ['down', 'Points down, into the table', () => ($.flip > 0 ? 'Curl the fingers of your right hand counterclockwise: your thumb points up.' : '')],
          ['cw', 'Circles the loop clockwise', 'Inside a flat loop the field goes straight through it, perpendicular to the loop.'],
          ['ccw', 'Circles the loop counterclockwise', 'Inside a flat loop the field goes straight through it, perpendicular to the loop.'],
        ],
        rings: [
          ['up', 'Upward, away from the bottom ring', () => ($.flip < 0 ? 'Currents circulating the same way attract, like parallel wires.' : '')],
          ['down', 'Downward, toward the bottom ring', () => ($.flip > 0 ? 'Opposite circulations are like antiparallel wires: they repel.' : '')],
          ['side', 'Sideways', 'By symmetry any sideways pull from one side of the ring is cancelled by the other side.'],
          ['zero', 'Zero', 'Each piece of the top ring sits in the bottom ring’s field and feels a force; they add up along the axis.'],
        ],
        cancel: [
          ['ccw', 'Counterclockwise', () => ($.flip > 0 ? 'Above a wire carrying current to the right, the wire’s field comes out of the page; a counterclockwise loop adds more out of the page.' : '')],
          ['cw', 'Clockwise', () => ($.flip < 0 ? 'Above a wire carrying current to the left, the wire’s field goes into the page; a clockwise loop adds more into the page.' : '')],
          ['either', 'Either way', 'The loop’s field at its centre points through the page one way or the other depending on its direction; only one of them cancels the wire.'],
          ['none', 'The loop should carry no current', 'With no loop current, the wire’s field at the centre is not zero.'],
        ],
      })[$.ask], ($) => ({
        lines: 'circle',
        wires: $.flip > 0 ? 'attract' : 'repel',
        point: $.flip > 0 ? 'out' : 'in',
        loop: $.flip > 0 ? 'up' : 'down',
        rings: $.flip > 0 ? 'up' : 'down',
        cancel: $.flip > 0 ? 'cw' : 'ccw',
      })[$.ask]),
    ],
    hints: [
      'Right-hand rule for a straight wire: thumb along the current, fingers curl the way B goes. For a loop: fingers curl with the current, thumb points along B through the middle.',
      'Parallel currents attract, antiparallel currents repel. Two loops behave the same way: same circulation attracts, opposite repels.',
    ],
    steps: ($) => [
      ({
        lines: 'B is tangent to circles centred on the wire: the lines close on themselves.',
        wires: $.flip > 0 ? 'Each wire sits in the other’s field; for parallel currents I dl × B points toward the other wire: they attract.' : 'For antiparallel currents the forces point away from each other: they repel.',
        point: String.raw`$d\vec{B} \propto I\,d\vec{l}\times\hat{r}$ with $\hat{r} = +\hat{y}$: $${$.flip > 0 ? '+' : '-'}\hat{x}\times\hat{y} = ${$.flip > 0 ? '+' : '-'}\hat{z}$, ${$.flip > 0 ? 'out of' : 'into'} the page.`,
        loop: `Curl your fingers ${$.flip > 0 ? 'counterclockwise' : 'clockwise'}: the thumb points ${$.flip > 0 ? 'up out of' : 'down into'} the table, and that is B inside the loop.`,
        rings: $.flip > 0 ? 'Opposite circulations repel, so the top ring is pushed up.' : 'Same circulations attract, so the top ring is pulled down.',
        cancel: `The wire's field at the centre points ${$.flip > 0 ? 'out of' : 'into'} the page, so the loop must make B ${$.flip > 0 ? 'into' : 'out of'} the page at its centre: ${$.flip > 0 ? 'clockwise' : 'counterclockwise'}.`,
      })[$.ask],
    ],
    cases: [
      kase('#1', { ask: 'lines', flip: 1 }, { ans: 'circle' }, { key: 'A) circle the wire in closed loops' }),
      kase('#2', { ask: 'wires', flip: 1 }, { ans: 'attract' }, { key: 'C) the wires pull toward each other' }),
      kase('#3', { ask: 'point', flip: 1 }, { ans: 'out' }, { key: 'E) out of the plane of the page' }),
      kase('#8', { ask: 'loop', flip: 1 }, { ans: 'up' }, { key: 'C) points out of page' }),
      kase('#10', { ask: 'rings', flip: 1 }, { ans: 'up' }, { key: 'A) upward' }),
      kase('#11', { ask: 'cancel', flip: 1 }, { ans: 'cw' }, { key: 'B) clockwise' }),
    ],
  }),
  problem({
    ...E4, id: 'e4.47.two-wires-outside', ch: '47', lab: 'ampere', src: 'Practice 47 #7', title: 'Net B beside a pair of parallel wires', kind: 'numeric', level: 2, topics: ['superposition', 'biot-savart'],
    vars: { I1: range(1, 30, 1, 'A'), I2: range(1, 30, 1, 'A'), same: choice([1, 'the same direction'], [-1, 'opposite directions']), d: range(5, 50, 1, 'cm', 1e-2), a: range(5, 80, 5, 'cm', 1e-2) },
    derive: ($) => {
      const B1 = (MU0 * $.I1) / (2 * Math.PI * $.a);
      const B2 = (MU0 * $.I2) / (2 * Math.PI * ($.a + $.d));
      return { B1, B2, B: Math.abs(B1 + $.same * B2) };
    },
    valid: ($) => $.B > 1e-8,
    text: (T, $, f) => `Two long parallel wires ${T.d} cm apart carry ${T.I1} A (wire 1) and ${T.I2} A (wire 2) in ${T.same}. Find |B| at a point in the plane of the wires, outside the pair: ${T.a} cm from wire 1 and ${f(($.a + $.d) * 100)} cm from wire 2.`,
    parts: [num('B', ($) => $.B, 'T', { abs: 1e-9 })],
    hints: [
      String.raw`Each wire gives $B = \dfrac{\mu_0 I}{2\pi r}$ with its own distance $r$.`,
      'Outside the pair, the two fields point the same way if the currents are parallel and opposite ways if they are antiparallel — the reverse of the situation between the wires.',
    ],
    steps: ($) => [
      String.raw`$B_1 = \dfrac{\mu_0 I_1}{2\pi r_1} = \dfrac{${pv(MU0, 'T·m/A')}${pv($.I1, 'A')}}{2\pi${pv($.a, 'm')}} = ${texNum($.B1)}\ \text{T}$`,
      String.raw`$B_2 = \dfrac{\mu_0 I_2}{2\pi r_2} = \dfrac{${pv(MU0, 'T·m/A')}${pv($.I2, 'A')}}{2\pi${pv($.a + $.d, 'm')}} = ${texNum($.B2)}\ \text{T}$`,
      String.raw`Outside the pair the fields ${$.same > 0 ? 'point the same way, so they add' : 'point opposite ways, so they subtract'}: $B = ${texNum($.B)}\ \text{T}$`,
    ],
    cases: [kase('#7', { I1: 10, I2: 10, same: -1, d: 40, a: 20 }, { B: 6.667e-6 }, { key: '6.67 x 10-6 T and into the page', note: 'The size checks. "Into the page" depends on which way the nearer wire’s current runs, which the sheet does not say.' })],
  }),
  problem({
    ...E4, id: 'e4.47.wire-and-loop', ch: '47', lab: 'biot', src: 'Practice 47 #12', title: 'A straight wire and a loop: the field at the loop’s centre', kind: 'numeric', level: 2, topics: ['superposition', 'biot-savart'],
    vars: { Iw: range(1, 20, 0.5, 'A'), d: range(0.2, 1, 0.05, 'm'), r: range(0.02, 0.2, 0.01, 'm'), IL: range(0.1, 5, 0.1, 'A'), sense: choice([1, 'counterclockwise'], [-1, 'clockwise']) },
    derive: ($) => {
      const Bw = -(MU0 * $.Iw) / (2 * Math.PI * $.d); // right of an upward current: into the page
      const Bl = ($.sense * MU0 * $.IL) / (2 * $.r); // counterclockwise: out of the page
      const Bz = Bw + Bl;
      return { Bw, Bl, Bz, B: Math.abs(Bz), dir: Bz > 0 ? 'out' : 'in' };
    },
    valid: ($) => $.r < 0.8 * $.d && Math.abs($.Bz) > 0.05 * Math.max(Math.abs($.Bw), Math.abs($.Bl)),
    text: (T) => `A long straight wire runs up the page carrying ${T.Iw} A upward. A circular loop of radius ${T.r} m lies in the page to its right, its centre ${T.d} m from the wire, carrying ${T.IL} A ${T.sense}. Find the size and direction of the net magnetic field at the loop's centre.`,
    parts: [
      num('B', ($) => $.B, 'T'),
      mc('dir', [['out', 'Out of the page'], ['in', 'Into the page']], ($) => $.dir, { label: 'Direction' }),
    ],
    hints: [
      String.raw`Wire: $B = \dfrac{\mu_0 I_w}{2\pi d}$. Loop centre: $B = \dfrac{\mu_0 I_L}{2r}$. Both point straight through the page there.`,
      'Right of an upward current, the wire’s field goes into the page. A counterclockwise loop makes its field out of the page at the centre. Add them as signed numbers.',
    ],
    steps: ($) => [
      String.raw`Wire: $\dfrac{\mu_0 I_w}{2\pi d} = \dfrac{${pv(MU0, 'T·m/A')}${pv($.Iw, 'A')}}{2\pi${pv($.d, 'm')}} = ${texNum(-$.Bw)}\ \text{T}$, into the page`,
      String.raw`Loop: $\dfrac{\mu_0 I_L}{2r} = \dfrac{${pv(MU0, 'T·m/A')}${pv($.IL, 'A')}}{2${pv($.r, 'm')}} = ${texNum(Math.abs($.Bl))}\ \text{T}$, ${$.sense > 0 ? 'out of' : 'into'} the page`,
      String.raw`Out of the page positive: $B = ${texNum($.Bl)} - ${texNum(-$.Bw)} = ${texNum($.Bz)}\ \text{T}$, so $${texNum($.B)}\ \text{T}$ ${$.dir === 'out' ? 'out of' : 'into'} the page`,
    ],
    cases: [kase('#12', { Iw: 5, d: 0.5, r: 0.1, IL: 0.8, sense: 1 }, { B: 3.027e-6, dir: 'out' }, { key: '3.0 x 10-6 T and out of page' })],
  }),
  problem({
    ...E4, id: 'e4.47.solenoid-core', ch: '47', lab: 'biot', src: 'Practice 47 #15, #17', title: 'Solenoid: the current for a field, and an iron core', kind: 'numeric', topics: ['ampere', 'solenoid'],
    vars: {
      ask: choice(['I', 'current'], ['iron', 'iron']),
      N: range(100, 2000, 50, 'turns'), L: range(0.02, 1, 0.01, 'm'), B: range(0.01, 2, 0.01, 'T'), I: range(0.5, 20, 0.5, 'A'),
      mu: choice([6.5e-3, '6.5 × 10⁻³'], [2.5e-3, '2.5 × 10⁻³'], [1e-3, '1.0 × 10⁻³']),
    },
    derive: ($) => ({ n: $.N / $.L, Ineed: ($.B * $.L) / (MU0 * $.N), Biron: ($.mu * $.N * $.I) / $.L }),
    text: (T, $) => ($.ask === 'I'
      ? `How much current must flow in an air-core solenoid of ${T.N} turns and length ${T.L} m to make a ${T.B} T field at its centre?`
      : `A solenoid of ${T.N} turns and length ${T.L} m, filled with iron of permeability μ = ${T.mu} T·m/A, carries ${T.I} A. Using that permeability, what field does it produce inside?`),
    parts: [num('ans', ($) => ($.ask === 'I' ? $.Ineed : $.Biron), ($) => ($.ask === 'I' ? 'A' : 'T'), { label: ($T, $) => ($.ask === 'I' ? 'I' : 'B') })],
    hints: [
      String.raw`Inside a long solenoid $B = \mu nI$ with $n = N/L$; in air $\mu = \mu_0 = 4\pi\times10^{-7}$ T·m/A.`,
      String.raw`Filling it with iron swaps $\mu_0$ for the iron's $\mu$. Turning the formula round gives the current: $I = \dfrac{BL}{\mu_0 N}$.`,
    ],
    steps: ($) => ($.ask === 'I'
      ? [String.raw`$I = \dfrac{BL}{\mu_0 N} = \dfrac{${pv($.B, 'T')}${pv($.L, 'm')}}{${pv(MU0, 'T·m/A')}(${texNum($.N)})} = ${texNum($.Ineed)}\ \text{A}$`]
      : [
          String.raw`$B = \mu nI = \mu\dfrac{N}{L}I = ${pv($.mu, 'T·m/A')}\dfrac{${texNum($.N)}}{${qty($.L, 'm')}}${pv($.I, 'A')} = ${texNum($.Biron)}\ \text{T}$`,
          'That is what the linear formula gives. Real iron saturates at about 2 T, so a field this large would not actually appear; the formula only holds well below saturation.',
        ]),
    cases: [
      kase('#15', { ask: 'I', N: 400, L: 0.04, B: 1, I: 1, mu: 6.5e-3 }, { ans: 79.58 }, { key: '79.6 A' }),
      kase('#17', { ask: 'iron', N: 400, L: 0.4, B: 1, I: 12, mu: 6.5e-3 }, { ans: 78 }, { key: '78 T', note: 'The arithmetic is right for μ = 6.5 × 10⁻³ T·m/A, but iron saturates near 2 T, so a real iron core would give nowhere near 78 T.' }),
    ],
  }),
  problem({
    ...E4, id: 'e4.47.ampere-enclosed', ch: '47', lab: 'ampere', src: 'Practice 47 #18', title: "Ampère's law: count the enclosed current", kind: 'numeric', topics: ['ampere'],
    vars: {
      I1: range(1, 10, 1, 'A'), I2: range(1, 10, 1, 'A'), I3: range(1, 10, 1, 'A'), I4: range(1, 10, 1, 'A'),
      d1: UPDOWN, d2: UPDOWN, d3: UPDOWN, d4: UPDOWN,
      out: choice([1, 'wire 1'], [2, 'wire 2'], [3, 'wire 3'], [4, 'wire 4']),
    },
    derive: ($) => {
      const I = [$.I1 * $.d1, $.I2 * $.d2, $.I3 * $.d3, $.I4 * $.d4];
      const Ienc = I.reduce((a, x, i) => (i + 1 === $.out ? a : a + x), 0);
      return { I, Ienc, circ: MU0 * Ienc };
    },
    valid: ($) => $.Ienc !== 0,
    text: (T, $) => `Four long vertical wires carry I₁ = ${T.I1} A (${T.d1}), I₂ = ${T.I2} A (${T.d2}), I₃ = ${T.I3} A (${T.d3}) and I₄ = ${T.I4} A (${T.d4}). A horizontal Amperian loop encircles every wire except ${T.out}, and is traversed counterclockwise as seen from above. Find ∮B · dl around it.`,
    parts: [num('circ', ($) => $.circ, 'T·m', { label: String.raw`$\oint \vec{B}\cdot d\vec{l}$ (signed)` })],
    hints: [
      String.raw`Ampère's law: $\oint \vec{B}\cdot d\vec{l} = \mu_0 I_{\text{enc}}$. Wires outside the loop contribute nothing to the integral, however close they are.`,
      String.raw`For a loop traversed counterclockwise seen from above, the right-hand rule counts upward current as positive and downward as negative.`,
    ],
    steps: ($) => [
      String.raw`$I_{\text{enc}} = ${$.I.map((x, i) => (i + 1 === $.out ? null : `(${texNum(x)})`)).filter(Boolean).join(' + ')}\ \text{A} = ${texNum($.Ienc)}\ \text{A}$ (up positive; wire ${$.out} is outside)`,
      String.raw`$\oint \vec{B}\cdot d\vec{l} = \mu_0 I_{\text{enc}} = ${pv(MU0, 'T·m/A')}${pv($.Ienc, 'A')} = ${texNum($.circ)}\ \text{T}\cdot\text{m}$`,
    ],
    cases: [
      kase('#18', { I1: 3, I2: 3, I3: 2, I4: 2, d1: 1, d2: -1, d3: 1, d4: -1, out: 1 }, { circ: -3.77e-6 }, {
        key: '−3.8 x 10-6 HA/m',
        note: 'H·A/m is the same unit as T·m. The sign assumes the loop is traversed so that upward current counts as positive.',
      }),
    ],
  }),
  problem({
    ...E4, id: 'e4.47.toroid', ch: '47', lab: 'ampere', src: 'Practice 47 #19', title: 'Field inside a toroid', kind: 'derivation', level: 2, topics: ['ampere'],
    vars: { N: range(100, 2000, 50, 'turns'), I: range(0.5, 10, 0.5, 'A'), r: range(0.05, 0.5, 0.01, 'm') },
    derive: ($) => ({ B: (MU0 * $.N * $.I) / (2 * Math.PI * $.r) }),
    text: (T) => `A toroid has ${T.N} turns carrying ${T.I} A. Use Ampère's law to find the field inside its windings, a distance r from the centre, and evaluate it at r = ${T.r} m.`,
    parts: [
      self('loop', 'Draw the Amperian loop and mark dl on it.', 'A circle of radius r through the inside of the windings, concentric with the toroid, with dl tangent to it and pointing the way B circulates.'),
      sym('B_sym', 'mu0*N*I/(2*pi*r)', { N: '1', I: 'A', r: 'm' }, ($) => $.B, { unit: 'T', label: String.raw`$B$ as a formula` }),
      num('B', ($) => $.B, 'T'),
    ],
    hints: [
      String.raw`By symmetry B has the same size all around a circle of radius r and runs along it, so $\oint \vec{B}\cdot d\vec{l} = B(2\pi r)$.`,
      String.raw`That circle threads every turn once: $I_{\text{enc}} = NI$.`,
    ],
    steps: ($) => [
      String.raw`$\oint \vec{B}\cdot d\vec{l} = B(2\pi r) = \mu_0 NI \;\Longrightarrow\; B = \dfrac{\mu_0 NI}{2\pi r}$`,
      String.raw`$B = \dfrac{${pv(MU0, 'T·m/A')}(${texNum($.N)})${pv($.I, 'A')}}{2\pi${pv($.r, 'm')}} = ${texNum($.B)}\ \text{T}$`,
      'Outside the windings the enclosed current is zero (or NI − NI), so B = 0 there.',
    ],
    cases: [kase('hand', { N: 500, I: 2, r: 0.1 }, { B: 2e-3 })],
  }),
  problem({
    ...E4, id: 'e4.47.half-loop', ch: '47', lab: 'biot', src: 'Practice 47 #20', title: 'Field at the centre of a half loop', kind: 'derivation', level: 2, topics: ['biot-savart'],
    vars: { I: range(0.5, 10, 0.5, 'A'), R: range(1, 30, 1, 'cm', 1e-2), from: choice([1, 'the right'], [-1, 'the left']) },
    derive: ($) => ({ B: (MU0 * $.I) / (4 * $.R), dir: $.from > 0 ? 'out' : 'in' }),
    text: (T) => `A long wire runs along a straight line, rises into a semicircular arc of radius ${T.R} cm above point P, and continues along the same line. The current, ${T.I} A, comes in from ${T.from}. Use the Biot–Savart law to find the field at P, the centre of the arc (the straight parts are in line with P).`,
    parts: [
      sym('B_sym', 'mu0*I/(4*R)', { I: 'A', R: 'm' }, ($) => $.B, { unit: 'T', label: String.raw`$B$ as a formula` }),
      num('B', ($) => $.B, 'T'),
      mc('dir', [['out', 'Out of the page'], ['in', 'Into the page'], ['zero', 'There is no field at P', 'Each piece of the arc gives a field at P in the same direction; they add rather than cancel.']], ($) => $.dir, { label: 'Direction' }),
    ],
    hints: [
      String.raw`Straight segments that point at P give $d\vec{l}\times\hat{r} = 0$: they add nothing.`,
      String.raw`On the arc every $d\vec{l}$ is perpendicular to $\hat{r}$ and the distance is always R: $B = \dfrac{\mu_0 I}{4\pi R^2}\displaystyle\int dl = \dfrac{\mu_0 I}{4\pi R^2}(\pi R)$.`,
    ],
    steps: ($) => [
      String.raw`$B = \dfrac{\mu_0 I}{4\pi}\displaystyle\int_{\text{arc}}\frac{dl}{R^2} = \dfrac{\mu_0 I}{4\pi R^2}(\pi R) = \dfrac{\mu_0 I}{4R}$ — half of a full loop's $\mu_0 I/2R$`,
      String.raw`$B = \dfrac{${pv(MU0, 'T·m/A')}${pv($.I, 'A')}}{4${pv($.R, 'm')}} = ${texNum($.B)}\ \text{T}$`,
      `Coming in from ${$.from > 0 ? 'the right' : 'the left'}, the current goes over the arc ${$.from > 0 ? 'counterclockwise' : 'clockwise'} around P, so B at P points ${$.from > 0 ? 'out of' : 'into'} the page.`,
    ],
    cases: [kase('hand', { I: 2, R: 5, from: 1 }, { B: 1.2566e-5, dir: 'out' })],
  }),
];
