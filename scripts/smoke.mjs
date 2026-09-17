import { createRequire } from 'node:module';
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

/**
 * Playwright is not a dependency of this project — it is large, and only the browser scripts want
 * it — so this borrows an install from wherever the machine keeps one. In order:
 *
 *   1. $PLAYWRIGHT_PATH — an install, or the package.json of a project that has one
 *   2. this repo's own node_modules, if playwright was ever installed here
 *   3. the global install (`npm root -g`)
 *   4. the sibling project it used to be hardcoded to
 */
function findPlaywright() {
  const bases = [];
  const env = process.env.PLAYWRIGHT_PATH;
  if (env) bases.push(env.endsWith('.json') ? env : path.join(env, 'package.json'));
  bases.push(import.meta.url);
  try {
    const root = execFileSync('npm', ['root', '-g'], {
      encoding: 'utf8',
      shell: process.platform === 'win32',
      stdio: ['ignore', 'pipe', 'ignore'],
    }).trim();
    if (root) bases.push(path.join(root, 'playwright', 'package.json'));
  } catch {
    // no npm on PATH; the other candidates still apply
  }
  bases.push('C:/Users/Dalto/planner-app/package.json');

  for (const base of bases) {
    // createRequire itself throws on a path this platform cannot read, so both failures land here.
    try {
      return createRequire(base)('playwright');
    } catch {
      /* try the next one */
    }
  }
  throw new Error(
    `Cannot find Playwright. Looked from:\n  ${bases.join('\n  ')}\n` +
      'Install it (npm i -D playwright && npx playwright install chromium), ' +
      'or set PLAYWRIGHT_PATH to a project that has it.',
  );
}

const { chromium } = findPlaywright();

const outDir = path.resolve('scripts/output');
fs.mkdirSync(outDir, { recursive: true });
const baseline = JSON.parse(fs.readFileSync(path.resolve('scripts/baseline/values.json'), 'utf8'));

const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
const errors = [];
page.on('pageerror', (err) => errors.push(String(err)));
page.on('console', (msg) => {
  if (msg.type() === 'error') errors.push(msg.text());
});

const LAB = {
  gauss: 'e2',
  field: 'e2',
  integral: 'e2',
  force: 'e1',
  potential: 'e3',
  capacitor: 'e3',
  ohm: 'e3',
  power: 'e3',
  vectors: 'e1',
  conductors: 'e2',
  biot: 'e4',
  circuits: 'e4',
  ampere: 'e4',
  magforce: 'e4',
  faraday: 'e5',
  ac: 'e5',
  emwave: 'e6',
  polar: 'e6',
  refraction: 'e7',
  mirrors: 'e7',
  lenses: 'e7',
};

async function go(lab) {
  const exam = LAB[lab];
  await page.evaluate((h) => {
    location.hash = h;
  }, `#/${exam}/${lab}`);
  await page.waitForFunction((id) => window.__gauss?.state?.lab === id, lab, { timeout: 10000 });
  await page.waitForTimeout(350);
}

/** Relative error; absolute when the expected value is 0. (max(1, |exp|) made C ~ 1e-11 F uncheckable.) */
function relErr(got, exp) {
  if (!Number.isFinite(got)) return Infinity;
  return Math.abs(got - exp) / (exp !== 0 ? Math.abs(exp) : 1);
}

const mismatches = [];
function check(name, got, exp, tol = 0.02) {
  const ok = relErr(got, exp) <= tol;
  if (!ok) mismatches.push({ name, got, exp, rel: relErr(got, exp) });
}

await page.goto('http://localhost:5174/#/e2/gauss', { waitUntil: 'networkidle', timeout: 30000 });
await page.waitForFunction((id) => window.__gauss?.state?.lab === id, 'gauss', { timeout: 10000 });
await page.waitForTimeout(800);

