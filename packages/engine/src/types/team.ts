import type { TeamId, PlayerId, CoachId } from './ids.js';
import type { Position } from './player.js';

// ── Conference / Division ───────────────────────────────────────────

export type Conference = 'AFC' | 'NFC';

export type Division =
  | 'AFC East' | 'AFC North' | 'AFC South' | 'AFC West'
  | 'NFC East' | 'NFC North' | 'NFC South' | 'NFC West';

// ── Team Entity ─────────────────────────────────────────────────────

export interface Team {
  id: TeamId;
  city: string;
  name: string;
  abbreviation: string;
  conference: Conference;
  division: Division;
  stadium: string;
  owner: OwnerProfile;

  roster: PlayerId[];
  practiceSquad: PlayerId[];
  injuredReserve: PlayerId[];

  coachingStaff: CoachId[];
  headCoachId: CoachId | null;

  depthChart: DepthChart;

  record: TeamRecord;
  analyticsLevel: number;  // 1-5, investable resource
  scoutingBudget: number;
  facilitiesLevel: number;

  delegationSettings: DelegationSettings;
}

// ── Owner Profile ───────────────────────────────────────────────────

export interface OwnerProfile {
  name: string;
  patience: number;        // 0-100, how many losing seasons before pressure
  spendingWillingness: number; // 0-100, budget generosity
  mediaProfile: 'quiet' | 'moderate' | 'loud';
  priorities: ('winning' | 'revenue' | 'culture' | 'entertainment')[];
}

// ── Depth Chart ─────────────────────────────────────────────────────

export type DepthChart = Record<Position, PlayerId[]>;

// ── Team Record ─────────────────────────────────────────────────────

export interface TeamRecord {
  wins: number;
  losses: number;
  ties: number;
  pointsFor: number;
  pointsAgainst: number;
  divisionWins: number;
  divisionLosses: number;
  conferenceWins: number;
  conferenceLosses: number;
  streak: { type: 'W' | 'L' | 'T'; count: number };
}

// ── Delegation Settings ─────────────────────────────────────────────
// Every subsystem supports manual / review / auto modes.

export type DelegationMode = 'manual' | 'review' | 'auto';

export interface DelegationSettings {
  depthChart: DelegationMode;
  practiceSquad: DelegationMode;
  waiverClaims: DelegationMode;
  trainingCampCuts: DelegationMode;
  contractNegotiations: DelegationMode;
  scoutingAssignments: DelegationMode;
  tradeEvaluation: DelegationMode;
  draftBoard: DelegationMode;
  gameplanAdjustments: DelegationMode;
}
