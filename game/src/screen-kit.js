/** Rounded panels, key caps, and hit tests shared by the menu screens. */

import { FONT } from './config.js';

export function roundBox(ctx, x, y, w, h, r) {
  const radius = Math.max(0, Math.min(r, w / 2, h / 2));
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.arcTo(x + w, y, x + w, y + h, radius);
  ctx.arcTo(x + w, y + h, x, y + h, radius);
  ctx.arcTo(x, y + h, x, y, radius);
  ctx.arcTo(x, y, x + w, y, radius);
  ctx.closePath();
}

export function panel(ctx, x, y, w, h) {
  roundBox(ctx, x, y, w, h, 16);
  ctx.fillStyle = 'rgba(28, 18, 14, 0.9)';
  ctx.fill();
  ctx.lineWidth = 2;
  ctx.strokeStyle = 'rgba(255, 206, 140, 0.92)';
  ctx.stroke();
}

/** A choice card. `hot` is the one the next confirm will take. */
export function card(ctx, x, y, w, h, hot) {
  roundBox(ctx, x, y, w, h, 14);
  ctx.fillStyle = hot ? 'rgba(92, 58, 18, 0.96)' : 'rgba(32, 20, 16, 0.92)';
  ctx.fill();
  ctx.lineWidth = hot ? 4 : 2;
  ctx.strokeStyle = hot ? '#ffb01a' : 'rgba(255, 206, 140, 0.88)';
  ctx.stroke();
}

export function keyCap(ctx, x, y, label, h) {
  const height = h || 28;
  ctx.font = `800 16px ${FONT}`;
  const w = Math.max(height, ctx.measureText(label).width + 16);
  roundBox(ctx, x, y, w, height, 7);
  ctx.fillStyle = '#fff3d6';
  ctx.fill();
  ctx.lineWidth = 2;
  ctx.strokeStyle = '#24160e';
  ctx.stroke();
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillStyle = '#1c120c';
  ctx.fillText(label, x + w / 2, y + height / 2 + 1);
  return w;
}

export function tickBox(ctx, x, y, on) {
  roundBox(ctx, x, y, 22, 22, 5);
  ctx.fillStyle = on ? '#ffb01a' : 'rgba(255, 244, 220, 0.08)';
  ctx.fill();
  ctx.lineWidth = 2;
  ctx.strokeStyle = on ? '#fff6c4' : 'rgba(255, 206, 140, 0.75)';
  ctx.stroke();
  if (!on) return;
  ctx.beginPath();
  ctx.moveTo(x + 5, y + 12);
  ctx.lineTo(x + 9, y + 16);
  ctx.lineTo(x + 17, y + 6);
  ctx.strokeStyle = '#1c120c';
  ctx.lineWidth = 3;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  ctx.stroke();
}

export function inside(x, y, rect) {
  return !!rect && x >= rect.x && y >= rect.y && x <= rect.x + rect.w && y <= rect.y + rect.h;
}

export function grouped(value) {
  const text = String(Math.max(0, Math.floor(value || 0)));
  return text.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
}

export function wrap(ctx, text, x, y, maxWidth, lineHeight, maxLines) {
  const words = String(text || '').split(' ');
  let line = '';
  let row = 0;
  let cursor = y;
  for (let i = 0; i < words.length; i += 1) {
    const trial = line ? `${line} ${words[i]}` : words[i];
    if (line && ctx.measureText(trial).width > maxWidth) {
      ctx.fillText(line, x, cursor);
      row += 1;
      if (row >= maxLines) return;
      line = words[i];
      cursor += lineHeight;
    } else {
      line = trial;
    }
  }
  if (line && row < maxLines) ctx.fillText(line, x, cursor);
}
