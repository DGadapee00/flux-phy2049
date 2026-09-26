/**
 * Predict first, in free lab play: a card at the top of the Setup panel, open on a lab's first
 * visit and folded to one line after that.
 *
 *   1. It names a change ("the battery stays connected; double d"). Try it loads the setup the
 *      prompt is written for, unless the lab is already on it.
 *   2. The student predicts what happens to each watched quantity — bigger, smaller, same; a
 *      factor; or yes/no — while the lab still shows the setup before the change.
 *   3. Make the change plays the change out in the lab itself (the numbers slide from before to
 *      after, so the scene moves while you watch), and the card then grades each prediction
 *      against the lab's own before-and-after values (src/engine/predict.js), with the reasoning.
 *   4. Undo puts the setup back; Next moves on to the lab's next prompt.
 *
 * Prompts live in src/data/predictions.js. The card hides while a practice problem is open, since
 * the lab then holds the problem's setup. A per-prompt tally stays in this browser.
 */
import { predictionsFor } from '../data/predictions.js';
import { run, outcomes, choices, matchesExpect, cloneState } from '../engine/predict.js';
import { mathProse } from './shared.js';

const KEY = 'flux.predict.v1';

function readTally() {
  try {
    const d = JSON.parse(localStorage.getItem(KEY) || 'null');
    const t = d && d.v === 1 && d.items ? d : { v: 1, items: {} };
    t.seen ||= {};
    return t;
  } catch {
    return { v: 1, items: {}, seen: {} };
  }
}

function writeTally(d) {
  try {
    localStorage.setItem(KEY, JSON.stringify(d));
  } catch {
    /* storage refused: the tally just isn't kept */
  }
}

/** Whether the lab already holds a setup the prompt can start from, or needs its preset loaded. */
const fitsNow = (p, s) => !!s && (p.fits ? p.fits(s) : s.scenarioId === p.scenario && !s.custom);

/*
 * The change, played out. Every number the prompt changes slides from its old value to its new one
 * over about a second and a half, one frame at a time through the lab's own recompute, so the plates
 * part, the lens thickens, the pattern spreads while the student watches. Anything that is not a
 * number (a switch, a preset name) changes at the start. Grading never looks at these frames: it
 * was settled on copies of the state before the first one (src/engine/predict.js).
 */
const PLAY_MS = 1500;
const ease = (t) => (t < 0.5 ? 4 * t * t * t : 1 - (-2 * t + 2) ** 3 / 2);
const reducedMotion = () => typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches;

/** Paths to the numbers that differ between two states of the same shape, or null if the shapes differ. */
function numberDiffs(a, b, path = [], out = []) {
  if (typeof a === 'number' && typeof b === 'number') {
    if (a !== b && Number.isFinite(a) && Number.isFinite(b)) out.push({ path, from: a, to: b, int: Number.isInteger(a) && Number.isInteger(b) });
    return out;
  }
  if (a && b && typeof a === 'object' && typeof b === 'object') {
    if (Array.isArray(a) !== Array.isArray(b)) return null;
    const ka = Object.keys(a);
    const kb = Object.keys(b);
    if (ka.length !== kb.length || ka.some((k) => !(k in b))) return null;
    for (const k of ka) if (numberDiffs(a[k], b[k], [...path, k], out) === null) return null;
    return out;
  }
  return out;
}

function setPath(obj, path, v) {
  let o = obj;
  for (let i = 0; i < path.length - 1; i++) o = o[path[i]];
  o[path[path.length - 1]] = v;
}

function replaceState(s, next) {
  for (const k of Object.keys(s)) delete s[k];
  Object.assign(s, cloneState(next));
}

const same = (a, b) => (typeof a === 'number' && typeof b === 'number' ? Math.abs(a - b) < 1e-9 : a === b);

