/**
 * The coach's suggestions for each decision, worked out from the player's own view with the same
 * evaluation the computer players use (src/bots/evaluate.ts), so the coach and the opponents agree on
 * what a tile is worth. Coach pitfalls other apps hit, avoided here (docs/07-app-spec.md section 8):
 * - never suggest giving up a tile a pinned hand needs (when anything else will do);
 * - judge the 3 Charleston tiles as a set, not one at a time;
 * - weigh every legal call (each size and joker count), not just the first;
 * - count tiles already dead on the table (lines that can't be finished drop out);
 * - give no tile advice on a decision that isn't about tiles (the stop vote);
 * - word hand advice as a suggestion; rules are stated as facts.
 * The weights below are starting values to tune, not rules. [M]
 */

import type { Card } from '../engine/card';
import { completedTargets, exposuresFit, prepareExposures, publiclyPossible, type ExposureInfo, type ExposureOption } from '../engine/matcher';
import { FLOWER, JOKER, NUM_KINDS, SOAP, isSuited, kindOfTile, numberOf, suitOf, type Kind, type TileId } from '../engine/tiles';
import type { SeatView } from '../engine/view';
import { botConfig, type BotConfig } from '../bots/config';
import { buildContext, evaluatePosition, exposureInfoFromView, publicTableFromView, type EvalContext } from '../bots/evaluate';
import { listTitles, needsKind, pinnedLines, protectedCopies, rankLines, readRack, titleOf, type CoachOptions, type LineInfo, type Rack } from './lines';
import { SIZE_NAME, article, plural, tileList, tileWord, tilesWord } from './words';

/** The coach judges like a careful player: no randomness, and it counts live tiles. */
export const COACH_CONFIG: BotConfig = botConfig(3, { name: 'Coach', noise: 0, defense: 0.5, topK: 12 });

/** A tile whose loss costs less than this share of the position's value is easy to give up. */
const EASY_LOSS = 0.08;
/** In a blind-pass round, a chosen tile worth more than this share is forwarded blind instead. */
const BLIND_KEEP = 0.12;

export function coachContext(rack: Rack, opts: CoachOptions, own?: ExposureInfo[]): EvalContext {
  const ctx = buildContext(rack.card, COACH_CONFIG, rack.view, own ?? rack.exposures);
  return opts.hideConcealed ? { ...ctx, candidates: ctx.candidates.filter((t) => !t.concealed) } : ctx;
}

function value(counts: ArrayLike<number>, ctx: EvalContext): number {
  return evaluatePosition(counts, ctx).value;
}

/** Tile ids for these kinds, taken from the hand (first copies first). */
export function idsFor(hand: readonly TileId[], kinds: readonly Kind[]): TileId[] {
  const pool = [...hand];
  const out: TileId[] = [];
  for (const k of kinds) {
    const i = pool.findIndex((id) => kindOfTile(id) === k);
    if (i < 0) continue;
    out.push(pool[i] as TileId);
    pool.splice(i, 1);
  }
  return out;
}

function liveLines(rack: Rack, opts: CoachOptions): LineInfo[] {
  return rankLines(rack, opts).filter((l) => !l.blocked);
}

// --- Charleston and courtesy passes -------------------------------------------------------------------

/** Every way to choose n tiles (by kind) from these counts, jokers never included. */
function multisets(counts: readonly number[], n: number): Kind[][] {
  const kinds: Kind[] = [];
  for (let k = 0; k < NUM_KINDS; k++) if (k !== JOKER && (counts[k] as number) > 0) kinds.push(k);
  const out: Kind[][] = [];
  const cur: Kind[] = [];
  const used = new Array<number>(NUM_KINDS).fill(0);
  const rec = (start: number) => {
    if (cur.length === n) {
      out.push([...cur]);
      return;
    }
    for (let i = start; i < kinds.length; i++) {
      const k = kinds[i] as Kind;
      if ((used[k] as number) >= (counts[k] as number)) continue;
      used[k]++;
      cur.push(k);
      rec(i);
      cur.pop();
      used[k]--;
    }
  };
  rec(0);
  return out;
}

/**
 * General Charleston wisdom on top of the hand-by-hand value (docs/04-strategy.md section 2.2): keep pairs,
 * flowers and Soaps, and don't hand one player a ready-made pair or two related tiles.
 */
