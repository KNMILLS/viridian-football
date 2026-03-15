import type {
  Player, Team, Contract, PlayerId, TeamId,
} from '../types/index.js';
import type { ICapEngine } from '../types/index.js';
import type { EventBus } from '../events/EventBus.js';
import type { GameEventMap } from '../events/GameEvents.js';
import type { RNG } from '../sim/RNG.js';
import { createLCG, clamp, randomInt, shuffle } from '../sim/RNG.js';
import {
  POSITION_VALUE_TIERS,
  POSITION_BASELINE_SALARY,
  POSITION_PEAK_AGE,
  COMP_PICK_MAX_PER_TEAM,
} from './constants.js';

// ── Types ──────────────────────────────────────────────────────────

export interface FreeAgentDemands {
  minSalary: number;
  preferredYears: number;
  teamPreference: TeamId | null;
  discount: number;
  regionPreference: string | null;
  preferContender: boolean;
  demandsStartingRole: boolean;
  weights: {
    money: number;
    loyalty: number;
    fame: number;
    family: number;
    legacy: number;
  };
}

export interface FreeAgent {
  player: Player;
  marketValue: number;
  demands: FreeAgentDemands;
}

export interface FreeAgencySigningRecord {
  playerId: PlayerId;
  teamId: TeamId;
  contract: { totalValue: number; years: number; guaranteed: number };
}

export interface CompPickTracking {
  departedFrom: TeamId;
  playerId: PlayerId;
  newTeamId: TeamId;
  apy: number;
}

export interface FreeAgencyResult {
  signings: FreeAgencySigningRecord[];
  unsignedPlayers: PlayerId[];
  compPickTracking: CompPickTracking[];
}

export interface CompPickProjection {
  playerId: PlayerId;
  apy: number;
  projectedRound: 3 | 4 | 5 | 6 | 7 | null;
}

// ── Big-Market Teams (top 8 by media market size proxy) ────────────

const BIG_MARKET_TEAMS = new Set<string>();

// ── Free Agency Engine ─────────────────────────────────────────────

export class FreeAgencyEngine {
  private players: Player[];
  private teams: Team[];
  private contracts: Contract[];
  private bus: EventBus<GameEventMap>;
  private capEngine: ICapEngine;
  private rng: RNG;

  constructor(
    players: Player[],
    teams: Team[],
    contracts: Contract[],
    bus: EventBus<GameEventMap>,
    capEngine: ICapEngine,
    rng: RNG,
  ) {
    this.players = players;
    this.teams = teams;
    this.contracts = contracts;
    this.bus = bus;
    this.capEngine = capEngine;
    this.rng = rng;

    if (BIG_MARKET_TEAMS.size === 0 && teams.length > 0) {
      const sorted = [...teams].sort((a, b) =>
        (b.owner.spendingWillingness + (b.owner.mediaProfile === 'loud' ? 20 : 0))
        - (a.owner.spendingWillingness + (a.owner.mediaProfile === 'loud' ? 20 : 0)),
      );
      const topCount = Math.min(8, Math.ceil(teams.length / 4));
      for (let i = 0; i < topCount; i++) {
        BIG_MARKET_TEAMS.add(sorted[i]!.id as string);
      }
    }
  }

  // ── Market Generation ──────────────────────────────────────────

  generateFreeAgentMarket(
    expiredContracts: Contract[],
    releasedPlayerIds: PlayerId[],
  ): FreeAgent[] {
    const faPlayerIds = new Set<string>();

    for (const c of expiredContracts) {
      faPlayerIds.add(c.playerId as string);
    }
    for (const pid of releasedPlayerIds) {
      faPlayerIds.add(pid as string);
    }

    const freeAgents: FreeAgent[] = [];
    for (const pid of faPlayerIds) {
      const player = this.players.find((p) => (p.id as string) === pid);
      if (!player) continue;

      const marketValue = this.calculateMarketValue(player);
      const demands = this.generateDemands(player, marketValue);
      freeAgents.push({ player, marketValue, demands });
    }

    freeAgents.sort((a, b) => b.marketValue - a.marketValue);
    return freeAgents;
  }

  // ── Market Value ───────────────────────────────────────────────

