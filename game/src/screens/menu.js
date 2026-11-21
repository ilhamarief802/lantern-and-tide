// The screens around the game itself: the title card with its three level previews, and the overlays
// that close a level, a run or a whole game. Each overlay is a card over the dimmed playfield, so the
// player keeps their bearings.

import { FONT, FONT_NUM, FRAME, PALETTE, RULES } from '../config.js';
import { LEVELS } from '../level-data.js';
import { paintScene } from '../model.js';
import { circle, fade, fillRound, glow, label, strokeRound } from '../scene/brush.js';

const CARD = { x: 250, y: 96, width: 780, height: 520 };

/** A scene painted into a small rounded card, used as each level's preview. */
export function drawPreview(ctx, scene, x, y, width, height, radius) {
  ctx.save();
  ctx.beginPath();
  ctx.roundRect(x, y, width, height, radius);
  ctx.clip();
  ctx.translate(x, y);
  ctx.scale(width / scene.width, height / scene.height);
  paintScene(ctx, scene);
  ctx.restore();
  const shade = ctx.createLinearGradient(x, y + height * 0.45, x, y + height);
  shade.addColorStop(0, 'rgba(6, 8, 18, 0)');
  shade.addColorStop(1, 'rgba(6, 8, 18, 0.9)');
  ctx.save();
  ctx.beginPath();
  ctx.roundRect(x, y, width, height, radius);
  ctx.clip();
  ctx.fillStyle = shade;
  ctx.fillRect(x, y + height * 0.45, width, height * 0.55);
  ctx.restore();
}

export function drawTitle(ctx, previews, time) {
  ctx.save();
  const wash = ctx.createLinearGradient(0, 0, 0, FRAME.height);
  wash.addColorStop(0, 'rgba(9, 12, 26, 0.94)');
  wash.addColorStop(0.5, 'rgba(10, 14, 30, 0.86)');
  wash.addColorStop(1, 'rgba(6, 8, 18, 0.96)');
  ctx.fillStyle = wash;
  ctx.fillRect(0, 0, FRAME.width, FRAME.height);
  ctx.restore();

  glow(ctx, 640, 96, 330, 'rgba(255, 190, 110, 0.10)');
  label(ctx, 'LANTERN & TIDE', 640, 86, { size: 12, weight: 800, colour: fade(PALETTE.accent, 0.9), track: 6 });
  label(ctx, 'SPOT THE DIFFERENCE', 640, 132, { size: 46, weight: 800, colour: PALETTE.ink, track: 1 });
  label(ctx, 'Two pictures, one scene painted twice. Click the details that changed.', 640, 172, {
    size: 15,
    weight: 500,
    colour: PALETTE.dim,
  });

  const cardWidth = 236;
  const gap = 26;
  const startX = (FRAME.width - (cardWidth * 3 + gap * 2)) / 2;
  previews.forEach((preview, index) => {
    const x = startX + index * (cardWidth + gap);
    const y = 206;
    const imageHeight = 150;
    const footerHeight = 52;
    const level = LEVELS[index];
    // The picture on top, a solid footer under it: a label laid over the art is a label nobody reads.
    drawPreview(ctx, preview, x, y, cardWidth, imageHeight, 12);
    ctx.save();
    ctx.beginPath();
    ctx.roundRect(x, y + imageHeight - 12, cardWidth, footerHeight + 12, [0, 0, 12, 12]);
    ctx.fillStyle = 'rgba(12, 17, 32, 0.96)';
    ctx.fill();
    ctx.restore();
    strokeRound(ctx, x, y, cardWidth, imageHeight + footerHeight, 12, fade(PALETTE.panelEdge, 0.9), 1.2);
    label(ctx, `LEVEL ${index + 1}`, x + 16, y + imageHeight + 16, { size: 10, weight: 800, colour: fade(PALETTE.accent, 0.95), align: 'left', track: 2 });
    label(ctx, level.name, x + 16, y + imageHeight + 34, { size: 17, weight: 700, colour: PALETTE.ink, align: 'left' });
    // The count sits in the footer, beside the name, clear of the artwork.
    label(ctx, `${level.count} differences`, x + cardWidth - 16, y + imageHeight + 34, {
      size: 10.5,
      weight: 700,
      colour: fade(PALETTE.dim, 0.95),
      align: 'right',
    });
  });

  // The three rules of the game, as one line each.
  const rules = [
    ['CLICK', 'a changed detail in either picture'],
    ['HINT', `the H key points one out for −${RULES.hintPenalty}s`],
    ['CLOCK', `${RULES.startSeconds}s per level, a slip costs ${RULES.wrongClickPenalty}s`],
  ];
  rules.forEach(([head, text], index) => {
    const x = 300 + index * 230;
    fillRound(ctx, x, 424, 200, 54, 10, 'rgba(255, 255, 255, 0.06)');
    label(ctx, head, x + 16, 442, { size: 10, weight: 800, colour: fade(PALETTE.accent, 0.95), align: 'left', track: 1.8 });
    label(ctx, text, x + 16, 461, { size: 11.5, weight: 500, colour: fade(PALETTE.ink, 0.78), align: 'left' });
  });

  const pulse = 0.55 + Math.sin(time * 2.4) * 0.25;
  fillRound(ctx, 480, 504, 320, 48, 24, `rgba(255, 207, 107, ${0.14 + pulse * 0.12})`);
  strokeRound(ctx, 480, 504, 320, 48, 24, fade(PALETTE.accent, 0.55 + pulse * 0.3), 1.4);
  label(ctx, 'CLICK ANYWHERE TO START', 640, 529, { size: 14, weight: 800, colour: PALETTE.accent, track: 1.6 });
  label(ctx, 'M mutes the sound  ·  R restarts the run', 640, 578, { size: 11.5, weight: 500, colour: fade(PALETTE.ink, 0.55) });
}

