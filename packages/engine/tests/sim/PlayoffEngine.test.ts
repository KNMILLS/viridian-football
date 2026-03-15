import { describe, it, expect } from 'vitest';
import { seedPlayoffTeams, simulatePlayoffRound } from '../../src/sim/PlayoffEngine.js';
import type { PlayoffMatchup } from '../../src/sim/PlayoffEngine.js';
import type { DivisionStandings, TeamStanding } from '../../src/types/league.js';
import type { Division, Conference } from '../../src/types/team.js';
import type { TeamId } from '../../src/types/ids.js';
import type { TeamStrength } from '../../src/sim/TeamStrength.js';
import { createLCG } from '../../src/sim/RNG.js';
import { EventBus } from '../../src/events/EventBus.js';
import type { GameEventMap } from '../../src/events/GameEvents.js';

function makeStanding(
  teamId: string,
  wins: number,
  losses: number,
  ties = 0,
  overrides: Partial<TeamStanding> = {},
): TeamStanding {
  const total = wins + losses + ties;
  return {
    teamId: teamId as TeamId,
    wins,
    losses,
    ties,
    winPercentage: total > 0 ? wins / total : 0,
    pointsFor: wins * 25 + ties * 15,
    pointsAgainst: losses * 25 + ties * 15,
    divisionRecord: { wins: Math.floor(wins / 3), losses: Math.floor(losses / 3), ties: 0 },
    conferenceRecord: { wins: Math.floor(wins * 0.7), losses: Math.floor(losses * 0.7), ties: 0 },
    streak: { type: wins > losses ? 'W' : 'L', count: 2 },
    playoffSeed: null,
    ...overrides,
  };
}

function makeStandings(): DivisionStandings[] {
  const divisions: [Division, Conference][] = [
    ['AFC East', 'AFC'], ['AFC North', 'AFC'], ['AFC South', 'AFC'], ['AFC West', 'AFC'],
    ['NFC East', 'NFC'], ['NFC North', 'NFC'], ['NFC South', 'NFC'], ['NFC West', 'NFC'],
  ];

  let teamIdx = 0;
  return divisions.map(([div, conf]) => ({
    division: div,
    conference: conf,
    teams: [
      makeStanding(`team-${teamIdx++}`, 13, 4),
      makeStanding(`team-${teamIdx++}`, 11, 6),
      makeStanding(`team-${teamIdx++}`, 8, 9),
      makeStanding(`team-${teamIdx++}`, 5, 12),
    ],
  }));
}

function makeStrength(teamId: string): TeamStrength & { teamId: TeamId } {
  return {
    overall: 70,
    offense: 70,
    defense: 70,
    specialTeams: 60,
    coaching: 5,
    homeFieldAdvantage: 3,
    teamId: teamId as TeamId,
  };
}

