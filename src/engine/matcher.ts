/**
 * The matcher: everything that compares tiles with the card.
 *
 * - isComplete: do these tiles exactly match a concrete hand (target)?
 * - tilesAway / analyze: how far is a hand from a target, and what is missing?
 * - exposuresFit: do a player's exposures fit a target?
 * - mahjongTargets / exposureOptions / jokerExchangeOptions: claim and exchange legality.
 * - privatelyBlocked: a target the player can't finish given what THEY can see (used by bots and coach).
 * - publiclyImpossible / officialDeadReason: dead hands judged only on what the whole table can see.
 *
 * Why per-kind counting is exact (docs/07-app-spec.md 5.1): jokers fill only groups of 3 or more,
 * and a real tile of kind k only fits slots of kind k. So real tiles go to the singles and pairs of
 * their kind first; the rest of each kind and the jokers are interchangeable across that kind's big groups.
 * The brute-force property test in test/matcher.property.test.ts checks this against general matching.
 */

import { groupKey } from './card/expand';
import type { Card, Target, TargetGroup } from './card/types';
import { JOKER, JOKER_COUNT, NUM_KINDS, SUPPLY, kindOfTile, type Kind, type TileId } from './tiles';

/** What the matcher needs to know about one exposure. */
export interface ExposureInfo {
  kind: Kind;
  size: number;
  jokers: number;
}

/** Exposures pre-digested for fast checks against many targets. */
export interface PreparedExposures {
  list: readonly ExposureInfo[];
  /** Total exposed size per kind. */
  sizeByKind: Int8Array;
  /** Count of exposures by key kind*8+size. */
  keys: Map<number, number>;
}

const NO_EXPOSURES: PreparedExposures = { list: [], sizeByKind: new Int8Array(NUM_KINDS), keys: new Map() };

export function prepareExposures(list: readonly ExposureInfo[]): PreparedExposures {
  if (list.length === 0) return NO_EXPOSURES;
  const sizeByKind = new Int8Array(NUM_KINDS);
  const keys = new Map<number, number>();
  for (const e of list) {
    sizeByKind[e.kind] = (sizeByKind[e.kind] as number) + e.size;
    const key = groupKey(e.kind, e.size);
    keys.set(key, (keys.get(key) ?? 0) + 1);
  }
  return { list, sizeByKind, keys };
}

function asPrepared(e: PreparedExposures | readonly ExposureInfo[]): PreparedExposures {
  return isExposureList(e) ? prepareExposures(e) : e;
}

function isExposureList(e: PreparedExposures | readonly ExposureInfo[]): e is readonly ExposureInfo[] {
  return Array.isArray(e);
}

/** Exposures fit a target when each one matches its own joker-eligible group of the same kind and size. */
export function exposuresFit(t: Target, exp: PreparedExposures | readonly ExposureInfo[]): boolean {
  const p = asPrepared(exp);
  if (p.list.length === 0) return true;
  if (t.concealed) return false; // concealed hands expose nothing before Mah Jongg
  for (const [key, n] of p.keys) if ((t.exposableGroups.get(key) ?? 0) < n) return false;
  return true;
}

/** True when the hidden tiles plus the exposures make exactly this target (hand = hidden tiles, with jokers at index JOKER). */
export function isComplete(t: Target, hand: ArrayLike<number>, exp: PreparedExposures | readonly ExposureInfo[]): boolean {
  const p = asPrepared(exp);
  if (!exposuresFit(t, p)) return false;
  let handTotal = 0;
  for (let k = 0; k < NUM_KINDS; k++) handTotal += hand[k] as number;
  let slots = 0;
  let short = 0;
  for (const k of t.kinds) {
    const plainK = t.plain[k] as number;
    const flexK = (t.flex[k] as number) - (p.sizeByKind[k] as number);
    const have = hand[k] as number;
    if (have < plainK) return false; // singles and pairs need real tiles
    if (have > plainK + flexK) return false; // a real tile would be left over
    short += plainK + flexK - have;
    slots += plainK + flexK;
  }
  return handTotal === slots && short === (hand[JOKER] as number);
}

