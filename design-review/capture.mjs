/**
 * Design review captures: the states scripts/gallery.mjs does not reach.
 *
 *   node design-review/capture.mjs [group ...]
 *
 * Default groups (run when none are named): first, predict, list, problem, missed, exam, units,
 * phone, busy. Each runs at 1440×900, 1280×720, 1024×768 and 390×844 (phone only at 390).
 * Opt-in groups: review (a Review-due session across exams), focus (keyboard focus), coverage
 * (share of the viewport the HUD covers → coverage.json), words (words per HUD region →
 * words.json), gallery (every lab × scenario at 1440×900 → shots/gallery).
 *
 * Output: design-review/shots/<name>-<width>.png. Needs the dev server on :5174 (npm start).
 * Env: FLUX_OUT=dir writes the shots somewhere else (design-review/after for the post-fix set);
 * FLUX_FONTS=/dir serves Google Fonts from local files (see routeFonts); FLUX_SIZES=1440,390
 * limits the review and focus groups to those widths.
 */
import fs from 'node:fs';
import path from 'node:path';
import { chromium } from '../scripts/playwright.mjs';

const BASE = 'http://localhost:5174/';
const OUT = path.resolve(process.env.FLUX_OUT || 'design-review/shots');
fs.mkdirSync(OUT, { recursive: true });

const SIZES = [
  { w: 1440, h: 900 },
  { w: 1280, h: 720 },
  { w: 1024, h: 768 },
  { w: 390, h: 844, phone: true },
];
const only = new Set(process.argv.slice(2));
const want = (g) => !only.size || only.has(g);

const browser = await chromium.launch({ headless: true });
const errors = [];

/*
 * Optional: FLUX_FONTS=/dir holding fonts.css plus the woff2 files it names (downloaded with curl,
 * gstatic paths flattened with _ for /). For sandboxes whose proxy breaks Google Fonts in Chromium:
 * without it the UI renders in a wider fallback face and truncation looks worse than it is.
 */
const FONTS = process.env.FLUX_FONTS;

