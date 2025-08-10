#!/usr/bin/env python3
"""
Script to create a comprehensive zip file containing all Viridian Football engine documentation
for research on holistic enhancements to the tackle mechanics and simulation engine.
"""

import os
import zipfile
import shutil
from datetime import datetime

def create_engine_docs_zip():
    """Create a zip file containing all relevant engine documentation."""
    
    # Define the source directories and files to include
    engine_docs = {
        # Core Engine Design Documents
        "01-core-design/viridian_engine_design_spec.md": "Core engine design specification with tackle mechanics",
        "01-core-design/viridian_master_plan.md": "Master plan for the entire engine architecture",
        "01-core-design/viridian_vision_market_architecture.md": "Vision and system architecture overview",
        
        # Technical Specifications
        "03-technical-specs/engine_specification.md": "Detailed engine technical specifications",
        "03-technical-specs/USE Implementation.md": "Unified Simulation Engine implementation details",
        "03-technical-specs/Wrap game around USE.md": "How the game integrates with the USE",
        "03-technical-specs/api_specification.md": "API specification for engine integration",
        "03-technical-specs/database_schema.md": "Database schema for engine data storage",
        "03-technical-specs/performance_optimization_strategy.md": "Performance optimization guidelines",
        "03-technical-specs/testing_and_QA_framework.md": "Testing framework for engine validation",
        "03-technical-specs/data_validation_and_calibration_framework.md": "Data validation and calibration",
        "03-technical-specs/modding_system_spec.md": "Modding system for engine customization",
        
        # Data Content and Modeling
        "05-data-content/integration_and_modelling_plan.md": "Integration and modeling plan for engine components",
        "05-data-content/playbook_modelling_and_relationship_calibration.md": "Playbook modeling and relationship calibration",
        "05-data-content/integrated_scheme_playbook_spec.md": "Integrated scheme and playbook specifications",
        "05-data-content/player_label_database.md": "Player label database for trait modeling",
        "05-data-content/Designing Player Relationships and Their Impact.md": "Player relationship modeling and impact",
        "05-data-content/nfl_contract_rules_and_gm_archetypes.md": "NFL contract rules and GM archetypes",
        
        # Research Documents
        "04-research/Comparing Simulation Engines of Football Management Games.md": "Comparative analysis of football simulation engines",
        "04-research/A Strategic Framework for In-Game AI General Managers.md": "AI framework for engine decision-making",
        "04-research/comprehensive_football_schemes_research.md": "Comprehensive football schemes research",
        "04-research/The Archetypes of Professional Sports General Managers.md": "GM archetypes research",
        "04-research/Building a Unique Web-Based NFL General Manager Simulator.md": "Web-based simulator architecture",
        
        # Development Guidelines
        "06-development/non_coding_tasks.md": "Non-coding development tasks and guidelines",
        
        # Root Documentation
        "README.md": "Project overview and documentation guide",
        "terminology_guide.md": "Terminology guide for consistent language",
        "document_organization_report.md": "Document organization structure"
    }
    
    # Create zip file
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    zip_filename = f"viridian_football_engine_docs_{timestamp}.zip"
    
    with zipfile.ZipFile(zip_filename, 'w', zipfile.ZIP_DEFLATED) as zipf:
        # Add each file to the zip
        for file_path, description in engine_docs.items():
            full_path = os.path.join("docs", file_path)
            if os.path.exists(full_path):
                # Create a more organized structure in the zip
                zip_path = f"engine_documentation/{file_path}"
                zipf.write(full_path, zip_path)
                print(f"✓ Added: {file_path}")
            else:
                print(f"✗ Missing: {file_path}")
        
        # Create a comprehensive README for the zip
        readme_content = create_zip_readme(engine_docs)
        zipf.writestr("engine_documentation/README.md", readme_content)
        
        # Create an index of tackle-related content
        tackle_index = create_tackle_research_index()
        zipf.writestr("engine_documentation/TACKLE_RESEARCH_INDEX.md", tackle_index)
    
    print(f"\n✅ Engine documentation zip created: {zip_filename}")
    print(f"📦 Total files included: {len([f for f in engine_docs.keys() if os.path.exists(os.path.join('docs', f))])}")
    
    return zip_filename

