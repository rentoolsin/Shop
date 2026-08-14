import { createClient } from "@supabase/supabase-js";
import type { Database } from "../types/database";

const url = import.meta.env.VITE_SUPABASE_URL;
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Never use the service-role key on the frontend. The anon key is safe to
// ship publicly because RLS policies (supabase/migrations) enforce access.
if (!url || !anonKey) {
  console.error(
    "Supabase env vars missing. Copy .env.example to .env.local and fill in " +
      "VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY from your Supabase project.",
  );
}

export const supabase = createClient<Database>(url ?? "", anonKey ?? "");
