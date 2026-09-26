import * as THREE from 'three';
import { CSS2DObject } from 'three/addons/renderers/CSS2DRenderer.js';
import { defineLab } from './define.js';
import { M, Q, fatLine, updateFatLine, disposeTree, makeChargeTexture, markAnswer } from '../scene/manim.js';
import { rcState, rcCurves } from '../physics/rc.js';
import { kv, cells, qv, eq } from '../ui/shared.js';
import { fmtV, fmtI, fmtR, fmtC, fmtCharge, fmtEnergy, fmtP } from '../ui/format.js';

/**
 * RC circuits (Ch 44): a battery, a switch, a resistor and a capacitor — or a pair of capacitors,
 * side by side or one after the other — in one loop. Close the switch and watch the capacitor
 * charge; take the battery out and watch it discharge. Time runs from the instant the switch
 * closes, at a pace that fits five time constants into about six seconds, and can be scrubbed.
 *
 * The capacitor's plates fill with color as they take charge, the gold dots are the current
 * (their speed is I, so they slow to a stop as the capacitor fills), and the plot draws V_C and I
 * against t/τ with the present moment marked.
 */
const SCENARIOS = [
  { id: 'charge', name: 'Charging — one capacitor, τ = 1 s', mode: 'charge', net: 'one', E: 12, V0: 12, R: 1e4, C1: 1e-4, C2: 1e-4 },
  { id: 'discharge', name: 'Discharging — battery removed, τ = 1 s', mode: 'discharge', net: 'one', E: 12, V0: 12, R: 1e4, C1: 1e-4, C2: 1e-4 },
  { id: 'slow', name: 'A slow one — 400 kΩ and 50 μF, τ = 20 s', mode: 'charge', net: 'one', E: 24, V0: 24, R: 4e5, C1: 5e-5, C2: 5e-5 },
  { id: 'parallel', name: 'Two capacitors side by side (parallel)', mode: 'charge', net: 'parallel', E: 12, V0: 12, R: 1e5, C1: 2e-6, C2: 4e-6 },
  { id: 'series', name: 'Two capacitors one after the other (series)', mode: 'charge', net: 'series', E: 12, V0: 12, R: 1e5, C1: 2e-6, C2: 4e-6 },
];

/** Five time constants in about six seconds of real time; the clock stops at SPAN τ. */
const PACE = 5 / 6;
const SPAN = 6;

// Loop corners, in scene units.
const XL = -2.4;
const XR = 2.0;
const YT = 1.9;
const YB = -1.6;
const YM = (YT + YB) / 2;
const XP = 3.3; // the second branch, when the pair is in parallel
const SW = [-1.8, -1.0]; // switch pivot and contact along the top wire
const RES = [-0.3, 0.9]; // resistor along the top wire
const BAT_H = 0.16;
const GAP = 0.13; // half the gap between capacitor plates

function label(html, x, y, cls = 'circuit-label', anchorX = 0.5) {
  const el = document.createElement('div');
  el.className = cls;
  el.innerHTML = html;
  const o = new CSS2DObject(el);
  o.center.set(anchorX, 0.5);
  o.position.set(x, y, 0.02);
  return o;
}

function setHTML(obj, html) {
  if (obj.userData.html !== html) {
    obj.userData.html = html;
    obj.element.innerHTML = html;
  }
}

const fmtSec = (t) => {
  if (!Number.isFinite(t)) return '—';
  const a = Math.abs(t);
  if (a >= 100) return `${t.toFixed(0)} s`;
  if (a >= 1) return `${t.toPrecision(3)} s`;
  if (a >= 1e-3) return `${(t * 1e3).toPrecision(3)} ms`;
  return `${(t * 1e6).toPrecision(3)} μs`;
};

/** Where each capacitor sits: [x, y] of its gap's center. */
function capSpots(net) {
  if (net === 'series') return [[XR, YM + 0.4], [XR, YM - 1.0]];
  if (net === 'parallel') return [[XR, YM], [XP, YM]];
  return [[XR, YM]];
}

