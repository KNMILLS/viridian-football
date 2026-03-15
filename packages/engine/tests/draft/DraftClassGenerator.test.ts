import { describe, it, expect } from 'vitest';
import { generateDraftClass } from '../../src/draft/DraftClassGenerator.js';
import { PROSPECT_COUNT, TALENT_TIERS } from '../../src/draft/constants.js';

describe('DraftClassGenerator', () => {
  it('produces deterministic output for the same seed', () => {
    const class1 = generateDraftClass(2025, 42);
    const class2 = generateDraftClass(2025, 42);

    expect(class1.length).toBe(class2.length);
    for (let i = 0; i < class1.length; i++) {
      expect(class1[i]!.id).toBe(class2[i]!.id);
      expect(class1[i]!.firstName).toBe(class2[i]!.firstName);
      expect(class1[i]!.lastName).toBe(class2[i]!.lastName);
      expect(class1[i]!.position).toBe(class2[i]!.position);
      expect(class1[i]!.hidden.trueOverall).toBe(class2[i]!.hidden.trueOverall);
    }
  });

  it('produces different output for different seeds', () => {
    const class1 = generateDraftClass(2025, 42);
    const class2 = generateDraftClass(2025, 99);

    const names1 = class1.map(p => `${p.firstName} ${p.lastName}`).join(',');
    const names2 = class2.map(p => `${p.firstName} ${p.lastName}`).join(',');
    expect(names1).not.toBe(names2);
  });

  it('generates exactly PROSPECT_COUNT prospects', () => {
    const prospects = generateDraftClass(2025, 42);
    expect(prospects.length).toBe(PROSPECT_COUNT);
  });

  it('distributes talent across tiers correctly', () => {
    const prospects = generateDraftClass(2025, 42);

    const elite = prospects.filter(p => p.hidden.trueOverall >= 85).length;
    const firstRound = prospects.filter(p => p.hidden.trueOverall >= 75 && p.hidden.trueOverall < 85).length;
    const dayTwo = prospects.filter(p => p.hidden.trueOverall >= 65 && p.hidden.trueOverall < 75).length;

    // Allow tolerance due to bust/gem shifts
    expect(elite).toBeGreaterThanOrEqual(1);
    expect(elite).toBeLessThanOrEqual(20);
    expect(firstRound).toBeGreaterThanOrEqual(5);
    expect(dayTwo).toBeGreaterThanOrEqual(15);
  });

  it('has ~10% busts/gems (trueOverall deviates from tier)', () => {
    const prospects = generateDraftClass(2025, 42);

    let deviationCount = 0;
    const tiers = expandTiersForTest();

    for (let i = 0; i < prospects.length; i++) {
      const tier = tiers[i]!;
      const config = TALENT_TIERS[tier];
      const overall = prospects[i]!.hidden.trueOverall;
      if (overall < config.overallMin || overall > config.overallMax) {
        deviationCount++;
      }
    }

    const rate = deviationCount / prospects.length;
    expect(rate).toBeGreaterThan(0.03);
    expect(rate).toBeLessThan(0.25);
  });

  it('all prospects have full PersonalityTraits (30+ fields)', () => {
    const prospects = generateDraftClass(2025, 42);
    const requiredFields = [
      'leadership', 'workEthic', 'ego', 'coachability', 'competitiveness',
      'composure', 'loyalty', 'greed', 'legacyDrive', 'fameSeeking',
      'familyOriented', 'teamChemistryEffect', 'prankster', 'loner',
      'mentorWillingness', 'respectForVeterans', 'aggression', 'discipline',
      'motorEffort', 'footballIQ', 'filmStudyDedication', 'offFieldRisk',
      'mediaHandling', 'communityEngagement', 'durabilityMindset',
      'resilience', 'confidenceVolatility', 'chipOnShoulder',
    ];

    for (const prospect of prospects) {
      for (const field of requiredFields) {
        expect(prospect.personality).toHaveProperty(field);
        expect((prospect.personality as Record<string, unknown>)[field]).toBeDefined();
      }
    }
  });

  it('covers all common positions in the distribution', () => {
    const prospects = generateDraftClass(2025, 42);
    const positions = new Set(prospects.map(p => p.position));
    const commonPositions = ['QB', 'RB', 'WR', 'TE', 'CB', 'DE', 'DT'];
    for (const pos of commonPositions) {
      expect(positions.has(pos as any)).toBe(true);
    }
  });

  it('all prospect ages are between 20 and 23', () => {
    const prospects = generateDraftClass(2025, 42);
    for (const p of prospects) {
      expect(p.age).toBeGreaterThanOrEqual(20);
      expect(p.age).toBeLessThanOrEqual(23);
    }
  });

  it('initial scouting reports have wide grade ranges', () => {
    const prospects = generateDraftClass(2025, 42);
    for (const p of prospects) {
      const [low, high] = p.scoutingReport.gradeRange;
      expect(high - low).toBeGreaterThanOrEqual(1.0);
      expect(low).toBeGreaterThanOrEqual(4.0);
      expect(high).toBeLessThanOrEqual(9.0);
    }
  });

  it('initial scouting reports have null overallGrade and zero investment', () => {
    const prospects = generateDraftClass(2025, 42);
    for (const p of prospects) {
      expect(p.scoutingReport.overallGrade).toBeNull();
      expect(p.scoutingReport.scoutingInvestment).toBe(0);
      expect(p.scoutingReport.confidenceLevel).toBe(0);
    }
  });

  it('all prospects have HiddenAttributes with valid trueOverall', () => {
    const prospects = generateDraftClass(2025, 42);
    for (const p of prospects) {
      expect(p.hidden.trueOverall).toBeGreaterThanOrEqual(20);
      expect(p.hidden.trueOverall).toBeLessThanOrEqual(99);
      expect(p.hidden.footballCharacter).toBeGreaterThanOrEqual(30);
      expect(p.hidden.schemeVersatility).toBeGreaterThanOrEqual(20);
    }
  });
});

type TalentTier = keyof typeof TALENT_TIERS;

function expandTiersForTest(): TalentTier[] {
  const result: TalentTier[] = [];
  for (const [tier, config] of Object.entries(TALENT_TIERS)) {
    for (let i = 0; i < config.count; i++) {
      result.push(tier as TalentTier);
    }
  }
  return result;
}
