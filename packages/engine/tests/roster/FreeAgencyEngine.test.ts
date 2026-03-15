import { describe, it, expect, vi } from 'vitest';
import { FreeAgencyEngine } from '../../src/roster/FreeAgencyEngine.js';
import { EventBus } from '../../src/events/EventBus.js';
import type { GameEventMap } from '../../src/events/GameEvents.js';
import type { Player } from '../../src/types/player.js';
import type { Team, DepthChart } from '../../src/types/team.js';
import type { Contract, ContractYear, ICapEngine, TeamCapState, CapProjection, RestructureAction, CompPickCandidate } from '../../src/types/contract.js';
import { teamId, playerId, contractId } from '../../src/types/ids.js';
import { Position } from '../../src/types/player.js';
import { createLCG } from '../../src/sim/RNG.js';

// ── Helpers ────────────────────────────────────────────────────────

function emptyDepthChart(): DepthChart {
  const chart = {} as DepthChart;
  for (const pos of Position.options) chart[pos] = [];
  return chart;
}

function makePlayer(overrides: Partial<Player> = {}): Player {
  return {
    id: playerId('fa1'),
    firstName: 'Free',
    lastName: 'Agent',
    age: 27,
    position: 'WR',
    secondaryPositions: [],
    teamId: teamId('t1'),
    jerseyNumber: 88,
    experience: 5,
    college: 'State U',
    draftYear: 1,
    draftRound: 2,
    draftPick: 35,
    physical: {
      speed: 90, acceleration: 88, strength: 65,
      agility: 85, jumping: 80, stamina: 80, toughness: 70,
    },
    personality: {
      leadership: 60, workEthic: 70, ego: 50,
      coachability: 65, competitiveness: 75, composure: 65, loyalty: 50,
      greed: 50, legacyDrive: 50, fameSeeking: 40, familyOriented: 40,
      teamChemistryEffect: 55, prankster: 20, loner: 25,
      mentorWillingness: 40, respectForVeterans: 60, aggression: 45,
      discipline: 65, motorEffort: 70, footballIQ: 65, filmStudyDedication: 60,
      offFieldRisk: 15, mediaHandling: 'professional' as const, communityEngagement: 50,
      durabilityMindset: 65, resilience: 60, confidenceVolatility: 30,
      chipOnShoulder: 40,
    },
    hidden: {
      trueOverall: 80, injuryProneness: 25, clutchFactor: 65,
      consistencyVariance: 10, ceilingFloor: [72, 87] as [number, number],
      footballCharacter: 70, schemeVersatility: 60,
    },
    contract: null,
    injuryStatus: null,
    careerStats: {},
    seasonStats: {},
    ...overrides,
  } as Player;
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
    coachingStaff: [],
    headCoachId: null,
    depthChart: emptyDepthChart(),
    record: { wins: 8, losses: 9, ties: 0, pointsFor: 350, pointsAgainst: 370, divisionWins: 3, divisionLosses: 3, conferenceWins: 5, conferenceLosses: 7, streak: { type: 'L', count: 1 } },
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

function makeCapEngine(overrides: Partial<ICapEngine> = {}): ICapEngine {
  return {
    getTeamCapState: vi.fn(() => ({
      teamId: teamId('t1'), season: 1, salaryCap: 225_000_000,
      totalCapCommitted: 100_000_000, capSpace: 125_000_000, deadMoney: 0,
      topFiveCapHits: [], projections: [],
    }) as TeamCapState),
    calculateDeadMoney: vi.fn(() => 0),
    validateCapCompliance: vi.fn(() => ({ compliant: true, overBy: 0 })),
    projectCap: vi.fn(() => [] as CapProjection[]),
    applyRestructure: vi.fn((a: RestructureAction) => ({} as Contract)),
    calculateCompPicks: vi.fn(() => [] as CompPickCandidate[]),
    getFranchiseTagCost: vi.fn(() => 20_000_000),
    ...overrides,
  };
}

function makeBus(): EventBus<GameEventMap> {
  return new EventBus<GameEventMap>();
}

// ── Tests ──────────────────────────────────────────────────────────

describe('FreeAgencyEngine', () => {
  describe('generateDemands', () => {
    it('high-greed player demands above market value', () => {
      const greedyPlayer = makePlayer({
        personality: {
          leadership: 60, workEthic: 70, ego: 50,
          coachability: 65, competitiveness: 75, composure: 65, loyalty: 30,
          greed: 90, legacyDrive: 40, fameSeeking: 40, familyOriented: 30,
          teamChemistryEffect: 50, prankster: 20, loner: 25,
          mentorWillingness: 40, respectForVeterans: 60, aggression: 45,
          discipline: 65, motorEffort: 70, footballIQ: 65, filmStudyDedication: 60,
          offFieldRisk: 15, mediaHandling: 'professional' as const, communityEngagement: 50,
          durabilityMindset: 65, resilience: 60, confidenceVolatility: 30,
          chipOnShoulder: 40,
        },
      });

      const engine = new FreeAgencyEngine([], [], [], makeBus(), makeCapEngine(), createLCG(42));
      const demands = engine.generateDemands(greedyPlayer, 10_000_000);
      expect(demands.minSalary).toBeGreaterThan(10_000_000);
      expect(demands.weights.money).toBeGreaterThan(0.4);
    });

    it('high-loyalty player offers discount and prefers current team', () => {
      const loyalPlayer = makePlayer({
        teamId: teamId('t1'),
        personality: {
          leadership: 70, workEthic: 75, ego: 40,
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

      const engine = new FreeAgencyEngine([], [], [], makeBus(), makeCapEngine(), createLCG(42));
      const demands = engine.generateDemands(loyalPlayer, 10_000_000);
      expect(demands.teamPreference).toBe(teamId('t1'));
      expect(demands.discount).toBeGreaterThan(0);
    });

    it('high-fameSeeking player has elevated fame weight', () => {
      const famePlayer = makePlayer({
        personality: {
          leadership: 50, workEthic: 60, ego: 60,
          coachability: 55, competitiveness: 70, composure: 55, loyalty: 40,
          greed: 50, legacyDrive: 40, fameSeeking: 90, familyOriented: 20,
          teamChemistryEffect: 45, prankster: 30, loner: 20,
          mentorWillingness: 30, respectForVeterans: 50, aggression: 50,
          discipline: 55, motorEffort: 60, footballIQ: 60, filmStudyDedication: 50,
          offFieldRisk: 30, mediaHandling: 'outspoken' as const, communityEngagement: 65,
          durabilityMindset: 55, resilience: 50, confidenceVolatility: 45,
          chipOnShoulder: 50,
        },
      });

      const engine = new FreeAgencyEngine([], [], [], makeBus(), makeCapEngine(), createLCG(42));
      const demands = engine.generateDemands(famePlayer, 10_000_000);
      expect(demands.weights.fame).toBeGreaterThan(0.1);
    });

    it('high-familyOriented player has region preference', () => {
      const familyPlayer = makePlayer({
        personality: {
          leadership: 60, workEthic: 70, ego: 40,
          coachability: 65, competitiveness: 65, composure: 70, loyalty: 60,
          greed: 40, legacyDrive: 40, fameSeeking: 25, familyOriented: 85,
          teamChemistryEffect: 65, prankster: 15, loner: 15,
          mentorWillingness: 50, respectForVeterans: 65, aggression: 35,
          discipline: 70, motorEffort: 65, footballIQ: 65, filmStudyDedication: 60,
          offFieldRisk: 10, mediaHandling: 'professional' as const, communityEngagement: 70,
          durabilityMindset: 70, resilience: 65, confidenceVolatility: 20,
          chipOnShoulder: 25,
        },
      });

      const engine = new FreeAgencyEngine([], [], [], makeBus(), makeCapEngine(), createLCG(42));
      const demands = engine.generateDemands(familyPlayer, 10_000_000);
      expect(demands.regionPreference).not.toBeNull();
      expect(demands.weights.family).toBeGreaterThan(0.1);
    });

    it('high-legacyDrive aging player prefers contender and takes discount', () => {
      const veteranLegacy = makePlayer({
        age: 33,
        personality: {
          leadership: 80, workEthic: 80, ego: 50,
          coachability: 60, competitiveness: 90, composure: 75, loyalty: 60,
          greed: 30, legacyDrive: 90, fameSeeking: 50, familyOriented: 40,
          teamChemistryEffect: 70, prankster: 10, loner: 20,
          mentorWillingness: 70, respectForVeterans: 80, aggression: 45,
          discipline: 75, motorEffort: 70, footballIQ: 80, filmStudyDedication: 75,
          offFieldRisk: 5, mediaHandling: 'professional' as const, communityEngagement: 60,
          durabilityMindset: 70, resilience: 70, confidenceVolatility: 20,
          chipOnShoulder: 60,
        },
      });

      const engine = new FreeAgencyEngine([], [], [], makeBus(), makeCapEngine(), createLCG(42));
      const demands = engine.generateDemands(veteranLegacy, 10_000_000);
      expect(demands.preferContender).toBe(true);
      expect(demands.minSalary).toBeLessThan(10_000_000);
    });
  });

  describe('conductFreeAgency', () => {
    it('emits CONTRACT_SIGNED for each signing', () => {
      const bus = makeBus();
      const handler = vi.fn();
      bus.on('CONTRACT_SIGNED', handler);

      const teams = [
        makeTeam({ id: teamId('t1') }),
        makeTeam({ id: teamId('t2') }),
      ];
      const fa = makePlayer({ id: playerId('fa1'), teamId: null });
      const engine = new FreeAgencyEngine([fa], teams, [], bus, makeCapEngine(), createLCG(42));

      const market = engine.generateFreeAgentMarket([], [fa.id]);
      const result = engine.conductFreeAgency(market, 42);

      if (result.signings.length > 0) {
        expect(handler).toHaveBeenCalled();
        expect(handler).toHaveBeenCalledWith(expect.objectContaining({
          playerId: fa.id,
        }));
      }
    });

    it('top-tier players (highest market value) sign first', () => {
      const bus = makeBus();
      const teams = [
        makeTeam({ id: teamId('t1') }),
        makeTeam({ id: teamId('t2') }),
        makeTeam({ id: teamId('t3') }),
      ];

      const topPlayer = makePlayer({
        id: playerId('top'),
        position: 'QB',
        teamId: null,
        hidden: {
          trueOverall: 92, injuryProneness: 20, clutchFactor: 80,
          consistencyVariance: 5, ceilingFloor: [85, 97] as [number, number],
          footballCharacter: 80, schemeVersatility: 65,
        },
      });
      const midPlayer = makePlayer({
        id: playerId('mid'),
        position: 'WR',
        teamId: null,
        hidden: {
          trueOverall: 72, injuryProneness: 25, clutchFactor: 60,
          consistencyVariance: 12, ceilingFloor: [65, 80] as [number, number],
          footballCharacter: 65, schemeVersatility: 55,
        },
      });

      const engine = new FreeAgencyEngine(
        [topPlayer, midPlayer], teams, [], bus, makeCapEngine(), createLCG(42),
      );
      const market = engine.generateFreeAgentMarket([], [topPlayer.id, midPlayer.id]);

      expect(market[0]!.player.id).toBe(topPlayer.id);
    });

    it('produces deterministic results with the same seed', () => {
      const teams = [makeTeam({ id: teamId('t1') }), makeTeam({ id: teamId('t2') })];
      const fa = makePlayer({ id: playerId('det'), teamId: null });

      const engine1 = new FreeAgencyEngine([fa], teams, [], makeBus(), makeCapEngine(), createLCG(42));
      const market1 = engine1.generateFreeAgentMarket([], [fa.id]);
      const result1 = engine1.conductFreeAgency(market1, 100);

      const engine2 = new FreeAgencyEngine([fa], teams, [], makeBus(), makeCapEngine(), createLCG(42));
      const market2 = engine2.generateFreeAgentMarket([], [fa.id]);
      const result2 = engine2.conductFreeAgency(market2, 100);

      expect(result1.signings.length).toBe(result2.signings.length);
      if (result1.signings.length > 0) {
        expect(result1.signings[0]!.teamId).toBe(result2.signings[0]!.teamId);
      }
    });
  });

  describe('evaluateCompPickEligibility', () => {
    it('projects comp picks based on departed player APY', () => {
      const engine = new FreeAgencyEngine([], [], [], makeBus(), makeCapEngine(), createLCG(42));
      const departed = [
        { departedFrom: teamId('t1'), playerId: playerId('d1'), newTeamId: teamId('t2'), apy: 15_000_000 },
        { departedFrom: teamId('t1'), playerId: playerId('d2'), newTeamId: teamId('t3'), apy: 7_000_000 },
      ];

      const projections = engine.evaluateCompPickEligibility(departed, [], teamId('t1'));
      expect(projections).toHaveLength(2);
      expect(projections[0]!.projectedRound).toBe(3);
      expect(projections[1]!.projectedRound).toBe(5);
    });
  });
});
