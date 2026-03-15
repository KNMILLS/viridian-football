/**
 * Procedural league generator for Viridian Football.
 * Creates a complete balanced starting league from a single seed.
 * Same seed always produces the same league (deterministic via RNG).
 */

import { createLCG, randomInt, normalRandom, clamp, shuffle, chance, weightedChoice } from '../sim/RNG.js';
import type { RNG } from '../sim/RNG.js';
import type { Player, PhysicalRatings, PersonalityTraits, HiddenAttributes, Position } from '../types/player.js';
import type { Team, OwnerProfile, DelegationSettings, TeamRecord } from '../types/team.js';
import type { Coach, CoachAttributes, CoachPersonality, CoachRole } from '../types/coach.js';
import type { Contract, ContractYear } from '../types/contract.js';
import type { DraftPick } from '../types/draft.js';
import type { League, LeagueSettings } from '../types/league.js';
import { teamId, playerId, coachId, draftPickId, leagueId, contractId } from '../types/ids.js';
import {
  TEAM_SEEDS, OFFENSIVE_SCHEMES, DEFENSIVE_SCHEMES,
  COLLEGES, FIRST_NAMES, LAST_NAMES, ROSTER_TEMPLATE,
} from './teamData.js';

export interface GeneratedLeague {
  league: League;
  teams: Team[];
  players: Player[];
  coaches: Coach[];
  contracts: Contract[];
  draftPicks: DraftPick[];
}

export function generateLeague(seed: number, name: string = 'Viridian Football League'): GeneratedLeague {
  const rng = createLCG(seed);
  const lid = leagueId(`league-${seed}`);

  const teams = generateTeams(rng, lid);
  const coaches = generateCoaches(rng, lid, teams);
  const { players, contracts } = generatePlayersAndContracts(rng, lid, teams);
  const draftPicks = generateDraftPicks(lid, teams);

  const league: League = {
    id: lid,
    name,
    season: 1,
    week: 0,
    phase: 'offseason_start',
    teams,
    players,
    coaches,
    contracts,
    draftPicks,
    draftProspects: [],
    settings: defaultSettings(),
    schedule: [],
    standings: [],
    history: [],
    awards: [],
    salaryCap: 255_000_000,
    salaryFloor: 216_750_000,
    seed,
  };

  return { league, teams, players, coaches, contracts, draftPicks };
}

function generateTeams(rng: RNG, lid: string): Team[] {
  return TEAM_SEEDS.map((seed, i) => {
    const tid = teamId(`team-${i + 1}`);
    const owner = generateOwnerProfile(rng, seed.ownerName);
    const defaultDelegation: DelegationSettings = {
      depthChart: 'auto',
      practiceSquad: 'auto',
      waiverClaims: 'review',
      trainingCampCuts: 'review',
      contractNegotiations: 'manual',
      scoutingAssignments: 'review',
      tradeEvaluation: 'manual',
      draftBoard: 'manual',
      gameplanAdjustments: 'auto',
    };

    const emptyRecord: TeamRecord = {
      wins: 0, losses: 0, ties: 0,
      pointsFor: 0, pointsAgainst: 0,
      divisionWins: 0, divisionLosses: 0,
      conferenceWins: 0, conferenceLosses: 0,
      streak: { type: 'W', count: 0 },
    };

    return {
      id: tid,
      city: seed.city,
      name: seed.name,
      abbreviation: seed.abbreviation,
      conference: seed.conference,
      division: seed.division,
      stadium: seed.stadium,
      owner,
      roster: [],
      practiceSquad: [],
      injuredReserve: [],
      coachingStaff: [],
      headCoachId: null,
      depthChart: {} as Team['depthChart'],
      record: emptyRecord,
      analyticsLevel: randomInt(rng, 1, 5),
      scoutingBudget: randomInt(rng, 3_000_000, 8_000_000),
      facilitiesLevel: randomInt(rng, 2, 5),
      delegationSettings: defaultDelegation,
    } satisfies Team;
  });
}

function generateOwnerProfile(rng: RNG, name: string): OwnerProfile {
  const priorities: OwnerProfile['priorities'][number][] = ['winning', 'revenue', 'culture', 'entertainment'];
  shuffle(rng, priorities);

  return {
    name,
    patience: randomInt(rng, 20, 90),
    spendingWillingness: randomInt(rng, 30, 95),
    mediaProfile: weightedChoice(rng, [
      { item: 'quiet' as const, weight: 40 },
      { item: 'moderate' as const, weight: 40 },
      { item: 'loud' as const, weight: 20 },
    ]),
    priorities: priorities.slice(0, randomInt(rng, 1, 3)),
  };
}

