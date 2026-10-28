/** Shared helpers for tests: build hands from tile codes, brute-force reference checks. */

import type { Target } from '../src/engine/card';
import type { ExposureInfo } from '../src/engine/matcher';
import { JOKER, NUM_KINDS, emptyCounts, kindsFromCodes, type Kind } from '../src/engine/tiles';

/** Count vector from codes like "2B 2B J F". */
export function hand(codes: string): number[] {
  const c = emptyCounts();
  for (const k of kindsFromCodes(codes)) c[k]++;
  return c;
}

export interface Slot {
  kind: Kind;
  jokerOk: boolean;
}

/** Maximum bipartite matching of tiles to slots (Kuhn's augmenting paths). Independent of the matcher's counting method. */
export function maxMatching(tiles: readonly Kind[], slots: readonly Slot[]): number {
  const slotOwner = new Array<number>(slots.length).fill(-1);
  const canFill = (tile: Kind, s: Slot) => tile === s.kind || (tile === JOKER && s.jokerOk);
  const tryAssign = (ti: number, seen: boolean[]): boolean => {
    for (let si = 0; si < slots.length; si++) {
      if (seen[si] || !canFill(tiles[ti] as Kind, slots[si] as Slot)) continue;
      seen[si] = true;
      if (slotOwner[si] === -1 || tryAssign(slotOwner[si] as number, seen)) {
        slotOwner[si] = ti;
        return true;
      }
    }
    return false;
  };
  let matched = 0;
  for (let ti = 0; ti < tiles.length; ti++) if (tryAssign(ti, new Array<boolean>(slots.length).fill(false))) matched++;
  return matched;
}

/** Exhaustive search for the largest assignment (only for tiny cases); used to double-check maxMatching itself. */
export function exhaustiveMax(tiles: readonly Kind[], slots: readonly Slot[]): number {
  const used = new Array<boolean>(slots.length).fill(false);
  let best = 0;
  const rec = (ti: number, count: number) => {
    if (count + (tiles.length - ti) <= best) return;
    if (ti === tiles.length) {
      best = Math.max(best, count);
      return;
    }
    const tile = tiles[ti] as Kind;
    for (let si = 0; si < slots.length; si++) {
      const s = slots[si] as Slot;
      if (used[si] || !(tile === s.kind || (tile === JOKER && s.jokerOk))) continue;
      used[si] = true;
      rec(ti + 1, count + 1);
      used[si] = false;
    }
    rec(ti + 1, count);
  };
  rec(0, 0);
  return best;
}

/** Every way to give each exposure its own group of the same kind and size (joker-eligible). */
export function exposureAssignments(t: Target, exposures: readonly ExposureInfo[]): number[][] {
  const out: number[][] = [];
  const used = new Array<boolean>(t.groups.length).fill(false);
  const pick: number[] = [];
  const rec = (ei: number) => {
    if (ei === exposures.length) {
      out.push([...pick]);
      return;
    }
    const e = exposures[ei] as ExposureInfo;
    t.groups.forEach((g, gi) => {
      if (used[gi] || g.kind !== e.kind || g.size !== e.size || !g.jokers) return;
      used[gi] = true;
      pick.push(gi);
      rec(ei + 1);
      pick.pop();
      used[gi] = false;
    });
  };
  rec(0);
  return out;
}

function tilesOf(counts: ArrayLike<number>): Kind[] {
  const tiles: Kind[] = [];
  for (let k = 0; k < NUM_KINDS; k++) for (let i = 0; i < (counts[k] as number); i++) tiles.push(k);
  return tiles;
}

/** Brute-force tiles away: fewest unfilled slots over every way the exposures could fit. */
export function bruteTilesAway(t: Target, counts: ArrayLike<number>, exposures: readonly ExposureInfo[]): number {
  if (t.concealed && exposures.length > 0) return Infinity;
  const tiles = tilesOf(counts);
  let best = Infinity;
  for (const used of exposureAssignments(t, exposures)) {
    const slots: Slot[] = [];
    t.groups.forEach((g, gi) => {
      if (used.includes(gi)) return;
      for (let i = 0; i < g.size; i++) slots.push({ kind: g.kind, jokerOk: g.jokers });
    });
    best = Math.min(best, slots.length - maxMatching(tiles, slots));
  }
  return best;
}

/** Brute-force win check: the hidden tiles fill every remaining slot exactly, for some way the exposures fit. */
export function bruteComplete(t: Target, counts: ArrayLike<number>, exposures: readonly ExposureInfo[]): boolean {
  if (t.concealed && exposures.length > 0) return false;
  const tiles = tilesOf(counts);
  for (const used of exposureAssignments(t, exposures)) {
    const slots: Slot[] = [];
    t.groups.forEach((g, gi) => {
      if (used.includes(gi)) return;
      for (let i = 0; i < g.size; i++) slots.push({ kind: g.kind, jokerOk: g.jokers });
    });
    if (tiles.length === slots.length && maxMatching(tiles, slots) === slots.length) return true;
  }
  return false;
}
