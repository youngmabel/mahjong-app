import { describe, expect, it } from 'vitest';
import { Rng, hashSeed, streamSeed } from '../src/engine/rng';

describe('seeded random numbers', () => {
  it('gives the same sequence for the same seed and different ones for different seeds', () => {
    const a = Rng.fromSeed('table-1');
    const b = Rng.fromSeed('table-1');
    const c = Rng.fromSeed('table-2');
    const sa = Array.from({ length: 20 }, () => a.nextU32());
    const sb = Array.from({ length: 20 }, () => b.nextU32());
    const sc = Array.from({ length: 20 }, () => c.nextU32());
    expect(sa).toEqual(sb);
    expect(sa).not.toEqual(sc);
  });

  it('can save and restore its state', () => {
    const a = Rng.fromSeed('save-me');
    a.nextU32();
    const saved = a.getState();
    const next = a.nextU32();
    expect(new Rng(saved).nextU32()).toBe(next);
  });

  it('shuffles into a permutation', () => {
    const r = Rng.fromSeed('shuffle');
    const arr = Array.from({ length: 152 }, (_, i) => i);
    const s = r.shuffle([...arr]);
    expect([...s].sort((x, y) => x - y)).toEqual(arr);
    expect(s).not.toEqual(arr);
  });

  it('is roughly uniform (chi-square check on 60,000 draws over 6 buckets)', () => {
    const r = Rng.fromSeed('uniform');
    const buckets = new Array(6).fill(0);
    const n = 60000;
    for (let i = 0; i < n; i++) buckets[r.int(6)]++;
    const expected = n / 6;
    const chi = buckets.reduce((acc, b) => acc + ((b - expected) ** 2) / expected, 0);
    expect(chi).toBeLessThan(20.5); // 5 degrees of freedom, p = 0.001
  });

  it('keeps named streams independent', () => {
    const wall = Rng.fromSeed(streamSeed('g1', 'wall')).nextU32();
    const bot = Rng.fromSeed(streamSeed('g1', 'bot1')).nextU32();
    expect(wall).not.toBe(bot);
    expect(hashSeed('x')).toEqual(hashSeed('x'));
  });
});