/**
 * Tiles away: how many more tiles (swapped in for unused ones) this hand needs to complete the target.
 * Infinity when the exposures don't fit. With 14 tiles, 0 means Mah Jongg; with 13, the best possible is 1.
 */
export function tilesAway(t: Target, hand: ArrayLike<number>, exp: PreparedExposures | readonly ExposureInfo[]): number {
  const p = asPrepared(exp);
  if (!exposuresFit(t, p)) return Infinity;
  let missPlain = 0;
  let missFlex = 0;
  for (const k of t.kinds) {
    const plainK = t.plain[k] as number;
    const flexK = (t.flex[k] as number) - (p.sizeByKind[k] as number);
    const have = hand[k] as number;
    const usedPlain = have < plainK ? have : plainK;
    missPlain += plainK - usedPlain;
    const spare = have - usedPlain;
    if (flexK > spare) missFlex += flexK - spare;
  }
  const jokers = hand[JOKER] as number;
  return missPlain + (missFlex > jokers ? missFlex - jokers : 0);
}

export interface Analysis {
  away: number;
  /** Missing real tiles for singles and pairs, per kind (jokers can't help these). */
  missingPlain: number[];
  /** Missing tiles for groups of 3 or more, per kind, before counting the jokers held. */
  missingFlex: number[];
  missingPlainTotal: number;
  missingFlexTotal: number;
  /** Jokers the target would use from the hand now. */
  jokersUsed: number;
  /** Held real tiles the target doesn't use, per kind (candidates to discard or pass). */
  extra: number[];
  /** Jokers held beyond what the target can use right now. */
  spareJokers: number;
}

/** Detailed shortfall for one target; null when the exposures don't fit. */
export function analyze(t: Target, hand: ArrayLike<number>, exp: PreparedExposures | readonly ExposureInfo[]): Analysis | null {
  const p = asPrepared(exp);
  if (!exposuresFit(t, p)) return null;
  const missingPlain = new Array<number>(NUM_KINDS).fill(0);
  const missingFlex = new Array<number>(NUM_KINDS).fill(0);
  const extra = new Array<number>(NUM_KINDS).fill(0);
  let mp = 0;
  let mf = 0;
  for (let k = 0; k < NUM_KINDS; k++) {
    if (k === JOKER) continue;
    const plainK = t.plain[k] as number;
    const flexK = (t.flex[k] as number) - (p.sizeByKind[k] as number);
    const have = hand[k] as number;
    const usedPlain = Math.min(have, plainK);
    missingPlain[k] = plainK - usedPlain;
    mp += plainK - usedPlain;
    const spare = have - usedPlain;
    const usedFlex = Math.min(spare, flexK);
    missingFlex[k] = flexK - usedFlex;
    mf += flexK - usedFlex;
    extra[k] = spare - usedFlex;
  }
  const jokers = hand[JOKER] as number;
  const jokersUsed = Math.min(jokers, mf);
  return {
    away: mp + Math.max(0, mf - jokers),
    missingPlain,
    missingFlex,
    missingPlainTotal: mp,
    missingFlexTotal: mf,
    jokersUsed,
    extra,
    spareJokers: jokers - jokersUsed,
  };
}

/** Kinds that would bring this target one tile closer if drawn or passed to the player. */
export function helpfulKinds(a: Analysis, jokersHeld: number): { kinds: Kind[]; jokerHelps: boolean } {
  const flexStillShort = a.missingFlexTotal > jokersHeld;
  const kinds: Kind[] = [];
  for (let k = 0; k < NUM_KINDS; k++) {
    if (k === JOKER) continue;
    if ((a.missingPlain[k] as number) > 0 || (flexStillShort && (a.missingFlex[k] as number) > 0)) kinds.push(k);
  }
  return { kinds, jokerHelps: flexStillShort };
}

/** Outs: unseen copies (live tiles) that would bring this target one tile closer. */
export function outs(a: Analysis, jokersHeld: number, live: ArrayLike<number>): number {
  const { kinds, jokerHelps } = helpfulKinds(a, jokersHeld);
  let n = 0;
  for (const k of kinds) n += live[k] as number;
  if (jokerHelps) n += live[JOKER] as number;
  return n;
}

