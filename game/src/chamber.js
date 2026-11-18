/** Brick chamber around the arena: walls, walkway, braziers, rubble, moss, roots, posts. */

import { ARENA } from './config.js';

const BRICKS = ['#c47a48', '#a86438', '#d4925c', '#8d5030', '#e0a06a'];
const FLAGS = ['#f0c88a', '#e2b06a', '#f6d7a4', '#c99252', '#e8bc78'];

export function paintBackdrop(ctx, width, height) {
  paintBricks(ctx, 0, 0, width, height, 28, 14);
}

export function drawChamber(ctx, time) {
  const cx = ARENA.cx;
  const cy = ARENA.cy;
  const rim = ARENA.radius;
  paintBricks(ctx, cx - 580, cy - 400, 1160, 800, 36, 18);
  flagWalk(ctx, cx, cy, rim);
  lipLight(ctx, cx, cy, rim);
  for (let i = 0; i < 28; i += 1) merlon(ctx, (i / 28) * Math.PI * 2 + 0.08);
  roots(ctx, cx, cy, rim);
  mossAndRubble(ctx, cx, cy, rim);
  for (let i = 0; i < 8; i += 1) {
    const angle = (i / 8) * Math.PI * 2 + 0.4;
    brazier(ctx, cx + Math.cos(angle) * (rim + 78), cy + Math.sin(angle) * (rim + 78), time, i);
  }
  post(ctx, cx - rim - 118, cy + 150, time, 0.4);
  post(ctx, cx + rim + 124, cy + 86, time, 1.7);
  post(ctx, cx + rim + 90, cy - 150, time, 2.8);
  post(ctx, cx - rim - 70, cy - 120, time, 4.1);
}

function paintBricks(ctx, left, top, width, height, bw, bh) {
  const right = left + width;
  const bottom = top + height;
  const x0 = Math.floor(left / bw) * bw;
  const y0 = Math.floor(top / bh) * bh;
  for (let y = y0; y < bottom; y += bh) {
    const row = Math.floor(y / bh);
    const shift = row % 2 ? bw * 0.5 : 0;
    for (let x = x0 - bw; x < right; x += bw) {
      const n = ink((x + shift) | 0, y | 0);
      ctx.fillStyle = BRICKS[n % BRICKS.length];
      ctx.fillRect(x + shift + 1, y + 1, bw - 2, bh - 2);
    }
  }
}

function flagWalk(ctx, cx, cy, rim) {
  ctx.save();
  ctx.beginPath();
  ctx.arc(cx, cy, rim + 112, 0, Math.PI * 2);
  ctx.arc(cx, cy, rim - 6, 0, Math.PI * 2, true);
  ctx.clip();
  const tile = 42;
  const left = cx - rim - 120;
  const top = cy - rim - 120;
  for (let y = top; y < cy + rim + 120; y += tile) {
    for (let x = left; x < cx + rim + 120; x += tile) {
      const n = ink(x | 0, y | 0);
      ctx.fillStyle = FLAGS[n % FLAGS.length];
      ctx.fillRect(x + 1, y + 1, tile - 3, tile - 3);
    }
  }
  ctx.restore();
}

function lipLight(ctx, cx, cy, rim) {
  const lip = ctx.createRadialGradient(cx, cy, rim - 30, cx, cy, rim + 150);
  lip.addColorStop(0, 'rgba(255, 206, 120, 0.34)');
  lip.addColorStop(1, 'rgba(90, 40, 16, 0)');
  ctx.fillStyle = lip;
  ctx.beginPath();
  ctx.arc(cx, cy, rim + 150, 0, Math.PI * 2);
  ctx.arc(cx, cy, rim - 4, 0, Math.PI * 2, true);
  ctx.fill();
}

function merlon(ctx, angle) {
  const r = ARENA.radius + 30;
  ctx.save();
  ctx.translate(ARENA.cx + Math.cos(angle) * r, ARENA.cy + Math.sin(angle) * r);
  ctx.rotate(angle + Math.PI / 2);
  ctx.fillStyle = '#6a4030';
  ctx.fillRect(-15, -20, 30, 26);
  ctx.fillStyle = '#e2b078';
  ctx.fillRect(-13, -24, 26, 9);
  ctx.strokeStyle = '#2a160e';
  ctx.lineWidth = 2;
  ctx.strokeRect(-15, -24, 30, 30);
  ctx.restore();
}

