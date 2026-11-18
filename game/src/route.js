/** Eight nights. Night 1 is a fight, night 8 is the Crown, and the rest are a fork. */

import { NIGHTS } from './config.js';

const KINDS = ['fight', 'elite', 'cache', 'rest'];

const NODES = {
  fight: {
    name: 'Fight',
    line: 'A full night of shades on the stones.',
    count: 1,
    speed: 1,
    bounty: 1,
    oil: 0,
    embers: 0,
  },
  elite: {
    name: 'Elite',
    line: 'More shades, faster steps, richer bounties.',
    count: 1.45,
    speed: 1.16,
    bounty: 1.4,
    oil: 0,
    embers: 2,
  },
  cache: {
    name: 'Cache',
    line: 'A short night. Oil and embers wait at the end.',
    count: 0.6,
    speed: 0.92,
    bounty: 1,
    oil: 0.16,
    embers: 8,
  },
  rest: {
    name: 'Rest',
    line: 'No fight. The cup and the purse refill.',
    count: 0,
    speed: 1,
    bounty: 1,
    oil: 0.26,
    embers: 4,
  },
  boss: {
    name: 'Boss',
    line: 'The Unlit Crown takes the last night.',
    count: 1,
    speed: 1,
    bounty: 1.15,
    oil: 0.08,
    embers: 0,
  },
};

export function nodeInfo(type) {
  return NODES[type] || NODES.fight;
}

function stamp(night, type) {
  const info = nodeInfo(type);
  return {
    night,
    type,
    name: info.name,
    line: info.line,
    count: info.count,
    speed: info.speed,
    bounty: info.bounty,
    oil: info.oil,
    embers: info.embers,
  };
}

/** Build the road from the run seed. Forks for nights 2–7 are fixed before the first step. */
export function createRoute(rng) {
  const nights = [{ night: 1, type: 'fight' }];
  for (let night = 2; night <= NIGHTS - 1; night += 1) {
    const left = KINDS[rng.int(KINDS.length)];
    let right = KINDS[(KINDS.indexOf(left) + 1 + rng.int(3)) % KINDS.length];
    if (right === left) right = KINDS[(KINDS.indexOf(left) + 1) % KINDS.length];
    nights.push({ night, options: [left, right], pick: -1 });
  }
  nights.push({ night: NIGHTS, type: 'boss' });
  return { nights, index: 0 };
}

export function nodeAt(route, index) {
  const row = route.nights[index];
  if (!row) return stamp(index + 1, 'fight');
  if (row.type) return stamp(row.night, row.type);
  const type = row.pick === 1 ? row.options[1] : row.options[0];
  return stamp(row.night, type);
}

export function currentNode(route) {
  return nodeAt(route, route.index);
}

/** The two roads offered after the current night, or null when the Crown is next. */
export function nextFork(route) {
  if (!route) return null;
  const row = route.nights[route.index + 1];
  if (!row || !row.options || row.pick >= 0) return null;
  return {
    night: row.night,
    left: stamp(row.night, row.options[0]),
    right: stamp(row.night, row.options[1]),
  };
}

/** Remember the pick and step onto that night. */
export function chooseFork(route, side) {
  const row = route.nights[route.index + 1];
  if (!row) return currentNode(route);
  if (row.options && row.pick < 0) row.pick = side === 1 ? 1 : 0;
  if (route.index < route.nights.length - 1) route.index += 1;
  return currentNode(route);
}

/** Nights still ahead, the next one first. A fork keeps both options until it is picked. */
export function roadAhead(route) {
  const rows = [];
  if (!route || !route.nights) return rows;
  const start = (route.index || 0) + 1;
  for (let i = start; i < route.nights.length; i += 1) {
    const row = route.nights[i];
    const current = i === start;
    if (row.type) rows.push({ night: row.night, type: row.type, current });
    else if (row.pick === 0 || row.pick === 1) {
      rows.push({ night: row.night, type: row.options[row.pick], current });
    } else {
      const options = row.options ? row.options.slice() : ['fight', 'fight'];
      rows.push({ night: row.night, options, current });
    }
  }
  return rows;
}

/** One mark per night: a node type, or 'ahead' when that fork is still open. */
export function routeMarks(route) {
  const marks = [];
  if (!route) return marks;
  for (let i = 0; i < route.nights.length; i += 1) {
    const row = route.nights[i];
    if (row.type) marks.push(row.type);
    else if (row.pick === 0 || row.pick === 1) marks.push(row.options[row.pick]);
    else marks.push('ahead');
  }
  return marks;
}
