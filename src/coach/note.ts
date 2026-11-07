/**
 * One coach note for the decision in front of the player: the suggestion, why, the tiles involved, the
 * screen button it amounts to, and four hint tiers (docs/05-teaching-plan.md section 7): a nudge, then
 * the section, then the specific line, then the answer.
 */

import { analyze, type ExposureOption } from '../engine/matcher';
import { JOKER, NUM_KINDS, kindOfTile, type Kind, type TileId } from '../engine/tiles';
import type { SeatView } from '../engine/view';
import { adviseCall, adviseCourtesy, adviseExchanges, adviseVote, feedingWarning, mahjongNow, suggestDiscard, suggestPass } from './advice';
import { closestSections, needsKind, pinnedLines, rankLines, readRack, type CoachOptions, type LineInfo, type Rack } from './lines';
import { plural, tileWord, tilesWord } from './words';

export type Topic = 'heavenly' | 'pass' | 'vote' | 'courtesyOffer' | 'courtesyPass' | 'turn' | 'call';

export interface CoachNote {
  topic: Topic;
  /** The suggestion, worded as one ("Suggestion: discard the North wind."). */
  text: string;
  /** Why, in a sentence. */
  why: string;
  /** A strategy tip or a warning, or null. */
  extra: string | null;
  /** Tiles to select on the rack (passes, discards) or the tile to trade (joker exchange). */
  tiles: TileId[];
  /** Incoming tiles to forward blind, for a suggested Charleston pass. */
  blind: number;
  /** The key of the screen button this suggestion amounts to (see src/ui/moves.ts). */
  choiceKey: string | null;
  /** Hint tiers: a nudge, the section, the specific line, then the answer. */
  tiers: [string, string, string, string];
}

export interface NoteContext {
  /** The referee's legal calls for the player (engine callOptions), during a call window. */
  legalCalls?: { mahjong: boolean; exposures: ExposureOption[] };
  /** The player across stopped the Charleston (it may mean they are close). */
  acrossStopped?: boolean;
}

/** "two more 5 Dots, a 9 Dot and a Flower": what a line's closest version still needs (at most 3 kinds). */
export function stillNeeds(rack: Rack, line: LineInfo): string {
  const a = analyze(line.target, rack.counts, rack.prepared);
  if (!a) return '';
  const jokers = rack.counts[JOKER] as number;
  const parts: string[] = [];
  let flexShort = Math.max(0, a.missingFlexTotal - jokers);
  for (let k = 0; k < NUM_KINDS && parts.length < 3; k++) {
    if (k === JOKER) continue;
    let n = a.missingPlain[k] as number;
    const f = a.missingFlex[k] as number;
    if (f > 0 && flexShort > 0) {
      const take = Math.min(f, flexShort);
      n += take;
      flexShort -= take;
    }
    if (n === 0) continue;
    parts.push(n === 1 ? `a ${tileWord(k as Kind)}` : `${n} more ${tilesWord(k as Kind)}`);
  }
  if (parts.length <= 1) return parts[0] ?? '';
  return `${parts.slice(0, -1).join(', ')} and ${parts[parts.length - 1]}`;
}

function familyTier(lines: LineInfo[]): string {
  const s = closestSections(lines).slice(0, 2);
  if (s.length === 0) return "None of the card's sections looks reachable right now, so think about safety.";
  return s.length === 1 ? `Your tiles point toward ${s[0]}.` : `Your tiles point toward ${s[0]}, with ${s[1]} as a backup.`;
}

function lineTier(rack: Rack, lines: LineInfo[], pins: LineInfo[]): string {
  const l = pins[0] ?? lines.find((x) => !x.blocked);
  if (!l) return 'Every line still needs tiles that are already used up on the table.';
  const needs = stillNeeds(rack, l);
  if (l.away === 0) return `${l.title} is complete.`;
  return `${l.title} is ${plural(l.away, 'tile')} away${needs ? `: it still needs ${needs}` : ''}${(rack.counts[JOKER] as number) > 0 ? ' (jokers can fill its pungs and kongs)' : ''}.`;
}

function tiersFor(rack: Rack, opts: CoachOptions, nudge: string, answer: string): [string, string, string, string] {
  const lines = rankLines(rack, opts);
  const pins = pinnedLines(rack, opts);
  return [nudge, familyTier(lines), lineTier(rack, lines, pins), answer];
}

const PASS_NUDGE = 'Pass what fits your possible hands least, and hold on to pairs, flowers and Soaps.';