/**
 * Privately blocked: from one player's own view, this target can't be finished. `unseen` counts copies
 * the player can't see (supply minus their own tiles, all exposures and all discards). Jokers sitting in
 * other players' exposures still count as obtainable (by joker exchange). Never announced.
 */
export function privatelyBlocked(a: Analysis, jokersHeld: number, unseen: ArrayLike<number>, exposedJokersElsewhere: number): boolean {
  let flexNeedFromJokers = 0;
  for (let k = 0; k < NUM_KINDS; k++) {
    if (k === JOKER) continue;
    const mp = a.missingPlain[k] as number;
    const live = unseen[k] as number;
    if (mp > live) return true;
    const mf = a.missingFlex[k] as number;
    const naturalsLeft = live - mp;
    if (mf > naturalsLeft) flexNeedFromJokers += mf - naturalsLeft;
  }
  const obtainableJokers = jokersHeld + (unseen[JOKER] as number) + exposedJokersElsewhere;
  return flexNeedFromJokers > obtainableJokers;
}

/** Public information about the table, for official dead-hand judgments. */
export interface PublicTable {
  /** Real (non-joker) tiles visible to everyone, per kind: all discards plus all exposed real tiles. */
  visibleNaturals: ArrayLike<number>;
  /** Jokers that have been discarded (dead for good). */
  discardedJokers: number;
}

/**
 * Can this target still be finished by this player, judging only by what everyone can see
 * (the player's own exposures plus all discards and exposures, never their hidden tiles)?
 * docs/01-rules.md section 11 and docs/07-app-spec.md 5.3.
 */
export function publiclyPossible(t: Target, ownExposures: PreparedExposures, table: PublicTable): boolean {
  if (!exposuresFit(t, ownExposures)) return false;
  let ownExposedJokers = 0;
  for (const e of ownExposures.list) ownExposedJokers += e.jokers;
  let flexNeedFromJokers = 0;
  for (const k of t.kinds) {
    const plainK = t.plain[k] as number;
    const flexK = (t.flex[k] as number) - (ownExposures.sizeByKind[k] as number);
    const available = (SUPPLY[k] as number) - (table.visibleNaturals[k] as number);
    if (plainK > available) return false; // a needed single or pair has too many copies showing
    const naturalsForFlex = available - plainK;
    if (flexK > naturalsForFlex) flexNeedFromJokers += flexK - naturalsForFlex;
  }
  // Jokers in other players' exposures can still be won by joker exchange, so only discarded jokers
  // and the player's own exposed jokers (already in use) are out of reach.
  const jokersAvailable = JOKER_COUNT - table.discardedJokers - ownExposedJokers;
  return flexNeedFromJokers <= jokersAvailable;
}

export type DeadReason = 'exposuresFitNoHand' | 'noHandPossible';

/** The official dead-hand ground that applies, if any (public evidence only). */
export function officialDeadReason(card: Card, ownExposures: PreparedExposures, table: PublicTable): DeadReason | null {
  const anyFit = ownExposures.list.length === 0 || card.targets.some((t) => exposuresFit(t, ownExposures));
  if (!anyFit) return 'exposuresFitNoHand';
  for (const t of card.targets) if (publiclyPossible(t, ownExposures, table)) return null;
  return 'noHandPossible';
}

/** Payment multiplier for ranking wins: value doubled when jokerless and the hand allows the bonus. */
export function winScore(t: Target, jokerless: boolean): number {
  return t.value * (jokerless && t.jokerlessBonus ? 2 : 1);
}

/** All targets these tiles complete, best-paying first. */
export function completedTargets(card: Card, hand: ArrayLike<number>, exp: PreparedExposures | readonly ExposureInfo[]): Target[] {
  const p = asPrepared(exp);
  let exposedJokers = 0;
  for (const e of p.list) exposedJokers += e.jokers;
  const jokerless = (hand[JOKER] as number) === 0 && exposedJokers === 0;
  const out = card.targets.filter((t) => isComplete(t, hand, p));
  out.sort((x, y) => winScore(y, jokerless) - winScore(x, jokerless) || x.index - y.index);
  return out;
}

