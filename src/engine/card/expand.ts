/**
 * Expand each compiled hand into every concrete target it allows, check supply, and remove
 * duplicates. Every later check (wins, tiles away, claims, dead hands, bots) counts against these.
 *
 * Source: docs/07-app-spec.md sections 4.2 and 4.3; docs/research/tech-prior-art.md section 3.2.
 */

import {
  DRAGON_OF_SUIT,
  DRAGONS,
  JOKER_COUNT,
  NUM_KINDS,
  SUPPLY,
  WINDS,
  kindFromCode,
  numKind,
  type Kind,
  type Suit,
} from '../tiles';
import {
  CardError,
  type Card,
  type Color,
  type CompiledAlternative,
  type CompiledCard,
  type CompiledHand,
  type CompiledTile,
  type Target,
  type TargetGroup,
} from './types';

export const GROUP_KEY_SPAN = 8;
export function groupKey(kind: Kind, size: number): number {
  return kind * GROUP_KEY_SPAN + size;
}

/** Every assignment of suits to ink colors that the line allows. */
function suitAssignments(alt: CompiledAlternative): Map<Color, Suit>[] {
  const out: Map<Color, Suit>[] = [];
  const vars = alt.suitVars;
  const cur = new Map<Color, Suit>();
  const rec = (i: number) => {
    if (i === vars.length) {
      for (const [a, b] of alt.suitDiffers) if (cur.get(a) === cur.get(b)) return;
      out.push(new Map(cur));
      return;
    }
    const v = vars[i] as Color;
    const isFree = alt.freeSuits.includes(v);
    for (const s of [0, 1, 2] as Suit[]) {
      if (!isFree) {
        let clash = false;
        for (const [w, ws] of cur) if (ws === s && !alt.freeSuits.includes(w)) clash = true;
        if (clash) continue;
      }
      cur.set(v, s);
      rec(i + 1);
      cur.delete(v);
    }
  };
  rec(0);
  return out;
}

function numberAssignments(alt: CompiledAlternative): Map<string, number>[] {
  const out: Map<string, number>[] = [];
  const vars = alt.numberVars;
  const cur = new Map<string, number>();
  const rec = (i: number) => {
    if (i === vars.length) {
      out.push(new Map(cur));
      return;
    }
    const { name, domain } = vars[i] as { name: string; domain: number[] };
    for (const n of domain) {
      if (!alt.numFree.includes(name)) {
        let clash = false;
        for (const [w, wn] of cur) if (wn === n && !alt.numFree.includes(w)) clash = true;
        if (clash) continue;
      }
      cur.set(name, n);
      rec(i + 1);
      cur.delete(name);
    }
  };
  rec(0);
  return out;
}

/** Injective assignments of variables to values (for "any dragon" and "any wind"). */
function distinctAssignments(vars: string[], values: readonly Kind[]): Map<string, Kind>[] {
  const out: Map<string, Kind>[] = [];
  const cur = new Map<string, Kind>();
  const used = new Set<Kind>();
  const rec = (i: number) => {
    if (i === vars.length) {
      out.push(new Map(cur));
      return;
    }
    for (const val of values) {
      if (used.has(val)) continue;
      used.add(val);
      cur.set(vars[i] as string, val);
      rec(i + 1);
      used.delete(val);
      cur.delete(vars[i] as string);
    }
  };
  rec(0);
  return out;
}

function resolveTile(
  tile: CompiledTile,
  suits: Map<Color, Suit>,
  nums: Map<string, number>,
  dragons: Map<string, Kind>,
  winds: Map<string, Kind>,
): Kind | null {
  switch (tile.t) {
    case 'num':
      return numKind(suits.get(tile.suit) as Suit, tile.n);
    case 'numVar': {
      const n = (nums.get(tile.v) as number) + tile.off;
      if (n < 1 || n > 9) return null;
      return numKind(suits.get(tile.suit) as Suit, n);
    }
    case 'dragonOf':
      return DRAGON_OF_SUIT[suits.get(tile.suit) as Suit] as Kind;
    case 'dragonVar':
      return dragons.get(tile.v) as Kind;
    case 'windVar':
      return winds.get(tile.v) as Kind;
    case 'fixed':
      return kindFromCode(tile.code);
  }
}

export interface SupplyCheck {
  ok: boolean;
  minJokers: number;
  reason?: string;
}

/** Can this exact set of groups be built from one 152-tile set? */
export function checkSupply(plain: Int8Array, flex: Int8Array): SupplyCheck {
  let minJokers = 0;
  for (let k = 0; k < NUM_KINDS; k++) {
    const p = plain[k] as number;
    const f = flex[k] as number;
    const cap = SUPPLY[k] as number;
    if (p > cap) return { ok: false, minJokers, reason: `needs ${p} natural copies of a tile that has only ${cap}` };
    if (p + f > cap) minJokers += p + f - cap;
  }
  if (minJokers > JOKER_COUNT) return { ok: false, minJokers, reason: `needs ${minJokers} jokers, but there are only 8` };
  return { ok: true, minJokers };
}

