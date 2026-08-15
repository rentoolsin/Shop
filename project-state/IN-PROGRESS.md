# In Progress

Nothing left mid-implementation at the end of Session 19.

## Session 19 — SEO + accessibility pass (TODO item 13, production-readiness)

A prior session had edited 20 customer-facing files (per-page
`useDocumentMeta` calls, a skip-link + `<main>` landmark, WCAG contrast
tokens) but never created the `useDocumentMeta` hook itself — every one
of those files imported a hook that didn't exist, so none of it actually
built. That's the real reason it hadn't "merged": missing dependency, not
a conflict.

Fixed:
- Added `src/hooks/useDocumentMeta.ts` — sets per-route
  title/description/canonical/robots(index|noindex)/OG tags on mount,
  reverts on unmount so metadata never leaks across client-side
  navigation; `structuredData` param injects/removes a route-scoped
  JSON-LD `<script>`. Title format is `"{page} | RenTools"`, except Home
  (`title: "RenTools"`) which is used as-is.
- Applied the prior session's 20 files as-is on top of current `main`
  (only trivial rebasing — none touched the same lines as the same-day
  "UX" commit).
- Added `docs/DESIGN-AUDIT.md`: measured WCAG contrast ratios (WCAG
  relative-luminance formula, not a spot check) for the `state-*-text`
  tokens `tailwind.config.ts` already had comments pointing at.
- Extended the contrast fix (`text-state-<tone>` → text-safe
  `-text`/`-text-dark` pair) beyond the 4 shared UI components the prior
  session touched to every other real-text usage found repo-wide:
  `CustomerPicker`, `StatCard`, `ImageInput`, `AdminMore`, `Login`,
  `RentalsList`, `RentalForm`, `PurchaseRequestDetail`,
  `PurchaseRequestForm`, `ProductForm`, `ProductsList`, `EnquiryDetail`.
  Left the two `aria-hidden` success-checkmark icons (Enquire,
  RequestPurchase) on the base tone — icons are governed by the more
  lenient 3:1 rule and already pass; see DESIGN-AUDIT.md.
- `NotFound.tsx`: added a visually-hidden (`sr-only`) `h1` — this route
  skips `PageHeader`, so `EmptyState`'s `h3` was the only heading on the
  page, leaving it without a real top-level landmark.
- Added `public/robots.txt` (disallows `/admin/`, allows the rest). Did
  **not** add `sitemap.xml`: a sitemap's `<loc>` entries must be absolute
  URLs and, per the existing comment in `index.html`, no production
  domain is defined anywhere in this repo — guessing one would ship a
  broken sitemap. Add it once a domain is set (`robots.txt` already has
  a commented `Sitemap:` line ready to uncomment).

`npm install` / `npx tsc -b` / `npm run build` all pass. `npm run lint`
has 1 pre-existing error + 2 pre-existing warnings, all in files this
session didn't touch (`useAsyncData.ts`, `more-items.tsx`,
`ProductsList.tsx`'s unrelated `useMemo` dep) — confirmed pre-existing
via `git stash` against the same-day "UX" commit before making any
changes.

Not verified: real screen-reader pass and Open Graph/Twitter share-card
preview on a real device — same recurring sandbox limitation as prior
sessions (no browser/device here). Structured data was validated by
parsing the built `dist/index.html` JSON-LD as JSON, not against
Google's Rich Results Test (no network path to it from this sandbox).

**Addendum, same day:** user confirmed the production domain —
`https://rentoolz.vercel.app`. Closed out everything Session 19 had left
blocked on it:
- `public/sitemap.xml` added (static indexable routes only: `/`,
  `/products`, `/about`, `/contact`, `/location`, `/more` — see the
  in-file comment for why `/products/:id`/`/categories/:id` and the
  noindex routes are excluded).
- `robots.txt`'s `Sitemap:` line uncommented and pointed at it.
- `index.html`: `og:image` and the LocalBusiness JSON-LD `image` made
  absolute (both now `https://rentoolz.vercel.app/...`); added a static
  `og:url` and `<link rel="canonical">` for the root route/crawlers that
  don't execute JS (useDocumentMeta still overrides both per-route via
  `window.location.origin` for real navigation) and `url` on the
  LocalBusiness JSON-LD.

`npx tsc -b` / `npm run build` re-verified after; JSON-LD re-parsed from
`dist/index.html` and `dist/sitemap.xml` re-parsed as XML, both valid.

---

## Session 18 — Admin mobile UI pass (Rentals) + admin bottom nav

Redesigned `/admin/rentals` to a mobile-app style per a user-supplied
reference screenshot (pill controls, segmented Rentals/Sync-statuses row,
illustrated empty state, restyled cards with real product thumbnails —
`productImageUrl` added to `admin-rentals.service.ts`). Business logic
(extend/return/cancel/sync/validation) untouched.

Added an admin mobile bottom tab bar (`AdminMobileNav`: Home, Rentals,
Requests, Products, Customers, More) alongside a new `/admin/more` page
for the sections that don't fit six tabs. The existing sidebar
(`AdminLayout`) is now desktop-only; shared nav icons factored into
`components/admin/nav-icons.tsx` to avoid duplicating them between the
sidebar and the new tab bar. `EmptyState` gained optional `size`/
`className` props and `Select` gained a `pill` variant (both backward
compatible) rather than one-off page-specific markup.