def create_zip_readme(engine_docs):
    """Create a comprehensive README for the zip file."""
    
    readme = """# Viridian Football Engine Documentation

## Overview
This zip contains comprehensive documentation for the Viridian Football Unified Simulation Engine (USE), 
specifically focused on research for enhancing tackle mechanics and overall simulation realism.

## Document Categories

### 🏗️ Core Engine Design
- **viridian_engine_design_spec.md**: Complete engine design specification including tackle mechanics
- **viridian_master_plan.md**: Master architectural plan for the entire engine
- **viridian_vision_market_architecture.md**: Vision and system architecture overview

### ⚙️ Technical Specifications
- **engine_specification.md**: Detailed technical specifications for the engine
- **USE Implementation.md**: Implementation details for the Unified Simulation Engine
- **Wrap game around USE.md**: Game integration with the simulation engine
- **api_specification.md**: API specification for engine integration
- **database_schema.md**: Database schema for engine data storage
- **performance_optimization_strategy.md**: Performance optimization guidelines
- **testing_and_QA_framework.md**: Testing framework for engine validation
- **data_validation_and_calibration_framework.md**: Data validation and calibration
- **modding_system_spec.md**: Modding system for engine customization

### 📊 Data Content and Modeling
- **integration_and_modelling_plan.md**: Integration and modeling plan for engine components
- **playbook_modelling_and_relationship_calibration.md**: Playbook modeling and relationship calibration
- **integrated_scheme_playbook_spec.md**: Integrated scheme and playbook specifications
- **player_label_database.md**: Player label database for trait modeling
- **Designing Player Relationships and Their Impact.md**: Player relationship modeling and impact
- **nfl_contract_rules_and_gm_archetypes.md**: NFL contract rules and GM archetypes

### 🔬 Research Documents
- **Comparing Simulation Engines of Football Management Games.md**: Comparative analysis of football simulation engines
- **A Strategic Framework for In-Game AI General Managers.md**: AI framework for engine decision-making
- **comprehensive_football_schemes_research.md**: Comprehensive football schemes research
- **The Archetypes of Professional Sports General Managers.md**: GM archetypes research
- **Building a Unique Web-Based NFL General Manager Simulator.md**: Web-based simulator architecture

### 🛠️ Development Guidelines
- **non_coding_tasks.md**: Non-coding development tasks and guidelines

## Key Research Areas for Tackle Enhancement

### 1. Biomechanical Factors
- Leverage and body positioning
- Center of gravity differences
- Joint angles and body mechanics
- Impact force distribution

### 2. Advanced Physical Dynamics
- Inertia and momentum transfer
- Elastic vs. inelastic collisions
- Angular momentum
- Ground reaction forces
- Body segment coordination

### 3. Situational Nuances
- Field position effects
- Down and distance context
- Score differential impact
- Time remaining effects
- Injury risk tolerance

### 4. Advanced Player States
- Injury history effects
- Conditioning level
- Hydration and nutrition
- Sleep and recovery
- Mental fatigue

### 5. Equipment and Technology
- Helmet and pad technology
- Cleat type and condition
- Jersey material
- Field technology differences

## Usage Instructions

1. **Start with**: `viridian_engine_design_spec.md` for core tackle mechanics
2. **Review**: `USE Implementation.md` for implementation details
3. **Analyze**: `Comparing Simulation Engines of Football Management Games.md` for comparative insights
4. **Plan**: Use `integration_and_modelling_plan.md` for enhancement strategy

## Current Engine Capabilities

The current engine captures approximately 85-90% of variables that significantly impact real tackle outcomes, including:
- Momentum and angle calculations
- Physical attributes and skills
- Mental and emotional factors
- Environmental conditions
- Team chemistry and relationships

## Enhancement Opportunities

Focus areas for improvement:
- Advanced biomechanical modeling
- Situational context awareness
- Equipment and technology factors
- Cumulative fatigue effects
- Injury risk modeling

---
*Generated on: {timestamp}*
*For research on holistic tackle mechanics enhancements*
""".format(timestamp=datetime.now().strftime("%Y-%m-%d %H:%M:%S"))
    
    return readme

