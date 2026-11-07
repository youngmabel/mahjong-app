/**
 * Tests for the coach (milestone 3): line ranking with live tiles, Hide concealed hands, Charleston passes
 * judged as a set, discards that never cost a pinned hand, every call option weighed, joker exchanges, no
 * tile advice on the stop vote, and whole games played by a stand-in that only follows the coach, where
 * the referee must accept every suggested move.
 */

import { beforeAll, describe, expect, it } from 'vitest';
import { getCard, loadCard } from '../src/engine/card';
import { PRACTICE_CARD_TEXT } from '../src/engine/cards/practice';
import { apply, callOptions, checkInvariants, newGame, pendingSeats } from '../src/engine/engine';
import { Rng } from '../src/engine/rng';
import { buildScenario, type ScenarioSetup } from '../src/engine/scenario';
import type { GameState } from '../src/engine/state';
import { JOKER, NUM_KINDS, kindCode, kindOfTile, type Kind } from '../src/engine/tiles';
import { seatView } from '../src/engine/view';
import {
  adviseCall,
  adviseExchanges,
  adviseVote,
  coachNote,
  discardLoss,
  needsKind,
  passLoss,
  passScore,
  pinnedLines,
  rankLines,
  readRack,
  readiness,
  buildReview,
  emptyStats,
  sentenceCount,
  suggestDiscard,
  suggestPass,
  narrateBotMove,
  ruleCardsFor,
  RULE_CARDS,
  type CoachOptions,
} from '../src/coach';
import { exchangeChoices } from '../src/ui/moves';
import type { Bot } from '../src/bots/bot';
import { defaultBots } from '../src/sim/runner';
import { DEFAULT_PREFS, type Prefs } from '../src/ui/prefs';
import { HUMAN, Session } from '../src/ui/session';
import { FakeHost } from './standin';
import { coachFollowerMove } from './coachstandin';

beforeAll(() => {
  loadCard(PRACTICE_CARD_TEXT);
});

const NONE: CoachOptions = { hideConcealed: false, pinned: [] };
const prefs = (over: Partial<Prefs> = {}): Prefs => ({ ...DEFAULT_PREFS, progress: { ...DEFAULT_PREFS.progress }, ...over });

function scenario(s: Omit<ScenarioSetup, 'cardId' | 'seed'> & { seed?: string }): GameState {
  const state = buildScenario({ seed: 'coach-test', cardId: 'practice', ...s });
  expect(checkInvariants(state)).toEqual([]);
  return state;
}

const TILE_WORDS = /\b\d (Dot|Bam|Crak)s?\b|\b(North|East|West|South)( wind|s)\b|\bSoaps?\b|\b(Red|Green) Dragons?\b|\bFlowers?\b/;

describe('reading the rack', () => {
  it('ranks the closest line first, by tiles away', () => {
    const s = scenario({ hands: { 0: '1B 1B 2B 2B 2B 3B 3B 3B 3B 4B 4B 4B 5B N' }, phase: { name: 'turn', seat: 0 } });
    const lines = rankLines(readRack(seatView(s, 0)), NONE);
    expect(lines[0]?.handId).toBe('P-RUN-1');
    expect(lines[0]?.title).toBe('Consecutive Run #1');
    expect(lines[0]?.away).toBe(1);
    expect(suggestDiscard(seatView(s, 0), NONE)?.kind).toBe(kindOfTile(seatView(s, 0).hand.find((t) => kindCode(kindOfTile(t)) === 'N') as number));
  });

  it('keeps concealed lines out of every suggestion when Hide concealed hands is on', () => {
    const s = scenario({ hands: { 0: 'F F 2D 2D 2D 2D 4D 4D 4D 4D 6D 6D 6D N' }, phase: { name: 'turn', seat: 0 } });
    const view = seatView(s, 0);
    expect(rankLines(readRack(view), NONE)[0]?.handId).toBe('P-CONC-1');
    const hidden = rankLines(readRack(view), { hideConcealed: true });
    expect(hidden.some((l) => l.concealed)).toBe(false);
    const note = coachNote(view, { hideConcealed: true, pinned: [] });
    expect(note?.tiers.join(' ')).not.toContain('2468 #2');
  });

  it('marks a line the player can no longer finish (a needed pair already used up on the table)', () => {
    const s = scenario({
      hands: { 0: '1D 1D 3D 3D 3D 5D 5D 5D 5D 7D 7D 7D 9D N' },
      floor: [
        { seat: 1, code: '9D' },
        { seat: 2, code: '9D' },
        { seat: 3, code: '9D' },
      ],
      phase: { name: 'turn', seat: 0 },
    });
    const lines = rankLines(readRack(seatView(s, 0)), NONE);
    // the Dots version (1 tile away) can't be finished, so the coach reads 13579 #1 from a version it can still make
    const odd = lines.find((l) => l.handId === 'P-ODD-1');
    expect(odd?.blocked).toBe(false);
    expect(odd?.away).toBeGreaterThan(1);
    expect(lines[0]?.handId).not.toBe('P-ODD-1');
  });
});

