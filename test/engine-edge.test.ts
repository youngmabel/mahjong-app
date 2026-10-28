/**
 * Edge cases found by the independent review (STATUS.md, "Review"). Each test pins the corrected behavior.
 */

import { beforeAll, describe, expect, it } from 'vitest';
import { createBot } from '../src/bots/bot';
import { botConfig } from '../src/bots/config';
import { loadCard } from '../src/engine/card';
import { PRACTICE_CARD_TEXT } from '../src/engine/cards/practice';
import { apply, callOptions, checkInvariants, newGame, nextGame } from '../src/engine/engine';
import { Rng } from '../src/engine/rng';
import { buildScenario, tilesFromHand, type ScenarioSetup } from '../src/engine/scenario';
import type { Action, GameEvent, GameState } from '../src/engine/state';
import { JOKER, kindOfTile, type TileId } from '../src/engine/tiles';
import { seatView } from '../src/engine/view';
import { playBotGame } from '../src/sim/runner';

beforeAll(() => {
  loadCard(PRACTICE_CARD_TEXT);
});

function scenario(s: Omit<ScenarioSetup, 'cardId' | 'seed'> & { seed?: string }): GameState {
  const state = buildScenario({ seed: 'edge-test', cardId: 'practice', ...s });
  expect(checkInvariants(state)).toEqual([]);
  return state;
}
function act(state: GameState, seat: number, action: Action): { state: GameState; events: GameEvent[] } {
  const r = apply(state, seat, action);
  if (!r.ok) throw new Error(`rejected: ${r.violation.code}: ${r.violation.message}`);
  expect(checkInvariants(r.state)).toEqual([]);
  return { state: r.state, events: r.events };
}
function refuse(state: GameState, seat: number, action: Action, code: string): void {
  const r = apply(state, seat, action);
  expect(r.ok).toBe(false);
  if (!r.ok) expect(r.violation.code).toBe(code);
}
const passAll = (state: GameState, seats: number[]) => seats.reduce((s, seat) => act(s, seat, { type: 'pass' }).state, state);
const result = (state: GameState) => {
  if (state.phase.name !== 'ended') throw new Error(`not ended: ${state.phase.name}`);
  return state.phase.result;
};
const markDead = (s: GameState, seat: number): GameState => ({
  ...s,
  players: s.players.map((p, i) => (i === seat ? { ...p, dead: { code: 'noHandPossible' as const, message: 'test' } } : p)),
});

