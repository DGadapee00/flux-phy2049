/** Course map. `labs` are implemented; `coming` is the rest of that exam. */

export const EXAMS = [
  {
    id: 'e1',
    n: 1,
    title: 'Charge & force',
    chapters: 'V, 34–35',
    date: 'Fri 8/28',
    labs: ['vectors', 'force'],
    coming: [],
  },
  {
    id: 'e2',
    n: 2,
    title: 'Fields & Gauss',
    chapters: '36–37',
    date: 'Fri 9/11',
    labs: ['field', 'integral', 'gauss', 'conductors'],
    coming: [],
  },
  {
    id: 'e3',
    n: 3,
    title: 'Potential, R, P',
    chapters: '38–42',
    date: 'Fri 9/25',
    labs: ['potential', 'capacitor', 'ohm', 'power'],
    coming: [],
  },
  {
    id: 'e4',
    n: 4,
    title: 'Circuits & magnetism',
    chapters: '43–47',
    date: 'Fri 10/9',
    labs: ['circuits', 'biot', 'ampere', 'magforce'],
    coming: [],
  },
  {
    id: 'e5',
    n: 5,
    title: 'Induction & AC',
    chapters: '48–52',
    date: 'Fri 10/23',
    labs: ['faraday', 'ac'],
    coming: [],
  },
  {
    id: 'e6',
    n: 6,
    title: 'EM waves',
    chapters: '53–57',
    date: 'Fri 11/6',
    labs: ['emwave', 'polar'],
    coming: [],
  },
  {
    id: 'e7',
    n: 7,
    title: 'Geometric optics',
    chapters: '58–62',
    date: 'Fri 11/20',
    labs: ['refraction', 'mirrors', 'lenses'],
    coming: [],
  },
  {
    id: 'wave',
    n: 8,
    title: 'Wave optics',
    chapters: '63–65',
    date: 'Final 12/9',
    labs: ['interference', 'diffraction', 'thinfilm'],
    coming: [],
  },
];

export const LAB_META = {
  vectors: { id: 'vectors', exam: 'e1', title: 'Vectors' },
  force: { id: 'force', exam: 'e1', title: 'Force' },
  field: { id: 'field', exam: 'e2', title: 'Field' },
  integral: { id: 'integral', exam: 'e2', title: 'Integrals' },
  gauss: { id: 'gauss', exam: 'e2', title: 'Gauss' },
  conductors: { id: 'conductors', exam: 'e2', title: 'Conductors' },
  circuits: { id: 'circuits', exam: 'e4', title: 'Circuits' },
  biot: { id: 'biot', exam: 'e4', title: 'Biot–Savart' },
  ampere: { id: 'ampere', exam: 'e4', title: 'Ampère' },
  magforce: { id: 'magforce', exam: 'e4', title: 'Mag force' },
  faraday: { id: 'faraday', exam: 'e5', title: 'Faraday' },
  ac: { id: 'ac', exam: 'e5', title: 'AC' },
  emwave: { id: 'emwave', exam: 'e6', title: 'EM wave' },
  polar: { id: 'polar', exam: 'e6', title: 'Polarization' },
  interference: { id: 'interference', exam: 'wave', title: 'Interference' },
  diffraction: { id: 'diffraction', exam: 'wave', title: 'Diffraction' },
  thinfilm: { id: 'thinfilm', exam: 'wave', title: 'Thin film' },
  refraction: { id: 'refraction', exam: 'e7', title: 'Refraction' },
  mirrors: { id: 'mirrors', exam: 'e7', title: 'Mirrors' },
  lenses: { id: 'lenses', exam: 'e7', title: 'Lenses' },
  potential: { id: 'potential', exam: 'e3', title: 'Potential' },
  capacitor: { id: 'capacitor', exam: 'e3', title: 'Capacitor' },
  ohm: { id: 'ohm', exam: 'e3', title: 'Ohm' },
  power: { id: 'power', exam: 'e3', title: 'Power' },
};

export function examById(id) {
  return EXAMS.find((e) => e.id === id) || EXAMS[1];
}

export function examForLab(labId) {
  const meta = LAB_META[labId];
  return meta ? examById(meta.exam) : examById('e2');
}

export function examIndex(id) {
  const i = EXAMS.findIndex((e) => e.id === id);
  return i < 0 ? 1 : i;
}