  calculateMarketValue(player: Player): number {
    const positionTier = POSITION_VALUE_TIERS[player.position] ?? 0.5;
    const baseSalary = POSITION_BASELINE_SALARY[player.position] ?? 5_000_000;

    const overallFactor = player.hidden.trueOverall / 80;
    const peakWindow = POSITION_PEAK_AGE[player.position];
    let ageFactor = 1.0;

    if (peakWindow) {
      if (player.age < peakWindow.start) {
        ageFactor = 0.7 + (player.age - 21) / (peakWindow.start - 21) * 0.3;
      } else if (player.age > peakWindow.end) {
        const yearsOver = player.age - peakWindow.end;
        ageFactor = Math.max(0.3, 1 - yearsOver * 0.12);
      }
    }

    return Math.round(baseSalary * positionTier * overallFactor * ageFactor);
  }

  // ── Demand Generation (personality-driven) ─────────────────────

  generateDemands(player: Player, marketValue: number): FreeAgentDemands {
    const p = player.personality;

    let moneyWeight = 0.4;
    let loyaltyWeight = 0.15;
    let fameWeight = 0.1;
    let familyWeight = 0.1;
    let legacyWeight = 0.1;

    let minSalary = marketValue;
    let discount = 0;
    let teamPreference: TeamId | null = null;
    let regionPreference: string | null = null;
    let preferContender = false;
    let demandsStartingRole = false;

    // Greed: above-market demands
    if (p.greed > 70) {
      const greedMultiplier = 1 + (p.greed - 50) / 100;
      minSalary = Math.round(marketValue * greedMultiplier);
      moneyWeight = 0.5 + (p.greed - 70) / 100;
    }

    // Loyalty: discount for current team
    if (p.loyalty > 70 && player.teamId) {
      teamPreference = player.teamId;
      discount = p.loyalty / 200;
      loyaltyWeight = 0.2 + (p.loyalty - 70) / 150;
    }

    // Fame-seeking: prefer big-market
    if (p.fameSeeking > 70) {
      fameWeight = 0.2 + (p.fameSeeking - 70) / 150;
    }

    // Family-oriented: region preference
    if (p.familyOriented > 70) {
      regionPreference = 'home_region';
      familyWeight = 0.2 + (p.familyOriented - 70) / 150;
    }

    // Legacy-driven aging player: wants a contender
    if (p.legacyDrive > 70 && player.age > 30) {
      preferContender = true;
      legacyWeight = 0.25 + (p.legacyDrive - 70) / 150;
      minSalary = Math.round(minSalary * 0.85);
    }

    // Ego: demands starting role
    if (p.ego > 80) {
      demandsStartingRole = true;
    }

    // Preferred contract length based on age
    const preferredYears = player.age > 32 ? 1
      : player.age > 29 ? 2
      : player.age > 26 ? 3
      : 4;

    // Normalise weights
    const totalWeight = moneyWeight + loyaltyWeight + fameWeight + familyWeight + legacyWeight;
    const norm = totalWeight > 0 ? 1 / totalWeight : 1;

    return {
      minSalary,
      preferredYears,
      teamPreference,
      discount,
      regionPreference,
      preferContender,
      demandsStartingRole,
      weights: {
        money: moneyWeight * norm,
        loyalty: loyaltyWeight * norm,
        fame: fameWeight * norm,
        family: familyWeight * norm,
        legacy: legacyWeight * norm,
      },
    };
  }

  // ── Full FA Simulation ─────────────────────────────────────────

  conductFreeAgency(freeAgents: FreeAgent[], seed: number): FreeAgencyResult {
    const faRng = createLCG(seed);
    const signings: FreeAgencySigningRecord[] = [];
    const compPickTracking: CompPickTracking[] = [];
    const unsigned = new Set(freeAgents.map((fa) => fa.player.id));

    const sortedFAs = [...freeAgents].sort((a, b) => b.marketValue - a.marketValue);
    const availableTeams = new Map(this.teams.map((t) => [t.id as string, t]));

    for (const fa of sortedFAs) {
      const offers = this.generateTeamOffers(fa, availableTeams, faRng);
      if (offers.length === 0) continue;

      const bestOffer = this.evaluateOffers(fa, offers);
      if (!bestOffer) continue;

      unsigned.delete(fa.player.id);

      const years = fa.demands.preferredYears;
      const guaranteed = Math.round(bestOffer.totalValue * 0.5);

      signings.push({
        playerId: fa.player.id,
        teamId: bestOffer.teamId,
        contract: { totalValue: bestOffer.totalValue, years, guaranteed },
      });

      this.bus.emit('CONTRACT_SIGNED', {
        playerId: fa.player.id,
        teamId: bestOffer.teamId,
        totalValue: bestOffer.totalValue,
        years,
        guaranteed,
      });

      if (fa.player.teamId && fa.player.teamId !== bestOffer.teamId) {
        compPickTracking.push({
          departedFrom: fa.player.teamId,
          playerId: fa.player.id,
          newTeamId: bestOffer.teamId,
          apy: Math.round(bestOffer.totalValue / years),
        });
      }
    }

    return {
      signings,
      unsignedPlayers: [...unsigned],
      compPickTracking,
    };
  }

