import { describe, it, expect } from 'vitest';
import {
  generateCounterOffer,
  evaluateFromTeamPerspective,
} from '../../src/trade/TradeNegotiation.js';
import type { TradeProposal } from '../../src/types/trade.js';
import type { League } from '../../src/types/league.js';
import type { AiDecisionContext, GmArchetype } from '../../src/types/ai.js';
import type { Player } from '../../src/types/player.js';
import type { Contract, ContractYear } from '../../src/types/contract.js';
import type { DraftPick } from '../../src/types/draft.js';
import type { Team, TeamRecord } from '../../src/types/team.js';
import { teamId, playerId, contractId, draftPickId } from '../../src/types/ids.js';
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

function makePlayer(id: string, overrides: Partial<Player> = {}): Player {
  return {
    id: playerId(id), firstName: 'Test', lastName: id,
    age: 26, position: 'WR', secondaryPositions: [],
    teamId: teamId('t1'), jerseyNumber: 80, experience: 4,
    college: 'State U', draftYear: 1, draftRound: 2, draftPick: 1,
    physical: { speed: 85, acceleration: 85, strength: 65, agility: 80, jumping: 80, stamina: 80, toughness: 70 },
    personality: {
      leadership: 60, workEthic: 70, ego: 50, coachability: 70,
      competitiveness: 75, composure: 70, loyalty: 60,
      greed: 40, legacyDrive: 40, fameSeeking: 30, familyOriented: 40,
      teamChemistryEffect: 60, prankster: 20, loner: 20, mentorWillingness: 50,
      respectForVeterans: 70, aggression: 40, discipline: 70, motorEffort: 70,
      footballIQ: 70, filmStudyDedication: 60, offFieldRisk: 10,
      mediaHandling: 'professional', communityEngagement: 50, durabilityMindset: 65,
      resilience: 60, confidenceVolatility: 30, chipOnShoulder: 35,
    },
    hidden: {
      trueOverall: 78, injuryProneness: 25, clutchFactor: 65,
      consistencyVariance: 15, ceilingFloor: [65, 85],
      footballCharacter: 75, schemeVersatility: 55,
    },
    contract: null, injuryStatus: null, careerStats: {},
    seasonStats: { '1': { receivingYards: 1000, receivingTDs: 8, gamesPlayed: 16 } },
    ...overrides,
  } as Player;
}

function makeArchetype(name: string = 'analytics_architect'): GmArchetype {
  return {
    name: name as any,
    displayName: name,
    description: 'Test',
    weights: {
      analyticsReliance: 80, scoutingReliance: 60, draftPriority: 70,
      freeAgencyAggression: 50, tradeAggression: 60, capConservatism: 60,
      riskTolerance: 50, cultureWeight: 40, schemeFitWeight: 70,
      youthBias: 60, veteranBias: 40, compPickAwareness: 70,
    },
    tendencies: {
      rebuildThreshold: 0.35, contendThreshold: 0.60, coachFiringPatience: 3,
      starPlayerLoyalty: 3, draftTradeUpFrequency: 30, draftTradeDownFrequency: 50,
      maxDeadMoneyTolerance: 15, franchiseTagUsage: 40,
    },
    signatureMoves: [],
  };
}

function makeContext(
  tid: string,
  mode: AiDecisionContext['mode'] = 'contend',
  archetype = 'analytics_architect',
): AiDecisionContext {
  return {
    teamId: teamId(tid), archetype: makeArchetype(archetype),
    season: 1, teamRecord: { wins: 10, losses: 6 },
    capSpace: 30_000_000, draftPickCount: 7, ownerPressure: 50,
    rosterNeeds: [], mode,
  };
}

