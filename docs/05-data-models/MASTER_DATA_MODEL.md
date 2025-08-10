# Master Data Model - Viridian Football
==========================================

## 📋 Document Information
- **Document Type**: Master Data Model Specification
- **Component**: Unified Data Architecture
- **Version**: 1.0
- **Status**: AUTHORITATIVE - Supersedes all other data models
- **Date**: December 2024

## 🎯 Purpose

This document defines the **authoritative, unified data model** for the Viridian Football project. It consolidates and resolves conflicts between all existing data models to create a single source of truth for the entire system.

## 🔄 Data Model Hierarchy

```
Master Data Model (THIS DOCUMENT)
    ├── Core Entities
    │   ├── Player Data Model
    │   ├── Team Data Model  
    │   ├── League Data Model
    │   └── Game Data Model
    ├── Simulation Models
    │   ├── USE Engine Models
    │   ├── Physics Models
    │   └── AI Decision Models
    ├── Persistence Layer
    │   ├── Database Schema
    │   └── Cache Strategy
    └── Integration Models
        ├── API Data Transfer Objects
        └── Import/Export Formats
```

## 🏗️ Core Architecture Principles

### 1. Single Source of Truth
- All data models derive from this master specification
- No conflicts between subsystem models
- Clear ownership and authority for each data entity

### 2. Layered Architecture
```
Application Layer     ← Java business logic
    ↕
Data Transfer Layer   ← DTOs and API models  
    ↕
Domain Layer         ← Core entity models (THIS DOCUMENT)
    ↕
Persistence Layer    ← Database schema and caching
```

### 3. Technology Integration
- **Java Entities**: Primary implementation using JPA annotations
- **Database**: PostgreSQL with optimized schema
- **Caching**: Redis for frequently accessed data
- **JSON/REST**: API serialization formats

## 🎭 Core Entity Models

### 1. Player Entity (AUTHORITATIVE)

This supersedes `docs/05-data-models/01-player-systems/player_data_model.md`

```java
@Entity
@Table(name = "players")
public class Player {
    // === IDENTITY ===
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID playerId;
    
    private String firstName;
    private String lastName;
    private String nickname;
    private LocalDate dateOfBirth;
    private String college;
    
    // === PHYSICAL ATTRIBUTES ===
    private Integer height;           // inches
    private Integer weight;           // pounds
    private Integer speed;            // 1-100 scale
    private Integer strength;         // 1-100 scale
    private Integer agility;          // 1-100 scale
    private Integer acceleration;     // 1-100 scale
    private Integer jumping;          // 1-100 scale
    private Integer stamina;          // 1-100 scale
    
    // === FOOTBALL SKILLS ===
    // Position-specific skills stored as JSON
    @Column(columnDefinition = "jsonb")
    private Map<String, Integer> skills;
    
    // === CONTRACT & STATUS ===
    @ManyToOne
    @JoinColumn(name = "current_team_id")
    private Team currentTeam;
    
    @OneToMany(mappedBy = "player", cascade = CascadeType.ALL)
    private List<Contract> contracts;
    
    private PlayerStatus status;      // ACTIVE, INJURED, RETIRED, etc.
    private Position primaryPosition;
    private List<Position> secondaryPositions;
    
    // === CAREER TRACKING ===
    private Integer draftYear;
    private Integer draftRound;
    private Integer draftPick;
    private UUID draftTeamId;
    
    // === DEVELOPMENT ===
    private Integer potential;        // 1-100 (hidden from user)
    private Integer development;      // Current development progress
    private LocalDate lastDevelopmentUpdate;
    
    // === INJURY & HEALTH ===
    @OneToMany(mappedBy = "player", cascade = CascadeType.ALL)
    private List<Injury> injuries;
    
    private Integer injuryProneness;  // 1-100
    private Integer durability;       // 1-100
    private Integer recoveryRate;     // 1-100
    
    // === PERSONALITY & RELATIONSHIPS ===
    @Embedded
    private PersonalityProfile personality;
    
    @OneToMany(mappedBy = "player", cascade = CascadeType.ALL)
    private List<PlayerRelationship> relationships;
    
    // === PERFORMANCE TRACKING ===
    @OneToMany(mappedBy = "player", cascade = CascadeType.ALL)
    private List<GamePerformance> gamePerformances;
    
    @OneToMany(mappedBy = "player", cascade = CascadeType.ALL)
    private List<SeasonStats> seasonStats;
    
    // === TIMESTAMPS ===
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
```

### 2. Team Entity (AUTHORITATIVE)

This supersedes `docs/05-data-models/02-team-systems/team_data_model.md`

