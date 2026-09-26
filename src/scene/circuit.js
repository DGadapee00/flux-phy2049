import * as THREE from 'three';
import { CSS2DObject } from 'three/addons/renderers/CSS2DRenderer.js';
import { M, Q, Arrow, fatLine, disposeTree, makeChargeTexture } from './manim.js';
import { makeGlowTexture } from './glow.js';
import { fmtV, fmtI, fmtR, fmtP } from '../ui/format.js';

/**
 * Flat schematic in the xy-plane, drawn like a 3b1b diagram.
 * Color code shared with the HUD: V blue, I yellow, R green, P red.
 */
const W = 2.6;
const H = 1.45;
const Y0 = 0.45;
const N_DOTS = 30;
const PERIM = 4 * W + 4 * H;

/** Clockwise loop from the bottom-left corner: up the left wire, across the load, down, back through the source (− → +). */
function loopPoint(s, out) {
  let d = (((s % 1) + 1) % 1) * PERIM;
  if (d < 2 * H) return out.set(-W, -H + d + Y0, 0.02);
  d -= 2 * H;
  if (d < 2 * W) return out.set(-W + d, H + Y0, 0.02);
  d -= 2 * W;
  if (d < 2 * H) return out.set(W, H - d + Y0, 0.02);
  d -= 2 * H;
  return out.set(W - d, -H + Y0, 0.02);
}

function circlePts(cx, cy, r, n = 72) {
  const pts = [];
  for (let i = 0; i <= n; i++) {
    const a = (i / n) * Math.PI * 2;
    pts.push(cx + r * Math.cos(a), cy + r * Math.sin(a), 0);
  }
  return pts;
}

function label(cls, x, y) {
  const el = document.createElement('div');
  el.className = cls;
  const obj = new CSS2DObject(el);
  obj.position.set(x, y, 0);
  return obj;
}

function setHTML(obj, html) {
  if (obj.userData.html === html) return;
  obj.userData.html = html;
  obj.element.innerHTML = html;
}

function fmtOhm(r) {
  if (r >= 1e3 || r < 1) return fmtR(r);
  return `${r >= 10 ? r.toFixed(0) : r.toFixed(1)} Ω`;
}

const q = (cls, s) => `<span class="${cls}">${s}</span>`;

function eqHTML(cfg) {
  if (cfg.eq === 'ohm') {
    return (
      `<div class="big">${q('qI', '<i>I</i>')} = ${q('qV', '<i>V</i>')} / ${q('qR', '<i>R</i>')}</div>` +
      `<div class="nums">${q('qI', fmtI(cfg.I))} = ${q('qV', fmtV(cfg.V))} / ${q('qR', fmtOhm(cfg.R))}</div>` +
      `<div class="nums">${q('qP', `<i>P</i> = ${fmtP(cfg.P)}`)}</div>`
    );
  }
  const t = cfg.source === 'ac' ? '(t)' : '';
  let html =
    `<div class="big">${q('qP', `<i>P</i>${t}`)} = ${q('qI', `<i>I</i>${t}`)} ${q('qV', `<i>V</i>${t}`)}</div>` +
    `<div class="nums">${q('qP', fmtP(cfg.P))} = ${q('qI', fmtI(cfg.I))} × ${q('qV', fmtV(cfg.V))}</div>`;
  if (cfg.source === 'ac') html += `<div class="nums avg">${q('qP', `<i>P</i><sub>avg</sub> = ${fmtP(cfg.Pavg)}`)}</div>`;
  return html;
}

export class CircuitView {
  constructor(scene) {
    this.group = new THREE.Group();
    scene.add(this.group);
    this.parts = [];
    this.key = '';
    this.s = 0;
    this.time = 0;
    this.dotTex = makeChargeTexture(Q.I, 0);
    this.glowWarm = makeGlowTexture(0xffe9a8);
    this.glowHot = makeGlowTexture(M.red);
    this._v = new THREE.Vector3();
    this._dir = new THREE.Vector3();
    this._c = new THREE.Color();
    this._c2 = new THREE.Color();
  }

  setVisible(v) {
    this.group.visible = v;
  }

  clearParts() {
    for (const o of this.parts) {
      this.group.remove(o);
      disposeTree(o);
    }
    this.parts = [];
  }

