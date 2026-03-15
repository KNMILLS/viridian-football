import type { TeamId, PlayerId, LeagueWeek } from '../types/ids.js';
import type { EventBus } from '../events/EventBus.js';
import type { GameEventMap } from '../events/GameEvents.js';
import type { TeamStrength } from './TeamStrength.js';
import {
  createLCG, randomInt, weightedChoice, chance, normalRandom, clamp,
  type RNG,
} from './RNG.js';

// ── Types ──────────────────────────────────────────────────────────

export type Weather = 'clear' | 'rain' | 'snow' | 'wind' | 'dome';

export interface GameSimOptions {
  weather?: Weather;
  intensity?: 'regular' | 'playoff' | 'super_bowl';
  injuryRate?: number;
  eventBus?: EventBus<GameEventMap>;
  week?: LeagueWeek;
  homeRoster?: PlayerId[];
  awayRoster?: PlayerId[];
}

export interface PlayByPlayEntry {
  quarter: number;
  time: string;
  description: string;
  impact: 'touchdown' | 'field_goal' | 'turnover' | 'big_play' | 'injury' | 'penalty' | 'two_minute_warning';
  scoreHome: number;
  scoreAway: number;
}

export interface PlayerStatLine {
  playerId: PlayerId;
  stats: Record<string, number>;
}

export interface GameInjury {
  playerId: PlayerId;
  teamId: TeamId;
  type: string;
  severity: 'minor' | 'moderate' | 'severe' | 'season_ending';
  weeksOut: number;
}

export interface GameResult {
  homeTeamId: TeamId;
  awayTeamId: TeamId;
  homeScore: number;
  awayScore: number;
  playByPlay: PlayByPlayEntry[];
  playerStats: PlayerStatLine[];
  injuries: GameInjury[];
  timeOfPossession: { home: number; away: number };
  keyMoments: PlayByPlayEntry[];
  seed: number;
}

// ── Internals ──────────────────────────────────────────────────────

type PossessionOutcome = 'touchdown' | 'field_goal' | 'punt' | 'turnover' | 'turnover_td';

interface DriveResult {
  outcome: PossessionOutcome;
  points: number;
  yardage: number;
  plays: number;
  timeUsed: number;
}

const INJURY_TYPES = [
  'hamstring strain', 'ankle sprain', 'knee sprain', 'concussion',
  'shoulder strain', 'groin strain', 'calf strain', 'back spasm',
  'ACL tear', 'broken collarbone', 'torn achilles', 'high ankle sprain',
];

const SEVERITY_WEIGHTS = [
  { item: 'minor' as const, weight: 50 },
  { item: 'moderate' as const, weight: 30 },
  { item: 'severe' as const, weight: 15 },
  { item: 'season_ending' as const, weight: 5 },
];

const WEEKS_BY_SEVERITY: Record<string, [number, number]> = {
  minor: [0, 1],
  moderate: [2, 4],
  severe: [4, 8],
  season_ending: [12, 20],
};

function weatherScoreMultiplier(weather: Weather | undefined): number {
  switch (weather) {
    case 'rain': return 0.88;
    case 'snow': return 0.85;
    case 'wind': return 0.90;
    default: return 1.0;
  }
}

function intensityModifier(intensity: string | undefined): number {
  switch (intensity) {
    case 'playoff': return 0.95;
    case 'super_bowl': return 0.93;
    default: return 1.0;
  }
}