function generateCoaches(rng: RNG, lid: string, teams: Team[]): Coach[] {
  const coaches: Coach[] = [];
  let coachIndex = 0;

  for (const team of teams) {
    const roles: CoachRole[] = ['HC', 'OC', 'DC', 'STC', 'QB_COACH', 'RB_COACH', 'WR_COACH', 'OL_COACH', 'DL_COACH', 'LB_COACH', 'DB_COACH'];

    for (const role of roles) {
      coachIndex++;
      const cid = coachId(`coach-${coachIndex}`);

      const offScheme = (role === 'HC' || role === 'OC' || role === 'QB_COACH' || role === 'RB_COACH' || role === 'WR_COACH' || role === 'OL_COACH')
        ? OFFENSIVE_SCHEMES[randomInt(rng, 0, OFFENSIVE_SCHEMES.length - 1)]!
        : null;

      const defScheme = (role === 'DC' || role === 'DL_COACH' || role === 'LB_COACH' || role === 'DB_COACH')
        ? DEFENSIVE_SCHEMES[randomInt(rng, 0, DEFENSIVE_SCHEMES.length - 1)]!
        : null;

      const attrs: CoachAttributes = {
        gameManagement: randomInt(rng, 40, 95),
        playerDevelopment: randomInt(rng, 40, 95),
        playCalling: randomInt(rng, 40, 95),
        schemeDesign: randomInt(rng, 40, 95),
        recruiting: randomInt(rng, 40, 95),
        adaptability: randomInt(rng, 40, 95),
      };

      const personality: CoachPersonality = {
        aggressiveness: randomInt(rng, 20, 90),
        discipline: randomInt(rng, 30, 95),
        motivation: randomInt(rng, 40, 95),
        innovation: randomInt(rng, 20, 90),
        ego: randomInt(rng, 10, 80),
        mediaPresence: weightedChoice(rng, [
          { item: 'quiet' as const, weight: 30 },
          { item: 'moderate' as const, weight: 50 },
          { item: 'fiery' as const, weight: 20 },
        ]),
      };

      const yearsExp = role === 'HC' ? randomInt(rng, 5, 30) : randomInt(rng, 2, 20);
      const salary = role === 'HC' ? randomInt(rng, 5_000_000, 15_000_000) :
                     role === 'OC' || role === 'DC' ? randomInt(rng, 2_000_000, 6_000_000) :
                     randomInt(rng, 500_000, 2_000_000);

      const coach: Coach = {
        id: cid,
        firstName: FIRST_NAMES[randomInt(rng, 0, FIRST_NAMES.length - 1)]!,
        lastName: LAST_NAMES[randomInt(rng, 0, LAST_NAMES.length - 1)]!,
        age: role === 'HC' ? randomInt(rng, 40, 70) : randomInt(rng, 30, 60),
        role,
        teamId: team.id,
        offensiveScheme: offScheme,
        defensiveScheme: defScheme,
        attributes: attrs,
        personality,
        coachingTreeOrigin: null,
        yearsExperience: yearsExp,
        record: { wins: randomInt(rng, 0, yearsExp * 10), losses: randomInt(rng, 0, yearsExp * 10), ties: 0 },
        playoffAppearances: randomInt(rng, 0, Math.floor(yearsExp / 3)),
        championships: chance(rng, 0.1) ? randomInt(rng, 1, 2) : 0,
        salary,
        contractYearsRemaining: randomInt(rng, 1, 5),
      };

      coaches.push(coach);
      team.coachingStaff.push(cid);
      if (role === 'HC') team.headCoachId = cid;
    }
  }

  return coaches;
}

