/**
 * Main trade engine — implements ITradeEngine.
 *
 * Coordinates valuation, validation, negotiation, personality effects,
 * and conditional pick tracking. Wires up event bus subscriptions to
 * react to holdouts, injuries, breakouts, etc.
 */

import type {
  ITradeEngine,
  TradeProposal,
  TradeEvaluation,
  TradeAssetItem,
} from '../types/trade.js';
import type { League } from '../types/league.js';
import type { ICapEngine, RestructureAction } from '../types/contract.js';
import type { TeamId, PlayerId, DraftPickId } from '../types/ids.js';
import type { RNG } from '../sim/RNG.js';
import type { EventBus } from '../events/EventBus.js';
import type { GameEventMap } from '../events/GameEvents.js';
import type { AiDecisionContext } from '../types/ai.js';

import {
  getPlayerTradeValue,
  getPickTradeValue,
  computeFairnessScore,
} from './TradeValuation.js';
import {
  validateTradeLegality,
  calculateCapImpact,
} from './TradeValidator.js';
import {
  generateCounterOffer as negotiateCounter,
  evaluateFromTeamPerspective,
} from './TradeNegotiation.js';
import {
  getTradeReaction,
  getTeammateReaction,
} from './PersonalityTradeEffects.js';
import { ConditionalPickTracker } from './ConditionalPickTracker.js';
import type { SeasonConditionData } from './ConditionalPickTracker.js';

export class TradeEngine implements ITradeEngine {
  private league: League;
  private bus: EventBus<GameEventMap>;
  private rng: RNG;
  private capEngine: ICapEngine;
  private tradeHistory: TradeProposal[] = [];
  private tradeCandidates: Set<PlayerId> = new Set();
  private rosterNeeds: Map<TeamId, { position: string; urgency: number }[]> = new Map();
  readonly conditionalPicks = new ConditionalPickTracker();

  constructor(
    league: League,
    bus: EventBus<GameEventMap>,
    rng: RNG,
    capEngine: ICapEngine,
  ) {
    this.league = league;
    this.bus = bus;
    this.rng = rng;
    this.capEngine = capEngine;
    this.wireEventSubscriptions();
  }

  // ── ITradeEngine implementation ───────────────────────────────────

  evaluateTrade(proposal: TradeProposal): TradeEvaluation {
    const offeringValue = this.sumAssetValues(proposal.offering);
    const requestingValue = this.sumAssetValues(proposal.requesting);
    const fairnessScore = computeFairnessScore(offeringValue, requestingValue);

    const { proposingCapDelta, targetCapDelta } = calculateCapImpact(
      proposal,
      this.league,
    );

    const proposingContext = this.buildTeamContext(proposal.proposingTeamId);
    const targetContext = this.buildTeamContext(proposal.targetTeamId);

    const proposingEval = proposingContext
      ? evaluateFromTeamPerspective(proposal, this.league, proposingContext)
      : { score: 0, recommendation: 'neutral' as const };
    const targetEval = targetContext
      ? evaluateFromTeamPerspective(proposal, this.league, targetContext)
      : { score: 0, recommendation: 'neutral' as const };

    return {
      proposalId: proposal.id,
      offeringValue,
      requestingValue,
      fairnessScore,
      capImpactProposing: proposingCapDelta,
      capImpactTarget: targetCapDelta,
      rosterFitProposing: proposingEval.score,
      rosterFitTarget: targetEval.score,
      recommendation: targetEval.recommendation,
    };
  }

  generateCounterOffer(proposal: TradeProposal): TradeProposal | null {
    const ctx = this.buildTeamContext(proposal.targetTeamId);
    if (!ctx) return null;
    const seed = Math.floor(this.rng() * 2147483647);
    return negotiateCounter(proposal, this.league, ctx, seed);
  }

  validateTradeLegality(
    proposal: TradeProposal,
  ): { legal: boolean; violations: string[] } {
    return validateTradeLegality(proposal, this.league, this.capEngine);
  }

  getTradeHistory(teamId: TeamId): TradeProposal[] {
    return this.tradeHistory.filter(
      t =>
        t.proposingTeamId === teamId ||
        t.targetTeamId === teamId,
    );
  }

