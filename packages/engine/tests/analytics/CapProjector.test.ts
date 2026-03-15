import { describe, it, expect } from 'vitest';
import { projectCapSpace } from '../../src/analytics/CapProjector.js';
import { getCapProjectionAccuracy } from '../../src/analytics/AnalyticsDepartment.js';
import { teamId, contractId, playerId } from '../../src/types/ids.js';
import type { Team } from '../../src/types/team.js';
import type { Contract } from '../../src/types/contract.js';

function makeTeam(overrides: Partial<Team> = {}): Team {
  return {
    id: teamId('team-1'),
    city: 'Test',
    name: 'Testers',
    abbreviation: 'TST',
    conference: 'AFC',
    division: 'AFC East',
    stadium: 'Test Stadium',
    owner: { name: 'Owner', patience: 50, spendingWillingness: 50, mediaProfile: 'quiet', priorities: [] },
    roster: [],
    practiceSquad: [],
    injuredReserve: [],
    coachingStaff: [],
    headCoachId: null,
    depthChart: {} as Team['depthChart'],
    record: { wins: 0, losses: 0, ties: 0, pointsFor: 0, pointsAgainst: 0, divisionWins: 0, divisionLosses: 0, conferenceWins: 0, conferenceLosses: 0, streak: { type: 'W', count: 0 } },
    analyticsLevel: 1,
    scoutingBudget: 5_000_000,
    facilitiesLevel: 3,
    delegationSettings: {
      practiceSquad: 'auto',
      waiverClaims: 'review',
      trainingCampCuts: 'review',
      injuredReserve: 'review',
      contractNegotiations: 'manual',
      scoutingAssignments: 'review',
      tradeEvaluation: 'manual',
      draftBoard: 'manual',
      freeAgencyTargets: 'review',
    },
    ...overrides,
  };
}

function makeContract(season: number, capHit: number): Contract {
  return {
    id: contractId('c1'),
    playerId: playerId('p1'),
    teamId: teamId('team-1'),
    status: 'active',
    totalValue: capHit * 3,
    totalGuaranteed: capHit,
    years: 3,
    signingBonus: capHit * 0.4,
    yearDetails: [
      { year: 1, season, baseSalary: capHit * 0.6, capHit, deadMoney: capHit, signingBonusProration: capHit * 0.4, rosterBonus: 0, optionBonus: 0, incentives: [], isVoidYear: false, guaranteed: true, guaranteeType: 'full' },
    ],
    hasNoTradeClause: false,
    hasNoTagClause: false,
    voidYears: 0,
    signedDate: { season: season - 1, week: 0 },
  };
}

describe('CapProjector', () => {
  it('projection horizon increases with tier (tier 1: 1 year, tier 5: 5 years)', () => {
    const acc1 = getCapProjectionAccuracy(1);
    const acc5 = getCapProjectionAccuracy(5);
    expect(acc1.years).toBe(1);
    expect(acc5.years).toBe(5);

    const team = makeTeam();
    const contracts: Contract[] = [];
    const proj1 = projectCapSpace(team, contracts, 255_000_000, 1, 42);
    const proj5 = projectCapSpace(team, contracts, 255_000_000, 5, 43);
    expect(proj1.length).toBe(1);
    expect(proj5.length).toBe(5);
  });

  it('confidence range narrows at higher tiers', () => {
    const team = makeTeam();
    const contracts: Contract[] = [];
    const proj1 = projectCapSpace(team, contracts, 255_000_000, 1, 44);
    const proj5 = projectCapSpace(team, contracts, 255_000_000, 5, 45);
    const [low1, high1] = proj1[0]!.confidenceRange;
    const [low5, high5] = proj5[0]!.confidenceRange;
    const width1 = high1 - low1;
    const width5 = high5 - low5;
    expect(width5).toBeLessThan(width1);
  });

  it('committed cap correctly summed from contracts', () => {
    const team = makeTeam();
    const baseCap = 255_000_000;
    // Use high committed amount so projectedSpace < baseCap even with cap growth in year 1
    const committed = 200_000_000;
    const contracts = [makeContract(1, committed)];
    const proj = projectCapSpace(team, contracts, baseCap, 1, 46);
    expect(proj[0]!.projectedSpace).toBeGreaterThan(0);
    // With 200M committed, projected space should be well below base cap (growth ~7% gives ~273M max, so space ~73M)
    expect(proj[0]!.projectedSpace).toBeLessThan(baseCap);
  });

  it('projected space accounts for cap growth', () => {
    const team = makeTeam();
    const contracts: Contract[] = [];
    const baseCap = 255_000_000;
    const proj5 = projectCapSpace(team, contracts, baseCap, 5, 47);
    // Year 1 has growth applied so projected space > baseCap when no commitments
    expect(proj5[0]!.projectedSpace).toBeGreaterThanOrEqual(baseCap);
    expect(proj5[1]!.projectedSpace).toBeGreaterThan(proj5[0]!.projectedSpace);
    expect(proj5[2]!.projectedSpace).toBeGreaterThan(proj5[1]!.projectedSpace);
  });

  it('produces deterministic output with same seed', () => {
    const team = makeTeam();
    const contracts: Contract[] = [makeContract(1, 50_000_000)];
    const a = projectCapSpace(team, contracts, 255_000_000, 3, 100);
    const b = projectCapSpace(team, contracts, 255_000_000, 3, 100);
    expect(a.length).toBe(b.length);
    a.forEach((yr, i) => {
      expect(yr.season).toBe(b[i]!.season);
      expect(yr.projectedSpace).toBe(b[i]!.projectedSpace);
      expect(yr.confidenceRange).toEqual(b[i]!.confidenceRange);
    });
  });
});
