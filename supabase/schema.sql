-- ============================================================
-- Pitch Therapy — Ear Training App
-- Supabase Database Schema
-- ============================================================

-- Enable UUID generation
create extension if not exists "pgcrypto";

-- ============================================================
-- 1. users — mirrors Clerk user data
-- ============================================================
create table public.users (
  id uuid primary key,                         -- Clerk user ID
  email text unique not null,
  display_name text,
  vocal_range_low real,                        -- Hz, for Pitch Match calibration
  vocal_range_high real,                       -- Hz
  created_at timestamptz default now(),
  updated_at timestamptz
);

comment on table public.users is 'User profiles synced from Clerk auth provider';

-- ============================================================
-- 2. sessions — one per game played
-- ============================================================
create table public.sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  mode text not null check (mode in ('pitch_match','note_id','frequency_guess','note_wordle','frequency_wordle')),
  difficulty text check (difficulty in ('beginner','intermediate','advanced')),
  score integer default 0,
  max_possible_score integer,
  rounds_completed integer default 0,
  total_rounds integer,
  accuracy_pct numeric(5,2),
  duration_seconds integer,
  created_at timestamptz default now()
);

comment on table public.sessions is 'One row per game session played';

-- ============================================================
-- 3. daily_challenges — seeded per date per mode
-- ============================================================
create table public.daily_challenges (
  id uuid primary key default gen_random_uuid(),
  date date not null,
  mode text not null check (mode in ('note_wordle','frequency_wordle')),
  target_note text,                            -- e.g. "A4" (for note_wordle)
  target_frequency real,                       -- Hz (for frequency_wordle)
  created_at timestamptz default now(),
  constraint uq_daily_challenge unique (date, mode)
);

comment on table public.daily_challenges is 'Pre-seeded daily challenges for wordle-style modes';

-- ============================================================
-- 4. leaderboard — daily challenge results
-- ============================================================
create table public.leaderboard (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  date date not null,
  mode text not null,
  guesses_used integer,
  total_error numeric(8,4),                    -- sum of % errors (frequency_wordle)
  solve_time_seconds integer,
  is_completed boolean default false,
  created_at timestamptz default now(),
  constraint uq_leaderboard_entry unique (user_id, date, mode)
);

comment on table public.leaderboard is 'Daily challenge scores for competitive play';

-- ============================================================
-- 5. streaks — user streak tracking
-- ============================================================
create table public.streaks (
  user_id uuid primary key references public.users(id) on delete cascade,
  current_streak integer default 0,
  longest_streak integer default 0,
  last_play_date date,
  updated_at timestamptz
);

comment on table public.streaks is 'Tracks consecutive days of play per user';

-- ============================================================
-- 6. rounds — individual rounds within a session
-- ============================================================
create table public.rounds (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references public.sessions(id) on delete cascade,
  round_number integer not null,
  target_note text,
  target_frequency real,
  user_answer text,
  is_correct boolean,
  cents_off numeric(8,2),
  response_time_ms integer,
  points_earned integer
);

comment on table public.rounds is 'Detailed per-round analytics within a session';

-- ============================================================
-- Indexes
-- ============================================================
create index idx_sessions_user_id on public.sessions (user_id);
create index idx_sessions_mode on public.sessions (mode);
create index idx_sessions_created_at on public.sessions (created_at);

create index idx_daily_challenges_date on public.daily_challenges (date);
create index idx_daily_challenges_date_mode on public.daily_challenges (date, mode);

create index idx_leaderboard_user_id on public.leaderboard (user_id);
create index idx_leaderboard_date on public.leaderboard (date);
create index idx_leaderboard_date_mode on public.leaderboard (date, mode);

create index idx_rounds_session_id on public.rounds (session_id);

