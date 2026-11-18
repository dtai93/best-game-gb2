/** Boss ring and name, enemy tags, snare rings, impact glows, and the incoming strip. */

import { FIGHT_ZOOM } from './camera.js';
import { ARENA, BOSS, FONT, PALETTE, VIEW } from './config.js';

const NAMES = { moth: 'MOTH', hound: 'HOUND', wisp: 'WISPLET', brute: 'BRUTE', hexer: 'HEXER' };
const INK = {
  moth: '#f0d4ff',
  hound: '#ffc4c6',
  wisp: '#b8fff4',
  brute: '#ffe0b4',
  hexer: '#e4d2ff',
};

export function drawBursts(ctx, state) {
  const list = state.bursts;
  if (!list) return;
  for (let i = 0; i < list.length; i += 1) {
    const burst = list[i];
    const glow = ctx.createRadialGradient(burst.x, burst.y, 4, burst.x, burst.y, burst.r);
    glow.addColorStop(0, 'rgba(255, 250, 220, 0.92)');
    glow.addColorStop(0.28, `rgba(${burst.color}, 0.55)`);
    glow.addColorStop(1, `rgba(${burst.color}, 0)`);
    ctx.fillStyle = glow;
    ctx.beginPath();
    ctx.arc(burst.x, burst.y, burst.r, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = 'rgba(255, 246, 210, 0.95)';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.arc(burst.x, burst.y, burst.r * 0.42, 0, Math.PI * 2);
    ctx.stroke();
    ctx.globalAlpha = 0.75;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(burst.x, burst.y, burst.r * 0.72, 0, Math.PI * 2);
    ctx.stroke();
    ctx.globalAlpha = 1;
  }
}

export function drawBossMark(ctx, boss) {
  if (!boss || !boss.active || !(boss.maxHp > 0)) return;
  const ratio = Math.max(0, Math.min(1, boss.hp / boss.maxHp));
  const ring = (boss.radius || 32) + 22;
  ctx.save();
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.arc(boss.x, boss.y, ring, 0, Math.PI * 2);
  ctx.strokeStyle = 'rgba(12, 6, 16, 0.88)';
  ctx.lineWidth = 10;
  ctx.stroke();
  ctx.beginPath();
  ctx.arc(boss.x, boss.y, ring, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * ratio);
  ctx.strokeStyle = ratio < 0.34 ? PALETTE.danger : '#e2c6ff';
  ctx.lineWidth = 7;
  ctx.stroke();
  const name = BOSS.name.toUpperCase();
  ctx.font = `800 16px ${FONT}`;
  const width = ctx.measureText(name).width + 20;
  const left = boss.x + ring + 18;
  const top = boss.y - ring - 2;
  plate(ctx, left, top, width, 24, 8, 'rgba(32, 14, 40, 0.9)', '#d8b4ff');
  ctx.fillStyle = '#f6f0ff';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(name, left + width / 2, top + 13);
  ctx.restore();
}

export function drawEnemyMarks(ctx, state) {
  if (state.screen !== 'play' && state.screen !== 'paused') return;
  const list = state.enemies || [];
  for (let i = 0; i < list.length; i += 1) {
    if (list[i].alive && list[i].snare) drawSnare(ctx, list[i]);
  }
  const tagged = pickTags(list);
  ctx.save();
  ctx.font = `800 13px ${FONT}`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  for (let i = 0; i < tagged.length; i += 1) {
    const enemy = tagged[i];
    const name = enemy.label || NAMES[enemy.type] || 'SHADE';
    const tx = enemy.x;
    const ty = enemy.y - enemy.radius - 16;
    if (!blocked(tx, ty)) tag(ctx, tx, ty, name, INK[enemy.type] || '#fff');
  }
  const keeper = state.player;
  if (keeper) {
    const tx = keeper.x;
    const ty = keeper.y + (keeper.radius || 14) + 18;
    if (!blocked(tx, ty)) tag(ctx, tx, ty, 'YOU', '#ffe14a');
  }
  ctx.restore();
}

export function drawIncoming(ctx, state) {
  if (state.screen !== 'play' && state.screen !== 'paused') return;
  const counts = tally(state.enemies);
  const rows = [];
  if (counts.moth) rows.push(['MOTH', counts.moth, INK.moth]);
  if (counts.hound) rows.push(['HOUND', counts.hound, INK.hound]);
  if (counts.wisp) rows.push(['WISP', counts.wisp, INK.wisp]);
  if (counts.brute) rows.push(['BRUTE', counts.brute, INK.brute]);
  if (counts.hexer) rows.push(['HEXER', counts.hexer, INK.hexer]);
  if (rows.length === 0) return;
  ctx.save();
  ctx.font = `800 15px ${FONT}`;
  ctx.textBaseline = 'middle';
  ctx.textAlign = 'left';
  const title = 'INCOMING';
  let width = ctx.measureText(title).width + 28;
  const bits = [];
  for (let i = 0; i < rows.length; i += 1) {
    const text = `${rows[i][0]} ${rows[i][1]}`;
    bits.push(text);
    width += ctx.measureText(text).width + 16;
  }
  const x = (VIEW.width - width) / 2;
  const y = 114;
  plate(ctx, x, y, width, 34, 10, 'rgba(28, 12, 16, 0.84)', '#ffb15a');
  let cursor = x + 14;
  ctx.fillStyle = '#ffb01a';
  ctx.fillText(title, cursor, y + 18);
  cursor += ctx.measureText(title).width + 16;
  for (let i = 0; i < rows.length; i += 1) {
    ctx.fillStyle = rows[i][2];
    ctx.fillText(bits[i], cursor, y + 18);
    cursor += ctx.measureText(bits[i]).width + 16;
  }
  ctx.restore();
}

function blocked(x, y) {
  const vx = (x - ARENA.cx) * FIGHT_ZOOM + VIEW.width / 2;
  const vy = (y - ARENA.cy) * FIGHT_ZOOM + VIEW.height / 2;
  const zones = [
    [0, 0, 400, 214],
    [380, 0, 530, 156],
    [VIEW.width - 400, 0, 400, 214],
    [0, 198, 324, 280],
    [VIEW.width - 348, 198, 348, 176],
    [0, VIEW.height - 78, VIEW.width, 78],
    [420, 145, 460, 125],
  ];
  for (let i = 0; i < zones.length; i += 1) {
    const zone = zones[i];
    if (vx >= zone[0] && vx <= zone[0] + zone[2] && vy >= zone[1] && vy <= zone[1] + zone[3]) return true;
  }
  return false;
}

function drawSnare(ctx, enemy) {
  ctx.save();
  ctx.strokeStyle = enemy.snare;
  ctx.lineWidth = 3;
  ctx.setLineDash([6, 4]);
  ctx.beginPath();
  ctx.arc(enemy.x, enemy.y, enemy.radius + 13, 0, Math.PI * 2);
  ctx.stroke();
  ctx.setLineDash([]);
  ctx.globalAlpha = 0.22;
  ctx.fillStyle = enemy.snare;
  ctx.beginPath();
  ctx.arc(enemy.x, enemy.y, enemy.radius + 10, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

function pickTags(list) {
  const alive = [];
  for (let i = 0; i < list.length; i += 1) if (list[i].alive) alive.push(list[i]);
  const first = [];
  const rest = [];
  for (let i = 0; i < alive.length; i += 1) {
    if (alive[i].snare) first.push(alive[i]);
    else rest.push(alive[i]);
  }
  const buckets = { wisp: [], hound: [], brute: [], hexer: [], moth: [] };
  for (let i = 0; i < rest.length; i += 1) {
    const pile = buckets[rest[i].type] || buckets.moth;
    pile.push(rest[i]);
  }
  const order = ['wisp', 'hound', 'brute', 'hexer', 'moth'];
  let pending = true;
  while (pending) {
    pending = false;
    for (let i = 0; i < order.length; i += 1) {
      const pile = buckets[order[i]];
      if (pile.length) {
        first.push(pile.pop());
        pending = true;
      }
    }
  }
  const kept = [];
  for (let i = 0; i < first.length && kept.length < 11; i += 1) {
    const enemy = first[i];
    let crowded = false;
    for (let k = 0; k < kept.length; k += 1) {
      const dx = kept[k].x - enemy.x;
      const dy = kept[k].y - enemy.y;
      if (dx * dx + dy * dy < 64 * 64) crowded = true;
    }
    if (!crowded) kept.push(enemy);
  }
  return kept;
}

function tally(list) {
  const counts = { moth: 0, hound: 0, wisp: 0, brute: 0, hexer: 0 };
  if (!list) return counts;
  for (let i = 0; i < list.length; i += 1) {
    const enemy = list[i];
    if (enemy.alive && counts[enemy.type] !== undefined) counts[enemy.type] += 1;
  }
  return counts;
}

function tag(ctx, x, y, text, ink) {
  const width = ctx.measureText(text).width + 12;
  plate(ctx, x - width / 2, y - 9, width, 18, 5, 'rgba(16, 8, 12, 0.82)', ink);
  ctx.lineWidth = 3;
  ctx.strokeStyle = '#140c08';
  ctx.strokeText(text, x, y + 1);
  ctx.fillStyle = ink;
  ctx.fillText(text, x, y);
}

function plate(ctx, x, y, w, h, r, fill, stroke) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
  ctx.fillStyle = fill;
  ctx.fill();
  ctx.lineWidth = 2;
  ctx.strokeStyle = stroke;
  ctx.stroke();
}
