import type { Player, InjuryStatus, Position, PositionGroup } from '../types/index.js';
import type { LeagueWeek } from '../types/index.js';
import type { RNG } from '../sim/RNG.js';
import type { EventBus } from '../events/EventBus.js';
import type { GameEventMap } from '../events/GameEvents.js';
import { chance, weightedChoice, randomInt, clamp } from '../sim/RNG.js';
import {
  BASE_INJURY_RATES,
  SEVERITY_WEIGHTS,
  SEVERITY_WEEKS,
  POSITION_BODY_PARTS,
  BODY_PART_INJURY_NAMES,
  RECURRING_PENALTY_MULTIPLIER,
  type InjurySeverity,
  type BodyPart,
} from './injuryTables.js';

// ── Types ──────────────────────────────────────────────────────────

export type GameContext = {
  week: LeagueWeek;
  fatigueLevel?: number;
};

export type RecoveryResult = {
  recovered: boolean;
  updatedStatus: InjuryStatus | null;
  worsened: boolean;
};

export type InjuryHistory = {
  bodyPart: string;
  season: number;
};

// ── Helpers ────────────────────────────────────────────────────────

const POSITION_GROUP_MAP: Record<Position, PositionGroup> = {
  QB: 'QB',
  RB: 'RB', FB: 'RB',
  WR: 'WR',
  TE: 'TE',
  LT: 'OL', LG: 'OL', C: 'OL', RG: 'OL', RT: 'OL',
  DE: 'DL', DT: 'DL', NT: 'DL',
  OLB: 'LB', ILB: 'LB', MLB: 'LB',
  CB: 'DB', FS: 'DB', SS: 'DB',
  K: 'K',
  P: 'P',
  LS: 'ST',
};

export function getPositionGroup(position: Position): PositionGroup {
  return POSITION_GROUP_MAP[position];
}

// ── Core Functions ─────────────────────────────────────────────────

export function rollForInjury(
  player: Player,
  gameContext: GameContext,
  rng: RNG,
  injuryHistory?: InjuryHistory[],
  bus?: EventBus<GameEventMap>,
): InjuryStatus | null {
  const posGroup = getPositionGroup(player.position);
  const baseRate = BASE_INJURY_RATES[posGroup];

  // injuryProneness 0-99 → multiplier 0.5 to 1.5
  const pronenessMod = 0.5 + (player.hidden.injuryProneness / 99);
  // toughness 0-99 → multiplier 1.2 (low) to 0.7 (high)
  const toughnessMod = 1.2 - (player.physical.toughness / 99) * 0.5;
  // low stamina increases risk
  const staminaMod = 1.0 + (1.0 - player.physical.stamina / 99) * 0.3;
  // age factor: +2% per year over 30
  const ageMod = player.age > 30 ? 1.0 + (player.age - 30) * 0.02 : 1.0;
  // fatigue factor from game context
  const fatigueMod = gameContext.fatigueLevel != null
    ? 1.0 + gameContext.fatigueLevel * 0.2
    : 1.0;

  const adjustedRate = baseRate * pronenessMod * toughnessMod * staminaMod * ageMod * fatigueMod;

  if (!chance(rng, adjustedRate)) {
    return null;
  }

  const severity = weightedChoice(rng, SEVERITY_WEIGHTS);
  const bodyPart = weightedChoice(rng, POSITION_BODY_PARTS[posGroup]);
  const injuryNames = BODY_PART_INJURY_NAMES[bodyPart];
  const injuryName = injuryNames[randomInt(rng, 0, injuryNames.length - 1)]!;

  const [minWeeks, maxWeeks] = SEVERITY_WEEKS[severity];
  let weeksOut = randomInt(rng, minWeeks, maxWeeks);

  const isRecurring = injuryHistory?.some(
    (h) => h.bodyPart === bodyPart && gameContext.week.season - h.season < 2,
  ) ?? false;

  if (isRecurring) {
    weeksOut = Math.ceil(weeksOut * RECURRING_PENALTY_MULTIPLIER);
  }

  const status: InjuryStatus = {
    type: injuryName,
    severity,
    weeksRemaining: weeksOut,
    performancePenalty: computePerformancePenalty(severity, weeksOut),
    isRecurring,
  };

  bus?.emit('INJURY_OCCURRED', {
    playerId: player.id,
    teamId: player.teamId!,
    type: injuryName,
    severity,
    weeksOut,
  });

  return status;
}

export function processWeeklyRecovery(
  player: Player,
  rng: RNG,
  bus?: EventBus<GameEventMap>,
): RecoveryResult {
  const injury = player.injuryStatus;
  if (!injury) {
    return { recovered: false, updatedStatus: null, worsened: false };
  }

  // Setback chance: base 5%, +3% if recurring
  const setbackChance = injury.isRecurring ? 0.08 : 0.05;
  if (chance(rng, setbackChance)) {
    const additionalWeeks = randomInt(rng, 1, 3);
    const newSeverity = upgradeSeverity(injury.severity);
    const updatedStatus: InjuryStatus = {
      ...injury,
      severity: newSeverity,
      weeksRemaining: injury.weeksRemaining + additionalWeeks,
      performancePenalty: computePerformancePenalty(newSeverity, injury.weeksRemaining + additionalWeeks),
    };

    bus?.emit('INJURY_WORSENED', {
      playerId: player.id,
      teamId: player.teamId!,
      newSeverity,
      additionalWeeksOut: additionalWeeks,
    });

    return { recovered: false, updatedStatus, worsened: true };
  }

  // Toughness gives a chance to recover an extra week
  const bonusRecovery = player.physical.toughness > 75 && chance(rng, 0.15) ? 1 : 0;
  const weeksHealed = 1 + bonusRecovery;
  const newWeeks = Math.max(0, injury.weeksRemaining - weeksHealed);

  if (newWeeks === 0) {
    bus?.emit('PLAYER_RECOVERED', {
      playerId: player.id,
      teamId: player.teamId!,
      fullRecovery: true,
    });

    return { recovered: true, updatedStatus: null, worsened: false };
  }

  const updatedStatus: InjuryStatus = {
    ...injury,
    weeksRemaining: newWeeks,
    performancePenalty: computePerformancePenalty(injury.severity, newWeeks),
  };

  return { recovered: false, updatedStatus, worsened: false };
}

export function getPerformancePenalty(injuryStatus: InjuryStatus): number {
  return computePerformancePenalty(injuryStatus.severity, injuryStatus.weeksRemaining);
}

// ── Internal Helpers ───────────────────────────────────────────────

function computePerformancePenalty(severity: InjurySeverity, weeksRemaining: number): number {
  switch (severity) {
    case 'minor':
      return clamp(0.95 - weeksRemaining * 0.05, 0.85, 0.95);
    case 'moderate':
      return clamp(0.8 - weeksRemaining * 0.03, 0.6, 0.8);
    case 'severe':
    case 'season_ending':
      return 0;
  }
}

function upgradeSeverity(current: InjurySeverity): InjurySeverity {
  switch (current) {
    case 'minor': return 'moderate';
    case 'moderate': return 'severe';
    case 'severe': return 'season_ending';
    case 'season_ending': return 'season_ending';
  }
}
