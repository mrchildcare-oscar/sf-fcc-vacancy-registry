-- Community Insights: monthly aggregate snapshots for the /insights trend view.
-- One row per month, computed by aggregating the live public_listings view so the
-- snapshot always matches what the page shows. Pure SQL + pg_cron — no edge function,
-- no external trigger. Additive and reversible (drop table + unschedule to undo).

-- 1. Snapshot table. Aggregate counts only (no PII) -> safe to expose publicly.
create table if not exists public.community_snapshots (
  snapshot_month date primary key,
  captured_at timestamptz not null default now(),
  programs_with_openings integer not null default 0,
  open_spots integer not null default 0,
  waitlist_only integer not null default 0,
  elfa_programs integer not null default 0,
  beyond_elfa_programs integer not null default 0,
  spots_by_age jsonb not null default '{}'::jsonb,
  programs_by_neighborhood jsonb not null default '{}'::jsonb,
  programs_by_language jsonb not null default '{}'::jsonb,
  freshness jsonb not null default '{}'::jsonb
);

alter table public.community_snapshots enable row level security;

drop policy if exists "Public can read community snapshots" on public.community_snapshots;
create policy "Public can read community snapshots"
  on public.community_snapshots
  for select
  using (true);

-- 2. Capture function: aggregate the live public_listings view into the current month's row.
--    SECURITY DEFINER so the scheduled job can read across providers and write the row;
--    execute is locked down to the owner/service_role (not anon/authenticated).
create or replace function public.capture_community_snapshot()
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_month date := date_trunc('month', now())::date;
begin
  insert into public.community_snapshots (
    snapshot_month, captured_at,
    programs_with_openings, open_spots, waitlist_only,
    elfa_programs, beyond_elfa_programs,
    spots_by_age, programs_by_neighborhood, programs_by_language, freshness
  )
  select
    v_month,
    now(),
    count(*),
    coalesce(sum(total_spots_available), 0),
    count(*) filter (where total_spots_available = 0 and waitlist_available),
    count(*) filter (where is_elfa_network),
    count(*) filter (where not is_elfa_network),
    jsonb_build_object(
      'infant',     coalesce(sum(infant_spots), 0),
      'toddler',    coalesce(sum(toddler_spots), 0),
      'preschool',  coalesce(sum(preschool_spots), 0),
      'school_age', coalesce(sum(school_age_spots), 0)
    ),
    coalesce((
      select jsonb_object_agg(nb, c) from (
        select coalesce(nullif(trim(neighborhood), ''), 'Unlisted') as nb, count(*) as c
        from public.public_listings group by 1
      ) t
    ), '{}'::jsonb),
    coalesce((
      select jsonb_object_agg(lang, c) from (
        select jsonb_array_elements_text(languages) as lang, count(*) as c
        from public.public_listings group by 1
      ) t
    ), '{}'::jsonb),
    jsonb_build_object(
      'fresh', count(*) filter (where last_updated >  now() - interval '14 days'),
      'aging', count(*) filter (where last_updated <= now() - interval '14 days' and last_updated > now() - interval '30 days'),
      'stale', count(*) filter (where last_updated <= now() - interval '30 days')
    )
  from public.public_listings
  on conflict (snapshot_month) do update set
    captured_at              = excluded.captured_at,
    programs_with_openings   = excluded.programs_with_openings,
    open_spots               = excluded.open_spots,
    waitlist_only            = excluded.waitlist_only,
    elfa_programs            = excluded.elfa_programs,
    beyond_elfa_programs     = excluded.beyond_elfa_programs,
    spots_by_age             = excluded.spots_by_age,
    programs_by_neighborhood = excluded.programs_by_neighborhood,
    programs_by_language     = excluded.programs_by_language,
    freshness                = excluded.freshness;
end;
$$;

revoke all on function public.capture_community_snapshot() from public, anon, authenticated;

-- 3. Schedule: capture on the 1st of every month at 09:00 UTC. Idempotent re-schedule.
do $$
begin
  if exists (select 1 from cron.job where jobname = 'capture-community-snapshot-monthly') then
    perform cron.unschedule('capture-community-snapshot-monthly');
  end if;
end $$;

select cron.schedule(
  'capture-community-snapshot-monthly',
  '0 9 1 * *',
  $$ select public.capture_community_snapshot(); $$
);

-- 4. Seed the current month immediately so the trend view starts with a point.
select public.capture_community_snapshot();
