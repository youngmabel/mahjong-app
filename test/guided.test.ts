/**
 * Tests for the guided matches (milestone 3): what each match sets up (computer players, Safety, the
 * match 1 deal, open racks, narration, the Charleston fade, undo, the hint budget), rule cards and rule
 * slips, the direction check, the readiness report, graduation, and saving guided games apart from free play.
 */

import { beforeAll, describe, expect, it } from 'vitest';
import { loadCard } from '../src/engine/card';
import { PRACTICE_CARD_TEXT } from '../src/engine/cards/practice';
import { checkInvariants } from '../src/engine/engine';
import { kindOfTile, JOKER } from '../src/engine/tiles';
import { seatView } from '../src/engine/view';
import { rankLines, readRack, sentenceCount, type MatchNumber } from '../src/coach';
import { charlestonPassChoice, turnChoices } from '../src/ui/moves';
import { DEFAULT_PREFS, readPrefs, type Prefs } from '../src/ui/prefs';
import { emptyProgress, matchUnlocked, nextMatch, readProgress, recordMatch } from '../src/ui/progress';
import { FREE_PLAY, HINT_BUDGET, HUMAN, RUN_REACH, Session, type Mode, type SavedGame } from '../src/ui/session';
import { guidedFollowerMove } from './coachstandin';
import { FakeHost } from './standin';

beforeAll(() => {
  loadCard(PRACTICE_CARD_TEXT);
});

const prefs = (over: Partial<Prefs> = {}): Prefs => ({ ...DEFAULT_PREFS, progress: { ...DEFAULT_PREFS.progress }, ...over });
const guided = (match: MatchNumber): Mode => ({ kind: 'guided', match });

class ProgressHost extends FakeHost {
  progressSaves = 0;
  clock = 0;
  saveProgress(): void {
    this.progressSaves++;
  }
  now(): number {
    return this.clock;
  }
}

function playGuided(match: MatchNumber, n: number, pin = true): { session: Session; texts: string[] } {
  const host = new ProgressHost();
  const session = new Session(host, prefs(), null, { mode: guided(match) });
  session.advance();
  const texts: string[] = [];
  const ended = () => session.state.phase.name === 'ended';
  for (let i = 0; i < 500 && !ended(); i++) {
    host.flush();
    if (ended()) break;
    host.clock += 4000;
    guidedFollowerMove(session, texts, { pin });
  }
  expect(ended(), `match ${match} game ${n} did not end`).toBe(true);
  expect(checkInvariants(session.state)).toEqual([]);
  return { session, texts };
}

describe('match settings', () => {
  it('sets Safety, help and computer players per match, and keeps free play as it was', () => {
    const s1 = new Session(new FakeHost(), prefs({ safety: false }), null, { mode: guided(1) });
    expect(s1.state.rules.safety).toBe(true);
    expect(s1.settings.openRacks).toBe(true);
    expect(s1.settings.undo).toBe(true);
    expect(s1.settings.coach).toBe('proactive');
    const s2 = new Session(new FakeHost(), prefs({ safety: false }), null, { mode: guided(2) });
    expect(s2.state.rules.safety).toBe(true);
    expect(s2.settings.coach).toBe('hints');
    const s3 = new Session(new FakeHost(), prefs({ safety: true }), null, { mode: guided(3) });
    expect(s3.state.rules.safety).toBe(false);
    expect(s3.hintsLeft).toBe(HINT_BUDGET);
    const free = new Session(new FakeHost(), prefs({ safety: false }), null);
    expect(free.mode).toEqual(FREE_PLAY);
    expect(free.state.rules.safety).toBe(false);
    expect(free.coachOn).toBe(false);
    expect(new Session(new FakeHost(), prefs({ coachInFreePlay: true }), null).coachOn).toBe(true);
  });

  it('deals match 1 near a Consecutive Run hand, the closest line on the card', () => {
    for (let i = 0; i < 8; i++) {
      const s = new Session(new FakeHost(), prefs(), null, { mode: guided(1) });
      const lines = rankLines(readRack(seatView(s.state, HUMAN)), { hideConcealed: false }).filter((l) => !l.blocked);
      const run = lines.find((l) => l.section === 'Consecutive Run');
      expect(run?.away).toBeLessThanOrEqual(RUN_REACH);
      expect(run?.away).toBe(lines[0]?.away);
    }
  });

  it("fades the Charleston in match 1: the coach's 3 tiles, then 2, then yours", () => {
    const host = new FakeHost();
    const s = new Session(host, prefs(), null, { mode: guided(1) });
    s.advance();
    host.flush();
    if (s.state.phase.name !== 'charleston') return; // a Heavenly Hand (very rare) skips the Charleston
    expect(s.preselect()?.tiles).toHaveLength(3);
    guidedFollowerMove(s, []);
    host.flush();
    expect(s.preselect()?.tiles).toHaveLength(2);
    guidedFollowerMove(s, []);
    host.flush();
    expect(s.preselect()).toBeNull();
    expect(new Session(new FakeHost(), prefs(), null, { mode: guided(2) }).preselect()).toBeNull();
  });
});

