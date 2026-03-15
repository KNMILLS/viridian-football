/**
 * SeasonOrchestrator: wires all engine modules together through
 * the event bus and provides a single `advanceWeek` / `processOffseason`
 * surface for the application layer.
 *
 * Phase 1: game simulation, injury, morale, locker room, progression.
 * Phase 2: draft, free agency, coaching carousel, roster operations.
 *
 * Each module is a standalone, deterministic unit. The orchestrator's job is
 * to feed the right data into each module and route events between them so
 * that emergent cross-module behaviours arise naturally.
 */

import { EventBus } from '../events/EventBus.js';
import type { GameEventMap } from '../events/GameEvents.js';
import type {
  League, LeaguePhase, WeekSchedule,
  Team, Player, Coach, Contract,
  TeamId, PlayerId, LeagueWeek,
  DelegationMode,
} from '../types/index.js';
import type { RNG } from '../sim/RNG.js';
import { createLCG } from '../sim/RNG.js';

import { CapEngine } from '../cap/CapEngine.js';
import { CalendarEngine } from '../calendar/Calendar.js';
import { CoachingEngine } from '../coaching/CoachingEngine.js';
import { calculateTeamStrength, type TeamStrength } from '../sim/TeamStrength.js';
import { simulateGame, type GameResult } from '../sim/GameSim.js';
import { rollForInjury, processWeeklyRecovery, type GameContext } from '../injury/InjuryEngine.js';
import {
  evaluateHoldoutRisk,
  processHoldout,
  evaluateMentorship,
  checkLockerRoomIssues,
  updateMorale,
  type MoraleEvent,
  type RecentEvents,
} from '../personality/PersonalityEngine.js';
import { processOffseasonProgression, type ProgressionContext, type ProgressionResult } from '../progression/ProgressionEngine.js';
import { delegateToStaff, type DelegationResult } from '../delegation/DelegationEngine.js';
import { autoTrainingCampCuts } from '../delegation/autoDecisions.js';

// Phase 2 module imports
import { DraftEngine } from '../draft/DraftEngine.js';
import { FreeAgencyEngine } from '../roster/FreeAgencyEngine.js';
import { CoachingHireEngine } from '../roster/CoachingHireEngine.js';
import { RosterManager } from '../roster/RosterManager.js';
import {
  simulateTrainingCamp,
  generateCutRecommendations,
  type TrainingCampResult as TCResult,
} from '../roster/TrainingCamp.js';
import { resolveConditions, type SeasonData as ConditionalSeasonData } from '../draft/ConditionalPickResolver.js';
import type { DraftProspect, PlayerContractRef } from '../types/player.js';
import type { DraftState } from '../types/draft.js';
import type { ContractYear, FranchiseTag } from '../types/contract.js';
import { contractId } from '../types/ids.js';

// ── Phase 2 Outcome Types ──────────────────────────────────────────

export interface CoachingCarouselOutcome {
  firings: { coachId: string; teamId: TeamId; reason: string }[];
  hirings: { coachId: string; teamId: TeamId; scheme: string }[];
  schemeChanges: { teamId: TeamId; side: string; oldScheme: string; newScheme: string }[];
}

export interface CombineOutcome {
  prospectCount: number;
  combineParticipants: number;
}

export interface FreeAgencyOutcome {
  signings: { playerId: PlayerId; teamId: TeamId; totalValue: number; years: number }[];
  unsignedCount: number;
}

export interface DraftOutcome {
  selections: { playerId: PlayerId; teamId: TeamId; round: number; pick: number; overall: number }[];
  isComplete: boolean;
}

export interface UDFAOutcome {
  signings: { playerId: PlayerId; teamId: TeamId }[];
}

export interface TrainingCampOutcome {
  teamResults: { teamId: TeamId; evaluationCount: number; contestedBattles: number }[];
}

export interface RosterCutsOutcome {
  cuts: { playerId: PlayerId; teamId: TeamId }[];
}

export interface ConditionalPickOutcome {
  resolved: { pickId: string; originalRound: number; resolvedRound: number }[];
}

// ── Types ──────────────────────────────────────────────────────────

export interface WeekAdvanceResult {
  week: number;
  phase: LeaguePhase;
  gameResults: GameResult[];
  injuryEvents: { playerId: PlayerId; teamId: TeamId; type: string; severity: string }[];
  recoveryEvents: { playerId: PlayerId; recovered: boolean }[];
  moraleChanges: { playerId: PlayerId; delta: number }[];
  lockerRoomIssues: { teamId: TeamId; severity: string }[];

  // Phase 2 offseason outcomes (populated only during relevant phases)
  coachingChanges?: CoachingCarouselOutcome;
  combineResults?: CombineOutcome;
  freeAgentSignings?: FreeAgencyOutcome;
  draftResults?: DraftOutcome;
  udfaSignings?: UDFAOutcome;
  trainingCampResults?: TrainingCampOutcome;
  rosterCuts?: RosterCutsOutcome;
  conditionalPickResolutions?: ConditionalPickOutcome;
}

export interface OffseasonResult {
  progressionResults: ProgressionResult[];
  holdoutsTriggered: { playerId: PlayerId; teamId: TeamId }[];
  mentorshipEffects: { mentorId: PlayerId; menteeId: PlayerId; boost: number }[];
  coachEvaluations: { coachId: string; score: number }[];
}

