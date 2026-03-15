import { describe, it, expect } from 'vitest';
import { predictInjuryRisk } from '../../src/analytics/InjuryPredictor.js';
import type { Player } from '../../src/types/player.js';
import { playerId, teamId } from '../../src/types/ids.js';

function makePlayer(overrides: Partial<Player> = {}): Player {
  return {
    id: playerId('p1'),
    firstName: 'Test',
    lastName: 'Player',
    age: 26,
    position: 'RB',
    secondaryPositions: [],
    teamId: teamId('t1'),
    jerseyNumber: 22,
    experience: 4,
    college: 'State U',
    draftYear: 2020,
    draftRound: 2,
    draftPick: 45,
    physical: { speed: 88, acceleration: 86, strength: 72, agility: 85, jumping: 82, stamina: 80, toughness: 75 },
    personality: {
      leadership: 55, workEthic: 72, ego: 45, coachability: 68, competitiveness: 78, composure: 65, loyalty: 60,
      greed: 48, legacyDrive: 52, fameSeeking: 42, familyOriented: 50, teamChemistryEffect: 55, prankster: 20,
      loner: 25, mentorWillingness: 50, respectForVeterans: 65, aggression: 55, discipline: 70, motorEffort: 78,
      footballIQ: 70, filmStudyDedication: 68, offFieldRisk: 20, mediaHandling: 'professional', communityEngagement: 50,
      durabilityMindset: 72, resilience: 65, confidenceVolatility: 35, chipOnShoulder: 45,
    },
    hidden: {
      trueOverall: 78, injuryProneness: 45, clutchFactor: 65, consistencyVariance: 12,
      ceilingFloor: [68, 86], footballCharacter: 72, schemeVersatility: 58,
    },
    rushing: { carrying: 82, breakTackle: 80, elusiveness: 85, ballCarrierVision: 78, trucking: 75 },
    contract: null,
    injuryStatus: null,
    careerStats: {},
    seasonStats: {},
    ...overrides,
  } as Player;
}

describe('InjuryPredictor', () => {
  it('accuracy improves with analytics tier (tier 5 closer to true risk)', () => {
    const lowProneness = makePlayer({ hidden: { ...makePlayer().hidden!, injuryProneness: 15 } });
    const highProneness = makePlayer({ hidden: { ...makePlayer().hidden!, injuryProneness: 85 } });
    const riskLowT1 = predictInjuryRisk(lowProneness, 1, 42);
    const riskLowT5 = predictInjuryRisk(lowProneness, 5, 42);
    const riskHighT5 = predictInjuryRisk(highProneness, 5, 43);
    expect(riskLowT5.accuracy).toBeGreaterThan(riskLowT1.accuracy);
    expect(riskHighT5.riskLevel).toMatch(/high|very_high/);
  });

  it('risk level categories map correctly', () => {
    const levels: Array<'low' | 'medium' | 'high' | 'very_high'> = ['low', 'medium', 'high', 'very_high'];
    const player = makePlayer();
    const assessment = predictInjuryRisk(player, 4, 42);
    expect(levels).toContain(assessment.riskLevel);
    expect(assessment.notes.length).toBeGreaterThan(0);
    expect(assessment.accuracy).toBeGreaterThanOrEqual(0);
    expect(assessment.accuracy).toBeLessThanOrEqual(1);
  });

  it('at tier 1-2 riskCategory and estimatedGamesMissed are null', () => {
    const player = makePlayer();
    const t1 = predictInjuryRisk(player, 1, 100);
    const t2 = predictInjuryRisk(player, 2, 101);
    expect(t1.riskCategory).toBeNull();
    expect(t2.riskCategory).toBeNull();
    expect(t1.estimatedGamesMissed).toBeNull();
    expect(t2.estimatedGamesMissed).toBeNull();
  });

  it('at tier 4+ estimatedGamesMissed is populated', () => {
    const player = makePlayer();
    const t4 = predictInjuryRisk(player, 4, 102);
    const t5 = predictInjuryRisk(player, 5, 103);
    expect(t4.estimatedGamesMissed).not.toBeNull();
    expect(t5.estimatedGamesMissed).not.toBeNull();
    expect(typeof t4.estimatedGamesMissed).toBe('number');
  });

  it('is deterministic with same seed', () => {
    const player = makePlayer();
    const a = predictInjuryRisk(player, 4, 42);
    const b = predictInjuryRisk(player, 4, 42);
    expect(a.riskLevel).toBe(b.riskLevel);
    expect(a.riskCategory).toBe(b.riskCategory);
    expect(a.estimatedGamesMissed).toBe(b.estimatedGamesMissed);
  });
});
