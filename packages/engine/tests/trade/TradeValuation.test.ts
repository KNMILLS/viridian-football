import { describe, it, expect } from 'vitest';
import {
  getPlayerTradeValue,
  getPickTradeValue,
  getSurplusValue,
  getContenderPremium,
  getDeadlinePressure,
  computeFairnessScore,
} from '../../src/trade/TradeValuation.js';
import { getRawPickValue, getDiscountedPickValue, computeAgingDiscount } from '../../src/trade/tradeValueChart.js';
import { DEADLINE_PRESSURE_MAX, CONTENDER_PREMIUM_MAX } from '../../src/trade/constants.js';
import { defaultCurves } from '../../src/progression/positionCurves.js';
import type { Player } from '../../src/types/player.js';
import type { Contract, ContractYear } from '../../src/types/contract.js';
import type { DraftPick } from '../../src/types/draft.js';
import { playerId, teamId, contractId, draftPickId } from '../../src/types/ids.js';

// ── Helpers ─────────────────────────────────────────────────────────

function makeContractYear(overrides: Partial<ContractYear> = {}, year = 1, season = 1): ContractYear {
  return {
    year, season,
    baseSalary: 5_000_000, capHit: 7_000_000, deadMoney: 0,
    signingBonusProration: 2_000_000, rosterBonus: 0, optionBonus: 0,
    incentives: [], isVoidYear: false, guaranteed: false, guaranteeType: 'none',
    ...overrides,
  };
}

function makeContract(overrides: Partial<Contract> = {}): Contract {
  return {
    id: contractId('c1'), playerId: playerId('p1'), teamId: teamId('t1'),
    status: 'active', totalValue: 35_000_000, totalGuaranteed: 20_000_000,
    years: 3, signingBonus: 6_000_000,
    yearDetails: [makeContractYear({}, 1, 1), makeContractYear({}, 2, 2), makeContractYear({}, 3, 3)],
    hasNoTradeClause: false, hasNoTagClause: false, voidYears: 0,
    signedDate: { season: 1, week: 1 },
    ...overrides,
  };
}

function makePlayer(overrides: Partial<Player> = {}): Player {
  return {
    id: playerId('p1'), firstName: 'Test', lastName: 'Player',
    age: 26, position: 'QB', secondaryPositions: [],
    teamId: teamId('t1'), jerseyNumber: 12, experience: 4,
    college: 'State U', draftYear: 1, draftRound: 1, draftPick: 1,
    physical: { speed: 80, acceleration: 80, strength: 70, agility: 75, jumping: 70, stamina: 85, toughness: 80 },
    personality: {
      leadership: 70, workEthic: 75, ego: 50, coachability: 70,
      competitiveness: 80, composure: 75, loyalty: 60,
      greed: 40, legacyDrive: 50, fameSeeking: 30, familyOriented: 40,
      teamChemistryEffect: 60, prankster: 30, loner: 20, mentorWillingness: 60,
      respectForVeterans: 70, aggression: 50, discipline: 70, motorEffort: 75,
      footballIQ: 80, filmStudyDedication: 70, offFieldRisk: 15,
      mediaHandling: 'professional', communityEngagement: 60, durabilityMindset: 70,
      resilience: 65, confidenceVolatility: 30, chipOnShoulder: 40,
    },
    hidden: {
      trueOverall: 82, injuryProneness: 30, clutchFactor: 70,
      consistencyVariance: 10, ceilingFloor: [70, 92],
      footballCharacter: 80, schemeVersatility: 60,
    },
    contract: null, injuryStatus: null,
    careerStats: {}, seasonStats: {},
    ...overrides,
  } as Player;
}

function makePick(overrides: Partial<DraftPick> = {}): DraftPick {
  return {
    id: draftPickId('pk1'), originalTeamId: teamId('t1'), currentTeamId: teamId('t1'),
    season: 1, round: 1, pickInRound: 1, overall: 1,
    isConditional: false, conditions: [], resolvedRound: null,
    ...overrides,
  };
}

// ── Tests ───────────────────────────────────────────────────────────

