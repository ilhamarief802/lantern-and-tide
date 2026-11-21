// The frames behind ?shot=NAME. Each one puts the game into a real state — a level in progress with so
// many differences found, an overlay after a level, the title card — and then leaves it there, so a
// screenshot is the game as it is played rather than a mock-up of it.

import { LEVELS } from './level-data.js';

/** Marks the given difference indexes found, with the time each was clicked. */
function markFound(state, indexes, since = 1.6) {
  indexes.forEach((index, order) => {
    const difference = state.differences[index];
    if (!difference) return;
    state.found.push(index);
    difference.foundAt = state.levelElapsed - since - order * 0.9;
  });
  state.score = state.found.length * 120;
}

export function applyShot(game, name) {
  const state = game.state;
  switch (name) {
    case 'title':
      game.openTitle();
      return state;
    case 'level': {
      // ?shot=level&level=1 — any level, for the screenshot checker's sweep.
      const wanted = Number(new URLSearchParams(globalThis.location?.search ?? '').get('level'));
      game.beginLevel(Number.isFinite(wanted) && wanted >= 0 && wanted < LEVELS.length ? wanted : 0);
      state.levelElapsed = 20;
      state.timeLeft = Math.round(state.level.seconds * 0.7);
      markFound(state, [0, 1, 2].filter((index) => index < state.differences.length), 12);
      return state;
    }
    case 'play': {
      game.beginLevel(0);
      state.levelElapsed = 53.4;
      state.timeLeft = 97;
      markFound(state, [2, 5, 0]);
      state.message = 'Found it — the lantern changed colour. +120';
      state.messageTone = 'good';
      state.hintCooldown = 0;
      return state;
    }
    case 'hint': {
      game.beginLevel(2);
      state.levelElapsed = 66.2;
      state.timeLeft = 84;
      markFound(state, [0, 3, 4, 6, 7]);
      const open = state.differences
        .map((difference, index) => ({ difference, index }))
        .filter((entry) => !state.found.includes(entry.index));
      if (open.length > 0) {
        state.hint = { x: open[0].difference.spot.x, y: open[0].difference.spot.y, time: state.levelElapsed - 0.8 };
      }
      state.message = 'Hint: something on the left of the picture has shifted. −10s';
      state.messageTone = 'dim';
      return state;
    }
    case 'clear': {
      game.beginLevel(0);
      state.levelElapsed = 62;
      state.timeLeft = 88;
      markFound(state, [0, 1, 2, 3, 4, 5], 40);
      state.score = 6 * 120 + Math.round(88) * 6 + 500;
      state.clearedAt = 62;
      state.mode = 'levelClear';
      return state;
    }
    case 'over': {
      game.beginLevel(1);
      state.levelElapsed = 40;
      state.timeLeft = 0;
      markFound(state, [1, 4, 6], 12);
      state.missCount = 3;
      state.mode = 'over';
      state.overReason = 'time';
      state.totalScore = 1240;
      return state;
    }
    case 'victory': {
      game.beginLevel(2);
      state.levelElapsed = 96;
      state.timeLeft = 54;
      markFound(state, [0, 1, 2, 3, 4, 5, 6, 7, 8], 30);
      state.score = 9 * 120 + 54 * 6 + 500;
      state.totalScore = 4860;
      state.best = 4860;
      state.missCount = 0;
      state.mode = 'victory';
      return state;
    }
    default:
      return state;
  }
}

/** The three previews the title card paints, one per level, from a fixed seed each. */
export function shotName() {
  const params = new URLSearchParams(globalThis.location?.search ?? '');
  return params.get('shot');
}

export function seedFromQuery(fallback = 7) {
  const params = new URLSearchParams(globalThis.location?.search ?? '');
  const seed = Number(params.get('seed'));
  return Number.isFinite(seed) && seed > 0 ? seed : fallback;
}

export { LEVELS };
