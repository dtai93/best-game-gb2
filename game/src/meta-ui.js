/** Title workshop and the between-nights road pick. */

import { FONT, PALETTE, VIEW } from './config.js';
import { DIFFICULTIES, UNLOCKS } from './meta.js';

const DECK_Y = 300;

export function titleHit(x, y) {
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

export function roadIndexAt(x, y) {
  const cards = roadRects();
  for (let i = 0; i < cards.length; i += 1) {
    if (inside(x, y, cards[i])) return i;
  }
  return -1;
}

export function drawTitleDeck(ctx, state) {
  const profile = state.profile || { embers: 0, unlocks: {}, records: [], feats: {}, difficulty: 'journeyman' };
  const cx = VIEW.width / 2;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'alphabetic';
  ctx.fillStyle = PALETTE.ash;
  ctx.font = `700 18px ${FONT}`;
  ctx.fillText('Guard the well. Pick a gift, then a road. Dawn if the lantern holds.', cx, DECK_Y);

  const diffs = diffRects();
  for (let i = 0; i < diffs.length; i += 1) {
    const rect = diffs[i];
    const diff = DIFFICULTIES[i];
    const on = profile.difficulty === diff.id;
    box(ctx, rect, 12, on ? 'rgba(92, 58, 18, 0.92)' : 'rgba(20, 16, 28, 0.78)', on ? PALETTE.lantern : 'rgba(255, 214, 160, 0.45)', on ? 3 : 1.5);
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
    ctx.font = `800 20px ${FONT}`;
    ctx.fillStyle = on ? PALETTE.lantern : PALETTE.text;
    ctx.fillText(diff.name, rect.x + 16, rect.y + 24);
    ctx.font = `600 14px ${FONT}`;
    ctx.fillStyle = PALETTE.muted;
    ctx.fillText(diff.line, rect.x + 16, rect.y + 48);
  }

  ctx.textBaseline = 'alphabetic';
  ctx.font = `800 14px ${FONT}`;
  ctx.fillStyle = PALETTE.ember;
  ctx.textAlign = 'left';
  ctx.fillText(`WORKSHOP  ${ownedCount(profile)}/${UNLOCKS.length} PERMANENT`, 48, DECK_Y + 140);
  ctx.textAlign = 'right';
  ctx.fillText(`${profile.embers || 0} EMBERS`, VIEW.width - 48, DECK_Y + 140);

  const slots = unlockRects();
  for (let i = 0; i < slots.length; i += 1) {
    const rect = slots[i];
    const card = UNLOCKS[i];
    const have = !!(profile.unlocks && profile.unlocks[card.id]);
    box(ctx, rect, 10, have ? 'rgba(28, 64, 58, 0.9)' : 'rgba(20, 16, 28, 0.78)', have ? PALETTE.teal : 'rgba(255, 214, 160, 0.4)', 1.5);
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
    ctx.font = `800 13px ${FONT}`;
    ctx.fillStyle = PALETTE.lantern;
    ctx.fillText(String(i + 1), rect.x + 8, rect.y + 16);
    ctx.fillStyle = PALETTE.text;
    ctx.fillText(card.name, rect.x + 24, rect.y + 16);
    ctx.font = `600 12px ${FONT}`;
    ctx.fillStyle = have ? PALETTE.teal : PALETTE.ember;
    ctx.fillText(have ? 'OWNED' : `${card.cost} embers`, rect.x + 8, rect.y + 36);
  }

  const best = (profile.records || [])[0];
  ctx.textBaseline = 'alphabetic';
  ctx.textAlign = 'left';
  ctx.font = `700 16px ${FONT}`;
  ctx.fillStyle = PALETTE.dawn;
  const recordLine = best
    ? `BEST RUN  ${best.grade || ''}  ${best.score}   night ${best.night}   ${best.difficulty}`
    : 'BEST RUN  none yet';
  ctx.fillText(recordLine, 48, DECK_Y + 252);
  ctx.textAlign = 'right';
  ctx.fillStyle = PALETTE.teal;
  ctx.fillText(`FEATS ${discovered(profile)}/8`, VIEW.width - 48, DECK_Y + 252);

  ctx.textAlign = 'center';
  ctx.fillStyle = PALETTE.muted;
  ctx.font = `600 15px ${FONT}`;
  ctx.fillText('A D difficulty     1–8 buy unlocks     Enter, Space, or click to play', cx, DECK_Y + 286);
  ctx.globalAlpha = 0.75 + 0.25 * Math.sin((state.time || 0) * 3);
  ctx.fillStyle = PALETTE.text;
  ctx.font = `800 24px ${FONT}`;
  ctx.fillText('PLAY', cx, DECK_Y + 322);
  ctx.globalAlpha = 1;
}

export function drawRoadPick(ctx, state) {
  const road = state.road;
  const cx = VIEW.width / 2;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'alphabetic';
  ctx.fillStyle = PALETTE.dawn;
  ctx.font = `800 32px ${FONT}`;
  ctx.fillText(`Night ${state.night} cleared`, cx, 84);
  ctx.fillStyle = PALETTE.text;
  ctx.font = `700 20px ${FONT}`;
  ctx.fillText('Pick the next road.', cx, 120);
  ctx.font = `700 16px ${FONT}`;
  ctx.fillStyle = PALETTE.muted;
  ctx.fillText(`Oil ${Math.round((state.oil || 0) * 100)}%    ·    ${state.embers || 0} embers`, cx, 148);
  const cards = roadRects();
  const sides = road ? [road.left, road.right] : [null, null];
  for (let i = 0; i < cards.length; i += 1) drawRoadCard(ctx, cards[i], sides[i], i, state.loadout.hover === i);
  ctx.fillStyle = PALETTE.text;
  ctx.font = `800 18px ${FONT}`;
  ctx.fillText('1 or 2    ·    click a road    ·    Enter confirms    ·    R title', cx, 668);
}

function drawRoadCard(ctx, rect, node, index, hot) {
  box(ctx, rect, 18, hot ? 'rgba(92, 58, 18, 0.94)' : 'rgba(28, 22, 36, 0.9)', hot ? PALETTE.lantern : '#f0c48a', hot ? 4 : 2);
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillStyle = PALETTE.lantern;
  ctx.font = `800 22px ${FONT}`;
  ctx.fillText(String(index + 1), rect.x + 36, rect.y + 36);
  if (!node) return;
  ctx.font = `800 18px ${FONT}`;
  ctx.fillStyle = inkFor(node.type);
  ctx.fillText(node.name.toUpperCase(), rect.x + rect.w / 2, rect.y + 92);
  ctx.fillStyle = PALETTE.text;
  ctx.font = `800 32px ${FONT}`;
  ctx.fillText(`Night ${node.night}`, rect.x + rect.w / 2, rect.y + 148);
  ctx.fillStyle = '#ffe6c4';
  ctx.font = `700 18px ${FONT}`;
  ctx.fillText(node.line || '', rect.x + rect.w / 2, rect.y + 210);
  ctx.font = `700 16px ${FONT}`;
  ctx.fillStyle = PALETTE.muted;
  ctx.fillText(effectLine(node), rect.x + rect.w / 2, rect.y + rect.h - 56);
  ctx.textBaseline = 'alphabetic';
}

function effectLine(node) {
  const bits = [];
  if (node.count > 1) bits.push('more shades');
  else if (node.count > 0 && node.count < 1) bits.push('fewer shades');
  else if (node.count <= 0) bits.push('no fight');
  if (node.speed > 1) bits.push('faster');
  else if (node.speed < 1) bits.push('slower');
  if (node.oil) bits.push(`+${Math.round(node.oil * 100)}% oil`);
  if (node.embers) bits.push(`+${node.embers} embers`);
  return bits.join('   ·   ') || 'A straight fight';
}

function diffRects() {
  const y = DECK_Y + 22;
  const w = 370;
  const h = 70;
  const gap = 16;
  const x0 = (VIEW.width - (w * 3 + gap * 2)) / 2;
  return DIFFICULTIES.map((diff, i) => ({ id: diff.id, x: x0 + i * (w + gap), y, w, h }));
}

function unlockRects() {
  const y = DECK_Y + 156;
  const gap = 10;
  const w = 144;
  const h = 52;
  const total = UNLOCKS.length * w + (UNLOCKS.length - 1) * gap;
  const x0 = (VIEW.width - total) / 2;
  return UNLOCKS.map((_, i) => ({ x: x0 + i * (w + gap), y, w, h }));
}

function roadRects() {
  return [
    { x: 148, y: 176, w: 444, h: 430 },
    { x: 688, y: 176, w: 444, h: 430 },
  ];
}

function inside(x, y, rect) {
  return x >= rect.x && x <= rect.x + rect.w && y >= rect.y && y <= rect.y + rect.h;
}

function ownedCount(profile) {
  let count = 0;
  const owned = profile.unlocks || {};
  for (let i = 0; i < UNLOCKS.length; i += 1) if (owned[UNLOCKS[i].id]) count += 1;
  return count;
}

function discovered(profile) {
  const feats = profile.feats || {};
  let count = 0;
  for (const key in feats) if (feats[key]) count += 1;
  return count;
}

function inkFor(type) {
  if (type === 'elite') return PALETTE.danger;
  if (type === 'cache') return PALETTE.ember;
  if (type === 'rest') return PALETTE.teal;
  if (type === 'boss') return PALETTE.violet;
  return PALETTE.lantern;
}

function box(ctx, rect, radius, fill, stroke, width) {
  const { x, y, w, h } = rect;
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.arcTo(x + w, y, x + w, y + h, radius);
  ctx.arcTo(x + w, y + h, x, y + h, radius);
  ctx.arcTo(x, y + h, x, y, radius);
  ctx.arcTo(x, y, x + w, y, radius);
  ctx.closePath();
  ctx.fillStyle = fill;
  ctx.fill();
  ctx.lineWidth = width;
  ctx.strokeStyle = stroke;
  ctx.stroke();
}
