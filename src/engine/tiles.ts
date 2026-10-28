/**
 * Tiles: the 36 kinds of tile and the 152-tile set (no blanks).
 *
 * Two ways to talk about tiles:
 * - A "kind" (0 to 35) is what a tile is: 5 Dot, North, Joker. All flowers are one kind.
 * - A "tile id" (0 to 151) is one physical tile. There are four 5 Dot tiles, so four ids map to kind 5 Dot.
 * Hands are analyzed as "count vectors": an array of 36 numbers saying how many of each kind you hold.
 *
 * Source: docs/01-rules.md section 1 (equipment), docs/02-tiles-and-terms.md.
 */

export type Kind = number;
export type TileId = number;

/** Suits in the app's fixed order: 0 = Bams, 1 = Craks, 2 = Dots. */
export type Suit = 0 | 1 | 2;
export const SUITS: readonly Suit[] = [0, 1, 2];
export const SUIT_LETTER = ['B', 'C', 'D'] as const;
export const SUIT_NAME = ['Bam', 'Crak', 'Dot'] as const;
export const SUIT_NAME_PLURAL = ['Bams', 'Craks', 'Dots'] as const;

export const NUM_KINDS = 36;

// Kinds 0..26 are the suited tiles: suit * 9 + (number - 1).
export const NORTH: Kind = 27;
export const EAST: Kind = 28;
export const WEST: Kind = 29;
export const SOUTH: Kind = 30;
export const RED: Kind = 31; // Red Dragon, goes with Craks
export const GREEN: Kind = 32; // Green Dragon, goes with Bams
export const SOAP: Kind = 33; // White Dragon ("Soap"), goes with Dots; also zero
export const FLOWER: Kind = 34;
export const JOKER: Kind = 35;

/** Winds in card order (N, E, W, S, hence "NEWS"). */
export const WINDS: readonly Kind[] = [NORTH, EAST, WEST, SOUTH];
export const DRAGONS: readonly Kind[] = [RED, GREEN, SOAP];

/** The dragon that goes with each suit: Bams-Green, Craks-Red, Dots-Soap. [H] back of the card. */
export const DRAGON_OF_SUIT: readonly Kind[] = [GREEN, RED, SOAP];

/** Copies of each kind in the set: 4 of everything, except 8 flowers and 8 jokers. */
export const SUPPLY: readonly number[] = Array.from({ length: NUM_KINDS }, (_, k) =>
  k === FLOWER || k === JOKER ? 8 : 4,
);

export const TILE_COUNT = 152;
export const JOKER_COUNT = 8;

export function numKind(suit: Suit, n: number): Kind {
  if (n < 1 || n > 9 || !Number.isInteger(n)) throw new Error(`Bad tile number ${n}`);
  return suit * 9 + (n - 1);
}

export function isSuited(k: Kind): boolean {
  return k >= 0 && k < 27;
}
export function suitOf(k: Kind): Suit {
  if (!isSuited(k)) throw new Error(`Kind ${k} has no suit`);
  return Math.floor(k / 9) as Suit;
}
export function numberOf(k: Kind): number {
  if (!isSuited(k)) throw new Error(`Kind ${k} has no number`);
  return (k % 9) + 1;
}
export function isWind(k: Kind): boolean {
  return k >= NORTH && k <= SOUTH;
}
export function isDragon(k: Kind): boolean {
  return k >= RED && k <= SOAP;
}
/** The suit a dragon goes with (Red-Craks, Green-Bams, Soap-Dots). */
export function suitOfDragon(k: Kind): Suit {
  const s = DRAGON_OF_SUIT.indexOf(k);
  if (s < 0) throw new Error(`Kind ${k} is not a dragon`);
  return s as Suit;
}

const HONOR_CODES: Record<number, string> = {
  [NORTH]: 'N',
  [EAST]: 'E',
  [WEST]: 'W',
  [SOUTH]: 'S',
  [RED]: 'RD',
  [GREEN]: 'GD',
  [SOAP]: 'WD',
  [FLOWER]: 'F',
  [JOKER]: 'J',
};
const HONOR_NAMES: Record<number, [string, string]> = {
  [NORTH]: ['North', 'Norths'],
  [EAST]: ['East', 'Easts'],
  [WEST]: ['West', 'Wests'],
  [SOUTH]: ['South', 'Souths'],
  [RED]: ['Red Dragon', 'Red Dragons'],
  [GREEN]: ['Green Dragon', 'Green Dragons'],
  [SOAP]: ['Soap', 'Soaps'],
  [FLOWER]: ['Flower', 'Flowers'],
  [JOKER]: ['Joker', 'Jokers'],
};

