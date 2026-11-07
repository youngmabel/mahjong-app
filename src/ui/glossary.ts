/**
 * Words a beginner may not know, each with a one- or two-sentence meaning. In the coach's bubbles, the
 * spotlight and the prompt, the first mention of each word is underlined; tapping it shows the meaning.
 * Every meaning states a rule from docs/01-rules.md (rated high confidence there) or a term from
 * docs/02-tiles-and-terms.md, in plain words; app features are described as the app's.
 */

export interface Term {
  /** The word as shown in the meaning's heading. */
  term: string;
  /** Every spelling that should link to this meaning (lower case; longest matches win). */
  forms: string[];
  meaning: string;
  /** Tile codes for a small picture, e.g. "5D 5D 5D". */
  example?: string;
}

export const GLOSSARY: readonly Term[] = [
  {
    term: 'Charleston',
    forms: ['charleston'],
    meaning:
      'Passing tiles before play begins: 3 to the right, 3 across, then 3 to the left. A second round (left, across, right) follows unless any player stops it.',
  },
  {
    term: 'Blind pass',
    forms: ['blind pass', 'pass blind', 'blind'],
    meaning:
      'On the first left and the last right, you may pass on 1 to 3 of the tiles coming to you without looking at them, and make up the rest of your 3 from your rack.',
  },
  {
    term: 'Courtesy pass',
    forms: ['courtesy pass', 'courtesy'],
    meaning: 'After the Charleston, you and the player across may trade 0 to 3 tiles. The lower of your two offers is used.',
  },
  { term: 'Single', forms: ['single', 'singles'], meaning: 'One tile on its own. A joker can never stand in for a single.', example: 'N' },
  { term: 'Pair', forms: ['pair', 'pairs'], meaning: 'Two identical tiles. A joker can never be used in a pair.', example: '5D 5D' },
  { term: 'Pung', forms: ['pung', 'pungs'], meaning: 'Three identical tiles. Jokers can stand in for any of them.', example: '5D 5D J' },
  { term: 'Kong', forms: ['kong', 'kongs'], meaning: 'Four identical tiles. Jokers can stand in for any of them.', example: '2B 2B 2B 2B' },
  {
    term: 'Quint',
    forms: ['quint', 'quints'],
    meaning: 'Five identical tiles. There are only four of each tile, so a quint needs a joker, unless it is made of flowers (there are eight).',
    example: '7C 7C 7C 7C J',
  },
  { term: 'Sextet', forms: ['sextet', 'sextets'], meaning: 'Six identical tiles. Like a quint, it needs jokers unless it is made of flowers.' },
  {
    term: 'Exposure',
    forms: ['exposure', 'exposures', 'expose', 'exposed', 'exposing'],
    meaning:
      'A pung, kong, quint or sextet you finish with a called discard and place face up on your rack. Every exposure must fit a hand on the card.',
  },
  {
    term: 'Calling',
    forms: ['call', 'calls', 'called', 'calling', 'claim', 'claimed'],
    meaning:
      'Taking the latest discard: either to finish a pung, kong, quint or sextet that you then expose, or as the tile that completes Mah Jongg.',
  },
  {
    term: 'Joker exchange',
    forms: ['joker exchange', 'joker exchanges', 'exchange'],
    meaning: 'On your turn, you may trade a real tile from your rack for an exposed joker that stands for that tile, in anyone’s exposure.',
  },
  {
    term: 'Joker',
    forms: ['joker', 'jokers'],
    meaning: 'A wild tile: it can stand in for any tile in a group of 3 or more, but never in a single or a pair. There are 8.',
    example: 'J',
  },
  {
    term: 'Concealed hand',
    forms: ['concealed'],
    meaning: 'A hand marked C on the card. You expose nothing before Mah Jongg, so you may call only the tile that completes it.',
  },
  { term: 'Mah Jongg', forms: ['mah jongg'], meaning: 'What you call out when your 14 tiles exactly match one hand on the card. You win!' },
  {
    term: 'Wall',
    forms: ['wall'],
    meaning: 'The face-down tiles still to be drawn. If it runs out with no winner, it is a wall game and nobody pays.',
  },
  { term: 'Dealer', forms: ['dealer'], meaning: 'The dealer sits East, starts with 14 tiles, and makes the first discard without drawing.' },
  {
    term: 'Dead hand',
    forms: ['dead hand', 'dead hands', 'goes dead', 'went dead', 'hand is dead'],
    meaning: 'A hand that can no longer win, or that broke a rule. Its player sits out the rest of the game but still pays the winner.',
  },
  { term: 'Soap', forms: ['soap', 'soaps'], meaning: 'The White Dragon. On the card it also stands for zero, as in 2026.', example: 'WD' },
  {
    term: 'Dragons',
    forms: ['dragon', 'dragons'],
    meaning: 'Red, Green and White (Soap). Each goes with a suit: Red with Craks, Green with Bams, Soap with Dots.',
    example: 'RD GD WD',
  },
  {
    term: 'Flower',
    forms: ['flower', 'flowers'],
    meaning: 'Any of the 8 flower tiles. They all count as the same tile, whatever the picture.',
    example: 'F F',
  },
  {
    term: 'NEWS',
    forms: ['news'],
    meaning: 'North, East, West and South as four single tiles. It is not a kong: no jokers, and you can call for it only to win.',
    example: 'N E W S',
  },
  { term: 'Like numbers', forms: ['like numbers'], meaning: 'The same number in different suits, like a 3 Bam, a 3 Crak and a 3 Dot.', example: '3B 3C 3D' },
  { term: 'Consecutive Run', forms: ['consecutive run'], meaning: 'A card section of hands built on numbers in a row, like 3, 4, 5.' },
  {
    term: 'Singles and Pairs',
    forms: ['singles and pairs'],
    meaning: 'A card section of hands made only of single tiles and pairs. They are always concealed, and jokers are never used.',
  },
  { term: '2468', forms: ['2468'], meaning: 'A card section of hands built on the even numbers 2, 4, 6 and 8.' },
  { term: '13579', forms: ['13579'], meaning: 'A card section of hands built on the odd numbers 1, 3, 5, 7 and 9.' },
  { term: '369', forms: ['369'], meaning: 'A card section of hands built on 3s, 6s and 9s.' },
  { term: 'Winds-Dragons', forms: ['winds-dragons'], meaning: 'A card section of hands built from winds and dragons.' },
  {
    term: 'Jokerless',
    forms: ['jokerless'],
    meaning: 'A win with no jokers. It doubles the payment, except for Singles and Pairs and Quints.',
  },
  {
    term: 'Self-pick',
    forms: ['self-pick', 'self-picked', 'self-picks'],
    meaning: 'Winning on a tile you drew from the wall yourself. All three other players pay double.',
  },
  {
    term: 'Tiles away',
    forms: ['tiles away', 'tile away', 'away'],
    meaning: 'How many more tiles a hand still needs. At 1 away, the right tile completes it.',
  },
  { term: 'The card', forms: ['the card', 'card'], meaning: 'The list of winning hands. A winning hand must match one line on it exactly.' },
  {
    term: 'Pinned hand',
    forms: ['pinned hand', 'pinned', 'pin'],
    meaning: 'A hand you have marked to aim for. This app draws it above your rack, with the tiles you hold lit up.',
  },
  {
    term: 'Heavenly Hand',
    forms: ['heavenly hand'],
    meaning: "East's 14 dealt tiles already make a hand on the card. East declares Mah Jongg at once, and the Charleston is skipped.",
  },
];

