import { z } from 'zod';
import type { PlayerId, TeamId } from './ids.js';

// ── Position ────────────────────────────────────────────────────────

export const Position = z.enum([
  'QB', 'RB', 'FB', 'WR', 'TE',
  'LT', 'LG', 'C', 'RG', 'RT',
  'DE', 'DT', 'NT', 'OLB', 'ILB', 'MLB',
  'CB', 'FS', 'SS',
  'K', 'P', 'LS',
]);
export type Position = z.infer<typeof Position>;

export const PositionGroup = z.enum([
  'QB', 'RB', 'WR', 'TE', 'OL',
  'DL', 'LB', 'DB',
  'K', 'P', 'ST',
]);
export type PositionGroup = z.infer<typeof PositionGroup>;

// ── Physical Ratings ────────────────────────────────────────────────

export interface PhysicalRatings {
  speed: number;        // 0-99
  acceleration: number;
  strength: number;
  agility: number;
  jumping: number;
  stamina: number;
  toughness: number;
}

// ── Skill Ratings (position-dependent) ──────────────────────────────

export interface PassingRatings {
  throwPower: number;
  shortAccuracy: number;
  mediumAccuracy: number;
  deepAccuracy: number;
  throwOnRun: number;
  playAction: number;
}

export interface RushingRatings {
  carrying: number;
  breakTackle: number;
  elusiveness: number;
  ballCarrierVision: number;
  trucking: number;
}

export interface ReceivingRatings {
  catching: number;
  spectacularCatch: number;
  catchInTraffic: number;
  routeRunning: number;
  release: number;
}

export interface BlockingRatings {
  runBlock: number;
  passBlock: number;
  impactBlock: number;
  awareness: number;
}

export interface DefenseRatings {
  tackling: number;
  hitPower: number;
  pursuit: number;
  playRecognition: number;
  manCoverage: number;
  zoneCoverage: number;
  press: number;
  passRush: number;
  blockShedding: number;
}

export interface KickingRatings {
  kickPower: number;
  kickAccuracy: number;
}

export interface PuntingRatings {
  puntPower: number;
  puntAccuracy: number;
}

// ── Personality Traits ──────────────────────────────────────────────

export interface PersonalityTraits {
  leadership: number;     // 0-99, influences locker room and mentorship
  workEthic: number;      // affects progression rate
  ego: number;            // high ego + underpaid = holdout risk
  coachability: number;   // affects scheme fit adaptation speed
  competitiveness: number;
  composure: number;      // performance under pressure
  loyalty: number;        // affects willingness to take team-friendly deals
}

// ── Hidden Attributes (revealed through scouting) ───────────────────

export interface HiddenAttributes {
  trueOverall: number;           // actual talent level, fog-of-war hidden
  injuryProneness: number;       // higher = more injury risk
  clutchFactor: number;          // playoff/big game modifier
  consistencyVariance: number;   // game-to-game performance variability
  ceilingFloor: [number, number]; // [floor, ceiling] of progression
}

// ── Player Contract Reference ───────────────────────────────────────

export interface PlayerContractRef {
  contractId: string;
  yearsRemaining: number;
  currentYearCapHit: number;
  totalValue: number;
}

// ── Player Entity ───────────────────────────────────────────────────

export interface Player {
  id: PlayerId;
  firstName: string;
  lastName: string;
  age: number;
  position: Position;
  secondaryPositions: Position[];
  teamId: TeamId | null;
  jerseyNumber: number;
  experience: number;          // years in league
  college: string;
  draftYear: number | null;    // null if UDFA
  draftRound: number | null;
  draftPick: number | null;

  physical: PhysicalRatings;
  personality: PersonalityTraits;
  hidden: HiddenAttributes;

  passing?: PassingRatings;
  rushing?: RushingRatings;
  receiving?: ReceivingRatings;
  blocking?: BlockingRatings;
  defense?: DefenseRatings;
  kicking?: KickingRatings;
  punting?: PuntingRatings;

  contract: PlayerContractRef | null;
  injuryStatus: InjuryStatus | null;

  careerStats: Record<string, number>;
  seasonStats: Record<string, Record<string, number>>; // season -> stat -> value
}

// ── Injury Status ───────────────────────────────────────────────────

export interface InjuryStatus {
  type: string;
  severity: 'minor' | 'moderate' | 'severe' | 'season_ending';
  weeksRemaining: number;
  performancePenalty: number; // 0-1, multiplied against ratings when playing hurt
  isRecurring: boolean;
}

// ── Draft Prospect ──────────────────────────────────────────────────

export interface DraftProspect {
  id: PlayerId;
  firstName: string;
  lastName: string;
  age: number;
  position: Position;
  college: string;

  /** What your scouting has revealed (starts wide, narrows with investment) */
  scoutingReport: ScoutingReport;

  /** True attributes, hidden until drafted or fully scouted */
  hidden: HiddenAttributes;
  physical: PhysicalRatings;
  personality: PersonalityTraits;

  passing?: PassingRatings;
  rushing?: RushingRatings;
  receiving?: ReceivingRatings;
  blocking?: BlockingRatings;
  defense?: DefenseRatings;
  kicking?: KickingRatings;
  punting?: PuntingRatings;

  combineResults?: CombineResults;
}

export interface ScoutingReport {
  overallRange: [number, number]; // [low, high] confidence interval
  strengthNotes: string[];
  weaknessNotes: string[];
  comparisonPlayer: string | null;
  grade: 'A' | 'B' | 'C' | 'D' | 'F' | null;
  scoutingInvestment: number;     // 0-100, how much you've invested in scouting this player
  confidenceLevel: number;        // 0-100, how narrow the range is
}

export interface CombineResults {
  fortyYardDash: number | null;
  benchPress: number | null;
  verticalJump: number | null;
  broadJump: number | null;
  threeConeDrill: number | null;
  twentyYardShuttle: number | null;
}

// ── Progression ─────────────────────────────────────────────────────

export interface ProgressionCurve {
  position: Position;
  peakAgeStart: number;   // age when peak begins
  peakAgeEnd: number;     // age when decline begins
  growthRate: number;     // annual improvement rate during growth
  declineRate: number;    // annual decline rate after peak
}
