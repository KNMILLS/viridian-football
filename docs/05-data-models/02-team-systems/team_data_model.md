# Team Data Model Specification

## Overview

This document defines the comprehensive data model for teams in the Viridian Football simulation engine. The team data model supports all team-related functionality including roster management, organizational structure, financial data, performance tracking, and team culture.

## 1. Core Team Entity

### 1.1 Basic Information

```sql
-- Core team identification and basic info
team_id: UUID (Primary Key)
team_name: VARCHAR(100) -- "New York Knights"
team_abbreviation: VARCHAR(3) -- "NYK"
city: VARCHAR(50) -- "New York"
state: VARCHAR(2) -- "NY"
conference: ENUM -- AFC, NFC
division: ENUM -- North, South, East, West
founded_year: INTEGER
stadium_name: VARCHAR(100)
stadium_capacity: INTEGER
stadium_location: VARCHAR(200)
team_colors: JSONB -- Primary and secondary colors
team_logo_url: VARCHAR(500)
```

### 1.2 Organizational Structure

```sql
-- Team ownership and management
owner_id: UUID (Foreign Key to owners)
general_manager_id: UUID (Foreign Key to staff) -- Player-controlled
head_coach_id: UUID (Foreign Key to staff)
assistant_coaches: JSONB -- Array of assistant coach IDs
scouting_department: JSONB -- Array of scout IDs
training_staff: JSONB -- Array of trainer IDs
front_office_staff: JSONB -- Array of front office staff IDs
```

### 1.3 Team Identity and Culture

```sql
-- Team philosophy and culture
team_philosophy: ENUM -- Analytics-Driven, Traditional, Balanced
offensive_philosophy: ENUM -- Run-First, Pass-Heavy, Balanced
defensive_philosophy: ENUM -- Aggressive, Conservative, Adaptive
team_culture: ENUM -- Disciplined, Player-Friendly, Competitive
locker_room_atmosphere: INTEGER (1-100) -- Team morale and chemistry
fan_base_loyalty: INTEGER (1-100) -- Fan support and engagement
media_pressure: INTEGER (1-100) -- Local media scrutiny level
```

## 2. Roster Management

### 2.1 Active Roster

```sql
-- Current roster structure
roster_id: UUID (Primary Key)
team_id: UUID (Foreign Key)
season: INTEGER
week: INTEGER

-- Roster counts by position
quarterbacks: INTEGER
running_backs: INTEGER
wide_receivers: INTEGER
tight_ends: INTEGER
offensive_linemen: INTEGER
defensive_linemen: INTEGER
linebackers: INTEGER
defensive_backs: INTEGER
kickers: INTEGER
punters: INTEGER
long_snappers: INTEGER

-- Roster status
total_players: INTEGER -- Computed sum
active_players: INTEGER -- 53-man roster
practice_squad: INTEGER -- 16-man practice squad
injured_reserve: INTEGER
reserve_players: INTEGER -- Various reserve lists
```

### 2.2 Depth Chart

```sql
-- Position depth chart
depth_chart_id: UUID (Primary Key)
team_id: UUID (Foreign Key)
position: VARCHAR(10) -- QB, RB, WR, etc.
depth_level: INTEGER -- 1 = starter, 2 = backup, etc.
player_id: UUID (Foreign Key to players)
is_starter: BOOLEAN
is_active: BOOLEAN -- On active roster
snap_percentage: DECIMAL(5,2) -- Expected playing time
```

### 2.3 Roster Transactions

```sql
-- Transaction history
transaction_id: UUID (Primary Key)
team_id: UUID (Foreign Key)
player_id: UUID (Foreign Key)
transaction_type: ENUM -- Sign, Release, Trade, Waive, etc.
transaction_date: DATE
effective_date: DATE
transaction_details: JSONB -- Additional transaction info
compensation: DECIMAL(12,2) -- If applicable
draft_picks: JSONB -- If draft picks involved
```

## 3. Financial Management

### 3.1 Salary Cap Information

```sql
-- Salary cap management
cap_id: UUID (Primary Key)
team_id: UUID (Foreign Key)
season: INTEGER

-- Cap figures
salary_cap: DECIMAL(12,2) -- League salary cap
team_cap_space: DECIMAL(12,2) -- Available cap space
total_cap_allocated: DECIMAL(12,2) -- Total cap hits
dead_cap: DECIMAL(12,2) -- Dead cap from released players
rollover_cap: DECIMAL(12,2) -- Cap space rolled over from previous year
adjustments: DECIMAL(12,2) -- Various cap adjustments
```

### 3.2 Contract Management

