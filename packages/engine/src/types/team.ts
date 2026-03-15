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
// The user is the GM, NOT the coach. These are the subsystems a GM can
// delegate to front-office staff. Anything on the field (depth chart,
// formations, play calling, game plan) is ALWAYS controlled by the
// coaching staff AI and is never directly accessible to the user.

export type DelegationMode = 'manual' | 'review' | 'auto';

export interface DelegationSettings {
  // GM-domain: roster management
  practiceSquad: DelegationMode;
  waiverClaims: DelegationMode;
  trainingCampCuts: DelegationMode;
  injuredReserve: DelegationMode;

  // GM-domain: personnel decisions
  contractNegotiations: DelegationMode;
  scoutingAssignments: DelegationMode;
  tradeEvaluation: DelegationMode;
  draftBoard: DelegationMode;
  freeAgencyTargets: DelegationMode;
}

// ── Coach-Controlled (never user-delegatable) ──────────────────────
// These are decided entirely by the coaching staff AI. The GM's only
// lever is hiring/firing coaches whose philosophy aligns with their vision.

export interface CoachControlledSystems {
  depthChart: true;             // HC/coordinators set the depth chart
  formationPackages: true;      // OC/DC design formation groupings
  situationalPersonnel: true;   // 3rd down, goal line, nickel, dime packages
  playCalling: true;            // OC calls offensive plays, DC calls defensive plays
  gameplan: true;               // weekly game plan designed by coaching staff
  inGameAdjustments: true;      // halftime adjustments, 2-minute drill strategy
  specialTeamsUnits: true;      // STC decides returners, coverage units, etc.
  practiceReps: true;           // position coaches allocate practice reps
}
