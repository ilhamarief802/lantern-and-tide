// Level 3's picture: "Sky Observatory", a telescope deck on a ridge at dusk. The hardest of the three
// because the scene is busy: instruments, papers, mugs and a sky full of small lights.

import { addNode } from '../model.js';
import { circle, ellipse, fade, fillRound, glow, gradientRect, rope, roundedRect, speckle, strokeRound } from './brush.js';

const WIDTH = 600;
const HEIGHT = 428;
const RIDGE = 258;
const DECK = 330;

function starNode(scene, id, x, y, size, colour) {
  addNode(scene, {
    id,
    tag: 'star',
    hit: { x, y, r: 16 },
    diffable: ['hidden', 'moved', 'swollen'],
    paint(ctx) {
      glow(ctx, x, y, size * 6, fade(colour, 0.45));
      circle(ctx, x, y, size, colour);
      if (size > 1.8) {
        ctx.strokeStyle = fade(colour, 0.55);
        ctx.lineWidth = 0.9;
        ctx.beginPath();
        ctx.moveTo(x - size * 3, y);
        ctx.lineTo(x + size * 3, y);
        ctx.moveTo(x, y - size * 3);
        ctx.lineTo(x, y + size * 3);
        ctx.stroke();
      }
    },
  });
}

function buildSky(scene, random) {
  addNode(scene, {
    id: 'dusk',
    tag: 'backdrop',
    hit: { x: 300, y: 120, r: 250 },
    paint(ctx) {
      gradientRect(ctx, 0, 0, WIDTH, RIDGE + 30, [
        [0, '#0b1030'],
        [0.32, '#1d2350'],
        [0.6, '#4a3560'],
        [0.82, '#94566a'],
        [1, '#d98a6b'],
      ]);
    },
  });

  // The star field is sampled once, at build time, so both panels get exactly the same sky.
  const stars = [];
  for (let index = 0; index < 202; index += 1) {
    const bright = index >= 180;
    stars.push({
      x: random.range(0, WIDTH),
      y: random.range(0, RIDGE - (bright ? 110 : 70)),
      size: bright ? random.range(0.8, 1.7) : random.range(0.4, 1.2),
      colour: bright ? 'rgba(255, 252, 235, 0.95)' : 'rgba(228, 236, 255, 0.62)',
    });
  }
  addNode(scene, {
    id: 'stars-field',
    tag: 'backdrop',
    hit: { x: 300, y: 70, r: 250 },
    paint(ctx) {
      for (const star of stars) {
        ctx.fillStyle = star.colour;
        ctx.beginPath();
        ctx.arc(star.x, star.y, star.size, 0, Math.PI * 2);
        ctx.fill();
      }
    },
  });

  addNode(scene, {
    id: 'moon',
    tag: 'backdrop',
    hit: { x: 92, y: 62, r: 30 },
    paint(ctx) {
      glow(ctx, 92, 62, 96, 'rgba(240, 238, 220, 0.22)');
      circle(ctx, 92, 62, 24, '#f4f0df');
      circle(ctx, 100, 56, 20, fade('#1a1b3a', 0.92));
    },
  });

  // A faint band of aurora, drawn as three soft arcs.
  addNode(scene, {
    id: 'aurora',
    tag: 'backdrop',
    hit: { x: 360, y: 90, r: 180 },
    paint(ctx) {
      for (const [offset, colour] of [[0, 'rgba(120, 230, 200, 0.16)'], [12, 'rgba(140, 180, 255, 0.13)'], [24, 'rgba(190, 140, 240, 0.10)']]) {
        ctx.beginPath();
        ctx.moveTo(120, 130 + offset);
        ctx.quadraticCurveTo(300, 30 + offset, 520, 118 + offset);
        ctx.quadraticCurveTo(360, 96 + offset, 120, 130 + offset);
        ctx.fillStyle = colour;
        ctx.fill();
      }
    },
  });

  // A comet: the only moving thing in the sky.
  addNode(scene, {
    id: 'comet',
    tag: 'comet',
    hit: { x: 466, y: 78, r: 26 },
    diffable: ['hidden', 'moved', 'flipped'],
    paint(ctx) {
      const tail = ctx.createLinearGradient(466, 78, 526, 44);
      tail.addColorStop(0, 'rgba(255, 250, 225, 0.9)');
      tail.addColorStop(1, 'rgba(255, 250, 225, 0)');
      ctx.beginPath();
      ctx.moveTo(466, 78);
      ctx.lineTo(526, 44);
      ctx.lineTo(524, 56);
      ctx.closePath();
      ctx.fillStyle = tail;
      ctx.fill();
      glow(ctx, 466, 78, 22, 'rgba(255, 248, 220, 0.7)');
      circle(ctx, 466, 78, 3.2, '#fffaf0');
    },
  });

  starNode(scene, 'star-bright', 210, 44, 2.2, '#fff6d8');
  starNode(scene, 'star-blue', 320, 96, 1.9, '#cfe4ff');
  starNode(scene, 'star-rose', 396, 40, 1.7, '#ffd7d7');

  addNode(scene, {
    id: 'planet',
    tag: 'planet',
    hit: { x: 300, y: 168, r: 26 },
    diffable: ['hidden', 'moved', 'tinted', 'swollen'],
    baseColour: '#e8c07a',
    paint(ctx, node) {
      const tint = node.tint ?? '#e8c07a';
      glow(ctx, 300, 168, 26, fade(tint, 0.28));
      circle(ctx, 300, 168, 7.5, tint);
      ctx.save();
      ctx.translate(300, 168);
      ctx.rotate(-0.36);
      ctx.beginPath();
      ctx.ellipse(0, 0, 15, 4, 0, 0, Math.PI * 2);
      ctx.strokeStyle = fade('#ffe9bd', 0.65);
      ctx.lineWidth = 1.6;
      ctx.stroke();
      ctx.restore();
    },
  });

  // Two ridges of hills, the near one carrying the observatory's dome.
  addNode(scene, {
    id: 'ridges',
    tag: 'backdrop',
    hit: { x: 300, y: 250, r: 250 },
    paint(ctx) {
      ctx.beginPath();
      ctx.moveTo(0, RIDGE);
      ctx.quadraticCurveTo(90, 208, 190, 236);
      ctx.quadraticCurveTo(300, 262, 400, 226);
      ctx.quadraticCurveTo(510, 190, 600, 232);
      ctx.lineTo(600, RIDGE + 30);
      ctx.lineTo(0, RIDGE + 30);
      ctx.closePath();
      ctx.fillStyle = '#232a4c';
      ctx.fill();
      ctx.beginPath();
      ctx.moveTo(0, RIDGE + 8);
      ctx.quadraticCurveTo(140, 228, 280, 262);
      ctx.quadraticCurveTo(430, 292, 600, 246);
      ctx.lineTo(600, RIDGE + 40);
      ctx.lineTo(0, RIDGE + 40);
      ctx.closePath();
      ctx.fillStyle = '#171c36';
      ctx.fill();
      // A few lit windows of the village below, tiny and warm.
      for (let house = 0; house < 12; house += 1) {
        const hx = 30 + house * 48 + (house % 3) * 9;
        const hy = RIDGE + 4 + (house % 4) * 7;
        ctx.fillStyle = 'rgba(255, 206, 140, 0.6)';
        ctx.fillRect(hx, hy, 3, 2.4);
      }
    },
  });

  addNode(scene, {
    id: 'dome',
    tag: 'dome',
    hit: { x: 452, y: 236, r: 44 },
    diffable: ['hidden', 'moved', 'swollen'],
    paint(ctx) {
      fillRound(ctx, 418, 236, 68, 30, 3, '#2c3358');
      ctx.beginPath();
      ctx.arc(452, 236, 32, Math.PI, 0);
      ctx.fillStyle = '#39406a';
      ctx.fill();
      ctx.beginPath();
      ctx.arc(452, 236, 32, Math.PI, 0);
      ctx.strokeStyle = '#4d5583';
      ctx.lineWidth = 1.6;
      ctx.stroke();
      // The slit, open to the sky.
      ctx.fillStyle = '#0d1128';
      ctx.beginPath();
      ctx.moveTo(444, 236);
      ctx.lineTo(444, 208);
      ctx.lineTo(460, 208);
      ctx.lineTo(460, 236);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = 'rgba(255, 214, 150, 0.75)';
      ctx.fillRect(436, 252, 6, 8);
      ctx.fillStyle = '#252b4c';
      ctx.fillRect(418, 264, 68, 4);
    },
  });
}