async function routeFonts(ctx) {
  if (!FONTS) return;
  await ctx.route('https://fonts.googleapis.com/**', (r) =>
    r.fulfill({ contentType: 'text/css', body: fs.readFileSync(path.join(FONTS, 'fonts.css'), 'utf8') }),
  );
  await ctx.route('https://fonts.gstatic.com/**', (r) => {
    const f = path.join(FONTS, new URL(r.request().url()).pathname.slice(1).replace(/\//g, '_'));
    r.fulfill({ contentType: 'font/woff2', headers: { 'access-control-allow-origin': '*' }, body: fs.readFileSync(f) });
  });
}

async function fresh(size) {
  const ctx = await browser.newContext({
    viewport: { width: size.w, height: size.h },
    deviceScaleFactor: 1,
    isMobile: !!size.phone,
    hasTouch: !!size.phone,
  });
  await routeFonts(ctx);
  const page = await ctx.newPage();
  page.on('pageerror', (e) => errors.push(`${size.w}: ${e}`));
  return { ctx, page };
}

async function go(page, hash = '') {
  await page.goto(BASE + hash, { waitUntil: 'networkidle' });
  await page.waitForFunction(() => window.__gauss?.state, null, { timeout: 15000 });
  await page.waitForTimeout(1500);
}

async function openPractice(page) {
  if (await page.$('#problems[hidden]')) await clickSel(page, '#btn-practice');
  await page.waitForTimeout(500);
}

async function hashTo(page, hash) {
  await page.evaluate((h) => (location.hash = h), hash);
  await page.waitForTimeout(1600);
}

async function shot(page, name, size) {
  const file = path.join(OUT, `${name}-${size.w}.png`);
  await page.screenshot({ path: file });
  console.log('  ', path.basename(file));
}

/** Scroll a scrollable panel to its end (or a given element into view inside it). */
async function scrollPanel(page, sel, to = 'end') {
  await page.evaluate(
    ([s, t]) => {
      const el = document.querySelector(s);
      if (!el) return;
      if (t === 'end') el.scrollTop = el.scrollHeight;
      else {
        const target = el.querySelector(t);
        if (target) target.scrollIntoView({ block: 'start' });
      }
    },
    [sel, to],
  );
  await page.waitForTimeout(300);
}

async function clickSel(page, sel) {
  const loc = page.locator(sel).first();
  await loc.scrollIntoViewIfNeeded().catch(() => {});
  await loc.click();
  await page.waitForTimeout(500);
}

async function setSheet(page, mode) {
  await page.click(`#sheet-switch [data-sheet="${mode}"]`);
  await page.waitForTimeout(400);
}

/** The ring-V problem: a symbolic part that locks a numeric part, loads the Integrals lab. */
const PROB = '#/e3/integral?p=e3.39.ring-V&s=0';

async function pickPrinciple(page, right) {
  const want = await page.evaluate(() => {
    const cur = window.__gauss.practice.current();
    return cur?.tpl?.principles?.[0] || null;
  });
  const ids = await page.$$eval('.pb-popt', (bs) => bs.map((b) => b.dataset.principle));
  const pick = right ? want : ids.find((i) => i !== want);
  await clickSel(page, `.pb-popt[data-principle="${pick}"]`);
}

async function answers(page) {
  return page.evaluate(() => {
    const cur = window.__gauss.practice.current();
    return { V: cur.inst.$.V, Q: cur.inst.$.Q };
  });
}

const RUN_SIZES = process.env.FLUX_SIZES ? SIZES.filter((z) => process.env.FLUX_SIZES.split(',').includes(String(z.w))) : SIZES;
for (const size of RUN_SIZES) {
  console.log(`== ${size.w}×${size.h}`);
  const tag = size.w;

  if (want('first')) {
    const { ctx, page } = await fresh(size);
    await go(page, '');
    await shot(page, 'first-load', size);
    if (!size.phone) {
      await page.keyboard.press('?');
      await page.waitForTimeout(300);
      await shot(page, 'keys-sheet', size);
      await page.keyboard.press('Escape');
    }
    if (size.phone) {
      // What is under the fold of the Setup sheet on first load.
      await scrollPanel(page, '#controls');
      await shot(page, 'first-load-setup-scrolled', size);
    }
    await ctx.close();
  }

  if (want('predict')) {
    const { ctx, page } = await fresh(size);
    await go(page, '#/e3/capacitor');
    await shot(page, 'capacitor-default', size);
    // The card as it arrives: where is it relative to the fold of Setup?
    const geo = await page.evaluate(() => {
      const c = document.querySelector('#controls').getBoundingClientRect();
      const p = document.querySelector('#predict').getBoundingClientRect();
      return { ctrlBottom: c.bottom, predictTop: p.top, vh: innerHeight, scrollH: document.querySelector('#controls').scrollHeight, clientH: document.querySelector('#controls').clientHeight };
    });
    console.log('   predict geometry', JSON.stringify(geo));
    const open = await page.$eval('.pr-toggle', (b) => b.getAttribute('aria-expanded')).catch(() => null);
    if (open === 'false') await clickSel(page, '.pr-toggle');
    await scrollPanel(page, '#controls', '#predict');
    await shot(page, 'predict-open', size);
    // Try it (loads its preset if needed), then answer every row with its first option.
    const tryBtn = await page.$('[data-pr="try"]');
    if (tryBtn) await clickSel(page, '[data-pr="try"]');
    const nRows = await page.locator('.pr-row').count();
    for (let i = 0; i < nRows; i++) {
      await page.locator('.pr-row').nth(i).locator('button').first().click();
      await page.waitForTimeout(200);
    }
    await scrollPanel(page, '#controls', '#predict');
    await shot(page, 'predict-before', size);
    const go2 = await page.$('[data-pr="change"]:not([disabled])');
    if (go2) {
      await page.click('[data-pr="change"]');
      // The change plays out over about 1.5 s: one frame partway, then the graded card.
      await page.waitForTimeout(500);
      await shot(page, 'predict-changing', size);
      await page.waitForFunction(() => window.__gauss.predict.current().phase !== 'changing', null, { timeout: 6000 }).catch(() => {});
      await page.waitForTimeout(300);
      await scrollPanel(page, '#controls', '#predict');
      await shot(page, 'predict-after', size);
      await scrollPanel(page, '#controls');
      await shot(page, 'predict-after-end', size);
    }
    await ctx.close();
  }

  if (want('list')) {
    const { ctx, page } = await fresh(size);
    await go(page, '#/e3/potential');
    await clickSel(page, '#btn-practice');
    await shot(page, 'practice-list-chapter', size);
    await scrollPanel(page, '#problems', '.pb-list');
    await shot(page, 'practice-list-chapter-scrolled', size);
    if (await page.$('[data-act="filters"][aria-expanded="false"]')) {
      await clickSel(page, '[data-act="filters"]');
      await shot(page, 'practice-list-filters-open', size);
    }
    await clickSel(page, '[data-filter="group:principle"]');
    await page.evaluate(() => (document.querySelector('#problems').scrollTop = 0));
    await shot(page, 'practice-list-principle', size);
    await scrollPanel(page, '#problems', '.pb-list');
    await shot(page, 'practice-list-principle-scrolled', size);
    await ctx.close();
  }

  if (want('problem')) {
    const { ctx, page } = await fresh(size);
    await go(page, PROB);
    await page.waitForSelector('.pb-popt', { timeout: 10000 });
    await page.waitForTimeout(800);
    await shot(page, 'problem-principle-step', size);
    await pickPrinciple(page, true);
    await page.waitForTimeout(600);
    await shot(page, 'problem-worked-example', size);
    await scrollPanel(page, '#problems', '.pb-parts');
    await shot(page, 'problem-symbol-box', size);
    // Type part of the formula so the preview and units line show.
    await page.fill('#pb-in-0', 'k*Q/');
    await page.waitForTimeout(400);
    await shot(page, 'problem-symbol-typing', size);
    await page.fill('#pb-in-0', 'k*Q/sqrt(a^2+y^2)');
    await page.waitForTimeout(400);
    await scrollPanel(page, '#problems', '.pb-parts');
    await shot(page, 'problem-symbol-typed', size);
    if (size.phone) {
      await clickSel(page, '[data-act="scene"]');
      await page.waitForTimeout(600);
      await shot(page, 'phone-show-lab', size);
      await clickSel(page, '[data-act="scene"]');
    }
    // Solve it.
    const { V } = await answers(page);
    const held = await page.$('#pb-in-1[disabled], .pb-part.held');
    console.log('   numeric held before check?', !!held);
    await clickSel(page, '[data-act="check"]');
    await page.waitForTimeout(600);
    await scrollPanel(page, '#problems', '.pb-parts');
    await shot(page, 'problem-after-symbol-check', size);
    await page.fill('#pb-in-1', String(Number(V.toPrecision(4))));
    await clickSel(page, '[data-act="check"]');
    await page.waitForTimeout(1500);
    await page.evaluate(() => (document.querySelector('#problems').scrollTop = 0));
    await shot(page, 'problem-solved-top', size);
    await scrollPanel(page, '#problems', '.pb-parts');
    await shot(page, 'problem-solved-labvals', size);
    await scrollPanel(page, '#problems');
    await shot(page, 'problem-solved-end', size);
    // The lab's controls, opened from the solved problem.
    if (await page.$('[data-act="lab"]')) {
      await clickSel(page, '[data-act="lab"]');
      await page.waitForTimeout(900);
      await page.evaluate(() => (document.querySelector('#problems').scrollTop = 0));
      await shot(page, 'problem-lab-open', size);
    }
    // Change the setup, then the banner offers Reset to the problem.
    const sl = await page.$('#lab-controls input[type=range]:visible');
    if (sl && !size.phone) {
      await sl.focus();
      await page.keyboard.press('ArrowRight');
      await page.keyboard.press('ArrowRight');
      await page.waitForTimeout(800);
      await page.evaluate(() => (document.querySelector('#problems').scrollTop = 0));
      await shot(page, 'problem-edited-banner', size);
    }
    await ctx.close();
  }

  if (want('missed')) {
    const { ctx, page } = await fresh(size);
    await go(page, PROB);
    await page.waitForSelector('.pb-popt', { timeout: 10000 });
    await pickPrinciple(page, false);
    await page.waitForTimeout(500);
    await shot(page, 'missed-principle-wrong', size);
    await page.fill('#pb-in-0', 'k*Q/a');
    await clickSel(page, '[data-act="check"]');
    await page.waitForTimeout(600);
    await clickSel(page, '[data-act="reveal"]');
    await page.waitForTimeout(800);
    await scrollPanel(page, '#problems', '.pb-gap');
    await shot(page, 'missed-what-went-wrong', size);
    const chip = await page.$('.pb-gap .pb-chip');
    if (chip) {
      await chip.click();
      await page.waitForTimeout(500);
      await scrollPanel(page, '#problems', '.pb-gap');
      await shot(page, 'missed-gap-answered', size);
    }
    // A second miss elsewhere so the list has more than one row.
    await page.goto('about:blank');
    await go(page, '#/e2/gauss?p=' + encodeURIComponent('e2.36c.surfaces') + '&s=0');
    const has = await page.$('.pb-popt');
    if (has) {
      await pickPrinciple(page, false);
      await clickSel(page, '[data-act="reveal"]').catch(() => {});
      const c2 = await page.$('.pb-gap .pb-chip');
      if (c2) await c2.click();
    }
    await page.goto('about:blank');
    await go(page, '#/e3/potential');
    await openPractice(page);
    await shot(page, 'missed-weak-list', size);
    await scrollPanel(page, '#problems', '.pb-weak');
    await shot(page, 'missed-weak-list-scrolled', size);
    await ctx.close();
  }

  if (want('exam')) {
    const { ctx, page } = await fresh(size);
    await go(page, '#/e3/potential');
    await clickSel(page, '#btn-practice');
    await clickSel(page, '[data-act="exam-start"]');
    await page.waitForTimeout(2000);
    await shot(page, 'exam-in-progress', size);
    await scrollPanel(page, '#problems');
    await shot(page, 'exam-in-progress-end', size);
    await clickSel(page, '[data-act="exam-next"]');
    await page.waitForTimeout(1500);
    await shot(page, 'exam-problem-2', size);
    page.once('dialog', (d) => d.accept());
    await clickSel(page, '.pb-head [data-act="exam-submit"]');
    await page.waitForTimeout(1500);
    await shot(page, 'exam-results', size);
    await scrollPanel(page, '#problems');
    await shot(page, 'exam-results-end', size);
    await ctx.close();
  }

  if (want('units')) {
    const { ctx, page } = await fresh(size);
    await go(page, '#/e3/capacitor');
    if (size.phone) {
      // No room in a phone header: Units is reached from the Equations sheet.
      await setSheet(page, 'eq');
      await scrollPanel(page, '#eq-panel');
      await shot(page, 'units-link-phone', size);
      await clickSel(page, '#btn-units-eq');
    } else await clickSel(page, '#btn-units');
    await shot(page, 'units-open', size);
    await ctx.close();
  }

  if (want('phone') && size.phone) {
    const { ctx, page } = await fresh(size);
    for (const lab of ['#/e2/gauss', '#/e4/circuits', '#/wave/interference']) {
      await go(page, lab);
      const n = lab.split('/').pop();
      await setSheet(page, 'setup');
      await shot(page, `phone-${n}-sheet-setup`, size);
      await setSheet(page, 'eq');
      await shot(page, `phone-${n}-sheet-eq`, size);
      await setSheet(page, 'hide');
      await shot(page, `phone-${n}-sheet-hide`, size);
      await setSheet(page, 'setup');
    }
    // The exam dropdown: a native select can't be screenshotted open, so show it focused and list its options.
    await page.focus('#exam-select');
    await shot(page, 'phone-exam-select', size);
    console.log('   exam-select options', await page.$$eval('#exam-select option', (os) => os.map((o) => o.textContent).join(' | ')));
    // A tab-strip scroll: which labs are visible?
    await go(page, '#/e3/breakdown');
    await shot(page, 'phone-e3-breakdown', size);
    await ctx.close();
  }

  if (want('busy')) {
    const { ctx, page } = await fresh(size);
    const busy = [
      ['#/e4/circuits', 'twoloop', 'busy-circuits-twoloop'],
      ['#/e4/circuits', 'threebranch', 'busy-circuits-threebranch'],
      ['#/wave/diffraction', 'rayleigh', 'busy-diffraction-rayleigh'],
      ['#/wave/thinfilm', 'soap', 'busy-thinfilm-soap'],
      ['#/e4/magforce', 'helix', 'busy-magforce-helix'],
      ['#/e7/lenses', 'micro', 'busy-lenses-micro'],
      ['#/e2/field', null, 'busy-field-default'],
      ['#/e3/potential', null, 'busy-potential-default'],
      ['#/e6/emwave', null, 'busy-emwave-default'],
    ];
    for (const [hash, sc, name] of busy) {
      await go(page, hash);
      if (sc) {
        await page.selectOption('#scenario', sc).catch(() => {});
        await page.waitForTimeout(1600);
      }
      await shot(page, name, size);
    }
    // Interference with P dragged off-centre: set the state the drag writes.
    await go(page, '#/wave/interference');
    await page.evaluate(() => {
      const a = window.__gauss.app;
      a.slices.interference.yP = 0.0045;
      a.dirty = true;
    });
    await page.waitForTimeout(1200);
    await shot(page, 'busy-interference-P', size);
    await page.selectOption('#scenario', 'envelope').catch(() => {});
    await page.waitForTimeout(1000);
    await page.evaluate(() => {
      const a = window.__gauss.app;
      a.slices.interference.yP = 0.009;
      a.dirty = true;
    });
    await page.waitForTimeout(1200);
    await shot(page, 'busy-interference-envelope-P', size);
    await ctx.close();
  }
}

/*
 * Review due across exams: seed progress with one missed problem from each of four exams, all due,
 * then work the session. And keyboard focus: Tab from the top of a lab.
 * Both opt-in (`node design-review/capture.mjs review focus`).
 */
const REVIEW_SIZES = process.env.FLUX_SIZES ? SIZES.filter((z) => process.env.FLUX_SIZES.split(',').includes(String(z.w))) : SIZES;
for (const size of REVIEW_SIZES) {
  if (only.has('review')) {
    const { ctx, page } = await fresh(size);
    await go(page, '#/e3/potential');
    await page.evaluate(async () => {
      const { PROBLEMS } = await import('/src/problems/index.js');
      const pick = ['e2', 'e4', 'e6', 'wave'].map((ex) => PROBLEMS.find((p) => p.exam === ex && p.lab && p.sim));
      const now = Date.now();
      const items = {};
      for (const p of pick) items[p.id] = { attempts: 1, solved: 0, clean: 0, peeks: 0, hints: 0, box: 0, due: now - 60e3, last: now - 3600e3, lastSeed: 0, lastOk: false };
      localStorage.setItem('flux.problems.v1', JSON.stringify({ v: 1, items }));
    });
    await page.goto('about:blank');
    await go(page, '#/e3/potential');
    await openPractice(page);
    await shot(page, 'review-due-list', size);
    await clickSel(page, '[data-act="review"]');
    await page.waitForTimeout(2000);
    await shot(page, 'review-due-1', size);
    // Skip ahead the way a student who gives up would: show the solution, then Next.
    for (let i = 2; i <= 3; i++) {
      const unsure = await page.$('.pb-punsure');
      if (unsure) await clickSel(page, '.pb-punsure');
      await clickSel(page, '[data-act="reveal"]');
      await page.waitForTimeout(600);
      await scrollPanel(page, '#problems');
      if (i === 2) await shot(page, 'review-due-1-solution-end', size);
      const next = await page.$('[data-act="next"]');
      if (!next) break;
      await clickSel(page, '[data-act="next"]');
      await page.waitForTimeout(2000);
      await shot(page, `review-due-${i}`, size);
    }
    await ctx.close();
  }

  if (only.has('focus') && !size.phone) {
    const { ctx, page } = await fresh(size);
    await go(page, '#/e3/capacitor');
    await page.mouse.click(size.w / 2, size.h / 2);
    for (const n of [1, 4, 12, 16]) {
      await page.evaluate(() => document.activeElement?.blur());
      await page.keyboard.press('Tab');
      for (let i = 1; i < n; i++) await page.keyboard.press('Tab');
      await page.waitForTimeout(250);
      const where = await page.evaluate(() => {
        const a = document.activeElement;
        return a ? `${a.tagName.toLowerCase()}#${a.id || ''}.${a.className || ''} "${(a.textContent || a.value || '').trim().slice(0, 30)}"` : 'none';
      });
      console.log(`   tab ${n}: ${where}`);
      await shot(page, `focus-tab-${n}`, size);
    }
    await ctx.close();
  }
}

/*
 * How much of the viewport the HUD covers, per lab and size: the union of every visible panel's
 * box, rasterised on a 4px grid. Writes design-review/coverage.json.
 */
if (only.has('coverage')) {
  const labs = ['#/e2/gauss', '#/e3/capacitor', '#/e3/potential', '#/e4/circuits', '#/e4/magforce', '#/e7/lenses', '#/wave/interference', '#/wave/diffraction'];
  const rows = [];
  for (const size of SIZES) {
    const { ctx, page } = await fresh(size);
    for (const hash of labs) {
      await page.goto('about:blank');
      await go(page, hash);
      for (const practice of [false, true]) {
        if (practice) await openPractice(page);
        const r = await page.evaluate(() => {
          const sel = '.hud.panel, .hud.legend, .hint-bar, .spectrum-ruler, .wave-inset';
          const boxes = [...document.querySelectorAll(sel)]
            .filter((el) => el.offsetParent !== null || getComputedStyle(el).position === 'fixed')
            .map((el) => el.getBoundingClientRect())
            .filter((b) => b.width > 0 && b.height > 0);
          const W = innerWidth, H = innerHeight, g = 4;
          let covered = 0, total = 0;
          for (let y = 0; y < H; y += g)
            for (let x = 0; x < W; x += g) {
              total++;
              if (boxes.some((b) => x >= b.left && x < b.right && y >= b.top && y < b.bottom)) covered++;
            }
          const named = {};
          for (const id of ['brand', 'eq-panel', 'controls', 'toggles', 'readout', 'problems', 'hint-bar']) {
            const el = document.getElementById(id);
            if (!el || el.hidden || getComputedStyle(el).display === 'none' || getComputedStyle(el).visibility === 'hidden') continue;
            const b = el.getBoundingClientRect();
            named[id] = [Math.round(b.left), Math.round(b.top), Math.round(b.width), Math.round(b.height)];
          }
          const leg = document.querySelector('#legend');
          if (leg) {
            const b = leg.getBoundingClientRect();
            named.legend = [Math.round(b.left), Math.round(b.top), Math.round(b.width), Math.round(b.height)];
          }
          return { pct: Math.round((100 * covered) / total), panels: named };
        });
        rows.push({ lab: hash, size: `${size.w}x${size.h}`, practice, ...r });
        console.log(`   ${size.w} ${hash}${practice ? ' +practice' : ''}: ${r.pct}%`);
      }
    }
    await ctx.close();
  }
  fs.writeFileSync(path.resolve('design-review/coverage.json'), JSON.stringify(rows, null, 1));
}

/*
 * Words a student has to read, per HUD region, and how many controls Setup holds, at 1440×900.
 * Math counts as text. Writes design-review/words.json.
 */
if (only.has('words')) {
  const labs = ['#/e2/gauss', '#/e2/field', '#/e3/potential', '#/e3/capacitor', '#/e4/circuits', '#/e4/magforce', '#/e5/ac', '#/e6/emwave', '#/e7/lenses', '#/wave/interference', '#/wave/diffraction', '#/wave/thinfilm'];
  const { ctx, page } = await fresh(SIZES[0]);
  const rows = [];
  for (const hash of labs) {
    await page.goto('about:blank');
    await go(page, hash);
    const r = await page.evaluate(() => {
      const w = (el) => (el ? (el.innerText || '').replace(/\s+/g, ' ').trim().split(' ').filter(Boolean).length : 0);
      const q = (s) => document.querySelector(s);
      const ctrls = q('#controls');
      return {
        header: w(q('#brand')),
        setupHint: w(q('#setup-hint')),
        setup: w(q('#lab-controls')),
        setupHelpProse: [...ctrls.querySelectorAll('#lab-controls .tiny, #lab-controls p')].reduce((n, el) => n + w(el), 0),
        predict: w(q('#predict')),
        law: w(q('#law-line')),
        liveRows: q('#eq-live')?.querySelectorAll('.row').length || 0,
        live: w(q('#eq-live')),
        insight: w(q('#insight')),
        toggles: w(q('#toggles')),
        readout: w(q('#readout')),
        hintBar: w(q('#hint-bar')),
        legend: w(q('#legend')),
        setupControls: ctrls.querySelectorAll('input:not([type=hidden]), select, button').length,
      };
    });
    r.total = Object.entries(r).reduce((n, [k, v]) => (['liveRows', 'setupControls', 'setupHelpProse'].includes(k) ? n : n + v), 0);
    rows.push({ lab: hash, ...r });
    console.log(`   ${hash}: ${r.total} words, ${r.setupControls} Setup controls`);
  }
  await ctx.close();
  fs.writeFileSync(path.resolve('design-review/words.json'), JSON.stringify(rows, null, 1));
}

/*
 * The gallery again (scripts/gallery.mjs covers the same ground), at 1440×900 only, so that every
 * screenshot the review cites sits under design-review/shots and was taken with the real fonts.
 */
if (only.has('gallery')) {
  const size = { w: 1440, h: 900 };
  const dir = path.join(OUT, 'gallery');
  fs.mkdirSync(dir, { recursive: true });
  const { ctx, page } = await fresh(size);
  await go(page, '#/e1/vectors');
  const catalog = await page.evaluate(async () => (await import('/src/data/catalog.js')).EXAMS.map((e) => ({ id: e.id, labs: e.labs })));
  for (const exam of catalog) {
    for (const lab of exam.labs) {
      await hashTo(page, `#/${exam.id}/${lab}`);
      const ids = await page.$$eval('#scenario option:not([disabled])', (os) => os.map((o) => o.value));
      for (const id of ids.length ? ids : ['default']) {
        if (id !== 'default') await page.selectOption('#scenario', id);
        await page.waitForTimeout(1300);
        await page.screenshot({ path: path.join(dir, `${exam.id}-${lab}-${id}.png`) });
      }
    }
  }
  await ctx.close();
  console.log('gallery done');
}

await browser.close();
console.log(JSON.stringify({ errors }, null, 2));