  // ── Extended API (not on ITradeEngine but used by orchestrator) ───

  proposeTrade(proposal: TradeProposal): void {
    this.tradeHistory.push(proposal);
    this.bus.emit('TRADE_PROPOSED', {
      proposingTeamId: proposal.proposingTeamId,
      targetTeamId: proposal.targetTeamId,
      offering: proposal.offering.map(a => assetToEventPayload(a, proposal.proposingTeamId)),
      requesting: proposal.requesting.map(a => assetToEventPayload(a, proposal.targetTeamId)),
    });
  }

  executeTrade(proposal: TradeProposal): { success: boolean; violations: string[] } {
    const validity = this.validateTradeLegality(proposal);
    if (!validity.legal) {
      proposal.status = 'rejected';
      this.bus.emit('TRADE_REJECTED', {
        proposingTeamId: proposal.proposingTeamId,
        targetTeamId: proposal.targetTeamId,
        reason: validity.violations.join('; '),
      });
      return { success: false, violations: validity.violations };
    }

    this.swapPlayers(proposal);
    this.swapDraftPicks(proposal);
    this.transferContracts(proposal);
    this.trackConditionalPicks(proposal);

    proposal.status = 'accepted';
    if (!this.tradeHistory.includes(proposal)) {
      this.tradeHistory.push(proposal);
    }

    const allAssets = [
      ...proposal.offering.map(a => assetToEventPayload(a, proposal.proposingTeamId)),
      ...proposal.requesting.map(a => assetToEventPayload(a, proposal.targetTeamId)),
    ];
    this.bus.emit('TRADE_ACCEPTED', {
      teams: [proposal.proposingTeamId, proposal.targetTeamId],
      assets: allAssets,
    });

    this.applyPersonalityEffects(proposal);

    this.emitTradeNews(proposal);

    return { success: true, violations: [] };
  }

  resolveSeasonConditions(data: SeasonConditionData): void {
    this.conditionalPicks.updateProgress(data);
    this.conditionalPicks.resolveAll(data.season);
    this.conditionalPicks.applyResolutions(this.league.draftPicks);
  }

  // ── Roster / pick swaps ───────────────────────────────────────────

  private swapPlayers(proposal: TradeProposal): void {
    const proposingTeam = this.league.teams.find(t => t.id === proposal.proposingTeamId);
    const targetTeam = this.league.teams.find(t => t.id === proposal.targetTeamId);
    if (!proposingTeam || !targetTeam) return;

    for (const asset of proposal.offering) {
      if (asset.type !== 'player') continue;
      proposingTeam.roster = proposingTeam.roster.filter(id => id !== asset.playerId);
      targetTeam.roster.push(asset.playerId);
      const player = this.league.players.find(p => p.id === asset.playerId);
      if (player) player.teamId = proposal.targetTeamId;
    }

    for (const asset of proposal.requesting) {
      if (asset.type !== 'player') continue;
      targetTeam.roster = targetTeam.roster.filter(id => id !== asset.playerId);
      proposingTeam.roster.push(asset.playerId);
      const player = this.league.players.find(p => p.id === asset.playerId);
      if (player) player.teamId = proposal.proposingTeamId;
    }
  }

  private swapDraftPicks(proposal: TradeProposal): void {
    for (const asset of proposal.offering) {
      if (asset.type === 'player') continue;
      const pick = this.league.draftPicks.find(p => p.id === asset.pickId);
      if (pick) pick.currentTeamId = proposal.targetTeamId;
    }

    for (const asset of proposal.requesting) {
      if (asset.type === 'player') continue;
      const pick = this.league.draftPicks.find(p => p.id === asset.pickId);
      if (pick) pick.currentTeamId = proposal.proposingTeamId;
    }
  }

  private transferContracts(proposal: TradeProposal): void {
    for (const asset of proposal.offering) {
      if (asset.type !== 'player') continue;
      this.capEngine.applyRestructure({
        kind: 'trade',
        playerId: asset.playerId,
        targetTeamId: proposal.targetTeamId,
      });
    }

    for (const asset of proposal.requesting) {
      if (asset.type !== 'player') continue;
      this.capEngine.applyRestructure({
        kind: 'trade',
        playerId: asset.playerId,
        targetTeamId: proposal.proposingTeamId,
      });
    }
  }

