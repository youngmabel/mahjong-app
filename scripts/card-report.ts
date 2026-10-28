/**
 * Card report: every line, how many concrete hands it allows, and one sample hand to compare with the
 * printed card (the line-by-line check in docs/03-card-2026.md section 7, step 4).
 *   npm run card
 */

import { describeTarget, loadCard, naturalSignature, targetWords } from '../src/engine/card';
import { PRACTICE_CARD_TEXT } from '../src/engine/cards/practice';
import { handLabel } from '../src/engine/describe';

const card = loadCard(PRACTICE_CARD_TEXT);
console.log(`${card.name} (${card.year}, source: ${card.source}): ${card.hands.length} lines, ${card.targets.length} concrete hands\n`);
const sections = new Map<string, { lines: number; targets: number; naturals: number }>();
card.hands.forEach((h, i) => {
  const ts = card.targetsByHand[i] ?? [];
  const naturals = new Set(ts.map(naturalSignature)).size;
  const sec = sections.get(h.section) ?? { lines: 0, targets: 0, naturals: 0 };
  sec.lines++;
  sec.targets += ts.length;
  sec.naturals += naturals;
  sections.set(h.section, sec);
  const sample = ts[0];
  console.log(`${handLabel(card.id, h.id)}  ${h.concealed ? 'C' : 'X'} ${h.value}${h.jokerlessBonus ? '' : '  (no jokerless bonus)'}`);
  console.log(`  Entered as:  ${h.alternatives.map((a) => a.display).join('  -or-  ')}`);
  if (h.note) console.log(`  Small print: ${h.note}`);
  console.log(`  Concrete hands: ${ts.length}${naturals !== ts.length ? ` (${naturals} distinct sets of 14 tiles)` : ''}`);
  if (sample) console.log(`  Example:     ${targetWords(sample).join(' | ')}\n               (${describeTarget(sample)})`);
  console.log('');
});
console.log('By section:');
for (const [name, s] of sections) console.log(`  ${name.padEnd(20)} ${s.lines} line${s.lines === 1 ? ' ' : 's'}  ${String(s.targets).padStart(4)} concrete hands`);
