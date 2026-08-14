# Recovery

If you're a new Claude session/account picking this up:

1. Read `CLAUDE.md` first, then this file, then `project-state/CURRENT-STATE.md`.
2. Run `git status` / `git log --oneline -10` / relevant `git diff` — the
   repo is the source of truth, not this file, if they disagree.
3. Check whether `npm install` has ever actually succeeded in your
   environment. As of the last session that wrote this file, it had not
   (sandboxed, no network) — the entire codebase is untested against a
   real toolchain. Don't assume it type-checks or builds; verify.
4. Check whether a Supabase project is actually linked (`.env.local`
   present and non-empty) and whether `0001_init_schema.sql` has been
   applied. If unclear, inspect the Supabase dashboard directly rather
   than trusting this file.
5. Cross-check `project-state/TODO.md` against what's actually in `src/`
   and `supabase/migrations/` before starting new work — a TODO item may
   already be partially done.

Do not re-ask the user what happened unless the repository genuinely
can't answer it.
