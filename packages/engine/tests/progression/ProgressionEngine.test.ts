import { describe, it, expect } from 'vitest';
import { processOffseasonProgression } from '../../src/progression/ProgressionEngine.js';
import type { ProgressionContext } from '../../src/progression/ProgressionEngine.js';
import { generateLeague } from '../../src/league/LeagueGenerator.js';
import { EventBus } from '../../src/events/EventBus.js';
import { createLCG } from '../../src/sim/RNG.js';
import { playerId, teamId } from '../../src/types/ids.js';
import type { Player } from '../../src/types/player.js';
import type { GameEventMap } from '../../src/events/GameEvents.js';

function makePlayer(overrides: Partial<Player> = {}): Player {
  return {
    id: playerId('test-player-1'),
    firstName: 'Test',
    lastName: 'Player',
    age: 24,
    position: 'WR',
    secondaryPositions: [],
    teamId: teamId('team-1'),
    jerseyNumber: 88,
    experience: 2,
    college: 'Alabama',
    draftYear: 1,
    draftRound: 1,
    draftPick: 5,
    physical: { speed: 85, acceleration: 82, strength: 65, agility: 84, jumping: 80, stamina: 78, toughness: 70 },
    personality: { leadership: 50, workEthic: 80, ego: 40, coachability: 85, competitiveness: 75, composure: 70, loyalty: 60 },
    hidden: { trueOverall: 78, injuryProneness: 30, clutchFactor: 70, consistencyVariance: 15, ceilingFloor: [55, 92] },
    receiving: { catching: 80, spectacularCatch: 75, catchInTraffic: 72, routeRunning: 78, release: 76 },
    blocking: { runBlock: 45, passBlock: 40, impactBlock: 42, awareness: 55 },
    contract: null,
    injuryStatus: null,
    careerStats: {},
    seasonStats: {},
    ...overrides,
  };
}

function goodContext(overrides: Partial<ProgressionContext> = {}): ProgressionContext {
  return {
    coachDevelopmentRating: 80,
    schemeFitScore: 75,
    snapCountPercentage: 0.8,
    facilitiesLevel: 4,
    wasInjured: false,
    ...overrides,
  };
}

function deepClonePlayer(p: Player): Player {
  return JSON.parse(JSON.stringify(p)) as Player;
}

