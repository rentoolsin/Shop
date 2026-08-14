import { NavLink } from "react-router-dom";
import { HomeIcon, RentalsIcon, RequestsIcon, ProductsIcon, CustomersIcon, MoreIcon } from "./nav-icons";

const ITEMS = [
  { to: "/admin", label: "Home", icon: <HomeIcon />, end: true },
  { to: "/admin/rentals", label: "Rentals", icon: <RentalsIcon /> },
  { to: "/admin/enquiries", label: "Requests", icon: <RequestsIcon /> },
  { to: "/admin/products", label: "Products", icon: <ProductsIcon /> },
  { to: "/admin/customers", label: "Customers", icon: <CustomersIcon /> },
  { to: "/admin/more", label: "More", icon: <MoreIcon /> },
];

/**
 * Bottom tab bar for small screens. The full sidebar (AdminLayout) covers every
 * admin route; this surfaces the six most-used destinations plus a "More" tab
 * for everything else, mirroring the customer-facing BottomNavigation pattern.
 */
export function AdminMobileNav() {
  return (
    <nav
      aria-label="Admin"
      className="fixed inset-x-0 bottom-0 z-40 border-t border-graphite-200 bg-white/95 pb-safe-b backdrop-blur-sm dark:border-graphite-800 dark:bg-graphite-900/95 md:hidden"
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
  );
}
