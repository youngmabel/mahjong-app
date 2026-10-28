/**
 * Seeded random numbers, so every game can be replayed exactly from a short seed string.
 *
 * - sfc32 generator (128 bits of state; passes the standard randomness test suites).
 * - cyrb128 turns a readable seed string into the generator's starting state.
 * - Separate "streams" (for example "game7::wall" and "game7::bot2") keep the deal
 *   independent of the computer opponents' choices, so changing a bot never changes a deal.
 *
 * Source: docs/07-app-spec.md section 10; bryc's PRNG notes (github.com/bryc/code, jshash/PRNGs.md).
 */

export type RngState = [number, number, number, number];

/** cyrb128 string hash (public domain, bryc). Returns four 32-bit unsigned integers. */
export function hashSeed(str: string): RngState {
  let h1 = 1779033703;
  let h2 = 3144134277;
  let h3 = 1013904242;
  let h4 = 2773480762;
  for (let i = 0; i < str.length; i++) {
    const k = str.charCodeAt(i);
    h1 = h2 ^ Math.imul(h1 ^ k, 597399067);
    h2 = h3 ^ Math.imul(h2 ^ k, 2869860233);
    h3 = h4 ^ Math.imul(h3 ^ k, 951274213);
    h4 = h1 ^ Math.imul(h4 ^ k, 2716044179);
  }
  h1 = Math.imul(h3 ^ (h1 >>> 18), 597399067);
  h2 = Math.imul(h4 ^ (h2 >>> 22), 2869860233);
  h3 = Math.imul(h1 ^ (h3 >>> 17), 951274213);
  h4 = Math.imul(h2 ^ (h4 >>> 19), 2716044179);
  h1 ^= h2 ^ h3 ^ h4;
  h2 ^= h1;
  h3 ^= h1;
  h4 ^= h1;
  return [h1 >>> 0, h2 >>> 0, h3 >>> 0, h4 >>> 0];
}

export class Rng {
  private a: number;
  private b: number;
  private c: number;
  private d: number;

  constructor(state: RngState) {
    [this.a, this.b, this.c, this.d] = state;
  }

  /** A generator seeded from a readable string. */
  static fromSeed(seed: string): Rng {
    const r = new Rng(hashSeed(seed));
    for (let i = 0; i < 15; i++) r.nextU32(); // warm-up, as bryc recommends for sfc32
    return r;
  }

  /** The next 32-bit unsigned integer (sfc32 step). */
  nextU32(): number {
    let a = this.a | 0;
    let b = this.b | 0;
    let c = this.c | 0;
    let d = this.d | 0;
    const t = (((a + b) | 0) + d) | 0;
    d = (d + 1) | 0;
    a = b ^ (b >>> 9);
    b = (c + (c << 3)) | 0;
    c = (c << 21) | (c >>> 11);
    c = (c + t) | 0;
    this.a = a;
    this.b = b;
    this.c = c;
    this.d = d;
    return t >>> 0;
  }

  /** A float in [0, 1). */
  next(): number {
    return this.nextU32() / 4294967296;
  }

  /** A uniform integer in [0, n), without modulo bias. */
  int(n: number): number {
    if (!Number.isInteger(n) || n <= 0) throw new Error(`Rng.int needs a positive integer, got ${n}`);
    const limit = 4294967296 - (4294967296 % n);
    for (;;) {
      const x = this.nextU32();
      if (x < limit) return x % n;
    }
  }

  /** True with probability p. */
  chance(p: number): boolean {
    return this.next() < p;
  }

  /** Fisher-Yates shuffle in place; returns the same array. */
  shuffle<T>(arr: T[]): T[] {
    for (let i = arr.length - 1; i > 0; i--) {
      const j = this.int(i + 1);
      const tmp = arr[i] as T;
      arr[i] = arr[j] as T;
      arr[j] = tmp;
    }
    return arr;
  }

  pick<T>(arr: readonly T[]): T {
    if (arr.length === 0) throw new Error('Rng.pick on an empty list');
    return arr[this.int(arr.length)] as T;
  }

  /** k distinct items chosen uniformly at random (order random). */
  sample<T>(arr: readonly T[], k: number): T[] {
    if (k > arr.length) throw new Error('Rng.sample: not enough items');
    return this.shuffle([...arr]).slice(0, k);
  }

  getState(): RngState {
    return [this.a >>> 0, this.b >>> 0, this.c >>> 0, this.d >>> 0];
  }
}

/** Name a separate random stream under one base seed. */
export function streamSeed(base: string, stream: string): string {
  return `${base}::${stream}`;
}
