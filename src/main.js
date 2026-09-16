import 'katex/dist/katex.min.css';
import * as THREE from 'three';
import { createScene } from './scene/createScene.js';
import { M } from './scene/manim.js';
import { ChargeView } from './scene/charges.js';
import { PatchView } from './scene/patches.js';
import { ArrowView } from './scene/arrows.js';
import { FieldLineView } from './scene/fieldLines.js';
import { ProbeView } from './scene/probe.js';
import { ForceView } from './scene/forces.js';
import { DistributionView } from './scene/distribution.js';
import { CSS2DObject } from 'three/addons/renderers/CSS2DRenderer.js';
import { createHUD } from './ui/hud.js';
import { applyScenario, newCharge, SCENARIOS } from './data/scenarios.js';
import { computeGauss } from './physics/flux.js';
import { fieldAt, contributionsAt, forceOn } from './physics/field.js';
import { coach } from './physics/coach.js';
import {
  linePerpField,
  ringAxisField,
  linePerpPotential,
  ringAxisPotential,
} from './physics/analytic.js';
import { potentialAt, potentialContributions, potentialEnergy, workByField, gradientCheck } from './physics/potential.js';
import { capacitorState } from './physics/capacitor.js';
import { ohmState, powerState } from './physics/circuit.js';
import { EquipotentialView } from './scene/equipotentials.js';
import { CapacitorView } from './scene/capacitor.js';
import { CircuitView } from './scene/circuit.js';
import { UNITS_PER_METER } from './physics/constants.js';
import { fmtV } from './ui/format.js';

const canvas = document.getElementById('c');
const { renderer, scene, camera, controls, labels, grid } = createScene(canvas);

const chargeView = new ChargeView(scene);
const patchView = new PatchView(scene);
const arrowView = new ArrowView(scene);
const lineView = new FieldLineView(scene);
const probeView = new ProbeView(scene);
const forceView = new ForceView(scene);
const distView = new DistributionView(scene);
const equipotView = new EquipotentialView(scene);
const capView = new CapacitorView(scene);
const circuitView = new CircuitView(scene);

const pathAEl = document.createElement('div');
pathAEl.className = 'probe-label';
pathAEl.textContent = 'A';
const pathALabel = new CSS2DObject(pathAEl);
const pathAMesh = new THREE.Mesh(
  new THREE.SphereGeometry(0.09, 20, 14),
  new THREE.MeshBasicMaterial({ color: M.gold, toneMapped: false }),
);
pathALabel.position.set(0, 0.35, 0);
pathAMesh.add(pathALabel);
scene.add(pathAMesh);

const CAM = {
  gauss: { pos: new THREE.Vector3(7.2, 4.8, 11.4), target: new THREE.Vector3(0, 0, 0) },
  field: { pos: new THREE.Vector3(5.8, 4.4, 9.6), target: new THREE.Vector3(0, 0, 0) },
  integral: { pos: new THREE.Vector3(2.4, 5.2, 11.2), target: new THREE.Vector3(0, 1.4, 0) },
  force: { pos: new THREE.Vector3(5.6, 3.4, 8.8), target: new THREE.Vector3(0, 0, 0) },
  potential: { pos: new THREE.Vector3(5.6, 5.2, 9.8), target: new THREE.Vector3(0, 0, 0) },
  capacitor: { pos: new THREE.Vector3(0.2, 2.2, 6.4), target: new THREE.Vector3(0, 0, 0) },
  ohm: { pos: new THREE.Vector3(0, 0.35, 12), target: new THREE.Vector3(0, 0.35, 0) },
  power: { pos: new THREE.Vector3(0, 0.35, 12), target: new THREE.Vector3(0, 0.35, 0) },
};

