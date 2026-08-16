-- Enforces one customer record per mobile number at the DB level.
--
-- The admin app already blocks duplicate mobiles at save time
-- (src/services/admin-customers.service.ts: findCustomerByMobile, wired
-- into CustomerForm.tsx), but nothing stopped it in the database, and a
-- handful of duplicates already exist (e.g. two customers sharing
-- "9944351104"). Adding a unique constraint directly would fail against
-- that existing data, so this migration merges duplicates first:
--
--   1. For each mobile number with more than one customer row, keep the
--      oldest row (earliest created_at).
--   2. Repoint any rentals / purchase_requests that reference a newer
--      duplicate onto the kept row, so no rental history is lost.
--   3. Delete the now-unreferenced duplicate customer rows.
--
-- Then a unique index is added so this can't happen again. The app-level
-- check stays in place too — it gives a friendly "already used by X"
-- message before hitting the DB; this constraint is the backstop for
-- concurrent writes.

do $$
declare
  dup record;
  keep_id uuid;
begin
  for dup in
    select mobile
    from customers
    where mobile is not null and mobile <> ''
    group by mobile
    having count(*) > 1
  loop
    select id into keep_id
    from customers
    where mobile = dup.mobile
    order by created_at asc, id asc
    limit 1;

    update rentals
    set customer_id = keep_id
    where customer_id in (
      select id from customers where mobile = dup.mobile and id <> keep_id
    );

    update purchase_requests
    set customer_id = keep_id
    where customer_id in (
      select id from customers where mobile = dup.mobile and id <> keep_id
    );

    delete from customers
    where mobile = dup.mobile and id <> keep_id;
  end loop;
end $$;

drop index if exists customers_mobile_idx;
create unique index if not exists customers_mobile_unique_idx on customers (mobile);
