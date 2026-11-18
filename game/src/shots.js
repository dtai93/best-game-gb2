/** Deterministic poses for ?shot=start|play|boss|end. No simulation after the pose. */

import { ARENA, BOSS } from './config.js';
import { spawnShade } from './enemies.js';
import { beginBoss } from './boss.js';
import { nightBeats } from './waves.js';

/** Paint one named scene onto a freshly reset run. */
export function poseShot(name, state, player, foes, boss) {
  state.time = 4.2;
  if (name === 'play') posePlay(state, player, foes);
  else if (name === 'boss') poseBoss(state, player, foes, boss);
  else if (name === 'end') poseEnd(state);
  else state.screen = 'title';
}

function posePlay(state, player, foes) {
  state.screen = 'play';
  state.night = 3;
  state.score = 1860;
  state.best = 4200;
  state.combo = 4;
  state.oil = 0.74;
  state.heat = 0.28;
  state.special = 0.62;
  state.embers = 18;
  state.surge = { sent: 4, total: nightBeats(3) };
  state.loadout.ranks = { wick: 1, glass: 1 };
  player.reset(ARENA.cx - 90, ARENA.cy + 70);
  player.body.angle = -0.45;
  placeShade(foes, 'moth', -0.4, 168, 0.2);
  placeShade(foes, 'moth', 0.55, 196, 0.55);
  const hound = placeShade(foes, 'hound', 2.2, 214, 0.15);
  if (hound) {
    hound.mode = 1;
    hound.phase = 0.24;
    const dx = player.body.x - hound.x;
    const dy = player.body.y - hound.y;
    const dist = Math.hypot(dx, dy) || 1;
    hound.gx = dx / dist;
    hound.gy = dy / dist;
    hound.angle = Math.atan2(dy, dx);
  }
  const hexer = placeShade(foes, 'hexer', 1.2, 236, 0.4);
  if (hexer) hexer.phase = 0.18;
  const wisp = placeShade(foes, 'wisp', -1.7, 188, 0.7);
  if (wisp) wisp.phase = 1.42;
  const ang = player.body.angle;
  const bolt = state.bolts && state.bolts[0];
  if (bolt) {
    bolt.alive = true;
    bolt.x = player.body.x + Math.cos(ang) * 58;
    bolt.y = player.body.y + Math.sin(ang) * 58;
    bolt.vx = Math.cos(ang) * 540;
    bolt.vy = Math.sin(ang) * 540;
    bolt.life = 0.4;
    bolt.radius = 5;
  }
  const bolt2 = state.bolts && state.bolts[1];
  if (bolt2) {
    const ang2 = ang + 0.28;
    bolt2.alive = true;
    bolt2.x = player.body.x + Math.cos(ang2) * 102;
    bolt2.y = player.body.y + Math.sin(ang2) * 102;
    bolt2.vx = Math.cos(ang2) * 540;
    bolt2.vy = Math.sin(ang2) * 540;
    bolt2.life = 0.36;
    bolt2.radius = 5;
  }
  placeShade(foes, 'brute', 3.5, 198, 0.25);
  placeShade(foes, 'moth', -2.55, 128, 0.85);
  placeShade(foes, 'moth', 1.55, 112, 0.12);
  placeShade(foes, 'moth', 2.85, 164, 0.66);
  const charger = placeShade(foes, 'hound', -1.05, 240, 0.92);
  if (charger) {
    const dx = player.body.x - charger.x;
    const dy = player.body.y - charger.y;
    const dist = Math.hypot(dx, dy) || 1;
    charger.gx = dx / dist;
    charger.gy = dy / dist;
    charger.angle = Math.atan2(dy, dx);
  }
  placeShade(foes, 'wisp', 0.2, 220, 0.37);
  placeShade(foes, 'hexer', -2.95, 250, 0.51);
  dressPlay(state, player.body.x + Math.cos(ang) * 86, player.body.y + Math.sin(ang) * 86);
}

function dressPlay(state, x, y) {
  const sparks = state.particles;
  if (!sparks) return;
  sparks.spawn(x + 46, y - 34, {
    life: 1, size: 0, color: '#ffe14a', text: '+95', scale: 1.45, kind: 'pop',
  });
  sparks.spawn(x + 18, y + 28, {
    life: 1, size: 0, color: '#fff6c8', text: '+40', scale: 1.05, kind: 'pop',
  });
  for (let i = 0; i < 9; i += 1) {
    const a = (i / 9) * Math.PI * 2;
    sparks.spawn(x, y, {
      vx: Math.cos(a) * 150,
      vy: Math.sin(a) * 150,
      life: 0.5,
      size: 3.2,
      color: i % 2 ? '#ffb01a' : '#fff6c4',
      kind: 'spark',
    });
  }
  for (let i = 0; i < 6; i += 1) {
    sparks.spawn(x - 28 + i * 12, y + 16 - (i % 3) * 9, {
      life: 0.8,
      size: 3.5,
      color: i % 2 ? '#ff6a22' : '#ffd27a',
      kind: 'ember',
    });
  }
}

function poseBoss(state, player, foes, boss) {
  state.screen = 'play';
  state.night = 8;
  state.score = 11240;
  state.best = 9800;
  state.combo = 6;
  state.heat = 0.46;
  state.special = 0.84;
  state.embers = 47;
  state.surge = { sent: nightBeats(8), total: nightBeats(8) };
  state.loadout.ranks = { glass: 2, cloak: 1, wick: 1, breath: 1 };
  player.reset(ARENA.cx + 96, ARENA.cy + 86);
  player.body.angle = Math.atan2(-126, -256);
  beginBoss(boss, state);
  state.oil = 0.55;
  boss.mode = 'warn';
  boss.attack = 'wedge';
  boss.phase = 2;
  boss.hp = Math.round(BOSS.hp * 0.58);
  boss.maxHp = BOSS.hp;
  boss.invuln = 0;
  boss.timer = 0.28;
  boss.warn = 0.72;
  boss.spin = 0.6;
  boss.x = ARENA.cx - 160;
  boss.y = ARENA.cy - 40;
  boss.aim = Math.atan2(player.body.y - boss.y, player.body.x - boss.x);
  state.particles.clear();
  state.shake = 0;
  state.flash = 0;
  placeShade(foes, 'moth', 2.6, 200, 0.3);
  placeShade(foes, 'hound', -2.2, 230, 0.4);
}

function poseEnd(state) {
  state.screen = 'end';
  state.night = 8;
  state.score = 14860;
  state.outcome = 'dawn';
  state.best = Math.max(state.best, state.score);
}

function placeShade(foes, type, angle, dist, salt) {
  const enemy = spawnShade(foes, type, angle, salt);
  if (!enemy) return;
  enemy.x = ARENA.cx + Math.cos(angle) * dist;
  enemy.y = ARENA.cy + Math.sin(angle) * dist;
  enemy.angle = angle + Math.PI;
  if (type === 'hound') enemy.mode = 2;
  return enemy;
}
