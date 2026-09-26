import * as THREE from 'three';
import { CSS2DObject } from 'three/addons/renderers/CSS2DRenderer.js';
import { Arrow, M, fatLine, disposeTree, markAnswer } from './manim.js';
import { freeAspect } from '../engine/viewport.js';

/**
 * Shared drawing for the Mirrors and Lenses labs: an optical axis in centimeters, scaled by U scene
 * units per cm, drawn flat in the xy-plane and viewed by a locked camera looking down −z.
 */
export const U = 0.1;

export const RAY_COLORS = [M.gold, M.teal, M.blue];

export function wipe(g) {
  while (g.children.length) {
    const ch = g.children[0];
    g.remove(ch);
    disposeTree(ch);
  }
}

export function label(html, x, y, cls = 'circuit-label') {
  const el = document.createElement('div');
  el.className = cls;
  el.innerHTML = html;
  const o = new CSS2DObject(el);
  o.position.set(x * U, y * U, 0.04);
  return o;
}

export function line(pts, opts) {
  const flat = [];
  for (const p of pts) flat.push(p.x * U, p.y * U, 0);
  const l = fatLine(flat, opts);
  if (opts?.dashed) l.computeLineDistances();
  return l;
}

/** Upright or inverted arrow standing on the axis at x (object / image). */
export function arrowAt(x, h, color) {
  const dir = new THREE.Vector3(0, Math.sign(h) || 1, 0);
  const len = Math.max(0.12, Math.abs(h) * U);
  return new Arrow(dir, new THREE.Vector3(x * U, 0, 0.01), len, color, Math.min(0.3, len * 0.4), 0.22, 0.03);
}

export function tick(group, x, text, color = M.white) {
  group.add(line([{ x, y: -0.8 }, { x, y: 0.8 }], { color, width: 2 }));
  group.add(label(text, x, -2.6));
}

/**
 * Draw a principal-ray bundle from optics.principalRays: solid real rays (incoming and outgoing),
 * dashed backward extensions to a virtual image.
 *
 * What happens after the mirror or lens is the answer to "where is the image and what is it like",
 * so the outgoing rays and extensions go on the answer layer: while a problem is unsolved the
 * student sees the rays arrive and draws the rest.
 */
export function drawBundle(group, bundle) {
  bundle.rays.forEach((r, i) => {
    const color = RAY_COLORS[i % RAY_COLORS.length];
    group.add(line(r.incoming, { color, width: 2.4 }));
    group.add(markAnswer(line(r.outgoing, { color, width: 2.4 })));
    if (r.extension) group.add(markAnswer(line(r.extension, { color, width: 1.6, opacity: 0.75, dashed: true })));
  });
}

/** An image and its caption: answers, so they wait for the problem to be solved. */
export function imageMark(group, x, h, color, caption, captionY) {
  group.add(markAnswer(arrowAt(x, h, color)));
  group.add(markAnswer(label(caption, x, captionY)));
}

/**
 * Camera that frames every x of interest (cm) between the side panels.
 * It fits the free space between the HUD panels, measured each frame by main.js.
 */
export function frameCamera(xs, hs) {
  const finite = xs.filter(Number.isFinite).map((x) => Math.max(-150, Math.min(150, x)));
  const xmin = Math.min(...finite) - 6;
  const xmax = Math.max(...finite) + 6;
  const hmax = Math.max(8, ...hs.filter(Number.isFinite).map((h) => Math.min(60, Math.abs(h))));
  const width = (xmax - xmin) * U;
  const height = 2 * (hmax + 5) * U;
  const tan = Math.tan((20 * Math.PI) / 180);
  // Fit the free space between the panels (src/engine/viewport.js), not the whole window.
  const D = Math.max(8, width / (2 * tan * freeAspect()), height / (2 * tan * 0.8));
  const cx = ((xmin + xmax) / 2) * U;
  return { pos: new THREE.Vector3(cx, 0.1, Math.min(45, D)), target: new THREE.Vector3(cx, 0.1, 0) };
}
