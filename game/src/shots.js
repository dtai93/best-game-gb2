/** Deterministic poses for ?shot=play|boss|upgrade|end|dawn. No simulation after the pose. */

import { ARENA } from './config.js';
import { spawnShade } from './enemies.js';
import { beginBoss } from './boss.js';
import { evaluateFeats, featTally } from './feats.js';
import { gradeRun } from './records.js';
import { nextFork } from './route.js';
import { nightBeats } from './waves.js';
import { UPGRADES } from './upgrades.js';

/** Paint one named scene onto a freshly reset run. */
export function poseShot(name, state, player, foes, boss) {
  state.time = 4.2;
  if (name === 'play') posePlay(state, player, foes);
  else if (name === 'boss') poseBoss(state, player, foes, boss);
  else if (name === 'upgrade') poseUpgrade(state, player);
  else if (name === 'end' || name === 'dawn') poseEnd(state, player);
  else poseStart(state);
}

function poseStart(state) {
  state.screen = 'title';
  state.time = 0.55;
  state.best = 18640;
  state.difficulty = 'journeyman';
  state.diffName = 'Journeyman';
  state.profile = {
    embers: 186,
    difficulty: 'journeyman',
    unlocks: { wick: true, lens: true, boots: true, purse: true },
    feats: { spark: 3, chain: 1, quiet: 2, cup: 1, crown: 1, hoard: 1 },
    records: [
      { grade: 'S', score: 18640, night: 8, chain: 11, oil: 46, difficulty: 'journeyman' },
      { grade: 'A', score: 12480, night: 8, chain: 8, oil: 22, difficulty: 'journeyman' },
      { grade: 'B', score: 9020, night: 8, chain: 6, oil: 11, difficulty: 'apprentice' },
      { grade: 'C', score: 4310, night: 6, chain: 4, oil: 0, difficulty: 'master' },
      { grade: 'D', score: 1880, night: 3, chain: 2, oil: 0, difficulty: 'master' },
    ],
  };
}

function posePlay(state, player, foes) {
  state.screen = 'play';
  state.night = 5;
  state.score = 4860;
  state.best = 9800;
  state.combo = 4;
  state.oil = 0.72;
  state.heat = 0.38;
  state.special = 1;
  state.embers = 41;
  state.surge = { sent: Math.max(1, Math.ceil(nightBeats(5) * 0.6)), total: nightBeats(5) };
  state.loadout.ranks = { wick: 1, glass: 2, fan: 1, chain: 1 };
  const px = ARENA.cx + 108;
  const py = ARENA.cy + 78;
  player.reset(px, py);
  const aim = Math.atan2(-96, -150);
  player.body.angle = aim;
  dashStreak(player, aim);
  const swarm = [
    ['moth', -0.2, 138, 0.2],
    ['moth', 0.35, 168, 0.44],
    ['moth', 0.85, 150, 0.7],
    ['moth', 1.35, 188, 0.15],
    ['moth', 1.85, 156, 0.62],
    ['moth', 2.4, 178, 0.33],
    ['moth', 2.9, 132, 0.81],
    ['moth', -0.85, 118, 0.28],
    ['moth', 0.6, 214, 0.51],
    ['hound', 2.15, 206, 0.4],
    ['hound', -0.5, 196, 0.66],
    ['brute', 1.2, 228, 0.22],
    ['hexer', 0.05, 206, 0.58],
    ['hexer', 2.65, 198, 0.37],
    ['wisp', 1.55, 104, 0.73],
    ['wisp', -2.4, 176, 0.19],
  ];
  const placed = dropMany(foes, swarm, player);
  wind(placed.hound0, player, 1, 0.22);
  wind(placed.hound1, player, 2, 0);
  if (placed.hexer0) placed.hexer0.phase = 0.16;
  if (placed.hexer1) placed.hexer1.phase = 0.42;
  if (placed.wisp0) placed.wisp0.phase = 1.42;
  if (placed.moth0) placed.moth0.hit = 0.4;
  if (placed.brute0) placed.brute0.hp = 5;
  fanBolts(state, player, 6);
  throwMotes(state, placed.hexer0, placed.hexer1, player);
  const hit = placed.moth0 || player.body;
  dressHit(state, hit.x, hit.y, ['+95', '+40', '+70']);
  state.pulse = 0.26;
}

