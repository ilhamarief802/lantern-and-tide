// Pure drawing helpers shared by the scene painters: rounded shapes, soft glows, ropes, tiled
// textures and text. Nothing here knows about a level or a rule; it only turns geometry into ink.

export function roundedRect(ctx, x, y, width, height, radius) {
  const r = Math.min(radius, width / 2, height / 2);
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + width, y, x + width, y + height, r);
  ctx.arcTo(x + width, y + height, x, y + height, r);
  ctx.arcTo(x, y + height, x, y, r);
  ctx.arcTo(x, y, x + width, y, r);
  ctx.closePath();
}

export function fillRound(ctx, x, y, width, height, radius, fill) {
  roundedRect(ctx, x, y, width, height, radius);
  ctx.fillStyle = fill;
  ctx.fill();
}

export function circle(ctx, x, y, radius, fill) {
  ctx.beginPath();
  ctx.arc(x, y, radius, 0, Math.PI * 2);
  ctx.fillStyle = fill;
  ctx.fill();
}

export function ellipse(ctx, x, y, rx, ry, fill, rotation = 0) {
  ctx.beginPath();
  ctx.ellipse(x, y, rx, ry, rotation, 0, Math.PI * 2);
  ctx.fillStyle = fill;
  ctx.fill();
}

/** A soft round light, drawn as a radial gradient that fades to nothing at the edge. */
export function glow(ctx, x, y, radius, colour) {
  const gradient = ctx.createRadialGradient(x, y, 0, x, y, radius);
  gradient.addColorStop(0, colour);
  gradient.addColorStop(0.45, fade(colour, 0.55));
  gradient.addColorStop(1, fade(colour, 0));
  ctx.beginPath();
  ctx.arc(x, y, radius, 0, Math.PI * 2);
  ctx.fillStyle = gradient;
  ctx.fill();
}

/** 'rgb'/'#rrggbb' to an rgba string at the given alpha; other input is returned unchanged. */
export function fade(colour, alpha) {
  if (colour.startsWith('#')) {
    const hex = colour.length === 4
      ? colour.slice(1).split('').map((c) => c + c).join('')
      : colour.slice(1);
    const value = Number.parseInt(hex, 16);
    return `rgba(${(value >> 16) & 255}, ${(value >> 8) & 255}, ${value & 255}, ${alpha})`;
  }
  if (colour.startsWith('rgb(')) return colour.replace('rgb(', 'rgba(').replace(')', `, ${alpha})`);
  return colour;
}

/** A rope or cable between two points, with a sag that makes it look hung rather than drawn. */
export function rope(ctx, x1, y1, x2, y2, sag, colour, width = 2) {
  ctx.beginPath();
  ctx.moveTo(x1, y1);
  ctx.quadraticCurveTo((x1 + x2) / 2, (y1 + y2) / 2 + sag, x2, y2);
  ctx.strokeStyle = colour;
  ctx.lineWidth = width;
  ctx.stroke();
}

export function strokeRound(ctx, x, y, width, height, radius, colour, thickness = 2) {
  roundedRect(ctx, x, y, width, height, radius);
  ctx.strokeStyle = colour;
  ctx.lineWidth = thickness;
  ctx.stroke();
}

/** Text with the size, weight and alignment in one call; `align` defaults to the middle. */
export function label(ctx, text, x, y, { size = 14, weight = 600, colour = '#fff', align = 'center', font = null, track = 0 } = {}) {
  ctx.save();
  ctx.font = `${weight} ${size}px ${font ?? 'system-ui, sans-serif'}`;
  ctx.textAlign = align;
  ctx.textBaseline = 'middle';
  if (track) ctx.letterSpacing = `${track}px`;
  ctx.fillStyle = colour;
  ctx.fillText(text, x, y);
  ctx.restore();
}

/** A scatter of small dots inside a rectangle, used for sand, foam and star fields. */
export function speckle(ctx, random, x, y, width, height, count, colour, minSize, maxSize) {
  ctx.fillStyle = colour;
  for (let i = 0; i < count; i += 1) {
    const px = x + random.range(0, width);
    const py = y + random.range(0, height);
    const size = random.range(minSize, maxSize);
    ctx.beginPath();
    ctx.arc(px, py, size, 0, Math.PI * 2);
    ctx.fill();
  }
}

/** Vertical gradient fill of a rectangle; the stops are [offset, colour] pairs. */
export function gradientRect(ctx, x, y, width, height, stops, horizontal = false) {
  const gradient = horizontal
    ? ctx.createLinearGradient(x, y, x + width, y)
    : ctx.createLinearGradient(x, y, x, y + height);
  for (const [offset, colour] of stops) gradient.addColorStop(offset, colour);
  ctx.fillStyle = gradient;
  ctx.fillRect(x, y, width, height);
}
