import { Calendar, Plus, ArrowsClockwise, Phone, PencilSimple, DotsThreeVertical, CheckCircle } from "@phosphor-icons/react";
import { useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { useAdminRentals, useAdminRentalPayments } from "../../../hooks/useAdminData";
import { usePagination } from "../../../hooks/usePagination";
import {
  extendRental,
  returnRental,
  recordRentalDiscount,
  cancelRental,
  updateRental,
  deleteRental,
  syncOpenRentalStatuses,
  recordRentalPayment,
  recordRentalRefund,
  paymentMethodLabel,
  type AdminRentalListItem,
} from "../../../services/admin-rentals.service";
import type { PaymentKind, PaymentMethod } from "../../../types/database";
import {
  calculateRentalDays,
  calculateRentalTotals,
  validateRentalInput,
  describeRentalError,
  deriveDisplayStatus,
  describeBalance,
  type RentalDisplayStatus,
} from "../../../utils/rental-calculations";
import { formatCurrency } from "../../../utils/currency";
import { toLocalISODate } from "../../../utils/date-range";
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
import { DatePicker } from "../../../components/ui/DatePicker";
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


/** Balance text color, weighted by how urgent the underlying rental is — an
 * amount due on an overdue/due-today rental should read as more pressing
 * than the same amount on a rental that isn't due for weeks yet. */
function balanceToneClass(displayStatus: RentalDisplayStatus, balance: number, isRefund: boolean): string {
  if (isRefund) return "font-semibold text-state-success-text dark:text-state-success-text-dark";
  if (balance <= 0) return "text-graphite-500";
  if (displayStatus === "overdue") return "font-semibold text-state-danger-text dark:text-state-danger-text-dark";
  if (displayStatus === "due_today") return "font-semibold text-state-warning-text dark:text-state-warning-text-dark";
  return "font-semibold";
}

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

function CallIcon() {
  return <Phone className="h-4 w-4" weight="light" aria-hidden="true" />;
}

function MoreIcon() {
  return <DotsThreeVertical className="h-4 w-4" weight="regular" aria-hidden="true" />;
}

function CheckCircleIcon() {
  return <CheckCircle className="h-4 w-4" weight="light" aria-hidden="true" />;
}

/** Display reference for a rental, e.g. RNT-0012 — the DB-assigned sequential number (0032), never invented. */
function rentalReference(rentalNumber: number) {
  return `RNT-${String(rentalNumber).padStart(4, "0")}`;
}

/**
 * Does the search text refer to this rental by its number? Accepts the bare
 * number ("12", exact), the reference with any number of leading zeros
 * ("RNT-12", "rnt0012"), or the start of a reference ("rnt-001" also matches
 * 0010–0019).
 */
function matchesRentalReference(rentalNumber: number, query: string): boolean {
  const compact = query.replace(/[\s-]/g, "").toLowerCase();
  if (!compact) return false;
  if (compact.startsWith("rnt")) {
    const rest = compact.slice(3);
    if (/^\d+$/.test(rest) && Number(rest) === rentalNumber) return true;
    return rentalReference(rentalNumber).replace("-", "").toLowerCase().startsWith(compact);
  }
  if (/^\d+$/.test(compact)) return Number(compact) === rentalNumber;
  return false;
}

/**
 * Small "part of a N-tool checkout" note shown on a rental that was created
 * together with others for the same customer (see RentalForm's "+ Add
 * another tool"). Purely informational — each sibling rental still has its
 * own independent status/dates/balance and its own row/card with its own
 * actions; this just helps the admin recognize "oh, this was part of that
 * same visit" at a glance instead of hunting by customer name.
 */
function CheckoutGroupNote({ current, siblings }: { current: AdminRentalListItem; siblings: AdminRentalListItem[] }) {
  const others = siblings.filter((s) => s.id !== current.id);
  if (others.length === 0) return null;
  const names = others.slice(0, 2).map((s) => s.productName);
  const extra = others.length - names.length;
  return (
    <span className="block font-body text-[11px] text-graphite-400">
      + {names.join(", ")}
      {extra > 0 ? ` and ${extra} more` : ""} this visit
    </span>
  );
}

type Row = AdminRentalListItem & { displayStatus: RentalDisplayStatus };

/**
 * List order: rows that need action float to the top, closed-out ones sink.
 *   1. Overdue — most days late first
 *   2. Due today — biggest balance first
 *   3. Returned, but money still to settle (balance due, or a refund owed) —
 *      most recently returned first, so a fresh return with unpaid rent isn't
 *      buried under every active rental
 *   4. Active — returning soonest first
 *   5. Returned and fully settled — most recently returned first
 *   6. Cancelled
 * Ties keep the database order (newest created first).
 */
/** Returned, but money is still open — rent still owed, or a refund still to hand back. */
function isUnsettledReturn(r: Row): boolean {
  return r.displayStatus === "returned" && Math.abs(r.balance) >= 0.005;
}

type StatusFilter = "all" | RentalDisplayStatus | "to_settle";

/** Filter dropdown order — same priority as the list itself, most urgent first. */
const STATUS_FILTER_OPTIONS: { value: Exclude<StatusFilter, "all">; label: string }[] = [
  { value: "overdue", label: STATUS_LABEL.overdue },
  { value: "due_today", label: STATUS_LABEL.due_today },
  { value: "to_settle", label: "Returned – to settle" },
  { value: "active", label: STATUS_LABEL.active },
  { value: "returned", label: STATUS_LABEL.returned },
  { value: "cancelled", label: STATUS_LABEL.cancelled },
];

function sortRank(r: Row): number {
  switch (r.displayStatus) {
    case "overdue":
      return 0;
    case "due_today":
      return 1;
    case "returned":
      return isUnsettledReturn(r) ? 2 : 4;
    case "active":
      return 3;
    default:
      return 5;
  }
}

function compareRows(a: Row, b: Row): number {
  const byRank = sortRank(a) - sortRank(b);
  if (byRank !== 0) return byRank;
  // Same rank means same status (returned splits by rank, so both are settled or both aren't).
  switch (a.displayStatus) {
    case "overdue":
    case "active":
      return a.returnDate.localeCompare(b.returnDate);
    case "due_today":
      return b.balance - a.balance;
    case "returned":
      return (b.actualReturnDate ?? b.returnDate).localeCompare(a.actualReturnDate ?? a.returnDate);
    default:
      return 0;
  }
}

/** Small pill showing a rental's length ("3 days") — inclusive, same as the rent maths. */
function DaysBadge({ startDate, returnDate }: { startDate: string; returnDate: string }) {
  const days = calculateRentalDays(startDate, returnDate);
  if (!Number.isFinite(days) || days < 1) return null;
  return (
    <span className="flex-shrink-0 rounded bg-graphite-100 px-1.5 py-0.5 font-mono text-[11px] font-semibold text-ink dark:bg-graphite-800 dark:text-ink-inverted">
      {days} {days === 1 ? "day" : "days"}
    </span>
  );
}

type PaymentsState = ReturnType<typeof useAdminRentalPayments>;

/**
 * How much of `advance` isn't backed by an itemized ledger entry (payments
 * received minus refunds given). `advance` is one running total that can
 * also be typed in directly (Edit/Extend — see 0020_rental_payments.sql), so
 * it can legitimately be higher than what the ledger explains.
 */
function unitemizedAmount(advance: number, payments: PaymentsState): number {
  if (payments.status !== "success") return 0;
  const itemized = payments.data.reduce((sum, p) => sum + (p.kind === "refund" ? -p.amount : p.amount), 0);
  const gap = Math.round((advance - itemized) * 100) / 100;
  return gap > 0 ? gap : 0;
}

/**
 * Shown under an "advance received" field when its value differs from what's
 * stored. Money only changes through the payment ledger, so a changed total is
 * logged as a dated payment (higher) or refund (lower) — this makes that
 * visible before saving, and asks for a reason when lowering.
 */
function AdvanceChangeNote({
  current,
  next,
  reason,
  onReasonChange,
}: {
  current: number;
  next: number;
  reason: string;
  onReasonChange: (value: string) => void;
}) {
  const delta = Math.round((next - current) * 100) / 100;
  if (!Number.isFinite(delta) || delta === 0) return null;
  const isRefund = delta < 0;
  return (
    <div className="space-y-2">
      <p className="rounded border border-graphite-200 bg-graphite-50 px-3 py-2 font-body text-[12px] text-graphite-500 dark:border-graphite-800 dark:bg-graphite-800/60 dark:text-graphite-400">
        Will be logged in payment history as a {formatCurrency(Math.abs(delta))}{" "}
        {isRefund ? "refund" : "payment"} dated today.
      </p>
      <Input
        label={isRefund ? "Reason for lowering (required)" : "Note (optional)"}
        value={reason}
        onChange={(e) => onReasonChange(e.target.value)}
        placeholder={isRefund ? "e.g. Entered wrong amount" : "e.g. Paid after return"}
      />
    </div>
  );
}

/**
 * A rental's payment ledger, shared by the details and Edit popups. It is
 * append-only: entries are never edited or removed (0030), so it is always a
 * true record of what happened. A mistake is corrected by recording a refund
 * or another payment.
 */
function PaymentHistoryList({
  payments,
  unitemized,
}: {
  payments: PaymentsState;
  unitemized: number;
}) {
  return (
    <>
      {unitemized > 0 && (
        <p className="rounded border border-graphite-200 bg-graphite-50 px-3 py-2 font-body text-[12px] text-graphite-500 dark:border-graphite-800 dark:bg-graphite-800/60 dark:text-graphite-400">
          {formatCurrency(unitemized)} of the advance isn't itemized below — recorded before the payment
          history existed.
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
                <p className="font-mono font-semibold">
                  {p.kind === "refund" ? "−" : ""}
                  {formatCurrency(p.amount)}
                  {p.kind === "refund" && (
                    <span className="ml-2 rounded bg-graphite-100 px-1.5 py-0.5 font-body text-[11px] font-medium text-graphite-600 dark:bg-graphite-800 dark:text-graphite-300">
                      Refund
                    </span>
                  )}
                </p>
                <p className="truncate text-graphite-400">
                  {p.paymentDate} · {paymentMethodLabel(p.method)}
                  {p.notes ? ` · ${p.notes}` : ""}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}

      {payments.status === "success" && payments.data.length > 0 && (
        <p className="font-body text-[12px] text-graphite-400">
          Entries can't be edited or removed. To correct a mistake, record a refund or another payment.
        </p>
      )}
    </>
  );
}

export function RentalsList() {
  const rentals = useAdminRentals();
  const { showToast } = useToast();
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [query, setQuery] = useState("");

  const [extending, setExtending] = useState<Row | null>(null);
  const [extendReturnDate, setExtendReturnDate] = useState("");
  const [extendAdvance, setExtendAdvance] = useState(0);
  const [extendAdvanceReason, setExtendAdvanceReason] = useState("");
  const [extendError, setExtendError] = useState<string | null>(null);
  const [savingExtend, setSavingExtend] = useState(false);

  const [returning, setReturning] = useState<Row | null>(null);
  const [returnAmount, setReturnAmount] = useState("");
  const [returnMethod, setReturnMethod] = useState<PaymentMethod>("cash");
  const [returnNotes, setReturnNotes] = useState("");
  // Amount waived off the calculated rent at return (e.g. tool taken for 4
  // days @ ₹100/day = ₹400, but only ₹300 collected). Varies rental to
  // rental — no fixed rule — so it's just an amount the admin types in.
  const [returnDiscount, setReturnDiscount] = useState("");
  const [returnDiscountReason, setReturnDiscountReason] = useState("");
  const [returnError, setReturnError] = useState<string | null>(null);
  const [savingReturn, setSavingReturn] = useState(false);

  const [cancelling, setCancelling] = useState<Row | null>(null);
  const [savingCancel, setSavingCancel] = useState(false);

  const [editing, setEditing] = useState<Row | null>(null);
  const [editQuantity, setEditQuantity] = useState(1);
  const [editStartDate, setEditStartDate] = useState("");
  const [editReturnDate, setEditReturnDate] = useState("");
  const [editDailyRate, setEditDailyRate] = useState(0);
  // Kept as the raw input strings so the fields can be blank; parsed on
  // save. Unlike "Discount given now" in the Mark-returned popup (which is
  // *added* to the existing discount), this is the rental's total discount.
  const [editDiscount, setEditDiscount] = useState("");
  const [editDiscountReason, setEditDiscountReason] = useState("");
  const [editError, setEditError] = useState<string | null>(null);
  const [savingEdit, setSavingEdit] = useState(false);

  const [deleting, setDeleting] = useState<Row | null>(null);
  const [savingDelete, setSavingDelete] = useState(false);

  const [viewing, setViewing] = useState<Row | null>(null);

  // The details popup and the Edit popup both show the ledger, and only
  // one of them is ever open at a time — one subscription serves both.
  const payments = useAdminRentalPayments(viewing?.id ?? editing?.id);
  const [payAmount, setPayAmount] = useState("");
  const [payDate, setPayDate] = useState("");
  const [payMethod, setPayMethod] = useState<PaymentMethod>("cash");
  // Same mini-form records either money received or money given back.
  const [payKind, setPayKind] = useState<PaymentKind>("payment");
  const paymentFormRef = useRef<HTMLDivElement>(null);
  // Set when Edit is opened from the "Record refund" shortcut, so the form is scrolled into view.
  const scrollToPaymentRef = useRef(false);
  const [payNotes, setPayNotes] = useState("");
  const [payError, setPayError] = useState<string | null>(null);
  const [savingPayment, setSavingPayment] = useState(false);

  const [syncing, setSyncing] = useState(false);

  // Overflow ("...") menu on each mobile card — same pattern as ProductsList,
  // so the less-common per-row actions (Extend, Cancel, Delete) don't need
  // their own always-visible buttons.
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);

  const data = useMemo(() => (rentals.status === "success" ? rentals.data : []), [rentals]);

  // Rentals created together as one multi-tool checkout (see RentalForm's
  // "+ Add another tool" and createRentalCheckout) share a checkoutGroupId.
  // Grouped from the *unfiltered* `data`, not the paginated/filtered rows,
  // so a sibling tool still counts even if it's on another page or hidden
  // by the current status filter/search.
  const checkoutGroups = useMemo(() => {
    const map = new Map<string, AdminRentalListItem[]>();
    for (const r of data) {
      if (!r.checkoutGroupId) continue;
      const arr = map.get(r.checkoutGroupId);
      if (arr) arr.push(r);
      else map.set(r.checkoutGroupId, [r]);
    }
    return map;
  }, [data]);

  const rows: Row[] = useMemo(() => {
    return data
      .map((r) => ({ ...r, displayStatus: deriveDisplayStatus(r.status, r.returnDate) }))
      .filter((r) => {
        if (statusFilter === "all") return true;
        if (statusFilter === "to_settle") return isUnsettledReturn(r);
        return r.displayStatus === statusFilter;
      })
      .filter((r) => {
        const q = query.trim().toLowerCase();
        if (!q) return true;
        return (
          r.customerName.toLowerCase().includes(q) ||
          r.customerMobile.includes(q) ||
          matchesRentalReference(r.rentalNumber, q)
        );
      })
      .sort(compareRows);
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

  // Same idea for the Edit popup: payments are recorded from inside it, so
  // "received so far" must follow the latest fetched data, not the snapshot
  // taken when Edit was opened.
  const editingLive: Row | null = useMemo(() => {
    if (!editing) return null;
    const fresh = data.find((r) => r.id === editing.id);
    return fresh ? { ...fresh, displayStatus: deriveDisplayStatus(fresh.status, fresh.returnDate) } : editing;
  }, [editing, data]);
  // Read-only: money only changes by recording a payment or refund.
  const editAdvance = editingLive?.advance ?? editing?.advance ?? 0;

  // Rentals from before the payment ledger existed can have an advance the
  // itemized list doesn't fully explain (0029 backfills these, but keep
  // surfacing any gap rather than leaving the balance math unexplained).
  const unitemizedAdvance = useMemo(
    () => (viewingLive ? unitemizedAmount(viewingLive.advance, payments) : 0),
    [viewingLive, payments],
  );

  const startExtend = (row: Row) => {
    setExtending(row);
    setExtendReturnDate(row.returnDate);
    setExtendAdvance(row.advance);
    setExtendAdvanceReason("");
    setExtendError(null);
  };

  // Pre-fill with the outstanding amount so the common case — customer
  // settles up in full (or gets their overpayment back) when the tool
  // comes back — is just "confirm", while still letting the admin change
  // or zero it out for partial / no-payment returns. `row.balance` can be
  // negative here (advance/payments received exceed the rental total),
  // in which case this pre-fills the refund amount, not an amount to
  // collect — see `describeBalance`.
  const startReturn = (row: Row) => {
    setReturning(row);
    setReturnAmount(row.balance !== 0 ? String(Math.abs(row.balance)) : "");
    setReturnMethod("cash");
    setReturnNotes("");
    setReturnDiscount("");
    setReturnDiscountReason("");
    setReturnError(null);
  };

  // Balance after any new discount entered in this modal is applied on top
  // of the rental's existing (already-persisted) discount.
  const returnAdjustedBalance = returning
    ? returning.balance - (Number(returnDiscount.trim()) || 0)
    : 0;

  const extendTotals = extending
    ? calculateRentalTotals({
        startDate: extending.startDate,
        returnDate: extendReturnDate,
        dailyRate: extending.dailyRate,
        quantity: extending.quantity,
        advance: extendAdvance,
        discount: extending.discount,
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
    if (extendAdvance < extending.advance && !extendAdvanceReason.trim()) {
      setExtendError("Add a reason for lowering the amount received.");
      return;
    }
    setSavingExtend(true);
    try {
      await extendRental(extending.id, extendReturnDate, extendAdvance, extendAdvanceReason);
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
    const discountTrimmed = returnDiscount.trim();
    const discountAmount = discountTrimmed === "" ? 0 : Number(discountTrimmed);
    if (Number.isNaN(discountAmount) || discountAmount < 0) {
      setReturnError("Enter a valid discount amount, or leave it blank if none was given.");
      return;
    }
    // `returnAdjustedBalance` < 0 means the advance/payments already
    // received (after accounting for any discount entered here) are more
    // than the net rental amount — the customer overpaid, so this is
    // money going back to them rather than money being collected. There's
    // no "negative payment" in the payment ledger (rental_payments.amount
    // is checked > 0 — see 0020_rental_payments.sql), so it's logged as a
    // "refund" entry instead (0028_rental_refunds.sql), which also takes it
    // back out of the running `advance` total.
    const isRefund = returnAdjustedBalance < 0;
    setReturnError(null);
    setSavingReturn(true);
    if (discountAmount > 0) {
      try {
        await recordRentalDiscount(
          returning.id,
          returning.discount,
          discountAmount,
          returnDiscountReason.trim() || undefined,
        );
      } catch {
        setReturnError("Couldn't record the discount. Try again.");
        setSavingReturn(false);
        return;
      }
    }
    try {
      await returnRental(returning.id);
    } catch {
      setReturnError("Couldn't mark this rental as returned. Try again.");
      setSavingReturn(false);
      return;
    }
    if (amount > 0 && isRefund) {
      try {
        await recordRentalRefund({
          rentalId: returning.id,
          amount,
          paymentDate: toLocalISODate(new Date()),
          method: returnMethod,
          notes: returnNotes.trim() || "Refunded at return",
        });
        showToast(`Rental marked returned — ${formatCurrency(amount)} refunded.`, "success");
      } catch {
        // Status update already succeeded — don't tell the admin the whole
        // action failed, or they may retry "Mark returned" on an already-
        // returned rental. Surface the refund failure on its own so they
        // know to add it from the rental's details instead.
        showToast(
          "Rental marked as returned, but the refund couldn't be recorded — add it from the rental's details.",
          "danger",
        );
      }
    } else if (amount > 0) {
      try {
        await recordRentalPayment({
          rentalId: returning.id,
          amount,
          paymentDate: toLocalISODate(new Date()),
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
    } else if (discountAmount > 0) {
      showToast(`Rental marked returned — ${formatCurrency(discountAmount)} discount given.`, "success");
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

  const startEdit = (row: Row, options?: { refund?: boolean }) => {
    setEditing(row);
    setEditQuantity(row.quantity);
    setEditStartDate(row.startDate);
    setEditReturnDate(row.returnDate);
    setEditDailyRate(row.dailyRate);
    setEditDiscount(row.discount > 0 ? String(row.discount) : "");
    setEditDiscountReason(row.discountReason ?? "");
    setEditError(null);

    // Fresh "record a payment" form for this rental. `options.refund` (from the
    // "refund due" banner) opens it in refund mode with the amount owed filled in.
    const isRefund = !!options?.refund;
    setPayKind(isRefund ? "refund" : "payment");
    setPayAmount(isRefund && row.balance < 0 ? String(Math.abs(row.balance)) : "");
    setPayDate(toLocalISODate(new Date()));
    setPayMethod("cash");
    setPayNotes("");
    setPayError(null);
    scrollToPaymentRef.current = isRefund;
  };

  useEffect(() => {
    if (editing && scrollToPaymentRef.current) {
      scrollToPaymentRef.current = false;
      paymentFormRef.current?.scrollIntoView?.({ behavior: "smooth", block: "center" });
    }
  }, [editing]);

  // Live value for the summary box; the strict check (and its message)
  // happens in handleEditSave.
  const parsedEditDiscount = Number(editDiscount.trim() || 0);
  const editDiscountValue = Number.isFinite(parsedEditDiscount) && parsedEditDiscount > 0 ? parsedEditDiscount : 0;

  const editTotals = editing
    ? calculateRentalTotals({
        startDate: editStartDate,
        returnDate: editReturnDate,
        dailyRate: editDailyRate,
        quantity: editQuantity,
        advance: editAdvance,
        discount: editDiscountValue,
      })
    : null;

  const handleEditSave = async () => {
    if (!editing || savingEdit) return;
    const discountTrimmed = editDiscount.trim();
    const discountAmount = discountTrimmed === "" ? 0 : Number(discountTrimmed);
    if (!Number.isFinite(discountAmount)) {
      setEditError("Enter a valid discount amount, or leave it blank if none was given.");
      return;
    }
    const businessErrors = validateRentalInput({
      startDate: editStartDate,
      returnDate: editReturnDate,
      dailyRate: editDailyRate,
      quantity: editQuantity,
      advance: editAdvance,
      discount: discountAmount,
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
        discount: discountAmount,
        // A reason only makes sense alongside a discount.
        discountReason: discountAmount > 0 ? editDiscountReason.trim() || null : null,
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

  const handleRecordPayment = async () => {
    if (!editing || savingPayment) return;
    const isRefund = payKind === "refund";
    const amount = Number(payAmount);
    if (!payAmount || Number.isNaN(amount) || amount <= 0) {
      setPayError(isRefund ? "Enter a refund amount greater than zero." : "Enter a payment amount greater than zero.");
      return;
    }
    if (!payDate) {
      setPayError(isRefund ? "Choose the date this refund was given." : "Choose the date this payment was made.");
      return;
    }
    if (isRefund && amount > editAdvance) {
      setPayError(`A refund can't be more than the ${formatCurrency(editAdvance)} received so far.`);
      return;
    }
    setPayError(null);
    setSavingPayment(true);
    try {
      const record = isRefund ? recordRentalRefund : recordRentalPayment;
      await record({
        rentalId: editing.id,
        amount,
        paymentDate: payDate,
        method: payMethod,
        notes: payNotes.trim() || undefined,
      });
      showToast(isRefund ? "Refund recorded." : "Payment recorded.", "success");
      setPayAmount("");
      setPayNotes("");
      setPayKind("payment");
      payments.refetch();
      rentals.refetch();
    } catch {
      setPayError(isRefund ? "Couldn't record this refund. Try again." : "Couldn't record this payment. Try again.");
    } finally {
      setSavingPayment(false);
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
          placeholder="Search name, mobile or RNT no."
          aria-label="Search by customer name, mobile number or rental number"
        />
        <Select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value as StatusFilter)}
          className="sm:w-56"
        >
          <option value="all">All statuses</option>
          {STATUS_FILTER_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>{o.label}</option>
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
                <Card key={rental.id} className="p-3">
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
                          className="block min-w-0 text-left font-display text-[14px] font-bold uppercase leading-snug tracking-tight text-ink hover:underline dark:text-ink-inverted"
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
                        {rentalReference(rental.rentalNumber)}
                      </button>
                      {rental.checkoutGroupId && (
                        <CheckoutGroupNote
                          current={rental}
                          siblings={checkoutGroups.get(rental.checkoutGroupId) ?? []}
                        />
                      )}
                    </div>
                  </div>

                  {/* Full card width now — no longer squeezed by the header
                      row's status/chevron column, which is what was
                      wrapping the date range mid-word on narrow phones. */}
                  <p className="mt-2 flex flex-wrap items-center gap-x-1.5 gap-y-1 font-body text-[12px] text-graphite-500">
                    <CalendarIcon className="h-3.5 w-3.5 flex-shrink-0" />
                    <span>
                      {rental.startDate} → {rental.returnDate}
                    </span>
                    <DaysBadge startDate={rental.startDate} returnDate={rental.returnDate} />
                  </p>

                  <div className="mt-2 flex items-center justify-between border-t border-graphite-100 pt-2.5 font-mono text-[12.5px] text-ink dark:border-graphite-800 dark:text-ink-inverted">
                    <span className="truncate text-graphite-500">
                      {rental.customerName} · {rental.customerMobile}
                    </span>
                    <span
                      className={[
                        "flex-shrink-0",
                        balanceToneClass(
                          rental.displayStatus,
                          rental.balance,
                          describeBalance(rental.balance).isRefund,
                        ),
                      ].join(" ")}
                    >
                      {formatCurrency(describeBalance(rental.balance).amount)}
                      {describeBalance(rental.balance).isRefund ? " refund" : " due"}
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
                    <a
                      href={`tel:${rental.customerMobile}`}
                      aria-label={`Call ${rental.customerName}`}
                      className="flex h-9 w-9 items-center justify-center rounded text-graphite-500 hover:bg-graphite-100 dark:text-graphite-400 dark:hover:bg-graphite-800"
                    >
                      <CallIcon />
                    </a>
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
                            <span className="block font-display text-[13px] font-bold uppercase leading-snug tracking-tight text-ink hover:underline dark:text-ink-inverted">
                              {rental.productName}
                            </span>
                            <span className="block font-mono text-[11px] text-graphite-400">
                              {rentalReference(rental.rentalNumber)}
                              {rental.variantLabel ? ` · ${rental.variantLabel}` : ""}
                            </span>
                            {rental.checkoutGroupId && (
                              <CheckoutGroupNote
                                current={rental}
                                siblings={checkoutGroups.get(rental.checkoutGroupId) ?? []}
                              />
                            )}
                          </span>
                        </button>
                      </TableCell>
                      <TableCell>
                        <span className="block text-ink dark:text-ink-inverted">{rental.customerName}</span>
                        <span className="block font-mono text-[11.5px] text-graphite-400">{rental.customerMobile}</span>
                      </TableCell>
                      <TableCell className="font-mono text-[12px] text-graphite-500 whitespace-nowrap">
                        <span className="mr-1.5">
                          {rental.startDate} → {rental.returnDate}
                        </span>
                        <DaysBadge startDate={rental.startDate} returnDate={rental.returnDate} />
                      </TableCell>
                      <TableCell>
                        <StatusBadge
                          label={STATUS_LABEL[rental.displayStatus]}
                          tone={STATUS_TONE[rental.displayStatus]}
                        />
                      </TableCell>
                      <TableCell className="text-right font-mono whitespace-nowrap">
                        <span
                          className={balanceToneClass(
                            rental.displayStatus,
                            rental.balance,
                            describeBalance(rental.balance).isRefund,
                          )}
                        >
                          {formatCurrency(describeBalance(rental.balance).amount)}
                          {describeBalance(rental.balance).isRefund ? " refund" : ""}
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
            <DatePicker
              label="New return date"
              value={extendReturnDate}
              onChange={setExtendReturnDate}
            />
            <Input
              label="Total advance received (₹)"
              type="number"
              min={0}
              value={extendAdvance}
              onChange={(e) => setExtendAdvance(Number(e.target.value))}
              hint="Type the new total received. The difference is logged in payment history. To choose a method (UPI, card…) use “Record a payment” in the rental's details."
            />
            <AdvanceChangeNote
              current={extending.advance}
              next={extendAdvance}
              reason={extendAdvanceReason}
              onReasonChange={setExtendAdvanceReason}
            />
            {extendTotals && (
              <div className="rounded border border-graphite-300 bg-graphite-100 p-3 font-mono text-[13px] text-ink dark:border-graphite-700 dark:bg-graphite-800 dark:text-ink-inverted">
                <div className="flex items-center justify-between">
                  <span>{extendTotals.rentalDays} day{extendTotals.rentalDays === 1 ? "" : "s"}</span>
                  <span>{formatCurrency(extendTotals.totalRental)}</span>
                </div>
                <div className="mt-1 flex items-center justify-between font-semibold">
                  <span>{describeBalance(extendTotals.balance).label}</span>
                  <span
                    className={
                      describeBalance(extendTotals.balance).isRefund
                        ? "text-state-success-text dark:text-state-success-text-dark"
                        : undefined
                    }
                  >
                    {formatCurrency(describeBalance(extendTotals.balance).amount)}
                  </span>
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
              <DatePicker
                label="Start date"
                value={editStartDate}
                onChange={setEditStartDate}
              />
              <DatePicker
                label="Return date"
                value={editReturnDate}
                onChange={setEditReturnDate}
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <Input
                label="Discount (₹)"
                type="number"
                min={0}
                inputMode="decimal"
                value={editDiscount}
                onChange={(e) => setEditDiscount(e.target.value)}
                placeholder="0"
                hint="Total amount waived off the rent — replaces any earlier discount."
              />
              <Input
                label="Reason (optional)"
                value={editDiscountReason}
                onChange={(e) => setEditDiscountReason(e.target.value)}
                placeholder="e.g. Old customer, goodwill"
              />
            </div>
            {editTotals && (
              <div className="rounded border border-graphite-300 bg-graphite-100 p-3 font-mono text-[13px] text-ink dark:border-graphite-700 dark:bg-graphite-800 dark:text-ink-inverted">
                <div className="flex items-center justify-between">
                  <span>{editTotals.rentalDays} day{editTotals.rentalDays === 1 ? "" : "s"}</span>
                  <span>{formatCurrency(editTotals.totalRental)}</span>
                </div>
                {editDiscountValue > 0 && (
                  <div className="flex items-center justify-between">
                    <span>Discount</span>
                    <span>-{formatCurrency(editDiscountValue)}</span>
                  </div>
                )}
                <div className="flex items-center justify-between">
                  <span>Received</span>
                  <span>{formatCurrency(editAdvance)}</span>
                </div>
                <div className="mt-1 flex items-center justify-between font-semibold">
                  <span>{describeBalance(editTotals.balance).label}</span>
                  <span
                    className={
                      describeBalance(editTotals.balance).isRefund
                        ? "text-state-success-text dark:text-state-success-text-dark"
                        : undefined
                    }
                  >
                    {formatCurrency(describeBalance(editTotals.balance).amount)}
                  </span>
                </div>
              </div>
            )}
            <div className="space-y-2 border-t border-graphite-200 pt-3 dark:border-graphite-800">
              <p className="font-body text-[12px] font-medium text-graphite-500">Payment history</p>
              <PaymentHistoryList payments={payments} unitemized={unitemizedAmount(editAdvance, payments)} />
              <div
                ref={paymentFormRef}
                className="space-y-2 rounded border border-graphite-200 p-3 dark:border-graphite-800"
              >
                <div className="flex items-center justify-between gap-2">
                  <p className="font-body text-[12px] font-medium text-graphite-500">
                    {payKind === "refund" ? "Record a refund" : "Record a payment"}
                  </p>
                  <div
                    role="group"
                    aria-label="Entry type"
                    className="flex gap-0.5 rounded bg-graphite-100 p-0.5 dark:bg-graphite-800"
                  >
                    {(["payment", "refund"] as const).map((kind) => (
                      <button
                        key={kind}
                        type="button"
                        aria-pressed={payKind === kind}
                        onClick={() => setPayKind(kind)}
                        className={[
                          "rounded px-2.5 py-1 font-body text-[12px] font-medium",
                          payKind === kind
                            ? "bg-white text-ink shadow-sm dark:bg-graphite-900 dark:text-ink-inverted"
                            : "text-graphite-500",
                        ].join(" ")}
                      >
                        {kind === "payment" ? "Payment" : "Refund"}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <Input
                    label={payKind === "refund" ? "Amount refunded (₹)" : "Amount (₹)"}
                    type="number"
                    min={0}
                    value={payAmount}
                    onChange={(e) => setPayAmount(e.target.value)}
                  />
                  <DatePicker
                    label={payKind === "refund" ? "Date refunded" : "Date paid"}
                    value={payDate}
                    onChange={setPayDate}
                  />
                  <div className="col-span-2">
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
                  <div className="col-span-2">
                    <Input
                      label="Note (optional)"
                      value={payNotes}
                      onChange={(e) => setPayNotes(e.target.value)}
                      placeholder={payKind === "refund" ? "e.g. Refunded in cash" : "e.g. Paid after return"}
                    />
                  </div>
                </div>
                {payError && (
                  <p className="font-body text-[12px] text-state-danger-text dark:text-state-danger-text-dark">{payError}</p>
                )}
                <Button size="sm" fullWidth onClick={handleRecordPayment} disabled={savingPayment}>
                  {savingPayment ? "Saving…" : payKind === "refund" ? "Add refund" : "Add payment"}
                </Button>
              </div>
              <p className="font-body text-[12px] text-graphite-400">
                Payments and refunds are saved as soon as you add them — Cancel won't undo them.
              </p>
            </div>
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
                <p className="font-mono text-[12px] text-graphite-400">{rentalReference(viewingLive.rentalNumber)}</p>
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
                {viewingLive.discount > 0 && (
                  <div className="flex items-center justify-between">
                    <span>
                      Discount given
                      {viewingLive.discountReason ? ` (${viewingLive.discountReason})` : ""}
                    </span>
                    <span>-{formatCurrency(viewingLive.discount)}</span>
                  </div>
                )}
                <div className="flex items-center justify-between">
                  <span>Advance / paid so far</span>
                  <span>{formatCurrency(viewingLive.advance)}</span>
                </div>
                <div className="mt-1 flex items-center justify-between font-semibold">
                  <span>{describeBalance(viewingLive.balance).label}</span>
                  <span
                    className={
                      describeBalance(viewingLive.balance).isRefund
                        ? "text-state-success-text dark:text-state-success-text-dark"
                        : undefined
                    }
                  >
                    {formatCurrency(describeBalance(viewingLive.balance).amount)}
                  </span>
                </div>
              </div>
            </div>

            {viewingLive.balance < 0 && (
              <div className="flex items-center justify-between gap-3 rounded border border-graphite-300 bg-graphite-50 p-3 dark:border-graphite-700 dark:bg-graphite-800/60">
                <p className="font-body text-[12.5px] text-ink dark:text-ink-inverted">
                  <span className="font-semibold">{formatCurrency(Math.abs(viewingLive.balance))}</span> is owed back to
                  the customer. Already handed it over? Record it so this clears.
                </p>
                <Button size="sm" variant="secondary" onClick={() => {
                    const row = viewingLive;
                    setViewing(null);
                    startEdit(row, { refund: true });
                  }}
                  className="flex-shrink-0">
                  Record refund
                </Button>
              </div>
            )}

            <div className="space-y-2 border-t border-graphite-200 pt-4 dark:border-graphite-800">
              <p className="font-body text-[12px] font-medium text-graphite-500">Payment history</p>

              <PaymentHistoryList payments={payments} unitemized={unitemizedAdvance} />

              <p className="font-body text-[12px] text-graphite-400">
                To record a payment or refund, tap Edit.
              </p>
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
              <span>{describeBalance(returnAdjustedBalance).label}</span>
              <span
                className={
                  describeBalance(returnAdjustedBalance).isRefund
                    ? "font-semibold text-state-success-text dark:text-state-success-text-dark"
                    : "font-semibold"
                }
              >
                {formatCurrency(describeBalance(returnAdjustedBalance).amount)}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <Input
                label="Discount given now (₹)"
                type="number"
                min={0}
                value={returnDiscount}
                onChange={(e) => setReturnDiscount(e.target.value)}
                hint="If you're not collecting the full amount, e.g. rent for 4 days was ₹400 but only ₹300 was taken."
              />
              <Input
                label="Reason (optional)"
                value={returnDiscountReason}
                onChange={(e) => setReturnDiscountReason(e.target.value)}
                placeholder="e.g. Old customer, goodwill"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <Input
                label={
                  describeBalance(returnAdjustedBalance).isRefund
                    ? "Amount refunded now (₹)"
                    : "Amount collected now (₹)"
                }
                type="number"
                min={0}
                value={returnAmount}
                onChange={(e) => setReturnAmount(e.target.value)}
                hint={
                  describeBalance(returnAdjustedBalance).isRefund
                    ? "The advance received was more than the rental amount — enter how much you're giving back."
                    : "Leave blank or 0 if nothing was paid at return."
                }
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
