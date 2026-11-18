/** Draws the round arena, the well, the keeper, and the screen overlays. */

import { drawBoss } from './boss.js';
import { drawBolts, drawHalo } from './combat.js';
import { ARENA, FONT, PALETTE, VIEW, WELL } from './config.js';
import { drawEnemies } from './enemies.js';
import { drawInterface } from './ui.js';

const STONE_COUNT = 32;
const TILE = 46;
const TILES = ['#e0b06a', '#c48a4c', '#f0c484', '#a87440', '#d49a5c', '#f2c898'];

export function createRenderer(canvas) {
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Canvas 2D is unavailable');

  const view = { scale: 1, offsetX: 0, offsetY: 0 };

  function resize() {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const cssW = window.innerWidth || VIEW.width;
    const cssH = window.innerHeight || VIEW.height;
    canvas.width = Math.max(1, Math.floor(cssW * dpr));
    canvas.height = Math.max(1, Math.floor(cssH * dpr));
    const scale = Math.min(cssW / VIEW.width, cssH / VIEW.height);
    view.scale = scale * dpr;
    view.offsetX = (canvas.width - VIEW.width * view.scale) / 2;
    view.offsetY = (canvas.height - VIEW.height * view.scale) / 2;
  }

  function clientToWorld(clientX, clientY) {
    const rect = canvas.getBoundingClientRect();
    const px = (clientX - rect.left) * (canvas.width / rect.width);
    const py = (clientY - rect.top) * (canvas.height / rect.height);
    return {
      x: (px - view.offsetX) / view.scale,
      y: (py - view.offsetY) / view.scale,
    };
  }

  function draw(state) {
    resize();
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    const sky = ctx.createRadialGradient(
      canvas.width / 2, canvas.height / 2, canvas.height * 0.15,
      canvas.width / 2, canvas.height / 2, canvas.height * 0.75,
    );
    sky.addColorStop(0, '#3a4c92');
    sky.addColorStop(0.55, '#2a2060');
    sky.addColorStop(1, '#1c1840');
    ctx.fillStyle = sky;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.setTransform(view.scale, 0, 0, view.scale, view.offsetX, view.offsetY);

    const shake = state.shake || 0;
    if (shake > 0) {
      ctx.translate(Math.sin(state.time * 43) * shake, Math.cos(state.time * 37) * shake);
    }

    drawGround(ctx, state.time);
    drawArena(ctx);
    drawWell(ctx, state);
    drawEnemies(ctx, state);
    drawBoss(ctx, state.boss, state.time);
    drawBolts(ctx, state);
    drawDashTrail(ctx, state.player);
    drawLanternPool(ctx, state);
    drawKeeper(ctx, state.player, state.time);
    drawHalo(ctx, state);
    state.particles.draw(ctx);
    drawVignette(ctx, state);

    if (state.flash > 0) {
      ctx.fillStyle = `rgba(255, 236, 190, ${Math.min(0.32, state.flash)})`;
      ctx.fillRect(0, 0, VIEW.width, VIEW.height);
    }

    drawChainCallout(ctx, state);
    drawInterface(ctx, state);
  }

  return { draw, resize, clientToWorld, view };
}

function drawGround(ctx, time) {
  const glow = ctx.createRadialGradient(ARENA.cx, ARENA.cy, 70, ARENA.cx, ARENA.cy, 640);
  glow.addColorStop(0, '#3a4c92');
  glow.addColorStop(0.42, '#2a2060');
  glow.addColorStop(1, '#161228');
  ctx.fillStyle = glow;
  ctx.fillRect(0, 0, VIEW.width, VIEW.height);

  for (let i = 0; i < 52; i += 1) {
    const a = i * 12.9898;
    const x = (Math.sin(a) * 0.5 + 0.5) * VIEW.width;
    const y = (Math.cos(a * 1.3) * 0.5 + 0.5) * VIEW.height;
    const twinkle = 0.5 + Math.sin(time * 1.4 + i) * 0.28;
    ctx.globalAlpha = twinkle;
    ctx.fillStyle = i % 5 === 0 ? PALETTE.teal : i % 4 === 0 ? PALETTE.lantern : '#f6f2ff';
    const s = i % 7 === 0 ? 2.6 : 1.7;
    ctx.fillRect(x, y, s, s);
  }
  ctx.globalAlpha = 1;
}

