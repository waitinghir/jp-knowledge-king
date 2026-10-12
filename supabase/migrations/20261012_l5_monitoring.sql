-- L5 online monitoring (v1.5.2)
-- Run once in Supabase Dashboard → SQL Editor.
--
-- answer_events    one row per answered question (5 per battle), written by the app
-- question_reports one row per "report this question" tap on the result screen
-- Both are anonymous (random per-install device_id, no account) and INSERT-only for
-- the app: the anon key can write rows but never read them back.

-- ── answer_events ───────────────────────────────────────────────────────────
create table if not exists public.answer_events (
  id          bigint generated always as identity primary key,
  created_at  timestamptz not null default now(),
  battle_id   uuid        not null,
  device_id   uuid        not null,
  app_version text        not null check (char_length(app_version) <= 20),
  lang        text        not null check (lang in ('zh', 'en')),
  question_no smallint    not null check (question_no between 1 and 10),
  word_id     text        not null check (char_length(word_id) <= 40),
  options     jsonb       not null check (jsonb_typeof(options) = 'array' and jsonb_array_length(options) = 4),
  answer      text        not null check (char_length(answer) <= 200),
  chosen      text                 check (char_length(chosen) <= 200),  -- null = timed out
  correct     boolean     not null,
  time_used   real        not null check (time_used between 0 and 10)
);
create index if not exists answer_events_word_idx on public.answer_events (word_id, lang);

alter table public.answer_events enable row level security;
drop policy if exists "anon can insert answers" on public.answer_events;
create policy "anon can insert answers" on public.answer_events
  for insert to anon with check (true);

-- ── question_reports ────────────────────────────────────────────────────────
create table if not exists public.question_reports (
  id          bigint generated always as identity primary key,
  created_at  timestamptz not null default now(),
  battle_id   uuid        not null,
  device_id   uuid        not null,
  app_version text        not null check (char_length(app_version) <= 20),
  lang        text        not null check (lang in ('zh', 'en')),
  word_id     text        not null check (char_length(word_id) <= 40),
  options     jsonb       not null check (jsonb_typeof(options) = 'array' and jsonb_array_length(options) = 4),
  answer      text        not null check (char_length(answer) <= 200),
  chosen      text                 check (char_length(chosen) <= 200),
  reason      text        not null check (reason in ('multiple_correct', 'answer_wrong', 'unnatural', 'other'))
);
create index if not exists question_reports_word_idx on public.question_reports (word_id, lang);

alter table public.question_reports enable row level security;
drop policy if exists "anon can insert reports" on public.question_reports;
create policy "anon can insert reports" on public.question_reports
  for insert to anon with check (true);

-- ── Analysis views (dashboard / service role only) ──────────────────────────
-- Suspicious = a WRONG option picked by >= 30% of players on a question
-- answered at least 20 times. That option is probably also defensible.
create or replace view public.suspicious_distractors
with (security_invoker = true) as
with totals as (
  select word_id, lang, count(*) as attempts,
         avg(case when correct then 1.0 else 0.0 end) as accuracy
  from public.answer_events
  group by word_id, lang
), picks as (
  select word_id, lang, chosen, count(*) as picks
  from public.answer_events
  where not correct and chosen is not null
  group by word_id, lang, chosen
)
select p.word_id, p.lang, p.chosen as distractor, p.picks, t.attempts,
       round(p.picks::numeric / t.attempts, 2) as pick_share,
       round(t.accuracy, 2) as accuracy
from picks p join totals t using (word_id, lang)
where t.attempts >= 20 and p.picks::numeric / t.attempts >= 0.30
order by pick_share desc;

create or replace view public.report_summary
with (security_invoker = true) as
select word_id, lang, reason, count(*) as reports,
       count(distinct device_id) as reporters,
       max(created_at) as last_reported
from public.question_reports
group by word_id, lang, reason
order by reports desc;

revoke all on public.suspicious_distractors from anon, authenticated;
revoke all on public.report_summary from anon, authenticated;
