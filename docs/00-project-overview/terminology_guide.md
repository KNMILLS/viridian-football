# Viridian Football Project - Terminology Guide
===============================================

This document establishes the standard terminology to be used consistently across all Viridian Football project documentation.

## 🎯 Purpose
Ensure consistent usage of key terms, concepts, and naming conventions across all project documentation to improve clarity and reduce confusion.

## 📋 Core Terminology Standards

### Engine and Technology Terms

| Term | Standard Usage | Notes |
|------|----------------|-------|
| **USE** | Always capitalize as "USE" | Unified Simulation Engine - the core engine |
| **simulation engine** | Use lowercase "simulation engine" | Generic term for simulation engines |
| **Java** | Always capitalize as "Java" | Programming language |
| **WebAssembly** | Always capitalize as "WebAssembly" | Web technology |
| **REST API** | Always capitalize as "REST API" | Application programming interface |

### Platform and Architecture Terms

| Term | Standard Usage | Notes |
|------|----------------|-------|
| **web** | Use lowercase "web" | Web platform |
| **desktop** | Use lowercase "desktop" | Desktop platform |
| **hybrid** | Use lowercase "hybrid" | Hybrid architecture |
| **cross-platform** | Use lowercase "cross-platform" | Cross-platform compatibility |
| **microservices** | Use lowercase "microservices" | Architecture pattern |

### Game and Data Model Terms

| Term | Standard Usage | Notes |
|------|----------------|-------|
| **Player** | Always capitalize as "Player" | Game entity |
| **Team** | Always capitalize as "Team" | Game entity |
| **League** | Always capitalize as "League" | Game entity |
| **Game** | Always capitalize as "Game" | Game entity |
| **Contract** | Always capitalize as "Contract" | Game entity |
| **GM archetypes** | Use "GM archetypes" (lowercase "archetypes") | General Manager personality types |
| **player relationships** | Use lowercase "player relationships" | Player interaction system |
| **playbook modeling** | Use lowercase "playbook modeling" | Football scheme system |

### Project-Specific Terms

| Term | Standard Usage | Notes |
|------|----------------|-------|
| **Viridian Football** | Always capitalize as "Viridian Football" | Project name |
| **NFL** | Always capitalize as "NFL" | National Football League |
| **General Manager** | Always capitalize as "General Manager" | Game role |
| **GM** | Use "GM" (abbreviation) | Short form of General Manager |

## 🔄 Implementation Guidelines

### When to Apply These Standards

1. **New Documents**: Always use standard terminology
2. **Document Updates**: Apply standards when revising existing documents
3. **Code Comments**: Use standard terminology in code documentation
4. **User Interface**: Apply standards to UI text and labels

### Common Mistakes to Avoid

❌ **Incorrect Usage:**
- "use" (lowercase for engine)
- "Java" vs "java" (inconsistent capitalization)
- "Web" vs "web" (inconsistent capitalization)
- "player" vs "Player" (inconsistent entity naming)
- "GM Archetypes" (incorrect capitalization)

✅ **Correct Usage:**
- "USE" (always capitalized)
- "Java" (always capitalized)
- "web" (always lowercase)
- "Player" (always capitalized for entity)
- "GM archetypes" (correct capitalization)

## 📝 Document Update Checklist

When updating any document, verify:

- [ ] All engine references use "USE" (capitalized)
- [ ] All platform references use consistent capitalization
- [ ] All entity names (Player, Team, etc.) are capitalized
- [ ] All project-specific terms follow standards
- [ ] No mixed capitalization for same terms

## 🔍 Quality Assurance

### Automated Checks
The documentation audit script will flag:
- Inconsistent usage of key terms
- Mixed capitalization patterns
- Non-standard terminology

### Manual Review
Before committing documentation changes:
1. Review for terminology consistency
2. Check against this guide
3. Update any non-standard usage

## 📚 Related Documents

- `documentation_audit_script.py` - Automated consistency checking
- `README.md` - Project overview and standards
- `viridian_engine_design_spec.md` - Technical specifications

---

**Last Updated**: [Current Date]
**Version**: 1.0
**Maintainer**: Documentation Team
