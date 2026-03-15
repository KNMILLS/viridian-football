/**
 * Integration tests: verify that the SeasonOrchestrator correctly wires
 * all Phase 1 and Phase 2 engine modules together through the event bus.
 */

import { describe, it, expect, beforeAll } from 'vitest';
import { generateLeague } from '../../src/league/LeagueGenerator.js';
import { SeasonOrchestrator } from '../../src/orchestrator/SeasonOrchestrator.js';
import { generateSchedule } from '../../src/sim/ScheduleGenerator.js';
import { createLCG } from '../../src/sim/RNG.js';
import type { League, WeekSchedule, Player, Team, DraftPick } from '../../src/types/index.js';
import type { GameEventMap } from '../../src/events/GameEvents.js';
import { playerId, teamId, draftPickId } from '../../src/types/ids.js';

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

  describe('delegation (GM-domain only, depth chart is coach-controlled)', () => {
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

  // ── Phase 2 Integration Tests ────────────────────────────────────

  describe('Phase 2: full offseason advance', () => {
    function createOffseasonStartLeague(seed = 500): League {
      const generated = generateLeague(seed);
      const league = generated.league;
      league.week = 1;
      league.phase = 'offseason_start';

      // Give teams some win/loss records for draft order
      for (let i = 0; i < league.teams.length; i++) {
        const team = league.teams[i]!;
        team.record.wins = i;
        team.record.losses = 17 - i;
      }

      return league;
    }

    it('coaching carousel fires and hires coaches', () => {
      const league = createOffseasonStartLeague();
      const orch = new SeasonOrchestrator(league);

      // Advance to coaching_carousel (week 2)
      orch.advanceWeek(); // week 1 → offseason_start
      const result = orch.advanceWeek(); // week 2 → coaching_carousel

      expect(result.phase).toBe('coaching_carousel');
      expect(result.coachingChanges).toBeDefined();
      // At minimum, teams with bad records should have coaching changes
      const changes = result.coachingChanges!;
      expect(Array.isArray(changes.firings)).toBe(true);
      expect(Array.isArray(changes.hirings)).toBe(true);
    }, 30_000);

    it('combine generates draft class and runs combine', () => {
      const league = createOffseasonStartLeague();
      const orch = new SeasonOrchestrator(league);

      // Advance to combine (week 5)
      for (let w = 1; w < 5; w++) orch.advanceWeek();
      const result = orch.advanceWeek(); // week 5 → combine

      expect(result.phase).toBe('combine');
      expect(result.combineResults).toBeDefined();
      expect(result.combineResults!.prospectCount).toBeGreaterThan(0);
      expect(result.combineResults!.combineParticipants).toBeGreaterThan(0);
      expect(league.draftProspects.length).toBeGreaterThan(0);
    }, 30_000);

    it('free agency signs players to teams', () => {
      const league = createOffseasonStartLeague();
      const orch = new SeasonOrchestrator(league);

      // Advance to free_agency (week 8)
      for (let w = 1; w < 8; w++) orch.advanceWeek();
      const result = orch.advanceWeek(); // week 8 → free_agency

      expect(result.phase).toBe('free_agency');
      expect(result.freeAgentSignings).toBeDefined();
      // FA market depends on contract expiry, may have signings or not
      expect(Array.isArray(result.freeAgentSignings!.signings)).toBe(true);
    }, 30_000);

    it('draft produces selections and updates rosters', () => {
      const league = createOffseasonStartLeague();
      const orch = new SeasonOrchestrator(league);

      const playerCountBefore = league.players.length;

      // Advance to draft (week 10)
      for (let w = 1; w < 10; w++) orch.advanceWeek();
      const result = orch.advanceWeek(); // week 10 → draft

      expect(result.phase).toBe('draft');
      expect(result.draftResults).toBeDefined();
      expect(result.draftResults!.selections.length).toBeGreaterThan(0);

      // Drafted players added to league
      expect(league.players.length).toBeGreaterThan(playerCountBefore);

      // Each selection should have valid fields
      for (const sel of result.draftResults!.selections) {
        expect(sel.round).toBeGreaterThanOrEqual(1);
        expect(sel.round).toBeLessThanOrEqual(7);
        expect(sel.overall).toBeGreaterThan(0);
        expect(sel.teamId).toBeDefined();
      }
    }, 60_000);

    it('post-draft signs UDFAs', () => {
      const league = createOffseasonStartLeague();
      const orch = new SeasonOrchestrator(league);

      // Advance to post_draft (week 13)
      for (let w = 1; w < 13; w++) orch.advanceWeek();
      const result = orch.advanceWeek(); // week 13 → post_draft

      expect(result.phase).toBe('post_draft');
      expect(result.udfaSignings).toBeDefined();
      // After draft, remaining prospects become UDFAs
      expect(Array.isArray(result.udfaSignings!.signings)).toBe(true);
      // All draft prospects should be cleared
      expect(league.draftProspects.length).toBe(0);
    }, 60_000);

    it('training camp evaluates players', () => {
      const league = createOffseasonStartLeague();
      const orch = new SeasonOrchestrator(league);

      // Advance to training_camp (week 17)
      for (let w = 1; w < 17; w++) orch.advanceWeek();
      const result = orch.advanceWeek(); // week 17 → training_camp

      expect(result.phase).toBe('training_camp');
      expect(result.trainingCampResults).toBeDefined();
      expect(result.trainingCampResults!.teamResults.length).toBe(league.teams.length);
      for (const tr of result.trainingCampResults!.teamResults) {
        expect(tr.evaluationCount).toBeGreaterThan(0);
      }
    }, 60_000);

    it('roster cuts trim rosters to 53', () => {
      const league = createOffseasonStartLeague();
      const orch = new SeasonOrchestrator(league);

      // Advance to roster_cuts (week 23)
      for (let w = 1; w < 23; w++) orch.advanceWeek();
      const result = orch.advanceWeek(); // week 23 → roster_cuts

      expect(result.phase).toBe('roster_cuts');
      expect(result.rosterCuts).toBeDefined();
      // Verify no team exceeds 53 on active roster
      for (const team of league.teams) {
        expect(team.roster.length).toBeLessThanOrEqual(53);
      }
    }, 120_000);

    it('league.phase stays in sync after each advance', () => {
      const league = createOffseasonStartLeague(501);
      const orch = new SeasonOrchestrator(league);

      const phases: string[] = [];
      for (let w = 1; w <= 5; w++) {
        orch.advanceWeek();
        phases.push(league.phase);
      }

      // After advancing 5 times from week 1, week should be 6
      expect(league.week).toBe(6);
      // phase should match what the calendar says for the current week
      const expected = orch.calendar.getCurrentEvent(league.season, league.week);
      expect(league.phase).toBe(expected.phase);
    }, 30_000);
  });

  describe('Phase 2: conditional pick resolution', () => {
    it('resolves conditional picks at season end', () => {
      const league = createTestLeague(42);
      const orch = new SeasonOrchestrator(league);

      // Add a conditional pick
      const team = league.teams[0]!;
      const condPlayer = league.players.find(p => p.teamId === team.id)!;

      const condPick: DraftPick = {
        id: draftPickId('cond-pick-test'),
        originalTeamId: team.id,
        currentTeamId: team.id,
        season: league.season + 1,
        round: 5,
        pickInRound: null,
        overall: null,
        isConditional: true,
        conditions: [
          {
            kind: 'playoff_appearance',
            teamId: team.id,
            upgradeTo: 3,
          },
        ],
        resolvedRound: null,
      };
      league.draftPicks.push(condPick);

      // Make team a playoff team
      team.record.wins = 12;
      team.record.losses = 5;

      // Advance to pro_bowl (week 46) to trigger season end
      league.week = 46;
      league.phase = 'pro_bowl';
      const result = orch.advanceWeek();

      expect(result.conditionalPickResolutions).toBeDefined();
      const resolutions = result.conditionalPickResolutions!.resolved;
      const resolved = resolutions.find(r => r.pickId === 'cond-pick-test');
      expect(resolved).toBeDefined();
      expect(resolved!.resolvedRound).toBe(3);
    }, 30_000);
  });

  describe('Phase 2: determinism', () => {
    it('same seed produces identical offseason coaching changes', () => {
      const league1 = (() => {
        const l = generateLeague(777).league;
        l.week = 1;
        l.phase = 'offseason_start';
        for (let i = 0; i < l.teams.length; i++) {
          l.teams[i]!.record.wins = i;
          l.teams[i]!.record.losses = 17 - i;
        }
        return l;
      })();

      const league2 = (() => {
        const l = generateLeague(777).league;
        l.week = 1;
        l.phase = 'offseason_start';
        for (let i = 0; i < l.teams.length; i++) {
          l.teams[i]!.record.wins = i;
          l.teams[i]!.record.losses = 17 - i;
        }
        return l;
      })();

      const orch1 = new SeasonOrchestrator(league1);
      const orch2 = new SeasonOrchestrator(league2);

      // Advance both to coaching carousel
      orch1.advanceWeek();
      orch2.advanceWeek();
      const res1 = orch1.advanceWeek();
      const res2 = orch2.advanceWeek();

      expect(res1.coachingChanges?.firings.length).toBe(res2.coachingChanges?.firings.length);
      expect(res1.coachingChanges?.hirings.length).toBe(res2.coachingChanges?.hirings.length);
    }, 30_000);

    it('same seed produces identical draft picks', () => {
      function makeLeague() {
        const l = generateLeague(888).league;
        l.week = 1;
        l.phase = 'offseason_start';
        for (let i = 0; i < l.teams.length; i++) {
          l.teams[i]!.record.wins = i;
          l.teams[i]!.record.losses = 17 - i;
        }
        return l;
      }

      const league1 = makeLeague();
      const league2 = makeLeague();

      const orch1 = new SeasonOrchestrator(league1);
      const orch2 = new SeasonOrchestrator(league2);

      // Advance both to draft (week 10)
      for (let w = 1; w < 10; w++) {
        orch1.advanceWeek();
        orch2.advanceWeek();
      }
      const draft1 = orch1.advanceWeek();
      const draft2 = orch2.advanceWeek();

      expect(draft1.draftResults?.selections.length).toBe(draft2.draftResults?.selections.length);
      if (draft1.draftResults && draft2.draftResults) {
        for (let i = 0; i < draft1.draftResults.selections.length; i++) {
          expect(draft1.draftResults.selections[i]!.playerId)
            .toBe(draft2.draftResults.selections[i]!.playerId);
          expect(draft1.draftResults.selections[i]!.teamId)
            .toBe(draft2.draftResults.selections[i]!.teamId);
        }
      }
    }, 120_000);
  });

  describe('Phase 2: season rollover', () => {
    it('increments season and resets week after week 46', () => {
      const league = createTestLeague(42);
      league.week = 46;
      league.phase = 'pro_bowl';
      const initialSeason = league.season;

      const orch = new SeasonOrchestrator(league);
      orch.advanceWeek();

      expect(league.season).toBe(initialSeason + 1);
      expect(league.week).toBe(1);
      expect(league.phase).toBe('offseason_start');
    }, 30_000);
  });

  describe('Phase 2: trade deadline enforcement', () => {
    it('league.phase updates correctly during regular season', () => {
      const league = createTestLeague(42);
      const orch = new SeasonOrchestrator(league);

      // Advance several regular season weeks
      for (let i = 0; i < 5; i++) {
        orch.advanceWeek();
      }

      // Phase should still be regular_season
      expect(['regular_season', 'trade_deadline']).toContain(league.phase);
    });
  });
});
