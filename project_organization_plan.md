# Viridian Football Project Organization Plan

## 🎯 **PROJECT ORGANIZATION STRATEGY**

### **Current State Analysis**
The project has a solid foundation with well-structured documentation in the `docs/` directory, but the root directory contains many loose files that need proper organization.

### **Organization Goals**
1. **Clean Root Directory**: Move loose files to appropriate directories
2. **Logical Grouping**: Organize files by function and purpose
3. **Development Workflow**: Support the multi-agent development approach
4. **Maintainability**: Create clear, intuitive structure for future development

## 📁 **PROPOSED DIRECTORY STRUCTURE**

```
Viridian Football/
├── README.md                           # Main project README
├── .gitignore                          # Git ignore rules
├── pom.xml                             # Maven configuration
├── docs/                               # Documentation (existing - well organized)
├── src/                                # Source code (existing)
├── scripts/                            # Development and automation scripts
│   ├── agents/                         # Multi-agent system scripts
│   ├── setup/                          # Setup and configuration scripts
│   ├── tools/                          # Development tools
│   └── monitoring/                     # Agent monitoring scripts
├── config/                             # Configuration files
├── assets/                             # Static assets (existing)
│   ├── images/                         # Images and diagrams
│   ├── formulas/                       # Formula-related assets
│   └── documentation/                  # Documentation assets
├── prototypes/                         # Prototype implementations
│   ├── java/                           # Java prototype (existing)
│   ├── rust/                           # Rust prototype (existing)
│   └── analysis/                       # Analysis prototypes
├── tools/                              # Development tools (existing)
├── build/                              # Build outputs
├── tests/                              # Test files
├── deployment/                         # Deployment configurations
└── archive/                            # Archived files
```

## 🔄 **FILE MOVEMENT PLAN**

### **Root Directory Cleanup**

#### **Move to scripts/agents/**
- `agent_onboarding_complete.py`
- `agent-runner.py`
- `multi-agent-launcher.py`
- `ai_agent_language_analysis.py`
- `discrepancy_resolution_phase1.py`

#### **Move to scripts/setup/**
- `setup-github-complete.bat`
- `setup-github-complete.ps1`
- `setup-github-simple.ps1`
- `setup-github.bat`
- `setup-github.ps1`
- `GITHUB_SETUP_GUIDE.md`
- `GITHUB_SETUP_COMPLETE_GUIDE.md`

#### **Move to scripts/monitoring/**
- `cursor_agent_monitor.py`
- `CURSOR_AGENT_MONITORING_SOLUTION.md`
- `agent_monitoring/` (entire directory)

#### **Move to assets/images/**
- `engagement_formula.png`
- `engagement_formula_simple.png`
- `engagement_formula_flowchart.png`
- `engagement_formula_pseudocode.png`

#### **Move to assets/formulas/**
- `engagement_formula_image.py`
- `simple_formula_image.py`
- `pseudocode_formula_image.py`
- `flowchart_formula_image.py`

#### **Move to prototypes/analysis/**
- `ai_agent_language_analysis_results.json`
- `discrepancy_resolution_phase1_results.json`

#### **Move to docs/ (root level docs)**
- `documentation_audit_report.md`
- `VIRIDIAN_FOOTBALL_AGENT_ONBOARDING_PROMPT.md`

#### **Move to deployment/**
- `create_engine_docs_zip.py`

### **Keep in Root Directory**
- `README.md` (main project README)
- `.gitignore`
- `pom.xml` (Maven configuration)
- `docs/` (documentation directory)
- `src/` (source code)
- `config/` (configuration)
- `assets/` (assets directory)
- `prototypes/` (prototypes)
- `tools/` (development tools)

## 🛠️ **IMPLEMENTATION STEPS**

### **Phase 1: Create Directory Structure**
1. Create missing directories
2. Ensure proper permissions
3. Add .gitkeep files where needed

### **Phase 2: Move Files**
1. Move files to appropriate directories
2. Update any hardcoded paths
3. Verify file integrity after moves

### **Phase 3: Update References**
1. Update import statements
2. Update documentation references
3. Update build scripts

### **Phase 4: Validation**
1. Test build process
2. Verify all scripts work
3. Update README with new structure

## 📋 **VALIDATION CHECKLIST**

- [ ] All files moved to appropriate directories
- [ ] No broken references or imports
- [ ] Build process works correctly
- [ ] All scripts execute properly
- [ ] Documentation updated
- [ ] README reflects new structure
- [ ] Git history preserved
- [ ] No duplicate files created

## 🎯 **EXPECTED OUTCOMES**

1. **Cleaner Root Directory**: Only essential files remain
2. **Better Organization**: Logical grouping by function
3. **Improved Maintainability**: Clear structure for future development
4. **Enhanced Workflow**: Better support for multi-agent development
5. **Professional Appearance**: Industry-standard project structure
