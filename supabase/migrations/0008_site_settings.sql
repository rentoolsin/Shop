-- 0008_site_settings.sql
-- Site-wide business contact info (phone, WhatsApp, email, address),
-- previously hard-coded across src/utils/contact.ts, Contact.tsx, and
-- Location.tsx. Backs the new admin Settings screen. Deliberately a
-- separate table from `homepage_content`: that CMS controls homepage
-- *copy* (including its own `contact_location.address` field, rendered
-- only on the homepage), while this table is the single real business
-- phone/WhatsApp/email/address used by action buttons and the Contact/
-- Location pages across the whole site.
--
-- Singleton table: exactly one row, id fixed to `true` via the primary
-- key + check constraint, so there's no list/create/delete surface to
-- build or guard against — just read and update.

create table if not exists site_settings (
  id boolean primary key default true,
  phone text not null,
  whatsapp text not null,
  email text not null,
  address text not null,
  updated_at timestamptz not null default now(),
  constraint site_settings_singleton check (id)
);

-- Seed with the real values already in use in the codebase (not
-- placeholders) so applying this migration doesn't change what's shown
-- anywhere.
insert into site_settings (id, phone, whatsapp, email, address)
values (
  true,
  '+919688755349',
  '919688755349',
  'rentools.in@gmail.com',
  'Kovilmedu, Coimbatore, Tamil Nadu, India'
)
on conflict (id) do nothing;

alter table site_settings enable row level security;

-- Anyone (including anonymous customers) can read business contact info.
create policy "public read site settings"
  on site_settings
  for select
  using (true);

-- Only admins can change it. No insert/delete policy: the singleton row
-- is seeded by this migration and never created/removed from the client.
create policy "admin update site settings"
  on site_settings
  for update
  using (is_admin())
  with check (is_admin());
