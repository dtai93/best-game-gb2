/** Boot, fixed-step loop, screen flow, and the four screenshot poses. */

import { createAudio } from './audio.js';
import { beginBoss, createBoss, resetBoss, updateBoss } from './boss.js';
import { createCombat, resetCombat, updateCombat } from './combat.js';
import { BEST_KEY, BOSS, MAX_FRAME, STEP } from './config.js';
import { createEnemies, resetEnemies, updateEnemies } from './enemies.js';
import { createInput } from './input.js';
import { createParticles } from './particles.js';
import { createPlayer } from './player.js';
import { createRenderer } from './render.js';
import { createRng } from './rng.js';
import { poseShot } from './shots.js';
import { SCREEN_END, SCREEN_PAUSED, SCREEN_PLAY, SCREEN_TITLE, SCREEN_UPGRADE, upgradeIndexAt } from './ui.js';
import { applyUpgrade, emptyMods, nightSip, rollOffer } from './upgrades.js';
import { createWaves, resetWaves, updateWaves } from './waves.js';

const params = new URLSearchParams(window.location.search);
const shotName = params.get('shot');
const seedParam = Number.parseInt(params.get('seed') ?? '', 10);
const seed = Number.isInteger(seedParam) ? seedParam >>> 0 : (Math.random() * 4294967296) >>> 0;

const canvas = document.getElementById('game');
const status = document.getElementById('status');
const rng = createRng(seed);
const particles = createParticles();
const player = createPlayer();
const foes = createEnemies();
const combat = createCombat();
const waves = createWaves();
const boss = createBoss();
const renderer = createRenderer(canvas);
const audio = createAudio();
const input = createInput(canvas, (x, y) => renderer.clientToWorld(x, y), () => audio.unlock());

const state = {
  screen: SCREEN_TITLE,
  seed,
  time: 0,
  night: 1,
  score: 0,
  best: readBest(),
  combo: 0,
  oil: 1,
  heat: 0,
  special: 0,
  outcome: null,
  player: player.body,
  enemies: foes.list,
  bolts: combat.bolts,
  motes: foes.motes,
  boss,
  particles,
  shake: 0,
  flash: 0,
  pulse: 0,
  overheated: false,
  muted: false,
  mods: emptyMods(),
  loadout: { ranks: {}, offer: [], hover: 0 },
  rng,
  bankBest,
  hear(name) {
    audio.play(name);
  },
};

function readBest() {
  try {
    return Number.parseInt(window.localStorage.getItem(BEST_KEY) ?? '0', 10) || 0;
  } catch {
    return 0;
  }
}

function saveBest(value) {
  try {
    window.localStorage.setItem(BEST_KEY, String(value));
  } catch {
    // Private windows can reject storage. The best score then lasts this visit.
  }
}

function announce(message) {
  if (status) status.textContent = message;
}

function bankBest() {
  if (state.score > state.best) {
    state.best = state.score;
    saveBest(state.best);
  }
}

function freshRun() {
  player.reset();
  particles.clear();
  state.time = 0;
  state.night = 1;
  state.score = 0;
  state.combo = 0;
  state.oil = 1;
  state.heat = 0;
  state.special = 0;
  state.outcome = null;
  state.shake = 0;
  state.flash = 0;
  state.pulse = 0;
  state.overheated = false;
  state.mods = emptyMods();
  state.loadout.ranks = {};
  state.loadout.offer = [];
  state.loadout.hover = 0;
  resetEnemies(foes);
  resetCombat(combat);
  resetWaves(waves);
  resetBoss(boss);
}

function openTitle() {
  freshRun();
  state.screen = SCREEN_TITLE;
  announce(`Ashwell. Best ${state.best}. Space or click to begin.`);
}

function startRun() {
  freshRun();
  state.screen = SCREEN_PLAY;
  audio.play('start');
  announce('Night 1. Guard the well.');
}

function acceptUpgrade(index) {
  const card = state.loadout.offer[index];
  if (!card) return;
  applyUpgrade(state, card);
  state.night += 1;
  nightSip(state);
  resetWaves(waves);
  state.screen = SCREEN_PLAY;
  audio.play('pick');
  announce(`Night ${state.night}. ${card.name}.`);
}

function stageShot(name) {
  freshRun();
  poseShot(name || 'start', state, player, foes, boss);
  state.shake = 0;
  state.flash = 0;
  announce(`Shot ${name || 'start'}.`);
}

function applyMenus(sample) {
  if (sample.muteEdge) {
    state.muted = audio.toggleMute();
    announce(state.muted ? 'Sound off.' : 'Sound on.');
  }
  if (state.screen === SCREEN_UPGRADE) {
    if (sample.restartEdge) {
      openTitle();
      return;
    }
    chooseUpgrade(sample);
    return;
  }
  if (state.screen === SCREEN_END) {
    if (sample.restartEdge || sample.enterEdge || sample.spaceEdge || sample.clickEdge) {
      sample.fireHeld = false;
      startRun();
    }
    return;
  }
  if (sample.restartEdge) {
    openTitle();
    return;
  }
  const confirm = sample.enterEdge || sample.spaceEdge || sample.clickEdge;
  if (state.screen === SCREEN_TITLE) {
    if (confirm) {
      sample.fireHeld = false;
      startRun();
    }
    return;
  }
  if (state.screen === SCREEN_PLAY && sample.pauseEdge) {
    state.screen = SCREEN_PAUSED;
    state.player.firing = false;
    announce('Paused.');
    return;
  }
  if (state.screen === SCREEN_PAUSED && (sample.pauseEdge || confirm)) {
    state.screen = SCREEN_PLAY;
    announce(`Night ${state.night}.`);
  }
}

