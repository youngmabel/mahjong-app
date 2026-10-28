/**
 * Computer-only games. After every single action: all 152 tiles accounted for exactly once, legal hand
 * sizes, sound exposures. At the end: every game finished, every declared win re-checks from scratch,
 * and the referee never had to reject a computer opponent's move.
 * (The bigger statistics run is `npm run sim`.)
 */

import { beforeAll, describe, expect, it } from 'vitest';
import { loadCard } from '../src/engine/card';
import { PRACTICE_CARD_TEXT } from '../src/engine/cards/practice';
import type { RuleOptions } from '../src/engine/rules';
import { playBotGame, playSession, replay } from '../src/sim/runner';

beforeAll(() => {
  loadCard(PRACTICE_CARD_TEXT);
});

function runMany(n: number, prefix: string, rules: Partial<RuleOptions> = {}) {
  const outcomes = { mahjong: 0, wall: 0, threeDead: 0 };
  let actions = 0;
  let blindPasses = 0;
  let iou = 0;
  let exposures = 0;
  let exchanges = 0;
  let dead = 0;
  for (let i = 0; i < n; i++) {
    const run = playBotGame({ seed: `${prefix}-${i}`, cardId: 'practice', dealer: i % 4, rules });
    expect(run.problems, `game ${prefix}-${i}`).toEqual([]);
    expect(run.violations).toEqual([]);
    expect(run.state.phase.name).toBe('ended');
    if (run.state.phase.name === 'ended') outcomes[run.state.phase.result.type]++;
    actions += run.actions.length;
    for (const e of run.events) {
      if (e.type === 'charlestonPassed') {
        blindPasses += e.blind.filter((b) => b > 0).length;
        if (e.iou) iou++;
      }
      if (e.type === 'expose') exposures++;
      if (e.type === 'jokerExchange') exchanges++;
      if (e.type === 'dead') dead++;
    }
  }
  return { outcomes, actions, blindPasses, iou, exposures, exchanges, dead };
}

describe('computer-only games', () => {
  it('300 games with standard settings: every tile accounted for after every action', () => {
    const r = runMany(300, 'sim-standard');
    expect(r.outcomes.mahjong + r.outcomes.wall + r.outcomes.threeDead).toBe(300);
    expect(r.outcomes.mahjong).toBeGreaterThan(100);
    // the games exercise the interesting rules, not just draws and discards
    expect(r.exposures).toBeGreaterThan(100);
    expect(r.exchanges).toBeGreaterThan(10);
    expect(r.blindPasses).toBeGreaterThan(10);
    expect(r.actions).toBeGreaterThan(300 * 100);
  });

  it('100 games with the alternative rule settings and Safety off', () => {
    const r = runMany(100, 'sim-variants', {
      safety: false,
      exposureLock: 'discard',
      jokerExchangeWin: 'asTile',
      lastDiscard: 'mahjongOnly',
      threeDeadDeal: 'sameDealer',
    });
    expect(r.outcomes.mahjong + r.outcomes.wall + r.outcomes.threeDead).toBe(100);
  });

  it('replaying a saved game (seed plus actions) gives the identical game', () => {
    for (let i = 0; i < 10; i++) {
      const opts = { seed: `replay-${i}`, cardId: 'practice', dealer: i % 4 };
      const run = playBotGame(opts);
      expect(replay(opts, run.actions)).toEqual(run.state);
    }
  });

  it('the same seed gives the same game, bots included', () => {
    const a = playBotGame({ seed: 'determinism', cardId: 'practice' });
    const b = playBotGame({ seed: 'determinism', cardId: 'practice' });
    expect(b.actions).toEqual(a.actions);
    expect(b.state).toEqual(a.state);
  });

  it('a session passes the deal to the right after every game and keeps scores that sum to zero', () => {
    const runs = playSession('session-1', 'practice', 8);
    runs.forEach((run, g) => {
      expect(run.problems).toEqual([]);
      expect(run.state.dealer).toBe(g % 4);
      expect(run.state.gameNumber).toBe(g + 1);
      expect(run.state.scores.reduce((x, y) => x + y, 0)).toBe(0);
    });
  });
});
