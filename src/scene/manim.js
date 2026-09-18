import * as THREE from 'three';
import { LineSegments2 } from 'three/addons/lines/LineSegments2.js';
import { LineSegmentsGeometry } from 'three/addons/lines/LineSegmentsGeometry.js';
import { Line2 } from 'three/addons/lines/Line2.js';
import { LineGeometry } from 'three/addons/lines/LineGeometry.js';
import { LineMaterial } from 'three/addons/lines/LineMaterial.js';

/**
 * Instrument Dark palette. Low-saturation instrument colours on a near-black ground: nothing here
 * is gold, nothing glows. Role names (eVec, fluxIn, …) are what labs should reach for; the plain
 * colour names are kept so existing call sites keep working.
 */
export const M = {
  bg: 0x0b0e12,
  white: 0xe6edf4,
  grey: 0x8b96a8,
  greyDark: 0x2a3340,
  blue: 0x5ba8c9,
  blueD: 0x4e93b2,
  blueE: 0x35607a,
  teal: 0x6aa8b0,
  green: 0x6fcfb0,
  yellow: 0xd4b07a,
  gold: 0xd4b07a,
  red: 0xc45b5b,
  maroon: 0xa85f6b,
  purple: 0x8878a8,
  pink: 0xb06a9e,

  // Roles
  accent: 0x5ba8c9,
  match: 0x6fcfb0,
  sink: 0xd9897a,
  qPos: 0x8f5e5c,
  qNeg: 0x5c738f,
  eVec: 0xd4b07a,
  bVec: 0x6aa8b0,
  fluxIn: 0x4a6d8c,
  fluxZero: 0xc9d0d6,
  fluxOut: 0xc4a882,
  gridLine: 0x5a8caa, // paired with a low opacity — the --grid token is rgba(90,140,170,0.14)
  textMuted: 0x8b96a8,
  /** Current marks: thin and grey, never a bright dot. */
  current: 0x9aa5b5,
  /** Smoked graphite for Gaussian surfaces, conductors and slabs. */
  graphite: 0x39424f,
};

export const POS_COLOR = M.qPos;
export const NEG_COLOR = M.qNeg;

/** Flux / E·n̂ colormap: inward (cool) → zero (bone) → outward (warm). t in [0, 1]. */
const RAMP = [M.fluxIn, M.fluxZero, M.fluxOut].map((h) => new THREE.Color(h));
export function rampColor(t, out = new THREE.Color()) {
  const x = Math.max(0, Math.min(1, t)) * (RAMP.length - 1);
  const i = Math.min(RAMP.length - 2, Math.floor(x));
  return out.copy(RAMP[i]).lerp(RAMP[i + 1], x - i);
}

export function lineMaterial({ color = M.white, width = 2.5, opacity = 1, vertexColors = false, dashed = false } = {}) {
  return new LineMaterial({
    color: vertexColors ? 0xffffff : color,
    linewidth: width,
    vertexColors,
    transparent: opacity < 1,
    opacity,
    dashed,
    dashSize: 0.18,
    gapSize: 0.12,
    depthWrite: opacity >= 1,
  });
}

/** Thick polyline. positions: flat [x,y,z,...]; colors optional flat [r,g,b,...]. */
export function fatLine(positions, opts = {}) {
  const geo = new LineGeometry();
  geo.setPositions(positions);
  if (opts.colors) geo.setColors(opts.colors);
  const line = new Line2(geo, lineMaterial({ ...opts, vertexColors: !!opts.colors }));
  if (opts.dashed) line.computeLineDistances();
  return line;
}

/** Thick disjoint segments. positions: flat pairs. */
export function fatSegments(positions, opts = {}) {
  const geo = new LineSegmentsGeometry();
  geo.setPositions(positions);
  if (opts.colors) geo.setColors(opts.colors);
  return new LineSegments2(geo, lineMaterial({ ...opts, vertexColors: !!opts.colors }));
}

const _up = new THREE.Vector3(0, 1, 0);
const SHAFT_GEO = new THREE.CylinderGeometry(1, 1, 1, 10, 1).translate(0, 0.5, 0);
const TIP_GEO = new THREE.ConeGeometry(1, 1, 16, 1).translate(0, -0.5, 0);

/**
 * Manim-style vector: solid shaft, tip whose size stays fixed as length changes.
 * Drop-in for THREE.ArrowHelper (same constructor order, setDirection/setLength/setColor).
 */
/**
 * Objects that show an answer outright (the field arrow at a probe, force arrows) also live on
 * this layer only. Practice blind mode turns the layer off on the camera until the problem is solved.
 */
export const ANSWER_LAYER = 1;
export function markAnswer(obj) {
  obj.traverse((o) => o.layers.set(ANSWER_LAYER));
  return obj;
}