def create_tackle_research_index():
    """Create an index specifically for tackle-related research content."""
    
    index = """# Tackle Mechanics Research Index

## Primary Tackle-Related Content

### Core Tackle Mechanics (viridian_engine_design_spec.md)
- **Section 2.3**: Physical Interaction and Tackling Mechanics
- **Key Variables**: Angles, momentum, attributes, skills, environmental modifiers
- **Current Formula**: Multi-layered probability calculation

### Implementation Details (USE Implementation.md)
- **On-Field Simulation**: Per-player biomechanics and physics
- **Collision Modeling**: Simplified physics for collisions
- **Performance Tracking**: Detailed stats and analytics

### Comparative Analysis (Comparing Simulation Engines of Football Management Games.md)
- **Progression Football**: Weighted random probability models
- **Front Office Football**: Statistical modeling approaches
- **Other Engines**: Various simulation methodologies

## Enhancement Research Areas

### 1. Biomechanical Enhancements
**Current State**: Basic momentum and angle calculations
**Enhancement Opportunities**:
- Leverage and body positioning algorithms
- Center of gravity calculations
- Joint angle biomechanics
- Impact force distribution modeling

### 2. Advanced Physics
**Current State**: Simplified collision physics
**Enhancement Opportunities**:
- Elastic vs. inelastic collision modeling
- Angular momentum calculations
- Ground reaction force simulation
- Body segment coordination

### 3. Situational Context
**Current State**: Basic environmental and pressure factors
**Enhancement Opportunities**:
- Field position-specific modifiers
- Down and distance context
- Score differential effects
- Time pressure modeling

### 4. Player State Modeling
**Current State**: Basic fatigue and morale
**Enhancement Opportunities**:
- Cumulative fatigue effects
- Injury history impact
- Conditioning level modeling
- Mental fatigue progression

### 5. Equipment and Technology
**Current State**: Basic surface condition effects
**Enhancement Opportunities**:
- Equipment technology factors
- Field surface technology
- Weather equipment interactions
- Modern gear advantages

## Research Methodology

### 1. Literature Review
- NFL biomechanics research
- Sports science publications
- Football analytics studies
- Equipment technology papers

### 2. Data Analysis
- NFL tackle success rates
- Player performance metrics
- Environmental impact studies
- Injury correlation data

### 3. Comparative Analysis
- Other simulation engines
- Real-world football data
- Sports science models
- Gaming industry standards

### 4. Implementation Planning
- Technical feasibility assessment
- Performance impact analysis
- Integration requirements
- Testing and validation strategy

## Key Questions for Research

1. **Biomechanical Accuracy**: How can we model leverage and body positioning more accurately?
2. **Physics Realism**: What level of collision physics complexity is optimal?
3. **Situational Awareness**: How do different game situations affect tackle success?
4. **Player State Modeling**: How do cumulative factors affect performance over time?
5. **Equipment Impact**: What role does modern equipment play in tackle outcomes?

## Next Steps

1. **Review Current Implementation**: Deep dive into existing tackle mechanics
2. **Identify Gaps**: Compare current model with real-world factors
3. **Prioritize Enhancements**: Rank improvements by impact and feasibility
4. **Design Solutions**: Create detailed enhancement specifications
5. **Validate Approach**: Test proposed changes against real data

---
*Research index for tackle mechanics enhancement*
"""
    
    return index

if __name__ == "__main__":
    create_engine_docs_zip()
