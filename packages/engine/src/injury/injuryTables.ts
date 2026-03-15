import type { PositionGroup } from '../types/index.js';

export const BASE_INJURY_RATES: Record<PositionGroup, number> = {
  RB: 0.045,
  OL: 0.035,
  WR: 0.035,
  TE: 0.035,
  DL: 0.035,
  LB: 0.035,
  DB: 0.03,
  QB: 0.025,
  K: 0.005,
  P: 0.005,
  ST: 0.01,
};

export type InjurySeverity = 'minor' | 'moderate' | 'severe' | 'season_ending';

export const SEVERITY_WEIGHTS: { item: InjurySeverity; weight: number }[] = [
  { item: 'minor', weight: 50 },
  { item: 'moderate', weight: 30 },
  { item: 'severe', weight: 15 },
  { item: 'season_ending', weight: 5 },
];

export const SEVERITY_WEEKS: Record<InjurySeverity, [min: number, max: number]> = {
  minor: [1, 2],
  moderate: [3, 6],
  severe: [6, 12],
  season_ending: [16, 16],
};

export type BodyPart = 'shoulder' | 'knee' | 'ankle' | 'hamstring' | 'concussion' | 'back' | 'hand' | 'foot' | 'elbow' | 'groin' | 'calf' | 'rib';

export const POSITION_BODY_PARTS: Record<PositionGroup, { item: BodyPart; weight: number }[]> = {
  QB: [
    { item: 'shoulder', weight: 30 },
    { item: 'knee', weight: 25 },
    { item: 'concussion', weight: 20 },
    { item: 'hand', weight: 15 },
    { item: 'ankle', weight: 10 },
  ],
  RB: [
    { item: 'ankle', weight: 25 },
    { item: 'knee', weight: 25 },
    { item: 'hamstring', weight: 20 },
    { item: 'shoulder', weight: 15 },
    { item: 'concussion', weight: 15 },
  ],
  WR: [
    { item: 'hamstring', weight: 30 },
    { item: 'knee', weight: 25 },
    { item: 'ankle', weight: 20 },
    { item: 'groin', weight: 15 },
    { item: 'concussion', weight: 10 },
  ],
  TE: [
    { item: 'knee', weight: 30 },
    { item: 'ankle', weight: 25 },
    { item: 'shoulder', weight: 20 },
    { item: 'concussion', weight: 15 },
    { item: 'hamstring', weight: 10 },
  ],
  OL: [
    { item: 'knee', weight: 30 },
    { item: 'back', weight: 25 },
    { item: 'concussion', weight: 15 },
    { item: 'ankle', weight: 15 },
    { item: 'shoulder', weight: 15 },
  ],
  DL: [
    { item: 'knee', weight: 30 },
    { item: 'ankle', weight: 20 },
    { item: 'shoulder', weight: 20 },
    { item: 'back', weight: 15 },
    { item: 'concussion', weight: 15 },
  ],
  LB: [
    { item: 'knee', weight: 25 },
    { item: 'hamstring', weight: 25 },
    { item: 'ankle', weight: 20 },
    { item: 'concussion', weight: 15 },
    { item: 'shoulder', weight: 15 },
  ],
  DB: [
    { item: 'hamstring', weight: 30 },
    { item: 'knee', weight: 25 },
    { item: 'ankle', weight: 20 },
    { item: 'groin', weight: 15 },
    { item: 'concussion', weight: 10 },
  ],
  K: [
    { item: 'hamstring', weight: 30 },
    { item: 'groin', weight: 25 },
    { item: 'knee', weight: 20 },
    { item: 'back', weight: 15 },
    { item: 'ankle', weight: 10 },
  ],
  P: [
    { item: 'hamstring', weight: 30 },
    { item: 'groin', weight: 25 },
    { item: 'knee', weight: 20 },
    { item: 'back', weight: 15 },
    { item: 'ankle', weight: 10 },
  ],
  ST: [
    { item: 'knee', weight: 25 },
    { item: 'ankle', weight: 25 },
    { item: 'hamstring', weight: 20 },
    { item: 'concussion', weight: 15 },
    { item: 'shoulder', weight: 15 },
  ],
};

export const BODY_PART_INJURY_NAMES: Record<BodyPart, string[]> = {
  shoulder: ['rotator cuff tear', 'shoulder separation', 'dislocated shoulder', 'labrum tear'],
  knee: ['ACL tear', 'MCL sprain', 'meniscus tear', 'knee contusion'],
  ankle: ['high ankle sprain', 'ankle sprain', 'ankle fracture', 'Achilles strain'],
  hamstring: ['hamstring strain', 'hamstring tear', 'hamstring tightness', 'hamstring pull'],
  concussion: ['concussion (grade 1)', 'concussion (grade 2)', 'concussion (grade 3)'],
  back: ['herniated disc', 'back sprain', 'lower back strain', 'spinal contusion'],
  hand: ['broken finger', 'hand fracture', 'thumb sprain', 'dislocated finger'],
  foot: ['Lisfranc injury', 'turf toe', 'stress fracture', 'plantar fasciitis'],
  elbow: ['UCL sprain', 'hyperextended elbow', 'elbow contusion'],
  groin: ['groin strain', 'groin pull', 'sports hernia'],
  calf: ['calf strain', 'calf contusion', 'calf tear'],
  rib: ['bruised ribs', 'cracked rib', 'rib cartilage injury'],
};

export const RECURRING_PENALTY_MULTIPLIER = 1.25;
export const RECURRING_WINDOW_SEASONS = 2;
