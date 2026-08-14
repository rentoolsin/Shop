import { useAsyncData } from "./useAsyncData";
import { fetchSiteSettings } from "../services/site-settings.service";

export function useSiteSettings() {
  return useAsyncData(fetchSiteSettings, [], { realtimeTables: ["site_settings"] });
}
