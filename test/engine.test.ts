/**
 * Rule tests for the referee. Each scenario rigs an exact table from tile codes (src/engine/scenario.ts)
 * and checks one rule from docs/01-rules.md.
 */

import { beforeAll, describe, expect, it } from 'vitest';
import { loadCard } from '../src/engine/card';
import { PRACTICE_CARD_TEXT } from '../src/engine/cards/practice';
import { apply, checkInvariants, newGame, pendingSeats } from '../src/engine/engine';
import { buildScenario, tilesFromHand, type ScenarioSetup } from '../src/engine/scenario';
import type { Action, ApplyResult, GameEvent, GameState } from '../src/engine/state';
import { JOKER, countsOf, kindFromCode, kindOfTile, type TileId } from '../src/engine/tiles';

beforeAll(() => {
  loadCard(PRACTICE_CARD_TEXT);
});

function scenario(s: Omit<ScenarioSetup, 'cardId' | 'seed'> & { seed?: string }): GameState {
  const state = buildScenario({ seed: 'rules-test', cardId: 'practice', ...s });
  expect(checkInvariants(state)).toEqual([]);
  return state;
}

/** Apply an action that must be accepted; returns the new state and its events. */
function act(state: GameState, seat: number, action: Action): { state: GameState; events: GameEvent[] } {
  const r = apply(state, seat, action);
  if (!r.ok) throw new Error(`rejected: ${r.violation.code}: ${r.violation.message}`);
  expect(checkInvariants(r.state)).toEqual([]);
  return { state: r.state, events: r.events };
}

/** Apply an action that must be refused with the given code; returns the explanation. */
function refuse(state: GameState, seat: number, action: Action, code: string): string {
  const r: ApplyResult = apply(state, seat, action);
  expect(r.ok).toBe(false);
  if (r.ok) return '';
  expect(r.violation.code).toBe(code);
  expect(r.violation.message.length).toBeGreaterThan(10);
  return r.violation.message;
}

const passAll = (state: GameState, seats: number[]): GameState => {
  let s = state;
  for (const seat of seats) s = act(s, seat, { type: 'pass' }).state;
  return s;
};

const result = (state: GameState) => {
  if (state.phase.name !== 'ended') throw new Error(`game not ended (phase ${state.phase.name})`);
  return state.phase.result;
};

/** Three non-joker tiles from a seat's rack. */
const threeTiles = (state: GameState, seat: number) =>
  (state.players[seat] as GameState['players'][number]).hand.filter((t) => kindOfTile(t) !== JOKER).slice(0, 3);

describe('deal', () => {
  it('gives East 14 tiles and everyone else 13, leaving 99 in the wall', () => {
    const { state } = newGame({ seed: 'deal-1', cardId: 'practice' });
    expect(state.players.map((p) => p.hand.length)).toEqual([14, 13, 13, 13]);
    expect(state.wall.length).toBe(99);
    expect(checkInvariants(state)).toEqual([]);
    const { state: s2 } = newGame({ seed: 'deal-1', cardId: 'practice', dealer: 2 });
    expect(s2.players.map((p) => p.hand.length)).toEqual([13, 13, 14, 13]);
  });

  it('deals the same tiles for the same seed', () => {
    expect(newGame({ seed: 'same', cardId: 'practice' }).state.wall).toEqual(newGame({ seed: 'same', cardId: 'practice' }).state.wall);
  });
});

