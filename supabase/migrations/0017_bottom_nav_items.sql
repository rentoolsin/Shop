-- 0017_bottom_nav_items.sql
-- Makes the customer app's bottom navigation bar admin-editable: icon,
-- label, and target page for each tab, plus the ability to add, remove,
-- and reorder tabs. Previously this bar was a hardcoded array of 5 items
-- in src/components/layout/BottomNavigation.tsx.
--
-- Stored as jsonb on the existing `site_settings` singleton (same table
-- used for phone/whatsapp/email/address) rather than a new table: it's
-- one more piece of public-facing site configuration, edited from the
-- same admin Settings screen, read the same way (anon SELECT, admin
-- UPDATE) — no list/create/delete surface needed, same as the rest of
-- that table.
--
-- Shape (validated client-side in src/utils/bottom-nav.ts before it's
-- ever trusted — this column intentionally has no CHECK constraint on
-- its internal structure, matching how flexible jsonb columns are
-- treated elsewhere in this schema, e.g. homepage_content.value):
--   [{ "id": "text", "label": "text", "icon": "icon-key", "path": "/some/route" }, ...]

alter table site_settings
  add column if not exists bottom_nav_items jsonb;

-- Seed with the exact bar that was previously hardcoded, so applying
-- this migration doesn't change what's shown anywhere.
update site_settings
set bottom_nav_items = '[
  { "id": "default-home", "label": "Home", "icon": "home", "path": "/" },
  { "id": "default-search", "label": "Search", "icon": "search", "path": "/search" },
  { "id": "default-enquire", "label": "Enquire", "icon": "send", "path": "/enquire" },
  { "id": "default-tools", "label": "Tools", "icon": "wrench", "path": "/products" },
  { "id": "default-contact", "label": "Contact", "icon": "phone", "path": "/contact" }
]'::jsonb
where id = true and bottom_nav_items is null;

-- RLS already covers this column: the existing "public read site
-- settings" (select) and "admin update site settings" (update) policies
-- on site_settings apply to the whole row, no per-column policy needed.
