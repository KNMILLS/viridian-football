# Viridian Football Database Schema
====================================

## 📋 Document Information
- **Document Type**: Database Schema Specification
- **Component**: Data Storage and Management
- **Version**: 1.0
- **Last Updated**: [Current Date]
- **Status**: Draft

## 🎯 Purpose
This document defines the complete database schema for the Viridian Football simulation game, including all tables, relationships, indexes, and data constraints.

## 🏗️ Database Overview

### Technology Stack
- **Primary Database**: PostgreSQL 15+
- **Cache Layer**: Redis 7+
- **Search Engine**: Elasticsearch 8+
- **File Storage**: AWS S3 / MinIO

### Database Architecture
- **Main Database**: Game data, user accounts, simulation state
- **Analytics Database**: Performance metrics, historical data
- **Cache Database**: Session data, frequently accessed information
- **Search Database**: Full-text search for players, teams, etc.

## 📊 Core Tables

### Users and Authentication

#### users
```sql
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    username VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(20) NOT NULL DEFAULT 'GM',
    team_id UUID REFERENCES teams(id),
    preferences JSONB DEFAULT '{}',
    is_active BOOLEAN DEFAULT true,
    email_verified BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    last_login TIMESTAMP WITH TIME ZONE
);

CREATE INDEX idx_users_username ON users(username);
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_team_id ON users(team_id);
```

#### user_sessions
```sql
CREATE TABLE user_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    token_hash VARCHAR(255) NOT NULL,
    refresh_token_hash VARCHAR(255) NOT NULL,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    last_used TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_user_sessions_user_id ON user_sessions(user_id);
CREATE INDEX idx_user_sessions_token_hash ON user_sessions(token_hash);
CREATE INDEX idx_user_sessions_expires_at ON user_sessions(expires_at);
```

### League and Teams

#### leagues
```sql
CREATE TABLE leagues (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) NOT NULL,
    abbreviation VARCHAR(10) NOT NULL,
    season INTEGER NOT NULL,
    current_week INTEGER NOT NULL DEFAULT 1,
    phase VARCHAR(50) NOT NULL DEFAULT 'Pre-Season',
    settings JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_leagues_season ON leagues(season);
CREATE INDEX idx_leagues_current_week ON leagues(current_week);
```

#### teams
```sql
CREATE TABLE teams (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    league_id UUID NOT NULL REFERENCES leagues(id),
    name VARCHAR(100) NOT NULL,
    abbreviation VARCHAR(10) NOT NULL,
    city VARCHAR(100) NOT NULL,
    conference VARCHAR(10) NOT NULL,
    division VARCHAR(20) NOT NULL,
    stadium VARCHAR(100),
    owner_id UUID REFERENCES users(id),
    gm_id UUID REFERENCES users(id),
    playbook JSONB DEFAULT '{}',
    chemistry JSONB DEFAULT '{}',
    performance JSONB DEFAULT '{}',
    finances JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_teams_league_id ON teams(league_id);
CREATE INDEX idx_teams_conference ON teams(conference);
CREATE INDEX idx_teams_division ON teams(division);
CREATE INDEX idx_teams_owner_id ON teams(owner_id);
CREATE INDEX idx_teams_gm_id ON teams(gm_id);
```

### Players

#### players
```sql
CREATE TABLE players (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    league_id UUID NOT NULL REFERENCES leagues(id),
    team_id UUID REFERENCES teams(id),
    name VARCHAR(100) NOT NULL,
    position VARCHAR(10) NOT NULL,
    age INTEGER NOT NULL,
    experience INTEGER NOT NULL DEFAULT 0,
    height VARCHAR(10),
    weight INTEGER,
    college VARCHAR(100),
    draft_year INTEGER,
    draft_round INTEGER,
    draft_pick INTEGER,
    attributes JSONB NOT NULL DEFAULT '{}',
    personality JSONB NOT NULL DEFAULT '{}',
    performance JSONB NOT NULL DEFAULT '{}',
    injury_history JSONB DEFAULT '[]',
    awards JSONB DEFAULT '[]',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_players_league_id ON players(league_id);
CREATE INDEX idx_players_team_id ON players(team_id);
CREATE INDEX idx_players_position ON players(position);
CREATE INDEX idx_players_name ON players(name);
CREATE INDEX idx_players_draft_year ON players(draft_year);
```

