/** Title: crest, how a run works, difficulty, workshop, records, controls, and play. */

import { FONT, PALETTE, VIEW } from './config.js';
import { drawTitleEmblem } from './emblem.js';
import { DIFFICULTIES, UNLOCKS } from './meta.js';
import { card, grouped, inside, keyCap, panel } from './screen-kit.js';

const PLAY = { x: 1028, y: 16, w: 236, h: 70 };
const EMBLEM = { cx: 128, cy: 126, r: 108 };
const HOW = { x: 252, y: 96, w: 360, h: 148 };
const WORK = { y: 256, h: 216 };
const LOWER = { y: 484, h: 224 };

function diffRects() {
  const w = 204;
  const h = HOW.h;
  const gap = 12;
  const x0 = 624;
  return DIFFICULTIES.map((diff, i) => ({ id: diff.id, x: x0 + i * (w + gap), y: HOW.y, w, h }));
}

function unlockRects() {
  const w = 298;
  const h = 70;
  const gapX = 10;
  const gapY = 8;
  const x0 = 28;
  const y0 = 292;
  return UNLOCKS.map((_, i) => ({
    x: x0 + (i % 4) * (w + gapX),
    y: y0 + Math.floor(i / 4) * (h + gapY),
    w,
    h,
  }));
}

export function titleHit(x, y) {
  if (inside(x, y, PLAY)) return { kind: 'play' };
  const diffs = diffRects();
  for (let i = 0; i < diffs.length; i += 1) {
    if (inside(x, y, diffs[i])) return { kind: 'diff', id: diffs[i].id };
  }
  const slots = unlockRects();
  for (let i = 0; i < slots.length; i += 1) {
    if (inside(x, y, slots[i])) return { kind: 'unlock', index: i };
  }
  return null;
}

export function drawTitleScreen(ctx, state) {
  const profile = state.profile || { embers: 0, unlocks: {}, records: [], difficulty: 'journeyman' };
  drawTitleEmblem(ctx, EMBLEM.cx, EMBLEM.cy, EMBLEM.r, state.time || 0);
  drawLogo(ctx, state);
  drawHow(ctx);
  drawDifficulties(ctx, profile);
  drawWorkshop(ctx, profile);
  drawRecords(ctx, profile, state);
  drawControlCard(ctx);
}

function drawLogo(ctx, state) {
  ctx.textAlign = 'left';
  ctx.textBaseline = 'middle';
  ctx.fillStyle = PALETTE.text;
  ctx.font = `800 48px ${FONT}`;
  ctx.fillText('ASHWELL', 256, 38);
  ctx.fillStyle = PALETTE.lantern;
  ctx.font = `700 18px ${FONT}`;
  ctx.fillText('LANTERN OF THE LAST WELL', 258, 70);
  const pulse = 0.85 + 0.15 * Math.sin((state.time || 0) * 3);
  ctx.globalAlpha = pulse;
  card(ctx, PLAY.x, PLAY.y, PLAY.w, PLAY.h, true);
  ctx.globalAlpha = 1;
  ctx.textAlign = 'center';
  ctx.font = `800 36px ${FONT}`;
  ctx.fillStyle = '#fff6c4';
  ctx.fillText('PLAY', PLAY.x + PLAY.w / 2, PLAY.y + 38);
}

function drawHow(ctx) {
  panel(ctx, HOW.x, HOW.y, HOW.w, HOW.h);
  ctx.textAlign = 'left';
  ctx.textBaseline = 'middle';
  ctx.font = `800 16px ${FONT}`;
  ctx.fillStyle = PALETTE.lantern;
  ctx.fillText('HOW A RUN WORKS', HOW.x + 14, HOW.y + 22);
  const rows = [
    ['GOAL', 'Guard the well for 8 nights'],
    ['WIN', 'Dawn, when the Crown breaks'],
    ['LOSE', 'The lantern oil hits zero'],
    ['TIP', 'Take a gift, then pick a road'],
  ];
  for (let i = 0; i < rows.length; i += 1) {
    const y = HOW.y + 48 + i * 24;
    ctx.font = `800 14px ${FONT}`;
    ctx.fillStyle = PALETTE.ember;
    ctx.fillText(rows[i][0], HOW.x + 14, y);
    ctx.font = `700 14px ${FONT}`;
    ctx.fillStyle = PALETTE.text;
    ctx.fillText(rows[i][1], HOW.x + 68, y);
  }
}

function drawDifficulties(ctx, profile) {
  const rects = diffRects();
  for (let i = 0; i < rects.length; i += 1) {
    const rect = rects[i];
    const diff = DIFFICULTIES[i];
    const on = profile.difficulty === diff.id;
    card(ctx, rect.x, rect.y, rect.w, rect.h, on);
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
    ctx.font = `800 20px ${FONT}`;
    ctx.fillStyle = on ? PALETTE.lantern : PALETTE.text;
    ctx.fillText(diff.name, rect.x + 12, rect.y + 26);
    ctx.font = `800 13px ${FONT}`;
    ctx.fillStyle = on ? '#1c120c' : PALETTE.muted;
    const tag = on ? 'SELECTED' : 'A / D';
    ctx.fillText(tag, rect.x + 12, rect.y + 46);
    const lines = diffLines(diff);
    ctx.font = `700 15px ${FONT}`;
    ctx.fillStyle = PALETTE.text;
    for (let line = 0; line < lines.length; line += 1) {
      ctx.fillText(lines[line], rect.x + 12, rect.y + 70 + line * 18);
    }
  }
}