function generatePlayersAndContracts(
  rng: RNG,
  lid: string,
  teams: Team[],
): { players: Player[]; contracts: Contract[] } {
  const players: Player[] = [];
  const contracts: Contract[] = [];
  let playerIndex = 0;
  let contractIndex = 0;

  for (const team of teams) {
    const positions = Object.entries(ROSTER_TEMPLATE);

    for (const [pos, count] of positions) {
      for (let j = 0; j < count; j++) {
        playerIndex++;
        const pid = playerId(`player-${playerIndex}`);
        const position = pos as Position;

        const age = generateAge(rng, position, j === 0);
        const experience = Math.max(0, age - randomInt(rng, 21, 23));
        const overallTier = j === 0 ? 'starter' : j === 1 ? 'backup' : 'depth';

        const physical = generatePhysicalRatings(rng, position, overallTier);
        const personality = generatePersonality(rng);
        const hidden = generateHiddenAttributes(rng, overallTier);
        const skillRatings = generateSkillRatings(rng, position, overallTier);

        const player: Player = {
          id: pid,
          firstName: FIRST_NAMES[randomInt(rng, 0, FIRST_NAMES.length - 1)]!,
          lastName: LAST_NAMES[randomInt(rng, 0, LAST_NAMES.length - 1)]!,
          age,
          position,
          secondaryPositions: [],
          teamId: team.id,
          jerseyNumber: randomInt(rng, 1, 99),
          experience,
          college: COLLEGES[randomInt(rng, 0, COLLEGES.length - 1)]!,
          draftYear: experience > 0 ? 1 - experience : null,
          draftRound: experience > 0 ? randomInt(rng, 1, 7) : null,
          draftPick: experience > 0 ? randomInt(rng, 1, 32) : null,
          physical,
          personality,
          hidden,
          ...skillRatings,
          contract: null,
          injuryStatus: null,
          careerStats: {},
          seasonStats: {},
        };

        players.push(player);
        team.roster.push(pid);

        contractIndex++;
        const contract = generateContract(rng, contractIndex, pid, team.id, age, experience, overallTier);
        contracts.push(contract);
        player.contract = {
          contractId: contract.id as string,
          yearsRemaining: contract.years,
          currentYearCapHit: contract.yearDetails[0]?.capHit ?? 0,
          totalValue: contract.totalValue,
        };
      }
    }
  }

  return { players, contracts };
}

function generateAge(rng: RNG, position: Position, isStarter: boolean): number {
  if (position === 'QB' && isStarter) return randomInt(rng, 24, 35);
  if (isStarter) return randomInt(rng, 24, 31);
  return randomInt(rng, 22, 30);
}

function generatePhysicalRatings(rng: RNG, position: Position, tier: string): PhysicalRatings {
  const base = tier === 'starter' ? 75 : tier === 'backup' ? 60 : 50;
  const variance = 15;
  const rating = () => clamp(Math.round(normalRandom(rng, base, variance)), 25, 99);

  const physical: PhysicalRatings = {
    speed: rating(),
    acceleration: rating(),
    strength: rating(),
    agility: rating(),
    jumping: rating(),
    stamina: rating(),
    toughness: rating(),
  };

  if (['WR', 'CB', 'RB', 'FS', 'SS'].includes(position)) {
    physical.speed = clamp(physical.speed + 10, 25, 99);
    physical.agility = clamp(physical.agility + 8, 25, 99);
  }
  if (['DT', 'DE', 'LT', 'LG', 'C', 'RG', 'RT'].includes(position)) {
    physical.strength = clamp(physical.strength + 12, 25, 99);
  }

  return physical;
}

function generatePersonality(rng: RNG): PersonalityTraits {
  return {
    leadership: randomInt(rng, 20, 95),
    workEthic: randomInt(rng, 25, 99),
    ego: randomInt(rng, 10, 90),
    coachability: randomInt(rng, 30, 95),
    competitiveness: randomInt(rng, 40, 99),
    composure: randomInt(rng, 30, 95),
    loyalty: randomInt(rng, 20, 90),
  };
}

function generateHiddenAttributes(rng: RNG, tier: string): HiddenAttributes {
  const baseOverall = tier === 'starter' ? 78 : tier === 'backup' ? 65 : 55;
  const trueOverall = clamp(Math.round(normalRandom(rng, baseOverall, 8)), 30, 99);

  return {
    trueOverall,
    injuryProneness: randomInt(rng, 10, 80),
    clutchFactor: randomInt(rng, 20, 95),
    consistencyVariance: randomInt(rng, 5, 40),
    ceilingFloor: [
      clamp(trueOverall - randomInt(rng, 5, 15), 25, 99),
      clamp(trueOverall + randomInt(rng, 3, 20), 25, 99),
    ],
  };
}

