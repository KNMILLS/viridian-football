import type { TeamId } from '../types/ids.js';
import type { Team, Division, Conference } from '../types/team.js';
import type { WeekSchedule, ScheduledGame, LeagueSettings } from '../types/league.js';
import { shuffle, randomInt, chance, type RNG } from './RNG.js';

// ── Constants ──────────────────────────────────────────────────────

const AFC_DIVS: Division[] = ['AFC East', 'AFC North', 'AFC South', 'AFC West'];
const NFC_DIVS: Division[] = ['NFC East', 'NFC North', 'NFC South', 'NFC West'];

// The 3 ways to pair 4 divisions into 2 pairs (used for intra-conference rotation)
const INTRA_CONF_PAIRINGS: [number, number][][] = [
  [[0, 1], [2, 3]],
  [[0, 2], [1, 3]],
  [[0, 3], [1, 2]],
];

// ── Helpers ────────────────────────────────────────────────────────

interface Matchup {
  home: TeamId;
  away: TeamId;
}

function teamsByDivision(teams: Team[]): Map<Division, Team[]> {
  const map = new Map<Division, Team[]>();
  for (const t of teams) {
    const arr = map.get(t.division) ?? [];
    arr.push(t);
    map.set(t.division, arr);
  }
  return map;
}

function pairKey(a: TeamId, b: TeamId): string {
  return a < b ? `${a}|${b}` : `${b}|${a}`;
}

// ── Matchup Generators ─────────────────────────────────────────────

function divisionMatchups(divTeams: Team[]): Matchup[] {
  const out: Matchup[] = [];
  for (let i = 0; i < divTeams.length; i++) {
    for (let j = i + 1; j < divTeams.length; j++) {
      out.push({ home: divTeams[i]!.id, away: divTeams[j]!.id });
      out.push({ home: divTeams[j]!.id, away: divTeams[i]!.id });
    }
  }
  return out;
}

function crossDivRoundRobin(groupA: Team[], groupB: Team[], rng: RNG): Matchup[] {
  const out: Matchup[] = [];
  for (const a of groupA) {
    for (const b of groupB) {
      out.push(chance(rng, 0.5) ? { home: a.id, away: b.id } : { home: b.id, away: a.id });
    }
  }
  return out;
}

function sameFinishMatchup(a: Team, b: Team, rng: RNG): Matchup {
  return chance(rng, 0.5) ? { home: a.id, away: b.id } : { home: b.id, away: a.id };
}

// ── Week Assignment ────────────────────────────────────────────────

