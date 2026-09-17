import { chargeLocation, isClosed } from '../physics/surfaces.js';
import { fmtCharge } from '../ui/format.js';
import { newCharge } from '../data/scenarios.js';
import { coordUnit, sceneScale, lenLabel, workPlane } from '../engine/frame.js';

/**
 * The charge panel. Every number a problem can state — the charge and each coordinate — is a box
 * you can type into, so a setup can be matched to a problem exactly instead of being approached
 * with a slider.
 */
export const CHARGE_HTML = `
        <div class="lab-block">
          <div class="row">
            <button type="button" class="btn pos" id="add-plus">+ Charge</button>
            <button type="button" class="btn neg" id="add-minus">− Charge</button>
            <button type="button" class="btn ghost" id="del-charge">Delete</button>
          </div>
          <ul class="charge-list" id="charge-list"></ul>
          <div class="coord-block" id="coord-block"></div>
          <div class="row scale-row">
            <button type="button" class="btn ghost" id="btn-fit">Fit view</button>
            <span class="tiny" id="scale-note"></span>
          </div>
        </div>`;

const num = (v, digits = 3) => Number(v.toFixed(digits));

export function bindCharges(api) {
  const $ = (id) => document.getElementById(id);
  $('add-plus')?.addEventListener('click', () => api.addCharge(1));
  $('add-minus')?.addEventListener('click', () => api.addCharge(-1));
  $('del-charge')?.addEventListener('click', () => api.deleteSelected());
  $('btn-fit')?.addEventListener('click', () => api.fitView());

  const list = $('charge-list');
  if (list) {
    list.addEventListener('input', (e) => {
      const item = e.target.closest('[data-id]');
      if (!item || !e.target.matches('input[data-q]')) return;
      const uC = Number(e.target.value);
      if (Number.isFinite(uC)) api.setChargeQ(Number(item.dataset.id), uC * 1e-6);
    });
    list.addEventListener('click', (e) => {
      if (e.target.matches('input')) return;
      const item = e.target.closest('[data-id]');
      if (item) api.selectCharge(Number(item.dataset.id));
    });
  }

  const coords = $('coord-block');
  coords?.addEventListener('input', (e) => {
    const input = e.target.closest('input[data-axis]');
    const row = e.target.closest('[data-point]');
    if (!input || !row) return;
    const v = Number(input.value);
    if (!Number.isFinite(v)) return;
    api.setCoord(row.dataset.point, input.dataset.axis, v / coordUnit().per);
  });
}

export function addChargeTo(state, sign) {
  const c = newCharge(sign, state.charges);
  const span = 2.2 / sceneScale();
  const n = state.charges.length;
  // Place new charges on the current grid, at the scale in use, not at a fixed metric distance.
  c.x = num(Math.cos(n * 1.2) * span, 4);
  const second = workPlane() === 'xy' ? 'y' : 'z';
  c[second] = num(Math.sin(n * 1.2) * span, 4);
  c[workPlane() === 'xy' ? 'z' : 'y'] = 0;
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

/** `point` is 'charge:<id>', 'probe' or 'pathA'; `axis` is x / y / z; `v` is in meters. */
export function setCoordOn(state, point, axis, v) {
  if (!Number.isFinite(v)) return;
  if (point.startsWith('charge:')) {
    const c = state.charges.find((x) => x.id === Number(point.slice(7)));
    if (c) c[axis] = v;
    return;
  }
  const target = state[point];
  if (target) target[axis] = v;
}

let chargeSig = '';
let coordSig = '';

export function resetChargeListSig() {
  chargeSig = '';
  coordSig = '';
}

/** Never fight the box the student is typing in. */
function setInput(el, value) {
  if (!el || el === document.activeElement) return;
  const next = String(value);
  if (el.value !== next) el.value = next;
}

export function renderChargeList(state, { gauss = false, fit = true } = {}) {
  const chargeList = document.getElementById('charge-list');
  if (!chargeList) return;
  const big = (state.charges || []).filter((c) => !c.small);
  const small = (state.charges || []).filter((c) => c.small);
  const sig = `${state.lab || ''}|${big.map((c) => c.id).join(',')}|${small.length}|${state.selectedId}`;
  if (sig !== chargeSig) {
    chargeSig = sig;
    let html = '';
    if (small.length) {
      html += `<li class="charge-item elements"><span class="badge out">${small.length} elements</span><span style="grid-column:2/-1;color:var(--text-muted);font-size:11px">Line/sheet approximation — drag one in the scene to break symmetry.</span></li>`;
    }
    html += big
      .map((c, i) => {
        const loc = gauss && isClosed(state.surface?.type) ? chargeLocation(c, state.surface) : '';
        const sel = c.id === state.selectedId ? ' selected' : '';
        return `<li class="charge-item${sel}" data-id="${c.id}">
            <span class="q-name">q<sub>${i + 1}</sub></span>
            <span class="num-field"><input type="number" step="0.1" data-q value="${num(c.q * 1e6)}" aria-label="Charge ${i + 1} in microcoulombs" /><span class="unit">μC</span></span>
            ${loc ? `<span class="badge ${loc}">${loc}</span>` : '<span></span>'}
          </li>`;
      })
      .join('');
    chargeList.innerHTML = html || '<li class="charge-item empty">No point charges</li>';
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
      setInput(item.querySelector('input[data-q]'), num(c.q * 1e6));
    });
  }
  renderCoords(state, fit);
}

/** Coordinates of the selected charge, the probe and (in Potential) point A, in typable boxes. */
function renderCoords(state, fit) {
  const host = document.getElementById('coord-block');
  if (!host) return;
  const { unit, per, step } = coordUnit();
  // Every charge, not just the selected one: matching a problem means typing the whole layout.
  const rows = (state.charges || [])
    .filter((c) => !c.small)
    .map((c, i) => ({ key: `charge:${c.id}`, name: `q<sub>${i + 1}</sub>`, p: c, id: c.id }));
  if (state.probe) rows.push({ key: 'probe', name: 'P', p: state.probe });
  if (state.pathA) rows.push({ key: 'pathA', name: 'A', p: state.pathA });

  const fitBtn = document.getElementById('btn-fit');
  if (fitBtn) fitBtn.hidden = !fit;
  const sig = `${state.lab}|${unit}|${rows.map((r) => r.key).join(',')}`;
  if (sig !== coordSig) {
    coordSig = sig;
    host.innerHTML = rows.length
      ? `<div class="coord-head"><span></span><span>x</span><span>y</span><span>z</span><span>${unit}</span></div>` +
        rows
          .map(
            (r) => `<div class="coord-row" data-point="${r.key}">
            <span class="coord-name">${r.name}</span>
            ${['x', 'y', 'z']
              .map((a) => `<input type="number" step="${step}" data-axis="${a}" aria-label="${a}" />`)
              .join('')}
            <span class="coord-unit">${unit}</span>
          </div>`,
          )
          .join('')
      : '';
  }
  for (const r of rows) {
    const el = host.querySelector(`[data-point="${r.key}"]`);
    if (!el) continue;
    el.classList.toggle('selected', r.id != null && r.id === state.selectedId);
    for (const a of ['x', 'y', 'z']) setInput(el.querySelector(`[data-axis="${a}"]`), num((r.p[a] || 0) * per));
  }
  const note = document.getElementById('scale-note');
  if (note) note.textContent = `1 square = ${lenLabel(1 / sceneScale())}`;
}
