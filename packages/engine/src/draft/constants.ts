import type { Position } from '../types/player.js';

export const PROSPECT_COUNT = 300;

export const TALENT_TIERS = {
  elite:      { count: 5,   overallMin: 85, overallMax: 99 },
  firstRound: { count: 25,  overallMin: 75, overallMax: 84 },
  dayTwo:     { count: 60,  overallMin: 65, overallMax: 74 },
  dayThree:   { count: 100, overallMin: 55, overallMax: 64 },
  priority:   { count: 110, overallMin: 35, overallMax: 54 },
} as const;

export type TalentTier = keyof typeof TALENT_TIERS;

export const POSITION_WEIGHTS: Record<Position, number> = {
  QB: 12, RB: 14, FB: 3, WR: 28, TE: 12,
  LT: 12, LG: 10, C: 8, RG: 10, RT: 12,
  DE: 18, DT: 14, NT: 6, OLB: 14, ILB: 12, MLB: 8,
  CB: 24, FS: 10, SS: 10,
  K: 4, P: 4, LS: 2,
};

export const BUST_GEM_RATE = 0.10;
export const BUST_DEVIATION = -15;
export const GEM_DEVIATION = 15;

export const MAX_SCOUTING_INVESTMENT = 100;

export type VisitType =
  | 'film_review'
  | 'campus_visit'
  | 'private_workout'
  | 'formal_interview'
  | 'medical_check'
  | 'background_check';

export interface VisitEffect {
  investmentGain: [number, number];
  gradeNarrowing: number;
  reveals: readonly string[];
}

export const VISIT_EFFECTS: Record<VisitType, VisitEffect> = {
  film_review: {
    investmentGain: [10, 15],
    gradeNarrowing: 0.5,
    reveals: ['rawAbilityNotes', 'productionNotes', 'strengths', 'weaknesses'],
  },
  campus_visit: {
    investmentGain: [8, 12],
    gradeNarrowing: 0.3,
    reveals: ['criticalFactors', 'personality_hints'],
  },
  private_workout: {
    investmentGain: [10, 15],
    gradeNarrowing: 0.6,
    reveals: ['rawAbilityNotes', 'physical_detail'],
  },
  formal_interview: {
    investmentGain: [8, 12],
    gradeNarrowing: 0.2,
    reveals: ['characterGrade', 'leadershipProjection', 'characterNotes'],
  },
  medical_check: {
    investmentGain: [8, 10],
    gradeNarrowing: 0.1,
    reveals: ['medicalFlag', 'medicalNotes'],
  },
  background_check: {
    investmentGain: [8, 10],
    gradeNarrowing: 0.1,
    reveals: ['characterGrade', 'characterNotes'],
  },
};

export const CONFIDENCE_THRESHOLDS = {
  ceilingFloor: 40,
  comparisonPlayer: 50,
  readyToContribute: 60,
  overallGrade: 70,
} as const;

export interface CombineRange {
  fortyMin: number;
  fortyMax: number;
  benchMin: number;
  benchMax: number;
  vertMin: number;
  vertMax: number;
  broadMin: number;
  broadMax: number;
  coneMin: number;
  coneMax: number;
  shuttleMin: number;
  shuttleMax: number;
}

const defaultRange: CombineRange = {
  fortyMin: 4.30, fortyMax: 5.20,
  benchMin: 8, benchMax: 35,
  vertMin: 24, vertMax: 42,
  broadMin: 96, broadMax: 134,
  coneMin: 6.50, coneMax: 7.80,
  shuttleMin: 3.90, shuttleMax: 4.70,
};

const speedRange: CombineRange = {
  fortyMin: 4.20, fortyMax: 4.70,
  benchMin: 8, benchMax: 22,
  vertMin: 30, vertMax: 44,
  broadMin: 110, broadMax: 140,
  coneMin: 6.30, coneMax: 7.10,
  shuttleMin: 3.80, shuttleMax: 4.30,
};

const powerRange: CombineRange = {
  fortyMin: 4.70, fortyMax: 5.50,
  benchMin: 20, benchMax: 40,
  vertMin: 24, vertMax: 36,
  broadMin: 90, broadMax: 118,
  coneMin: 7.00, coneMax: 8.00,
  shuttleMin: 4.20, shuttleMax: 4.90,
};