/**
 * The wires as polylines with the share of the current each carries, clockwise from the battery's
 * + end — the way conventional current runs while charging.
 */
function wirePaths(net) {
  const main = [
    [XL, YM + BAT_H],
    [XL, YT],
    [XR, YT],
  ];
  const back = [
    [XR, YB],
    [XL, YB],
    [XL, YM - BAT_H],
  ];
  const paths = [
    { pts: main, share: 'I' },
    { pts: back, share: 'I' },
  ];
  if (net === 'parallel') {
    paths.push({ pts: [[XR, YT], [XR, YB]], share: 'I1', skip: [YM] });
    paths.push({ pts: [[XR, YT], [XP, YT], [XP, YB], [XR, YB]], share: 'I2', skip: [YM] });
  } else if (net === 'series') {
    paths.push({ pts: [[XR, YT], [XR, YB]], share: 'I', skip: [YM + 0.4, YM - 1.0] });
  } else {
    paths.push({ pts: [[XR, YT], [XR, YB]], share: 'I', skip: [YM] });
  }
  return paths;
}

function buildCircuit(group, state) {
  const wire = { color: M.white, width: 2.5 };
  const add = (o) => (group.add(o), o);
  const parts = { plates: [], caps: capSpots(state.net) };
  // Left side: the battery, or a plain wire once it has been taken out.
  if (state.mode === 'charge') {
    add(fatLine([XL, YB, 0, XL, YM - BAT_H, 0], wire));
    add(fatLine([XL, YM + BAT_H, 0, XL, YT, 0], wire));
    add(fatLine([XL - 0.42, YM + BAT_H, 0, XL + 0.42, YM + BAT_H, 0], { color: M.blue, width: 3.5 }));
    add(fatLine([XL - 0.22, YM - BAT_H, 0, XL + 0.22, YM - BAT_H, 0], { color: M.blue, width: 8 }));
    add(label('+', XL - 0.32, YM + BAT_H + 0.2, 'circuit-sign'));
  } else {
    add(fatLine([XL, YB, 0, XL, YT, 0], wire));
  }
  // Top: switch, then resistor.
  add(fatLine([XL, YT, 0, SW[0], YT, 0], wire));
  parts.lever = add(fatLine([SW[0], YT, 0, SW[1], YT + 0.4, 0], { color: M.white, width: 3 }));
  add(fatLine([SW[1], YT, 0, RES[0], YT, 0], wire));
  const pts = [RES[0], YT, 0];
  for (let k = 0; k < 6; k++) pts.push(RES[0] + ((k + 0.5) / 6) * (RES[1] - RES[0]), YT + (k % 2 ? -0.17 : 0.17), 0);
  pts.push(RES[1], YT, 0);
  add(fatLine(pts, { color: M.green, width: 3 }));
  const right = state.net === 'parallel' ? XP : XR;
  add(fatLine([RES[1], YT, 0, right, YT, 0], wire));
  add(fatLine([right, YB, 0, XL, YB, 0], wire));
  // Right side: each capacitor's vertical wire, broken by its plates.
  const verticals = state.net === 'parallel' ? [XR, XP] : [XR];
  for (const x of verticals) {
    const gaps = parts.caps.filter(([cx]) => cx === x).map(([, cy]) => cy).sort((a, b) => b - a);
    let y = YT;
    for (const cy of gaps) {
      add(fatLine([x, y, 0, x, cy + GAP, 0], wire));
      y = cy - GAP;
    }
    add(fatLine([x, y, 0, x, YB, 0], wire));
  }
  // Each plate twice: a dull one always, and over it one that brightens with the charge. The bright
  // copy is on the answer layer — how full the plates look is an answer while a problem is open.
  for (const [cx, cy] of parts.caps) {
    const plate = (y, color, width) => fatLine([cx - 0.42, y, 0, cx + 0.42, y, 0], { color, width });
    add(plate(cy + GAP, M.greyDark, 4.5));
    add(plate(cy - GAP, M.greyDark, 4.5));
    const top = add(markAnswer(plate(cy + GAP, Q.C, 4.5)));
    const bot = add(markAnswer(plate(cy - GAP, Q.C, 4.5)));
    top.position.z = bot.position.z = 0.01;
    parts.plates.push([top, bot]);
  }
  return parts;
}

