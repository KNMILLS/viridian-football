# Viridian Football - Terminology Standards
============================================

## 📋 Document Information
- **Document Type**: Terminology Standards & Style Guide
- **Version**: 2.0
- **Status**: AUTHORITATIVE - Enforced across all documentation
- **Date**: December 2024

## 🎯 Purpose

This document establishes **mandatory terminology standards** for all Viridian Football project documentation, code, and communications. These standards resolve the inconsistencies identified in the comprehensive discrepancy analysis.

## 🚫 Zero-Tolerance Inconsistencies

### ❌ CRITICAL FIXES REQUIRED

The following terms MUST be corrected immediately across ALL 70+ affected files:

#### 1. "USE" - Unified Simulation Engine
- ✅ **CORRECT**: "USE" (always capitalized)
- ❌ **INCORRECT**: "use", "Use", "use engine"
- **Rule**: USE is an acronym and must always be capitalized
- **Files Affected**: 70+ files with 995+ occurrences

#### 2. Entity Names (Programming Context)
- ✅ **CORRECT**: "Player" (capitalized when referring to the entity/class)
- ❌ **INCORRECT**: "player" (lowercase in entity context)
- **Rule**: When referring to code entities, classes, or formal objects, capitalize
- **Exception**: Use lowercase in general descriptive text ("the player runs")

#### 3. Technology Names
- ✅ **CORRECT**: "Java" (always capitalized - proper noun)
- ❌ **INCORRECT**: "java"
- ✅ **CORRECT**: "PostgreSQL" (official spelling)
- ❌ **INCORRECT**: "postgres", "Postgres"

