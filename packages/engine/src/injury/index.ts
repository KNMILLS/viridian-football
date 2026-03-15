export {
  rollForInjury,
  processWeeklyRecovery,
  getPerformancePenalty,
  getPositionGroup,
} from './InjuryEngine.js';

export type {
  GameContext,
  RecoveryResult,
  InjuryHistory,
} from './InjuryEngine.js';

export {
  BASE_INJURY_RATES,
  SEVERITY_WEIGHTS,
  SEVERITY_WEEKS,
  POSITION_BODY_PARTS,
  BODY_PART_INJURY_NAMES,
  RECURRING_PENALTY_MULTIPLIER,
  RECURRING_WINDOW_SEASONS,
} from './injuryTables.js';

export type { InjurySeverity, BodyPart } from './injuryTables.js';
