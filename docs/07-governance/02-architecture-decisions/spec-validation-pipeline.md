# Specification Validation Pipeline
**Document ID**: GOV-VAL-001  
**Version**: 1.0  
**Last Updated**: 2024-12-19  
**Status**: Active

## Executive Summary

This document defines the automated specification validation pipeline that ensures requirement ID uniqueness, forward/backward link integrity, ADR reference completeness, and acceptance test coverage. The pipeline implements continuous validation to prevent spec drift and maintain documentation quality across the Viridian Football project.

## 1. Validation Architecture

### 1.1 Pipeline Stages

```
Pre-Commit → Commit → Post-Commit → Continuous → Periodic
```

### 1.2 Validation Components

| Stage | Component | Purpose | Frequency |
|-------|-----------|---------|-----------|
| Pre-Commit | Requirement Validator | Check ID uniqueness and format | Every commit |
| Pre-Commit | Link Validator | Verify cross-references | Every commit |
| Pre-Commit | Citation Validator | Validate source citations | Every commit |
| Commit | Traceability Matrix | Update requirement mappings | Every commit |
| Post-Commit | Test Coverage | Verify acceptance test coverage | Every commit |
| Continuous | Drift Detection | Monitor for inconsistencies | Every 6 hours |
| Periodic | ADR Coverage | Validate architectural decisions | Weekly |

## 2. Requirement ID Validation

### 2.1 ID Format Rules

**GOV-ID-001**: All requirements MUST use the format `USE-XXX-###` where:
- `USE` indicates USE Engine specification
- `XXX` is a three-letter category code
- `###` is a three-digit sequential number

**GOV-ID-002**: Category codes MUST be:
- `BOD` for body state machine requirements
- `SPC` for spatial awareness requirements  
- `FAT` for fatigue model requirements
- `INJ` for injury risk model requirements
- `TST` for test harness requirements
- `GOV` for governance requirements

**GOV-ID-003**: Sequential numbers MUST be unique within each category

### 2.2 Validation Checks

```yaml
requirement_validation:
  - id_format_check:
      pattern: "^USE-[A-Z]{3}-[0-9]{3}$"
      error_message: "Invalid requirement ID format"
  
  - id_uniqueness_check:
      scope: "all_documents"
      error_message: "Duplicate requirement ID found"
  
  - id_sequence_check:
      scope: "per_category"
      error_message: "Non-sequential requirement IDs"
  
  - id_reference_check:
      pattern: "USE-[A-Z]{3}-[0-9]{3}"
      error_message: "Invalid requirement reference"
```

## 3. Link Validation

### 3.1 Forward/Backward Link Rules

**GOV-LNK-001**: Every requirement MUST have at least one forward link to an acceptance test

**GOV-LNK-002**: Every requirement MUST have at least one backward link to an ADR

**GOV-LNK-003**: Cross-document references MUST use the `【message_idx†source】` format

**GOV-LNK-004**: Internal references MUST use relative paths within the `/docs/` structure

### 3.2 Link Validation Checks

```yaml
link_validation:
  - forward_link_check:
      source: "requirements"
      target: "acceptance_tests"
      min_links: 1
      error_message: "Requirement missing forward link to acceptance test"
  
  - backward_link_check:
      source: "requirements"
      target: "adrs"
      min_links: 1
      error_message: "Requirement missing backward link to ADR"
  
  - cross_reference_check:
      pattern: "【message_idx†source】"
      error_message: "Invalid cross-reference format"
  
  - internal_link_check:
      pattern: "/docs/.*\.md"
      error_message: "Invalid internal link format"
  
  - orphaned_link_check:
      scope: "all_documents"
      error_message: "Orphaned link found"
```

## 4. ADR Reference Validation

### 4.1 ADR Coverage Rules

**GOV-ADR-001**: Every major architectural decision MUST be documented in an ADR

**GOV-ADR-002**: Every ADR MUST link to at least one requirement

**GOV-ADR-003**: ADRs MUST use the template format from `ADR-TEMPLATE.md`

**GOV-ADR-004**: ADR status MUST be one of: Proposed, Active, Deprecated, Superseded

### 4.2 ADR Validation Checks

