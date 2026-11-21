// The entry point (Node 22, standard library and erasable TypeScript only): hands the game to the
// scorer. The game is this directory's game/ folder — plain static files a desktop browser loads with
// no network at all — and the four screenshots beside it. Everything is copied to the output directory
// and summarised in dossier.json by the vendored make.fun library, which the scorer runs again byte for
// byte and requires to match.
//
//   outside the grader's container: mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts
//   play it locally:                node serve.ts   (then open http://localhost:8080)

import { cpSync, existsSync, mkdirSync, readdirSync, statSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildDossier } from './vendor/makefun-game.ts';

const here = fileURLToPath(new URL('.', import.meta.url));
const out = process.env.MAKEFUN_OUTPUT_DIR ?? '/output';

/** The scorer's own caps, from its reference/gate.json: more than four screenshots, one over 256 KiB,
 *  more than 993 files under game/ or 48 MiB of them, or a path under game/ over 1000 bytes is refused. */
const CAPS = {
  text_max_bytes: 163840,
  screenshots: { max: 4, max_bytes: 262144 },
  game_max_files: 993,
  game_max_bytes: 50331648,
  game_path_max_bytes: 1000,
};

/** Copies a directory and says how many files and bytes it moved, so the run reports what it handed in. */
function copyTree(from, to) {
  cpSync(from, to, { recursive: true });
  let files = 0;
  let bytes = 0;
  const walk = (dir) => {
    for (const entry of readdirSync(dir)) {
      const path = join(dir, entry);
      const info = statSync(path);
      if (info.isDirectory()) walk(path);
      else {
        files += 1;
        bytes += info.size;
      }
    }
  };
  walk(to);
  return { files, bytes };
}

if (!existsSync(join(here, 'game', 'index.html'))) {
  console.error('main.ts: no game/index.html beside this file — run it from the repository root.');
  process.exit(1);
}

mkdirSync(out, { recursive: true });
const game = copyTree(join(here, 'game'), join(out, 'game'));

let shots = { files: 0, bytes: 0 };
if (existsSync(join(here, 'screenshots'))) {
  mkdirSync(join(out, 'screenshots'), { recursive: true });
  shots = copyTree(join(here, 'screenshots'), join(out, 'screenshots'));
}

const dossier = buildDossier(out, CAPS);
writeFileSync(join(out, 'dossier.json'), dossier);

console.log(`game:        ${game.files} files, ${(game.bytes / 1024).toFixed(1)} KiB`);
console.log(`screenshots: ${shots.files} files, ${(shots.bytes / 1024).toFixed(1)} KiB`);
console.log(`dossier:     ${Buffer.byteLength(dossier)} bytes`);
console.log(`handed in to ${out}`);
