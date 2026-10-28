import { describe, expect, it } from 'vitest';
import {
  CardError,
  compileCardText,
  expandHand,
  formatPattern,
  loadCard,
  parsePattern,
  targetWords,
  type Card,
} from '../src/engine/card';
import { PRACTICE_CARD_TEXT, PRACTICE_EXPECTED_TARGETS } from '../src/engine/cards/practice';
import { GREEN, JOKER_COUNT, NUM_KINDS, RED, SOAP, SUPPLY, numKind } from '../src/engine/tiles';

const HEADER = 'card: test\nname: Test\nyear: 2026\nsource: invented\n';

/** Compile a one-line test card and return its targets. */
function lineTargets(line: string) {
  const card = loadCard(HEADER + line);
  return card.targets;
}

function expectCardError(text: string, fragment: string) {
  let err: unknown;
  try {
    loadCard(text);
  } catch (e) {
    err = e;
  }
  expect(err).toBeInstanceOf(CardError);
  expect((err as Error).message).toContain(fragment);
}

describe('practice card', () => {
  const card: Card = loadCard(PRACTICE_CARD_TEXT);

  it('compiles all 12 invented hands in card order', () => {
    expect(card.id).toBe('practice');
    expect(card.source).toBe('invented');
    expect(card.hands.map((h) => h.id)).toEqual(Object.keys(PRACTICE_EXPECTED_TARGETS));
    expect(card.hands.map((h) => h.section)).toEqual([
      '2026',
      '2468',
      '2468',
      'Any Like Numbers',
      'Quints',
      'Consecutive Run',
      'Consecutive Run',
      '13579',
      'Winds-Dragons',
      'Winds-Dragons',
      '369',
      'Singles and Pairs',
    ]);
  });

  it('expands to exactly the expected number of concrete hands per line (113 in all)', () => {
    card.hands.forEach((h, i) => {
      expect(card.targetsByHand[i]?.length, h.id).toBe(PRACTICE_EXPECTED_TARGETS[h.id]);
    });
    expect(card.targets.length).toBe(113);
  });

  it('every concrete hand has 14 tiles and fits in one 152-tile set', () => {
    for (const t of card.targets) {
      let total = 0;
      let minJokers = 0;
      for (let k = 0; k < NUM_KINDS; k++) {
        const p = t.plain[k] as number;
        const f = t.flex[k] as number;
        total += p + f;
        expect(p).toBeLessThanOrEqual(SUPPLY[k] as number);
        minJokers += Math.max(0, p + f - (SUPPLY[k] as number));
      }
      expect(total).toBe(14);
      expect(minJokers).toBe(t.minJokers);
      expect(minJokers).toBeLessThanOrEqual(JOKER_COUNT);
      for (const g of t.groups) expect(g.jokers).toBe(g.size >= 3); // jokers only in groups of 3 or more
    }
  });

  it('reads the year hand as singles with Soap as zero', () => {
    const year = card.targetsByHand[0] as Card['targets'];
    for (const t of year) {
      const singles = t.groups.filter((g) => g.size === 1);
      expect(singles.length).toBe(4);
      expect(singles.some((g) => g.kind === SOAP)).toBe(true);
      expect(t.plain[SOAP]).toBe(1);
    }
  });

  it('ties matching dragons to their suits: Bams-Green, Craks-Red, Dots-Soap', () => {
    const run2 = card.targets.filter((t) => t.handId === 'P-RUN-2');
    for (const t of run2) {
      const suit = Math.floor((t.groups[0] as { kind: number }).kind / 9);
      const dragon = (t.groups[3] as { kind: number }).kind;
      expect(dragon).toBe([GREEN, RED, SOAP][suit]);
    }
  });

  it('reads literal dragons in the winds hand', () => {
    const w2 = card.targets.filter((t) => t.handId === 'P-WIND-2');
    expect(w2.length).toBe(1);
    expect(targetWords(w2[0] as Card['targets'][number])).toEqual(['N E W S', 'RD RD RD RD', 'GD GD GD GD', 'F F']);
  });

  it('gives no jokerless bonus to Singles and Pairs or Quints', () => {
    for (const h of card.hands) {
      expect(h.jokerlessBonus, h.id).toBe(h.section !== 'Singles and Pairs' && h.section !== 'Quints');
    }
  });

  it('marks the concealed hands', () => {
    expect(card.hands.filter((h) => h.concealed).map((h) => h.id)).toEqual(['P-CONC-1', 'P-SP-1']);
  });

  it('needs at least one joker for a number quint', () => {
    for (const t of card.targets.filter((x) => x.handId === 'P-QUINT-1')) expect(t.minJokers).toBe(1);
  });
});

