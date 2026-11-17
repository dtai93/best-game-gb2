// Ashwell — Lantern of the Last Well.
//
// A twin-stick defense roguelite: one keeper, a round stone arena, and a
// lantern well at the center. Eight nights of moths, hounds, wisps, brutes
// and hexers, a gift between nights, and The Unlit Crown on the last night.
// Dawn is a win. An empty oil cup is a loss.
//
// This file only hands the entry in. It copies game/ and screenshots/ from
// beside itself into the output directory (MAKEFUN_OUTPUT_DIR, or /output in
// the grader) and writes dossier.json with the kit's buildDossier. The caps
// match best-game-01: 160 KiB of source text, at most four screenshots of
// 256 KiB each, and a game tree of at most 993 entries, 48 MiB, and 1000-byte
// paths. vendor/makefun-game.ts stays the kit copy.

import { cpSync, existsSync, mkdirSync, readdirSync, statSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { buildDossier } from './vendor/makefun-game.ts';

const here = import.meta.dirname;
const out = process.env.MAKEFUN_OUTPUT_DIR ?? '/output';
const gameDir = join(here, 'game');
const shotDir = join(here, 'screenshots');
const page = join(gameDir, 'index.html');

if (!existsSync(page) || !statSync(page).isFile()) {
  console.error('Ashwell: game/index.html is missing. Nothing to hand in.');
  process.exit(1);
}

const shotImages = existsSync(shotDir) && statSync(shotDir).isDirectory()
  ? readdirSync(shotDir).filter((name) => !name.startsWith('.') && /\.(png|jpe?g)$/i.test(name))
  : [];

if (shotImages.length === 0) {
  console.warn('Ashwell: screenshots/ is empty. The dossier wants three or four renders.');
} else if (shotImages.length > 4) {
  console.warn(`Ashwell: screenshots/ holds ${shotImages.length} images. The dossier keeps four.`);
}

mkdirSync(out, { recursive: true });
cpSync(gameDir, join(out, 'game'), { recursive: true, force: true });
mkdirSync(join(out, 'screenshots'), { recursive: true });
if (existsSync(shotDir)) cpSync(shotDir, join(out, 'screenshots'), { recursive: true, force: true });

const dossier = buildDossier(out, {
  text_max_bytes: 163840,
  screenshots: { max: 4, max_bytes: 262144 },
  game_max_files: 993,
  game_max_bytes: 50331648,
  game_path_max_bytes: 1000,
});

writeFileSync(join(out, 'dossier.json'), dossier);
console.log(`Ashwell: dossier ${dossier.byteLength} bytes, ${shotImages.length} screenshots, out ${out}`);
