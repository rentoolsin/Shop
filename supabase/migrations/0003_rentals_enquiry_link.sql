-- 0003_rentals_enquiry_link.sql
-- Supports Admin Enquiries "Convert to Rental": traceability from a rental
-- back to the enquiry it was created from. Nullable — most rentals are
-- created directly and have no enquiry. on delete set null so an enquiry
-- can never be removed by a rental-side operation and a rental never
-- disappears if enquiry history is pruned later.

alter table rentals
  add column if not exists enquiry_id uuid references enquiries (id) on delete set null;

create index if not exists rentals_enquiry_id_idx on rentals (enquiry_id);
