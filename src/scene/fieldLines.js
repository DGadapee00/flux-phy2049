import * as THREE from 'three';
import { sceneScale } from '../engine/frame.js';
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

/**
 * March along E from `start`. Every length here is in scene units divided by the scale, so a line
 * looks the same whether a grid square is a millimeter or a meter: 0.18 units per step, a stop at
 * 24 units out, and a stop within a third of a unit of a charge.
 */
function trace(start, charges, extraE, sign, u, soften, maxSteps = 140) {
  const ds = 0.18 / u;
  const far = (24 / u) ** 2;
  const near = 0.32 / u;
  const pts = [start.x, start.y, start.z];
  const mags = [fieldMag(fieldAt(start, charges, extraE, soften))];
  let x = start.x;
  let y = start.y;
  let z = start.z;
  for (let i = 0; i < maxSteps; i++) {
    const E = fieldAt({ x, y, z }, charges, extraE, soften);
    const mag = fieldMag(E);
    if (mag < 1e-6 * mags[0]) break;
    const inv = sign / mag;
    x += E.x * inv * ds;
    y += E.y * inv * ds;
    z += E.z * inv * ds;
    if (x * x + y * y + z * z > far) break;
    pts.push(x, y, z);
    mags.push(mag);
    if (nearCharge({ x, y, z }, charges, near) && i > 2) break;
  }
  return { pts, mags };
}

const _c = new THREE.Color();
// One cone for every arrowhead on every line: the lines show where the field goes, the heads which way.
const HEAD = new THREE.ConeGeometry(0.075, 0.2, 10);
const _up = new THREE.Vector3(0, 1, 0);
const _d = new THREE.Vector3();

function arrowhead(pos, i, sign, color) {
  const a = new THREE.Vector3(pos[i * 3], pos[i * 3 + 1], pos[i * 3 + 2]);
  const b = new THREE.Vector3(pos[i * 3 + 3], pos[i * 3 + 4], pos[i * 3 + 5]);
  _d.subVectors(b, a).multiplyScalar(sign);
  if (_d.lengthSq() < 1e-12) return null;
  const head = new THREE.Mesh(HEAD, new THREE.MeshBasicMaterial({ color, toneMapped: false, transparent: true, opacity: 0.95 }));
  head.position.copy(a).add(b).multiplyScalar(0.5);
  head.quaternion.setFromUnitVectors(_up, _d.normalize());
  return head;
}

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

  /** `mono`: one plain colour, for a lab where colour already means something else (V). */
  rebuild(charges, extraE, soften, { mono = null } = {}) {
    this.clear();
    if (!charges.length) return;
    const u = sceneScale();
    const positives = charges.filter((c) => c.q > 0);
    const negatives = charges.filter((c) => c.q < 0);
    const sources = positives.length ? positives : negatives;
    const sign = positives.length ? 1 : -1;

    const traces = [];
    let hot = 1e-12;
    for (const c of sources) {
      const n = Math.max(14, Math.min(28, Math.round(16 * Math.abs(c.q) * 1e6)));
      for (const s of seedsOnSphere(c, n, 0.44 / u)) {
        const t = trace(s, charges, extraE, sign, u, soften);
        if (t.pts.length < 12) continue;
        traces.push(t);
        hot = Math.max(hot, t.mags[0]);
      }
    }

    // Color by |E| along the line, over three decades below the strongest line's start: the 3b1b
    // "hot near the source, cool far away" look, keyed to this scene rather than to absolute N/C.
    const top = Math.log10(hot);
    for (const { pts, mags } of traces) {
      const pos = pts.map((v) => v * u);
      const colors = [];
      for (const m of mags) {
        if (mono != null) _c.set(mono);
        else rampColor((Math.log10(Math.max(m, 1e-12)) - (top - 3.2)) / 3.2, _c);
        colors.push(_c.r, _c.g, _c.b);
      }
      const line = fatLine(pos, { colors, width: 2.2, opacity: mono != null ? 0.55 : 0.92 });
      this.group.add(line);
      this.lines.push(line);
      // Heads a third and two thirds of the way along; traces from negative charges run against E.
      const n = mags.length;
      for (const f of n > 40 ? [0.3, 0.7] : [0.45]) {
        const i = Math.min(n - 2, Math.max(0, Math.floor(n * f)));
        const col = new THREE.Color(colors[i * 3], colors[i * 3 + 1], colors[i * 3 + 2]);
        const head = arrowhead(pos, i, sign, col);
        if (!head) continue;
        this.group.add(head);
        this.lines.push(head);
      }
    }
  }
}
