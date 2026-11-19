// Saved progress for the tracker: which trophies are earned, the spoiler
// setting, and export/import of the whole state as a JSON file.
// Everything lives in localStorage under one key, so the guide works offline
// and remembers progress between visits in the same browser.

const STORAGE_KEY = 'leonida-platinum-v1';

export function defaultState() {
  return { earned: [], spoilersHidden: false, updatedAt: new Date().toISOString() };
}

export function loadState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return defaultState();
    const parsed = JSON.parse(raw);
    if (!parsed || !Array.isArray(parsed.earned)) return defaultState();
    return {
      earned: parsed.earned.filter((id) => Number.isInteger(id)),
      spoilersHidden: parsed.spoilersHidden === true,
      updatedAt: typeof parsed.updatedAt === 'string' ? parsed.updatedAt : new Date().toISOString(),
    };
  } catch {
    return defaultState();
  }
}

export function saveState(state) {
  const clean = {
    earned: [...new Set(state.earned)].sort((a, b) => a - b),
    spoilersHidden: state.spoilersHidden === true,
    updatedAt: new Date().toISOString(),
  };
  localStorage.setItem(STORAGE_KEY, JSON.stringify(clean));
  return clean;
}

export function isEarned(state, trophyId) {
  return state.earned.includes(trophyId);
}

export function toggleEarned(state, trophyId) {
  const next = { ...state, earned: [...state.earned] };
  const at = next.earned.indexOf(trophyId);
  if (at >= 0) next.earned.splice(at, 1);
  else next.earned.push(trophyId);
  return saveState(next);
}

// Export: download the state as a JSON file the reader can keep or move.
export function exportFile(state) {
  const blob = new Blob([JSON.stringify(saveState(state), null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = 'leonida-platinum-progress.json';
  document.body.appendChild(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

// Import: read a file exported by this guide (or hand-written in the same
// shape) and return the state it holds, or null when it is not valid.
export async function importFile(file) {
  const text = await file.text();
  const parsed = JSON.parse(text);
  if (!parsed || !Array.isArray(parsed.earned)) return null;
  const ids = parsed.earned.filter((id) => Number.isInteger(id) && id >= 1 && id <= 55);
  return saveState({ earned: ids, spoilersHidden: parsed.spoilersHidden === true });
}
