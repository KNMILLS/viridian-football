import { createLCG, randomInt, normalRandom, clamp, weightedChoice, chance } from '../sim/RNG.js';
import type { RNG } from '../sim/RNG.js';
import type {
  DraftProspect, PhysicalRatings, PersonalityTraits, HiddenAttributes,
  Position, ScoutingReport,
} from '../types/player.js';
import { playerId } from '../types/ids.js';
import { COLLEGES, FIRST_NAMES, LAST_NAMES } from '../league/teamData.js';
import {
  PROSPECT_COUNT, TALENT_TIERS, POSITION_WEIGHTS, BUST_GEM_RATE,
  BUST_DEVIATION, GEM_DEVIATION, overallToGradeValue,
  type TalentTier,
} from './constants.js';

export function generateDraftClass(season: number, seed: number): DraftProspect[] {
  const rng = createLCG(seed);
  const prospects: DraftProspect[] = [];

  const tiers = expandTiers();
  for (let i = 0; i < PROSPECT_COUNT; i++) {
    const tier = tiers[i]!;
    const prospect = generateProspect(rng, season, i, tier);
    prospects.push(prospect);
  }

  return prospects;
}

function expandTiers(): TalentTier[] {
  const result: TalentTier[] = [];
  for (const [tier, config] of Object.entries(TALENT_TIERS)) {
    for (let i = 0; i < config.count; i++) {
      result.push(tier as TalentTier);
    }
  }
  return result;
}

function generateProspect(rng: RNG, season: number, index: number, tier: TalentTier): DraftProspect {
  const position = pickPosition(rng);
  const tierConfig = TALENT_TIERS[tier];
  const trueOverall = randomInt(rng, tierConfig.overallMin, tierConfig.overallMax);

  const isBustOrGem = chance(rng, BUST_GEM_RATE);
  let adjustedOverall = trueOverall;
  let physicalTierLabel = tier;

  if (isBustOrGem) {
    if (chance(rng, 0.5)) {
      adjustedOverall = clamp(trueOverall + BUST_DEVIATION, 30, 99);
      physicalTierLabel = bumpTierUp(tier);
    } else {
      adjustedOverall = clamp(trueOverall + GEM_DEVIATION, 30, 99);
      physicalTierLabel = bumpTierDown(tier);
    }
  }

  const physical = generatePhysicalRatings(rng, position, physicalTierLabel);
  const personality = generatePersonality(rng);
  const hidden = generateHiddenAttributes(rng, adjustedOverall);
  const skillRatings = generateSkillRatings(rng, position, physicalTierLabel);
  const age = position === 'QB' ? randomInt(rng, 21, 23) : randomInt(rng, 20, 23);

  const scoutingReport = generateInitialScoutingReport(rng, adjustedOverall);

  return {
    id: playerId(`prospect-${season}-${index}`),
    firstName: FIRST_NAMES[randomInt(rng, 0, FIRST_NAMES.length - 1)]!,
    lastName: LAST_NAMES[randomInt(rng, 0, LAST_NAMES.length - 1)]!,
    age,
    position,
    college: COLLEGES[randomInt(rng, 0, COLLEGES.length - 1)]!,
    scoutingReport,
    hidden,
    physical,
    personality,
    ...skillRatings,
  };
}

function pickPosition(rng: RNG): Position {
  const items = Object.entries(POSITION_WEIGHTS).map(([pos, weight]) => ({
    item: pos as Position,
    weight,
  }));
  return weightedChoice(rng, items);
}

function bumpTierUp(tier: TalentTier): TalentTier {
  const order: TalentTier[] = ['priority', 'dayThree', 'dayTwo', 'firstRound', 'elite'];
  const idx = order.indexOf(tier);
  return order[Math.min(idx + 1, order.length - 1)]!;
}

function bumpTierDown(tier: TalentTier): TalentTier {
  const order: TalentTier[] = ['priority', 'dayThree', 'dayTwo', 'firstRound', 'elite'];
  const idx = order.indexOf(tier);
  return order[Math.max(idx - 1, 0)]!;
}

function generatePhysicalRatings(rng: RNG, position: Position, tier: TalentTier): PhysicalRatings {
  const base = tier === 'elite' ? 82 : tier === 'firstRound' ? 75 :
    tier === 'dayTwo' ? 65 : tier === 'dayThree' ? 55 : 45;
  const variance = 12;
  const r = () => clamp(Math.round(normalRandom(rng, base, variance)), 25, 99);

  const physical: PhysicalRatings = {
    speed: r(), acceleration: r(), strength: r(),
    agility: r(), jumping: r(), stamina: r(), toughness: r(),
  };

  if (['WR', 'CB', 'RB', 'FS', 'SS'].includes(position)) {
    physical.speed = clamp(physical.speed + 10, 25, 99);
    physical.agility = clamp(physical.agility + 8, 25, 99);
  }
  if (['DT', 'DE', 'NT', 'LT', 'LG', 'C', 'RG', 'RT'].includes(position)) {
    physical.strength = clamp(physical.strength + 12, 25, 99);
  }

  return physical;
}

