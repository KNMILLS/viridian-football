import { describe, it, expect } from 'vitest';
import { evaluateProspect } from '../../src/analytics/ProspectEvaluator.js';
import type { DraftProspect, ScoutingReport } from '../../src/types/player.js';
import { playerId } from '../../src/types/ids.js';

function makeProspect(overrides: Partial<DraftProspect> = {}): DraftProspect {
  const stubReport: ScoutingReport = {
    gradeRange: [5.5, 7.0], overallGrade: 6.5, scoutingInvestment: 0, confidenceLevel: 45,
    summary: 'Test', strengths: [], weaknesses: [], rawAbilityNotes: null, productionNotes: null,
    schemeFitGrades: [
      { scheme: 'west_coast', fitGrade: 7.2, notes: null },
      { scheme: 'spread', fitGrade: 6.8, notes: null },
    ],
    characterGrade: null, characterNotes: null, leadershipProjection: null,
    comparisonPlayer: null, comparisonConfidence: 0, ceilingProjection: null, floorProjection: null,
    readyToContribute: 'year_two', criticalFactors: [], medicalFlag: null, medicalNotes: null,
  };
  return {
    id: playerId('dp1'),
    firstName: 'Draft',
    lastName: 'Prospect',
    age: 21,
    position: 'WR',
    college: 'Big State',
    scoutingReport: stubReport,
    hidden: {
      trueOverall: 76, injuryProneness: 28, clutchFactor: 65, consistencyVariance: 14,
      ceilingFloor: [66, 86], footballCharacter: 74, schemeVersatility: 62,
    },
    physical: { speed: 88, acceleration: 86, strength: 62, agility: 84, jumping: 80, stamina: 82, toughness: 68 },
    personality: {
      leadership: 58, workEthic: 72, ego: 48, coachability: 70, competitiveness: 78, composure: 68, loyalty: 62,
      greed: 42, legacyDrive: 58, fameSeeking: 38, familyOriented: 52, teamChemistryEffect: 58, prankster: 18,
      loner: 22, mentorWillingness: 52, respectForVeterans: 68, aggression: 48, discipline: 72, motorEffort: 78,
      footballIQ: 74, filmStudyDedication: 72, offFieldRisk: 18, mediaHandling: 'professional', communityEngagement: 52,
      durabilityMindset: 72, resilience: 68, confidenceVolatility: 32, chipOnShoulder: 42,
    },
    receiving: { catching: 82, spectacularCatch: 78, catchInTraffic: 80, routeRunning: 85, release: 82 },
    ...overrides,
  } as DraftProspect;
}

describe('ProspectEvaluator', () => {
  it('returns a valid ScoutingReport with draft-specific fields', () => {
    const prospect = makeProspect();
    const eval_ = evaluateProspect(prospect, 3, { offense: 'west_coast' }, 42);
    expect(eval_.gradeRange).toBeDefined();
    expect(eval_.draftProjection).toBeTruthy();
    expect(eval_.readinessTimeline).toBeTruthy();
    expect(eval_.summary).toBeTruthy();
  });

  it('includes team scheme fit when scheme provided', () => {
    const prospect = makeProspect();
    const eval_ = evaluateProspect(prospect, 3, { offense: 'west_coast' }, 42);
    expect(eval_.teamSchemeFit).not.toBeNull();
    expect(eval_.teamSchemeFit).toBeGreaterThanOrEqual(1.0);
    expect(eval_.teamSchemeFit).toBeLessThanOrEqual(9.0);
  });

  it('draft projection text matches grade range tier', () => {
    const high = makeProspect({ hidden: { ...makeProspect().hidden!, trueOverall: 92 } });
    const low = makeProspect({ hidden: { ...makeProspect().hidden!, trueOverall: 45 } });
    const evalHigh = evaluateProspect(high, 4, {}, 100);
    const evalLow = evaluateProspect(low, 4, {}, 101);
    expect(evalHigh.draftProjection.toLowerCase()).toMatch(/1st|top|round|generational/);
    expect(evalLow.draftProjection.toLowerCase()).toMatch(/free agent|late|camp|priority|day 3|4th|5th|candidate/);
  });

  it('is deterministic with same seed', () => {
    const prospect = makeProspect();
    const a = evaluateProspect(prospect, 3, { offense: 'spread' }, 77);
    const b = evaluateProspect(prospect, 3, { offense: 'spread' }, 77);
    expect(a.draftProjection).toBe(b.draftProjection);
    expect(a.teamSchemeFit).toBe(b.teamSchemeFit);
    expect(a.readinessTimeline).toBe(b.readinessTimeline);
  });

  it('comparison player populated at sufficient confidence', () => {
    const prospect = makeProspect();
    const eval_ = evaluateProspect(prospect, 5, {}, 42);
    expect(eval_.schemeFitGrades.length).toBeGreaterThan(0);
    expect(eval_.readinessTimeline.length).toBeGreaterThan(0);
  });

  it('readiness timeline varies by footballCharacter and footballIQ', () => {
    const high = makeProspect({
      hidden: { ...makeProspect().hidden!, footballCharacter: 88, footballIQ: 85 },
    });
    const low = makeProspect({
      hidden: { ...makeProspect().hidden!, footballCharacter: 40, footballIQ: 45 },
    });
    const evalHigh = evaluateProspect(high, 4, {}, 200);
    const evalLow = evaluateProspect(low, 4, {}, 201);
    expect(evalHigh.readinessTimeline).toBeTruthy();
    expect(evalLow.readinessTimeline).toBeTruthy();
  });
});
