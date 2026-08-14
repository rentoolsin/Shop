-- 0001_init_schema.sql
-- RenTools initial schema. Source of truth: this file + subsequent
-- versioned migrations in this directory (append-only, never edit a
-- migration that has already been applied to a real project).

create extension if not exists "pgcrypto";

-- ==========================================================================
-- Admin identity
-- ==========================================================================
-- Minimal admin allowlist keyed to Supabase auth users. Anyone in this
-- table is treated as staff for RLS purposes. Manage rows manually in the
-- Supabase dashboard (or a future Settings screen) — never expose this
-- table to the client for writes.
create table if not exists admin_users (
  user_id uuid primary key references auth.users (id) on delete cascade,
  created_at timestamptz not null default now()
);

create or replace function is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from admin_users where user_id = auth.uid()
  );
$$;

-- ==========================================================================
-- Catalog: categories, products, product_variants
-- ==========================================================================
create table if not exists categories (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  image_url text,
  sort_order integer not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists products (
  id uuid primary key default gen_random_uuid(),
  category_id uuid not null references categories (id) on delete restrict,
  name text not null,
  slug text not null unique,
  description text,
  image_url text,
  is_featured boolean not null default false,
  is_active boolean not null default true,
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);
create index if not exists products_category_id_idx on products (category_id);

create table if not exists product_variants (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references products (id) on delete cascade,
  label text not null, -- e.g. "8 ft", "10 HP"
  daily_rate numeric(10, 2) not null check (daily_rate >= 0),
  quantity_total integer not null check (quantity_total >= 0),
  quantity_reserved integer not null default 0 check (quantity_reserved >= 0),
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  constraint reserved_not_over_total check (quantity_reserved <= quantity_total)
);
create index if not exists product_variants_product_id_idx on product_variants (product_id);

-- ==========================================================================
-- Customers
-- ==========================================================================
create table if not exists customers (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  mobile text not null,
  address text,
  created_at timestamptz not null default now()
);
create index if not exists customers_mobile_idx on customers (mobile);

-- ==========================================================================
-- Rentals — business rules mirrored from src/utils/rental-calculations.ts
-- (that file is the authoritative reference; keep both in sync by hand
-- until this is generated from a shared schema).
-- ==========================================================================
create type rental_status as enum (
  'active', 'due_today', 'returned', 'overdue', 'cancelled'
);

create table if not exists rentals (
  id uuid primary key default gen_random_uuid(),
  customer_id uuid not null references customers (id) on delete restrict,
  variant_id uuid not null references product_variants (id) on delete restrict,
  quantity integer not null check (quantity > 0),
  start_date date not null,
  return_date date not null,
  daily_rate numeric(10, 2) not null check (daily_rate >= 0),
  advance numeric(10, 2) not null default 0 check (advance >= 0),
  status rental_status not null default 'active',
  actual_return_date date,
  created_at timestamptz not null default now(),
  constraint return_not_before_start check (return_date >= start_date)
);
create index if not exists rentals_customer_id_idx on rentals (customer_id);
create index if not exists rentals_variant_id_idx on rentals (variant_id);
create index if not exists rentals_status_idx on rentals (status);

-- Inclusive day count: 13 Aug -> 15 Aug = 3 days.
create or replace function rental_days(p_start date, p_return date)
returns integer language sql immutable as $$
  select (p_return - p_start) + 1;
$$;

create or replace function rental_total(p_start date, p_return date, p_rate numeric, p_qty integer)
returns numeric language sql immutable as $$
  select rental_days(p_start, p_return) * p_rate * p_qty;
$$;

-- Authoritative inventory enforcement: keeps product_variants.quantity_reserved
-- in sync with active rentals, and refuses to reserve more than is available.
-- Frontend validation (rental-calculations.ts) is a UX convenience only —
-- this trigger is what actually protects the data.
create or replace function enforce_rental_inventory()
returns trigger language plpgsql as $$
declare
  v_available integer;
  v_old_qty integer := 0;
  v_old_variant uuid := null;
  v_old_counts boolean;
begin
  -- Does the OLD row's reservation still apply (still an active-style hold)?
  v_old_counts := (tg_op = 'UPDATE' or tg_op = 'DELETE')
    and old.status in ('active', 'due_today', 'overdue');
  if v_old_counts then
    v_old_variant := old.variant_id;
    v_old_qty := old.quantity;
  end if;

  -- Release the old reservation first (if any) so an UPDATE that keeps the
  -- same variant is evaluated against the correct headroom.
  if v_old_variant is not null then
    update product_variants
      set quantity_reserved = quantity_reserved - v_old_qty
      where id = v_old_variant;
  end if;

  if tg_op in ('INSERT', 'UPDATE') and new.status in ('active', 'due_today', 'overdue') then
    select quantity_total - quantity_reserved into v_available
      from product_variants where id = new.variant_id for update;

    if v_available is null then
      raise exception 'Unknown product variant %', new.variant_id;
    end if;
    if v_available < new.quantity then
      raise exception 'Not enough inventory available (have %, need %)', v_available, new.quantity;
    end if;

    update product_variants
      set quantity_reserved = quantity_reserved + new.quantity
      where id = new.variant_id;
  end if;

  return coalesce(new, old);
end;
$$;

drop trigger if exists rentals_inventory_trigger on rentals;
create trigger rentals_inventory_trigger
  before insert or update or delete on rentals
  for each row execute function enforce_rental_inventory();

-- ==========================================================================
-- Enquiries
-- ==========================================================================
create type enquiry_status as enum (
  'new', 'contacted', 'converted', 'not_available', 'closed'
);

create table if not exists enquiries (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  mobile text not null,
  product_id uuid references products (id) on delete set null,
  requested_product_text text,
  quantity integer check (quantity is null or quantity > 0),
  required_date date,
  number_of_days integer check (number_of_days is null or number_of_days > 0),
  address text,
  message text,
  status enquiry_status not null default 'new',
  created_at timestamptz not null default now()
);

-- ==========================================================================
-- Purchase requests
-- ==========================================================================
create type purchase_request_status as enum (
  'requested', 'sourcing', 'fulfilled', 'declined'
);

create table if not exists purchase_requests (
  id uuid primary key default gen_random_uuid(),
  product_requested text not null,
  customer_id uuid references customers (id) on delete set null,
  mobile text,
  quantity integer check (quantity is null or quantity > 0),
  priority text not null default 'normal' check (priority in ('low', 'normal', 'high')),
  notes text,
  status purchase_request_status not null default 'requested',
  created_at timestamptz not null default now()
);

-- ==========================================================================
-- Homepage CMS content — admin edits content/visibility/ordering only;
-- structure/design stays in React per spec section 9.
-- ==========================================================================
create table if not exists homepage_content (
  id uuid primary key default gen_random_uuid(),
  section_key text not null unique, -- e.g. 'hero', 'why_rentools', 'how_it_works'
  content jsonb not null default '{}'::jsonb,
  is_enabled boolean not null default true,
  sort_order integer not null default 0,
  is_published boolean not null default false,
  updated_at timestamptz not null default now()
);

-- ==========================================================================
-- Row Level Security
-- ==========================================================================
alter table categories enable row level security;
alter table products enable row level security;
alter table product_variants enable row level security;
alter table customers enable row level security;
alter table rentals enable row level security;
alter table enquiries enable row level security;
alter table purchase_requests enable row level security;
alter table homepage_content enable row level security;
alter table admin_users enable row level security;

-- Public (anon) read: active catalog only.
create policy "public read active categories" on categories
  for select using (is_active = true or is_admin());
create policy "public read active products" on products
  for select using (is_active = true or is_admin());
create policy "public read active variants" on product_variants
  for select using (is_active = true or is_admin());
create policy "public read published homepage content" on homepage_content
  for select using (is_published = true or is_admin());

-- Public (anon) insert-only: enquiries and purchase requests can be
-- submitted by anyone, but never read back or listed publicly.
create policy "public can submit enquiries" on enquiries
  for insert with check (true);
create policy "public can submit purchase requests" on purchase_requests
  for insert with check (true);

-- Everything else (write access to catalog/CMS, all customer & rental data,
-- reading back enquiries/purchase requests) is admin-only.
create policy "admin full access categories" on categories
  for all using (is_admin()) with check (is_admin());
create policy "admin full access products" on products
  for all using (is_admin()) with check (is_admin());
create policy "admin full access variants" on product_variants
  for all using (is_admin()) with check (is_admin());
create policy "admin full access homepage content" on homepage_content
  for all using (is_admin()) with check (is_admin());
create policy "admin full access customers" on customers
  for all using (is_admin()) with check (is_admin());
create policy "admin full access rentals" on rentals
  for all using (is_admin()) with check (is_admin());
create policy "admin read enquiries" on enquiries
  for select using (is_admin());
create policy "admin update enquiries" on enquiries
  for update using (is_admin()) with check (is_admin());
create policy "admin read purchase requests" on purchase_requests
  for select using (is_admin());
create policy "admin update purchase requests" on purchase_requests
  for update using (is_admin()) with check (is_admin());
create policy "admin manage admin_users" on admin_users
  for all using (is_admin()) with check (is_admin());
