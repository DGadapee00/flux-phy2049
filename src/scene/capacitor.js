import * as THREE from 'three';
import { CSS2DObject } from 'three/addons/renderers/CSS2DRenderer.js';
import { sceneScale } from '../engine/frame.js';
import { Arrow, M, Q, POS_COLOR, NEG_COLOR, disposeTree } from './manim.js';

export class CapacitorView {
  constructor(scene) {
    this.group = new THREE.Group();
    scene.add(this.group);
    this.plus = null;
    this.minus = null;
    this.dielectric = null;
    this.field = [];
    this.equi = [];
    this.labels = [];
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
    this.field = [];
    this.equi = [];
    this.labels = [];
  }

  rebuild(cap, result) {
    this.clear();
    const u = sceneScale();
    const side = Math.min(Math.max(result.side, 0.18), 0.55);
    const d = Math.max(cap.d, 0.08);
    const thick = Math.max(0.008, side * 0.04);
    const plateGeo = new THREE.BoxGeometry(thick * u, side * u, side * u);
    const plateMat = (color) =>
      new THREE.MeshStandardMaterial({
        color,
        emissive: color,
        emissiveIntensity: 0.25,
        metalness: 0.1,
        roughness: 0.6,
      });
    this.plus = new THREE.Mesh(plateGeo, plateMat(POS_COLOR));
    this.minus = new THREE.Mesh(plateGeo.clone(), plateMat(NEG_COLOR));
    this.plus.position.set((-d / 2) * u, 0, 0);
    this.minus.position.set((d / 2) * u, 0, 0);
    this.group.add(this.plus, this.minus);

    this.addLabel('+', (-d / 2) * u, (side / 2) * u + 0.25, 0, 'pos');
    this.addLabel('−', (d / 2) * u, (side / 2) * u + 0.25, 0, 'neg');
    this.addLabel(`V = ${result.V.toFixed(2)} V`, 0, (side / 2) * u + 0.55, 0, 'probe-label');

    if (cap.inserted !== false && result.kappa > 1.01) {
      const fill = cap.fill ?? 1;
      const gap = d - thick;
      const die = new THREE.Mesh(
        new THREE.BoxGeometry(Math.max(0.02, gap * 0.92) * u, side * fill * u, side * fill * u),
        new THREE.MeshStandardMaterial({
          color: M.green,
          transparent: true,
          opacity: 0.2,
          roughness: 0.8,
          depthWrite: false,
        }),
      );
      this.group.add(die);
      this.dielectric = die;
      // Below the slab, clear of the field arrows that run through it.
      this.addLabel(`κ = ${result.kappa}`, 0, -(side / 2) * u - 0.35, 0, 'probe-label');
    }

    // A 3 × 3 grid reads as field lines; a denser one, seen nearly edge-on, merges into a comb.
    // Arrow length follows E: with the battery connected E = V/d is unchanged when the dielectric
    // goes in, but on isolated plates it drops to E/κ — the arrows shrink, which is the lesson.
    const n = 3;
    const Edir = new THREE.Vector3(1, 0, 0);
    const ratio = cap.mode === 'isolated' && result.E_vac_sameQ > 0 ? result.E / result.E_vac_sameQ : 1;
    const L = d * 0.72 * u * Math.max(0.2, Math.min(1, ratio));
    for (let i = 0; i < n; i++) {
      for (let j = 0; j < n; j++) {
        const y = ((i + 0.5) / n - 0.5) * side * 0.7;
        const z = ((j + 0.5) / n - 0.5) * side * 0.7;
        const origin = new THREE.Vector3((-d / 2 + 0.08 * d) * u, y * u, z * u);
        // Heads scale with the arrow, so a short (weak-field) arrow stays an arrow, not a blob.
        const arrow = new Arrow(Edir.clone(), origin, L, result.breakdown ? M.red : Q.E, Math.min(0.2, L * 0.3), Math.min(0.14, L * 0.2), 0.022);
        this.group.add(arrow);
        this.field.push(arrow);
      }
    }

    const nEq = 4;
    for (let k = 1; k < nEq; k++) {
      const x = -d / 2 + (k * d) / nEq;
      const plane = new THREE.Mesh(
        new THREE.PlaneGeometry(side * 0.85 * u, side * 0.85 * u),
        new THREE.MeshBasicMaterial({
          color: M.teal,
          transparent: true,
          opacity: 0.1,
          side: THREE.DoubleSide,
          depthWrite: false,
        }),
      );
      plane.rotation.y = Math.PI / 2;
      plane.position.set(x * u, 0, 0);
      this.group.add(plane);
      this.equi.push(plane);
    }
  }

  addLabel(text, x, y, z, cls) {
    const el = document.createElement('div');
    el.className = cls === 'pos' || cls === 'neg' ? `charge-label ${cls}` : cls;
    el.textContent = text;
    const obj = new CSS2DObject(el);
    obj.position.set(x, y, z);
    this.group.add(obj);
    this.labels.push(obj);
  }
}
