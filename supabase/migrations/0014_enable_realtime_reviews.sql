-- Extends 0011_enable_realtime.sql to cover product_reviews, added after
-- that migration in 0012_product_reviews.sql. Kept as its own file rather
-- than editing 0011 — never edit a migration that may already be applied
-- to a real project (see the header note in 0001_init_schema.sql).
do $$
begin
  if not exists (
    select 1
    from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'product_reviews'
  ) then
    execute 'alter publication supabase_realtime add table public.product_reviews';
  end if;
end $$;
