-- Drop existing tables if rebuilding
drop table if exists predictions cascade;
drop table if exists fixtures cascade;
drop table if exists users cascade;

-- Users
create table users (
  id uuid default gen_random_uuid() primary key,
  username text unique not null,
  password_hash text not null,
  is_admin boolean default false,
  created_at timestamptz default now()
);

-- Fixtures
create table fixtures (
  id uuid default gen_random_uuid() primary key,
  match_number integer unique not null,
  stage text not null,
  "group" text,
  home_team text not null,
  away_team text not null,
  home_flag text default '🏳',
  away_flag text default '🏳',
  kickoff_utc timestamptz not null,
  venue text,
  city text,
  status text default 'upcoming',
  home_score integer,
  away_score integer,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Predictions
create table predictions (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references users(id) on delete cascade,
  fixture_id uuid references fixtures(id) on delete cascade,
  home_score integer not null,
  away_score integer not null,
  points integer,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  unique(user_id, fixture_id)
);

-- Indexes
create index idx_predictions_user on predictions(user_id);
create index idx_predictions_fixture on predictions(fixture_id);
create index idx_fixtures_kickoff on fixtures(kickoff_utc);

-- RLS
alter table users enable row level security;
alter table fixtures enable row level security;
alter table predictions enable row level security;

-- Service role full access
create policy "srv_users" on users for all to service_role using (true) with check (true);
create policy "srv_fixtures" on fixtures for all to service_role using (true) with check (true);
create policy "srv_predictions" on predictions for all to service_role using (true) with check (true);

-- Anon read
create policy "anon_read_fixtures" on fixtures for select to anon using (true);
create policy "anon_read_predictions" on predictions for select to anon using (true);
create policy "anon_read_users" on users for select to anon using (true);
