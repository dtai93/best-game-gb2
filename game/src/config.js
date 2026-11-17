/** Tunables for Ashwell. Simulation and rendering both read from here. */

export const STEP = 1 / 60;
export const MAX_FRAME = 0.25;

export const VIEW = { width: 1280, height: 720 };

export const ARENA = { cx: 640, cy: 368, radius: 286 };

export const WELL = { radius: 48, solid: 30 };

export const NIGHTS = 8;

export const BEST_KEY = 'ashwell.lantern.best';

export const PLAYER = {
  radius: 14,
  speed: 228,
  dashSpeed: 680,
  dashTime: 0.14,
  dashCooldown: 0.72,
  accel: 16,
};

/** Shade silhouettes. Combat and the wave director read these stats. */
export const SHADE = {
  moth: { hp: 1, speed: 128, radius: 10, bounty: 90, resist: 0 },
  hound: { hp: 3, speed: 86, radius: 14, bounty: 150, resist: 0.12 },
  wisp: { hp: 2, speed: 72, radius: 11, bounty: 170, resist: 0 },
  brute: { hp: 8, speed: 42, radius: 22, bounty: 280, resist: 0.55 },
  hexer: { hp: 4, speed: 54, radius: 13, bounty: 210, resist: 0.18 },
};

/** Ember darts, lantern heat, and the halo pulse. */
export const COMBAT = {
  boltSpeed: 580,
  boltLife: 0.48,
  boltRadius: 5,
  boltDamage: 1,
  fireDelay: 0.13,
  heatPerShot: 0.072,
  heatCool: 0.48,
  heatCoolFiring: 0.1,
  overheatAt: 1,
  recoverAt: 0.32,
  oilBurn: 0.0011,
  chainTime: 2.4,
  specialHit: 0.05,
  specialKill: 0.16,
  pulseRadius: 178,
  pulseDamage: 3,
  pulseForce: 460,
  boltForce: 250,
  dashDamage: 1,
  dashForce: 380,
};

/** Breath between nights, and the sip of oil the dawn gives back. */
export const WAVE = {
  breath: 2.2,
  oilOnClear: 0.12,
};

/** The Unlit Crown. Pattern timing lives in boss.js. */
export const BOSS = {
  hp: 150,
  radius: 32,
  bounty: 3200,
  contactOil: 0.05,
  contactGap: 0.72,
  name: 'The Unlit Crown',
};

export const PALETTE = {
  void: '#070910',
  night: '#12182a',
  stone: '#3a342c',
  stoneDark: '#1c1915',
  stoneLight: '#6d6254',
  mortar: '#100e0c',
  moss: '#3e5c46',
  water: '#143044',
  waterGlow: '#8fd4ff',
  lantern: '#ffb03a',
  lanternCore: '#fff4d2',
  cloak: '#243246',
  cloakLight: '#3d5568',
  trim: '#e0a04a',
  ash: '#d4c2a4',
  text: '#f4ecdf',
  muted: '#b3a38c',
  danger: '#e25b4a',
  dawn: '#f0d7a2',
};

export const FONT = 'system-ui, "Segoe UI", sans-serif';
