# Agent Governance Framework
**Document ID**: GOV-AGN-001  
**Version**: 1.0  
**Last Updated**: 2024-12-19  
**Status**: Active

## Executive Summary

This document establishes the governance framework for multi-agent development in the Viridian Football project, ensuring coordinated, accurate, and traceable specification development. The framework addresses key risks identified in the project summary: coordination breakdown, hallucination/spec drift, QA gaps, and technical debt accumulation.

## 1. Agent Roles & RASCI Matrix

### 1.1 Defined Agent Roles

| Role | Primary Responsibility | Secondary Responsibility | Consulted | Informed |
|------|----------------------|-------------------------|-----------|----------|
| **Spec Editor** | Create/modify core specifications | Validate requirement IDs | Cross-Doc Integrator | All agents |
| **Cross-Doc Integrator** | Ensure consistency across documents | Resolve conflicts | Spec Editor, QA Author | All agents |
| **QA Author** | Create acceptance tests | Validate traceability | Spec Editor | All agents |
| **ADR Author** | Document architectural decisions | Link decisions to requirements | Spec Editor | All agents |
| **Review Agent** | Validate changes against governance | Flag violations | All agents | All agents |

### 1.2 Role-Specific Responsibilities

#### Spec Editor (USE-SPEC-001)
- **Primary**: Create and modify core USE Engine specifications
- **Must**: Assign unique requirement IDs (format: `USE-XXX-###`)
- **Must**: Include acceptance test references for each requirement
- **Must**: Cite authoritative sources using `【message_idx†source】` format
- **Must**: Update traceability matrix in `spec-validation-pipeline.md`

#### Cross-Doc Integrator (USE-INT-001)
- **Primary**: Ensure consistency across all specification documents
- **Must**: Validate terminology consistency against `terminology_guide.md`
- **Must**: Check for orphaned references and broken links
- **Must**: Resolve conflicts between parallel specification changes
- **Must**: Update cross-reference sections in existing documents

#### QA Author (USE-QA-001)
- **Primary**: Create comprehensive acceptance tests
- **Must**: Write tests for every requirement with ID format `AT-XXX-###`
- **Must**: Include test oracles and acceptance thresholds
- **Must**: Validate test coverage against traceability matrix
- **Must**: Ensure property-based tests for system invariants

#### ADR Author (USE-ADR-001)
- **Primary**: Document architectural decisions and rationale
- **Must**: Use ADR template format from `ADR-TEMPLATE.md`
- **Must**: Link decisions to affected requirements
- **Must**: Document alternatives considered and consequences
- **Must**: Update ADR index and cross-references

## 2. Single Source of Truth (SSOT) Architecture

### 2.1 SSOT Structure

```
/docs/
├── governance/           # Normative requirements and processes
│   ├── agent-governance.md
│   ├── spec-validation-pipeline.md
│   ├── qa-strategy.md
│   └── adr/
├── use-engine/          # Core USE Engine specifications
│   ├── overview.md
│   ├── body-state-machine.md
│   ├── spatial-awareness-and-field-context.md
│   ├── fatigue-model.md
│   ├── injury-risk-model.md
│   └── test-harness-and-validation.md
├── roadmap/             # Implementation planning
└── operations/          # Runtime controls and monitoring
```

### 2.2 SSOT Rules

**GOV-SSOT-001**: All normative requirements MUST be stored under `/docs/governance/*` or `/docs/use-engine/*`

**GOV-SSOT-002**: No requirement may exist outside the SSOT structure

**GOV-SSOT-003**: All requirements MUST have unique IDs and traceability links

**GOV-SSOT-004**: Cross-references to existing documents MUST use the `【message_idx†source】` citation format

## 3. Structured Handoff Process

### 3.1 Handoff Stages

```
PRD → Spec → ADR → Test → Review → Approval
```

### 3.2 Stage-Specific Checklists

#### PRD to Spec Handoff (GOV-HND-001)
- [ ] Requirement IDs assigned (format: `USE-XXX-###`)
- [ ] Acceptance criteria defined
- [ ] Authoritative sources cited
- [ ] Cross-document dependencies identified
- [ ] Terminology validated against guide

