/**
 * What the player can do right now, worked out by asking the referee. Every button on the screen comes
 * from here, and each choice is first tried on a copy of the game with apply() (a dry run). So a button
 * can never disagree with the rules, and a dimmed button carries the referee's own explanation.
 *
 * No screen code lives here, so the automatic tests can drive whole games through these lists.
 */

import { getCard } from '../engine/card';
import { BLIND_PASSES, PASS_NAMES, PASS_OFFSETS, apply, callOptions, exposedJokers, exposureInfo, pendingSeats, windOf } from '../engine/engine';
import { exposureOptions } from '../engine/matcher';
import type { Action, GameState, Phase } from '../engine/state';
import { JOKER, countsOf, kindName, kindNamePlural, kindOfTile, type Kind, type TileId } from '../engine/tiles';

export interface Choice {
  /** Stable key for the screen. */
  key: string;
  label: string;
  /** A short second line (for example "uses 1 joker"). */
  detail?: string;
  action: Action;
  /** True when the referee accepts this move right now. */
  ok: boolean;
  /** The referee's one- or two-sentence reason when it doesn't. */
  reason: string | null;
  /** Tiles to picture on the button (an exposure preview). */
  tiles?: TileId[];
  /** True when the screen itself refuses (for example nothing selected yet); the move never reaches the referee. */
  screenOnly?: boolean;
}

export const SIZE_NAME: Record<number, string> = { 3: 'pung', 4: 'kong', 5: 'quint', 6: 'sextet' };
const DIRECTION: Record<number, string> = { 1: 'right', 2: 'across', 3: 'left' };

