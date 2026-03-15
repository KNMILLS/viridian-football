import type { DraftBoard, DraftBoardEntry } from '../types/draft.js';
import type { DraftProspect, ScoutingReport, Position } from '../types/player.js';
import type { TeamId, PlayerId } from '../types/ids.js';
import { clamp } from '../sim/RNG.js';

export interface BoardWeights {
  scouting: number;
  need: number;
  schemeFit: number;
}

const DEFAULT_WEIGHTS: BoardWeights = {
  scouting: 0.55,
  need: 0.25,
  schemeFit: 0.20,
};

export function generateTeamBoard(
  team: TeamId,
  prospects: DraftProspect[],
  scoutingReports: Map<PlayerId, ScoutingReport>,
  teamNeeds: Map<Position, number>,
  schemeFitData: Map<PlayerId, number>,
  weights: BoardWeights = DEFAULT_WEIGHTS,
): DraftBoard {
  const entries: DraftBoardEntry[] = [];

  for (const prospect of prospects) {
    const report = scoutingReports.get(prospect.id) ?? prospect.scoutingReport;

    const scoutingGrade = normalizeScoutingGrade(report);
    const needFit = teamNeeds.get(prospect.position) ?? 50;
    const schemeFitEstimate = schemeFitData.get(prospect.id) ?? estimateSchemeFit(report);

    const overallGrade = clamp(
      Math.round(
        scoutingGrade * weights.scouting +
        needFit * weights.need +
        schemeFitEstimate * weights.schemeFit,
      ),
      0,
      100,
    );

    entries.push({
      prospectId: prospect.id,
      teamRank: 0,
      scoutingReport: report,
      needFit,
      schemeFitEstimate,
      overallGrade,
    });
  }

  entries.sort((a, b) => b.overallGrade - a.overallGrade);
  entries.forEach((entry, idx) => { entry.teamRank = idx + 1; });

  return {
    teamId: team,
    rankings: entries,
  };
}

function normalizeScoutingGrade(report: ScoutingReport): number {
  if (report.overallGrade !== null) {
    return ((report.overallGrade - 4.0) / 5.0) * 100;
  }
  const midGrade = (report.gradeRange[0] + report.gradeRange[1]) / 2;
  return clamp(((midGrade - 4.0) / 5.0) * 100, 0, 100);
}

function estimateSchemeFit(report: ScoutingReport): number {
  if (report.schemeFitGrades.length === 0) return 50;
  const avg = report.schemeFitGrades.reduce((s, g) => s + g.fitGrade, 0) / report.schemeFitGrades.length;
  return clamp(Math.round(((avg - 4.0) / 5.0) * 100), 0, 100);
}
