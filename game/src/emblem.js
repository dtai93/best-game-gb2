/** Title crest: the last well, its lantern, and the crowned shade. */

export function drawTitleEmblem(ctx, cx, cy, radius, time) {
  const r = radius;
  const clock = time || 0;
  const flicker = 0.84 + Math.sin(clock * 5.5) * 0.16;
  ctx.save();
  ctx.translate(cx, cy);
  const glow = ctx.createRadialGradient(0, 0, r * 0.15, 0, 0, r * 1.18);
  glow.addColorStop(0, `rgba(255, 186, 64, ${0.42 * flicker})`);
  glow.addColorStop(0.55, 'rgba(90, 40, 160, 0.14)');
  glow.addColorStop(1, 'rgba(255, 140, 40, 0)');
  ctx.fillStyle = glow;
  ctx.beginPath();
  ctx.arc(0, 0, r * 1.18, 0, Math.PI * 2);
  ctx.fill();

  ctx.save();
  ctx.beginPath();
  ctx.arc(0, 0, r, 0, Math.PI * 2);
  ctx.clip();
  paintSky(ctx, r, clock);
  paintGround(ctx, r);
  drawEmblemWell(ctx, r, flicker);
  drawEmblemShade(ctx, r);
  drawEmblemLantern(ctx, r, flicker);
  ctx.restore();
  paintBezel(ctx, r);
  ctx.restore();
}