const state = {
  lab: 'gauss',
  scenarioId: 'center',
  charges: [],
  surface: { type: 'sphere', R: 0.45, L: 0.55, tilt: 0, origin: { x: 0, y: 0, z: 0 } },
  extraE: { x: 0, y: 0, z: 0 },
  show: { flux: true, E: false, nHat: false, lines: false, forces: false, equipot: true },
  probe: { x: 0.5, y: 0.18, z: 0 },
  integral: { kind: 'rod', L: 0.8, lambda: 2e-6, d: 0.35, n: 20, Q: 2.5e-6, a: 0.32, y: 0.38, quantity: 'E' },
  qTest: 1e-6,
  pathA: { x: 0.7, y: 0, z: 0 },
  cap: { A: 0.04, d: 0.05, V: 12, Q0: 8.496e-11, mode: 'battery', dielectric: 'air', inserted: true, fill: 1 },
  ohm: { material: 'copper', L: 2, A: 1e-6, V: 12, T: 20 },
  power: { mode: 'dc', V: 120, Vrms: 120, R: 240, f: 60 },
  selectedId: null,
  anim: { playing: false, i: 0 },
  dirty: true,
};

const computed = {
  gauss: null,
  probeE: null,
  contrib: [],
  selectedForce: null,
  integral: null,
  coach: null,
};

applyScenario('gauss', 'center', state);

const hud = createHUD({
  setLab,
  setScenario,
  setSurfaceType,
  setR: (R) => {
    state.surface.R = R;
    bump();
  },
  setL: (L) => {
    state.surface.L = L;
    bump();
  },
  setTilt: (tilt) => {
    state.surface.tilt = tilt;
    bump();
  },
  addCharge,
  deleteSelected,
  setChargeQ,
  selectCharge: (id) => {
    state.selectedId = id;
    bump(false);
  },
  toggleShow,
  setIntegralKind,
  setIntegral,
  toggleSweep,
  resetCamera,
  setQTest: (q) => {
    state.qTest = q;
    bump(false);
  },
  setCap: (key, value) => {
    if (key === 'mode' && value === 'isolated') {
      state.cap.Q0 = capacitorState({ ...state.cap, mode: 'battery' }).Q;
    }
    state.cap[key] = value;
    bump();
  },
  setOhm: (key, value) => {
    state.ohm[key] = value;
    if (key !== 'Rlock') state.ohm.Rlock = undefined;
    bump();
  },
  setPower: (key, value) => {
    state.power[key] = value;
    bump();
  },
});

function bump(physics = true) {
  state.dirty = true;
  if (physics) state.anim.playing = false;
}

function setLab(lab) {
  if (state.lab === lab) return;
  state.lab = lab;
  const first = SCENARIOS[lab][0];
  applyScenario(lab, first.id, state);
  goCamera(lab);
  bump();
}

function setScenario(id) {
  applyScenario(state.lab, id, state);
  goCamera(state.lab);
  bump();
}

function setSurfaceType(type) {
  state.surface.type = type;
  if (type === 'pillbox' && state.surface.L > 0.35) state.surface.L = 0.18;
  if (type === 'cylinder' && state.surface.L < 0.3) state.surface.L = 0.55;
  bump();
}

function addCharge(sign) {
  const c = newCharge(sign, state.charges);
  state.charges.push(c);
  state.selectedId = c.id;
  bump();
}

function deleteSelected() {
  if (state.selectedId == null) return;
  state.charges = state.charges.filter((c) => c.id !== state.selectedId);
  state.selectedId = state.charges[0]?.id ?? null;
  bump();
}

function setChargeQ(id, q) {
  const c = state.charges.find((x) => x.id === id);
  if (!c) return;
  c.q = q;
  bump();
}

function toggleShow(key) {
  state.show[key] = !state.show[key];
  state.dirty = true;
}

function setIntegralKind(kind) {
  state.integral.kind = kind;
  state.scenarioId = kind === 'ring' ? 'ring' : 'rod';
  const sc = SCENARIOS.integral.find((s) => s.id === state.scenarioId);
  if (sc?.integral) Object.assign(state.integral, sc.integral, { kind });
  state.anim = { playing: false, i: 0 };
  bump();
}

function setIntegral(key, value) {
  state.integral[key] = value;
  bump();
}

function toggleSweep() {
  if (state.lab !== 'gauss' && state.lab !== 'integral') return;
  if (state.anim.playing) {
    state.anim.playing = false;
    state.anim.i = 1e9;
  } else {
    state.anim.playing = true;
    state.anim.i = 0;
  }
  state.dirty = true;
}

// Manim-style camera move: eased interpolation instead of a hard cut.
let camTween = null;
controls.addEventListener('start', () => {
  camTween = null;
});

