-- 0004_purchase_requests_name.sql
-- Supports the public "request a purchase" form (TODO.md item 16).
-- purchase_requests previously had no way to capture the requester's name
-- for anonymous public submissions (only customer_id, which admin-logged
-- requests set via CustomerPicker, and mobile). Nullable so it doesn't
-- affect existing admin-logged rows, which continue to resolve display
-- name via the linked customer.

alter table purchase_requests
  add column if not exists name text;
