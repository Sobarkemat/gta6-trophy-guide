// Boot for Leonida Platinum: loads the data, wires the toolbar and the
// navigation, and re-renders on every change. Routing is by hash, so a
// screenshot can open a view directly: #/roadmap, #/missables, #/sources,
// or #/trophy/17 for one trophy's guide.

import { KIND_LABELS, loadGuideData } from './data.js';
import { exportFile, importFile, loadState, saveState, toggleEarned } from './store.js';
import { makeFilterState } from './filters.js';
import {
  renderChecklist,
  renderDetail,
  renderKindChips,
  renderMissables,
  renderProgress,
  renderRoadmap,
  renderSources,
} from './views.js';

const $ = (id) => document.getElementById(id);

const els = {
  earnedCount: $('earnedCount'),
  progressFill: $('progressFill'),
  earnedByGrade: $('earnedByGrade'),
  gradeCounts: $('gradeCounts'),
  listSummary: $('listSummary'),
  list: $('trophyList'),
  detailCard: $('detailCard'),
  detailEmpty: $('detailEmpty'),
  pagePane: $('pagePane'),
  main: $('main'),
  toolbar: $('toolbar'),
  searchBox: $('searchBox'),
  kindChips: $('kindChips'),
  gradeFilter: $('gradeFilter'),
  statusFilter: $('statusFilter'),
  spoilerToggle: $('spoilerToggle'),
  missableToggle: $('missableToggle'),
  exportBtn: $('exportBtn'),
  importBtn: $('importBtn'),
  importFile: $('importFile'),
  resetBtn: $('resetBtn'),
  dataNote: $('dataNote'),
};

let data = null;
let state = loadState();
let filters = makeFilterState();
let selectedId = null;
let currentView = 'checklist';

function routeFromHash() {
  const hash = location.hash.replace(/^#\/?/, '');
  const [view, arg] = hash.split('/');
  if (view === 'roadmap' || view === 'missables' || view === 'sources') {
    currentView = view;
    selectedId = null;
  } else if (view === 'trophy' && Number.isInteger(Number(arg))) {
    currentView = 'checklist';
    selectedId = Number(arg);
  } else {
    currentView = 'checklist';
    selectedId = null;
  }
}

function renderAll() {
  routeFromHash();
  document.querySelectorAll('#mainNav button').forEach((btn) => {
    btn.classList.toggle('active', btn.dataset.view === currentView);
  });
  const isChecklist = currentView === 'checklist';
  els.main.hidden = !isChecklist;
  els.toolbar.hidden = !isChecklist;
  els.pagePane.hidden = isChecklist;
  renderProgress(data.trophies, state, els);
  if (isChecklist) {
    renderKindChips(Object.keys(KIND_LABELS), filters.kind, els.kindChips, (kind) => {
      filters.kind = kind;
      renderAll();
    });
    renderChecklist(data.trophies, filters, state, els, selectTrophy, toggleTrophy);
    const selected = data.trophies.find((t) => t.id === selectedId) || null;
    renderDetail(selected, data.sources, state, els, toggleTrophy);
    document.querySelectorAll('#trophyList li').forEach((li) => {
      li.classList.toggle('selected', Number(li.dataset.id) === selectedId);
    });
  } else if (currentView === 'roadmap') {
    renderRoadmap(data.stages, data.trophies, data.roadmapNote, els.pagePane);
  } else if (currentView === 'missables') {
    renderMissables(data.trophies, els.pagePane);
  } else if (currentView === 'sources') {
    renderSources(data.sources, data.sourcesNote, els.pagePane);
  }
}

function selectTrophy(id) {
  selectedId = id;
  location.hash = `#/trophy/${id}`;
  renderAll();
}

function toggleTrophy(id) {
  state = toggleEarned(state, id);
  renderAll();
}

function wireToolbar() {
  els.searchBox.addEventListener('input', () => {
    filters.query = els.searchBox.value.trim();
    renderAll();
  });
  els.gradeFilter.addEventListener('change', () => {
    filters.grade = els.gradeFilter.value;
    renderAll();
  });
  els.statusFilter.addEventListener('change', () => {
    filters.status = els.statusFilter.value;
    renderAll();
  });
  els.spoilerToggle.addEventListener('change', () => {
    state = saveState({ ...state, spoilersHidden: els.spoilerToggle.checked });
    renderAll();
  });
  els.missableToggle.addEventListener('change', () => {
    filters.missableOnly = els.missableToggle.checked;
    renderAll();
  });
  els.exportBtn.addEventListener('click', () => exportFile(state));
  els.importBtn.addEventListener('click', () => els.importFile.click());
  els.importFile.addEventListener('change', async () => {
    const file = els.importFile.files[0];
    if (!file) return;
    const next = await importFile(file).catch(() => null);
    if (next) {
      state = next;
      els.spoilerToggle.checked = state.spoilersHidden;
      renderAll();
    } else {
      alert('That file is not a Leonida Platinum progress export.');
    }
    els.importFile.value = '';
  });
  els.resetBtn.addEventListener('click', () => {
    if (confirm('Clear all earned trophies and the spoiler setting?')) {
      state = saveState({ earned: [], spoilersHidden: false });
      els.spoilerToggle.checked = false;
      selectedId = null;
      location.hash = '#/checklist';
      renderAll();
    }
  });
  document.querySelectorAll('#mainNav button').forEach((btn) => {
    btn.addEventListener('click', () => {
      location.hash = `#/${btn.dataset.view}`;
    });
  });
  window.addEventListener('hashchange', renderAll);
}

async function boot() {
  data = await loadGuideData();
  els.dataNote.textContent = data.listNote;
  els.spoilerToggle.checked = state.spoilersHidden;
  wireToolbar();
  renderAll();
}

boot().catch((error) => {
  els.listSummary.textContent = 'The guide data could not be loaded: ' + error.message;
});