function goCamera(lab) {
  const c = CAM[lab];
  camTween = {
    t: 0,
    fromPos: camera.position.clone(),
    fromTarget: controls.target.clone(),
    toPos: c.pos,
    toTarget: c.target,
  };
}

function stepCamera(dt) {
  if (!camTween) return;
  camTween.t = Math.min(1, camTween.t + dt / 0.9);
  const t = camTween.t;
  const k = t * t * t * (t * (6 * t - 15) + 10);
  camera.position.lerpVectors(camTween.fromPos, camTween.toPos, k);
  controls.target.lerpVectors(camTween.fromTarget, camTween.toTarget, k);
  if (t >= 1) camTween = null;
}

function resetCamera() {
  goCamera(state.lab);
}

const raycaster = new THREE.Raycaster();
const pointer = new THREE.Vector2();
const plane = new THREE.Plane();
const hit = new THREE.Vector3();
const nrm = new THREE.Vector3();
let drag = null;
let down = null;

function setPointer(e) {
  pointer.x = (e.clientX / window.innerWidth) * 2 - 1;
  pointer.y = -(e.clientY / window.innerHeight) * 2 + 1;
}

function fromWorld(v) {
  return { x: v.x / UNITS_PER_METER, y: v.y / UNITS_PER_METER, z: v.z / UNITS_PER_METER };
}

function clampPos(p) {
  p.x = Math.max(-1.35, Math.min(1.35, p.x));
  p.y = Math.max(-1.1, Math.min(1.1, p.y));
  p.z = Math.max(-1.35, Math.min(1.35, p.z));
}

canvas.addEventListener('pointerdown', (e) => {
  if (e.button !== 0) return;
  setPointer(e);
  raycaster.setFromCamera(pointer, camera);
  const id = chargeView.pick(raycaster);
  down = { x: e.clientX, y: e.clientY, id, moved: false };
  if (id != null) {
    const c = state.charges.find((x) => x.id === id);
    drag = { id, shift: e.shiftKey, y0: c.y, z0: c.z };
    state.selectedId = id;
    controls.enabled = false;
  }
});

window.addEventListener('pointermove', (e) => {
  if (!down) return;
  if (Math.hypot(e.clientX - down.x, e.clientY - down.y) > 4) down.moved = true;
  if (!drag) return;
  setPointer(e);
  raycaster.setFromCamera(pointer, camera);
  const c = state.charges.find((x) => x.id === drag.id);
  if (!c) return;
  if (drag.shift || e.shiftKey) {
    nrm.set(0, 0, 1);
    plane.setFromNormalAndCoplanarPoint(nrm, new THREE.Vector3(0, 0, c.z * UNITS_PER_METER));
  } else {
    nrm.set(0, 1, 0);
    plane.setFromNormalAndCoplanarPoint(nrm, new THREE.Vector3(0, c.y * UNITS_PER_METER, 0));
  }
  if (raycaster.ray.intersectPlane(plane, hit)) {
    const p = fromWorld(hit);
    c.x = p.x;
    if (drag.shift || e.shiftKey) c.y = p.y;
    else c.z = p.z;
    clampPos(c);
    state.dirty = true;
  }
});

window.addEventListener('pointerup', (e) => {
  if (down && !down.moved && down.id == null && (state.lab === 'field' || state.lab === 'gauss' || state.lab === 'potential')) {
    setPointer(e);
    raycaster.setFromCamera(pointer, camera);
    nrm.set(0, 1, 0);
    plane.setFromNormalAndCoplanarPoint(nrm, new THREE.Vector3(0, state.probe.y * UNITS_PER_METER, 0));
    if (raycaster.ray.intersectPlane(plane, hit)) {
      const p = fromWorld(hit);
      if (state.lab === 'potential' && e.shiftKey) {
        state.pathA.x = p.x;
        state.pathA.z = p.z;
        clampPos(state.pathA);
      } else {
        state.probe.x = p.x;
        state.probe.z = p.z;
        clampPos(state.probe);
      }
      state.dirty = true;
    }
  }
  down = null;
  if (drag) {
    drag = null;
    controls.enabled = true;
  }
});

