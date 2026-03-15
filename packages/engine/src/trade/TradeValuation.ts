/**
 * Trade valuation — pure functions for computing player trade value,
 * pick trade value, surplus value, and context-aware multipliers.
 */

import type { Player, ProgressionCurve } from '../types/player.js';
import type { Contract } from '../types/contract.js';
import type { DraftPick } from '../types/draft.js';
import type { TeamRecord } from '../types/team.js';

/** Minimal record for contender premium (only wins/losses used). */
type WinsLosses = Pick<TeamRecord, 'wins' | 'losses'>;
import type { SchemeFitResult } from '../types/coach.js';
import { defaultCurves } from '../progression/positionCurves.js';
import { clamp } from '../sim/RNG.js';
import {
  FUTURE_PICK_DISCOUNT,
  CONTENDER_PREMIUM_MAX,
  DEADLINE_PRESSURE_MAX,
  TRADE_DEADLINE_WEEK,
  POSITION_SCARCITY,
} from './constants.js';
import { getRawPickValue, computeAgingDiscount } from './tradeValueChart.js';

// ── Team context passed into valuation functions ────────────────────

export interface ValuationTeamContext {
  teamRecord: TeamRecord | WinsLosses;
  schemeFit?: SchemeFitResult;
  weeksUntilDeadline?: number;
}

// ── Player Trade Value ──────────────────────────────────────────────

/**
 * Compute a player's trade value in abstract "trade points" (same scale
 * as pick chart values, roughly 0-3000).
 *
 * Uses only externally-visible information (stats, age, contract, injury
 * status) — never peeks at hidden.trueOverall.
 */
export function getPlayerTradeValue(
  player: Player,
  contract: Contract | null,
  ctx?: ValuationTeamContext,
): number {
  const base = estimateProductionValue(player);
  const agingCurve = defaultCurves[player.position] ?? defaultCurves['QB'];
  const ageMult = computeAgingDiscount(player.age, agingCurve);
  const positionMult = POSITION_SCARCITY[player.position] ?? 1.0;
  const injuryMult = getInjuryDiscount(player);
  const surplus = contract
    ? getSurplusValue(player, contract, agingCurve)
    : 0;
  const schemeMult = ctx?.schemeFit
    ? clamp(0.85 + (ctx.schemeFit.fitScore / 100) * 0.30, 0.85, 1.15)
    : 1.0;

  const raw = (base * ageMult * positionMult * injuryMult * schemeMult) + surplus;
  return Math.max(0, Math.round(raw));
}

// ── Pick Trade Value ────────────────────────────────────────────────

/**
 * Value of a draft pick for trade purposes.
 * Future picks are discounted by FUTURE_PICK_DISCOUNT per year.
 * Conditional picks use the base round (before upgrade).
 */
export function getPickTradeValue(pick: DraftPick, currentSeason: number): number {
  const round = pick.round;
  const pickInRound = pick.pickInRound ?? 16;
  const yearsAway = Math.max(0, pick.season - currentSeason);
  const base = getRawPickValue(round, pickInRound);
  return Math.round(base * Math.pow(FUTURE_PICK_DISCOUNT, yearsAway));
}

// ── Surplus Value ───────────────────────────────────────────────────

/**
 * Surplus = projected production value minus cap hit across remaining
 * contract years, with aging curve applied year-by-year.
 * Positive = underpaid (valuable), negative = overpaid (negative asset).
 */
export function getSurplusValue(
  player: Player,
  contract: Contract,
  curveOverride?: ProgressionCurve,
): number {
  const curve = curveOverride ?? defaultCurves[player.position] ?? defaultCurves['QB'];
  const productionBase = estimateProductionValue(player);
  const annualMarketValue = productionBase * 5000;

  let surplus = 0;
  const currentSeason = contract.yearDetails
    .filter(y => !y.isVoidYear)
    .map(y => y.season)
    .sort((a, b) => a - b)[0] ?? 1;

  for (const yd of contract.yearDetails) {
    if (yd.isVoidYear) continue;
    const futureAge = player.age + (yd.season - currentSeason);
    const ageMult = computeAgingDiscount(futureAge, curve);
    surplus += (annualMarketValue * ageMult) - yd.capHit;
  }

  return Math.round(surplus / 100000);
}

