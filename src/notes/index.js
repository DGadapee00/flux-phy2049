/**
 * Class notes, one set per exam, kept as the HTML they were written in (src/notes/content/) and
 * read into the Notes panel (src/ui/notes.js). The course instructor has allowed the notes to be
 * included; see PROVENANCE.md.
 *
 * Each set lists its sections with the lab that shows them and the chapters whose practice problems
 * they prepare, so the three parts of the app point at each other: a section links to its lab and its
 * problems, a problem links back to the section it draws on, and a lab to the section it illustrates.
 *
 * Adding a set: drop the file in content/, keep its sections as <section class="topic" id="…"> with
 * an <h2>, and add an entry here. Math is typeset from \( … \) and \[ … \] by KaTeX.
 */
export const NOTES = {
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
      { id: 's7', n: 7, title: 'RC circuits', lab: 'rc', ch: ['44'], topics: ['rc'] },
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

/** The first section a lab illustrates, preferring the notes for the exam on screen. */
export function sectionForLab(labId, examId) {
  const sets = [NOTES[examId], ...allNotes()].filter(Boolean);
  for (const set of sets) {
    const hit = set.sections.find((s) => s.lab === labId);
    if (hit) return { set, section: hit };
  }
  return null;
}
