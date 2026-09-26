/**
 * Class notes, one set per exam, kept as the HTML they were written in (src/notes/content/) and
 * read into the Notes panel (src/ui/notes.js). The course instructor has allowed the notes to be
 * included; see PROVENANCE.md.
 *
 * Each set lists its sections with the lab that shows them and the chapters whose practice problems
 * they prepare, so the three parts of the app point at each other: a section links to its lab and its
 * problems, a problem links back to the section it draws on, and a lab to the section it illustrates.
 *
 * `home: true` marks the section a lab's own "Notes" link opens, when that is not simply the first
 * section showing the lab.
 *
 * Adding a set: drop the file in content/, keep its sections as <section class="topic" id="…"> with
 * an <h2>, and add an entry here. Math is typeset from \( … \) and \[ … \] by KaTeX.
 */
export const NOTES = {
  e3: {
    exam: 'e3',
    title: 'Potential to Power',
    chapters: '38–42',
    load: () => import('./content/e3-potential-to-power.html?raw').then((m) => m.default),
    sections: [
      { id: 's1', n: 1, title: 'Work and potential energy', lab: 'potential', ch: ['38'], topics: ['work'] },
      { id: 's2', n: 2, title: 'Potential energy of point charges', lab: 'potential', ch: ['38'], topics: ['potential-energy'] },
      { id: 's3', n: 3, title: 'Electric potential', lab: 'potential', ch: ['38'], topics: ['units'], problems: ['e3.38.uniform-dV', 'e3.38.uniform-path', 'e3.38.uniform-rank'], home: true },
      { id: 's4', n: 4, title: 'Potential from charges', lab: 'integral', ch: ['38', '39'], topics: ['superposition', 'continuous-distribution'], problems: ['e3.38.point-V', 'e3.39.deltaV-two-radii'] },
      { id: 's5', n: 5, title: 'Field from potential', lab: 'potential', ch: ['38'], topics: ['gradient', 'graphs'] },
      { id: 's6', n: 6, title: 'Equipotentials and conductors', lab: 'potential', ch: ['38', '39'], topics: ['equipotential', 'conductors'] },
      { id: 's7', n: 7, title: 'Energy conservation with charges', lab: 'potential', ch: ['38', '39'], topics: ['energy'] },
      { id: 's8', n: 8, title: 'Capacitance', lab: 'capacitor', ch: ['40'], topics: ['networks'] },
      { id: 's9', n: 9, title: 'Energy in the field', lab: 'capacitor', ch: ['40'], topics: ['energy'] },
      { id: 's10', n: 10, title: 'Dielectrics and breakdown', lab: 'capacitor', ch: ['40'], topics: ['dielectrics', 'breakdown'] },
      { id: 's11', n: 11, title: 'Current and current density', lab: 'ohm', ch: ['41'], topics: ['drift-velocity'] },
      { id: 's12', n: 12, title: "Resistance and Ohm's law", lab: 'ohm', ch: ['41'], topics: ['resistance', 'ohms-law', 'temperature', 'non-ohmic'], problems: ['e3.41.across-resistor'], home: true },
      // No `power` tag: every Ch 42 problem has it, which would pull the AC and safety ones here too.
      { id: 's13', n: 13, title: 'Electrical power', lab: 'power', ch: ['42'] },
      { id: 's14', n: 14, title: 'Alternating current', lab: 'power', ch: ['42'], topics: ['rms', 'ac'] },
      { id: 's15', n: 15, title: 'Household electricity and safety', lab: null, ch: ['42'], topics: ['safety', 'grounding'] },
      { id: 's16', n: 16, title: 'Formula sheet', lab: null, ch: [] },
    ],
  },
  e4: {
    exam: 'e4',
    title: 'Charge in Motion',
    chapters: '43–47',
    load: () => import('./content/e4-charge-in-motion.html?raw').then((m) => m.default),
    sections: [
      { id: 's1', n: 1, title: 'The two rules behind every circuit', lab: 'circuits', ch: ['43'], topics: ['circuits'] },
      { id: 's2', n: 2, title: 'Series and parallel, derived', lab: 'circuits', ch: ['43'], topics: ['series', 'parallel'] },
      { id: 's3', n: 3, title: 'Reducing networks', lab: 'circuits', ch: ['43'], topics: ['networks'] },
      { id: 's4', n: 4, title: "Kirchhoff's method in full", lab: 'circuits', ch: ['43', '44'], topics: ['kirchhoff'] },
      { id: 's5', n: 5, title: 'Real sources and combining them', lab: 'circuits', ch: ['44'], topics: ['emf'] },
      { id: 's6', n: 6, title: 'Capacitors in combination', lab: 'rc', ch: ['44'], topics: ['capacitance'] },
      { id: 's7', n: 7, title: 'RC circuits', lab: 'rc', ch: ['44'], topics: ['rc'], home: true },
      { id: 's8', n: 8, title: 'The magnetic force on a charge', lab: 'magforce', ch: ['46'], topics: ['right-hand-rule'] },
      { id: 's9', n: 9, title: 'How charges move in B', lab: 'magforce', ch: ['46'], topics: ['circular-motion', 'energy'], problems: ['e4.46.selector', 'e4.46.undeflected'] },
      { id: 's10', n: 10, title: 'Force on a current', lab: 'magforce', ch: ['46'], problems: ['e4.46.wire-force'] },
      { id: 's11', n: 11, title: 'Torque and the magnetic dipole', lab: 'magforce', ch: ['46'], topics: ['torque'] },
      { id: 's12', n: 12, title: 'Currents make fields: Biot–Savart', lab: 'biot', ch: ['47'], topics: ['biot-savart', 'superposition'] },
      { id: 's13', n: 13, title: 'Forces between currents', lab: 'magforce', ch: ['47'] },
      { id: 's14', n: 14, title: "Ampère's law", lab: 'ampere', ch: ['47'], topics: ['ampere', 'solenoid'] },
      { id: 's15', n: 15, title: 'Magnetism in matter', lab: 'biot', ch: ['45'], topics: ['magnetism'] },
      { id: 's16', n: 16, title: "Earth's field and applications", lab: null, ch: ['45'] },
      { id: 's17', n: 17, title: 'Formula sheet', lab: null, ch: [] },
    ],
  },
};