// ── Contender Premium ───────────────────────────────────────────────

/**
 * Teams with winning records pay a premium for "win now" pieces.
 * Returns a multiplier from 1.0 (losing team) to CONTENDER_PREMIUM_MAX.
 */
export function getContenderPremium(teamRecord: TeamRecord | WinsLosses): number {
  const total = teamRecord.wins + teamRecord.losses;
  if (total === 0) return 1.0;
  const winPct = teamRecord.wins / total;
  return clamp(1 + Math.max(0, winPct - 0.5) * 0.3, 1.0, CONTENDER_PREMIUM_MAX);
}

// ── Deadline Pressure ───────────────────────────────────────────────

/**
 * Value multiplier that increases as the trade deadline approaches.
 * At week 1: ~1.0. At the deadline: up to DEADLINE_PRESSURE_MAX.
 */
export function getDeadlinePressure(weeksUntilDeadline: number): number {
  if (weeksUntilDeadline <= 0) return DEADLINE_PRESSURE_MAX;
  const ratio = 1 - weeksUntilDeadline / TRADE_DEADLINE_WEEK;
  return clamp(1 + 0.3 * ratio, 1.0, DEADLINE_PRESSURE_MAX);
}

// ── Fairness Score ──────────────────────────────────────────────────

/**
 * Compute how fair a trade is from -100 to +100.
 *  0  = perfectly even
 * +100 = massively favors the proposing team
 * -100 = massively favors the target team
 */
export function computeFairnessScore(
  offeringValue: number,
  requestingValue: number,
): number {
  const diff = offeringValue - requestingValue;
  const avg = (offeringValue + requestingValue) / 2;
  if (avg === 0) return 0;
  return clamp(Math.round((diff / avg) * 100), -100, 100);
}

// ── Internal helpers ────────────────────────────────────────────────

/**
 * Estimate production value from visible stats. Returns a value on
 * roughly the same scale as the pick chart (0-1800).
 */
function estimateProductionValue(player: Player): number {
  const latestSeason = Object.keys(player.seasonStats)
    .map(Number)
    .sort((a, b) => b - a)[0];

  let statScore = 50;
  if (latestSeason !== undefined) {
    const stats = player.seasonStats[String(latestSeason)]!;
    const gamesPlayed = stats['gamesPlayed'] ?? 16;
    const perGameScale = gamesPlayed > 0 ? 16 / gamesPlayed : 1;

    const totalYards =
      ((stats['passingYards'] ?? 0) +
        (stats['rushingYards'] ?? 0) +
        (stats['receivingYards'] ?? 0)) *
      perGameScale;
    const totalTds =
      ((stats['passingTDs'] ?? 0) +
        (stats['rushingTDs'] ?? 0) +
        (stats['receivingTDs'] ?? 0)) *
      perGameScale;
    const tackles = (stats['tackles'] ?? 0) * perGameScale;
    const sacks = (stats['sacks'] ?? 0) * perGameScale;
    const ints = (stats['interceptions'] ?? 0) * perGameScale;

    statScore = Math.min(
      100,
      totalYards / 50 + totalTds * 3 + tackles / 2 + sacks * 5 + ints * 8,
    );
  }

  const experienceBonus = Math.min(player.experience * 2, 20);
  return Math.round((statScore + experienceBonus) * 15);
}

function getInjuryDiscount(player: Player): number {
  if (!player.injuryStatus) return 1.0;
  switch (player.injuryStatus.severity) {
    case 'minor':
      return 0.95;
    case 'moderate':
      return 0.85;
    case 'severe':
      return 0.70;
    case 'season_ending':
      return 0.45;
    default:
      return 1.0;
  }
}
