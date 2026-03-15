import type { Team } from '../types/team.js';
import type { TeamId } from '../types/ids.js';
import type { EventBus } from '../events/EventBus.js';
import type { GameEventMap } from '../events/GameEvents.js';
import { ANALYTICS_TIERS } from './constants.js';
import type { AnalyticsTier } from './constants.js';

function clampTier(level: number): number {
  return Math.max(1, Math.min(5, Math.round(level)));
}

/** Returns the full tier config for a team's current analytics investment. */
export function getAnalyticsTier(team: Team): AnalyticsTier {
  const idx = clampTier(team.analyticsLevel) - 1;
  return ANALYTICS_TIERS[idx]!;
}

/** Returns the noise multiplier for a given tier (1-5). */
export function getNoiseMultiplier(tier: number): number {
  const idx = clampTier(tier) - 1;
  return ANALYTICS_TIERS[idx]!.noiseMultiplier;
}

/** Returns cap projection accuracy parameters for a given tier. */
export function getCapProjectionAccuracy(tier: number): { years: number; errorMarginPct: number } {
  const t = ANALYTICS_TIERS[clampTier(tier) - 1]!;
  return { years: t.capProjectionYears, errorMarginPct: t.capErrorMarginPct };
}

/** Returns injury prediction accuracy (0-1) for a given tier. */
export function getInjuryPredictionAccuracy(tier: number): number {
  return ANALYTICS_TIERS[clampTier(tier) - 1]!.injuryAccuracy;
}

/**
 * Attempt to upgrade a team's analytics department.
 * Returns whether the upgrade succeeded; emits BUDGET_CHANGED on success.
 */
export function investInAnalytics(
  team: Team,
  amount: number,
  bus: EventBus<GameEventMap>,
): { newLevel: number; cost: number; success: boolean } {
  const currentLevel = clampTier(team.analyticsLevel);
  if (currentLevel >= 5) {
    return { newLevel: currentLevel, cost: 0, success: false };
  }

  const nextTier = ANALYTICS_TIERS[currentLevel]!; // index = currentLevel because next = current+1, 0-indexed = current
  const cost = nextTier.investmentCost;

  if (amount < cost) {
    return { newLevel: currentLevel, cost: 0, success: false };
  }

  const oldBudget = team.scoutingBudget;
  team.analyticsLevel = currentLevel + 1;
  team.scoutingBudget = team.scoutingBudget - cost;

  bus.emit('BUDGET_CHANGED', {
    teamId: team.id,
    department: 'analytics',
    oldBudget,
    newBudget: team.scoutingBudget,
  });

  return { newLevel: currentLevel + 1, cost, success: true };
}

/**
 * Registers event bus listeners for the analytics department.
 * Subscribes to SEASON_END for offseason bookkeeping hooks.
 */
export function registerEventHandlers(
  bus: EventBus<GameEventMap>,
  _getTeam: (id: TeamId) => Team,
): () => void {
  const unsub = bus.on('SEASON_END', (_payload) => {
    // Offseason hook: downstream systems can listen for
    // SCOUTING_REPORT_UPDATED to re-evaluate players.
    // The analytics department itself is stateless; tiers
    // are stored on the Team entity. This handler exists
    // as a registration point for future enrichment.
  });
  return unsub;
}