-- ============================================================
-- Row Level Security (RLS)
-- ============================================================
alter table public.users enable row level security;
alter table public.sessions enable row level security;
alter table public.daily_challenges enable row level security;
alter table public.leaderboard enable row level security;
alter table public.streaks enable row level security;
alter table public.rounds enable row level security;

-- Users: can only see/edit their own row
create policy "Users can view own profile"
  on public.users for select
  using (auth.uid() = id);
create policy "Users can update own profile"
  on public.users for update
  using (auth.uid() = id);
create policy "Users can insert own profile"
  on public.users for insert
  with check (auth.uid() = id);

-- Sessions: own data only
create policy "Users can view own sessions"
  on public.sessions for select
  using (auth.uid() = user_id);
create policy "Users can insert own sessions"
  on public.sessions for insert
  with check (auth.uid() = user_id);
create policy "Users can update own sessions"
  on public.sessions for update
  using (auth.uid() = user_id);

-- Daily challenges: readable by all, insertable by authenticated
create policy "Anyone can view daily challenges"
  on public.daily_challenges for select
  to authenticated
  using (true);
create policy "Authenticated users can view daily challenges"
  on public.daily_challenges for select
  using (true);
create policy "Service role can insert daily challenges"
  on public.daily_challenges for insert
  with check (true);

-- Leaderboard: own rows read/write, all rows readable
create policy "Users can view leaderboard"
  on public.leaderboard for select
  using (true);
create policy "Users can insert own leaderboard"
  on public.leaderboard for insert
  with check (auth.uid() = user_id);
create policy "Users can update own leaderboard"
  on public.leaderboard for update
  using (auth.uid() = user_id);

-- Streaks: own data only
create policy "Users can view own streak"
  on public.streaks for select
  using (auth.uid() = user_id);
create policy "Users can insert own streak"
  on public.streaks for insert
  with check (auth.uid() = user_id);
create policy "Users can update own streak"
  on public.streaks for update
  using (auth.uid() = user_id);

-- Rounds: own data only (via session ownership)
create policy "Users can view own rounds"
  on public.rounds for select
  using (
    session_id in (select id from public.sessions where user_id = auth.uid())
  );
create policy "Users can insert own rounds"
  on public.rounds for insert
  with check (
    session_id in (select id from public.sessions where user_id = auth.uid())
  );

-- ============================================================
-- Seed function: generate daily_challenges for next 30 days
-- ============================================================
create or replace function public.seed_daily_challenges()
returns void as $$
declare
  d date;
  note_names text[] := array['C','C#','D','D#','E','F','F#','G','G#','A','A#','B'];
  note_idx integer;
  freq real;
begin
  for i in 0..29 loop
    d := current_date + i;

    -- note_wordle: deterministic note based on date
    note_idx := (extract('doy' from d)::integer * 7 + extract('month' from d)::integer) % 12;
    insert into public.daily_challenges (date, mode, target_note)
    values (d, 'note_wordle', note_names[note_idx + 1] || '4')
    on conflict (date, mode) do nothing;

    -- frequency_wordle: deterministic frequency based on date
    freq := 220.0 + ((extract('doy' from d)::integer * 13 + extract('month' from d)::integer * 7) % 600)::real;
    insert into public.daily_challenges (date, mode, target_frequency)
    values (d, 'frequency_wordle', round(freq::numeric, 2)::real)
    on conflict (date, mode) do nothing;
  end loop;
end;
$$ language plpgsql security definer;

comment on function public.seed_daily_challenges() is 'Generates deterministic daily challenges for the next 30 days. Safe to re-run (upserts).';

-- ============================================================
-- Updated_at trigger helper
-- ============================================================
create or replace function public.set_updated_at()
returns trigger as $$
begin
  new.updated_at := now();
  return new;
end;
$$ language plpgsql;

create trigger trg_users_updated_at
  before update on public.users
  for each row execute function public.set_updated_at();

create trigger trg_streaks_updated_at
  before update on public.streaks
  for each row execute function public.set_updated_at();
