import type { TeamId } from '../types/ids.js';
import type { DivisionStandings, TeamStanding, WeekSchedule } from '../types/league.js';
import type { Conference } from '../types/team.js';
import type { EventBus } from '../events/EventBus.js';
import type { GameEventMap } from '../events/GameEvents.js';
import type { TeamStrength } from './TeamStrength.js';
import type { GameResult, GameSimOptions } from './GameSim.js';
import { simulateGame } from './GameSim.js';
import { createLCG, randomInt, type RNG } from './RNG.js';

// ── Types ──────────────────────────────────────────────────────────

export interface PlayoffSeed {
  seed: number;
  teamId: TeamId;
  record: { wins: number; losses: number; ties: number };
  isDivisionWinner: boolean;
}

export interface PlayoffBracket {
  afc: PlayoffSeed[];
  nfc: PlayoffSeed[];
}

export interface PlayoffGameResult {
  homeTeamId: TeamId;
  awayTeamId: TeamId;
  homeScore: number;
  awayScore: number;
  winnerTeamId: TeamId;
}

export type PlayoffRoundName = 'wild_card' | 'divisional' | 'conference' | 'super_bowl';

export interface PlayoffRoundResult {
  round: PlayoffRoundName;
  games: PlayoffGameResult[];
}

export interface PlayoffMatchup {
  homeTeamId: TeamId;
  awayTeamId: TeamId;
  homeStrength: TeamStrength & { teamId: TeamId };
  awayStrength: TeamStrength & { teamId: TeamId };
}

// ── Tiebreaker Helpers ─────────────────────────────────────────────

function winPct(s: TeamStanding): number {
  const total = s.wins + s.losses + s.ties;
  return total === 0 ? 0 : (s.wins + s.ties * 0.5) / total;
}

function divWinPct(s: TeamStanding): number {
  const r = s.divisionRecord;
  const total = r.wins + r.losses + r.ties;
  return total === 0 ? 0 : (r.wins + r.ties * 0.5) / total;
}

function confWinPct(s: TeamStanding): number {
  const r = s.conferenceRecord;
  const total = r.wins + r.losses + r.ties;
  return total === 0 ? 0 : (r.wins + r.ties * 0.5) / total;
}

function getHeadToHead(
  a: TeamStanding,
  b: TeamStanding,
  schedule: WeekSchedule[],
): number {
  let aWins = 0;
  let bWins = 0;

  for (const week of schedule) {
    if (week.phase !== 'regular') continue;
    for (const game of week.games) {
      if (!game.isPlayed || !game.result) continue;
      const isMatch =
        (game.homeTeamId === a.teamId && game.awayTeamId === b.teamId) ||
        (game.homeTeamId === b.teamId && game.awayTeamId === a.teamId);
      if (!isMatch) continue;

      const homeWins = game.result.homeScore > game.result.awayScore;
      const awayWins = game.result.awayScore > game.result.homeScore;

      if (game.homeTeamId === a.teamId) {
        if (homeWins) aWins++;
        else if (awayWins) bWins++;
      } else {
        if (homeWins) bWins++;
        else if (awayWins) aWins++;
      }
    }
  }

  if (aWins > bWins) return -1;
  if (bWins > aWins) return 1;
  return 0;
}

function getCommonGamesRecord(
  team: TeamStanding,
  opponents: Set<string>,
  schedule: WeekSchedule[],
): number {
  let wins = 0;
  let losses = 0;
  let ties = 0;

  for (const week of schedule) {
    if (week.phase !== 'regular') continue;
    for (const game of week.games) {
      if (!game.isPlayed || !game.result) continue;
      const isHome = game.homeTeamId === team.teamId;
      const isAway = game.awayTeamId === team.teamId;
      if (!isHome && !isAway) continue;

      const opp = isHome ? game.awayTeamId : game.homeTeamId;
      if (!opponents.has(opp)) continue;

      const homeWon = game.result.homeScore > game.result.awayScore;
      const awayWon = game.result.awayScore > game.result.homeScore;

      if (isHome) {
        if (homeWon) wins++;
        else if (awayWon) losses++;
        else ties++;
      } else {
        if (awayWon) wins++;
        else if (homeWon) losses++;
        else ties++;
      }
    }
  }

  const total = wins + losses + ties;
  return total === 0 ? 0.5 : (wins + ties * 0.5) / total;
}

