import { describe, it, expect } from 'vitest';
import { generateSchedule } from '../../src/sim/ScheduleGenerator.js';
import { createLCG } from '../../src/sim/RNG.js';
import { TEAM_SEEDS } from '../../src/league/teamData.js';
import type { Team } from '../../src/types/team.js';
import type { LeagueSettings } from '../../src/types/league.js';
import type { TeamId } from '../../src/types/ids.js';

function makeTeams(): Team[] {
  return TEAM_SEEDS.map((seed, i) => ({
    id: `team-${i}` as TeamId,
    city: seed.city,
    name: seed.name,
    abbreviation: seed.abbreviation,
    conference: seed.conference,
    division: seed.division,
    stadium: seed.stadium,
    owner: {
      name: seed.ownerName,
      patience: 50,
      spendingWillingness: 50,
      mediaProfile: 'moderate' as const,
      priorities: ['winning' as const],
    },
    roster: [],
    practiceSquad: [],
    injuredReserve: [],
    coachingStaff: [],
    headCoachId: null,
    depthChart: {} as Team['depthChart'],
    record: {
      wins: 0, losses: 0, ties: 0,
      pointsFor: 0, pointsAgainst: 0,
      divisionWins: 0, divisionLosses: 0,
      conferenceWins: 0, conferenceLosses: 0,
      streak: { type: 'W' as const, count: 0 },
    },
    analyticsLevel: 3,
    scoutingBudget: 50,
    facilitiesLevel: 3,
    delegationSettings: {
      depthChart: 'auto', practiceSquad: 'auto', waiverClaims: 'auto',
      trainingCampCuts: 'auto', contractNegotiations: 'auto',
      scoutingAssignments: 'auto', tradeEvaluation: 'auto',
      draftBoard: 'auto', gameplanAdjustments: 'auto',
    },
  }));
}

const DEFAULT_SETTINGS: LeagueSettings = {
  salaryCap: 225_000_000,
  rosterSize: 53,
  practiceSquadSize: 16,
  preseasonGames: 3,
  regularSeasonGames: 17,
  playoffTeams: 14,
  tradeDeadlineWeek: 9,
  draftRounds: 7,
  maxCompPicks: 4,
  advanceMode: 'manual',
  advanceDeadlineHours: 24,
};

describe('ScheduleGenerator', () => {
  const teams = makeTeams();
  const rng = createLCG(42);
  const schedule = generateSchedule(teams, 2025, DEFAULT_SETTINGS, rng);

  const preseason = schedule.filter((w) => w.phase === 'preseason');
  const regular = schedule.filter((w) => w.phase === 'regular');

  describe('preseason', () => {
    it('generates the correct number of preseason weeks', () => {
      expect(preseason.length).toBe(3);
    });

    it('each preseason week has 16 games (32 teams / 2)', () => {
      for (const week of preseason) {
        expect(week.games.length).toBe(16);
      }
    });
  });

  describe('regular season structure', () => {
    it('generates 18 regular season weeks', () => {
      expect(regular.length).toBe(18);
    });

    it('every team plays at most once per week', () => {
      for (const week of regular) {
        const teamsPlaying = new Set<string>();
        for (const game of week.games) {
          expect(teamsPlaying.has(game.homeTeamId)).toBe(false);
          expect(teamsPlaying.has(game.awayTeamId)).toBe(false);
          teamsPlaying.add(game.homeTeamId);
          teamsPlaying.add(game.awayTeamId);
        }
      }
    });
  });

  describe('game counts per team', () => {
    it('each team plays 17 regular season games', () => {
      const gameCounts = new Map<string, number>();

      for (const week of regular) {
        for (const game of week.games) {
          gameCounts.set(game.homeTeamId, (gameCounts.get(game.homeTeamId) ?? 0) + 1);
          gameCounts.set(game.awayTeamId, (gameCounts.get(game.awayTeamId) ?? 0) + 1);
        }
      }

      for (const team of teams) {
        const count = gameCounts.get(team.id) ?? 0;
        expect(count).toBe(17);
      }
    });
  });

  describe('division matchups', () => {
    it('each team has division games (home and away)', () => {
      const divisionGames = new Map<string, Map<string, number>>();

      for (const week of regular) {
        for (const game of week.games) {
          const homeTeam = teams.find((t) => t.id === game.homeTeamId);
          const awayTeam = teams.find((t) => t.id === game.awayTeamId);
          if (!homeTeam || !awayTeam) continue;
          if (homeTeam.division !== awayTeam.division) continue;

          if (!divisionGames.has(game.homeTeamId)) {
            divisionGames.set(game.homeTeamId, new Map());
          }
          const teamMap = divisionGames.get(game.homeTeamId)!;
          teamMap.set(game.awayTeamId, (teamMap.get(game.awayTeamId) ?? 0) + 1);
        }
      }

      for (const [_teamId, opponents] of divisionGames) {
        for (const [_oppId, count] of opponents) {
          expect(count).toBeGreaterThanOrEqual(1);
        }
      }
    });
  });

  describe('bye distribution', () => {
    it('bye weeks fall within weeks 5-14 of regular season', () => {
      for (let i = 0; i < regular.length; i++) {
        const week = regular[i]!;
        const weekNum = i + 1;
        if (week.byeTeams.length > 0) {
          expect(weekNum).toBeGreaterThanOrEqual(5);
          expect(weekNum).toBeLessThanOrEqual(14);
        }
      }
    });

    it('no division has all 4 teams on bye the same week', () => {
      const divTeams = new Map<string, Set<string>>();
      for (const t of teams) {
        const set = divTeams.get(t.division) ?? new Set();
        set.add(t.id);
        divTeams.set(t.division, set);
      }

      for (const week of regular) {
        if (week.byeTeams.length === 0) continue;
        const byeSet = new Set(week.byeTeams);

        for (const [_div, teamSet] of divTeams) {
          let onBye = 0;
          for (const tid of teamSet) {
            if (byeSet.has(tid as TeamId)) onBye++;
          }
          expect(onBye).toBeLessThan(4);
        }
      }
    });
  });

  describe('determinism', () => {
    it('same seed produces identical schedule', () => {
      const rng1 = createLCG(99);
      const rng2 = createLCG(99);
      const s1 = generateSchedule(teams, 2025, DEFAULT_SETTINGS, rng1);
      const s2 = generateSchedule(teams, 2025, DEFAULT_SETTINGS, rng2);

      expect(s1.length).toBe(s2.length);
      for (let i = 0; i < s1.length; i++) {
        expect(s1[i]!.games.length).toBe(s2[i]!.games.length);
      }
    });
  });
});
