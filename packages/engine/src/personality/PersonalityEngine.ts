import type { Player, PlayerContractRef, PlayerId } from '../types/index.js';
import type { Team } from '../types/index.js';
import type { RNG } from '../sim/RNG.js';
import type { EventBus } from '../events/EventBus.js';
import type { GameEventMap } from '../events/GameEvents.js';
import { chance, clamp } from '../sim/RNG.js';
import { getPositionGroup } from '../injury/InjuryEngine.js';

// ── Types ──────────────────────────────────────────────────────────

export type HoldoutRisk = {
  probability: number;
  demandedSalary: number;
  severity: 'training_camp' | 'regular_season';
};

export type HoldoutResult = {
  triggered: boolean;
  resolution?: string;
};

export type MentorshipResult = {
  eligible: boolean;
  skillBoost: number;
};

export type LockerRoomResult = {
  severity: 'none' | 'minor' | 'moderate' | 'major';
  moraleImpact: number;
  instigatorIds: PlayerId[];
};

export type MoraleEvent =
  | { type: 'win' }
  | { type: 'loss' }
  | { type: 'cut'; wasCloseFriend: boolean }
  | { type: 'traded'; wasCloseFriend: boolean }
  | { type: 'holdout_unresolved' }
  | { type: 'coach_motivation'; rating: number };

export type RecentEvents = {
  losses: number;
  cuts: PlayerId[];
  trades: PlayerId[];
};

// ── Core Functions ─────────────────────────────────────────────────

/**
 * Evaluate the probability that a player initiates a holdout.
 * Pure deterministic assessment — no RNG.
 */
export function evaluateHoldoutRisk(
  player: Player,
  contract: PlayerContractRef | null,
  recentPerformance: { breakout: boolean },
  positionAverageSalary: number,
): HoldoutRisk {
  if (!contract) {
    return { probability: 0, demandedSalary: 0, severity: 'training_camp' };
  }

  // Ego contribution: 0-99 scaled to 0-0.4
  const egoFactor = (player.personality.ego / 99) * 0.4;

  // Underpaid ratio: how much less they make vs market average
  const underpaidRatio = positionAverageSalary > 0
    ? Math.max(0, 1 - contract.currentYearCapHit / positionAverageSalary)
    : 0;
  const underpaidFactor = underpaidRatio * 0.3;

  // Breakout season bonus
  const breakoutFactor = recentPerformance.breakout ? 0.15 : 0;

  // Fewer years remaining = higher risk (1 year = +0.1, 2 = +0.05, 3+ = 0)
  const yearsFactor = contract.yearsRemaining <= 1
    ? 0.1
    : contract.yearsRemaining <= 2 ? 0.05 : 0;

  // Loyalty dampens holdout risk
  const loyaltyDampener = 1 - (player.personality.loyalty / 99) * 0.3;

  const probability = clamp(
    (egoFactor + underpaidFactor + breakoutFactor + yearsFactor) * loyaltyDampener,
    0,
    0.95,
  );

  const demandedSalary = positionAverageSalary * (1 + player.personality.ego / 200);

  const severity: 'training_camp' | 'regular_season' =
    player.personality.ego > 85 && contract.yearsRemaining <= 1
      ? 'regular_season'
      : 'training_camp';

  return { probability, demandedSalary, severity };
}

/**
 * Roll against holdout probability. If triggered, emits HOLDOUT_INITIATED.
 */
export function processHoldout(
  player: Player,
  risk: HoldoutRisk,
  rng: RNG,
  bus?: EventBus<GameEventMap>,
): HoldoutResult {
  if (risk.probability <= 0 || !chance(rng, risk.probability)) {
    return { triggered: false };
  }

  bus?.emit('HOLDOUT_INITIATED', {
    playerId: player.id,
    teamId: player.teamId!,
    demandedSalary: risk.demandedSalary,
    currentSalary: player.contract?.currentYearCapHit ?? 0,
    egoLevel: player.personality.ego,
  });

  return { triggered: true };
}

