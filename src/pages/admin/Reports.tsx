import { ChartBar } from "@phosphor-icons/react";
import { useMemo, useState } from "react";
import { useAdminRentals, useAdminProductInventory } from "../../hooks/useAdminData";
import { formatCurrency } from "../../utils/currency";
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

  const [preset, setPreset] = useState<DateRangePresetKey>("this_month");
  const [range, setRange] = useState<DateRange>(() => resolvePresetRange("this_month"));

  const handleRangeChange = (nextPreset: DateRangePresetKey, nextRange: DateRange) => {
    setPreset(nextPreset);
    setRange(nextRange);
  };

  const rangeValid = isValidRange(range);

  // Bookings that STARTED within the selected range — the range summary and
  // per-product breakdown below are both scoped to this set.
  const filtered = useMemo(() => {
    if (rentals.status !== "success" || !rangeValid) return [];
    return rentals.data.filter((r) => r.startDate >= range.from && r.startDate <= range.to);
  }, [rentals, range, rangeValid]);

  const summary = useMemo(() => {
    return filtered.reduce(
      (acc, r) => {
        acc.rentalCount += 1;
        acc.rentalDays += calculateRentalDays(r.startDate, r.returnDate) * r.quantity;
        acc.revenue += r.totalRental;
        acc.advance += r.advance;
        acc.outstanding += r.balance;
        if (r.status === "returned" && r.actualReturnDate && r.actualReturnDate >= range.from && r.actualReturnDate <= range.to) {
          acc.returns += 1;
        }
        return acc;
      },
      { rentalCount: 0, rentalDays: 0, revenue: 0, advance: 0, outstanding: 0, returns: 0 },
    );
  }, [filtered, range]);

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

  const byProduct = useMemo(() => {
    const map = new Map<string, ProductBreakdownRow>();
    for (const r of filtered) {
      const existing = map.get(r.productName) ?? {
        productName: r.productName,
        rentalCount: 0,
        rentalDays: 0,
        revenue: 0,
        advance: 0,
        outstanding: 0,
        lastRentedDate: null,
      };
      existing.rentalCount += 1;
      existing.rentalDays += calculateRentalDays(r.startDate, r.returnDate) * r.quantity;
      existing.revenue += r.totalRental;
      existing.advance += r.advance;
      existing.outstanding += r.balance;
      if (!existing.lastRentedDate || r.startDate > existing.lastRentedDate) {
        existing.lastRentedDate = r.startDate;
      }
      map.set(r.productName, existing);
    }
    return Array.from(map.values()).sort((a, b) => b.revenue - a.revenue);
  }, [filtered]);

  const isLoading = rentals.status === "loading" || inventory.status === "loading";
  const hasError = rentals.status === "error" || inventory.status === "error";

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
          }}
        />
      )}

      {rangeValid && !isLoading && !hasError && (
        <>
          <div className="grid grid-cols-2 gap-3">
            <StatCard label="Rentals" value={summary.rentalCount} />
            <StatCard label="Rental days" value={summary.rentalDays} />
            <StatCard label="Revenue" value={formatCurrency(summary.revenue)} />
            <StatCard label="Advance collected" value={formatCurrency(summary.advance)} />
            <StatCard label="Outstanding balance" value={formatCurrency(summary.outstanding)} />
            <StatCard label="Returns" value={summary.returns} />
          </div>

          <h2 className="mb-3 mt-8 font-display text-[15px] font-semibold text-ink dark:text-ink-inverted">
            Current status
          </h2>
          <p className="mb-3 font-body text-[12px] text-graphite-400">
            Live snapshot — not limited to the selected date range.
          </p>
          <div className="grid grid-cols-2 gap-3">
            <StatCard label="Active rentals" value={liveSnapshot?.active ?? 0} to="/admin/rentals" />
            <StatCard label="Overdue rentals" value={liveSnapshot?.overdue ?? 0} to="/admin/rentals" tone="danger" />
          </div>

          <h2 className="mb-3 mt-8 font-display text-[15px] font-semibold text-ink dark:text-ink-inverted">
            By product
          </h2>

          {byProduct.length === 0 ? (
            <EmptyState
              icon={<ChartIcon />}
              title="No rentals in range"
              description="Try widening the date range above."
            />
          ) : (
            <Card className="overflow-x-auto p-0">
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
          )}
        </>
      )}
    </div>
  );
}
