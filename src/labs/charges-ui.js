import { chargeLocation, isClosed } from '../physics/surfaces.js';
import { fmtCharge } from '../ui/format.js';
import { newCharge } from '../data/scenarios.js';

export const CHARGE_HTML = `
        <div class="lab-block">
          <div class="row">
            <button type="button" class="btn pos" id="add-plus">+ Charge</button>
            <button type="button" class="btn neg" id="add-minus">− Charge</button>
            <button type="button" class="btn ghost" id="del-charge">Delete</button>
          </div>
          <ul class="charge-list" id="charge-list"></ul>
        </div>`;

export function bindCharges(api) {
  const $ = (id) => document.getElementById(id);
  $('add-plus')?.addEventListener('click', () => api.addCharge(1));
  $('add-minus')?.addEventListener('click', () => api.addCharge(-1));
  $('del-charge')?.addEventListener('click', () => api.deleteSelected());
  const list = $('charge-list');
  if (!list) return;
  list.addEventListener('input', (e) => {
    const item = e.target.closest('[data-id]');
    if (!item || e.target.type !== 'range') return;
    api.setChargeQ(Number(item.dataset.id), Number(e.target.value) * 1e-6);
  });
  list.addEventListener('click', (e) => {
    const item = e.target.closest('[data-id]');
    if (item) api.selectCharge(Number(item.dataset.id));
  });
}

export function addChargeTo(state, sign) {
  const c = newCharge(sign, state.charges);
  state.charges.push(c);
  state.selectedId = c.id;
}

export function deleteSelectedFrom(state) {
  if (state.selectedId == null) return;
  state.charges = state.charges.filter((c) => c.id !== state.selectedId);
  state.selectedId = state.charges[0]?.id ?? null;
}

export function setChargeQOn(state, id, q) {
  const c = state.charges.find((x) => x.id === id);
  if (c) c.q = q;
}

let chargeSig = '';

export function resetChargeListSig() {
  chargeSig = '';
}

export function renderChargeList(state, { gauss = false } = {}) {
  const chargeList = document.getElementById('charge-list');
  if (!chargeList) return;
  const big = (state.charges || []).filter((c) => !c.small);
  const small = (state.charges || []).filter((c) => c.small);
  const sig = `${state.lab || ''}|${big.map((c) => c.id).join(',')}|${small.length}|${state.selectedId}`;
  if (sig !== chargeSig) {
    chargeSig = sig;
    let html = '';
    if (small.length) {
      html += `<li class="charge-item" style="cursor:default"><span class="badge out">${small.length} elements</span><span style="grid-column:2/-1;color:var(--text-muted);font-size:11px">Line/sheet approximation — drag one in the scene to break symmetry.</span></li>`;
    }
    html += big
      .map((c) => {
        const loc = gauss && isClosed(state.surface?.type) ? chargeLocation(c, state.surface) : '';
        const sel = c.id === state.selectedId ? ' selected' : '';
        const uC = (c.q * 1e6).toFixed(2);
        return `<li class="charge-item${sel}" data-id="${c.id}">
            <span class="mono" style="color:${c.q >= 0 ? 'var(--pos)' : 'var(--neg)'}">${fmtCharge(c.q)}</span>
            <input type="range" min="-5" max="5" step="0.1" value="${uC}" aria-label="Charge" />
            ${loc ? `<span class="badge ${loc}">${loc}</span>` : '<span></span>'}
          </li>`;
      })
      .join('');
    chargeList.innerHTML = html || '<li class="charge-item" style="cursor:default;color:var(--text-dim)">No point charges</li>';
  } else {
    chargeList.querySelectorAll('[data-id]').forEach((item) => {
      const id = Number(item.dataset.id);
      const c = state.charges.find((x) => x.id === id);
      if (!c) return;
      item.classList.toggle('selected', c.id === state.selectedId);
      const badge = item.querySelector('.badge');
      if (badge && gauss && isClosed(state.surface?.type)) {
        const loc = chargeLocation(c, state.surface);
        badge.className = `badge ${loc}`;
        badge.textContent = loc;
      }
      const label = item.querySelector('.mono');
      if (label) {
        label.textContent = fmtCharge(c.q);
        label.style.color = c.q >= 0 ? 'var(--pos)' : 'var(--neg)';
      }
    });
  }
}
