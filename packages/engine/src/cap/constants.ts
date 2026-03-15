/** Season 1 salary cap baseline ($225M). */
export const BASE_SALARY_CAP = 225_000_000;

/** Teams must spend at least 89% of the cap over a rolling 4-year window. */
export const SALARY_FLOOR_PERCENTAGE = 0.89;

/** Signing bonus proration cannot exceed 5 years per the CBA. */
export const MAX_PRORATION_YEARS = 5;

/** Estimated annual league-wide salary cap growth rate. */
export const CAP_GROWTH_RATE = 0.06;

/** Second consecutive franchise tag escalator (120% of prior tag value). */
export const TAG_ESCALATOR_2ND = 0.20;

/** Third consecutive franchise tag escalator (144% of prior tag value). */
export const TAG_ESCALATOR_3RD = 0.44;

/** Maximum compensatory picks any single team can receive per year. */
export const MAX_COMP_PICKS_PER_TEAM = 4;

/**
 * Minimum veteran salary by years of accrued experience.
 * Key = experience years (0 = rookie). Values beyond 10 use key 10.
 */
export const VETERAN_MINIMUM_SCHEDULE: Record<number, number> = {
  0: 795_000,
  1: 915_000,
  2: 985_000,
  3: 1_025_000,
  4: 1_065_000,
  5: 1_105_000,
  6: 1_135_000,
  7: 1_165_000,
  8: 1_185_000,
  9: 1_200_000,
  10: 1_215_000,
};

/**
 * APY thresholds that determine which round a compensatory pick falls in.
 * If a qualifying FA's APY >= the threshold, the pick is in that round.
 * Evaluated top-down; first match wins.
 */
export const COMP_PICK_ROUND_THRESHOLDS: { round: 3 | 4 | 5 | 6 | 7; minApy: number }[] = [
  { round: 3, minApy: 14_000_000 },
  { round: 4, minApy: 10_000_000 },
  { round: 5, minApy: 6_500_000 },
  { round: 6, minApy: 3_500_000 },
  { round: 7, minApy: 0 },
];
