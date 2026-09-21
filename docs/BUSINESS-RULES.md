# Business Rules

## Rental math (authoritative source: `src/utils/rental-calculations.ts`)

- Rental days are **inclusive**: 13 Aug → 15 Aug = 3 days.
- `Total Rental = Rental Days × Daily Rate × Quantity`
- `Net Rental = Total Rental − Discount` — the discount is a plain amount
  the admin enters (default 0, no fixed rule). It can be given when marking
  a rental returned (added to any earlier discount) or set from Edit rental
  (replaces the stored discount).
- `Balance = Net Rental − Advance`. A negative balance is a refund due.
- Mirrored at the DB layer by `rental_days()` / `rental_total()` in
  `0001_init_schema.sql`. The DB is the enforcement layer; the frontend
  functions are for instant UX feedback only.

## Validation rules

- Return date cannot be before start date.
- Quantity must be > 0.
- Daily rate cannot be negative.
- Advance cannot be negative.
- Discount cannot be negative or more than the calculated rent (Total Rental).
- Advance cannot exceed total (unless explicitly overridden — not yet
  exposed in any UI).

## Payments and refunds

- `advance` is the net amount actually received. A payment adds to it; a
  refund (money given back to the customer) subtracts from it.
- Both are logged as dated entries in the rental's payment history
  (`rental_payments`, `kind` = `payment` | `refund`, amount always positive —
  see `0020_rental_payments.sql` and `0028_rental_refunds.sql`).
- A refund cannot be more than the amount received so far.
- Ledger entries are permanent: they can't be edited or removed from the app
  (`0030_ledger_append_only.sql`). To correct a mistake, record a refund (for
  a payment entered by mistake) or another payment (for a refund entered by
  mistake), so the history always shows what actually happened.
- The payment ledger is the only way money on a rental changes. The DB
  rejects any direct change to `advance` (`0029_single_source_payments.sql`).
  Typing a new value into **Advance received** (Edit / Extend) is turned into
  a dated payment (higher) or refund (lower) via `set_rental_advance`;
  lowering requires a reason.
- An advance entered when a rental is created is logged automatically as
  "Advance at booking".

## Inventory

- Quantity-based per product variant: `quantity_total − quantity_reserved
  = available`.
- Enforced by the `rentals_inventory_trigger` in the DB (not just
  frontend) — inserting/updating a rental into `active` / `due_today` /
  `overdue` status raises an exception if it would exceed availability.
- Returning a rental (status → `returned`/`cancelled`) releases the
  reservation automatically via the same trigger.

## Rental statuses

`active` · `due_today` · `overdue` · `returned` · `cancelled`

`due_today` / `overdue` are meant to be derived automatically from
`return_date` vs. today's date — not yet implemented (needs a scheduled
job or a computed view; see TODO.md).

## Enquiry statuses

`new` · `contacted` · `converted` · `not_available` · `closed`

Enquiry → Rental conversion should carry over name/mobile/product/quantity
without re-entry — not yet implemented (admin portal doesn't exist yet).

## Customers

Looked up by mobile number; selecting an existing customer should
auto-populate their info rather than creating a duplicate — not yet
implemented (no admin UI yet).
