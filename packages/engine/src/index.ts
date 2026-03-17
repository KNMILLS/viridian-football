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

// ── Draft ───────────────────────────────────────────────────────────
export { DraftEngine } from './draft/index.js';
export { generateDraftClass } from './draft/index.js';
export { generateInitialReport, conductScoutingVisit } from './draft/index.js';
export { runCombine, runProDay } from './draft/index.js';
export { generateTeamBoard } from './draft/index.js';
export { resolveConditions } from './draft/index.js';
export { getPickValue, getPickValueByOverall, getQBPremium, getFuturePickDiscount, getPickValueWithContext } from './draft/index.js';
export type { VisitType, BoardWeights, SeasonData, TalentTier, CombineRange } from './draft/index.js';

// ── Trade System ───────────────────────────────────────────────────
export {
  TradeEngine,
  getPlayerTradeValue, getPickTradeValue, getSurplusValue,
  getContenderPremium, getDeadlinePressure, computeFairnessScore,
  validateTradeLegality, calculateCapImpact,
  generateCounterOffer, evaluateFromTeamPerspective,
  getTradeRequestLikelihood, getTradeReaction, getTeammateReaction, getNoTradeClauseVetoLikelihood,
  ConditionalPickTracker,
  ViridianTradeValueChart, getDiscountedPickValue, getRawPickValue, computeAgingDiscount,
  TRADE_DEADLINE_WEEK, MAX_ASSETS_PER_SIDE, FUTURE_PICK_DISCOUNT,
  CONTENDER_PREMIUM_MAX, DEADLINE_PRESSURE_MAX,
  FAIRNESS_THRESHOLD_CLOSE, FAIRNESS_THRESHOLD_UNFAIR,
  POSITION_SCARCITY,
} from './trade/index.js';
export type {
  ValuationTeamContext, TradeRequestContext, TradeReactionContext,
  TradeReactionResult, TeammateReactionContext, TeammateReactionResult,
  SeasonConditionData, ConditionStatus, TradeValueChartDeps,
} from './trade/index.js';

// ── Roster Management ───────────────────────────────────────────────
export * from './roster/index.js';

// ── Analytics ───────────────────────────────────────────────────────
export * from './analytics/index.js';

// ── Orchestrator ────────────────────────────────────────────────────
export { SeasonOrchestrator } from './orchestrator/index.js';
export type { WeekAdvanceResult, OffseasonResult, OrchestratorConfig } from './orchestrator/index.js';

// â”€â”€ AI GM â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
export { AiGmEngine, GM_ARCHETYPES, listArchetypes, getArchetypeByName } from './ai/index.js';
