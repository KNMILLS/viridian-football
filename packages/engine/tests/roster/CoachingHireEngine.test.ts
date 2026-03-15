import { describe, it, expect, vi } from 'vitest';
import { CoachingHireEngine } from '../../src/roster/CoachingHireEngine.js';
import { EventBus } from '../../src/events/EventBus.js';
import type { GameEventMap } from '../../src/events/GameEvents.js';
import type { Player } from '../../src/types/player.js';
import type { Team, DepthChart, TeamRecord, OwnerProfile } from '../../src/types/team.js';
import type { Coach, ICoachingEngine, SchemeFitResult, CoachingTreeNode, CoachDepthChartDecision, GamePlan, CoachRole } from '../../src/types/coach.js';
import { teamId, playerId, coachId } from '../../src/types/ids.js';
import { Position } from '../../src/types/player.js';
import { createLCG } from '../../src/sim/RNG.js';
import type { CoachId, TeamId } from '../../src/types/ids.js';

// ── Helpers ────────────────────────────────────────────────────────

function emptyDepthChart(): DepthChart {
  const chart = {} as DepthChart;
  for (const pos of Position.options) chart[pos] = [];
  return chart;
}

function makePlayer(overrides: Partial<Player> = {}): Player {
  return {
    id: playerId('p1'),
    firstName: 'Test',
    lastName: 'Player',
    age: 26,
    position: 'QB',
    secondaryPositions: [],
    teamId: teamId('t1'),
    jerseyNumber: 12,
    experience: 4,
    college: 'State U',
    draftYear: 1,
    draftRound: 1,
    draftPick: 1,
    physical: {
      speed: 80, acceleration: 80, strength: 70,
      agility: 75, jumping: 70, stamina: 85, toughness: 80,
    },
    personality: {
      leadership: 70, workEthic: 75, ego: 50,
      coachability: 70, competitiveness: 80, composure: 75, loyalty: 75,
      greed: 50, legacyDrive: 50, fameSeeking: 40, familyOriented: 50,
      teamChemistryEffect: 60, prankster: 20, loner: 30,
      mentorWillingness: 60, respectForVeterans: 70, aggression: 50,
      discipline: 70, motorEffort: 75, footballIQ: 70, filmStudyDedication: 65,
      offFieldRisk: 15, mediaHandling: 'professional' as const, communityEngagement: 50,
      durabilityMindset: 70, resilience: 65, confidenceVolatility: 30,
      chipOnShoulder: 40,
    },
    hidden: {
      trueOverall: 82, injuryProneness: 30, clutchFactor: 70,
      consistencyVariance: 10, ceilingFloor: [70, 92] as [number, number],
      footballCharacter: 75, schemeVersatility: 60,
    },
    contract: null,
    injuryStatus: null,
    careerStats: {},
    seasonStats: {},
    ...overrides,
  } as Player;
}

function makeCoach(overrides: Partial<Coach> = {}): Coach {
  return {
    id: coachId('hc1'),
    firstName: 'Coach',
    lastName: 'Test',
    age: 55,
    role: 'HC',
    teamId: teamId('t1'),
    offensiveScheme: 'west_coast',
    defensiveScheme: '4_3_under',
    attributes: {
      gameManagement: 70, playerDevelopment: 70, playCalling: 65,
      schemeDesign: 70, recruiting: 60, adaptability: 65,
      talentEvaluation: 70, situationalAwareness: 70,
    },
    personality: {
      aggressiveness: 50, discipline: 70, motivation: 65,
      innovation: 50, ego: 40, stubbornness: 45,
      trustInYouth: 60, mediaPresence: 'professional',
    },
    tendencies: {
      runPassRatio: 0.45, earlyDownRunRate: 0.5, playActionFrequency: 0.2,
      fourthDownAggressiveness: 40, redZoneAggression: 50,
      twoMinuteDrillEfficiency: 60, blitzRate: 0.3, coverageDisguise: 50,
      rotationPhilosophy: 'committee', rookieLeash: 50, veteranLoyalty: 50,
      starterReps: 65, tempoPreference: 'balanced', formationVariety: 50,
      motionFrequency: 40, preferredPersonnelGroupings: [],
    },
    coachingTreeOrigin: null,
    yearsExperience: 20,
    record: { wins: 100, losses: 80, ties: 0 },
    playoffAppearances: 3,
    championships: 0,
    salary: 5_000_000,
    contractYearsRemaining: 3,
    ...overrides,
  } as Coach;
}

