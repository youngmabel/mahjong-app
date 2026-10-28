/**
 * The referee. Every move, by the human or a computer opponent, goes through apply(state, seat, action).
 * It returns either the new state plus what happened (events), or a violation: a short plain-English
 * reason the move isn't allowed. Illegal moves are prevented, never punished.
 *
 * Game flow (docs/07-app-spec.md section 6; rules from docs/01-rules.md):
 *   deal (East 14, others 13) -> Heavenly Hand check -> Charleston: right, across, left (blind pass
 *   allowed on the left) -> vote (any player may stop) -> second Charleston: left, across, right (blind
 *   pass allowed on the last right) -> courtesy pass (lower of the two offers) -> play: East discards
 *   first -> call window after each discard (Mah Jongg beats exposure; ties go to the seat next in turn)
 *   -> claimer exposes and discards, or the next player draws -> Mah Jongg, or a wall game.
 */

import { getCard, type Card, type Target } from './card';
import {
  completedTargets,
  exposureOptions,
  mahjongTargetsWith,
  officialDeadReason,
  prepareExposures,
  type ExposedJoker,
  type ExposureInfo,
  type ExposureOption,
  type PublicTable,
} from './matcher';
import { Rng, streamSeed } from './rng';
import { makeRules, type RuleOptions } from './rules';
import { mahjongPayments } from './scoring';
import type {
  Action,
  ApplyResult,
  CallResponse,
  DeadCode,
  Exposure,
  GameEvent,
  GameResult,
  GameState,
  Phase,
  Violation,
  WinHow,
} from './state';
import { JOKER, NUM_KINDS, SUPPLY, TILE_COUNT, allTileIds, countsOf, emptyCounts, kindName, kindNamePlural, kindOfTile, type Kind, type TileId } from './tiles';

export const WIND_NAMES = ['East', 'South', 'West', 'North'] as const;

/** Charleston passes in order, as offsets to the receiving seat: right +1, across +2, left +3. */
export const PASS_OFFSETS = [1, 2, 3, 3, 2, 1] as const;
export const PASS_NAMES = ['first right', 'first across', 'first left', 'second left', 'second across', 'last right'] as const;
/** Blind passes are allowed only on the first left and the last right. [H] docs/01-rules.md section 4 */
export const BLIND_PASSES: readonly number[] = [2, 5];

export function windOf(state: Pick<GameState, 'dealer'>, seat: number): string {
  return WIND_NAMES[(seat - state.dealer + 4) % 4] as string;
}

function fail(code: string, message: string): ApplyResult {
  return { ok: false, violation: { code, message } };
}
function violation(code: string, message: string): Violation {
  return { code, message };
}

export interface NewGameOptions {
  seed: string;
  cardId: string;
  rules?: Partial<RuleOptions>;
  dealer?: number;
  gameNumber?: number;
  scores?: number[];
}

/** Shuffle with the seed's wall stream, deal East 14 and everyone else 13, and check for a Heavenly Hand. */
export function newGame(opts: NewGameOptions): { state: GameState; events: GameEvent[] } {
  const card = getCard(opts.cardId);
  const dealer = opts.dealer ?? 0;
  const wall = Rng.fromSeed(streamSeed(opts.seed, 'wall')).shuffle(allTileIds());
  const players = [0, 1, 2, 3].map(() => ({ hand: [] as TileId[], exposures: [] as Exposure[], dead: null }));
  for (let i = 0; i < 4; i++) {
    const seat = (dealer + i) % 4;
    const n = i === 0 ? 14 : 13;
    (players[seat] as { hand: TileId[] }).hand = wall.splice(0, n);
  }
  const state: GameState = {
    version: 1,
    seed: opts.seed,
    cardId: opts.cardId,
    rules: makeRules(opts.rules),
    gameNumber: opts.gameNumber ?? 1,
    dealer,
    scores: opts.scores ? [...opts.scores] : [0, 0, 0, 0],
    wall,
    players,
    floor: [],
    phase: { name: 'charleston', pass: 0, selections: [null, null, null, null] },
    rng: Rng.fromSeed(streamSeed(opts.seed, 'engine')).getState(),
    actionCount: 0,
  };
  const dealerHand = countsOf((state.players[dealer] as { hand: TileId[] }).hand);
  if (completedTargets(card, dealerHand, []).length > 0) state.phase = { name: 'heavenly' };
  return { state, events: [{ type: 'deal', dealer }] };
}

/** The next game of a session: the deal passes to the right, and session scores carry over. */
export function nextGame(prev: GameState, seed: string): { state: GameState; events: GameEvent[] } {
  let dealer = (prev.dealer + 1) % 4;
  if (prev.phase.name === 'ended' && prev.phase.result.type === 'threeDead' && prev.rules.threeDeadDeal === 'sameDealer') dealer = prev.dealer;
  return newGame({ seed, cardId: prev.cardId, rules: prev.rules, dealer, gameNumber: prev.gameNumber + 1, scores: prev.scores });
}

/** Seats whose answer the referee is waiting for. */
export function pendingSeats(state: GameState): number[] {
  const p = state.phase;
  switch (p.name) {
    case 'heavenly':
      return [state.dealer];
    case 'charleston':
      return [0, 1, 2, 3].filter((s) => p.selections[s] === null);
    case 'vote':
      return [0, 1, 2, 3].filter((s) => p.votes[s] === null);
    case 'courtesyOffer':
      return [0, 1, 2, 3].filter((s) => p.offers[s] === null);
    case 'courtesyPass':
      return [0, 1, 2, 3].filter((s) => p.selections[s] === null);
    case 'turn':
      return [p.seat];
    case 'callWindow':
      return p.eligible.filter((s) => p.responses[s] === null);
    case 'ended':
      return [];
  }
}

