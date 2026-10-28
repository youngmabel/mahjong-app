/**
 * Card data types.
 *
 * Layer 1 is the entry notation typed from a card photo (see notation.ts and docs/CARD-NOTATION.md).
 * Layer 2 is the compiled JSON below, which the engine loads and validates.
 * The engine then expands every hand into "targets": every concrete set of tiles that hand allows.
 */

import type { Kind } from '../tiles';

export type Color = 'g' | 'r' | 'b';

/** One tile slot pattern inside a compiled group. */
export type CompiledTile =
  /** A number tile with a literal number, in the suit named by an ink color. */
  | { t: 'num'; suit: Color; n: number }
  /** A number tile whose number is a variable plus an offset (for sliding hands and escape-hatch variables). */
  | { t: 'numVar'; suit: Color; v: string; off: number }
  /** The dragon that goes with the suit of an ink color (a "matching" dragon when numbers share the color). */
  | { t: 'dragonOf'; suit: Color }
  /** "Any dragon": same variable = same dragon, different variables = different dragons. */
  | { t: 'dragonVar'; v: string }
  /** A wind that may be any wind ("any wind"): same letter = same wind. */
  | { t: 'windVar'; v: string }
  /** A fixed tile (winds as printed, flowers, Soap as zero, or a dragon named by color). Stored as a tile code. */
  | { t: 'fixed'; code: string };

export interface CompiledGroup {
  size: number;
  tile: CompiledTile;
  /** True when jokers may fill this group (groups of 3 or more, unless the line says no jokers). */
  jokers: boolean;
  /** Which word of the pattern this group came from (singles in "2026g" share a word), for display. */
  word: number;
}

export interface CompiledAlternative {
  /** The pattern text for this layout, as entered. */
  display: string;
  groups: CompiledGroup[];
  /** Ink colors used as suits. Different colors are different suits unless listed in freeSuits. */
  suitVars: Color[];
  freeSuits: Color[];
  /** Pairs of suit colors that must differ even when one of them is free. */
  suitDiffers: [Color, Color][];
  /** Number variables and the values each may take. */
  numberVars: { name: string; domain: number[] }[];
  /** Number variables that may equal other number variables (default: different variables, different numbers). */
  numFree: string[];
  dragonVars: string[];
  windVars: string[];
}

export interface CompiledHand {
  id: string;
  section: string;
  /** Line number within its section (1-based), as on the card. */
  line: number;
  value: number;
  concealed: boolean;
  jokerlessBonus: boolean;
  note: string;
  alternatives: CompiledAlternative[];
}

export interface CompiledCard {
  schemaVersion: 1;
  card: { id: string; name: string; year: number; source: 'invented' | 'user-supplied' | string };
  hands: CompiledHand[];
}

/** One group of a concrete target. */
export interface TargetGroup {
  kind: Kind;
  size: number;
  jokers: boolean;
  /** Pattern word index (for display: singles of one word are shown together). */
  word: number;
}

/** A concrete hand: one exact set of groups a card line allows. */
export interface Target {
  /** Position in card.targets. */
  index: number;
  handIndex: number;
  handId: string;
  section: string;
  value: number;
  concealed: boolean;
  jokerlessBonus: boolean;
  altIndex: number;
  /** Groups in card order. */
  groups: TargetGroup[];
  /** Natural-only slots per kind (singles, pairs, and any no-joker groups). */
  plain: Int8Array;
  /** Joker-eligible slots per kind (groups of 3 or more). */
  flex: Int8Array;
  /** Kinds this target uses, for fast loops. */
  kinds: number[];
  /** Fewest jokers any completion of this target must use (more copies needed than exist). */
  minJokers: number;
  /** Count of joker-eligible groups by key kind*8+size, for matching exposures. */
  exposableGroups: Map<number, number>;
  /** Canonical signature used to remove duplicates. */
  signature: string;
}

export interface Card {
  id: string;
  name: string;
  year: number;
  source: string;
  hands: CompiledHand[];
  targets: Target[];
  /** Targets for each hand, by hand index. */
  targetsByHand: Target[][];
}

export class CardError extends Error {
  constructor(
    message: string,
    public readonly lineNo?: number,
    public readonly handId?: string,
  ) {
    super(lineNo !== undefined ? `Line ${lineNo}: ${message}` : message);
    this.name = 'CardError';
  }
}
