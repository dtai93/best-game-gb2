/** The Unlit Crown. Night 8 holds the dawn until the crown falls. */

import { ARENA, BOSS, PALETTE, WELL } from './config.js';
import { spawnShade } from './enemies.js';
import { circlesOverlap } from './physics.js';
import { drainOil, refillOil } from './upgrades.js';

const WEDGE_REACH = 236;
const WEDGE_HALF = 0.3;
const RING_RADIUS = 126;
const RING_BAND = 22;
const NOVA_RADIUS = 156;
const SPIKE_COUNT = 5;
const SPIKE_SPREAD = 0.5;
const SPIKE_SPEED = 188;
const SHARD_POOL = 8;

export function createBoss() {
  const shards = [];
  for (let i = 0; i < SHARD_POOL; i += 1) {
    shards.push({ alive: false, x: 0, y: 0, vx: 0, vy: 0, life: 0 });
  }
  return {
    active: false,
    dying: false,
    cleared: false,
    x: ARENA.cx,
    y: ARENA.cy - 160,
    ox: 0,
    oy: 0,
    angle: -Math.PI / 2,
    hp: BOSS.hp,
    maxHp: BOSS.hp,
    radius: BOSS.radius,
    bounty: BOSS.bounty,
    phase: 1,
    mode: 'idle',
    timer: 0,
    orbit: -Math.PI / 2,
    spin: 0,
    aim: 0,
    warn: 0,
    attack: 'wedge',
    pattern: 0,
    hit: 0,
    invuln: 0,
    touch: 0,
    band: 0,
    struck: false,
    sips: 0,
    goalX: ARENA.cx,
    goalY: ARENA.cy,
    shards,
  };
}

export function resetBoss(boss) {
  boss.active = false;
  boss.dying = false;
  boss.cleared = false;
  boss.hp = BOSS.hp;
  boss.maxHp = BOSS.hp;
  boss.radius = BOSS.radius;
  boss.phase = 1;
  boss.mode = 'idle';
  boss.timer = 0;
  boss.hit = 0;
  boss.invuln = 0;
  boss.ox = 0;
  boss.oy = 0;
  boss.pattern = 0;
  boss.band = 0;
  boss.sips = 0;
  boss.struck = false;
  boss.touch = 0;
  for (let i = 0; i < boss.shards.length; i += 1) boss.shards[i].alive = false;
}

/** Drop the crown onto the rim. A short arrive keeps it immune while it takes its orbit. */
export function beginBoss(boss, state) {
  resetBoss(boss);
  boss.active = true;
  const cut = state && state.bossCut > 0 && state.bossCut < 1 ? state.bossCut : 1;
  if (cut < 1) {
    boss.maxHp = Math.max(40, Math.round(BOSS.hp * cut));
    boss.hp = boss.maxHp;
  }
  boss.mode = 'arrive';
  boss.timer = 1.25;
  boss.invuln = 1.25;
  boss.orbit = -Math.PI / 2;
  boss.phase = 1;
  boss.attack = 'wedge';
  const start = orbitPoint(-Math.PI / 2, ARENA.radius - boss.radius - 16);
  boss.x = start.x;
  boss.y = start.y;
  refillOil(state, 0.12);
  if (state.hear) state.hear('boss');
  state.shake = Math.min(12, state.shake + 6);
  state.flash = Math.min(0.45, state.flash + 0.18);
  burst(state, boss.x, boss.y, '#c9b6ff', 16, 130);
}

/**
 * Step the crown, its shards, and its tells.
 * Returns 'dead' when the flourish ends, 'phase' when a phase opens, otherwise null.
 */
