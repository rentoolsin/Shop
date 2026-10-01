import { useMemo } from "react";
import { Link } from "react-router-dom";
import {
  ArrowRight,
  CalendarCheck,
  ChartPieSlice,
  ClipboardText,
  HandCoins,
  Package,
  Stack,
  Tag,
  UsersThree,
  Warning,
} from "@phosphor-icons/react";
import {
  useAdminProducts,
  useAdminCategories,
  useAdminCustomers,
  useAdminRentals,
  useAdminAllPayments,
  useAdminEnquiries,
  useAdminPurchaseRequests,
} from "../../hooks/useAdminData";
import { deriveDisplayStatus } from "../../utils/rental-calculations";
import {
  todayISO,
  startOfMonthISO,
  startOfLastMonthISO,
  endOfLastMonthISO,
  toLocalISODate,
} from "../../utils/date-range";
import { formatCurrency } from "../../utils/currency";
import { collectedBetween, signedAmount } from "../../utils/revenue";
import { Skeleton } from "../../components/ui/Skeleton";
import { StatusBadge } from "../../components/ui/StatusBadge";
import { KpiCard } from "../../components/admin/KpiCard";
import { PremiumCard } from "../../components/admin/PremiumCard";
import { DashboardHero } from "../../components/admin/DashboardHero";
import { AreaTrendChart } from "../../components/admin/charts/AreaTrendChart";
import { DonutChart } from "../../components/admin/charts/DonutChart";
import { BarListChart } from "../../components/admin/charts/BarListChart";
import type { RentalStatus } from "../../types/database";
import type { ReactNode } from "react";

function SectionHeading({ kicker, children, action }: { kicker?: string; children: string; action?: ReactNode }) {
  return (
    <div className="mb-3 mt-10 flex items-end justify-between first:mt-0">
      <div>
        {kicker && (
          <p className="mb-1 font-body text-[11px] font-semibold uppercase tracking-wider text-graphite-400">
            {kicker}
          </p>
        )}
        <h2 className="font-display text-[16px] font-bold tracking-tight text-ink dark:text-ink-inverted">
          {children}
        </h2>
      </div>
      {action}
    </div>
  );
}

const RENTAL_STATUS_COLOR: Record<RentalStatus, string> = {
  active: "#4C6B8A",
  due_today: "#D68F0F",
  overdue: "#B4432F",
  returned: "#3B8156",
  cancelled: "#9E9E97",
};

const RENTAL_STATUS_LABEL: Record<RentalStatus, string> = {
  active: "Active",
  due_today: "Due today",
  overdue: "Overdue",
  returned: "Returned",
  cancelled: "Cancelled",
};

function pctDelta(current: number, previous: number): number {
  if (previous === 0) return current === 0 ? 0 : 100;
  return Math.round(((current - previous) / previous) * 100);
}

function initials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  return (parts[0][0] + (parts[1]?.[0] ?? "")).toUpperCase();
}

const AVATAR_PALETTE = ["#4C6B8A", "#B9862C", "#3B8156", "#B4432F", "#7A5AF8", "#0EA5A4"];
function avatarColor(seed: string): string {
  let hash = 0;
  for (let i = 0; i < seed.length; i++) hash = (hash * 31 + seed.charCodeAt(i)) >>> 0;
  return AVATAR_PALETTE[hash % AVATAR_PALETTE.length];
}

