// Leonida Platinum — boot, saved progress, routing and toolbar.
// The data lives in data/trophies.json, data/roadmap.json and data/sources.json,
// fetched at run time from this app's own files. Nothing here talks to the network.
import { renderChecklist, renderRoadmap, renderMissables, renderSources, openTrophyDetail, closeTrophyDetail } from './views.js';

export const STORE_KEY = 'leonida-platinum-v1';
export const DEMO_EARNED_IDS = [2, 3, 4, 8, 15, 16, 19, 21, 31, 35, 44, 46, 53];

// The demo query (?demo) seeds a fixed, deterministic set of 13 earned trophies
// so the guide can be screenshotted with real progress showing. It only seeds
// a browser that has no saved progress yet, and it never overwrites a save.
function seedDemoIfRequested(trophies) {
  const params = new URLSearchParams(location.search);
  if (!params.has('demo')) return;
  try {
    if (localStorage.getItem(STORE_KEY)) return;
  } catch { return; }
  const earned = trophies.filter((t) => DEMO_EARNED_IDS.includes(t.id)).map((t) => t.name);
  saveState({ earned, spoiler: params.has('spoiler'), view: params.get('view') ?? null, detailId: params.get('trophy') ? Number(params.get('trophy')) : null });
}

function readState() {
  try {
    const raw = localStorage.getItem(STORE_KEY);
    if (!raw) return { earned: [], spoiler: false, view: null, detailId: null };
    const parsed = JSON.parse(raw);
    return {
      earned: Array.isArray(parsed.earned) ? parsed.earned : [],
      spoiler: parsed.spoiler === true,
      view: typeof parsed.view === 'string' ? parsed.view : null,
      detailId: typeof parsed.detailId === 'number' ? parsed.detailId : null,
    };
  } catch {
    return { earned: [], spoiler: false, view: null, detailId: null };
  }
}

function saveState(state) {
  try {
    localStorage.setItem(STORE_KEY, JSON.stringify(state));
  } catch {
    // Private mode or a full store: the tracker still works for the session.
  }
}

export function loadSavedProgress(trophies) {
  const state = readState();
  const known = new Set(trophies.map((t) => t.name));
  return new Set(state.earned.filter((name) => known.has(name)));
}

export function persistProgress(earned, spoiler) {
  const state = readState();
  saveState({ ...state, earned: [...earned], spoiler });
}

