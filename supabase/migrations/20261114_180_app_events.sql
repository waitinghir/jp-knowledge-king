-- 1.8.0 funnel and daily-loop events
-- Run once in Supabase Dashboard → SQL Editor.
--
-- app_events  one row per event (first open, battle started, reminder accepted …),
--             anonymous (random per-install device_id). INSERT-only for the app.
-- The app signs in anonymously, so requests can come as `anon` or
-- `authenticated`: both roles get the insert policy.
--
-- Events:
--   first_open, home_view, level_change, battle_start, battle_finish,
--   theme_battle_start, reminder_ask_shown, reminder_answer, reminder_permission,
--   open_from_push {copy}, push_delivered {copy} (reported at the next app open),
--   missions_completed

create table if not exists public.app_events (
  id          bigint generated always as identity primary key,
  created_at  timestamptz not null default now(),
  device_id   uuid        not null,
  app_version text        not null check (char_length(app_version) <= 20),
  lang        text        not null check (lang in ('zh', 'en')),
  name        text        not null check (char_length(name) <= 40),
  props       jsonb       check (props is null or (jsonb_typeof(props) = 'object' and pg_column_size(props) <= 2000))
);
create index if not exists app_events_name_idx on public.app_events (name, created_at);
create index if not exists app_events_device_idx on public.app_events (device_id, created_at);

alter table public.app_events enable row level security;
drop policy if exists "app can insert events" on public.app_events;
create policy "app can insert events" on public.app_events
  for insert to anon, authenticated with check (true);

-- First-session funnel per device (for the weekly data review).
create or replace view public.first_session_funnel as
with first as (
  select device_id, min(created_at) as t0
  from public.app_events where name = 'first_open' group by device_id
)
select
  f.device_id,
  f.t0 as first_open_at,
  bool_or(e.name = 'home_view')          as saw_home,
  bool_or(e.name = 'reminder_ask_shown') as saw_reminder_ask,
  bool_or(e.name = 'level_change')       as changed_level,
  bool_or(e.name = 'battle_start')       as started_battle,
  bool_or(e.name = 'battle_finish')      as finished_battle
from first f
left join public.app_events e
  on e.device_id = f.device_id and e.created_at < f.t0 + interval '1 day'
group by f.device_id, f.t0;
revoke all on public.first_session_funnel from anon, authenticated;