export interface OrchestratorConfig {
  positionAverageSalaries?: Record<string, number>;
}

// ── Orchestrator ───────────────────────────────────────────────────

export class SeasonOrchestrator {
  readonly bus: EventBus<GameEventMap>;
  readonly calendar: CalendarEngine;
  readonly draftEngine: DraftEngine;

  private league: League;
  private rng: RNG;
  private config: OrchestratorConfig;

  private weeklyLossTracker: Map<string, number> = new Map();
  private seasonCuts: Map<string, PlayerId[]> = new Map();
  private seasonTrades: Map<string, PlayerId[]> = new Map();

  /** Cached training camp evaluations (keyed by teamId) for use during roster cuts */
  private trainingCampCache: Map<string, TCResult> = new Map();

  constructor(league: League, config: OrchestratorConfig = {}) {
    this.league = league;
    this.bus = new EventBus<GameEventMap>();
    this.calendar = new CalendarEngine();
    this.rng = createLCG(league.seed + league.season * 1000 + league.week);
    this.config = config;
    this.draftEngine = new DraftEngine(this.bus);
    this.wireEventSubscriptions();
  }

  /**
   * Central cross-module event wiring.
   * Each subscription reacts to events from one module by updating state
   * that later feeds into another module's processing.
   */
  private wireEventSubscriptions(): void {
    this.bus.on('GAME_RESULT', (payload) => {
      const losingTeamId = payload.homeScore >= payload.awayScore
        ? payload.awayTeamId
        : payload.homeTeamId;
      const prev = this.weeklyLossTracker.get(losingTeamId as string) ?? 0;
      this.weeklyLossTracker.set(losingTeamId as string, prev + 1);
    });

    this.bus.on('PLAYER_RELEASED', (payload) => {
      const key = payload.teamId as string;
      const prev = this.seasonCuts.get(key) ?? [];
      prev.push(payload.playerId);
      this.seasonCuts.set(key, prev);
    });

    this.bus.on('PLAYER_BREAKOUT', (_payload) => {
      // Breakout flag is tracked on the player's progression result;
      // holdout risk evaluation reads this during offseason processing.
    });
  }

  // ── Week Advance ────────────────────────────────────────────────

  advanceWeek(): WeekAdvanceResult {
    const { season, week } = this.league;
    const currentEvent = this.calendar.getCurrentEvent(season, week);
    const phase = currentEvent.phase;

    const result: WeekAdvanceResult = {
      week,
      phase,
      gameResults: [],
      injuryEvents: [],
      recoveryEvents: [],
      moraleChanges: [],
      lockerRoomIssues: [],
    };

    const weekRng = createLCG(this.league.seed + season * 10000 + week * 100);

    // Phase-specific processing
    switch (phase) {
      case 'coaching_carousel':
        if (this.isPhaseStart(week)) {
          this.processCoachingCarousel(result, weekRng);
        }
        break;

      case 'combine':
        this.processCombine(result, weekRng);
        break;

      case 'free_agency':
      case 'free_agency_tampering':
        if (this.isPhaseStart(week) && phase === 'free_agency') {
          this.processFreeAgency(result, weekRng);
        }
        break;

      case 'draft':
        if (this.isPhaseStart(week)) {
          this.processDraft(result, weekRng);
        }
        break;

      case 'post_draft':
        this.processPostDraft(result, weekRng);
        break;

      case 'training_camp':
        if (this.isPhaseStart(week)) {
          this.processTrainingCamp(result, weekRng);
        }
        break;

      case 'roster_cuts':
        this.processRosterCuts(result, weekRng);
        break;

      case 'pro_bowl':
        this.processSeasonEnd(result, weekRng);
        break;

      default:
        if (this.isGamePhase(phase)) {
          this.processGameWeek(result, weekRng);
        }
        break;
    }

    this.processInjuryRecovery(result, weekRng);
    this.processMoraleUpdates(result, phase);
    this.processLockerRoomChecks(result);

    // Advance week and sync league.phase
    this.league.week = week + 1;
    if (this.league.week > 46) {
      this.league.season++;
      this.league.week = 1;
      this.trainingCampCache.clear();
      this.weeklyLossTracker.clear();
      this.seasonCuts.clear();
      this.seasonTrades.clear();
    }
    const nextEvent = this.calendar.getCurrentEvent(this.league.season, this.league.week);
    this.league.phase = nextEvent.phase;

    return result;
  }

  private isGamePhase(phase: LeaguePhase): boolean {
    return ['preseason', 'regular_season', 'playoffs_wildcard',
      'playoffs_divisional', 'playoffs_conference', 'super_bowl'].includes(phase);
  }

  /** Returns true when `week` is the first week of its calendar phase. */
  private isPhaseStart(week: number): boolean {
    if (week <= 1) return true;
    const prevPhase = this.calendar.getCurrentEvent(this.league.season, week - 1).phase;
    const curPhase = this.calendar.getCurrentEvent(this.league.season, week).phase;
    return prevPhase !== curPhase;
  }

  // ── Phase 1: Game Simulation ───────────────────────────────────

