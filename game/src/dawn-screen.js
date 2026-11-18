/** Dawn and dark: grade, stats, feats, gifts carried, last runs, restart. */

import { FONT, NIGHTS, PALETTE, VIEW } from './config.js';
import { FEATS, evaluateFeats, featTally } from './feats.js';
import { gradeRun } from './records.js';
import { UPGRADES } from './upgrades.js';
import { drawGiftMark } from './screen-icons.js';
import { card, grouped, inside, keyCap, panel, tickBox } from './screen-kit.js';

const AGAIN = { x: 16, y: 636, w: 624, h: 68 };
const TITLE_BTN = { x: 656, y: 636, w: 608, h: 68 };

export function dawnHit(x, y) {
  if (inside(x, y, AGAIN)) return { kind: 'again' };
  if (inside(x, y, TITLE_BTN)) return { kind: 'title' };
  return null;
}

export function drawDawnScreen(ctx, state) {
  const won = state.outcome === 'dawn';
  const grade = state.grade || gradeRun(state);
  const flags = state.feats || evaluateFeats(state);
  const tally = state.featTally || featTally(flags);
  drawGrade(ctx, state, won, grade);
  drawStats(ctx, state);
  drawFeats(ctx, flags, tally);
  drawGifts(ctx, state);
  drawRuns(ctx, state);
  drawButtons(ctx);
}

function drawGrade(ctx, state, won, grade) {
  panel(ctx, 16, 16, 300, 360);
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.font = `800 18px ${FONT}`;
  ctx.fillStyle = PALETTE.muted;
  ctx.fillText('GRADE', 166, 44);
  ctx.font = `800 148px ${FONT}`;
  ctx.fillStyle = gradeInk(grade);
  ctx.fillText(grade || '—', 166, 168);
  ctx.font = `800 28px ${FONT}`;
  ctx.fillStyle = won ? PALETTE.dawn : PALETTE.danger;
  ctx.fillText(won ? 'DAWN' : 'DARK', 166, 262);
  ctx.font = `800 32px ${FONT}`;
  ctx.fillStyle = PALETTE.text;
  ctx.fillText(grouped(state.score), 166, 308);
  ctx.font = `800 16px ${FONT}`;
  ctx.fillStyle = PALETTE.muted;
  ctx.fillText('FINAL SCORE', 166, 338);
  if (won && state.score >= state.best && state.score > 0) {
    ctx.font = `800 14px ${FONT}`;
    const tag = 'NEW BEST';
    const w = ctx.measureText(tag).width + 16;
    card(ctx, 166 - w / 2, 352, w, 22, true);
    ctx.fillStyle = '#1c120c';
    ctx.fillText(tag, 166, 364);
  }
}

function drawStats(ctx, state) {
  panel(ctx, 328, 16, 520, 360);
  ctx.textAlign = 'left';
  ctx.textBaseline = 'middle';
  ctx.font = `800 20px ${FONT}`;
  ctx.fillStyle = PALETTE.lantern;
  ctx.fillText('RUN STATS', 348, 44);
  const log = state.run || {};
  const cells = [
    ['KILLS', String(log.kills || 0)],
    ['BEST CHAIN', `x${log.bestChain || state.combo || 0}`],
    ['OIL LEFT', `${Math.round((state.oil || 0) * 100)}%`],
    ['TIME', clock(state.time)],
    ['DAMAGE', `${Math.round((log.damage || 0) * 100)}%`],
    ['EMBERS', grouped(state.embers)],
  ];
  for (let i = 0; i < cells.length; i += 1) {
    const col = i % 2;
    const row = Math.floor(i / 2);
    const x = 348 + col * 250;
    const y = 78 + row * 96;
    ctx.font = `800 16px ${FONT}`;
    ctx.fillStyle = PALETTE.muted;
    ctx.fillText(cells[i][0], x, y);
    ctx.font = `800 36px ${FONT}`;
    ctx.fillStyle = PALETTE.text;
    ctx.fillText(cells[i][1], x, y + 40);
  }
}

function drawFeats(ctx, flags, tally) {
  panel(ctx, 860, 16, 404, 360);
  ctx.textAlign = 'left';
  ctx.textBaseline = 'middle';
  ctx.font = `800 20px ${FONT}`;
  ctx.fillStyle = PALETTE.teal;
  ctx.fillText(`FEATS  ${tally}/${FEATS.length}`, 880, 44);
  for (let i = 0; i < FEATS.length; i += 1) {
    const feat = FEATS[i];
    const on = !!(flags && flags[feat.id]);
    const y = 68 + i * 36;
    tickBox(ctx, 880, y, on);
    ctx.font = `800 18px ${FONT}`;
    ctx.fillStyle = on ? PALETTE.text : PALETTE.muted;
    ctx.fillText(feat.name, 912, y + 12);
  }
}