function recompute() {
  const lab = state.lab;
  computed.probeE = fieldAt(state.probe, state.charges, state.extraE);
  computed.contrib = contributionsAt(state.probe, state.charges, state.extraE);

  if (lab === 'potential') {
    computed.V = potentialAt(state.probe, state.charges, state.extraE);
    computed.VA = potentialAt(state.pathA, state.charges, state.extraE);
    computed.PE = potentialEnergy(state.qTest, computed.V);
    computed.Wfield = workByField(state.qTest, computed.VA, computed.V);
    computed.grad = gradientCheck(state.probe, state.charges, state.extraE);
    computed.Vcontrib = potentialContributions(state.probe, state.charges, state.extraE);
    const xs = [];
    const Vs = [];
    for (let i = 0; i <= 40; i++) {
      const x = -1 + i * 0.05;
      xs.push(x);
      Vs.push(potentialAt({ x, y: state.probe.y, z: state.probe.z }, state.charges, state.extraE));
    }
    computed.Vx = { xs, Vs };
  }

  if (lab === 'capacitor') computed.cap = capacitorState(state.cap);
  if (lab === 'ohm') computed.ohm = ohmState(state.ohm);
  if (lab === 'power') {
    // Slow motion: one AC cycle takes 2 real seconds so I(t), V(t), P(t) are trackable by eye.
    computed.t = clock.elapsedTime / (2 * state.power.f);
    computed.power = powerState(state.power, computed.t);
  }

  if (lab === 'gauss') {
    const g = computeGauss(state.surface, state.charges, state.extraE);
    if (state.anim.playing) {
      const i = Math.min(g.samples.length, Math.floor(state.anim.i));
      let acc = 0;
      for (let k = 0; k < i; k++) acc += g.samples[k].dPhi;
      g.runningPhi = acc;
    } else {
      g.runningPhi = g.Phi;
    }
    computed.gauss = g;
  }

  if (lab === 'integral') {
    const nShow = state.anim.playing ? state.anim.i : state.integral.n + 1;
    const data = distView.rebuild(state.integral, nShow);
    const wantV = (state.integral.quantity || 'E') === 'V';
    const analytic = wantV
      ? state.integral.kind === 'rod'
        ? linePerpPotential(state.integral.lambda, state.integral.L, state.integral.d)
        : ringAxisPotential(state.integral.Q, state.integral.a, state.integral.y)
      : state.integral.kind === 'rod'
        ? linePerpField(state.integral.lambda, state.integral.L, state.integral.d)
        : ringAxisField(state.integral.Q, state.integral.a, state.integral.y);
    computed.integral = {
      pieces: data.pieces,
      partial: distView.partial,
      analytic,
    };
    const P = { x: 0, y: state.integral.kind === 'ring' ? state.integral.y : state.integral.d, z: 0 };
    distView.labelEl.textContent = wantV
      ? `V = ${fmtV(distView.partial.V)}  vs  ${fmtV(analytic.V)}`
      : `|E| = ${fmtFrom(computed.integral.partial.mag)}  vs  ${fmtFrom(analytic.mag)}`;
    distView.label.position.set(P.x * UNITS_PER_METER, P.y * UNITS_PER_METER + 0.4, P.z * UNITS_PER_METER);
  }

  const idx = state.charges.findIndex((c) => c.id === state.selectedId);
  computed.selectedForce = idx >= 0 && state.charges.length >= 2 ? forceOn(idx, state.charges) : null;
  computed.coach = coach(state, computed);
}

function fmtFrom(mag) {
  const a = Math.abs(mag);
  if (a >= 1e3) return `${(mag / 1e3).toFixed(2)} kN/C`;
  return `${mag.toFixed(0)} N/C`;
}