  private processGameWeek(result: WeekAdvanceResult, weekRng: RNG): void {
    const { season, week } = this.league;
    const weekSchedule = this.league.schedule.find(
      s => s.season === season && s.week === this.getGameWeekIndex(week),
    );
    if (!weekSchedule) return;

    for (const game of weekSchedule.games) {
      if (game.isPlayed) continue;

      const homeTeam = this.league.teams.find(t => t.id === game.homeTeamId);
      const awayTeam = this.league.teams.find(t => t.id === game.awayTeamId);
      if (!homeTeam || !awayTeam) continue;

      const homePlayers = this.getTeamPlayers(homeTeam.id);
      const awayPlayers = this.getTeamPlayers(awayTeam.id);
      const homeCoaches = this.getTeamCoaches(homeTeam.id);
      const awayCoaches = this.getTeamCoaches(awayTeam.id);

      const homeStrength = calculateTeamStrength(homeTeam, homePlayers, homeCoaches);
      const awayStrength = calculateTeamStrength(awayTeam, awayPlayers, awayCoaches);

      const leagueWeek: LeagueWeek = { season, week, phase: 'regular' };
      const gameSeed = weekRng() * 2147483647 | 0;

      const gameResult = simulateGame(
        { ...homeStrength, teamId: homeTeam.id },
        { ...awayStrength, teamId: awayTeam.id },
        gameSeed,
        { eventBus: this.bus, week: leagueWeek },
      );

      game.isPlayed = true;
      game.result = { homeScore: gameResult.homeScore, awayScore: gameResult.awayScore };
      result.gameResults.push(gameResult);

      for (const injury of gameResult.injuries) {
        result.injuryEvents.push({
          playerId: injury.playerId,
          teamId: injury.teamId,
          type: injury.type,
          severity: injury.severity,
        });
      }
    }
  }

  private getGameWeekIndex(calendarWeek: number): number {
    // Regular season starts at calendar week 24, so game week 1 = calendar week 24
    return calendarWeek - 23;
  }

  private processInjuryRecovery(result: WeekAdvanceResult, weekRng: RNG): void {
    for (const player of this.league.players) {
      if (!player.injuryStatus) continue;

      const recovery = processWeeklyRecovery(player, weekRng, this.bus);
      result.recoveryEvents.push({
        playerId: player.id,
        recovered: recovery.recovered,
      });

      player.injuryStatus = recovery.updatedStatus;
    }
  }

  private processMoraleUpdates(result: WeekAdvanceResult, phase: LeaguePhase): void {
    if (!this.isGamePhase(phase)) return;

    for (const team of this.league.teams) {
      const losses = this.weeklyLossTracker.get(team.id as string) ?? 0;
      const wins = result.gameResults.filter(
        g => (g.homeTeamId === team.id && g.homeScore > g.awayScore)
          || (g.awayTeamId === team.id && g.awayScore > g.homeScore),
      ).length;

      const teamPlayers = this.getTeamPlayers(team.id);
      for (const player of teamPlayers) {
        const events: MoraleEvent[] = [];
        for (let i = 0; i < wins; i++) events.push({ type: 'win' });
        for (let i = 0; i < losses; i++) events.push({ type: 'loss' });

        const headCoach = team.headCoachId
          ? this.league.coaches.find(c => c.id === team.headCoachId)
          : null;
        if (headCoach) {
          events.push({ type: 'coach_motivation', rating: headCoach.personality.motivation });
        }

        const newMorale = updateMorale(undefined, events);
        const delta = newMorale - 60;
        if (delta !== 0) {
          result.moraleChanges.push({ playerId: player.id, delta });
        }
      }
    }

    this.weeklyLossTracker.clear();
  }

  private processLockerRoomChecks(result: WeekAdvanceResult): void {
    for (const team of this.league.teams) {
      const teamPlayers = this.getTeamPlayers(team.id);
      const cuts = this.seasonCuts.get(team.id as string) ?? [];
      const trades = this.seasonTrades.get(team.id as string) ?? [];
      const losses = team.record.losses;

      const recentEvents: RecentEvents = { losses, cuts, trades };
      const lrResult = checkLockerRoomIssues(team, teamPlayers, recentEvents, this.bus);

      if (lrResult.severity !== 'none') {
        result.lockerRoomIssues.push({
          teamId: team.id,
          severity: lrResult.severity,
        });
      }
    }
  }

  // ── Phase 2: Coaching Carousel ─────────────────────────────────

  private processCoachingCarousel(result: WeekAdvanceResult, weekRng: RNG): void {
    const seed = Math.abs(Math.round(weekRng() * 2147483646));

    const coachingEng = new CoachingEngine(
      this.league.coaches,
      this.league.players,
      this.bus,
      createLCG(seed + 1),
    );

    const carouselEngine = new CoachingHireEngine(
      this.league.coaches,
      this.league.teams,
      this.league.players,
      this.bus,
      coachingEng,
      createLCG(seed),
    );

    const carouselResult = carouselEngine.simulateCoachingCarousel(this.league, seed);

    result.coachingChanges = {
      firings: carouselResult.firings.map(f => ({
        coachId: f.coachId as string,
        teamId: f.teamId,
        reason: f.reason,
      })),
      hirings: carouselResult.hirings.map(h => ({
        coachId: h.coachId as string,
        teamId: h.teamId,
        scheme: h.scheme,
      })),
      schemeChanges: carouselResult.schemeChanges.map(s => ({
        teamId: s.teamId,
        side: s.side,
        oldScheme: s.oldScheme,
        newScheme: s.newScheme,
      })),
    };
  }

