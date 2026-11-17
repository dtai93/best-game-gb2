/** Title, HUD, pause, the three upgrade cards, and the dawn and dark screens. */

import { BOSS, FONT, NIGHTS, PALETTE, VIEW } from './config.js';

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
  ctx.textAlign = 'left';
  ctx.font = `22px ${FONT}`;
  ctx.fillStyle = PALETTE.text;
  ctx.fillText(`Night ${state.night} / ${NIGHTS}`, 36, 42);
  const gifts = giftCount(state);
  if (gifts > 0) {
    ctx.font = `15px ${FONT}`;
    ctx.fillStyle = PALETTE.muted;
    ctx.fillText(`Gifts ${gifts}`, 36, 66);
  }

  ctx.textAlign = 'right';
  ctx.font = `26px ${FONT}`;
  ctx.fillStyle = PALETTE.text;
  ctx.fillText(String(state.score), VIEW.width - 36, 42);
  ctx.font = `15px ${FONT}`;
  ctx.fillStyle = PALETTE.muted;
  ctx.fillText(`Best ${state.best}`, VIEW.width - 36, 64);
  if (state.combo > 1) {
    ctx.font = `18px ${FONT}`;
    ctx.fillStyle = PALETTE.lantern;
    ctx.fillText(`Chain ${state.combo}`, VIEW.width - 36, 90);
  }
  drawBossBar(ctx, state);

  const oilColor = state.oil < 0.25 ? PALETTE.danger : PALETTE.lantern;
  drawMeter(ctx, 36, VIEW.height - 86, 250, 16, state.oil, oilColor, `Oil ${Math.round(state.oil * 100)}`);
  const heatLabel = state.overheated ? 'Overheat' : `Heat ${Math.round(state.heat * 100)}`;
  drawMeter(ctx, 36, VIEW.height - 52, 250, 12, state.heat, state.overheated ? PALETTE.danger : '#e07a3a', heatLabel);
  const haloLabel = state.special >= 1 ? 'Halo ready' : `Halo ${Math.round(state.special * 100)}`;
  drawMeter(ctx, VIEW.width - 286, VIEW.height - 86, 250, 16, state.special, PALETTE.waterGlow, haloLabel);
  if (state.muted) {
    ctx.textAlign = 'right';
    ctx.font = `14px ${FONT}`;
    ctx.fillStyle = PALETTE.muted;
    ctx.fillText('Sound off', VIEW.width - 36, VIEW.height - 48);
  }
}

function drawBossBar(ctx, state) {
  const boss = state.boss;
  if (!boss || !boss.active || boss.maxHp <= 0) return;
  const width = 460;
  const x = (VIEW.width - width) / 2;
  const y = 36;
  const ratio = Math.max(0, boss.hp / boss.maxHp);
  ctx.textAlign = 'center';
  ctx.font = `16px ${FONT}`;
  ctx.fillStyle = '#d7ccff';
  const phase = boss.dying ? 'falling' : `phase ${boss.phase}`;
  ctx.fillText(`${BOSS.name}  ·  ${phase}`, VIEW.width / 2, 28);
  ctx.fillStyle = 'rgba(7, 9, 16, 0.7)';
  ctx.fillRect(x, y, width, 14);
  ctx.fillStyle = boss.phase === 3 ? PALETTE.danger : '#8d78d8';
  ctx.fillRect(x, y, width * ratio, 14);
  ctx.strokeStyle = PALETTE.stoneLight;
  ctx.lineWidth = 1;
  ctx.strokeRect(x + 0.5, y + 0.5, width - 1, 13);
  ctx.fillStyle = 'rgba(244, 236, 223, 0.85)';
  for (let i = 1; i <= 2; i += 1) {
    const mark = x + width * (i / 3);
    ctx.fillRect(mark, y, 2, 14);
  }
}

function drawMeter(ctx, x, y, width, height, amount, color, label) {
  const fill = Math.max(0, Math.min(1, amount));
  ctx.fillStyle = 'rgba(7, 9, 16, 0.55)';
  ctx.fillRect(x, y, width, height);
  ctx.fillStyle = color;
  ctx.fillRect(x, y, width * fill, height);
  ctx.strokeStyle = PALETTE.stoneLight;
  ctx.lineWidth = 1;
  ctx.strokeRect(x + 0.5, y + 0.5, width - 1, height - 1);
  ctx.font = `14px ${FONT}`;
  ctx.textAlign = 'left';
  ctx.fillStyle = PALETTE.text;
  ctx.fillText(label, x, y - 6);
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

function giftCount(state) {
  const ranks = state.loadout && state.loadout.ranks;
  if (!ranks) return 0;
  let count = 0;
  for (const id in ranks) if (ranks[id] > 0) count += 1;
  return count;
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
