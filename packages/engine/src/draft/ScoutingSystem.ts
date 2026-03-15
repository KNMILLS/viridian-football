import { createLCG, randomInt, normalRandom, clamp, chance, weightedChoice } from '../sim/RNG.js';
import type { RNG } from '../sim/RNG.js';
import type {
  DraftProspect, ScoutingReport, ScoutGrade, ScoutingNote,
  CriticalFactor, SchemeFitGrade,
} from '../types/player.js';
import type { EventBus } from '../events/EventBus.js';
import type { GameEventMap } from '../events/GameEvents.js';
import type { TeamId } from '../types/ids.js';
import {
  VISIT_EFFECTS, MAX_SCOUTING_INVESTMENT, CONFIDENCE_THRESHOLDS,
  COMPARISON_PLAYERS, getPositionGroup, overallToGradeValue, overallToScoutGrade,
  type VisitType,
} from './constants.js';

export { type VisitType } from './constants.js';

export function generateInitialReport(
  prospect: DraftProspect,
  analyticsLevel: number,
  seed: number,
): ScoutingReport {
  const rng = createLCG(seed);
  const trueGrade = overallToGradeValue(prospect.hidden.trueOverall);

  const baseWidth = 6.0 - (analyticsLevel * 0.4);
  const noise = normalRandom(rng, 0, 1.2);
  const noisyCenter = clamp(trueGrade + noise, 4.0, 9.0);
  const halfWidth = baseWidth / 2;
  const low = Math.max(4.0, Math.round((noisyCenter - halfWidth) * 10) / 10);
  const high = Math.min(9.0, Math.round((noisyCenter + halfWidth) * 10) / 10);

  const schemeFitGrades: SchemeFitGrade[] = generateRoughSchemeFits(rng, prospect, analyticsLevel);

  return {
    gradeRange: [low, high],
    overallGrade: null,
    scoutingInvestment: 0,
    confidenceLevel: 0,
    summary: 'Limited film available.',
    strengths: [],
    weaknesses: [],
    rawAbilityNotes: null,
    productionNotes: null,
    schemeFitGrades,
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

export function conductScoutingVisit(
  prospect: DraftProspect,
  existingReport: ScoutingReport,
  visitType: VisitType,
  seed: number,
  bus?: EventBus<GameEventMap>,
  teamId?: TeamId,
): ScoutingReport {
  const rng = createLCG(seed);
  const effects = VISIT_EFFECTS[visitType];
  const report = structuredClone(existingReport);

  const investGain = randomInt(rng, effects.investmentGain[0], effects.investmentGain[1]);
  report.scoutingInvestment = Math.min(
    MAX_SCOUTING_INVESTMENT,
    report.scoutingInvestment + investGain,
  );

  report.confidenceLevel = computeConfidence(report, prospect);

  narrowGradeRange(rng, report, prospect, effects.gradeNarrowing);

  for (const reveal of effects.reveals) {
    applyReveal(rng, report, prospect, reveal);
  }

  if (report.confidenceLevel >= CONFIDENCE_THRESHOLDS.ceilingFloor) {
    if (!report.ceilingProjection) {
      report.ceilingProjection = generateCeilingProjection(rng, prospect);
    }
    if (!report.floorProjection) {
      report.floorProjection = generateFloorProjection(rng, prospect);
    }
  }

  if (report.confidenceLevel >= CONFIDENCE_THRESHOLDS.comparisonPlayer && !report.comparisonPlayer) {
    report.comparisonPlayer = generateComparison(rng, prospect);
    report.comparisonConfidence = randomInt(rng, 40, 75);
  }

  if (report.confidenceLevel >= CONFIDENCE_THRESHOLDS.readyToContribute && !report.readyToContribute) {
    report.readyToContribute = assessReadiness(rng, prospect);
  }

  if (report.confidenceLevel >= CONFIDENCE_THRESHOLDS.overallGrade) {
    const noiseScale = 1 - report.scoutingInvestment / 100;
    const gradeNoise = normalRandom(rng, 0, 0.3 * noiseScale);
    const trueGrade = overallToGradeValue(prospect.hidden.trueOverall);
    const perceivedOverall = clamp(
      Math.round(trueGrade + gradeNoise),
      Math.ceil(report.gradeRange[0]),
      Math.floor(report.gradeRange[1]),
    );
    report.overallGrade = snapToScoutGrade(perceivedOverall);
  }

  if (report.scoutingInvestment >= 30 && report.strengths.length < 2) {
    report.summary = generateSummary(rng, prospect, report);
  }

  if (bus && teamId) {
    bus.emit('SCOUTING_REPORT_UPDATED', {
      playerId: prospect.id,
      teamId,
      confidenceImprovement: investGain,
    });
  }

  return report;
}

function computeConfidence(report: ScoutingReport, prospect: DraftProspect): number {
  let conf = report.scoutingInvestment * 0.7;
  if (prospect.combineResults) conf += 15;
  const visitCount = report.criticalFactors.length + (report.medicalFlag ? 1 : 0) +
    (report.characterGrade ? 1 : 0);
  conf += visitCount * 3;
  return Math.min(100, Math.round(conf));
}

function narrowGradeRange(
  rng: RNG,
  report: ScoutingReport,
  prospect: DraftProspect,
  amount: number,
): void {
  const trueGrade = overallToGradeValue(prospect.hidden.trueOverall);
  const noiseScale = 1 - report.scoutingInvestment / 100;
  const noise = normalRandom(rng, 0, 0.5 * noiseScale);

  const currentCenter = (report.gradeRange[0] + report.gradeRange[1]) / 2;
  const newCenter = currentCenter + (trueGrade - currentCenter) * 0.3 + noise * 0.3;
  const clampedCenter = clamp(newCenter, 4.0, 9.0);

  const currentWidth = report.gradeRange[1] - report.gradeRange[0];
  const newWidth = Math.max(0.4, currentWidth - amount);

  report.gradeRange = [
    Math.max(4.0, Math.round((clampedCenter - newWidth / 2) * 10) / 10),
    Math.min(9.0, Math.round((clampedCenter + newWidth / 2) * 10) / 10),
  ];
}

function applyReveal(rng: RNG, report: ScoutingReport, prospect: DraftProspect, reveal: string): void {
  switch (reveal) {
    case 'rawAbilityNotes':
      if (!report.rawAbilityNotes) {
        report.rawAbilityNotes = generateRawAbilityNotes(rng, prospect);
      }
      break;
    case 'productionNotes':
      if (!report.productionNotes) {
        report.productionNotes = `College production at ${prospect.college} shows ${
          prospect.hidden.trueOverall > 70 ? 'consistent starter-level output' :
          prospect.hidden.trueOverall > 55 ? 'flashes of ability mixed with inconsistency' :
          'limited production, more projection than performance'
        }.`;
      }
      break;
    case 'strengths':
      if (report.strengths.length < 3) {
        report.strengths.push(generateStrength(rng, prospect));
      }
      break;
    case 'weaknesses':
      if (report.weaknesses.length < 3) {
        report.weaknesses.push(generateWeakness(rng, prospect));
      }
      break;
    case 'criticalFactors':
      if (report.criticalFactors.length < 4) {
        report.criticalFactors.push(generateCriticalFactor(rng, prospect));
      }
      break;
    case 'personality_hints':
      if (report.criticalFactors.length < 4) {
        const trait = prospect.personality.workEthic > 70 ? 'work ethic' :
          prospect.personality.footballIQ > 70 ? 'football IQ' : 'competitive drive';
        const assessment = prospect.personality.workEthic > 70 || prospect.personality.footballIQ > 70
          ? 'plus' as const : 'neutral' as const;
        report.criticalFactors.push({
          trait,
          assessment,
          note: `${assessment === 'plus' ? 'Strong' : 'Average'} ${trait} noted during visit.`,
        });
      }
      break;
    case 'characterGrade':
      if (!report.characterGrade) {
        const risk = prospect.personality.offFieldRisk;
        report.characterGrade = risk > 35 ? 'red' : risk > 20 ? 'yellow' : 'green';
      }
      break;
    case 'leadershipProjection':
      if (!report.leadershipProjection) {
        const lead = prospect.personality.leadership;
        report.leadershipProjection = lead > 75 ? 'Projects as a team captain and vocal leader.' :
          lead > 50 ? 'Solid presence, leads by example.' :
          'Quiet personality, unlikely to be a vocal leader.';
      }
      break;
    case 'characterNotes':
      if (!report.characterNotes) {
        const ego = prospect.personality.ego;
        const risk = prospect.personality.offFieldRisk;
        const parts: string[] = [];
        if (ego > 70) parts.push('High self-confidence; could be perceived as a diva.');
        if (risk > 30) parts.push('Some off-field concerns flagged.');
        if (prospect.personality.communityEngagement > 70) parts.push('Active in community, well-liked.');
        report.characterNotes = parts.length > 0 ? parts.join(' ') : 'No significant character flags.';
      }
      break;
    case 'medicalFlag':
      if (!report.medicalFlag) {
        const prone = prospect.hidden.injuryProneness;
        report.medicalFlag = prone > 60 ? 'major_concern' : prone > 35 ? 'minor_concern' : 'clear';
      }
      break;
    case 'medicalNotes':
      if (!report.medicalNotes) {
        const prone = prospect.hidden.injuryProneness;
        report.medicalNotes = prone > 60 ? 'History of recurring injuries; durability is a concern.' :
          prone > 35 ? 'Minor injury history; nothing alarming but worth monitoring.' :
          'Clean medical history. No structural concerns.';
      }
      break;
    case 'physical_detail':
      if (!report.rawAbilityNotes || report.rawAbilityNotes.length < 80) {
        report.rawAbilityNotes = generateRawAbilityNotes(rng, prospect);
      }
      if (report.strengths.length < 3 && prospect.physical.speed > 70) {
        report.strengths.push({
          category: 'physical',
          text: 'Elite athleticism jumps off the tape.',
          confidence: randomInt(rng, 60, 90),
        });
      }
      break;
  }
}

function generateRawAbilityNotes(rng: RNG, prospect: DraftProspect): string {
  const phys = prospect.physical;
  const parts: string[] = [];
  if (phys.speed > 75) parts.push('Exceptional straight-line speed');
  else if (phys.speed > 60) parts.push('Adequate speed for the position');
  else parts.push('Below-average speed, must compensate with technique');

  if (phys.strength > 75) parts.push('plus strength at the point of attack');
  if (phys.agility > 75) parts.push('fluid change-of-direction ability');
  if (phys.toughness > 75) parts.push('plays through contact');
  return parts.join('. ') + '.';
}

function generateStrength(rng: RNG, prospect: DraftProspect): ScoutingNote {
  const categories: ScoutingNote['category'][] = ['physical', 'technical', 'mental', 'production', 'intangible'];
  const cat = weightedChoice(rng, categories.map(c => ({ item: c, weight: 20 })));
  const texts: Record<string, string[]> = {
    physical: ['Impressive burst and acceleration', 'Rare combination of size and speed', 'Natural power at the point of attack'],
    technical: ['Advanced hand technique', 'Polished route runner for his age', 'Sound fundamentals throughout his game'],
    mental: ['High football IQ, processes quickly', 'Excellent pre-snap recognition', 'Instinctive player who anticipates well'],
    production: ['Productive multi-year starter', 'Consistent performer against top competition', 'Elite college production numbers'],
    intangible: ['Natural leader on the field', 'Fierce competitor who elevates teammates', 'Motor never stops'],
  };
  const options = texts[cat] ?? texts['physical']!;
  return {
    category: cat,
    text: options[randomInt(rng, 0, options.length - 1)]!,
    confidence: randomInt(rng, 50, 90),
  };
}

function generateWeakness(rng: RNG, prospect: DraftProspect): ScoutingNote {
  const categories: ScoutingNote['category'][] = ['physical', 'technical', 'mental', 'production', 'intangible'];
  const cat = weightedChoice(rng, categories.map(c => ({ item: c, weight: 20 })));
  const texts: Record<string, string[]> = {
    physical: ['Lacks ideal length for the position', 'Needs to add functional strength', 'Timed speed may not translate to game speed'],
    technical: ['Inconsistent technique under pressure', 'Needs to refine footwork', 'Raw in pass protection fundamentals'],
    mental: ['Slow to process at the second level', 'Tendency to freelance from assignments', 'Takes plays off when not engaged'],
    production: ['Production did not match physical tools', 'Inconsistent against top competition', 'Limited collegiate snaps'],
    intangible: ['Quiet demeanor, may not command a huddle', 'Questionable competitive drive in adversity', 'Durability concerns due to injury history'],
  };
  const options = texts[cat] ?? texts['physical']!;
  return {
    category: cat,
    text: options[randomInt(rng, 0, options.length - 1)]!,
    confidence: randomInt(rng, 40, 80),
  };
}

function generateCriticalFactor(rng: RNG, prospect: DraftProspect): CriticalFactor {
  const factors = [
    { trait: 'arm strength', key: 'throwPower' },
    { trait: 'lateral agility', key: 'agility' },
    { trait: 'play speed', key: 'speed' },
    { trait: 'competitive toughness', key: 'toughness' },
    { trait: 'football instincts', key: 'footballIQ' },
  ];
  const factor = factors[randomInt(rng, 0, factors.length - 1)]!;
  const value = (prospect.physical as unknown as Record<string, number>)[factor.key] ??
    prospect.personality.footballIQ;
  const assessment: CriticalFactor['assessment'] = value > 70 ? 'plus' : value > 45 ? 'neutral' : 'minus';
  return {
    trait: factor.trait,
    assessment,
    note: `${assessment === 'plus' ? 'Premium' : assessment === 'neutral' ? 'Adequate' : 'Below-average'} ${factor.trait}.`,
  };
}

function generateRoughSchemeFits(rng: RNG, prospect: DraftProspect, analyticsLevel: number): SchemeFitGrade[] {
  const schemes = ['West Coast', 'Spread', 'Power Run', 'Zone Run', '3-4 Defense', '4-3 Defense'];
  const versatility = prospect.hidden.schemeVersatility;
  return schemes.map(scheme => {
    const baseGrade = 4.0 + (versatility / 99) * 4.0;
    const noiseRange = 3.0 - analyticsLevel * 0.4;
    const noise = normalRandom(rng, 0, noiseRange * 0.3);
    return {
      scheme,
      fitGrade: clamp(Math.round((baseGrade + noise) * 10) / 10, 4.0, 9.0),
      notes: null,
    };
  });
}

function generateCeilingProjection(rng: RNG, prospect: DraftProspect): string {
  const ceiling = prospect.hidden.ceilingFloor[1];
  if (ceiling > 85) return 'Perennial All-Pro caliber player who can anchor a franchise.';
  if (ceiling > 75) return 'Multi-year Pro Bowl player and quality starter.';
  if (ceiling > 65) return 'Solid starter who contributes meaningfully.';
  return 'Rotational player or quality backup.';
}

function generateFloorProjection(rng: RNG, prospect: DraftProspect): string {
  const floor = prospect.hidden.ceilingFloor[0];
  if (floor > 70) return 'At worst, a reliable starter with limited upside.';
  if (floor > 55) return 'Backup-caliber player with special teams value.';
  if (floor > 40) return 'Fringe roster player who must earn a spot in camp.';
  return 'May not make a 53-man roster.';
}

function generateComparison(rng: RNG, prospect: DraftProspect): string {
  const group = getPositionGroup(prospect.position);
  const comps = COMPARISON_PLAYERS[group] ?? COMPARISON_PLAYERS[prospect.position] ?? ['a versatile contributor'];
  return `Plays like ${comps[randomInt(rng, 0, comps.length - 1)]!}.`;
}

function assessReadiness(rng: RNG, prospect: DraftProspect): 'day_one' | 'year_two' | 'developmental' | 'project' {
  const overall = prospect.hidden.trueOverall;
  const iq = prospect.personality.footballIQ;
  const composite = overall * 0.6 + iq * 0.4;
  if (composite > 75) return 'day_one';
  if (composite > 60) return 'year_two';
  if (composite > 45) return 'developmental';
  return 'project';
}

function snapToScoutGrade(value: number): ScoutGrade {
  const grades: ScoutGrade[] = [9.0, 8.0, 7.0, 6.5, 6.0, 5.5, 5.0, 4.0];
  let closest = grades[0]!;
  let minDist = Math.abs(value - closest);
  for (const g of grades) {
    const dist = Math.abs(value - g);
    if (dist < minDist) {
      minDist = dist;
      closest = g;
    }
  }
  return closest;
}

function generateSummary(rng: RNG, prospect: DraftProspect, report: ScoutingReport): string {
  const overall = prospect.hidden.trueOverall;
  const pos = prospect.position;
  if (overall > 80) return `Elite ${pos} prospect with franchise-changing upside. One of the top players in this draft class.`;
  if (overall > 70) return `Talented ${pos} with starter-level projection. Should contribute early in his career.`;
  if (overall > 60) return `Solid ${pos} prospect with a defined role at the next level. May need development time.`;
  if (overall > 50) return `Developmental ${pos} with intriguing traits but significant refinement needed.`;
  return `Priority free agent-level ${pos}. Faces an uphill battle to make a roster.`;
}
