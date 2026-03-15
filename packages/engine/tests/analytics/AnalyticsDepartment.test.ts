import { describe, it, expect, vi } from 'vitest';
import {
  getAnalyticsTier,
  getNoiseMultiplier,
  getCapProjectionAccuracy,
  getInjuryPredictionAccuracy,
  investInAnalytics,
  registerEventHandlers,
} from '../../src/analytics/AnalyticsDepartment.js';
import { EventBus } from '../../src/events/EventBus.js';
import type { GameEventMap } from '../../src/events/GameEvents.js';
import { teamId } from '../../src/types/ids.js';
import type { Team } from '../../src/types/team.js';

function makeTeam(overrides: Partial<Team>): Team {
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
    scoutingBudget: 10_000_000,
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

describe('AnalyticsDepartment', () => {
  describe('getAnalyticsTier', () => {
    it('returns correct tier for each level 1-5', () => {
      expect(getAnalyticsTier(makeTeam({ analyticsLevel: 1 })).level).toBe(1);
      expect(getAnalyticsTier(makeTeam({ analyticsLevel: 2 })).level).toBe(2);
      expect(getAnalyticsTier(makeTeam({ analyticsLevel: 3 })).level).toBe(3);
      expect(getAnalyticsTier(makeTeam({ analyticsLevel: 4 })).level).toBe(4);
      expect(getAnalyticsTier(makeTeam({ analyticsLevel: 5 })).level).toBe(5);
    });

    it('clamps analyticsLevel to 1-5', () => {
      expect(getAnalyticsTier(makeTeam({ analyticsLevel: 0 })).level).toBe(1);
      expect(getAnalyticsTier(makeTeam({ analyticsLevel: 10 })).level).toBe(5);
    });
  });

  describe('getNoiseMultiplier', () => {
    it('noise multiplier decreases as tier increases', () => {
      const m1 = getNoiseMultiplier(1);
      const m3 = getNoiseMultiplier(3);
      const m5 = getNoiseMultiplier(5);
      expect(m1).toBeGreaterThan(m3);
      expect(m3).toBeGreaterThan(m5);
      expect(m1).toBe(2.0);
      expect(m5).toBe(0.3);
    });
  });

  describe('investInAnalytics', () => {
    it('upgrades analytics level and emits BUDGET_CHANGED when funds sufficient', () => {
      const bus = new EventBus<GameEventMap>();
      const handler = vi.fn();
      bus.on('BUDGET_CHANGED', handler);

      const team = makeTeam({ analyticsLevel: 1, scoutingBudget: 5_000_000 });
      const result = investInAnalytics(team, 5_000_000, bus);

      expect(result.success).toBe(true);
      expect(result.newLevel).toBe(2);
      expect(result.cost).toBe(2_000_000);
      expect(team.analyticsLevel).toBe(2);
      expect(team.scoutingBudget).toBe(3_000_000);
      expect(handler).toHaveBeenCalledTimes(1);
      expect(handler.mock.calls[0]![0]).toMatchObject({
        teamId: team.id,
        department: 'analytics',
        oldBudget: 5_000_000,
        newBudget: 3_000_000,
      });
    });

    it('fails gracefully when insufficient funds', () => {
      const bus = new EventBus<GameEventMap>();
      const team = makeTeam({ analyticsLevel: 1, scoutingBudget: 1_000_000 });
      const result = investInAnalytics(team, 1_000_000, bus);

      expect(result.success).toBe(false);
      expect(result.newLevel).toBe(1);
      expect(result.cost).toBe(0);
      expect(team.analyticsLevel).toBe(1);
      expect(team.scoutingBudget).toBe(1_000_000);
    });

    it('does not upgrade past tier 5', () => {
      const bus = new EventBus<GameEventMap>();
      const team = makeTeam({ analyticsLevel: 5, scoutingBudget: 100_000_000 });
      const result = investInAnalytics(team, 100_000_000, bus);
      expect(result.success).toBe(false);
      expect(result.newLevel).toBe(5);
    });
  });

  describe('getCapProjectionAccuracy', () => {
    it('projection years and accuracy improve with tier', () => {
      const t1 = getCapProjectionAccuracy(1);
      const t5 = getCapProjectionAccuracy(5);
      expect(t1.years).toBeLessThanOrEqual(t5.years);
      expect(t5.years).toBe(5);
      expect(t1.errorMarginPct).toBeGreaterThan(t5.errorMarginPct);
    });
  });

  describe('getInjuryPredictionAccuracy', () => {
    it('injury prediction accuracy increases with tier', () => {
      const a1 = getInjuryPredictionAccuracy(1);
      const a5 = getInjuryPredictionAccuracy(5);
      expect(a1).toBeLessThan(a5);
      expect(a1).toBeGreaterThanOrEqual(0);
      expect(a5).toBeLessThanOrEqual(1);
    });
  });

  describe('registerEventHandlers', () => {
    it('subscribes to SEASON_END and returns unsubscribe', () => {
      const bus = new EventBus<GameEventMap>();
      const getTeam = () => makeTeam({});
      const unsub = registerEventHandlers(bus, getTeam);
      expect(bus.listenerCount('SEASON_END')).toBe(1);
      unsub();
      expect(bus.listenerCount('SEASON_END')).toBe(0);
    });
  });
});
