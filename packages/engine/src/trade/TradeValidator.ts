/**
 * Trade legality validation — checks cap compliance, roster limits,
 * no-trade clauses, deadline, Stepien rule, and asset limits.
 */

import type { TradeProposal, TradeAssetItem } from '../types/trade.js';
import type { League } from '../types/league.js';
import type { Contract } from '../types/contract.js';
import type { TeamId, PlayerId } from '../types/ids.js';
import type { ICapEngine } from '../types/contract.js';
import {
  MAX_ASSETS_PER_SIDE,
  MAX_ROSTER_REGULAR,
  MAX_ROSTER_OFFSEASON,
  TRADE_DEADLINE_WEEK,
  STEPIEN_RULE_MIN_PICKS_PER_YEAR,
} from './constants.js';

// ── Public API ──────────────────────────────────────────────────────

export function validateTradeLegality(
  proposal: TradeProposal,
  league: League,
  capEngine: ICapEngine,
): { legal: boolean; violations: string[] } {
  const violations: string[] = [];

  checkMaxAssets(proposal, violations);
  checkTradeDeadline(proposal, league, violations);
  checkNoTradeClauses(proposal, league, violations);
  checkRosterLimits(proposal, league, violations);
  checkCapCompliance(proposal, league, capEngine, violations);
  checkStepienRule(proposal, league, violations);

  return { legal: violations.length === 0, violations };
}

export function calculateCapImpact(
  proposal: TradeProposal,
  league: League,
): { proposingCapDelta: number; targetCapDelta: number } {
  let proposingDelta = 0;
  let targetDelta = 0;

  for (const asset of proposal.offering) {
    if (asset.type === 'player') {
      const hit = getPlayerCapHit(asset.playerId, league);
      proposingDelta -= hit; // cap relief for proposing team
      targetDelta += hit;    // cap burden for target team
    }
  }

  for (const asset of proposal.requesting) {
    if (asset.type === 'player') {
      const hit = getPlayerCapHit(asset.playerId, league);
      targetDelta -= hit;
      proposingDelta += hit;
    }
  }

  return { proposingCapDelta: proposingDelta, targetCapDelta: targetDelta };
}

// ── Validation checks ───────────────────────────────────────────────

function checkMaxAssets(
  proposal: TradeProposal,
  violations: string[],
): void {
  if (proposal.offering.length > MAX_ASSETS_PER_SIDE) {
    violations.push(
      `Offering side exceeds maximum of ${MAX_ASSETS_PER_SIDE} assets (has ${proposal.offering.length})`,
    );
  }
  if (proposal.requesting.length > MAX_ASSETS_PER_SIDE) {
    violations.push(
      `Requesting side exceeds maximum of ${MAX_ASSETS_PER_SIDE} assets (has ${proposal.requesting.length})`,
    );
  }
}

function checkTradeDeadline(
  proposal: TradeProposal,
  league: League,
  violations: string[],
): void {
  const gameWeekDeadline = league.settings.tradeDeadlineWeek ?? TRADE_DEADLINE_WEEK;
  // Regular season starts at calendar week 24; convert game-week to calendar-week
  const calendarDeadline = gameWeekDeadline + 23;

  const POSTSEASON_PHASES: ReadonlySet<string> = new Set([
    'playoffs_wildcard', 'playoffs_divisional',
    'playoffs_conference', 'super_bowl', 'pro_bowl',
  ]);

  const isRegularSeason = league.phase === 'regular_season';
  const pastDeadline =
    (isRegularSeason && league.week > calendarDeadline) ||
    POSTSEASON_PHASES.has(league.phase);

  if (!pastDeadline) return;

  const hasPlayerOffering = proposal.offering.some(a => a.type === 'player');
  const hasPlayerRequesting = proposal.requesting.some(a => a.type === 'player');

  if (hasPlayerOffering || hasPlayerRequesting) {
    violations.push(
      `Player trades are not allowed after the trade deadline (week ${gameWeekDeadline})`,
    );
  }
}

function checkNoTradeClauses(
  proposal: TradeProposal,
  league: League,
  violations: string[],
): void {
  const playerAssets = [
    ...proposal.offering.filter(a => a.type === 'player'),
    ...proposal.requesting.filter(a => a.type === 'player'),
  ];

  for (const asset of playerAssets) {
    if (asset.type !== 'player') continue;
    const contract = findActiveContract(asset.playerId, league);
    if (contract?.hasNoTradeClause) {
      const player = league.players.find(p => p.id === asset.playerId);
      const name = player ? `${player.firstName} ${player.lastName}` : asset.playerId;
      violations.push(`${name} has a no-trade clause and must consent to the trade`);
    }
  }
}

