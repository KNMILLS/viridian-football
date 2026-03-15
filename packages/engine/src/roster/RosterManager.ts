import type {
  Team, Player, Contract, PlayerId, TeamId, Position,
} from '../types/index.js';
import type { ICapEngine } from '../types/index.js';
import type { EventBus } from '../events/EventBus.js';
import type { GameEventMap } from '../events/GameEvents.js';
import {
  MAX_ACTIVE_ROSTER,
  MAX_PRACTICE_SQUAD,
  PS_MAX_ACCRUED_SEASONS,
  PS_VETERAN_SLOTS,
  IR_RETURN_LIMIT,
} from './constants.js';

// ── Types ──────────────────────────────────────────────────────────

export interface RosterValidation {
  valid: boolean;
  violations: string[];
}

export interface PSPoachResult {
  protectionWindowOpen: boolean;
  signed: boolean;
  newTeamId: TeamId | null;
}

// ── Roster Manager ─────────────────────────────────────────────────

export class RosterManager {
  private teams: Team[];
  private players: Player[];
  private contracts: Contract[];
  private bus: EventBus<GameEventMap>;
  private capEngine: ICapEngine;
  private irReturns: Map<string, number> = new Map();

  constructor(
    teams: Team[],
    players: Player[],
    contracts: Contract[],
    bus: EventBus<GameEventMap>,
    capEngine: ICapEngine,
  ) {
    this.teams = teams;
    this.players = players;
    this.contracts = contracts;
    this.bus = bus;
    this.capEngine = capEngine;
  }

  // ── Validation ─────────────────────────────────────────────────

  validateRoster(teamId: TeamId): RosterValidation {
    const team = this.findTeam(teamId);
    const violations: string[] = [];

    if (team.roster.length > MAX_ACTIVE_ROSTER) {
      violations.push(`Active roster size ${team.roster.length} exceeds limit of ${MAX_ACTIVE_ROSTER}`);
    }

    if (team.practiceSquad.length > MAX_PRACTICE_SQUAD) {
      violations.push(`Practice squad size ${team.practiceSquad.length} exceeds limit of ${MAX_PRACTICE_SQUAD}`);
    }

    return { valid: violations.length === 0, violations };
  }

  // ── Injured Reserve ────────────────────────────────────────────

  moveToIR(playerId: PlayerId, teamId: TeamId): void {
    const team = this.findTeam(teamId);
    const player = this.findPlayer(playerId);

    if (!player.injuryStatus) {
      throw new Error(`Player ${playerId} is not injured and cannot be placed on IR`);
    }

    const rosterIdx = team.roster.indexOf(playerId);
    if (rosterIdx === -1) {
      throw new Error(`Player ${playerId} is not on the active roster of team ${teamId}`);
    }

    team.roster.splice(rosterIdx, 1);
    team.injuredReserve.push(playerId);
  }

  activateFromIR(playerId: PlayerId, teamId: TeamId): void {
    const team = this.findTeam(teamId);
    const key = teamId as string;
    const used = this.irReturns.get(key) ?? 0;

    if (used >= IR_RETURN_LIMIT) {
      throw new Error(`Team ${teamId} has reached the IR return limit of ${IR_RETURN_LIMIT}`);
    }

    const irIdx = team.injuredReserve.indexOf(playerId);
    if (irIdx === -1) {
      throw new Error(`Player ${playerId} is not on IR for team ${teamId}`);
    }

    team.injuredReserve.splice(irIdx, 1);
    team.roster.push(playerId);
    this.irReturns.set(key, used + 1);
  }

  // ── Practice Squad ─────────────────────────────────────────────

  addToPracticeSquad(playerId: PlayerId, teamId: TeamId): void {
    const team = this.findTeam(teamId);
    const player = this.findPlayer(playerId);

    if (team.practiceSquad.length >= MAX_PRACTICE_SQUAD) {
      throw new Error(`Practice squad is full (${MAX_PRACTICE_SQUAD})`);
    }

    const currentVeterans = team.practiceSquad
      .map((pid) => this.players.find((p) => p.id === pid))
      .filter((p): p is Player => p != null && p.experience > PS_MAX_ACCRUED_SEASONS);

    if (player.experience > PS_MAX_ACCRUED_SEASONS && currentVeterans.length >= PS_VETERAN_SLOTS) {
      throw new Error(
        `Player ${playerId} has ${player.experience} accrued seasons and all ${PS_VETERAN_SLOTS} veteran PS slots are filled`,
      );
    }

    team.practiceSquad.push(playerId);
    player.teamId = teamId;
  }