function poseBoss(state, player, foes, boss) {
  state.screen = 'play';
  state.night = 8;
  state.score = 12480;
  state.best = 9800;
  state.combo = 6;
  state.heat = 0.58;
  state.special = 0.9;
  state.embers = 86;
  state.combo = 8;
  const beats = nightBeats(8);
  state.surge = { sent: beats, total: beats };
  state.loadout.ranks = { wick: 2, ward: 1, glass: 2, bell: 1, cloak: 1, fan: 2 };
  state.node = { night: 8, type: 'boss', name: 'Boss' };
  state.route = {
    index: 7,
    nights: [
      { night: 1, type: 'fight' },
      { night: 2, options: ['cache', 'fight'], pick: 0 },
      { night: 3, options: ['elite', 'rest'], pick: 0 },
      { night: 4, options: ['rest', 'fight'], pick: 0 },
      { night: 5, options: ['cache', 'elite'], pick: 0 },
      { night: 6, options: ['elite', 'cache'], pick: 0 },
      { night: 7, options: ['fight', 'rest'], pick: 1 },
      { night: 8, type: 'boss' },
    ],
  };
  const px = ARENA.cx + 124;
  const py = ARENA.cy + 76;
  player.reset(px, py);
  beginBoss(boss, state);
  state.particles.clear();
  state.oil = 0.64;
  boss.mode = 'warn';
  boss.attack = 'wedge';
  boss.phase = 2;
  boss.hp = 87;
  boss.maxHp = boss.maxHp || 150;
  boss.invuln = 0;
  boss.timer = 0.34;
  boss.warn = 0.86;
  boss.spin = 0.9;
  boss.hit = 0;
  boss.x = ARENA.cx - 96;
  boss.y = ARENA.cy - 88;
  boss.aim = Math.atan2(player.body.y - boss.y, player.body.x - boss.x);
  player.body.angle = Math.atan2(boss.y - player.body.y, boss.x - player.body.x);
  dashStreak(player, player.body.angle);
  const swarm = [
    ['moth', -0.15, 150, 0.2],
    ['moth', 0.45, 175, 0.48],
    ['moth', 0.95, 145, 0.71],
    ['moth', 1.45, 190, 0.12],
    ['moth', 1.9, 160, 0.63],
    ['moth', 2.45, 175, 0.34],
    ['moth', 2.95, 140, 0.82],
    ['moth', -0.7, 120, 0.27],
    ['moth', 0.7, 230, 0.55],
    ['hound', 2.2, 210, 0.41],
    ['hound', -0.45, 200, 0.68],
    ['brute', 1.15, 230, 0.21],
    ['brute', 3.3, 200, 0.77],
    ['hexer', 0.1, 210, 0.36],
    ['hexer', 2.7, 200, 0.59],
    ['wisp', 1.6, 100, 0.14],
    ['wisp', -2.5, 185, 0.88],
    ['hound', 3.9, 185, 0.46],
    ['moth', -1.05, 165, 0.25],
    ['moth', 0.2, 248, 0.31],
    ['moth', 1.05, 96, 0.57],
    ['moth', 3.55, 158, 0.22],
    ['moth', 4.35, 198, 0.64],
    ['moth', 5.1, 172, 0.41],
    ['moth', -1.55, 228, 0.73],
    ['hound', 1.65, 248, 0.29],
    ['hound', 4.7, 220, 0.52],
    ['brute', -1.9, 236, 0.18],
    ['wisp', 2.05, 128, 0.77],
    ['wisp', 3.7, 112, 0.36],
    ['hexer', 5.4, 236, 0.49],
    ['moth', 2.2, 88, 0.84],
  ];
  const placed = dropMany(foes, swarm, player);
  wind(placed.hound0, player, 1, 0.28);
  wind(placed.hound1, player, 2, 0);
  wind(placed.hound2, boss, 2, 0);
  if (placed.hexer0) placed.hexer0.phase = 0.12;
  if (placed.hexer1) placed.hexer1.phase = 0.38;
  if (placed.wisp0) placed.wisp0.phase = 1.5;
  if (placed.moth0) placed.moth0.hit = 0.45;
  if (placed.moth3) placed.moth3.hit = 0.3;
  if (placed.brute0) placed.brute0.hp = 4;
  if (placed.brute1) placed.brute1.hp = 6;
  if (placed.hexer0) placed.hexer0.hp = 2;
  fanBolts(state, player, 14);
  throwMotes(state, placed.hexer0, placed.hexer1, player);
  if (placed.hexer2) throwMotes(state, placed.hexer2, null, player);
  armShards(boss, player);
  const hitX = (player.body.x + boss.x) * 0.5 + 20;
  const hitY = (player.body.y + boss.y) * 0.5 + 16;
  dressHit(state, hitX, hitY, ['+95', '+40', '+120']);
  if (placed.moth1) dressHit(state, placed.moth1.x, placed.moth1.y, ['+70', '+95']);
  if (placed.brute0) ring(state, placed.brute0.x, placed.brute0.y, 10, 80, '#ff6a22', 'ember', 3.4);
  ring(state, boss.x, boss.y, 16, 110, '#d7ccff', 'spark', 3.4);
  ring(state, ARENA.cx, ARENA.cy, 14, 60, '#ffe14a', 'ember', 3);
  state.pulse = 0.34;
}

