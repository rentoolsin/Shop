-- 0032_rental_number.sql
--
-- Short, sequential rental numbers (RNT-0001, RNT-0002, …) that are easy to
-- say aloud, replacing the reference that used to be derived from the random
-- record id (e.g. RNT-C63CF0D7).
--
-- Existing rentals are numbered in the order they were created. New rentals
-- get the next number automatically. A number never changes and is never
-- reused: if a rental is deleted its number is simply skipped.
--
-- Safe to run more than once.

create sequence if not exists rental_number_seq;

alter table rentals add column if not exists rental_number bigint;

-- Number the rentals that don't have one yet, oldest first.
with ordered as (
  select id,
         coalesce((select max(rental_number) from rentals), 0)
           + row_number() over (order by created_at, id) as n
  from rentals
  where rental_number is null
)
update rentals r set rental_number = o.n from ordered o where r.id = o.id;

-- Next number handed out = highest existing + 1.
select setval('rental_number_seq', coalesce((select max(rental_number) from rentals), 0) + 1, false);

alter table rentals alter column rental_number set default nextval('rental_number_seq');
alter table rentals alter column rental_number set not null;

create unique index if not exists rentals_rental_number_key on rentals (rental_number);

-- The number can't be edited afterwards.
create or replace function rentals_lock_rental_number() returns trigger
language plpgsql as $$
begin
  if new.rental_number is distinct from old.rental_number then
    raise exception 'The rental number cannot be changed';
  end if;
  return new;
end $$;

drop trigger if exists rentals_lock_rental_number on rentals;
create trigger rentals_lock_rental_number
  before update of rental_number on rentals
  for each row execute function rentals_lock_rental_number();
