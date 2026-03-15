import { describe, it, expect, vi } from 'vitest';
import { analyzeRosterNeeds, produceNeedEvents } from '../../src/roster/RosterNeedAnalyzer.js';
import { EventBus } from '../../src/events/EventBus.js';
import type { GameEventMap } from '../../src/events/GameEvents.js';
import type { Player } from '../../src/types/player.js';
import type { Team, DepthChart } from '../../src/types/team.js';
import { teamId, playerId } from '../../src/types/ids.js';
import { Position } from '../../src/types/player.js';

// ── Helpers ────────────────────────────────────────────────────────

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
      offFieldRisk: 15, mediaHandling: 'professional', communityEngagement: 50,
      durabilityMindset: 70, resilience: 65, confidenceVolatility: 30,
      chipOnShoulder: 40,
    },
    hidden: {
      trueOverall: 82, injuryProneness: 30, clutchFactor: 70,
      consistencyVariance: 10, ceilingFloor: [70, 92],
      footballCharacter: 75, schemeVersatility: 60,
    },
    contract: null,
    injuryStatus: null,
    careerStats: {},
    seasonStats: {},
    ...overrides,
  } as Player;
}

function emptyDepthChart(): DepthChart {
  const chart = {} as DepthChart;
  for (const pos of Position.options) {
    chart[pos] = [];
  }
  return chart;
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

// ── Tests ──────────────────────────────────────────────────────────

describe('RosterNeedAnalyzer', () => {
  describe('analyzeRosterNeeds', () => {
    it('flags positions with only 1 player as high urgency or above', () => {
      const p1 = makePlayer({ id: playerId('qb1'), position: 'QB' });
      const chart = emptyDepthChart();
      chart['QB'] = [p1.id];
      const team = makeTeam({ depthChart: chart });

      const needs = analyzeRosterNeeds(team, [p1], chart);
      const qbNeed = needs.find((n) => n.position === 'QB');
      expect(qbNeed).toBeDefined();
      expect(['high', 'critical', 'medium']).toContain(qbNeed!.urgency);
      expect(qbNeed!.notes).toContain('No depth');
    });

    it('flags aging starter past peak as a future need', () => {
      const oldQB = makePlayer({
        id: playerId('qb1'),
        position: 'QB',
        age: 38,
        hidden: {
          trueOverall: 85, injuryProneness: 30, clutchFactor: 70,
          consistencyVariance: 10, ceilingFloor: [70, 92],
          footballCharacter: 75, schemeVersatility: 60,
        },
      });
      const backupQB = makePlayer({ id: playerId('qb2'), position: 'QB', age: 24 });
      const chart = emptyDepthChart();
      chart['QB'] = [oldQB.id, backupQB.id];
      const team = makeTeam({ depthChart: chart });

      const needs = analyzeRosterNeeds(team, [oldQB, backupQB], chart);
      const qbNeed = needs.find((n) => n.position === 'QB');
      expect(qbNeed).toBeDefined();
      expect(qbNeed!.notes).toContain('past peak');
    });

    it('flags expiring contract as a potential need', () => {
      const player = makePlayer({
        id: playerId('wr1'),
        position: 'WR',
        contract: { contractId: 'c1', yearsRemaining: 1, currentYearCapHit: 10_000_000, totalValue: 40_000_000 },
      });
      const backup = makePlayer({ id: playerId('wr2'), position: 'WR' });
      const chart = emptyDepthChart();
      chart['WR'] = [player.id, backup.id];
      const team = makeTeam({ depthChart: chart });

      const needs = analyzeRosterNeeds(team, [player, backup], chart);
      const wrNeed = needs.find((n) => n.position === 'WR');
      expect(wrNeed).toBeDefined();
      expect(wrNeed!.notes).toContain('expiring contract');
    });

    it('flags starter well below league average as critical urgency', () => {
      const weakCB = makePlayer({
        id: playerId('cb1'),
        position: 'CB',
        hidden: {
          trueOverall: 45, injuryProneness: 30, clutchFactor: 50,
          consistencyVariance: 15, ceilingFloor: [40, 55],
          footballCharacter: 60, schemeVersatility: 40,
        },
      });
      const chart = emptyDepthChart();
      chart['CB'] = [weakCB.id];
      const team = makeTeam({ depthChart: chart });

      const needs = analyzeRosterNeeds(team, [weakCB], chart, { CB: 75 });
      const cbNeed = needs.find((n) => n.position === 'CB');
      expect(cbNeed).toBeDefined();
      expect(cbNeed!.urgency).toBe('critical');
    });
  });

  describe('produceNeedEvents', () => {
    it('emits ROSTER_NEED_IDENTIFIED only for high and critical needs', () => {
      const bus = new EventBus<GameEventMap>();
      const handler = vi.fn();
      bus.on('ROSTER_NEED_IDENTIFIED', handler);

      produceNeedEvents(
        [
          { position: 'QB', urgency: 'low', notes: 'Fine' },
          { position: 'CB', urgency: 'high', notes: 'Weak' },
          { position: 'WR', urgency: 'medium', notes: 'Ok' },
          { position: 'RB', urgency: 'critical', notes: 'Empty' },
        ],
        teamId('t1'),
        bus,
      );

      expect(handler).toHaveBeenCalledTimes(2);
      expect(handler).toHaveBeenCalledWith(expect.objectContaining({ position: 'CB', urgency: 'high' }));
      expect(handler).toHaveBeenCalledWith(expect.objectContaining({ position: 'RB', urgency: 'critical' }));
    });
  });
});
