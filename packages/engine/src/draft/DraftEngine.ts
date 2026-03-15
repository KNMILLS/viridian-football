import { createLCG, weightedChoice, randomInt, clamp } from '../sim/RNG.js';
import type { RNG } from '../sim/RNG.js';
import type { EventBus } from '../events/EventBus.js';
import type { GameEventMap, SeasonEndPayload, PlayerStatsPayload } from '../events/GameEvents.js';
import type {
  DraftPick, DraftState, DraftSelection, CombineEvent,
  DraftBoardEntry, IDraftEngine,
} from '../types/draft.js';
import type { DraftProspect, ScoutingReport, Position } from '../types/player.js';
import type { PlayerId, TeamId } from '../types/ids.js';
import type { Team } from '../types/team.js';
import { generateDraftClass } from './DraftClassGenerator.js';
import { generateInitialReport, conductScoutingVisit, type VisitType } from './ScoutingSystem.js';
import { runCombine as runCombineSim } from './CombineSimulator.js';
import { generateTeamBoard, type BoardWeights } from './DraftBoard.js';
import { getPickValue, getPickValueWithContext } from './pickValueChart.js';
import { resolveConditions, type SeasonData } from './ConditionalPickResolver.js';

export class DraftEngine implements IDraftEngine {
  private bus: EventBus<GameEventMap>;
  private prospects: Map<PlayerId, DraftProspect> = new Map();
  private teamReports: Map<string, ScoutingReport> = new Map();
  private playerStatAccumulator: Map<PlayerId, Record<string, number>> = new Map();
  private unsubscribers: (() => void)[] = [];

  constructor(bus: EventBus<GameEventMap>) {
    this.bus = bus;
    this.unsubscribers.push(
      bus.on('PLAYER_STATS', (payload) => this.onPlayerStats(payload)),
    );
  }

  private reportKey(teamId: TeamId, prospectId: PlayerId): string {
    return `${teamId}::${prospectId}`;
  }

  generateDraftClass(season: number, seed: number): DraftProspect[] {
    const prospects = generateDraftClass(season, seed);
    this.prospects.clear();
    this.teamReports.clear();
    for (const p of prospects) {
      this.prospects.set(p.id, p);
    }
    return prospects;
  }

  initializeTeamReports(teamId: TeamId, analyticsLevel: number, seed: number): void {
    const rng = createLCG(seed);
    for (const prospect of this.prospects.values()) {
      const reportSeed = Math.abs(Math.round(rng() * 2147483646));
      const report = generateInitialReport(prospect, analyticsLevel, reportSeed);
      this.teamReports.set(this.reportKey(teamId, prospect.id), report);
    }
  }

  conductScoutingVisit(teamId: TeamId, prospectId: PlayerId, visitType?: VisitType, seed?: number): ScoutingReport {
    const prospect = this.prospects.get(prospectId);
    if (!prospect) throw new Error(`Prospect ${prospectId} not found`);

    const key = this.reportKey(teamId, prospectId);
    const existing = this.teamReports.get(key) ?? prospect.scoutingReport;
    const visit = visitType ?? 'film_review';
    const visitSeed = seed ?? Date.now();

    const updated = conductScoutingVisit(prospect, existing, visit, visitSeed, this.bus, teamId);
    this.teamReports.set(key, updated);
    return updated;
  }

  runCombine(season: number, seed?: number): CombineEvent {
    const combineSeed = seed ?? season * 7919;
    const prospectList = Array.from(this.prospects.values());
    return runCombineSim(prospectList, season, combineSeed);
  }

  evaluateProspect(teamId: TeamId, prospectId: PlayerId): DraftBoardEntry {
    const prospect = this.prospects.get(prospectId);
    if (!prospect) throw new Error(`Prospect ${prospectId} not found`);

    const key = this.reportKey(teamId, prospectId);
    const report = this.teamReports.get(key) ?? prospect.scoutingReport;

    const scoutingGrade = normalizeGrade(report);
    const schemeFitEstimate = estimateSchemeFit(report);

    return {
      prospectId,
      teamRank: 0,
      scoutingReport: report,
      needFit: 50,
      schemeFitEstimate,
      overallGrade: Math.round(scoutingGrade * 0.6 + schemeFitEstimate * 0.4),
    };
  }

  getPickValue(round: number, pick: number): number {
    return getPickValue(round, pick);
  }

  getPickValueWithContext(
    round: number,
    pick: number,
    options?: { isQB?: boolean; yearsOut?: number },
  ): number {
    return getPickValueWithContext(round, pick, options);
  }