/** Short code used in data files and tests: "5D", "N", "RD", "WD", "F", "J". */
export function kindCode(k: Kind): string {
  if (isSuited(k)) return `${numberOf(k)}${SUIT_LETTER[suitOf(k)]}`;
  const c = HONOR_CODES[k];
  if (!c) throw new Error(`Bad kind ${k}`);
  return c;
}

const CODE_TO_KIND = new Map<string, Kind>();
for (let k = 0; k < NUM_KINDS; k++) CODE_TO_KIND.set(kindCode(k), k);

export function kindFromCode(code: string): Kind {
  const k = CODE_TO_KIND.get(code.trim().toUpperCase());
  if (k === undefined) throw new Error(`Unknown tile code "${code}"`);
  return k;
}

/** Plain-English name: "5 Dot", "North", "Red Dragon", "Soap", "Flower", "Joker". */
export function kindName(k: Kind): string {
  if (isSuited(k)) return `${numberOf(k)} ${SUIT_NAME[suitOf(k)]}`;
  const n = HONOR_NAMES[k];
  if (!n) throw new Error(`Bad kind ${k}`);
  return n[0];
}
/** Plural name: "5 Dots", "Norths", "Soaps". */
export function kindNamePlural(k: Kind): string {
  if (isSuited(k)) return `${numberOf(k)} ${SUIT_NAME_PLURAL[suitOf(k)]}`;
  const n = HONOR_NAMES[k];
  if (!n) throw new Error(`Bad kind ${k}`);
  return n[1];
}

/**
 * Physical tiles: ids 0..135 are the 34 four-copy kinds (id = kind * 4 + copy),
 * ids 136..143 are the 8 flowers, ids 144..151 are the 8 jokers.
 */
export function kindOfTile(id: TileId): Kind {
  if (!Number.isInteger(id) || id < 0 || id >= TILE_COUNT) throw new Error(`Bad tile id ${id}`);
  if (id < 136) return Math.floor(id / 4);
  if (id < 144) return FLOWER;
  return JOKER;
}

/** All 152 tile ids in order. */
export function allTileIds(): TileId[] {
  return Array.from({ length: TILE_COUNT }, (_, i) => i);
}

/** The ids of every physical tile of one kind. */
export function tileIdsOfKind(k: Kind): TileId[] {
  if (k === FLOWER) return [136, 137, 138, 139, 140, 141, 142, 143];
  if (k === JOKER) return [144, 145, 146, 147, 148, 149, 150, 151];
  return [k * 4, k * 4 + 1, k * 4 + 2, k * 4 + 3];
}

export function emptyCounts(): number[] {
  return new Array<number>(NUM_KINDS).fill(0);
}

/** Count vector from a list of tile ids. */
export function countsOf(ids: readonly TileId[]): number[] {
  const c = emptyCounts();
  for (const id of ids) c[kindOfTile(id)]++;
  return c;
}

/** Count vector from a list of kinds. */
export function countsOfKinds(kinds: readonly Kind[]): number[] {
  const c = emptyCounts();
  for (const k of kinds) c[k]++;
  return c;
}

export function totalOf(counts: readonly number[]): number {
  let t = 0;
  for (const n of counts) t += n;
  return t;
}

/**
 * Display order for a rack: Bams, Craks, Dots (1 to 9), then winds N E W S,
 * dragons (Red, Green, Soap), flowers, jokers last.
 */
export function compareKinds(a: Kind, b: Kind): number {
  return a - b;
}

export function sortTileIds(ids: readonly TileId[]): TileId[] {
  return [...ids].sort((x, y) => kindOfTile(x) - kindOfTile(y) || x - y);
}

/** Parse a space-separated list of tile codes like "5D 5D J F" into kinds. */
export function kindsFromCodes(codes: string): Kind[] {
  return codes
    .split(/[\s,]+/)
    .filter((s) => s.length > 0)
    .map(kindFromCode);
}
