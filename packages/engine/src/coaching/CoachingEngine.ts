/**
 * Coaching engine for Viridian Football.
 * Implements ICoachingEngine: scheme fit, coaching trees, performance evaluation,
 * and candidate pool generation.
 */

import type { EventBus } from '../events/EventBus.js';
import type { GameEventMap } from '../events/GameEvents.js';
import type {
  Coach, CoachRole, CoachAttributes, CoachPersonality,
  ICoachingEngine, SchemeFitResult, CoachingTreeNode,
  OffensiveScheme, DefensiveScheme,
} from '../types/coach.js';
import type { Player, Position } from '../types/player.js';
import type { CoachId } from '../types/ids.js';
import type { RNG } from '../sim/RNG.js';
import { randomInt, clamp, weightedChoice, chance } from '../sim/RNG.js';
import { coachId } from '../types/ids.js';
import { offensiveSchemeMappings, defensiveSchemeMappings } from './schemeFitMappings.js';
import type { AttributeWeight } from './schemeFitMappings.js';
import {
  OFFENSIVE_SCHEMES, DEFENSIVE_SCHEMES,
  FIRST_NAMES, LAST_NAMES,
} from '../league/teamData.js';

const OFFENSIVE_POSITIONS = new Set<Position>([
  'QB', 'RB', 'FB', 'WR', 'TE', 'LT', 'LG', 'C', 'RG', 'RT',
]);

const OFFENSIVE_COACH_ROLES = new Set<CoachRole>([
  'HC', 'OC', 'QB_COACH', 'RB_COACH', 'WR_COACH', 'OL_COACH',
]);

function getPlayerRatingGroup(player: Player, group: AttributeWeight['ratingGroup']): Record<string, number> | undefined {
  switch (group) {
    case 'physical': return player.physical as unknown as Record<string, number>;
    case 'passing': return player.passing as unknown as Record<string, number> | undefined;
    case 'rushing': return player.rushing as unknown as Record<string, number> | undefined;
    case 'receiving': return player.receiving as unknown as Record<string, number> | undefined;
    case 'blocking': return player.blocking as unknown as Record<string, number> | undefined;
    case 'defense': return player.defense as unknown as Record<string, number> | undefined;
    default: return undefined;
  }
}

export class CoachingEngine implements ICoachingEngine {
  private coachMap: Map<string, Coach>;
  private playerMap: Map<string, Player>;
  private bus: EventBus<GameEventMap>;
  private rng: RNG;

  constructor(
    coaches: Coach[],
    players: Player[],
    bus: EventBus<GameEventMap>,
    rng: RNG,
  ) {
    this.coachMap = new Map(coaches.map(c => [c.id as string, c]));
    this.playerMap = new Map(players.map(p => [p.id as string, p]));
    this.bus = bus;
    this.rng = rng;
  }

  calculateSchemeFit(playerId: string, coachId: string): SchemeFitResult {
    const player = this.playerMap.get(playerId);
    const coach = this.coachMap.get(coachId);
    if (!player || !coach) {
      return {
        playerId, coachId, fitScore: 50, keyAttributes: [], performanceMultiplier: 1.0,
      };
    }

    const isOffensivePlayer = OFFENSIVE_POSITIONS.has(player.position);
    const scheme = isOffensivePlayer ? coach.offensiveScheme : coach.defensiveScheme;

    if (!scheme) {
      return {
        playerId, coachId, fitScore: 50, keyAttributes: [], performanceMultiplier: 1.0,
      };
    }

    const mappings = isOffensivePlayer
      ? offensiveSchemeMappings[scheme as OffensiveScheme]
      : defensiveSchemeMappings[scheme as DefensiveScheme];

    const weights: AttributeWeight[] | undefined = mappings?.[player.position];
    if (!weights || weights.length === 0) {
      return {
        playerId, coachId, fitScore: 50, keyAttributes: [], performanceMultiplier: 1.0,
      };
    }

    let totalWeight = 0;
    let weightedSum = 0;
    const attributeScores: { attribute: string; weight: number; value: number }[] = [];

    for (const w of weights) {
      const group = getPlayerRatingGroup(player, w.ratingGroup);
      if (!group) continue;
      const value = (group as Record<string, number>)[w.attribute];
      if (value === undefined) continue;

      totalWeight += w.weight;
      weightedSum += value * w.weight;
      attributeScores.push({ attribute: w.attribute, weight: w.weight, value });
    }

    const fitScore = totalWeight > 0
      ? clamp(Math.round(weightedSum / totalWeight), 0, 100)
      : 50;

    attributeScores.sort((a, b) => b.weight - a.weight);
    const keyAttributes = attributeScores.slice(0, 4).map(a => a.attribute);

    const performanceMultiplier = parseFloat(
      (0.85 + (fitScore / 100) * 0.30).toFixed(4),
    );

    return { playerId, coachId, fitScore, keyAttributes, performanceMultiplier };
  }

