/** Keeper of the well: move, aim at the pointer, and dash. */

import { ARENA, PLAYER, WELL } from './config.js';
import { clampToCircle, pushOutOfCircle } from './physics.js';

const scratch = { x: 0, y: 0, nx: 0, ny: 0 };

function makeTrail() {
  const trail = [];
  for (let i = 0; i < 8; i += 1) trail.push({ x: 0, y: 0, life: 0 });
  return trail;
}

export function createPlayer() {
  const body = {
    x: ARENA.cx,
    y: ARENA.cy + 150,
    vx: 0,
    vy: 0,
    angle: -Math.PI / 2,
    radius: PLAYER.radius,
    dashTime: 0,
    dashCooldown: 0,
    dashX: 0,
    dashY: 1,
    trailing: false,
    firing: false,
    trail: makeTrail(),
    trailHead: 0,
  };

  function reset(x = ARENA.cx, y = ARENA.cy + 150) {
    body.x = x;
    body.y = y;
    body.vx = 0;
    body.vy = 0;
    body.angle = -Math.PI / 2;
    body.dashTime = 0;
    body.dashCooldown = 0;
    body.dashX = 0;
    body.dashY = -1;
    body.trailing = false;
    body.firing = false;
    body.trailHead = 0;
    if (body.trail) {
      for (let i = 0; i < body.trail.length; i += 1) body.trail[i].life = 0;
    }
  }

  function update(dt, input) {
    if (input.aimValid) {
      const aimDx = input.aimX - body.x;
      const aimDy = input.aimY - body.y;
      if (aimDx * aimDx + aimDy * aimDy > 36) {
        body.angle = Math.atan2(aimDy, aimDx);
      }
    }
    body.firing = input.fireHeld;

    let mx = input.moveX;
    let my = input.moveY;
    const mag = Math.hypot(mx, my);
    if (mag > 1) {
      mx /= mag;
      my /= mag;
    }

    const canDash = body.dashCooldown <= 0 && body.dashTime <= 0;
    const dashed = Boolean(input.dashEdge && canDash);
    if (dashed) {
      let dx = mx;
      let dy = my;
      if (mag < 0.2) {
        dx = Math.cos(body.angle);
        dy = Math.sin(body.angle);
      }
      const dashMag = Math.hypot(dx, dy) || 1;
      body.dashX = dx / dashMag;
      body.dashY = dy / dashMag;
      body.dashTime = PLAYER.dashTime;
      body.dashCooldown = PLAYER.dashCooldown * (input.dashScale > 0 ? input.dashScale : 1);
    }

    if (body.dashTime > 0) {
      body.dashTime -= dt;
      body.x += body.dashX * PLAYER.dashSpeed * dt;
      body.y += body.dashY * PLAYER.dashSpeed * dt;
      body.vx = body.dashX * PLAYER.dashSpeed;
      body.vy = body.dashY * PLAYER.dashSpeed;
      body.trailing = true;
    } else {
      body.trailing = false;
      const speed = PLAYER.speed * (input.speedScale > 0 ? input.speedScale : 1);
      const blend = 1 - Math.exp(-PLAYER.accel * dt);
      body.vx += (mx * speed - body.vx) * blend;
      body.vy += (my * speed - body.vy) * blend;
      body.x += body.vx * dt;
      body.y += body.vy * dt;
    }

    if (body.dashCooldown > 0) body.dashCooldown -= dt;

    if (pushOutOfCircle(body.x, body.y, ARENA.cx, ARENA.cy, WELL.solid + body.radius, scratch)) {
      body.x = scratch.x;
      body.y = scratch.y;
      const into = body.vx * scratch.nx + body.vy * scratch.ny;
      if (into < 0) {
        body.vx -= into * scratch.nx;
        body.vy -= into * scratch.ny;
      }
    }

    clampToCircle(body.x, body.y, ARENA.cx, ARENA.cy, ARENA.radius - body.radius - 6, scratch);
    body.x = scratch.x;
    body.y = scratch.y;

    const trail = body.trail;
    if (trail) {
      for (let i = 0; i < trail.length; i += 1) {
        if (trail[i].life > 0) trail[i].life -= dt;
      }
      if (body.trailing) {
        const bit = trail[body.trailHead];
        bit.x = body.x - body.dashX * 16;
        bit.y = body.y - body.dashY * 16;
        bit.life = 0.18;
        body.trailHead = (body.trailHead + 1) % trail.length;
      }
    }

    return { dashed, trailing: body.trailing };
  }

  return { body, reset, update };
}
