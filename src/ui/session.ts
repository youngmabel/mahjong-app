/**
 * The game driver: holds the current game, lets the computer players move at a pace you can follow,
 * sends your moves to the referee, and turns what happens into plain-English message lines.
 *
 * It has no screen code, so the tests can play whole games through it with a stand-in player.
 * Seat 0 is always you; the other three seats are level 2 computer opponents.
 */

import { getCard } from '../engine/card';
import { describeEvent } from '../engine/describe';
import { apply, checkInvariants, newGame, nextGame, pendingSeats, windOf } from '../engine/engine';
import { hashSeed } from '../engine/rng';
import type { Action, GameEvent, GameState } from '../engine/state';
import { JOKER, kindOfTile, type TileId } from '../engine/tiles';
import { eventsFor, seatView } from '../engine/view';
import type { Bot } from '../bots/bot';
import { defaultBots } from '../sim/runner';
import { SPEED_MS, type Prefs } from './prefs';
import { shouldStopForCall } from './moves';

export const HUMAN = 0;
export const PRACTICE_CARD_ID = 'practice';
const LOG_KEEP = 120;

export interface LogLine {
  n: number;
  text: string;
  /** event: something at the table; mine: your own move; alert: a dead hand; result: the end of a game. */
  tone: 'event' | 'mine' | 'alert' | 'result';
}

export interface Notice {
  text: string;
  /** referee: why a move isn't allowed; info: anything else. */
  tone: 'referee' | 'info';
  /** The move count when it was shown: it fades once play moves on. null = stays until your next move. */
  at: number | null;
}

/** Everything needed to resume exactly where you left off. */
export interface SavedGame {
  v: 1;
  sessionId: string;
  state: GameState;
  log: LogLine[];
  lastDrawn: TileId | null;
  newestDiscard: { tile: TileId; seat: number } | null;
}

export interface SessionHost {
  /** Run fn after ms milliseconds; returns a function that cancels it. */
  schedule(fn: () => void, ms: number): () => void;
  /** Something changed: redraw the screen. */
  changed(): void;
  /** A good moment to save (the game is waiting for you, or it just ended). */
  save(game: SavedGame): void;
}

export function randomId(): string {
  const bytes = new Uint8Array(8);
  const c = (globalThis as { crypto?: { getRandomValues?: (a: Uint8Array) => Uint8Array } }).crypto;
  if (c?.getRandomValues) c.getRandomValues(bytes);
  else for (let i = 0; i < bytes.length; i++) bytes[i] = Math.floor(Math.random() * 256);
  return Array.from(bytes, (b) => b.toString(36).padStart(2, '0')).join('').slice(0, 10);
}

export function gameSeed(sessionId: string, gameNumber: number): string {
  return `${sessionId}-${gameNumber}`;
}

export class Session {
  state: GameState;
  log: LogLine[] = [];
  notice: Notice | null = null;
  /** The tile you just drew (highlighted on your rack). */
  lastDrawn: TileId | null = null;
  /** The latest discard, while it is still on the table. */
  newestDiscard: { tile: TileId; seat: number } | null = null;
  sessionId: string;
  prefs: Prefs;
  private bots: Bot[];
  private cancelTimer: (() => void) | null = null;
  private counter = 0;
  private savedKey = '';
  private host: SessionHost;

  constructor(host: SessionHost, prefs: Prefs, saved?: SavedGame | null) {
    this.host = host;
    this.prefs = prefs;
    const why = saved ? Session.whyNotRestorable(saved) : 'nothing saved';
    if (saved && why !== null && typeof console !== 'undefined') console.warn(`Starting a new game: the saved game could not be resumed (${why}).`);
    if (saved && why === null) {
      this.sessionId = saved.sessionId;
      this.state = saved.state;
      this.log = saved.log.slice(-LOG_KEEP);
      this.counter = this.log.reduce((m, l) => Math.max(m, l.n), 0);
      this.lastDrawn = saved.lastDrawn;
      this.newestDiscard = saved.newestDiscard;
      this.state = { ...this.state, rules: { ...this.state.rules, safety: prefs.safety } };
    } else {
      this.sessionId = randomId();
      const seed = gameSeed(this.sessionId, 1);
      const dealer = (hashSeed(seed)[0] as number) % 4; // like rolling dice for the first East
      const g = newGame({ seed, cardId: PRACTICE_CARD_ID, rules: { safety: prefs.safety }, dealer });
      this.state = g.state;
      this.startLines();
      this.record(g.events, -1, null);
    }
    this.bots = defaultBots(this.state.seed);
  }

  /** A saved game can be resumed when it matches this version and every tile is accounted for. */
  static restorable(saved: SavedGame): boolean {
    return Session.whyNotRestorable(saved) === null;
  }

