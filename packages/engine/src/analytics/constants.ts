import type { ScoutGrade, Position } from '../types/player.js';

// ── Analytics Tier Definitions ─────────────────────────────────────

export interface AnalyticsTier {
  level: number;
  label: string;
  noiseMultiplier: number;
  capProjectionYears: number;
  injuryAccuracy: number;
  investmentCost: number;
  capErrorMarginPct: number;
}

export const ANALYTICS_TIERS: readonly AnalyticsTier[] = [
  { level: 1, label: 'Minimal',  noiseMultiplier: 2.0, capProjectionYears: 1, injuryAccuracy: 0.30, investmentCost: 0,          capErrorMarginPct: 0.25 },
  { level: 2, label: 'Basic',    noiseMultiplier: 1.5, capProjectionYears: 1, injuryAccuracy: 0.45, investmentCost: 2_000_000,  capErrorMarginPct: 0.18 },
  { level: 3, label: 'Average',  noiseMultiplier: 1.0, capProjectionYears: 2, injuryAccuracy: 0.60, investmentCost: 5_000_000,  capErrorMarginPct: 0.12 },
  { level: 4, label: 'Advanced', noiseMultiplier: 0.6, capProjectionYears: 3, injuryAccuracy: 0.80, investmentCost: 10_000_000, capErrorMarginPct: 0.07 },
  { level: 5, label: 'Elite',    noiseMultiplier: 0.3, capProjectionYears: 5, injuryAccuracy: 0.95, investmentCost: 20_000_000, capErrorMarginPct: 0.03 },
] as const;

// ── Noise Parameters ───────────────────────────────────────────────

export const BASE_GRADE_NOISE = 0.75;
export const BASE_SCHEME_FIT_NOISE = 0.8;
export const INVESTMENT_NARROWING_FACTOR = 0.007;

// ── Confidence ─────────────────────────────────────────────────────

export const CONFIDENCE_BASE_BY_TIER = [10, 25, 45, 65, 80] as const;

// ── Scout Grade Scale ──────────────────────────────────────────────

export const VALID_SCOUT_GRADES: readonly ScoutGrade[] = [4.0, 5.0, 5.5, 6.0, 6.5, 7.0, 8.0, 9.0];

export const GRADE_FLOOR = 4.0;
export const GRADE_CEILING = 9.0;

export function mapOverallToGrade(trueOverall: number): number {
  return GRADE_FLOOR + (trueOverall / 99) * (GRADE_CEILING - GRADE_FLOOR);
}

export function snapToScoutGrade(grade: number): ScoutGrade {
  let best = VALID_SCOUT_GRADES[0]!;
  let bestDist = Math.abs(grade - best);
  for (const g of VALID_SCOUT_GRADES) {
    const dist = Math.abs(grade - g);
    if (dist < bestDist) {
      best = g;
      bestDist = dist;
    }
  }
  return best;
}

// ── Visit Type Definitions ─────────────────────────────────────────

export type VisitType =
  | 'film_review'
  | 'campus_visit'
  | 'private_workout'
  | 'formal_interview'
  | 'medical_check'
  | 'background_check';

export interface VisitEffect {
  investmentBoost: number;
  confidenceBoost: number;
  narrowsGradeRange: boolean;
  improvesStrengthsWeaknesses: boolean;
  improvesProductionNotes: boolean;
  improvesRawAbilityNotes: boolean;
  improvesSchemeFitGrades: boolean;
  revealsCharacterGrade: boolean;
  improvesLeadershipProjection: boolean;
  mayRevealComparison: boolean;
  revealsMedical: boolean;
  improvesCharacterNotes: boolean;
}