describe('PlayoffEngine', () => {
  describe('seedPlayoffTeams', () => {
    it('produces 7 seeds per conference', () => {
      const standings = makeStandings();
      const bracket = seedPlayoffTeams(standings);

      expect(bracket.afc.length).toBe(7);
      expect(bracket.nfc.length).toBe(7);
    });

    it('seeds 1-4 are division winners', () => {
      const standings = makeStandings();
      const bracket = seedPlayoffTeams(standings);

      for (const conf of [bracket.afc, bracket.nfc]) {
        for (let i = 0; i < 4; i++) {
          expect(conf[i]!.seed).toBe(i + 1);
          expect(conf[i]!.isDivisionWinner).toBe(true);
        }
      }
    });

    it('seeds 5-7 are wild cards', () => {
      const standings = makeStandings();
      const bracket = seedPlayoffTeams(standings);

      for (const conf of [bracket.afc, bracket.nfc]) {
        for (let i = 4; i < 7; i++) {
          expect(conf[i]!.seed).toBe(i + 1);
          expect(conf[i]!.isDivisionWinner).toBe(false);
        }
      }
    });

    it('division winners are sorted by record', () => {
      const standings = makeStandings();
      const bracket = seedPlayoffTeams(standings);

      for (const conf of [bracket.afc, bracket.nfc]) {
        for (let i = 0; i < 3; i++) {
          const current = conf[i]!;
          const next = conf[i + 1]!;
          const currentWp = current.record.wins / (current.record.wins + current.record.losses + current.record.ties);
          const nextWp = next.record.wins / (next.record.wins + next.record.losses + next.record.ties);
          expect(currentWp).toBeGreaterThanOrEqual(nextWp);
        }
      }
    });

    it('all seeded teams are unique', () => {
      const standings = makeStandings();
      const bracket = seedPlayoffTeams(standings);

      const afcIds = bracket.afc.map((s) => s.teamId);
      const nfcIds = bracket.nfc.map((s) => s.teamId);

      expect(new Set(afcIds).size).toBe(7);
      expect(new Set(nfcIds).size).toBe(7);

      const allIds = [...afcIds, ...nfcIds];
      expect(new Set(allIds).size).toBe(14);
    });

    it('handles tiebreaker scenarios with identical records', () => {
      const standings: DivisionStandings[] = [
        {
          division: 'AFC East',
          conference: 'AFC',
          teams: [
            makeStanding('tie-a', 10, 7, 0, { pointsFor: 400, pointsAgainst: 300 }),
            makeStanding('tie-b', 10, 7, 0, { pointsFor: 350, pointsAgainst: 310 }),
            makeStanding('tie-c', 10, 7, 0, { pointsFor: 380, pointsAgainst: 320 }),
            makeStanding('tie-d', 5, 12),
          ],
        },
        { division: 'AFC North', conference: 'AFC', teams: [
          makeStanding('n1', 12, 5), makeStanding('n2', 9, 8),
          makeStanding('n3', 7, 10), makeStanding('n4', 4, 13),
        ]},
        { division: 'AFC South', conference: 'AFC', teams: [
          makeStanding('s1', 11, 6), makeStanding('s2', 8, 9),
          makeStanding('s3', 6, 11), makeStanding('s4', 3, 14),
        ]},
        { division: 'AFC West', conference: 'AFC', teams: [
          makeStanding('w1', 14, 3), makeStanding('w2', 10, 7),
          makeStanding('w3', 7, 10), makeStanding('w4', 2, 15),
        ]},
      ];

      const rng = createLCG(42);
      const bracket = seedPlayoffTeams(standings, [], rng);

      expect(bracket.afc.length).toBe(7);
      const divWinners = bracket.afc.filter((s) => s.isDivisionWinner);
      expect(divWinners.length).toBe(4);
    });
  });

  describe('simulatePlayoffRound', () => {
    it('produces results for all matchups', () => {
      const matchups: PlayoffMatchup[] = [
        {
          homeTeamId: 'team-0' as TeamId,
          awayTeamId: 'team-1' as TeamId,
          homeStrength: makeStrength('team-0'),
          awayStrength: makeStrength('team-1'),
        },
        {
          homeTeamId: 'team-2' as TeamId,
          awayTeamId: 'team-3' as TeamId,
          homeStrength: makeStrength('team-2'),
          awayStrength: makeStrength('team-3'),
        },
      ];

      const result = simulatePlayoffRound(matchups, 42, 'wild_card');

      expect(result.round).toBe('wild_card');
      expect(result.games.length).toBe(2);
    });

    it('playoff games never end in a tie', () => {
      for (let seed = 1; seed <= 200; seed++) {
        const matchups: PlayoffMatchup[] = [{
          homeTeamId: 'a' as TeamId,
          awayTeamId: 'b' as TeamId,
          homeStrength: makeStrength('a'),
          awayStrength: makeStrength('b'),
        }];

        const result = simulatePlayoffRound(matchups, seed, 'divisional');

        for (const game of result.games) {
          expect(game.homeScore).not.toBe(game.awayScore);
          expect(game.winnerTeamId).toBeDefined();
          expect(
            game.winnerTeamId === game.homeTeamId ||
            game.winnerTeamId === game.awayTeamId,
          ).toBe(true);
        }
      }
    });

    it('emits PLAYOFF_RESULT events when eventBus provided', () => {
      const bus = new EventBus<GameEventMap>();
      const results: unknown[] = [];
      bus.on('PLAYOFF_RESULT', (payload) => results.push(payload));

      const matchups: PlayoffMatchup[] = [{
        homeTeamId: 'h' as TeamId,
        awayTeamId: 'a' as TeamId,
        homeStrength: makeStrength('h'),
        awayStrength: makeStrength('a'),
      }];

      simulatePlayoffRound(matchups, 42, 'conference', { eventBus: bus });

      expect(results.length).toBe(1);
    });

    it('higher seeded home team wins more often over many rounds', () => {
      let homeWins = 0;
      const N = 300;

      for (let i = 1; i <= N; i++) {
        const matchups: PlayoffMatchup[] = [{
          homeTeamId: 'strong' as TeamId,
          awayTeamId: 'weak' as TeamId,
          homeStrength: makeStrength('strong'),
          awayStrength: makeStrength('weak'),
        }];

        const result = simulatePlayoffRound(matchups, i, 'super_bowl');
        if (result.games[0]!.winnerTeamId === ('strong' as TeamId)) homeWins++;
      }

      expect(homeWins / N).toBeGreaterThan(0.45);
    });
  });
});