function strengthOfVictory(
  team: TeamStanding,
  allStandings: TeamStanding[],
  schedule: WeekSchedule[],
): number {
  const beatenIds = new Set<string>();

  for (const week of schedule) {
    if (week.phase !== 'regular') continue;
    for (const game of week.games) {
      if (!game.isPlayed || !game.result) continue;
      const isHome = game.homeTeamId === team.teamId;
      const isAway = game.awayTeamId === team.teamId;
      if (!isHome && !isAway) continue;

      const homeWon = game.result.homeScore > game.result.awayScore;
      const awayWon = game.result.awayScore > game.result.homeScore;

      if ((isHome && homeWon) || (isAway && awayWon)) {
        beatenIds.add(isHome ? game.awayTeamId : game.homeTeamId);
      }
    }
  }

  if (beatenIds.size === 0) return 0;

  let totalWinPct = 0;
  for (const id of beatenIds) {
    const s = allStandings.find((t) => t.teamId === id);
    if (s) totalWinPct += winPct(s);
  }

  return totalWinPct / beatenIds.size;
}

function strengthOfSchedule(
  team: TeamStanding,
  allStandings: TeamStanding[],
  schedule: WeekSchedule[],
): number {
  const opponentIds = new Set<string>();

  for (const week of schedule) {
    if (week.phase !== 'regular') continue;
    for (const game of week.games) {
      if (!game.isPlayed || !game.result) continue;
      if (game.homeTeamId === team.teamId) opponentIds.add(game.awayTeamId);
      if (game.awayTeamId === team.teamId) opponentIds.add(game.homeTeamId);
    }
  }

  if (opponentIds.size === 0) return 0.5;

  let totalWinPct = 0;
  for (const id of opponentIds) {
    const s = allStandings.find((t) => t.teamId === id);
    if (s) totalWinPct += winPct(s);
  }

  return totalWinPct / opponentIds.size;
}

function combinedRanking(s: TeamStanding): number {
  return s.pointsFor - s.pointsAgainst;
}

function findCommonOpponents(
  a: TeamStanding,
  b: TeamStanding,
  schedule: WeekSchedule[],
): Set<string> {
  const oppsA = new Set<string>();
  const oppsB = new Set<string>();

  for (const week of schedule) {
    if (week.phase !== 'regular') continue;
    for (const game of week.games) {
      if (!game.isPlayed) continue;
      if (game.homeTeamId === a.teamId) oppsA.add(game.awayTeamId);
      if (game.awayTeamId === a.teamId) oppsA.add(game.homeTeamId);
      if (game.homeTeamId === b.teamId) oppsB.add(game.awayTeamId);
      if (game.awayTeamId === b.teamId) oppsB.add(game.homeTeamId);
    }
  }

  const common = new Set<string>();
  for (const id of oppsA) {
    if (oppsB.has(id)) common.add(id);
  }
  return common;
}

// ── Sorting with tiebreakers ───────────────────────────────────────

function compareTwoTeams(
  a: TeamStanding,
  b: TeamStanding,
  allStandings: TeamStanding[],
  schedule: WeekSchedule[],
  sameDivision: boolean,
  rng: RNG,
): number {
  const wpDiff = winPct(b) - winPct(a);
  if (Math.abs(wpDiff) > 0.001) return wpDiff > 0 ? 1 : -1;

  if (schedule.length > 0) {
    const h2h = getHeadToHead(a, b, schedule);
    if (h2h !== 0) return h2h;
  }

  if (sameDivision) {
    const divDiff = divWinPct(b) - divWinPct(a);
    if (Math.abs(divDiff) > 0.001) return divDiff > 0 ? 1 : -1;
  }

  if (schedule.length > 0) {
    const common = findCommonOpponents(a, b, schedule);
    if (common.size >= 4) {
      const aCommon = getCommonGamesRecord(a, common, schedule);
      const bCommon = getCommonGamesRecord(b, common, schedule);
      const diff = bCommon - aCommon;
      if (Math.abs(diff) > 0.001) return diff > 0 ? 1 : -1;
    }
  }

  const confDiff = confWinPct(b) - confWinPct(a);
  if (Math.abs(confDiff) > 0.001) return confDiff > 0 ? 1 : -1;

  if (schedule.length > 0) {
    const sovDiff = strengthOfVictory(b, allStandings, schedule) -
      strengthOfVictory(a, allStandings, schedule);
    if (Math.abs(sovDiff) > 0.001) return sovDiff > 0 ? 1 : -1;

    const sosDiff = strengthOfSchedule(b, allStandings, schedule) -
      strengthOfSchedule(a, allStandings, schedule);
    if (Math.abs(sosDiff) > 0.001) return sosDiff > 0 ? 1 : -1;
  }

  const crDiff = combinedRanking(b) - combinedRanking(a);
  if (crDiff !== 0) return crDiff > 0 ? 1 : -1;

  return rng() < 0.5 ? -1 : 1;
}

