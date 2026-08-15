/**
 * Authoritative shape + fallback defaults for the site-wide business
 * contact settings (`site_settings` table — see
 * 0008_site_settings.sql). Both public pages/action buttons and the
 * admin Settings screen import from here, same pattern as
 * `homepage-content.ts` for the homepage CMS.
 *
 * These defaults are the real values the business already used before
 * this table existed (previously hard-coded in src/utils/contact.ts,
 * Contact.tsx, Location.tsx) — not placeholders — so pages render
 * correctly immediately and stay correct if the live fetch is still
 * loading, errors, or the migration hasn't been applied yet.
 *
 * `bottomNavItems` (see 0017_bottom_nav_items.sql) was added so an admin
 * can edit the customer app's bottom tab bar — icon, label, and target
 * page for each tab, plus add/remove/reorder — without a code change.
 * Falls back to `DEFAULT_BOTTOM_NAV_ITEMS` (the previous hardcoded bar)
 * whenever nothing custom has been saved yet.
 */

import { DEFAULT_BOTTOM_NAV_ITEMS, type BottomNavItem } from "./bottom-nav";

export interface SiteSettings {
  phone: string; // E.164 or local with "+", e.g. "+91XXXXXXXXXX" — for tel: links
  whatsapp: string; // digits only, country code included — for wa.me links
  email: string;
  address: string;
  bottomNavItems: BottomNavItem[];
}

export const SITE_SETTINGS_DEFAULTS: SiteSettings = {
  phone: "+919688755349",
  whatsapp: "919688755349",
  email: "rentools.in@gmail.com",
  address: "Kovilmedu, Coimbatore, Tamil Nadu, India",
  bottomNavItems: DEFAULT_BOTTOM_NAV_ITEMS,
};
