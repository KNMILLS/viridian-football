# Modding System Specification

The Viridian Football modding system empowers the community to customise leagues, rosters, playbooks and scenarios.  This document describes the architecture, data formats and API endpoints required to support modding while maintaining simulation integrity.

## Goals

1. **Accessibility:** Allow users to create and share mods without recompiling the engine.
2. **Safety:** Prevent mods from corrupting saved games or introducing exploitative behaviour.
3. **Extensibility:** Enable addition of new schemes, metrics and narrative events via a plugin architecture.

## Mod Types

### 1. Roster and Draft Class Mods

*Format:* JSON or CSV with schema: `players`, `contracts`, `ratings`, `traits`, `playerLabels`.  Each entry must include a unique player ID or name, position, and attribute values.  Optional fields include personality traits and careerGoals.  Example:

```json
{
  "players": [
    {
      "id": "p12345",
      "name": "Jordan Hunts",
      "position": "QB",
      "age": 23,
      "physicalAttributes": {"speed": 0.82, "strength": 0.55},
      "cognitiveAbilities": {"processingSpeed": 0.78, "workingMemory": 0.66},
      "skills": {"throwPower": 0.84, "accuracy": 0.76},
      "personality": {"competitiveness": 0.7, "ego": 0.3},
      "traits": ["HiddenGem", "Dualthreat"],
      "careerGoals": {"championshipAspiration": 0.9, "financialPriority": 0.2, "playingTimePriority": 0.5}
    }
  ]
}
```

### 2. League and Schedule Mods

*Format:* JSON describing `teams`, `divisions`, `conferences`, `scheduleRules` and optionally `stadiums`.  This allows creation of custom leagues with different structures and calendars.  The schedule generator reads these files to produce seasons.

### 3. Playbook Mods

*Format:* YAML or JSON describing schemes, formations, play concepts and progression rules.  Each play entry includes required personnel labels, cognitive load and progressions.  Mods must reference existing player labels or define new ones consistent with the label database.

### 4. Scenario Scripts

*Format:* YAML/JSON using the scenario scripting format from the engine spec.  Scenarios define starting conditions, objectives, and a series of events/triggers.

## API Endpoints

The engine exposes RESTful endpoints to import and export mod files.  All endpoints require authentication when modifying persistent data.

| Endpoint | Method | Description |
| --- | --- | --- |
| `/mods/upload` | POST | Upload a mod file (multipart/form‑data).  The server validates the schema and returns errors if invalid. |
| `/mods/list` | GET | List installed mods with metadata (name, type, version). |
| `/mods/enable/{modId}` | POST | Enable a mod for the next new league.  Mods cannot be enabled for an existing save. |
| `/mods/disable/{modId}` | POST | Disable a mod. |
| `/mods/export/{modType}` | GET | Export current data of the specified type (rosters, schedules, playbooks) as a mod file for editing. |

## Security and Compatibility

- **Schema validation:** The engine validates incoming JSON/YAML against JSON Schema definitions.  Invalid or unknown fields are rejected.  Mods that violate schema constraints (e.g., missing required fields, out‑of‑range values) produce errors with clear messages.
- **Versioning:** Each mod file includes a `version` field.  The engine uses semantic versioning to manage compatibility.  When the simulation schema evolves, mod importers can warn users about required migrations.
- **Sandboxing:** Mods cannot execute arbitrary code.  They only provide data that the simulation parses.  A future plugin API may allow scripting (Lua/Python), but will run in a restricted environment to prevent security issues.

## Community Guidelines

Encourage modders to adhere to the fictional universe (e.g. avoid trademarked team names) and to share their work on official forums or a Steam Workshop integration.  Provide documentation and examples to make modding accessible to novices.  A curated list of recommended mods can help new players get started.
