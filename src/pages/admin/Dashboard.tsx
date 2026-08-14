import { useMemo } from "react";
import { Link } from "react-router-dom";
import {
  useAdminProducts,
  useAdminCategories,
  useAdminCustomers,
  useAdminRentals,
  useAdminEnquiries,
  useAdminPurchaseRequests,
} from "../../hooks/useAdminData";
import { deriveDisplayStatus } from "../../utils/rental-calculations";
import { todayISO, startOfMonthISO } from "../../utils/date-range";
import { formatCurrency } from "../../utils/currency";
import { Skeleton } from "../../components/ui/Skeleton";
import { StatCard } from "../../components/ui/StatCard";
import { Card } from "../../components/ui/Card";

function SectionHeading({ children }: { children: string }) {
  return (
    <h2 className="mb-3 mt-8 font-display text-[15px] font-semibold text-ink first:mt-0 dark:text-ink-inverted">
      {children}
    </h2>
  );
}

export function Dashboard() {
  const products = useAdminProducts();
  const categories = useAdminCategories();
  const customers = useAdminCustomers();
  const rentals = useAdminRentals();
  const enquiries = useAdminEnquiries();
  const purchaseRequests = useAdminPurchaseRequests();

  const today = todayISO();
  const monthStart = startOfMonthISO();

  const newEnquiryCount =
    enquiries.status === "success" ? enquiries.data.filter((e) => e.status === "new").length : null;

  const openPurchaseRequestCount =
    purchaseRequests.status === "success"
      ? purchaseRequests.data.filter((r) => r.status === "requested" || r.status === "sourcing").length
      : null;

  // Rentals annotated with today's display status (active/due_today/overdue/returned/cancelled),
  // reusing the same authoritative derivation the Rentals list and Reports use.
  const openRentals = useMemo(() => {
    if (rentals.status !== "success") return null;
    return rentals.data
      .map((r) => ({ ...r, displayStatus: deriveDisplayStatus(r.status, r.returnDate) }))
      .filter((r) => r.displayStatus !== "returned" && r.displayStatus !== "cancelled");
  }, [rentals]);

  const activeRentalCount = openRentals?.length ?? null;
  const dueTodayCount = openRentals?.filter((r) => r.displayStatus === "due_today").length ?? null;
  const overdueCount = openRentals?.filter((r) => r.displayStatus === "overdue").length ?? null;
  const outstandingBalance = openRentals?.reduce((sum, r) => sum + r.balance, 0) ?? null;

  const monthly = useMemo(() => {
    if (rentals.status !== "success") return null;
    const inMonth = rentals.data.filter((r) => r.startDate >= monthStart && r.startDate <= today);
    return {
      count: inMonth.length,
      revenue: inMonth.reduce((sum, r) => sum + r.totalRental, 0),
      rentals: inMonth,
    };
  }, [rentals, monthStart, today]);

  const topRentedProducts = useMemo(() => {
    if (!monthly) return null;
    const counts = new Map<string, number>();
    for (const r of monthly.rentals) {
      counts.set(r.productName, (counts.get(r.productName) ?? 0) + r.quantity);
    }
    return Array.from(counts.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3);
  }, [monthly]);

  const mostRequestedUnavailable = useMemo(() => {
    if (purchaseRequests.status !== "success") return null;
    const counts = new Map<string, number>();
    for (const req of purchaseRequests.data) {
      const key = req.productRequested.trim();
      if (!key) continue;
      counts.set(key, (counts.get(key) ?? 0) + 1);
    }
    return Array.from(counts.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3);
  }, [purchaseRequests]);

  return (
    <div>
      <h1 className="mb-4 font-display text-[20px] font-bold text-ink dark:text-ink-inverted">
        Dashboard
      </h1>

      <SectionHeading>Needs attention today</SectionHeading>
      <div className="grid grid-cols-2 gap-3">
        {dueTodayCount !== null ? (
          <StatCard label="Due today" value={dueTodayCount} to="/admin/rentals" tone="warning" />
        ) : (
          <Skeleton className="h-20 w-full rounded-lg" />
        )}
        {overdueCount !== null ? (
          <StatCard label="Overdue" value={overdueCount} to="/admin/rentals" tone="danger" />
        ) : (
          <Skeleton className="h-20 w-full rounded-lg" />
        )}
        {newEnquiryCount !== null ? (
          <StatCard label="New enquiries" value={newEnquiryCount} to="/admin/enquiries" />
        ) : (
          <Skeleton className="h-20 w-full rounded-lg" />
        )}
        {openPurchaseRequestCount !== null ? (
          <StatCard
            label="Open purchase requests"
            value={openPurchaseRequestCount}
            to="/admin/purchase-requests"
          />
        ) : (
          <Skeleton className="h-20 w-full rounded-lg" />
        )}
      </div>

      <SectionHeading>This month</SectionHeading>
      <div className="grid grid-cols-2 gap-3">
        {activeRentalCount !== null ? (
          <StatCard label="Active rentals" value={activeRentalCount} to="/admin/rentals" />
        ) : (
          <Skeleton className="h-20 w-full rounded-lg" />
        )}
        {outstandingBalance !== null ? (
          <StatCard
            label="Outstanding balance"
            value={formatCurrency(outstandingBalance)}
            to="/admin/rentals"
          />
        ) : (
          <Skeleton className="h-20 w-full rounded-lg" />
        )}
        {monthly !== null ? (
          <StatCard label="Rentals this month" value={monthly.count} to="/admin/reports" />
        ) : (
          <Skeleton className="h-20 w-full rounded-lg" />
        )}
        {monthly !== null ? (
          <StatCard
            label="Revenue this month"
            value={formatCurrency(monthly.revenue)}
            to="/admin/reports"
          />
        ) : (
          <Skeleton className="h-20 w-full rounded-lg" />
        )}
      </div>

      <SectionHeading>Catalog</SectionHeading>
      <div className="grid grid-cols-3 gap-3">
        {customers.status === "success" ? (
          <StatCard label="Customers" value={customers.data.length} to="/admin/customers" />
        ) : (
          <Skeleton className="h-20 w-full rounded-lg" />
        )}
        {products.status === "success" ? (
          <StatCard label="Products" value={products.data.length} to="/admin/products" />
        ) : (
          <Skeleton className="h-20 w-full rounded-lg" />
        )}
        {categories.status === "success" ? (
          <StatCard label="Categories" value={categories.data.length} to="/admin/categories" />
        ) : (
          <Skeleton className="h-20 w-full rounded-lg" />
        )}
      </div>

      <SectionHeading>Trends</SectionHeading>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <Card className="p-4">
          <p className="mb-2 font-body text-[13px] font-medium text-graphite-500">
            Most rented this month
          </p>
          {topRentedProducts === null ? (
            <Skeleton className="h-16 w-full rounded" />
          ) : topRentedProducts.length === 0 ? (
            <p className="font-body text-[13px] text-graphite-400">No rentals yet this month.</p>
          ) : (
            <ul className="space-y-1.5">
              {topRentedProducts.map(([name, qty]) => (
                <li key={name} className="flex items-center justify-between gap-2">
                  <span className="font-body text-[13px] text-ink dark:text-ink-inverted">{name}</span>
                  <span className="font-mono text-[13px] text-graphite-500">{qty}</span>
                </li>
              ))}
            </ul>
          )}
        </Card>

        <Card className="p-4">
          <p className="mb-2 font-body text-[13px] font-medium text-graphite-500">
            Most requested unavailable products
          </p>
          {mostRequestedUnavailable === null ? (
            <Skeleton className="h-16 w-full rounded" />
          ) : mostRequestedUnavailable.length === 0 ? (
            <p className="font-body text-[13px] text-graphite-400">No purchase requests yet.</p>
          ) : (
            <ul className="space-y-1.5">
              {mostRequestedUnavailable.map(([name, count]) => (
                <li key={name} className="flex items-center justify-between gap-2">
                  <span className="font-body text-[13px] text-ink dark:text-ink-inverted">{name}</span>
                  <span className="font-mono text-[13px] text-graphite-500">{count}</span>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>

      <Link
        to="/admin/reports"
        className="mt-8 block font-body text-[13px] font-medium text-signal-600 dark:text-signal-400"
      >
        View reports →
      </Link>
    </div>
  );
}