#### player_contracts
```sql
CREATE TABLE player_contracts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    player_id UUID NOT NULL REFERENCES players(id) ON DELETE CASCADE,
    team_id UUID NOT NULL REFERENCES teams(id),
    years INTEGER NOT NULL,
    total_value DECIMAL(15,2) NOT NULL,
    guaranteed DECIMAL(15,2) NOT NULL,
    signing_bonus DECIMAL(15,2) DEFAULT 0,
    cap_hit DECIMAL(15,2) NOT NULL,
    dead_cap DECIMAL(15,2) DEFAULT 0,
    start_year INTEGER NOT NULL,
    end_year INTEGER NOT NULL,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_player_contracts_player_id ON player_contracts(player_id);
CREATE INDEX idx_player_contracts_team_id ON player_contracts(team_id);
CREATE INDEX idx_player_contracts_is_active ON player_contracts(is_active);
```

#### player_relationships
```sql
CREATE TABLE player_relationships (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    player_id UUID NOT NULL REFERENCES players(id) ON DELETE CASCADE,
    related_player_id UUID NOT NULL REFERENCES players(id) ON DELETE CASCADE,
    relationship_type VARCHAR(50) NOT NULL,
    strength INTEGER NOT NULL DEFAULT 50,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(player_id, related_player_id)
);

CREATE INDEX idx_player_relationships_player_id ON player_relationships(player_id);
CREATE INDEX idx_player_relationships_related_player_id ON player_relationships(related_player_id);
CREATE INDEX idx_player_relationships_type ON player_relationships(relationship_type);
```

### Games and Schedule

#### games
```sql
CREATE TABLE games (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    league_id UUID NOT NULL REFERENCES leagues(id),
    season INTEGER NOT NULL,
    week INTEGER NOT NULL,
    home_team_id UUID NOT NULL REFERENCES teams(id),
    away_team_id UUID NOT NULL REFERENCES teams(id),
    stadium VARCHAR(100),
    scheduled_time TIMESTAMP WITH TIME ZONE,
    game_type VARCHAR(20) NOT NULL DEFAULT 'Regular Season',
    status VARCHAR(20) NOT NULL DEFAULT 'Scheduled',
    result JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_games_league_id ON games(league_id);
CREATE INDEX idx_games_season_week ON games(season, week);
CREATE INDEX idx_games_home_team_id ON games(home_team_id);
CREATE INDEX idx_games_away_team_id ON games(away_team_id);
CREATE INDEX idx_games_status ON games(status);
```

#### game_stats
```sql
CREATE TABLE game_stats (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    game_id UUID NOT NULL REFERENCES games(id) ON DELETE CASCADE,
    player_id UUID NOT NULL REFERENCES players(id),
    team_id UUID NOT NULL REFERENCES teams(id),
    stats JSONB NOT NULL DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_game_stats_game_id ON game_stats(game_id);
CREATE INDEX idx_game_stats_player_id ON game_stats(player_id);
CREATE INDEX idx_game_stats_team_id ON game_stats(team_id);
```

### Transactions

#### transactions
```sql
CREATE TABLE transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    league_id UUID NOT NULL REFERENCES leagues(id),
    transaction_type VARCHAR(50) NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'Pending',
    initiator_team_id UUID REFERENCES teams(id),
    target_team_id UUID REFERENCES teams(id),
    details JSONB NOT NULL DEFAULT '{}',
    approved_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_transactions_league_id ON transactions(league_id);
CREATE INDEX idx_transactions_type ON transactions(transaction_type);
CREATE INDEX idx_transactions_status ON transactions(status);
CREATE INDEX idx_transactions_initiator_team_id ON transactions(initiator_team_id);
CREATE INDEX idx_transactions_target_team_id ON transactions(target_team_id);
```

