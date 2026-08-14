import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { useAuth } from "../../lib/auth";
import { Button } from "../ui/Button";

const NAV_ITEMS = [
  { to: "/admin", label: "Dashboard", end: true },
  { to: "/admin/enquiries", label: "Enquiries" },
  { to: "/admin/purchase-requests", label: "Purchase Requests" },
  { to: "/admin/rentals", label: "Rentals" },
  { to: "/admin/customers", label: "Customers" },
  { to: "/admin/products", label: "Products" },
  { to: "/admin/categories", label: "Categories" },
  { to: "/admin/reports", label: "Reports" },
  { to: "/admin/homepage", label: "Homepage" },
  { to: "/admin/settings", label: "Settings" },
];

export function AdminLayout() {
  const { signOut, session } = useAuth();
  const navigate = useNavigate();

  const handleSignOut = async () => {
    await signOut();
    navigate("/admin/login", { replace: true });
  };

  return (
    <div className="min-h-screen bg-graphite-50 dark:bg-graphite-950">
      <header className="sticky top-0 z-30 border-b border-graphite-200 bg-graphite-50/90 backdrop-blur-sm dark:border-graphite-800 dark:bg-graphite-950/90">
        <div className="mx-auto flex h-14 max-w-4xl items-center justify-between px-4">
          <span className="font-display text-[16px] font-extrabold tracking-tight text-ink dark:text-ink-inverted">
            RenTools Admin
          </span>
          <div className="flex items-center gap-3">
            <span className="hidden font-body text-[12px] text-graphite-500 sm:inline">
              {session?.user.email}
            </span>
            <Button variant="ghost" size="sm" onClick={handleSignOut}>
              Sign out
            </Button>
          </div>
        </div>
        <nav className="mx-auto flex max-w-4xl flex-nowrap gap-1 overflow-x-auto px-4 pb-2">
          {NAV_ITEMS.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) =>
                [
                  "rounded px-3 py-1.5 font-body text-[13px] font-medium",
                  isActive
                    ? "bg-graphite-900 text-graphite-25 dark:bg-signal-500 dark:text-graphite-950"
                    : "text-graphite-600 hover:bg-graphite-100 dark:text-graphite-300 dark:hover:bg-graphite-800",
                ].join(" ")
              }
            >
              {item.label}
            </NavLink>
          ))}
        </nav>
      </header>
      <main className="mx-auto max-w-4xl px-4 py-6">
        <Outlet />
      </main>
    </div>
  );
}
