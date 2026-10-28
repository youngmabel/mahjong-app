/**
 * Rigged setups for tests now and tutorial lessons later (docs/07-app-spec.md section 9): place the
 * listed racks, exposures, discards and top of the wall, remove those tiles from the set, then shuffle
 * the rest with the scenario seed so the unscripted part is random but repeatable.
 */

import { getCard } from './card';
import { completedTargets } from './matcher';
import { Rng, streamSeed } from './rng';
import { makeRules, type RuleOptions } from './rules';
import type { Exposure, GameState, Phase } from './state';
import { JOKER, allTileIds, countsOf, kindFromCode, kindOfTile, kindsFromCodes, type TileId } from './tiles';

export interface ScenarioExposure {
  /** Tile codes; the first real tile is the claimed one. Example: "5D 5D J". */
  codes: string;
  from?: number;
  locked?: boolean;
}

export type ScenarioPhase =
  | { name: 'charleston'; pass?: number }
  | { name: 'vote' }
  | { name: 'courtesyOffer' }
  | { name: 'turn'; seat: number; source?: 'deal' | 'draw' | 'claim'; from?: number }
  /** The discard must be the last entry of `floor`. */
  | { name: 'callWindow'; discarder: number };

export interface ScenarioSetup {
  seed: string;
  cardId: string;
  rules?: Partial<RuleOptions>;
  dealer?: number;
  /** Hidden tiles per seat as codes, e.g. "F F 2B 2B J". Seats left out get random tiles. */
  hands?: Partial<Record<number, string>>;
  exposures?: Partial<Record<number, ScenarioExposure[]>>;
  floor?: { seat: number; code: string }[];
  /** Codes of the next tiles in the wall, in draw order. */
  wallTop?: string;
  /**
   * How many tiles remain in the wall (default: every unplaced tile). Tiles beyond that are placed as
   * earlier discards (spread over the seats), before the listed floor tiles, so all 152 stay accounted for.
   */
  wallSize?: number;
  phase: ScenarioPhase;
  /** Hand sizes (hidden + exposed) for seats filled randomly. Defaults: 13, or 14 for the seat whose turn it is / the dealer before play. */
  randomSizes?: Partial<Record<number, number>>;
}