export type Segment = { text: string } | { text: string; term: Term };

const FORMS: { form: string; term: Term }[] = GLOSSARY.flatMap((t) => t.forms.map((form) => ({ form, term: t }))).sort(
  (a, b) => b.form.length - a.form.length,
);

const WORD = /[A-Za-z0-9-]/;

/**
 * Split text into plain parts and glossary words. Only the first mention of each term is linked, whole
 * words only ("pair" in "pairs" links to Pair through its own spelling, never inside "repaired").
 */
export function splitTerms(text: string, skip: ReadonlySet<string> = new Set()): Segment[] {
  const lower = text.toLowerCase();
  const out: Segment[] = [];
  const linked = new Set<string>(skip);
  let plainStart = 0;
  let i = 0;
  while (i < text.length) {
    let hit: { form: string; term: Term } | null = null;
    if (i === 0 || !WORD.test(text.charAt(i - 1))) {
      for (const f of FORMS) {
        if (linked.has(f.term.term)) continue;
        if (!lower.startsWith(f.form, i)) continue;
        const after = text.charAt(i + f.form.length);
        if (after && WORD.test(after)) continue;
        hit = f;
        break;
      }
    }
    if (hit) {
      if (i > plainStart) out.push({ text: text.slice(plainStart, i) });
      out.push({ text: text.slice(i, i + hit.form.length), term: hit.term });
      linked.add(hit.term.term);
      i += hit.form.length;
      plainStart = i;
    } else i++;
  }
  if (plainStart < text.length) out.push({ text: text.slice(plainStart) });
  return out;
}

export function findTerm(name: string): Term | undefined {
  return GLOSSARY.find((t) => t.term === name);
}
