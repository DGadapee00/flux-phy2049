/**
 * The order a chapter is learned in.
 *
 * The bank files are in the order problems were written, which is no order to study in. Here each
 * chapter is laid out as a path: what the quantities are, one formula at a time, then signs and
 * direction, then combining ideas, then graphs and calculus, then the exam-style problems — each
 * stage leaning on the ones before it. The Practice list follows this order and shows the stage
 * names as headings; mixed sets, review and practice exams stay shuffled on purpose.
 *
 * A chapter listed here must name every one of its templates exactly once (the problem check fails
 * otherwise). A chapter not listed keeps the bank's order.
 */
export const SEQUENCE = {
  38: [
    ['What V, U and E are', ['e3.38.units-of', 'e3.38.point-V', 'e3.38.pair-energy', 'e3.38.work-and-deltaV']],
    ['The uniform field', ['e3.38.uniform-dV', 'e3.38.uniform-rank', 'e3.38.uniform-path', 'e3.38.uniform-zero-V']],
    ['Signs and direction', ['e3.38.charge-moves', 'e3.38.pe-rank', 'e3.38.moving-charge-energy', 'e3.38.field-potential-traps', 'e3.38.equipotentials']],
    ['Energy and motion', ['e3.38.work-radial', 'e3.38.accelerate', 'e3.38.system-energy']],
    ['E from V, and back', ['e3.38.E-from-V', 'e3.38.V-poly-field', 'e3.38.V-graph', 'e3.38.V-graph-E', 'e3.38.V-cubic', 'e3.38.work-nonuniform']],
  ],
  39: [
    ['Point charges add as scalars', ['e3.39.two-charges-V', 'e3.39.deltaV-two-radii', 'e3.39.three-charges-V', 'e3.39.zero-V-point', 'e3.39.compare-configs']],
    ['Energy and motion', ['e3.39.sphere-accelerate', 'e3.39.speed-with-v0']],
    ['Equipotentials', ['e3.39.equipotential-props', 'e3.39.equipotential-map']],
    ['Conductors', ['e3.39.sphere-V']],
    ['Continuous charge: V = ∫ k dq / r', ['e3.39.ring-V', 'e3.39.arc-center-V', 'e3.39.rod-V', 'e3.39.rod-axis-V', 'e3.39.disk-V']],
  ],
  40: [
    ['What capacitance is', ['e3.40.increase-C', 'e3.40.basics', 'e3.40.parallel-plate']],
    ['Dielectrics: battery on or off', ['e3.40.C-dielectric', 'e3.40.dielectric-battery', 'e3.40.dielectric-isolated', 'e3.40.scaling']],
    ['Stored energy', ['e3.40.energy', 'e3.40.C-for-energy']],
    ['Combining capacitors', ['e3.40.combo']],
    ['Beyond the sheets: sparks', ['e3.40.spark-energy', 'e3.40.gap-holds', 'e3.40.wider-gap', 'e3.40.paschen-min']],
  ],
  41: [
    ["Current and Ohm's law", ['e3.41.charge-flow', 'e3.41.ohm-basics', 'e3.41.non-ohmic', 'e3.41.across-resistor']],
    ['Resistance from shape', ['e3.41.wire-R', 'e3.41.geometry-concepts', 'e3.41.stretch', 'e3.41.block-R']],
    ['Temperature', ['e3.41.temperature']],
    ['Inside the wire', ['e3.41.drift']],
  ],
  42: [
    ['Power, four ways', ['e3.42.power-basics', 'e3.42.R-from-P-I', 'e3.42.bulb', 'e3.42.two-bulbs', 'e3.42.concepts']],
    ['Energy, heat and cost', ['e3.42.heater', 'e3.42.cost', 'e3.42.fuse']],
    ['AC: rms and peak', ['e3.42.ac-rms', 'e3.42.ac-from-equation', 'e3.42.ac-graph']],
    ['Safety', ['e3.42.grounding', 'e3.42.body-current']],
    ['Exam-style', ['e3.42.hot-wire']],
  ],
};

const RANK = new Map();
const STAGE = new Map();
{
  let r = 0;
  for (const stages of Object.values(SEQUENCE)) {
    stages.forEach(([name, ids], si) => {
      for (const id of ids) {
        RANK.set(id, r++);
        STAGE.set(id, { name, index: si });
      }
    });
  }
}

/** Where a template sits in its chapter's path; unlisted templates keep their bank order after it. */
export const sequenceRank = (id) => RANK.get(id) ?? Infinity;
/** The stage a template belongs to — { name, index } — or null for a chapter without a path. */
export const stageOf = (id) => STAGE.get(id) ?? null;
