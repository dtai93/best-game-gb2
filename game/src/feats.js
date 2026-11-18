/** Eight feats, judged once when a run ends. */

export const FEATS = [
  { id: 'spark', name: 'First Spark', line: 'Snuff one shade.' },
  { id: 'chain', name: 'Long Wick', line: 'Reach a chain of 8.' },
  { id: 'quiet', name: 'Quiet Stones', line: 'Clear a night with no bite.' },
  { id: 'cup', name: 'Deep Cup', line: 'Clear a night above 70% oil.' },
  { id: 'crown', name: 'Crownfall', line: 'Break the Unlit Crown.' },
  { id: 'hoard', name: 'Ember Hoard', line: 'Gather 40 embers in one run.' },
  { id: 'taught', name: 'Well Taught', line: 'Carry four gifts.' },
  { id: 'roads', name: 'Roadwise', line: 'Walk an elite night and a rest.' },
];

export function freshLog() {
  return {
    kills: 0,
    bestChain: 0,
    cleanNights: 0,
    fatNights: 0,
    nightHurt: false,
    damage: 0,
    sawElite: false,
    sawRest: false,
    outcome: null,
  };
}

export function noteChain(log, combo) {
  if (!log) return;
  if (combo > log.bestChain) log.bestChain = combo;
}

export function noteKill(log, combo) {
  if (!log) return;
  log.kills += 1;
  noteChain(log, combo);
}

/** A bite, a snuff, or a mote. The slow oil burn is not a bite. */
export function noteBite(log, amount) {
  if (!log || amount <= 0) return;
  log.nightHurt = true;
  log.damage += amount;
}

export function noteNightClear(log, oil) {
  if (!log) return;
  if (!log.nightHurt) log.cleanNights += 1;
  if (oil >= 0.7) log.fatNights += 1;
  log.nightHurt = false;
}

function giftCount(state) {
  const ranks = state.loadout && state.loadout.ranks;
  if (!ranks) return 0;
  let count = 0;
  for (const key in ranks) {
    if (ranks[key] > 0) count += 1;
  }
  return count;
}

/** Flags for this run. Lifetime counts live on the profile. */
export function evaluateFeats(state) {
  const log = state.run || freshLog();
  return {
    spark: log.kills >= 1,
    chain: log.bestChain >= 8,
    quiet: log.cleanNights >= 1,
    cup: log.fatNights >= 1,
    crown: state.outcome === 'dawn',
    hoard: (state.embers || 0) >= 40,
    taught: giftCount(state) >= 4,
    roads: !!(log.sawElite && log.sawRest),
  };
}

export function featTally(flags) {
  let count = 0;
  for (let i = 0; i < FEATS.length; i += 1) {
    if (flags && flags[FEATS[i].id]) count += 1;
  }
  return count;
}

export function rememberFeats(profile, flags) {
  profile.feats = profile.feats || {};
  for (let i = 0; i < FEATS.length; i += 1) {
    const id = FEATS[i].id;
    if (flags && flags[id]) profile.feats[id] = (profile.feats[id] || 0) + 1;
  }
}
