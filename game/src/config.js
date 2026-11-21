// Every tuning number, size and colour of "Lantern & Tide" lives here: the playfield is a fixed
// 1280x720 logical frame the renderer scales to the window, and each scene is painted at its own
// 600x428 canvas size, so no rule below depends on the size of the screen it is played on.

export const FRAME = { width: 1280, height: 720 };

/** The two picture panels, side by side: A on the left, B on the right. */
export const PANEL = {
  width: 600,
  height: 428,
  left: { x: 28, y: 96 },
  right: { x: 652, y: 96 },
  labelHeight: 34,
  radius: 14,
};

export const HUD = {
  barY: 18,
  barHeight: 66,
  footerY: 574,
};

/** Seconds on the clock, and what a wrong click and a hint cost. */
export const RULES = {
  startSeconds: 150,
  wrongClickPenalty: 7,
  hintPenalty: 10,
  hintCooldown: 4,
  maxMistakes: 6,
  foundBonusSeconds: 2,
  pointsPerFind: 120,
  pointsPerSecondLeft: 6,
  bonusForPerfect: 500,
};

/** How many differences a level hides, and how far apart two of them may sit. */
export const PUZZLE = {
  minSpread: 128,
  markerRadius: 27,
};

export const PALETTE = {
  night: '#0c1020',
  nightSoft: '#151b32',
  panelEdge: '#2b3550',
  ink: '#f2f5ff',
  dim: '#8d97b5',
  accent: '#ffcf6b',
  accentDeep: '#e9a13b',
  good: '#5ce1a0',
  bad: '#ff6b7a',
  sea: '#5ad0e6',
};

export const FONT = 'system-ui, -apple-system, "Segoe UI", Roboto, sans-serif';
export const FONT_NUM = 'ui-monospace, "SF Mono", Menlo, Consolas, monospace';

/** Where the best score is remembered (this browser only). */
export const BEST_KEY = 'lantern-and-tide.best';