function passPenalty(counts: readonly number[], kinds: readonly Kind[]): number {
  let p = 0;
  const taken = new Map<Kind, number>();
  for (const k of kinds) taken.set(k, (taken.get(k) ?? 0) + 1);
  for (const [k, t] of taken) {
    if (k === FLOWER) p += 0.05 * t;
    else if (k === SOAP) p += 0.02 * t;
    if ((counts[k] as number) >= 2) p += 0.04 * t;
    if (t >= 2) p += 0.03;
  }
  const suited = kinds.filter(isSuited);
  for (let i = 0; i < suited.length; i++)
    for (let j = i + 1; j < suited.length; j++) {
      const a = suited[i] as Kind;
      const b = suited[j] as Kind;
      if (a !== b && suitOf(a) === suitOf(b) && Math.abs(numberOf(a) - numberOf(b)) <= 2) p += 0.01;
    }
  return p;
}

function touchesKeep(counts: readonly number[], kinds: readonly Kind[], keep: readonly number[]): boolean {
  const taken = new Map<Kind, number>();
  for (const k of kinds) taken.set(k, (taken.get(k) ?? 0) + 1);
  for (const [k, t] of taken) if ((counts[k] as number) - t < (keep[k] as number)) return true;
  return false;
}

interface PassSearch {
  best: Kind[];
  bestScore: number;
  /** Lower is better: share of value lost plus the strategy penalties. */
  score(kinds: readonly Kind[]): number;
  marginal(set: readonly Kind[], k: Kind): number;
}

function searchPass(rack: Rack, ctx: EvalContext, n: number, keep: readonly number[]): PassSearch {
  const counts = rack.counts;
  const v0 = value(counts, ctx);
  const work = counts.slice();
  const valueWithout = (kinds: readonly Kind[]) => {
    for (const k of kinds) work[k]--;
    const v = value(work, ctx);
    for (const k of kinds) work[k]++;
    return v;
  };
  const score = (kinds: readonly Kind[]) => (v0 > 0 ? (v0 - valueWithout(kinds)) / v0 : 0) + passPenalty(counts, kinds);
  let best: Kind[] = [];
  let bestScore = Infinity;
  let free: Kind[] | null = null;
  let freeScore = Infinity;
  for (const combo of multisets(counts, n)) {
    const s = score(combo);
    if (s < bestScore) {
      best = combo;
      bestScore = s;
    }
    if (s < freeScore && !touchesKeep(counts, combo, keep)) {
      free = combo;
      freeScore = s;
    }
  }
  const marginal = (set: readonly Kind[], k: Kind) => {
    if (v0 <= 0) return 0;
    const i = set.indexOf(k);
    const rest = [...set.slice(0, i), ...set.slice(i + 1)];
    return (valueWithout(rest) - valueWithout(set)) / v0;
  };
  return free ? { best: free, bestScore: freeScore, score, marginal } : { best, bestScore, score, marginal };
}

export interface PassAdvice {
  /** Tiles from the rack to pass (3 minus the blind count). */
  tiles: TileId[];
  /** Incoming tiles to forward unseen: 0 unless a blind pass is allowed and helps. */
  blind: number;
  /** "Suggestion: pass 9 Dot, North wind and 4 Crak." */
  text: string;
  why: string;
  /** A strategy tip about something worth keeping, or null. */
  tip: string | null;
}

