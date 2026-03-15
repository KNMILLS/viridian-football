/**
 * Master event type definitions for Viridian Football.
 *
 * RULE: Every engine module must declare what events it PRODUCES and CONSUMES.
 * Events fire based on conditions (thresholds, probabilities, trait combinations),
 * NEVER based on specific player names, team names, or season numbers.
 *
 * This file defines the full event bus contract. Parallel agents in Phase 1+
 * all code against these types.
 */

import type { TeamId, PlayerId, CoachId, DraftPickId, LeagueWeek } from '../types/ids.js';

// ── Game Simulation Events ──────────────────────────────────────────

export type GameResultPayload = {
  week: LeagueWeek;
  homeTeamId: TeamId;
  awayTeamId: TeamId;
  homeScore: number;
  awayScore: number;
  seed: number;
};

export type PlayerStatsPayload = {
  week: LeagueWeek;
  playerId: PlayerId;
  stats: Record<string, number>;
};

export type SeasonEndPayload = {
  season: number;
  standings: { teamId: TeamId; wins: number; losses: number; ties: number }[];
};

export type PlayoffResultPayload = {
  round: string;
  winnerTeamId: TeamId;
  loserTeamId: TeamId;
  score: { winner: number; loser: number };
};

// ── Injury Events ───────────────────────────────────────────────────

export type InjuryOccurredPayload = {
  playerId: PlayerId;
  teamId: TeamId;
  type: string;
  severity: 'minor' | 'moderate' | 'severe' | 'season_ending';
  weeksOut: number;
};

export type PlayerRecoveredPayload = {
  playerId: PlayerId;
  teamId: TeamId;
  fullRecovery: boolean;
};

export type InjuryWorsenedPayload = {
  playerId: PlayerId;
  teamId: TeamId;
  newSeverity: string;
  additionalWeeksOut: number;
};

// ── Progression Events ──────────────────────────────────────────────

export type PlayerBreakoutPayload = {
  playerId: PlayerId;
  teamId: TeamId;
  position: string;
  ratingChange: number;
};

export type PlayerDeclinePayload = {
  playerId: PlayerId;
  teamId: TeamId;
  position: string;
  ratingChange: number;
};

export type RatingChangedPayload = {
  playerId: PlayerId;
  attribute: string;
  oldValue: number;
  newValue: number;
};

// ── Personality / Morale Events ─────────────────────────────────────

export type HoldoutInitiatedPayload = {
  playerId: PlayerId;
  teamId: TeamId;
  demandedSalary: number;
  currentSalary: number;
  egoLevel: number;
};

export type HoldoutResolvedPayload = {
  playerId: PlayerId;
  teamId: TeamId;
  resolution: 'new_contract' | 'traded' | 'returned' | 'released';
};

export type MentorshipEffectPayload = {
  mentorId: PlayerId;
  menteeId: PlayerId;
  teamId: TeamId;
  skillBoost: number;
};

export type LockerRoomIssuePayload = {
  teamId: TeamId;
  instigatorId: PlayerId;
  severity: 'minor' | 'moderate' | 'major';
  moraleImpact: number;
};

// ── Contract / Cap Events ───────────────────────────────────────────

export type ContractSignedPayload = {
  playerId: PlayerId;
  teamId: TeamId;
  totalValue: number;
  years: number;
  guaranteed: number;
};

export type ContractExpiredPayload = {
  playerId: PlayerId;
  teamId: TeamId;
};

export type PlayerReleasedPayload = {
  playerId: PlayerId;
  teamId: TeamId;
  deadMoney: number;
  capSavings: number;
};

export type CapViolationPayload = {
  teamId: TeamId;
  overAmount: number;
};

export type DeadMoneyHitPayload = {
  teamId: TeamId;
  playerId: PlayerId;
  amount: number;
  reason: string;
};

export type CompPickAwardedPayload = {
  teamId: TeamId;
  round: number;
  qualifyingPlayerId: PlayerId;
};

// ── Coaching Events ─────────────────────────────────────────────────

export type CoachFiredPayload = {
  coachId: CoachId;
  teamId: TeamId;
  role: string;
  reason: string;
};

export type CoachHiredPayload = {
  coachId: CoachId;
  teamId: TeamId;
  role: string;
  scheme: string;
};

export type SchemeChangedPayload = {
  teamId: TeamId;
  side: 'offense' | 'defense';
  oldScheme: string;
  newScheme: string;
};

export type SchemeFitUpdatedPayload = {
  playerId: PlayerId;
  teamId: TeamId;
  fitScore: number;
  previousFitScore: number;
};

// ── Owner / Front Office Events ─────────────────────────────────────

export type OwnerPressurePayload = {
  teamId: TeamId;
  level: 'low' | 'medium' | 'high' | 'critical';
  reason: string;
};