  private trackConditionalPicks(proposal: TradeProposal): void {
    const conditionals = [
      ...proposal.offering.filter(a => a.type === 'conditional_pick'),
      ...proposal.requesting.filter(a => a.type === 'conditional_pick'),
    ];

    for (const asset of conditionals) {
      if (asset.type !== 'conditional_pick') continue;
      const pick = this.league.draftPicks.find(p => p.id === asset.pickId);
      if (pick && pick.conditions.length > 0) {
        this.conditionalPicks.trackCondition(pick.id, pick.conditions);
      }
    }
  }

  // ── Personality effects ───────────────────────────────────────────

  private applyPersonalityEffects(proposal: TradeProposal): void {
    const proposingTeam = this.league.teams.find(t => t.id === proposal.proposingTeamId);
    const targetTeam = this.league.teams.find(t => t.id === proposal.targetTeamId);
    if (!proposingTeam || !targetTeam) return;

    for (const asset of proposal.offering) {
      if (asset.type !== 'player') continue;
      const player = this.league.players.find(p => p.id === asset.playerId);
      if (!player) continue;

      getTradeReaction(player, proposingTeam, targetTeam, {
        yearsOnFromTeam: player.experience,
        wasBenchedOnFromTeam: false,
      });

      const teammates = this.league.players.filter(
        p => p.teamId === proposal.targetTeamId && p.id !== player.id,
      );
      getTeammateReaction(
        teammates,
        player,
        new Map(teammates.map(t => [t.id, { sharedYearsOnTeam: 0 }])),
      );
    }

    for (const asset of proposal.requesting) {
      if (asset.type !== 'player') continue;
      const player = this.league.players.find(p => p.id === asset.playerId);
      if (!player) continue;

      getTradeReaction(player, targetTeam, proposingTeam, {
        yearsOnFromTeam: player.experience,
        wasBenchedOnFromTeam: false,
      });
    }
  }

  // ── News generation ───────────────────────────────────────────────

  private emitTradeNews(proposal: TradeProposal): void {
    const proposingTeam = this.league.teams.find(t => t.id === proposal.proposingTeamId);
    const targetTeam = this.league.teams.find(t => t.id === proposal.targetTeamId);

    const playerIds: PlayerId[] = [];
    for (const a of [...proposal.offering, ...proposal.requesting]) {
      if (a.type === 'player') playerIds.push(a.playerId);
    }

    this.bus.emit('NEWS_STORY', {
      headline: `Trade completed between ${proposingTeam?.name ?? 'Unknown'} and ${targetTeam?.name ?? 'Unknown'}`,
      body: `A ${proposal.offering.length}-for-${proposal.requesting.length} trade has been finalized.`,
      category: 'trade',
      relatedTeamIds: [proposal.proposingTeamId, proposal.targetTeamId],
      relatedPlayerIds: playerIds,
      importance: playerIds.length > 0 ? 'major' : 'notable',
    });
  }

  // ── Event bus wiring ──────────────────────────────────────────────

