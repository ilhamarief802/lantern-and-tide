// Level 1's picture: "Lantern Bazaar", a night market on a boardwalk over a slow harbour. The scene is
// built once from a seed as a list of nodes, so the same seed paints the same market and a difference
// only has to change the handful of nodes it names.

import { addNode, cloneScene } from '../model.js';
import { circle, ellipse, fade, fillRound, glow, gradientRect, label, rope, roundedRect, speckle, strokeRound } from './brush.js';

const WIDTH = 600;
const HEIGHT = 428;
const HORIZON = 246;

/** One hanging paper lantern: a shaded globe, its ribs, a tassel and the light it throws. */
function lanternNode(scene, id, x, y, radius, colour, { glowRadius = radius * 3.4, tag = 'lantern' } = {}) {
  addNode(scene, {
    id,
    tag,
    hit: { x, y, r: radius + 12 },
    diffable: ['tinted', 'hidden', 'moved'],
    baseColour: colour,
    paint(ctx, node) {
      const shade = node.tint ?? node.baseColour;
      glow(ctx, x, y, glowRadius, fade(shade, 0.34));
      ctx.strokeStyle = 'rgba(20, 24, 40, 0.85)';
      ctx.lineWidth = 1.6;
      ctx.beginPath();
      ctx.moveTo(x, y - radius * 1.9);
      ctx.lineTo(x, y - radius * 1.15);
      ctx.stroke();
      ellipse(ctx, x, y, radius, radius * 1.16, shade);
      const light = ctx.createRadialGradient(x - radius * 0.35, y - radius * 0.4, radius * 0.1, x, y, radius * 1.2);
      light.addColorStop(0, fade('#fff8e2', 0.85));
      light.addColorStop(0.55, fade('#ffffff', 0.12));
      light.addColorStop(1, fade('#ffffff', 0));
      ctx.beginPath();
      ctx.ellipse(x, y, radius, radius * 1.16, 0, 0, Math.PI * 2);
      ctx.fillStyle = light;
      ctx.fill();
      ctx.strokeStyle = fade('#2a1c10', 0.35);
      ctx.lineWidth = 1;
      for (let rib = -2; rib <= 2; rib += 1) {
        ctx.beginPath();
        ctx.ellipse(x, y, Math.abs(radius * (rib / 3)) + 0.6, radius * 1.16, 0, 0, Math.PI * 2);
        ctx.stroke();
      }
      fillRound(ctx, x - radius * 0.42, y - radius * 1.28, radius * 0.84, radius * 0.24, 2, fade('#241a12', 0.8));
      ctx.strokeStyle = fade('#f7d9a0', 0.8);
      ctx.lineWidth = 1.4;
      ctx.beginPath();
      ctx.moveTo(x, y + radius * 1.16);
      ctx.lineTo(x, y + radius * 1.75);
      ctx.stroke();
    },
  });
}

/** A triangular pennant on the bunting line. */
function pennantNode(scene, id, x, y, colour, flip) {
  addNode(scene, {
    id,
    tag: 'pennant',
    hit: { x, y: y + 10, r: 20 },
    diffable: ['hidden', 'moved'],
    paint(ctx) {
      ctx.beginPath();
      ctx.moveTo(x - 11, y);
      ctx.lineTo(x + 11, y);
      ctx.lineTo(x, y + 24);
      ctx.closePath();
      ctx.fillStyle = colour;
      ctx.fill();
      ctx.beginPath();
      ctx.moveTo(x - 11, y);
      ctx.lineTo(x + 11, y);
      ctx.lineTo(x, y + 24);
      ctx.closePath();
      ctx.strokeStyle = fade('#0d1020', 0.35);
      ctx.lineWidth = 1;
      ctx.stroke();
      if (flip) return true;
    },
  });
}

