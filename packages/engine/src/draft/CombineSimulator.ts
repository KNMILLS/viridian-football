import { createLCG, normalRandom, clamp, randomInt } from '../sim/RNG.js';
import type { RNG } from '../sim/RNG.js';
import type { DraftProspect, CombineResults } from '../types/player.js';
import type { CombineEvent, CombinePerformance } from '../types/draft.js';
import type { PlayerId } from '../types/ids.js';
import type { EventBus } from '../events/EventBus.js';
import type { GameEventMap } from '../events/GameEvents.js';
import type { TeamId } from '../types/ids.js';
import { COMBINE_RANGES } from './constants.js';

export function runCombine(
  prospects: DraftProspect[],
  season: number,
  seed: number,
  bus?: EventBus<GameEventMap>,
  teamId?: TeamId,
): CombineEvent {
  const rng = createLCG(seed);
  const results = new Map<PlayerId, CombinePerformance>();
  const participantIds: PlayerId[] = [];

  for (const prospect of prospects) {
    const perf = generateCombinePerformance(rng, prospect);
    results.set(prospect.id, perf);
    participantIds.push(prospect.id);

    applyCombineToProspect(prospect, perf);

    narrowGradeRangeFromCombine(prospect);

    if (bus && teamId) {
      bus.emit('SCOUTING_REPORT_UPDATED', {
        playerId: prospect.id,
        teamId,
        confidenceImprovement: 10,
      });
    }
  }

  return {
    season,
    participants: participantIds,
    results,
  };
}

export function runProDay(
  prospect: DraftProspect,
  seed: number,
  bus?: EventBus<GameEventMap>,
  teamId?: TeamId,
): CombinePerformance {
  const rng = createLCG(seed);
  const perf = generateCombinePerformance(rng, prospect);

  applyCombineToProspect(prospect, perf);
  narrowGradeRangeFromCombine(prospect);

  if (bus && teamId) {
    bus.emit('SCOUTING_REPORT_UPDATED', {
      playerId: prospect.id,
      teamId,
      confidenceImprovement: 8,
    });
  }

  return perf;
}

function generateCombinePerformance(rng: RNG, prospect: DraftProspect): CombinePerformance {
  const phys = prospect.physical;
  const ranges = COMBINE_RANGES[prospect.position];

  return {
    prospectId: prospect.id,
    fortyYardDash: deriveForty(rng, phys.speed, phys.acceleration, ranges.fortyMin, ranges.fortyMax),
    benchPress: deriveBench(rng, phys.strength, ranges.benchMin, ranges.benchMax),
    verticalJump: deriveVertical(rng, phys.jumping, phys.speed, ranges.vertMin, ranges.vertMax),
    broadJump: deriveBroad(rng, phys.jumping, phys.speed, ranges.broadMin, ranges.broadMax),
    threeConeDrill: deriveCone(rng, phys.agility, ranges.coneMin, ranges.coneMax),
    twentyYardShuttle: deriveShuttle(rng, phys.agility, ranges.shuttleMin, ranges.shuttleMax),
    interviewScore: null,
  };
}

function deriveForty(rng: RNG, speed: number, accel: number, min: number, max: number): number {
  const composite = (speed * 0.6 + accel * 0.4) / 99;
  const base = max - composite * (max - min);
  const noise = normalRandom(rng, 0, 0.04);
  return Math.round(clamp(base + noise, min - 0.05, max + 0.10) * 100) / 100;
}

function deriveBench(rng: RNG, strength: number, min: number, max: number): number {
  const ratio = strength / 99;
  const base = min + ratio * (max - min);
  const noise = normalRandom(rng, 0, 2);
  return Math.max(1, Math.round(base + noise));
}

function deriveVertical(rng: RNG, jumping: number, speed: number, min: number, max: number): number {
  const composite = (jumping * 0.7 + speed * 0.3) / 99;
  const base = min + composite * (max - min);
  const noise = normalRandom(rng, 0, 1.5);
  return Math.round(clamp(base + noise, min - 2, max + 3) * 10) / 10;
}

function deriveBroad(rng: RNG, jumping: number, speed: number, min: number, max: number): number {
  const composite = (jumping * 0.6 + speed * 0.4) / 99;
  const base = min + composite * (max - min);
  const noise = normalRandom(rng, 0, 3);
  return Math.round(clamp(base + noise, min - 4, max + 6));
}

function deriveCone(rng: RNG, agility: number, min: number, max: number): number {
  const ratio = agility / 99;
  const base = max - ratio * (max - min);
  const noise = normalRandom(rng, 0, 0.08);
  return Math.round(clamp(base + noise, min - 0.05, max + 0.10) * 100) / 100;
}

function deriveShuttle(rng: RNG, agility: number, min: number, max: number): number {
  const ratio = agility / 99;
  const base = max - ratio * (max - min);
  const noise = normalRandom(rng, 0, 0.06);
  return Math.round(clamp(base + noise, min - 0.05, max + 0.10) * 100) / 100;
}

function applyCombineToProspect(prospect: DraftProspect, perf: CombinePerformance): void {
  const combineResults: CombineResults = {
    fortyYardDash: perf.fortyYardDash,
    benchPress: perf.benchPress,
    verticalJump: perf.verticalJump,
    broadJump: perf.broadJump,
    threeConeDrill: perf.threeConeDrill,
    twentyYardShuttle: perf.twentyYardShuttle,
  };
  prospect.combineResults = combineResults;
}

function narrowGradeRangeFromCombine(prospect: DraftProspect): void {
  const report = prospect.scoutingReport;
  const currentWidth = report.gradeRange[1] - report.gradeRange[0];
  if (currentWidth > 0.6) {
    const narrowing = Math.min(0.4, currentWidth * 0.2);
    const center = (report.gradeRange[0] + report.gradeRange[1]) / 2;
    report.gradeRange = [
      Math.max(4.0, Math.round((center - (currentWidth - narrowing) / 2) * 10) / 10),
      Math.min(9.0, Math.round((center + (currentWidth - narrowing) / 2) * 10) / 10),
    ];
  }
}
