-- 0025_purchase_requests_rental_window.sql
-- Public "Request a tool" form (RequestPurchase.tsx) previously had no way
-- to capture how long the person actually needs the out-of-stock tool for.
-- Adds:
--   - number_of_days: how many days they'd like to rent it, once available
--     (same shape as enquiry_items.number_of_days, see 0024).
--   - rent_from / rent_to: the date window they need it for, so RentTools
--     can prioritise outreach around it.
-- All nullable/additive: only populated when the requester picked a
-- specific out-of-stock tool (not a "not listed / general request"), and
-- existing rows are unaffected.

alter table purchase_requests
  add column if not exists number_of_days integer check (number_of_days is null or number_of_days > 0),
  add column if not exists rent_from date,
  add column if not exists rent_to date,
  add constraint purchase_requests_rent_window_check
    check (rent_from is null or rent_to is null or rent_to >= rent_from);
