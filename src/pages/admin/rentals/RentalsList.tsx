import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useAdminRentals } from "../../../hooks/useAdminData";
import { usePagination } from "../../../hooks/usePagination";
import {
  extendRental,
  returnRental,
  cancelRental,
  syncOpenRentalStatuses,
  type AdminRentalListItem,
} from "../../../services/admin-rentals.service";
import {
  calculateRentalTotals,
  validateRentalInput,
  describeRentalError,
  deriveDisplayStatus,
  type RentalDisplayStatus,
} from "../../../utils/rental-calculations";
import { formatCurrency } from "../../../utils/currency";
import { Button } from "../../../components/ui/Button";
import { Card } from "../../../components/ui/Card";
import { StatusBadge } from "../../../components/ui/StatusBadge";
import { Skeleton } from "../../../components/ui/Skeleton";
import { EmptyState } from "../../../components/ui/EmptyState";
import { ErrorState } from "../../../components/ui/ErrorState";
import { ConfirmDialog } from "../../../components/ui/ConfirmDialog";
import { Modal } from "../../../components/ui/Modal";
import { Input } from "../../../components/ui/Input";
import { Select } from "../../../components/ui/Select";
import { Pagination } from "../../../components/ui/Pagination";
import { useToast } from "../../../components/ui/Toast";

const STATUS_LABEL: Record<RentalDisplayStatus, string> = {
  active: "Active",
  due_today: "Due today",
  overdue: "Overdue",
  returned: "Returned",
  cancelled: "Cancelled",
};

const STATUS_TONE: Record<RentalDisplayStatus, "neutral" | "success" | "warning" | "danger" | "info"> = {
  active: "info",
  due_today: "warning",
  overdue: "danger",
  returned: "success",
  cancelled: "neutral",
};