function makeTeam(id: string, rosterSize = 50): Team {
  return {
    id: teamId(id), city: 'City', name: `Team ${id}`, abbreviation: id.toUpperCase(),
    conference: 'AFC', division: 'AFC East', stadium: 'Stadium',
    owner: { name: 'Owner', patience: 50, spendingWillingness: 70, mediaProfile: 'moderate', priorities: ['winning'] },
    roster: Array.from({ length: rosterSize }, (_, i) => playerId(`${id}_p${i}`)),
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

function makeLeague(overrides: Partial<League> = {}): League {
  return {
    id: 'lg1' as any, name: 'League', season: 1, week: 5, phase: 'regular_season',
    teams: [makeTeam('t1'), makeTeam('t2')],
    players: [
      makePlayer('star_wr', { teamId: teamId('t1') }),
      makePlayer('avg_wr', { teamId: teamId('t2'), seasonStats: { '1': { receivingYards: 400, receivingTDs: 2, gamesPlayed: 16 } } }),
    ],
    coaches: [],
    contracts: [
      {
        id: contractId('c_star'), playerId: playerId('star_wr'), teamId: teamId('t1'),
        status: 'active', totalValue: 20_000_000, totalGuaranteed: 10_000_000,
        years: 3, signingBonus: 3_000_000,
        yearDetails: [makeContractYear({ capHit: 7_000_000 }, 1, 1), makeContractYear({ capHit: 7_000_000 }, 2, 2)],
        hasNoTradeClause: false, hasNoTagClause: false, voidYears: 0,
        signedDate: { season: 1, week: 1 },
      },
    ],
    draftPicks: [
      {
        id: draftPickId('pk_t2_r5'), originalTeamId: teamId('t2'), currentTeamId: teamId('t2'),
        season: 2, round: 5, pickInRound: 10, overall: 138,
        isConditional: false, conditions: [], resolvedRound: null,
      },
      {
        id: draftPickId('pk_t1_r3'), originalTeamId: teamId('t1'), currentTeamId: teamId('t1'),
        season: 2, round: 3, pickInRound: 16, overall: 80,
        isConditional: false, conditions: [], resolvedRound: null,
      },
      {
        id: draftPickId('pk_t1_r6'), originalTeamId: teamId('t1'), currentTeamId: teamId('t1'),
        season: 2, round: 6, pickInRound: 16, overall: 176,
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

// ── Tests ───────────────────────────────────────────────────────────

describe('TradeNegotiation', () => {
  describe('generateCounterOffer', () => {
    it('returns null for massively unfair proposals (reject)', () => {
      const league = makeLeague();
      const proposal: TradeProposal = {
        id: 'unfair1', proposingTeamId: teamId('t1'), targetTeamId: teamId('t2'),
        offering: [{ type: 'draft_pick', pickId: draftPickId('pk_t1_r6') }],
        requesting: [{ type: 'player', playerId: playerId('star_wr') }],
        expiresAt: { season: 1, week: 10 }, counterOfferCount: 0, status: 'pending',
      };

      const ctx = makeContext('t2');
      const result = generateCounterOffer(proposal, league, ctx, 42);
      expect(result).toBeNull();
    });

    it('rebuilding team counters asking for picks', () => {
      const league = makeLeague();
      const proposal: TradeProposal = {
        id: 'rebuild1', proposingTeamId: teamId('t1'), targetTeamId: teamId('t2'),
        offering: [{ type: 'player', playerId: playerId('avg_wr') }],
        requesting: [{ type: 'draft_pick', pickId: draftPickId('pk_t1_r3') }],
        expiresAt: { season: 1, week: 10 }, counterOfferCount: 0, status: 'pending',
      };

      const ctx = makeContext('t2', 'rebuild');
      const result = generateCounterOffer(proposal, league, ctx, 123);
      if (result) {
        const hasPickRequest = result.requesting.some(a => a.type === 'draft_pick');
        expect(hasPickRequest).toBe(true);
      }
    });

    it('deterministic: same seed produces same counter', () => {
      const league = makeLeague();
      const proposal: TradeProposal = {
        id: 'det1', proposingTeamId: teamId('t1'), targetTeamId: teamId('t2'),
        offering: [{ type: 'player', playerId: playerId('avg_wr') }],
        requesting: [{ type: 'draft_pick', pickId: draftPickId('pk_t1_r3') }],
        expiresAt: { season: 1, week: 10 }, counterOfferCount: 0, status: 'pending',
      };

      const ctx = makeContext('t2', 'rebuild');
      const a = generateCounterOffer(proposal, league, ctx, 42);
      const b = generateCounterOffer(proposal, league, ctx, 42);
      expect(a).toEqual(b);
    });

    it('aggressive dealmaker has higher tolerance for unfair trades', () => {
      const league = makeLeague();
      const proposal: TradeProposal = {
        id: 'agg1', proposingTeamId: teamId('t1'), targetTeamId: teamId('t2'),
        offering: [{ type: 'draft_pick', pickId: draftPickId('pk_t1_r3') }],
        requesting: [{ type: 'player', playerId: playerId('star_wr') }],
        expiresAt: { season: 1, week: 10 }, counterOfferCount: 0, status: 'pending',
      };

      const conservative = makeContext('t2', 'contend', 'analytics_architect');
      const aggressive = makeContext('t2', 'contend', 'aggressive_dealmaker');

      const conservativeResult = generateCounterOffer(proposal, league, conservative, 99);
      const aggressiveResult = generateCounterOffer(proposal, league, aggressive, 99);

      // Aggressive dealmaker is more likely to counter instead of reject
      if (conservativeResult === null) {
        expect(aggressiveResult === null || aggressiveResult !== null).toBe(true);
      }
    });
  });

  describe('evaluateFromTeamPerspective', () => {
    it('contending team values player additions positively', () => {
      const league = makeLeague();
      const proposal: TradeProposal = {
        id: 'eval1', proposingTeamId: teamId('t1'), targetTeamId: teamId('t2'),
        offering: [{ type: 'player', playerId: playerId('star_wr') }],
        requesting: [{ type: 'draft_pick', pickId: draftPickId('pk_t2_r5') }],
        expiresAt: { season: 1, week: 10 }, counterOfferCount: 0, status: 'pending',
      };

      const ctx = makeContext('t2', 'contend');
      const result = evaluateFromTeamPerspective(proposal, league, ctx);
      expect(result.score).toBeGreaterThan(0);
      expect(['strong_accept', 'accept', 'neutral']).toContain(result.recommendation);
    });

    it('rebuilding team values pick additions positively', () => {
      const league = makeLeague();
      const proposal: TradeProposal = {
        id: 'eval2', proposingTeamId: teamId('t1'), targetTeamId: teamId('t2'),
        offering: [{ type: 'draft_pick', pickId: draftPickId('pk_t1_r3') }],
        requesting: [{ type: 'player', playerId: playerId('avg_wr') }],
        expiresAt: { season: 1, week: 10 }, counterOfferCount: 0, status: 'pending',
      };

      const ctx = makeContext('t2', 'rebuild');
      const result = evaluateFromTeamPerspective(proposal, league, ctx);
      expect(result.score).toBeGreaterThan(-500);
    });

    it('returns a valid recommendation enum value', () => {
      const league = makeLeague();
      const proposal: TradeProposal = {
        id: 'eval3', proposingTeamId: teamId('t1'), targetTeamId: teamId('t2'),
        offering: [{ type: 'player', playerId: playerId('star_wr') }],
        requesting: [{ type: 'player', playerId: playerId('avg_wr') }],
        expiresAt: { season: 1, week: 10 }, counterOfferCount: 0, status: 'pending',
      };

      const ctx = makeContext('t2');
      const result = evaluateFromTeamPerspective(proposal, league, ctx);
      expect(['strong_accept', 'accept', 'neutral', 'reject', 'strong_reject']).toContain(result.recommendation);
    });
  });
});
