import * as THREE from 'three';
import { CSS2DObject } from 'three/addons/renderers/CSS2DRenderer.js';
import { defineLab } from './define.js';
import { Arrow, M, fatLine, disposeTree } from '../scene/manim.js';
import { MEDIA, mediaById, snell, fmtDeg } from '../physics/optics.js';
import { kv, cells } from '../ui/shared.js';

const SCENARIOS = [
  { id: 'tir', name: 'Water → air, 55° — TIR', n1: 'water', n2: 'air', theta: 55 },
  { id: 'water-air', name: 'Water → air, 35° (still transmits)', n1: 'water', n2: 'air', theta: 35 },
  { id: 'air-glass', name: 'Air → glass, 45°', n1: 'air', n2: 'glass', theta: 45 },
  { id: 'air-water', name: 'Air → water, 40°', n1: 'air', n2: 'water', theta: 40 },
  { id: 'diamond', name: 'Diamond → air — small θ_c', n1: 'diamond', n2: 'air', theta: 30 },
];

const L = 1.55;

function label(html, x, y) {
  const el = document.createElement('div');
  el.className = 'circuit-label';
  el.innerHTML = html;
  const o = new CSS2DObject(el);
  o.position.set(x, y, 0.02);
  o.userData.el = el;
  return o;
}

function flat(pts) {
  const o = [];
  for (const p of pts) o.push(p.x, p.y, 0);
  return o;
}

function arc(r, a0, a1, n = 14) {
  const pts = [];
  for (let i = 0; i <= n; i++) {
    const a = a0 + ((a1 - a0) * i) / n;
    pts.push({ x: r * Math.cos(a), y: r * Math.sin(a) });
  }
  return pts;
}

function wipe(g) {
  while (g.children.length) {
    const ch = g.children[0];
    g.remove(ch);
    disposeTree(ch);
  }
}