```java
@Entity
@Table(name = "teams")
public class Team {
    // === IDENTITY ===
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID teamId;
    
    private String teamName;
    private String abbreviation;      // 3-4 letter code
    private String city;
    private String state;
    private String conference;        // AFC/NFC
    private String division;          // North/South/East/West
    
    // === ROSTER MANAGEMENT ===
    @OneToMany(mappedBy = "currentTeam")
    private List<Player> activeRoster;
    
    @OneToMany(mappedBy = "team")
    private List<Contract> contracts;
    
    private Integer rosterLimit;      // Usually 53 for NFL
    private Integer practiceSquadLimit; // Usually 16
    
    // === FINANCIAL ===
    @Embedded
    private SalaryCap salaryCap;
    
    @OneToMany(mappedBy = "team")
    private List<FinancialTransaction> transactions;
    
    private BigDecimal revenue;
    private BigDecimal expenses;
    private BigDecimal netWorth;
    
    // === FACILITIES & INFRASTRUCTURE ===
    @Embedded
    private Stadium stadium;
    
    @Embedded
    private TrainingFacilities facilities;
    
    // === COACHING STAFF ===
    @OneToMany(mappedBy = "team")
    private List<Coach> coaches;
    
    @ManyToOne
    @JoinColumn(name = "head_coach_id")
    private Coach headCoach;
    
    // === TEAM STRATEGY ===
    @Embedded
    private OffensiveScheme offensiveScheme;
    
    @Embedded
    private DefensiveScheme defensiveScheme;
    
    private Integer aggressiveness;   // 1-100
    private Integer discipline;       // 1-100
    private Integer morale;          // 1-100
    
    // === PERFORMANCE TRACKING ===
    @OneToMany(mappedBy = "team")
    private List<TeamSeasonStats> seasonStats;
    
    @OneToMany(mappedBy = "homeTeam")
    private List<Game> homeGames;
    
    @OneToMany(mappedBy = "awayTeam")
    private List<Game> awayGames;
    
    // === DRAFT & SCOUTING ===
    @OneToMany(mappedBy = "team")
    private List<DraftPick> draftPicks;
    
    @OneToMany(mappedBy = "team")
    private List<ScoutingReport> scoutingReports;
    
    // === TIMESTAMPS ===
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
```

### 3. Game Entity (AUTHORITATIVE)

```java
@Entity
@Table(name = "games")
public class Game {
    // === IDENTITY ===
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID gameId;
    
    @ManyToOne
    @JoinColumn(name = "home_team_id")
    private Team homeTeam;
    
    @ManyToOne
    @JoinColumn(name = "away_team_id")
    private Team awayTeam;
    
    // === SCHEDULING ===
    private LocalDateTime scheduledTime;
    private Integer season;
    private Integer week;
    private GameType gameType;        // PRESEASON, REGULAR, PLAYOFF, SUPERBOWL
    
    // === GAME RESULT ===
    private Integer homeScore;
    private Integer awayScore;
    private GameStatus status;        // SCHEDULED, IN_PROGRESS, COMPLETED, POSTPONED
    
    // === GAME CONDITIONS ===
    @Embedded
    private WeatherConditions weather;
    
    @Embedded
    private VenueConditions venue;
    
    // === SIMULATION DATA ===
    @OneToMany(mappedBy = "game", cascade = CascadeType.ALL)
    private List<GameEvent> events;
    
    @OneToMany(mappedBy = "game", cascade = CascadeType.ALL)
    private List<PlayerGameStats> playerStats;
    
    @Embedded
    private GameSimulationData simulationData;
    
    // === TIMESTAMPS ===
    private LocalDateTime startTime;
    private LocalDateTime endTime;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
```

### 4. Contract Entity (AUTHORITATIVE)

```java
@Entity
@Table(name = "contracts")
public class Contract {
    // === IDENTITY ===
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID contractId;
    
    @ManyToOne
    @JoinColumn(name = "player_id")
    private Player player;
    
    @ManyToOne
    @JoinColumn(name = "team_id")
    private Team team;
    
    // === CONTRACT TERMS ===
    private LocalDate startDate;
    private LocalDate endDate;
    private Integer lengthYears;
    private BigDecimal totalValue;
    private BigDecimal guaranteedMoney;
    private BigDecimal signingBonus;
    
    // === SALARY DETAILS ===
    @OneToMany(mappedBy = "contract", cascade = CascadeType.ALL)
    private List<ContractYear> yearDetails;
    
    // === CONTRACT TYPE & STATUS ===
    private ContractType contractType; // ROOKIE, VETERAN, FRANCHISE_TAG, etc.
    private ContractStatus status;     // ACTIVE, EXPIRED, TERMINATED, etc.
    
    // === INCENTIVES & BONUSES ===
    @OneToMany(mappedBy = "contract", cascade = CascadeType.ALL)
    private List<ContractIncentive> incentives;
    
    // === SALARY CAP IMPACT ===
    private BigDecimal currentCapHit;
    private BigDecimal deadMoney;
    
    // === TIMESTAMPS ===
    private LocalDateTime signedDate;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
```

