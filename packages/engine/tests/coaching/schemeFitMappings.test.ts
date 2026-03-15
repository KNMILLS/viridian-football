import { describe, it, expect } from 'vitest';
import { offensiveSchemeMappings, defensiveSchemeMappings } from '../../src/coaching/schemeFitMappings.js';
import type { OffensiveScheme, DefensiveScheme } from '../../src/types/coach.js';

const ALL_OFFENSIVE_SCHEMES: OffensiveScheme[] = [
  'west_coast', 'spread', 'air_raid', 'power_run',
  'zone_run', 'rpo_heavy', 'play_action_heavy', 'pro_style',
];

const ALL_DEFENSIVE_SCHEMES: DefensiveScheme[] = [
  '4_3_under', '3_4', 'nickel_base', 'cover_3',
  'cover_2_tampa', 'multiple', 'aggressive_blitz',
];

const VALID_RATING_GROUPS = new Set([
  'physical', 'passing', 'rushing', 'receiving', 'blocking', 'defense',
]);

describe('schemeFitMappings', () => {
  describe('offensive schemes', () => {
    it('every OffensiveScheme has a mapping', () => {
      for (const scheme of ALL_OFFENSIVE_SCHEMES) {
        expect(offensiveSchemeMappings[scheme]).toBeDefined();
      }
    });

    it('each mapping has at least one position with weights', () => {
      for (const scheme of ALL_OFFENSIVE_SCHEMES) {
        const mapping = offensiveSchemeMappings[scheme]!;
        const positions = Object.keys(mapping);
        expect(positions.length).toBeGreaterThan(0);

        for (const pos of positions) {
          const weights = mapping[pos as keyof typeof mapping]!;
          expect(weights.length).toBeGreaterThan(0);
        }
      }
    });

    it('all ratingGroup values are valid', () => {
      for (const scheme of ALL_OFFENSIVE_SCHEMES) {
        const mapping = offensiveSchemeMappings[scheme]!;
        for (const weights of Object.values(mapping)) {
          for (const w of weights!) {
            expect(VALID_RATING_GROUPS.has(w.ratingGroup)).toBe(true);
          }
        }
      }
    });

    it('all weights are positive numbers', () => {
      for (const scheme of ALL_OFFENSIVE_SCHEMES) {
        const mapping = offensiveSchemeMappings[scheme]!;
        for (const weights of Object.values(mapping)) {
          for (const w of weights!) {
            expect(w.weight).toBeGreaterThan(0);
          }
        }
      }
    });
  });

  describe('defensive schemes', () => {
    it('every DefensiveScheme has a mapping', () => {
      for (const scheme of ALL_DEFENSIVE_SCHEMES) {
        expect(defensiveSchemeMappings[scheme]).toBeDefined();
      }
    });

    it('each mapping has at least one position with weights', () => {
      for (const scheme of ALL_DEFENSIVE_SCHEMES) {
        const mapping = defensiveSchemeMappings[scheme]!;
        const positions = Object.keys(mapping);
        expect(positions.length).toBeGreaterThan(0);

        for (const pos of positions) {
          const weights = mapping[pos as keyof typeof mapping]!;
          expect(weights.length).toBeGreaterThan(0);
        }
      }
    });

    it('all ratingGroup values are valid', () => {
      for (const scheme of ALL_DEFENSIVE_SCHEMES) {
        const mapping = defensiveSchemeMappings[scheme]!;
        for (const weights of Object.values(mapping)) {
          for (const w of weights!) {
            expect(VALID_RATING_GROUPS.has(w.ratingGroup)).toBe(true);
          }
        }
      }
    });

    it('defensive schemes include core defensive positions', () => {
      for (const scheme of ALL_DEFENSIVE_SCHEMES) {
        const mapping = defensiveSchemeMappings[scheme]!;
        const positions = Object.keys(mapping);
        expect(positions).toContain('CB');
        expect(positions).toContain('FS');
        expect(positions).toContain('SS');
      }
    });
  });
});
