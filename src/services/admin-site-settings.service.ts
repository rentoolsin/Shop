import { supabase } from "../lib/supabase";
import { SITE_SETTINGS_DEFAULTS, type SiteSettings } from "../utils/site-settings";
import { parseBottomNavItems } from "../utils/bottom-nav";

/** Same read as the public service, reused rather than duplicated — the
 * only difference for an admin is that RLS also lets them write. */
export async function fetchAdminSiteSettings(): Promise<SiteSettings> {
  const { data, error } = await supabase
    .from("site_settings")
    .select("phone, whatsapp, email, address, latitude, longitude, bottom_nav_items")
    .eq("id", true)
    .maybeSingle();

  if (error) throw error;
  if (!data) return SITE_SETTINGS_DEFAULTS;

  return {
    phone: data.phone,
    whatsapp: data.whatsapp,
    email: data.email,
    address: data.address,
    latitude: data.latitude,
    longitude: data.longitude,
    bottomNavItems: parseBottomNavItems(data.bottom_nav_items),
  };
}

export async function updateSiteSettings(values: SiteSettings): Promise<void> {
  const { error } = await supabase
    .from("site_settings")
    .update({
      phone: values.phone,
      whatsapp: values.whatsapp,
      email: values.email,
      address: values.address,
      latitude: values.latitude,
      longitude: values.longitude,
      bottom_nav_items: values.bottomNavItems,
      updated_at: new Date().toISOString(),
    })
    .eq("id", true);
  if (error) throw error;
}
