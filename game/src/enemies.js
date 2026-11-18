/** Shade motion, well siphon, and silhouettes. Five types, one pool. */

import { ARENA, PALETTE, SHADE, WELL } from './config.js';
import { circlesOverlap, clampToCircle } from './physics.js';
import { drainOil } from './upgrades.js';

const POOL = 48;
const MOTE_POOL = 20;
const scratch = { x: 0, y: 0 };

export function createEnemies() {
  const list = [];
  for (let i = 0; i < POOL; i += 1) list.push(makeShade());
  const motes = [];
  for (let i = 0; i < MOTE_POOL; i += 1) {
    motes.push({ alive: false, x: 0, y: 0, vx: 0, vy: 0, life: 0 });
  }
  return { list, motes, pace: 1, bounty: 1 };
}

export function resetEnemies(foes) {
  for (let i = 0; i < foes.list.length; i += 1) foes.list[i].alive = false;
  for (let i = 0; i < foes.motes.length; i += 1) foes.motes[i].alive = false;
}

/** Place one shade on the arena rim. `salt` is a 0..1 stagger from the seeded RNG. Returns the shade, or null when the pool is full. */
export function spawnShade(foes, type, angle, salt) {
  const stats = SHADE[type];
  if (!stats) return false;
  let enemy = null;
  for (let i = 0; i < foes.list.length; i += 1) {
    if (!foes.list[i].alive) {
      enemy = foes.list[i];
      break;
    }
  }
  if (!enemy) return null;
  const rim = ARENA.radius - stats.radius - 8;
  enemy.alive = true;
  enemy.type = type;
  enemy.x = ARENA.cx + Math.cos(angle) * rim;
  enemy.y = ARENA.cy + Math.sin(angle) * rim;
  enemy.vx = 0;
  enemy.vy = 0;
  enemy.ox = 0;
  enemy.oy = 0;
  enemy.angle = angle + Math.PI;
  enemy.radius = stats.radius;
  enemy.hp = stats.hp;
  enemy.maxHp = stats.hp;
  enemy.speed = stats.speed * (foes.pace > 0 ? foes.pace : 1);
  enemy.resist = stats.resist;
  enemy.bounty = Math.round(stats.bounty * (foes.bounty > 0 ? foes.bounty : 1));
  enemy.hit = 0;
  enemy.phase = type === 'hexer' ? 0.7 + salt * 2.2 : salt * 3;
  enemy.mode = 0;
  enemy.touch = 0;
  enemy.ghost = false;
  enemy.seed = salt;
  enemy.dashed = false;
  enemy.bite = 0;
  enemy.gx = Math.cos(angle + Math.PI);
  enemy.gy = Math.sin(angle + Math.PI);
  return enemy;
}

/**
 * Damage a shade and shove it. Returns 'kill', 'hit', 'immune', or 'gone'.
 * Ghost wisps ignore the strike. Knockback lives on ox/oy so steering cannot erase it.
 */
export function strikeShade(enemy, damage, dirX, dirY, force) {
  if (!enemy.alive) return 'gone';
  if (enemy.ghost) return 'immune';
  enemy.hp -= damage;
  enemy.hit = 0.16;
  const scale = (1 - enemy.resist) * force;
  enemy.ox += dirX * scale;
  enemy.oy += dirY * scale;
  if (enemy.hp <= 0) {
    enemy.alive = false;
    return 'kill';
  }
  return 'hit';
}