function CalendarIcon() {
  return (
    <svg viewBox="0 0 20 20" fill="none" className="h-6 w-6">
      <rect x="3.5" y="5" width="13" height="11" rx="1.2" stroke="currentColor" strokeWidth="1.5" />
      <path d="M6.5 3v3M13.5 3v3M3.5 8.5h13" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

type Row = AdminRentalListItem & { displayStatus: RentalDisplayStatus };

export function RentalsList() {
  const rentals = useAdminRentals();
  const { showToast } = useToast();
  const [statusFilter, setStatusFilter] = useState<"all" | RentalDisplayStatus>("all");
  const [query, setQuery] = useState("");

  const [extending, setExtending] = useState<Row | null>(null);
  const [extendReturnDate, setExtendReturnDate] = useState("");
  const [extendAdvance, setExtendAdvance] = useState(0);
  const [extendError, setExtendError] = useState<string | null>(null);
  const [savingExtend, setSavingExtend] = useState(false);

  const [returning, setReturning] = useState<Row | null>(null);
  const [savingReturn, setSavingReturn] = useState(false);

  const [cancelling, setCancelling] = useState<Row | null>(null);
  const [savingCancel, setSavingCancel] = useState(false);

  const [syncing, setSyncing] = useState(false);

  const data = useMemo(() => (rentals.status === "success" ? rentals.data : []), [rentals]);

  const rows: Row[] = useMemo(() => {
    return data
      .map((r) => ({ ...r, displayStatus: deriveDisplayStatus(r.status, r.returnDate) }))
      .filter((r) => statusFilter === "all" || r.displayStatus === statusFilter)
      .filter((r) => {
        const q = query.trim().toLowerCase();
        if (!q) return true;
        return r.customerName.toLowerCase().includes(q) || r.customerMobile.includes(q);
      });
  }, [data, statusFilter, query]);

  const { pageItems, page, pageCount, setPage, totalCount, pageSize } = usePagination(rows, {
    resetKey: `${query}-${statusFilter}`,
  });

  const startExtend = (row: Row) => {
    setExtending(row);
    setExtendReturnDate(row.returnDate);
    setExtendAdvance(row.advance);
    setExtendError(null);
  };

  const extendTotals = extending
    ? calculateRentalTotals({
        startDate: extending.startDate,
        returnDate: extendReturnDate,
        dailyRate: extending.dailyRate,
        quantity: extending.quantity,
        advance: extendAdvance,
      })
    : null;

  const handleExtendSave = async () => {
    if (!extending || savingExtend) return;
    const businessErrors = validateRentalInput({
      startDate: extending.startDate,
      returnDate: extendReturnDate,
      dailyRate: extending.dailyRate,
      quantity: extending.quantity,
      advance: extendAdvance,
    });
    if (businessErrors.length > 0) {
      setExtendError(describeRentalError(businessErrors[0]));
      return;
    }
    setSavingExtend(true);
    try {
      await extendRental(extending.id, extendReturnDate, extendAdvance);
      showToast("Rental extended.", "success");
      setExtending(null);
      rentals.refetch();
    } catch {
      setExtendError("Couldn't save this extension. Try again.");
    } finally {
      setSavingExtend(false);
    }
  };

  const handleReturnConfirm = async () => {
    if (!returning) return;
    setSavingReturn(true);
    try {
      await returnRental(returning.id);
      showToast("Rental marked as returned.", "success");
      setReturning(null);
      rentals.refetch();
    } catch {
      showToast("Couldn't update this rental. Try again.", "danger");
    } finally {
      setSavingReturn(false);
    }
  };

  const handleCancelConfirm = async () => {
    if (!cancelling) return;
    setSavingCancel(true);
    try {
      await cancelRental(cancelling.id);
      showToast("Rental cancelled.", "success");
      setCancelling(null);
      rentals.refetch();
    } catch {
      showToast("Couldn't cancel this rental. Try again.", "danger");
    } finally {
      setSavingCancel(false);
    }
  };

  const handleSyncStatuses = async () => {
    if (syncing) return;
    setSyncing(true);
    try {
      const changed = await syncOpenRentalStatuses();
      showToast(
        changed > 0 ? `Updated ${changed} rental status${changed === 1 ? "" : "es"}.` : "Statuses are already up to date.",
        "success",
      );
      rentals.refetch();
    } catch {
      showToast("Couldn't sync statuses. Try again.", "danger");
    } finally {
      setSyncing(false);
    }
  };

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <h1 className="font-display text-[20px] font-bold text-ink dark:text-ink-inverted">
          Rentals
        </h1>
        <div className="flex items-center gap-2">
          <Button size="sm" variant="secondary" onClick={handleSyncStatuses} disabled={syncing}>
            {syncing ? "Syncing…" : "Sync statuses"}
          </Button>
          <Link to="/admin/rentals/new">
            <Button size="sm"><svg viewBox="0 0 20 20" fill="none" className="h-4 w-4" aria-hidden="true"><path d="M10 4.5v11M4.5 10h11" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" /></svg>New rental</Button>
          </Link>
        </div>
      </div>

      <div className="mb-4 flex flex-col gap-2 sm:flex-row">
        <div className="flex h-11 min-w-0 flex-1 items-center gap-2 rounded-lg border border-graphite-200 bg-white px-3 shadow-card dark:border-graphite-800 dark:bg-graphite-900">
          <svg viewBox="0 0 24 24" fill="none" strokeWidth={1.6} aria-hidden="true" className="h-4 w-4 flex-shrink-0 text-graphite-400">
            <circle cx="10.5" cy="10.5" r="6.5" stroke="currentColor" />
            <path d="M20 20l-4.3-4.3" stroke="currentColor" strokeLinecap="round" />
          </svg>
          <input
            type="search"
            inputMode="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search by customer or mobile"
            aria-label="Search by customer name or mobile"
            className="h-full min-w-0 flex-1 overflow-hidden text-ellipsis bg-transparent font-body text-[14px] text-ink outline-none placeholder:text-graphite-400 dark:text-ink-inverted"
          />
        </div>
        <Select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value as "all" | RentalDisplayStatus)}
          className="sm:w-44"
        >
          <option value="all">All statuses</option>
          {(Object.keys(STATUS_LABEL) as RentalDisplayStatus[]).map((s) => (
            <option key={s} value={s}>{STATUS_LABEL[s]}</option>
          ))}
        </Select>
      </div>

      {rentals.status === "loading" && (
        <div className="space-y-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-24 w-full" />
          ))}
        </div>
      )}

      {rentals.status === "error" && (
        <ErrorState title="Couldn't load rentals" onRetry={rentals.refetch} />
      )}

      {rentals.status === "success" && rows.length === 0 && (
        <EmptyState
          icon={<CalendarIcon />}
          title={data.length === 0 ? "No rentals yet" : "No rentals matched"}
          description={
            data.length === 0
              ? "Create your first rental to start tracking active tool hires."
              : "Try a different search or status filter."
          }
          action={
            data.length === 0 ? (
              <Link to="/admin/rentals/new">
                <Button size="sm"><svg viewBox="0 0 20 20" fill="none" className="h-4 w-4" aria-hidden="true"><path d="M10 4.5v11M4.5 10h11" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" /></svg>New rental</Button>
              </Link>
            ) : undefined
          }
        />
      )}

      {rentals.status === "success" && rows.length > 0 && (
        <div className="space-y-3">
          {pageItems.map((rental) => {
            const actionable = rental.displayStatus !== "returned" && rental.displayStatus !== "cancelled";
            return (
              <Card key={rental.id} className="p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-body text-[14px] font-medium text-ink dark:text-ink-inverted">
                      {rental.customerName}
                    </p>
                    <p className="font-mono text-[12px] text-graphite-400">{rental.customerMobile}</p>
                  </div>
                  <StatusBadge
                    label={STATUS_LABEL[rental.displayStatus]}
                    tone={STATUS_TONE[rental.displayStatus]}
                  />
                </div>

                <p className="mt-2 font-body text-[13px] text-graphite-600 dark:text-graphite-300">
                  {rental.productName} — {rental.variantLabel} · Qty {rental.quantity}
                </p>
                <p className="font-mono text-[12px] text-graphite-400">
                  {rental.startDate} → {rental.returnDate}
                  {rental.actualReturnDate ? ` (returned ${rental.actualReturnDate})` : ""}
                </p>

                <div className="mt-2 flex items-center justify-between font-mono text-[13px] text-ink dark:text-ink-inverted">
                  <span>{formatCurrency(rental.totalRental)} total</span>
                  <span className={rental.balance > 0 ? "font-semibold text-ink dark:text-ink-inverted" : ""}>
                    {formatCurrency(rental.balance)} due
                  </span>
                </div>

                {actionable && (
                  <div className="mt-3 flex flex-wrap gap-2 border-t border-graphite-200 pt-3 dark:border-graphite-800">
                    <Button variant="secondary" size="sm" onClick={() => startExtend(rental)}>
                      Extend
                    </Button>
                    <Button variant="secondary" size="sm" onClick={() => setReturning(rental)}>
                      Mark returned
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-state-danger"
                      onClick={() => setCancelling(rental)}
                    >
                      Cancel
                    </Button>
                  </div>
                )}
              </Card>
            );
          })}
        </div>
      )}

      {rentals.status === "success" && rows.length > 0 && (
        <Pagination
          page={page}
          pageCount={pageCount}
          onPageChange={setPage}
          totalCount={totalCount}
          pageSize={pageSize}
        />
      )}

      <Modal open={!!extending} onClose={() => setExtending(null)} title="Extend rental">
        {extending && (
          <div className="space-y-3">
            <p className="font-body text-[13px] text-graphite-500">
              {extending.customerName} — {extending.productName} ({extending.variantLabel})
            </p>
            <Input
              label="New return date"
              type="date"
              value={extendReturnDate}
              onChange={(e) => setExtendReturnDate(e.target.value)}
            />
            <Input
              label="Total advance received (₹)"
              type="number"
              min={0}
              value={extendAdvance}
              onChange={(e) => setExtendAdvance(Number(e.target.value))}
              hint="Update this if the customer paid more advance at extension."
            />
            {extendTotals && (
              <div className="rounded border border-graphite-300 bg-graphite-100 p-3 font-mono text-[13px] text-ink dark:border-graphite-700 dark:bg-graphite-800 dark:text-ink-inverted">
                <div className="flex items-center justify-between">
                  <span>{extendTotals.rentalDays} day{extendTotals.rentalDays === 1 ? "" : "s"}</span>
                  <span>{formatCurrency(extendTotals.totalRental)}</span>
                </div>
                <div className="mt-1 flex items-center justify-between font-semibold">
                  <span>Balance due</span>
                  <span>{formatCurrency(extendTotals.balance)}</span>
                </div>
              </div>
            )}
            {extendError && (
              <p className="font-body text-[12px] text-state-danger">{extendError}</p>
            )}
            <div className="flex gap-2 pt-1">
              <Button variant="secondary" fullWidth onClick={() => setExtending(null)} disabled={savingExtend}>
                Cancel
              </Button>
              <Button fullWidth onClick={handleExtendSave} disabled={savingExtend}>
                {savingExtend ? "Saving…" : "Save"}
              </Button>
            </div>
          </div>
        )}
      </Modal>

      <ConfirmDialog
        open={!!returning}
        title="Mark as returned?"
        description={
          returning
            ? `${returning.productName} (${returning.variantLabel}) from ${returning.customerName} will be marked returned today and its stock released.`
            : undefined
        }
        confirmLabel="Mark returned"
        onConfirm={handleReturnConfirm}
        onCancel={() => setReturning(null)}
        loading={savingReturn}
      />

      <ConfirmDialog
        open={!!cancelling}
        title="Cancel this rental?"
        description={
          cancelling
            ? `This rental for ${cancelling.customerName} will be cancelled and its stock released.`
            : undefined
        }
        confirmLabel="Cancel rental"
        onConfirm={handleCancelConfirm}
        onCancel={() => setCancelling(null)}
        loading={savingCancel}
      />
    </div>
  );
}
