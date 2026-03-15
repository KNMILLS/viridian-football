/** Week of the regular season after which player trades are blocked. */
export const TRADE_DEADLINE_WEEK = 9;

/** Maximum number of assets (players + picks) on either side of a trade. */
export const MAX_ASSETS_PER_SIDE = 6;

/** Regular-season active roster limit. */
export const MAX_ROSTER_REGULAR = 53;

/** Offseason / preseason roster limit. */
export const MAX_ROSTER_OFFSEASON = 90;

/** Discount factor applied per year into the future for draft pick value. */
export const FUTURE_PICK_DISCOUNT = 0.85;

/** Maximum contender premium multiplier (for elite-record teams). */
export const CONTENDER_PREMIUM_MAX = 1.15;

/** Maximum deadline pressure multiplier (at the trade deadline itself). */
export const DEADLINE_PRESSURE_MAX = 1.30;

/** Fairness score magnitude below which a deal is considered close to fair. */
export const FAIRNESS_THRESHOLD_CLOSE = 15;

/** Fairness score magnitude above which a deal is auto-rejected. */
export const FAIRNESS_THRESHOLD_UNFAIR = 40;

/** Teams must retain at least one 1st-round pick in every pair of consecutive seasons. */
export const STEPIEN_RULE_MIN_PICKS_PER_YEAR = 1;

/** Position scarcity multipliers for trade value. Premium positions are worth more. */
export const POSITION_SCARCITY: Record<string, number> = {
  QB: 1.35,
  LT: 1.15,
  RT: 1.05,
  DE: 1.15,
  CB: 1.10,
  WR: 1.05,
  TE: 1.00,
  RB: 0.85,
  FB: 0.75,
  LG: 0.95,
  RG: 0.95,
  C: 0.95,
  DT: 1.00,
  NT: 0.95,
  OLB: 1.05,
  ILB: 1.00,
  MLB: 1.00,
  FS: 1.00,
  SS: 1.00,
  K: 0.60,
  P: 0.55,
  LS: 0.40,
};