function assignToWeeks(
  matchups: Matchup[],
  numWeeks: number,
  byeStart: number,
  byeEnd: number,
  teams: Team[],
  rng: RNG,
): { weekGames: Matchup[][]; byeTeams: TeamId[][] } {
  const weekGames: Matchup[][] = Array.from({ length: numWeeks }, () => []);
  const byeTeams: TeamId[][] = Array.from({ length: numWeeks }, () => []);
  const teamWeeks = new Map<string, Set<number>>();
  for (const t of teams) teamWeeks.set(t.id, new Set());

  // Sort: most-constrained matchups first (teams with most existing games)
  // Then process each one into the first available week
  const pool = [...matchups];
  shuffle(rng, pool);

  // Process division games first (they have parallel edges: home-and-away)
  const isDivGame = (m: Matchup) => {
    const ht = teams.find((t) => t.id === m.home);
    const at = teams.find((t) => t.id === m.away);
    return ht && at && ht.division === at.division;
  };
  const divGames = pool.filter(isDivGame);
  const otherGames = pool.filter((m) => !isDivGame(m));

  const unplaced: Matchup[] = [];

  for (const m of [...divGames, ...otherGames]) {
    const hWeeks = teamWeeks.get(m.home)!;
    const aWeeks = teamWeeks.get(m.away)!;

    let bestW = -1;
    for (let w = 0; w < numWeeks; w++) {
      if (hWeeks.has(w) || aWeeks.has(w)) continue;
      bestW = w;
      break;
    }

    if (bestW >= 0) {
      weekGames[bestW]!.push(m);
      hWeeks.add(bestW);
      aWeeks.add(bestW);
    } else {
      unplaced.push(m);
    }
  }

  // Repair unplaced games via augmenting-path swaps
  for (const m of unplaced) {
    const hWeeks = teamWeeks.get(m.home)!;
    const aWeeks = teamWeeks.get(m.away)!;
    let placed = false;

    // Helper to move a game from one week to another
    const moveGame = (game: Matchup, from: number, to: number) => {
      weekGames[from] = weekGames[from]!.filter((g) => g !== game);
      teamWeeks.get(game.home)!.delete(from);
      teamWeeks.get(game.away)!.delete(from);
      weekGames[to]!.push(game);
      teamWeeks.get(game.home)!.add(to);
      teamWeeks.get(game.away)!.add(to);
    };

    // Try: find a free week for A (home), then move B's blocker out of that week
    const freeForHome = [];
    const freeForAway = [];
    for (let w = 0; w < numWeeks; w++) {
      if (!hWeeks.has(w)) freeForHome.push(w);
      if (!aWeeks.has(w)) freeForAway.push(w);
    }

    // Direct placement
    for (const w of freeForHome) {
      if (!aWeeks.has(w)) {
        weekGames[w]!.push(m);
        hWeeks.add(w);
        aWeeks.add(w);
        placed = true;
        break;
      }
    }
    if (placed) continue;

    // Single swap: A is free in week fA, B is busy. Move B's game out.
    for (const fA of freeForHome) {
      if (placed) break;
      const blocker = weekGames[fA]!.find(
        (g) => g.home === m.away || g.away === m.away,
      );
      if (!blocker) continue;
      const bh = teamWeeks.get(blocker.home)!;
      const ba = teamWeeks.get(blocker.away)!;
      for (let altW = 0; altW < numWeeks; altW++) {
        if (altW === fA) continue;
        if (bh.has(altW) || ba.has(altW)) continue;
        moveGame(blocker, fA, altW);
        weekGames[fA]!.push(m);
        hWeeks.add(fA);
        aWeeks.add(fA);
        placed = true;
        break;
      }
    }
    if (placed) continue;

    // Single swap: B is free in week fB, A is busy. Move A's game out.
    for (const fB of freeForAway) {
      if (placed) break;
      const blocker = weekGames[fB]!.find(
        (g) => g.home === m.home || g.away === m.home,
      );
      if (!blocker) continue;
      const bh = teamWeeks.get(blocker.home)!;
      const ba = teamWeeks.get(blocker.away)!;
      for (let altW = 0; altW < numWeeks; altW++) {
        if (altW === fB) continue;
        if (bh.has(altW) || ba.has(altW)) continue;
        moveGame(blocker, fB, altW);
        weekGames[fB]!.push(m);
        hWeeks.add(fB);
        aWeeks.add(fB);
        placed = true;
        break;
      }
    }
    if (placed) continue;

    // Double swap: find week fA where A free, B plays C.
    // Move B-C to week fB where B free, A plays D.
    // That requires: C free in fB.
    // Then move A-D from fB to fA. That requires: D free in fA (which D might be).
    // Alternatively: just move B-C from fA to some other week where both B,C free.
    // Then place A-B in fA.
    // If that doesn't work, try the reverse.
    for (const fA of freeForHome) {
      if (placed) break;
      const bBlocker = weekGames[fA]!.find(
        (g) => g.home === m.away || g.away === m.away,
      );
      if (!bBlocker) continue;

      const bbh = teamWeeks.get(bBlocker.home)!;
      const bba = teamWeeks.get(bBlocker.away)!;

      // Can we bump bBlocker's opponent's game from some week to make room?
      for (let midW = 0; midW < numWeeks; midW++) {
        if (midW === fA) continue;
        if (bbh.has(midW) && !bba.has(midW)) {
          // bBlocker.home is busy in midW, bBlocker.away is free
          const innerBlocker = weekGames[midW]!.find(
            (g) => g.home === bBlocker.home || g.away === bBlocker.home,
          );
          if (!innerBlocker) continue;
          const ibh = teamWeeks.get(innerBlocker.home)!;
          const iba = teamWeeks.get(innerBlocker.away)!;
          for (let altW = 0; altW < numWeeks; altW++) {
            if (altW === midW || altW === fA) continue;
            if (ibh.has(altW) || iba.has(altW)) continue;
            moveGame(innerBlocker, midW, altW);
            moveGame(bBlocker, fA, midW);
            weekGames[fA]!.push(m);
            hWeeks.add(fA);
            aWeeks.add(fA);
            placed = true;
            break;
          }
          if (placed) break;
        }
        if (!bbh.has(midW) && bba.has(midW)) {
          const innerBlocker = weekGames[midW]!.find(
            (g) => g.home === bBlocker.away || g.away === bBlocker.away,
          );
          if (!innerBlocker) continue;
          const ibh = teamWeeks.get(innerBlocker.home)!;
          const iba = teamWeeks.get(innerBlocker.away)!;
          for (let altW = 0; altW < numWeeks; altW++) {
            if (altW === midW || altW === fA) continue;
            if (ibh.has(altW) || iba.has(altW)) continue;
            moveGame(innerBlocker, midW, altW);
            moveGame(bBlocker, fA, midW);
            weekGames[fA]!.push(m);
            hWeeks.add(fA);
            aWeeks.add(fA);
            placed = true;
            break;
          }
          if (placed) break;
        }
      }
    }
  }

  const divSets = new Map<Division, Set<string>>();
  for (const t of teams) {
    const s = divSets.get(t.division) ?? new Set();
    s.add(t.id);
    divSets.set(t.division, s);
  }

  for (const t of teams) {
    const u = teamWeeks.get(t.id)!;
    for (let w = byeStart - 1; w <= byeEnd - 1 && w < numWeeks; w++) {
      if (u.has(w)) continue;
      const divIds = divSets.get(t.division)!;
      if (byeTeams[w]!.filter((id) => divIds.has(id)).length >= 3) continue;
      byeTeams[w]!.push(t.id);
      break;
    }
  }

  return { weekGames, byeTeams };
}

