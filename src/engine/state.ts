/**
 * Game state, actions, events and violations. The whole game is one plain JSON object, changed only
 * by the referee function apply() in engine.ts, so it can be saved, replayed and compared exactly.
 *
 * Seats are 0 to 3 in turn order: play goes to the right, so seat s+1 sits to the right of seat s.
 * The dealer's seat is East; the next seats are South, West and North.
 */

import type { RngState } from './rng';
import type { RuleOptions } from './rules';
import type { Kind, TileId } from './tiles';

export interface Exposure {
  /** The tile kind this exposure is a group of. */
  kind: Kind;
  /** Physical tiles, real ones and jokers. */
  tiles: TileId[];
  /** The claimed discard that started it (always a real tile). */
  claimedTile: TileId;
  /** Seat that discarded the claimed tile. */
  from: number;
  /** Locked exposures can no longer be changed. */
  locked: boolean;
}

export type DeadCode = 'exposuresFitNoHand' | 'noHandPossible';

export interface PlayerState {
  /** Hidden tiles on the rack. */
  hand: TileId[];
  exposures: Exposure[];
  dead: null | { code: DeadCode; message: string };
}

export interface CharlestonSelection {
  /** Tiles from the player's own rack (3 minus the blind count). */
  tiles: TileId[];
  /** How many incoming tiles to pass along unseen (blind pass), 0 to 3. */
  blind: number;
}

export type CallResponse = { type: 'pass' } | { type: 'mahjong' } | { type: 'expose'; tiles: TileId[] };

export type WinHow = 'heavenly' | 'eastFirst' | 'selfDraw' | 'discard' | 'jokerExchange';

export type GameResult =
  | {
      type: 'mahjong';
      winner: number;
      how: WinHow;
      selfPick: boolean;
      /** Seat that discarded the winning tile, for discard wins. */
      from: number | null;
      handId: string;
      targetIndex: number;
      value: number;
      jokerless: boolean;
      /** Points won (+) or paid (-) by each seat. */
      payments: number[];
    }
  | { type: 'wall'; payments: number[] }
  | { type: 'threeDead'; payments: number[] };

export type Phase =
  /** The dealer was dealt a complete hand and may declare it (Heavenly Hand). */
  | { name: 'heavenly' }
  /** Charleston pass 0..5: right, across, left, then (second Charleston) left, across, right. */
  | { name: 'charleston'; pass: number; selections: (CharlestonSelection | null)[] }
  /** After the first Charleston: does everyone want the second one? Any single "stop" ends it. */
  | { name: 'vote'; votes: (boolean | null)[] }
  | { name: 'courtesyOffer'; offers: (number | null)[] }
  | { name: 'courtesyPass'; agreed: number[]; selections: (TileId[] | null)[] }
  /** A player's turn with 14 tiles: declare Mah Jongg, exchange for jokers, adjust a new exposure, or discard. */
  | {
      name: 'turn';
      seat: number;
      source: 'deal' | 'draw' | 'claim';
      /** For a claimed tile: who discarded it. */
      from: number | null;
      exchanged: boolean;
      /** Jokers taken by exchange this turn (they may not join an exposure made this turn). */
      redeemed: TileId[];
    }
  /** A discard is down: each live player answers pass, Mah Jongg, or expose. */
  | { name: 'callWindow'; tile: TileId; discarder: number; eligible: number[]; responses: (CallResponse | null)[] }
  | { name: 'ended'; result: GameResult };

export interface GameState {
  version: 1;
  seed: string;
  cardId: string;
  rules: RuleOptions;
  gameNumber: number;
  dealer: number;
  /** Running session totals per seat (points). */
  scores: number[];
  /** Remaining wall, next tile first. */
  wall: TileId[];
  players: PlayerState[];
  /** Discards still on the table, in order (claimed discards are removed). */
  floor: { tile: TileId; seat: number }[];
  phase: Phase;
  /** The engine's own random stream (used to pick blind-passed tiles). */
  rng: RngState;
  /** Number of accepted actions so far. */
  actionCount: number;
}

export type Action =
  | { type: 'declareMahjong' }
  | { type: 'proceed' }
  | { type: 'charlestonPass'; tiles: TileId[]; blind?: number }
  | { type: 'charlestonVote'; continue: boolean }
  | { type: 'courtesyOffer'; count: number }
  | { type: 'courtesyPass'; tiles: TileId[] }
  | { type: 'discard'; tile: TileId }
  | { type: 'jokerExchange'; tile: TileId; owner: number; exposure: number }
  | { type: 'amendExposure'; exposure: number; tiles: TileId[] }
  | { type: 'pass' }
  | { type: 'claimMahjong' }
  | { type: 'claimExposure'; tiles: TileId[] };

export type GameEvent = { to?: number } & (
  | { type: 'deal'; dealer: number }
  | { type: 'heavenlyDeclined'; seat: number }
  | { type: 'charlestonPassed'; pass: number; blind: number[]; iou: boolean }
  | { type: 'tilesReceived'; seat: number; tiles: TileId[]; pass: number | 'courtesy' }
  | { type: 'secondCharleston'; played: boolean; stoppedBy: number[] }
  | { type: 'courtesyAgreed'; seats: [number, number]; count: number }
  | { type: 'playStarts'; dealer: number }
  | { type: 'draw'; seat: number; tile: TileId; wallLeft: number }
  | { type: 'discard'; seat: number; tile: TileId }
  | { type: 'claim'; seat: number; tile: TileId; from: number; purpose: 'exposure' | 'mahjong' }
  | { type: 'expose'; seat: number; exposure: number; kind: Kind; size: number; jokers: number }
  | { type: 'amendExposure'; seat: number; exposure: number; size: number; jokers: number }
  | { type: 'jokerExchange'; seat: number; owner: number; exposure: number; kind: Kind }
  | { type: 'dead'; seat: number; code: DeadCode; message: string }
  | { type: 'gameEnd'; result: GameResult }
);

export interface Violation {
  code: string;
  /** One or two plain-English sentences the coach can show. */
  message: string;
}

export type ApplyResult = { ok: true; state: GameState; events: GameEvent[] } | { ok: false; violation: Violation };
