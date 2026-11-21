// Choosing the differences a level hides. A candidate is any node whose painter offered the mutation,
// and the picker takes them in seeded order while keeping the spots far enough apart that the puzzle is
// a spread-out search rather than a clump in one corner.

import { PUZZLE } from './config.js';
import { applyDifference, cloneScene } from './model.js';

/** Plausible repaints for a node that offered 'tinted', never close to the colour it already wears. */
const TINTS = ['#ff8a8a', '#7fb8ff', '#8fe6b8', '#ffd166', '#c39bf0', '#ffad7a', '#5ad0e6', '#f07ab0'];

/** How far apart two colours are in plain RGB distance: 0 for the same colour, ~441 at the extremes. */
function colourDistance(a, b) {
  const parse = (hex) => {
    const text = hex.replace('#', '');
    const full = text.length === 3 ? text.split('').map((c) => c + c).join('') : text;
    const value = Number.parseInt(full, 16);
    return [(value >> 16) & 255, (value >> 8) & 255, value & 255];
  };
  const [r1, g1, b1] = parse(a);
  const [r2, g2, b2] = parse(b);
  return Math.hypot(r1 - r2, g1 - g2, b1 - b2);
}

const MOVE_STEPS = [
  [20, -9],
  [19, 11],
  [-21, 8],
  [-19, -10],
  [8, 17],
  [-10, 15],
];

function mutationParams(node, mutation, random, index) {
  switch (mutation) {
    case 'moved': {
      const [dx, dy] = MOVE_STEPS[index % MOVE_STEPS.length];
      return { mutation, dx, dy };
    }
    case 'swollen':
      return { mutation, scale: 1.24 };
    case 'tinted': {
      const base = (node.baseColour ?? '').toLowerCase();
      // A repaint has to be far enough from the original to be seen, or the puzzle has an unanswerable spot.
      const choices = TINTS.filter((tint) => base === '' || colourDistance(tint, base) > 120);
      return { mutation, tint: random.pick(choices.length > 0 ? choices : TINTS) };
    }
    case 'hidden':
      return { mutation };
    case 'flipped':
      return { mutation };
    default:
      return null;
  }
}

/**
 * Picks `count` differences for a scene: distinct nodes, far apart, mixing mutations so the puzzle is
 * not eight instances of the same trick. Returns them with the spot each one sits on in panel A.
 */
export function chooseDifferences(scene, random, count) {
  const candidates = scene.nodes
    .filter((node) => node.diffable.length > 0)
    .map((node) => ({ node, order: random.next() }))
    .sort((a, b) => a.order - b.order)
    .map((entry) => entry.node);

  const chosen = [];
  let spread = PUZZLE.minSpread;
  while (chosen.length < count && spread > 40) {
    for (const node of candidates) {
      if (chosen.length >= count) break;
      if (chosen.some((picked) => picked.nodeId === node.id)) continue;
      if (chosen.some((picked) => Math.hypot(picked.spot.x - node.hit.x, picked.spot.y - node.hit.y) < spread)) continue;
      // Spread the mutation types: take the first the node offers that is least used so far.
      const usage = new Map();
      for (const picked of chosen) usage.set(picked.mutation, (usage.get(picked.mutation) ?? 0) + 1);
      const ordered = [...node.diffable].sort((a, b) => (usage.get(a) ?? 0) - (usage.get(b) ?? 0));
      for (const mutation of ordered) {
        const params = mutationParams(node, mutation, random, chosen.length);
        if (!params) continue;
        chosen.push({
          id: `diff-${chosen.length + 1}`,
          nodeId: node.id,
          tag: node.tag,
          spot: { x: node.hit.x, y: node.hit.y },
          radius: Math.max(18, Math.min(node.hit.r, 30)),
          label: `${params.mutation} ${node.tag}`,
          ...params,
        });
        break;
      }
    }
    spread -= 14;
  }
  return chosen;
}

/** Panel B's model: the scene with every chosen difference applied. */
export function variantOf(scene, differences) {
  const variant = cloneScene(scene);
  for (const difference of differences) applyDifference(variant, difference);
  return variant;
}

/** The gradient hint for what to look for, shown when the player spends a hint. */
export function hintText(difference) {
  const where = difference.spot.x < 200 ? 'on the left of the picture'
    : difference.spot.x > 400 ? 'on the right of the picture'
      : 'toward the middle';
  const what = {
    hidden: `something ${difference.tag} is missing`,
    moved: `the ${difference.tag} has shifted`,
    flipped: `the ${difference.tag} is facing the other way`,
    swollen: `the ${difference.tag} has grown`,
    tinted: `the ${difference.tag} changed colour`,
  };
  return `${what[difference.mutation] ?? 'one detail changed'} ${where}`;
}
