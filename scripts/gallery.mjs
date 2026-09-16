/**
 * Visual review: every lab × every scenario at 1440×900, after the camera tween settles.
 * Writes scripts/output/gallery/<exam>-<lab>-<scenario>.png and reports page errors.
 *   node scripts/gallery.mjs [labId ...]
 */
import { createRequire } from 'node:module';
import fs from 'node:fs';
import path from 'node:path';

const require = createRequire('C:/Users/Dalto/planner-app/package.json');
const { chromium } = require('playwright');

const outDir = path.resolve('scripts/output/gallery');
fs.mkdirSync(outDir, { recursive: true });
const only = new Set(process.argv.slice(2));

const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
const errors = [];
page.on('pageerror', (err) => errors.push(String(err)));
page.on('console', (msg) => {
  if (msg.type() === 'error') errors.push(msg.text());
});

await page.goto('http://localhost:5174/#/e1/vectors', { waitUntil: 'networkidle' });
await page.waitForFunction(() => window.__gauss?.state?.lab, null, { timeout: 15000 });

const catalog = await page.evaluate(async () => {
  const mod = await import('/src/data/catalog.js');
  return mod.EXAMS.map((e) => ({ id: e.id, labs: e.labs }));
});

const shots = [];
for (const exam of catalog) {
  for (const lab of exam.labs) {
    if (only.size && !only.has(lab)) continue;
    await page.evaluate((h) => (location.hash = h), `#/${exam.id}/${lab}`);
    await page.waitForFunction((id) => window.__gauss?.state?.lab === id, lab, { timeout: 10000 });
    await page.waitForTimeout(400);
    const ids = await page.$$eval('#scenario option', (os) => os.map((o) => o.value));
    for (const id of ids.length ? ids : ['default']) {
      if (id !== 'default') await page.selectOption('#scenario', id);
      await page.waitForTimeout(1300);
      const file = path.join(outDir, `${exam.id}-${lab}-${id}.png`);
      await page.screenshot({ path: file });
      shots.push(path.basename(file));
    }
  }
}
await browser.close();
console.log(JSON.stringify({ shots: shots.length, errors }, null, 2));
if (errors.length) process.exit(2);