function makeDots(group, tex, paths) {
  const sets = [];
  for (const p of paths) {
    const segs = [];
    let len = 0;
    for (let i = 1; i < p.pts.length; i++) {
      const [ax, ay] = p.pts[i - 1];
      const [bx, by] = p.pts[i];
      const l = Math.hypot(bx - ax, by - ay);
      segs.push({ ax, ay, ux: (bx - ax) / l, uy: (by - ay) / l, l, s0: len });
      len += l;
    }
    const n = Math.max(3, Math.round(len / 0.42));
    const dots = [];
    for (let k = 0; k < n; k++) {
      const s = markAnswer(new THREE.Sprite(new THREE.SpriteMaterial({ map: tex, transparent: true, depthWrite: false, toneMapped: false })));
      s.scale.setScalar(0.17);
      s.renderOrder = 3;
      group.add(s);
      dots.push(s);
    }
    sets.push({ ...p, segs, len, dots, offset: 0 });
  }
  return sets;
}

function pointAt(set, d) {
  for (const g of set.segs) {
    if (d <= g.s0 + g.l + 1e-9) {
      const u = d - g.s0;
      return [g.ax + g.ux * u, g.ay + g.uy * u];
    }
  }
  const g = set.segs[set.segs.length - 1];
  return [g.ax + g.ux * g.l, g.ay + g.uy * g.l];
}

