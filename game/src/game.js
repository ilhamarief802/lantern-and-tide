// The rules of the game: what a click means, what the clock costs, when a level closes and when the run
// ends. It owns the state, and touches neither the canvas nor the DOM, so the same code drives a real
// player and the screenshot scenes.

import { BEST_KEY, RULES } from './config.js';
import { chooseDifferences, hintText, variantOf } from './differences.js';
import { createEffects, sparkBurst } from './effects.js';
import { LEVELS } from './level-data.js';

/** One level's puzzle: its scene, its variant and the differences between them. */
export function buildPuzzle(level, random, count = level.count) {
  const scene = level.build(random);
  const differences = chooseDifferences(scene, random, count);
  return { scene, variant: variantOf(scene, differences), differences };
}

export function createGame(random) {
  const state = {
    mode: 'title',
    levelIndex: 0,
    levelCount: LEVELS.length,
    level: LEVELS[0],
    scene: null,
    variant: null,
    differences: [],
    found: [],
    misses: [],
    missCount: 0,
    hint: null,
    hintCooldown: 0,
    timeLeft: RULES.startSeconds,
    score: 0,
    totalScore: 0,
    message: 'Click a difference in either picture.',
    messageTone: 'dim',
    focused: null,
    effects: createEffects(),
    levelElapsed: 0,
    best: readBest(),
    clearedAt: 0,
    overReason: null,
  };

  function say(text, tone = 'dim') {
    state.message = text;
    state.messageTone = tone;
  }

  function beginLevel(index) {
    const level = LEVELS[index];
    const puzzle = buildPuzzle(level, random, level.count);
    state.mode = 'play';
    state.levelIndex = index;
    state.level = level;
    state.scene = puzzle.scene;
    state.variant = puzzle.variant;
    state.differences = puzzle.differences;
    state.found = [];
    state.misses = [];
    state.missCount = 0;
    state.hint = null;
    state.hintCooldown = 0;
    state.timeLeft = level.seconds;
    state.score = 0;
    state.levelElapsed = 0;
    state.effects = createEffects();
    say(`Level ${index + 1}: ${level.name}. ${level.count} differences are hidden.`, 'dim');
  }

  function openTitle() {
    state.mode = 'title';
    state.levelIndex = 0;
    state.level = LEVELS[0];
    state.scene = null;
    state.variant = null;
    state.differences = [];
    state.found = [];
    state.misses = [];
    state.totalScore = 0;
  }

  function finishLevel() {
    const timeBonus = Math.round(state.timeLeft) * RULES.pointsPerSecondLeft;
    const perfect = state.missCount === 0 ? RULES.bonusForPerfect : 0;
    state.score += timeBonus + perfect;
    state.totalScore += state.score;
    state.clearedAt = state.levelElapsed;
    state.mode = state.levelIndex + 1 >= LEVELS.length ? 'victory' : 'levelClear';
    state.overReason = null;
    if (state.mode === 'victory') {
      state.best = Math.max(state.best, state.totalScore);
      writeBest(state.best);
    }
  }

  function endRun(reason) {
    state.mode = 'over';
    state.overReason = reason;
    state.best = Math.max(state.best, state.totalScore + state.score);
    writeBest(state.best);
  }

  /** A click, in playfield coordinates. Returns what happened, for the caller to play a sound for. */
  function click(x, y, scenePoint) {
    if (state.mode !== 'play') return 'ignored';
    if (!scenePoint) {
      const nearest = state.differences
        .map((difference, index) => ({ index, distance: Math.hypot(difference.spot.x - x, difference.spot.y - y) }))
        .sort((a, b) => a.distance - b.distance)[0];
      const reach = (nearest ? state.differences[nearest.index].radius : 24) + 14;
      if (nearest && nearest.distance <= reach && !state.found.includes(nearest.index)) {
        return handleFind(nearest.index);
      }
    } else {
      const index = state.differences.findIndex((difference) => Math.hypot(difference.spot.x - scenePoint.x, difference.spot.y - scenePoint.y) <= difference.radius + 14);
      if (index >= 0 && !state.found.includes(index)) return handleFind(index);
    }
    return handleMiss(x, y);
  }

  function handleFind(index) {
    const difference = state.differences[index];
    state.found.push(index);
    difference.foundAt = state.levelElapsed;
    state.score += RULES.pointsPerFind;
    state.timeLeft = Math.min(state.level.seconds, state.timeLeft + RULES.foundBonusSeconds);
    sparkBurst(state.effects, difference.spot.x, difference.spot.y);
    const what = {
      hidden: `${difference.tag} is missing in picture B`,
      moved: `the ${difference.tag} has moved`,
      flipped: `the ${difference.tag} is mirrored`,
      swollen: `the ${difference.tag} is larger`,
      tinted: `the ${difference.tag} changed colour`,
    };
    say(`Found it — ${what[difference.mutation] ?? 'that detail changed'}. +${RULES.pointsPerFind}`, 'good');
    if (state.found.length === state.differences.length) finishLevel();
    return 'found';
  }

  function handleMiss(x, y) {
    state.missCount += 1;
    state.timeLeft = Math.max(0, state.timeLeft - RULES.wrongClickPenalty);
    state.misses.push({ position: { x, y }, time: state.levelElapsed });
    say(`Nothing there. −${RULES.wrongClickPenalty}s`, 'bad');
    if (state.timeLeft <= 0) {
      endRun('time');
      return 'over';
    }
    if (state.missCount >= RULES.maxMistakes) {
      endRun('slips');
      return 'over';
    }
    return 'miss';
  }

  /** Spends a hint: points at the nearest unfound difference and charges time for it. */
  function useHint() {
    if (state.mode !== 'play' || state.hintCooldown > 0) return 'ignored';
    const open = state.differences
      .map((difference, index) => ({ difference, index }))
      .filter((entry) => !state.found.includes(entry.index));
    if (open.length === 0) return 'ignored';
    const target = open[0].difference;
    state.hint = { x: target.spot.x, y: target.spot.y, time: state.levelElapsed };
    state.timeLeft = Math.max(0.5, state.timeLeft - RULES.hintPenalty);
    state.hintCooldown = RULES.hintCooldown;
    state.score = Math.max(0, state.score - 40);
    say(`Hint: ${hintText(target)}. −${RULES.hintPenalty}s`, 'dim');
    return 'hint';
  }

  function advance() {
    if (state.mode === 'levelClear') {
      beginLevel(state.levelIndex + 1);
      return 'level';
    }
    if (state.mode === 'over' || state.mode === 'victory' || state.mode === 'title') {
      state.totalScore = 0;
      beginLevel(0);
      return 'restart';
    }
    return 'ignored';
  }

  function update(dt) {
    state.hintCooldown = Math.max(0, state.hintCooldown - dt);
    if (state.mode !== 'play') return;
    state.levelElapsed += dt;
    state.timeLeft = Math.max(0, state.timeLeft - dt);
    state.misses = state.misses.filter((miss) => state.levelElapsed - miss.time < 0.9);
    if (state.timeLeft <= 0) endRun('time');
  }

  return { state, beginLevel, openTitle, click, useHint, advance, update };
}

function readBest() {
  try {
    const stored = Number(globalThis.localStorage?.getItem(BEST_KEY));
    return Number.isFinite(stored) ? stored : 0;
  } catch {
    return 0;
  }
}

function writeBest(value) {
  try {
    globalThis.localStorage?.setItem(BEST_KEY, String(value));
  } catch {
    // A browser with storage disabled simply forgets the best score; the run itself is unaffected.
  }
}
