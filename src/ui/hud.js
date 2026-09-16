import { EXAMS, examById } from '../data/catalog.js';
import { setLawEl } from './shared.js';
import { drawVx, drawAC } from './plot.js';
import { resetChargeListSig } from '../labs/charges-ui.js';

export function createHUD(api) {
  const $ = (id) => document.getElementById(id);
  let lawKey = '';
  let mountedId = '';

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

  function renderExamTabs(examId) {
    $('exam-tabs').innerHTML = EXAMS.map((e) => {
      const on = e.id === examId;
      const label = e.id === 'wave' ? 'W' : String(e.n);
      return `<button type="button" class="exam-tab${on ? ' active' : ''}" data-exam="${e.id}" aria-selected="${on}" title="Exam ${e.n}: ${e.title}">${label}</button>`;
    }).join('');
  }

  function renderLabTabs(exam, labId) {
    const labs = exam?.labs || [];
    $('lab-tabs').innerHTML = labs
      .map((id, i) => {
        const on = id === labId;
        const title = id.charAt(0).toUpperCase() + id.slice(1);
        const metaTitle = title;
        return `<button type="button" class="tab${on ? ' active' : ''}" data-lab="${id}" role="tab" aria-selected="${on}">${metaTitle}</button>`;
      })
      .join('');
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

  function mount(lab, exam, state) {
    const examId = exam?.id || 'e2';
    const labId = lab?.id || '';
    renderExamTabs(examId);
    renderLabTabs(exam, labId);
    $('brand-sub').textContent = exam
      ? `PHY 2049 · Exam ${exam.n === 8 ? 'final' : exam.n} · Ch ${exam.chapters}`
      : 'PHY 2049';
    $('setup-hint').textContent = lab?.hint || exam?.coming?.join(' · ') || '';
    $('hint-action').textContent = lab?.hint || '';
    $('hint-orbit').textContent = lab && lab.orbit === false ? 'Rotation locked' : 'Drag to orbit';
    fillScenarios(lab);
    lawKey = '';
    resetChargeListSig();

    const host = $('lab-controls');
    if (!lab) {
      const coming = (exam?.coming || []).join(', ') || 'coming next';
      host.innerHTML = `<p class="tiny">Exam ${exam?.n} labs (${coming}) ship next. The eight electrostatics labs are under Exams 1–3.</p>`;
      mountedId = '';
      renderToggles(null);
      renderLegend(null);
      return;
    }
    host.innerHTML = lab.controls();
    lab.bind(api);
    mountedId = lab.id;
    renderToggles(lab, state);
    renderLegend(lab);
    if (state?.scenarioId) $('scenario').value = state.scenarioId;
  }

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
  $('toggle-host').addEventListener('click', (e) => {
    const btn = e.target.closest('[data-key]');
    if (btn) api.toggleShow(btn.dataset.key);
  });

  window.addEventListener('keydown', (e) => {
    if (e.target.matches('input, select, textarea')) return;
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

  function update(state, computed, lab) {
    if (!lab) {
      $('eq-live').innerHTML = '';
      $('readout').innerHTML = '';
      $('insight-title').textContent = examById(state.examId)?.title || '';
      $('insight-body').textContent = (examById(state.examId)?.coming || []).join(', ');
      $('mini-plot').hidden = true;
      return;
    }
    if (state.scenarioId && $('scenario').value !== state.scenarioId) {
      $('scenario').value = state.scenarioId;
    }
    lab.syncControls(state);
    document.querySelectorAll('#toggle-host [data-key]').forEach((b) => {
      const on = !!state.show?.[b.dataset.key];
      b.classList.toggle('active', on);
      b.setAttribute('aria-pressed', on ? 'true' : 'false');
    });

    const coach = computed.coach || lab.coach(state, computed) || { title: '', body: '' };
    $('insight-title').textContent = coach.title || '';
    $('insight-body').textContent = coach.body || '';

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
    }
  }

  return { mount, update };
}

export { sciHTML } from './format.js';
