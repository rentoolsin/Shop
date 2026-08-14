# Completed

## Session 18 — Admin mobile UI pass (Rentals) + admin bottom nav

Per the recovery process: the project-state docs pasted into this
session's initial context described only 2 sessions of work (public app
+ admin auth/Products/Categories CRUD), but the actual repo is at Session
17 (see `IN-PROGRESS.md`'s Session 17/16 recaps — PWA install banner,
client-side pagination — and this file's own Session 15 entry below,
which the recap sessions apparently hadn't been archived into yet).
Treated the repo as source of truth per RECOVERY.md and inspected actual
files before making changes — the pasted docs were stale, not the repo.
Did not attempt to backfill the missing Session 16/17 entries into this
file — out of scope for this session and risks misrepresenting work this
session didn't do; a future session should reconcile that gap using
`git log` if needed.

- Redesigned `/admin/rentals` to match a supplied mobile-app mock: pill
  header action, segmented "Rentals / Sync statuses" row, rounded search +
  filter row, pill status filter, illustrated empty state, and restyled
  rental cards (real product thumbnail, reference code derived from the
  row id, status badge, pill action buttons). All existing extend/return/
  cancel/sync logic and business rules are unchanged — presentation only.
- `admin-rentals.service.ts` now selects and returns `productImageUrl`
  (joined from `products.image_url`) so the new thumbnails show real
  product photos instead of a placeholder.
- New **admin mobile bottom tab bar** (`AdminMobileNav`, six tabs: Home,
  Rentals, Requests, Products, Customers, More) — the existing sidebar
  (`AdminLayout`) is now desktop-only (`hidden md:flex`); shared nav icons
  factored into `components/admin/nav-icons.tsx` and reused by both the
  sidebar and the new tab bar rather than duplicated.
- New `/admin/more` page (`AdminMore.tsx`) listing the admin sections that
  don't fit the six-tab bar (Categories, Purchase Requests, Reports,
  Homepage, Settings) plus sign out.
- `EmptyState` gained optional `size`/`className` props (backward
  compatible) and `Select` gained a `pill` variant — both reusable
  extensions rather than one-off page-specific markup.
- Verified `npm install` / `npx tsc --noEmit` / `npm run build` / `eslint`
  all pass in this environment.

## Session 15 — Settings screen (business contact info, appearance, admin account)

Per the recovery process, re-verified this session's flagged items
(Enquiries, Enquiry→Rental conversion, Purchase Requests, Admin
Dashboard, Reports) against the actual repo before starting — all
genuinely complete, confirmed via `npm install`/`npm run typecheck`/
`npm run lint`/`npm run build`, all passing. No rework needed. Homepage
CMS (the task brief's originally-intended next step if those five were
incomplete) was also independently confirmed already fully built
(Session 8) — not rebuilt. Proceeded to the Settings screen per explicit
user direction, after confirming scope (business contact info + admin
account + theme preference — not a broader admin-user-management UI,
which DECISIONS.md's "no self-service admin sign-up" choice deliberately
keeps out of the in-app surface).

- New `supabase/migrations/0008_site_settings.sql`: singleton
  `site_settings` table (`id boolean primary key default true` +
  `check (id)`, so there's exactly one row, no list/create/delete
  surface needed). Seeded with the real values already in use in the
  codebase (not placeholders) — `+919688755349`, `919688755349`,
  `rentools.in@gmail.com`, `Kovilmedu, Coimbatore, Tamil Nadu, India` —
  so applying it doesn't change anything already shown anywhere. RLS:
  public `select` (business contact info is public-facing, same as
  homepage content), admin-only `update` via `is_admin()`.
- `src/utils/site-settings.ts`: `SiteSettings` shape + hard-coded
  `SITE_SETTINGS_DEFAULTS` (the same real values as the migration seed),
  mirroring `homepage-content.ts`'s "shape + defaults, single import
  source" pattern — used as the render-immediately fallback while the
  live fetch is loading, errors, or the migration hasn't been applied.
- `src/services/site-settings.service.ts` (public, read-only, RLS-backed
  anon read) and `src/services/admin-site-settings.service.ts` (admin
  read + `updateSiteSettings`) — mirrors the public/admin service split
  already used for homepage content and purchase requests.
- `src/hooks/useSiteSettings.ts` (public) + `useAdminSiteSettings` added
  to the existing `useAdminData.ts` (not a new admin hooks file).
