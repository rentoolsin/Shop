import {
  List,
  House,
  Wrench,
  MagnifyingGlass,
  Heart,
  ShoppingCart,
  Info,
  Phone,
  PaperPlaneTilt,
  Package,
  CaretRight,
  type Icon,
} from "@phosphor-icons/react";
import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { SideDrawer } from "../ui/SideDrawer";
import { useSiteSettings } from "../../hooks/useSiteSettings";
import { DEFAULT_BOTTOM_NAV_ITEMS } from "../../utils/bottom-nav";

interface MenuLink {
  to: string;
  label: string;
  icon: Icon;
}

// Every public page — this is filtered down below to just the ones the
// current bottom nav doesn't already cover, so it works as a full sitemap
// regardless of which 5 tabs an admin has configured.
const ALL_MENU_LINKS: MenuLink[] = [
  { to: "/", label: "Home", icon: House },
  { to: "/products", label: "Tools", icon: Wrench },
  { to: "/search", label: "Search", icon: MagnifyingGlass },
  { to: "/saved", label: "Wishlist", icon: Heart },
  { to: "/cart", label: "Cart", icon: ShoppingCart },
  { to: "/enquire", label: "Send an enquiry", icon: PaperPlaneTilt },
  { to: "/request-purchase", label: "Request a tool", icon: Package },
  { to: "/about", label: "About", icon: Info },
  { to: "/contact", label: "Contact", icon: Phone },
];

/**
 * Hamburger trigger + side-drawer menu — sits in MobileHeader next to the
 * theme toggle so every page reachable on desktop (via DesktopHeader's nav
 * + Footer links) stays reachable on mobile too. Only lists pages that
 * AREN'T one of the bottom nav's current tabs — those already have a
 * permanent, faster entry point, so repeating them here would just be
 * clutter. Reads the same admin-configured list (falling back to
 * DEFAULT_BOTTOM_NAV_ITEMS) that BottomNavigation itself renders from, so
 * the two stay in sync automatically as that config changes.
 */
export function MobileMenu() {
  const [open, setOpen] = useState(false);
  const settings = useSiteSettings();

  const links = useMemo(() => {
    const bottomNavItems =
      settings.status === "success" && settings.data.bottomNavItems.length > 0
        ? settings.data.bottomNavItems
        : DEFAULT_BOTTOM_NAV_ITEMS;
    const bottomNavPaths = new Set(bottomNavItems.map((item) => item.path));
    return ALL_MENU_LINKS.filter((link) => !bottomNavPaths.has(link.to));
  }, [settings]);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label="Open menu"
        className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full text-ink transition-all duration-150 ease-app hover:bg-graphite-100 active:scale-90 dark:text-ink-inverted dark:hover:bg-graphite-800"
      >
        <List className="h-5 w-5" weight="regular" />
      </button>

      <SideDrawer open={open} onClose={() => setOpen(false)} title="Menu">
        <nav aria-label="More pages">
          <ul>
            {links.map(({ to, label, icon: LinkIcon }) => (
              <li key={to}>
                <Link
                  to={to}
                  onClick={() => setOpen(false)}
                  className="flex items-center gap-3 rounded px-2 py-3 font-body text-[14.5px] font-medium text-ink transition-colors hover:bg-graphite-100 dark:text-ink-inverted dark:hover:bg-graphite-800"
                >
                  <LinkIcon className="h-5 w-5 flex-shrink-0 text-graphite-400" weight="regular" />
                  <span className="flex-1">{label}</span>
                  <CaretRight className="h-4 w-4 flex-shrink-0 text-graphite-300 dark:text-graphite-600" weight="regular" />
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      </SideDrawer>
    </>
  );
}