  // ── Phase 2: Combine ───────────────────────────────────────────

  private processCombine(result: WeekAdvanceResult, weekRng: RNG): void {
    const { season } = this.league;
    const classSeed = this.league.seed + season * 7777;
    const combineSeed = Math.abs(Math.round(weekRng() * 2147483646));

    this.ensureDraftClassGenerated(classSeed);

    const combine = this.draftEngine.runCombine(season, combineSeed);

    for (const team of this.league.teams) {
      const teamSeed = combineSeed + this.teamIdHash(team.id);
      this.draftEngine.initializeTeamReports(team.id, team.analyticsLevel, teamSeed);
    }

    result.combineResults = {
      prospectCount: this.league.draftProspects.length,
      combineParticipants: combine.participants.length,
    };
  }

  // ── Phase 2: Free Agency ───────────────────────────────────────

  private processFreeAgency(result: WeekAdvanceResult, weekRng: RNG): void {
    const seed = Math.abs(Math.round(weekRng() * 2147483646));
    const { season } = this.league;

    const capEngine = this.createCapEngine();
    const faEngine = new FreeAgencyEngine(
      this.league.players,
      this.league.teams,
      this.league.contracts,
      this.bus,
      capEngine,
      createLCG(seed),
    );

    // Expire contracts that ended last season
    const expiredContracts = this.league.contracts.filter(c => {
      if (c.status !== 'active') return false;
      const realYears = c.yearDetails.filter(y => !y.isVoidYear);
      if (realYears.length === 0) return true;
      const lastSeason = Math.max(...realYears.map(y => y.season));
      return lastSeason < season;
    });

    for (const contract of expiredContracts) {
      contract.status = 'expired';
      const player = this.league.players.find(p => p.id === contract.playerId);
      if (player) {
        player.contract = null;
        const oldTeamId = player.teamId;
        player.teamId = null;
        if (oldTeamId) {
          const team = this.league.teams.find(t => t.id === oldTeamId);
          if (team) {
            team.roster = team.roster.filter(id => id !== player.id);
            team.practiceSquad = team.practiceSquad.filter(id => id !== player.id);
          }
        }
      }
    }

    const releasedIds = this.league.players
      .filter(p => !p.teamId && !p.contract)
      .map(p => p.id);

    const freeAgents = faEngine.generateFreeAgentMarket(expiredContracts, releasedIds);
    const faResult = faEngine.conductFreeAgency(freeAgents, seed);

    for (const signing of faResult.signings) {
      const player = this.league.players.find(p => p.id === signing.playerId);
      const team = this.league.teams.find(t => t.id === signing.teamId);
      if (!player || !team) continue;

      player.teamId = signing.teamId;
      if (!team.roster.includes(player.id)) {
        team.roster.push(player.id);
      }

      const contract = this.createFreeAgentContract(
        signing.playerId,
        signing.teamId,
        signing.contract.totalValue,
        signing.contract.years,
        signing.contract.guaranteed,
        season,
      );
      this.league.contracts.push(contract);
      player.contract = this.toPlayerContractRef(contract, season);
    }

    result.freeAgentSignings = {
      signings: faResult.signings.map(s => ({
        playerId: s.playerId,
        teamId: s.teamId,
        totalValue: s.contract.totalValue,
        years: s.contract.years,
      })),
      unsignedCount: faResult.unsignedPlayers.length,
    };
  }

  // ── Phase 2: Draft ─────────────────────────────────────────────

  /**
   * Run a full 7-round draft in auto-BPA mode. The UI layer can bypass this
   * and call `draftEngine.executePick` directly for user-controlled picks.
   */
  private processDraft(result: WeekAdvanceResult, weekRng: RNG): void {
    const { season } = this.league;

    const classSeed = this.league.seed + season * 7777;
    this.ensureDraftClassGenerated(classSeed);
    this.setupDraftOrder();

    let draftState: DraftState = {
      season,
      currentRound: 1,
      currentPick: 1,
      picks: [],
      availableProspects: this.league.draftProspects.map(p => p.id),
      isComplete: false,
    };

    const seasonPicks = this.league.draftPicks
      .filter(p => p.season === season)
      .sort((a, b) => {
        if (a.round !== b.round) return a.round - b.round;
        return (a.pickInRound ?? 99) - (b.pickInRound ?? 99);
      });

    for (const pick of seasonPicks) {
      if (draftState.isComplete || draftState.availableProspects.length === 0) break;

      const teamId = pick.currentTeamId;
      const prospectId = this.autoBPAPick(draftState, teamId, weekRng);
      if (!prospectId) break;

      draftState = this.draftEngine.executePick(draftState, teamId, prospectId);
      const lastSelection = draftState.picks[draftState.picks.length - 1]!;

      const prospect = this.draftEngine.getProspect(prospectId);
      if (prospect) {
        const player = this.prospectToPlayer(
          prospect, teamId, season,
          lastSelection.round,
          lastSelection.overall - (lastSelection.round - 1) * 32,
        );
        this.league.players.push(player);

        const contract = this.createRookieContract(
          player.id, teamId, season,
          lastSelection.round,
          lastSelection.overall - (lastSelection.round - 1) * 32,
        );
        this.league.contracts.push(contract);
        player.contract = this.toPlayerContractRef(contract, season);

        const team = this.league.teams.find(t => t.id === teamId);
        if (team) team.roster.push(player.id);
      }

      this.league.draftProspects = this.league.draftProspects.filter(p => p.id !== prospectId);
    }

    result.draftResults = {
      selections: draftState.picks.map(p => ({
        playerId: p.playerId,
        teamId: p.teamId,
        round: p.round,
        pick: p.overall - (p.round - 1) * 32,
        overall: p.overall,
      })),
      isComplete: draftState.isComplete,
    };
  }