- Replaced the three previously-duplicated hard-coded contact constants:
  deleted `src/utils/contact.ts` (`RENTOOLS_PHONE`/`RENTOOLS_WHATSAPP`)
  and the local `RENTOOLS_EMAIL`/`ADDRESS` constants in `Contact.tsx`/
  `Location.tsx`. `Home.tsx`, `ProductDetail.tsx`, `Contact.tsx`,
  `Location.tsx` now call `useSiteSettings()` and fall back to
  `SITE_SETTINGS_DEFAULTS` while loading/on error — same best-effort,
  never-blank convention `Home.tsx` already used for homepage CMS
  content, so none of these pages gained a loading state or could show
  a worse experience than before.
- `src/types/database.ts`: added the `site_settings` table entry.
- New `src/pages/admin/Settings.tsx` (`/admin/settings`), three
  sections, no new form primitives — all built from `Input`, `Button`,
  `LoadingState`, `ErrorState`, `useToast`:
  - **Business contact info**: phone/WhatsApp/email/address form with
    format validation (E.164 phone, digits-only WhatsApp, email regex,
    non-empty address), saves via `updateSiteSettings`.
  - **Appearance**: light/dark/system toggle group built directly on the
    existing `useTheme()` — no new theme state, no new persistence; this
    is the first *UI* control for a provider that already existed
    code-level with no way to change it in-app.
  - **Admin account**: change email and change password, both via
    `supabase.auth.updateUser` directly (no new service file needed —
    this is a thin wrapper around Supabase Auth itself, not a
    RenTools-specific data model). Deliberately did not add self-service
    admin *creation* here — out of scope and contradicts the existing
    "no self-service admin sign-up" decision; this only lets an already-
    admin user manage their own credentials.
- `AdminLayout.tsx` nav extended with a Settings link; `App.tsx` route
  added (lazy-loaded, consistent with every other admin route).
- `docs/ROUTES.md` admin-routes line corrected (was still describing
  Reports/CMS/Settings as "not yet built").
- Verified `npm install` / `npm run typecheck` / `npm run lint` /
  `npm run build` all pass.
- Not verified: the new migration/table against a live Postgres instance
  — no linked Supabase project in this environment (same limitation as
  every other migration here). Reviewed for correctness against the
  existing `is_admin()`/RLS pattern instead. Also not verified: actually
  receiving the Supabase confirmation email for an email change, or a
  real device/browser for the appearance toggle's visual result — same
  category of environment limitation noted throughout this project.

## Session 14 — Product/variant transactional writes (TODO "smaller follow-ups")

Per the recovery process, re-checked TODO item 13 (production-readiness)
before picking a task: both remaining pieces (pagination/virtualization,
visual dark-mode/screen-reader QA) are still genuinely blocked in this
environment (no real data volume, no real browser/device) — nothing new
to do there. The only actionable open item was the "smaller follow-up"
flagging non-atomic product/variant writes, so did that.