describe('dead hands are judged on settled evidence only', () => {
  it('a player can claim for Mah Jongg the very discard that would otherwise make the hand dead', () => {
    // West's exposures fit only the 2468 line in Bams, which needs a pair of 2 Bams; two 2 Bams are already out
    const s = scenario({
      phase: { name: 'turn', seat: 0 },
      hands: { 0: '2B 1C 2C 3C 4C 5C 6C 7C 8C 9C 1D 2D 3D 4D', 2: 'F F 2B 4B 4B 4B' },
      exposures: { 2: [{ codes: '6B 6B 6B' }, { codes: '8B 8B 8B 8B' }] },
      floor: [
        { seat: 1, code: '2B' },
        { seat: 3, code: '2B' },
      ],
    });
    let t = act(s, 0, { type: 'discard', tile: tilesFromHand(s, 0, '2B')[0] as TileId }).state;
    expect(t.players[2]?.dead).toBeNull();
    expect(callOptions(t, 2).mahjong).toBe(true);
    t = act(t, 2, { type: 'claimMahjong' }).state;
    t = passAll(t, [1, 3]);
    expect(result(t)).toMatchObject({ type: 'mahjong', winner: 2, from: 0, handId: 'P-EVEN-1', jokerless: true });
    expect(result(t).payments).toEqual([-100, -50, 200, -50]);
  });

  it("counts the jokers in a player's own exposures as still reachable", () => {
    // South exposed F F J J J (fits only the Quints line); four jokers are discarded and East discards a fifth.
    // South can still win: trade a real Flower for one of its own exposed jokers.
    const s = scenario({
      phase: { name: 'turn', seat: 0 },
      hands: { 0: 'J 1C 2C 3C 4C 5C 6C 7C 8C 9C 1D 2D 3D 4D', 1: '1B 1B 1B 1B 2B 2B 2B 2B' },
      exposures: { 1: [{ codes: 'F F J J J' }] },
      floor: [
        { seat: 2, code: 'J' },
        { seat: 3, code: 'J' },
        { seat: 2, code: 'J' },
        { seat: 3, code: 'J' },
      ],
      wallTop: 'F',
    });
    let t = act(s, 0, { type: 'discard', tile: tilesFromHand(s, 0, 'J')[0] as TileId }).state;
    expect(t.players[1]?.dead).toBeNull();
    expect(t.phase).toMatchObject({ name: 'turn', seat: 1, source: 'draw' });
    t = act(t, 1, { type: 'jokerExchange', tile: tilesFromHand(t, 1, 'F')[0] as TileId, owner: 1, exposure: 0 }).state;
    expect(result(act(t, 1, { type: 'declareMahjong' }).state)).toMatchObject({ winner: 1, handId: 'P-QUINT-1', how: 'selfDraw' });
  });

  it('Safety allows an exposure that stays winnable by redeeming jokers later', () => {
    const s = scenario({
      phase: { name: 'callWindow', discarder: 0 },
      hands: { 1: 'J J J J 1B 1B 1B 1B 2B 2B 2B 2B 9D' },
      floor: [
        { seat: 2, code: 'J' },
        { seat: 3, code: 'J' },
        { seat: 2, code: 'J' },
        { seat: 3, code: 'J' },
        { seat: 0, code: 'F' },
      ],
    });
    expect(callOptions(s, 1).exposures.some((o) => o.size === 5)).toBe(true);
    act(s, 1, { type: 'claimExposure', tiles: tilesFromHand(s, 1, 'J J J J') });
  });

  it('an exposure that can still change counts only its claimed tile as evidence', () => {
    // South claims a 2 Bam for a kong with three 2 Bams; West needs a pair of 2 Bams
    const setup = {
      phase: { name: 'callWindow', discarder: 0 } as const,
      floor: [{ seat: 0, code: '2B' }],
      hands: { 1: '2B 2B 2B J J J 1C 3C 5C 7C 9C 1D 3D' },
      exposures: { 2: [{ codes: '6B 6B 6B' }, { codes: '8B 8B 8B 8B' }] },
    };
    let s = scenario(setup);
    s = act(s, 1, { type: 'claimExposure', tiles: tilesFromHand(s, 1, '2B 2B 2B') }).state;
    s = passAll(s, [2, 3]);
    expect(s.players[2]?.dead).toBeNull(); // South may still change that kong
    // South swaps its three real 2 Bams for jokers before discarding: West stays alive
    const exp = s.players[1]?.exposures[0];
    const amended = act(s, 1, { type: 'amendExposure', exposure: 0, tiles: [exp?.claimedTile as TileId, ...tilesFromHand(s, 1, 'J J J')] }).state;
    const afterDiscard = act(amended, 1, { type: 'discard', tile: tilesFromHand(amended, 1, '1C')[0] as TileId }).state;
    expect(afterDiscard.players[2]?.dead).toBeNull();
    // had South kept all four 2 Bams, the kong locks at the discard and West is dead (all four 2 Bams showing)
    const kept = act(s, 1, { type: 'discard', tile: tilesFromHand(s, 1, '1C')[0] as TileId }).state;
    expect(kept.players[2]?.dead?.code).toBe('noHandPossible');
  });

  it('a player is judged when they discard, not in the middle of their turn', () => {
    // Safety off: South exposes a pung of Norths (fits no hand), then exchanges for a joker, which locks it
    let s = scenario({
      rules: { safety: false },
      phase: { name: 'callWindow', discarder: 0 },
      floor: [{ seat: 0, code: 'N' }],
      hands: { 1: 'N N 5D 1B 2B 3B 4B 6B 7B 8B 9B 1C 2C' },
      exposures: { 3: [{ codes: '5D 5D J' }] },
    });
    s = act(s, 1, { type: 'claimExposure', tiles: tilesFromHand(s, 1, 'N N') }).state;
    s = passAll(s, [2, 3]);
    s = act(s, 1, { type: 'jokerExchange', tile: tilesFromHand(s, 1, '5D')[0] as TileId, owner: 3, exposure: 0 }).state;
    expect(s.players[1]?.dead).toBeNull();
    expect(s.phase).toMatchObject({ name: 'turn', seat: 1 });
    const done = act(s, 1, { type: 'discard', tile: tilesFromHand(s, 1, '1B')[0] as TileId }).state;
    expect(done.players[1]?.dead?.code).toBe('exposuresFitNoHand');
  });
});