function drawGifts(ctx, state) {
  panel(ctx, 16, 388, 760, 232);
  const carried = carriedGifts(state);
  ctx.textAlign = 'left';
  ctx.textBaseline = 'middle';
  ctx.font = `800 20px ${FONT}`;
  ctx.fillStyle = PALETTE.lantern;
  ctx.fillText(`GIFTS CARRIED  ${carried.length}/${UPGRADES.length}`, 32, 416);
  if (!carried.length) {
    ctx.font = `700 20px ${FONT}`;
    ctx.fillStyle = PALETTE.muted;
    ctx.fillText('None carried.', 32, 470);
    return;
  }
  for (let i = 0; i < carried.length && i < 8; i += 1) {
    const col = i % 4;
    const row = Math.floor(i / 4);
    const x = 32 + col * 184;
    const y = 444 + row * 80;
    const item = carried[i];
    card(ctx, x, y, 176, 70, false);
    drawGiftMark(ctx, item.card.id, x + 28, y + 35, 18);
    ctx.font = `800 16px ${FONT}`;
    ctx.fillStyle = PALETTE.text;
    ctx.textAlign = 'left';
    ctx.fillText(item.card.name, x + 54, y + 26);
    ctx.font = `700 14px ${FONT}`;
    ctx.fillStyle = PALETTE.lantern;
    ctx.fillText(`RANK ${item.rank}/${item.card.max}`, x + 54, y + 48);
  }
}

function drawRuns(ctx, state) {
  panel(ctx, 788, 388, 476, 232);
  ctx.textAlign = 'left';
  ctx.textBaseline = 'middle';
  ctx.font = `800 20px ${FONT}`;
  ctx.fillStyle = PALETTE.dawn;
  ctx.fillText('LAST RUNS', 804, 416);
  const rows = ((state.profile && state.profile.records) || []).slice(0, 5);
  ctx.font = `800 14px ${FONT}`;
  ctx.fillStyle = PALETTE.muted;
  ctx.fillText('GRADE', 804, 444);
  ctx.fillText('SCORE', 890, 444);
  ctx.fillText('NIGHT', 1030, 444);
  ctx.fillText('DIFFICULTY', 1110, 444);
  if (!rows.length) {
    ctx.font = `700 18px ${FONT}`;
    ctx.fillStyle = PALETTE.text;
    ctx.fillText('This run is the first.', 804, 480);
    return;
  }
  for (let i = 0; i < rows.length; i += 1) {
    const row = rows[i];
    const y = 472 + i * 26;
    ctx.font = `800 18px ${FONT}`;
    ctx.fillStyle = PALETTE.lantern;
    ctx.fillText(row.grade || '—', 804, y);
    ctx.fillStyle = PALETTE.text;
    ctx.fillText(grouped(row.score), 890, y);
    ctx.fillText(`${row.night || 1}/${NIGHTS}`, 1030, y);
    ctx.font = `700 16px ${FONT}`;
    ctx.fillText(String(row.difficulty || ''), 1110, y);
  }
}

function drawButtons(ctx) {
  card(ctx, AGAIN.x, AGAIN.y, AGAIN.w, AGAIN.h, true);
  keyCap(ctx, AGAIN.x + 18, AGAIN.y + 18, 'ENTER', 32);
  ctx.textAlign = 'left';
  ctx.textBaseline = 'middle';
  ctx.font = `800 28px ${FONT}`;
  ctx.fillStyle = '#fff6c4';
  ctx.fillText('PLAY AGAIN', AGAIN.x + 118, AGAIN.y + 35);
  card(ctx, TITLE_BTN.x, TITLE_BTN.y, TITLE_BTN.w, TITLE_BTN.h, false);
  ctx.font = `800 28px ${FONT}`;
  ctx.fillStyle = PALETTE.text;
  ctx.textAlign = 'center';
  ctx.fillText('TITLE', TITLE_BTN.x + TITLE_BTN.w / 2, TITLE_BTN.y + 35);
}

function carriedGifts(state) {
  const ranks = (state.loadout && state.loadout.ranks) || {};
  const list = [];
  for (let i = 0; i < UPGRADES.length; i += 1) {
    const cardItem = UPGRADES[i];
    const rank = ranks[cardItem.id] || 0;
    if (rank > 0) list.push({ card: cardItem, rank });
  }
  return list;
}

function gradeInk(letter) {
  if (letter === 'S') return PALETTE.lantern;
  if (letter === 'A') return PALETTE.teal;
  if (letter === 'B') return PALETTE.text;
  if (letter === 'C' || letter === 'D') return PALETTE.ember;
  return PALETTE.danger;
}

function clock(seconds) {
  const total = Math.max(0, Math.floor(seconds || 0));
  const minutes = Math.floor(total / 60);
  const remain = total % 60;
  return `${minutes}:${remain < 10 ? '0' : ''}${remain}`;
}
