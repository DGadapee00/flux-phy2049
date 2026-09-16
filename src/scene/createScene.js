import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { CSS2DRenderer, CSS2DObject } from 'three/addons/renderers/CSS2DRenderer.js';
import { M, fatSegments } from './manim.js';

export function createScene(canvas) {
  const renderer = new THREE.WebGLRenderer({
    canvas,
    antialias: true,
    alpha: false,
    powerPreference: 'high-performance',
  });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setClearColor(M.bg, 1);
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  // Flat, true-to-palette colors (Manim does no filmic tone mapping).
  renderer.toneMapping = THREE.NoToneMapping;

  const scene = new THREE.Scene();

  const camera = new THREE.PerspectiveCamera(40, window.innerWidth / window.innerHeight, 0.05, 200);
  camera.position.set(7.2, 4.8, 11.4);

  const controls = new OrbitControls(camera, canvas);
  controls.enableDamping = true;
  controls.dampingFactor = 0.08;
  controls.rotateSpeed = 0.7;
  controls.minDistance = 4.5;
  controls.maxDistance = 36;
  controls.target.set(0, 0, 0);
  controls.update();

  const labels = new CSS2DRenderer();
  labels.setSize(window.innerWidth, window.innerHeight);
  labels.domElement.style.position = 'absolute';
  labels.domElement.style.top = '0';
  labels.domElement.style.left = '0';
  labels.domElement.style.pointerEvents = 'none';
  labels.domElement.id = 'label-layer';
  canvas.parentElement.appendChild(labels.domElement);

  scene.add(new THREE.HemisphereLight(0xffffff, 0x303038, 1.6));
  const key = new THREE.DirectionalLight(0xffffff, 1.4);
  key.position.set(6, 10, 4);
  scene.add(key);

  const grid = numberPlane(7);
  scene.add(grid);
  grid.add(axisLabel('x', 7.35, 0, 0));
  grid.add(axisLabel('y', 0, 5.2, 0));
  grid.add(axisLabel('z', 0, 0, 7.35));

  function onResize() {
    const w = window.innerWidth;
    const h = window.innerHeight;
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
    renderer.setSize(w, h);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    labels.setSize(w, h);
  }
  window.addEventListener('resize', onResize);

  return { renderer, scene, camera, controls, labels, grid, onResize };
}

/** Manim NumberPlane on the xz floor: blue major lines, faint minor lines, light axes with ticks. */
function numberPlane(half) {
  const group = new THREE.Group();
  const major = [];
  const minor = [];
  for (let i = -half; i <= half; i++) {
    if (i !== 0) {
      major.push(i, 0, -half, i, 0, half);
      major.push(-half, 0, i, half, 0, i);
    }
    if (i < half) {
      const m = i + 0.5;
      minor.push(m, 0, -half, m, 0, half);
      minor.push(-half, 0, m, half, 0, m);
    }
  }
  group.add(fatSegments(minor, { color: M.blueE, width: 1, opacity: 0.28 }));
  group.add(fatSegments(major, { color: M.blueD, width: 1.4, opacity: 0.42 }));

  const axes = [-half, 0, 0, half, 0, 0, 0, 0, -half, 0, 0, half, 0, 0, 0, 0, 4.8, 0];
  const ticks = [];
  const t = 0.08;
  for (let i = -half + 1; i < half; i++) {
    if (i === 0) continue;
    ticks.push(i, -t, 0, i, t, 0);
    ticks.push(0, -t, i, 0, t, i);
  }
  for (let i = 1; i < 5; i++) ticks.push(-t, i, 0, t, i, 0);
  group.add(fatSegments(axes, { color: M.white, width: 2, opacity: 0.8 }));
  group.add(fatSegments(ticks, { color: M.white, width: 1.6, opacity: 0.7 }));
  return group;
}

function axisLabel(text, x, y, z) {
  const div = document.createElement('div');
  div.className = 'axis-label';
  div.textContent = text;
  const obj = new CSS2DObject(div);
  obj.position.set(x, y, z);
  return obj;
}

export { CSS2DObject };
