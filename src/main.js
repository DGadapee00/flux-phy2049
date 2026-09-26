import 'katex/dist/katex.min.css';
import * as THREE from 'three';
import { createScene } from './scene/createScene.js';
import { createHUD } from './ui/hud.js';
import { applyScenario } from './data/scenarios.js';
import { EXAMS, examById, examForLab } from './data/catalog.js';
import { parseHash, writeHash, neighborExam, problemQuery } from './engine/router.js';
import { createViewPool } from './engine/views.js';
import { createChargePointer } from './engine/pointer.js';
import { loadLab, loadExamLabs } from './labs/load.js';
import { addChargeTo, deleteSelectedFrom, setChargeQOn, setCoordOn } from './labs/charges-ui.js';
import { setFrame, refit, defaultView, sceneScale, workPlane } from './engine/frame.js';
import { setFreeRect, freeAspect, DESIGN_FREE } from './engine/viewport.js';
import { applyProblem } from './problems/simbridge.js';
import { createPractice } from './ui/problems.js';
import { createUnits } from './ui/units.js';
import { createPredict } from './ui/predict.js';
import { createNotes } from './ui/notes.js';
import { sectionForLab } from './notes/index.js';
// declared before use by createPractice's callbacks
let units;
let notes;
import { ANSWER_LAYER } from './scene/manim.js';

// Which build this is, so "is the live site current?" has an answer that isn't a guess.
// Also served as /version.json — see DEPLOY.md.
console.info(
  `FLUX build ${__BUILD__.commit}${__BUILD__.subject ? ` — ${__BUILD__.subject}` : ''} (built ${__BUILD__.built})`,
);
window.__build = __BUILD__;

const $id = (id) => document.getElementById(id);
const canvas = document.getElementById('c');
const { renderer, scene, camera, controls, labels, grid } = createScene(canvas);
const pool = createViewPool(scene);
const clock = new THREE.Clock();
camera.layers.enable(ANSWER_LAYER);

const ctx = { scene, camera, controls, pool, grid, clock, renderer };

const app = {
  examId: 'e2',
  labId: 'gauss',
  lab: null,
  handles: {},
  slices: {},
  gen: 0,
  dirty: true,
  /** '?p=…&s=…' while a practice problem is open, so the URL reopens it. */
  query: '',
};

const computed = {};
/** Practice panel (src/ui/problems.js); created once the lab-switching functions exist. */
let practice = null;

function slice() {
  return app.slices[app.labId] || {};
}

let loadingProblem = false;

/** The student changed the setup by hand: it no longer matches a preset or a problem. */
function markCustom() {
  const s = app.slices[app.labId];
  if (s && !loadingProblem) s.custom = true;
}

function bump(physics = true) {
  app.dirty = true;
  if (physics && !loadingProblem) {
    practice?.noteEdit();
    markCustom();
  }
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
  userEdit: () => {
    practice?.noteEdit();
    markCustom();
  },
  togglePractice: () => {
    units?.close(); // they share the left column
    // Notes can sit over the practice sheet; P goes back to it rather than closing it.
    if (notes?.isOpen()) {
      notes.close();
      if (!practice.isOpen()) practice.open();
      return;
    }
    practice.toggle();
  },
  toggleUnits: () => units.toggle(),
  toggleNotes: () => {
    units?.close();
    notes.toggle();
  },
  escape: () => {
    if (notes?.isOpen()) notes.close();
    else practice.escape();
  },
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
  setCoord: (point, axis, v) => {
    setCoordOn(slice(), point, axis, v);
    bump();
  },
  fitView: () => {
    applyFrame({ force: true });
    goCamera(app.lab);
    bump(false);
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
    practice?.noteEdit();
    markCustom();
  },
});

let camTween = null;
controls.addEventListener('start', () => {
  camTween = null;
});

/**
 * The flat labs (circuits, AC, the wave benches…) were framed for a wide screen. On a phone held
 * upright the canvas is taller than it is wide, and the same camera cut the battery off one side and
 * the phasors off the other. Back the camera off in proportion, so the whole drawing fits the width.
 * Labs that frame themselves (cameraFor: mirrors, lenses, charge planes) already allow for aspect.
 */
function fitNarrow(lab, cam) {
  if (lab.orbit !== false || lab.cameraFor) return cam;
  /*
   * On a laptop, what has to fit is the free strip between the panels, not the window: a flat lab
   * framed for the 750px strip at 1440 wide was cut off by the panels in the 330px strip at 1024.
   * DESIGN_FREE is that 1440×900 strip's width over the window height, where every lab looked right.
   */
  const phone = canvas.clientWidth <= 720;
  const aspect = phone ? canvas.clientWidth / Math.max(1, canvas.clientHeight) : freeAspect();
  const k = Math.min(2.4, Math.max(1, (phone ? 1.05 : DESIGN_FREE) / aspect));
  if (k === 1) return cam;
  const pos = cam.target.clone().add(cam.pos.clone().sub(cam.target).multiplyScalar(k));
  return { pos, target: cam.target };
}