describe('playing the guided matches with a stand-in that follows the coach', () => {
  it('match 1: the computer players never declare Mah Jongg, and explain their moves', () => {
    const endings: Record<string, number> = {};
    let narrated = 0;
    for (let g = 0; g < 8; g++) {
      const { session, texts } = playGuided(1, g);
      const p = session.state.phase;
      if (p.name !== 'ended') continue;
      const key = p.result.type === 'mahjong' ? (p.result.winner === HUMAN ? 'you' : 'computer') : p.result.type;
      endings[key] = (endings[key] ?? 0) + 1;
      expect(key).not.toBe('computer');
      narrated += session.log.filter((l) => l.tone === 'coach').length;
      for (const t of texts) expect(sentenceCount(t), t).toBeLessThanOrEqual(2);
      const result = session.matchResult();
      expect(result?.report.match).toBe(1);
      expect(result?.stats.direction?.titles.length).toBeGreaterThan(0);
    }
    expect(endings.you ?? 0).toBeGreaterThan(0);
    expect(narrated).toBeGreaterThan(40);
    console.log('match 1 endings', endings);
  });

  it('match 2 and match 3: players who can win, and a report with a review', () => {
    const endings: Record<string, number> = {};
    for (const m of [2, 3] as const)
      for (let g = 0; g < 6; g++) {
        const { session } = playGuided(m, g);
        const p = session.state.phase;
        if (p.name !== 'ended') continue;
        const key = p.result.type === 'mahjong' ? (p.result.winner === HUMAN ? 'you' : 'computer') : p.result.type;
        endings[`${m}:${key}`] = (endings[`${m}:${key}`] ?? 0) + 1;
        const r = session.matchResult();
        expect(r?.report.match).toBe(m);
        expect(r?.report.card.pass).toBeNull();
        expect(r?.review.total).toBeGreaterThan(5);
        // following the coach means matching it on every decision
        expect(r?.review.followed).toBe(r?.review.total);
      }
    expect(Object.keys(endings).some((k) => k.endsWith('computer'))).toBe(true);
    console.log('match 2 and 3 endings', endings);
  });
});

describe('undo in match 1', () => {
  it('takes back your last move exactly, and the game replays the same way', () => {
    const host = new FakeHost();
    const s = new Session(host, prefs(), null, { mode: guided(1) });
    s.advance();
    host.flush();
    const before = JSON.stringify(s.state);
    const logBefore = s.log.length;
    guidedFollowerMove(s, []);
    host.flush();
    const after = JSON.stringify(s.state);
    expect(s.canUndo).toBe(true);
    expect(s.undo()).toBe(true);
    host.flush();
    expect(JSON.stringify(s.state)).toBe(before);
    expect(s.log.length).toBe(logBefore);
    guidedFollowerMove(s, []);
    host.flush();
    expect(JSON.stringify(s.state)).toBe(after);
    const s2 = new Session(new FakeHost(), prefs(), null, { mode: guided(2) });
    expect(s2.canUndo).toBe(false);
  });
});

