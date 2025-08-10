# Player Data Model Specification

## Overview

This document defines the comprehensive data model for players in the Viridian Football simulation engine. The player data model is the foundation of the Unified Simulation Engine (USE) and supports all player-related functionality including attributes, development, relationships, contracts, and performance tracking.

## 1. Core Player Entity

### 1.1 Basic Information

```sql
-- Core player identification and basic info
player_id: UUID (Primary Key)
first_name: VARCHAR(50)
last_name: VARCHAR(50)
display_name: VARCHAR(100) -- Computed: "First Last"
nickname: VARCHAR(50) -- Optional
date_of_birth: DATE
age: INTEGER -- Computed from date_of_birth
height: INTEGER -- In inches
weight: INTEGER -- In pounds
college: VARCHAR(100)
draft_year: INTEGER
draft_round: INTEGER
draft_pick: INTEGER
draft_team_id: UUID (Foreign Key to teams)
years_pro: INTEGER -- Computed: current_year - draft_year
```

### 1.2 Physical Attributes

```sql
-- Physical characteristics that affect performance
speed: INTEGER (1-100) -- 40-yard dash equivalent
acceleration: INTEGER (1-100) -- Quick burst ability
agility: INTEGER (1-100) -- Change of direction
strength: INTEGER (1-100) -- Physical power
jumping: INTEGER (1-100) -- Vertical leap ability
stamina: INTEGER (1-100) -- Endurance and conditioning
injury_proneness: INTEGER (1-100) -- Higher = more injury prone
durability: INTEGER (1-100) -- Ability to withstand hits
recovery_rate: INTEGER (1-100) -- Speed of injury recovery
```

### 1.3 Technical Skills

#### Offensive Skills
```sql
-- Quarterback Skills
throwing_accuracy: INTEGER (1-100)
throwing_power: INTEGER (1-100)
throwing_on_run: INTEGER (1-100)
pocket_presence: INTEGER (1-100)
reading_defense: INTEGER (1-100)
decision_making: INTEGER (1-100)

-- Running Back Skills
ball_carrying: INTEGER (1-100)
break_tackle: INTEGER (1-100)
elusiveness: INTEGER (1-100)
pass_blocking: INTEGER (1-100)
route_running: INTEGER (1-100)

-- Wide Receiver Skills
catching: INTEGER (1-100)
route_running: INTEGER (1-100)
release: INTEGER (1-100) -- Getting off press coverage
run_blocking: INTEGER (1-100)
yards_after_catch: INTEGER (1-100)

-- Tight End Skills
catching: INTEGER (1-100)
route_running: INTEGER (1-100)
run_blocking: INTEGER (1-100)
pass_blocking: INTEGER (1-100)
inline_blocking: INTEGER (1-100)

-- Offensive Line Skills
pass_blocking: INTEGER (1-100)
run_blocking: INTEGER (1-100)
strength: INTEGER (1-100)
footwork: INTEGER (1-100)
awareness: INTEGER (1-100)
```

#### Defensive Skills
```sql
-- Defensive Line Skills
pass_rush: INTEGER (1-100)
run_stopping: INTEGER (1-100)
tackling: INTEGER (1-100)
strength: INTEGER (1-100)
shed_blocks: INTEGER (1-100)

-- Linebacker Skills
tackling: INTEGER (1-100)
coverage: INTEGER (1-100)
blitzing: INTEGER (1-100)
play_recognition: INTEGER (1-100)
pursuit: INTEGER (1-100)

-- Defensive Back Skills
man_coverage: INTEGER (1-100)
zone_coverage: INTEGER (1-100)
tackling: INTEGER (1-100)
ball_skills: INTEGER (1-100)
speed: INTEGER (1-100)
```

#### Special Teams Skills
```sql
-- Kicker Skills
field_goal_accuracy: INTEGER (1-100)
kick_power: INTEGER (1-100)
kickoff_distance: INTEGER (1-100)
clutch_kicking: INTEGER (1-100)

-- Punter Skills
punt_distance: INTEGER (1-100)
punt_accuracy: INTEGER (1-100)
hang_time: INTEGER (1-100)
direction_kicking: INTEGER (1-100)

-- Return Skills
kick_return: INTEGER (1-100)
punt_return: INTEGER (1-100)
vision: INTEGER (1-100)
elusiveness: INTEGER (1-100)
```

