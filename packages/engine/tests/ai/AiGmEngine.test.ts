import { describe, it, expect } from 'vitest';
import { AiGmEngine } from '../../src/ai/AiGmEngine.js';
import { GM_ARCHETYPES } from '../../src/ai/archetypes.js';
import type {
  League,
  Team,
  Player,
  Coach,
  DraftProspect,
  LeagueSettings,
  DepthChart,
} from '../../src/types/index.js';
import type { Position } from '../../src/types/player.js';

const POSITIONS: Position[] = [
  'QB', 'RB', 'FB', 'WR', 'TE',
  'LT', 'LG', 'C', 'RG', 'RT',
  'DE', 'DT', 'NT', 'OLB', 'ILB', 'MLB',
  'CB', 'FS', 'SS',
  'K', 'P', 'LS',
];

function buildDepthChart(starter: string): DepthChart {
  const chart: Record<Position, string[]> = {} as any;
  for (const pos of POSITIONS) {
    chart[pos] = pos === 'QB' ? [starter] : [];
  }
  return chart as DepthChart;
}

function leagueSettings(): LeagueSettings {
  return {
    salaryCap: 255_000_000,
    salaryFloor: 216_750_000,
    rosterSize: 53,
    practiceSquadSize: 16,
    preseasonGames: 3,
    regularSeasonGames: 17,
    playoffTeams: 14,
    tradeDeadlineWeek: 9,
    draftRounds: 7,
    maxCompPicks: 4,
    advanceMode: 'manual',
    advanceDeadlineHours: 24,
  };
}

function dummyPlayer(id: string, teamId: string | null, overall = 75): Player {
  return {
    id,
    firstName: 'Test',
    lastName: id,
    age: 25,
    position: 'QB',
    secondaryPositions: [],
    teamId,
    jerseyNumber: 1,
    experience: 3,
    college: 'Test',
    draftYear: 1,
    draftRound: 1,
    draftPick: 1,
    physical: {
      speed: 70, acceleration: 70, strength: 70, agility: 70,
      jumping: 70, stamina: 70, toughness: 70,
    },
    personality: {
      leadership: 60, workEthic: 60, ego: 40, coachability: 60,
      competitiveness: 60, composure: 60, loyalty: 60,
      greed: 40, legacyDrive: 50, fameSeeking: 40, familyOriented: 60,
      teamChemistryEffect: 60, prankster: 20, loner: 20, mentorWillingness: 60,
      respectForVeterans: 60, aggression: 50, discipline: 60, motorEffort: 60,
      footballIQ: 60, filmStudyDedication: 60, offFieldRisk: 20,
      mediaHandling: 'professional', communityEngagement: 50,
      durabilityMindset: 60, resilience: 60, confidenceVolatility: 40,
      chipOnShoulder: 40,
    },
    hidden: {
      trueOverall: overall,
      injuryProneness: 40,
      clutchFactor: 50,
      consistencyVariance: 20,
      ceilingFloor: [70, 90],
      footballCharacter: 60,
      schemeVersatility: 60,
    },
    contract: null,
    injuryStatus: null,
    careerStats: {},
    seasonStats: {},
  };
}

function dummyProspect(id: string, overall = 70): DraftProspect {
  return {
    id,
    firstName: 'Draft',
    lastName: id,
    age: 22,
    position: 'QB',
    college: 'State',
    scoutingReport: {
      gradeRange: [5.5, 7.0],
      overallGrade: 7.0,
      scoutingInvestment: 50,
      confidenceLevel: 70,
      summary: 'Solid prospect',
      strengths: [],
      weaknesses: [],
      rawAbilityNotes: null,
      productionNotes: null,
      schemeFitGrades: [{ scheme: 'pro_style', fitGrade: 6.5 }],
      characterFlags: [],
      comparison: null,
      medicalNotes: null,
    },
    hidden: {
      trueOverall: overall,
      injuryProneness: 30,
      clutchFactor: 50,
      consistencyVariance: 20,
      ceilingFloor: [65, 88],
      footballCharacter: 60,
      schemeVersatility: 60,
    },
    physical: {
      speed: 70, acceleration: 70, strength: 65, agility: 70,
      jumping: 65, stamina: 70, toughness: 70,
    },
    personality: dummyPlayer('tmp', null).personality,
    passing: { throwPower: 75, shortAccuracy: 72, mediumAccuracy: 70, deepAccuracy: 68, throwOnRun: 70, playAction: 70 },
    rushing: undefined,
    receiving: undefined,
    blocking: undefined,
    defense: undefined,
    kicking: undefined,
    punting: undefined,
  };
}