const title = await page.title();
const canvasOk = await page.evaluate(() => {
  const c = document.getElementById('c');
  const gl = c.getContext('webgl2') || c.getContext('webgl');
  const g = window.__gauss;
  return {
    w: c.width,
    h: c.height,
    gl: !!gl,
    hasGauss: !!g,
    lab: g?.state?.lab,
    phi: g?.computed?.gauss?.Phi,
    phiG: g?.computed?.gauss?.PhiG,
    match: g?.computed?.gauss?.match?.pct,
    charges: g?.state?.charges?.length,
  };
});
await page.screenshot({ path: path.join(outDir, 'gauss.png'), fullPage: true });
check('gauss.phi', canvasOk.phi, baseline.gauss.phi, 0.02);
check('gauss.phiG', canvasOk.phiG, baseline.gauss.phiG, 0.002);
check('gauss.match', canvasOk.match, baseline.gauss.match, 0.02);

await go('field');
const field = await page.evaluate(() => ({
  lab: window.__gauss.state.lab,
  E: window.__gauss.computed.probeE,
}));
await page.screenshot({ path: path.join(outDir, 'field.png') });
check('field.Ex', field.E.x, baseline.field.Ex, 0.02);
check('field.Ey', field.E.y, baseline.field.Ey, 0.02);

await go('integral');
const integral = await page.evaluate(() => ({
  lab: window.__gauss.state.lab,
  mag: window.__gauss.computed.integral?.partial?.mag,
  analytic: window.__gauss.computed.integral?.analytic?.mag,
}));
await page.screenshot({ path: path.join(outDir, 'integral.png') });
check('integral.mag', integral.mag, baseline.integral.mag, 0.02);
check('integral.analytic', integral.analytic, baseline.integral.analytic, 0.02);
await page.click('[data-kind="ring"]');
await page.waitForTimeout(400);
await page.screenshot({ path: path.join(outDir, 'ring.png') });

await go('force');
const force = await page.evaluate(() => ({
  lab: window.__gauss.state.lab,
  F: window.__gauss.computed.selectedForce,
}));
await page.screenshot({ path: path.join(outDir, 'force.png') });
check('force.Fx', force.F.x, baseline.force.Fx, 0.03);
check('force.Fy', force.F.y, baseline.force.Fy, 0.05);

await go('potential');
const potential = await page.evaluate(() => ({
  lab: window.__gauss.state.lab,
  V: window.__gauss.computed.V,
  err: window.__gauss.computed.grad,
}));
await page.screenshot({ path: path.join(outDir, 'potential.png') });
check('potential.V', potential.V, baseline.potential.V, 0.02);

await go('capacitor');
const capacitor = await page.evaluate(() => ({
  lab: window.__gauss.state.lab,
  C: window.__gauss.computed.cap?.C,
  U: window.__gauss.computed.cap?.U,
}));
await page.screenshot({ path: path.join(outDir, 'capacitor.png') });
check('capacitor.C', capacitor.C, baseline.capacitor.C, 0.002);
check('capacitor.U', capacitor.U, baseline.capacitor.U, 0.002);

await go('ohm');
const ohm = await page.evaluate(() => ({
  lab: window.__gauss.state.lab,
  R: window.__gauss.computed.ohm?.R,
  I: window.__gauss.computed.ohm?.I,
}));
await page.screenshot({ path: path.join(outDir, 'ohm.png') });
check('ohm.R', ohm.R, baseline.ohm.R, 0.002);
check('ohm.I', ohm.I, baseline.ohm.I, 0.002);

await go('power');
const power = await page.evaluate(() => ({
  lab: window.__gauss.state.lab,
  P: window.__gauss.computed.power?.P,
}));
await page.screenshot({ path: path.join(outDir, 'power.png') });
check('power.P', power.P, baseline.power.P, 0.02);

