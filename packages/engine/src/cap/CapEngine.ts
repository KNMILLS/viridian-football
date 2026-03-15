import type {
  Contract, ContractYear, ICapEngine, TeamCapState, CapProjection,
  RestructureAction, CompPickCandidate, FranchiseTagType,
  FranchiseTag,
} from '../types/contract.js';
import type { Player } from '../types/player.js';
import type { Team } from '../types/team.js';
import type { TeamId, PlayerId } from '../types/ids.js';
import type { GameEventMap } from '../events/GameEvents.js';
import { EventBus } from '../events/EventBus.js';
import type { RNG } from '../sim/RNG.js';
import {
  BASE_SALARY_CAP, CAP_GROWTH_RATE, MAX_PRORATION_YEARS,
  MAX_COMP_PICKS_PER_TEAM, COMP_PICK_ROUND_THRESHOLDS,
  TAG_ESCALATOR_2ND, TAG_ESCALATOR_3RD,
} from './constants.js';

export class CapEngine implements ICapEngine {
  constructor(
    private contracts: Contract[],
    private players: Player[],
    private teams: Team[],
    private tags: FranchiseTag[],
    private bus: EventBus<GameEventMap>,
    private rng: RNG,
    private currentSeason: number = 1,
  ) {}

  // ── Public API (ICapEngine) ──────────────────────────────────────

  getTeamCapState(teamId: TeamId, season: number): TeamCapState {
    const salaryCap = this.getCapForSeason(season);
    const active = this.getActiveContractsForTeam(teamId, season);

    let totalCapCommitted = 0;
    let deadMoney = 0;
    const capHits: { playerId: PlayerId; capHit: number }[] = [];

    for (const c of active) {
      const yd = c.yearDetails.find(y => y.season === season);
      if (!yd) continue;
      totalCapCommitted += yd.capHit;
      capHits.push({ playerId: c.playerId, capHit: yd.capHit });
    }

    for (const c of this.contracts) {
      if (c.teamId !== teamId || c.status !== 'voided') continue;
      const yd = c.yearDetails.find(y => y.season === season);
      if (yd && yd.deadMoney > 0) {
        deadMoney += yd.deadMoney;
        totalCapCommitted += yd.deadMoney;
      }
    }

    capHits.sort((a, b) => b.capHit - a.capHit);

    return {
      teamId,
      season,
      salaryCap,
      totalCapCommitted,
      capSpace: salaryCap - totalCapCommitted,
      deadMoney,
      topFiveCapHits: capHits.slice(0, 5),
      projections: this.buildProjections(teamId, season, 4),
    };
  }

  calculateDeadMoney(
    contract: Contract,
    cutYear: number,
    designation: 'pre_june1' | 'post_june1',
  ): number {
    const idx = contract.yearDetails.findIndex(y => y.season === cutYear);
    if (idx < 0) return 0;

    const remaining = contract.yearDetails.slice(idx);

    if (designation === 'pre_june1') {
      let total = 0;
      for (const yd of remaining) {
        total += yd.signingBonusProration;
        if (yd.guaranteed) total += yd.baseSalary;
      }
      return total;
    }

    // Post-June 1: only the cut year's proration + any guaranteed base
    const current = remaining[0]!;
    let year1Dead = current.signingBonusProration;
    if (current.guaranteed) year1Dead += current.baseSalary;
    return year1Dead;
  }

  validateCapCompliance(
    teamId: TeamId,
    season: number,
  ): { compliant: boolean; overBy: number } {
    const state = this.getTeamCapState(teamId, season);
    const compliant = state.capSpace >= 0;
    const overBy = Math.max(0, -state.capSpace);

    if (!compliant) {
      this.bus.emit('CAP_VIOLATION', { teamId, overAmount: overBy });
    }

    return { compliant, overBy };
  }

  projectCap(teamId: TeamId, seasons: number): CapProjection[] {
    return this.buildProjections(teamId, this.currentSeason, seasons);
  }

