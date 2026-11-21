// Feedback that does not change the rules: sparks at a find, a ring that expands out of the clicked
// spot, and the confetti ribbon at the end of a level. Everything here is short-lived and drawn on top
// of the frame, so it never touches the scene models.

import { PALETTE } from './config.js';
import { circle, fade } from './scene/brush.js';

export function createEffects() {
  return { sparks: [], rings: [], ribbons: [] };
}

export function sparkBurst(effects, x, y, count = 18) {
  for (let index = 0; index < count; index += 1) {
    const angle = (index / count) * Math.PI * 2 + Math.random() * 0.4;
    const speed = 90 + Math.random() * 150;
    effects.sparks.push({
      x, y,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed - 30,
      life: 0.75 + Math.random() * 0.3,
      age: 0,
      size: 1.6 + Math.random() * 2.2,
      colour: index % 3 === 0 ? PALETTE.accent : PALETTE.good,
    });
  }
  effects.rings.push({ x, y, age: 0, life: 0.55, radius: 18 });
}

export function ringPulse(effects, x, y, colour = PALETTE.accent, radius = 16, life = 0.7) {
  effects.rings.push({ x, y, age: 0, life, radius, colour });
}

export function confetti(effects, width, count = 90) {
  for (let index = 0; index < count; index += 1) {
    effects.ribbons.push({
      x: Math.random() * width,
      y: -20 - Math.random() * 120,
      vx: (Math.random() - 0.5) * 70,
      vy: 90 + Math.random() * 140,
      spin: (Math.random() - 0.5) * 8,
      angle: Math.random() * Math.PI,
      life: 3.2,
      age: 0,
      colour: ['#ffcf6b', '#5ce1a0', '#5ad0e6', '#ff8a8a', '#c39bf0'][index % 5],
    });
  }
}

/** Steps every effect by dt seconds and drops the finished ones. */
export function updateEffects(effects, dt) {
  for (const spark of effects.sparks) {
    spark.age += dt;
    spark.x += spark.vx * dt;
    spark.y += spark.vy * dt;
    spark.vy += 320 * dt;
    spark.vx *= 0.98;
  }
  for (const ring of effects.rings) ring.age += dt;
  for (const ribbon of effects.ribbons) {
    ribbon.age += dt;
    ribbon.x += ribbon.vx * dt;
    ribbon.y += ribbon.vy * dt;
    ribbon.angle += ribbon.spin * dt;
    ribbon.vy = Math.min(ribbon.vy + 60 * dt, 260);
  }
  effects.sparks = effects.sparks.filter((spark) => spark.age < spark.life);
  effects.rings = effects.rings.filter((ring) => ring.age < ring.life);
  effects.ribbons = effects.ribbons.filter((ribbon) => ribbon.age < ribbon.life);
}

export function drawEffects(ctx, effects) {
  for (const ring of effects.rings) {
    const progress = ring.age / ring.life;
    ctx.beginPath();
    ctx.arc(ring.x, ring.y, ring.radius + progress * 46, 0, Math.PI * 2);
    ctx.strokeStyle = fade(ring.colour ?? PALETTE.good, (1 - progress) * 0.8);
    ctx.lineWidth = 2.5 * (1 - progress) + 0.5;
    ctx.stroke();
  }
  for (const spark of effects.sparks) {
    const alpha = 1 - spark.age / spark.life;
    ctx.fillStyle = fade(spark.colour, alpha);
    circle(ctx, spark.x, spark.y, spark.size * alpha, ctx.fillStyle);
  }
  for (const ribbon of effects.ribbons) {
    const alpha = Math.min(1, (ribbon.life - ribbon.age) / 0.6);
    ctx.save();
    ctx.translate(ribbon.x, ribbon.y);
    ctx.rotate(ribbon.angle);
    ctx.fillStyle = fade(ribbon.colour, alpha);
    ctx.fillRect(-3, -6, 6, 12);
    ctx.restore();
  }
}
