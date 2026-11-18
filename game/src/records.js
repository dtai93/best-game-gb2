/** The five best finished runs, best score first. */

export function gradeRun(state) {
  const nights = state.night || 1;
  const won = state.outcome === 'dawn';
  if (won && state.score >= 14000) return 'S';
  if (won && state.score >= 8000) return 'A';
  if (won) return 'B';
  if (nights >= 6) return 'C';
  if (nights >= 3) return 'D';
  return 'E';
}

export function makeRecord(state) {
  const log = state.run || {};
  return {
    score: state.score || 0,
    night: state.night || 1,
    outcome: state.outcome || 'dark',
    difficulty: state.difficulty || 'journeyman',
    chain: log.bestChain || state.combo || 0,
    time: Math.round(state.time || 0),
    kills: log.kills || 0,
    damage: Math.round((log.damage || 0) * 100),
    grade: state.grade || gradeRun(state),
    oil: Math.round((state.oil || 0) * 100),
    embers: state.embers || 0,
    feats: state.featTally || 0,
  };
}

export function pushRecord(records, entry) {
  const next = Array.isArray(records) ? records.slice(0, 5) : [];
  next.push(entry);
  next.sort((a, b) => (b.score || 0) - (a.score || 0));
  return next.slice(0, 5);
}

/** Add the run's embers to the wallet and keep the top five scores. */
export function bankRun(profile, record) {
  profile.embers = (profile.embers || 0) + (record.embers || 0);
  profile.records = pushRecord(profile.records, record);
  return profile;
}
