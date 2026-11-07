/**
 * Short rule cards, shown the first time each situation comes up (docs/05-teaching-plan.md section 2,
 * rule 2: teach rules just in time). Every card states a rule from docs/01-rules.md rated high confidence
 * [H]; where the app follows one of its labeled rule choices, the card says so.
 */

import type { SeatView } from '../engine/view';
import { JOKER, kindOfTile } from '../engine/tiles';

export interface RuleCard {
  key: string;
  title: string;
  text: string;
}

export const RULE_CARDS: Record<string, RuleCard> = {
  goal: {
    key: 'goal',
    title: 'The goal',
    text: 'A winning hand is 14 tiles that exactly match one line on the card, with any exposures fitting that line.',
  },
  charleston: {
    key: 'charleston',
    title: 'The Charleston',
    text: 'Before play, everyone passes 3 tiles to the right, then across, then to the left. Jokers can never be passed.',
  },
  blindPass: {
    key: 'blindPass',
    title: 'Blind pass',
    text: 'On the first left and the last right you may pass blind: forward 1 to 3 of the tiles coming to you without looking, and make up the rest of your 3 from your rack.',
  },
  vote: {
    key: 'vote',
    title: 'The second Charleston',
    text: 'After the first Charleston, any one player can stop the second one. If nobody does, everyone passes left, across, then right.',
  },
  courtesy: {
    key: 'courtesy',
    title: 'The courtesy pass',
    text: 'You and the player across may trade 0 to 3 tiles, and the lower of your two offers is used. Jokers can never be passed.',
  },
  eastFirst: {
    key: 'eastFirst',
    title: 'East starts',
    text: 'East starts with 14 tiles and makes the first discard without drawing.',
  },
  turn: {
    key: 'turn',
    title: 'A turn',
    text: 'On your turn you draw a tile (or claim the last discard), then discard one. You hold 13 tiles between turns and 14 during your turn.',
  },
  calling: {
    key: 'calling',
    title: 'Calling a discard',
    text: 'You can claim a discard only to complete a pung, kong, quint or sextet that you then expose, or as the tile that completes Mah Jongg. Pairs and single tiles can be claimed only for Mah Jongg.',
  },
  afterCall: {
    key: 'afterCall',
    title: 'After a call',
    text: 'Expose the group, then discard without drawing. You can change the exposure until you discard; this app also locks it when you start a joker exchange.',
  },
  concealed: {
    key: 'concealed',
    title: 'Concealed hands',
    text: 'A concealed (C) hand exposes nothing before Mah Jongg: it may claim a discard only as the tile that completes it.',
  },
  jokers: {
    key: 'jokers',
    title: 'Jokers',
    text: 'Jokers fill only groups of 3 or more (pungs, kongs, quints and sextets), never a single or a pair.',
  },
  jokerExchange: {
    key: 'jokerExchange',
    title: 'Joker exchange',
    text: 'On your turn, holding 14 tiles, you may trade a real tile for an exposed joker that stands for it, from any exposure, your own included.',
  },
  deadJoker: {
    key: 'deadJoker',
    title: 'Discarded jokers',
    text: 'A discarded joker is dead: no one can claim it.',
  },
  deadHand: {
    key: 'deadHand',
    title: 'Dead hands',
    text: 'A dead hand sits out the rest of the game but still pays the winner. This app declares a hand dead only on evidence the whole table can see.',
  },
  payment: {
    key: 'payment',
    title: 'Who pays',
    text: "On a discard win, the player who threw the tile pays double the hand's value and the others pay the value; on a self-picked win, everyone pays double. A jokerless win doubles again, except for Singles and Pairs and Quints.",
  },
  wallGame: {
    key: 'wallGame',
    title: 'Wall game',
    text: 'When the wall runs out with no Mah Jongg, nobody pays and the deal passes to the right.',
  },
  safetyOff: {
    key: 'safetyOff',
    title: 'Safety is off',
    text: 'As at a real table, a legal exposure that fits no hand on the card is allowed, and your hand goes dead when you discard. Illegal moves are still blocked.',
  },
};

export interface RuleSituation {
  /** Pinned lines include a concealed one. */
  concealedPinned?: boolean;
  /** Safety is off for this game. */
  safetyOff?: boolean;
  /** A joker exchange is open to the player right now. */
  exchangeOpen?: boolean;
}

/** Rule cards that fit what the player faces right now, most pressing first. */
export function ruleCardsFor(view: SeatView, sit: RuleSituation = {}): string[] {
  const out: string[] = [];
  const p = view.phase;
  const me = view.seat;
  if (sit.safetyOff) out.push('safetyOff');
  if (p.name === 'ended') {
    out.push(p.result.type === 'mahjong' ? 'payment' : 'wallGame');
    return out;
  }
  if (view.players.some((pl) => pl.dead)) out.push('deadHand');
  if (view.floor.some((f) => kindOfTile(f.tile) === JOKER)) out.push('deadJoker');
  if (!view.pending) return out;
  out.push('goal');
  if (view.hand.some((t) => kindOfTile(t) === JOKER)) out.push('jokers');
  switch (p.name) {
    case 'charleston':
      out.push('charleston');
      if (p.blindAllowed) out.push('blindPass');
      break;
    case 'vote':
      out.push('vote');
      break;
    case 'courtesyOffer':
    case 'courtesyPass':
      out.push('courtesy');
      break;
    case 'turn':
      if (p.seat !== me) break;
      if (p.source === 'deal') out.push('eastFirst');
      else if (p.source === 'claim') out.push('afterCall');
      else out.push('turn');
      if (sit.exchangeOpen) out.push('jokerExchange');
      break;
    case 'callWindow':
      out.push('calling');
      if (sit.concealedPinned) out.push('concealed');
      break;
  }
  return out;
}
