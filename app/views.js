// Leonida Platinum — the views: checklist, trophy detail, roadmap, missables, sources.
// All text is built from the fetched data; no page here makes a network request.

const KIND_LABELS = {
  platinum: 'Platinum',
  story: 'Story',
  completion: '100% completion',
  collectibles: 'Collectibles',
  activities: 'Activities',
};

const panel = document.getElementById('detailPanel');

function el(tag, className, text) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text !== undefined) node.textContent = text;
  return node;
}

function gradeBadge(grade) {
  return el('span', `badge ${grade}`, grade);
}

function isHiddenBySpoiler(trophy, spoiler, earned) {
  return spoiler && trophy.kind === 'story' && !earned.has(trophy.name);
}

function trophyRow(trophy, earned, spoiler) {
  const row = el('article', 'trophy-row');
  row.dataset.trophyId = String(trophy.id);
  if (earned.has(trophy.name)) row.classList.add('earned');
  const hidden = isHiddenBySpoiler(trophy, spoiler, earned);
  if (hidden) row.classList.add('spoiler-hidden');

  const box = document.createElement('input');
  box.type = 'checkbox';
  box.checked = earned.has(trophy.name);
  box.dataset.earnedToggle = trophy.name;
  box.setAttribute('aria-label', `Mark ${hidden ? 'this hidden story trophy' : trophy.name} as earned`);
  row.append(box);

  const body = el('div');
  body.append(el('div', 'trophy-name', hidden ? 'Hidden story trophy' : trophy.name));
  body.append(el('div', 'trophy-desc', hidden ? 'Hidden on PlayStation until earned. Turn spoilers off, or earn it in the game, to see its name and guide.' : trophy.description));
  const meta = el('div', 'trophy-meta');
  meta.append(gradeBadge(trophy.grade));
  meta.append(el('span', 'tag', KIND_LABELS[trophy.kind] ?? trophy.kind));
  if (trophy.missable) meta.append(el('span', 'tag missable', 'Missable'));
  if (trophy.target) meta.append(el('span', 'tag', `Target: ${trophy.target}`));
  body.append(meta);
  row.append(body);
  row.append(el('span', 'guide-link', hidden ? 'Hidden' : 'Guide →'));
  return row;
}

export function renderChecklist(viewEl, trophies, earned, f, statusEl) {
  viewEl.replaceChildren();
  const list = el('div', 'trophy-list');
  let shown = 0;
  for (const t of trophies) {
    if (f.kind === 'missable' ? !t.missable : f.kind !== 'all' && t.kind !== f.kind) continue;
    if (f.grade !== 'all' && t.grade !== f.grade) continue;
    if (f.earned === 'earned' && !earned.has(t.name)) continue;
    if (f.earned === 'unearned' && earned.has(t.name)) continue;
    if (f.search) {
      const hay = `${t.name} ${t.description} ${t.guide}`.toLowerCase();
      if (!hay.includes(f.search)) continue;
    }
    list.append(trophyRow(t, earned, f.spoiler));
    shown += 1;
  }
  if (!shown) {
    list.append(el('p', 'empty-note', 'No trophies match these filters. Clear the search or widen the filters.'));
  }
  viewEl.append(list);
  statusEl.textContent = `Showing ${shown} of ${trophies.length} trophies · ${earned.size} earned` +
    (f.spoiler ? ' · Spoilers on: story trophies stay hidden until earned.' : '');
}

function sourceLinkItem(sourceByKey, key) {
  const source = sourceByKey.get(key);
  const li = document.createElement('li');
  if (!source) {
    li.textContent = key;
    return li;
  }
  const a = document.createElement('a');
  a.href = source.url;
  a.target = '_blank';
  a.rel = 'noopener';
  a.textContent = source.name;
  li.append(a);
  return li;
}

