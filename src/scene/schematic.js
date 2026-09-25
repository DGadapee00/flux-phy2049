import * as THREE from 'three';
import { CSS2DObject } from 'three/addons/renderers/CSS2DRenderer.js';
import { M, Arrow, fatLine, disposeTree, makeChargeTexture, rampColorCVD as rampColor } from './manim.js';

/**
 * Flat schematic for an arbitrary fixed netlist (Circuits lab).
 * Wires are colored by node potential, yellow dots show the actual current, and a grey chevron on
 * each element shows the direction the current was *assumed* (a → b) when writing Kirchhoff's rules.
 */
const RES_LEN = 0.9;
const BAT_LEN = 0.26;

/** anchorX: 0.5 centers the label on (x, y); 0 puts its left edge there; 1 its right edge. */
function makeLabel(cls, x, y, anchorX = 0.5) {
  const el = document.createElement('div');
  el.className = cls;
  const o = new CSS2DObject(el);
  // CSS2DRenderer writes the anchor translate inline from `center`, so CSS transforms cannot move it.
  o.center.set(anchorX, 0.5);
  o.position.set(x, y, 0);
  return o;
}

function setHTML(obj, html) {
  if (!obj || html == null || obj.userData.html === html) return;
  obj.userData.html = html;
  obj.element.innerHTML = html;
}

export class SchematicView {
  constructor(scene) {
    this.group = new THREE.Group();
    scene.add(this.group);
    this.parts = [];
    this.items = [];
    this.key = '';
    this.dotTex = makeChargeTexture(M.yellow, 0);
    this.nodeTex = makeChargeTexture(M.white, 0);
    this._c = new THREE.Color();
  }

  setVisible(v) {
    this.group.visible = v;
  }

  clear() {
    for (const o of this.parts) {
      this.group.remove(o);
      disposeTree(o);
    }
    this.parts = [];
    this.items = [];
    this.jLabel = null;
  }