export function updateBoss(boss, dt, state, foes) {
  if (!boss.active) return null;
  boss.hit = Math.max(0, boss.hit - dt);
  boss.invuln = Math.max(0, boss.invuln - dt);
  boss.touch = Math.max(0, boss.touch - dt);
  boss.spin += dt * (1.1 + boss.phase * 0.7);
  boss.x += boss.ox * dt;
  boss.y += boss.oy * dt;
  const damp = Math.exp(-4 * dt);
  boss.ox *= damp;
  boss.oy *= damp;

  if (boss.dying) return stepDeath(boss, dt, state, foes);

  const ratio = boss.maxHp > 0 ? boss.hp / boss.maxHp : 0;
  const nextPhase = ratio <= 0.33 ? 3 : ratio <= 0.66 ? 2 : 1;
  let mark = null;
  if (nextPhase > boss.phase && boss.mode !== 'arrive') {
    boss.phase = nextPhase;
    boss.mode = 'recover';
    boss.timer = 0.95;
    boss.invuln = 0.65;
    boss.pattern = 0;
    boss.band = 0;
    state.shake = Math.min(10, state.shake + 4);
    state.flash = Math.min(0.4, state.flash + 0.12);
    burst(state, boss.x, boss.y, '#9a86e0', 14, 120);
    if (nextPhase === 3 && living(foes) === 0) summon(foes, state, 'hound', 1);
    mark = 'phase';
  }

  if (boss.mode === 'arrive') {
    boss.timer -= dt;
    const goal = orbitPoint(boss.orbit, orbitRadius(1));
    easeToward(boss, goal.x, goal.y, dt, 2.4);
    if (boss.timer <= 0) {
      boss.mode = 'orbit';
      boss.timer = 1.15;
    }
  } else if (boss.mode === 'orbit') {
    boss.orbit += (0.38 + boss.phase * 0.2) * dt;
    const goal = orbitPoint(boss.orbit, orbitRadius(boss.phase));
    easeToward(boss, goal.x, goal.y, dt, 3.6);
    boss.timer -= dt;
    if (boss.timer <= 0) openAttack(boss, state, foes);
  } else if (boss.mode === 'warn') {
    const span = warnSpan(boss);
    boss.timer -= dt;
    boss.warn = 1 - Math.max(0, boss.timer) / span;
    if (boss.attack !== 'charge') {
      boss.orbit += 0.12 * dt;
      const goal = orbitPoint(boss.orbit, orbitRadius(boss.phase));
      easeToward(boss, goal.x, goal.y, dt, 1.15);
    }
    if (boss.timer <= 0) releaseAttack(boss, state);
  } else if (boss.mode === 'strike') {
    boss.timer -= dt;
    runStrike(boss, dt, state);
    if (boss.timer <= 0) {
      boss.mode = 'recover';
      boss.timer = boss.phase === 3 ? 0.62 : 0.88;
      boss.band = 0;
    }
  } else if (boss.mode === 'recover') {
    boss.timer -= dt;
    const goal = orbitPoint(boss.orbit, orbitRadius(boss.phase));
    easeToward(boss, goal.x, goal.y, dt, 2.8);
    if (boss.timer <= 0) {
      boss.mode = 'orbit';
      boss.timer = boss.phase === 1 ? 1.45 : boss.phase === 2 ? 0.95 : 0.62;
    }
  }

  keepInArena(boss);
  stepShards(boss, dt, state);
  touchKeeper(boss, state);
  return mark;
}

/** Damage the crown. Returns 'kill', 'hit', 'immune', or 'gone'. */
export function strikeBoss(boss, damage) {
  if (!boss || !boss.active || boss.dying) return 'gone';
  if (boss.invuln > 0) return 'immune';
  boss.hp -= damage;
  boss.hit = 0.14;
  if (boss.hp <= 0) {
    boss.hp = 0;
    boss.dying = true;
    boss.timer = 1.55;
    boss.mode = 'dying';
    return 'kill';
  }
  return 'hit';
}

