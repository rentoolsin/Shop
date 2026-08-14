-- supabase/seed.sql
-- Seed data for local development only. Names only — no invented prices,
-- specs, brands, or availability (those are configured by Admin).
-- Run manually against a dev project; do not include in migrations.

insert into categories (name, slug, sort_order) values
  ('Ladders & Stools', 'ladders-stools', 1),
  ('Cutting & Drilling', 'cutting-drilling', 2),
  ('Motors & Machines', 'motors-machines', 3),
  ('Site Tools', 'site-tools', 4)
on conflict (slug) do nothing;

insert into products (category_id, name, slug, is_featured, sort_order)
select c.id, p.name, p.slug, p.featured, p.sort_order
from (values
  ('Ladders & Stools', 'Big Stool / Ladder Stool', 'ladder-stool', true, 1),
  ('Ladders & Stools', 'Ladder', 'ladder', true, 2),
  ('Cutting & Drilling', 'Pipe Cutting Machine', 'pipe-cutting-machine', true, 1),
  ('Motors & Machines', 'Motors', 'motors', false, 1),
  ('Site Tools', 'MS Ghamela / MS Satti', 'ms-ghamela-satti', false, 1),
  ('Site Tools', 'Mamoty', 'mamoty', false, 2),
  ('Motors & Machines', 'Dryer Machine', 'dryer-machine', false, 2),
  ('Cutting & Drilling', 'Cutting Machine', 'cutting-machine', false, 2),
  ('Cutting & Drilling', 'Drilling Machine', 'drilling-machine', true, 3),
  ('Motors & Machines', 'Amber Machine', 'amber-machine', false, 3)
) as p(category_name, name, slug, featured, sort_order)
join categories c on c.name = p.category_name
on conflict (slug) do nothing;

-- No product_variants seeded: daily rates, sizes, and quantities must be
-- entered by Admin — never invented.
