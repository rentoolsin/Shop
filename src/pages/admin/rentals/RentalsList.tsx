import { Calendar, Plus, ArrowsClockwise, PencilSimple, DotsThreeVertical, CheckCircle } from "@phosphor-icons/react";
import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useAdminRentals, useAdminRentalPayments } from "../../../hooks/useAdminData";
import { usePagination } from "../../../hooks/usePagination";
import {
  extendRental,
  returnRental,
  cancelRental,
  updateRental,
  deleteRental,
  syncOpenRentalStatuses,
  recordRentalPayment,
  deleteRentalPayment,
  paymentMethodLabel,
  type AdminRentalListItem,
} from "../../../services/admin-rentals.service";
import type { PaymentMethod } from "../../../types/database";
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
import { SearchBar } from "../../../components/ui/SearchBar";
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
import { Table, TableHead, TableHeaderCell, TableBody, TableRow, TableCell } from "../../../components/ui/Table";

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

function CalendarIcon({ className = "h-6 w-6" }: { className?: string }) {
  return <Calendar className={className} weight="light" />;
}

function PlusIcon() {
  return <Plus className="h-4 w-4" weight="regular" aria-hidden="true" />;
}

function RefreshIcon({ spinning }: { spinning?: boolean }) {
  return (
    <ArrowsClockwise
      className={["h-4 w-4", spinning ? "animate-spin" : ""].join(" ")}
      weight="light"
      aria-hidden="true"
    />
  );
}

function PencilIcon() {
  return <PencilSimple className="h-4 w-4" weight="light" aria-hidden="true" />;
}

function MoreIcon() {
  return <DotsThreeVertical className="h-4 w-4" weight="regular" aria-hidden="true" />;
}

function CheckCircleIcon() {
  return <CheckCircle className="h-4 w-4" weight="light" aria-hidden="true" />;
}

