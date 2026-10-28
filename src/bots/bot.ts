/**
 * A computer opponent. It sees only its seat view and answers with an action, exactly as the human does.
 * Its mistakes (at lower levels) are imperfect choices, never rule breaks: every action it returns is
 * legal, and the simulations check that the referee never rejects one.
 */

import { getCard, type Card, type Target } from '../engine/card';
import {
  completedTargets,
  exposureOptions,
  exposuresFit,
  mahjongTargetsWith,
  officialDeadReason,
  prepareExposures,
  publiclyPossible,
  type ExposureInfo,
} from '../engine/matcher';
import { Rng } from '../engine/rng';
import type { Action } from '../engine/state';
import { JOKER, NUM_KINDS, countsOf, kindOfTile, type Kind, type TileId } from '../engine/tiles';
import type { SeatView } from '../engine/view';
import { botConfig, type BotConfig } from './config';
import { buildContext, evaluatePosition, exposureInfoFromView, publicTableFromView, type EvalContext } from './evaluate';

export interface Bot {
  readonly config: BotConfig;
  decide(view: SeatView): Action;
}

export function createBot(config: BotConfig = botConfig(2), seed = 'bot'): Bot {
  return {
    config,
    decide(view: SeatView): Action {
      const rng = Rng.fromSeed(`${seed}:${view.actionCount}`);
      return decide(view, config, rng);
    },
  };
}

function decide(view: SeatView, cfg: BotConfig, rng: Rng): Action {
  const card = getCard(view.cardId);
  const p = view.phase;
  switch (p.name) {
    case 'heavenly':
      return cfg.neverDeclare ? { type: 'proceed' } : { type: 'declareMahjong' };
    case 'charleston':
      return charlestonPass(view, card, cfg, p.blindAllowed);
    case 'vote': {
      const pos = evaluatePosition(countsOf(view.hand), buildContext(card, cfg, view));
      // continue unless already close: nine new tiles is a lot (ClaysonIO's rule of thumb: stop only within 4)
      return { type: 'charlestonVote', continue: pos.bestAway >= 5 };
    }
    case 'courtesyOffer': {
      const pos = evaluatePosition(countsOf(view.hand), buildContext(card, cfg, view));
      const d = pos.bestAway;
      const count = d >= 6 ? 3 : d >= 4 ? 2 : d >= 3 ? 1 : 0;
      return { type: 'courtesyOffer', count };
    }
    case 'courtesyPass': {
      const n = p.agreed[view.seat] as number;
      return { type: 'courtesyPass', tiles: chooseTilesToGive(view, card, cfg, n).tiles };
    }
    case 'turn':
      return turnAction(view, card, cfg, rng);
    case 'callWindow':
      return callResponse(view, card, cfg);
    case 'ended':
      throw new Error('The game is over.');
  }
}

/** Tile ids for the chosen kinds, taken from the hand. */
function idsForKinds(hand: readonly TileId[], kinds: readonly Kind[]): TileId[] {
  const pool = [...hand];
  const out: TileId[] = [];
  for (const k of kinds) {
    const i = pool.findIndex((id) => kindOfTile(id) === k);
    if (i < 0) throw new Error('internal: kind not in hand');
    out.push(pool[i] as TileId);
    pool.splice(i, 1);
  }
  return out;
}

/** Pick n tiles to give away (never jokers), judging them against this rack's own candidate hands. */
function chooseTilesToGive(view: SeatView, card: Card, cfg: BotConfig, n: number): { tiles: TileId[]; losses: number[] } {
  const ctx = buildContext(card, cfg, view);
  const counts = countsOf(view.hand);
  const start = evaluatePosition(counts, ctx).value;
  if (cfg.charleston === 'exhaustive' && n === 3) return exhaustivePass(view, ctx, counts, start);
  const chosen: Kind[] = [];
  const losses: number[] = [];
  let current = start;
  for (let i = 0; i < n; i++) {
    let bestK = -1;
    let bestV = -Infinity;
    for (let k = 0; k < NUM_KINDS; k++) {
      if (k === JOKER || (counts[k] as number) === 0) continue;
      counts[k]--;
      const v = evaluatePosition(counts, ctx).value;
      counts[k]++;
      if (v > bestV) {
        bestV = v;
        bestK = k;
      }
    }
    counts[bestK]--;
    chosen.push(bestK);
    losses.push(current > 0 ? (current - bestV) / current : 0);
    current = bestV;
  }
  return { tiles: idsForKinds(view.hand, chosen), losses };
}

