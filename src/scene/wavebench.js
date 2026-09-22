import * as THREE from 'three';
import { CSS2DObject } from 'three/addons/renderers/CSS2DRenderer.js';
import { fatSegments, markAnswer, segmentCapacity, setFatSegments } from './manim.js';
import { UNITS_PER_METER } from '../physics/constants.js';

/**
 * The optical bench shared by the Interference and Diffraction labs.
 *
 * Two rules hold everything together:
 *
 *  1. The screen keeps its scale. It covers a fixed real span (±`span`) chosen when a scenario or a
 *     problem loads, and a ruler down its side is marked in that real unit. Sliding d, a, λ or L
 *     then changes the *pattern* against a ruler that stays put, which is the whole lesson — the
 *     screen never quietly re-zooms to make every setup look the same. `Fit screen` refits on
 *     demand.
 *
 *  2. The waves agree with the screen. The bench is stretched (real slits are a fraction of a
 *     millimetre apart), so the ripples behind the slits are drawn with a stand-in wavelength —
 *     chosen so the drawn geometry puts its first order exactly where the real pattern puts it on
 *     the screen. The dark lanes in the ripples then land on the dark bands of the screen.
 */

const u = UNITS_PER_METER;

/** 1, 2, 5 × 10ⁿ at or above `x`. */
export function niceCeil(x) {
  if (!(x > 0)) return 1;
  const p = 10 ** Math.floor(Math.log10(x));
  const f = x / p;
  return (f <= 1 ? 1 : f <= 2 ? 2 : f <= 5 ? 5 : 10) * p;
}


/** The unit a length ruler reads in, from the screen's half-span: fringes are quoted in mm. */
export function lengthUnit(span) {
  if (span >= 2) return { f: 1, unit: 'm' };
  if (span >= 0.2) return { f: 100, unit: 'cm' };
  if (span >= 1e-3) return { f: 1e3, unit: 'mm' };
  return { f: 1e6, unit: 'μm' };
}

export function angleUnit(span) {
  if (span >= (5 * Math.PI) / 180) return { f: 180 / Math.PI, unit: '°' };
  if (span >= 5e-3) return { f: 1e3, unit: 'mrad' };
  return { f: 1e6, unit: 'μrad' };
}

const trim = (v) => String(Number(v.toPrecision(6)));

/**
 * Screen distance L (real metres) → drawn distance from the slits to the screen. Moving the screen
 * back moves it back on the bench too, compressed by a log so 30 cm and 6 m both fit.
 */
export function drawnL(L, { min = 0.18, max = 0.46 } = {}) {
  const t = Math.min(1, Math.max(0, Math.log(L / 0.3) / Math.log(20)));
  return min + (max - min) * t;
}

/** Log map of a real length onto a drawn one, for slit widths and separations. */
export function drawnLog(v, lo, hi, dlo, dhi) {
  const t = Math.min(1, Math.max(0, Math.log(v / lo) / Math.log(hi / lo)));
  return dlo + (dhi - dlo) * t;
}

function tickLabel() {
  const el = document.createElement('div');
  el.className = 'ruler-label';
  const o = new CSS2DObject(el);
  o.center.set(0, 0.5); // hang off the tick, to the right
  return o;
}

/**
 * A ruler down the right edge of the screen. Its numbers are values in the scene, so they hide
 * with the rest in a problem's blind mode; the ticks stay, as geometry.
 */