export const VISIT_TYPE_EFFECTS: Record<VisitType, VisitEffect> = {
  film_review: {
    investmentBoost: 15,
    confidenceBoost: 10,
    narrowsGradeRange: true,
    improvesStrengthsWeaknesses: true,
    improvesProductionNotes: false,
    improvesRawAbilityNotes: false,
    improvesSchemeFitGrades: false,
    revealsCharacterGrade: false,
    improvesLeadershipProjection: false,
    mayRevealComparison: false,
    revealsMedical: false,
    improvesCharacterNotes: false,
  },
  campus_visit: {
    investmentBoost: 12,
    confidenceBoost: 8,
    narrowsGradeRange: false,
    improvesStrengthsWeaknesses: false,
    improvesProductionNotes: true,
    improvesRawAbilityNotes: true,
    improvesSchemeFitGrades: false,
    revealsCharacterGrade: false,
    improvesLeadershipProjection: false,
    mayRevealComparison: false,
    revealsMedical: false,
    improvesCharacterNotes: false,
  },
  private_workout: {
    investmentBoost: 18,
    confidenceBoost: 12,
    narrowsGradeRange: false,
    improvesStrengthsWeaknesses: false,
    improvesProductionNotes: false,
    improvesRawAbilityNotes: true,
    improvesSchemeFitGrades: true,
    revealsCharacterGrade: false,
    improvesLeadershipProjection: false,
    mayRevealComparison: false,
    revealsMedical: false,
    improvesCharacterNotes: false,
  },
  formal_interview: {
    investmentBoost: 10,
    confidenceBoost: 10,
    narrowsGradeRange: false,
    improvesStrengthsWeaknesses: false,
    improvesProductionNotes: false,
    improvesRawAbilityNotes: false,
    improvesSchemeFitGrades: false,
    revealsCharacterGrade: true,
    improvesLeadershipProjection: true,
    mayRevealComparison: true,
    revealsMedical: false,
    improvesCharacterNotes: false,
  },
  medical_check: {
    investmentBoost: 8,
    confidenceBoost: 5,
    narrowsGradeRange: false,
    improvesStrengthsWeaknesses: false,
    improvesProductionNotes: false,
    improvesRawAbilityNotes: false,
    improvesSchemeFitGrades: false,
    revealsCharacterGrade: false,
    improvesLeadershipProjection: false,
    mayRevealComparison: false,
    revealsMedical: true,
    improvesCharacterNotes: false,
  },
  background_check: {
    investmentBoost: 10,
    confidenceBoost: 8,
    narrowsGradeRange: false,
    improvesStrengthsWeaknesses: false,
    improvesProductionNotes: false,
    improvesRawAbilityNotes: false,
    improvesSchemeFitGrades: false,
    revealsCharacterGrade: true,
    improvesLeadershipProjection: false,
    mayRevealComparison: false,
    revealsMedical: false,
    improvesCharacterNotes: true,
  },
};

// ── Comparison Player Banks ────────────────────────────────────────
// Fictional archetypes per position group. Avoids hardcoding real names.

export const COMPARISON_PLAYER_BANK: Partial<Record<Position, string[]>> = {
  QB: [
    'a pocket-passing field general',
    'a dual-threat playmaker',
    'a gunslinger with elite arm talent',
    'a cerebral game-manager type',
    'a mobile QB who extends plays',
    'a deep-ball specialist',
  ],
  RB: [
    'a power back who punishes defenders',
    'a shifty scatback with home-run speed',
    'a three-down workhorse',
    'a receiving-back who wins in space',
    'a patient zone runner with great vision',
    'a downhill bruiser with deceptive burst',
  ],
  FB: [
    'a lead-blocking fullback with receiving upside',
    'a punishing short-yardage specialist',
  ],
  WR: [
    'an elite route-running technician',
    'a deep-threat burner with vertical speed',
    'a big-bodied contested-catch specialist',
    'a versatile slot weapon',
    'a yards-after-catch playmaker',
    'a precise route runner with reliable hands',
  ],
  TE: [
    'a dual-threat tight end who can block and catch',
    'a move tight end who lines up all over',
    'a traditional inline blocking tight end',
    'a matchup nightmare in the seam',
    'a hybrid receiver-tight end',
  ],
  LT: ['a premier blind-side protector', 'an athletic pass protector with quick feet', 'a road-grading run blocker'],
  LG: ['a powerful interior mauler', 'an athletic pulling guard', 'a versatile interior lineman'],
  C:  ['a cerebral pivot who anchors the line', 'an athletic center who excels in zone schemes'],
  RG: ['a powerful interior mauler', 'a nasty run-blocking guard', 'a balanced interior lineman'],
  RT: ['a physical right tackle with long arms', 'a dependable right tackle with plus pass protection'],
  DE: [
    'an explosive edge rusher',
    'a versatile defensive end who sets the edge',
    'a speed rusher with a devastating first step',
    'a power rusher who converts speed to power',
  ],
  DT: [
    'a disruptive interior pass rusher',
    'a space-eating nose tackle',
    'a penetrating 3-technique',
    'a run-stuffing anchor on the interior',
  ],
  NT: [
    'a massive space-eating nose tackle',
    'an immovable run-plugger',
  ],
  OLB: [
    'a sideline-to-sideline playmaker',
    'a versatile edge setter who can rush and drop',
    'a pass-rushing specialist off the edge',
    'a coverage linebacker who can match tight ends',
  ],
  ILB: [
    'a downhill thumper who fills gaps',
    'a rangy coverage linebacker',
    'a three-down linebacker with instincts',
    'a sideline-to-sideline run defender',
  ],
  MLB: [
    'a field general who quarterbacks the defense',
    'a run-stuffing middle linebacker',
    'a well-rounded three-down linebacker',
  ],
  CB: [
    'a shutdown man-coverage corner',
    'a physical press corner with length',
    'a zone-savvy ballhawk',
    'a versatile corner who can play inside or outside',
    'a quick-twitch slot corner',
  ],
  FS: [
    'a rangy centerfielder with ball skills',
    'a playmaking safety who covers ground',
    'a disciplined zone safety with good instincts',
  ],
  SS: [
    'a hard-hitting enforcer in the box',
    'a versatile safety who can play in the box or cover',
    'a physical run-support safety',
  ],
  K:  ['a reliable kicker with a strong leg', 'a clutch leg with range'],
  P:  ['a booming punter who controls field position', 'a directional punter with hang time'],
  LS: ['a dependable long snapper'],
};