  build(layout, edges) {
    this.clear();
    const add = (o) => {
      this.group.add(o);
      this.parts.push(o);
      return o;
    };
    const P = layout.nodes;
    const degree = {};
    for (const e of edges) {
      degree[e.a] = (degree[e.a] || 0) + 1;
      degree[e.b] = (degree[e.b] || 0) + 1;
    }

    for (const e of edges) {
      const [ax, ay] = P[e.a];
      const [bx, by] = P[e.b];
      const len = Math.hypot(bx - ax, by - ay);
      const ux = (bx - ax) / len;
      const uy = (by - ay) / len;
      const nx = -uy;
      const ny = ux;
      const mx = (ax + bx) / 2;
      const my = (ay + by) / 2;
      const item = { e, a: [ax, ay], ux, uy, len, leads: [], dots: [], offset: 0, symbol: 0 };

      if (e.type === 'W') {
        item.leads.push(add(fatLine([ax, ay, 0, bx, by, 0], { color: M.white, width: 3 })));
      } else {
        const h = (e.type === 'R' ? RES_LEN : BAT_LEN) / 2;
        item.symbol = 2 * h;
        item.leads.push(add(fatLine([ax, ay, 0, mx - ux * h, my - uy * h, 0], { color: M.white, width: 3 })));
        item.leads.push(add(fatLine([mx + ux * h, my + uy * h, 0, bx, by, 0], { color: M.white, width: 3 })));
        if (e.type === 'R') {
          const pts = [mx - ux * h, my - uy * h, 0];
          const peaks = 6;
          for (let k = 0; k < peaks; k++) {
            const t = -h + (RES_LEN * (k + 0.5)) / peaks;
            const s = k % 2 ? -0.17 : 0.17;
            pts.push(mx + ux * t + nx * s, my + uy * t + ny * s, 0);
          }
          pts.push(mx + ux * h, my + uy * h, 0);
          add(fatLine(pts, { color: M.green, width: 3 }));
        } else {
          // + terminal on the b side: long thin plate. − terminal: short thick plate.
          const px = mx + ux * h;
          const py = my + uy * h;
          const qx = mx - ux * h;
          const qy = my - uy * h;
          add(fatLine([px + nx * 0.42, py + ny * 0.42, 0, px - nx * 0.42, py - ny * 0.42, 0], { color: M.blue, width: 3.5 }));
          add(fatLine([qx + nx * 0.22, qy + ny * 0.22, 0, qx - nx * 0.22, qy - ny * 0.22, 0], { color: M.blue, width: 8 }));
          const sgn = e.side || 1;
          add(makeLabel('circuit-sign', px + ux * 0.2 - nx * sgn * 0.5, py + uy * 0.2 - ny * sgn * 0.5)).element.textContent = '+';
        }
        const t = Math.max(0.4, (len - item.symbol) / 4);
        const cx = ax + ux * t;
        const cy = ay + uy * t;
        item.chev = add(new Arrow(new THREE.Vector3(ux, uy, 0), new THREE.Vector3(cx - ux * 0.16, cy - uy * 0.16, 0.01), 0.32, M.grey, 0.28, 0.26, 0.001));

        const side = e.side || 1;
        const vertical = Math.abs(nx) > 0.5;
        const off = vertical ? 0.5 : 0.95;
        // Battery labels slide toward the − end so they clear resistor labels at the same height.
        const slide = e.type === 'V' ? -0.75 : 0;
        const lx = mx + nx * side * off + ux * slide;
        const ly = my + ny * side * off + uy * slide;
        const anchorX = vertical ? (nx * side > 0 ? 0 : 1) : 0.5;
        item.label = add(makeLabel(vertical && anchorX === 1 ? 'circuit-label right-text' : 'circuit-label', lx, ly, anchorX));
      }

      const nd = Math.max(2, Math.round(len / 0.42));
      for (let k = 0; k < nd; k++) {
        const s = add(new THREE.Sprite(new THREE.SpriteMaterial({ map: this.dotTex, transparent: true, depthWrite: false, toneMapped: false })));
        s.scale.setScalar(0.17);
        s.renderOrder = 3;
        item.dots.push(s);
      }
      this.items.push(item);
    }

    for (const [id, [x, y]] of Object.entries(P)) {
      if ((degree[id] || 0) < 3) continue;
      const s = add(new THREE.Sprite(new THREE.SpriteMaterial({ map: this.nodeTex, transparent: true, depthWrite: false, toneMapped: false })));
      s.position.set(x, y, 0.02);
      s.scale.setScalar(id === layout.junction ? 0.36 : 0.24);
      s.renderOrder = 4;
    }
    if (layout.junction) {
      const [x, y] = P[layout.junction];
      this.jLabel = add(makeLabel('circuit-label', x, y + 0.5));
    }
  }

  /** labels: edgeId → HTML. vmax: highest node potential (colors run 0 → vmax). */
  update(dt, sol, vmax, labels, junctionHTML) {
    const top = Math.max(vmax, 1e-9);
    for (const it of this.items) {
      const e = it.e;
      const I = sol.I[e.id] || 0;
      it.leads[0].material.color.copy(rampColor(sol.V[e.a] / top, this._c));
      if (it.leads[1]) it.leads[1].material.color.copy(rampColor(sol.V[e.b] / top, this._c));

      it.offset += dt * 1.6 * Math.tanh(Math.abs(I) / 2.5);
      const gap = it.len / it.dots.length;
      const flowing = Math.abs(I) > 1e-4;
      it.dots.forEach((s, k) => {
        let d = (k * gap + it.offset) % it.len;
        if (I < 0) d = it.len - d;
        const inSymbol = it.symbol > 0 && Math.abs(d - it.len / 2) < it.symbol / 2 + 0.06;
        s.visible = flowing && !inSymbol;
        s.position.set(it.a[0] + it.ux * d, it.a[1] + it.uy * d, 0.03);
      });
      setHTML(it.label, labels[e.id]);
    }
    setHTML(this.jLabel, junctionHTML);
  }
}
