# Ashwell — Lantern of the Last Well

Original twin-stick defense roguelite. The player guards a glowing well at the center of a round stone arena for eight nights. Shade creatures (moths, hounds, wisps, brutes, hexers) cross the stones to snuff the lantern. Between nights the player picks one of three upgrades. Night 8 is the boss, The Unlit Crown. Dawn is a win. The lantern's oil hitting zero is a loss.

Play: keyboard move, mouse aim, click to fire, Shift / right-click / Space to dash. Esc pauses. R restarts to the title. Enter, Space, or click confirms menus.

Deterministic scenes: `?shot=play|boss|upgrade|end|dawn&seed=<n>` (`dawn` is the victory pose). A shot paints twice and sets `window.__shotReady`. After boot, all randomness goes through the seeded RNG. `localStorage` key `ashwell.lantern.best` keeps the best score.

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

### Session 8 — play visual punch

Brightened the palette in `config.js` (lantern gold, teal, violet, warm stone) and redrew the arena in `render.js`: stone tiles, mortar, cracks, moss, a gold inner wash, and a gold-plus-teal rim. The well's light pool is a wide gold core with a teal edge, and rising embers. The keeper carries a lantern pool. The edge vignette is lighter so the floor stays readable. Hit flash is a warm wash.

Shades in `enemies.js` have saturated bodies, dark outlines, a tinted glow, and a gold rim toward the well. Motes leave a short trail. Bolts in `combat.js` draw a light streak, a glow, and a core, and drop embers as they fly. Hits throw spark streaks and an ember. Kills still use the puff ring. Score math is unchanged. Each hit spawns a floating `+N` pop. Chain milestones also spawn `CHAIN xN!`. While the combo is at least 2, `drawChainCallout` paints a large gold banner above the well.

`particles.js` draws dots, spark streaks, embers, and stroked text pops. The play pose in `shots.js` returns the shade it places, fills the ring with more silhouettes, aims two bolts, and seeds `+95`, `+40`, sparks, and embers. The crown's body is a brighter violet so it matches the floor.

Check: `?shot=play&seed=1` on port 18811 (8790 is still the egress tunnel). `__shotReady` was set. No console errors or warnings from the page. `02-play.jpg` is 1280×720, 113417 bytes. The other three shots are still the previous captures.

Next session can punch the HUD and recapture. Do not bind port 8790.

### Session 9 — HUD panels

Replaced the loose play readout in `ui.js` with rounded translucent panels. The night panel names Ashwell, the night, a wave bar from `state.surge`, the dawn / dark win-lose strip, and an eight-night route with a crown on night 8. The boss panel shows The Unlit Crown, phase, and hit points with phase ticks. The score panel shows score, best, chain, and embers. Run gifts list each carried gift with an icon and pip rank against the catalog of 12. Oil, heat, and halo sit in their own panel. A bottom bar of key caps names WASD, LMB, Shift, F, P, and M. There is no relic list because the run has no relics.

`waves.js` writes `state.surge` as each night's script advances. Kills add `state.embers` in `noteHit` (bounty / 90, at least one). The boss and play poses set both so the shots are not zero. P already pauses, so the pause cap matches the key.

Check: `?shot=boss&seed=1` and `?shot=play&seed=1` on port 18811 (8790 is still the egress tunnel). Both JPEGs are 1280×720, under 256 KiB. At 768 px wide the boss HUD still names night, wave, win, lose, the crown, score, best, chain, embers, gifts, oil, heat, halo, and the key caps. No page errors from the shot tool. `02-play.jpg` and `03-boss.jpg` were replaced. Cover and dawn were left as they were.

Do not bind port 8790.

### Session 10 — screenshot scenes

`shots.js` now stages four deterministic scenes. `boss` is night 8, phase 2, The Unlit Crown mid-wedge, nineteen shades, ember darts, hex motes, crown shards, a hit burst, `+95` pops, and `CHAIN x6!`. `play` is night 5 with a sixteen-shade swarm, four carried gifts, and `CHAIN x4!`. `upgrade` is the night-4 gift choice (Ember Fan, Wide Halo, Swift Cloak) over the lit arena. `dawn` (and `end`) is the victory summary.

