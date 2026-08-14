import { supabase } from "../lib/supabase";
import { SITE_SETTINGS_DEFAULTS, type SiteSettings } from "../utils/site-settings";

/** Same read as the public service, reused rather than duplicated — the
 * only difference for an admin is that RLS also lets them write. */
export async function fetchAdminSiteSettings(): Promise<SiteSettings> {
  const { data, error } = await supabase
    .from("site_settings")
    .select("phone, whatsapp, email, address")
    .eq("id", true)
    .maybeSingle();

  if (error) throw error;
  return data ?? SITE_SETTINGS_DEFAULTS;
}

export async function updateSiteSettings(values: SiteSettings): Promise<void> {
  const { error } = await supabase
    .from("site_settings")
    .update({ ...values, updated_at: new Date().toISOString() })
    .eq("id", true);
  if (error) throw error;
}
