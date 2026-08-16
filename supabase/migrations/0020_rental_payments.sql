-- 0020_rental_payments.sql
--
-- Payment history/ledger for rentals. `rentals.advance` (see
-- 0001_init_schema.sql) stays exactly as-is — the single cumulative
-- "total received so far" number every existing screen already reads for
-- balance math (RentalForm, RentalsList's extend/edit modals, reports).
-- This migration does not change that column or its meaning.
--
-- What it adds is a `rental_payments` table recording *individual*
-- payments (amount, date, method, optional note) — so "he paid after
-- return, in cash, on 12 Aug" is answerable, not just "₹50 has been paid
-- in total". The two RPCs below are the only way `advance` should be
-- changed going forward for a tracked payment: they insert/delete a
-- payment row AND adjust `rentals.advance` by the same amount in the same
-- transaction, so the cached total never drifts from the ledger that
-- explains it. Direct edits to `rentals.advance` (e.g. a manual
-- correction via the existing Edit rental form) remain possible and are
-- not reconciled against this ledger — that stays a deliberate manual
-- override, same as before this migration.

create table if not exists rental_payments (
  id uuid primary key default gen_random_uuid(),
  rental_id uuid not null references rentals (id) on delete cascade,
  amount numeric(10, 2) not null check (amount > 0),
  payment_date date not null default current_date,
  method text not null default 'cash'
    check (method in ('cash', 'upi', 'card', 'bank_transfer', 'other')),
  notes text,
  created_at timestamptz not null default now()
);
create index if not exists rental_payments_rental_id_idx on rental_payments (rental_id);
create index if not exists rental_payments_payment_date_idx on rental_payments (payment_date);

alter table rental_payments enable row level security;

create policy "admin full access rental payments" on rental_payments
  for all using (is_admin()) with check (is_admin());

-- Records one payment and bumps rentals.advance by the same amount,
-- atomically. Returns the new payment's id.
create or replace function record_rental_payment(
  p_rental_id uuid,
  p_amount numeric,
  p_payment_date date,
  p_method text,
  p_notes text
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_payment_id uuid;
begin
  if not is_admin() then
    raise exception 'Only admins can record rental payments';
  end if;

  if p_amount is null or p_amount <= 0 then
    raise exception 'Payment amount must be greater than zero';
  end if;

  insert into rental_payments (rental_id, amount, payment_date, method, notes)
  values (
    p_rental_id,
    p_amount,
    coalesce(p_payment_date, current_date),
    coalesce(p_method, 'cash'),
    nullif(p_notes, '')
  )
  returning id into v_payment_id;

  update rentals set advance = advance + p_amount where id = p_rental_id;

  if not found then
    raise exception 'Rental % not found', p_rental_id;
  end if;

  return v_payment_id;
end;
$$;

-- Deletes a payment and reverses its amount out of rentals.advance
-- (floored at 0, in case of a prior manual override that already lowered
-- it below the ledger sum).
create or replace function delete_rental_payment(p_payment_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_rental_id uuid;
  v_amount numeric;
begin
  if not is_admin() then
    raise exception 'Only admins can delete rental payments';
  end if;

  delete from rental_payments
    where id = p_payment_id
    returning rental_id, amount into v_rental_id, v_amount;

  if v_rental_id is null then
    raise exception 'Payment % not found', p_payment_id;
  end if;

  update rentals set advance = greatest(0, advance - v_amount) where id = v_rental_id;
end;
$$;

comment on function record_rental_payment(uuid, numeric, date, text, text) is
  'Atomically logs a rental payment (date/method/amount/notes) and adds it '
  'to rentals.advance, so the running balance stays correct without the '
  'admin computing a new cumulative total by hand.';
comment on function delete_rental_payment(uuid) is
  'Removes a logged payment and reverses it out of rentals.advance.';

revoke all on function record_rental_payment(uuid, numeric, date, text, text) from public;
grant execute on function record_rental_payment(uuid, numeric, date, text, text) to authenticated;
revoke all on function delete_rental_payment(uuid) from public;
grant execute on function delete_rental_payment(uuid) to authenticated;

do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'rental_payments'
  ) then
    execute 'alter publication supabase_realtime add table public.rental_payments';
  end if;
end $$;
