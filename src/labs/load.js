const loaders = {
  gauss: () => import('./gauss.js'),
  field: () => import('./field.js'),
  integral: () => import('./integral.js'),
  force: () => import('./force.js'),
  potential: () => import('./potential.js'),
  capacitor: () => import('./capacitor.js'),
  ohm: () => import('./ohm.js'),
  power: () => import('./power.js'),
  vectors: () => import('./vectors.js'),
  conductors: () => import('./conductors.js'),
  biot: () => import('./biot.js'),
  circuits: () => import('./circuits.js'),
  ampere: () => import('./ampere.js'),
  magforce: () => import('./magforce.js'),
  faraday: () => import('./faraday.js'),
  ac: () => import('./ac.js'),
  emwave: () => import('./emwave.js'),
  polar: () => import('./polar.js'),
  refraction: () => import('./refraction.js'),
  mirrors: () => import('./mirrors.js'),
  lenses: () => import('./lenses.js'),
};

const cache = new Map();

export function hasLab(id) {
  return !!loaders[id];
}

export async function loadLab(id) {
  if (cache.has(id)) return cache.get(id);
  const loader = loaders[id];
  if (!loader) return null;
  const mod = await loader();
  const lab = mod.default;
  cache.set(id, lab);
  return lab;
}

export function loadExamLabs(labIds) {
  return Promise.all(labIds.filter(hasLab).map(loadLab));
}

export function registerLabLoader(id, loader) {
  loaders[id] = loader;
}