function goCamera(lab) {
  // cameraFor(state) lets one lab frame different scenarios differently (particle orbit vs a wire).
  let cam = lab?.cameraFor?.(slice()) || lab?.camera;
  if (!cam) return;
  cam = fitNarrow(lab, cam);
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
  // A preset replaces whatever was there: it is neither a hand-edited setup nor a problem's.
  s.custom = false;
  s.answerScreen = false;
  delete s.problemId;
  // Scenarios are authored in the floor plane; a problem sets its own view in its setup().
  if (lab.frame) s.view = defaultView();
}

/**
 * Push the active lab's view (scene units per meter, and which plane the 2D work happens in) into
 * the scene, refitting when the content has outgrown the frame. Labs without `frame` keep the
 * fixed default scale, so their scenes are untouched.
 */
function applyFrame({ force = false } = {}) {
  const lab = app.lab;
  const s = slice();
  if (lab?.frame) {
    s.view = refit(s, { force, extent: lab.extent?.(s) });
    setFrame(s.view);
  } else {
    setFrame(null);
  }
  grid.setScale(sceneScale());
  grid.setPlane(workPlane());
}

function setScenario(id) {
  const lab = app.lab;
  if (!lab) return;
  practice?.noteEdit();
  applyLabScenario(lab, id, slice());
  applyFrame({ force: true });
  goCamera(lab);
  bump();
  slice().custom = false;
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
    await setLab(id, { examId: exam.id });
  } else {
    if (app.lab) app.lab.exit(ctx, app.handles[app.labId], slice());
    app.lab = null;
    app.labId = null;
    pool.hideAll();
    hud.mount(null, exam, { examId: exam.id });
    practice?.onMount({ byProblem: loadingProblem });
    afterMount();
    writeHash(exam.id, '', { replace: booting, query: app.query });
    app.dirty = true;
  }
}

/**
 * Switch to a lab. A lab can be listed under more than one exam (Integrals serves Exam 2 and Exam 3),
 * so it opens under `examId`, or the exam already showing, when that exam lists it — and under its
 * home exam otherwise.
 */
async function setLab(labId, { examId = app.examId } = {}) {
  if (!labId) return;
  const listed = examId && examById(examId).labs.includes(labId);
  const exam = listed ? examById(examId) : examForLab(labId);
  if (app.labId === labId && app.lab && app.examId === exam.id) return;
  const my = ++app.gen;
  await loadExamLabs(exam.labs);
  const lab = await loadLab(labId);
  if (!lab || my !== app.gen) return;

  if (app.lab) app.lab.exit(ctx, app.handles[app.labId], slice());

  app.examId = exam.id;
  app.labId = labId;
  app.lab = lab;
  units?.onLab(labId);
  if (!app.handles[labId]) app.handles[labId] = lab.init(ctx);
  if (!app.slices[labId]) app.slices[labId] = freshSlice(lab);
  const s = app.slices[labId];
  s.lab = labId;
  // A lab shared between exams starts in the mode this exam wants (Integrals in ∫ dV for Exam 3),
  // but only on arriving from the other exam, so a mode chosen here is left alone.
  if (s.openedUnder !== exam.id) {
    exam.labDefaults?.[labId]?.(s);
    s.openedUnder = exam.id;
  }
  applyFrame();
  lab.enter(ctx, app.handles[labId], s);
  setOrbit(lab.orbit);
  goCamera(lab);
  hud.mount(lab, examById(app.examId), s);
  practice?.onMount({ byProblem: loadingProblem });
  afterMount();
  writeHash(app.examId, labId, { replace: booting, query: app.query });
  app.dirty = true;
}

let booting = true;

/** A lab's state as it first opens: its defaults with its first scenario applied. */
function freshSlice(lab) {
  const s = lab.defaultState();
  const list = typeof lab.scenarios === 'function' ? lab.scenarios() : lab.scenarios || [];
  if (list[0]) applyLabScenario(lab, list[0].id, s);
  return s;
}

/**
 * Put the app into a problem's setup: switch to its lab (or its exam when it has no lab yet),
 * load the numbers into the lab, and frame the camera. Returns the template's note, if any.
 */
