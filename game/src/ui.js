/** Title, HUD, pause, the three upgrade cards, and the dawn and dark screens. */

import { BOSS, FONT, NIGHTS, PALETTE, VIEW } from './config.js';
import { UPGRADES } from './upgrades.js';

export const SCREEN_TITLE = 'title';
export const SCREEN_PLAY = 'play';
export const SCREEN_PAUSED = 'paused';
export const SCREEN_UPGRADE = 'upgrade';
export const SCREEN_END = 'end';

const CARDS = [
  { x: 168, y: 188, w: 292, h: 340 },
  { x: 494, y: 188, w: 292, h: 340 },
  { x: 820, y: 188, w: 292, h: 340 },
];

export function upgradeIndexAt(x, y) {
  for (let i = 0; i < CARDS.length; i += 1) {
    const card = CARDS[i];
    if (x >= card.x && x <= card.x + card.w && y >= card.y && y <= card.y + card.h) return i;
  }
  return -1;
}

export function drawInterface(ctx, state) {
  const screen = state.screen;
  if (screen === SCREEN_PLAY || screen === SCREEN_PAUSED) drawHud(ctx, state);
  if (screen === SCREEN_TITLE) drawTitle(ctx, state);
  else if (screen === SCREEN_PAUSED) drawPause(ctx);
  else if (screen === SCREEN_UPGRADE) drawUpgrade(ctx, state);
  else if (screen === SCREEN_END) drawEnding(ctx, state);
}

function drawHud(ctx, state) {
  ctx.save();
  drawNightPanel(ctx, state);
  drawBossPanel(ctx, state);
  drawScorePanel(ctx, state);
  drawGiftPanel(ctx, state);
  drawLanternPanel(ctx, state);
  drawControls(ctx, state);
  ctx.restore();
}

function drawNightPanel(ctx, state) {
  const x = 12;
  const y = 12;
  const w = 372;
  const h = 184;
  panel(ctx, x, y, w, h);
  const left = x + 16;
  ctx.textBaseline = 'middle';
  ctx.textAlign = 'left';
  ctx.font = `800 16px ${FONT}`;
  ctx.fillStyle = PALETTE.lantern;
  ctx.fillText('ASHWELL', left, y + 28);
  const realmW = ctx.measureText('ASHWELL').width;
  ctx.font = `700 16px ${FONT}`;
  ctx.fillStyle = PALETTE.muted;
  ctx.fillText('NIGHT', left + realmW + 14, y + 28);
  const nightW = ctx.measureText('NIGHT').width;
  ctx.font = `800 28px ${FONT}`;
  ctx.fillStyle = PALETTE.text;
  ctx.fillText(`${state.night} / ${NIGHTS}`, left + realmW + nightW + 22, y + 28);

  const surge = state.surge || { sent: 0, total: 1 };
  const total = surge.total > 0 ? surge.total : 1;
  const sent = Math.max(0, Math.min(total, surge.sent || 0));
  ctx.font = `800 16px ${FONT}`;
  ctx.fillStyle = PALETTE.teal;
  ctx.fillText('WAVE', left, y + 62);
  meter(ctx, left + 62, y + 52, w - 62 - 16 - 52, 18, sent / total, PALETTE.teal);
  ctx.textAlign = 'right';
  ctx.fillStyle = PALETTE.text;
  ctx.fillText(`${sent}/${total}`, x + w - 16, y + 62);

  drawWinLose(ctx, left, y + 80, w - 32);
  drawRoute(ctx, left + 10, y + 160, w - 52, state.night);
}

function drawWinLose(ctx, x, y, w) {
  roundBox(ctx, x, y, w, 56, 10);
  ctx.fillStyle = 'rgba(0, 0, 0, 0.32)';
  ctx.fill();
  chip(ctx, x + 6, y + 5, 'WIN', '#173424', PALETTE.dawn);
  chip(ctx, x + 6, y + 29, 'LOSE', '#3a1414', PALETTE.danger);
  ctx.font = `700 16px ${FONT}`;
  ctx.textAlign = 'left';
  ctx.textBaseline = 'middle';
  ctx.fillStyle = PALETTE.text;
  ctx.fillText('Dawn if the lantern holds', x + 72, y + 16);
  ctx.fillText('Dark if the oil runs out', x + 72, y + 40);
}

