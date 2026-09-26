/**
 * Notes: the class notes for an exam, read beside the lab they describe (src/notes/index.js).
 *
 * The notes file is kept as it was written and read in here: its scripts, styles and fonts are
 * dropped, its math is typeset with the app's KaTeX instead of MathJax, and its colours map onto the
 * app's palette. Its own "#s4" links are rewritten to scroll this panel, because a bare "#s4" in the
 * address bar would be read by the router as an exam called s4.
 *
 * Each section ends with where to go next: the lab that shows it, and the practice problems it
 * prepares. Opened from a problem, the panel sits over the problem sheet and "Back to the problem"
 * returns to it with the attempt untouched.
 */
import renderMathInElement from 'katex/contrib/auto-render';
import { notesForExam, allNotes } from '../notes/index.js';
import { LAB_META, examById, examLabel } from '../data/catalog.js';
import { CHAPTER_TITLES, PROBLEMS } from '../problems/index.js';
import { escapeHTML as esc } from './shared.js';

const MATH = {
  delimiters: [
    { left: '\\[', right: '\\]', display: true },
    { left: '\\(', right: '\\)', display: false },
  ],
  throwOnError: false,
};

const countFor = (ch) => PROBLEMS.filter((p) => p.ch === ch).length;

export function createNotes(api) {
  const panel = document.getElementById('notes');
  const body = document.body;
  const cache = new Map(); // examId → built document fragment HTML
  const st = { open: false, examId: null, section: null, fromProblem: false, token: 0 };

  function setOpen(on) {
    st.open = on;
    panel.hidden = !on;
    body.classList.toggle('notes-open', on);
    api.onChange?.();
  }

  /** Strip what the reader must not run or restyle, and point in-page links at this panel. */
  function clean(root, set) {
    root.querySelectorAll('script, style, link, meta, title').forEach((el) => el.remove());
    for (const el of root.querySelectorAll('*')) {
      for (const a of [...el.attributes]) if (/^on/i.test(a.name)) el.removeAttribute(a.name);
    }
    // The app styles .legend as a lab's colour key; the notes' legend is a different thing.
    root.querySelectorAll('.legend').forEach((el) => el.classList.replace('legend', 'nt-legend'));
    for (const sec of root.querySelectorAll('section.topic[id]')) {
      sec.dataset.section = sec.id;
      sec.id = `nt-${set.exam}-${sec.id}`;
    }
    for (const a of root.querySelectorAll('a[href^="#"]')) {
      a.dataset.go = a.getAttribute('href').slice(1);
      a.setAttribute('href', '');
    }
  }

  function linksHTML(set, sec) {
    const bits = [];
    if (sec.lab && LAB_META[sec.lab]) bits.push(`<button type="button" class="btn nt-lab" data-lab="${esc(sec.lab)}">See it in the ${esc(LAB_META[sec.lab].title)} lab</button>`);
    for (const ch of sec.ch) {
      const n = countFor(ch);
      if (n) bits.push(`<button type="button" class="btn nt-practice" data-ch="${esc(ch)}">Practice Ch ${esc(ch)} · ${esc(CHAPTER_TITLES[ch] || '')} · ${n}</button>`);
    }
    return bits.length ? `<div class="nt-links">${bits.join('')}</div>` : '';
  }

  async function build(set) {
    if (cache.has(set.exam)) return cache.get(set.exam);
    const raw = await set.load();
    const doc = new DOMParser().parseFromString(raw, 'text/html');
    const wrap = document.createElement('div');
    const header = doc.querySelector('header.top');
    const main = doc.querySelector('main');
    const footer = doc.querySelector('footer');
    if (header) wrap.appendChild(header);
    if (main) wrap.appendChild(main);
    if (footer) wrap.appendChild(footer);
    clean(wrap, set);
    for (const sec of set.sections) {
      const el = wrap.querySelector(`[data-section="${sec.id}"]`);
      if (el) el.insertAdjacentHTML('beforeend', linksHTML(set, sec));
    }
    renderMathInElement(wrap, MATH);
    const html = wrap.innerHTML;
    cache.set(set.exam, html);
    return html;
  }

  function headHTML(set) {
    const back = st.fromProblem ? '<button type="button" class="pb-back" data-nt="back">← Back to the problem</button>' : '';
    const jump = set
      ? `<select class="nt-jump" aria-label="Go to section">${set.sections.map((s) => `<option value="${s.id}">${s.n}. ${esc(s.title)}</option>`).join('')}</select>`
      : '';
    return `<div class="nt-head">${back}${jump}<button type="button" class="pb-x" data-nt="close" title="Close the notes (N)" aria-label="Close notes">×</button></div>`;
  }

  function emptyHTML(examId) {
    const exam = examById(examId);
    const sets = allNotes();
    return `${headHTML(null)}
      <div class="nt-doc nt-empty">
        <p class="pb-kicker">Notes · ${esc(examLabel(exam))} · Ch ${esc(exam.chapters)}</p>
        <h2 class="pb-h">No notes for ${esc(examLabel(exam))} yet</h2>
        <p>The notes in FLUX so far:</p>
        <div class="nt-sets">${sets
          .map((s) => {
            const e = examById(s.exam);
            return `<button type="button" class="btn" data-set="${esc(s.exam)}">${esc(examLabel(e))} · ${esc(s.title)} · Ch ${esc(s.chapters)}</button>`;
          })
          .join('')}</div>
      </div>`;
  }

  async function render() {
    const my = ++st.token;
    const set = notesForExam(st.examId);
    if (!set) {
      panel.innerHTML = emptyHTML(st.examId);
      return;
    }
    if (!cache.has(set.exam)) panel.innerHTML = `${headHTML(set)}<div class="nt-doc"><p class="pb-dim">Loading the notes…</p></div>`;
    const html = await build(set);
    if (my !== st.token || !st.open) return;
    panel.innerHTML = `${headHTML(set)}<article class="nt-doc">${html}</article>`;
    if (st.section) scrollTo(st.section, { instant: true });
    else panel.scrollTop = 0;
    syncJump();
  }

  function sectionEl(id) {
    return panel.querySelector(`[data-section="${CSS.escape(id)}"]`);
  }

  function scrollTo(id, { instant = false } = {}) {
    const el = sectionEl(id);
    if (!el) return;
    const head = panel.querySelector('.nt-head');
    const top = el.getBoundingClientRect().top - panel.getBoundingClientRect().top + panel.scrollTop - (head?.offsetHeight || 0) - 8;
    panel.scrollTo({ top, behavior: instant ? 'auto' : 'smooth' });
    st.section = id;
    const sel = panel.querySelector('.nt-jump');
    if (sel) sel.value = id;
    showLabFor(id);
  }

  /** The lab behind the notes follows the section being read, unless a problem owns the lab. */
  function showLabFor(id) {
    const sec = notesForExam(st.examId)?.sections.find((s) => s.id === id);
    if (sec?.lab && !st.fromProblem) api.showLab?.(sec.lab, st.examId);
  }

  /** Keep the jump menu on the section in view as the reader scrolls. */
  let spyQueued = false;
  function syncJump() {
    spyQueued = false;
    const sel = panel.querySelector('.nt-jump');
    if (!sel) return;
    const head = panel.querySelector('.nt-head');
    const line = panel.getBoundingClientRect().top + (head?.offsetHeight || 0) + 40;
    let cur = null;
    for (const el of panel.querySelectorAll('[data-section]')) {
      if (el.getBoundingClientRect().top <= line) cur = el.dataset.section;
    }
    if (cur && sel.value !== cur) sel.value = cur;
    if (cur) st.section = cur;
  }
  panel.addEventListener('scroll', () => {
    if (!spyQueued) {
      spyQueued = true;
      requestAnimationFrame(syncJump);
    }
  });

  panel.addEventListener('change', (e) => {
    if (e.target.matches('.nt-jump')) scrollTo(e.target.value);
  });

  panel.addEventListener('click', (e) => {
    const a = e.target.closest('a[data-go]');
    if (a) {
      e.preventDefault();
      scrollTo(a.dataset.go);
      return;
    }
    const b = e.target.closest('button');
    if (!b) return;
    if (b.dataset.nt === 'close') close();
    else if (b.dataset.nt === 'back') close();
    else if (b.dataset.set) open({ examId: b.dataset.set });
    else if (b.dataset.lab) {
      const examId = st.examId;
      close();
      api.explore?.(b.dataset.lab, examId);
    } else if (b.dataset.ch) {
      const examId = st.examId;
      close();
      api.practiceChapter?.(examId, b.dataset.ch);
    }
  });

  function open({ examId, section = null, fromProblem = false } = {}) {
    st.examId = examId || api.examId();
    st.section = section;
    st.fromProblem = fromProblem;
    setOpen(true);
    render();
  }

  function close() {
    if (!st.open) return;
    st.fromProblem = false;
    setOpen(false);
  }

  return {
    open,
    close,
    toggle: () => (st.open ? close() : open()),
    isOpen: () => st.open,
    /** Follow the exam picker while open: the notes are per exam. */
    onExam(examId) {
      if (st.open && !st.fromProblem && examId !== st.examId) {
        st.examId = examId;
        st.section = null;
        render();
      }
    },
  };
}
