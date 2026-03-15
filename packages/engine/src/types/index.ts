// ── Branded IDs ─────────────────────────────────────────────────────
export type {
  TeamId, PlayerId, CoachId, DraftPickId,
  LeagueId, UserId, ContractId, LeagueWeek,
} from './ids.js';

export {
  teamId, playerId, coachId, draftPickId,
  leagueId, userId, contractId,
} from './ids.js';

// ── Player ──────────────────────────────────────────────────────────
export { Position, PositionGroup } from './player.js';
export type {
  Player, DraftProspect, ScoutingReport, CombineResults,
  PhysicalRatings, PassingRatings, RushingRatings, ReceivingRatings,
  BlockingRatings, DefenseRatings, KickingRatings, PuntingRatings,
  PersonalityTraits, HiddenAttributes, InjuryStatus,
  PlayerContractRef, ProgressionCurve,
} from './player.js';

// ── Contract / Cap ──────────────────────────────────────────────────
export type {
  Contract, ContractYear, ContractIncentive, IncentiveCondition,
  ContractStatus, FranchiseTag, FranchiseTagType,
  TeamCapState, CapProjection, RestructureAction,
  CompPickCandidate, ICapEngine,
} from './contract.js';

// ── Team ────────────────────────────────────────────────────────────
export type {
  Team, OwnerProfile, DepthChart, TeamRecord,
  DelegationSettings, DelegationMode,
  Conference, Division,
} from './team.js';

// ── Coach ───────────────────────────────────────────────────────────
export type {
  Coach, CoachRole, CoachAttributes, CoachPersonality,
  OffensiveScheme, DefensiveScheme,
  SchemeFitResult, CoachingTreeNode, ICoachingEngine,
} from './coach.js';

// ── Draft ───────────────────────────────────────────────────────────
export type {
  DraftPick, PickCondition, DraftBoard, DraftBoardEntry,
  DraftState, DraftSelection,
  CombineEvent, CombinePerformance, IDraftEngine,
} from './draft.js';

// ── Trade ───────────────────────────────────────────────────────────
export type {
  TradeAssetItem, TradeProposal, TradeEvaluation,
  TradeValueChart, ITradeEngine,
} from './trade.js';

// ── League ──────────────────────────────────────────────────────────
export type {
  League, LeaguePhase, LeagueSettings,
  WeekSchedule, ScheduledGame,
  DivisionStandings, TeamStanding,
  SeasonHistory, AwardType, AwardHistory, LeagueUser,
} from './league.js';

// ── AI ──────────────────────────────────────────────────────────────
export type {
  GmArchetypeName, GmArchetype, GmDecisionWeights, GmTendencies,
  AiDecisionContext, AiAction, IAiGmEngine,
} from './ai.js';

// ── Calendar ────────────────────────────────────────────────────────
export type {
  CalendarEvent, AdvancePreview, ICalendarEngine,
} from './calendar.js';
