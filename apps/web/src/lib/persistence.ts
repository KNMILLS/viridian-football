import type { League } from '../../../../packages/engine/src/types/index.js';
import { createServiceSupabaseClient } from './supabase/server.js';

type PersistResult = { ok: true } | { ok: false; error: string };

/**
 * Placeholder persistence adapter.
 * TODO: map engine entities to Supabase schema (leagues, teams, players, coaches, contracts, picks, prospects, scouting_reports, games).
 */
export async function saveLeagueState(_state: League): Promise<PersistResult> {
  try {
    // Service-role client avoids RLS friction for server-side writes.
    createServiceSupabaseClient();
    return { ok: true };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'unknown error';
    return { ok: false, error: message };
  }
}

export async function loadLeagueState(_leagueId: string): Promise<League | null> {
  // Stub: wire to Supabase fetches in next iteration.
  return null;
}

export async function advanceWeek(_leagueId: string): Promise<PersistResult> {
  // Stub: load → run SeasonOrchestrator → save.
  return { ok: true };
}