function paintSky(ctx, r, time) {
  const sky = ctx.createLinearGradient(0, -r, 0, r);
  sky.addColorStop(0, '#24366e');
  sky.addColorStop(0.45, '#3a2468');
  sky.addColorStop(1, '#24160e');
  ctx.fillStyle = sky;
  ctx.fillRect(-r, -r, r * 2, r * 2);
  const stars = [[-0.62, -0.72], [-0.28, -0.58], [0.08, -0.78], [0.42, -0.62], [0.7, -0.4], [-0.74, -0.28], [0.22, -0.42]];
  for (let i = 0; i < stars.length; i += 1) {
    ctx.globalAlpha = 0.55 + 0.35 * Math.sin(time * 2 + i);
    ctx.fillStyle = i % 2 ? '#fff6c4' : '#d8ecff';
    ctx.beginPath();
    ctx.arc(stars[i][0] * r, stars[i][1] * r, r * (i % 3 === 0 ? 0.018 : 0.012), 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.globalAlpha = 1;
}

function paintGround(ctx, r) {
  ctx.fillStyle = '#3a2818';
  ctx.beginPath();
  ctx.ellipse(0, r * 0.62, r * 1.05, r * 0.48, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#6a4a30';
  ctx.beginPath();
  ctx.ellipse(0, r * 0.48, r * 0.92, r * 0.34, 0, 0, Math.PI * 2);
  ctx.fill();
  for (let i = 0; i < 5; i += 1) {
    ctx.fillStyle = i % 2 ? '#c49258' : '#8a5c38';
    ctx.beginPath();
    ctx.ellipse(-r * 0.55 + i * r * 0.26, r * 0.5, r * 0.12, r * 0.07, -0.3 + i * 0.15, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#24160e';
    ctx.lineWidth = 1.5;
    ctx.stroke();
  }
  ctx.fillStyle = '#3dce72';
  ctx.globalAlpha = 0.85;
  ctx.beginPath();
  ctx.ellipse(-r * 0.42, r * 0.58, r * 0.08, r * 0.035, 0.4, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.ellipse(r * 0.55, r * 0.6, r * 0.06, r * 0.028, -0.2, 0, Math.PI * 2);
  ctx.fill();
  ctx.globalAlpha = 1;
}

function drawEmblemWell(ctx, r, flicker) {
  const x = -r * 0.1;
  const y = r * 0.18;
  ctx.save();
  ctx.translate(x, y);
  const pool = ctx.createRadialGradient(0, 0, 4, 0, 0, r * 0.42);
  pool.addColorStop(0, `rgba(255, 246, 210, ${0.75 * flicker})`);
  pool.addColorStop(0.4, 'rgba(255, 160, 40, 0.35)');
  pool.addColorStop(1, 'rgba(255, 140, 40, 0)');
  ctx.fillStyle = pool;
  ctx.beginPath();
  ctx.arc(0, 0, r * 0.42, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.arc(0, 0, r * 0.26, 0, Math.PI * 2);
  ctx.fillStyle = '#5a3c28';
  ctx.fill();
  ctx.lineWidth = 3;
  ctx.strokeStyle = '#1c1008';
  ctx.stroke();
  for (let i = 0; i < 8; i += 1) {
    const angle = (i / 8) * Math.PI * 2 - 0.4;
    ctx.beginPath();
    ctx.arc(Math.cos(angle) * r * 0.23, Math.sin(angle) * r * 0.23, r * 0.055, 0, Math.PI * 2);
    ctx.fillStyle = i % 2 ? '#f0c48a' : '#a86c40';
    ctx.fill();
    ctx.stroke();
  }
  const water = ctx.createRadialGradient(-r * 0.04, -r * 0.05, 2, 0, 0, r * 0.15);
  water.addColorStop(0, '#f4ffff');
  water.addColorStop(0.45, '#3ad4e8');
  water.addColorStop(1, '#0c6490');
  ctx.beginPath();
  ctx.arc(0, 0, r * 0.15, 0, Math.PI * 2);
  ctx.fillStyle = water;
  ctx.fill();
  ctx.strokeStyle = `rgba(180, 255, 255, ${0.7 * flicker})`;
  ctx.lineWidth = 2;
  ctx.stroke();
  ctx.restore();
}

function drawEmblemLantern(ctx, r, flicker) {
  const hx = -r * 0.1;
  const hy = -r * 0.36;
  ctx.save();
  ctx.strokeStyle = '#1a100c';
  ctx.lineWidth = Math.max(3, r * 0.04);
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(-r * 0.58, r * 0.46);
  ctx.quadraticCurveTo(-r * 0.62, -r * 0.02, hx, hy + r * 0.12);
  ctx.stroke();
  ctx.strokeStyle = '#6a5038';
  ctx.lineWidth = Math.max(1.5, r * 0.016);
  ctx.stroke();
  const glow = ctx.createRadialGradient(hx, hy, 2, hx, hy, r * 0.32);
  glow.addColorStop(0, `rgba(255, 250, 220, ${0.95 * flicker})`);
  glow.addColorStop(0.35, `rgba(255, 170, 40, ${0.55 * flicker})`);
  glow.addColorStop(1, 'rgba(255, 120, 20, 0)');
  ctx.fillStyle = glow;
  ctx.beginPath();
  ctx.arc(hx, hy, r * 0.32, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#c47a22';
  ctx.strokeStyle = '#1c1008';
  ctx.lineWidth = 2;
  roundLantern(ctx, hx, hy, r * 0.07, r * 0.13);
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = '#ffe14a';
  ctx.beginPath();
  ctx.moveTo(hx, hy + r * 0.05);
  ctx.quadraticCurveTo(hx + r * 0.055, hy - r * 0.02, hx, hy - r * 0.11 * flicker);
  ctx.quadraticCurveTo(hx - r * 0.05, hy - r * 0.02, hx, hy + r * 0.05);
  ctx.fill();
  ctx.fillStyle = '#fffce8';
  ctx.beginPath();
  ctx.arc(hx, hy - r * 0.01, r * 0.02, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

function drawEmblemShade(ctx, r) {
  ctx.save();
  ctx.translate(r * 0.34, r * 0.06);
  ctx.fillStyle = 'rgba(90, 40, 180, 0.35)';
  ctx.beginPath();
  ctx.ellipse(0, r * 0.08, r * 0.28, r * 0.4, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.moveTo(0, -r * 0.34);
  ctx.quadraticCurveTo(r * 0.3, -r * 0.02, r * 0.22, r * 0.4);
  ctx.lineTo(-r * 0.22, r * 0.4);
  ctx.quadraticCurveTo(-r * 0.28, 0, 0, -r * 0.34);
  ctx.closePath();
  ctx.fillStyle = '#4a28a0';
  ctx.fill();
  ctx.lineWidth = 3;
  ctx.lineJoin = 'round';
  ctx.strokeStyle = '#120814';
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(-r * 0.18, -r * 0.28);
  ctx.lineTo(-r * 0.2, -r * 0.5);
  ctx.lineTo(-r * 0.08, -r * 0.36);
  ctx.lineTo(0, -r * 0.6);
  ctx.lineTo(r * 0.08, -r * 0.36);
  ctx.lineTo(r * 0.2, -r * 0.5);
  ctx.lineTo(r * 0.18, -r * 0.28);
  ctx.closePath();
  ctx.fillStyle = '#ffb01a';
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = '#fff6c4';
  ctx.fillRect(-r * 0.12, -r * 0.32, r * 0.24, r * 0.035);
  ctx.beginPath();
  ctx.arc(r * 0.04, -r * 0.14, r * 0.045, 0, Math.PI * 2);
  ctx.fillStyle = '#fff6c4';
  ctx.fill();
  ctx.beginPath();
  ctx.arc(r * 0.05, -r * 0.135, r * 0.02, 0, Math.PI * 2);
  ctx.fillStyle = '#1a1030';
  ctx.fill();
  ctx.strokeStyle = '#2a1458';
  ctx.lineWidth = Math.max(3, r * 0.045);
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(-r * 0.06, -r * 0.02);
  ctx.quadraticCurveTo(-r * 0.28, r * 0.04, -r * 0.46, -r * 0.08);
  ctx.stroke();
  ctx.restore();
}

function paintBezel(ctx, r) {
  ctx.beginPath();
  ctx.arc(0, 0, r + 1, 0, Math.PI * 2);
  ctx.lineWidth = 8;
  ctx.strokeStyle = '#140c08';
  ctx.stroke();
  ctx.beginPath();
  ctx.arc(0, 0, r - 1, 0, Math.PI * 2);
  ctx.lineWidth = 5;
  ctx.strokeStyle = '#ffb01a';
  ctx.stroke();
  ctx.beginPath();
  ctx.arc(0, 0, r - 8, 0, Math.PI * 2);
  ctx.lineWidth = 1.5;
  ctx.strokeStyle = '#fff3c4';
  ctx.stroke();
}

function roundLantern(ctx, x, y, w, h) {
  ctx.beginPath();
  ctx.moveTo(x - w, y - h * 0.15);
  ctx.lineTo(x - w * 0.7, y - h);
  ctx.lineTo(x + w * 0.7, y - h);
  ctx.lineTo(x + w, y - h * 0.15);
  ctx.lineTo(x + w * 0.85, y + h);
  ctx.lineTo(x - w * 0.85, y + h);
  ctx.closePath();
}
