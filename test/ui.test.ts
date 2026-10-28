/**
 * Tests for the playable screen's logic (milestone 2): the move lists behind every button, the game
 * driver, saving and resuming, and the layouts (rack, discard chart, cheat sheet). A stand-in player
 * plays whole games using only what the screen offers.
 */

import { beforeAll, describe, expect, it } from 'vitest';
import { getCard, loadCard } from '../src/engine/card';
import { PRACTICE_CARD_TEXT } from '../src/engine/cards/practice';
import { apply, checkInvariants, revalidateWin } from '../src/engine/engine';
import { Rng } from '../src/engine/rng';
import { buildScenario, tilesFromHand, type ScenarioSetup } from '../src/engine/scenario';
import type { GameState } from '../src/engine/state';
import { JOKER, kindCode, kindFromCode, kindOfTile } from '../src/engine/tiles';
import { CHART_ROWS, cheatSheet, describeCell, discardChart, exampleCodes, rackGroups } from '../src/ui/layout';
import {
  callChoices,
  charlestonPassChoice,
  exchangeChoices,
  promptFor,
  relativePosition,
  shouldStopForCall,
  turnChoices,
} from '../src/ui/moves';
import { DEFAULT_PREFS, readPrefs, tileStyles, type Prefs } from '../src/ui/prefs';
import { HUMAN, Session, type SavedGame } from '../src/ui/session';
import { allSymbolIds, cleanSprite } from '../src/ui/tiles/clean';
import { FakeHost, newStats, playToEnd, standInMove } from './standin';

beforeAll(() => {
  loadCard(PRACTICE_CARD_TEXT);
});

const prefs = (over: Partial<Prefs> = {}): Prefs => ({ ...DEFAULT_PREFS, progress: { ...DEFAULT_PREFS.progress }, ...over });

function scenario(s: Omit<ScenarioSetup, 'cardId' | 'seed'> & { seed?: string }): GameState {
  const state = buildScenario({ seed: 'ui-test', cardId: 'practice', ...s });
  expect(checkInvariants(state)).toEqual([]);
  return state;
}

function savedFrom(state: GameState): SavedGame {
  return { v: 1, sessionId: 'test', state, log: [], lastDrawn: null, newestDiscard: null };
}

describe('the stand-in player (only the moves the screen offers)', () => {
  it('plays 40 complete games with Safety off and every offered move accepted', () => {
    const stats = newStats();
    const endings: Record<string, number> = {};
    for (let g = 0; g < 40; g++) {
      const host = new FakeHost();
      const session = new Session(host, prefs({ safety: false, stopEveryDiscard: g % 2 === 0 }));
      session.advance();
      playToEnd(session, host, Rng.fromSeed(`standin-off-${g}`), stats);
      const s = session.state;
      expect(checkInvariants(s)).toEqual([]);
      expect(revalidateWin(s)).toBeNull();
      const r = s.phase.name === 'ended' ? s.phase.result : null;
      const key = r ? (r.type === 'mahjong' ? (r.winner === HUMAN ? 'you won' : 'computer won') : r.type) : 'none';
      endings[key] = (endings[key] ?? 0) + 1;
      expect(host.saves.length).toBeGreaterThan(0);
    }
    expect(stats.moves).toBeGreaterThan(400);
    // the stand-in reached every kind of move the screen offers
    for (const kind of ['charlestonPass', 'charlestonVote', 'courtesyOffer', 'discard', 'pass', 'claimExposure', 'jokerExchange', 'amendExposure'])
      expect(stats.byKind[kind] ?? 0, kind).toBeGreaterThan(0);
    expect(stats.refusalsChecked).toBeGreaterThan(10);
    expect(Object.values(endings).reduce((a, b) => a + b, 0)).toBe(40);
  });

  it('plays 25 complete games with Safety on, across a session of several games', () => {
    const stats = newStats();
    const host = new FakeHost();
    const session = new Session(host, prefs({ safety: true }));
    session.advance();
    const rng = Rng.fromSeed('standin-on');
    for (let g = 0; g < 25; g++) {
      playToEnd(session, host, rng, stats);
      expect(session.state.gameNumber).toBe(g + 1);
      const total = session.state.scores.reduce((a, b) => a + b, 0);
      expect(total).toBe(0); // only the winner is paid, by the others
      // with Safety on, your hand is never made dead by your own exposure
      const me = session.state.players[HUMAN] as GameState['players'][number];
      if (me.dead) expect(me.dead.code).not.toBe('exposuresFitNoHand');
      session.nextGame();
    }
    expect(stats.byKind.claimExposure ?? 0).toBeGreaterThan(0);
  });

  it('passes the deal to the right after each game and keeps scores', () => {
    const host = new FakeHost();
    const session = new Session(host, prefs());
    session.advance();
    const rng = Rng.fromSeed('deal-pass');
    playToEnd(session, host, rng, newStats());
    const first = session.state.dealer;
    const scores = [...session.state.scores];
    session.nextGame();
    expect(session.state.dealer).toBe((first + 1) % 4);
    expect(session.state.scores).toEqual(scores);
    expect(session.state.gameNumber).toBe(2);
  });
});

