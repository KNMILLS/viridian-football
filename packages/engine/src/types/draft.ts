import type { PlayerId, TeamId, DraftPickId } from './ids.js';
import type { DraftProspect, ScoutingReport } from './player.js';

// ── Draft Pick ──────────────────────────────────────────────────────

export interface DraftPick {
  id: DraftPickId;
  originalTeamId: TeamId;
  currentTeamId: TeamId;
  season: number;
  round: number;
  pickInRound: number | null;  // null until determined by standings
  overall: number | null;       // null until determined by standings
  isConditional: boolean;
  conditions: PickCondition[];
  resolvedRound: number | null; // set when conditions are evaluated
}

// ── Conditional Pick Logic ──────────────────────────────────────────

export type PickCondition =
  | { kind: 'pro_bowl'; playerId: PlayerId; upgradeTo: number }
  | { kind: 'snap_percentage'; playerId: PlayerId; threshold: number; upgradeTo: number }
  | { kind: 'games_started'; playerId: PlayerId; threshold: number; upgradeTo: number }
  | { kind: 'playoff_appearance'; teamId: TeamId; upgradeTo: number }
  | { kind: 'stat_threshold'; playerId: PlayerId; stat: string; threshold: number; upgradeTo: number };

// ── Draft Board ─────────────────────────────────────────────────────

export interface DraftBoard {
  teamId: TeamId;
  rankings: DraftBoardEntry[];
}

export interface DraftBoardEntry {
  prospectId: PlayerId;
  teamRank: number;
  scoutingReport: ScoutingReport;
  needFit: number;            // 0-100, how much team needs this position
  schemeFitEstimate: number;  // 0-100, estimated scheme compatibility
  overallGrade: number;       // 0-100, final board grade
}

// ── Draft State ─────────────────────────────────────────────────────

export interface DraftState {
  season: number;
  currentRound: number;
  currentPick: number;
  picks: DraftSelection[];
  availableProspects: PlayerId[];
  isComplete: boolean;
}

export interface DraftSelection {
  pickId: DraftPickId;
  teamId: TeamId;
  playerId: PlayerId;
  round: number;
  overall: number;
}

// ── Combine / Pro Day ───────────────────────────────────────────────

export interface CombineEvent {
  season: number;
  participants: PlayerId[];
  results: Map<PlayerId, CombinePerformance>;
}

export interface CombinePerformance {
  prospectId: PlayerId;
  fortyYardDash: number | null;
  benchPress: number | null;    // reps of 225 lbs
  verticalJump: number | null;  // inches
  broadJump: number | null;     // inches
  threeConeDrill: number | null;
  twentyYardShuttle: number | null;
  interviewScore: number | null; // team-specific, from investing in interview
}

// ── Draft Engine Interface ──────────────────────────────────────────

export interface IDraftEngine {
  generateDraftClass(season: number, seed: number): DraftProspect[];
  conductScoutingVisit(teamId: TeamId, prospectId: PlayerId): ScoutingReport;
  runCombine(season: number): CombineEvent;
  evaluateProspect(teamId: TeamId, prospectId: PlayerId): DraftBoardEntry;
  getPickValue(round: number, pick: number): number;
}
