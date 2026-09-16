import 'katex/dist/katex.min.css';
import * as THREE from 'three';
import { createScene } from './scene/createScene.js';
import { createHUD } from './ui/hud.js';
import { applyScenario } from './data/scenarios.js';
import { EXAMS, examById, examForLab } from './data/catalog.js';
import { parseHash, writeHash, neighborExam } from './engine/router.js';
import { createViewPool } from './engine/views.js';
import { createChargePointer } from './engine/pointer.js';
import { loadLab, loadExamLabs } from './labs/load.js';
import { addChargeTo, deleteSelectedFrom, setChargeQOn } from './labs/charges-ui.js';

const canvas = document.getElementById('c');
const { renderer, scene, camera, controls, labels, grid } = createScene(canvas);
const pool = createViewPool(scene);
const clock = new THREE.Clock();

const ctx = { scene, camera, controls, pool, grid, clock, renderer };

const app = {
  examId: 'e2',
  labId: 'gauss',
  lab: null,
  handles: {},
  slices: {},
  gen: 0,
  dirty: true,
};

const computed = {};

function slice() {
  return app.slices[app.labId] || {};
}

function bump(physics = true) {
  app.dirty = true;
  const s = app.slices[app.labId];
  if (s) {
    s.dirty = true;
    if (physics && s.anim) s.anim.playing = false;
  }
}

function publicState() {
  const s = slice();
  s.lab = app.labId;
  s.examId = app.examId;
  return s;
}

const hud = createHUD({
  setLab,
  setExam,
  setScenario,
  setLabIndex,
  shiftExam,
  resetCamera,
  toggleShow,
  toggleSweep,
  handleKey,
  bump,
  slice,
  addCharge: (sign) => {
    addChargeTo(slice(), sign);
    bump();
  },
  deleteSelected: () => {
    deleteSelectedFrom(slice());
    bump();
  },
  setChargeQ: (id, q) => {
    setChargeQOn(slice(), id, q);
    bump();
  },
  selectCharge: (id) => {
    slice().selectedId = id;
    bump(false);
  },
});

const pointer = createChargePointer({
  camera,
  controls,
  canvas,
  getState: publicState,
  getPool: () => pool,
  getHandle: () => app.handles[app.labId],
  getLab: () => app.lab,
  bump: () => {
    app.dirty = true;
  },
});

let camTween = null;
controls.addEventListener('start', () => {
  camTween = null;
});

