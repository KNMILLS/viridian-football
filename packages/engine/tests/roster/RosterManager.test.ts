import { describe, it, expect, vi } from 'vitest';
import { RosterManager } from '../../src/roster/RosterManager.js';
import { EventBus } from '../../src/events/EventBus.js';
import type { GameEventMap } from '../../src/events/GameEvents.js';
import type { Player } from '../../src/types/player.js';
import type { Team, DepthChart } from '../../src/types/team.js';
import type { Contract, ContractYear, ICapEngine, TeamCapState, CapProjection, FranchiseTagType, RestructureAction, CompPickCandidate } from '../../src/types/contract.js';
import { teamId, playerId, contractId } from '../../src/types/ids.js';
import { Position } from '../../src/types/player.js';
import {
  MAX_ACTIVE_ROSTER,
  MAX_PRACTICE_SQUAD,
  IR_RETURN_LIMIT,
} from '../../src/roster/constants.js';

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
      coachability: 70, competitiveness: 80, composure: 75, loyalty: 60,
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
    record: { wins: 0, losses: 0, ties: 0, pointsFor: 0, pointsAgainst: 0, divisionWins: 0, divisionLosses: 0, conferenceWins: 0, conferenceLosses: 0, streak: { type: 'L', count: 0 } },
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

function makeContractYear(overrides: Partial<ContractYear> = {}, year = 1, season = 1): ContractYear {
  return {
    year, season,
    baseSalary: 5_000_000,
    capHit: 7_000_000,
    deadMoney: 0,
    signingBonusProration: 2_000_000,
    rosterBonus: 0,
    optionBonus: 0,
    incentives: [],
    isVoidYear: false,
    guaranteed: false,
    guaranteeType: 'none',
    ...overrides,
  };
}

function makeContract(overrides: Partial<Contract> = {}): Contract {
  return {
    id: contractId('c1'),
    playerId: playerId('p1'),
    teamId: teamId('t1'),
    status: 'active',
    totalValue: 35_000_000,
    totalGuaranteed: 20_000_000,
    years: 3,
    signingBonus: 6_000_000,
    yearDetails: [
      makeContractYear({}, 1, 1),
      makeContractYear({}, 2, 2),
      makeContractYear({}, 3, 3),
    ],
    hasNoTradeClause: false,
    hasNoTagClause: false,
    voidYears: 0,
    signedDate: { season: 1, week: 1 },
    ...overrides,
  };
}

function makeCapEngine(overrides: Partial<ICapEngine> = {}): ICapEngine {
  return {
    getTeamCapState: vi.fn(() => ({ teamId: teamId('t1'), season: 1, salaryCap: 225_000_000, totalCapCommitted: 100_000_000, capSpace: 125_000_000, deadMoney: 0, topFiveCapHits: [], projections: [] }) as TeamCapState),
    calculateDeadMoney: vi.fn(() => 4_000_000),
    validateCapCompliance: vi.fn(() => ({ compliant: true, overBy: 0 })),
    projectCap: vi.fn(() => [] as CapProjection[]),
    applyRestructure: vi.fn((action: RestructureAction) => makeContract()),
    calculateCompPicks: vi.fn(() => [] as CompPickCandidate[]),
    getFranchiseTagCost: vi.fn(() => 20_000_000),
    ...overrides,
  };
}

function makeBus(): EventBus<GameEventMap> {
  return new EventBus<GameEventMap>();
}

// ── Tests ──────────────────────────────────────────────────────────

