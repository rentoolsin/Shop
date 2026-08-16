-- Adds an optional second/alternate mobile number for a customer.
-- Unlike `mobile`, this is not unique and not required — it's just an
-- extra contact number (e.g. a family member's or a landline).

alter table customers add column if not exists alt_mobile text;