export const COMBINE_RANGES: Record<Position, CombineRange> = {
  QB: { ...defaultRange, fortyMin: 4.50, fortyMax: 5.10, benchMin: 10, benchMax: 25 },
  RB: { ...speedRange, benchMin: 12, benchMax: 28 },
  FB: { ...powerRange, fortyMin: 4.50, fortyMax: 5.00 },
  WR: speedRange,
  TE: { ...defaultRange, fortyMin: 4.40, fortyMax: 4.90, benchMin: 15, benchMax: 30 },
  LT: powerRange,
  LG: powerRange,
  C: powerRange,
  RG: powerRange,
  RT: powerRange,
  DE: { ...defaultRange, fortyMin: 4.40, fortyMax: 5.00, benchMin: 18, benchMax: 35 },
  DT: powerRange,
  NT: { ...powerRange, benchMin: 25, benchMax: 42 },
  OLB: { ...defaultRange, fortyMin: 4.40, fortyMax: 4.90, benchMin: 15, benchMax: 28 },
  ILB: { ...defaultRange, fortyMin: 4.45, fortyMax: 4.95, benchMin: 16, benchMax: 30 },
  MLB: { ...defaultRange, fortyMin: 4.50, fortyMax: 5.00, benchMin: 16, benchMax: 30 },
  CB: speedRange,
  FS: speedRange,
  SS: { ...speedRange, benchMin: 12, benchMax: 25 },
  K: { ...defaultRange, fortyMin: 4.60, fortyMax: 5.30 },
  P: { ...defaultRange, fortyMin: 4.60, fortyMax: 5.30 },
  LS: { ...defaultRange, fortyMin: 4.70, fortyMax: 5.40 },
};

export const GRADE_THRESHOLDS: [number, number][] = [
  [9.0, 90],
  [8.0, 80],
  [7.0, 70],
  [6.5, 65],
  [6.0, 58],
  [5.5, 50],
  [5.0, 42],
  [4.0, 0],
];

export function overallToScoutGrade(overall: number): 9.0 | 8.0 | 7.0 | 6.5 | 6.0 | 5.5 | 5.0 | 4.0 {
  for (const [grade, threshold] of GRADE_THRESHOLDS) {
    if (overall >= threshold) return grade as 9.0 | 8.0 | 7.0 | 6.5 | 6.0 | 5.5 | 5.0 | 4.0;
  }
  return 4.0;
}

export function overallToGradeValue(overall: number): number {
  return 4.0 + ((overall - 30) / 70) * 5.0;
}

export function gradeValueToOverall(grade: number): number {
  return 30 + ((grade - 4.0) / 5.0) * 70;
}

export const COMPARISON_PLAYERS: Record<string, string[]> = {
  QB: ['a mobile dual-threat passer', 'a prototypical pocket passer', 'a quick-release timing QB', 'a gunslinger with big arm'],
  RB: ['a patient zone runner', 'a downhill power back', 'a versatile three-down back', 'an explosive home-run hitter'],
  WR: ['a smooth route technician', 'a contested-catch X receiver', 'a shifty slot weapon', 'a deep-threat speedster'],
  TE: ['a move tight end', 'an inline blocking TE', 'a matchup nightmare at TE', 'a versatile Y tight end'],
  OL: ['a mauler in the run game', 'a technician in pass protection', 'a versatile interior lineman', 'a road-grading tackle'],
  DL: ['a disruptive interior presence', 'a speed rusher off the edge', 'a space-eating nose tackle', 'a high-motor defensive end'],
  LB: ['a sideline-to-sideline linebacker', 'a thumper at the point of attack', 'a coverage linebacker', 'a blitz-first edge defender'],
  DB: ['a lockdown man corner', 'a ball-hawking free safety', 'a versatile slot defender', 'a hard-hitting box safety'],
  K: ['a strong-legged kicker', 'a reliable accuracy-first kicker'],
  P: ['a booming directional punter', 'a hang-time specialist'],
  LS: ['a consistent long snapper'],
};

export function getPositionGroup(position: Position): string {
  if (['LT', 'LG', 'C', 'RG', 'RT'].includes(position)) return 'OL';
  if (['DE', 'DT', 'NT'].includes(position)) return 'DL';
  if (['OLB', 'ILB', 'MLB'].includes(position)) return 'LB';
  if (['CB', 'FS', 'SS'].includes(position)) return 'DB';
  return position;
}