/** The best n tiles to give away, judged together as a set. With blindAllowed, may suggest a blind pass. */
export function suggestPass(view: SeatView, opts: CoachOptions, n: number, blindAllowed: boolean): PassAdvice {
  const rack = readRack(view);
  const ctx = coachContext(rack, opts);
  const keep = protectedCopies(rack, pinnedLines(rack, opts));
  const search = searchPass(rack, ctx, n, keep);
  let kinds = search.best;
  let blind = 0;
  if (blindAllowed && n === 3) {
    const keepers = kinds.filter((k) => search.marginal(search.best, k) > BLIND_KEEP);
    if (keepers.length > 0) {
      blind = keepers.length;
      const rest = [...kinds];
      for (const k of keepers) rest.splice(rest.indexOf(k), 1);
      kinds = rest;
    }
  }
  const lines = liveLines(rack, opts).slice(0, 2);
  const pins = pinnedLines(rack, opts);
  const usedByLines = kinds.some((k) => lines.some((l) => needsKind(l.target, rack, k)));
  let why: string;
  if (kinds.length === 0) why = 'Every tile on your rack helps one of your closest hands.';
  else if (pins.length > 0 && !kinds.some((k) => pins.some((p) => needsKind(p.target, rack, k))))
    why = `Your pinned hand, ${listTitles(pins)}, doesn't use ${kinds.length === 1 ? 'it' : 'them'}.`;
  else if (lines.length > 0 && !usedByLines) why = `None of your closest hands (${listTitles(lines)}) uses ${kinds.length === 1 ? 'it' : 'them'}.`;
  else why = `${kinds.length === 1 ? 'It fits' : 'They fit'} your closest hands least.`;
  let text: string;
  if (blind === 0) text = `Suggestion: pass ${tileList(kinds)}.`;
  else if (kinds.length === 0) text = 'Suggestion: pass all 3 blind, forwarding the tiles coming to you without looking.';
  else text = `Suggestion: pass ${tileList(kinds)} and ${blind} blind (forward ${blind === 1 ? 'one of the tiles' : `${blind} of the tiles`} coming to you, unseen).`;
  if (blind > 0) why = `Only ${plural(3 - blind, 'tile')} on your rack ${3 - blind === 1 ? 'is' : 'are'} easy to give up, so a blind pass keeps the rest.`;
  return { tiles: idsFor(view.hand, kinds), blind, text, why, tip: keepTip(rack, kinds) };
}

function keepTip(rack: Rack, passed: readonly Kind[]): string | null {
  for (let k = 0; k < NUM_KINDS; k++) {
    if (k === JOKER || k === FLOWER) continue;
    if ((rack.counts[k] as number) >= 2 && !passed.includes(k))
      return `Keeping your pair of ${tilesWord(k)}: pairs are the hard part, since jokers can't fill them.`;
  }
  if ((rack.counts[FLOWER] as number) > 0 && !passed.includes(FLOWER)) return 'Keeping your flowers: many hands on the card use them.';
  return null;
}

/** How much worse the player's own pass is than the coach's, as a share of the hand's value (0 = as good). */
export function passLoss(view: SeatView, opts: CoachOptions, tiles: readonly TileId[]): number {
  if (tiles.length === 0) return 0;
  const rack = readRack(view);
  const ctx = coachContext(rack, opts);
  const keep = protectedCopies(rack, pinnedLines(rack, opts));
  const search = searchPass(rack, ctx, tiles.length, keep);
  return Math.max(0, search.score(tiles.map(kindOfTile)) - search.bestScore);
}

/** The raw score of passing these kinds (share of value lost plus strategy penalties; lower is better). */
export function passScore(view: SeatView, opts: CoachOptions, kinds: readonly Kind[]): number {
  const rack = readRack(view);
  return searchPass(rack, coachContext(rack, opts), 0, []).score(kinds);
}

/** Kinds on the rack that are easy to give up (each one alone costs the hand little). */
function easyTiles(rack: Rack, ctx: EvalContext): Kind[] {
  const v0 = value(rack.counts, ctx);
  const out: Kind[] = [];
  const work = rack.counts.slice();
  for (let k = 0; k < NUM_KINDS; k++) {
    if (k === JOKER || (work[k] as number) === 0) continue;
    work[k]--;
    const loss = v0 > 0 ? (v0 - value(work, ctx)) / v0 : 0;
    work[k]++;
    if (loss < EASY_LOSS) out.push(k);
  }
  return out;
}

export interface ChoiceAdvice<T> {
  choice: T;
  text: string;
  why: string;
}

/**
 * The stop vote is not a tile decision, so no tiles are named (a coach pitfall). Continuing is the usual
 * advice: nine new tiles is a lot, and sources differ on exactly when to stop. [M]
 */