### 1.4 Mental Attributes

```sql
-- Cognitive and mental characteristics
intelligence: INTEGER (1-100) -- Football IQ and learning ability
work_ethic: INTEGER (1-100) -- Practice and training dedication
leadership: INTEGER (1-100) -- Team influence and morale impact
clutch: INTEGER (1-100) -- Performance under pressure
consistency: INTEGER (1-100) -- Week-to-week performance stability
adaptability: INTEGER (1-100) -- Ability to learn new schemes
focus: INTEGER (1-100) -- Concentration and mental discipline
```

### 1.5 Dynamic Attributes

```sql
-- Attributes that change during the season/career
confidence: INTEGER (1-100) -- Current mental state
morale: INTEGER (1-100) -- Team satisfaction and happiness
fatigue: INTEGER (1-100) -- Current physical exhaustion
injury_status: ENUM -- Healthy, Questionable, Doubtful, Out
injury_type: VARCHAR(100) -- Specific injury description
injury_severity: INTEGER (1-100) -- How serious the injury is
recovery_progress: INTEGER (1-100) -- Progress toward full recovery
```

## 2. Player Traits and Personality

### 2.1 Personality Traits

```sql
-- Core personality characteristics
personality_id: UUID (Primary Key)
player_id: UUID (Foreign Key)

-- Personality dimensions
extroversion: INTEGER (1-100) -- Social and outgoing nature
agreeableness: INTEGER (1-100) -- Cooperative and trusting
conscientiousness: INTEGER (1-100) -- Organized and responsible
neuroticism: INTEGER (1-100) -- Emotional stability
openness: INTEGER (1-100) -- Creative and curious

-- Football-specific personality traits
competitiveness: INTEGER (1-100) -- Drive to win
coachability: INTEGER (1-100) -- Willingness to learn
team_player: INTEGER (1-100) -- Selflessness and cooperation
professionalism: INTEGER (1-100) -- Professional conduct
media_savvy: INTEGER (1-100) -- Handling public attention
```

### 2.2 Special Traits

```sql
-- Rare, hidden traits that create unique behaviors
trait_id: UUID (Primary Key)
player_id: UUID (Foreign Key)
trait_type: ENUM -- Clutch, Choker, Gunslinger, Mentor, etc.
trait_strength: INTEGER (1-100) -- How strong the trait influence is
trait_description: TEXT -- Detailed description of the trait
is_hidden: BOOLEAN -- Whether the trait is visible to GMs
```

### 2.3 Playing Style Preferences

```sql
-- How the player prefers to play
style_id: UUID (Primary Key)
player_id: UUID (Foreign Key)

-- Offensive preferences
preferred_scheme: VARCHAR(100) -- West Coast, Air Raid, etc.
preferred_role: VARCHAR(100) -- Feature back, slot receiver, etc.
aggressive_style: INTEGER (1-100) -- Risk-taking tendency
conservative_style: INTEGER (1-100) -- Safe play preference

-- Defensive preferences
preferred_coverage: VARCHAR(100) -- Man, Zone, Hybrid
preferred_blitz_frequency: INTEGER (1-100)
aggressive_tackling: INTEGER (1-100) -- Hard hitter vs. form tackler
```

## 3. Development and Progression

### 3.1 Development Potential

```sql
-- Player's ability to improve over time
development_id: UUID (Primary Key)
player_id: UUID (Foreign Key)

-- Development ceilings for each attribute category
physical_ceiling: INTEGER (1-100) -- Maximum physical potential
technical_ceiling: INTEGER (1-100) -- Maximum skill potential
mental_ceiling: INTEGER (1-100) -- Maximum mental potential

-- Development rates
physical_development_rate: INTEGER (1-100) -- Speed of physical improvement
technical_development_rate: INTEGER (1-100) -- Speed of skill improvement
mental_development_rate: INTEGER (1-100) -- Speed of mental improvement

-- Development factors
coach_influence: INTEGER (1-100) -- How much coaching affects development
scheme_fit: INTEGER (1-100) -- How well player fits current scheme
practice_impact: INTEGER (1-100) -- How much practice helps development
```

