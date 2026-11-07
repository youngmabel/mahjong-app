/**
 * The game driver: holds the current game, lets the computer players move at a pace you can follow,
 * sends your moves to the referee, and turns what happens into plain-English message lines.
 *
 * It runs free play or one of the three guided matches (docs/05-teaching-plan.md section 5). A guided
 * match is one game, with help that fades from match to match:
 *   1 open table:     everyone's tiles face up, the computer players explain their moves, the coach
 *                     suggests and gives feedback as you choose, the Charleston fades within the game,
 *                     undo, gentle players who never declare Mah Jongg, a deal near a Consecutive Run hand.
 *   2 concealed table: hidden racks, players who can win, hints on request, a review after the game.
 *   3 dress rehearsal: Safety off, a small hint budget, stronger players, a full review.
 * It has no screen code, so the tests can play whole games through it with a stand-in player.
 * Seat 0 is always you.
 */

import { getCard } from '../engine/card';
import { describeEvent } from '../engine/describe';
import { apply, callOptions, checkInvariants, exposedJokers, newGame, nextGame, pendingSeats, windOf } from '../engine/engine';
import { hashSeed } from '../engine/rng';
import type { Action, GameEvent, GameState, Violation } from '../engine/state';
import { JOKER, countsOf, kindOfTile, type TileId } from '../engine/tiles';
import { eventsFor, seatView } from '../engine/view';
import { createBot, type Bot } from '../bots/bot';
import { botConfig } from '../bots/config';
import { botSeed, defaultBots } from '../sim/runner';
import {
  MAX_PINS,
  RULE_CARDS,
  RULE_SLIP_CODES,
  buildReview,
  choiceFeedback,
  coachNote,
  discardLoss,
  emptyStats,
  feedingWarning,
  narrateBotMove,
  passLoss,
  pinnedLines,
  pinnedNeeding,
  rankLines,
  readRack,
  readiness,
  ruleCardsFor,
  tileList,
  tileWord,
  type CoachNote,
  type CoachOptions,
  type DecisionRecord,
  type GuidedStats,
  type MatchNumber,
  type ReadinessReport,
  type Review,
  type RuleCard,
} from '../coach';
import { SPEED_MS, type Prefs } from './prefs';
import { emptyProgress, type Progress } from './progress';
import { shouldStopForCall } from './moves';

export const HUMAN = 0;
export const PRACTICE_CARD_ID = 'practice';
const LOG_KEEP = 120;
const UNDO_KEEP = 40;
/**
 * Match 1's deal starts this close (tiles away) to a Consecutive Run line, the section that wins most
 * often, with that line the closest on the card. Typical deals on the practice card start 9 or 10 tiles
 * from the nearest Consecutive Run line (2,000 test deals), so 7 is well within reach.
 */
export const RUN_REACH = 7;
export const HINT_BUDGET = 6;

export type Mode = { kind: 'free' } | { kind: 'guided'; match: MatchNumber };
export const FREE_PLAY: Mode = { kind: 'free' };

export function sameMode(a: Mode, b: Mode): boolean {
  return a.kind === b.kind && (a.kind === 'free' || a.match === (b as { match: MatchNumber }).match);
}

export interface ModeSettings {
  /** "Match 1: open table" */
  label: string;
  /** Safety fixed by the match, or null to use your setting (free play). */
  safety: boolean | null;
  openRacks: boolean;
  undo: boolean;
  narrate: boolean;
  /** proactive: suggestions and feedback shown as you play; hints: tiered hints on request; off: none. */
  coach: 'proactive' | 'hints' | 'off';
  hintBudget: number | null;
  ruleCards: boolean;
  review: boolean;
  /** Match 1's Charleston fade: how many of the coach's tiles are chosen for you on each pass. */
  preselect: readonly number[];
}

export const MATCH_LABELS: Record<MatchNumber, string> = { 1: 'Match 1: open table', 2: 'Match 2: concealed table', 3: 'Match 3: dress rehearsal' };

