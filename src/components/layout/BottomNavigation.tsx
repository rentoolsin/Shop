import { NavLink } from "react-router-dom";
import { useSiteSettings } from "../../hooks/useSiteSettings";
import { BOTTOM_NAV_ICONS, DEFAULT_BOTTOM_NAV_ITEMS, type BottomNavItem } from "../../utils/bottom-nav";

// The bar's items (icon, label, target page, order, count) are
// admin-editable from /admin/settings — see the "Bottom navigation"
// section there — and persisted on site_settings.bottom_nav_items.
// This component just renders whatever list it's given; it no longer
// owns the item list itself. Until settings load (or if they fail to
// load), it falls back to DEFAULT_BOTTOM_NAV_ITEMS, which reproduces the
// bar exactly as it was before this became configurable.
//
// Every tab shares the same active/inactive treatment: whichever one is
// active gets the raised accent circle, the rest sit plain like an
// unselected Home tab.

export function BottomNavigation() {
  const settings = useSiteSettings();
  const items: BottomNavItem[] =
    settings.status === "success" && settings.data.bottomNavItems.length > 0
      ? settings.data.bottomNavItems
      : DEFAULT_BOTTOM_NAV_ITEMS;

  return (
    <nav
      aria-label="Primary"
      className={[
        "rounded-t-3xl border-t border-graphite-200/80 bg-white/90 pb-safe-b backdrop-blur-xl",
        "shadow-[0_-8px_24px_-12px_rgb(0_0_0_/_0.12)]",
        "dark:border-graphite-800/80 dark:bg-graphite-900/90",
      ].join(" ")}
    >
      <div className="mx-auto flex max-w-[420px] items-end justify-around px-1 pb-1.5 pt-2.5">
        {items.map(({ id, label, icon, path }) => {
          const Icon = BOTTOM_NAV_ICONS[icon];
          const end = path === "/";
          return (
            <NavLink
              key={id}
              to={path}
              end={end}
              className="group relative flex flex-1 flex-col items-center gap-1 py-1 outline-none"
            >
              {({ isActive }) =>
                isActive ? (
                  <>
                    <span
                      className={[
                        "flex h-11 w-11 -translate-y-3 items-center justify-center rounded-full bg-gradient-to-b from-accent-400 to-accent-500 transition-transform duration-300 ease-app",
                        "shadow-[0_6px_16px_-4px_rgba(240,168,27,0.65)] scale-105 group-active:scale-90",
                      ].join(" ")}
                    >
                      <Icon className="h-5 w-5 text-graphite-950" strokeWidth={2} />
                    </span>
                    <span className="-mt-2 font-body text-[11px] font-semibold leading-none text-ink transition-colors duration-200 dark:text-ink-inverted">
                      {label}
                    </span>
                  </>
                ) : (
                  <>
                    <span className="flex h-6 w-6 items-center justify-center transition-transform duration-200 ease-app group-active:scale-90">
                      <Icon
                        className="h-[21px] w-[21px] text-graphite-400"
                        strokeWidth={1.7}
                        fill="none"
                      />
                    </span>
                    <span className="font-body text-[11px] leading-none text-graphite-500 transition-colors duration-200 dark:text-graphite-400">
                      {label}
                    </span>
                  </>
                )
              }
            </NavLink>
          );
        })}
      </div>
    </nav>
  );
}
