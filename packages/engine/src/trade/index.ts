// ── Trade Engine ────────────────────────────────────────────────────
export { TradeEngine } from './TradeEngine.js';

// ── Trade Valuation ─────────────────────────────────────────────────
export {
  getPlayerTradeValue,
  getPickTradeValue,
  getSurplusValue,
  getContenderPremium,
  getDeadlinePressure,
  computeFairnessScore,
} from './TradeValuation.js';
export type { ValuationTeamContext } from './TradeValuation.js';

// ── Trade Validator ─────────────────────────────────────────────────
export {
  validateTradeLegality,
  calculateCapImpact,
} from './TradeValidator.js';

// ── Trade Negotiation ───────────────────────────────────────────────
export {
  generateCounterOffer,
  evaluateFromTeamPerspective,
} from './TradeNegotiation.js';

// ── Personality Trade Effects ───────────────────────────────────────
export {
  getTradeRequestLikelihood,
  getTradeReaction,
  getTeammateReaction,
  getNoTradeClauseVetoLikelihood,
} from './PersonalityTradeEffects.js';
export type {
  TradeRequestContext,
  TradeReactionContext,
  TradeReactionResult,
  TeammateReactionContext,
  TeammateReactionResult,
} from './PersonalityTradeEffects.js';

// ── Conditional Pick Tracker ────────────────────────────────────────
export { ConditionalPickTracker } from './ConditionalPickTracker.js';
export type { SeasonConditionData, ConditionStatus } from './ConditionalPickTracker.js';

// ── Trade Value Chart ───────────────────────────────────────────────
export {
  ViridianTradeValueChart,
  getDiscountedPickValue,
  getRawPickValue,
  computeAgingDiscount,
} from './tradeValueChart.js';
export type { TradeValueChartDeps } from './tradeValueChart.js';

// ── Constants ───────────────────────────────────────────────────────
export {
  TRADE_DEADLINE_WEEK,
  MAX_ASSETS_PER_SIDE,
  MAX_ROSTER_REGULAR,
  MAX_ROSTER_OFFSEASON,
  FUTURE_PICK_DISCOUNT,
  CONTENDER_PREMIUM_MAX,
  DEADLINE_PRESSURE_MAX,
  FAIRNESS_THRESHOLD_CLOSE,
  FAIRNESS_THRESHOLD_UNFAIR,
  STEPIEN_RULE_MIN_PICKS_PER_YEAR,
  POSITION_SCARCITY,
} from './constants.js';