describe('Charleston', () => {
  it('passes right, then across, then left', () => {
    let { state } = newGame({ seed: 'charleston-dirs', cardId: 'practice' });
    if (state.phase.name === 'heavenly') state = act(state, 0, { type: 'proceed' }).state;
    for (const [pass, offset] of [
      [0, 1],
      [1, 2],
      [2, 3],
    ] as const) {
      expect(state.phase).toMatchObject({ name: 'charleston', pass });
      const chosen = [0, 1, 2, 3].map((seat) => threeTiles(state, seat));
      for (let seat = 0; seat < 4; seat++) state = act(state, seat, { type: 'charlestonPass', tiles: chosen[seat] as TileId[] }).state;
      for (let seat = 0; seat < 4; seat++) {
        const receiver = (seat + offset) % 4;
        for (const t of chosen[seat] as TileId[]) expect(state.players[receiver]?.hand).toContain(t);
      }
    }
    expect(state.phase.name).toBe('vote');
  });

  it('never lets a joker be passed', () => {
    const state = scenario({ phase: { name: 'charleston', pass: 0 }, hands: { 1: 'J 1B 2B 3B 4B 5B 6B 7B 8B 9B 1C 2C 3C' } });
    const msg = refuse(state, 1, { type: 'charlestonPass', tiles: tilesFromHand(state, 1, 'J 1B 2B') }, 'jokerPass');
    expect(msg).toContain('Jokers can never be passed');
  });

  it('allows a blind pass only on the first left and the last right', () => {
    const s0 = scenario({ phase: { name: 'charleston', pass: 0 } });
    refuse(s0, 1, { type: 'charlestonPass', tiles: threeTiles(s0, 1).slice(0, 2), blind: 1 }, 'blindNotAllowed');
    const s3 = scenario({ phase: { name: 'charleston', pass: 3 } });
    refuse(s3, 1, { type: 'charlestonPass', tiles: threeTiles(s3, 1).slice(0, 2), blind: 1 }, 'blindNotAllowed');
    const s2 = scenario({ phase: { name: 'charleston', pass: 2 } });
    act(s2, 1, { type: 'charlestonPass', tiles: threeTiles(s2, 1).slice(0, 1), blind: 2 });
    const s5 = scenario({ phase: { name: 'charleston', pass: 5 } });
    act(s5, 1, { type: 'charlestonPass', tiles: [], blind: 3 });
  });

  it('requires exactly 3 tiles in every pass', () => {
    const s = scenario({ phase: { name: 'charleston', pass: 0 } });
    refuse(s, 0, { type: 'charlestonPass', tiles: threeTiles(s, 0).slice(0, 2) }, 'passCount');
  });

  it('forwards blind-passed tiles unseen along the chain', () => {
    let s = scenario({ phase: { name: 'charleston', pass: 2 } }); // first left: each seat passes to seat - 1
    const chosen = [0, 1, 2, 3].map((seat) => threeTiles(s, seat));
    const before = s.players.map((p) => [...p.hand]);
    for (const seat of [0, 2, 3]) s = act(s, seat, { type: 'charlestonPass', tiles: chosen[seat] as TileId[] }).state;
    s = act(s, 1, { type: 'charlestonPass', tiles: (chosen[1] as TileId[]).slice(0, 1), blind: 2 }).state;
    // seat 2 passes to seat 1; seat 1 forwards 2 of those to seat 0 and keeps 1
    const fromSeat2 = chosen[2] as TileId[];
    const seat1Kept = fromSeat2.filter((t) => s.players[1]?.hand.includes(t));
    const seat0Got = fromSeat2.filter((t) => s.players[0]?.hand.includes(t));
    expect(seat1Kept.length).toBe(1);
    expect(seat0Got.length).toBe(2);
    expect(s.players[0]?.hand).toContain((chosen[1] as TileId[])[0]);
    // seat 1 still holds the two tiles it chose not to pass
    for (const t of before[1] as TileId[]) if (t !== (chosen[1] as TileId[])[0]) expect(s.players[1]?.hand).toContain(t);
  });

  it('uses the IOU method when everyone blind passes: all three blind leaves every rack unchanged', () => {
    let s = scenario({ phase: { name: 'charleston', pass: 5 } });
    const before = s.players.map((p) => [...p.hand].sort((a, b) => a - b));
    let events: GameEvent[] = [];
    for (let seat = 0; seat < 4; seat++) ({ state: s, events } = act(s, seat, { type: 'charlestonPass', tiles: [], blind: 3 }));
    expect(s.players.map((p) => [...p.hand].sort((a, b) => a - b))).toEqual(before);
    expect(events.find((e) => e.type === 'charlestonPassed')).toMatchObject({ iou: true });
  });

  it('uses the IOU method when everyone blind passes one: everyone gives 2 of their own and still holds 13 or 14', () => {
    let s = scenario({ phase: { name: 'charleston', pass: 5 } });
    const chosen = [0, 1, 2, 3].map((seat) => threeTiles(s, seat).slice(0, 2));
    for (let seat = 0; seat < 4; seat++) s = act(s, seat, { type: 'charlestonPass', tiles: chosen[seat] as TileId[], blind: 1 }).state;
    for (let seat = 0; seat < 4; seat++) for (const t of chosen[seat] as TileId[]) expect(s.players[seat]?.hand).not.toContain(t);
    expect(s.players.map((p) => p.hand.length)).toEqual([14, 13, 13, 13]);
  });

  it('skips the second Charleston if any single player stops it', () => {
    let s = scenario({ phase: { name: 'vote' } });
    s = act(s, 0, { type: 'charlestonVote', continue: true }).state;
    s = act(s, 1, { type: 'charlestonVote', continue: true }).state;
    s = act(s, 2, { type: 'charlestonVote', continue: false }).state;
    const { state, events } = act(s, 3, { type: 'charlestonVote', continue: true });
    expect(state.phase.name).toBe('courtesyOffer');
    expect(events[0]).toMatchObject({ type: 'secondCharleston', played: false, stoppedBy: [2] });
    let t = scenario({ phase: { name: 'vote' } });
    for (let seat = 0; seat < 4; seat++) t = act(t, seat, { type: 'charlestonVote', continue: true }).state;
    expect(t.phase).toMatchObject({ name: 'charleston', pass: 3 });
  });

  it('courtesy pass: partners across trade the lower of their two offers, never jokers', () => {
    let s = scenario({ phase: { name: 'courtesyOffer' }, hands: { 2: 'J 1B 2B 3B 4B 5B 6B 7B 8B 9B 1C 2C 3C' } });
    s = act(s, 0, { type: 'courtesyOffer', count: 3 }).state;
    s = act(s, 2, { type: 'courtesyOffer', count: 1 }).state;
    s = act(s, 1, { type: 'courtesyOffer', count: 0 }).state;
    s = act(s, 3, { type: 'courtesyOffer', count: 2 }).state;
    expect(s.phase).toMatchObject({ name: 'courtesyPass', agreed: [1, 0, 1, 0] });
    refuse(s, 0, { type: 'courtesyPass', tiles: threeTiles(s, 0).slice(0, 2) }, 'courtesyCount');
    refuse(s, 2, { type: 'courtesyPass', tiles: tilesFromHand(s, 2, 'J') }, 'jokerPass');
    const give0 = threeTiles(s, 0).slice(0, 1);
    const give2 = tilesFromHand(s, 2, '9B');
    s = act(s, 0, { type: 'courtesyPass', tiles: give0 }).state;
    s = act(s, 2, { type: 'courtesyPass', tiles: give2 }).state;
    expect(s.players[2]?.hand).toContain(give0[0]);
    expect(s.players[0]?.hand).toContain(give2[0]);
    // East starts play by discarding from 14 tiles, without drawing
    expect(s.phase).toMatchObject({ name: 'turn', seat: 0, source: 'deal' });
    expect(s.players[0]?.hand.length).toBe(14);
  });
});

