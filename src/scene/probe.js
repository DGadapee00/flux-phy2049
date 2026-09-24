import * as THREE from 'three';
import { CSS2DObject } from 'three/addons/renderers/CSS2DRenderer.js';
import { sceneScale } from '../engine/frame.js';
import { fmtE } from '../ui/format.js';
import { Arrow, M, markAnswer } from './manim.js';

export class ProbeView {
  constructor(scene) {
    this.group = new THREE.Group();
    scene.add(this.group);

    const core = new THREE.Mesh(
      new THREE.SphereGeometry(0.09, 20, 14),
      new THREE.MeshBasicMaterial({ color: M.white, toneMapped: false }),
    );
    this.group.add(core);
    this.core = core;

    this.arrow = markAnswer(new Arrow(new THREE.Vector3(1, 0, 0), new THREE.Vector3(0, 0, 0), 1, M.yellow, 0.3, 0.2, 0.04));
    this.group.add(this.arrow);

    this.el = document.createElement('div');
    this.el.className = 'probe-label';
    this.label = new CSS2DObject(this.el);
    this.label.position.set(0, 0.35, 0);
    this.group.add(this.label);

    this._dir = new THREE.Vector3();
  }

  setVisible(v) {
    this.group.visible = v;
  }

  /**
   * A probe that stands for one of a problem's named charges is drawn as that charge by the lab: the
   * white dot goes, and the label hangs below, clear of the charge's own label above.
   */
  setAsCharge(on) {
    if (this._asCharge === on) return;
    this._asCharge = on;
    this.core.visible = !on;
    this.label.center.set(0.5, on ? 0 : 0.5);
    this.label.position.set(0, on ? -0.5 : 0.35, 0);
  }

  sync(probe, E, extra = '') {
    const u = sceneScale();
    this.group.position.set(probe.x * u, probe.y * u, probe.z * u);
    const mag = Math.hypot(E.x, E.y, E.z);
    if (mag < 1e-8) {
      this.arrow.visible = false;
      this.el.textContent = extra || 'E = 0';
      return;
    }
    this.arrow.visible = true;
    this._dir.set(E.x, E.y, E.z).normalize();
    // Capped at ~3.6 units so the arrow stays on screen next to the probe label.
    const L = (0.2 + 0.25 * Math.tanh(mag / 8e4)) * u;
    this.arrow.setDirection(this._dir);
    this.arrow.setLength(L, 0.3, 0.2);
    this.el.textContent = extra ? extra : `|E| = ${fmtE(mag)}`;
  }
}