  applyRestructure(action: RestructureAction): Contract {
    switch (action.kind) {
      case 'convert_to_bonus':
        return this.convertToBonus(action.playerId, action.amount);
      case 'add_void_years':
        return this.addVoidYears(action.playerId, action.years);
      case 'extend':
        return this.extendContract(action.playerId, action.years, action.newSalary);
      case 'pay_cut':
        return this.applyPayCut(action.playerId, action.newSalary);
      case 'release':
        return this.releasePlayer(action.playerId, action.designation);
      case 'trade':
        return this.tradePlayer(action.playerId, action.targetTeamId);
    }
  }

  calculateCompPicks(season: number): CompPickCandidate[] {
    const moves = this.identifyFreeAgentMoves(season);

    const tiebreakers = new Map<string, number>();
    for (const m of moves) tiebreakers.set(m.playerId, this.rng());

    const teamLosses = new Map<string, CompPickCandidate[]>();
    const teamGains = new Map<string, CompPickCandidate[]>();

    for (const move of moves) {
      const losses = teamLosses.get(move.previousTeamId) ?? [];
      losses.push(move);
      teamLosses.set(move.previousTeamId, losses);

      const gains = teamGains.get(move.newTeamId) ?? [];
      gains.push(move);
      teamGains.set(move.newTeamId, gains);
    }

    const byRanking = (a: CompPickCandidate, b: CompPickCandidate) =>
      b.cfaRanking - a.cfaRanking ||
      (tiebreakers.get(b.playerId) ?? 0) - (tiebreakers.get(a.playerId) ?? 0);

    const allCandidates: CompPickCandidate[] = [];

    const sortedTeamIds = [...teamLosses.keys()].sort();
    for (const tid of sortedTeamIds) {
      const losses = teamLosses.get(tid)!;
      const gains = teamGains.get(tid) ?? [];

      losses.sort(byRanking);
      gains.sort(byRanking);

      const unmatched = losses.slice(gains.length);

      const awarded = unmatched
        .slice(0, MAX_COMP_PICKS_PER_TEAM)
        .map(loss => ({
          ...loss,
          projectedRound: this.assignCompPickRound(loss.annualSalary),
        }));

      for (const c of awarded) {
        if (c.projectedRound !== null) {
          this.bus.emit('COMP_PICK_AWARDED', {
            teamId: c.previousTeamId,
            round: c.projectedRound,
            qualifyingPlayerId: c.playerId,
          });
        }
      }

      allCandidates.push(...awarded);
    }

    return allCandidates;
  }

  getFranchiseTagCost(
    position: string,
    tagType: FranchiseTagType,
    season: number,
  ): number {
    const salaries = this.getPositionSalaries(position, season);
    if (salaries.length === 0) return 0;

    salaries.sort((a, b) => b - a);

    const topN = tagType === 'transition' ? 10 : 5;
    const slice = salaries.slice(0, Math.min(topN, salaries.length));
    return Math.round(slice.reduce((s, v) => s + v, 0) / slice.length);
  }

  /**
   * Apply the consecutive-tag escalator to a base franchise tag cost.
   * 2nd consecutive year: +20 %. 3rd+: +44 %.
   */
  static applyTagEscalator(baseCost: number, consecutiveYears: number): number {
    if (consecutiveYears === 2) return Math.round(baseCost * (1 + TAG_ESCALATOR_2ND));
    if (consecutiveYears >= 3) return Math.round(baseCost * (1 + TAG_ESCALATOR_3RD));
    return baseCost;
  }

  // ── Private helpers ─────────────────────────────────────────────────

  private getCapForSeason(season: number): number {
    return Math.round(BASE_SALARY_CAP * Math.pow(1 + CAP_GROWTH_RATE, season - 1));
  }

  private getActiveContractsForTeam(teamId: TeamId, season: number): Contract[] {
    return this.contracts.filter(
      c =>
        c.teamId === teamId &&
        c.status === 'active' &&
        c.yearDetails.some(y => y.season === season),
    );
  }

  private findActiveContract(playerId: PlayerId): Contract {
    const c = this.contracts.find(
      ct => ct.playerId === playerId && ct.status === 'active',
    );
    if (!c) throw new Error(`No active contract found for player ${playerId}`);
    return c;
  }

  private recalcCapHit(yd: ContractYear): void {
    yd.capHit =
      yd.baseSalary +
      yd.signingBonusProration +
      yd.rosterBonus +
      yd.optionBonus;
  }

