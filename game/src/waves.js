/** Eight nights. Each script spills shades onto the rim, then a short breath. */

import { NIGHTS, WAVE } from './config.js';
import { spawnShade } from './enemies.js';

/**
 * Times are seconds from the start of that night.
 * Night 8 is a short herald. Clearing it returns 'crown' so the boss can hold the dawn.
 */
const NIGHT_SCRIPTS = [
  [
    { t: 1.2, type: 'moth', count: 3, arc: 0.6 },
    { t: 6, type: 'moth', count: 4, arc: 1 },
    { t: 11, type: 'hound', count: 1, arc: 0.2 },
    { t: 15, type: 'moth', count: 4, arc: 1.2 },
    { t: 20, type: 'moth', count: 3, arc: 0.5 },
  ],
  [
    { t: 0.8, type: 'moth', count: 4, arc: 0.8 },
    { t: 4.5, type: 'hound', count: 2, arc: 1.6 },
    { t: 9, type: 'moth', count: 5, arc: 1.4 },
    { t: 14, type: 'hound', count: 2, arc: 2 },
    { t: 19, type: 'moth', count: 4, arc: 1 },
    { t: 23, type: 'hound', count: 1, arc: 0.3 },
  ],
  [
    { t: 0.8, type: 'moth', count: 3, arc: 0.7 },
    { t: 4, type: 'wisp', count: 2, arc: 1.2 },
    { t: 8, type: 'hound', count: 2, arc: 1.8 },
    { t: 13, type: 'wisp', count: 2, arc: 2 },
    { t: 13.2, type: 'moth', count: 3, arc: 0.6 },
    { t: 18, type: 'hound', count: 2, arc: 1.4 },
    { t: 23, type: 'wisp', count: 3, arc: 2.2 },
  ],
  [
    { t: 0.7, type: 'moth', count: 5, arc: 1.2 },
    { t: 4.5, type: 'brute', count: 1, arc: 0.2 },
    { t: 8, type: 'moth', count: 4, arc: 1 },
    { t: 12, type: 'hound', count: 2, arc: 1.6 },
    { t: 16, type: 'brute', count: 1, arc: 0.4 },
    { t: 16.3, type: 'moth', count: 3, arc: 0.8 },
    { t: 22, type: 'hound', count: 2, arc: 2 },
    { t: 27, type: 'brute', count: 2, arc: 2.1 },
  ],
  [
    { t: 0.7, type: 'hound', count: 2, arc: 1.4 },
    { t: 4, type: 'hexer', count: 2, arc: 2.2 },
    { t: 8, type: 'moth', count: 4, arc: 1 },
    { t: 12, type: 'hexer', count: 2, arc: 1.8 },
    { t: 12.4, type: 'hound', count: 2, arc: 1.2 },
    { t: 17, type: 'wisp', count: 2, arc: 1.5 },
    { t: 22, type: 'hexer', count: 3, arc: 2.4 },
    { t: 28, type: 'brute', count: 1, arc: 0.2 },
  ],
  [
    { t: 0.6, type: 'moth', count: 6, arc: 1.5 },
    { t: 4, type: 'hound', count: 3, arc: 2 },
    { t: 8, type: 'wisp', count: 3, arc: 2.2 },
    { t: 12, type: 'brute', count: 2, arc: 1.8 },
    { t: 17, type: 'hexer', count: 2, arc: 2 },
    { t: 21, type: 'moth', count: 5, arc: 1.2 },
    { t: 21.4, type: 'hound', count: 2, arc: 1.4 },
    { t: 27, type: 'brute', count: 2, arc: 2.2 },
    { t: 27.3, type: 'hexer', count: 2, arc: 1.6 },
  ],
  [
    { t: 0.5, type: 'moth', count: 6, arc: 1.6 },
    { t: 3.5, type: 'hound', count: 3, arc: 2.1 },
    { t: 7, type: 'wisp', count: 3, arc: 2.4 },
    { t: 11, type: 'brute', count: 2, arc: 2 },
    { t: 15, type: 'hexer', count: 3, arc: 2.5 },
    { t: 20, type: 'moth', count: 4, arc: 1 },
    { t: 20.3, type: 'hound', count: 3, arc: 1.8 },
    { t: 25, type: 'brute', count: 2, arc: 1.6 },
    { t: 25.4, type: 'wisp', count: 2, arc: 1.2 },
    { t: 31, type: 'hexer', count: 2, arc: 2 },
    { t: 31.2, type: 'brute', count: 1, arc: 0.3 },
  ],
  [
    { t: 0.6, type: 'moth', count: 4, arc: 1.2 },
    { t: 3.4, type: 'hound', count: 2, arc: 1.6 },
    { t: 6.5, type: 'hexer', count: 1, arc: 0.2 },
  ],
];

export function nightBeats(night) {
  const script = NIGHT_SCRIPTS[night - 1];
  return script ? script.length : 0;
}

export function createWaves() {
  return { clock: 0, cursor: 0, breath: 0, clearing: false };
}

export function resetWaves(waves) {
  waves.clock = 0;
  waves.cursor = 0;
  waves.breath = 0;
  waves.clearing = false;
}

/**
 * Spawn the night's script, then wait until the stones are clear.
 * Returns 'upgrade' when nights 1–7 clear, or 'crown' after night 8.
 * The next night and the oil sip wait until a gift is chosen.
 * Dawn waits until boss.js says the crown has fallen.
 */
export function updateWaves(waves, dt, foes, state) {
  if (state.outcome) return null;
  const script = NIGHT_SCRIPTS[state.night - 1];
  if (!script) return null;
  waves.clock += dt;
  while (waves.cursor < script.length && script[waves.cursor].t <= waves.clock) {
    const event = script[waves.cursor];
    waves.cursor += 1;
    spawnArc(foes, state, event.type, event.count, event.arc);
  }
  state.surge = { sent: waves.cursor, total: script.length };
  if (waves.cursor < script.length || shadesRemain(foes)) {
    waves.clearing = false;
    return null;
  }
  if (!waves.clearing) {
    waves.clearing = true;
    waves.breath = state.night >= NIGHTS ? 1.15 : WAVE.breath;
  }
  waves.breath -= dt;
  if (waves.breath > 0) return null;
  if (state.night >= NIGHTS) return 'crown';
  return 'upgrade';
}

function spawnArc(foes, state, type, count, arc) {
  const base = state.rng.float() * Math.PI * 2;
  for (let i = 0; i < count; i += 1) {
    const along = count === 1 ? 0 : i / (count - 1);
    spawnShade(foes, type, base + (along - 0.5) * arc, state.rng.float());
  }
}

function shadesRemain(foes) {
  for (let i = 0; i < foes.list.length; i += 1) {
    if (foes.list[i].alive) return true;
  }
  for (let i = 0; i < foes.motes.length; i += 1) {
    if (foes.motes[i].alive) return true;
  }
  return false;
}
