/**
 * How Pip, the coach, shows up on screen (no screen code here, so it can be tested on its own):
 * - the short, friendly sentence in Pip's bubble beside your rack, worked out from the coach's note;
 * - where each first-time rule spotlight points, and what Pip says before stating the rule;
 * - the steps of the tour of the table;
 * - the seat map (who sits where, whose turn it is, where passed tiles go);
 * - who should land on the start screen.
 * Rules are stated as facts and hand advice as suggestions ("I'd pass..."), as in docs/05-teaching-plan.md
 * section 7. A friendly, conversational voice helps people learn (Mayer's personalization principle).
 */

import { windOf } from '../engine/engine';
import type { GameState } from '../engine/state';
import type { CoachNote } from '../coach';
import { charlestonInfo, isPending, relativePosition } from './moves';
import type { Progress } from './progress';
import type { SavedGame } from './session';

export const COACH_NAME = 'Pip';

function lowerFirst(s: string): string {
  return s.charAt(0).toLowerCase() + s.slice(1);
}

/** "to East, on your right" / "across to South" / "to West, on your left" */
export function passWhere(state: GameState, seat: number): string {
  const info = charlestonInfo(state, seat);
  if (!info) return '';
  const w = windOf(state, info.to);
  return info.direction === 'across' ? `across to ${w}` : `to ${w}, on your ${info.direction}`;
}

export interface Bubble {
  /** Pip's suggestion or instruction, one short sentence. */
  say: string;
  /** Why, in a sentence (may be empty). */
  why: string;
  /** A strategy tip or a warning, or null. */
  extra: string | null;
}

/**
 * Pip's words for the coach's note: "Suggestion: pass 8 Bam, 5 Dot and North wind." becomes "I'd pass
 * 8 Bam, 5 Dot and North wind to East, on your right." Statements of fact ("You have Mah Jongg") stay.
 * `preselected` is how many of the tiles were chosen for you (match 1's Charleston fade).
 */
export function bubbleFor(note: CoachNote, state: GameState, seat: number, preselected = 0): Bubble {
  let say = note.text;
  if (say.startsWith('Suggestion: ')) {
    const rest = say.slice('Suggestion: '.length);
    say = note.topic === 'call' && rest === 'pass.' ? "I'd let this one go by." : `I'd ${lowerFirst(rest)}`;
  }
  let why = note.why;
  if (note.topic === 'pass' && note.text.startsWith('Suggestion: pass')) {
    const where = passWhere(state, seat);
    const list = note.text.slice('Suggestion: pass '.length).replace(/\.$/, '');
    const plain = note.blind === 0;
    if (plain && preselected >= 3) say = `I picked these 3 to pass ${where}: ${list}. Tap Pass, or swap any of them.`;
    else if (plain && preselected === 2) {
      say = `I picked 2 tiles to pass ${where}. You choose the third.`;
      why = note.tiers[0];
    } else if (where) say = `${say.replace(/\.$/, '')}${plain ? ' ' : ', '}${where}.`;
  }
  return { say, why, extra: note.extra };
}

// --- Spotlights for firsts -------------------------------------------------------------------------------

export interface Spot {
  /** CSS selectors to point at, first visible one wins; none (or none found) means a card in the middle. */
  targets: string[];
  /** Pip's friendly lead-in before the rule itself. */
  lead: string;
}

/** Where each rule card's spotlight points, and how Pip introduces it. Rule text comes from src/coach/rulecards.ts. */
export const RULE_SPOTS: Record<string, Spot> = {
  goal: { targets: ['.rack-area'], lead: "Here's what you're playing for." },
  charleston: { targets: ['.seatmap', '.rack-area'], lead: 'First, everyone swaps some tiles. The arrow shows where yours go.' },
  blindPass: { targets: ['.seg.blind', '.actions'], lead: 'This pass has a special option.' },
  vote: { targets: ['.actions'], lead: 'Time for a quick vote.' },
  courtesy: { targets: ['.actions'], lead: 'One last, optional swap with the player across.' },
  eastFirst: { targets: ['.rack-area'], lead: "You're East this game, so you go first." },
  turn: { targets: ['.rack-area', '.actions'], lead: "It's your turn." },
  calling: { targets: ['.actions'], lead: 'Someone just threw a tile you might be able to use.' },
  afterCall: { targets: ['.mine', '.actions'], lead: 'You called a tile, so now you show the group.' },
  concealed: { targets: ['.pinned', '.actions'], lead: 'A note about the hand you pinned.' },
  jokers: { targets: ['.rack-tile.is-joker', '.rack-area'], lead: 'You have a joker!' },
  jokerExchange: { targets: ['.btn-exchange', '.actions'], lead: 'You can grab a joker from the table.' },
  deadJoker: { targets: ['.discards'], lead: 'Someone threw away a joker.' },
  deadHand: { targets: ['.opp.is-dead', '.opponents'], lead: 'A hand just went dead.' },
  payment: { targets: [], lead: 'The game is over. Here is how payment works.' },
  wallGame: { targets: [], lead: 'The game is over. Nobody won this time.' },
  safetyOff: { targets: [], lead: 'This match is a dress rehearsal, played as at a real table.' },
};

