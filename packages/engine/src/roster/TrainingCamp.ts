import type {
  Team, Player, Coach, PlayerId, Position, DelegationMode,
} from '../types/index.js';
import type { EventBus } from '../events/EventBus.js';
import type { GameEventMap } from '../events/GameEvents.js';
import type { RNG } from '../sim/RNG.js';
import { normalRandom, clamp } from '../sim/RNG.js';
import { delegateToStaff, type DelegationResult } from '../delegation/DelegationEngine.js';
import { MAX_ACTIVE_ROSTER } from './constants.js';

// ── Types ──────────────────────────────────────────────────────────

export interface PlayerEvaluation {
  playerId: PlayerId;
  campScore: number;
  schemeFitScore: number;
  notes: string[];
}

export interface PositionBattle {
  position: Position;
  rankedPlayers: PlayerId[];
  isContested: boolean;
}

export interface TrainingCampResult {
  evaluations: PlayerEvaluation[];
  positionBattles: PositionBattle[];
}

export interface CutRecommendation {
  playerId: PlayerId;
  reason: string;
  priority: number;
  destination: 'release' | 'practice_squad' | 'trade_block';
}

// ── Training Camp Simulation ───────────────────────────────────────

/**
 * Simulate training camp for a team's full 90-man roster.
 *
 * Each player receives a camp score based on:
 *  - True overall ability
 *  - Football IQ (especially penalises raw rookies)
 *  - Scheme fit (simplified: scheme versatility as proxy)
 *  - Coach tendency modifiers (rookieLeash / veteranLoyalty)
 *  - Random camp performance variance
 *
 * Side effects: veterans who lose position battles with high ego
 * may trigger HOLDOUT_INITIATED or LOCKER_ROOM_ISSUE events.
 */
export function simulateTrainingCamp(
  team: Team,
  players: Player[],
  coaches: Coach[],
  rng: RNG,
  bus?: EventBus<GameEventMap>,
): TrainingCampResult {
  const headCoach = coaches.find((c) => c.id === team.headCoachId);
  const rookieLeash = headCoach?.tendencies.rookieLeash ?? 50;
  const veteranLoyalty = headCoach?.tendencies.veteranLoyalty ?? 50;

  const teamPlayers = players.filter(
    (p) => team.roster.includes(p.id) || team.practiceSquad.includes(p.id),
  );

  const evaluations: PlayerEvaluation[] = teamPlayers.map((player) => {
    const baseScore = player.hidden.trueOverall;
    const iqModifier = (player.personality.footballIQ - 50) / 50 * 5;
    const schemeFit = player.hidden.schemeVersatility;
    const schemeFitModifier = (schemeFit - 50) / 50 * 5;

    let experienceModifier = 0;
    if (player.experience <= 1) {
      experienceModifier = -(100 - rookieLeash) / 100 * 5;
    } else if (player.experience >= 8) {
      experienceModifier = (veteranLoyalty - 50) / 100 * 3;
    }

    const campVariance = normalRandom(rng, 0, 3);

    const campScore = clamp(
      baseScore + iqModifier + schemeFitModifier + experienceModifier + campVariance,
      0,
      99,
    );

    const notes: string[] = [];
    if (player.experience <= 1 && player.personality.footballIQ < 50) {
      notes.push('Raw rookie — may need developmental time');
    }
    if (schemeFit < 40) {
      notes.push('Poor scheme fit');
    }
    if (player.personality.offFieldRisk > 70) {
      notes.push('Off-field concerns');
    }

    return {
      playerId: player.id,
      campScore: Math.round(campScore * 10) / 10,
      schemeFitScore: schemeFit,
      notes,
    };
  });

  // Build position battles
  const positionGroups = new Map<Position, PlayerEvaluation[]>();
  for (const ev of evaluations) {
    const player = teamPlayers.find((p) => p.id === ev.playerId);
    if (!player) continue;
    const pos = player.position;
    if (!positionGroups.has(pos)) positionGroups.set(pos, []);
    positionGroups.get(pos)!.push(ev);
  }

  const positionBattles: PositionBattle[] = [];
  for (const [pos, group] of positionGroups) {
    const sorted = [...group].sort((a, b) => b.campScore - a.campScore);
    const isContested =
      sorted.length >= 2 && Math.abs(sorted[0]!.campScore - sorted[1]!.campScore) < 3;

    positionBattles.push({
      position: pos,
      rankedPlayers: sorted.map((e) => e.playerId),
      isContested,
    });

    // Veterans losing battles may cause issues
    if (sorted.length >= 2 && bus) {
      for (let i = 1; i < sorted.length; i++) {
        const loser = teamPlayers.find((p) => p.id === sorted[i]!.playerId);
        if (!loser) continue;
        if (loser.experience >= 5 && loser.personality.ego > 75) {
          if (loser.personality.ego > 85 && loser.contract) {
            bus.emit('HOLDOUT_INITIATED', {
              playerId: loser.id,
              teamId: team.id,
              demandedSalary: loser.contract.currentYearCapHit * 1.5,
              currentSalary: loser.contract.currentYearCapHit,
              egoLevel: loser.personality.ego,
            });
          } else {
            bus.emit('LOCKER_ROOM_ISSUE', {
              teamId: team.id,
              instigatorId: loser.id,
              severity: loser.personality.ego > 85 ? 'moderate' : 'minor',
              moraleImpact: loser.personality.ego > 85 ? -7 : -3,
            });
          }
        }
      }
    }
  }

  return { evaluations, positionBattles };
}

