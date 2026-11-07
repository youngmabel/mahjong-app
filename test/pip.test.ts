/**
 * Tests for Pip, the visible coach (milestone 4, part 1): words you can tap and their meanings, Pip's
 * friendly wording of the coach's suggestions, the seat map's pass arrows, a spotlight for every rule card,
 * the tour, who lands on the start screen, and the content guardrails (docs/05-teaching-plan.md section 8)
 * over every new piece of text.
 */

import { beforeAll, describe, expect, it } from 'vitest';
import { loadCard } from '../src/engine/card';
import { PRACTICE_CARD_TEXT } from '../src/engine/cards/practice';
import { newGame, windOf } from '../src/engine/engine';
import { buildScenario } from '../src/engine/scenario';
import { kindFromCode } from '../src/engine/tiles';
import { seatView } from '../src/engine/view';
import { RULE_CARDS, coachNote, type CoachNote } from '../src/coach';
import { RULE_SPOTS, TOUR, bubbleFor, isNewPlayer, seatMap } from '../src/ui/coachview';
import { GLOSSARY, splitTerms } from '../src/ui/glossary';
import { emptyProgress } from '../src/ui/progress';
import type { SavedGame } from '../src/ui/session';

beforeAll(() => {
  loadCard(PRACTICE_CARD_TEXT);
});