export function Dashboard() {
  const products = useAdminProducts();
  const categories = useAdminCategories();
  const customers = useAdminCustomers();
  const rentals = useAdminRentals();
  const payments = useAdminAllPayments();
  const enquiries = useAdminEnquiries();
  const purchaseRequests = useAdminPurchaseRequests();

  const today = todayISO();
  const monthStart = startOfMonthISO();
  const lastMonthStart = startOfLastMonthISO();
  const lastMonthEnd = endOfLastMonthISO();

  const newEnquiryCount =
    enquiries.status === "success" ? enquiries.data.filter((e) => e.status === "new").length : null;

  const openPurchaseRequestCount =
    purchaseRequests.status === "success"
      ? purchaseRequests.data.filter((r) => r.status === "requested" || r.status === "sourcing").length
      : null;

  // Rentals annotated with today's display status (active/due_today/overdue/returned/cancelled),
  // reusing the same authoritative derivation the Rentals list and Reports use.
  const annotatedRentals = useMemo(() => {
    if (rentals.status !== "success") return null;
    return rentals.data.map((r) => ({ ...r, displayStatus: deriveDisplayStatus(r.status, r.returnDate) }));
  }, [rentals]);

  const openRentals = useMemo(
    () => annotatedRentals?.filter((r) => r.displayStatus !== "returned" && r.displayStatus !== "cancelled") ?? null,
    [annotatedRentals],
  );

  const activeRentalCount = openRentals?.length ?? null;
  const dueTodayCount = openRentals?.filter((r) => r.displayStatus === "due_today").length ?? null;
  const overdueCount = openRentals?.filter((r) => r.displayStatus === "overdue").length ?? null;
  const outstandingBalance = openRentals?.reduce((sum, r) => sum + r.balance, 0) ?? null;

  const monthly = useMemo(() => {
    if (rentals.status !== "success") return null;
    const inMonth = rentals.data.filter((r) => r.startDate >= monthStart && r.startDate <= today);
    return {
      count: inMonth.length,
      rentals: inMonth,
    };
  }, [rentals, monthStart, today]);

  // Revenue = money actually received, counted on the date each payment was
  // entered (minus refunds) — not on the rental's start date.
  const monthlyRevenue = useMemo(
    () => (payments.status === "success" ? collectedBetween(payments.data, monthStart, today) : null),
    [payments, monthStart, today],
  );
  const lastMonthRevenue = useMemo(
    () => (payments.status === "success" ? collectedBetween(payments.data, lastMonthStart, lastMonthEnd) : null),
    [payments, lastMonthStart, lastMonthEnd],
  );

  const lastMonth = useMemo(() => {
    if (rentals.status !== "success") return null;
    const inRange = rentals.data.filter((r) => r.startDate >= lastMonthStart && r.startDate <= lastMonthEnd);
    return {
      count: inRange.length,
    };
  }, [rentals, lastMonthStart, lastMonthEnd]);

  // Daily revenue (money received, net of refunds) bucketed by payment date,
  // for the last 14 days.
  const revenueTrend = useMemo(() => {
    if (payments.status !== "success") return null;
    const days: { iso: string; label: string }[] = [];
    const cursor = new Date();
    for (let i = 13; i >= 0; i--) {
      const d = new Date(cursor);
      d.setDate(d.getDate() - i);
      days.push({ iso: toLocalISODate(d), label: d.toLocaleDateString("en-IN", { day: "numeric", month: "short" }) });
    }
    const byDay = new Map<string, number>();
    for (const p of payments.data) {
      byDay.set(p.paymentDate, (byDay.get(p.paymentDate) ?? 0) + signedAmount(p));
    }
    return days.map((d) => ({ label: d.label, value: byDay.get(d.iso) ?? 0 }));
  }, [payments]);

  const statusBreakdown = useMemo(() => {
    if (!annotatedRentals) return null;
    const counts = new Map<RentalStatus, number>();
    for (const r of annotatedRentals) {
      counts.set(r.displayStatus, (counts.get(r.displayStatus) ?? 0) + 1);
    }
    return (Object.keys(RENTAL_STATUS_LABEL) as RentalStatus[]).map((status) => ({
      label: RENTAL_STATUS_LABEL[status],
      value: counts.get(status) ?? 0,
      color: RENTAL_STATUS_COLOR[status],
    }));
  }, [annotatedRentals]);

  const topRentedProducts = useMemo(() => {
    if (!monthly) return null;
    const counts = new Map<string, number>();
    for (const r of monthly.rentals) {
      counts.set(r.productName, (counts.get(r.productName) ?? 0) + r.quantity);
    }
    return Array.from(counts.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([label, value]) => ({ label, value, sublabel: value === 1 ? "unit" : "units" }));
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
      .slice(0, 5)
      .map(([label, value]) => ({ label, value, sublabel: value === 1 ? "request" : "requests" }));
  }, [purchaseRequests]);

  const recentRentals = rentals.status === "success" ? rentals.data.slice(0, 5) : null;

  const revenueDelta =
    monthlyRevenue !== null && lastMonthRevenue !== null ? pctDelta(monthlyRevenue, lastMonthRevenue) : null;
  const rentalsDelta = monthly && lastMonth ? pctDelta(monthly.count, lastMonth.count) : null;

  const heroChips = [
    {
      label: "Active rentals",
      value: activeRentalCount ?? "—",
      icon: <Stack className="h-4 w-4" weight="bold" />,
    },
    {
      label: "Revenue this month",
      value: monthlyRevenue !== null ? formatCurrency(monthlyRevenue) : "—",
      icon: <HandCoins className="h-4 w-4" weight="bold" />,
    },
    {
      label: "Outstanding",
      value: outstandingBalance !== null ? formatCurrency(outstandingBalance) : "—",
      icon: <ChartPieSlice className="h-4 w-4" weight="bold" />,
    },
    {
      label: "Overdue",
      value: overdueCount ?? "—",
      icon: <Warning className="h-4 w-4" weight="bold" />,
    },
  ];

  return (
    <div>
      <DashboardHero chips={heroChips} />

      <SectionHeading kicker="Priority">Needs attention today</SectionHeading>
      <div className="grid grid-cols-2 gap-3.5 lg:grid-cols-4">
        {dueTodayCount !== null ? (
          <KpiCard
            label="Due today"
            value={dueTodayCount}
            to="/admin/rentals"
            tone="warning"
            icon={<CalendarCheck className="h-5 w-5" weight="bold" />}
          />
        ) : (
          <Skeleton className="h-[128px] w-full rounded" />
        )}
        {overdueCount !== null ? (
          <KpiCard
            label="Overdue"
            value={overdueCount}
            to="/admin/rentals"
            tone="danger"
            icon={<Warning className="h-5 w-5" weight="bold" />}
          />
        ) : (
          <Skeleton className="h-[128px] w-full rounded" />
        )}
        {newEnquiryCount !== null ? (
          <KpiCard
            label="New enquiries"
            value={newEnquiryCount}
            to="/admin/enquiries"
            tone="info"
            icon={<ClipboardText className="h-5 w-5" weight="bold" />}
          />
        ) : (
          <Skeleton className="h-[128px] w-full rounded" />
        )}
        {openPurchaseRequestCount !== null ? (
          <KpiCard
            label="Open purchase requests"
            value={openPurchaseRequestCount}
            to="/admin/purchase-requests"
            icon={<Tag className="h-5 w-5" weight="bold" />}
          />
        ) : (
          <Skeleton className="h-[128px] w-full rounded" />
        )}
      </div>

      <SectionHeading kicker="Performance">This month</SectionHeading>
      <div className="grid grid-cols-2 gap-3.5 lg:grid-cols-4">
        {activeRentalCount !== null ? (
          <KpiCard
            label="Active rentals"
            value={activeRentalCount}
            to="/admin/rentals"
            icon={<Stack className="h-5 w-5" weight="bold" />}
          />
        ) : (
          <Skeleton className="h-[128px] w-full rounded" />
        )}
        {outstandingBalance !== null ? (
          <KpiCard
            label="Outstanding balance"
            value={formatCurrency(outstandingBalance)}
            to="/admin/rentals"
            icon={<HandCoins className="h-5 w-5" weight="bold" />}
          />
        ) : (
          <Skeleton className="h-[128px] w-full rounded" />
        )}
        {monthly !== null && rentalsDelta !== null ? (
          <KpiCard
            label="Rentals this month"
            value={monthly.count}
            to="/admin/reports"
            icon={<ChartPieSlice className="h-5 w-5" weight="bold" />}
            delta={{ value: rentalsDelta, note: "vs last month" }}
          />
        ) : (
          <Skeleton className="h-[128px] w-full rounded" />
        )}
        {monthlyRevenue !== null && revenueDelta !== null ? (
          <KpiCard
            label="Revenue this month"
            value={formatCurrency(monthlyRevenue)}
            to="/admin/reports"
            tone="success"
            icon={<HandCoins className="h-5 w-5" weight="bold" />}
            delta={{ value: revenueDelta, note: "vs last month" }}
          />
        ) : (
          <Skeleton className="h-[128px] w-full rounded" />
        )}
      </div>

      <SectionHeading kicker="Analytics">Revenue &amp; rental mix</SectionHeading>
      <div className="grid grid-cols-1 gap-3.5 xl:grid-cols-[1.6fr,1fr]">
        <PremiumCard className="p-5 sm:p-6">
          <div className="mb-5 flex items-center justify-between">
            <div>
              <p className="font-body text-[13px] font-semibold text-ink dark:text-ink-inverted">
                Revenue — last 14 days
              </p>
              <p className="mt-0.5 font-body text-[11.5px] text-graphite-400">Money received, by payment date</p>
            </div>
            <p className="font-mono text-[16px] font-semibold text-ink dark:text-ink-inverted">
              {revenueTrend ? formatCurrency(revenueTrend.reduce((s, d) => s + d.value, 0)) : ""}
            </p>
          </div>
          {revenueTrend === null ? (
            <Skeleton className="h-[240px] w-full rounded" />
          ) : (
            <AreaTrendChart
              data={revenueTrend}
              formatValue={formatCurrency}
              tone="accent"
              emptyLabel="No payments received in the last 14 days."
            />
          )}
        </PremiumCard>

        <PremiumCard className="p-5 sm:p-6">
          <p className="mb-5 font-body text-[13px] font-semibold text-ink dark:text-ink-inverted">Rental status mix</p>
          {statusBreakdown === null ? (
            <Skeleton className="h-[172px] w-full rounded" />
          ) : (
            <DonutChart
              data={statusBreakdown}
              centerValue={String(statusBreakdown.reduce((s, d) => s + d.value, 0))}
              centerLabel="Total rentals"
              emptyLabel="No rentals yet."
            />
          )}
        </PremiumCard>
      </div>

      <SectionHeading kicker="Inventory">Catalog</SectionHeading>
      <div className="grid grid-cols-3 gap-3.5 lg:max-w-2xl">
        {customers.status === "success" ? (
          <KpiCard
            label="Customers"
            value={customers.data.length}
            to="/admin/customers"
            icon={<UsersThree className="h-5 w-5" weight="bold" />}
          />
        ) : (
          <Skeleton className="h-[128px] w-full rounded" />
        )}
        {products.status === "success" ? (
          <KpiCard
            label="Products"
            value={products.data.length}
            to="/admin/products"
            icon={<Package className="h-5 w-5" weight="bold" />}
          />
        ) : (
          <Skeleton className="h-[128px] w-full rounded" />
        )}
        {categories.status === "success" ? (
          <KpiCard
            label="Categories"
            value={categories.data.length}
            to="/admin/categories"
            icon={<Tag className="h-5 w-5" weight="bold" />}
          />
        ) : (
          <Skeleton className="h-[128px] w-full rounded" />
        )}
      </div>

      <SectionHeading kicker="Demand">Trends</SectionHeading>
      <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2">
        <PremiumCard className="p-5 sm:p-6">
          <p className="mb-4 font-body text-[13px] font-semibold text-ink dark:text-ink-inverted">
            Most rented this month
          </p>
          {topRentedProducts === null ? (
            <Skeleton className="h-32 w-full rounded" />
          ) : (
            <BarListChart data={topRentedProducts} tone="accent" emptyLabel="No rentals yet this month." />
          )}
        </PremiumCard>

        <PremiumCard className="p-5 sm:p-6">
          <p className="mb-4 font-body text-[13px] font-semibold text-ink dark:text-ink-inverted">
            Most requested unavailable products
          </p>
          {mostRequestedUnavailable === null ? (
            <Skeleton className="h-32 w-full rounded" />
          ) : (
            <BarListChart data={mostRequestedUnavailable} tone="danger" emptyLabel="No purchase requests yet." />
          )}
        </PremiumCard>
      </div>

      <SectionHeading
        kicker="Activity"
        action={
          <Link
            to="/admin/rentals"
            className="flex items-center gap-1 font-body text-[12.5px] font-semibold text-graphite-500 transition-colors duration-150 ease-app hover:text-ink dark:hover:text-ink-inverted"
          >
            View all
            <ArrowRight className="h-3.5 w-3.5" weight="bold" />
          </Link>
        }
      >
        Recent rentals
      </SectionHeading>
      <PremiumCard className="overflow-hidden">
        {recentRentals === null ? (
          <div className="space-y-2 p-4">
            <Skeleton className="h-14 w-full rounded" />
            <Skeleton className="h-14 w-full rounded" />
            <Skeleton className="h-14 w-full rounded" />
          </div>
        ) : recentRentals.length === 0 ? (
          <p className="p-5 font-body text-[13px] text-graphite-400">No rentals yet.</p>
        ) : (
          <ul className="divide-y divide-graphite-100 dark:divide-white/[0.06]">
            {recentRentals.map((r) => {
              const displayStatus = deriveDisplayStatus(r.status, r.returnDate);
              const tone =
                displayStatus === "overdue"
                  ? "danger"
                  : displayStatus === "due_today"
                    ? "warning"
                    : displayStatus === "returned"
                      ? "success"
                      : displayStatus === "cancelled"
                        ? "neutral"
                        : "info";
              return (
                <li key={r.id}>
                  <Link
                    to="/admin/rentals"
                    className="flex items-center justify-between gap-3 px-5 py-3.5 transition-colors duration-150 ease-app hover:bg-graphite-50 dark:hover:bg-white/[0.03]"
                  >
                    <div className="flex min-w-0 items-center gap-3">
                      <span
                        className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded font-body text-[12px] font-semibold text-white"
                        style={{ backgroundColor: avatarColor(r.customerName) }}
                      >
                        {initials(r.customerName)}
                      </span>
                      <div className="min-w-0">
                        <p className="truncate font-body text-[13.5px] font-medium text-ink dark:text-ink-inverted">
                          {r.productName}
                          {r.variantLabel ? <span className="text-graphite-400"> · {r.variantLabel}</span> : null}
                        </p>
                        <p className="truncate font-body text-[12px] text-graphite-500">
                          {r.customerName} · {r.quantity}× · from {r.startDate}
                        </p>
                      </div>
                    </div>
                    <div className="flex flex-shrink-0 items-center gap-3">
                      <span className="hidden font-mono text-[13px] font-semibold text-ink dark:text-ink-inverted sm:inline">
                        {formatCurrency(r.totalRental)}
                      </span>
                      <StatusBadge label={RENTAL_STATUS_LABEL[displayStatus]} tone={tone} />
                    </div>
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
      </PremiumCard>

      <Link
        to="/admin/reports"
        className="mt-8 inline-flex items-center gap-1 font-body text-[13px] font-semibold text-graphite-700 hover:text-ink dark:text-graphite-300 dark:hover:text-ink-inverted"
      >
        View full reports
        <ArrowRight className="h-3.5 w-3.5" weight="bold" />
      </Link>
    </div>
  );
}