  getCoachingTree(targetCoachId: CoachId): CoachingTreeNode {
    const coach = this.coachMap.get(targetCoachId as string);
    if (!coach) {
      return {
        coachId: targetCoachId,
        mentorId: null,
        proteges: [],
        treeBonus: 0,
      };
    }

    const mentorId = coach.coachingTreeOrigin;
    const proteges: CoachId[] = [];
    for (const c of this.coachMap.values()) {
      if ((c.coachingTreeOrigin as string) === (targetCoachId as string)) {
        proteges.push(c.id);
      }
    }

    let treeBonus = 0;
    if (mentorId) {
      const mentor = this.coachMap.get(mentorId as string);
      if (mentor) {
        const totalGames = mentor.record.wins + mentor.record.losses + mentor.record.ties;
        const winPct = totalGames > 0 ? mentor.record.wins / totalGames : 0;
        const champBonus = Math.min(mentor.championships * 3, 9);
        const playoffBonus = Math.min(mentor.playoffAppearances, 6);
        treeBonus = clamp(
          Math.round(winPct * 6 + champBonus + playoffBonus),
          0, 15,
        );
      }
    }

    return { coachId: targetCoachId, mentorId, proteges, treeBonus };
  }

  evaluateCoachPerformance(targetCoachId: CoachId, _season: number): number {
    const coach = this.coachMap.get(targetCoachId as string);
    if (!coach) return 0;

    const totalGames = coach.record.wins + coach.record.losses + coach.record.ties;
    const winPct = totalGames > 0 ? coach.record.wins / totalGames : 0.5;
    const winScore = winPct * 100;

    const devScore = coach.attributes.playerDevelopment;
    const disciplineScore = coach.personality.discipline;
    const adaptScore = coach.attributes.adaptability;

    const composite = (
      winScore * 0.40 +
      devScore * 0.25 +
      disciplineScore * 0.15 +
      adaptScore * 0.20
    );

    return clamp(Math.round(composite), 0, 100);
  }

  generateCandidatePool(role: CoachRole): Coach[] {
    const poolSize = randomInt(this.rng, 8, 12);
    const candidates: Coach[] = [];

    const treeCount = Math.round(poolSize * 0.4);
    const comebackCount = Math.round(poolSize * 0.2);
    const freshCount = poolSize - treeCount - comebackCount;

    const existingCoaches = [...this.coachMap.values()];

    for (let i = 0; i < treeCount; i++) {
      const mentorIndex = randomInt(this.rng, 0, Math.max(0, existingCoaches.length - 1));
      const mentor = existingCoaches[mentorIndex];
      const c = this.generateCoach(role, 'tree', mentor);
      candidates.push(c);
    }

    for (let i = 0; i < comebackCount; i++) {
      const c = this.generateCoach(role, 'comeback');
      candidates.push(c);
    }

    for (let i = 0; i < freshCount; i++) {
      const c = this.generateCoach(role, 'fresh');
      candidates.push(c);
    }

    return candidates;
  }

