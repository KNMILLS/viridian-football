/**
 * Integration tests: verify that the SeasonOrchestrator correctly wires
 * all Phase 1 engine modules together through the event bus.
 */

import { describe, it, expect, beforeAll } from 'vitest';
import { generateLeague } from '../../src/league/LeagueGenerator.js';
import { SeasonOrchestrator } from '../../src/orchestrator/SeasonOrchestrator.js';
import { generateSchedule } from '../../src/sim/ScheduleGenerator.js';
import { createLCG } from '../../src/sim/RNG.js';
import type { League, WeekSchedule, Player, Team } from '../../src/types/index.js';
import type { GameEventMap } from '../../src/events/GameEvents.js';

/**
 * Cached schedule shared by all tests using the same seed to avoid
 * regenerating the expensive schedule for every test case.
 */
const scheduleCache = new Map<number, WeekSchedule[]>();

function createTestLeague(seed = 42): League {
  const generated = generateLeague(seed);
  const league = generated.league;

  let schedule = scheduleCache.get(seed);
  if (!schedule) {
    const rng = createLCG(seed + 777);
    schedule = generateSchedule(league.teams, league.season, league.settings, rng);
    scheduleCache.set(seed, schedule);
  }
  // Deep-clone schedule so tests can mutate isPlayed without cross-contamination
  league.schedule = JSON.parse(JSON.stringify(schedule));

  league.week = 24;
  league.phase = 'regular_season';
  return league;
}