function generatePersonality(rng: RNG): PersonalityTraits {
  const ego = randomInt(rng, 10, 90);
  const leadership = randomInt(rng, 20, 95);
  return {
    leadership,
    workEthic: randomInt(rng, 25, 99),
    ego,
    coachability: randomInt(rng, 30, 95),
    competitiveness: randomInt(rng, 40, 99),
    composure: randomInt(rng, 30, 95),
    loyalty: randomInt(rng, 20, 90),
    greed: randomInt(rng, 10, 85),
    legacyDrive: randomInt(rng, 15, 90),
    fameSeeking: randomInt(rng, 5, 80),
    familyOriented: randomInt(rng, 20, 90),
    teamChemistryEffect: randomInt(rng, 30, 95),
    prankster: randomInt(rng, 5, 70),
    loner: randomInt(rng, 5, 60),
    mentorWillingness: clamp(leadership - randomInt(rng, 0, 20), 10, 99),
    respectForVeterans: randomInt(rng, 30, 95),
    aggression: randomInt(rng, 15, 85),
    discipline: randomInt(rng, 25, 95),
    motorEffort: randomInt(rng, 40, 99),
    footballIQ: randomInt(rng, 30, 99),
    filmStudyDedication: randomInt(rng, 20, 95),
    offFieldRisk: randomInt(rng, 0, 50),
    mediaHandling: weightedChoice(rng, [
      { item: 'shy' as const, weight: 20 },
      { item: 'professional' as const, weight: 45 },
      { item: 'outspoken' as const, weight: 25 },
      { item: 'volatile' as const, weight: 10 },
    ]),
    communityEngagement: randomInt(rng, 10, 95),
    durabilityMindset: randomInt(rng, 30, 95),
    resilience: randomInt(rng, 30, 95),
    confidenceVolatility: randomInt(rng, 10, 80),
    chipOnShoulder: randomInt(rng, 10, 85),
  };
}

function generateHiddenAttributes(rng: RNG, trueOverall: number): HiddenAttributes {
  return {
    trueOverall,
    injuryProneness: randomInt(rng, 10, 80),
    clutchFactor: randomInt(rng, 20, 95),
    consistencyVariance: randomInt(rng, 5, 40),
    ceilingFloor: [
      clamp(trueOverall - randomInt(rng, 5, 15), 25, 99),
      clamp(trueOverall + randomInt(rng, 3, 20), 25, 99),
    ],
    footballCharacter: randomInt(rng, 30, 99),
    schemeVersatility: randomInt(rng, 20, 90),
  };
}

function generateSkillRatings(rng: RNG, position: Position, tier: TalentTier): Partial<DraftProspect> {
  const base = tier === 'elite' ? 82 : tier === 'firstRound' ? 75 :
    tier === 'dayTwo' ? 65 : tier === 'dayThree' ? 55 : 45;
  const v = 12;
  const r = () => clamp(Math.round(normalRandom(rng, base, v)), 25, 99);

  const result: Partial<DraftProspect> = {};

  if (position === 'QB') {
    result.passing = { throwPower: r(), shortAccuracy: r(), mediumAccuracy: r(), deepAccuracy: r(), throwOnRun: r(), playAction: r() };
    result.rushing = { carrying: r(), breakTackle: r(), elusiveness: r(), ballCarrierVision: r(), trucking: r() };
  }
  if (['RB', 'FB'].includes(position)) {
    result.rushing = { carrying: r(), breakTackle: r(), elusiveness: r(), ballCarrierVision: r(), trucking: r() };
    result.receiving = { catching: r(), spectacularCatch: r(), catchInTraffic: r(), routeRunning: r(), release: r() };
    result.blocking = { runBlock: r(), passBlock: r(), impactBlock: r(), awareness: r() };
  }
  if (['WR', 'TE'].includes(position)) {
    result.receiving = { catching: r(), spectacularCatch: r(), catchInTraffic: r(), routeRunning: r(), release: r() };
    result.blocking = { runBlock: r(), passBlock: r(), impactBlock: r(), awareness: r() };
  }
  if (['LT', 'LG', 'C', 'RG', 'RT'].includes(position)) {
    result.blocking = { runBlock: r(), passBlock: r(), impactBlock: r(), awareness: r() };
  }
  if (['DE', 'DT', 'NT', 'OLB', 'ILB', 'MLB'].includes(position)) {
    result.defense = { tackling: r(), hitPower: r(), pursuit: r(), playRecognition: r(), manCoverage: r(), zoneCoverage: r(), press: r(), passRush: r(), blockShedding: r() };
  }
  if (['CB', 'FS', 'SS'].includes(position)) {
    result.defense = { tackling: r(), hitPower: r(), pursuit: r(), playRecognition: r(), manCoverage: r(), zoneCoverage: r(), press: r(), passRush: r(), blockShedding: r() };
  }
  if (position === 'K') {
    result.kicking = { kickPower: r(), kickAccuracy: r() };
  }
  if (position === 'P') {
    result.punting = { puntPower: r(), puntAccuracy: r() };
  }

  return result;
}

function generateInitialScoutingReport(rng: RNG, trueOverall: number): ScoutingReport {
  const centerGrade = overallToGradeValue(trueOverall);
  const noise = normalRandom(rng, 0, 1.0);
  const noisyCenter = clamp(centerGrade + noise, 4.0, 9.0);
  const halfWidth = 1.5;
  const low = Math.max(4.0, Math.round((noisyCenter - halfWidth) * 10) / 10);
  const high = Math.min(9.0, Math.round((noisyCenter + halfWidth) * 10) / 10);

  return {
    gradeRange: [low, high],
    overallGrade: null,
    scoutingInvestment: 0,
    confidenceLevel: 0,
    summary: null,
    strengths: [],
    weaknesses: [],
    rawAbilityNotes: null,
    productionNotes: null,
    schemeFitGrades: [],
    characterGrade: null,
    characterNotes: null,
    leadershipProjection: null,
    comparisonPlayer: null,
    comparisonConfidence: 0,
    ceilingProjection: null,
    floorProjection: null,
    readyToContribute: null,
    criticalFactors: [],
    medicalFlag: null,
    medicalNotes: null,
  };
}
