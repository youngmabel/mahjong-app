import { describe, expect, it } from 'vitest';
import { loadCard, targetFromGroups, type Target } from '../src/engine/card';
import { PRACTICE_CARD_TEXT } from '../src/engine/cards/practice';
import {
  analyze,
  arrangeTiles,
  completedTargets,
  exposureOptions,
  exposuresFit,
  isComplete,
  jokerExchangeOptions,
  mahjongTargetsWith,
  officialDeadReason,
  outs,
  prepareExposures,
  privatelyBlocked,
  publiclyPossible,
  tilesAway,
} from '../src/engine/matcher';
import { FLOWER, JOKER, NUM_KINDS, SUPPLY, emptyCounts, kindFromCode, kindOfTile, tileIdsOfKind } from '../src/engine/tiles';
import { hand } from './helpers';

const card = loadCard(PRACTICE_CARD_TEXT);
const K = kindFromCode;

/** The target of a practice line whose groups match the given codes (first word decides). */
function target(handId: string, firstGroupCode?: string): Target {
  const ts = card.targets.filter((t) => t.handId === handId);
  const t = firstGroupCode ? ts.find((x) => x.groups.some((g) => g.kind === K(firstGroupCode) && g.size >= 2)) : ts[0];
  if (!t) throw new Error(`no target for ${handId} ${firstGroupCode}`);
  return t;
}

// P-EVEN-1 in Bams: FF 22 444 666 8888
const even = target('P-EVEN-1', '8B');

describe('win check', () => {
  it('accepts an exact hand and rejects a hand with a tile left over', () => {
    expect(isComplete(even, hand('F F 2B 2B 4B 4B 4B 6B 6B 6B 8B 8B 8B 8B'), [])).toBe(true);
    expect(isComplete(even, hand('F F 2B 2B 4B 4B 4B 6B 6B 6B 8B 8B 8B 9B'), [])).toBe(false);
    expect(isComplete(even, hand('F F 2B 2B 4B 4B 4B 6B 6B 6B 8B 8B 8B'), [])).toBe(false); // 13 tiles
  });

  it('lets jokers fill groups of 3 or more, never a single or a pair', () => {
    expect(isComplete(even, hand('F F 2B 2B 4B J 4B 6B 6B J 8B J 8B 8B'), [])).toBe(true);
    expect(isComplete(even, hand('F F 2B J 4B 4B 4B 6B 6B 6B 8B 8B 8B 8B'), [])).toBe(false); // joker in the 2s pair
    expect(isComplete(even, hand('F J 2B 2B 4B 4B 4B 6B 6B 6B 8B 8B 8B 8B'), [])).toBe(false); // joker in the flower pair
  });

  it('reads Soap as zero in the year and refuses a joker in a year single', () => {
    // P-YEAR-1 with the year in Bams, kong of 2 Craks, kong of 6 Dots
    const t = targetFromGroups([
      { kind: FLOWER, size: 2 },
      { kind: K('2B'), size: 1 },
      { kind: K('WD'), size: 1 },
      { kind: K('2B'), size: 1 },
      { kind: K('6B'), size: 1 },
      { kind: K('2C'), size: 4 },
      { kind: K('6D'), size: 4 },
    ]) as Target;
    expect(isComplete(t, hand('F F 2B WD 2B 6B 2C 2C 2C 2C 6D 6D 6D 6D'), [])).toBe(true);
    expect(isComplete(t, hand('F F 2B J 2B 6B 2C 2C 2C 2C 6D 6D 6D 6D'), [])).toBe(false);
  });

  it('handles a single and a pung of the same tile (where group-by-group filling goes wrong)', () => {
    const t = targetFromGroups([
      { kind: K('2B'), size: 1 },
      { kind: K('WD'), size: 1 },
      { kind: K('6B'), size: 1 },
      { kind: K('7B'), size: 1 },
      { kind: K('2B'), size: 3 },
      { kind: K('6C'), size: 4 },
      { kind: FLOWER, size: 3 },
    ]) as Target;
    // three real 2 Bams and one joker: one real 2 Bam must go to the single, the joker to the pung
    expect(isComplete(t, hand('2B 2B 2B J WD 6B 7B 6C 6C 6C 6C F F F'), [])).toBe(true);
    expect(tilesAway(t, hand('2B 2B 2B J WD 6B 7B 6C 6C 6C 6C F F F'), [])).toBe(0);
    // two real 2 Bams and two jokers is also fine
    expect(isComplete(t, hand('2B 2B J J WD 6B 7B 6C 6C 6C 6C F F F'), [])).toBe(true);
    // one real 2 Bam and three jokers: the single takes it, the pung is all jokers (legal while concealed)
    expect(isComplete(t, hand('2B J J J WD 6B 7B 6C 6C 6C 6C F F F'), [])).toBe(true);
  });

  it('picks the best-paying hand when tiles complete more than one line', () => {
    const t25 = completedTargets(card, hand('F F 2B 2B 4B 4B 4B 6B 6B 6B 8B 8B 8B 8B'), []);
    expect(t25.map((t) => t.handId)).toEqual(['P-EVEN-1']);
  });
});

