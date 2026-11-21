# Lantern & Tide — a spot the difference game

[![Node](https://img.shields.io/badge/node-%E2%89%A522.18-3c873a?style=flat-square&logo=node.js&logoColor=white)](https://nodejs.org)
[![No dependencies](https://img.shields.io/badge/dependencies-none-4c8bf5?style=flat-square)](package.json)
[![Tests](https://img.shields.io/badge/checks-3_levels_%C3%97_5_seeds_passing-2ea44f?style=flat-square)](test/check_shot.py)
[![License](https://img.shields.io/badge/license-MIT-8957e5?style=flat-square)](LICENSE)

Two pictures of the same scene, side by side. Click the details that changed. Three scenes, six to nine
differences each, a clock that punishes a guess, and a hint that costs ten seconds.

Every pixel is drawn by the game itself with the Canvas 2D API: no image files, no fonts to download, no
libraries, no network request at runtime. A scene is a seeded list of nodes, and both panels are painted
from that same list — panel B is the list with a handful of nodes changed — so the two pictures are
identical everywhere except where a difference sits. That is the whole trick, and it is what the
screenshot check proves on every frame.

## Play it

```sh
node serve.ts          # http://localhost:8080   (no install, no build)
```

`?shot=play`, `?shot=hint`, `?shot=title`, `?shot=victory` open the frames the screenshots were taken
from; `?shot=level&level=1&seed=4` opens any level at any seed.

## The three scenes

| | Scene | Differences | Clock |
|---|---|---|---|
| 1 | Lantern Bazaar — a night market on a harbour boardwalk | 6 | 150s |
| 2 | Tidepool Terrace — a rock pool at low tide | 8 | 165s |
| 3 | Sky Observatory — a telescope deck under the first stars | 9 | 180s |

## How a difference is made

A node offers the mutations it can survive: `hidden` (it is missing in B), `moved` (it slid), `flipped`
(it is mirrored), `swollen` (it grew a quarter), `tinted` (it was repainted). The picker takes nodes in
seeded order, keeps the spots at least 128px apart so the puzzle is a search rather than a clump, and
mixes the mutation types. A node only offers the mutations that change it visibly — a symmetric crate
does not offer `flipped`, and a repaint is refused unless it is far enough from the original colour to
be seen.

## Checks

```sh
node test/model_probe.mjs                                  # each difference really changes its node
python3 test/check_shot.py --sweep 5                       # renders every level at 5 seeds and measures the pixels
python3 test/check_shot.py                                 # one frame, verbose
```

The screenshot check renders a frame in headless Chrome and reads the picture itself:

- both panels are painted, and no panel is a flat colour,
- every difference the frame hides covers at least 90 changed pixels at its own spot,
- nothing else in the frame changed — the panels are the same scene, not two drawings,
- every found-marker is drawn on the spot it claims.

It exits non-zero on a failure, so it gates the screenshots rather than describing them.

## Files

```
main.ts                 hands game/ and screenshots/ to the scorer and writes dossier.json
serve.ts                a development server, Node standard library only
game/index.html         the page: one canvas, nothing else
game/src/main.js        boot, the fixed-step loop, the order the frame is drawn in
game/src/game.js        the rules: clicks, the clock, slips, hints, level flow, scoring
game/src/model.js       the scene node model and the mutations a difference makes
game/src/differences.js choosing the differences a level hides
game/src/render.js      one panel: frame, clipped scene, markers
game/src/hud.js         title strip, clock, found counter, footer
game/src/screens/menu.js the title card and the overlays
game/src/scene/*.js     the three scenes, and the shared drawing helpers
game/src/shots.js       the frames behind ?shot=NAME
test/                   the model probe and the pixel check
```

Licensed under the MIT License — see [LICENSE](LICENSE).