  private generateCoach(role: CoachRole, origin: 'tree' | 'comeback' | 'fresh', mentor?: Coach): Coach {
    const isOffensiveRole = OFFENSIVE_COACH_ROLES.has(role);
    const isSTC = role === 'STC';

    const offScheme = (isOffensiveRole && !isSTC)
      ? OFFENSIVE_SCHEMES[randomInt(this.rng, 0, OFFENSIVE_SCHEMES.length - 1)]! as OffensiveScheme
      : null;
    const defScheme = (!isOffensiveRole && !isSTC)
      ? DEFENSIVE_SCHEMES[randomInt(this.rng, 0, DEFENSIVE_SCHEMES.length - 1)]! as DefensiveScheme
      : null;

    let age: number;
    let yearsExp: number;
    if (origin === 'comeback') {
      age = randomInt(this.rng, 55, 72);
      yearsExp = randomInt(this.rng, 15, 35);
    } else if (origin === 'tree') {
      age = role === 'HC' ? randomInt(this.rng, 38, 60) : randomInt(this.rng, 30, 50);
      yearsExp = role === 'HC' ? randomInt(this.rng, 5, 25) : randomInt(this.rng, 3, 15);
    } else {
      age = role === 'HC' ? randomInt(this.rng, 35, 55) : randomInt(this.rng, 28, 45);
      yearsExp = role === 'HC' ? randomInt(this.rng, 3, 15) : randomInt(this.rng, 2, 10);
    }

    const attrs: CoachAttributes = {
      gameManagement: randomInt(this.rng, 40, 95),
      playerDevelopment: randomInt(this.rng, 40, 95),
      playCalling: randomInt(this.rng, 40, 95),
      schemeDesign: randomInt(this.rng, 40, 95),
      recruiting: randomInt(this.rng, 40, 95),
      adaptability: randomInt(this.rng, 40, 95),
      talentEvaluation: randomInt(this.rng, 40, 95),
      situationalAwareness: randomInt(this.rng, 40, 95),
    };

    const personality: CoachPersonality = {
      aggressiveness: randomInt(this.rng, 20, 90),
      discipline: randomInt(this.rng, 30, 95),
      motivation: randomInt(this.rng, 40, 95),
      innovation: randomInt(this.rng, 20, 90),
      ego: randomInt(this.rng, 10, 80),
      stubbornness: randomInt(this.rng, 15, 85),
      trustInYouth: randomInt(this.rng, 20, 80),
      mediaPresence: weightedChoice(this.rng, [
        { item: 'quiet' as const, weight: 25 },
        { item: 'professional' as const, weight: 40 },
        { item: 'fiery' as const, weight: 25 },
        { item: 'eccentric' as const, weight: 10 },
      ]),
    };

    const wins = randomInt(this.rng, 0, yearsExp * 10);
    const losses = randomInt(this.rng, 0, yearsExp * 10);

    const tendencies = this.generateDefaultTendencies(personality, offScheme, defScheme);

    return {
      id: coachId(`candidate-${Date.now()}-${randomInt(this.rng, 1000, 9999)}`),
      firstName: FIRST_NAMES[randomInt(this.rng, 0, FIRST_NAMES.length - 1)]!,
      lastName: LAST_NAMES[randomInt(this.rng, 0, LAST_NAMES.length - 1)]!,
      age,
      role,
      teamId: null,
      offensiveScheme: offScheme,
      defensiveScheme: defScheme,
      attributes: attrs,
      personality,
      tendencies,
      coachingTreeOrigin: (origin === 'tree' && mentor) ? mentor.id : null,
      yearsExperience: yearsExp,
      record: { wins, losses, ties: 0 },
      playoffAppearances: randomInt(this.rng, 0, Math.floor(yearsExp / 3)),
      championships: chance(this.rng, origin === 'comeback' ? 0.2 : 0.05) ? randomInt(this.rng, 1, 2) : 0,
      salary: 0,
      contractYearsRemaining: 0,
    };
  }

