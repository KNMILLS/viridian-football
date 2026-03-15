import { describe, it, expect, vi } from 'vitest';
import { CapEngine } from '../../src/cap/CapEngine.js';
import { EventBus } from '../../src/events/EventBus.js';
import type { GameEventMap } from '../../src/events/GameEvents.js';
import type {
  Contract,
  ContractYear,
  FranchiseTag,
} from '../../src/types/contract.js';
import type { Player } from '../../src/types/player.js';
import type { Team } from '../../src/types/team.js';
import type { TeamId, PlayerId, ContractId } from '../../src/types/ids.js';
import {
  teamId,
  playerId,
  contractId,
} from '../../src/types/ids.js';
import { createLCG } from '../../src/sim/RNG.js';
import {
  BASE_SALARY_CAP,
  CAP_GROWTH_RATE,
  TAG_ESCALATOR_2ND,
  TAG_ESCALATOR_3RD,
} from '../../src/cap/constants.js';

// ── Helpers ───────────────────────────────────────────────────────────

function makeContractYear(
  overrides: Partial<ContractYear> = {},
  year = 1,
  season = 1,
): ContractYear {
  return {
    year,
    season,
    baseSalary: 5_000_000,
    capHit: 7_000_000,
    deadMoney: 0,
    signingBonusProration: 2_000_000,
    rosterBonus: 0,
    optionBonus: 0,
    incentives: [],
    isVoidYear: false,
    guaranteed: false,
    guaranteeType: 'none',
    ...overrides,
  };
}

function makeContract(overrides: Partial<Contract> = {}): Contract {
  return {
    id: contractId('c1'),
    playerId: playerId('p1'),
    teamId: teamId('t1'),
    status: 'active',
    totalValue: 35_000_000,
    totalGuaranteed: 20_000_000,
    years: 3,
    signingBonus: 6_000_000,
    yearDetails: [
      makeContractYear({}, 1, 1),
      makeContractYear({}, 2, 2),
      makeContractYear({}, 3, 3),
    ],
    hasNoTradeClause: false,
    hasNoTagClause: false,
    voidYears: 0,
    signedDate: { season: 1, week: 1 },
    ...overrides,
  };
}

function makePlayer(overrides: Partial<Player> = {}): Player {
  return {
    id: playerId('p1'),
    firstName: 'Test',
    lastName: 'Player',
    age: 26,
    position: 'QB',
    secondaryPositions: [],
    teamId: teamId('t1'),
    jerseyNumber: 12,
    experience: 4,
    college: 'State U',
    draftYear: 1,
    draftRound: 1,
    draftPick: 1,
    physical: {
      speed: 80, acceleration: 80, strength: 70,
      agility: 75, jumping: 70, stamina: 85, toughness: 80,
    },
    personality: {
      leadership: 70, workEthic: 75, ego: 50,
      coachability: 70, competitiveness: 80, composure: 75, loyalty: 60,
    },
    hidden: {
      trueOverall: 82, injuryProneness: 30, clutchFactor: 70,
      consistencyVariance: 10, ceilingFloor: [70, 92],
    },
    contract: null,
    injuryStatus: null,
    careerStats: {},
    seasonStats: {},
    ...overrides,
  } as Player;
}

const EMPTY_TEAMS: Team[] = [];
const EMPTY_TAGS: FranchiseTag[] = [];

function makeBus(): EventBus<GameEventMap> {
  return new EventBus<GameEventMap>();
}

// ── Tests ─────────────────────────────────────────────────────────────