// ---------------------------------------------------------------------------------------------
// Helpers on state

export function exposureInfo(e: Exposure): ExposureInfo {
  let jokers = 0;
  for (const id of e.tiles) if (kindOfTile(id) === JOKER) jokers++;
  return { kind: e.kind, size: e.tiles.length, jokers };
}

export function playerExposureInfo(state: GameState, seat: number): ExposureInfo[] {
  return (state.players[seat] as GameState['players'][number]).exposures.map(exposureInfo);
}

/** What everyone can see: all discards on the table and every exposed tile. */
export function publicTable(state: GameState): PublicTable {
  const visibleNaturals = emptyCounts();
  let discardedJokers = 0;
  for (const f of state.floor) {
    const k = kindOfTile(f.tile);
    if (k === JOKER) discardedJokers++;
    else visibleNaturals[k]++;
  }
  for (const pl of state.players)
    for (const e of pl.exposures)
      for (const id of e.tiles) {
        const k = kindOfTile(id);
        if (k !== JOKER) visibleNaturals[k]++;
      }
  return { visibleNaturals, discardedJokers };
}

/** Every exposed joker, with the tile it stands for. */
export function exposedJokers(state: GameState): ExposedJoker[] {
  const out: ExposedJoker[] = [];
  state.players.forEach((pl, seat) =>
    pl.exposures.forEach((e, exposureIndex) => {
      if (e.tiles.some((id) => kindOfTile(id) === JOKER)) out.push({ seat, exposureIndex, kind: e.kind });
    }),
  );
  return out;
}

export function isLive(state: GameState, seat: number): boolean {
  return (state.players[seat] as GameState['players'][number]).dead === null;
}

function nextLiveSeat(state: GameState, after: number): number | null {
  for (let i = 1; i <= 4; i++) {
    const q = (after + i) % 4;
    if (isLive(state, q)) return q;
  }
  return null;
}

/** Legal calls for a seat during a call window (used by the screen and the computer opponents). */
export function callOptions(state: GameState, seat: number): { mahjong: boolean; exposures: ExposureOption[] } {
  const p = state.phase;
  if (p.name !== 'callWindow' || !p.eligible.includes(seat)) return { mahjong: false, exposures: [] };
  const card = getCard(state.cardId);
  const pl = state.players[seat] as GameState['players'][number];
  const counts = countsOf(pl.hand);
  const kind = kindOfTile(p.tile);
  const exp = pl.exposures.map(exposureInfo);
  const mahjong = mahjongTargetsWith(card, counts, exp, kind).length > 0;
  let exposures = exposureOptions(card, counts, exp, kind);
  if (state.wall.length === 0 && state.rules.lastDiscard === 'mahjongOnly') exposures = [];
  if (state.rules.safety) exposures = exposures.filter((o) => o.fitsCard && exposureDeadReason(state, seat, kind, o.size, o.jokers) === null);
  return { mahjong, exposures };
}

/**
 * Would this player's hand be officially dead with these exposures? `addedNaturals` is how many more real
 * tiles of `kind` become visible (moved from the hidden rack into the exposure). null = not dead.
 */
function deadReasonWith(state: GameState, exposures: ExposureInfo[], kind: Kind, addedNaturals: number): DeadCode | null {
  const card = getCard(state.cardId);
  const table = publicTable(state);
  const visible = Array.from(table.visibleNaturals);
  visible[kind] = (visible[kind] as number) + addedNaturals;
  return officialDeadReason(card, prepareExposures(exposures), { visibleNaturals: visible, discardedJokers: table.discardedJokers });
}

/** If this player claimed the current discard for this exposure, would their hand be officially dead? (null = no) */
export function exposureDeadReason(state: GameState, seat: number, kind: Kind, size: number, jokers: number): DeadCode | null {
  // the claimed tile was already visible on the floor; the real tiles from the rack become visible too
  return deadReasonWith(state, [...playerExposureInfo(state, seat), { kind, size, jokers }], kind, size - 1 - jokers);
}

// ---------------------------------------------------------------------------------------------
// The referee

interface Ctx {
  s: GameState;
  card: Card;
  events: GameEvent[];
}

/** Copy plain game data (numbers, strings, arrays, objects). Faster than structuredClone for small states. */
export function cloneState<T>(v: T): T {
  if (Array.isArray(v)) {
    const out = new Array(v.length);
    for (let i = 0; i < v.length; i++) out[i] = cloneState(v[i]);
    return out as T;
  }
  if (v !== null && typeof v === 'object') {
    const out: Record<string, unknown> = {};
    for (const k of Object.keys(v)) out[k] = cloneState((v as Record<string, unknown>)[k]);
    return out as T;
  }
  return v;
}

export function apply(state: GameState, seat: number, action: Action): ApplyResult {
  if (state.phase.name === 'ended') return fail('gameOver', 'This game is over. Start the next game to keep playing.');
  if (!Number.isInteger(seat) || seat < 0 || seat > 3) return fail('badSeat', 'There is no such seat.');
  const notPending = notPendingReason(state, seat);
  if (notPending) return { ok: false, violation: notPending };
  const s: GameState = cloneState(state);
  const ctx: Ctx = { s, card: getCard(s.cardId), events: [] };
  const v = dispatch(ctx, seat, action);
  if (v) return { ok: false, violation: v };
  s.actionCount++;
  return { ok: true, state: s, events: ctx.events };
}

