import { describe, it, expect } from 'vitest';
import { createLCG } from '../../src/sim/RNG.js';
import { generateReport, updateReportAfterVisit, updateReportAfterCombine } from '../../src/analytics/ScoutingReportGenerator.js';
import type { Player, DraftProspect, ScoutingReport } from '../../src/types/player.js';
import { playerId, teamId } from '../../src/types/ids.js';
import { GRADE_FLOOR, GRADE_CEILING } from '../../src/analytics/constants.js';

function makePlayer(overrides: Partial<Player> = {}): Player {
  return {
    id: playerId('p1'),
    firstName: 'Test',
    lastName: 'Player',
    age: 22,
    position: 'WR',
    secondaryPositions: [],
    teamId: teamId('t1'),
    jerseyNumber: 10,
    experience: 0,
    college: 'State U',
    draftYear: 2024,
    draftRound: 1,
    draftPick: 10,
    physical: { speed: 90, acceleration: 88, strength: 65, agility: 85, jumping: 82, stamina: 80, toughness: 70 },
    personality: {
      leadership: 60, workEthic: 70, ego: 50, coachability: 70, competitiveness: 75, composure: 65, loyalty: 60,
      greed: 45, legacyDrive: 55, fameSeeking: 40, familyOriented: 50, teamChemistryEffect: 55, prankster: 20,
      loner: 25, mentorWillingness: 50, respectForVeterans: 65, aggression: 50, discipline: 70, motorEffort: 75,
      footballIQ: 72, filmStudyDedication: 70, offFieldRisk: 20, mediaHandling: 'professional', communityEngagement: 50,
      durabilityMindset: 70, resilience: 65, confidenceVolatility: 35, chipOnShoulder: 45,
    },
    hidden: {
      trueOverall: 82, injuryProneness: 25, clutchFactor: 70, consistencyVariance: 12,
      ceilingFloor: [72, 90], footballCharacter: 78, schemeVersatility: 65,
    },
    receiving: { catching: 85, spectacularCatch: 80, catchInTraffic: 82, routeRunning: 88, release: 85 },
    contract: null,
    injuryStatus: null,
    careerStats: {},
    seasonStats: {},
    ...overrides,
  } as Player;
}

function makeProspect(overrides: Partial<DraftProspect> = {}): DraftProspect {
  const stubReport: ScoutingReport = {
    gradeRange: [5.0, 7.0], overallGrade: null, scoutingInvestment: 0, confidenceLevel: 20,
    summary: null, strengths: [], weaknesses: [], rawAbilityNotes: null, productionNotes: null,
    schemeFitGrades: [], characterGrade: null, characterNotes: null, leadershipProjection: null,
    comparisonPlayer: null, comparisonConfidence: 0, ceilingProjection: null, floorProjection: null,
    readyToContribute: null, criticalFactors: [], medicalFlag: null, medicalNotes: null,
  };
  return {
    id: playerId('dp1'),
    firstName: 'Draft',
    lastName: 'Prospect',
    age: 21,
    position: 'QB',
    college: 'Big State',
    scoutingReport: stubReport,
    hidden: {
      trueOverall: 78, injuryProneness: 30, clutchFactor: 65, consistencyVariance: 15,
      ceilingFloor: [68, 88], footballCharacter: 72, schemeVersatility: 60,
    },
    physical: { speed: 82, acceleration: 80, strength: 70, agility: 75, jumping: 72, stamina: 85, toughness: 75 },
    personality: {
      leadership: 65, workEthic: 75, ego: 45, coachability: 72, competitiveness: 80, composure: 70, loyalty: 65,
      greed: 40, legacyDrive: 60, fameSeeking: 35, familyOriented: 55, teamChemistryEffect: 60, prankster: 15,
      loner: 20, mentorWillingness: 55, respectForVeterans: 70, aggression: 45, discipline: 75, motorEffort: 80,
      footballIQ: 78, filmStudyDedication: 75, offFieldRisk: 15, mediaHandling: 'professional', communityEngagement: 55,
      durabilityMindset: 75, resilience: 70, confidenceVolatility: 30, chipOnShoulder: 40,
    },
    passing: { throwPower: 88, shortAccuracy: 82, mediumAccuracy: 80, deepAccuracy: 78, throwOnRun: 75, playAction: 72 },
    ...overrides,
  } as DraftProspect;
}

