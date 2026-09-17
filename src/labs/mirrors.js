import * as THREE from 'three';
import { defineLab } from './define.js';
import { M } from '../scene/manim.js';
import { imageOf, principalRays, fmtCm } from '../physics/optics.js';
import { wipe, label, line, arrowAt, tick, drawBundle, frameCamera } from '../scene/opticsBench.js';
import { kv, cells, eq } from '../ui/shared.js';

const SCENARIOS = [
  { id: 'concave-out', name: 'Concave, object beyond C — real, reduced', type: 'concave', fAbs: 12, do: 36, ho: 8 },
  { id: 'concave-c', name: 'Concave, object at C — real, same size', type: 'concave', fAbs: 12, do: 24, ho: 8 },
  { id: 'concave-f', name: 'Concave, between F and C — real, enlarged', type: 'concave', fAbs: 12, do: 18, ho: 6 },
  { id: 'concave-in', name: 'Concave, inside F — virtual, enlarged', type: 'concave', fAbs: 12, do: 8, ho: 6 },
  { id: 'convex', name: 'Convex — always virtual, reduced', type: 'convex', fAbs: 12, do: 20, ho: 8 },
];

function fOf(state) {
  return state.type === 'concave' ? state.fAbs : -state.fAbs;
}

function framing(state) {
  const f = fOf(state);
  const img = imageOf({ f, do: state.do, ho: state.ho, kind: 'mirror' });
  const xs = [-state.do, 0, -f, 8];
  if (state.type === 'concave') xs.push(-2 * f);
  if (!img.infinite) xs.push(img.imageX);
  return frameCamera(xs, [state.ho, img.hi]);
}

/** Mirror in the thin-mirror picture: a gentle arc (sagitta ≤ 1.2 cm) plus hatching on the back. */
function drawMirror(group, f, halfHeight) {
  const sag = (halfHeight * halfHeight) / (4 * Math.abs(f));
  const k = Math.min(1, 1.2 / sag);
  const pts = [];
  for (let i = -20; i <= 20; i++) {
    const y = (i / 20) * halfHeight;
    const x = ((f > 0 ? -1 : 1) * k * (y * y)) / (4 * Math.abs(f));
    pts.push({ x, y });
    if (i % 2 === 0 && i < 20) group.add(line([{ x, y }, { x: x + 1.2, y: y + 1.2 }], { color: M.white, width: 1.2, opacity: 0.45 }));
  }
  group.add(line(pts, { color: M.white, width: 3.4 }));
}

