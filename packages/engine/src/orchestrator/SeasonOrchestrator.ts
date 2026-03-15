/**
 * SeasonOrchestrator: wires all Phase 1 engine modules together through
 * the event bus and provides a single `advanceWeek` / `processOffseason`
 * surface for the application layer.
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

// ── Types ──────────────────────────────────────────────────────────

export interface WeekAdvanceResult {
  week: number;
  phase: LeaguePhase;
  gameResults: GameResult[];
  injuryEvents: { playerId: PlayerId; teamId: TeamId; type: string; severity: string }[];
  recoveryEvents: { playerId: PlayerId; recovered: boolean }[];
  moraleChanges: { playerId: PlayerId; delta: number }[];
  lockerRoomIssues: { teamId: TeamId; severity: string }[];
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

  private league: League;
  private rng: RNG;
  private config: OrchestratorConfig;

  private weeklyLossTracker: Map<string, number> = new Map();
  private seasonCuts: Map<string, PlayerId[]> = new Map();
  private seasonTrades: Map<string, PlayerId[]> = new Map();

  constructor(league: League, config: OrchestratorConfig = {}) {
    this.league = league;
    this.bus = new EventBus<GameEventMap>();
    this.calendar = new CalendarEngine();
    this.rng = createLCG(league.seed + league.season * 1000 + league.week);
    this.config = config;
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

    if (this.isGamePhase(phase)) {
      this.processGameWeek(result, weekRng);
    }

    this.processInjuryRecovery(result, weekRng);
    this.processMoraleUpdates(result, phase);
    this.processLockerRoomChecks(result);

    this.league.week = week + 1;

    return result;
  }

  private isGamePhase(phase: LeaguePhase): boolean {
    return ['preseason', 'regular_season', 'playoffs_wildcard',
      'playoffs_divisional', 'playoffs_conference', 'super_bowl'].includes(phase);
  }

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

  // ── Accessors ───────────────────────────────────────────────────

  getLeague(): League {
    return this.league;
  }
}