describe('claiming discards', () => {
  // seat 0 discarded a 5 Dot; seat 1 can expose it, seat 3 can win with it
  const priorityTable = () =>
    scenario({
      phase: { name: 'callWindow', discarder: 0 },
      floor: [{ seat: 0, code: '5D' }],
      hands: {
        1: '5D J 1B 2B 3B 4B 6B 7B 8B 9B 1C 2C 3C',
        3: '3D 3D 4D 4D 4D 5D 5D J 6D 6D 6D 7D 7D',
      },
    });

  it('Mah Jongg beats an exposure claim, and the discarder pays double', () => {
    let s = priorityTable();
    s = act(s, 1, { type: 'claimExposure', tiles: tilesFromHand(s, 1, '5D J') }).state;
    s = act(s, 2, { type: 'pass' }).state;
    const { state } = act(s, 3, { type: 'claimMahjong' });
    expect(result(state)).toMatchObject({ type: 'mahjong', winner: 3, how: 'discard', from: 0, handId: 'P-RUN-1', jokerless: false });
    expect(result(state).payments).toEqual([-50, -25, -25, 100]);
  });

  it('ties go to the seat next in turn after the discarder', () => {
    // two exposure claims: seat 1 (next after seat 0) wins over seat 3
    let s = scenario({
      phase: { name: 'callWindow', discarder: 0 },
      floor: [{ seat: 0, code: '5D' }],
      hands: { 1: '5D J 1B 2B 3B 4B 6B 7B 8B 9B 1C 2C 3C', 3: '5D 5D 1C 2C 3C 4C 6C 7C 8C 9C 1B 2B 3B' },
    });
    s = act(s, 3, { type: 'claimExposure', tiles: tilesFromHand(s, 3, '5D 5D') }).state;
    s = act(s, 2, { type: 'pass' }).state;
    s = act(s, 1, { type: 'claimExposure', tiles: tilesFromHand(s, 1, '5D J') }).state;
    expect(s.phase).toMatchObject({ name: 'turn', seat: 1, source: 'claim', from: 0 });
    expect(s.players[1]?.exposures[0]?.tiles.length).toBe(3);
    // two Mah Jongg claims: seat 2 (next after the discarder, seat 1) wins over seat 3
    let m = scenario({
      phase: { name: 'callWindow', discarder: 1 },
      floor: [{ seat: 1, code: '9B' }],
      hands: {
        2: '1B 1B 3B 3B 3B 5B 5B 5B 5B 7B 7B 7B 9B',
        3: 'F F F F 9B 9B 9C 9C 9C 9D 9D 9D J',
      },
    });
    m = act(m, 3, { type: 'claimMahjong' }).state;
    m = act(m, 0, { type: 'pass' }).state;
    m = act(m, 2, { type: 'claimMahjong' }).state;
    expect(result(m)).toMatchObject({ winner: 2, handId: 'P-ODD-1', from: 1 });
  });

  it('allows claiming for a pung or bigger, never for a pair (except Mah Jongg)', () => {
    const s = priorityTable();
    const msg = refuse(s, 1, { type: 'claimExposure', tiles: tilesFromHand(s, 1, '5D') }, 'claimTooSmall');
    expect(msg).toContain('pung, kong, quint or sextet');
    refuse(s, 1, { type: 'claimExposure', tiles: tilesFromHand(s, 1, '5D 1B') }, 'exposureMix');
  });

  it('refuses a Mah Jongg claim the tile does not complete', () => {
    const s = priorityTable();
    refuse(s, 1, { type: 'claimMahjong' }, 'notMahjong');
  });

  it('a discarded joker is dead: no call window, the next player draws', () => {
    const s = scenario({ phase: { name: 'turn', seat: 0 }, hands: { 0: 'J 1B 2B 3B 4B 5B 6B 7B 8B 9B 1C 2C 3C 4C' } });
    const { state, events } = act(s, 0, { type: 'discard', tile: tilesFromHand(s, 0, 'J')[0] as TileId });
    expect(state.phase).toMatchObject({ name: 'turn', seat: 1, source: 'draw' });
    expect(events.map((e) => e.type)).toEqual(['discard', 'draw']);
  });

  it('after an exposure the claimer discards without drawing, and play continues to the claimer\'s right', () => {
    let s = scenario({
      phase: { name: 'callWindow', discarder: 0 },
      floor: [{ seat: 0, code: '5D' }],
      hands: { 2: '5D 5D 1B 2B 3B 4B 6B 7B 8B 9B 1C 2C 3C' },
    });
    const wallBefore = s.wall.length;
    s = act(s, 1, { type: 'pass' }).state;
    s = act(s, 3, { type: 'pass' }).state;
    s = act(s, 2, { type: 'claimExposure', tiles: tilesFromHand(s, 2, '5D 5D') }).state;
    expect(s.phase).toMatchObject({ name: 'turn', seat: 2, source: 'claim' });
    expect(s.wall.length).toBe(wallBefore); // no draw
    s = act(s, 2, { type: 'discard', tile: tilesFromHand(s, 2, '1B')[0] as TileId }).state;
    expect(s.players[2]?.exposures[0]?.locked).toBe(true); // fixed once the owner discards
    s = passAll(s, [3, 0, 1]);
    expect(s.phase).toMatchObject({ name: 'turn', seat: 3, source: 'draw' }); // seat 1 lost its turn
  });

  it('the game\'s last discard can still be claimed for an exposure (labeled choice h), or only for Mah Jongg if set', () => {
    // An empty wall puts about 90 tiles on the table, which makes almost every hand impossible on public
    // evidence, so Safety is off here: this test is about the last-discard rule only.
    const setup = {
      phase: { name: 'callWindow', discarder: 0 } as const,
      floor: [{ seat: 0, code: '5D' }],
      hands: { 1: '5D 5D 1B 2B 3B 4B 6B 7B 8B 9B 1C 2C 3C' },
      wallSize: 0,
    };
    const s = scenario({ ...setup, rules: { safety: false } });
    act(s, 1, { type: 'claimExposure', tiles: tilesFromHand(s, 1, '5D 5D') });
    const strict = scenario({ ...setup, rules: { safety: false, lastDiscard: 'mahjongOnly' } });
    refuse(strict, 1, { type: 'claimExposure', tiles: tilesFromHand(strict, 1, '5D 5D') }, 'lastDiscard');
  });
});

