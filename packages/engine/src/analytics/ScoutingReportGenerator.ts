import { createLCG, normalRandom, randomInt, clamp } from '../sim/RNG.js';
import type { RNG } from '../sim/RNG.js';
import type {
  Player,
  DraftProspect,
  ScoutingReport,
  ScoutingNote,
  SchemeFitGrade,
  CriticalFactor,
  ScoutGrade,
  CombineResults,
} from '../types/player.js';
import type { Position } from '../types/player.js';
import type { CombinePerformance } from '../types/draft.js';
import { offensiveSchemeMappings } from '../coaching/schemeFitMappings.js';
import { defensiveSchemeMappings } from '../coaching/schemeFitMappings.js';
import type { OffensiveScheme, DefensiveScheme } from '../types/coach.js';
import {
  getNoiseMultiplier,
} from './AnalyticsDepartment.js';
import {
  BASE_GRADE_NOISE,
  BASE_SCHEME_FIT_NOISE,
  INVESTMENT_NARROWING_FACTOR,
  CONFIDENCE_BASE_BY_TIER,
  VISIT_TYPE_EFFECTS,
  COMPARISON_PLAYER_BANK,
  getGradeBracketLabel,
  getCeilingText,
  getFloorText,
  mapOverallToGrade,
  snapToScoutGrade,
  GRADE_FLOOR,
  GRADE_CEILING,
} from './constants.js';
import type { VisitType } from './constants.js';
import type { AttributeWeight, PositionWeightMap } from '../coaching/schemeFitMappings.js';

function clampTier(level: number): number {
  return Math.max(1, Math.min(5, Math.round(level)));
}

function getPlayerAttribute(
  player: Player | DraftProspect,
  ratingGroup: string,
  attribute: string,
): number {
  const group = player[ratingGroup as keyof typeof player];
  if (group && typeof group === 'object' && attribute in group) {
    return (group as unknown as Record<string, number>)[attribute] ?? 50;
  }
  return 50;
}

/** Compute scheme fit score 0-100 from weighted attributes, then map to 1.0-9.0. */
function computeSchemeFitScore(
  player: Player | DraftProspect,
  weights: AttributeWeight[],
): number {
  let sum = 0;
  let totalWeight = 0;
  for (const w of weights) {
    const val = getPlayerAttribute(player, w.ratingGroup, w.attribute);
    sum += val * w.weight;
    totalWeight += w.weight;
  }
  if (totalWeight === 0) return 5.0;
  const score0to100 = sum / totalWeight;
  return GRADE_FLOOR + (score0to100 / 99) * (GRADE_CEILING - GRADE_FLOOR);
}

function getSchemesForPosition(position: Position): { scheme: string; weights: AttributeWeight[] }[] {
  const out: { scheme: string; weights: AttributeWeight[] }[] = [];
  for (const [scheme, posMap] of Object.entries(offensiveSchemeMappings)) {
    const weights = (posMap as PositionWeightMap)[position];
    if (weights?.length) out.push({ scheme, weights });
  }
  for (const [scheme, posMap] of Object.entries(defensiveSchemeMappings)) {
    const weights = (posMap as PositionWeightMap)[position];
    if (weights?.length) out.push({ scheme, weights });
  }
  return out;
}

function generateSchemeFitGrades(
  player: Player | DraftProspect,
  rng: RNG,
  noiseMultiplier: number,
): SchemeFitGrade[] {
  const schemes = getSchemesForPosition(player.position);
  const result: SchemeFitGrade[] = [];
  for (const { scheme, weights } of schemes) {
    const trueFit = computeSchemeFitScore(player, weights);
    const noise = normalRandom(rng, 0, BASE_SCHEME_FIT_NOISE * noiseMultiplier);
    const fitGrade = clamp(trueFit + noise, 1.0, 9.0);
    result.push({ scheme, fitGrade, notes: null });
  }
  return result;
}

