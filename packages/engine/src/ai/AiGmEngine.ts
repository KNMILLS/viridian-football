import { EventBus } from '../events/EventBus.js';
import type { GameEventMap } from '../events/GameEvents.js';
import { CapEngine } from '../cap/CapEngine.js';
import { analyzeRosterNeeds } from '../roster/RosterNeedAnalyzer.js';
import { generateTeamBoard, type BoardWeights } from '../draft/DraftBoard.js';
import { getPickTradeValue } from '../trade/TradeValuation.js';
import { computeFairnessScore, getPlayerTradeValue } from '../trade/TradeValuation.js';
import { validateTradeLegality } from '../trade/TradeValidator.js';
import { createLCG, weightedChoice, clamp } from '../sim/RNG.js';
import type {
  AiAction,
  AiDecisionContext,
  GmArchetype,
  GmArchetypeName,
  IAiGmEngine,
} from '../types/ai.js';
import type {
  Coach,
  CoachId,
  DraftPick,
  DraftProspect,
  League,
  Player,
  PlayerId,
  Position,
  Team,
  TeamId,
} from '../types/index.js';
import { getArchetypeByName, listArchetypes } from './archetypes.js';

interface DecisionOption {
  kind: AiAction['kind'];
  weight: number;
}

export class AiGmEngine implements IAiGmEngine {
  private bus: EventBus<GameEventMap>;
  private cap: CapEngine;

  constructor(private league: League, bus?: EventBus<GameEventMap>) {
    this.bus = bus ?? new EventBus<GameEventMap>();
    this.cap = new CapEngine(
      this.league.contracts,
      this.league.players,
      this.league.teams,
      [],
      this.bus,
      createLCG(this.league.seed + this.league.season * 3333),
      this.league.season,
    );
  }

  getArchetype(teamId: TeamId): GmArchetype {
    const name = this.assignArchetype(teamId);
    return getArchetypeByName(name);
  }

  evaluateTeamState(teamId: TeamId): AiDecisionContext {
    const team = this.requireTeam(teamId);
    const archetype = this.getArchetype(teamId);
    const capState = this.cap.getTeamCapState(teamId, this.league.season);
    const draftPickCount = this.league.draftPicks.filter(
      (p) => p.currentTeamId === teamId && p.season === this.league.season,
    ).length;

    const rosterNeeds = analyzeRosterNeeds(
      team,
      this.teamPlayers(teamId),
      team.depthChart,
    ).map((need) => ({
      position: need.position,
      urgency: this.needToScore(need.urgency),
    }));

    const mode = this.determineMode(team.record, archetype);
    const ownerPressure = this.computeOwnerPressure(team);

    return {
      teamId,
      archetype,
      season: this.league.season,
      teamRecord: { wins: team.record.wins, losses: team.record.losses },
      capSpace: capState.capSpace,
      draftPickCount,
      ownerPressure,
      rosterNeeds,
      mode,
    };
  }