function exhaustivePass(view: SeatView, ctx: EvalContext, counts: number[], start: number): { tiles: TileId[]; losses: number[] } {
  const kinds: Kind[] = [];
  for (let k = 0; k < NUM_KINDS; k++) if (k !== JOKER) for (let i = 0; i < (counts[k] as number); i++) kinds.push(k);
  let best: Kind[] = [];
  let bestV = -Infinity;
  const seen = new Set<string>();
  for (let a = 0; a < kinds.length; a++)
    for (let b = a + 1; b < kinds.length; b++)
      for (let c = b + 1; c < kinds.length; c++) {
        const trio = [kinds[a], kinds[b], kinds[c]] as Kind[];
        const key = trio.join(',');
        if (seen.has(key)) continue;
        seen.add(key);
        for (const k of trio) counts[k]--;
        const v = evaluatePosition(counts, ctx).value;
        for (const k of trio) counts[k]++;
        if (v > bestV) {
          bestV = v;
          best = trio;
        }
      }
  const loss = start > 0 ? (start - bestV) / start : 0;
  return { tiles: idsForKinds(view.hand, best), losses: [loss / 3, loss / 3, loss / 3] };
}

function charlestonPass(view: SeatView, card: Card, cfg: BotConfig, blindAllowed: boolean): Action {
  const { tiles, losses } = chooseTilesToGive(view, card, cfg, 3);
  if (!blindAllowed) return { type: 'charlestonPass', tiles };
  // Blind pass: when some of the 3 least useful tiles still matter to this rack, forward incoming tiles unseen instead.
  const keep: TileId[] = [];
  let blind = 0;
  tiles.forEach((t, i) => {
    if ((losses[i] as number) > 0.12) blind++;
    else keep.push(t);
  });
  return blind > 0 ? { type: 'charlestonPass', tiles: keep, blind } : { type: 'charlestonPass', tiles };
}

/** Danger of discarding each kind: how often it is still needed by an opponent's exposed-hand candidates. */
function dangerByKind(view: SeatView, card: Card): number[] {
  const danger = new Array<number>(NUM_KINDS).fill(0);
  const table = publicTableFromView(view);
  for (const pl of view.players) {
    if (pl.seat === view.seat || pl.dead || pl.exposures.length < 2) continue;
    const exp = prepareExposures(pl.exposures.map(exposureInfoFromView));
    const cands = card.targets.filter((t) => exposuresFit(t, exp) && publiclyPossible(t, exp, table));
    if (cands.length === 0) continue;
    const weight = pl.exposures.length >= 3 ? 1 : 0.5;
    const need = new Array<number>(NUM_KINDS).fill(0);
    for (const t of cands)
      for (const k of t.kinds) {
        const remaining = (t.plain[k] as number) + (t.flex[k] as number) - (exp.sizeByKind[k] as number);
        if (remaining > 0) need[k]++;
      }
    for (let k = 0; k < NUM_KINDS; k++) danger[k] = Math.max(danger[k] as number, (weight * (need[k] as number)) / cands.length);
  }
  return danger;
}

function turnAction(view: SeatView, card: Card, cfg: BotConfig, rng: Rng): Action {
  const me = view.players[view.seat] as SeatView['players'][number];
  const ownExp = me.exposures.map(exposureInfoFromView);
  const counts = countsOf(view.hand);
  if (!cfg.neverDeclare && completedTargets(card, counts, ownExp).length > 0) return { type: 'declareMahjong' };
  const ctx = buildContext(card, cfg, view, ownExp);

  // Joker exchanges: take an exposed joker when giving up the real tile doesn't hurt this rack's hands.
  if (cfg.jokerExchanges !== 'never') {
    const base = evaluatePosition(counts, ctx).value;
    let bestSwap: Action | null = null;
    let bestGain = -Infinity;
    view.players.forEach((pl) =>
      pl.exposures.forEach((e, ei) => {
        if (!e.tiles.some((id) => kindOfTile(id) === JOKER) || (counts[e.kind] as number) === 0) return;
        counts[e.kind]--;
        counts[JOKER]++;
        const v = evaluatePosition(counts, ctx).value;
        counts[e.kind]++;
        counts[JOKER]--;
        if (v >= base && v - base > bestGain) {
          bestGain = v - base;
          const tile = view.hand.find((id) => kindOfTile(id) === e.kind) as TileId;
          bestSwap = { type: 'jokerExchange', tile, owner: pl.seat, exposure: ei };
        }
      }),
    );
    if (bestSwap) return bestSwap;
  }

  // Discard: the tile whose loss leaves the best position, minus a danger penalty that grows late in the wall.
  const danger = cfg.defense > 0 ? dangerByKind(view, card) : null;
  const now = evaluatePosition(counts, ctx);
  const wallLeft = view.wallCount;
  const hopeless = now.value === 0 || now.bestAway > wallLeft / 4 + 2;
  const lambda = hopeless ? 1 : cfg.defense * (1 - wallLeft / 99);
  const table = publicTableFromView(view);
  const options: { kind: Kind; util: number }[] = [];
  for (let k = 0; k < NUM_KINDS; k++) {
    if (k === JOKER || (counts[k] as number) === 0) continue;
    counts[k]--;
    const v = evaluatePosition(counts, ctx).value;
    counts[k]++;
    let util = v * (1 - lambda * (danger ? (danger[k] as number) : 0));
    if (hopeless) util = -(danger ? (danger[k] as number) : 0) + 0.01 * (table.visibleNaturals[k] as number);
    options.push({ kind: k, util });
  }
  if (options.length === 0) {
    // only jokers left in hand (cannot really happen with 14 tiles); a joker is always a legal discard
    return { type: 'discard', tile: view.hand[0] as TileId };
  }
  options.sort((a, b) => b.util - a.util || a.kind - b.kind);
  let pick = options[0] as { kind: Kind };
  if (cfg.noise > 0 && rng.chance(cfg.noise)) pick = rng.pick(options.slice(0, 4));
  return { type: 'discard', tile: view.hand.find((id) => kindOfTile(id) === pick.kind) as TileId };
}