function collectRateableAttributes(player: Player | DraftProspect): { name: string; value: number; category: ScoutingNote['category'] }[] {
  const attrs: { name: string; value: number; category: ScoutingNote['category'] }[] = [];
  const add = (group: unknown, category: ScoutingNote['category']) => {
    if (!group || typeof group !== 'object') return;
    const rec = group as Record<string, unknown>;
    for (const [k, v] of Object.entries(rec)) {
      if (typeof v === 'number') attrs.push({ name: k, value: v, category });
    }
  };
  add(player.physical, 'physical');
  add(player.passing, 'technical');
  add(player.rushing, 'technical');
  add(player.receiving, 'technical');
  add(player.blocking, 'technical');
  add(player.defense, 'technical');
  return attrs;
}

function generateStrengths(player: Player | DraftProspect, rng: RNG, tier: number): ScoutingNote[] {
  const attrs = collectRateableAttributes(player).filter(a => a.value >= 60);
  attrs.sort((a, b) => b.value - a.value);
  const take = Math.min(3, attrs.length);
  const confidence = 40 + tier * 12 + randomInt(rng, 0, 15);
  const notes: ScoutingNote[] = [];
  const generic = ['Strong physical profile', 'Good technique base', 'Productive in college'];
  for (let i = 0; i < take; i++) {
    const a = attrs[i];
    const text = tier >= 3 && a
      ? `${a.name.replace(/([A-Z])/g, ' $1').trim().toLowerCase()} stands out (elite tier)`
      : generic[i % generic.length]!;
    notes.push({ category: a?.category ?? 'physical', text, confidence: clamp(confidence + rng() * 10, 0, 100) });
  }
  return notes.length ? notes : [{ category: 'physical', text: 'Athletic frame', confidence: 30 }];
}

function generateWeaknesses(player: Player | DraftProspect, rng: RNG, tier: number): ScoutingNote[] {
  const attrs = collectRateableAttributes(player).filter(a => a.value <= 75);
  attrs.sort((a, b) => a.value - b.value);
  const take = Math.min(3, attrs.length);
  const confidence = 35 + tier * 10 + randomInt(rng, 0, 15);
  const notes: ScoutingNote[] = [];
  const generic = ['Questionable technique in some areas', 'Needs development', 'Limited sample'];
  for (let i = 0; i < take; i++) {
    const a = attrs[i];
    const text = tier >= 3 && a
      ? `${a.name.replace(/([A-Z])/g, ' $1').trim().toLowerCase()} needs work`
      : generic[i % generic.length]!;
    notes.push({ category: a?.category ?? 'technical', text, confidence: clamp(confidence + rng() * 10, 0, 100) });
  }
  return notes.length ? notes : [{ category: 'technical', text: 'Needs refinement', confidence: 25 }];
}

function deriveCharacterGrade(player: Player | DraftProspect): 'green' | 'yellow' | 'red' {
  const risk = player.personality.offFieldRisk;
  const discipline = player.personality.discipline;
  const community = player.personality.communityEngagement;
  if (risk > 60 || discipline < 40) return 'red';
  if (risk > 35 || discipline < 60 || community < 40) return 'yellow';
  return 'green';
}

function deriveReadyToContribute(
  player: Player | DraftProspect,
  rng: RNG,
): ScoutingReport['readyToContribute'] {
  const fc = player.hidden.footballCharacter;
  const iq = player.personality.footballIQ;
  const age = player.age;
  const exp = 'experience' in player ? (player as Player).experience : 0;
  if (fc >= 80 && iq >= 75 && (exp > 0 || age >= 22)) return 'day_one';
  if (fc >= 65 && iq >= 60) return 'year_two';
  if (fc >= 50) return 'developmental';
  return 'project';
}

