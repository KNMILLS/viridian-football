import type {
  Coach, CoachRole, Team, Player, PlayerId, TeamId, CoachId,
  OwnerProfile, TeamRecord, ICoachingEngine, League,
  OffensiveScheme, DefensiveScheme,
} from '../types/index.js';
import type { EventBus } from '../events/EventBus.js';
import type {
  GameEventMap,
  CoachFiredPayload,
  CoachHiredPayload,
  SchemeChangedPayload,
} from '../events/GameEvents.js';
import type { RNG } from '../sim/RNG.js';
import { createLCG, randomInt, clamp, chance } from '../sim/RNG.js';
import { COACHING_INTERVIEW_MAX } from './constants.js';

// ── Types ──────────────────────────────────────────────────────────

export interface CoachEvaluation {
  shouldFire: boolean;
  confidence: number;
  reasons: string[];
}

export interface FireResult {
  deadMoney: number;
  moraleEffects: { playerId: PlayerId; delta: number }[];
}

export interface InterviewResult {
  candidateId: CoachId;
  impression: number;
  schemeFit: number;
  prefersOtherJob: boolean;
}

export interface CarouselResult {
  firings: CoachFiredPayload[];
  hirings: CoachHiredPayload[];
  schemeChanges: SchemeChangedPayload[];
}

// ── Coaching Hire Engine ───────────────────────────────────────────

export class CoachingHireEngine {
  private coaches: Coach[];
  private teams: Team[];
  private players: Player[];
  private bus: EventBus<GameEventMap>;
  private coachingEngine: ICoachingEngine;
  private rng: RNG;

  constructor(
    coaches: Coach[],
    teams: Team[],
    players: Player[],
    bus: EventBus<GameEventMap>,
    coachingEngine: ICoachingEngine,
    rng: RNG,
  ) {
    this.coaches = coaches;
    this.teams = teams;
    this.players = players;
    this.bus = bus;
    this.coachingEngine = coachingEngine;
    this.rng = rng;
  }

  // ── Performance Evaluation ─────────────────────────────────────

  evaluateCoachPerformance(
    coach: Coach,
    teamRecord: TeamRecord,
    ownerExpectations: OwnerProfile,
  ): CoachEvaluation {
    const reasons: string[] = [];
    let firePressure = 0;

    const winPct = totalGames(teamRecord) > 0
      ? teamRecord.wins / totalGames(teamRecord)
      : 0;

    // Base expectation: owner patience sets the bar
    const expectedWinPct = 0.35 + (ownerExpectations.patience / 100) * 0.2;

    if (winPct < expectedWinPct) {
      firePressure += (expectedWinPct - winPct) * 100;
      reasons.push(`Win rate ${(winPct * 100).toFixed(0)}% below expectation ${(expectedWinPct * 100).toFixed(0)}%`);
    }

    // Consecutive losing: coach record as a proxy
    const careerWinPct = (coach.record.wins + coach.record.losses + coach.record.ties) > 0
      ? coach.record.wins / (coach.record.wins + coach.record.losses + coach.record.ties)
      : 0.5;
    if (careerWinPct < 0.4) {
      firePressure += 15;
      reasons.push('Career losing record');
    }

    // Playoff success buys patience
    if (coach.playoffAppearances > 0) {
      firePressure -= coach.playoffAppearances * 5;
    }
    if (coach.championships > 0) {
      firePressure -= coach.championships * 15;
    }

    // Owner patience modulates pressure
    firePressure *= (1 - ownerExpectations.patience / 200);

    const shouldFire = firePressure > 20;
    const confidence = clamp(firePressure / 50, 0, 1);

    return { shouldFire, confidence, reasons };
  }

  // ── Fire Coach ─────────────────────────────────────────────────

  fireCoach(coachId: CoachId, teamId: TeamId): FireResult {
    const coach = this.coaches.find((c) => c.id === coachId);
    if (!coach) throw new Error(`Coach ${coachId} not found`);

    const team = this.teams.find((t) => t.id === teamId);
    if (!team) throw new Error(`Team ${teamId} not found`);

    const deadMoney = coach.salary * coach.contractYearsRemaining;

    const reason = `Fired after ${coach.record.wins}-${coach.record.losses} record`;
    this.bus.emit('COACH_FIRED', {
      coachId,
      teamId,
      role: coach.role,
      reason,
    });

    // Morale effects on loyal players
    const teamPlayers = this.players.filter((p) => p.teamId === teamId);
    const moraleEffects: { playerId: PlayerId; delta: number }[] = [];

    for (const player of teamPlayers) {
      if (player.personality.loyalty > 70) {
        const delta = -Math.round((player.personality.loyalty - 50) / 10);
        moraleEffects.push({ playerId: player.id, delta });
      }
    }

    // Remove from team
    coach.teamId = null;
    const staffIdx = team.coachingStaff.indexOf(coachId);
    if (staffIdx !== -1) team.coachingStaff.splice(staffIdx, 1);
    if (team.headCoachId === coachId) team.headCoachId = null;

    return { deadMoney, moraleEffects };
  }