function cap(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

function jokerText(n: number): string {
  return n === 0 ? '' : `uses ${n} joker${n === 1 ? '' : 's'}`;
}

type Player = GameState['players'][number];
function player(state: GameState, seat: number): Player {
  return state.players[seat] as Player;
}

/** Try a move on a copy of the game. Returns null when the referee accepts it, else the reason. */
export function dryRun(state: GameState, seat: number, action: Action): string | null {
  const r = apply(state, seat, action);
  return r.ok ? null : r.violation.message;
}

function choice(state: GameState, seat: number, key: string, label: string, action: Action, extra: Partial<Choice> = {}): Choice {
  const reason = dryRun(state, seat, action);
  return { key, label, action, ok: reason === null, reason, ...extra };
}

/** A choice the screen itself refuses (for example nothing selected), with a plain reason. */
function blocked(key: string, label: string, action: Action, reason: string): Choice {
  return { key, label, action, ok: false, reason, screenOnly: true };
}

export function isPending(state: GameState, seat: number): boolean {
  return pendingSeats(state).includes(seat);
}

/** Who is "right", "across" and "left" of a seat (play goes to the right: seat s+1). */
export function relativePosition(from: number, to: number): 'you' | 'right' | 'across' | 'left' {
  const d = (to - from + 4) % 4;
  return d === 0 ? 'you' : d === 1 ? 'right' : d === 2 ? 'across' : 'left';
}

/** How many rack tiles the player should select in this phase (0 when selection isn't used). */
export function selectionLimit(state: GameState, seat: number, blind: number): number {
  const p = state.phase;
  if (!isPending(state, seat)) return 0;
  if (p.name === 'charleston') return 3 - blind;
  if (p.name === 'courtesyPass') return p.agreed[seat] as number;
  if (p.name === 'turn') return 1;
  return 0;
}

// --- Charleston, vote, courtesy pass ---------------------------------------------------------------

export interface CharlestonInfo {
  pass: number;
  passName: string;
  direction: string;
  to: number;
  blindAllowed: boolean;
}

export function charlestonInfo(state: GameState, seat: number): CharlestonInfo | null {
  const p = state.phase;
  if (p.name !== 'charleston') return null;
  const offset = PASS_OFFSETS[p.pass] as number;
  return {
    pass: p.pass,
    passName: PASS_NAMES[p.pass] as string,
    direction: DIRECTION[offset] as string,
    to: (seat + offset) % 4,
    blindAllowed: BLIND_PASSES.includes(p.pass),
  };
}

export function charlestonPassChoice(state: GameState, seat: number, selected: TileId[], blind: number): Choice {
  const info = charlestonInfo(state, seat) as CharlestonInfo;
  const label =
    blind > 0
      ? `Pass ${3 - blind} + ${blind} blind ${info.direction === 'across' ? 'across' : `to the ${info.direction}`}`
      : `Pass 3 ${info.direction === 'across' ? 'across' : `to the ${info.direction}`}`;
  const action: Action = blind > 0 ? { type: 'charlestonPass', tiles: [...selected], blind } : { type: 'charlestonPass', tiles: [...selected] };
  return choice(state, seat, 'pass-tiles', label, action);
}

/** East may declare a hand dealt complete (Heavenly Hand) before choosing tiles for the first pass. */
export function heavenlyChoice(state: GameState, seat: number): Choice | null {
  const p = state.phase;
  if (p.name !== 'charleston' || p.pass !== 0 || seat !== state.dealer) return null;
  return choice(state, seat, 'heavenly', 'Mah Jongg', { type: 'declareMahjong' });
}

export function voteChoices(state: GameState, seat: number): Choice[] {
  return [
    choice(state, seat, 'vote-yes', 'Play the second Charleston', { type: 'charlestonVote', continue: true }),
    choice(state, seat, 'vote-no', 'Stop here', { type: 'charlestonVote', continue: false }),
  ];
}

export function courtesyOfferChoices(state: GameState, seat: number): Choice[] {
  return [0, 1, 2, 3].map((n) => choice(state, seat, `offer-${n}`, String(n), { type: 'courtesyOffer', count: n }));
}

export function courtesyPassChoice(state: GameState, seat: number, selected: TileId[]): Choice {
  const p = state.phase;
  const n = p.name === 'courtesyPass' ? (p.agreed[seat] as number) : 0;
  return choice(state, seat, 'courtesy-pass', `Pass ${n} across`, { type: 'courtesyPass', tiles: [...selected] });
}

// --- Call window --------------------------------------------------------------------------------------

/**
 * Choices after someone else's discard: Mah Jongg (dimmed when it isn't legal, so tapping it explains
 * why), every legal exposure (pung, kong, quint, sextet; fewest jokers first), and Pass. When no exposure
 * is legal, a dimmed Call button carries the referee's reason.
 */
export function callChoices(state: GameState, seat: number): Choice[] {
  const p = state.phase;
  if (p.name !== 'callWindow' || !p.eligible.includes(seat) || p.responses[seat] !== null) return [];
  const kind = kindOfTile(p.tile);
  const pl = player(state, seat);
  const out: Choice[] = [choice(state, seat, 'mahjong', 'Mah Jongg', { type: 'claimMahjong' })];
  const naturals = pl.hand.filter((t) => kindOfTile(t) === kind);
  const jokers = pl.hand.filter((t) => kindOfTile(t) === JOKER);
  const options = exposureOptions(getCard(state.cardId), countsOf(pl.hand), pl.exposures.map(exposureInfo), kind);
  let any = false;
  for (const o of options) {
    const tiles = [...naturals.slice(0, o.naturals), ...jokers.slice(0, o.jokers)];
    const c = choice(state, seat, `expose-${o.size}-${o.jokers}`, cap(SIZE_NAME[o.size] as string), { type: 'claimExposure', tiles }, {
      detail: jokerText(o.jokers),
      tiles: [p.tile, ...tiles],
    });
    if (c.ok) {
      out.push(c);
      any = true;
    }
  }
  if (!any) out.push(choice(state, seat, 'expose-none', 'Call', { type: 'claimExposure', tiles: [...naturals] }));
  out.push(choice(state, seat, 'pass', 'Pass', { type: 'pass' }));
  return out;
}

/**
 * Should play stop for the player after this discard? Yes when Mah Jongg is legal or an exposure would fit
 * a hand on the card (the spec's free-play behavior), or always when the player asked to stop after every
 * discard.
 */
export function shouldStopForCall(state: GameState, seat: number, stopEveryDiscard: boolean): boolean {
  const p = state.phase;
  if (p.name !== 'callWindow' || !p.eligible.includes(seat) || p.responses[seat] !== null) return false;
  if (stopEveryDiscard) return true;
  const o = callOptions(state, seat);
  return o.mahjong || o.exposures.some((e) => e.fitsCard);
}

// --- Your turn ------------------------------------------------------------------------------------------

export interface TurnChoices {
  discard: Choice;
  mahjong: Choice;
  /** Joker exchanges available now (any exposure, your own included). */
  exchanges: Choice[];
  /** Ways to change an exposure you made this turn (before you discard). */
  amends: Choice[];
}

export function turnChoices(state: GameState, seat: number, selected: TileId[]): TurnChoices | null {
  const p = state.phase;
  if (p.name !== 'turn' || p.seat !== seat) return null;
  const discard =
    selected.length === 1
      ? choice(state, seat, 'discard', 'Discard', { type: 'discard', tile: selected[0] as TileId })
      : blocked('discard', 'Discard', { type: 'discard', tile: -1 }, 'Tap one tile on your rack, then tap Discard.');
  return {
    discard,
    mahjong: choice(state, seat, 'mahjong', 'Mah Jongg', { type: 'declareMahjong' }),
    exchanges: exchangeChoices(state, seat),
    amends: amendChoices(state, seat, p),
  };
}

function exposureName(state: GameState, seat: number, owner: number, ei: number): string {
  const e = player(state, owner).exposures[ei];
  if (!e) return 'exposure';
  const whose = owner === seat ? 'your' : `${windOf(state, owner)}'s`;
  return `${whose} ${SIZE_NAME[e.tiles.length] ?? 'group'} of ${kindNamePlural(e.kind)}`;
}

export function exchangeChoices(state: GameState, seat: number): Choice[] {
  const pl = player(state, seat);
  const out: Choice[] = [];
  for (const ej of exposedJokers(state)) {
    const tile = pl.hand.find((t) => kindOfTile(t) === ej.kind);
    if (tile === undefined) continue;
    const c = choice(
      state,
      seat,
      `exchange-${ej.seat}-${ej.exposureIndex}`,
      `Give your ${kindName(ej.kind)} for the joker in ${exposureName(state, seat, ej.seat, ej.exposureIndex)}`,
      { type: 'jokerExchange', tile, owner: ej.seat, exposure: ej.exposureIndex },
      { tiles: [tile] },
    );
    if (c.ok) out.push(c);
  }
  return out;
}

function amendChoices(state: GameState, seat: number, p: Extract<Phase, { name: 'turn' }>): Choice[] {
  const pl = player(state, seat);
  const out: Choice[] = [];
  pl.exposures.forEach((e, ei) => {
    if (e.locked) return;
    const kind: Kind = e.kind;
    const expNat = e.tiles.filter((t) => kindOfTile(t) !== JOKER && t !== e.claimedTile);
    const expJok = e.tiles.filter((t) => kindOfTile(t) === JOKER);
    const handNat = pl.hand.filter((t) => kindOfTile(t) === kind);
    const handJok = pl.hand.filter((t) => kindOfTile(t) === JOKER && !p.redeemed.includes(t));
    const natPool = [e.claimedTile, ...expNat, ...handNat];
    const jokPool = [...expJok, ...handJok];
    for (let size = 3; size <= 6; size++) {
      for (let j = 0; j <= Math.min(size - 1, jokPool.length); j++) {
        const n = size - j;
        if (n < 1 || n > natPool.length) continue;
        if (size === e.tiles.length && j === expJok.length) continue;
        const tiles = [...natPool.slice(0, n), ...jokPool.slice(0, j)];
        const c = choice(
          state,
          seat,
          `amend-${ei}-${size}-${j}`,
          cap(SIZE_NAME[size] as string),
          { type: 'amendExposure', exposure: ei, tiles },
          { detail: jokerText(j), tiles },
        );
        if (c.ok) out.push(c);
      }
    }
  });
  return out;
}

// --- The message line ---------------------------------------------------------------------------------

/** One plain-English sentence telling the player what to do now (or what is happening). */
export function promptFor(state: GameState, seat: number, blind = 0, lastDrawn: TileId | null = null): string {
  const p = state.phase;
  const w = (s: number) => windOf(state, s);
  const pending = isPending(state, seat);
  switch (p.name) {
    case 'charleston': {
      if (!pending) return 'Waiting for the other players to pass.';
      const info = charlestonInfo(state, seat) as CharlestonInfo;
      const where = info.direction === 'across' ? `across to ${w(info.to)}` : `to the ${info.direction}, to ${w(info.to)}`;
      if (blind > 0) return `Choose ${3 - blind} tile${3 - blind === 1 ? '' : 's'} to pass ${where}; ${blind} of the tiles coming to you will go on unseen.`;
      return `Charleston, ${info.passName} pass: choose 3 tiles to pass ${where}.${info.blindAllowed ? ' A blind pass is allowed on this pass.' : ''}`;
    }
    case 'vote':
      return 'The first Charleston is done. Play the second one? Any one player can stop it.';
    case 'courtesyOffer':
      return `Courtesy pass: how many tiles (0 to 3) would you like to trade with ${w((seat + 2) % 4)}, across from you? The lower of your two offers is used.`;
    case 'courtesyPass': {
      const n = p.agreed[seat] as number;
      return pending ? `Choose ${n} tile${n === 1 ? '' : 's'} to pass across to ${w((seat + 2) % 4)}.` : 'Waiting for the courtesy pass.';
    }
    case 'turn': {
      if (p.seat !== seat) return `${w(p.seat)}'s turn.`;
      if (p.source === 'deal')
        return "You're East, so you start: discard one tile (no draw), or declare Mah Jongg if your hand is already complete.";
      if (p.source === 'claim') return 'Now discard a tile (no draw). You can still change that exposure until you discard.';
      const drew = lastDrawn !== null ? `You drew ${kindName(kindOfTile(lastDrawn))}. ` : '';
      return `${drew}Your turn: tap a tile, then Discard.`;
    }
    case 'callWindow': {
      if (!pending) return `${w(p.discarder)} discarded ${kindName(kindOfTile(p.tile))}.`;
      return `${w(p.discarder)} discarded ${kindName(kindOfTile(p.tile))}. Call it, or pass.`;
    }
    case 'ended':
      return 'This game is over.';
  }
}