function drawArena(ctx) {
  ctx.beginPath();
  ctx.arc(ARENA.cx, ARENA.cy, ARENA.radius + 26, 0, Math.PI * 2);
  ctx.fillStyle = '#24160f';
  ctx.fill();

  ctx.save();
  ctx.beginPath();
  ctx.arc(ARENA.cx, ARENA.cy, ARENA.radius, 0, Math.PI * 2);
  ctx.clip();

  const left = ARENA.cx - ARENA.radius - TILE;
  const top = ARENA.cy - ARENA.radius - TILE;
  const right = ARENA.cx + ARENA.radius + TILE;
  const bottom = ARENA.cy + ARENA.radius + TILE;
  const x0 = Math.floor(left / TILE) * TILE;
  const y0 = Math.floor(top / TILE) * TILE;
  for (let y = y0; y < bottom; y += TILE) {
    for (let x = x0; x < right; x += TILE) {
      const n = tileInk((x / TILE) | 0, (y / TILE) | 0);
      ctx.fillStyle = TILES[n % TILES.length];
      ctx.fillRect(x + 1, y + 1, TILE - 3, TILE - 3);
      if (n % 5 === 0) {
        ctx.fillStyle = 'rgba(58, 28, 14, 0.35)';
        ctx.fillRect(x + 8, y + TILE * 0.42, TILE - 16, 2);
      }
      if (n % 7 === 0) {
        ctx.globalAlpha = 0.72;
        ctx.fillStyle = n % 2 ? PALETTE.moss : '#1f9a52';
        ctx.beginPath();
        ctx.ellipse(x + TILE * 0.64, y + TILE * 0.58, 11, 7, n, 0, Math.PI * 2);
        ctx.fill();
        ctx.globalAlpha = 1;
      }
    }
  }

  ctx.strokeStyle = 'rgba(48, 24, 12, 0.72)';
  ctx.lineWidth = 1.7;
  ctx.lineCap = 'round';
  ctx.beginPath();
  for (let c = 0; c < 8; c += 1) {
    let px = ARENA.cx + Math.sin(c * 2.17) * 150;
    let py = ARENA.cy + Math.cos(c * 1.63) * 130;
    ctx.moveTo(px, py);
    for (let s = 0; s < 5; s += 1) {
      px += Math.sin(c * 8.1 + s * 2.7) * 24;
      py += Math.cos(c * 4.4 + s * 1.9) * 18;
      ctx.lineTo(px, py);
    }
  }
  ctx.stroke();

  const wash = ctx.createRadialGradient(ARENA.cx, ARENA.cy, 20, ARENA.cx, ARENA.cy, ARENA.radius);
  wash.addColorStop(0, 'rgba(255, 214, 130, 0.38)');
  wash.addColorStop(0.42, 'rgba(255, 150, 48, 0.12)');
  wash.addColorStop(1, 'rgba(36, 18, 48, 0.16)');
  ctx.fillStyle = wash;
  ctx.fillRect(left, top, right - left, bottom - top);
  ctx.restore();

  ctx.strokeStyle = 'rgba(255, 220, 160, 0.22)';
  ctx.lineWidth = 2;
  for (let ring = 1; ring <= 3; ring += 1) {
    ctx.beginPath();
    ctx.arc(ARENA.cx, ARENA.cy, (ARENA.radius - 36) * (ring / 3.1), 0, Math.PI * 2);
    ctx.stroke();
  }

  ctx.beginPath();
  ctx.arc(ARENA.cx, ARENA.cy, ARENA.radius - 1, 0, Math.PI * 2);
  ctx.strokeStyle = '#ffc56a';
  ctx.lineWidth = 5;
  ctx.stroke();
  ctx.beginPath();
  ctx.arc(ARENA.cx, ARENA.cy, ARENA.radius + 7, 0, Math.PI * 2);
  ctx.strokeStyle = 'rgba(46, 224, 196, 0.75)';
  ctx.lineWidth = 3;
  ctx.stroke();

  for (let i = 0; i < STONE_COUNT; i += 1) {
    const angle = (i / STONE_COUNT) * Math.PI * 2 - Math.PI / 2;
    const x = ARENA.cx + Math.cos(angle) * (ARENA.radius - 6);
    const y = ARENA.cy + Math.sin(angle) * (ARENA.radius - 6);
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(angle + Math.PI / 2);
    ctx.fillStyle = i % 2 === 0 ? '#f2d0a2' : '#d4a064';
    ctx.fillRect(-18, -11, 36, 22);
    ctx.strokeStyle = '#3a2416';
    ctx.lineWidth = 2;
    ctx.strokeRect(-18, -11, 36, 22);
    ctx.restore();
  }
}

function tileInk(ix, iy) {
  let n = Math.imul(ix, 374761393) + Math.imul(iy, 668265263);
  n = Math.imul(n ^ (n >>> 13), 1274126177);
  return (n ^ (n >>> 16)) >>> 0;
}

