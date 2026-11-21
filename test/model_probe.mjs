// Reproduces the renderer's view of a level without a browser: the scene model, the differences chosen
// for it, and the variant panel B is painted from. Used to prove that every difference actually changes
// the node it names, before any pixels are drawn.
import { chooseDifferences, variantOf } from '../game/src/differences.js';
import { LEVELS } from '../game/src/level-data.js';
import { makeRandom } from '../game/src/random.js';

for (const level of LEVELS) {
  const random = makeRandom(7);
  const scene = level.build(random);
  const differences = chooseDifferences(scene, random, level.count);
  const variant = variantOf(scene, differences);
  console.log(`\n${level.id}: ${differences.length}/${level.count} differences`);
  for (const difference of differences) {
    const before = scene.nodes.find((node) => node.id === difference.nodeId);
    const after = variant.nodes.find((node) => node.id === difference.nodeId);
    const changed = before.hidden !== after.hidden || before.dx !== after.dx || before.dy !== after.dy
      || before.sx !== after.sx || before.sy !== after.sy || before.tint !== after.tint;
    console.log(
      `  ${changed ? 'ok ' : 'NO '} ${difference.mutation.padEnd(8)} ${difference.nodeId.padEnd(14)} at (${difference.spot.x},${difference.spot.y})`,
    );
  }
  const unchanged = scene.nodes.filter((node, index) => {
    const after = variant.nodes[index];
    return node.hidden !== after.hidden || node.dx !== after.dx || node.dy !== after.dy || node.sx !== after.sx
      || node.sy !== after.sy || node.tint !== after.tint;
  }).length;
  console.log(`  nodes changed: ${unchanged} (expected ${differences.length})`);
}
