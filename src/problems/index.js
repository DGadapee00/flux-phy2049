/**
 * Problem bank for PHY 2049 (Montgomery, Fall 2026 syllabus: Ch V, 34–65).
 * Each bank module exports an array of templates; see kit.js and PROBLEMS.md.
 */
import e1 from './bank/e1.js';
import e2 from './bank/e2.js';
import e3 from './bank/e3.js';
import e4 from './bank/e4.js';
import e5 from './bank/e5.js';
import e6 from './bank/e6.js';
import e7 from './bank/e7.js';
import wave from './bank/wave.js';

export const PROBLEMS = [...e1, ...e2, ...e3, ...e4, ...e5, ...e6, ...e7, ...wave];

const byIdMap = new Map(PROBLEMS.map((p) => [p.id, p]));

export const problemById = (id) => byIdMap.get(id) || null;
export const problemsForExam = (examId) => PROBLEMS.filter((p) => p.exam === examId);
export const problemsForLab = (labId) => PROBLEMS.filter((p) => p.lab === labId);

/** Chapters in syllabus order, for grouping in the UI. */
export const CHAPTER_ORDER = ['V', '34', '35', '36A', '36B', '36C', '37', '38', '39', '40', '41', '42', '43', '44', '45', '46', '47', '48', '49', '50', '51', '52', '53', '54', '55', '56', '57', '58', '59', '60', '62', '63', '64', '65'];

export const CHAPTER_TITLES = {
  V: 'Vectors',
  34: 'Electric charge',
  35: 'Coulomb’s law',
  '36A': 'Field of point charges',
  '36B': 'Continuous charge',
  '36C': 'Flux and Gauss’s law',
  37: 'Conductors',
  38: 'Electric potential',
  39: 'Potential of distributions',
  40: 'Capacitors',
  41: 'Current and resistance',
  42: 'Electric power',
  43: 'DC circuits',
  44: 'Kirchhoff’s rules and RC',
  45: 'Magnetism',
  46: 'Magnetic force',
  47: 'B from currents',
  48: 'Faraday and Lenz',
  49: 'Inductance',
  50: 'Motors and transformers',
  51: 'Induction at work',
  52: 'AC circuits',
  53: 'EM waves',
  54: 'The spectrum',
  55: 'Intensity',
  56: 'Polarization',
  57: 'Intro to optics',
  58: 'Refraction',
  59: 'Mirrors',
  60: 'Thin lenses',
  62: 'Optical instruments',
  63: 'Interference',
  64: 'Diffraction',
  65: 'Thin films',
};

export { instance, render, grade, answers, sig } from './engine.js';
export { applyProblem } from './simbridge.js';
