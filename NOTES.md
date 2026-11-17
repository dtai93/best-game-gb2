# Ashwell — Lantern of the Last Well

Original twin-stick defense roguelite. The player guards a glowing well at the center of a round stone arena for eight nights. Shade creatures (moths, hounds, wisps, brutes, hexers) cross the stones to snuff the lantern. Between nights the player picks one of three upgrades. Night 8 is the boss, The Unlit Crown. Dawn is a win. The lantern's oil hitting zero is a loss.

Play: keyboard move, mouse aim, click to fire, Shift / right-click / Space to dash. Esc pauses. R restarts to the title. Enter, Space, or click confirms menus.

Deterministic scenes: `?shot=start|play|boss|end&seed=<n>`. A shot paints twice and sets `window.__shotReady`. After boot, all randomness goes through the seeded RNG. `localStorage` key `ashwell.lantern.best` keeps the best score.

## State (owned by main.js)

`screen` (`title` | `play` | `paused` | `upgrade` | `end`), `seed`, `time`, `night` (1–8), `score`, `best`, `combo`, `oil` (0–1, empty loses), `heat` (0–1 overheat), `special` (0–1), `outcome` (`null` | `dawn` | `dark`), `player`, `enemies`, `bolts`, `particles`, `shake`, `flash`, `rng`. Render reads this. It does not simulate.

## Modules

Each file has one job. Later sessions add the files marked later. Do not grow `main.js` into the simulation.

| File | Job |
| --- | --- |
| `game/index.html` | Canvas, status line, module entry |
| `src/main.js` | Boot, fixed 1/60 step, screen flow, shot query, best score |
| `src/config.js` | Tunables, arena, palette, storage key |
| `src/rng.js` | Seeded RNG (`next`, `float`, `int`, `range`) |
| `src/input.js` | Keyboard and mouse edges, aim in world space |
| `src/physics.js` | Vector helpers, circle overlap, arena clamp, well push-out |
| `src/particles.js` | Fixed pool: spawn, step, draw |
| `src/player.js` | Movement, mouse aim, dash |
| `src/render.js` | Arena, well, player, title / pause / end overlays |
| `src/enemies.js` | Later. Moth, hound, wisp, brute, hexer motion and contact |
| `src/waves.js` | Later. Per-night spawn director |
| `src/combat.js` | Later. Lantern bolts, oil drain, heat, special |
| `src/upgrades.js` | Later. Three choices between nights and their effects |
| `src/boss.js` | Later. The Unlit Crown |
| `src/audio.js` | Later. Web Audio synth SFX and music, no network assets |
| `src/hud.js` | Later. Score, combo, oil, heat, special, night, best |
| `src/shots.js` | Later. Rich deterministic poses for the four shot names |

Starter files removed this session: `random.js`, `world.js`, `shots.js`. Shot posing lives in `main.js` until `shots.js` exists.

## Feel targets (later sessions)

Particles, screen shake, and hit flash hooks already sit on state (`shake`, `flash`, particle pool). Wire them to hits, oil flares, and the boss. Keep the palette: night blue-black, warm stone, gold lantern, cold well-water.

## Session log

### Session 1 — plan and core

Wrote this plan and replaced the Block Dodger starter with a loadable Ashwell skeleton.

In place: `game/index.html`, `src/main.js` (fixed 1/60 loop, title / play / pause / end, `?shot=start|play|boss|end&seed=`), `config.js`, `rng.js`, `input.js` (WASD, mouse aim, click, Shift / right-click / Space dash, Esc, R), `physics.js`, `particles.js`, `player.js` (move, aim, dash, well push-out, arena clamp), `render.js` (arena, well, keeper, overlays). Dash spawns sparks and a short shake / flash. Best score is read from `localStorage` (`ashwell.lantern.best`); `state.bankBest` writes it when a later session ends a run. Shot poses are static inside `main.js` until `shots.js` exists.

Removed starter-only `random.js`, `world.js`, and `shots.js`.