```sql
-- Team contract overview
contract_summary_id: UUID (Primary Key)
team_id: UUID (Foreign Key)
season: INTEGER

-- Contract breakdown
total_contract_value: DECIMAL(12,2)
guaranteed_money: DECIMAL(12,2)
signing_bonuses: DECIMAL(12,2)
roster_bonuses: DECIMAL(12,2)
performance_bonuses: DECIMAL(12,2)

-- Contract distribution
top_10_contracts: JSONB -- Array of highest-paid players
rookie_contracts: JSONB -- Array of rookie deals
veteran_contracts: JSONB -- Array of veteran deals
expiring_contracts: JSONB -- Contracts expiring this year
```

### 3.3 Budget Allocation

```sql
-- Team budget breakdown
budget_id: UUID (Primary Key)
team_id: UUID (Foreign Key)
season: INTEGER

-- Budget categories
player_salaries: DECIMAL(12,2)
coaching_staff: DECIMAL(12,2)
scouting_department: DECIMAL(12,2)
training_facilities: DECIMAL(12,2)
stadium_operations: DECIMAL(12,2)
marketing: DECIMAL(12,2)
administration: DECIMAL(12,2)
reserve_funds: DECIMAL(12,2)
```

## 4. Performance and Statistics

### 4.1 Team Performance

```sql
-- Team performance metrics
performance_id: UUID (Primary Key)
team_id: UUID (Foreign Key)
season: INTEGER
week: INTEGER

-- Season record
wins: INTEGER
losses: INTEGER
ties: INTEGER
win_percentage: DECIMAL(5,3) -- Computed
conference_record: VARCHAR(10) -- "5-3"
division_record: VARCHAR(10) -- "3-1"

-- Playoff information
playoff_appearances: INTEGER
playoff_wins: INTEGER
playoff_losses: INTEGER
super_bowl_appearances: INTEGER
super_bowl_wins: INTEGER
```

### 4.2 Offensive Statistics

```sql
-- Team offensive performance
offensive_stats_id: UUID (Primary Key)
team_id: UUID (Foreign Key)
season: INTEGER

-- Passing stats
passing_yards: INTEGER
passing_touchdowns: INTEGER
passing_interceptions: INTEGER
completion_percentage: DECIMAL(5,2)
yards_per_attempt: DECIMAL(5,2)
passer_rating: DECIMAL(5,2)

-- Rushing stats
rushing_yards: INTEGER
rushing_touchdowns: INTEGER
rushing_attempts: INTEGER
yards_per_carry: DECIMAL(5,2)

-- Overall offensive stats
total_yards: INTEGER
total_touchdowns: INTEGER
points_per_game: DECIMAL(5,2)
third_down_percentage: DECIMAL(5,2)
red_zone_percentage: DECIMAL(5,2)
time_of_possession: DECIMAL(5,2) -- Average per game
```

### 4.3 Defensive Statistics

```sql
-- Team defensive performance
defensive_stats_id: UUID (Primary Key)
team_id: UUID (Foreign Key)
season: INTEGER

-- Defensive stats
points_allowed: INTEGER
points_per_game_allowed: DECIMAL(5,2)
total_yards_allowed: INTEGER
passing_yards_allowed: INTEGER
rushing_yards_allowed: INTEGER
sacks: INTEGER
interceptions: INTEGER
forced_fumbles: INTEGER
fumble_recoveries: INTEGER
defensive_touchdowns: INTEGER

-- Advanced defensive metrics
third_down_percentage_allowed: DECIMAL(5,2)
red_zone_percentage_allowed: DECIMAL(5,2)
takeaways: INTEGER -- Interceptions + fumble recoveries
turnover_differential: INTEGER -- Takeaways - giveaways
```

### 4.4 Special Teams Statistics

```sql
-- Special teams performance
special_teams_id: UUID (Primary Key)
team_id: UUID (Foreign Key)
season: INTEGER

-- Kicking stats
field_goals_made: INTEGER
field_goals_attempted: INTEGER
field_goal_percentage: DECIMAL(5,2)
extra_points_made: INTEGER
extra_points_attempted: INTEGER
extra_point_percentage: DECIMAL(5,2)

-- Punting stats
punts: INTEGER
punt_yards: INTEGER
average_punt_distance: DECIMAL(5,2)
punts_inside_20: INTEGER
touchbacks: INTEGER

-- Return stats
kick_return_yards: INTEGER
punt_return_yards: INTEGER
return_touchdowns: INTEGER
```

## 5. Coaching and Scheme

### 5.1 Coaching Staff

```sql
-- Coaching staff structure
coaching_staff_id: UUID (Primary Key)
team_id: UUID (Foreign Key)
season: INTEGER

-- Head coach
head_coach: JSONB -- Coach details and attributes

-- Coordinators
offensive_coordinator: JSONB
defensive_coordinator: JSONB
special_teams_coordinator: JSONB

-- Position coaches
position_coaches: JSONB -- Array of position coach details
assistant_coaches: JSONB -- Array of assistant coach details
```

