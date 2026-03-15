/**
 * Draft prospect evaluation: base ScoutingReport plus draft-specific context.
 */

import type { DraftProspect, ScoutingReport } from '../types/player.js';
import type { OffensiveScheme, DefensiveScheme } from '../types/coach.js';
import { generateReport } from './ScoutingReportGenerator.js';

export interface ProspectEvaluation extends ScoutingReport {
  draftProjection: string;
  teamSchemeFit: number | null;   // 1.0-9.0 for team's current scheme, null if no scheme provided
  readinessTimeline: string;
}

function getDraftProjectionFromGradeRange(gradeRange: [number, number]): string {
  const mid = (gradeRange[0]! + gradeRange[1]!) / 2;
  if (mid >= 8.5) return 'Projected top-5 pick; generational talent';
  if (mid >= 7.5) return 'Projected 1st round';
  if (mid >= 6.75) return 'Projected late 1st / early 2nd round';
  if (mid >= 6.25) return 'Day 2 value (2nd-3rd round)';
  if (mid >= 5.75) return 'Day 3 candidate (4th-5th round)';
  if (mid >= 5.25) return 'Late round or priority free agent';
  return 'Priority free agent or camp invite';
}

function getReadinessTimeline(
  readyToContribute: ScoutingReport['readyToContribute'],
  footballCharacter: number,
  footballIQ: number,
): string {
  if (readyToContribute === 'day_one') return 'Week 1 starter potential';
  if (readyToContribute === 'year_two') return 'Needs roughly 1 year to learn NFL speed and scheme';
  if (readyToContribute === 'developmental') return 'Developmental; 1-2 years to contribute meaningfully';
  if (readyToContribute === 'project') return 'Project; needs time to develop';
  if (footballCharacter >= 70 && footballIQ >= 65) return 'Could contribute by year two';
  return 'Timeline unclear; more evaluation needed';
}

/**
 * Evaluate a draft prospect with team scheme context.
 */
export function evaluateProspect(
  prospect: DraftProspect,
  analyticsLevel: number,
  teamSchemes: { offense?: OffensiveScheme; defense?: DefensiveScheme },
  seed: number,
): ProspectEvaluation {
  const report = generateReport(prospect, analyticsLevel, seed);

  const draftProjection = getDraftProjectionFromGradeRange(report.gradeRange);

  let teamSchemeFit: number | null = null;
  const offense = teamSchemes.offense;
  const defense = teamSchemes.defense;
  const pos = prospect.position;
  const isOffensive = ['QB', 'RB', 'FB', 'WR', 'TE', 'LT', 'LG', 'C', 'RG', 'RT'].includes(pos);
  if (isOffensive && offense) {
    const entry = report.schemeFitGrades.find(g => g.scheme === offense);
    teamSchemeFit = entry?.fitGrade ?? null;
  } else if (!isOffensive && defense) {
    const entry = report.schemeFitGrades.find(g => g.scheme === defense);
    teamSchemeFit = entry?.fitGrade ?? null;
  }

  const readinessTimeline = getReadinessTimeline(
    report.readyToContribute,
    prospect.hidden.footballCharacter,
    prospect.personality.footballIQ,
  );

  return {
    ...report,
    draftProjection,
    teamSchemeFit,
    readinessTimeline,
  };
}