function chooseUpgrade(sample) {
  if (sample.leftTap) state.loadout.hover = (state.loadout.hover + 2) % 3;
  if (sample.rightTap) state.loadout.hover = (state.loadout.hover + 1) % 3;
  if (sample.pickSlot) {
    acceptUpgrade(sample.pickSlot - 1);
    sample.fireHeld = false;
    return;
  }
  const aimed = sample.aimValid ? upgradeIndexAt(sample.aimX, sample.aimY) : -1;
  if (aimed >= 0) state.loadout.hover = aimed;
  const confirm = sample.enterEdge || sample.spaceEdge || (sample.clickEdge && aimed >= 0);
  if (confirm) {
    acceptUpgrade(state.loadout.hover);
    sample.fireHeld = false;
  }
}

function step(dt, sample, allowDash) {
  state.time += dt;
  if (state.screen !== SCREEN_PLAY) return;

  const motion = player.update(dt, {
    moveX: sample.moveX,
    moveY: sample.moveY,
    aimX: sample.aimX,
    aimY: sample.aimY,
    aimValid: sample.aimValid,
    fireHeld: sample.fireHeld,
    dashEdge: allowDash,
    speedScale: state.mods.speed,
    dashScale: state.mods.dashCd,
  });

  if (motion.dashed) {
    audio.play('dash');
    state.shake = Math.min(8, state.shake + 5);
    state.flash = Math.min(0.35, state.flash + 0.12);
    for (let i = 0; i < 10; i += 1) {
      const spread = (i - 5) * 18;
      particles.spawn(player.body.x, player.body.y, {
        vx: -player.body.dashX * 90 + spread,
        vy: -player.body.dashY * 90 + (i - 5) * 10,
        life: 0.28,
        size: 3,
        color: i % 2 ? '#ffb03a' : '#fff4d2',
      });
    }
  } else if (motion.trailing) {
    particles.spawn(player.body.x - player.body.dashX * 12, player.body.y - player.body.dashY * 12, {
      vx: -player.body.dashX * 40,
      vy: -player.body.dashY * 40,
      life: 0.2,
      size: 3.2,
      color: '#fff4d2',
    });
    particles.spawn(player.body.x, player.body.y, {
      vx: -player.body.dashX * 24,
      vy: -player.body.dashY * 24,
      life: 0.16,
      size: 2,
      color: '#e0a04a',
    });
  }

  const bites = updateEnemies(foes, dt, state);
  let bossMark = null;
  if (state.boss.active) {
    bossMark = updateBoss(state.boss, dt, state, foes);
  }
  const sips = bites + (state.boss.sips || 0);
  state.boss.sips = 0;
  updateCombat(combat, dt, state, sample, sips);
  if (state.oil > 1) state.oil = 1;
  if (state.oil <= 0) {
    state.oil = 0;
    state.outcome = 'dark';
    state.screen = SCREEN_END;
    state.player.firing = false;
    state.bankBest();
    audio.play('dark');
    announce('The well goes dark.');
  } else if (bossMark === 'dead') {
    state.outcome = 'dawn';
    state.screen = SCREEN_END;
    state.player.firing = false;
    state.bankBest();
    audio.play('dawn');
    announce(`Dawn. The crown falls. Score ${state.score}.`);
  } else if (bossMark === 'phase') {
    announce(`${BOSS.name}. Phase ${state.boss.phase}.`);
  } else if (!state.boss.active) {
    const mark = updateWaves(waves, dt, foes, state);
    if (mark === 'crown') {
      beginBoss(state.boss, state);
      announce(`Night 8. ${BOSS.name}.`);
    } else if (mark === 'upgrade') {
      rollOffer(state);
      state.screen = SCREEN_UPGRADE;
      state.player.firing = false;
      audio.play('night');
      announce('Choose a gift from the well.');
    }
  }

  particles.update(dt);
  state.shake = Math.max(0, state.shake - dt * 16);
  state.flash = Math.max(0, state.flash - dt * 1.4);
}

if (shotName) stageShot(shotName);
else announce(`Ashwell. Best ${state.best}. Space or click to begin.`);

let last = performance.now();
let accumulator = 0;
let paintCount = 0;

function frame(now) {
  const elapsed = Math.min(MAX_FRAME, (now - last) / 1000);
  last = now;

  if (!shotName) {
    const sample = input.sample();
    const wasPlaying = state.screen === SCREEN_PLAY;
    applyMenus(sample);
    const allowDash = wasPlaying && (sample.shiftEdge || sample.rightEdge || sample.spaceEdge);
    accumulator += elapsed;
    let dashLeft = allowDash;
    while (accumulator >= STEP) {
      step(STEP, sample, dashLeft);
      dashLeft = false;
      accumulator -= STEP;
    }
  }

  if (!shotName) audio.update(elapsed, state);
  state.muted = audio.muted();
  renderer.draw(state);

  if (shotName) {
    paintCount += 1;
    if (paintCount >= 2) {
      window.__shotReady = true;
      return;
    }
  }
  requestAnimationFrame(frame);
}

requestAnimationFrame(frame);