#### 4. Platform References
- ✅ **CORRECT**: "web" (lowercase when used as adjective: "web application")
- ❌ **INCORRECT**: "Web" (don't capitalize unless starting sentence)
- **Exception**: "World Wide Web" (proper noun)

#### 5. Generic Terms
- ✅ **CORRECT**: "simulation engine" (lowercase)
- ❌ **INCORRECT**: "Simulation Engine" (only capitalize if referring to specific product)

## 📖 Complete Terminology Dictionary

### Core Project Terms

| Term | Correct Usage | Incorrect Alternatives | Definition |
|------|---------------|----------------------|------------|
| **USE** | USE (always caps) | use, Use | Unified Simulation Engine |
| **Viridian Football** | Viridian Football | viridian football, ViridianFootball | Official project name |
| **General Manager** | General Manager, GM | gm, general manager | Team management role |
| **artificial intelligence** | AI, artificial intelligence | ai, Ai | Technology category |

### Technical Terms

| Term | Correct Usage | Incorrect Alternatives | Context |
|------|---------------|----------------------|---------|
| **Java** | Java | java | Programming language (proper noun) |
| **JavaScript** | JavaScript | javascript, Javascript | Programming language |
| **PostgreSQL** | PostgreSQL | postgres, Postgres, PostgreSql | Database system |
| **WebAssembly** | WebAssembly, WASM | webassembly, wasm | Web technology |
| **API** | API | api, Api | Application Programming Interface |
| **JSON** | JSON | json, Json | Data format |
| **REST** | REST | rest, Rest | API architecture |
| **UUID** | UUID | uuid, Uuid | Identifier format |

### Football Terms

| Term | Correct Usage | Incorrect Alternatives | Context |
|------|---------------|----------------------|---------|
| **NFL** | NFL | nfl, Nfl | National Football League |
| **quarterback** | quarterback, QB | quarter-back, Quarter Back | Position name |
| **salary cap** | salary cap | Salary Cap, salarycap | Financial constraint |
| **franchise tag** | franchise tag | Franchise Tag | Contract mechanism |

### Entity Names (Code Context)

| Term | Correct Usage | Context | Example |
|------|---------------|---------|---------|
| **Player** | Capitalized | Class/entity reference | "The Player entity stores..." |
| **player** | Lowercase | General description | "Each player has attributes..." |
| **Team** | Capitalized | Class/entity reference | "Team.java contains..." |
| **team** | Lowercase | General description | "A team consists of players..." |
| **Game** | Capitalized | Class/entity reference | "Game entity relationships..." |
| **game** | Lowercase | General description | "During a game simulation..." |

### File and Directory Names

| Type | Convention | Example | Notes |
|------|------------|---------|-------|
| **Java Classes** | PascalCase | `USEEngine.java` | Standard Java convention |
| **Java Packages** | lowercase.dot | `com.viridianfootball.engine` | Standard Java convention |
| **Documentation** | kebab-case | `player-data-model.md` | Consistent with existing structure |
| **Directories** | kebab-case | `01-vision-strategy/` | Existing project standard |
| **Constants** | UPPER_SNAKE | `MAX_ROSTER_SIZE` | Java constant convention |

## 🔧 Implementation Rules

### Documentation Standards

#### Capitalization Rules
1. **Proper nouns**: Always capitalize (Java, PostgreSQL, NFL)
2. **Acronyms**: Always capitalize (USE, API, NFL)
3. **Technology names**: Follow official spelling
4. **Entity names**: Capitalize in code context, lowercase in descriptive text
5. **File references**: Use exact filename including case

#### Formatting Standards
```markdown
✅ CORRECT Examples:
- "The USE engine processes..."
- "Player entity in Java..."
- "Each player has multiple..."
- "API endpoints return JSON..."
- "PostgreSQL database stores..."

❌ INCORRECT Examples:
- "The use engine processes..."
- "player entity in java..."
- "Each Player has multiple..."
- "Api endpoints return json..."
- "postgres database stores..."
```

### Code Standards

#### Java Naming Conventions
```java
// ✅ CORRECT
public class Player {
    private static final int MAX_ROSTER_SIZE = 53;
    private UUID playerId;
    private String firstName;
}

// ❌ INCORRECT  
public class player {
    private static final int max_roster_size = 53;
    private UUID PlayerID;
    private String FirstName;
}
```

#### Package Naming
```java
// ✅ CORRECT
package com.viridianfootball.engine.core;
package com.viridianfootball.simulation.physics;

// ❌ INCORRECT
package com.ViridianFootball.Engine.Core;
package com.viridian_football.simulation.Physics;
```

## 🛠️ Automated Validation

### Terminology Checking Script
Create automated checking for documentation:

```bash
#!/bin/bash
# terminology-check.sh
grep -r "use engine" docs/ && echo "ERROR: Found 'use engine' - should be 'USE'"
grep -r "java\b" docs/ && echo "ERROR: Found lowercase 'java' - should be 'Java'"
grep -r "postgres\b" docs/ && echo "ERROR: Found 'postgres' - should be 'PostgreSQL'"
```

### IDE Configuration
For IntelliJ IDEA/VS Code:
- Set up spell checker with custom dictionary
- Configure code style rules for naming conventions
- Add live templates for common correct terms

## 📊 Priority Correction Areas

### High Priority (Fix Immediately)
1. **USE terminology** - 995 occurrences across 70 files
2. **Java capitalization** - 13+ files affected
3. **Entity name consistency** - Player/player confusion in 54+ files

### Medium Priority (Fix in Next Phase)
1. **Database terminology** - PostgreSQL vs postgres
2. **Web platform references** - web vs Web
3. **General simulation terms** - simulation engine capitalization

### Low Priority (Ongoing Maintenance)
1. **File naming consistency** 
2. **Code comment standards**
3. **API documentation formatting**

## 🎯 Enforcement Strategy

### Pre-commit Checks
- Run terminology validation script
- Check documentation for common errors
- Validate Java naming conventions

### Review Process
- All documentation changes require terminology review
- Code reviews must check naming conventions
- Automated testing includes terminology validation

### Training & Guidelines
- New contributor onboarding includes terminology training
- Style guide references in all documentation templates
- Regular terminology audits and updates

## 📋 Correction Checklist

### Phase 1: Critical Fixes
- [ ] Fix all "use" → "USE" occurrences (995+ instances)
- [ ] Fix all "java" → "Java" occurrences (13+ files)  
- [ ] Standardize Player/player entity references (54+ files)
- [ ] Fix "simulation engine" capitalization (34+ files)

### Phase 2: Technology Terms
- [ ] Standardize PostgreSQL references
- [ ] Fix API/JSON capitalization
- [ ] Correct WebAssembly/WASM usage
- [ ] Update REST API terminology

### Phase 3: Documentation Polish
- [ ] Verify all file references use correct case
- [ ] Check directory name consistency
- [ ] Validate code example formatting
- [ ] Update navigation and cross-references

## 🚨 Zero-Tolerance Policy

**NO EXCEPTIONS**: The following terms must NEVER appear in documentation or code:

- "use engine" (must be "USE")
- "java" in lowercase when referring to the language
- "Player" in lowercase when referring to the entity
- "postgres" when referring to PostgreSQL
- Mixed capitalization in acronyms (Api, Json, etc.)

**Violation Response**: 
1. Immediate correction required
2. Documentation review failure
3. Code review blocking
4. Automated testing failure

---

**This terminology standard is MANDATORY for all project contributions. Consistency is not optional - it is required for professional project quality.**