describe('exposures and concealed hands', () => {
  it('fits an exposure only to a group of the same tile and size', () => {
    expect(exposuresFit(even, [{ kind: K('8B'), size: 4, jokers: 1 }])).toBe(true);
    expect(exposuresFit(even, [{ kind: K('8B'), size: 3, jokers: 0 }])).toBe(false); // the card shows a kong
    expect(exposuresFit(even, [{ kind: K('2B'), size: 3, jokers: 0 }])).toBe(false); // the 2s are a pair
    expect(exposuresFit(even, [{ kind: K('4B'), size: 3, jokers: 0 }, { kind: K('6B'), size: 3, jokers: 2 }])).toBe(true);
  });

  it('never lets a concealed hand accept exposures', () => {
    const conc = target('P-CONC-1', '2B');
    expect(exposuresFit(conc, [])).toBe(true);
    expect(exposuresFit(conc, [{ kind: K('2B'), size: 4, jokers: 0 }])).toBe(false);
    expect(tilesAway(conc, hand('F F 4B 4B 4B 4B 6B 6B 6B 6B'), [{ kind: K('2B'), size: 4, jokers: 0 }])).toBe(Infinity);
  });

  it('completes a hand with exposures counted', () => {
    const exp = prepareExposures([{ kind: K('8B'), size: 4, jokers: 2 }]);
    expect(isComplete(even, hand('F F 2B 2B 4B 4B J 6B 6B 6B'), exp)).toBe(true);
    expect(tilesAway(even, hand('F F 2B 2B 4B 4B 6B 6B 6B'), exp)).toBe(1);
  });
});

describe('tiles away and outs', () => {
  it('counts what is missing, with jokers covering only big groups', () => {
    // 13 tiles, missing one 8 Bam: 1 away
    expect(tilesAway(even, hand('F F 2B 2B 4B 4B 4B 6B 6B 6B 8B 8B 8B'), [])).toBe(1);
    // missing a 2 Bam from the pair: a joker can't help, still 1 away
    expect(tilesAway(even, hand('F F 2B J 4B 4B 4B 6B 6B 6B 8B 8B 8B'), [])).toBe(1);
    // missing both flowers and holding two unrelated tiles: 2 away
    expect(tilesAway(even, hand('9D 9C 2B 2B 4B 4B 4B 6B 6B 6B 8B 8B 8B 8B'), [])).toBe(2);
  });

  it('reports missing tiles separately for pairs and big groups, and counts outs', () => {
    const a = analyze(even, hand('F 1D 2B 2B 4B 4B 4B 6B 6B 8B 8B 8B 8B'), []);
    expect(a).not.toBeNull();
    if (!a) return;
    expect(a.away).toBe(2);
    expect(a.missingPlain[FLOWER]).toBe(1);
    expect(a.missingFlex[K('6B')]).toBe(1);
    expect(a.extra[K('1D')]).toBe(1);
    const live = [...SUPPLY];
    live[JOKER] = 8;
    expect(outs(a, 0, live)).toBe(8 + 4 + 8); // flowers, 6 Bams, jokers (supply counts as the unseen pool here)
  });
});

describe('claims and joker exchanges', () => {
  it('offers Mah Jongg on a discard that completes any hand, even a pair or a concealed hand', () => {
    expect(mahjongTargetsWith(card, hand('F 2B 2B 4B 4B 4B 6B 6B 6B 8B 8B 8B 8B'), [], FLOWER).length).toBeGreaterThan(0);
    const conc = hand('F F 2B 2B 2B 2B 4B 4B 4B 4B 6B 6B 6B');
    expect(mahjongTargetsWith(card, conc, [], K('6B')).map((t) => t.handId)).toEqual(['P-CONC-1']);
  });

  it('offers only pungs, kongs, quints and sextets for exposure, never pairs', () => {
    // Claiming a North while holding two Norths and two jokers.
    const opts = exposureOptions(card, hand('N N J J 2B 2B 4B 4B 4B 6B 6B 6B F'), [], K('N'));
    const sizes = [...new Set(opts.map((o) => o.size))];
    expect(sizes).toEqual([3, 4, 5]);
    expect(opts.find((o) => o.size === 4 && o.naturals === 2 && o.jokers === 1)?.fitsCard).toBe(true); // P-WIND-1's kong of Norths
    expect(opts.find((o) => o.size === 3)?.fitsCard).toBe(false); // no line has a pung of Norths
    expect(opts.find((o) => o.size === 5)?.fitsCard).toBe(false);
    expect(exposureOptions(card, hand('J J F F'), [], JOKER)).toEqual([]); // a discarded joker can't be claimed
  });

  it('finds joker exchanges for tiles the player holds', () => {
    const opts = jokerExchangeOptions(hand('5D 5D 9C'), [
      { seat: 1, exposureIndex: 0, kind: K('5D') },
      { seat: 2, exposureIndex: 1, kind: K('7B') },
    ]);
    expect(opts).toEqual([{ seat: 1, exposureIndex: 0, kind: K('5D') }]);
  });
});