export type GmFiredPayload = {
  teamId: TeamId;
  reason: string;
};

export type BudgetChangedPayload = {
  teamId: TeamId;
  department: 'analytics' | 'scouting' | 'coaching' | 'facilities';
  oldBudget: number;
  newBudget: number;
};

// ── Trade Events ────────────────────────────────────────────────────

export type TradeProposedPayload = {
  proposingTeamId: TeamId;
  targetTeamId: TeamId;
  offering: TradeAsset[];
  requesting: TradeAsset[];
};

export type TradeAcceptedPayload = {
  teams: [TeamId, TeamId];
  assets: TradeAsset[];
};

export type TradeRejectedPayload = {
  proposingTeamId: TeamId;
  targetTeamId: TeamId;
  reason: string;
};

export type TradeAsset = {
  type: 'player' | 'draft_pick' | 'conditional_pick';
  id: PlayerId | DraftPickId;
  fromTeamId: TeamId;
};

// ── Draft Events ────────────────────────────────────────────────────

export type PlayerDraftedPayload = {
  playerId: PlayerId;
  teamId: TeamId;
  round: number;
  pick: number;
  overall: number;
};

export type PickTradedPayload = {
  pickId: DraftPickId;
  fromTeamId: TeamId;
  toTeamId: TeamId;
};

export type ScoutingReportUpdatedPayload = {
  playerId: PlayerId;
  teamId: TeamId;
  confidenceImprovement: number;
};

// ── Roster Events ───────────────────────────────────────────────────

export type RosterNeedIdentifiedPayload = {
  teamId: TeamId;
  position: string;
  urgency: 'low' | 'medium' | 'high' | 'critical';
};

// ── News Events ─────────────────────────────────────────────────────

export type NewsStoryPayload = {
  headline: string;
  body: string;
  category: 'trade' | 'injury' | 'contract' | 'draft' | 'coaching' | 'milestone' | 'drama' | 'general';
  relatedTeamIds: TeamId[];
  relatedPlayerIds: PlayerId[];
  importance: 'minor' | 'notable' | 'major' | 'breaking';
};

// ── Master Event Map ────────────────────────────────────────────────

export type GameEventMap = {
  // Game simulation
  GAME_RESULT: GameResultPayload;
  PLAYER_STATS: PlayerStatsPayload;
  SEASON_END: SeasonEndPayload;
  PLAYOFF_RESULT: PlayoffResultPayload;

  // Injuries
  INJURY_OCCURRED: InjuryOccurredPayload;
  PLAYER_RECOVERED: PlayerRecoveredPayload;
  INJURY_WORSENED: InjuryWorsenedPayload;

  // Progression
  PLAYER_BREAKOUT: PlayerBreakoutPayload;
  PLAYER_DECLINE: PlayerDeclinePayload;
  RATING_CHANGED: RatingChangedPayload;

  // Personality / morale
  HOLDOUT_INITIATED: HoldoutInitiatedPayload;
  HOLDOUT_RESOLVED: HoldoutResolvedPayload;
  MENTORSHIP_EFFECT: MentorshipEffectPayload;
  LOCKER_ROOM_ISSUE: LockerRoomIssuePayload;

  // Contracts / cap
  CONTRACT_SIGNED: ContractSignedPayload;
  CONTRACT_EXPIRED: ContractExpiredPayload;
  PLAYER_RELEASED: PlayerReleasedPayload;
  CAP_VIOLATION: CapViolationPayload;
  DEAD_MONEY_HIT: DeadMoneyHitPayload;
  COMP_PICK_AWARDED: CompPickAwardedPayload;

  // Coaching
  COACH_FIRED: CoachFiredPayload;
  COACH_HIRED: CoachHiredPayload;
  SCHEME_CHANGED: SchemeChangedPayload;
  SCHEME_FIT_UPDATED: SchemeFitUpdatedPayload;

  // Owner / front office
  OWNER_PRESSURE: OwnerPressurePayload;
  GM_FIRED: GmFiredPayload;
  BUDGET_CHANGED: BudgetChangedPayload;

  // Trading
  TRADE_PROPOSED: TradeProposedPayload;
  TRADE_ACCEPTED: TradeAcceptedPayload;
  TRADE_REJECTED: TradeRejectedPayload;

  // Draft
  PLAYER_DRAFTED: PlayerDraftedPayload;
  PICK_TRADED: PickTradedPayload;
  SCOUTING_REPORT_UPDATED: ScoutingReportUpdatedPayload;

  // Roster
  ROSTER_NEED_IDENTIFIED: RosterNeedIdentifiedPayload;

  // News
  NEWS_STORY: NewsStoryPayload;
};
