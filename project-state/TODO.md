# TODO (recommended order)

1. Link a real Supabase project (user is doing this themselves); run
   `0001_init_schema.sql` + `0002_admin_seed_notes.sql` +
   `0003_rentals_enquiry_link.sql` + `0004_purchase_requests_name.sql` +
   `0005_homepage_content_revisions.sql` +
   `0006_due_today_overdue_status_automation.sql` + `seed.sql`; regenerate
   `src/types/database.ts` from the real schema
   (this will also naturally restore the proper `Relationships` metadata
   that was hand-added as `[]` in Session 4 — see CURRENT-STATE.md); grant
   the first admin per `0002_admin_seed_notes.sql`.

2. `npm install` and `npm run typecheck` / `npm run build` — verified
   working end-to-end in this sandbox as of Session 4 (see COMPLETED.md).
   Still not verified: `npm run dev` against a real, linked Supabase
   project, and the full app running against live data/RLS.

3. ~~Admin: Customers~~ — done (Session 3).

4. ~~Admin: Rentals workflow~~ — done (Session 3).

5. ~~Rental extension + return flow~~ — done (Session 3, includes cancel).

6. ~~Admin: Enquiries list + "Convert to Rental"~~ — done (Session 4).
   Reused `CustomerPicker` and `RentalForm` as planned (extended with
   optional props, not duplicated).

7. ~~Admin: Purchase Requests~~ — done (Session 5). List/search/filter,
   detail with status + priority management, admin-logged create form
   (reuses `CustomerPicker`). No schema changes needed. Note: there's still
   no *public* "request a purchase" form (see item 16 below) — for now
   requests are only created by an admin logging a walk-in/phone request.

8. ~~Admin: Dashboard~~ — done (Session 12). Grouped by priority: Needs
   attention today (Due today / Overdue / New enquiries / Open purchase
   requests), This month (Active rentals / Outstanding balance / Rentals
   this month / Revenue this month), Catalog (Customers / Products /
   Categories), Trends (most-rented / most-requested-unavailable, top 3
   each, no charts). All real Supabase-derived data via existing hooks —
   no new queries/migrations. Deliberately not built: "today's income"
   (no dated payment ledger to derive it from honestly) and product
   utilization / rental-days aggregates (Reports-territory, revisit
   there if the spec ever asks for it — spec section 20 reference still
   not present in this repo, same caveat as item 9).

