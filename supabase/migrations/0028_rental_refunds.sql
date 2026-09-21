-- 0028_rental_refunds.sql
--
-- Lets a refund be logged as its own dated ledger entry, the same way a
-- payment already is (0020_rental_payments.sql).
--
-- Before this, the only way to show "we gave the customer money back" was to
-- lower `rentals.advance` by hand (or via the refund box in Mark returned),
-- which left no record of *when*, *how* or *how much* — the payment history
-- just looked shorter. `rentals.advance` keeps its meaning ("net amount
-- actually received"); a refund is simply a ledger row of kind 'refund' that
-- takes its amount back out of it.
--
-- Safe to run more than once. Existing rows all become kind = 'payment', so
-- nothing about existing rentals changes.

alter table rental_payments
  add column if not exists kind text not null default 'payment'
    check (kind in ('payment', 'refund'));

comment on column rental_payments.kind is
  '''payment'' = money received from the customer (adds to rentals.advance); '
  '''refund'' = money given back to the customer (subtracts from rentals.advance). '
  'amount is always positive — kind says which direction it went.';

-- Records one refund and lowers rentals.advance by the same amount,
-- atomically. Can't refund more than has been received so far.
create or replace function record_rental_refund(
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
  v_advance numeric;
  v_refund_id uuid;
begin
  if not is_admin() then
    raise exception 'Only admins can record rental refunds';
  end if;

  if p_amount is null or p_amount <= 0 then
    raise exception 'Refund amount must be greater than zero';
  end if;

  select advance into v_advance from rentals where id = p_rental_id for update;
  if not found then
    raise exception 'Rental % not found', p_rental_id;
  end if;

  if p_amount > v_advance then
    raise exception 'Refund (%) cannot be more than the amount received so far (%)', p_amount, v_advance;
  end if;

  insert into rental_payments (rental_id, amount, payment_date, method, notes, kind)
  values (
    p_rental_id,
    p_amount,
    coalesce(p_payment_date, current_date),
    coalesce(p_method, 'cash'),
    nullif(p_notes, ''),
    'refund'
  )
  returning id into v_refund_id;

  update rentals set advance = advance - p_amount where id = p_rental_id;

  return v_refund_id;
end;
$$;

-- Deleting a ledger row now undoes it in the right direction: removing a
-- payment lowers the advance (floored at 0, as before); removing a refund
-- puts the refunded amount back.
create or replace function delete_rental_payment(p_payment_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_rental_id uuid;
  v_amount numeric;
  v_kind text;
begin
  if not is_admin() then
    raise exception 'Only admins can delete rental payments';
  end if;

  delete from rental_payments
    where id = p_payment_id
    returning rental_id, amount, kind into v_rental_id, v_amount, v_kind;

  if v_rental_id is null then
    raise exception 'Payment % not found', p_payment_id;
  end if;

  if v_kind = 'refund' then
    update rentals set advance = advance + v_amount where id = v_rental_id;
  else
    update rentals set advance = greatest(0, advance - v_amount) where id = v_rental_id;
  end if;
end;
$$;

comment on function record_rental_refund(uuid, numeric, date, text, text) is
  'Atomically logs a refund given back to the customer (date/method/amount/notes) '
  'and subtracts it from rentals.advance.';

revoke all on function record_rental_refund(uuid, numeric, date, text, text) from public;
grant execute on function record_rental_refund(uuid, numeric, date, text, text) to authenticated;
