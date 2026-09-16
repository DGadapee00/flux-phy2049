import { createRequire } from 'node:module';
import fs from 'node:fs';
import path from 'node:path';

const require = createRequire('C:/Users/Dalto/planner-app/package.json');
const { chromium } = require('playwright');

const outDir = path.resolve('scripts/output');
fs.mkdirSync(outDir, { recursive: true });

const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
const errors = [];
page.on('pageerror', (err) => errors.push(String(err)));
page.on('console', (msg) => {
  if (msg.type() === 'error') errors.push(msg.text());
});

await page.goto('http://localhost:5174/', { waitUntil: 'networkidle', timeout: 30000 });
await page.waitForTimeout(800);

const title = await page.title();
const law = await page.locator('#law-line').innerText();
const insight = await page.locator('#insight-title').innerText();
const readout = await page.locator('#readout').innerText();
const canvasOk = await page.evaluate(() => {
  const c = document.getElementById('c');
  const gl = c.getContext('webgl2') || c.getContext('webgl');
  return {
    w: c.width,
    h: c.height,
    gl: !!gl,
    hasGauss: !!window.__gauss,
    lab: window.__gauss?.state?.lab,
    phi: window.__gauss?.computed?.gauss?.Phi,
    phiG: window.__gauss?.computed?.gauss?.PhiG,
    match: window.__gauss?.computed?.gauss?.match?.pct,
    charges: window.__gauss?.state?.charges?.length,
  };
});

await page.screenshot({ path: path.join(outDir, 'gauss.png'), fullPage: true });

await page.click('[data-lab="field"]');
await page.waitForTimeout(400);
const field = await page.evaluate(() => ({
  lab: window.__gauss.state.lab,
  E: window.__gauss.computed.probeE,
  law: document.getElementById('law-line').innerText,
}));
await page.screenshot({ path: path.join(outDir, 'field.png') });

await page.click('[data-lab="integral"]');
await page.waitForTimeout(400);
const integral = await page.evaluate(() => ({
  lab: window.__gauss.state.lab,
  mag: window.__gauss.computed.integral?.partial?.mag,
  analytic: window.__gauss.computed.integral?.analytic?.mag,
  law: document.getElementById('law-line').innerText,
}));
await page.screenshot({ path: path.join(outDir, 'integral.png') });
await page.click('[data-kind="ring"]');
await page.waitForTimeout(400);
await page.screenshot({ path: path.join(outDir, 'ring.png') });
await page.click('[data-kind="rod"]');
await page.waitForTimeout(200);

await page.click('[data-lab="force"]');
await page.waitForTimeout(400);
const force = await page.evaluate(() => ({
  lab: window.__gauss.state.lab,
  F: window.__gauss.computed.selectedForce,
  law: document.getElementById('law-line').innerText,
}));
await page.screenshot({ path: path.join(outDir, 'force.png') });

await page.click('[data-lab="potential"]');
await page.waitForTimeout(500);
const potential = await page.evaluate(() => ({
  lab: window.__gauss.state.lab,
  V: window.__gauss.computed.V,
  law: document.getElementById('law-line').innerText,
  err: window.__gauss.computed.grad,
}));
await page.screenshot({ path: path.join(outDir, 'potential.png') });

await page.click('[data-lab="capacitor"]');
await page.waitForTimeout(500);
const capacitor = await page.evaluate(() => ({
  lab: window.__gauss.state.lab,
  C: window.__gauss.computed.cap?.C,
  U: window.__gauss.computed.cap?.U,
  law: document.getElementById('law-line').innerText,
}));
await page.screenshot({ path: path.join(outDir, 'capacitor.png') });

await page.click('[data-lab="ohm"]');
await page.waitForTimeout(500);
const ohm = await page.evaluate(() => ({
  lab: window.__gauss.state.lab,
  R: window.__gauss.computed.ohm?.R,
  I: window.__gauss.computed.ohm?.I,
  law: document.getElementById('law-line').innerText,
}));
await page.screenshot({ path: path.join(outDir, 'ohm.png') });

await page.click('[data-lab="power"]');
await page.waitForTimeout(500);
const power = await page.evaluate(() => ({
  lab: window.__gauss.state.lab,
  P: window.__gauss.computed.power?.P,
  law: document.getElementById('law-line').innerText,
}));
await page.screenshot({ path: path.join(outDir, 'power.png') });

await page.click('[data-lab="gauss"]');
await page.waitForTimeout(200);
await page.selectOption('#scenario', 'offcenter');
await page.waitForTimeout(300);
const off = await page.evaluate(() => ({
  phi: window.__gauss.computed.gauss.Phi,
  phiG: window.__gauss.computed.gauss.PhiG,
  match: window.__gauss.computed.gauss.match.pct,
  nIn: window.__gauss.computed.gauss.nIn,
}));
await page.screenshot({ path: path.join(outDir, 'offcenter.png') });

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
if (windowSweepNeedsStop(sweep)) {
  await page.click('#btn-sweep');
}

function windowSweepNeedsStop(sweep) {
  return sweep.playing;
}

await page.selectOption('#scenario', 'outside');
await page.waitForTimeout(300);
const outside = await page.evaluate(() => ({
  phi: window.__gauss.computed.gauss.Phi,
  phiG: window.__gauss.computed.gauss.PhiG,
  match: window.__gauss.computed.gauss.match.pct,
  nIn: window.__gauss.computed.gauss.nIn,
}));

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

console.log(JSON.stringify({ title, law, insight, readout, canvasOk, field, integral, force, potential, capacitor, ohm, power, off, outside, added, cube, sweep, errors }, null, 2));

await browser.close();
if (errors.length) process.exit(2);
if (!canvasOk.hasGauss) process.exit(3);
if (!(canvasOk.match > 95)) process.exit(4);
