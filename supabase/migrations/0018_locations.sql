-- 0018_locations.sql
-- Backs the customer app's location picker (src/components/home/LocationBar.tsx)
-- and a new admin "Locations" screen. RenTools currently delivers in
-- Coimbatore only; this table lets admin list other cities people can
-- browse to/select, with `is_available` controlling whether picking one
-- shows real delivery details or a "coming soon" message. Same shape/RLS
-- pattern as `categories` (0001_init_schema.sql).

create table if not exists locations (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  state text not null,
  is_available boolean not null default false,
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);
create index if not exists locations_sort_order_idx on locations (sort_order);

alter table locations enable row level security;

create policy "public read locations" on locations
  for select using (true);

create policy "admin full access locations" on locations
  for all using (is_admin()) with check (is_admin());

-- Seed with the one currently-served city, marked available, so applying
-- this migration doesn't change what's shown anywhere until admin adds more.
insert into locations (name, state, is_available, sort_order)
select 'Coimbatore', 'Tamil Nadu', true, 0
where not exists (select 1 from locations);

-- Realtime, same as 0014_enable_realtime_reviews.sql did for product_reviews.
do $$
begin
  if not exists (
    select 1
    from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'locations'
  ) then
    execute 'alter publication supabase_realtime add table public.locations';
  end if;
end $$;
