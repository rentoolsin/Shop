-- Lets one "New rental" submission cover several tools taken by the same
-- customer in one visit. `rentals` stays one-row-per-tool on purpose (each
-- tool is still returned/extended/paid off independently — see
-- 0001_init_schema.sql's comment on why there's no `rental_items` the way
-- enquiries have `enquiry_items`), but rows created together are stamped
-- with the same client-generated `checkout_group_id` purely so the UI can
-- visually group them as one checkout. Nothing about a rental's own
-- lifecycle (status, dates, balance) depends on this column.
alter table rentals
  add column if not exists checkout_group_id uuid;

create index if not exists rentals_checkout_group_id_idx
  on rentals (checkout_group_id)
  where checkout_group_id is not null;

comment on column rentals.checkout_group_id is
  'Groups rentals created together for the same customer in one "New rental" submission (multi-tool checkout). Null for single-tool rentals and for older rows created before this existed. Purely a display grouping — each rental keeps its own independent status/dates/balance.';
