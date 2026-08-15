/**
 * Shared source of truth for the customer app's bottom navigation bar.
 *
 * The bar used to be a hardcoded array of 5 items inside
 * `BottomNavigation.tsx`. It's now admin-editable (icon, label, and the
 * page it links to, including reordering, adding, and removing tabs) via
 * the "Bottom navigation" section on the admin Settings screen, and
 * persisted on `site_settings.bottom_nav_items` (see
 * `0017_bottom_nav_items.sql`).
 *
 * This file is the one place both sides agree on:
 *  - `BOTTOM_NAV_ICONS` is the curated icon set an admin can pick from.
 *    Icons are referenced by a stable string key (not a component) so
 *    they can be stored as plain JSON.
 *  - `BOTTOM_NAV_PAGE_OPTIONS` is the list of built-in app pages an admin
 *    can point a tab at. An admin isn't limited to this list — the
 *    Settings editor also accepts a free-typed path, so any route
 *    (including ones added later) can be used.
 *  - `DEFAULT_BOTTOM_NAV_ITEMS` reproduces the previous hardcoded bar
 *    exactly, so sites that haven't customized anything look unchanged.
 */

import {
  Home,
  Search,
  Send,
  Wrench,
  Phone,
  ShoppingCart,
  Heart,
  Info,
  Mail,
  MapPin,
  Package,
  Tag,
  Star,
  Grid,
  List,
  User,
  Bell,
  Calendar,
  FileText,
  HelpCircle,
  type LucideIcon,
} from "lucide-react";

export const BOTTOM_NAV_ICONS = {
  home: Home,
  search: Search,
  send: Send,
  wrench: Wrench,
  phone: Phone,
  cart: ShoppingCart,
  heart: Heart,
  info: Info,
  mail: Mail,
  "map-pin": MapPin,
  package: Package,
  tag: Tag,
  star: Star,
  grid: Grid,
  list: List,
  user: User,
  bell: Bell,
  calendar: Calendar,
  "file-text": FileText,
  help: HelpCircle,
} satisfies Record<string, LucideIcon>;

export type BottomNavIconName = keyof typeof BOTTOM_NAV_ICONS;

export const BOTTOM_NAV_ICON_NAMES = Object.keys(BOTTOM_NAV_ICONS) as BottomNavIconName[];

export function isBottomNavIconName(value: string): value is BottomNavIconName {
  return Object.prototype.hasOwnProperty.call(BOTTOM_NAV_ICONS, value);
}

export interface BottomNavItem {
  /** Stable id so React keys and reordering survive label/icon edits. */
  id: string;
  label: string;
  icon: BottomNavIconName;
  /** Any in-app path, e.g. "/", "/products", "/about". Not restricted to BOTTOM_NAV_PAGE_OPTIONS. */
  path: string;
}

/** Built-in pages offered as quick picks in the admin editor. Not exhaustive — an admin can type any path. */
export const BOTTOM_NAV_PAGE_OPTIONS: { path: string; label: string }[] = [
  { path: "/", label: "Home" },
  { path: "/products", label: "Tools / Products" },
  { path: "/search", label: "Search" },
  { path: "/saved", label: "Saved" },
  { path: "/cart", label: "Cart" },
  { path: "/about", label: "About" },
  { path: "/contact", label: "Contact" },
  { path: "/enquire", label: "Enquire" },
  { path: "/request-purchase", label: "Request a tool" },
];

/** Reproduces the previous hardcoded bar exactly, used whenever no custom config has been saved yet. */
export const DEFAULT_BOTTOM_NAV_ITEMS: BottomNavItem[] = [
  { id: "default-home", label: "Home", icon: "home", path: "/" },
  { id: "default-search", label: "Search", icon: "search", path: "/search" },
  { id: "default-enquire", label: "Enquire", icon: "send", path: "/enquire" },
  { id: "default-tools", label: "Tools", icon: "wrench", path: "/products" },
  { id: "default-contact", label: "Contact", icon: "phone", path: "/contact" },
];

export const BOTTOM_NAV_MIN_ITEMS = 2;
export const BOTTOM_NAV_MAX_ITEMS = 6;

/**
 * Validates/normalizes whatever comes back from `site_settings.bottom_nav_items`
 * (jsonb, so it arrives as `unknown`). Used by both the public and admin
 * site-settings services so a malformed or partially-written row can never
 * crash the customer app's nav bar — it just falls back to the defaults.
 */
export function parseBottomNavItems(raw: unknown): BottomNavItem[] {
  if (!Array.isArray(raw) || raw.length === 0) return DEFAULT_BOTTOM_NAV_ITEMS;

  const items: BottomNavItem[] = [];
  for (const entry of raw) {
    if (
      entry &&
      typeof entry === "object" &&
      typeof (entry as Record<string, unknown>).id === "string" &&
      typeof (entry as Record<string, unknown>).label === "string" &&
      typeof (entry as Record<string, unknown>).path === "string" &&
      typeof (entry as Record<string, unknown>).icon === "string" &&
      isBottomNavIconName((entry as Record<string, unknown>).icon as string)
    ) {
      const e = entry as { id: string; label: string; path: string; icon: BottomNavIconName };
      if (e.label.trim() && e.path.trim()) {
        items.push({ id: e.id, label: e.label, path: e.path, icon: e.icon });
      }
    }
  }

  return items.length > 0 ? items : DEFAULT_BOTTOM_NAV_ITEMS;
}