describe('jokers and exposures', () => {
  const exchangeTable = () =>
    scenario({
      phase: { name: 'turn', seat: 1, source: 'draw' },
      hands: { 1: '5D 6D 1B 2B 3B 4B 6B 7B 8B 9B 1C 2C 3C 4C' },
      exposures: { 2: [{ codes: '5D 5D J' }], 3: [{ codes: '7B 7B 7B' }] },
    });

  it('trades a real tile for the joker standing for it, on your own turn', () => {
    const s = exchangeTable();
    refuse(s, 3, { type: 'jokerExchange', tile: s.players[3]?.hand[0] as TileId, owner: 2, exposure: 0 }, 'notYourTurn');
    refuse(s, 1, { type: 'jokerExchange', tile: tilesFromHand(s, 1, '6D')[0] as TileId, owner: 2, exposure: 0 }, 'exchangeWrongTile');
    refuse(s, 1, { type: 'jokerExchange', tile: tilesFromHand(s, 1, '7B')[0] as TileId, owner: 3, exposure: 0 }, 'noJoker');
    const { state } = act(s, 1, { type: 'jokerExchange', tile: tilesFromHand(s, 1, '5D')[0] as TileId, owner: 2, exposure: 0 });
    expect(countsOf(state.players[1]?.hand ?? [])[JOKER]).toBe(1);
    expect(state.players[2]?.exposures[0]?.tiles.map(kindOfTile)).toEqual([kindFromCode('5D'), kindFromCode('5D'), kindFromCode('5D')]);
  });

  it('an exposure can be changed until its owner discards or exchanges, and a joker just taken can never join it', () => {
    const claimTable = (rules: ScenarioSetup['rules']) => {
      let s = scenario({
        rules,
        phase: { name: 'callWindow', discarder: 0 },
        floor: [{ seat: 0, code: '5D' }],
        hands: { 1: '5D 5D 6D J 2B 3B 4B 6B 7B 8B 9B 1C 2C' },
        exposures: { 3: [{ codes: '6D 6D J' }] },
      });
      s = act(s, 1, { type: 'claimExposure', tiles: tilesFromHand(s, 1, '5D 5D') }).state;
      return passAll(s, [2, 3]);
    };
    // before discarding: make the pung a kong with a joker from the rack
    const s = claimTable({});
    const exp = s.players[1]?.exposures[0];
    const amended = act(s, 1, { type: 'amendExposure', exposure: 0, tiles: [...(exp?.tiles ?? []), ...tilesFromHand(s, 1, 'J')] });
    expect(amended.state.players[1]?.exposures[0]?.tiles.length).toBe(4);
    // after a joker exchange the exposure is locked (approved reading e)
    const swapped = act(s, 1, { type: 'jokerExchange', tile: tilesFromHand(s, 1, '6D')[0] as TileId, owner: 3, exposure: 0 }).state;
    const redeemed = (swapped.players[1]?.hand ?? []).filter((t) => kindOfTile(t) === JOKER);
    refuse(swapped, 1, { type: 'amendExposure', exposure: 0, tiles: [...(exp?.tiles ?? []), redeemed[0] as TileId] }, 'exposureLocked');
    // with the lock-on-discard-only setting, a joker just taken still can't join the new exposure
    const loose = claimTable({ exposureLock: 'discard' });
    const swapped2 = act(loose, 1, { type: 'jokerExchange', tile: tilesFromHand(loose, 1, '6D')[0] as TileId, owner: 3, exposure: 0 }).state;
    const p = swapped2.phase as Extract<GameState['phase'], { name: 'turn' }>;
    const exp2 = swapped2.players[1]?.exposures[0];
    refuse(swapped2, 1, { type: 'amendExposure', exposure: 0, tiles: [...(exp2?.tiles ?? []), p.redeemed[0] as TileId] }, 'redeemedJoker');
  });

  it('Safety ON blocks an exposure that fits no hand; Safety OFF allows it and the hand goes dead on discard', () => {
    const setup = {
      phase: { name: 'callWindow', discarder: 0 } as const,
      floor: [{ seat: 0, code: 'N' }],
      hands: { 1: 'N N 1B 2B 3B 4B 6B 7B 8B 9B 1C 2C 3C' },
    };
    const on = scenario(setup);
    const msg = refuse(on, 1, { type: 'claimExposure', tiles: tilesFromHand(on, 1, 'N N') }, 'exposureKillsHand');
    expect(msg).toContain('dead');
    let off = scenario({ ...setup, rules: { safety: false } });
    off = act(off, 1, { type: 'claimExposure', tiles: tilesFromHand(off, 1, 'N N') }).state;
    off = passAll(off, [2, 3]);
    expect(off.players[1]?.dead).toBeNull(); // can still be fixed before discarding
    const { state, events } = act(off, 1, { type: 'discard', tile: tilesFromHand(off, 1, '1B')[0] as TileId });
    expect(state.players[1]?.dead?.code).toBe('exposuresFitNoHand');
    expect(events.some((e) => e.type === 'dead' && e.seat === 1)).toBe(true);
    expect(pendingSeats(state)).toEqual([2, 3, 0]); // a dead hand no longer claims discards
  });
});

