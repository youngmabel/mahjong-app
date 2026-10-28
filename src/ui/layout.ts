/**
 * How tiles are arranged on screen: your rack (by suit, or by number), the discard chart (by suit and
 * sets, every kind in a fixed place), and the cheat sheet's lines. No screen code, so it is unit-tested.
 */

import type { Card, CompiledGroup, CompiledHand, Target } from '../engine/card';
import {
  DRAGONS,
  FLOWER,
  JOKER,
  NUM_KINDS,
  WINDS,
  isDragon,
  isSuited,
  isWind,
  kindCode,
  kindFromCode,
  kindName,
  kindNamePlural,
  kindOfTile,
  numberOf,
  suitOf,
  type Kind,
  type TileId,
} from '../engine/tiles';
import type { RackOrder } from './prefs';

// --- Your rack -------------------------------------------------------------------------------------------

export interface RackGroup {
  key: string;
  label: string;
  tiles: TileId[];
}

function categoryOf(k: Kind): number {
  if (isSuited(k)) return suitOf(k); // 0 Bams, 1 Craks, 2 Dots
  if (isWind(k)) return 3;
  if (isDragon(k)) return 4;
  if (k === FLOWER) return 5;
  return 6; // jokers
}
const CATEGORY_LABEL = ['Bams', 'Craks', 'Dots', 'Winds', 'Dragons', 'Flowers', 'Jokers'];

/** Number order: all 1s, then all 2s (Bam, Crak, Dot), and so on; then winds, dragons, flowers, jokers. */
function numberKey(k: Kind): number {
  if (isSuited(k)) return (numberOf(k) - 1) * 3 + suitOf(k);
  return 100 + k;
}

/**
 * Your hidden tiles in groups, always in the same fixed order (never based on any hand):
 * by suit (Bams, Craks, Dots, winds, dragons, flowers, jokers) or by number (1s, 2s, ... then honors).
 */
export function rackGroups(hand: readonly TileId[], order: RackOrder): RackGroup[] {
  const tiles = [...hand].sort((a, b) => {
    const ka = kindOfTile(a);
    const kb = kindOfTile(b);
    const d = order === 'number' ? numberKey(ka) - numberKey(kb) : ka - kb;
    return d || a - b;
  });
  const groups: RackGroup[] = [];
  for (const t of tiles) {
    const k = kindOfTile(t);
    const key = order === 'number' && isSuited(k) ? `n${numberOf(k)}` : `c${categoryOf(k)}`;
    const label = order === 'number' && isSuited(k) ? `${numberOf(k)}s` : (CATEGORY_LABEL[categoryOf(k)] as string);
    const last = groups[groups.length - 1];
    if (last && last.key === key) last.tiles.push(t);
    else groups.push({ key, label, tiles: [t] });
  }
  return groups;
}

// --- The discard chart -----------------------------------------------------------------------------------

export interface DiscardCell {
  kind: Kind;
  /** Discards of this kind still on the table, oldest first. */
  copies: { tile: TileId; seat: number; order: number }[];
}

/** The chart's fixed rows: Bams 1-9, Craks 1-9, Dots 1-9, then N E W S, Red, Green, Soap, Flower, Joker. */
export const CHART_ROWS: readonly (readonly Kind[])[] = [
  Array.from({ length: 9 }, (_, i) => i),
  Array.from({ length: 9 }, (_, i) => 9 + i),
  Array.from({ length: 9 }, (_, i) => 18 + i),
  [...WINDS, ...DRAGONS, FLOWER, JOKER],
];
export const CHART_ROW_LABELS = ['Bams', 'Craks', 'Dots', 'Honors'];

/** Every discard on the table, placed in its kind's fixed cell (36 cells, one per kind of tile). */
export function discardChart(floor: readonly { tile: TileId; seat: number }[]): DiscardCell[][] {
  const byKind = new Map<Kind, DiscardCell>();
  for (let k = 0; k < NUM_KINDS; k++) byKind.set(k, { kind: k, copies: [] });
  floor.forEach((f, order) => (byKind.get(kindOfTile(f.tile)) as DiscardCell).copies.push({ tile: f.tile, seat: f.seat, order }));
  return CHART_ROWS.map((row) => row.map((k) => byKind.get(k) as DiscardCell));
}