function notPendingReason(state: GameState, seat: number): Violation | null {
  if (pendingSeats(state).includes(seat)) return null;
  const p = state.phase;
  const w = (x: number) => windOf(state, x);
  switch (p.name) {
    case 'heavenly':
      return violation('waitForDealer', `${w(state.dealer)} was dealt a complete hand and is deciding whether to declare it.`);
    case 'charleston':
    case 'courtesyPass':
      return violation('alreadyPassed', 'You have already chosen your tiles for this pass. Waiting for the other players.');
    case 'vote':
    case 'courtesyOffer':
      return violation('alreadyAnswered', 'You have already answered. Waiting for the other players.');
    case 'turn':
      if (!isLive(state, seat)) return violation('deadHand', 'Your hand is dead, so you no longer pick or discard. You still pay the winner.');
      return violation('notYourTurn', `It's ${w(p.seat)}'s turn.`);
    case 'callWindow':
      if (seat === p.discarder) return violation('ownDiscard', "You can't claim your own discard.");
      if (!isLive(state, seat)) return violation('deadHand', 'Your hand is dead, so you can no longer claim discards.');
      return violation('alreadyAnswered', "You've already answered for this discard.");
    case 'ended':
      return violation('gameOver', 'This game is over.');
  }
}

function dispatch(ctx: Ctx, seat: number, action: Action): Violation | null {
  const p = ctx.s.phase;
  switch (p.name) {
    case 'heavenly':
      return onHeavenly(ctx, seat, action);
    case 'charleston':
      return onCharleston(ctx, p, seat, action);
    case 'vote':
      return onVote(ctx, p, seat, action);
    case 'courtesyOffer':
      return onCourtesyOffer(ctx, p, seat, action);
    case 'courtesyPass':
      return onCourtesyPass(ctx, p, seat, action);
    case 'turn':
      return onTurn(ctx, p, seat, action);
    case 'callWindow':
      return onCallWindow(ctx, p, seat, action);
    case 'ended':
      return violation('gameOver', 'This game is over.');
  }
}

function hand(ctx: Ctx, seat: number): TileId[] {
  return (ctx.s.players[seat] as GameState['players'][number]).hand;
}

function checkOwnTiles(ctx: Ctx, seat: number, tiles: readonly TileId[]): Violation | null {
  const h = new Set(hand(ctx, seat));
  if (new Set(tiles).size !== tiles.length) return violation('duplicateTile', 'Each tile can be chosen only once.');
  for (const t of tiles) if (!h.has(t)) return violation('tileNotInHand', "That tile isn't on your rack.");
  return null;
}

function removeTiles(list: TileId[], tiles: readonly TileId[]): void {
  for (const t of tiles) {
    const i = list.indexOf(t);
    if (i < 0) throw new Error(`internal: tile ${t} missing`);
    list.splice(i, 1);
  }
}

function wrongAction(what: string): Violation {
  return violation('wrongAction', what);
}

// --- Heavenly Hand --------------------------------------------------------------------------------

function onHeavenly(ctx: Ctx, seat: number, action: Action): Violation | null {
  if (action.type === 'declareMahjong') {
    const targets = completedTargets(ctx.card, countsOf(hand(ctx, seat)), []);
    const best = targets[0];
    if (!best) return violation('notComplete', "Your tiles don't match any hand on the card.");
    endMahjong(ctx, seat, 'heavenly', best, null);
    return null;
  }
  if (action.type === 'proceed') {
    ctx.events.push({ type: 'heavenlyDeclined', seat });
    ctx.s.phase = { name: 'charleston', pass: 0, selections: [null, null, null, null] };
    return null;
  }
  return wrongAction('You were dealt a complete hand: declare Mah Jongg now (a Heavenly Hand), or carry on to the Charleston.');
}

// --- Charleston -----------------------------------------------------------------------------------

const JOKER_PASS_MESSAGE = 'Jokers can never be passed, in any Charleston pass or the courtesy pass. Choose a different tile.';

function onCharleston(ctx: Ctx, p: Extract<Phase, { name: 'charleston' }>, seat: number, action: Action): Violation | null {
  if (action.type !== 'charlestonPass') return wrongAction(`Choose 3 tiles to pass ${PASS_NAMES[p.pass]}.`);
  const blind = action.blind ?? 0;
  if (!Number.isInteger(blind) || blind < 0 || blind > 3) return violation('badBlind', 'A blind pass forwards 1 to 3 of the incoming tiles.');
  if (blind > 0 && !BLIND_PASSES.includes(p.pass))
    return violation('blindNotAllowed', 'A blind pass is allowed only on the first left and the last right. Choose 3 tiles from your rack.');
  if (action.tiles.length !== 3 - blind) {
    return violation(
      'passCount',
      blind > 0
        ? `Every pass is exactly 3 tiles: with ${blind} passed blind, choose ${3 - blind} from your rack.`
        : 'Every Charleston pass is exactly 3 tiles.',
    );
  }
  const own = checkOwnTiles(ctx, seat, action.tiles);
  if (own) return own;
  if (action.tiles.some((t) => kindOfTile(t) === JOKER)) return violation('jokerPass', JOKER_PASS_MESSAGE);
  p.selections[seat] = { tiles: [...action.tiles], blind };
  if (p.selections.every((x) => x !== null)) resolveCharlestonPass(ctx, p);
  return null;
}

