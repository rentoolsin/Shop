import { useRef, useState } from "react";
import { NavLink } from "react-router-dom";
import { HomeIcon, RentalsIcon, RequestsIcon, ProductsIcon, CustomersIcon, MoreIcon } from "./nav-icons";
import { InstallAppBanner } from "../layout/InstallAppBanner";
import { BottomSheet } from "../ui/BottomSheet";
import { ADMIN_MORE_ITEMS, AdminMoreLink } from "./more-items";
import { useNewEnquiriesCount } from "../../hooks/useAdminData";

const ITEMS = [
  { to: "/admin", label: "Home", icon: <HomeIcon size={22} />, end: true },
  { to: "/admin/rentals", label: "Rentals", icon: <RentalsIcon size={22} /> },
  { to: "/admin/enquiries", label: "Requests", icon: <RequestsIcon size={22} /> },
  { to: "/admin/products", label: "Products", icon: <ProductsIcon size={22} /> },
  { to: "/admin/customers", label: "Customers", icon: <CustomersIcon size={22} /> },
  { to: "/admin/more", label: "More", icon: <MoreIcon size={22} /> },
];

const LONG_PRESS_MS = 450;

/**
 * Bottom tab bar for small screens. The full sidebar (AdminLayout) covers every
 * admin route; this surfaces the six most-used destinations plus a "More" tab
 * for everything else, mirroring the customer-facing BottomNavigation pattern.
 *
 * Long-pressing the "More" tab specifically opens a quick-pick sheet listing
 * everything that lives behind it (Purchase Requests, Categories, Reports,
 * Homepage, Settings — see more-items.tsx) so an admin can jump straight to
 * one of those without the extra hop through the full /admin/more page. A
 * normal tap still navigates to /admin/more as before.
 */
export function AdminMobileNav() {
  const [quickPickOpen, setQuickPickOpen] = useState(false);
  const pressTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const longPressFiredRef = useRef(false);
  const newEnquiries = useNewEnquiriesCount();
  const newEnquiriesCount = newEnquiries.status === "success" ? newEnquiries.data : 0;

  const clearPressTimer = () => {
    if (pressTimerRef.current) {
      clearTimeout(pressTimerRef.current);
      pressTimerRef.current = null;
    }
  };

  const handleMorePressStart = () => {
    longPressFiredRef.current = false;
    clearPressTimer();
    pressTimerRef.current = setTimeout(() => {
      longPressFiredRef.current = true;
      pressTimerRef.current = null;
      if ("vibrate" in navigator) navigator.vibrate(12);
      setQuickPickOpen(true);
    }, LONG_PRESS_MS);
  };

  const handleMorePressEnd = () => {
    clearPressTimer();
  };

  // A completed long press already opened the sheet — swallow the click
  // that follows pointerup so it doesn't also navigate to /admin/more.
  const handleMoreClick = (e: React.MouseEvent) => {
    if (longPressFiredRef.current) {
      e.preventDefault();
      longPressFiredRef.current = false;
    }
  };

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
          {ITEMS.map((item) => {
            const isMore = item.to === "/admin/more";
            const isRequests = item.to === "/admin/enquiries";
            return (
              <li key={item.to} className="flex-1">
                <NavLink
                  to={item.to}
                  end={item.end}
                  className={({ isActive }) =>
                    [
                      "flex h-full flex-col items-center justify-center gap-1 font-body text-[10.5px] font-medium select-none",
                      isActive ? "text-ink dark:text-ink-inverted" : "text-graphite-400",
                    ].join(" ")
                  }
                  {...(isMore
                    ? {
                        onClick: handleMoreClick,
                        onPointerDown: handleMorePressStart,
                        onPointerUp: handleMorePressEnd,
                        onPointerLeave: handleMorePressEnd,
                        onPointerCancel: handleMorePressEnd,
                        onContextMenu: (e: React.MouseEvent) => e.preventDefault(),
                      }
                    : {})}
                >
                  {({ isActive }) => (
                    <>
                      <span
                        className={[
                          "relative flex h-8 w-12 items-center justify-center rounded transition-colors duration-150 ease-app",
                          isActive ? "bg-graphite-900 text-white dark:bg-white dark:text-graphite-900" : "",
                        ].join(" ")}
                      >
                        {item.icon}
                        {isRequests && newEnquiriesCount > 0 && (
                          <span
                            aria-label={`${newEnquiriesCount} new ${newEnquiriesCount === 1 ? "enquiry" : "enquiries"}`}
                            className="absolute right-1 top-0.5 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-state-danger px-1 font-body text-[9px] font-semibold leading-none text-white"
                          >
                            {newEnquiriesCount > 99 ? "99+" : newEnquiriesCount}
                          </span>
                        )}
                      </span>
                      {item.label}
                    </>
                  )}
                </NavLink>
              </li>
            );
          })}
        </ul>
      </nav>

      <BottomSheet open={quickPickOpen} onClose={() => setQuickPickOpen(false)} title="More">
        <div className="-mx-5 divide-y divide-graphite-100 dark:divide-graphite-800">
          {ADMIN_MORE_ITEMS.map((item) => (
            <AdminMoreLink key={item.to} {...item} onNavigate={() => setQuickPickOpen(false)} />
          ))}
        </div>
      </BottomSheet>
    </div>
  );
}
