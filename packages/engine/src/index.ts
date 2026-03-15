export { EventBus } from './events/index.js';
export type { GameEventMap } from './events/index.js';

export {
  createLCG,
  createSecondaryLCG,
  randomInt,
  weightedChoice,
  shuffle,
  chance,
  normalRandom,
  clamp,
} from './sim/index.js';
export type { RNG } from './sim/index.js';

export type {
  TeamId,
  PlayerId,
  CoachId,
  DraftPickId,
  LeagueId,
  UserId,
  ContractId,
  LeagueWeek,
} from './types/index.js';

export {
  teamId,
  playerId,
  coachId,
  draftPickId,
  leagueId,
  userId,
  contractId,
} from './types/index.js';

// ── Coaching ────────────────────────────────────────────────────────
export { CoachingEngine } from './coaching/index.js';
export { offensiveSchemeMappings, defensiveSchemeMappings } from './coaching/index.js';
export type { AttributeWeight, PositionWeightMap } from './coaching/index.js';

// ── Progression ─────────────────────────────────────────────────────
export { processOffseasonProgression, defaultCurves } from './progression/index.js';
export type { ProgressionContext, ProgressionResult, RatingChange } from './progression/index.js';