/** Step every shade and hex mote. Returns how many discrete siphons landed. */
export function updateEnemies(foes, dt, state) {
  let bites = 0;
  const list = foes.list;
  for (let i = 0; i < list.length; i += 1) {
    const enemy = list[i];
    if (!enemy.alive) continue;
    enemy.hit = Math.max(0, enemy.hit - dt);
    if (enemy.type === 'moth') steerMoth(enemy, state.time);
    else if (enemy.type === 'hound') steerHound(enemy, dt, state.player);
    else if (enemy.type === 'wisp') steerWisp(enemy, dt, state.time);
    else if (enemy.type === 'brute') steerBrute(enemy, dt);
    else steerHexer(enemy, dt, foes);
    enemy.x += (enemy.vx + enemy.ox) * dt;
    enemy.y += (enemy.vy + enemy.oy) * dt;
    const damp = Math.exp(-5.5 * dt);
    enemy.ox *= damp;
    enemy.oy *= damp;
  }
  separateShades(list);
  for (let i = 0; i < list.length; i += 1) {
    const enemy = list[i];
    if (!enemy.alive) continue;
    clampToCircle(
      enemy.x, enemy.y, ARENA.cx, ARENA.cy,
      ARENA.radius - enemy.radius - 4, scratch,
    );
    enemy.x = scratch.x;
    enemy.y = scratch.y;
    bites += threaten(enemy, dt, state);
  }
  bites += updateMotes(foes, dt, state);
  return bites;
}