function callResponse(view: SeatView, card: Card, cfg: BotConfig): Action {
  const p = view.phase as Extract<SeatView['phase'], { name: 'callWindow' }>;
  if (!p.eligible.includes(view.seat)) throw new Error('internal: not eligible');
  const kind = kindOfTile(p.tile);
  const me = view.players[view.seat] as SeatView['players'][number];
  const ownExp = me.exposures.map(exposureInfoFromView);
  const counts = countsOf(view.hand);
  if (!cfg.neverDeclare && mahjongTargetsWith(card, counts, ownExp, kind).length > 0) return { type: 'claimMahjong' };
  if (cfg.calls === 'never') return { type: 'pass' };
  if ((counts[kind] as number) + (counts[JOKER] as number) < 2) return { type: 'pass' };
  if (view.wallCount === 0 && view.rules.lastDiscard === 'mahjongOnly') return { type: 'pass' };
  const options = exposureOptions(card, counts, ownExp, kind).filter((o) => o.fitsCard);
  if (options.length === 0) return { type: 'pass' };

  const before = evaluatePosition(counts, buildContext(card, cfg, view, ownExp));
  const table = publicTableFromView(view);
  const margin = view.wallCount > 60 ? 0.25 : view.wallCount > 30 ? 0.1 : 0;
  let best: { tiles: TileId[]; value: number; away: number } | null = null;
  const seenSizes = new Set<number>();
  for (const o of options) {
    // use real tiles first and keep jokers hidden ("save jokers"): the first option per size has the most naturals
    if (seenSizes.has(o.size)) continue;
    seenSizes.add(o.size);
    const exp: ExposureInfo[] = [...ownExp, { kind, size: o.size, jokers: o.jokers }];
    // never make an exposure that would make this hand dead on public evidence
    const visible = Array.from(table.visibleNaturals);
    visible[kind] = (visible[kind] as number) + o.naturals;
    if (officialDeadReason(card, prepareExposures(exp), { visibleNaturals: visible, discardedJokers: table.discardedJokers })) continue;
    const after = counts.slice();
    after[kind] = (after[kind] as number) - o.naturals;
    after[JOKER] = (after[JOKER] as number) - o.jokers;
    const ctx = buildContext(card, cfg, view, exp);
    // after claiming, the bot must discard: judge the best resulting position
    let bestAfter = { value: 0, away: Infinity };
    for (let k = 0; k < NUM_KINDS; k++) {
      if (k === JOKER || (after[k] as number) === 0) continue;
      after[k]--;
      const pos = evaluatePosition(after, ctx);
      after[k]++;
      if (pos.value > bestAfter.value) bestAfter = { value: pos.value, away: pos.bestAway };
    }
    if (bestAfter.away < before.bestAway && bestAfter.away <= cfg.callMaxAway && bestAfter.value > before.value * (1 + margin)) {
      if (!best || bestAfter.value > best.value) {
        const naturals = view.hand.filter((id) => kindOfTile(id) === kind).slice(0, o.naturals);
        const jokers = view.hand.filter((id) => kindOfTile(id) === JOKER).slice(0, o.jokers);
        best = { tiles: [...naturals, ...jokers], value: bestAfter.value, away: bestAfter.away };
      }
    }
  }
  return best ? { type: 'claimExposure', tiles: best.tiles } : { type: 'pass' };
}

/** For logs and the post-game reveal: the bot's closest hand and how far it is. */
export function botIntent(view: SeatView, cfg: BotConfig = botConfig(2)): { target: Target | null; away: number } {
  const card = getCard(view.cardId);
  const pos = evaluatePosition(countsOf(view.hand), buildContext(card, cfg, view));
  return { target: pos.best, away: pos.bestAway };
}