describe('saving and resuming', () => {
  it('resumes from any save and replays the computer players exactly', () => {
    const host = new FakeHost();
    const session = new Session(host, prefs());
    session.advance();
    const rng = Rng.fromSeed('resume');
    const stats = newStats();
    for (let i = 0; i < 12; i++) {
      host.flush();
      if (session.state.phase.name === 'ended') break;
      expect(session.state.phase.name).not.toBe('ended');
      // a save is made right after your move, before the computer players answer
      const before = host.saves.length;
      if (!standInMove(session, rng, stats)) break;
      expect(host.saves.length).toBeGreaterThan(before);
    }
    const save = host.saves[host.saves.length - 1] as SavedGame;
    // two fresh sessions from the same save reach the same table
    const a = new FakeHost();
    const b = new FakeHost();
    const sa = new Session(a, prefs(), save);
    const sb = new Session(b, prefs(), save);
    sa.advance();
    sb.advance();
    a.flush();
    b.flush();
    expect(JSON.stringify(sa.state)).toBe(JSON.stringify(sb.state));
    expect(checkInvariants(sa.state)).toEqual([]);
  });

  it('refuses a damaged save and starts a new game instead', () => {
    const host = new FakeHost();
    const good = new Session(host, prefs());
    const bad = good.serialize();
    bad.state = { ...bad.state, wall: bad.state.wall.slice(1) }; // a tile goes missing
    expect(Session.restorable(bad)).toBe(false);
    const s = new Session(new FakeHost(), prefs(), bad);
    expect(s.sessionId).not.toBe(bad.sessionId);
    expect(checkInvariants(s.state)).toEqual([]);
  });

  it('reads saved settings safely and keeps locked tile styles locked', () => {
    expect(readPrefs(null)).toEqual(DEFAULT_PREFS);
    expect(readPrefs({ safety: 'yes', speed: 'warp', tileStyle: 'playful' })).toEqual(DEFAULT_PREFS);
    expect(readPrefs({ safety: true, speed: 'fast', rackOrder: 'number', hideConcealed: true })).toMatchObject({
      safety: true,
      speed: 'fast',
      rackOrder: 'number',
      hideConcealed: true,
    });
    expect(tileStyles(DEFAULT_PREFS).map((s) => [s.id, s.locked !== null])).toEqual([
      ['clean', false],
      ['playful', true],
      ['classic', true],
    ]);
    const unlocked = readPrefs({ progress: { tutorialDone: true, graduated: true } });
    expect(tileStyles(unlocked).every((s) => s.locked === null)).toBe(true);
    // unlocked but not drawn yet: still Clean
    expect(readPrefs({ progress: { tutorialDone: true }, tileStyle: 'playful' }).tileStyle).toBe('clean');
  });
});