export default defineLab({
  id: 'mirrors',
  exam: 'e7',
  title: 'Mirrors',
  hint: 'Move the object through F — the image jumps from real to virtual',
  orbit: false,
  camera: frameCamera([-36, 0, -24, 8, -18], [8, -4]),
  cameraFor: framing,
  keys: { r: 'reset', R: 'reset' },
  scenarios: SCENARIOS,
  defaultState() {
    return { scenarioId: 'concave-out', type: 'concave', fAbs: 12, do: 36, ho: 8, anim: { playing: false, i: 0 } };
  },
  applyScenario(id, state) {
    const sc = SCENARIOS.find((s) => s.id === id) || SCENARIOS[0];
    Object.assign(state, { scenarioId: sc.id, type: sc.type, fAbs: sc.fAbs, do: sc.do, ho: sc.ho });
  },
  controls() {
    return `
        <div class="lab-block">
          <div class="seg" id="mir-type">
            <button type="button" data-type="concave" class="active">Concave f&gt;0</button>
            <button type="button" data-type="convex">Convex f&lt;0</button>
          </div>
          <label class="field">
            <span>|f|</span>
            <div class="slider-row">
              <input type="range" id="mir-f" min="6" max="30" step="0.5" value="12" />
              <span class="mono val" id="mir-f-val">12 cm</span>
            </div>
          </label>
          <label class="field">
            <span>Object distance <i>d</i><sub>o</sub></span>
            <div class="slider-row">
              <input type="range" id="mir-do" min="4" max="70" step="0.5" value="36" />
              <span class="mono val" id="mir-do-val">36 cm</span>
            </div>
          </label>
          <label class="field">
            <span>Object height <i>h</i><sub>o</sub></span>
            <div class="slider-row">
              <input type="range" id="mir-ho" min="2" max="16" step="0.5" value="8" />
              <span class="mono val" id="mir-ho-val">8.0 cm</span>
            </div>
          </label>
          <p class="tiny">1/f = 1/d_o + 1/d_i, m = −d_i/d_o = h_i/h_o. Solid lines are real rays; dashed lines are extensions your eye traces back to a virtual image. The view re-frames when you let go of a slider.</p>
        </div>`;
  },
  bind(api) {
    const $ = (id) => document.getElementById(id);
    $('mir-type').addEventListener('click', (e) => {
      const btn = e.target.closest('[data-type]');
      if (!btn) return;
      api.slice().type = btn.dataset.type;
      api.bump();
      api.resetCamera();
    });
    const num = (id, key) => {
      $(id).addEventListener('input', (e) => {
        api.slice()[key] = Number(e.target.value);
        api.bump(false);
      });
      $(id).addEventListener('change', () => api.resetCamera());
    };
    num('mir-f', 'fAbs');
    num('mir-do', 'do');
    num('mir-ho', 'ho');
  },
  syncControls(state) {
    const $ = (id) => document.getElementById(id);
    document.querySelectorAll('#mir-type [data-type]').forEach((b) => {
      b.classList.toggle('active', b.dataset.type === state.type);
    });
    $('mir-f').value = state.fAbs;
    $('mir-f-val').textContent = fmtCm(state.fAbs);
    $('mir-do').value = state.do;
    $('mir-do-val').textContent = fmtCm(state.do);
    $('mir-ho').value = state.ho;
    $('mir-ho-val').textContent = fmtCm(state.ho);
  },
  init(ctx) {
    const group = new THREE.Group();
    ctx.scene.add(group);
    const draw = new THREE.Group();
    group.add(draw);
    group.visible = false;
    return { group, draw };
  },
  enter(ctx, handle) {
    handle.group.visible = true;
  },
  exit(ctx, handle) {
    handle.group.visible = false;
  },
  recompute(state, computed) {
    const f = fOf(state);
    const img = imageOf({ f, do: state.do, ho: state.ho, kind: 'mirror' });
    const span = Math.max(state.do, 2 * Math.abs(f)) + 20;
    computed.mir = { f, ...img, bundle: principalRays({ f, do: state.do, ho: state.ho, kind: 'mirror', span }) };
  },
  syncViews(state, computed, ctx) {
    const h = ctx.handle;
    const m = computed.mir;
    if (!h || !m) return;
    wipe(h.draw);
    const f = m.f;
    const halfH = Math.min(40, Math.max(14, state.ho + 6, Number.isFinite(m.hi) ? Math.abs(m.hi) + 6 : 0));
    const left = -(Math.max(state.do, 2 * Math.abs(f)) + 20);
    const right = Math.max(20, !m.real && Number.isFinite(m.imageX) ? m.imageX + 10 : 0);
    h.draw.add(line([{ x: left, y: 0 }, { x: right, y: 0 }], { color: 0x666666, width: 1.5 }));
    drawMirror(h.draw, f, halfH);
    drawBundle(h.draw, m.bundle);

    h.draw.add(arrowAt(-state.do, state.ho, M.gold));
    h.draw.add(label('object', -state.do, state.ho + 3));
    if (!m.infinite && Number.isFinite(m.imageX)) {
      h.draw.add(arrowAt(m.imageX, m.hi, m.real ? M.red : M.blue));
      h.draw.add(label(m.real ? 'real image' : 'virtual image', m.imageX, m.hi + (m.hi >= 0 ? 3 : -3.5)));
    }
    tick(h.draw, -f, 'F', M.gold);
    tick(h.draw, -2 * f, 'C');
    h.draw.add(label('V', 1.8, -2.6));
    if (state.type === 'convex') h.draw.add(label('<small>F and C are behind the mirror</small>', -f, -6));
    ctx.grid.visible = false;
  },
  law: () => [
    String.raw`\dfrac{1}{f}=\dfrac{1}{d_o}+\dfrac{1}{d_i}\qquad f=\dfrac{R}{2}`,
    String.raw`m=-\dfrac{d_i}{d_o}=\dfrac{h_i}{h_o}\qquad f>0\text{ concave},\ f<0\text{ convex}`,
  ],
  liveRows(state, computed) {
    const m = computed.mir;
    if (!m) return '';
    return [
      kv(String.raw`$f$ ($R = 2f$)`, `${fmtCm(m.f)} ($R$ = ${fmtCm(2 * m.f)})`),
      kv(String.raw`$d_o$`, fmtCm(state.do)),
      kv(String.raw`$d_i$`, m.infinite ? '∞' : `${fmtCm(m.di)} ${m.di > 0 ? '(in front)' : '(behind)'}`),
      kv(String.raw`$1/d_o + 1/d_i$`, m.infinite ? `$1/f$ = ${(1 / m.f).toFixed(4)} cm⁻¹` : `${(1 / state.do + 1 / m.di).toFixed(4)} cm⁻¹`),
      kv(String.raw`$1/f$`, `${(1 / m.f).toFixed(4)} cm⁻¹`),
      kv(String.raw`$m = -d_i/d_o$`, m.infinite ? '∞' : m.m.toFixed(3)),
      kv(String.raw`$h_i = m h_o$`, m.infinite ? '∞' : fmtCm(m.hi)),
      kv('Image', m.type),
    ].join('');
  },
  readout(state, computed) {
    const m = computed.mir;
    if (!m) return '';
    return cells([
      [String.raw`$d_i$`, m.infinite ? '∞' : fmtCm(m.di), m.real ? 'ok' : ''],
      [String.raw`$m$`, m.infinite ? '∞' : m.m.toFixed(2), ''],
      ['Image', m.type, m.real ? '' : 'warn'],
      [String.raw`$f$`, fmtCm(m.f), ''],
    ]);
  },
  coach(state, computed) {
    const m = computed.mir;
    if (state.type === 'convex') {
      return {
        title: String.raw`Convex mirror — $f$ is negative`,
        body: [
          String.raw`The reflected rays spread apart (solid). Traced backward (dashed) they meet behind the mirror, giving a virtual, upright, reduced image with $d_i < 0$.`,
          String.raw`Car side mirrors do this: a wide field of view, and objects are closer than they appear because $|m| < 1$.`,
        ],
      };
    }
    if (m?.infinite) {
      return {
        title: String.raw`Object at $F$ — reflected rays leave parallel`,
        body: [
          eq(String.raw`\frac{1}{d_i} = \frac{1}{f} - \frac{1}{d_o} = 0 \quad\Longrightarrow\quad d_i = \infty`),
          String.raw`A bulb at the focus of a concave mirror makes a searchlight beam. Nudge $d_o$ to either side of $F$ and the image snaps between real/inverted and virtual/upright.`,
        ],
      };
    }
    if (m?.real) {
      return {
        title: 'Real image — the rays really cross in front',
        body: [
          `${m.type}. Gold: parallel, then through $F$. Teal: aimed at $C$, straight back. Blue: through $F$, then parallel.`,
          `All three reflected rays pass through one point, so the light really does gather there — you could put a screen at $d_i$ = ${fmtCm(m.di)}.`,
        ],
      };
    }
    return {
      title: 'Virtual image — behind the mirror',
      body: `The object is inside $F$, so the reflected rays (solid) diverge and never meet. Your eye extends them backward (dashed) to a point ${fmtCm(-(m?.di ?? 0))} behind the mirror: ${m?.type}. That is a shaving or makeup mirror.`,
    };
  },
});
