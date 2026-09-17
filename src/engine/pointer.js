import * as THREE from 'three';
import { sceneScale, workPlane, PLANE_AXES, GRID_HALF, snapStep, snapTo } from './frame.js';

/**
 * Dragging charges and placing the probe.
 *
 * Drags stay in the lab's work plane — the same plane the problem is written in — so moving a
 * charge changes the two coordinates you are reading, and Shift moves it out of the plane.
 * Positions snap to half a grid square (round numbers at any scale); hold Alt to place freely.
 */
export function createChargePointer({ camera, controls, canvas, getState, getPool, getHandle, getLab, bump }) {
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
    const u = sceneScale();
    return { x: v.x / u, y: v.y / u, z: v.z / u };
  }

  /** Keep everything inside the number plane, whatever the current scale is. */
  function clampPos(p) {
    const lim = (GRID_HALF - 0.5) / sceneScale();
    p.x = Math.max(-lim, Math.min(lim, p.x));
    p.y = Math.max(-lim, Math.min(lim, p.y));
    p.z = Math.max(-lim, Math.min(lim, p.z));
  }

  /**
   * The plane a drag runs in: the work plane through the point, or — with Shift — the perpendicular
   * plane, which moves the point along the out-of-plane axis.
   */
  function dragPlane(point, out) {
    const u = sceneScale();
    const P = PLANE_AXES[workPlane()];
    const axes = out ? [P.axes[0], P.off] : P.axes;
    const fixed = out ? P.axes[1] : P.off;
    nrm.set(fixed === 'x' ? 1 : 0, fixed === 'y' ? 1 : 0, fixed === 'z' ? 1 : 0);
    const at = new THREE.Vector3(
      fixed === 'x' ? point.x * u : 0,
      fixed === 'y' ? point.y * u : 0,
      fixed === 'z' ? point.z * u : 0,
    );
    plane.setFromNormalAndCoplanarPoint(nrm, at);
    return axes;
  }

  /** Write the two in-plane coordinates of `hit` onto `target`, snapped unless Alt is held. */
  function place(target, axes, free) {
    const p = fromWorld(hit);
    const step = free ? 0 : snapStep();
    for (const a of axes) target[a] = snapTo(p[a], step);
    clampPos(target);
  }

  canvas.addEventListener('pointerdown', (e) => {
    if (e.button !== 0) return;
    const state = getState();
    const pool = getPool();
    const custom = getLab?.()?.pointer;
    if (custom?.down) {
      custom.down(e, { state, camera, controls, canvas, bump, handle: getHandle?.(), pool });
      return;
    }
    if (!state.charges) return;
    setPointer(e);
    raycaster.setFromCamera(pointer, camera);
    const id = pool.charges().pick(raycaster);
    down = { x: e.clientX, y: e.clientY, id, moved: false };
    if (id != null) {
      drag = { id, shift: e.shiftKey };
      state.selectedId = id;
      controls.enabled = false;
    }
  });

  window.addEventListener('pointermove', (e) => {
    const state = getState();
    const custom = getLab?.()?.pointer;
    if (custom?.move) {
      custom.move(e, { state, camera, controls, canvas, bump, handle: getHandle?.(), pool: getPool() });
      return;
    }
    if (!down) return;
    if (Math.hypot(e.clientX - down.x, e.clientY - down.y) > 4) down.moved = true;
    if (!drag) return;
    setPointer(e);
    raycaster.setFromCamera(pointer, camera);
    const c = state.charges.find((x) => x.id === drag.id);
    if (!c) return;
    const axes = dragPlane(c, drag.shift || e.shiftKey);
    if (raycaster.ray.intersectPlane(plane, hit)) {
      place(c, axes, e.altKey);
      state.dirty = true;
    }
  });

  window.addEventListener('pointerup', (e) => {
    const state = getState();
    const custom = getLab?.()?.pointer;
    if (custom?.up) {
      custom.up(e, { state, camera, controls, canvas, bump, handle: getHandle?.(), pool: getPool() });
      down = null;
      if (drag) {
        drag = null;
        controls.enabled = true;
      }
      return;
    }
    // Labs opt in with `probe: true`; a click on empty space moves state.probe in the work plane.
    const allowProbe = !!getLab?.()?.probe && !!state.probe;
    if (down && !down.moved && down.id == null && allowProbe) {
      setPointer(e);
      raycaster.setFromCamera(pointer, camera);
      const shiftA = state.lab === 'potential' && e.shiftKey && state.pathA;
      const target = shiftA ? state.pathA : state.probe;
      const axes = dragPlane(target, false);
      if (raycaster.ray.intersectPlane(plane, hit)) {
        place(target, axes, e.altKey);
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
