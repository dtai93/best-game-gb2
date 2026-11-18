/** Boot, fixed-step loop, screen flow, and the four screenshot poses. */

import { createAudio } from './audio.js';
import { beginBoss, createBoss, resetBoss, updateBoss } from './boss.js';
import { createCombat, resetCombat, updateCombat } from './combat.js';
import { BEST_KEY, BOSS, MAX_FRAME, STEP } from './config.js';
import { createEnemies, resetEnemies, updateEnemies } from './enemies.js';
import { evaluateFeats, featTally, freshLog, noteNightClear, rememberFeats } from './feats.js';
import { createInput } from './input.js';
import { applyMeta, buyUnlock, cycleDifficulty, difficultyById, loadProfile, saveProfile, UNLOCKS } from './meta.js';
import { dawnHit } from './dawn-screen.js';
import { nightHit } from './night-screen.js';
import { titleHit } from './title-screen.js';
import { createParticles } from './particles.js';
import { createPlayer } from './player.js';
import { bankRun, gradeRun, makeRecord } from './records.js';
import { createRenderer } from './render.js';
import { createRng } from './rng.js';
import { chooseFork, createRoute, currentNode, nextFork } from './route.js';
import { poseShot } from './shots.js';
import { SCREEN_END, SCREEN_PAUSED, SCREEN_PLAY, SCREEN_TITLE, SCREEN_UPGRADE } from './ui.js';
import { applyUpgrade, emptyMods, nightSip, refillOil, REROLL_COST, rerollOffer, rollOffer } from './upgrades.js';
import { createWaves, nightBeats, resetWaves, updateWaves } from './waves.js';

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
const profile = loadProfile();

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
  embers: 0,
  surge: { sent: 0, total: 1 },
  mods: emptyMods(),
  loadout: { ranks: {}, offer: [], hover: 0 },
  profile,
  difficulty: profile.difficulty,
  diffName: (difficultyById(profile.difficulty) || { name: 'Journeyman' }).name,
  threat: { count: 1, speed: 1 },
  node: null,
  route: null,
  road: null,
  gate: 'gift',
  run: freshLog(),
  emberRate: 1,
  bossCut: 1,
  cacheBonus: false,
  wallet: profile.embers,
  feats: null,
  featTally: 0,
  grade: '',
  banked: false,
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
  state.embers = 0;
  state.surge = { sent: 0, total: nightBeats(1) };
  state.mods = emptyMods();
  state.loadout.ranks = {};
  state.loadout.offer = [];
  state.loadout.hover = 0;
  state.node = null;
  state.route = null;
  state.road = null;
  state.gate = 'gift';
  state.roadSide = 0;
  state.run = freshLog();
  state.feats = null;
  state.featTally = 0;
  state.grade = '';
  state.banked = false;
  state.emberRate = 1;
  state.bossCut = 1;
  state.cacheBonus = false;
  applyMeta(state, state.profile);
  resetEnemies(foes);
  resetCombat(combat);
  resetWaves(waves);
  resetBoss(boss);
}

function openTitle() {
  freshRun();
  state.screen = SCREEN_TITLE;
  announce(`Ashwell. ${state.diffName}. Best ${state.best}. Enter to begin.`);
}

function startRun() {
  freshRun();
  state.route = createRoute(state.rng);
  enterNode(true);
}

function bindNode() {
  const node = currentNode(state.route);
  state.node = node;
  state.night = node.night;
  if (node.type === 'elite') state.run.sawElite = true;
  if (node.type === 'rest') state.run.sawRest = true;
}

function syncPace() {
  const speed = state.threat && state.threat.speed ? state.threat.speed : 1;
  const node = state.node;
  foes.pace = speed * (node && node.speed ? node.speed : 1);
  foes.bounty = node && node.bounty ? node.bounty : 1;
}

function grantNodeReward() {
  const node = state.node;
  if (!node) return;
  let oil = node.oil || 0;
  let embers = node.embers || 0;
  if (state.cacheBonus && node.type === 'cache') {
    oil += 0.12;
    embers += 6;
  }
  if (oil) refillOil(state, oil);
  if (embers) state.embers += embers;
}

function openGiftGate() {
  rollOffer(state);
  state.gate = 'gift';
  state.road = nextFork(state.route);
  state.roadSide = 0;
  state.loadout.hover = 0;
  state.screen = SCREEN_UPGRADE;
  state.player.firing = false;
  audio.play('night');
}

function enterNode(first) {
  bindNode();
  if (!first) nightSip(state);
  resetWaves(waves);
  syncPace();
  const beats = nightBeats(state.night);
  state.surge = { sent: 0, total: beats > 0 ? beats : 1 };
  if (state.node.type === 'rest') {
    grantNodeReward();
    noteNightClear(state.run, state.oil);
    openGiftGate();
    announce(`Night ${state.night} is a rest. The cup refills.`);
    return;
  }
  state.screen = SCREEN_PLAY;
  state.gate = 'gift';
  audio.play(first ? 'start' : 'pick');
  announce(`Night ${state.night}. ${state.node.name}. Guard the well.`);
}

function advanceNight() {
  const next = state.route.nights[state.route.index + 1];
  if (next && next.options && next.pick < 0) chooseFork(state.route, 0);
  else if (next) state.route.index += 1;
  enterNode(false);
}