function generateCriticalFactors(player: Player | DraftProspect, rng: RNG, noiseMult: number): CriticalFactor[] {
  const attrs = collectRateableAttributes(player);
  if (attrs.length === 0) {
    return [
      { trait: 'upside', assessment: 'neutral', note: 'Unclear until more data' },
      { trait: 'durability', assessment: 'neutral', note: 'Standard evaluation' },
    ];
  }
  attrs.sort((a, b) => Math.abs(b.value - 65) - Math.abs(a.value - 65));
  const factors: CriticalFactor[] = [];
  const traitNames = attrs.slice(0, 5).map(a => a.name.replace(/([A-Z])/g, ' $1').trim().toLowerCase());
  for (let i = 0; i < Math.min(5, traitNames.length); i++) {
    const raw = attrs[i]!.value;
    const noise = normalRandom(rng, 0, 15 * noiseMult);
    const perceived = clamp(raw + noise, 0, 99);
    let assessment: CriticalFactor['assessment'] = 'neutral';
    if (perceived >= 75) assessment = 'plus';
    else if (perceived <= 45) assessment = 'minus';
    factors.push({
      trait: traitNames[i]!,
      assessment,
      note: assessment === 'plus' ? 'Strength for his position' : assessment === 'minus' ? 'Area of concern' : 'Average',
    });
  }
  return factors;
}

function getComparisonPlayer(position: Position, rng: RNG): string | null {
  const bank = COMPARISON_PLAYER_BANK[position];
  if (!bank?.length) return null;
  return bank[randomInt(rng, 0, bank.length - 1)]!;
}

function deriveMedicalFlag(player: Player | DraftProspect): 'clear' | 'minor_concern' | 'major_concern' {
  const p = player.hidden.injuryProneness;
  if (p >= 65) return 'major_concern';
  if (p >= 40) return 'minor_concern';
  return 'clear';
}

/** Create a full ScoutingReport from a player or prospect. */
export function generateReport(
  player: Player | DraftProspect,
  analyticsLevel: number,
  seed: number,
): ScoutingReport {
  const rng = createLCG(seed);
  const tier = clampTier(analyticsLevel);
  const noiseMult = getNoiseMultiplier(tier);
  const confidenceBase = CONFIDENCE_BASE_BY_TIER[tier - 1] ?? 25;

  const trueGrade = mapOverallToGrade(player.hidden.trueOverall);
  const noise = normalRandom(rng, 0, BASE_GRADE_NOISE * noiseMult);
  const noisyGrade = clamp(trueGrade + noise, GRADE_FLOOR, GRADE_CEILING);
  const halfWidth = BASE_GRADE_NOISE * noiseMult * 1.5;
  const gradeRange: [number, number] = [
    clamp(noisyGrade - halfWidth, GRADE_FLOOR, GRADE_CEILING),
    clamp(noisyGrade + halfWidth, GRADE_FLOOR, GRADE_CEILING),
  ];

  const midGrade = (gradeRange[0]! + gradeRange[1]!) / 2;
  const overallGrade: ScoutGrade | null = confidenceBase >= 40 ? snapToScoutGrade(midGrade) : null;

  const summary = getGradeBracketLabel(midGrade) + `. ${player.position} from ${player.college}.`;

  const strengths = generateStrengths(player, rng, tier);
  const weaknesses = generateWeaknesses(player, rng, tier);

  const rawAbilityNotes = tier >= 2
    ? `Physical tools: speed and agility in line with position. Strength ${player.physical.strength >= 70 ? 'above' : 'at'} average.`
    : null;

  const productionNotes = tier >= 2
    ? `College production at ${player.college} factored into grade range.`
    : null;

  const schemeFitGrades = generateSchemeFitGrades(player, rng, noiseMult);

  const [floorVal, ceilingVal] = player.hidden.ceilingFloor;
  const ceilingGrade = mapOverallToGrade(ceilingVal);
  const floorGrade = mapOverallToGrade(floorVal);
  const ceilingProjection = getCeilingText(ceilingGrade, player.position);
  const floorProjection = getFloorText(floorGrade, player.position);

  const comparisonPlayer = confidenceBase >= 50 ? getComparisonPlayer(player.position, rng) : null;
  const comparisonConfidence = confidenceBase >= 50 ? clamp(confidenceBase + randomInt(rng, 0, 20), 0, 100) : 0;

  const criticalFactors = generateCriticalFactors(player, rng, noiseMult);

  const leadershipProjection = tier >= 3
    ? player.personality.leadership >= 70
      ? 'Natural leader; can wear a letter.'
      : player.personality.mentorWillingness >= 60
        ? 'Willing to mentor younger players.'
        : 'Quiet presence; leads by example.'
    : null;

  return {
    gradeRange,
    overallGrade,
    scoutingInvestment: 0,
    confidenceLevel: confidenceBase,
    summary,
    strengths,
    weaknesses,
    rawAbilityNotes,
    productionNotes,
    schemeFitGrades,
    characterGrade: null,
    characterNotes: null,
    leadershipProjection,
    comparisonPlayer,
    comparisonConfidence,
    ceilingProjection,
    floorProjection,
    readyToContribute: deriveReadyToContribute(player, rng),
    criticalFactors,
    medicalFlag: null,
    medicalNotes: null,
  };
}