export function buildScenario(setup: ScenarioSetup): GameState {
  getCard(setup.cardId);
  const dealer = setup.dealer ?? 0;
  const pool = allTileIds();
  const take = (code: string): TileId => {
    const k = kindFromCode(code);
    const i = pool.findIndex((id) => kindOfTile(id) === k);
    if (i < 0) throw new Error(`Scenario uses more ${code} tiles than the set has.`);
    return pool.splice(i, 1)[0] as TileId;
  };
  const takeAll = (codes: string): TileId[] =>
    codes
      .split(/[\s,]+/)
      .filter((c) => c.length > 0)
      .map(take);

  const players: GameState['players'] = [0, 1, 2, 3].map(() => ({ hand: [], exposures: [], dead: null }));
  for (let seat = 0; seat < 4; seat++) {
    for (const e of setup.exposures?.[seat] ?? []) {
      const tiles = takeAll(e.codes);
      const claimed = tiles.find((t) => kindOfTile(t) !== JOKER);
      if (claimed === undefined) throw new Error('An exposure needs at least one real tile (the claimed one).');
      const exposure: Exposure = { kind: kindOfTile(claimed), tiles, claimedTile: claimed, from: e.from ?? (seat + 3) % 4, locked: e.locked ?? true };
      (players[seat] as GameState['players'][number]).exposures.push(exposure);
    }
  }
  for (let seat = 0; seat < 4; seat++) {
    const codes = setup.hands?.[seat];
    if (codes !== undefined) (players[seat] as GameState['players'][number]).hand = takeAll(codes);
  }
  const floor = (setup.floor ?? []).map((f) => ({ seat: f.seat, tile: take(f.code) }));
  const wallTop = setup.wallTop ? takeAll(setup.wallTop) : [];
  const rng = Rng.fromSeed(streamSeed(setup.seed, 'scenario'));
  rng.shuffle(pool);
  const ph = setup.phase;
  const beforePlay = ph.name === 'charleston' || ph.name === 'vote' || ph.name === 'courtesyOffer';
  for (let seat = 0; seat < 4; seat++) {
    if (setup.hands?.[seat] !== undefined) continue;
    const pl = players[seat] as GameState['players'][number];
    const exposed = pl.exposures.reduce((n, e) => n + e.tiles.length, 0);
    const size =
      setup.randomSizes?.[seat] ?? (beforePlay ? (seat === dealer ? 14 : 13) : ph.name === 'turn' && ph.seat === seat ? 14 : 13);
    // random fill avoids jokers so rigged lessons stay predictable
    for (let i = 0; i < size - exposed; i++) {
      const j = pool.findIndex((id) => kindOfTile(id) !== JOKER);
      pl.hand.push(pool.splice(j, 1)[0] as TileId);
    }
  }
  let wall = [...wallTop, ...pool];
  if (setup.wallSize !== undefined && setup.wallSize < wall.length) {
    const extra = wall.splice(setup.wallSize);
    const earlier = extra.map((tile, i) => ({ seat: i % 4, tile }));
    floor.unshift(...earlier);
    wall = wall.slice(0, setup.wallSize);
  }

  let phase: Phase;
  switch (ph.name) {
    case 'charleston':
      phase = { name: 'charleston', pass: ph.pass ?? 0, selections: [null, null, null, null] };
      break;
    case 'vote':
      phase = { name: 'vote', votes: [null, null, null, null] };
      break;
    case 'courtesyOffer':
      phase = { name: 'courtesyOffer', offers: [null, null, null, null] };
      break;
    case 'turn':
      phase = { name: 'turn', seat: ph.seat, source: ph.source ?? 'draw', from: ph.from ?? null, exchanged: false, redeemed: [], completedBy: null };
      break;
    case 'callWindow': {
      const last = floor[floor.length - 1];
      if (!last || last.seat !== ph.discarder) throw new Error('For a call window, the last floor tile must be the discarder\'s.');
      const eligible = [1, 2, 3].map((i) => (ph.discarder + i) % 4);
      phase = { name: 'callWindow', tile: last.tile, discarder: ph.discarder, eligible, responses: [null, null, null, null] };
      break;
    }
  }
  return {
    version: 1,
    seed: setup.seed,
    cardId: setup.cardId,
    rules: makeRules(setup.rules),
    gameNumber: 1,
    dealer,
    scores: [0, 0, 0, 0],
    wall,
    players,
    floor,
    phase,
    rng: Rng.fromSeed(streamSeed(setup.seed, 'engine')).getState(),
    actionCount: 0,
  };
}

/** Tile ids of the given codes from one seat's hidden rack (for building actions in tests and lessons). */
export function tilesFromHand(state: GameState, seat: number, codes: string): TileId[] {
  const hand = [...(state.players[seat] as GameState['players'][number]).hand];
  return kindsFromCodes(codes).map((k) => {
    const i = hand.findIndex((id) => kindOfTile(id) === k);
    if (i < 0) throw new Error(`Seat ${seat} has no more of that tile.`);
    return hand.splice(i, 1)[0] as TileId;
  });
}

/** True when this seat's hidden tiles (with exposures) complete a hand on the card. */
export function seatHasMahjong(state: GameState, seat: number): boolean {
  const pl = state.players[seat] as GameState['players'][number];
  const exp = pl.exposures.map((e) => ({ kind: e.kind, size: e.tiles.length, jokers: e.tiles.filter((t) => kindOfTile(t) === JOKER).length }));
  return completedTargets(getCard(state.cardId), countsOf(pl.hand), exp).length > 0;
}