/**
 * Move the tiles of one pass. Without blind passes everyone simply hands 3 tiles on. With blind passes,
 * a player forwards some of the tiles coming to them, unseen, so passes happen in a chain. If every
 * player passes blind, nobody can start: the IOU method (2020 League rule, as Sloper describes it) has
 * the dealer pass their own tiles first and owe the blind ones until tiles come back around. [M]
 */
function resolveCharlestonPass(ctx: Ctx, p: Extract<Phase, { name: 'charleston' }>): void {
  const s = ctx.s;
  const offset = PASS_OFFSETS[p.pass] as number;
  const sel = p.selections as { tiles: TileId[]; blind: number }[];
  const receiver = (i: number) => (i + offset) % 4;
  const sender = (i: number) => (i - offset + 4) % 4;
  const rng = new Rng(s.rng);
  const pool: TileId[][] = [[], [], [], []];
  for (let i = 0; i < 4; i++) removeTiles(hand(ctx, i), (sel[i] as { tiles: TileId[] }).tiles);
  const blind = sel.map((x) => x.blind);
  // Pass order starting at the dealer. Blind passes happen only on left and right passes, where the
  // four seats form one circle; across passes (two swaps) never take the blind branch.
  const order = offset === 2 ? [0, 1, 2, 3].map((i) => (s.dealer + i) % 4) : [0, 1, 2, 3].map((i) => (s.dealer + i * offset) % 4);
  let iou = false;
  if (blind.every((b) => b === 0)) {
    for (let i = 0; i < 4; i++) (pool[receiver(i)] as TileId[]).push(...(sel[i] as { tiles: TileId[] }).tiles);
  } else {
    const sent = [false, false, false, false];
    for (;;) {
      let progress = false;
      for (const i of order) {
        if (sent[i] || !((blind[i] as number) === 0 || sent[sender(i)])) continue;
        const picks = rng.sample(pool[i] as TileId[], blind[i] as number);
        removeTiles(pool[i] as TileId[], picks);
        (pool[receiver(i)] as TileId[]).push(...(sel[i] as { tiles: TileId[] }).tiles, ...picks);
        sent[i] = true;
        progress = true;
      }
      if (sent.every(Boolean)) break;
      if (!progress) {
        iou = true;
        break;
      }
    }
    if (iou) {
      const owed = [...blind];
      const give = (i: number) => {
        const n = Math.min(owed[i] as number, (pool[i] as TileId[]).length);
        const picks = rng.sample(pool[i] as TileId[], n);
        removeTiles(pool[i] as TileId[], picks);
        owed[i] = (owed[i] as number) - n;
        (pool[receiver(i)] as TileId[]).push(...picks);
        return n > 0;
      };
      for (const i of order) {
        give(i);
        (pool[receiver(i)] as TileId[]).push(...(sel[i] as { tiles: TileId[] }).tiles);
      }
      for (let progress = true; progress; ) {
        progress = false;
        for (const i of order) if ((owed[i] as number) > 0 && give(i)) progress = true;
      }
      // Debts that can never be paid (only when nothing real moved, e.g. everyone blind passed 3) are cancelled.
    }
  }
  s.rng = rng.getState();
  for (let i = 0; i < 4; i++) hand(ctx, i).push(...(pool[i] as TileId[]));
  ctx.events.push({ type: 'charlestonPassed', pass: p.pass, blind, iou });
  for (let i = 0; i < 4; i++) ctx.events.push({ to: i, type: 'tilesReceived', seat: i, tiles: [...(pool[i] as TileId[])], pass: p.pass });
  if (p.pass === 2) s.phase = { name: 'vote', votes: [null, null, null, null] };
  else if (p.pass === 5) s.phase = { name: 'courtesyOffer', offers: [null, null, null, null] };
  else s.phase = { name: 'charleston', pass: p.pass + 1, selections: [null, null, null, null] };
}

function onVote(ctx: Ctx, p: Extract<Phase, { name: 'vote' }>, seat: number, action: Action): Violation | null {
  if (action.type !== 'charlestonVote') return wrongAction('Vote whether to play the second Charleston (any one player may stop it).');
  p.votes[seat] = action.continue;
  if (p.votes.some((v) => v === null)) return null;
  const stoppedBy = [0, 1, 2, 3].filter((i) => p.votes[i] === false);
  const played = stoppedBy.length === 0;
  ctx.events.push({ type: 'secondCharleston', played, stoppedBy });
  ctx.s.phase = played
    ? { name: 'charleston', pass: 3, selections: [null, null, null, null] }
    : { name: 'courtesyOffer', offers: [null, null, null, null] };
  return null;
}

function onCourtesyOffer(ctx: Ctx, p: Extract<Phase, { name: 'courtesyOffer' }>, seat: number, action: Action): Violation | null {
  if (action.type !== 'courtesyOffer') return wrongAction('Say how many tiles (0 to 3) you would like to trade with the player across.');
  if (!Number.isInteger(action.count) || action.count < 0 || action.count > 3)
    return violation('courtesyCount', 'The courtesy pass is 0 to 3 tiles with the player across.');
  p.offers[seat] = action.count;
  if (p.offers.some((o) => o === null)) return null;
  const agreed = [0, 1, 2, 3].map((i) => Math.min(p.offers[i] as number, p.offers[(i + 2) % 4] as number));
  ctx.events.push({ type: 'courtesyAgreed', seats: [0, 2], count: agreed[0] as number });
  ctx.events.push({ type: 'courtesyAgreed', seats: [1, 3], count: agreed[1] as number });
  if (agreed.every((a) => a === 0)) startPlay(ctx);
  else ctx.s.phase = { name: 'courtesyPass', agreed, selections: agreed.map((a) => (a === 0 ? [] : null)) };
  return null;
}

