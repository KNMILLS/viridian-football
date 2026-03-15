/**
 * Draft pick value chart (Jimmy Johnson style with modern adjustments).
 *
 * Base values follow the classic exponential decay curve from pick 1 (3000)
 * to pick 262 (~1). QB premium inflates top-10 picks. Future picks are
 * discounted at 85% per year out.
 */

const TOTAL_PICKS = 262;
const BASE_VALUE_PICK_1 = 3000;
const DECAY_RATE = 0.018;

const BASE_VALUES: number[] = [];
for (let i = 0; i < TOTAL_PICKS; i++) {
  BASE_VALUES.push(Math.max(1, Math.round(BASE_VALUE_PICK_1 * Math.exp(-DECAY_RATE * i))));
}

export function getPickValue(round: number, pick: number): number {
  const overall = pickToOverall(round, pick);
  const idx = Math.max(0, Math.min(overall - 1, TOTAL_PICKS - 1));
  return BASE_VALUES[idx]!;
}

export function getPickValueByOverall(overall: number): number {
  const idx = Math.max(0, Math.min(overall - 1, TOTAL_PICKS - 1));
  return BASE_VALUES[idx]!;
}

export function getQBPremium(overall: number): number {
  if (overall <= 1) return 1.50;
  if (overall <= 3) return 1.40;
  if (overall <= 5) return 1.30;
  if (overall <= 10) return 1.15;
  return 1.0;
}

export function getFuturePickDiscount(yearsOut: number): number {
  if (yearsOut <= 0) return 1.0;
  return Math.pow(0.85, yearsOut);
}

function pickToOverall(round: number, pickInRound: number): number {
  return (round - 1) * 32 + pickInRound;
}

export function getPickValueWithContext(
  round: number,
  pick: number,
  options?: { isQB?: boolean; yearsOut?: number },
): number {
  let value = getPickValue(round, pick);
  if (options?.isQB) {
    value = Math.round(value * getQBPremium(pickToOverall(round, pick)));
  }
  if (options?.yearsOut && options.yearsOut > 0) {
    value = Math.round(value * getFuturePickDiscount(options.yearsOut));
  }
  return value;
}
