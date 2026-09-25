/** Exam 5 · Ch 48 (Faraday/Lenz), 49 (inductance, RL), 50 (motors, transformers, transmission), 51 (applications), 52 (AC circuits). */
import { problem, kase, range, choice, num, mc, sym, MU0, DEG , texNum } from '../kit.js';

const E5 = { exam: 'e5' };
const acSet = (s, o) => Object.assign(s, o);

export default [
  // ================================================================= 48
  problem({
    ...E5, id: 'e5.48.flux', ch: '48', lab: 'faraday', title: 'Magnetic flux through a loop', kind: 'numeric', topics: ['flux'],
    vars: { B: range(0.05, 2, 0.05, 'T'), r: range(2, 30, 1, 'cm', 1e-2), th: range(0, 90, 5, '°') },
    derive: ($) => ({ A: Math.PI * $.r ** 2, Phi: $.B * Math.PI * $.r ** 2 * Math.cos($.th * DEG) }),
    text: (T) => `A circular loop of radius ${T.r} cm sits in a uniform ${T.B} T field. The loop's normal makes ${T.th}° with B. Find the magnetic flux through the loop.`,
    parts: [num('Phi', ($) => $.Phi, 'Wb', { abs: 1e-9 })],
    steps: ($, f) => [String.raw`$\Phi_B = BA\cos\theta = ${texNum($.Phi)}\ \text{Wb}$`],
    sim: { scenario: 'expand', setup: (s, $) => void Object.assign(s, { B: Math.min(1, $.B), R0: Math.min(0.5, $.r) }) },
    cases: [kase('hand', { B: 0.5, r: 10, th: 60 }, { Phi: 7.854e-3 })],
  }),
  problem({
    ...E5, id: 'e5.48.changing-B', ch: '48', lab: 'faraday', title: 'emf from a changing field', kind: 'numeric', topics: ['faraday'],
    vars: { N: range(1, 200, 1, 'turns'), r: range(1, 20, 1, 'cm', 1e-2), dB: range(0.05, 2, 0.05, 'T'), dt: range(0.01, 2, 0.01, 's'), R: range(0.5, 50, 0.5, 'Ω') },
    derive: ($) => {
      const emf = ($.N * Math.PI * $.r ** 2 * $.dB) / $.dt;
      return { emf, I: emf / $.R };
    },
    text: (T) => `A ${T.N}-turn coil of radius ${T.r} cm (resistance ${T.R} Ω) is perpendicular to a field that increases steadily by ${T.dB} T in ${T.dt} s. Find the induced emf and current.`,
    parts: [
      sym('emf_sym', 'N*pi*r^2*dB/dt', { N: '1', r: 'm', dB: 'T', dt: 's' }, ($) => $.emf, { unit: 'V', label: String.raw`$|\varepsilon|$ as a formula` }),
      num('emf', ($) => $.emf, 'V', { label: '|ε|' }), num('I', ($) => $.I, 'A')],
    steps: ($, f) => [
      String.raw`$|\mathcal{E}| = NA\dfrac{\Delta B}{\Delta t} = ${texNum($.emf)}\ \text{V}$`,
      String.raw`$I = \dfrac{\mathcal{E}}{R} = ${texNum($.I)}\ \text{A}$`,
    ],
    cases: [kase('hand', { N: 50, r: 5, dB: 0.4, dt: 0.2, R: 4 }, { emf: 0.7854, I: 0.19635 })],
  }),
  problem({
    ...E5, id: 'e5.48.bar', ch: '48', lab: 'faraday', title: 'Sliding bar on rails', kind: 'numeric', level: 2, topics: ['motional-emf'],
    vars: { B: range(0.1, 1, 0.05, 'T'), L: range(0.1, 1, 0.05, 'm'), v: range(0.5, 10, 0.5, 'm/s'), R: range(0.5, 20, 0.5, 'Ω') },
    derive: ($) => {
      const emf = $.B * $.L * $.v;
      const I = emf / $.R;
      const F = I * $.L * $.B;
      return { emf, I, F, P: F * $.v };
    },
    text: (T) => `A bar slides at a steady ${T.v} m/s along rails ${T.L} m apart in a ${T.B} T field perpendicular to the rails. The circuit resistance is ${T.R} Ω. Find the emf, the current, the force needed to keep the bar moving, and the power delivered.`,
    parts: [
      sym('F_sym', 'B^2*L^2*v/R', { B: 'T', L: 'm', v: 'm/s', R: 'Ω' }, ($) => $.F, { unit: 'N', label: String.raw`the force $F$ as a formula` }),
      num('emf', ($) => $.emf, 'V'),
      num('I', ($) => $.I, 'A'),
      num('F', ($) => $.F, 'N'),
      num('P', ($) => $.P, 'W'),
    ],
    hints: [String.raw`The magnetic force on the current opposes the motion (Lenz), so you have to push with $F = ILB$.`],
    steps: ($, f) => [
      String.raw`$\mathcal{E} = BLv = ${texNum($.emf)}\ \text{V}$`,
      String.raw`$I = \dfrac{\mathcal{E}}{R} = ${texNum($.I)}\ \text{A}$`,
      String.raw`$F = ILB = ${texNum($.F)}\ \text{N}$`,
      String.raw`$P = Fv = I^2R = ${texNum($.P)}\ \text{W}$`,
    ],
    sim: { scenario: 'bar', setup: (s, $) => void Object.assign(s, { B: $.B, width: Math.min(0.8, $.L) }) },
    cases: [kase('hand', { B: 0.5, L: 0.4, v: 2, R: 2 }, { emf: 0.4, I: 0.2, F: 0.04, P: 0.08 })],
  }),
  problem({
    ...E5, id: 'e5.48.lenz', ch: '48', lab: 'faraday', title: "Lenz's law with a bar magnet", kind: 'conceptual', topics: ['lenz'],
    vars: { pole: choice([1, 'N'], [-1, 'S']), mot: choice([1, 'pushed toward'], [-1, 'pulled away from']) },
    text: (T) => `The ${T.pole} pole of a bar magnet is ${T.mot} a loop along its axis. Seen from the magnet's side, which way does the induced current flow?`,
    parts: [mc('dir', [[1, 'Counterclockwise'], [-1, 'Clockwise'], [0, 'No current']], ($) => $.pole * $.mot), mc('force', [[1, 'The loop repels the magnet'], [-1, 'The loop attracts the magnet']], ($) => $.mot, { label: 'Force on the magnet' })],
    hints: ['The induced current makes a field that opposes the change in flux.', 'A current that looks counterclockwise to you makes a north pole facing you.'],
    steps: () => ['An approaching N pole is opposed by an N face on the loop (counterclockwise as seen from the magnet), which repels it. A receding magnet gets attracted, and S poles flip everything.'],
    sim: { scenario: 'magnet' },
    cases: [kase('N approaching', { pole: 1, mot: 1 }, { dir: 1, force: 1 }), kase('S receding', { pole: -1, mot: -1 }, { dir: 1, force: -1 })],
  }),
  problem({
    ...E5, id: 'e5.48.expanding', ch: '48', lab: 'faraday', title: 'Expanding loop in a uniform field', kind: 'numeric', topics: ['faraday'],
    vars: { B: range(0.1, 1, 0.05, 'T'), R: range(5, 50, 1, 'cm', 1e-2), Rdot: range(0.01, 1, 0.01, 'm/s') },
    derive: ($) => ({ emf: $.B * 2 * Math.PI * $.R * $.Rdot }),
    text: (T) => `A circular loop in a ${T.B} T field (perpendicular to the loop) is expanding. When its radius is ${T.R} cm, the radius is growing at ${T.Rdot} m/s. Find the induced emf.`,
    parts: [num('emf', ($) => $.emf, 'V', { label: '|ε|' })],
    hints: [String.raw`$\Phi_B = B\pi R^2$, so $\dfrac{d\Phi_B}{dt} = B\,2\pi R\dfrac{dR}{dt}$`],
    steps: ($, f) => [String.raw`$|\mathcal{E}| = B\,2\pi R\dfrac{dR}{dt} = ${texNum($.emf)}\ \text{V}$`],
    sim: { scenario: 'expand', setup: (s, $) => void Object.assign(s, { B: $.B, R0: Math.min(0.5, $.R) }) },
    cases: [kase('hand', { B: 0.4, R: 28, Rdot: 0.1 }, { emf: 0.07037 })],
  }),
  problem({
    ...E5, id: 'e5.48.rotate-avg', ch: '48', lab: 'faraday', title: 'Average emf from rotating a coil', kind: 'numeric', level: 2, topics: ['faraday'],
    vars: { N: range(1, 200, 1, 'turns'), B: range(0.05, 1.5, 0.05, 'T'), A: range(10, 500, 10, 'cm²', 1e-4), th1: range(0, 90, 15, '°'), th2: range(0, 180, 15, '°'), dt: range(0.01, 1, 0.01, 's') },
    derive: ($) => ({ emf: ($.N * $.B * $.A * Math.abs(Math.cos($.th2 * DEG) - Math.cos($.th1 * DEG))) / $.dt }),
    valid: ($) => $.emf > 1e-6,
    text: (T) => `A ${T.N}-turn coil of area ${T.A} cm² in a ${T.B} T field is rotated so that the angle between its normal and B goes from ${T.th1}° to ${T.th2}° in ${T.dt} s. Find the average induced emf.`,
    parts: [num('emf', ($) => $.emf, 'V', { label: String.raw`$|\mathcal{E}_{\text{avg}}|$` })],
    steps: ($, f) => [String.raw`$|\mathcal{E}| = \dfrac{NBA\,|\cos\theta_2 - \cos\theta_1|}{\Delta t} = ${texNum($.emf)}\ \text{V}$`],
    cases: [kase('hand', { N: 10, B: 0.5, A: 400, th1: 0, th2: 90, dt: 0.1 }, { emf: 2 })],
  }),

  // ================================================================= 49
  problem({
    ...E5, id: 'e5.49.solenoid-L', ch: '49', title: 'Inductance of a solenoid', kind: 'numeric', topics: ['inductance'],
    vars: { N: range(50, 2000, 50, 'turns'), r: range(0.5, 5, 0.5, 'cm', 1e-2), l: range(5, 50, 1, 'cm', 1e-2) },
    derive: ($) => ({ L: (MU0 * $.N ** 2 * Math.PI * $.r ** 2) / $.l }),
    text: (T) => `A solenoid has ${T.N} turns, radius ${T.r} cm and length ${T.l} cm. Find its inductance.`,
    parts: [
      sym('L_sym', 'mu0*N^2*pi*r^2/l', { N: '1', r: 'm', l: 'm' }, ($) => $.L, { unit: 'H', label: String.raw`$L$ as a formula` }),
      num('L', ($) => $.L, 'mH', { scale: 1e-3 }),
    ],
    steps: ($, f) => [String.raw`$L = \dfrac{\mu_0 N^2 A}{\ell} = ${texNum($.L)}\ \text{H}$`],
    cases: [kase('hand', { N: 500, r: 2, l: 30 }, { L: 1.3159 })],
  }),
  problem({
    ...E5, id: 'e5.49.self-emf', ch: '49', title: 'Self-induced emf', kind: 'numeric', topics: ['inductance'],
    vars: { L: range(1, 500, 1, 'mH', 1e-3), dI: range(0.1, 10, 0.1, 'A'), dt: range(1, 500, 1, 'ms', 1e-3) },
    derive: ($) => ({ emf: ($.L * $.dI) / $.dt }),
    text: (T) => `The current in a ${T.L} mH inductor changes steadily by ${T.dI} A in ${T.dt} ms. What is the magnitude of the self-induced emf?`,
    parts: [
      sym('emf_sym', 'L*dI/dt', { L: 'H', dI: 'A', dt: 's' }, ($) => $.emf, { unit: 'V', label: String.raw`$|\varepsilon|$ as a formula` }),
      num('emf', ($) => $.emf, 'V'), mc('dir', [[1, 'It opposes the change in current'], [2, 'It helps the change along'], [3, 'It is zero once the current is steady'], [4, 'It is proportional to the current itself, not to how fast it changes']], [1, 3], { multi: true, label: 'Which statements about the self-induced emf are true?' })],
    steps: ($, f) => [String.raw`$|\mathcal{E}| = L\dfrac{\Delta I}{\Delta t} = ${texNum($.emf)}\ \text{V}$`],
    cases: [kase('hand', { L: 50, dI: 2, dt: 10 }, { emf: 10, dir: [1, 3] })],
  }),
  problem({
    ...E5, id: 'e5.49.rl', ch: '49', title: 'RL circuit growth and stored energy', kind: 'numeric', level: 2, topics: ['inductance', 'rl'],
    vars: { L: range(10, 1000, 10, 'mH', 1e-3), R: range(1, 100, 1, 'Ω'), E: range(3, 24, 1, 'V'), n: range(0.2, 4, 0.1, 'τ') },
    derive: ($) => {
      const tau = $.L / $.R;
      const If = $.E / $.R;
      return { tau, t: $.n * tau, I: If * (1 - Math.exp(-$.n)), U: 0.5 * $.L * If ** 2 };
    },
    text: (T, $, f) => `A ${T.L} mH inductor and a ${T.R} Ω resistor are switched onto a ${T.E} V battery at t = 0. Find the time constant, the current at t = ${f($.t)} s, and the energy stored once the current is steady.`,
    parts: [
      sym('tau_sym', 'L/R', { L: 'H', R: 'Ω' }, ($) => $.tau, { unit: 's', label: String.raw`$\tau$ as a formula` }),
      num('tau', ($) => $.tau, 's', { label: 'τ' }), num('I', ($) => $.I, 'A'), num('U', ($) => $.U, 'J')],
    hints: [String.raw`$I(t) = \dfrac{\varepsilon}{R}\left(1 - e^{-t/\tau}\right)$ with $\tau = L/R$, and $U = \tfrac{1}{2}LI^2$`],
    steps: ($, f) => [
      String.raw`$\tau = \dfrac{L}{R} = ${texNum($.tau)}\ \text{s}$`,
      String.raw`$I = ${texNum($.I)}\ \text{A}$`,
      String.raw`$U = \tfrac{1}{2}L\left(\dfrac{\varepsilon}{R}\right)^2 = ${texNum($.U)}\ \text{J}$`,
    ],
    cases: [kase('hand', { L: 200, R: 10, E: 12, n: 1 }, { tau: 0.02, I: 0.7585, U: 0.144 })],
  }),

  // ================================================================= 50
  problem({
    ...E5, id: 'e5.50.transformer', ch: '50', title: 'Ideal transformer', kind: 'numeric', topics: ['transformer'],
    vars: { Np: range(50, 2000, 50, 'turns'), Ns: range(10, 5000, 10, 'turns'), Vp: range(12, 480, 12, 'V'), Ip: range(0.1, 10, 0.1, 'A') },
    derive: ($) => ({ Vs: ($.Vp * $.Ns) / $.Np, Is: ($.Ip * $.Np) / $.Ns }),
    valid: ($) => $.Np !== $.Ns,
    text: (T) => `An ideal transformer has ${T.Np} primary turns and ${T.Ns} secondary turns. The primary has ${T.Vp} V (rms) and draws ${T.Ip} A. Find the secondary voltage and current. Is it step-up or step-down?`,
    parts: [
      sym('Vs_sym', 'Vp*Ns/Np', { Vp: 'V', Ns: '1', Np: '1' }, ($) => $.Vs, { unit: 'V', label: String.raw`$V_s$ as a formula` }),
      num('Vs', ($) => $.Vs, 'V'), num('Is', ($) => $.Is, 'A'), mc('type', [[1, 'Step-up'], [-1, 'Step-down']], ($) => ($.Ns > $.Np ? 1 : -1), { label: 'Type' })],
    steps: ($, f) => [
      String.raw`$V_s = V_p\dfrac{N_s}{N_p} = ${texNum($.Vs)}\ \text{V}$`,
      String.raw`Power in = power out, so $I_s = I_p\dfrac{N_p}{N_s} = ${texNum($.Is)}\ \text{A}$`,
    ],
    cases: [kase('hand', { Np: 200, Ns: 50, Vp: 120, Ip: 0.5 }, { Vs: 30, Is: 2, type: -1 })],
  }),
  problem({
    ...E5, id: 'e5.50.transmission', ch: '50', lab: 'power', title: 'Transmission line losses', kind: 'numeric', level: 2, topics: ['transmission', 'power'],
    vars: { P: range(50, 2000, 50, 'kW', 1e3), V: range(1, 500, 1, 'kV', 1e3), R: range(0.5, 20, 0.5, 'Ω') },
    derive: ($) => {
      const I = $.P / $.V;
      const loss = I * I * $.R;
      return { I, loss, pct: (100 * loss) / $.P };
    },
    valid: ($) => $.pct < 50,
    text: (T) => `A plant sends ${T.P} kW over lines with a total resistance of ${T.R} Ω, at ${T.V} kV. Find the line current, the power lost in the lines, and that loss as a percentage of the power sent.`,
    parts: [
      sym('loss_sym', 'P^2*R/V^2', { P: 'W', V: 'V', R: 'Ω' }, ($) => $.loss, { unit: 'W', label: String.raw`the line loss as a formula` }),
      num('I', ($) => $.I, 'A'),
      num('loss', ($) => $.loss, 'W'),
      num('pct', ($) => $.pct, '%'),
    ],
    hints: [String.raw`Use $I = P/V$ with the transmission voltage, not $V^2/R$.`],
    steps: ($, f) => [
      String.raw`$I = \dfrac{P}{V} = ${texNum($.I)}\ \text{A}$`,
      String.raw`$P_{\text{loss}} = I^2R = ${texNum($.loss)}\ \text{W}$ (${f($.pct)}%)`,
      String.raw`Doubling $V$ cuts the loss by a factor of 4.`,
    ],
    cases: [kase('hand', { P: 500, V: 10, R: 5 }, { I: 50, loss: 12500, pct: 2.5 })],
  }),
  problem({
    ...E5, id: 'e5.50.motor', ch: '50', lab: 'faraday', title: 'Back emf in a motor', kind: 'numeric', topics: ['motors'],
    vars: { V: range(12, 240, 12, 'V'), R: range(0.5, 10, 0.5, 'Ω'), f: range(0.5, 0.95, 0.05) },
    derive: ($) => ({ eb: $.f * $.V, I: ($.V - $.f * $.V) / $.R, I0: $.V / $.R }),
    text: (T, $, f) => `A DC motor with ${T.R} Ω windings runs on ${T.V} V. At full speed its back emf is ${f($.eb)} V. Find the running current and the current at the moment it starts.`,
    parts: [num('I', ($) => $.I, 'A', { label: 'Running' }), num('I0', ($) => $.I0, 'A', { label: 'At start-up' })],
    steps: ($, f) => [
      String.raw`$I = \dfrac{V - \mathcal{E}_b}{R} = ${texNum($.I)}\ \text{A}$`,
      String.raw`At start-up $\mathcal{E}_b = 0$, so $I = \dfrac{V}{R} = ${texNum($.I0)}\ \text{A}$`,
    ],
    cases: [kase('hand', { V: 120, R: 2, f: 100 / 120 }, { I: 10, I0: 60 })],
  }),
  problem({
    ...E5, id: 'e5.50.generator', ch: '50', lab: 'faraday', title: 'AC generator', kind: 'numeric', topics: ['generator'],
    vars: { N: range(10, 500, 10, 'turns'), B: range(0.05, 1, 0.05, 'T'), r: range(2, 30, 1, 'cm', 1e-2), f: range(10, 120, 10, 'Hz') },
    derive: ($) => {
      const A = Math.PI * $.r ** 2;
      const e0 = $.N * $.B * A * 2 * Math.PI * $.f;
      return { A, e0, erms: e0 / Math.SQRT2 };
    },
    text: (T) => `A generator coil has ${T.N} turns of radius ${T.r} cm and spins at ${T.f} Hz in a ${T.B} T field. Find the peak and rms emf.`,
    parts: [
      sym('e0_sym', '2*pi*f*N*B*pi*r^2', { N: '1', B: 'T', r: 'm', f: 'Hz' }, ($) => $.e0, { unit: 'V', label: String.raw`$\mathcal{E}_{\max}$ as a formula` }),
      num('e0', ($) => $.e0, 'V', { label: String.raw`$\mathcal{E}_{\max}$` }),
      num('erms', ($) => $.erms, 'V', { label: String.raw`$\mathcal{E}_{\text{rms}}$` }),
    ],
    steps: ($, f) => [
      String.raw`$\mathcal{E}_{\max} = NBA\omega = ${texNum($.e0)}\ \text{V}$`,
      String.raw`$\mathcal{E}_{\text{rms}} = \dfrac{\mathcal{E}_{\max}}{\sqrt{2}} = ${texNum($.erms)}\ \text{V}$`,
    ],
    sim: { scenario: 'generator', setup: (s, $) => void Object.assign(s, { N: Math.min($.N, 20), B: $.B, R: Math.min(0.5, $.r) }) },
    cases: [kase('hand', { N: 100, B: 0.5, r: 8, f: 60 }, { e0: 378.99, erms: 267.99 })],
  }),

  // ================================================================= 51
  problem({
    ...E5, id: 'e5.51.applications', ch: '51', lab: 'faraday', title: 'Where induction shows up', kind: 'conceptual', topics: ['applications'],
    vars: { ask: choice([1, 'Which device does NOT depend on electromagnetic induction?'], [2, 'Why does an induction cooktop heat an iron pan but not a glass one?'], [3, 'Why does a magnet fall slowly through a copper pipe?']) },
    text: (T) => T.ask,
    parts: [
      mc('ans', ($) => ({
        1: [[5, 'A transformer'], [6, 'An electric guitar pickup'], [1, 'An incandescent bulb on a battery'], [7, 'An induction cooktop']],
        2: [[4, 'Glass blocks magnetic fields'], [2, 'Eddy currents need a conductor in the changing field'], [8, 'Iron conducts heat better than glass']],
        3: [[9, 'Copper attracts the magnet, the way iron would'], [10, 'Air trapped in the pipe slows it down'], [3, 'Induced eddy currents make a field that opposes the motion']],
      })[$.ask], ($) => $.ask),
    ],
    steps: () => ['Generators, transformers, guitar pickups, cooktops, magnetic braking, and metal detectors all depend on a changing flux inducing currents in a conductor.'],
    cases: [kase('pipe', { ask: 3 }, { ans: 3 })],
  }),

  // ================================================================= 52
  problem({
    ...E5, id: 'e5.52.reactance-C', ch: '52', lab: 'ac', title: 'Capacitive reactance', kind: 'numeric', topics: ['ac', 'reactance'],
    vars: { C: range(5, 200, 5, 'μF', 1e-6), f: range(10, 400, 10, 'Hz'), V: range(10, 240, 10, 'V') },
    derive: ($) => {
      const XC = 1 / (2 * Math.PI * $.f * $.C);
      return { XC, I: $.V / XC };
    },
    text: (T) => `A ${T.C} μF capacitor is connected to a ${T.V} V (rms), ${T.f} Hz source. Find its reactance and the rms current.`,
    parts: [
      sym('XC_sym', '1/(2*pi*f*C)', { f: 'Hz', C: 'F' }, ($) => $.XC, { unit: 'Ω', label: String.raw`$X_C$ as a formula` }),
      num('XC', ($) => $.XC, 'Ω', { label: String.raw`$X_C$` }),
      num('I', ($) => $.I, 'A', { label: String.raw`$I_{\text{rms}}$` }),
      mc('f', [[1, String.raw`$X_C$ decreases`], [2, String.raw`$X_C$ increases`]], 1, { label: String.raw`If $f$ goes up…` }),
    ],
    steps: ($, f) => [
      String.raw`$X_C = \dfrac{1}{2\pi fC} = ${texNum($.XC)}\ \Omega$`,
      String.raw`$I = \dfrac{V}{X_C} = ${texNum($.I)}\ \text{A}$`,
    ],
    sim: {
      scenario: 'rc',
      setup: (s, $) => acSet(s, { hasL: false, hasC: true, C: $.C, f: $.f, Vrms: $.V, R: 1 }),
      read: (c) => ({ XC: c.ac.XC }),
    },
    cases: [kase('hand', { C: 40, f: 60, V: 120 }, { XC: 66.31, I: 1.8096, f: 1 })],
  }),
  problem({
    ...E5, id: 'e5.52.reactance-L', ch: '52', lab: 'ac', title: 'Inductive reactance', kind: 'numeric', topics: ['ac', 'reactance'],
    vars: { L: range(10, 400, 5, 'mH', 1e-3), f: range(10, 400, 10, 'Hz'), V: range(10, 240, 10, 'V') },
    derive: ($) => {
      const XL = 2 * Math.PI * $.f * $.L;
      return { XL, I: $.V / XL };
    },
    text: (T) => `A ${T.L} mH inductor is connected to a ${T.V} V (rms), ${T.f} Hz source. Find its reactance and the rms current.`,
    parts: [
      sym('XL_sym', '2*pi*f*L', { f: 'Hz', L: 'H' }, ($) => $.XL, { unit: 'Ω', label: String.raw`$X_L$ as a formula` }),
      num('XL', ($) => $.XL, 'Ω', { label: String.raw`$X_L$` }), num('I', ($) => $.I, 'A', { label: String.raw`$I_{\text{rms}}$` }), mc('f', [[1, String.raw`$X_L$ decreases`], [2, String.raw`$X_L$ increases`]], 2, { label: 'If f goes up…' })],
    steps: ($, f) => [
      String.raw`$X_L = 2\pi fL = ${texNum($.XL)}\ \Omega$`,
      String.raw`$I = \dfrac{V}{X_L} = ${texNum($.I)}\ \text{A}$`,
    ],
    sim: {
      scenario: 'rl',
      setup: (s, $) => acSet(s, { hasL: true, hasC: false, L: $.L, f: $.f, Vrms: $.V, R: 1 }),
      read: (c) => ({ XL: c.ac.XL }),
    },
    cases: [kase('hand', { L: 80, f: 60, V: 120 }, { XL: 30.159, I: 3.979, f: 2 })],
  }),
  problem({
    ...E5, id: 'e5.52.rlc', ch: '52', lab: 'ac', title: 'Series RLC circuit', kind: 'numeric', level: 3, topics: ['ac', 'impedance', 'phasors'],
    vars: { R: range(5, 200, 5, 'Ω'), L: range(10, 400, 5, 'mH', 1e-3), C: range(5, 200, 5, 'μF', 1e-6), f: range(20, 300, 10, 'Hz'), V: range(10, 240, 10, 'V') },
    derive: ($) => {
      const w = 2 * Math.PI * $.f;
      const XL = w * $.L;
      const XC = 1 / (w * $.C);
      const Z = Math.hypot($.R, XL - XC);
      const I = $.V / Z;
      const phi = (Math.atan2(XL - XC, $.R) * 180) / Math.PI;
      return { XL, XC, Z, I, phi, pf: $.R / Z, P: I * I * $.R, VR: I * $.R, VL: I * XL, VC: I * XC };
    },
    text: (T) => `A series circuit has R = ${T.R} Ω, L = ${T.L} mH and C = ${T.C} μF, driven at ${T.V} V (rms) and ${T.f} Hz. Find $X_L$, $X_C$, $Z$, $I_{\\text{rms}}$, the phase angle φ (voltage relative to current), the power factor, and the average power.`,
    parts: [
      sym('Z_sym', 'sqrt(R^2 + (2*pi*f*L - 1/(2*pi*f*C))^2)', { R: 'Ω', L: 'H', C: 'F', f: 'Hz' }, ($) => $.Z, { unit: 'Ω', label: String.raw`$Z$ as a formula` }),
      num('XL', ($) => $.XL, 'Ω', { label: String.raw`$X_L$` }),
      num('XC', ($) => $.XC, 'Ω', { label: String.raw`$X_C$` }),
      num('Z', ($) => $.Z, 'Ω'),
      num('I', ($) => $.I, 'A', { label: String.raw`$I_{\text{rms}}$` }),
      num('phi', ($) => $.phi, '°', { label: 'φ', abs: 0.5, tol: 0.01 }),
      num('P', ($) => $.P, 'W', { label: String.raw`$P_{\text{avg}}$` }),
      mc('lead', [[1, 'Current leads the voltage (capacitive)'], [-1, 'Current lags the voltage (inductive)'], [0, 'In phase']], ($) => (Math.abs($.XL - $.XC) < 1e-9 ? 0 : $.XL > $.XC ? -1 : 1), { label: 'Phase' }),
    ],
    hints: [String.raw`$Z = \sqrt{R^2 + (X_L - X_C)^2}$, $\tan\varphi = \dfrac{X_L - X_C}{R}$, and $P = I^2R = IV\cos\varphi$`],
    steps: ($, f) => [
      String.raw`$X_L = ${texNum($.XL)}\ \Omega$, $X_C = ${texNum($.XC)}\ \Omega$`,
      String.raw`$Z = ${texNum($.Z)}\ \Omega \;\Longrightarrow\; I = ${texNum($.I)}\ \text{A}$`,
      String.raw`$\varphi$ = ${f($.phi)}°, $\cos\varphi = ${texNum($.pf)}$`,
      String.raw`$P = I^2R = ${texNum($.P)}\ \text{W}$`,
    ],
    sim: {
      scenario: 'rlc',
      setup: (s, $) => acSet(s, { hasL: true, hasC: true, R: $.R, L: $.L, C: $.C, f: $.f, Vrms: $.V }),
      read: (c) => ({ XL: c.ac.XL, XC: c.ac.XC, Z: c.ac.Z, I: c.ac.Irms, phi: (c.ac.phi * 180) / Math.PI, P: c.ac.Pavg }),
    },
    cases: [kase('lab default', { R: 15, L: 80, C: 40, f: 60, V: 120 }, { XL: 30.159, XC: 66.315, Z: 39.143, I: 3.0657, phi: -67.47, P: 140.97, lead: 1 })],
  }),
  problem({
    ...E5, id: 'e5.52.resonance', ch: '52', lab: 'ac', title: 'Resonance', kind: 'numeric', level: 2, topics: ['ac', 'resonance'],
    vars: { R: range(5, 200, 5, 'Ω'), L: range(10, 400, 5, 'mH', 1e-3), C: range(5, 200, 5, 'μF', 1e-6), V: range(10, 240, 10, 'V') },
    derive: ($) => {
      const f0 = 1 / (2 * Math.PI * Math.sqrt($.L * $.C));
      const I = $.V / $.R;
      return { f0, I, VL: I * 2 * Math.PI * f0 * $.L };
    },
    text: (T) => `A series RLC circuit (R = ${T.R} Ω, L = ${T.L} mH, C = ${T.C} μF) is driven by a ${T.V} V (rms) source. Find the resonant frequency, the rms current at resonance, and the rms voltage across the inductor at resonance.`,
    parts: [
      sym('f0_sym', '1/(2*pi*sqrt(L*C))', { L: 'H', C: 'F' }, ($) => $.f0, { unit: 'Hz', label: String.raw`$f_0$ as a formula` }),
      num('f0', ($) => $.f0, 'Hz'),
      num('I', ($) => $.I, 'A'),
      num('VL', ($) => $.VL, 'V', { label: String.raw`$V_L$` }),
    ],
    hints: [String.raw`At resonance $X_L = X_C$, so $Z = R$. $V_L$ and $V_C$ can each be larger than the source voltage.`],
    steps: ($, f) => [
      String.raw`$f_0 = \dfrac{1}{2\pi\sqrt{LC}} = ${texNum($.f0)}\ \text{Hz}$`,
      String.raw`$I = \dfrac{V}{R} = ${texNum($.I)}\ \text{A}$`,
      String.raw`$V_L = IX_L = ${texNum($.VL)}\ \text{V}$`,
    ],
    sim: {
      scenario: 'res',
      setup(s, $) {
        acSet(s, { hasL: true, hasC: true, R: $.R, L: $.L, C: $.C, Vrms: $.V });
        s.f = 1 / (2 * Math.PI * Math.sqrt($.L * $.C));
      },
      read: (c) => ({ f0: c.ac.f0, I: c.ac.Irms, VL: c.ac.VL }),
    },
    cases: [kase('lab default', { R: 15, L: 80, C: 40, V: 120 }, { f0: 88.97, I: 8, VL: 357.77 })],
  }),
  problem({
    ...E5, id: 'e5.52.lead-lag', ch: '52', lab: 'ac', title: 'Does the current lead or lag?', kind: 'conceptual', topics: ['ac', 'phasors'],
    vars: { el: choice([1, 'only a capacitor'], [2, 'only an inductor'], [3, 'only a resistor'], [4, 'R and C in series'], [5, 'R and L in series']) },
    text: (T) => `An AC source drives a circuit containing ${T.el}. How does the current's phase compare with the source voltage's?`,
    parts: [mc('ans', [[1, 'Current leads by 90°'], [2, 'Current lags by 90°'], [3, 'In phase'], [4, 'Current leads by between 0° and 90°'], [5, 'Current lags by between 0° and 90°']], ($) => $.el)],
    steps: () => [String.raw`Capacitor: $I$ leads $V$ by $90^\circ$ ("ICE"). Inductor: $V$ leads $I$ by $90^\circ$ ("ELI"). Adding $R$ brings the phase angle somewhere between $0^\circ$ and $90^\circ$.`],
    sim: { scenario: 'rc' },
    cases: [kase('RL', { el: 5 }, { ans: 5 })],
  }),
];
