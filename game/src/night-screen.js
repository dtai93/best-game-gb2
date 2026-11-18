/** Between nights: pick a gift, pick the next road, reroll, continue. */

import { FONT, NIGHTS, PALETTE, VIEW } from './config.js';
import { roadAhead, nodeInfo } from './route.js';
import { REROLL_COST } from './upgrades.js';
import { drawGiftMark, drawNodeMark, nodeInk } from './screen-icons.js';
import { card, grouped, inside, keyCap, panel, wrap } from './screen-kit.js';

const RARITY = {
  wick: 'COMMON', reservoir: 'RARE', siphon: 'COMMON', ward: 'RARE',
  glass: 'COMMON', fan: 'RARE', stones: 'COMMON', bell: 'EPIC',
  chain: 'RARE', cloak: 'COMMON', breath: 'RARE', halo: 'EPIC',
};

const RARITY_INK = { COMMON: '#f0d4b0', RARE: '#7af6ff', EPIC: '#d09cff' };

const REROLL = { x: 16, y: 636, w: 300, h: 68 };
const CONTINUE = { x: 860, y: 636, w: 404, h: 68 };

function giftRects() {
  const y = 118;
  const h = 268;
  const gap = 12;
  const w = Math.floor((VIEW.width - 32 - gap * 2) / 3);
  return [0, 1, 2].map((i) => ({ x: 16 + i * (w + gap), y, w, h }));
}

function roadColumns(state) {
  const rows = roadAhead(state.route);
  const y = 412;
  const h = 208;
  const gap = 10;
  const count = Math.max(1, rows.length);
  const w = Math.floor((VIEW.width - 32 - gap * (count - 1)) / count);
  return rows.map((row, i) => ({ row, x: 16 + i * (w + gap), y, w, h }));
}

function forkButtons(col) {
  const pad = 10;
  const gap = 8;
  const bw = col.w - pad * 2;
  const bh = (col.h - 44 - gap) / 2;
  return [
    { x: col.x + pad, y: col.y + 36, w: bw, h: bh, index: 0 },
    { x: col.x + pad, y: col.y + 36 + bh + gap, w: bw, h: bh, index: 1 },
  ];
}

export function nightHit(x, y, state) {
  const gifts = giftRects();
  for (let i = 0; i < gifts.length; i += 1) {
    if (inside(x, y, gifts[i])) return { kind: 'gift', index: i };
  }
  const cols = roadColumns(state || {});
  for (let i = 0; i < cols.length; i += 1) {
    const col = cols[i];
    if (!col.row.current || !col.row.options) continue;
    const buttons = forkButtons(col);
    for (let b = 0; b < buttons.length; b += 1) {
      if (inside(x, y, buttons[b])) return { kind: 'road', index: b };
    }
  }
  if (inside(x, y, REROLL)) return { kind: 'reroll' };
  if (inside(x, y, CONTINUE)) return { kind: 'continue' };
  return null;
}

export function drawNightScreen(ctx, state) {
  drawBanner(ctx, state);
  ctx.textAlign = 'left';
  ctx.textBaseline = 'middle';
  ctx.font = `800 22px ${FONT}`;
  ctx.fillStyle = PALETTE.lantern;
  ctx.fillText('1  —  PICK A GIFT', 20, 104);
  const offer = (state.loadout && state.loadout.offer) || [];
  const rects = giftRects();
  const hover = state.loadout ? state.loadout.hover : 0;
  for (let i = 0; i < rects.length; i += 1) drawGift(ctx, rects[i], offer[i], i, hover === i, state);
  ctx.font = `800 22px ${FONT}`;
  ctx.fillStyle = PALETTE.dawn;
  ctx.textAlign = 'left';
  ctx.fillText('2  —  PICK YOUR ROAD', 20, 400);
  drawRoad(ctx, state);
  drawFooter(ctx, state);
}