function buildDeck(scene, random) {
  addNode(scene, {
    id: 'deck',
    tag: 'backdrop',
    hit: { x: 300, y: 390, r: 250 },
    paint(ctx) {
      gradientRect(ctx, 0, DECK, WIDTH, HEIGHT - DECK, [
        [0, '#3a2f33'],
        [0.4, '#2b2328'],
        [1, '#1d181c'],
      ]);
      for (let y = DECK + 10; y < HEIGHT; y += 16) {
        ctx.fillStyle = 'rgba(0, 0, 0, 0.25)';
        ctx.fillRect(0, y, WIDTH, 2);
        ctx.fillStyle = 'rgba(255, 214, 180, 0.05)';
        ctx.fillRect(0, y + 2, WIDTH, 1.2);
      }
      for (const x of [78, 196, 312, 430, 546]) {
        ctx.strokeStyle = 'rgba(0, 0, 0, 0.22)';
        ctx.lineWidth = 1.4;
        ctx.beginPath();
        ctx.moveTo(x, DECK + 10);
        ctx.lineTo(x - 8, HEIGHT);
        ctx.stroke();
      }
      ctx.fillStyle = '#453438';
      ctx.fillRect(0, DECK - 6, WIDTH, 10);
      ctx.fillStyle = 'rgba(255, 226, 190, 0.12)';
      ctx.fillRect(0, DECK - 6, WIDTH, 2);
    },
  });

  // The railing behind the deck, with a lamp post at the right.
  addNode(scene, {
    id: 'railing',
    tag: 'backdrop',
    hit: { x: 300, y: 316, r: 250 },
    paint(ctx) {
      ctx.fillStyle = '#4a3a3c';
      ctx.fillRect(0, 306, WIDTH, 4);
      ctx.fillRect(0, 320, WIDTH, 3);
      for (let x = 12; x < WIDTH; x += 46) ctx.fillRect(x, 300, 4, 24);
    },
  });

  addNode(scene, {
    id: 'lamp-post',
    tag: 'lamp',
    hit: { x: 556, y: 268, r: 34 },
    diffable: ['hidden', 'moved', 'tinted'],
    baseColour: '#ffc978',
    paint(ctx, node) {
      const tint = node.tint ?? '#ffc978';
      ctx.fillStyle = '#3a2c30';
      ctx.fillRect(552, 268, 5, 66);
      glow(ctx, 554, 262, 54, fade(tint, 0.35));
      ctx.beginPath();
      ctx.moveTo(542, 262);
      ctx.lineTo(566, 262);
      ctx.lineTo(560, 278);
      ctx.lineTo(548, 278);
      ctx.closePath();
      ctx.fillStyle = fade(tint, 0.92);
      ctx.fill();
      ctx.strokeStyle = 'rgba(40, 30, 26, 0.7)';
      ctx.lineWidth = 1.4;
      ctx.stroke();
      ctx.fillStyle = '#3a2c30';
      ctx.fillRect(540, 258, 28, 4);
    },
  });
}