- New `supabase/migrations/0007_product_variant_transaction.sql`:
  `admin_save_product_with_variants()`, a `security definer` plpgsql
  function that creates-or-updates a product and upserts its variants
  (insert if `id` is null, update if present) in one transaction — a
  function body is inherently atomic, so any failure partway through
  (e.g. the existing `reserved_not_over_total` check firing because an
  edit tried to shrink `quantity_total` below what's currently reserved)
  rolls back the product change and every variant change together,
  instead of leaving a half-saved product. Admin-gated via `is_admin()`
  inside the function (RLS already grants admins full access to both
  tables — this is a consolidation, not a permissions change). Execute
  revoked from `public`, granted to `authenticated`.
- Deliberately did NOT fold variant deletion into this RPC — kept
  `deleteVariant` as its own explicit call from `ProductForm.tsx`, same
  as before. This matches the existing DECISIONS.md choice to keep
  create/update/delete single-purpose and the "what changed" logic
  visible in the form, and it's also outside what this follow-up item
  actually asked for (it was about create-or-update specifically).
- `admin-products.service.ts`: `createProduct`/`updateProduct` now call
  the RPC instead of doing a `products` insert/update followed by
  separate per-variant insert/update calls. Public signatures unchanged
  (`createProduct(values)`, `updateProduct(id, values)`), so
  `ProductForm.tsx` needed no changes at all.
- `types/database.ts`: added the
  `Functions.admin_save_product_with_variants` entry so
  `.rpc("admin_save_product_with_variants", ...)` typechecks with a
  real arg/return shape instead of `any`.
- Verified `npm install` / `npm run typecheck` / `npm run lint` /
  `npm run build` all pass.
- Not verified: the migration and RPC against a live Postgres instance —
  no linked Supabase project in this environment (same limitation as
  every other migration in this repo). Reviewed for correctness against
  the existing schema/constraints/RLS instead.

## Session 13 — Reports/Analytics upgrade (TODO item 9) + docs correction

Per the recovery process, inspected the actual repo before starting.
Re-verified Admin Enquiries, Enquiry→Rental conversion, Admin Purchase
Requests, and the Admin Dashboard (the four items flagged for
re-checking) — all genuinely complete, confirmed via
`npm install`/`npm run typecheck`/`npm run build`, all passing. No rework
needed there; proceeded to Reports/Analytics.

- **Docs correction:** `.eslintrc.cjs` already exists in the repo and
  `npm run lint` already passes cleanly. TODO.md item 14 and every
  session's notes since Session 4 claimed lint was broken
  ("no configuration file found") — that was no longer true of the code
  on disk. Corrected TODO.md/CURRENT-STATE.md; item 14 marked done.
- New `src/utils/date-range.ts`: single source of truth for
  today/this-week/this-month/last-month range resolution, all via
  `toLocalISODate()` (reads the Date object's local Y/M/D) instead of
  `date.toISOString().slice(0, 10)`. The old pattern — duplicated in both
  `Dashboard.tsx` and the old `Reports.tsx` — converts to UTC first, so
  for any timezone ahead of UTC (e.g. IST) a local midnight can serialize
  as the previous calendar day. Verified with a `TZ=Asia/Kolkata` repro:
  local Aug 14 00:30 produced `"2026-08-13"` the old way vs. the correct
  `"2026-08-14"` via local components. Fixed in both files by pointing
  them at the shared utility, which also removed the pre-existing
  duplication between them.
- New reusable `src/components/ui/DateRangePicker.tsx`: preset select
  (Today / This week / This month / Last month / Custom range) built on
  the existing `Select`; custom mode shows two `Input type="date"`s with
  `min`/`max` cross-constraints and an explicit "start after end"
  validation message. Built as a standalone reusable component (not
  Reports-page-local) since a calendar-range filter is a generically
  useful control.
- New `fetchProductInventorySummary()` in `admin-products.service.ts`
  (+ `useAdminProductInventory` hook in `useAdminData.ts`): one query
  over `products.name` + `product_variants(quantity_total,
  quantity_reserved, is_active)`, summed per product over active
  variants. Reads the DB's own live `quantity_reserved` — maintained by
  the existing inventory-enforcement trigger from
  `0001_init_schema.sql` — rather than recomputing reservations
  client-side. Keyed by product name to match the existing
  rentals-by-product grouping convention used elsewhere (rentals only
  join through to a product name, not a product id).
- `src/pages/admin/Reports.tsx` rebuilt around the above:
  - Range summary: Rentals, Rental days (Σ `calculateRentalDays() ×
    quantity`, reusing the same authoritative day-count function
    `rental-calculations.ts` already uses for pricing), Revenue, Advance
    collected, Outstanding balance, Returns (status `returned` with
    `actualReturnDate` inside the selected range).
  - "Current status" section: Active rentals / Overdue rentals — a live,
    range-independent snapshot via the same `deriveDisplayStatus()` the
    Rentals list and Dashboard already use (not reimplemented).
  - By-product table (range-scoped): rental count, rental days, revenue,
    outstanding, last rented date, and "Available now" (current
    capacity — intentionally NOT range-scoped, since availability is a
    real-time fact, not a historical one).
  - Empty/invalid states: an invalid custom range (start after end)
    shows an explicit message instead of a broken/negative report; an
    empty result within a valid range shows "No rentals in range" rather
    than a table of zeros. No fabricated stats anywhere — every number
    traces to a real query or an existing authoritative calculation.
- Verified `npm install` / `npm run typecheck` / `npm run lint` /
  `npm run build` all pass.
- Not verified: the new report metrics and inventory column against real
  Supabase data (no live project in this environment) — checked by
  reading the derivation logic and confirming loading/empty/invalid-range
  states render sensibly against undefined/empty synthetic data.


## Session 1 — Project foundation + public customer app

- Vite/React/TS/Tailwind scaffold, design tokens, theme provider.
- Reusable UI/layout/product/action component kit.
- All 10 public routes, live-data-driven (Supabase), full loading/error/empty state coverage.
- Enquiry form with validation + submission.
- Initial DB migration: full schema, RLS, inventory-enforcement trigger.
- Dev seed data (names only).
- Project memory docs (this folder + `docs/`).

## Session 3 — Admin mobile UI pass (Rentals) + admin bottom nav
- Redesigned `/admin/rentals` to match the supplied mobile-app mock: pill
  header action, segmented "Rentals / Sync statuses" row, rounded search +
  filter row, pill status filter, illustrated empty state, and restyled
  rental cards (real product thumbnail, reference code derived from the
  row id, status badge, pill action buttons). All existing extend/return/
  cancel/sync logic and business rules are unchanged — presentation only.
- `admin-rentals.service.ts` now selects and returns `productImageUrl`
  (joined from `products.image_url`) so the new thumbnails show real
  product photos instead of a placeholder.
- New **admin mobile bottom tab bar** (`AdminMobileNav`, six tabs: Home,
  Rentals, Requests, Products, Customers, More) — the existing sidebar
  (`AdminLayout`) is now desktop-only (`hidden md:flex`); shared nav icons
  factored into `components/admin/nav-icons.tsx` and reused by both the
  sidebar and the new tab bar rather than duplicated.
- New `/admin/more` page (`AdminMore.tsx`) listing the admin sections that
  don't fit the six-tab bar (Categories, Purchase Requests, Reports,
  Homepage, Settings) plus sign out.
- `EmptyState` gained optional `size`/`className` props (backward
  compatible) and `Select` gained a `pill` variant — both reusable
  extensions rather than one-off page-specific markup.
- **Verified against a real toolchain for the first time**: `npm install`,
  `npx tsc --noEmit`, `npm run build`, and `eslint` all ran clean in this
  environment (see CURRENT-STATE.md — this sandbox does have network
  access to the npm registry after all).

- Reusable form primitives: Input, Textarea, Select, Switch, ConfirmDialog.
- Auth layer (`src/lib/auth.tsx`) + `/admin/login` + `ProtectedRoute`.
- Admin layout/nav (`AdminLayout`) distinct from customer chrome.
- Categories CRUD (list, create, edit, delete-with-confirm).
- Products CRUD including nested variant add/edit/remove.
- Admin dashboard with real (not fake) counts.
- `0002_admin_seed_notes.sql` documenting manual first-admin setup.
- Refactored `Enquire.tsx` to use the new shared Input/Textarea instead of locally duplicated field markup.

## Session 3 — Admin: Customers + Rentals workflow

- `admin-customers.service.ts`: list/search (name or mobile), fetch by id, mobile-prefix search, create/update/delete.
- `admin-rentals.service.ts`: list joined with customer + product/variant names, create, extend (return date + advance), return, cancel. Inventory is left to the DB trigger — not re-validated client-side before insert.
- `deriveDisplayStatus()` added to `rental-calculations.ts` (the authoritative rental-math file) — a read-only UI approximation of `due_today` / `overdue` from `return_date`, since nothing auto-writes those yet (see DECISIONS.md). Does not touch the DB.
- `CustomerPicker` (`components/admin`): reusable search-by-mobile → select → create-inline widget, built generically (not rental-specific) so enquiry → rental conversion (TODO #6) can reuse it later.
- Admin: Customers — list with debounced name/mobile search, create/edit form, delete-with-confirm.
- Admin: Rentals — list with status filter + search, inline Extend (modal, live recalculated total/balance), Mark returned, Cancel actions; create form with `CustomerPicker` + cascading category → product → variant select (reuses the existing customer-facing `useCategories`/`useProducts`/`useProduct` hooks — no duplicated fetch logic) and live rental totals via `rental-calculations.ts`.
- Dashboard: added Active rentals / Customers stat cards alongside the existing Products / Categories ones; removed the now-stale "not built yet" line for those two.
- Admin nav (`AdminLayout`) extended with Rentals + Customers links.

## Session 4 — Admin: Enquiries + Enquiry → Rental conversion

- `admin-enquiries.service.ts`: list (newest first, joined with linked product
  name), fetch by id, status update.
- Admin: Enquiries — list with client-side search (name/mobile/product) and
  status filter (New / Contacted / Converted to Rental / Not Available /
  Closed); detail page showing all submitted fields with a status dropdown.
- Convert Enquiry → Rental, reusing existing work rather than duplicating it:
  - `CustomerPicker` extended with optional `initialQuery`/`initialName` props
    (not a new component) so it pre-searches by the enquiry's mobile and
    pre-fills the name if a new customer needs to be created.
  - `RentalForm` extended with optional prefill/behavior props (`enquiryId`,
    `initialCustomer*`, `initialCategoryId`/`initialProductId`/
    `initialQuantity`/`initialStartDate`/`initialReturnDate`, `title`,
    `submitLabel`, `onCreated`, `onCancel`) — same component, same
    validation, same `rental-calculations.ts` totals, rendered inline on the
    enquiry detail page instead of a duplicate form. Default behavior
    (standalone `/admin/rentals/new`) is unchanged.
  - On successful rental creation: enquiry status is set to "Converted to
    Rental" and the original enquiry record is preserved (not deleted or
    overwritten); if that follow-up status update fails, the admin is told
    explicitly rather than the flow silently reporting success.
- `0003_rentals_enquiry_link.sql`: adds nullable `rentals.enquiry_id` FK
  (`on delete set null`) so a rental can be traced back to the enquiry it was
  converted from.
- Dashboard: added a "New enquiries" stat card; removed the stale
  "Enquiries... aren't built yet" line.
- Admin nav (`AdminLayout`) extended with an Enquiries link.

### Toolchain verification (first time run against a real environment)

- Confirmed `npm install`, `npm run typecheck`, and `npm run build` actually
  work end to end in this sandbox (previous sessions had no network access
  to check). This surfaced and required fixing three pre-existing bugs
  unrelated to Enquiries, since they blocked verifying anything:
  - `types/database.ts` was missing fields (`Relationships`, `Views`,
    `Functions`, `Enums`, `CompositeTypes`) required by the installed
    `@supabase/supabase-js` version, causing every Supabase query to
    silently type as `never`. Fixed.
  - `package.json`'s `typecheck` script used an unsupported `tsc -b --noEmit`
    combination with composite project references. Fixed to `tsc -b`.
  - `src/vite-env.d.ts` was missing (no `import.meta.env` types). Added.
  - Applied the existing "raw row + explicit cast" pattern (already used in
    `admin-rentals.service.ts`) to `products.service.ts` and
    `admin-products.service.ts`, whose nested `product_variants(...)` select
    typing broke once real type-checking was possible.
- `npm run lint` still fails (pre-existing missing ESLint config, unrelated
  to this session) — noted in CURRENT-STATE.md, not fixed.

## Session 5 — Admin: Purchase Requests

- `admin-purchase-requests.service.ts`: list (newest first, joined with
  linked customer name), fetch by id, create, status update, priority
  update.
- Admin: Purchase Requests — list with client-side search (product/customer
  name/mobile) and status filter (Requested / Sourcing / Fulfilled /
  Declined), matching the Enquiries list pattern; detail page showing all
  fields with independent status and priority dropdowns; create form for
  admin-logged requests (walk-in/phone — there's no public submission page
  yet, see "Known limitations").
- Create form reuses `CustomerPicker` unmodified (customer is required,
  same as `RentalForm`) — no duplicated customer search/create logic.
- No schema changes: `purchase_requests` table/RLS from `0001_init_schema.sql`
  were already sufficient (matches the "no schema decisions needed" note
  from Session 4's TODO item).
- Dashboard: added an "Open purchase requests" stat card (requested +
  sourcing counts); removed the stale "Purchase requests... aren't built
  yet" line.
- Admin nav (`AdminLayout`) extended with a Purchase Requests link.
- Re-verified `npm install` / `npm run typecheck` / `npm run build` still
  pass end-to-end after this change.

## Session 6 — Public "request a purchase" form (fixes Session 5 flagged gap)

- `0004_purchase_requests_name.sql`: additive migration adding nullable
  `name` to `purchase_requests` — needed because anonymous public
  submissions have no `customer_id` to resolve a name from, unlike
  admin-logged requests (which link a customer via `CustomerPicker`).
- `src/services/purchase-requests.service.ts`: public `submitPurchaseRequest`
  (insert-only, anon-safe per existing RLS policy) — separate from
  `admin-purchase-requests.service.ts`, mirrors the enquiries public/admin
  service split already in the codebase.
- `RequestPurchase.tsx` (new public page, `/request-purchase`): name/
  mobile/quantity/notes form, structured like `Enquire.tsx` but writes to
  `purchase_requests`, not `enquiries` — this is a restocking signal, not
  a rental enquiry against current stock.
- `RequestPurchaseButton` (new reusable action component, mirrors
  `EnquiryButton`): `ProductDetail.tsx` now shows this instead of the
  Enquiry button when the selected variant has 0 available quantity.
- `admin-purchase-requests.service.ts` and the admin list/detail pages
  updated to surface the new `name` field (public submissions) alongside
  `customerName` (admin-logged) — display and search both fall back
  through customer → requester name → mobile.
- `docs/ROUTES.md` updated: 11th public route added; admin routes section
  rewritten from "not yet built" to reflect actual state.
- Re-verified `npm install` / `npm run typecheck` / `npm run build` pass.

## Session 6 (cont'd) — Reports/Analytics (documented, NOT actually implemented)

Session 6's docs claimed this was done, and `App.tsx`/`AdminLayout.tsx`
were wired up as if it were (import + route + nav link), but
`src/pages/admin/Reports.tsx` was never actually created. This left the
repo unbuildable (`npm run typecheck`/`npm run build` failed with
`Cannot find module './pages/admin/Reports'`). Discovered and fixed in
Session 7 — see below. Recorded here so the discrepancy isn't silently
erased from history.

## Session 7 — Fix broken build + actually implement Reports/Analytics

- Per multi-Claude recovery process: inspected the real repo against
  project-state docs before doing anything else. `npm run typecheck`
  failed immediately (missing `Reports.tsx`), contradicting Session 6's
  "re-verified, passes" claim.
- `src/pages/admin/Reports.tsx`: date-range summary (rental count,
  revenue, advance collected, outstanding balance) + per-product
  breakdown table. Built entirely from `useAdminRentals()` (already
  fetched for the Rentals list) filtered client-side by `startDate` —
  no new query, no new service file.
- Uses `rental-calculations.ts`-derived totals (`totalRental`, `balance`)
  already computed in `admin-rentals.service.ts` — no duplicated math.
- Reuses the existing `Input` (type="date"), `Skeleton`, `EmptyState`,
  `ErrorState` components; stat-card markup matches `Dashboard.tsx`'s
  existing pattern rather than introducing a new one.
- Admin nav (`AdminLayout`) and Dashboard's "View reports →" link were
  already wired up from Session 6 and needed no changes.
- Scope note (carried over, still true): the "spec section 21" TODO.md's
  Reports item referenced isn't present in this repo (confirmed via
  `CLAUDE.md`, which states the full master prompt isn't stored here) —
  this is a first-principles scope (count/revenue/advance/outstanding +
  by-product), not derived from that spec.
- Verified `npm install` / `npm run typecheck` / `npm run build` actually
  pass now. `npm run lint` still fails on the same pre-existing missing-
  ESLint-config issue (unrelated, not touched).

## Session 8 — Homepage CMS (TODO item 10)

- `src/utils/homepage-content.ts`: single source of truth for the CMS's
  fixed set of section keys (`hero`, `why_rentools`, `how_it_works`,
  `contact_location`), their content shapes, and hard-coded defaults.
  Both the public Home page and the admin editor import from here.
- `src/services/homepage-content.service.ts` (public): resolves what
  `Home.tsx` renders per section — published+enabled CMS content if it
  exists, else the built-in default; a disabled section is reported as
  hidden so it's skipped entirely rather than rendering blank.
- `src/services/admin-homepage-content.service.ts` (admin): lists all
  four sections (merging real rows with defaults for never-edited ones),
  saves content/enabled/sort-order as a draft, and separately toggles
  `is_published`. Every content save snapshots the previously-live
  content into the new `homepage_content_revisions` table first.
- `supabase/migrations/0005_homepage_content_revisions.sql`: additive
  migration, `section_key` FK to `homepage_content`, admin-only RLS
  matching the existing pattern. Not yet applied to a live database.
- `src/types/database.ts`: added `homepage_content_revisions` types.
- Admin: `/admin/homepage` (`HomepageSectionsList.tsx`) — list of the
  four sections with Published/Draft/Hidden badges. `/admin/homepage/
  :sectionKey` (`HomepageSectionForm.tsx`) — structured edit form per
  section (plain fields for hero/contact, add/remove rows for the
  why-RenTools points list and how-it-works steps), a visibility toggle,
  sort order, Save draft / Publish-Unpublish, and a revision-history list
  with Restore (behind a `ConfirmDialog`). Reuses `Input`, `Textarea`,
  `Switch`, `Button`, `StatusBadge`, `ConfirmDialog`, `LoadingState`,
  `ErrorState` — no new form primitives.
- `AdminLayout.tsx` nav extended with a Homepage link; `App.tsx` routes
  added.
- `Home.tsx`: hero heading/subheading, the why-RenTools list, the
  how-it-works steps, and the contact address now render from resolved
  CMS content instead of hard-coded JSX; falls back to defaults while
  loading or on fetch error so homepage copy is never blocking or blank.
  Categories and featured-products sections are unchanged (already
  DB-driven via their own tables, not part of this CMS). Phone/WhatsApp
  numbers are intentionally out of scope here — still placeholders,
  tracked separately as TODO item 11.
- Caught and fixed a bug before it shipped: an earlier version of
  `saveHomepageSectionContent` reset `is_published` to `false` on every
  content save, which would have silently unpublished a live section the
  moment its content was edited. Publish state now only changes via the
  explicit Publish/Unpublish action.
- Verified `npm install` / `npm run typecheck` / `npm run build` pass.
  `npm run lint` still fails on the pre-existing missing-ESLint-config
  issue (unrelated, not touched). No live Supabase project available to
  exercise the admin flow or public rendering against real data/RLS.

## Session 9 — `due_today` / `overdue` status automation (TODO item 12)

- `supabase/migrations/0006_due_today_overdue_status_automation.sql`:
  `sync_rental_open_statuses()`, a `security definer` function that
  recomputes `active`/`due_today`/`overdue` for every open rental from
  `return_date` vs. `current_date`. Only touches the three "open"
  statuses (never `returned`/`cancelled`); since
  `rentals_inventory_trigger` already treats all three identically for
  reservation purposes, these updates never change
  `quantity_reserved` — display/status only. Scheduled via `pg_cron` at
  00:05 when the extension is available, wrapped so the migration still
  applies cleanly (function still created) if `pg_cron` isn't enabled.
  Execute revoked from `public`, granted to `authenticated`; an
  `is_admin()` check guards any authenticated (non-service-role) caller.
- `admin-rentals.service.ts`: `syncOpenRentalStatuses()` calls the RPC,
  returns how many rentals changed.
- `types/database.ts`: added the `Functions.sync_rental_open_statuses`
  entry so `.rpc("sync_rental_open_statuses")` typechecks.
- Admin Rentals list: "Sync statuses" button next to "New rental" (toast
  reports how many rentals changed, or that they're already current);
  `deriveDisplayStatus()` is left in place as-is, still the same-day
  display fallback between real-world midnight and the next sync.
- Per the recovery process, inspected the actual repo before starting:
  found this item was already partially implemented by a prior session
  that ran out of budget mid-edit — migration, service function, and
  type were all in place and correct, but `RentalsList.tsx`'s
  `handleSyncStatuses` handler was never wired to a button, so the
  feature didn't actually exist from a user's perspective. Finished the
  wiring rather than redoing the already-correct parts. Also confirmed
  Enquiries/conversion and Purchase Requests (admin + public) were
  already fully implemented and matched the docs — no rework needed
  there.
- Re-verifying the toolchain surfaced an unrelated pre-existing break:
  `npm run typecheck` failed in `products.service.ts` (nested
  `product_variants(...)` select typed as `SelectQueryError` — the same
  issue `admin-products.service.ts`/`admin-rentals.service.ts` already
  work around, and which Session 4's notes claimed had been applied to
  `products.service.ts` too, but wasn't actually present in the code).
  Applied the same "raw row + explicit cast" pattern to
  `fetchFeaturedProducts`/`fetchProducts`. This was a **public-facing**
  bug (product listing/browsing), not just an admin one.
- Verified `npm install` / `npm run typecheck` / `npm run build` pass.
  `npm run lint` still fails on the pre-existing missing-ESLint-config
  issue (item 14, unrelated). No live Supabase project available to run
  the migration or exercise `sync_rental_open_statuses()` /
  the `pg_cron` branch against real data.

## Session 10 — Real phone/WhatsApp numbers (TODO item 11)

- Real contact number provided directly by the user in chat (same number
  used for both Call and WhatsApp).
- `src/utils/contact.ts` (new): single source of truth for
  `RENTOOLS_PHONE` (E.164, for `CallButton`'s `tel:` link) and
  `RENTOOLS_WHATSAPP` (digits only, for `WhatsAppButton`'s `wa.me` link).
- `Home.tsx`, `ProductDetail.tsx`, `Contact.tsx`: replaced their three
  separately-duplicated local `+91XXXXXXXXXX`/`91XXXXXXXXXX` placeholder
  constants with imports from `contact.ts`, instead of just editing the
  string in three places — keeps the number defined once.
- `Contact.tsx`'s `RENTOOLS_EMAIL` placeholder left untouched — out of
  scope for this item (phone/WhatsApp only); no real email was given.
- Verified `npm install` / `npm run typecheck` / `npm run build` pass.
  `npm run lint` still fails on the pre-existing missing-ESLint-config
  issue (item 14, unrelated). No device available in this environment to
  actually place a call or open WhatsApp — verified via the constructed
  `tel:`/`wa.me` URLs only.

## Session 12 — Admin Dashboard improvements (TODO item 8)

Per recovery process, verified Enquiries, Enquiry→Rental conversion, and
Purchase Requests against the actual repo before starting: all three
match what CURRENT-STATE.md/COMPLETED.md already claimed (fully wired
services, list/detail/status pages, conversion flow) — genuinely
complete, no rework needed. Proceeded directly to TODO item 8.

- `src/components/ui/StatCard.tsx` (new, reusable): the stat-card markup
  that was previously a Dashboard-local component and separately
  duplicated inline in `Reports.tsx` is now one shared component (label,
  value, optional `to` link, optional tone for emphasis). `Reports.tsx`
  updated to use it — removes the duplication rather than adding a
  second copy for the Dashboard's new cards.
- `Dashboard.tsx` rewritten around real Supabase-backed metrics, grouped
  by priority instead of one flat grid:
  - **Needs attention today**: Due today / Overdue (derived via the
    existing `deriveDisplayStatus()` — not re-implemented), New
    enquiries, Open purchase requests.
  - **This month**: Active rentals, Outstanding balance (sum of
    `balance` across open rentals — reuses `rental-calculations.ts`
    totals already computed in `admin-rentals.service.ts`, no new math),
    Rentals this month / Revenue this month (filtered by `startDate`,
    same convention `Reports.tsx` already uses for its date range).
  - **Catalog**: Customers / Products / Categories (unchanged from
    before).
  - **Trends**: "Most rented this month" and "Most requested
    unavailable products" — small ranked lists (not charts), computed
    client-side from the same already-fetched `rentals`/
    `purchaseRequests` data, top 3 each.
- All metrics are derived from `useAdminRentals()` / `useAdminEnquiries()`
  / `useAdminPurchaseRequests()` / `useAdminProducts()` /
  `useAdminCategories()` / `useAdminCustomers()` — the same hooks/services
  already used by their respective list pages and by `Reports.tsx`. No
  new queries, no new service files, no new database migration: at this
  project's data volume, fetch-all-then-derive-client-side is the
  established pattern (Reports.tsx already does this), so a new
  aggregation RPC would be premature. Flagged in TODO.md if this ever
  needs revisiting at higher volume — matches items 15/17's existing
  "client-side is fine for now" framing.
- Deliberately **not** built (insufficient real data, would require
  fabrication):
  - **Today's income**: `advance` is a mutable field on `rentals`
    (overwritten on extend), not a dated payment ledger — there's no
    real per-day collection figure to show without inventing one.
    "Outstanding balance" and "Revenue this month" are shown instead,
    since both are honestly derivable from existing columns.
  - **Product utilization / rental days aggregate**: would need a
    proper per-variant reserved-vs-total-inventory query, which is
    Reports-territory, not a Dashboard glance metric — left for a
    future Reports enhancement rather than a partial/misleading number
    here.
- Verified `npm install` / `npm run typecheck` / `npm run build` pass.
  `npm run lint` still fails on the pre-existing missing-ESLint-config
  issue (item 14, unrelated, not touched). No live Supabase project
  available in this environment to see the new metrics against real
  data — verified by reading through the derivation logic and the
  loading/empty states (e.g. "No rentals yet this month") against
  synthetic zero/undefined states only.

## Session 11 — Production-readiness pass, partial (TODO item 13)

Item 13 has three parts (accessibility, performance, dark mode). This
session covered accessibility and code-splitting performance work that
doesn't depend on real data; pagination/virtualization and a real-device
visual pass remain open (see CURRENT-STATE.md).

- `src/hooks/useDialogA11y.ts` (new): shared Escape-to-close,
  Tab/Shift+Tab focus trap, and focus-restore-on-close behavior for
  overlay dialogs. Wired into `Modal` and `BottomSheet` — `ConfirmDialog`
  inherits it automatically since it's built on `Modal`, no duplicated
  dialog logic added.
- Added `aria-label` to 5 search inputs that only had placeholder text
  (admin Rentals/Customers/Enquiries/Purchase Requests lists, public
  Search page) and `aria-hidden="true"` to their decorative search-icon
  SVGs.
- `App.tsx`: converted all `/admin/*` route components (including
  `AdminLayout`) to `React.lazy`, wrapped in a single top-level
  `Suspense` reusing the existing `LoadingState` component as fallback.
  Public customer routes are unaffected and load eagerly as before.
  Result: main JS bundle 510KB → 433KB (gzip 138.78KB → 124.38KB), split
  into ~25 small per-admin-route chunks (1–8KB) loaded on demand; the
  Vite "chunk too large" build warning is gone.
- Code-level dark-mode audit: grepped all of `src/` for light-only color
  utility classes (`bg-white`, `text-ink`, etc.) missing an adjacent
  `dark:` variant. No real gaps found (only false positives from
  multi-line class-string literals already covered a line or two later).
  Flagged as not a substitute for an actual visual check on a device.
- Verified `npm install` / `npm run typecheck` / `npm run build` pass.
  `npm run lint` still fails on the pre-existing missing-ESLint-config
  issue (item 14, unrelated). No browser/device available in this
  environment to verify focus-trap behavior or dark mode visually, or to
  run a real screen reader — noted as still open.
