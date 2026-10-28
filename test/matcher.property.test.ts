/**
 * Property tests: the fast matcher must agree with a slow, independent brute-force checker
 * (general bipartite matching of tiles to slots, over every way the exposures could fit).
 * Thousands of cases with a fixed seed, plus fast-check cases that shrink any failure to a minimal example.
 */

import fc from 'fast-check';
import { describe, expect, it } from 'vitest';
import { loadCard, targetFromGroups, type Target } from '../src/engine/card';
import { PRACTICE_CARD_TEXT } from '../src/engine/cards/practice';
import { analyze, isComplete, tilesAway, type ExposureInfo } from '../src/engine/matcher';
import { Rng } from '../src/engine/rng';
import { FLOWER, JOKER, NUM_KINDS, SUPPLY, emptyCounts, type Kind } from '../src/engine/tiles';
import { bruteComplete, bruteTilesAway, exhaustiveMax, maxMatching, type Slot } from './helpers';

const card = loadCard(PRACTICE_CARD_TEXT);

/** A random 14-tile target with repeated kinds (to stress same-kind groups) that respects supply. */
function randomTarget(rng: Rng): Target {
  for (;;) {
    const groups: { kind: Kind; size: number }[] = [];
    let left = 14;
    const kindsPool = Array.from({ length: 5 }, () => rng.int(NUM_KINDS - 1)); // few kinds, so groups share kinds
    if (rng.chance(0.4)) kindsPool.push(FLOWER);
    while (left > 0) {
      const size = Math.min(left, 1 + rng.int(rng.chance(0.3) ? 6 : 4));
      groups.push({ kind: rng.pick(kindsPool), size });
      left -= size;
    }
    const t = targetFromGroups(groups, { concealed: rng.chance(0.15) });
    if (t) return t;
  }
}

interface Case {
  t: Target;
  hand: number[];
  exposures: ExposureInfo[];
}

/** A realistic case: fill a target exactly (some groups exposed), then swap a few tiles at random. */
function randomCase(rng: Rng): Case {
  const t = rng.chance(0.5) ? rng.pick(card.targets) : randomTarget(rng);
  const used = emptyCounts();
  const hand = emptyCounts();
  const exposures: ExposureInfo[] = [];
  const naturalLeft = (k: Kind) => (SUPPLY[k] as number) - (used[k] as number);
  // exposed groups first (not for concealed targets)
  const exposeIdx = new Set<number>();
  if (!t.concealed) t.groups.forEach((g, i) => g.jokers && rng.chance(0.3) && exposeIdx.add(i));
  for (const [i, g] of t.groups.entries()) {
    if (exposeIdx.has(i)) {
      if (naturalLeft(g.kind) < 1) continue; // an exposure needs its claimed real tile
      let jokers = 0;
      let naturals = 1;
      used[g.kind]++;
      for (let s = 1; s < g.size; s++) {
        if (naturalLeft(g.kind) > 0 && (used[JOKER] as number) + jokers < 8 ? rng.chance(0.7) : (used[JOKER] as number) + jokers >= 8) {
          if (naturalLeft(g.kind) > 0) {
            used[g.kind]++;
            naturals++;
            continue;
          }
        }
        if ((used[JOKER] as number) + jokers < 8) jokers++;
        else {
          used[g.kind]++;
          naturals++;
        }
      }
      used[JOKER] = (used[JOKER] as number) + jokers;
      if (naturals + jokers === g.size) exposures.push({ kind: g.kind, size: g.size, jokers });
    } else {
      for (let s = 0; s < g.size; s++) {
        const wantJoker = g.jokers && rng.chance(0.25);
        if ((wantJoker || naturalLeft(g.kind) === 0) && g.jokers && (used[JOKER] as number) < 8) {
          used[JOKER]++;
          hand[JOKER]++;
        } else if (naturalLeft(g.kind) > 0) {
          used[g.kind]++;
          hand[g.kind]++;
        }
      }
    }
  }
  // swap 0 to 4 tiles for random ones still in the set; sometimes drop a tile (13-tile hands)
  const swaps = rng.int(5);
  for (let i = 0; i < swaps; i++) {
    const held: Kind[] = [];
    for (let k = 0; k < NUM_KINDS; k++) for (let n = 0; n < (hand[k] as number); n++) held.push(k);
    if (held.length === 0) break;
    const out = rng.pick(held);
    hand[out]--;
    used[out]--;
    for (;;) {
      const k = rng.int(NUM_KINDS);
      if ((used[k] as number) < (SUPPLY[k] as number)) {
        hand[k]++;
        used[k]++;
        break;
      }
    }
  }
  if (rng.chance(0.3)) {
    const held: Kind[] = [];
    for (let k = 0; k < NUM_KINDS; k++) for (let n = 0; n < (hand[k] as number); n++) held.push(k);
    if (held.length > 0) hand[rng.pick(held)]--;
  }
  // occasionally add an exposure that may not fit at all
  if (rng.chance(0.1)) exposures.push({ kind: rng.int(NUM_KINDS - 1), size: 3 + rng.int(2), jokers: 0 });
  return { t, hand, exposures };
}