  decideAction(context: AiDecisionContext): AiAction {
    const rng = createLCG(this.decisionSeed(context.teamId, context.season));
    const options: DecisionOption[] = [];

    const team = this.requireTeam(context.teamId);
    const freeAgents = this.freeAgents();
    const coachPool = this.availableCoaches();
    const prospects = this.league.draftProspects;

    // Trade / FA / draft / coaching / analytics weights
    if (freeAgents.length > 0) {
      options.push({
        kind: 'sign_free_agent',
        weight: context.archetype.weights.freeAgencyAggression,
      });
    }

    if (prospects.length > 0) {
      options.push({
        kind: 'draft_player',
        weight: context.archetype.weights.draftPriority + this.topNeedScore(context),
      });
    }

    if (coachPool.length > 0) {
      options.push({
        kind: 'hire_coach',
        weight: 40 + (100 - context.archetype.tendencies.coachFiringPatience) * 2,
      });
    }

    options.push({
      kind: 'invest_analytics',
      weight: context.archetype.weights.analyticsReliance,
    });

    if (options.length === 0) {
      return { kind: 'no_action', reason: 'No available actions' };
    }

    const active = options.map((o) => ({ ...o, weight: Math.max(0, o.weight) }));
    const maxWeight = Math.max(...active.map((o) => o.weight));
    const top = active.filter((o) => o.weight === maxWeight);
    const others = active.filter((o) => o.weight !== maxWeight).reduce((s, o) => s + o.weight, 0);

    const choice = active.length === 1
      ? active[0]!.kind
      : (top.length === 1 && maxWeight >= others * 1.5)
        ? top[0]!.kind
        : weightedChoice(rng, active.map((o) => ({ item: o.kind, weight: o.weight || 1 })));

    switch (choice) {
      case 'sign_free_agent': {
        const target = freeAgents.sort((a, b) => b.hidden.trueOverall - a.hidden.trueOverall)[0]!;
        const offer = { years: 2, totalValue: Math.max(2_000_000, target.hidden.trueOverall * 50_000) };
        return { kind: 'sign_free_agent', playerId: target.id, offer };
      }
      case 'draft_player': {
        const board = this.generateDraftBoard(context.teamId);
        const pick = board[0];
        if (!pick) return { kind: 'no_action', reason: 'No prospects available' };
        return { kind: 'draft_player', playerId: pick };
      }
      case 'hire_coach': {
        const candidate = this.rankCoaches(coachPool, context.archetype)[0];
        if (!candidate) return { kind: 'no_action', reason: 'No coaches available' };
        return { kind: 'hire_coach', coachId: candidate.id, role: candidate.role };
      }
      case 'invest_analytics': {
        const amount = clamp(500_000, 0, Math.max(5_000_000, context.capSpace * 0.05));
        return { kind: 'invest_analytics', amount };
      }
      default:
        return { kind: 'no_action', reason: 'No confident decision' };
    }
  }

  evaluateTradeOffer(teamId: TeamId, proposal: import('../types/trade.js').TradeProposal): boolean {
    const archetype = this.getArchetype(teamId);
    const team = this.requireTeam(teamId);
    if (!validateTradeLegality(proposal, this.league, this.cap).legal) return false;

    const offeringValue = this.aggregateAssetsValue(proposal.offering, teamId);
    const requestingValue = this.aggregateAssetsValue(proposal.requesting, teamId);
    const fairness = computeFairnessScore(offeringValue, requestingValue);

    const riskBuffer = (archetype.weights.riskTolerance / 100) * 15
      + (archetype.weights.tradeAggression / 100) * 10;

    // Aggressive archetypes accept slightly negative fairness if win-now
    const winPct = this.winPct(team.record);
    const contendLean = winPct >= 0.55 ? 5 : 0;

    return fairness >= -5 - riskBuffer - contendLean;
  }

  generateDraftBoard(teamId: TeamId): import('../types/index.js').PlayerId[] {
    const team = this.requireTeam(teamId);
    const archetype = this.getArchetype(teamId);
    const rosterNeeds = analyzeRosterNeeds(team, this.teamPlayers(teamId), team.depthChart);

    const needsMap = new Map<Position, number>();
    for (const need of rosterNeeds) {
      needsMap.set(need.position, this.needToScore(need.urgency));
    }

    const schemeFit = new Map<PlayerId, number>();
    for (const prospect of this.league.draftProspects) {
      schemeFit.set(prospect.id, this.estimateSchemeFit(prospect, archetype));
    }

    const weights: BoardWeights = {
      scouting: archetype.weights.analyticsReliance > 70 ? 0.45 : 0.55,
      need: clamp(archetype.weights.draftPriority / 120, 0.15, 0.4),
      schemeFit: clamp(archetype.weights.schemeFitWeight / 200, 0.15, 0.35),
    };

    const board = generateTeamBoard(
      teamId,
      this.league.draftProspects,
      new Map(this.league.draftProspects.map((p) => [p.id, p.scoutingReport])),
      needsMap,
      schemeFit,
      weights,
    );

    return board.rankings.map((r) => r.prospectId);
  }

  prioritizeCoachingHire(teamId: TeamId): CoachId[] {
    const archetype = this.getArchetype(teamId);
    const candidates = this.availableCoaches();
    const ranked = this.rankCoaches(candidates, archetype);
    return ranked.map((c) => c.id);
  }

  // â”€â”€ Helpers â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

  private assignArchetype(teamId: TeamId): GmArchetypeName {
    const archetypes = listArchetypes().map((a) => a.name);
    const seed = this.decisionSeed(teamId, this.league.season);
    const idx = seed % archetypes.length;
    return archetypes[idx]!;
  }