/** Random racks for property tests: 14 tiles for seat 0 on its turn, jokers allowed. */
function randomTurn(seed: string): GameState {
  const rng = Rng.fromSeed(seed);
  const pool: string[] = [];
  for (let k = 0; k < NUM_KINDS; k++) for (let i = 0; i < (k >= 34 ? 8 : 4); i++) pool.push(kindCode(k as Kind));
  const hand = rng.sample(pool, 14).join(' ');
  return scenario({ seed, hands: { 0: hand }, phase: { name: 'turn', seat: 0 } });
}

function randomCharleston(seed: string): GameState {
  return scenario({ seed, phase: { name: 'charleston', pass: 0 }, dealer: 1 });
}

describe('Charleston passes', () => {
  it('judges the 3 tiles as a set: the best of every possible set, never a joker, never worse than one-at-a-time', () => {
    let better = 0;
    for (let i = 0; i < 40; i++) {
      const view = seatView(randomCharleston(`pass-${i}`), 0);
      const a = suggestPass(view, NONE, 3, false);
      expect(a.tiles).toHaveLength(3);
      expect(a.tiles.some((t) => kindOfTile(t) === JOKER)).toBe(false);
      expect(a.text.startsWith('Suggestion:')).toBe(true);
      const mine = passScore(view, NONE, a.tiles.map(kindOfTile));
      // brute force over every 3-tile set of real tiles on the rack
      const ids = view.hand.filter((t) => kindOfTile(t) !== JOKER);
      let min = Infinity;
      for (let x = 0; x < ids.length; x++)
        for (let y = x + 1; y < ids.length; y++)
          for (let z = y + 1; z < ids.length; z++) min = Math.min(min, passScore(view, NONE, [ids[x], ids[y], ids[z]].map((t) => kindOfTile(t as number))));
      expect(mine).toBeCloseTo(min, 9);
      // one tile at a time: each step takes the tile whose loss alone is smallest
      const left = [...ids];
      const greedy: Kind[] = [];
      for (let n = 0; n < 3; n++) {
        left.sort((p, q) => passScore(view, NONE, [...greedy, kindOfTile(p)]) - passScore(view, NONE, [...greedy, kindOfTile(q)]));
        greedy.push(kindOfTile(left.shift() as number));
      }
      const g = passScore(view, NONE, greedy);
      expect(mine).toBeLessThanOrEqual(g + 1e-9);
      if (mine < g - 1e-9) better++;
      expect(passLoss(view, NONE, a.tiles)).toBe(0);
    }
    console.log(`set judgment beat one-at-a-time on ${better} of 40 racks`);
  });

  it("keeps the pinned hand's tiles out of a pass when other tiles will do", () => {
    for (let i = 0; i < 30; i++) {
      const s = randomCharleston(`pin-pass-${i}`);
      const view = seatView(s, 0);
      const best = rankLines(readRack(view), NONE)[0];
      if (!best) continue;
      const opts: CoachOptions = { hideConcealed: false, pinned: [best.handId] };
      const rack = readRack(view);
      const free = view.hand.filter((t) => kindOfTile(t) !== JOKER && !needsKind(best.target, rack, kindOfTile(t)));
      if (free.length < 3) continue;
      const a = suggestPass(view, opts, 3, false);
      const pin = pinnedLines(rack, opts)[0];
      if (!pin) continue;
      for (const t of a.tiles) {
        const k = kindOfTile(t);
        const used = Math.min(rack.counts[k] as number, (pin.target.plain[k] as number) + (pin.target.flex[k] as number));
        const passed = a.tiles.filter((x) => kindOfTile(x) === k).length;
        expect((rack.counts[k] as number) - passed).toBeGreaterThanOrEqual(used);
      }
    }
  });

  it('suggests a blind pass only on a pass that allows one', () => {
    for (let i = 0; i < 20; i++) {
      const view = seatView(randomCharleston(`blind-${i}`), 0);
      expect(suggestPass(view, NONE, 3, false).blind).toBe(0);
      const b = suggestPass(view, NONE, 3, true);
      expect(b.tiles.length + b.blind).toBe(3);
    }
  });
});

