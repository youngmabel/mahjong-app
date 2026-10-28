/**
 * Layer 1: the card entry notation, typed one line per printed card line.
 * Full guide with examples: docs/CARD-NOTATION.md.
 *
 *   section | value | X or C | pattern | or: pattern | opt: options | note: small print | id: ID
 *
 * Pattern words are separated by spaces. Inside a word:
 *   1-9   number tiles (need an ink color: g, r or b)
 *   0     Soap as zero (color ignored)
 *   F     Flower; N E W S winds (color ignored)
 *   D     Dragon (needs an ink color)
 *   {x}   a number variable, with an optional offset: {x+1}, {y-2}
 * A color letter after a token colors that token. If only the last token of a word has a color,
 * the color applies to the whole word ("2026g").
 * A word whose tokens are all identical is one group ("1111g" is a kong). Otherwise every token
 * is a single tile ("2026g", "NEWS", "123g").
 */

import { CardError, type Color } from './types';

export interface PatternToken {
  /** '0'-'9', 'F', 'D', 'N', 'E', 'W', 'S', or 'var' for a {x} variable. */
  sym: string;
  varName?: string;
  offset?: number;
  color?: Color;
}

export type PatternWord = PatternToken[];

export interface ParsedOptions {
  slide: boolean;
  slide2: boolean;
  lowest: number[] | null;
  varDomains: Record<string, number[]>;
  free: Color[];
  differ: [Color, Color][];
  numFree: string[];
  dragon: 'suit' | 'any' | 'literal' | 'matching' | 'opposite';
  windAny: boolean;
  bonus: boolean | null;
  jokersNever: boolean;
}

export interface ParsedLine {
  lineNo: number;
  section: string;
  value: number;
  concealed: boolean;
  /** The main pattern first, then each "or:" alternative. */
  patterns: PatternWord[][];
  patternTexts: string[];
  options: ParsedOptions;
  optionText: string;
  note: string;
  id: string | null;
}

export interface ParsedCard {
  header: Record<string, string>;
  lines: ParsedLine[];
}

const COLORS = new Set(['g', 'r', 'b']);
const SYMBOLS = new Set(['0', '1', '2', '3', '4', '5', '6', '7', '8', '9', 'F', 'D', 'N', 'E', 'W', 'S']);

export function defaultOptions(): ParsedOptions {
  return {
    slide: false,
    slide2: false,
    lowest: null,
    varDomains: {},
    free: [],
    differ: [],
    numFree: [],
    dragon: 'suit',
    windAny: false,
    bonus: null,
    jokersNever: false,
  };
}

/** Parse one pattern word such as "2026g", "1111r", "NEWS", "DgDrDb", "{x+1}{x+1}{x+1}g". */
export function parseWord(word: string, lineNo?: number): PatternWord {
  const tokens: PatternToken[] = [];
  let i = 0;
  while (i < word.length) {
    const ch = word[i] as string;
    if (SYMBOLS.has(ch)) {
      tokens.push({ sym: ch });
      i++;
    } else if (ch === '{') {
      const close = word.indexOf('}', i);
      if (close < 0) throw new CardError(`"${word}" has a "{" with no matching "}".`, lineNo);
      const inner = word.slice(i + 1, close).replace(/\s+/g, '');
      const m = /^([a-z][a-z0-9]*)([+-]\d+)?$/.exec(inner);
      if (!m) throw new CardError(`"{${inner}}" should look like {x}, {x+1} or {y-2}.`, lineNo);
      if (m[1] === 's') throw new CardError(`The variable name "s" is reserved for sliding hands; use another letter.`, lineNo);
      tokens.push({ sym: 'var', varName: m[1] as string, offset: m[2] ? Number(m[2]) : 0 });
      i = close + 1;
    } else if (COLORS.has(ch)) {
      const prev = tokens[tokens.length - 1];
      if (!prev) throw new CardError(`"${word}" starts with a color letter; put the color after the tile.`, lineNo);
      if (prev.color) throw new CardError(`"${word}" has two color letters in a row.`, lineNo);
      prev.color = ch as Color;
      i++;
    } else {
      throw new CardError(
        `"${ch}" in "${word}" is not a tile symbol. Use 1-9, 0, F, D, N, E, W, S, {x}, and color letters g, r, b.`,
        lineNo,
      );
    }
  }
  if (tokens.length === 0) throw new CardError(`Empty pattern word.`, lineNo);
  // A single color on the last token colors the whole word.
  const colored = tokens.filter((t) => t.color);
  const last = tokens[tokens.length - 1] as PatternToken;
  if (colored.length === 1 && last.color && tokens.length > 1) {
    for (const t of tokens) t.color = last.color;
  }
  return tokens;
}