describe('dead hands and game endings', () => {
  it('declares a hand dead only on public evidence, then skips that player', () => {
    // seat 2's pung of 6 Bams and kong of 8 Bams fit only the 2468 line in Bams, which needs a pair of 2 Bams
    let s = scenario({
      phase: { name: 'turn', seat: 0 },
      hands: { 0: '2B 1C 2C 3C 4C 5C 6C 7C 8C 9C 1D 2D 3D 4D' },
      exposures: { 2: [{ codes: '6B 6B 6B' }, { codes: '8B 8B 8B 8B' }] },
      floor: [
        { seat: 1, code: '2B' },
        { seat: 3, code: '2B' },
      ],
    });
    const { state, events } = act(s, 0, { type: 'discard', tile: tilesFromHand(s, 0, '2B')[0] as TileId });
    expect(state.players[2]?.dead?.code).toBe('noHandPossible');
    expect(events.find((e) => e.type === 'dead')).toMatchObject({ seat: 2 });
    expect(pendingSeats(state)).toEqual([1, 3]);
    s = passAll(state, [1, 3]);
    expect(s.phase).toMatchObject({ name: 'turn', seat: 1 });
    s = act(s, 1, { type: 'discard', tile: threeTiles(s, 1)[0] as TileId }).state;
    expect(pendingSeats(s)).toEqual([3, 0]);
    s = passAll(s, [3, 0]);
    expect(s.phase).toMatchObject({ name: 'turn', seat: 3 }); // seat 2 is skipped
  });

  it('ends the game with no payments when three players are dead', () => {
    const s = scenario({
      phase: { name: 'turn', seat: 0 },
      exposures: { 1: [{ codes: 'N N N' }], 2: [{ codes: 'E E E E' }], 3: [{ codes: 'S S S' }] },
    });
    const { state, events } = act(s, 0, { type: 'discard', tile: threeTiles(s, 0)[0] as TileId });
    expect(events.filter((e) => e.type === 'dead').length).toBe(3);
    expect(result(state)).toEqual({ type: 'threeDead', payments: [0, 0, 0, 0] });
  });

  it('is a wall game when the wall runs out with no Mah Jongg', () => {
    let s = scenario({ phase: { name: 'callWindow', discarder: 0 }, floor: [{ seat: 0, code: '9D' }], wallSize: 0 });
    s = passAll(s, [1, 2, 3]);
    expect(result(s)).toEqual({ type: 'wall', payments: [0, 0, 0, 0] });
  });
});