describe('processOffseasonProgression', () => {
  it('is deterministic: same seed produces same result', () => {
    const player1 = makePlayer();
    const player2 = makePlayer();
    const ctx = goodContext();

    const rng1 = createLCG(42);
    const rng2 = createLCG(42);

    const r1 = processOffseasonProgression(player1, ctx, rng1);
    const r2 = processOffseasonProgression(player2, ctx, rng2);

    expect(r1.changes).toEqual(r2.changes);
    expect(r1.breakout).toBe(r2.breakout);
    expect(r1.decline).toBe(r2.decline);
  });

  it('young player with high workEthic improves more than lazy player', () => {
    const hardWorker = makePlayer({ personality: { leadership: 50, workEthic: 95, ego: 40, coachability: 85, competitiveness: 75, composure: 70, loyalty: 60 } });
    const lazyPlayer = makePlayer({
      id: playerId('test-lazy'),
      personality: { leadership: 50, workEthic: 25, ego: 40, coachability: 85, competitiveness: 75, composure: 70, loyalty: 60 },
    });
    const ctx = goodContext();

    const totalDelta = (changes: Record<string, { old: number; new: number }>) =>
      Object.values(changes).reduce((sum, c) => sum + (c.new - c.old), 0);

    let hardWorkerSum = 0;
    let lazySum = 0;
    const trials = 50;

    for (let seed = 1; seed <= trials; seed++) {
      const hw = deepClonePlayer(hardWorker);
      const lz = deepClonePlayer(lazyPlayer);
      const r1 = processOffseasonProgression(hw, ctx, createLCG(seed));
      const r2 = processOffseasonProgression(lz, ctx, createLCG(seed));
      hardWorkerSum += totalDelta(r1.changes);
      lazySum += totalDelta(r2.changes);
    }

    expect(hardWorkerSum / trials).toBeGreaterThan(lazySum / trials);
  });

  it('old RB declines while old QB is more stable', () => {
    const oldRB = makePlayer({
      id: playerId('old-rb'),
      position: 'RB',
      age: 32,
      physical: { speed: 78, acceleration: 76, strength: 72, agility: 77, jumping: 70, stamina: 68, toughness: 75 },
      rushing: { carrying: 80, breakTackle: 78, elusiveness: 76, ballCarrierVision: 82, trucking: 74 },
      hidden: { trueOverall: 75, injuryProneness: 40, clutchFactor: 60, consistencyVariance: 20, ceilingFloor: [40, 88] },
    });

    const oldQB = makePlayer({
      id: playerId('old-qb'),
      position: 'QB',
      age: 32,
      physical: { speed: 60, acceleration: 58, strength: 65, agility: 62, jumping: 55, stamina: 72, toughness: 78 },
      passing: { throwPower: 85, shortAccuracy: 88, mediumAccuracy: 86, deepAccuracy: 80, throwOnRun: 75, playAction: 82 },
      rushing: { carrying: 55, breakTackle: 45, elusiveness: 50, ballCarrierVision: 60, trucking: 40 },
      hidden: { trueOverall: 82, injuryProneness: 25, clutchFactor: 85, consistencyVariance: 10, ceilingFloor: [45, 95] },
    });

    const ctx = goodContext();

    const totalDelta = (changes: Record<string, { old: number; new: number }>) =>
      Object.values(changes).reduce((sum, c) => sum + (c.new - c.old), 0);

    let rbSum = 0;
    let qbSum = 0;
    const trials = 50;

    for (let seed = 1; seed <= trials; seed++) {
      const rb = deepClonePlayer(oldRB);
      const qb = deepClonePlayer(oldQB);
      rbSum += totalDelta(processOffseasonProgression(rb, ctx, createLCG(seed)).changes);
      qbSum += totalDelta(processOffseasonProgression(qb, ctx, createLCG(seed)).changes);
    }

    // RB at 32 is well past peak (24-27), QB at 32 is still in peak (27-35)
    expect(rbSum / trials).toBeLessThan(qbSum / trials);
  });

  it('breakout events can fire for young high-ceiling players', () => {
    const youngStar = makePlayer({
      age: 22,
      hidden: { trueOverall: 78, injuryProneness: 30, clutchFactor: 70, consistencyVariance: 15, ceilingFloor: [55, 92] },
    });
    const ctx = goodContext({ coachDevelopmentRating: 95 });

    let breakouts = 0;
    const trials = 1000;

    for (let seed = 1; seed <= trials; seed++) {
      const p = deepClonePlayer(youngStar);
      const result = processOffseasonProgression(p, ctx, createLCG(seed * 104729));
      if (result.breakout) breakouts++;
    }

    expect(breakouts).toBeGreaterThan(0);
    expect(breakouts).toBeLessThan(trials * 0.25);
  });

  it('sharp decline events can fire for old players past peak', () => {
    const oldPlayer = makePlayer({
      position: 'RB',
      age: 33,
      hidden: { trueOverall: 70, injuryProneness: 50, clutchFactor: 60, consistencyVariance: 20, ceilingFloor: [35, 85] },
    });
    const ctx = goodContext();

    let declines = 0;
    const trials = 1000;

    for (let seed = 1; seed <= trials; seed++) {
      const p = deepClonePlayer(oldPlayer);
      const result = processOffseasonProgression(p, ctx, createLCG(seed * 104729));
      if (result.decline) declines++;
    }

    expect(declines).toBeGreaterThan(0);
    expect(declines).toBeLessThan(trials * 0.25);
  });

  it('player never exceeds ceiling or drops below floor', () => {
    const { players } = generateLeague(42);
    const ctx = goodContext();

    for (let i = 0; i < 100; i++) {
      const original = players[i]!;
      const p = deepClonePlayer(original);
      const rng = createLCG(i + 1);
      processOffseasonProgression(p, ctx, rng);

      const [floor, ceiling] = original.hidden.ceilingFloor;
      const allRatings = [
        ...Object.values(p.physical),
        ...Object.values(p.passing ?? {}),
        ...Object.values(p.rushing ?? {}),
        ...Object.values(p.receiving ?? {}),
        ...Object.values(p.blocking ?? {}),
        ...Object.values(p.defense ?? {}),
        ...Object.values(p.kicking ?? {}),
        ...Object.values(p.punting ?? {}),
      ];

      for (const rating of allRatings) {
        expect(rating).toBeGreaterThanOrEqual(Math.max(0, floor));
        expect(rating).toBeLessThanOrEqual(Math.min(99, ceiling));
      }
    }
  });

  it('injured players progress slower than non-injured', () => {
    const totalDelta = (changes: Record<string, { old: number; new: number }>) =>
      Object.values(changes).reduce((sum, c) => sum + (c.new - c.old), 0);

    let healthySum = 0;
    let injuredSum = 0;
    const trials = 50;

    for (let seed = 1; seed <= trials; seed++) {
      const healthy = makePlayer();
      const injured = deepClonePlayer(healthy);

      const r1 = processOffseasonProgression(healthy, goodContext({ wasInjured: false }), createLCG(seed));
      const r2 = processOffseasonProgression(injured, goodContext({ wasInjured: true }), createLCG(seed));

      healthySum += totalDelta(r1.changes);
      injuredSum += totalDelta(r2.changes);
    }

    expect(healthySum / trials).toBeGreaterThan(injuredSum / trials);
  });

  it('emits RATING_CHANGED events via the event bus', () => {
    const bus = new EventBus<GameEventMap>();
    const events: unknown[] = [];
    bus.on('RATING_CHANGED', (payload) => events.push(payload));

    const player = makePlayer();
    const ctx = goodContext();
    const rng = createLCG(42);

    processOffseasonProgression(player, ctx, rng, bus);

    expect(events.length).toBeGreaterThan(0);
  });

  it('emits PLAYER_BREAKOUT event when breakout occurs', () => {
    const bus = new EventBus<GameEventMap>();
    let breakoutEvent: unknown = null;
    bus.on('PLAYER_BREAKOUT', (payload) => { breakoutEvent = payload; });

    const youngStar = makePlayer({
      age: 22,
      hidden: { trueOverall: 78, injuryProneness: 30, clutchFactor: 70, consistencyVariance: 15, ceilingFloor: [55, 92] },
    });
    const ctx = goodContext({ coachDevelopmentRating: 95 });

    for (let seed = 1; seed <= 1000; seed++) {
      breakoutEvent = null;
      const p = deepClonePlayer(youngStar);
      const result = processOffseasonProgression(p, ctx, createLCG(seed), bus);
      if (result.breakout) {
        expect(breakoutEvent).not.toBeNull();
        break;
      }
    }
  });

  it('different seeds produce different results', () => {
    const p1 = makePlayer();
    const p2 = makePlayer();
    const ctx = goodContext();

    const r1 = processOffseasonProgression(p1, ctx, createLCG(42));
    const r2 = processOffseasonProgression(p2, ctx, createLCG(999));

    const vals1 = Object.values(r1.changes).map(c => c.new);
    const vals2 = Object.values(r2.changes).map(c => c.new);

    expect(vals1).not.toEqual(vals2);
  });
});
