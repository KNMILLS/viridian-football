import { describe, it, expect } from 'vitest';
import { validateTradeLegality, calculateCapImpact } from '../../src/trade/TradeValidator.js';
import { MAX_ASSETS_PER_SIDE } from '../../src/trade/constants.js';
import { BASE_SALARY_CAP } from '../../src/cap/constants.js';
import type { TradeProposal } from '../../src/types/trade.js';
import type { League, LeagueSettings } from '../../src/types/league.js';
import type { Team, TeamRecord } from '../../src/types/team.js';
import type { Player } from '../../src/types/player.js';
import type { Contract, ContractYear, ICapEngine, TeamCapState, CapProjection } from '../../src/types/contract.js';
import type { DraftPick } from '../../src/types/draft.js';
import { teamId, playerId, contractId, draftPickId } from '../../src/types/ids.js';

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

function makeTeam(id: string, rosterSize = 50): Team {
  const roster = Array.from({ length: rosterSize }, (_, i) => playerId(`${id}_p${i}`));
  return {
    id: teamId(id), city: 'City', name: `Team ${id}`, abbreviation: id.toUpperCase(),
    conference: 'AFC', division: 'AFC East', stadium: 'Stadium',
    owner: { name: 'Owner', patience: 50, spendingWillingness: 70, mediaProfile: 'moderate', priorities: ['winning'] },
    roster, practiceSquad: [], injuredReserve: [], coachingStaff: [], headCoachId: null,
    depthChart: {} as any, record: { ...defaultRecord }, analyticsLevel: 3,
    scoutingBudget: 100, facilitiesLevel: 3,
    delegationSettings: {
      practiceSquad: 'auto', waiverClaims: 'auto', trainingCampCuts: 'auto',
      injuredReserve: 'auto', contractNegotiations: 'manual', scoutingAssignments: 'auto',
      tradeEvaluation: 'manual', draftBoard: 'manual', freeAgencyTargets: 'manual',
    },
  };
}

function makeProposal(overrides: Partial<TradeProposal> = {}): TradeProposal {
  return {
    id: 'trade1', proposingTeamId: teamId('t1'), targetTeamId: teamId('t2'),
    offering: [{ type: 'player', playerId: playerId('p1') }],
    requesting: [{ type: 'draft_pick', pickId: draftPickId('pk1') }],
    expiresAt: { season: 1, week: 12 }, counterOfferCount: 0, status: 'pending',
    ...overrides,
  };
}

function makeCapEngine(capSpace: number = 50_000_000): ICapEngine {
  return {
    getTeamCapState: (_teamId, _season) => ({
      teamId: _teamId, season: _season, salaryCap: BASE_SALARY_CAP,
      totalCapCommitted: BASE_SALARY_CAP - capSpace, capSpace, deadMoney: 0,
      topFiveCapHits: [], projections: [],
    }),
    calculateDeadMoney: () => 0,
    validateCapCompliance: () => ({ compliant: true, overBy: 0 }),
    projectCap: () => [],
    applyRestructure: (() => ({})) as any,
    calculateCompPicks: () => [],
    getFranchiseTagCost: () => 0,
  };
}

