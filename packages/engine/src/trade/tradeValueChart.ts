/**
 * Draft pick value chart and TradeValueChart implementation.
 *
 * Values loosely follow the Jimmy Johnson / Rich Hill chart, scaled so
 * the 1st overall pick = 3000 and the last pick in round 7 = 2.
 */

import type { TradeValueChart } from '../types/trade.js';
import type { Player } from '../types/player.js';
import type { Contract } from '../types/contract.js';
import type { PlayerId } from '../types/ids.js';
import type { ProgressionCurve } from '../types/player.js';
import { defaultCurves } from '../progression/positionCurves.js';
import {
  FUTURE_PICK_DISCOUNT,
  CONTENDER_PREMIUM_MAX,
  DEADLINE_PRESSURE_MAX,
  TRADE_DEADLINE_WEEK,
} from './constants.js';
import { clamp } from '../sim/RNG.js';

const TOTAL_PICKS = 256;

function buildPickValueTable(): number[] {
  const table: number[] = new Array(TOTAL_PICKS + 1).fill(0);
  for (let i = 1; i <= TOTAL_PICKS; i++) {
    table[i] = Math.max(2, Math.round(3000 * Math.pow((TOTAL_PICKS - i) / (TOTAL_PICKS - 1), 2.2)));
  }
  return table;
}

const PICK_VALUE_TABLE = buildPickValueTable();

/** Convert round + pick-in-round to an overall pick number. */
function overallFromRoundPick(round: number, pick: number): number {
  const picksPerRound = 32;
  return clamp((round - 1) * picksPerRound + pick, 1, TOTAL_PICKS);
}

export interface TradeValueChartDeps {
  players: Player[];
  contracts: Contract[];
  currentSeason: number;
}

export class ViridianTradeValueChart implements TradeValueChart {
  private players: Player[];
  private contracts: Contract[];
  private currentSeason: number;

  constructor(deps: TradeValueChartDeps) {
    this.players = deps.players;
    this.contracts = deps.contracts;
    this.currentSeason = deps.currentSeason;
  }

  getPickValue(round: number, pick: number): number {
    const overall = overallFromRoundPick(round, pick);
    return PICK_VALUE_TABLE[overall] ?? 2;
  }

  getPlayerValue(playerId: PlayerId): number {
    const player = this.players.find(p => p.id === playerId);
    if (!player) return 0;
    const contract = this.contracts.find(
      c => c.playerId === playerId && c.status === 'active',
    );
    const base = estimateBaseValue(player);
    const agingMult = this.getAgingCurveDiscount(player.age, player.position);
    const surplus = contract ? estimateContractSurplus(player, contract, this.currentSeason) : 0;
    return Math.max(0, Math.round(base * agingMult + surplus));
  }

  getAgingCurveDiscount(age: number, position: string): number {
    const curve = defaultCurves[position as keyof typeof defaultCurves];
    if (!curve) return 0.5;
    return computeAgingDiscount(age, curve);
  }

  getContenderPremium(teamRecord: { wins: number; losses: number }): number {
    const total = teamRecord.wins + teamRecord.losses;
    if (total === 0) return 1.0;
    const winPct = teamRecord.wins / total;
    return clamp(1 + Math.max(0, winPct - 0.5) * 0.3, 1.0, CONTENDER_PREMIUM_MAX);
  }

  getDeadlinePressure(weeksUntilDeadline: number): number {
    if (weeksUntilDeadline <= 0) return DEADLINE_PRESSURE_MAX;
    const ratio = 1 - weeksUntilDeadline / TRADE_DEADLINE_WEEK;
    return clamp(1 + 0.3 * ratio, 1.0, DEADLINE_PRESSURE_MAX);
  }
}

/** Pick value with future-year discount applied. */
export function getDiscountedPickValue(
  round: number,
  pick: number,
  yearsAway: number,
): number {
  const overall = overallFromRoundPick(round, pick);
  const base = PICK_VALUE_TABLE[overall] ?? 2;
  return Math.round(base * Math.pow(FUTURE_PICK_DISCOUNT, yearsAway));
}

/** Raw pick chart lookup (no discount). */
export function getRawPickValue(round: number, pick: number): number {
  const overall = overallFromRoundPick(round, pick);
  return PICK_VALUE_TABLE[overall] ?? 2;
}

/**
 * Estimate a player's base production value from visible stats & experience.
 * Uses career stats and position to derive a value in "trade points" (0-3000 scale).
 */
function estimateBaseValue(player: Player): number {
  const latestSeason = Object.keys(player.seasonStats)
    .map(Number)
    .sort((a, b) => b - a)[0];

  let statScore = 50;
  if (latestSeason !== undefined) {
    const stats = player.seasonStats[String(latestSeason)]!;
    const gamesPlayed = stats['gamesPlayed'] ?? 16;
    const perGameFactor = gamesPlayed > 0 ? 16 / gamesPlayed : 1;

    const totalYards = ((stats['passingYards'] ?? 0) + (stats['rushingYards'] ?? 0) + (stats['receivingYards'] ?? 0)) * perGameFactor;
    const totalTds = ((stats['passingTDs'] ?? 0) + (stats['rushingTDs'] ?? 0) + (stats['receivingTDs'] ?? 0)) * perGameFactor;
    const tackles = (stats['tackles'] ?? 0) * perGameFactor;
    const sacks = (stats['sacks'] ?? 0) * perGameFactor;
    const ints = (stats['interceptions'] ?? 0) * perGameFactor;

    statScore = Math.min(100, (totalYards / 50) + (totalTds * 3) + (tackles / 2) + (sacks * 5) + (ints * 8));
  }

  const experienceBonus = Math.min(player.experience * 2, 20);
  return Math.round((statScore + experienceBonus) * 15);
}

/** Contract surplus: positive if player outperforms their cap hit. */
function estimateContractSurplus(player: Player, contract: Contract, currentSeason: number): number {
  const remaining = contract.yearDetails.filter(
    y => y.season >= currentSeason && !y.isVoidYear,
  );
  if (remaining.length === 0) return 0;

  const baseValue = estimateBaseValue(player);
  const annualMarketValue = baseValue * 5000;
  let surplus = 0;
  for (const yd of remaining) {
    surplus += annualMarketValue - yd.capHit;
  }
  return Math.round(surplus / 100000);
}

/** Compute aging discount multiplier (0-1) from age and position curve. */
export function computeAgingDiscount(age: number, curve: ProgressionCurve): number {
  if (age < curve.peakAgeStart) {
    const yearsToGrow = curve.peakAgeStart - age;
    return clamp(0.7 + 0.3 * (1 - yearsToGrow / 8), 0.5, 0.95);
  }
  if (age <= curve.peakAgeEnd) {
    return 1.0;
  }
  const yearsPostPeak = age - curve.peakAgeEnd;
  const declinePenalty = yearsPostPeak * (curve.declineRate / 10);
  return clamp(1.0 - declinePenalty, 0.1, 1.0);
}
