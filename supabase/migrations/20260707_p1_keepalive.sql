-- P1 (2026-07-07): keepalive table, reconstructed on 2026-10-21 from the
-- snippet saved in the Supabase SQL Editor (that snippet was deleted).
-- Already applied. cron-job.org GETs /rest/v1/keepalive?select=id&limit=1
-- every 3 days with the anon key to keep the free-tier project from pausing.

-- Keepalive：防免費版暫停用的最小表
create table keepalive (
  id int primary key,
  pinged_at timestamptz default now()
);

insert into keepalive (id) values (1);

-- RLS：只允許匿名讀取（不能寫）
alter table keepalive enable row level security;

create policy "anyone can read keepalive"
  on keepalive for select
  to anon
  using (true);