function buildSky(scene, random) {
  addNode(scene, {
    id: 'sky',
    tag: 'backdrop',
    hit: { x: WIDTH / 2, y: 120, r: 260 },
    paint(ctx) {
      gradientRect(ctx, 0, 0, WIDTH, HORIZON + 30, [
        [0, '#0a0f24'],
        [0.42, '#152046'],
        [0.75, '#33305a'],
        [1, '#6b4a63'],
      ]);
      glow(ctx, 452, 214, 250, 'rgba(255, 178, 122, 0.16)');
    },
  });

  // The star field is sampled once, at build time: a painter that rolled its own dice would draw a
  // different sky in each panel, and the two pictures would differ everywhere.
  const stars = [];
  for (let index = 0; index < 148; index += 1) {
    const faint = index >= 130;
    stars.push({
      x: random.range(0, WIDTH),
      y: random.range(0, HORIZON - (faint ? 70 : 40)),
      size: faint ? random.range(0.7, 1.6) : random.range(0.4, 1.3),
      colour: faint ? 'rgba(255, 235, 200, 0.9)' : 'rgba(255, 244, 224, 0.55)',
    });
  }
  addNode(scene, {
    id: 'stars',
    tag: 'backdrop',
    hit: { x: 300, y: 60, r: 240 },
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
    hit: { x: 470, y: 58, r: 34 },
    paint(ctx) {
      glow(ctx, 470, 58, 120, 'rgba(255, 236, 190, 0.22)');
      circle(ctx, 470, 58, 29, '#fdf3d3');
      circle(ctx, 461, 50, 7, fade('#e9d9b0', 0.75));
      circle(ctx, 481, 67, 5, fade('#e9d9b0', 0.7));
      circle(ctx, 474, 46, 3.4, fade('#e9d9b0', 0.6));
    },
  });

  addNode(scene, {
    id: 'clouds',
    tag: 'backdrop',
    hit: { x: 210, y: 88, r: 90 },
    paint(ctx) {
      ellipse(ctx, 196, 84, 54, 12, 'rgba(70, 78, 116, 0.55)');
      ellipse(ctx, 320, 112, 66, 10, 'rgba(64, 72, 110, 0.45)');
      ellipse(ctx, 118, 132, 42, 8, 'rgba(58, 66, 104, 0.4)');
    },
  });

  // The far skyline of the harbour town: roof lines, a lighthouse, a crane, shop signs. The lit windows
  // are chosen once, here, so both panels get the same scatter of lights.
  const buildings = [
    [0, 186, 46, 60], [48, 168, 34, 78], [86, 196, 54, 50], [144, 176, 40, 70],
    [188, 204, 62, 42], [254, 192, 30, 54], [288, 168, 48, 78], [340, 200, 44, 46],
    [388, 184, 52, 62], [444, 196, 34, 50], [482, 172, 40, 74], [526, 188, 74, 58],
  ];
  const windows = [];
  for (const [x, y, width, height] of buildings) {
    for (let wy = y + 8; wy < y + height - 6; wy += 12) {
      for (let wx = x + 6; wx < x + width - 6; wx += 11) {
        if (random.chance(0.42)) windows.push([wx, wy]);
      }
    }
  }
  addNode(scene, {
    id: 'skyline',
    tag: 'backdrop',
    hit: { x: 300, y: 210, r: 250 },
    paint(ctx) {
      ctx.fillStyle = '#171d38';
      for (const [x, y, width, height] of buildings) ctx.fillRect(x, y, width, height);
      ctx.fillStyle = 'rgba(255, 205, 130, 0.55)';
      for (const [wx, wy] of windows) ctx.fillRect(wx, wy, 4, 5);
      // Lighthouse with its beam.
      ctx.fillStyle = '#1c2340';
      ctx.beginPath();
      ctx.moveTo(566, 168);
      ctx.lineTo(578, 168);
      ctx.lineTo(574, 246);
      ctx.lineTo(570, 246);
      ctx.closePath();
      ctx.fill();
      glow(ctx, 572, 168, 26, 'rgba(255, 230, 170, 0.5)');
      circle(ctx, 572, 167, 4, '#ffe9b6');
      // Crane.
      ctx.strokeStyle = '#1c2340';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(120, 176);
      ctx.lineTo(120, 246);
      ctx.moveTo(104, 178);
      ctx.lineTo(148, 178);
      ctx.moveTo(146, 178);
      ctx.lineTo(146, 200);
      ctx.stroke();
    },
  });
}