### 3.2 Career Progression

```sql
-- Historical development tracking
progression_id: UUID (Primary Key)
player_id: UUID (Foreign Key)
season: INTEGER
week: INTEGER

-- Attribute changes over time
attribute_changes: JSONB -- Detailed tracking of all attribute changes
development_events: JSONB -- Significant development milestones
injury_history: JSONB -- Injury tracking and recovery
performance_trends: JSONB -- Statistical performance patterns
```

## 4. Relationships and Chemistry

### 4.1 Player Relationships

```sql
-- Inter-player relationships
relationship_id: UUID (Primary Key)
player_id: UUID (Foreign Key) -- First player
related_player_id: UUID (Foreign Key) -- Second player
relationship_type: ENUM -- Teammate, Rival, Mentor, etc.
relationship_strength: INTEGER (1-100) -- How strong the relationship is
relationship_quality: ENUM -- Positive, Neutral, Negative
relationship_history: JSONB -- History of relationship changes
```

### 4.2 Staff Relationships

```sql
-- Player-staff relationships
staff_relationship_id: UUID (Primary Key)
player_id: UUID (Foreign Key)
staff_id: UUID (Foreign Key)
relationship_type: ENUM -- Head Coach, Position Coach, etc.
relationship_strength: INTEGER (1-100)
relationship_quality: ENUM -- Positive, Neutral, Negative
coaching_effectiveness: INTEGER (1-100) -- How well this staff member coaches this player
```

### 4.3 Team Chemistry

```sql
-- Overall team chemistry impact
chemistry_id: UUID (Primary Key)
player_id: UUID (Foreign Key)
team_id: UUID (Foreign Key)
season: INTEGER

-- Chemistry metrics
locker_room_presence: INTEGER (1-100) -- Impact on team morale
leadership_influence: INTEGER (1-100) -- Leadership effect on teammates
chemistry_contribution: INTEGER (1-100) -- Overall chemistry contribution
disruption_potential: INTEGER (1-100) -- Potential for negative impact
```

## 5. Contract and Financial Data

### 5.1 Contract Information

```sql
-- Current contract details
contract_id: UUID (Primary Key)
player_id: UUID (Foreign Key)
team_id: UUID (Foreign Key)

-- Contract terms
contract_type: ENUM -- Rookie, Veteran, Franchise Tag, etc.
start_year: INTEGER
end_year: INTEGER
total_value: DECIMAL(12,2)
guaranteed_money: DECIMAL(12,2)
signing_bonus: DECIMAL(12,2)

-- Annual breakdown
annual_salary: JSONB -- Year-by-year salary breakdown
roster_bonuses: JSONB -- Roster bonus schedule
incentives: JSONB -- Performance incentives
void_years: JSONB -- Void year structure

-- Contract clauses
no_trade_clause: BOOLEAN
player_option: BOOLEAN
team_option: BOOLEAN
escalators: JSONB -- Performance escalators
```

### 5.2 Financial Impact

```sql
-- Salary cap impact
cap_hit: DECIMAL(12,2) -- Current year cap hit
dead_cap: DECIMAL(12,2) -- Dead cap if released
cap_savings: DECIMAL(12,2) -- Cap savings if released
restructure_potential: DECIMAL(12,2) -- Potential cap savings from restructure
```

## 6. Performance and Statistics

### 6.1 Career Statistics