Load check: headless Chrome, virtual time 2.5s, no page errors on `/` and on all four shot URLs. The status line announced the title and each shot. Port 8790 is held by the environment egress tunnel (`supervise-egress-tunnel`), which accepts the socket and returns an empty reply, so `serve.ts` cannot bind it and Chrome reports `ERR_EMPTY_RESPONSE` before any game code. The same check was run on port 8877.

Next session: enemies (moth, hound, wisp, brute, hexer) and the night spawn director, then lantern bolts, oil, heat, and the special meter. After that: upgrades, The Unlit Crown, synth audio, `hud.js`, and richer `shots.js`.

### Session 2 — enemies and combat

Added `enemies.js`, `combat.js`, and `waves.js`, and stepped them from `main.js` while the screen is `play`.

Shades, each with its own steer and silhouette: moths flutter into the well and snuff a sip of oil; hounds stalk, telegraph, then charge the keeper or the well; wisps orbit the stones and phase (bolts and the pulse pass through while they are ghosts); brutes march and gnaw; hexers circle the outer ring and throw motes. Contact that bites the keeper or the well breaks the chain, shakes the screen, and flashes.

Combat: click sprays ember darts. Heat climbs per dart, locks the lantern at full overheat, and unlocks once it cools (`state.overheated`). F or Q, once the special meter is full, casts the halo pulse. Hits and kills add score by chain, fill the meter, shove shades (knockback is separate from steering), and flash them gold. A dash cuts through one shade per lunge. A slow oil burn runs underneath. Oil at 0 ends the run in the dark and banks the best score.

Waves: eight scripts, busier each night. When the script is done and nothing is left on the stones, a short breath refills a little oil and the next night starts. Clearing night 8 currently calls dawn. `boss.js` should hold that dawn and fight The Unlit Crown first. There is no upgrade pick yet; the breath is the seam for `upgrades.js`.

`config.js` holds `SHADE`, `COMBAT`, and `WAVE`. `input.js` reports `specialEdge` for F and Q. `render.js` draws shades, darts, and the pulse, and the play readout shows oil, heat, halo, and chain until `hud.js` replaces it. Shot poses are still static.

Check: a seeded sim (dart kill, wisp phase, halo, overheat, night spawn, night advance, dawn, brute gnaw, hex mote, hound windup, dash strike) passed. Headless Chrome on `/` and `?shot=start|play|boss|end&seed=` painted with no page errors; each shot set `__shotReady`.

Next: three upgrade choices between nights, then The Unlit Crown on night 8, synth audio, `hud.js`, and richer `shots.js`.

### Session 3 — flow, UI, audio

Added `upgrades.js`, `ui.js`, and `audio.js`. HUD lives in `ui.js` (no separate `hud.js`).

Between nights 1–7, once the stones are clear and the breath ends, `waves.js` returns `upgrade` and the run stops on three gift cards. Keys 1–3, click, or Enter take one. Night then advances and the well refills. Night 8 still goes straight to dawn; `boss.js` should hold that dawn for The Unlit Crown.

Twelve gifts: Trimmed Wick, Deep Reservoir, Siphon Spark, Well Ward, Keen Glass, Ember Fan, Cool Stones, Halo Bell, Long Chain, Swift Cloak, Second Breath, Wide Halo. They change oil burn, the night sip, kill sips, bite resist, dart damage, fire rate, heat, the halo meter, chain time, move speed, dash cooldown, and pulse size.

Oil rules live in `upgrades.js`: `burnOil` (slow night burn), `drainOil` (bites, snuffs, motes, reduced by Well Ward), `refillOil`, and `nightSip` (base cup plus Deep Reservoir). Oil at 0 still ends the run in the dark and banks the best score.

`ui.js` draws the title, the play HUD (night, score, best, chain, oil, heat, halo), pause, the three cards, and dawn / dark. Enter or R on the end screen starts a new run. R from play, pause, or the cards returns to the title. Esc pauses. M mutes.

