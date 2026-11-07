/**
 * A stand-in for you that does whatever the coach suggests, through the screen's own buttons
 * (src/ui/moves.ts). Whole games played this way prove the coach never suggests a move the referee refuses.
 */

import { expect } from 'vitest';
import { callOptions, checkInvariants } from '../src/engine/engine';
import { seatView } from '../src/engine/view';
import { coachNote, rankLines, readRack, type CoachOptions } from '../src/coach';
import {
  callChoices,
  charlestonPassChoice,
  courtesyOfferChoices,
  courtesyPassChoice,
  heavenlyChoice,
  isPending,
  turnChoices,
  voteChoices,
  type Choice,
} from '../src/ui/moves';
import { HUMAN, type Session } from '../src/ui/session';

/** The screen button a coach note points to. */
export function choiceForNote(session: Session, key: string, tiles: number[], blind: number): Choice | undefined {
  const state = session.state;
  const p = state.phase;
  if (key === 'pass-tiles') return charlestonPassChoice(state, HUMAN, tiles, blind);
  if (key === 'heavenly') return heavenlyChoice(state, HUMAN) ?? undefined;
  if (key.startsWith('vote-')) return voteChoices(state, HUMAN).find((c) => c.key === key);
  if (key.startsWith('offer-')) return courtesyOfferChoices(state, HUMAN).find((c) => c.key === key);
  if (key === 'courtesy-pass') return courtesyPassChoice(state, HUMAN, tiles);
  if (p.name === 'turn') {
    const tc = turnChoices(state, HUMAN, key === 'discard' ? tiles : []);
    if (!tc) return undefined;
    if (key === 'discard') return tc.discard;
    if (key === 'mahjong') return tc.mahjong;
    return tc.exchanges.find((c) => c.key === key);
  }
  if (p.name === 'callWindow') return callChoices(state, HUMAN).find((c) => c.key === key);
  return undefined;
}

/** Make the coach's suggested move. Returns false when the game isn't waiting for you. */
export function coachFollowerMove(session: Session, opts: CoachOptions, texts: string[]): boolean {
  const state = session.state;
  if (!isPending(state, HUMAN)) return false;
  const view = seatView(state, HUMAN);
  const legalCalls = state.phase.name === 'callWindow' ? callOptions(state, HUMAN) : undefined;
  const note = coachNote(view, opts, legalCalls ? { legalCalls } : {});
  if (!note || !note.choiceKey) throw new Error(`the coach had nothing to suggest in phase ${state.phase.name}`);
  texts.push(note.text, ...(note.why ? [note.why] : []), ...(note.extra ? [note.extra] : []), ...note.tiers);
  const choice = choiceForNote(session, note.choiceKey, note.tiles, note.blind);
  if (!choice) throw new Error(`the coach suggested "${note.choiceKey}", which the screen doesn't offer`);
  if (!choice.ok) throw new Error(`the coach suggested "${note.text}", which the referee refuses: ${choice.reason}`);
  const reason = session.act(choice.action);
  if (reason) throw new Error(`the coach's move was refused: ${reason}`);
  expect(checkInvariants(session.state)).toEqual([]);
  return true;
}

/**
 * A stand-in for a learner in a guided match: pins the coach's closest line at the first Charleston pass
 * (or when asked for a direction), then follows the session's own coach note.
 */
export function guidedFollowerMove(session: Session, texts: string[], opts: { pin?: boolean } = {}): boolean {
  const state = session.state;
  if (session.needsDirection) {
    if (opts.pin === false) session.dismissDirection();
    else {
      const top = rankLines(readRack(seatView(state, HUMAN)), session.coachOptions()).find((l) => !l.blocked);
      if (top) session.pin(top.handId);
      else session.dismissDirection();
    }
  }
  if (!isPending(state, HUMAN)) return false;
  if (opts.pin !== false && session.pins.length === 0 && state.phase.name === 'charleston') {
    const top = rankLines(readRack(seatView(state, HUMAN)), session.coachOptions()).find((l) => !l.blocked);
    if (top) session.pin(top.handId);
  }
  const note = session.note();
  if (!note || !note.choiceKey) throw new Error(`the coach had nothing to suggest in phase ${state.phase.name}`);
  texts.push(note.text, ...(note.why ? [note.why] : []), ...(note.extra ? [note.extra] : []), ...note.tiers);
  const choice = choiceForNote(session, note.choiceKey, note.tiles, note.blind);
  if (!choice) throw new Error(`the coach suggested "${note.choiceKey}", which the screen doesn't offer`);
  if (!choice.ok) throw new Error(`the coach suggested "${note.text}", which the referee refuses: ${choice.reason}`);
  const reason = session.act(choice.action);
  if (reason) throw new Error(`the coach's move was refused: ${reason}`);
  expect(checkInvariants(session.state)).toEqual([]);
  return true;
}