  private buildProjections(
    teamId: TeamId,
    baseSeason: number,
    count: number,
  ): CapProjection[] {
    const projections: CapProjection[] = [];

    for (let i = 1; i <= count; i++) {
      const future = baseSeason + i;
      const projectedCap = this.getCapForSeason(future);

      let committedCap = 0;
      const expiring: PlayerId[] = [];

      for (const c of this.contracts) {
        if (c.teamId !== teamId || c.status !== 'active') continue;
        const yd = c.yearDetails.find(y => y.season === future);
        if (!yd) continue;

        committedCap += yd.capHit;

        const lastRealSeason = c.yearDetails
          .filter(y => !y.isVoidYear)
          .reduce((max, y) => Math.max(max, y.season), 0);
        if (lastRealSeason === future) expiring.push(c.playerId);
      }

      projections.push({
        season: future,
        committedCap,
        projectedCap,
        estimatedSpace: projectedCap - committedCap,
        expiringContracts: expiring,
      });
    }

    return projections;
  }

  // ── Restructure handlers ────────────────────────────────────────────

  private convertToBonus(playerId: PlayerId, amount: number): Contract {
    const contract = this.findActiveContract(playerId);
    const idx = contract.yearDetails.findIndex(
      y => y.season === this.currentSeason,
    );
    if (idx < 0) throw new Error('No year detail found for current season');

    const remaining = contract.yearDetails.slice(idx);
    const years = Math.min(remaining.length, MAX_PRORATION_YEARS);
    const perYear = Math.floor(amount / years);
    const leftover = amount - perYear * years;

    remaining[0]!.baseSalary -= amount;

    for (let i = 0; i < years; i++) {
      const yd = remaining[i]!;
      yd.signingBonusProration += perYear + (i === years - 1 ? leftover : 0);
      this.recalcCapHit(yd);
    }

    contract.signingBonus += amount;
    return contract;
  }

  private addVoidYears(playerId: PlayerId, years: number): Contract {
    const contract = this.findActiveContract(playerId);
    const last = contract.yearDetails[contract.yearDetails.length - 1]!;

    for (let i = 1; i <= years; i++) {
      contract.yearDetails.push({
        year: last.year + i,
        season: last.season + i,
        baseSalary: 0,
        capHit: 0,
        deadMoney: 0,
        signingBonusProration: 0,
        rosterBonus: 0,
        optionBonus: 0,
        incentives: [],
        isVoidYear: true,
        guaranteed: false,
        guaranteeType: 'none',
      });
    }

    contract.voidYears += years;
    contract.years += years;
    return contract;
  }

  private extendContract(
    playerId: PlayerId,
    years: number,
    newSalary: number,
  ): Contract {
    const contract = this.findActiveContract(playerId);
    const lastReal = [...contract.yearDetails]
      .filter(y => !y.isVoidYear)
      .pop()!;

    for (let i = 1; i <= years; i++) {
      contract.yearDetails.push({
        year: lastReal.year + i,
        season: lastReal.season + i,
        baseSalary: newSalary,
        capHit: newSalary,
        deadMoney: 0,
        signingBonusProration: 0,
        rosterBonus: 0,
        optionBonus: 0,
        incentives: [],
        isVoidYear: false,
        guaranteed: false,
        guaranteeType: 'none',
      });
    }

    contract.years += years;
    contract.totalValue += newSalary * years;
    return contract;
  }

  private applyPayCut(playerId: PlayerId, newSalary: number): Contract {
    const contract = this.findActiveContract(playerId);

    for (const yd of contract.yearDetails) {
      if (yd.season >= this.currentSeason && !yd.isVoidYear) {
        yd.baseSalary = newSalary;
        this.recalcCapHit(yd);
      }
    }

    return contract;
  }

