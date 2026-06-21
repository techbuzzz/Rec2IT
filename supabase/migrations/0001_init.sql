-- Job Interview Runner — Supabase schema (Phase 4)
-- Run: supabase db push (or psql -f this.sql)

-- ============================================================================
-- TABLES
-- ============================================================================

-- runs: full run log (server-side verification, anti-cheat audit)
create table if not exists public.runs (
  id              uuid primary key default gen_random_uuid(),
  run_id          text not null unique,
  role_id         text not null,
  score           integer not null,
  distance        numeric(10, 2) not null,
  duration_ms     integer not null,
  hash            text not null,
  ip_hash         text,                            -- sha256(ip + secret) for rate limit
  modifiers       jsonb default '[]'::jsonb,       -- [{id, payload}]
  ending_id       text,
  stats           jsonb default '{}'::jsonb,
  created_at      timestamptz not null default now()
);

create index if not exists runs_role_id_idx       on public.runs (role_id);
create index if not exists runs_score_idx         on public.runs (score desc);
create index if not exists runs_created_at_idx    on public.runs (created_at desc);
create index if not exists runs_ip_hash_idx       on public.runs (ip_hash);

-- runs_anon: lightweight records visible to anyone (used for leaderboard reads)
-- Note: NO ip_hash, NO exact score reproducibility (just rank)
create table if not exists public.runs_anon (
  id              uuid primary key default gen_random_uuid(),
  run_id          text not null unique references public.runs(run_id) on delete cascade,
  role_id         text not null,
  score           integer not null,
  distance        integer not null,
  run_date        date not null default (now() at time zone 'utc')::date,
  created_at      timestamptz not null default now()
);

create index if not exists runs_anon_role_date_idx on public.runs_anon (role_id, run_date, score desc);
create index if not exists runs_anon_score_idx     on public.runs_anon (score desc);

-- leaderboard_daily: aggregated top-10 per role per day (materialized for fast reads)
create table if not exists public.leaderboard_daily (
  id              uuid primary key default gen_random_uuid(),
  role_id         text not null,
  run_date        date not null,
  top_runs        jsonb not null,                 -- [{run_id, score, distance, rank}]
  updated_at      timestamptz not null default now(),
  unique (role_id, run_date)
);

create index if not exists leaderboard_daily_date_idx on public.leaderboard_daily (run_date desc);

-- ============================================================================
-- ROW LEVEL SECURITY
-- ============================================================================

alter table public.runs          enable row level security;
alter table public.runs_anon     enable row level security;
alter table public.leaderboard_daily enable row level security;

-- runs: только service_role (Edge Function) может писать/читать
drop policy if exists "runs_no_anon_access" on public.runs;
create policy "runs_no_anon_access" on public.runs
  for all
  to anon
  using (false)
  with check (false);

-- runs_anon: anon может читать (для leaderboard), insert запрещён (через Edge Function)
drop policy if exists "runs_anon_read_all" on public.runs_anon;
create policy "runs_anon_read_all" on public.runs_anon
  for select
  to anon
  using (true);

-- leaderboard_daily: anon может читать
drop policy if exists "leaderboard_read_all" on public.leaderboard_daily;
create policy "leaderboard_read_all" on public.leaderboard_daily
  for select
  to anon
  using (true);

-- ============================================================================
-- FUNCTIONS
-- ============================================================================

-- rebuild_leaderboard_daily: вызывается Edge Function после verify-run
-- обновляет top-10 для роли за сегодня
create or replace function public.rebuild_leaderboard_daily(p_role_id text, p_run_date date)
returns void
language plpgsql
security definer
as $$
begin
  insert into public.leaderboard_daily (role_id, run_date, top_runs, updated_at)
  values (
    p_role_id,
    p_run_date,
    (
      select coalesce(jsonb_agg(row_to_json), '[]'::jsonb)
      from (
        select run_id, score, distance,
               row_number() over (order by score desc, created_at asc) as rank
        from public.runs_anon
        where role_id = p_role_id and run_date = p_run_date
        order by score desc, created_at asc
        limit 10
      ) row_to_json
    ),
    now()
  )
  on conflict (role_id, run_date) do update
  set top_runs = excluded.top_runs,
      updated_at = excluded.updated_at;
end;
$$;

-- cleanup_old_runs: cron-style, удаляет runs старше 90 дней
-- запускать через pg_cron или Supabase scheduled function
create or replace function public.cleanup_old_runs()
returns integer
language plpgsql
security definer
as $$
declare
  deleted_count integer;
begin
  delete from public.runs
  where created_at < now() - interval '90 days';
  get diagnostics deleted_count = row_count;
  return deleted_count;
end;
$$;

-- get_top_runs: безопасный read для лидерборда с фильтром по role + диапазону дат
create or replace function public.get_top_runs(
  p_role_id text,
  p_since_date date default null,
  p_limit integer default 10
)
returns table (
  run_id text,
  score integer,
  distance integer,
  run_date date,
  rank bigint
)
language sql
stable
as $$
  select run_id, score, distance, run_date,
         row_number() over (order by score desc, created_at asc) as rank
  from public.runs_anon
  where role_id = p_role_id
    and (p_since_date is null or run_date >= p_since_date)
  order by score desc, created_at asc
  limit p_limit;
$$;

-- ============================================================================
-- GRANTS
-- ============================================================================

-- anon role может вызывать get_top_runs
grant execute on function public.get_top_runs(text, date, integer) to anon;
grant select on public.runs_anon to anon;
grant select on public.leaderboard_daily to anon;

-- service_role (Edge Function) — full access
-- (default for service_role)