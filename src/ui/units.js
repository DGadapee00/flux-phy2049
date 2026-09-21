/**
 * The units reference: what the symbols in this lab mean and what they are measured in.
 *
 * Per-lab rather than one long table, because the question a student has is "what is V in, again?"
 * while looking at V — not "show me every unit in the course". The content comes from
 * data/quantities.js, and its base-SI column is computed by the same engine that grades symbolic
 * answers, so the panel cannot disagree with the grader.
 */
import { unitsForLab, QUANTITIES } from '../data/quantities.js';
import { tex, escapeHTML } from './shared.js';
import { LAB_META } from '../data/catalog.js';

export function createUnits({ onOpen } = {}) {
  const panel = document.getElementById('units-ref');
  const btn = document.getElementById('btn-units');
  const body = document.body;
  let open = false;
  let labId = null;

  function rowHTML(qty) {
    const unit = qty.unitName ? `${escapeHTML(qty.unit)} — ${escapeHTML(qty.unitName)}` : escapeHTML(qty.unit);
    const same = qty.equals ? `<span class="ur-eq">= ${escapeHTML(qty.equals)}</span>` : '';
    const from = qty.from ? `<div class="ur-from">${tex(qty.from)}</div>` : '';
    return `
      <div class="ur-row${qty.constant ? ' ur-const' : ''}">
        <div class="ur-sym">${tex(qty.sym)}</div>
        <div class="ur-body">
          <div class="ur-name">${escapeHTML(qty.name)}</div>
          <div class="ur-unit">${unit} ${same}</div>
          ${qty.base ? `<div class="ur-base">${escapeHTML(qty.base)}</div>` : ''}
          ${from}
        </div>
      </div>`;
  }

  function render() {
    if (!panel) return;
    const rows = unitsForLab(labId);
    const title = LAB_META[labId]?.title || 'this lab';
    if (!rows.length) {
      panel.innerHTML = `<div class="panel-header"><h2>Units</h2></div><p class="tiny">No units listed for ${escapeHTML(title)}.</p>`;
      return;
    }
    panel.innerHTML = `
      <div class="panel-header">
        <h2>Units — ${escapeHTML(title)}</h2>
        <span class="hint">base SI in grey</span>
      </div>
      <div class="ur-list">${rows.map(rowHTML).join('')}</div>
      <p class="tiny ur-foot">Every unit here is the one the answer checker uses. Typing a formula into a Practice answer box shows the units it comes out in.</p>`;
  }

  function setOpen(on) {
    open = on;
    if (panel) panel.hidden = !on;
    body.classList.toggle('units-open', on);
    btn?.setAttribute('aria-expanded', on ? 'true' : 'false');
    btn?.classList.toggle('active', on);
    if (on) {
      render();
      onOpen?.();
    }
  }

  btn?.addEventListener('click', () => setOpen(!open));

  return {
    toggle: () => setOpen(!open),
    close: () => setOpen(false),
    isOpen: () => open,
    /** Called when the lab changes: re-render if visible, so the list always matches the scene. */
    onLab(id) {
      labId = id;
      if (open) render();
    },
  };
}