  // ── Candidate Pool ─────────────────────────────────────────────

  generateCandidatePool(
    role: CoachRole,
    availableCoaches: Coach[],
    seed: number,
  ): Coach[] {
    const poolRng = createLCG(seed);
    const baseCandidates = this.coachingEngine.generateCandidatePool(role);

    // Add coordinators from other teams who could be poached
    const coordinators = this.coaches.filter(
      (c) =>
        c.teamId != null &&
        (c.role === 'OC' || c.role === 'DC') &&
        role === 'HC',
    );

    const eligibleCoordinators = coordinators.filter(
      (c) => c.yearsExperience >= 3 && c.attributes.schemeDesign >= 60,
    );

    // Retreads: previously fired HCs now available
    const retreads = availableCoaches.filter(
      (c) => c.role === 'HC' && c.teamId === null && c.yearsExperience >= 5,
    );

    const combined = [...baseCandidates, ...eligibleCoordinators, ...retreads];

    // Deduplicate by ID
    const seen = new Set<string>();
    const unique: Coach[] = [];
    for (const c of combined) {
      const key = c.id as string;
      if (!seen.has(key)) {
        seen.add(key);
        unique.push(c);
      }
    }

    return unique.slice(0, COACHING_INTERVIEW_MAX + randomInt(poolRng, 0, 5));
  }

  // ── Interview ──────────────────────────────────────────────────

  conductInterview(
    _teamId: TeamId,
    candidateId: CoachId,
  ): InterviewResult {
    const candidate = this.coaches.find((c) => c.id === candidateId);
    if (!candidate) throw new Error(`Candidate ${candidateId} not found`);

    const baseImpression =
      (candidate.attributes.gameManagement +
        candidate.attributes.playerDevelopment +
        candidate.attributes.schemeDesign) / 3;

    const impressionVariance = (this.rng() - 0.5) * 20;
    const impression = clamp(baseImpression + impressionVariance, 0, 100);

    const schemeFit = candidate.attributes.schemeDesign;

    // Some candidates prefer other destinations
    const prefersOtherJob = chance(this.rng, 0.2 + (candidate.personality.ego / 200));

    return {
      candidateId,
      impression: Math.round(impression),
      schemeFit,
      prefersOtherJob,
    };
  }

  // ── Hire Coach ─────────────────────────────────────────────────

  hireCoach(coachId: CoachId, teamId: TeamId, role: CoachRole): void {
    const coach = this.coaches.find((c) => c.id === coachId);
    if (!coach) throw new Error(`Coach ${coachId} not found`);

    const team = this.teams.find((t) => t.id === teamId);
    if (!team) throw new Error(`Team ${teamId} not found`);

    const previousCoach = team.headCoachId
      ? this.coaches.find((c) => c.id === team.headCoachId)
      : null;

    coach.teamId = teamId;
    coach.role = role;
    team.coachingStaff.push(coachId);
    if (role === 'HC') team.headCoachId = coachId;

    const scheme = coach.offensiveScheme ?? coach.defensiveScheme ?? 'unknown';
    this.bus.emit('COACH_HIRED', {
      coachId,
      teamId,
      role,
      scheme,
    });

    // Check for scheme changes and emit cascading events
    if (previousCoach) {
      if (
        coach.offensiveScheme &&
        previousCoach.offensiveScheme &&
        coach.offensiveScheme !== previousCoach.offensiveScheme
      ) {
        this.bus.emit('SCHEME_CHANGED', {
          teamId,
          side: 'offense',
          oldScheme: previousCoach.offensiveScheme,
          newScheme: coach.offensiveScheme,
        });
        this.emitSchemeFitUpdates(teamId);
      }

      if (
        coach.defensiveScheme &&
        previousCoach.defensiveScheme &&
        coach.defensiveScheme !== previousCoach.defensiveScheme
      ) {
        this.bus.emit('SCHEME_CHANGED', {
          teamId,
          side: 'defense',
          oldScheme: previousCoach.defensiveScheme,
          newScheme: coach.defensiveScheme,
        });
        this.emitSchemeFitUpdates(teamId);
      }
    }
  }