export function parsePattern(text: string, lineNo?: number): PatternWord[] {
  const words = text.trim().split(/\s+/).filter((w) => w.length > 0);
  if (words.length === 0) throw new CardError('The pattern is empty.', lineNo);
  return words.map((w) => parseWord(w, lineNo));
}

function sameToken(a: PatternToken, b: PatternToken): boolean {
  return a.sym === b.sym && a.varName === b.varName && a.offset === b.offset && a.color === b.color;
}

/** True when a word is one group (all tokens identical), false when it is a row of single tiles. */
export function isGroupWord(word: PatternWord): boolean {
  const first = word[0] as PatternToken;
  return word.every((t) => sameToken(t, first));
}

function tokenText(t: PatternToken): string {
  if (t.sym === 'var') {
    const off = t.offset ?? 0;
    return `{${t.varName}${off > 0 ? `+${off}` : off < 0 ? `${off}` : ''}}`;
  }
  return t.sym;
}

/** Write a parsed word back out in canonical form (one trailing color when the word is one color). */
export function formatWord(word: PatternWord): string {
  const colors = new Set(word.map((t) => t.color ?? ''));
  if (colors.size === 1) {
    const c = word[0]?.color ?? '';
    return word.map(tokenText).join('') + c;
  }
  return word.map((t) => tokenText(t) + (t.color ?? '')).join('');
}

export function formatPattern(words: PatternWord[]): string {
  return words.map(formatWord).join(' ');
}

function parseNumberList(text: string, lineNo: number): number[] {
  const out: number[] = [];
  for (const part of text.split(',')) {
    const p = part.trim();
    const range = /^(\d)-(\d)$/.exec(p);
    if (range) {
      const a = Number(range[1]);
      const b = Number(range[2]);
      if (a > b) throw new CardError(`Range "${p}" runs backwards.`, lineNo);
      for (let n = a; n <= b; n++) out.push(n);
    } else if (/^\d$/.test(p)) {
      out.push(Number(p));
    } else {
      throw new CardError(`"${p}" should be a number 1-9 or a range like 2-8.`, lineNo);
    }
  }
  for (const n of out) if (n < 1 || n > 9) throw new CardError(`Numbers must be 1 to 9, not ${n}.`, lineNo);
  return [...new Set(out)].sort((x, y) => x - y);
}

function parseColorList(text: string, lineNo: number): Color[] {
  const out = text.split(',').map((s) => s.trim());
  for (const c of out) if (!COLORS.has(c)) throw new CardError(`"${c}" is not an ink color (g, r, b).`, lineNo);
  return out as Color[];
}