function confirmBoard() {
  const offer = state.loadout.offer || [];
  const index = Math.max(0, Math.min(offer.length - 1, state.loadout.hover || 0));
  const card = offer[index];
  if (card) applyUpgrade(state, card);
  audio.play('pick');
  if (state.road) {
    acceptRoad(state.roadSide ? 1 : 0);
    return;
  }
  announce(card ? `${card.name}. The next night begins.` : 'The next night begins.');
  advanceNight();
}

function tryReroll() {
  const paid = rerollOffer(state);
  announce(paid ? 'The well offers three new gifts.' : `A reroll costs ${REROLL_COST} embers.`);
  if (paid) audio.play('pick');
}

function acceptRoad(side) {
  chooseFork(state.route, side);
  enterNode(false);
}

function closeRun() {
  if (state.banked) return;
  state.banked = true;
  if (state.run) state.run.outcome = state.outcome;
  state.feats = evaluateFeats(state);
  state.featTally = featTally(state.feats);
  state.grade = gradeRun(state);
  rememberFeats(state.profile, state.feats);
  bankRun(state.profile, makeRecord(state));
  saveProfile(state.profile);
  state.wallet = state.profile.embers;
  bankBest();
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
    chooseBoard(sample);
    return;
  }
  if (state.screen === SCREEN_END) {
    const hit = sample.aimValid ? dawnHit(sample.aimX, sample.aimY) : null;
    if (sample.clickEdge && hit && hit.kind === 'title') {
      openTitle();
      return;
    }
    if (sample.restartEdge || sample.enterEdge || sample.spaceEdge || (sample.clickEdge && hit && hit.kind === 'again')) {
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
    chooseTitle(sample, confirm);
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

function chooseTitle(sample, confirm) {
  if (sample.leftTap) {
    const diff = cycleDifficulty(state.profile, -1);
    state.difficulty = diff.id;
    state.diffName = diff.name;
    announce(`${diff.name}. ${diff.line}`);
    return;
  }
  if (sample.rightTap) {
    const diff = cycleDifficulty(state.profile, 1);
    state.difficulty = diff.id;
    state.diffName = diff.name;
    announce(`${diff.name}. ${diff.line}`);
    return;
  }
  if (sample.digit) {
    buyFromTitle(sample.digit - 1);
    return;
  }
  if (sample.clickEdge && sample.aimValid) {
    const hit = titleHit(sample.aimX, sample.aimY);
    if (hit && hit.kind === 'diff') {
      const diff = difficultyById(hit.id);
      if (!diff) return;
      state.profile.difficulty = diff.id;
      saveProfile(state.profile);
      state.difficulty = diff.id;
      state.diffName = diff.name;
      announce(`${diff.name}. ${diff.line}`);
      sample.fireHeld = false;
      return;
    }
    if (hit && hit.kind === 'unlock') {
      buyFromTitle(hit.index);
      sample.fireHeld = false;
      return;
    }
  }
  if (confirm) {
    sample.fireHeld = false;
    startRun();
  }
}

function buyFromTitle(index) {
  const card = UNLOCKS[index];
  if (!card) return;
  const bought = buyUnlock(state.profile, index);
  state.wallet = state.profile.embers;
  announce(bought ? `${card.name} unlocked. ${card.blurb}` : `${card.name} costs ${card.cost} embers. ${card.blurb}`);
  if (bought) audio.play('pick');
}

function chooseBoard(sample) {
  if (sample.restartEdge) {
    openTitle();
    return;
  }
  if (sample.rerollEdge) {
    tryReroll();
    return;
  }
  if (sample.pickSlot) state.loadout.hover = sample.pickSlot - 1;
  if (sample.leftTap) state.roadSide = 0;
  if (sample.rightTap) state.roadSide = 1;
  const hit = sample.aimValid ? nightHit(sample.aimX, sample.aimY, state) : null;
  if (sample.clickEdge && hit) {
    sample.fireHeld = false;
    if (hit.kind === 'gift') {
      state.loadout.hover = hit.index;
      return;
    }
    if (hit.kind === 'road') {
      state.roadSide = hit.index;
      return;
    }
    if (hit.kind === 'reroll') {
      tryReroll();
      return;
    }
    if (hit.kind === 'continue') {
      confirmBoard();
      return;
    }
  }
  if (sample.enterEdge || sample.spaceEdge) {
    sample.fireHeld = false;
    confirmBoard();
  }
}

function step(dt, sample, allowDash) {
  if (state.screen !== SCREEN_END) state.time += dt;
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
    closeRun();
    audio.play('dark');
    announce(`The well goes dark. Grade ${state.grade}.`);
  } else if (bossMark === 'dead') {
    state.outcome = 'dawn';
    state.screen = SCREEN_END;
    state.player.firing = false;
    closeRun();
    audio.play('dawn');
    announce(`Dawn. Grade ${state.grade}. Score ${state.score}.`);
  } else if (bossMark === 'phase') {
    announce(`${BOSS.name}. Phase ${state.boss.phase}.`);
  } else if (!state.boss.active) {
    const mark = updateWaves(waves, dt, foes, state);
    if (mark === 'crown') {
      grantNodeReward();
      beginBoss(state.boss, state);
      announce(`Night ${state.night}. ${BOSS.name}.`);
    } else if (mark === 'upgrade') {
      noteNightClear(state.run, state.oil);
      grantNodeReward();
      openGiftGate();
      announce('Choose a gift from the well.');
    }
  }

  particles.update(dt);
  state.shake = Math.max(0, state.shake - dt * 16);
  state.flash = Math.max(0, state.flash - dt * 1.4);
}

if (shotName) stageShot(shotName);
else announce(`Ashwell. ${state.diffName}. Best ${state.best}. Enter to begin.`);

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