// ── Public API ─────────────────────────────────────────────────────

export function generateSchedule(
  teams: Team[],
  season: number,
  settings: LeagueSettings,
  rng: RNG,
): WeekSchedule[] {
  const divMap = teamsByDivision(teams);
  const schedule: WeekSchedule[] = [];
  const target = settings.regularSeasonGames; // 17

  // ── Preseason ──────────────────────────────────────────────────
  for (let pw = 0; pw < settings.preseasonGames; pw++) {
    const games: ScheduledGame[] = [];
    const available = shuffle(rng, [...teams]);
    const paired = new Set<string>();

    for (let i = 0; i < available.length; i++) {
      const t1 = available[i]!;
      if (paired.has(t1.id)) continue;
      for (let j = i + 1; j < available.length; j++) {
        const t2 = available[j]!;
        if (paired.has(t2.id)) continue;
        games.push({ homeTeamId: t1.id, awayTeamId: t2.id, isPlayed: false });
        paired.add(t1.id);
        paired.add(t2.id);
        break;
      }
    }

    schedule.push({ season, week: pw + 1, phase: 'preseason', games, byeTeams: [] });
  }

  // ── Regular Season Matchup Pool ────────────────────────────────
  const all: Matchup[] = [];
  const nonDivUsed = new Set<string>();

  // 1. Divisional: 6 games per team (home-and-away vs 3 division rivals)
  for (const [, dt] of divMap) {
    all.push(...divisionMatchups(dt));
  }

  // 2. Intra-conference rotation: 4 games (full round-robin vs paired division)
  const pairingIdx = season % INTRA_CONF_PAIRINGS.length;
  const pairing = INTRA_CONF_PAIRINGS[pairingIdx]!;

  for (const confDivs of [AFC_DIVS, NFC_DIVS]) {
    for (const [i, j] of pairing) {
      const divA = divMap.get(confDivs[i]!) ?? [];
      const divB = divMap.get(confDivs[j]!) ?? [];
      for (const m of crossDivRoundRobin(divA, divB, rng)) {
        const pk = pairKey(m.home, m.away);
        if (!nonDivUsed.has(pk)) { nonDivUsed.add(pk); all.push(m); }
      }
    }
  }

  // 3. Cross-conference rotation: 4 games (full round-robin vs paired NFC division)
  const crossShift = season % 4;
  for (let i = 0; i < 4; i++) {
    const afcDiv = divMap.get(AFC_DIVS[i]!) ?? [];
    const nfcDiv = divMap.get(NFC_DIVS[(i + crossShift) % 4]!) ?? [];
    for (const m of crossDivRoundRobin(afcDiv, nfcDiv, rng)) {
      const pk = pairKey(m.home, m.away);
      if (!nonDivUsed.has(pk)) { nonDivUsed.add(pk); all.push(m); }
    }
  }

  // 4. Same-finish intra-conference: 2 games
  //    Each team plays the same-ranked team from the 2 same-conference divisions
  //    that are NOT in the intra-conference rotation pairing.
  for (const confDivs of [AFC_DIVS, NFC_DIVS]) {
    for (let d = 0; d < confDivs.length; d++) {
      const myDiv = divMap.get(confDivs[d]!) ?? [];
      // Find which division we're already paired with in intra-conf rotation
      let pairedDivIdx = -1;
      for (const [pi, pj] of pairing) {
        if (pi === d) { pairedDivIdx = pj; break; }
        if (pj === d) { pairedDivIdx = pi; break; }
      }

      const remainingDivIdxs = [0, 1, 2, 3].filter((x) => x !== d && x !== pairedDivIdx);

      for (let rank = 0; rank < myDiv.length; rank++) {
        const team = myDiv[rank]!;
        for (const targetIdx of remainingDivIdxs) {
          const targetDiv = divMap.get(confDivs[targetIdx]!) ?? [];
          const opponent = targetDiv[rank];
          if (!opponent) continue;
          const pk = pairKey(team.id, opponent.id);
          if (nonDivUsed.has(pk)) continue;
          nonDivUsed.add(pk);
          all.push(sameFinishMatchup(team, opponent, rng));
        }
      }
    }
  }

  // 5. Same-finish cross-conference: 1 game (the 17th game)
  //    AFC[i] plays NFC[(i + crossShift + 1) % 4] — guaranteed unique per division
  //    and different from the cross-conf rotation partner at NFC[(i + crossShift) % 4].
  for (let i = 0; i < 4; i++) {
    const afcDiv = divMap.get(AFC_DIVS[i]!) ?? [];
    const targetNfcIdx = (i + crossShift + 1) % 4;
    const nfcDiv = divMap.get(NFC_DIVS[targetNfcIdx]!) ?? [];

    for (let rank = 0; rank < afcDiv.length; rank++) {
      const afcTeam = afcDiv[rank]!;
      const nfcTeam = nfcDiv[rank];
      if (!nfcTeam) continue;
      const pk = pairKey(afcTeam.id, nfcTeam.id);
      if (nonDivUsed.has(pk)) continue;
      nonDivUsed.add(pk);
      all.push(sameFinishMatchup(afcTeam, nfcTeam, rng));
    }
  }

  // ── Assign to weeks ────────────────────────────────────────────
  const numWeeks = target + 1;
  const { weekGames, byeTeams } = assignToWeeks(all, numWeeks, 5, 14, teams, rng);

  for (let w = 0; w < numWeeks; w++) {
    schedule.push({
      season,
      week: w + 1,
      phase: 'regular',
      games: weekGames[w]!.map((m) => ({
        homeTeamId: m.home,
        awayTeamId: m.away,
        isPlayed: false,
      })),
      byeTeams: byeTeams[w]!,
    });
  }

  return schedule;
}

