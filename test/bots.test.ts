import { beforeAll, describe, expect, it } from 'vitest';
import { createBot } from '../src/bots/bot';
import { botConfig } from '../src/bots/config';
import { loadCard } from '../src/engine/card';
import { PRACTICE_CARD_TEXT } from '../src/engine/cards/practice';
import { newGame } from '../src/engine/engine';
import { buildScenario, tilesFromHand } from '../src/engine/scenario';
import { JOKER, kindOfTile } from '../src/engine/tiles';
import { seatView } from '../src/engine/view';

beforeAll(() => {
  loadCard(PRACTICE_CARD_TEXT);
});

describe('computer opponents', () => {
  it('see only their own rack and the public table', () => {
    const { state } = newGame({ seed: 'peek', cardId: 'practice' });
    const view = seatView(state, 2);
    const json = JSON.parse(JSON.stringify(view)) as Record<string, unknown>;
    expect(json).not.toHaveProperty('wall');
    expect(json).not.toHaveProperty('seed');
    expect(json).not.toHaveProperty('rng');
    expect(view.hand).toEqual(state.players[2]?.hand);
    for (const p of view.players) expect(p).not.toHaveProperty('hand');
    expect(view.wallCount).toBe(99);
  });

  it('never pass jokers in the Charleston', () => {
    const state = buildScenario({
      seed: 'bot-jokers',
      cardId: 'practice',
      phase: { name: 'charleston', pass: 0 },
      hands: { 1: 'J J J 1B 9C N E W S RD GD 5D 7D' },
    });
    const a = createBot(botConfig(2), 'x').decide(seatView(state, 1));
    expect(a.type).toBe('charlestonPass');
    if (a.type === 'charlestonPass') for (const t of a.tiles) expect(kindOfTile(t)).not.toBe(JOKER);
  });

  it('always declare a complete hand, and claim a winning discard', () => {
    const turn = buildScenario({
      seed: 'bot-win',
      cardId: 'practice',
      phase: { name: 'turn', seat: 1, source: 'draw' },
      hands: { 1: 'F F 2B 2B 4B 4B 4B 6B 6B 6B 8B 8B 8B J' },
    });
    expect(createBot(botConfig(2), 'x').decide(seatView(turn, 1))).toEqual({ type: 'declareMahjong' });
    const call = buildScenario({
      seed: 'bot-win',
      cardId: 'practice',
      phase: { name: 'callWindow', discarder: 0 },
      floor: [{ seat: 0, code: '8B' }],
      hands: { 1: 'F F 2B 2B 4B 4B 4B 6B 6B 6B 8B 8B 8B' },
    });
    expect(createBot(botConfig(2), 'x').decide(seatView(call, 1))).toEqual({ type: 'claimMahjong' });
  });

  it('can be set never to declare Mah Jongg (for the first guided match)', () => {
    const call = buildScenario({
      seed: 'bot-never',
      cardId: 'practice',
      phase: { name: 'callWindow', discarder: 0 },
      floor: [{ seat: 0, code: '8B' }],
      hands: { 1: 'F F 2B 2B 4B 4B 4B 6B 6B 6B 8B 8B 8B' },
    });
    expect(createBot(botConfig(2, { neverDeclare: true }), 'x').decide(seatView(call, 1)).type).not.toBe('claimMahjong');
  });

  it('take an exposed joker when the real tile is spare', () => {
    const s = buildScenario({
      seed: 'bot-swap',
      cardId: 'practice',
      phase: { name: 'turn', seat: 1, source: 'draw' },
      hands: { 1: '9C 1B 1B 2B 2B 2B 3B 3B 3B 3B 4B 4B 4B N' },
      exposures: { 2: [{ codes: '9C 9C J' }] },
    });
    expect(createBot(botConfig(2), 'x').decide(seatView(s, 1))).toEqual({
      type: 'jokerExchange',
      tile: tilesFromHand(s, 1, '9C')[0],
      owner: 2,
      exposure: 0,
    });
  });
});
