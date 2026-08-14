import { NavLink } from "react-router-dom";
import { HomeIcon, RentalsIcon, RequestsIcon, ProductsIcon, CustomersIcon, MoreIcon } from "./nav-icons";
import { InstallAppBanner } from "../layout/InstallAppBanner";

const ITEMS = [
  { to: "/admin", label: "Home", icon: <HomeIcon size={22} />, end: true },
  { to: "/admin/rentals", label: "Rentals", icon: <RentalsIcon size={22} /> },
  { to: "/admin/enquiries", label: "Requests", icon: <RequestsIcon size={22} /> },
  { to: "/admin/products", label: "Products", icon: <ProductsIcon size={22} /> },
  { to: "/admin/customers", label: "Customers", icon: <CustomersIcon size={22} /> },
  { to: "/admin/more", label: "More", icon: <MoreIcon size={22} /> },
];

/**
 * Bottom tab bar for small screens. The full sidebar (AdminLayout) covers every
 * admin route; this surfaces the six most-used destinations plus a "More" tab
 * for everything else, mirroring the customer-facing BottomNavigation pattern.
 */
export function AdminMobileNav() {
  return (
    <div className="fixed inset-x-0 bottom-0 z-40 md:hidden">
      <InstallAppBanner
        appId="admin"
        appName="RenTools Admin"
        badgeLetter="A"
        className="bg-white/95 backdrop-blur-sm dark:bg-graphite-900/95"
      />
      <nav
        aria-label="Admin"
        className="border-t border-graphite-200 bg-white/95 pb-safe-b backdrop-blur-sm dark:border-graphite-800 dark:bg-graphite-900/95"
      >
        <ul className="flex h-16 items-stretch justify-around">
          {ITEMS.map((item) => (
            <li key={item.to} className="flex-1">
              <NavLink
                to={item.to}
                end={item.end}
                className={({ isActive }) =>
                  [
                    "flex h-full flex-col items-center justify-center gap-1 font-body text-[10.5px] font-medium",
                    isActive ? "text-ink dark:text-ink-inverted" : "text-graphite-400",
                  ].join(" ")
                }
              >
                {({ isActive }) => (
                  <>
                    <span
                      className={[
                        "flex h-8 w-12 items-center justify-center rounded-lg transition-colors duration-150 ease-app",
                        isActive ? "bg-graphite-900 text-white dark:bg-white dark:text-graphite-900" : "",
                      ].join(" ")}
                    >
                      {item.icon}
                    </span>
                    {item.label}
                  </>
                )}
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>
    </div>
  );
}
