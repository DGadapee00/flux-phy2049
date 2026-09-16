import * as THREE from 'three';
import { ChargeView } from '../scene/charges.js';
import { PatchView } from '../scene/patches.js';
import { ArrowView } from '../scene/arrows.js';
import { FieldLineView } from '../scene/fieldLines.js';
import { ProbeView } from '../scene/probe.js';
import { ForceView } from '../scene/forces.js';
import { DistributionView } from '../scene/distribution.js';
import { EquipotentialView } from '../scene/equipotentials.js';
import { CapacitorView } from '../scene/capacitor.js';
import { CircuitView } from '../scene/circuit.js';
import { CSS2DObject } from 'three/addons/renderers/CSS2DRenderer.js';
import { M } from '../scene/manim.js';

/** Lazy view pool: a lab's first visit builds what it needs; exit hides, does not dispose. */
export function createViewPool(scene) {
  const made = {};
  function once(key, fn) {
    if (!made[key]) made[key] = fn();
    return made[key];
  }

  const pool = {
    charges: () => once('charges', () => new ChargeView(scene)),
    patches: () => once('patches', () => new PatchView(scene)),
    arrows: () => once('arrows', () => new ArrowView(scene)),
    lines: () => once('lines', () => new FieldLineView(scene)),
    probe: () => once('probe', () => new ProbeView(scene)),
    forces: () => once('forces', () => new ForceView(scene)),
    dist: () => once('dist', () => new DistributionView(scene)),
    equipot: () => once('equipot', () => new EquipotentialView(scene)),
    cap: () => once('cap', () => new CapacitorView(scene)),
    circuit: () => once('circuit', () => new CircuitView(scene)),
    pathA: () =>
      once('pathA', () => {
        const el = document.createElement('div');
        el.className = 'probe-label';
        el.textContent = 'A';
        const label = new CSS2DObject(el);
        const mesh = new THREE.Mesh(
          new THREE.SphereGeometry(0.09, 20, 14),
          new THREE.MeshBasicMaterial({ color: M.gold, toneMapped: false }),
        );
        label.position.set(0, 0.35, 0);
        mesh.add(label);
        scene.add(mesh);
        mesh.visible = false;
        return mesh;
      }),
    hideAll() {
      made.charges?.setVisible(false);
      made.patches?.setVisible(false);
      made.arrows?.setVisible(false);
      made.lines?.setVisible(false);
      made.probe?.setVisible(false);
      made.forces?.setVisible(false);
      made.dist?.setVisible(false);
      made.equipot?.setVisible(false);
      made.cap?.setVisible(false);
      made.circuit?.setVisible(false);
      if (made.pathA) made.pathA.visible = false;
      made.lines?.clear?.();
      made.forces?.clear?.();
      made.equipot?.clear?.();
    },
  };
  return pool;
}
