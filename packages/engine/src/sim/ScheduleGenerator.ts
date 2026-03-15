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
  isDivision: boolean;
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
      out.push({ home: divTeams[i]!.id, away: divTeams[j]!.id, isDivision: true });
      out.push({ home: divTeams[j]!.id, away: divTeams[i]!.id, isDivision: true });
    }
  }
  return out;
}

function crossDivRoundRobin(groupA: Team[], groupB: Team[], rng: RNG): Matchup[] {
  const out: Matchup[] = [];
  for (const a of groupA) {
    for (const b of groupB) {
      out.push(
        chance(rng, 0.5)
          ? { home: a.id, away: b.id, isDivision: false }
          : { home: b.id, away: a.id, isDivision: false },
      );
    }
  }
  return out;
}

function sameFinishMatchup(a: Team, b: Team, rng: RNG): Matchup {
  return chance(rng, 0.5)
    ? { home: a.id, away: b.id, isDivision: false }
    : { home: b.id, away: a.id, isDivision: false };
}

// ── Penalty Evaluator ──────────────────────────────────────────────
//
// Scores a candidate schedule. Zero = all constraints satisfied.
// No pre-assigned byes — the evaluator discovers bye weeks from the
// active bitmasks and validates them against the bye window.
//
// Constraint weights:
//   10 000  team plays 2+ games in one week
//   10 000  team has != 1 bye week
//    5 000  bye falls outside [byeStart..byeEnd]
//    5 000  home games not in {8, 9}
//    5 000  division has all 4 teams on bye same week
//    1 000  bye week has <2 or >6 teams idle
//      500  >3 consecutive home games
//      500  >3 consecutive away games
//      200  >3 consecutive division games
//      300  <2 division games after week 10

const NUM_TEAMS = 32;
const NUM_DIVS = 8;

const DIV_IDX: Record<string, number> = {
  'AFC East': 0, 'AFC North': 1, 'AFC South': 2, 'AFC West': 3,
  'NFC East': 4, 'NFC North': 5, 'NFC South': 6, 'NFC West': 7,
};

function evaluatePenalty(
  numGames: number,
  weekOf: number[],
  numWeeks: number,
  homeI: Uint8Array,
  awayI: Uint8Array,
  divF: Uint8Array,
  divOf: Uint8Array,
  byeWindowStart: number,
  byeWindowEnd: number,
  act: number[],
  hom: number[],
  dvk: number[],
): number {
  let pen = 0;

  for (let i = 0; i < numWeeks; i++) { act[i] = 0; hom[i] = 0; dvk[i] = 0; }

  for (let g = 0; g < numGames; g++) {
    const w = weekOf[g]!;
    const hBit = 1 << homeI[g]!;
    const aBit = 1 << awayI[g]!;
    if ((act[w]! & (hBit | aBit)) !== 0) pen += 10000;
    act[w] = (act[w]! | hBit | aBit) | 0;
    hom[w] = (hom[w]! | hBit) | 0;
    if (divF[g]) dvk[w] = (dvk[w]! | hBit | aBit) | 0;
  }

  // Per-team: streaks, home balance, bye discovery
  for (let t = 0; t < NUM_TEAMS; t++) {
    const bit = 1 << t;
    let cH = 0;
    let cA = 0;
    let cD = 0;
    let lateDv = 0;
    let totalHome = 0;
    let byeCount = 0;
    let byeWeek = -1;

    for (let w = 0; w < numWeeks; w++) {
      if ((act[w]! & bit) !== 0) {
        if ((hom[w]! & bit) !== 0) { cH++; cA = 0; totalHome++; } else { cA++; cH = 0; }
        if ((dvk[w]! & bit) !== 0) { cD++; if (w >= 10) lateDv++; } else cD = 0;
      } else {
        byeCount++;
        byeWeek = w;
        cH = 0; cA = 0; cD = 0;
      }
      if (cH > 3) pen += 500;
      if (cA > 3) pen += 500;
      if (cD > 3) pen += 200;
    }

    if (lateDv < 2) pen += 300;
    if (totalHome !== 8 && totalHome !== 9) pen += 5000;
    if (byeCount !== 1) pen += 10000;
    if (byeCount === 1 && (byeWeek < byeWindowStart || byeWeek > byeWindowEnd)) pen += 5000;
  }

  // Per-week bye distribution inside the bye window
  for (let w = byeWindowStart; w <= byeWindowEnd; w++) {
    let weekByes = 0;
    const divByes = new Uint8Array(NUM_DIVS);
    for (let t = 0; t < NUM_TEAMS; t++) {
      if ((act[w]! & (1 << t)) === 0) {
        weekByes++;
        divByes[divOf[t]!] = (divByes[divOf[t]!] ?? 0) + 1;
      }
    }
    if (weekByes > 0 && (weekByes < 2 || weekByes > 6)) pen += 1000;
    for (let d = 0; d < NUM_DIVS; d++) {
      if (divByes[d]! >= 4) pen += 5000;
    }
  }

  return pen;
}

