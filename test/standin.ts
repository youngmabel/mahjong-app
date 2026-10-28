/**
 * A stand-in for you at the table: it plays only through the screen's own move lists (src/ui/moves.ts)
 * and the game driver (src/ui/session.ts), so whole games test what the buttons offer.
 */

import { expect } from 'vitest';
import { checkInvariants } from '../src/engine/engine';
import type { Rng } from '../src/engine/rng';
import { JOKER, kindOfTile } from '../src/engine/tiles';
import {
  callChoices,
  charlestonInfo,
  charlestonPassChoice,
  courtesyOfferChoices,
  courtesyPassChoice,
  heavenlyChoice,
  isPending,
  selectionLimit,
  turnChoices,
  voteChoices,
  type Choice,
} from '../src/ui/moves';
import { HUMAN, type SavedGame, type Session, type SessionHost } from '../src/ui/session';

/** Runs the computer players' paced moves on demand instead of on a clock. */
export class FakeHost implements SessionHost {
  timers: { fn: () => void; id: number; ms: number }[] = [];
  saves: SavedGame[] = [];
  changes = 0;
  private nextId = 1;
  schedule(fn: () => void, ms: number): () => void {
    const id = this.nextId++;
    this.timers.push({ fn, id, ms });
    return () => {
      this.timers = this.timers.filter((t) => t.id !== id);
    };
  }
  changed(): void {
    this.changes++;
  }
  save(game: SavedGame): void {
    this.saves.push(JSON.parse(JSON.stringify(game)) as SavedGame);
  }
  /** Let every pending computer move happen, until the game waits for you or ends. */
  flush(limit = 5000): void {
    let n = 0;
    while (this.timers.length > 0) {
      if (++n > limit) throw new Error('computer moves never settled');
      const t = this.timers.shift() as { fn: () => void };
      t.fn();
    }
  }
}

export interface StandInStats {
  moves: number;
  byKind: Record<string, number>;
  refusalsChecked: number;
}

export function newStats(): StandInStats {
  return { moves: 0, byKind: {}, refusalsChecked: 0 };
}

function count(stats: StandInStats, key: string): void {
  stats.byKind[key] = (stats.byKind[key] ?? 0) + 1;
}

/** A refused choice must be refused by the referee too, with the same reason, and change nothing. */
function checkRefusal(session: Session, c: Choice, stats: StandInStats): void {
  expect(c.ok).toBe(false);
  if (c.screenOnly) {
    // the screen explains these itself (nothing selected yet); the move is never sent
    expect(c.reason?.length ?? 0).toBeGreaterThan(10);
    stats.refusalsChecked++;
    return;
  }
  const before = JSON.stringify(session.state);
  const reason = session.act(c.action);
  expect(reason).toBe(c.reason);
  expect(JSON.stringify(session.state)).toBe(before);
  stats.refusalsChecked++;
}

/**
 * Make one decision for your seat using only what the screen offers. Returns false when the game isn't
 * waiting for you. Throws if the screen ever offers a move the referee refuses.
 */
export function standInMove(session: Session, rng: Rng, stats: StandInStats): boolean {
  const state = session.state;
  if (!isPending(state, HUMAN)) return false;
  const p = state.phase;
  const hand = (state.players[HUMAN] as (typeof state.players)[number]).hand;
  const naturals = hand.filter((t) => kindOfTile(t) !== JOKER);
  const jokers = hand.filter((t) => kindOfTile(t) === JOKER);
  let choice: Choice;
  switch (p.name) {
    case 'charleston': {
      const heaven = heavenlyChoice(state, HUMAN);
      if (heaven?.ok) {
        choice = heaven;
        break;
      }
      const info = charlestonInfo(state, HUMAN);
      if (!info) throw new Error('no Charleston info');
      const blind = info.blindAllowed && rng.chance(0.3) ? 1 + rng.int(3) : 0;
      expect(selectionLimit(state, HUMAN, blind)).toBe(3 - blind);
      if (jokers.length > 0 && blind < 3 && rng.chance(0.3)) {
        checkRefusal(session, charlestonPassChoice(state, HUMAN, [jokers[0] as number, ...naturals.slice(0, 2 - blind)], blind), stats);
      }
      if (rng.chance(0.1)) checkRefusal(session, charlestonPassChoice(state, HUMAN, naturals.slice(0, 2 - Math.min(blind, 2)), blind === 3 ? 0 : blind), stats);
      choice = charlestonPassChoice(state, HUMAN, rng.sample(naturals, 3 - blind), blind);
      break;
    }
    case 'vote':
      choice = rng.pick(voteChoices(state, HUMAN));
      break;
    case 'courtesyOffer':
      choice = rng.pick(courtesyOfferChoices(state, HUMAN));
      break;
    case 'courtesyPass': {
      const n = p.agreed[HUMAN] as number;
      expect(selectionLimit(state, HUMAN, 0)).toBe(n);
      choice = courtesyPassChoice(state, HUMAN, rng.sample(naturals, n));
      break;
    }
    case 'turn': {
      const nothing = turnChoices(state, HUMAN, []);
      if (!nothing) throw new Error('no turn choices on your turn');
      if (rng.chance(0.05)) checkRefusal(session, nothing.discard, stats);
      const tc = turnChoices(state, HUMAN, [rng.pick(hand)]);
      if (!tc) throw new Error('no turn choices on your turn');
      if (!tc.mahjong.ok && rng.chance(0.05)) checkRefusal(session, tc.mahjong, stats);
      if (tc.mahjong.ok) choice = tc.mahjong;
      else if (tc.exchanges.length > 0 && rng.chance(0.6)) choice = rng.pick(tc.exchanges);
      else if (tc.amends.length > 0 && rng.chance(0.4)) choice = rng.pick(tc.amends);
      else choice = tc.discard;
      break;
    }
    case 'callWindow': {
      const all = callChoices(state, HUMAN);
      expect(all.some((c) => c.key === 'pass' && c.ok)).toBe(true);
      const refused = all.filter((c) => !c.ok);
      if (refused.length > 0 && rng.chance(0.1)) checkRefusal(session, rng.pick(refused), stats);
      const ok = all.filter((c) => c.ok);
      const mj = ok.find((c) => c.key === 'mahjong');
      const exposures = ok.filter((c) => c.key.startsWith('expose-'));
      choice = mj ?? (exposures.length > 0 && rng.chance(0.5) ? rng.pick(exposures) : (ok.find((c) => c.key === 'pass') as Choice));
      break;
    }
    default:
      return false;
  }
  if (!choice.ok) throw new Error(`the stand-in picked a refused move: ${choice.reason}`);
  const reason = session.act(choice.action);
  if (reason) throw new Error(`the screen offered "${choice.label}" but the referee refused it: ${reason}`);
  expect(checkInvariants(session.state)).toEqual([]);
  stats.moves++;
  count(stats, choice.action.type);
  return true;
}

/** Play the current game to its end: you through the stand-in, the others as usual. */
export function playToEnd(session: Session, host: FakeHost, rng: Rng, stats: StandInStats, maxDecisions = 400): void {
  for (let i = 0; i < maxDecisions; i++) {
    host.flush();
    if (session.state.phase.name === 'ended') return;
    if (!standInMove(session, rng, stats)) throw new Error(`stuck in phase ${session.state.phase.name}: not waiting for you, no timer pending`);
  }
  throw new Error('game did not end');
}