export function adviseVote(view: SeatView, opts: CoachOptions): ChoiceAdvice<boolean> {
  const rack = readRack(view);
  const ctx = coachContext(rack, opts);
  const easy = easyTiles(rack, ctx).length;
  const best = liveLines(rack, opts)[0];
  if (easy >= 3) return { choice: true, text: 'Suggestion: keep going.', why: 'You still have at least 3 tiles you can easily spare, and the second Charleston can bring up to 9 new tiles.' };
  if (best && best.away <= 4)
    return { choice: false, text: 'Suggestion: stop.', why: `Your hand is already close (${plural(best.away, 'tile')} away from ${best.title}), and you have few tiles left to spare.` };
  return { choice: true, text: 'Suggestion: keep going.', why: best ? `Your closest hand is still ${plural(best.away, 'tile')} away, so new tiles can help.` : 'New tiles can help a hand that has no clear direction yet.' };
}

/** How many tiles to offer the player across in the courtesy pass. [M] */
export function adviseCourtesy(view: SeatView, opts: CoachOptions, acrossStopped: boolean): ChoiceAdvice<number> {
  if (acrossStopped)
    return { choice: 0, text: 'Suggestion: offer 0.', why: 'The player across stopped the Charleston, so they may be close to Mah Jongg, and many players skip the trade then.' };
  const rack = readRack(view);
  const easy = Math.min(3, easyTiles(rack, coachContext(rack, opts)).length);
  if (easy === 0) return { choice: 0, text: 'Suggestion: offer 0.', why: 'Every tile on your rack helps one of your closest hands.' };
  return { choice: easy, text: `Suggestion: offer ${easy}.`, why: `You have ${plural(easy, 'tile')} you can easily spare.` };
}

// --- Your turn ------------------------------------------------------------------------------------------

export interface Threat {
  seat: number;
  wind: string;
  exposures: number;
  /** For each kind: the share of this player's still-possible hands that need more of it. */
  need: number[];
}

/** Opponents with 2 or more exposures, and what their exposures suggest they still need (public evidence). */
export function threats(view: SeatView, card: Card): Threat[] {
  const table = publicTableFromView(view);
  const out: Threat[] = [];
  for (const pl of view.players) {
    if (pl.seat === view.seat || pl.dead || pl.exposures.length < 2) continue;
    const exp = prepareExposures(pl.exposures.map(exposureInfoFromView));
    const cands = card.targets.filter((t) => exposuresFit(t, exp) && publiclyPossible(t, exp, table));
    if (cands.length === 0) continue;
    const need = new Array<number>(NUM_KINDS).fill(0);
    for (const t of cands)
      for (const k of t.kinds) if ((t.plain[k] as number) + (t.flex[k] as number) - (exp.sizeByKind[k] as number) > 0) need[k]++;
    for (let k = 0; k < NUM_KINDS; k++) need[k] = (need[k] as number) / cands.length;
    out.push({ seat: pl.seat, wind: pl.wind, exposures: pl.exposures.length, need });
  }
  return out;
}

function dangerOf(ts: readonly Threat[], k: Kind): number {
  let d = 0;
  for (const t of ts) d = Math.max(d, (t.exposures >= 3 ? 1 : 0.5) * (t.need[k] as number));
  return d;
}

/**
 * A warning before feeding a player who has 2 or 3 exposures: "discard to a second exposure at great risk
 * and never discard to a third exposure" (Linda Fisher, via Sloper; docs/04-strategy.md section 2.6). [H]
 */
export function feedingWarning(view: SeatView, card: Card, k: Kind): string | null {
  if (k === JOKER) return null;
  let worst: Threat | null = null;
  for (const t of threats(view, card)) {
    const limit = t.exposures >= 3 ? 0.34 : 0.6;
    if ((t.need[k] as number) >= limit && (!worst || t.exposures > worst.exposures)) worst = t;
  }
  if (!worst) return null;
  const tile = tileWord(k);
  const share = (worst.need[k] as number) >= 0.75 ? 'most' : 'many';
  return worst.exposures >= 3
    ? `Careful: ${worst.wind} has ${worst.exposures} exposures and may be close to Mah Jongg, and ${share} hands that fit them still use ${article(tile)} ${tile}.`
    : `Careful: ${worst.wind} has 2 exposures, and ${share} hands that fit them still use ${article(tile)} ${tile}.`;
}

interface DiscardScore {
  kind: Kind;
  util: number;
}

interface DiscardSearch {
  scores: DiscardScore[];
  pick: Kind | null;
  hopeless: boolean;
  bestAway: number;
  keep: number[];
  pins: LineInfo[];
  lines: LineInfo[];
}

