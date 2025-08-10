# Viridian Football API Specification
====================================

## 📋 Document Information
- **Document Type**: API Specification
- **Component**: REST API for Viridian Football
- **Version**: 1.0
- **Last Updated**: [Current Date]
- **Status**: Draft

## 🎯 Purpose
This document defines the REST API specification for the Viridian Football simulation game, providing comprehensive endpoints for game management, player data, team operations, and simulation control.

## 🏗️ API Overview

### Base URL
```
Production: https://api.viridianfootball.com/v1
Development: https://dev-api.viridianfootball.com/v1
Local: http://localhost:8080/v1
```

### Authentication
- **Type**: Bearer Token (JWT)
- **Header**: `Authorization: Bearer <token>`
- **Token Expiry**: 24 hours
- **Refresh**: Available via `/auth/refresh`

### Response Format
All responses follow this structure:
```json
{
  "success": true,
  "data": {},
  "message": "Operation completed successfully",
  "timestamp": "2025-01-27T10:30:00Z",
  "version": "1.0"
}
```

### Error Format
```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid input parameters",
    "details": []
  },
  "timestamp": "2025-01-27T10:30:00Z",
  "version": "1.0"
}
```

## 🔐 Authentication Endpoints

### POST /auth/login
Authenticate user and receive access token.

**Request:**
```json
{
  "username": "string",
  "password": "string"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "access_token": "jwt_token_here",
    "refresh_token": "refresh_token_here",
    "expires_in": 86400,
    "user": {
      "id": "user_123",
      "username": "string",
      "email": "string",
      "role": "GM"
    }
  }
}
```

### POST /auth/refresh
Refresh access token using refresh token.

**Request:**
```json
{
  "refresh_token": "string"
}
```

### POST /auth/logout
Invalidate current session.

## 👥 User Management