/**
 * Evaluate whether a mentorship pairing is eligible and compute skill boost.
 */
export function evaluateMentorship(
  mentor: Player,
  mentee: Player,
  bus?: EventBus<GameEventMap>,
): MentorshipResult {
  const mentorGroup = getPositionGroup(mentor.position);
  const menteeGroup = getPositionGroup(mentee.position);

  const eligible =
    mentor.experience >= 5 &&
    mentor.personality.leadership >= 70 &&
    mentee.personality.coachability >= 50 &&
    mentorGroup === menteeGroup &&
    mentor.teamId != null &&
    mentor.teamId === mentee.teamId;

  if (!eligible) {
    return { eligible: false, skillBoost: 0 };
  }

  const rawBoost = (mentor.personality.leadership * mentee.personality.coachability) / 10000 * 5;
  const skillBoost = clamp(Math.floor(rawBoost) || 1, 1, 5);

  bus?.emit('MENTORSHIP_EFFECT', {
    mentorId: mentor.id,
    menteeId: mentee.id,
    teamId: mentor.teamId!,
    skillBoost,
  });

  return { eligible: true, skillBoost };
}

/**
 * Check for locker room issues caused by high-ego players on struggling teams.
 */
export function checkLockerRoomIssues(
  team: Team,
  players: Player[],
  recentEvents: RecentEvents,
  bus?: EventBus<GameEventMap>,
): LockerRoomResult {
  const teamPlayers = players.filter((p) => p.teamId === team.id);

  // High-ego instigators
  const highEgoPlayers = teamPlayers
    .filter((p) => p.personality.ego > 75)
    .sort((a, b) => b.personality.ego - a.personality.ego);

  // Popular players who were cut/traded (leadership > 70)
  const cutPopular = recentEvents.cuts.filter((pid) =>
    players.find((p) => p.id === pid && p.personality.leadership > 70),
  );
  const tradedPopular = recentEvents.trades.filter((pid) =>
    players.find((p) => p.id === pid && p.personality.leadership > 70),
  );

  let issueCount = highEgoPlayers.length;
  issueCount += cutPopular.length;
  issueCount += tradedPopular.length;

  // Losing compounds issues
  if (recentEvents.losses >= 5) issueCount += 1;
  if (recentEvents.losses >= 8) issueCount += 1;

  if (issueCount === 0) {
    return { severity: 'none', moraleImpact: 0, instigatorIds: [] };
  }

  const severity: 'minor' | 'moderate' | 'major' =
    issueCount === 1 ? 'minor' : issueCount === 2 ? 'moderate' : 'major';

  const moraleImpact = severity === 'minor' ? -3 : severity === 'moderate' ? -7 : -12;

  const instigatorIds = highEgoPlayers.map((p) => p.id);

  if (instigatorIds.length > 0) {
    bus?.emit('LOCKER_ROOM_ISSUE', {
      teamId: team.id,
      instigatorId: instigatorIds[0]!,
      severity,
      moraleImpact,
    });
  }

  return { severity, moraleImpact, instigatorIds };
}

/**
 * Update a player's morale based on accumulated events.
 * Pure function — no bus needed.
 */
export function updateMorale(currentMorale: number | undefined, events: MoraleEvent[]): number {
  let morale = currentMorale ?? 60;

  for (const event of events) {
    switch (event.type) {
      case 'win':
        morale += 2;
        break;
      case 'loss':
        morale -= 2;
        break;
      case 'cut':
        morale -= event.wasCloseFriend ? 5 : 15;
        break;
      case 'traded':
        morale -= event.wasCloseFriend ? 5 : 15;
        break;
      case 'holdout_unresolved':
        morale -= 10;
        break;
      case 'coach_motivation':
        morale += event.rating / 100;
        break;
    }
  }

  return clamp(Math.round(morale * 100) / 100, 0, 100);
}
