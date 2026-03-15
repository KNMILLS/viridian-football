import { describe, it, expect, beforeEach } from 'vitest';
import { DraftEngine } from '../../src/draft/DraftEngine.js';
import { getPickValue, getQBPremium, getFuturePickDiscount } from '../../src/draft/pickValueChart.js';
import { EventBus } from '../../src/events/EventBus.js';
import type { GameEventMap, PlayerDraftedPayload } from '../../src/events/GameEvents.js';
import { teamId, playerId } from '../../src/types/ids.js';
import type { DraftState } from '../../src/types/draft.js';
import type { Team, TeamRecord, DelegationSettings, OwnerProfile, DepthChart } from '../../src/types/team.js';

function makeTeam(id: string, overrides: Partial<Team> = {}): Team {
  const tid = teamId(id);
  const defaultRecord: TeamRecord = {
    wins: 0, losses: 0, ties: 0,
    pointsFor: 0, pointsAgainst: 0,
    divisionWins: 0, divisionLosses: 0,
    conferenceWins: 0, conferenceLosses: 0,
    streak: { type: 'W', count: 0 },
  };
  const defaultDelegation: DelegationSettings = {
    practiceSquad: 'auto', waiverClaims: 'review', trainingCampCuts: 'review',
    injuredReserve: 'review', contractNegotiations: 'manual',
    scoutingAssignments: 'review', tradeEvaluation: 'manual',
    draftBoard: 'manual', freeAgencyTargets: 'review',
  };
  const defaultOwner: OwnerProfile = {
    name: 'Owner', patience: 50, spendingWillingness: 50,
    mediaProfile: 'moderate', priorities: ['winning'],
  };
  return {
    id: tid,
    city: 'Test', name: 'Team', abbreviation: 'TST',
    conference: 'AFC', division: 'AFC East',
    stadium: 'Stadium', owner: defaultOwner,
    roster: [], practiceSquad: [], injuredReserve: [],
    coachingStaff: [], headCoachId: null,
    depthChart: {} as DepthChart,
    record: defaultRecord,
    analyticsLevel: 3,
    scoutingBudget: 5_000_000,
    facilitiesLevel: 3,
    delegationSettings: defaultDelegation,
    ...overrides,
  };
}

function makeDraftState(availableIds: string[]): DraftState {
  return {
    season: 2025,
    currentRound: 1,
    currentPick: 1,
    picks: [],
    availableProspects: availableIds.map(id => playerId(id)),
    isComplete: false,
  };
}

