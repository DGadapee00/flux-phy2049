import * as THREE from 'three';
import { sceneScale } from '../engine/frame.js';
import { contourLines } from '../physics/potential.js';
import { fatSegments, rampColor, disposeTree } from './manim.js';

export class EquipotentialView {
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

  rebuild(charges, extraE, opts) {
    this.clear();
    const u = sceneScale();
    const { lines, vmin, vmax } = contourLines(charges, extraE, opts);
    const span = Math.max(1e-9, vmax - vmin);
    for (const band of lines) {
      const t = band.t ?? (band.level - vmin) / span;
      const color = rampColor(t, new THREE.Color());
      const positions = [];
      for (const [a, b] of band.segs) {
        positions.push(a.x * u, a.y * u + 0.02, a.z * u, b.x * u, b.y * u + 0.02, b.z * u);
      }
      if (!positions.length) continue;
      const ln = fatSegments(positions, { color, width: 2, opacity: 0.9 });
      this.group.add(ln);
      this.lines.push(ln);
    }
  }
}