function chip(ctx, x, y, text, fill, ink) {
  roundBox(ctx, x, y, 58, 22, 6);
  ctx.fillStyle = fill;
  ctx.fill();
  ctx.lineWidth = 1.5;
  ctx.strokeStyle = ink;
  ctx.stroke();
  ctx.font = `800 15px ${FONT}`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillStyle = ink;
  ctx.fillText(text, x + 29, y + 12);
}

function drawRoute(ctx, x, y, w, night) {
  ctx.strokeStyle = 'rgba(255, 214, 160, 0.4)';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(x, y);
  ctx.lineTo(x + w, y);
  ctx.stroke();
  const gap = w / (NIGHTS - 1);
  for (let i = 0; i < NIGHTS; i += 1) {
    const px = x + gap * i;
    const done = i + 1 < night;
    const current = i + 1 === night;
    if (i === NIGHTS - 1) {
      drawCrownNode(ctx, px, y, done || current);
      continue;
    }
    ctx.beginPath();
    ctx.arc(px, y, current ? 9 : 7, 0, Math.PI * 2);
    ctx.fillStyle = done || current ? PALETTE.lantern : 'rgba(16, 10, 8, 0.9)';
    ctx.fill();
    ctx.lineWidth = current ? 3 : 2;
    ctx.strokeStyle = current ? '#fff6c4' : done ? '#ffd27a' : 'rgba(255, 214, 160, 0.55)';
    ctx.stroke();
  }
}

function drawCrownNode(ctx, x, y, live) {
  ctx.beginPath();
  ctx.moveTo(x - 9, y + 6);
  ctx.lineTo(x - 9, y - 2);
  ctx.lineTo(x - 4, y + 2);
  ctx.lineTo(x, y - 8);
  ctx.lineTo(x + 4, y + 2);
  ctx.lineTo(x + 9, y - 2);
  ctx.lineTo(x + 9, y + 6);
  ctx.closePath();
  ctx.fillStyle = live ? PALETTE.violet : 'rgba(16, 10, 18, 0.95)';
  ctx.fill();
  ctx.lineWidth = 2;
  ctx.strokeStyle = live ? '#f0e4ff' : 'rgba(196, 160, 255, 0.75)';
  ctx.stroke();
}

function drawBossPanel(ctx, state) {
  const boss = state.boss;
  if (!boss || !boss.active || boss.maxHp <= 0) return;
  const x = 394;
  const y = 12;
  const w = 492;
  const h = 100;
  panel(ctx, x, y, w, h);
  const left = x + 16;
  const right = x + w - 16;
  ctx.textBaseline = 'middle';
  ctx.textAlign = 'left';
  ctx.font = `800 16px ${FONT}`;
  ctx.fillStyle = PALETTE.violet;
  ctx.fillText('BOSS', left, y + 30);
  const tagW = ctx.measureText('BOSS').width;
  ctx.font = `800 20px ${FONT}`;
  ctx.fillStyle = '#f4eeff';
  ctx.fillText(BOSS.name.toUpperCase(), left + tagW + 12, y + 30);
  ctx.textAlign = 'right';
  ctx.font = `800 16px ${FONT}`;
  ctx.fillStyle = PALETTE.lantern;
  ctx.fillText(boss.dying ? 'FALLING' : `PHASE ${boss.phase}`, right, y + 30);

  const ratio = Math.max(0, Math.min(1, boss.hp / boss.maxHp));
  const barW = w - 32 - 92;
  const barY = y + 58;
  meter(ctx, left, barY, barW, 22, ratio, boss.phase === 3 ? PALETTE.danger : '#b08cff');
  ctx.fillStyle = 'rgba(255, 248, 238, 0.9)';
  for (let i = 1; i <= 2; i += 1) ctx.fillRect(left + barW * (i / 3) - 1, barY + 3, 2, 16);
  ctx.textAlign = 'right';
  ctx.font = `800 18px ${FONT}`;
  ctx.fillStyle = PALETTE.text;
  ctx.fillText(`${Math.ceil(boss.hp)}/${boss.maxHp}`, right, barY + 12);
}

