import * as THREE from 'three';

export function makeGlowTexture(hex, inner = 'rgba(255,255,255,0.95)') {
  const c = document.createElement('canvas');
  c.width = 128;
  c.height = 128;
  const g = c.getContext('2d');
  const col = new THREE.Color(hex);
  const r = Math.round(col.r * 255);
  const gr = Math.round(col.g * 255);
  const b = Math.round(col.b * 255);
  const grd = g.createRadialGradient(64, 64, 6, 64, 64, 64);
  grd.addColorStop(0, inner);
  grd.addColorStop(0.22, `rgba(${r},${gr},${b},0.7)`);
  grd.addColorStop(0.55, `rgba(${r},${gr},${b},0.18)`);
  grd.addColorStop(1, `rgba(${r},${gr},${b},0)`);
  g.fillStyle = grd;
  g.fillRect(0, 0, 128, 128);
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}