export function openTrophyDetail(trophies, id, earned, sourceByKey, spoiler, onToggleEarned) {
  const trophy = trophies.find((t) => t.id === id);
  panel.replaceChildren();
  if (!trophy) {
    panel.hidden = true;
    return;
  }
  const hidden = isHiddenBySpoiler(trophy, spoiler, earned);
  const close = el('button', 'close-btn quiet', 'Close ✕');
  close.type = 'button';
  close.addEventListener('click', () => { location.hash = '#/checklist'; });
  panel.append(close);
  panel.append(el('h2', null, hidden ? 'Hidden story trophy' : trophy.name));
  const meta = el('div', 'trophy-meta');
  meta.append(gradeBadge(trophy.grade));
  meta.append(el('span', 'tag', KIND_LABELS[trophy.kind] ?? trophy.kind));
  if (trophy.missable) meta.append(el('span', 'tag missable', 'Missable'));
  if (trophy.target) meta.append(el('span', 'tag', `Target: ${trophy.target}`));
  panel.append(meta);

  panel.append(el('h3', null, 'Official description'));
  panel.append(el('p', 'official', hidden ? 'Hidden on PlayStation until earned.' : trophy.description));

  if (trophy.missable && trophy.missableNote) {
    panel.append(el('p', 'missable-note', `⚠ ${trophy.missableNote}`));
  }
  if (trophy.guide.startsWith('UNCONFIRMED')) {
    panel.append(el('p', 'unknown-note', 'This trophy has no verified method yet. The guide below says what is known — and what is not.'));
  }

  panel.append(el('h3', null, 'Guide'));
  panel.append(el('p', null, hidden ? 'Earn this trophy in the game to reveal its guide — or turn spoilers off in the toolbar.' : trophy.guide));

  panel.append(el('h3', null, 'Sources'));
  const list = el('ul', 'source-list');
  for (const key of trophy.sources) list.append(sourceLinkItem(sourceByKey, key));
  panel.append(list);
  panel.append(el('p', null, 'Guides are written for this page, in our own words. The official name and description are shown as PlayStation publishes them.'));

  const toggle = el('button', 'primary', earned.has(trophy.name) ? '✓ Earned — tap to unmark' : 'Mark as earned');
  toggle.type = 'button';
  toggle.addEventListener('click', () => onToggleEarned(trophy.name));
  panel.append(toggle);
  panel.hidden = false;
}

export function closeTrophyDetail() {
  panel.hidden = true;
  panel.replaceChildren();
}

export function renderRoadmap(viewEl, trophies, stages, earned) {
  viewEl.replaceChildren();
  viewEl.append(el('h2', 'page-title', 'Roadmap to the platinum'));
  const intro = el('p', 'page-intro');
  intro.innerHTML = 'One playthrough is enough, and there is no mission replay — so the order below matters. <strong>PowerPyx rates the platinum 4/10 and about 200 hours</strong>; Push Square says up to 300 hours. Cheats disable trophies and saving, so keep them off for the whole run.';
  viewEl.append(intro);
  const byId = new Map(trophies.map((t) => [t.id, t]));
  for (const stage of stages) {
    const box = el('section', 'stage');
    const done = stage.trophyIds.filter((id) => byId.get(id) && earned.has(byId.get(id).name)).length;
    const h = el('h2');
    h.textContent = `Stage ${stage.stage}: ${stage.title} `;
    const time = el('span', 'stage-time', `· ${stage.time}`);
    h.append(time);
    box.append(h);
    box.append(el('p', 'stage-progress', `${done} of ${stage.trophyIds.length} trophies in this stage earned`));
    box.append(el('p', null, stage.body));
    const tips = el('ul');
    for (const tip of stage.advice) tips.append(el('li', null, tip));
    box.append(tips);
    const chips = el('ul');
    for (const id of stage.trophyIds) {
      const t = byId.get(id);
      if (!t) continue;
      const li = el('li', earned.has(t.name) ? 'done' : null);
      li.textContent = `${earned.has(t.name) ? '✓ ' : ''}${t.name} `;
      li.append(el('span', 'mini-grade', `(${t.grade})`));
      chips.append(li);
    }
    box.append(chips);
    viewEl.append(box);
  }
}