### GET /users/profile
Get current user profile.

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "user_123",
    "username": "string",
    "email": "string",
    "role": "GM",
    "team_id": "team_456",
    "created_at": "2025-01-27T10:30:00Z",
    "last_login": "2025-01-27T10:30:00Z"
  }
}
```

### PUT /users/profile
Update user profile.

**Request:**
```json
{
  "email": "string",
  "preferences": {
    "theme": "dark",
    "notifications": true
  }
}
```

## 🏈 Team Management

### GET /teams
Get all teams in the league.

**Query Parameters:**
- `page` (int): Page number (default: 1)
- `limit` (int): Items per page (default: 20)
- `conference` (string): Filter by conference
- `division` (string): Filter by division

**Response:**
```json
{
  "success": true,
  "data": {
    "teams": [
      {
        "id": "team_123",
        "name": "New York Giants",
        "abbreviation": "NYG",
        "conference": "NFC",
        "division": "East",
        "city": "New York",
        "stadium": "MetLife Stadium",
        "owner_id": "owner_123",
        "gm_id": "gm_123",
        "roster_count": 53,
        "salary_cap": 224800000,
        "cap_space": 15000000
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 32,
      "pages": 2
    }
  }
}
```

### GET /teams/{team_id}
Get specific team details.

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "team_123",
    "name": "New York Giants",
    "abbreviation": "NYG",
    "conference": "NFC",
    "division": "East",
    "city": "New York",
    "stadium": "MetLife Stadium",
    "owner_id": "owner_123",
    "gm_id": "gm_123",
    "roster": {
      "players": [],
      "count": 53
    },
    "depth_chart": {},
    "playbook": {},
    "chemistry": {
      "overall": 75,
      "offense": 78,
      "defense": 72
    },
    "performance": {
      "wins": 8,
      "losses": 9,
      "points_for": 350,
      "points_against": 365
    },
    "finances": {
      "salary_cap": 224800000,
      "cap_space": 15000000,
      "dead_cap": 5000000
    }
  }
}
```

### PUT /teams/{team_id}/playbook
Update team playbook.

**Request:**
```json
{
  "offensive_scheme": "West Coast",
  "defensive_scheme": "4-3",
  "formations": {
    "offense": ["Shotgun", "I-Formation", "Pistol"],
    "defense": ["4-3 Base", "Nickel", "Dime"]
  },
  "personnel_groups": {
    "11": "1 RB, 1 TE, 3 WR",
    "12": "1 RB, 2 TE, 2 WR",
    "21": "2 RB, 1 TE, 2 WR"
  }
}
```

## 👤 Player Management

### GET /players
Get all players with filtering and pagination.

**Query Parameters:**
- `page` (int): Page number
- `limit` (int): Items per page
- `position` (string): Filter by position
- `team_id` (string): Filter by team
- `free_agent` (boolean): Show only free agents
- `search` (string): Search by name

**Response:**
```json
{
  "success": true,
  "data": {
    "players": [
      {
        "id": "player_123",
        "name": "Daniel Jones",
        "position": "QB",
        "team_id": "team_123",
        "age": 26,
        "experience": 4,
        "attributes": {
          "physical": {
            "strength": 75,
            "speed": 82,
            "agility": 78,
            "acceleration": 80
          },
          "mental": {
            "awareness": 85,
            "processing": 82,
            "leadership": 78
          },
          "skills": {
            "throwing_power": 80,
            "throwing_accuracy": 78,
            "pocket_presence": 75
          }
        },
        "personality": {
          "archetype": "Game Manager",
          "traits": ["Film Geek", "Perceptive"]
        },
        "contract": {
          "years": 4,
          "total_value": 160000000,
          "guaranteed": 92000000,
          "cap_hit": 40000000
        },
        "performance": {
          "rating": 78,
          "potential": 82
        }
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 1500,
      "pages": 75
    }
  }
}
```

### GET /players/{player_id}
Get specific player details.

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "player_123",
    "name": "Daniel Jones",
    "position": "QB",
    "team_id": "team_123",
    "age": 26,
    "experience": 4,
    "height": "6-5",
    "weight": 230,
    "college": "Duke",
    "draft_year": 2019,
    "draft_round": 1,
    "draft_pick": 6,
    "attributes": {
      "physical": {},
      "mental": {},
      "skills": {}
    },
    "personality": {
      "archetype": "Game Manager",
      "traits": ["Film Geek", "Perceptive"],
      "relationships": []
    },
    "contract": {
      "years": 4,
      "total_value": 160000000,
      "guaranteed": 92000000,
      "cap_hit": 40000000,
      "dead_cap": 5000000
    },
    "performance": {
      "rating": 78,
      "potential": 82,
      "history": []
    },
    "injury_history": [],
    "awards": []
  }
}
```

### POST /players/{player_id}/trade
Initiate player trade.

**Request:**
```json
{
  "target_team_id": "team_456",
  "offered_players": ["player_123"],
  "requested_players": ["player_789"],
  "offered_picks": ["2025_1st", "2025_3rd"],
  "requested_picks": ["2025_2nd"],
  "message": "Trade proposal message"
}
```

## 🏆 League Management

### GET /league
Get league information and standings.

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "league_123",
    "name": "NFL",
    "season": 2025,
    "week": 12,
    "phase": "Regular Season",
    "conferences": {
      "AFC": {
        "divisions": {
          "East": [],
          "North": [],
          "South": [],
          "West": []
        }
      },
      "NFC": {
        "divisions": {
          "East": [],
          "North": [],
          "South": [],
          "West": []
        }
      }
    },
    "standings": {
      "AFC": [],
      "NFC": []
    },
    "playoff_picture": {
      "AFC": [],
      "NFC": []
    }
  }
}
```

### GET /league/schedule
Get league schedule.

**Query Parameters:**
- `week` (int): Specific week
- `team_id` (string): Filter by team
- `season` (int): Season year

**Response:**
```json
{
  "success": true,
  "data": {
    "season": 2025,
    "weeks": [
      {
        "week": 1,
        "games": [
          {
            "id": "game_123",
            "home_team": "team_123",
            "away_team": "team_456",
            "date": "2025-09-07T20:00:00Z",
            "stadium": "MetLife Stadium",
            "result": {
              "home_score": 24,
              "away_score": 21,
              "winner": "team_123"
            }
          }
        ]
      }
    ]
  }
}
```

## 🎮 Simulation Control

### POST /simulation/advance
Advance simulation by specified amount.

**Request:**
```json
{
  "type": "week", // "day", "week", "season"
  "options": {
    "simulate_games": true,
    "process_transactions": true,
    "update_standings": true
  }
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "previous_week": 11,
    "current_week": 12,
    "phase": "Regular Season",
    "events": [
      {
        "type": "game_result",
        "description": "New York Giants defeated Dallas Cowboys 24-21",
        "timestamp": "2025-01-27T10:30:00Z"
      }
    ]
  }
}
```

### GET /simulation/state
Get current simulation state.