function checkRosterLimits(
  proposal: TradeProposal,
  league: League,
  violations: string[],
): void {
  const isOffseason = league.phase !== 'regular_season' &&
    league.phase !== 'playoffs_wildcard' &&
    league.phase !== 'playoffs_divisional' &&
    league.phase !== 'playoffs_conference' &&
    league.phase !== 'super_bowl';
  const limit = isOffseason ? MAX_ROSTER_OFFSEASON : MAX_ROSTER_REGULAR;

  const proposingTeam = league.teams.find(t => t.id === proposal.proposingTeamId);
  const targetTeam = league.teams.find(t => t.id === proposal.targetTeamId);

  if (proposingTeam) {
    const playersOut = proposal.offering.filter(a => a.type === 'player').length;
    const playersIn = proposal.requesting.filter(a => a.type === 'player').length;
    const newSize = proposingTeam.roster.length - playersOut + playersIn;
    if (newSize > limit) {
      violations.push(
        `${proposingTeam.city} ${proposingTeam.name} would exceed the ${limit}-man roster limit (${newSize} players)`,
      );
    }
  }

  if (targetTeam) {
    const playersOut = proposal.requesting.filter(a => a.type === 'player').length;
    const playersIn = proposal.offering.filter(a => a.type === 'player').length;
    const newSize = targetTeam.roster.length - playersOut + playersIn;
    if (newSize > limit) {
      violations.push(
        `${targetTeam.city} ${targetTeam.name} would exceed the ${limit}-man roster limit (${newSize} players)`,
      );
    }
  }
}

function checkCapCompliance(
  proposal: TradeProposal,
  league: League,
  capEngine: ICapEngine,
  violations: string[],
): void {
  const { proposingCapDelta, targetCapDelta } = calculateCapImpact(proposal, league);

  const proposingCap = capEngine.getTeamCapState(proposal.proposingTeamId, league.season);
  const proposingPostTradeSpace = proposingCap.capSpace - proposingCapDelta;
  if (proposingPostTradeSpace < 0) {
    violations.push(
      `Proposing team would be over the salary cap by $${Math.abs(proposingPostTradeSpace).toLocaleString()}`,
    );
  }

  const targetCap = capEngine.getTeamCapState(proposal.targetTeamId, league.season);
  const targetPostTradeSpace = targetCap.capSpace - targetCapDelta;
  if (targetPostTradeSpace < 0) {
    violations.push(
      `Target team would be over the salary cap by $${Math.abs(targetPostTradeSpace).toLocaleString()}`,
    );
  }
}

function checkStepienRule(
  proposal: TradeProposal,
  league: League,
  violations: string[],
): void {
  const teamsToCheck = [proposal.proposingTeamId, proposal.targetTeamId];

  for (const tid of teamsToCheck) {
    const outgoingPicks = getOutgoingFirstRoundPicks(tid, proposal);
    if (outgoingPicks.length === 0) continue;

    const teamPicks = league.draftPicks.filter(
      p => p.currentTeamId === tid && p.round === 1,
    );

    const postTradePicks = teamPicks.filter(
      p => !outgoingPicks.some(op => op === p.id),
    );

    const allocatedSeasons = new Set(
      league.draftPicks.filter(p => p.round === 1).map(p => p.season),
    );
    const sortedSeasons = [...allocatedSeasons].sort((a, b) => a - b);

    for (let i = 0; i < sortedSeasons.length - 1; i++) {
      const year = sortedSeasons[i]!;
      const nextYear = sortedSeasons[i + 1]!;
      if (nextYear !== year + 1) continue;

      const hasPick = postTradePicks.some(p => p.season === year);
      const nextHasPick = postTradePicks.some(p => p.season === nextYear);

      if (!hasPick && !nextHasPick) {
        const team = league.teams.find(t => t.id === tid);
        const teamLabel = team ? `${team.city} ${team.name}` : tid;
        violations.push(
          `${teamLabel} would have no first-round picks in both ${year} and ${nextYear} (Stepien rule)`,
        );
        break;
      }
    }
  }
}

// ── Helpers ─────────────────────────────────────────────────────────

function getPlayerCapHit(playerId: PlayerId, league: League): number {
  const contract = findActiveContract(playerId, league);
  if (!contract) return 0;
  const yd = contract.yearDetails.find(y => y.season === league.season);
  return yd?.capHit ?? 0;
}

function findActiveContract(playerId: PlayerId, league: League): Contract | undefined {
  return league.contracts.find(
    c => c.playerId === playerId && c.status === 'active',
  );
}

function getOutgoingFirstRoundPicks(
  teamId: TeamId,
  proposal: TradeProposal,
): string[] {
  const isProposing = teamId === proposal.proposingTeamId;
  const outgoing = isProposing ? proposal.offering : proposal.requesting;

  return outgoing
    .filter(a => a.type === 'draft_pick' || a.type === 'conditional_pick')
    .map(a => a.pickId as string);
}
