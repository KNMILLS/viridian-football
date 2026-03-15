import { describe, it, expect, vi } from 'vitest';
import { simulateTrainingCamp, generateCutRecommendations } from '../../src/roster/TrainingCamp.js';
import { EventBus } from '../../src/events/EventBus.js';
import type { GameEventMap } from '../../src/events/GameEvents.js';
import type { Player } from '../../src/types/player.js';
import type { Team, DepthChart } from '../../src/types/team.js';
import type { Coach } from '../../src/types/coach.js';
import { teamId, playerId, coachId } from '../../src/types/ids.js';
import { Position } from '../../src/types/player.js';
import { createLCG } from '../../src/sim/RNG.js';

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
      trueOverall: 75, injuryProneness: 30, clutchFactor: 70,
      consistencyVariance: 10, ceilingFloor: [65, 85] as [number, number],
      footballCharacter: 75, schemeVersatility: 60,
    },
    contract: null,
    injuryStatus: null,
    careerStats: {},
    seasonStats: {},
    ...overrides,
  } as Player;
}

function makeCoach(overrides: Partial<Coach> = {}): Coach {
  return {
    id: coachId('hc1'),
    firstName: 'Coach',
    lastName: 'Test',
    age: 55,
    role: 'HC',
    teamId: teamId('t1'),
    offensiveScheme: 'west_coast',
    defensiveScheme: '4_3_under',
    attributes: {
      gameManagement: 70, playerDevelopment: 70, playCalling: 65,
      schemeDesign: 70, recruiting: 60, adaptability: 65,
      talentEvaluation: 70, situationalAwareness: 70,
    },
    personality: {
      aggressiveness: 50, discipline: 70, motivation: 65,
      innovation: 50, ego: 40, stubbornness: 45,
      trustInYouth: 60, mediaPresence: 'professional',
    },
    tendencies: {
      runPassRatio: 0.45, earlyDownRunRate: 0.5, playActionFrequency: 0.2,
      fourthDownAggressiveness: 40, redZoneAggression: 50,
      twoMinuteDrillEfficiency: 60, blitzRate: 0.3, coverageDisguise: 50,
      rotationPhilosophy: 'committee', rookieLeash: 50, veteranLoyalty: 50,
      starterReps: 65, tempoPreference: 'balanced', formationVariety: 50,
      motionFrequency: 40, preferredPersonnelGroupings: [],
    },
    coachingTreeOrigin: null,
    yearsExperience: 20,
    record: { wins: 100, losses: 80, ties: 0 },
    playoffAppearances: 3,
    championships: 0,
    salary: 5_000_000,
    contractYearsRemaining: 3,
    ...overrides,
  } as Coach;
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
    coachingStaff: [coachId('hc1')],
    headCoachId: coachId('hc1'),
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

describe('TrainingCamp', () => {
  describe('simulateTrainingCamp', () => {
    it('produces deterministic results with the same seed', () => {
      const players = [
        makePlayer({ id: playerId('qb1'), position: 'QB', hidden: { trueOverall: 85, injuryProneness: 30, clutchFactor: 70, consistencyVariance: 10, ceilingFloor: [75, 95], footballCharacter: 75, schemeVersatility: 60 } }),
        makePlayer({ id: playerId('qb2'), position: 'QB', hidden: { trueOverall: 72, injuryProneness: 20, clutchFactor: 60, consistencyVariance: 15, ceilingFloor: [60, 80], footballCharacter: 70, schemeVersatility: 55 } }),
      ];
      const team = makeTeam({ roster: players.map((p) => p.id) });
      const coach = makeCoach();

      const result1 = simulateTrainingCamp(team, players, [coach], createLCG(42));
      const result2 = simulateTrainingCamp(team, players, [coach], createLCG(42));

      expect(result1.evaluations.map((e) => e.campScore)).toEqual(
        result2.evaluations.map((e) => e.campScore),
      );
    });

    it('veterans losing battle with high ego trigger HOLDOUT_INITIATED', () => {
      const bus = new EventBus<GameEventMap>();
      const handler = vi.fn();
      bus.on('HOLDOUT_INITIATED', handler);

      const starter = makePlayer({
        id: playerId('young_gun'),
        position: 'WR',
        experience: 2,
        hidden: { trueOverall: 90, injuryProneness: 20, clutchFactor: 70, consistencyVariance: 5, ceilingFloor: [85, 95], footballCharacter: 80, schemeVersatility: 70 },
      });
      const veteran = makePlayer({
        id: playerId('old_ego'),
        position: 'WR',
        experience: 8,
        age: 32,
        personality: {
          leadership: 60, workEthic: 60, ego: 90,
          coachability: 40, competitiveness: 85, composure: 40, loyalty: 30,
          greed: 80, legacyDrive: 60, fameSeeking: 70, familyOriented: 20,
          teamChemistryEffect: 30, prankster: 10, loner: 60,
          mentorWillingness: 20, respectForVeterans: 40, aggression: 70,
          discipline: 40, motorEffort: 50, footballIQ: 60, filmStudyDedication: 40,
          offFieldRisk: 50, mediaHandling: 'volatile' as const, communityEngagement: 20,
          durabilityMindset: 60, resilience: 40, confidenceVolatility: 70,
          chipOnShoulder: 80,
        },
        hidden: { trueOverall: 70, injuryProneness: 40, clutchFactor: 50, consistencyVariance: 15, ceilingFloor: [60, 75], footballCharacter: 50, schemeVersatility: 45 },
        contract: { contractId: 'c1', yearsRemaining: 2, currentYearCapHit: 12_000_000, totalValue: 30_000_000 },
      });

      const team = makeTeam({ roster: [starter.id, veteran.id] });
      const coach = makeCoach();

      simulateTrainingCamp(team, [starter, veteran], [coach], createLCG(42), bus);

      expect(handler).toHaveBeenCalled();
      expect(handler).toHaveBeenCalledWith(expect.objectContaining({
        playerId: veteran.id,
        teamId: team.id,
      }));
    });

    it('veterans losing battle with moderate ego trigger LOCKER_ROOM_ISSUE', () => {
      const bus = new EventBus<GameEventMap>();
      const handler = vi.fn();
      bus.on('LOCKER_ROOM_ISSUE', handler);

      const starter = makePlayer({
        id: playerId('better'),
        position: 'CB',
        experience: 3,
        hidden: { trueOverall: 88, injuryProneness: 20, clutchFactor: 70, consistencyVariance: 5, ceilingFloor: [82, 93], footballCharacter: 80, schemeVersatility: 65 },
      });
      const veteran = makePlayer({
        id: playerId('vet_ego'),
        position: 'CB',
        experience: 7,
        age: 30,
        personality: {
          leadership: 55, workEthic: 60, ego: 80,
          coachability: 50, competitiveness: 80, composure: 50, loyalty: 40,
          greed: 60, legacyDrive: 50, fameSeeking: 50, familyOriented: 30,
          teamChemistryEffect: 40, prankster: 10, loner: 40,
          mentorWillingness: 30, respectForVeterans: 50, aggression: 60,
          discipline: 50, motorEffort: 55, footballIQ: 65, filmStudyDedication: 50,
          offFieldRisk: 30, mediaHandling: 'outspoken' as const, communityEngagement: 35,
          durabilityMindset: 65, resilience: 50, confidenceVolatility: 50,
          chipOnShoulder: 60,
        },
        hidden: { trueOverall: 68, injuryProneness: 35, clutchFactor: 55, consistencyVariance: 12, ceilingFloor: [60, 72], footballCharacter: 55, schemeVersatility: 50 },
        contract: null,
      });

      const team = makeTeam({ roster: [starter.id, veteran.id] });
      const coach = makeCoach();

      simulateTrainingCamp(team, [starter, veteran], [coach], createLCG(99), bus);

      expect(handler).toHaveBeenCalledWith(expect.objectContaining({
        teamId: team.id,
        instigatorId: veteran.id,
      }));
    });
  });

  describe('generateCutRecommendations', () => {
    it('ranks players with low scheme fit higher for cuts', () => {
      const goodFit = makePlayer({ id: playerId('good'), position: 'WR' });
      const poorFit = makePlayer({ id: playerId('poor'), position: 'WR' });
      const team = makeTeam({ roster: [goodFit.id, poorFit.id] });

      const evaluations = [
        { playerId: goodFit.id, campScore: 70, schemeFitScore: 80, notes: [] },
        { playerId: poorFit.id, campScore: 70, schemeFitScore: 25, notes: [] },
      ];

      const result = generateCutRecommendations(team, evaluations, [goodFit, poorFit], 'auto', createLCG(42));
      const recs = result.decision ?? result.staffSuggestion ?? [];
      const poorIdx = recs.findIndex((r) => r.playerId === poorFit.id);
      const goodIdx = recs.findIndex((r) => r.playerId === goodFit.id);
      expect(poorIdx).toBeLessThan(goodIdx);
    });

    it('ranks players with high offFieldRisk higher for cuts', () => {
      const risky = makePlayer({
        id: playerId('risky'),
        position: 'RB',
        personality: {
          leadership: 30, workEthic: 40, ego: 50,
          coachability: 50, competitiveness: 60, composure: 40, loyalty: 40,
          greed: 50, legacyDrive: 30, fameSeeking: 40, familyOriented: 30,
          teamChemistryEffect: 40, prankster: 20, loner: 50,
          mentorWillingness: 20, respectForVeterans: 40, aggression: 60,
          discipline: 30, motorEffort: 50, footballIQ: 50, filmStudyDedication: 40,
          offFieldRisk: 85, mediaHandling: 'volatile' as const, communityEngagement: 15,
          durabilityMindset: 50, resilience: 40, confidenceVolatility: 60,
          chipOnShoulder: 50,
        },
      });
      const safe = makePlayer({ id: playerId('safe'), position: 'RB' });
      const team = makeTeam({ roster: [risky.id, safe.id] });

      const evaluations = [
        { playerId: risky.id, campScore: 70, schemeFitScore: 60, notes: [] },
        { playerId: safe.id, campScore: 70, schemeFitScore: 60, notes: [] },
      ];

      const result = generateCutRecommendations(team, evaluations, [risky, safe], 'auto', createLCG(42));
      const recs = result.decision ?? result.staffSuggestion ?? [];
      const riskyRec = recs.find((r) => r.playerId === risky.id);
      const safeRec = recs.find((r) => r.playerId === safe.id);
      expect(riskyRec!.priority).toBeGreaterThan(safeRec!.priority);
    });

    it('recommends rookies with high potential but low IQ for practice squad', () => {
      const rawRookie = makePlayer({
        id: playerId('raw'),
        position: 'DE',
        experience: 0,
        age: 22,
        personality: {
          leadership: 30, workEthic: 70, ego: 40,
          coachability: 65, competitiveness: 70, composure: 50, loyalty: 50,
          greed: 30, legacyDrive: 40, fameSeeking: 20, familyOriented: 50,
          teamChemistryEffect: 50, prankster: 30, loner: 20,
          mentorWillingness: 20, respectForVeterans: 60, aggression: 65,
          discipline: 50, motorEffort: 70, footballIQ: 40, filmStudyDedication: 45,
          offFieldRisk: 20, mediaHandling: 'shy' as const, communityEngagement: 30,
          durabilityMindset: 60, resilience: 55, confidenceVolatility: 40,
          chipOnShoulder: 60,
        },
        hidden: {
          trueOverall: 68, injuryProneness: 20, clutchFactor: 55,
          consistencyVariance: 15, ceilingFloor: [60, 82],
          footballCharacter: 70, schemeVersatility: 50,
        },
      });
      const team = makeTeam({ roster: [rawRookie.id] });
      const evaluations = [
        { playerId: rawRookie.id, campScore: 55, schemeFitScore: 50, notes: [] },
      ];

      const result = generateCutRecommendations(team, evaluations, [rawRookie], 'auto', createLCG(42));
      const recs = result.decision ?? result.staffSuggestion ?? [];
      const rec = recs.find((r) => r.playerId === rawRookie.id);
      expect(rec!.destination).toBe('practice_squad');
    });

    it('delegation mode auto returns autoApplied=true', () => {
      const p = makePlayer({ id: playerId('x') });
      const team = makeTeam({ roster: [p.id] });
      const evaluations = [{ playerId: p.id, campScore: 50, schemeFitScore: 50, notes: [] }];

      const result = generateCutRecommendations(team, evaluations, [p], 'auto', createLCG(1));
      expect(result.autoApplied).toBe(true);
    });
  });
});
