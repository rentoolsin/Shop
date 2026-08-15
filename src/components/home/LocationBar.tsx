import { useSiteSettings } from "../../hooks/useSiteSettings";
import { SITE_SETTINGS_DEFAULTS } from "../../utils/site-settings";
import { ShopLocationRow } from "./ShopLocationRow";

/**
 * Shop-location strip at the top of the homepage hero (see
 * `ShopLocationRow` / `site_settings.latitude/longitude` /
 * `utils/geo.ts`). Previously paired with a separate "your location"
 * delivery-area picker, but that was dropped — tapping this row already
 * answers the question directly (how far the shop is from you), so a
 * second field was redundant.
 */
export function LocationBar() {
  const settings = useSiteSettings();
  const { address, latitude, longitude } =
    settings.status === "success" ? settings.data : SITE_SETTINGS_DEFAULTS;

  return (
    <div className="rounded border border-graphite-200 bg-white shadow-card dark:border-graphite-800 dark:bg-graphite-900/80">
      <ShopLocationRow address={address} latitude={latitude} longitude={longitude} />
    </div>
  );
}