  // ── Comp Pick Eligibility ──────────────────────────────────────

  evaluateCompPickEligibility(
    departedPlayers: CompPickTracking[],
    signedPlayers: FreeAgencySigningRecord[],
    teamId: TeamId,
  ): CompPickProjection[] {
    const departed = departedPlayers.filter((d) => (d.departedFrom as string) === (teamId as string));
    const signed = signedPlayers.filter((s) => (s.teamId as string) === (teamId as string));

    const netLoss = departed.length - signed.length;
    if (netLoss <= 0) return [];

    const ranked = [...departed].sort((a, b) => b.apy - a.apy);
    const projections: CompPickProjection[] = [];

    for (let i = 0; i < Math.min(netLoss, COMP_PICK_MAX_PER_TEAM); i++) {
      const dep = ranked[i];
      if (!dep) break;

      let projectedRound: 3 | 4 | 5 | 6 | 7 | null = null;
      if (dep.apy >= 14_000_000) projectedRound = 3;
      else if (dep.apy >= 10_000_000) projectedRound = 4;
      else if (dep.apy >= 6_500_000) projectedRound = 5;
      else if (dep.apy >= 3_500_000) projectedRound = 6;
      else projectedRound = 7;

      projections.push({
        playerId: dep.playerId,
        apy: dep.apy,
        projectedRound,
      });
    }

    return projections;
  }

  // ── Private: Team Offer Generation ─────────────────────────────

  private generateTeamOffers(
    fa: FreeAgent,
    teams: Map<string, Team>,
    rng: RNG,
  ): { teamId: TeamId; totalValue: number; score: number }[] {
    const offers: { teamId: TeamId; totalValue: number; score: number }[] = [];

    const shuffledTeams = shuffle(rng, [...teams.values()]);
    const maxOffers = Math.min(shuffledTeams.length, randomInt(rng, 2, 6));

    for (let i = 0; i < maxOffers; i++) {
      const team = shuffledTeams[i]!;
      const capState = this.capEngine.getTeamCapState(team.id, 0);
      if (capState.capSpace < fa.demands.minSalary * 0.5) continue;

      const varianceFactor = 0.85 + rng() * 0.3;
      const totalValue = Math.round(
        fa.marketValue * fa.demands.preferredYears * varianceFactor,
      );

      let score = totalValue * fa.demands.weights.money;

      if (fa.demands.teamPreference && team.id === fa.demands.teamPreference) {
        score += totalValue * fa.demands.weights.loyalty * (1 + fa.demands.discount);
      }

      if (BIG_MARKET_TEAMS.has(team.id as string)) {
        score += totalValue * fa.demands.weights.fame * 0.5;
      }

      if (fa.demands.preferContender && team.record.wins > team.record.losses) {
        score += totalValue * fa.demands.weights.legacy * 0.5;
      }

      offers.push({ teamId: team.id, totalValue, score });
    }

    return offers;
  }

  private evaluateOffers(
    fa: FreeAgent,
    offers: { teamId: TeamId; totalValue: number; score: number }[],
  ): { teamId: TeamId; totalValue: number } | null {
    if (offers.length === 0) return null;

    const best = [...offers].sort((a, b) => b.score - a.score)[0]!;

    if (best.totalValue < fa.demands.minSalary * fa.demands.preferredYears * 0.5) {
      return null;
    }

    return { teamId: best.teamId, totalValue: best.totalValue };
  }
}
