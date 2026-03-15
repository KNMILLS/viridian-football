import type { CoachId, TeamId } from './ids.js';

// ── Coaching Role ───────────────────────────────────────────────────

export type CoachRole = 'HC' | 'OC' | 'DC' | 'STC' | 'QB_COACH' | 'RB_COACH' |
  'WR_COACH' | 'OL_COACH' | 'DL_COACH' | 'LB_COACH' | 'DB_COACH';

// ── Offensive Schemes ───────────────────────────────────────────────

export type OffensiveScheme =
  | 'west_coast'
  | 'spread'
  | 'air_raid'
  | 'power_run'
  | 'zone_run'
  | 'rpo_heavy'
  | 'play_action_heavy'
  | 'pro_style';

// ── Defensive Schemes ───────────────────────────────────────────────

export type DefensiveScheme =
  | '4_3_under'
  | '3_4'
  | 'nickel_base'
  | 'cover_3'
  | 'cover_2_tampa'
  | 'multiple'
  | 'aggressive_blitz';

// ── Coach Entity ────────────────────────────────────────────────────

export interface Coach {
  id: CoachId;
  firstName: string;
  lastName: string;
  age: number;
  role: CoachRole;
  teamId: TeamId | null;

  offensiveScheme: OffensiveScheme | null;  // null if defensive or ST coach
  defensiveScheme: DefensiveScheme | null;   // null if offensive or ST coach

  attributes: CoachAttributes;
  personality: CoachPersonality;

  coachingTreeOrigin: CoachId | null; // who mentored this coach
  yearsExperience: number;
  record: { wins: number; losses: number; ties: number };
  playoffAppearances: number;
  championships: number;

  salary: number;
  contractYearsRemaining: number;
}

// ── Coach Attributes ────────────────────────────────────────────────

export interface CoachAttributes {
  gameManagement: number;     // 0-99, clock mgmt, challenges, timeouts
  playerDevelopment: number;  // affects progression rates of players
  playCalling: number;        // game sim performance modifier
  schemeDesign: number;       // how well the scheme adapts
  recruiting: number;         // FA/draft pitch effectiveness
  adaptability: number;       // in-game adjustments
}

// ── Coach Personality ───────────────────────────────────────────────

export interface CoachPersonality {
  aggressiveness: number; // 0-99, 4th down, blitzing, risk tolerance
  discipline: number;     // penalty reduction, player accountability
  motivation: number;     // morale boost to team
  innovation: number;     // willingness to try new schemes/strategies
  ego: number;            // may clash with GM if high
  mediaPresence: 'quiet' | 'moderate' | 'fiery';
}

// ── Scheme Fit ──────────────────────────────────────────────────────

export interface SchemeFitResult {
  playerId: string;
  coachId: string;
  fitScore: number;           // 0-100, how well the player fits the scheme
  keyAttributes: string[];    // which attributes drive this score
  performanceMultiplier: number; // applied to player's ratings in game sim
}

// ── Coaching Tree ───────────────────────────────────────────────────

export interface CoachingTreeNode {
  coachId: CoachId;
  mentorId: CoachId | null;
  proteges: CoachId[];
  treeBonus: number; // hiring from a successful tree gives scheme bonuses
}

// ── Coaching Engine Interface ───────────────────────────────────────

export interface ICoachingEngine {
  calculateSchemeFit(playerId: string, coachId: string): SchemeFitResult;
  getCoachingTree(coachId: CoachId): CoachingTreeNode;
  evaluateCoachPerformance(coachId: CoachId, season: number): number;
  generateCandidatePool(role: CoachRole): Coach[];
}