`npm install` / `npx tsc --noEmit` / `npm run build` / `eslint` all pass.

**Toolchain note:** this session's environment had working network
access to npm registries (`npm install` succeeded), contradicting the
"no network in this sandbox" assumption baked into several earlier
sessions' notes. Worth re-checking rather than assuming either way at the
start of future sessions.

Not verified: anything requiring a live Supabase project, and no real
browser/device for a visual pass on the new mobile nav/rentals styling.

---

Session 17 recap (previous):

## Session 17 — PWA + install banner

`vite-plugin-pwa` wired up (manifest + Workbox service worker,
auto-update, admin routes excluded from the navigate fallback). Icons
generated to match the existing design system since no real business
logo exists yet — swap `public/pwa-*.png`/`apple-touch-icon.png`/
`favicon.ico` for real brand assets whenever the user provides one; nothing
else needs to change (icon paths are only referenced from
`vite.config.ts`'s manifest block and `index.html`).

New `useInstallPrompt` hook + `InstallAppBanner` component (public app
only, dismissible, 14-day re-offer cooldown via localStorage).

`npm install` / `npm run typecheck` / `npm run lint` / `npm run build`
all pass; build output confirms the manifest/service worker generate
correctly.

**Not verified** (same recurring environment limit): the SW only runs in
a production build (`devOptions.enabled: false`, intentional — avoids
dev-mode caching headaches), so testing the actual install banner and
"Add to Home Screen" behavior needs `npm run build && npm run preview`
on a real Android/desktop Chrome and real iOS Safari — no real
browser/device available in this sandbox.

---

Session 16 recap (previous):

## Session 16 — Client-side pagination for admin lists (TODO item 13, pagination piece)

Picked up mid-session work left by the previous account: a shared
`usePagination` hook and `Pagination` control had been built and wired
into all five admin list pages (Products, Customers, Enquiries, Purchase
Requests, Rentals), but `usePagination.ts` and `Pagination.tsx` had been
created in the wrong directories
(`src/pages/admin/purchase-requests/usePagination.ts` and
`src/pages/admin/Pagination.tsx`) while every list imported them from
`src/hooks/usePagination` and `src/components/ui/Pagination` — those
paths didn't exist, so the app didn't build. `RentalsList.tsx` was also
left mid-edit: it called `usePagination` but still rendered the
unpaginated `rows.map(...)` and never rendered the `<Pagination>`
control.

Fixed:
- Moved the two files to their correct reusable locations
  (`src/hooks/usePagination.ts`, `src/components/ui/Pagination.tsx`).
- `RentalsList.tsx`: switched the render to `pageItems.map(...)` and
  added the `<Pagination>` control after the list, matching the pattern
  already correct in the other four list pages.
- Removed a now-unnecessary `eslint-disable-next-line` in
  `usePagination.ts` that lint flagged as unused after the move.

`usePagination` slices an already-fetched, already-filtered array
client-side (pageSize 20, `resetKey` resets to page 1 on filter/search
change, defensively clamps if the result set shrinks) — this project's
established fetch-all-then-derive pattern is unchanged; pagination only
bounds what's rendered, not what's fetched. Real server-side pagination
was ruled out for Rentals specifically since `displayStatus` (due_today/
overdue) is derived client-side via `deriveDisplayStatus()`, not a plain
filterable DB column.

Verified `npm install` / `npm run typecheck` / `npm run lint` /
`npm run build` all pass.

Not verified: actual scroll/visual behavior of the pager on a real
device, and whether 20-per-page is the right size against real data
volume (no live Supabase project or real device in this environment,
same limitation as everything else — see "Known limitations").

Still open from TODO item 13: visual dark-mode QA and a full
screen-reader pass on a real device/browser — confirmed still genuinely
blocked (attempted a headless-browser install; network egress here only
reaches package registries, not browser-download CDNs).

---

Session 15 recap (previous):

Session 15 re-confirmed (per the recovery process) that this session's
five flagged items — Enquiries, Enquiry→Rental conversion, Purchase
Requests, Admin Dashboard, Reports — and Homepage CMS were all already
genuinely complete, then built the Settings screen per explicit user
direction after confirming scope (business contact info, appearance,
admin account):

- New `site_settings` singleton table (`0008_site_settings.sql`),
  seeded with the real values previously hard-coded across
  `src/utils/contact.ts` (now deleted), `Contact.tsx`, and
  `Location.tsx`.
- `/admin/settings`: contact-info form (phone/WhatsApp/email/address),
  appearance toggle (light/dark/system, built on the existing
  `useTheme`), admin-account form (change email/password via Supabase
  Auth).
- `Home.tsx`, `ProductDetail.tsx`, `Contact.tsx`, `Location.tsx` switched
  from hard-coded constants to `useSiteSettings()`, with the same
  defaults used as a loading/error fallback so none of these pages
  regressed.

`npm install` / `npm run typecheck` / `npm run lint` / `npm run build`
all pass end-to-end.

There is no further purely-code-level TODO item open right now — see
CURRENT-STATE.md "Next TODO" for what's next (needs either new
direction from the user, a real Supabase project, or a real
device/browser for the still-blocked parts of TODO item 13).
