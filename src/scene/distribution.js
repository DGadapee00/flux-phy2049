import * as THREE from 'three';
import { CSS2DObject } from 'three/addons/renderers/CSS2DRenderer.js';
import { sceneScale } from '../engine/frame.js';
import {
  linePerpNumerical,
  ringAxisNumerical,
  diskAxisNumerical,
  linePerpPotentialNumerical,
  ringAxisPotentialNumerical,
  diskAxisPotentialNumerical,
} from '../physics/analytic.js';
import { Arrow, M, POS_COLOR, NEG_COLOR, fatLine, disposeTree, makeChargeTexture, markAnswer } from './manim.js';

const _dir = new THREE.Vector3();

export class DistributionView {
  constructor(scene) {
    this.group = new THREE.Group();
    scene.add(this.group);
    this.texPos = makeChargeTexture(POS_COLOR, 0);
    this.texNeg = makeChargeTexture(NEG_COLOR, 0);
    this.pieces = [];
    this.dqMeshes = [];
    this.rLines = [];
    this.dE = [];
    this.body = null;
    this.probe = null;
    this.net = null;
    this.labelEl = document.createElement('div');
    this.labelEl.className = 'probe-label';
    this.label = new CSS2DObject(this.labelEl);
    this.group.add(this.label);
  }

  setVisible(v) {
    this.group.visible = v;
  }

  clear() {
    for (const o of [...this.dqMeshes, ...this.rLines, ...this.dE, this.body, this.probe, this.net]) {
      if (!o) continue;
      this.group.remove(o);
      disposeTree(o);
    }
    this.dqMeshes = [];
    this.rLines = [];
    this.dE = [];
    this.body = null;
    this.probe = null;
    this.net = null;
  }