export default defineLab({
  id: 'refraction',
  exam: 'e7',
  title: 'Refraction',
  hint: 'Raise θ₁ past the critical angle — the ray turns back',
  orbit: false,
  camera: { pos: new THREE.Vector3(0, 0.05, 14), target: new THREE.Vector3(0, 0.05, 0) },
  keys: { r: 'reset', R: 'reset' },
  scenarios: SCENARIOS,
  defaultState() {
    return { scenarioId: 'tir', n1: 'water', n2: 'air', theta: 55, anim: { playing: false, i: 0 } };
  },
  applyScenario(id, state) {
    const sc = SCENARIOS.find((s) => s.id === id) || SCENARIOS[0];
    state.scenarioId = sc.id;
    state.n1 = sc.n1;
    state.n2 = sc.n2;
    state.theta = sc.theta;
  },
  controls() {
    const opts = MEDIA.map((m) => `<option value="${m.id}">${m.name} (n=${m.n})</option>`).join('');
    return `
        <div class="lab-block">
          <label class="field"><span>Incident medium n₁</span><select id="ref-n1">${opts}</select></label>
          <label class="field"><span>Transmitted medium n₂</span><select id="ref-n2">${opts}</select></label>
          <label class="field">
            <span>Angle of incidence θ₁</span>
            <div class="slider-row">
              <input type="range" id="ref-th" min="0" max="85" step="0.5" value="45" />
              <span class="mono val" id="ref-th-val">45°</span>
            </div>
          </label>
          <p class="tiny">n₁ sinθ₁ = n₂ sinθ₂. θᵣ = θ₁ always. If n₁ &gt; n₂ and θ₁ &gt; θ_c = sin⁻¹(n₂/n₁), there is no θ₂ — total internal reflection.</p>
        </div>`;
  },
  bind(api) {
    const $ = (id) => document.getElementById(id);
    $('ref-n1').addEventListener('change', () => {
      api.slice().n1 = $('ref-n1').value;
      api.bump();
    });
    $('ref-n2').addEventListener('change', () => {
      api.slice().n2 = $('ref-n2').value;
      api.bump();
    });
    $('ref-th').addEventListener('input', (e) => {
      api.slice().theta = Number(e.target.value);
      api.bump(false);
    });
  },
  syncControls(state) {
    const $ = (id) => document.getElementById(id);
    $('ref-n1').value = state.n1;
    $('ref-n2').value = state.n2;
    $('ref-th').value = state.theta;
    $('ref-th-val').textContent = `${state.theta.toFixed(1)}°`;
  },
  init(ctx) {
    const group = new THREE.Group();
    ctx.scene.add(group);
    const left = new THREE.Mesh(
      new THREE.PlaneGeometry(3.4, 3.6),
      new THREE.MeshBasicMaterial({ color: 0x1c3a48, transparent: true, opacity: 0.55, toneMapped: false }),
    );
    left.position.set(-1.7, 0, -0.02);
    const right = new THREE.Mesh(
      new THREE.PlaneGeometry(3.4, 3.6),
      new THREE.MeshBasicMaterial({ color: 0x143028, transparent: true, opacity: 0.55, toneMapped: false }),
    );
    right.position.set(1.7, 0, -0.02);
    group.add(left, right);
    const rays = new THREE.Group();
    group.add(rays);
    const n1Lab = label('n₁', -2.2, 1.55);
    const n2Lab = label('n₂', 2.2, 1.55);
    group.add(n1Lab, n2Lab);
    group.visible = false;
    return { group, left, right, rays, n1Lab, n2Lab };
  },
  enter(ctx, handle) {
    handle.group.visible = true;
  },
  exit(ctx, handle) {
    handle.group.visible = false;
  },
  recompute(state, computed) {
    const m1 = mediaById(state.n1);
    const m2 = mediaById(state.n2);
    const th1 = (state.theta * Math.PI) / 180;
    computed.ref = { m1, m2, th1, ...snell(m1.n, th1, m2.n) };
  },
  syncViews(state, computed, ctx) {
    const h = ctx.handle;
    const r = computed.ref;
    if (!h || !r) return;
    h.n1Lab.userData.el.innerHTML = `${r.m1.name}<br>n₁ = ${r.m1.n}`;
    h.n2Lab.userData.el.innerHTML = `${r.m2.name}<br>n₂ = ${r.m2.n}`;
    h.left.material.color.set(r.m1.n > r.m2.n ? 0x1a3344 : 0x152830);
    h.right.material.color.set(r.m2.n > r.m1.n ? 0x1a3344 : 0x152830);
    wipe(h.rays);
    h.rays.add(fatLine([0, -1.8, 0, 0, 1.8, 0], { color: M.white, width: 2 }));
    h.rays.add(fatLine([-1.9, 0, 0, 1.9, 0, 0], { color: 0x555555, width: 1.4, dashed: true }));

    const th1 = r.th1;
    const pI = { x: -L * Math.cos(th1), y: -L * Math.sin(th1) };
    const pR = { x: -L * Math.cos(th1), y: L * Math.sin(th1) };
    h.rays.add(fatLine(flat([pI, { x: 0, y: 0 }]), { color: M.gold, width: 3.2 }));
    h.rays.add(new Arrow(new THREE.Vector3(Math.cos(th1), Math.sin(th1), 0), new THREE.Vector3(pI.x * 0.45, pI.y * 0.45, 0), 0.55, M.gold, 0.22, 0.16, 0.02));
    h.rays.add(fatLine(flat([{ x: 0, y: 0 }, pR]), { color: M.blue, width: 2.4 }));
    h.rays.add(label(`θ₁ ${fmtDeg(th1)}`, pI.x * 0.35 - 0.15, pI.y * 0.35 - 0.2));
    h.rays.add(label(`θᵣ ${fmtDeg(th1)}`, pR.x * 0.35 - 0.15, pR.y * 0.35 + 0.2));
    h.rays.add(fatLine(flat(arc(0.38, Math.PI, Math.PI + th1)), { color: M.gold, width: 1.5 }));
    h.rays.add(fatLine(flat(arc(0.32, Math.PI - th1, Math.PI)), { color: M.blue, width: 1.5 }));

    if (!r.tir && r.theta2 != null) {
      const th2 = r.theta2;
      const pT = { x: L * Math.cos(th2), y: L * Math.sin(th2) };
      h.rays.add(fatLine(flat([{ x: 0, y: 0 }, pT]), { color: 0x5cd0b3, width: 3.2 }));
      h.rays.add(new Arrow(new THREE.Vector3(Math.cos(th2), Math.sin(th2), 0), new THREE.Vector3(pT.x * 0.55, pT.y * 0.55, 0), 0.55, 0x5cd0b3, 0.22, 0.16, 0.02));
      h.rays.add(label(`θ₂ ${fmtDeg(th2)}`, pT.x * 0.4 + 0.1, pT.y * 0.4 + 0.15));
      h.rays.add(fatLine(flat(arc(0.38, 0, th2)), { color: 0x5cd0b3, width: 1.5 }));
    } else {
      h.rays.add(label('<span class="bad">TIR</span>', 0.7, 0.15));
    }
    ctx.grid.visible = false;
  },
  law: () => [
    String.raw`n_1\sin\theta_1 = n_2\sin\theta_2`,
    String.raw`\theta_r=\theta_1\qquad \theta_c=\sin^{-1}(n_2/n_1)\ \ (n_1>n_2)`,
  ],
  liveRows(state, computed) {
    const r = computed.ref;
    if (!r) return '';
    return [
      kv('n₁', `${r.m1.n} (${r.m1.name})`),
      kv('n₂', `${r.m2.n} (${r.m2.name})`),
      kv('θ₁', fmtDeg(r.th1)),
      kv('θᵣ = θ₁', fmtDeg(r.thetaR)),
      kv('θ₂', r.tir ? 'none — TIR' : fmtDeg(r.theta2)),
      kv('θ_c', r.thetaC == null ? 'none (n₁ ≤ n₂)' : fmtDeg(r.thetaC)),
      kv('n₁ sinθ₁', (r.m1.n * Math.sin(r.th1)).toFixed(3)),
      kv('n₂ sinθ₂', r.tir ? '—' : (r.m2.n * Math.sin(r.theta2)).toFixed(3)),
    ].join('');
  },
  readout(state, computed) {
    const r = computed.ref;
    if (!r) return '';
    return cells([
      ['θ₁', fmtDeg(r.th1), ''],
      ['θ₂', r.tir ? 'TIR' : fmtDeg(r.theta2), r.tir ? 'bad' : 'ok'],
      ['θ_c', r.thetaC == null ? '—' : fmtDeg(r.thetaC), ''],
      ['n₁ sinθ₁', (r.m1.n * Math.sin(r.th1)).toFixed(3), ''],
    ]);
  },
  coach(state, computed) {
    const r = computed.ref;
    if (!r) return { title: '', body: '' };
    if (r.tir) {
      return {
        title: 'Total internal reflection',
        body: `n₁ > n₂ and θ₁ = ${fmtDeg(r.th1)} is past θ_c = ${fmtDeg(r.thetaC)}. sinθ₂ would have to exceed 1, so there is no transmitted ray. Fiber optics and diamond sparkle are this law. Drop θ₁ below θ_c and the teal ray returns.`,
      };
    }
    if (r.m2.n > r.m1.n) {
      return {
        title: 'Into a slower medium — toward the normal',
        body: `n₂ > n₁ so θ₂ < θ₁. Light bends toward the normal. Check the live row: n₁ sinθ₁ = n₂ sinθ₂. The reflected gold/blue pair always has θᵣ = θ₁, even when a transmitted ray exists.`,
      };
    }
    if (r.m2.n < r.m1.n) {
      return {
        title: 'Into a faster medium — away from the normal',
        body: `θ₂ > θ₁. Push θ₁ up and θ₂ races toward 90°. At θ_c = ${fmtDeg(r.thetaC)} the transmitted ray skims the interface; beyond that, TIR.`,
      };
    }
    return {
      title: 'Same n — no bend',
      body: 'n₁ = n₂ so θ₂ = θ₁. The interface is optically invisible. Reflection is still there (θᵣ = θ₁) but refraction does not change direction.',
    };
  },
});