describe('card validation messages', () => {
  it('says when a line has the wrong number of tiles', () => {
    expectCardError(HEADER + 'Test | 25 | X | FF 111g 222g 333g 44g', 'adds up to 13 tiles');
  });
  it('rejects a group larger than a sextet', () => {
    expectCardError(HEADER + 'Test | 25 | X | FFFFFFF 1111g 222g', 'largest group is a sextet');
  });
  it('asks for an ink color on number tiles and dragons', () => {
    expectCardError(HEADER + 'Test | 25 | X | FF 1111 2222g 3333g', 'needs an ink color');
    expectCardError(HEADER + 'Test | 25 | X | FF DDDD 2222g 3333g', 'needs an ink color');
  });
  it('rejects unknown symbols, bad X/C and bad values', () => {
    expectCardError(HEADER + 'Test | 25 | X | FF 1111g 2222g 33Q3g', 'not a tile symbol');
    expectCardError(HEADER + 'Test | 25 | Z | FF 1111g 2222g 3333g', 'X (exposed) or C (concealed)');
    expectCardError(HEADER + 'Test | abc | X | FF 1111g 2222g 3333g', 'whole number');
  });
  it('rejects duplicate ids', () => {
    expectCardError(HEADER + 'A | 25 | X | FF 1111g 2222g 3333g | id: Q\nB | 25 | X | FF 1111g 2222g 3333g | id: Q', 'share the id');
  });
  it('rejects a line with no valid version because the set lacks the tiles', () => {
    // five Soaps as zeros in pairs and singles: natural-only demand of 5, but only 4 exist
    expectCardError(HEADER + 'Test | 25 | X | 00 00 0 FFFF 1111g 2g', 'no valid version');
  });
  it('drops only the suit choices that need too many tiles', () => {
    // with Dots, the matching dragon pair adds two Soaps to three zeros: 5 natural Soaps, impossible
    const compiled = compileCardText(HEADER + 'Test | 25 | X | 00 2026g DDg 4444g 66g');
    const r = expandHand(compiled.hands[0] as (typeof compiled.hands)[number], 0);
    expect(r.targets.length).toBe(2);
    expect(r.droppedForSupply).toBe(1);
  });
  it('checks dragon=matching and dragon=opposite against the colors', () => {
    expectCardError(HEADER + 'Test | 25 | X | FF 1111g 2222g DDDDr | opt: dragon=matching', 'dragon=matching');
    expectCardError(HEADER + 'Test | 25 | X | FF 1111g 2222g DDDDg | opt: dragon=opposite', 'dragon=opposite');
  });
  it('refuses to mix slide options with {x} variables', () => {
    expectCardError(HEADER + 'Test | 25 | X | FF {x}{x}{x}{x}g 2222g 3333g | opt: slide', 'not both');
  });
});

