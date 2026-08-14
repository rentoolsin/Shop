import { Home, MoreHorizontal, Search, Wrench, type LucideIcon } from "lucide-react";
import { NavLink } from "react-router-dom";

interface NavItem {
  to: string;
  label: string;
  Icon: LucideIcon;
  end?: boolean;
}

// Premium line-icon set (Lucide) — one shared visual language across the app.
// Icons render outlined at rest and switch to a filled glyph on the active
// tab, matching the outline/filled convention of Instagram, Airbnb, etc.
const items: NavItem[] = [
  { to: "/", label: "Home", Icon: Home, end: true },
  { to: "/products", label: "Tools", Icon: Wrench },
  { to: "/search", label: "Search", Icon: Search },
  { to: "/more", label: "More", Icon: MoreHorizontal },
];

export function BottomNavigation() {
  return (
    <nav aria-label="Primary" className="px-3 pb-2 pt-1 pb-safe-b">
      {/* Floating glass dock — detached from the screen edge, active tab
          morphs into a filled pill with its label revealed. */}
      <div
        className={[
          "relative mx-auto flex h-16 max-w-[380px] items-stretch justify-around gap-1 rounded-[24px] px-1.5",
          "border border-white/70 bg-white/75 backdrop-blur-2xl",
          "shadow-[0_12px_32px_-10px_rgb(0_0_0_/_0.22),0_2px_6px_-2px_rgb(0_0_0_/_0.10),inset_0_1px_0_0_rgb(255_255_255_/_0.7)]",
          "dark:border-white/10 dark:bg-graphite-900/70",
          "dark:shadow-[0_12px_32px_-10px_rgb(0_0_0_/_0.6),0_2px_6px_-2px_rgb(0_0_0_/_0.4),inset_0_1px_0_0_rgb(255_255_255_/_0.06)]",
        ].join(" ")}
      >
        {items.map(({ to, label, Icon, end }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            className="group relative flex flex-1 items-center justify-center outline-none"
          >
            {({ isActive }) => (
              <span
                className={[
                  "flex items-center justify-center gap-1.5 rounded-full px-3 py-2.5 transition-all duration-300 ease-app",
                  "group-active:scale-90",
                  isActive
                    ? "bg-gradient-to-b from-accent-400 to-accent-500 text-graphite-950 shadow-[0_6px_16px_-4px_rgba(240,168,27,0.65)]"
                    : "text-graphite-500 dark:text-graphite-400",
                ].join(" ")}
              >
                <Icon
                  className={["h-[21px] w-[21px] flex-shrink-0 transition-transform duration-300 ease-app", isActive ? "scale-[1.05]" : ""].join(" ")}
                  strokeWidth={isActive ? 2.2 : 1.7}
                  fill={isActive ? "currentColor" : "none"}
                  fillOpacity={isActive ? 0.22 : 1}
                />
                <span
                  className={[
                    "overflow-hidden whitespace-nowrap font-body text-[12.5px] font-semibold leading-none transition-all duration-300 ease-app",
                    isActive ? "max-w-[72px] opacity-100" : "max-w-0 opacity-0",
                  ].join(" ")}
                >
                  {label}
                </span>
              </span>
            )}
          </NavLink>
        ))}
      </div>
    </nav>
  );
}