  private determineMode(
    record: { wins: number; losses: number },
    archetype: GmArchetype,
  ): AiDecisionContext['mode'] {
    const total = Math.max(1, record.wins + record.losses);
    const winPct = record.wins / total;
    if (record.wins >= archetype.tendencies.contendThreshold || winPct >= 0.65) {
      return 'dynasty';
    }
    if (record.wins >= archetype.tendencies.contendThreshold || winPct >= 0.55) {
      return 'contend';
    }
    if (record.wins <= archetype.tendencies.rebuildThreshold || winPct <= 0.35) {
      return 'rebuild';
    }
    return 'retool';
  }

  private needToScore(urgency: string): number {
    switch (urgency) {
      case 'critical': return 100;
      case 'high': return 75;
      case 'medium': return 50;
      default: return 25;
    }
  }

  private computeOwnerPressure(team: Team): number {
    const patience = team.owner.patience;
    const losses = team.record.losses;
    const wins = team.record.wins;
    const pressureFromResults = clamp((losses - wins) * 5, 0, 70);
    const media = team.owner.mediaProfile === 'loud' ? 20 : team.owner.mediaProfile === 'moderate' ? 10 : 0;
    return clamp(pressureFromResults + (100 - patience) * 0.5 + media, 0, 100);
  }

  private teamPlayers(teamId: TeamId): Player[] {
    return this.league.players.filter((p) => p.teamId === teamId);
  }

  private freeAgents(): Player[] {
    return this.league.players.filter((p) => p.teamId === null);
  }

  private availableCoaches(): Coach[] {
    return this.league.coaches.filter((c) => c.teamId === null);
  }

  private rankCoaches(coaches: Coach[], archetype: GmArchetype): Coach[] {
    return [...coaches].sort((a, b) => {
      const scoreA = this.coachScore(a, archetype);
      const scoreB = this.coachScore(b, archetype);
      return scoreB - scoreA;
    });
  }

  private coachScore(coach: Coach, archetype: GmArchetype): number {
    const culture = archetype.weights.cultureWeight * (coach.personality.motivation / 100);
    const scheme = archetype.weights.schemeFitWeight * (coach.attributes.schemeDesign / 100);
    const dev = coach.attributes.playerDevelopment;
    return culture + scheme + dev;
  }

  private aggregateAssetsValue(assets: DraftPick | any[], teamId: TeamId): number {
    let total = 0;
    for (const asset of assets as any[]) {
      if (asset.type === 'player') {
        const player = this.league.players.find((p) => p.id === asset.playerId);
        if (player) {
          const contract = this.league.contracts.find((c) => c.playerId === player.id) ?? null;
          total += getPlayerTradeValue(player, contract, { teamRecord: this.requireTeam(teamId).record });
        }
      } else if (asset.type === 'draft_pick') {
        const pick = this.league.draftPicks.find((p) => p.id === asset.pickId);
        if (pick) total += getPickTradeValue(pick, this.league.season);
      }
    }
    return total;
  }

  private estimateSchemeFit(prospect: DraftProspect, archetype: GmArchetype): number {
    const base = prospect.scoutingReport.schemeFitGrades?.[0]?.fitGrade ?? 5.5;
    const bias = archetype.weights.schemeFitWeight / 100;
    return clamp(Math.round(((base - 4) / 5) * 100 * (0.9 + 0.2 * bias)), 0, 100);
  }

  private topNeedScore(context: AiDecisionContext): number {
    const highest = context.rosterNeeds[0]?.urgency ?? 0;
    return clamp(highest, 0, 100);
  }

  private winPct(record: { wins: number; losses: number }): number {
    const total = Math.max(1, record.wins + record.losses);
    return record.wins / total;
  }

  private decisionSeed(teamId: TeamId, season: number): number {
    return Math.abs(this.teamIdHash(teamId) + this.league.seed + season * 101);
  }

  private teamIdHash(id: TeamId): number {
    const str = String(id);
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      hash = ((hash << 5) - hash + str.charCodeAt(i)) | 0;
    }
    return Math.abs(hash);
  }

  private requireTeam(teamId: TeamId): Team {
    const team = this.league.teams.find((t) => t.id === teamId);
    if (!team) throw new Error(`Team ${teamId} not found`);
    return team;
  }
}