describe('SeasonOrchestrator', () => {
  // Pre-warm the schedule cache once
  beforeAll(() => {
    createTestLeague(42);
    createTestLeague(999);
    createTestLeague(111);
    createTestLeague(222);
    createTestLeague(123);
  }, 120_000);

  describe('construction', () => {
    it('creates a shared event bus and calendar', () => {
      const league = createTestLeague();
      const orchestrator = new SeasonOrchestrator(league);
      expect(orchestrator.bus).toBeDefined();
      expect(orchestrator.calendar).toBeDefined();
      expect(orchestrator.getLeague()).toBe(league);
    });
  });

  describe('advanceWeek during regular season', () => {
    it('returns a result with the correct week and phase', () => {
      const league = createTestLeague();
      const orch = new SeasonOrchestrator(league);
      const result = orch.advanceWeek();
      expect(result.week).toBe(24);
      expect(result.phase).toBe('regular_season');
    });

    it('simulates games and produces game results', () => {
      const league = createTestLeague();
      const orch = new SeasonOrchestrator(league);
      const result = orch.advanceWeek();
      expect(result.gameResults.length).toBeGreaterThan(0);
      for (const gr of result.gameResults) {
        expect(gr.homeScore).toBeGreaterThanOrEqual(0);
        expect(gr.awayScore).toBeGreaterThanOrEqual(0);
        expect(gr.playByPlay.length).toBeGreaterThan(0);
      }
    });

    it('advances the league week by 1', () => {
      const league = createTestLeague();
      const orch = new SeasonOrchestrator(league);
      expect(league.week).toBe(24);
      orch.advanceWeek();
      expect(league.week).toBe(25);
    });

    it('marks games as played in the schedule', () => {
      const league = createTestLeague();
      const orch = new SeasonOrchestrator(league);
      orch.advanceWeek();
      const weekSchedule = league.schedule.find(s => s.week === 1);
      if (weekSchedule) {
        const playedGames = weekSchedule.games.filter(g => g.isPlayed);
        expect(playedGames.length).toBeGreaterThan(0);
        for (const g of playedGames) {
          expect(g.result).toBeDefined();
        }
      }
    });
  });

  describe('event bus cross-module wiring', () => {
    it('emits GAME_RESULT events during game simulation', () => {
      const league = createTestLeague();
      const orch = new SeasonOrchestrator(league);
      const gameResults: GameEventMap['GAME_RESULT'][] = [];
      orch.bus.on('GAME_RESULT', (payload) => {
        gameResults.push(payload);
      });
      orch.advanceWeek();
      expect(gameResults.length).toBeGreaterThan(0);
    });

    it('tracks losses for morale updates via event bus', () => {
      const league = createTestLeague();
      const orch = new SeasonOrchestrator(league);
      const result = orch.advanceWeek();
      expect(result.moraleChanges.length).toBeGreaterThan(0);
    });

    it('processes injury recovery each week', () => {
      const league = createTestLeague();
      const player = league.players[0]!;
      player.injuryStatus = {
        type: 'ankle sprain',
        severity: 'minor',
        weeksRemaining: 2,
        performancePenalty: 0.9,
        isRecurring: false,
      };
      const orch = new SeasonOrchestrator(league);
      const result = orch.advanceWeek();
      const recoveryEvent = result.recoveryEvents.find(r => r.playerId === player.id);
      expect(recoveryEvent).toBeDefined();
    });

    it('checks locker room issues each week', () => {
      const league = createTestLeague();
      const team = league.teams[0]!;
      team.record.losses = 8;
      const teamPlayers = league.players.filter(p => p.teamId === team.id);
      for (let i = 0; i < Math.min(3, teamPlayers.length); i++) {
        teamPlayers[i]!.personality.ego = 90;
      }
      const orch = new SeasonOrchestrator(league);
      const result = orch.advanceWeek();
      const teamIssue = result.lockerRoomIssues.find(lr => lr.teamId === team.id);
      expect(teamIssue).toBeDefined();
      expect(['minor', 'moderate', 'major']).toContain(teamIssue!.severity);
    });
  });

  describe('offseason processing', () => {
    function createOffseasonLeague(): League {
      const league = createTestLeague(123);
      league.week = 1;
      league.phase = 'offseason_start';
      return league;
    }

    it('processes player progression for all rostered players', () => {
      const league = createOffseasonLeague();
      const orch = new SeasonOrchestrator(league);
      const result = orch.processOffseason();
      expect(result.progressionResults.length).toBeGreaterThan(0);
      for (const pr of result.progressionResults) {
        expect(pr.playerId).toBeDefined();
        expect(typeof pr.breakout).toBe('boolean');
        expect(typeof pr.decline).toBe('boolean');
      }
    });

    it('evaluates coach performance', () => {
      const league = createOffseasonLeague();
      const orch = new SeasonOrchestrator(league);
      const result = orch.processOffseason();
      expect(result.coachEvaluations.length).toBeGreaterThan(0);
      for (const ce of result.coachEvaluations) {
        expect(typeof ce.score).toBe('number');
        expect(ce.score).toBeGreaterThanOrEqual(0);
        expect(ce.score).toBeLessThanOrEqual(100);
      }
    });

    it('emits RATING_CHANGED events during progression', () => {
      const league = createOffseasonLeague();
      const orch = new SeasonOrchestrator(league);
      const ratingChanges: GameEventMap['RATING_CHANGED'][] = [];
      orch.bus.on('RATING_CHANGED', (payload) => {
        ratingChanges.push(payload);
      });
      orch.processOffseason();
      expect(ratingChanges.length).toBeGreaterThan(0);
    });

    it('mentorship effects have correct structure', () => {
      const league = createOffseasonLeague();
      // Set up a guaranteed mentorship pair on team 0
      const team = league.teams[0]!;
      const teamPlayers = league.players.filter(p => p.teamId === team.id);
      const veteran = teamPlayers.find(p => p.experience >= 5);
      if (veteran) {
        veteran.personality.leadership = 90;
        const rookie = teamPlayers.find(
          p => p.experience <= 2 && p.id !== veteran.id && p.position === veteran.position,
        );
        if (rookie) {
          rookie.personality.coachability = 85;
        }
      }

      const orch = new SeasonOrchestrator(league);
      const result = orch.processOffseason();
      for (const me of result.mentorshipEffects) {
        expect(me.mentorId).toBeDefined();
        expect(me.menteeId).toBeDefined();
        expect(me.boost).toBeGreaterThan(0);
      }
    });
  });

  describe('delegation', () => {
    it('delegateDepthChart returns depth chart in auto mode', () => {
      const league = createTestLeague();
      const team = league.teams[0]!;
      team.delegationSettings.depthChart = 'auto';
      const orch = new SeasonOrchestrator(league);
      const result = orch.delegateDepthChart(team.id);
      expect(result.autoApplied).toBe(true);
      expect(result.decision).toBeDefined();
    });

    it('delegateDepthChart returns needsUserInput in manual mode', () => {
      const league = createTestLeague();
      const team = league.teams[0]!;
      team.delegationSettings.depthChart = 'manual';
      const orch = new SeasonOrchestrator(league);
      const result = orch.delegateDepthChart(team.id);
      expect(result.needsUserInput).toBe(true);
      expect(result.staffSuggestion).toBeDefined();
    });

    it('delegateTrainingCampCuts identifies players to cut', () => {
      const league = createTestLeague();
      const team = league.teams[0]!;
      team.delegationSettings.trainingCampCuts = 'auto';
      const orch = new SeasonOrchestrator(league);
      const result = orch.delegateTrainingCampCuts(team.id, 53);
      expect(result.autoApplied).toBe(true);
      expect(Array.isArray(result.decision)).toBe(true);
    });
  });

  describe('determinism', () => {
    it('same seed produces identical week advance results', () => {
      const league1 = createTestLeague(999);
      const orch1 = new SeasonOrchestrator(league1);
      const advance1 = orch1.advanceWeek();

      const league2 = createTestLeague(999);
      const orch2 = new SeasonOrchestrator(league2);
      const advance2 = orch2.advanceWeek();

      expect(advance1.gameResults.length).toBe(advance2.gameResults.length);
      for (let i = 0; i < advance1.gameResults.length; i++) {
        expect(advance1.gameResults[i]!.homeScore).toBe(advance2.gameResults[i]!.homeScore);
        expect(advance1.gameResults[i]!.awayScore).toBe(advance2.gameResults[i]!.awayScore);
      }
    });

    it('different seeds produce different results', () => {
      const league1 = createTestLeague(111);
      const orch1 = new SeasonOrchestrator(league1);
      const advance1 = orch1.advanceWeek();

      const league2 = createTestLeague(222);
      const orch2 = new SeasonOrchestrator(league2);
      const advance2 = orch2.advanceWeek();

      const scoresMatch = advance1.gameResults.every((g, i) =>
        g.homeScore === advance2.gameResults[i]?.homeScore
        && g.awayScore === advance2.gameResults[i]?.awayScore,
      );
      expect(scoresMatch).toBe(false);
    });
  });

  describe('multi-week simulation', () => {
    it('can advance multiple weeks without errors', () => {
      const league = createTestLeague();
      const orch = new SeasonOrchestrator(league);
      for (let i = 0; i < 5; i++) {
        const result = orch.advanceWeek();
        expect(result.week).toBe(24 + i);
        expect(result.gameResults.length).toBeGreaterThanOrEqual(0);
      }
      expect(league.week).toBe(29);
    });
  });
});