  promotePracticeSquad(playerId: PlayerId, teamId: TeamId): void {
    const team = this.findTeam(teamId);

    if (team.roster.length >= MAX_ACTIVE_ROSTER) {
      throw new Error(`Cannot promote: active roster is full (${MAX_ACTIVE_ROSTER})`);
    }

    const psIdx = team.practiceSquad.indexOf(playerId);
    if (psIdx === -1) {
      throw new Error(`Player ${playerId} is not on the practice squad for team ${teamId}`);
    }

    team.practiceSquad.splice(psIdx, 1);
    team.roster.push(playerId);
  }

  /**
   * Handle another team attempting to sign a practice squad player.
   *
   * The original team gets a protection window; if they don't promote the
   * player within that window the poaching team signs them.
   */
  handlePSPoaching(
    playerId: PlayerId,
    poachingTeamId: TeamId,
    originalTeamId: TeamId,
    protectionExercised: boolean,
  ): PSPoachResult {
    const originalTeam = this.findTeam(originalTeamId);
    const player = this.findPlayer(playerId);

    if (protectionExercised) {
      const psIdx = originalTeam.practiceSquad.indexOf(playerId);
      if (psIdx !== -1 && originalTeam.roster.length < MAX_ACTIVE_ROSTER) {
        originalTeam.practiceSquad.splice(psIdx, 1);
        originalTeam.roster.push(playerId);
        return { protectionWindowOpen: false, signed: false, newTeamId: null };
      }
    }

    const psIdx = originalTeam.practiceSquad.indexOf(playerId);
    if (psIdx !== -1) {
      originalTeam.practiceSquad.splice(psIdx, 1);
    }

    const poachingTeam = this.findTeam(poachingTeamId);
    poachingTeam.roster.push(playerId);
    player.teamId = poachingTeamId;

    this.bus.emit('ROSTER_NEED_IDENTIFIED', {
      teamId: originalTeamId,
      position: player.position as string,
      urgency: 'medium',
    });

    return { protectionWindowOpen: false, signed: true, newTeamId: poachingTeamId };
  }

  // ── Release ────────────────────────────────────────────────────

  releasePlayer(playerId: PlayerId, teamId: TeamId, season: number): void {
    const team = this.findTeam(teamId);
    const player = this.findPlayer(playerId);
    const contract = this.contracts.find((c) => c.playerId === playerId && c.teamId === teamId && c.status === 'active');

    let deadMoney = 0;
    let capSavings = 0;

    if (contract) {
      deadMoney = this.capEngine.calculateDeadMoney(contract, season, 'pre_june1');
      const currentYear = contract.yearDetails.find((y) => y.season === season);
      capSavings = currentYear ? currentYear.capHit - deadMoney : 0;
      contract.status = 'voided';
    }

    const rosterIdx = team.roster.indexOf(playerId);
    if (rosterIdx !== -1) {
      team.roster.splice(rosterIdx, 1);
    }
    const psIdx = team.practiceSquad.indexOf(playerId);
    if (psIdx !== -1) {
      team.practiceSquad.splice(psIdx, 1);
    }

    player.teamId = null;
    player.contract = null;

    this.bus.emit('PLAYER_RELEASED', {
      playerId,
      teamId,
      deadMoney,
      capSavings,
    });
  }

  // ── Helpers ────────────────────────────────────────────────────

  private findTeam(id: TeamId): Team {
    const team = this.teams.find((t) => t.id === id);
    if (!team) throw new Error(`Team ${id} not found`);
    return team;
  }

  private findPlayer(id: PlayerId): Player {
    const player = this.players.find((p) => p.id === id);
    if (!player) throw new Error(`Player ${id} not found`);
    return player;
  }
}
