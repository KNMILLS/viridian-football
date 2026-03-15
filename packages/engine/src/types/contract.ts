import type { PlayerId, TeamId, ContractId } from './ids.js';

// ── Contract Types ──────────────────────────────────────────────────

export type ContractStatus = 'active' | 'expired' | 'voided' | 'restructured';

export interface Contract {
  id: ContractId;
  playerId: PlayerId;
  teamId: TeamId;
  status: ContractStatus;

  totalValue: number;
  totalGuaranteed: number;
  years: number;
  signingBonus: number;

  yearDetails: ContractYear[];

  hasNoTradeClause: boolean;
  hasNoTagClause: boolean;
  voidYears: number;

  signedDate: { season: number; week: number };
}

export interface ContractYear {
  year: number;          // contract year (1-indexed)
  season: number;        // league season this applies to
  baseSalary: number;
  capHit: number;
  deadMoney: number;     // dead cap if released before/during this year
  signingBonusProration: number;
  rosterBonus: number;
  optionBonus: number;
  incentives: ContractIncentive[];
  isVoidYear: boolean;
  guaranteed: boolean;
  guaranteeType: 'full' | 'injury' | 'skill' | 'none';
}

export interface ContractIncentive {
  description: string;
  value: number;
  type: 'LTBE' | 'NLTBE';  // Likely/Not Likely To Be Earned
  condition: IncentiveCondition;
  achieved: boolean;
}

export type IncentiveCondition =
  | { kind: 'pro_bowl' }
  | { kind: 'all_pro' }
  | { kind: 'games_played'; threshold: number }
  | { kind: 'snap_percentage'; threshold: number }
  | { kind: 'stat_threshold'; stat: string; threshold: number }
  | { kind: 'playoff_appearance' }
  | { kind: 'super_bowl_win' };

// ── Franchise Tag ───────────────────────────────────────────────────

export type FranchiseTagType = 'exclusive' | 'non_exclusive' | 'transition';

export interface FranchiseTag {
  playerId: PlayerId;
  teamId: TeamId;
  type: FranchiseTagType;
  salary: number;
  season: number;
  consecutiveYears: number; // 1st, 2nd, or 3rd time tagged
}

// ── Cap State ───────────────────────────────────────────────────────

export interface TeamCapState {
  teamId: TeamId;
  season: number;
  salaryCap: number;
  totalCapCommitted: number;
  capSpace: number;
  deadMoney: number;

  topFiveCapHits: { playerId: PlayerId; capHit: number }[];

  projections: CapProjection[];
}

export interface CapProjection {
  season: number;
  committedCap: number;
  projectedCap: number;      // league-wide cap estimate
  estimatedSpace: number;
  expiringContracts: PlayerId[];
}

// ── Restructure Options ─────────────────────────────────────────────

export type RestructureAction =
  | { kind: 'convert_to_bonus'; playerId: PlayerId; amount: number }
  | { kind: 'add_void_years'; playerId: PlayerId; years: number }
  | { kind: 'extend'; playerId: PlayerId; years: number; newSalary: number }
  | { kind: 'pay_cut'; playerId: PlayerId; newSalary: number }
  | { kind: 'release'; playerId: PlayerId; designation: 'pre_june1' | 'post_june1' }
  | { kind: 'trade'; playerId: PlayerId; targetTeamId: TeamId };

// ── Compensatory Pick Formula ───────────────────────────────────────

export interface CompPickCandidate {
  playerId: PlayerId;
  previousTeamId: TeamId;
  newTeamId: TeamId;
  annualSalary: number;
  snapPercentage: number;
  postseasonHonors: string[];
  cfaRanking: number;
  projectedRound: 3 | 4 | 5 | 6 | 7 | null;
}

// ── Cap Engine Interface ────────────────────────────────────────────

export interface ICapEngine {
  getTeamCapState(teamId: TeamId, season: number): TeamCapState;
  calculateDeadMoney(contract: Contract, cutYear: number, designation: 'pre_june1' | 'post_june1'): number;
  validateCapCompliance(teamId: TeamId, season: number): { compliant: boolean; overBy: number };
  projectCap(teamId: TeamId, seasons: number): CapProjection[];
  applyRestructure(action: RestructureAction): Contract;
  calculateCompPicks(season: number): CompPickCandidate[];
  getFranchiseTagCost(position: string, tagType: FranchiseTagType, season: number): number;
}
