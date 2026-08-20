-- 0024_enquiry_items_number_of_days.sql
-- Per-tool rental duration. Previously every line item in a multi-tool
-- enquiry shared a single `enquiries.number_of_days` value, so a person
-- wanting an Excavator for 2 days and a Generator for 5 days had no way to
-- express that. The general enquiry tool picker now collects a
-- `numberOfDays` per line, stored here rather than reused from the parent
-- `enquiries` row.
--
-- Nullable and additive: existing rows (and the cart-checkout flow, which
-- still uses the shared `enquiries.number_of_days` field for now) are
-- unaffected.

alter table enquiry_items
  add column if not exists number_of_days integer check (number_of_days is null or number_of_days > 0);