/** Targets the player would complete by adding one tile of `kind` (a Mah Jongg claim). */
export function mahjongTargetsWith(card: Card, hand: ArrayLike<number>, exp: PreparedExposures | readonly ExposureInfo[], kind: Kind): Target[] {
  const h = Array.from(hand);
  h[kind] = (h[kind] as number) + 1;
  return completedTargets(card, h, exp);
}

export interface ExposureOption {
  size: number;
  /** Real tiles of the claimed kind the player adds from the hand (the claimed tile is extra). */
  naturals: number;
  jokers: number;
  /** Some exposed-allowed hand still fits all the player's exposures afterward. */
  fitsCard: boolean;
}

/**
 * Every exposure the player could legally make by claiming a discard of `kind`: pung, kong, quint or
 * sextet, built from the claimed tile plus real tiles and jokers from the hand. fitsCard says whether
 * the result still fits some exposed (X) hand; exposing for a single or pair is never offered.
 */
export function exposureOptions(card: Card, hand: ArrayLike<number>, exposures: readonly ExposureInfo[], kind: Kind): ExposureOption[] {
  if (kind === JOKER) return [];
  const have = hand[kind] as number;
  const jokers = hand[JOKER] as number;
  const out: ExposureOption[] = [];
  for (let size = 3; size <= 6; size++) {
    const fromHand = size - 1;
    if (fromHand > have + jokers) continue;
    const after = prepareExposures([...exposures, { kind, size, jokers: 0 }]);
    const fitsCard = card.targets.some((t) => exposuresFit(t, after));
    for (let naturals = Math.min(have, fromHand); naturals >= 0; naturals--) {
      const j = fromHand - naturals;
      if (j > jokers) break;
      out.push({ size, naturals, jokers: j, fitsCard });
    }
  }
  return out;
}

export interface ExposedJoker {
  seat: number;
  exposureIndex: number;
  kind: Kind;
}

/** Joker exchanges available to a player holding `hand`: any exposure with a joker standing for a kind they hold. */
export function jokerExchangeOptions(hand: ArrayLike<number>, exposed: readonly ExposedJoker[]): ExposedJoker[] {
  return exposed.filter((e) => (hand[e.kind] as number) > 0);
}

export interface PlacedGroup {
  group: TargetGroup;
  tiles: TileId[];
  exposed: boolean;
}

/**
 * Show which tile goes where for a completed (or partly completed) target: real tiles to singles and
 * pairs first, then to larger groups, then jokers to the larger groups still short. Exposed groups keep
 * their own tiles. Groups come back in card order. docs/07-app-spec.md 5.5.
 */
export function arrangeTiles(t: Target, handIds: readonly TileId[], exposures: readonly { kind: Kind; tiles: readonly TileId[] }[]): PlacedGroup[] {
  const placed: PlacedGroup[] = t.groups.map((g) => ({ group: g, tiles: [], exposed: false }));
  const usedExp = new Set<number>();
  for (const p of placed) {
    if (p.group.size < 3) continue;
    const ei = exposures.findIndex((e, i) => !usedExp.has(i) && e.kind === p.group.kind && e.tiles.length === p.group.size);
    if (ei >= 0) {
      usedExp.add(ei);
      p.tiles = [...(exposures[ei] as { tiles: readonly TileId[] }).tiles];
      p.exposed = true;
    }
  }
  const pool = new Map<Kind, TileId[]>();
  for (const id of handIds) {
    const k = kindOfTile(id);
    const list = pool.get(k) ?? [];
    list.push(id);
    pool.set(k, list);
  }
  const take = (k: Kind, n: number): TileId[] => {
    const list = pool.get(k) ?? [];
    return list.splice(0, Math.min(n, list.length));
  };
  for (const p of placed) if (!p.exposed && !p.group.jokers) p.tiles.push(...take(p.group.kind, p.group.size));
  for (const p of placed) if (!p.exposed && p.group.jokers) p.tiles.push(...take(p.group.kind, p.group.size));
  for (const p of placed) if (!p.exposed && p.group.jokers) p.tiles.push(...take(JOKER, p.group.size - p.tiles.length));
  return placed;
}