function buildHarbour(scene, random) {
  // Ripples and the moon's reflection are sampled once: the water is painted twice, once per panel, and
  // a painter that rolled its own dice every time would make the two seas different.
  const ripples = [];
  for (let index = 0; index < 46; index += 1) {
    ripples.push({
      x: random.range(0, WIDTH),
      y: HORIZON + random.range(6, 88),
      width: random.range(8, 34),
      warm: index % 3 === 0,
    });
  }
  const moonPath = [];
  for (let index = 0; index < 9; index += 1) moonPath.push([452 + random.range(-8, 8), HORIZON + index * 9, 22 - index]);

  addNode(scene, {
    id: 'water',
    tag: 'backdrop',
    hit: { x: 300, y: 300, r: 250 },
    paint(ctx) {
      gradientRect(ctx, 0, HORIZON, WIDTH, 96, [
        [0, '#1b2a4a'],
        [0.5, '#213556'],
        [1, '#16233c'],
      ]);
      for (const ripple of ripples) {
        ctx.fillStyle = ripple.warm ? 'rgba(255, 199, 128, 0.20)' : 'rgba(120, 176, 220, 0.14)';
        ctx.fillRect(ripple.x, ripple.y, ripple.width, 1.6);
      }
      ctx.fillStyle = 'rgba(255, 236, 200, 0.30)';
      for (const [x, y, width] of moonPath) ctx.fillRect(x, y, width, 1.4);
    },
  });

  addNode(scene, {
    id: 'boat',
    tag: 'boat',
    hit: { x: 336, y: 300, r: 62 },
    diffable: ['hidden', 'moved', 'flipped'],
    paint(ctx) {
      // Moored in the water between the two stalls, where nothing painted later can cover it.
      ctx.save();
      ctx.translate(218, -18);
      ctx.beginPath();
      ctx.moveTo(70, 316);
      ctx.quadraticCurveTo(118, 350, 170, 314);
      ctx.lineTo(162, 330);
      ctx.quadraticCurveTo(118, 356, 78, 330);
      ctx.closePath();
      ctx.fillStyle = '#2b2a3c';
      ctx.fill();
      ctx.strokeStyle = '#0f1220';
      ctx.lineWidth = 2;
      ctx.stroke();
      ctx.strokeStyle = '#3c3b52';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(118, 320);
      ctx.lineTo(118, 250);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(120, 254);
      ctx.lineTo(156, 300);
      ctx.lineTo(120, 306);
      ctx.closePath();
      ctx.fillStyle = 'rgba(210, 220, 240, 0.82)';
      ctx.fill();
      glow(ctx, 150, 306, 20, 'rgba(255, 190, 110, 0.45)');
      circle(ctx, 150, 306, 3.4, '#ffd38a');
      ctx.restore();
    },
  });

  addNode(scene, {
    id: 'gulls',
    tag: 'gulls',
    hit: { x: 372, y: 148, r: 34 },
    diffable: ['hidden', 'moved'],
    paint(ctx) {
      ctx.strokeStyle = 'rgba(247, 250, 255, 0.92)';
      ctx.lineWidth = 2.8;
      for (const [gx, gy, size] of [[358, 146, 9], [378, 138, 7], [392, 154, 6]]) {
        ctx.beginPath();
        ctx.moveTo(gx - size, gy);
        ctx.quadraticCurveTo(gx - size / 2, gy - size * 0.7, gx, gy);
        ctx.quadraticCurveTo(gx + size / 2, gy - size * 0.7, gx + size, gy);
        ctx.stroke();
      }
    },
  });

  // The boardwalk: planks, a rail, posts and a low bank of rope lights.
  addNode(scene, {
    id: 'boardwalk',
    tag: 'backdrop',
    hit: { x: 300, y: 380, r: 250 },
    paint(ctx) {
      gradientRect(ctx, 0, 338, WIDTH, HEIGHT - 338, [
        [0, '#3a2b26'],
        [1, '#221a19'],
      ]);
      ctx.fillStyle = 'rgba(0, 0, 0, 0.22)';
      ctx.fillRect(0, 338, WIDTH, 5);
      for (let y = 346; y < HEIGHT; y += 17) {
        ctx.fillStyle = 'rgba(0, 0, 0, 0.20)';
        ctx.fillRect(0, y, WIDTH, 2.4);
        ctx.fillStyle = 'rgba(255, 214, 170, 0.05)';
        ctx.fillRect(0, y + 2.6, WIDTH, 1.4);
      }
      const seams = [46, 132, 218, 296, 372, 448, 524];
      ctx.strokeStyle = 'rgba(0, 0, 0, 0.28)';
      ctx.lineWidth = 1.6;
      for (const x of seams) {
        ctx.beginPath();
        ctx.moveTo(x, 346);
        ctx.lineTo(x - 6, HEIGHT);
        ctx.stroke();
      }
      // Rail along the water's edge.
      ctx.fillStyle = '#4a3428';
      ctx.fillRect(0, 330, WIDTH, 8);
      ctx.fillStyle = '#5d4233';
      ctx.fillRect(0, 330, WIDTH, 3);
      for (const x of [24, 118, 212, 306, 400, 494, 588]) {
        ctx.fillStyle = '#402c22';
        ctx.fillRect(x - 4, 312, 8, 22);
        ctx.fillStyle = 'rgba(255, 226, 190, 0.16)';
        ctx.fillRect(x - 4, 312, 2, 22);
      }
      // Rope lights strung along the rail.
      for (let x = 10; x < WIDTH; x += 26) {
        glow(ctx, x, 327, 9, 'rgba(255, 190, 120, 0.30)');
        circle(ctx, x, 327, 1.8, '#ffe0ac');
      }
    },
  });
}

