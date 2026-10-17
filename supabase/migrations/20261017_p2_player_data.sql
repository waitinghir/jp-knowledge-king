-- P2: anonymous accounts + player data in the cloud (v1.6.0)
-- Run once in Supabase Dashboard → SQL Editor, AFTER enabling
-- Authentication → Sign In / Providers → "Allow anonymous sign-ins".
--
-- Once the app signs in anonymously, its requests use the `authenticated`
-- role instead of `anon`. Every table the app writes to must therefore
-- also accept `authenticated` inserts — otherwise the feedback form and
-- L5 monitoring silently stop working in v1.6.0.

-- ── player_data: one row per (anonymous) account ────────────────────────────
create table if not exists public.player_data (
  user_id         uuid primary key references auth.users (id) on delete cascade,
  total_score     integer     not null default 0 check (total_score >= 0),
  level           integer     not null default 1 check (level >= 1),
  games_played    integer     not null default 0 check (games_played >= 0),
  wins            integer     not null default 0 check (wins >= 0 and wins <= games_played),
  recent_outcomes jsonb       not null default '[]'
                  check (jsonb_typeof(recent_outcomes) = 'array' and jsonb_array_length(recent_outcomes) <= 5),
  weekly_score    integer     not null default 0 check (weekly_score >= 0),
  current_week_id text        not null default '' check (char_length(current_week_id) <= 10),
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

create or replace function public.touch_updated_at() returns trigger
language plpgsql as $$
begin
  new.updated_at := now();
  return new;
end $$;

drop trigger if exists player_data_touch on public.player_data;
create trigger player_data_touch before update on public.player_data
  for each row execute function public.touch_updated_at();

alter table public.player_data enable row level security;

drop policy if exists "read own player data" on public.player_data;
create policy "read own player data" on public.player_data
  for select to authenticated using (auth.uid() = user_id);

drop policy if exists "insert own player data" on public.player_data;
create policy "insert own player data" on public.player_data
  for insert to authenticated with check (auth.uid() = user_id);

drop policy if exists "update own player data" on public.player_data;
create policy "update own player data" on public.player_data
  for update to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- ── Existing app-written tables: also accept signed-in (anonymous) users ────
drop policy if exists "authenticated can insert feedback" on public.feedback;
create policy "authenticated can insert feedback" on public.feedback
  for insert to authenticated with check (true);

drop policy if exists "authenticated can insert answers" on public.answer_events;
create policy "authenticated can insert answers" on public.answer_events
  for insert to authenticated with check (true);

drop policy if exists "authenticated can insert reports" on public.question_reports;
create policy "authenticated can insert reports" on public.question_reports
  for insert to authenticated with check (true);

-- L5 rows record which account answered (null for older app versions).
alter table public.answer_events    add column if not exists user_id uuid default auth.uid();
alter table public.question_reports add column if not exists user_id uuid default auth.uid();
