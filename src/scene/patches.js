import * as THREE from 'three';
import { UNITS_PER_METER } from '../physics/constants.js';
import { M } from './manim.js';

const MAX = 2800;
const _m = new THREE.Matrix4();
const _p = new THREE.Vector3();
const _x = new THREE.Vector3();
const _y = new THREE.Vector3();
const _z = new THREE.Vector3();
const _s = new THREE.Vector3();
const _q = new THREE.Quaternion();
const _c = new THREE.Color();
const _b = new THREE.Color();

const NEUTRAL = new THREE.Color(0x2c2e33);
const OUT = new THREE.Color(M.yellow);
const IN = new THREE.Color(M.blue);

export class PatchView {
  constructor(scene) {
    this.group = new THREE.Group();
    scene.add(this.group);

    const geo = new THREE.PlaneGeometry(1, 1);
    const mat = new THREE.MeshBasicMaterial({
      transparent: true,
      opacity: 0.9,
      side: THREE.FrontSide,
      depthWrite: false,
      toneMapped: false,
    });
    this.mesh = new THREE.InstancedMesh(geo, mat, MAX);
    this.mesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
    this.mesh.frustumCulled = false;
    this.mesh.count = 0;
    this.group.add(this.mesh);

    this.wire = new THREE.Mesh(
      new THREE.SphereGeometry(1, 24, 16),
      new THREE.MeshBasicMaterial({
        color: M.blue,
        transparent: true,
        opacity: 0.3,
        wireframe: true,
      }),
    );
    this.group.add(this.wire);
    this._wireType = 'sphere';
  }

  setVisible(v) {
    this.group.visible = v;
  }

  syncWire(surface) {
    const u = UNITS_PER_METER;
    const o = surface.origin;
    this.wire.position.set(o.x * u, o.y * u, o.z * u);
    this.wire.rotation.set(0, 0, 0);
    const t = surface.type;
    if (t !== this._wireType) {
      this.wire.geometry.dispose();
      if (t === 'sphere') this.wire.geometry = new THREE.SphereGeometry(1, 28, 18);
      else if (t === 'cylinder' || t === 'pillbox') this.wire.geometry = new THREE.CylinderGeometry(1, 1, 1, 28, 1, false);
      else if (t === 'cube') this.wire.geometry = new THREE.BoxGeometry(1, 1, 1);
      else this.wire.geometry = new THREE.PlaneGeometry(1, 1);
      this._wireType = t;
    }
    if (t === 'sphere') {
      this.wire.scale.setScalar(surface.R * u);
    } else if (t === 'cylinder' || t === 'pillbox') {
      this.wire.scale.set(surface.R * u, surface.L * u, surface.R * u);
    } else if (t === 'cube') {
      const s = 2 * surface.R * u;
      this.wire.scale.set(s, s, s);
    } else {
      const s = 2 * surface.R * u;
      this.wire.scale.set(s, s, 1);
      this.wire.rotation.x = -(surface.tilt || 0);
    }
  }

  sync(patches, samples, anim, showFlux) {
    const n = Math.min(patches.length, MAX);
    this.mesh.count = n;
    const u = UNITS_PER_METER;
    const iCut = anim.playing ? Math.min(n, Math.floor(anim.i)) : n;
    const gap = 0.9;

    let maxEn = 1e-9;
    for (let i = 0; i < n; i++) {
      const a = Math.abs(samples[i].En);
      if (a > maxEn) maxEn = a;
    }

    for (let i = 0; i < n; i++) {
      const p = patches[i];
      _z.set(p.nx, p.ny, p.nz);
      _x.set(p.ux, p.uy, p.uz).normalize();
      _y.set(p.vx, p.vy, p.vz).normalize();
      _p.set(p.x * u, p.y * u, p.z * u);
      _s.set(Math.max(0.02, p.w * u * gap), Math.max(0.02, p.h * u * gap), 1);
      _m.makeBasis(_x, _y, _z);
      _q.setFromRotationMatrix(_m);
      _m.compose(_p, _q, _s);
      this.mesh.setMatrixAt(i, _m);

      if (!showFlux) {
        _c.set(M.blueE);
      } else if (anim.playing && i > iCut) {
        _c.set(0x16171a);
      } else if (anim.playing && i === iCut) {
        _c.set(0xffffff);
      } else {
        fluxColor(samples[i].En, maxEn, _c, _b);
      }
      this.mesh.setColorAt(i, _c);
    }
    this.mesh.instanceMatrix.needsUpdate = true;
    if (this.mesh.instanceColor) this.mesh.instanceColor.needsUpdate = true;
    this.mesh.material.opacity = showFlux ? 0.62 : 0.22;
    this.wire.visible = !showFlux;
  }
}

/** Diverging map: inward = BLUE, zero = charcoal, outward = YELLOW (sqrt for contrast at small |E·n|). */
function fluxColor(En, maxEn, out, tmp) {
  const t = Math.max(-1, Math.min(1, En / (maxEn + 1e-12)));
  const k = Math.sqrt(Math.abs(t));
  out.copy(NEUTRAL);
  tmp.copy(t >= 0 ? OUT : IN);
  out.lerp(tmp, k);
}

export { fluxColor };
