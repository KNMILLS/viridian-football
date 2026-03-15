/**
 * Scheme-to-attribute weight mappings for Viridian Football.
 *
 * Each scheme defines which player attributes matter most per position,
 * and their relative weights. Used by CoachingEngine.calculateSchemeFit()
 * to compute a 0-100 fit score.
 */

import type { OffensiveScheme, DefensiveScheme } from '../types/coach.js';
import type { Position } from '../types/player.js';

export type AttributeWeight = {
  ratingGroup: 'physical' | 'passing' | 'rushing' | 'receiving' | 'blocking' | 'defense';
  attribute: string;
  weight: number;
};

export type PositionWeightMap = Partial<Record<Position, AttributeWeight[]>>;

// ── Offensive Scheme Mappings ───────────────────────────────────────

export const offensiveSchemeMappings: Record<OffensiveScheme, PositionWeightMap> = {
  west_coast: {
    QB: [
      { ratingGroup: 'passing', attribute: 'shortAccuracy', weight: 5 },
      { ratingGroup: 'passing', attribute: 'mediumAccuracy', weight: 4 },
      { ratingGroup: 'passing', attribute: 'throwOnRun', weight: 2 },
      { ratingGroup: 'passing', attribute: 'playAction', weight: 2 },
      { ratingGroup: 'physical', attribute: 'agility', weight: 1 },
    ],
    WR: [
      { ratingGroup: 'receiving', attribute: 'routeRunning', weight: 5 },
      { ratingGroup: 'receiving', attribute: 'catching', weight: 4 },
      { ratingGroup: 'receiving', attribute: 'catchInTraffic', weight: 3 },
      { ratingGroup: 'receiving', attribute: 'release', weight: 2 },
      { ratingGroup: 'physical', attribute: 'agility', weight: 2 },
    ],
    TE: [
      { ratingGroup: 'receiving', attribute: 'routeRunning', weight: 4 },
      { ratingGroup: 'receiving', attribute: 'catching', weight: 4 },
      { ratingGroup: 'receiving', attribute: 'catchInTraffic', weight: 3 },
      { ratingGroup: 'blocking', attribute: 'passBlock', weight: 2 },
    ],
    RB: [
      { ratingGroup: 'receiving', attribute: 'catching', weight: 4 },
      { ratingGroup: 'receiving', attribute: 'routeRunning', weight: 3 },
      { ratingGroup: 'blocking', attribute: 'passBlock', weight: 2 },
      { ratingGroup: 'rushing', attribute: 'elusiveness', weight: 2 },
    ],
    LT: [
      { ratingGroup: 'blocking', attribute: 'passBlock', weight: 5 },
      { ratingGroup: 'blocking', attribute: 'awareness', weight: 3 },
      { ratingGroup: 'physical', attribute: 'agility', weight: 2 },
    ],
    LG: [
      { ratingGroup: 'blocking', attribute: 'passBlock', weight: 4 },
      { ratingGroup: 'blocking', attribute: 'awareness', weight: 3 },
      { ratingGroup: 'physical', attribute: 'agility', weight: 2 },
    ],
    C: [
      { ratingGroup: 'blocking', attribute: 'passBlock', weight: 4 },
      { ratingGroup: 'blocking', attribute: 'awareness', weight: 4 },
      { ratingGroup: 'physical', attribute: 'agility', weight: 2 },
    ],
    RG: [
      { ratingGroup: 'blocking', attribute: 'passBlock', weight: 4 },
      { ratingGroup: 'blocking', attribute: 'awareness', weight: 3 },
      { ratingGroup: 'physical', attribute: 'agility', weight: 2 },
    ],
    RT: [
      { ratingGroup: 'blocking', attribute: 'passBlock', weight: 5 },
      { ratingGroup: 'blocking', attribute: 'awareness', weight: 3 },
      { ratingGroup: 'physical', attribute: 'agility', weight: 2 },
    ],
  },

  spread: {
    QB: [
      { ratingGroup: 'passing', attribute: 'shortAccuracy', weight: 4 },
      { ratingGroup: 'passing', attribute: 'mediumAccuracy', weight: 3 },
      { ratingGroup: 'passing', attribute: 'deepAccuracy', weight: 3 },
      { ratingGroup: 'passing', attribute: 'throwOnRun', weight: 2 },
      { ratingGroup: 'physical', attribute: 'speed', weight: 2 },
    ],
    WR: [
      { ratingGroup: 'physical', attribute: 'speed', weight: 5 },
      { ratingGroup: 'receiving', attribute: 'catching', weight: 4 },
      { ratingGroup: 'receiving', attribute: 'routeRunning', weight: 3 },
      { ratingGroup: 'receiving', attribute: 'release', weight: 3 },
      { ratingGroup: 'physical', attribute: 'agility', weight: 2 },
    ],
    TE: [
      { ratingGroup: 'receiving', attribute: 'catching', weight: 4 },
      { ratingGroup: 'physical', attribute: 'speed', weight: 3 },
      { ratingGroup: 'receiving', attribute: 'routeRunning', weight: 3 },
      { ratingGroup: 'receiving', attribute: 'release', weight: 2 },
    ],
    RB: [
      { ratingGroup: 'receiving', attribute: 'catching', weight: 3 },
      { ratingGroup: 'physical', attribute: 'speed', weight: 4 },
      { ratingGroup: 'rushing', attribute: 'elusiveness', weight: 3 },
      { ratingGroup: 'rushing', attribute: 'ballCarrierVision', weight: 2 },
    ],
    LT: [
      { ratingGroup: 'blocking', attribute: 'passBlock', weight: 5 },
      { ratingGroup: 'physical', attribute: 'agility', weight: 3 },
      { ratingGroup: 'blocking', attribute: 'awareness', weight: 2 },
    ],
    LG: [
      { ratingGroup: 'blocking', attribute: 'passBlock', weight: 4 },
      { ratingGroup: 'physical', attribute: 'agility', weight: 3 },
    ],
    C: [
      { ratingGroup: 'blocking', attribute: 'passBlock', weight: 4 },
      { ratingGroup: 'blocking', attribute: 'awareness', weight: 3 },
    ],
    RG: [
      { ratingGroup: 'blocking', attribute: 'passBlock', weight: 4 },
      { ratingGroup: 'physical', attribute: 'agility', weight: 3 },
    ],
    RT: [
      { ratingGroup: 'blocking', attribute: 'passBlock', weight: 5 },
      { ratingGroup: 'physical', attribute: 'agility', weight: 3 },
    ],
  },

  air_raid: {
    QB: [
      { ratingGroup: 'passing', attribute: 'deepAccuracy', weight: 5 },
      { ratingGroup: 'passing', attribute: 'throwPower', weight: 4 },
      { ratingGroup: 'passing', attribute: 'mediumAccuracy', weight: 3 },
      { ratingGroup: 'passing', attribute: 'shortAccuracy', weight: 2 },
    ],
    WR: [
      { ratingGroup: 'receiving', attribute: 'routeRunning', weight: 5 },
      { ratingGroup: 'physical', attribute: 'speed', weight: 5 },
      { ratingGroup: 'receiving', attribute: 'catching', weight: 4 },
      { ratingGroup: 'receiving', attribute: 'spectacularCatch', weight: 3 },
      { ratingGroup: 'receiving', attribute: 'release', weight: 3 },
    ],
    TE: [
      { ratingGroup: 'receiving', attribute: 'catching', weight: 4 },
      { ratingGroup: 'physical', attribute: 'speed', weight: 3 },
      { ratingGroup: 'receiving', attribute: 'routeRunning', weight: 4 },
      { ratingGroup: 'receiving', attribute: 'spectacularCatch', weight: 2 },
    ],
    RB: [
      { ratingGroup: 'receiving', attribute: 'catching', weight: 4 },
      { ratingGroup: 'receiving', attribute: 'routeRunning', weight: 3 },
      { ratingGroup: 'blocking', attribute: 'passBlock', weight: 3 },
    ],
    LT: [
      { ratingGroup: 'blocking', attribute: 'passBlock', weight: 5 },
      { ratingGroup: 'physical', attribute: 'agility', weight: 3 },
      { ratingGroup: 'blocking', attribute: 'awareness', weight: 2 },
    ],
    LG: [
      { ratingGroup: 'blocking', attribute: 'passBlock', weight: 5 },
      { ratingGroup: 'physical', attribute: 'agility', weight: 2 },
    ],
    C: [
      { ratingGroup: 'blocking', attribute: 'passBlock', weight: 5 },
      { ratingGroup: 'blocking', attribute: 'awareness', weight: 3 },
    ],
    RG: [
      { ratingGroup: 'blocking', attribute: 'passBlock', weight: 5 },
      { ratingGroup: 'physical', attribute: 'agility', weight: 2 },
    ],
    RT: [
      { ratingGroup: 'blocking', attribute: 'passBlock', weight: 5 },
      { ratingGroup: 'physical', attribute: 'agility', weight: 3 },
    ],
  },

  power_run: {
    QB: [
      { ratingGroup: 'passing', attribute: 'playAction', weight: 4 },
      { ratingGroup: 'passing', attribute: 'shortAccuracy', weight: 3 },
      { ratingGroup: 'physical', attribute: 'strength', weight: 2 },
      { ratingGroup: 'rushing', attribute: 'carrying', weight: 2 },
    ],
    RB: [
      { ratingGroup: 'physical', attribute: 'strength', weight: 5 },
      { ratingGroup: 'rushing', attribute: 'trucking', weight: 5 },
      { ratingGroup: 'rushing', attribute: 'breakTackle', weight: 4 },
      { ratingGroup: 'rushing', attribute: 'carrying', weight: 3 },
      { ratingGroup: 'rushing', attribute: 'ballCarrierVision', weight: 3 },
    ],
    FB: [
      { ratingGroup: 'blocking', attribute: 'runBlock', weight: 5 },
      { ratingGroup: 'blocking', attribute: 'impactBlock', weight: 4 },
      { ratingGroup: 'physical', attribute: 'strength', weight: 4 },
      { ratingGroup: 'rushing', attribute: 'trucking', weight: 2 },
    ],
    WR: [
      { ratingGroup: 'blocking', attribute: 'runBlock', weight: 4 },
      { ratingGroup: 'blocking', attribute: 'impactBlock', weight: 3 },
      { ratingGroup: 'physical', attribute: 'strength', weight: 3 },
    ],
    TE: [
      { ratingGroup: 'blocking', attribute: 'runBlock', weight: 5 },
      { ratingGroup: 'blocking', attribute: 'impactBlock', weight: 4 },
      { ratingGroup: 'physical', attribute: 'strength', weight: 4 },
    ],
    LT: [
      { ratingGroup: 'blocking', attribute: 'runBlock', weight: 5 },
      { ratingGroup: 'blocking', attribute: 'impactBlock', weight: 4 },
      { ratingGroup: 'physical', attribute: 'strength', weight: 4 },
    ],
    LG: [
      { ratingGroup: 'blocking', attribute: 'runBlock', weight: 5 },
      { ratingGroup: 'blocking', attribute: 'impactBlock', weight: 4 },
      { ratingGroup: 'physical', attribute: 'strength', weight: 4 },
    ],
    C: [
      { ratingGroup: 'blocking', attribute: 'runBlock', weight: 5 },
      { ratingGroup: 'blocking', attribute: 'impactBlock', weight: 3 },
      { ratingGroup: 'physical', attribute: 'strength', weight: 4 },
    ],
    RG: [
      { ratingGroup: 'blocking', attribute: 'runBlock', weight: 5 },
      { ratingGroup: 'blocking', attribute: 'impactBlock', weight: 4 },
      { ratingGroup: 'physical', attribute: 'strength', weight: 4 },
    ],
    RT: [
      { ratingGroup: 'blocking', attribute: 'runBlock', weight: 5 },
      { ratingGroup: 'blocking', attribute: 'impactBlock', weight: 4 },
      { ratingGroup: 'physical', attribute: 'strength', weight: 4 },
    ],
  },

  zone_run: {
    QB: [
      { ratingGroup: 'passing', attribute: 'playAction', weight: 4 },
      { ratingGroup: 'passing', attribute: 'shortAccuracy', weight: 3 },
      { ratingGroup: 'passing', attribute: 'throwOnRun', weight: 2 },
    ],
    RB: [
      { ratingGroup: 'physical', attribute: 'agility', weight: 5 },
      { ratingGroup: 'physical', attribute: 'speed', weight: 4 },
      { ratingGroup: 'rushing', attribute: 'ballCarrierVision', weight: 5 },
      { ratingGroup: 'rushing', attribute: 'elusiveness', weight: 4 },
      { ratingGroup: 'rushing', attribute: 'carrying', weight: 2 },
    ],
    FB: [
      { ratingGroup: 'blocking', attribute: 'runBlock', weight: 4 },
      { ratingGroup: 'physical', attribute: 'agility', weight: 3 },
      { ratingGroup: 'blocking', attribute: 'awareness', weight: 3 },
    ],
    WR: [
      { ratingGroup: 'blocking', attribute: 'runBlock', weight: 3 },
      { ratingGroup: 'physical', attribute: 'speed', weight: 3 },
      { ratingGroup: 'receiving', attribute: 'catching', weight: 2 },
    ],
    TE: [
      { ratingGroup: 'blocking', attribute: 'runBlock', weight: 5 },
      { ratingGroup: 'blocking', attribute: 'awareness', weight: 3 },
      { ratingGroup: 'physical', attribute: 'agility', weight: 3 },
    ],
    LT: [
      { ratingGroup: 'blocking', attribute: 'runBlock', weight: 5 },
      { ratingGroup: 'physical', attribute: 'agility', weight: 4 },
      { ratingGroup: 'blocking', attribute: 'awareness', weight: 4 },
    ],
    LG: [
      { ratingGroup: 'blocking', attribute: 'runBlock', weight: 5 },
      { ratingGroup: 'physical', attribute: 'agility', weight: 4 },
      { ratingGroup: 'blocking', attribute: 'awareness', weight: 4 },
    ],
    C: [
      { ratingGroup: 'blocking', attribute: 'runBlock', weight: 5 },
      { ratingGroup: 'physical', attribute: 'agility', weight: 4 },
      { ratingGroup: 'blocking', attribute: 'awareness', weight: 5 },
    ],
    RG: [
      { ratingGroup: 'blocking', attribute: 'runBlock', weight: 5 },
      { ratingGroup: 'physical', attribute: 'agility', weight: 4 },
      { ratingGroup: 'blocking', attribute: 'awareness', weight: 4 },
    ],
    RT: [
      { ratingGroup: 'blocking', attribute: 'runBlock', weight: 5 },
      { ratingGroup: 'physical', attribute: 'agility', weight: 4 },
      { ratingGroup: 'blocking', attribute: 'awareness', weight: 4 },
    ],
  },

  rpo_heavy: {
    QB: [
      { ratingGroup: 'passing', attribute: 'throwOnRun', weight: 5 },
      { ratingGroup: 'passing', attribute: 'shortAccuracy', weight: 4 },
      { ratingGroup: 'physical', attribute: 'speed', weight: 3 },
      { ratingGroup: 'physical', attribute: 'agility', weight: 3 },
      { ratingGroup: 'rushing', attribute: 'elusiveness', weight: 3 },
    ],
    RB: [
      { ratingGroup: 'rushing', attribute: 'elusiveness', weight: 4 },
      { ratingGroup: 'physical', attribute: 'speed', weight: 4 },
      { ratingGroup: 'rushing', attribute: 'ballCarrierVision', weight: 3 },
      { ratingGroup: 'receiving', attribute: 'catching', weight: 3 },
    ],
    WR: [
      { ratingGroup: 'receiving', attribute: 'catching', weight: 4 },
      { ratingGroup: 'receiving', attribute: 'routeRunning', weight: 3 },
      { ratingGroup: 'physical', attribute: 'speed', weight: 3 },
      { ratingGroup: 'blocking', attribute: 'runBlock', weight: 2 },
    ],
    TE: [
      { ratingGroup: 'receiving', attribute: 'catching', weight: 3 },
      { ratingGroup: 'blocking', attribute: 'runBlock', weight: 3 },
      { ratingGroup: 'receiving', attribute: 'routeRunning', weight: 3 },
      { ratingGroup: 'physical', attribute: 'speed', weight: 2 },
    ],
    LT: [
      { ratingGroup: 'blocking', attribute: 'runBlock', weight: 4 },
      { ratingGroup: 'blocking', attribute: 'passBlock', weight: 3 },
      { ratingGroup: 'physical', attribute: 'agility', weight: 3 },
    ],
    LG: [
      { ratingGroup: 'blocking', attribute: 'runBlock', weight: 4 },
      { ratingGroup: 'blocking', attribute: 'passBlock', weight: 3 },
      { ratingGroup: 'physical', attribute: 'agility', weight: 3 },
    ],
    C: [
      { ratingGroup: 'blocking', attribute: 'runBlock', weight: 4 },
      { ratingGroup: 'blocking', attribute: 'passBlock', weight: 3 },
      { ratingGroup: 'blocking', attribute: 'awareness', weight: 3 },
    ],
    RG: [
      { ratingGroup: 'blocking', attribute: 'runBlock', weight: 4 },
      { ratingGroup: 'blocking', attribute: 'passBlock', weight: 3 },
      { ratingGroup: 'physical', attribute: 'agility', weight: 3 },
    ],
    RT: [
      { ratingGroup: 'blocking', attribute: 'runBlock', weight: 4 },
      { ratingGroup: 'blocking', attribute: 'passBlock', weight: 3 },
      { ratingGroup: 'physical', attribute: 'agility', weight: 3 },
    ],
  },

  play_action_heavy: {
    QB: [
      { ratingGroup: 'passing', attribute: 'playAction', weight: 5 },
      { ratingGroup: 'passing', attribute: 'deepAccuracy', weight: 4 },
      { ratingGroup: 'passing', attribute: 'throwPower', weight: 3 },
      { ratingGroup: 'passing', attribute: 'mediumAccuracy', weight: 3 },
    ],
    RB: [
      { ratingGroup: 'rushing', attribute: 'carrying', weight: 4 },
      { ratingGroup: 'rushing', attribute: 'breakTackle', weight: 3 },
      { ratingGroup: 'rushing', attribute: 'ballCarrierVision', weight: 3 },
      { ratingGroup: 'blocking', attribute: 'passBlock', weight: 2 },
    ],
    WR: [
      { ratingGroup: 'receiving', attribute: 'catching', weight: 4 },
      { ratingGroup: 'receiving', attribute: 'routeRunning', weight: 4 },
      { ratingGroup: 'physical', attribute: 'speed', weight: 3 },
      { ratingGroup: 'receiving', attribute: 'spectacularCatch', weight: 2 },
    ],
    TE: [
      { ratingGroup: 'receiving', attribute: 'catching', weight: 4 },
      { ratingGroup: 'blocking', attribute: 'runBlock', weight: 4 },
      { ratingGroup: 'receiving', attribute: 'routeRunning', weight: 3 },
      { ratingGroup: 'physical', attribute: 'speed', weight: 2 },
    ],
    LT: [
      { ratingGroup: 'blocking', attribute: 'runBlock', weight: 4 },
      { ratingGroup: 'blocking', attribute: 'passBlock', weight: 4 },
      { ratingGroup: 'physical', attribute: 'strength', weight: 2 },
    ],
    LG: [
      { ratingGroup: 'blocking', attribute: 'runBlock', weight: 4 },
      { ratingGroup: 'blocking', attribute: 'passBlock', weight: 4 },
      { ratingGroup: 'physical', attribute: 'strength', weight: 2 },
    ],
    C: [
      { ratingGroup: 'blocking', attribute: 'runBlock', weight: 4 },
      { ratingGroup: 'blocking', attribute: 'passBlock', weight: 4 },
      { ratingGroup: 'blocking', attribute: 'awareness', weight: 3 },
    ],
    RG: [
      { ratingGroup: 'blocking', attribute: 'runBlock', weight: 4 },
      { ratingGroup: 'blocking', attribute: 'passBlock', weight: 4 },
      { ratingGroup: 'physical', attribute: 'strength', weight: 2 },
    ],
    RT: [
      { ratingGroup: 'blocking', attribute: 'runBlock', weight: 4 },
      { ratingGroup: 'blocking', attribute: 'passBlock', weight: 4 },
      { ratingGroup: 'physical', attribute: 'strength', weight: 2 },
    ],
  },

  pro_style: {
    QB: [
      { ratingGroup: 'passing', attribute: 'shortAccuracy', weight: 3 },
      { ratingGroup: 'passing', attribute: 'mediumAccuracy', weight: 3 },
      { ratingGroup: 'passing', attribute: 'deepAccuracy', weight: 3 },
      { ratingGroup: 'passing', attribute: 'throwPower', weight: 2 },
      { ratingGroup: 'passing', attribute: 'playAction', weight: 2 },
    ],
    RB: [
      { ratingGroup: 'rushing', attribute: 'carrying', weight: 3 },
      { ratingGroup: 'rushing', attribute: 'ballCarrierVision', weight: 3 },
      { ratingGroup: 'rushing', attribute: 'breakTackle', weight: 2 },
      { ratingGroup: 'receiving', attribute: 'catching', weight: 2 },
      { ratingGroup: 'physical', attribute: 'speed', weight: 2 },
    ],
    FB: [
      { ratingGroup: 'blocking', attribute: 'runBlock', weight: 4 },
      { ratingGroup: 'rushing', attribute: 'carrying', weight: 2 },
      { ratingGroup: 'physical', attribute: 'strength', weight: 3 },
    ],
    WR: [
      { ratingGroup: 'receiving', attribute: 'routeRunning', weight: 3 },
      { ratingGroup: 'receiving', attribute: 'catching', weight: 3 },
      { ratingGroup: 'physical', attribute: 'speed', weight: 3 },
      { ratingGroup: 'receiving', attribute: 'release', weight: 2 },
    ],
    TE: [
      { ratingGroup: 'receiving', attribute: 'catching', weight: 3 },
      { ratingGroup: 'blocking', attribute: 'runBlock', weight: 3 },
      { ratingGroup: 'receiving', attribute: 'routeRunning', weight: 3 },
      { ratingGroup: 'physical', attribute: 'strength', weight: 2 },
    ],
    LT: [
      { ratingGroup: 'blocking', attribute: 'passBlock', weight: 3 },
      { ratingGroup: 'blocking', attribute: 'runBlock', weight: 3 },
      { ratingGroup: 'physical', attribute: 'strength', weight: 2 },
      { ratingGroup: 'blocking', attribute: 'awareness', weight: 2 },
    ],
    LG: [
      { ratingGroup: 'blocking', attribute: 'passBlock', weight: 3 },
      { ratingGroup: 'blocking', attribute: 'runBlock', weight: 3 },
      { ratingGroup: 'physical', attribute: 'strength', weight: 2 },
    ],
    C: [
      { ratingGroup: 'blocking', attribute: 'passBlock', weight: 3 },
      { ratingGroup: 'blocking', attribute: 'runBlock', weight: 3 },
      { ratingGroup: 'blocking', attribute: 'awareness', weight: 3 },
    ],
    RG: [
      { ratingGroup: 'blocking', attribute: 'passBlock', weight: 3 },
      { ratingGroup: 'blocking', attribute: 'runBlock', weight: 3 },
      { ratingGroup: 'physical', attribute: 'strength', weight: 2 },
    ],
    RT: [
      { ratingGroup: 'blocking', attribute: 'passBlock', weight: 3 },
      { ratingGroup: 'blocking', attribute: 'runBlock', weight: 3 },
      { ratingGroup: 'physical', attribute: 'strength', weight: 2 },
    ],
  },
};