/** Friendly display reference for a rental — derived from the real record id, never invented. */
function rentalReference(id: string) {
  return `RNT-${id.replace(/-/g, "").slice(0, 8).toUpperCase()}`;
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
  const [returnAmount, setReturnAmount] = useState("");
  const [returnMethod, setReturnMethod] = useState<PaymentMethod>("cash");
  const [returnNotes, setReturnNotes] = useState("");
  const [returnError, setReturnError] = useState<string | null>(null);
  const [savingReturn, setSavingReturn] = useState(false);

  const [cancelling, setCancelling] = useState<Row | null>(null);
  const [savingCancel, setSavingCancel] = useState(false);

  const [editing, setEditing] = useState<Row | null>(null);
  const [editQuantity, setEditQuantity] = useState(1);
  const [editStartDate, setEditStartDate] = useState("");
  const [editReturnDate, setEditReturnDate] = useState("");
  const [editDailyRate, setEditDailyRate] = useState(0);
  const [editAdvance, setEditAdvance] = useState(0);
  const [editError, setEditError] = useState<string | null>(null);
  const [savingEdit, setSavingEdit] = useState(false);

  const [deleting, setDeleting] = useState<Row | null>(null);
  const [savingDelete, setSavingDelete] = useState(false);

  const [viewing, setViewing] = useState<Row | null>(null);

  const payments = useAdminRentalPayments(viewing?.id);
  const [payAmount, setPayAmount] = useState("");
  const [payDate, setPayDate] = useState("");
  const [payMethod, setPayMethod] = useState<PaymentMethod>("cash");
  const [payNotes, setPayNotes] = useState("");
  const [payError, setPayError] = useState<string | null>(null);
  const [savingPayment, setSavingPayment] = useState(false);
  const [deletingPaymentId, setDeletingPaymentId] = useState<string | null>(null);

  const [syncing, setSyncing] = useState(false);

  // Overflow ("...") menu on each mobile card — same pattern as ProductsList,
  // so the less-common per-row actions (Extend, Cancel, Delete) don't need
  // their own always-visible buttons.
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);

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

  // The details popup holds a snapshot `Row` from whenever it was opened;
  // after recording/removing a payment the balance changes, so re-derive
  // the row being shown from the latest fetched data (falling back to the
  // snapshot if it's since disappeared, e.g. mid-delete).
  const viewingLive: Row | null = useMemo(() => {
    if (!viewing) return null;
    const fresh = data.find((r) => r.id === viewing.id);
    return fresh ? { ...fresh, displayStatus: deriveDisplayStatus(fresh.status, fresh.returnDate) } : viewing;
  }, [viewing, data]);

  // `advance` is a single running total that can also be edited directly
  // (Edit/Extend forms, as a deliberate manual override — see
  // 0020_rental_payments.sql). The itemized list below only reflects
  // amounts logged through "Record a payment", so the two can legitimately
  // differ (e.g. an advance taken before this feature existed, or a manual
  // correction). Surface that gap instead of leaving the balance math
  // silently unexplained against what's listed.
  const unitemizedAdvance = useMemo(() => {
    if (!viewingLive || payments.status !== "success") return 0;
    const itemized = payments.data.reduce((sum, p) => sum + p.amount, 0);
    const gap = Math.round((viewingLive.advance - itemized) * 100) / 100;
    return gap > 0 ? gap : 0;
  }, [viewingLive, payments]);

  const startExtend = (row: Row) => {
    setExtending(row);
    setExtendReturnDate(row.returnDate);
    setExtendAdvance(row.advance);
    setExtendError(null);
  };

  // Pre-fill with the outstanding balance so the common case — customer
  // settles up in full when they bring the tool back — is just "confirm",
  // while still letting the admin change or zero it out for partial /
  // no-payment returns.
  const startReturn = (row: Row) => {
    setReturning(row);
    setReturnAmount(row.balance > 0 ? String(row.balance) : "");
    setReturnMethod("cash");
    setReturnNotes("");
    setReturnError(null);
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
    if (!returning || savingReturn) return;
    const trimmed = returnAmount.trim();
    const amount = trimmed === "" ? 0 : Number(trimmed);
    if (Number.isNaN(amount) || amount < 0) {
      setReturnError("Enter a valid amount, or leave it blank if nothing was collected.");
      return;
    }
    setReturnError(null);
    setSavingReturn(true);
    try {
      await returnRental(returning.id);
    } catch {
      setReturnError("Couldn't mark this rental as returned. Try again.");
      setSavingReturn(false);
      return;
    }
    if (amount > 0) {
      try {
        await recordRentalPayment({
          rentalId: returning.id,
          amount,
          paymentDate: new Date().toISOString().slice(0, 10),
          method: returnMethod,
          notes: returnNotes.trim() || "Collected at return",
        });
        showToast(`Rental marked returned — ${formatCurrency(amount)} recorded.`, "success");
      } catch {
        // Status update already succeeded — don't tell the admin the whole
        // action failed, or they may retry "Mark returned" on an already-
        // returned rental. Surface the payment failure on its own so they
        // know to add it manually instead.
        showToast(
          "Rental marked as returned, but the payment couldn't be recorded — add it from the rental's details.",
          "danger",
        );
      }
    } else {
      showToast("Rental marked as returned.", "success");
    }
    setReturning(null);
    rentals.refetch();
    setSavingReturn(false);
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

  const startEdit = (row: Row) => {
    setEditing(row);
    setEditQuantity(row.quantity);
    setEditStartDate(row.startDate);
    setEditReturnDate(row.returnDate);
    setEditDailyRate(row.dailyRate);
    setEditAdvance(row.advance);
    setEditError(null);
  };

  const editTotals = editing
    ? calculateRentalTotals({
        startDate: editStartDate,
        returnDate: editReturnDate,
        dailyRate: editDailyRate,
        quantity: editQuantity,
        advance: editAdvance,
      })
    : null;

  const handleEditSave = async () => {
    if (!editing || savingEdit) return;
    const businessErrors = validateRentalInput({
      startDate: editStartDate,
      returnDate: editReturnDate,
      dailyRate: editDailyRate,
      quantity: editQuantity,
      advance: editAdvance,
    });
    if (businessErrors.length > 0) {
      setEditError(describeRentalError(businessErrors[0]));
      return;
    }
    setSavingEdit(true);
    try {
      await updateRental(editing.id, {
        quantity: editQuantity,
        startDate: editStartDate,
        returnDate: editReturnDate,
        dailyRate: editDailyRate,
        advance: editAdvance,
      });
      showToast("Rental updated.", "success");
      setEditing(null);
      rentals.refetch();
    } catch {
      setEditError("Couldn't save these changes. Try again.");
    } finally {
      setSavingEdit(false);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!deleting) return;
    setSavingDelete(true);
    try {
      await deleteRental(deleting.id);
      showToast("Rental deleted.", "success");
      setDeleting(null);
      rentals.refetch();
    } catch {
      showToast("Couldn't delete this rental. Try again.", "danger");
    } finally {
      setSavingDelete(false);
    }
  };

  // Reset the "record payment" mini-form whenever a different rental's
  // details popup opens (or it closes), so a half-filled form never
  // leaks onto the next rental.
  useEffect(() => {
    setPayAmount("");
    setPayDate(new Date().toISOString().slice(0, 10));
    setPayMethod("cash");
    setPayNotes("");
    setPayError(null);
  }, [viewing?.id]);

  const handleRecordPayment = async () => {
    if (!viewing || savingPayment) return;
    const amount = Number(payAmount);
    if (!payAmount || Number.isNaN(amount) || amount <= 0) {
      setPayError("Enter a payment amount greater than zero.");
      return;
    }
    if (!payDate) {
      setPayError("Choose the date this payment was made.");
      return;
    }
    setPayError(null);
    setSavingPayment(true);
    try {
      await recordRentalPayment({
        rentalId: viewing.id,
        amount,
        paymentDate: payDate,
        method: payMethod,
        notes: payNotes.trim() || undefined,
      });
      showToast("Payment recorded.", "success");
      setPayAmount("");
      setPayNotes("");
      payments.refetch();
      rentals.refetch();
    } catch {
      setPayError("Couldn't record this payment. Try again.");
    } finally {
      setSavingPayment(false);
    }
  };

  const handleDeletePayment = async (paymentId: string) => {
    if (deletingPaymentId) return;
    setDeletingPaymentId(paymentId);
    try {
      await deleteRentalPayment(paymentId);
      showToast("Payment removed.", "success");
      payments.refetch();
      rentals.refetch();
    } catch {
      showToast("Couldn't remove this payment. Try again.", "danger");
    } finally {
      setDeletingPaymentId(null);
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
      <div className="mb-4 flex items-center justify-between gap-3">
        <h1 className="font-display text-[26px] font-extrabold tracking-tight text-ink dark:text-ink-inverted">
          Rentals
        </h1>
        <Link to="/admin/rentals/new">
          <Button size="md">
            <PlusIcon />
            New rental
          </Button>
        </Link>
      </div>

      {/* Rentals / Sync statuses segmented row */}
      <div className="mb-4 flex items-center gap-1 rounded bg-graphite-100 p-1 dark:bg-graphite-800">
        <span className="flex h-11 flex-1 items-center justify-center gap-2 rounded bg-white font-body text-[13.5px] font-semibold text-ink shadow-card dark:bg-graphite-900 dark:text-ink-inverted">
          <CalendarIcon className="h-4 w-4" />
          Rentals
        </span>
        <button
          type="button"
          onClick={handleSyncStatuses}
          disabled={syncing}
          className="flex h-11 flex-1 items-center justify-center gap-2 rounded font-body text-[13.5px] font-medium text-graphite-500 disabled:opacity-60 dark:text-graphite-400"
        >
          <RefreshIcon spinning={syncing} />
          {syncing ? "Syncing…" : "Sync statuses"}
        </button>
      </div>

      <div className="mb-4 flex flex-col gap-2 sm:flex-row">
        <SearchBar
          value={query}
          onChange={setQuery}
          placeholder="Search by customer or mobile"
          aria-label="Search by customer name or mobile"
        />
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
          size="lg"
          className="shadow-card"
          icon={<CalendarIcon className="h-9 w-9" />}
          title={data.length === 0 ? "No rentals yet" : "No rentals matched"}
          description={
            data.length === 0
              ? "Create your first rental to start tracking active tool hires."
              : "Try a different search or status filter."
          }
          action={
            data.length === 0 ? (
              <Link to="/admin/rentals/new">
                <Button size="md">
                  <PlusIcon />
                  New rental
                </Button>
              </Link>
            ) : undefined
          }
        />
      )}

      {rentals.status === "success" && rows.length > 0 && (
        <>
          <div className="mb-2 flex items-center justify-between">
            <h2 className="font-display text-[15px] font-semibold text-ink dark:text-ink-inverted">
              {data.length === rows.length ? "Recent rentals" : "Matching rentals"}
            </h2>
            <span className="font-body text-[12px] text-graphite-400">
              {totalCount} total
            </span>
          </div>

          {/* Mobile / tablet: stacked cards */}
          <div className="space-y-3 md:hidden">
            {pageItems.map((rental) => {
              const actionable = rental.displayStatus !== "returned" && rental.displayStatus !== "cancelled";
              return (
                <Card key={rental.id} className="overflow-hidden p-3">
                  <div className="flex items-start gap-3">
                    <button
                      type="button"
                      onClick={() => setViewing(rental)}
                      aria-label={`View details for ${rental.productName}`}
                      className="flex h-12 w-12 flex-shrink-0 items-center justify-center overflow-hidden rounded bg-graphite-100 dark:bg-graphite-800"
                    >
                      {rental.productImageUrl ? (
                        <img src={rental.productImageUrl} alt="" className="h-full w-full object-cover" />
                      ) : (
                        <span className="font-display text-[14px] text-graphite-400">
                          {rental.productName.charAt(0)}
                        </span>
                      )}
                    </button>

                    <div className="min-w-0 flex-1">
                      <div className="flex items-start justify-between gap-2">
                        <button
                          type="button"
                          onClick={() => setViewing(rental)}
                          className="block min-w-0 truncate text-left font-display text-[14px] font-bold uppercase tracking-tight text-ink hover:underline dark:text-ink-inverted"
                        >
                          {rental.productName}
                        </button>
                        <span className="flex-shrink-0">
                          <StatusBadge
                            label={STATUS_LABEL[rental.displayStatus]}
                            tone={STATUS_TONE[rental.displayStatus]}
                          />
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() => setViewing(rental)}
                        className="font-mono text-[11.5px] text-graphite-400 hover:underline"
                      >
                        {rentalReference(rental.id)}
                      </button>
                    </div>
                  </div>

                  {/* Full card width now — no longer squeezed by the header
                      row's status/chevron column, which is what was
                      wrapping the date range mid-word on narrow phones. */}
                  <p className="mt-2 flex items-center gap-1 font-body text-[12px] text-graphite-500">
                    <CalendarIcon className="h-3.5 w-3.5 flex-shrink-0" />
                    {rental.startDate} → {rental.returnDate}
                  </p>

                  <div className="mt-2 flex items-center justify-between border-t border-graphite-100 pt-2.5 font-mono text-[12.5px] text-ink dark:border-graphite-800 dark:text-ink-inverted">
                    <span className="truncate text-graphite-500">
                      {rental.customerName} · {rental.customerMobile}
                    </span>
                    <span className={rental.balance > 0 ? "flex-shrink-0 font-semibold" : "flex-shrink-0 text-graphite-500"}>
                      {formatCurrency(rental.balance)} due
                    </span>
                  </div>

                  {/* Same compact "primary actions + overflow menu" language
                      as ProductsList: at most one contextual primary
                      button, an always-present Edit icon, and everything
                      else (Extend, Cancel, Delete) tucked behind "...". */}
                  <div className="mt-2.5 flex items-center justify-end gap-1 border-t border-graphite-100 pt-2.5 dark:border-graphite-800">
                    {actionable && (
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => startReturn(rental)}
                        className="mr-auto"
                      >
                        <CheckCircleIcon />
                        Mark returned
                      </Button>
                    )}
                    <button
                      type="button"
                      onClick={() => startEdit(rental)}
                      aria-label={`Edit rental for ${rental.customerName}`}
                      className="flex h-9 w-9 items-center justify-center rounded text-graphite-500 hover:bg-graphite-100 dark:text-graphite-400 dark:hover:bg-graphite-800"
                    >
                      <PencilIcon />
                    </button>
                    <div className="relative">
                      <button
                        type="button"
                        aria-label={`More actions for ${rental.customerName}'s rental`}
                        onClick={() => setOpenMenuId((id) => (id === rental.id ? null : rental.id))}
                        className="flex h-9 w-9 items-center justify-center rounded text-graphite-500 hover:bg-graphite-100 dark:text-graphite-400 dark:hover:bg-graphite-800"
                      >
                        <MoreIcon />
                      </button>
                      {openMenuId === rental.id && (
                        <>
                          <button
                            type="button"
                            aria-label="Close menu"
                            className="fixed inset-0 z-10 cursor-default"
                            onClick={() => setOpenMenuId(null)}
                          />
                          <div className="absolute right-0 top-10 z-20 w-40 overflow-hidden rounded border border-graphite-200 bg-white py-1 shadow-raised dark:border-graphite-800 dark:bg-graphite-900">
                            {actionable && (
                              <button
                                type="button"
                                onClick={() => {
                                  setOpenMenuId(null);
                                  startExtend(rental);
                                }}
                                className="block w-full px-3 py-2 text-left font-body text-[13px] font-medium text-ink hover:bg-graphite-100 dark:text-ink-inverted dark:hover:bg-graphite-800"
                              >
                                Extend
                              </button>
                            )}
                            {actionable && (
                              <button
                                type="button"
                                onClick={() => {
                                  setOpenMenuId(null);
                                  setCancelling(rental);
                                }}
                                className="block w-full px-3 py-2 text-left font-body text-[13px] font-medium text-state-danger-text hover:bg-graphite-100 dark:text-state-danger-text-dark dark:hover:bg-graphite-800"
                              >
                                Cancel rental
                              </button>
                            )}
                            <button
                              type="button"
                              onClick={() => {
                                setOpenMenuId(null);
                                setDeleting(rental);
                              }}
                              className="block w-full px-3 py-2 text-left font-body text-[13px] font-medium text-state-danger-text hover:bg-graphite-100 dark:text-state-danger-text-dark dark:hover:bg-graphite-800"
                            >
                              Delete
                            </button>
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>

          {/* Desktop: dense table — same data, no per-card chrome so a full
              page of rentals reads at a glance instead of scrolling through
              stacked phone-width cards. */}
          <div className="hidden md:block">
            <Table>
              <TableHead>
                <TableHeaderCell>Product</TableHeaderCell>
                <TableHeaderCell>Customer</TableHeaderCell>
                <TableHeaderCell>Dates</TableHeaderCell>
                <TableHeaderCell>Status</TableHeaderCell>
                <TableHeaderCell className="text-right">Balance</TableHeaderCell>
                <TableHeaderCell className="text-right">Actions</TableHeaderCell>
              </TableHead>
              <TableBody>
                {pageItems.map((rental) => {
                  const actionable = rental.displayStatus !== "returned" && rental.displayStatus !== "cancelled";
                  return (
                    <TableRow key={rental.id}>
                      <TableCell>
                        <button
                          type="button"
                          onClick={() => setViewing(rental)}
                          className="flex min-w-0 items-center gap-3 text-left"
                        >
                          <span className="flex h-10 w-10 flex-shrink-0 items-center justify-center overflow-hidden rounded bg-graphite-100 dark:bg-graphite-800">
                            {rental.productImageUrl ? (
                              <img src={rental.productImageUrl} alt="" className="h-full w-full object-cover" />
                            ) : (
                              <span className="font-display text-[13px] text-graphite-400">
                                {rental.productName.charAt(0)}
                              </span>
                            )}
                          </span>
                          <span className="min-w-0">
                            <span className="block truncate font-display text-[13px] font-bold uppercase tracking-tight text-ink hover:underline dark:text-ink-inverted">
                              {rental.productName}
                            </span>
                            <span className="block font-mono text-[11px] text-graphite-400">
                              {rentalReference(rental.id)}
                              {rental.variantLabel ? ` · ${rental.variantLabel}` : ""}
                            </span>
                          </span>
                        </button>
                      </TableCell>
                      <TableCell>
                        <span className="block text-ink dark:text-ink-inverted">{rental.customerName}</span>
                        <span className="block font-mono text-[11.5px] text-graphite-400">{rental.customerMobile}</span>
                      </TableCell>
                      <TableCell className="font-mono text-[12px] text-graphite-500 whitespace-nowrap">
                        {rental.startDate} → {rental.returnDate}
                      </TableCell>
                      <TableCell>
                        <StatusBadge
                          label={STATUS_LABEL[rental.displayStatus]}
                          tone={STATUS_TONE[rental.displayStatus]}
                        />
                      </TableCell>
                      <TableCell className="text-right font-mono whitespace-nowrap">
                        <span className={rental.balance > 0 ? "font-semibold" : "text-graphite-500"}>
                          {formatCurrency(rental.balance)}
                        </span>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex flex-wrap items-center justify-end gap-1.5">
                          {actionable && (
                            <>
                              <Button variant="ghost" size="sm" onClick={() => startExtend(rental)}>
                                Extend
                              </Button>
                              <Button variant="ghost" size="sm" onClick={() => startReturn(rental)}>
                                Return
                              </Button>
                            </>
                          )}
                          <Button variant="ghost" size="sm" onClick={() => startEdit(rental)}>
                            Edit
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-state-danger-text dark:text-state-danger-text-dark"
                            onClick={() => (actionable ? setCancelling(rental) : setDeleting(rental))}
                          >
                            {actionable ? "Cancel" : "Delete"}
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        </>
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

      <Modal open={!!extending} onClose={() => setExtending(null)} title="Extend rental" size="md">
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
              hint="Manual override of the running total — for a dated, itemized entry (with method/notes) use “Record a payment” from the rental's details view instead."
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
              <p className="font-body text-[12px] text-state-danger-text dark:text-state-danger-text-dark">{extendError}</p>
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

      <Modal open={!!editing} onClose={() => setEditing(null)} title="Edit rental" size="md">
        {editing && (
          <div className="space-y-3">
            <p className="font-body text-[13px] text-graphite-500">
              {editing.customerName} — {editing.productName} ({editing.variantLabel})
            </p>
            <div className="grid grid-cols-2 gap-3">
              <Input
                label="Quantity"
                type="number"
                min={1}
                inputMode="numeric"
                value={editQuantity}
                onChange={(e) => setEditQuantity(Number(e.target.value))}
              />
              <Input
                label="Daily rate (₹)"
                type="number"
                min={0}
                value={editDailyRate}
                onChange={(e) => setEditDailyRate(Number(e.target.value))}
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <Input
                label="Start date"
                type="date"
                value={editStartDate}
                onChange={(e) => setEditStartDate(e.target.value)}
              />
              <Input
                label="Return date"
                type="date"
                value={editReturnDate}
                onChange={(e) => setEditReturnDate(e.target.value)}
              />
            </div>
            <Input
              label="Advance received (₹)"
              type="number"
              min={0}
              value={editAdvance}
              onChange={(e) => setEditAdvance(Number(e.target.value))}
              hint="Manual override of the running total — for a dated, itemized entry (with method/notes) use “Record a payment” from the rental's details view instead."
            />
            {editTotals && (
              <div className="rounded border border-graphite-300 bg-graphite-100 p-3 font-mono text-[13px] text-ink dark:border-graphite-700 dark:bg-graphite-800 dark:text-ink-inverted">
                <div className="flex items-center justify-between">
                  <span>{editTotals.rentalDays} day{editTotals.rentalDays === 1 ? "" : "s"}</span>
                  <span>{formatCurrency(editTotals.totalRental)}</span>
                </div>
                <div className="mt-1 flex items-center justify-between font-semibold">
                  <span>Balance due</span>
                  <span>{formatCurrency(editTotals.balance)}</span>
                </div>
              </div>
            )}
            {editError && (
              <p className="font-body text-[12px] text-state-danger-text dark:text-state-danger-text-dark">{editError}</p>
            )}
            <div className="flex gap-2 pt-1">
              <Button variant="secondary" fullWidth onClick={() => setEditing(null)} disabled={savingEdit}>
                Cancel
              </Button>
              <Button fullWidth onClick={handleEditSave} disabled={savingEdit}>
                {savingEdit ? "Saving…" : "Save changes"}
              </Button>
            </div>
          </div>
        )}
      </Modal>

      <Modal open={!!viewing} onClose={() => setViewing(null)} title="Rental details" size="lg">
        {viewingLive && (
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <span className="flex h-16 w-16 flex-shrink-0 items-center justify-center overflow-hidden rounded bg-graphite-100 dark:bg-graphite-800">
                {viewingLive.productImageUrl ? (
                  <img src={viewingLive.productImageUrl} alt="" className="h-full w-full object-cover" />
                ) : (
                  <span className="font-display text-[18px] text-graphite-400">
                    {viewingLive.productName.charAt(0)}
                  </span>
                )}
              </span>
              <div className="min-w-0">
                <p className="truncate font-display text-[15px] font-bold uppercase tracking-tight text-ink dark:text-ink-inverted">
                  {viewingLive.productName}
                </p>
                <p className="font-mono text-[12px] text-graphite-400">{rentalReference(viewingLive.id)}</p>
                <StatusBadge
                  label={STATUS_LABEL[viewingLive.displayStatus]}
                  tone={STATUS_TONE[viewingLive.displayStatus]}
                />
              </div>
            </div>

            {/* Info + totals sit stacked on phones, side by side from md: up —
                the "lg" modal width gives them room to breathe instead of
                one long single column of rows. */}
            <div className="space-y-4 md:grid md:grid-cols-2 md:items-start md:gap-3 md:space-y-0">
              <div className="space-y-1.5 rounded border border-graphite-200 p-3 font-body text-[13px] text-ink dark:border-graphite-800 dark:text-ink-inverted">
                <div className="flex items-center justify-between">
                  <span className="text-graphite-500">Customer</span>
                  <span>{viewingLive.customerName}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-graphite-500">Mobile</span>
                  <span className="font-mono">{viewingLive.customerMobile}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-graphite-500">Size / variant</span>
                  <span>{viewingLive.variantLabel || "—"}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-graphite-500">Quantity</span>
                  <span>{viewingLive.quantity}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-graphite-500">Start date</span>
                  <span>{viewingLive.startDate}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-graphite-500">Return date</span>
                  <span>{viewingLive.returnDate}</span>
                </div>
                {viewingLive.actualReturnDate && (
                  <div className="flex items-center justify-between">
                    <span className="text-graphite-500">Actually returned</span>
                    <span>{viewingLive.actualReturnDate}</span>
                  </div>
                )}
                <div className="flex items-center justify-between">
                  <span className="text-graphite-500">Daily rate</span>
                  <span>{formatCurrency(viewingLive.dailyRate)}</span>
                </div>
              </div>

              <div className="rounded border border-graphite-300 bg-graphite-100 p-3 font-mono text-[13px] text-ink dark:border-graphite-700 dark:bg-graphite-800 dark:text-ink-inverted">
                <div className="flex items-center justify-between">
                  <span>Total rental</span>
                  <span>{formatCurrency(viewingLive.totalRental)}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Advance / paid so far</span>
                  <span>{formatCurrency(viewingLive.advance)}</span>
                </div>
                <div className="mt-1 flex items-center justify-between font-semibold">
                  <span>Balance due</span>
                  <span>{formatCurrency(viewingLive.balance)}</span>
                </div>
              </div>
            </div>

            <div className="space-y-2 border-t border-graphite-200 pt-4 dark:border-graphite-800">
              <p className="font-body text-[12px] font-medium text-graphite-500">Payment history</p>

              {unitemizedAdvance > 0 && (
                <p className="rounded border border-graphite-200 bg-graphite-50 px-3 py-2 font-body text-[12px] text-graphite-500 dark:border-graphite-800 dark:bg-graphite-800/60 dark:text-graphite-400">
                  {formatCurrency(unitemizedAdvance)} of the advance isn't itemized below — likely entered directly
                  via Edit/Extend rather than "Record a payment".
                </p>
              )}

              {payments.status === "loading" && (
                <div className="space-y-1.5">
                  <Skeleton className="h-9 w-full" />
                  <Skeleton className="h-9 w-full" />
                </div>
              )}

              {payments.status === "error" && (
                <p className="font-body text-[12px] text-state-danger-text dark:text-state-danger-text-dark">
                  Couldn't load payment history.
                </p>
              )}

              {payments.status === "success" && payments.data.length === 0 && (
                <p className="font-body text-[12px] text-graphite-400">No payments logged yet.</p>
              )}

              {payments.status === "success" && payments.data.length > 0 && (
                <div className="divide-y divide-graphite-100 rounded border border-graphite-200 dark:divide-graphite-800 dark:border-graphite-800">
                  {payments.data.map((p) => (
                    <div key={p.id} className="flex items-center justify-between gap-2 px-3 py-2 font-body text-[12.5px] text-ink dark:text-ink-inverted">
                      <div className="min-w-0">
                        <p className="font-mono font-semibold">{formatCurrency(p.amount)}</p>
                        <p className="truncate text-graphite-400">
                          {p.paymentDate} · {paymentMethodLabel(p.method)}
                          {p.notes ? ` · ${p.notes}` : ""}
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleDeletePayment(p.id)}
                        disabled={deletingPaymentId === p.id}
                        className="flex-shrink-0 font-body text-[12px] font-medium text-state-danger-text hover:underline disabled:opacity-60 dark:text-state-danger-text-dark"
                      >
                        {deletingPaymentId === p.id ? "Removing…" : "Remove"}
                      </button>
                    </div>
                  ))}
                </div>
              )}

              <div className="space-y-2 rounded border border-graphite-200 p-3 dark:border-graphite-800">
                <p className="font-body text-[12px] font-medium text-graphite-500">Record a payment</p>
                <div className="grid grid-cols-2 gap-2 md:grid-cols-4">
                  <Input
                    label="Amount (₹)"
                    type="number"
                    min={0}
                    value={payAmount}
                    onChange={(e) => setPayAmount(e.target.value)}
                  />
                  <Input
                    label="Date paid"
                    type="date"
                    value={payDate}
                    onChange={(e) => setPayDate(e.target.value)}
                  />
                  <div className="col-span-2 md:col-span-1">
                    <Select
                      label="Method"
                      value={payMethod}
                      onChange={(e) => setPayMethod(e.target.value as PaymentMethod)}
                    >
                      <option value="cash">Cash</option>
                      <option value="upi">UPI</option>
                      <option value="card">Card</option>
                      <option value="bank_transfer">Bank transfer</option>
                      <option value="other">Other</option>
                    </Select>
                  </div>
                  <div className="col-span-2 md:col-span-1">
                    <Input
                      label="Note (optional)"
                      value={payNotes}
                      onChange={(e) => setPayNotes(e.target.value)}
                      placeholder="e.g. Paid after return"
                    />
                  </div>
                </div>
                {payError && (
                  <p className="font-body text-[12px] text-state-danger-text dark:text-state-danger-text-dark">{payError}</p>
                )}
                <Button size="sm" fullWidth onClick={handleRecordPayment} disabled={savingPayment}>
                  {savingPayment ? "Saving…" : "Add payment"}
                </Button>
              </div>
            </div>

            <div className="flex gap-2 pt-1">
              <Button
                variant="secondary"
                fullWidth
                onClick={() => {
                  const row = viewingLive;
                  setViewing(null);
                  startEdit(row);
                }}
              >
                Edit
              </Button>
              <Button
                variant="ghost"
                fullWidth
                className="text-state-danger-text dark:text-state-danger-text-dark"
                onClick={() => {
                  const row = viewingLive;
                  setViewing(null);
                  setDeleting(row);
                }}
              >
                Delete
              </Button>
            </div>
          </div>
        )}
      </Modal>

      <ConfirmDialog
        open={!!deleting}
        title="Delete this rental?"
        description={
          deleting
            ? `This will permanently remove the rental record for ${deleting.customerName} (${deleting.productName}). This cannot be undone.`
            : undefined
        }
        confirmLabel="Delete"
        onConfirm={handleDeleteConfirm}
        onCancel={() => setDeleting(null)}
        loading={savingDelete}
      />

      <Modal open={!!returning} onClose={() => setReturning(null)} title="Mark as returned" size="md">
        {returning && (
          <div className="space-y-3">
            <p className="font-body text-[13px] text-graphite-500">
              {returning.productName} ({returning.variantLabel}) from {returning.customerName} — stock will be
              released and today's date recorded as the return date.
            </p>

            <div className="flex items-center justify-between rounded border border-graphite-300 bg-graphite-100 px-3 py-2 font-mono text-[13px] text-ink dark:border-graphite-700 dark:bg-graphite-800 dark:text-ink-inverted">
              <span>Balance due</span>
              <span className="font-semibold">{formatCurrency(returning.balance)}</span>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <Input
                label="Amount collected now (₹)"
                type="number"
                min={0}
                value={returnAmount}
                onChange={(e) => setReturnAmount(e.target.value)}
                hint="Leave blank or 0 if nothing was paid at return."
              />
              <Select
                label="Method"
                value={returnMethod}
                onChange={(e) => setReturnMethod(e.target.value as PaymentMethod)}
              >
                <option value="cash">Cash</option>
                <option value="upi">UPI</option>
                <option value="card">Card</option>
                <option value="bank_transfer">Bank transfer</option>
                <option value="other">Other</option>
              </Select>
            </div>
            <Input
              label="Note (optional)"
              value={returnNotes}
              onChange={(e) => setReturnNotes(e.target.value)}
              placeholder="e.g. Paid in full at return"
            />

            {returnError && (
              <p className="font-body text-[12px] text-state-danger-text dark:text-state-danger-text-dark">{returnError}</p>
            )}

            <div className="flex gap-2 pt-1">
              <Button variant="secondary" fullWidth onClick={() => setReturning(null)} disabled={savingReturn}>
                Cancel
              </Button>
              <Button fullWidth onClick={handleReturnConfirm} disabled={savingReturn}>
                {savingReturn ? "Saving…" : "Mark returned"}
              </Button>
            </div>
          </div>
        )}
      </Modal>

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
