import { describe, it, expect } from 'vitest';
import { generateSchedule } from '../../src/sim/ScheduleGenerator.js';
import { createLCG } from '../../src/sim/RNG.js';
import { TEAM_SEEDS } from '../../src/league/teamData.js';
import type { Team, Division, Conference } from '../../src/types/team.js';
import type { LeagueSettings, WeekSchedule } from '../../src/types/league.js';
import type { TeamId } from '../../src/types/ids.js';

// ── Test helpers ──────────────────────────────────────────────────────

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

function teamLookup(teams: Team[]): Map<string, Team> {
  const m = new Map<string, Team>();
  for (const t of teams) m.set(t.id, t);
  return m;
}

function divisionTeams(teams: Team[]): Map<Division, Set<string>> {
  const m = new Map<Division, Set<string>>();
  for (const t of teams) {
    const s = m.get(t.division) ?? new Set();
    s.add(t.id);
    m.set(t.division, s);
  }
  return m;
}

// ── Generate schedule once for all tests ──────────────────────────────

describe('ScheduleGenerator', () => {
  const teams = makeTeams();
  const lookup = teamLookup(teams);
  const divTeams = divisionTeams(teams);
  const rng = createLCG(42);
  const schedule = generateSchedule(teams, 2025, DEFAULT_SETTINGS, rng);

  const preseason = schedule.filter((w) => w.phase === 'preseason');
  const regular = schedule.filter((w) => w.phase === 'regular');

  // Collect all regular-season games once
  const allGames = regular.flatMap((w) => w.games);

  // ═══════════════════════════════════════════════════════════════════
  // STRUCTURE (5 tests)
  // ═══════════════════════════════════════════════════════════════════

  describe('league structure', () => {
    it('has 32 teams across 2 conferences of 16', () => {
      expect(teams.length).toBe(32);
      const afc = teams.filter((t) => t.conference === 'AFC');
      const nfc = teams.filter((t) => t.conference === 'NFC');
      expect(afc.length).toBe(16);
      expect(nfc.length).toBe(16);
    });

    it('has 8 divisions of 4 teams each', () => {
      expect(divTeams.size).toBe(8);
      for (const [, teamSet] of divTeams) {
        expect(teamSet.size).toBe(4);
      }
    });

    it('generates 18 regular season weeks', () => {
      expect(regular.length).toBe(18);
    });

    it('produces 272 total regular season games', () => {
      expect(allGames.length).toBe(272);
    });

    it('every game has exactly one home and one away team', () => {
      for (const game of allGames) {
        expect(game.homeTeamId).toBeDefined();
        expect(game.awayTeamId).toBeDefined();
        expect(game.homeTeamId).not.toBe(game.awayTeamId);
      }
    });
  });

  // ═══════════════════════════════════════════════════════════════════
  // PER-TEAM COUNTS (4 tests)
  // ═══════════════════════════════════════════════════════════════════

  describe('per-team counts', () => {
    const gameCounts = new Map<string, number>();
    const homeCounts = new Map<string, number>();
    const awayCounts = new Map<string, number>();

    for (const game of allGames) {
      gameCounts.set(game.homeTeamId, (gameCounts.get(game.homeTeamId) ?? 0) + 1);
      gameCounts.set(game.awayTeamId, (gameCounts.get(game.awayTeamId) ?? 0) + 1);
      homeCounts.set(game.homeTeamId, (homeCounts.get(game.homeTeamId) ?? 0) + 1);
      awayCounts.set(game.awayTeamId, (awayCounts.get(game.awayTeamId) ?? 0) + 1);
    }

    it('each team plays exactly 17 games', () => {
      for (const team of teams) {
        expect(gameCounts.get(team.id) ?? 0).toBe(17);
      }
    });

    it('each team has 8 or 9 home games', () => {
      for (const team of teams) {
        const h = homeCounts.get(team.id) ?? 0;
        expect(h).toBeGreaterThanOrEqual(8);
        expect(h).toBeLessThanOrEqual(9);
      }
    });

    it('each team has 8 or 9 away games', () => {
      for (const team of teams) {
        const a = awayCounts.get(team.id) ?? 0;
        expect(a).toBeGreaterThanOrEqual(8);
        expect(a).toBeLessThanOrEqual(9);
      }
    });

    it('league total: 136 home, 136 away', () => {
      let totalHome = 0;
      let totalAway = 0;
      for (const team of teams) {
        totalHome += homeCounts.get(team.id) ?? 0;
        totalAway += awayCounts.get(team.id) ?? 0;
      }
      expect(totalHome).toBe(272);
      expect(totalAway).toBe(272);
    });
  });

  // ═══════════════════════════════════════════════════════════════════
  // GAME UNIQUENESS (1 test)
  // ═══════════════════════════════════════════════════════════════════

  describe('game uniqueness', () => {
    it('each scheduled game appears exactly once', () => {
      const seen = new Set<string>();
      for (let wi = 0; wi < regular.length; wi++) {
        for (const game of regular[wi]!.games) {
          const key = `${wi}|${game.homeTeamId}|${game.awayTeamId}`;
          expect(seen.has(key)).toBe(false);
          seen.add(key);
        }
      }
      expect(seen.size).toBe(272);
    });
  });

  // ═══════════════════════════════════════════════════════════════════
  // WEEKLY PARTICIPATION (1 test)
  // ═══════════════════════════════════════════════════════════════════

  describe('weekly participation', () => {
    it('no team plays more than once per week', () => {
      for (const week of regular) {
        const playing = new Set<string>();
        for (const game of week.games) {
          expect(playing.has(game.homeTeamId)).toBe(false);
          expect(playing.has(game.awayTeamId)).toBe(false);
          playing.add(game.homeTeamId);
          playing.add(game.awayTeamId);
        }
      }
    });
  });

  // ═══════════════════════════════════════════════════════════════════
  // OPPONENT RULES (3 tests)
  // ═══════════════════════════════════════════════════════════════════

  describe('opponent rules', () => {
    // Build directed matchup counts: matchups[home][away] = count
    const matchups = new Map<string, Map<string, number>>();
    for (const game of allGames) {
      if (!matchups.has(game.homeTeamId)) matchups.set(game.homeTeamId, new Map());
      const m = matchups.get(game.homeTeamId)!;
      m.set(game.awayTeamId, (m.get(game.awayTeamId) ?? 0) + 1);
    }

    it('each team plays each division rival exactly twice (1 home, 1 away)', () => {
      for (const team of teams) {
        const rivals = teams.filter(
          (t) => t.division === team.division && t.id !== team.id,
        );
        expect(rivals.length).toBe(3);

        for (const rival of rivals) {
          const homeVsRival = matchups.get(team.id)?.get(rival.id) ?? 0;
          const awayVsRival = matchups.get(rival.id)?.get(team.id) ?? 0;
          expect(homeVsRival).toBe(1);
          expect(awayVsRival).toBe(1);
        }
      }
    });

    it('each team plays exactly 6 same-conference non-division games', () => {
      for (const team of teams) {
        let sameConfNonDiv = 0;
        for (const game of allGames) {
          const isHome = game.homeTeamId === team.id;
          const isAway = game.awayTeamId === team.id;
          if (!isHome && !isAway) continue;
          const oppId = isHome ? game.awayTeamId : game.homeTeamId;
          const opp = lookup.get(oppId)!;
          if (opp.conference === team.conference && opp.division !== team.division) {
            sameConfNonDiv++;
          }
        }
        expect(sameConfNonDiv).toBe(6);
      }
    });

    it('each team plays exactly 5 cross-conference games', () => {
      for (const team of teams) {
        let crossConf = 0;
        for (const game of allGames) {
          const isHome = game.homeTeamId === team.id;
          const isAway = game.awayTeamId === team.id;
          if (!isHome && !isAway) continue;
          const oppId = isHome ? game.awayTeamId : game.homeTeamId;
          const opp = lookup.get(oppId)!;
          if (opp.conference !== team.conference) crossConf++;
        }
        expect(crossConf).toBe(5);
      }
    });
  });

  // ═══════════════════════════════════════════════════════════════════
  // BYE RULES (5 tests)
  // ═══════════════════════════════════════════════════════════════════

  describe('bye rules', () => {
    it('every team has exactly 1 bye', () => {
      const byeCount = new Map<string, number>();
      for (const week of regular) {
        for (const tid of week.byeTeams) {
          byeCount.set(tid, (byeCount.get(tid) ?? 0) + 1);
        }
      }
      for (const team of teams) {
        expect(byeCount.get(team.id) ?? 0).toBe(1);
      }
    });

    it('teams do not play during their bye week', () => {
      for (const week of regular) {
        const byeSet = new Set(week.byeTeams);
        for (const game of week.games) {
          expect(byeSet.has(game.homeTeamId)).toBe(false);
          expect(byeSet.has(game.awayTeamId)).toBe(false);
        }
      }
    });

    it('all byes fall within weeks 5-14', () => {
      for (let i = 0; i < regular.length; i++) {
        const weekNum = i + 1;
        if (regular[i]!.byeTeams.length > 0) {
          expect(weekNum).toBeGreaterThanOrEqual(5);
          expect(weekNum).toBeLessThanOrEqual(14);
        }
      }
    });

    it('each bye week has between 2 and 6 teams on bye', () => {
      for (let i = 0; i < regular.length; i++) {
        const weekNum = i + 1;
        const byeCount = regular[i]!.byeTeams.length;
        if (weekNum >= 5 && weekNum <= 14) {
          if (byeCount > 0) {
            expect(byeCount).toBeGreaterThanOrEqual(2);
            expect(byeCount).toBeLessThanOrEqual(6);
          }
        }
      }
    });

    it('no division has all 4 teams on bye the same week', () => {
      for (const week of regular) {
        if (week.byeTeams.length === 0) continue;
        const byeSet = new Set<string>(week.byeTeams);
        for (const [, teamSet] of divTeams) {
          let onBye = 0;
          for (const tid of teamSet) {
            if (byeSet.has(tid)) onBye++;
          }
          expect(onBye).toBeLessThan(4);
        }
      }
    });
  });

  // ═══════════════════════════════════════════════════════════════════
  // SCHEDULE QUALITY (3 tests)
  // ═══════════════════════════════════════════════════════════════════

  describe('schedule quality', () => {
    // Build per-team weekly arrays: home/away/bye
    type WeekState = 'home' | 'away' | 'bye';
    const teamWeeks = new Map<string, (WeekState | null)[]>();
    for (const team of teams) teamWeeks.set(team.id, new Array(18).fill(null));

    for (let wi = 0; wi < regular.length; wi++) {
      for (const game of regular[wi]!.games) {
        teamWeeks.get(game.homeTeamId)![wi] = 'home';
        teamWeeks.get(game.awayTeamId)![wi] = 'away';
      }
      for (const tid of regular[wi]!.byeTeams) {
        teamWeeks.get(tid)![wi] = 'bye';
      }
    }

    // Build per-team weekly division-game flag
    const teamDivWeek = new Map<string, boolean[]>();
    for (const team of teams) teamDivWeek.set(team.id, new Array(18).fill(false));

    for (let wi = 0; wi < regular.length; wi++) {
      for (const game of regular[wi]!.games) {
        const ht = lookup.get(game.homeTeamId)!;
        const at = lookup.get(game.awayTeamId)!;
        if (ht.division === at.division) {
          teamDivWeek.get(game.homeTeamId)![wi] = true;
          teamDivWeek.get(game.awayTeamId)![wi] = true;
        }
      }
    }

    it('no team has more than 3 consecutive home games', () => {
      for (const team of teams) {
        const weeks = teamWeeks.get(team.id)!;
        let consHome = 0;
        for (const state of weeks) {
          if (state === 'home') {
            consHome++;
            expect(consHome).toBeLessThanOrEqual(3);
          } else {
            consHome = 0;
          }
        }
      }
    });

    it('no team has more than 3 consecutive away games', () => {
      for (const team of teams) {
        const weeks = teamWeeks.get(team.id)!;
        let consAway = 0;
        for (const state of weeks) {
          if (state === 'away') {
            consAway++;
            expect(consAway).toBeLessThanOrEqual(3);
          } else {
            consAway = 0;
          }
        }
      }
    });

    it('no team has more than 3 consecutive division games', () => {
      for (const team of teams) {
        const divWeeks = teamDivWeek.get(team.id)!;
        const weeks = teamWeeks.get(team.id)!;
        let consDiv = 0;
        for (let w = 0; w < 18; w++) {
          if (weeks[w] === 'home' || weeks[w] === 'away') {
            if (divWeeks[w]) {
              consDiv++;
              expect(consDiv).toBeLessThanOrEqual(3);
            } else {
              consDiv = 0;
            }
          } else {
            consDiv = 0;
          }
        }
      }
    });
  });

  // ═══════════════════════════════════════════════════════════════════
  // DIVISION SYMMETRY (1 test)
  // ═══════════════════════════════════════════════════════════════════

  describe('division symmetry', () => {
    it('if A hosts B in division, B hosts A in another week', () => {
      for (const team of teams) {
        const rivals = teams.filter(
          (t) => t.division === team.division && t.id !== team.id,
        );
        for (const rival of rivals) {
          const aHostsB = allGames.some(
            (g) => g.homeTeamId === team.id && g.awayTeamId === rival.id,
          );
          const bHostsA = allGames.some(
            (g) => g.homeTeamId === rival.id && g.awayTeamId === team.id,
          );
          expect(aHostsB).toBe(true);
          expect(bHostsA).toBe(true);
        }
      }
    });
  });

  // ═══════════════════════════════════════════════════════════════════
  // PRESEASON (2 tests)
  // ═══════════════════════════════════════════════════════════════════

  describe('preseason', () => {
    it('generates 3 preseason weeks', () => {
      expect(preseason.length).toBe(3);
    });

    it('each preseason week has 16 games', () => {
      for (const week of preseason) {
        expect(week.games.length).toBe(16);
      }
    });
  });

  // ═══════════════════════════════════════════════════════════════════
  // DETERMINISM (1 test)
  // ═══════════════════════════════════════════════════════════════════

  describe('determinism', () => {
    it('same seed produces identical schedule', { timeout: 60_000 }, () => {
      const rng1 = createLCG(99);
      const rng2 = createLCG(99);
      const s1 = generateSchedule(teams, 2025, DEFAULT_SETTINGS, rng1);
      const s2 = generateSchedule(teams, 2025, DEFAULT_SETTINGS, rng2);

      expect(s1.length).toBe(s2.length);
      for (let i = 0; i < s1.length; i++) {
        expect(s1[i]!.games.length).toBe(s2[i]!.games.length);
        for (let j = 0; j < s1[i]!.games.length; j++) {
          expect(s1[i]!.games[j]!.homeTeamId).toBe(s2[i]!.games[j]!.homeTeamId);
          expect(s1[i]!.games[j]!.awayTeamId).toBe(s2[i]!.games[j]!.awayTeamId);
        }
        expect(s1[i]!.byeTeams).toEqual(s2[i]!.byeTeams);
      }
    });
  });
});
