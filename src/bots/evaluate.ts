/**
 * How a computer opponent judges its own position, using only its seat view.
 *
 * Each target (concrete hand) gets a score: tiles away, plus a little extra for missing singles and
 * pairs (jokers can't fill them) and for jokers the target needs beyond those held. The position's value
 * sums the closest targets, each weighted by its point value and shrinking with distance:
 *   V = sum over the closest K targets of (1 + value/100) * base^(-score)
 * (docs/07-app-spec.md section 7; docs/04-strategy.md section 2.1). Comparing V before and after a
 * candidate move tells the bot which tiles matter to its own candidate hands, so bots never rank tiles
 * with one card-wide table (a pitfall other apps hit).
 */

import type { Card, Target } from '../engine/card';
import { exposuresFit, prepareExposures, type ExposureInfo, type PreparedExposures, type PublicTable } from '../engine/matcher';
import { JOKER, JOKER_COUNT, NUM_KINDS, SUPPLY, countsOf, emptyCounts, kindOfTile } from '../engine/tiles';
import type { SeatView } from '../engine/view';
import type { BotConfig } from './config';

export interface EvalContext {
  card: Card;
  cfg: BotConfig;
  exposures: PreparedExposures;
  ownExposedJokers: number;
  /** Copies of each kind this seat can't see (in the wall or other players' hidden tiles). */
  unseen: number[];
  /** Jokers in other players' exposures (they can still be won by joker exchange). */
  exposedJokersElsewhere: number;
  /** Targets that fit this seat's exposures. */
  candidates: Target[];
}

export function exposureInfoFromView(e: SeatView['players'][number]['exposures'][number]): ExposureInfo {
  let jokers = 0;
  for (const id of e.tiles) if (kindOfTile(id) === JOKER) jokers++;
  return { kind: e.kind, size: e.tiles.length, jokers };
}

/** What everyone can see, rebuilt from a seat view. */
export function publicTableFromView(view: SeatView): PublicTable {
  const visibleNaturals = emptyCounts();
  let discardedJokers = 0;
  for (const f of view.floor) {
    const k = kindOfTile(f.tile);
    if (k === JOKER) discardedJokers++;
    else visibleNaturals[k]++;
  }
  for (const p of view.players)
    for (const e of p.exposures)
      for (const id of e.tiles) {
        const k = kindOfTile(id);
        if (k !== JOKER) visibleNaturals[k]++;
      }
  return { visibleNaturals, discardedJokers };
}

export function buildContext(card: Card, cfg: BotConfig, view: SeatView, ownExposures?: ExposureInfo[]): EvalContext {
  const exp = ownExposures ?? (view.players[view.seat] as SeatView['players'][number]).exposures.map(exposureInfoFromView);
  const prepared = prepareExposures(exp);
  const handCounts = countsOf(view.hand);
  const table = publicTableFromView(view);
  const unseen = new Array<number>(NUM_KINDS).fill(0);
  let exposedJokersAll = 0;
  for (const p of view.players) for (const e of p.exposures) for (const id of e.tiles) if (kindOfTile(id) === JOKER) exposedJokersAll++;
  let ownExposedJokers = 0;
  for (const e of exp) ownExposedJokers += e.jokers;
  for (let k = 0; k < NUM_KINDS; k++) {
    if (k === JOKER) unseen[k] = JOKER_COUNT - (handCounts[k] as number) - exposedJokersAll - table.discardedJokers;
    else unseen[k] = (SUPPLY[k] as number) - (handCounts[k] as number) - (table.visibleNaturals[k] as number);
  }
  return {
    card,
    cfg,
    exposures: prepared,
    ownExposedJokers,
    unseen,
    exposedJokersElsewhere: exposedJokersAll - ownExposedJokers,
    candidates: card.targets.filter((t) => exposuresFit(t, prepared)),
  };
}