// ── Playoff Schedule ───────────────────────────────────────────────

export interface PlayoffMatchup {
  homeSeed: number;
  awaySeed: number;
  homeTeamId: TeamId;
  awayTeamId: TeamId;
}

export function generatePlayoffSchedule(
  afcSeeds: { seed: number; teamId: TeamId }[],
  nfcSeeds: { seed: number; teamId: TeamId }[],
  season: number,
): WeekSchedule[] {
  const wildCardGames: ScheduledGame[] = [];

  for (const seeds of [afcSeeds, nfcSeeds]) {
    const s = (n: number) => seeds.find((x) => x.seed === n)!;
    wildCardGames.push(
      { homeTeamId: s(2).teamId, awayTeamId: s(7).teamId, isPlayed: false },
      { homeTeamId: s(3).teamId, awayTeamId: s(6).teamId, isPlayed: false },
      { homeTeamId: s(4).teamId, awayTeamId: s(5).teamId, isPlayed: false },
    );
  }

  return [
    { season, week: 1, phase: 'postseason', games: wildCardGames, byeTeams: [] },
    { season, week: 2, phase: 'postseason', games: [], byeTeams: [] },
    { season, week: 3, phase: 'postseason', games: [], byeTeams: [] },
    { season, week: 4, phase: 'postseason', games: [], byeTeams: [] },
  ];
}
