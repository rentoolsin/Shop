# CLAUDE.md — RenTools

RenTools: construction tool/equipment rental app for a business in Kovilmedu,
Coimbatore, Tamil Nadu. Full requirements: see the original master prompt
(not stored here — this file + docs/ + project-state/ are the working
summary).

## Recovery protocol (multi-session)

Priority when resuming work: **actual code > migrations > project-state
docs > previous chat.** At the start of any session:

1. `git status` and relevant `git diff`.
2. Read `project-state/CURRENT-STATE.md`.
3. Inspect recently changed files under `src/` and `supabase/migrations/`.
4. Continue from what's actually implemented — don't trust a state file
   that claims something is done if the code says otherwise, and don't
   rebuild something that's already partially there.

## Stack (locked)

React + TypeScript + Vite + Tailwind + React Router · Supabase (Postgres,
Auth, Storage) · Vercel-compatible build. No other backend/framework — see
`docs/ARCHITECTURE.md`.

## Key docs

- `docs/BUSINESS-RULES.md` — rental math, inventory, statuses
- `docs/DESIGN-SYSTEM.md` — tokens, type, the "spec-tag" signature element
- `docs/ROUTES.md` — public route table
- `docs/ARCHITECTURE.md` — folder layout, reusable-component rule
- `docs/SECURITY.md` — RLS model, admin auth, secrets handling
- `project-state/CURRENT-STATE.md` — what's actually built right now

## Ground rules

- Reuse/extend/compose existing components before creating new ones.
- One authoritative implementation of rental math: `src/utils/rental-calculations.ts`,
  mirrored in `supabase/migrations/0001_init_schema.sql` (DB is the
  enforcement layer, frontend is the UX layer).
- Never invent product prices, specs, brands, or availability — Admin
  configures those.
- No `git push` / remote git operations — the user controls GitHub.