export function renderMissables(viewEl, trophies) {
  viewEl.replaceChildren();
  viewEl.append(el('h2', 'page-title', 'Missable trophies'));
  const intro = el('p', 'page-intro');
  intro.innerHTML = 'Good news: <strong>there is only one trophy that may be missable</strong>, and everything else can be finished in free-roam after the story. The warning below comes from PowerPyx, cross-checked with CryptoGames — both agree there is a single candidate.';
  viewEl.append(intro);

  const missable = trophies.filter((t) => t.missable);
  for (const t of missable) {
    const box = el('section', 'stage');
    const h = el('h2');
    h.textContent = t.name;
    box.append(h);
    const meta = el('div', 'trophy-meta');
    meta.append(gradeBadge(t.grade));
    meta.append(el('span', 'tag missable', 'Potentially missable'));
    box.append(meta);
    box.append(el('p', null, t.guide));
    const src = el('p');
    src.textContent = 'Source: PowerPyx — GTA 6 Trophy Guide & Roadmap (and CryptoGames, which agrees this is the only possibly missable trophy).';
    box.append(src);
    viewEl.append(box);
  }

  const safe = el('section', 'stage');
  safe.append(el('h2', null, 'How not to lock yourself out'));
  const list = el('ul');
  const tips = [
    'There is no mission replay and no New Game+. Keep a manual save at the start of every chapter — the game has 15 manual save slots, so use 10 for chapter starts and ends and rotate the other 5 in free-roam.',
    'Optional missions disappear after a while (black icons with pink letters) and some quest givers go quiet mid-story, but PowerPyx confirms every trophy-related character comes back later — none of that locks a trophy.',
    'Some fences become permanently unavailable and a few magazine collectibles sit in story buildings that later close, but neither affects trophies or 100% completion: new fences unlock as you go, and the magazines spawn elsewhere too.',
    'Time-sensitive quests (hourglass icon) can fail, but they are not relevant to trophies. Do quests as they appear and you will not have to worry about them.',
    'Do the Chapter 1 balcony meditation even though it is unconfirmed whether it counts: if it does count and you skipped it, the only fix is a new playthrough.',
  ];
  for (const tip of tips) list.append(el('li', null, tip));
  safe.append(list);
  viewEl.append(safe);
}

export function renderSources(viewEl, sourcesDoc) {
  viewEl.replaceChildren();
  viewEl.append(el('h2', 'page-title', 'Sources'));
  const intro = el('p', 'page-intro');
  intro.innerHTML = 'Every guide on this page is written in our own words for this page — <strong>a source is cited, never copied</strong>. The official names, descriptions and grades are the exception: they are shown exactly as PlayStation publishes them. The list was checked on 18 November 2026 against Exophase and PSNProfiles, which agree on every name, description and grade.';
  viewEl.append(intro);
  const list = el('div', 'source-page-list');
  for (const s of sourcesDoc.sources) {
    const card = el('article', 'source-card');
    const h = el('h3');
    const a = document.createElement('a');
    a.href = s.url;
    a.target = '_blank';
    a.rel = 'noopener';
    a.textContent = s.name;
    h.append(a);
    card.append(h);
    card.append(el('p', null, s.usedFor));
    list.append(card);
  }
  viewEl.append(list);
  const note = el('section', 'stage');
  note.append(el('h2', null, 'What is still unconfirmed'));
  note.append(el('p', null, 'Four trophies have no verified method as of 19 November 2026 — In The Beginning…, Bad Luck, I Guess, The Truth Is Out There and Ten Pin. PowerPyx lists them as currently unknown, and this page says so on each of them rather than inventing a method. One trophy is only potentially missable: Positive Mental Attitude, whose Chapter 1 meditation may or may not be required. Those notes will be updated when a guide verifies them.'));
  viewEl.append(note);
}
