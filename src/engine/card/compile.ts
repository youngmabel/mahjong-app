/**
 * Compile the entry notation (Layer 1) into the card JSON (Layer 2), checking each line and
 * explaining any mistake in plain words ("this line adds up to 13 tiles").
 */

import {
  CardError,
  type Color,
  type CompiledAlternative,
  type CompiledCard,
  type CompiledGroup,
  type CompiledHand,
  type CompiledTile,
} from './types';
import {
  formatWord,
  isGroupWord,
  parseCardText,
  type ParsedLine,
  type ParsedOptions,
  type PatternToken,
  type PatternWord,
} from './notation';

const MAX_GROUP = 6; // a sextet is the largest legal group, flowers included (docs/07-app-spec.md 4.2)

export function sectionSlug(section: string): string {
  return section
    .toLowerCase()
    .replace(/&/g, 'and')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

/** No jokerless bonus for Singles and Pairs [H] or Quints [M] (docs/01-rules.md section 13). */
export function defaultJokerlessBonus(section: string): boolean {
  const s = section.toLowerCase().replace(/[^a-z]/g, '');
  if (s === 'singlesandpairs' || s === 'singlespairs') return false;
  if (s === 'quints' || s === 'quint') return false;
  return true;
}

function needColor(t: PatternToken, word: PatternWord, lineNo: number): Color {
  if (!t.color) {
    const what = t.sym === 'D' ? 'D (dragon)' : t.sym === 'var' ? 'number variable' : t.sym;
    throw new CardError(`The ${what} in "${formatWord(word)}" needs an ink color (g, r or b).`, lineNo);
  }
  return t.color;
}

const LITERAL_DRAGON: Record<Color, string> = { r: 'RD', g: 'GD', b: 'WD' };

function compileTile(t: PatternToken, word: PatternWord, opts: ParsedOptions, lineNo: number): CompiledTile {
  if (t.sym >= '1' && t.sym <= '9') {
    const suit = needColor(t, word, lineNo);
    const d = Number(t.sym);
    return opts.slide ? { t: 'numVar', suit, v: 's', off: d } : { t: 'num', suit, n: d };
  }
  switch (t.sym) {
    case 'var':
      return { t: 'numVar', suit: needColor(t, word, lineNo), v: t.varName as string, off: t.offset ?? 0 };
    case '0':
      return { t: 'fixed', code: 'WD' }; // Soap as zero, whatever its printed color
    case 'F':
      return { t: 'fixed', code: 'F' };
    case 'N':
    case 'E':
    case 'W':
    case 'S':
      return opts.windAny ? { t: 'windVar', v: t.sym } : { t: 'fixed', code: t.sym };
    case 'D': {
      const c = needColor(t, word, lineNo);
      if (opts.dragon === 'literal') return { t: 'fixed', code: LITERAL_DRAGON[c] };
      if (opts.dragon === 'any') return { t: 'dragonVar', v: c };
      return { t: 'dragonOf', suit: c };
    }
    default:
      throw new CardError(`Unknown symbol "${t.sym}".`, lineNo);
  }
}

function compileAlternative(words: PatternWord[], display: string, opts: ParsedOptions, lineNo: number): CompiledAlternative {
  const groups: CompiledGroup[] = [];
  const digits: number[] = [];
  let hasVar = false;
  words.forEach((word, wi) => {
    for (const t of word) {
      if (t.sym >= '1' && t.sym <= '9') digits.push(Number(t.sym));
      if (t.sym === 'var') hasVar = true;
    }
    if (isGroupWord(word)) {
      if (word.length > MAX_GROUP)
        throw new CardError(`"${formatWord(word)}" is a group of ${word.length}; the largest group is a sextet (6).`, lineNo);
      const size = word.length;
      groups.push({ size, tile: compileTile(word[0] as PatternToken, word, opts, lineNo), jokers: size >= 3 && !opts.jokersNever, word: wi });
    } else {
      for (const t of word) groups.push({ size: 1, tile: compileTile(t, word, opts, lineNo), jokers: false, word: wi });
    }
  });

  const total = groups.reduce((n, g) => n + g.size, 0);
  if (total !== 14) throw new CardError(`"${display}" adds up to ${total} tiles; every hand needs exactly 14.`, lineNo);

  if (opts.slide && hasVar) throw new CardError('Use either slide options or {x} variables in a line, not both.', lineNo);

  // Suit variables come from the ink colors of number tiles and suit-tied dragons.
  const numberColors = new Set<Color>();
  const dragonColors = new Set<Color>();
  for (const g of groups) {
    if (g.tile.t === 'num' || g.tile.t === 'numVar') numberColors.add(g.tile.suit);
    if (g.tile.t === 'dragonOf') dragonColors.add(g.tile.suit);
  }
  if (opts.dragon === 'matching') {
    for (const c of dragonColors)
      if (!numberColors.has(c))
        throw new CardError(`dragon=matching, but a dragon is colored "${c}" and no number tiles share that color.`, lineNo);
  }
  if (opts.dragon === 'opposite') {
    for (const c of dragonColors)
      if (numberColors.has(c))
        throw new CardError(`dragon=opposite, but a dragon shares color "${c}" with number tiles.`, lineNo);
  }
  const suitVars = [...new Set<Color>([...numberColors, ...dragonColors])].sort();
  for (const c of opts.free)
    if (!suitVars.includes(c)) throw new CardError(`free=${c}, but no suited tiles use color "${c}".`, lineNo);
  for (const [a, b] of opts.differ)
    if (!suitVars.includes(a) || !suitVars.includes(b))
      throw new CardError(`differ=${a}:${b} names a color the pattern doesn't use.`, lineNo);

  // Number variables.
  const numberVars: { name: string; domain: number[] }[] = [];
  if (opts.slide) {
    if (digits.length === 0) throw new CardError('A slide option needs number tiles to slide.', lineNo);
    const lo = Math.min(...digits);
    const hi = Math.max(...digits);
    const shifts: number[] = [];
    for (let s = 1 - lo; s <= 9 - hi; s++) {
      if (opts.slide2 && s % 2 !== 0) continue;
      if (opts.lowest && !opts.lowest.includes(lo + s)) continue;
      shifts.push(s);
    }
    if (shifts.length === 0) throw new CardError('The slide options leave no allowed numbers.', lineNo);
    numberVars.push({ name: 's', domain: shifts });
  } else {
    const names = new Set<string>();
    for (const g of groups) if (g.tile.t === 'numVar') names.add(g.tile.v);
    for (const name of [...names].sort()) {
      numberVars.push({ name, domain: opts.varDomains[name] ?? [1, 2, 3, 4, 5, 6, 7, 8, 9] });
    }
  }
  for (const name of Object.keys(opts.varDomains))
    if (!numberVars.some((v) => v.name === name)) throw new CardError(`"${name}=..." names a variable the pattern doesn't use.`, lineNo);
  for (const name of opts.numFree)
    if (!numberVars.some((v) => v.name === name)) throw new CardError(`numfree=${name} names a variable the pattern doesn't use.`, lineNo);

  const dragonVars = [...new Set(groups.flatMap((g) => (g.tile.t === 'dragonVar' ? [g.tile.v] : [])))].sort();
  const windVars = [...new Set(groups.flatMap((g) => (g.tile.t === 'windVar' ? [g.tile.v] : [])))].sort();

  return {
    display,
    groups,
    suitVars,
    freeSuits: [...new Set(opts.free)],
    suitDiffers: opts.differ,
    numberVars,
    numFree: opts.numFree,
    dragonVars,
    windVars,
  };
}

export function compileLine(line: ParsedLine, lineInSection: number): CompiledHand {
  const id = line.id ?? `${sectionSlug(line.section)}-${lineInSection}`;
  const alternatives = line.patterns.map((p, i) => compileAlternative(p, line.patternTexts[i] as string, line.options, line.lineNo));
  return {
    id,
    section: line.section,
    line: lineInSection,
    value: line.value,
    concealed: line.concealed,
    jokerlessBonus: line.options.bonus ?? defaultJokerlessBonus(line.section),
    note: line.note,
    alternatives,
  };
}

/** Compile a card text file into Layer 2 JSON. Throws CardError with a plain-English message. */
export function compileCardText(text: string): CompiledCard {
  const parsed = parseCardText(text);
  const h = parsed.header;
  if (!h.card) throw new CardError('The card file needs a "card: <id>" header line.');
  const perSection = new Map<string, number>();
  const hands = parsed.lines.map((line) => {
    const n = (perSection.get(line.section) ?? 0) + 1;
    perSection.set(line.section, n);
    return compileLine(line, n);
  });
  return {
    schemaVersion: 1,
    card: {
      id: h.card,
      name: h.name ?? h.card,
      year: Number(h.year ?? 0),
      source: h.source ?? 'user-supplied',
    },
    hands,
  };
}
