import { describe, it, expect, vi } from 'vitest';
import { TradeEngine } from '../../src/trade/TradeEngine.js';
import { EventBus } from '../../src/events/EventBus.js';
import type { GameEventMap } from '../../src/events/GameEvents.js';
import type { TradeProposal } from '../../src/types/trade.js';
import type { League } from '../../src/types/league.js';
import type { Team, TeamRecord } from '../../src/types/team.js';
import type { Player } from '../../src/types/player.js';
import type { Contract, ContractYear, ICapEngine } from '../../src/types/contract.js';
import type { DraftPick } from '../../src/types/draft.js';
import { teamId, playerId, contractId, draftPickId } from '../../src/types/ids.js';
import { createLCG } from '../../src/sim/RNG.js';
import { BASE_SALARY_CAP } from '../../src/cap/constants.js';

// ── Helpers ─────────────────────────────────────────────────────────

const defaultRecord: TeamRecord = {
  wins: 8, losses: 8, ties: 0, pointsFor: 350, pointsAgainst: 350,
  divisionWins: 3, divisionLosses: 3, conferenceWins: 5, conferenceLosses: 5,
  streak: { type: 'W', count: 1 },
};

function makeContractYear(overrides: Partial<ContractYear> = {}, year = 1, season = 1): ContractYear {
  return {
    year, season, baseSalary: 5_000_000, capHit: 7_000_000, deadMoney: 0,
    signingBonusProration: 2_000_000, rosterBonus: 0, optionBonus: 0,
    incentives: [], isVoidYear: false, guaranteed: false, guaranteeType: 'none',
    ...overrides,
  };
}

function makePlayer(id: string, tid: string): Player {
  return {
    id: playerId(id), firstName: 'Test', lastName: id,
    age: 26, position: 'WR', secondaryPositions: [],
    teamId: teamId(tid), jerseyNumber: 80, experience: 4,
    college: 'U', draftYear: 1, draftRound: 2, draftPick: 5,
    physical: { speed: 85, acceleration: 85, strength: 65, agility: 80, jumping: 80, stamina: 80, toughness: 70 },
    personality: {
      leadership: 60, workEthic: 70, ego: 50, coachability: 70,
      competitiveness: 75, composure: 70, loyalty: 50,
      greed: 40, legacyDrive: 40, fameSeeking: 30, familyOriented: 30,
      teamChemistryEffect: 60, prankster: 20, loner: 20, mentorWillingness: 50,
      respectForVeterans: 70, aggression: 40, discipline: 70, motorEffort: 70,
      footballIQ: 70, filmStudyDedication: 60, offFieldRisk: 10,
      mediaHandling: 'professional', communityEngagement: 50, durabilityMindset: 65,
      resilience: 60, confidenceVolatility: 30, chipOnShoulder: 40,
    },
    hidden: {
      trueOverall: 78, injuryProneness: 25, clutchFactor: 65,
      consistencyVariance: 15, ceilingFloor: [65, 85],
      footballCharacter: 75, schemeVersatility: 55,
    },
    contract: null, injuryStatus: null, careerStats: {},
    seasonStats: { '1': { receivingYards: 800, receivingTDs: 6, gamesPlayed: 16 } },
  } as Player;
}

function makeTeam(id: string, playerIds: string[]): Team {
  return {
    id: teamId(id), city: 'City', name: `Team ${id}`, abbreviation: id.toUpperCase(),
    conference: 'AFC', division: 'AFC East', stadium: 'Stadium',
    owner: { name: 'Owner', patience: 50, spendingWillingness: 70, mediaProfile: 'moderate', priorities: ['winning'] },
    roster: playerIds.map(p => playerId(p)),
    practiceSquad: [], injuredReserve: [], coachingStaff: [], headCoachId: null,
    depthChart: {} as any, record: { ...defaultRecord }, analyticsLevel: 3,
    scoutingBudget: 100, facilitiesLevel: 3,
    delegationSettings: {
      practiceSquad: 'auto', waiverClaims: 'auto', trainingCampCuts: 'auto',
      injuredReserve: 'auto', contractNegotiations: 'manual', scoutingAssignments: 'auto',
      tradeEvaluation: 'manual', draftBoard: 'manual', freeAgencyTargets: 'manual',
    },
  };
}

function makeCapEngine(): ICapEngine {
  return {
    getTeamCapState: (_teamId, _season) => ({
      teamId: _teamId, season: _season, salaryCap: BASE_SALARY_CAP,
      totalCapCommitted: 100_000_000, capSpace: BASE_SALARY_CAP - 100_000_000,
      deadMoney: 0, topFiveCapHits: [], projections: [],
    }),
    calculateDeadMoney: () => 0,
    validateCapCompliance: () => ({ compliant: true, overBy: 0 }),
    projectCap: () => [],
    applyRestructure: ((action: any) => {
      return {} as Contract;
    }) as any,
    calculateCompPicks: () => [],
    getFranchiseTagCost: () => 0,
  };
}