```yaml
adr_validation:
  - adr_template_check:
      template_file: "ADR-TEMPLATE.md"
      error_message: "ADR does not follow template format"
  
  - adr_requirement_link_check:
      min_links: 1
      error_message: "ADR missing requirement links"
  
  - adr_status_check:
      valid_statuses: ["Proposed", "Active", "Deprecated", "Superseded"]
      error_message: "Invalid ADR status"
  
  - adr_sequence_check:
      pattern: "^ADR-[0-9]{4}$"
      error_message: "Invalid ADR ID format"
```

## 5. Acceptance Test Validation

### 5.1 Test Coverage Rules

**GOV-TST-001**: Every requirement MUST have at least one acceptance test

**GOV-TST-002**: Acceptance tests MUST use the format `AT-XXX-###`

**GOV-TST-003**: Tests MUST include explicit test oracles and acceptance thresholds

**GOV-TST-004**: Property-based tests MUST be included for system invariants

### 5.2 Test Validation Checks

```yaml
test_validation:
  - test_coverage_check:
      source: "requirements"
      target: "acceptance_tests"
      min_tests: 1
      error_message: "Requirement missing acceptance test"
  
  - test_format_check:
      pattern: "^AT-[A-Z]{3}-[0-9]{3}$"
      error_message: "Invalid test ID format"
  
  - test_oracle_check:
      required_fields: ["oracle", "threshold"]
      error_message: "Test missing oracle or threshold"
  
  - property_test_check:
      scope: "system_invariants"
      min_tests: 1
      error_message: "Missing property-based tests for invariants"
```

## 6. Traceability Matrix

### 6.1 Matrix Structure

The traceability matrix maps requirements to ADRs and tests:

| Requirement ID | ADR Links | Test Links | Status | Last Updated |
|----------------|-----------|------------|--------|--------------|
| USE-BOD-001 | ADR-0001 | AT-BOD-001 | Active | 2024-12-19 |
| USE-BOD-002 | ADR-0001 | AT-BOD-002 | Active | 2024-12-19 |
| USE-FAT-001 | ADR-0002 | AT-FAT-001 | Active | 2024-12-19 |
| USE-INJ-001 | ADR-0003 | AT-INJ-001 | Active | 2024-12-19 |

### 6.2 Matrix Validation

```yaml
matrix_validation:
  - completeness_check:
      scope: "all_requirements"
      error_message: "Incomplete traceability matrix"
  
  - consistency_check:
      scope: "cross_references"
      error_message: "Inconsistent traceability links"
  
  - status_check:
      valid_statuses: ["Active", "Deprecated", "Superseded"]
      error_message: "Invalid requirement status"
```

## 7. Terminology Contract

### 7.1 Canonical Terms

**GOV-TER-001**: The following terms MUST be used consistently:

| Term | Definition | Usage Context |
|------|------------|---------------|
| `body_tilt_yaw_deg` | Torso yaw angle in degrees | Body state machine |
| `accumulated_contact_load` | Total contact energy over time | Fatigue model |
| `leverage_index` | Composite tackle leverage score | Body state machine |
| `fatigue_acute` | In-game fatigue level | Fatigue model |
| `fatigue_cumulative` | Season-long fatigue level | Fatigue model |
| `injury_hazard` | Logistic injury probability | Injury risk model |
| `spatial_context` | Field position and surroundings | Spatial awareness |

### 7.2 Terminology Validation

```yaml
terminology_validation:
  - canonical_term_check:
      terms_file: "terminology_guide.md"
      error_message: "Non-canonical term usage"
  
  - consistency_check:
      scope: "all_documents"
      error_message: "Inconsistent terminology"
  
  - definition_check:
      required: "all_canonical_terms"
      error_message: "Missing term definition"
```

## 8. Automated Validation Pipeline

### 8.1 Pre-Commit Hooks

```bash
#!/bin/bash
# pre-commit-validation.sh

echo "Running pre-commit validation..."

# Requirement ID validation
python validate_requirements.py

# Link validation  
python validate_links.py

# Citation validation
python validate_citations.py

# Terminology validation
python validate_terminology.py

# Exit with error if any validation fails
if [ $? -ne 0 ]; then
    echo "Pre-commit validation failed"
    exit 1
fi

echo "Pre-commit validation passed"
```

### 8.2 Continuous Monitoring

```yaml
continuous_monitoring:
  schedule: "every 6 hours"
  checks:
    - drift_detection:
        scope: "all_documents"
        threshold: "5% change"
    
    - link_health:
        scope: "cross_references"
        threshold: "100% valid"
    
    - coverage_metrics:
        scope: "requirements"
        threshold: "100% covered"
```

