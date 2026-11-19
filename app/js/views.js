// Rendering: the checklist rows, the guide detail card, and the Roadmap,
// Missables and Sources pages. All text comes from the data files; nothing
// here fetches the network.

import { KIND_LABELS, sourceByKey } from './data.js';
import { applyFilters, countByGrade, displayDescription, displayName, isSpoiled } from './filters.js';
import { isEarned as earnedInState } from './store.js';

function esc(text) {
  return String(text)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;');
}

export function gradeLabel(grade) {
  return grade.charAt(0).toUpperCase() + grade.slice(1);
}

function pill(trophy) {
  const parts = [`<span class="pill grade-${trophy.grade}">${gradeLabel(trophy.grade)}</span>`];
  if (trophy.kind !== trophy.grade) parts.push(`<span class="pill">${esc(KIND_LABELS[trophy.kind] || trophy.kind)}</span>`);
  if (trophy.hidden) parts.push('<span class="pill">Hidden</span>');
  if (trophy.missable) parts.push('<span class="pill missable">Missable</span>');
  if (trophy.guide.includes('UNCONFIRMED')) parts.push('<span class="pill unconfirmed">Unconfirmed</span>');
  return parts.join('');
}

export function renderProgress(trophies, state, els) {
  const { earned, total } = countByGrade(trophies, state);
  els.earnedCount.textContent = String(state.earned.length);
  els.progressFill.style.width = `${Math.round((state.earned.length / trophies.length) * 100)}%`;
  els.earnedByGrade.textContent =
    `Earned: ${earned.platinum} platinum · ${earned.gold} gold · ${earned.silver} silver · ${earned.bronze} bronze` +
    ` (of ${total.platinum} / ${total.gold} / ${total.silver} / ${total.bronze})`;
}

export function renderKindChips(kinds, activeKind, container, onPick) {
  container.innerHTML = '';
  const all = document.createElement('button');
  all.type = 'button';
  all.textContent = 'All kinds';
  all.className = activeKind === '' ? 'active' : '';
  all.addEventListener('click', () => onPick(''));
  container.appendChild(all);
  for (const kind of kinds) {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.textContent = KIND_LABELS[kind] || kind;
    btn.className = activeKind === kind ? 'active' : '';
    btn.addEventListener('click', () => onPick(kind));
    container.appendChild(btn);
  }
}

export function renderChecklist(trophies, filters, state, els, onSelect, onToggle) {
  const shown = applyFilters(trophies, filters, state);
  els.listSummary.textContent =
    `Showing ${shown.length} of ${trophies.length} trophies` +
    (state.earned.length ? ` · ${state.earned.length} earned` : ' · none earned yet') +
    (state.spoilersHidden ? ' · spoilers hidden' : '');
  els.list.innerHTML = '';
  for (const trophy of shown) {
    const li = document.createElement('li');
    const earned = earnedInState(state, trophy.id);
    li.className = earned ? 'earned' : '';
    li.dataset.id = String(trophy.id);
    const tick = document.createElement('input');
    tick.type = 'checkbox';
    tick.className = 'tick';
    tick.checked = earned;
    tick.setAttribute('aria-label', `Earned: ${displayName(trophy, state)}`);
    tick.addEventListener('click', (event) => {
      event.stopPropagation();
      onToggle(trophy.id);
    });
    const body = document.createElement('div');
    body.innerHTML =
      `<div class="tname">${esc(displayName(trophy, state))}` +
      (trophy.hidden && !isSpoiled(trophy, state) ? ' <span class="hiddenTag">(hidden on PSN)</span>' : '') +
      `</div><div class="tdesc">${esc(displayDescription(trophy, state))}</div>` +
      `<div class="tmeta">${pill(trophy)}</div>`;
    const num = document.createElement('div');
    num.className = 'tmeta';
    num.innerHTML = `<span class="pill">#${trophy.id}</span>`;
    li.append(tick, body, num);
    li.addEventListener('click', () => onSelect(trophy.id));
    els.list.appendChild(li);
  }
  if (shown.length === 0) {
    const li = document.createElement('li');
    li.textContent = 'No trophies match these filters. Clear the search or a filter to see the list again.';
    els.list.appendChild(li);
  }
}