export class Arrow extends THREE.Object3D {
  constructor(dir = new THREE.Vector3(1, 0, 0), origin = new THREE.Vector3(), length = 1, color = M.white, headLength, headWidth, shaft = 0.028) {
    super();
    this.type = 'Arrow';
    this.shaftRadius = shaft;
    const mat = new THREE.MeshBasicMaterial({ color, toneMapped: false });
    // `line` and `cone` names match ArrowHelper so existing dispose code keeps working.
    this.line = new THREE.Mesh(SHAFT_GEO, mat);
    this.cone = new THREE.Mesh(TIP_GEO, mat);
    this.line.geometry = SHAFT_GEO;
    this.add(this.line, this.cone);
    this.position.copy(origin);
    this.setDirection(dir);
    this.setLength(length, headLength, headWidth);
  }

  setDirection(dir) {
    this.quaternion.setFromUnitVectors(_up, dir.clone().normalize());
  }

  setLength(length, headLength = Math.min(0.26, length * 0.35), headWidth = headLength * 0.55) {
    const hl = Math.min(headLength * 1.25, length * 0.6);
    const hw = headWidth * 0.75;
    const shaftLen = Math.max(1e-4, length - hl * 0.85);
    this.line.scale.set(this.shaftRadius, shaftLen, this.shaftRadius);
    this.cone.scale.set(hw, hl, hw);
    this.cone.position.y = length;
  }

  setColor(color) {
    this.line.material.color.set(color);
  }

  dispose() {
    this.line.material.dispose();
  }
}

/** Disc sprite with a +/− sign (sign 0 = plain dot), the way 3b1b draws point charges. */
export function makeChargeTexture(hex, sign) {
  const S = 256;
  const c = document.createElement('canvas');
  c.width = S;
  c.height = S;
  const g = c.getContext('2d');
  const col = new THREE.Color(hex);
  const rgb = (k, a = 1) =>
    `rgba(${Math.round(col.r * 255 * k)},${Math.round(col.g * 255 * k)},${Math.round(col.b * 255 * k)},${a})`;
  // Matte: one flat fill, a slightly darker rim for the edge, and the sign. No halo, no gloss.
  g.beginPath();
  g.arc(S / 2, S / 2, S * 0.26, 0, Math.PI * 2);
  g.fillStyle = rgb(1);
  g.fill();
  g.lineWidth = S * 0.018;
  g.strokeStyle = rgb(0.62);
  g.stroke();
  g.fillStyle = '#d5dde8';
  const bar = S * 0.02;
  const len = S * 0.1;
  if (sign !== 0) g.fillRect(S / 2 - len, S / 2 - bar, 2 * len, 2 * bar);
  if (sign > 0) g.fillRect(S / 2 - bar, S / 2 - len, 2 * bar, 2 * len);
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 4;
  return tex;
}

/**
 * Move the vertices of an existing fatLine without reallocating (for per-frame animation).
 * `flat` must have the same number of points the line was created with.
 */
export function updateFatLine(line, flat) {
  const buf = line.geometry.attributes.instanceStart.data;
  const arr = buf.array;
  const n = flat.length / 3;
  for (let i = 0; i < n - 1; i++) {
    const o = i * 6;
    arr[o] = flat[i * 3];
    arr[o + 1] = flat[i * 3 + 1];
    arr[o + 2] = flat[i * 3 + 2];
    arr[o + 3] = flat[i * 3 + 3];
    arr[o + 4] = flat[i * 3 + 4];
    arr[o + 5] = flat[i * 3 + 5];
  }
  buf.needsUpdate = true;
  line.frustumCulled = false;
}

/**
 * Rewrite a fatSegments() line in place, and say how many segments it can ever hold.
 *
 * A Line2/LineSegments2 buffer cannot grow after its first draw: the renderer records how many
 * instances the first upload had (`_maxInstanceCount`) and never draws past it, however many
 * setPositions() puts in afterwards. So build the line once at its widest with segmentCapacity(),
 * then refill it through here — the segments you do not use collapse to a point and vanish.
 */
export function setFatSegments(line, flat) {
  const buf = line.geometry.attributes.instanceStart.data;
  const arr = buf.array;
  const n = Math.min(flat.length, arr.length);
  for (let i = 0; i < n; i++) arr[i] = flat[i];
  for (let i = n; i < arr.length; i++) arr[i] = 0; // zero-length segments draw nothing
  buf.needsUpdate = true;
  line.frustumCulled = false;
}

/** A zero-filled positions array for `count` segments, to build a line at its full capacity. */
export function segmentCapacity(count) {
  return new Array(count * 6).fill(0);
}

export function disposeTree(root) {
  root.traverse((o) => {
    if (o.geometry && o.geometry !== SHAFT_GEO && o.geometry !== TIP_GEO) o.geometry.dispose();
    if (o.material) o.material.dispose();
    if (o.element) o.element.remove();
  });
}
