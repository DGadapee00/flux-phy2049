import * as THREE from 'three';
import { fatLine, setFatSegments, segmentCapacity, M, POS_COLOR, disposeTree } from './manim.js';

/**
 * A charged body facing a grounded electrode, and the arc between them when the gap lets go.
 *
 * The geometry is deliberately the simplest thing that carries the physics: a sphere at potential
 * V and a flat grounded plate a gap away. Everything the lab reports depends on V, the gap, the
 * pressure and the gas — not on how the body got charged — so there is nothing here pretending to
 * model a sweater.
 */
const SEGMENTS = 14;

export class SparkView {
  constructor(scene) {
    this.group = new THREE.Group();
    scene.add(this.group);

    this.body = new THREE.Mesh(
      new THREE.SphereGeometry(1, 40, 28),
      new THREE.MeshStandardMaterial({ color: POS_COLOR, emissive: POS_COLOR, emissiveIntensity: 0.25, roughness: 0.45, metalness: 0.3 }),
    );
    this.plate = new THREE.Mesh(
      new THREE.BoxGeometry(1, 1, 1),
      new THREE.MeshStandardMaterial({ color: 0x8b9199, roughness: 0.35, metalness: 0.75 }),
    );
    this.glow = new THREE.Mesh(
      new THREE.SphereGeometry(1, 24, 16),
      new THREE.MeshBasicMaterial({ color: M.yellow, transparent: true, opacity: 0, depthWrite: false, toneMapped: false }),
    );
    // Capacity is fixed up front: a Line2's buffers cannot grow once it has been drawn.
    this.arc = fatLine(segmentCapacity(SEGMENTS), { color: M.white, width: 3, opacity: 0 });
    this.group.add(this.body, this.plate, this.glow, this.arc);
    this.group.visible = false;
  }

  setVisible(v) {
    this.group.visible = v;
  }

  /**
   * Drawn geometry, not physical geometry.
   *
   * A doorknob gap is four millimetres against a body something like a third of a metre — a
   * hundred to one. Drawn honestly the gap is smaller than a pixel and the only thing worth
   * looking at is invisible, so `r` and `g` arrive already mapped for the screen (the lab puts the
   * gap on a log scale across the slider's range) and the panels carry the real numbers. The same
   * bargain the optics benches make: the geometry is stretched, the physics is not.
   */
  sync({ r, g, sparks, heat, t }) {
    this.body.scale.setScalar(r);
    this.body.position.set(-r, 0, 0);
    this.plate.scale.set(0.18 * r, 2.1 * r, 2.1 * r);
    this.plate.position.set(g + 0.09 * r, 0, 0);

    this.glow.scale.setScalar(r * 1.06);
    this.glow.position.copy(this.body.position);
    this.glow.material.opacity = sparks ? 0.18 + 0.1 * Math.sin(t * 22) : 0.04 * Math.min(1, heat);

    if (!sparks) {
      this.arc.material.opacity = 0;
      return;
    }
    // A jagged path across the gap, reseeded each frame so the arc flickers the way a real one does.
    const flat = [];
    const x0 = 0;
    const x1 = g;
    void heat;
    let px = x0;
    let py = 0;
    let pz = 0;
    for (let i = 1; i <= SEGMENTS; i++) {
      const f = i / SEGMENTS;
      const spread = Math.sin(Math.PI * f) * g * 0.28;
      const nx = x0 + (x1 - x0) * f;
      const ny = i === SEGMENTS ? 0 : (Math.random() - 0.5) * spread;
      const nz = i === SEGMENTS ? 0 : (Math.random() - 0.5) * spread;
      flat.push(px, py, pz, nx, ny, nz);
      px = nx;
      py = ny;
      pz = nz;
    }
    setFatSegments(this.arc, flat);
    this.arc.material.opacity = 0.75 + 0.25 * Math.random();
  }

  dispose() {
    disposeTree(this.group);
  }
}
