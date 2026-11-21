// Drawing the two pictures: the scene clipped inside each panel, its frame and label, and the markers
// that report a find. Both panels are painted from the same scene model, so a seam in one is a seam in
// the other and only the differences separate them.

import { FONT, FONT_NUM, PALETTE, PANEL } from './config.js';
import { paintScene } from './model.js';
import { fade, fillRound, label, strokeRound } from './scene/brush.js';

/** The panel rect for side 'a' or 'b'. */
export function panelRect(side) {
  const origin = side === 'a' ? PANEL.left : PANEL.right;
  return { x: origin.x, y: origin.y + PANEL.labelHeight, width: PANEL.width, height: PANEL.height };
}

/** Which panel, if any, holds a point of the playfield. */
export function panelAt(x, y) {
  for (const side of ['a', 'b']) {
    const rect = panelRect(side);
    if (x >= rect.x && x <= rect.x + rect.width && y >= rect.y && y <= rect.y + rect.height) return side;
  }
  return null;
}

function drawLabel(ctx, side, rect, focused) {
  const chipX = rect.x;
  const chipY = rect.y - PANEL.labelHeight + 2;
  const active = focused === side;
  fillRound(ctx, chipX, chipY, 132, 26, 7, active ? PALETTE.accent : 'rgba(255, 255, 255, 0.07)');
  label(ctx, side === 'a' ? 'PICTURE  A' : 'PICTURE  B', chipX + 66, chipY + 13.5, {
    size: 11.5,
    weight: 800,
    colour: active ? '#1a1408' : PALETTE.dim,
    track: 2.2,
  });
  label(
    ctx,
    side === 'a' ? 'the original' : 'find what changed',
    chipX + 146,
    chipY + 13.5,
    { size: 11, weight: 500, colour: fade(PALETTE.ink, 0.52), align: 'left' },
  );
}

function drawFoundMarker(ctx, spot, age, pulse) {
  const grow = Math.max(0, Math.min(1, age * 5));
  const radius = 22 * (0.75 + 0.25 * grow);
  ctx.save();
  ctx.globalAlpha = Math.min(1, grow);
  // Halo.
  ctx.beginPath();
  ctx.arc(spot.x, spot.y, radius + 7 + pulse * 2.5, 0, Math.PI * 2);
  ctx.fillStyle = 'rgba(92, 225, 160, 0.14)';
  ctx.fill();
  // Ring, drawn thicker with a soft outer stroke so it survives a dark scene.
  ctx.beginPath();
  ctx.arc(spot.x, spot.y, radius, 0, Math.PI * 2);
  ctx.strokeStyle = 'rgba(6, 20, 14, 0.55)';
  ctx.lineWidth = 6;
  ctx.stroke();
  ctx.beginPath();
  ctx.arc(spot.x, spot.y, radius, 0, Math.PI * 2);
  ctx.strokeStyle = PALETTE.good;
  ctx.lineWidth = 2.8;
  ctx.stroke();
  // Tick.
  ctx.beginPath();
  ctx.moveTo(spot.x - 6.5, spot.y + 0.5);
  ctx.lineTo(spot.x - 1.5, spot.y + 5.5);
  ctx.lineTo(spot.x + 7, spot.y - 4.5);
  ctx.strokeStyle = PALETTE.good;
  ctx.lineWidth = 3;
  ctx.lineCap = 'round';
  ctx.stroke();
  ctx.restore();
}

function drawMissMarker(ctx, miss, time) {
  const life = Math.min(1, (time - miss.time) / 0.9);
  if (life >= 1) return;
  ctx.save();
  ctx.globalAlpha = 1 - life;
  const size = 13 + life * 9;
  ctx.strokeStyle = PALETTE.bad;
  ctx.lineWidth = 3;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(miss.x - size, miss.y - size);
  ctx.lineTo(miss.x + size, miss.y + size);
  ctx.moveTo(miss.x + size, miss.y - size);
  ctx.lineTo(miss.x - size, miss.y + size);
  ctx.stroke();
  ctx.restore();
}

function drawHintPulse(ctx, hint, time) {
  if (!hint) return;
  const age = time - hint.time;
  if (age > 3.4) return;
  ctx.save();
  ctx.globalAlpha = Math.max(0, 1 - age / 3.4);
  ctx.beginPath();
  ctx.arc(hint.x, hint.y, 26 + (age % 1.2) * 26, 0, Math.PI * 2);
  ctx.strokeStyle = PALETTE.accent;
  ctx.lineWidth = 2;
  ctx.setLineDash([5, 6]);
  ctx.stroke();
  ctx.restore();
}

/** Paints one panel: frame, clipped scene, markers. */
export function drawPanel(ctx, side, view, time) {
  const rect = panelRect(side);
  const { scene, differences, found, misses, hint, pulse } = view;

  ctx.save();
  fillRound(ctx, rect.x - 4, rect.y - 4, rect.width + 8, rect.height + 8, PANEL.radius + 4, 'rgba(8, 12, 24, 0.85)');
  strokeRound(ctx, rect.x - 4, rect.y - 4, rect.width + 8, rect.height + 8, PANEL.radius + 4, fade(PALETTE.panelEdge, 0.9), 1.4);
  ctx.restore();

  ctx.save();
  ctx.beginPath();
  ctx.roundRect(rect.x, rect.y, rect.width, rect.height, PANEL.radius);
  ctx.clip();
  ctx.translate(rect.x, rect.y);
  ctx.scale(rect.width / scene.width, rect.height / scene.height);
  paintScene(ctx, scene);
  // A soft vignette inside the picture, so both panels read as framed photographs.
  ctx.restore();

  ctx.save();
  ctx.beginPath();
  ctx.roundRect(rect.x, rect.y, rect.width, rect.height, PANEL.radius);
  ctx.clip();
  const vignette = ctx.createRadialGradient(
    rect.x + rect.width / 2, rect.y + rect.height / 2, rect.height * 0.3,
    rect.x + rect.width / 2, rect.y + rect.height / 2, rect.width * 0.72,
  );
  vignette.addColorStop(0, 'rgba(0, 0, 0, 0)');
  vignette.addColorStop(1, 'rgba(4, 6, 14, 0.42)');
  ctx.fillStyle = vignette;
  ctx.fillRect(rect.x, rect.y, rect.width, rect.height);

  for (const index of found) {
    const difference = differences[index];
    if (!difference) continue;
    const spot = { x: rect.x + difference.spot.x, y: rect.y + difference.spot.y };
    drawFoundMarker(ctx, spot, Math.min(1, (time - difference.foundAt) * 2), pulse);
  }
  for (const miss of misses) drawMissMarker(ctx, miss.position, time);
  if (hint) {
    drawHintPulse(ctx, { x: rect.x + hint.x, y: rect.y + hint.y, time: hint.time }, time);
  }
  ctx.restore();

  drawLabel(ctx, side, rect, view.focused);

  // Corner tag with the panel's own frame count, like a proof sheet.
  label(ctx, side === 'a' ? 'A' : 'B', rect.x + rect.width - 16, rect.y + 17, {
    size: 13,
    weight: 800,
    colour: fade(PALETTE.ink, 0.55),
    align: 'right',
    font: FONT_NUM,
  });
}
