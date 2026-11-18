/** Ember darts, lantern heat, the halo pulse, and chain scoring. */

import { strikeBoss } from './boss.js';
import { ARENA, COMBAT, PALETTE } from './config.js';
import { strikeShade } from './enemies.js';
import { circlesOverlap } from './physics.js';
import { noteChain, noteKill } from './feats.js';
import { burnOil, refillOil } from './upgrades.js';

const BOLT_POOL = 40;

export function createCombat() {
  const bolts = [];
  for (let i = 0; i < BOLT_POOL; i += 1) {
    bolts.push({ alive: false, x: 0, y: 0, vx: 0, vy: 0, life: 0, damage: 1, radius: 5 });
  }
  return { bolts, cooldown: 0, locked: false, chainTimer: 0 };
}

export function resetCombat(combat) {
  combat.cooldown = 0;
  combat.locked = false;
  combat.chainTimer = 0;
  for (let i = 0; i < combat.bolts.length; i += 1) combat.bolts[i].alive = false;
}

/**
 * Fire, cool the lantern, step bolts, and score hits.
 * `bites` is the siphon count from this step; a siphon breaks the chain.
 */
export function updateCombat(combat, dt, state, sample, bites) {
  const keeper = state.player;
  if (bites > 0) {
    combat.chainTimer = 0;
    state.combo = 0;
  }

  combat.cooldown -= dt;
  const trigger = sample.specialEdge && state.special >= 1;
  if (trigger) castHalo(combat, state);

  const cooling = (sample.fireHeld ? COMBAT.heatCoolFiring : COMBAT.heatCool) * state.mods.cool;
  state.heat = Math.max(0, state.heat - cooling * dt);
  if (combat.locked && state.heat <= COMBAT.recoverAt) combat.locked = false;

  const canFire = sample.fireHeld && !combat.locked && combat.cooldown <= 0 && keeper.dashTime <= 0;
  if (canFire) {
    fireBolt(combat, keeper, state);
    combat.cooldown = COMBAT.fireDelay * state.mods.fireDelay;
    state.heat += COMBAT.heatPerShot * state.mods.heat;
    if (state.hear) state.hear('fire');
    if (state.heat >= COMBAT.overheatAt) {
      state.heat = COMBAT.overheatAt;
      combat.locked = true;
      state.flash = Math.min(0.4, state.flash + 0.1);
      if (state.hear) state.hear('heat');
    }
  }
  keeper.firing = canFire || (sample.fireHeld && !combat.locked && keeper.dashTime <= 0 && combat.cooldown > 0);
  state.overheated = combat.locked;
  burnOil(state, dt);

  stepBolts(combat, dt, state);
  if (keeper.dashTime > 0) dashStrike(combat, state);
  else clearDashMarks(state);

  if (combat.chainTimer > 0) {
    combat.chainTimer -= dt;
    if (combat.chainTimer <= 0) state.combo = 0;
  }
  if (state.pulse > 0) state.pulse = Math.max(0, state.pulse - dt);
}