  executePick(
    draftState: DraftState,
    teamId: TeamId,
    prospectId: PlayerId,
  ): DraftState {
    const prospect = this.prospects.get(prospectId);
    if (!prospect) throw new Error(`Prospect ${prospectId} not found`);
    if (!draftState.availableProspects.includes(prospectId)) {
      throw new Error(`Prospect ${prospectId} is not available`);
    }

    const selection: DraftSelection = {
      pickId: `pick-${draftState.currentRound}-${draftState.currentPick}` as any,
      teamId,
      playerId: prospectId,
      round: draftState.currentRound,
      overall: (draftState.currentRound - 1) * 32 + draftState.currentPick,
    };

    this.bus.emit('PLAYER_DRAFTED', {
      playerId: prospectId,
      teamId,
      round: selection.round,
      pick: draftState.currentPick,
      overall: selection.overall,
    });

    const newAvailable = draftState.availableProspects.filter(id => id !== prospectId);
    const newPicks = [...draftState.picks, selection];

    let nextPick = draftState.currentPick + 1;
    let nextRound = draftState.currentRound;
    if (nextPick > 32) {
      nextPick = 1;
      nextRound++;
    }

    const isComplete = nextRound > 7;

    return {
      ...draftState,
      currentRound: isComplete ? 7 : nextRound,
      currentPick: isComplete ? 32 : nextPick,
      picks: newPicks,
      availableProspects: newAvailable,
      isComplete,
    };
  }

  executeUDFASignings(
    remainingProspects: DraftProspect[],
    teams: Team[],
    seed: number,
  ): Map<TeamId, DraftProspect[]> {
    const rng = createLCG(seed);
    const signings = new Map<TeamId, DraftProspect[]>();

    for (const team of teams) {
      signings.set(team.id, []);
    }

    for (const prospect of remainingProspects) {
      const teamScores = teams.map(team => ({
        item: team,
        weight: computeUDFAAttractiveness(prospect, team, rng),
      }));

      const chosenTeam = weightedChoice(rng, teamScores);
      signings.get(chosenTeam.id)!.push(prospect);
    }

    return signings;
  }

  generateTeamBoard(
    teamId: TeamId,
    teamNeeds: Map<Position, number>,
    schemeFitData: Map<PlayerId, number>,
    weights?: BoardWeights,
  ) {
    const prospects = Array.from(this.prospects.values());
    const reports = new Map<PlayerId, ScoutingReport>();
    for (const p of prospects) {
      const key = this.reportKey(teamId, p.id);
      reports.set(p.id, this.teamReports.get(key) ?? p.scoutingReport);
    }
    return generateTeamBoard(teamId, prospects, reports, teamNeeds, schemeFitData, weights);
  }

  resolveConditionalPicks(picks: DraftPick[], seasonData: SeasonData): DraftPick[] {
    return resolveConditions(picks, seasonData);
  }

  getProspect(id: PlayerId): DraftProspect | undefined {
    return this.prospects.get(id);
  }

  getAllProspects(): DraftProspect[] {
    return Array.from(this.prospects.values());
  }

  dispose(): void {
    for (const unsub of this.unsubscribers) unsub();
    this.unsubscribers = [];
  }

  private onPlayerStats(payload: PlayerStatsPayload): void {
    const existing = this.playerStatAccumulator.get(payload.playerId) ?? {};
    for (const [stat, value] of Object.entries(payload.stats)) {
      existing[stat] = (existing[stat] ?? 0) + value;
    }
    this.playerStatAccumulator.set(payload.playerId, existing);
  }
}

function normalizeGrade(report: ScoutingReport): number {
  if (report.overallGrade !== null) {
    return ((report.overallGrade - 4.0) / 5.0) * 100;
  }
  const mid = (report.gradeRange[0] + report.gradeRange[1]) / 2;
  return clamp(((mid - 4.0) / 5.0) * 100, 0, 100);
}

function estimateSchemeFit(report: ScoutingReport): number {
  if (report.schemeFitGrades.length === 0) return 50;
  const avg = report.schemeFitGrades.reduce((s, g) => s + g.fitGrade, 0) / report.schemeFitGrades.length;
  return clamp(Math.round(((avg - 4.0) / 5.0) * 100), 0, 100);
}

function computeUDFAAttractiveness(prospect: DraftProspect, team: Team, rng: RNG): number {
  let score = 10;

  score += team.facilitiesLevel * 5;

  if (prospect.personality.fameSeeking > 60) {
    score += team.facilitiesLevel * 3;
  }

  if (prospect.personality.greed > 60) {
    score += Math.round(team.scoutingBudget / 1_000_000);
  }

  if (prospect.personality.familyOriented > 60) {
    score += randomInt(rng, 0, 15);
  }

  score += randomInt(rng, 0, 10);

  return Math.max(1, score);
}
