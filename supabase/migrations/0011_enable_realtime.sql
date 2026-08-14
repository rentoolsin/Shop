-- Turn on Realtime for the tables the app now subscribes to from the
-- frontend (see src/hooks/useAsyncData.ts's `realtimeTables` option), so
-- edits made in the admin app show up on customer screens instantly and
-- vice versa, without polling.
--
-- Wrapped in a loop that checks pg_publication_tables first so this
-- migration is safe to re-run and won't error if a table's already added.
do $$
declare
  t text;
begin
  foreach t in array array[
    'categories',
    'products',
    'product_variants',
    'product_images',
    'customers',
    'rentals',
    'enquiries',
    'purchase_requests',
    'homepage_content',
    'homepage_content_revisions',
    'site_settings'
  ]
  loop
    if not exists (
      select 1
      from pg_publication_tables
      where pubname = 'supabase_realtime'
        and schemaname = 'public'
        and tablename = t
    ) then
      execute format('alter publication supabase_realtime add table public.%I', t);
    end if;
  end loop;
end $$;
