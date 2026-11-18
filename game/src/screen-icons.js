/** Gift medallions and road-node marks for the menu screens. */

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

export function giftInk(id) {
  return GIFT_INK[id] || '#ffb01a';
}

export function nodeInk(type) {
  if (type === 'elite') return '#ff4b42';
  if (type === 'cache') return '#ff6a22';
  if (type === 'rest') return '#2ee0c4';
  if (type === 'boss') return '#b46cff';
  return '#ffb01a';
}

export function drawGiftMark(ctx, id, x, y, radius) {
  const color = giftInk(id);
  ctx.save();
  ctx.translate(x, y);
  ctx.beginPath();
  ctx.arc(0, 0, radius, 0, Math.PI * 2);
  ctx.fillStyle = 'rgba(20, 12, 8, 0.55)';
  ctx.fill();
  ctx.lineWidth = 3;
  ctx.strokeStyle = color;
  ctx.stroke();
  ctx.fillStyle = color;
  ctx.strokeStyle = color;
  ctx.lineWidth = Math.max(2, radius * 0.12);
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  const s = radius * 0.62;
  traceGift(ctx, id, s);
  ctx.restore();
}

function traceGift(ctx, id, s) {
  if (id === 'wick' || id === 'siphon') {
    ctx.beginPath();
    ctx.moveTo(0, s);
    ctx.quadraticCurveTo(s * 0.7, 0, 0, -s);
    ctx.quadraticCurveTo(-s * 0.7, 0, 0, s);
    ctx.fill();
  } else if (id === 'reservoir') {
    ctx.strokeRect(-s * 0.6, -s * 0.45, s * 1.2, s);
    ctx.fillRect(-s * 0.6, s * 0.15, s * 1.2, s * 0.4);
  } else if (id === 'ward') {
    ctx.beginPath();
    ctx.moveTo(0, -s);
    ctx.lineTo(s * 0.85, -s * 0.4);
    ctx.lineTo(s * 0.6, s * 0.35);
    ctx.quadraticCurveTo(0, s, -s * 0.6, s * 0.35);
    ctx.lineTo(-s * 0.85, -s * 0.4);
    ctx.closePath();
    ctx.stroke();
  } else if (id === 'glass') {
    ctx.beginPath();
    ctx.moveTo(0, -s);
    ctx.lineTo(s * 0.75, 0);
    ctx.lineTo(0, s);
    ctx.lineTo(-s * 0.75, 0);
    ctx.closePath();
    ctx.fill();
  } else if (id === 'fan') {
    ctx.beginPath();
    ctx.moveTo(-s, s * 0.7);
    ctx.lineTo(-s * 0.25, -s);
    ctx.moveTo(0, s * 0.7);
    ctx.lineTo(0, -s);
    ctx.moveTo(s, s * 0.7);
    ctx.lineTo(s * 0.25, -s);
    ctx.stroke();
  } else if (id === 'stones') {
    ctx.beginPath();
    ctx.arc(-s * 0.35, s * 0.1, s * 0.45, 0, Math.PI * 2);
    ctx.arc(s * 0.4, -s * 0.15, s * 0.38, 0, Math.PI * 2);
    ctx.fill();
  } else if (id === 'bell') {
    ctx.beginPath();
    ctx.arc(0, -s * 0.1, s * 0.7, Math.PI, 0);
    ctx.lineTo(s * 0.7, s * 0.45);
    ctx.lineTo(-s * 0.7, s * 0.45);
    ctx.fill();
  } else if (id === 'chain') {
    ctx.beginPath();
    ctx.arc(-s * 0.35, 0, s * 0.42, 0, Math.PI * 2);
    ctx.arc(s * 0.35, 0, s * 0.42, 0, Math.PI * 2);
    ctx.stroke();
  } else if (id === 'cloak') {
    ctx.beginPath();
    ctx.moveTo(0, -s);
    ctx.lineTo(s, s * 0.75);
    ctx.lineTo(0, s * 0.2);
    ctx.lineTo(-s, s * 0.75);
    ctx.closePath();
    ctx.fill();
  } else if (id === 'breath') {
    ctx.beginPath();
    ctx.arc(0, 0, s * 0.7, 0.5, Math.PI * 1.7);
    ctx.stroke();
  } else {
    ctx.beginPath();
    ctx.arc(0, 0, s * 0.55, 0, Math.PI * 2);
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(0, 0, s * 0.2, 0, Math.PI * 2);
    ctx.fill();
  }
}

export function drawNodeMark(ctx, type, x, y, radius) {
  const color = nodeInk(type);
  ctx.save();
  ctx.translate(x, y);
  ctx.beginPath();
  ctx.arc(0, 0, radius, 0, Math.PI * 2);
  ctx.fillStyle = 'rgba(20, 12, 8, 0.45)';
  ctx.fill();
  ctx.lineWidth = 3;
  ctx.strokeStyle = color;
  ctx.fillStyle = color;
  ctx.lineJoin = 'round';
  ctx.lineCap = 'round';
  const s = radius * 0.62;
  if (type === 'elite') {
    ctx.beginPath();
    ctx.moveTo(0, -s);
    ctx.lineTo(s * 0.75, 0);
    ctx.lineTo(0, s);
    ctx.lineTo(-s * 0.75, 0);
    ctx.closePath();
    ctx.fill();
  } else if (type === 'cache') {
    ctx.strokeRect(-s * 0.7, -s * 0.45, s * 1.4, s);
    ctx.beginPath();
    ctx.moveTo(-s * 0.7, -s * 0.05);
    ctx.lineTo(s * 0.7, -s * 0.05);
    ctx.stroke();
  } else if (type === 'rest') {
    ctx.beginPath();
    ctx.arc(0, s * 0.15, s * 0.7, Math.PI, 0);
    ctx.quadraticCurveTo(0, s * 1.1, 0, s * 0.15);
    ctx.fill();
  } else if (type === 'boss') {
    ctx.beginPath();
    ctx.moveTo(-s, s * 0.45);
    ctx.lineTo(-s, -s * 0.2);
    ctx.lineTo(-s * 0.45, s * 0.15);
    ctx.lineTo(0, -s);
    ctx.lineTo(s * 0.45, s * 0.15);
    ctx.lineTo(s, -s * 0.2);
    ctx.lineTo(s, s * 0.45);
    ctx.closePath();
    ctx.fill();
  } else {
    ctx.beginPath();
    ctx.moveTo(-s * 0.7, s * 0.5);
    ctx.lineTo(0, -s);
    ctx.lineTo(s * 0.7, s * 0.5);
    ctx.stroke();
  }
  ctx.restore();
}