```sql
-- Career performance tracking
stats_id: UUID (Primary Key)
player_id: UUID (Foreign Key)

-- Offensive stats (for offensive players)
passing_yards: INTEGER
passing_touchdowns: INTEGER
passing_interceptions: INTEGER
rushing_yards: INTEGER
rushing_touchdowns: INTEGER
receiving_yards: INTEGER
receiving_touchdowns: INTEGER
receptions: INTEGER
targets: INTEGER

-- Defensive stats (for defensive players)
tackles: INTEGER
assisted_tackles: INTEGER
sacks: INTEGER
interceptions: INTEGER
passes_defended: INTEGER
forced_fumbles: INTEGER
fumble_recoveries: INTEGER
defensive_touchdowns: INTEGER

-- Special teams stats
field_goals_made: INTEGER
field_goals_attempted: INTEGER
extra_points_made: INTEGER
extra_points_attempted: INTEGER
punts: INTEGER
punt_yards: INTEGER
kick_returns: INTEGER
kick_return_yards: INTEGER
punt_returns: INTEGER
punt_return_yards: INTEGER
```

### 6.2 Season Statistics

```sql
-- Year-by-year performance
season_stats_id: UUID (Primary Key)
player_id: UUID (Foreign Key)
season: INTEGER
team_id: UUID (Foreign Key)

-- Same stat categories as career stats, but per season
-- Plus additional season-specific metrics
games_played: INTEGER
games_started: INTEGER
snaps_played: INTEGER
snap_percentage: DECIMAL(5,2)
```

### 6.3 Advanced Metrics

```sql
-- Advanced analytics
advanced_stats_id: UUID (Primary Key)
player_id: UUID (Foreign Key)
season: INTEGER

-- Efficiency metrics
completion_percentage: DECIMAL(5,2)
yards_per_attempt: DECIMAL(5,2)
yards_per_carry: DECIMAL(5,2)
yards_per_reception: DECIMAL(5,2)
catch_percentage: DECIMAL(5,2)

-- Impact metrics
expected_points_added: DECIMAL(8,2)
success_rate: DECIMAL(5,2)
pressure_rate: DECIMAL(5,2)
coverage_grade: DECIMAL(5,2)
run_stop_rate: DECIMAL(5,2)
```

## 7. Scouting and Evaluation

### 7.1 Scouting Reports

```sql
-- Scouting information
scouting_id: UUID (Primary Key)
player_id: UUID (Foreign Key)
scout_id: UUID (Foreign Key)
report_date: DATE

-- Scouting grades
overall_grade: VARCHAR(10) -- Letter grade (A+, A, A-, etc.)
position_grade: VARCHAR(10)
potential_grade: VARCHAR(10)

-- Detailed evaluations
strengths: TEXT[]
weaknesses: TEXT[]
comparison_player: VARCHAR(100) -- "Plays like..."
projection: TEXT -- Career projection
risk_assessment: TEXT -- Injury/character risk
```

### 7.2 Combine and Pro Day Data

```sql
-- Pre-draft measurements
combine_id: UUID (Primary Key)
player_id: UUID (Foreign Key)
year: INTEGER

-- Physical measurements
height: DECIMAL(4,2) -- In feet
weight: INTEGER -- In pounds
arm_length: DECIMAL(4,2) -- In inches
hand_size: DECIMAL(4,2) -- In inches
wingspan: DECIMAL(4,2) -- In inches

-- Athletic testing
forty_yard_dash: DECIMAL(4,2) -- In seconds
bench_press: INTEGER -- Number of reps
vertical_jump: DECIMAL(4,2) -- In inches
broad_jump: DECIMAL(5,2) -- In inches
three_cone: DECIMAL(4,2) -- In seconds
shuttle: DECIMAL(4,2) -- In seconds
```

## 8. Injury and Health

### 8.1 Injury History

```sql
-- Injury tracking
injury_id: UUID (Primary Key)
player_id: UUID (Foreign Key)
season: INTEGER

-- Injury details
injury_type: VARCHAR(100)
injury_location: VARCHAR(100)
injury_severity: ENUM -- Minor, Moderate, Major, Severe
injury_date: DATE
recovery_date: DATE
games_missed: INTEGER
surgery_required: BOOLEAN
recovery_success: ENUM -- Full, Partial, Failed
```

### 8.2 Health Monitoring

```sql
-- Current health status
health_id: UUID (Primary Key)
player_id: UUID (Foreign Key)

-- Health metrics
current_health: INTEGER (1-100)
injury_risk: INTEGER (1-100)
recovery_progress: INTEGER (1-100)
conditioning_level: INTEGER (1-100)
medical_concerns: TEXT[]
```

