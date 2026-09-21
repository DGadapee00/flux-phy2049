import { EXAMS, examById, LAB_META } from '../data/catalog.js';
import { setLawEl, prose, mathText, escapeHTML } from './shared.js';
import { drawVx, drawAC, drawVI, drawPaschen } from './plot.js';
import { resetChargeListSig } from '../labs/charges-ui.js';
import { sceneScale, workPlane, lenLabel, PLANE_AXES } from '../engine/frame.js';

export function createHUD(api) {
  const $ = (id) => document.getElementById(id);
  let lawKey = '';
  let mountedId = '';
  /** Refreshers for the typed boxes beside each slider, rebuilt whenever a lab mounts. */
  const sliderBoxes = [];

  function setLaw(lines) {
    const key = (lines || []).join('\n');
    if (key === lawKey) return;
    lawKey = key;
    setLawEl($('law-line'), lines);
  }

  function fillScenarios(lab) {
    const list = !lab ? [] : typeof lab.scenarios === 'function' ? lab.scenarios() : lab.scenarios || [];
    $('scenario').innerHTML = list.map((s) => `<option value="${s.id}">${s.name}</option>`).join('');
    $('scenario').closest('label').hidden = list.length === 0;
  }

  /**
   * Keep the selected tab on screen. Both strips scroll sideways on a phone and neither fits, so a
   * freshly rendered strip can easily be showing everything except where you are.
   */
  function revealActive(el) {
    const on = el?.querySelector('.active');
    if (!on) return;
    /*
     * Measured with rects, not offsetLeft: offsetLeft is relative to the offsetParent, which here
     * is the header, not the strip. Using it scrolled the strip by however far along the header the
     * strip happened to start — putting the selected exam off screen rather than into view.
     */
    const box = el.getBoundingClientRect();
    const tab = on.getBoundingClientRect();
    const pad = 12;
    const left = tab.left - box.left + el.scrollLeft - pad;
    const right = left + tab.width + pad * 2;
    if (left < el.scrollLeft) el.scrollLeft = Math.max(0, left);
    else if (right > el.scrollLeft + el.clientWidth) el.scrollLeft = right - el.clientWidth;
  }

  function renderExamTabs(examId) {
    $('exam-tabs').innerHTML = EXAMS.map((e) => {
      const on = e.id === examId;
      const label = e.id === 'wave' ? 'W' : String(e.n);
      return `<button type="button" class="exam-tab${on ? ' active' : ''}" data-exam="${e.id}" aria-selected="${on}" title="Exam ${e.n}: ${e.title}">${label}</button>`;
    }).join('');
    revealActive($('exam-tabs'));
    // The phone shows this instead of the strip; both are driven from the same EXAMS list.
    const sel = $('exam-select');
    if (sel) {
      sel.innerHTML = EXAMS.map((e) => {
        const label = e.id === 'wave' ? 'Waves' : `Exam ${e.n}`;
        return `<option value="${e.id}">${label} · Ch ${escapeHTML(e.chapters)}</option>`;
      }).join('');
      sel.value = examId;
    }
  }

  function renderLabTabs(exam, labId) {
    const labs = exam?.labs || [];
    const built = labs
      .map((id) => {
        const on = id === labId;
        const title = LAB_META[id]?.title || id;
        return `<button type="button" class="tab${on ? ' active' : ''}" data-lab="${id}" role="tab" aria-selected="${on}">${title}</button>`;
      })
      .join('');
    // Unbuilt labs stay visible so the exam's full scope is on screen.
    const soon = (exam?.coming || [])
      .map((t) => `<button type="button" class="tab soon" disabled title="Coming soon">${t}</button>`)
      .join('');
    $('lab-tabs').innerHTML = built + soon;
    revealActive($('lab-tabs'));
  }

  function renderToggles(lab, state) {
    const host = $('toggle-host');
    const items = lab?.toggles || [];
    host.innerHTML = items
      .map((t) => {
        const on = !!state?.show?.[t.key];
        return `<button type="button" class="toggle${on ? ' active' : ''}" data-key="${t.key}" aria-pressed="${on}"><span class="toggle-dot"></span> ${t.label}</button>`;
      })
      .join('');
  }

  function renderLegend(lab) {
    const host = $('legend-host');
    const L = lab?.legend;
    // The legend sits over the bottom-left corner; the equation panel stops short of it.
    document.body.classList.toggle('has-legend', !!L);
    if (!L) {
      host.innerHTML = '';
      host.hidden = true;
      return;
    }
    host.hidden = false;
    host.innerHTML = `<div class="hud legend" id="legend">
        <div class="legend-title">${L.title}</div>
        <div class="legend-bar${L.barClass ? ' ' + L.barClass : ''}"></div>
        <div class="legend-row"><span>${L.low}</span><span>${L.high}</span></div>
      </div>`;
  }

  /**
   * Give every slider a box you can type an exact value into. A slider is good for sweeping and bad
   * for matching a number in a problem, so the box writes straight into the same input — widening
   * the slider's range when the problem asks for a value it could not otherwise reach.
   */
  function enhanceSliders(host) {
    for (const row of host.querySelectorAll('.slider-row')) {
      const range = row.querySelector("input[type='range']");
      if (!range || row.querySelector('.slider-num')) continue;
      const step = Number(range.step);
      // Fractional steps become continuous, so a typed value is never snapped back to the grid.
      // Whole-number steps (piece counts, turns) stay discrete.
      if (Number.isFinite(step) && step > 0 && step < 1) range.step = 'any';
      const box = document.createElement('input');
      box.type = 'number';
      box.className = 'slider-num';
      box.step = Number.isFinite(step) && step > 0 ? String(step) : 'any';
      box.setAttribute('aria-label', 'Exact value');
      const show = () => {
        if (box !== document.activeElement) box.value = String(Number(Number(range.value).toPrecision(6)));
      };
      show();
      box.addEventListener('input', () => {
        const v = Number(box.value);
        if (box.value === '' || !Number.isFinite(v)) return;
        if (v < Number(range.min)) range.min = String(v);
        if (v > Number(range.max)) range.max = String(v);
        range.value = String(v);
        range.dispatchEvent(new Event('input', { bubbles: true }));
      });
      range.addEventListener('input', show);
      row.appendChild(box);
      sliderBoxes.push(show);
    }
  }

  function mount(lab, exam, state) {
    const examId = exam?.id || 'e2';
    const labId = lab?.id || '';
    renderExamTabs(examId);
    renderLabTabs(exam, labId);
    /*
     * Two spans so the phone can drop the first. "Exam 2" repeats the highlighted exam tab, which
     * on a phone now sits in the same row — the chapter range is the part that is not on screen
     * anywhere else.
     */
    $('brand-sub').innerHTML = exam
      ? `<span class="sub-course">PHY 2049 · Exam ${exam.n === 8 ? 'final' : exam.n} · </span><span class="sub-ch">Ch ${escapeHTML(exam.chapters)}</span>`
      : '<span class="sub-course">PHY 2049</span>';
    $('setup-hint').innerHTML = mathText(lab?.hint || exam?.coming?.join(' · ') || '');
    $('hint-action').innerHTML = mathText(lab?.hint || '');
    $('hint-orbit').textContent = lab && lab.orbit === false ? 'Rotation locked' : 'Drag to orbit';
    fillScenarios(lab);
    lawKey = '';
    resetChargeListSig();

    const host = $('lab-controls');
    if (!lab) {
      const coming = (exam?.coming || []).join(', ') || 'coming next';
      host.innerHTML = `<p class="tiny">The ${coming} labs aren’t built yet. The practice problems for this unit are ready: press <b>P</b> or use Practice.</p>`;
      mountedId = '';
      renderToggles(null);
      renderLegend(null);
      return;
    }
    host.innerHTML = lab.controls();
    sliderBoxes.length = 0;
    lab.bind(api);
    enhanceSliders(host);
    mountedId = lab.id;
    renderToggles(lab, state);
    renderLegend(lab);
    if (state?.scenarioId) $('scenario').value = state.scenarioId;
  }

  $('exam-select')?.addEventListener('change', (e) => {
    Promise.resolve(api.setExam(e.target.value)).catch((err) => {
      console.error('FLUX: could not open that exam', err);
    });
  });
  $('exam-tabs').addEventListener('click', (e) => {
    const btn = e.target.closest('[data-exam]');
    if (btn) api.setExam(btn.dataset.exam);
  });
  $('lab-tabs').addEventListener('click', (e) => {
    const btn = e.target.closest('[data-lab]');
    if (btn) api.setLab(btn.dataset.lab);
  });
  $('scenario').addEventListener('change', () => api.setScenario($('scenario').value));
  $('btn-reset-cam').addEventListener('click', () => api.resetCamera());

  /*
   * On a phone the equation panel and Setup cannot both be on screen — there is roughly 400px
   * between the header strips and the readout. They share the bottom sheet and this picks which,
   * with Hide giving the scene the whole screen when the controls are in the way.
   * The switch itself is display:none above 720px, so desktop never sees it and keeps both panels.
   */
  $('sheet-switch').addEventListener('click', (e) => {
    const btn = e.target.closest('button[data-sheet]');
    if (!btn) return;
    const mode = btn.dataset.sheet;
    document.body.classList.toggle('show-eq', mode === 'eq');
    document.body.classList.toggle('sheet-hidden', mode === 'hide');
    for (const b of $('sheet-switch').querySelectorAll('button')) {
      const on = b === btn;
      b.classList.toggle('active', on);
      b.setAttribute('aria-selected', on ? 'true' : 'false');
    }
  });
  $('toggle-host').addEventListener('click', (e) => {
    const btn = e.target.closest('[data-key]');
    if (btn) api.toggleShow(btn.dataset.key);
  });

  window.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      api.escape();
      return;
    }
    if (e.target.matches('input, select, textarea')) return;
    if (e.ctrlKey || e.metaKey || e.altKey) return;
    if (e.key === 'p' || e.key === 'P') {
      api.togglePractice();
      return;
    }
    if (e.key === 'u' || e.key === 'U') {
      api.toggleUnits();
      return;
    }
    if (e.key === '[') {
      api.shiftExam(-1);
      return;
    }
    if (e.key === ']') {
      api.shiftExam(1);
      return;
    }
    if (e.key >= '1' && e.key <= '9') {
      api.setLabIndex(Number(e.key) - 1);
      return;
    }
    api.handleKey(e);
  });

  /** What plane a drag runs in, and what one grid square is worth — the scene's legend, in words. */
  function updatePlaneHint(lab) {
    const el = $('hint-plane');
    if (!el) return;
    const plane = workPlane();
    const off = PLANE_AXES[plane].off;
    el.textContent = lab?.frame
      ? `${plane} plane · 1 square = ${lenLabel(1 / sceneScale())} · Shift-drag for ${off}`
      : 'Shift-drag for height';
  }

  function update(state, computed, lab) {
    if (!lab) {
      $('eq-live').innerHTML = '';
      $('readout').innerHTML = '';
      $('insight-title').textContent = examById(state.examId)?.title || '';
      $('insight-body').innerHTML = prose((examById(state.examId)?.coming || []).join(', '));
      $('mini-plot').hidden = true;
      return;
    }
    if (state.scenarioId && $('scenario').value !== state.scenarioId) {
      $('scenario').value = state.scenarioId;
    }
    lab.syncControls(state);
    for (const show of sliderBoxes) show();
    updatePlaneHint(lab);
    document.querySelectorAll('#toggle-host [data-key]').forEach((b) => {
      const on = !!state.show?.[b.dataset.key];
      b.classList.toggle('active', on);
      b.setAttribute('aria-pressed', on ? 'true' : 'false');
    });

    const coach = computed.coach || lab.coach(state, computed) || { title: '', body: '' };
    $('insight-title').innerHTML = mathText(coach.title || '');
    $('insight-body').innerHTML = prose(coach.body || '');

    setLaw(lab.law(state, computed));
    $('eq-live').innerHTML = lab.liveRows(state, computed);
    $('readout').innerHTML = lab.readout(state, computed);

    const plot = lab.plot(state, computed);
    const canvas = $('mini-plot');
    if (!plot) {
      canvas.hidden = true;
    } else {
      canvas.hidden = false;
      if (plot.type === 'Vx') drawVx(canvas, plot.xs, plot.Vs, plot.xProbe, plot.xA);
      if (plot.type === 'ac') drawAC(canvas, plot.power, plot.t);
      if (plot.type === 'vi') drawVI(canvas, plot);
      if (plot.type === 'paschen') drawPaschen(canvas, plot);
    }
  }

  return { mount, update };
}

export { sciHTML } from './format.js';