describe('declaring Mah Jongg and payments', () => {
  it('refuses a Mah Jongg the tiles do not make', () => {
    const s = scenario({ phase: { name: 'turn', seat: 1 } });
    const msg = refuse(s, 1, { type: 'declareMahjong' }, 'notComplete');
    expect(msg).toContain("don't match any hand");
  });

  it('self-picked: all three pay double', () => {
    const s = scenario({ phase: { name: 'turn', seat: 1, source: 'draw' }, hands: { 1: 'F F 2B 2B 4B 4B 4B 6B 6B 6B 8B 8B 8B J' } });
    const r = result(act(s, 1, { type: 'declareMahjong' }).state);
    expect(r).toMatchObject({ how: 'selfDraw', selfPick: true, handId: 'P-EVEN-1', jokerless: false });
    expect(r.payments).toEqual([-50, 150, -50, -50]);
  });

  it('jokerless on a discard: the discarder pays 4 times the value, the others twice', () => {
    let s = scenario({
      phase: { name: 'callWindow', discarder: 0 },
      floor: [{ seat: 0, code: '8B' }],
      hands: { 1: 'F F 2B 2B 4B 4B 4B 6B 6B 6B 8B 8B 8B' },
    });
    s = act(s, 1, { type: 'claimMahjong' }).state;
    s = passAll(s, [2, 3]);
    const r = result(s);
    expect(r).toMatchObject({ jokerless: true, value: 25 });
    expect(r.payments).toEqual([-100, 200, -50, -50]);
  });

  it('a concealed hand may claim its last tile for Mah Jongg', () => {
    let s = scenario({
      phase: { name: 'callWindow', discarder: 0 },
      floor: [{ seat: 0, code: '6B' }],
      hands: { 1: 'F F 2B 2B 2B 2B 4B 4B 4B 4B 6B 6B 6B' },
    });
    s = act(s, 1, { type: 'claimMahjong' }).state;
    s = passAll(s, [2, 3]);
    expect(result(s)).toMatchObject({ handId: 'P-CONC-1', value: 35, jokerless: true });
    expect(result(s).payments).toEqual([-140, 280, -70, -70]);
  });

  it('Singles and Pairs get no jokerless bonus', () => {
    let s = scenario({
      phase: { name: 'callWindow', discarder: 0 },
      floor: [{ seat: 0, code: 'GD' }],
      hands: { 1: 'F F 1B 1B 2B 2B 3B 3B 4B 4B 5B 5B GD' },
    });
    s = act(s, 1, { type: 'claimMahjong' }).state;
    s = passAll(s, [2, 3]);
    expect(result(s)).toMatchObject({ handId: 'P-SP-1', value: 50, jokerless: true });
    expect(result(s).payments).toEqual([-100, 200, -50, -50]);
  });

  it('a Heavenly Hand is declared at once and paid as a self-pick', () => {
    const s = scenario({ phase: { name: 'heavenly' }, hands: { 0: 'F F 2B 2B 4B 4B 4B 6B 6B 6B 8B 8B 8B 8B' } });
    const r = result(act(s, 0, { type: 'declareMahjong' }).state);
    expect(r).toMatchObject({ how: 'heavenly', selfPick: true, jokerless: true });
    expect(r.payments).toEqual([300, -100, -100, -100]);
  });

  it('newGame detects a Heavenly Hand, and declining it starts the Charleston', () => {
    const s = scenario({ phase: { name: 'heavenly' }, hands: { 0: 'F F 2B 2B 4B 4B 4B 6B 6B 6B 8B 8B 8B 8B' } });
    expect(pendingSeats(s)).toEqual([0]);
    expect(act(s, 0, { type: 'proceed' }).state.phase).toMatchObject({ name: 'charleston', pass: 0 });
  });

  it('East complete after the Charleston declares instead of discarding, paid as a self-pick (labeled choice a)', () => {
    const s = scenario({ phase: { name: 'turn', seat: 0, source: 'deal' }, hands: { 0: 'F F 2B 2B 4B 4B 4B 6B 6B 6B 8B 8B 8B J' } });
    const r = result(act(s, 0, { type: 'declareMahjong' }).state);
    expect(r).toMatchObject({ how: 'eastFirst', selfPick: true });
    expect(r.payments).toEqual([150, -50, -50, -50]);
  });

  it('a Mah Jongg completed by a joker exchange counts as self-picked (labeled choice b)', () => {
    let s = scenario({
      phase: { name: 'callWindow', discarder: 3 },
      floor: [{ seat: 3, code: '5D' }],
      hands: { 0: '3D 3D 4D 4D 5D 5D J 6D 6D 6D 7D 7D 9C' },
      exposures: { 2: [{ codes: '9C 9C J' }] },
    });
    s = act(s, 0, { type: 'claimExposure', tiles: tilesFromHand(s, 0, '5D 5D J') }).state;
    s = passAll(s, [1, 2]);
    refuse(s, 0, { type: 'declareMahjong' }, 'notComplete');
    s = act(s, 0, { type: 'jokerExchange', tile: tilesFromHand(s, 0, '9C')[0] as TileId, owner: 2, exposure: 0 }).state;
    const r = result(act(s, 0, { type: 'declareMahjong' }).state);
    expect(r).toMatchObject({ how: 'jokerExchange', selfPick: true, handId: 'P-RUN-1' });
    expect(r.payments).toEqual([150, -50, -50, -50]);
  });

  it('dead players still pay the winner', () => {
    let s = scenario({
      phase: { name: 'callWindow', discarder: 0 },
      floor: [{ seat: 0, code: '8B' }],
      hands: { 1: 'F F 2B 2B 4B 4B 4B 6B 6B 6B 8B 8B 8B' },
    });
    s = { ...s, players: s.players.map((p, i) => (i === 3 ? { ...p, dead: { code: 'noHandPossible' as const, message: 'test' } } : p)) };
    s = { ...s, phase: { ...(s.phase as Extract<GameState['phase'], { name: 'callWindow' }>), eligible: [1, 2] } };
    s = act(s, 1, { type: 'claimMahjong' }).state;
    s = act(s, 2, { type: 'pass' }).state;
    expect(result(s).payments).toEqual([-100, 200, -50, -50]);
  });
});

describe('turn order', () => {
  it('rejects moves out of turn with a reason', () => {
    const s = scenario({ phase: { name: 'turn', seat: 2 } });
    const msg = refuse(s, 1, { type: 'discard', tile: s.players[1]?.hand[0] as TileId }, 'notYourTurn');
    expect(msg).toContain("It's West's turn");
    refuse(s, 2, { type: 'discard', tile: s.players[1]?.hand[0] as TileId }, 'tileNotInHand');
  });
});
