// A scene is a flat, ordered list of nodes, each one a shape or a group of shapes with a bounding
// circle and the paint function that draws it in the scene's own 600x428 space. Panel A paints the
// model as built; panel B paints a mutated copy of it, so the two pictures differ only in the nodes a
// difference touched and are otherwise pixel for pixel the same scene.

export const MUTATIONS = ['hidden', 'moved', 'flipped', 'swollen', 'tinted'];

/**
 * A node joins a scene. `hit` is the bounding circle used both to place a found marker and to decide
 * which difference a click lands on; `diffable` names the mutations this node may take, so a painter
 * never offers a change that would look broken (a moon cannot slide away, a lamp may go out).
 */
export function addNode(scene, node) {
  const full = {
    dx: 0,
    dy: 0,
    sx: 1,
    sy: 1,
    tint: null,
    hidden: false,
    diffable: [],
    ...node,
  };
  scene.nodes.push(full);
  return full;
}

/** The untouched model a level is built from: both panels start from a clone of it. */
export function cloneScene(scene) {
  return {
    width: scene.width,
    height: scene.height,
    theme: scene.theme,
    nodes: scene.nodes.map((node) => ({ ...node, hit: { ...node.hit } })),
  };
}

/**
 * Turns one difference on in a scene copy. Hidden removes the node; moved slides it, flipped mirrors it
 * about its own centre, swollen draws it a quarter larger, tinted repaints it in another colour.
 */
export function applyDifference(scene, difference) {
  const node = scene.nodes.find((candidate) => candidate.id === difference.nodeId);
  if (!node) return false;
  switch (difference.mutation) {
    case 'hidden':
      node.hidden = true;
      break;
    case 'moved':
      node.dx = difference.dx;
      node.dy = difference.dy;
      break;
    case 'flipped':
      node.sx = -1;
      break;
    case 'swollen':
      node.sx = difference.scale;
      node.sy = difference.scale;
      break;
    case 'tinted':
      node.tint = difference.tint;
      break;
    default:
      return false;
  }
  // The spot a player clicks and the marker draws at follows the node it changed.
  node.spot = { x: node.hit.x + node.dx, y: node.hit.y + node.dy };
  return true;
}

/** Paints a scene, honouring every mutation a difference made to it. */
export function paintScene(ctx, scene) {
  for (const node of scene.nodes) {
    if (node.hidden) continue;
    const moved = node.dx !== 0 || node.dy !== 0;
    const scaled = node.sx !== 1 || node.sy !== 1;
    ctx.save();
    if (moved || scaled) {
      ctx.translate(node.hit.x + node.dx, node.hit.y + node.dy);
      ctx.scale(node.sx, node.sy);
      ctx.translate(-node.hit.x, -node.hit.y);
    }
    node.paint(ctx, node);
    ctx.restore();
  }
}
