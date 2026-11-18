/** Fixed particle pool. Callers spawn; the pool steps and draws. */

import { FONT } from './config.js';

export function createParticles(capacity = 420) {
  const pool = [];
  for (let i = 0; i < capacity; i += 1) {
    pool.push({
      alive: false, x: 0, y: 0, vx: 0, vy: 0, life: 0, max: 1, size: 2, color: '#fff', drag: 1,
      kind: 'dot', text: '', scale: 1,
    });
  }
  let cursor = 0;

  function spawn(x, y, options = {}) {
    const spark = pool[cursor];
    cursor = (cursor + 1) % pool.length;
    spark.alive = true;
    spark.x = x;
    spark.y = y;
    spark.vx = options.vx ?? 0;
    spark.vy = options.vy ?? 0;
    spark.max = options.life ?? 0.4;
    spark.life = spark.max;
    spark.size = options.size ?? 2.5;
    spark.color = options.color ?? '#fff4d2';
    spark.drag = options.drag ?? 2.4;
    spark.kind = options.kind || 'dot';
    spark.text = options.text || '';
    spark.scale = options.scale || 1;
  }

  function update(dt) {
    for (let i = 0; i < pool.length; i += 1) {
      const spark = pool[i];
      if (!spark.alive) continue;
      spark.life -= dt;
      if (spark.life <= 0) {
        spark.alive = false;
        continue;
      }
      spark.x += spark.vx * dt;
      spark.y += spark.vy * dt;
      const damp = Math.exp(-spark.drag * dt);
      spark.vx *= damp;
      spark.vy *= damp;
    }
  }

  function draw(ctx) {
    ctx.save();
    for (let i = 0; i < pool.length; i += 1) {
      const spark = pool[i];
      if (!spark.alive || spark.text) continue;
      const alpha = Math.max(0, spark.life / spark.max);
      if (spark.kind === 'spark') paintSpark(ctx, spark, alpha);
      else if (spark.kind === 'ember') paintEmber(ctx, spark, alpha);
      else paintDot(ctx, spark, alpha);
    }
    ctx.globalCompositeOperation = 'source-over';
    for (let i = 0; i < pool.length; i += 1) {
      const spark = pool[i];
      if (!spark.alive || !spark.text) continue;
      paintPop(ctx, spark, Math.max(0, spark.life / spark.max));
    }
    ctx.restore();
  }

  function clear() {
    for (let i = 0; i < pool.length; i += 1) pool[i].alive = false;
  }

  return { spawn, update, draw, clear };
}

function paintDot(ctx, spark, alpha) {
  ctx.globalCompositeOperation = 'source-over';
  ctx.globalAlpha = alpha * 0.4;
  ctx.fillStyle = spark.color;
  ctx.beginPath();
  ctx.arc(spark.x, spark.y, spark.size * 2, 0, Math.PI * 2);
  ctx.fill();
  ctx.globalAlpha = alpha;
  ctx.beginPath();
  ctx.arc(spark.x, spark.y, spark.size, 0, Math.PI * 2);
  ctx.fill();
}

function paintEmber(ctx, spark, alpha) {
  ctx.globalCompositeOperation = 'lighter';
  ctx.globalAlpha = alpha * 0.6;
  ctx.fillStyle = spark.color;
  ctx.beginPath();
  ctx.arc(spark.x, spark.y, spark.size * 2.2, 0, Math.PI * 2);
  ctx.fill();
  ctx.globalCompositeOperation = 'source-over';
  ctx.globalAlpha = alpha;
  ctx.fillStyle = '#fff4cc';
  ctx.beginPath();
  ctx.arc(spark.x, spark.y, Math.max(1.2, spark.size * 0.62), 0, Math.PI * 2);
  ctx.fill();
}

function paintSpark(ctx, spark, alpha) {
  const mag = Math.hypot(spark.vx, spark.vy);
  ctx.globalCompositeOperation = 'lighter';
  ctx.globalAlpha = alpha;
  ctx.strokeStyle = spark.color;
  ctx.fillStyle = spark.color;
  ctx.lineCap = 'round';
  ctx.lineWidth = Math.max(1.7, spark.size * 0.7);
  if (mag < 1) {
    ctx.beginPath();
    ctx.arc(spark.x, spark.y, spark.size, 0, Math.PI * 2);
    ctx.fill();
    return;
  }
  const len = 8 + spark.size * 2.5;
  ctx.beginPath();
  ctx.moveTo(spark.x, spark.y);
  ctx.lineTo(spark.x - (spark.vx / mag) * len, spark.y - (spark.vy / mag) * len);
  ctx.stroke();
}

function paintPop(ctx, spark, alpha) {
  const px = Math.max(16, Math.round(28 * spark.scale));
  ctx.globalCompositeOperation = 'source-over';
  ctx.globalAlpha = Math.min(1, alpha * 1.35);
  ctx.font = `800 ${px}px ${FONT}`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.lineJoin = 'round';
  ctx.lineWidth = Math.max(3, px * 0.16);
  ctx.strokeStyle = '#2a1408';
  ctx.strokeText(spark.text, spark.x, spark.y);
  ctx.fillStyle = spark.color;
  ctx.fillText(spark.text, spark.x, spark.y);
}