async function openProblemInApp(inst, { push = true, query = true } = {}) {
  const tpl = inst.tpl;
  app.query = query ? problemQuery(tpl.id, inst.seed) : '';
  loadingProblem = true;
  try {
    if (tpl.lab) {
      await setLab(tpl.lab, { examId: tpl.exam });
      // A lab switch started elsewhere (e.g. a second URL event) can supersede ours; finish the switch.
      if (app.lab?.id !== tpl.lab) await setLab(tpl.lab, { examId: tpl.exam });
    } else if (app.examId !== tpl.exam) await setExam(tpl.exam);
    let note = '';
    if (tpl.lab && app.lab?.id === tpl.lab && tpl.sim) {
      note = applyProblem(app.lab, slice(), inst);
      slice().custom = false;
      applyFrame();
      goCamera(app.lab);
      bump();
    } else if (tpl.lab && app.lab?.id === tpl.lab && slice().problemId) {
      /*
       * This problem only opens its topic's lab, and the lab is still holding the last problem's
       * setup. That setup is readable here (nothing in it is this problem's answer), so leaving it
       * would print the previous problem's answer on screen. Start the lab over from its defaults.
       */
      const fresh = freshSlice(app.lab);
      const exam = examById(app.examId);
      exam.labDefaults?.[app.lab.id]?.(fresh);
      fresh.openedUnder = exam.id;
      fresh.lab = app.lab.id;
      app.slices[app.lab.id] = fresh;
      hud.mount(app.lab, exam, fresh);
      applyFrame({ force: true });
      goCamera(app.lab);
      bump();
    }
    writeHash(app.examId, app.labId, { replace: !push, query: app.query });
    return note;
  } finally {
    loadingProblem = false;
  }
}

units = createUnits({
  // One overlay at a time: they share the left column.
  onOpen: () => {
    practice?.close?.();
    notes?.close?.();
  },
});

practice = createPractice({
  openInLab: openProblemInApp,
  clearQuery({ push = false } = {}) {
    if (!app.query) return;
    app.query = '';
    writeHash(app.examId, app.labId, { replace: !push });
  },
  /** Blind mode: hide answer arrows (the veil in problems.js handles the text). */
  setSceneBlind(on) {
    if (on) camera.layers.disable(ANSWER_LAYER);
    else camera.layers.enable(ANSWER_LAYER);
    hud.setBlind(on);
  },
  labId: () => app.labId,
  examId: () => app.examId,
  setExam: (id) => setExam(id),
  openNotes: (o) => notes.open(o),
  slice,
  computed,
  labelLayer: labels.domElement,
});

// Predict first (src/ui/predict.js): a card under the lab's Setup controls.
const predict = createPredict({
  lab: () => app.lab,
  labId: () => app.labId,
  slice: () => app.slices[app.labId] || null,
  bump,
  setScenario,
  practiceActive: () => !!practice.current(),
});

/*
 * Notes (src/ui/notes.js): the class notes for an exam, read beside the lab each section describes.
 * Notes, Practice and Explore are the three modes in the header's switch.
 */
notes = createNotes({
  examId: () => app.examId,
  showLab: (labId, examId) => {
    if (app.labId !== labId) setLab(labId, { examId });
  },
  explore: (labId, examId) => {
    practice.close();
    setLab(labId, { examId });
  },
  practiceChapter: (examId, ch) => practice.showChapter(ch, examId),
});

/** The header's switch shows the mode on screen: Notes over Practice over Explore. */
const modeButtons = { practice: $id('btn-practice'), notes: $id('btn-notes'), explore: $id('btn-explore') };
function syncModeSwitch() {
  const cls = document.body.classList;
  const mode = cls.contains('notes-open') ? 'notes' : cls.contains('practice-open') ? 'practice' : 'explore';
  for (const [k, b] of Object.entries(modeButtons)) {
    if (!b) continue;
    b.classList.toggle('active', k === mode);
    b.setAttribute('aria-selected', k === mode ? 'true' : 'false');
  }
}
new MutationObserver(syncModeSwitch).observe(document.body, { attributes: true, attributeFilter: ['class'] });
modeButtons.practice?.addEventListener('click', () => {
  units.close();
  notes.close();
  if (!practice.isOpen()) practice.open();
});
modeButtons.notes?.addEventListener('click', () => {
  units.close();
  if (!notes.isOpen()) notes.open({ examId: app.examId });
});
modeButtons.explore?.addEventListener('click', () => {
  units.close();
  notes.close();
  practice.close();
});