export function renderDetail(trophy, sources, state, els, onToggle) {
  const card = els.detailCard;
  const empty = els.detailEmpty;
  if (!trophy) {
    card.hidden = true;
    empty.hidden = false;
    return;
  }
  empty.hidden = true;
  card.hidden = false;
  const earned = earnedInState(state, trophy.id);
  const spoiled = isSpoiled(trophy, state);
  const cited = trophy.sources
    .map((key) => sourceByKey(sources, key))
    .filter(Boolean)
    .map((s) => `<li><a href="${esc(s.url)}" target="_blank" rel="noopener">${esc(s.name)}</a> &mdash; ${esc(s.covers)}</li>`)
    .join('');
  const stageNames = { 1: 'Stage 1 - Story', 2: 'Stage 2 - 100% checklist', 3: 'Stage 3 - Cleanup', 4: 'Stage 4 - Platinum' };
  card.innerHTML =
    `<h2>${esc(displayName(trophy, state))}</h2>` +
    `<p class="tmeta">${pill(trophy)}<span class="pill">#${trophy.id} of 55</span></p>` +
    `<h3>Official description</h3><p class="official">&ldquo;${esc(displayDescription(trophy, state))}&rdquo;</p>` +
    (spoiled
      ? `<p class="warn">Spoilers are hidden, so this story trophy stays blank until you earn it. Turn spoilers off, or tick it earned, to read its guide.</p>`
      : `<h3>Guide</h3><p>${esc(trophy.guide)}</p>`) +
    `<h3>Roadmap</h3><p>${esc(stageNames[trophy.stage] || '')}</p>` +
    (trophy.missable
      ? `<p class="warn"><strong>Missable:</strong> this is the only trophy any published guide flags as possibly missable. Do the Chapter 1 meditation while you still can; see the guide above.</p>`
      : `<p>Not missable: it stays available in free-roam after the story, or pops from the story itself.</p>`) +
    `<h3>Sources</h3><ul>${cited}</ul>` +
    `<button class="earnedBtn" type="button">${earned ? 'Mark as not earned' : 'Mark as earned'}</button>`;
  card.querySelector('.earnedBtn').addEventListener('click', () => onToggle(trophy.id));
}

export function renderRoadmap(stages, trophies, note, pane) {
  const byId = new Map(trophies.map((t) => [t.id, t]));
  const stageHtml = stages
    .map((stage) => {
      const names = stage.trophies.map((id) => esc(byId.get(id)?.name || `#${id}`)).join(', ');
      return `<div class="stage"><h3>${esc(stage.title)} <span class="hours">(${esc(stage.hours)} hours)</span></h3>` +
        `<p>${esc(stage.text)}</p><p class="stageTrophies">Trophies: ${names}</p></div>`;
    })
    .join('');
  pane.innerHTML =
    `<div class="pageCard"><h2>Roadmap to Platinum</h2><p>${esc(note)}</p>` +
    `<p><strong>The plan in one line:</strong> finish the story, then the 100% checklist, then the strangers and the cryptic trophies, then the platinum pops. About 200 hours in total, one playthrough, difficulty 4/10 (PowerPyx).</p>${stageHtml}</div>`;
}

export function renderMissables(trophies, pane) {
  const missable = trophies.filter((t) => t.missable);
  const story = trophies.filter((t) => t.kind === 'story');
  pane.innerHTML =
    `<div class="pageCard"><h2>Missable trophies</h2>` +
    `<p><strong>${missable.length} trophy is flagged as possibly missable.</strong> Every other trophy is either automatic from the story or still available in free-roam after the story, because there is no mission replay but nothing trophy-related is locked behind a one-time moment. PowerPyx is the source for this: it flags one trophy and one only.</p>` +
    missable
      .map((t) => `<div class="stage"><h3>${esc(t.name)} <span class="pill grade-${t.grade}">${gradeLabel(t.grade)}</span> <span class="pill missable">Missable</span></h3><p>${esc(t.guide)}</p></div>`)
      .join('') +
    `<h3>Story trophies cannot be missed</h3><p>All ${story.length} story trophies pop automatically when you finish their chapter or mission. There are no mission gold medals and no difficulty trophies, so you cannot fail one by playing badly.</p>` +
    `<h3>Cheap insurance</h3><p>The game has 15 manual save slots and 1 autosave slot. PowerPyx recommends a save at the start and end of each chapter (10 saves), then rotating the remaining 5 for free-roam cleanup. Keep cheats off: they disable trophies and saving.</p></div>`;
}

export function renderSources(sources, note, pane) {
  pane.innerHTML =
    `<div class="pageCard"><h2>Sources</h2><p>${esc(note)}</p><ul>` +
    sources
      .map((s) => `<li><a href="${esc(s.url)}" target="_blank" rel="noopener">${esc(s.name)}</a> &mdash; ${esc(s.covers)}</li>`)
      .join('') +
    `</ul><h3>How to read this guide</h3><p>Each trophy's guide names its sources beside it. A guide that cites no source earns no trust: if a step has no source, the guide says so and marks the trophy UNCONFIRMED instead of inventing a method. The official names and descriptions are PlayStation's own words; everything else is written for this guide.</p></div>`;
}
