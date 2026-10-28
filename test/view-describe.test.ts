import { beforeAll, describe, expect, it } from 'vitest';
import { loadCard } from '../src/engine/card';
import { PRACTICE_CARD_TEXT } from '../src/engine/cards/practice';
import { describeEvent, describeResult, handLabel } from '../src/engine/describe';
import { newGame } from '../src/engine/engine';
import type { GameEvent } from '../src/engine/state';
import { kindFromCode, tileIdsOfKind } from '../src/engine/tiles';
import { eventsFor, seatView } from '../src/engine/view';

beforeAll(() => {
  loadCard(PRACTICE_CARD_TEXT);
});

const fiveDot = tileIdsOfKind(kindFromCode('5D'))[0] as number;
const ctx = { dealer: 0, cardId: 'practice' };

describe('what each seat may see', () => {
  it("hides other players' draws and private tiles", () => {
    const events: GameEvent[] = [
      { type: 'draw', seat: 1, tile: fiveDot, wallLeft: 80 },
      { to: 2, type: 'tilesReceived', seat: 2, tiles: [fiveDot], pass: 0 },
      { type: 'discard', seat: 1, tile: fiveDot },
    ];
    expect(eventsFor(events, 1)).toEqual([events[0], events[2]]);
    const forSeat3 = eventsFor(events, 3);
    expect(forSeat3).toHaveLength(2);
    expect(forSeat3[0]).toMatchObject({ type: 'draw', seat: 1, tile: -1 });
  });

  it('a seat view shows hidden-tile counts for others, never their tiles', () => {
    const { state } = newGame({ seed: 'view', cardId: 'practice' });
    const v = seatView(state, 1);
    expect(v.players.map((p) => p.hiddenCount)).toEqual([14, 13, 13, 13]);
    expect(v.players.map((p) => p.wind)).toEqual(['East', 'South', 'West', 'North']);
  });
});

describe('plain-English descriptions', () => {
  it('names tiles and seats the way players say them', () => {
    expect(describeEvent({ type: 'discard', seat: 2, tile: fiveDot }, ctx)).toBe('West discards 5 Dot.');
    const north = tileIdsOfKind(kindFromCode('N'))[0] as number;
    expect(describeEvent({ type: 'discard', seat: 0, tile: north }, ctx)).toBe('East discards North wind.');
    const joker = tileIdsOfKind(kindFromCode('J'))[0] as number;
    expect(describeEvent({ type: 'discard', seat: 0, tile: joker }, ctx)).toContain('dead');
    expect(describeEvent({ type: 'expose', seat: 3, exposure: 0, kind: kindFromCode('5D'), size: 4, jokers: 1 }, ctx)).toBe(
      'North exposes a kong of 5 Dots (1 joker).',
    );
  });

  it('shows a draw only to the player who drew', () => {
    const e: GameEvent = { type: 'draw', seat: 1, tile: fiveDot, wallLeft: 80 };
    expect(describeEvent(e, { ...ctx, viewer: 1 })).toBe('You draw a 5 Dot. (80 left in the wall)');
    expect(describeEvent(e, { ...ctx, viewer: 2 })).toBe('South draws from the wall. (80 left)');
  });

  it('labels hands by section and line', () => {
    expect(handLabel('practice', 'P-RUN-2')).toBe('Consecutive Run #2 (P-RUN-2)');
  });

  it('explains payments at the end of a game', () => {
    const text = describeResult(ctx, {
      type: 'mahjong',
      winner: 1,
      how: 'discard',
      selfPick: false,
      from: 0,
      handId: 'P-EVEN-1',
      targetIndex: 0,
      value: 25,
      jokerless: false,
      payments: [-50, 100, -25, -25],
    });
    expect(text).toBe("Mah Jongg! South wins on East's discard with 2468 #1 (P-EVEN-1), worth 25. East pays 50, West pays 25, North pays 25.");
    expect(describeResult(ctx, { type: 'wall', payments: [0, 0, 0, 0] })).toContain('nobody pays');
  });
});