describe('RosterManager', () => {
  describe('validateRoster', () => {
    it('passes validation at exactly 53 players', () => {
      const roster = Array.from({ length: 53 }, (_, i) => playerId(`p${i}`));
      const team = makeTeam({ roster });
      const rm = new RosterManager([team], [], [], makeBus(), makeCapEngine());

      const result = rm.validateRoster(team.id);
      expect(result.valid).toBe(true);
      expect(result.violations).toHaveLength(0);
    });

    it('fails validation at 54 players', () => {
      const roster = Array.from({ length: 54 }, (_, i) => playerId(`p${i}`));
      const team = makeTeam({ roster });
      const rm = new RosterManager([team], [], [], makeBus(), makeCapEngine());

      const result = rm.validateRoster(team.id);
      expect(result.valid).toBe(false);
      expect(result.violations[0]).toContain('54');
    });

    it('fails validation when PS exceeds 16', () => {
      const ps = Array.from({ length: 17 }, (_, i) => playerId(`ps${i}`));
      const team = makeTeam({ practiceSquad: ps });
      const rm = new RosterManager([team], [], [], makeBus(), makeCapEngine());

      const result = rm.validateRoster(team.id);
      expect(result.valid).toBe(false);
      expect(result.violations[0]).toContain('17');
    });
  });

  describe('addToPracticeSquad', () => {
    it('rejects player with too much experience when veteran slots full', () => {
      const veterans = Array.from({ length: 6 }, (_, i) =>
        makePlayer({ id: playerId(`vet${i}`), experience: 5 }),
      );
      const team = makeTeam({ practiceSquad: veterans.map((v) => v.id) });
      const newVet = makePlayer({ id: playerId('newvet'), experience: 5 });
      const allPlayers = [...veterans, newVet];

      const rm = new RosterManager([team], allPlayers, [], makeBus(), makeCapEngine());
      expect(() => rm.addToPracticeSquad(newVet.id, team.id)).toThrow('veteran PS slots');
    });

    it('accepts a rookie onto the practice squad', () => {
      const team = makeTeam();
      const rookie = makePlayer({ id: playerId('rk1'), experience: 1, teamId: null });
      const rm = new RosterManager([team], [rookie], [], makeBus(), makeCapEngine());

      rm.addToPracticeSquad(rookie.id, team.id);
      expect(team.practiceSquad).toContain(rookie.id);
      expect(rookie.teamId).toBe(team.id);
    });
  });

  describe('moveToIR', () => {
    it('succeeds for an injured player on the active roster', () => {
      const p = makePlayer({
        id: playerId('hurt'),
        injuryStatus: { type: 'knee', severity: 'moderate', weeksRemaining: 6, performancePenalty: 20, isRecurring: false },
      });
      const team = makeTeam({ roster: [p.id] });
      const rm = new RosterManager([team], [p], [], makeBus(), makeCapEngine());

      rm.moveToIR(p.id, team.id);
      expect(team.injuredReserve).toContain(p.id);
      expect(team.roster).not.toContain(p.id);
    });

    it('throws for a healthy player', () => {
      const p = makePlayer({ id: playerId('healthy') });
      const team = makeTeam({ roster: [p.id] });
      const rm = new RosterManager([team], [p], [], makeBus(), makeCapEngine());

      expect(() => rm.moveToIR(p.id, team.id)).toThrow('not injured');
    });
  });

  describe('activateFromIR', () => {
    it('respects the season IR return limit', () => {
      const irPlayers = Array.from({ length: IR_RETURN_LIMIT + 1 }, (_, i) =>
        makePlayer({
          id: playerId(`ir${i}`),
          injuryStatus: { type: 'ankle', severity: 'minor', weeksRemaining: 0, performancePenalty: 0, isRecurring: false },
        }),
      );
      const team = makeTeam({ injuredReserve: irPlayers.map((p) => p.id) });
      const rm = new RosterManager([team], irPlayers, [], makeBus(), makeCapEngine());

      for (let i = 0; i < IR_RETURN_LIMIT; i++) {
        rm.activateFromIR(irPlayers[i]!.id, team.id);
      }

      expect(() => rm.activateFromIR(irPlayers[IR_RETURN_LIMIT]!.id, team.id)).toThrow('IR return limit');
    });
  });

  describe('releasePlayer', () => {
    it('emits PLAYER_RELEASED with correct dead money and cap savings', () => {
      const bus = makeBus();
      const handler = vi.fn();
      bus.on('PLAYER_RELEASED', handler);

      const p = makePlayer({ id: playerId('rel1') });
      const c = makeContract({
        playerId: p.id,
        teamId: teamId('t1'),
        yearDetails: [makeContractYear({ capHit: 10_000_000 }, 1, 1)],
      });
      const team = makeTeam({ roster: [p.id] });
      const capEngine = makeCapEngine({ calculateDeadMoney: vi.fn(() => 3_000_000) });
      const rm = new RosterManager([team], [p], [c], bus, capEngine);

      rm.releasePlayer(p.id, team.id, 1);

      expect(handler).toHaveBeenCalledOnce();
      expect(handler).toHaveBeenCalledWith(expect.objectContaining({
        playerId: p.id,
        teamId: team.id,
        deadMoney: 3_000_000,
        capSavings: 7_000_000,
      }));
      expect(team.roster).not.toContain(p.id);
      expect(p.teamId).toBeNull();
    });
  });

  describe('promotePracticeSquad', () => {
    it('moves player from PS to active roster', () => {
      const p = makePlayer({ id: playerId('ps1') });
      const team = makeTeam({ practiceSquad: [p.id], roster: [] });
      const rm = new RosterManager([team], [p], [], makeBus(), makeCapEngine());

      rm.promotePracticeSquad(p.id, team.id);
      expect(team.roster).toContain(p.id);
      expect(team.practiceSquad).not.toContain(p.id);
    });

    it('throws when active roster is full', () => {
      const roster = Array.from({ length: 53 }, (_, i) => playerId(`r${i}`));
      const p = makePlayer({ id: playerId('ps1') });
      const team = makeTeam({ roster, practiceSquad: [p.id] });
      const rm = new RosterManager([team], [p], [], makeBus(), makeCapEngine());

      expect(() => rm.promotePracticeSquad(p.id, team.id)).toThrow('full');
    });
  });

  describe('handlePSPoaching', () => {
    it('allows original team to match by promoting', () => {
      const p = makePlayer({ id: playerId('ps_target'), position: 'WR' });
      const origTeam = makeTeam({ id: teamId('orig'), practiceSquad: [p.id], roster: [] });
      const poachTeam = makeTeam({ id: teamId('poach'), roster: [] });
      const rm = new RosterManager([origTeam, poachTeam], [p], [], makeBus(), makeCapEngine());

      const result = rm.handlePSPoaching(p.id, poachTeam.id, origTeam.id, true);
      expect(result.signed).toBe(false);
      expect(origTeam.roster).toContain(p.id);
      expect(origTeam.practiceSquad).not.toContain(p.id);
    });

    it('poaching team signs player and emits ROSTER_NEED_IDENTIFIED when protection lapses', () => {
      const bus = makeBus();
      const handler = vi.fn();
      bus.on('ROSTER_NEED_IDENTIFIED', handler);

      const p = makePlayer({ id: playerId('ps_target'), position: 'WR' });
      const origTeam = makeTeam({ id: teamId('orig'), practiceSquad: [p.id], roster: [] });
      const poachTeam = makeTeam({ id: teamId('poach'), roster: [] });
      const rm = new RosterManager([origTeam, poachTeam], [p], [], bus, makeCapEngine());

      const result = rm.handlePSPoaching(p.id, poachTeam.id, origTeam.id, false);
      expect(result.signed).toBe(true);
      expect(result.newTeamId).toBe(poachTeam.id);
      expect(poachTeam.roster).toContain(p.id);
      expect(handler).toHaveBeenCalledWith(expect.objectContaining({
        teamId: origTeam.id,
        position: 'WR',
      }));
    });
  });
});