function onCourtesyPass(ctx: Ctx, p: Extract<Phase, { name: 'courtesyPass' }>, seat: number, action: Action): Violation | null {
  const n = p.agreed[seat] as number;
  if (action.type !== 'courtesyPass') return wrongAction(`Choose ${n} tile${n === 1 ? '' : 's'} for the courtesy pass.`);
  if (action.tiles.length !== n)
    return violation('courtesyCount', `You and the player across agreed on ${n} tile${n === 1 ? '' : 's'} (the lower of your two offers).`);
  const own = checkOwnTiles(ctx, seat, action.tiles);
  if (own) return own;
  if (action.tiles.some((t) => kindOfTile(t) === JOKER)) return violation('jokerPass', JOKER_PASS_MESSAGE);
  p.selections[seat] = [...action.tiles];
  if (p.selections.some((x) => x === null)) return null;
  for (let i = 0; i < 4; i++) removeTiles(hand(ctx, i), p.selections[i] as TileId[]);
  for (let i = 0; i < 4; i++) {
    const got = p.selections[(i + 2) % 4] as TileId[];
    hand(ctx, i).push(...got);
    if (got.length > 0) ctx.events.push({ to: i, type: 'tilesReceived', seat: i, tiles: [...got], pass: 'courtesy' });
  }
  startPlay(ctx);
  return null;
}

function startPlay(ctx: Ctx): void {
  ctx.events.push({ type: 'playStarts', dealer: ctx.s.dealer });
  ctx.s.phase = { name: 'turn', seat: ctx.s.dealer, source: 'deal', from: null, exchanged: false, redeemed: [] };
}

// --- A player's turn -------------------------------------------------------------------------------

function onTurn(ctx: Ctx, p: Extract<Phase, { name: 'turn' }>, seat: number, action: Action): Violation | null {
  const s = ctx.s;
  const pl = s.players[seat] as GameState['players'][number];
  switch (action.type) {
    case 'declareMahjong': {
      const targets = completedTargets(ctx.card, countsOf(pl.hand), pl.exposures.map(exposureInfo));
      const best = targets[0];
      if (!best) return violation('notComplete', "Your tiles don't match any hand on the card yet, so you can't declare Mah Jongg.");
      let how: WinHow;
      let from: number | null = null;
      if (p.source === 'deal') how = 'eastFirst';
      else if (p.source === 'draw') how = 'selfDraw';
      else if (p.exchanged && s.rules.jokerExchangeWin === 'selfPick') how = 'jokerExchange';
      else {
        how = 'discard';
        from = p.from;
      }
      endMahjong(ctx, seat, how, best, from);
      return null;
    }
    case 'jokerExchange': {
      if (!pl.hand.includes(action.tile)) return violation('tileNotInHand', "That tile isn't on your rack.");
      const kind = kindOfTile(action.tile);
      if (kind === JOKER) return violation('exchangeJoker', 'Trade a real tile for a joker, not a joker for a joker.');
      const owner = s.players[action.owner];
      const exp = owner?.exposures[action.exposure];
      if (!owner || !exp) return violation('noSuchExposure', "There's no such exposure.");
      const jokerId = [...exp.tiles].reverse().find((id) => kindOfTile(id) === JOKER);
      if (jokerId === undefined) return violation('noJoker', 'That exposure has no joker to take.');
      if (exp.kind !== kind)
        return violation(
          'exchangeWrongTile',
          `That joker stands for a ${kindName(exp.kind)}, so only a real ${kindName(exp.kind)} can take it.`,
        );
      removeTiles(pl.hand, [action.tile]);
      exp.tiles[exp.tiles.indexOf(jokerId)] = action.tile;
      pl.hand.push(jokerId);
      if (s.rules.exposureLock === 'discardOrExchange') for (const e of pl.exposures) e.locked = true;
      p.exchanged = true;
      p.redeemed.push(jokerId);
      ctx.events.push({ type: 'jokerExchange', seat, owner: action.owner, exposure: action.exposure, kind });
      afterPublicChange(ctx);
      return null;
    }
    case 'amendExposure':
      return amendExposure(ctx, p, seat, action);
    case 'discard': {
      if (!pl.hand.includes(action.tile)) return violation('tileNotInHand', "That tile isn't on your rack.");
      removeTiles(pl.hand, [action.tile]);
      s.floor.push({ tile: action.tile, seat });
      for (const e of pl.exposures) e.locked = true;
      ctx.events.push({ type: 'discard', seat, tile: action.tile });
      if (kindOfTile(action.tile) === JOKER) {
        // A discarded joker is dead: no one may claim it, so no call window opens.
        s.phase = { name: 'callWindow', tile: action.tile, discarder: seat, eligible: [], responses: [null, null, null, null] };
      } else {
        const eligible = [1, 2, 3].map((i) => (seat + i) % 4).filter((q) => isLive(s, q));
        s.phase = { name: 'callWindow', tile: action.tile, discarder: seat, eligible, responses: [null, null, null, null] };
      }
      afterPublicChange(ctx);
      return null;
    }
    default:
      return wrongAction(
        p.source === 'deal'
          ? 'As East you start with 14 tiles: declare Mah Jongg if your hand is complete, otherwise discard one tile (no draw).'
          : 'Your turn: discard a tile, exchange for an exposed joker, or declare Mah Jongg.',
      );
  }
}

