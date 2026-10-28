/**
 * Plays whole games: asks whichever seats the referee is waiting for, applies their actions, and
 * (optionally) checks every invariant after every single action. Used by the simulations, the replay
 * test and the sample-game script. The future screen code drives the engine the same way.
 */

import { apply, checkInvariants, newGame, nextGame, pendingSeats, revalidateWin, type NewGameOptions } from '../engine/engine';
import { hashSeed, streamSeed } from '../engine/rng';
import type { Action, GameEvent, GameState, Violation } from '../engine/state';
import { seatView } from '../engine/view';
import { createBot, type Bot } from '../bots/bot';
import { botConfig } from '../bots/config';

export interface Controller {
  decide(view: ReturnType<typeof seatView>): Action;
}

export interface LoggedAction {
  seat: number;
  action: Action;
}

export interface GameRun {
  state: GameState;
  actions: LoggedAction[];
  events: GameEvent[];
  /** Problems found by the invariant checks (should always be empty). */
  problems: string[];
  /** Actions the referee rejected (computer opponents should never trigger one). */
  violations: { seat: number; action: Action; violation: Violation }[];
}

/** A bot's private random seed: derived from the game seed but not revealing it. */
export function botSeed(gameSeed: string, seat: number): string {
  return hashSeed(streamSeed(gameSeed, `bot${seat}`)).map((n) => n.toString(16)).join('');
}

export function defaultBots(gameSeed: string, level: 1 | 2 | 3 = 2): Bot[] {
  return [0, 1, 2, 3].map((seat) => createBot(botConfig(level), botSeed(gameSeed, seat)));
}

export interface RunOptions {
  checkEveryAction?: boolean;
  maxActions?: number;
}

/** Play from a state until the game ends. */
export function playOut(start: GameState, controllers: readonly Controller[], startEvents: GameEvent[] = [], opts: RunOptions = {}): GameRun {
  let state = start;
  const actions: LoggedAction[] = [];
  const events: GameEvent[] = [...startEvents];
  const problems: string[] = [];
  const violations: GameRun['violations'] = [];
  const check = opts.checkEveryAction ?? true;
  const maxActions = opts.maxActions ?? 5000;
  if (check) problems.push(...checkInvariants(state).map((p) => `start: ${p}`));
  while (state.phase.name !== 'ended') {
    if (actions.length > maxActions) {
      problems.push(`game did not end within ${maxActions} actions`);
      break;
    }
    const seats = pendingSeats(state);
    if (seats.length === 0) {
      problems.push(`no seat to act in phase ${state.phase.name}`);
      break;
    }
    const seat = seats[0] as number;
    const action = (controllers[seat] as Controller).decide(seatView(state, seat));
    const r = apply(state, seat, action);
    if (!r.ok) {
      violations.push({ seat, action, violation: r.violation });
      problems.push(`seat ${seat} action rejected: ${r.violation.message}`);
      break;
    }
    state = r.state;
    actions.push({ seat, action });
    events.push(...r.events);
    if (check) {
      const ps = checkInvariants(state);
      if (ps.length > 0) {
        problems.push(...ps.map((p) => `after action ${actions.length} (${action.type}): ${p}`));
        break;
      }
    }
  }
  const win = revalidateWin(state);
  if (win) problems.push(win);
  return { state, actions, events, problems, violations };
}

/** One complete computer-only game from a seed. */
export function playBotGame(opts: NewGameOptions, controllers?: readonly Controller[], runOpts: RunOptions = {}): GameRun {
  const { state, events } = newGame(opts);
  return playOut(state, controllers ?? defaultBots(opts.seed), events, runOpts);
}

/** Replay a logged game from its seed and actions; returns the final state (throws if an action no longer fits). */
export function replay(opts: NewGameOptions, actions: readonly LoggedAction[]): GameState {
  let { state } = newGame(opts);
  for (const [i, a] of actions.entries()) {
    const r = apply(state, a.seat, a.action);
    if (!r.ok) throw new Error(`replay action ${i} rejected: ${r.violation.message}`);
    state = r.state;
  }
  return state;
}

/** A session of several games: the deal passes to the right and scores carry over. */
export function playSession(seed: string, cardId: string, games: number): GameRun[] {
  const runs: GameRun[] = [];
  let prev: GameState | null = null;
  for (let g = 0; g < games; g++) {
    const gameSeed = `${seed}#${g + 1}`;
    const { state, events } = prev ? nextGame(prev, gameSeed) : newGame({ seed: gameSeed, cardId });
    const run = playOut(state, defaultBots(gameSeed), events);
    runs.push(run);
    prev = run.state;
  }
  return runs;
}