describe('blocked and dead hands', () => {
  it('privately blocks a target whose missing pair has too few unseen copies', () => {
    const a = analyze(even, hand('F F 2B 4B 4B 4B 6B 6B 6B 8B 8B 8B 8B'), []);
    if (!a) throw new Error('fit');
    const unseen = [...SUPPLY];
    unseen[K('2B')] = 0; // the other three 2 Bams are all visible somewhere
    expect(privatelyBlocked(a, 0, unseen, 0)).toBe(true);
    unseen[K('2B')] = 1;
    expect(privatelyBlocked(a, 0, unseen, 0)).toBe(false);
  });

  it('treats jokers in other exposures as still obtainable', () => {
    const quint = target('P-QUINT-1', '1B'); // quint of 1 Bams, kong of 2 Bams, five flowers
    const a = analyze(quint, hand('1B 1B 1B 1B 2B 2B 2B 2B F F F F F'), []);
    if (!a) throw new Error('fit');
    const unseen = [...SUPPLY];
    unseen[K('1B')] = 0;
    unseen[JOKER] = 0; // no jokers unseen...
    expect(privatelyBlocked(a, 0, unseen, 0)).toBe(true);
    expect(privatelyBlocked(a, 0, unseen, 1)).toBe(false); // ...but one sits in an exposure, so it can be won
  });

  it('calls a hand officially dead only on public evidence', () => {
    // A pung of 6 Bams plus a kong of 8 Bams fits only P-EVEN-1 in Bams, which needs a pair of 2 Bams.
    const own = prepareExposures([
      { kind: K('6B'), size: 3, jokers: 0 },
      { kind: K('8B'), size: 4, jokers: 0 },
    ]);
    expect(card.targets.filter((t) => exposuresFit(t, own)).map((t) => t.handId)).toEqual(['P-EVEN-1']);
    const visible = emptyCounts();
    visible[K('6B')] = 3;
    visible[K('8B')] = 4;
    expect(officialDeadReason(card, own, { visibleNaturals: visible, discardedJokers: 0 })).toBeNull();
    visible[K('2B')] = 2; // two 2 Bams visible: two are left, the pair is still possible
    expect(officialDeadReason(card, own, { visibleNaturals: visible, discardedJokers: 0 })).toBeNull();
    visible[K('2B')] = 3; // three visible: the pair can't be made and jokers can't help
    expect(publiclyPossible(even, own, { visibleNaturals: visible, discardedJokers: 0 })).toBe(false);
    expect(officialDeadReason(card, own, { visibleNaturals: visible, discardedJokers: 0 })).toBe('noHandPossible');
  });

  it('calls exposures that fit no hand dead', () => {
    const own = prepareExposures([{ kind: K('N'), size: 3, jokers: 0 }]); // the practice card has a kong of Norths, never a pung
    expect(officialDeadReason(card, own, { visibleNaturals: emptyCounts(), discardedJokers: 0 })).toBe('exposuresFitNoHand');
  });
});

describe('showing which tile goes where', () => {
  it('puts real tiles in pairs first and jokers in big groups', () => {
    const ids = [
      ...tileIdsOfKind(FLOWER).slice(0, 2),
      ...tileIdsOfKind(K('2B')).slice(0, 2),
      ...tileIdsOfKind(K('4B')).slice(0, 2),
      ...tileIdsOfKind(JOKER).slice(0, 2),
      ...tileIdsOfKind(K('6B')).slice(0, 3),
      ...tileIdsOfKind(K('8B')).slice(0, 3),
    ];
    const placed = arrangeTiles(even, ids, []);
    const kindsPerGroup = placed.map((p) => p.tiles.map(kindOfTile));
    expect(kindsPerGroup[0]).toEqual([FLOWER, FLOWER]);
    expect(kindsPerGroup[1]).toEqual([K('2B'), K('2B')]);
    expect(kindsPerGroup[2]).toEqual([K('4B'), K('4B'), JOKER]);
    expect(kindsPerGroup[4]).toEqual([K('8B'), K('8B'), K('8B'), JOKER]);
    expect(placed.reduce((n, p) => n + p.tiles.length, 0)).toBe(14);
  });
});

it('sanity: count vectors have 36 entries', () => {
  expect(hand('F').length).toBe(NUM_KINDS);
});