function amendExposure(ctx: Ctx, p: Extract<Phase, { name: 'turn' }>, seat: number, action: Extract<Action, { type: 'amendExposure' }>): Violation | null {
  const s = ctx.s;
  const pl = s.players[seat] as GameState['players'][number];
  const exp = pl.exposures[action.exposure];
  if (!exp) return violation('noSuchExposure', "There's no such exposure.");
  if (exp.locked)
    return violation(
      'exposureLocked',
      s.rules.exposureLock === 'discardOrExchange'
        ? 'That exposure is locked: an exposure can be changed only until you discard or start a joker exchange.'
        : 'That exposure is locked: an exposure can be changed only until you discard.',
    );
  const tiles = action.tiles;
  if (new Set(tiles).size !== tiles.length) return violation('duplicateTile', 'Each tile can be used only once.');
  if (!tiles.includes(exp.claimedTile)) return violation('keepClaimed', 'The tile you claimed has to stay in the exposure.');
  const available = new Set([...pl.hand, ...exp.tiles]);
  for (const t of tiles) {
    if (!available.has(t)) return violation('tileNotInHand', "That tile isn't on your rack.");
    const k = kindOfTile(t);
    if (k !== exp.kind && k !== JOKER) return violation('exposureMix', `This exposure can hold only ${kindNamePlural(exp.kind)} and jokers.`);
    if (p.redeemed.includes(t)) return violation('redeemedJoker', "A joker you just took by exchange can't join an exposure made this turn.");
  }
  if (tiles.length < 3 || tiles.length > 6) return violation('exposureSize', 'An exposure is a pung, kong, quint or sextet (3 to 6 tiles).');
  const jokers = tiles.filter((t) => kindOfTile(t) === JOKER).length;
  if (s.rules.safety) {
    const others = pl.exposures.filter((_, i) => i !== action.exposure).map(exposureInfo);
    const oldNaturals = exp.tiles.length - exposureInfo(exp).jokers;
    const reason = deadReasonWith(s, [...others, { kind: exp.kind, size: tiles.length, jokers }], exp.kind, tiles.length - jokers - oldNaturals);
    if (reason) return violation('exposureKillsHand', exposureKillsMessage(reason));
  }
  const back = exp.tiles.filter((t) => !tiles.includes(t));
  const taken = tiles.filter((t) => !exp.tiles.includes(t));
  removeTiles(pl.hand, taken);
  pl.hand.push(...back);
  exp.tiles = [exp.claimedTile, ...tiles.filter((t) => t !== exp.claimedTile)];
  ctx.events.push({ type: 'amendExposure', seat, exposure: action.exposure, size: tiles.length, jokers });
  return null;
}

// --- Call window --------------------------------------------------------------------------------------

function onCallWindow(ctx: Ctx, p: Extract<Phase, { name: 'callWindow' }>, seat: number, action: Action): Violation | null {
  const s = ctx.s;
  const pl = s.players[seat] as GameState['players'][number];
  const kind = kindOfTile(p.tile);
  let response: CallResponse;
  switch (action.type) {
    case 'pass':
      response = { type: 'pass' };
      break;
    case 'claimMahjong': {
      if (mahjongTargetsWith(ctx.card, countsOf(pl.hand), pl.exposures.map(exposureInfo), kind).length === 0)
        return violation('notMahjong', `The ${kindName(kind)} doesn't complete a hand on the card for you, so you can't claim it for Mah Jongg.`);
      response = { type: 'mahjong' };
      break;
    }
    case 'claimExposure': {
      const v = checkExposureClaim(ctx, p, seat, action.tiles);
      if (v) return v;
      response = { type: 'expose', tiles: [...action.tiles] };
      break;
    }
    default:
      return wrongAction(`${windOf(s, p.discarder)} discarded a ${kindName(kind)}: claim it, or pass.`);
  }
  p.responses[seat] = response;
  if (p.eligible.every((q) => p.responses[q] !== null)) resolveCallWindow(ctx);
  return null;
}

function checkExposureClaim(ctx: Ctx, p: Extract<Phase, { name: 'callWindow' }>, seat: number, tiles: readonly TileId[]): Violation | null {
  const s = ctx.s;
  const kind = kindOfTile(p.tile);
  const size = tiles.length + 1;
  if (size < 3)
    return violation(
      'claimTooSmall',
      'You can claim a discard only to complete a pung, kong, quint or sextet that you expose, or as the tile that completes Mah Jongg. Pairs and single tiles (like NEWS or a year) can be claimed only for Mah Jongg.',
    );
  if (size > 6) return violation('exposureSize', 'The largest group is a sextet (6 tiles).');
  const own = checkOwnTiles(ctx, seat, tiles);
  if (own) return own;
  for (const t of tiles) {
    const k = kindOfTile(t);
    if (k !== kind && k !== JOKER)
      return violation('exposureMix', `An exposure of ${kindNamePlural(kind)} is the claimed tile plus more ${kindNamePlural(kind)} or jokers from your rack.`);
  }
  if (s.wall.length === 0 && s.rules.lastDiscard === 'mahjongOnly')
    return violation('lastDiscard', 'The wall is empty, so the last discard can be claimed only for Mah Jongg.');
  if (s.rules.safety) {
    const jokers = tiles.filter((t) => kindOfTile(t) === JOKER).length;
    const reason = exposureDeadReason(s, seat, kind, size, jokers);
    if (reason) return violation('exposureKillsHand', exposureKillsMessage(reason));
  }
  return null;
}