  /** Why a saved game can't be resumed (null when it can). */
  static whyNotRestorable(saved: SavedGame): string | null {
    try {
      if (!saved || saved.v !== 1 || !saved.state || saved.state.version !== 1) return 'saved by a different version';
      getCard(saved.state.cardId);
      const problems = checkInvariants(saved.state);
      return problems.length === 0 ? null : problems.join('; ');
    } catch (e) {
      return e instanceof Error ? e.message : String(e);
    }
  }

  serialize(): SavedGame {
    return {
      v: 1,
      sessionId: this.sessionId,
      state: this.state,
      log: this.log.slice(-LOG_KEEP),
      lastDrawn: this.lastDrawn,
      newestDiscard: this.newestDiscard,
    };
  }

  get myWind(): string {
    return windOf(this.state, HUMAN);
  }

  get busy(): boolean {
    return this.cancelTimer !== null;
  }

  /** Your move from the screen. Returns null when accepted, otherwise the referee's reason (also shown). */
  act(action: Action): string | null {
    const r = apply(this.state, HUMAN, action);
    if (!r.ok) {
      this.notice = { text: r.violation.message, tone: 'referee', at: this.state.actionCount };
      this.host.changed();
      return r.violation.message;
    }
    this.notice = null;
    this.commit(r.state, r.events, HUMAN, action);
    this.persist(); // saved before the computer players answer, so a reload never loses your move
    this.advance();
    return null;
  }

  /** Show a referee explanation without making a move (a dimmed button was tapped). */
  explain(text: string, tone: Notice['tone'] = 'referee'): void {
    this.notice = { text, tone, at: this.state.actionCount };
    this.host.changed();
  }

  clearNotice(): void {
    if (this.notice) {
      this.notice = null;
      this.host.changed();
    }
  }

  /** The notice to show now: a tap's explanation fades as soon as play moves on. */
  get currentNotice(): Notice | null {
    const n = this.notice;
    return n && (n.at === null || n.at === this.state.actionCount) ? n : null;
  }

  setPrefs(prefs: Prefs): void {
    const safetyChanged = prefs.safety !== this.prefs.safety;
    this.prefs = prefs;
    if (safetyChanged) {
      this.state = { ...this.state, rules: { ...this.state.rules, safety: prefs.safety } };
      this.savedKey = '';
    }
    this.advance();
  }

  /** Start the next game of this session: the deal passes to the right and scores carry over. */
  nextGame(): void {
    if (this.state.phase.name !== 'ended') return;
    this.stop();
    const seed = gameSeed(this.sessionId, this.state.gameNumber + 1);
    const g = nextGame(this.state, seed);
    this.state = { ...g.state, rules: { ...g.state.rules, safety: this.prefs.safety } };
    this.bots = defaultBots(seed);
    this.lastDrawn = null;
    this.newestDiscard = null;
    this.notice = null;
    this.startLines();
    this.record(g.events, -1, null);
    this.advance();
  }

  /** Start over with scores at zero. */
  newSession(): void {
    this.stop();
    this.sessionId = randomId();
    const seed = gameSeed(this.sessionId, 1);
    const dealer = (hashSeed(seed)[0] as number) % 4;
    const g = newGame({ seed, cardId: PRACTICE_CARD_ID, rules: { safety: this.prefs.safety }, dealer });
    this.state = g.state;
    this.bots = defaultBots(seed);
    this.log = [];
    this.lastDrawn = null;
    this.newestDiscard = null;
    this.notice = null;
    this.startLines();
    this.record(g.events, -1, null);
    this.advance();
  }

  /** Stop any pending computer move (used when the screen goes away). */
  stop(): void {
    if (this.cancelTimer) this.cancelTimer();
    this.cancelTimer = null;
  }

  /**
   * Let the computer players move until the game needs you or ends. Their answers to Charleston passes
   * and discards are instant and hidden; each of their turns waits a moment so you can follow along.
   */
  advance(): void {
    this.stop();
    for (let guard = 0; guard < 2000; guard++) {
      const s = this.state;
      const p = s.phase;
      if (p.name === 'ended') return this.settle();
      if (p.name === 'turn') {
        if (p.seat === HUMAN) return this.settle();
        this.host.changed();
        const seat = p.seat;
        this.cancelTimer = this.host.schedule(() => {
          this.cancelTimer = null;
          this.botMove(seat);
          this.advance();
        }, SPEED_MS[this.prefs.speed]);
        return;
      }
      const pending = pendingSeats(s);
      const bot = pending.find((q) => q !== HUMAN);
      if (bot !== undefined) {
        this.botMove(bot);
        continue;
      }
      if (pending.includes(HUMAN)) {
        if (p.name === 'callWindow' && !shouldStopForCall(s, HUMAN, this.prefs.stopEveryDiscard)) {
          this.applyFor(HUMAN, { type: 'pass' });
          continue;
        }
        return this.settle();
      }
      return this.settle();
    }
    this.settle();
  }

