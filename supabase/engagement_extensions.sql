-- Twelfth backend engagement extensions.
-- Run this in Supabase SQL Editor. It only creates missing tables and columns.

create table if not exists daily_trivia (
  id uuid default gen_random_uuid() primary key,
  question text not null,
  options jsonb not null,
  correct_answer text not null,
  difficulty text default 'easy',
  points integer default 30,
  created_at timestamptz default now()
);

create table if not exists trivia_answers (
  id uuid default gen_random_uuid() primary key,
  fan_id uuid references fan_profiles(id) on delete cascade,
  trivia_id uuid references daily_trivia(id),
  selected_answer text not null,
  is_correct boolean not null,
  answered_at timestamptz default now(),
  unique(fan_id, trivia_id)
);

create table if not exists fixtures (
  id serial primary key,
  home_team text not null,
  away_team text not null,
  kickoff_utc timestamptz not null,
  status text default 'upcoming',
  simulated_home_score integer,
  simulated_away_score integer,
  seed text,
  is_demo boolean default true,
  created_at timestamptz default now()
);

create table if not exists predictions (
  id uuid default gen_random_uuid() primary key,
  fan_id uuid references fan_profiles(id) on delete cascade,
  fixture_id integer references fixtures(id),
  predicted_winner text not null,
  predicted_home_score integer,
  predicted_away_score integer,
  submitted_at timestamptz default now(),
  resolved_at timestamptz,
  points_awarded integer default 0,
  is_correct boolean,
  unique(fan_id, fixture_id)
);

create table if not exists quests (
  id text primary key,
  title text not null,
  description text not null,
  points integer not null,
  quest_type text not null,
  resets text default 'never'
);

create table if not exists quest_progress (
  id uuid default gen_random_uuid() primary key,
  fan_id uuid references fan_profiles(id) on delete cascade,
  quest_id text references quests(id),
  progress integer default 0,
  completed boolean default false,
  completed_at timestamptz,
  unique(fan_id, quest_id)
);

create table if not exists badge_progress (
  id uuid default gen_random_uuid() primary key,
  fan_id uuid references fan_profiles(id) on delete cascade,
  badge_type text not null,
  current_tier text default 'none',
  progress integer default 0,
  claimed_onchain boolean default false,
  tx_hash text,
  updated_at timestamptz default now(),
  unique(fan_id, badge_type)
);

create table if not exists team_strength (
  country_code text primary key,
  country_name text not null,
  attack integer not null,
  defence integer not null,
  midfield integer not null,
  form integer not null,
  fifa_rank integer not null
);

alter table daily_trivia enable row level security;
alter table trivia_answers enable row level security;
alter table fixtures enable row level security;
alter table predictions enable row level security;
alter table quests enable row level security;
alter table quest_progress enable row level security;
alter table badge_progress enable row level security;
alter table team_strength enable row level security;

do $$
begin
  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'daily_trivia' and policyname = 'Public read') then
    create policy "Public read" on daily_trivia for select using (true);
  end if;
  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'fixtures' and policyname = 'Public read') then
    create policy "Public read" on fixtures for select using (true);
  end if;
  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'quests' and policyname = 'Public read') then
    create policy "Public read" on quests for select using (true);
  end if;
  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'team_strength' and policyname = 'Public read') then
    create policy "Public read" on team_strength for select using (true);
  end if;
  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'trivia_answers' and policyname = 'Public read') then
    create policy "Public read" on trivia_answers for select using (true);
  end if;
  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'predictions' and policyname = 'Public read') then
    create policy "Public read" on predictions for select using (true);
  end if;
  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'quest_progress' and policyname = 'Public read') then
    create policy "Public read" on quest_progress for select using (true);
  end if;
  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'badge_progress' and policyname = 'Public read') then
    create policy "Public read" on badge_progress for select using (true);
  end if;
end $$;

do $$
begin
  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'trivia_answers' and policyname = 'Insert own') then
    create policy "Insert own" on trivia_answers for insert with check (true);
  end if;
  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'predictions' and policyname = 'Insert own') then
    create policy "Insert own" on predictions for insert with check (true);
  end if;
  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'quest_progress' and policyname = 'Insert own') then
    create policy "Insert own" on quest_progress for insert with check (true);
  end if;
  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'quest_progress' and policyname = 'Update own') then
    create policy "Update own" on quest_progress for update using (true);
  end if;
  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'badge_progress' and policyname = 'Insert own') then
    create policy "Insert own" on badge_progress for insert with check (true);
  end if;
  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'badge_progress' and policyname = 'Update own') then
    create policy "Update own" on badge_progress for update using (true);
  end if;
end $$;

-- Seed-script write access for admin/static tables (non-user data, safe to allow public writes).
-- The anon key is used by seed scripts; service_role key bypasses RLS entirely if provided.
do $$
begin
  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'daily_trivia' and policyname = 'Insert seed') then
    create policy "Insert seed" on daily_trivia for insert with check (true);
  end if;
  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'daily_trivia' and policyname = 'Update seed') then
    create policy "Update seed" on daily_trivia for update using (true);
  end if;
  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'fixtures' and policyname = 'Insert seed') then
    create policy "Insert seed" on fixtures for insert with check (true);
  end if;
  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'fixtures' and policyname = 'Update seed') then
    create policy "Update seed" on fixtures for update using (true);
  end if;
  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'quests' and policyname = 'Insert seed') then
    create policy "Insert seed" on quests for insert with check (true);
  end if;
  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'quests' and policyname = 'Update seed') then
    create policy "Update seed" on quests for update using (true);
  end if;
  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'team_strength' and policyname = 'Insert seed') then
    create policy "Insert seed" on team_strength for insert with check (true);
  end if;
  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'team_strength' and policyname = 'Update seed') then
    create policy "Update seed" on team_strength for update using (true);
  end if;
end $$;

alter table fan_profiles add column if not exists last_check_in_date date;
alter table fan_profiles add column if not exists prediction_streak integer default 0;
alter table fan_profiles add column if not exists fan_rank text default 'Casual';