  // ── Phase 2: Post-Draft (UDFA) ─────────────────────────────────

  private processPostDraft(result: WeekAdvanceResult, weekRng: RNG): void {
    const seed = Math.abs(Math.round(weekRng() * 2147483646));
    const { season } = this.league;

    const remaining = this.league.draftProspects;
    if (remaining.length === 0) {
      result.udfaSignings = { signings: [] };
      return;
    }

    const udfaMap = this.draftEngine.executeUDFASignings(
      remaining,
      this.league.teams,
      seed,
    );

    const signings: UDFAOutcome['signings'] = [];

    for (const [teamId, prospects] of udfaMap) {
      const team = this.league.teams.find(t => t.id === teamId);
      if (!team) continue;

      for (const prospect of prospects) {
        const player = this.prospectToPlayer(prospect, teamId, season, null, null);
        this.league.players.push(player);

        const contract = this.createMinimumContract(player.id, teamId, season);
        this.league.contracts.push(contract);
        player.contract = this.toPlayerContractRef(contract, season);

        team.roster.push(player.id);
        signings.push({ playerId: player.id, teamId });
      }
    }

    this.league.draftProspects = [];
    result.udfaSignings = { signings };
  }

  // ── Phase 2: Training Camp ─────────────────────────────────────

  private processTrainingCamp(result: WeekAdvanceResult, weekRng: RNG): void {
    this.trainingCampCache.clear();
    const teamResults: TrainingCampOutcome['teamResults'] = [];

    for (const team of this.league.teams) {
      const campSeed = Math.abs(Math.round(weekRng() * 2147483646));
      const campRng = createLCG(campSeed);

      const teamPlayers = this.league.players.filter(
        p => team.roster.includes(p.id) || team.practiceSquad.includes(p.id),
      );
      const teamCoaches = this.getTeamCoaches(team.id);

      const campResult = simulateTrainingCamp(
        team, teamPlayers, teamCoaches, campRng, this.bus,
      );

      this.trainingCampCache.set(team.id as string, campResult);

      const contestedBattles = campResult.positionBattles.filter(b => b.isContested).length;
      teamResults.push({
        teamId: team.id,
        evaluationCount: campResult.evaluations.length,
        contestedBattles,
      });
    }

    result.trainingCampResults = { teamResults };
  }

  // ── Phase 2: Roster Cuts (90 → 53) ────────────────────────────

  private processRosterCuts(result: WeekAdvanceResult, weekRng: RNG): void {
    const { season } = this.league;
    const capEngine = this.createCapEngine();
    const rosterMgr = new RosterManager(
      this.league.teams, this.league.players, this.league.contracts,
      this.bus, capEngine,
    );

    const allCuts: RosterCutsOutcome['cuts'] = [];

    for (const team of this.league.teams) {
      const cutSeed = Math.abs(Math.round(weekRng() * 2147483646));
      const cutRng = createLCG(cutSeed);

      const teamPlayers = this.getTeamPlayers(team.id);
      const rosterSize = team.roster.length;
      if (rosterSize <= 53) continue;

      const delegationMode = team.delegationSettings.trainingCampCuts;

      const cachedCamp = this.trainingCampCache.get(team.id as string);
      if (cachedCamp) {
        const cutsResult = generateCutRecommendations(
          team, cachedCamp.evaluations, this.league.players,
          delegationMode, cutRng,
        );
        const recommendations = cutsResult.decision ?? cutsResult.staffSuggestion ?? [];
        const cutsNeeded = Math.max(0, rosterSize - 53);

        for (let i = 0; i < Math.min(cutsNeeded, recommendations.length); i++) {
          const rec = recommendations[i]!;
          try {
            rosterMgr.releasePlayer(rec.playerId, team.id, season);
            allCuts.push({ playerId: rec.playerId, teamId: team.id });
          } catch {
            // Player might already have been removed
          }
        }
      } else {
        // No camp data: fall back to autoTrainingCampCuts
        const cutResult = delegateToStaff(
          delegationMode,
          () => autoTrainingCampCuts(teamPlayers, 53),
        );
        const toCut = cutResult.decision ?? cutResult.staffSuggestion ?? [];
        for (const pid of toCut) {
          try {
            rosterMgr.releasePlayer(pid, team.id, season);
            allCuts.push({ playerId: pid, teamId: team.id });
          } catch {
            // Player might already have been removed
          }
        }
      }
    }

    result.rosterCuts = { cuts: allCuts };
  }

  // ── Phase 2: Season End ────────────────────────────────────────

