// Boot: the canvas, the fixed-step loop, and the order the frame is drawn in. The playfield is always
// 1280x720 logical pixels, letterboxed into the window and scaled by the device pixel ratio, so a
// screenshot at 1280x720 and a maximised window show the same game, only larger.

import { createAudio } from './audio.js';
import { FRAME, PALETTE } from './config.js';
import { createEffects, drawEffects, updateEffects, confetti, ringPulse } from './effects.js';
import { createGame } from './game.js';
import { drawChrome } from './hud.js';
import { createInput } from './input.js';
import { LEVELS } from './level-data.js';
import { makeRandom } from './random.js';
import { drawPanel } from './render.js';
import { applyShot, seedFromQuery, shotName } from './shots.js';
import { drawGameOver, drawLevelClear, drawTitle, drawVictory } from './screens/menu.js';

const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d', { alpha: false });
const status = document.getElementById('status');

const seed = seedFromQuery(20261121);
const game = createGame(makeRandom(seed));
const audio = createAudio();
const previews = LEVELS.map((level) => level.build(makeRandom(seed + level.count * 31)));

let lastTime = 0;
let time = 0;
let shakeFor = 0;

function resize() {
  const ratio = Math.min(globalThis.devicePixelRatio || 1, 2);
  const bounds = canvas.getBoundingClientRect();
  const width = Math.round(bounds.width * ratio);
  const height = Math.round(bounds.height * ratio);
  if (canvas.width !== width || canvas.height !== height) {
    canvas.width = width;
    canvas.height = height;
  }
}

function announce(text) {
  if (status && status.textContent !== text) status.textContent = text;
}

function draw() {
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.fillStyle = PALETTE.night;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  const scale = Math.min(canvas.width / FRAME.width, canvas.height / FRAME.height);
  const offsetX = (canvas.width - FRAME.width * scale) / 2;
  const offsetY = (canvas.height - FRAME.height * scale) / 2;
  ctx.setTransform(scale, 0, 0, scale, offsetX, offsetY);

  const state = game.state;
  if (state.mode === 'title') {
    drawTitle(ctx, previews, time);
    return;
  }

  const shake = shakeFor > 0 ? Math.sin(time * 90) * shakeFor * 4 : 0;
  ctx.save();
  ctx.translate(shake, 0);
  drawChrome(ctx, state, time);
  // The markers age against the level clock, the same clock a find is stamped with.
  const clock = state.levelElapsed;
  const view = {
    scene: state.scene,
    differences: state.differences,
    found: state.found,
    misses: state.misses,
    hint: state.hint,
    pulse: 0.5 + Math.sin(time * 3) * 0.5,
    focused: state.focused,
  };
  drawPanel(ctx, 'a', view, clock);
  drawPanel(ctx, 'b', { ...view, scene: state.variant }, clock);
  drawEffects(ctx, state.effects);
  ctx.restore();

  if (state.mode === 'levelClear') drawLevelClear(ctx, state);
  else if (state.mode === 'over') drawGameOver(ctx, state);
  else if (state.mode === 'victory') drawVictory(ctx, state);
}

function step(dt) {
  const state = game.state;
  const before = state.mode;
  const foundBefore = state.found.length;
  game.update(dt);
  updateEffects(state.effects, dt);
  if (state.found.length > foundBefore) shakeFor = 0.12;
  shakeFor = Math.max(0, shakeFor - dt * 3);
  if (state.mode !== before) {
    if (state.mode === 'levelClear') {
      audio.play('level');
      confetti(state.effects, FRAME.width, 70);
      for (const index of state.found) {
        const difference = state.differences[index];
        if (difference) ringPulse(state.effects, difference.spot.x, difference.spot.y, PALETTE.good, 60, 1.1);
      }
    }
    if (state.mode === 'over') audio.play('over');
    if (state.mode === 'victory') {
      audio.play('level');
      confetti(state.effects, FRAME.width, 140);
    }
  }
  announce(
    state.mode === 'play'
      ? `${state.found.length} of ${state.differences.length} differences found. ${Math.ceil(state.timeLeft)} seconds left.`
      : state.mode === 'title'
        ? 'Spot the Difference: click anywhere to start a three level game.'
        : state.message,
  );
  time += dt;
}

function onAdvance() {
  if (game.state.mode === 'title') {
    game.beginLevel(0);
    return;
  }
  game.advance();
}

createInput({ canvas, game, audio, onAdvance });

function frame(now) {
  const dt = lastTime === 0 ? 1 / 60 : Math.min(0.05, (now - lastTime) / 1000);
  lastTime = now;
  resize();
  step(dt);
  draw();
  requestAnimationFrame(frame);
}

const shot = shotName();
if (shot) {
  applyShot(game, shot);
  // ?hide=<nodeId> erases one node from both panels: a debugging aid that also proves a node is what
  // draws the pixels it claims (test/check_shot.py diffs the two frames).
  const hideId = new URLSearchParams(globalThis.location.search).get('hide');
  if (hideId) {
    for (const model of [game.state.scene, game.state.variant]) {
      const node = model?.nodes.find((candidate) => candidate.id === hideId);
      if (node) node.hidden = true;
    }
  }
  time = 1.2;
  resize();
  draw();
  // A couple of animation steps so effects and markers are where the game would have them.
  for (let index = 0; index < 3; index += 1) {
    updateEffects(game.state.effects, 1 / 60);
    draw();
  }
  // The frame's own data, for the screenshot checker: where each difference sits and which were found.
  const info = document.getElementById('shot-info');
  if (info) {
    info.textContent = JSON.stringify({
      shot,
      level: game.state.level.id,
      differences: game.state.differences.map((difference) => ({
        x: Math.round(difference.spot.x),
        y: Math.round(difference.spot.y),
        mutation: difference.mutation,
        tag: difference.tag,
      })),
      found: game.state.found.map((index) => ({
        x: Math.round(game.state.differences[index].spot.x),
        y: Math.round(game.state.differences[index].spot.y),
      })),
      hiddenInB: game.state.variant.nodes.filter((node) => node.hidden).map((node) => node.id),
      movedInB: game.state.variant.nodes.filter((node) => node.dx || node.dy).map((node) => node.id),
      tintedInB: game.state.variant.nodes.filter((node) => node.tint).map((node) => node.id),
      flippedInB: game.state.variant.nodes.filter((node) => node.sx !== 1 || node.sy !== 1).map((node) => `${node.id}:${node.sx}x${node.sy}`),
    });
  }
  globalThis.__shotReady = true;
} else {
  resize();
  game.openTitle();
  requestAnimationFrame(frame);
}

globalThis.addEventListener('resize', () => {
  resize();
  draw();
});
