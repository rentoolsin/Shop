-- Additive migration: revision history for homepage_content.
--
-- homepage_content (0001_init_schema.sql) already supports draft/publish
-- via its `is_published` flag on the current row. This adds a snapshot
-- table so the admin editor can show past versions and restore one,
-- without touching the existing table or its RLS policies.
--
-- A snapshot is inserted every time a section's content is saved (see
-- admin-homepage-content.service.ts), capturing the content as it was
-- *before* the save, so the most recent snapshot is always "what was live
-- before this edit".

create table if not exists homepage_content_revisions (
  id uuid primary key default gen_random_uuid(),
  section_key text not null references homepage_content (section_key) on delete cascade,
  content jsonb not null,
  created_at timestamptz not null default now()
);

create index if not exists homepage_content_revisions_section_key_idx
  on homepage_content_revisions (section_key, created_at desc);

alter table homepage_content_revisions enable row level security;

-- Admin-only, same pattern as every other admin-managed table.
create policy "admin full access homepage content revisions" on homepage_content_revisions
  for all using (is_admin()) with check (is_admin());