function currentView() {
  const hash = location.hash.replace(/^#\/?/, '');
  const params = new URLSearchParams(location.search);
  if (params.get('view')) return params.get('view');
  if (hash.startsWith('trophy/')) return 'checklist';
  if (['checklist', 'roadmap', 'missables', 'sources'].includes(hash)) return hash;
  return 'checklist';
}

function currentDetailId() {
  const hash = location.hash.replace(/^#\/?/, '');
  const params = new URLSearchParams(location.search);
  if (params.get('trophy')) return Number(params.get('trophy'));
  if (hash.startsWith('trophy/')) return Number(hash.slice('trophy/'.length));
  return null;
}

const viewEl = document.getElementById('view');
const searchEl = document.getElementById('search');
const kindEl = document.getElementById('kindFilter');
const gradeEl = document.getElementById('gradeFilter');
const earnedEl = document.getElementById('earnedFilter');
const spoilerEl = document.getElementById('spoilerToggle');
const statusEl = document.getElementById('filterStatus');

// Deep-linkable filters: ?kind=story&grade=silver&earned=unearned pre-sets the
// toolbar, so a filtered view can be shared or screenshotted as-is.
const linkParams = new URLSearchParams(location.search);
for (const [param, el] of [['kind', kindEl], ['grade', gradeEl], ['earned', earnedEl]]) {
  const value = linkParams.get(param);
  if (value && [...el.options].some((o) => o.value === value)) el.value = value;
}

const doc = await (await fetch('data/trophies.json')).json();
const roadmapDoc = await (await fetch('data/roadmap.json')).json();
const sourcesDoc = await (await fetch('data/sources.json')).json();
const sourceByKey = new Map(sourcesDoc.sources.map((s) => [s.key, s]));

seedDemoIfRequested(doc.trophies);

let earned = loadSavedProgress(doc.trophies);
let spoiler = readState().spoiler || new URLSearchParams(location.search).has('spoiler');
spoilerEl.checked = spoiler;

function gradeCountsText() {
  const counts = { platinum: 0, gold: 0, silver: 0, bronze: 0 };
  for (const t of doc.trophies) if (earned.has(t.name)) counts[t.grade] += 1;
  return `Platinum ${counts.platinum}/1 · Gold ${counts.gold}/2 · Silver ${counts.silver}/6 · Bronze ${counts.bronze}/46`;
}

function updateProgress() {
  const total = doc.trophies.length;
  const done = earned.size;
  const pct = Math.round((done / total) * 100);
  document.getElementById('earnedCount').textContent = String(done);
  document.getElementById('progressFill').style.width = `${pct}%`;
  document.getElementById('progressBar').setAttribute('aria-valuenow', String(done));
  document.getElementById('progressNote').textContent = done === total
    ? 'Platinum earned — Vice Got a Price!'
    : `${pct}% to the platinum · ${total - done} to go`;
  document.getElementById('gradeCounts').textContent = gradeCountsText();
}

function filters() {
  return {
    search: searchEl.value.trim().toLowerCase(),
    kind: kindEl.value,
    grade: gradeEl.value,
    earned: earnedEl.value,
    spoiler,
  };
}

function render() {
  const view = currentView();
  for (const a of document.querySelectorAll('.tabs a')) {
    if (a.dataset.view === view) a.setAttribute('aria-current', 'page');
    else a.removeAttribute('aria-current');
  }
  const detailId = currentDetailId();
  if (view === 'roadmap') renderRoadmap(viewEl, doc.trophies, roadmapDoc.stages, earned);
  else if (view === 'missables') renderMissables(viewEl, doc.trophies);
  else if (view === 'sources') renderSources(viewEl, sourcesDoc);
  else renderChecklist(viewEl, doc.trophies, earned, filters(), statusEl);
  if (detailId) openTrophyDetail(doc.trophies, detailId, earned, sourceByKey, spoiler, onToggleEarned);
  else closeTrophyDetail();
  updateProgress();
}

function onToggleEarned(name) {
  if (earned.has(name)) earned.delete(name);
  else earned.add(name);
  persistProgress(earned, spoiler);
  render();
}

function exportProgress() {
  const payload = { app: 'leonida-platinum', version: 1, exportedAt: new Date().toISOString(), earned: [...earned].sort() };
  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = 'leonida-platinum-progress.json';
  a.click();
  URL.revokeObjectURL(a.href);
  statusEl.textContent = `Exported ${earned.size} earned trophies to leonida-platinum-progress.json.`;
}

async function importProgress(file) {
  try {
    const parsed = JSON.parse(await file.text());
    const names = Array.isArray(parsed) ? parsed : parsed.earned;
    if (!Array.isArray(names)) throw new Error('no earned list');
    const known = new Set(doc.trophies.map((t) => t.name));
    const imported = names.filter((n) => typeof n === 'string' && known.has(n));
    earned = new Set(imported);
    persistProgress(earned, spoiler);
    render();
    statusEl.textContent = `Imported ${imported.length} earned trophies.`;
  } catch {
    statusEl.textContent = 'That file is not a Leonida Platinum progress export — nothing was changed.';
  }
}

searchEl.addEventListener('input', render);
kindEl.addEventListener('change', render);
gradeEl.addEventListener('change', render);
earnedEl.addEventListener('change', render);
spoilerEl.addEventListener('change', () => {
  spoiler = spoilerEl.checked;
  persistProgress(earned, spoiler);
  render();
});
document.getElementById('exportBtn').addEventListener('click', exportProgress);
document.getElementById('importFile').addEventListener('change', (e) => {
  const file = e.target.files[0];
  if (file) importProgress(file);
  e.target.value = '';
});
document.getElementById('resetBtn').addEventListener('click', () => {
  if (!earned.size && !spoiler) return;
  if (!window.confirm('Clear all earned trophies and turn spoilers back off?')) return;
  earned = new Set();
  spoiler = false;
  spoilerEl.checked = false;
  persistProgress(earned, spoiler);
  render();
  statusEl.textContent = 'Progress cleared.';
});

viewEl.addEventListener('click', (e) => {
  const row = e.target.closest('[data-trophy-id]');
  if (row && !e.target.closest('input[type="checkbox"]')) {
    location.hash = `#/trophy/${row.dataset.trophyId}`;
    return;
  }
  const box = e.target.closest('input[data-earned-toggle]');
  if (box) onToggleEarned(box.dataset.earnedToggle);
});

window.addEventListener('hashchange', render);
render();