function drawScorePanel(ctx, state) {
  const w = 372;
  const x = VIEW.width - 12 - w;
  const y = 12;
  const h = 184;
  panel(ctx, x, y, w, h);
  const left = x + 16;
  const right = x + w - 16;
  const rows = [
    ['SCORE', grouped(state.score), 30, PALETTE.text],
    ['BEST', grouped(state.best), 22, PALETTE.dawn],
    ['CHAIN', `x${state.combo}`, 22, state.combo > 1 ? PALETTE.lantern : PALETTE.muted],
    ['EMBERS', grouped(state.embers || 0), 22, PALETTE.ember],
  ];
  let rowY = y + 32;
  for (let i = 0; i < rows.length; i += 1) {
    const [name, value, size, color] = rows[i];
    ctx.textBaseline = 'middle';
    ctx.textAlign = 'left';
    ctx.font = `800 16px ${FONT}`;
    ctx.fillStyle = PALETTE.muted;
    ctx.fillText(name, left, rowY);
    ctx.textAlign = 'right';
    ctx.font = `800 ${size}px ${FONT}`;
    ctx.fillStyle = color;
    ctx.fillText(value, right, rowY);
    rowY += i === 0 ? 42 : 36;
  }
}

function drawGiftPanel(ctx, state) {
  const owned = ownedGifts(state);
  const rows = Math.max(1, owned.length);
  const x = 12;
  const y = 208;
  const w = 300;
  const h = 44 + rows * 32 + 12;
  panel(ctx, x, y, w, h);
  ctx.textBaseline = 'middle';
  ctx.textAlign = 'left';
  ctx.font = `800 16px ${FONT}`;
  ctx.fillStyle = PALETTE.text;
  ctx.fillText('RUN GIFTS', x + 16, y + 24);
  ctx.textAlign = 'right';
  ctx.fillStyle = PALETTE.lantern;
  ctx.fillText(`${owned.length}/${UPGRADES.length}`, x + w - 16, y + 24);
  if (owned.length === 0) {
    ctx.textAlign = 'left';
    ctx.font = `700 16px ${FONT}`;
    ctx.fillStyle = PALETTE.muted;
    ctx.fillText('None carried', x + 16, y + 58);
    return;
  }
  for (let i = 0; i < owned.length; i += 1) {
    const rowY = y + 56 + i * 32;
    const { card, rank } = owned[i];
    drawGiftIcon(ctx, card.id, x + 28, rowY);
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
    ctx.font = `700 16px ${FONT}`;
    ctx.fillStyle = PALETTE.text;
    ctx.fillText(card.name, x + 48, rowY);
    drawPips(ctx, x + w - 22, rowY, rank, card.max);
  }
}

function drawLanternPanel(ctx, state) {
  const w = 320;
  const x = VIEW.width - 12 - w;
  const y = 208;
  const h = 148;
  panel(ctx, x, y, w, h);
  const oilColor = state.oil < 0.25 ? PALETTE.danger : PALETTE.lantern;
  const heatColor = state.overheated ? PALETTE.danger : '#ff7a32';
  const rows = [
    ['OIL', state.oil, oilColor, String(Math.round(state.oil * 100))],
    ['HEAT', state.heat, heatColor, state.overheated ? 'LOCK' : String(Math.round(state.heat * 100))],
    ['HALO', state.special, PALETTE.waterGlow, state.special >= 1 ? 'READY' : String(Math.round(state.special * 100))],
  ];
  for (let i = 0; i < rows.length; i += 1) {
    const rowY = y + 28 + i * 42;
    const [name, amount, color, value] = rows[i];
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
    ctx.font = `800 16px ${FONT}`;
    ctx.fillStyle = color;
    ctx.fillText(name, x + 16, rowY);
    meter(ctx, x + 78, rowY - 9, w - 78 - 72, 18, amount, color);
    ctx.textAlign = 'right';
    ctx.fillStyle = PALETTE.text;
    ctx.font = `800 16px ${FONT}`;
    ctx.fillText(value, x + w - 16, rowY);
  }
}

