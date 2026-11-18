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
  void: '#14122a',
  night: '#2a3870',
  stone: '#c49258',
  stoneDark: '#5a3c28',
  stoneLight: '#f0c48a',
  mortar: '#3a2418',
  moss: '#3dce72',
  water: '#1488b0',
  waterGlow: '#7af6ff',
  lantern: '#ffb01a',
  lanternCore: '#fff6c4',
  cloak: '#2f6294',
  cloakLight: '#7eb6e4',
  trim: '#ffc85a',
  ash: '#ffe6c0',
  text: '#fff8ee',
  muted: '#f0d4b0',
  danger: '#ff4b42',
  dawn: '#ffe2a6',
  teal: '#2ee0c4',
  violet: '#b46cff',
  ember: '#ff6a22',
};

export const FONT = 'system-ui, "Segoe UI", sans-serif';
