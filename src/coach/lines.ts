/**
 * The coach's reading of a rack. For every line on the card it finds the closest concrete version for
 * these tiles: how many tiles away it is, how many singles and pairs are still missing (jokers can't help
 * those), how many live tiles would help (outs), and whether the player can still finish it given what
 * they can see. It uses only the player's own seat view, exactly like the computer players, so it never
 * peeks at hidden tiles or the wall (docs/07-app-spec.md sections 5.2, 5.3 and 8).
 */

import { getCard, type Card, type CompiledHand, type Target } from '../engine/card';
import { analyze, exposuresFit, outs as countOuts, prepareExposures, privatelyBlocked, type ExposureInfo, type PreparedExposures } from '../engine/matcher';
import { JOKER, JOKER_COUNT, NUM_KINDS, SUPPLY, countsOf, kindOfTile, type Kind } from '../engine/tiles';
import type { SeatView } from '../engine/view';
import { exposureInfoFromView, publicTableFromView } from '../bots/evaluate';

export interface CoachOptions {
  /** Leave concealed (C) lines out of every suggestion (the "Hide concealed hands" setting). */
  hideConcealed: boolean;
  /** Card lines (hand ids) the player has pinned, at most two. */
  pinned: readonly string[];
}

export const NO_OPTIONS: CoachOptions = { hideConcealed: false, pinned: [] };
export const MAX_PINS = 2;

/** One seat's tiles and what that seat can see, digested for the coach. */
export interface Rack {
  card: Card;
  view: SeatView;
  /** Hidden tiles by kind (jokers at JOKER). */
  counts: number[];
  exposures: ExposureInfo[];
  prepared: PreparedExposures;
  /** Copies this seat can't see (still in the wall or in other players' hidden tiles), per kind. */
  unseen: number[];
  /** Jokers sitting in any exposure (they can still be won by joker exchange). */
  exposedJokers: number;
  /** Real tiles everyone can see, per kind (discards and exposures). */
  visible: number[];
}

export function readRack(view: SeatView, counts: number[] = countsOf(view.hand), exposures?: ExposureInfo[]): Rack {
  const card = getCard(view.cardId);
  const own = exposures ?? (view.players[view.seat] as SeatView['players'][number]).exposures.map(exposureInfoFromView);
  const table = publicTableFromView(view);
  let exposedJokers = 0;
  for (const p of view.players) for (const e of p.exposures) for (const id of e.tiles) if (kindOfTile(id) === JOKER) exposedJokers++;
  const handNow = countsOf(view.hand);
  const unseen = new Array<number>(NUM_KINDS).fill(0);
  for (let k = 0; k < NUM_KINDS; k++) {
    if (k === JOKER) unseen[k] = JOKER_COUNT - (handNow[k] as number) - exposedJokers - table.discardedJokers;
    else unseen[k] = (SUPPLY[k] as number) - (handNow[k] as number) - (table.visibleNaturals[k] as number);
  }
  return { card, view, counts, exposures: own, prepared: prepareExposures(own), unseen, exposedJokers, visible: Array.from(table.visibleNaturals) };
}

export function lineTitle(hand: Pick<CompiledHand, 'section' | 'line'>): string {
  return `${hand.section} #${hand.line}`;
}

export function titleOf(card: Card, handId: string): string {
  const h = card.hands.find((x) => x.id === handId);
  return h ? lineTitle(h) : handId;
}

export interface LineInfo {
  handId: string;
  handIndex: number;
  title: string;
  section: string;
  value: number;
  concealed: boolean;
  /** The closest concrete version of this line for these tiles. */
  target: Target;
  away: number;
  /** Singles and pairs still missing (only real tiles can fill these). */
  missingPlain: number;
  /** Live tiles that would bring this version one tile closer. */
  outs: number;
  /** The player can't finish it with what's left, judging by what they can see. */
  blocked: boolean;
}

/** Slots of kind k this target still has to fill from the hidden tiles. */
export function slotsOf(t: Target, prepared: PreparedExposures, k: Kind): number {
  return (t.plain[k] as number) + (t.flex[k] as number) - (prepared.sizeByKind[k] as number);
}

