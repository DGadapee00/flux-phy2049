import * as THREE from 'three';
import { sceneScale } from '../engine/frame.js';
import { allForces, pairForce } from '../physics/field.js';
import { Arrow, M, Q, disposeTree, markAnswer } from './manim.js';

const _dir = new THREE.Vector3();

export class ForceView {
  constructor(scene) {
    this.group = new THREE.Group();
    scene.add(this.group);
    this.net = [];
    this.pairs = [];
  }

  setVisible(v) {
    this.group.visible = v;
  }

  clear() {
    while (this.group.children.length) {
      const ch = this.group.children[0];
      this.group.remove(ch);
      disposeTree(ch);
    }
    this.net = [];
    this.pairs = [];
  }

  rebuild(charges, selectedId, soften) {
    this.clear();
    if (charges.length < 2) return;
    const u = sceneScale();
    const forces = allForces(charges, soften);

    for (let i = 0; i < charges.length; i++) {
      for (let j = i + 1; j < charges.length; j++) {
        const F = pairForce(charges[i], charges[j]);
        this.addPair(charges[i], F, u, M.grey);
        this.addPair(charges[j], { x: -F.x, y: -F.y, z: -F.z }, u, M.grey);
      }
    }

    for (let i = 0; i < charges.length; i++) {
      const c = charges[i];
      const F = forces[i];
      const mag = Math.hypot(F.x, F.y, F.z);
      if (mag < 1e-12) continue;
      const color = c.id === selectedId ? Q.select : Q.F;
      this.addArrow(c, F, u, color, c.id === selectedId ? 1.15 : 0.85);
    }
  }

  addPair(c, F, u, color) {
    this.addArrow(c, F, u, color, 0.55);
  }

  addArrow(c, F, u, color, scale) {
    const mag = Math.hypot(F.x, F.y, F.z);
    if (mag < 1e-14) return;
    _dir.set(F.x, F.y, F.z).normalize();
    const L = (0.22 + 0.38 * Math.tanh(mag / 0.25)) * u * scale;
    const origin = new THREE.Vector3(c.x * u, c.y * u, c.z * u);
    const arrow = markAnswer(new Arrow(_dir.clone(), origin, L, color, 0.26, 0.18, 0.03 * Math.max(0.8, scale)));
    this.group.add(arrow);
  }
}
