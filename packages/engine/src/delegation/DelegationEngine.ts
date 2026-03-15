import type { DelegationMode } from '../types/index.js';

// ── Types ──────────────────────────────────────────────────────────

export type DelegationResult<T> = {
  needsUserInput: boolean;
  staffSuggestion?: T;
  decision?: T;
  autoApplied: boolean;
};

// ── Core Function ──────────────────────────────────────────────────

export function delegateToStaff<T>(
  mode: DelegationMode,
  staffDecision: () => T,
  userOverride?: T,
): DelegationResult<T> {
  const suggestion = staffDecision();

  switch (mode) {
    case 'manual':
      return {
        needsUserInput: true,
        staffSuggestion: suggestion,
        autoApplied: false,
      };

    case 'review':
      if (userOverride !== undefined) {
        return {
          needsUserInput: false,
          staffSuggestion: suggestion,
          decision: userOverride,
          autoApplied: false,
        };
      }
      return {
        needsUserInput: true,
        staffSuggestion: suggestion,
        autoApplied: false,
      };

    case 'auto':
      return {
        needsUserInput: false,
        decision: suggestion,
        autoApplied: true,
      };
  }
}