/** Narrow grade range based on investment. */
function narrowGradeRange(
  gradeRange: [number, number],
  investment: number,
  rng: RNG,
  noiseMult: number,
): [number, number] {
  const mid = (gradeRange[0]! + gradeRange[1]!) / 2;
  const investmentFactor = Math.max(0.3, 1 - investment * INVESTMENT_NARROWING_FACTOR);
  const newHalfWidth = ((gradeRange[1]! - gradeRange[0]!) / 2) * investmentFactor;
  const wiggle = normalRandom(rng, 0, 0.1 * noiseMult);
  const half = Math.max(0.2, newHalfWidth + wiggle);
  return [
    clamp(mid - half, GRADE_FLOOR, GRADE_CEILING),
    clamp(mid + half, GRADE_FLOOR, GRADE_CEILING),
  ];
}

/** Update report after a scouting visit. */
export function updateReportAfterVisit(
  report: ScoutingReport,
  visitType: VisitType,
  player: Player | DraftProspect,
  seed: number,
): ScoutingReport {
  const rng = createLCG(seed);
  const effect = VISIT_TYPE_EFFECTS[visitType];
  const newInvestment = Math.min(100, report.scoutingInvestment + effect.investmentBoost);
  const newConfidence = Math.min(100, report.confidenceLevel + effect.confidenceBoost);

  let gradeRange = report.gradeRange;
  if (effect.narrowsGradeRange) {
    gradeRange = narrowGradeRange(gradeRange, newInvestment, rng, getNoiseMultiplier(3));
  }

  let overallGrade = report.overallGrade;
  if (newConfidence >= 40 && !report.overallGrade) {
    const mid = (gradeRange[0]! + gradeRange[1]!) / 2;
    overallGrade = snapToScoutGrade(mid);
  }

  let strengths = report.strengths;
  let weaknesses = report.weaknesses;
  if (effect.improvesStrengthsWeaknesses) {
    const tier = 4;
    strengths = report.strengths.map(n => ({ ...n, confidence: Math.min(100, n.confidence + effect.confidenceBoost) }));
    weaknesses = report.weaknesses.map(n => ({ ...n, confidence: Math.min(100, n.confidence + effect.confidenceBoost) }));
  }

  let productionNotes = report.productionNotes;
  if (effect.improvesProductionNotes) {
    productionNotes = `College production at ${player.college} evaluated in person.`;
  }

  let rawAbilityNotes = report.rawAbilityNotes;
  if (effect.improvesRawAbilityNotes) {
    rawAbilityNotes = `Physical tools: speed and agility in line with position. Strength ${player.physical.strength >= 70 ? 'above' : 'at'} average.`;
  }

  let schemeFitGrades = report.schemeFitGrades;
  if (effect.improvesSchemeFitGrades) {
    const noiseMult = 0.5;
    schemeFitGrades = generateSchemeFitGrades(player, rng, noiseMult);
  }

  let characterGrade = report.characterGrade;
  if (effect.revealsCharacterGrade) {
    characterGrade = deriveCharacterGrade(player);
  }

  let characterNotes = report.characterNotes;
  if (effect.improvesCharacterNotes) {
    const g = deriveCharacterGrade(player);
    characterNotes = g === 'green' ? 'Clean background; high character.' : g === 'yellow' ? 'Some concerns; due diligence done.' : 'Significant concerns noted.';
  }

  let leadershipProjection = report.leadershipProjection;
  if (effect.improvesLeadershipProjection) {
    leadershipProjection = player.personality.leadership >= 70
      ? 'Natural leader; can wear a letter.'
      : player.personality.mentorWillingness >= 60
        ? 'Willing to mentor younger players.'
        : 'Quiet presence; leads by example.';
  }

  let comparisonPlayer = report.comparisonPlayer;
  let comparisonConfidence = report.comparisonConfidence;
  if (effect.mayRevealComparison && rng() < 0.6) {
    comparisonPlayer = getComparisonPlayer(player.position, rng);
    comparisonConfidence = Math.min(100, report.comparisonConfidence + 25);
  }

  let medicalFlag = report.medicalFlag;
  let medicalNotes = report.medicalNotes;
  if (effect.revealsMedical) {
    medicalFlag = deriveMedicalFlag(player);
    medicalNotes = player.hidden.injuryProneness >= 50
      ? `Injury history and durability factored; proneness score suggests ${medicalFlag === 'major_concern' ? 'elevated' : 'moderate'} risk.`
      : 'No significant medical concerns at this time.';
  }

  return {
    ...report,
    gradeRange,
    overallGrade,
    scoutingInvestment: newInvestment,
    confidenceLevel: newConfidence,
    strengths,
    weaknesses,
    productionNotes,
    rawAbilityNotes,
    schemeFitGrades,
    characterGrade,
    characterNotes,
    leadershipProjection,
    comparisonPlayer: comparisonPlayer ?? report.comparisonPlayer,
    comparisonConfidence,
    medicalFlag,
    medicalNotes,
  };
}