function drawControls(ctx, state) {
  const x = 12;
  const y = VIEW.height - 66;
  const w = VIEW.width - 24;
  const h = 54;
  panel(ctx, x, y, w, h);
  const items = [
    ['WASD', 'MOVE'],
    ['LMB', 'FIRE'],
    ['SHIFT', 'DASH'],
    ['F', 'PULSE'],
    ['P', 'PAUSE'],
    ['M', 'SOUND'],
  ];
  ctx.font = `800 16px ${FONT}`;
  const keyW = items.map(([key]) => Math.max(32, ctx.measureText(key).width + 18));
  const nameW = items.map(([, name]) => ctx.measureText(name).width);
  const gap = 26;
  let total = gap * (items.length - 1);
  for (let i = 0; i < items.length; i += 1) total += keyW[i] + 8 + nameW[i];
  let cursor = x + (w - total) / 2;
  const capY = y + (h - 30) / 2;
  for (let i = 0; i < items.length; i += 1) {
    const [key, name] = items[i];
    const quiet = key === 'M' && state.muted;
    roundBox(ctx, cursor, capY, keyW[i], 30, 8);
    ctx.fillStyle = quiet ? PALETTE.danger : '#fff3d6';
    ctx.fill();
    ctx.lineWidth = 2;
    ctx.strokeStyle = '#24160e';
    ctx.stroke();
    ctx.font = `800 16px ${FONT}`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = '#1c120c';
    ctx.fillText(key, cursor + keyW[i] / 2, capY + 16);
    ctx.textAlign = 'left';
    ctx.fillStyle = quiet ? PALETTE.danger : PALETTE.text;
    ctx.fillText(name, cursor + keyW[i] + 8, capY + 16);
    cursor += keyW[i] + 8 + nameW[i] + gap;
  }
}

function meter(ctx, x, y, w, h, amount, color) {
  const fill = Math.max(0, Math.min(1, amount || 0));
  roundBox(ctx, x, y, w, h, h / 2);
  ctx.fillStyle = 'rgba(255, 244, 220, 0.14)';
  ctx.fill();
  if (fill > 0) {
    ctx.save();
    roundBox(ctx, x, y, w, h, h / 2);
    ctx.clip();
    ctx.fillStyle = color;
    ctx.fillRect(x, y, Math.max(h * 0.65, w * fill), h);
    ctx.restore();
  }
  roundBox(ctx, x, y, w, h, h / 2);
  ctx.lineWidth = 1.5;
  ctx.strokeStyle = 'rgba(255, 236, 210, 0.5)';
  ctx.stroke();
}

function panel(ctx, x, y, w, h) {
  roundBox(ctx, x, y, w, h, 16);
  ctx.fillStyle = 'rgba(16, 10, 14, 0.8)';
  ctx.fill();
  ctx.lineWidth = 2;
  ctx.strokeStyle = 'rgba(255, 206, 140, 0.78)';
  ctx.stroke();
}

function roundBox(ctx, x, y, w, h, r) {
  const radius = Math.max(0, Math.min(r, w / 2, h / 2));
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.arcTo(x + w, y, x + w, y + h, radius);
  ctx.arcTo(x + w, y + h, x, y + h, radius);
  ctx.arcTo(x, y + h, x, y, radius);
  ctx.arcTo(x, y, x + w, y, radius);
  ctx.closePath();
}

const GIFT_INK = {
  wick: '#ffb01a',
  reservoir: '#7af6ff',
  siphon: '#ff6a22',
  ward: '#7eb6e4',
  glass: '#ffe14a',
  fan: '#ff8a3a',
  stones: '#3dce72',
  bell: '#d7ccff',
  chain: '#ffc85a',
  cloak: '#8ec8ff',
  breath: '#2ee0c4',
  halo: '#d09cff',
};

function ownedGifts(state) {
  const ranks = (state.loadout && state.loadout.ranks) || {};
  const list = [];
  for (let i = 0; i < UPGRADES.length; i += 1) {
    const card = UPGRADES[i];
    const rank = ranks[card.id] || 0;
    if (rank > 0) list.push({ card, rank });
  }
  return list;
}