// ── Week Assignment (Simulated Annealing) ─────────────────────────
//
// No pre-assigned byes.  The greedy seeds games into all 18 weeks
// (17 games + 1 natural gap per team), then the annealer + VND
// polish the placement until every constraint is satisfied.
// Bye weeks are discovered from the final active bitmasks.

function assignToWeeks(
  matchups: Matchup[],
  numWeeks: number,
  byeStart: number,
  byeEnd: number,
  teams: Team[],
  rng: RNG,
): { weekGames: Matchup[][]; byeTeams: TeamId[][] } {
  const byeWindowStart = byeStart - 1;
  const byeWindowEnd = byeEnd - 1;
  const numGames = matchups.length;

  const teamIdx = new Map<string, number>();
  for (let i = 0; i < teams.length; i++) teamIdx.set(teams[i]!.id, i);

  const teamsByI = new Array<TeamId>(teams.length);
  for (let i = 0; i < teams.length; i++) teamsByI[teamIdx.get(teams[i]!.id)!] = teams[i]!.id;

  const homeI = new Uint8Array(numGames);
  const awayI = new Uint8Array(numGames);
  const divF = new Uint8Array(numGames);
  for (let g = 0; g < numGames; g++) {
    homeI[g] = teamIdx.get(matchups[g]!.home)!;
    awayI[g] = teamIdx.get(matchups[g]!.away)!;
    divF[g] = matchups[g]!.isDivision ? 1 : 0;
  }

  const divOf = new Uint8Array(teams.length);
  for (let i = 0; i < teams.length; i++) {
    divOf[teamIdx.get(teams[i]!.id)!] = DIV_IDX[teams[i]!.division]!;
  }

  const act = new Array<number>(numWeeks);
  const hom = new Array<number>(numWeeks);
  const dvk = new Array<number>(numWeeks);

  const evaluate = () =>
    evaluatePenalty(numGames, weekOf, numWeeks, homeI, awayI, divF, divOf,
                    byeWindowStart, byeWindowEnd, act, hom, dvk);

  // ── Greedy seed → annealing → VND (with restarts) ─────────────
  const MAX_RESTARTS = 5;
  const MAX_ITER = 500_000;
  const weekOf = new Array<number>(numGames).fill(0);

  for (let restart = 0; restart < MAX_RESTARTS; restart++) {
    // Greedy: 18 weeks available per team (17 games → 1 natural gap).
    // No bye blocking = zero-slack is impossible = no force-placements.
    const busy = new Array<number>(teams.length).fill(0);
    const order = shuffle(rng, Array.from({ length: numGames }, (_, i) => i));
    const weekArr = Array.from({ length: numWeeks }, (_, i) => i);

    for (const gi of order) {
      const h = homeI[gi]!;
      const a = awayI[gi]!;
      let placed = false;
      shuffle(rng, weekArr);
      for (const w of weekArr) {
        const wBit = 1 << w;
        if ((busy[h]! & wBit) !== 0 || (busy[a]! & wBit) !== 0) continue;
        weekOf[gi] = w;
        busy[h] = (busy[h]! | wBit) | 0;
        busy[a] = (busy[a]! | wBit) | 0;
        placed = true;
        break;
      }
      if (!placed) weekOf[gi] = Math.floor(rng() * numWeeks);
    }

    let penalty = evaluate();
    if (penalty === 0) break;

    // Simulated annealing — Swap / Move / Venue Flip
    let temperature = 10000;
    for (let iter = 0; iter < MAX_ITER && penalty > 0; iter++) {
      const roll = rng();

      if (roll < 0.4) {
        const g1 = Math.floor(rng() * numGames);
        const g2 = Math.floor(rng() * numGames);
        if (g1 === g2) { temperature *= 0.99998; continue; }
        const w1 = weekOf[g1]!;
        const w2 = weekOf[g2]!;
        if (w1 === w2) { temperature *= 0.99998; continue; }
        weekOf[g1] = w2;
        weekOf[g2] = w1;
        const np = evaluate();
        if (np - penalty <= 0 || rng() < Math.exp(-(np - penalty) / temperature)) {
          penalty = np;
        } else {
          weekOf[g1] = w1;
          weekOf[g2] = w2;
        }
      } else if (roll < 0.8) {
        const g1 = Math.floor(rng() * numGames);
        const oldW = weekOf[g1]!;
        const newW = Math.floor(rng() * numWeeks);
        if (oldW === newW) { temperature *= 0.99998; continue; }
        weekOf[g1] = newW;
        const np = evaluate();
        if (np - penalty <= 0 || rng() < Math.exp(-(np - penalty) / temperature)) {
          penalty = np;
        } else {
          weekOf[g1] = oldW;
        }
      } else {
        const g1 = Math.floor(rng() * numGames);
        if (divF[g1]) { temperature *= 0.99998; continue; }
        const tmpH = homeI[g1]!;
        homeI[g1] = awayI[g1]!;
        awayI[g1] = tmpH;
        const np = evaluate();
        if (np - penalty <= 0 || rng() < Math.exp(-(np - penalty) / temperature)) {
          penalty = np;
        } else {
          const rv = homeI[g1]!;
          homeI[g1] = awayI[g1]!;
          awayI[g1] = rv;
        }
      }

      temperature *= 0.99998;
    }

    if (penalty === 0) break;

    // ── Variable Neighborhood Descent (polish) ───────────────────
    let vndPass = 30;
    while (vndPass-- > 0 && penalty > 0) {
      let improved = false;

      for (let g = 0; g < numGames && penalty > 0; g++) {
        const origW = weekOf[g]!;
        for (let w = 0; w < numWeeks; w++) {
          if (w === origW) continue;
          weekOf[g] = w;
          const np = evaluate();
          if (np < penalty) { penalty = np; improved = true; break; }
          weekOf[g] = origW;
        }
      }

      for (let g = 0; g < numGames && penalty > 0; g++) {
        if (divF[g]) continue;
        const oH = homeI[g]!;
        const oA = awayI[g]!;
        homeI[g] = oA;
        awayI[g] = oH;
        const np = evaluate();
        if (np < penalty) { penalty = np; improved = true; } else { homeI[g] = oH; awayI[g] = oA; }
      }

      if (!improved) {
        for (let g1 = 0; g1 < numGames && penalty > 0; g1++) {
          let found = false;
          for (let g2 = g1 + 1; g2 < numGames; g2++) {
            const w1 = weekOf[g1]!;
            const w2 = weekOf[g2]!;
            if (w1 === w2) continue;
            weekOf[g1] = w2;
            weekOf[g2] = w1;
            const np = evaluate();
            if (np < penalty) { penalty = np; improved = true; found = true; break; }
            weekOf[g1] = w1;
            weekOf[g2] = w2;
          }
          if (found) break;
        }
      }

      if (!improved) break;
    }

    if (penalty === 0) break;
  }

  // ── Build output: sync venues, discover byes from active masks ─
  const weekGames: Matchup[][] = Array.from({ length: numWeeks }, () => []);
  for (let i = 0; i < numWeeks; i++) act[i] = 0;
  for (let g = 0; g < numGames; g++) {
    matchups[g]!.home = teamsByI[homeI[g]!]!;
    matchups[g]!.away = teamsByI[awayI[g]!]!;
    weekGames[weekOf[g]!]!.push(matchups[g]!);
    act[weekOf[g]!] = (act[weekOf[g]!]! | (1 << homeI[g]!) | (1 << awayI[g]!)) | 0;
  }

  const byeTeams: TeamId[][] = Array.from({ length: numWeeks }, () => []);
  for (let w = 0; w < numWeeks; w++) {
    for (let t = 0; t < teams.length; t++) {
      if ((act[w]! & (1 << t)) === 0) byeTeams[w]!.push(teamsByI[t]!);
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
