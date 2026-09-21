-- 0029_single_source_payments.sql
--
-- Makes the payment ledger (`rental_payments`) the ONLY way money on a rental
-- can change. `rentals.advance` stays as a cached "net received" total (every
-- screen and report already reads it), but from now on it can't drift from
-- the ledger, because nothing except the ledger functions is allowed to
-- change it.
--
-- Safe to run more than once, and safe to run on top of whatever manual SQL
-- has already been run against the tables: the backfill only inserts rows
-- where advance and the ledger disagree, so a second run finds nothing to do.
--
-- BEFORE RUNNING (optional but recommended) — see rentals whose ledger already
-- disagrees with advance:
--
--   select r.id, r.advance,
--          coalesce(sum(case when p.kind = 'refund' then -p.amount else p.amount end), 0) as ledger_net
--   from rentals r left join rental_payments p on p.rental_id = r.id
--   group by r.id, r.advance
--   having r.advance <> coalesce(sum(case when p.kind = 'refund' then -p.amount else p.amount end), 0);

-- 1. Ledger functions now open a "ledger write" window for the guard trigger
--    (added in step 4). set_config(..., true) is scoped to the transaction.

create or replace function record_rental_payment(
  p_rental_id uuid, p_amount numeric, p_payment_date date, p_method text, p_notes text
) returns uuid
language plpgsql security definer set search_path = public as $$
declare v_payment_id uuid;
begin
  if not is_admin() then raise exception 'Only admins can record rental payments'; end if;
  if p_amount is null or p_amount <= 0 then raise exception 'Payment amount must be greater than zero'; end if;

  perform set_config('app.ledger_write', 'on', true);

  insert into rental_payments (rental_id, amount, payment_date, method, notes, kind)
  values (p_rental_id, p_amount, coalesce(p_payment_date, current_date),
          coalesce(p_method, 'cash'), nullif(p_notes, ''), 'payment')
  returning id into v_payment_id;

  update rentals set advance = advance + p_amount where id = p_rental_id;
  if not found then raise exception 'Rental % not found', p_rental_id; end if;

  return v_payment_id;
end $$;

create or replace function record_rental_refund(
  p_rental_id uuid, p_amount numeric, p_payment_date date, p_method text, p_notes text
) returns uuid
language plpgsql security definer set search_path = public as $$
declare v_advance numeric; v_refund_id uuid;
begin
  if not is_admin() then raise exception 'Only admins can record rental refunds'; end if;
  if p_amount is null or p_amount <= 0 then raise exception 'Refund amount must be greater than zero'; end if;

  select advance into v_advance from rentals where id = p_rental_id for update;
  if not found then raise exception 'Rental % not found', p_rental_id; end if;
  if p_amount > v_advance then
    raise exception 'Refund (%) cannot be more than the amount received so far (%)', p_amount, v_advance;
  end if;

  perform set_config('app.ledger_write', 'on', true);

  insert into rental_payments (rental_id, amount, payment_date, method, notes, kind)
  values (p_rental_id, p_amount, coalesce(p_payment_date, current_date),
          coalesce(p_method, 'cash'), nullif(p_notes, ''), 'refund')
  returning id into v_refund_id;

  update rentals set advance = advance - p_amount where id = p_rental_id;
  return v_refund_id;
end $$;

-- No more silent flooring at 0: with a consistent ledger, hitting a negative
-- number means a later refund depends on this payment, and the admin should
-- remove that refund first instead of the totals quietly going out of sync.
create or replace function delete_rental_payment(p_payment_id uuid)
returns void
language plpgsql security definer set search_path = public as $$
declare v_rental_id uuid; v_amount numeric; v_kind text; v_advance numeric;
begin
  if not is_admin() then raise exception 'Only admins can delete rental payments'; end if;

  select rental_id, amount, kind into v_rental_id, v_amount, v_kind
  from rental_payments where id = p_payment_id;
  if v_rental_id is null then raise exception 'Payment % not found', p_payment_id; end if;

  select advance into v_advance from rentals where id = v_rental_id for update;

  if v_kind = 'payment' and v_advance - v_amount < 0 then
    raise exception 'Remove the refund(s) that depend on this payment first';
  end if;

  perform set_config('app.ledger_write', 'on', true);
  delete from rental_payments where id = p_payment_id;

  if v_kind = 'refund' then
    update rentals set advance = advance + v_amount where id = v_rental_id;
  else
    update rentals set advance = advance - v_amount where id = v_rental_id;
  end if;