  private releasePlayer(
    playerId: PlayerId,
    designation: 'pre_june1' | 'post_june1',
  ): Contract {
    const contract = this.findActiveContract(playerId);
    const dead = this.calculateDeadMoney(
      contract,
      this.currentSeason,
      designation,
    );

    const currentYd = contract.yearDetails.find(
      y => y.season === this.currentSeason,
    );
    const capSavings = currentYd ? currentYd.capHit - dead : 0;

    contract.status = 'voided';

    if (currentYd) {
      currentYd.deadMoney = dead;
      currentYd.capHit = dead;
    }

    if (designation === 'post_june1') {
      const deferred = contract.yearDetails
        .filter(y => y.season > this.currentSeason)
        .reduce((sum, y) => sum + y.signingBonusProration, 0);

      if (deferred > 0) {
        const nextYd = contract.yearDetails.find(
          y => y.season === this.currentSeason + 1,
        );
        if (nextYd) {
          nextYd.deadMoney = deferred;
          nextYd.capHit = deferred;
        }
      }
    }

    this.bus.emit('PLAYER_RELEASED', {
      playerId,
      teamId: contract.teamId,
      deadMoney: dead,
      capSavings,
    });

    this.bus.emit('DEAD_MONEY_HIT', {
      teamId: contract.teamId,
      playerId,
      amount: dead,
      reason: `${designation} release`,
    });

    return contract;
  }

  private tradePlayer(playerId: PlayerId, targetTeamId: TeamId): Contract {
    const contract = this.findActiveContract(playerId);
    const originalTeamId = contract.teamId;

    const remainingProration = contract.yearDetails
      .filter(y => y.season >= this.currentSeason)
      .reduce((sum, y) => sum + y.signingBonusProration, 0);

    if (remainingProration > 0) {
      this.bus.emit('DEAD_MONEY_HIT', {
        teamId: originalTeamId,
        playerId,
        amount: remainingProration,
        reason: 'trade',
      });
    }

    for (const yd of contract.yearDetails) {
      if (yd.season >= this.currentSeason) {
        yd.signingBonusProration = 0;
        this.recalcCapHit(yd);
      }
    }

    contract.teamId = targetTeamId;
    return contract;
  }

  // ── Comp-pick helpers ───────────────────────────────────────────────

  private identifyFreeAgentMoves(season: number): CompPickCandidate[] {
    const moves: CompPickCandidate[] = [];

    const signed = this.contracts.filter(
      c =>
        c.status === 'active' &&
        c.signedDate.season === season &&
        c.yearDetails.some(y => y.season === season),
    );

    for (const nc of signed) {
      const prev = this.contracts.find(
        c =>
          c.playerId === nc.playerId &&
          c.id !== nc.id &&
          (c.status === 'expired' || c.status === 'voided') &&
          c.teamId !== nc.teamId,
      );
      if (!prev) continue;

      const player = this.players.find(p => p.id === nc.playerId);
      const apy = nc.totalValue / Math.max(1, nc.years);
      const seasonKey = String(season - 1);
      const snapPct =
        player?.seasonStats[seasonKey]?.['snapPercentage'] ?? 50;
      const honors: string[] = [];

      moves.push({
        playerId: nc.playerId,
        previousTeamId: prev.teamId,
        newTeamId: nc.teamId,
        annualSalary: apy,
        snapPercentage: snapPct,
        postseasonHonors: honors,
        cfaRanking: this.computeCfaRanking(apy, snapPct, honors),
        projectedRound: null,
      });
    }

    return moves;
  }

  private computeCfaRanking(
    apy: number,
    snapPercentage: number,
    honors: string[],
  ): number {
    const snapBonus = (snapPercentage / 100) * 0.2;
    const honorsBonus = Math.min(honors.length, 3) * 0.05;
    return apy * (1 + snapBonus + honorsBonus);
  }

  private assignCompPickRound(apy: number): 3 | 4 | 5 | 6 | 7 {
    for (const { round, minApy } of COMP_PICK_ROUND_THRESHOLDS) {
      if (apy >= minApy) return round;
    }
    return 7;
  }

  private getPositionSalaries(position: string, season: number): number[] {
    const salaries: number[] = [];

    for (const c of this.contracts) {
      if (c.status !== 'active') continue;
      const player = this.players.find(p => p.id === c.playerId);
      if (!player || player.position !== position) continue;
      const yd = c.yearDetails.find(y => y.season === season);
      if (yd) salaries.push(yd.capHit);
    }

    return salaries;
  }
}
