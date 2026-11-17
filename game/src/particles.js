/** Fixed particle pool. Callers spawn; the pool steps and draws. */

export function createParticles(capacity = 280) {
  const pool = [];
  for (let i = 0; i < capacity; i += 1) {
    pool.push({
      alive: false, x: 0, y: 0, vx: 0, vy: 0, life: 0, max: 1, size: 2, color: '#fff', drag: 1,
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
    for (let i = 0; i < pool.length; i += 1) {
      const spark = pool[i];
      if (!spark.alive) continue;
      ctx.globalAlpha = Math.max(0, spark.life / spark.max);
      ctx.fillStyle = spark.color;
      ctx.beginPath();
      ctx.arc(spark.x, spark.y, spark.size, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;
  }

  function clear() {
    for (let i = 0; i < pool.length; i += 1) pool[i].alive = false;
  }

  return { spawn, update, draw, clear };
}