function poseUpgrade(state, player) {
  state.screen = 'upgrade';
  state.night = 3;
  state.score = 6420;
  state.best = 9800;
  state.combo = 2;
  state.oil = 0.84;
  state.heat = 0.12;
  state.special = 0.4;
  state.embers = 34;
  state.surge = { sent: nightBeats(3), total: nightBeats(3) };
  state.loadout.ranks = { wick: 1, glass: 1, cloak: 1 };
  state.loadout.offer = [gift('fan'), gift('halo'), gift('cloak')];
  state.loadout.hover = 1;
  state.roadSide = 0;
  state.route = {
    index: 2,
    nights: [
      { night: 1, type: 'fight' },
      { night: 2, options: ['fight', 'cache'], pick: 0 },
      { night: 3, type: 'elite' },
      { night: 4, options: ['elite', 'rest'], pick: -1 },
      { night: 5, options: ['cache', 'fight'], pick: 0 },
      { night: 6, options: ['rest', 'elite'], pick: 0 },
      { night: 7, options: ['elite', 'cache'], pick: 0 },
      { night: 8, type: 'boss' },
    ],
  };
  state.road = nextFork(state.route);
  state.node = { night: 3, type: 'elite', name: 'Elite' };
  player.reset(ARENA.cx, ARENA.cy + 206);
  player.body.angle = -Math.PI / 2;
  const sparks = state.particles;
  for (let i = 0; i < 16; i += 1) {
    const angle = -2.6 + (i / 15) * 2.2;
    sparks.spawn(
      ARENA.cx + Math.cos(angle) * (ARENA.radius - 36),
      ARENA.cy + Math.sin(angle) * (ARENA.radius - 36),
      {
        vx: Math.cos(angle) * -12,
        vy: -28 - (i % 4) * 8,
        life: 1.2,
        size: 3.4,
        color: i % 2 ? '#ffb01a' : '#fff6c4',
        kind: 'ember',
        drag: 0.6,
      },
    );
  }
  ring(state, ARENA.cx, ARENA.cy, 10, 40, '#ffe2a6', 'ember', 3);
}