/** A target's score for this hand (lower is better); Infinity when privately blocked. */
export function targetScore(t: Target, hand: ArrayLike<number>, ctx: EvalContext): number {
  const cfg = ctx.cfg;
  const sizeByKind = ctx.exposures.sizeByKind;
  let missPlain = 0;
  let missFlex = 0;
  let flexBeyondNaturals = 0;
  let liveOuts = 0;
  for (const k of t.kinds) {
    const plainK = t.plain[k] as number;
    const flexK = (t.flex[k] as number) - (sizeByKind[k] as number);
    const have = hand[k] as number;
    const usedPlain = have < plainK ? have : plainK;
    const mp = plainK - usedPlain;
    missPlain += mp;
    const spare = have - usedPlain;
    const mf = flexK > spare ? flexK - spare : 0;
    missFlex += mf;
    const live = ctx.unseen[k] as number;
    if (cfg.avoidBlocked) {
      if (mp > live) return Infinity;
      const naturalsLeft = live - mp;
      if (mf > naturalsLeft) flexBeyondNaturals += mf - naturalsLeft;
    }
    if (mp > 0 || mf > 0) liveOuts += live;
  }
  const jokers = hand[JOKER] as number;
  if (cfg.avoidBlocked && flexBeyondNaturals > jokers + (ctx.unseen[JOKER] as number) + ctx.exposedJokersElsewhere) return Infinity;
  const away = missPlain + (missFlex > jokers ? missFlex - jokers : 0);
  const deficit = Math.max(0, t.minJokers - jokers - ctx.ownExposedJokers);
  let score = away + cfg.plainWeight * missPlain + cfg.jokerDeficitWeight * deficit;
  if (cfg.liveOuts && away > 0) score += Math.max(0, 2 - liveOuts / Math.max(1, away)) * 0.5;
  return score;
}

export interface Position {
  value: number;
  /** Lowest score among targets (Infinity if none is reachable). */
  bestScore: number;
  /** Fewest tiles away among reachable targets. */
  bestAway: number;
  best: Target | null;
}

export function tilesAwayQuick(t: Target, hand: ArrayLike<number>, ctx: EvalContext): number {
  const sizeByKind = ctx.exposures.sizeByKind;
  let missPlain = 0;
  let missFlex = 0;
  for (const k of t.kinds) {
    const plainK = t.plain[k] as number;
    const flexK = (t.flex[k] as number) - (sizeByKind[k] as number);
    const have = hand[k] as number;
    const usedPlain = have < plainK ? have : plainK;
    missPlain += plainK - usedPlain;
    const spare = have - usedPlain;
    if (flexK > spare) missFlex += flexK - spare;
  }
  const jokers = hand[JOKER] as number;
  return missPlain + (missFlex > jokers ? missFlex - jokers : 0);
}

// Reused buffers for the K best scores (kept sorted), so evaluating a position allocates nothing.
const MAX_K = 64;
const topScore = new Float64Array(MAX_K);
const topIndex = new Int32Array(MAX_K);

export function evaluatePosition(hand: ArrayLike<number>, ctx: EvalContext): Position {
  const { cfg, candidates } = ctx;
  const K = Math.min(cfg.topK, MAX_K);
  let n = 0;
  for (let i = 0; i < candidates.length; i++) {
    const s = targetScore(candidates[i] as Target, hand, ctx);
    if (s === Infinity) continue;
    if (n === K && s >= (topScore[K - 1] as number)) continue;
    // insert in sorted position
    let j = n < K ? n++ : K - 1;
    while (j > 0 && (topScore[j - 1] as number) > s) {
      topScore[j] = topScore[j - 1] as number;
      topIndex[j] = topIndex[j - 1] as number;
      j--;
    }
    topScore[j] = s;
    topIndex[j] = i;
  }
  if (n === 0) return { value: 0, bestScore: Infinity, bestAway: Infinity, best: null };
  let value = 0;
  let bestAway = Infinity;
  for (let i = 0; i < n; i++) {
    const t = candidates[topIndex[i] as number] as Target;
    value += (1 + t.value / 100) * Math.pow(cfg.distanceBase, -(topScore[i] as number));
    const away = tilesAwayQuick(t, hand, ctx);
    if (away < bestAway) bestAway = away;
  }
  return { value, bestScore: topScore[0] as number, bestAway, best: candidates[topIndex[0] as number] as Target };
}
