/**
 * Seat views: what one seat is allowed to know. Computer opponents receive only this (the public table
 * plus their own rack), so they can never peek at hidden tiles or the wall.
 */

import { PASS_NAMES, BLIND_PASSES, pendingSeats, windOf } from './engine';
import type { RuleOptions } from './rules';
import type { GameEvent, GameResult, GameState } from './state';
import type { Kind, TileId } from './tiles';

export interface PublicPlayer {
  seat: number;
  wind: string;
  exposures: { kind: Kind; tiles: TileId[]; locked: boolean; from: number }[];
  /** How many hidden tiles this player holds. */
  hiddenCount: number;
  dead: boolean;
  deadMessage: string | null;
}

export type PublicPhase =
  | { name: 'charleston'; pass: number; passName: string; blindAllowed: boolean; submitted: boolean[] }
  | { name: 'vote'; voted: boolean[] }
  | { name: 'courtesyOffer'; offered: boolean[] }
  | { name: 'courtesyPass'; agreed: number[]; submitted: boolean[] }
  | { name: 'turn'; seat: number; source: 'deal' | 'draw' | 'claim'; from: number | null; exchanged: boolean }
  | { name: 'callWindow'; tile: TileId; discarder: number; eligible: number[]; answered: boolean[] }
  | { name: 'ended'; result: GameResult };

export interface SeatView {
  seat: number;
  dealer: number;
  cardId: string;
  rules: RuleOptions;
  gameNumber: number;
  /** Counter of accepted actions (public), useful for seeding per-decision randomness. */
  actionCount: number;
  scores: number[];
  /** My hidden tiles. */
  hand: TileId[];
  players: PublicPlayer[];
  floor: { tile: TileId; seat: number }[];
  wallCount: number;
  phase: PublicPhase;
  /** True when the referee is waiting for this seat. */
  pending: boolean;
}

export function seatView(state: GameState, seat: number): SeatView {
  const p = state.phase;
  let phase: PublicPhase;
  switch (p.name) {
    case 'charleston':
      phase = {
        name: 'charleston',
        pass: p.pass,
        passName: PASS_NAMES[p.pass] as string,
        blindAllowed: BLIND_PASSES.includes(p.pass),
        submitted: p.selections.map((x) => x !== null),
      };
      break;
    case 'vote':
      phase = { name: 'vote', voted: p.votes.map((v) => v !== null) };
      break;
    case 'courtesyOffer':
      phase = { name: 'courtesyOffer', offered: p.offers.map((o) => o !== null) };
      break;
    case 'courtesyPass':
      phase = { name: 'courtesyPass', agreed: [...p.agreed], submitted: p.selections.map((x) => x !== null) };
      break;
    case 'turn':
      phase = { name: 'turn', seat: p.seat, source: p.source, from: p.from, exchanged: p.exchanged };
      break;
    case 'callWindow':
      phase = { name: 'callWindow', tile: p.tile, discarder: p.discarder, eligible: [...p.eligible], answered: p.responses.map((r) => r !== null) };
      break;
    case 'ended':
      phase = { name: 'ended', result: p.result };
      break;
  }
  return {
    seat,
    dealer: state.dealer,
    cardId: state.cardId,
    rules: state.rules,
    gameNumber: state.gameNumber,
    actionCount: state.actionCount,
    scores: [...state.scores],
    hand: [...(state.players[seat] as GameState['players'][number]).hand],
    players: state.players.map((pl, i) => ({
      seat: i,
      wind: windOf(state, i),
      exposures: pl.exposures.map((e) => ({ kind: e.kind, tiles: [...e.tiles], locked: e.locked, from: e.from })),
      hiddenCount: pl.hand.length,
      dead: pl.dead !== null,
      deadMessage: pl.dead?.message ?? null,
    })),
    floor: state.floor.map((f) => ({ ...f })),
    wallCount: state.wall.length,
    phase,
    pending: pendingSeats(state).includes(seat),
  };
}

/** The events one seat may see: private events for other seats are dropped, and others' draws are hidden. */
export function eventsFor(events: readonly GameEvent[], seat: number): GameEvent[] {
  const out: GameEvent[] = [];
  for (const e of events) {
    if (e.to !== undefined && e.to !== seat) continue;
    if (e.type === 'draw' && e.seat !== seat) out.push({ ...e, tile: -1 });
    else out.push(e);
  }
  return out;
}