function makeLeague(overrides: Partial<League> = {}): League {
  return {
    id: 'lg1' as any, name: 'League', season: 1, week: 5, phase: 'regular_season',
    teams: [makeTeam('t1'), makeTeam('t2')],
    players: [],
    coaches: [], contracts: [], draftPicks: [], draftProspects: [],
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

// ── Tests ───────────────────────────────────────────────────────────

describe('TradeValidator', () => {
  describe('validateTradeLegality', () => {
    it('valid trade passes all checks', () => {
      const league = makeLeague({
        contracts: [{
          id: contractId('c1'), playerId: playerId('p1'), teamId: teamId('t1'),
          status: 'active', totalValue: 10_000_000, totalGuaranteed: 5_000_000,
          years: 2, signingBonus: 0,
          yearDetails: [makeContractYear({ capHit: 5_000_000 }, 1, 1)],
          hasNoTradeClause: false, hasNoTagClause: false, voidYears: 0,
          signedDate: { season: 1, week: 1 },
        }],
        draftPicks: [
          {
            id: draftPickId('pk1'), originalTeamId: teamId('t2'), currentTeamId: teamId('t2'),
            season: 1, round: 3, pickInRound: 10, overall: 74,
            isConditional: false, conditions: [], resolvedRound: null,
          },
          { id: draftPickId('t1_r1_s1'), originalTeamId: teamId('t1'), currentTeamId: teamId('t1'), season: 1, round: 1, pickInRound: 16, overall: 16, isConditional: false, conditions: [], resolvedRound: null },
          { id: draftPickId('t1_r1_s2'), originalTeamId: teamId('t1'), currentTeamId: teamId('t1'), season: 2, round: 1, pickInRound: 16, overall: 16, isConditional: false, conditions: [], resolvedRound: null },
          { id: draftPickId('t2_r1_s1'), originalTeamId: teamId('t2'), currentTeamId: teamId('t2'), season: 1, round: 1, pickInRound: 20, overall: 20, isConditional: false, conditions: [], resolvedRound: null },
          { id: draftPickId('t2_r1_s2'), originalTeamId: teamId('t2'), currentTeamId: teamId('t2'), season: 2, round: 1, pickInRound: 20, overall: 20, isConditional: false, conditions: [], resolvedRound: null },
        ],
      });

      const result = validateTradeLegality(makeProposal(), league, makeCapEngine());
      expect(result.legal).toBe(true);
      expect(result.violations).toHaveLength(0);
    });

    it('rejects trade when team exceeds cap', () => {
      const league = makeLeague({
        contracts: [{
          id: contractId('c1'), playerId: playerId('p1'), teamId: teamId('t1'),
          status: 'active', totalValue: 10_000_000, totalGuaranteed: 5_000_000,
          years: 1, signingBonus: 0,
          yearDetails: [makeContractYear({ capHit: 60_000_000 }, 1, 1)],
          hasNoTradeClause: false, hasNoTagClause: false, voidYears: 0,
          signedDate: { season: 1, week: 1 },
        }],
      });

      const proposal = makeProposal({
        offering: [{ type: 'draft_pick', pickId: draftPickId('pk_out') }],
        requesting: [{ type: 'player', playerId: playerId('p1') }],
      });

      const capEngine = makeCapEngine(10_000_000);
      const result = validateTradeLegality(proposal, league, capEngine);
      expect(result.legal).toBe(false);
      expect(result.violations.some(v => v.includes('salary cap'))).toBe(true);
    });

    it('detects no-trade clause violation', () => {
      const league = makeLeague({
        contracts: [{
          id: contractId('c1'), playerId: playerId('p1'), teamId: teamId('t1'),
          status: 'active', totalValue: 10_000_000, totalGuaranteed: 5_000_000,
          years: 2, signingBonus: 0,
          yearDetails: [makeContractYear({ capHit: 5_000_000 }, 1, 1)],
          hasNoTradeClause: true, hasNoTagClause: false, voidYears: 0,
          signedDate: { season: 1, week: 1 },
        }],
        players: [{
          id: playerId('p1'), firstName: 'Star', lastName: 'QB',
          age: 30, position: 'QB', secondaryPositions: [], teamId: teamId('t1'),
          jerseyNumber: 12, experience: 8, college: 'U', draftYear: 1,
          draftRound: 1, draftPick: 1,
          physical: { speed: 80, acceleration: 80, strength: 70, agility: 75, jumping: 70, stamina: 85, toughness: 80 },
          personality: {} as any, hidden: {} as any,
          contract: null, injuryStatus: null, careerStats: {}, seasonStats: {},
        }] as any,
      });

      const result = validateTradeLegality(makeProposal(), league, makeCapEngine());
      expect(result.legal).toBe(false);
      expect(result.violations.some(v => v.includes('no-trade clause'))).toBe(true);
    });

    it('blocks player trades after deadline but allows pick swaps', () => {
      const league = makeLeague({ week: 10, phase: 'regular_season' });

      const playerTrade = makeProposal({
        offering: [{ type: 'player', playerId: playerId('p1') }],
        requesting: [{ type: 'draft_pick', pickId: draftPickId('pk1') }],
      });

      const pickTrade = makeProposal({
        offering: [{ type: 'draft_pick', pickId: draftPickId('pk_a') }],
        requesting: [{ type: 'draft_pick', pickId: draftPickId('pk_b') }],
      });

      const playerResult = validateTradeLegality(playerTrade, league, makeCapEngine());
      expect(playerResult.legal).toBe(false);
      expect(playerResult.violations.some(v => v.includes('deadline'))).toBe(true);

      const pickResult = validateTradeLegality(pickTrade, league, makeCapEngine());
      const deadlineViolations = pickResult.violations.filter(v => v.includes('deadline'));
      expect(deadlineViolations).toHaveLength(0);
    });

    it('detects Stepien rule violation', () => {
      const league = makeLeague({
        draftPicks: [
          {
            id: draftPickId('pk_t1_s1'), originalTeamId: teamId('t1'), currentTeamId: teamId('t1'),
            season: 1, round: 1, pickInRound: 5, overall: 5,
            isConditional: false, conditions: [], resolvedRound: null,
          },
          {
            id: draftPickId('pk_t2_r1_s1'), originalTeamId: teamId('t2'), currentTeamId: teamId('t2'),
            season: 1, round: 1, pickInRound: 20, overall: 20,
            isConditional: false, conditions: [], resolvedRound: null,
          },
          {
            id: draftPickId('pk_t2_r1_s2'), originalTeamId: teamId('t2'), currentTeamId: teamId('t2'),
            season: 2, round: 1, pickInRound: 20, overall: 20,
            isConditional: false, conditions: [], resolvedRound: null,
          },
        ],
      });

      const proposal = makeProposal({
        offering: [{ type: 'draft_pick', pickId: draftPickId('pk_t1_s1') }],
        requesting: [{ type: 'player', playerId: playerId('some_player') }],
      });

      const result = validateTradeLegality(proposal, league, makeCapEngine());
      expect(result.violations.some(v => v.includes('Stepien'))).toBe(true);
    });

    it('rejects when roster limit exceeded', () => {
      const league = makeLeague({
        teams: [makeTeam('t1', 53), makeTeam('t2', 50)],
      });

      const proposal = makeProposal({
        offering: [{ type: 'draft_pick', pickId: draftPickId('pk_out') }],
        requesting: [
          { type: 'player', playerId: playerId('px1') },
          { type: 'player', playerId: playerId('px2') },
        ],
      });

      const result = validateTradeLegality(proposal, league, makeCapEngine());
      expect(result.legal).toBe(false);
      expect(result.violations.some(v => v.includes('roster limit'))).toBe(true);
    });

    it('rejects when too many assets on one side', () => {
      const manyAssets = Array.from({ length: MAX_ASSETS_PER_SIDE + 1 }, (_, i) => ({
        type: 'draft_pick' as const,
        pickId: draftPickId(`pk${i}`),
      }));

      const proposal = makeProposal({ offering: manyAssets });
      const result = validateTradeLegality(proposal, makeLeague(), makeCapEngine());
      expect(result.legal).toBe(false);
      expect(result.violations.some(v => v.includes('maximum'))).toBe(true);
    });

    it('reports multiple violations simultaneously', () => {
      const league = makeLeague({
        week: 10, phase: 'regular_season',
        contracts: [{
          id: contractId('c1'), playerId: playerId('p1'), teamId: teamId('t1'),
          status: 'active', totalValue: 10_000_000, totalGuaranteed: 5_000_000,
          years: 2, signingBonus: 0,
          yearDetails: [makeContractYear({ capHit: 5_000_000 }, 1, 1)],
          hasNoTradeClause: true, hasNoTagClause: false, voidYears: 0,
          signedDate: { season: 1, week: 1 },
        }],
        players: [{
          id: playerId('p1'), firstName: 'A', lastName: 'B',
          age: 30, position: 'QB', secondaryPositions: [], teamId: teamId('t1'),
          jerseyNumber: 1, experience: 5, college: 'U', draftYear: 1,
          draftRound: 1, draftPick: 1,
          physical: {} as any, personality: {} as any, hidden: {} as any,
          contract: null, injuryStatus: null, careerStats: {}, seasonStats: {},
        }] as any,
      });

      const result = validateTradeLegality(makeProposal(), league, makeCapEngine());
      expect(result.violations.length).toBeGreaterThanOrEqual(2);
    });
  });

  describe('calculateCapImpact', () => {
    it('computes correct cap delta when trading a player for a pick', () => {
      const league = makeLeague({
        contracts: [{
          id: contractId('c1'), playerId: playerId('p1'), teamId: teamId('t1'),
          status: 'active', totalValue: 10_000_000, totalGuaranteed: 5_000_000,
          years: 1, signingBonus: 0,
          yearDetails: [makeContractYear({ capHit: 8_000_000 }, 1, 1)],
          hasNoTradeClause: false, hasNoTagClause: false, voidYears: 0,
          signedDate: { season: 1, week: 1 },
        }],
      });

      const { proposingCapDelta, targetCapDelta } = calculateCapImpact(makeProposal(), league);
      expect(proposingCapDelta).toBe(-8_000_000);
      expect(targetCapDelta).toBe(8_000_000);
    });
  });
});
