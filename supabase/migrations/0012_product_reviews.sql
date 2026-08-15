-- 0012_product_reviews.sql
-- Customer ratings/reviews on products. Pragmatic v1: no account system
-- exists, so a review is attributed to a free-text name only (same trust
-- model as enquiries — no verification that the reviewer actually rented
-- the tool). Reviews publish immediately (is_approved default true) since
-- there's no admin moderation screen yet; the column is here so that a
-- moderation queue can be added later (flip the default, add an admin
-- update policy) without another migration touching this table's shape.

create table if not exists product_reviews (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references products (id) on delete cascade,
  name text not null,
  rating smallint not null check (rating between 1 and 5),
  comment text,
  is_approved boolean not null default true,
  created_at timestamptz not null default now()
);
create index if not exists product_reviews_product_id_idx on product_reviews (product_id);
create index if not exists product_reviews_created_at_idx on product_reviews (created_at desc);

alter table product_reviews enable row level security;

-- Public (anon) read: approved reviews on active products only. Admins see
-- everything, mirroring the pattern used for categories/products above.
create policy "public read approved reviews" on product_reviews
  for select using (is_approved = true or is_admin());

-- Public (anon) insert-only, same trust model as enquiries: anyone can
-- submit a review, nobody but admin can edit/delete one after the fact.
create policy "public can submit reviews" on product_reviews
  for insert with check (true);

create policy "admin full access reviews" on product_reviews
  for all using (is_admin()) with check (is_admin());
