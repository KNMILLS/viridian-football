# Data Validation and Calibration Framework

This document outlines procedures for validating and calibrating the Viridian Football simulation engine.  While the engine uses research‑driven formulas, empirical calibration is essential to ensure that simulated outputs match real NFL distributions and that emergent behaviours remain believable.

## Objectives

1. **Statistical realism:** Align league‑wide statistics (e.g., points per game, turnover rates, sack rates, contract distributions) with historical NFL ranges.
2. **Behavioural accuracy:** Ensure cognitive models (decision‑making speed, play learning) and relationship dynamics produce plausible narratives and performance swings.
3. **Iterative refinement:** Provide a repeatable process for adjusting weights and formulas as new data or player feedback emerges.

## Data Sources

To calibrate the simulation, anonymised and sanitised real NFL datasets should be used.  These include:

- Season and game statistics: scoring averages, yardage distributions, interception and fumble rates.
- Player contracts: salary cap percentages by position, guarantee structures, contract length distributions.
- Combine and pro‑day results: distributions of physical metrics (40‑yard dash, bench press, vertical jump).
- Cognitive and personality metrics: correlations between AIQ/S2 scores and performance【258899860156224†L230-L246】【258899860156224†L314-L322】.

Data must be stripped of trademarks and personally identifiable information.  When using third‑party APIs or scraping sites, respect their terms of service and privacy policies.

## Calibration Process

1. **Anchoring:** Use real distributions to set the initial ranges for attributes.  For example, quarterback completion percentages should cluster around 60–70%, while interception rates should average around 2–3% of pass attempts.
2. **Monte Carlo simulation:** Run thousands of full seasons with varying seeds.  Record aggregate metrics (e.g., league points per game, average contract values, number of trades) and compare them to historical ranges.
3. **Parameter tuning:** Identify discrepancies and adjust model weights.  If sacks per game are too high, reduce the effectiveness of pass rushers or increase blocking modifiers.  Use gradient descent or manual tuning to bring metrics into alignment.
4. **Behavioural checks:** Review emergent narratives and decision patterns.  Confirm that GMs behave according to their archetypes and that player relationships evolve realistically.  Adjust thresholds for trust, sentiment and careerGoals if certain scenarios (e.g., trade demands) occur too frequently.
5. **External validation:** Share beta builds with experienced sports simulation players and former football staff to collect qualitative feedback on realism.  Use this feedback to refine weightings and algorithms.

## Validation Tools

- **Analytics dashboards:** Use the analytics interface described in the engine spec to visualise distributions and time series of key metrics.
- **Unit tests with statistical assertions:** Implement tests that assert metrics remain within acceptable ranges (e.g., average points per game within ±10% of historical average).  These tests run as part of CI to catch regressions.
- **Scenario analysis scripts:** Create scripts that simulate specific scenarios (e.g., a high‑trust QB–WR duo vs. a low‑trust duo) and compare outcomes.  This helps verify that relationship dynamics operate as intended【353051572430034†L348-L362】.

## Ongoing Maintenance

Calibration is not a one‑time activity; it must be revisited as new features are added or as the NFL evolves (e.g. rule changes increasing scoring).  Maintain a changelog of tuning adjustments and the rationale behind them.  Periodically update the anonymised datasets to reflect recent seasons, and rerun the calibration process to keep the simulation current.
