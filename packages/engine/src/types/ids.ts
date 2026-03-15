/**
 * Branded ID types for type safety across the engine.
 * Prevents accidentally passing a PlayerId where a TeamId is expected.
 */

declare const __brand: unique symbol;
type Brand<T, B extends string> = T & { readonly [__brand]: B };

export type TeamId = Brand<string, 'TeamId'>;
export type PlayerId = Brand<string, 'PlayerId'>;
export type CoachId = Brand<string, 'CoachId'>;
export type DraftPickId = Brand<string, 'DraftPickId'>;
export type LeagueId = Brand<string, 'LeagueId'>;
export type UserId = Brand<string, 'UserId'>;
export type ContractId = Brand<string, 'ContractId'>;

export type LeagueWeek = {
  season: number;
  week: number;
  phase: 'preseason' | 'regular' | 'postseason' | 'offseason';
};

export function teamId(id: string): TeamId {
  return id as TeamId;
}
export function playerId(id: string): PlayerId {
  return id as PlayerId;
}
export function coachId(id: string): CoachId {
  return id as CoachId;
}
export function draftPickId(id: string): DraftPickId {
  return id as DraftPickId;
}
export function leagueId(id: string): LeagueId {
  return id as LeagueId;
}
export function userId(id: string): UserId {
  return id as UserId;
}
export function contractId(id: string): ContractId {
  return id as ContractId;
}