function searchDiscard(view: SeatView, opts: CoachOptions): DiscardSearch {
  const rack = readRack(view);
  const ctx = coachContext(rack, opts);
  const pins = pinnedLines(rack, opts);
  const keep = protectedCopies(rack, pins);
  const lines = liveLines(rack, opts);
  const bestAway = lines[0]?.away ?? Infinity;
  const wall = view.wallCount;
  const hopeless = bestAway === Infinity || bestAway > wall / 4 + 2;
  const ts = threats(view, rack.card);
  const lambda = Math.max(0, Math.min(0.6, 0.6 * (1 - wall / 99)));
  const work = rack.counts.slice();
  const scores: DiscardScore[] = [];
  for (let k = 0; k < NUM_KINDS; k++) {
    if (k === JOKER || (work[k] as number) === 0) continue;
    const danger = dangerOf(ts, k);
    let util: number;
    if (hopeless) util = -danger + 0.01 * (rack.visible[k] as number);
    else {
      work[k]--;
      util = value(work, ctx) * (1 - lambda * danger);
      work[k]++;
    }
    scores.push({ kind: k, util });
  }
  scores.sort((a, b) => b.util - a.util || a.kind - b.kind);
  const free = scores.find((s) => (rack.counts[s.kind] as number) > (keep[s.kind] as number));
  const pick = (free ?? scores[0])?.kind ?? null;
  return { scores, pick, hopeless, bestAway, keep, pins, lines };
}

export interface DiscardAdvice {
  tile: TileId;
  kind: Kind;
  text: string;
  why: string;
  /** A feeding warning for the suggested tile itself, when even the safest choice carries risk. */
  warning: string | null;
}

/** The coach's discard (never a joker), or null when the hand has no other tile to discard. */
export function suggestDiscard(view: SeatView, opts: CoachOptions): DiscardAdvice | null {
  const s = searchDiscard(view, opts);
  if (s.pick === null) return null;
  const k = s.pick;
  const rack = readRack(view);
  const tile = tileWord(k);
  let why: string;
  if (s.hopeless) {
    const shown = rack.visible[k] as number;
    why =
      s.bestAway === Infinity
        ? `None of your hands can still be finished, so play safe${shown > 0 ? `: ${plural(shown, 'copy', 'copies')} of it ${shown === 1 ? 'is' : 'are'} already showing` : ''}.`
        : `Your closest hand is ${plural(s.bestAway, 'tile')} away with ${view.wallCount} left in the wall, so play safe${shown > 0 ? `: ${plural(shown, 'copy', 'copies')} ${shown === 1 ? 'is' : 'are'} already showing` : ''}.`;
  } else if (s.pins.length > 0 && !s.pins.some((p) => needsKind(p.target, rack, k))) {
    why = `Your pinned hand, ${listTitles(s.pins)}, doesn't use it.`;
  } else {
    const top = s.lines.slice(0, 2);
    why = top.length > 0 && !top.some((l) => needsKind(l.target, rack, k)) ? `None of your closest hands (${listTitles(top)}) uses it.` : 'Of all your tiles, it helps your closest hands least.';
  }
  const tileId = view.hand.find((id) => kindOfTile(id) === k) as TileId;
  return { tile: tileId, kind: k, text: `Suggestion: discard the ${tile}.`, why, warning: feedingWarning(view, rack.card, k) };
}

/** How much worse discarding this kind is than the coach's choice (0 = as good or better). */
export function discardLoss(view: SeatView, opts: CoachOptions, k: Kind): number {
  const s = searchDiscard(view, opts);
  const best = s.scores.find((x) => x.kind === s.pick);
  const mine = s.scores.find((x) => x.kind === k);
  if (!best || !mine || best.util <= 0) return 0;
  return Math.max(0, (best.util - mine.util) / Math.abs(best.util));
}

/** Pinned lines that use every copy held of this kind (discarding one would set them back). */
export function pinnedNeeding(view: SeatView, opts: CoachOptions, k: Kind): LineInfo[] {
  const rack = readRack(view);
  return pinnedLines(rack, opts).filter((p) => needsKind(p.target, rack, k));
}