  build(cfg) {
    this.clearParts();
    const add = (o) => {
      this.group.add(o);
      this.parts.push(o);
      return o;
    };
    const ac = cfg.source === 'ac';
    const bulb = cfg.load === 'bulb';
    const yb = -H + Y0;
    const yt = H + Y0;
    this.srcGap = ac ? 0.45 : 0.14;
    this.loadGap = bulb ? 0.5 : 0.62;
    const sg = this.srcGap;
    const lg = this.loadGap;

    const wire = { color: M.white, width: 3 };
    add(fatLine([-sg, yb, 0, -W, yb, 0, -W, yt, 0, -lg, yt, 0], wire));
    add(fatLine([lg, yt, 0, W, yt, 0, W, yb, 0, sg, yb, 0], wire));

    // Source
    if (ac) {
      add(fatLine(circlePts(0, yb, 0.45), { color: M.blue, width: 3 }));
      const sine = [];
      for (let i = 0; i <= 40; i++) {
        const x = -0.27 + (0.54 * i) / 40;
        sine.push(x, yb + 0.15 * Math.sin((x / 0.54) * Math.PI * 2), 0);
      }
      add(fatLine(sine, { color: M.blue, width: 2.5 }));
    } else {
      add(fatLine([-0.14, yb - 0.42, 0, -0.14, yb + 0.42, 0], { color: M.blue, width: 3.5 }));
      add(fatLine([0.14, yb - 0.22, 0, 0.14, yb + 0.22, 0], { color: M.blue, width: 8 }));
      add(label('circuit-sign', -0.42, yb + 0.42)).element.textContent = '+';
      add(label('circuit-sign', 0.42, yb + 0.42)).element.textContent = '−';
    }
    this.srcLabel = add(label('circuit-label', 0, yb - 0.95));

    // Load
    this.glow = add(
      new THREE.Sprite(
        new THREE.SpriteMaterial({
          map: bulb ? this.glowWarm : this.glowHot,
          transparent: true,
          depthWrite: false,
          blending: THREE.AdditiveBlending,
        }),
      ),
    );
    this.glow.position.set(0, yt, -0.05);
    if (bulb) {
      this.fill = add(
        new THREE.Mesh(
          new THREE.CircleGeometry(0.48, 48),
          new THREE.MeshBasicMaterial({ color: M.yellow, transparent: true, depthWrite: false, toneMapped: false }),
        ),
      );
      this.fill.position.set(0, yt, -0.02);
      add(fatLine(circlePts(0, yt, 0.5), { color: M.green, width: 3 }));
      // Filament: leads plus a looped coil (prolate cycloid).
      const coil = [-0.5, yt, 0];
      const a = 0.44 / (8 * Math.PI);
      const b = 0.075;
      for (let i = 0; i <= 120; i++) {
        const t = (i / 120) * 8 * Math.PI;
        coil.push(-0.22 + a * t - b * Math.sin(t), yt - b * Math.cos(t), 0);
      }
      coil.push(0.5, yt, 0);
      this.filament = add(fatLine(coil, { color: M.white, width: 2 }));
      this.rays = [];
      for (let k = 0; k < 12; k++) {
        const pivot = new THREE.Object3D();
        pivot.position.set(0, yt, 0);
        pivot.rotation.z = (k / 12) * Math.PI * 2 + Math.PI / 12;
        const ray = fatLine([0, 0, 0, 1, 0, 0], { color: M.yellow, width: 2.5, opacity: 0.99 });
        ray.position.x = 0.66;
        pivot.add(ray);
        add(pivot);
        this.rays.push(ray);
      }
    } else {
      const zz = [-lg, yt, 0, -0.5, yt, 0];
      for (let k = 0; k < 8; k++) zz.push(-0.5 + 0.125 * (k + 0.5), yt + (k % 2 ? -0.2 : 0.2), 0);
      zz.push(0.5, yt, 0, lg, yt, 0);
      this.zigzag = add(fatLine(zz, { color: M.green, width: 3 }));
      this.waves = [];
      for (let k = 0; k < 3; k++) {
        const pts = [];
        for (let i = 0; i <= 24; i++) {
          const y = (i / 24) * 0.45;
          pts.push(0.05 * Math.sin(y * 4.4 * Math.PI), y, 0);
        }
        const w = add(fatLine(pts, { color: M.red, width: 2.5, opacity: 0.99 }));
        w.userData.x = -0.32 + 0.32 * k;
        this.waves.push(w);
      }
    }
    this.loadLabel = add(label('circuit-label', 0, yt + 1.5));

    // Current: arrow on the right wire, label just inside the loop.
    this.arrow = add(new Arrow(new THREE.Vector3(0, -1, 0), new THREE.Vector3(), 1, Q.I, 0.28, 0.2, 0.035));
    this.iLabel = add(label('circuit-label', W - 0.55, Y0 - 1.0));
    this.eqLabel = add(label('circuit-label circuit-eq', -0.35, Y0 + 0.25));

    this.dots = [];
    for (let i = 0; i < N_DOTS; i++) {
      const d = add(
        new THREE.Sprite(new THREE.SpriteMaterial({ map: this.dotTex, transparent: true, depthWrite: false, toneMapped: false })),
      );
      d.scale.setScalar(0.2);
      d.renderOrder = 3;
      this.dots.push(d);
    }
  }