export function drawBolts(ctx, state) {
  const bolts = state.bolts;
  if (!bolts) return;
  ctx.lineCap = 'round';
  for (let i = 0; i < bolts.length; i += 1) {
    const bolt = bolts[i];
    if (!bolt.alive) continue;
    const speed = Math.hypot(bolt.vx, bolt.vy);
    if (speed > 8) {
      const tx = bolt.vx / speed;
      const ty = bolt.vy / speed;
      const tail = 32;
      const grad = ctx.createLinearGradient(bolt.x - tx * tail, bolt.y - ty * tail, bolt.x, bolt.y);
      grad.addColorStop(0, 'rgba(255, 120, 24, 0)');
      grad.addColorStop(1, 'rgba(255, 226, 150, 0.95)');
      ctx.strokeStyle = grad;
      ctx.lineWidth = bolt.radius * 1.8;
      ctx.beginPath();
      ctx.moveTo(bolt.x - tx * tail, bolt.y - ty * tail);
      ctx.lineTo(bolt.x, bolt.y);
      ctx.stroke();
    }
    ctx.fillStyle = 'rgba(255, 170, 40, 0.4)';
    ctx.beginPath();
    ctx.arc(bolt.x, bolt.y, bolt.radius * 2.3, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = PALETTE.lantern;
    ctx.beginPath();
    ctx.arc(bolt.x, bolt.y, bolt.radius + 1, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = PALETTE.lanternCore;
    ctx.beginPath();
    ctx.arc(bolt.x, bolt.y, bolt.radius * 0.5, 0, Math.PI * 2);
    ctx.fill();
  }
}

export function drawHalo(ctx, state) {
  if (!state.pulse) return;
  const life = 0.42;
  const grown = 1 - state.pulse / life;
  const radius = 18 + grown * COMBAT.pulseRadius;
  const alpha = Math.max(0, state.pulse / life);
  ctx.save();
  ctx.globalAlpha = alpha * 0.4;
  ctx.strokeStyle = PALETTE.lantern;
  ctx.lineWidth = 10;
  ctx.beginPath();
  ctx.arc(state.player.x, state.player.y, radius, 0, Math.PI * 2);
  ctx.stroke();
  ctx.globalAlpha = alpha;
  ctx.strokeStyle = PALETTE.lanternCore;
  ctx.lineWidth = 3.5;
  ctx.stroke();
  ctx.restore();
}

function fireBolt(combat, keeper, state) {
  let bolt = null;
  for (let i = 0; i < combat.bolts.length; i += 1) {
    if (!combat.bolts[i].alive) {
      bolt = combat.bolts[i];
      break;
    }
  }
  if (!bolt) return;
  const angle = keeper.angle;
  bolt.alive = true;
  bolt.x = keeper.x + Math.cos(angle) * 18;
  bolt.y = keeper.y + Math.sin(angle) * 18;
  bolt.vx = Math.cos(angle) * COMBAT.boltSpeed;
  bolt.vy = Math.sin(angle) * COMBAT.boltSpeed;
  bolt.life = COMBAT.boltLife;
  bolt.damage = COMBAT.boltDamage + state.mods.damage;
  bolt.radius = COMBAT.boltRadius;
}

function stepBolts(combat, dt, state) {
  for (let i = 0; i < combat.bolts.length; i += 1) {
    const bolt = combat.bolts[i];
    if (!bolt.alive) continue;
    bolt.life -= dt;
    bolt.x += bolt.vx * dt;
    bolt.y += bolt.vy * dt;
    const rim = (bolt.x - ARENA.cx) ** 2 + (bolt.y - ARENA.cy) ** 2;
    if (bolt.life <= 0 || rim > (ARENA.radius + 24) ** 2) {
      bolt.alive = false;
      continue;
    }
    const bucket = (bolt.life * 14) | 0;
    if (bolt.ember !== bucket) {
      bolt.ember = bucket;
      state.particles.spawn(bolt.x, bolt.y, {
        vx: -bolt.vx * 0.02,
        vy: -bolt.vy * 0.02 - 10,
        life: 0.22,
        size: 2.3,
        color: bucket % 2 ? PALETTE.ember : '#ffd27a',
        kind: 'ember',
        drag: 3,
      });
    }
    const speed = Math.hypot(bolt.vx, bolt.vy) || 1;
    const hit = nearestTarget(state, bolt.x, bolt.y, bolt.radius);
    if (!hit) continue;
    const dirX = bolt.vx / speed;
    const dirY = bolt.vy / speed;
    const result = hit.crown
      ? strikeCrown(combat, state, hit.crown, bolt.damage, dirX, dirY)
      : strikeShade(hit.enemy, bolt.damage, dirX, dirY, COMBAT.boltForce);
    if (result === 'immune') continue;
    bolt.alive = false;
    if (!hit.crown) noteHit(combat, state, hit.enemy, result);
  }
}

function dashStrike(combat, state) {
  const keeper = state.player;
  const list = state.enemies;
  for (let i = 0; i < list.length; i += 1) {
    const enemy = list[i];
    if (!enemy.alive || enemy.dashed) continue;
    if (!circlesOverlap(keeper.x, keeper.y, keeper.radius, enemy.x, enemy.y, enemy.radius)) continue;
    enemy.dashed = true;
    const result = strikeShade(enemy, COMBAT.dashDamage, keeper.dashX, keeper.dashY, COMBAT.dashForce);
    if (result === 'hit' || result === 'kill') noteHit(combat, state, enemy, result);
  }
  const boss = state.boss;
  if (boss && boss.active && !boss.dying && circlesOverlap(keeper.x, keeper.y, keeper.radius, boss.x, boss.y, boss.radius)) {
    strikeCrown(combat, state, boss, COMBAT.dashDamage, keeper.dashX, keeper.dashY);
  }
}

function clearDashMarks(state) {
  const list = state.enemies;
  for (let i = 0; i < list.length; i += 1) list[i].dashed = false;
}

function castHalo(combat, state) {
  state.special = 0;
  state.pulse = 0.42;
  state.shake = Math.min(12, state.shake + 7);
  state.flash = Math.min(0.55, state.flash + 0.28);
  const keeper = state.player;
  const reach = COMBAT.pulseRadius * state.mods.pulse;
  if (state.hear) state.hear('pulse');
  puffRing(state, keeper.x, keeper.y, PALETTE.lanternCore, 16, 120);
  const list = state.enemies;
  for (let i = 0; i < list.length; i += 1) {
    const enemy = list[i];
    if (!enemy.alive) continue;
    const dx = enemy.x - keeper.x;
    const dy = enemy.y - keeper.y;
    const dist = Math.hypot(dx, dy);
    if (dist > reach + enemy.radius) continue;
    const nx = dist < 1e-4 ? Math.cos(keeper.angle) : dx / dist;
    const ny = dist < 1e-4 ? Math.sin(keeper.angle) : dy / dist;
    const result = strikeShade(enemy, COMBAT.pulseDamage, nx, ny, COMBAT.pulseForce);
    if (result === 'hit' || result === 'kill') noteHit(combat, state, enemy, result);
  }
  const boss = state.boss;
  if (boss && boss.active && !boss.dying) {
    const dx = boss.x - keeper.x;
    const dy = boss.y - keeper.y;
    const dist = Math.hypot(dx, dy);
    if (dist <= reach + boss.radius) {
      const nx = dist < 1e-4 ? Math.cos(keeper.angle) : dx / dist;
      const ny = dist < 1e-4 ? Math.sin(keeper.angle) : dy / dist;
      strikeCrown(combat, state, boss, COMBAT.pulseDamage, nx, ny);
    }
  }
}

function nearestTarget(state, x, y, radius) {
  const shade = nearestShade(state.enemies, x, y, radius);
  const boss = state.boss;
  const crownOpen = boss && boss.active && !boss.dying && boss.invuln <= 0;
  if (!crownOpen) return shade ? { enemy: shade, crown: null } : null;
  const dx = boss.x - x;
  const dy = boss.y - y;
  const reach = radius + boss.radius;
  const bossDist = dx * dx + dy * dy;
  if (bossDist > reach * reach) return shade ? { enemy: shade, crown: null } : null;
  if (!shade) return { enemy: null, crown: boss };
  const shadeDist = (shade.x - x) ** 2 + (shade.y - y) ** 2;
  if (bossDist <= shadeDist) return { enemy: null, crown: boss };
  return { enemy: shade, crown: null };
}

function strikeCrown(combat, state, boss, damage, dirX, dirY) {
  const result = strikeBoss(boss, damage);
  if (result !== 'hit' && result !== 'kill') return result;
  boss.ox += dirX * 90;
  boss.oy += dirY * 90;
  noteHit(combat, state, boss, result);
  state.shake = Math.min(11, state.shake + (result === 'kill' ? 4 : 1.4));
  burstCrown(state, boss.x, boss.y);
  return result;
}

function burstCrown(state, x, y) {
  for (let i = 0; i < 5; i += 1) {
    const angle = (i / 5) * Math.PI * 2;
    state.particles.spawn(x, y, {
      vx: Math.cos(angle) * 110,
      vy: Math.sin(angle) * 110,
      life: 0.22,
      size: 2.4,
      color: '#d7ccff',
    });
  }
}

function nearestShade(list, x, y, radius) {
  if (!list) return null;
  let best = null;
  let bestDist = Infinity;
  for (let i = 0; i < list.length; i += 1) {
    const enemy = list[i];
    if (!enemy.alive || enemy.ghost) continue;
    const dx = enemy.x - x;
    const dy = enemy.y - y;
    const reach = radius + enemy.radius;
    const distSq = dx * dx + dy * dy;
    if (distSq < reach * reach && distSq < bestDist) {
      best = enemy;
      bestDist = distSq;
    }
  }
  return best;
}

function noteHit(combat, state, enemy, result) {
  if (combat.chainTimer > 0) state.combo += 1;
  else state.combo = 1;
  combat.chainTimer = COMBAT.chainTime * state.mods.chain;
  const chain = Math.min(state.combo, 24);
  const worth = state.mods.score;
  const kill = result === 'kill';
  const gained = kill
    ? Math.round(enemy.bounty * (1 + chain * 0.18) * worth)
    : Math.round((4 + chain) * worth);
  state.score += gained;
  if (state.run) noteChain(state.run, state.combo);
  if (kill) {
    if (state.run) noteKill(state.run, state.combo);
    const rate = state.emberRate > 0 ? state.emberRate : 1;
    const drop = Math.max(1, Math.round(((enemy.bounty || 90) / 90) * rate));
    state.embers = (state.embers || 0) + drop;
    state.special = Math.min(1, state.special + COMBAT.specialKill * state.mods.special);
    refillOil(state, state.mods.oilOnKill);
    if (state.hear) state.hear('kill');
    state.shake = Math.min(10, state.shake + 3.4);
    state.flash = Math.min(0.5, state.flash + 0.14);
    puffRing(state, enemy.x, enemy.y, PALETTE.lantern, 10, 110);
    sparkBurst(state, enemy.x, enemy.y, 9, 170);
  } else {
    state.special = Math.min(1, state.special + COMBAT.specialHit * state.mods.special);
    if (state.hear) state.hear('hit');
    state.shake = Math.min(6, state.shake + 1.1);
    state.flash = Math.min(0.28, state.flash + 0.045);
    sparkBurst(state, enemy.x, enemy.y, 6, 130);
  }
  popScore(state, enemy, gained, chain);
}

function sparkBurst(state, x, y, count, speed) {
  for (let i = 0; i < count; i += 1) {
    const angle = (i / count) * Math.PI * 2 + 0.2;
    state.particles.spawn(x, y, {
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      life: 0.26,
      size: 2.8,
      color: i % 2 ? PALETTE.lantern : PALETTE.lanternCore,
      kind: 'spark',
      drag: 2.2,
    });
  }
  state.particles.spawn(x, y, {
    vy: -24,
    life: 0.35,
    size: 4,
    color: PALETTE.ember,
    kind: 'ember',
    drag: 1.5,
  });
}

function popScore(state, enemy, gained, chain) {
  state.particles.spawn(enemy.x, enemy.y - 16, {
    vy: -48,
    life: 0.78,
    size: 0,
    drag: 1.2,
    color: '#ffe9a2',
    text: `+${gained}`,
    scale: gained >= 100 ? 1.2 : 0.95,
    kind: 'pop',
  });
  if (chain >= 2 && (chain === 2 || chain % 4 === 0)) {
    state.particles.spawn(enemy.x, enemy.y - 42, {
      vy: -20,
      life: 0.85,
      size: 0,
      drag: 0.5,
      color: '#fff3b0',
      text: `CHAIN x${chain}!`,
      scale: 1.55,
      kind: 'pop',
    });
  }
}

function puffRing(state, x, y, color, count, speed) {
  for (let i = 0; i < count; i += 1) {
    const angle = (i / count) * Math.PI * 2;
    state.particles.spawn(x, y, {
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      life: 0.32,
      size: 2.6,
      color,
    });
  }
}
