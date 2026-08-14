# Architecture

## Folders

```
src/
  components/
    ui/         Button, Card, Skeleton, LoadingState, EmptyState,
                ErrorState, StatusBadge, Toast, Modal, BottomSheet
    layout/     MobileHeader, BottomNavigation, PageHeader
    products/   ProductCard (variant/compact/horizontal), CategoryCard
    actions/    CallButton, WhatsAppButton, EnquiryButton
  pages/        One component per route (see docs/ROUTES.md)
  hooks/        useAsyncData (shared fetch-state shape), useProducts,
                useCategories, useScrollLock, useScrollRestoration
  services/     Supabase queries only — no UI, no state
  utils/        rental-calculations.ts (authoritative), currency.ts
  lib/          supabase client, theme provider
  types/        database.ts (hand-written now; regenerate via Supabase CLI
                once a real project is linked)
supabase/
  migrations/   Versioned, append-only SQL
  seed.sql      Dev-only seed data (names only, no invented prices)
```

## Reusable-component rule

Before adding a component, check whether an existing one can be extended
via a prop/variant instead. `ProductCard` and `CategoryCard` are the only
product-display components in the app — no per-page duplicates. Rental
math has one implementation (`utils/rental-calculations.ts`), mirrored (not
duplicated) at the DB layer for enforcement.

## What's NOT built yet

Admin portal (auth, dashboard, rentals workflow, customer search, reports)
does not exist yet — only the public customer-facing app and the DB schema
that will support it. See `project-state/TODO.md`.
