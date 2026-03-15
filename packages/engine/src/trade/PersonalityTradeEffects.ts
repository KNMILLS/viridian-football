/**
 * Personality-driven trade effects — pure functions that compute how a
 * player's personality traits influence trade requests, reactions, and
 * teammate morale.
 *
 * NO hardcoded player/team checks. Everything is condition-based on
 * trait thresholds and contextual factors.
 */

import type { Player } from '../types/player.js';
import type { Team, TeamRecord } from '../types/team.js';
import type { PlayerId } from '../types/ids.js';
import { clamp } from '../sim/RNG.js';

// ── Context types ───────────────────────────────────────────────────

export interface TradeRequestContext {
  teamRecord: TeamRecord;
  positionMarketSalary: number;
  currentSalary: number;
  isStarter: boolean;
  yearsOnTeam: number;
  teamMarketSize: 'small' | 'medium' | 'large';
}

export interface TradeReactionContext {
  yearsOnFromTeam: number;
  wasBenchedOnFromTeam: boolean;
}

export interface TeammateReactionContext {
  sharedYearsOnTeam: number;
}

// ── Trade Request Likelihood ────────────────────────────────────────

/**
 * Probability (0-1) that a player initiates a trade request.
 * Driven entirely by personality traits + situational context.
 */
export function getTradeRequestLikelihood(
  player: Player,
  ctx: TradeRequestContext,
): number {
  const p = player.personality;

  const underpaidRatio = ctx.positionMarketSalary > 0
    ? Math.max(0, 1 - ctx.currentSalary / ctx.positionMarketSalary)
    : 0;
  const greedFactor = (p.greed / 99) * underpaidRatio * 0.30;

  const lossFactor = ctx.teamRecord.wins + ctx.teamRecord.losses > 0
    ? ctx.teamRecord.losses / (ctx.teamRecord.wins + ctx.teamRecord.losses)
    : 0;
  const disloyaltyFactor = ((99 - p.loyalty) / 99) * lossFactor * 0.25;

  const benchedFactor = !ctx.isStarter
    ? (p.chipOnShoulder / 99) * 0.20
    : 0;

  const marketFactor = ctx.teamMarketSize === 'small'
    ? (p.fameSeeking / 99) * 0.10
    : 0;

  const isAging = player.age >= 30;
  const isNotContending = lossFactor > 0.5;
  const legacyFactor = isAging && isNotContending
    ? (p.legacyDrive / 99) * 0.15
    : 0;

  const familyDampening = (p.familyOriented / 99) * 0.15;

  const raw = greedFactor + disloyaltyFactor + benchedFactor + marketFactor + legacyFactor - familyDampening;
  return clamp(raw, 0, 1);
}

// ── Trade Reaction (traded player's morale) ─────────────────────────

export interface TradeReactionResult {
  moraleChange: number;
  narrative: string;
}

/**
 * How a player reacts to being traded.
 * Returns morale change (-50 to +30) and a narrative snippet.
 */
export function getTradeReaction(
  player: Player,
  fromTeam: Team,
  toTeam: Team,
  ctx: TradeReactionContext,
): TradeReactionResult {
  const p = player.personality;
  let morale = 0;
  const narratives: string[] = [];

  const loyaltyPenalty = (p.loyalty / 99) * (Math.min(ctx.yearsOnFromTeam, 10) / 10) * -30;
  if (loyaltyPenalty < -10) {
    morale += loyaltyPenalty;
    narratives.push('devastated to leave a team he was loyal to');
  }

  if (ctx.wasBenchedOnFromTeam && p.chipOnShoulder > 50) {
    const freshStartBonus = (p.chipOnShoulder / 99) * 20;
    morale += freshStartBonus;
    narratives.push('motivated by a fresh start');
  }

  const toRecord = toTeam.record;
  const fromRecord = fromTeam.record;
  const toWinPct = (toRecord.wins + toRecord.losses) > 0
    ? toRecord.wins / (toRecord.wins + toRecord.losses)
    : 0.5;
  const fromWinPct = (fromRecord.wins + fromRecord.losses) > 0
    ? fromRecord.wins / (fromRecord.wins + fromRecord.losses)
    : 0.5;

  if (toWinPct < fromWinPct - 0.15 && p.ego > 60) {
    const egoPenalty = (p.ego / 99) * -20;
    morale += egoPenalty;
    narratives.push('unhappy about being sent to a weaker team');
  }

  if (toWinPct > 0.6 && p.competitiveness > 60) {
    const contenderBonus = (p.competitiveness / 99) * 15;
    morale += contenderBonus;
    narratives.push('excited to join a contender');
  }

  if (p.legacyDrive > 70 && player.age >= 30 && toWinPct > 0.6) {
    morale += 10;
    narratives.push('sees a chance at a championship legacy');
  }

  return {
    moraleChange: Math.round(clamp(morale, -50, 30)),
    narrative: narratives.length > 0
      ? narratives.join('; ')
      : 'takes the trade in stride',
  };
}

// ── Teammate Reactions ──────────────────────────────────────────────

export interface TeammateReactionResult {
  playerId: PlayerId;
  moraleChange: number;
}

/**
 * How each teammate reacts to a player being traded away.
 * High-chemistry teammates with shared tenure lose morale;
 * loners are unaffected.
 */
export function getTeammateReaction(
  teammates: Player[],
  tradedPlayer: Player,
  contexts: Map<PlayerId, TeammateReactionContext>,
): TeammateReactionResult[] {
  const results: TeammateReactionResult[] = [];

  for (const tm of teammates) {
    if (tm.id === tradedPlayer.id) continue;

    const ctx = contexts.get(tm.id);
    const sharedYears = ctx?.sharedYearsOnTeam ?? 0;
    const p = tm.personality;

    if (p.loner > 70) {
      results.push({ playerId: tm.id, moraleChange: 0 });
      continue;
    }

    const chemistryWeight = p.teamChemistryEffect / 99;
    const tenureWeight = Math.min(sharedYears, 6) / 6;
    const bondStrength = chemistryWeight * tenureWeight;

    let moraleHit = -Math.round(bondStrength * 15);

    if (tm.experience <= 2 && p.respectForVeterans < 40 && tradedPlayer.experience >= 6) {
      moraleHit = Math.max(moraleHit + 5, 0);
    }

    if (moraleHit !== 0) {
      results.push({ playerId: tm.id, moraleChange: moraleHit });
    }
  }

  return results;
}

// ── No-Trade Clause Veto ────────────────────────────────────────────

/**
 * Likelihood (0-1) that a player with a no-trade clause vetoes a trade.
 * High familyOriented = more likely to veto. High legacyDrive + contender
 * destination = less likely.
 */
export function getNoTradeClauseVetoLikelihood(
  player: Player,
  _fromTeam: Team,
  toTeam: Team,
): number {
  const p = player.personality;

  const familyVetoBase = (p.familyOriented / 99) * 0.50;

  const toWinPct =
    toTeam.record.wins + toTeam.record.losses > 0
      ? toTeam.record.wins / (toTeam.record.wins + toTeam.record.losses)
      : 0.5;
  const contenderAppeal = toWinPct > 0.6
    ? (p.legacyDrive / 99) * 0.30
    : 0;

  const fameAppeal = (p.fameSeeking / 99) * 0.10;

  const raw = familyVetoBase - contenderAppeal - fameAppeal + 0.10;
  return clamp(raw, 0, 1);
}