await go('gauss');
await page.selectOption('#scenario', 'offcenter');
await page.waitForTimeout(300);
const off = await page.evaluate(() => ({
  phi: window.__gauss.computed.gauss.Phi,
  phiG: window.__gauss.computed.gauss.PhiG,
  match: window.__gauss.computed.gauss.match.pct,
  nIn: window.__gauss.computed.gauss.nIn,
}));
await page.screenshot({ path: path.join(outDir, 'offcenter.png') });
check('off.phiG', off.phiG, baseline.offcenter.phiG, 0.002);
check('off.nIn', off.nIn, baseline.offcenter.nIn, 0);

await page.selectOption('#scenario', 'outside');
await page.waitForTimeout(300);
await page.screenshot({ path: path.join(outDir, 'outside.png') });
await page.selectOption('#scenario', 'dipole-in');
await page.waitForTimeout(300);
await page.screenshot({ path: path.join(outDir, 'dipole.png') });
await page.selectOption('#scenario', 'center');
await page.waitForTimeout(200);
await page.click('#btn-sweep');
await page.waitForTimeout(900);
const sweep = await page.evaluate(() => ({
  playing: window.__gauss.state.anim.playing,
  i: window.__gauss.state.anim.i,
  running: window.__gauss.computed.gauss.runningPhi,
  total: window.__gauss.computed.gauss.Phi,
}));
await page.screenshot({ path: path.join(outDir, 'sweep.png') });
if (sweep.playing) await page.click('#btn-sweep');

await page.selectOption('#scenario', 'outside');
await page.waitForTimeout(300);
const outside = await page.evaluate(() => ({
  phi: window.__gauss.computed.gauss.Phi,
  phiG: window.__gauss.computed.gauss.PhiG,
  match: window.__gauss.computed.gauss.match.pct,
  nIn: window.__gauss.computed.gauss.nIn,
}));
check('outside.nIn', outside.nIn, 0, 0);

await page.click('#add-plus');
await page.waitForTimeout(200);
const added = await page.evaluate(() => window.__gauss.state.charges.length);

await page.click('[data-type="cube"]');
await page.waitForTimeout(250);
const cube = await page.evaluate(() => ({
  type: window.__gauss.state.surface.type,
  match: window.__gauss.computed.gauss.match.pct,
}));
await page.screenshot({ path: path.join(outDir, 'cube.png') });

await go('vectors');
const vectors = await page.evaluate(() => ({
  lab: window.__gauss.state.lab,
  adb: window.__gauss.computed.vec?.adb,
}));
await page.screenshot({ path: path.join(outDir, 'vectors.png') });

await go('conductors');
const conductors = await page.evaluate(() => ({
  lab: window.__gauss.state.lab,
  region: window.__gauss.computed.cond?.region,
  mag: window.__gauss.computed.cond?.mag,
}));
await page.screenshot({ path: path.join(outDir, 'conductors.png') });

await go('biot');
const biot = await page.evaluate(() => ({
  lab: window.__gauss.state.lab,
  mag: window.__gauss.computed.biot?.magFull,
  exact: window.__gauss.computed.biot?.an?.exact,
}));
await page.screenshot({ path: path.join(outDir, 'biot.png') });
check('biot.wire Σ dB vs finite-wire formula', biot.mag, Math.abs(biot.exact), 0.005);
check('conductors.metal-or-outside', conductors.region === 'outside' ? 1 : 0, 1, 0);

await go('circuits');
const circuits = await page.evaluate(() => ({
  lab: window.__gauss.state.lab,
  I1: window.__gauss.computed.circ?.sol?.I?.R1,
  loopMax: window.__gauss.computed.circ?.loopMax,
}));
await page.screenshot({ path: path.join(outDir, 'circuits.png') });
check('circuits.series I = 12 V / 12 Ω', circuits.I1, 1, 0.001);
check('circuits.loop rule', circuits.loopMax, 0, 1e-6);

await go('ampere');
const ampere = await page.evaluate(() => ({
  lab: window.__gauss.state.lab,
  circ: window.__gauss.computed.amp?.circ,
  target: window.__gauss.computed.amp?.target,
}));
await page.screenshot({ path: path.join(outDir, 'ampere.png') });
check('ampere ∮ B·dl vs μ₀I_enc', ampere.circ, ampere.target, 1e-6);