function makeLeague(overrides: Partial<League> = {}): League {
  return {
    id: 'lg1' as any, name: 'League', season: 1, week: 5, phase: 'regular_season',
    teams: [
      makeTeam('t1', ['p1', 'p1b']),
      makeTeam('t2', ['p2', 'p2b']),
    ],
    players: [
      makePlayer('p1', 't1'),
      makePlayer('p1b', 't1'),
      makePlayer('p2', 't2'),
      makePlayer('p2b', 't2'),
    ],
    coaches: [],
    contracts: [
      {
        id: contractId('c1'), playerId: playerId('p1'), teamId: teamId('t1'),
        status: 'active', totalValue: 15_000_000, totalGuaranteed: 8_000_000,
        years: 2, signingBonus: 2_000_000,
        yearDetails: [makeContractYear({ capHit: 7_000_000 }, 1, 1), makeContractYear({ capHit: 8_000_000 }, 2, 2)],
        hasNoTradeClause: false, hasNoTagClause: false, voidYears: 0,
        signedDate: { season: 1, week: 1 },
      },
      {
        id: contractId('c2'), playerId: playerId('p2'), teamId: teamId('t2'),
        status: 'active', totalValue: 10_000_000, totalGuaranteed: 5_000_000,
        years: 2, signingBonus: 1_000_000,
        yearDetails: [makeContractYear({ capHit: 5_000_000 }, 1, 1), makeContractYear({ capHit: 5_000_000 }, 2, 2)],
        hasNoTradeClause: false, hasNoTagClause: false, voidYears: 0,
        signedDate: { season: 1, week: 1 },
      },
    ],
    draftPicks: [
      {
        id: draftPickId('pk1'), originalTeamId: teamId('t1'), currentTeamId: teamId('t1'),
        season: 2, round: 3, pickInRound: 10, overall: 74,
        isConditional: false, conditions: [], resolvedRound: null,
      },
      {
        id: draftPickId('pk2'), originalTeamId: teamId('t2'), currentTeamId: teamId('t2'),
        season: 2, round: 4, pickInRound: 15, overall: 111,
        isConditional: false, conditions: [], resolvedRound: null,
      },
      {
        id: draftPickId('pk_t1_r1'), originalTeamId: teamId('t1'), currentTeamId: teamId('t1'),
        season: 1, round: 1, pickInRound: 16, overall: 16,
        isConditional: false, conditions: [], resolvedRound: null,
      },
      {
        id: draftPickId('pk_t1_r1_s2'), originalTeamId: teamId('t1'), currentTeamId: teamId('t1'),
        season: 2, round: 1, pickInRound: 16, overall: 16,
        isConditional: false, conditions: [], resolvedRound: null,
      },
      {
        id: draftPickId('pk_t2_r1'), originalTeamId: teamId('t2'), currentTeamId: teamId('t2'),
        season: 1, round: 1, pickInRound: 20, overall: 20,
        isConditional: false, conditions: [], resolvedRound: null,
      },
      {
        id: draftPickId('pk_t2_r1_s2'), originalTeamId: teamId('t2'), currentTeamId: teamId('t2'),
        season: 2, round: 1, pickInRound: 20, overall: 20,
        isConditional: false, conditions: [], resolvedRound: null,
      },
    ],
    draftProspects: [],
    settings: {
      salaryCap: BASE_SALARY_CAP, rosterSize: 53, practiceSquadSize: 16,
      preseasonGames: 3, regularSeasonGames: 17, playoffTeams: 14,
      tradeDeadlineWeek: 9, draftRounds: 7, maxCompPicks: 4,
      advanceMode: 'manual', advanceDeadlineHours: 24,
    },
    schedule: [], standings: [], history: [], awards: [],
    salaryCap: BASE_SALARY_CAP, salaryFloor: BASE_SALARY_CAP * 0.89, seed: 42,
    ...overrides,
  } as League;
}

function makeProposal(): TradeProposal {
  return {
    id: 'trade_1', proposingTeamId: teamId('t1'), targetTeamId: teamId('t2'),
    offering: [{ type: 'player', playerId: playerId('p1') }],
    requesting: [{ type: 'player', playerId: playerId('p2') }],
    expiresAt: { season: 1, week: 12 }, counterOfferCount: 0, status: 'pending',
  };
}

// ── Tests ───────────────────────────────────────────────────────────

