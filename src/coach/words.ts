/** Small wording helpers so every coach sentence names tiles the same way the table log does. */

import { isWind, kindName, kindNamePlural, type Kind } from '../engine/tiles';

export const SIZE_NAME: Record<number, string> = { 1: 'single', 2: 'pair', 3: 'pung', 4: 'kong', 5: 'quint', 6: 'sextet' };

/** "5 Dot", "North wind", "Soap", "Red Dragon", "Flower". */
export function tileWord(k: Kind): string {
  return isWind(k) ? `${kindName(k)} wind` : kindName(k);
}

/** "5 Dots", "Norths", "Flowers". */
export function tilesWord(k: Kind): string {
  return kindNamePlural(k);
}

export function article(name: string): string {
  return /^[AEIOU8]|^1[18]\b/.test(name) ? 'an' : 'a';
}

/** "9 Dot, North wind and 4 Crak" (repeated kinds are named each time: "two 6 Dots"). */
export function tileList(kinds: readonly Kind[]): string {
  const seen = new Map<Kind, number>();
  for (const k of kinds) seen.set(k, (seen.get(k) ?? 0) + 1);
  const parts = [...seen.entries()].map(([k, n]) => (n === 1 ? tileWord(k) : `${n === 2 ? 'two' : 'three'} ${tilesWord(k)}`));
  if (parts.length <= 1) return parts[0] ?? '';
  return `${parts.slice(0, -1).join(', ')} and ${parts[parts.length - 1]}`;
}

export function plural(n: number, one: string, many = `${one}s`): string {
  return `${n} ${n === 1 ? one : many}`;
}

/** Counts sentences the simple way (for the two-sentence rule in the tests). */
export function sentenceCount(text: string): number {
  return text
    .replace(/\b(?:e\.g|i\.e|vs)\./g, '')
    .replace(/#\d+/g, '')
    .split(/[.!?](?:\s|$)/)
    .filter((s) => s.trim().length > 0).length;
}
