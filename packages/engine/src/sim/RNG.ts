/**
 * Deterministic random number generator for Viridian Football.
 * Ported from KNMILLS/football-strategy.
 *
 * RULE: Math.random() is NEVER used anywhere in the engine.
 * All randomness flows through seeded RNG instances for reproducibility.
 */

export type RNG = () => number;

/**
 * Park-Miller LCG (Lehmer RNG).
 * Period: 2^31 - 2 (~2.1 billion). Output: (0, 1) exclusive.
 */
export function createLCG(seed: number): RNG {
  let s = seed % 2147483647;
  if (s <= 0) s += 2147483646;
  return function next(): number {
    s = (s * 16807) % 2147483647;
    return (s - 1) / 2147483646;
  };
}

/**
 * glibc-style LCG. Period: 2^31.
 * Useful as a second independent stream when two RNG sources are needed.
 */
export function createSecondaryLCG(seed: number): RNG {
  const MOD = 2 ** 31;
  const A = 1103515245;
  const C = 12345;
  let s = (seed >>> 0) % MOD;
  return function next(): number {
    s = (A * s + C) % MOD;
    return s / MOD;
  };
}

/** Uniformly random integer in [min, max] inclusive. */
export function randomInt(rng: RNG, min: number, max: number): number {
  return Math.floor(rng() * (max - min + 1)) + min;
}

/** Weighted random selection. Items with higher weights are more likely. */
export function weightedChoice<T>(rng: RNG, items: { item: T; weight: number }[]): T {
  const total = items.reduce((sum, i) => sum + i.weight, 0);
  let roll = rng() * total;
  for (const { item, weight } of items) {
    roll -= weight;
    if (roll <= 0) return item;
  }
  return items[items.length - 1]!.item;
}

/** Shuffle an array in place using Fisher-Yates. Returns the same array. */
export function shuffle<T>(rng: RNG, arr: T[]): T[] {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [arr[i], arr[j]] = [arr[j]!, arr[i]!];
  }
  return arr;
}

/** Returns true with the given probability (0-1). */
export function chance(rng: RNG, probability: number): boolean {
  return rng() < probability;
}

/** Sample from a normal distribution using Box-Muller transform. */
export function normalRandom(rng: RNG, mean: number, stdDev: number): number {
  const u1 = rng();
  const u2 = rng();
  const z = Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
  return mean + z * stdDev;
}

/** Clamp a value between min and max. */
export function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}
