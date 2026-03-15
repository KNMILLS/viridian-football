/**
 * Cap space projections; horizon and accuracy depend on analytics tier.
 */

import { createLCG, normalRandom } from '../sim/RNG.js';
import type { Team } from '../types/team.js';
import type { Contract } from '../types/contract.js';
import { getCapProjectionAccuracy } from './AnalyticsDepartment.js';
import { CAP_GROWTH_RATE } from './constants.js';

export interface CapYearProjection {
  season: number;
  projectedSpace: number;
  confidenceRange: [number, number];
}

function tierFromLevel(level: number): number {
  return Math.max(1, Math.min(5, Math.round(level)));
}

/**
 * Project cap space for a team over the next N years (N from tier).
 */
export function projectCapSpace(
  team: Team,
  contracts: Contract[],
  projectedCapBase: number,
  analyticsLevel: number,
  seed: number,
): CapYearProjection[] {
  const rng = createLCG(seed);
  const { years: maxYears, errorMarginPct: baseErrorPct } = getCapProjectionAccuracy(analyticsLevel);
  const tier = tierFromLevel(analyticsLevel);
  const tierAccuracy = Math.max(0.2, tier / 5);

  const committedBySeason: Record<number, number> = {};

  for (const c of contracts) {
    if (c.teamId !== team.id) continue;
    for (const yd of c.yearDetails) {
      const season = yd.season;
      committedBySeason[season] = (committedBySeason[season] ?? 0) + yd.capHit;
    }
  }

  const result: CapYearProjection[] = [];
  const seasonsInContracts = Object.keys(committedBySeason).map(Number).filter(s => s > 0);
  const currentSeason = seasonsInContracts.length
    ? Math.min(...seasonsInContracts) - 1
    : 2024;

  for (let yearOffset = 1; yearOffset <= maxYears; yearOffset++) {
    const season = currentSeason + yearOffset;
    const committedCap = committedBySeason[season] ?? 0;
    const growthNoise = tier < 5 ? normalRandom(rng, 0, 0.02 * (1 / tierAccuracy)) : 0;
    const projectedCap = projectedCapBase * Math.pow(1 + CAP_GROWTH_RATE + growthNoise, yearOffset);
    const projectedSpace = projectedCap - committedCap;

    const margin = baseErrorPct * yearOffset * (1 / tierAccuracy);
    const confidenceRange: [number, number] = [
      projectedSpace * (1 - margin),
      projectedSpace * (1 + margin),
    ];

    result.push({
      season,
      projectedSpace,
      confidenceRange,
    });
  }

  return result;
}
