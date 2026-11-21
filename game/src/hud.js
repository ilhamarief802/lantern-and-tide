// The chrome around the pictures: the title strip, the clock, the found counter, the remaining-spot
// dots and the hint button. It draws in the fixed 1280x720 frame, so the layout is the same at every
// window size.

import { FONT, FONT_NUM, FRAME, HUD, PALETTE, PANEL, RULES } from './config.js';
import { circle, fade, fillRound, glow, label, strokeRound } from './scene/brush.js';

export const HINT_BUTTON = { x: 1120, y: 604, width: 132, height: 52 };

/** mm:ss, never negative. */
export function clockText(seconds) {
  const total = Math.max(0, Math.ceil(seconds));
  const minutes = Math.floor(total / 60);
  const rest = total % 60;
  return `${minutes}:${String(rest).padStart(2, '0')}`;
}

function drawClock(ctx, state) {
  const x = 1178;
  const y = 50;
  const ratio = Math.max(0, Math.min(1, state.timeLeft / RULES.startSeconds));
  const colour = ratio < 0.2 ? PALETTE.bad : ratio < 0.45 ? PALETTE.accent : PALETTE.sea;
  ctx.save();
  ctx.beginPath();
  ctx.arc(x, y + 1, 21, 0, Math.PI * 2);
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.12)';
  ctx.lineWidth = 4;
  ctx.stroke();
  ctx.beginPath();
  ctx.arc(x, y + 1, 21, -Math.PI / 2, -Math.PI / 2 + ratio * Math.PI * 2);
  ctx.strokeStyle = colour;
  ctx.lineWidth = 4;
  ctx.lineCap = 'round';
  ctx.stroke();
  ctx.restore();
  label(ctx, clockText(state.timeLeft), x + 34, y + 1, {
    size: 25,
    weight: 700,
    colour: state.timeLeft <= 15 ? PALETTE.bad : PALETTE.ink,
    align: 'left',
    font: FONT_NUM,
  });
}

function drawCounter(ctx, state) {
  const found = state.found.length;
  const total = state.differences.length;
  const x = 852;
  const y = 30;
  fillRound(ctx, x, y, 214, 46, 12, 'rgba(255, 255, 255, 0.055)');
  ctx.strokeStyle = fade(PALETTE.panelEdge, 0.75);
  ctx.lineWidth = 1;
  ctx.strokeRect(x + 0.5, y + 0.5, 213, 45);
  label(ctx, 'FOUND', x + 18, y + 23, { size: 10.5, weight: 700, colour: PALETTE.dim, align: 'left', track: 1.8 });
  label(ctx, String(found), x + 76, y + 22, { size: 26, weight: 800, colour: PALETTE.good, align: 'left', font: FONT_NUM });
  label(ctx, `/ ${total}`, x + 100, y + 25, { size: 15, weight: 600, colour: PALETTE.dim, align: 'left', font: FONT_NUM });
  // A row of pips: one per difference, filled as it is found.
  for (let index = 0; index < total; index += 1) {
    const pipX = x + 142 + index * 9;
    const done = index < found;
    circle(ctx, pipX, y + 23, 2.6, done ? PALETTE.good : 'rgba(255, 255, 255, 0.18)');
  }
}

function drawBrand(ctx, state) {
  // A small hanging lantern as the mark.
  glow(ctx, 50, 52, 34, 'rgba(255, 190, 110, 0.35)');
  circle(ctx, 50, 52, 9, PALETTE.accent);
  ctx.strokeStyle = fade('#2a1c10', 0.6);
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(50, 41);
  ctx.lineTo(50, 37);
  ctx.stroke();
  label(ctx, 'SPOT THE DIFFERENCE', 74, 44, {
    size: 21,
    weight: 800,
    colour: PALETTE.ink,
    align: 'left',
    track: 1.2,
  });
  label(ctx, `LANTERN & TIDE  ·  LEVEL ${state.levelIndex + 1} OF ${state.levelCount}  ·  ${state.level.name.toUpperCase()}`, 74, 68, {
    size: 11.5,
    weight: 600,
    colour: fade(PALETTE.accent, 0.85),
    align: 'left',
    track: 1.4,
  });
}

