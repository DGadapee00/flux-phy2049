/**
 * The free space: the part of the canvas no panel covers, measured each frame by main.js. Framing
 * code asks it how wide the picture can be, so a lab fits between the panels rather than under them.
 * No DOM here; before the first measurement (or in node) it falls back to 55% of the window.
 */
let free = null;

export function setFreeRect(r) {
  free = r;
}

/** Width of the free space over the full canvas height: the aspect a flat lab's framing must fit. */
export function freeAspect() {
  if (free) return (free.right - free.left) / Math.max(1, free.H);
  if (typeof window === 'undefined') return 0.88;
  return (0.55 * window.innerWidth) / Math.max(1, window.innerHeight);
}

/** The free space's width over the window height at 1440×900, where every lab was framed by eye. */
export const DESIGN_FREE = 0.83;