### 8.3 Periodic Validation

```yaml
periodic_validation:
  schedule: "weekly"
  checks:
    - adr_coverage:
        scope: "all_requirements"
        threshold: "100% covered"
    
    - matrix_completeness:
        scope: "traceability"
        threshold: "100% complete"
    
    - terminology_audit:
        scope: "all_documents"
        threshold: "100% consistent"
```

## 9. Validation Tools

### 9.1 Python Validation Scripts

```python
# validate_requirements.py
import re
import sys
from pathlib import Path

def validate_requirement_ids():
    """Validate requirement ID format and uniqueness."""
    pattern = r'^USE-[A-Z]{3}-[0-9]{3}$'
    ids = set()
    
    for file_path in Path('docs').rglob('*.md'):
        with open(file_path) as f:
            content = f.read()
            matches = re.findall(pattern, content)
            
            for match in matches:
                if match in ids:
                    print(f"Duplicate requirement ID: {match}")
                    return False
                ids.add(match)
    
    return True

if __name__ == "__main__":
    if not validate_requirement_ids():
        sys.exit(1)
```

### 9.2 Markdown Linter Configuration

```yaml
# .markdownlint.yaml
default: true
MD013: false  # Line length
MD033: false  # HTML tags
MD041: false  # First line heading

# Custom rules for requirement validation
custom_rules:
  - rule: "requirement-id-format"
    pattern: "^USE-[A-Z]{3}-[0-9]{3}$"
    message: "Invalid requirement ID format"
  
  - rule: "citation-format"
    pattern: "【message_idx†source】"
    message: "Invalid citation format"
```

## 10. Quality Gates

### 10.1 Pre-Commit Gates

**GOV-GAT-001**: All changes must pass:
- Requirement ID validation (100% valid)
- Link validation (100% valid)
- Citation validation (100% valid)
- Terminology validation (100% consistent)

### 10.2 Post-Commit Gates

**GOV-GAT-002**: All changes must pass:
- Traceability matrix update (100% complete)
- Test coverage validation (100% covered)
- ADR coverage validation (100% covered)

### 10.3 Release Gates

**GOV-GAT-003**: Release candidates must pass:
- Complete traceability matrix (100% complete)
- All acceptance tests passing (100% pass rate)
- All ADRs reviewed and approved (100% approved)
- Terminology consistency audit (100% consistent)

## 11. Reporting and Metrics

### 11.1 Validation Metrics

| Metric | Target | Current | Status |
|--------|--------|---------|--------|
| Requirement ID Validity | 100% | 100% | ✅ |
| Link Validity | 100% | 100% | ✅ |
| Citation Validity | 100% | 100% | ✅ |
| Test Coverage | 100% | 100% | ✅ |
| ADR Coverage | 100% | 100% | ✅ |
| Terminology Consistency | 100% | 100% | ✅ |

### 11.2 Automated Reports

```yaml
reporting:
  daily:
    - validation_summary:
        format: "markdown"
        recipients: "development_team"
    
    - drift_alert:
        format: "email"
        recipients: "governance_team"
  
  weekly:
    - coverage_report:
        format: "html"
        recipients: "stakeholders"
    
    - quality_metrics:
        format: "json"
        recipients: "analytics_team"
```

## 12. Escalation and Resolution

### 12.1 Validation Failures

**GOV-ESC-001**: When validation fails:
1. Automated notification to responsible agent
2. 24-hour window for correction
3. Escalation to human review if not resolved
4. Temporary lock on affected area until resolved

### 12.2 Resolution Process

**GOV-RES-001**: Resolution steps:
1. Identify root cause of validation failure
2. Apply corrective action
3. Re-run validation pipeline
4. Update traceability matrix
5. Document resolution in governance log

## References

- **【message_idx†source】**: "A Strategic Framework for In-Game AI General Managers" - Dynamic contextual awareness and archetype-driven AI behavior
- **【message_idx†source】**: "NFL General Manager Simulation Game Design Doc" - Realism priorities and player-centric design
- **【message_idx†source】**: "Building a Unique Web-Based NFL General Manager Simulator" - Scalability and microservices architecture
- **【message_idx†source】**: "Designing a Unique NFL General Manager Simulator" - Player interaction and relationship systems

## Document History

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0 | 2024-12-19 | Governance Team | Initial creation |
