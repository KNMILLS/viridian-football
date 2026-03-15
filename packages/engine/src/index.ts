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
  calculateTeamStrength,
  simulateGame,
  generateSchedule,
  generatePlayoffSchedule,
  seedPlayoffTeams,
  simulatePlayoffRound,
} from './sim/index.js';
export type {
  RNG,
  TeamStrength,
  GameSimOptions,
  GameResult,
  PlayByPlayEntry,
  PlayerStatLine,
  GameInjury,
  Weather,
  PlayoffBracket,
  PlayoffSeed,
  PlayoffRoundResult,
  PlayoffGameResult,
  PlayoffRoundName,
  PlayoffMatchup,
} from './sim/index.js';

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

// ── Cap Engine ──────────────────────────────────────────────────────
export { CapEngine } from './cap/index.js';

// ── Calendar Engine ─────────────────────────────────────────────────
export { CalendarEngine } from './calendar/index.js';

// ── Coaching ────────────────────────────────────────────────────────
export { CoachingEngine } from './coaching/index.js';
export { offensiveSchemeMappings, defensiveSchemeMappings } from './coaching/index.js';
export type { AttributeWeight, PositionWeightMap } from './coaching/index.js';

// ── Progression ─────────────────────────────────────────────────────
export { processOffseasonProgression, defaultCurves } from './progression/index.js';
export type { ProgressionContext, ProgressionResult, RatingChange } from './progression/index.js';

// ── Injury System ──────────────────────────────────────────────────
export * from './injury/index.js';

// ── Personality / Morale ───────────────────────────────────────────
export * from './personality/index.js';

// ── Staff Delegation ───────────────────────────────────────────────
export * from './delegation/index.js';

// ── Orchestrator ────────────────────────────────────────────────────
export { SeasonOrchestrator } from './orchestrator/index.js';
export type { WeekAdvanceResult, OffseasonResult, OrchestratorConfig } from './orchestrator/index.js';
