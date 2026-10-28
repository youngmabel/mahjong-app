/**
 * Rule settings, including the labeled choices approved for rules the research rates medium or low
 * confidence (docs/01-rules.md; decisions recorded in STATUS.md). Each is one setting here, so it can be
 * changed later, for example after checking the NMJL rulebook "Mah Jongg Made Easy".
 */

export interface RuleOptions {
  /**
   * Practice "Safety" switch. ON: an exposure that would make your own hand dead (it fits no exposed
   * hand on the card, or none can still be made) is blocked with the reason. OFF: it is allowed, and the
   * hand goes dead when you discard, as at a real table. Truly illegal moves are always blocked.
   */
  safety: boolean;

  /**
   * (e) When an exposure stops being changeable. 'discardOrExchange' (approved): when its owner discards
   * or starts a joker exchange, whichever comes first [H for the discard, M for the joker exchange].
   * 'discard': only when its owner discards.
   */
  exposureLock: 'discardOrExchange' | 'discard';

  /**
   * (b) A Mah Jongg completed by a joker exchange counts as self-picked [M] ('selfPick', approved).
   * 'asTile': pay by how the 14th tile arrived instead (claimed discard: the discarder pays double).
   */
  jokerExchangeWin: 'selfPick' | 'asTile';

  /**
   * (f) When three players are dead the game ends and nobody pays [M-H]. What happens to the deal is
   * not documented by the NMJL; 'passRight' (approved) moves the deal to the right as after a wall game.
   * 'sameDealer' redeals with the same East.
   */
  threeDeadDeal: 'passRight' | 'sameDealer';

  /**
   * (h) The game's last discard. 'normal' (approved): it can be claimed for an exposure or Mah Jongg as
   * usual, since no special rules apply near the end of the wall [M, inference]. 'mahjongOnly': only
   * for Mah Jongg.
   */
  lastDiscard: 'normal' | 'mahjongOnly';

  /** (i) The referee declares dead hands automatically, only on evidence the whole table can see. */
  autoDeclareDead: boolean;
}

/**
 * Choices that have only one implemented option, recorded here so the code and STATUS.md agree:
 * (a) East completing a hand during the Charleston declares instead of the first discard and is paid
 *     as a self-pick [L-M; AMJA]. A Heavenly Hand (dealt complete) is paid as a self-pick [H].
 * (c) No jokerless bonus for Singles and Pairs [H] or Quints [M] (set per hand by the card compiler).
 * (d) Jokerless is judged by the tiles shown when declaring [L-M; AMJA].
 * (g) When every player blind passes, the IOU method: the dealer passes their own tiles first and owes
 *     the blind ones until tiles come back around [M; Sloper column 534, 2020 League rule].
 */
export const DEFAULT_RULES: RuleOptions = {
  safety: true,
  exposureLock: 'discardOrExchange',
  jokerExchangeWin: 'selfPick',
  threeDeadDeal: 'passRight',
  lastDiscard: 'normal',
  autoDeclareDead: true,
};

export function makeRules(overrides: Partial<RuleOptions> = {}): RuleOptions {
  return { ...DEFAULT_RULES, ...overrides };
}