/** The best hand these tiles complete right now, or null. */
export function mahjongNow(view: SeatView): string | null {
  const rack = readRack(view);
  const t = completedTargets(rack.card, rack.counts, rack.exposures)[0];
  return t ? titleOf(rack.card, t.handId) : null;
}

export interface ExchangeAdvice {
  owner: number;
  exposure: number;
  tile: TileId;
  kind: Kind;
  completes: boolean;
  recommended: boolean;
  text: string;
}

function whoseGroup(view: SeatView, owner: number, exposure: number): string {
  const e = (view.players[owner] as SeatView['players'][number]).exposures[exposure];
  const whose = owner === view.seat ? 'your' : `${(view.players[owner] as SeatView['players'][number]).wind}'s`;
  return e ? `${whose} ${SIZE_NAME[e.tiles.length] ?? 'group'} of ${tilesWord(e.kind)}` : `${whose} exposure`;
}

/**
 * Exposed jokers this player could take by exchange (on their own turn, holding 14 tiles), best first.
 * Taking one is usually right when the real tile isn't needed, since a joker fits any pung or kong and it
 * denies the joker to others (Fisher, via Sloper; docs/04-strategy.md section 2.3). [H]
 */
export function adviseExchanges(view: SeatView, opts: CoachOptions): ExchangeAdvice[] {
  const rack = readRack(view);
  const ctx = coachContext(rack, opts);
  const keep = protectedCopies(rack, pinnedLines(rack, opts));
  const v0 = value(rack.counts, ctx);
  const out: (ExchangeAdvice & { gain: number })[] = [];
  view.players.forEach((pl) =>
    pl.exposures.forEach((e, ei) => {
      if (!e.tiles.some((id) => kindOfTile(id) === JOKER)) return;
      const k = e.kind;
      if ((rack.counts[k] as number) === 0) return;
      const after = rack.counts.slice();
      after[k]--;
      after[JOKER]++;
      const ownAfter = pl.seat === view.seat ? rack.exposures.map((x, i) => (i === ei ? { ...x, jokers: x.jokers - 1 } : x)) : rack.exposures;
      const completes = completedTargets(rack.card, after, ownAfter).length > 0;
      const v1 = value(after, ctx);
      const needed = (rack.counts[k] as number) <= (keep[k] as number);
      const recommended = completes || (!needed && v1 >= v0 * 0.97);
      const tile = tileWord(k);
      const group = whoseGroup(view, pl.seat, ei);
      const title = completes ? titleOf(rack.card, (completedTargets(rack.card, after, ownAfter)[0] as { handId: string }).handId) : '';
      const text = completes
        ? `Trade your ${tile} for the joker in ${group}: that completes ${title}, so you can then declare Mah Jongg.`
        : recommended
          ? `Suggestion: trade your ${tile} for the joker in ${group}. A joker can fill any pung or kong, and your hand can spare the ${tile}.`
          : `You could trade your ${tile} for the joker in ${group}, but your ${needed ? 'pinned hand' : 'hand'} needs that ${tile}.`;
      const tileId = view.hand.find((id) => kindOfTile(id) === k) as TileId;
      out.push({ owner: pl.seat, exposure: ei, tile: tileId, kind: k, completes, recommended, text, gain: v1 - v0 });
    }),
  );
  out.sort((a, b) => Number(b.completes) - Number(a.completes) || Number(b.recommended) - Number(a.recommended) || b.gain - a.gain);
  return out.map(({ gain: _gain, ...rest }) => rest);
}

// --- After someone else's discard ------------------------------------------------------------------------

export interface CallOptionView {
  size: number;
  jokers: number;
  naturals: number;
  awayAfter: number;
  value: number;
  fitsPinned: boolean;
}

export interface CallAdvice {
  verdict: 'mahjong' | 'call' | 'pass';
  size: number | null;
  jokers: number | null;
  text: string;
  why: string;
  awayBefore: number;
  options: CallOptionView[];
}

/**
 * Whether to call the latest discard, weighing every legal option. `legal` comes from the referee
 * (callOptions in src/engine/engine.ts), so the coach never suggests a call the rules or Safety refuse.
 */