describe('CapEngine', () => {
  // ── Dead money calculation ────────────────────────────────────────

  describe('calculateDeadMoney', () => {
    it('pre-June 1: accelerates all remaining proration + guaranteed salaries', () => {
      const contract = makeContract({
        yearDetails: [
          makeContractYear({ signingBonusProration: 2_000_000, baseSalary: 5_000_000, guaranteed: true }, 1, 1),
          makeContractYear({ signingBonusProration: 2_000_000, baseSalary: 6_000_000, guaranteed: true }, 2, 2),
          makeContractYear({ signingBonusProration: 2_000_000, baseSalary: 7_000_000, guaranteed: false }, 3, 3),
        ],
      });

      const engine = new CapEngine([contract], [], EMPTY_TEAMS, EMPTY_TAGS, makeBus(), createLCG(1));
      const dead = engine.calculateDeadMoney(contract, 1, 'pre_june1');

      // Year 1: 2M proration + 5M guaranteed base
      // Year 2: 2M proration + 6M guaranteed base
      // Year 3: 2M proration + 0 (not guaranteed)
      expect(dead).toBe(2_000_000 + 5_000_000 + 2_000_000 + 6_000_000 + 2_000_000);
    });

    it('post-June 1: returns only the cut year dead money', () => {
      const contract = makeContract({
        yearDetails: [
          makeContractYear({ signingBonusProration: 2_000_000, baseSalary: 5_000_000, guaranteed: true }, 1, 1),
          makeContractYear({ signingBonusProration: 2_000_000, baseSalary: 6_000_000, guaranteed: true }, 2, 2),
          makeContractYear({ signingBonusProration: 2_000_000, baseSalary: 7_000_000, guaranteed: false }, 3, 3),
        ],
      });

      const engine = new CapEngine([contract], [], EMPTY_TEAMS, EMPTY_TAGS, makeBus(), createLCG(1));
      const dead = engine.calculateDeadMoney(contract, 1, 'post_june1');

      // Only year 1: 2M proration + 5M guaranteed base
      expect(dead).toBe(2_000_000 + 5_000_000);
    });

    it('returns 0 when cutYear is not in the contract', () => {
      const contract = makeContract();
      const engine = new CapEngine([contract], [], EMPTY_TEAMS, EMPTY_TAGS, makeBus(), createLCG(1));

      expect(engine.calculateDeadMoney(contract, 99, 'pre_june1')).toBe(0);
    });

    it('handles contract with only 1 year remaining', () => {
      const contract = makeContract({
        yearDetails: [
          makeContractYear({ signingBonusProration: 3_000_000, baseSalary: 8_000_000, guaranteed: true }, 1, 1),
        ],
      });

      const engine = new CapEngine([contract], [], EMPTY_TEAMS, EMPTY_TAGS, makeBus(), createLCG(1));
      const preJune = engine.calculateDeadMoney(contract, 1, 'pre_june1');
      const postJune = engine.calculateDeadMoney(contract, 1, 'post_june1');

      // Both should be the same: 3M + 8M
      expect(preJune).toBe(11_000_000);
      expect(postJune).toBe(11_000_000);
    });
  });

  // ── Signing bonus proration ───────────────────────────────────────

  describe('signing bonus proration', () => {
    it('spreads evenly across remaining years (max 5)', () => {
      const contract = makeContract({
        yearDetails: [
          makeContractYear({ baseSalary: 10_000_000, signingBonusProration: 0, capHit: 10_000_000 }, 1, 1),
          makeContractYear({ baseSalary: 10_000_000, signingBonusProration: 0, capHit: 10_000_000 }, 2, 2),
          makeContractYear({ baseSalary: 10_000_000, signingBonusProration: 0, capHit: 10_000_000 }, 3, 3),
        ],
      });

      const engine = new CapEngine([contract], [], EMPTY_TEAMS, EMPTY_TAGS, makeBus(), createLCG(1));
      const result = engine.applyRestructure({
        kind: 'convert_to_bonus',
        playerId: playerId('p1'),
        amount: 6_000_000,
      });

      // 6M / 3 years = 2M per year
      for (const yd of result.yearDetails) {
        expect(yd.signingBonusProration).toBe(2_000_000);
      }

      // Year 1 base salary reduced
      expect(result.yearDetails[0]!.baseSalary).toBe(4_000_000);
      // Cap hit = base + proration
      expect(result.yearDetails[0]!.capHit).toBe(6_000_000);
    });

    it('caps proration at 5 years even with more years remaining', () => {
      const yearDetails: ContractYear[] = [];
      for (let i = 1; i <= 7; i++) {
        yearDetails.push(
          makeContractYear({ baseSalary: 10_000_000, signingBonusProration: 0, capHit: 10_000_000 }, i, i),
        );
      }

      const contract = makeContract({ yearDetails, years: 7 });
      const engine = new CapEngine([contract], [], EMPTY_TEAMS, EMPTY_TAGS, makeBus(), createLCG(1));
      const result = engine.applyRestructure({
        kind: 'convert_to_bonus',
        playerId: playerId('p1'),
        amount: 10_000_000,
      });

      // 10M / 5 years = 2M per year for first 5, 0 for years 6-7
      for (let i = 0; i < 5; i++) {
        expect(result.yearDetails[i]!.signingBonusProration).toBe(2_000_000);
      }
      expect(result.yearDetails[5]!.signingBonusProration).toBe(0);
      expect(result.yearDetails[6]!.signingBonusProration).toBe(0);
    });

    it('handles proration with void years', () => {
      const contract = makeContract({
        yearDetails: [
          makeContractYear({ baseSalary: 10_000_000, signingBonusProration: 0, capHit: 10_000_000 }, 1, 1),
          makeContractYear({ baseSalary: 0, signingBonusProration: 0, capHit: 0, isVoidYear: true }, 2, 2),
          makeContractYear({ baseSalary: 0, signingBonusProration: 0, capHit: 0, isVoidYear: true }, 3, 3),
        ],
        voidYears: 2,
      });

      const engine = new CapEngine([contract], [], EMPTY_TEAMS, EMPTY_TAGS, makeBus(), createLCG(1));
      const result = engine.applyRestructure({
        kind: 'convert_to_bonus',
        playerId: playerId('p1'),
        amount: 6_000_000,
      });

      // 6M / 3 years = 2M spread over real + void years
      expect(result.yearDetails[0]!.signingBonusProration).toBe(2_000_000);
      expect(result.yearDetails[1]!.signingBonusProration).toBe(2_000_000);
      expect(result.yearDetails[2]!.signingBonusProration).toBe(2_000_000);
    });
  });

  // ── Restructure operations ────────────────────────────────────────

  describe('applyRestructure', () => {
    it('convert_to_bonus: reduces base, spreads proration, recalculates cap', () => {
      const contract = makeContract({
        yearDetails: [
          makeContractYear({ baseSalary: 12_000_000, signingBonusProration: 1_000_000, capHit: 13_000_000 }, 1, 1),
          makeContractYear({ baseSalary: 12_000_000, signingBonusProration: 1_000_000, capHit: 13_000_000 }, 2, 2),
        ],
      });

      const engine = new CapEngine([contract], [], EMPTY_TEAMS, EMPTY_TAGS, makeBus(), createLCG(1));
      const result = engine.applyRestructure({
        kind: 'convert_to_bonus',
        playerId: playerId('p1'),
        amount: 4_000_000,
      });

      // Base salary in year 1 drops by 4M
      expect(result.yearDetails[0]!.baseSalary).toBe(8_000_000);
      // Proration increases by 2M per year (4M / 2 years)
      expect(result.yearDetails[0]!.signingBonusProration).toBe(3_000_000);
      expect(result.yearDetails[1]!.signingBonusProration).toBe(3_000_000);
      // Cap hits recalculated
      expect(result.yearDetails[0]!.capHit).toBe(11_000_000); // 8M + 3M
      expect(result.yearDetails[1]!.capHit).toBe(15_000_000); // 12M + 3M
      expect(result.signingBonus).toBeGreaterThan(0);
    });

    it('add_void_years: appends void years to contract', () => {
      const contract = makeContract();
      const engine = new CapEngine([contract], [], EMPTY_TEAMS, EMPTY_TAGS, makeBus(), createLCG(1));
      const result = engine.applyRestructure({
        kind: 'add_void_years',
        playerId: playerId('p1'),
        years: 2,
      });

      expect(result.yearDetails).toHaveLength(5);
      expect(result.yearDetails[3]!.isVoidYear).toBe(true);
      expect(result.yearDetails[4]!.isVoidYear).toBe(true);
      expect(result.yearDetails[3]!.baseSalary).toBe(0);
      expect(result.voidYears).toBe(2);
      expect(result.years).toBe(5);
    });

    it('extend: adds new years with specified salary', () => {
      const contract = makeContract();
      const engine = new CapEngine([contract], [], EMPTY_TEAMS, EMPTY_TAGS, makeBus(), createLCG(1));
      const result = engine.applyRestructure({
        kind: 'extend',
        playerId: playerId('p1'),
        years: 2,
        newSalary: 15_000_000,
      });

      expect(result.yearDetails).toHaveLength(5);
      expect(result.yearDetails[3]!.baseSalary).toBe(15_000_000);
      expect(result.yearDetails[4]!.baseSalary).toBe(15_000_000);
      expect(result.yearDetails[3]!.isVoidYear).toBe(false);
      expect(result.years).toBe(5);
      expect(result.totalValue).toBe(35_000_000 + 30_000_000);
    });

    it('pay_cut: reduces base salary for current and future years', () => {
      const contract = makeContract({
        yearDetails: [
          makeContractYear({ baseSalary: 10_000_000, signingBonusProration: 2_000_000, capHit: 12_000_000 }, 1, 1),
          makeContractYear({ baseSalary: 12_000_000, signingBonusProration: 2_000_000, capHit: 14_000_000 }, 2, 2),
          makeContractYear({ baseSalary: 14_000_000, signingBonusProration: 2_000_000, capHit: 16_000_000 }, 3, 3),
        ],
      });

      const engine = new CapEngine([contract], [], EMPTY_TEAMS, EMPTY_TAGS, makeBus(), createLCG(1));
      const result = engine.applyRestructure({
        kind: 'pay_cut',
        playerId: playerId('p1'),
        newSalary: 5_000_000,
      });

      for (const yd of result.yearDetails) {
        expect(yd.baseSalary).toBe(5_000_000);
        expect(yd.capHit).toBe(7_000_000); // 5M base + 2M proration
      }
    });

    it('release: voids contract and emits PLAYER_RELEASED and DEAD_MONEY_HIT', () => {
      const bus = makeBus();
      const releasedHandler = vi.fn();
      const deadMoneyHandler = vi.fn();
      bus.on('PLAYER_RELEASED', releasedHandler);
      bus.on('DEAD_MONEY_HIT', deadMoneyHandler);

      const contract = makeContract({
        yearDetails: [
          makeContractYear({ signingBonusProration: 2_000_000, baseSalary: 5_000_000, capHit: 7_000_000, guaranteed: true }, 1, 1),
          makeContractYear({ signingBonusProration: 2_000_000, baseSalary: 6_000_000, capHit: 8_000_000, guaranteed: false }, 2, 2),
          makeContractYear({ signingBonusProration: 2_000_000, baseSalary: 7_000_000, capHit: 9_000_000, guaranteed: false }, 3, 3),
        ],
      });

      const engine = new CapEngine([contract], [], EMPTY_TEAMS, EMPTY_TAGS, bus, createLCG(1));
      const result = engine.applyRestructure({
        kind: 'release',
        playerId: playerId('p1'),
        designation: 'pre_june1',
      });

      expect(result.status).toBe('voided');

      // Pre-June 1: all 3 years proration (6M) + year 1 guaranteed base (5M) = 11M
      expect(releasedHandler).toHaveBeenCalledOnce();
      expect(releasedHandler.mock.calls[0]![0].deadMoney).toBe(11_000_000);
      expect(deadMoneyHandler).toHaveBeenCalledOnce();
      expect(deadMoneyHandler.mock.calls[0]![0].amount).toBe(11_000_000);
    });

    it('release post-June 1: sets deferred dead money on next year', () => {
      const bus = makeBus();
      const contract = makeContract({
        yearDetails: [
          makeContractYear({ signingBonusProration: 3_000_000, baseSalary: 5_000_000, capHit: 8_000_000, guaranteed: true }, 1, 1),
          makeContractYear({ signingBonusProration: 3_000_000, baseSalary: 6_000_000, capHit: 9_000_000, guaranteed: false }, 2, 2),
          makeContractYear({ signingBonusProration: 3_000_000, baseSalary: 7_000_000, capHit: 10_000_000, guaranteed: false }, 3, 3),
        ],
      });

      const engine = new CapEngine([contract], [], EMPTY_TEAMS, EMPTY_TAGS, bus, createLCG(1));
      const result = engine.applyRestructure({
        kind: 'release',
        playerId: playerId('p1'),
        designation: 'post_june1',
      });

      // Year 1 dead = 3M proration + 5M guaranteed = 8M
      expect(result.yearDetails[0]!.deadMoney).toBe(8_000_000);
      // Deferred dead = year 2 + year 3 proration = 6M
      expect(result.yearDetails[1]!.deadMoney).toBe(6_000_000);
    });

    it('trade: transfers contract, dead money stays with original team', () => {
      const bus = makeBus();
      const deadMoneyHandler = vi.fn();
      bus.on('DEAD_MONEY_HIT', deadMoneyHandler);

      const contract = makeContract({
        yearDetails: [
          makeContractYear({ baseSalary: 8_000_000, signingBonusProration: 2_000_000, capHit: 10_000_000 }, 1, 1),
          makeContractYear({ baseSalary: 9_000_000, signingBonusProration: 2_000_000, capHit: 11_000_000 }, 2, 2),
        ],
      });

      const engine = new CapEngine([contract], [], EMPTY_TEAMS, EMPTY_TAGS, bus, createLCG(1));
      const result = engine.applyRestructure({
        kind: 'trade',
        playerId: playerId('p1'),
        targetTeamId: teamId('t2'),
      });

      expect(result.teamId).toBe(teamId('t2'));

      // Dead money for original team = remaining proration (2M + 2M = 4M)
      expect(deadMoneyHandler).toHaveBeenCalledOnce();
      expect(deadMoneyHandler.mock.calls[0]![0].teamId).toBe(teamId('t1'));
      expect(deadMoneyHandler.mock.calls[0]![0].amount).toBe(4_000_000);

      // Proration stripped from traded contract
      for (const yd of result.yearDetails) {
        expect(yd.signingBonusProration).toBe(0);
      }
      // Cap hit = base salary only
      expect(result.yearDetails[0]!.capHit).toBe(8_000_000);
      expect(result.yearDetails[1]!.capHit).toBe(9_000_000);
    });
  });

  // ── Franchise tag cost ────────────────────────────────────────────

  describe('getFranchiseTagCost', () => {
    function buildTagScenario() {
      const salaries = [20_000_000, 18_000_000, 16_000_000, 14_000_000, 12_000_000,
        10_000_000, 9_000_000, 8_000_000, 7_000_000, 6_000_000];
      const contracts: Contract[] = [];
      const players: Player[] = [];

      for (let i = 0; i < salaries.length; i++) {
        const pid = playerId(`qb${i}`);
        const cid = contractId(`cqb${i}`);
        const tid = teamId(`team${i}`);
        contracts.push(
          makeContract({
            id: cid,
            playerId: pid,
            teamId: tid,
            yearDetails: [makeContractYear({ baseSalary: salaries[i]!, capHit: salaries[i]! }, 1, 1)],
          }),
        );
        players.push(makePlayer({ id: pid, teamId: tid, position: 'QB' }));
      }

      return { contracts, players };
    }

    it('non_exclusive: average of top 5 salaries at position', () => {
      const { contracts, players } = buildTagScenario();
      const engine = new CapEngine(contracts, players, EMPTY_TEAMS, EMPTY_TAGS, makeBus(), createLCG(1));
      const cost = engine.getFranchiseTagCost('QB', 'non_exclusive', 1);

      // Top 5: 20M + 18M + 16M + 14M + 12M = 80M / 5 = 16M
      expect(cost).toBe(16_000_000);
    });

    it('exclusive: average of top 5 salaries at position', () => {
      const { contracts, players } = buildTagScenario();
      const engine = new CapEngine(contracts, players, EMPTY_TEAMS, EMPTY_TAGS, makeBus(), createLCG(1));
      const cost = engine.getFranchiseTagCost('QB', 'exclusive', 1);

      expect(cost).toBe(16_000_000);
    });

    it('transition: average of top 10 salaries at position', () => {
      const { contracts, players } = buildTagScenario();
      const engine = new CapEngine(contracts, players, EMPTY_TEAMS, EMPTY_TAGS, makeBus(), createLCG(1));
      const cost = engine.getFranchiseTagCost('QB', 'transition', 1);

      // Top 10: (20+18+16+14+12+10+9+8+7+6)M = 120M / 10 = 12M
      expect(cost).toBe(12_000_000);
    });

    it('returns 0 when no players at the position', () => {
      const engine = new CapEngine([], [], EMPTY_TEAMS, EMPTY_TAGS, makeBus(), createLCG(1));
      expect(engine.getFranchiseTagCost('K', 'non_exclusive', 1)).toBe(0);
    });

    it('handles fewer than 5 players at position', () => {
      const contracts = [
        makeContract({
          id: contractId('c1'),
          playerId: playerId('p1'),
          yearDetails: [makeContractYear({ capHit: 20_000_000 }, 1, 1)],
        }),
        makeContract({
          id: contractId('c2'),
          playerId: playerId('p2'),
          teamId: teamId('t2'),
          yearDetails: [makeContractYear({ capHit: 10_000_000 }, 1, 1)],
        }),
      ];
      const players = [
        makePlayer({ id: playerId('p1'), position: 'K' }),
        makePlayer({ id: playerId('p2'), position: 'K', teamId: teamId('t2') }),
      ];

      const engine = new CapEngine(contracts, players, EMPTY_TEAMS, EMPTY_TAGS, makeBus(), createLCG(1));
      expect(engine.getFranchiseTagCost('K', 'non_exclusive', 1)).toBe(15_000_000);
    });

    it('applyTagEscalator: 2nd consecutive year adds 20%', () => {
      const base = 16_000_000;
      const escalated = CapEngine.applyTagEscalator(base, 2);
      expect(escalated).toBe(Math.round(base * (1 + TAG_ESCALATOR_2ND)));
    });

    it('applyTagEscalator: 3rd consecutive year adds 44%', () => {
      const base = 16_000_000;
      const escalated = CapEngine.applyTagEscalator(base, 3);
      expect(escalated).toBe(Math.round(base * (1 + TAG_ESCALATOR_3RD)));
    });

    it('applyTagEscalator: 1st year returns base cost unchanged', () => {
      expect(CapEngine.applyTagEscalator(16_000_000, 1)).toBe(16_000_000);
    });
  });

  // ── Cap compliance validation ─────────────────────────────────────

  describe('validateCapCompliance', () => {
    it('returns compliant when team is under the cap', () => {
      const contract = makeContract({
        yearDetails: [makeContractYear({ capHit: 10_000_000 }, 1, 1)],
      });
      const engine = new CapEngine([contract], [], EMPTY_TEAMS, EMPTY_TAGS, makeBus(), createLCG(1));
      const result = engine.validateCapCompliance(teamId('t1'), 1);

      expect(result.compliant).toBe(true);
      expect(result.overBy).toBe(0);
    });

    it('returns non-compliant with correct overBy when over cap', () => {
      const cap = BASE_SALARY_CAP;
      const contract = makeContract({
        yearDetails: [makeContractYear({ capHit: cap + 5_000_000 }, 1, 1)],
      });
      const engine = new CapEngine([contract], [], EMPTY_TEAMS, EMPTY_TAGS, makeBus(), createLCG(1));
      const result = engine.validateCapCompliance(teamId('t1'), 1);

      expect(result.compliant).toBe(false);
      expect(result.overBy).toBe(5_000_000);
    });

    it('returns compliant when exactly at the cap', () => {
      const cap = BASE_SALARY_CAP;
      const contract = makeContract({
        yearDetails: [makeContractYear({ capHit: cap }, 1, 1)],
      });
      const engine = new CapEngine([contract], [], EMPTY_TEAMS, EMPTY_TAGS, makeBus(), createLCG(1));
      const result = engine.validateCapCompliance(teamId('t1'), 1);

      expect(result.compliant).toBe(true);
      expect(result.overBy).toBe(0);
    });

    it('emits CAP_VIOLATION when non-compliant', () => {
      const bus = makeBus();
      const handler = vi.fn();
      bus.on('CAP_VIOLATION', handler);

      const cap = BASE_SALARY_CAP;
      const contract = makeContract({
        yearDetails: [makeContractYear({ capHit: cap + 3_000_000 }, 1, 1)],
      });

      const engine = new CapEngine([contract], [], EMPTY_TEAMS, EMPTY_TAGS, bus, createLCG(1));
      engine.validateCapCompliance(teamId('t1'), 1);

      expect(handler).toHaveBeenCalledOnce();
      expect(handler.mock.calls[0]![0].overAmount).toBe(3_000_000);
    });

    it('does not emit CAP_VIOLATION when compliant', () => {
      const bus = makeBus();
      const handler = vi.fn();
      bus.on('CAP_VIOLATION', handler);

      const contract = makeContract({
        yearDetails: [makeContractYear({ capHit: 1_000_000 }, 1, 1)],
      });

      const engine = new CapEngine([contract], [], EMPTY_TEAMS, EMPTY_TAGS, bus, createLCG(1));
      engine.validateCapCompliance(teamId('t1'), 1);

      expect(handler).not.toHaveBeenCalled();
    });
  });

  // ── Comp pick formula ─────────────────────────────────────────────

  describe('calculateCompPicks', () => {
    function buildCompPickScenario() {
      // Team t1 loses players p1, p2. Gains player p3.
      const oldContract1 = makeContract({
        id: contractId('old1'),
        playerId: playerId('p1'),
        teamId: teamId('t1'),
        status: 'expired',
        yearDetails: [makeContractYear({}, 1, 1)],
        signedDate: { season: 1, week: 1 },
      });
      const newContract1 = makeContract({
        id: contractId('new1'),
        playerId: playerId('p1'),
        teamId: teamId('t2'),
        status: 'active',
        totalValue: 60_000_000,
        years: 4,
        yearDetails: [makeContractYear({}, 1, 2)],
        signedDate: { season: 2, week: 1 },
      });
      const oldContract2 = makeContract({
        id: contractId('old2'),
        playerId: playerId('p2'),
        teamId: teamId('t1'),
        status: 'expired',
        yearDetails: [makeContractYear({}, 1, 1)],
        signedDate: { season: 1, week: 1 },
      });
      const newContract2 = makeContract({
        id: contractId('new2'),
        playerId: playerId('p2'),
        teamId: teamId('t3'),
        status: 'active',
        totalValue: 20_000_000,
        years: 2,
        yearDetails: [makeContractYear({}, 1, 2)],
        signedDate: { season: 2, week: 1 },
      });
      // Player gained by t1
      const oldContract3 = makeContract({
        id: contractId('old3'),
        playerId: playerId('p3'),
        teamId: teamId('t4'),
        status: 'expired',
        yearDetails: [makeContractYear({}, 1, 1)],
        signedDate: { season: 1, week: 1 },
      });
      const newContract3 = makeContract({
        id: contractId('new3'),
        playerId: playerId('p3'),
        teamId: teamId('t1'),
        status: 'active',
        totalValue: 8_000_000,
        years: 2,
        yearDetails: [makeContractYear({}, 1, 2)],
        signedDate: { season: 2, week: 1 },
      });

      const players = [
        makePlayer({ id: playerId('p1') }),
        makePlayer({ id: playerId('p2') }),
        makePlayer({ id: playerId('p3') }),
      ];

      return {
        contracts: [oldContract1, newContract1, oldContract2, newContract2, oldContract3, newContract3],
        players,
      };
    }

    it('produces comp picks for net losses', () => {
      const { contracts, players } = buildCompPickScenario();
      const engine = new CapEngine(contracts, players, EMPTY_TEAMS, EMPTY_TAGS, makeBus(), createLCG(42), 2);
      const picks = engine.calculateCompPicks(2);

      // t1 lost 2, gained 1 => 1 net loss => 1 comp pick
      const t1Picks = picks.filter(p => p.previousTeamId === teamId('t1'));
      expect(t1Picks).toHaveLength(1);
    });

    it('assigns rounds based on APY thresholds', () => {
      const { contracts, players } = buildCompPickScenario();
      const engine = new CapEngine(contracts, players, EMPTY_TEAMS, EMPTY_TAGS, makeBus(), createLCG(42), 2);
      const picks = engine.calculateCompPicks(2);

      // p1 APY = 60M/4 = 15M, p2 APY = 20M/2 = 10M, gain p3 APY = 8M/2 = 4M
      // Gain cancels highest loss (p1), leaving p2 (10M APY) => Round 4
      const t1Pick = picks.find(p => p.previousTeamId === teamId('t1'));
      expect(t1Pick).toBeDefined();
      expect(t1Pick!.projectedRound).toBe(4);
    });

    it('caps at MAX_COMP_PICKS_PER_TEAM (4)', () => {
      const contracts: Contract[] = [];
      const players: Player[] = [];

      // Create 6 losses for t1, no gains
      for (let i = 0; i < 6; i++) {
        const pid = playerId(`loss${i}`);
        const oldC = makeContract({
          id: contractId(`old${i}`),
          playerId: pid,
          teamId: teamId('t1'),
          status: 'expired',
          yearDetails: [makeContractYear({}, 1, 1)],
          signedDate: { season: 1, week: 1 },
        });
        const newC = makeContract({
          id: contractId(`new${i}`),
          playerId: pid,
          teamId: teamId(`other${i}`),
          status: 'active',
          totalValue: 20_000_000,
          years: 2,
          yearDetails: [makeContractYear({}, 1, 2)],
          signedDate: { season: 2, week: 1 },
        });
        contracts.push(oldC, newC);
        players.push(makePlayer({ id: pid }));
      }

      const engine = new CapEngine(contracts, players, EMPTY_TEAMS, EMPTY_TAGS, makeBus(), createLCG(42), 2);
      const picks = engine.calculateCompPicks(2);
      const t1Picks = picks.filter(p => p.previousTeamId === teamId('t1'));

      expect(t1Picks).toHaveLength(4);
    });

    it('emits COMP_PICK_AWARDED for each pick', () => {
      const bus = makeBus();
      const handler = vi.fn();
      bus.on('COMP_PICK_AWARDED', handler);

      const { contracts, players } = buildCompPickScenario();
      const engine = new CapEngine(contracts, players, EMPTY_TEAMS, EMPTY_TAGS, bus, createLCG(42), 2);
      engine.calculateCompPicks(2);

      expect(handler).toHaveBeenCalled();
    });

    it('deterministic with same seed', () => {
      const { contracts, players } = buildCompPickScenario();

      const run = (seed: number) => {
        const engine = new CapEngine(
          JSON.parse(JSON.stringify(contracts)),
          players,
          EMPTY_TEAMS, EMPTY_TAGS,
          makeBus(),
          createLCG(seed),
          2,
        );
        return engine.calculateCompPicks(2);
      };

      const a = run(42);
      const b = run(42);
      expect(a).toEqual(b);
    });
  });

  // ── Multi-year cap projection ─────────────────────────────────────

  describe('projectCap', () => {
    it('applies cap growth rate correctly over multiple seasons', () => {
      const engine = new CapEngine([], [], EMPTY_TEAMS, EMPTY_TAGS, makeBus(), createLCG(1));
      const projections = engine.projectCap(teamId('t1'), 3);

      expect(projections).toHaveLength(3);
      for (let i = 0; i < 3; i++) {
        const expected = Math.round(
          BASE_SALARY_CAP * Math.pow(1 + CAP_GROWTH_RATE, i + 1),
        );
        expect(projections[i]!.projectedCap).toBe(expected);
      }
    });

    it('identifies expiring contracts per season', () => {
      const contract = makeContract({
        yearDetails: [
          makeContractYear({}, 1, 1),
          makeContractYear({}, 2, 2),
          makeContractYear({}, 3, 3),
        ],
      });

      const engine = new CapEngine([contract], [], EMPTY_TEAMS, EMPTY_TAGS, makeBus(), createLCG(1));
      const projections = engine.projectCap(teamId('t1'), 3);

      // Contract expires in season 3
      expect(projections[0]!.expiringContracts).toEqual([]); // season 2
      expect(projections[1]!.expiringContracts).toEqual([playerId('p1')]); // season 3
      expect(projections[2]!.expiringContracts).toEqual([]); // season 4
    });

    it('committed cap decreases as contracts expire', () => {
      const contract = makeContract({
        yearDetails: [
          makeContractYear({ capHit: 10_000_000 }, 1, 1),
          makeContractYear({ capHit: 10_000_000 }, 2, 2),
        ],
      });

      const engine = new CapEngine([contract], [], EMPTY_TEAMS, EMPTY_TAGS, makeBus(), createLCG(1));
      const projections = engine.projectCap(teamId('t1'), 3);

      expect(projections[0]!.committedCap).toBe(10_000_000); // season 2
      expect(projections[1]!.committedCap).toBe(0); // season 3 — expired
      expect(projections[2]!.committedCap).toBe(0); // season 4
    });

    it('estimated space grows as contracts expire and cap increases', () => {
      const contract = makeContract({
        yearDetails: [
          makeContractYear({ capHit: 100_000_000 }, 1, 1),
          makeContractYear({ capHit: 100_000_000 }, 2, 2),
        ],
      });

      const engine = new CapEngine([contract], [], EMPTY_TEAMS, EMPTY_TAGS, makeBus(), createLCG(1));
      const projections = engine.projectCap(teamId('t1'), 3);

      expect(projections[1]!.estimatedSpace).toBeGreaterThan(
        projections[0]!.estimatedSpace,
      );
    });
  });

  // ── getTeamCapState ───────────────────────────────────────────────

  describe('getTeamCapState', () => {
    it('aggregates cap hits from active contracts', () => {
      const contracts = [
        makeContract({
          id: contractId('c1'),
          playerId: playerId('p1'),
          yearDetails: [makeContractYear({ capHit: 10_000_000 }, 1, 1)],
        }),
        makeContract({
          id: contractId('c2'),
          playerId: playerId('p2'),
          yearDetails: [makeContractYear({ capHit: 8_000_000 }, 1, 1)],
        }),
      ];

      const engine = new CapEngine(contracts, [], EMPTY_TEAMS, EMPTY_TAGS, makeBus(), createLCG(1));
      const state = engine.getTeamCapState(teamId('t1'), 1);

      expect(state.totalCapCommitted).toBe(18_000_000);
      expect(state.salaryCap).toBe(BASE_SALARY_CAP);
      expect(state.capSpace).toBe(BASE_SALARY_CAP - 18_000_000);
    });

    it('includes dead money from voided contracts', () => {
      const active = makeContract({
        id: contractId('c1'),
        playerId: playerId('p1'),
        yearDetails: [makeContractYear({ capHit: 10_000_000 }, 1, 1)],
      });
      const voided = makeContract({
        id: contractId('c2'),
        playerId: playerId('p2'),
        status: 'voided',
        yearDetails: [makeContractYear({ capHit: 0, deadMoney: 5_000_000 }, 1, 1)],
      });

      const engine = new CapEngine([active, voided], [], EMPTY_TEAMS, EMPTY_TAGS, makeBus(), createLCG(1));
      const state = engine.getTeamCapState(teamId('t1'), 1);

      expect(state.deadMoney).toBe(5_000_000);
      expect(state.totalCapCommitted).toBe(15_000_000);
    });

    it('returns top 5 cap hits sorted descending', () => {
      const contracts: Contract[] = [];
      for (let i = 0; i < 7; i++) {
        contracts.push(
          makeContract({
            id: contractId(`c${i}`),
            playerId: playerId(`p${i}`),
            yearDetails: [makeContractYear({ capHit: (i + 1) * 1_000_000 }, 1, 1)],
          }),
        );
      }

      const engine = new CapEngine(contracts, [], EMPTY_TEAMS, EMPTY_TAGS, makeBus(), createLCG(1));
      const state = engine.getTeamCapState(teamId('t1'), 1);

      expect(state.topFiveCapHits).toHaveLength(5);
      expect(state.topFiveCapHits[0]!.capHit).toBe(7_000_000);
      expect(state.topFiveCapHits[4]!.capHit).toBe(3_000_000);
    });

    it('includes 4-year projections', () => {
      const engine = new CapEngine([], [], EMPTY_TEAMS, EMPTY_TAGS, makeBus(), createLCG(1));
      const state = engine.getTeamCapState(teamId('t1'), 1);

      expect(state.projections).toHaveLength(4);
      expect(state.projections[0]!.season).toBe(2);
      expect(state.projections[3]!.season).toBe(5);
    });
  });

  // ── Edge cases ────────────────────────────────────────────────────

  describe('edge cases', () => {
    it('zero contracts: returns full cap space', () => {
      const engine = new CapEngine([], [], EMPTY_TEAMS, EMPTY_TAGS, makeBus(), createLCG(1));
      const state = engine.getTeamCapState(teamId('t1'), 1);

      expect(state.totalCapCommitted).toBe(0);
      expect(state.capSpace).toBe(BASE_SALARY_CAP);
      expect(state.deadMoney).toBe(0);
      expect(state.topFiveCapHits).toEqual([]);
    });

    it('max cap hit player: correctly handles large numbers', () => {
      const contract = makeContract({
        yearDetails: [makeContractYear({ capHit: BASE_SALARY_CAP }, 1, 1)],
      });

      const engine = new CapEngine([contract], [], EMPTY_TEAMS, EMPTY_TAGS, makeBus(), createLCG(1));
      const state = engine.getTeamCapState(teamId('t1'), 1);

      expect(state.capSpace).toBe(0);
      expect(state.totalCapCommitted).toBe(BASE_SALARY_CAP);
    });

    it('void year dead money: proration on void years counts in dead money', () => {
      const contract = makeContract({
        yearDetails: [
          makeContractYear({ signingBonusProration: 2_000_000, baseSalary: 5_000_000, guaranteed: false }, 1, 1),
          makeContractYear({ signingBonusProration: 2_000_000, baseSalary: 0, isVoidYear: true, guaranteed: false }, 2, 2),
        ],
        voidYears: 1,
      });

      const engine = new CapEngine([contract], [], EMPTY_TEAMS, EMPTY_TAGS, makeBus(), createLCG(1));
      const dead = engine.calculateDeadMoney(contract, 1, 'pre_june1');

      // Both years' proration (4M), no guaranteed salaries
      expect(dead).toBe(4_000_000);
    });

    it('team with no active contracts for queried season', () => {
      const contract = makeContract({
        yearDetails: [makeContractYear({ capHit: 10_000_000 }, 1, 5)],
      });

      const engine = new CapEngine([contract], [], EMPTY_TEAMS, EMPTY_TAGS, makeBus(), createLCG(1));
      const state = engine.getTeamCapState(teamId('t1'), 1);

      expect(state.totalCapCommitted).toBe(0);
      expect(state.topFiveCapHits).toEqual([]);
    });

    it('cap grows with season number', () => {
      const engine = new CapEngine([], [], EMPTY_TEAMS, EMPTY_TAGS, makeBus(), createLCG(1));
      const s1 = engine.getTeamCapState(teamId('t1'), 1);
      const s5 = engine.getTeamCapState(teamId('t1'), 5);

      expect(s5.salaryCap).toBeGreaterThan(s1.salaryCap);
      const expected = Math.round(BASE_SALARY_CAP * Math.pow(1 + CAP_GROWTH_RATE, 4));
      expect(s5.salaryCap).toBe(expected);
    });

    it('applyRestructure throws for unknown player', () => {
      const engine = new CapEngine([], [], EMPTY_TEAMS, EMPTY_TAGS, makeBus(), createLCG(1));

      expect(() =>
        engine.applyRestructure({
          kind: 'pay_cut',
          playerId: playerId('nobody'),
          newSalary: 1_000_000,
        }),
      ).toThrow(/No active contract/);
    });
  });
});