describe('TradeValuation', () => {
  describe('getPlayerTradeValue', () => {
    it('peak-age player is worth more than post-peak player at same position', () => {
      const peak = makePlayer({ age: 28 });
      const old = makePlayer({ id: playerId('p2'), age: 38 });
      expect(getPlayerTradeValue(peak, null)).toBeGreaterThan(getPlayerTradeValue(old, null));
    });

    it('player with better stats is worth more', () => {
      const productive = makePlayer({
        seasonStats: { '1': { passingYards: 4500, passingTDs: 35, gamesPlayed: 16 } },
      });
      const average = makePlayer({
        id: playerId('p2'),
        seasonStats: { '1': { passingYards: 2000, passingTDs: 12, gamesPlayed: 16 } },
      });
      expect(getPlayerTradeValue(productive, null)).toBeGreaterThan(getPlayerTradeValue(average, null));
    });

    it('injured player is discounted', () => {
      const healthy = makePlayer();
      const injured = makePlayer({
        id: playerId('p2'),
        injuryStatus: { type: 'ACL', severity: 'severe', weeksRemaining: 8, performancePenalty: 0.3, isRecurring: false },
      });
      expect(getPlayerTradeValue(healthy, null)).toBeGreaterThan(getPlayerTradeValue(injured, null));
    });

    it('returns deterministic values for same inputs', () => {
      const player = makePlayer();
      const contract = makeContract();
      const a = getPlayerTradeValue(player, contract);
      const b = getPlayerTradeValue(player, contract);
      expect(a).toBe(b);
    });
  });

  describe('getPickTradeValue', () => {
    it('round 1 pick is worth more than round 7 pick', () => {
      const r1 = makePick({ round: 1, pickInRound: 1 });
      const r7 = makePick({ id: draftPickId('pk2'), round: 7, pickInRound: 1 });
      expect(getPickTradeValue(r1, 1)).toBeGreaterThan(getPickTradeValue(r7, 1));
    });

    it('future pick is discounted relative to current-year pick', () => {
      const current = makePick({ round: 2, pickInRound: 10, season: 1 });
      const future = makePick({ id: draftPickId('pk2'), round: 2, pickInRound: 10, season: 2 });
      expect(getPickTradeValue(current, 1)).toBeGreaterThan(getPickTradeValue(future, 1));
    });

    it('next year 2nd-round pick approximates this year 3rd-round pick', () => {
      const thisYear3rd = makePick({ round: 3, pickInRound: 16, season: 1 });
      const nextYear2nd = makePick({ id: draftPickId('pk2'), round: 2, pickInRound: 16, season: 2 });
      const ratio = getPickTradeValue(nextYear2nd, 1) / getPickTradeValue(thisYear3rd, 1);
      expect(ratio).toBeGreaterThan(0.5);
      expect(ratio).toBeLessThan(2.0);
    });
  });

  describe('getSurplusValue', () => {
    it('overpaid player has negative surplus', () => {
      const player = makePlayer({ experience: 1, seasonStats: {} });
      const contract = makeContract({
        yearDetails: [makeContractYear({ capHit: 40_000_000 }, 1, 1)],
      });
      expect(getSurplusValue(player, contract)).toBeLessThan(0);
    });
  });

  describe('getContenderPremium', () => {
    it('12-4 team gets higher premium than 4-12 team', () => {
      const contender = getContenderPremium({ wins: 12, losses: 4 });
      const rebuilder = getContenderPremium({ wins: 4, losses: 12 });
      expect(contender).toBeGreaterThan(rebuilder);
      expect(contender).toBeGreaterThan(1.0);
      expect(contender).toBeLessThanOrEqual(CONTENDER_PREMIUM_MAX);
    });

    it('returns 1.0 for zero-game record', () => {
      expect(getContenderPremium({ wins: 0, losses: 0 })).toBe(1.0);
    });
  });

  describe('getDeadlinePressure', () => {
    it('pressure at deadline is higher than early in season', () => {
      const atDeadline = getDeadlinePressure(0);
      const earlyseason = getDeadlinePressure(8);
      expect(atDeadline).toBeGreaterThan(earlyseason);
      expect(atDeadline).toBe(DEADLINE_PRESSURE_MAX);
    });
  });

  describe('computeFairnessScore', () => {
    it('equal values produce 0 fairness', () => {
      expect(computeFairnessScore(500, 500)).toBe(0);
    });

    it('offering > requesting produces positive score', () => {
      expect(computeFairnessScore(700, 300)).toBeGreaterThan(0);
    });

    it('offering < requesting produces negative score', () => {
      expect(computeFairnessScore(300, 700)).toBeLessThan(0);
    });
  });

  describe('aging curves', () => {
    it('RB aging discount is steeper than QB at age 32', () => {
      const rbDiscount = computeAgingDiscount(32, defaultCurves['RB']);
      const qbDiscount = computeAgingDiscount(32, defaultCurves['QB']);
      expect(rbDiscount).toBeLessThan(qbDiscount);
    });
  });
});