  private processSeasonEnd(result: WeekAdvanceResult, weekRng: RNG): void {
    const { season } = this.league;

    // Resolve conditional draft picks using season data
    const conditionalPicks = this.league.draftPicks.filter(
      p => p.isConditional && p.conditions.length > 0,
    );

    if (conditionalPicks.length > 0) {
      const seasonData = this.buildConditionalPickData(season);
      const resolved = resolveConditions(conditionalPicks, seasonData);

      const resolutions: ConditionalPickOutcome['resolved'] = [];
      for (const rp of resolved) {
        if (rp.resolvedRound !== null && rp.resolvedRound !== rp.round) {
          // Update the pick in the league
          const original = this.league.draftPicks.find(p => p.id === rp.id);
          if (original) {
            original.resolvedRound = rp.resolvedRound;
            resolutions.push({
              pickId: rp.id as string,
              originalRound: rp.round,
              resolvedRound: rp.resolvedRound,
            });
          }
        }
      }
      result.conditionalPickResolutions = { resolved: resolutions };
    }

    // Emit SEASON_END for other modules to react
    const standings = this.league.teams.map(t => ({
      teamId: t.id,
      wins: t.record.wins,
      losses: t.record.losses,
      ties: t.record.ties,
    }));
    this.bus.emit('SEASON_END', { season, standings });
  }

  // ── Offseason Processing ────────────────────────────────────────

  processOffseason(): OffseasonResult {
    const result: OffseasonResult = {
      progressionResults: [],
      holdoutsTriggered: [],
      mentorshipEffects: [],
      coachEvaluations: [],
    };

    const offseasonRng = createLCG(this.league.seed + this.league.season * 99999);

    this.processPlayerProgression(result, offseasonRng);
    this.processHoldoutChecks(result, offseasonRng);
    this.processMentorships(result);
    this.processCoachEvaluations(result);

    return result;
  }

  private processPlayerProgression(result: OffseasonResult, rng: RNG): void {
    for (const player of this.league.players) {
      if (!player.teamId) continue;

      const team = this.league.teams.find(t => t.id === player.teamId);
      if (!team) continue;

      const headCoach = team.headCoachId
        ? this.league.coaches.find(c => c.id === team.headCoachId)
        : null;
      const devRating = headCoach?.attributes.playerDevelopment ?? 50;

      const ctx: ProgressionContext = {
        coachDevelopmentRating: devRating,
        schemeFitScore: 50,
        snapCountPercentage: 0.5,
        facilitiesLevel: team.facilitiesLevel,
        wasInjured: player.injuryStatus !== null,
      };

      const progResult = processOffseasonProgression(player, ctx, rng, this.bus);
      result.progressionResults.push(progResult);
    }
  }

  private processHoldoutChecks(result: OffseasonResult, rng: RNG): void {
    const avgSalaries = this.config.positionAverageSalaries ?? {};

    for (const player of this.league.players) {
      if (!player.teamId || !player.contract) continue;

      const breakout = result.progressionResults.find(
        p => p.playerId === player.id,
      )?.breakout ?? false;

      const posAvg = avgSalaries[player.position] ?? 5_000_000;
      const risk = evaluateHoldoutRisk(
        player,
        player.contract,
        { breakout },
        posAvg,
      );

      if (risk.probability > 0.1) {
        const holdout = processHoldout(player, risk, rng, this.bus);
        if (holdout.triggered) {
          result.holdoutsTriggered.push({
            playerId: player.id,
            teamId: player.teamId,
          });
        }
      }
    }
  }

  private processMentorships(result: OffseasonResult): void {
    for (const team of this.league.teams) {
      const teamPlayers = this.getTeamPlayers(team.id);
      const veterans = teamPlayers.filter(p => p.experience >= 5 && p.personality.leadership >= 70);
      const rookies = teamPlayers.filter(p => p.experience <= 2 && p.personality.coachability >= 50);

      for (const mentor of veterans) {
        for (const mentee of rookies) {
          if (mentor.position === mentee.position
            || this.samePositionGroup(mentor, mentee)) {
            const mentResult = evaluateMentorship(mentor, mentee, this.bus);
            if (mentResult.eligible && mentResult.skillBoost > 0) {
              result.mentorshipEffects.push({
                mentorId: mentor.id,
                menteeId: mentee.id,
                boost: mentResult.skillBoost,
              });
            }
          }
        }
      }
    }
  }

  private processCoachEvaluations(result: OffseasonResult): void {
    const coaching = new CoachingEngine(
      this.league.coaches,
      this.league.players,
      this.bus,
      this.rng,
    );

    for (const coach of this.league.coaches) {
      if (!coach.teamId) continue;
      const score = coaching.evaluateCoachPerformance(coach.id, this.league.season);
      result.coachEvaluations.push({ coachId: coach.id as string, score });
    }
  }

  // ── GM Delegation Helpers (roster management only) ──────────────

  delegateTrainingCampCuts(teamId: TeamId, rosterLimit = 53): DelegationResult<PlayerId[]> {
    const team = this.league.teams.find(t => t.id === teamId);
    if (!team) throw new Error(`Team ${teamId} not found`);

    const players = this.getTeamPlayers(teamId);
    return delegateToStaff(
      team.delegationSettings.trainingCampCuts,
      () => autoTrainingCampCuts(players, rosterLimit),
    );
  }

