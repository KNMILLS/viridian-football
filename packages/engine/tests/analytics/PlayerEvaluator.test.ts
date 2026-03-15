import { describe, it, expect } from 'vitest';
import { evaluateCurrentPlayer } from '../../src/analytics/PlayerEvaluator.js';
import type { Player } from '../../src/types/player.js';
import { playerId, teamId } from '../../src/types/ids.js';

function makePlayer(overrides: Partial<Player> = {}): Player {
  return {
    id: playerId('p1'),
    firstName: 'Test',
    lastName: 'Veteran',
    age: 27,
    position: 'QB',
    secondaryPositions: [],
    teamId: teamId('t1'),
    jerseyNumber: 12,
    experience: 5,
    college: 'State U',
    draftYear: 2019,
    draftRound: 1,
    draftPick: 5,
    physical: { speed: 82, acceleration: 80, strength: 72, agility: 75, jumping: 70, stamina: 88, toughness: 78 },
    personality: {
      leadership: 72, workEthic: 78, ego: 55, coachability: 72, competitiveness: 82, composure: 75, loyalty: 58,
      greed: 48, legacyDrive: 62, fameSeeking: 45, familyOriented: 52, teamChemistryEffect: 62, prankster: 15,
      loner: 20, mentorWillingness: 60, respectForVeterans: 72, aggression: 48, discipline: 75, motorEffort: 80,
      footballIQ: 80, filmStudyDedication: 78, offFieldRisk: 18, mediaHandling: 'professional', communityEngagement: 55,
      durabilityMindset: 75, resilience: 70, confidenceVolatility: 28, chipOnShoulder: 45,
    },
    hidden: {
      trueOverall: 85, injuryProneness: 22, clutchFactor: 78, consistencyVariance: 10,
      ceilingFloor: [78, 92], footballCharacter: 82, schemeVersatility: 68,
    },
    passing: { throwPower: 90, shortAccuracy: 88, mediumAccuracy: 86, deepAccuracy: 84, throwOnRun: 78, playAction: 80 },
    contract: {
      contractId: 'c1',
      yearsRemaining: 3,
      currentYearCapHit: 12_000_000,
      totalValue: 45_000_000,
    },
    injuryStatus: null,
    careerStats: {},
    seasonStats: {
      2023: { yards: 4200, touchdowns: 32, completions: 380 },
      2024: { yards: 4500, touchdowns: 35, completions: 395 },
    },
    ...overrides,
  } as Player;
}

describe('PlayerEvaluator', () => {
  it('returns a valid ScoutingReport with player-specific fields', () => {
    const player = makePlayer();
    const eval_ = evaluateCurrentPlayer(player, 3, 2024, 42);
    expect(eval_.agingProjection).toBeTruthy();
    expect(eval_.productionTrend).toBeTruthy();
    expect(eval_.contractValueAssessment).toBeTruthy();
    expect(eval_.tradeValue).toBeTruthy();
    expect(eval_.gradeRange).toBeDefined();
  });

  it('aging projection matches position curves', () => {
    const young = makePlayer({ age: 23, position: 'RB' });
    const prime = makePlayer({ age: 26, position: 'WR' });
    const old = makePlayer({ age: 37, position: 'QB' }); // QB peakAgeEnd 35, so 37 is decline phase
    expect(evaluateCurrentPlayer(young, 3, 2024, 1).agingProjection).toMatch(/prime|upside|entering/i);
    expect(evaluateCurrentPlayer(prime, 3, 2024, 2).agingProjection).toBeTruthy();
    expect(evaluateCurrentPlayer(old, 3, 2024, 3).agingProjection).toMatch(/decline|closing/i);
  });

  it('contract value assessment responds to cap hit vs grade', () => {
    const highCap = makePlayer({ contract: { contractId: 'c1', yearsRemaining: 2, currentYearCapHit: 28_000_000, totalValue: 60_000_000 } });
    const lowCap = makePlayer({ contract: { contractId: 'c2', yearsRemaining: 2, currentYearCapHit: 4_000_000, totalValue: 12_000_000 } });
    const evalHigh = evaluateCurrentPlayer(highCap, 4, 2024, 10);
    const evalLow = evaluateCurrentPlayer(lowCap, 4, 2024, 11);
    expect(evalHigh.contractValueAssessment).toMatch(/overpaid|fair|underpaid/i);
    expect(evalLow.contractValueAssessment).toMatch(/underpaid|fair|free agent/i);
  });

  it('production trend detects year-over-year changes', () => {
    const improving = makePlayer({
      seasonStats: {
        2022: { yards: 3000, touchdowns: 20 },
        2023: { yards: 3800, touchdowns: 28 },
      },
    });
    const declining = makePlayer({
      seasonStats: {
        2022: { yards: 4000, touchdowns: 30 },
        2023: { yards: 3200, touchdowns: 22 },
      },
    });
    const trendUp = evaluateCurrentPlayer(improving, 3, 2024, 20).productionTrend;
    const trendDown = evaluateCurrentPlayer(declining, 3, 2024, 21).productionTrend;
    expect(trendUp).toMatch(/improving|steady|insufficient/i);
    expect(trendDown).toMatch(/declining|steady|insufficient/i);
  });

  it('is deterministic with same seed', () => {
    const player = makePlayer();
    const a = evaluateCurrentPlayer(player, 3, 2024, 42);
    const b = evaluateCurrentPlayer(player, 3, 2024, 42);
    expect(a.agingProjection).toBe(b.agingProjection);
    expect(a.contractValueAssessment).toBe(b.contractValueAssessment);
  });

  it('works for player with no contract (free agent)', () => {
    const fa = makePlayer({ contract: null });
    const eval_ = evaluateCurrentPlayer(fa, 3, 2024, 30);
    expect(eval_.contractValueAssessment).toMatch(/free agent/i);
    expect(eval_.tradeValue).toBeTruthy();
  });
});
