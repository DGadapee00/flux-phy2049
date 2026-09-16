import * as THREE from 'three';
import { UNITS_PER_METER } from '../physics/constants.js';

export function createChargePointer({ camera, controls, canvas, getState, getPool, bump, labsWithProbe }) {
  const raycaster = new THREE.Raycaster();
  const pointer = new THREE.Vector2();
  const plane = new THREE.Plane();
  const hit = new THREE.Vector3();
  const nrm = new THREE.Vector3();
  let drag = null;
  let down = null;

  function setPointer(e) {
    pointer.x = (e.clientX / window.innerWidth) * 2 - 1;
    pointer.y = -(e.clientY / window.innerHeight) * 2 + 1;
  }

  function fromWorld(v) {
    return { x: v.x / UNITS_PER_METER, y: v.y / UNITS_PER_METER, z: v.z / UNITS_PER_METER };
  }

  function clampPos(p) {
    p.x = Math.max(-1.35, Math.min(1.35, p.x));
    p.y = Math.max(-1.1, Math.min(1.1, p.y));
    p.z = Math.max(-1.35, Math.min(1.35, p.z));
  }

  canvas.addEventListener('pointerdown', (e) => {
    if (e.button !== 0) return;
    const state = getState();
    const pool = getPool();
    const custom = state.__lab?.pointer;
    if (custom?.down) {
      custom.down(e, { state, camera, controls, canvas, bump });
      return;
    }
    if (!state.charges) return;
    setPointer(e);
    raycaster.setFromCamera(pointer, camera);
    const id = pool.charges().pick(raycaster);
    down = { x: e.clientX, y: e.clientY, id, moved: false };
    if (id != null) {
      const c = state.charges.find((x) => x.id === id);
      drag = { id, shift: e.shiftKey, y0: c.y, z0: c.z };
      state.selectedId = id;
      controls.enabled = false;
    }
  });

  window.addEventListener('pointermove', (e) => {
    const state = getState();
    const custom = state.__lab?.pointer;
    if (custom?.move) {
      custom.move(e, { state, camera, controls, canvas, bump });
      return;
    }
    if (!down) return;
    if (Math.hypot(e.clientX - down.x, e.clientY - down.y) > 4) down.moved = true;
    if (!drag) return;
    setPointer(e);
    raycaster.setFromCamera(pointer, camera);
    const c = state.charges.find((x) => x.id === drag.id);
    if (!c) return;
    if (drag.shift || e.shiftKey) {
      nrm.set(0, 0, 1);
      plane.setFromNormalAndCoplanarPoint(nrm, new THREE.Vector3(0, 0, c.z * UNITS_PER_METER));
    } else {
      nrm.set(0, 1, 0);
      plane.setFromNormalAndCoplanarPoint(nrm, new THREE.Vector3(0, c.y * UNITS_PER_METER, 0));
    }
    if (raycaster.ray.intersectPlane(plane, hit)) {
      const p = fromWorld(hit);
      c.x = p.x;
      if (drag.shift || e.shiftKey) c.y = p.y;
      else c.z = p.z;
      clampPos(c);
      state.dirty = true;
    }
  });

  window.addEventListener('pointerup', (e) => {
    const state = getState();
    const custom = state.__lab?.pointer;
    if (custom?.up) {
      custom.up(e, { state, camera, controls, canvas, bump });
      down = null;
      drag = null;
      return;
    }
    const allowProbe = labsWithProbe.has(state.lab);
    if (down && !down.moved && down.id == null && allowProbe) {
      setPointer(e);
      raycaster.setFromCamera(pointer, camera);
      nrm.set(0, 1, 0);
      plane.setFromNormalAndCoplanarPoint(nrm, new THREE.Vector3(0, state.probe.y * UNITS_PER_METER, 0));
      if (raycaster.ray.intersectPlane(plane, hit)) {
        const p = fromWorld(hit);
        if (state.lab === 'potential' && e.shiftKey) {
          state.pathA.x = p.x;
          state.pathA.z = p.z;
          clampPos(state.pathA);
        } else {
          state.probe.x = p.x;
          state.probe.z = p.z;
          clampPos(state.probe);
        }
        state.dirty = true;
      }
    }
    down = null;
    if (drag) {
      drag = null;
      controls.enabled = true;
    }
  });

  return {
    get dragging() {
      return !!drag;
    },
  };
}
