// ── Constants ───────────────────────────────────────────────────────
export {
  MAX_ACTIVE_ROSTER,
  MAX_PRACTICE_SQUAD,
  PS_MAX_ACCRUED_SEASONS,
  PS_VETERAN_SLOTS,
  PS_PROTECTION_WINDOW_HOURS,
  IR_MINIMUM_GAMES_MISSED,
  IR_RETURN_LIMIT,
  TRAINING_CAMP_ROSTER,
  ROSTER_CUT_DEADLINE_TO_75,
  ROSTER_CUT_DEADLINE_TO_53,
  WAIVER_CLAIM_WINDOW_HOURS,
  FREE_AGENCY_TAMPERING_DAYS,
  COMP_PICK_MAX_PER_TEAM,
  COACHING_INTERVIEW_MAX,
  POSITION_VALUE_TIERS,
  POSITION_PEAK_AGE,
  POSITION_BASELINE_SALARY,
} from './constants.js';

// ── Roster Manager ──────────────────────────────────────────────────
export { RosterManager } from './RosterManager.js';
export type { RosterValidation, PSPoachResult } from './RosterManager.js';

// ── Waiver System ───────────────────────────────────────────────────
export { getWaiverOrder, processWaiverClaims } from './WaiverSystem.js';
export type { WaiverClaim, WaiverResult } from './WaiverSystem.js';

// ── Training Camp ───────────────────────────────────────────────────
export { simulateTrainingCamp, generateCutRecommendations } from './TrainingCamp.js';
export type {
  PlayerEvaluation,
  PositionBattle,
  TrainingCampResult,
  CutRecommendation,
} from './TrainingCamp.js';

// ── Free Agency Engine ──────────────────────────────────────────────
export { FreeAgencyEngine } from './FreeAgencyEngine.js';
export type {
  FreeAgent,
  FreeAgentDemands,
  FreeAgencySigningRecord,
  FreeAgencyResult,
  CompPickTracking,
  CompPickProjection,
} from './FreeAgencyEngine.js';

// ── Coaching Hire Engine ────────────────────────────────────────────
export { CoachingHireEngine } from './CoachingHireEngine.js';
export type {
  CoachEvaluation,
  FireResult,
  InterviewResult,
  CarouselResult,
} from './CoachingHireEngine.js';

// ── Roster Need Analyzer ────────────────────────────────────────────
export { analyzeRosterNeeds, produceNeedEvents } from './RosterNeedAnalyzer.js';
export type { RosterNeed, NeedUrgency } from './RosterNeedAnalyzer.js';