function brazier(ctx, x, y, time, phase) {
  const flick = 0.78 + Math.sin(time * 9 + phase) * 0.22;
  const glow = ctx.createRadialGradient(x, y - 10, 2, x, y - 10, 36);
  glow.addColorStop(0, `rgba(255, 248, 210, ${0.92 * flick})`);
  glow.addColorStop(0.35, `rgba(255, 150, 32, ${0.72 * flick})`);
  glow.addColorStop(1, 'rgba(255, 70, 16, 0)');
  ctx.fillStyle = glow;
  ctx.beginPath();
  ctx.arc(x, y - 10, 36, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#ff6a22';
  ctx.beginPath();
  ctx.moveTo(x, y - 22);
  ctx.quadraticCurveTo(x + 7, y - 8, x + 3, y);
  ctx.quadraticCurveTo(x, y - 6, x - 3, y);
  ctx.quadraticCurveTo(x - 7, y - 8, x, y - 22);
  ctx.fill();
  ctx.fillStyle = '#3a2418';
  ctx.beginPath();
  ctx.moveTo(x - 14, y + 2);
  ctx.lineTo(x + 14, y + 2);
  ctx.lineTo(x + 10, y + 12);
  ctx.lineTo(x - 10, y + 12);
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = '#1a0e08';
  ctx.lineWidth = 2;
  ctx.stroke();
}

function post(ctx, x, y, time, phase) {
  const glow = ctx.createRadialGradient(x, y - 26, 2, x, y - 26, 26);
  const flick = 0.75 + Math.sin(time * 6 + phase) * 0.25;
  glow.addColorStop(0, `rgba(255, 236, 170, ${0.9 * flick})`);
  glow.addColorStop(1, 'rgba(255, 160, 40, 0)');
  ctx.fillStyle = glow;
  ctx.beginPath();
  ctx.arc(x, y - 26, 26, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = '#3a2416';
  ctx.lineWidth = 5;
  ctx.beginPath();
  ctx.moveTo(x, y + 28);
  ctx.lineTo(x, y - 16);
  ctx.stroke();
  ctx.fillStyle = '#ffb01a';
  ctx.fillRect(x - 7, y - 34, 14, 16);
  ctx.strokeStyle = '#6a3808';
  ctx.lineWidth = 2;
  ctx.strokeRect(x - 7, y - 34, 14, 16);
  ctx.fillStyle = '#fff6c4';
  ctx.fillRect(x - 3, y - 29, 6, 7);
}

function mossAndRubble(ctx, cx, cy, rim) {
  const spots = [
    [2.55, 64, 1], [2.9, 96, 2], [0.55, 70, 3], [0.95, 108, 4],
    [-0.7, 84, 5], [3.6, 90, 6], [1.7, 120, 7], [4.4, 76, 8],
  ];
  for (let i = 0; i < spots.length; i += 1) {
    const [angle, extra, salt] = spots[i];
    const x = cx + Math.cos(angle) * (rim + extra);
    const y = cy + Math.sin(angle) * (rim + extra);
    ctx.fillStyle = salt % 2 ? '#3dce72' : '#1f9a52';
    ctx.globalAlpha = 0.9;
    ctx.beginPath();
    ctx.ellipse(x, y, 16, 9, angle, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalAlpha = 1;
    ctx.fillStyle = salt % 3 ? '#8a5a38' : '#d4a36a';
    ctx.beginPath();
    ctx.ellipse(x + 14, y + 6, 11, 7, 0.4, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#5a3824';
    ctx.beginPath();
    ctx.ellipse(x + 22, y + 2, 7, 5, -0.3, 0, Math.PI * 2);
    ctx.fill();
  }
}

function roots(ctx, cx, cy, rim) {
  ctx.strokeStyle = '#4a2a18';
  ctx.lineWidth = 4;
  ctx.lineCap = 'round';
  ctx.beginPath();
  for (let i = 0; i < 6; i += 1) {
    const angle = i * 1.05 + 0.4;
    const x = cx + Math.cos(angle) * (rim + 48);
    const y = cy + Math.sin(angle) * (rim + 48);
    ctx.moveTo(x, y);
    ctx.quadraticCurveTo(
      x + Math.cos(angle + 1) * 50,
      y + Math.sin(angle + 1) * 36,
      x + Math.cos(angle) * 70,
      y + Math.sin(angle) * 54,
    );
  }
  ctx.stroke();
}

function ink(ix, iy) {
  let n = Math.imul(ix, 374761393) + Math.imul(iy, 668265263);
  n = Math.imul(n ^ (n >>> 13), 1274126177);
  return (n ^ (n >>> 16)) >>> 0;
}