export default defineLab({
  id: 'rc',
  exam: 'e4',
  title: 'RC',
  hint: 'Close the switch — the capacitor charges on a clock set by τ = RC',
  orbit: false,
  camera: { pos: new THREE.Vector3(0.5, 0.2, 12.5), target: new THREE.Vector3(0.5, 0.2, 0) },
  keys: { r: 'reset', R: 'reset' },
  scenarios: SCENARIOS,
  defaultState() {
    const s = SCENARIOS[0];
    return { scenarioId: s.id, mode: s.mode, net: s.net, E: s.E, V0: s.V0, R: s.R, C1: s.C1, C2: s.C2, t: 0, closed: false, show: {}, anim: { playing: false, i: 0 } };
  },
  applyScenario(id, state) {
    const sc = SCENARIOS.find((s) => s.id === id) || SCENARIOS[0];
    Object.assign(state, { scenarioId: sc.id, mode: sc.mode, net: sc.net, E: sc.E, V0: sc.V0, R: sc.R, C1: sc.C1, C2: sc.C2, t: 0, closed: false });
    if (state.anim) state.anim.playing = false;
  },
  controls() {
    const logSlider = (id, text, min, max, scale, unit, cls = '') => `
          <label class="field" id="wrap-${id}">
            <span>${text}</span>
            <div class="slider-row">
              <input type="range" id="${id}" min="${min}" max="${max}" step="0.01" data-log="10" data-box-scale="${scale}" data-box-unit="${unit}" />
              <span class="mono val ${cls}" id="${id}-val"></span>
            </div>
          </label>`;
    return `
        <div class="lab-block">
          <div class="seg" id="rc-mode">
            <button type="button" data-mode="charge">Charging (battery)</button>
            <button type="button" data-mode="discharge">Discharging (no battery)</button>
          </div>
          <div class="seg" id="rc-net">
            <button type="button" data-net="one">One C</button>
            <button type="button" data-net="parallel">Two, parallel</button>
            <button type="button" data-net="series">Two, series</button>
          </div>
          <label class="field" id="wrap-rc-E">
            <span>Battery ε</span>
            <div class="slider-row">
              <input type="range" id="rc-E" min="1" max="48" step="0.5" />
              <span class="mono val qV" id="rc-E-val"></span>
            </div>
          </label>
          <label class="field" id="wrap-rc-V0">
            <span>Starting voltage V₀</span>
            <div class="slider-row">
              <input type="range" id="rc-V0" min="1" max="48" step="0.5" />
              <span class="mono val qV" id="rc-V0-val"></span>
            </div>
          </label>
          ${logSlider('rc-R', 'Resistance R', 0, 6.3, 1e3, 'kΩ', 'qR')}
          ${logSlider('rc-C1', 'Capacitance C₁', -7, -2.7, 1e-6, 'μF', 'qC')}
          ${logSlider('rc-C2', 'Capacitance C₂', -7, -2.7, 1e-6, 'μF', 'qC')}
          <div class="row wrap rc-clock">
            <button type="button" class="btn" id="rc-play-close">Close the switch</button>
            <button type="button" class="btn ghost" id="rc-play">Pause</button>
            <button type="button" class="btn ghost" id="rc-play-open">Open & reset</button>
          </div>
          <label class="field tell" id="wrap-rc-t">
            <span>Time since the switch closed, in τ</span>
            <div class="slider-row">
              <input type="range" id="rc-t" min="0" max="${SPAN}" step="0.01" />
              <span class="mono val" id="rc-t-val"></span>
            </div>
          </label>
          <p class="tiny">The gold dots are the current: fast at first, slowing to a stop as the capacitor fills. The plates fill with color as they take charge.</p>
        </div>`;
  },
  bind(api) {
    const $ = (id) => document.getElementById(id);
    const set = (key, fn) => (e) => {
      api.slice()[key] = fn(Number(e.target.value));
      api.bump();
    };
    $('rc-E').addEventListener('input', set('E', (v) => v));
    $('rc-V0').addEventListener('input', set('V0', (v) => v));
    $('rc-R').addEventListener('input', set('R', (v) => 10 ** v));
    $('rc-C1').addEventListener('input', set('C1', (v) => 10 ** v));
    $('rc-C2').addEventListener('input', set('C2', (v) => 10 ** v));
    $('rc-mode').addEventListener('click', (e) => {
      const b = e.target.closest('[data-mode]');
      if (!b) return;
      const s = api.slice();
      s.mode = b.dataset.mode;
      s.t = 0;
      s.closed = false;
      api.bump();
    });
    $('rc-net').addEventListener('click', (e) => {
      const b = e.target.closest('[data-net]');
      if (!b) return;
      api.slice().net = b.dataset.net;
      api.bump();
    });
    // Running the clock is using the setup, not changing it: the preset keeps its name. (A problem
    // still hears about it — its numbers were for one moment.) bump() pauses the clock, so the
    // buttons set `playing` after it.
    const clock = (s, fn) => {
      const wasCustom = s.custom;
      fn();
      api.bump();
      s.custom = wasCustom;
    };
    // (Ids with "play" in them, and this stopPropagation, keep the HUD from filing clock use as a
    // hand edit of the setup.)
    $('wrap-rc-t').addEventListener('input', (e) => e.stopPropagation());
    $('rc-t').addEventListener('input', (e) => {
      const s = api.slice();
      const r = rcState(s);
      clock(s, () => {
        s.t = Number(e.target.value) * r.tau;
        s.closed = true;
      });
    });
    $('rc-play-close').addEventListener('click', () => {
      const s = api.slice();
      clock(s, () => {
        s.t = 0;
        s.closed = true;
      });
      s.anim.playing = true;
    });
    $('rc-play').addEventListener('click', () => {
      const s = api.slice();
      const r = rcState(s);
      const wasPlaying = s.anim.playing;
      clock(s, () => {
        if (!s.closed || r.n >= SPAN - 1e-6) {
          s.t = 0;
          s.closed = true;
        }
      });
      s.anim.playing = !wasPlaying;
    });
    $('rc-play-open').addEventListener('click', () => {
      const s = api.slice();
      clock(s, () => {
        s.t = 0;
        s.closed = false;
      });
    });
  },
  syncControls(state) {
    const $ = (id) => document.getElementById(id);
    const put = (id, v, text) => {
      if (document.activeElement !== $(id)) $(id).value = v;
      $(`${id}-val`).textContent = text;
    };
    document.querySelectorAll('#rc-mode [data-mode]').forEach((b) => b.classList.toggle('active', b.dataset.mode === state.mode));
    document.querySelectorAll('#rc-net [data-net]').forEach((b) => b.classList.toggle('active', b.dataset.net === state.net));
    put('rc-E', state.E, fmtV(state.E));
    put('rc-V0', state.V0, fmtV(state.V0));
    put('rc-R', Math.log10(state.R), fmtR(state.R));
    put('rc-C1', Math.log10(state.C1), fmtC(state.C1));
    put('rc-C2', Math.log10(state.C2), fmtC(state.C2));
    $('wrap-rc-E').hidden = state.mode !== 'charge';
    $('wrap-rc-V0').hidden = state.mode !== 'discharge';
    $('wrap-rc-C2').hidden = state.net === 'one';
    const r = rcState(state);
    put('rc-t', Math.min(SPAN, r.n), state.closed ? fmtSec(state.t) : 'open');
    $('rc-play').textContent = state.anim?.playing ? 'Pause' : 'Play';
  },
  tick(dt, state) {
    if (!state.anim?.playing || !state.closed) return false;
    const r = rcState(state);
    state.t += dt * PACE * r.tau;
    if (state.t >= SPAN * r.tau) {
      state.t = SPAN * r.tau;
      state.anim.playing = false;
    }
    return true;
  },
  init(ctx) {
    const group = new THREE.Group();
    ctx.scene.add(group);
    const circuit = new THREE.Group();
    group.add(circuit);
    const labels = {
      // Its own row near the top: on a phone the loop is too narrow for two labels side by side.
      bat: label('', XL + 0.3, YM + 1.15, 'circuit-label', 0),
      sw: label('', (SW[0] + SW[1]) / 2, YT + 0.78),
      R: label('', (RES[0] + RES[1]) / 2, YT + 0.55),
      I: label('', (RES[0] + RES[1]) / 2, YT + 1.0),
      C1: label('', XR + 0.62, YM, 'circuit-label', 0),
      C2: label('', XR + 0.62, YM, 'circuit-label', 0),
      t: label('', (XL + XR) / 2, YB - 0.62),
    };
    Object.values(labels).forEach((l) => group.add(l));
    group.visible = false;
    return { group, circuit, labels, dotTex: makeChargeTexture(Q.I, 0), key: '', parts: null, dots: [], color: new THREE.Color() };
  },
  enter(ctx, handle) {
    handle.group.visible = true;
  },
  exit(ctx, handle) {
    handle.group.visible = false;
  },
  recompute(state, computed) {
    computed.rc = rcState(state);
  },
  syncViews(state, computed, ctx) {
    const h = ctx.handle;
    const r = computed.rc;
    if (!h || !r) return;
    ctx.grid.visible = false;
    const key = `${state.mode}|${state.net}`;
    if (key !== h.key) {
      h.key = key;
      while (h.circuit.children.length) {
        const ch = h.circuit.children[0];
        h.circuit.remove(ch);
        disposeTree(ch);
      }
      h.parts = buildCircuit(h.circuit, state);
      h.dots = makeDots(h.circuit, h.dotTex, wirePaths(state.net));
    }
    // The switch: open, the lever stands up off its contact.
    updateFatLine(h.parts.lever, state.closed ? [SW[0], YT, 0, SW[1], YT, 0] : [SW[0], YT, 0, SW[1] - 0.08, YT + 0.42, 0]);
    // Plates fill from dull to bright purple (the capacitor colour) with their share of the full charge.
    const charges = [r.Q1, r.Q2];
    h.parts.plates.forEach(([top, bot], i) => {
      const full = r.two ? (state.net === 'series' ? r.Qmax : (i ? state.C2 : state.C1) * r.src) : r.Qmax;
      const f = Math.min(1, Math.abs(charges[i]) / Math.max(full, 1e-30));
      h.color.setHex(M.greyDark).lerp(new THREE.Color(Q.C), 0.25 + 0.75 * f);
      top.material.color.copy(h.color);
      bot.material.color.copy(h.color);
    });

    const L = h.labels;
    L.bat.visible = state.mode === 'charge';
    setHTML(L.bat, qv('qV', `ε = ${fmtV(state.E)}`));
    setHTML(L.sw, `<span class="lbl-name">S</span> <small>${state.closed ? 'closed' : 'open'}</small>`);
    setHTML(L.R, qv('qR', `<i>R</i> = ${fmtR(state.R)}`));
    setHTML(L.I, state.closed ? qv('qI', `<span class="lbl-name"><i>I</i></span> = <span class="lbl-val">${fmtI(r.I)}</span>`) : '');
    const spots = capSpots(state.net);
    const capHTML = (i) => {
      const name = r.two ? `C<sub>${i + 1}</sub>` : 'C';
      const Ci = i ? state.C2 : state.C1;
      const start = state.mode === 'discharge' && !r.two ? `<small class="qV">charged to V₀ = ${fmtV(state.V0)}</small>` : '';
      // Short enough for a phone's narrow loop; the charges are in the equation panel.
      return `${qv('qC', `<i>${name}</i> = ${fmtC(Ci)}`)}${start}<small>V = ${fmtV(i ? r.V2 : r.V1)}</small>`;
    };
    // Capacitor labels sit inside the loop, right-aligned against their capacitor, so a phone's
    // narrow screen doesn't cut them off.
    const place = (lab, [x, y], where) => {
      const below = where === 'below';
      lab.position.set(below ? x : x - 0.62, below ? YB - 0.62 : y, 0.02);
      lab.center.set(below ? 0.5 : 1, 0.5);
      lab.element.classList.toggle('right-text', !below);
    };
    place(L.C1, spots[0], 'inside');
    setHTML(L.C1, capHTML(0));
    L.C2.visible = r.two;
    if (r.two) {
      // The parallel pair's second capacitor has no room beside it: its label goes under the circuit.
      place(L.C2, spots[1], state.net === 'series' ? 'inside' : 'below');
      setHTML(L.C2, capHTML(1));
    }
    if (state.mode === 'discharge' && r.two) setHTML(L.t, `<small class="qV">charged to V₀ = ${fmtV(state.V0)}</small> ${state.closed ? `t = ${fmtSec(state.t)}` : ''}`);
    else setHTML(L.t, state.closed ? `t = ${fmtSec(state.t)} <small>(${r.n.toFixed(2)} τ)</small>` : '<small>switch open — close it to start the clock</small>');
  },
  afterFrame(dt, state, computed, ctx) {
    const h = ctx.handle;
    const r = computed.rc;
    if (!h || !r || !h.dots) return;
    // Current runs clockwise while charging (out of the battery's + end), the other way discharging.
    const dir = r.charging ? 1 : -1;
    const shares = { I: 1, I1: r.two ? state.C1 / (state.C1 + state.C2) : 1, I2: r.two ? state.C2 / (state.C1 + state.C2) : 0 };
    const frac = r.Imax > 0 ? r.I / r.Imax : 0;
    for (const set of h.dots) {
      const share = state.net === 'parallel' ? shares[set.share] : 1;
      const speed = frac * share;
      set.offset = (set.offset + dt * 1.8 * speed * dir + set.len) % set.len;
      const gap = set.len / set.dots.length;
      set.dots.forEach((s, k) => {
        const d = (k * gap + set.offset) % set.len;
        const [x, y] = pointAt(set, d);
        const inGap = (set.skip || []).some((cy) => Math.abs(y - cy) < GAP + 0.08 && set.segs.some((g) => Math.abs(g.ux) < 0.5 && Math.abs(x - g.ax) < 1e-6));
        s.visible = speed > 1e-3 && !inGap;
        s.position.set(x, y, 0.03);
      });
    }
  },
  law(state, computed) {
    const r = computed.rc;
    const lines = [];
    if (r?.two) lines.push(state.net === 'parallel' ? String.raw`C_{\text{eq}} = C_1 + C_2` : String.raw`\dfrac{1}{C_{\text{eq}}} = \dfrac{1}{C_1} + \dfrac{1}{C_2}`);
    const C = r?.two ? 'C_{\\text{eq}}' : 'C';
    lines.push(String.raw`\tau = \qR ${C}`);
    if (state.mode === 'charge') {
      lines.push(String.raw`q(t) = ${C}\,\qV\big(1 - e^{-t/\tau}\big)\qquad \qI(t) = \dfrac{\qV}{\qR}\,e^{-t/\tau}`);
      lines.push(String.raw`\text{loop: }\ \qV - \qI\qR - \dfrac{q}{${C}} = 0`);
    } else {
      lines.push(String.raw`q(t) = ${C}\,V_0\,e^{-t/\tau}\qquad \qI(t) = \dfrac{V_0}{\qR}\,e^{-t/\tau}`);
      lines.push(String.raw`\text{loop: }\ \dfrac{q}{${C}} - \qI\qR = 0`);
    }
    return lines;
  },
  liveRows(state, computed) {
    const r = computed.rc;
    if (!r) return '';
    const rows = [];
    if (r.two) rows.push(kv(state.net === 'parallel' ? String.raw`$C_{\text{eq}} = C_1 + C_2$` : String.raw`$C_{\text{eq}} = C_1C_2/(C_1 + C_2)$`, fmtC(r.Ceq)));
    rows.push(
      kv(String.raw`$\tau = RC$`, fmtSec(r.tau)),
      kv(String.raw`$t$`, r.closed ? `${fmtSec(state.t)} = ${r.n.toFixed(2)}τ` : 'switch open'),
      kv(String.raw`$q$`, fmtCharge(r.q)),
      kv(String.raw`$q/q_{\max}$`, `${((100 * r.q) / Math.max(r.Qmax, 1e-30)).toFixed(1)}%`),
      kv(String.raw`$V_C = q/C$`, qv('qV', fmtV(r.VC))),
      kv(String.raw`$V_R = IR$`, qv('qV', fmtV(r.VR))),
      kv(String.raw`$I$`, qv('qI', fmtI(r.I))),
    );
    if (r.two) {
      rows.push(kv(String.raw`$C_1$: $q_1$, $V_1$`, `${fmtCharge(r.Q1)} · ${fmtV(r.V1)}`), kv(String.raw`$C_2$: $q_2$, $V_2$`, `${fmtCharge(r.Q2)} · ${fmtV(r.V2)}`));
    }
    rows.push(
      kv(state.mode === 'charge' ? String.raw`$\varepsilon - V_R - V_C$` : String.raw`$V_C - V_R$`, `${Math.abs(r.loop) < 1e-9 * Math.max(1, r.src) ? '0' : r.loop.toExponential(1)} V`),
      kv(String.raw`$U = \tfrac12 CV_C^2$`, fmtEnergy(r.U)),
      kv(String.raw`$P_R = I^2R$`, qv('qP', fmtP(r.PR))),
    );
    return rows.join('');
  },
  readout(state, computed) {
    const r = computed.rc;
    if (!r) return '';
    return cells([
      [String.raw`$\tau$`, fmtSec(r.tau), ''],
      [String.raw`$q$`, fmtCharge(r.q), ''],
      [String.raw`$I$`, fmtI(r.I), 'qI'],
      [String.raw`$V_C$`, fmtV(r.VC), 'qV'],
    ]);
  },
  plot(state, computed) {
    const r = computed.rc;
    return r ? { type: 'rc', curves: rcCurves(r, SPAN), n: r.closed ? Math.min(SPAN, r.n) : null, charging: r.charging } : null;
  },
  coach(state, computed) {
    const r = computed.rc;
    if (!r) return { title: 'RC circuits', body: [eq(String.raw`\tau = RC`)] };
    const tau = fmtSec(r.tau);
    if (!r.closed) {
      return state.mode === 'charge'
        ? { title: 'Switch open — nothing flows yet', body: `Close the switch. At that instant the empty capacitor has $V_C = 0$, so the loop rule puts the whole battery across the resistor: $I = \\varepsilon/R$ = ${fmtI(r.Imax)}, the largest current it will ever carry. The clock it charges on is $\\tau = RC$ = ${tau}.` }
        : { title: 'Charged, switch open', body: `The capacitor holds $q_0 = CV_0$ = ${fmtCharge(r.Qmax)}. Close the switch and it drives current backward through the resistor, losing charge on the same $\\tau$ = ${tau} clock it would charge on.` };
    }
    if (r.n < 0.05) {
      return state.mode === 'charge'
        ? { title: 'The first instant — the capacitor acts like a wire', body: `$V_C = 0$, so $V_R = \\varepsilon$ and $I = \\varepsilon/R$ = ${fmtI(r.Imax)}. A bulb in place of $R$ would be at its brightest now.` }
        : { title: 'The first instant', body: `With no battery, the loop rule says $V_R = V_C$: the full $V_0$ is across the resistor, so $I = V_0/R$ = ${fmtI(r.Imax)}.` };
    }
    if (r.n > 4.6) {
      return state.mode === 'charge'
        ? { title: 'Long after — the capacitor acts like a gap', body: `After about five time constants the capacitor is over 99% full: $V_C \\approx \\varepsilon$, so $V_R \\approx 0$ and the current has stopped. A charged capacitor blocks dc.` }
        : { title: 'Long after — discharged', body: 'After about five time constants less than 1% of the charge is left, and the current has died away with it.' };
    }
    const pct = state.mode === 'charge' ? (100 * (1 - r.k)).toFixed(0) : (100 * r.k).toFixed(0);
    return {
      title: `$t$ = ${r.n.toFixed(2)} τ — ${pct}% ${state.mode === 'charge' ? 'charged' : 'of the charge left'}`,
      body: [
        state.mode === 'charge'
          ? `Every time constant the charge closes 63% of the gap that is left: 63% at $t = \\tau$, 86% at $2\\tau$, 95% at $3\\tau$. The current is falling on the same curve, because $V_R = \\varepsilon - V_C$ shrinks as $V_C$ grows.`
          : 'Every time constant the charge falls to 37% of what it was: 37% at $t = \\tau$, 14% at $2\\tau$, 5% at $3\\tau$.',
        r.two
          ? state.net === 'parallel'
            ? 'Side by side, the two capacitors share one voltage and together store more: $C_{\\text{eq}} = C_1 + C_2$, so they charge more slowly.'
            : 'One after the other, they carry the same charge and split the voltage — the smaller capacitor takes the larger share. $C_{\\text{eq}}$ is less than either, so they charge faster.'
          : `$\\tau = RC$ = ${tau}: bigger $R$ lets charge in more slowly, bigger $C$ has more to fill.`,
      ],
    };
  },
});