## 🔧 USE Engine Integration Models

### Physics State Model
```java
@Embeddable
public class PhysicsState {
    private Vector3D position;
    private Vector3D velocity;
    private Vector3D acceleration;
    private Double mass;
    private Double friction;
    private Boolean isGrounded;
    private Double fatigue;          // 0.0 to 1.0
    private BodyPosition bodyPosition;
}
```

### AI Decision Model
```java
@Entity
@Table(name = "ai_decisions")
public class AIDecision {
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID decisionId;
    
    private UUID entityId;           // Player, Coach, or GM
    private DecisionType type;       // PLAY_CALL, PERSONNEL, STRATEGY, etc.
    private String context;          // JSON of decision context
    private String decision;         // JSON of decision made
    private Double confidence;       // 0.0 to 1.0
    private LocalDateTime timestamp;
    
    // Decision outcome tracking
    private String outcome;          // JSON of actual result
    private Double effectivenessScore; // How good was this decision?
}
```

## 📊 Database Schema Mapping

### Primary Tables (PostgreSQL)
```sql
-- Core entities
CREATE TABLE players (/* See Player entity above */);
CREATE TABLE teams (/* See Team entity above */);
CREATE TABLE games (/* See Game entity above */);
CREATE TABLE contracts (/* See Contract entity above */);

-- Supporting tables
CREATE TABLE coaches (coach_id UUID PRIMARY KEY, ...);
CREATE TABLE injuries (injury_id UUID PRIMARY KEY, ...);
CREATE TABLE game_events (event_id UUID PRIMARY KEY, ...);
CREATE TABLE player_relationships (relationship_id UUID PRIMARY KEY, ...);

-- Performance tracking
CREATE TABLE player_game_stats (stat_id UUID PRIMARY KEY, ...);
CREATE TABLE season_stats (stat_id UUID PRIMARY KEY, ...);
CREATE TABLE team_season_stats (stat_id UUID PRIMARY KEY, ...);

-- Simulation data
CREATE TABLE ai_decisions (decision_id UUID PRIMARY KEY, ...);
CREATE TABLE physics_snapshots (snapshot_id UUID PRIMARY KEY, ...);
```

### Caching Strategy (Redis)
```
# Frequently accessed data
players:{team_id}        → List of active players
team:{team_id}:roster    → Current roster with basic stats
game:{game_id}:live      → Live game state during simulation
league:standings         → Current season standings
user:{user_id}:team      → User's managed team data
```

## 🔄 Data Migration & Integration

### From Existing Models
1. **Player Data Model** → Fully integrated into Master Player Entity
2. **Team Data Model** → Fully integrated into Master Team Entity  
3. **Database Schema** → Enhanced and standardized
4. **USE Engine Models** → Integrated as embedded components

### Import/Export Formats
```json
// Standard player export format
{
  "playerId": "uuid",
  "basicInfo": {
    "firstName": "string",
    "lastName": "string",
    "dateOfBirth": "date"
  },
  "attributes": {
    "physical": {"speed": 85, "strength": 78, ...},
    "skills": {"throwing_accuracy": 92, ...}
  },
  "contract": {
    "teamId": "uuid",
    "totalValue": 50000000,
    "lengthYears": 4
  }
}
```

## 🎯 Implementation Priority

### Phase 1: Core Entities (Week 1)
1. Implement Player, Team, Game, Contract entities in Java
2. Create JPA repository interfaces
3. Set up basic database schema
4. Implement unit tests

### Phase 2: Supporting Systems (Week 2)
1. Add Coach, Injury, Performance tracking entities
2. Implement relationship mappings
3. Create data migration scripts
4. Add Redis caching layer

### Phase 3: USE Integration (Week 3)
1. Add PhysicsState and AIDecision models
2. Implement simulation data persistence
3. Create performance optimization indices
4. Add monitoring and metrics

### Phase 4: API & Services (Week 4)
1. Create REST API endpoints
2. Implement data transfer objects (DTOs)
3. Add import/export functionality
4. Create admin interfaces

## ✅ Validation & Testing

### Data Integrity Tests
- Foreign key constraints
- Business rule validation
- Performance benchmarks
- Migration testing

### Integration Tests
- Java JPA entity mapping
- Database schema validation
- Cache synchronization
- API data serialization

---

**This Master Data Model serves as the single, authoritative specification for all data structures in the Viridian Football project. All other data models must align with this specification.**