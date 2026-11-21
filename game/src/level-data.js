// The three levels: which scene, how many differences it hides and how generous its clock is. Difficulty
// grows through the count and the subtleness of the changes, never by hiding more than nine spots.
import { buildBazaar } from './scene/bazaar.js';
import { buildObservatory } from './scene/observatory.js';
import { buildTidepool } from './scene/tidepool.js';

export const LEVELS = [
  {
    id: 'bazaar',
    name: 'Lantern Bazaar',
    blurb: 'A night market on the harbour boardwalk',
    build: buildBazaar,
    count: 6,
    seconds: 150,
    tier: 'EASY',
  },
  {
    id: 'tidepool',
    name: 'Tidepool Terrace',
    blurb: 'A sunny rock pool at low tide',
    build: buildTidepool,
    count: 8,
    seconds: 165,
    tier: 'MEDIUM',
  },
  {
    id: 'observatory',
    name: 'Sky Observatory',
    blurb: 'A telescope deck under the first stars',
    build: buildObservatory,
    count: 9,
    seconds: 180,
    tier: 'HARD',
  },
];
