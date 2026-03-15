// ── Roster Limits ───────────────────────────────────────────────────

/** Maximum players on the active 53-man roster. */
export const MAX_ACTIVE_ROSTER = 53;

/** Maximum players on the practice squad. */
export const MAX_PRACTICE_SQUAD = 16;

/** PS eligibility: max accrued NFL seasons for non-veteran slots. */
export const PS_MAX_ACCRUED_SEASONS = 3;

/** Number of PS slots available to veterans with unlimited experience. */
export const PS_VETERAN_SLOTS = 6;

/** Hours a team has to promote a PS player before another team poaches them. */
export const PS_PROTECTION_WINDOW_HOURS = 48;

// ── Injured Reserve ─────────────────────────────────────────────────

/** Minimum games a player must miss after being placed on IR. */
export const IR_MINIMUM_GAMES_MISSED = 4;

/** Maximum players a team can return from IR in a single season. */
export const IR_RETURN_LIMIT = 8;

// ── Training Camp ───────────────────────────────────────────────────

/** Maximum roster size entering training camp. */
export const TRAINING_CAMP_ROSTER = 90;

/** Phase at which the roster must be cut to 75. */
export const ROSTER_CUT_DEADLINE_TO_75 = 'preseason_week_2';

/** Phase at which the roster must be cut to 53. */
export const ROSTER_CUT_DEADLINE_TO_53 = 'roster_cuts';

// ── Waivers ─────────────────────────────────────────────────────────

/** Hours the waiver claim window stays open after a player is released. */
export const WAIVER_CLAIM_WINDOW_HOURS = 24;

// ── Free Agency ─────────────────────────────────────────────────────

/** Days of the legal tampering window before FA officially opens. */
export const FREE_AGENCY_TAMPERING_DAYS = 2;

/** Maximum compensatory picks any single team can receive per year. */
export const COMP_PICK_MAX_PER_TEAM = 4;

// ── Coaching ────────────────────────────────────────────────────────

/** Maximum coaching candidates a team can interview per cycle. */
export const COACHING_INTERVIEW_MAX = 5;

// ── Position Value Tiers (for market value calculation) ─────────────

export const POSITION_VALUE_TIERS: Record<string, number> = {
  QB: 1.0,
  DE: 0.75,
  OLB: 0.7,
  CB: 0.7,
  LT: 0.65,
  WR: 0.65,
  DT: 0.6,
  TE: 0.55,
  FS: 0.55,
  SS: 0.55,
  ILB: 0.5,
  MLB: 0.5,
  RB: 0.5,
  LG: 0.45,
  C: 0.45,
  RG: 0.45,
  RT: 0.45,
  NT: 0.45,
  FB: 0.3,
  K: 0.25,
  P: 0.25,
  LS: 0.15,
};

// ── Age Curve Constants ─────────────────────────────────────────────

export const POSITION_PEAK_AGE: Record<string, { start: number; end: number }> = {
  QB: { start: 27, end: 35 },
  RB: { start: 24, end: 28 },
  FB: { start: 25, end: 30 },
  WR: { start: 25, end: 30 },
  TE: { start: 26, end: 31 },
  LT: { start: 26, end: 32 },
  LG: { start: 26, end: 32 },
  C: { start: 26, end: 32 },
  RG: { start: 26, end: 32 },
  RT: { start: 26, end: 32 },
  DE: { start: 25, end: 30 },
  DT: { start: 25, end: 30 },
  NT: { start: 25, end: 30 },
  OLB: { start: 25, end: 30 },
  ILB: { start: 25, end: 30 },
  MLB: { start: 25, end: 30 },
  CB: { start: 24, end: 29 },
  FS: { start: 25, end: 30 },
  SS: { start: 25, end: 30 },
  K: { start: 27, end: 38 },
  P: { start: 27, end: 38 },
  LS: { start: 26, end: 36 },
};

/** Baseline salary used when computing market value (approximate average starter APY). */
export const POSITION_BASELINE_SALARY: Record<string, number> = {
  QB: 35_000_000,
  DE: 18_000_000,
  OLB: 16_000_000,
  CB: 16_000_000,
  LT: 16_000_000,
  WR: 18_000_000,
  DT: 14_000_000,
  TE: 12_000_000,
  FS: 12_000_000,
  SS: 12_000_000,
  ILB: 10_000_000,
  MLB: 10_000_000,
  RB: 10_000_000,
  LG: 10_000_000,
  C: 10_000_000,
  RG: 10_000_000,
  RT: 12_000_000,
  NT: 10_000_000,
  FB: 3_000_000,
  K: 4_000_000,
  P: 3_500_000,
  LS: 1_500_000,
};