export function createRuler(group) {
  const major = fatSegments(segmentCapacity(40), { color: 0x9a9a9a, width: 1.4 });
  const minor = fatSegments(segmentCapacity(80), { color: 0x5a5a5a, width: 1 });
  group.add(major, minor);
  const labels = [];
  for (let i = 0; i < 17; i++) {
    const l = tickLabel();
    markAnswer(l);
    group.add(l);
    labels.push(l);
  }
  const unitLabel = tickLabel();
  unitLabel.element.classList.add('unit');
  group.add(unitLabel);

  /**
   * x: drawing metres of the ruler's spine; halfH: drawn half-height; span: real half-span;
   * units: lengthUnit or angleUnit.
   */
  function update({ x, halfH, span, units = lengthUnit, visible = true, want = 3 }) {
    const { f, unit } = units(span);
    // Round ticks in the unit they are read in: 10 mm, 20° — not 0.5 rad.
    const step = niceCeil((span * f) / want) / f;
    const maj = [];
    const min = [];
    maj.push(x * u, -halfH * u, 0, x * u, halfH * u, 0);
    const toY = (v) => (v / span) * halfH;
    const n = Math.floor(span / step + 1e-9);
    let li = 0;
    for (let k = -n; k <= n; k++) {
      const y = toY(k * step);
      maj.push(x * u, y * u, 0, (x + 0.022) * u, y * u, 0);
      if (li < labels.length) {
        const l = labels[li++];
        l.visible = visible;
        l.position.set((x + 0.03) * u, y * u, 0);
        l.element.textContent = trim(k * step * f);
      }
    }
    for (; li < labels.length; li++) labels[li].visible = false;
    const sub = step / 5;
    const m = Math.floor(span / sub + 1e-9);
    for (let k = -m; k <= m; k++) {
      if (k % 5 === 0) continue;
      const y = toY(k * sub);
      min.push(x * u, y * u, 0, (x + 0.011) * u, y * u, 0);
    }
    setFatSegments(major, visible ? maj : []);
    setFatSegments(minor, visible ? min : []);
    unitLabel.visible = visible;
    unitLabel.position.set((x + 0.03) * u, (halfH + 0.035) * u, 0);
    unitLabel.element.textContent = unit;
  }
  return { update };
}

/**
 * Paint an intensity profile down a screen texture. `intensityAt(v)` takes the screen's own
 * coordinate (real metres, or an angle) and returns 0…1. Each row averages several samples, so a
 * pattern finer than the texture washes out to an even glow — which is what an eye would see —
 * instead of aliasing into bands that are not there.
 */
export function paintScreen(canvas, rgb, span, intensityAt, samples = 6) {
  const W = canvas.width;
  const H = canvas.height;
  const g2 = canvas.getContext('2d');
  const img = g2.createImageData(W, H);
  const rowH = (2 * span) / H;
  for (let row = 0; row < H; row++) {
    const top = span - row * rowH; // texture rows run top → bottom; +v is up
    let I = 0;
    for (let s = 0; s < samples; s++) I += intensityAt(top - ((s + 0.5) / samples) * rowH);
    I /= samples;
    for (let col = 0; col < W; col++) {
      const i = (row * W + col) * 4;
      img.data[i] = rgb.r * I;
      img.data[i + 1] = rgb.g * I;
      img.data[i + 2] = rgb.b * I;
      img.data[i + 3] = 255;
    }
  }
  g2.putImageData(img, 0, 0);
}

// ---------------------------------------------------------------- the ripple tank

const MAX_SOURCES = 48;

const VERT = /* glsl */ `
varying vec2 vPos;
void main() {
  vec4 w = modelMatrix * vec4(position, 1.0);
  vPos = w.xy;
  gl_Position = projectionMatrix * viewMatrix * w;
}`;