// ── Defensive Scheme Mappings ───────────────────────────────────────

export const defensiveSchemeMappings: Record<DefensiveScheme, PositionWeightMap> = {
  '4_3_under': {
    DE: [
      { ratingGroup: 'defense', attribute: 'passRush', weight: 5 },
      { ratingGroup: 'defense', attribute: 'blockShedding', weight: 4 },
      { ratingGroup: 'physical', attribute: 'speed', weight: 3 },
      { ratingGroup: 'defense', attribute: 'pursuit', weight: 2 },
    ],
    DT: [
      { ratingGroup: 'defense', attribute: 'blockShedding', weight: 5 },
      { ratingGroup: 'physical', attribute: 'strength', weight: 4 },
      { ratingGroup: 'defense', attribute: 'passRush', weight: 3 },
      { ratingGroup: 'defense', attribute: 'tackling', weight: 2 },
    ],
    NT: [
      { ratingGroup: 'physical', attribute: 'strength', weight: 5 },
      { ratingGroup: 'defense', attribute: 'blockShedding', weight: 5 },
      { ratingGroup: 'defense', attribute: 'tackling', weight: 3 },
    ],
    OLB: [
      { ratingGroup: 'defense', attribute: 'tackling', weight: 4 },
      { ratingGroup: 'defense', attribute: 'pursuit', weight: 3 },
      { ratingGroup: 'defense', attribute: 'zoneCoverage', weight: 3 },
      { ratingGroup: 'physical', attribute: 'speed', weight: 2 },
    ],
    ILB: [
      { ratingGroup: 'defense', attribute: 'tackling', weight: 5 },
      { ratingGroup: 'defense', attribute: 'playRecognition', weight: 4 },
      { ratingGroup: 'defense', attribute: 'pursuit', weight: 3 },
      { ratingGroup: 'defense', attribute: 'zoneCoverage', weight: 2 },
    ],
    MLB: [
      { ratingGroup: 'defense', attribute: 'tackling', weight: 5 },
      { ratingGroup: 'defense', attribute: 'playRecognition', weight: 4 },
      { ratingGroup: 'defense', attribute: 'pursuit', weight: 3 },
      { ratingGroup: 'defense', attribute: 'zoneCoverage', weight: 3 },
    ],
    CB: [
      { ratingGroup: 'defense', attribute: 'manCoverage', weight: 4 },
      { ratingGroup: 'defense', attribute: 'zoneCoverage', weight: 3 },
      { ratingGroup: 'physical', attribute: 'speed', weight: 3 },
      { ratingGroup: 'defense', attribute: 'press', weight: 2 },
    ],
    FS: [
      { ratingGroup: 'defense', attribute: 'zoneCoverage', weight: 5 },
      { ratingGroup: 'defense', attribute: 'playRecognition', weight: 4 },
      { ratingGroup: 'physical', attribute: 'speed', weight: 3 },
      { ratingGroup: 'defense', attribute: 'tackling', weight: 2 },
    ],
    SS: [
      { ratingGroup: 'defense', attribute: 'tackling', weight: 4 },
      { ratingGroup: 'defense', attribute: 'zoneCoverage', weight: 3 },
      { ratingGroup: 'physical', attribute: 'strength', weight: 3 },
      { ratingGroup: 'defense', attribute: 'hitPower', weight: 3 },
    ],
  },

  '3_4': {
    DE: [
      { ratingGroup: 'defense', attribute: 'blockShedding', weight: 5 },
      { ratingGroup: 'physical', attribute: 'strength', weight: 4 },
      { ratingGroup: 'defense', attribute: 'tackling', weight: 3 },
      { ratingGroup: 'defense', attribute: 'passRush', weight: 2 },
    ],
    DT: [
      { ratingGroup: 'defense', attribute: 'blockShedding', weight: 5 },
      { ratingGroup: 'physical', attribute: 'strength', weight: 5 },
      { ratingGroup: 'defense', attribute: 'tackling', weight: 3 },
    ],
    NT: [
      { ratingGroup: 'physical', attribute: 'strength', weight: 5 },
      { ratingGroup: 'defense', attribute: 'blockShedding', weight: 5 },
      { ratingGroup: 'physical', attribute: 'toughness', weight: 3 },
    ],
    OLB: [
      { ratingGroup: 'defense', attribute: 'passRush', weight: 5 },
      { ratingGroup: 'physical', attribute: 'speed', weight: 4 },
      { ratingGroup: 'defense', attribute: 'pursuit', weight: 3 },
      { ratingGroup: 'defense', attribute: 'tackling', weight: 3 },
    ],
    ILB: [
      { ratingGroup: 'defense', attribute: 'tackling', weight: 5 },
      { ratingGroup: 'defense', attribute: 'playRecognition', weight: 4 },
      { ratingGroup: 'defense', attribute: 'zoneCoverage', weight: 3 },
      { ratingGroup: 'defense', attribute: 'pursuit', weight: 3 },
    ],
    MLB: [
      { ratingGroup: 'defense', attribute: 'tackling', weight: 5 },
      { ratingGroup: 'defense', attribute: 'playRecognition', weight: 5 },
      { ratingGroup: 'defense', attribute: 'zoneCoverage', weight: 3 },
      { ratingGroup: 'defense', attribute: 'pursuit', weight: 3 },
    ],
    CB: [
      { ratingGroup: 'defense', attribute: 'manCoverage', weight: 4 },
      { ratingGroup: 'defense', attribute: 'press', weight: 3 },
      { ratingGroup: 'physical', attribute: 'speed', weight: 3 },
      { ratingGroup: 'defense', attribute: 'zoneCoverage', weight: 2 },
    ],
    FS: [
      { ratingGroup: 'defense', attribute: 'zoneCoverage', weight: 4 },
      { ratingGroup: 'defense', attribute: 'playRecognition', weight: 4 },
      { ratingGroup: 'physical', attribute: 'speed', weight: 3 },
    ],
    SS: [
      { ratingGroup: 'defense', attribute: 'tackling', weight: 4 },
      { ratingGroup: 'defense', attribute: 'hitPower', weight: 3 },
      { ratingGroup: 'defense', attribute: 'zoneCoverage', weight: 3 },
      { ratingGroup: 'physical', attribute: 'strength', weight: 2 },
    ],
  },

  nickel_base: {
    DE: [
      { ratingGroup: 'defense', attribute: 'passRush', weight: 5 },
      { ratingGroup: 'physical', attribute: 'speed', weight: 3 },
      { ratingGroup: 'defense', attribute: 'blockShedding', weight: 3 },
    ],
    DT: [
      { ratingGroup: 'defense', attribute: 'passRush', weight: 4 },
      { ratingGroup: 'defense', attribute: 'blockShedding', weight: 4 },
      { ratingGroup: 'physical', attribute: 'strength', weight: 3 },
    ],
    NT: [
      { ratingGroup: 'physical', attribute: 'strength', weight: 4 },
      { ratingGroup: 'defense', attribute: 'blockShedding', weight: 4 },
      { ratingGroup: 'defense', attribute: 'passRush', weight: 3 },
    ],
    OLB: [
      { ratingGroup: 'defense', attribute: 'zoneCoverage', weight: 4 },
      { ratingGroup: 'defense', attribute: 'tackling', weight: 3 },
      { ratingGroup: 'physical', attribute: 'speed', weight: 3 },
      { ratingGroup: 'defense', attribute: 'manCoverage', weight: 2 },
    ],
    ILB: [
      { ratingGroup: 'defense', attribute: 'zoneCoverage', weight: 4 },
      { ratingGroup: 'defense', attribute: 'manCoverage', weight: 3 },
      { ratingGroup: 'defense', attribute: 'tackling', weight: 3 },
      { ratingGroup: 'physical', attribute: 'speed', weight: 3 },
    ],
    MLB: [
      { ratingGroup: 'defense', attribute: 'zoneCoverage', weight: 4 },
      { ratingGroup: 'defense', attribute: 'tackling', weight: 4 },
      { ratingGroup: 'defense', attribute: 'playRecognition', weight: 3 },
    ],
    CB: [
      { ratingGroup: 'defense', attribute: 'manCoverage', weight: 5 },
      { ratingGroup: 'defense', attribute: 'zoneCoverage', weight: 4 },
      { ratingGroup: 'physical', attribute: 'speed', weight: 3 },
      { ratingGroup: 'defense', attribute: 'press', weight: 3 },
      { ratingGroup: 'physical', attribute: 'agility', weight: 2 },
    ],
    FS: [
      { ratingGroup: 'defense', attribute: 'zoneCoverage', weight: 5 },
      { ratingGroup: 'defense', attribute: 'playRecognition', weight: 4 },
      { ratingGroup: 'physical', attribute: 'speed', weight: 3 },
    ],
    SS: [
      { ratingGroup: 'defense', attribute: 'manCoverage', weight: 4 },
      { ratingGroup: 'defense', attribute: 'zoneCoverage', weight: 3 },
      { ratingGroup: 'defense', attribute: 'tackling', weight: 3 },
      { ratingGroup: 'physical', attribute: 'speed', weight: 3 },
    ],
  },

  cover_3: {
    DE: [
      { ratingGroup: 'defense', attribute: 'passRush', weight: 4 },
      { ratingGroup: 'defense', attribute: 'blockShedding', weight: 3 },
      { ratingGroup: 'defense', attribute: 'pursuit', weight: 3 },
    ],
    DT: [
      { ratingGroup: 'defense', attribute: 'blockShedding', weight: 4 },
      { ratingGroup: 'physical', attribute: 'strength', weight: 3 },
      { ratingGroup: 'defense', attribute: 'passRush', weight: 3 },
    ],
    NT: [
      { ratingGroup: 'physical', attribute: 'strength', weight: 5 },
      { ratingGroup: 'defense', attribute: 'blockShedding', weight: 4 },
    ],
    OLB: [
      { ratingGroup: 'defense', attribute: 'zoneCoverage', weight: 4 },
      { ratingGroup: 'defense', attribute: 'pursuit', weight: 3 },
      { ratingGroup: 'physical', attribute: 'speed', weight: 3 },
      { ratingGroup: 'defense', attribute: 'tackling', weight: 2 },
    ],
    ILB: [
      { ratingGroup: 'defense', attribute: 'zoneCoverage', weight: 4 },
      { ratingGroup: 'defense', attribute: 'tackling', weight: 4 },
      { ratingGroup: 'defense', attribute: 'playRecognition', weight: 3 },
    ],
    MLB: [
      { ratingGroup: 'defense', attribute: 'zoneCoverage', weight: 5 },
      { ratingGroup: 'defense', attribute: 'playRecognition', weight: 4 },
      { ratingGroup: 'defense', attribute: 'tackling', weight: 3 },
    ],
    CB: [
      { ratingGroup: 'defense', attribute: 'zoneCoverage', weight: 5 },
      { ratingGroup: 'physical', attribute: 'speed', weight: 4 },
      { ratingGroup: 'defense', attribute: 'playRecognition', weight: 3 },
      { ratingGroup: 'defense', attribute: 'press', weight: 2 },
    ],
    FS: [
      { ratingGroup: 'defense', attribute: 'zoneCoverage', weight: 5 },
      { ratingGroup: 'physical', attribute: 'speed', weight: 4 },
      { ratingGroup: 'defense', attribute: 'playRecognition', weight: 4 },
    ],
    SS: [
      { ratingGroup: 'defense', attribute: 'zoneCoverage', weight: 4 },
      { ratingGroup: 'defense', attribute: 'tackling', weight: 3 },
      { ratingGroup: 'physical', attribute: 'speed', weight: 3 },
      { ratingGroup: 'defense', attribute: 'playRecognition', weight: 3 },
    ],
  },

  cover_2_tampa: {
    DE: [
      { ratingGroup: 'defense', attribute: 'passRush', weight: 5 },
      { ratingGroup: 'physical', attribute: 'speed', weight: 3 },
      { ratingGroup: 'defense', attribute: 'pursuit', weight: 3 },
    ],
    DT: [
      { ratingGroup: 'defense', attribute: 'passRush', weight: 4 },
      { ratingGroup: 'defense', attribute: 'blockShedding', weight: 4 },
      { ratingGroup: 'physical', attribute: 'strength', weight: 3 },
    ],
    NT: [
      { ratingGroup: 'physical', attribute: 'strength', weight: 5 },
      { ratingGroup: 'defense', attribute: 'blockShedding', weight: 4 },
      { ratingGroup: 'defense', attribute: 'passRush', weight: 2 },
    ],
    OLB: [
      { ratingGroup: 'defense', attribute: 'zoneCoverage', weight: 5 },
      { ratingGroup: 'defense', attribute: 'tackling', weight: 4 },
      { ratingGroup: 'physical', attribute: 'speed', weight: 3 },
      { ratingGroup: 'defense', attribute: 'pursuit', weight: 3 },
    ],
    ILB: [
      { ratingGroup: 'defense', attribute: 'zoneCoverage', weight: 4 },
      { ratingGroup: 'defense', attribute: 'tackling', weight: 4 },
      { ratingGroup: 'defense', attribute: 'playRecognition', weight: 3 },
      { ratingGroup: 'physical', attribute: 'speed', weight: 2 },
    ],
    MLB: [
      { ratingGroup: 'defense', attribute: 'zoneCoverage', weight: 5 },
      { ratingGroup: 'defense', attribute: 'tackling', weight: 4 },
      { ratingGroup: 'defense', attribute: 'playRecognition', weight: 4 },
      { ratingGroup: 'physical', attribute: 'speed', weight: 3 },
    ],
    CB: [
      { ratingGroup: 'defense', attribute: 'zoneCoverage', weight: 5 },
      { ratingGroup: 'defense', attribute: 'press', weight: 4 },
      { ratingGroup: 'physical', attribute: 'speed', weight: 3 },
      { ratingGroup: 'defense', attribute: 'tackling', weight: 2 },
    ],
    FS: [
      { ratingGroup: 'defense', attribute: 'zoneCoverage', weight: 5 },
      { ratingGroup: 'physical', attribute: 'speed', weight: 4 },
      { ratingGroup: 'defense', attribute: 'playRecognition', weight: 4 },
    ],
    SS: [
      { ratingGroup: 'defense', attribute: 'zoneCoverage', weight: 5 },
      { ratingGroup: 'physical', attribute: 'speed', weight: 4 },
      { ratingGroup: 'defense', attribute: 'tackling', weight: 3 },
      { ratingGroup: 'defense', attribute: 'playRecognition', weight: 3 },
    ],
  },

  multiple: {
    DE: [
      { ratingGroup: 'defense', attribute: 'passRush', weight: 3 },
      { ratingGroup: 'defense', attribute: 'blockShedding', weight: 3 },
      { ratingGroup: 'defense', attribute: 'tackling', weight: 3 },
      { ratingGroup: 'physical', attribute: 'speed', weight: 2 },
      { ratingGroup: 'physical', attribute: 'strength', weight: 2 },
    ],
    DT: [
      { ratingGroup: 'defense', attribute: 'blockShedding', weight: 3 },
      { ratingGroup: 'defense', attribute: 'passRush', weight: 3 },
      { ratingGroup: 'physical', attribute: 'strength', weight: 3 },
      { ratingGroup: 'defense', attribute: 'tackling', weight: 2 },
    ],
    NT: [
      { ratingGroup: 'physical', attribute: 'strength', weight: 4 },
      { ratingGroup: 'defense', attribute: 'blockShedding', weight: 4 },
      { ratingGroup: 'defense', attribute: 'tackling', weight: 2 },
    ],
    OLB: [
      { ratingGroup: 'defense', attribute: 'tackling', weight: 3 },
      { ratingGroup: 'defense', attribute: 'zoneCoverage', weight: 3 },
      { ratingGroup: 'defense', attribute: 'passRush', weight: 3 },
      { ratingGroup: 'physical', attribute: 'speed', weight: 3 },
    ],
    ILB: [
      { ratingGroup: 'defense', attribute: 'tackling', weight: 3 },
      { ratingGroup: 'defense', attribute: 'playRecognition', weight: 3 },
      { ratingGroup: 'defense', attribute: 'zoneCoverage', weight: 3 },
      { ratingGroup: 'defense', attribute: 'pursuit', weight: 2 },
    ],
    MLB: [
      { ratingGroup: 'defense', attribute: 'tackling', weight: 3 },
      { ratingGroup: 'defense', attribute: 'playRecognition', weight: 4 },
      { ratingGroup: 'defense', attribute: 'zoneCoverage', weight: 3 },
      { ratingGroup: 'defense', attribute: 'pursuit', weight: 3 },
    ],
    CB: [
      { ratingGroup: 'defense', attribute: 'manCoverage', weight: 3 },
      { ratingGroup: 'defense', attribute: 'zoneCoverage', weight: 3 },
      { ratingGroup: 'physical', attribute: 'speed', weight: 3 },
      { ratingGroup: 'defense', attribute: 'press', weight: 2 },
      { ratingGroup: 'defense', attribute: 'tackling', weight: 2 },
    ],
    FS: [
      { ratingGroup: 'defense', attribute: 'zoneCoverage', weight: 4 },
      { ratingGroup: 'defense', attribute: 'playRecognition', weight: 3 },
      { ratingGroup: 'physical', attribute: 'speed', weight: 3 },
      { ratingGroup: 'defense', attribute: 'tackling', weight: 2 },
    ],
    SS: [
      { ratingGroup: 'defense', attribute: 'tackling', weight: 3 },
      { ratingGroup: 'defense', attribute: 'zoneCoverage', weight: 3 },
      { ratingGroup: 'defense', attribute: 'manCoverage', weight: 3 },
      { ratingGroup: 'physical', attribute: 'strength', weight: 2 },
    ],
  },

  aggressive_blitz: {
    DE: [
      { ratingGroup: 'defense', attribute: 'passRush', weight: 5 },
      { ratingGroup: 'physical', attribute: 'speed', weight: 4 },
      { ratingGroup: 'defense', attribute: 'pursuit', weight: 3 },
      { ratingGroup: 'defense', attribute: 'hitPower', weight: 2 },
    ],
    DT: [
      { ratingGroup: 'defense', attribute: 'passRush', weight: 5 },
      { ratingGroup: 'defense', attribute: 'blockShedding', weight: 4 },
      { ratingGroup: 'physical', attribute: 'strength', weight: 3 },
    ],
    NT: [
      { ratingGroup: 'defense', attribute: 'passRush', weight: 4 },
      { ratingGroup: 'physical', attribute: 'strength', weight: 4 },
      { ratingGroup: 'defense', attribute: 'blockShedding', weight: 4 },
    ],
    OLB: [
      { ratingGroup: 'defense', attribute: 'passRush', weight: 5 },
      { ratingGroup: 'physical', attribute: 'speed', weight: 4 },
      { ratingGroup: 'defense', attribute: 'hitPower', weight: 3 },
      { ratingGroup: 'defense', attribute: 'pursuit', weight: 3 },
    ],
    ILB: [
      { ratingGroup: 'defense', attribute: 'passRush', weight: 4 },
      { ratingGroup: 'defense', attribute: 'tackling', weight: 3 },
      { ratingGroup: 'defense', attribute: 'hitPower', weight: 3 },
      { ratingGroup: 'physical', attribute: 'speed', weight: 3 },
    ],
    MLB: [
      { ratingGroup: 'defense', attribute: 'tackling', weight: 4 },
      { ratingGroup: 'defense', attribute: 'passRush', weight: 3 },
      { ratingGroup: 'defense', attribute: 'hitPower', weight: 3 },
      { ratingGroup: 'defense', attribute: 'playRecognition', weight: 3 },
    ],
    CB: [
      { ratingGroup: 'defense', attribute: 'manCoverage', weight: 5 },
      { ratingGroup: 'defense', attribute: 'press', weight: 4 },
      { ratingGroup: 'physical', attribute: 'speed', weight: 3 },
    ],
    FS: [
      { ratingGroup: 'defense', attribute: 'manCoverage', weight: 4 },
      { ratingGroup: 'defense', attribute: 'zoneCoverage', weight: 3 },
      { ratingGroup: 'physical', attribute: 'speed', weight: 3 },
      { ratingGroup: 'defense', attribute: 'tackling', weight: 2 },
    ],
    SS: [
      { ratingGroup: 'defense', attribute: 'tackling', weight: 4 },
      { ratingGroup: 'defense', attribute: 'hitPower', weight: 4 },
      { ratingGroup: 'defense', attribute: 'manCoverage', weight: 3 },
      { ratingGroup: 'physical', attribute: 'speed', weight: 2 },
    ],
  },
};
