import { useState, type ReactNode } from "react";
import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { useAuth } from "../../lib/auth";
import { useToast } from "../ui/Toast";

const NAV_ITEMS: { to: string; label: string; end?: boolean; icon: ReactNode }[] = [
  {
    to: "/admin",
    label: "Dashboard",
    end: true,
    icon: (
      <svg viewBox="0 0 20 20" fill="none" className="h-[18px] w-[18px]">
        <path d="M3 10.5 10 4l7 6.5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M5 9v6.5a.5.5 0 0 0 .5.5H8a.5.5 0 0 0 .5-.5V12a.5.5 0 0 1 .5-.5h2a.5.5 0 0 1 .5.5v3.5a.5.5 0 0 0 .5.5h2.5a.5.5 0 0 0 .5-.5V9" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
  },
  {
    to: "/admin/enquiries",
    label: "Enquiries",
    icon: (
      <svg viewBox="0 0 20 20" fill="none" className="h-[18px] w-[18px]">
        <path d="M3.5 5.5A1.5 1.5 0 0 1 5 4h10a1.5 1.5 0 0 1 1.5 1.5v7A1.5 1.5 0 0 1 15 14H8l-3.5 2.5V14H5A1.5 1.5 0 0 1 3.5 12.5v-7Z" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" />
      </svg>
    ),
  },
  {
    to: "/admin/purchase-requests",
    label: "Purchase Requests",
    icon: (
      <svg viewBox="0 0 20 20" fill="none" className="h-[18px] w-[18px]">
        <path d="M4 3.5h9l3 3V16a.5.5 0 0 1-.5.5H4a.5.5 0 0 1-.5-.5V4a.5.5 0 0 1 .5-.5Z" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" />
        <path d="M7 9h6M7 12h6" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
      </svg>
    ),
  },
  {
    to: "/admin/rentals",
    label: "Rentals",
    icon: (
      <svg viewBox="0 0 20 20" fill="none" className="h-[18px] w-[18px]">
        <rect x="3.5" y="5" width="13" height="11" rx="1.2" stroke="currentColor" strokeWidth="1.6" />
        <path d="M6.5 3v3M13.5 3v3M3.5 8.5h13" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
      </svg>
    ),
  },
  {
    to: "/admin/customers",
    label: "Customers",
    icon: (
      <svg viewBox="0 0 20 20" fill="none" className="h-[18px] w-[18px]">
        <circle cx="10" cy="7" r="2.75" stroke="currentColor" strokeWidth="1.6" />
        <path d="M4 16c0-2.9 2.7-5 6-5s6 2.1 6 5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
      </svg>
    ),
  },
  {
    to: "/admin/products",
    label: "Products",
    icon: (
      <svg viewBox="0 0 20 20" fill="none" className="h-[18px] w-[18px]">
        <path d="M10 3 3.5 6.5 10 10l6.5-3.5L10 3Z" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" />
        <path d="M3.5 6.5V13L10 16.5M16.5 6.5V13L10 16.5M10 10v6.5" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" />
      </svg>
    ),
  },
  {
    to: "/admin/categories",
    label: "Categories",
    icon: (
      <svg viewBox="0 0 20 20" fill="none" className="h-[18px] w-[18px]">
        <rect x="3.5" y="3.5" width="5.5" height="5.5" rx="1" stroke="currentColor" strokeWidth="1.6" />
        <rect x="11" y="3.5" width="5.5" height="5.5" rx="1" stroke="currentColor" strokeWidth="1.6" />
        <rect x="3.5" y="11" width="5.5" height="5.5" rx="1" stroke="currentColor" strokeWidth="1.6" />
        <rect x="11" y="11" width="5.5" height="5.5" rx="1" stroke="currentColor" strokeWidth="1.6" />
      </svg>
    ),
  },
  {
    to: "/admin/reports",
    label: "Reports",
    icon: (
      <svg viewBox="0 0 20 20" fill="none" className="h-[18px] w-[18px]">
        <path d="M4 16.5V9M10 16.5V3.5M16 16.5v-5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
      </svg>
    ),
  },
  {
    to: "/admin/homepage",
    label: "Homepage",
    icon: (
      <svg viewBox="0 0 20 20" fill="none" className="h-[18px] w-[18px]">
        <path d="M3 9.5 10 4l7 5.5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M5 8.5v7a.5.5 0 0 0 .5.5h9a.5.5 0 0 0 .5-.5v-7" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
  },
  {
    to: "/admin/settings",
    label: "Settings",
    icon: (
      <svg viewBox="0 0 20 20" fill="none" className="h-[18px] w-[18px]">
        <circle cx="10" cy="10" r="2.5" stroke="currentColor" strokeWidth="1.6" />
        <path
          d="M10 3.5v1.6M10 14.9v1.6M16.5 10h-1.6M5.1 10H3.5M14.6 5.4l-1.13 1.13M6.53 13.47 5.4 14.6M14.6 14.6l-1.13-1.13M6.53 6.53 5.4 5.4"
          stroke="currentColor"
          strokeWidth="1.6"
          strokeLinecap="round"
        />
      </svg>
    ),
  },
];

function CollapseIcon({ collapsed }: { collapsed: boolean }) {
  return (
    <svg viewBox="0 0 20 20" fill="none" className={["h-4 w-4 transition-transform duration-150 ease-app", collapsed ? "rotate-180" : ""].join(" ")}>
      <path d="M12.5 4.5 7 10l5.5 5.5" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function HelpIcon() {
  return (
    <svg viewBox="0 0 20 20" fill="none" className="h-[18px] w-[18px]">
      <circle cx="10" cy="10" r="7" stroke="currentColor" strokeWidth="1.6" />
      <path d="M7.8 8a2.2 2.2 0 1 1 3.15 1.98c-.65.32-1.15.72-1.15 1.52v.3" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx="10" cy="14.1" r="0.15" fill="currentColor" stroke="currentColor" strokeWidth="0.9" />
    </svg>
  );
}

export function AdminLayout() {
  const { signOut, session } = useAuth();
  const navigate = useNavigate();
  const { showToast } = useToast();
  const [collapsed, setCollapsed] = useState(
    () => typeof window !== "undefined" && window.innerWidth < 768,
  );

  const handleSignOut = async () => {
    await signOut();
    navigate("/admin/login", { replace: true });
  };

  const handleHelp = () => {
    showToast("Need a hand? Reach out to your RenTools contact for support.", "default");
  };

  return (
    <div className="flex min-h-screen bg-graphite-50 dark:bg-graphite-950">
      <aside
        className={[
          "sticky top-0 flex h-screen shrink-0 flex-col border-r border-graphite-200 bg-white transition-[width] duration-200 ease-app dark:border-graphite-800 dark:bg-graphite-900",
          collapsed ? "w-[76px]" : "w-64",
        ].join(" ")}
      >
        <div className="flex h-14 items-center justify-between border-b border-graphite-200 px-3 dark:border-graphite-800">
          {collapsed ? (
            <span className="mx-auto font-display text-[14px] font-extrabold tracking-tight text-ink dark:text-ink-inverted">
              RTA
            </span>
          ) : (
            <span className="truncate font-display text-[16px] font-extrabold tracking-tight text-ink dark:text-ink-inverted">
              RenTools Admin
            </span>
          )}
          <button
            type="button"
            aria-label={collapsed ? "Expand navigation" : "Collapse navigation"}
            onClick={() => setCollapsed((c) => !c)}
            className={[
              "flex h-8 w-8 flex-shrink-0 items-center justify-center rounded text-graphite-500 hover:bg-graphite-100 dark:text-graphite-400 dark:hover:bg-graphite-800",
              collapsed ? "hidden" : "",
            ].join(" ")}
          >
            <CollapseIcon collapsed={collapsed} />
          </button>
        </div>

        <nav className="flex flex-1 flex-col gap-0.5 overflow-y-auto px-2.5 py-4">
          {NAV_ITEMS.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              title={collapsed ? item.label : undefined}
              className={({ isActive }) =>
                [
                  "flex h-11 items-center gap-2.5 rounded-lg font-body text-[13.5px] font-medium transition-colors duration-150 ease-app",
                  collapsed ? "justify-center px-0" : "px-3",
                  isActive
                    ? "bg-signal-500 text-graphite-950"
                    : "text-graphite-600 hover:bg-graphite-100 dark:text-graphite-300 dark:hover:bg-graphite-800",
                ].join(" ")
              }
            >
              {item.icon}
              {!collapsed && <span className="truncate">{item.label}</span>}
            </NavLink>
          ))}
        </nav>

        {collapsed && (
          <div className="flex justify-center border-t border-graphite-200 px-2.5 py-3 dark:border-graphite-800">
            <button
              type="button"
              aria-label="Expand navigation"
              onClick={() => setCollapsed(false)}
              className="flex h-9 w-9 items-center justify-center rounded-lg text-graphite-500 hover:bg-graphite-100 dark:text-graphite-400 dark:hover:bg-graphite-800"
            >
              <CollapseIcon collapsed={false} />
            </button>
          </div>
        )}

        <div className={["border-t border-graphite-200 dark:border-graphite-800", collapsed ? "px-2.5 py-3" : "px-3 py-3"].join(" ")}>
          <button
            type="button"
            onClick={handleHelp}
            title="Need help?"
            className={[
              "flex h-11 w-full items-center gap-2 rounded-lg bg-signal-50 font-body text-[13px] font-medium text-signal-700 hover:bg-signal-100 dark:bg-signal-500/10 dark:text-signal-300 dark:hover:bg-signal-500/20",
              collapsed ? "justify-center px-0" : "px-3",
            ].join(" ")}
          >
            <HelpIcon />
            {!collapsed && <span>Need help?</span>}
          </button>

          {!collapsed && (
            <div className="mt-3 flex items-center justify-between gap-2">
              <span className="truncate font-body text-[11px] text-graphite-400">
                {session?.user.email}
              </span>
              <button
                type="button"
                onClick={handleSignOut}
                className="flex-shrink-0 font-body text-[11px] font-medium text-graphite-500 hover:text-ink dark:hover:text-ink-inverted"
              >
                Sign out
              </button>
            </div>
          )}

          {!collapsed && (
            <p className="mt-3 text-center font-body text-[11px] text-graphite-400">
              v1.0.0 · RenTools Admin
            </p>
          )}

          {collapsed && (
            <button
              type="button"
              aria-label="Sign out"
              onClick={handleSignOut}
              className="mx-auto mt-2 flex h-9 w-9 items-center justify-center rounded-lg text-graphite-500 hover:bg-graphite-100 dark:text-graphite-400 dark:hover:bg-graphite-800"
            >
              <svg viewBox="0 0 20 20" fill="none" className="h-[18px] w-[18px]">
                <path d="M8 3.5H5a1 1 0 0 0-1 1v11a1 1 0 0 0 1 1h3M13.5 13.5 17 10l-3.5-3.5M17 10H7.5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
          )}
        </div>
      </aside>

      <main className="min-w-0 flex-1 px-4 py-6 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-4xl">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
