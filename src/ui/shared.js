import katex from 'katex';

const TEX_MACROS = {
  '\\qV': '\\textcolor{#58C4DD}{V}',
  '\\qI': '\\textcolor{#F4D345}{I}',
  '\\qR': '\\textcolor{#83C167}{R}',
  '\\qP': '\\textcolor{#FC6255}{P}',
};

const texCache = new Map();

export function tex(src) {
  let html = texCache.get(src);
  if (!html) {
    html = katex.renderToString(src, { throwOnError: false, displayMode: false, macros: TEX_MACROS });
    texCache.set(src, html);
  }
  return html;
}

export function kv(k, v) {
  return `<div class="row"><span class="k">${k}</span><span class="v">${v}</span></div>`;
}

export function qv(cls, v) {
  return `<span class="${cls}">${v}</span>`;
}

export function cells(items) {
  return items
    .map(
      ([label, value, cls]) =>
        `<div class="cell"><div class="label">${label}</div><div class="value ${cls || ''}">${value}</div></div>`,
    )
    .join('');
}

export function matchClass(pct) {
  if (pct >= 97) return 'ok';
  if (pct >= 90) return 'warn';
  return 'bad';
}

export function setLawEl(el, lines) {
  el.innerHTML = (lines || []).map((l) => `<div class="law-row">${tex(l)}</div>`).join('');
}