export function drawEnemies(ctx, state) {
  const list = state.enemies;
  if (!list) return;
  for (let i = 0; i < list.length; i += 1) {
    const enemy = list[i];
    if (!enemy.alive) continue;
    drawShade(ctx, enemy, state.time);
  }
  const motes = state.motes;
  if (!motes) return;
  for (let i = 0; i < motes.length; i += 1) {
    const mote = motes[i];
    if (!mote.alive) continue;
    const speed = Math.hypot(mote.vx, mote.vy) || 1;
    const tx = mote.vx / speed;
    const ty = mote.vy / speed;
    ctx.strokeStyle = 'rgba(214, 180, 255, 0.9)';
    ctx.lineWidth = 4;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(mote.x, mote.y);
    ctx.lineTo(mote.x - tx * 52, mote.y - ty * 52);
    ctx.stroke();
    for (let g = 1; g <= 3; g += 1) {
      ctx.globalAlpha = 0.4 - g * 0.08;
      ctx.fillStyle = '#f0e4ff';
      ctx.beginPath();
      ctx.arc(mote.x - tx * g * 14, mote.y - ty * g * 14, 4 - g * 0.6, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;
    ctx.save();
    ctx.translate(mote.x, mote.y);
    ctx.fillStyle = 'rgba(180, 120, 255, 0.45)';
    ctx.beginPath();
    ctx.arc(0, 0, 11, 0, Math.PI * 2);
    ctx.fill();
    ctx.rotate(state.time * 3 + mote.x * 0.01);
    ctx.fillStyle = '#e4d2ff';
    ctx.strokeStyle = '#1a1028';
    ctx.lineWidth = 2.4;
    ctx.beginPath();
    ctx.moveTo(0, -7);
    ctx.lineTo(6, 0);
    ctx.lineTo(0, 7);
    ctx.lineTo(-6, 0);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = '#fff8ff';
    ctx.beginPath();
    ctx.arc(0, 0, 2.1, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }
}

function makeShade() {
  return {
    alive: false, type: 'moth', x: 0, y: 0, vx: 0, vy: 0, ox: 0, oy: 0, angle: 0,
    radius: 10, hp: 1, maxHp: 1, speed: 100, resist: 0, bounty: 90,
    hit: 0, phase: 0, mode: 0, touch: 0, ghost: false, seed: 0, dashed: false, bite: 0,
    gx: 0, gy: 1,
  };
}

function steerMoth(enemy, time) {
  const dx = ARENA.cx - enemy.x;
  const dy = ARENA.cy - enemy.y;
  const dist = Math.hypot(dx, dy) || 1;
  const flutter = Math.sin(time * 10 + enemy.seed * 12);
  const px = -dy / dist;
  const py = dx / dist;
  enemy.vx = (dx / dist) * enemy.speed + px * flutter * 86;
  enemy.vy = (dy / dist) * enemy.speed + py * flutter * 86;
  enemy.angle = Math.atan2(enemy.vy, enemy.vx);
}

function steerHound(enemy, dt, player) {
  const pdx = player.x - enemy.x;
  const pdy = player.y - enemy.y;
  const pd = Math.hypot(pdx, pdy);
  const wdx = ARENA.cx - enemy.x;
  const wdy = ARENA.cy - enemy.y;
  const wd = Math.hypot(wdx, wdy);
  if (enemy.mode === 0) {
    const chasePlayer = pd < 230;
    const tx = chasePlayer ? pdx : wdx;
    const ty = chasePlayer ? pdy : wdy;
    const dist = (chasePlayer ? pd : wd) || 1;
    enemy.vx = (tx / dist) * enemy.speed * 0.85;
    enemy.vy = (ty / dist) * enemy.speed * 0.85;
    enemy.angle = Math.atan2(ty, tx);
    if (pd < 168 || wd < WELL.solid + 78) {
      const atPlayer = pd < wd;
      const ad = (atPlayer ? pd : wd) || 1;
      enemy.gx = (atPlayer ? pdx : wdx) / ad;
      enemy.gy = (atPlayer ? pdy : wdy) / ad;
      enemy.mode = 1;
      enemy.phase = 0.32;
    }
    return;
  }
  enemy.phase -= dt;
  if (enemy.mode === 1) {
    enemy.vx *= 0.82;
    enemy.vy *= 0.82;
    if (enemy.phase <= 0) {
      enemy.mode = 2;
      enemy.phase = 0.42;
    }
  } else if (enemy.mode === 2) {
    enemy.vx = enemy.gx * 248;
    enemy.vy = enemy.gy * 248;
    if (enemy.phase <= 0) {
      enemy.mode = 3;
      enemy.phase = 0.5;
    }
  } else {
    enemy.vx *= 0.9;
    enemy.vy *= 0.9;
    if (enemy.phase <= 0) enemy.mode = 0;
  }
  enemy.angle = Math.atan2(enemy.gy, enemy.gx);
}

function steerWisp(enemy, dt, time) {
  enemy.phase += dt;
  enemy.ghost = (enemy.phase % 2.15) > 1.6;
  const orbit = enemy.seed * Math.PI * 2 + time * 0.85;
  const tx = ARENA.cx + Math.cos(orbit) * 96 - enemy.x;
  const ty = ARENA.cy + Math.sin(orbit) * 96 - enemy.y;
  const dist = Math.hypot(tx, ty) || 1;
  const weave = Math.sin(time * 3 + enemy.seed * 8) * 36;
  enemy.vx = (tx / dist) * enemy.speed + (-ty / dist) * weave;
  enemy.vy = (ty / dist) * enemy.speed + (tx / dist) * weave;
  enemy.angle = orbit;
}

function steerBrute(enemy, dt) {
  const dx = ARENA.cx - enemy.x;
  const dy = ARENA.cy - enemy.y;
  const dist = Math.hypot(dx, dy) || 1;
  const blend = Math.min(1, dt * 2.2);
  enemy.vx += ((dx / dist) * enemy.speed - enemy.vx) * blend;
  enemy.vy += ((dy / dist) * enemy.speed - enemy.vy) * blend;
  enemy.angle = Math.atan2(dy, dx);
}

function steerHexer(enemy, dt, foes) {
  const dx = enemy.x - ARENA.cx;
  const dy = enemy.y - ARENA.cy;
  const dist = Math.hypot(dx, dy) || 1;
  const radial = Math.max(-90, Math.min(90, dist - 206));
  const outX = dx / dist;
  const outY = dy / dist;
  const side = enemy.seed > 0.5 ? 1 : -1;
  enemy.vx = -outX * radial * 1.5 + (-outY) * enemy.speed * side;
  enemy.vy = -outY * radial * 1.5 + outX * enemy.speed * side;
  enemy.angle = Math.atan2(-dy, -dx);
  enemy.phase -= dt;
  if (enemy.phase <= 0) {
    enemy.phase = 2.35 + enemy.seed * 0.8;
    launchMote(foes, enemy);
  }
}

function launchMote(foes, enemy) {
  let mote = null;
  for (let i = 0; i < foes.motes.length; i += 1) {
    if (!foes.motes[i].alive) {
      mote = foes.motes[i];
      break;
    }
  }
  if (!mote) return;
  const dx = ARENA.cx - enemy.x;
  const dy = ARENA.cy - enemy.y;
  const dist = Math.hypot(dx, dy) || 1;
  mote.alive = true;
  mote.x = enemy.x;
  mote.y = enemy.y;
  mote.vx = (dx / dist) * 156;
  mote.vy = (dy / dist) * 156;
  mote.life = 3.2;
}

function separateShades(list) {
  for (let i = 0; i < list.length; i += 1) {
    const a = list[i];
    if (!a.alive) continue;
    for (let j = i + 1; j < list.length; j += 1) {
      const b = list[j];
      if (!b.alive) continue;
      const dx = b.x - a.x;
      const dy = b.y - a.y;
      const min = a.radius + b.radius;
      const distSq = dx * dx + dy * dy;
      if (distSq >= min * min || distSq < 1e-6) continue;
      const dist = Math.sqrt(distSq);
      const push = (min - dist) * 0.5;
      const nx = dx / dist;
      const ny = dy / dist;
      a.x -= nx * push;
      a.y -= ny * push;
      b.x += nx * push;
      b.y += ny * push;
    }
  }
}

function threaten(enemy, dt, state) {
  if (enemy.touch > 0) enemy.touch -= dt;
  if (enemy.bite > 0) enemy.bite -= dt;
  const player = state.player;
  const dx = enemy.x - ARENA.cx;
  const dy = enemy.y - ARENA.cy;
  const dist = Math.hypot(dx, dy);
  let bites = 0;

  if (player.dashTime <= 0 && circlesOverlap(
    enemy.x, enemy.y, enemy.radius, player.x, player.y, player.radius,
  )) {
    if (enemy.type === 'moth') {
      const away = Math.hypot(enemy.x - player.x, enemy.y - player.y) || 1;
      enemy.ox += ((enemy.x - player.x) / away) * 90;
      enemy.oy += ((enemy.y - player.y) / away) * 90;
    }
    if (enemy.touch <= 0 && enemy.type !== 'wisp') {
      enemy.touch = 0.85;
      if (enemy.type === 'hound') drainOil(state, enemy.mode === 2 ? 0.055 : 0.03);
      else if (enemy.type === 'brute') drainOil(state, 0.035);
      else if (enemy.type === 'hexer') drainOil(state, 0.02);
      else drainOil(state, 0.012);
      if (enemy.type !== 'moth') bites += 1;
      sting(state, enemy.x, enemy.y);
    }
  }

  const atWell = dist < WELL.solid + enemy.radius * 0.85;
  if (enemy.type === 'moth' && atWell) {
    drainOil(state, 0.042);
    enemy.alive = false;
    puff(state, enemy.x, enemy.y, PALETTE.waterGlow, 8);
    sting(state, ARENA.cx, ARENA.cy);
    return bites + 1;
  }
  if ((enemy.type === 'hound' || enemy.type === 'brute') && atWell) {
    drainOil(state, (enemy.type === 'brute' ? 0.12 : 0.075) * dt);
    enemy.vx *= 0.45;
    enemy.vy *= 0.45;
    if (enemy.bite <= 0) {
      enemy.bite = 0.9;
      bites += 1;
      sting(state, enemy.x, enemy.y);
    }
  }
  if (enemy.type === 'wisp' && !enemy.ghost && dist < 116) {
    drainOil(state, 0.05 * dt);
  }
  return bites;
}

function updateMotes(foes, dt, state) {
  let bites = 0;
  const player = state.player;
  for (let i = 0; i < foes.motes.length; i += 1) {
    const mote = foes.motes[i];
    if (!mote.alive) continue;
    mote.life -= dt;
    mote.x += mote.vx * dt;
    mote.y += mote.vy * dt;
    const outside = (mote.x - ARENA.cx) ** 2 + (mote.y - ARENA.cy) ** 2;
    if (mote.life <= 0 || outside > (ARENA.radius + 20) ** 2) {
      mote.alive = false;
      continue;
    }
    if (circlesOverlap(mote.x, mote.y, 6, ARENA.cx, ARENA.cy, WELL.radius)) {
      mote.alive = false;
      drainOil(state, 0.055);
      bites += 1;
      puff(state, mote.x, mote.y, '#b9a6ff', 6);
      sting(state, ARENA.cx, ARENA.cy);
      continue;
    }
    if (player.dashTime <= 0 && circlesOverlap(
      mote.x, mote.y, 6, player.x, player.y, player.radius,
    )) {
      mote.alive = false;
      drainOil(state, 0.028);
      bites += 1;
      sting(state, player.x, player.y);
    }
  }
  return bites;
}

function sting(state, x, y) {
  state.shake = Math.min(8, state.shake + 2.2);
  if (state.hear) state.hear('hurt');
  state.flash = Math.min(0.32, state.flash + 0.07);
  puff(state, x, y, PALETTE.danger, 4);
}

function puff(state, x, y, color, count) {
  for (let i = 0; i < count; i += 1) {
    const angle = (i / count) * Math.PI * 2;
    state.particles.spawn(x, y, {
      vx: Math.cos(angle) * 70,
      vy: Math.sin(angle) * 70,
      life: 0.28,
      size: 2.4,
      color,
    });
  }
}

function drawThreat(ctx, enemy, time) {
  if (enemy.type === 'hound' && (enemy.mode === 1 || enemy.mode === 2)) {
    const reach = enemy.mode === 1 ? 108 : 64;
    const pulse = 0.5 + 0.5 * Math.sin(time * (enemy.mode === 1 ? 16 : 9));
    ctx.save();
    ctx.globalAlpha = enemy.mode === 1 ? 0.35 + pulse * 0.4 : 0.62;
    ctx.strokeStyle = enemy.mode === 1 ? PALETTE.danger : PALETTE.lantern;
    ctx.lineWidth = enemy.mode === 1 ? 2 : 3.5;
    ctx.setLineDash(enemy.mode === 1 ? [7, 6] : []);
    ctx.beginPath();
    ctx.moveTo(enemy.x, enemy.y);
    ctx.lineTo(enemy.x + enemy.gx * reach, enemy.y + enemy.gy * reach);
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.beginPath();
    ctx.arc(enemy.x, enemy.y, enemy.radius + 5 + pulse * 5, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();
    return;
  }
  if (enemy.type === 'hexer' && enemy.phase < 0.9) {
    const charge = 1 - enemy.phase / 0.9;
    ctx.save();
    ctx.globalAlpha = 0.22 + charge * 0.55;
    ctx.strokeStyle = '#b9a6ff';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(enemy.x, enemy.y, 12 + charge * 20, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();
    return;
  }
  if (enemy.type === 'wisp' && !enemy.ghost) {
    const cycle = enemy.phase % 2.15;
    if (cycle > 1.15) {
      const charge = (cycle - 1.15) / 0.45;
      ctx.save();
      ctx.globalAlpha = 0.2 + charge * 0.5;
      ctx.strokeStyle = PALETTE.waterGlow;
      ctx.setLineDash([3, 4]);
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.arc(enemy.x, enemy.y, 14 + charge * 10, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();
    }
  }
}

function seal(ctx) {
  ctx.lineJoin = 'round';
  ctx.lineCap = 'round';
  ctx.lineWidth = 3.4;
  ctx.strokeStyle = '#140c18';
  ctx.stroke();
}

function glowOf(type) {
  if (type === 'moth') return '#c080ff';
  if (type === 'hound') return '#ff5068';
  if (type === 'wisp') return '#3dfff0';
  if (type === 'brute') return '#ffb04a';
  return '#d2b0ff';
}

function drawShade(ctx, enemy, time) {
  drawThreat(ctx, enemy, time);
  ctx.save();
  ctx.translate(enemy.x, enemy.y);
  ctx.fillStyle = 'rgba(20, 10, 8, 0.35)';
  ctx.beginPath();
  ctx.ellipse(0, enemy.radius * 0.55, enemy.radius * 0.9, enemy.radius * 0.32, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.globalAlpha = enemy.ghost ? 0.22 : 0.4;
  ctx.fillStyle = glowOf(enemy.type);
  ctx.beginPath();
  ctx.arc(0, 0, enemy.radius + 8, 0, Math.PI * 2);
  ctx.fill();
  ctx.globalAlpha = 1;
  if (enemy.type !== 'wisp' && enemy.type !== 'hexer') ctx.rotate(enemy.angle);
  if (enemy.type === 'moth') drawMoth(ctx, enemy, time);
  else if (enemy.type === 'hound') drawHound(ctx, enemy);
  else if (enemy.type === 'wisp') drawWisp(ctx, enemy, time);
  else if (enemy.type === 'brute') drawBrute(ctx, enemy);
  else drawHexer(ctx, enemy, time);
  ctx.restore();
  if (!enemy.ghost) {
    const dx = ARENA.cx - enemy.x;
    const dy = ARENA.cy - enemy.y;
    const aim = Math.atan2(dy, dx);
    ctx.strokeStyle = 'rgba(255, 228, 170, 0.95)';
    ctx.lineWidth = 3;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.arc(enemy.x, enemy.y, enemy.radius + 3, aim - 0.9, aim + 0.9);
    ctx.stroke();
  }
  if (enemy.maxHp > 1) {
    const width = enemy.radius * 2;
    const left = enemy.x - width / 2;
    const top = enemy.y + enemy.radius + 4;
    ctx.fillStyle = 'rgba(0, 0, 0, 0.45)';
    ctx.fillRect(left, top, width, 3);
    ctx.fillStyle = enemy.hp < enemy.maxHp * 0.34 ? PALETTE.danger : PALETTE.ash;
    ctx.fillRect(left, top, width * Math.max(0, enemy.hp / enemy.maxHp), 3);
  }
}

function drawMoth(ctx, enemy, time) {
  const flap = Math.sin(time * 22 + enemy.seed * 9);
  const span = 10 + flap * 4;
  const hot = enemy.hit > 0;
  ctx.fillStyle = hot ? PALETTE.lanternCore : '#8a46f0';
  ctx.beginPath();
  ctx.moveTo(4, 0);
  ctx.quadraticCurveTo(-1, -span, -13, -span - 2);
  ctx.quadraticCurveTo(-4, -3, 4, 0);
  ctx.moveTo(4, 0);
  ctx.quadraticCurveTo(-1, span, -13, span + 2);
  ctx.quadraticCurveTo(-4, 3, 4, 0);
  ctx.fill();
  seal(ctx);
  ctx.fillStyle = hot ? '#fff' : '#ffd15a';
  ctx.beginPath();
  ctx.arc(-5, -span * 0.42, 2.2, 0, Math.PI * 2);
  ctx.arc(-5, span * 0.42, 2.2, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = hot ? PALETTE.lanternCore : '#ffe6b0';
  ctx.beginPath();
  ctx.ellipse(1, 0, 7.2, 3.6, 0, 0, Math.PI * 2);
  ctx.fill();
  seal(ctx);
  ctx.fillStyle = '#2a1848';
  ctx.beginPath();
  ctx.arc(3.4, -1.15, 1.15, 0, Math.PI * 2);
  ctx.arc(3.4, 1.15, 1.15, 0, Math.PI * 2);
  ctx.fill();
}

function drawHound(ctx, enemy) {
  const hot = enemy.hit > 0;
  ctx.fillStyle = hot ? PALETTE.lanternCore : '#e23d52';
  ctx.beginPath();
  ctx.ellipse(-1, 1, 14, 8.2, 0, 0, Math.PI * 2);
  ctx.fill();
  seal(ctx);
  ctx.fillStyle = hot ? PALETTE.lanternCore : '#ff8d78';
  ctx.beginPath();
  ctx.ellipse(2, 2.2, 7, 4, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = hot ? PALETTE.lanternCore : '#c42840';
  ctx.beginPath();
  ctx.moveTo(9, 0);
  ctx.lineTo(21, 4.4);
  ctx.lineTo(21, -4.4);
  ctx.closePath();
  ctx.fill();
  seal(ctx);
  ctx.fillStyle = hot ? PALETTE.lanternCore : '#9a2040';
  ctx.beginPath();
  ctx.moveTo(-3, -6);
  ctx.lineTo(-9, -16);
  ctx.lineTo(2, -6);
  ctx.moveTo(4, -6);
  ctx.lineTo(2, -16);
  ctx.lineTo(10, -5);
  ctx.fill();
  seal(ctx);
  ctx.fillStyle = enemy.mode === 2 ? '#ffe14a' : '#fff6ea';
  ctx.beginPath();
  ctx.arc(8, -2, 2.3, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#1a0c10';
  ctx.beginPath();
  ctx.arc(8.8, -2, 1.05, 0, Math.PI * 2);
  ctx.fill();
}

function drawWisp(ctx, enemy, time) {
  ctx.globalAlpha = enemy.ghost ? 0.4 : 1;
  const hot = enemy.hit > 0;
  ctx.fillStyle = hot ? PALETTE.lanternCore : '#14d8c8';
  ctx.beginPath();
  ctx.arc(0, 0, 12, 0, Math.PI * 2);
  ctx.fill();
  seal(ctx);
  const bob = Math.sin(time * 3 + enemy.seed * 6);
  ctx.fillStyle = hot ? '#fff' : '#f4fffd';
  ctx.beginPath();
  ctx.arc(bob * 2, -bob, 4.6, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#06343a';
  ctx.beginPath();
  ctx.arc(bob * 2 + 1.3, -bob, 1.7, 0, Math.PI * 2);
  ctx.fill();
  ctx.globalAlpha = 1;
}

function drawBrute(ctx, enemy) {
  const hot = enemy.hit > 0;
  ctx.fillStyle = hot ? PALETTE.lanternCore : '#e8922e';
  ctx.beginPath();
  ctx.arc(-1, 0, 16, 0, Math.PI * 2);
  ctx.fill();
  seal(ctx);
  ctx.fillStyle = hot ? PALETTE.lanternCore : '#ffd18a';
  ctx.beginPath();
  ctx.arc(-2, 2, 8, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = hot ? PALETTE.lanternCore : '#fff0d0';
  ctx.beginPath();
  ctx.moveTo(8, -6);
  ctx.lineTo(21, -15);
  ctx.lineTo(10, -1);
  ctx.moveTo(6, 5);
  ctx.lineTo(19, 14);
  ctx.lineTo(8, 2);
  ctx.fill();
  seal(ctx);
  ctx.fillStyle = '#1a1008';
  ctx.fillRect(3, -4, 4.2, 2.5);
  ctx.fillRect(3, 2.2, 4.2, 2.5);
}

function drawHexer(ctx, enemy, time) {
  const hot = enemy.hit > 0;
  ctx.fillStyle = hot ? PALETTE.lanternCore : '#7438ee';
  ctx.beginPath();
  ctx.moveTo(0, -17);
  ctx.lineTo(12, 14);
  ctx.lineTo(-12, 14);
  ctx.closePath();
  ctx.fill();
  seal(ctx);
  ctx.fillStyle = hot ? '#fff' : '#d4b4ff';
  ctx.beginPath();
  ctx.moveTo(0, -8);
  ctx.lineTo(5.5, 12);
  ctx.lineTo(-5.5, 12);
  ctx.closePath();
  ctx.fill();
  const rune = 7.2 + Math.sin(time * 4 + enemy.seed * 6) * 1.2;
  ctx.strokeStyle = '#ffe14a';
  ctx.lineWidth = 2.6;
  ctx.beginPath();
  ctx.arc(0, -2, rune, 0, Math.PI * 2);
  ctx.stroke();
  ctx.fillStyle = '#fff6c0';
  ctx.beginPath();
  ctx.arc(0, -2, 2.7, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = '#140c18';
  ctx.lineWidth = 1.6;
  ctx.stroke();
}