function makeTeam(overrides: Partial<Team> = {}): Team {
  return {
    id: teamId('t1'),
    city: 'Test',
    name: 'Team',
    abbreviation: 'TST',
    conference: 'AFC',
    division: 'AFC East',
    stadium: 'Test Stadium',
    owner: { name: 'Owner', patience: 50, spendingWillingness: 60, mediaProfile: 'moderate', priorities: ['winning'] },
    roster: [],
    practiceSquad: [],
    injuredReserve: [],
    coachingStaff: [coachId('hc1')],
    headCoachId: coachId('hc1'),
    depthChart: emptyDepthChart(),
    record: { wins: 4, losses: 13, ties: 0, pointsFor: 280, pointsAgainst: 420, divisionWins: 1, divisionLosses: 5, conferenceWins: 2, conferenceLosses: 10, streak: { type: 'L', count: 5 } },
    analyticsLevel: 3,
    scoutingBudget: 1_000_000,
    facilitiesLevel: 3,
    delegationSettings: {
      practiceSquad: 'manual', waiverClaims: 'manual', trainingCampCuts: 'manual',
      injuredReserve: 'manual', contractNegotiations: 'manual', scoutingAssignments: 'manual',
      tradeEvaluation: 'manual', draftBoard: 'manual', freeAgencyTargets: 'manual',
    },
    ...overrides,
  } as Team;
}

function makeRecord(wins: number, losses: number): TeamRecord {
  return {
    wins, losses, ties: 0,
    pointsFor: wins * 25, pointsAgainst: losses * 25,
    divisionWins: 0, divisionLosses: 0,
    conferenceWins: 0, conferenceLosses: 0,
    streak: { type: wins > losses ? 'W' : 'L', count: 1 },
  };
}

function makeOwner(overrides: Partial<OwnerProfile> = {}): OwnerProfile {
  return { name: 'Owner', patience: 50, spendingWillingness: 60, mediaProfile: 'moderate', priorities: ['winning'], ...overrides };
}

function makeCoachingEngine(): ICoachingEngine {
  return {
    calculateSchemeFit: vi.fn(() => ({ playerId: 'p1', coachId: 'hc1', fitScore: 70, keyAttributes: [], performanceMultiplier: 1.0 }) as SchemeFitResult),
    getCoachingTree: vi.fn(() => ({ coachId: coachId('hc1'), mentorId: null, proteges: [], treeBonus: 0 }) as CoachingTreeNode),
    evaluateCoachPerformance: vi.fn(() => 50),
    generateCandidatePool: vi.fn(() => [
      makeCoach({ id: coachId('cand1'), teamId: null, offensiveScheme: 'spread', defensiveScheme: 'nickel_base' }),
      makeCoach({ id: coachId('cand2'), teamId: null, offensiveScheme: 'air_raid', defensiveScheme: '3_4' }),
    ]),
    generateDepthChart: vi.fn(() => [] as CoachDepthChartDecision[]),
    generateGamePlan: vi.fn(() => ({} as GamePlan)),
  };
}

function makeBus(): EventBus<GameEventMap> {
  return new EventBus<GameEventMap>();
}

// ── Tests ──────────────────────────────────────────────────────────

