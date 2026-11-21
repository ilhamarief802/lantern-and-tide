// Pointer and keyboard handling: turns a click or tap on the canvas into a playfield coordinate, asks
// the game what it meant, and answers with the right sound. The canvas is letterboxed inside the
// window, so every event is first mapped back into the fixed 1280x720 frame.

import { FRAME } from './config.js';
import { HINT_BUTTON } from './hud.js';
import { panelAt, panelRect } from './render.js';

export function createInput({ canvas, game, audio, onAdvance }) {
  function toFrame(event) {
    const bounds = canvas.getBoundingClientRect();
    const scale = Math.min(bounds.width / FRAME.width, bounds.height / FRAME.height);
    const offsetX = (bounds.width - FRAME.width * scale) / 2;
    const offsetY = (bounds.height - FRAME.height * scale) / 2;
    return {
      x: (event.clientX - bounds.left - offsetX) / scale,
      y: (event.clientY - bounds.top - offsetY) / scale,
    };
  }

  function inside(rect, point) {
    return point.x >= rect.x && point.x <= rect.x + rect.width && point.y >= rect.y && point.y <= rect.y + rect.height;
  }

  canvas.addEventListener('pointerdown', (event) => {
    audio.unlock();
    const point = toFrame(event);
    const state = game.state;
    if (state.mode === 'play') {
      if (inside(HINT_BUTTON, point)) {
        if (game.useHint() === 'hint') audio.play('hint');
        return;
      }
      const side = panelAt(point.x, point.y);
      if (!side) return;
      const rect = panelRect(side);
      const scenePoint = {
        x: ((point.x - rect.x) / rect.width) * state.scene.width,
        y: ((point.y - rect.y) / rect.height) * state.scene.height,
      };
      const outcome = game.click(point.x, point.y, scenePoint);
      if (outcome === 'found') audio.play('found');
      else if (outcome === 'miss') audio.play('miss');
      else if (outcome === 'over') audio.play('over');
      return;
    }
    onAdvance();
    audio.play('click');
  });

  canvas.addEventListener('pointermove', (event) => {
    const point = toFrame(event);
    const state = game.state;
    const overHint = state.mode === 'play' && inside(HINT_BUTTON, point);
    const overPanel = panelAt(point.x, point.y);
    state.focused = overPanel;
    canvas.style.cursor = overHint || overPanel ? 'pointer' : 'default';
  });

  canvas.addEventListener('pointerleave', () => {
    game.state.focused = null;
  });

  globalThis.addEventListener('keydown', (event) => {
    audio.unlock();
    const state = game.state;
    if (event.key === 'h' || event.key === 'H') {
      if (state.mode === 'play' && game.useHint() === 'hint') audio.play('hint');
      return;
    }
    if (event.key === 'm' || event.key === 'M') {
      audio.toggleMute();
      return;
    }
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      if (state.mode === 'play') return;
      onAdvance();
      audio.play('click');
      return;
    }
    if (event.key === 'r' || event.key === 'R') {
      state.totalScore = 0;
      game.beginLevel(0);
      audio.play('click');
    }
  });

  return { advanceLabel: 'continue' };
}