function drawFooter(ctx, state, time) {
  const y = HUD.footerY;
  // Message: what the last click did.
  const message = state.message ?? 'Click a difference in either picture.';
  const tone = state.messageTone === 'bad' ? PALETTE.bad : state.messageTone === 'good' ? PALETTE.good : PALETTE.dim;
  label(ctx, message, 28, y + 18, { size: 14, weight: 600, colour: tone, align: 'left' });

  // Mistakes left, as small diamonds.
  label(ctx, 'SLIPS', 28, y + 54, { size: 10.5, weight: 700, colour: PALETTE.dim, align: 'left', track: 1.8 });
  for (let index = 0; index < RULES.maxMistakes; index += 1) {
    const x = 76 + index * 16;
    const spent = index < state.missCount;
    ctx.save();
    ctx.translate(x, y + 54);
    ctx.rotate(Math.PI / 4);
    ctx.fillStyle = spent ? fade(PALETTE.bad, 0.9) : 'rgba(255, 255, 255, 0.16)';
    ctx.fillRect(-4, -4, 8, 8);
    ctx.restore();
  }

  // Remaining spots, spelled out: the number a player watches.
  const left = state.differences.length - state.found.length;
  label(ctx, left === 0 ? 'ALL FOUND' : `${left} LEFT TO FIND`, PANEL.right.x, y + 18, {
    size: 15,
    weight: 800,
    colour: left === 0 ? PALETTE.good : PALETTE.ink,
  });
  // A segment per difference under that line: the same count, read at a glance.
  const barWidth = 132;
  const segment = barWidth / state.differences.length;
  for (let index = 0; index < state.differences.length; index += 1) {
    const done = index < state.found.length;
    fillRound(ctx, PANEL.right.x + index * segment, y + 30, segment - 3, 5, 2.5, done ? PALETTE.good : 'rgba(255, 255, 255, 0.14)');
  }
  label(ctx, 'H hint   M mute   R restart', PANEL.right.x + barWidth + 22, y + 32, {
    size: 11,
    weight: 500,
    colour: fade(PALETTE.dim, 0.75),
    align: 'left',
  });

  // Hint button.
  const button = HINT_BUTTON;
  const ready = state.hintCooldown <= 0 && left > 0;
  fillRound(ctx, button.x, button.y, button.width, button.height, 12, ready ? 'rgba(255, 207, 107, 0.14)' : 'rgba(255, 255, 255, 0.04)');
  strokeRound(ctx, button.x, button.y, button.width, button.height, 12, ready ? fade(PALETTE.accent, 0.7) : 'rgba(255, 255, 255, 0.10)', 1.2);
  label(ctx, 'HINT', button.x + 46, button.y + 21, {
    size: 14,
    weight: 800,
    colour: ready ? PALETTE.accent : PALETTE.dim,
    align: 'left',
    track: 1.6,
  });
  label(ctx, ready ? `−${RULES.hintPenalty}s` : `${Math.ceil(state.hintCooldown)}s`, button.x + 46, button.y + 37, {
    size: 11,
    weight: 600,
    colour: fade(ready ? PALETTE.accent : PALETTE.dim, 0.75),
    align: 'left',
    font: FONT_NUM,
  });
  // Keyboard chip.
  fillRound(ctx, button.x + button.width - 38, button.y + 14, 24, 24, 6, 'rgba(255, 255, 255, 0.08)');
  label(ctx, 'H', button.x + button.width - 26, button.y + 26.5, { size: 12, weight: 800, colour: PALETTE.dim, font: FONT_NUM });

  // Score, bottom left corner of the footer band.
  label(ctx, `SCORE ${state.score}`, 28, y + 88, { size: 12, weight: 700, colour: fade(PALETTE.dim, 0.9), align: 'left', font: FONT_NUM });
}

/** Draws the whole chrome: title, clock, counter, footer. The panels sit between them. */
export function drawChrome(ctx, state, time) {
  // Background wash and a faint grid, so the frame feels like a table rather than a void.
  ctx.fillStyle = PALETTE.night;
  ctx.fillRect(0, 0, FRAME.width, FRAME.height);
  const wash = ctx.createRadialGradient(FRAME.width / 2, 300, 120, FRAME.width / 2, 300, 780);
  wash.addColorStop(0, 'rgba(42, 54, 96, 0.55)');
  wash.addColorStop(1, 'rgba(10, 13, 26, 0)');
  ctx.fillStyle = wash;
  ctx.fillRect(0, 0, FRAME.width, FRAME.height);

  ctx.save();
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.028)';
  ctx.lineWidth = 1;
  for (let x = 0; x < FRAME.width; x += 40) {
    ctx.beginPath();
    ctx.moveTo(x + 0.5, 0);
    ctx.lineTo(x + 0.5, FRAME.height);
    ctx.stroke();
  }
  for (let y = 0; y < FRAME.height; y += 40) {
    ctx.beginPath();
    ctx.moveTo(0, y + 0.5);
    ctx.lineTo(FRAME.width, y + 0.5);
    ctx.stroke();
  }
  ctx.restore();

  drawBrand(ctx, state);
  drawCounter(ctx, state);
  drawClock(ctx, state);
  drawFooter(ctx, state, time);

  // A hairline under the header.
  ctx.fillStyle = 'rgba(255, 255, 255, 0.06)';
  ctx.fillRect(28, 92, FRAME.width - 56, 1);
}