function generateSkillRatings(rng: RNG, position: Position, tier: string): Partial<Player> {
  const base = tier === 'starter' ? 75 : tier === 'backup' ? 62 : 52;
  const v = 12;
  const r = () => clamp(Math.round(normalRandom(rng, base, v)), 25, 99);

  const result: Partial<Player> = {};

  if (['QB'].includes(position)) {
    result.passing = { throwPower: r(), shortAccuracy: r(), mediumAccuracy: r(), deepAccuracy: r(), throwOnRun: r(), playAction: r() };
    result.rushing = { carrying: r(), breakTackle: r(), elusiveness: r(), ballCarrierVision: r(), trucking: r() };
  }
  if (['RB', 'FB'].includes(position)) {
    result.rushing = { carrying: r(), breakTackle: r(), elusiveness: r(), ballCarrierVision: r(), trucking: r() };
    result.receiving = { catching: r(), spectacularCatch: r(), catchInTraffic: r(), routeRunning: r(), release: r() };
    result.blocking = { runBlock: r(), passBlock: r(), impactBlock: r(), awareness: r() };
  }
  if (['WR', 'TE'].includes(position)) {
    result.receiving = { catching: r(), spectacularCatch: r(), catchInTraffic: r(), routeRunning: r(), release: r() };
    result.blocking = { runBlock: r(), passBlock: r(), impactBlock: r(), awareness: r() };
  }
  if (['LT', 'LG', 'C', 'RG', 'RT'].includes(position)) {
    result.blocking = { runBlock: r(), passBlock: r(), impactBlock: r(), awareness: r() };
  }
  if (['DE', 'DT', 'NT', 'OLB', 'ILB', 'MLB'].includes(position)) {
    result.defense = { tackling: r(), hitPower: r(), pursuit: r(), playRecognition: r(), manCoverage: r(), zoneCoverage: r(), press: r(), passRush: r(), blockShedding: r() };
  }
  if (['CB', 'FS', 'SS'].includes(position)) {
    result.defense = { tackling: r(), hitPower: r(), pursuit: r(), playRecognition: r(), manCoverage: r(), zoneCoverage: r(), press: r(), passRush: r(), blockShedding: r() };
  }
  if (position === 'K') {
    result.kicking = { kickPower: r(), kickAccuracy: r() };
  }
  if (position === 'P') {
    result.punting = { puntPower: r(), puntAccuracy: r() };
  }

  return result;
}

function generateContract(
  rng: RNG,
  idx: number,
  pid: string,
  tid: string,
  age: number,
  experience: number,
  tier: string,
): Contract {
  const cid = contractId(`contract-${idx}`);
  const years = tier === 'starter' ? randomInt(rng, 2, 5) :
                experience === 0 ? 4 : randomInt(rng, 1, 3);

  const annualValue = tier === 'starter' ? randomInt(rng, 8_000_000, 45_000_000) :
                      tier === 'backup' ? randomInt(rng, 1_500_000, 8_000_000) :
                      randomInt(rng, 800_000, 3_000_000);

  const totalValue = annualValue * years;
  const guaranteed = Math.round(totalValue * (tier === 'starter' ? 0.55 : 0.3));
  const signingBonus = Math.round(guaranteed * 0.4);
  const prorationPerYear = Math.round(signingBonus / years);

  const yearDetails: ContractYear[] = [];
  for (let y = 1; y <= years; y++) {
    const baseSalary = Math.round(annualValue * (0.8 + (y - 1) * 0.1));
    yearDetails.push({
      year: y,
      season: y,
      baseSalary,
      capHit: baseSalary + prorationPerYear,
      deadMoney: prorationPerYear * (years - y + 1),
      signingBonusProration: prorationPerYear,
      rosterBonus: chance(rng, 0.3) ? randomInt(rng, 500_000, 3_000_000) : 0,
      optionBonus: 0,
      incentives: [],
      isVoidYear: false,
      guaranteed: y <= Math.ceil(years / 2),
      guaranteeType: y === 1 ? 'full' : y <= Math.ceil(years / 2) ? 'injury' : 'none',
    });
  }

  return {
    id: cid,
    playerId: pid as any,
    teamId: tid as any,
    status: 'active',
    totalValue,
    totalGuaranteed: guaranteed,
    years,
    signingBonus,
    yearDetails,
    hasNoTradeClause: tier === 'starter' && chance(rng, 0.15),
    hasNoTagClause: false,
    voidYears: 0,
    signedDate: { season: 0, week: 0 },
  };
}

function generateDraftPicks(lid: string, teams: Team[]): DraftPick[] {
  const picks: DraftPick[] = [];
  let pickIdx = 0;

  for (let round = 1; round <= 7; round++) {
    for (const team of teams) {
      pickIdx++;
      picks.push({
        id: draftPickId(`pick-${pickIdx}`),
        originalTeamId: team.id,
        currentTeamId: team.id,
        season: 1,
        round,
        pickInRound: null,
        overall: null,
        isConditional: false,
        conditions: [],
        resolvedRound: null,
      });
    }
  }

  return picks;
}

function defaultSettings(): LeagueSettings {
  return {
    salaryCap: 255_000_000,
    rosterSize: 53,
    practiceSquadSize: 16,
    preseasonGames: 3,
    regularSeasonGames: 17,
    playoffTeams: 14,
    tradeDeadlineWeek: 9,
    draftRounds: 7,
    maxCompPicks: 4,
    advanceMode: 'manual',
    advanceDeadlineHours: 48,
  };
}