  private settle(): void {
    this.persist();
    this.host.changed();
  }

  /** Save if anything changed since the last save (computer moves replay exactly from any saved point). */
  private persist(): void {
    const key = `${this.sessionId}:${this.state.gameNumber}:${this.state.actionCount}:${this.state.rules.safety}`;
    if (key !== this.savedKey) {
      this.savedKey = key;
      this.host.save(this.serialize());
    }
  }

  private botMove(seat: number): void {
    const bot = this.bots[seat] as Bot;
    let action: Action;
    try {
      action = bot.decide(seatView(this.state, seat));
    } catch {
      action = this.fallbackAction(seat);
    }
    if (!this.applyFor(seat, action)) this.applyFor(seat, this.fallbackAction(seat));
  }

  /** Never expected (the simulations found none), but a computer player must never freeze the table. */
  private fallbackAction(seat: number): Action {
    const p = this.state.phase;
    const hand = (this.state.players[seat] as GameState['players'][number]).hand;
    const naturals = hand.filter((t) => kindOfTile(t) !== JOKER);
    switch (p.name) {
      case 'charleston':
        return { type: 'charlestonPass', tiles: naturals.slice(0, 3) };
      case 'vote':
        return { type: 'charlestonVote', continue: false };
      case 'courtesyOffer':
        return { type: 'courtesyOffer', count: 0 };
      case 'courtesyPass':
        return { type: 'courtesyPass', tiles: naturals.slice(0, p.agreed[seat] as number) };
      case 'turn':
        return { type: 'discard', tile: (naturals[naturals.length - 1] ?? hand[0]) as TileId };
      default:
        return { type: 'pass' };
    }
  }

  private applyFor(seat: number, action: Action): boolean {
    const r = apply(this.state, seat, action);
    if (!r.ok) return false;
    this.commit(r.state, r.events, seat, action);
    return true;
  }

  private commit(state: GameState, events: GameEvent[], seat: number, action: Action): void {
    this.state = state;
    this.record(events, seat, action);
  }

  private startLines(): void {
    const w = windOf(this.state, HUMAN);
    const dealer = this.state.dealer === HUMAN ? ' and the dealer' : `; ${windOf(this.state, this.state.dealer)} is the dealer`;
    this.push(`Game ${this.state.gameNumber}. You are ${w}${dealer}.`, 'event');
  }

  private push(text: string, tone: LogLine['tone']): void {
    this.counter += 1;
    this.log.push({ n: this.counter, text, tone });
    if (this.log.length > LOG_KEEP * 2) this.log = this.log.slice(-LOG_KEEP);
  }

  private record(events: GameEvent[], seat: number, action: Action | null): void {
    const ctx = { dealer: this.state.dealer, cardId: this.state.cardId, viewer: HUMAN };
    const mine = eventsFor(events, HUMAN);
    for (const e of mine) {
      if (e.type === 'draw' && e.seat === HUMAN && e.tile >= 0) this.lastDrawn = e.tile;
      if (e.type === 'discard') {
        this.newestDiscard = kindOfTile(e.tile) === JOKER ? null : { tile: e.tile, seat: e.seat };
        if (e.seat === HUMAN) this.lastDrawn = null;
      }
      if (e.type === 'claim' && this.newestDiscard?.tile === e.tile) this.newestDiscard = null;
      if (e.type === 'playStarts') this.lastDrawn = null;
      const text = describeEvent(e, ctx);
      if (!text) continue;
      const own =
        ('seat' in e && e.seat === HUMAN && e.type !== 'tilesReceived' && e.type !== 'dead') || e.type === 'tilesReceived';
      const tone: LogLine['tone'] = e.type === 'dead' ? 'alert' : e.type === 'gameEnd' ? 'result' : own ? 'mine' : 'event';
      this.push(text, tone);
    }
    // Your call lost to someone else's: say why (Mah Jongg beats an exposure; ties go to the next in turn).
    if (seat === HUMAN && action && (action.type === 'claimExposure' || action.type === 'claimMahjong')) {
      const claim = events.find((e) => e.type === 'claim');
      if (claim && claim.type === 'claim' && claim.seat !== HUMAN) {
        const why =
          claim.purpose === 'mahjong' && action.type === 'claimExposure'
            ? 'A Mah Jongg call beats a call for an exposure.'
            : 'When two players call the same discard, the one next in turn after the discarder gets it.';
        this.notice = { text: `${windOf(this.state, claim.seat)} got that tile instead of you. ${why}`, tone: 'info', at: null };
      }
    }
  }
}
