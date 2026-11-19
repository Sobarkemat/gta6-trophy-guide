// Loads the guide's own data files (all under app/, so the app works offline).
// trophies.json holds the 55 official trophies with our guides; roadmap.json the
// four platinum stages; sources.json the named sources every guide cites.

const cache = new Map();

export async function loadJson(path) {
  if (cache.has(path)) return cache.get(path);
  const response = await fetch(path);
  if (!response.ok) throw new Error('Could not load ' + path);
  const data = await response.json();
  cache.set(path, data);
  return data;
}

export async function loadGuideData() {
  const [trophiesDoc, roadmapDoc, sourcesDoc] = await Promise.all([
    loadJson('data/trophies.json'),
    loadJson('data/roadmap.json'),
    loadJson('data/sources.json'),
  ]);
  return {
    trophies: trophiesDoc.trophies,
    counts: trophiesDoc.counts,
    listNote: trophiesDoc.note,
    stages: roadmapDoc.stages,
    roadmapNote: roadmapDoc.note,
    sources: sourcesDoc.sources,
    sourcesNote: sourcesDoc.note,
  };
}

// Kind labels shown on the filter chips, in display order.
export const KIND_LABELS = {
  story: 'Story',
  side: 'Side quests',
  collectibles: 'Collectibles',
  activities: 'Activities',
  robbery: 'Robberies',
  exploration: 'Exploration',
  money: 'Money',
  misc: 'Misc',
  platinum: 'Platinum',
};

export function sourceByKey(sources, key) {
  return sources.find((s) => s.key === key) || null;
}