  private wireEventSubscriptions(): void {
    this.bus.on('HOLDOUT_INITIATED', (payload) => {
      this.tradeCandidates.add(payload.playerId);
    });

    this.bus.on('INJURY_OCCURRED', (_payload) => {
      // Injury changes player value — no state to track, valuation reads
      // current injuryStatus at evaluation time
    });

    this.bus.on('PLAYER_BREAKOUT', (_payload) => {
      // Breakout changes stats — valuation reads current stats
    });

    this.bus.on('PLAYER_DECLINE', (_payload) => {
      // Decline changes stats — valuation reads current stats
    });

    this.bus.on('ROSTER_NEED_IDENTIFIED', (payload) => {
      const needs = this.rosterNeeds.get(payload.teamId) ?? [];
      const urgencyMap: Record<string, number> = { low: 25, medium: 50, high: 75, critical: 100 };
      needs.push({
        position: payload.position,
        urgency: urgencyMap[payload.urgency] ?? 50,
      });
      this.rosterNeeds.set(payload.teamId, needs);
    });

    this.bus.on('SEASON_END', (payload) => {
      // Build season data and resolve conditional picks
      const proBowlSelections: PlayerId[] = [];
      const playerStats = new Map<PlayerId, Record<string, number>>();
      const playoffTeams: TeamId[] = payload.standings
        .filter(s => s.wins >= 10)
        .map(s => s.teamId);

      for (const p of this.league.players) {
        const seasonKey = String(payload.season);
        if (p.seasonStats[seasonKey]) {
          playerStats.set(p.id, p.seasonStats[seasonKey]!);
        }
      }

      this.resolveSeasonConditions({
        season: payload.season,
        proBowlSelections,
        playerStats,
        playoffTeams,
      });
    });
  }

  // ── Helpers ───────────────────────────────────────────────────────

  private sumAssetValues(assets: TradeAssetItem[]): number {
    let total = 0;
    for (const asset of assets) {
      if (asset.type === 'player') {
        const player = this.league.players.find(p => p.id === asset.playerId);
        const contract = this.league.contracts.find(
          c => c.playerId === asset.playerId && c.status === 'active',
        );
        if (player) {
          total += getPlayerTradeValue(player, contract ?? null);
        }
      } else {
        const pick = this.league.draftPicks.find(p => p.id === asset.pickId);
        if (pick) {
          total += getPickTradeValue(pick, this.league.season);
        }
      }
    }
    return total;
  }

  private buildTeamContext(teamId: TeamId): AiDecisionContext | null {
    const team = this.league.teams.find(t => t.id === teamId);
    if (!team) return null;

    const capState = this.capEngine.getTeamCapState(teamId, this.league.season);
    const teamPicks = this.league.draftPicks.filter(p => p.currentTeamId === teamId);
    const needs = this.rosterNeeds.get(teamId) ?? [];

    const winPct =
      team.record.wins + team.record.losses > 0
        ? team.record.wins / (team.record.wins + team.record.losses)
        : 0.5;

    const mode: AiDecisionContext['mode'] =
      winPct >= 0.65 ? 'dynasty' :
      winPct >= 0.55 ? 'contend' :
      winPct >= 0.4  ? 'retool' :
      'rebuild';

    return {
      teamId,
      archetype: {
        name: 'analytics_architect',
        displayName: 'Analytics Architect',
        description: 'Data-driven decision maker',
        weights: {
          analyticsReliance: 80,
          scoutingReliance: 60,
          draftPriority: 70,
          freeAgencyAggression: 50,
          tradeAggression: 60,
          capConservatism: 60,
          riskTolerance: 50,
          cultureWeight: 40,
          schemeFitWeight: 70,
          youthBias: 60,
          veteranBias: 40,
          compPickAwareness: 70,
        },
        tendencies: {
          rebuildThreshold: 0.35,
          contendThreshold: 0.60,
          coachFiringPatience: 3,
          starPlayerLoyalty: 3,
          draftTradeUpFrequency: 30,
          draftTradeDownFrequency: 50,
          maxDeadMoneyTolerance: 15,
          franchiseTagUsage: 40,
        },
        signatureMoves: ['trade_down', 'analytics_picks'],
      },
      season: this.league.season,
      teamRecord: { wins: team.record.wins, losses: team.record.losses },
      capSpace: capState.capSpace,
      draftPickCount: teamPicks.length,
      ownerPressure: 50,
      rosterNeeds: needs,
      mode,
    };
  }
}

// ── Utility ─────────────────────────────────────────────────────────

function assetToEventPayload(
  asset: TradeAssetItem,
  fromTeamId: TeamId,
): { type: 'player' | 'draft_pick' | 'conditional_pick'; id: PlayerId | DraftPickId; fromTeamId: TeamId } {
  return {
    type: asset.type,
    id: (asset.type === 'player' ? asset.playerId : asset.pickId) as PlayerId | DraftPickId,
    fromTeamId,
  };
}
