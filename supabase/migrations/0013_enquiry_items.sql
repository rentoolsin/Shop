-- 0013_enquiry_items.sql
-- Multi-item cart support. Pragmatic decision: rather than reshape the
-- existing `enquiries` table (which many single-product flows already
-- write to — EnquiryButton, ProductDetail's sticky bar, etc.), a cart
-- checkout creates one `enquiries` row as before (the shared
-- name/mobile/address/message/status envelope) plus one `enquiry_items`
-- row per line item. A single-product enquiry simply gets zero
-- `enquiry_items` rows and keeps using `enquiries.product_id` /
-- `enquiries.quantity` exactly as it does today — no backfill, no
-- behavioural change for the existing flow.
--
-- product_name/daily_rate are denormalized onto the line item (not just
-- joined via product_id) so a cart enquiry submitted today still reads
-- back sensibly in the admin later even if the product is later renamed,
-- re-priced, or removed.

create table if not exists enquiry_items (
  id uuid primary key default gen_random_uuid(),
  enquiry_id uuid not null references enquiries (id) on delete cascade,
  product_id uuid references products (id) on delete set null,
  product_name text not null,
  daily_rate numeric(10, 2),
  quantity integer not null check (quantity > 0),
  created_at timestamptz not null default now()
);
create index if not exists enquiry_items_enquiry_id_idx on enquiry_items (enquiry_id);
create index if not exists enquiry_items_product_id_idx on enquiry_items (product_id);

alter table enquiry_items enable row level security;

-- Same trust model as `enquiries` itself: anyone can submit line items for
-- an enquiry (the cart checkout flow does this in the same request as the
-- parent insert), nobody but admin can read them back.
create policy "public can submit enquiry items" on enquiry_items
  for insert with check (true);

create policy "admin read enquiry items" on enquiry_items
  for select using (is_admin());
create policy "admin full access enquiry items" on enquiry_items
  for all using (is_admin()) with check (is_admin());
