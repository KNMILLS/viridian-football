/**
 * Injury risk assessment driven by analytics tier accuracy.
 */

import { createLCG, normalRandom, clamp } from '../sim/RNG.js';
import type { Player } from '../types/player.js';
import type { Position } from '../types/player.js';
import { getInjuryPredictionAccuracy } from './AnalyticsDepartment.js';
import { INJURY_RISK_CATEGORIES_BY_POSITION } from './constants.js';

export interface InjuryRiskAssessment {
  riskLevel: 'low' | 'medium' | 'high' | 'very_high';
  riskCategory: string | null;
  estimatedGamesMissed: number | null;
  accuracy: number;
  notes: string[];
}

function tierFromLevel(level: number): number {
  return Math.max(1, Math.min(5, Math.round(level)));
}

/**
 * Predict injury risk for a player; detail level depends on analytics tier.
 */
export function predictInjuryRisk(
  player: Player,
  analyticsLevel: number,
  seed: number,
): InjuryRiskAssessment {
  const tier = tierFromLevel(analyticsLevel);
  const accuracy = getInjuryPredictionAccuracy(analyticsLevel);
  const rng = createLCG(seed);

  const baseRisk = player.hidden.injuryProneness;
  const noise = normalRandom(rng, 0, 20 * (1 - accuracy));
  const perceivedRisk = clamp(baseRisk + noise, 0, 99);

  let riskLevel: InjuryRiskAssessment['riskLevel'];
  if (perceivedRisk <= 25) riskLevel = 'low';
  else if (perceivedRisk <= 50) riskLevel = 'medium';
  else if (perceivedRisk <= 75) riskLevel = 'high';
  else riskLevel = 'very_high';

  const notes: string[] = [];
  if (riskLevel === 'low') notes.push('Durability profile looks favorable');
  else if (riskLevel === 'medium') notes.push('Moderate injury risk; monitor workload');
  else if (riskLevel === 'high') notes.push('Elevated injury risk; consider depth');
  else notes.push('High injury risk; significant durability concerns');

  let riskCategory: string | null = null;
  if (tier >= 3) {
    const categories = INJURY_RISK_CATEGORIES_BY_POSITION[player.position as Position];
    if (categories?.length) {
      const idx = Math.floor(rng() * categories.length);
      riskCategory = categories[idx] ?? null;
    }
  }

  let estimatedGamesMissed: number | null = null;
  if (tier >= 4) {
    const base = perceivedRisk / 25;
    const wiggle = normalRandom(rng, 0, 0.5);
    estimatedGamesMissed = Math.max(0, Math.round(base + wiggle));
  }

  if (tier >= 5 && riskCategory) {
    notes.push(`Body area of concern: ${riskCategory}`);
  }

  return {
    riskLevel,
    riskCategory,
    estimatedGamesMissed,
    accuracy,
    notes,
  };
}
