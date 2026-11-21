// A small seeded random number generator (mulberry32), so a level's scene, the differences it hides
// and the screenshot frames are the same on every run: the same seed always paints the same pixels.

export function makeRandom(seed) {
  let state = (seed >>> 0) || 0x9e3779b9;
  const next = () => {
    state = (state + 0x6d2b79f5) >>> 0;
    let t = state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
  return {
    next,
    /** A number at or above min and below max. */
    range(min, max) {
      return min + next() * (max - min);
    },
    /** A whole number at or above min and at most max. */
    int(min, max) {
      return Math.floor(min + next() * (max - min + 1));
    },
    pick(items) {
      return items[Math.floor(next() * items.length)];
    },
    chance(probability) {
      return next() < probability;
    },
    /** Fisher-Yates on a copy, so the caller keeps its array. */
    shuffled(items) {
      const out = items.slice();
      for (let i = out.length - 1; i > 0; i -= 1) {
        const j = Math.floor(next() * (i + 1));
        [out[i], out[j]] = [out[j], out[i]];
      }
      return out;
    },
  };
}