// ── Public API ─────────────────────────────────────────────────────

export function seedPlayoffTeams(
  standings: DivisionStandings[],
  schedule: WeekSchedule[] = [],
  rng: RNG = createLCG(42),
): PlayoffBracket {
  const allStandings = standings.flatMap((d) => d.teams);

  function seedConference(conf: Conference): PlayoffSeed[] {
    const confDivisions = standings.filter((d) => d.conference === conf);
    const divisionWinners: TeamStanding[] = [];

    for (const div of confDivisions) {
      const sorted = [...div.teams].sort((a, b) =>
        compareTwoTeams(a, b, allStandings, schedule, true, rng),
      );
      if (sorted[0]) divisionWinners.push(sorted[0]);
    }

    divisionWinners.sort((a, b) =>
      compareTwoTeams(a, b, allStandings, schedule, false, rng),
    );

    const divWinnerIds = new Set(divisionWinners.map((t) => t.teamId));
    const confTeams = confDivisions.flatMap((d) => d.teams);
    const wildCardCandidates = confTeams
      .filter((t) => !divWinnerIds.has(t.teamId))
      .sort((a, b) => compareTwoTeams(a, b, allStandings, schedule, false, rng));

    const seeds: PlayoffSeed[] = [];

    for (let i = 0; i < divisionWinners.length && i < 4; i++) {
      const t = divisionWinners[i]!;
      seeds.push({
        seed: i + 1,
        teamId: t.teamId,
        record: { wins: t.wins, losses: t.losses, ties: t.ties },
        isDivisionWinner: true,
      });
    }

    for (let i = 0; i < 3 && i < wildCardCandidates.length; i++) {
      const t = wildCardCandidates[i]!;
      seeds.push({
        seed: seeds.length + 1,
        teamId: t.teamId,
        record: { wins: t.wins, losses: t.losses, ties: t.ties },
        isDivisionWinner: false,
      });
    }

    return seeds;
  }

  return {
    afc: seedConference('AFC'),
    nfc: seedConference('NFC'),
  };
}

export function simulatePlayoffRound(
  matchups: PlayoffMatchup[],
  seed: number,
  round: PlayoffRoundName,
  options?: {
    eventBus?: EventBus<GameEventMap>;
  },
): PlayoffRoundResult {
  const rng = createLCG(seed);
  const games: PlayoffGameResult[] = [];

  for (const matchup of matchups) {
    const gameSeed = randomInt(rng, 1, 2_147_483_646);
    const simOptions: GameSimOptions = {
      intensity: round === 'super_bowl' ? 'super_bowl' : 'playoff',
    };

    const result: GameResult = simulateGame(
      matchup.homeStrength,
      matchup.awayStrength,
      gameSeed,
      simOptions,
    );

    let { homeScore, awayScore } = result;

    while (homeScore === awayScore) {
      const otSeed = randomInt(rng, 1, 2_147_483_646);
      const otRng = createLCG(otSeed);
      const otPoints = randomInt(otRng, 1, 2) === 1 ? 3 : 7;
      if (otRng() < 0.5) {
        homeScore += otPoints;
      } else {
        awayScore += otPoints;
      }
    }

    const winnerTeamId = homeScore > awayScore
      ? matchup.homeTeamId
      : matchup.awayTeamId;

    games.push({
      homeTeamId: matchup.homeTeamId,
      awayTeamId: matchup.awayTeamId,
      homeScore,
      awayScore,
      winnerTeamId,
    });

    if (options?.eventBus) {
      options.eventBus.emit('PLAYOFF_RESULT', {
        round,
        winnerTeamId,
        loserTeamId: winnerTeamId === matchup.homeTeamId
          ? matchup.awayTeamId
          : matchup.homeTeamId,
        score: {
          winner: Math.max(homeScore, awayScore),
          loser: Math.min(homeScore, awayScore),
        },
      });
    }
  }

  return { round, games };
}