export const notesForExam = (examId) => NOTES[examId] || null;

/** Every set of notes, in exam order, for the "what is here" list. */
export const allNotes = () => Object.values(NOTES);

/**
 * The section a practice problem draws on, among those covering its chapter: the one sharing most of
 * its topics (the problem bank's own tags: 'rc', 'kirchhoff', 'torque'…), then the one showing its
 * lab, then the first. A section can also claim problems by id (`problems`) where the tags are too
 * broad to tell. Null when no notes cover the chapter.
 */
export function sectionForProblem(tpl) {
  const topics = new Set(tpl.topics || []);
  for (const set of allNotes()) {
    const named = set.sections.find((s) => s.problems?.includes(tpl.id));
    if (named) return { set, section: named };
    const inCh = set.sections.filter((s) => s.ch.includes(tpl.ch));
    if (!inCh.length) continue;
    const score = (s) => 10 * (s.topics || []).filter((t) => topics.has(t)).length + (s.lab && s.lab === tpl.lab ? 1 : 0);
    const best = inCh.reduce((a, s) => (score(s) > score(a) ? s : a), inCh[0]);
    return { set, section: best };
  }
  return null;
}

/**
 * The first section a lab illustrates, in the notes for the exam on screen only: a lab listed under
 * two exams is doing a different job in each (Integrals is ∫dE in Exam 2, ∫dV in Exam 3).
 */
export function sectionForLab(labId, examId) {
  const set = NOTES[examId];
  const mine = set?.sections.filter((s) => s.lab === labId) || [];
  // A section marked `home` is the lab's own topic ("Electric potential" for Potential), else the first.
  const hit = mine.find((s) => s.home) || mine[0];
  return hit ? { set, section: hit } : null;
}