function sentences(text: string): number {
  return text.split(/(?<=[.!?])\s+(?=[A-Z0-9"])/).filter((s) => s.trim().length > 0).length;
}

/** Every new piece of text a learner reads in part 1. */
function allNewText(): string[] {
  return [
    ...GLOSSARY.flatMap((t) => [t.term, t.meaning]),
    ...TOUR.flatMap((s) => [s.title, s.text]),
    ...Object.values(RULE_SPOTS).map((s) => s.lead),
    ...Object.values(RULE_CARDS).flatMap((c) => [c.title, c.text]),
  ];
}

describe('words you can tap', () => {
  it('gives every word a meaning of one or two sentences', () => {
    const names = new Set<string>();
    for (const t of GLOSSARY) {
      expect(names.has(t.term), t.term).toBe(false);
      names.add(t.term);
      expect(t.meaning.length, t.term).toBeGreaterThan(20);
      expect(sentences(t.meaning), t.term).toBeLessThanOrEqual(2);
      for (const f of t.forms) expect(f, t.term).toBe(f.toLowerCase());
      if (t.example) for (const code of t.example.split(' ')) expect(() => kindFromCode(code), `${t.term}: ${code}`).not.toThrow();
    }
  });

  it('never gives two meanings the same spelling', () => {
    const seen = new Map<string, string>();
    for (const t of GLOSSARY)
      for (const f of t.forms) {
        expect(seen.get(f), `"${f}" in ${t.term} and ${seen.get(f)}`).toBeUndefined();
        seen.set(f, t.term);
      }
  });

  it('links the first mention of each word only, keeping the text exactly as written', () => {
    const text = 'A pung is three tiles; another pung is still a pung. Jokers fill a pung but never a pair.';
    const segs = splitTerms(text);
    expect(segs.map((s) => s.text).join('')).toBe(text);
    const linked = segs.filter((s) => 'term' in s).map((s) => s.text);
    expect(linked).toEqual(['pung', 'Jokers', 'pair']);
  });

  it('matches whole words only, longest spelling first', () => {
    expect(splitTerms('The pump was repaired.').some((s) => 'term' in s)).toBe(false);
    const ex = splitTerms('A joker exchange takes a joker.').filter((s) => 'term' in s);
    expect(ex[0]?.text).toBe('joker exchange');
    expect('term' in (ex[0] as object) && (ex[0] as { term: { term: string } }).term.term).toBe('Joker exchange');
    expect(ex[1]?.text).toBe('joker');
    const pairs = splitTerms('Keep your pairs.').filter((s) => 'term' in s);
    expect(pairs.map((s) => s.text)).toEqual(['pairs']);
  });
});

describe('content guardrails on every new piece of text', () => {
  it('teaches no Chinese-only ideas and no wrong rules', () => {
    for (const text of allNewText()) {
      const t = text.toLowerCase();
      expect(t, text).not.toMatch(/\bchows?\b/); // runs are single tiles, never chows
      expect(t, text).not.toMatch(/prevailing wind|wind rounds?|round of the wind/); // no wind rounds in American play
      expect(t, text).not.toMatch(/kongs? must be concealed/);
      expect(t, text).not.toMatch(/card (says|specifies|names) (which|the) suit/);
      expect(t, text).not.toMatch(/clockwise/); // say "to the right", as the rules do
      expect(text, text).not.toContain('—'); // no em dashes on screen
    }
  });

  it('states the direction of play and the deal the way the rules do', () => {
    expect(TOUR.some((s) => s.text.includes('Play goes to the right'))).toBe(true);
    const dealer = GLOSSARY.find((t) => t.term === 'Dealer');
    expect(dealer?.meaning).toContain('starts with 14 tiles');
    const charleston = GLOSSARY.find((t) => t.term === 'Charleston');
    expect(charleston?.meaning).toMatch(/right, 3 across, then 3 to the left/);
  });

  it('keeps jokers out of singles and pairs, and NEWS a set of singles', () => {
    expect(GLOSSARY.find((t) => t.term === 'Pair')?.meaning).toMatch(/never/);
    expect(GLOSSARY.find((t) => t.term === 'Single')?.meaning).toMatch(/never/);
    expect(GLOSSARY.find((t) => t.term === 'NEWS')?.meaning).toMatch(/single tiles.*not a kong/);
  });
});

describe('the spotlight and the tour', () => {
  it('has a spotlight, with a short lead-in, for every rule card', () => {
    for (const key of Object.keys(RULE_CARDS)) {
      const spot = RULE_SPOTS[key];
      expect(spot, key).toBeDefined();
      expect(sentences((spot as { lead: string }).lead), key).toBeLessThanOrEqual(2);
    }
  });

  it('walks the table in short steps', () => {
    expect(TOUR.length).toBeGreaterThanOrEqual(6);
    for (const s of TOUR) expect(sentences(s.text), s.title).toBeLessThanOrEqual(2);
  });
});

describe("Pip's words", () => {
  const note = (over: Partial<CoachNote>): CoachNote => ({
    topic: 'pass',
    text: 'Suggestion: pass 8 Bam, 5 Dot and North wind.',
    why: 'None of your closest hands uses them.',
    extra: null,
    tiles: [],
    blind: 0,
    choiceKey: 'pass-tiles',
    tiers: ['Pass what fits your possible hands least.', 'b', 'c', 'd'],
    ...over,
  });

  it('turns a suggestion into "I\'d ..." and says where passed tiles go', () => {
    const g = newGame({ seed: 'pip-1', cardId: 'practice', dealer: 0 }).state;
    const right = windOf(g, 1);
    const b = bubbleFor(note({}), g, 0);
    expect(b.say).toBe(`I'd pass 8 Bam, 5 Dot and North wind to ${right}, on your right.`);
    expect(b.why).toBe('None of your closest hands uses them.');
  });

  it("says when match 1 chose the tiles, and keeps the third tile for you on the second pass", () => {
    const g = newGame({ seed: 'pip-2', cardId: 'practice', dealer: 0 }).state;
    expect(bubbleFor(note({}), g, 0, 3).say).toMatch(/^I picked these 3 to pass to .+: 8 Bam, 5 Dot and North wind\. Tap Pass, or swap any of them\.$/);
    const two = bubbleFor(note({}), g, 0, 2);
    expect(two.say).toMatch(/^I picked 2 tiles to pass .+\. You choose the third\.$/);
    expect(two.say).not.toContain('North');
    expect(two.why).toBe('Pass what fits your possible hands least.');
  });

  it('keeps facts as facts, and says "let it go by" for a pass on a discard', () => {
    const g = newGame({ seed: 'pip-3', cardId: 'practice', dealer: 0 }).state;
    expect(bubbleFor(note({ topic: 'turn', text: 'You have Mah Jongg, so tap Mah Jongg.' }), g, 0).say).toBe('You have Mah Jongg, so tap Mah Jongg.');
    expect(bubbleFor(note({ topic: 'call', text: 'Suggestion: pass.' }), g, 0).say).toBe("I'd let this one go by.");
    expect(bubbleFor(note({ topic: 'turn', text: 'Suggestion: discard the North wind.' }), g, 0).say).toBe("I'd discard the North wind.");
  });

  it("words the coach's real notes for a whole Charleston without changing what it suggests", () => {
    const g = newGame({ seed: 'pip-4', cardId: 'practice', dealer: 0 }).state;
    const n = coachNote(seatView(g, 0), { hideConcealed: false, pinned: [] });
    expect(n?.topic).toBe('pass');
    const b = bubbleFor(n as CoachNote, g, 0);
    expect(b.say.startsWith("I'd pass ")).toBe(true);
    expect(sentences(b.say)).toBe(1);
  });
});

describe('the seat map', () => {
  it('puts you at the bottom, play going to the right, and points each pass the right way', () => {
    const expected = ['right', 'top', 'left', 'left', 'top', 'right'];
    for (let pass = 0; pass < 6; pass++) {
      const s = buildScenario({ seed: `map-${pass}`, cardId: 'practice', dealer: 0, phase: { name: 'charleston', pass } });
      const m = seatMap(s, 0);
      expect(m.seats.map((x) => x.side)).toEqual(['bottom', 'right', 'top', 'left']);
      expect(m.passTo, `pass ${pass}`).toBe(expected[pass]);
      expect(m.caption).toContain('Your 3 tiles go');
    }
  });

  it("marks whose turn it is and who just discarded", () => {
    const t = buildScenario({ seed: 'map-turn', cardId: 'practice', phase: { name: 'turn', seat: 2 } });
    const m = seatMap(t, 0);
    expect(m.seats.filter((x) => x.active).map((x) => x.seat)).toEqual([2]);
    expect(m.passTo).toBeNull();
    expect(m.caption).toBe(`${windOf(t, 2)}'s turn.`);
    const c = buildScenario({ seed: 'map-call', cardId: 'practice', floor: [{ seat: 3, code: '5D' }], phase: { name: 'callWindow', discarder: 3 } });
    expect(seatMap(c, 0).seats.filter((x) => x.active).map((x) => x.seat)).toEqual([3]);
  });
});

describe('the start screen', () => {
  it('greets only someone who has never played', () => {
    const p = emptyProgress();
    expect(isNewPlayer(p, null, null)).toBe(true);
    expect(isNewPlayer({ ...p, seenRules: ['tour'] }, null, null)).toBe(false);
    expect(isNewPlayer({ ...p, completed: [1] }, null, null)).toBe(false);
    expect(isNewPlayer(p, { v: 1 } as unknown as SavedGame, null)).toBe(false);
  });
});
