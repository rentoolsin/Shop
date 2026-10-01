import { ChartBar } from "@phosphor-icons/react";
import { useMemo, useState } from "react";
import { useAdminRentals, useAdminProductInventory, useAdminAllPayments } from "../../hooks/useAdminData";
import { formatCurrency } from "../../utils/currency";
import { entriesBetween, signedAmount } from "../../utils/revenue";
import { calculateRentalDays, deriveDisplayStatus } from "../../utils/rental-calculations";
import {
  resolvePresetRange,
  isValidRange,
  type DateRange,
  type DateRangePresetKey,
} from "../../utils/date-range";
import { DateRangePicker } from "../../components/ui/DateRangePicker";
import { Skeleton } from "../../components/ui/Skeleton";
import { EmptyState } from "../../components/ui/EmptyState";
import { ErrorState } from "../../components/ui/ErrorState";
import { StatCard } from "../../components/ui/StatCard";
import { Card } from "../../components/ui/Card";

function ChartIcon() {
  return <ChartBar className="h-6 w-6" weight="light" />;
}

interface ProductBreakdownRow {
  productName: string;
  rentalCount: number;
  rentalDays: number;
  revenue: number;
  advance: number;
  outstanding: number;
  lastRentedDate: string | null;
}

export function Reports() {
  const rentals = useAdminRentals();
  const inventory = useAdminProductInventory();
  const payments = useAdminAllPayments();

  const [preset, setPreset] = useState<DateRangePresetKey>("this_month");
  const [range, setRange] = useState<DateRange>(() => resolvePresetRange("this_month"));

  const handleRangeChange = (nextPreset: DateRangePresetKey, nextRange: DateRange) => {
    setPreset(nextPreset);
    setRange(nextRange);
  };

  const rangeValid = isValidRange(range);

  // Rental ids that received (or refunded) money inside the range.
  const paidRentalIds = useMemo(() => {
    if (payments.status !== "success" || !rangeValid) return new Set<string>();
    return new Set(entriesBetween(payments.data, range.from, range.to).map((p) => p.rentalId));
  }, [payments, range, rangeValid]);

  // Rentals in scope for the range: those that STARTED in it, plus any rental
  // that was paid in it (e.g. started in July, paid and returned in
  // September). The summary and per-product breakdown are both built from this.
  const filtered = useMemo(() => {
    if (rentals.status !== "success" || !rangeValid) return [];
    return rentals.data.filter(
      (r) => (r.startDate >= range.from && r.startDate <= range.to) || paidRentalIds.has(r.id),
    );
  }, [rentals, range, rangeValid, paidRentalIds]);

  // Revenue = money actually received in the selected range, counted on the
  // date each payment was entered (minus refunds) — NOT on the rental's start
  // or return date. A rental returned in September but paid in September
  // therefore lands in September, whatever month it started in. Grouped per
  // product here so the By-product table adds up to the headline number.
  const revenueByProduct = useMemo(() => {
    const map = new Map<string, number>();
    if (rentals.status !== "success" || payments.status !== "success" || !rangeValid) return map;
    const productByRental = new Map(rentals.data.map((r) => [r.id, r.productName]));
    for (const p of entriesBetween(payments.data, range.from, range.to)) {
      const name = productByRental.get(p.rentalId) ?? "Unknown product";
      map.set(name, (map.get(name) ?? 0) + signedAmount(p));
    }
    return map;
  }, [rentals, payments, range, rangeValid]);

  const summary = useMemo(() => {
    const base = filtered.reduce(
      (acc, r) => {
        acc.rentalCount += 1;
        acc.rentalDays += calculateRentalDays(r.startDate, r.returnDate) * r.quantity;
        acc.discountsGiven += r.discount;
        acc.outstanding += r.balance;
        if (r.status === "returned" && r.actualReturnDate && r.actualReturnDate >= range.from && r.actualReturnDate <= range.to) {
          acc.returns += 1;
        }
        return acc;
      },
      { rentalCount: 0, rentalDays: 0, discountsGiven: 0, outstanding: 0, returns: 0 },
    );
    let revenue = 0;
    for (const v of revenueByProduct.values()) revenue += v;
    return { ...base, revenue };
  }, [filtered, range, revenueByProduct]);

  // Live snapshot, independent of the selected range — "how things stand
  // right now", same derivation the Rentals list and Dashboard use.
  const liveSnapshot = useMemo(() => {
    if (rentals.status !== "success") return null;
    const withDisplayStatus = rentals.data.map((r) => ({
      ...r,
      displayStatus: deriveDisplayStatus(r.status, r.returnDate),
    }));
    return {
      active: withDisplayStatus.filter((r) => r.displayStatus === "active" || r.displayStatus === "due_today").length,
      overdue: withDisplayStatus.filter((r) => r.displayStatus === "overdue").length,
    };
  }, [rentals]);

  // Rows = products with rentals in scope for the range (started or paid in it).
  const byProduct = useMemo(() => {
    const map = new Map<string, ProductBreakdownRow>();
    const blank = (productName: string): ProductBreakdownRow => ({
      productName,
      rentalCount: 0,
      rentalDays: 0,
      revenue: 0,
      advance: 0,
      outstanding: 0,
      lastRentedDate: null,
    });
    for (const r of filtered) {
      const existing = map.get(r.productName) ?? blank(r.productName);
      existing.rentalCount += 1;
      existing.rentalDays += calculateRentalDays(r.startDate, r.returnDate) * r.quantity;
      existing.outstanding += r.balance;
      if (!existing.lastRentedDate || r.startDate > existing.lastRentedDate) {
        existing.lastRentedDate = r.startDate;
      }
      map.set(r.productName, existing);
    }
    for (const [productName, revenue] of revenueByProduct) {
      const existing = map.get(productName) ?? blank(productName);
      existing.revenue = revenue;
      existing.advance = revenue;
      map.set(productName, existing);
    }
    return Array.from(map.values()).sort((a, b) => b.revenue - a.revenue);
  }, [filtered, revenueByProduct]);

  const isLoading =
    rentals.status === "loading" || inventory.status === "loading" || payments.status === "loading";
  const hasError = rentals.status === "error" || inventory.status === "error" || payments.status === "error";

  return (
    <div>
      <h1 className="mb-4 font-display text-[20px] font-bold text-ink dark:text-ink-inverted">
        Reports
      </h1>

      <DateRangePicker preset={preset} range={range} onChange={handleRangeChange} />

      {!rangeValid && (
        <EmptyState
          icon={<ChartIcon />}
          title="Invalid date range"
          description="The start date must not be after the end date."
        />
      )}

      {rangeValid && isLoading && (
        <div className="grid grid-cols-2 gap-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-20 w-full rounded" />
          ))}
        </div>
      )}

      {rangeValid && hasError && (
        <ErrorState
          description="Couldn't load report data."
          onRetry={() => {
            rentals.refetch();
            inventory.refetch();
            payments.refetch();
          }}
        />
      )}

      {rangeValid && !isLoading && !hasError && (
        <>
          <p className="mb-3 font-body text-[12px] text-graphite-400">
            Revenue is the money received (minus refunds) on dates inside this range. Rentals, days, discounts and
            outstanding cover rentals that started or were paid in this range.
          </p>
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-3">
            <StatCard label="Rentals" value={summary.rentalCount} />
            <StatCard label="Rental days" value={summary.rentalDays} />
            <StatCard label="Revenue (received)" value={formatCurrency(summary.revenue)} />
            <StatCard label="Discounts given" value={formatCurrency(summary.discountsGiven)} />
            <StatCard label="Outstanding balance" value={formatCurrency(summary.outstanding)} />
            <StatCard label="Returns" value={summary.returns} />
          </div>

          <h2 className="mb-3 mt-8 font-display text-[15px] font-semibold text-ink dark:text-ink-inverted">
            Current status
          </h2>
          <p className="mb-3 font-body text-[12px] text-graphite-400">
            Live snapshot — not limited to the selected date range.
          </p>
          <div className="grid grid-cols-2 gap-3 lg:max-w-md">
            <StatCard label="Active rentals" value={liveSnapshot?.active ?? 0} to="/admin/rentals" />
            <StatCard label="Overdue rentals" value={liveSnapshot?.overdue ?? 0} to="/admin/rentals" tone="danger" />
          </div>

          <h2 className="mb-3 mt-8 font-display text-[15px] font-semibold text-ink dark:text-ink-inverted">
            By product
          </h2>

          {byProduct.length === 0 ? (
            <EmptyState
              icon={<ChartIcon />}
              title="No activity in range"
              description="No rentals started and no payments received in this range. Try widening the date range above."
            />
          ) : (
            <>
            {/* Mobile: one card per product (no sideways scrolling). */}
            <ul className="space-y-3 md:hidden">
              {byProduct.map((row) => {
                const inv = inventory.status === "success" ? inventory.data.get(row.productName) : undefined;
                const hasDue = row.outstanding > 0;
                const stockPct =
                  inv && inv.totalQuantity > 0
                    ? Math.max(0, Math.min(100, (inv.availableQuantity / inv.totalQuantity) * 100))
                    : 0;
                return (
                  <li key={row.productName}>
                    <Card className="p-4">
                      <div className="flex items-start justify-between gap-3">
                        <h3 className="min-w-0 flex-1 font-display text-[14px] font-semibold leading-snug text-ink dark:text-ink-inverted">
                          {row.productName}
                        </h3>
                        <div className="shrink-0 text-right">
                          <p className="font-mono text-[18px] font-semibold leading-none text-ink dark:text-ink-inverted">
                            {formatCurrency(row.revenue)}
                          </p>
                          <p className="mt-1 font-body text-[11px] text-graphite-500">Revenue</p>
                        </div>
                      </div>

                      <dl className="mt-3 grid grid-cols-3 gap-2 border-t border-graphite-100 pt-3 dark:border-graphite-800">
                        <div>
                          <dd className="font-mono text-[15px] font-semibold text-ink dark:text-ink-inverted">
                            {row.rentalCount}
                          </dd>
                          <dt className="font-body text-[11px] text-graphite-500">Rentals</dt>
                        </div>
                        <div>
                          <dd className="font-mono text-[15px] font-semibold text-ink dark:text-ink-inverted">
                            {row.rentalDays}
                          </dd>
                          <dt className="font-body text-[11px] text-graphite-500">Days</dt>
                        </div>
                        <div>
                          <dd
                            className={[
                              "font-mono text-[15px] font-semibold",
                              hasDue
                                ? "text-state-danger-text dark:text-state-danger-text-dark"
                                : "text-ink dark:text-ink-inverted",
                            ].join(" ")}
                          >
                            {formatCurrency(row.outstanding)}
                          </dd>
                          <dt className="font-body text-[11px] text-graphite-500">Outstanding</dt>
                        </div>
                      </dl>

                      <div className="mt-3 flex items-center justify-between gap-3 border-t border-graphite-100 pt-3 dark:border-graphite-800">
                        <div className="min-w-0">
                          <p className="font-body text-[11px] text-graphite-500">Last rented</p>
                          <p className="font-mono text-[12px] text-ink dark:text-ink-inverted">
                            {row.lastRentedDate ?? "—"}
                          </p>
                        </div>
                        <div className="w-28 shrink-0">
                          <p className="text-right font-body text-[11px] text-graphite-500">
                            Available now{" "}
                            <span className="font-mono text-[12px] font-semibold text-ink dark:text-ink-inverted">
                              {inv ? `${inv.availableQuantity}/${inv.totalQuantity}` : "—"}
                            </span>
                          </p>
                          {inv && (
                            <div
                              className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-graphite-100 dark:bg-graphite-800"
                              role="img"
                              aria-label={`${inv.availableQuantity} of ${inv.totalQuantity} available`}
                            >
                              <div
                                className="h-full rounded-full bg-state-success-text dark:bg-state-success-text-dark"
                                style={{ width: `${stockPct}%` }}
                              />
                            </div>
                          )}
                        </div>
                      </div>
                    </Card>
                  </li>
                );
              })}
            </ul>

            {/* Tablet/desktop: full table. */}
            <Card className="hidden overflow-x-auto p-0 md:block">
              <table className="w-full min-w-[720px] text-left">
                <thead>
                  <tr className="border-b border-graphite-200 bg-graphite-50 dark:border-graphite-800 dark:bg-graphite-900">
                    <th className="px-3 py-2 font-body text-[12px] font-medium text-graphite-500">
                      Product
                    </th>
                    <th className="px-3 py-2 font-body text-[12px] font-medium text-graphite-500">
                      Rentals
                    </th>
                    <th className="px-3 py-2 font-body text-[12px] font-medium text-graphite-500">
                      Rental days
                    </th>
                    <th className="px-3 py-2 font-body text-[12px] font-medium text-graphite-500">
                      Revenue
                    </th>
                    <th className="px-3 py-2 font-body text-[12px] font-medium text-graphite-500">
                      Outstanding
                    </th>
                    <th className="px-3 py-2 font-body text-[12px] font-medium text-graphite-500">
                      Last rented
                    </th>
                    <th className="px-3 py-2 font-body text-[12px] font-medium text-graphite-500">
                      Available now
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {byProduct.map((row) => {
                    const inv = inventory.status === "success" ? inventory.data.get(row.productName) : undefined;
                    return (
                      <tr
                        key={row.productName}
                        className="border-b border-graphite-100 last:border-0 dark:border-graphite-800"
                      >
                        <td className="px-3 py-2 font-body text-[13px] text-ink dark:text-ink-inverted">
                          {row.productName}
                        </td>
                        <td className="px-3 py-2 font-mono text-[13px] text-ink dark:text-ink-inverted">
                          {row.rentalCount}
                        </td>
                        <td className="px-3 py-2 font-mono text-[13px] text-ink dark:text-ink-inverted">
                          {row.rentalDays}
                        </td>
                        <td className="px-3 py-2 font-mono text-[13px] text-ink dark:text-ink-inverted">
                          {formatCurrency(row.revenue)}
                        </td>
                        <td className="px-3 py-2 font-mono text-[13px] text-ink dark:text-ink-inverted">
                          {formatCurrency(row.outstanding)}
                        </td>
                        <td className="px-3 py-2 font-mono text-[13px] text-ink dark:text-ink-inverted">
                          {row.lastRentedDate ?? "—"}
                        </td>
                        <td className="px-3 py-2 font-mono text-[13px] text-ink dark:text-ink-inverted">
                          {inv ? `${inv.availableQuantity} of ${inv.totalQuantity}` : "—"}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </Card>
            </>
          )}
        </>
      )}
    </div>
  );
}