**Response:**
```json
{
  "success": true,
  "data": {
    "season": 2025,
    "week": 12,
    "phase": "Regular Season",
    "date": "2025-01-27",
    "paused": false,
    "speed": "normal", // "slow", "normal", "fast"
    "last_update": "2025-01-27T10:30:00Z"
  }
}
```

### POST /simulation/pause
Pause simulation.

### POST /simulation/resume
Resume simulation.

### POST /simulation/speed
Set simulation speed.

**Request:**
```json
{
  "speed": "fast" // "slow", "normal", "fast"
}
```

## 📊 Analytics and Reports

### GET /analytics/team/{team_id}
Get team analytics and performance metrics.

**Query Parameters:**
- `season` (int): Season year
- `weeks` (string): Week range (e.g., "1-17")

**Response:**
```json
{
  "success": true,
  "data": {
    "team_id": "team_123",
    "season": 2025,
    "offense": {
      "points_per_game": 22.5,
      "yards_per_game": 345.2,
      "passing_yards": 245.8,
      "rushing_yards": 99.4,
      "turnovers": 15
    },
    "defense": {
      "points_allowed": 21.8,
      "yards_allowed": 332.1,
      "sacks": 35,
      "interceptions": 12
    },
    "special_teams": {
      "field_goal_percentage": 85.7,
      "punting_average": 45.2
    }
  }
}
```

### GET /analytics/player/{player_id}
Get player analytics and performance history.

**Response:**
```json
{
  "success": true,
  "data": {
    "player_id": "player_123",
    "career_stats": {
      "passing": {
        "attempts": 1250,
        "completions": 780,
        "yards": 8500,
        "touchdowns": 45,
        "interceptions": 25
      }
    },
    "season_stats": {
      "2025": {
        "passing": {}
      }
    },
    "trends": {
      "rating_progression": [],
      "performance_consistency": 0.75
    }
  }
}
```

## 🔄 WebSocket Events

### Connection
```
ws://api.viridianfootball.com/v1/ws
```

### Authentication
```json
{
  "type": "auth",
  "token": "jwt_token_here"
}
```

### Event Types

#### simulation.tick
Simulation update event.
```json
{
  "type": "simulation.tick",
  "data": {
    "timestamp": "2025-01-27T10:30:00Z",
    "week": 12,
    "phase": "Regular Season"
  }
}
```

#### game.update
Game state update.
```json
{
  "type": "game.update",
  "data": {
    "game_id": "game_123",
    "quarter": 2,
    "time": "12:34",
    "home_score": 14,
    "away_score": 7,
    "possession": "team_123",
    "down": 2,
    "distance": 7,
    "field_position": "NYG 45"
  }
}
```

#### player.update
Player data change.
```json
{
  "type": "player.update",
  "data": {
    "player_id": "player_123",
    "changes": {
      "rating": {
        "old": 78,
        "new": 79
      }
    }
  }
}
```

#### team.update
Team data change.
```json
{
  "type": "team.update",
  "data": {
    "team_id": "team_123",
    "changes": {
      "roster_count": {
        "old": 52,
        "new": 53
      }
    }
  }
}
```

## 🔒 Security and Rate Limiting

### Rate Limits
- **Authentication**: 5 requests per minute
- **General API**: 1000 requests per hour
- **Simulation**: 100 requests per hour
- **WebSocket**: 1000 messages per hour

### Security Headers
- `X-Content-Type-Options: nosniff`
- `X-Frame-Options: DENY`
- `X-XSS-Protection: 1; mode=block`
- `Strict-Transport-Security: max-age=31536000`

### Error Codes
- `AUTHENTICATION_ERROR`: Invalid or expired token
- `AUTHORIZATION_ERROR`: Insufficient permissions
- `VALIDATION_ERROR`: Invalid request parameters
- `RESOURCE_NOT_FOUND`: Requested resource not found
- `RATE_LIMIT_EXCEEDED`: Too many requests
- `SIMULATION_ERROR`: Simulation operation failed
- `INTERNAL_ERROR`: Server error

## 📚 Related Documents

- `engine_specification.md` - Engine technical specifications
- `database_schema.md` - Database structure
- `performance_requirements.md` - Performance guidelines

## 🔄 Version History

| Version | Date | Changes |
|---------|------|---------|
| 1.0 | [Current Date] | Initial API specification |

---

**Next Review Date**: [Date + 30 days]
**Approved By**: [Technical Lead]
**Distribution**: Development Team, Frontend Team, API Consumers
