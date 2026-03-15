import { describe, it, expect } from 'vitest';
import { createLCG, chance } from '../../src/sim/RNG.js';
import { rollForInjury, processWeeklyRecovery, getPerformancePenalty, getPositionGroup } from '../../src/injury/InjuryEngine.js';
import { BASE_INJURY_RATES, SEVERITY_WEIGHTS } from '../../src/injury/injuryTables.js';
import { EventBus } from '../../src/events/EventBus.js';
import type { GameEventMap } from '../../src/events/GameEvents.js';
import type { Player, InjuryStatus } from '../../src/types/index.js';
import { playerId, teamId } from '../../src/types/index.js';
import type { GameContext, InjuryHistory } from '../../src/injury/InjuryEngine.js';

function makePlayer(overrides: Partial<Player> = {}): Player {
  return {
    id: playerId('player-1'),
    firstName: 'Test',
    lastName: 'Player',
    age: 26,
    position: 'RB',
    secondaryPositions: [],
    teamId: teamId('team-1'),
    jerseyNumber: 22,
    experience: 4,
    college: 'State U',
    draftYear: 2022,
    draftRound: 2,
    draftPick: 40,
    physical: {
      speed: 85, acceleration: 82, strength: 75,
      agility: 80, jumping: 78, stamina: 80, toughness: 70,
    },
    personality: {
      leadership: 55, workEthic: 70, ego: 40,
      coachability: 65, competitiveness: 75, composure: 60, loyalty: 65,
    },
    hidden: {
      trueOverall: 78, injuryProneness: 50,
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

const defaultContext: GameContext = {
  week: { season: 2026, week: 5, phase: 'regular' },
};

describe('rollForInjury', () => {
  it('returns deterministic results for the same seed', () => {
    const player = makePlayer({ hidden: { ...makePlayer().hidden, injuryProneness: 99 } });
    const results1: (InjuryStatus | null)[] = [];
    const results2: (InjuryStatus | null)[] = [];

    const rng1 = createLCG(42);
    const rng2 = createLCG(42);
    for (let i = 0; i < 200; i++) {
      results1.push(rollForInjury(player, defaultContext, rng1));
      results2.push(rollForInjury(player, defaultContext, rng2));
    }
    expect(results1).toEqual(results2);
  });

  it('scales injury probability with injuryProneness', () => {
    const lowProne = makePlayer({ hidden: { ...makePlayer().hidden, injuryProneness: 5 } });
    const highProne = makePlayer({ hidden: { ...makePlayer().hidden, injuryProneness: 95 } });
    let lowCount = 0;
    let highCount = 0;
    const iterations = 20_000;

    const rng1 = createLCG(123);
    const rng2 = createLCG(123);
    for (let i = 0; i < iterations; i++) {
      if (rollForInjury(lowProne, defaultContext, rng1)) lowCount++;
      if (rollForInjury(highProne, defaultContext, rng2)) highCount++;
    }

    expect(highCount).toBeGreaterThan(lowCount * 1.5);
  });

  it('produces higher injury rates for RBs than kickers', () => {
    const rb = makePlayer({ position: 'RB' });
    const kicker = makePlayer({ position: 'K' });
    let rbCount = 0;
    let kCount = 0;
    const iterations = 20_000;

    const rng1 = createLCG(77);
    const rng2 = createLCG(77);
    for (let i = 0; i < iterations; i++) {
      if (rollForInjury(rb, defaultContext, rng1)) rbCount++;
      if (rollForInjury(kicker, defaultContext, rng2)) kCount++;
    }

    expect(rbCount).toBeGreaterThan(kCount * 3);
  });

  it('produces severity distribution matching weights over many iterations', () => {
    const player = makePlayer({ hidden: { ...makePlayer().hidden, injuryProneness: 99 } });
    const counts = { minor: 0, moderate: 0, severe: 0, season_ending: 0 };
    const rng = createLCG(42);

    for (let i = 0; i < 50_000; i++) {
      const result = rollForInjury(player, defaultContext, rng);
      if (result) counts[result.severity]++;
    }

    const total = counts.minor + counts.moderate + counts.severe + counts.season_ending;
    expect(total).toBeGreaterThan(100);

    const minorPct = counts.minor / total;
    const moderatePct = counts.moderate / total;
    const severePct = counts.severe / total;
    const sePct = counts.season_ending / total;

    expect(minorPct).toBeGreaterThan(0.4);
    expect(minorPct).toBeLessThan(0.6);
    expect(moderatePct).toBeGreaterThan(0.2);
    expect(moderatePct).toBeLessThan(0.4);
    expect(severePct).toBeGreaterThan(0.08);
    expect(severePct).toBeLessThan(0.25);
    expect(sePct).toBeGreaterThan(0.01);
    expect(sePct).toBeLessThan(0.12);
  });

  it('marks recurring injuries and increases recovery time', () => {
    const player = makePlayer({ hidden: { ...makePlayer().hidden, injuryProneness: 99 } });
    const context: GameContext = { week: { season: 2026, week: 5, phase: 'regular' } };
    const history: InjuryHistory[] = [{ bodyPart: 'knee', season: 2025 }];

    const rng = createLCG(42);
    let foundRecurring = false;
    for (let i = 0; i < 5000; i++) {
      const result = rollForInjury(player, context, rng, history);
      if (result && result.type.toLowerCase().includes('knee') || result?.type.toLowerCase().includes('acl') || result?.type.toLowerCase().includes('mcl') || result?.type.toLowerCase().includes('meniscus')) {
        if (result.isRecurring) {
          foundRecurring = true;
          break;
        }
      }
    }
    expect(foundRecurring).toBe(true);
  });
});

describe('processWeeklyRecovery', () => {
  it('decrements weeksRemaining', () => {
    const player = makePlayer({
      injuryStatus: {
        type: 'hamstring strain',
        severity: 'minor',
        weeksRemaining: 2,
        performancePenalty: 0.9,
        isRecurring: false,
      },
    });

    const rng = createLCG(999);
    const result = processWeeklyRecovery(player, rng);

    if (result.recovered) {
      expect(result.updatedStatus).toBeNull();
    } else if (!result.worsened) {
      expect(result.updatedStatus!.weeksRemaining).toBeLessThan(2);
    }
  });

  it('emits PLAYER_RECOVERED when weeks hit zero', () => {
    const player = makePlayer({
      injuryStatus: {
        type: 'hamstring strain',
        severity: 'minor',
        weeksRemaining: 1,
        performancePenalty: 0.9,
        isRecurring: false,
      },
    });

    const bus = new EventBus<GameEventMap>();
    const recovered: unknown[] = [];
    bus.on('PLAYER_RECOVERED', (p) => recovered.push(p));

    const rng = createLCG(999);
    const result = processWeeklyRecovery(player, rng, bus);

    if (result.recovered) {
      expect(recovered.length).toBe(1);
    }
  });
});

describe('getPerformancePenalty', () => {
  it('returns 0.85-0.95 for minor injuries', () => {
    const penalty = getPerformancePenalty({
      type: 'ankle sprain', severity: 'minor',
      weeksRemaining: 1, performancePenalty: 0, isRecurring: false,
    });
    expect(penalty).toBeGreaterThanOrEqual(0.85);
    expect(penalty).toBeLessThanOrEqual(0.95);
  });

  it('returns 0.6-0.8 for moderate injuries', () => {
    const penalty = getPerformancePenalty({
      type: 'hamstring tear', severity: 'moderate',
      weeksRemaining: 4, performancePenalty: 0, isRecurring: false,
    });
    expect(penalty).toBeGreaterThanOrEqual(0.6);
    expect(penalty).toBeLessThanOrEqual(0.8);
  });

  it('returns 0 for severe and season-ending injuries', () => {
    expect(getPerformancePenalty({
      type: 'ACL tear', severity: 'severe',
      weeksRemaining: 8, performancePenalty: 0, isRecurring: false,
    })).toBe(0);
    expect(getPerformancePenalty({
      type: 'ACL tear', severity: 'season_ending',
      weeksRemaining: 16, performancePenalty: 0, isRecurring: false,
    })).toBe(0);
  });
});
