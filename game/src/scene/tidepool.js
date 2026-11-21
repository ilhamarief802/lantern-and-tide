// Level 2's picture: "Tidepool Terrace", a bright rock pool at low tide. A daylight palette on purpose,
// so the second level is not the first one recoloured.

import { addNode } from '../model.js';
import { circle, ellipse, fade, fillRound, glow, gradientRect, label, rope, roundedRect, speckle, strokeRound } from './brush.js';

const WIDTH = 600;
const HEIGHT = 428;
const HORIZON = 196;
const POOL_Y = 314;

function rockNode(scene, id, x, y, radius, colour, shade) {
  addNode(scene, {
    id,
    tag: 'rock',
    hit: { x, y, r: radius * 0.9 },
    diffable: ['hidden', 'moved', 'swollen'],
    paint(ctx) {
      ctx.beginPath();
      ctx.moveTo(x - radius, y);
      ctx.quadraticCurveTo(x - radius * 0.72, y - radius * 0.98, x - radius * 0.06, y - radius);
      ctx.quadraticCurveTo(x + radius * 0.78, y - radius * 0.92, x + radius, y - radius * 0.12);
      ctx.quadraticCurveTo(x + radius * 0.6, y + radius * 0.24, x - radius * 0.4, y + radius * 0.2);
      ctx.closePath();
      ctx.fillStyle = colour;
      ctx.fill();
      ctx.beginPath();
      ctx.moveTo(x - radius * 0.7, y - radius * 0.1);
      ctx.quadraticCurveTo(x - radius * 0.2, y - radius * 0.8, x + radius * 0.5, y - radius * 0.55);
      ctx.strokeStyle = shade;
      ctx.lineWidth = 2.4;
      ctx.stroke();
      // Barnacles and weed on the rock's shoulder.
      for (let index = 0; index < 9; index += 1) {
        const bx = x - radius * 0.55 + index * radius * 0.13;
        circle(ctx, bx, y - radius * 0.72 + (index % 3) * 6, 1.5, fade('#f4f1e4', 0.6));
      }
    },
  });
}

function shellNode(scene, id, x, y, colour, tag = 'shell') {
  addNode(scene, {
    id,
    tag,
    hit: { x, y, r: 20 },
    diffable: ['hidden', 'moved', 'tinted', 'swollen'],
    baseColour: colour,
    paint(ctx, node) {
      const tint = node.tint ?? colour;
      ctx.beginPath();
      ctx.moveTo(x, y + 8);
      ctx.quadraticCurveTo(x - 15, y + 6, x - 12, y - 6);
      ctx.quadraticCurveTo(x, y - 16, x + 12, y - 6);
      ctx.quadraticCurveTo(x + 15, y + 6, x, y + 8);
      ctx.fillStyle = tint;
      ctx.fill();
      ctx.strokeStyle = fade('#ffffff', 0.45);
      ctx.lineWidth = 1;
      for (let rib = -2; rib <= 2; rib += 1) {
        ctx.beginPath();
        ctx.moveTo(x, y + 7);
        ctx.lineTo(x + rib * 6, y - 7 + Math.abs(rib) * 2);
        ctx.stroke();
      }
    },
  });
}

function starfishNode(scene, id, x, y, colour) {
  addNode(scene, {
    id,
    tag: 'starfish',
    hit: { x, y, r: 22 },
    diffable: ['hidden', 'moved', 'tinted', 'swollen'],
    baseColour: colour,
    paint(ctx, node) {
      const tint = node.tint ?? colour;
      ctx.save();
      ctx.translate(x, y);
      ctx.beginPath();
      for (let arm = 0; arm < 5; arm += 1) {
        const angle = -Math.PI / 2 + (arm / 5) * Math.PI * 2;
        const tipX = Math.cos(angle) * 17;
        const tipY = Math.sin(angle) * 17;
        const left = angle - 0.42;
        const right = angle + 0.42;
        ctx.lineTo(Math.cos(left) * 7, Math.sin(left) * 7);
        ctx.lineTo(tipX, tipY);
        ctx.lineTo(Math.cos(right) * 7, Math.sin(right) * 7);
      }
      ctx.closePath();
      ctx.fillStyle = tint;
      ctx.fill();
      ctx.strokeStyle = fade('#ffffff', 0.35);
      ctx.lineWidth = 1;
      ctx.stroke();
      for (let dot = 0; dot < 7; dot += 1) {
        const angle = (dot / 7) * Math.PI * 2;
        circle(ctx, Math.cos(angle) * 4.5, Math.sin(angle) * 4.5, 1, fade('#ffffff', 0.55));
      }
      ctx.restore();
    },
  });
}