## 9. Data Validation and Constraints

### 9.1 Attribute Validation

```sql
-- Ensure attributes are within valid ranges
CONSTRAINT valid_attribute_range CHECK (
    speed >= 1 AND speed <= 100 AND
    strength >= 1 AND strength <= 100 AND
    -- ... all other attributes
);

-- Ensure logical consistency
CONSTRAINT logical_attributes CHECK (
    (position = 'QB' AND throwing_accuracy IS NOT NULL) OR
    (position = 'RB' AND ball_carrying IS NOT NULL) OR
    -- ... position-specific requirements
);
```

### 9.2 Data Integrity

```sql
-- Ensure referential integrity
CONSTRAINT valid_team CHECK (
    team_id IN (SELECT team_id FROM teams)
);

-- Ensure temporal consistency
CONSTRAINT valid_dates CHECK (
    date_of_birth < CURRENT_DATE AND
    draft_year >= 1936 AND
    draft_year <= EXTRACT(YEAR FROM CURRENT_DATE)
);
```

## 10. Performance Optimization

### 10.1 Indexing Strategy

```sql
-- Primary indexes for common queries
CREATE INDEX idx_player_team ON players(team_id);
CREATE INDEX idx_player_position ON players(position);
CREATE INDEX idx_player_contract ON contracts(player_id, end_year);
CREATE INDEX idx_player_stats ON player_stats(player_id, season);

-- Composite indexes for complex queries
CREATE INDEX idx_player_search ON players(last_name, first_name, position);
CREATE INDEX idx_player_development ON player_development(player_id, season);
```

### 10.2 Data Partitioning

```sql
-- Partition by season for historical data
CREATE TABLE player_stats_2024 PARTITION OF player_stats
FOR VALUES FROM ('2024-01-01') TO ('2025-01-01');

-- Partition by team for large datasets
CREATE TABLE player_contracts_team1 PARTITION OF player_contracts
FOR VALUES IN ('team1-uuid');
```

## 11. API Integration

### 11.1 Data Access Patterns

```sql
-- Common query patterns for API endpoints
-- Player profile with all related data
SELECT p.*, 
       pa.*, 
       ps.*, 
       c.*, 
       r.*
FROM players p
LEFT JOIN player_attributes pa ON p.player_id = pa.player_id
LEFT JOIN player_stats ps ON p.player_id = ps.player_id
LEFT JOIN contracts c ON p.player_id = c.player_id
LEFT JOIN relationships r ON p.player_id = r.player_id
WHERE p.player_id = $1;

-- Team roster with key information
SELECT p.player_id, p.first_name, p.last_name, p.position,
       pa.overall_rating, c.cap_hit, c.contract_end_year
FROM players p
JOIN player_attributes pa ON p.player_id = pa.player_id
JOIN contracts c ON p.player_id = c.player_id
WHERE p.team_id = $1 AND c.contract_end_year >= $2
ORDER BY pa.overall_rating DESC;
```

### 11.2 Data Serialization

```json
{
  "player_id": "uuid",
  "basic_info": {
    "first_name": "John",
    "last_name": "Doe",
    "position": "QB",
    "age": 25,
    "height": 75,
    "weight": 220
  },
  "attributes": {
    "physical": {
      "speed": 85,
      "strength": 70,
      "agility": 80
    },
    "technical": {
      "throwing_accuracy": 90,
      "throwing_power": 85,
      "decision_making": 88
    },
    "mental": {
      "intelligence": 85,
      "work_ethic": 90,
      "leadership": 80
    }
  },
  "contract": {
    "total_value": 150000000,
    "annual_salary": [5000000, 15000000, 20000000],
    "cap_hit": 15000000
  },
  "stats": {
    "career": {
      "passing_yards": 15000,
      "passing_touchdowns": 100,
      "interceptions": 45
    }
  }
}
```

---

**Document Version**: 1.0  
**Last Updated**: [Current Date]  
**Next Review**: [Date + 30 days]  
**Owner**: Data Architecture Team