#### trades
```sql
CREATE TABLE trades (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    transaction_id UUID NOT NULL REFERENCES transactions(id) ON DELETE CASCADE,
    offered_players UUID[] DEFAULT '{}',
    requested_players UUID[] DEFAULT '{}',
    offered_picks JSONB DEFAULT '[]',
    requested_picks JSONB DEFAULT '[]',
    message TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_trades_transaction_id ON trades(transaction_id);
```

### Simulation State

#### simulation_state
```sql
CREATE TABLE simulation_state (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    league_id UUID NOT NULL REFERENCES leagues(id),
    current_season INTEGER NOT NULL,
    current_week INTEGER NOT NULL,
    current_phase VARCHAR(50) NOT NULL,
    current_date DATE NOT NULL,
    is_paused BOOLEAN DEFAULT false,
    simulation_speed VARCHAR(20) DEFAULT 'normal',
    last_update TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_simulation_state_league_id ON simulation_state(league_id);
CREATE UNIQUE INDEX idx_simulation_state_league_unique ON simulation_state(league_id);
```

#### simulation_events
```sql
CREATE TABLE simulation_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    league_id UUID NOT NULL REFERENCES leagues(id),
    event_type VARCHAR(50) NOT NULL,
    event_data JSONB NOT NULL DEFAULT '{}',
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    processed BOOLEAN DEFAULT false
);

CREATE INDEX idx_simulation_events_league_id ON simulation_events(league_id);
CREATE INDEX idx_simulation_events_type ON simulation_events(event_type);
CREATE INDEX idx_simulation_events_timestamp ON simulation_events(timestamp);
CREATE INDEX idx_simulation_events_processed ON simulation_events(processed);
```

### Analytics and Performance

#### team_performance
```sql
CREATE TABLE team_performance (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    team_id UUID NOT NULL REFERENCES teams(id),
    season INTEGER NOT NULL,
    week INTEGER,
    performance_data JSONB NOT NULL DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_team_performance_team_id ON team_performance(team_id);
CREATE INDEX idx_team_performance_season_week ON team_performance(season, week);
```

#### player_performance
```sql
CREATE TABLE player_performance (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    player_id UUID NOT NULL REFERENCES players(id),
    season INTEGER NOT NULL,
    week INTEGER,
    performance_data JSONB NOT NULL DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_player_performance_player_id ON player_performance(player_id);
CREATE INDEX idx_player_performance_season_week ON player_performance(season, week);
```

### Configuration and Settings

#### league_settings
```sql
CREATE TABLE league_settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    league_id UUID NOT NULL REFERENCES leagues(id),
    setting_key VARCHAR(100) NOT NULL,
    setting_value JSONB NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(league_id, setting_key)
);

CREATE INDEX idx_league_settings_league_id ON league_settings(league_id);
CREATE INDEX idx_league_settings_key ON league_settings(setting_key);
```

#### system_config
```sql
CREATE TABLE system_config (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    config_key VARCHAR(100) UNIQUE NOT NULL,
    config_value JSONB NOT NULL,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_system_config_key ON system_config(config_key);
```

## 🔗 Relationships and Constraints

### Foreign Key Constraints
```sql
-- Users can only be assigned to one team
ALTER TABLE users ADD CONSTRAINT fk_users_team 
    FOREIGN KEY (team_id) REFERENCES teams(id);

-- Players must belong to a league
ALTER TABLE players ADD CONSTRAINT fk_players_league 
    FOREIGN KEY (league_id) REFERENCES leagues(id);

-- Teams must belong to a league
ALTER TABLE teams ADD CONSTRAINT fk_teams_league 
    FOREIGN KEY (league_id) REFERENCES leagues(id);

-- Games must have different home and away teams
ALTER TABLE games ADD CONSTRAINT chk_games_different_teams 
    CHECK (home_team_id != away_team_id);
```