function buildSky(scene, random) {
  addNode(scene, {
    id: 'day-sky',
    tag: 'backdrop',
    hit: { x: 300, y: 90, r: 240 },
    paint(ctx) {
      gradientRect(ctx, 0, 0, WIDTH, HORIZON + 40, [
        [0, '#2f7fbd'],
        [0.35, '#63aad6'],
        [0.62, '#a8d4e6'],
        [1, '#dcefef'],
      ]);
      glow(ctx, 128, 62, 96, 'rgba(255, 246, 214, 0.55)');
      circle(ctx, 128, 62, 26, '#fff6cf');
    },
  });

  addNode(scene, {
    id: 'clouds',
    tag: 'cloud',
    hit: { x: 350, y: 82, r: 70 },
    diffable: ['hidden', 'moved', 'swollen'],
    paint(ctx) {
      const puffs = [[300, 86, 30], [330, 78, 38], [366, 84, 30], [392, 90, 22], [268, 92, 20]];
      for (const [x, y, radius] of puffs) {
        circle(ctx, x, y, radius, 'rgba(255, 255, 255, 0.82)');
        circle(ctx, x, y + radius * 0.35, radius * 0.9, 'rgba(232, 244, 250, 0.6)');
      }
      circle(ctx, 340, 100, 44, 'rgba(255, 255, 255, 0.35)');
    },
  });

  addNode(scene, {
    id: 'gull',
    tag: 'gull',
    hit: { x: 470, y: 76, r: 26 },
    diffable: ['hidden', 'moved'],
    paint(ctx) {
      ctx.strokeStyle = 'rgba(40, 56, 74, 0.75)';
      ctx.lineWidth = 2.2;
      ctx.beginPath();
      ctx.moveTo(442, 72);
      ctx.quadraticCurveTo(456, 60, 470, 74);
      ctx.quadraticCurveTo(486, 58, 500, 72);
      ctx.stroke();
    },
  });

  // A headland with a lighthouse, far off behind the sea.
  addNode(scene, {
    id: 'headland',
    tag: 'backdrop',
    hit: { x: 520, y: 178, r: 90 },
    paint(ctx) {
      ctx.beginPath();
      ctx.moveTo(430, HORIZON + 14);
      ctx.quadraticCurveTo(500, HORIZON - 34, 596, HORIZON - 8);
      ctx.lineTo(600, HORIZON + 16);
      ctx.closePath();
      ctx.fillStyle = '#7b93a5';
      ctx.fill();
      ctx.beginPath();
      ctx.moveTo(470, HORIZON - 20);
      ctx.lineTo(600, HORIZON - 2);
      ctx.lineTo(600, HORIZON + 10);
      ctx.lineTo(470, HORIZON - 8);
      ctx.closePath();
      ctx.fillStyle = '#8ea6b6';
      ctx.fill();
      fillRound(ctx, 540, HORIZON - 52, 12, 34, 2, '#f5f1e6');
      ctx.fillStyle = '#c8553d';
      ctx.fillRect(540, HORIZON - 42, 12, 7);
      ctx.fillStyle = '#3f4d5c';
      ctx.beginPath();
      ctx.moveTo(538, HORIZON - 52);
      ctx.lineTo(554, HORIZON - 52);
      ctx.lineTo(546, HORIZON - 60);
      ctx.closePath();
      ctx.fill();
    },
  });
}