export function parseOptions(text: string, lineNo: number): ParsedOptions {
  const o = defaultOptions();
  for (const tok of text.trim().split(/\s+/).filter((s) => s.length > 0)) {
    const [key, val] = tok.includes('=') ? (tok.split('=', 2) as [string, string]) : [tok, ''];
    switch (key) {
      case 'slide':
        o.slide = true;
        break;
      case 'slide2':
        o.slide = true;
        o.slide2 = true;
        break;
      case 'lowest':
        o.slide = true;
        o.lowest = parseNumberList(val, lineNo);
        break;
      case 'free':
        o.free.push(...parseColorList(val, lineNo));
        break;
      case 'differ': {
        const m = /^([grb]):([grb])$/.exec(val);
        if (!m) throw new CardError(`"differ=${val}" should look like differ=r:g.`, lineNo);
        o.differ.push([m[1] as Color, m[2] as Color]);
        break;
      }
      case 'numfree':
        o.numFree.push(...val.split(',').map((s) => s.trim()));
        break;
      case 'dragon':
        if (!['any', 'literal', 'matching', 'opposite'].includes(val))
          throw new CardError(`"dragon=${val}" should be dragon=any, literal, matching or opposite.`, lineNo);
        o.dragon = val as ParsedOptions['dragon'];
        break;
      case 'wind':
        if (val !== 'any') throw new CardError(`"wind=${val}" should be wind=any.`, lineNo);
        o.windAny = true;
        break;
      case 'bonus':
        if (val !== 'yes' && val !== 'no') throw new CardError(`"bonus=${val}" should be bonus=yes or bonus=no.`, lineNo);
        o.bonus = val === 'yes';
        break;
      case 'jokers':
        if (val !== 'never') throw new CardError(`"jokers=${val}" should be jokers=never.`, lineNo);
        o.jokersNever = true;
        break;
      default:
        if (/^[a-z][a-z0-9]*$/.test(key) && val !== '' && key !== 's') {
          o.varDomains[key] = parseNumberList(val, lineNo);
        } else {
          throw new CardError(`Unknown option "${tok}".`, lineNo);
        }
    }
  }
  return o;
}

/** Parse a whole card file: "key: value" header lines, then one hand per line. */
export function parseCardText(text: string): ParsedCard {
  const header: Record<string, string> = {};
  const lines: ParsedLine[] = [];
  const rows = text.split(/\r?\n/);
  for (let i = 0; i < rows.length; i++) {
    const lineNo = i + 1;
    // '#' starts a comment only at the start of a line, so notes like "run #2" are safe.
    const raw = (rows[i] as string).trim();
    if (raw === '' || raw.startsWith('#')) continue;
    if (!raw.includes('|')) {
      const m = /^([a-z]+)\s*:\s*(.+)$/.exec(raw);
      if (!m) throw new CardError(`Not a hand line (no "|") and not a "key: value" header.`, lineNo);
      header[m[1] as string] = (m[2] as string).trim();
      continue;
    }
    const fields = raw.split('|').map((f) => f.trim());
    if (fields.length < 4) throw new CardError('A hand line needs at least: section | value | X or C | pattern', lineNo);
    const [section, valueText, xc, mainPattern, ...rest] = fields as [string, string, string, string, ...string[]];
    if (!section) throw new CardError('Missing section name.', lineNo);
    const value = Number(valueText);
    if (!Number.isInteger(value) || value <= 0) throw new CardError(`Value "${valueText}" should be a whole number like 25.`, lineNo);
    const xcUp = xc.toUpperCase();
    if (xcUp !== 'X' && xcUp !== 'C') throw new CardError(`"${xc}" should be X (exposed) or C (concealed).`, lineNo);
    const patternTexts = [mainPattern];
    let optionText = '';
    let note = '';
    let id: string | null = null;
    for (const f of rest) {
      const m = /^(or|opt|note|id)\s*:\s*(.*)$/.exec(f);
      if (!m) throw new CardError(`Extra field "${f}" should start with or:, opt:, note: or id:.`, lineNo);
      const [, tag, body] = m as unknown as [string, string, string];
      if (tag === 'or') patternTexts.push(body);
      else if (tag === 'opt') optionText = optionText ? `${optionText} ${body}` : body;
      else if (tag === 'note') note = body;
      else id = body.trim();
    }
    const patterns = patternTexts.map((p) => parsePattern(p, lineNo));
    lines.push({
      lineNo,
      section,
      value,
      concealed: xcUp === 'C',
      patterns,
      patternTexts: patternTexts.map((p) => p.trim().replace(/\s+/g, ' ')),
      options: parseOptions(optionText, lineNo),
      optionText,
      note,
      id,
    });
  }
  return { header, lines };
}