export function adviseCall(view: SeatView, opts: CoachOptions, legal: { mahjong: boolean; exposures: readonly ExposureOption[] }): CallAdvice | null {
  const p = view.phase;
  if (p.name !== 'callWindow') return null;
  const kind = kindOfTile(p.tile);
  const tile = tileWord(kind);
  const rack = readRack(view);
  if (legal.mahjong) {
    const plus = rack.counts.slice();
    plus[kind]++;
    const t = completedTargets(rack.card, plus, rack.exposures)[0];
    return {
      verdict: 'mahjong',
      size: null,
      jokers: null,
      text: 'Call Mah Jongg!',
      why: `That ${tile} completes ${t ? titleOf(rack.card, t.handId) : 'a hand on the card'}.`,
      awayBefore: 1,
      options: [],
    };
  }
  const ctx = coachContext(rack, opts);
  const before = evaluatePosition(rack.counts, ctx);
  const pins = pinnedLines(rack, opts);
  const pinIdx = opts.pinned.map((id) => rack.card.hands.findIndex((h) => h.id === id)).filter((i) => i >= 0);
  const options: CallOptionView[] = [];
  for (const o of legal.exposures) {
    if (!o.fitsCard) continue;
    const exp: ExposureInfo[] = [...rack.exposures, { kind, size: o.size, jokers: o.jokers }];
    const prepared = prepareExposures(exp);
    const after = rack.counts.slice();
    after[kind] = (after[kind] as number) - o.naturals;
    after[JOKER] = (after[JOKER] as number) - o.jokers;
    const ctx2 = coachContext(rack, opts, exp);
    let best = { value: 0, away: Infinity };
    for (let k = 0; k < NUM_KINDS; k++) {
      if (k === JOKER || (after[k] as number) === 0) continue;
      after[k]--;
      const pos = evaluatePosition(after, ctx2);
      after[k]++;
      if (pos.value > best.value || (pos.value === best.value && pos.bestAway < best.away)) best = { value: pos.value, away: pos.bestAway };
    }
    const fitsPinned = pinIdx.some((i) => (rack.card.targetsByHand[i] ?? []).some((t) => !t.concealed && exposuresFit(t, prepared)));
    options.push({ size: o.size, jokers: o.jokers, naturals: o.naturals, awayAfter: best.away, value: best.value * (1 - 0.04 * o.jokers), fitsPinned });
  }
  const pass = (why: string): CallAdvice => ({ verdict: 'pass', size: null, jokers: null, text: 'Suggestion: pass.', why, awayBefore: before.bestAway, options });
  if (options.length === 0) return pass(`You can't use the ${tile} in an exposure that fits the card.`);
  const concealedPin = pins.find((x) => x.concealed);
  if (concealedPin) return pass(`Your pinned hand, ${concealedPin.title}, is concealed, and a concealed hand can't expose anything before Mah Jongg.`);
  const usable = pins.length > 0 ? options.filter((o) => o.fitsPinned) : options;
  if (usable.length === 0) return pass(`Calling it would lock in an exposure your pinned hand, ${listTitles(pins)}, can't use.`);
  const margin = view.wallCount > 60 ? 0.25 : view.wallCount > 30 ? 0.1 : 0;
  const wise = usable.filter((o) => o.awayAfter < before.bestAway && o.value > before.value * (1 + margin));
  if (wise.length === 0) {
    const closer = usable.some((o) => o.awayAfter < before.bestAway);
    if (!closer) return pass("Calling it wouldn't bring your hand any closer.");
    const b = Math.min(...usable.map((o) => o.awayAfter));
    return pass(`Calling would bring you only from ${before.bestAway} to ${b} tiles away, and an exposure shows the table what you're collecting${view.wallCount > 60 ? ' this early' : ''}.`);
  }
  wise.sort((a, b) => b.value - a.value || a.jokers - b.jokers);
  const o = wise[0] as CallOptionView;
  const name = SIZE_NAME[o.size] as string;
  return {
    verdict: 'call',
    size: o.size,
    jokers: o.jokers,
    text: `Suggestion: call it for ${article(name)} ${name}${o.jokers ? ` using ${plural(o.jokers, 'joker')}` : ''}.`,
    why: `That brings your hand from ${before.bestAway} to ${o.awayAfter} tiles away.`,
    awayBefore: before.bestAway,
    options,
  };
}