/** Giving up one copy of kind k would leave this target worse off (it uses every copy held). */
export function needsKind(t: Target, rack: Rack, k: Kind): boolean {
  if (k === JOKER) return false;
  const slots = slotsOf(t, rack.prepared, k);
  const have = rack.counts[k] as number;
  return slots > 0 && have > 0 && have <= slots;
}

function better(a: LineInfo, b: LineInfo): number {
  return (
    Number(a.blocked) - Number(b.blocked) ||
    a.away - b.away ||
    a.missingPlain - b.missingPlain ||
    b.outs - a.outs ||
    b.value - a.value ||
    a.handIndex - b.handIndex
  );
}

/** The closest version of one card line for this rack, or null when the player's exposures fit none of it. */
export function lineInfo(rack: Rack, handIndex: number): LineInfo | null {
  const hand = rack.card.hands[handIndex] as CompiledHand;
  const jokers = rack.counts[JOKER] as number;
  let best: LineInfo | null = null;
  for (const t of rack.card.targetsByHand[handIndex] ?? []) {
    if (!exposuresFit(t, rack.prepared)) continue;
    const a = analyze(t, rack.counts, rack.prepared);
    if (!a) continue;
    const info: LineInfo = {
      handId: hand.id,
      handIndex,
      title: lineTitle(hand),
      section: hand.section,
      value: hand.value,
      concealed: hand.concealed,
      target: t,
      away: a.away,
      missingPlain: a.missingPlainTotal,
      outs: countOuts(a, jokers, rack.unseen),
      blocked: privatelyBlocked(a, jokers, rack.unseen, rack.exposedJokers),
    };
    if (!best || better(info, best) < 0) best = info;
  }
  return best;
}

/**
 * Every line the player could still aim for, closest first: lines they can still finish, then fewer tiles
 * away, then fewer missing singles and pairs, then more live tiles that help, then higher value
 * (docs/07-app-spec.md section 5.2). Concealed lines are left out when the player hides them.
 */
export function rankLines(rack: Rack, opts: Pick<CoachOptions, 'hideConcealed'>): LineInfo[] {
  const out: LineInfo[] = [];
  rack.card.hands.forEach((h, i) => {
    if (opts.hideConcealed && h.concealed) return;
    const info = lineInfo(rack, i);
    if (info) out.push(info);
  });
  return out.sort(better);
}

/** The pinned lines that still fit this rack, in pin order. */
export function pinnedLines(rack: Rack, opts: CoachOptions): LineInfo[] {
  const out: LineInfo[] = [];
  for (const id of opts.pinned) {
    const i = rack.card.hands.findIndex((h) => h.id === id);
    if (i < 0) continue;
    const info = lineInfo(rack, i);
    if (info) out.push(info);
  }
  return out;
}

/** Copies of each kind the pinned lines use (the most any one pinned line uses). */
export function protectedCopies(rack: Rack, pins: readonly LineInfo[]): number[] {
  const keep = new Array<number>(NUM_KINDS).fill(0);
  for (const p of pins)
    for (const k of p.target.kinds) {
      if (k === JOKER) continue;
      const use = Math.min(rack.counts[k] as number, slotsOf(p.target, rack.prepared, k));
      if (use > (keep[k] as number)) keep[k] = use;
    }
  return keep;
}

/** Sections in order of how close their best line is ("Consecutive Run", then "13579", ...). */
export function closestSections(lines: readonly LineInfo[]): string[] {
  const out: string[] = [];
  for (const l of lines) if (!l.blocked && !out.includes(l.section)) out.push(l.section);
  return out;
}

/** "Consecutive Run #1 and 13579 #1" */
export function listTitles(lines: readonly { title: string }[]): string {
  const t = lines.map((l) => l.title);
  if (t.length <= 1) return t[0] ?? '';
  return `${t.slice(0, -1).join(', ')} and ${t[t.length - 1]}`;
}