// --- The tour of the table -------------------------------------------------------------------------------

export interface TourStep {
  targets: string[];
  title: string;
  text: string;
}

export const TOUR: readonly TourStep[] = [
  { targets: [], title: `Hi, I'm ${COACH_NAME}!`, text: "I'll be your coach. Here's a quick look around the table before you play." },
  { targets: ['.rack-area'], title: 'Your tiles', text: "This is your rack. Tap a tile to choose it; each tile's name is underneath." },
  {
    targets: ['.rack-card', '.tb-nav'],
    title: 'The card',
    text: 'The card lists every winning hand. Your goal is 14 tiles that match one line on it exactly.',
  },
  {
    targets: ['.seatmap', '.opponents'],
    title: 'Who sits where',
    text: 'You sit at the bottom. Play goes to the right, so the player on your right plays after you.',
  },
  {
    targets: ['.opponents'],
    title: 'The other players',
    text: 'Each row shows a player: how many tiles they hold, their points, and any groups they have shown.',
  },
  { targets: ['.discards'], title: 'Discards', text: 'Thrown-away tiles land here, sorted by suit, so you can see what is gone.' },
  { targets: ['.messages'], title: 'What just happened', text: 'The latest move and what to do next show here. Tap any underlined word to see what it means.' },
  {
    targets: ['.actions'],
    title: 'Your buttons',
    text: 'A dimmed button is something you can’t do right now. Tap it anyway and you’ll be told why.',
  },
  {
    targets: ['.tb-nav'],
    title: 'The Menu',
    text: "The Menu has the lessons, the practice matches, free play and settings, including how fast the other players move. That's the tour!",
  },
];

export const TOUR_KEY = 'tour';

// --- The seat map ----------------------------------------------------------------------------------------

export type Side = 'bottom' | 'right' | 'top' | 'left';

export interface SeatMapSeat {
  seat: number;
  side: Side;
  wind: string;
  you: boolean;
  /** It is this seat's turn, or the latest discard is theirs and calls are open. */
  active: boolean;
  dealer: boolean;
  dead: boolean;
}

export interface SeatMap {
  seats: SeatMapSeat[];
  /** During your Charleston pass: the side your tiles go to. */
  passTo: Side | null;
  /** A short label for screen readers and the caption under the map. */
  caption: string;
}

const SIDE: Record<string, Side> = { you: 'bottom', right: 'right', across: 'top', left: 'left' };

export function seatMap(state: GameState, me: number): SeatMap {
  const p = state.phase;
  const seats: SeatMapSeat[] = [0, 1, 2, 3].map((s) => ({
    seat: s,
    side: SIDE[relativePosition(me, s)] as Side,
    wind: windOf(state, s),
    you: s === me,
    active: (p.name === 'turn' && p.seat === s) || (p.name === 'callWindow' && p.discarder === s),
    dealer: state.dealer === s,
    dead: (state.players[s] as GameState['players'][number]).dead !== null,
  }));
  let passTo: Side | null = null;
  let caption = '';
  const info = charlestonInfo(state, me);
  if (info && isPending(state, me)) {
    passTo = SIDE[relativePosition(me, info.to)] as Side;
    caption = `Your 3 tiles go ${passWhere(state, me)}.`;
  } else if (p.name === 'courtesyPass' && isPending(state, me)) {
    passTo = 'top';
    caption = `Your tiles go across to ${windOf(state, (me + 2) % 4)}.`;
  } else if (p.name === 'turn') caption = p.seat === me ? 'Your turn.' : `${windOf(state, p.seat)}'s turn.`;
  else if (p.name === 'callWindow') caption = `${windOf(state, p.discarder)} just discarded.`;
  return { seats, passTo, caption };
}

// --- The start screen ------------------------------------------------------------------------------------

/** Someone opening the app for the first time (nothing saved, nothing done) lands on the start screen. */
export function isNewPlayer(progress: Progress, saved: SavedGame | null, guided: SavedGame | null): boolean {
  return !saved && !guided && progress.completed.length === 0 && progress.seenRules.length === 0;
}
