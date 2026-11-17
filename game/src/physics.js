/** Vector helpers and circle tests. Mutating helpers write into `out`. */

export function vec(x = 0, y = 0) {
  return { x, y };
}

export function set(out, x, y) {
  out.x = x;
  out.y = y;
  return out;
}

export function add(a, b, out) {
  out.x = a.x + b.x;
  out.y = a.y + b.y;
  return out;
}

export function sub(a, b, out) {
  out.x = a.x - b.x;
  out.y = a.y - b.y;
  return out;
}

export function scale(v, s, out) {
  out.x = v.x * s;
  out.y = v.y * s;
  return out;
}

export function len(x, y) {
  return Math.hypot(x, y);
}

export function norm(x, y, out) {
  const d = Math.hypot(x, y);
  if (d < 1e-8) {
    out.x = 0;
    out.y = 0;
    return out;
  }
  out.x = x / d;
  out.y = y / d;
  return out;
}

export function clamp(value, min, max) {
  if (value < min) return min;
  if (value > max) return max;
  return value;
}

export function lerp(a, b, t) {
  return a + (b - a) * t;
}

export function circlesOverlap(ax, ay, ar, bx, by, br) {
  const dx = ax - bx;
  const dy = ay - by;
  const reach = ar + br;
  return dx * dx + dy * dy < reach * reach;
}

/** Keep a point inside a circle. Returns the point unchanged when it already fits. */
export function clampToCircle(x, y, cx, cy, radius, out) {
  const dx = x - cx;
  const dy = y - cy;
  const d = Math.hypot(dx, dy);
  if (d <= radius || d === 0) {
    out.x = x;
    out.y = y;
    return out;
  }
  const s = radius / d;
  out.x = cx + dx * s;
  out.y = cy + dy * s;
  return out;
}

/**
 * Push a point out of a solid circle.
 * Returns false when the point was already outside.
 */
export function pushOutOfCircle(x, y, cx, cy, minDist, out) {
  const dx = x - cx;
  const dy = y - cy;
  const d = Math.hypot(dx, dy);
  if (d >= minDist) return false;
  if (d < 1e-8) {
    out.x = cx;
    out.y = cy + minDist;
    out.nx = 0;
    out.ny = 1;
    return true;
  }
  const s = minDist / d;
  out.x = cx + dx * s;
  out.y = cy + dy * s;
  out.nx = dx / d;
  out.ny = dy / d;
  return true;
}
