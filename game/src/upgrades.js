/** Twelve well-gifts, the three-card offer, and the oil drain and refill rules. */

import { COMBAT, WAVE } from './config.js';

/**
 * Oil rules:
 * - A slow burn runs all night (`burnOil`), scaled by Trimmed Wick.
 * - Bites, snuffs, and motes call `drainOil`. Well Ward keeps a share of each sip.
 * - A kill can give a sip back (`mods.oilOnKill`, Siphon Spark).
 * - Clearing a night calls `nightSip`: the base cup plus Deep Reservoir.
 * Oil is clamped to 1 on refill. At 0 the run ends in the dark.
 */

export function emptyMods() {
  return {
    damage: 0,
    fireDelay: 1,
    heat: 1,
    cool: 1,
    oilBurn: 1,
    oilOnKill: 0,
    oilOnNight: 0,
    oilResist: 0,
    speed: 1,
    dashCd: 1,
    special: 1,
    chain: 1,
    pulse: 1,
    score: 1,
  };
}

export function drainOil(state, amount) {
  if (amount <= 0) return;
  const kept = Math.min(0.6, state.mods.oilResist);
  state.oil -= amount * (1 - kept);
}

export function burnOil(state, dt) {
  state.oil -= COMBAT.oilBurn * state.mods.oilBurn * dt;
}

export function refillOil(state, amount) {
  if (amount <= 0) return;
  state.oil = Math.min(1, state.oil + amount);
}

export function nightSip(state) {
  refillOil(state, WAVE.oilOnClear + state.mods.oilOnNight);
}

export function rollOffer(state) {
  const pool = [];
  for (let i = 0; i < UPGRADES.length; i += 1) {
    const card = UPGRADES[i];
    const rank = state.loadout.ranks[card.id] || 0;
    if (rank < card.max) pool.push(card);
  }
  const offer = [];
  while (offer.length < 3 && pool.length > 0) {
    const index = state.rng.int(pool.length);
    offer.push(pool[index]);
    pool.splice(index, 1);
  }
  state.loadout.offer = offer;
  state.loadout.hover = 0;
}

export function applyUpgrade(state, card) {
  const rank = state.loadout.ranks[card.id] || 0;
  state.loadout.ranks[card.id] = rank + 1;
  card.apply(state.mods);
}

function catalog() {
  return [
    { id: 'wick', name: 'Trimmed Wick', line: 'The lantern sips oil more slowly.', max: 3, apply(m) { m.oilBurn *= 0.74; } },
    { id: 'reservoir', name: 'Deep Reservoir', line: 'The cup between nights fills deeper.', max: 2, apply(m) { m.oilOnNight += 0.1; } },
    { id: 'siphon', name: 'Siphon Spark', line: 'A snuffed shade gives a sip of oil back.', max: 3, apply(m) { m.oilOnKill += 0.014; } },
    { id: 'ward', name: 'Well Ward', line: 'Bites and motes steal less oil.', max: 2, apply(m) { m.oilResist = Math.min(0.55, m.oilResist + 0.18); } },
    { id: 'glass', name: 'Keen Glass', line: 'Ember darts bite harder.', max: 3, apply(m) { m.damage += 1; } },
    { id: 'fan', name: 'Ember Fan', line: 'The wick throws darts faster.', max: 3, apply(m) { m.fireDelay *= 0.8; } },
    { id: 'stones', name: 'Cool Stones', line: 'The lantern takes less heat and sheds it sooner.', max: 2, apply(m) { m.heat *= 0.75; m.cool *= 1.2; } },
    { id: 'bell', name: 'Halo Bell', line: 'The special meter fills quicker.', max: 2, apply(m) { m.special *= 1.35; } },
    { id: 'chain', name: 'Long Chain', line: 'The score chain lingers longer.', max: 2, apply(m) { m.chain *= 1.45; } },
    { id: 'cloak', name: 'Swift Cloak', line: 'You cross the stones faster.', max: 2, apply(m) { m.speed *= 1.14; } },
    { id: 'breath', name: 'Second Breath', line: 'The dash returns sooner.', max: 2, apply(m) { m.dashCd *= 0.72; } },
    { id: 'halo', name: 'Wide Halo', line: 'The pulse reaches further across the stones.', max: 2, apply(m) { m.pulse *= 1.28; } },
  ];
}

export const UPGRADES = catalog();