  rebuild(integral, animIndex = Infinity) {
    this.clear();
    const u = sceneScale();
    const n = Math.max(6, Math.round(integral.n));
    const wantV = integral.quantity === 'V';
    const positive = (integral.kind === 'ring' ? integral.Q : integral.lambda) >= 0;
    const bodyColor = positive ? POS_COLOR : NEG_COLOR;
    const bodyMat = () =>
      new THREE.MeshStandardMaterial({
        color: bodyColor,
        emissive: bodyColor,
        emissiveIntensity: 0.3,
        roughness: 0.6,
        transparent: true,
        opacity: 0.45,
        depthWrite: false,
      });
    let data;
    let annuli = null;
    if (integral.kind === 'disk') {
      data = wantV
        ? diskAxisPotentialNumerical(integral.Q, integral.R, integral.y, n)
        : diskAxisNumerical(integral.Q, integral.R, integral.y, n);
      // The plate itself, then one outline per radial slice: the picture of ∫ 2πσ s ds.
      const plate = new THREE.Mesh(new THREE.CylinderGeometry(integral.R * u, integral.R * u, 0.012 * u, 72), bodyMat());
      this.group.add(plate);
      this.body = plate;
      annuli = data.pieces.map((pc) => pc.s);
    } else if (integral.kind === 'ring') {
      const span = integral.span ?? 2 * Math.PI;
      data = wantV
        ? ringAxisPotentialNumerical(integral.Q, integral.a, integral.y, n, span)
        : ringAxisNumerical(integral.Q, integral.a, integral.y, n, span);
      const seg = Math.max(8, Math.round((96 * span) / (2 * Math.PI)));
      const geo = new THREE.TorusGeometry(integral.a * u, 0.035 * u, 12, seg, span);
      // The torus sweeps from its local +x; rotate it back by half so a partial arc stays centred
      // on +x, which is where the physics puts the symmetry axis.
      geo.rotateZ(-span / 2);
      const torus = new THREE.Mesh(geo, bodyMat());
      torus.rotation.x = Math.PI / 2;
      this.group.add(torus);
      this.body = torus;
    } else {
      data = wantV
        ? linePerpPotentialNumerical(integral.lambda, integral.L, integral.d, n, integral.x0 || 0)
        : linePerpNumerical(integral.lambda, integral.L, integral.d, n, integral.x0 || 0);
      const rod = new THREE.Mesh(new THREE.CylinderGeometry(0.03 * u, 0.03 * u, integral.L * u, 20), bodyMat());
      rod.rotation.z = Math.PI / 2;
      this.group.add(rod);
      this.body = rod;
    }

    const onAxis = integral.kind === 'ring' || integral.kind === 'disk';
    const P = {
      x: onAxis ? 0 : integral.x0 || 0,
      y: onAxis ? integral.y : integral.d,
      z: 0,
    };
    const probe = new THREE.Mesh(
      new THREE.SphereGeometry(0.09, 20, 14),
      new THREE.MeshBasicMaterial({ color: M.white, toneMapped: false }),
    );
    probe.position.set(P.x * u, P.y * u, P.z * u);
    this.group.add(probe);
    this.probe = probe;
    this.label.position.copy(probe.position);
    this.label.position.y += 0.35;

    const cut = Number.isFinite(animIndex) ? Math.min(data.pieces.length, Math.max(0, Math.floor(animIndex))) : data.pieces.length;

    if (annuli) {
      for (let i = 0; i < annuli.length; i++) {
        const active = i < cut;
        const ring = new THREE.Mesh(
          new THREE.TorusGeometry(Math.max(1e-4, annuli[i]) * u, 0.006 * u, 6, 64),
          new THREE.MeshBasicMaterial({
            color: i === cut - 1 ? M.white : positive ? POS_COLOR : NEG_COLOR,
            transparent: true,
            opacity: active ? (i === cut - 1 ? 1 : 0.55) : 0.12,
            toneMapped: false,
            depthWrite: false,
          }),
        );
        ring.rotation.x = Math.PI / 2;
        this.group.add(ring);
        this.dqMeshes.push(ring);
      }
    }

    for (let i = 0; i < data.pieces.length; i++) {
      const pc = data.pieces[i];
      const active = i < cut;
      const current = i === cut - 1;
      const sprite = new THREE.Sprite(
        new THREE.SpriteMaterial({
          map: positive ? this.texPos : this.texNeg,
          transparent: true,
          depthWrite: false,
          toneMapped: false,
          opacity: active ? 1 : 0.25,
        }),
      );
      sprite.position.set(pc.x * u, pc.y * u, pc.z * u);
      sprite.renderOrder = 4;
      // Diameter stays under the slice spacing so neighbouring dq discs do not merge into a bar.
      sprite.scale.setScalar((current ? 0.08 : 0.05) * u);
      this.group.add(sprite);
      this.dqMeshes.push(sprite);

      const line = fatLine([pc.x * u, pc.y * u, pc.z * u, P.x * u, P.y * u, P.z * u], {
        color: current ? M.white : M.grey,
        width: current ? 2.5 : 1.2,
        opacity: active ? (current ? 1 : 0.35) : 0.08,
      });
      this.group.add(line);
      this.rLines.push(line);

      const mag = Math.hypot(pc.dE?.x || 0, pc.dE?.y || 0, pc.dE?.z || 0);
      if (!wantV && mag > 0 && active) {
        _dir.set(pc.dE.x, pc.dE.y, pc.dE.z).normalize();
        const mid = new THREE.Vector3(
          (pc.x * 0.35 + P.x * 0.65) * u,
          (pc.y * 0.35 + P.y * 0.65) * u,
          (pc.z * 0.35 + P.z * 0.65) * u,
        );
        const L = (0.18 + 0.35 * Math.tanh(mag / 4e4)) * u;
        const color = Math.abs(pc.dE.x) > Math.abs(pc.dE.y) * 0.7 ? M.blue : M.gold;
        const arrow = new Arrow(_dir.clone(), mid, L, current ? M.white : color, 0.18, 0.12, 0.018);
        this.group.add(arrow);
        this.dE.push(arrow);
      }
    }

    let Ex = 0;
    let Ey = 0;
    let Ez = 0;
    let Vacc = 0;
    for (let i = 0; i < cut; i++) {
      if (data.pieces[i].dE) {
        Ex += data.pieces[i].dE.x;
        Ey += data.pieces[i].dE.y;
        Ez += data.pieces[i].dE.z;
      }
      if (data.pieces[i].dV) Vacc += data.pieces[i].dV;
    }
    const mag = Math.hypot(Ex, Ey, Ez);
    if (!wantV && mag > 1) {
      _dir.set(Ex, Ey, Ez).normalize();
      const origin = new THREE.Vector3(P.x * u, P.y * u, P.z * u);
      const L = (0.4 + 0.8 * Math.tanh(mag / 6e4)) * u;
      this.net = markAnswer(new Arrow(_dir.clone(), origin, L, M.yellow, 0.32, 0.22, 0.045));
      this.group.add(this.net);
    }

    this.pieces = data.pieces;
    this.partial = { x: Ex, y: Ey, z: Ez, mag, V: wantV ? Vacc : data.V };
    this.full = data;
    return data;
  }
}
