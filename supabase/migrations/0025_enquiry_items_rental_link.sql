-- 0025_enquiry_items_rental_link.sql
-- Per-item conversion tracking for multi-item enquiries. "Convert to
-- Rental" on a multi-item enquiry (see EnquiryDetail.tsx) lets the admin
-- convert one line item at a time, each into its own rental. Previously
-- which items were already converted was only tracked in local component
-- state, so it was lost on refresh/navigation. This column makes it
-- durable: set once a rental is created from that specific item.
--
-- Nullable and set-null-on-delete, matching the existing
-- rentals.enquiry_id link in 0003_rentals_enquiry_link.sql — an item is
-- never blocked from being deleted by a rental pointing at it, and a
-- rental is unaffected if the enquiry_items row it came from is later
-- removed.

alter table enquiry_items
  add column if not exists rental_id uuid references rentals (id) on delete set null;

create index if not exists enquiry_items_rental_id_idx on enquiry_items (rental_id);