function exposureKillsMessage(reason: DeadCode): string {
  return reason === 'exposuresFitNoHand'
    ? "That exposure wouldn't fit any exposed (X) hand on the card with your other exposures, so it would make your hand dead."
    : 'Every hand that exposure fits needs tiles that are already used up on the table, so it would make your hand dead.';
}

/** Everyone has answered: Mah Jongg beats exposure; ties go to the seat next in turn after the discarder. */
function resolveCallWindow(ctx: Ctx): void {
  const s = ctx.s;
  const p = s.phase as Extract<Phase, { name: 'callWindow' }>;
  const order = [1, 2, 3].map((i) => (p.discarder + i) % 4);
  const mj = order.find((q) => p.responses[q]?.type === 'mahjong');
  if (mj !== undefined) {
    takeFromFloor(s, p.tile);
    const pl = s.players[mj] as GameState['players'][number];
    pl.hand.push(p.tile);
    ctx.events.push({ type: 'claim', seat: mj, tile: p.tile, from: p.discarder, purpose: 'mahjong' });
    const best = completedTargets(ctx.card, countsOf(pl.hand), pl.exposures.map(exposureInfo))[0] as Target;
    endMahjong(ctx, mj, 'discard', best, p.discarder);
    return;
  }
  const ex = order.find((q) => p.responses[q]?.type === 'expose');
  if (ex !== undefined) {
    const resp = p.responses[ex] as Extract<CallResponse, { type: 'expose' }>;
    takeFromFloor(s, p.tile);
    const pl = s.players[ex] as GameState['players'][number];
    removeTiles(pl.hand, resp.tiles);
    const kind = kindOfTile(p.tile);
    pl.exposures.push({ kind, tiles: [p.tile, ...resp.tiles], claimedTile: p.tile, from: p.discarder, locked: false });
    const info = exposureInfo(pl.exposures[pl.exposures.length - 1] as Exposure);
    ctx.events.push({ type: 'claim', seat: ex, tile: p.tile, from: p.discarder, purpose: 'exposure' });
    ctx.events.push({ type: 'expose', seat: ex, exposure: pl.exposures.length - 1, kind, size: info.size, jokers: info.jokers });
    s.phase = { name: 'turn', seat: ex, source: 'claim', from: p.discarder, exchanged: false, redeemed: [] };
    afterPublicChange(ctx);
    return;
  }
  drawNext(ctx, p.discarder);
}

function takeFromFloor(s: GameState, tile: TileId): void {
  const last = s.floor[s.floor.length - 1];
  if (!last || last.tile !== tile) throw new Error('internal: claimed tile is not the latest discard');
  s.floor.pop();
}

/** The next live player after `after` picks from the wall; an empty wall means a wall game. */
function drawNext(ctx: Ctx, after: number): void {
  const s = ctx.s;
  const next = nextLiveSeat(s, after);
  if (next === null) {
    endNoWinner(ctx, 'threeDead');
    return;
  }
  const tile = s.wall.shift();
  if (tile === undefined) {
    endNoWinner(ctx, 'wall');
    return;
  }
  (s.players[next] as GameState['players'][number]).hand.push(tile);
  ctx.events.push({ type: 'draw', seat: next, tile, wallLeft: s.wall.length });
  s.phase = { name: 'turn', seat: next, source: 'draw', from: null, exchanged: false, redeemed: [] };
}

// --- Dead hands, endings ------------------------------------------------------------------------------

export function deadMessage(state: Pick<GameState, 'dealer'>, seat: number, code: DeadCode): string {
  const w = windOf(state, seat);
  return code === 'exposuresFitNoHand'
    ? `${w}'s hand is dead: those exposures don't fit any exposed hand on the card.`
    : `${w}'s hand is dead: every hand that fits those exposures needs tiles that are already used up on the table.`;
}

/**
 * After anything that changes what the table can see: declare dead hands (public evidence only), end the
 * game if three players are dead, and keep the turn or call window moving past dead players.
 */
function afterPublicChange(ctx: Ctx): void {
  const s = ctx.s;
  if (s.rules.autoDeclareDead) {
    const table = publicTable(s);
    for (let seat = 0; seat < 4; seat++) {
      const pl = s.players[seat] as GameState['players'][number];
      if (pl.dead) continue;
      // a player may still fix an exposure until it locks
      if (pl.exposures.some((e) => !e.locked)) continue;
      const code = officialDeadReason(ctx.card, prepareExposures(pl.exposures.map(exposureInfo)), table);
      if (code) {
        const message = deadMessage(s, seat, code);
        pl.dead = { code, message };
        ctx.events.push({ type: 'dead', seat, code, message });
      }
    }
  }
  if (s.players.filter((pl) => pl.dead).length >= 3) {
    endNoWinner(ctx, 'threeDead');
    return;
  }
  const p = s.phase;
  if (p.name === 'turn' && !isLive(s, p.seat)) {
    drawNext(ctx, p.seat); // a dead player stops playing
  } else if (p.name === 'callWindow') {
    p.eligible = p.eligible.filter((q) => isLive(s, q));
    if (p.eligible.every((q) => p.responses[q] !== null)) resolveCallWindow(ctx);
  }
}

