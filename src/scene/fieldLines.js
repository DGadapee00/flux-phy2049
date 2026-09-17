import * as THREE from 'three';
import { sceneScale } from '../engine/frame.js';
import { fieldAt, nearCharge, fieldMag } from '../physics/field.js';
import { fatLine, rampColor, disposeTree } from './manim.js';

function seedsOnSphere(c, n, r) {
  const pts = [];
  const off = 2 / n;
  const g = Math.PI * (3 - Math.sqrt(5));
  for (let i = 0; i < n; i++) {
    const y = 1 - (i + 0.5) * off;
    const rad = Math.sqrt(Math.max(0, 1 - y * y));
    const phi = i * g;
    pts.push({
      x: c.x + r * Math.cos(phi) * rad,
      y: c.y + r * y,
      z: c.z + r * Math.sin(phi) * rad,
    });
  }
  return pts;
}

/**
 * March along E from `start`. Every length here is in scene units divided by the scale, so a line
 * looks the same whether a grid square is a millimeter or a meter: 0.18 units per step, a stop at
 * 24 units out, and a stop within a third of a unit of a charge.
 */
function trace(start, charges, extraE, sign, u, soften, maxSteps = 140) {
  const ds = 0.18 / u;
  const far = (24 / u) ** 2;
  const near = 0.32 / u;
  const pts = [start.x, start.y, start.z];
  const mags = [fieldMag(fieldAt(start, charges, extraE, soften))];
  let x = start.x;
  let y = start.y;
  let z = start.z;
  for (let i = 0; i < maxSteps; i++) {
    const E = fieldAt({ x, y, z }, charges, extraE, soften);
    const mag = fieldMag(E);
    if (mag < 1e-6 * mags[0]) break;
    const inv = sign / mag;
    x += E.x * inv * ds;
    y += E.y * inv * ds;
    z += E.z * inv * ds;
    if (x * x + y * y + z * z > far) break;
    pts.push(x, y, z);
    mags.push(mag);
    if (nearCharge({ x, y, z }, charges, near) && i > 2) break;
  }
  return { pts, mags };
}

const _c = new THREE.Color();

export class FieldLineView {
  constructor(scene) {
    this.group = new THREE.Group();
    scene.add(this.group);
    this.lines = [];
  }

  setVisible(v) {
    this.group.visible = v;
  }

  clear() {
    for (const ln of this.lines) {
      this.group.remove(ln);
      disposeTree(ln);
    }
    this.lines.length = 0;
  }

  rebuild(charges, extraE, soften) {
    this.clear();
    if (!charges.length) return;
    const u = sceneScale();
    const positives = charges.filter((c) => c.q > 0);
    const negatives = charges.filter((c) => c.q < 0);
    const sources = positives.length ? positives : negatives;
    const sign = positives.length ? 1 : -1;

    const traces = [];
    let hot = 1e-12;
    for (const c of sources) {
      const n = Math.max(14, Math.min(28, Math.round(16 * Math.abs(c.q) * 1e6)));
      for (const s of seedsOnSphere(c, n, 0.44 / u)) {
        const t = trace(s, charges, extraE, sign, u, soften);
        if (t.pts.length < 12) continue;
        traces.push(t);
        hot = Math.max(hot, t.mags[0]);
      }
    }

    // Color by |E| along the line, over three decades below the strongest line's start: the 3b1b
    // "hot near the source, cool far away" look, keyed to this scene rather than to absolute N/C.
    const top = Math.log10(hot);
    for (const { pts, mags } of traces) {
      const pos = pts.map((v) => v * u);
      const colors = [];
      for (const m of mags) {
        rampColor((Math.log10(Math.max(m, 1e-12)) - (top - 3.2)) / 3.2, _c);
        colors.push(_c.r, _c.g, _c.b);
      }
      const line = fatLine(pos, { colors, width: 2.2, opacity: 0.92 });
      this.group.add(line);
      this.lines.push(line);
    }
  }
}