function syncViews() {
  const lab = state.lab;
  const gaussOn = lab === 'gauss';
  const chargesOn = lab === 'gauss' || lab === 'field' || lab === 'force' || lab === 'potential';
  const probeOn = lab === 'field' || lab === 'potential';
  const distOn = lab === 'integral';
  const forceOnLab = lab === 'force' || (state.show.forces && chargesOn);
  const capOn = lab === 'capacitor';
  const circuitOn = lab === 'ohm' || lab === 'power';
  const eqOn = lab === 'potential' && state.show.equipot;

  chargeView.setVisible(chargesOn);
  patchView.setVisible(gaussOn);
  arrowView.setVisible(gaussOn);
  lineView.setVisible(!!state.show.lines && (lab === 'gauss' || lab === 'field' || lab === 'potential'));
  probeView.setVisible(probeOn);
  forceView.setVisible(forceOnLab && chargesOn);
  distView.setVisible(distOn);
  capView.setVisible(capOn);
  circuitView.setVisible(circuitOn);
  equipotView.setVisible(eqOn);
  pathAMesh.visible = lab === 'potential';

  if (chargesOn) chargeView.sync(state.charges, state.selectedId);
  if (gaussOn && computed.gauss) {
    patchView.syncWire(state.surface);
    patchView.sync(computed.gauss.patches, computed.gauss.samples, state.anim, state.show.flux);
    arrowView.sync(
      computed.gauss.patches,
      computed.gauss.samples,
      state.show.E,
      state.show.nHat,
    );
  }
  if (probeOn) {
    const extra =
      lab === 'potential' ? `V = ${fmtV(computed.V)}` : '';
    probeView.sync(state.probe, computed.probeE, extra);
  }
  if (state.show.lines && (lab === 'gauss' || lab === 'field' || lab === 'potential')) {
    lineView.rebuild(state.charges, state.extraE);
  } else if (!state.show.lines) lineView.clear();
  if (forceOnLab && chargesOn) forceView.rebuild(state.charges, state.selectedId);
  else forceView.clear();
  if (eqOn) equipotView.rebuild(state.charges, state.extraE);
  else equipotView.clear();
  if (capOn && computed.cap) capView.rebuild(state.cap, computed.cap);
  grid.visible = !circuitOn;
  if (lab === 'potential') {
    const u = UNITS_PER_METER;
    pathAMesh.position.set(state.pathA.x * u, state.pathA.y * u, state.pathA.z * u);
  }
}

function circuitConfig() {
  if (state.lab === 'ohm') {
    const o = computed.ohm;
    return {
      eq: 'ohm',
      source: 'dc',
      load: 'resistor',
      loadName: `${o.mat.name} wire · ${state.ohm.L.toFixed(1)} m`,
      V: state.ohm.V,
      I: o.I,
      R: o.R,
      P: o.P,
    };
  }
  const p = computed.power;
  const pw = state.power;
  const load = pw.load || 'bulb';
  const ac = pw.mode === 'ac';
  const Vnom = ac ? pw.Vrms : pw.V;
  const loadName = load === 'bulb' ? `${Math.round((Vnom * Vnom) / pw.R)} W bulb` : 'Space heater';
  return ac
    ? { eq: 'power', source: 'ac', load, loadName, V: p.V, I: p.I, R: pw.R, P: p.Pinst, Ip: p.Ip, Vrms: pw.Vrms, Pavg: p.Pavg, f: pw.f, phase: p.omega * computed.t }
    : { eq: 'power', source: 'dc', load, loadName, V: p.V, I: p.I, R: pw.R, P: p.P };
}

const clock = new THREE.Clock();

function frame() {
  const dt = Math.min(0.05, clock.getDelta());
  stepCamera(dt);
  controls.update();

  if (state.anim.playing) {
    const nMax = state.lab === 'gauss' ? (computed.gauss?.patches.length || 800) : state.integral.n;
    const speed = state.lab === 'gauss' ? 380 : 12;
    state.anim.i += dt * speed;
    if (state.anim.i >= nMax) {
      state.anim.i = nMax;
      state.anim.playing = false;
    }
    state.dirty = true;
  }

  const live = state.lab === 'ohm' || state.lab === 'power';
  if (state.dirty || drag || live) {
    recompute();
    syncViews();
    hud.update(state, computed);
    state.dirty = false;
  }
  if ((state.lab === 'ohm' && computed.ohm) || (state.lab === 'power' && computed.power)) {
    circuitView.update(dt, circuitConfig());
  }

  renderer.render(scene, camera);
  labels.render(scene, camera);
  requestAnimationFrame(frame);
}

window.__gauss = { state, computed };
recompute();
syncViews();
hud.update(state, computed);
frame();
