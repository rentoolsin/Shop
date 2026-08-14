# RenTools Requirements — summary

Full detail originally specified in the master prompt; this is the
working reference for later sessions.

## What RenTools is

Construction tool/equipment rental business, Kovilmedu, Coimbatore, Tamil
Nadu. V1 customers browse and enquire only — no accounts, no checkout, no
online payment. Admin runs actual rentals.

## Core entities

Categories → Products → Product Variants (size/spec + daily rate +
quantity) · Customers (by mobile) · Rentals · Enquiries · Purchase
Requests (when a requested product isn't in stock) · Homepage CMS content.

## Non-negotiables

- Reusable components everywhere — no page-specific duplicates.
- One authoritative rental calculation, enforced at the DB layer, not
  just the frontend (see `BUSINESS-RULES.md`).
- Inventory never oversold — DB-enforced (see the trigger in
  `0001_init_schema.sql`).
- No fake stats, testimonials, prices, or specs anywhere in the UI.
- Mobile-first (320–412px primary), Apple-inspired restraint, own visual
  identity (see `DESIGN-SYSTEM.md`) — explicitly avoiding generic
  AI-gradient/glassmorphism aesthetics.
- Admin edits homepage *content*, never code — CMS not a page builder.
- Locked stack only (see `ARCHITECTURE.md` / `CLAUDE.md`) — no
  alternate backend/framework substitutions.

## Out of scope for V1

Customer accounts, online payment/checkout, native mobile apps.