function diffLines(diff) {
  const shades = diff.count < 1 ? 'FEWER SHADES' : diff.count > 1 ? 'MORE SHADES' : 'FULL NIGHTS';
  const pace = diff.speed < 1 ? 'SLOWER PACE' : diff.speed > 1 ? 'FASTER PACE' : 'EVEN PACE';
  return [shades, pace, `OIL ${Math.round(diff.oil * 100)}%`, `BURN ×${diff.burn.toFixed(2)}`];
}

function drawWorkshop(ctx, profile) {
  panel(ctx, 16, WORK.y, VIEW.width - 32, WORK.h);
  const owned = ownedCount(profile);
  ctx.textAlign = 'left';
  ctx.textBaseline = 'middle';
  ctx.font = `800 20px ${FONT}`;
  ctx.fillStyle = PALETTE.lantern;
  ctx.fillText(`WORKSHOP — ${owned}/${UNLOCKS.length} PERMANENT UNLOCKS`, 32, WORK.y + 22);
  ctx.textAlign = 'right';
  ctx.fillStyle = PALETTE.ember;
  ctx.fillText(`${grouped(profile.embers)} EMBERS`, VIEW.width - 32, WORK.y + 22);
  const slots = unlockRects();
  for (let i = 0; i < slots.length; i += 1) {
    const rect = slots[i];
    const item = UNLOCKS[i];
    const have = !!(profile.unlocks && profile.unlocks[item.id]);
    card(ctx, rect.x, rect.y, rect.w, rect.h, have);
    ctx.textAlign = 'left';
    ctx.font = `800 16px ${FONT}`;
    ctx.fillStyle = PALETTE.lantern;
    ctx.fillText(String(i + 1), rect.x + 14, rect.y + 26);
    ctx.font = `800 20px ${FONT}`;
    ctx.fillStyle = PALETTE.text;
    ctx.fillText(item.name, rect.x + 36, rect.y + 26);
    ctx.font = `800 18px ${FONT}`;
    ctx.fillStyle = have ? PALETTE.teal : PALETTE.ember;
    ctx.fillText(have ? 'OWNED' : `${item.cost} EMBERS`, rect.x + 14, rect.y + 52);
  }
}

function drawRecords(ctx, profile, state) {
  panel(ctx, 16, LOWER.y, 860, LOWER.h);
  ctx.textAlign = 'left';
  ctx.textBaseline = 'middle';
  ctx.font = `800 20px ${FONT}`;
  ctx.fillStyle = PALETTE.dawn;
  ctx.fillText('BEST RUNS', 32, LOWER.y + 24);
  ctx.fillStyle = PALETTE.teal;
  ctx.fillText(`FEATS ${featCount(profile)}/8`, 220, LOWER.y + 24);
  ctx.textAlign = 'right';
  ctx.fillStyle = PALETTE.lantern;
  ctx.fillText(`BEST ${grouped(state.best)}`, 856, LOWER.y + 24);
  const rows = (profile.records || []).slice(0, 5);
  ctx.font = `800 16px ${FONT}`;
  ctx.textAlign = 'left';
  ctx.fillStyle = PALETTE.muted;
  const headY = LOWER.y + 52;
  ctx.fillText('GRADE', 32, headY);
  ctx.fillText('SCORE', 130, headY);
  ctx.fillText('NIGHT', 280, headY);
  ctx.fillText('CHAIN', 390, headY);
  ctx.fillText('OIL', 500, headY);
  ctx.fillText('DIFFICULTY', 600, headY);
  ctx.font = `700 18px ${FONT}`;
  if (!rows.length) {
    ctx.fillStyle = PALETTE.text;
    ctx.fillText('No finished runs yet.', 32, headY + 36);
    return;
  }
  for (let i = 0; i < rows.length; i += 1) {
    const row = rows[i];
    const y = LOWER.y + 80 + i * 26;
    ctx.fillStyle = PALETTE.lantern;
    ctx.fillText(row.grade || '—', 32, y);
    ctx.fillStyle = PALETTE.text;
    ctx.fillText(grouped(row.score), 130, y);
    ctx.fillText(String(row.night || 1), 280, y);
    ctx.fillText(`x${row.chain || 0}`, 390, y);
    ctx.fillText(`${row.oil || 0}%`, 500, y);
    ctx.fillText(String(row.difficulty || ''), 600, y);
  }
}

function drawControlCard(ctx) {
  panel(ctx, 888, LOWER.y, 376, LOWER.h);
  ctx.textAlign = 'left';
  ctx.textBaseline = 'middle';
  ctx.font = `800 20px ${FONT}`;
  ctx.fillStyle = PALETTE.lantern;
  ctx.fillText('CONTROLS', 904, LOWER.y + 24);
  const rows = [
    ['WASD', 'MOVE'],
    ['LMB', 'FIRE'],
    ['SHIFT', 'DASH'],
    ['F', 'PULSE'],
    ['1-8', 'WORKSHOP'],
    ['ENTER', 'PLAY'],
  ];
  for (let i = 0; i < rows.length; i += 1) {
    const col = i < 3 ? 0 : 1;
    const row = i % 3;
    const x = 904 + col * 180;
    const y = LOWER.y + 58 + row * 52;
    const w = keyCap(ctx, x, y, rows[i][0], 32);
    ctx.font = `800 16px ${FONT}`;
    ctx.fillStyle = PALETTE.text;
    ctx.textAlign = 'left';
    ctx.fillText(rows[i][1], x + w + 8, y + 16);
  }
}

function ownedCount(profile) {
  let count = 0;
  const owned = profile.unlocks || {};
  for (let i = 0; i < UNLOCKS.length; i += 1) if (owned[UNLOCKS[i].id]) count += 1;
  return count;
}

function featCount(profile) {
  const feats = profile.feats || {};
  let count = 0;
  for (const key in feats) if (feats[key]) count += 1;
  return count;
}