describe('ScoutingReportGenerator', () => {
  describe('generateReport', () => {
    it('is deterministic: same seed and tier produce identical reports', () => {
      const player = makePlayer();
      const r1 = generateReport(player, 3, 42);
      const r2 = generateReport(player, 3, 42);
      expect(r1.gradeRange).toEqual(r2.gradeRange);
      expect(r1.overallGrade).toBe(r2.overallGrade);
      expect(r1.summary).toBe(r2.summary);
      expect(r1.confidenceLevel).toBe(r2.confidenceLevel);
    });

    it('tier 1 gradeRange is wider than tier 5 for same player', () => {
      const player = makePlayer();
      const r1 = generateReport(player, 1, 100);
      const r5 = generateReport(player, 5, 100);
      const width1 = r1.gradeRange[1]! - r1.gradeRange[0]!;
      const width5 = r5.gradeRange[1]! - r5.gradeRange[0]!;
      expect(width1).toBeGreaterThan(width5);
    });

    it('at tier 5 overallGrade is close to trueOverall-mapped grade', () => {
      const player = makePlayer({ hidden: { ...makePlayer().hidden!, trueOverall: 80 } });
      const report = generateReport(player, 5, 999);
      const expectedGrade = 4.0 + (80 / 99) * 5.0;
      expect(report.overallGrade).not.toBeNull();
      const diff = Math.abs((report.overallGrade ?? 0) - expectedGrade);
      expect(diff).toBeLessThanOrEqual(1.5); // noise + snap to discrete grades
    });

    it('scheme fit grades are present and in valid range', () => {
      const player = makePlayer();
      const report = generateReport(player, 3, 42);
      expect(report.schemeFitGrades.length).toBeGreaterThan(0);
      for (const sg of report.schemeFitGrades) {
        expect(sg.fitGrade).toBeGreaterThanOrEqual(1.0);
        expect(sg.fitGrade).toBeLessThanOrEqual(9.0);
      }
    });

    it('strengths and weaknesses generated from player attributes', () => {
      const player = makePlayer();
      const report = generateReport(player, 3, 42);
      expect(report.strengths.length).toBeGreaterThanOrEqual(1);
      expect(report.weaknesses.length).toBeGreaterThanOrEqual(1);
    });

    it('character grade is null before formal_interview or background_check', () => {
      const player = makePlayer();
      const report = generateReport(player, 5, 42);
      expect(report.characterGrade).toBeNull();
    });

    it('medical flag and notes are null before medical_check', () => {
      const player = makePlayer();
      const report = generateReport(player, 5, 42);
      expect(report.medicalFlag).toBeNull();
      expect(report.medicalNotes).toBeNull();
    });

    it('grade range bounds are always within [4.0, 9.0]', () => {
      const player = makePlayer();
      for (const tier of [1, 3, 5]) {
        const report = generateReport(player, tier, 100 + tier);
        expect(report.gradeRange[0]).toBeGreaterThanOrEqual(GRADE_FLOOR);
        expect(report.gradeRange[1]).toBeLessThanOrEqual(GRADE_CEILING);
      }
    });
  });

  describe('updateReportAfterVisit', () => {
    it('film_review narrows gradeRange', () => {
      const player = makePlayer();
      const initial = generateReport(player, 3, 42);
      const after = updateReportAfterVisit(initial, 'film_review', player, 43);
      const widthBefore = initial.gradeRange[1]! - initial.gradeRange[0]!;
      const widthAfter = after.gradeRange[1]! - after.gradeRange[0]!;
      expect(widthAfter).toBeLessThanOrEqual(widthBefore + 0.01);
      expect(after.scoutingInvestment).toBeGreaterThan(initial.scoutingInvestment);
    });

    it('private_workout can improve schemeFitGrades', () => {
      const player = makeProspect();
      const initial = generateReport(player, 3, 42);
      const after = updateReportAfterVisit(initial, 'private_workout', player, 44);
      expect(after.schemeFitGrades.length).toBeGreaterThan(0);
      expect(after.confidenceLevel).toBeGreaterThanOrEqual(initial.confidenceLevel);
    });

    it('formal_interview reveals characterGrade', () => {
      const player = makePlayer();
      const initial = generateReport(player, 3, 42);
      expect(initial.characterGrade).toBeNull();
      const after = updateReportAfterVisit(initial, 'formal_interview', player, 45);
      expect(['green', 'yellow', 'red']).toContain(after.characterGrade);
    });

    it('medical_check reveals medicalFlag and medicalNotes', () => {
      const player = makePlayer();
      const initial = generateReport(player, 3, 42);
      const after = updateReportAfterVisit(initial, 'medical_check', player, 46);
      expect(['clear', 'minor_concern', 'major_concern']).toContain(after.medicalFlag);
      expect(after.medicalNotes).toBeTruthy();
    });

    it('confidence increases after each visit type', () => {
      const player = makePlayer();
      const initial = generateReport(player, 2, 42);
      const after = updateReportAfterVisit(initial, 'campus_visit', player, 47);
      expect(after.confidenceLevel).toBeGreaterThan(initial.confidenceLevel);
    });
  });

  describe('updateReportAfterCombine', () => {
    it('narrows physical assessments and boosts confidence', () => {
      const player = makeProspect();
      const initial = generateReport(player, 3, 42);
      const combineResults = {
        fortyYardDash: 4.45,
        benchPress: 18,
        verticalJump: 36,
        broadJump: 120,
        threeConeDrill: 6.95,
        twentyYardShuttle: 4.25,
      };
      const after = updateReportAfterCombine(initial, combineResults, player, 48);
      expect(after.rawAbilityNotes).toBeTruthy();
      expect(after.confidenceLevel).toBeGreaterThanOrEqual(initial.confidenceLevel);
      expect(after.scoutingInvestment).toBeGreaterThan(initial.scoutingInvestment);
    });
  });
});