describe('discards', () => {
  it('never suggests a tile the pinned hand needs when another tile will do', () => {
    let checked = 0;
    for (let i = 0; i < 120; i++) {
      const s = randomTurn(`discard-${i}`);
      const view = seatView(s, 0);
      const best = rankLines(readRack(view), NONE).find((l) => !l.blocked);
      if (!best || best.away === 0) continue;
      const opts: CoachOptions = { hideConcealed: false, pinned: [best.handId] };
      const rack = readRack(view);
      const pin = pinnedLines(rack, opts)[0];
      if (!pin) continue;
      const spare = view.hand.some((t) => kindOfTile(t) !== JOKER && !needsKind(pin.target, rack, kindOfTile(t)));
      const d = suggestDiscard(view, opts);
      expect(d).not.toBeNull();
      expect(kindOfTile(d!.tile)).not.toBe(JOKER);
      if (spare) {
        expect(needsKind(pin.target, rack, d!.kind)).toBe(false);
        checked++;
      }
      expect(discardLoss(view, opts, d!.kind)).toBe(0);
    }
    expect(checked).toBeGreaterThan(50);
  });

  it('plays safe late in a hopeless hand, preferring tiles already showing', () => {
    const s = scenario({
      hands: { 0: '1B 4C 7D N E W RD GD F 9B 2C 5D 8D S' },
      floor: [
        { seat: 1, code: 'N' },
        { seat: 2, code: 'N' },
        { seat: 3, code: 'N' },
      ],
      wallSize: 8,
      phase: { name: 'turn', seat: 0 },
    });
    const d = suggestDiscard(seatView(s, 0), NONE);
    expect(d?.why).toMatch(/play safe/);
  });
});

describe('calls', () => {
  it('weighs every legal option, not just the first (a kong beats the pung here)', () => {
    const s = scenario({
      hands: { 0: '4C 4C 4C 5C 5C 5C 6C 6C RD RD RD J N' },
      floor: [{ seat: 3, code: '5C' }],
      phase: { name: 'callWindow', discarder: 3 },
    });
    const legal = callOptions(s, 0);
    expect(legal.exposures[0]?.size).toBe(3);
    const a = adviseCall(seatView(s, 0), NONE, legal);
    expect(a?.verdict).toBe('call');
    expect(a?.size).toBe(4);
    expect(a?.jokers).toBe(0);
    expect(a?.options.length).toBeGreaterThan(2);
  });

  it('always calls a legal Mah Jongg', () => {
    const s = scenario({
      hands: { 0: '3B 3B 4B 4B 4B 5B 5B 6B 6B 6B 7B 7B J' },
      floor: [{ seat: 3, code: '5B' }],
      phase: { name: 'callWindow', discarder: 3 },
    });
    const a = adviseCall(seatView(s, 0), NONE, callOptions(s, 0));
    expect(a?.verdict).toBe('mahjong');
    expect(coachNote(seatView(s, 0), NONE, { legalCalls: callOptions(s, 0) })?.choiceKey).toBe('mahjong');
  });

  it("won't suggest calling for an exposure a pinned concealed hand can't use", () => {
    const s = scenario({
      hands: { 0: 'F F 2D 2D 2D 4D 4D 4D 4D 6D 6D 6D N' },
      floor: [{ seat: 3, code: '2D' }],
      phase: { name: 'callWindow', discarder: 3 },
    });
    const a = adviseCall(seatView(s, 0), { hideConcealed: false, pinned: ['P-CONC-1'] }, callOptions(s, 0));
    expect(a?.verdict).toBe('pass');
    expect(a?.why).toMatch(/concealed/);
  });
});

describe('joker exchanges and Mah Jongg', () => {
  it('points out a joker exchange the hand can afford', () => {
    const s = scenario({
      hands: { 0: '1B 1B 2B 2B 2B 3B 3B 3B 3B 4B 4B 4B 5B 5D' },
      exposures: { 2: [{ codes: '5D 5D J' }] },
      phase: { name: 'turn', seat: 0 },
    });
    const view = seatView(s, 0);
    const ex = adviseExchanges(view, NONE);
    expect(ex[0]?.recommended).toBe(true);
    const note = coachNote(view, NONE);
    expect(note?.choiceKey).toBe('exchange-2-0');
    expect(exchangeChoices(s, 0).some((c) => c.key === note?.choiceKey && c.ok)).toBe(true);
  });

  it('tells you to declare a complete hand', () => {
    const s = scenario({ hands: { 0: '1B 1B 2B 2B 2B 3B 3B 3B 3B 4B 4B 4B 5B 5B' }, phase: { name: 'turn', seat: 0 } });
    const note = coachNote(seatView(s, 0), NONE);
    expect(note?.choiceKey).toBe('mahjong');
    expect(note?.why).toContain('Consecutive Run #1');
  });
});

describe('decisions that are not about tiles', () => {
  it('gives no tile advice on the stop vote', () => {
    for (let i = 0; i < 25; i++) {
      const s = scenario({ seed: `vote-${i}`, phase: { name: 'vote' }, dealer: 1 });
      const a = adviseVote(seatView(s, 0), NONE);
      expect(`${a.text} ${a.why}`).not.toMatch(TILE_WORDS);
      const note = coachNote(seatView(s, 0), NONE);
      expect(`${note?.text} ${note?.why}`).not.toMatch(TILE_WORDS);
    }
  });
});

