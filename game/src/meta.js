/** Difficulty and the embers workshop. The profile is saved between runs. */

export const META_KEY = 'ashwell.lantern.meta';

/** Each level changes how many shades spawn, how fast they move, and the oil. */
export const DIFFICULTIES = [
  {
    id: 'apprentice',
    name: 'Apprentice',
    count: 0.72,
    speed: 0.84,
    oil: 1,
    burn: 0.7,
    line: 'Fewer shades, slower, full lantern.',
  },
  {
    id: 'journeyman',
    name: 'Journeyman',
    count: 1,
    speed: 1,
    oil: 0.92,
    burn: 1,
    line: 'The nights as they are written.',
  },
  {
    id: 'master',
    name: 'Master',
    count: 1.35,
    speed: 1.2,
    oil: 0.78,
    burn: 1.28,
    line: 'More shades, faster, a thin wick.',
  },
];

/**
 * Permanent unlocks. `apply` mutates the run mods and a small bag
 * (oil, special, emberRate, bossCut, cacheBonus) once at the start.
 */
export const UNLOCKS = [
  {
    id: 'wick',
    name: 'Spare Wick',
    cost: 30,
    blurb: 'The lantern starts fuller and burns slower.',
    apply(mods, bag) {
      mods.oilBurn *= 0.82;
      bag.oil = Math.min(1, bag.oil + 0.08);
    },
  },
  {
    id: 'lens',
    name: 'Keen Lens',
    cost: 40,
    blurb: 'Ember darts begin one rank harder.',
    apply(mods) {
      mods.damage += 1;
    },
  },
  {
    id: 'boots',
    name: 'Ash Boots',
    cost: 36,
    blurb: 'You cross the stones faster.',
    apply(mods) {
      mods.speed *= 1.1;
    },
  },
  {
    id: 'purse',
    name: 'Ember Purse',
    cost: 34,
    blurb: 'Kills drop more embers.',
    apply(_mods, bag) {
      bag.emberRate += 0.5;
    },
  },
  {
    id: 'cloak',
    name: 'Short Cloak',
    cost: 48,
    blurb: 'The dash returns sooner.',
    apply(mods) {
      mods.dashCd *= 0.78;
    },
  },
  {
    id: 'bell',
    name: 'First Bell',
    cost: 55,
    blurb: 'The halo starts a third full.',
    apply(_mods, bag) {
      bag.special = Math.max(bag.special, 0.34);
    },
  },
  {
    id: 'map',
    name: 'Cache Map',
    cost: 60,
    blurb: 'Caches pay extra oil and embers.',
    apply(_mods, bag) {
      bag.cacheBonus = true;
    },
  },
  {
    id: 'omen',
    name: 'Crown Omen',
    cost: 80,
    blurb: 'The Unlit Crown begins wounded.',
    apply(_mods, bag) {
      bag.bossCut = 0.88;
    },
  },
];

export function emptyProfile() {
  return {
    embers: 0,
    unlocks: {},
    difficulty: 'journeyman',
    records: [],
    feats: {},
  };
}

export function difficultyById(id) {
  for (let i = 0; i < DIFFICULTIES.length; i += 1) {
    if (DIFFICULTIES[i].id === id) return DIFFICULTIES[i];
  }
  return null;
}

export function loadProfile() {
  try {
    const raw = window.localStorage.getItem(META_KEY);
    if (!raw) return emptyProfile();
    const data = JSON.parse(raw);
    const profile = emptyProfile();
    if (!data || typeof data !== 'object') return profile;
    profile.embers = Math.max(0, Math.floor(Number(data.embers) || 0));
    profile.difficulty = difficultyById(data.difficulty) ? data.difficulty : 'journeyman';
    if (data.unlocks && typeof data.unlocks === 'object') {
      for (let i = 0; i < UNLOCKS.length; i += 1) {
        const id = UNLOCKS[i].id;
        if (data.unlocks[id]) profile.unlocks[id] = true;
      }
    }
    profile.records = Array.isArray(data.records) ? data.records.slice(0, 5) : [];
    profile.feats = data.feats && typeof data.feats === 'object' ? data.feats : {};
    return profile;
  } catch {
    return emptyProfile();
  }
}

export function saveProfile(profile) {
  try {
    window.localStorage.setItem(META_KEY, JSON.stringify(profile));
  } catch {
    // Private windows can reject storage. The workshop then lasts this visit.
  }
}

export function cycleDifficulty(profile, step) {
  let index = 0;
  for (let i = 0; i < DIFFICULTIES.length; i += 1) {
    if (DIFFICULTIES[i].id === profile.difficulty) index = i;
  }
  const next = (index + step + DIFFICULTIES.length) % DIFFICULTIES.length;
  profile.difficulty = DIFFICULTIES[next].id;
  saveProfile(profile);
  return DIFFICULTIES[next];
}

/** Spend wallet embers on one unlock. Returns false when it is owned or too costly. */
export function buyUnlock(profile, index) {
  const card = UNLOCKS[index];
  if (!card) return false;
  if (profile.unlocks[card.id]) return false;
  if ((profile.embers || 0) < card.cost) return false;
  profile.embers -= card.cost;
  profile.unlocks[card.id] = true;
  saveProfile(profile);
  return true;
}

/** Stamp the chosen difficulty and every owned unlock onto a fresh run. */
export function applyMeta(state, profile) {
  const diff = difficultyById(profile.difficulty) || DIFFICULTIES[1];
  state.difficulty = diff.id;
  state.diffName = diff.name;
  state.threat = { count: diff.count, speed: diff.speed };
  state.mods.oilBurn *= diff.burn;
  const bag = {
    oil: diff.oil,
    special: 0,
    emberRate: 1,
    bossCut: 1,
    cacheBonus: false,
  };
  const owned = profile.unlocks || {};
  for (let i = 0; i < UNLOCKS.length; i += 1) {
    const card = UNLOCKS[i];
    if (owned[card.id]) card.apply(state.mods, bag);
  }
  state.oil = Math.min(1, Math.max(0.05, bag.oil));
  state.special = Math.max(0, Math.min(1, bag.special));
  state.emberRate = bag.emberRate;
  state.bossCut = bag.bossCut;
  state.cacheBonus = !!bag.cacheBonus;
  state.wallet = profile.embers || 0;
}
