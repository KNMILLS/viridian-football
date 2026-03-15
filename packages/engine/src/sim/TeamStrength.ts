import type {
  Team, Player, Coach, Position, PositionGroup,
} from '../types/index.js';
import { clamp } from './RNG.js';

// ── Types ──────────────────────────────────────────────────────────

export interface TeamStrength {
  overall: number;
  offense: number;
  defense: number;
  specialTeams: number;
  coaching: number;
  homeFieldAdvantage: number;
}

// ── Position-group mapping ─────────────────────────────────────────

const POSITION_TO_GROUP: Record<Position, PositionGroup> = {
  QB: 'QB', RB: 'RB', FB: 'RB', WR: 'WR', TE: 'TE',
  LT: 'OL', LG: 'OL', C: 'OL', RG: 'OL', RT: 'OL',
  DE: 'DL', DT: 'DL', NT: 'DL',
  OLB: 'LB', ILB: 'LB', MLB: 'LB',
  CB: 'DB', FS: 'DB', SS: 'DB',
  K: 'K', P: 'P', LS: 'ST',
};

const OFFENSE_GROUPS: PositionGroup[] = ['QB', 'RB', 'WR', 'TE', 'OL'];
const DEFENSE_GROUPS: PositionGroup[] = ['DL', 'LB', 'DB'];

const OFFENSE_WEIGHTS: Record<string, number> = {
  QB: 0.30, RB: 0.12, WR: 0.22, TE: 0.10, OL: 0.26,
};

const DEFENSE_WEIGHTS: Record<string, number> = {
  DL: 0.35, LB: 0.30, DB: 0.35,
};

// ── Helpers ────────────────────────────────────────────────────────

function getPlayerRating(player: Player): number {
  const phys = player.physical;
  const basePhysical =
    (phys.speed + phys.acceleration + phys.strength + phys.agility + phys.stamina + phys.toughness) / 6;

  let skillRating = basePhysical;
  let skillCount = 1;

  if (player.passing) {
    const p = player.passing;
    skillRating += (p.throwPower + p.shortAccuracy + p.mediumAccuracy + p.deepAccuracy + p.throwOnRun + p.playAction) / 6;
    skillCount++;
  }
  if (player.rushing) {
    const r = player.rushing;
    skillRating += (r.carrying + r.breakTackle + r.elusiveness + r.ballCarrierVision + r.trucking) / 5;
    skillCount++;
  }
  if (player.receiving) {
    const r = player.receiving;
    skillRating += (r.catching + r.spectacularCatch + r.catchInTraffic + r.routeRunning + r.release) / 5;
    skillCount++;
  }
  if (player.blocking) {
    const b = player.blocking;
    skillRating += (b.runBlock + b.passBlock + b.impactBlock + b.awareness) / 4;
    skillCount++;
  }
  if (player.defense) {
    const d = player.defense;
    skillRating += (d.tackling + d.hitPower + d.pursuit + d.playRecognition + d.manCoverage + d.zoneCoverage + d.press + d.passRush + d.blockShedding) / 9;
    skillCount++;
  }
  if (player.kicking) {
    const k = player.kicking;
    skillRating += (k.kickPower + k.kickAccuracy) / 2;
    skillCount++;
  }
  if (player.punting) {
    const p = player.punting;
    skillRating += (p.puntPower + p.puntAccuracy) / 2;
    skillCount++;
  }

  return skillRating / skillCount;
}

function groupPlayers(
  team: Team,
  allPlayers: Player[],
): Map<PositionGroup, Player[]> {
  const rosterSet = new Set(team.roster);
  const onRoster = allPlayers.filter((p) => rosterSet.has(p.id));
  const groups = new Map<PositionGroup, Player[]>();

  for (const player of onRoster) {
    if (player.injuryStatus?.severity === 'season_ending') continue;

    const group = POSITION_TO_GROUP[player.position];
    if (!group) continue;
    const arr = groups.get(group) ?? [];
    arr.push(player);
    groups.set(group, arr);
  }

  return groups;
}

function groupRating(
  players: Player[],
  team: Team,
): number {
  if (players.length === 0) return 40;

  const depthPositions = Object.values(team.depthChart).flat();
  let total = 0;
  let weight = 0;

  for (const player of players) {
    const rating = getPlayerRating(player);
    const penalty = player.injuryStatus ? (1 - player.injuryStatus.performancePenalty) : 1;
    const depthIndex = depthPositions.indexOf(player.id);
    const isStarter = depthIndex >= 0 && depthIndex < 2;
    const w = isStarter ? 2.0 : 1.0;
    total += rating * penalty * w;
    weight += w;
  }

  return weight > 0 ? total / weight : 40;
}

// ── Main ───────────────────────────────────────────────────────────

export function calculateTeamStrength(
  team: Team,
  players: Player[],
  coaches: Coach[],
): TeamStrength {
  const groups = groupPlayers(team, players);

  let offense = 0;
  for (const g of OFFENSE_GROUPS) {
    const r = groupRating(groups.get(g) ?? [], team);
    offense += r * (OFFENSE_WEIGHTS[g] ?? 0);
  }

  let defense = 0;
  for (const g of DEFENSE_GROUPS) {
    const r = groupRating(groups.get(g) ?? [], team);
    defense += r * (DEFENSE_WEIGHTS[g] ?? 0);
  }

  const kPlayers = groups.get('K') ?? [];
  const pPlayers = groups.get('P') ?? [];
  const kRating = kPlayers.length > 0 ? getPlayerRating(kPlayers[0]!) : 40;
  const pRating = pPlayers.length > 0 ? getPlayerRating(pPlayers[0]!) : 40;
  const specialTeams = (kRating + pRating) / 2;

  const hc = coaches.find(
    (c) => c.role === 'HC' && c.teamId === team.id,
  );
  const coaching = hc
    ? (hc.attributes.playCalling + hc.attributes.gameManagement) / 20 * 10
    : 5;

  offense = clamp(offense, 0, 100);
  defense = clamp(defense, 0, 100);

  const overall = offense * 0.4 + defense * 0.4 + specialTeams * 0.1 + coaching;

  return {
    overall: clamp(overall, 0, 100),
    offense,
    defense,
    specialTeams: clamp(specialTeams, 0, 100),
    coaching: clamp(coaching, 0, 10),
    homeFieldAdvantage: 3,
  };
}