describe('matcher agrees with brute force', () => {
  it('the brute-force matching itself agrees with exhaustive search on tiny cases', () => {
    const rng = Rng.fromSeed('matching-self-check');
    for (let i = 0; i < 2000; i++) {
      const tiles: Kind[] = Array.from({ length: 1 + rng.int(7) }, () => (rng.chance(0.25) ? JOKER : rng.int(4)));
      const slots: Slot[] = Array.from({ length: 1 + rng.int(7) }, () => ({ kind: rng.int(4), jokerOk: rng.chance(0.5) }));
      expect(maxMatching(tiles, slots)).toBe(exhaustiveMax(tiles, slots));
    }
  });

  it('on 5,000 seeded realistic cases (tiles away, win check, and detailed analysis)', () => {
    const rng = Rng.fromSeed('matcher-property-v1');
    let wins = 0;
    let nearWins = 0;
    for (let i = 0; i < 5000; i++) {
      const { t, hand, exposures } = randomCase(rng);
      const fast = tilesAway(t, hand, exposures);
      const brute = bruteTilesAway(t, hand, exposures);
      if (fast !== brute) throw new Error(`case ${i}: tilesAway ${fast} vs brute ${brute} for ${t.signature} hand ${hand.join('')} exp ${JSON.stringify(exposures)}`);
      const fc1 = isComplete(t, hand, exposures);
      const bc = bruteComplete(t, hand, exposures);
      if (fc1 !== bc) throw new Error(`case ${i}: isComplete ${fc1} vs brute ${bc} for ${t.signature}`);
      const a = analyze(t, hand, exposures);
      expect(a === null ? Infinity : a.away).toBe(fast);
      if (bc) wins++;
      if (brute === 1) nearWins++;
    }
    // make sure the generator produced plenty of interesting cases
    expect(wins).toBeGreaterThan(200);
    expect(nearWins).toBeGreaterThan(200);
  });

  it('on fast-check generated cases (any failure shrinks to a minimal example)', () => {
    const groupArb = fc.record({ kind: fc.integer({ min: 0, max: 6 }), size: fc.integer({ min: 1, max: 6 }) });
    fc.assert(
      fc.property(
        fc.array(groupArb, { minLength: 1, maxLength: 7 }),
        fc.array(fc.integer({ min: 0, max: 7 }), { maxLength: 14 }),
        fc.integer({ min: 0, max: 3 }),
        fc.boolean(),
        (groups, handKinds, jokers, exposeFirst) => {
          const t = targetFromGroups(groups);
          if (!t) return true; // groups beyond supply are not real targets
          const hand = emptyCounts();
          for (const k of handKinds) hand[k === 7 ? JOKER : k]++;
          hand[JOKER] += jokers;
          const first = t.groups[0];
          const exposures: ExposureInfo[] = exposeFirst && first && first.jokers ? [{ kind: first.kind, size: first.size, jokers: 0 }] : [];
          return tilesAway(t, hand, exposures) === bruteTilesAway(t, hand, exposures) && isComplete(t, hand, exposures) === bruteComplete(t, hand, exposures);
        },
      ),
      { seed: 20261028, numRuns: 1500 },
    );
  });
});