function drawBanner(ctx, state) {
  panel(ctx, 16, 12, VIEW.width - 32, 72);
  ctx.textBaseline = 'middle';
  ctx.textAlign = 'left';
  ctx.font = `800 32px ${FONT}`;
  ctx.fillStyle = PALETTE.dawn;
  ctx.fillText(`NIGHT ${state.night}/${NIGHTS} CLEARED`, 32, 48);
  const bits = [
    ['SCORE', grouped(state.score), PALETTE.text],
    ['BEST', grouped(state.best), PALETTE.lantern],
    ['EMBERS', grouped(state.embers), PALETTE.ember],
    ['OIL', `${Math.round((state.oil || 0) * 100)}%`, PALETTE.teal],
  ];
  ctx.textAlign = 'right';
  let cursor = VIEW.width - 32;
  for (let i = bits.length - 1; i >= 0; i -= 1) {
    ctx.font = `800 22px ${FONT}`;
    ctx.fillStyle = bits[i][2];
    ctx.fillText(bits[i][1], cursor, 48);
    const valueW = ctx.measureText(bits[i][1]).width;
    ctx.font = `800 14px ${FONT}`;
    ctx.fillStyle = PALETTE.muted;
    ctx.fillText(bits[i][0], cursor - valueW - 8, 30);
    cursor -= valueW + 78;
  }
}

function drawGift(ctx, rect, gift, index, hot, state) {
  card(ctx, rect.x, rect.y, rect.w, rect.h, hot);
  ctx.textAlign = 'left';
  ctx.textBaseline = 'middle';
  ctx.font = `800 16px ${FONT}`;
  ctx.fillStyle = '#1c120c';
  const rarity = gift ? (RARITY[gift.id] || 'RARE') : 'RARE';
  const tagW = 92;
  roundTag(ctx, rect.x + 14, rect.y + 14, tagW, 26, RARITY_INK[rarity] || PALETTE.ash);
  ctx.fillStyle = '#1c120c';
  ctx.textAlign = 'center';
  ctx.fillText(rarity, rect.x + 14 + tagW / 2, rect.y + 28);
  ctx.textAlign = 'right';
  ctx.font = `800 20px ${FONT}`;
  ctx.fillStyle = PALETTE.lantern;
  ctx.fillText(String(index + 1), rect.x + rect.w - 18, rect.y + 28);
  if (!gift) return;
  drawGiftMark(ctx, gift.id, rect.x + rect.w / 2, rect.y + 86, 32);
  ctx.textAlign = 'center';
  ctx.font = `800 26px ${FONT}`;
  ctx.fillStyle = PALETTE.text;
  ctx.fillText(gift.name, rect.x + rect.w / 2, rect.y + 142);
  ctx.font = `700 18px ${FONT}`;
  ctx.fillStyle = '#ffe6c4';
  wrap(ctx, gift.line, rect.x + rect.w / 2, rect.y + 176, rect.w - 36, 22, 2);
  const rank = (state.loadout.ranks && state.loadout.ranks[gift.id]) || 0;
  ctx.font = `800 18px ${FONT}`;
  ctx.fillStyle = hot ? PALETTE.lantern : PALETTE.dawn;
  const label = hot ? 'SELECTED' : (rank > 0 ? `RANK ${rank}/${gift.max}` : 'NEW GIFT');
  ctx.fillText(label, rect.x + rect.w / 2, rect.y + rect.h - 28);
  drawPips(ctx, rect.x + rect.w / 2, rect.y + rect.h - 52, rank, gift.max || 1);
}

function drawPips(ctx, cx, y, rank, max) {
  const gap = 14;
  const start = cx - ((max - 1) * gap) / 2;
  for (let i = 0; i < max; i += 1) {
    ctx.beginPath();
    ctx.arc(start + i * gap, y, 5, 0, Math.PI * 2);
    ctx.fillStyle = i < rank ? PALETTE.lantern : 'rgba(255, 236, 210, 0.16)';
    ctx.fill();
    ctx.lineWidth = 1.5;
    ctx.strokeStyle = i < rank ? '#fff6c4' : 'rgba(255, 206, 140, 0.7)';
    ctx.stroke();
  }
}

function drawRoad(ctx, state) {
  const cols = roadColumns(state);
  if (!cols.length) {
    panel(ctx, 16, 412, VIEW.width - 32, 208);
    ctx.textAlign = 'center';
    ctx.font = `800 28px ${FONT}`;
    ctx.fillStyle = PALETTE.violet;
    ctx.fillText('THE UNLIT CROWN IS NEXT', VIEW.width / 2, 516);
    return;
  }
  const side = state.roadSide ? 1 : 0;
  for (let i = 0; i < cols.length; i += 1) drawColumn(ctx, cols[i], side);
}