await go('magforce');
const magforce = await page.evaluate(() => ({
  lab: window.__gauss.state.lab,
  rNum: window.__gauss.computed.mf?.run?.rNum,
  rA: window.__gauss.computed.mf?.run?.rA,
}));
await page.screenshot({ path: path.join(outDir, 'magforce.png') });
check('magforce proton r numerical vs mv/qB', magforce.rNum, magforce.rA, 0.005);

await go('faraday');
const faraday = await page.evaluate(() => {
  const f = window.__gauss.computed.far;
  return { lab: window.__gauss.state.lab, Phi: f?.Phi, emf: f?.emf, I: f?.I };
});
await page.screenshot({ path: path.join(outDir, 'faraday.png') });
if (faraday.lab !== 'faraday' || !Number.isFinite(faraday.emf)) {
  mismatches.push({ name: 'faraday.boot', got: faraday, exp: 'finite ε' });
}

await go('ac');
const ac = await page.evaluate(() => {
  const a = window.__gauss.computed.ac;
  return { lab: window.__gauss.state.lab, Z: a?.Z, Irms: a?.Irms, phi: a?.phi };
});
await page.screenshot({ path: path.join(outDir, 'ac.png') });
check('ac.series RLC |Z|', ac.Z, Math.hypot(15, 2 * Math.PI * 60 * 0.08 - 1 / (2 * Math.PI * 60 * 4e-5)), 0.01);

await go('emwave');
const emwave = await page.evaluate(() => {
  const w = window.__gauss.computed.em;
  const E0 = window.__gauss.state.E0;
  return { lab: window.__gauss.state.lab, c: w?.c, B0: w?.B0, E0, Iavg: w?.Iavg, band: w?.band?.id };
});
await page.screenshot({ path: path.join(outDir, 'emwave.png') });
check('emwave E₀/B₀ = c', emwave.E0 / emwave.B0, emwave.c, 0.002);
check('emwave visible band', emwave.band === 'vis' ? 1 : 0, 1, 0);

await go('polar');
const polar = await page.evaluate(() => {
  const p = window.__gauss.computed.pol;
  const I0 = window.__gauss.state.I0;
  return { lab: window.__gauss.state.lab, frac: p && I0 ? p.I / I0 : null };
});
await page.screenshot({ path: path.join(outDir, 'polar.png') });
check('polar 0°/45°/90° I/I₀ = 1/8', polar.frac, 0.125, 0.002);

await go('refraction');
const refraction = await page.evaluate(() => {
  const r = window.__gauss.computed.ref;
  return { lab: window.__gauss.state.lab, tir: r?.tir, thetaC: r?.thetaC };
});
await page.screenshot({ path: path.join(outDir, 'refraction.png') });
check('refraction water→air 55° TIR', refraction.tir ? 1 : 0, 1, 0);

await go('mirrors');
const mirrors = await page.evaluate(() => {
  const m = window.__gauss.computed.mir;
  return { lab: window.__gauss.state.lab, di: m?.di, m: m?.m };
});
await page.screenshot({ path: path.join(outDir, 'mirrors.png') });
check('mirrors f=12 d_o=36 → d_i=18', mirrors.di, 18, 0.002);
check('mirrors m = −1/2', mirrors.m, -0.5, 0.002);

await go('lenses');
const lenses = await page.evaluate(() => {
  const L = window.__gauss.computed.len;
  return { lab: window.__gauss.state.lab, di: L?.di, m: L?.m };
});
await page.screenshot({ path: path.join(outDir, 'lenses.png') });
check('lenses f=12 d_o=36 → d_i=18', lenses.di, 18, 0.002);

