/**
 * Player progression/regression engine for Viridian Football.
 *
 * Pure function: given a player, coaching context, and seeded RNG,
 * produces deterministic progression results.
 */

import type { EventBus } from '../events/EventBus.js';
import type { GameEventMap } from '../events/GameEvents.js';
import type { Player, Position } from '../types/player.js';
import type { PlayerId } from '../types/ids.js';
import type { RNG } from '../sim/RNG.js';
import { normalRandom, chance, randomInt, clamp } from '../sim/RNG.js';
import { defaultCurves } from './positionCurves.js';

// ── Public Types ────────────────────────────────────────────────────

export interface ProgressionContext {
  coachDevelopmentRating: number;
  schemeFitScore: number;
  snapCountPercentage: number;
  facilitiesLevel: number;
  wasInjured: boolean;
}

export interface RatingChange {
  old: number;
  new: number;
}

export interface ProgressionResult {
  playerId: PlayerId;
  changes: Record<string, RatingChange>;
  breakout: boolean;
  decline: boolean;
}

// ── Physical vs Mental attribute classification ─────────────────────

const FAST_DECLINE_ATTRIBUTES = new Set([
  'speed', 'acceleration', 'agility', 'stamina', 'jumping',
]);

const SLOW_DECLINE_ATTRIBUTES = new Set([
  'playRecognition', 'awareness', 'ballCarrierVision',
  'shortAccuracy', 'mediumAccuracy',
]);

// ── Rating group enumeration ────────────────────────────────────────

type RatingGroupKey = 'physical' | 'passing' | 'rushing' | 'receiving' | 'blocking' | 'defense' | 'kicking' | 'punting';

const RATING_GROUP_KEYS: RatingGroupKey[] = [
  'physical', 'passing', 'rushing', 'receiving', 'blocking', 'defense', 'kicking', 'punting',
];

function getPlayerRatingGroup(player: Player, key: RatingGroupKey): Record<string, number> | undefined {
  switch (key) {
    case 'physical': return player.physical as unknown as Record<string, number>;
    case 'passing': return player.passing as unknown as Record<string, number> | undefined;
    case 'rushing': return player.rushing as unknown as Record<string, number> | undefined;
    case 'receiving': return player.receiving as unknown as Record<string, number> | undefined;
    case 'blocking': return player.blocking as unknown as Record<string, number> | undefined;
    case 'defense': return player.defense as unknown as Record<string, number> | undefined;
    case 'kicking': return player.kicking as unknown as Record<string, number> | undefined;
    case 'punting': return player.punting as unknown as Record<string, number> | undefined;
    default: return undefined;
  }
}

function setPlayerAttribute(player: Player, key: RatingGroupKey, attr: string, value: number): void {
  const group = getPlayerRatingGroup(player, key);
  if (group) {
    (group as Record<string, number>)[attr] = value;
  }
}

// ── Main Progression Function ───────────────────────────────────────

