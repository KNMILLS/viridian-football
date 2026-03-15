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
// Rich enough that every player feels like a distinct individual with
// their own motivations, relationships, and behaviours.

export interface PersonalityTraits {
  // ── Core character ───────────────────────────────────────────────
  leadership: number;       // 0-99, locker room influence, captaincy material
  workEthic: number;        // affects progression rate and practice intensity
  ego: number;              // high ego + underpaid = holdout risk, diva behaviour
  coachability: number;     // scheme adaptation speed, willingness to accept coaching
  competitiveness: number;  // drive to win, intensity in close games
  composure: number;        // performance under pressure, big-game moments
  loyalty: number;          // willingness to take team-friendly deals, stays vs chases money

  // ── Motivation drivers ───────────────────────────────────────────
  greed: number;            // 0-99, prioritises money over winning/legacy
  legacyDrive: number;      // 0-99, motivated by championships, records, HOF
  fameSeeking: number;      // 0-99, chases media spotlight, endorsements, social media
  familyOriented: number;   // 0-99, prefers staying near family, may refuse relocation

  // ── Social / locker room ─────────────────────────────────────────
  teamChemistryEffect: number; // 0-99, how much the player lifts/drags teammates
  prankster: number;        // 0-99, keeps locker room loose, can annoy serious players
  loner: number;            // 0-99, prefers keeping to self, unaffected by team drama
  mentorWillingness: number;// 0-99, likelihood of taking young players under their wing
  respectForVeterans: number;// 0-99, rookies with low value may clash with vets

  // ── On-field behaviour ───────────────────────────────────────────
  aggression: number;       // 0-99, physicality, unnecessary roughness penalties
  discipline: number;       // 0-99, penalty avoidance (false starts, offsides, personal fouls)
  motorEffort: number;      // 0-99, plays through the whistle, hustle on every rep
  footballIQ: number;       // 0-99, pre-snap reads, audible recognition, assignment mastery
  filmStudyDedication: number; // 0-99, affects week-to-week preparation quality

  // ── Off-field / character ────────────────────────────────────────
  offFieldRisk: number;     // 0-99, higher = more likely off-field incidents/suspensions
  mediaHandling: 'shy' | 'professional' | 'outspoken' | 'volatile';
  communityEngagement: number; // 0-99, charity work, fan favourite, WPMOY candidate
  durabilityMindset: number;// 0-99, willingness to play through pain vs sit out

  // ── Adversity response ───────────────────────────────────────────
  resilience: number;       // 0-99, bounces back from benching, bad game, trade
  confidenceVolatility: number; // 0-99, high = streaky (hot/cold), low = steady
  chipOnShoulder: number;   // 0-99, extra motivation when disrespected (draft slide, cut, benched)
}

// ── Hidden Attributes (revealed through scouting) ───────────────────

export interface HiddenAttributes {
  trueOverall: number;           // actual talent level, fog-of-war hidden
  injuryProneness: number;       // higher = more injury risk
  clutchFactor: number;          // playoff/big game modifier
  consistencyVariance: number;   // game-to-game performance variability
  ceilingFloor: [number, number]; // [floor, ceiling] of progression
  footballCharacter: number;     // 0-99, "does he love football?" — impacts long-term motivation
  schemeVersatility: number;     // 0-99, how many schemes he can thrive in (not just current one)
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

// ── NFL-Style Scouting Report ───────────────────────────────────────
// Modelled after real NFL front-office evaluation sheets.
// Scouts never see a "78 overall"; they produce written assessments
// with grade ranges that narrow as more time is invested.

export type ScoutGrade =
  | 9.0  // generational / perennial All-Pro
  | 8.0  // Pro Bowl talent
  | 7.0  // solid starter
  | 6.5  // low-end starter / high backup
  | 6.0  // quality backup / core special teamer
  | 5.5  // developmental / camp body
  | 5.0  // priority free agent
  | 4.0; // not draftable

export interface ScoutingReport {
  /** Grade range narrows with more scouting investment */
  gradeRange: [number, number];   // e.g. [5.5, 7.0] before narrowing to [6.3, 6.7]
  overallGrade: ScoutGrade | null; // null until enough investment reveals a grade
  scoutingInvestment: number;     // 0-100, hours/resources invested
  confidenceLevel: number;        // 0-100, derived from investment + combine + interviews

  // ── Written evaluation (generated from attributes + investment) ──
  summary: string | null;         // 1-2 sentence executive summary
  strengths: ScoutingNote[];
  weaknesses: ScoutingNote[];
  rawAbilityNotes: string | null; // physical tools assessment
  productionNotes: string | null; // college production context

  // ── Scheme fit assessment ────────────────────────────────────────
  schemeFitGrades: SchemeFitGrade[];

  // ── Character / intangibles ──────────────────────────────────────
  characterGrade: 'green' | 'yellow' | 'red' | null; // team's character assessment
  characterNotes: string | null;
  leadershipProjection: string | null;

  // ── Comparison / projection ──────────────────────────────────────
  comparisonPlayer: string | null;     // "Plays like a young [X]"
  comparisonConfidence: number;        // 0-100, how confident in the comp
  ceilingProjection: string | null;    // best-case outcome description
  floorProjection: string | null;      // worst-case outcome description
  readyToContribute: 'day_one' | 'year_two' | 'developmental' | 'project' | null;

  // ── Critical factors ─────────────────────────────────────────────
  criticalFactors: CriticalFactor[];   // make-or-break traits
  medicalFlag: 'clear' | 'minor_concern' | 'major_concern' | null;
  medicalNotes: string | null;
}

export interface ScoutingNote {
  category: 'physical' | 'technical' | 'mental' | 'production' | 'intangible';
  text: string;
  confidence: number; // 0-100, how sure the scout is about this observation
}

export interface SchemeFitGrade {
  scheme: string;
  fitGrade: number;     // 1.0-9.0 scale, same as scouting grade
  notes: string | null;
}

export interface CriticalFactor {
  trait: string;         // e.g. "arm strength", "lateral agility", "character concerns"
  assessment: 'plus' | 'neutral' | 'minus';
  note: string;
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