await page.selectOption('#scenario', 'tele');
await page.waitForTimeout(300);
const tele = await page.evaluate(() => ({ M: window.__gauss.computed.len?.angularM, sep: window.__gauss.state.sep, f2: window.__gauss.state.f2 }));
check('telescope traced M_θ = 1 − sep/f_e (relaxed eye)', tele.M, 1 - tele.sep / tele.f2, 1e-6);
await page.selectOption('#scenario', 'micro');
await page.waitForTimeout(300);
const micro = await page.evaluate(() => window.__gauss.computed.len?.i2?.di);
check('microscope final image at the 25 cm near point', micro, -25, 1e-6);
await page.selectOption('#scenario', 'conv-far');
await page.waitForTimeout(200);

// Mirrors lab was visited before lenses; check a virtual-image scenario there via its own state.
await go('mirrors');
await page.selectOption('#scenario', 'concave-in');
await page.waitForTimeout(300);
const virt = await page.evaluate(() => {
  const b = window.__gauss.computed.mir?.bundle;
  return { rays: b?.rays.length, withExt: b?.rays.filter((r) => r.extension).length, real: window.__gauss.computed.mir?.real };
});
if (virt.real || virt.rays !== 3 || virt.withExt !== 3) mismatches.push({ name: 'mirror virtual image: dashed extensions', got: virt, exp: '3 rays, 3 extensions' });
await page.selectOption('#scenario', 'concave-out');
await page.waitForTimeout(200);
await go('lenses');

await go('faraday');
await page.waitForTimeout(600);
const emfText = await page.evaluate(() => document.querySelector('#readout')?.textContent || '');
if (!/[μn]V/.test(emfText)) mismatches.push({ name: 'faraday ε readout shows μV/nV (not 0)', got: emfText.slice(0, 120), exp: 'μV' });
await go('lenses');

// Back button walks lab history (pushState entries).
await page.goBack();
await page.waitForFunction(() => window.__gauss?.state?.lab === 'faraday', null, { timeout: 5000 }).catch(() => {});
const back = await page.evaluate(() => window.__gauss.state.lab);
if (back !== 'faraday') mismatches.push({ name: 'history.back', got: back, exp: 'faraday' });

// ---------------------------------------------------------------- practice
// Every problem with a lab setup loads into the running app without errors (worksheet + one sampled seed).
const loadErrors = errors.length;
const loaded = await page.evaluate(async () => {
  const { PROBLEMS, instance, applyProblem } = await import('/src/problems/index.js');
  const { loadLab } = await import('/src/labs/load.js');
  const g = window.__gauss;
  const bad = [];
  let n = 0;
  for (const tpl of PROBLEMS.filter((t) => t.sim)) {
    for (const seed of [0, 1]) {
      try {
        const lab = await loadLab(tpl.lab);
        const slice = lab.defaultState();
        applyProblem(lab, slice, instance(tpl, seed));
        n++;
      } catch (e) {
        bad.push(`${tpl.id}@${seed}: ${e.message}`);
      }
    }
  }
  return { n, bad, current: g.state.lab };
});
if (loaded.bad.length) mismatches.push({ name: 'problems load into their labs', got: loaded.bad.slice(0, 5), exp: 'no throws' });