export function modeSettings(mode: Mode, prefs: Prefs): ModeSettings {
  if (mode.kind === 'free') {
    const on = prefs.coachInFreePlay;
    return { label: 'Free play', safety: null, openRacks: false, undo: false, narrate: false, coach: on ? 'hints' : 'off', hintBudget: null, ruleCards: on, review: false, preselect: [] };
  }
  switch (mode.match) {
    case 1:
      return { label: MATCH_LABELS[1], safety: true, openRacks: true, undo: true, narrate: true, coach: 'proactive', hintBudget: null, ruleCards: true, review: true, preselect: [3, 2] };
    case 2:
      return { label: MATCH_LABELS[2], safety: true, openRacks: false, undo: false, narrate: false, coach: 'hints', hintBudget: null, ruleCards: true, review: true, preselect: [] };
    case 3:
      return { label: MATCH_LABELS[3], safety: false, openRacks: false, undo: false, narrate: false, coach: 'hints', hintBudget: HINT_BUDGET, ruleCards: true, review: true, preselect: [] };
  }
}

/**
 * Computer players for each mode (docs/07-app-spec.md section 7): match 1 gentle players (level 1) who
 * never declare Mah Jongg, labeled on screen as a practice setting; match 2 level 2 players who can win;
 * match 3 a mix of level 2 and level 3. Levels 1 and 3 are starting settings, tuned in build step 9.
 */
export function botsFor(mode: Mode, seed: string): Bot[] {
  if (mode.kind === 'free') return defaultBots(seed);
  const cfg = (seat: number) => (mode.match === 1 ? botConfig(1, { neverDeclare: true }) : mode.match === 3 && seat === 2 ? botConfig(3) : botConfig(2));
  return [0, 1, 2, 3].map((seat) => createBot(cfg(seat), botSeed(seed, seat)));
}

/** A seeded deal for match 1 whose rack starts within reach of a Consecutive Run line. */
export function match1Deal(sessionId: string): { seed: string; dealer: number } {
  for (let i = 0; i < 400; i++) {
    const seed = `${sessionId}-m1-${i}`;
    const dealer = (hashSeed(seed)[0] as number) % 4;
    const g = newGame({ seed, cardId: PRACTICE_CARD_ID, rules: { safety: true }, dealer });
    const lines = rankLines(readRack(seatView(g.state, HUMAN)), { hideConcealed: false }).filter((l) => !l.blocked);
    const run = lines.find((l) => l.section === 'Consecutive Run');
    if (run && run.away <= RUN_REACH && run.away <= (lines[0] as { away: number }).away) return { seed, dealer };
  }
  const seed = `${sessionId}-m1-0`;
  return { seed, dealer: (hashSeed(seed)[0] as number) % 4 };
}

export interface LogLine {
  n: number;
  text: string;
  /** event: something at the table; mine: your own move; alert: a dead hand; result: the end of a game; coach: an explanation. */
  tone: 'event' | 'mine' | 'alert' | 'result' | 'coach';
}

export interface Notice {
  text: string;
  /** referee: why a move isn't allowed; info: anything else. */
  tone: 'referee' | 'info';
  /** The move count when it was shown: it fades once play moves on. null = stays until your next move. */
  at: number | null;
}

/** The coach's part of a saved game. */
export interface CoachSave {
  pins: string[];
  stats: GuidedStats;
  playStarted: boolean;
  directionAsked: boolean;
  directionJudged: boolean;
  acrossStopped: boolean;
}

/** Everything needed to resume exactly where you left off. */
export interface SavedGame {
  v: 1;
  sessionId: string;
  state: GameState;
  log: LogLine[];
  lastDrawn: TileId | null;
  newestDiscard: { tile: TileId; seat: number } | null;
  /** Free play when missing (saves from before the guided matches). */
  mode?: Mode;
  coach?: CoachSave;
}

export interface SessionHost {
  /** Run fn after ms milliseconds; returns a function that cancels it. */
  schedule(fn: () => void, ms: number): () => void;
  /** Something changed: redraw the screen. */
  changed(): void;
  /** A good moment to save (the game is waiting for you, or it just ended). */
  save(game: SavedGame): void;
  /** Progress changed (a rule card was seen). */
  saveProgress?(progress: Progress): void;
  /** The time in milliseconds (for timing Charleston decisions). */
  now?(): number;
}

