import * as THREE from 'three';
import { CSS2DObject } from 'three/addons/renderers/CSS2DRenderer.js';
import { defineLab } from './define.js';
import { Arrow, M, fatLine, disposeTree } from '../scene/manim.js';
import { UNITS_PER_METER } from '../physics/constants.js';
import { loopPoints } from '../physics/bfield.js';
import { expandingLoop, slidingBar, generator, dipoleLoop, inducedCurrent, lenz } from '../physics/faraday.js';
import { kv, cells, qv } from '../ui/shared.js';
import { fmtV, fmtI, fmtWb, fmtLen } from '../ui/format.js';
import { fmtB } from './biot.js';

const SCENARIOS = [
  { id: 'magnet', name: 'Magnet moving toward a loop', kind: 'magnet' },
  { id: 'expand', name: 'Loop growing in uniform B', kind: 'expand' },
  { id: 'bar', name: 'Sliding bar on rails', kind: 'bar' },
  { id: 'generator', name: 'Rotating loop (generator)', kind: 'generator' },
];

const CAMS = {
  magnet: { pos: new THREE.Vector3(5.4, 4.2, 9.2), target: new THREE.Vector3(0, 0.4, 0) },
  expand: { pos: new THREE.Vector3(5.2, 6.2, 8.4), target: new THREE.Vector3(0, 0, 0) },
  bar: { pos: new THREE.Vector3(2.2, 8.5, 6.5), target: new THREE.Vector3(0.3, 0, 0) },
  generator: { pos: new THREE.Vector3(6.2, 4.4, 8.8), target: new THREE.Vector3(0, 0, 0) },
};

function kinematics(state) {
  const t = state.t;
  const w = state.omega;
  if (state.kind === 'magnet') {
    const z = state.z0 + state.amp * Math.sin(w * t);
    const vz = state.amp * w * Math.cos(w * t);
    return { z, vz, R: state.R, Rdot: 0, x: 0, v: 0, theta: 0 };
  }
  if (state.kind === 'expand') {
    const R = state.R0 + state.amp * Math.sin(w * t);
    const Rdot = state.amp * w * Math.cos(w * t);
    return { z: 0, vz: 0, R, Rdot, x: 0, v: 0, theta: 0 };
  }
  if (state.kind === 'bar') {
    const x = state.x0 + state.amp * Math.sin(w * t);
    const v = state.amp * w * Math.cos(w * t);
    return { z: 0, vz: 0, R: 0, Rdot: 0, x, v, theta: 0 };
  }
  const theta = w * t;
  return { z: 0, vz: 0, R: state.R, Rdot: 0, x: 0, v: 0, theta };
}

function physics(state, kin) {
  if (state.kind === 'magnet') return dipoleLoop(state.m, kin.z, state.R, kin.vz);
  if (state.kind === 'expand') return expandingLoop(state.B, kin.R, kin.Rdot, state.N);
  if (state.kind === 'bar') return slidingBar(state.B, state.width, kin.x, kin.v);
  const A = loopAreaR(state.R);
  return generator(state.N, state.B, A, state.omega, kin.theta);
}

function loopAreaR(R) {
  return Math.PI * R * R;
}

function label(html, x, y, z) {
  const el = document.createElement('div');
  el.className = 'circuit-label';
  el.innerHTML = html;
  const o = new CSS2DObject(el);
  o.position.set(x, y, z);
  o.userData.el = el;
  return o;
}

function setLine(obj, pts, u, color, width) {
  const flat = [];
  for (const p of pts) flat.push(p.x * u, p.y * u, p.z * u);
  if (obj.line) {
    obj.group.remove(obj.line);
    disposeTree(obj.line);
  }
  if (flat.length >= 6) {
    obj.line = fatLine(flat, { color, width });
    obj.group.add(obj.line);
  }
}