function baseTeam(id: string, record: { wins: number; losses: number }): Team {
  const player = dummyPlayer(`${id}-QB`, id);
  return {
    id,
    city: 'Test',
    name: `Team ${id}`,
    abbreviation: id,
    conference: 'AFC',
    division: 'AFC East',
    stadium: 'Test Field',
    owner: {
      name: 'Owner',
      patience: 50,
      spendingWillingness: 50,
      mediaProfile: 'quiet',
      priorities: ['winning'],
    },
    roster: [player.id],
    practiceSquad: [],
    injuredReserve: [],
    coachingStaff: [],
    headCoachId: null,
    depthChart: buildDepthChart(player.id),
    record: { ...record, ties: 0, pointsFor: 0, pointsAgainst: 0, divisionWins: 0, divisionLosses: 0, conferenceWins: 0, conferenceLosses: 0, streak: { type: 'W', count: 0 } },
    analyticsLevel: 1,
    scoutingBudget: 5_000_000,
    facilitiesLevel: 3,
    delegationSettings: {
      practiceSquad: 'manual',
      waiverClaims: 'manual',
      trainingCampCuts: 'manual',
      injuredReserve: 'manual',
      contractNegotiations: 'manual',
      scoutingAssignments: 'manual',
      tradeEvaluation: 'manual',
      draftBoard: 'manual',
      freeAgencyTargets: 'manual',
    },
  };
}

function makeLeague(team: Team, extras?: Partial<League>): League {
  const league: League = {
    id: 'lg',
    name: 'Test League',
    season: 1,
    week: 1,
    phase: 'offseason_start',
    teams: [team],
    players: [dummyPlayer('FA1', null, 80), ...team.roster.map((id) => dummyPlayer(id, team.id))],
    coaches: [],
    contracts: [],
    draftPicks: [],
    draftProspects: [dummyProspect('P1', 75)],
    settings: leagueSettings(),
    schedule: [],
    standings: [],
    history: [],
    awards: [],
    salaryCap: 255_000_000,
    salaryFloor: 216_750_000,
    seed: 42,
    ...(extras ?? {}),
  };
  return league;
}

describe('GM archetypes', () => {
  it('defines five distinct archetypes', () => {
    const names = Object.keys(GM_ARCHETYPES);
    expect(names).toHaveLength(5);
    const weightSums = Object.values(GM_ARCHETYPES).map((a) =>
      Object.values(a.weights).reduce((sum, v) => sum + v, 0),
    );
    expect(new Set(weightSums).size).toBeGreaterThan(1);
  });
});

describe('AiGmEngine', () => {
  it('classifies team mode based on record and archetype thresholds', () => {
    const winningTeam = baseTeam('T1', { wins: 12, losses: 3 });
    const league = makeLeague(winningTeam);
    const engine = new AiGmEngine(league);
    const ctx = engine.evaluateTeamState('T1');
    expect(ctx.mode).toBe('dynasty');

    const losingTeam = baseTeam('T2', { wins: 2, losses: 15 });
    const losingLeague = makeLeague(losingTeam, { seed: 99 });
    const losingEngine = new AiGmEngine(losingLeague);
    const losingCtx = losingEngine.evaluateTeamState('T2');
    expect(losingCtx.mode).toBe('rebuild');
  });

  it('prefers drafting for strategic_rebuilder archetype when prospects exist', () => {
    const team = baseTeam('T3', { wins: 4, losses: 13 });
    const league = makeLeague(team, {
      seed: 7, // deterministic seed
      players: [dummyPlayer('TEAM3-QB', 'T3')],
      coaches: [],
      draftProspects: [dummyProspect('DP1', 78)],
    });
    const engine = new AiGmEngine(league);
    const ctx = engine.evaluateTeamState('T3');
    expect(ctx.archetype.name).toBeDefined();

    const action = engine.decideAction(ctx);
    expect(action.kind).toBe('draft_player');
    if (action.kind === 'draft_player') {
      expect(action.playerId).toBeDefined();
    }
  });

  it('prefers free agency for aggressive_dealmaker when no draft data exists', () => {
    const team = baseTeam('T4', { wins: 8, losses: 9 });
    const league = makeLeague(team, {
      draftProspects: [],
      players: [dummyPlayer('FA1', null, 88), dummyPlayer('T4-QB', 'T4')],
      coaches: [],
      seed: 11,
    });
    const engine = new AiGmEngine(league);
    const ctx = engine.evaluateTeamState('T4');
    const action = engine.decideAction(ctx);
    expect(action.kind).toBe('sign_free_agent');
  });
});
