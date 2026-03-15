// Analytics Department and Scouting

export {
  getAnalyticsTier,
  getNoiseMultiplier,
  getCapProjectionAccuracy,
  getInjuryPredictionAccuracy,
  investInAnalytics,
  registerEventHandlers,
} from './AnalyticsDepartment.js';
export type { AnalyticsTier } from './constants.js';

export {
  generateReport,
  updateReportAfterVisit,
  updateReportAfterCombine,
} from './ScoutingReportGenerator.js';

export { evaluateProspect } from './ProspectEvaluator.js';
export type { ProspectEvaluation } from './ProspectEvaluator.js';

export { evaluateCurrentPlayer } from './PlayerEvaluator.js';
export type { PlayerEvaluation as PlayerScoutingEvaluation } from './PlayerEvaluator.js';

export { predictInjuryRisk } from './InjuryPredictor.js';
export type { InjuryRiskAssessment } from './InjuryPredictor.js';

export { projectCapSpace } from './CapProjector.js';
export type { CapYearProjection } from './CapProjector.js';

export {
  ANALYTICS_TIERS,
  BASE_GRADE_NOISE,
  BASE_SCHEME_FIT_NOISE,
  INVESTMENT_NARROWING_FACTOR,
  CONFIDENCE_BASE_BY_TIER,
  VISIT_TYPE_EFFECTS,
  COMPARISON_PLAYER_BANK,
  mapOverallToGrade,
  snapToScoutGrade,
  getGradeBracketLabel,
  getCeilingText,
  getFloorText,
  VALID_SCOUT_GRADES,
  GRADE_FLOOR,
  GRADE_CEILING,
  CAP_GROWTH_RATE,
} from './constants.js';
export type { VisitType, VisitEffect } from './constants.js';