describe('TradeEngine', () => {
  it('evaluateTrade returns fairnessScore and recommendation', () => {
    const league = makeLeague();
    const bus = new EventBus<GameEventMap>();
    const engine = new TradeEngine(league, bus, createLCG(42), makeCapEngine());

    const evaluation = engine.evaluateTrade(makeProposal());
    expect(typeof evaluation.fairnessScore).toBe('number');
    expect(evaluation.fairnessScore).toBeGreaterThanOrEqual(-100);
    expect(evaluation.fairnessScore).toBeLessThanOrEqual(100);
    expect(['strong_accept', 'accept', 'neutral', 'reject', 'strong_reject']).toContain(evaluation.recommendation);
  });

  it('executeTrade swaps rosters correctly', () => {
    const league = makeLeague();
    const bus = new EventBus<GameEventMap>();
    const engine = new TradeEngine(league, bus, createLCG(42), makeCapEngine());

    const t1Before = league.teams.find(t => t.id === teamId('t1'))!;
    const t2Before = league.teams.find(t => t.id === teamId('t2'))!;
    expect(t1Before.roster).toContain(playerId('p1'));
    expect(t2Before.roster).toContain(playerId('p2'));

    const result = engine.executeTrade(makeProposal());
    expect(result.success).toBe(true);

    expect(t1Before.roster).not.toContain(playerId('p1'));
    expect(t1Before.roster).toContain(playerId('p2'));
    expect(t2Before.roster).not.toContain(playerId('p2'));
    expect(t2Before.roster).toContain(playerId('p1'));
  });

  it('executeTrade swaps draft picks correctly', () => {
    const league = makeLeague();
    const bus = new EventBus<GameEventMap>();
    const engine = new TradeEngine(league, bus, createLCG(42), makeCapEngine());

    const proposal: TradeProposal = {
      id: 'pick_trade', proposingTeamId: teamId('t1'), targetTeamId: teamId('t2'),
      offering: [{ type: 'draft_pick', pickId: draftPickId('pk1') }],
      requesting: [{ type: 'draft_pick', pickId: draftPickId('pk2') }],
      expiresAt: { season: 1, week: 12 }, counterOfferCount: 0, status: 'pending',
    };

    const result = engine.executeTrade(proposal);
    expect(result.success).toBe(true);

    const pk1 = league.draftPicks.find(p => p.id === draftPickId('pk1'))!;
    const pk2 = league.draftPicks.find(p => p.id === draftPickId('pk2'))!;
    expect(pk1.currentTeamId).toBe(teamId('t2'));
    expect(pk2.currentTeamId).toBe(teamId('t1'));
  });

  it('executeTrade emits TRADE_ACCEPTED event', () => {
    const league = makeLeague();
    const bus = new EventBus<GameEventMap>();
    const handler = vi.fn();
    bus.on('TRADE_ACCEPTED', handler);

    const engine = new TradeEngine(league, bus, createLCG(42), makeCapEngine());
    engine.executeTrade(makeProposal());

    expect(handler).toHaveBeenCalledOnce();
    expect(handler.mock.calls[0]![0].teams).toEqual([teamId('t1'), teamId('t2')]);
  });

  it('proposeTrade emits TRADE_PROPOSED event', () => {
    const league = makeLeague();
    const bus = new EventBus<GameEventMap>();
    const handler = vi.fn();
    bus.on('TRADE_PROPOSED', handler);

    const engine = new TradeEngine(league, bus, createLCG(42), makeCapEngine());
    engine.proposeTrade(makeProposal());

    expect(handler).toHaveBeenCalledOnce();
    expect(handler.mock.calls[0]![0].proposingTeamId).toBe(teamId('t1'));
  });

  it('getTradeHistory returns only trades for the given team', () => {
    const league = makeLeague();
    const bus = new EventBus<GameEventMap>();
    const engine = new TradeEngine(league, bus, createLCG(42), makeCapEngine());

    engine.executeTrade(makeProposal());

    const t1History = engine.getTradeHistory(teamId('t1'));
    const t2History = engine.getTradeHistory(teamId('t2'));
    const t3History = engine.getTradeHistory(teamId('t3'));

    expect(t1History).toHaveLength(1);
    expect(t2History).toHaveLength(1);
    expect(t3History).toHaveLength(0);
  });

  it('executeTrade blocks illegal trades', () => {
    const league = makeLeague({ week: 10 });
    const bus = new EventBus<GameEventMap>();
    const rejHandler = vi.fn();
    bus.on('TRADE_REJECTED', rejHandler);

    const engine = new TradeEngine(league, bus, createLCG(42), makeCapEngine());
    const result = engine.executeTrade(makeProposal());

    expect(result.success).toBe(false);
    expect(result.violations.length).toBeGreaterThan(0);
    expect(rejHandler).toHaveBeenCalledOnce();
  });

  it('validateTradeLegality delegates correctly', () => {
    const league = makeLeague();
    const bus = new EventBus<GameEventMap>();
    const engine = new TradeEngine(league, bus, createLCG(42), makeCapEngine());

    const result = engine.validateTradeLegality(makeProposal());
    expect(typeof result.legal).toBe('boolean');
    expect(Array.isArray(result.violations)).toBe(true);
  });
});
