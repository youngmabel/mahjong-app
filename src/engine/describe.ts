/** Plain-English descriptions of game events, for the play-by-play log and the table's message line. */

import { getCard, sectionSlug } from './card';
import { PASS_NAMES, windOf } from './engine';
import type { GameEvent, GameResult } from './state';
import { JOKER, isWind, kindName, kindNamePlural, kindOfTile, type TileId } from './tiles';

const PASS_DIRECTION = ['to the right', 'across', 'to the left', 'to the left', 'across', 'to the right'];
const SIZE_NAME: Record<number, string> = { 3: 'pung', 4: 'kong', 5: 'quint', 6: 'sextet' };

export interface DescribeContext {
  dealer: number;
  cardId: string;
  /** The seat reading the log; private details are shown only to them (or to everyone when revealAll). */
  viewer?: number;
  revealAll?: boolean;
}

function tileName(id: TileId): string {
  const k = kindOfTile(id);
  return isWind(k) ? `${kindName(k)} wind` : kindName(k);
}

function article(name: string): string {
  return /^[AEIOU8]|^1[18]\b/.test(name) ? 'an' : 'a';
}

/** "Consecutive Run #2", plus the id when it was set by hand: "Consecutive Run #2 (P-RUN-2)". */
export function handLabel(cardId: string, handId: string): string {
  const h = getCard(cardId).hands.find((x) => x.id === handId);
  if (!h) return handId;
  const label = `${h.section} #${h.line}`;
  return h.id === `${sectionSlug(h.section)}-${h.line}` ? label : `${label} (${h.id})`;
}

export function describeResult(ctx: DescribeContext, r: GameResult): string {
  const w = (s: number) => windOf(ctx, s);
  if (r.type === 'wall') return 'Wall game: the wall ran out with no Mah Jongg, so nobody pays.';
  if (r.type === 'threeDead') return 'Three hands are dead, so the game ends with no winner and nobody pays.';
  const how =
    r.how === 'heavenly'
      ? 'with a Heavenly Hand (dealt complete)'
      : r.how === 'eastFirst'
        ? 'before the first discard'
        : r.how === 'selfDraw'
          ? 'on a tile picked from the wall'
          : r.how === 'jokerExchange'
            ? 'after a joker exchange (counts as self-picked)'
            : `on ${w(r.from as number)}'s discard`;
  const pays = [0, 1, 2, 3]
    .filter((s) => s !== r.winner)
    .map((s) => `${w(s)} pays ${-(r.payments[s] as number)}`)
    .join(', ');
  return `Mah Jongg! ${w(r.winner)} wins ${how} with ${handLabel(ctx.cardId, r.handId)}, worth ${r.value}${r.jokerless ? ' (jokerless)' : ''}. ${pays}.`;
}

export function describeEvent(e: GameEvent, ctx: DescribeContext): string | null {
  const w = (s: number) => windOf(ctx, s);
  const me = (s: number) => ctx.viewer === s && !ctx.revealAll;
  const canSee = (s: number) => ctx.revealAll || ctx.viewer === s;
  switch (e.type) {
    case 'deal':
      return `The tiles are shuffled and dealt. ${w(e.dealer)} (the dealer) has 14 tiles; everyone else has 13.`;
    case 'charlestonPassed': {
      const blinds = e.blind
        .map((b, s) => (b > 0 ? `${w(s)} passed ${b} blind` : ''))
        .filter((x) => x)
        .join('; ');
      return `Charleston, ${PASS_NAMES[e.pass]}: everyone passes 3 tiles ${PASS_DIRECTION[e.pass]}.${blinds ? ` (${blinds}.)` : ''}${e.iou ? ' Everyone passed blind, so the IOU method was used.' : ''}`;
    }
    case 'tilesReceived':
      if (!canSee(e.seat)) return null;
      return `${me(e.seat) ? 'You receive' : `${w(e.seat)} receives`} ${e.tiles.length ? e.tiles.map(tileName).join(', ') : 'nothing new'}${e.pass === 'courtesy' ? ' in the courtesy pass' : ''}.`;
    case 'secondCharleston':
      return e.played
        ? 'Nobody stops the Charleston, so the second Charleston begins: left, across, right.'
        : `${e.stoppedBy.map(w).join(' and ')} stopped the Charleston, so there is no second Charleston.`;
    case 'courtesyAgreed':
      return `Courtesy pass: ${w(e.seats[0])} and ${w(e.seats[1])} ${e.count === 0 ? 'trade no tiles' : `trade ${e.count} tile${e.count === 1 ? '' : 's'}`}.`;
    case 'playStarts':
      return `Play begins. ${w(e.dealer)} discards first, without drawing.`;
    case 'draw':
      if (canSee(e.seat) && e.tile >= 0) return `${me(e.seat) ? 'You draw' : `${w(e.seat)} draws`} ${article(tileName(e.tile))} ${tileName(e.tile)}. (${e.wallLeft} left in the wall)`;
      return `${w(e.seat)} draws from the wall. (${e.wallLeft} left)`;
    case 'discard':
      if (kindOfTile(e.tile) === JOKER) return `${w(e.seat)} discards a joker. (A discarded joker is dead; no one can claim it.)`;
      return `${w(e.seat)} discards ${tileName(e.tile)}.`;
    case 'claim':
      return e.purpose === 'mahjong'
        ? `${w(e.seat)} calls Mah Jongg on ${w(e.from)}'s ${tileName(e.tile)}!`
        : `${w(e.seat)} calls ${w(e.from)}'s ${tileName(e.tile)}.`;
    case 'expose':
      return `${w(e.seat)} exposes a ${SIZE_NAME[e.size]} of ${kindNamePlural(e.kind)}${e.jokers ? ` (${e.jokers} joker${e.jokers === 1 ? '' : 's'})` : ''}.`;
    case 'amendExposure':
      return `${w(e.seat)} changes that exposure to a ${SIZE_NAME[e.size]}${e.jokers ? ` (${e.jokers} joker${e.jokers === 1 ? '' : 's'})` : ''}.`;
    case 'jokerExchange':
      return `${w(e.seat)} trades a ${kindName(e.kind)} for the joker in ${e.owner === e.seat ? 'their own' : `${w(e.owner)}'s`} exposure.`;
    case 'dead':
      return e.message;
    case 'gameEnd':
      return describeResult(ctx, e.result);
  }
}