  /** cfg: { eq, source: 'dc'|'ac', load: 'bulb'|'heater'|'resistor', loadName, V, I, R, P, [Ip, Vrms, Pavg, f, phase] } */
  update(dt, cfg) {
    const key = `${cfg.source}|${cfg.load}`;
    if (key !== this.key) {
      this.key = key;
      this.build(cfg);
    }
    this.time += dt;
    const ac = cfg.source === 'ac';
    const I = cfg.I || 0;

    // Moving charge: DC circulates at a speed that grows with I; AC sloshes (displacement ∝ ∫ sin = −cos).
    let base;
    if (ac) {
      base = this.s + 0.035 * -Math.cos(cfg.phase || 0);
    } else {
      this.s += dt * 0.45 * Math.tanh(I / 4);
      base = this.s;
    }
    const flowing = Math.abs(ac ? cfg.Ip : I) > 1e-6;
    for (let i = 0; i < this.dots.length; i++) {
      const p = loopPoint(base + i / this.dots.length, this._v);
      this.dots[i].position.copy(p);
      const yRel = p.y - Y0;
      const inSrc = yRel < -H + 1e-3 && Math.abs(p.x) < this.srcGap + 0.06;
      const inLoad = yRel > H - 1e-3 && Math.abs(p.x) < this.loadGap;
      this.dots[i].visible = flowing && !inSrc && !inLoad;
    }

    const frac = ac ? I / (cfg.Ip || 1) : Math.sign(I) || 1;
    const L = 1.1 * Math.abs(frac);
    this.arrow.visible = flowing && L > 0.15;
    if (this.arrow.visible) {
      const down = frac >= 0;
      this.arrow.setDirection(this._dir.set(0, down ? -1 : 1, 0));
      this.arrow.position.set(W - 0.32, Y0 + (down ? L / 2 : -L / 2), 0.02);
      this.arrow.setLength(L, 0.28, 0.2);
    }

    const P = Math.max(0, cfg.P || 0);
    if (cfg.load === 'bulb') {
      const b = P / (P + 80);
      this.fill.material.opacity = 0.04 + 0.5 * b;
      this.glow.material.opacity = b;
      this.glow.scale.setScalar(1.4 + 2.6 * b);
      this.filament.material.color.copy(this._c.setHex(M.white).lerp(this._c2.setHex(M.yellow), b));
      for (const r of this.rays) {
        r.scale.x = 0.08 + 0.5 * b;
        r.material.opacity = b;
        r.visible = b > 0.03;
      }
    } else {
      const h = P / (P + 400);
      this.glow.material.opacity = 0.75 * h;
      this.glow.scale.setScalar(1.6 + 2 * h);
      this.zigzag.material.color.copy(this._c.setHex(M.green).lerp(this._c2.setHex(M.red), h));
      this.waves.forEach((w, k) => {
        const ph = (this.time * 0.45 + k / 3) % 1;
        w.position.set(w.userData.x, Y0 + H + 0.3 + 0.45 * ph, 0);
        w.material.opacity = h * Math.sin(Math.PI * ph);
        w.visible = h > 0.03;
      });
    }

    setHTML(
      this.srcLabel,
      ac
        ? `${q('qV', `<i>V</i><sub>rms</sub> = ${fmtV(cfg.Vrms)}`)}<small>AC source · ${cfg.f} Hz · slowed to 1 cycle / 2 s</small>`
        : `${q('qV', `<i>V</i> = ${fmtV(cfg.V)}`)}<small>DC source (battery)</small>`,
    );
    setHTML(this.loadLabel, `<span class="name">${cfg.loadName}</span>${q('qR', `<i>R</i> = ${fmtOhm(cfg.R)}`)}`);
    setHTML(this.iLabel, `${q('qI', `<i>I</i>${ac ? '(t)' : ''} = ${fmtI(I)}`)}<small>dots = moving charge</small>`);
    setHTML(this.eqLabel, eqHTML(cfg));
  }
}
