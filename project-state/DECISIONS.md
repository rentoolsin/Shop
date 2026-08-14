# Decisions

- **Admin check via `admin_users` table + `is_admin()` SQL function**,
  rather than a role claim or a `profiles.role` column. Simplest thing
  that supports RLS everywhere; easy to swap later if a richer roles
  model is needed.
- **Homepage sections are static JSX for now, not yet CMS-wired.** The
  CMS table (`homepage_content`) exists so this is additive later, not a
  breaking change — but building the draft/publish/revision-history admin
  editor before any other admin functionality existed seemed like the
  wrong sequencing.
- **`due_today` / `overdue` are enum values but not yet auto-derived.**
  Needs either a scheduled Supabase Edge Function or a computed view;
  deferred until the rentals admin flow exists to actually produce data
  to test it against.
- **Design accent color:** chosen a muted amber (`#D9A441`) grounded in
  tool-tag/hi-vis association, deliberately not blue (generic AI/SaaS
  default) and not the D97757 terracotta that's become its own AI-design
  tell.
- **Signature UI element:** the `.spec-tag` component (bordered mono price
  tag) — chosen to echo physical equipment rental tags rather than a
  generic pill/badge.

- **No self-service admin sign-up.** Admin accounts are created via the
  Supabase dashboard and granted access with a manual `admin_users`
  insert (`0002_admin_seed_notes.sql`) — deliberately no in-app "create
  admin account" flow, to keep the admin surface closed.
- **Product/variant create-update writes go through a transactional RPC
  (`admin_save_product_with_variants`, Session 14), not sequential client
  calls.** Originally sequential (simpler to build/reason about first;
  the failure mode was recoverable, not corrupting) — revisited per
  TODO.md's own flag once decided it was worth closing before assuming
  concurrent admin use. Variant *deletion* deliberately stays outside the
  RPC as a separate explicit call — see the next decision below, which
  this doesn't change.
- **Variant removal happens via explicit `deleteVariant` calls from the
  form**, not by diffing inside the service layer — keeps
  `admin-products.service.ts` functions single-purpose (create, update,
  delete) and the "what changed" logic visible in the form component.
