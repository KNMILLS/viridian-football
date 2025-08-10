# Testing and Quality Assurance Framework

This document defines the testing and quality‑assurance (QA) strategy for **Viridian Football**.  Because the Unified Simulation Engine (USE) contains hundreds of interacting variables and emergent behaviours, a rigorous testing framework is essential to ensure reliability, performance and realism.

## Objectives

1. **Functional correctness:** Verify that all modules (scouting, drafting, training, contracts, play simulation, narrative events) behave according to the specifications.
2. **Regression prevention:** Catch inadvertent changes that break existing functionality or degrade performance.
3. **Statistical validation:** Ensure that simulated outputs (e.g. scoring averages, sack rates, contract values) fall within realistic ranges when compared to real NFL data.
4. **User experience:** Confirm that the UI remains responsive, accessible and free of critical bugs across supported platforms (web and desktop).

## Testing Layers

### Unit Tests

- **Scope:** Individual functions, classes and methods.  For example, verify that the **ProspectEV** formula returns higher values for higher draft grades and that the **SurplusValue** calculation handles edge cases (e.g. zero contract cost).
- **Tools:** Use a standard test framework (e.g. JUnit for Java, Jest for TypeScript) and assertions with descriptive names.  Ensure 80–90 % code coverage on critical modules.
- **Mocks and stubs:** For modules that depend on external data (e.g. the draft database or random number generator), use mocks to isolate unit tests from side effects.

### Integration Tests

- **Scope:** Ensure that modules interact correctly.  Examples include running a contract negotiation to completion, verifying that player morale updates propagate through the roster, or simulating a single play and ensuring that statistics update correctly.
- **Database integration:** Run tests against a containerised PostgreSQL instance seeded with test data.  Validate that schema migrations apply cleanly and that queries perform efficiently.
- **API integration:** For the web client, write tests that call REST endpoints, validate responses and ensure that the WebAssembly module exposes expected functions.

### Simulation Validation

- **Monte Carlo simulation tests:** Run thousands of seasons with random seeds and measure aggregate metrics (points per game, interception rates, salary distributions).  Assert that these metrics fall within ±10 % of historical NFL averages.  These tests can be long‑running and executed nightly in continuous integration.
- **Scenario tests:** Create scripted scenarios (e.g. a holdout player demanding a trade, a team with all rookies on the offensive line) and verify that the engine responds plausibly.  Check that holdouts accrue fines according to the CBA【268175057422694†L103-L123】, that suspensions remove players from rosters【858630473397054†L219-L326】, and that morale effects follow the rules defined in the specification.
- **Edge‑case tests:** Simulate extreme conditions (e.g. maximum injuries, complete lack of scout information, salary cap violations) and ensure the engine handles them gracefully without crashing.

### Property‑Based Tests

- Use property‑based testing (e.g. with QuickCheck or jqwik) to generate random inputs and assert invariants.  For instance, the outcome probability for a pass play should always be between 0 and 1; increasing a quarterback’s accuracy should never decrease his completion rate; decreasing trust should never increase the probability of a successful adjustment.

### Performance Tests

- **Benchmark suites:** Include performance benchmarks for key operations (play simulation, season simulation, contract negotiation).  These tests measure execution time and memory usage on representative hardware and ensure they meet the performance goals defined in the performance strategy.
- **CI gating:** Set thresholds (e.g. simulating an 18‑week season in under 60 seconds).  If a merge request causes a significant slowdown, block the merge until optimisations are applied.

### UI/UX Tests

- **Snapshot tests:** For the React interface, use snapshot testing to catch unintentional visual changes.  Ensure that data‑dense widgets render correctly across screen sizes.
- **End‑to‑end tests:** Use tools like Cypress or Playwright to automate user journeys: signing a free agent, navigating the draft war room, negotiating a contract.  Verify that forms validate input and that the app remains responsive.
- **Accessibility checks:** Run automated accessibility audits (e.g. using axe-core) to flag issues, and conduct manual checks for colour contrast and keyboard navigation.

## Continuous Integration (CI) and Deployment (CD)

1. **CI pipeline:** Every pull request triggers a pipeline that:
   - Installs dependencies and the correct Java/Node toolchains.
   - Runs unit, integration and property tests.
   - Executes performance benchmarks and fails if thresholds are exceeded.
   - Builds the WebAssembly module and the React application.
   - Lints code and checks for security vulnerabilities.
2. **CD pipeline:** On merge to `main`, the pipeline packages the latest build and publishes artefacts (e.g. `.jar`, `.wasm`, `.zip` releases).  For the web app, deploy to a staging environment for smoke testing before public release.

## QA Processes

- **Bug tracking:** Use an issue tracker (e.g. GitHub Issues) with labels for severity and module.  Triage bugs daily and prioritise critical user‑facing issues.
- **Beta testing:** Recruit a group of external testers, including experienced sports sim players and subject‑matter experts.  Provide them with builds through Steam or Itch.io and collect qualitative feedback on realism and usability.
- **Regression audit:** Before major releases, perform a full regression audit reviewing past issues to ensure they remain resolved.
- **Documentation:** Maintain a test plan documenting test cases, expected outcomes, and regression results.  Keep it in sync with code changes and specification updates.

## Summary

The complexity of Viridian Football necessitates a layered testing and QA approach.  By combining unit, integration, property and simulation tests with stringent CI/CD pipelines and external feedback, the development team can detect defects early, maintain statistical realism and deliver a stable, polished experience to players.