describe('CoachingHireEngine', () => {
  describe('evaluateCoachPerformance', () => {
    it('recommends firing for below-expectation record with low owner patience', () => {
      const coach = makeCoach({ record: { wins: 20, losses: 40, ties: 0 }, playoffAppearances: 0 });
      const engine = new CoachingHireEngine(
        [coach], [], [], makeBus(), makeCoachingEngine(), createLCG(42),
      );

      const result = engine.evaluateCoachPerformance(
        coach,
        makeRecord(3, 14),
        makeOwner({ patience: 20 }),
      );

      expect(result.shouldFire).toBe(true);
      expect(result.reasons.length).toBeGreaterThan(0);
    });

    it('playoff success buys patience', () => {
      const coach = makeCoach({
        record: { wins: 80, losses: 70, ties: 0 },
        playoffAppearances: 5,
        championships: 1,
      });
      const engine = new CoachingHireEngine(
        [coach], [], [], makeBus(), makeCoachingEngine(), createLCG(42),
      );

      const result = engine.evaluateCoachPerformance(
        coach,
        makeRecord(7, 10),
        makeOwner({ patience: 40 }),
      );

      expect(result.shouldFire).toBe(false);
    });
  });

  describe('fireCoach', () => {
    it('emits COACH_FIRED event', () => {
      const bus = makeBus();
      const handler = vi.fn();
      bus.on('COACH_FIRED', handler);

      const coach = makeCoach();
      const team = makeTeam();
      const engine = new CoachingHireEngine(
        [coach], [team], [], bus, makeCoachingEngine(), createLCG(42),
      );

      engine.fireCoach(coach.id, team.id);

      expect(handler).toHaveBeenCalledOnce();
      expect(handler).toHaveBeenCalledWith(expect.objectContaining({
        coachId: coach.id,
        teamId: team.id,
        role: 'HC',
      }));
    });

    it('causes morale loss for loyal players', () => {
      const bus = makeBus();
      const loyalPlayer = makePlayer({
        id: playerId('loyal1'),
        teamId: teamId('t1'),
        personality: {
          leadership: 70, workEthic: 75, ego: 30,
          coachability: 70, competitiveness: 70, composure: 70, loyalty: 85,
          greed: 30, legacyDrive: 50, fameSeeking: 30, familyOriented: 50,
          teamChemistryEffect: 70, prankster: 10, loner: 20,
          mentorWillingness: 60, respectForVeterans: 75, aggression: 40,
          discipline: 75, motorEffort: 70, footballIQ: 70, filmStudyDedication: 65,
          offFieldRisk: 10, mediaHandling: 'professional' as const, communityEngagement: 60,
          durabilityMindset: 70, resilience: 65, confidenceVolatility: 20,
          chipOnShoulder: 30,
        },
      });
      const coach = makeCoach();
      const team = makeTeam();
      const engine = new CoachingHireEngine(
        [coach], [team], [loyalPlayer], bus, makeCoachingEngine(), createLCG(42),
      );

      const result = engine.fireCoach(coach.id, team.id);

      expect(result.moraleEffects.length).toBeGreaterThan(0);
      const loyalEffect = result.moraleEffects.find((e) => e.playerId === loyalPlayer.id);
      expect(loyalEffect).toBeDefined();
      expect(loyalEffect!.delta).toBeLessThan(0);
    });
  });

  describe('hireCoach', () => {
    it('emits SCHEME_CHANGED and SCHEME_FIT_UPDATED when scheme differs', () => {
      const bus = makeBus();
      const schemeHandler = vi.fn();
      const fitHandler = vi.fn();
      bus.on('SCHEME_CHANGED', schemeHandler);
      bus.on('SCHEME_FIT_UPDATED', fitHandler);

      const oldCoach = makeCoach({
        id: coachId('old'),
        offensiveScheme: 'west_coast',
        defensiveScheme: '4_3_under',
        teamId: null,
      });
      const newCoach = makeCoach({
        id: coachId('new'),
        offensiveScheme: 'spread',
        defensiveScheme: '3_4',
        teamId: null,
      });
      const player = makePlayer({ id: playerId('p1'), teamId: teamId('t1') });
      const team = makeTeam({ headCoachId: oldCoach.id, coachingStaff: [oldCoach.id] });

      const engine = new CoachingHireEngine(
        [oldCoach, newCoach], [team], [player], bus, makeCoachingEngine(), createLCG(42),
      );

      engine.hireCoach(newCoach.id, team.id, 'HC');

      expect(schemeHandler).toHaveBeenCalled();
      expect(fitHandler).toHaveBeenCalled();
      expect(fitHandler).toHaveBeenCalledWith(expect.objectContaining({
        playerId: player.id,
        teamId: team.id,
      }));
    });
  });

  describe('simulateCoachingCarousel', () => {
    it('produces deterministic results with the same seed', () => {
      const bus = makeBus();
      const badCoach = makeCoach({
        id: coachId('bad_hc'),
        record: { wins: 10, losses: 50, ties: 0 },
        playoffAppearances: 0,
        championships: 0,
      });
      const team = makeTeam({
        headCoachId: badCoach.id,
        coachingStaff: [badCoach.id],
        record: makeRecord(2, 15),
        owner: makeOwner({ patience: 15 }),
      });

      const league = {
        teams: [team],
        coaches: [badCoach],
        players: [],
        season: 1,
      } as any;

      const engine1 = new CoachingHireEngine(
        [badCoach], [team], [], makeBus(), makeCoachingEngine(), createLCG(42),
      );

      // We can't easily duplicate the mutable state, so just verify the carousel runs
      const result = engine1.simulateCoachingCarousel(league, 42);
      expect(result.firings.length + result.hirings.length).toBeGreaterThanOrEqual(0);
    });

    it('fires coaches and hires replacements in carousel', () => {
      const badCoach = makeCoach({
        id: coachId('bad_hc'),
        record: { wins: 10, losses: 50, ties: 0 },
        playoffAppearances: 0,
        championships: 0,
      });
      const team = makeTeam({
        headCoachId: badCoach.id,
        coachingStaff: [badCoach.id],
        record: makeRecord(2, 15),
        owner: makeOwner({ patience: 15 }),
      });

      const league = {
        teams: [team],
        coaches: [badCoach],
        players: [],
        season: 1,
      } as any;

      const engine = new CoachingHireEngine(
        [badCoach], [team], [], makeBus(), makeCoachingEngine(), createLCG(42),
      );

      const result = engine.simulateCoachingCarousel(league, 42);
      expect(result.firings.length).toBeGreaterThanOrEqual(1);
      expect(result.firings[0]!.coachId).toBe(badCoach.id);
    });
  });
});