describe('when play stops for you after a discard', () => {
  // You (seat 0) hold two Red Dragons; South (seat 1) is not involved; North (seat 3) discards a Red Dragon.
  const redDiscard = (over: Partial<ScenarioSetup> = {}) =>
    scenario({
      hands: { 0: '1B 2B 3B 5C 6C 7C 2D 3D N E RD RD F' },
      floor: [{ seat: 3, code: 'RD' }],
      phase: { name: 'callWindow', discarder: 3 },
      ...over,
    });

  it('does not stop for a pung of dragons, which fits no exposed hand on the practice card', () => {
    const s = redDiscard({ rules: { safety: false } });
    expect(shouldStopForCall(s, HUMAN, false)).toBe(false);
    expect(shouldStopForCall(s, HUMAN, true)).toBe(true);
    // with Safety off the pung is still offered when you stop after every discard
    const choices = callChoices(s, HUMAN);
    expect(choices.find((c) => c.key === 'expose-3-0')?.ok).toBe(true);
  });

  it('with Safety on, explains why that pung would make your hand dead', () => {
    const s = redDiscard({ rules: { safety: true } });
    const choices = callChoices(s, HUMAN);
    expect(choices.some((c) => c.key.startsWith('expose-') && c.ok)).toBe(false);
    const call = choices.find((c) => c.key === 'expose-none');
    expect(call?.ok).toBe(false);
    expect(call?.reason).toMatch(/wouldn't fit any exposed \(X\) hand/);
    expect(choices.find((c) => c.key === 'pass')?.ok).toBe(true);
  });

  it('stops for an exposure that fits a hand, and offers the right tiles', () => {
    // two 5 Dots: a pung of 5 Dots fits Any Like Numbers
    const s = scenario({
      hands: { 0: '1B 2B 3B 5C 6C 7C 5D 5D N E W S F' },
      floor: [{ seat: 3, code: '5D' }],
      phase: { name: 'callWindow', discarder: 3 },
    });
    expect(shouldStopForCall(s, HUMAN, false)).toBe(true);
    const pung = callChoices(s, HUMAN).find((c) => c.key === 'expose-3-0');
    expect(pung?.ok).toBe(true);
    expect(pung?.tiles?.map((t) => kindCode(kindOfTile(t)))).toEqual(['5D', '5D', '5D']);
    expect(promptFor(s, HUMAN)).toMatch(/discarded 5 Dot\. Call it, or pass\./);
  });

  it('explains a call for a pair (allowed only for Mah Jongg)', () => {
    const s = scenario({
      hands: { 0: '1B 2B 3B 5C 6C 7C 5D 8D N E W S F' },
      floor: [{ seat: 3, code: '5D' }],
      phase: { name: 'callWindow', discarder: 3 },
    });
    const call = callChoices(s, HUMAN).find((c) => c.key === 'expose-none');
    expect(call?.ok).toBe(false);
    expect(call?.reason).toMatch(/Pairs and single tiles/);
    const mj = callChoices(s, HUMAN).find((c) => c.key === 'mahjong');
    expect(mj?.ok).toBe(false);
    expect(mj?.reason).toMatch(/doesn't complete a hand/);
  });
});

describe('the game driver', () => {
  it('tells you when your call loses to a Mah Jongg', () => {
    // East (seat 1) discards 9 Dot. North (seat 3) needs it for 13579 #1; you hold two 9 Dots (a pung fits Any Like Numbers).
    const state = scenario({
      dealer: 1,
      hands: {
        0: '9D 9D 1B 2B 3B 5C 6C 7C N E W S F',
        3: '1D 1D 3D 3D 3D 5D 5D 5D 5D 7D 7D 7D 9D',
      },
      floor: [{ seat: 1, code: '9D' }],
      phase: { name: 'callWindow', discarder: 1 },
    });
    const host = new FakeHost();
    const session = new Session(host, prefs(), savedFrom(state));
    session.advance();
    host.flush();
    expect(session.state.phase.name).toBe('callWindow');
    const pung = callChoices(session.state, HUMAN).find((c) => c.key === 'expose-3-0');
    expect(pung?.ok).toBe(true);
    expect(session.act(pung!.action)).toBeNull();
    const r = session.state.phase.name === 'ended' ? session.state.phase.result : null;
    expect(r?.type).toBe('mahjong');
    expect(session.notice?.text).toMatch(/A Mah Jongg call beats a call for an exposure/);
  });

  it('offers a joker exchange from another player\'s exposure on your turn', () => {
    const state = scenario({
      hands: { 0: '5D 1B 2B 3B 5C 6C 7C 2D 3D N E W S F' },
      exposures: { 2: [{ codes: '7B 7B J' }] , 1: [{ codes: '5D 5D J' }] },
      phase: { name: 'turn', seat: 0 },
    });
    const ex = exchangeChoices(state, HUMAN);
    expect(ex.map((c) => c.label)).toEqual(["Give your 5 Dot for the joker in South's pung of 5 Dots"]);
    const r = apply(state, HUMAN, ex[0]!.action);
    expect(r.ok).toBe(true);
    if (r.ok) expect(r.state.players[HUMAN]!.hand.some((t) => kindOfTile(t) === JOKER)).toBe(true);
  });

  it('lets you change an exposure you just made, before you discard', () => {
    // you claimed a 5 Dot for a pung and still hold one more 5 Dot and a joker
    const state = scenario({
      hands: { 0: '5D J 1B 2B 3B 5C 6C 7C N E W' },
      exposures: { 0: [{ codes: '5D 5D 5D', from: 3, locked: false }] },
      phase: { name: 'turn', seat: 0, source: 'claim', from: 3 },
    });
    const tc = turnChoices(state, HUMAN, []);
    const labels = tc?.amends.map((c) => `${c.label} ${c.detail}`.trim()) ?? [];
    expect(labels).toContain('Kong');
    expect(labels).toContain('Kong uses 1 joker');
    expect(labels).toContain('Pung uses 1 joker');
    const kong = tc?.amends.find((c) => c.label === 'Kong' && !c.detail);
    const r = apply(state, HUMAN, kong!.action);
    expect(r.ok).toBe(true);
    if (r.ok) expect(r.state.players[HUMAN]!.exposures[0]!.tiles.length).toBe(4);
    expect(promptFor(state, HUMAN)).toMatch(/Now discard a tile \(no draw\)/);
  });

  it('refuses a joker in a Charleston pass with the rule', () => {
    const state = scenario({ dealer: 1, hands: { 0: 'J 1B 2B 3B 5C 6C 7C 2D 3D N E W S' }, phase: { name: 'charleston', pass: 0 } });
    const hand = state.players[HUMAN]!.hand;
    const joker = hand.find((t) => kindOfTile(t) === JOKER)!;
    const c = charlestonPassChoice(state, HUMAN, [joker, ...tilesFromHand(state, HUMAN, '1B 2B')], 0);
    expect(c.ok).toBe(false);
    expect(c.reason).toMatch(/Jokers can never be passed/);
    const good = charlestonPassChoice(state, HUMAN, tilesFromHand(state, HUMAN, '1B 2B 3B'), 0);
    expect(good.ok).toBe(true);
    expect(good.label).toBe('Pass 3 to the right');
  });

  it('describes seat positions the way the table sits (play goes to the right)', () => {
    expect([1, 2, 3].map((s) => relativePosition(0, s))).toEqual(['right', 'across', 'left']);
  });
});

describe('layouts', () => {
  it('sorts your rack by suit, or by number, never by any hand', () => {
    const state = scenario({ dealer: 1, hands: { 0: 'J 9D 1B F RD N 1C 1D 5B 2B 5B WD S' }, phase: { name: 'charleston', pass: 0 } });
    const hand = state.players[HUMAN]!.hand;
    const bySuit = rackGroups(hand, 'suit').map((g) => `${g.label}: ${g.tiles.map((t) => kindCode(kindOfTile(t))).join(' ')}`);
    expect(bySuit).toEqual(['Bams: 1B 2B 5B 5B', 'Craks: 1C', 'Dots: 1D 9D', 'Winds: N S', 'Dragons: RD WD', 'Flowers: F', 'Jokers: J']);
    const byNumber = rackGroups(hand, 'number').map((g) => `${g.label}: ${g.tiles.map((t) => kindCode(kindOfTile(t))).join(' ')}`);
    expect(byNumber).toEqual(['1s: 1B 1C 1D', '2s: 2B', '5s: 5B 5B', '9s: 9D', 'Winds: N S', 'Dragons: RD WD', 'Flowers: F', 'Jokers: J']);
  });

  it('places every discard in its kind\'s fixed cell of the chart', () => {
    const state = scenario({
      floor: [
        { seat: 1, code: '5D' },
        { seat: 2, code: 'N' },
        { seat: 3, code: '5D' },
        { seat: 1, code: 'J' },
      ],
      phase: { name: 'turn', seat: 2 },
    });
    const chart = discardChart(state.floor);
    expect(chart.map((r) => r.length)).toEqual([9, 9, 9, 9]);
    expect(CHART_ROWS.flat().length).toBe(36);
    const fiveDot = chart[2]![4]!;
    expect(kindCode(fiveDot.kind)).toBe('5D');
    expect(fiveDot.copies.map((c) => c.seat)).toEqual([1, 3]);
    const names = ['you', 'South', 'West', 'North'];
    expect(describeCell(fiveDot, (s) => names[s]!)).toBe('Two 5 Dots on the table, discarded by South, then North.');
    expect(describeCell(chart[3]![0]!, (s) => names[s]!)).toBe('One North on the table, discarded by West.');
    expect(describeCell(chart[0]![0]!, (s) => names[s]!)).toBe('No 1 Bams on the table.');
    expect(chart.flat().reduce((n, c) => n + c.copies.length, 0)).toBe(state.floor.length);
  });

  it('draws every practice-card line as 14 tiles, with suit badges in first-seen order', () => {
    const card = getCard('practice');
    const sections = cheatSheet(card, false);
    const lines = sections.flatMap((s) => s.lines);
    expect(lines.length).toBe(12);
    for (const l of lines) {
      for (const lay of l.layouts) expect(lay.flat().length, l.id).toBe(14);
      expect(l.example.flat().length, l.id).toBe(14);
    }
    const year = lines.find((l) => l.id === 'P-YEAR-1')!;
    const badges = year.layouts[0]!.flat().map((s) => (s.type === 'number' ? s.badge : s.type === 'tile' ? kindCode(s.kind) : '?'));
    expect(badges).toEqual(['F', 'F', 'A', 'WD', 'A', 'A', 'B', 'B', 'B', 'B', 'C', 'C', 'C', 'C']);
    expect(year.layouts[0]![1]![1]).toEqual({ type: 'tile', kind: kindFromCode('WD'), zero: true });
    const run2 = lines.find((l) => l.id === 'P-RUN-2')!;
    const last = run2.layouts[0]![3]![0]!;
    expect(last).toEqual({ type: 'dragon', badge: 'A' }); // the matching dragon shares the run's suit
    const wind2 = lines.find((l) => l.id === 'P-WIND-2')!;
    expect(wind2.layouts[0]![1]![0]).toEqual({ type: 'tile', kind: kindFromCode('RD'), zero: false });
    expect(exampleCodes(lines.find((l) => l.id === 'P-WIND-1')!)).toBe('N N N N | E E E | W W W | S S S S');
  });

  it('can leave concealed hands off the cheat sheet', () => {
    const card = getCard('practice');
    const shown = cheatSheet(card, true).flatMap((s) => s.lines.map((l) => l.id));
    expect(shown).not.toContain('P-CONC-1');
    expect(shown).not.toContain('P-SP-1');
    expect(shown.length).toBe(10);
  });
});

describe('the Clean tile set', () => {
  it('draws every face once, with nothing missing', () => {
    const sprite = cleanSprite();
    for (const id of allSymbolIds()) expect(sprite.split(`id="${id}"`).length - 1, id).toBe(1);
    expect(allSymbolIds().length).toBe(35 + 8 + 1); // 35 kinds besides flowers, 8 flower faces, the back
    expect(sprite).not.toMatch(/undefined|NaN/);
    // no element repeats an attribute (a broken tag would hide a tile)
    for (const tag of sprite.match(/<[a-z]+\s[^>]*>/g) ?? []) {
      const names = [...tag.matchAll(/\s([a-z-]+)="/g)].map((m) => m[1]);
      expect(new Set(names).size, tag).toBe(names.length);
    }
  });
});