`audio.js` is Web Audio only: short synthesized effects (fire, hit, kill, dash, hurt, pulse, overheat, night, gift, start, dawn, dark) and a generative motif that ticks faster on later nights. The context starts on the first key or click. Mute is M.

Best score stays in `localStorage` under `ashwell.lantern.best`. The title status line reads it back.

Check: seeded sim (12 gifts, distinct offer, night sip, ward resist, wick burn, refill cap, night-1 upgrade, night-8 dawn) passed. Headless Chrome on `/` and `?shot=start|play|boss|end&seed=3` painted with no page errors; each shot set `__shotReady`. A stored best of 4242 showed on the title.

Next: `boss.js` for The Unlit Crown on night 8 (hold dawn until the crown falls), then richer `shots.js` poses and the real screenshots.

### Session 5 — screenshots and entry files

`shots.json` now lists four shots: `01-cover.jpg` (`?shot=start&seed=1`), `02-play.jpg` (`play`), `03-boss.jpg` (`boss`), `04-end.jpg` (`end`). Starter shots `1-start.jpg`, `2-play.jpg`, and `3-end.jpg` are removed.

Port 8790 is the egress tunnel (`EADDRINUSE` on `127.0.0.1:8790`, empty HTTP reply), so `serve.ts` cannot bind it. The server ran as `timeout 900 node serve.ts --port 18790`. Headless `--screenshot` with `--virtual-time-budget=4000` never wrote a file and hit the 90s timeout. Captures went through Chrome's debugging port (still wrapped in `timeout 90`), then Python PIL wrote JPEGs at 1280×720, each under 55 KiB.

Looked at all four. Title, play HUD, The Unlit Crown, and the dawn screen read clearly. Play and boss were showing Best 0 on a fresh profile, so `posePlay` and `poseBoss` now set a stored best (4200 and 9800) and those two shots were taken again.

`MAKEFUN_OUTPUT_DIR=/tmp/bg2out node main.ts` exited 0. It wrote `dossier.json`, `game/`, and the four JPEGs. `README.md` has the description, controls, `node serve.ts`, the three best-game-01 badges, and the make.fun footer. LICENSE already has `SPDX-License-Identifier: MIT`. `.makefun/owner.json` is unchanged.

Next: the last session commits. Do not bind port 8790.

### Session 6 — review, polish, commit

Headless Chrome on `/` and `?shot=start|play|boss|end&seed=1` (port 18790; 8790 is still the egress tunnel). No page errors. Each shot set `__shotReady`.

Two feel changes. `drawThreat` in `enemies.js` paints a dashed lane and pulse ring while a hound winds up, a solid lane while it charges, a growing ring on a hexer before the mote, and a dashed ring on a wisp just before it phases. The title in `ui.js` now has a lantern glow and eight night marks, the last one crowned. The play pose holds a winding hound, a casting hexer, and a wisp about to phase so those tells show in the shot.

Recaptured all four JPEGs at 1280×720 (cover, play, boss, dawn). `MAKEFUN_OUTPUT_DIR=/tmp/bg2out node main.ts` exited 0 and wrote `dossier.json` (282619 bytes), `game/`, and the four screenshots.

This session commits and pushes. Do not bind port 8790.

### Session 7 — own entrypoint

Rewrote `main.ts` in Ashwell's own words. It still imports `buildDossier` from `vendor/makefun-game.ts` (vendor unchanged), copies `game/` and `screenshots/` into `MAKEFUN_OUTPUT_DIR` or `/output`, and writes `dossier.json` with the best-game-01 caps (text 163840, screenshots 4 / 262144, game 993 files / 50331648 bytes / 1000-byte paths). It exits if `game/index.html` is missing and warns when `screenshots/` is empty or holds more than four images.

`MAKEFUN_OUTPUT_DIR=/tmp/bg2out timeout 120 node main.ts` exited 0. `dossier.json` is 282619 bytes. The four JPEGs are present: `01-cover.jpg`, `02-play.jpg`, `03-boss.jpg`, `04-end.jpg`. `game/index.html` was copied.

This session commits and pushes. Do not bind port 8790.
