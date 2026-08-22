-- 0026_rentals_discount.sql
--
-- Sometimes at return time the shop doesn't collect the full calculated
-- rent (daily_rate * days * quantity) — e.g. rent for 4 days at ₹100/day
-- is ₹400, but only ₹300 is actually taken. That gap is a deliberate
-- waiver, not an unpaid balance still owed by the customer, and it varies
-- rental to rental (no fixed percentage or rule).
--
-- `discount` records that waived amount so `rentals.advance` keeps its
-- existing meaning ("total actually received") while the rental total
-- used for balance math can be reduced by the waiver instead of leaving a
-- phantom "balance due" on a rental that's already closed out.

alter table rentals
  add column if not exists discount numeric(10, 2) not null default 0 check (discount >= 0),
  add column if not exists discount_reason text;

comment on column rentals.discount is
  'Amount waived off the calculated rent (daily_rate * days * quantity), '
  'e.g. given as a goodwill discount at return. Reduces the rental total '
  'used for balance math; rentals.advance is unaffected and still means '
  'total actually received.';
comment on column rentals.discount_reason is
  'Optional free-text note on why a discount was given.';