### 5.2 Scheme and Playbook

```sql
-- Team scheme information
scheme_id: UUID (Primary Key)
team_id: UUID (Foreign Key)
season: INTEGER

-- Offensive scheme
offensive_scheme: VARCHAR(100) -- "West Coast", "Air Raid", etc.
offensive_formation: VARCHAR(100) -- Primary formation
run_pass_ratio: DECIMAL(5,2) -- Run percentage
tempo: ENUM -- Fast, Normal, Slow
red_zone_philosophy: ENUM -- Aggressive, Conservative, Balanced

-- Defensive scheme
defensive_scheme: VARCHAR(100) -- "3-4", "4-3", "Hybrid", etc.
coverage_philosophy: ENUM -- Man-heavy, Zone-heavy, Mixed
blitz_frequency: INTEGER (1-100) -- How often to blitz
pressure_style: ENUM -- Aggressive, Conservative, Situational

-- Special teams scheme
special_teams_philosophy: ENUM -- Aggressive, Conservative, Balanced
fake_punt_frequency: INTEGER (1-100)
onside_kick_frequency: INTEGER (1-100)
```

### 5.3 Game Planning

```sql
-- Weekly game planning
game_plan_id: UUID (Primary Key)
team_id: UUID (Foreign Key)
opponent_id: UUID (Foreign Key)
season: INTEGER
week: INTEGER

-- Offensive game plan
offensive_focus: ENUM -- Run-heavy, Pass-heavy, Balanced
key_players: JSONB -- Players to feature
matchup_advantages: JSONB -- Exploitable matchups
adjustments: JSONB -- In-game adjustments

-- Defensive game plan
defensive_focus: ENUM -- Stop-run, Stop-pass, Balanced
key_players: JSONB -- Players to contain
coverage_adjustments: JSONB -- Coverage schemes
pressure_packages: JSONB -- Blitz packages
```

## 6. Facilities and Resources

### 6.1 Training Facilities

```sql
-- Team facilities
facilities_id: UUID (Primary Key)
team_id: UUID (Foreign Key)

-- Facility quality ratings
training_facility_quality: INTEGER (1-100)
weight_room_quality: INTEGER (1-100)
recovery_facility_quality: INTEGER (1-100)
practice_field_quality: INTEGER (1-100)
medical_facility_quality: INTEGER (1-100)

-- Facility impact
player_development_bonus: DECIMAL(5,2) -- Percentage bonus to development
injury_recovery_bonus: DECIMAL(5,2) -- Faster injury recovery
recruitment_bonus: DECIMAL(5,2) -- Free agent attraction bonus
```

### 6.2 Scouting and Analytics

```sql
-- Scouting department
scouting_id: UUID (Primary Key)
team_id: UUID (Foreign Key)

-- Scouting resources
scouting_budget: DECIMAL(12,2)
scout_count: INTEGER
scouting_technology: ENUM -- Basic, Advanced, Cutting-edge
analytics_department: ENUM -- None, Basic, Advanced

-- Scouting effectiveness
draft_accuracy: DECIMAL(5,2) -- Historical draft success rate
free_agent_evaluation: DECIMAL(5,2) -- FA signing success rate
opponent_scouting: DECIMAL(5,2) -- Game planning effectiveness
```

## 7. Team Culture and Chemistry

### 7.1 Locker Room Dynamics

```sql
-- Team chemistry and culture
culture_id: UUID (Primary Key)
team_id: UUID (Foreign Key)
season: INTEGER

-- Culture metrics
team_morale: INTEGER (1-100)
locker_room_cohesion: INTEGER (1-100)
leadership_quality: INTEGER (1-100)
discipline_level: INTEGER (1-100)
work_ethic: INTEGER (1-100)

-- Chemistry factors
veteran_leadership: INTEGER (1-100)
young_player_development: INTEGER (1-100)
position_group_cohesion: JSONB -- Chemistry by position group
team_relationships: JSONB -- Overall relationship matrix
```

### 7.2 Media and Public Relations

```sql
-- Media relations
media_id: UUID (Primary Key)
team_id: UUID (Foreign Key)

-- Media factors
media_pressure: INTEGER (1-100) -- Local media scrutiny
fan_expectations: INTEGER (1-100) -- Fan pressure level
public_image: INTEGER (1-100) -- Team reputation
sponsorship_value: DECIMAL(12,2) -- Sponsorship revenue
merchandise_sales: DECIMAL(12,2) -- Merchandise revenue
```

## 8. Historical Data

### 8.1 Team History