  // ── Coach-controlled systems (depth chart, game plan) ──────────

  generateDepthChart(_teamId: import('../types/ids.js').TeamId): import('../types/coach.js').CoachDepthChartDecision[] {
    // Full implementation in Phase 2+; this is the interface contract
    return [];
  }

  generateGamePlan(_teamId: import('../types/ids.js').TeamId, _opponentId: import('../types/ids.js').TeamId): import('../types/coach.js').GamePlan {
    // Full implementation in Phase 2+; this is the interface contract
    const coach = [...this.coachMap.values()].find(c => c.teamId === _teamId && c.role === 'HC');
    return {
      coachId: coach?.id ?? coachId('unknown'),
      opponent: _opponentId,
      offensiveEmphasis: [],
      defensiveEmphasis: [],
      keyMatchups: [],
      tempoAdjustment: 'normal',
      riskLevel: 'balanced',
    };
  }

  // ── Private helpers ────────────────────────────────────────────

  private generateDefaultTendencies(
    personality: CoachPersonality,
    offScheme: import('../types/coach.js').OffensiveScheme | null,
    defScheme: import('../types/coach.js').DefensiveScheme | null,
  ): import('../types/coach.js').CoachTendencies {
    let baseRunPass = 50;
    if (offScheme === 'power_run' || offScheme === 'zone_run') baseRunPass = 35;
    else if (offScheme === 'air_raid' || offScheme === 'spread') baseRunPass = 70;

    return {
      runPassRatio: clamp(baseRunPass + randomInt(this.rng, -10, 10), 15, 85),
      earlyDownRunRate: randomInt(this.rng, 30, 65),
      playActionFrequency: offScheme === 'play_action_heavy' ? randomInt(this.rng, 30, 50) : randomInt(this.rng, 10, 30),
      fourthDownAggressiveness: clamp(personality.aggressiveness + randomInt(this.rng, -15, 15), 10, 95),
      redZoneAggression: randomInt(this.rng, 30, 80),
      twoMinuteDrillEfficiency: randomInt(this.rng, 30, 90),
      blitzRate: defScheme === 'aggressive_blitz' ? randomInt(this.rng, 50, 80) : randomInt(this.rng, 15, 50),
      coverageDisguise: defScheme === 'multiple' ? randomInt(this.rng, 60, 90) : randomInt(this.rng, 20, 60),
      rotationPhilosophy: weightedChoice(this.rng, [
        { item: 'bell_cow' as const, weight: 25 },
        { item: 'committee' as const, weight: 45 },
        { item: 'matchup_based' as const, weight: 30 },
      ]),
      rookieLeash: clamp(personality.trustInYouth + randomInt(this.rng, -10, 10), 10, 90),
      veteranLoyalty: clamp(100 - personality.trustInYouth + randomInt(this.rng, -10, 10), 10, 90),
      starterReps: randomInt(this.rng, 60, 90),
      tempoPreference: weightedChoice(this.rng, [
        { item: 'slow' as const, weight: 15 },
        { item: 'balanced' as const, weight: 40 },
        { item: 'uptempo' as const, weight: 30 },
        { item: 'no_huddle' as const, weight: 15 },
      ]),
      formationVariety: clamp(personality.innovation + randomInt(this.rng, -15, 15), 15, 95),
      motionFrequency: randomInt(this.rng, 15, 80),
      preferredPersonnelGroupings: [
        { label: '11', usagePercentage: 40 },
        { label: '12', usagePercentage: 30 },
        { label: '21', usagePercentage: 20 },
        { label: '22', usagePercentage: 10 },
      ],
    };
  }
}
