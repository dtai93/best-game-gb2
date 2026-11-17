/** Seeded RNG. Every random choice after boot goes through one of these. */

export function createRng(seed) {
  let state = (seed >>> 0) || 1;

  function next() {
    state = (state + 0x6d2b79f5) >>> 0;
    let t = state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  }

  return {
    next,
    float() {
      return next();
    },
    /** Integer in [0, max). */
    int(max) {
      return Math.floor(next() * max);
    },
    /** Float in [min, max). */
    range(min, max) {
      return min + next() * (max - min);
    },
  };
}