describe('payments', () => {
  it('choice (b) applies only when a joker exchange completes the hand', () => {
    // South claims an 8 Bam for a kong and is complete at once (2468 in Bams)
    const claimTable = () => {
      let s = scenario({
        phase: { name: 'callWindow', discarder: 0 },
        floor: [{ seat: 0, code: '8B' }],
        hands: { 1: 'F F 2B 2B 4B 4B J 6B 6B 6B 8B 8B 8B' },
        exposures: { 3: [{ codes: '6B J J' }] },
      });
      s = act(s, 1, { type: 'claimExposure', tiles: tilesFromHand(s, 1, '8B 8B 8B') }).state;
      return passAll(s, [2, 3]);
    };
    const direct = result(act(claimTable(), 1, { type: 'declareMahjong' }).state);
    expect(direct).toMatchObject({ how: 'discard', from: 0 });
    expect(direct.payments).toEqual([-50, 100, -25, -25]);
    // a pointless exchange first doesn't turn the discard win into a self-pick
    let s = claimTable();
    s = act(s, 1, { type: 'jokerExchange', tile: tilesFromHand(s, 1, '6B')[0] as TileId, owner: 3, exposure: 0 }).state;
    const after = result(act(s, 1, { type: 'declareMahjong' }).state);
    expect(after).toMatchObject({ how: 'discard', from: 0 });
    expect(after.payments).toEqual([-50, 100, -25, -25]);
  });
});

describe('exposures', () => {
  const claimKong = (hand: string) => {
    let s = scenario({ phase: { name: 'callWindow', discarder: 0 }, floor: [{ seat: 0, code: '5D' }], hands: { 1: hand } });
    s = act(s, 1, { type: 'claimExposure', tiles: tilesFromHand(s, 1, '5D 5D 5D') }).state;
    return passAll(s, [2, 3]);
  };

  it('can be changed to a smaller group before discarding, but the claimed tile must stay', () => {
    const s = claimKong('5D 5D 5D J 1B 2B 3B 4B 6B 7B 8B 9B 1C');
    const exp = s.players[1]?.exposures[0];
    const claimed = exp?.claimedTile as TileId;
    const others = (exp?.tiles ?? []).filter((t) => t !== claimed);
    const pung = act(s, 1, { type: 'amendExposure', exposure: 0, tiles: [claimed, ...others.slice(0, 2)] }).state;
    expect(pung.players[1]?.exposures[0]?.tiles.length).toBe(3);
    expect(pung.players[1]?.hand.filter((t) => kindOfTile(t) === kindOfTile(claimed)).length).toBe(1);
    refuse(s, 1, { type: 'amendExposure', exposure: 0, tiles: others }, 'keepClaimed');
  });

  it('Safety refuses a change that would make the hand dead', () => {
    // no line has a sextet of 5 Dots
    const s = claimKong('5D 5D 5D J J 1B 2B 3B 4B 6B 7B 8B 9B');
    const exp = s.players[1]?.exposures[0];
    refuse(s, 1, { type: 'amendExposure', exposure: 0, tiles: [...(exp?.tiles ?? []), ...tilesFromHand(s, 1, 'J J')] }, 'exposureKillsHand');
  });
});