describe('notation features the 2026 card needs', () => {
  it('handles "-or-" alternatives and removes duplicates', () => {
    const ts = lineTargets('Test | 25 | X | FF 1111g 2222g 3333g | or: FF 1111g 2222g 3333g');
    expect(ts.length).toBe(3);
    const ts2 = lineTargets('Test | 25 | X | FF 1111g 2222g 3333g | or: FF 1111g 2222r 3333g');
    expect(ts2.length).toBe(3 + 6);
  });

  it('treats different dragon colors as different dragons, with or without numbers', () => {
    expect(lineTargets('Test | 25 | X | NNNN SSSS DDDg DDDr').length).toBe(3);
    expect(lineTargets('Test | 25 | X | NNNN SSSS DDDg DDDr | opt: dragon=any').length).toBe(3);
  });

  it('builds opposite dragons from a second color', () => {
    // any two consecutive kongs in one suit, a pung of a dragon from another suit
    const ts = lineTargets('Test | 25 | X | 1111g 2222g DDDr FFF | opt: slide dragon=opposite');
    expect(ts.length).toBe(3 * 2 * 8);
    for (const t of ts) {
      const suit = Math.floor((t.groups[0] as { kind: number }).kind / 9);
      expect((t.groups[2] as { kind: number }).kind).not.toBe([GREEN, RED, SOAP][suit]);
    }
  });

  it('supports a flower sextet and two separate flower pungs', () => {
    const sextet = lineTargets('Test | 25 | X | FFFFFF 1111g 1111r | opt: slide');
    expect(sextet.length).toBe(27);
    expect(sextet[0]?.groups[0]).toMatchObject({ size: 6, jokers: true });
    const twoPungs = lineTargets('Test | 25 | X | FFF FFF 22g 4444g 66g');
    expect(twoPungs[0]?.groups.filter((g) => g.size === 3).length).toBe(2);
    expect(twoPungs[0]?.exposableGroups.get(34 * 8 + 3)).toBe(2);
  });

  it('restricts numbers with lowest= and even shifts with slide2', () => {
    expect(lineTargets('Test | 25 | X | 11g 222g 3333g 444g 55g | opt: lowest=1,3').length).toBe(6);
    expect(lineTargets('Test | 25 | X | 111g 333g 5555g 7777g | opt: slide2').length).toBe(6);
  });

  it('supports escape-hatch variables with domains, distinct by default', () => {
    expect(lineTargets('Test | 25 | X | {x}{x}{x}g {y}{y}{y}{y}g FFFF NNN | opt: x=1,3 y=3-4').length).toBe(3 * 3);
    expect(lineTargets('Test | 25 | X | {x}{x}{x}g {y}{y}{y}{y}g FFFF NNN | opt: x=1,3 y=3-4 numfree=y').length).toBe(3 * 4);
  });

  it('supports any wind', () => {
    expect(lineTargets('Test | 25 | X | NNNN 1111g 2222g FF | opt: wind=any').length).toBe(12);
    expect(lineTargets('Test | 25 | X | NNNN 1111g 2222g FF').length).toBe(3);
  });

  it('reads per-tile colors: all three dragons as single tiles', () => {
    const ts = lineTargets('Test | 25 | X | DgDrDb 111g 222r 333b FF');
    expect(ts.length).toBe(6);
    for (const t of ts) {
      expect(t.plain[GREEN]).toBe(1);
      expect(t.plain[RED]).toBe(1);
      expect(t.plain[SOAP]).toBe(1);
    }
  });

  it('reads runs as single tiles, which never take jokers', () => {
    const ts = lineTargets('Test | 25 | X | 123g 456g 789g NN FFF');
    expect(ts.length).toBe(3);
    expect(ts[0]?.plain[numKind(0, 1)]).toBe(1);
    expect(ts[0]?.groups.filter((g) => g.size === 1).every((g) => !g.jokers)).toBe(true);
  });

  it('lets a free suit match another suit', () => {
    expect(lineTargets('Test | 25 | X | FF 1111g 2222g 33r 44r').length).toBe(6);
    expect(lineTargets('Test | 25 | X | FF 1111g 2222g 33r 44r | opt: free=r').length).toBe(9);
  });

  it('jokers=never makes every group natural-only', () => {
    const ts = lineTargets('Test | 25 | X | FF 1111g 2222g 3333g | opt: jokers=never');
    for (const g of ts[0]?.groups ?? []) expect(g.jokers).toBe(false);
  });

  it('round-trips the pattern notation', () => {
    for (const text of ['FF 2026g 2222r 6666b', 'DgDrDb 111g 222r 333b FF', '{x}{x}{x}g {x+1}{x+1}{x+1}{x+1}g NEWS FFF']) {
      const once = parsePattern(text);
      expect(formatPattern(once)).toBe(text);
      expect(parsePattern(formatPattern(once))).toEqual(once);
    }
  });
});