// ── Summary Templates ──────────────────────────────────────────────

export function getGradeBracketLabel(midGrade: number): string {
  if (midGrade >= 8.5) return 'Generational talent with perennial All-Pro potential';
  if (midGrade >= 7.5) return 'Pro Bowl-caliber player and impact starter';
  if (midGrade >= 6.75) return 'Solid starter who can anchor a position group';
  if (midGrade >= 6.25) return 'Low-end starter or high-quality backup';
  if (midGrade >= 5.75) return 'Quality backup and core special teamer';
  if (midGrade >= 5.25) return 'Developmental prospect with upside';
  if (midGrade >= 4.5) return 'Priority free agent or practice squad candidate';
  return 'Limited prospect unlikely to stick on a roster';
}

// ── Ceiling / Floor Projection Text Templates ──────────────────────

export function getCeilingText(ceilingGrade: number, position: Position): string {
  if (ceilingGrade >= 8.5) return `Perennial All-Pro ${position} who dominates the position`;
  if (ceilingGrade >= 7.5) return `Multiple Pro Bowl selections as a top-tier ${position}`;
  if (ceilingGrade >= 6.75) return `Reliable long-term starter at ${position}`;
  if (ceilingGrade >= 6.0)  return `Competent starter at ${position} in the right system`;
  return `Rotational contributor at ${position} if development goes well`;
}

export function getFloorText(floorGrade: number, position: Position): string {
  if (floorGrade >= 7.0) return `At worst, a quality starter at ${position}`;
  if (floorGrade >= 6.0) return `Floor is a quality backup ${position} and special teams contributor`;
  if (floorGrade >= 5.0) return `Floor is a backup/special teams role at ${position}`;
  return `Risk of not sticking on an NFL roster at ${position}`;
}

// ── Injury Risk Category Banks ─────────────────────────────────────

export const INJURY_RISK_CATEGORIES_BY_POSITION: Partial<Record<Position, string[]>> = {
  QB:  ['shoulder', 'elbow', 'lower back', 'concussion'],
  RB:  ['hamstring', 'knee (ACL)', 'ankle', 'soft tissue'],
  FB:  ['shoulder', 'knee', 'neck'],
  WR:  ['hamstring', 'ankle', 'knee (ACL)', 'foot'],
  TE:  ['knee', 'ankle', 'concussion', 'shoulder'],
  LT:  ['knee', 'ankle', 'back', 'foot'],
  LG:  ['knee', 'ankle', 'back', 'foot'],
  C:   ['knee', 'ankle', 'back', 'neck'],
  RG:  ['knee', 'ankle', 'back', 'foot'],
  RT:  ['knee', 'ankle', 'back', 'foot'],
  DE:  ['shoulder', 'knee', 'ankle', 'back'],
  DT:  ['knee', 'shoulder', 'back', 'ankle'],
  NT:  ['knee', 'shoulder', 'back'],
  OLB: ['hamstring', 'knee', 'shoulder', 'ankle'],
  ILB: ['knee', 'shoulder', 'concussion', 'hamstring'],
  MLB: ['knee', 'shoulder', 'concussion', 'hamstring'],
  CB:  ['hamstring', 'groin', 'ankle', 'knee'],
  FS:  ['hamstring', 'shoulder', 'knee', 'concussion'],
  SS:  ['shoulder', 'knee', 'concussion', 'hamstring'],
  K:   ['hip', 'groin', 'knee'],
  P:   ['hip', 'groin', 'knee'],
  LS:  ['shoulder', 'wrist'],
};

// ── Cap Projection Constants ───────────────────────────────────────

export const CAP_GROWTH_RATE = 0.07;