describe('hints', () => {
  it('reveals the four tiers in order, saving the answer until you try a choice', () => {
    const host = new FakeHost();
    const s = new Session(host, prefs(), null, { mode: guided(2) });
    s.advance();
    host.flush();
    const note = s.note();
    expect(note).not.toBeNull();
    const t1 = s.hint(false);
    const t2 = s.hint(false);
    const t3 = s.hint(false);
    expect([t1, t2, t3]).toEqual(note?.tiers.slice(0, 3));
    const wait = s.hint(false);
    if (note?.topic === 'pass' || note?.topic === 'turn') {
      expect(wait).toMatch(/Pick the tile/);
      expect(s.hint(true)).toBe(note?.tiers[3]);
    }
    expect(s.hintsShown).toHaveLength(4);
  });

  it('runs out after the hint budget in match 3', () => {
    const host = new FakeHost();
    const s = new Session(host, prefs(), null, { mode: guided(3) });
    s.advance();
    host.flush();
    const shown: string[] = [];
    for (let i = 0; i < 12; i++) {
      const h = s.hint(true);
      if (h) shown.push(h);
      if (i % 4 === 3) {
        guidedFollowerMove(s, []);
        host.flush();
      }
    }
    expect(s.hintsLeft).toBe(0);
    expect(shown.filter((x) => x === 'No hints left in this match.').length).toBeGreaterThan(0);
    expect(s.stats.hintsUsed).toBe(HINT_BUDGET);
  });
});

describe('rule cards and rule slips', () => {
  it('shows each rule card once, starting with the goal, and saves what you have seen', () => {
    const host = new ProgressHost();
    const s = new Session(host, prefs(), null, { mode: guided(2) });
    s.advance();
    host.flush();
    const first = s.ruleCard();
    expect(first?.key).toBe('goal');
    s.dismissRule('goal');
    expect(host.progressSaves).toBe(1);
    expect(s.ruleCard()?.key).not.toBe('goal');
    expect(new Session(new FakeHost(), prefs(), null).ruleCard()).toBeNull();
  });

  it('counts a move that breaks a rule, and brings back the rule after a repeat', () => {
    const host = new FakeHost();
    const s = new Session(host, prefs(), null, { mode: guided(2) });
    s.advance();
    host.flush();
    if (s.state.phase.name !== 'charleston') return;
    const hand = (s.state.players[HUMAN] as (typeof s.state.players)[number]).hand;
    const joker = hand.find((t) => kindOfTile(t) === JOKER);
    const naturals = hand.filter((t) => kindOfTile(t) !== JOKER);
    // with no joker on the rack, try a pass of 2 tiles (a counting slip, which isn't counted as a rule slip)
    const c = joker !== undefined ? charlestonPassChoice(s.state, HUMAN, [joker, ...naturals.slice(0, 2)], 0) : charlestonPassChoice(s.state, HUMAN, naturals.slice(0, 2), 0);
    expect(c.ok).toBe(false);
    s.refused(c.reason as string, c.code);
    s.refused(c.reason as string, c.code);
    if (joker !== undefined) {
      expect(s.stats.slips).toHaveLength(2);
      expect(s.ruleCard()?.key).toBe('charleston');
    } else expect(s.stats.slips).toHaveLength(0);
    // a tap with nothing selected is the screen's own hint, never a slip
    const empty = turnChoices(s.state, HUMAN, []);
    expect(empty).toBeNull();
  });
});

describe('the direction check', () => {
  it('asks for a hand when play begins with nothing pinned, and fails the check if you skip it', () => {
    const { session } = playGuided(2, 0, false);
    const r = session.matchResult();
    expect(r?.stats.direction).toBeNull();
    expect(r?.report.hand.pass).toBe(false);
    expect(r?.report.allPass).toBe(false);
  });
});

