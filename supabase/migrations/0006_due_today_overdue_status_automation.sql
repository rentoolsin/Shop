-- 0006_due_today_overdue_status_automation.sql
--
-- TODO.md item 12 / DECISIONS.md: `due_today` / `overdue` are real
-- `rental_status` enum values (0001_init_schema.sql) but nothing writes
-- them automatically — `deriveDisplayStatus()` in
-- src/utils/rental-calculations.ts only approximates them for display.
-- This migration adds the DB-side automation so `rentals.status` itself
-- becomes correct, without touching the frontend: `deriveDisplayStatus()`
-- is left in place as a same-day safety net for the (small) window
-- between a return date changing and the next scheduled sync.
--
-- Only ever moves a rental between the three "open" statuses
-- (active / due_today / overdue) based on return_date vs. today.
-- returned / cancelled rentals are never touched. Because all three open
-- statuses are already treated identically by rentals_inventory_trigger
-- (0001_init_schema.sql) for reservation purposes, these updates never
-- change quantity_reserved — they only change how the rental displays.

create or replace function sync_rental_open_statuses()
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  v_updated integer;
begin
  -- Defense in depth: this only needs to run from pg_cron (no auth
  -- session, auth.uid() is null) or a service-role context. If it's ever
  -- reachable over PostgREST by a logged-in user, require admin.
  if auth.uid() is not null and not is_admin() then
    raise exception 'Only admins can run sync_rental_open_statuses()';
  end if;

  with computed as (
    select
      id,
      case
        when return_date < current_date then 'overdue'::rental_status
        when return_date = current_date then 'due_today'::rental_status
        else 'active'::rental_status
      end as next_status
    from rentals
    where status in ('active', 'due_today', 'overdue')
  )
  update rentals r
    set status = computed.next_status
    from computed
    where r.id = computed.id
      and r.status <> computed.next_status;

  get diagnostics v_updated = row_count;
  return v_updated;
end;
$$;

comment on function sync_rental_open_statuses() is
  'Recomputes active/due_today/overdue for every open rental based on '
  'return_date vs. current_date. Call directly for a manual sync, or via '
  'the pg_cron schedule below if the pg_cron extension is available.';

revoke all on function sync_rental_open_statuses() from public;
grant execute on function sync_rental_open_statuses() to authenticated;


-- Best-effort daily schedule (00:05 server time). Supabase projects have
-- pg_cron available as an enable-able extension, but it isn't guaranteed
-- to be turned on for every project, and enabling extensions typically
-- needs to happen via the Supabase dashboard rather than a plain
-- migration. Wrapped in a DO block so this migration still applies
-- cleanly (function created either way) even if pg_cron isn't enabled —
-- in that case, schedule it manually after enabling the extension:
--   select cron.schedule('sync-rental-open-statuses', '5 0 * * *',
--     $$select sync_rental_open_statuses();$$);
do $$
begin
  if exists (select 1 from pg_extension where extname = 'pg_cron') then
    perform cron.schedule(
      'sync-rental-open-statuses',
      '5 0 * * *',
      $sql$select sync_rental_open_statuses();$sql$
    );
  end if;
exception when others then
  -- Don't fail the migration if cron.schedule isn't reachable (e.g.
  -- pg_cron installed but not yet granted to this role) — the function
  -- itself is still created and callable manually or from an Edge
  -- Function on its own schedule instead.
  raise notice 'Could not schedule sync_rental_open_statuses via pg_cron: %', sqlerrm;
end $$;