/** Update report after combine; narrows physical assessment and boosts confidence. */
export function updateReportAfterCombine(
  report: ScoutingReport,
  combineResults: CombineResults | CombinePerformance,
  player: Player | DraftProspect,
  seed: number,
): ScoutingReport {
  const rng = createLCG(seed);
  const parts: string[] = [];
  if (combineResults.fortyYardDash != null) {
    parts.push(`Forty: ${combineResults.fortyYardDash.toFixed(2)}`);
  }
  if (combineResults.verticalJump != null) {
    parts.push(`Vertical: ${combineResults.verticalJump}"`);
  }
  if (combineResults.benchPress != null) {
    parts.push(`Bench: ${combineResults.benchPress} reps`);
  }
  const rawAbilityNotes = parts.length
    ? `Combine data: ${parts.join(', ')}. Physical tools align with position expectations.`
    : report.rawAbilityNotes ?? 'Combine participation noted; physical profile consistent with film.';

  const newConfidence = Math.min(100, report.confidenceLevel + 15);
  const newInvestment = Math.min(100, report.scoutingInvestment + 20);

  let overallGrade = report.overallGrade;
  if (newConfidence >= 40 && !overallGrade) {
    const mid = (report.gradeRange[0]! + report.gradeRange[1]!) / 2;
    overallGrade = snapToScoutGrade(mid);
  }

  return {
    ...report,
    rawAbilityNotes,
    confidenceLevel: newConfidence,
    scoutingInvestment: newInvestment,
    overallGrade: overallGrade ?? report.overallGrade,
  };
}