function drawColumn(ctx, col, side) {
  const row = col.row;
  card(ctx, col.x, col.y, col.w, col.h, row.current);
  ctx.textAlign = 'left';
  ctx.textBaseline = 'middle';
  ctx.font = `800 18px ${FONT}`;
  ctx.fillStyle = row.current ? PALETTE.lantern : PALETTE.muted;
  ctx.fillText(row.current ? `NIGHT ${row.night}  PICK` : `NIGHT ${row.night}`, col.x + 12, col.y + 20);
  if (row.options) {
    const buttons = forkButtons(col);
    for (let i = 0; i < buttons.length; i += 1) {
      drawOption(ctx, buttons[i], row.options[i], row.current && side === i);
    }
    return;
  }
  drawOption(ctx, {
    x: col.x + 10,
    y: col.y + 40,
    w: col.w - 20,
    h: col.h - 52,
  }, row.type, false);
}

function drawOption(ctx, rect, type, hot) {
  const info = nodeInfo(type);
  card(ctx, rect.x, rect.y, rect.w, rect.h, hot);
  drawNodeMark(ctx, type, rect.x + 28, rect.y + rect.h / 2, 16);
  ctx.textAlign = 'left';
  ctx.textBaseline = 'middle';
  const lines = nodeLines(type);
  const nameY = rect.y + rect.h / 2 - (lines.length > 1 ? 16 : 12);
  ctx.font = `800 18px ${FONT}`;
  ctx.fillStyle = nodeInk(type);
  ctx.fillText((info.name || type || '').toUpperCase(), rect.x + 52, nameY);
  ctx.font = `700 13px ${FONT}`;
  ctx.fillStyle = PALETTE.text;
  for (let i = 0; i < lines.length; i += 1) {
    ctx.fillText(lines[i], rect.x + 52, nameY + 16 + i * 14);
  }
}

function nodeLines(type) {
  const info = nodeInfo(type);
  if (type === 'boss') return ['THE CROWN'];
  const pace = [];
  if (info.count <= 0) pace.push('QUIET');
  else if (info.count > 1) pace.push('MORE');
  else if (info.count < 1) pace.push('FEWER');
  if (info.speed > 1) pace.push('FASTER');
  else if (info.speed < 1) pace.push('SLOWER');
  const pay = [];
  if (info.oil) pay.push(`+${Math.round(info.oil * 100)}% OIL`);
  if (info.embers) pay.push(`+${info.embers}`);
  const lines = [];
  if (pace.length) lines.push(pace.join(' '));
  if (pay.length) lines.push(pay.join(' '));
  return lines.length ? lines : ['FULL NIGHT'];
}

function drawFooter(ctx, state) {
  const canPay = (state.embers || 0) >= REROLL_COST;
  card(ctx, REROLL.x, REROLL.y, REROLL.w, REROLL.h, false);
  ctx.globalAlpha = canPay ? 1 : 0.45;
  keyCap(ctx, REROLL.x + 16, REROLL.y + 18, 'B', 32);
  ctx.globalAlpha = 1;
  ctx.textAlign = 'left';
  ctx.textBaseline = 'middle';
  ctx.font = `800 22px ${FONT}`;
  ctx.fillStyle = canPay ? PALETTE.ember : PALETTE.muted;
  ctx.fillText(`REROLL ${REROLL_COST}`, REROLL.x + 64, REROLL.y + 34);
  ctx.textAlign = 'center';
  ctx.font = `800 22px ${FONT}`;
  ctx.fillStyle = PALETTE.ember;
  ctx.fillText(`${grouped(state.embers)} EMBERS`, (REROLL.x + REROLL.w + CONTINUE.x) / 2, REROLL.y + 34);
  card(ctx, CONTINUE.x, CONTINUE.y, CONTINUE.w, CONTINUE.h, true);
  keyCap(ctx, CONTINUE.x + 18, CONTINUE.y + 18, 'ENTER', 32);
  ctx.textAlign = 'left';
  ctx.font = `800 28px ${FONT}`;
  ctx.fillStyle = '#fff6c4';
  ctx.fillText('CONTINUE', CONTINUE.x + 110, CONTINUE.y + 35);
}

function roundTag(ctx, x, y, w, h, fill) {
  ctx.beginPath();
  const r = 8;
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
  ctx.fillStyle = fill;
  ctx.fill();
}
