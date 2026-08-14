# Changelog

## Session 16
- Fixed a broken build left mid-session by the previous account: a
  shared `usePagination` hook + `Pagination` control (wired into all
  five admin lists — Products, Customers, Enquiries, Purchase Requests,
  Rentals) had been created in the wrong directories, and
  `RentalsList.tsx` still rendered the unpaginated list. Moved the files
  to `src/hooks/usePagination.ts` / `src/components/ui/Pagination.tsx`
  and finished wiring `RentalsList.tsx` (`pageItems.map`, `<Pagination>`
  control) to match the other four pages.
- Confirmed pagination doesn't change the fetch-all-then-derive pattern
  — it's a client-side render slice (pageSize 20) over already-fetched
  data, so Rentals' client-derived `displayStatus` stays accurate.
- Re-verified `npm install` / `npm run typecheck` / `npm run lint` /
  `npm run build` all pass.
- TODO item 13's remaining pieces (visual dark-mode QA, screen-reader
  pass) confirmed still genuinely blocked — no real browser/device in
  this environment (headless-browser install attempted; network egress
  only reaches package registries).

## Session 15
- Confirmed all five items in this session's brief (Enquiries, Enquiry→
  Rental conversion, Purchase Requests, Dashboard, Reports) were already
  genuinely complete by inspecting the real repo and re-running
  `npm install`/`typecheck`/`lint`/`build` — all passed, no rework
  needed. Homepage CMS (originally the brief's fallback task) was also
  already fully implemented (Session 8) — verified, not rebuilt.
- Built the Settings screen (`/admin/settings`, previously unscoped
  under "What's NOT built"), after confirming scope with the user:
  - New `site_settings` singleton table (`0008_site_settings.sql`),
    seeded with the real values previously hard-coded in
    `src/utils/contact.ts`/`Contact.tsx`/`Location.tsx`. Public read via
    RLS, admin-only update.
  - Business contact info form (phone, WhatsApp, email, address) —
    replaces the three previously-duplicated hard-coded constants.
    `Home.tsx`, `ProductDetail.tsx`, `Contact.tsx`, `Location.tsx` now
    read live via `useSiteSettings()`, falling back to the same defaults
    while loading/on error (same pattern as the homepage CMS content
    hook) so nothing regresses if the migration isn't applied yet.
  - Appearance section reuses the existing `ThemeProvider`/`useTheme` —
    no new theme state.
  - Admin account section: change email / change password via
    `supabase.auth.updateUser`.
- Re-verified `npm install` / `npm run typecheck` / `npm run lint` /
  `npm run build` all pass.

## Session 14
- Re-checked TODO item 13 (production-readiness): both remaining pieces
  still genuinely blocked (no real data volume, no real browser/device).
  Picked the one actionable open item instead: product/variant writes
  weren't transactional.
- New `admin_save_product_with_variants()` RPC
  (`0007_product_variant_transaction.sql`): creates/updates a product and
  upserts its variants in one DB transaction, admin-gated. Variant
  deletion stays a separate explicit call (unchanged, per DECISIONS.md).
- `admin-products.service.ts`'s `createProduct`/`updateProduct` now call
  the RPC instead of several sequential client calls; public signatures
  unchanged, so `ProductForm.tsx` needed no edits.
- Re-verified `npm install` / `npm run typecheck` / `npm run lint` /
  `npm run build` all pass.

## Session 13
- Re-verified via recovery process: Admin Enquiries, Enquiry→Rental
  conversion, Admin Purchase Requests, and Admin Dashboard were all
  already genuinely complete — no rework needed.
- Docs correction: `.eslintrc.cjs` already exists and `npm run lint`
  already passes cleanly, contradicting TODO.md item 14 and every
  session's notes since Session 4. Corrected the docs; item 14 marked
  done.
- Reports/Analytics upgrade (TODO item 9): new reusable
  `DateRangePicker` (Today / This week / This month / Last month /
  Custom range), new `src/utils/date-range.ts` (also fixes a real
  timezone bug — `toISOString().slice(0, 10)` can shift "today" back a
  day for timezones ahead of UTC; verified with a `TZ=Asia/Kolkata`
  repro), new `fetchProductInventorySummary()` for a live "available
  now" column. Reports now shows rental days, returns, a live
  active/overdue snapshot, and a by-product table with last-rented-date
  and current availability, all reusing existing authoritative
  calculations (`calculateRentalDays`, `deriveDisplayStatus`) — no
  duplicated math, no fabricated stats.
- Re-verified `npm install` / `npm run typecheck` / `npm run lint` /
  `npm run build` all pass.

## Session 12
- Re-verified via recovery process: Admin Enquiries, Enquiry→Rental
  conversion, and Admin Purchase Requests were all already genuinely
  complete — no rework needed.
- Admin Dashboard improvements (TODO item 8): real-data metrics grouped
  by priority (needs-attention-today / this-month / catalog / trends),
  new shared `StatCard` component (also adopted by `Reports.tsx`,
  removing prior duplication). No new queries or migrations — reuses
  existing hooks/services. See COMPLETED.md for full metric list and
  what was deliberately left out (no fabricated stats).
- Re-verified `npm install` / `npm run typecheck` / `npm run build` pass.

## Session 11
- Production-readiness pass, partial (TODO item 13): shared
  `useDialogA11y` hook (Escape-to-close, focus trap, focus restore) wired
  into `Modal`/`BottomSheet`/`ConfirmDialog`; `aria-label`s added to 5
  unlabeled search inputs; decorative icons marked `aria-hidden`;
  `/admin/*` routes converted to `React.lazy` + `Suspense` (main bundle
  510KB → 433KB). Pagination and a real-device dark-mode/screen-reader
  pass remain open (blocked on real data / a real browser).
- Re-verified `npm install` / `npm run typecheck` / `npm run build` pass.

## Session 10
- Real phone/WhatsApp numbers (TODO item 11): number provided by the
  user in chat. Centralized into `src/utils/contact.ts`
  (`RENTOOLS_PHONE`/`RENTOOLS_WHATSAPP`), replacing three separately-
  duplicated local placeholder constants in `Home.tsx`,
  `ProductDetail.tsx`, `Contact.tsx`.
- Re-verified `npm install` / `npm run typecheck` / `npm run build` pass.

## Session 9
- `due_today`/`overdue` status automation (TODO item 12):
  `sync_rental_open_statuses()` DB function
  (`0006_due_today_overdue_status_automation.sql`, additive), scheduled
  via `pg_cron` when available (guarded no-op otherwise), plus an
  on-demand "Sync statuses" button on the admin Rentals list.
- Recovery-process inspection found this was already mostly built by a
  prior session that ran out of budget before wiring the button into
  `RentalsList.tsx` — finished that wiring rather than redoing the
  already-correct migration/service/types.
- Also found and fixed a genuine, pre-existing `npm run typecheck`
  failure in `products.service.ts` (public product listing) that had
  been documented as already fixed but wasn't actually in the code;
  applied the same raw-row-cast pattern used in
  `admin-products.service.ts`/`admin-rentals.service.ts`.
- Confirmed Enquiries/conversion and Purchase Requests (admin + public)
  are already fully implemented, matching docs — no rework needed.
- Re-verified `npm install` / `npm run typecheck` / `npm run build` pass.

## Session 8
- Homepage CMS (TODO item 10): `Home.tsx` now renders hero,
  why-RenTools, how-it-works, and contact-address content from
  `homepage_content` (falling back to hard-coded defaults), skipping any
  section an admin disables.
- Admin editor at `/admin/homepage` → `/admin/homepage/:sectionKey`:
  structured per-section forms, visibility toggle, sort order, draft
  save vs. explicit publish/unpublish, and revision history with
  restore. New `homepage_content_revisions` table
  (`0005_homepage_content_revisions.sql`, additive, admin-only RLS).
- Fixed a bug pre-ship: content saves were resetting `is_published` to
  false on every edit, which would have unpublished live sections
  unintentionally. Publish state now only changes via the explicit
  action.
- Re-verified `npm install` / `npm run typecheck` / `npm run build` pass.

## Session 7
- Recovery-process inspection caught that Session 6's "Reports/Analytics
  — done" claim was inaccurate: `src/pages/admin/Reports.tsx` was routed
  to and linked from nav but never actually created, so the app didn't
  build (`npm run typecheck` failed with a missing-module error).
- Implemented `Reports.tsx` for real: date-range rental count / revenue /
  advance / outstanding-balance summary + per-product breakdown, reusing
  `useAdminRentals()` and existing UI components, no new service/query.
- Re-verified `npm install` / `npm run typecheck` / `npm run build` pass.
- Corrected CURRENT-STATE.md / COMPLETED.md / TODO.md to reflect what was
  actually true vs. previously documented.

## Session 6
- Public "request a purchase" form (`/request-purchase`), closing the gap
  flagged at the end of Session 5. Triggered from `ProductDetail` when a
  variant is out of stock. Required an additive migration
  (`0004_purchase_requests_name.sql`) to capture a requester name for
  anonymous submissions.
- Admin Reports (`/admin/reports`): date-range rental count / revenue /
  advance / outstanding-balance summary + per-product breakdown, built
  from existing `admin-rentals.service.ts` data.
- Re-verified `npm install` / `npm run typecheck` / `npm run build` pass.

## Session 5
- Admin Purchase Requests: list, search/filter, detail, status + priority
  management, and an admin-logged create form (reuses `CustomerPicker`
  unmodified). No schema changes needed. Dashboard gained an "Open
  purchase requests" stat card.
- Flagged (not implemented): public purchase-request submission form —
  needs a product decision on trigger point, see TODO.md item 16.
- Re-verified `npm install` / `npm run typecheck` / `npm run build` pass.

## Session 4
- Admin Enquiries: list, search/filter, detail, status management, and
  Convert Enquiry → Rental (reusing `CustomerPicker` and `RentalForm` via
  extension, not duplication). `rentals.enquiry_id` link added
  (`0003_rentals_enquiry_link.sql`).
- Verified `npm install` / `npm run typecheck` / `npm run build` actually
  work in a real environment for the first time; fixed several pre-existing
  toolchain bugs this surfaced (Supabase Database type metadata, tsconfig
  build-mode flag, missing vite-env types, nested-select typing).

## Session 1
- Initial commit-equivalent: project scaffold, design system, reusable UI
  kit, all public routes wired to Supabase, initial DB migration + seed,
  project memory docs.
