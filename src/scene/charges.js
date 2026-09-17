import * as THREE from 'three';
import { CSS2DObject } from 'three/addons/renderers/CSS2DRenderer.js';
import { sceneScale } from '../engine/frame.js';
import { fmtCharge } from '../ui/format.js';
import { POS_COLOR, NEG_COLOR, M, makeChargeTexture, fatLine } from './manim.js';

export class ChargeView {
  constructor(scene) {
    this.group = new THREE.Group();
    scene.add(this.group);
    this.map = new Map();
    this.texPos = makeChargeTexture(POS_COLOR, 1);
    this.texNeg = makeChargeTexture(NEG_COLOR, -1);
    this.geo = new THREE.SphereGeometry(1, 16, 12);
  }

  sync(charges, selectedId) {
    const seen = new Set();
    for (const c of charges) {
      seen.add(c.id);
      let rec = this.map.get(c.id);
      if (!rec) {
        rec = this.spawn(c);
        this.map.set(c.id, rec);
      }
      this.update(rec, c, c.id === selectedId);
    }
    for (const [id, rec] of this.map) {
      if (!seen.has(id)) {
        rec.el.remove();
        this.group.remove(rec.root);
        rec.ring.geometry.dispose();
        rec.ring.material.dispose();
        rec.stem.geometry.dispose();
        rec.stem.material.dispose();
        rec.discMat.dispose();
        rec.mat.dispose();
        this.map.delete(id);
      }
    }
  }

  spawn(c) {
    const root = new THREE.Group();
    const pos = c.q >= 0;
    // Invisible pick target; the visible charge is the flat disc sprite.
    const mat = new THREE.MeshBasicMaterial({ colorWrite: false, depthWrite: false });
    const mesh = new THREE.Mesh(this.geo, mat);
    mesh.userData.chargeId = c.id;
    const discMat = new THREE.SpriteMaterial({
      map: pos ? this.texPos : this.texNeg,
      transparent: true,
      depthWrite: false,
      toneMapped: false,
    });
    const disc = new THREE.Sprite(discMat);
    disc.renderOrder = 5;

    const pts = [];
    for (let i = 0; i <= 64; i++) {
      const a = (i / 64) * Math.PI * 2;
      pts.push(Math.cos(a), 0, Math.sin(a));
    }
    const ring = fatLine(pts, { color: M.accent, width: 1.4, opacity: 0.8 });
    ring.visible = false;

    // Drop line to the floor so height reads clearly in 3D.
    const stem = fatLine([0, 0, 0, 0, -1, 0], { color: M.white, width: 1.2, opacity: 0.35, dashed: true });

    const el = document.createElement('div');
    el.className = 'charge-label';
    const label = new CSS2DObject(el);

    root.add(mesh, disc, ring, stem, label);
    this.group.add(root);
    return { root, mesh, disc, ring, stem, label, el, mat, discMat, sign: pos };
  }

  update(rec, c, selected) {
    const pos = c.q >= 0;
    if (pos !== rec.sign) {
      rec.sign = pos;
      rec.discMat.map = pos ? this.texPos : this.texNeg;
      rec.discMat.needsUpdate = true;
    }
    const u = sceneScale();
    rec.root.position.set(c.x * u, c.y * u, c.z * u);
    const r = (c.small ? 0.12 : 0.22) * (0.85 + 0.15 * Math.min(3, Math.abs(c.q) * 1e6));
    rec.mesh.scale.setScalar(r * 1.15);
    rec.disc.scale.setScalar(r * 3.4);
    rec.ring.scale.setScalar(r * 1.55);
    rec.ring.visible = selected;
    const h = c.y * u;
    rec.stem.visible = !c.small && Math.abs(h) > 0.05;
    rec.stem.scale.set(1, h, 1);
    rec.label.position.set(0, r * 2.6, 0);
    rec.el.textContent = fmtCharge(c.q);
    rec.el.className = `charge-label ${pos ? 'pos' : 'neg'}${selected ? ' selected' : ''}${c.small ? ' small' : ''}`;
    rec.mesh.userData.chargeId = c.id;
  }

  pick(raycaster) {
    if (!this.group.visible) return null;
    const meshes = [];
    for (const rec of this.map.values()) meshes.push(rec.mesh);
    const hits = raycaster.intersectObjects(meshes, false);
    if (!hits.length) return null;
    return hits[0].object.userData.chargeId ?? null;
  }

  setVisible(v) {
    this.group.visible = v;
  }
}