### Check Constraints
```sql
-- Player age must be reasonable
ALTER TABLE players ADD CONSTRAINT chk_player_age 
    CHECK (age >= 18 AND age <= 50);

-- Experience must be non-negative
ALTER TABLE players ADD CONSTRAINT chk_player_experience 
    CHECK (experience >= 0);

-- Contract values must be positive
ALTER TABLE player_contracts ADD CONSTRAINT chk_contract_values 
    CHECK (total_value > 0 AND guaranteed >= 0);

-- Week must be valid
ALTER TABLE games ADD CONSTRAINT chk_game_week 
    CHECK (week >= 1 AND week <= 21);
```

## 📈 Indexes for Performance

### Composite Indexes
```sql
-- Fast lookups for team rosters
CREATE INDEX idx_players_team_position ON players(team_id, position);

-- Fast lookups for league standings
CREATE INDEX idx_teams_league_conference_division ON teams(league_id, conference, division);

-- Fast lookups for game schedules
CREATE INDEX idx_games_season_week_teams ON games(season, week, home_team_id, away_team_id);

-- Fast lookups for player performance
CREATE INDEX idx_player_performance_player_season ON player_performance(player_id, season);
```

### Partial Indexes
```sql
-- Only active contracts
CREATE INDEX idx_player_contracts_active ON player_contracts(player_id, team_id) 
    WHERE is_active = true;

-- Only free agents
CREATE INDEX idx_players_free_agents ON players(id, position, attributes) 
    WHERE team_id IS NULL;

-- Only current season
CREATE INDEX idx_games_current_season ON games(id, week, home_team_id, away_team_id) 
    WHERE season = EXTRACT(YEAR FROM NOW());
```

## 🔄 Data Migration and Versioning

### Schema Versioning
```sql
CREATE TABLE schema_migrations (
    id SERIAL PRIMARY KEY,
    version VARCHAR(50) UNIQUE NOT NULL,
    applied_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    description TEXT
);
```

### Data Backup Strategy
- **Full Backup**: Daily at 2 AM
- **Incremental Backup**: Every 4 hours
- **Transaction Log**: Continuous
- **Retention**: 30 days for full backups, 7 days for incremental

## 🔒 Security and Access Control

### Row Level Security (RLS)
```sql
-- Users can only see their own data
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
CREATE POLICY users_own_data ON users 
    FOR ALL USING (id = current_user_id());

-- GMs can only see their team's data
ALTER TABLE players ENABLE ROW LEVEL SECURITY;
CREATE POLICY players_team_access ON players 
    FOR SELECT USING (team_id IN (
        SELECT team_id FROM users WHERE id = current_user_id()
    ));
```

### Data Encryption
- **At Rest**: AES-256 encryption for sensitive data
- **In Transit**: TLS 1.3 for all connections
- **Backup**: Encrypted backups with separate key management

## 📊 Analytics Database Schema

### Time-Series Data
```sql
-- Player ratings over time
CREATE TABLE player_rating_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    player_id UUID NOT NULL,
    rating INTEGER NOT NULL,
    potential INTEGER NOT NULL,
    recorded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Team performance trends
CREATE TABLE team_performance_trends (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    team_id UUID NOT NULL,
    metric_name VARCHAR(50) NOT NULL,
    metric_value DECIMAL(10,2) NOT NULL,
    recorded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

## 🔍 Search Database Schema

### Elasticsearch Mappings
```json
{
  "mappings": {
    "properties": {
      "player_id": { "type": "keyword" },
      "name": { "type": "text" },
      "position": { "type": "keyword" },
      "team": { "type": "keyword" },
      "rating": { "type": "integer" },
      "attributes": { "type": "object" },
      "search_text": { "type": "text" }
    }
  }
}
```

## 📚 Related Documents

- `engine_specification.md` - Engine technical specifications
- `api_specification.md` - API endpoints and data structures
- `performance_requirements.md` - Performance guidelines

## 🔄 Version History

| Version | Date | Changes |
|---------|------|---------|
| 1.0 | [Current Date] | Initial database schema |

---

**Next Review Date**: [Date + 30 days]
**Approved By**: [Technical Lead]
**Distribution**: Development Team, Database Administrators, DevOps Team