function drawWell(ctx, state) {
  const time = state.time;
  const oil = Math.max(0, Math.min(1, state.oil ?? 1));
  const pulse = 0.5 + Math.sin(time * 2.2) * 0.5;
  let dread = 0;
  const boss = state.boss;
  if (boss && boss.active) {
    const gap = Math.hypot(boss.x - ARENA.cx, boss.y - ARENA.cy);
    dread = Math.max(0, 1 - gap / 230) * 0.5;
  }
  const reach = 130 + oil * 230;
  const glow = ctx.createRadialGradient(ARENA.cx, ARENA.cy, 10, ARENA.cx, ARENA.cy, reach);
  glow.addColorStop(0, `rgba(255, 244, 200, ${0.62 + oil * 0.28})`);
  glow.addColorStop(0.22, `rgba(255, 176, 48, ${0.38 + oil * 0.28})`);
  glow.addColorStop(0.55, `rgba(46, 224, 196, ${0.1 + oil * 0.1})`);
  glow.addColorStop(1, 'rgba(255, 140, 40, 0)');
  ctx.save();
  ctx.globalAlpha = Math.max(0.25, 1 - dread);
  ctx.fillStyle = glow;
  ctx.beginPath();
  ctx.arc(ARENA.cx, ARENA.cy, reach, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();

  ctx.save();
  ctx.translate(ARENA.cx, ARENA.cy);

  ctx.beginPath();
  ctx.arc(0, 0, WELL.radius + 10, 0, Math.PI * 2);
  ctx.fillStyle = '#4a3828';
  ctx.fill();

  for (let i = 0; i < 10; i += 1) {
    const angle = (i / 10) * Math.PI * 2;
    ctx.beginPath();
    ctx.arc(Math.cos(angle) * (WELL.radius + 2), Math.sin(angle) * (WELL.radius + 2), 8, 0, Math.PI * 2);
    ctx.fillStyle = i % 2 ? '#e0b888' : '#8a6244';
    ctx.fill();
    ctx.strokeStyle = '#2a1a10';
    ctx.lineWidth = 1.5;
    ctx.stroke();
  }

  const water = ctx.createRadialGradient(0, 0, 4, 0, 0, WELL.radius - 6);
  water.addColorStop(0, `rgba(210, 244, 255, ${0.75 + pulse * 0.25})`);
  water.addColorStop(0.4, PALETTE.waterGlow);
  water.addColorStop(1, PALETTE.water);
  ctx.beginPath();
  ctx.arc(0, 0, WELL.radius - 8, 0, Math.PI * 2);
  ctx.fillStyle = water;
  ctx.fill();

  ctx.strokeStyle = `rgba(143, 212, 255, ${0.35 + pulse * 0.4})`;
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.arc(0, 0, WELL.radius + 18 + pulse * 6, 0, Math.PI * 2);
  ctx.stroke();
  ctx.restore();

  for (let i = 0; i < 8; i += 1) {
    const angle = time * 0.7 + (i / 8) * Math.PI * 2;
    const ring = WELL.radius + 26 + Math.sin(time * 1.8 + i) * 6;
    ctx.globalAlpha = 0.45 + oil * 0.5;
    ctx.fillStyle = i % 2 === 0 ? PALETTE.waterGlow : PALETTE.lantern;
    ctx.beginPath();
    ctx.arc(ARENA.cx + Math.cos(angle) * ring, ARENA.cy + Math.sin(angle) * ring, 2.8, 0, Math.PI * 2);
    ctx.fill();
  }
  for (let i = 0; i < 10; i += 1) {
    const angle = time * 0.55 + i * 1.7;
    const rise = (time * 22 + i * 23) % 78;
    ctx.globalAlpha = 0.35 + (1 - rise / 78) * 0.6;
    ctx.fillStyle = i % 2 ? PALETTE.ember : PALETTE.lanternCore;
    ctx.beginPath();
    ctx.arc(
      ARENA.cx + Math.cos(angle) * (14 + (i % 4) * 8),
      ARENA.cy - rise - 6,
      2.2 + (i % 3) * 0.6,
      0,
      Math.PI * 2,
    );
    ctx.fill();
  }
  ctx.globalAlpha = 1;
}

function drawDashTrail(ctx, player) {
  const trail = player && player.trail;
  if (!trail) return;
  for (let i = 0; i < trail.length; i += 1) {
    const bit = trail[i];
    if (bit.life <= 0) continue;
    ctx.globalAlpha = Math.min(0.75, bit.life / 0.18);
    ctx.fillStyle = '#ffb03a';
    ctx.beginPath();
    ctx.arc(bit.x, bit.y, 6 * (bit.life / 0.18), 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.globalAlpha = 1;
}

function drawVignette(ctx, state) {
  const oil = Math.max(0, Math.min(1, state.oil ?? 1));
  const low = oil < 0.28 ? (0.28 - oil) / 0.28 : 0;
  const crown = state.boss && state.boss.active ? 0.06 : 0;
  const fade = ctx.createRadialGradient(VIEW.width / 2, VIEW.height / 2, 280, VIEW.width / 2, VIEW.height / 2, 760);
  fade.addColorStop(0, 'rgba(12, 8, 20, 0)');
  fade.addColorStop(0.72, 'rgba(12, 8, 20, 0)');
  fade.addColorStop(1, `rgba(12, 8, 20, ${0.22 + low * 0.34 + crown})`);
  ctx.fillStyle = fade;
  ctx.fillRect(0, 0, VIEW.width, VIEW.height);
}

function drawLanternPool(ctx, state) {
  const keeper = state.player;
  if (!keeper) return;
  const oil = Math.max(0.4, Math.min(1, state.oil ?? 1));
  const reach = 86 + oil * 100;
  const pool = ctx.createRadialGradient(keeper.x, keeper.y, 6, keeper.x, keeper.y, reach);
  pool.addColorStop(0, `rgba(255, 246, 210, ${0.42 * oil})`);
  pool.addColorStop(0.35, `rgba(255, 176, 48, ${0.24 * oil})`);
  pool.addColorStop(1, 'rgba(255, 140, 40, 0)');
  ctx.fillStyle = pool;
  ctx.beginPath();
  ctx.arc(keeper.x, keeper.y, reach, 0, Math.PI * 2);
  ctx.fill();
}

function drawChainCallout(ctx, state) {
  if (!state.combo || state.combo < 2) return;
  if (state.screen !== 'play' && state.screen !== 'paused') return;
  const keeper = state.player;
  if (!keeper) return;
  const text = `CHAIN x${state.combo}!`;
  const pulse = 1 + Math.sin(state.time * 7) * 0.04;
  ctx.save();
  ctx.translate(ARENA.cx, ARENA.cy - 188);
  ctx.scale(pulse, pulse);
  ctx.font = `800 58px ${FONT}`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  const width = ctx.measureText(text).width + 48;
  roundBox(ctx, -width / 2, -40, width, 80, 18);
  ctx.fillStyle = 'rgba(52, 26, 8, 0.82)';
  ctx.fill();
  ctx.lineWidth = 2.5;
  ctx.strokeStyle = '#ffc85a';
  ctx.stroke();
  ctx.lineWidth = 8;
  ctx.strokeStyle = '#2a1408';
  ctx.strokeText(text, 0, 2);
  ctx.fillStyle = '#ffe14a';
  ctx.fillText(text, 0, 1);
  ctx.restore();
}

function roundBox(ctx, x, y, width, height, radius) {
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.arcTo(x + width, y, x + width, y + height, radius);
  ctx.arcTo(x + width, y + height, x, y + height, radius);
  ctx.arcTo(x, y + height, x, y, radius);
  ctx.arcTo(x, y, x + width, y, radius);
  ctx.closePath();
}

function drawKeeper(ctx, player, time) {
  ctx.save();
  ctx.translate(player.x, player.y);
  ctx.rotate(player.angle);

  ctx.fillStyle = 'rgba(0, 0, 0, 0.35)';
  ctx.beginPath();
  ctx.ellipse(0, 10, 12, 5, 0, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = PALETTE.cloak;
  ctx.beginPath();
  ctx.moveTo(16, 0);
  ctx.lineTo(-10, 9);
  ctx.lineTo(-6, 0);
  ctx.lineTo(-10, -9);
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = '#1a120c';
  ctx.lineWidth = 3;
  ctx.stroke();
  ctx.strokeStyle = PALETTE.trim;
  ctx.lineWidth = 1.6;
  ctx.stroke();

  ctx.fillStyle = PALETTE.cloakLight;
  ctx.beginPath();
  ctx.arc(-1, 0, 6, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = '#1a120c';
  ctx.lineWidth = 2;
  ctx.stroke();

  const flame = 3.4 + Math.sin(time * 14) * 0.7;
  ctx.fillStyle = 'rgba(255, 180, 48, 0.55)';
  ctx.beginPath();
  ctx.arc(16, 0, 14, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = PALETTE.lantern;
  ctx.beginPath();
  ctx.arc(16, 0, 5.2, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = '#6a3808';
  ctx.lineWidth = 1.5;
  ctx.stroke();
  ctx.fillStyle = PALETTE.lanternCore;
  ctx.beginPath();
  ctx.arc(16, 0, flame * 0.5, 0, Math.PI * 2);
  ctx.fill();

  if (player.firing) {
    ctx.strokeStyle = 'rgba(255, 244, 210, 0.85)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(20, 0);
    ctx.lineTo(78, 0);
    ctx.stroke();
  }
  ctx.restore();
}