  // ── Draft Helpers ──────────────────────────────────────────────

  private ensureDraftClassGenerated(classSeed: number): void {
    if (this.league.draftProspects.length > 0) return;

    const prospects = this.draftEngine.generateDraftClass(this.league.season, classSeed);
    this.league.draftProspects = prospects;
  }

  private setupDraftOrder(): void {
    const order = this.getDraftOrder();
    const seasonPicks = this.league.draftPicks.filter(p => p.season === this.league.season);

    for (const pick of seasonPicks) {
      const orderIdx = order.indexOf(pick.originalTeamId);
      if (orderIdx >= 0) {
        pick.pickInRound = orderIdx + 1;
        pick.overall = (pick.round - 1) * order.length + pick.pickInRound;
      }
    }
  }

  private getDraftOrder(): TeamId[] {
    const records = this.league.teams.map(t => ({
      teamId: t.id,
      winPct: (t.record.wins + t.record.losses + t.record.ties) > 0
        ? t.record.wins / (t.record.wins + t.record.losses + t.record.ties)
        : 0.5,
    }));
    records.sort((a, b) => a.winPct - b.winPct);
    return records.map(r => r.teamId);
  }

  private autoBPAPick(draftState: DraftState, teamId: TeamId, weekRng: RNG): PlayerId | null {
    let bestId: PlayerId | null = null;
    let bestGrade = -1;

    for (const prospectId of draftState.availableProspects) {
      try {
        const entry = this.draftEngine.evaluateProspect(teamId, prospectId);
        if (entry.overallGrade > bestGrade) {
          bestGrade = entry.overallGrade;
          bestId = prospectId;
        }
      } catch {
        // Prospect may not be evaluable — skip
      }
    }

    return bestId ?? draftState.availableProspects[0] ?? null;
  }

  // ── Player / Contract Creation ─────────────────────────────────

  private prospectToPlayer(
    prospect: DraftProspect,
    teamId: TeamId,
    season: number,
    round: number | null,
    pick: number | null,
  ): Player {
    return {
      id: prospect.id,
      firstName: prospect.firstName,
      lastName: prospect.lastName,
      age: prospect.age,
      position: prospect.position,
      secondaryPositions: [],
      teamId,
      jerseyNumber: 0,
      experience: 0,
      college: prospect.college,
      draftYear: round != null ? season : null,
      draftRound: round,
      draftPick: pick,
      physical: prospect.physical,
      personality: prospect.personality,
      hidden: prospect.hidden,
      passing: prospect.passing,
      rushing: prospect.rushing,
      receiving: prospect.receiving,
      blocking: prospect.blocking,
      defense: prospect.defense,
      kicking: prospect.kicking,
      punting: prospect.punting,
      contract: null,
      injuryStatus: null,
      careerStats: {},
      seasonStats: {},
    };
  }

  private createRookieContract(
    pid: PlayerId,
    teamId: TeamId,
    season: number,
    round: number,
    pick: number,
  ): Contract {
    const baseSalary = this.rookieSalary(round, pick);
    const years = 4;
    const signingBonus = round <= 1
      ? Math.round(baseSalary * 2)
      : Math.round(baseSalary * 0.5);
    const prorated = Math.round(signingBonus / years);

    const yearDetails: ContractYear[] = [];
    for (let i = 0; i < years; i++) {
      const guaranteed = i < (round <= 1 ? 4 : 2);
      yearDetails.push({
        year: i + 1,
        season: season + i,
        baseSalary,
        capHit: baseSalary + prorated,
        deadMoney: prorated * (years - i),
        signingBonusProration: prorated,
        rosterBonus: 0,
        optionBonus: 0,
        incentives: [],
        isVoidYear: false,
        guaranteed,
        guaranteeType: guaranteed ? 'full' : 'none',
      });
    }

    return {
      id: contractId(`rookie-${pid}-${season}`),
      playerId: pid,
      teamId,
      status: 'active',
      totalValue: baseSalary * years + signingBonus,
      totalGuaranteed: baseSalary * Math.min(years, round <= 1 ? 4 : 2) + signingBonus,
      years,
      signingBonus,
      yearDetails,
      hasNoTradeClause: false,
      hasNoTagClause: false,
      voidYears: 0,
      signedDate: { season, week: this.league.week },
    };
  }

  private createFreeAgentContract(
    pid: PlayerId,
    teamId: TeamId,
    totalValue: number,
    years: number,
    guaranteed: number,
    season: number,
  ): Contract {
    const apy = Math.round(totalValue / years);
    const signingBonus = Math.round(guaranteed * 0.4);
    const prorated = Math.round(signingBonus / years);

    const yearDetails: ContractYear[] = [];
    for (let i = 0; i < years; i++) {
      const isGuaranteed = i === 0 || (i === 1 && years >= 3);
      yearDetails.push({
        year: i + 1,
        season: season + i,
        baseSalary: apy - prorated,
        capHit: apy,
        deadMoney: prorated * (years - i),
        signingBonusProration: prorated,
        rosterBonus: 0,
        optionBonus: 0,
        incentives: [],
        isVoidYear: false,
        guaranteed: isGuaranteed,
        guaranteeType: isGuaranteed ? 'full' : 'none',
      });
    }

    return {
      id: contractId(`fa-${pid}-${season}`),
      playerId: pid,
      teamId,
      status: 'active',
      totalValue,
      totalGuaranteed: guaranteed,
      years,
      signingBonus,
      yearDetails,
      hasNoTradeClause: false,
      hasNoTagClause: false,
      voidYears: 0,
      signedDate: { season, week: this.league.week },
    };
  }