// Real flow through the UI: URL opens a problem blind, a wrong answer gets feedback, a right one lifts the veil.
await page.evaluate(() => {
  try {
    localStorage.removeItem('flux.problems.v1');
    localStorage.removeItem('flux.exam.v1');
  } catch {}
  location.hash = '#/e4/circuits?p=e4.44.two-loop&s=0';
});
await page.waitForFunction(() => window.__gauss.practice.current()?.id === 'e4.44.two-loop' && window.__gauss.state.lab === 'circuits', null, { timeout: 10000 });
await page.waitForTimeout(500);
const blindBefore = await page.evaluate(() => ({
  blind: document.body.classList.contains('problem-blind'),
  readoutHidden: getComputedStyle(document.getElementById('readout')).visibility === 'hidden',
  veiled: document.querySelectorAll('#label-layer .veiled').length,
  answerLayerOff: !window.__gauss.camera.layers.isEnabled(1),
  e1: window.__gauss.state.values?.E1,
}));
if (!blindBefore.blind || !blindBefore.readoutHidden || blindBefore.veiled === 0 || !blindBefore.answerLayerOff) mismatches.push({ name: 'practice: blind mode on load', got: blindBefore, exp: 'blind, readout hidden, labels veiled' });
if (blindBefore.e1 !== 12) mismatches.push({ name: 'practice: problem numbers loaded into lab', got: blindBefore.e1, exp: 12 });
await page.fill('[data-input="0"]', '23.08');
await page.fill('[data-input="1"]', '1.846 A');
await page.fill('[data-input="2"]', '0.4615');
await page.click('[data-act="check"]');
const afterWrong = await page.evaluate(() => ({
  blind: document.body.classList.contains('problem-blind'),
  fb: [...document.querySelectorAll('.pb-part .pb-fb')].map((el) => el.textContent),
}));
if (!afterWrong.blind || !/10\^1/.test(afterWrong.fb[0]) || !/sign/i.test(afterWrong.fb[2])) mismatches.push({ name: 'practice: feedback on wrong parts, still blind', got: afterWrong, exp: 'power of ten on I1, sign on I3' });
await page.fill('[data-input="0"]', '2.308');
await page.fill('[data-input="2"]', '-0.4615');
await page.click('[data-act="check"]');
await page.waitForTimeout(400);
const solved = await page.evaluate(() => ({
  blind: document.body.classList.contains('problem-blind'),
  finished: window.__gauss.practice.current()?.finished,
  labAgrees: document.querySelectorAll('.pb-labval .agree').length,
  record: window.__gauss.practice.progress.get('e4.44.two-loop'),
}));
if (solved.blind || !solved.finished || solved.labAgrees !== 3 || solved.record?.box !== 1 || solved.record?.clean !== 0) mismatches.push({ name: 'practice: solved, lab agrees, recorded (not clean)', got: solved, exp: 'unblind, 3 lab checks agree, box 1' });

// Practice exam: start, answer nothing, submit; results render and every problem is due again.
await page.keyboard.press('Escape');
await page.evaluate(() => (location.hash = '#/e1/force'));
await page.waitForFunction(() => window.__gauss.state.lab === 'force');
await page.keyboard.press('p');
await page.click('[data-act="exam-start"]');
await page.waitForFunction(() => window.__gauss.practice.current()?.mode === 'exam', null, { timeout: 10000 });
const examInfo = await page.evaluate(() => ({ nav: document.querySelectorAll('.pb-examnav button').length, timer: document.getElementById('pb-timer')?.textContent }));
page.once('dialog', (d) => d.accept());
await page.click('.pb-head [data-act="exam-submit"]');
await page.waitForSelector('.pb-table', { timeout: 5000 }).catch(() => {});
const examDone = await page.evaluate(() => ({ score: document.querySelector('.problems .pb-h')?.textContent, rows: document.querySelectorAll('.pb-table tr').length }));
if (examInfo.nav !== 8 || !/^(50|49):/.test(examInfo.timer || '') || examDone.score !== 'Score 0%' || examDone.rows < 2) mismatches.push({ name: 'practice exam: 8 problems, timer, results', got: { examInfo, examDone }, exp: '8, 50:00, Score 0%' });
const practice = { loaded: loaded.n, blindBefore, afterWrong, solved, examInfo, examDone, newErrors: errors.length - loadErrors };

console.log(
  JSON.stringify(
    { title, canvasOk, field, integral, force, potential, capacitor, ohm, power, off, outside, added, cube, sweep, vectors, conductors, biot, circuits, ampere, magforce, faraday, ac, emwave, polar, refraction, mirrors, lenses, back, practice, mismatches, errors },
    null,
    2,
  ),
);

await browser.close();
if (errors.length) process.exit(2);
if (!canvasOk.hasGauss) process.exit(3);
if (!(canvasOk.match > 95)) process.exit(4);
if (mismatches.length) {
  console.error('baseline mismatches', mismatches);
  process.exit(5);
}