export function processOffseasonProgression(
  player: Player,
  context: ProgressionContext,
  rng: RNG,
  bus?: EventBus<GameEventMap>,
): ProgressionResult {
  const curve = defaultCurves[player.position] ?? defaultCurves['QB'];
  const age = player.age;
  const [floor, ceiling] = player.hidden.ceilingFloor;

  const phase = getPhase(age, curve.peakAgeStart, curve.peakAgeEnd);

  const modifier = computeModifier(player, context);

  let baseDelta: number;
  if (phase === 'growth') {
    baseDelta = curve.growthRate;
  } else if (phase === 'peak') {
    baseDelta = 0;
  } else {
    baseDelta = -curve.declineRate;
  }

  const changes: Record<string, RatingChange> = {};
  let isBreakout = false;
  let isDecline = false;

  // Breakout check (growth phase, young, high ceiling)
  if (phase === 'growth' && age <= curve.peakAgeStart - 1 && ceiling >= 80) {
    const breakoutChance = 0.05 + (context.coachDevelopmentRating / 99) * 0.05;
    if (chance(rng, breakoutChance)) {
      isBreakout = true;
    }
  }

  // Sharp decline check (well past peak)
  if (age > curve.peakAgeEnd + 2) {
    const declineChance = 0.03 + ((age - curve.peakAgeEnd - 2) / 10) * 0.02;
    if (chance(rng, Math.min(declineChance, 0.10))) {
      isDecline = true;
    }
  }

  for (const groupKey of RATING_GROUP_KEYS) {
    const group = getPlayerRatingGroup(player, groupKey);
    if (!group) continue;

    for (const attr of Object.keys(group)) {
      const oldValue = group[attr]!;
      let delta = baseDelta * modifier;

      if (phase === 'decline' || baseDelta < 0) {
        if (FAST_DECLINE_ATTRIBUTES.has(attr)) {
          delta *= 1.5;
        } else if (SLOW_DECLINE_ATTRIBUTES.has(attr)) {
          delta *= 0.5;
        }
      }

      if (phase === 'peak') {
        delta += normalRandom(rng, 0, 1);
      } else {
        delta += normalRandom(rng, 0, 0.8);
      }

      if (isBreakout) {
        delta += randomInt(rng, 3, 8);
      }

      if (isDecline) {
        if (FAST_DECLINE_ATTRIBUTES.has(attr)) {
          delta -= randomInt(rng, 5, 10);
        } else {
          delta -= randomInt(rng, 2, 5);
        }
      }

      let newValue = clamp(
        Math.round(oldValue + delta),
        Math.max(0, floor),
        Math.min(99, ceiling),
      );

      if (newValue !== oldValue) {
        changes[`${groupKey}.${attr}`] = { old: oldValue, new: newValue };
        setPlayerAttribute(player, groupKey, attr, newValue);

        if (bus) {
          bus.emit('RATING_CHANGED', {
            playerId: player.id,
            attribute: `${groupKey}.${attr}`,
            oldValue,
            newValue,
          });
        }
      }
    }
  }

  if (isBreakout && bus && player.teamId) {
    const totalChange = Object.values(changes).reduce(
      (sum, c) => sum + (c.new - c.old), 0,
    );
    bus.emit('PLAYER_BREAKOUT', {
      playerId: player.id,
      teamId: player.teamId,
      position: player.position,
      ratingChange: totalChange,
    });
  }

  if (isDecline && bus && player.teamId) {
    const totalChange = Object.values(changes).reduce(
      (sum, c) => sum + (c.new - c.old), 0,
    );
    bus.emit('PLAYER_DECLINE', {
      playerId: player.id,
      teamId: player.teamId,
      position: player.position,
      ratingChange: totalChange,
    });
  }

  return {
    playerId: player.id,
    changes,
    breakout: isBreakout,
    decline: isDecline,
  };
}

// ── Helpers ─────────────────────────────────────────────────────────

function getPhase(age: number, peakStart: number, peakEnd: number): 'growth' | 'peak' | 'decline' {
  if (age < peakStart) return 'growth';
  if (age <= peakEnd) return 'peak';
  return 'decline';
}

function computeModifier(player: Player, ctx: ProgressionContext): number {
  const workEthicMod = 0.7 + (player.personality.workEthic / 99) * 0.6;

  const coachMod = 0.8 + (player.personality.coachability * ctx.coachDevelopmentRating) / (99 * 99) * 0.4;

  const fitMod = 0.9 + (ctx.schemeFitScore / 100) * 0.2;

  const snapMod = 0.8 + ctx.snapCountPercentage * 0.4;

  const facMod = 0.9 + ((ctx.facilitiesLevel - 1) / 4) * 0.2;

  let combined = workEthicMod * coachMod * fitMod * snapMod * facMod;

  if (ctx.wasInjured) {
    combined *= 0.5;
  }

  return combined;
}
