import { describe, it, expect } from 'vitest';
import {
  getTradeRequestLikelihood,
  getTradeReaction,
  getTeammateReaction,
  getNoTradeClauseVetoLikelihood,
} from '../../src/trade/PersonalityTradeEffects.js';
import type { TradeRequestContext } from '../../src/trade/PersonalityTradeEffects.js';
import type { Player } from '../../src/types/player.js';
import type { Team, TeamRecord } from '../../src/types/team.js';
import { playerId, teamId } from '../../src/types/ids.js';

// ── Helpers ─────────────────────────────────────────────────────────

const defaultRecord: TeamRecord = {
  wins: 8, losses: 8, ties: 0, pointsFor: 350, pointsAgainst: 350,
  divisionWins: 3, divisionLosses: 3, conferenceWins: 5, conferenceLosses: 5,
  streak: { type: 'W', count: 1 },
};

function makePlayer(overrides: Partial<Player> = {}): Player {
  return {
    id: playerId('p1'), firstName: 'Test', lastName: 'Player',
    age: 26, position: 'WR', secondaryPositions: [],
    teamId: teamId('t1'), jerseyNumber: 88, experience: 4,
    college: 'State U', draftYear: 1, draftRound: 2, draftPick: 5,
    physical: { speed: 85, acceleration: 85, strength: 65, agility: 80, jumping: 80, stamina: 80, toughness: 70 },
    personality: {
      leadership: 60, workEthic: 70, ego: 50, coachability: 70,
      competitiveness: 75, composure: 70, loyalty: 50,
      greed: 50, legacyDrive: 50, fameSeeking: 30, familyOriented: 30,
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
    contract: null, injuryStatus: null, careerStats: {}, seasonStats: {},
    ...overrides,
  } as Player;
}

function makeTeam(id: string, record: Partial<TeamRecord> = {}): Team {
  return {
    id: teamId(id), city: 'City', name: `Team ${id}`, abbreviation: id.toUpperCase(),
    conference: 'AFC', division: 'AFC East', stadium: 'Stadium',
    owner: { name: 'Owner', patience: 50, spendingWillingness: 70, mediaProfile: 'moderate', priorities: ['winning'] },
    roster: [], practiceSquad: [], injuredReserve: [], coachingStaff: [], headCoachId: null,
    depthChart: {} as any, record: { ...defaultRecord, ...record },
    analyticsLevel: 3, scoutingBudget: 100, facilitiesLevel: 3,
    delegationSettings: {
      practiceSquad: 'auto', waiverClaims: 'auto', trainingCampCuts: 'auto',
      injuredReserve: 'auto', contractNegotiations: 'manual', scoutingAssignments: 'auto',
      tradeEvaluation: 'manual', draftBoard: 'manual', freeAgencyTargets: 'manual',
    },
  };
}

// ── Tests ───────────────────────────────────────────────────────────

describe('PersonalityTradeEffects', () => {
  describe('getTradeRequestLikelihood', () => {
    it('high greed + underpaid → high trade request likelihood', () => {
      const greedy = makePlayer({
        personality: {
          ...makePlayer().personality,
          greed: 95, loyalty: 30, familyOriented: 10,
        },
      });
      const ctx: TradeRequestContext = {
        teamRecord: { ...defaultRecord, wins: 4, losses: 12 },
        positionMarketSalary: 15_000_000,
        currentSalary: 3_000_000,
        isStarter: true, yearsOnTeam: 2, teamMarketSize: 'small',
      };
      const likelihood = getTradeRequestLikelihood(greedy, ctx);
      expect(likelihood).toBeGreaterThan(0.2);
    });

    it('high loyalty + winning team → low trade request likelihood', () => {
      const loyal = makePlayer({
        personality: {
          ...makePlayer().personality,
          loyalty: 95, greed: 10, chipOnShoulder: 10,
          fameSeeking: 10, legacyDrive: 10, familyOriented: 50,
        },
      });
      const ctx: TradeRequestContext = {
        teamRecord: { ...defaultRecord, wins: 12, losses: 4 },
        positionMarketSalary: 10_000_000,
        currentSalary: 10_000_000,
        isStarter: true, yearsOnTeam: 6, teamMarketSize: 'large',
      };
      const likelihood = getTradeRequestLikelihood(loyal, ctx);
      expect(likelihood).toBeLessThan(0.1);
    });

    it('chipOnShoulder + benched → elevated likelihood', () => {
      const benched = makePlayer({
        personality: {
          ...makePlayer().personality,
          chipOnShoulder: 90, greed: 20, loyalty: 50,
          familyOriented: 20,
        },
      });
      const ctx: TradeRequestContext = {
        teamRecord: defaultRecord,
        positionMarketSalary: 8_000_000,
        currentSalary: 8_000_000,
        isStarter: false, yearsOnTeam: 3, teamMarketSize: 'medium',
      };
      const likelihood = getTradeRequestLikelihood(benched, ctx);
      expect(likelihood).toBeGreaterThan(0.05);
    });
  });

  describe('getTradeReaction', () => {
    it('high loyalty + long tenure → morale hit from trade', () => {
      const loyal = makePlayer({
        personality: { ...makePlayer().personality, loyalty: 95 },
      });
      const fromTeam = makeTeam('t1', { wins: 10, losses: 6 });
      const toTeam = makeTeam('t2', { wins: 8, losses: 8 });

      const result = getTradeReaction(loyal, fromTeam, toTeam, {
        yearsOnFromTeam: 8, wasBenchedOnFromTeam: false,
      });
      expect(result.moraleChange).toBeLessThan(0);
      expect(result.narrative).toContain('loyal');
    });

    it('high chipOnShoulder + benched → morale boost from fresh start', () => {
      const chippy = makePlayer({
        personality: { ...makePlayer().personality, chipOnShoulder: 90, loyalty: 20 },
      });
      const fromTeam = makeTeam('t1');
      const toTeam = makeTeam('t2', { wins: 10, losses: 6 });

      const result = getTradeReaction(chippy, fromTeam, toTeam, {
        yearsOnFromTeam: 2, wasBenchedOnFromTeam: true,
      });
      expect(result.moraleChange).toBeGreaterThan(0);
      expect(result.narrative).toContain('fresh start');
    });

    it('high ego + traded to worse team → negative morale', () => {
      const ego = makePlayer({
        personality: { ...makePlayer().personality, ego: 90, loyalty: 20, competitiveness: 30 },
      });
      const fromTeam = makeTeam('t1', { wins: 12, losses: 4 });
      const toTeam = makeTeam('t2', { wins: 3, losses: 13 });

      const result = getTradeReaction(ego, fromTeam, toTeam, {
        yearsOnFromTeam: 1, wasBenchedOnFromTeam: false,
      });
      expect(result.moraleChange).toBeLessThan(0);
    });
  });

  describe('getTeammateReaction', () => {
    it('high chemistry teammate loses morale when friend traded', () => {
      const teammate = makePlayer({
        id: playerId('tm1'),
        personality: { ...makePlayer().personality, teamChemistryEffect: 90, loner: 10 },
      });
      const traded = makePlayer({ id: playerId('traded') });

      const results = getTeammateReaction(
        [teammate],
        traded,
        new Map([[playerId('tm1'), { sharedYearsOnTeam: 5 }]]),
      );

      const tmResult = results.find(r => r.playerId === playerId('tm1'));
      expect(tmResult).toBeDefined();
      expect(tmResult!.moraleChange).toBeLessThan(0);
    });

    it('loner teammate is unaffected', () => {
      const loner = makePlayer({
        id: playerId('loner1'),
        personality: { ...makePlayer().personality, loner: 90, teamChemistryEffect: 20 },
      });
      const traded = makePlayer({ id: playerId('traded') });

      const results = getTeammateReaction(
        [loner],
        traded,
        new Map([[playerId('loner1'), { sharedYearsOnTeam: 5 }]]),
      );

      const lonerResult = results.find(r => r.playerId === playerId('loner1'));
      expect(lonerResult).toBeDefined();
      expect(lonerResult!.moraleChange).toBe(0);
    });
  });

  describe('getNoTradeClauseVetoLikelihood', () => {
    it('high familyOriented player vetoes trade', () => {
      const family = makePlayer({
        personality: { ...makePlayer().personality, familyOriented: 95, legacyDrive: 10, fameSeeking: 10 },
      });
      const fromTeam = makeTeam('t1');
      const toTeam = makeTeam('t2', { wins: 5, losses: 11 });

      const vetoChance = getNoTradeClauseVetoLikelihood(family, fromTeam, toTeam);
      expect(vetoChance).toBeGreaterThan(0.4);
    });

    it('high legacyDrive aging player accepts trade to contender', () => {
      const legacy = makePlayer({
        age: 33,
        personality: { ...makePlayer().personality, familyOriented: 20, legacyDrive: 95, fameSeeking: 60 },
      });
      const fromTeam = makeTeam('t1', { wins: 4, losses: 12 });
      const toTeam = makeTeam('t2', { wins: 13, losses: 3 });

      const vetoChance = getNoTradeClauseVetoLikelihood(legacy, fromTeam, toTeam);
      expect(vetoChance).toBeLessThan(0.3);
    });
  });
});