end $$;

-- 2. "Set the total to X" for the Edit / Extend forms: works out the
--    difference and logs it as a dated payment or refund. Lowering requires
--    a reason, so a correction is never silent.

create or replace function set_rental_advance(
  p_rental_id uuid, p_new_total numeric, p_reason text default null
) returns void
language plpgsql security definer set search_path = public as $$
declare v_current numeric; v_note text;
begin
  if not is_admin() then raise exception 'Only admins can change rental payments'; end if;
  if p_new_total is null or p_new_total < 0 then raise exception 'Advance cannot be negative'; end if;

  select advance into v_current from rentals where id = p_rental_id for update;
  if not found then raise exception 'Rental % not found', p_rental_id; end if;

  v_note := 'Corrected via Edit rental' || case when nullif(trim(p_reason), '') is not null
                                                 then ': ' || trim(p_reason) else '' end;

  if p_new_total > v_current then
    perform record_rental_payment(p_rental_id, p_new_total - v_current, current_date, 'other', v_note);
  elsif p_new_total < v_current then
    if nullif(trim(p_reason), '') is null then
      raise exception 'A reason is required when lowering the amount received';
    end if;
    perform record_rental_refund(p_rental_id, v_current - p_new_total, current_date, 'other', v_note);
  end if;
end $$;

revoke all on function set_rental_advance(uuid, numeric, text) from public;
grant execute on function set_rental_advance(uuid, numeric, text) to authenticated;
revoke all on function record_rental_payment(uuid, numeric, date, text, text) from public;
grant execute on function record_rental_payment(uuid, numeric, date, text, text) to authenticated;
revoke all on function record_rental_refund(uuid, numeric, date, text, text) from public;
grant execute on function record_rental_refund(uuid, numeric, date, text, text) to authenticated;
revoke all on function delete_rental_payment(uuid) from public;
grant execute on function delete_rental_payment(uuid) to authenticated;

-- 3. Backfill: one "Opening balance" payment per rental where advance is
--    higher than the ledger explains (e.g. the ₹800 typed straight into Edit).
--    Does not touch rentals.advance, so no totals change.

insert into rental_payments (rental_id, amount, payment_date, method, notes, kind)
select r.id,
       r.advance - coalesce(l.net, 0),
       r.start_date,
       'other',
       'Opening balance (recorded before the payment ledger)',
       'payment'
from rentals r
left join lateral (
  select sum(case when p.kind = 'refund' then -p.amount else p.amount end) as net
  from rental_payments p where p.rental_id = r.id
) l on true
where r.advance - coalesce(l.net, 0) > 0;

-- Rentals where the ledger explains MORE than advance are not auto-fixed —
-- that needs a human decision. They are counted here; use the query at the
-- top of this file to list them.
do $$
declare v_count int;
begin
  select count(*) into v_count
  from rentals r
  where r.advance < coalesce((select sum(case when p.kind = 'refund' then -p.amount else p.amount end)
                              from rental_payments p where p.rental_id = r.id), 0);
  if v_count > 0 then
    raise notice '% rental(s) have a ledger total higher than advance — review manually.', v_count;
  end if;
end $$;

-- 4. Guard: advance can no longer be changed by a plain UPDATE.

create or replace function rentals_guard_advance() returns trigger
language plpgsql as $$
begin
  if new.advance is distinct from old.advance
     and coalesce(current_setting('app.ledger_write', true), '') <> 'on' then
    raise exception 'Amount received can only be changed by recording a payment or refund';
  end if;
  return new;
end $$;

drop trigger if exists rentals_guard_advance on rentals;
create trigger rentals_guard_advance
  before update of advance on rentals
  for each row execute function rentals_guard_advance();

-- 5. An advance entered when a rental is created becomes its first ledger
--    entry automatically (createRental / createRentalCheckout keep working).

create or replace function rentals_log_booking_advance() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if new.advance > 0 then
    insert into rental_payments (rental_id, amount, payment_date, method, notes, kind)
    values (new.id, new.advance, current_date, 'cash', 'Advance at booking', 'payment');
  end if;
  return new;
end $$;

drop trigger if exists rentals_log_booking_advance on rentals;
create trigger rentals_log_booking_advance
  after insert on rentals
  for each row execute function rentals_log_booking_advance();

-- Manual fixes from the Supabase SQL editor are now blocked by the guard too.
-- If you ever need one, run this in the same transaction first:
--   select set_config('app.ledger_write', 'on', true);
