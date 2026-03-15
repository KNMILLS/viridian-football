import { describe, it, expect } from 'vitest';
import {
  createLCG,
  createSecondaryLCG,
  randomInt,
  weightedChoice,
  shuffle,
  chance,
  normalRandom,
  clamp,
} from '../../src/sim/RNG.js';

describe('createLCG', () => {
  it('produces deterministic output for the same seed', () => {
    const rng1 = createLCG(42);
    const rng2 = createLCG(42);
    const seq1 = Array.from({ length: 100 }, () => rng1());
    const seq2 = Array.from({ length: 100 }, () => rng2());
    expect(seq1).toEqual(seq2);
  });

  it('produces different output for different seeds', () => {
    const rng1 = createLCG(42);
    const rng2 = createLCG(99);
    const val1 = rng1();
    const val2 = rng2();
    expect(val1).not.toEqual(val2);
  });

  it('produces values in (0, 1) exclusive', () => {
    const rng = createLCG(12345);
    for (let i = 0; i < 10_000; i++) {
      const v = rng();
      expect(v).toBeGreaterThan(0);
      expect(v).toBeLessThan(1);
    }
  });

  it('handles negative seed', () => {
    const rng = createLCG(-5);
    const v = rng();
    expect(v).toBeGreaterThan(0);
    expect(v).toBeLessThan(1);
  });
});

describe('createSecondaryLCG', () => {
  it('is deterministic', () => {
    const rng1 = createSecondaryLCG(42);
    const rng2 = createSecondaryLCG(42);
    const seq1 = Array.from({ length: 50 }, () => rng1());
    const seq2 = Array.from({ length: 50 }, () => rng2());
    expect(seq1).toEqual(seq2);
  });

  it('produces different values than primary LCG with same seed', () => {
    const primary = createLCG(42);
    const secondary = createSecondaryLCG(42);
    expect(primary()).not.toEqual(secondary());
  });
});

describe('randomInt', () => {
  it('produces values in [min, max] inclusive', () => {
    const rng = createLCG(42);
    const values = new Set<number>();
    for (let i = 0; i < 1000; i++) {
      const v = randomInt(rng, 1, 6);
      expect(v).toBeGreaterThanOrEqual(1);
      expect(v).toBeLessThanOrEqual(6);
      values.add(v);
    }
    expect(values.size).toBe(6);
  });
});

describe('weightedChoice', () => {
  it('respects weights', () => {
    const rng = createLCG(42);
    const items = [
      { item: 'common', weight: 90 },
      { item: 'rare', weight: 10 },
    ];
    const counts = { common: 0, rare: 0 };
    for (let i = 0; i < 10_000; i++) {
      const result = weightedChoice(rng, items);
      counts[result]++;
    }
    expect(counts.common).toBeGreaterThan(counts.rare * 5);
  });
});

describe('shuffle', () => {
  it('is deterministic with the same seed', () => {
    const arr1 = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
    const arr2 = [...arr1];
    shuffle(createLCG(42), arr1);
    shuffle(createLCG(42), arr2);
    expect(arr1).toEqual(arr2);
  });

  it('contains all original elements', () => {
    const arr = [1, 2, 3, 4, 5];
    shuffle(createLCG(42), arr);
    expect(arr.sort()).toEqual([1, 2, 3, 4, 5]);
  });
});

describe('chance', () => {
  it('returns true roughly proportional to probability', () => {
    const rng = createLCG(42);
    let trueCount = 0;
    const trials = 10_000;
    for (let i = 0; i < trials; i++) {
      if (chance(rng, 0.3)) trueCount++;
    }
    const ratio = trueCount / trials;
    expect(ratio).toBeGreaterThan(0.25);
    expect(ratio).toBeLessThan(0.35);
  });
});

describe('normalRandom', () => {
  it('produces values centered around the mean', () => {
    const rng = createLCG(42);
    const values = Array.from({ length: 10_000 }, () => normalRandom(rng, 50, 10));
    const mean = values.reduce((a, b) => a + b, 0) / values.length;
    expect(mean).toBeGreaterThan(49);
    expect(mean).toBeLessThan(51);
  });
});

describe('clamp', () => {
  it('clamps below min', () => expect(clamp(-5, 0, 100)).toBe(0));
  it('clamps above max', () => expect(clamp(150, 0, 100)).toBe(100));
  it('passes through values in range', () => expect(clamp(50, 0, 100)).toBe(50));
});
