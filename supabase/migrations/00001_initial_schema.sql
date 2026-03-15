-- Viridian Football - Initial Database Schema
-- Designed to match @viridian/engine TypeScript types

-- ── Leagues ─────────────────────────────────────────────────────────

create table public.leagues (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  season integer not null default 1,
  week integer not null default 0,
  phase text not null default 'offseason_start',
  salary_cap integer not null default 255000000,
  salary_floor integer not null default 216750000,
  seed bigint not null,
  settings jsonb not null default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ── Teams ───────────────────────────────────────────────────────────

create table public.teams (
  id uuid primary key default gen_random_uuid(),
  league_id uuid not null references public.leagues(id) on delete cascade,
  city text not null,
  name text not null,
  abbreviation text not null,
  conference text not null check (conference in ('AFC', 'NFC')),
  division text not null,
  stadium text not null,
  owner_profile jsonb not null default '{}',
  analytics_level integer not null default 1 check (analytics_level between 1 and 5),
  scouting_budget integer not null default 5000000,
  facilities_level integer not null default 3 check (facilities_level between 1 and 5),
  delegation_settings jsonb not null default '{}',
  record jsonb not null default '{"wins":0,"losses":0,"ties":0,"pointsFor":0,"pointsAgainst":0}',
  created_at timestamptz not null default now()
);

create index idx_teams_league on public.teams(league_id);

-- ── Players ─────────────────────────────────────────────────────────

create table public.players (
  id uuid primary key default gen_random_uuid(),
  league_id uuid not null references public.leagues(id) on delete cascade,
  team_id uuid references public.teams(id) on delete set null,
  first_name text not null,
  last_name text not null,
  age integer not null,
  position text not null,
  secondary_positions text[] not null default '{}',
  jersey_number integer not null default 0,
  experience integer not null default 0,
  college text not null default '',
  draft_year integer,
  draft_round integer,
  draft_pick integer,
  physical_ratings jsonb not null default '{}',
  personality_traits jsonb not null default '{}',
  hidden_attributes jsonb not null default '{}',
  skill_ratings jsonb not null default '{}',
  injury_status jsonb,
  roster_status text not null default 'active' check (roster_status in ('active', 'practice_squad', 'injured_reserve', 'free_agent', 'retired')),
  career_stats jsonb not null default '{}',
  created_at timestamptz not null default now()
);

create index idx_players_league on public.players(league_id);
create index idx_players_team on public.players(team_id);
create index idx_players_position on public.players(position);

-- ── Coaches ─────────────────────────────────────────────────────────

create table public.coaches (
  id uuid primary key default gen_random_uuid(),
  league_id uuid not null references public.leagues(id) on delete cascade,
  team_id uuid references public.teams(id) on delete set null,
  first_name text not null,
  last_name text not null,
  age integer not null,
  role text not null,
  offensive_scheme text,
  defensive_scheme text,
  attributes jsonb not null default '{}',
  personality jsonb not null default '{}',
  coaching_tree_origin uuid references public.coaches(id),
  years_experience integer not null default 0,
  record jsonb not null default '{"wins":0,"losses":0,"ties":0}',
  playoff_appearances integer not null default 0,
  championships integer not null default 0,
  salary integer not null default 0,
  contract_years_remaining integer not null default 0,
  created_at timestamptz not null default now()
);

create index idx_coaches_league on public.coaches(league_id);
create index idx_coaches_team on public.coaches(team_id);

-- ── Contracts ───────────────────────────────────────────────────────

create table public.contracts (
  id uuid primary key default gen_random_uuid(),
  league_id uuid not null references public.leagues(id) on delete cascade,
  player_id uuid not null references public.players(id) on delete cascade,
  team_id uuid not null references public.teams(id) on delete cascade,
  status text not null default 'active' check (status in ('active', 'expired', 'voided', 'restructured')),
  total_value integer not null,
  total_guaranteed integer not null,
  years integer not null,
  signing_bonus integer not null default 0,
  year_details jsonb not null default '[]',
  has_no_trade_clause boolean not null default false,
  has_no_tag_clause boolean not null default false,
  void_years integer not null default 0,
  signed_season integer not null,
  signed_week integer not null default 0,
  created_at timestamptz not null default now()
);

create index idx_contracts_league on public.contracts(league_id);
create index idx_contracts_player on public.contracts(player_id);
create index idx_contracts_team on public.contracts(team_id);

-- ── Draft Picks ─────────────────────────────────────────────────────

create table public.draft_picks (
  id uuid primary key default gen_random_uuid(),
  league_id uuid not null references public.leagues(id) on delete cascade,
  original_team_id uuid not null references public.teams(id),
  current_team_id uuid not null references public.teams(id),
  season integer not null,
  round integer not null,
  pick_in_round integer,
  overall integer,
  is_conditional boolean not null default false,
  conditions jsonb not null default '[]',
  resolved_round integer,
  created_at timestamptz not null default now()
);

create index idx_draft_picks_league on public.draft_picks(league_id);
create index idx_draft_picks_team on public.draft_picks(current_team_id);

-- ── Draft Prospects ─────────────────────────────────────────────────

create table public.draft_prospects (
  id uuid primary key default gen_random_uuid(),
  league_id uuid not null references public.leagues(id) on delete cascade,
  season integer not null,
  first_name text not null,
  last_name text not null,
  age integer not null,
  position text not null,
  college text not null,
  physical_ratings jsonb not null default '{}',
  personality_traits jsonb not null default '{}',
  hidden_attributes jsonb not null default '{}',
  skill_ratings jsonb not null default '{}',
  combine_results jsonb,
  created_at timestamptz not null default now()
);

create index idx_prospects_league_season on public.draft_prospects(league_id, season);

-- ── Scouting Reports (per team, per prospect) ──────────────────────

create table public.scouting_reports (
  id uuid primary key default gen_random_uuid(),
  league_id uuid not null references public.leagues(id) on delete cascade,
  team_id uuid not null references public.teams(id) on delete cascade,
  prospect_id uuid not null references public.draft_prospects(id) on delete cascade,
  overall_range jsonb not null default '[40, 80]',
  strength_notes text[] not null default '{}',
  weakness_notes text[] not null default '{}',
  comparison_player text,
  grade text check (grade in ('A', 'B', 'C', 'D', 'F')),
  scouting_investment integer not null default 0,
  confidence_level integer not null default 10,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(team_id, prospect_id)
);

-- ── Schedule ────────────────────────────────────────────────────────

create table public.games (
  id uuid primary key default gen_random_uuid(),
  league_id uuid not null references public.leagues(id) on delete cascade,
  season integer not null,
  week integer not null,
  phase text not null default 'regular',
  home_team_id uuid not null references public.teams(id),
  away_team_id uuid not null references public.teams(id),
  home_score integer,
  away_score integer,
  is_played boolean not null default false,
  play_by_play jsonb,
  seed bigint,
  created_at timestamptz not null default now()
);

create index idx_games_league_season_week on public.games(league_id, season, week);

-- ── League Users ────────────────────────────────────────────────────

create table public.league_users (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  league_id uuid not null references public.leagues(id) on delete cascade,
  team_id uuid references public.teams(id),
  role text not null default 'gm' check (role in ('commissioner', 'gm')),
  is_ready boolean not null default false,
  joined_at timestamptz not null default now(),
  unique(user_id, league_id)
);

-- ── News / Events ───────────────────────────────────────────────────

create table public.news (
  id uuid primary key default gen_random_uuid(),
  league_id uuid not null references public.leagues(id) on delete cascade,
  season integer not null,
  week integer not null,
  headline text not null,
  body text not null,
  category text not null,
  importance text not null default 'minor',
  related_team_ids uuid[] not null default '{}',
  related_player_ids uuid[] not null default '{}',
  created_at timestamptz not null default now()
);

create index idx_news_league_season on public.news(league_id, season, week);

-- ── Trade History ───────────────────────────────────────────────────

create table public.trades (
  id uuid primary key default gen_random_uuid(),
  league_id uuid not null references public.leagues(id) on delete cascade,
  season integer not null,
  week integer not null,
  team_a_id uuid not null references public.teams(id),
  team_b_id uuid not null references public.teams(id),
  team_a_assets jsonb not null default '[]',
  team_b_assets jsonb not null default '[]',
  status text not null default 'completed',
  created_at timestamptz not null default now()
);

-- ── Season History ──────────────────────────────────────────────────

create table public.season_history (
  id uuid primary key default gen_random_uuid(),
  league_id uuid not null references public.leagues(id) on delete cascade,
  season integer not null,
  champion_id uuid references public.teams(id),
  runner_up_id uuid references public.teams(id),
  awards jsonb not null default '{}',
  draft_results jsonb not null default '[]',
  created_at timestamptz not null default now(),
  unique(league_id, season)
);

-- ── Row Level Security ──────────────────────────────────────────────

alter table public.leagues enable row level security;
alter table public.teams enable row level security;
alter table public.players enable row level security;
alter table public.coaches enable row level security;
alter table public.contracts enable row level security;
alter table public.draft_picks enable row level security;
alter table public.draft_prospects enable row level security;
alter table public.scouting_reports enable row level security;
alter table public.games enable row level security;
alter table public.league_users enable row level security;
alter table public.news enable row level security;
alter table public.trades enable row level security;
alter table public.season_history enable row level security;

-- Basic RLS: users can read data for leagues they're in
create policy "Users can view their league data"
  on public.leagues for select
  using (id in (select league_id from public.league_users where user_id = auth.uid()));

create policy "Users can view teams in their league"
  on public.teams for select
  using (league_id in (select league_id from public.league_users where user_id = auth.uid()));

create policy "Users can view players in their league"
  on public.players for select
  using (league_id in (select league_id from public.league_users where user_id = auth.uid()));

create policy "Users can view coaches in their league"
  on public.coaches for select
  using (league_id in (select league_id from public.league_users where user_id = auth.uid()));

create policy "Users can view contracts in their league"
  on public.contracts for select
  using (league_id in (select league_id from public.league_users where user_id = auth.uid()));

create policy "Users can view games in their league"
  on public.games for select
  using (league_id in (select league_id from public.league_users where user_id = auth.uid()));

create policy "Users can view news in their league"
  on public.news for select
  using (league_id in (select league_id from public.league_users where user_id = auth.uid()));

-- Scouting reports are team-specific (fog of war)
create policy "Users can only view their own team scouting reports"
  on public.scouting_reports for select
  using (
    team_id in (
      select team_id from public.league_users
      where user_id = auth.uid()
    )
  );