export function drawBoss(ctx, boss, time) {
  if (!boss || !boss.active) return;
  drawTelegraph(ctx, boss);
  drawShards(ctx, boss, time);
  ctx.save();
  ctx.translate(boss.x, boss.y);
  ctx.fillStyle = 'rgba(0, 0, 0, 0.4)';
  ctx.beginPath();
  ctx.ellipse(0, 14, boss.radius * 0.8, 8, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = 'rgba(180, 120, 255, 0.4)';
  ctx.beginPath();
  ctx.arc(0, 0, boss.radius + 16, 0, Math.PI * 2);
  ctx.fill();
  ctx.rotate(boss.spin);
  const spikes = 7 + boss.phase * 2;
  ctx.beginPath();
  for (let i = 0; i < spikes; i += 1) {
    const angle = (i / spikes) * Math.PI * 2;
    const outer = boss.radius + 8 + (i % 2) * 9;
    const inner = boss.radius * 0.62;
    const mid = angle + Math.PI / spikes;
    if (i === 0) ctx.moveTo(Math.cos(angle) * outer, Math.sin(angle) * outer);
    else ctx.lineTo(Math.cos(angle) * outer, Math.sin(angle) * outer);
    ctx.lineTo(Math.cos(mid) * inner, Math.sin(mid) * inner);
  }
  ctx.closePath();
  ctx.fillStyle = boss.hit > 0 ? PALETTE.lanternCore : '#5a34b0';
  ctx.fill();
  ctx.strokeStyle = boss.phase === 3 ? PALETTE.danger : '#f0e4ff';
  ctx.lineWidth = 4;
  ctx.stroke();
  ctx.rotate(-boss.spin);
  ctx.beginPath();
  ctx.arc(0, 0, 11, 0, Math.PI * 2);
  ctx.fillStyle = boss.phase === 3 ? '#ff5a6a' : boss.phase === 2 ? '#8a62ff' : '#6a44d0';
  ctx.fill();
  ctx.strokeStyle = '#140c18';
  ctx.lineWidth = 3;
  ctx.stroke();
  ctx.beginPath();
  ctx.arc(0, 0, 4.5, 0, Math.PI * 2);
  ctx.fillStyle = boss.hit > 0 ? PALETTE.lanternCore : '#fff4c8';
  ctx.fill();
  ctx.restore();
}

function stepDeath(boss, dt, state, foes) {
  if (!boss.cleared) {
    boss.cleared = true;
    silenceAdds(foes, state);
    for (let i = 0; i < boss.shards.length; i += 1) boss.shards[i].alive = false;
  }
  boss.timer -= dt;
  boss.radius = BOSS.radius * Math.max(0.15, boss.timer / 1.55);
  if (((boss.timer * 10) | 0) % 2 === 0) burst(state, boss.x, boss.y, '#d4c2ff', 2, 70);
  if (boss.timer > 0) return null;
  boss.active = false;
  burst(state, boss.x, boss.y, PALETTE.lanternCore, 22, 170);
  state.shake = Math.min(14, state.shake + 8);
  state.flash = Math.min(0.6, state.flash + 0.3);
  return 'dead';
}

function openAttack(boss, state, foes) {
  const player = state.player;
  boss.mode = 'warn';
  boss.aim = Math.atan2(player.y - boss.y, player.x - boss.x);
  boss.warn = 0;
  boss.struck = false;
  if (boss.phase === 1) {
    boss.attack = 'wedge';
    if (boss.pattern === 2) summon(foes, state, 'moth', 2);
  } else if (boss.phase === 2) {
    boss.attack = boss.pattern % 2 === 0 ? 'spikes' : 'ring';
    if (boss.attack === 'ring' && living(foes) === 0) summon(foes, state, 'hound', 1);
  } else {
    boss.attack = boss.pattern % 2 === 0 ? 'charge' : 'nova';
  }
  boss.pattern += 1;
  boss.timer = warnSpan(boss);
  if (boss.attack === 'charge') {
    const mark = clampPoint(player.x, player.y, BOSS.radius + 8);
    boss.goalX = mark.x;
    boss.goalY = mark.y;
  }
}

function warnSpan(boss) {
  if (boss.attack === 'spikes') return 0.64;
  if (boss.attack === 'ring') return 0.86;
  if (boss.attack === 'charge') return 0.7;
  if (boss.attack === 'nova') return 0.74;
  return 0.8;
}

function releaseAttack(boss, state) {
  boss.mode = 'strike';
  boss.struck = false;
  boss.warn = 1;
  if (boss.attack === 'wedge') boss.timer = 0.26;
  else if (boss.attack === 'spikes') {
    boss.timer = 0.16;
    launchSpikes(boss);
  } else if (boss.attack === 'ring') boss.timer = 0.3;
  else if (boss.attack === 'charge') boss.timer = 0.4;
  else boss.timer = 0.32;
  if (state.hear) state.hear('crown');
  state.shake = Math.min(8, state.shake + 1.6);
}

function runStrike(boss, dt, state) {
  const player = state.player;
  if (boss.attack === 'wedge') {
    if (boss.struck || player.dashTime > 0) return;
    const dx = player.x - boss.x;
    const dy = player.y - boss.y;
    const dist = Math.hypot(dx, dy);
    if (dist > WEDGE_REACH || dist < boss.radius * 0.7) return;
    let angle = Math.atan2(dy, dx) - boss.aim;
    while (angle > Math.PI) angle -= Math.PI * 2;
    while (angle < -Math.PI) angle += Math.PI * 2;
    if (Math.abs(angle) > WEDGE_HALF) return;
    boss.struck = true;
    hurt(boss, state, 0.064, player.x, player.y);
    return;
  }
  if (boss.attack === 'charge') {
    easeToward(boss, boss.goalX, boss.goalY, dt, 8);
    return;
  }
  if (boss.attack === 'ring') {
    const span = 0.3;
    const grown = 1 - Math.max(0, boss.timer) / span;
    boss.band = 28 + grown * (RING_RADIUS - 28);
    if (boss.struck || boss.timer > 0.05 || player.dashTime > 0) return;
    const dist = Math.hypot(player.x - boss.x, player.y - boss.y);
    if (Math.abs(dist - RING_RADIUS) > RING_BAND) return;
    boss.struck = true;
    hurt(boss, state, 0.07, player.x, player.y);
    return;
  }
  if (boss.attack === 'nova') {
    const span = 0.32;
    const grown = 1 - Math.max(0, boss.timer) / span;
    boss.band = grown * NOVA_RADIUS;
    if (boss.struck || boss.timer > 0.05 || player.dashTime > 0) return;
    const dist = Math.hypot(player.x - boss.x, player.y - boss.y);
    if (dist > NOVA_RADIUS || dist < 24) return;
    boss.struck = true;
    hurt(boss, state, 0.08, player.x, player.y);
  }
}

function launchSpikes(boss) {
  for (let i = 0; i < SPIKE_COUNT; i += 1) {
    const shard = freeShard(boss);
    if (!shard) return;
    const along = SPIKE_COUNT === 1 ? 0.5 : i / (SPIKE_COUNT - 1);
    const angle = boss.aim + (along - 0.5) * SPIKE_SPREAD;
    shard.alive = true;
    shard.x = boss.x + Math.cos(angle) * (boss.radius + 8);
    shard.y = boss.y + Math.sin(angle) * (boss.radius + 8);
    shard.vx = Math.cos(angle) * SPIKE_SPEED;
    shard.vy = Math.sin(angle) * SPIKE_SPEED;
    shard.life = 1.65;
  }
}

function stepShards(boss, dt, state) {
  const player = state.player;
  for (let i = 0; i < boss.shards.length; i += 1) {
    const shard = boss.shards[i];
    if (!shard.alive) continue;
    shard.life -= dt;
    shard.x += shard.vx * dt;
    shard.y += shard.vy * dt;
    const outside = (shard.x - ARENA.cx) ** 2 + (shard.y - ARENA.cy) ** 2;
    if (shard.life <= 0 || outside > (ARENA.radius + 12) ** 2) {
      shard.alive = false;
      continue;
    }
    if (player.dashTime > 0) continue;
    if (!circlesOverlap(shard.x, shard.y, 7, player.x, player.y, player.radius)) continue;
    shard.alive = false;
    hurt(boss, state, 0.042, player.x, player.y);
  }
}

function touchKeeper(boss, state) {
  if (boss.dying || boss.invuln > 0 || boss.touch > 0) return;
  const player = state.player;
  if (player.dashTime > 0) return;
  if (!circlesOverlap(boss.x, boss.y, boss.radius, player.x, player.y, player.radius)) return;
  boss.touch = BOSS.contactGap;
  hurt(boss, state, BOSS.contactOil, player.x, player.y);
}

function hurt(boss, state, oil, x, y) {
  drainOil(state, oil);
  boss.sips += 1;
  state.shake = Math.min(11, state.shake + 3.4);
  state.flash = Math.min(0.42, state.flash + 0.1);
  if (state.hear) state.hear('hurt');
  burst(state, x, y, PALETTE.danger, 6, 100);
}

function summon(foes, state, type, count) {
  if (!foes || living(foes) >= 3) return;
  const base = state.rng.float() * Math.PI * 2;
  for (let i = 0; i < count; i += 1) {
    if (living(foes) >= 3) return;
    const angle = base + (i - (count - 1) / 2) * 0.45;
    spawnShade(foes, type, angle, state.rng.float());
  }
}

function living(foes) {
  if (!foes) return 99;
  let count = 0;
  const list = foes.list;
  for (let i = 0; i < list.length; i += 1) if (list[i].alive) count += 1;
  return count;
}

function silenceAdds(foes, state) {
  if (!foes) return;
  const list = foes.list;
  for (let i = 0; i < list.length; i += 1) {
    const enemy = list[i];
    if (!enemy.alive) continue;
    enemy.alive = false;
    burst(state, enemy.x, enemy.y, '#d4c2ff', 4, 80);
  }
  const motes = foes.motes;
  if (!motes) return;
  for (let i = 0; i < motes.length; i += 1) motes[i].alive = false;
}

function drawTelegraph(ctx, boss) {
  const live = boss.mode === 'warn' || boss.mode === 'strike';
  if (!live || boss.dying) return;
  const alpha = boss.mode === 'strike' ? 0.5 : 0.15 + boss.warn * 0.4;
  ctx.save();
  if (boss.attack === 'wedge') {
    ctx.globalAlpha = alpha;
    ctx.fillStyle = '#b9a6ff';
    ctx.beginPath();
    ctx.moveTo(boss.x, boss.y);
    ctx.arc(boss.x, boss.y, WEDGE_REACH, boss.aim - WEDGE_HALF, boss.aim + WEDGE_HALF);
    ctx.closePath();
    ctx.fill();
  } else if (boss.attack === 'spikes' && boss.mode === 'warn') {
    ctx.globalAlpha = 0.35 + boss.warn * 0.55;
    ctx.strokeStyle = '#d7ccff';
    ctx.lineWidth = 2;
    for (let i = 0; i < SPIKE_COUNT; i += 1) {
      const along = i / (SPIKE_COUNT - 1);
      const angle = boss.aim + (along - 0.5) * SPIKE_SPREAD;
      ctx.beginPath();
      ctx.moveTo(boss.x + Math.cos(angle) * boss.radius, boss.y + Math.sin(angle) * boss.radius);
      ctx.lineTo(boss.x + Math.cos(angle) * 200, boss.y + Math.sin(angle) * 200);
      ctx.stroke();
    }
  } else if (boss.attack === 'ring') {
    const radius = boss.mode === 'strike' ? Math.max(8, boss.band) : RING_RADIUS;
    ctx.globalAlpha = alpha;
    ctx.strokeStyle = '#b9a6ff';
    ctx.lineWidth = boss.mode === 'strike' ? 16 : 3;
    ctx.beginPath();
    ctx.arc(boss.x, boss.y, radius, 0, Math.PI * 2);
    ctx.stroke();
  } else if (boss.attack === 'charge') {
    ctx.globalAlpha = 0.4 + boss.warn * 0.5;
    ctx.strokeStyle = PALETTE.danger;
    ctx.lineWidth = 2;
    ctx.setLineDash([7, 6]);
    ctx.beginPath();
    ctx.moveTo(boss.x, boss.y);
    ctx.lineTo(boss.goalX, boss.goalY);
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.beginPath();
    ctx.arc(boss.goalX, boss.goalY, boss.radius * 0.85, 0, Math.PI * 2);
    ctx.stroke();
  } else if (boss.attack === 'nova') {
    const radius = boss.mode === 'strike' ? Math.max(8, boss.band) : NOVA_RADIUS;
    ctx.globalAlpha = alpha;
    ctx.strokeStyle = boss.mode === 'strike' ? PALETTE.danger : '#d7ccff';
    ctx.lineWidth = boss.mode === 'strike' ? 8 : 3;
    ctx.beginPath();
    ctx.arc(boss.x, boss.y, radius, 0, Math.PI * 2);
    ctx.stroke();
  }
  ctx.restore();
}

function drawShards(ctx, boss, time) {
  for (let i = 0; i < boss.shards.length; i += 1) {
    const shard = boss.shards[i];
    if (!shard.alive) continue;
    const speed = Math.hypot(shard.vx, shard.vy) || 1;
    ctx.strokeStyle = 'rgba(230, 214, 255, 0.9)';
    ctx.lineWidth = 3;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(shard.x, shard.y);
    ctx.lineTo(shard.x - (shard.vx / speed) * 40, shard.y - (shard.vy / speed) * 40);
    ctx.stroke();
    ctx.save();
    ctx.translate(shard.x, shard.y);
    ctx.rotate(time * 4 + i);
    ctx.fillStyle = '#d7ccff';
    ctx.beginPath();
    ctx.moveTo(0, -7);
    ctx.lineTo(5, 0);
    ctx.lineTo(0, 7);
    ctx.lineTo(-5, 0);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  }
}

function freeShard(boss) {
  for (let i = 0; i < boss.shards.length; i += 1) {
    if (!boss.shards[i].alive) return boss.shards[i];
  }
  return null;
}

function orbitRadius(phase) {
  if (phase >= 3) return 150;
  if (phase === 2) return 166;
  return 184;
}

function orbitPoint(angle, radius) {
  return {
    x: ARENA.cx + Math.cos(angle) * radius,
    y: ARENA.cy + Math.sin(angle) * radius,
  };
}

function easeToward(boss, x, y, dt, rate) {
  const blend = 1 - Math.exp(-rate * dt);
  boss.x += (x - boss.x) * blend;
  boss.y += (y - boss.y) * blend;
}

function keepInArena(boss) {
  const placed = clampPoint(boss.x, boss.y, boss.radius);
  boss.x = placed.x;
  boss.y = placed.y;
}

function clampPoint(x, y, pad) {
  const dx = x - ARENA.cx;
  const dy = y - ARENA.cy;
  const dist = Math.hypot(dx, dy) || 1;
  const min = WELL.solid + pad + 8;
  const max = ARENA.radius - pad - 8;
  const held = Math.min(max, Math.max(min, dist));
  return {
    x: ARENA.cx + (dx / dist) * held,
    y: ARENA.cy + (dy / dist) * held,
  };
}

function burst(state, x, y, color, count, speed) {
  if (!state.particles) return;
  for (let i = 0; i < count; i += 1) {
    const angle = (i / count) * Math.PI * 2;
    state.particles.spawn(x, y, {
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      life: 0.36,
      size: 2.6,
      color,
    });
  }
}