function card(ctx, alpha = 0.94) {
  fillRound(ctx, CARD.x, CARD.y, CARD.width, CARD.height, 18, `rgba(10, 14, 28, ${alpha})`);
  strokeRound(ctx, CARD.x, CARD.y, CARD.width, CARD.height, 18, fade(PALETTE.panelEdge, 0.9), 1.4);
}

function scrim(ctx, alpha) {
  ctx.fillStyle = `rgba(4, 6, 14, ${alpha})`;
  ctx.fillRect(0, 0, FRAME.width, FRAME.height);
}

function button(ctx, x, y, width, text, tone = PALETTE.accent) {
  fillRound(ctx, x, y, width, 50, 12, fade(tone, 0.16));
  strokeRound(ctx, x, y, width, 50, 12, fade(tone, 0.55), 1.3);
  label(ctx, text, x + width / 2, y + 25, { size: 13.5, weight: 800, colour: tone, track: 1.4 });
}

export function drawLevelClear(ctx, state) {
  scrim(ctx, 0.62);
  card(ctx);
  label(ctx, `LEVEL ${state.levelIndex + 1} CLEAR`, 640, 178, { size: 12, weight: 800, colour: fade(PALETTE.good, 0.95), track: 4 });
  label(ctx, state.level.name, 640, 226, { size: 40, weight: 800, colour: PALETTE.ink });
  label(ctx, `All ${state.differences.length} differences found in ${Math.round(state.clearedAt)}s`, 640, 268, {
    size: 15,
    weight: 500,
    colour: PALETTE.dim,
  });

  const rows = [
    ['Finding the differences', RULES.pointsPerFind * state.differences.length],
    ['Time left on the clock', Math.round(state.timeLeft) * RULES.pointsPerSecondLeft],
    ['No slips bonus', state.missCount === 0 ? RULES.bonusForPerfect : 0],
  ];
  rows.forEach(([text, points], index) => {
    const y = 322 + index * 34;
    label(ctx, text, 380, y, { size: 14, weight: 500, colour: fade(PALETTE.dim, 0.95), align: 'left' });
    label(ctx, `+${points}`, 900, y, { size: 15, weight: 700, colour: PALETTE.ink, align: 'right', font: FONT_NUM });
    ctx.fillStyle = 'rgba(255, 255, 255, 0.06)';
    ctx.fillRect(380, y + 17, 520, 1);
  });
  label(ctx, 'LEVEL SCORE', 380, 438, { size: 11, weight: 800, colour: fade(PALETTE.dim, 0.9), align: 'left', track: 2 });
  label(ctx, String(state.score), 900, 436, { size: 30, weight: 800, colour: PALETTE.accent, align: 'right', font: FONT_NUM });
  button(ctx, 490, 528, 300, 'NEXT LEVEL  →');
}