#### Spec to ADR Handoff (GOV-HND-002)
- [ ] Architectural decisions documented
- [ ] Alternatives considered and rejected
- [ ] Consequences analyzed
- [ ] Links to affected requirements established
- [ ] ADR template compliance verified

#### ADR to Test Handoff (GOV-HND-003)
- [ ] Acceptance tests written for all requirements
- [ ] Test oracles defined
- [ ] Property-based tests included
- [ ] Coverage matrix updated
- [ ] Integration test scenarios identified

#### Test to Review Handoff (GOV-HND-004)
- [ ] Traceability matrix validated
- [ ] Cross-document consistency verified
- [ ] Citation accuracy confirmed
- [ ] Governance compliance checked
- [ ] Quality gates passed

## 4. Prompt Patterns & Guardrails

### 4.1 Role-Specific Guardrail Prompts

#### Spec Editor Guardrail (GOV-PRM-001)
```
You are a Spec Editor agent. Before making any changes:

1. QUOTE the requirement ID you are modifying
2. LINK to the acceptance test you are touching
3. CITE the authoritative source using 【message_idx†source】 format
4. VALIDATE against terminology guide
5. UPDATE traceability matrix

If you cannot complete all steps, STOP and request clarification.
```

#### Cross-Doc Integrator Guardrail (GOV-PRM-002)
```
You are a Cross-Doc Integrator agent. Before integrating changes:

1. CHECK for terminology consistency
2. VERIFY all cross-references are valid
3. RESOLVE any conflicts between parallel changes
4. UPDATE cross-reference sections
5. VALIDATE against SSOT rules

If conflicts cannot be resolved, ESCALATE to human review.
```

#### QA Author Guardrail (GOV-PRM-003)
```
You are a QA Author agent. Before creating tests:

1. VERIFY requirement ID exists and is valid
2. WRITE test with format AT-XXX-###
3. DEFINE test oracle and acceptance threshold
4. INCLUDE property-based tests for invariants
5. UPDATE coverage matrix

If requirement is unclear, REQUEST clarification from Spec Editor.
```

### 4.2 Change Validation Prompts

#### Pre-Commit Validation (GOV-VAL-001)
```
Before committing changes, validate:

1. All requirements have unique IDs
2. All requirements have acceptance tests
3. All citations use correct format
4. All cross-references are valid
5. Terminology is consistent
6. Traceability matrix is updated

If any validation fails, STOP and fix before proceeding.
```

## 5. Change Windows & Locks

### 5.1 Write Lock System

**GOV-LCK-001**: Only one agent may have write access to a specification area at a time

**GOV-LCK-002**: Write locks are automatically acquired when an agent begins work on a spec area

**GOV-LCK-003**: Write locks are automatically released after 4 hours of inactivity

**GOV-LCK-004**: Changes outside the locked scope are automatically rejected

### 5.2 Change Window Schedule

| Time Window | Primary Agent | Secondary Agent | Lock Scope |
|-------------|---------------|-----------------|------------|
| 09:00-12:00 | Spec Editor | Cross-Doc Integrator | `/docs/use-engine/*` |
| 12:00-15:00 | QA Author | Spec Editor | `/docs/use-engine/test-*` |
| 15:00-18:00 | ADR Author | Spec Editor | `/docs/governance/adr/*` |
| 18:00-21:00 | Cross-Doc Integrator | All agents | Cross-document consistency |

### 5.3 Lock Management

**GOV-LCK-005**: Lock requests must specify scope and estimated duration

**GOV-LCK-006**: Lock conflicts trigger automatic escalation to human review

**GOV-LCK-007**: Emergency locks may be requested with justification

## 6. Spec Drift Detection

### 6.1 Automated Detection Rules

**GOV-DET-001**: Pre-commit linter checks for:
- Requirements without IDs
- Requirements without tests
- Orphaned references
- Inconsistent terminology
- Missing citations