`ui.js` lightens the gift cards and draws a dawn stat panel: score, best, nights, chain, embers, gifts, oil, a New Best chip, and an Enter restart cap. `render.js` fills the letterbox with the night sky so a 1024×640 capture is not black bars.

`shots.json` is `01-boss.jpg`, `02-play.jpg`, `03-upgrade.jpg`, `04-dawn.jpg`. Old cover, boss, and end files are removed. Captures ran on port 18811 (8790 is still the egress tunnel) through `shot.mjs` at 1024×640, then Pillow JPEG quality 88. Boss 134215 bytes, play 125140, upgrade 66106, dawn 63165. The boss cover shows the full HUD, the crown, the swarm, projectiles, score pops, and the chain callout. The server was killed after the capture.

`MAKEFUN_OUTPUT_DIR=/tmp/bgout node main.ts` exited 0. `dossier.json` is 664788 bytes and holds the four JPEGs plus `game/index.html`.

Do not bind port 8790.

### Session 11 — meta systems

Added `meta.js`, `route.js`, `feats.js`, `records.js`, and `meta-ui.js`.

Difficulty is Apprentice, Journeyman, or Master. Each changes shade count, shade speed, starting oil, and oil burn. The title cycles it with A/D or a click, and the choice is stored on the profile.

Eight permanent unlocks (Spare Wick, Keen Lens, Ash Boots, Ember Purse, Short Cloak, First Bell, Cache Map, Crown Omen) are bought with banked embers. Keys 1–8 or a click on the workshop. Each one changes the next run: burn and oil, dart damage, move speed, ember drops, dash cooldown, starting halo, cache payouts, or the Crown's hit points. The profile is `localStorage` key `ashwell.lantern.meta`. The old best-score key is unchanged.

A run is a road of eight nights. Night 1 is a fight and night 8 is the Crown. Nights 2–7 are a seeded fork. After the gift, the player picks the next node. Elite nights spawn more, faster, richer shades. Cache nights are shorter and pay oil and embers. Rest nights skip the fight and refill oil and embers. The Crown still holds the dawn.

Eight feats are judged when the run ends (kill, chain of 8, clean night, high oil, crown, 40 embers, four gifts, elite plus rest). The letter grade and the top five scores are kept on the profile, and the run's embers join the wallet. Quitting to the title does not bank.

The play HUD names the current node and colors finished nights. Shot poses still leave the route empty, so the cover HUD is unchanged. Gift cards still show when `state.gate` is `gift`.

Check: node imports of the new modules (difficulty math, unlock purchase, route forks, elite spawn count and speed, rest spawn of zero, all eight feats, top-five records). Headless Chrome on `/` and `?shot=play|boss|upgrade|dawn&seed=1` on port 18811 (8790 is still the egress tunnel). No page errors. Each shot set `__shotReady`. A started run announced `Night 1. Fight`. The server was killed after.

Do not bind port 8790.

### Session 12 — final check and commit

`node --check` passed on every `game/src/*.js`. Headless Chrome on port 18811 (8790 is still the egress tunnel): `?shot=start&seed=1` and `?shot=play&seed=1` set `__shotReady`, and Enter on `/` started `Night 1. Fight`. No page exceptions. The only console lines were Chrome's favicon 404 and the headless AudioContext autoplay warning.

`shots.json` lists `01-boss.jpg`, `02-title.jpg`, `03-road.jpg`, `04-victory.jpg`. Each file is 1024×640 and under 256 KiB. Title, road, and victory match the dense start, gift-and-road, and grade screens.

The boss cover right-aligned the node name and then drew `WAVE` with that align, so the word sat off the left of the night panel. `drawNightPanel` sets `textAlign` back to `left` before `WAVE`. Recaptured `01-boss.jpg` (1024×640, 140220 bytes). `WAVE`, `3/3`, and `BOSS` all sit inside the panel.

`MAKEFUN_OUTPUT_DIR=/tmp/bgout node main.ts` exited 0 after the recapture. The dossier is 823721 bytes and holds the four JPEGs plus `game/index.html`. `vendor/makefun-game.ts` is unchanged.

Do not bind port 8790.