export function drawGameOver(ctx, state) {
  scrim(ctx, 0.86);
  card(ctx);
  label(ctx, 'TIME', 640, 178, { size: 12, weight: 800, colour: fade(PALETTE.bad, 0.95), track: 4 });
  label(ctx, state.overReason === 'slips' ? 'Six slips' : 'The clock ran out', 640, 224, { size: 34, weight: 800, colour: PALETTE.ink });
  label(ctx, `You found ${state.found.length} of ${state.differences.length} on level ${state.levelIndex + 1}.`, 640, 266, {
    size: 15,
    weight: 500,
    colour: PALETTE.dim,
  });
  // Show where the ones you missed were hiding — the lesson of the round.
  state.differences.forEach((difference, index) => {
    if (state.found.includes(index)) return;
    const tone = PALETTE.accent;
    circle(ctx, 430 + index * 34, 330, 12, fade(tone, 0.16));
    ctx.beginPath();
    ctx.arc(430 + index * 34, 330, 12, 0, Math.PI * 2);
    ctx.strokeStyle = fade(tone, 0.7);
    ctx.lineWidth = 1.4;
    ctx.stroke();
  });
  label(ctx, 'the spots you missed are ringed in the pictures behind this card', 640, 372, {
    size: 12,
    weight: 500,
    colour: fade(PALETTE.dim, 0.85),
  });
  button(ctx, 490, 470, 300, 'TRY AGAIN  ↺', PALETTE.bad);
  label(ctx, `Best score so far: ${state.best}`, 640, 560, { size: 12, weight: 600, colour: fade(PALETTE.dim, 0.9) });
}

export function drawVictory(ctx, state) {
  scrim(ctx, 0.86);
  card(ctx);
  // The glow is clipped to the card, so it lights the card instead of bleeding over its rounded corner.
  ctx.save();
  ctx.beginPath();
  ctx.roundRect(CARD.x, CARD.y, CARD.width, CARD.height, 18);
  ctx.clip();
  glow(ctx, 640, 196, 150, 'rgba(92, 225, 160, 0.16)');
  ctx.restore();
  label(ctx, 'ALL THREE PICTURES CLEARED', 640, 172, { size: 12, weight: 800, colour: fade(PALETTE.good, 0.95), track: 3.4 });
  label(ctx, 'Sharp eyes!', 640, 224, { size: 44, weight: 800, colour: PALETTE.ink });
  const stats = [
    ['Total score', String(state.totalScore)],
    ['Best score', String(state.best)],
    ['Slips this run', String(state.missCount)],
  ];
  stats.forEach(([text, value], index) => {
    const x = 340 + index * 200;
    fillRound(ctx, x, 280, 176, 74, 12, 'rgba(255, 255, 255, 0.045)');
    label(ctx, text, x + 88, 302, { size: 10.5, weight: 700, colour: PALETTE.dim, track: 1.4 });
    label(ctx, value, x + 88, 328, { size: 24, weight: 800, colour: PALETTE.accent, font: FONT_NUM });
  });
  const total = LEVELS.reduce((sum, level) => sum + level.count, 0);
  label(ctx, `All ${total} differences across the three pictures, ${state.missCount === 0 ? 'without a single slip' : `with ${state.missCount} slip${state.missCount === 1 ? '' : 's'}`}.`, 640, 396, {
    size: 12.5,
    weight: 500,
    colour: fade(PALETTE.ink, 0.7),
  });
  button(ctx, 490, 452, 300, 'PLAY AGAIN  ↺');
  label(ctx, `Press Enter, or click anywhere, to run it again`, 640, 540, { size: 11.5, weight: 500, colour: fade(PALETTE.dim, 0.8) });
}

export { FONT };
