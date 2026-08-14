# Current State

_Last updated: after Session 15 — Settings screen built (business
contact info, appearance/theme, admin account), after re-confirming the
five items flagged for this session (Enquiries, Enquiry→Rental
conversion, Purchase Requests, Admin Dashboard, Reports) and Homepage
CMS were all already genuinely complete. Before that, Session 14 made
product/variant writes transactional._

## Session 15 — Settings screen + re-verification

Per the recovery process, re-checked this session's five flagged items
(Enquiries, Enquiry→Rental conversion, Purchase Requests, Admin
Dashboard, Reports) against the actual repo — all genuinely complete,
confirmed via `npm install`/`npm run typecheck`/`npm run lint`/
`npm run build`, all passing. Homepage CMS was also independently
verified already fully built (Session 8). No rework needed on any of
these; proceeded to the Settings screen per explicit user direction.

Settings had no prior spec (only listed under "What's NOT built" with no
scope). Confirmed scope with the user before building: business contact
info, appearance/theme, and admin account — not a broader admin-user-
management UI (see DECISIONS.md's existing "no self-service admin
sign-up" choice, which this doesn't change).

- New `supabase/migrations/0008_site_settings.sql`: singleton
  `site_settings` table, seeded with the real values already in use
  (not placeholders). Public read via RLS (business contact info is
  public-facing, same as homepage content), admin-only update.
- `src/utils/site-settings.ts` (shape + defaults, same pattern as
  `homepage-content.ts`), `site-settings.service.ts` (public read),
  `admin-site-settings.service.ts` (admin read + update),
  `useSiteSettings.ts` + `useAdminSiteSettings` (added to the existing
  `useAdminData.ts`).
- Deleted `src/utils/contact.ts`; `Home.tsx`, `ProductDetail.tsx`,
  `Contact.tsx`, `Location.tsx` switched from its hard-coded constants
  (and their own further-duplicated local constants) to
  `useSiteSettings()`, with the same default values as a loading/error
  fallback — same best-effort, never-blank convention already used for
  homepage CMS content, so none of these pages regressed.
- New `src/pages/admin/Settings.tsx` (`/admin/settings`): contact-info
  form with validation, an appearance toggle group built on the existing
  `useTheme()`, and an admin-account section (change email/password via
  `supabase.auth.updateUser`). No new form primitives — built entirely
  from `Input`/`Button`/`LoadingState`/`ErrorState`/`useToast`.
- `AdminLayout.tsx` nav + `App.tsx` route added (lazy-loaded, same
  convention as every other admin route). `docs/ROUTES.md` corrected
  (was still describing Reports/CMS/Settings as "not yet built").
- Verified `npm install` / `npm run typecheck` / `npm run lint` /
  `npm run build` all pass.
- Not verified: the new migration/table against a live Postgres instance
  (no linked Supabase project in this environment, same limitation as
  every other migration here); an actual Supabase confirmation email for
  an email change; the appearance toggle's visual result on a real
  device/browser.

## Session 13 correction (docs vs. actual repo)

Per the recovery process, inspected the repo before starting. Verified
Admin Enquiries, Enquiry→Rental conversion, Admin Purchase Requests, and
the Admin Dashboard (the four items this session was asked to re-check)
are all genuinely complete and match the docs — confirmed by running
`npm install` / `npm run typecheck` / `npm run build`, all of which pass.

One discrepancy found: **`.eslintrc.cjs` already exists in the repo and
`npm run lint` already passes with zero errors/warnings.** TODO.md item
14 and every session's notes back through Session 4 documented lint as
broken ("no configuration file found"). That's no longer true of the
code on disk — someone added a working flat-compatible config at some
point without updating the docs. Corrected below; item 14 is removed
from TODO.md as done.

## What exists

- Project scaffolding: Vite + React + TS + Tailwind, configured per `docs/ARCHITECTURE.md`.
- Design system tokens + global styles (`tailwind.config.ts`, `src/index.css`).
- Theme provider with light/dark/system support and persistence.
- Full reusable UI kit in `src/components/ui`:
  Button, Card, Skeleton, LoadingState, EmptyState, ErrorState, StatusBadge, Toast, Modal, BottomSheet, Input, Textarea, Select, Switch, ConfirmDialog.
- Public routing + all 10 public pages listed in `docs/ROUTES.md`.
- Public pages use live Supabase queries with loading/error/empty states.
- Enquiry form uses shared Input/Textarea components.
- Admin authentication:
  - `src/lib/auth.tsx`
  - Supabase Auth session
  - `admin_users` membership check
  - `/admin/login`
  - `ProtectedRoute`
- Admin Categories:
  - List
  - Create
  - Edit
  - Delete with confirmation
- Admin Products:
  - List
  - Create
  - Edit
  - Delete with confirmation
  - Nested variant management
  - Variant size, rate, quantity and active state
  - Create/update + variant upsert run atomically via the
    `admin_save_product_with_variants` RPC (Session 14,
    `0007_product_variant_transaction.sql`) — was previously several
    sequential, non-transactional client calls. Variant deletion is
    still a separate explicit call (`deleteVariant`), unchanged.
- Admin Customers:
  - List
  - Debounced name/mobile search
  - Create
  - Edit
  - Delete with confirmation
  - `src/services/admin-customers.service.ts`
- Admin Rentals:
  - List
  - Status filter
  - Customer search
  - Create rental
  - Extend rental
  - Mark returned
  - Cancel rental
  - Live rental total/balance calculation
  - Client-side display status for `due_today` / `overdue`
    (`deriveDisplayStatus()`, same-day fallback)
  - DB-side `due_today`/`overdue` automation: `sync_rental_open_statuses()`
    (`0006_due_today_overdue_status_automation.sql`), scheduled via
    `pg_cron` when available, plus an on-demand "Sync statuses" button on
    the Rentals list
  - `src/services/admin-rentals.service.ts`
  - `RentalForm` (`src/pages/admin/rentals/RentalForm.tsx`) now accepts
    optional prefill/behavior props (`enquiryId`, `initialCustomer*`,
    `initialCategoryId`/`initialProductId`/`initialQuantity`/
    `initialStartDate`/`initialReturnDate`, `title`, `submitLabel`,
    `onCreated`, `onCancel`) — added Session 4 so enquiry → rental
    conversion reuses the exact same form instead of a duplicate. Default
    (no props) behavior is unchanged.
  - `rentals.enquiry_id` (nullable FK, added Session 4) traces a rental
    back to the enquiry it was converted from, if any.
- `CustomerPicker`:
  - Reusable admin component
  - Search by mobile
  - Select existing customer
  - Create customer inline
  - `initialQuery`/`initialName` props (added Session 4) let a caller
    pre-search/pre-fill from known contact info — used by enquiry → rental
    conversion, extended rather than duplicated
- Rental calculations:
  - Centralized in `rental-calculations.ts`
  - Inclusive rental-day calculation
  - Total and balance calculation
  - `deriveDisplayStatus()`
- Admin Dashboard (extended Session 12, real Supabase-derived metrics
  only, grouped by priority):
  - Needs attention today: Due today, Overdue (both via the shared
    `deriveDisplayStatus()`), New enquiries, Open purchase requests
  - This month: Active rentals, Outstanding balance, Rentals this month,
    Revenue this month
  - Catalog: Customers, Products, Categories
  - Trends: Most rented this month / Most requested unavailable products
    (top-3 ranked lists, no charts)
  - Shared `src/components/ui/StatCard.tsx` (new) used by both Dashboard
    and Reports — replaces the previously Dashboard-local stat card and
    Reports' separately-duplicated inline markup
  - Deliberately not built: "today's income" (no dated payment ledger —
    `advance` is a mutable column, not a transaction log — see
    COMPLETED.md) and product utilization / rental-days aggregates
    (need per-variant reserved-vs-total inventory querying; left for a
    future Reports enhancement, not a Dashboard glance metric)
  - All metrics reuse existing hooks/services (`useAdminRentals`,
    `useAdminEnquiries`, `useAdminPurchaseRequests`, etc.) — no new
    queries or migrations; matches the fetch-all-then-derive-client-side
    pattern `Reports.tsx` already established at this project's volume
- Admin navigation:
  - Dashboard
  - Enquiries
  - Purchase Requests
  - Products
  - Categories
  - Reports
  - Homepage
  - Rentals
  - Customers
  - Settings
- Admin Enquiries:
  - `src/services/admin-enquiries.service.ts`
  - List, newest first, joined with linked product name
  - Client-side search (name / mobile / product) and status filter
  - Detail view with all submitted fields
  - Status management (New, Contacted, Converted to Rental, Not Available, Closed)
  - Convert to Rental:
    - Reuses `RentalForm` inline (extended with prefill props, not duplicated)
    - Reuses `CustomerPicker` (extended with `initialQuery`/`initialName`, not duplicated)
    - Reuses `rental-calculations.ts` and existing validation as-is
    - Pre-fills category/product (via the enquiry's linked product, if any),
      quantity, start date and computed return date (required_date + number_of_days)
    - On successful rental creation: updates the enquiry's status to
      "Converted to Rental" and preserves the original enquiry record
    - `rentals.enquiry_id` (nullable FK, `0003_rentals_enquiry_link.sql`)
      links the created rental back to its source enquiry
    - If the rental is created but the status update fails, the admin is
      told explicitly to set the status by hand rather than the flow
      silently reporting success
- Admin Purchase Requests:
  - `src/services/admin-purchase-requests.service.ts`
  - List, newest first, joined with linked customer name
  - Client-side search (product / customer name / mobile) and status
    filter (Requested / Sourcing / Fulfilled / Declined)
  - Detail view with independent status and priority (Low/Normal/High)
    management
  - Create form (`/admin/purchase-requests/new`) for admin-logged requests
    — reuses `CustomerPicker` unmodified (customer is required, same
    contract as `RentalForm`)
  - Public submission: `/request-purchase` (`RequestPurchase.tsx`),
    triggered from `ProductDetail` when a variant has 0 available
    quantity. Separate `purchase-requests.service.ts` (public,
    insert-only) from `admin-purchase-requests.service.ts` (admin CRUD),
    mirroring the enquiries public/admin service split. Required
    `0004_purchase_requests_name.sql` (nullable `name` column, since
    anonymous submissions have no linked customer to resolve a name from)
- Admin Reports (rebuilt Session 13, see below for what changed):
  - `src/pages/admin/Reports.tsx`
  - Reusable `src/components/ui/DateRangePicker.tsx`: preset selector
    (Today / This week / This month / Last month / Custom range) built on
    the existing `Select`/`Input`; custom range shows two date inputs with
    `min`/`max` cross-constraints plus an explicit "start after end"
    validation message.
  - New `src/utils/date-range.ts`: single source of truth for
    today/this-week/this-month/last-month range resolution, all derived
    from the browser's LOCAL Y/M/D (`toLocalISODate`), not
    `date.toISOString().slice(0, 10)`. `Dashboard.tsx` was also switched
    to import `todayISO`/`startOfMonthISO` from here instead of its own
    locally-duplicated copies. See "Session 13" below for why this
    mattered.
  - Range summary stat cards: Rentals, Rental days (Σ
    `calculateRentalDays() × quantity`, the same authoritative day-count
    function `rental-calculations.ts` already used for pricing — not
    reimplemented), Revenue, Advance collected, Outstanding balance,
    Returns (rentals with `status = returned` and `actualReturnDate`
    inside the selected range).
  - "Current status" mini-section: Active rentals / Overdue rentals — a
    live, range-independent snapshot via the same `deriveDisplayStatus()`
    used by the Rentals list and Dashboard (not a second implementation).
  - By-product table, scoped to the selected range: rental count, rental
    days, revenue, outstanding, last rented date (max `startDate` for
    that product within the range), and "Available now" (current
    capacity/availability, NOT range-scoped — see
    `fetchProductInventorySummary` below).
  - New `fetchProductInventorySummary()` in
    `admin-products.service.ts` (+`useAdminProductInventory` hook): one
    query, `products.name` + `product_variants(quantity_total,
    quantity_reserved, is_active)`, summed per product over active
    variants only. Reads the DB's own live `quantity_reserved` (maintained
    by the existing inventory trigger) rather than recomputing
    reservations client-side. Keyed by product name to match the existing
    rentals-by-product grouping convention (rentals only join through to a
    product name, not a product id).
  - All-time totals (unfiltered by range) were deliberately NOT added as a
    separate view — "This month"/"Last month" presets already cover the
    common cases, and an unbounded fetch-all-then-aggregate view isn't
    meaningfully different at this project's data volume from just
    selecting a wide custom range.
  - Empty/insufficient-data states: an invalid custom range (start after
    end) shows an explicit `EmptyState`, not a broken/negative report; an
    empty result set within a valid range shows "No rentals in range"
    rather than a table of zeros.
  - Scope note (carried over): the external spec section TODO.md's
    Reports item originally referenced isn't in this repo — see "Known
    limitations".
- Admin Settings (`/admin/settings`, Session 15):
  - Business contact info form (phone, WhatsApp, email, address),
    backed by a new `site_settings` singleton table — replaces the
    phone/WhatsApp/email/address values previously hard-coded and
    duplicated across `src/utils/contact.ts` (deleted), `Contact.tsx`,
    and `Location.tsx`. `Home.tsx`, `ProductDetail.tsx`, `Contact.tsx`,
    `Location.tsx` all read this live via `useSiteSettings()`, falling
    back to the same real default values while loading/on error.
  - Appearance: light/dark/system toggle built directly on the existing
    `useTheme()` provider — no new theme state.
  - Admin account: change email / change password via
    `supabase.auth.updateUser` directly — no self-service admin
    *creation* here, consistent with the existing "no self-service admin
    sign-up" decision.

## Session 13 — Reports/Analytics upgrade + docs correction

- Confirmed via `npm install`/`typecheck`/`build`/`lint` that Enquiries,
  Enquiry→Rental conversion, Purchase Requests, and the Dashboard (the
  four items flagged for re-verification) are genuinely complete — no
  rework needed, proceeded to Reports/Analytics.
- Found and corrected a real docs-vs-code gap: `.eslintrc.cjs` exists and
  `npm run lint` passes cleanly, contradicting TODO.md item 14 and every
  prior session's notes claiming it was broken. Not fixed *by* this
  session — already fixed in the code, just never reflected in the docs.
- Found and fixed a genuine (if minor) pre-existing bug while building the
  date-range picker: `Dashboard.tsx` and the old `Reports.tsx` each
  independently computed "today" / "start of month" via
  `new Date(...).toISOString().slice(0, 10)`. `toISOString()` converts to
  UTC first, so for any timezone ahead of UTC (e.g. IST, UTC+5:30) a local
  midnight can serialize as the *previous calendar day* — verified with a
  `TZ=Asia/Kolkata` repro: local Aug 14 00:30 produced `"2026-08-13"` via
  the old method vs. the correct `"2026-08-14"` via local Y/M/D
  components. Centralized into `src/utils/date-range.ts`
  (`toLocalISODate`/`todayISO`/`startOfMonthISO`/etc.) and pointed both
  Dashboard and Reports at the shared version — fixes the bug and removes
  the pre-existing duplication in one move.
- `npm install` — succeeds (already installed).
- `npm run typecheck` (`tsc -b`) — passes with zero errors.
- `npm run lint` — passes with zero errors/warnings.
- `npm run build` (`tsc -b && vite build`) — succeeds, produces `dist/`.
- Not verified: the new report metrics and "Available now" column against
  real Supabase data (no live project in this environment) — checked by
  reading the derivation logic and confirming loading/empty/invalid-range
  states render sensibly against undefined/empty synthetic data.
- Homepage CMS:
  - `src/utils/homepage-content.ts` — authoritative fixed set of section
    keys (`hero`, `why_rentools`, `how_it_works`, `contact_location`),
    their content shapes, and hard-coded defaults. Both the public Home
    page and the admin editor import from this single source, so the
    "known sections" list only exists once.
  - `src/services/homepage-content.service.ts` (public): resolves what
    Home.tsx should render per section — the published `homepage_content`
    row's content if one exists and is enabled, else the built-in
    default. A disabled section is returned as "hidden" so Home.tsx skips
    rendering it entirely; nothing ever renders blank/broken while a
    section is in draft or has never been touched in Admin.
  - `src/services/admin-homepage-content.service.ts` (admin): lists all
    four known sections (merging real rows with defaults for
    never-edited ones), saves content/enabled/sort-order as a draft
    (does not change publish state), and separately publishes/unpublishes
    via `is_published`. Every content save snapshots the content that was
    live immediately before the write into
    `homepage_content_revisions` (new table, see migration below).
  - `supabase/migrations/0005_homepage_content_revisions.sql`: additive
    migration adding `homepage_content_revisions` (section_key FK,
    content jsonb, created_at), admin-only RLS, matching every other
    admin-managed table's policy pattern. Not yet applied to a live DB
    (see "Known limitations").
  - Admin: `/admin/homepage` (list, shows Published/Draft/Hidden badges
    per section) → `/admin/homepage/:sectionKey` (structured edit form
    per section — text fields for hero/contact, add/remove rows for the
    why-RenTools points list and how-it-works steps; a visible toggle; a
    sort-order field; Save draft / Publish-Unpublish; a revision-history
    list with Restore, gated by a confirm dialog).
  - Public: `Home.tsx` now renders `cms.hero`, `cms.why_rentools`,
    `cms.how_it_works`, `cms.contact_location` instead of hard-coded JSX,
    and skips any section flagged hidden. Phone/WhatsApp numbers are
    intentionally NOT part of this CMS scope — those stay the
    `RENTOOLS_PHONE`/`RENTOOLS_WHATSAPP` placeholders, tracked separately
    as TODO item 11 ("real phone/WhatsApp numbers").
  - Editing a published section's content does **not** silently unpublish
    it — publish state only changes via the explicit Publish/Unpublish
    button. (Caught and fixed during this session before it shipped —
    an earlier draft of the service reset `is_published: false` on every
    content save.)
- Database:
  - `supabase/migrations/0001_init_schema.sql`
  - Categories
  - Products
  - Product variants
  - Customers
  - Rentals
  - Enquiries
  - Purchase requests
  - Homepage content
  - RLS
  - Inventory-enforcement trigger
  - `0007_product_variant_transaction.sql` (Session 14):
    `admin_save_product_with_variants()` RPC — atomic product
    create/update + variant upsert, admin-gated, security definer.
  - `0008_site_settings.sql` (Session 15): singleton `site_settings`
    table — business phone/WhatsApp/email/address, public read, admin
    update.
- `0002_admin_seed_notes.sql` documents first-admin setup.
- `supabase/seed.sql` contains development seed data.
- Project memory documentation exists under `project-state/` and `docs/`.

## Current implementation status

### Completed

- Project foundation
- Public customer experience
- Reusable UI foundation
- Theme system
- Admin authentication
- Categories CRUD
- Products CRUD
- Product variants
- Customers CRUD
- Rentals workflow
- Rental extension
- Rental return
- Rental cancellation
- Admin dashboard with real-data metrics (needs-attention-today,
  this-month, catalog, trends sections)
- Admin Enquiries list + search/filter + detail + status management
- Enquiry → Rental conversion
- Admin Purchase Requests list + search/filter + detail + status/priority
  management + admin-logged create form
- Public "request a purchase" submission form
- Admin Reports (date-range presets + custom range, rental/rental-day/
  revenue/advance/outstanding/returns summary, live active/overdue
  snapshot, by-product breakdown with last-rented-date and current
  availability)
- Homepage CMS: wired to `homepage_content`, admin editor with
  draft/publish/revision history
- `due_today`/`overdue` status automation (DB function + pg_cron +
  on-demand admin sync)
- Real phone/WhatsApp numbers, centralized (Session 10, then moved from
  a hard-coded file to the DB-backed `site_settings` table in Session 15)
- Production-readiness pass (partial, TODO item 13): dialog
  accessibility (`useDialogA11y` — Escape to close, focus trap, focus
  restore, shared by Modal/BottomSheet/ConfirmDialog), aria-labels on
  previously-unlabeled search inputs, `aria-hidden` on decorative icons,
  and route-level code-splitting (admin routes lazy-loaded, separate
  from the public customer bundle)
- `npm run lint` (item 14 — corrected Session 13; was already true of
  the code, docs just hadn't caught up)
- Product/variant create/update writes are transactional (Session 14,
  `admin_save_product_with_variants` RPC) — closes the "smaller
  follow-up" flagged since early sessions
- Settings screen (Session 15): `/admin/settings` — business contact
  info (now DB-driven via `site_settings`), appearance/theme toggle, and
  admin account (email/password change)

### Next implementation

Reports/Analytics, Homepage CMS, `due_today`/`overdue` automation, real
contact numbers, the Admin Dashboard (item 8), lint (item 14), the
product/variant transaction follow-up, and the Settings screen (item 18)
are now genuinely complete (see above). TODO item 13 (production-
readiness) is partially done — its two remaining pieces (pagination/
virtualization, visual dark-mode/screen-reader QA) are genuinely blocked
in this environment (no real data volume, no real browser/device) and
were re-confirmed as still blocked in Session 14. No other "smaller
follow-ups" remain open — the rest were already resolved or intentional
(see TODO.md's bottom section).

## What's NOT built

- Pagination/virtualization for admin lists (blocked on real data
  volume — see TODO.md items 15/17)
- Visual dark-mode QA and a full screen-reader pass on a real
  device/browser (code-level checks only so far — see "Known
  limitations")

## Known limitations

- No real Supabase project is linked yet — `0003_rentals_enquiry_link.sql`,
  `0005_homepage_content_revisions.sql`,
  `0006_due_today_overdue_status_automation.sql`,
  `0007_product_variant_transaction.sql`, and `0008_site_settings.sql`
  have not been applied to any live database (file-only, additive,
  reviewed for correctness, not yet run against Postgres). The
  `pg_cron` schedule in `0006` is also unverified — it's wrapped so the
  migration applies cleanly whether or not `pg_cron` is enabled on the
  project, but which branch actually fires can only be confirmed against
  a real project.
- Rental creation relies on the database inventory trigger rather than a
  client-side availability pre-check.
- `due_today` / `overdue` are now written back to `rentals.status` by
  `sync_rental_open_statuses()` (`0006_due_today_overdue_status_
  automation.sql`), run via `pg_cron` when the extension is available or
  on-demand from the admin Rentals list's "Sync statuses" button.
  `deriveDisplayStatus()` remains in the frontend as a same-day fallback
  for the gap between a return date changing and the next sync.
- Enquiries list/search is entirely client-side (fetches all rows, then
  filters/searches in the browser) — fine at current expected volume,
  revisit (server-side search, like `admin-customers.service.ts` already
  does) once enquiry volume grows.
- Homepage CMS revision history is capped at the 20 most recent snapshots
  per section (`fetchHomepageRevisions`'s `.limit(20)`) — older ones stay
  in the table but aren't fetched; revisit if that's ever actually needed.
- Homepage CMS has no image/media fields yet — all four sections
  (`hero`, `why_rentools`, `how_it_works`, `contact_location`) are text
  only, matching what Home.tsx actually renders today. Categories/
  products/featured-tools sections stay DB-driven as before, not part of
  this CMS (they already have their own admin CRUD).
- `npm run lint` — passes (`.eslintrc.cjs` exists and is configured; see
  Session 13 note above — this had been mis-documented as broken since
  Session 4, corrected this session after actually running it).
- Business contact info (`site_settings`, Session 15) is public-read —
  same trust model as homepage content; there is no need for a public
  page to go through an authenticated call to see the phone number.
  Public pages fall back to the same hard-coded defaults while loading
  or if the table/migration isn't available yet, so nothing breaks
  before Supabase is linked.

## Verification status

**Session 15 (this session):** Re-verified the five items flagged for
this session (Enquiries, Enquiry→Rental conversion, Purchase Requests,
Admin Dashboard, Reports) and Homepage CMS — all already genuinely
complete, no rework needed. Built the Settings screen.

- New `site_settings` singleton table (`0008_site_settings.sql`), public
  read / admin update via RLS.
- New `/admin/settings`: business contact info form, appearance toggle
  (built on the existing `useTheme`), admin account (email/password
  change via `supabase.auth.updateUser`).
- `Home.tsx`/`ProductDetail.tsx`/`Contact.tsx`/`Location.tsx` switched
  from hard-coded contact constants to `useSiteSettings()` with the same
  defaults as a loading/error fallback.
- `npm install` — succeeds (already installed).
- `npm run typecheck` (`tsc -b`) — passes with zero errors.
- `npm run lint` — passes with zero errors/warnings.
- `npm run build` (`tsc -b && vite build`) — succeeds, produces `dist/`.
- Not verified: the migration/table against a live Postgres instance —
  no linked Supabase project in this environment. Reviewed for
  correctness against the existing `is_admin()`/RLS pattern instead. Also
  not verified: an actual Supabase confirmation email for an email
  change, or the appearance toggle on a real device/browser.

**Session 14:** Product/variant transactional writes,
after re-confirming TODO item 13's remaining pieces (pagination, visual
dark-mode/screen-reader QA) are still genuinely blocked in this
environment — no rework attempted there since nothing changed.

- New `admin_save_product_with_variants()` RPC
  (`0007_product_variant_transaction.sql`) — atomic product
  create/update + variant upsert, admin-gated via `is_admin()`.
- `admin-products.service.ts`'s `createProduct`/`updateProduct` rewritten
  to call the RPC; public signatures unchanged, `ProductForm.tsx` needed
  no edits.
- `types/database.ts`: added the `admin_save_product_with_variants`
  Functions entry.
- `npm install` — succeeds (already installed).
- `npm run typecheck` (`tsc -b`) — passes with zero errors.
- `npm run lint` — passes with zero errors/warnings.
- `npm run build` (`tsc -b && vite build`) — succeeds, produces `dist/`.
- Not verified: the migration/RPC against a live Postgres instance — no
  linked Supabase project in this environment (same limitation as every
  other migration here). Reviewed for correctness against the existing
  schema/constraints/RLS instead.

**Session 13:** Reports/Analytics upgrade (date-range
presets, extended metrics, by-product rental days/last-rented/
availability), after re-verifying Enquiries/conversion/Purchase
Requests/Dashboard were already genuinely complete. See "Session 13"
under Admin Reports above for the full list, plus the lint-docs
correction and the local-date timezone bug fix.

- `npm install` — succeeds (already installed).
- `npm run typecheck` (`tsc -b`) — passes with zero errors.
- `npm run lint` — passes with zero errors/warnings (corrected docs; see
  above — this was already true of the code, not newly fixed).
- `npm run build` (`tsc -b && vite build`) — succeeds, produces `dist/`.
- Not verified: real Supabase data for the new report metrics/inventory
  query (no live project in this environment).

**Session 12:** Admin Dashboard improvements (TODO item
8), after re-verifying Enquiries/conversion/Purchase Requests were
already genuinely complete (no rework needed).

- New `src/components/ui/StatCard.tsx`, adopted by both `Dashboard.tsx`
  and `Reports.tsx` (previously separate/duplicated stat-card markup).
- `Dashboard.tsx`: due-today/overdue/outstanding-balance/monthly-
  rentals/monthly-revenue/top-rented-products/most-requested-unavailable-
  products, all derived from existing hooks/services, no new queries.
- `npm install` — succeeds.
- `npm run typecheck` (`tsc -b`) — passes with zero errors.
- `npm run build` (`tsc -b && vite build`) — succeeds, produces `dist/`.
- `npm run lint` — still fails, same pre-existing missing-ESLint-config
  issue (item 14, unrelated, not touched).
- Not verified: the dashboard against real Supabase data (no live
  project in this environment) — checked by reading the derivation logic
  and confirming loading/empty states render sensibly with zero/loading
  data instead of fabricated numbers.

**Session 11:** production-readiness pass (TODO item 13,
partial) — accessibility fixes and route-level code-splitting.

- New `src/hooks/useDialogA11y.ts`: Escape-to-close, Tab/Shift+Tab focus
  trap, and focus restore-on-close for overlay dialogs. Wired into
  `Modal` and `BottomSheet`; `ConfirmDialog` gets it for free since it's
  built on `Modal` (no duplicated dialog logic).
- Added `aria-label` to 5 search `<input>`s that previously relied on
  placeholder text alone (admin Rentals/Customers/Enquiries/Purchase
  Requests lists, public Search page); added `aria-hidden="true"` to
  their decorative search-icon SVGs.
- `App.tsx`: all `/admin/*` route components (including `AdminLayout`)
  converted to `React.lazy` + a single top-level `Suspense` (fallback:
  existing `LoadingState`), so the public customer bundle no longer
  ships admin form/table/report code. Main JS bundle: 510KB → 433KB
  (gzip 138.78KB → 124.38KB), plus ~25 small per-route admin chunks
  (1–8KB each) loaded on demand. The `(!) chunk too large` build warning
  is gone.
- Did a code-level dark-mode audit (grep for light-only color utility
  classes without an adjacent `dark:` variant) across all of `src/` —
  found no real gaps (only false positives from multi-line class-string
  literals). Explicitly **not** a substitute for visually checking dark
  mode on a real device/browser — still open, see "What's NOT built".
- Pagination/virtualization for admin lists intentionally not attempted
  this session — genuinely blocked on real data volume, per this TODO
  item's own wording (items 15/17 make the same point for
  Enquiries/Purchase Requests search).
- `npm install` — succeeds (already installed).
- `npm run typecheck` (`tsc -b`) — passes with zero errors.
- `npm run build` (`tsc -b && vite build`) — succeeds, produces `dist/`
  with the new chunk split described above.
- `npm run lint` — still fails, same pre-existing missing-ESLint-config
  issue (item 14, unrelated).
- Not verified: an actual screen reader, and dark mode / focus-trap
  behavior on a real device or browser — this environment has no
  browser to exercise either against.

**Session 10:** implemented TODO item 11 (real
phone/WhatsApp numbers), provided directly by the user in chat. Added
`src/utils/contact.ts` as a single source of truth (`RENTOOLS_PHONE`,
`RENTOOLS_WHATSAPP`) and pointed `Home.tsx`, `ProductDetail.tsx`, and
`Contact.tsx` at it, replacing the three separately-duplicated local
placeholder constants (`+91XXXXXXXXXX` / `91XXXXXXXXXX`) rather than
just swapping the string in each file — consistent with the project's
no-duplication rule. `RENTOOLS_EMAIL` in `Contact.tsx` was untouched
(out of scope for this item; no real email was requested or provided).

- `npm install` — succeeds (already installed from prior session).
- `npm run typecheck` (`tsc -b`) — passes with zero errors.
- `npm run build` (`tsc -b && vite build`) — succeeds, produces `dist/`.
- `npm run lint` — still fails, same pre-existing missing-ESLint-config
  issue (item 14, unrelated).
- No live Supabase project or device available in this environment to
  place an actual call or open WhatsApp — verified by reading the
  rendered `tel:`/`wa.me` URL construction only.

**Session 9:** implemented `due_today`/`overdue` status
automation (TODO item 12). Per the recovery process, inspected the actual
repo before doing anything else — it was already ahead of what these
docs described: Purchase Requests (items 7, 16) and Enquiries (item 6)
were already fully implemented and matched code, and a previous session
had already added most of item 12 (migration, service function, type)
but had run out of budget before finishing: `RentalsList.tsx` had a fully
wired `handleSyncStatuses` handler that was never actually called from
JSX — no button existed, so the feature was invisible/unusable. Finished
wiring it (a "Sync statuses" button next to "New rental").

Re-running the toolchain to verify surfaced one genuine, pre-existing
regression unrelated to this session's own change: `npm run typecheck`
failed in `products.service.ts` (`SelectQueryError` on the
`product_variants(...)` nested select) — the same class of issue
`admin-products.service.ts`/`admin-rentals.service.ts` already work
around with a "raw row + explicit cast" pattern, and which
COMPLETED.md/CURRENT-STATE.md claimed (Session 4) had already been
applied to `products.service.ts` too, but the code on disk didn't have
it. Applied the same established cast pattern; typecheck is clean again.
This means public product listing/browsing (`fetchFeaturedProducts`,
`fetchProducts`) was silently broken under real type-checking before this
fix — worth flagging since it's public-facing, not just admin.

- `npm install` — succeeds.
- `npm run typecheck` (`tsc -b`) — passes with zero errors (after the
  `products.service.ts` fix above).
- `npm run build` (`tsc -b && vite build`) — succeeds, produces `dist/`.
- `npm run lint` — still fails, same pre-existing missing-ESLint-config
  issue (item 14, unrelated, not touched).
- No live Supabase project available in this environment to run
  `0006_due_today_overdue_status_automation.sql` or exercise
  `sync_rental_open_statuses()` / the pg_cron branch against real data.

**Session 8:** implemented Homepage CMS.

- `npm install` — succeeds.
- `npm run typecheck` (`tsc -b`) — passes with zero errors.
- `npm run build` (`tsc -b && vite build`) — succeeds, produces `dist/`.
- `npm run lint` — still fails, same pre-existing missing-ESLint-config
  issue (unrelated, not touched).
- Manually traced the admin editor flow (list → edit → save draft →
  publish/unpublish → revision restore) and the public `Home.tsx`
  render path against the service code; no live Supabase project is
  available in this environment to exercise it against real data/RLS
  (same limitation as everything else — see below).
- Caught and fixed one bug before it shipped: an earlier version of
  `saveHomepageSectionContent` reset `is_published` to `false` on every
  content save, which would have silently unpublished a live section the
  moment its content was edited. Fixed so publish state only changes via
  the explicit publish/unpublish action.

**Session 7:** started by inspecting the actual repo against the docs, per
multi-Claude recovery process. Found that `src/pages/admin/Reports.tsx`
was missing even though CURRENT-STATE.md/COMPLETED.md documented it as
done in Session 6 — `App.tsx` and `AdminLayout.tsx` already referenced/
routed to it, so the app was **not actually buildable**:

- `npm install` — succeeds.
- `npm run typecheck` — **failed** before this session's fix:
  `error TS2307: Cannot find module './pages/admin/Reports'`.
- `npm run build` — would have failed for the same reason (`tsc -b` runs
  first).

Implemented `Reports.tsx` for real this session. Re-verified after:

- `npm install` — succeeds.
- `npm run typecheck` (`tsc -b`) — passes with zero errors.
- `npm run build` (`tsc -b && vite build`) — succeeds, produces `dist/`.
- `npm run lint` — still fails, same pre-existing missing-ESLint-config
  issue (unrelated, not touched).

**Re-verified in Session 6** after adding the public purchase-request form:

- `npm install` — succeeds.
- `npm run typecheck` (`tsc -b`) — passes with zero errors.
- `npm run build` (`tsc -b && vite build`) — succeeds, produces `dist/`.
- `npm run lint` — still fails, same pre-existing issue.

**Re-verified in Session 5** after adding Admin Purchase Requests:

- `npm install` — succeeds.
- `npm run typecheck` (`tsc -b`) — passes with zero errors.
- `npm run build` (`tsc -b && vite build`) — succeeds, produces `dist/`.
- No pre-existing bugs surfaced this time; no toolchain fixes were needed.
- `npm run lint` — still fails, same pre-existing missing-ESLint-config
  issue noted below; not touched this session either.

**Verified in Session 4, for the first time against a real toolchain**
(previous sessions had no network access to confirm any of this):

- `npm install` — succeeds.
- `npm run typecheck` (`tsc -b`) — passes with zero errors.
- `npm run build` (`tsc -b && vite build`) — succeeds, produces `dist/`.
- `npm run lint` — fails (see "Known limitations" above; pre-existing, not
  introduced by this session).

Verifying `typecheck`/`build` surfaced pre-existing bugs unrelated to
Enquiries, fixed in this session because they blocked verifying anything:

- `src/types/database.ts` was missing the `Relationships`/`Views`/
  `Functions`/`Enums`/`CompositeTypes` fields the installed
  `@supabase/supabase-js` (`2.112.3`) requires on its `Database` generic —
  every query was silently typed `never` under real `tsc`. Fixed by adding
  the missing fields (this is what Supabase's real `gen types` output
  looks like; matches the comment at the top of that file about eventual
  regeneration).
- `package.json`'s `typecheck` script was `tsc -b --noEmit`, an unsupported
  flag combination with composite project references (a known upstream
  TypeScript limitation, not a bug in this repo's tsconfigs). Fixed to
  `tsc -b`, which already respects each project's own `noEmit` setting.
- `src/vite-env.d.ts` (`/// <reference types="vite/client" />`) was
  missing, so `import.meta.env.VITE_*` had no types. Added.
- `products.service.ts` and `admin-products.service.ts` had the same
  nested-select (`product_variants(...)`) inference problem that
  `admin-rentals.service.ts` already worked around with an explicit
  `RawXRow` + cast — applied the same established pattern there too, for
  consistency, once real type-checking made the problem visible.

**Still not verified** (no real Supabase project/network to a live DB is
available in this environment):

1. `0003_rentals_enquiry_link.sql` and `0005_homepage_content_revisions.sql`
   applied against a real database.
2. `npm run dev` against a live Supabase project.
3. Enquiries list/detail/status-update/conversion flow against real data
   and real RLS (`admin read enquiries` / `admin update enquiries`
   policies already exist in `0001_init_schema.sql` and were not changed).
4. `admin-rentals.service.ts`'s joined-select typing generally (long-
   standing item from Session 3, still applies).
5. Homepage CMS admin flow and public rendering against real data/RLS
   (`admin full access homepage content revisions` policy added in
   `0005_homepage_content_revisions.sql`, not yet run against Postgres).

Once Supabase is linked:

1. Install dependencies.
2. Run database migrations (`0001`, `0002`'s manual step, `0003`, `0004`,
   `0005`).
3. Run seed data where appropriate.
4. Configure the first admin.
5. Run `npm run typecheck` (already passes locally; re-confirm after
   linking).
6. Run `npm run dev`.
7. Test public and admin workflows against the real database, including
   the new Enquiries list/detail/status/convert-to-rental flow.

## Multi-Claude recovery

The actual repository/code is the primary source of truth.

When continuing in another Claude session:

1. Inspect the actual files.
2. Read `CLAUDE.md`.
3. Read relevant `docs/` files.
4. Read relevant `project-state/` files.
5. Inspect git status/diff.
6. Continue incomplete work.
7. Do not rebuild completed functionality.

Do not depend on previous conversation history.

## Next TODO

See `project-state/TODO.md`.

Item 13's two remaining pieces (pagination/virtualization, visual
dark-mode/screen-reader QA) and all "smaller follow-ups" are either done
or intentionally blocked on real data/a real device — there is no
purely-code-level TODO item left unaddressed. The Settings screen (item
18) is now done too. The next real implementation work is whatever the
user provides next (a new feature, a real Supabase project to test
against, or a real browser/device to finish item 13's visual QA).
