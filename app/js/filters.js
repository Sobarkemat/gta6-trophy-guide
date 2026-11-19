// Filtering and the spoiler rule for the checklist.
// A trophy is shown when it passes every active filter. The spoiler rule
// never removes a trophy from the list: when spoilers are hidden, a hidden
// story trophy that is not earned yet shows as "Hidden story trophy" with
// its name and description blanked until it is earned.

export function makeFilterState() {
  return { query: '', kind: '', grade: '', status: '', missableOnly: false };
}

export function trophyMatches(trophy, filters, state) {
  if (filters.kind && trophy.kind !== filters.kind) return false;
  if (filters.grade && trophy.grade !== filters.grade) return false;
  const earned = state.earned.includes(trophy.id);
  if (filters.status === 'earned' && !earned) return false;
  if (filters.status === 'todo' && earned) return false;
  if (filters.missableOnly && !trophy.missable) return false;
  if (filters.query) {
    const hay = [trophy.name, trophy.description, trophy.guide, trophy.kind]
      .join(' ')
      .toLowerCase();
    if (!hay.includes(filters.query.toLowerCase())) return false;
  }
  return true;
}

export function applyFilters(trophies, filters, state) {
  return trophies.filter((t) => trophyMatches(t, filters, state));
}

// A story trophy is spoiled when it is hidden on PlayStation, spoilers are
// turned on, and the reader has not earned it yet.
export function isSpoiled(trophy, state) {
  return trophy.hidden === true && state.spoilersHidden && !state.earned.includes(trophy.id);
}

export function displayName(trophy, state) {
  return isSpoiled(trophy, state) ? 'Hidden story trophy' : trophy.name;
}

export function displayDescription(trophy, state) {
  return isSpoiled(trophy, state)
    ? 'Earn this trophy to reveal its name and description.'
    : trophy.description;
}

export function countByGrade(trophies, state) {
  const earned = { platinum: 0, gold: 0, silver: 0, bronze: 0 };
  const total = { platinum: 0, gold: 0, silver: 0, bronze: 0 };
  for (const t of trophies) {
    total[t.grade] += 1;
    if (state.earned.includes(t.id)) earned[t.grade] += 1;
  }
  return { earned, total };
}
