/**
 * Default progression/regression curves for each position.
 * Based on realistic NFL aging patterns.
 *
 * - growthRate: base annual attribute improvement during growth phase
 * - declineRate: base annual attribute decline after peak phase
 */

import type { ProgressionCurve, Position } from '../types/player.js';

export const defaultCurves: Record<Position, ProgressionCurve> = {
  // Quarterbacks peak late and decline slowly (mental game offsets physical loss)
  QB:  { position: 'QB',  peakAgeStart: 27, peakAgeEnd: 35, growthRate: 2.0, declineRate: 1.5 },

  // Running backs have short careers; quick growth, steep decline
  RB:  { position: 'RB',  peakAgeStart: 24, peakAgeEnd: 27, growthRate: 3.0, declineRate: 3.5 },
  FB:  { position: 'FB',  peakAgeStart: 24, peakAgeEnd: 27, growthRate: 3.0, declineRate: 3.5 },

  // Wide receivers peak in late 20s
  WR:  { position: 'WR',  peakAgeStart: 26, peakAgeEnd: 30, growthRate: 2.5, declineRate: 2.0 },

  // Tight ends develop slower (dual role) but sustain longer
  TE:  { position: 'TE',  peakAgeStart: 26, peakAgeEnd: 31, growthRate: 2.0, declineRate: 2.0 },

  // Offensive linemen peak late and hold steady
  LT:  { position: 'LT',  peakAgeStart: 27, peakAgeEnd: 33, growthRate: 1.5, declineRate: 1.5 },
  LG:  { position: 'LG',  peakAgeStart: 27, peakAgeEnd: 33, growthRate: 1.5, declineRate: 1.5 },
  C:   { position: 'C',   peakAgeStart: 27, peakAgeEnd: 33, growthRate: 1.5, declineRate: 1.5 },
  RG:  { position: 'RG',  peakAgeStart: 27, peakAgeEnd: 33, growthRate: 1.5, declineRate: 1.5 },
  RT:  { position: 'RT',  peakAgeStart: 27, peakAgeEnd: 33, growthRate: 1.5, declineRate: 1.5 },

  // Defensive linemen: strength-dependent, moderate window
  DE:  { position: 'DE',  peakAgeStart: 26, peakAgeEnd: 31, growthRate: 2.0, declineRate: 2.5 },
  DT:  { position: 'DT',  peakAgeStart: 26, peakAgeEnd: 31, growthRate: 2.0, declineRate: 2.5 },
  NT:  { position: 'NT',  peakAgeStart: 26, peakAgeEnd: 31, growthRate: 2.0, declineRate: 2.5 },

  // Linebackers: athletic and instinct blend
  OLB: { position: 'OLB', peakAgeStart: 25, peakAgeEnd: 30, growthRate: 2.5, declineRate: 2.0 },
  ILB: { position: 'ILB', peakAgeStart: 25, peakAgeEnd: 30, growthRate: 2.5, declineRate: 2.0 },
  MLB: { position: 'MLB', peakAgeStart: 25, peakAgeEnd: 30, growthRate: 2.5, declineRate: 2.0 },

  // Cornerbacks: speed-dependent, short peak window
  CB:  { position: 'CB',  peakAgeStart: 25, peakAgeEnd: 29, growthRate: 2.5, declineRate: 3.0 },

  // Safeties: slightly longer window than CBs
  FS:  { position: 'FS',  peakAgeStart: 26, peakAgeEnd: 30, growthRate: 2.0, declineRate: 2.5 },
  SS:  { position: 'SS',  peakAgeStart: 26, peakAgeEnd: 30, growthRate: 2.0, declineRate: 2.5 },

  // Specialists: very long careers, minimal change
  K:   { position: 'K',   peakAgeStart: 27, peakAgeEnd: 36, growthRate: 1.0, declineRate: 1.0 },
  P:   { position: 'P',   peakAgeStart: 27, peakAgeEnd: 36, growthRate: 1.0, declineRate: 1.0 },
  LS:  { position: 'LS',  peakAgeStart: 27, peakAgeEnd: 36, growthRate: 0.5, declineRate: 0.5 },
};
