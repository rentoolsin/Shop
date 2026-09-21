-- 0030_ledger_append_only.sql
--
-- Makes the payment history append-only. Ledger entries can be added
-- (record_rental_payment / record_rental_refund / set_rental_advance) but never
-- edited or deleted from the app, so the history is always a true record of
-- what happened. A mistake is corrected by recording an opposite entry
-- (a refund for a payment entered by mistake, or another payment).
--
-- Safe to run more than once.

-- 1. Nobody can write to rental_payments directly any more — admins may only
--    read it. All writes go through the security-definer functions above,
--    which bypass RLS and keep rentals.advance in step.
drop policy if exists "admin full access rental payments" on rental_payments;
drop policy if exists "admin read rental payments" on rental_payments;
create policy "admin read rental payments" on rental_payments
  for select using (is_admin());

-- 2. Removing an entry is no longer an operation.
drop function if exists delete_rental_payment(uuid);