describe('DraftEngine', () => {
  let bus: EventBus<GameEventMap>;
  let engine: DraftEngine;

  beforeEach(() => {
    bus = new EventBus<GameEventMap>();
    engine = new DraftEngine(bus);
  });

  it('generates a draft class and stores prospects', () => {
    const prospects = engine.generateDraftClass(2025, 42);
    expect(prospects.length).toBe(300);

    const retrieved = engine.getProspect(prospects[0]!.id);
    expect(retrieved).toBeDefined();
    expect(retrieved!.id).toBe(prospects[0]!.id);
  });

  it('is deterministic across full draft class generation', () => {
    const engine2 = new DraftEngine(new EventBus());
    const c1 = engine.generateDraftClass(2025, 42);
    const c2 = engine2.generateDraftClass(2025, 42);

    expect(c1.length).toBe(c2.length);
    for (let i = 0; i < c1.length; i++) {
      expect(c1[i]!.hidden.trueOverall).toBe(c2[i]!.hidden.trueOverall);
    }
    engine2.dispose();
  });

  it('conducts scouting visit and returns updated report', () => {
    const prospects = engine.generateDraftClass(2025, 42);
    const tid = teamId('team-1');
    engine.initializeTeamReports(tid, 3, 100);

    const report = engine.conductScoutingVisit(tid, prospects[0]!.id, 'film_review', 200);
    expect(report.scoutingInvestment).toBeGreaterThan(0);
  });

  it('runs combine and returns event', () => {
    engine.generateDraftClass(2025, 42);
    const event = engine.runCombine(2025, 42);
    expect(event.participants.length).toBe(300);
    expect(event.results.size).toBe(300);
  });

  it('evaluates a prospect and returns DraftBoardEntry', () => {
    const prospects = engine.generateDraftClass(2025, 42);
    const tid = teamId('team-1');
    engine.initializeTeamReports(tid, 3, 100);

    const entry = engine.evaluateProspect(tid, prospects[0]!.id);
    expect(entry.prospectId).toBe(prospects[0]!.id);
    expect(entry.overallGrade).toBeGreaterThanOrEqual(0);
    expect(entry.overallGrade).toBeLessThanOrEqual(100);
  });

  it('emits PLAYER_DRAFTED event on executePick', () => {
    const prospects = engine.generateDraftClass(2025, 42);
    const events: PlayerDraftedPayload[] = [];
    bus.on('PLAYER_DRAFTED', (p) => events.push(p));

    const state = makeDraftState(prospects.map(p => p.id as string));
    const tid = teamId('team-1');

    engine.executePick(state, tid, prospects[0]!.id);

    expect(events.length).toBe(1);
    expect(events[0]!.playerId).toBe(prospects[0]!.id);
    expect(events[0]!.teamId).toBe(tid);
    expect(events[0]!.round).toBe(1);
    expect(events[0]!.overall).toBe(1);
  });

  it('executePick advances state correctly', () => {
    const prospects = engine.generateDraftClass(2025, 42);
    const state = makeDraftState(prospects.map(p => p.id as string));
    const tid = teamId('team-1');

    const newState = engine.executePick(state, tid, prospects[0]!.id);

    expect(newState.currentPick).toBe(2);
    expect(newState.picks.length).toBe(1);
    expect(newState.availableProspects).not.toContain(prospects[0]!.id);
    expect(newState.isComplete).toBe(false);
  });

  it('throws when picking unavailable prospect', () => {
    engine.generateDraftClass(2025, 42);
    const state = makeDraftState([]);
    const tid = teamId('team-1');

    expect(() => engine.executePick(state, tid, playerId('nonexistent'))).toThrow();
  });

  describe('UDFA Signings', () => {
    it('distributes players across teams', () => {
      const prospects = engine.generateDraftClass(2025, 42);
      const undrafted = prospects.slice(200, 210);
      const teams = [
        makeTeam('team-1', { facilitiesLevel: 5 }),
        makeTeam('team-2', { facilitiesLevel: 2 }),
      ];

      const signings = engine.executeUDFASignings(undrafted, teams, 42);

      const team1Count = signings.get(teams[0]!.id)!.length;
      const team2Count = signings.get(teams[1]!.id)!.length;
      expect(team1Count + team2Count).toBe(10);
    });

    it('teams with better facilities tend to attract more UDFAs', () => {
      const prospects = engine.generateDraftClass(2025, 42);
      const undrafted = prospects.slice(200, 300);
      const teams = [
        makeTeam('team-good', { facilitiesLevel: 5, scoutingBudget: 8_000_000 }),
        makeTeam('team-bad', { facilitiesLevel: 1, scoutingBudget: 1_000_000 }),
      ];

      const signings = engine.executeUDFASignings(undrafted, teams, 42);
      const goodCount = signings.get(teams[0]!.id)!.length;
      const badCount = signings.get(teams[1]!.id)!.length;

      expect(goodCount).toBeGreaterThan(badCount);
    });
  });

  describe('Pick Value Chart', () => {
    it('round 1 pick 1 is worth more than round 7 pick 1', () => {
      const r1 = getPickValue(1, 1);
      const r7 = getPickValue(7, 1);
      expect(r1).toBeGreaterThan(r7);
    });

    it('pick values decrease monotonically by overall pick number', () => {
      const v1 = getPickValue(1, 1);
      const v16 = getPickValue(1, 16);
      const v32 = getPickValue(1, 32);
      const v64 = getPickValue(2, 32);
      expect(v1).toBeGreaterThan(v16);
      expect(v16).toBeGreaterThan(v32);
      expect(v32).toBeGreaterThan(v64);
    });

    it('QB premium increases value for top-10 picks', () => {
      const premium = getQBPremium(1);
      expect(premium).toBeGreaterThan(1.0);

      const noPremium = getQBPremium(15);
      expect(noPremium).toBe(1.0);
    });

    it('future pick discount reduces value per year', () => {
      const current = getFuturePickDiscount(0);
      const oneYear = getFuturePickDiscount(1);
      const twoYears = getFuturePickDiscount(2);

      expect(current).toBe(1.0);
      expect(oneYear).toBeLessThan(current);
      expect(twoYears).toBeLessThan(oneYear);
      expect(oneYear).toBeCloseTo(0.85, 2);
    });
  });

  it('disposes event listeners', () => {
    const engine2 = new DraftEngine(bus);
    expect(bus.listenerCount('PLAYER_STATS')).toBe(2);
    engine2.dispose();
    expect(bus.listenerCount('PLAYER_STATS')).toBe(1);
  });
});