function buildInstruments(scene, random) {
  // The telescope: a long tube on a tripod, aimed up and left.
  addNode(scene, {
    id: 'telescope',
    tag: 'telescope',
    hit: { x: 208, y: 268, r: 54 },
    diffable: ['hidden', 'moved', 'flipped'],
    paint(ctx) {
      ctx.strokeStyle = '#54424a';
      ctx.lineWidth = 4;
      for (const [x1, x2] of [[196, 168], [200, 244], [206, 208]]) {
        ctx.beginPath();
        ctx.moveTo(206, 330);
        ctx.lineTo(x2, 356);
        ctx.stroke();
      }
      ctx.save();
      ctx.translate(208, 300);
      ctx.rotate(-0.62);
      fillRound(ctx, -62, -9, 124, 18, 8, '#6b5a68');
      fillRound(ctx, -62, -9, 124, 7, 4, '#84707e');
      fillRound(ctx, 44, -12, 22, 24, 6, '#4e4048');
      fillRound(ctx, -72, -6, 12, 12, 3, '#3d323a');
      ctx.restore();
      // Finder scope.
      fillRound(ctx, 186, 254, 34, 6, 3, '#4e4048');
      // A soft moon-lens flare at the eyepiece.
      glow(ctx, 156, 280, 16, 'rgba(255, 240, 210, 0.35)');
    },
  });

  // A stool with a notebook and a pencil.
  addNode(scene, {
    id: 'stool',
    tag: 'stool',
    hit: { x: 316, y: 322, r: 30 },
    diffable: ['hidden', 'moved', 'swollen'],
    paint(ctx) {
      ctx.fillStyle = '#4a3936';
      ctx.fillRect(302, 324, 4, 34);
      ctx.fillRect(330, 324, 4, 34);
      fillRound(ctx, 292, 312, 52, 12, 4, '#5c463f');
      fillRound(ctx, 296, 306, 34, 10, 2, '#efe6d0');
      ctx.strokeStyle = 'rgba(80, 70, 60, 0.35)';
      ctx.lineWidth = 1;
      for (let line = 0; line < 3; line += 1) {
        ctx.beginPath();
        ctx.moveTo(300, 309 + line * 2.6);
        ctx.lineTo(326 - line * 3, 309 + line * 2.6);
        ctx.stroke();
      }
      ctx.save();
      ctx.translate(334, 306);
      ctx.rotate(0.4);
      ctx.fillStyle = '#e0b25c';
      ctx.fillRect(-9, -1.6, 18, 3.2);
      ctx.restore();
    },
  });

  // A mug, steam still rising.
  addNode(scene, {
    id: 'mug',
    tag: 'mug',
    hit: { x: 372, y: 352, r: 22 },
    diffable: ['hidden', 'moved', 'tinted', 'flipped'],
    baseColour: '#cf6b52',
    paint(ctx, node) {
      const tint = node.tint ?? '#cf6b52';
      fillRound(ctx, 360, 344, 24, 22, 4, tint);
      ctx.beginPath();
      ctx.arc(386, 355, 7, -Math.PI / 2, Math.PI / 2);
      ctx.strokeStyle = tint;
      ctx.lineWidth = 3;
      ctx.stroke();
      ctx.fillStyle = 'rgba(40, 26, 22, 0.45)';
      ctx.fillRect(360, 344, 24, 4);
      ctx.strokeStyle = 'rgba(255, 246, 235, 0.28)';
      ctx.lineWidth = 1.6;
      ctx.beginPath();
      ctx.moveTo(366, 340);
      ctx.quadraticCurveTo(360, 330, 367, 322);
      ctx.moveTo(375, 340);
      ctx.quadraticCurveTo(382, 329, 374, 320);
      ctx.stroke();
    },
  });

  // A chart on an easel: the sky map the observer is working from.
  addNode(scene, {
    id: 'star-chart',
    tag: 'chart',
    hit: { x: 96, y: 330, r: 40 },
    diffable: ['hidden', 'moved', 'flipped'],
    paint(ctx) {
      ctx.strokeStyle = '#5a453c';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(96, 296);
      ctx.lineTo(72, 400);
      ctx.moveTo(96, 296);
      ctx.lineTo(122, 400);
      ctx.stroke();
      fillRound(ctx, 62, 300, 70, 66, 3, '#20304a');
      strokeRound(ctx, 62, 300, 70, 66, 3, '#8e9bb5', 1.4);
      ctx.strokeStyle = 'rgba(190, 214, 240, 0.5)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.arc(97, 332, 26, 0, Math.PI * 2);
      ctx.moveTo(97, 306);
      ctx.lineTo(97, 358);
      ctx.moveTo(71, 332);
      ctx.lineTo(123, 332);
      ctx.stroke();
      for (const [sx, sy] of [[86, 318], [104, 326], [92, 344], [110, 340], [100, 314]]) {
        circle(ctx, sx, sy, 1.8, '#ffe9b0');
        ctx.strokeStyle = 'rgba(255, 233, 176, 0.45)';
        ctx.beginPath();
        ctx.moveTo(86, 318);
        ctx.lineTo(100, 314);
        ctx.lineTo(104, 326);
        ctx.lineTo(110, 340);
        ctx.lineTo(92, 344);
        ctx.stroke();
      }
    },
  });

  // Lantern jars along the railing, warm at the back.
  addNode(scene, {
    id: 'jar-lights',
    tag: 'jars',
    hit: { x: 262, y: 300, r: 26 },
    diffable: ['hidden', 'moved', 'tinted', 'swollen'],
    baseColour: '#ffcf7a',
    paint(ctx, node) {
      const tint = node.tint ?? '#ffcf7a';
      for (const [x, y] of [[250, 300], [266, 296], [282, 301]]) {
        glow(ctx, x, y, 18, fade(tint, 0.35));
        fillRound(ctx, x - 5, y - 7, 10, 13, 3, fade('#e8f0ff', 0.35));
        fillRound(ctx, x - 3.6, y - 4, 7.2, 8, 2, tint);
      }
    },
  });

  addNode(scene, {
    id: 'crate',
    tag: 'crate',
    hit: { x: 470, y: 372, r: 30 },
    diffable: ['hidden', 'moved'],
    paint(ctx) {
      gradientRect(ctx, 444, 354, 52, 34, [[0, '#6b5040'], [1, '#432f26']]);
      ctx.strokeStyle = 'rgba(0, 0, 0, 0.34)';
      ctx.lineWidth = 1.6;
      ctx.strokeRect(444, 354, 52, 34);
      ctx.fillStyle = 'rgba(255, 226, 190, 0.16)';
      ctx.fillRect(446, 355, 48, 1.8);
      ctx.beginPath();
      ctx.moveTo(444, 354);
      ctx.lineTo(496, 388);
      ctx.moveTo(496, 354);
      ctx.lineTo(444, 388);
      ctx.stroke();
      ctx.fillStyle = 'rgba(255, 226, 190, 0.12)';
      ctx.fillRect(444, 354, 52, 3);
    },
  });

  // An owl on the railing post, watching.
  addNode(scene, {
    id: 'owl',
    tag: 'owl',
    hit: { x: 148, y: 300, r: 26 },
    diffable: ['hidden', 'moved', 'tinted', 'swollen'],
    baseColour: '#6b5a4a',
    paint(ctx, node) {
      const feathers = node.tint ?? '#6b5a4a';
      ellipse(ctx, 148, 296, 13, 16, feathers);
      ellipse(ctx, 148, 284, 11, 9, fade(feathers, 0.82));
      ctx.beginPath();
      ctx.moveTo(140, 278);
      ctx.lineTo(142, 270);
      ctx.lineTo(147, 276);
      ctx.closePath();
      ctx.moveTo(156, 278);
      ctx.lineTo(154, 270);
      ctx.lineTo(149, 276);
      ctx.closePath();
      ctx.fillStyle = fade(feathers, 0.82);
      ctx.fill();
      circle(ctx, 143.5, 284, 3.2, '#ffe9a8');
      circle(ctx, 152.5, 284, 3.2, '#ffe9a8');
      circle(ctx, 143.5, 284, 1.4, '#1b1420');
      circle(ctx, 152.5, 284, 1.4, '#1b1420');
      ctx.beginPath();
      ctx.moveTo(148, 288);
      ctx.lineTo(145.5, 292);
      ctx.lineTo(150.5, 292);
      ctx.closePath();
      ctx.fillStyle = '#e0a05a';
      ctx.fill();
      ctx.strokeStyle = 'rgba(255, 226, 190, 0.16)';
      ctx.lineWidth = 1;
      for (let feather = 0; feather < 3; feather += 1) {
        ctx.beginPath();
        ctx.moveTo(140, 298 + feather * 4);
        ctx.lineTo(156, 298 + feather * 4);
        ctx.stroke();
      }
    },
  });
}

export function buildObservatory(random) {
  const scene = { width: WIDTH, height: HEIGHT, theme: 'observatory', nodes: [] };
  buildSky(scene, random);
  buildDeck(scene, random);
  buildInstruments(scene, random);
  return scene;
}
