/**
 * Loading cards. A card can come from entry-notation text (Layer 1) or compiled JSON (Layer 2).
 * Loaded cards are kept in a small registry so a saved game can name its card by id.
 */

import { compileCardText } from './compile';
import { buildCard } from './expand';
import type { Card, CompiledCard, Target } from './types';
import { kindCode, kindName, kindNamePlural, SOAP } from '../tiles';

export * from './types';
export { compileCardText, sectionSlug, defaultJokerlessBonus } from './compile';
export { buildCard, expandHand, checkSupply, groupKey, naturalSignature, targetFromGroups } from './expand';
export { parseCardText, parsePattern, parseWord, formatPattern, formatWord, isGroupWord } from './notation';

const registry = new Map<string, Card>();

export function loadCard(source: string | CompiledCard): Card {
  const compiled = typeof source === 'string' ? compileCardText(source) : source;
  const card = buildCard(compiled);
  registry.set(card.id, card);
  return card;
}

export function registerCard(card: Card): void {
  registry.set(card.id, card);
}

export function getCard(id: string): Card {
  const c = registry.get(id);
  if (!c) throw new Error(`Card "${id}" is not loaded.`);
  return c;
}

const SIZE_WORD: Record<number, string> = { 1: '', 2: 'pair', 3: 'pung', 4: 'kong', 5: 'quint', 6: 'sextet' };

/** Tile codes for each pattern word, singles of one word joined: ["F F", "2B WD 2B 6B", "2C 2C 2C 2C", ...]. */
export function targetWords(t: Target): string[] {
  const words: string[][] = [];
  for (const g of t.groups) {
    const w = (words[g.word] ??= []);
    for (let i = 0; i < g.size; i++) w.push(kindCode(g.kind));
  }
  return words.filter((w) => w !== undefined).map((w) => w.join(' '));
}

/** Plain English: "pair of Flowers; 2 Bam, Soap, 2 Bam, 6 Bam; kong of 2 Craks; kong of 6 Dots". */
export function describeTarget(t: Target): string {
  const words: string[][] = [];
  for (const g of t.groups) {
    const w = (words[g.word] ??= []);
    if (g.size === 1) w.push(g.kind === SOAP ? 'Soap' : kindName(g.kind));
    else w.push(`${SIZE_WORD[g.size]} of ${kindNamePlural(g.kind)}`);
  }
  return words
    .filter((w) => w !== undefined)
    .map((w) => w.join(', '))
    .join('; ');
}
