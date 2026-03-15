/**
 * Current NFL player evaluation: base ScoutingReport plus aging, production, contract context.
 */

import type { Player, ScoutingReport } from '../types/player.js';
import { generateReport } from './ScoutingReportGenerator.js';
import { defaultCurves } from '../progression/positionCurves.js';

export interface PlayerEvaluation extends ScoutingReport {
  agingProjection: string;
  productionTrend: string;
  contractValueAssessment: string;
  tradeValue: string;
}

function getAgingProjection(player: Player): string {
  const curve = defaultCurves[player.position];
  if (!curve) return 'Aging curve data unavailable for position';
  const { peakAgeStart, peakAgeEnd } = curve;
  if (player.age < peakAgeStart) {
    return 'Entering prime years; upside remains';
  }
  if (player.age <= peakAgeEnd) {
    return 'In prime years; expect peak performance';
  }
  if (player.age <= peakAgeEnd + 2) {
    return 'Peak window closing; slight decline possible';
  }
  return 'In the decline phase; manage expectations';
}

function getProductionTrend(player: Player): string {
  const stats = player.seasonStats;
  const seasons = Object.keys(stats).map(Number).sort((a, b) => b - a);
  if (seasons.length < 2) return 'Insufficient data for trend';
  const getTotal = (season: number) => {
    const s = stats[String(season)];
    if (!s) return 0;
    return Object.values(s).reduce((a, b) => a + b, 0);
  };
  const recent = getTotal(seasons[0]!);
  const prior = getTotal(seasons[1]!);
  if (prior > 0 && recent > prior * 1.05) return 'Improving; production trending up';
  if (prior > 0 && recent < prior * 0.95) return 'Declining; production trending down';
  return 'Steady; consistent production year over year';
}

function getContractValueAssessment(
  gradeMid: number,
  currentYearCapHit: number,
  estimatedValueFromGrade: number,
): string {
  if (currentYearCapHit <= 0) return 'Free agent; no current cap hit';
  const ratio = currentYearCapHit / Math.max(1, estimatedValueFromGrade);
  if (ratio < 0.85) return 'Underpaid relative to grade';
  if (ratio <= 1.15) return 'Fair value for grade';
  return 'Overpaid relative to grade';
}

function gradeToEstimatedCapValue(gradeMid: number): number {
  // Rough: grade 6.0 ~ $5M, 7.0 ~ $12M, 8.0 ~ $25M (starter to star)
  if (gradeMid >= 8.0) return 20_000_000 + (gradeMid - 8) * 15_000_000;
  if (gradeMid >= 7.0) return 8_000_000 + (gradeMid - 7) * 12_000_000;
  if (gradeMid >= 6.0) return 3_000_000 + (gradeMid - 6) * 5_000_000;
  return 1_000_000 + gradeMid * 400_000;
}

function getTradeValueDescriptor(player: Player, gradeMid: number): string {
  const age = player.age;
  const curve = defaultCurves[player.position];
  const inDecline = curve && age > curve.peakAgeEnd + 1;
  if (gradeMid >= 7.5 && !inDecline) return 'High trade value; impact player in prime';
  if (gradeMid >= 6.5 && !inDecline) return 'Solid trade value; starter with upside';
  if (gradeMid >= 6.0) return 'Moderate trade value; backup or short-term starter';
  if (inDecline) return 'Limited trade value; age and/or decline factor';
  return 'Low trade value; developmental or role player';
}

/**
 * Evaluate a current NFL player with aging, production, and contract context.
 */
export function evaluateCurrentPlayer(
  player: Player,
  analyticsLevel: number,
  currentSeason: number,
  seed: number,
): PlayerEvaluation {
  const report = generateReport(player, analyticsLevel, seed);

  const agingProjection = getAgingProjection(player);
  const productionTrend = getProductionTrend(player);

  const midGrade = (report.gradeRange[0]! + report.gradeRange[1]!) / 2;
  const estimatedValue = gradeToEstimatedCapValue(midGrade);
  const capHit = player.contract?.currentYearCapHit ?? 0;
  const contractValueAssessment = getContractValueAssessment(midGrade, capHit, estimatedValue);

  const tradeValue = getTradeValueDescriptor(player, midGrade);

  return {
    ...report,
    agingProjection,
    productionTrend,
    contractValueAssessment,
    tradeValue,
  };
}