// ── Cut Recommendations ────────────────────────────────────────────

/**
 * Generate recommendations for which players to cut from training camp roster
 * down to the 53-man limit.
 *
 * Factors: camp score, age, salary, off-field risk, scheme fit.
 * Young players with high ceilings are recommended for PS stash.
 */
export function generateCutRecommendations(
  team: Team,
  evaluations: PlayerEvaluation[],
  players: Player[],
  delegationMode: DelegationMode,
  rng: RNG,
): DelegationResult<CutRecommendation[]> {
  const teamPlayerIds = new Set([...team.roster, ...team.practiceSquad]);
  const teamEvals = evaluations.filter((e) => teamPlayerIds.has(e.playerId));

  const scored = teamEvals.map((ev) => {
    const player = players.find((p) => p.id === ev.playerId);
    if (!player) return { ...ev, cutPriority: 0, reason: 'Unknown', destination: 'release' as const };

    let cutScore = 100 - ev.campScore;

    // Age penalty: older players get cut priority bump
    if (player.age >= 32) cutScore += 5;
    if (player.age >= 35) cutScore += 5;

    // Salary: expensive players with low performance
    if (player.contract && player.contract.currentYearCapHit > 5_000_000 && ev.campScore < 60) {
      cutScore += 3;
    }

    // Off-field risk
    if (player.personality.offFieldRisk > 70) cutScore += 4;

    // Poor scheme fit
    if (ev.schemeFitScore < 40) cutScore += 3;

    let destination: 'release' | 'practice_squad' | 'trade_block' = 'release';
    let reason = 'Below roster cutline';

    if (player.experience <= 2 && player.hidden.trueOverall >= 65 && player.personality.footballIQ < 55) {
      destination = 'practice_squad';
      reason = 'Developmental prospect — stash on practice squad';
    } else if (player.contract && player.contract.currentYearCapHit > 8_000_000 && ev.campScore >= 55) {
      destination = 'trade_block';
      reason = 'Tradeable asset — explore trade before cutting';
    }

    return { playerId: ev.playerId, cutPriority: cutScore, reason, destination };
  });

  scored.sort((a, b) => b.cutPriority - a.cutPriority);

  const totalOnRoster = team.roster.length + team.practiceSquad.length;
  const cutsNeeded = Math.max(0, totalOnRoster - MAX_ACTIVE_ROSTER);

  const recommendations: CutRecommendation[] = scored
    .slice(0, Math.max(cutsNeeded, scored.length))
    .map((s) => ({
      playerId: s.playerId,
      reason: s.reason,
      priority: s.cutPriority,
      destination: s.destination,
    }));

  return delegateToStaff(
    delegationMode,
    () => recommendations,
  );
}