describe('dead players', () => {
  it("other players can still take jokers from a dead player's exposures", () => {
    const s = markDead(
      scenario({
        phase: { name: 'turn', seat: 1, source: 'draw' },
        hands: { 1: '5D 6D 1B 2B 3B 4B 6B 7B 8B 9B 1C 2C 3C 4C' },
        exposures: { 2: [{ codes: '5D 5D J' }] },
      }),
      2,
    );
    const t = act(s, 1, { type: 'jokerExchange', tile: tilesFromHand(s, 1, '5D')[0] as TileId, owner: 2, exposure: 0 }).state;
    expect(t.players[1]?.hand.some((id) => kindOfTile(id) === JOKER)).toBe(true);
  });

  it('with the same-dealer setting, a game ended by three dead hands is redealt by the same East', () => {
    for (const [threeDeadDeal, dealer] of [
      ['passRight', 1],
      ['sameDealer', 0],
    ] as const) {
      const s = scenario({
        rules: { threeDeadDeal },
        phase: { name: 'turn', seat: 0 },
        exposures: { 1: [{ codes: 'N N N' }], 2: [{ codes: 'E E E E' }], 3: [{ codes: 'S S S' }] },
      });
      const ended = act(s, 0, { type: 'discard', tile: s.players[0]?.hand[0] as TileId }).state;
      expect(result(ended).type).toBe('threeDead');
      expect(nextGame(ended, 'next').state.dealer).toBe(dealer);
    }
  });
});

describe('Charleston blind passes and the IOU method (randomized)', () => {
  it('conserves tiles, and each seat keeps exactly 3 minus its blind count of what reached it', () => {
    const rng = Rng.fromSeed('iou-fuzz');
    for (let i = 0; i < 300; i++) {
      const pass = rng.pick([2, 5]);
      let s = scenario({ seed: `iou-${i}`, phase: { name: 'charleston', pass }, dealer: rng.int(4) });
      const before = s.players.map((p) => [...p.hand]);
      const blind = [0, 1, 2, 3].map(() => (rng.chance(0.4) ? 0 : 1 + rng.int(3)));
      const own: TileId[][] = [];
      for (let seat = 0; seat < 4; seat++) {
        own[seat] = rng.sample(
          (s.players[seat]?.hand ?? []).filter((t) => kindOfTile(t) !== JOKER),
          3 - (blind[seat] as number),
        );
        s = act(s, seat, { type: 'charlestonPass', tiles: own[seat] as TileId[], blind: blind[seat] as number }).state;
      }
      const passed = new Set(own.flat());
      let received = 0;
      for (let seat = 0; seat < 4; seat++) {
        const after = s.players[seat]?.hand ?? [];
        const kept = (before[seat] as TileId[]).filter((t) => !(own[seat] as TileId[]).includes(t));
        for (const t of kept) expect(after).toContain(t);
        const gained = after.filter((t) => !kept.includes(t));
        expect(gained.length).toBe(3 - (blind[seat] as number));
        for (const t of gained) expect(passed.has(t)).toBe(true);
        received += gained.length;
      }
      expect(received).toBe(passed.size);
    }
  });
});

describe('computer opponents never peek', () => {
  it("shuffling the other racks and the wall changes neither a bot's view nor its decision", () => {
    const run = playBotGame({ seed: 'no-peek', cardId: 'practice' });
    // replay to a few mid-game points and test each seat waiting there
    let state = newGame({ seed: 'no-peek', cardId: 'practice' }).state;
    const rng = Rng.fromSeed('no-peek-shuffle');
    let checked = 0;
    for (const [i, a] of run.actions.entries()) {
      if (i % 37 === 0 && state.phase.name !== 'ended') {
        const seat = a.seat;
        const others = [0, 1, 2, 3].filter((q) => q !== seat);
        const hidden = rng.shuffle([...others.flatMap((q) => state.players[q]?.hand ?? []), ...state.wall]);
        const shuffled: GameState = { ...state, players: state.players.map((p) => ({ ...p, hand: [...p.hand] })), wall: [] };
        for (const q of others) (shuffled.players[q] as GameState['players'][number]).hand = hidden.splice(0, state.players[q]?.hand.length ?? 0);
        shuffled.wall = hidden;
        expect(seatView(shuffled, seat)).toEqual(seatView(state, seat));
        const bot = createBot(botConfig(2), 'peek-test');
        expect(bot.decide(seatView(shuffled, seat))).toEqual(bot.decide(seatView(state, seat)));
        checked++;
      }
      state = act(state, a.seat, a.action).state;
    }
    expect(checked).toBeGreaterThan(3);
  });
});
