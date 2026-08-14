import { Home as HomeIconLucide, MoreHorizontal, Search as SearchIconLucide, Wrench } from "lucide-react";
import { NavLink } from "react-router-dom";
import type { ReactNode } from "react";

interface NavItem {
  to: string;
  label: string;
  icon: ReactNode;
  end?: boolean;
}

// Premium line-icon set (Lucide) — one shared visual language across the app.
const icons = {
  home: <HomeIconLucide className="h-5 w-5" strokeWidth={1.6} />,
  tools: <Wrench className="h-5 w-5" strokeWidth={1.6} />,
  search: <SearchIconLucide className="h-5 w-5" strokeWidth={1.6} />,
  more: <MoreHorizontal className="h-5 w-5" strokeWidth={1.6} />,
};

const items: NavItem[] = [
  { to: "/", label: "Home", icon: icons.home, end: true },
  { to: "/products", label: "Tools", icon: icons.tools },
  { to: "/search", label: "Search", icon: icons.search },
  { to: "/more", label: "More", icon: icons.more },
];

export function BottomNavigation() {
  return (
    <nav
      aria-label="Primary"
      className="border-t border-graphite-200 bg-graphite-50/95 pb-safe-b backdrop-blur-sm dark:border-graphite-800 dark:bg-graphite-950/95"
    >
      <ul className="flex h-16 items-stretch justify-around">
        {items.map((item) => (
          <li key={item.to} className="flex-1">
            <NavLink
              to={item.to}
              end={item.end}
              className={({ isActive }) =>
                [
                  "flex h-full flex-col items-center justify-center gap-1 font-body text-[11px] font-medium",
                  "transition-colors duration-150 ease-app",
                  isActive
                    ? "text-ink dark:text-ink-inverted"
                    : "text-graphite-500",
                ].join(" ")
              }
            >
              {item.icon}
              {item.label}
            </NavLink>
          </li>
        ))}
      </ul>
    </nav>
  );
}