function simulateDrive(
  rng: RNG,
  offenseRating: number,
  defenseRating: number,
  coaching: number,
): DriveResult {
  const edge = (offenseRating - defenseRating) / 100;
  const coachBoost = coaching / 200;

  const tdProb = clamp(0.22 + edge * 0.3 + coachBoost, 0.08, 0.42);
  const fgProb = clamp(0.16 + edge * 0.05, 0.08, 0.25);
  const toProb = clamp(0.13 - edge * 0.15, 0.05, 0.25);
  const toTdProb = 0.02;
  const puntProb = 1 - tdProb - fgProb - toProb - toTdProb;

  const outcome = weightedChoice<PossessionOutcome>(rng, [
    { item: 'touchdown', weight: tdProb },
    { item: 'field_goal', weight: fgProb },
    { item: 'punt', weight: Math.max(puntProb, 0.1) },
    { item: 'turnover', weight: toProb },
    { item: 'turnover_td', weight: toTdProb },
  ]);

  let points = 0;
  let yardage: number;
  let plays: number;

  switch (outcome) {
    case 'touchdown':
      yardage = randomInt(rng, 25, 85);
      plays = randomInt(rng, 3, 10);
      points = chance(rng, 0.94) ? 7 : 6;
      break;
    case 'field_goal':
      yardage = randomInt(rng, 30, 60);
      plays = randomInt(rng, 5, 12);
      points = 3;
      break;
    case 'turnover_td':
      yardage = randomInt(rng, -5, 20);
      plays = randomInt(rng, 1, 5);
      points = -7;
      break;
    case 'turnover':
      yardage = randomInt(rng, -5, 35);
      plays = randomInt(rng, 1, 6);
      break;
    default:
      yardage = randomInt(rng, 10, 45);
      plays = randomInt(rng, 3, 8);
      break;
  }

  const timeUsed = plays * randomInt(rng, 25, 40);

  return { outcome, points, yardage, plays, timeUsed };
}

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, '0')}`;
}

function driveDescription(
  rng: RNG,
  drive: DriveResult,
  isHome: boolean,
  teamLabel: string,
): string {
  const side = isHome ? 'Home' : 'Away';
  switch (drive.outcome) {
    case 'touchdown':
      return chance(rng, 0.5)
        ? `${teamLabel} ${side} drives ${drive.yardage} yards on ${drive.plays} plays, TD`
        : `${teamLabel} ${side} scores on a ${drive.yardage}-yard drive, ${drive.plays} plays, TD`;
    case 'field_goal':
      return `${teamLabel} ${side} drives to the ${randomInt(rng, 18, 40)}-yard line, FG is good`;
    case 'turnover':
      return chance(rng, 0.55)
        ? `${teamLabel} ${side} intercepted after ${drive.plays} plays`
        : `${teamLabel} ${side} fumbles, turnover after ${drive.plays} plays`;
    case 'turnover_td':
      return `${teamLabel} ${side} turns it over — returned for a defensive TD!`;
    default:
      return `${teamLabel} ${side} punts after ${drive.plays}-play drive`;
  }
}

function generateInjuries(
  rng: RNG,
  teamId: TeamId,
  roster: PlayerId[] | undefined,
  injuryRate: number,
): GameInjury[] {
  const injuries: GameInjury[] = [];
  if (!roster || roster.length === 0) return injuries;

  const injuryChance = 0.03 * injuryRate;
  if (!chance(rng, injuryChance)) return injuries;

  const numInjuries = chance(rng, 0.8) ? 1 : 2;
  for (let i = 0; i < numInjuries; i++) {
    const idx = randomInt(rng, 0, roster.length - 1);
    const pid = roster[idx]!;
    const severity = weightedChoice(rng, SEVERITY_WEIGHTS);
    const range = WEEKS_BY_SEVERITY[severity]!;
    injuries.push({
      playerId: pid,
      teamId,
      type: INJURY_TYPES[randomInt(rng, 0, INJURY_TYPES.length - 1)]!,
      severity,
      weeksOut: randomInt(rng, range[0], range[1]),
    });
  }

  return injuries;
}

// ── Public API ─────────────────────────────────────────────────────

export function simulateGame(
  home: TeamStrength & { teamId: TeamId },
  away: TeamStrength & { teamId: TeamId },
  seed: number,
  options: GameSimOptions = {},
): GameResult {
  const rng = createLCG(seed);
  const weather = options.weather;
  const intensity = options.intensity;
  const injuryRate = options.injuryRate ?? 1.0;
  const weatherMult = weatherScoreMultiplier(weather);
  const intensityMod = intensityModifier(intensity);

  const possessionsPerTeam = randomInt(rng, 10, 13);
  const playByPlay: PlayByPlayEntry[] = [];
  let homeScore = 0;
  let awayScore = 0;
  let gameClock = 3600;
  let homePossessionTime = 0;
  let awayPossessionTime = 0;

  for (let i = 0; i < possessionsPerTeam * 2; i++) {
    const isHome = i % 2 === 0;
    const quarter = Math.min(Math.floor(i / (possessionsPerTeam / 2)) + 1, 4);

    const offRating = isHome ? home.offense : away.offense;
    const defRating = isHome ? away.defense : home.defense;
    const coaching = isHome ? home.coaching : away.coaching;

    const drive = simulateDrive(rng, offRating, defRating, coaching);

    let points = drive.points;
    if (isHome) {
      points = Math.round(points * weatherMult * intensityMod);
      if (points > 0) points += (home.homeFieldAdvantage > 0 && chance(rng, 0.08)) ? 3 : 0;
    } else {
      points = Math.round(points * weatherMult * intensityMod);
    }

    if (drive.outcome === 'turnover_td') {
      if (isHome) {
        awayScore += Math.abs(points);
      } else {
        homeScore += Math.abs(points);
      }
    } else if (points > 0) {
      if (isHome) homeScore += points;
      else awayScore += points;
    }

    gameClock -= drive.timeUsed;
    if (isHome) homePossessionTime += drive.timeUsed;
    else awayPossessionTime += drive.timeUsed;

    const clockForDisplay = Math.max(gameClock, 0);
    const quarterSeconds = 900 - ((clockForDisplay) % 900);
    const timeStr = formatTime(Math.max(900 - quarterSeconds, 0));

    if (drive.outcome !== 'punt') {
      const impact: PlayByPlayEntry['impact'] =
        drive.outcome === 'touchdown' ? 'touchdown' :
        drive.outcome === 'field_goal' ? 'field_goal' :
        drive.outcome === 'turnover_td' ? 'turnover' :
        'turnover';

      playByPlay.push({
        quarter,
        time: timeStr,
        description: driveDescription(rng, drive, isHome, isHome ? 'Home' : 'Away'),
        impact,
        scoreHome: homeScore,
        scoreAway: awayScore,
      });
    } else if (chance(rng, 0.15)) {
      playByPlay.push({
        quarter,
        time: timeStr,
        description: `${isHome ? 'Home' : 'Away'} punts after a ${drive.plays}-play drive`,
        impact: 'big_play',
        scoreHome: homeScore,
        scoreAway: awayScore,
      });
    }

    if (gameClock <= 0) break;
  }

  const strengthDiff = (home.overall - away.overall) / 25;
  homeScore = Math.round(homeScore + clamp(strengthDiff, -4, 4));
  homeScore = Math.max(homeScore, 0);

  const injuries = [
    ...generateInjuries(rng, home.teamId, options.homeRoster, injuryRate),
    ...generateInjuries(rng, away.teamId, options.awayRoster, injuryRate),
  ];

  for (const inj of injuries) {
    const quarter = randomInt(rng, 1, 4);
    playByPlay.push({
      quarter,
      time: formatTime(randomInt(rng, 0, 900)),
      description: `Player injury: ${inj.type} (${inj.severity})`,
      impact: 'injury',
      scoreHome: homeScore,
      scoreAway: awayScore,
    });
  }

  playByPlay.sort((a, b) => a.quarter - b.quarter);

  const keyMoments = playByPlay.filter(
    (e) => e.impact === 'touchdown' || e.impact === 'turnover' || e.impact === 'injury',
  );

  const totalPossTime = homePossessionTime + awayPossessionTime;
  const topNorm = totalPossTime > 0 ? 3600 / totalPossTime : 1;

  const result: GameResult = {
    homeTeamId: home.teamId,
    awayTeamId: away.teamId,
    homeScore,
    awayScore,
    playByPlay,
    playerStats: [],
    injuries,
    timeOfPossession: {
      home: Math.round(homePossessionTime * topNorm),
      away: Math.round(awayPossessionTime * topNorm),
    },
    keyMoments,
    seed,
  };

  if (options.eventBus && options.week) {
    options.eventBus.emit('GAME_RESULT', {
      week: options.week,
      homeTeamId: home.teamId,
      awayTeamId: away.teamId,
      homeScore: result.homeScore,
      awayScore: result.awayScore,
      seed,
    });

    for (const inj of injuries) {
      options.eventBus.emit('INJURY_OCCURRED', {
        playerId: inj.playerId,
        teamId: inj.teamId,
        type: inj.type,
        severity: inj.severity,
        weeksOut: inj.weeksOut,
      });
    }
  }

  return result;
}
