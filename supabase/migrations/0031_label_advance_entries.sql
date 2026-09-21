-- 0031_label_advance_entries.sql
--
-- Gives payment-history entries plain, meaningful labels.
--
-- 1. The catch-up rows 0029 created for money that was recorded before the
--    payment history existed were labelled "Opening balance (recorded before
--    the payment ledger)". In practice that money is the advance taken from
--    the customer, so it now says so.
-- 2. Advance changes made from Extend rental are labelled "Advance added" /
--    "Advance reduced: <reason>" instead of "Corrected via Edit rental"
--    (Edit no longer has a typed amount box).
--
-- Only the note text changes — amounts, dates, kinds and rentals.advance are
-- untouched. Safe to run more than once. (Runs as the table owner, so it is
-- not affected by the read-only policy from 0030.)

update rental_payments
set notes = 'Advance received'
where notes = 'Opening balance (recorded before the payment ledger)';

create or replace function set_rental_advance(
  p_rental_id uuid, p_new_total numeric, p_reason text default null
) returns void
language plpgsql security definer set search_path = public as $$
declare v_current numeric; v_reason text;
begin
  if not is_admin() then raise exception 'Only admins can change rental payments'; end if;
  if p_new_total is null or p_new_total < 0 then raise exception 'Advance cannot be negative'; end if;

  select advance into v_current from rentals where id = p_rental_id for update;
  if not found then raise exception 'Rental % not found', p_rental_id; end if;

  v_reason := nullif(trim(p_reason), '');

  if p_new_total > v_current then
    perform record_rental_payment(
      p_rental_id, p_new_total - v_current, current_date, 'other',
      'Advance added' || coalesce(': ' || v_reason, '')
    );
  elsif p_new_total < v_current then
    if v_reason is null then
      raise exception 'A reason is required when lowering the amount received';
    end if;
    perform record_rental_refund(
      p_rental_id, v_current - p_new_total, current_date, 'other',
      'Advance reduced: ' || v_reason
    );
  end if;
end $$;