/** The coach note for the player's pending decision, or null when nothing is waiting for them. */
export function coachNote(view: SeatView, opts: CoachOptions, ctx: NoteContext = {}): CoachNote | null {
  if (!view.pending) return null;
  const rack = readRack(view);
  const p = view.phase;
  const note = (topic: Topic, text: string, why: string, nudge: string, extra: string | null = null, tiles: TileId[] = [], choiceKey: string | null = null, blind = 0): CoachNote => ({
    topic,
    text,
    why,
    extra,
    tiles,
    blind,
    choiceKey,
    tiers: tiersFor(rack, opts, nudge, why ? `${text} ${why}` : text),
  });
  switch (p.name) {
    case 'charleston': {
      if (p.pass === 0 && view.seat === view.dealer) {
        const title = mahjongNow(view);
        if (title) return note('heavenly', 'Declare Mah Jongg!', `Your 14 dealt tiles already make ${title} (a Heavenly Hand).`, 'Check whether your tiles already match a line on the card.', null, [], 'heavenly');
      }
      const a = suggestPass(view, opts, 3, p.blindAllowed);
      return note('pass', a.text, a.why, PASS_NUDGE, a.tip, a.tiles, 'pass-tiles', a.blind);
    }
    case 'vote': {
      const a = adviseVote(view, opts);
      return note('vote', a.text, a.why, 'Count how many tiles you could easily give up: the second Charleston brings up to 9 new tiles.', null, [], a.choice ? 'vote-yes' : 'vote-no');
    }
    case 'courtesyOffer': {
      const a = adviseCourtesy(view, opts, ctx.acrossStopped ?? false);
      return note('courtesyOffer', a.text, a.why, 'Offer only as many tiles as you can easily spare.', null, [], `offer-${a.choice}`);
    }
    case 'courtesyPass': {
      const n = p.agreed[view.seat] as number;
      const a = suggestPass(view, opts, n, false);
      return note('courtesyPass', a.text, a.why, PASS_NUDGE, a.tip, a.tiles, 'courtesy-pass');
    }
    case 'turn': {
      const title = mahjongNow(view);
      if (title) return note('turn', 'You have Mah Jongg, so tap Mah Jongg.', `Your tiles complete ${title}.`, 'Check whether your tiles already match a line on the card.', null, [], 'mahjong');
      const ex = adviseExchanges(view, opts).find((e) => e.recommended);
      if (ex) return note('turn', ex.text, '', 'Before you discard, check every exposure for a joker you could take.', null, [ex.tile], `exchange-${ex.owner}-${ex.exposure}`);
      const d = suggestDiscard(view, opts);
      if (!d) return null;
      const nudge =
        opts.pinned.length > 0
          ? "Keep the tiles your pinned hand uses, and let go of one it doesn't."
          : "Look for a tile none of your likely hands uses. Pairs are hard to replace, so they're usually worth keeping.";
      return note('turn', d.text, d.why, nudge, d.warning, [d.tile], 'discard');
    }
    case 'callWindow': {
      const legal = ctx.legalCalls ?? { mahjong: false, exposures: [] };
      const a = adviseCall(view, opts, legal);
      if (!a) return null;
      const key = a.verdict === 'mahjong' ? 'mahjong' : a.verdict === 'call' ? `expose-${a.size}-${a.jokers}` : 'pass';
      return note('call', a.text, a.why, 'Ask two things: does this tile complete a pung or kong your hand uses, and is it worth showing your hand now?', null, [], key);
    }
    case 'ended':
      return null;
  }
}

/** A one-line note on the player's own pending choice (match 1's immediate strategy feedback), or null. */
export function choiceFeedback(view: SeatView, opts: CoachOptions, selected: readonly TileId[]): string | null {
  const p = view.phase;
  if (!view.pending || selected.length === 0) return null;
  const rack = readRack(view);
  const pins = pinnedLines(rack, opts);
  for (const t of selected) {
    if (!view.hand.includes(t)) continue;
    const k = kindOfTile(t);
    if (k === JOKER) continue;
    const pin = pins.find((l) => needsKind(l.target, rack, k));
    if (pin) return `Your pinned hand, ${pin.title}, uses that ${tileWord(k)}.`;
    if ((rack.counts[k] as number) >= 2 && (p.name === 'charleston' || p.name === 'courtesyPass'))
      return `That ${tileWord(k)} is half of a pair. Pairs are hard to get (jokers can't fill them), so most players keep them.`;
    if (p.name === 'turn') {
      const w = feedingWarning(view, rack.card, k);
      if (w) return w;
    }
  }
  return null;
}
