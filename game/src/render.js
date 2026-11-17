/** Draws the round arena, the well, the keeper, and the screen overlays. */

import { drawBoss } from './boss.js';
import { drawBolts, drawHalo } from './combat.js';
import { ARENA, PALETTE, VIEW, WELL } from './config.js';
import { drawEnemies } from './enemies.js';
import { drawInterface } from './ui.js';

const STONE_COUNT = 28;

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
    ctx.fillStyle = PALETTE.void;
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
    state.particles.draw(ctx);
    drawKeeper(ctx, state.player, state.time);
    drawHalo(ctx, state);
    drawVignette(ctx, state);

    if (state.flash > 0) {
      ctx.fillStyle = `rgba(255, 244, 210, ${Math.min(0.45, state.flash)})`;
      ctx.fillRect(0, 0, VIEW.width, VIEW.height);
    }

    drawInterface(ctx, state);
  }

  return { draw, resize, clientToWorld, view };
}

function drawGround(ctx, time) {
  const glow = ctx.createRadialGradient(ARENA.cx, ARENA.cy, 40, ARENA.cx, ARENA.cy, 520);
  glow.addColorStop(0, '#1a2744');
  glow.addColorStop(1, PALETTE.void);
  ctx.fillStyle = glow;
  ctx.fillRect(0, 0, VIEW.width, VIEW.height);

  ctx.fillStyle = 'rgba(212, 194, 164, 0.35)';
  for (let i = 0; i < 40; i += 1) {
    const a = i * 12.9898;
    const x = (Math.sin(a) * 0.5 + 0.5) * VIEW.width;
    const y = (Math.cos(a * 1.3) * 0.5 + 0.5) * VIEW.height;
    const twinkle = 0.3 + Math.sin(time * 1.4 + i) * 0.15;
    ctx.globalAlpha = twinkle;
    ctx.fillRect(x, y, 1.5, 1.5);
  }
  ctx.globalAlpha = 1;
}

function drawArena(ctx) {
  ctx.beginPath();
  ctx.arc(ARENA.cx, ARENA.cy, ARENA.radius + 18, 0, Math.PI * 2);
  ctx.fillStyle = PALETTE.mortar;
  ctx.fill();

  const floor = ctx.createRadialGradient(ARENA.cx, ARENA.cy - 20, 30, ARENA.cx, ARENA.cy, ARENA.radius);
  floor.addColorStop(0, '#4a433a');
  floor.addColorStop(0.7, PALETTE.stone);
  floor.addColorStop(1, PALETTE.stoneDark);
  ctx.beginPath();
  ctx.arc(ARENA.cx, ARENA.cy, ARENA.radius, 0, Math.PI * 2);
  ctx.fillStyle = floor;
  ctx.fill();

  ctx.strokeStyle = 'rgba(16, 14, 12, 0.55)';
  ctx.lineWidth = 2;
  for (let ring = 1; ring <= 3; ring += 1) {
    ctx.beginPath();
    ctx.arc(ARENA.cx, ARENA.cy, (ARENA.radius - 20) * (ring / 3.4), 0, Math.PI * 2);
    ctx.stroke();
  }

  for (let i = 0; i < STONE_COUNT; i += 1) {
    const angle = (i / STONE_COUNT) * Math.PI * 2 - Math.PI / 2;
    const x = ARENA.cx + Math.cos(angle) * (ARENA.radius - 8);
    const y = ARENA.cy + Math.sin(angle) * (ARENA.radius - 8);
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(angle + Math.PI / 2);
    ctx.fillStyle = i % 2 === 0 ? PALETTE.stoneLight : '#574c40';
    ctx.fillRect(-16, -10, 32, 20);
    ctx.restore();
  }

  ctx.beginPath();
  ctx.arc(ARENA.cx - 70, ARENA.cy + 90, 16, 0, Math.PI * 2);
  ctx.fillStyle = PALETTE.moss;
  ctx.globalAlpha = 0.45;
  ctx.fill();
  ctx.globalAlpha = 1;
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
  const reach = 78 + oil * 150;
  const glow = ctx.createRadialGradient(ARENA.cx, ARENA.cy, 8, ARENA.cx, ARENA.cy, reach);
  glow.addColorStop(0, `rgba(143, 212, 255, ${0.22 + oil * 0.28})`);
  glow.addColorStop(0.42, `rgba(255, 176, 58, ${0.05 + oil * 0.08})`);
  glow.addColorStop(1, 'rgba(0, 0, 0, 0)');
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
  ctx.fillStyle = '#2a261f';
  ctx.fill();

  for (let i = 0; i < 10; i += 1) {
    const angle = (i / 10) * Math.PI * 2;
    ctx.beginPath();
    ctx.arc(Math.cos(angle) * (WELL.radius + 2), Math.sin(angle) * (WELL.radius + 2), 8, 0, Math.PI * 2);
    ctx.fillStyle = i % 2 ? '#5c5348' : '#3f382f';
    ctx.fill();
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

  for (let i = 0; i < 6; i += 1) {
    const angle = time * 0.7 + (i / 6) * Math.PI * 2;
    const ring = WELL.radius + 24 + Math.sin(time * 1.8 + i) * 5;
    ctx.globalAlpha = 0.25 + oil * 0.45;
    ctx.fillStyle = i % 2 === 0 ? PALETTE.waterGlow : PALETTE.lantern;
    ctx.beginPath();
    ctx.arc(ARENA.cx + Math.cos(angle) * ring, ARENA.cy + Math.sin(angle) * ring, 2.1, 0, Math.PI * 2);
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
  const crown = state.boss && state.boss.active ? 0.08 : 0;
  const fade = ctx.createRadialGradient(VIEW.width / 2, VIEW.height / 2, 240, VIEW.width / 2, VIEW.height / 2, 700);
  fade.addColorStop(0, 'rgba(2, 3, 8, 0)');
  fade.addColorStop(0.58, 'rgba(2, 3, 8, 0)');
  fade.addColorStop(1, `rgba(2, 3, 8, ${0.58 + low * 0.28 + crown})`);
  ctx.fillStyle = fade;
  ctx.fillRect(0, 0, VIEW.width, VIEW.height);
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
  ctx.strokeStyle = PALETTE.trim;
  ctx.lineWidth = 1.5;
  ctx.stroke();

  ctx.fillStyle = PALETTE.cloakLight;
  ctx.beginPath();
  ctx.arc(-1, 0, 6, 0, Math.PI * 2);
  ctx.fill();

  const flame = 3.2 + Math.sin(time * 14) * 0.6;
  ctx.fillStyle = PALETTE.lantern;
  ctx.beginPath();
  ctx.arc(16, 0, 4.5, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = PALETTE.lanternCore;
  ctx.beginPath();
  ctx.arc(16, 0, flame * 0.45, 0, Math.PI * 2);
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