const COUNT_WORD = ['No', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight'];

/** "Two 5 Dots on the table, discarded by South, then West." */
export function describeCell(cell: DiscardCell, windName: (seat: number) => string): string {
  const n = cell.copies.length;
  const name = n === 1 ? kindName(cell.kind) : kindNamePlural(cell.kind);
  if (n === 0) return `No ${kindNamePlural(cell.kind)} on the table.`;
  const who = cell.copies.map((c) => windName(c.seat));
  const list = who.length === 1 ? (who[0] as string) : `${who.slice(0, -1).join(', ')}, then ${who[who.length - 1]}`;
  return `${COUNT_WORD[n] ?? String(n)} ${name} on the table, discarded by ${list}.`;
}

// --- The cheat sheet ------------------------------------------------------------------------------------

/**
 * One tile slot of a card line, drawn in our own layout: a real tile where the card names one exactly
 * (Flower, a wind, Soap as zero, a named dragon), otherwise a neutral tile showing the number or "D"
 * with a suit badge (A, B or C). Badges show which tiles share a suit, never which suit.
 */
export type PatternSlot =
  | { type: 'tile'; kind: Kind; zero?: boolean }
  | { type: 'number'; text: string; badge: Badge }
  | { type: 'dragon'; badge: Badge | null }
  | { type: 'anyWind' };

export type Badge = 'A' | 'B' | 'C';

export interface CheatLine {
  handIndex: number;
  id: string;
  title: string;
  value: number;
  concealed: boolean;
  jokerlessBonus: boolean;
  note: string;
  /** Each pattern word as a list of slots (a group word repeats one slot). "-or-" layouts are extra entries. */
  layouts: PatternSlot[][][];
  /** One concrete example hand, word by word, as tile kinds. */
  example: Kind[][];
}

export interface CheatSection {
  name: string;
  lines: CheatLine[];
}

function badgeFor(color: string, order: string[]): Badge {
  let i = order.indexOf(color);
  if (i < 0) {
    order.push(color);
    i = order.length - 1;
  }
  return (['A', 'B', 'C'][i] ?? 'C') as Badge;
}

function slotOf(g: CompiledGroup, order: string[]): PatternSlot {
  const t = g.tile;
  switch (t.t) {
    case 'num':
      return { type: 'number', text: String(t.n), badge: badgeFor(t.suit, order) };
    case 'numVar':
      // sliding lines keep the printed digit as the offset of variable "s"
      return { type: 'number', text: t.v === 's' ? String(t.off) : `${t.v}${t.off > 0 ? `+${t.off}` : t.off < 0 ? String(t.off) : ''}`, badge: badgeFor(t.suit, order) };
    case 'dragonOf':
      return { type: 'dragon', badge: badgeFor(t.suit, order) };
    case 'dragonVar':
      return { type: 'dragon', badge: null };
    case 'windVar':
      return { type: 'anyWind' };
    case 'fixed': {
      const k = kindFromCode(t.code);
      return { type: 'tile', kind: k, zero: t.code === 'WD' && g.size === 1 };
    }
  }
}

function layoutOf(groups: readonly CompiledGroup[]): PatternSlot[][] {
  const order: string[] = [];
  // Badges follow the order suits first appear among numbers, then dragons.
  for (const g of groups) if (g.tile.t === 'num' || g.tile.t === 'numVar') badgeFor(g.tile.suit, order);
  const words: PatternSlot[][] = [];
  for (const g of groups) {
    const w = (words[g.word] ??= []);
    const slot = slotOf(g, order);
    for (let i = 0; i < g.size; i++) w.push(slot);
  }
  return words.filter((w) => w !== undefined);
}

function exampleOf(t: Target | undefined): Kind[][] {
  if (!t) return [];
  const words: Kind[][] = [];
  for (const g of t.groups) {
    const w = (words[g.word] ??= []);
    for (let i = 0; i < g.size; i++) w.push(g.kind);
  }
  return words.filter((w) => w !== undefined);
}

export function cheatLine(card: Card, hand: CompiledHand, handIndex: number): CheatLine {
  return {
    handIndex,
    id: hand.id,
    title: `${hand.section} #${hand.line}`,
    value: hand.value,
    concealed: hand.concealed,
    jokerlessBonus: hand.jokerlessBonus,
    note: hand.note,
    layouts: hand.alternatives.map((a) => layoutOf(a.groups)),
    example: exampleOf(card.targetsByHand[handIndex]?.[0]),
  };
}

/** The whole card in sections, in card order. Concealed lines can be left out. */
export function cheatSheet(card: Card, hideConcealed: boolean): CheatSection[] {
  const sections: CheatSection[] = [];
  card.hands.forEach((h, i) => {
    if (hideConcealed && h.concealed) return;
    let s = sections.find((x) => x.name === h.section);
    if (!s) {
      s = { name: h.section, lines: [] };
      sections.push(s);
    }
    s.lines.push(cheatLine(card, h, i));
  });
  return sections;
}

/** Tile codes of an example, for tests and accessibility labels. */
export function exampleCodes(line: CheatLine): string {
  return line.example.map((w) => w.map(kindCode).join(' ')).join(' | ');
}
