import { NavLink } from "react-router-dom";
import type { ReactNode } from "react";

interface NavItem {
  to: string;
  label: string;
  icon: ReactNode;
  end?: boolean;
}

// Minimal line icons drawn inline (no icon font / emoji per design direction).
const icons = {
  home: (
    <svg viewBox="0 0 24 24" fill="none" strokeWidth={1.6} className="h-5 w-5">
      <path d="M4 11.5 12 5l8 6.5" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M6 10v9h12v-9" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  ),
  tools: (
    <svg viewBox="0 0 24 24" fill="none" strokeWidth={1.6} className="h-5 w-5">
      <path
        d="M14.7 6.3a3 3 0 0 0 4 4L14 15l-3 3-4-4 3-3 4.7-4.7Z"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path d="M4 20l3-3" stroke="currentColor" strokeLinecap="round" />
    </svg>
  ),
  search: (
    <svg viewBox="0 0 24 24" fill="none" strokeWidth={1.6} className="h-5 w-5">
      <circle cx="10.5" cy="10.5" r="6.5" stroke="currentColor" />
      <path d="M20 20l-4.3-4.3" stroke="currentColor" strokeLinecap="round" />
    </svg>
  ),
  more: (
    <svg viewBox="0 0 24 24" fill="none" strokeWidth={1.6} className="h-5 w-5">
      <circle cx="5" cy="12" r="1.4" fill="currentColor" />
      <circle cx="12" cy="12" r="1.4" fill="currentColor" />
      <circle cx="19" cy="12" r="1.4" fill="currentColor" />
    </svg>
  ),
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
      className="sticky bottom-0 z-30 border-t border-graphite-200 bg-graphite-50/95 pb-safe-b backdrop-blur-sm dark:border-graphite-800 dark:bg-graphite-950/95"
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
                  isActive
                    ? "text-signal-600 dark:text-signal-400"
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
