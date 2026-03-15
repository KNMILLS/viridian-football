import { describe, it, expect } from 'vitest';
import { CoachingEngine } from '../../src/coaching/CoachingEngine.js';
import { generateLeague } from '../../src/league/LeagueGenerator.js';
import { EventBus } from '../../src/events/EventBus.js';
import { createLCG } from '../../src/sim/RNG.js';
import { coachId, playerId, teamId } from '../../src/types/ids.js';
import type { Coach } from '../../src/types/coach.js';
import type { Player } from '../../src/types/player.js';
import type { GameEventMap } from '../../src/events/GameEvents.js';

function setup(seed = 42) {
  const { coaches, players } = generateLeague(seed);
  const bus = new EventBus<GameEventMap>();
  const rng = createLCG(seed);
  const engine = new CoachingEngine(coaches, players, bus, rng);
  return { engine, coaches, players, bus, rng };
}

describe('CoachingEngine', () => {
  describe('calculateSchemeFit', () => {
    it('returns a valid SchemeFitResult with fitScore 0-100', () => {
      const { engine, players, coaches } = setup();
      const player = players[0]!;
      const coach = coaches.find(c => c.role === 'OC')!;
      const result = engine.calculateSchemeFit(player.id as string, coach.id as string);

      expect(result.fitScore).toBeGreaterThanOrEqual(0);
      expect(result.fitScore).toBeLessThanOrEqual(100);
      expect(result.performanceMultiplier).toBeGreaterThanOrEqual(0.85);
      expect(result.performanceMultiplier).toBeLessThanOrEqual(1.15);
      expect(result.playerId).toBe(player.id as string);
      expect(result.coachId).toBe(coach.id as string);
    });

    it('returns higher fit for a speed WR in air_raid than in power_run', () => {
      const bus = new EventBus<GameEventMap>();
      const rng = createLCG(42);

      const speedWR: Player = {
        id: playerId('speed-wr'),
        firstName: 'Tyreek', lastName: 'Hill',
        age: 26, position: 'WR', secondaryPositions: [],
        teamId: teamId('team-1'), jerseyNumber: 10, experience: 4,
        college: 'Alabama', draftYear: 1, draftRound: 1, draftPick: 10,
        physical: { speed: 97, acceleration: 95, strength: 55, agility: 94, jumping: 85, stamina: 80, toughness: 60 },
        personality: { leadership: 50, workEthic: 70, ego: 60, coachability: 65, competitiveness: 80, composure: 60, loyalty: 50 },
        hidden: { trueOverall: 88, injuryProneness: 30, clutchFactor: 75, consistencyVariance: 15, ceilingFloor: [60, 95] },
        receiving: { catching: 90, spectacularCatch: 88, catchInTraffic: 80, routeRunning: 92, release: 90 },
        blocking: { runBlock: 35, passBlock: 30, impactBlock: 32, awareness: 45 },
        contract: null, injuryStatus: null, careerStats: {}, seasonStats: {},
      };

      const airRaidCoach: Coach = {
        id: coachId('air-raid-coach'),
        firstName: 'Air', lastName: 'Raid',
        age: 50, role: 'OC', teamId: null,
        offensiveScheme: 'air_raid', defensiveScheme: null,
        attributes: { gameManagement: 70, playerDevelopment: 70, playCalling: 70, schemeDesign: 70, recruiting: 70, adaptability: 70 },
        personality: { aggressiveness: 60, discipline: 60, motivation: 70, innovation: 70, ego: 40, mediaPresence: 'moderate' },
        coachingTreeOrigin: null, yearsExperience: 15,
        record: { wins: 80, losses: 60, ties: 0 },
        playoffAppearances: 3, championships: 0,
        salary: 3_000_000, contractYearsRemaining: 2,
      };
      const powerRunCoach: Coach = {
        ...airRaidCoach,
        id: coachId('power-run-coach'),
        offensiveScheme: 'power_run',
      };

      const engine = new CoachingEngine(
        [airRaidCoach, powerRunCoach],
        [speedWR],
        bus,
        rng,
      );

      const airRaidFit = engine.calculateSchemeFit(speedWR.id as string, airRaidCoach.id as string);
      const powerRunFit = engine.calculateSchemeFit(speedWR.id as string, powerRunCoach.id as string);

      expect(airRaidFit.fitScore).toBeGreaterThan(powerRunFit.fitScore);
    });

    it('returns default values for unknown player or coach', () => {
      const { engine } = setup();
      const result = engine.calculateSchemeFit('unknown-player', 'unknown-coach');

      expect(result.fitScore).toBe(50);
      expect(result.performanceMultiplier).toBe(1.0);
      expect(result.keyAttributes).toEqual([]);
    });

    it('returns up to 4 key attributes', () => {
      const { engine, players, coaches } = setup();
      const wr = players.find(p => p.position === 'WR')!;
      const oc = coaches.find(c => c.role === 'OC')!;
      const result = engine.calculateSchemeFit(wr.id as string, oc.id as string);

      expect(result.keyAttributes.length).toBeLessThanOrEqual(4);
      expect(result.keyAttributes.length).toBeGreaterThan(0);
    });

    it('is deterministic for same inputs', () => {
      const { engine, players, coaches } = setup(123);
      const player = players[0]!;
      const coach = coaches[0]!;

      const r1 = engine.calculateSchemeFit(player.id as string, coach.id as string);
      const r2 = engine.calculateSchemeFit(player.id as string, coach.id as string);

      expect(r1).toEqual(r2);
    });
  });

  describe('getCoachingTree', () => {
    it('returns treeBonus 0 for coach without mentor', () => {
      const { engine, coaches } = setup();
      const coach = coaches.find(c => c.coachingTreeOrigin === null)!;
      const tree = engine.getCoachingTree(coach.id);

      expect(tree.mentorId).toBeNull();
      expect(tree.treeBonus).toBe(0);
    });

    it('returns positive treeBonus for coach with successful mentor', () => {
      const { players } = generateLeague(42);
      const bus = new EventBus<GameEventMap>();
      const rng = createLCG(42);

      const mentor: Coach = {
        id: coachId('mentor-1'),
        firstName: 'Bill', lastName: 'Walsh',
        age: 60, role: 'HC',
        teamId: null,
        offensiveScheme: 'west_coast', defensiveScheme: null,
        attributes: { gameManagement: 90, playerDevelopment: 90, playCalling: 90, schemeDesign: 90, recruiting: 85, adaptability: 85 },
        personality: { aggressiveness: 50, discipline: 90, motivation: 90, innovation: 80, ego: 50, mediaPresence: 'moderate' },
        coachingTreeOrigin: null,
        yearsExperience: 25,
        record: { wins: 200, losses: 80, ties: 0 },
        playoffAppearances: 10,
        championships: 3,
        salary: 10_000_000,
        contractYearsRemaining: 3,
      };

      const protege: Coach = {
        ...mentor,
        id: coachId('protege-1'),
        firstName: 'Mike', lastName: 'Shanahan',
        age: 45,
        coachingTreeOrigin: mentor.id,
        record: { wins: 50, losses: 30, ties: 0 },
        championships: 0,
        playoffAppearances: 3,
      };

      const engine = new CoachingEngine([mentor, protege], players, bus, rng);
      const tree = engine.getCoachingTree(protege.id);

      expect(tree.mentorId).toBe(mentor.id);
      expect(tree.treeBonus).toBeGreaterThan(0);
      expect(tree.treeBonus).toBeLessThanOrEqual(15);
    });

    it('lists proteges correctly', () => {
      const { players } = generateLeague(42);
      const bus = new EventBus<GameEventMap>();
      const rng = createLCG(42);

      const mentor: Coach = {
        id: coachId('head-coach'),
        firstName: 'Sean', lastName: 'McVay',
        age: 55, role: 'HC',
        teamId: null,
        offensiveScheme: 'spread', defensiveScheme: null,
        attributes: { gameManagement: 80, playerDevelopment: 80, playCalling: 80, schemeDesign: 80, recruiting: 75, adaptability: 75 },
        personality: { aggressiveness: 60, discipline: 70, motivation: 85, innovation: 70, ego: 40, mediaPresence: 'moderate' },
        coachingTreeOrigin: null,
        yearsExperience: 20,
        record: { wins: 100, losses: 60, ties: 0 },
        playoffAppearances: 5,
        championships: 1,
        salary: 8_000_000,
        contractYearsRemaining: 2,
      };

      const p1: Coach = { ...mentor, id: coachId('p1'), role: 'OC', coachingTreeOrigin: mentor.id };
      const p2: Coach = { ...mentor, id: coachId('p2'), role: 'DC', coachingTreeOrigin: mentor.id, offensiveScheme: null, defensiveScheme: '3_4' };

      const engine = new CoachingEngine([mentor, p1, p2], players, bus, rng);
      const tree = engine.getCoachingTree(mentor.id);

      expect(tree.proteges).toHaveLength(2);
      expect(tree.proteges).toContain(p1.id);
      expect(tree.proteges).toContain(p2.id);
    });
  });

  describe('evaluateCoachPerformance', () => {
    it('returns higher score for winning coach', () => {
      const { players } = generateLeague(42);
      const bus = new EventBus<GameEventMap>();
      const rng = createLCG(42);

      const winner: Coach = {
        id: coachId('winner'),
        firstName: 'Andy', lastName: 'Reid',
        age: 55, role: 'HC',
        teamId: null,
        offensiveScheme: 'west_coast', defensiveScheme: null,
        attributes: { gameManagement: 85, playerDevelopment: 90, playCalling: 85, schemeDesign: 80, recruiting: 80, adaptability: 85 },
        personality: { aggressiveness: 50, discipline: 80, motivation: 85, innovation: 60, ego: 30, mediaPresence: 'moderate' },
        coachingTreeOrigin: null,
        yearsExperience: 20,
        record: { wins: 150, losses: 50, ties: 0 },
        playoffAppearances: 8,
        championships: 2,
        salary: 12_000_000,
        contractYearsRemaining: 4,
      };

      const loser: Coach = {
        ...winner,
        id: coachId('loser'),
        record: { wins: 20, losses: 150, ties: 0 },
        attributes: { gameManagement: 40, playerDevelopment: 40, playCalling: 45, schemeDesign: 40, recruiting: 45, adaptability: 40 },
        personality: { ...winner.personality, discipline: 35 },
        playoffAppearances: 0,
        championships: 0,
      };

      const engine = new CoachingEngine([winner, loser], players, bus, rng);
      const winnerScore = engine.evaluateCoachPerformance(winner.id, 1);
      const loserScore = engine.evaluateCoachPerformance(loser.id, 1);

      expect(winnerScore).toBeGreaterThan(60);
      expect(loserScore).toBeLessThan(40);
      expect(winnerScore).toBeGreaterThan(loserScore);
    });

    it('returns 0 for unknown coach', () => {
      const { engine } = setup();
      expect(engine.evaluateCoachPerformance(coachId('unknown'), 1)).toBe(0);
    });

    it('score is clamped 0-100', () => {
      const { engine, coaches } = setup();
      for (const coach of coaches) {
        const score = engine.evaluateCoachPerformance(coach.id, 1);
        expect(score).toBeGreaterThanOrEqual(0);
        expect(score).toBeLessThanOrEqual(100);
      }
    });
  });

  describe('generateCandidatePool', () => {
    it('generates 8-12 candidates for HC', () => {
      const { engine } = setup();
      const pool = engine.generateCandidatePool('HC');

      expect(pool.length).toBeGreaterThanOrEqual(8);
      expect(pool.length).toBeLessThanOrEqual(12);
    });

    it('all candidates have correct role', () => {
      const { engine } = setup();
      const pool = engine.generateCandidatePool('OC');
      for (const c of pool) {
        expect(c.role).toBe('OC');
      }
    });

    it('candidates have reasonable attribute ranges', () => {
      const { engine } = setup();
      const pool = engine.generateCandidatePool('DC');
      for (const c of pool) {
        expect(c.attributes.gameManagement).toBeGreaterThanOrEqual(40);
        expect(c.attributes.gameManagement).toBeLessThanOrEqual(95);
        expect(c.attributes.playerDevelopment).toBeGreaterThanOrEqual(40);
        expect(c.attributes.playerDevelopment).toBeLessThanOrEqual(95);
        expect(c.age).toBeGreaterThanOrEqual(28);
        expect(c.age).toBeLessThanOrEqual(72);
      }
    });

    it('includes mix of scheme philosophies', () => {
      const { engine } = setup(999);
      const pool = engine.generateCandidatePool('DC');
      const schemes = new Set(pool.map(c => c.defensiveScheme).filter(Boolean));
      expect(schemes.size).toBeGreaterThanOrEqual(1);
    });

    it('candidates are not assigned to a team', () => {
      const { engine } = setup();
      const pool = engine.generateCandidatePool('HC');
      for (const c of pool) {
        expect(c.teamId).toBeNull();
      }
    });

    it('some tree-origin candidates reference existing coaches', () => {
      const { engine, coaches } = setup();
      const pool = engine.generateCandidatePool('OC');
      const existingIds = new Set(coaches.map(c => c.id as string));
      const treeCandidates = pool.filter(c => c.coachingTreeOrigin !== null);

      expect(treeCandidates.length).toBeGreaterThan(0);
      for (const tc of treeCandidates) {
        expect(existingIds.has(tc.coachingTreeOrigin as string)).toBe(true);
      }
    });
  });
});