  private createMinimumContract(
    pid: PlayerId,
    teamId: TeamId,
    season: number,
  ): Contract {
    const minSalary = 750_000;
    const years = 3;
    const yearDetails: ContractYear[] = [];
    for (let i = 0; i < years; i++) {
      yearDetails.push({
        year: i + 1,
        season: season + i,
        baseSalary: minSalary,
        capHit: minSalary,
        deadMoney: 0,
        signingBonusProration: 0,
        rosterBonus: 0,
        optionBonus: 0,
        incentives: [],
        isVoidYear: false,
        guaranteed: i === 0,
        guaranteeType: i === 0 ? 'full' : 'none',
      });
    }

    return {
      id: contractId(`udfa-${pid}-${season}`),
      playerId: pid,
      teamId,
      status: 'active',
      totalValue: minSalary * years,
      totalGuaranteed: minSalary,
      years,
      signingBonus: 0,
      yearDetails,
      hasNoTradeClause: false,
      hasNoTagClause: false,
      voidYears: 0,
      signedDate: { season, week: this.league.week },
    };
  }

  private rookieSalary(round: number, pick: number): number {
    const overall = (round - 1) * 32 + pick;
    if (overall <= 10) return 8_000_000 + (10 - overall) * 2_000_000;
    if (overall <= 32) return 2_000_000 + (32 - overall) * 200_000;
    if (overall <= 64) return 1_200_000 + (64 - overall) * 25_000;
    if (overall <= 100) return 900_000 + (100 - overall) * 10_000;
    return 750_000 + Math.max(0, 224 - overall) * 2_000;
  }

  private toPlayerContractRef(contract: Contract, season: number): PlayerContractRef {
    const currentYear = contract.yearDetails.find(y => y.season === season);
    const yearsRemaining = contract.yearDetails.filter(
      y => y.season >= season && !y.isVoidYear,
    ).length;
    return {
      contractId: contract.id as string,
      yearsRemaining,
      currentYearCapHit: currentYear?.capHit ?? 0,
      totalValue: contract.totalValue,
    };
  }

  private createCapEngine(): CapEngine {
    return new CapEngine(
      this.league.contracts,
      this.league.players,
      this.league.teams,
      [] as FranchiseTag[],
      this.bus,
      createLCG(this.league.seed + this.league.season * 3333),
      this.league.season,
    );
  }

  // ── Conditional Pick Data Builder ──────────────────────────────

  private buildConditionalPickData(season: number): ConditionalSeasonData {
    const proBowlPlayers = new Set<PlayerId>();
    const playerSnapPercentages = new Map<PlayerId, number>();
    const playerGamesStarted = new Map<PlayerId, number>();
    const playoffTeams = new Set<TeamId>();
    const playerStats = new Map<PlayerId, Record<string, number>>();

    const seasonKey = String(season);

    // Playoff teams: those with positive records as heuristic
    for (const team of this.league.teams) {
      if (team.record.wins >= 10) {
        playoffTeams.add(team.id);
      }
    }

    for (const player of this.league.players) {
      const stats = player.seasonStats[seasonKey];
      if (stats) {
        playerStats.set(player.id, stats);
        if (stats['snapPercentage'] !== undefined) {
          playerSnapPercentages.set(player.id, stats['snapPercentage']);
        }
        if (stats['gamesStarted'] !== undefined) {
          playerGamesStarted.set(player.id, stats['gamesStarted']);
        }
      }
    }

    // Awards from this season
    for (const award of this.league.awards) {
      if (award.season === season && award.award === 'PRO_BOWL') {
        proBowlPlayers.add(award.playerId);
      }
    }

    return {
      proBowlPlayers,
      playerSnapPercentages,
      playerGamesStarted,
      playoffTeams,
      playerStats,
    };
  }

  // ── Helpers ─────────────────────────────────────────────────────

  private getTeamPlayers(teamId: TeamId): Player[] {
    return this.league.players.filter(p => p.teamId === teamId);
  }

  private getTeamCoaches(teamId: TeamId): Coach[] {
    return this.league.coaches.filter(c => c.teamId === teamId);
  }

  private samePositionGroup(a: Player, b: Player): boolean {
    const OFFENSE = new Set(['QB', 'RB', 'FB', 'WR', 'TE', 'LT', 'LG', 'C', 'RG', 'RT']);
    const DEFENSE = new Set(['DE', 'DT', 'NT', 'OLB', 'ILB', 'MLB', 'CB', 'FS', 'SS']);
    return (OFFENSE.has(a.position) && OFFENSE.has(b.position))
      || (DEFENSE.has(a.position) && DEFENSE.has(b.position));
  }

  private teamIdHash(id: TeamId): number {
    const str = id as string;
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      hash = ((hash << 5) - hash + str.charCodeAt(i)) | 0;
    }
    return Math.abs(hash);
  }

  // ── Accessors ───────────────────────────────────────────────────

  getLeague(): League {
    return this.league;
  }
}