**GOV-DET-002**: Daily automated scans for:
- Broken cross-references
- Inconsistent requirement formats
- Missing traceability links
- Citation format violations

**GOV-DET-003**: Weekly validation checks for:
- Complete traceability matrix
- ADR coverage completeness
- Test coverage adequacy
- Governance compliance

### 6.2 Drift Response Process

**GOV-DET-004**: When drift is detected:
1. Automatic notification to responsible agent
2. 24-hour window for correction
3. Escalation to human review if not resolved
4. Temporary lock on affected area until resolved

## 7. Quality Gates & Validation

### 7.1 Pre-Commit Gates

**GOV-GAT-001**: All changes must pass:
- Requirement ID validation
- Test coverage validation
- Citation format validation
- Terminology consistency validation
- Cross-reference validation

**GOV-GAT-002**: Integration changes must additionally pass:
- Traceability matrix validation
- ADR coverage validation
- Governance compliance validation

### 7.2 Post-Commit Validation

**GOV-GAT-003**: Automated post-commit checks:
- Build system integration
- Documentation generation
- Link validation
- Format consistency

**GOV-GAT-004**: Manual review triggers:
- New requirement creation
- ADR creation
- Major specification changes
- Governance rule changes

## 8. Escalation & Human Override

### 8.1 Escalation Criteria

**GOV-ESC-001**: Automatic escalation triggers:
- Lock conflicts that cannot be resolved
- Spec drift not corrected within 24 hours
- Quality gate failures after 3 attempts
- Cross-document conflicts requiring human judgment

**GOV-ESC-002**: Manual escalation triggers:
- Agent behavior inconsistent with governance
- Repeated quality violations
- Complex architectural decisions
- Governance rule interpretation disputes

### 8.2 Human Override Process

**GOV-OVR-001**: Human override may be requested when:
- Automated systems are blocking legitimate work
- Governance rules conflict with project needs
- Emergency changes are required
- Complex decisions need human judgment

**GOV-OVR-002**: Override process:
1. Document justification for override
2. Identify affected governance rules
3. Propose alternative approach
4. Get human approval
5. Update governance rules if needed

## 9. Monitoring & Metrics

### 9.1 Key Metrics

**GOV-MET-001**: Track the following metrics:
- Requirements without tests (target: 0%)
- Broken cross-references (target: 0%)
- Citation format violations (target: 0%)
- Lock conflicts per day (target: <5)
- Spec drift incidents per week (target: <2)
- Quality gate failure rate (target: <10%)

### 9.2 Reporting

**GOV-MET-002**: Daily automated reports on:
- Current lock status
- Quality gate results
- Drift detection results
- Agent activity levels

**GOV-MET-003**: Weekly governance review:
- Metric trends and anomalies
- Process effectiveness assessment
- Rule optimization opportunities
- Agent performance evaluation

## 10. Continuous Improvement

### 10.1 Process Optimization

**GOV-IMP-001**: Monthly governance review to:
- Analyze metric trends
- Identify process bottlenecks
- Optimize agent workflows
- Update governance rules

**GOV-IMP-002**: Quarterly governance assessment to:
- Evaluate overall effectiveness
- Identify new risks
- Propose major improvements
- Update governance framework

### 10.2 Rule Evolution

**GOV-IMP-003**: Governance rules may be updated when:
- New risks are identified
- Process inefficiencies are discovered
- Agent capabilities evolve
- Project requirements change

**GOV-IMP-004**: Rule changes require:
- Impact analysis
- Agent notification
- Training updates
- Validation testing

## References

- **【message_idx†source】**: "A Strategic Framework for In-Game AI General Managers" - Dynamic contextual awareness and archetype-driven AI behavior
- **【message_idx†source】**: "NFL General Manager Simulation Game Design Doc" - Realism priorities and player-centric design
- **【message_idx†source】**: "Building a Unique Web-Based NFL General Manager Simulator" - Scalability and microservices architecture
- **【message_idx†source】**: "Designing a Unique NFL General Manager Simulator" - Player interaction and relationship systems

## Document History

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0 | 2024-12-19 | Governance Team | Initial creation |