function goCamera(lab) {
  // cameraFor(state) lets one lab frame different scenarios differently (particle orbit vs a wire).
  const cam = lab?.cameraFor?.(slice()) || lab?.camera;
  if (!cam) return;
  camTween = {
    t: 0,
    fromPos: camera.position.clone(),
    fromTarget: controls.target.clone(),
    toPos: cam.pos,
    toTarget: cam.target,
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
  goCamera(app.lab);
}

function setOrbit(on) {
  controls.enableRotate = on !== false;
}

function toggleShow(key) {
  const s = slice();
  if (!s.show) s.show = {};
  s.show[key] = !s.show[key];
  app.dirty = true;
}

function toggleSweep() {
  const s = slice();
  if (!s.anim) return;
  if (s.anim.playing) {
    s.anim.playing = false;
    s.anim.i = 1e9;
  } else {
    s.anim.playing = true;
    s.anim.i = 0;
  }
  app.dirty = true;
}

function handleKey(e) {
  const lab = app.lab;
  if (!lab) return;
  const action = lab.keys[e.key];
  if (!action) return;
  if (action === 'sweep') {
    e.preventDefault();
    toggleSweep();
  }
  if (action === 'add+') apiAdd(1);
  if (action === 'add-') apiAdd(-1);
  if (action === 'delete') {
    deleteSelectedFrom(slice());
    bump();
  }
  if (action === 'reset') resetCamera();
}

function apiAdd(sign) {
  addChargeTo(slice(), sign);
  bump();
}

function applyLabScenario(lab, id, s) {
  if (lab.applyScenario) lab.applyScenario(id, s);
  else applyScenario(lab.id, id, s);
}

function setScenario(id) {
  const lab = app.lab;
  if (!lab) return;
  applyLabScenario(lab, id, slice());
  goCamera(lab);
  bump();
}

function setLabIndex(i) {
  const exam = examById(app.examId);
  const id = exam.labs[i];
  if (id) setLab(id);
}

function shiftExam(dir) {
  const next = neighborExam(app.examId, dir);
  if (next.id !== app.examId) setExam(next.id);
}

async function setExam(examId, preferredLab) {
  const exam = examById(examId);
  app.examId = exam.id;
  await loadExamLabs(exam.labs);
  const id = preferredLab && exam.labs.includes(preferredLab) ? preferredLab : exam.labs[0];
  if (id) {
    await setLab(id);
  } else {
    if (app.lab) app.lab.exit(ctx, app.handles[app.labId], slice());
    app.lab = null;
    app.labId = null;
    pool.hideAll();
    hud.mount(null, exam, { examId: exam.id });
    writeHash(exam.id, '', { replace: booting });
    app.dirty = true;
  }
}

async function setLab(labId) {
  if (!labId) return;
  if (app.labId === labId && app.lab) return;
  const my = ++app.gen;
  const exam = examForLab(labId);
  await loadExamLabs(exam.labs);
  const lab = await loadLab(labId);
  if (!lab || my !== app.gen) return;

  if (app.lab) app.lab.exit(ctx, app.handles[app.labId], slice());

  app.examId = lab.exam || exam.id;
  app.labId = labId;
  app.lab = lab;
  if (!app.handles[labId]) app.handles[labId] = lab.init(ctx);
  if (!app.slices[labId]) {
    const s = lab.defaultState();
    const list = typeof lab.scenarios === 'function' ? lab.scenarios() : lab.scenarios || [];
    if (list[0]) applyLabScenario(lab, list[0].id, s);
    app.slices[labId] = s;
  }
  const s = app.slices[labId];
  s.lab = labId;
  lab.enter(ctx, app.handles[labId], s);
  setOrbit(lab.orbit);
  goCamera(lab);
  hud.mount(lab, examById(app.examId), s);
  writeHash(app.examId, labId, { replace: booting });
  app.dirty = true;
}

let booting = true;

function followUrl() {
  const { examId, labId } = parseHash();
  if (examId === app.examId && labId === app.labId) return;
  if (labId) setLab(labId);
  else setExam(examId);
}
// Typed / bookmarked hashes fire hashchange; Back / Forward over pushState entries fire popstate.
window.addEventListener('hashchange', followUrl);
window.addEventListener('popstate', followUrl);

function recompute() {
  const lab = app.lab;
  const s = slice();
  if (!lab) return;
  ctx.handle = app.handles[app.labId];
  lab.recompute(s, computed, ctx);
  computed.coach = lab.coach(s, computed);
}

function syncViews() {
  const lab = app.lab;
  pool.hideAll();
  if (!lab) {
    grid.visible = true;
    return;
  }
  ctx.handle = app.handles[app.labId];
  lab.syncViews(slice(), computed, ctx);
}

function frame() {
  const dt = Math.min(0.05, clock.getDelta());
  stepCamera(dt);
  controls.update();

  const lab = app.lab;
  const s = slice();
  if (lab?.tick && s.anim) {
    if (lab.tick(dt, s, computed, ctx)) app.dirty = true;
  }

  const live = !!lab?.live;
  if (app.dirty || s.dirty || pointer.dragging || live) {
    recompute();
    syncViews();
    hud.update(publicState(), computed, lab);
    app.dirty = false;
    if (s.dirty !== undefined) s.dirty = false;
  }
  if (lab?.afterFrame) lab.afterFrame(dt, s, computed, ctx);

  renderer.render(scene, camera);
  labels.render(scene, camera);
  requestAnimationFrame(frame);
}

window.__gauss = {
  get state() {
    return publicState();
  },
  computed,
  app,
  camera,
  controls,
};

const boot = parseHash();
setExam(boot.examId, boot.labId).then(() => {
  booting = false;
  recompute();
  syncViews();
  hud.update(publicState(), computed, app.lab);
  frame();
});