9. ~~Reports/Analytics~~ — done (Session 7), upgraded (Session 13).
   Session 6 had documented this as complete without the file existing,
   which broke the build; Session 7 caught it via the recovery/inspection
   process and implemented it for real. Session 13 upgraded it: date-range
   presets (Today/This week/This month/Last month/Custom, via the new
   reusable `DateRangePicker`), rental days and returns added to the range
   summary, a live active/overdue snapshot, and the by-product table
   extended with last-rented-date and a real current-availability column
   (`fetchProductInventorySummary`, reads the DB's own `quantity_reserved`).
   Still built from `admin-rentals.service.ts`/`rental-calculations.ts`
   data (no duplicated math). Note: the "spec section 21" this item
   referenced isn't present in this repo (`CLAUDE.md` confirms the full
   master prompt isn't stored here) — scope was derived from first
   principles, not that spec. Revisit if the real spec asks for more (e.g.
   by-category, by-customer, export, charts).

10. ~~Wire Home page to `homepage_content`~~ — done (Session 8).
    `Home.tsx` renders hero/why-RenTools/how-it-works/contact-address
    from CMS content (falling back to defaults), with an admin editor at
    `/admin/homepage` supporting draft/publish and revision history
    (new `homepage_content_revisions` table, `0005_homepage_content_
    revisions.sql`). Categories/products stay DB-driven as before, not
    part of this CMS. Phone/WhatsApp numbers deliberately not included —
    still item 11 below.

11. ~~Replace placeholder phone/WhatsApp numbers~~ — done (Session 10).
    Real number provided by the user. Centralized into
    `src/utils/contact.ts` (`RENTOOLS_PHONE`/`RENTOOLS_WHATSAPP`) instead
    of the three duplicated local constants previously in `Home.tsx`,
    `ProductDetail.tsx`, `Contact.tsx`.

12. ~~`due_today` / `overdue` status automation~~ — done (Session 9).
    `sync_rental_open_statuses()` (`0006_due_today_overdue_status_
    automation.sql`) recomputes active/due_today/overdue from
    `return_date` for open rentals; scheduled via `pg_cron` when
    available (guarded, doesn't fail the migration if not), plus a
    manual "Sync statuses" button on the admin Rentals list for
    on-demand runs. `deriveDisplayStatus()` stays as-is as a same-day
    display fallback.

13. Production-readiness pass: accessibility audit, performance
    (pagination/lazy loading once real data volume exists), dark mode
    visual QA. **Partially done (Sessions 11, 16, 19)** — see
    COMPLETED.md. Accessibility (dialog keyboard/focus behavior,
    unlabeled search inputs, decorative icons, skip-link + `<main>`
    landmark, repo-wide WCAG AA text-contrast fix for the `state-*`
    colors, `NotFound`'s missing `h1`), route-level code-splitting,
    per-route SEO (`useDocumentMeta`: title/description/canonical/
    robots/OG tags + JSON-LD Product/LocalBusiness structured data,
    `robots.txt`, `sitemap.xml` — domain confirmed same-day as
    `https://rentoolz.vercel.app`), and client-side pagination for all
    five admin lists (Products, Customers, Enquiries, Purchase Requests,
    Rentals — `usePagination` hook + `Pagination` control, pageSize 20)
    are done. Still open: dynamic sitemap entries for individual
    `/products/:id` / `/categories/:id` pages (needs a live Supabase
    project to enumerate from — see item 1), *visual* dark-mode QA on a
    real device/browser (a code-level class audit found no gaps, but
    that's not a substitute for actually looking at it rendered), and a
    full screen-reader pass — genuinely blocked, re-confirmed Session 16
    (attempted a headless-browser install; this environment's network
    egress only reaches package registries, not browser-download CDNs).

14. ~~Fix `npm run lint`~~ — found already fixed (Session 13). Docs from
    Session 4 onward claimed ESLint had no config and failed immediately;
    inspecting the actual repo this session found `.eslintrc.cjs` already
    present and `npm run lint` already passing with zero errors/warnings.
    Whoever added it didn't update the docs — corrected here rather than
    re-doing work that was already done.

15. Enquiries list/search is currently client-side (fetch-all then filter
    in the browser), unlike Customers which searches server-side. Fine at
    current expected volume; revisit if enquiry volume grows (see
    CURRENT-STATE.md "Known limitations").

16. ~~Public "request a purchase" form~~ — done (Session 6). New route
    `/request-purchase` (`RequestPurchase.tsx`), triggered from
    `ProductDetail` when the selected variant has 0 available quantity
    (`RequestPurchaseButton` swaps in for `EnquiryButton`). Required an
    additive migration (`0004_purchase_requests_name.sql`) — the table had
    no way to capture a requester's name for anonymous public submissions.

17. Purchase Requests list/search is client-side, same tradeoff as item 15
    — fine at current expected volume.

18. ~~Settings screen~~ — done (Session 15). `/admin/settings`: business
    contact info (phone/WhatsApp/email/address, now DB-driven via new
    `site_settings` table instead of hard-coded), appearance (theme
    preference, reuses the existing `useTheme` provider — no new state),
    and admin account (change email / change password via Supabase
    Auth). No scope was ever given for this beyond being listed under
    "What's NOT built" — confirmed with the user what to include before
    building (contact info + admin account + theme, not a broader admin
    user management UI).

## Smaller follow-ups noted along the way

- ~~Product/variant create-or-update is not wrapped in a DB transaction~~
  — done (Session 14). `admin_save_product_with_variants()` RPC
  (`0007_product_variant_transaction.sql`) wraps product create/update +
  variant upsert in one transaction. Variant *deletion* stays a separate
  explicit call, per DECISIONS.md.

- ~~`admin-rentals.service.ts` does not pre-check variant availability
  client-side~~ — already done, docs were stale. `RentalForm.tsx`
  disables sold-out variants and validates quantity against
  `availableQuantity` (reused from the public product hooks) before
  submit; the DB trigger stays the real enforcement layer for the
  race-condition case. Corrected here (Session 13) after inspecting the
  actual code per the recovery process.

- Rentals list still computes `displayStatus` (due_today/overdue)
  client-side on every fetch via `deriveDisplayStatus()`, even though
  item 12's DB-side automation has since landed (Session 9). Reconsidered
  during this pass: this isn't stale, it's intentional — the DB function
  only runs on a schedule (or on-demand via "Sync statuses"), so
  `deriveDisplayStatus()` stays as the same-day fallback for the gap
  between a return date changing and the next sync (documented in
  CURRENT-STATE.md "Known limitations"). No action needed.

- `RentalForm`'s enquiry-conversion prefill only pre-selects a category
  and product (from the enquiry's linked `product_id`, if any) — it
  deliberately does not attempt to guess a specific variant/size, since
  the public enquiry form doesn't capture that granularity. The admin
  always chooses the size manually during conversion.