export default defineLab({
  id: 'faraday',
  exam: 'e5',
  title: 'Faraday',
  hint: 'Watch Lenz — induced I fights the change in flux',
  live: true,
  orbit: true,
  camera: CAMS.magnet,
  cameraFor: (state) => CAMS[state.kind] || CAMS.magnet,
  keys: { ' ': 'sweep', r: 'reset', R: 'reset' },
  scenarios: SCENARIOS,
  defaultState() {
    return {
      scenarioId: 'magnet',
      kind: 'magnet',
      B: 0.35,
      R: 0.32,
      R0: 0.28,
      amp: 0.28,
      omega: 1.15,
      t: 0,
      m: 2.4,
      z0: 0.55,
      width: 0.4,
      x0: 0.5,
      N: 8,
      Rloop: 2,
      slow: 1,
      anim: { playing: true, i: 0 },
    };
  },
  applyScenario(id, state) {
    const sc = SCENARIOS.find((s) => s.id === id) || SCENARIOS[0];
    state.scenarioId = sc.id;
    state.kind = sc.kind;
    state.t = 0;
    state.anim = { playing: true, i: 0 };
    if (sc.kind === 'magnet') {
      state.R = 0.32;
      state.amp = 0.28;
      state.z0 = 0.55;
      state.omega = 1.15;
      state.m = 2.4;
    } else if (sc.kind === 'expand') {
      state.B = 0.4;
      state.R0 = 0.28;
      state.amp = 0.1;
      state.omega = 1.2;
      state.N = 1;
    } else if (sc.kind === 'bar') {
      state.B = 0.5;
      state.width = 0.4;
      state.x0 = 0.5;
      state.amp = 0.22;
      state.omega = 1.1;
    } else {
      state.B = 0.25;
      state.R = 0.3;
      state.N = 8;
      state.omega = 1.4;
    }
  },
  controls() {
    return `
        <div class="lab-block">
          <button type="button" class="btn accent" id="btn-faraday-play">Pause</button>
          <label class="field" id="wrap-far-B">
            <span>Uniform B</span>
            <div class="slider-row">
              <input type="range" id="far-B" min="0.05" max="1" step="0.01" value="0.35" />
              <span class="mono val" id="far-B-val">0.35 T</span>
            </div>
          </label>
          <label class="field" id="wrap-far-m">
            <span>Dipole moment m</span>
            <div class="slider-row">
              <input type="range" id="far-m" min="0.4" max="5" step="0.1" value="2.4" />
              <span class="mono val" id="far-m-val">2.4 A·m²</span>
            </div>
          </label>
          <label class="field" id="wrap-far-N">
            <span>Turns N</span>
            <div class="slider-row">
              <input type="range" id="far-N" min="1" max="20" step="1" value="8" />
              <span class="mono val" id="far-N-val">8</span>
            </div>
          </label>
          <label class="field">
            <span>Loop resistance R</span>
            <div class="slider-row">
              <input type="range" id="far-Rloop" min="0.5" max="20" step="0.5" value="2" />
              <span class="mono val" id="far-Rloop-val">2.0 Ω</span>
            </div>
          </label>
          <label class="field">
            <span>Slow motion</span>
            <div class="slider-row">
              <input type="range" id="far-slow" min="0.2" max="2" step="0.1" value="1" />
              <span class="mono val" id="far-slow-val">1.0×</span>
            </div>
          </label>
          <p class="tiny">ε = −dΦ<sub>B</sub>/dt. Gold disk = +Φ (out of the page along +y), blue = −Φ. Yellow chevrons are the induced current. Convention: counterclockwise from +y is +I and makes +B<sub>y</sub>.</p>
        </div>`;
  },
  bind(api) {
    const $ = (id) => document.getElementById(id);
    $('btn-faraday-play').addEventListener('click', () => api.toggleSweep());
    const num = (id, key, scale = 1) =>
      $(id).addEventListener('input', (e) => {
        api.slice()[key] = Number(e.target.value) * scale;
        api.bump(false);
      });
    num('far-B', 'B');
    num('far-m', 'm');
    num('far-N', 'N');
    num('far-Rloop', 'Rloop');
    num('far-slow', 'slow');
  },
  syncControls(state) {
    const $ = (id) => document.getElementById(id);
    if ($('btn-faraday-play')) $('btn-faraday-play').textContent = state.anim.playing ? 'Pause' : 'Play';
    $('far-B').value = state.B;
    $('far-B-val').textContent = fmtB(state.B).replace(/<[^>]+>/g, '');
    $('far-m').value = state.m;
    $('far-m-val').textContent = `${state.m.toFixed(1)} A·m²`;
    $('far-N').value = state.N;
    $('far-N-val').textContent = String(state.N);
    $('far-Rloop').value = state.Rloop;
    $('far-Rloop-val').textContent = `${state.Rloop.toFixed(1)} Ω`;
    $('far-slow').value = state.slow;
    $('far-slow-val').textContent = `${state.slow.toFixed(1)}×`;
    $('wrap-far-B').hidden = state.kind === 'magnet';
    $('wrap-far-m').hidden = state.kind !== 'magnet';
    $('wrap-far-N').hidden = state.kind === 'magnet' || state.kind === 'bar';
  },
  init(ctx) {
    const u = UNITS_PER_METER;
    const group = new THREE.Group();
    ctx.scene.add(group);

    const diskMat = new THREE.MeshBasicMaterial({
      color: M.gold,
      transparent: true,
      opacity: 0.35,
      side: THREE.DoubleSide,
      depthWrite: false,
      toneMapped: false,
    });
    const disk = new THREE.Mesh(new THREE.CircleGeometry(1, 48), diskMat);
    disk.rotation.x = -Math.PI / 2;
    const loop = { group: new THREE.Group(), line: null };
    loop.group.add(disk);
    group.add(loop.group);

    const magnet = new THREE.Group();
    const n = new THREE.Mesh(
      new THREE.CylinderGeometry(0.14, 0.14, 0.55, 20),
      new THREE.MeshBasicMaterial({ color: M.red, toneMapped: false }),
    );
    const s = new THREE.Mesh(
      new THREE.CylinderGeometry(0.14, 0.14, 0.55, 20),
      new THREE.MeshBasicMaterial({ color: M.blue, toneMapped: false }),
    );
    n.position.y = 0.28;
    s.position.y = -0.28;
    magnet.add(n, s);
    const nLab = label('<span style="color:#fc6255">N</span>', 0.35, 0.28, 0);
    const sLab = label('<span style="color:#58c4dd">S</span>', 0.35, -0.28, 0);
    magnet.add(nLab, sLab);
    group.add(magnet);

    const rails = new THREE.Group();
    group.add(rails);
    const bar = new THREE.Group();
    group.add(bar);

    const Barrows = new THREE.Group();
    for (let i = -1; i <= 1; i++) {
      for (let j = -1; j <= 1; j++) {
        const a = new Arrow(new THREE.Vector3(0, 1, 0), new THREE.Vector3(i * 0.7, -1.1, j * 0.7), 1.6, 0x5cd0b3, 0.28, 0.2, 0.02);
        Barrows.add(a);
      }
    }
    group.add(Barrows);

    const emfLab = label('', 0, 1.2 * u, 0);
    group.add(emfLab);

    group.visible = false;
    return { group, disk, magnet, rails, bar, Barrows, emfLab, loop, chevrons: null, railKey: '' };
  },
  enter(ctx, handle) {
    handle.group.visible = true;
  },
  exit(ctx, handle) {
    handle.group.visible = false;
  },
  recompute(state, computed) {
    const kin = kinematics(state);
    const r = physics(state, kin);
    const I = inducedCurrent(r.emf, state.Rloop);
    const L = lenz(r.dPhi_dt);
    computed.far = { ...r, ...kin, I, L };
  },
  syncViews(state, computed, ctx) {
    const h = ctx.handle;
    const f = computed.far;
    if (!h || !f) return;
    const u = UNITS_PER_METER;
    const kind = state.kind;

    h.magnet.visible = kind === 'magnet';
    h.Barrows.visible = kind !== 'magnet';
    h.rails.visible = kind === 'bar';
    h.bar.visible = kind === 'bar';
    h.loop.group.visible = kind !== 'bar';
    h.disk.visible = kind !== 'bar';

    const R = kind === 'expand' ? f.R : state.R;
    const pts = loopPoints(R, 48, 0);
    setLine(h.loop, pts, u, M.yellow, 3.2);

    if (h.chevrons) {
      h.loop.group.remove(h.chevrons);
      disposeTree(h.chevrons);
      h.chevrons = null;
    }
    if (Math.abs(f.I) > 1e-8) {
      const g = new THREE.Group();
      const n = pts.length - 1;
      const ccw = f.I > 0;
      for (let k = 0; k < 8; k++) {
        const i = Math.floor(((k + 0.5) / 8) * n);
        const a = pts[i];
        const c = pts[(i + 1) % n];
        let dir = new THREE.Vector3(c.x - a.x, c.y - a.y, c.z - a.z).normalize();
        if (!ccw) dir.multiplyScalar(-1);
        const mid = new THREE.Vector3(a.x * u, a.y * u, a.z * u);
        g.add(new Arrow(dir, mid, 0.45, M.yellow, 0.22, 0.22, 0.001));
      }
      h.chevrons = g;
      h.loop.group.add(g);
    }

    if (kind !== 'bar') {
      h.disk.scale.setScalar(R * u);
      const mag = Math.min(0.55, 0.12 + Math.abs(f.Phi) * 80);
      h.disk.material.opacity = mag;
      h.disk.material.color.set(f.Phi >= 0 ? M.gold : M.blue);
      h.disk.rotation.x = -Math.PI / 2;
      h.loop.group.rotation.x = kind === 'generator' ? f.theta : 0;
    } else {
      h.loop.group.rotation.x = 0;
    }

    if (kind === 'magnet') {
      h.magnet.position.set(0, f.z * u, 0);
    }

    if (kind === 'bar') {
      const w = state.width;
      const railKey = `${w}`;
      if (h.railKey !== railKey) {
        h.railKey = railKey;
        while (h.rails.children.length) {
          const ch = h.rails.children[0];
          h.rails.remove(ch);
          disposeTree(ch);
        }
        const z1 = (w / 2) * u;
        h.rails.add(fatLine([-0.2 * u, 0, z1, 1.15 * u, 0, z1], { color: M.white, width: 2.5 }));
        h.rails.add(fatLine([-0.2 * u, 0, -z1, 1.15 * u, 0, -z1], { color: M.white, width: 2.5 }));
        h.rails.add(fatLine([-0.15 * u, 0, -z1, -0.15 * u, 0, z1], { color: M.yellow, width: 3 }));
      }
      while (h.bar.children.length) {
        const ch = h.bar.children[0];
        h.bar.remove(ch);
        disposeTree(ch);
      }
      const x = f.x * u;
      const z1 = (state.width / 2) * u;
      h.bar.add(fatLine([x, 0, -z1, x, 0, z1], { color: M.yellow, width: 4 }));
      const flux = new THREE.Mesh(
        new THREE.PlaneGeometry(Math.max(0.02, f.x) * u, state.width * u),
        new THREE.MeshBasicMaterial({
          color: f.Phi >= 0 ? M.gold : M.blue,
          transparent: true,
          opacity: 0.28,
          side: THREE.DoubleSide,
          depthWrite: false,
          toneMapped: false,
        }),
      );
      flux.rotation.x = -Math.PI / 2;
      flux.position.set((f.x / 2) * u, 0, 0);
      h.bar.add(flux);
    }

    h.emfLab.position.set(0, (kind === 'magnet' ? 1.6 : 1.15) * u, 0);
    h.emfLab.userData.el.innerHTML = `ε = ${fmtV(f.emf)}`;
    ctx.grid.visible = true;
  },
  tick(dt, state) {
    if (!state.anim.playing) return false;
    state.t += dt * (state.slow || 1);
    return true;
  },
  law(state) {
    const far = String.raw`\mathcal{E} = -\dfrac{d\Phi_B}{dt}`;
    if (state.kind === 'expand') return [far, String.raw`\Phi_B = NB\pi R^2\qquad \mathcal{E} = -NB\,2\pi R\,\dot R`];
    if (state.kind === 'bar') return [far, String.raw`\Phi_B = Bwx\qquad \mathcal{E} = -Bwv`];
    if (state.kind === 'generator') return [far, String.raw`\Phi_B = NBA\cos\omega t\qquad \mathcal{E} = NBA\omega\sin\omega t`];
    return [far, String.raw`\Phi_B = \dfrac{\mu_0 m}{2}\dfrac{R^2}{(R^2+z^2)^{3/2}}`];
  },
  liveRows(state, computed) {
    const f = computed.far;
    if (!f) return '';
    const rows = [
      kv('Φ<sub>B</sub>', fmtWb(f.Phi)),
      kv('dΦ/dt', `${fmtWb(f.dPhi_dt)}/s`),
      kv('ε = −dΦ/dt', qv('qV', fmtV(f.emf))),
      kv('I = ε/R', qv('qI', fmtI(f.I))),
      kv('Lenz', f.L.text),
    ];
    if (state.kind === 'magnet') {
      rows.push(kv('Magnet y', fmtLen(f.z)));
      rows.push(kv('v<sub>y</sub>', `${f.vz >= 0 ? '+' : '−'}${Math.abs(f.vz).toFixed(2)} m/s`));
    }
    if (state.kind === 'expand') {
      rows.push(kv('R', fmtLen(f.R)));
      rows.push(kv('Ṙ', `${f.Rdot >= 0 ? '+' : '−'}${Math.abs(f.Rdot).toFixed(3)} m/s`));
    }
    if (state.kind === 'bar') {
      rows.push(kv('x', fmtLen(f.x)));
      rows.push(kv('v', `${f.v >= 0 ? '+' : '−'}${Math.abs(f.v).toFixed(2)} m/s`));
    }
    if (state.kind === 'generator') {
      rows.push(kv('θ = ωt', `${((f.theta * 180) / Math.PI).toFixed(0)}°`));
      rows.push(kv('N B A ω (peak ε)', fmtV(state.N * state.B * loopAreaR(state.R) * state.omega)));
    }
    return rows.join('');
  },
  readout(state, computed) {
    const f = computed.far;
    if (!f) return '';
    return cells([
      ['Φ_B', fmtWb(f.Phi), f.Phi >= 0 ? '' : ''],
      ['ε', fmtV(f.emf), 'qV'],
      ['I induced', fmtI(f.I), 'qI'],
      ['Lenz B', f.L.inducedB > 0 ? '+ŷ' : f.L.inducedB < 0 ? '−ŷ' : '0', ''],
    ]);
  },
  coach(state, computed) {
    const f = computed.far;
    if (state.kind === 'magnet') {
      return {
        title: 'A changing flux, not “the magnet hitting the loop”',
        body: `The dipole’s flux through the loop is Φ = (μ₀ m / 2) R²/(R²+z²)^{3/2}. Moving it changes z, so dΦ/dt ≠ 0 and ε appears. ${f?.L.text}. That current’s field tries to keep Φ from changing — Lenz’s law.`,
      };
    }
    if (state.kind === 'expand') {
      return {
        title: 'Area changing in a constant B',
        body: 'B is uniform and constant; the loop’s area is not. Φ = B π R² so ε = −B 2π R Ṙ. Growing the loop increases +Φ, so the induced current is clockwise (from +y) and its field is −ŷ.',
      };
    }
    if (state.kind === 'bar') {
      return {
        title: 'Motional emf ε = B ℓ v',
        body: 'Charges in the moving bar feel F = q v × B and pile up until qE cancels it: ε = B ℓ v. Same number as −dΦ/dt with Φ = B ℓ x. The rails close the circuit so a current can flow.',
      };
    }
    return {
      title: 'Generator — a rotating loop',
      body: 'Φ = NBA cos ωt, so ε = NBA ω sin ωt. Peak emf when the flux is changing fastest (loop edge-on to B). Run a current through the same loop in B and the torque tries to kill the rotation — that opposing torque is back emf in a motor (Ch 50).',
    };
  },
});
