# Security

## RLS model (see `supabase/migrations/0001_init_schema.sql`)

- `admin_users(user_id)` + `is_admin()` SQL function is the single admin
  check used by every policy.
- Public (anon key): read-only on active/published `categories`,
  `products`, `product_variants`, `homepage_content`; insert-only on
  `enquiries` and `purchase_requests` (cannot read them back).
- Everything touching `customers` and `rentals` is admin-only, no public
  access at all.
- Admin (authenticated + present in `admin_users`): full access to
  catalog/CMS/customers/rentals; read + update (not delete) on
  enquiries/purchase requests.

## Secrets

- Frontend uses `VITE_SUPABASE_URL` / `VITE_SUPABASE_ANON_KEY` only (safe
  to ship — RLS is the real boundary). Never the service-role key.
- `.env.local` is gitignored; `.env.example` documents the required vars
  with no real values.

## Not yet built

Actual admin authentication (Supabase Auth sign-in flow, session
handling, adding rows to `admin_users`). Until that exists, the admin
policies are defined but nothing in the app can satisfy `is_admin()`.
