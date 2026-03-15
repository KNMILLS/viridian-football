import type { Player, DepthChart, Position, PlayerId, DraftPick, PositionGroup } from '../types/index.js';
import { getPositionGroup } from '../injury/InjuryEngine.js';
import { Position as PositionEnum } from '../types/index.js';

// ── Auto Depth Chart ───────────────────────────────────────────────

export function autoDepthChart(players: Player[]): DepthChart {
  const chart = {} as DepthChart;

  for (const pos of PositionEnum.options) {
    chart[pos] = [];
  }

  for (const player of players) {
    chart[player.position].push(player.id);
  }

  for (const pos of PositionEnum.options) {
    const ids = chart[pos];
    ids.sort((a, b) => {
      const pa = players.find((p) => p.id === a);
      const pb = players.find((p) => p.id === b);
      return (pb?.hidden.trueOverall ?? 0) - (pa?.hidden.trueOverall ?? 0);
    });
  }

  return chart;
}

// ── Auto Practice Squad ────────────────────────────────────────────

export function autoPracticeSquad(players: Player[], maxSize: number = 16): PlayerId[] {
  return players
    .filter((p) => p.experience <= 2)
    .sort((a, b) => b.hidden.ceilingFloor[1] - a.hidden.ceilingFloor[1])
    .slice(0, maxSize)
    .map((p) => p.id);
}

// ── Auto Waiver Claims ─────────────────────────────────────────────

export function autoWaiverClaims(
  rosterPlayers: Player[],
  availablePlayers: Player[],
): PlayerId | null {
  const needPosition = findWeakestPositionGroup(rosterPlayers);
  if (!needPosition) return null;

  const candidates = availablePlayers
    .filter((p) => getPositionGroup(p.position) === needPosition)
    .sort((a, b) => b.hidden.trueOverall - a.hidden.trueOverall);

  return candidates[0]?.id ?? null;
}

// ── Auto Training Camp Cuts ────────────────────────────────────────

export function autoTrainingCampCuts(
  players: Player[],
  rosterLimit: number,
): PlayerId[] {
  if (players.length <= rosterLimit) return [];

  const sorted = [...players].sort(
    (a, b) => a.hidden.trueOverall - b.hidden.trueOverall,
  );

  const cutCount = players.length - rosterLimit;
  return sorted.slice(0, cutCount).map((p) => p.id);
}

// ── Auto Scouting Assignments ──────────────────────────────────────

export function autoScoutingAssignments(
  rosterPlayers: Player[],
  _draftPicks: DraftPick[],
): PositionGroup[] {
  const groups = groupByPosition(rosterPlayers);
  const avgByGroup = new Map<PositionGroup, number>();

  for (const [group, groupPlayers] of groups.entries()) {
    if (groupPlayers.length === 0) {
      avgByGroup.set(group, 0);
      continue;
    }
    const avg =
      groupPlayers.reduce((sum, p) => sum + p.hidden.trueOverall, 0) / groupPlayers.length;
    avgByGroup.set(group, avg);
  }

  return [...avgByGroup.entries()]
    .sort((a, b) => a[1] - b[1])
    .map(([group]) => group);
}

// ── Helpers ────────────────────────────────────────────────────────

function findWeakestPositionGroup(players: Player[]): PositionGroup | null {
  const groups = groupByPosition(players);
  let weakest: PositionGroup | null = null;
  let lowestAvg = Infinity;

  for (const [group, groupPlayers] of groups.entries()) {
    if (groupPlayers.length === 0) return group;
    const avg =
      groupPlayers.reduce((sum, p) => sum + p.hidden.trueOverall, 0) / groupPlayers.length;
    if (avg < lowestAvg) {
      lowestAvg = avg;
      weakest = group;
    }
  }

  return weakest;
}

function groupByPosition(players: Player[]): Map<PositionGroup, Player[]> {
  const groups = new Map<PositionGroup, Player[]>();
  const allGroups: PositionGroup[] = ['QB', 'RB', 'WR', 'TE', 'OL', 'DL', 'LB', 'DB', 'K', 'P', 'ST'];
  for (const g of allGroups) {
    groups.set(g, []);
  }
  for (const player of players) {
    const group = getPositionGroup(player.position);
    groups.get(group)!.push(player);
  }
  return groups;
}