function buildSea(scene, random) {
  // Lines of swell are sampled once at build time: both panels paint this sea, and a painter that rolled
  // its own dice would set the two pictures apart everywhere instead of only where a difference sits.
  const swell = [];
  for (let line = 0; line < 26; line += 1) {
    swell.push({
      y: HORIZON + 6 + line * 4.4,
      width: 20 + random.range(6, 40),
      x: random.range(0, WIDTH),
      bright: line % 3 === 0,
    });
  }
  addNode(scene, {
    id: 'sea',
    tag: 'backdrop',
    hit: { x: 300, y: 250, r: 250 },
    paint(ctx) {
      gradientRect(ctx, 0, HORIZON, WIDTH, 120, [
        [0, '#1f6f96'],
        [0.5, '#2f8fae'],
        [1, '#3fa8bd'],
      ]);
      for (const line of swell) {
        ctx.fillStyle = line.bright ? 'rgba(255, 255, 255, 0.30)' : 'rgba(255, 255, 255, 0.16)';
        ctx.fillRect(line.x, line.y, line.width, 1.6);
      }
      // The breakwater: a line of rocks where the sea meets the rock shelf.
      ctx.beginPath();
      ctx.moveTo(0, 236);
      for (let x = 0; x <= WIDTH; x += 40) {
        ctx.lineTo(x, 236 + Math.sin(x * 0.03) * 7 + 4);
      }
      ctx.lineTo(WIDTH, POOL_Y);
      ctx.lineTo(0, POOL_Y);
      ctx.closePath();
      ctx.fillStyle = 'rgba(58, 92, 104, 0.35)';
      ctx.fill();
    },
  });
}