const FRAG = /* glsl */ `
#define MAXS ${MAX_SOURCES}
uniform vec2 uSrc[MAXS];
uniform int uN;
uniform float uK;
uniform float uPhase;
uniform float uNorm;
uniform float uXb;
uniform float uXs;
uniform float uBeam;
uniform float uYh;
uniform vec3 uColor;
uniform float uAlpha;
varying vec2 vPos;
void main() {
  if (vPos.x > uXs || abs(vPos.y) > uYh) discard;
  float A;
  if (vPos.x < uXb) {
    if (abs(vPos.y) > uBeam) discard;
    // The incoming plane wave, in step with every source at the barrier.
    A = cos(uK * (vPos.x - uXb) - uPhase);
  } else {
    A = 0.0;
    for (int i = 0; i < MAXS; i++) {
      if (i >= uN) break;
      float r = distance(vPos, uSrc[i]);
      A += cos(uK * r - uPhase) * inversesqrt(max(uK * r, 1.0));
    }
    A *= uNorm;
  }
  A = clamp(A, -1.4, 1.4);
  // Rest level is a dim tint, crests bright, troughs dark: a dark-and-steady lane is a node,
  // where the waves always cancel.
  float b = 0.22 + 0.36 * A;
  gl_FragColor = vec4(uColor * max(b, 0.0), uAlpha);
}`;

/**
 * An animated ripple tank. Everything is in drawing metres.
 * update({ sources: [[x,y],…], lambda, xBarrier, xScreen, beam, halfH, color, alpha, rRef })
 */
export function createTank(group) {
  const uniforms = {
    uSrc: { value: Array.from({ length: MAX_SOURCES }, () => new THREE.Vector2()) },
    uN: { value: 0 },
    uK: { value: 1 },
    uPhase: { value: 0 },
    uNorm: { value: 1 },
    uXb: { value: 0 },
    uXs: { value: 1 },
    uBeam: { value: 0.1 },
    uYh: { value: 1 },
    uColor: { value: new THREE.Color() },
    uAlpha: { value: 1 },
  };
  const mesh = new THREE.Mesh(
    new THREE.PlaneGeometry(1, 1),
    new THREE.ShaderMaterial({ uniforms, vertexShader: VERT, fragmentShader: FRAG, transparent: true, depthWrite: false }),
  );
  mesh.renderOrder = -1;
  group.add(mesh);
  const st = { k: 1, speed: 0 };

  function update({ sources, lambda, xSource, xBarrier, xScreen, beam, halfH, color, alpha = 0.9, rRef }) {
    const n = Math.min(MAX_SOURCES, sources.length);
    for (let i = 0; i < n; i++) uniforms.uSrc.value[i].set(sources[i][0] * u, sources[i][1] * u);
    uniforms.uN.value = n;
    const k = (2 * Math.PI) / (lambda * u);
    st.k = k;
    uniforms.uK.value = k;
    // In phase everywhere at rRef, N sources add to N/√(k r): scale that to about 1.
    uniforms.uNorm.value = Math.sqrt(k * rRef * u) / Math.max(1, n);
    uniforms.uXb.value = xBarrier * u;
    uniforms.uXs.value = xScreen * u;
    uniforms.uBeam.value = beam * u;
    uniforms.uYh.value = halfH * u;
    uniforms.uColor.value.copy(color);
    uniforms.uAlpha.value = alpha;
    const w = (xScreen - xSource) * u;
    mesh.scale.set(w, 2 * halfH * u, 1);
    mesh.position.set(((xSource + xScreen) / 2) * u, 0, -0.02);
    // Crests drift at a fixed drawn speed whatever the wavelength, about 6 cm of bench a second.
    st.speed = 0.06 * u;
  }
  function tick(dt) {
    uniforms.uPhase.value = (uniforms.uPhase.value + st.k * st.speed * dt) % (2 * Math.PI * 1000);
  }
  return { mesh, update, tick, phase: () => uniforms.uPhase.value };
}

/**
 * The drawn wavelength that puts a first-order direction on the screen where the real pattern has
 * it: the exact path difference, in the drawing, from two points `gap` apart to screen height
 * yDraw. For two slits that is the first bright fringe; across one slit's width, the first dark one.
 */
export function drawnLambda(gap, yDraw, Ldraw) {
  const r1 = Math.hypot(Ldraw, yDraw - gap / 2);
  const r2 = Math.hypot(Ldraw, yDraw + gap / 2);
  return Math.abs(r2 - r1);
}
