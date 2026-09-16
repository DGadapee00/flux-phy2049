import * as THREE from 'three';
import { UNITS_PER_METER } from '../physics/constants.js';
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

function trace(start, charges, extraE, sign, maxSteps = 140, ds = 0.022) {
  const pts = [start.x, start.y, start.z];
  const mags = [fieldMag(fieldAt(start, charges, extraE))];
  let x = start.x;
  let y = start.y;
  let z = start.z;
  for (let i = 0; i < maxSteps; i++) {
    const E = fieldAt({ x, y, z }, charges, extraE);
    const mag = fieldMag(E);
    if (mag < 400) break;
    const inv = sign / mag;
    x += E.x * inv * ds;
    y += E.y * inv * ds;
    z += E.z * inv * ds;
    if (x * x + y * y + z * z > 9) break;
    pts.push(x, y, z);
    mags.push(mag);
    if (nearCharge({ x, y, z }, charges, 0.04) && i > 2) break;
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

  rebuild(charges, extraE) {
    this.clear();
    if (!charges.length) return;
    const u = UNITS_PER_METER;
    const positives = charges.filter((c) => c.q > 0);
    const negatives = charges.filter((c) => c.q < 0);
    const sources = positives.length ? positives : negatives;
    const sign = positives.length ? 1 : -1;

    for (const c of sources) {
      const n = Math.max(14, Math.min(28, Math.round(16 * Math.abs(c.q) * 1e6)));
      const seeds = seedsOnSphere(c, n, 0.055);
      for (const s of seeds) {
        const { pts, mags } = trace(s, charges, extraE, sign);
        if (pts.length < 12) continue;
        const pos = pts.map((v) => v * u);
        // Color by log|E| along the line: the 3b1b "hot near the source, cool far away" look.
        const colors = [];
        for (const m of mags) {
          rampColor((Math.log10(Math.max(m, 400)) - 3.4) / 3.2, _c);
          colors.push(_c.r, _c.g, _c.b);
        }
        const line = fatLine(pos, { colors, width: 2.2, opacity: 0.92 });
        this.group.add(line);
        this.lines.push(line);
      }
    }
  }
}