function buildLeftStall(scene, random) {
  const stripes = ['#b8443f', '#f3e7cf'];
  addNode(scene, {
    id: 'left-awning',
    tag: 'awning',
    hit: { x: 108, y: 210, r: 96 },
    paint(ctx) {
      // Awning with scalloped edge, striped across.
      for (let i = 0; i < 8; i += 1) {
        ctx.fillStyle = stripes[i % 2];
        ctx.beginPath();
        ctx.moveTo(16 + i * 24, 176);
        ctx.lineTo(40 + i * 24, 176);
        ctx.lineTo(40 + i * 24, 214);
        ctx.quadraticCurveTo(28 + i * 24, 226, 16 + i * 24, 214);
        ctx.closePath();
        ctx.fill();
      }
      ctx.fillStyle = 'rgba(0, 0, 0, 0.18)';
      ctx.fillRect(16, 206, 192, 6);
      // Posts.
      ctx.fillStyle = '#4c3426';
      ctx.fillRect(18, 176, 6, 150);
      ctx.fillRect(200, 176, 6, 150);
      // Counter and back cloth.
      gradientRect(ctx, 22, 214, 182, 112, [
        [0, '#2a1e22'],
        [1, '#1a1418'],
      ]);
      ctx.fillStyle = '#593d2c';
      ctx.fillRect(22, 292, 182, 12);
      ctx.fillStyle = '#6d4a33';
      ctx.fillRect(22, 292, 182, 4);
    },
  });

  // Crates of produce: each crate is its own node so a fruit may go missing.
  const crate = (id, x, y, fruit, count) => addNode(scene, {
    id,
    tag: 'crate',
    hit: { x, y: y + 8, r: 26 },
    diffable: ['hidden', 'moved'],
    paint(ctx) {
      gradientRect(ctx, x - 26, y - 4, 52, 30, [[0, '#7d583d'], [1, '#54392a']]);
      fillRound(ctx, x - 26, y - 4, 52, 7, 3, '#8b6448');
      ctx.fillStyle = 'rgba(28, 17, 12, 0.35)';
      for (let slat = 1; slat < 3; slat += 1) ctx.fillRect(x - 26, y - 4 + slat * 8, 52, 1.4);
      ctx.fillStyle = 'rgba(255, 226, 190, 0.18)';
      ctx.fillRect(x - 24, y - 3, 48, 1.6);
      for (let i = 0; i < count; i += 1) {
        const px = x - 19 + (i % 6) * 8;
        const py = y + 2 - Math.floor(i / 6) * 7;
        circle(ctx, px, py, 4.4, fruit);
        circle(ctx, px - 1.2, py - 1.4, 1.5, fade('#ffffff', 0.35));
      }
      ctx.strokeStyle = 'rgba(20, 12, 10, 0.45)';
      ctx.lineWidth = 1.2;
      ctx.strokeRect(x - 26, y - 4, 52, 30);
    },
  });
  crate('crate-oranges', 60, 266, '#f08a3c', 11);
  crate('crate-limes', 118, 266, '#8fc85a', 10);
  crate('crate-plums', 60, 232, '#a06bd0', 9);

  addNode(scene, {
    id: 'jars',
    tag: 'jars',
    hit: { x: 166, y: 262, r: 26 },
    diffable: ['hidden', 'moved', 'swollen'],
    paint(ctx) {
      for (const [jx, jy, jh, colour] of [[152, 258, 26, '#c98b4b'], [172, 262, 22, '#7bbf9b']]) {
        fillRound(ctx, jx - 9, jy - jh, 18, jh, 5, 'rgba(226, 236, 246, 0.24)');
        fillRound(ctx, jx - 8, jy - jh + 8, 16, jh - 10, 4, colour);
        fillRound(ctx, jx - 10, jy - jh - 4, 20, 6, 2, '#8a6a4a');
      }
    },
  });

  // A potted fern on the counter's end.
  addNode(scene, {
    id: 'fern',
    tag: 'fern',
    hit: { x: 208, y: 246, r: 26 },
    diffable: ['hidden', 'moved', 'flipped'],
    paint(ctx) {
      fillRound(ctx, 196, 252, 24, 22, 4, '#8a5e3d');
      ctx.fillStyle = '#3f7f52';
      for (let i = 0; i < 7; i += 1) {
        const angle = -Math.PI / 2 + (i - 3) * 0.34;
        ctx.save();
        ctx.translate(208, 252);
        ctx.rotate(angle);
        ctx.beginPath();
        ctx.ellipse(0, -14, 4.4, 15, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }
      ctx.fillStyle = '#4f9a63';
      for (let i = 0; i < 5; i += 1) {
        const angle = -Math.PI / 2 + (i - 2) * 0.42;
        ctx.save();
        ctx.translate(208, 252);
        ctx.rotate(angle);
        ctx.beginPath();
        ctx.ellipse(0, -12, 3, 11, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }
    },
  });

  // A hanging shop sign with a painted glyph.
  addNode(scene, {
    id: 'sign',
    tag: 'sign',
    hit: { x: 132, y: 204, r: 36 },
    diffable: ['hidden', 'moved'],
    paint(ctx) {
      // Hung on the awning's front edge, where it is not covered by the stall it belongs to.
      ctx.save();
      ctx.translate(0, 52);
      rope(ctx, 112, 132, 152, 132, 0, '#2a1d17', 2);
      fillRound(ctx, 108, 132, 48, 30, 5, '#1f2a33');
      strokeRound(ctx, 108, 132, 48, 30, 5, '#9cc6c0', 1.6);
      ctx.strokeStyle = '#f0c98a';
      ctx.lineWidth = 2;
      // A painted bowl of noodles: the bowl, then two steam curls above it.
      ctx.beginPath();
      ctx.moveTo(120, 144);
      ctx.quadraticCurveTo(132, 157, 144, 144);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(126, 143);
      ctx.quadraticCurveTo(129, 135, 132, 142);
      ctx.moveTo(134, 142);
      ctx.quadraticCurveTo(137, 134, 140, 141);
      ctx.stroke();
      // Tassels hanging off the board's corners.
      ctx.strokeStyle = fade('#d9894a', 0.85);
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      ctx.moveTo(112, 162);
      ctx.lineTo(112, 171);
      ctx.moveTo(152, 162);
      ctx.lineTo(152, 169);
      ctx.stroke();
      ctx.restore();
    },
  });
}

function buildRightStall(scene, random) {
  addNode(scene, {
    id: 'right-stall',
    tag: 'backdrop',
    hit: { x: 500, y: 260, r: 110 },
    paint(ctx) {
      // A tea stall with a bamboo roof, a steam pot and stacked bowls.
      gradientRect(ctx, 402, 208, 184, 130, [[0, '#241a20'], [1, '#150f14']]);
      for (let i = 0; i < 9; i += 1) {
        ctx.fillStyle = i % 2 === 0 ? '#3f6d5e' : '#d8cdb4';
        ctx.beginPath();
        ctx.moveTo(398 + i * 21, 196);
        ctx.lineTo(419 + i * 21, 196);
        ctx.lineTo(419 + i * 21, 214);
        ctx.quadraticCurveTo(408 + i * 21, 224, 398 + i * 21, 214);
        ctx.closePath();
        ctx.fill();
      }
      ctx.fillStyle = '#3b2a1e';
      ctx.fillRect(404, 196, 6, 142);
      ctx.fillRect(580, 196, 6, 142);
      ctx.fillStyle = '#513a28';
      ctx.fillRect(404, 288, 184, 12);
      ctx.fillStyle = '#63452f';
      ctx.fillRect(404, 288, 184, 4);
      // Steam pot on the counter.
      fillRound(ctx, 448, 258, 40, 30, 6, '#3a3b46');
      fillRound(ctx, 444, 254, 48, 8, 4, '#4b4d5b');
      ctx.strokeStyle = 'rgba(240, 246, 255, 0.30)';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(460, 248);
      ctx.quadraticCurveTo(452, 232, 464, 220);
      ctx.moveTo(478, 248);
      ctx.quadraticCurveTo(486, 230, 474, 218);
      ctx.stroke();
      // Stacked bowls.
      for (let i = 0; i < 5; i += 1) {
        ellipse(ctx, 538, 284 - i * 6, 22 - i * 0.6, 5.2, i % 2 ? '#e8dfcb' : '#cfc4ab');
      }
      // Paper menu on the post.
      fillRound(ctx, 410, 216, 26, 34, 3, '#f2e8d2');
      ctx.fillStyle = 'rgba(60, 44, 32, 0.55)';
      for (let i = 0; i < 5; i += 1) ctx.fillRect(414, 224 + i * 5.4, 18 - (i % 2) * 6, 1.6);
    },
  });

  // Steam bowls and bottles on the left of the stall: separate nodes, easy to lose one.
  addNode(scene, {
    id: 'tea-jars',
    tag: 'jar',
    hit: { x: 424, y: 276, r: 20 },
    diffable: ['hidden', 'moved'],
    paint(ctx) {
      for (const [x, h, colour] of [[416, 16, '#c9a24a'], [428, 20, '#7a9f6a']]) {
        fillRound(ctx, x - 6, 288 - h, 12, h + 2, 3, fade('#e6eef6', 0.3));
        fillRound(ctx, x - 5, 288 - h + 4, 10, h - 4, 2, colour);
      }
    },
  });

  // A stool with a striped cushion.
  addNode(scene, {
    id: 'stool',
    tag: 'stool',
    hit: { x: 528, y: 318, r: 28 },
    diffable: ['hidden', 'moved', 'swollen'],
    paint(ctx) {
      ctx.fillStyle = '#4a3428';
      ctx.fillRect(516, 316, 4, 22);
      ctx.fillRect(538, 316, 4, 22);
      fillRound(ctx, 508, 306, 42, 12, 5, '#c1663f');
      for (let i = 0; i < 4; i += 1) {
        ctx.fillStyle = i % 2 ? '#f0e0c8' : '#c1663f';
        ctx.fillRect(509 + i * 10, 306, 5, 12);
      }
    },
  });
}

function buildLanterns(scene) {
  addNode(scene, {
    id: 'lantern-line',
    tag: 'backdrop',
    hit: { x: 300, y: 84, r: 250 },
    paint(ctx) {
      rope(ctx, -10, 58, 616, 44, 30, 'rgba(24, 18, 20, 0.9)', 2.2);
    },
  });
  lanternNode(scene, 'lantern-amber', 84, 76, 21, '#ffb347');
  lanternNode(scene, 'lantern-rose', 168, 84, 18, '#ff7a7a');
  lanternNode(scene, 'lantern-jade', 252, 90, 23, '#7ee0b0');
  lanternNode(scene, 'lantern-violet', 336, 88, 17, '#b98cf0');
  lanternNode(scene, 'lantern-gold', 420, 80, 20, '#ffd166');
  lanternNode(scene, 'lantern-coral', 500, 72, 15, '#ff9a76');
  lanternNode(scene, 'lantern-blue', 566, 68, 18, '#7fb8ff');

  // Bunting between the two stalls.
  addNode(scene, {
    id: 'bunting-line',
    tag: 'backdrop',
    hit: { x: 300, y: 170, r: 250 },
    paint(ctx) {
      // Hung above both awnings: anything lower would be painted over by a stall and hide a difference.
      rope(ctx, 8, 140, 596, 134, 14, 'rgba(30, 22, 26, 0.8)', 1.6);
    },
  });
  const pennantColours = ['#f0c05a', '#5ec7c1', '#e8798a', '#8fbf6a', '#c79bf0', '#f0a05a'];
  for (let i = 0; i < 9; i += 1) {
    const x = 40 + i * 62;
    const y = 146 + Math.sin((i / 8) * Math.PI) * 7;
    pennantNode(scene, `pennant-${i + 1}`, x, y, pennantColours[i % pennantColours.length], i % 2 === 0);
  }
}

function buildDetails(scene, random) {
  // The cat asleep on the rail, a favourite to move or mirror.
  addNode(scene, {
    id: 'cat',
    tag: 'cat',
    hit: { x: 250, y: 320, r: 30 },
    diffable: ['hidden', 'moved', 'flipped'],
    paint(ctx) {
      ctx.save();
      ctx.translate(-50, 6);
      // A ginger cat, lit from the lanterns above: the pale rim is what makes it readable on dark wood.
      ctx.fillStyle = '#c08a52';
      ctx.beginPath();
      ctx.ellipse(300, 315, 25, 12, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#d19a60';
      ctx.beginPath();
      ctx.ellipse(300, 309, 22, 7, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#e2ad72';
      ctx.beginPath();
      ctx.ellipse(321, 305, 11, 10, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#c08a52';
      ctx.beginPath();
      ctx.moveTo(313, 299);
      ctx.lineTo(316, 288);
      ctx.lineTo(322, 298);
      ctx.closePath();
      ctx.moveTo(325, 298);
      ctx.lineTo(331, 289);
      ctx.lineTo(333, 300);
      ctx.closePath();
      ctx.fill();
      ctx.strokeStyle = '#c08a52';
      ctx.lineWidth = 4;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(277, 316);
      ctx.quadraticCurveTo(263, 310, 266, 296);
      ctx.stroke();
      // Closed eyes, nose and a whisker, as thin dark lines.
      ctx.strokeStyle = 'rgba(52, 34, 22, 0.85)';
      ctx.lineWidth = 1.4;
      ctx.beginPath();
      ctx.moveTo(316, 304);
      ctx.quadraticCurveTo(318, 306, 321, 304);
      ctx.moveTo(324, 304);
      ctx.quadraticCurveTo(326, 306, 329, 304);
      ctx.moveTo(322, 309);
      ctx.lineTo(324, 309);
      ctx.stroke();
      ctx.fillStyle = 'rgba(255, 226, 180, 0.35)';
      ctx.fillRect(284, 320, 32, 2);
      ctx.restore();
    },
  });

  // A barrel by the post, and a coil of rope.
  addNode(scene, {
    id: 'barrel',
    tag: 'barrel',
    hit: { x: 462, y: 336, r: 26 },
    diffable: ['hidden', 'moved', 'swollen'],
    paint(ctx) {
      fillRound(ctx, 442, 316, 40, 42, 8, '#5b3c26');
      ctx.fillStyle = 'rgba(0, 0, 0, 0.35)';
      ctx.fillRect(442, 326, 40, 4);
      ctx.fillRect(442, 344, 40, 4);
      ctx.fillStyle = 'rgba(255, 220, 180, 0.12)';
      ctx.fillRect(446, 316, 5, 42);
    },
  });

  addNode(scene, {
    id: 'rope-coil',
    tag: 'rope-coil',
    hit: { x: 386, y: 352, r: 20 },
    diffable: ['hidden', 'moved'],
    paint(ctx) {
      ctx.strokeStyle = '#b08a5a';
      ctx.lineWidth = 3;
      for (let r = 14; r > 4; r -= 4) {
        ctx.beginPath();
        ctx.arc(386, 352, r, 0.15 * Math.PI, 1.9 * Math.PI);
        ctx.stroke();
      }
    },
  });

  // Fireflies drifting over the boardwalk, two small clusters.
  addNode(scene, {
    id: 'fireflies',
    tag: 'fireflies',
    hit: { x: 244, y: 366, r: 30 },
    diffable: ['hidden', 'moved'],
    paint(ctx) {
      for (const [x, y, size] of [[232, 360, 2.6], [246, 372, 2], [258, 356, 1.8], [240, 348, 1.6]]) {
        glow(ctx, x, y, size * 5, 'rgba(210, 255, 170, 0.5)');
        circle(ctx, x, y, size, '#e9ffd0');
      }
    },
  });

  // Chalk marks on the planks, drawn by someone before us.
  addNode(scene, {
    id: 'chalk',
    tag: 'chalk',
    hit: { x: 350, y: 402, r: 26 },
    diffable: ['hidden', 'moved', 'flipped'],
    paint(ctx) {
      // Hopscotch chalked on the planks, in perspective: a circle and two tallies.
      ctx.strokeStyle = 'rgba(252, 248, 236, 0.62)';
      ctx.lineWidth = 2.4;
      ctx.save();
      ctx.translate(352, 402);
      ctx.transform(1, 0, -0.5, 0.74, 0, 0);
      ctx.beginPath();
      ctx.arc(0, 0, 7, 0, Math.PI * 2);
      ctx.moveTo(12, -4);
      ctx.lineTo(12, 4);
      ctx.moveTo(17, -4);
      ctx.lineTo(17, 4);
      ctx.stroke();
      ctx.restore();
    },
  });

  // A little fish crate on the planks, its tail the giveaway.
  addNode(scene, {
    id: 'fish-crate',
    tag: 'fish',
    hit: { x: 196, y: 386, r: 26 },
    diffable: ['hidden', 'moved', 'flipped'],
    paint(ctx) {
      fillRound(ctx, 170, 372, 52, 30, 4, '#5a4a3c');
      ctx.strokeStyle = 'rgba(0, 0, 0, 0.35)';
      ctx.lineWidth = 1.4;
      ctx.strokeRect(170, 372, 52, 30);
      ellipse(ctx, 190, 380, 13, 6, '#b9c6d6');
      ctx.beginPath();
      ctx.moveTo(202, 380);
      ctx.lineTo(212, 374);
      ctx.lineTo(212, 386);
      ctx.closePath();
      ctx.fillStyle = '#b9c6d6';
      ctx.fill();
      circle(ctx, 183, 378, 1.4, '#243044');
      ellipse(ctx, 196, 388, 12, 5, '#9fb0c4');
    },
  });

  // A wine glass left on the counter, catching the lantern light.
  addNode(scene, {
    id: 'glass',
    tag: 'glass',
    hit: { x: 134, y: 286, r: 18 },
    diffable: ['hidden', 'moved', 'swollen'],
    paint(ctx) {
      ctx.fillStyle = 'rgba(226, 240, 255, 0.28)';
      ctx.beginPath();
      ctx.moveTo(126, 268);
      ctx.lineTo(142, 268);
      ctx.quadraticCurveTo(142, 282, 134, 282);
      ctx.quadraticCurveTo(126, 282, 126, 268);
      ctx.fill();
      ctx.strokeStyle = 'rgba(236, 246, 255, 0.55)';
      ctx.lineWidth = 1.4;
      ctx.beginPath();
      ctx.moveTo(134, 282);
      ctx.lineTo(134, 292);
      ctx.moveTo(128, 292);
      ctx.lineTo(140, 292);
      ctx.stroke();
    },
  });
}

/** Builds level 1: the bazaar, its lanterns and its harbour, from one seed. */
export function buildBazaar(random) {
  const scene = { width: WIDTH, height: HEIGHT, theme: 'bazaar', nodes: [] };
  buildSky(scene, random);
  buildHarbour(scene, random);
  buildLanterns(scene);
  buildLeftStall(scene, random);
  buildRightStall(scene, random);
  buildDetails(scene, random);
  return scene;
}

export { cloneScene };
