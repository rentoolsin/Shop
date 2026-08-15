import { Home, Phone, Search, Send, Wrench, type LucideIcon } from "lucide-react";
import { NavLink } from "react-router-dom";

interface NavItem {
  to: string;
  label: string;
  Icon: LucideIcon;
  end?: boolean;
  /** Renders as a raised, always-accent action (the primary conversion tab). */
  emphasized?: boolean;
}

// Five explicit destinations — nothing tucked behind a catch-all "More" tab.
// Enquire sits centered and visually raised as the app's primary action,
// same role "Analytics" plays in the reference nav (a permanently-tinted
// middle tab), just pointed at RenTools' own core action instead.
const items: NavItem[] = [
  { to: "/", label: "Home", Icon: Home, end: true },
  { to: "/search", label: "Search", Icon: Search },
  { to: "/enquire", label: "Enquire", Icon: Send, emphasized: true },
  { to: "/products", label: "Tools", Icon: Wrench },
  { to: "/contact", label: "Contact", Icon: Phone },
];

export function BottomNavigation() {
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
        {items.map(({ to, label, Icon, end, emphasized }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            className="group relative flex flex-1 flex-col items-center gap-1 py-1 outline-none"
          >
            {({ isActive }) =>
              emphasized ? (
                <>
                  <span
                    className={[
                      "flex h-11 w-11 -translate-y-3 items-center justify-center rounded-full bg-gradient-to-b from-accent-400 to-accent-500 transition-transform duration-300 ease-app",
                      "shadow-[0_6px_16px_-4px_rgba(240,168,27,0.65)] group-active:scale-90",
                      isActive ? "scale-105" : "",
                    ].join(" ")}
                  >
                    <Icon className="h-5 w-5 text-graphite-950" strokeWidth={2} />
                  </span>
                  <span
                    className={[
                      "-mt-2 font-body text-[11px] leading-none transition-colors duration-200",
                      isActive
                        ? "font-semibold text-ink dark:text-ink-inverted"
                        : "text-graphite-500 dark:text-graphite-400",
                    ].join(" ")}
                  >
                    {label}
                  </span>
                </>
              ) : (
                <>
                  <span
                    aria-hidden
                    className={[
                      "absolute -top-2.5 h-[3px] w-6 rounded-full bg-accent-500 transition-all duration-300 ease-app",
                      isActive ? "opacity-100" : "opacity-0",
                    ].join(" ")}
                  />
                  <span className="flex h-6 w-6 items-center justify-center transition-transform duration-200 ease-app group-active:scale-90">
                    <Icon
                      className={isActive ? "h-[21px] w-[21px] text-accent-500" : "h-[21px] w-[21px] text-graphite-400"}
                      strokeWidth={isActive ? 2.1 : 1.7}
                      fill={isActive ? "currentColor" : "none"}
                      fillOpacity={isActive ? 0.16 : 1}
                    />
                  </span>
                  <span
                    className={[
                      "font-body text-[11px] leading-none transition-colors duration-200",
                      isActive
                        ? "font-semibold text-ink dark:text-ink-inverted"
                        : "text-graphite-500 dark:text-graphite-400",
                    ].join(" ")}
                  >
                    {label}
                  </span>
                </>
              )
            }
          </NavLink>
        ))}
      </div>
    </nav>
  );
}