function poseEnd(state, player) {
  state.screen = 'end';
  state.outcome = 'dawn';
  state.night = 8;
  state.time = 754;
  state.score = 18640;
  state.best = 18640;
  state.combo = 6;
  state.embers = 96;
  state.oil = 0.46;
  state.heat = 0.08;
  state.special = 0.55;
  state.difficulty = 'journeyman';
  state.loadout.ranks = {
    wick: 2, reservoir: 1, ward: 1, glass: 2, fan: 1, bell: 1,
  };
  state.run = {
    kills: 128,
    bestChain: 11,
    cleanNights: 1,
    fatNights: 0,
    nightHurt: false,
    damage: 0.54,
    sawElite: true,
    sawRest: false,
  };
  state.feats = evaluateFeats(state);
  state.featTally = featTally(state.feats);
  state.grade = gradeRun(state);
  state.profile = {
    embers: 282,
    difficulty: 'journeyman',
    unlocks: { wick: true, lens: true },
    feats: { spark: 4, chain: 1, quiet: 2, crown: 1, hoard: 1, taught: 1 },
    records: [
      { grade: 'S', score: 18640, night: 8, chain: 11, oil: 46, difficulty: 'journeyman' },
      { grade: 'A', score: 12480, night: 8, chain: 8, oil: 22, difficulty: 'journeyman' },
      { grade: 'B', score: 9020, night: 8, chain: 6, oil: 11, difficulty: 'apprentice' },
      { grade: 'C', score: 4310, night: 6, chain: 4, oil: 0, difficulty: 'master' },
      { grade: 'D', score: 1880, night: 3, chain: 2, oil: 0, difficulty: 'master' },
    ],
  };
  player.reset(ARENA.cx + 210, ARENA.cy + 120);
  player.body.angle = -2.4;
  ring(state, ARENA.cx, ARENA.cy, 18, 70, '#ffe14a', 'ember', 3.6);
  ring(state, ARENA.cx, ARENA.cy, 14, 120, '#fff6c4', 'spark', 2.8);
  for (let i = 0; i < 8; i += 1) {
    state.particles.spawn(ARENA.cx - 220 + i * 64, ARENA.cy + 200, {
      vy: -36,
      life: 1.3,
      size: 3.2,
      color: i % 2 ? '#ffb01a' : '#7af6ff',
      kind: 'ember',
      drag: 0.4,
    });
  }
}

function dropMany(foes, rows, player) {
  const counts = {};
  const placed = {};
  for (let i = 0; i < rows.length; i += 1) {
    const [type, angle, dist, salt] = rows[i];
    const enemy = placeShade(foes, type, angle, dist, salt);
    if (!enemy) continue;
    const key = type + (counts[type] || 0);
    counts[type] = (counts[type] || 0) + 1;
    placed[key] = enemy;
    if (type === 'hound') {
      const dx = player.body.x - enemy.x;
      const dy = player.body.y - enemy.y;
      const len = Math.hypot(dx, dy) || 1;
      enemy.gx = dx / len;
      enemy.gy = dy / len;
      enemy.angle = Math.atan2(dy, dx);
    }
  }
  return placed;
}

function wind(enemy, target, mode, phase) {
  if (!enemy || !target) return;
  const tx = target.body ? target.body.x : target.x;
  const ty = target.body ? target.body.y : target.y;
  const dx = tx - enemy.x;
  const dy = ty - enemy.y;
  const len = Math.hypot(dx, dy) || 1;
  enemy.mode = mode;
  enemy.phase = phase;
  enemy.gx = dx / len;
  enemy.gy = dy / len;
  enemy.angle = Math.atan2(dy, dx);
  if (enemy.maxHp > 1) enemy.hp = Math.max(1, enemy.maxHp - 1);
}

function fanBolts(state, player, count) {
  const aim = player.body.angle;
  for (let i = 0; i < count; i += 1) {
    const bolt = state.bolts && state.bolts[i];
    if (!bolt) return;
    const spread = (i - (count - 1) / 2) * 0.16;
    const angle = aim + spread;
    const reach = 46 + i * 22;
    bolt.alive = true;
    bolt.x = player.body.x + Math.cos(angle) * reach;
    bolt.y = player.body.y + Math.sin(angle) * reach;
    bolt.vx = Math.cos(angle) * 560;
    bolt.vy = Math.sin(angle) * 560;
    bolt.life = 0.42;
    bolt.radius = 5;
    bolt.damage = 2;
  }
}

