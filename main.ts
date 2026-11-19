// Leonida Platinum — the entry program (Node 22, standard library only).
// The guide itself is plain static files under app/ (index.html, its modules and
// styles, and data/trophies.json), and the screenshots under screenshots/ are real
// renders of it. This program hands the guide in: it copies app/ and screenshots/
// beside this file to /output and writes /output/dossier.json with the vendored
// make.fun library, which is the summary the judge reads. vendor/makefun-frontend.ts
// stays exactly as the kit shipped it: the scorer rebuilds the dossier with its own
// copy and the two must match byte for byte.
//
// Before copying, it checks the two things that would make the entry invalid on
// its face: app/index.html exists, and screenshots/ holds 3 or 4 images.
// Outside the grader's container, MAKEFUN_OUTPUT_DIR stands in for /output:
//   mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts

import { cpSync, existsSync, mkdirSync, readdirSync, statSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildDossier } from './vendor/makefun-frontend.ts';

const here = fileURLToPath(new URL('.', import.meta.url));
const out = process.env.MAKEFUN_OUTPUT_DIR ?? '/output';

// The trophy data is the heart of the entry: without it the guide is an empty shell.
if (!existsSync(join(here, 'app', 'data', 'trophies.json'))) {
  throw new Error('app/data/trophies.json is missing — the guide has no trophies');
}
if (!existsSync(join(here, 'app', 'index.html'))) {
  throw new Error('app/index.html is missing — the guide has no front page');
}
const shots = readdirSync(join(here, 'screenshots')).filter(
  (name) => !name.startsWith('.') && statSync(join(here, 'screenshots', name)).isFile(),
);
if (shots.length < 3 || shots.length > 4) {
  throw new Error(`screenshots/ holds ${shots.length} images — the gate wants 3 or 4`);
}

mkdirSync(out, { recursive: true });
cpSync(join(here, 'app'), join(out, 'app'), { recursive: true });
mkdirSync(join(out, 'screenshots'), { recursive: true });
if (existsSync(join(here, 'screenshots'))) cpSync(join(here, 'screenshots'), join(out, 'screenshots'), { recursive: true });

// The scorer's own caps (reference/gate.json): only text_max_bytes shapes the bytes; the others refuse an entry the
// scorer would refuse (more than 4 screenshots or one over 256 KiB; more than 993 files and directories in app/ or
// 48 MiB of app files: app/ counts beside /output's own 1000-entry cap, its screenshots/ and dossier.json).
writeFileSync(
  join(out, 'dossier.json'),
  buildDossier(out, { text_max_bytes: 163840, screenshots: { max: 4, max_bytes: 262144 }, app_max_files: 993, app_max_bytes: 50331648 }),
);

console.log(`Leonida Platinum handed in: app/ + ${shots.length} screenshots (${shots.sort().join(', ')}) -> ${out}/dossier.json`);

// The scorer's own caps (reference/gate.json): only text_max_bytes shapes the bytes; the others refuse an entry the
// scorer would refuse (more than 4 screenshots or one over 256 KiB; more than 993 files and directories in app/ or
// 48 MiB of app files: app/ counts beside /output's own 1000-entry cap, its screenshots/ and dossier.json).
writeFileSync(
  join(out, 'dossier.json'),
  buildDossier(out, { text_max_bytes: 163840, screenshots: { max: 4, max_bytes: 262144 }, app_max_files: 993, app_max_bytes: 50331648 }),
);
