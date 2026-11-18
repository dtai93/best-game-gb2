/** Frames the round arena so a fight fills the view. HUD stays in view space. */

import { ARENA, VIEW } from './config.js';

/** Play and pause zoom. Title, gifts, and dawn keep the wide view. */
export const FIGHT_ZOOM = 1.32;

export function fightFrame(state) {
  const screen = state && state.screen;
  if (screen === 'play' || screen === 'paused') {
    return { zoom: FIGHT_ZOOM, cx: ARENA.cx, cy: ARENA.cy };
  }
  return { zoom: 1, cx: VIEW.width / 2, cy: VIEW.height / 2 };
}
