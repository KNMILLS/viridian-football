import { describe, it, expect } from 'vitest';
import { delegateToStaff } from '../../src/delegation/DelegationEngine.js';
import { autoDepthChart, autoTrainingCampCuts } from '../../src/delegation/autoDecisions.js';
import type { Player } from '../../src/types/index.js';
import { playerId, teamId } from '../../src/types/index.js';

function makePlayer(id: string, position: Player['position'], overall: number): Player {
  return {
    id: playerId(id),
    firstName: 'Test',
    lastName: id,
    age: 25,
    position,
    secondaryPositions: [],
    teamId: teamId('team-1'),
    jerseyNumber: 1,
    experience: 3,
    college: 'Test U',
    draftYear: 2023,
    draftRound: 3,
    draftPick: 65,
    physical: {
      speed: 80, acceleration: 78, strength: 75,
      agility: 77, jumping: 76, stamina: 80, toughness: 70,
    },
    personality: {
      leadership: 50, workEthic: 60, ego: 40,
      coachability: 60, competitiveness: 65, composure: 55, loyalty: 60,
    },
    hidden: {
      trueOverall: overall, injuryProneness: 40,
      clutchFactor: 50, consistencyVariance: 10,
      ceilingFloor: [overall - 10, overall + 10],
    },
    contract: {
      contractId: `c-${id}`, yearsRemaining: 2,
      currentYearCapHit: 3_000_000, totalValue: 6_000_000,
    },
    injuryStatus: null,
    careerStats: {},
    seasonStats: {},
  };
}

describe('delegateToStaff', () => {
  const staffFn = () => 'staff-choice';

  it('manual mode always returns needsUserInput: true', () => {
    const result = delegateToStaff('manual', staffFn);
    expect(result.needsUserInput).toBe(true);
    expect(result.staffSuggestion).toBe('staff-choice');
    expect(result.autoApplied).toBe(false);
    expect(result.decision).toBeUndefined();
  });

  it('auto mode always returns autoApplied: true', () => {
    const result = delegateToStaff('auto', staffFn);
    expect(result.needsUserInput).toBe(false);
    expect(result.decision).toBe('staff-choice');
    expect(result.autoApplied).toBe(true);
  });

  it('review mode returns staff suggestion but not auto-applied', () => {
    const result = delegateToStaff('review', staffFn);
    expect(result.needsUserInput).toBe(true);
    expect(result.staffSuggestion).toBe('staff-choice');
    expect(result.autoApplied).toBe(false);
  });

  it('review mode with user override applies the override', () => {
    const result = delegateToStaff('review', staffFn, 'user-choice');
    expect(result.needsUserInput).toBe(false);
    expect(result.decision).toBe('user-choice');
    expect(result.staffSuggestion).toBe('staff-choice');
    expect(result.autoApplied).toBe(false);
  });
});

describe('autoDepthChart', () => {
  it('sorts players by trueOverall descending at each position', () => {
    const players = [
      makePlayer('qb1', 'QB', 85),
      makePlayer('qb2', 'QB', 92),
      makePlayer('qb3', 'QB', 78),
      makePlayer('rb1', 'RB', 88),
      makePlayer('rb2', 'RB', 75),
    ];

    const chart = autoDepthChart(players);

    expect(chart['QB']).toEqual([
      playerId('qb2'),
      playerId('qb1'),
      playerId('qb3'),
    ]);
    expect(chart['RB']).toEqual([
      playerId('rb1'),
      playerId('rb2'),
    ]);
  });
});

describe('autoTrainingCampCuts', () => {
  it('cuts the lowest-rated players to reach roster limit', () => {
    const players = [
      makePlayer('p1', 'WR', 90),
      makePlayer('p2', 'WR', 60),
      makePlayer('p3', 'RB', 85),
      makePlayer('p4', 'CB', 55),
      makePlayer('p5', 'QB', 80),
    ];

    const cuts = autoTrainingCampCuts(players, 3);
    expect(cuts.length).toBe(2);
    expect(cuts).toContain(playerId('p2'));
    expect(cuts).toContain(playerId('p4'));
  });

  it('returns empty array when roster is within limit', () => {
    const players = [
      makePlayer('p1', 'QB', 80),
      makePlayer('p2', 'RB', 75),
    ];

    const cuts = autoTrainingCampCuts(players, 5);
    expect(cuts).toEqual([]);
  });
});