describe('progress and graduation', () => {
  it('opens each match after the one before, graduates after match 3, and offers early graduation after a clean match 2', () => {
    let p = emptyProgress();
    expect(matchUnlocked(p, 1)).toBe(true);
    expect(matchUnlocked(p, 2)).toBe(false);
    expect(nextMatch(p)).toBe(1);
    const report = (match: MatchNumber, allPass: boolean) => ({
      match,
      rules: { pass: allPass, text: '' },
      hand: { pass: allPass, text: '' },
      card: { pass: null, text: '' },
      pace: { pass: null, text: '' },
      allPass,
    });
    let o = recordMatch(p, report(1, true), []);
    expect(o.graduatedNow).toBe(false);
    expect(o.mayGraduateEarly).toBe(false);
    p = o.progress;
    expect(matchUnlocked(p, 2)).toBe(true);
    o = recordMatch(p, report(2, false), [{ code: 'jokerPass' }]);
    expect(o.mayGraduateEarly).toBe(false);
    expect(o.progress.slips.jokerPass).toBe(1);
    o = recordMatch(o.progress, report(2, true), []);
    expect(o.mayGraduateEarly).toBe(true);
    o = recordMatch(o.progress, report(3, false), []);
    expect(o.graduatedNow).toBe(true);
    expect(o.progress.graduated).toBe(true);
    expect(nextMatch(o.progress)).toBeNull();
    expect(readProgress(JSON.parse(JSON.stringify(o.progress)))).toEqual(o.progress);
    expect(readProgress({ completed: [1, 7, 'x'], graduated: 'yes' })).toEqual({ ...emptyProgress(), completed: [1] });
  });
});

describe('saving guided games', () => {
  it('resumes a guided match with its pins and notes, and keeps it apart from free play', () => {
    const host = new FakeHost();
    const s = new Session(host, prefs(), null, { mode: guided(2) });
    s.advance();
    host.flush();
    const top = rankLines(readRack(seatView(s.state, HUMAN)), s.coachOptions())[0];
    if (top) s.pin(top.handId);
    guidedFollowerMove(s, []);
    host.flush();
    const saved = host.saves[host.saves.length - 1] as SavedGame;
    expect(saved.mode).toEqual(guided(2));
    const back = new Session(new FakeHost(), prefs(), saved, { mode: guided(2) });
    expect(back.state.actionCount).toBe(s.state.actionCount);
    expect(back.pins).toEqual(s.pins);
    expect(back.stats.decisions.length).toBe(s.stats.decisions.length);
    // a guided save never resumes as free play, nor the other way round
    expect(new Session(new FakeHost(), prefs(), saved, { mode: FREE_PLAY }).sessionId).not.toBe(s.sessionId);
    const old: SavedGame = { ...saved, mode: undefined, coach: undefined };
    expect(new Session(new FakeHost(), prefs(), old).sessionId).toBe(s.sessionId);
    expect(new Session(new FakeHost(), prefs(), old, { mode: guided(1) }).sessionId).not.toBe(s.sessionId);
  });
});

describe('settings added for the coach', () => {
  it('reads older saved settings with the new defaults, and keeps the new ones', () => {
    const old = readPrefs({ v: 1, safety: true, speed: 'slow', progress: { tutorialDone: false, graduated: false } });
    expect(old.coachInFreePlay).toBe(false);
    expect(old.openRacks).toBe(true);
    expect(old.lastMode).toBe('free');
    expect(old.safety).toBe(true);
    const back = readPrefs(JSON.parse(JSON.stringify({ ...DEFAULT_PREFS, coachInFreePlay: true, openRacks: false, lastMode: 'guided' })));
    expect([back.coachInFreePlay, back.openRacks, back.lastMode]).toEqual([true, false, 'guided']);
    expect(readPrefs({ lastMode: 'tutorial', openRacks: 'no' }).lastMode).toBe('free');
  });
});
