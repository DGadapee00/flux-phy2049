import { EXAMS, LAB_META, examById } from '../data/catalog.js';

/** Parse `#/e2/gauss` or `#/gauss` or empty. */
export function parseHash() {
  const raw = (typeof location === 'undefined' ? '' : location.hash).replace(/^#\/?/, '');
  const [a, b] = raw.split('/').filter(Boolean);
  if (!a) return { examId: 'e2', labId: 'gauss' };
  if (LAB_META[a] && !b) {
    const meta = LAB_META[a];
    return { examId: meta.exam, labId: a };
  }
  const exam = examById(a);
  if (b && exam.labs.includes(b)) return { examId: exam.id, labId: b };
  if (b && LAB_META[b]) return { examId: LAB_META[b].exam, labId: b };
  return { examId: exam.id, labId: exam.labs[0] || null };
}

/**
 * Each lab switch is a history entry so Back / Forward walk through labs.
 * `replace` is for boot, where we only normalize the URL (e.g. `#/` → `#/e2/gauss`).
 */
export function writeHash(examId, labId, { replace = false } = {}) {
  const next = labId ? `#/${examId}/${labId}` : `#/${examId}`;
  if (location.hash === next) return;
  if (replace) history.replaceState(null, '', next);
  else history.pushState(null, '', next);
}

export function neighborExam(examId, dir) {
  const i = EXAMS.findIndex((e) => e.id === examId);
  const j = Math.max(0, Math.min(EXAMS.length - 1, i + dir));
  return EXAMS[j];
}