describe('rule cards', () => {
  it('states each rule in one or two sentences', () => {
    for (const c of Object.values(RULE_CARDS)) expect(sentenceCount(c.text), c.key).toBeLessThanOrEqual(2);
  });

  it('picks the cards that fit the moment', () => {
    const s = scenario({ phase: { name: 'charleston', pass: 2 }, dealer: 1 });
    const keys = ruleCardsFor(seatView(s, 0));
    expect(keys).toContain('charleston');
    expect(keys).toContain('blindPass');
  });
});

describe('the readiness report', () => {
  it('passes with no rule broken and a viable direction; pace is advice only', () => {
    const stats = { ...emptyStats(), direction: { titles: ['Consecutive Run #1'], viable: true, detail: 'ok' }, charlestonMs: [30000, 40000] };
    const r = readiness(2, stats);
    expect(r.allPass).toBe(true);
    expect(r.pace.pass).toBe(false);
    expect(r.card.pass).toBeNull();
  });

  it('fails the rules check after a rule slip or a dead hand, and without a direction', () => {
    const slip = readiness(2, { ...emptyStats(), slips: [{ code: 'jokerPass', message: 'Jokers can never be passed.' }], direction: { titles: ['x'], viable: true, detail: '' } });
    expect(slip.rules.pass).toBe(false);
    expect(slip.allPass).toBe(false);
    expect(readiness(1, { ...emptyStats(), dead: true }).rules.pass).toBe(false);
    expect(readiness(1, emptyStats()).hand.pass).toBe(false);
  });

  it('reviews the costliest differences first, with any specific lesson', () => {
    const d = (loss: number, note: string | null) => ({ topic: 'turn' as const, wall: 50, did: `You discarded ${loss}.`, coach: 'Suggestion: x.', loss, note, followed: false });
    const review = buildReview({ ...emptyStats(), decisions: [d(0.2, null), d(0.05, null), d(0.5, null), d(0.01, 'Your pinned hand used it.')] });
    expect(review.lines[0]).toContain('pinned');
    expect(review.lines[1]).toContain('0.5');
    expect(review.lines).toHaveLength(3);
  });
});

describe('whole games with a stand-in that follows the coach', () => {
  it('plays 24 games where the referee accepts every suggested move, in one or two sentences each', () => {
    const texts: string[] = [];
    let moves = 0;
    const endings: Record<string, number> = {};
    for (let g = 0; g < 24; g++) {
      const host = new FakeHost();
      const session = new Session(host, prefs({ safety: g % 2 === 0, hideConcealed: g % 3 === 0 }));
      session.advance();
      const opts: CoachOptions = { hideConcealed: g % 3 === 0, pinned: [] };
      const ended = () => session.state.phase.name === 'ended';
      for (let i = 0; i < 400 && !ended(); i++) {
        host.flush();
        if (ended()) break;
        if (coachFollowerMove(session, opts, texts)) moves++;
      }
      expect(session.state.phase.name).toBe('ended');
      expect(checkInvariants(session.state)).toEqual([]);
      const r = session.state.phase.name === 'ended' ? session.state.phase.result : null;
      const key = r ? (r.type === 'mahjong' ? (r.winner === HUMAN ? 'coach won' : 'computer won') : r.type) : 'none';
      endings[key] = (endings[key] ?? 0) + 1;
    }
    expect(moves).toBeGreaterThan(500);
    for (const t of texts) expect(sentenceCount(t), t).toBeLessThanOrEqual(2);
    expect(endings['coach won'] ?? 0).toBeGreaterThan(0);
    console.log('coach stand-in endings', endings, 'moves', moves);
  });

  it("narrates the computer players' passes, discards and calls in one sentence each", () => {
    let narrated = 0;
    for (let g = 0; g < 6; g++) {
      const seed = `narrate-${g}`;
      let { state } = newGame({ seed, cardId: 'practice' });
      const bots = defaultBots(seed, 1);
      for (let i = 0; i < 3000 && state.phase.name !== 'ended'; i++) {
        const seat = pendingSeats(state)[0] as number;
        const view = seatView(state, seat);
        const action = (bots[seat] as Bot).decide(view);
        const text = narrateBotMove(view, action);
        if (text) {
          expect(sentenceCount(text), text).toBe(1);
          narrated++;
        }
        const r = apply(state, seat, action);
        expect(r.ok).toBe(true);
        if (r.ok) state = r.state;
      }
    }
    expect(narrated).toBeGreaterThan(200);
    expect(getCard('practice').hands.length).toBe(12);
  });
});