function endMahjong(ctx: Ctx, winner: number, how: WinHow, target: Target, from: number | null): void {
  const s = ctx.s;
  const pl = s.players[winner] as GameState['players'][number];
  const jokerless = !pl.hand.some((t) => kindOfTile(t) === JOKER) && !pl.exposures.some((e) => e.tiles.some((t) => kindOfTile(t) === JOKER));
  const selfPick = how !== 'discard';
  const payments = mahjongPayments(winner, target.value, jokerless && target.jokerlessBonus, selfPick, selfPick ? null : from);
  for (let i = 0; i < 4; i++) s.scores[i] = (s.scores[i] as number) + (payments[i] as number);
  const result: GameResult = {
    type: 'mahjong',
    winner,
    how,
    selfPick,
    from: selfPick ? null : from,
    handId: target.handId,
    targetIndex: target.index,
    value: target.value,
    jokerless,
    payments,
  };
  for (const p of s.players) for (const e of p.exposures) e.locked = true;
  s.phase = { name: 'ended', result };
  ctx.events.push({ type: 'gameEnd', result });
}

function endNoWinner(ctx: Ctx, type: 'wall' | 'threeDead'): void {
  const result: GameResult = { type, payments: [0, 0, 0, 0] };
  ctx.s.phase = { name: 'ended', result };
  ctx.events.push({ type: 'gameEnd', result });
}

// ---------------------------------------------------------------------------------------------
// Checks used by the tests and simulations

/** Problems with a state: every one of the 152 tiles exactly once, legal hand sizes, sound exposures. */
export function checkInvariants(state: GameState): string[] {
  const problems: string[] = [];
  const seen = new Array<number>(TILE_COUNT).fill(0);
  const mark = (id: TileId, where: string) => {
    if (!Number.isInteger(id) || id < 0 || id >= TILE_COUNT) problems.push(`bad tile id ${id} in ${where}`);
    else seen[id] = (seen[id] as number) + 1;
  };
  for (const id of state.wall) mark(id, 'wall');
  for (const f of state.floor) mark(f.tile, 'floor');
  state.players.forEach((pl, i) => {
    for (const id of pl.hand) mark(id, `hand ${i}`);
    for (const e of pl.exposures) {
      for (const id of e.tiles) mark(id, `exposure ${i}`);
      if (e.tiles.length < 3 || e.tiles.length > 6) problems.push(`seat ${i} has an exposure of ${e.tiles.length}`);
      if (!e.tiles.includes(e.claimedTile)) problems.push(`seat ${i} exposure lost its claimed tile`);
      if (kindOfTile(e.claimedTile) !== e.kind) problems.push(`seat ${i} exposure claimed tile is the wrong kind`);
      for (const id of e.tiles) {
        const k = kindOfTile(id);
        if (k !== e.kind && k !== JOKER) problems.push(`seat ${i} exposure mixes kinds`);
      }
    }
  });
  const missing = seen.filter((n) => n === 0).length;
  const doubled = seen.filter((n) => n > 1).length;
  if (missing > 0 || doubled > 0) problems.push(`tile accounting: ${missing} missing, ${doubled} duplicated`);
  const counts = emptyCounts();
  for (let id = 0; id < TILE_COUNT; id++) if ((seen[id] as number) > 0) counts[kindOfTile(id)]++;
  for (let k = 0; k < NUM_KINDS; k++) if ((counts[k] as number) > (SUPPLY[k] as number)) problems.push(`too many of kind ${k}`);

  // hand sizes: hidden tiles plus exposed tiles
  const sizes = state.players.map((pl) => pl.hand.length + pl.exposures.reduce((n, e) => n + e.tiles.length, 0));
  const p = state.phase;
  const expect = (seat: number, n: number | number[]) => {
    const ok = Array.isArray(n) ? n.includes(sizes[seat] as number) : sizes[seat] === n;
    if (!ok) problems.push(`seat ${seat} holds ${sizes[seat]} tiles in phase ${p.name}`);
  };
  for (let seat = 0; seat < 4; seat++) {
    const live = isLive(state, seat);
    if (p.name === 'heavenly' || p.name === 'charleston' || p.name === 'vote' || p.name === 'courtesyOffer' || p.name === 'courtesyPass') {
      expect(seat, seat === state.dealer ? 14 : 13);
    } else if (p.name === 'turn') {
      expect(seat, seat === p.seat ? 14 : live ? 13 : [13, 14]);
    } else if (p.name === 'callWindow') {
      expect(seat, live ? 13 : [13, 14]);
    } else if (p.name === 'ended') {
      const r = p.result;
      if (r.type === 'mahjong' && seat === r.winner) expect(seat, 14);
      else expect(seat, [13, 14]);
    }
  }
  return problems;
}

/** A finished game's winning hand, checked again from scratch. */
export function revalidateWin(state: GameState): string | null {
  const p = state.phase;
  if (p.name !== 'ended' || p.result.type !== 'mahjong') return null;
  const card = getCard(state.cardId);
  const pl = state.players[p.result.winner] as GameState['players'][number];
  const t = card.targets[p.result.targetIndex];
  if (!t) return 'winning target missing';
  const ok = completedTargets(card, countsOf(pl.hand), pl.exposures.map(exposureInfo)).some((x) => x.index === t.index);
  return ok ? null : `declared win does not match ${t.handId}`;
}

export type { Card };