export interface SessionOptions {
  mode?: Mode;
  progress?: Progress;
}

export interface MatchResult {
  report: ReadinessReport;
  review: Review;
  stats: GuidedStats;
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

/** The referee codes whose repeat brings back the rule card that explains them. */
const RULE_FOR_SLIP: Record<string, string> = {
  jokerPass: 'charleston',
  blindNotAllowed: 'blindPass',
  claimTooSmall: 'calling',
  exposureMix: 'calling',
  exposureSize: 'calling',
  exposureLocked: 'afterCall',
  keepClaimed: 'afterCall',
  exchangeWrongTile: 'jokerExchange',
  exchangeJoker: 'jokerExchange',
  redeemedJoker: 'jokerExchange',
};

function lowerFirst(s: string): string {
  return s.charAt(0).toLowerCase() + s.slice(1);
}

function coachPick(note: CoachNote): string {
  return note.text.startsWith('Suggestion: ') ? `Coach's pick: ${lowerFirst(note.text.slice(12))}` : `Coach's pick: ${lowerFirst(note.text)}`;
}

function sameKinds(a: readonly TileId[], b: readonly TileId[]): boolean {
  const ka = a.map(kindOfTile).sort((x, y) => x - y);
  const kb = b.map(kindOfTile).sort((x, y) => x - y);
  return ka.length === kb.length && ka.every((k, i) => k === kb[i]);
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
  readonly mode: Mode;
  progress: Progress;
  /** Card lines you've pinned (hand ids), at most two. */
  pins: string[] = [];
  stats: GuidedStats = emptyStats();
  private playStarted = false;
  private directionAsked = false;
  private directionJudged = false;
  private acrossStopped = false;
  private bots: Bot[];
  private cancelTimer: (() => void) | null = null;
  private counter = 0;
  private savedKey = '';
  private host: SessionHost;
  private history: SavedGame[] = [];
  private noteCache: { key: string; note: CoachNote | null } = { key: '', note: null };
  private hintState = { key: '', tier: 0 };
  private decisionStart: { key: string; at: number } | null = null;
  private forcedRule: string | null = null;
  private slipCounts = new Map<string, number>();

  constructor(host: SessionHost, prefs: Prefs, saved?: SavedGame | null, opts: SessionOptions = {}) {
    this.host = host;
    this.prefs = prefs;
    this.progress = opts.progress ?? emptyProgress();
    this.mode = opts.mode ?? saved?.mode ?? FREE_PLAY;
    if (saved && !sameMode(saved.mode ?? FREE_PLAY, this.mode)) saved = null;
    const why = saved ? Session.whyNotRestorable(saved) : 'nothing saved';
    if (saved && why !== null && typeof console !== 'undefined') console.warn(`Starting a new game: the saved game could not be resumed (${why}).`);
    if (saved && why === null) {
      this.sessionId = saved.sessionId;
      this.state = saved.state;
      this.log = saved.log.slice(-LOG_KEEP);
      this.counter = this.log.reduce((m, l) => Math.max(m, l.n), 0);
      this.lastDrawn = saved.lastDrawn;
      this.newestDiscard = saved.newestDiscard;
      if (saved.coach) this.loadCoach(saved.coach);
      this.state = { ...this.state, rules: { ...this.state.rules, safety: this.safety } };
    } else {
      this.sessionId = randomId();
      this.state = this.deal();
    }
    this.bots = botsFor(this.mode, this.state.seed);
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

  get settings(): ModeSettings {
    return modeSettings(this.mode, this.prefs);
  }

  /** Safety for this game: fixed by a guided match, your setting in free play. */
  get safety(): boolean {
    return this.settings.safety ?? this.prefs.safety;
  }

  get match(): MatchNumber | null {
    return this.mode.kind === 'guided' ? this.mode.match : null;
  }

  serialize(): SavedGame {
    return {
      v: 1,
      sessionId: this.sessionId,
      state: this.state,
      log: this.log.slice(-LOG_KEEP),
      lastDrawn: this.lastDrawn,
      newestDiscard: this.newestDiscard,
      mode: this.mode,
      coach: {
        pins: [...this.pins],
        stats: JSON.parse(JSON.stringify(this.stats)) as GuidedStats,
        playStarted: this.playStarted,
        directionAsked: this.directionAsked,
        directionJudged: this.directionJudged,
        acrossStopped: this.acrossStopped,
      },
    };
  }

  private loadCoach(c: CoachSave): void {
    const card = getCard(this.state.cardId);
    this.pins = (c.pins ?? []).filter((id) => card.hands.some((h) => h.id === id)).slice(0, MAX_PINS);
    this.stats = { ...emptyStats(), ...(c.stats ?? {}) };
    this.playStarted = Boolean(c.playStarted);
    this.directionAsked = Boolean(c.directionAsked);
    this.directionJudged = Boolean(c.directionJudged);
    this.acrossStopped = Boolean(c.acrossStopped);
  }

  get myWind(): string {
    return windOf(this.state, HUMAN);
  }

  get busy(): boolean {
    return this.cancelTimer !== null;
  }

  /** One key per decision: it changes with every accepted move. */
  get decisionKey(): string {
    return `${this.sessionId}:${this.state.gameNumber}:${this.state.actionCount}`;
  }

  private now(): number {
    return this.host.now ? this.host.now() : Date.now();
  }

  // --- Your moves ---------------------------------------------------------------------------------

  /** Your move from the screen. Returns null when accepted, otherwise the referee's reason (also shown). */
  act(action: Action): string | null {
    const snapshot = this.settings.undo ? this.serialize() : null;
    const record = this.mode.kind === 'guided' && this.state.phase.name !== 'ended' ? this.judgeDecision(action) : null;
    const phaseBefore = this.state.phase.name;
    const r = apply(this.state, HUMAN, action);
    if (!r.ok) {
      this.noteSlip(r.violation);
      this.notice = { text: r.violation.message, tone: 'referee', at: this.state.actionCount };
      this.host.changed();
      return r.violation.message;
    }
    if (snapshot) {
      this.history.push(snapshot);
      if (this.history.length > UNDO_KEEP) this.history.shift();
    }
    if (record) this.stats.decisions.push(record);
    if ((phaseBefore === 'charleston' || phaseBefore === 'courtesyPass') && this.decisionStart?.key === this.decisionKey && this.mode.kind === 'guided')
      this.stats.charlestonMs.push(Math.min(120_000, Math.max(0, this.now() - this.decisionStart.at)));
    this.notice = null;
    this.commit(r.state, r.events, HUMAN, action);
    this.persist(); // saved before the computer players answer, so a reload never loses your move
    this.advance();
    return null;
  }

  /** A dimmed button was tapped: show the referee's reason, and count it when it breaks a real rule. */
  refused(reason: string, code?: string): void {
    if (code) this.noteSlip({ code, message: reason });
    this.explain(reason);
  }

  private noteSlip(v: Violation): void {
    if (this.mode.kind !== 'guided' || !RULE_SLIP_CODES.includes(v.code)) return;
    this.stats.slips.push({ code: v.code, message: v.message });
    const n = (this.slipCounts.get(v.code) ?? 0) + 1;
    this.slipCounts.set(v.code, n);
    // unprompted help only after a repeated error on the same skill (docs/05-teaching-plan.md section 7)
    if (n >= 2 && RULE_FOR_SLIP[v.code]) this.forcedRule = RULE_FOR_SLIP[v.code] as string;
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
    const before = this.safety;
    this.prefs = prefs;
    if (this.safety !== before) {
      this.state = { ...this.state, rules: { ...this.state.rules, safety: this.safety } };
      this.savedKey = '';
    }
    this.advance();
  }

  setProgress(p: Progress): void {
    this.progress = p;
  }

  // --- Undo (match 1) ------------------------------------------------------------------------------

  get canUndo(): boolean {
    return this.settings.undo && this.history.length > 0 && this.state.phase.name !== 'ended';
  }

  /** Take back your last move (the computer players then replay the same way). */
  undo(): boolean {
    if (!this.canUndo) return false;
    this.stop();
    const g = this.history.pop() as SavedGame;
    this.state = g.state;
    this.log = g.log;
    this.counter = this.log.reduce((m, l) => Math.max(m, l.n), this.counter);
    this.lastDrawn = g.lastDrawn;
    this.newestDiscard = g.newestDiscard;
    if (g.coach) this.loadCoach(g.coach);
    this.notice = { text: 'Your last move was taken back.', tone: 'info', at: this.state.actionCount };
    this.savedKey = '';
    this.advance();
    return true;
  }

  // --- New games ------------------------------------------------------------------------------------

  private deal(): GameState {
    let seed = gameSeed(this.sessionId, 1);
    let dealer = (hashSeed(seed)[0] as number) % 4; // like rolling dice for the first East
    if (this.mode.kind === 'guided' && this.mode.match === 1) ({ seed, dealer } = match1Deal(this.sessionId));
    const g = newGame({ seed, cardId: PRACTICE_CARD_ID, rules: { safety: this.safety }, dealer });
    this.state = g.state;
    this.startLines();
    this.record(g.events, -1, null);
    return g.state;
  }

  private resetCoach(): void {
    this.pins = [];
    this.stats = emptyStats();
    this.playStarted = false;
    this.directionAsked = false;
    this.directionJudged = false;
    this.acrossStopped = false;
    this.history = [];
    this.hintState = { key: '', tier: 0 };
    this.forcedRule = null;
    this.slipCounts.clear();
  }

  /** Start the next game of a free-play session: the deal passes to the right and scores carry over. */
  nextGame(): void {
    if (this.state.phase.name !== 'ended' || this.mode.kind === 'guided') return;
    this.stop();
    const seed = gameSeed(this.sessionId, this.state.gameNumber + 1);
    const g = nextGame(this.state, seed);
    this.state = { ...g.state, rules: { ...g.state.rules, safety: this.safety } };
    this.bots = botsFor(this.mode, seed);
    this.lastDrawn = null;
    this.newestDiscard = null;
    this.notice = null;
    this.resetCoach();
    this.startLines();
    this.record(g.events, -1, null);
    this.advance();
  }

  /** Start over: a new free-play session with scores at zero, or this guided match with a new deal. */
  newSession(): void {
    this.stop();
    this.sessionId = randomId();
    this.log = [];
    this.lastDrawn = null;
    this.newestDiscard = null;
    this.notice = null;
    this.resetCoach();
    this.state = this.deal();
    this.bots = botsFor(this.mode, this.state.seed);
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
    const p = this.state.phase;
    if ((p.name === 'charleston' || p.name === 'courtesyPass') && pendingSeats(this.state).includes(HUMAN) && this.decisionStart?.key !== this.decisionKey)
      this.decisionStart = { key: this.decisionKey, at: this.now() };
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

  private saveNow(): void {
    this.savedKey = '';
    this.persist();
  }

  private botMove(seat: number): void {
    const bot = this.bots[seat] as Bot;
    let action: Action;
    const view = seatView(this.state, seat);
    try {
      action = bot.decide(view);
    } catch {
      action = this.fallbackAction(seat);
    }
    const story = this.settings.narrate ? narrateBotMove(view, action) : null;
    if (!this.applyFor(seat, action)) this.applyFor(seat, this.fallbackAction(seat));
    else if (story) this.push(story, 'coach');
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
    const intro = this.mode.kind === 'guided' ? `${MATCH_LABELS[this.mode.match]}.` : `Game ${this.state.gameNumber}.`;
    this.push(`${intro} You are ${w}${dealer}.`, 'event');
    if (this.mode.kind === 'guided' && this.mode.match === 1)
      this.push("Practice setting: in this match the computer players never declare Mah Jongg, so you can always finish a hand.", 'coach');
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
      if (e.type === 'secondCharleston' && !e.played && e.stoppedBy.includes((HUMAN + 2) % 4)) this.acrossStopped = true;
      const text = describeEvent(e, ctx);
      if (!text) continue;
      const own =
        ('seat' in e && e.seat === HUMAN && e.type !== 'tilesReceived' && e.type !== 'dead') || e.type === 'tilesReceived';
      const tone: LogLine['tone'] = e.type === 'dead' ? 'alert' : e.type === 'gameEnd' ? 'result' : own ? 'mine' : 'event';
      this.push(text, tone);
    }
    if (events.some((e) => e.type === 'playStarts')) {
      this.playStarted = true;
      if (this.mode.kind === 'guided' && this.pins.length > 0) this.judgeDirection();
    }
    if (events.some((e) => e.type === 'dead' && e.seat === HUMAN)) this.stats.dead = true;
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

  // --- The coach -------------------------------------------------------------------------------------

  get coachOn(): boolean {
    return this.settings.coach !== 'off';
  }

  coachOptions(): CoachOptions {
    return { hideConcealed: this.prefs.hideConcealed, pinned: [...this.pins] };
  }

  /** The coach's note for your pending decision (null when nothing waits for you or the coach is off). */
  note(): CoachNote | null {
    if (!this.coachOn) return null;
    const key = `${this.decisionKey}|${this.pins.join(',')}|${this.prefs.hideConcealed}`;
    if (this.noteCache.key === key) return this.noteCache.note;
    const note = this.computeNote();
    this.noteCache = { key, note };
    return note;
  }

  private computeNote(): CoachNote | null {
    if (!pendingSeats(this.state).includes(HUMAN)) return null;
    const view = seatView(this.state, HUMAN);
    const legalCalls = this.state.phase.name === 'callWindow' ? callOptions(this.state, HUMAN) : undefined;
    try {
      return coachNote(view, this.coachOptions(), { ...(legalCalls ? { legalCalls } : {}), acrossStopped: this.acrossStopped });
    } catch {
      return null;
    }
  }

  pin(handId: string): boolean {
    if (this.pins.includes(handId)) return true;
    if (this.pins.length >= MAX_PINS) return false;
    if (!getCard(this.state.cardId).hands.some((h) => h.id === handId)) return false;
    this.pins = [...this.pins, handId];
    if (this.mode.kind === 'guided' && this.playStarted && !this.directionJudged) this.judgeDirection();
    this.saveNow();
    this.host.changed();
    return true;
  }

  unpin(handId: string): void {
    this.pins = this.pins.filter((p) => p !== handId);
    this.saveNow();
    this.host.changed();
  }

  /** Guided matches ask once, when play begins, which hand you're going for (if nothing is pinned). */
  get needsDirection(): boolean {
    return this.mode.kind === 'guided' && this.playStarted && this.pins.length === 0 && !this.directionAsked && !this.directionJudged && this.state.phase.name !== 'ended';
  }

  dismissDirection(): void {
    this.directionAsked = true;
    if (!this.directionJudged) this.judgeDirection();
    this.saveNow();
    this.host.changed();
  }

  /** Readiness check 3: is the hand you pinned when play began a direction the coach considers viable? */
  private judgeDirection(): void {
    this.directionJudged = true;
    const view = seatView(this.state, HUMAN);
    const rack = readRack(view);
    const opts = this.coachOptions();
    const pins = pinnedLines(rack, opts).sort((a, b) => Number(a.blocked) - Number(b.blocked) || a.away - b.away);
    const mine = pins[0];
    if (!mine) {
      this.stats.direction = null;
      return;
    }
    const best = rankLines(rack, opts).find((l) => !l.blocked);
    const viable = !mine.blocked && (!best || mine.away <= best.away + 2);
    const detail = mine.blocked
      ? `You chose ${mine.title}, but it needed tiles already used up on the table.`
      : viable
        ? `You chose ${mine.title}, ${mine.away} tiles away when play began${best && best.handId !== mine.handId ? `; the closest hand, ${best.title}, was ${best.away} away` : ''}.`
        : `You chose ${mine.title}, ${mine.away} tiles away when play began, while ${best?.title} was only ${best?.away} away.`;
    this.stats.direction = { titles: pins.map((p) => p.title), viable, detail };
  }

  /** Reveal the next hint tier for this decision. The answer tier waits until you've tried a choice. */
  hint(attempted: boolean): string | null {
    const note = this.note();
    if (!note) return null;
    if (this.hintState.key !== this.decisionKey) this.hintState = { key: this.decisionKey, tier: 0 };
    const tier = this.hintState.tier;
    if (tier >= 4) return note.tiers[3];
    const selection = note.topic === 'pass' || note.topic === 'courtesyPass' || (note.topic === 'turn' && note.choiceKey === 'discard');
    if (tier === 3 && selection && !attempted) return "Pick the tile you would choose first, then ask again to see the coach's answer.";
    const left = this.hintsLeft;
    if (left !== null && left <= 0) return 'No hints left in this match.';
    this.stats.hintsUsed++;
    this.hintState = { key: this.decisionKey, tier: tier + 1 };
    this.host.changed();
    return note.tiers[tier] as string;
  }

  /** Hint tiers revealed so far for this decision. */
  get hintsShown(): string[] {
    const note = this.note();
    if (!note || this.hintState.key !== this.decisionKey) return [];
    return note.tiers.slice(0, this.hintState.tier);
  }

  get hintsLeft(): number | null {
    const b = this.settings.hintBudget;
    return b === null ? null : Math.max(0, b - this.stats.hintsUsed);
  }

  /** Match 1's Charleston fade: the coach's tiles to start your selection with (all 3, then 2, then none). */
  preselect(): { tiles: TileId[]; blind: number } | null {
    const p = this.state.phase;
    if (p.name !== 'charleston' || !pendingSeats(this.state).includes(HUMAN)) return null;
    const n = this.settings.preselect[p.pass] ?? 0;
    if (n === 0) return null;
    const note = this.note();
    if (!note || note.topic !== 'pass') return null;
    return { tiles: note.tiles.slice(0, n), blind: n >= 3 ? note.blind : 0 };
  }

  /** Match 1's immediate feedback on what you've selected (null when there's nothing to say). */
  feedback(selected: readonly TileId[]): string | null {
    if (this.settings.coach !== 'proactive' || selected.length === 0) return null;
    try {
      return choiceFeedback(seatView(this.state, HUMAN), this.coachOptions(), selected);
    } catch {
      return null;
    }
  }

  /** The rule card to show now, if any (each appears the first time its situation comes up). */
  ruleCard(): RuleCard | null {
    if (!this.settings.ruleCards) return null;
    if (this.forcedRule) return RULE_CARDS[this.forcedRule] ?? null;
    const view = seatView(this.state, HUMAN);
    const p = this.state.phase;
    const hand = countsOf((this.state.players[HUMAN] as GameState['players'][number]).hand);
    const exchangeOpen = p.name === 'turn' && p.seat === HUMAN && exposedJokers(this.state).some((ej) => (hand[ej.kind] as number) > 0);
    const card = getCard(this.state.cardId);
    const concealedPinned = this.pins.some((id) => card.hands.find((h) => h.id === id)?.concealed);
    const keys = ruleCardsFor(view, { safetyOff: this.mode.kind === 'guided' && !this.safety, exchangeOpen, concealedPinned });
    const key = keys.find((k) => !this.progress.seenRules.includes(k));
    return key ? (RULE_CARDS[key] ?? null) : null;
  }

  dismissRule(key: string): void {
    if (this.forcedRule === key) this.forcedRule = null;
    if (!this.progress.seenRules.includes(key)) {
      this.progress = { ...this.progress, seenRules: [...this.progress.seenRules, key] };
      this.host.saveProgress?.(this.progress);
    }
    this.host.changed();
  }

  /** The readiness report and the coach's review, once a guided match has ended. */
  matchResult(): MatchResult | null {
    if (this.mode.kind !== 'guided' || this.state.phase.name !== 'ended') return null;
    const stats: GuidedStats = { ...this.stats, dead: this.stats.dead || (this.state.players[HUMAN] as GameState['players'][number]).dead !== null };
    return { report: readiness(this.mode.match, stats), review: buildReview(stats), stats };
  }

  /** Compare your move with the coach's suggestion, before it is made (for the review). */
  private judgeDecision(action: Action): DecisionRecord | null {
    const note = (() => {
      try {
        const view = seatView(this.state, HUMAN);
        const legalCalls = this.state.phase.name === 'callWindow' ? callOptions(this.state, HUMAN) : undefined;
        return coachNote(view, this.coachOptions(), { ...(legalCalls ? { legalCalls } : {}), acrossStopped: this.acrossStopped });
      } catch {
        return null;
      }
    })();
    if (!note) return null;
    const view = seatView(this.state, HUMAN);
    const opts = this.coachOptions();
    const wall = this.state.wall.length;
    const base = { topic: note.topic, wall, coach: coachPick(note) };
    const p = this.state.phase;
    switch (action.type) {
      case 'charlestonPass':
      case 'courtesyPass': {
        const blind = action.type === 'charlestonPass' ? (action.blind ?? 0) : 0;
        const kinds = action.tiles.map(kindOfTile);
        const what = kinds.length > 0 ? tileList(kinds) : 'nothing from your rack';
        const did = action.type === 'courtesyPass' ? `In the courtesy pass you gave ${what}.` : `You passed ${what}${blind ? ` and ${blind} blind` : ''}.`;
        const followed = sameKinds(action.tiles, note.tiles) && blind === note.blind;
        return { ...base, did, loss: followed ? 0 : passLoss(view, opts, action.tiles), note: followed ? null : choiceFeedback(view, opts, action.tiles), followed };
      }
      case 'discard': {
        const k = kindOfTile(action.tile);
        const did = `You discarded the ${tileWord(k)}.`;
        if (note.choiceKey === 'mahjong') return { ...base, did, loss: 1, note: 'You had Mah Jongg and could have declared it.', followed: false };
        if (note.choiceKey?.startsWith('exchange-'))
          return { ...base, did, loss: 0.2, note: 'Before discarding, you could have taken an exposed joker by exchange.', followed: false };
        const followed = note.tiles[0] !== undefined && kindOfTile(note.tiles[0]) === k;
        if (followed) return { ...base, did, loss: 0, note: null, followed };
        const pinned = pinnedNeeding(view, opts, k)[0];
        const warn = feedingWarning(view, getCard(this.state.cardId), k);
        const lesson = pinned ? `Your pinned hand, ${pinned.title}, used it.` : warn ? warn.replace(/^Careful: /, 'It was risky: ') : null;
        return { ...base, did, loss: discardLoss(view, opts, k), note: lesson, followed };
      }
      case 'claimMahjong':
        return { ...base, did: 'You called Mah Jongg.', loss: 0, note: null, followed: true };
      case 'claimExposure': {
        if (p.name !== 'callWindow') return null;
        const size = action.tiles.length + 1;
        const jokers = action.tiles.filter((t) => kindOfTile(t) === JOKER).length;
        const followed = note.choiceKey === `expose-${size}-${jokers}`;
        const did = `You called the ${tileWord(kindOfTile(p.tile))}.`;
        return { ...base, did, loss: followed ? 0 : note.choiceKey === 'pass' ? 0.2 : 0.1, note: followed || note.choiceKey !== 'pass' ? null : `The coach would have passed: ${lowerFirst(note.why)}`, followed };
      }
      case 'pass': {
        if (p.name !== 'callWindow') return null;
        const did = `You passed on the ${tileWord(kindOfTile(p.tile))}.`;
        if (note.choiceKey === 'mahjong') return { ...base, did, loss: 1, note: 'It completed your hand: you could have called Mah Jongg.', followed: false };
        const followed = note.choiceKey === 'pass';
        return { ...base, did, loss: followed ? 0 : 0.2, note: null, followed };
      }
      case 'jokerExchange':
        return { ...base, did: 'You took an exposed joker by exchange.', loss: 0, note: null, followed: note.choiceKey === `exchange-${action.owner}-${action.exposure}` };
      case 'declareMahjong':
        return { ...base, did: 'You declared Mah Jongg.', loss: 0, note: null, followed: true };
      case 'charlestonVote':
        return { ...base, did: action.continue ? 'You voted to keep going.' : 'You voted to stop the Charleston.', loss: 0, note: null, followed: note.choiceKey === (action.continue ? 'vote-yes' : 'vote-no') };
      case 'courtesyOffer':
        return { ...base, did: `You offered ${action.count} in the courtesy pass.`, loss: 0, note: null, followed: note.choiceKey === `offer-${action.count}` };
      default:
        return null;
    }
  }
}