function drawGiftIcon(ctx, id, x, y) {
  const color = GIFT_INK[id] || PALETTE.lantern;
  ctx.save();
  ctx.translate(x, y);
  ctx.beginPath();
  ctx.arc(0, 0, 11, 0, Math.PI * 2);
  ctx.fillStyle = 'rgba(255, 244, 220, 0.1)';
  ctx.fill();
  ctx.lineWidth = 1.5;
  ctx.strokeStyle = 'rgba(255, 220, 170, 0.5)';
  ctx.stroke();
  ctx.fillStyle = color;
  ctx.strokeStyle = color;
  ctx.lineWidth = 2.2;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  if (id === 'wick' || id === 'siphon') {
    ctx.beginPath();
    ctx.moveTo(0, 7);
    ctx.quadraticCurveTo(6, 1, 0, -8);
    ctx.quadraticCurveTo(-6, 1, 0, 7);
    ctx.fill();
  } else if (id === 'reservoir') {
    ctx.strokeRect(-6, -5, 12, 11);
    ctx.fillRect(-6, 2, 12, 4);
  } else if (id === 'ward') {
    ctx.beginPath();
    ctx.moveTo(0, -8);
    ctx.lineTo(7, -4);
    ctx.lineTo(5, 4);
    ctx.quadraticCurveTo(0, 9, -5, 4);
    ctx.lineTo(-7, -4);
    ctx.closePath();
    ctx.stroke();
  } else if (id === 'glass') {
    ctx.beginPath();
    ctx.moveTo(0, -8);
    ctx.lineTo(6, 0);
    ctx.lineTo(0, 8);
    ctx.lineTo(-6, 0);
    ctx.closePath();
    ctx.fill();
  } else if (id === 'fan') {
    ctx.beginPath();
    ctx.moveTo(-7, 6);
    ctx.lineTo(-2, -7);
    ctx.moveTo(0, 6);
    ctx.lineTo(0, -8);
    ctx.moveTo(7, 6);
    ctx.lineTo(2, -7);
    ctx.stroke();
  } else if (id === 'stones') {
    ctx.beginPath();
    ctx.arc(-3, 1, 4, 0, Math.PI * 2);
    ctx.arc(4, -1, 3, 0, Math.PI * 2);
    ctx.fill();
  } else if (id === 'bell') {
    ctx.beginPath();
    ctx.arc(0, -1, 6, Math.PI, 0);
    ctx.lineTo(6, 4);
    ctx.lineTo(-6, 4);
    ctx.fill();
    ctx.fillRect(-2, 5, 4, 3);
  } else if (id === 'chain') {
    ctx.beginPath();
    ctx.arc(-3, 0, 4, 0, Math.PI * 2);
    ctx.arc(3, 0, 4, 0, Math.PI * 2);
    ctx.stroke();
  } else if (id === 'cloak') {
    ctx.beginPath();
    ctx.moveTo(0, -8);
    ctx.lineTo(8, 6);
    ctx.lineTo(0, 2);
    ctx.lineTo(-8, 6);
    ctx.closePath();
    ctx.fill();
  } else if (id === 'breath') {
    ctx.beginPath();
    ctx.arc(0, 0, 6, 0.6, Math.PI * 1.7);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(4, -6);
    ctx.lineTo(7, -2);
    ctx.lineTo(2, -2);
    ctx.fill();
  } else {
    ctx.beginPath();
    ctx.arc(0, 0, 6, 0, Math.PI * 2);
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(0, 0, 2,5, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
}

function drawPips(ctx, right, y, rank, max) {
  const count = Math.max(1, max);
  const gap = 13;
  for (let i = 0; i < count; i += 1) {
    const px = right - (count - 1 - i) * gap;
    ctx.beginPath();
    ctx.arc(px, y, 4.5, 0, Math.PI * 2);
    ctx.fillStyle = i < rank ? PALETTE.lantern : 'rgba(255, 236, 210, 0.12)';
    ctx.fill();
    ctx.lineWidth = 1.5;
    ctx.strokeStyle = i < rank ? '#fff1c2' : 'rgba(255, 220, 170, 0.6)';
    ctx.stroke();
  }
}

function grouped(value) {
  const text = String(Math.max(0, Math.floor(value || 0)));
  return text.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
}

function drawTitle(ctx, state) {
  const cx = VIEW.width / 2;
  veil(ctx, 0.48);
  const glow = ctx.createRadialGradient(cx, 196, 8, cx, 200, 230);
  glow.addColorStop(0, 'rgba(255, 176, 58, 0.32)');
  glow.addColorStop(1, 'rgba(255, 176, 58, 0)');
  ctx.fillStyle = glow;
  ctx.beginPath();
  ctx.arc(cx, 198, 230, 0, Math.PI * 2);
  ctx.fill();
  ctx.textAlign = 'center';
  ctx.fillStyle = PALETTE.text;
  ctx.font = `68px ${FONT}`;
  ctx.fillText('Ashwell', cx, 198);
  ctx.fillStyle = PALETTE.lantern;
  ctx.font = `24px ${FONT}`;
  ctx.fillText('Lantern of the Last Well', cx, 242);
  drawNightMarks(ctx, cx, 286);
  ctx.fillStyle = PALETTE.ash;
  ctx.font = `18px ${FONT}`;
  ctx.fillText('Guard the well for eight nights. Choose a gift between them.', cx, 340);
  ctx.fillText('Dawn if the lantern still burns. Dark if the oil runs out.', cx, 368);
  ctx.fillStyle = PALETTE.muted;
  ctx.fillText('WASD move · mouse aim · click fire · Shift dash · F pulse', cx, 414);
  ctx.fillText('Esc pause · M mute · R title', cx, 440);
  const pulse = 0.78 + 0.22 * Math.sin(state.time * 3);
  ctx.globalAlpha = pulse;
  ctx.fillStyle = PALETTE.text;
  ctx.font = `20px ${FONT}`;
  ctx.fillText('Enter, Space, or click to begin', cx, 492);
  ctx.globalAlpha = 1;
  ctx.fillStyle = PALETTE.lantern;
  ctx.font = `18px ${FONT}`;
  ctx.fillText(`Best ${state.best}`, cx, 534);
}

function drawNightMarks(ctx, cx, y) {
  const gap = 28;
  const start = cx - ((NIGHTS - 1) * gap) / 2;
  for (let i = 0; i < NIGHTS; i += 1) {
    const x = start + i * gap;
    const crown = i === NIGHTS - 1;
    ctx.beginPath();
    ctx.arc(x, y, crown ? 7 : 5, 0, Math.PI * 2);
    ctx.fillStyle = crown ? '#2a1830' : PALETTE.stone;
    ctx.fill();
    ctx.lineWidth = i === 0 || crown ? 2 : 1;
    ctx.strokeStyle = crown ? PALETTE.danger : i === 0 ? PALETTE.lantern : PALETTE.stoneLight;
    ctx.stroke();
  }
  ctx.font = `14px ${FONT}`;
  ctx.fillStyle = PALETTE.muted;
  ctx.textAlign = 'center';
  ctx.fillText('Eight nights. The last wears the Crown.', cx, y + 22);
}

function drawPause(ctx) {
  veil(ctx, 0.42);
  ctx.textAlign = 'center';
  ctx.fillStyle = PALETTE.text;
  ctx.font = `52px ${FONT}`;
  ctx.fillText('Paused', VIEW.width / 2, 330);
  ctx.fillStyle = PALETTE.muted;
  ctx.font = `18px ${FONT}`;
  ctx.fillText('Enter or Esc resumes · R returns to the title', VIEW.width / 2, 378);
}

function drawUpgrade(ctx, state) {
  veil(ctx, 0.55);
  ctx.textAlign = 'center';
  ctx.fillStyle = PALETTE.dawn;
  ctx.font = `28px ${FONT}`;
  ctx.fillText(`Night ${state.night} is quiet`, VIEW.width / 2, 92);
  ctx.fillStyle = PALETTE.text;
  ctx.font = `18px ${FONT}`;
  ctx.fillText('The well offers three gifts. Take one.', VIEW.width / 2, 128);
  const offer = state.loadout.offer;
  for (let i = 0; i < CARDS.length; i += 1) {
    drawCard(ctx, CARDS[i], offer[i], i, state.loadout.hover === i, state);
  }
  ctx.fillStyle = PALETTE.muted;
  ctx.font = `16px ${FONT}`;
  ctx.fillText('1  2  3, or click a card · Enter confirms · R for the title', VIEW.width / 2, 640);
}

function drawCard(ctx, rect, card, index, hot, state) {
  ctx.fillStyle = hot ? 'rgba(36, 28, 18, 0.94)' : 'rgba(16, 14, 12, 0.9)';
  ctx.fillRect(rect.x, rect.y, rect.w, rect.h);
  ctx.strokeStyle = hot ? PALETTE.lantern : PALETTE.stoneLight;
  ctx.lineWidth = hot ? 3 : 1.5;
  ctx.strokeRect(rect.x + 1, rect.y + 1, rect.w - 2, rect.h - 2);
  ctx.textAlign = 'center';
  ctx.fillStyle = PALETTE.lantern;
  ctx.font = `16px ${FONT}`;
  ctx.fillText(String(index + 1), rect.x + rect.w / 2, rect.y + 36);
  if (!card) return;
  ctx.fillStyle = PALETTE.text;
  ctx.font = `22px ${FONT}`;
  wrapText(ctx, card.name, rect.x + rect.w / 2, rect.y + 88, rect.w - 36, 28);
  ctx.fillStyle = PALETTE.ash;
  ctx.font = `16px ${FONT}`;
  wrapText(ctx, card.line, rect.x + rect.w / 2, rect.y + 168, rect.w - 40, 22);
  const rank = state.loadout.ranks[card.id] || 0;
  ctx.fillStyle = PALETTE.muted;
  ctx.font = `14px ${FONT}`;
  ctx.fillText(rank > 0 ? `Taken ${rank}` : 'New', rect.x + rect.w / 2, rect.y + rect.h - 28);
}

function drawEnding(ctx, state) {
  veil(ctx, 0.55);
  const won = state.outcome === 'dawn';
  ctx.textAlign = 'center';
  ctx.fillStyle = won ? PALETTE.dawn : PALETTE.danger;
  ctx.font = `54px ${FONT}`;
  ctx.fillText(won ? 'Dawn' : 'The well goes dark', VIEW.width / 2, 250);
  ctx.fillStyle = PALETTE.ash;
  ctx.font = `18px ${FONT}`;
  ctx.fillText(
    won ? 'The Unlit Crown breaks. The lantern holds until morning.' : 'The oil is gone. The stones go quiet.',
    VIEW.width / 2,
    298,
  );
  ctx.fillStyle = PALETTE.text;
  ctx.font = `26px ${FONT}`;
  ctx.fillText(`Score ${state.score}`, VIEW.width / 2, 360);
  ctx.fillStyle = PALETTE.lantern;
  ctx.font = `20px ${FONT}`;
  ctx.fillText(`Best ${state.best}`, VIEW.width / 2, 396);
  ctx.fillStyle = PALETTE.muted;
  ctx.font = `18px ${FONT}`;
  ctx.fillText('Enter or R restarts', VIEW.width / 2, 460);
}

function veil(ctx, alpha) {
  ctx.fillStyle = `rgba(7, 9, 16, ${alpha})`;
  ctx.fillRect(0, 0, VIEW.width, VIEW.height);
}

function wrapText(ctx, text, x, y, maxWidth, lineHeight) {
  const words = text.split(' ');
  let line = '';
  let cursor = y;
  for (let i = 0; i < words.length; i += 1) {
    const trial = line ? `${line} ${words[i]}` : words[i];
    if (line && ctx.measureText(trial).width > maxWidth) {
      ctx.fillText(line, x, cursor);
      line = words[i];
      cursor += lineHeight;
    } else {
      line = trial;
    }
  }
  if (line) ctx.fillText(line, x, cursor);
}
