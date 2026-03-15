import { describe, it, expect } from 'vitest';
import { createLCG } from '../../src/sim/RNG.js';
import { EventBus } from '../../src/events/EventBus.js';
import type { GameEventMap } from '../../src/events/GameEvents.js';
import type { Player, Team } from '../../src/types/index.js';
import { playerId, teamId } from '../../src/types/index.js';
import {
  evaluateHoldoutRisk,
  processHoldout,
  evaluateMentorship,
  checkLockerRoomIssues,
  updateMorale,
} from '../../src/personality/PersonalityEngine.js';
import type { MoraleEvent } from '../../src/personality/PersonalityEngine.js';

function makePlayer(overrides: Partial<Player> = {}): Player {
  return {
    id: playerId('player-1'),
    firstName: 'Test',
    lastName: 'Player',
    age: 26,
    position: 'WR',
    secondaryPositions: [],
    teamId: teamId('team-1'),
    jerseyNumber: 81,
    experience: 4,
    college: 'State U',
    draftYear: 2022,
    draftRound: 2,
    draftPick: 45,
    physical: {
      speed: 90, acceleration: 88, strength: 70,
      agility: 85, jumping: 82, stamina: 80, toughness: 65,
    },
    personality: {
      leadership: 55, workEthic: 70, ego: 40,
      coachability: 65, competitiveness: 75, composure: 60, loyalty: 65,
    },
    hidden: {
      trueOverall: 78, injuryProneness: 40,
      clutchFactor: 55, consistencyVariance: 10,
      ceilingFloor: [70, 85],
    },
    contract: {
      contractId: 'c-1', yearsRemaining: 2,
      currentYearCapHit: 5_000_000, totalValue: 12_000_000,
    },
    injuryStatus: null,
    careerStats: {},
    seasonStats: {},
    ...overrides,
  };
}

describe('evaluateHoldoutRisk', () => {
  it('gives high holdout risk to a high-ego underpaid breakout player', () => {
    const player = makePlayer({
      personality: { ...makePlayer().personality, ego: 92, loyalty: 20 },
      contract: {
        contractId: 'c-1', yearsRemaining: 1,
        currentYearCapHit: 2_000_000, totalValue: 2_000_000,
      },
    });

    const risk = evaluateHoldoutRisk(
      player,
      player.contract,
      { breakout: true },
      10_000_000,
    );

    expect(risk.probability).toBeGreaterThan(0.4);
    expect(risk.demandedSalary).toBeGreaterThan(10_000_000);
    expect(risk.severity).toBe('regular_season');
  });

  it('gives near-zero holdout risk to a low-ego well-paid player', () => {
    const player = makePlayer({
      personality: { ...makePlayer().personality, ego: 15, loyalty: 85 },
      contract: {
        contractId: 'c-1', yearsRemaining: 4,
        currentYearCapHit: 15_000_000, totalValue: 60_000_000,
      },
    });

    const risk = evaluateHoldoutRisk(
      player,
      player.contract,
      { breakout: false },
      10_000_000,
    );

    expect(risk.probability).toBeLessThan(0.1);
    expect(risk.severity).toBe('training_camp');
  });

  it('returns zero probability when player has no contract', () => {
    const player = makePlayer({ contract: null });
    const risk = evaluateHoldoutRisk(player, null, { breakout: true }, 10_000_000);
    expect(risk.probability).toBe(0);
  });
});

describe('processHoldout', () => {
  it('is deterministic with the same seed', () => {
    const player = makePlayer({
      personality: { ...makePlayer().personality, ego: 85 },
    });
    const risk = { probability: 0.5, demandedSalary: 12_000_000, severity: 'training_camp' as const };

    const results1: boolean[] = [];
    const results2: boolean[] = [];
    const rng1 = createLCG(42);
    const rng2 = createLCG(42);

    for (let i = 0; i < 100; i++) {
      results1.push(processHoldout(player, risk, rng1).triggered);
      results2.push(processHoldout(player, risk, rng2).triggered);
    }

    expect(results1).toEqual(results2);
  });

  it('emits HOLDOUT_INITIATED when triggered', () => {
    const player = makePlayer({
      personality: { ...makePlayer().personality, ego: 90 },
    });
    const risk = { probability: 1.0, demandedSalary: 15_000_000, severity: 'regular_season' as const };

    const bus = new EventBus<GameEventMap>();
    const events: unknown[] = [];
    bus.on('HOLDOUT_INITIATED', (p) => events.push(p));

    const rng = createLCG(42);
    const result = processHoldout(player, risk, rng, bus);

    expect(result.triggered).toBe(true);
    expect(events.length).toBe(1);
  });
});