/** After a lab or exam mounts: the notes follow the exam, and the lab links to its section. */
function afterMount() {
  notes?.onExam(app.examId);
  const link = $id('eq-notes');
  if (!link) return;
  const hit = app.labId ? sectionForLab(app.labId, app.examId) : null;
  link.hidden = !hit;
  if (hit) {
    link.textContent = `Notes §${hit.section.n} · ${hit.section.title} →`;
    link.onclick = () => notes.open({ examId: hit.set.exam, section: hit.section.id });
  }
}

function followUrl() {
  const { examId, labId, problemId, seed } = parseHash();
  if (practice.followUrl(problemId, seed)) return;
  if (examId === app.examId && labId === app.labId) return;
  if (labId) setLab(labId, { examId });
  else setExam(examId);
}
// Typed / bookmarked hashes fire hashchange; Back / Forward over pushState entries fire popstate.
window.addEventListener('hashchange', followUrl);
window.addEventListener('popstate', followUrl);

function recompute() {
  const lab = app.lab;
  const s = slice();
  if (!lab) return;
  applyFrame();
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

/**
 * The scene is framed into the free space between the panels, not the window: the picture slides to
 * the middle of that space (a projection offset: orbit, picking, and labels all follow), and flat labs
 * back off to fit its width (fitNarrow, opticsBench's frameCamera). In Practice the problem sheet is
 * the left column and Setup is folded away, so the picture moves right, into the space it leaves.
 */
const view = { shift: 0, lift: 0, w: 0, h: 0 };
const shown = (el) => !!el && el.offsetParent !== null && !el.hidden && getComputedStyle(el).display !== 'none';
function measureFree(w, h) {
  if (w <= 720) return { left: 0, right: w, top: 0, bottom: h, W: w, H: h };
  let left = 0;
  for (const id of ['eq-panel', 'problems', 'units-ref', 'notes']) {
    const el = document.getElementById(id);
    if (shown(el)) left = Math.max(left, el.getBoundingClientRect().right);
  }
  const controlsEl = document.getElementById('controls');
  const right = shown(controlsEl) ? controlsEl.getBoundingClientRect().left : w;
  return { left, right: Math.max(left + 1, right), top: 0, bottom: h, W: w, H: h };
}
function stepViewShift() {
  const w = canvas.clientWidth;
  const h = canvas.clientHeight;
  let lift = 0;
  const free = measureFree(w, h);
  setFreeRect(free);
  const target = w > 720 ? Math.round((free.left + free.right) / 2 - w / 2) : 0;
  // Phone, problem sheet lowered to show the lab: centre the picture in the strip above the sheet.
  if (document.body.classList.contains('practice-open') && document.body.classList.contains('scene-peek') && w <= 720) {
    const top = document.getElementById('problems').getBoundingClientRect().top;
    const above = document.getElementById('lab-tabs')?.getBoundingClientRect().bottom || 0;
    lift = Math.max(0, Math.round(h / 2 - (above + top) / 2));
  }
  const ease = (from, to) => (Math.abs(to - from) < 0.5 ? to : from + (to - from) * 0.2);
  const next = ease(view.shift, target);
  const nextLift = ease(view.lift, lift);
  if (next === view.shift && nextLift === view.lift && w === view.w && h === view.h) return;
  view.shift = next;
  view.lift = nextLift;
  view.w = w;
  view.h = h;
  if (Math.abs(next) < 0.5 && Math.abs(nextLift) < 0.5) {
    if (camera.view?.enabled) camera.clearViewOffset();
  } else camera.setViewOffset(w, h, -next, nextLift, w, h);
}

function frame() {
  const dt = Math.min(0.05, clock.getDelta());
  stepCamera(dt);
  stepViewShift();
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
    practice.afterUpdate();
    app.dirty = false;
    if (s.dirty !== undefined) s.dirty = false;
  }
  if (lab?.afterFrame) lab.afterFrame(dt, s, computed, ctx);
  practice.frame();
  predict.sync();

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
  practice,
  predict,
};

const boot = parseHash();
// `#/e4/circuits?n=s4` opens the notes at a section. Read now: booting rewrites the hash.
const bootNotes = new URLSearchParams(location.hash.split('?')[1] || '').get('n');
// No link at all: a student opening the app. Practice is the front door, for the exam coming up.
const bare = !location.hash.replace(/^#\/?/, '');
setExam(boot.examId, boot.labId).then(() => {
  booting = false;
  if (boot.problemId) practice.followUrl(boot.problemId, boot.seed);
  else if (bare) practice.open();
  // `#/e4/circuits?n=s4`: open the notes at a section.
  if (bootNotes && !boot.problemId) notes.open({ examId: app.examId, section: bootNotes });
  syncModeSwitch();
  recompute();
  syncViews();
  hud.update(publicState(), computed, app.lab);
  frame();
});