export function createPredict(api) {
  const host = document.getElementById('predict');
  const tally = readTally();
  const st = { labId: null, idx: 0, phase: 'idle', picks: {}, result: null, snapshot: null, hidden: null, setupKey: '', open: true, play: null };

  /**
   * Slide the live state `s` to `target` and call done() at the end. Returns false (and changes
   * nothing) when the two can't be tweened, so the caller snaps instead.
   */
  function play(s, target, done) {
    const diffs = reducedMotion() ? null : numberDiffs(s, target);
    if (!diffs || diffs.length === 0) return false;
    // Start from the target's shape (switches already thrown), with the changing numbers at their old values.
    const start = cloneState(target);
    for (const d of diffs) setPath(start, d.path, d.from);
    replaceState(s, start);
    const t0 = performance.now();
    const token = {};
    st.play = { token, s, target, done };
    const step = (now) => {
      if (st.play?.token !== token) return;
      const k = Math.min(1, (now - t0) / PLAY_MS);
      if (k >= 1) {
        finishPlay();
        return;
      }
      const e = ease(k);
      for (const d of diffs) {
        const v = d.from + (d.to - d.from) * e;
        setPath(s, d.path, d.int ? Math.round(v) : v);
      }
      api.bump();
      requestAnimationFrame(step);
    };
    api.bump();
    requestAnimationFrame(step);
    return true;
  }

  /**
   * Land exactly on the target, now: at the end of the slide, or when the student leaves mid-way.
   * Leaving for another lab (`away`) lands the old lab quietly: bump() would mark the lab now on
   * screen as hand-edited.
   */
  function finishPlay({ away = false } = {}) {
    const p = st.play;
    if (!p) return;
    st.play = null;
    replaceState(p.s, p.target);
    if (away) p.s.dirty = true;
    else {
      api.bump();
      p.done();
    }
  }

  /** A practice problem took the lab over and wrote its own setup: stop, and touch nothing. */
  function cancelPlay() {
    st.play = null;
  }

  const prompts = () => predictionsFor(st.labId);
  const prompt = () => prompts()[st.idx] || null;

  /** Start each lab on its first prompt not yet predicted right. */
  function firstOpen() {
    const list = prompts();
    const i = list.findIndex((p) => !tally.items[p.id]?.right);
    return i < 0 ? 0 : i;
  }

  function reset(idx) {
    st.idx = idx;
    st.phase = 'idle';
    st.picks = {};
    st.result = null;
    st.snapshot = null;
  }

  function fmt(w, v) {
    if (typeof v === 'boolean') return v ? 'yes' : 'no';
    return w.fmt ? w.fmt(v) : String(v);
  }

  function labelOf(p, w, value) {
    return choices(p, w).find(([v]) => same(v, value))?.[1] ?? String(value);
  }

  function tryIt() {
    const p = prompt();
    const s = api.slice();
    if (!p || !s) return;
    if (!fitsNow(p, s)) api.setScenario(p.scenario);
    const ready = api.slice();
    // Getting to the prompt's starting point is not a hand edit: the preset keeps its name.
    const wasCustom = ready.custom;
    if (p.prep) {
      p.prep(ready);
      api.bump();
      ready.custom = wasCustom;
    }
    st.phase = 'predict';
    st.picks = {};
    render();
  }

  function makeChange() {
    const p = prompt();
    const lab = api.lab();
    const s = api.slice();
    if (!p || !lab || !s) return;
    const { before, after } = run(lab, s, p);
    const got = outcomes(p, before, after);
    st.snapshot = cloneState(s);
    const target = cloneState(s);
    p.apply(target);
    const rights = p.watch.map((w) => same(st.picks[w.id], got[w.id]));
    const allRight = rights.every(Boolean);
    const t = (tally.items[p.id] ||= { n: 0, right: 0 });
    t.n++;
    if (allRight) t.right++;
    writeTally(tally);
    st.result = { before, after, got, rights, allRight, usual: matchesExpect(p, got) };
    const reveal = () => {
      st.phase = 'done';
      render();
      const say = document.getElementById('sr-announce');
      if (say) say.textContent = allRight ? 'Prediction right.' : `${rights.filter(Boolean).length} of ${rights.length} predictions right.`;
    };
    // The change is the show: play it in the lab, and only then say how the prediction did.
    st.phase = 'changing';
    render();
    if (!play(s, target, reveal)) {
      p.apply(s);
      api.bump();
      reveal();
    }
  }

  function undo() {
    const s = api.slice();
    if (!st.snapshot || !s) return;
    const back = st.snapshot;
    st.snapshot = null;
    const settle = () => {
      st.phase = 'idle';
      st.result = null;
      render();
    };
    st.phase = 'changing';
    render();
    if (!play(s, back, settle)) {
      replaceState(s, back);
      api.bump();
      settle();
    }
  }

  function render() {
    const hide = !st.labId || !prompts().length || api.practiceActive();
    host.hidden = hide;
    if (hide) return;
    const list = prompts();
    const p = prompt();
    const done = list.filter((x) => tally.items[x.id]?.right).length;
    const busy = st.phase === 'predict' || st.phase === 'changing';
    const head = `<div class="pr-head">
        <button type="button" class="pr-toggle" data-pr="toggle" aria-expanded="${st.open}">
          <span class="pr-title">Predict first</span>
          <span class="pr-count">${done}/${list.length} right</span>
        </button>
        ${st.open ? `<span class="pr-nav"><button type="button" data-pr="prev" aria-label="Previous prediction" ${busy ? 'disabled' : ''}>‹</button><span>${st.idx + 1} of ${list.length}</span><button type="button" data-pr="next" aria-label="Next prediction" ${busy ? 'disabled' : ''}>›</button></span>` : ''}
      </div>`;
    host.classList.toggle('open', st.open);
    if (!st.open) {
      host.innerHTML = head;
      return;
    }
    const ask = `<p class="pr-ask">${mathProse(p.ask)}</p>`;
    let bodyHTML = '';
    if (st.phase === 'idle') {
      const fits = fitsNow(p, api.slice());
      bodyHTML = `${ask}
        <button type="button" class="btn pr-go" data-pr="try">Try it${fits ? '' : ' — loads its setup'}</button>`;
    } else if (st.phase === 'predict') {
      const rows = p.watch
        .map((w) => {
          const opts = choices(p, w)
            .map(([v, label]) => `<button type="button" data-pr-pick="${w.id}" data-v="${String(v)}" aria-pressed="${same(st.picks[w.id], v)}">${label}</button>`)
            .join('');
          const q = (w.mode || p.mode) === 'bool' ? mathProse(w.label) : `What happens to ${mathProse(w.label)}?`;
          return `<div class="pr-row"><div class="pr-q">${q}</div><div class="seg pr-opts">${opts}</div></div>`;
        })
        .join('');
      const ready = p.watch.every((w) => st.picks[w.id] !== undefined);
      bodyHTML = `${ask}${rows}
        <button type="button" class="btn pr-go" data-pr="change" ${ready ? '' : 'disabled'}>${ready ? 'Make the change' : 'Predict each one first'}</button>`;
    } else if (st.phase === 'changing') {
      bodyHTML = `${ask}<p class="pr-watch" role="status">Watch the lab…</p>`;
    } else {
      const r = st.result;
      const rows = p.watch
        .map((w, i) => {
          const ok = r.rights[i];
          const truth = r.got[w.id];
          const said = labelOf(p, w, st.picks[w.id]);
          const was = (w.mode || p.mode) === 'bool' ? '' : `<span class="pr-vals">${fmt(w, r.before[w.id])} → ${fmt(w, r.after[w.id])}</span>`;
          const verdict = ok ? `<span class="pr-ok">✓ ${said}</span>` : `<span class="pr-bad">✗ you said ${said}${truth == null ? '' : `; it was ${labelOf(p, w, truth)}`}</span>`;
          return `<div class="pr-res ${ok ? 'ok' : 'bad'}"><div>${mathProse((w.mode || p.mode) === 'bool' ? w.label : w.label.replace(/^./, (c) => c.toUpperCase()))}</div>${was}${verdict}</div>`;
        })
        .join('');
      const why = r.usual
        ? `<p class="pr-why">${mathProse(p.why)}</p>`
        : `<p class="pr-why">Your setup is not the one this is written for, so the lab’s result differs from the usual case. The lab’s numbers above are the ones to trust.</p>`;
      bodyHTML = `${ask}${rows}${why}
        <div class="row pr-after">
          <button type="button" class="btn ghost" data-pr="undo">Undo the change</button>
          <button type="button" class="btn" data-pr="next">Next prediction ›</button>
        </div>`;
    }
    host.innerHTML = `${head}<div class="pr-body">${bodyHTML}</div>`;
  }

  host.addEventListener('click', (e) => {
    const b = e.target.closest('button');
    if (!b || b.disabled) return;
    if (b.dataset.prPick) {
      const p = prompt();
      const w = p?.watch.find((x) => x.id === b.dataset.prPick);
      if (!w) return;
      const v = choices(p, w).find(([val]) => String(val) === b.dataset.v)?.[0];
      st.picks[w.id] = v;
      render();
      return;
    }
    const n = prompts().length;
    switch (b.dataset.pr) {
      case 'toggle':
        st.open = !st.open;
        render();
        break;
      case 'prev':
        reset((st.idx - 1 + n) % n);
        render();
        break;
      case 'next':
        reset((st.idx + 1) % n);
        render();
        break;
      case 'try':
        tryIt();
        break;
      case 'change':
        makeChange();
        break;
      case 'undo':
        undo();
        break;
      default:
        break;
    }
  });

  return {
    /** Each frame's HUD update: follow lab switches and practice problems opening or closing. */
    sync() {
      const labId = api.labId();
      const hidden = !labId || api.practiceActive();
      if (labId !== st.labId) {
        finishPlay({ away: true });
        // The card opens on a lab's first visit; once it has been seen there, it waits folded.
        if (st.labId && !st.hidden && prompts().length && !tally.seen[st.labId]) {
          tally.seen[st.labId] = true;
          writeTally(tally);
        }
        st.labId = labId;
        st.open = !!labId && !tally.seen[labId];
        reset(labId ? firstOpen() : 0);
        st.hidden = hidden;
        render();
        return;
      }
      // The idle card says whether Try it will load a preset; keep that true as the setup changes.
      const s = api.slice();
      const key = `${s?.scenarioId}:${!!s?.custom}`;
      if (key !== st.setupKey) {
        st.setupKey = key;
        if (st.phase === 'idle' && !hidden) render();
      }
      if (hidden !== st.hidden) {
        st.hidden = hidden;
        // A problem took the lab over: whatever was mid-prediction no longer describes it.
        if (hidden) cancelPlay();
        if (hidden && st.phase !== 'idle') reset(st.idx);
        render();
      }
    },
    /** For tests: the prompt on screen and its phase. */
    current: () => ({ id: prompt()?.id, phase: st.phase, result: st.result }),
    tally,
  };
}