describe('evaluateMentorship', () => {
  it('requires minimum experience and leadership for mentor', () => {
    const mentor = makePlayer({
      id: playerId('mentor-1'),
      experience: 3,
      personality: { ...makePlayer().personality, leadership: 60 },
    });
    const mentee = makePlayer({
      id: playerId('mentee-1'),
      personality: { ...makePlayer().personality, coachability: 80 },
    });

    const result = evaluateMentorship(mentor, mentee);
    expect(result.eligible).toBe(false);
    expect(result.skillBoost).toBe(0);
  });

  it('produces a skill boost for eligible pairs', () => {
    const mentor = makePlayer({
      id: playerId('mentor-1'),
      position: 'WR',
      experience: 8,
      personality: { ...makePlayer().personality, leadership: 85 },
    });
    const mentee = makePlayer({
      id: playerId('mentee-1'),
      position: 'WR',
      personality: { ...makePlayer().personality, coachability: 80 },
    });

    const bus = new EventBus<GameEventMap>();
    const events: unknown[] = [];
    bus.on('MENTORSHIP_EFFECT', (p) => events.push(p));

    const result = evaluateMentorship(mentor, mentee, bus);
    expect(result.eligible).toBe(true);
    expect(result.skillBoost).toBeGreaterThanOrEqual(1);
    expect(result.skillBoost).toBeLessThanOrEqual(5);
    expect(events.length).toBe(1);
  });

  it('rejects mentorship across different position groups', () => {
    const mentor = makePlayer({
      id: playerId('mentor-1'),
      position: 'QB',
      experience: 10,
      personality: { ...makePlayer().personality, leadership: 90 },
    });
    const mentee = makePlayer({
      id: playerId('mentee-1'),
      position: 'RB',
      personality: { ...makePlayer().personality, coachability: 80 },
    });

    const result = evaluateMentorship(mentor, mentee);
    expect(result.eligible).toBe(false);
  });
});

describe('checkLockerRoomIssues', () => {
  const makeTeam = (): Team => ({
    id: teamId('team-1'),
    city: 'Test', name: 'Team', abbreviation: 'TST',
    conference: 'AFC', division: 'AFC East',
    stadium: 'Test Stadium',
    owner: { name: 'Owner', patience: 50, spendingWillingness: 50, mediaProfile: 'moderate', priorities: ['winning'] },
    roster: [], practiceSquad: [], injuredReserve: [],
    coachingStaff: [], headCoachId: null,
    depthChart: {} as any,
    record: { wins: 2, losses: 10, ties: 0, pointsFor: 200, pointsAgainst: 350, divisionWins: 0, divisionLosses: 6, conferenceWins: 1, conferenceLosses: 8, streak: { type: 'L', count: 5 } },
    analyticsLevel: 3, scoutingBudget: 50, facilitiesLevel: 3,
    delegationSettings: {
      depthChart: 'auto', practiceSquad: 'auto', waiverClaims: 'auto',
      trainingCampCuts: 'auto', contractNegotiations: 'manual',
      scoutingAssignments: 'auto', tradeEvaluation: 'review',
      draftBoard: 'manual', gameplanAdjustments: 'review',
    },
  });

  it('returns none severity when no issues exist', () => {
    const team = makeTeam();
    const players = [makePlayer({ personality: { ...makePlayer().personality, ego: 30 } })];

    const result = checkLockerRoomIssues(team, players, { losses: 2, cuts: [], trades: [] });
    expect(result.severity).toBe('none');
  });

  it('scales severity with number of high-ego players', () => {
    const team = makeTeam();
    const players = [
      makePlayer({ id: playerId('p1'), personality: { ...makePlayer().personality, ego: 85 } }),
      makePlayer({ id: playerId('p2'), personality: { ...makePlayer().personality, ego: 90 } }),
      makePlayer({ id: playerId('p3'), personality: { ...makePlayer().personality, ego: 80 } }),
    ];

    const result = checkLockerRoomIssues(team, players, { losses: 8, cuts: [], trades: [] });
    expect(result.severity).toBe('major');
    expect(result.instigatorIds.length).toBe(3);
  });
});

describe('updateMorale', () => {
  it('starts at 60 by default', () => {
    expect(updateMorale(undefined, [])).toBe(60);
  });

  it('increases with wins and decreases with losses', () => {
    const events: MoraleEvent[] = [
      { type: 'win' }, { type: 'win' }, { type: 'win' },
      { type: 'loss' },
    ];
    const morale = updateMorale(60, events);
    expect(morale).toBe(64);
  });

  it('applies large penalty for being cut', () => {
    const morale = updateMorale(60, [{ type: 'cut', wasCloseFriend: false }]);
    expect(morale).toBe(45);
  });

  it('applies smaller penalty when a close friend is cut', () => {
    const morale = updateMorale(60, [{ type: 'cut', wasCloseFriend: true }]);
    expect(morale).toBe(55);
  });

  it('clamps morale to [0, 100]', () => {
    const events: MoraleEvent[] = Array.from({ length: 20 }, () => ({ type: 'loss' as const }));
    expect(updateMorale(10, events)).toBe(0);

    const winEvents: MoraleEvent[] = Array.from({ length: 30 }, () => ({ type: 'win' as const }));
    expect(updateMorale(80, winEvents)).toBe(100);
  });
});