  // ── Full Coaching Carousel ─────────────────────────────────────

  simulateCoachingCarousel(league: League, seed: number): CarouselResult {
    const carouselRng = createLCG(seed);
    const firings: CoachFiredPayload[] = [];
    const hirings: CoachHiredPayload[] = [];
    const schemeChanges: SchemeChangedPayload[] = [];

    // Phase 1: Evaluate and fire
    const teamsWithCoaches = league.teams.filter((t) => t.headCoachId != null);
    for (const team of teamsWithCoaches) {
      const hc = this.coaches.find((c) => c.id === team.headCoachId);
      if (!hc) continue;

      const evaluation = this.evaluateCoachPerformance(hc, team.record, team.owner);
      if (evaluation.shouldFire) {
        const result = this.fireCoach(hc.id, team.id);
        firings.push({
          coachId: hc.id,
          teamId: team.id,
          role: hc.role,
          reason: evaluation.reasons.join('; '),
        });
      }
    }

    // Phase 2: Teams hire in priority order (worst record first)
    const vacantTeams = league.teams
      .filter((t) => t.headCoachId === null)
      .sort((a, b) => {
        const aWinPct = totalGames(a.record) > 0 ? a.record.wins / totalGames(a.record) : 0;
        const bWinPct = totalGames(b.record) > 0 ? b.record.wins / totalGames(b.record) : 0;
        return aWinPct - bWinPct;
      });

    const firedCoaches = this.coaches.filter((c) => c.teamId === null);
    const pool = this.generateCandidatePool('HC', firedCoaches, seed + 1);

    // Ensure pool candidates are discoverable by conductInterview
    for (const candidate of pool) {
      if (!this.coaches.some((c) => c.id === candidate.id)) {
        this.coaches.push(candidate);
      }
    }

    // Track scheme change events
    const schemeHandler = (payload: SchemeChangedPayload) => {
      schemeChanges.push(payload);
    };
    const unsub = this.bus.on('SCHEME_CHANGED', schemeHandler);

    for (const team of vacantTeams) {
      if (pool.length === 0) break;

      // Interview top candidates
      const interviewCount = Math.min(pool.length, COACHING_INTERVIEW_MAX);
      let bestCandidate: Coach | null = null;
      let bestImpression = -1;

      for (let i = 0; i < interviewCount; i++) {
        const candidate = pool[i]!;
        const interview = this.conductInterview(team.id, candidate.id);
        if (!interview.prefersOtherJob && interview.impression > bestImpression) {
          bestImpression = interview.impression;
          bestCandidate = candidate;
        }
      }

      if (!bestCandidate) {
        bestCandidate = pool[0]!;
      }

      this.hireCoach(bestCandidate.id, team.id, 'HC');
      hirings.push({
        coachId: bestCandidate.id,
        teamId: team.id,
        role: 'HC',
        scheme: bestCandidate.offensiveScheme ?? bestCandidate.defensiveScheme ?? 'unknown',
      });

      // Remove hired coach from pool
      const poolIdx = pool.findIndex((c) => c.id === bestCandidate!.id);
      if (poolIdx !== -1) pool.splice(poolIdx, 1);
    }

    unsub();

    return { firings, hirings, schemeChanges };
  }

  // ── Private Helpers ────────────────────────────────────────────

  private emitSchemeFitUpdates(teamId: TeamId): void {
    const teamPlayers = this.players.filter((p) => p.teamId === teamId);
    const hc = this.teams.find((t) => t.id === teamId)?.headCoachId;
    if (!hc) return;

    for (const player of teamPlayers) {
      const fitResult = this.coachingEngine.calculateSchemeFit(
        player.id as string,
        hc as string,
      );

      this.bus.emit('SCHEME_FIT_UPDATED', {
        playerId: player.id,
        teamId,
        fitScore: fitResult.fitScore,
        previousFitScore: 50,
      });
    }
  }
}

// ── Helpers ─────────────────────────────────────────────────────────

function totalGames(record: TeamRecord): number {
  return record.wins + record.losses + record.ties;
}