```sql
-- Historical team information
history_id: UUID (Primary Key)
team_id: UUID (Foreign Key)

-- Franchise history
franchise_wins: INTEGER
franchise_losses: INTEGER
franchise_win_percentage: DECIMAL(5,3)
playoff_appearances: INTEGER
conference_championships: INTEGER
super_bowl_appearances: INTEGER
super_bowl_wins: INTEGER

-- Notable achievements
hall_of_famers: INTEGER
retired_numbers: JSONB -- Array of retired jersey numbers
franchise_records: JSONB -- Team records and milestones
```

### 8.2 Season History

```sql
-- Year-by-year performance
season_history_id: UUID (Primary Key)
team_id: UUID (Foreign Key)
season: INTEGER

-- Season performance
regular_season_record: VARCHAR(10)
playoff_record: VARCHAR(10)
final_standing: INTEGER -- Final position in league
conference_standing: INTEGER
division_standing: INTEGER

-- Season highlights
key_achievements: JSONB -- Notable accomplishments
key_players: JSONB -- Standout performers
season_summary: TEXT -- Narrative summary
```

## 9. Data Validation and Constraints

### 9.1 Team Data Validation

```sql
-- Ensure team data integrity
CONSTRAINT valid_roster_size CHECK (
    total_players >= 53 AND total_players <= 90
);

CONSTRAINT valid_cap_space CHECK (
    team_cap_space >= 0
);

CONSTRAINT valid_record CHECK (
    wins >= 0 AND losses >= 0 AND ties >= 0 AND
    wins + losses + ties <= 17 -- Regular season max
);
```

### 9.2 Referential Integrity

```sql
-- Ensure all references are valid
CONSTRAINT valid_owner CHECK (
    owner_id IN (SELECT owner_id FROM owners)
);

CONSTRAINT valid_conference_division CHECK (
    (conference = 'AFC' AND division IN ('North', 'South', 'East', 'West')) OR
    (conference = 'NFC' AND division IN ('North', 'South', 'East', 'West'))
);
```

## 10. Performance Optimization

### 10.1 Indexing Strategy

```sql
-- Primary indexes for common queries
CREATE INDEX idx_team_conference ON teams(conference, division);
CREATE INDEX idx_team_roster ON team_rosters(team_id, season);
CREATE INDEX idx_team_performance ON team_performance(team_id, season);
CREATE INDEX idx_team_contracts ON team_contracts(team_id, season);

-- Composite indexes for complex queries
CREATE INDEX idx_team_standings ON team_performance(conference, division, wins, losses);
CREATE INDEX idx_team_cap ON team_cap(team_id, season, team_cap_space);
```

### 10.2 Data Partitioning

```sql
-- Partition by season for historical data
CREATE TABLE team_performance_2024 PARTITION OF team_performance
FOR VALUES FROM ('2024-01-01') TO ('2025-01-01');

-- Partition by conference for large datasets
CREATE TABLE team_rosters_afc PARTITION OF team_rosters
FOR VALUES IN ('AFC');
```

## 11. API Integration

### 11.1 Data Access Patterns

```sql
-- Common query patterns for API endpoints
-- Team overview with key information
SELECT t.*, 
       tp.*, 
       tc.*, 
       tr.*
FROM teams t
LEFT JOIN team_performance tp ON t.team_id = tp.team_id
LEFT JOIN team_cap tc ON t.team_id = tc.team_id
LEFT JOIN team_rosters tr ON t.team_id = tr.team_id
WHERE t.team_id = $1 AND tp.season = $2;

-- League standings
SELECT t.team_name, t.conference, t.division,
       tp.wins, tp.losses, tp.ties,
       tp.points_for, tp.points_against
FROM teams t
JOIN team_performance tp ON t.team_id = tp.team_id
WHERE tp.season = $1
ORDER BY tp.wins DESC, tp.points_for DESC;
```

### 11.2 Data Serialization

```json
{
  "team_id": "uuid",
  "basic_info": {
    "team_name": "New York Knights",
    "abbreviation": "NYK",
    "city": "New York",
    "conference": "AFC",
    "division": "East"
  },
  "roster": {
    "total_players": 53,
    "active_players": 53,
    "practice_squad": 16,
    "injured_reserve": 3
  },
  "performance": {
    "season": 2024,
    "record": "12-5",
    "conference_rank": 2,
    "division_rank": 1,
    "points_for": 425,
    "points_against": 320
  },
  "financial": {
    "salary_cap": 255400000,
    "cap_space": 15000000,
    "total_allocated": 240400000
  }
}
```

---

**Document Version**: 1.0  
**Last Updated**: [Current Date]  
**Next Review**: [Date + 30 days]  
**Owner**: Data Architecture Team
