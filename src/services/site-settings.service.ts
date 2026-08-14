import { supabase } from "../lib/supabase";
import { SITE_SETTINGS_DEFAULTS, type SiteSettings } from "../utils/site-settings";

/**
 * Reads the live business contact settings. Anon read is allowed by RLS
 * (see 0008_site_settings.sql) since this is public-facing contact info,
 * not admin data. Falls back to the built-in defaults if the row is
 * missing (e.g. migration not yet applied in this environment) rather
 * than throwing — callers should treat "not loaded yet" and "using
 * defaults" the same way, same convention as homepage-content.service.ts.
 */
export async function fetchSiteSettings(): Promise<SiteSettings> {
  const { data, error } = await supabase
    .from("site_settings")
    .select("phone, whatsapp, email, address")
    .eq("id", true)
    .maybeSingle();

  if (error) throw error;
  if (!data) return SITE_SETTINGS_DEFAULTS;

  return {
    phone: data.phone,
    whatsapp: data.whatsapp,
    email: data.email,
    address: data.address,
  };
}
