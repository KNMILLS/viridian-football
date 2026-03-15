import type { LeagueId, TeamId, PlayerId, UserId } from './ids.js';
import type { Team, Division, Conference } from './team.js';
import type { Player, DraftProspect } from './player.js';
import type { Coach } from './coach.js';
import type { Contract } from './contract.js';
import type { DraftPick } from './draft.js';

// ── League Entity ───────────────────────────────────────────────────

export interface League {
  id: LeagueId;
  name: string;
  season: number;
  week: number;
  phase: LeaguePhase;

  teams: Team[];
  players: Player[];
  coaches: Coach[];
  contracts: Contract[];
  draftPicks: DraftPick[];
  draftProspects: DraftProspect[];

  settings: LeagueSettings;
  schedule: WeekSchedule[];
  standings: DivisionStandings[];

  history: SeasonHistory[];
  awards: AwardHistory[];

  salaryCap: number;
  salaryFloor: number;

  seed: number; // master RNG seed for this league
}

// ── League Phase ────────────────────────────────────────────────────

export type LeaguePhase =
  | 'offseason_start'         // Black Monday
  | 'coaching_carousel'       // Jan hiring cycle
  | 'senior_bowl'
  | 'combine'
  | 'pro_days'
  | 'free_agency_tampering'   // legal tampering window
  | 'free_agency'
  | 'draft'
  | 'post_draft'              // UDFA signing
  | 'otas'
  | 'minicamp'
  | 'training_camp'
  | 'preseason'
  | 'roster_cuts'             // 90 to 53
  | 'regular_season'
  | 'trade_deadline'
  | 'bye_week'
  | 'playoffs_wildcard'
  | 'playoffs_divisional'
  | 'playoffs_conference'
  | 'super_bowl'
  | 'pro_bowl';

// ── Schedule ────────────────────────────────────────────────────────

export interface WeekSchedule {
  season: number;
  week: number;
  phase: 'preseason' | 'regular' | 'postseason';
  games: ScheduledGame[];
  byeTeams: TeamId[];
}

export interface ScheduledGame {
  homeTeamId: TeamId;
  awayTeamId: TeamId;
  isPlayed: boolean;
  result?: { homeScore: number; awayScore: number };
}

// ── Standings ───────────────────────────────────────────────────────

export interface DivisionStandings {
  division: Division;
  conference: Conference;
  teams: TeamStanding[];
}

export interface TeamStanding {
  teamId: TeamId;
  wins: number;
  losses: number;
  ties: number;
  winPercentage: number;
  pointsFor: number;
  pointsAgainst: number;
  divisionRecord: { wins: number; losses: number; ties: number };
  conferenceRecord: { wins: number; losses: number; ties: number };
  streak: { type: 'W' | 'L' | 'T'; count: number };
  playoffSeed: number | null;
}

// ── League Settings ─────────────────────────────────────────────────

export interface LeagueSettings {
  salaryCap: number;
  rosterSize: number;             // default 53
  practiceSquadSize: number;      // default 16
  preseasonGames: number;         // default 3
  regularSeasonGames: number;     // default 17
  playoffTeams: number;           // default 14
  tradeDeadlineWeek: number;      // default 9
  draftRounds: number;            // default 7
  maxCompPicks: number;           // default 4

  advanceMode: 'manual' | 'deadline' | 'all_ready';
  advanceDeadlineHours: number;   // for online leagues
}

// ── Season History ──────────────────────────────────────────────────

export interface SeasonHistory {
  season: number;
  champion: TeamId;
  runnerUp: TeamId;
  mvp: PlayerId;
  dpoy: PlayerId;
  oroy: PlayerId;
  droy: PlayerId;
  topRusher: PlayerId;
  topPasser: PlayerId;
  topReceiver: PlayerId;
  draftClass: { round: number; pick: number; teamId: TeamId; playerId: PlayerId }[];
}

// ── Awards ──────────────────────────────────────────────────────────

export type AwardType = 'MVP' | 'DPOY' | 'OPOY' | 'OROY' | 'DROY' |
  'CPOY' | 'WPMOY' | 'ALL_PRO_FIRST' | 'ALL_PRO_SECOND' | 'PRO_BOWL';

export interface AwardHistory {
  season: number;
  award: AwardType;
  playerId: PlayerId;
  teamId: TeamId;
}

// ── User ────────────────────────────────────────────────────────────

export interface LeagueUser {
  userId: UserId;
  leagueId: LeagueId;
  teamId: TeamId;
  role: 'commissioner' | 'gm';
  isReady: boolean;            // for async advance
  joinedAt: string;
}