function buildTerrace(scene, random) {
  const grains = [];
  for (let index = 0; index < 260; index += 1) {
    grains.push({ x: random.range(0, WIDTH), y: random.range(300, HEIGHT), size: random.range(0.5, 1.6) });
  }
  const glints = [];
  for (let index = 0; index < 90; index += 1) {
    glints.push({ x: random.range(0, WIDTH), y: random.range(300, HEIGHT), size: random.range(0.6, 1.4) });
  }
  addNode(scene, {
    id: 'sand',
    tag: 'backdrop',
    hit: { x: 300, y: 380, r: 250 },
    paint(ctx) {
      gradientRect(ctx, 0, 300, WIDTH, HEIGHT - 300, [
        [0, '#d8c69b'],
        [0.4, '#cbb68a'],
        [1, '#b6a077'],
      ]);
      ctx.fillStyle = 'rgba(120, 100, 70, 0.20)';
      for (const grain of grains) {
        ctx.beginPath();
        ctx.arc(grain.x, grain.y, grain.size, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.fillStyle = 'rgba(255, 248, 226, 0.5)';
      for (const glint of glints) {
        ctx.beginPath();
        ctx.arc(glint.x, glint.y, glint.size, 0, Math.PI * 2);
        ctx.fill();
      }
      // Wet sand band at the waterline.
      gradientRect(ctx, 0, 296, WIDTH, 26, [[0, 'rgba(92, 122, 128, 0.55)'], [1, 'rgba(92, 122, 128, 0)']]);
    },
  });

  // The rock pool itself: a shallow oval of water with weed and a reflection.
  addNode(scene, {
    id: 'pool',
    tag: 'backdrop',
    hit: { x: 300, y: 360, r: 120 },
    paint(ctx) {
      ctx.save();
      ctx.beginPath();
      ctx.ellipse(300, 362, 168, 54, 0, 0, Math.PI * 2);
      const water = ctx.createLinearGradient(300, 310, 300, 416);
      water.addColorStop(0, '#7fc9d8');
      water.addColorStop(0.55, '#4f9fb4');
      water.addColorStop(1, '#3d7f96');
      ctx.fillStyle = water;
      ctx.fill();
      ctx.clip();
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.30)';
      ctx.lineWidth = 1.4;
      for (let line = 0; line < 9; line += 1) {
        ctx.beginPath();
        ctx.moveTo(160, 328 + line * 11);
        ctx.quadraticCurveTo(300, 322 + line * 11 + Math.sin(line) * 4, 442, 328 + line * 11);
        ctx.stroke();
      }
      ctx.fillStyle = 'rgba(112, 152, 74, 0.55)';
      for (let blob = 0; blob < 5; blob += 1) {
        ellipse(ctx, 214 + blob * 40, 388 - (blob % 2) * 14, 20, 7, 'rgba(112, 152, 74, 0.45)');
      }
      ctx.restore();
      // Rim highlight.
      ctx.beginPath();
      ctx.ellipse(300, 362, 168, 54, 0, 0, Math.PI * 2);
      ctx.strokeStyle = 'rgba(255, 250, 226, 0.35)';
      ctx.lineWidth = 2.4;
      ctx.stroke();
    },
  });

  rockNode(scene, 'rock-left', 118, 320, 54, '#8e9aa3', '#c3ccd2');
  rockNode(scene, 'rock-right', 486, 316, 62, '#7f8b95', '#b4bfc6');
  rockNode(scene, 'rock-back', 356, 306, 40, '#98a4ac', '#ccd5da');
  rockNode(scene, 'rock-small', 214, 300, 26, '#8e9aa3', '#c3ccd2');

  // A pool of weed and anemones: one node, so it can be mirrored as a whole.
  addNode(scene, {
    id: 'anemones',
    tag: 'anemone',
    hit: { x: 356, y: 352, r: 34 },
    diffable: ['hidden', 'moved', 'tinted', 'swollen'],
    baseColour: '#e2779a',
    paint(ctx, node) {
      const tint = node.tint ?? '#e2779a';
      for (let arm = 0; arm < 14; arm += 1) {
        const angle = -Math.PI / 2 + (arm - 7) * 0.15;
        const length = 12 + (arm % 3) * 4;
        ctx.beginPath();
        ctx.moveTo(356, 364);
        ctx.quadraticCurveTo(356 + Math.cos(angle) * length * 0.6, 364 + Math.sin(angle) * length * 0.6, 356 + Math.cos(angle) * length, 364 + Math.sin(angle) * length * 0.8);
        ctx.strokeStyle = tint;
        ctx.lineWidth = 2.6;
        ctx.lineCap = 'round';
        ctx.stroke();
        circle(ctx, 356 + Math.cos(angle) * length, 364 + Math.sin(angle) * length * 0.8, 1.6, fade('#ffffff', 0.7));
      }
      circle(ctx, 356, 364, 7, tint);
    },
  });

  starfishNode(scene, 'starfish-a', 246, 372, '#e8734a');
  shellNode(scene, 'shell-fan', 412, 384, '#f0dcc0');
  shellNode(scene, 'shell-spiral', 190, 392, '#e9c7b4');

  // A crab on the sand shelf, sideways and slightly lost.
  addNode(scene, {
    id: 'crab',
    tag: 'crab',
    hit: { x: 96, y: 384, r: 26 },
    diffable: ['hidden', 'moved', 'tinted'],
    baseColour: '#d4553f',
    paint(ctx, node) {
      const shell = node.tint ?? '#d4553f';
      ellipse(ctx, 96, 386, 17, 12, shell);
      ellipse(ctx, 96, 378, 12, 8, shell);
      for (const side of [-1, 1]) {
        ctx.strokeStyle = fade(shell, 0.8);
        ctx.lineWidth = 2.4;
        for (let leg = 0; leg < 3; leg += 1) {
          ctx.beginPath();
          ctx.moveTo(96 + side * 12, 388 + leg * 3);
          ctx.lineTo(96 + side * (22 + leg * 2), 396 + leg * 3);
          ctx.stroke();
        }
        ctx.beginPath();
        ctx.moveTo(96 + side * 12, 378);
        ctx.quadraticCurveTo(96 + side * 22, 368, 96 + side * 20, 362);
        ctx.stroke();
        fillRound(ctx, 96 + side * 20 - 4, 356, 8, 6, 2, shell);
      }
      circle(ctx, 90, 372, 2.2, '#2b1a16');
      circle(ctx, 102, 372, 2.2, '#2b1a16');
    },
  });

  // Bucket with a spade, and a towel on the sand.
  addNode(scene, {
    id: 'bucket',
    tag: 'bucket',
    hit: { x: 500, y: 384, r: 30 },
    diffable: ['hidden', 'moved', 'tinted', 'swollen'],
    baseColour: '#e0574f',
    paint(ctx, node) {
      const tint = node.tint ?? '#e0574f';
      ctx.beginPath();
      ctx.moveTo(482, 366);
      ctx.lineTo(518, 366);
      ctx.lineTo(512, 404);
      ctx.lineTo(488, 404);
      ctx.closePath();
      ctx.fillStyle = tint;
      ctx.fill();
      ctx.strokeStyle = fade('#ffffff', 0.35);
      ctx.lineWidth = 1.4;
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(500, 366, 18, Math.PI, 0);
      ctx.strokeStyle = 'rgba(90, 76, 60, 0.55)';
      ctx.lineWidth = 2;
      ctx.stroke();
      ctx.fillStyle = '#f0e2c4';
      ctx.fillRect(492, 366, 16, 3);
      // Spade leaning on the bucket.
      ctx.strokeStyle = '#c9a06a';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(524, 402);
      ctx.lineTo(534, 358);
      ctx.stroke();
      ellipse(ctx, 536, 352, 8, 7, '#9fc4d6');
    },
  });

  addNode(scene, {
    id: 'towel',
    tag: 'towel',
    hit: { x: 372, y: 404, r: 34 },
    diffable: ['hidden', 'moved', 'tinted'],
    baseColour: '#5fb0c9',
    paint(ctx, node) {
      const tint = node.tint ?? '#5fb0c9';
      fillRound(ctx, 340, 394, 74, 30, 4, tint);
      for (let stripe = 0; stripe < 4; stripe += 1) {
        ctx.fillStyle = 'rgba(255, 248, 232, 0.55)';
        ctx.fillRect(348 + stripe * 18, 394, 6, 30);
      }
      ctx.strokeStyle = 'rgba(90, 80, 60, 0.25)';
      ctx.lineWidth = 1;
      ctx.strokeRect(340, 394, 74, 30);
    },
  });

  // Grass tufts and driftwood at the terrace edge.
  addNode(scene, {
    id: 'grass',
    tag: 'grass',
    hit: { x: 566, y: 402, r: 26 },
    diffable: ['hidden', 'moved', 'flipped'],
    paint(ctx) {
      ctx.strokeStyle = '#6e8f45';
      ctx.lineWidth = 2;
      for (let blade = 0; blade < 9; blade += 1) {
        ctx.beginPath();
        ctx.moveTo(550 + blade * 4, 414);
        ctx.quadraticCurveTo(548 + blade * 4 + (blade % 2) * 6, 398, 550 + blade * 4 + (blade % 2 ? 10 : -6), 386 + (blade % 3) * 4);
        ctx.stroke();
      }
    },
  });

  addNode(scene, {
    id: 'driftwood',
    tag: 'driftwood',
    hit: { x: 140, y: 404, r: 30 },
    diffable: ['hidden', 'moved', 'flipped'],
    paint(ctx) {
      ctx.save();
      ctx.translate(140, 404);
      ctx.rotate(-0.14);
      fillRound(ctx, -34, -6, 68, 12, 6, '#9b7f5f');
      fillRound(ctx, -34, -6, 68, 4, 2, '#b59772');
      circle(ctx, -26, -1, 2, '#7d6448');
      circle(ctx, 18, 2, 1.6, '#7d6448');
      ctx.restore();
    },
  });

  addNode(scene, {
    id: 'glass-float',
    tag: 'buoy',
    hit: { x: 296, y: 340, r: 20 },
    diffable: ['hidden', 'moved', 'tinted', 'swollen'],
    baseColour: '#7fd8c4',
    paint(ctx, node) {
      const tint = node.tint ?? '#7fd8c4';
      glow(ctx, 296, 340, 22, fade(tint, 0.3));
      circle(ctx, 296, 340, 9, fade(tint, 0.85));
      circle(ctx, 293, 337, 3, fade('#ffffff', 0.6));
    },
  });
}

export function buildTidepool(random) {
  const scene = { width: WIDTH, height: HEIGHT, theme: 'tidepool', nodes: [] };
  buildSky(scene, random);
  buildSea(scene, random);
  buildTerrace(scene, random);
  return scene;
}
