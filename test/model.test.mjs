// The model's own checks, with no browser needed: a level's scene, the differences chosen for it, and the
// variant panel B is painted from. They prove the two pictures are one scene and that every difference
// the picker hands out actually changes the node it names — the fairness rule the whole game rests on.

import { test } from 'node:test';
import assert from 'node:assert/strict';

import { LEVELS } from '../game/src/level-data.js';
import { chooseDifferences } from '../game/src/differences.js';
import { cloneScene } from '../game/src/model.js';
import { buildPuzzle } from '../game/src/game.js';
import { makeRandom } from '../game/src/random.js';
import { PUZZLE } from '../game/src/config.js';

/** Every (level, seed) pair the checks look at: three levels times a spread of seeds. */
const SEEDS = [1, 2, 3, 4, 5, 7, 11];

for (const [index, level] of LEVELS.entries()) {
  test(`level ${index + 1} (${level.id}) hides exactly its count of differences, every seed`, () => {
    for (const seed of SEEDS) {
      const puzzle = buildPuzzle(level, makeRandom(seed));
      assert.equal(puzzle.differences.length, level.count, `seed ${seed}`);
      const ids = new Set(puzzle.differences.map((difference) => difference.nodeId));
      assert.equal(ids.size, level.count, `seed ${seed}: one node per difference`);
    }
  });

  test(`level ${index + 1} spreads its differences out and names a real node for each`, () => {
    for (const seed of SEEDS) {
      const random = makeRandom(seed);
      const scene = level.build(random);
      const differences = chooseDifferences(scene, random, level.count);
      for (const a of differences) {
        assert.ok(scene.nodes.some((node) => node.id === a.nodeId), `seed ${seed}: ${a.nodeId} exists`);
        assert.ok(a.radius > 0 && a.spot.x >= 0 && a.spot.y >= 0, `seed ${seed}: ${a.nodeId} has a spot`);
      }
      for (let i = 0; i < differences.length; i += 1) {
        for (let j = i + 1; j < differences.length; j += 1) {
          const dx = differences[i].spot.x - differences[j].spot.x;
          const dy = differences[i].spot.y - differences[j].spot.y;
          assert.ok(Math.hypot(dx, dy) >= PUZZLE.minSpacing, `seed ${seed}: ${differences[i].nodeId} and ${differences[j].nodeId} are too close`);
        }
      }
    }
  });

  test(`level ${index + 1}'s variant changes each named node and nothing else`, () => {
    for (const seed of SEEDS) {
      const puzzle = buildPuzzle(level, makeRandom(seed));
      const before = new Map(cloneScene(puzzle.scene).nodes.map((node) => [node.id, node]));
      for (const difference of puzzle.differences) {
        const node = puzzle.variant.nodes.find((candidate) => candidate.id === difference.nodeId);
        assert.ok(node, `seed ${seed}: ${difference.nodeId} is in the variant`);
        const changed = node.hidden
          || node.dx !== 0 || node.dy !== 0
          || node.sx !== 1 || node.sy !== 1
          || (node.tint !== null && node.tint !== undefined);
        assert.ok(changed, `seed ${seed}: ${difference.mutation} on ${difference.nodeId} changes nothing`);
      }
      const touched = puzzle.variant.nodes.filter((node) => {
        const original = before.get(node.id);
        return node.hidden || node.dx || node.dy || node.sx !== 1 || node.sy !== 1 || node.tint;
      });
      assert.equal(touched.length, puzzle.differences.length, `seed ${seed}: only the named nodes change`);
    }
  });
}

test('two variants of one seed are identical: the pictures differ only where a difference sits', () => {
  const level = LEVELS[0];
  const a = buildPuzzle(level, makeRandom(9));
  const b = buildPuzzle(level, makeRandom(9));
  assert.deepEqual(
    a.variant.nodes.map((node) => [node.id, node.dx, node.dy, node.sx, node.hidden, node.tint]),
    b.variant.nodes.map((node) => [node.id, node.dx, node.dy, node.sx, node.hidden, node.tint]),
  );
});

test('a different seed builds a different puzzle', () => {
  const level = LEVELS[2];
  const one = buildPuzzle(level, makeRandom(3)).differences.map((d) => `${d.nodeId}:${d.mutation}`);
  const two = buildPuzzle(level, makeRandom(4)).differences.map((d) => `${d.nodeId}:${d.mutation}`);
  assert.notDeepEqual(one, two);
});