function buildTarget(hand: CompiledHand, handIndex: number, altIndex: number, groups: TargetGroup[]): Omit<Target, 'index'> | null {
  const plain = new Int8Array(NUM_KINDS);
  const flex = new Int8Array(NUM_KINDS);
  const exposableGroups = new Map<number, number>();
  for (const g of groups) {
    if (g.jokers) {
      flex[g.kind] = (flex[g.kind] as number) + g.size;
      const key = groupKey(g.kind, g.size);
      exposableGroups.set(key, (exposableGroups.get(key) ?? 0) + 1);
    } else {
      plain[g.kind] = (plain[g.kind] as number) + g.size;
    }
  }
  const supply = checkSupply(plain, flex);
  if (!supply.ok) return null;
  const kinds: number[] = [];
  for (let k = 0; k < NUM_KINDS; k++) if ((plain[k] as number) + (flex[k] as number) > 0) kinds.push(k);
  const signature = groups
    .map((g) => `${g.kind}:${g.size}:${g.jokers ? 1 : 0}`)
    .sort()
    .join(',');
  return {
    handIndex,
    handId: hand.id,
    section: hand.section,
    value: hand.value,
    concealed: hand.concealed,
    jokerlessBonus: hand.jokerlessBonus,
    altIndex,
    groups,
    plain,
    flex,
    kinds,
    minJokers: supply.minJokers,
    exposableGroups,
    signature,
  };
}

export interface HandExpansion {
  targets: Omit<Target, 'index'>[];
  /** How many suit and number choices were dropped because the set doesn't have enough tiles. */
  droppedForSupply: number;
}

export function expandHand(hand: CompiledHand, handIndex: number): HandExpansion {
  const seen = new Set<string>();
  const targets: Omit<Target, 'index'>[] = [];
  let droppedForSupply = 0;
  hand.alternatives.forEach((alt, altIndex) => {
    const suitMaps = suitAssignments(alt);
    const numMaps = numberAssignments(alt);
    const dragonMaps = distinctAssignments(alt.dragonVars, DRAGONS);
    const windMaps = distinctAssignments(alt.windVars, WINDS);
    for (const suits of suitMaps)
      for (const nums of numMaps)
        for (const dragons of dragonMaps)
          for (const winds of windMaps) {
            const groups: TargetGroup[] = [];
            let ok = true;
            for (const g of alt.groups) {
              const kind = resolveTile(g.tile, suits, nums, dragons, winds);
              if (kind === null) {
                ok = false;
                break;
              }
              groups.push({ kind, size: g.size, jokers: g.jokers, word: g.word });
            }
            if (!ok) continue;
            const t = buildTarget(hand, handIndex, altIndex, groups);
            if (!t) {
              droppedForSupply++;
              continue;
            }
            if (seen.has(t.signature)) continue;
            seen.add(t.signature);
            targets.push(t);
          }
  });
  return { targets, droppedForSupply };
}

/** Build the runtime card: validate the compiled JSON and expand every hand into targets. */
export function buildCard(compiled: CompiledCard): Card {
  if (compiled.schemaVersion !== 1) throw new CardError(`Unsupported card schema version ${String(compiled.schemaVersion)}.`);
  if (compiled.hands.length === 0) throw new CardError('The card has no hands.');
  const ids = new Set<string>();
  const targets: Target[] = [];
  const targetsByHand: Target[][] = [];
  compiled.hands.forEach((hand, handIndex) => {
    if (ids.has(hand.id)) throw new CardError(`Two hands share the id "${hand.id}".`, undefined, hand.id);
    ids.add(hand.id);
    if (!Number.isInteger(hand.value) || hand.value <= 0) throw new CardError(`Hand ${hand.id} has a bad value.`, undefined, hand.id);
    for (const alt of hand.alternatives) {
      const total = alt.groups.reduce((n, g) => n + g.size, 0);
      if (total !== 14) throw new CardError(`Hand ${hand.id} adds up to ${total} tiles, not 14.`, undefined, hand.id);
      for (const g of alt.groups) {
        if (g.size < 1 || g.size > 6) throw new CardError(`Hand ${hand.id} has a group of ${g.size}.`, undefined, hand.id);
        if (g.jokers && g.size < 3) throw new CardError(`Hand ${hand.id} lets jokers fill a single or pair.`, undefined, hand.id);
      }
      if (alt.suitVars.length > 3) throw new CardError(`Hand ${hand.id} uses more than 3 suits.`, undefined, hand.id);
    }
    const { targets: ts } = expandHand(hand, handIndex);
    if (ts.length === 0)
      throw new CardError(
        `Hand ${hand.id} has no valid version: every choice of suits and numbers needs more tiles than the set has.`,
        undefined,
        hand.id,
      );
    const mine: Target[] = [];
    for (const t of ts) {
      const full: Target = { ...t, index: targets.length };
      targets.push(full);
      mine.push(full);
    }
    targetsByHand.push(mine);
  });
  return {
    id: compiled.card.id,
    name: compiled.card.name,
    year: compiled.card.year,
    source: compiled.card.source,
    hands: compiled.hands,
    targets,
    targetsByHand,
  };
}

/**
 * Build a stand-alone target from explicit groups (for tests, tutorials and drills).
 * Returns null when the groups break supply limits.
 */
export function targetFromGroups(
  groups: { kind: Kind; size: number; jokers?: boolean }[],
  opts: { id?: string; value?: number; concealed?: boolean; jokerlessBonus?: boolean; section?: string } = {},
): Target | null {
  const hand: CompiledHand = {
    id: opts.id ?? 'custom',
    section: opts.section ?? 'Custom',
    line: 1,
    value: opts.value ?? 25,
    concealed: opts.concealed ?? false,
    jokerlessBonus: opts.jokerlessBonus ?? true,
    note: '',
    alternatives: [],
  };
  const tg: TargetGroup[] = groups.map((g, i) => ({ kind: g.kind, size: g.size, jokers: g.jokers ?? g.size >= 3, word: i }));
  const t = buildTarget(hand, 0, 0, tg);
  return t ? { ...t, index: 0 } : null;
}

/** Signature of the 14 natural tiles alone (ignores group structure), for counting "hands". */
export function naturalSignature(t: Target): string {
  const parts: string[] = [];
  for (const k of t.kinds) parts.push(`${k}x${(t.plain[k] as number) + (t.flex[k] as number)}`);
  return parts.join(',');
}