function throwMotes(state, hexerA, hexerB, player) {
  const sources = [hexerA, hexerB];
  const motes = state.motes || [];
  let slot = 0;
  while (slot < motes.length && motes[slot].alive) slot += 1;
  for (let s = 0; s < sources.length; s += 1) {
    const hexer = sources[s];
    if (!hexer) continue;
    for (let i = 0; i < 4; i += 1) {
      const mote = state.motes && state.motes[slot];
      slot += 1;
      if (!mote) return;
      const angle = Math.atan2(player.body.y - hexer.y, player.body.x - hexer.x) + (i - 1) * 0.22;
      const reach = 28 + i * 26;
      mote.alive = true;
      mote.x = hexer.x + Math.cos(angle) * reach;
      mote.y = hexer.y + Math.sin(angle) * reach;
      mote.vx = Math.cos(angle) * 170;
      mote.vy = Math.sin(angle) * 170;
      mote.life = 2.4;
    }
  }
}

function armShards(boss, player) {
  const aim = Math.atan2(player.body.y - boss.y, player.body.x - boss.x);
  for (let i = 0; i < 8; i += 1) {
    const shard = boss.shards && boss.shards[i];
    if (!shard) return;
    const spread = (i - 2.5) * 0.18;
    const angle = aim + spread;
    const reach = 46 + (i % 3) * 28;
    shard.alive = true;
    shard.x = boss.x + Math.cos(angle) * reach;
    shard.y = boss.y + Math.sin(angle) * reach;
    shard.vx = Math.cos(angle) * 188;
    shard.vy = Math.sin(angle) * 188;
    shard.life = 2;
  }
}

function dressHit(state, x, y, labels) {
  const colors = ['#ffe14a', '#fff6c8', '#ffb01a'];
  for (let i = 0; i < labels.length; i += 1) {
    pop(state, x + (i - 1) * 36, y - 28 + (i % 2) * 34, labels[i], 1.15 + (i === 0 ? 0.35 : 0), colors[i]);
  }
  ring(state, x, y, 12, 160, '#ffb01a', 'spark', 3.4);
  ring(state, x + 16, y + 10, 8, 70, '#ff6a22', 'ember', 3.6);
}

function pop(state, x, y, text, scale, color) {
  state.particles.spawn(x, y, {
    life: 1.6,
    size: 0,
    color,
    text,
    scale,
    kind: 'pop',
    drag: 0.3,
    vy: -8,
  });
}

function ring(state, x, y, count, speed, color, kind, size) {
  for (let i = 0; i < count; i += 1) {
    const angle = (i / count) * Math.PI * 2 + 0.2;
    state.particles.spawn(x, y, {
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      life: 0.9,
      size,
      color: i % 2 ? color : '#fff6c4',
      kind,
      drag: 1.1,
    });
  }
}

function dashStreak(player, angle) {
  const trail = player.body.trail;
  if (!trail) return;
  for (let i = 0; i < trail.length; i += 1) {
    const dist = 16 + i * 13;
    trail[i].x = player.body.x - Math.cos(angle) * dist;
    trail[i].y = player.body.y - Math.sin(angle) * dist;
    trail[i].life = 0.17 - i * 0.012;
  }
  player.body.dashTime = 0.08;
}

function gift(id) {
  for (let i = 0; i < UPGRADES.length; i += 1) {
    if (UPGRADES[i].id === id) return UPGRADES[i];
  }
  return null;
}

function placeShade(foes, type, angle, dist, salt) {
  const enemy = spawnShade(foes, type, angle, salt);
  if (!enemy) return null;
  enemy.x = ARENA.cx + Math.cos(angle) * dist;
  enemy.y = ARENA.cy + Math.sin(angle) * dist;
  enemy.angle = angle + Math.PI;
  if (type === 'hound') enemy.mode = 2;
  return enemy;
}
