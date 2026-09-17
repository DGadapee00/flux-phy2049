/** Tile scripts/output/gallery/*.png into labeled contact sheets (12 per sheet). */
import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { chromium } from './playwright.mjs';

const dir = path.resolve('scripts/output/gallery');
const filter = process.argv[2] ? new RegExp(process.argv[2]) : null;
const files = fs.readdirSync(dir).filter((f) => f.endsWith('.png') && !f.startsWith('sheet') && (!filter || filter.test(f))).sort();
const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({ viewport: { width: 1500, height: 1000 } });
for (let s = 0; s * 12 < files.length; s++) {
  const chunk = files.slice(s * 12, s * 12 + 12);
  const html = `<body style="margin:0;background:#222;display:grid;grid-template-columns:repeat(3,500px);gap:0">${chunk
    .map((f) => `<div style="position:relative"><img src="${pathToFileURL(path.join(dir, f))}" style="width:500px;display:block"><span style="position:absolute;left:4px;top:2px;background:#000c;color:#ff0;font:bold 13px sans-serif;padding:1px 4px">${f.replace('.png', '')}</span></div>`)
    .join('')}</body>`;
  const tmp = path.join(dir, `_sheet.html`);
  fs.writeFileSync(tmp, html);
  await page.goto(pathToFileURL(tmp).href);
  await page.waitForTimeout(300);
  await page.screenshot({ path: path.join(dir, `sheet-${filter ? 'f' : ''}${s + 1}.png`), fullPage: true });
}
await browser.close();
console.log(files.length, 'images');
