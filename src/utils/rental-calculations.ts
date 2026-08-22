/**
 * Authoritative rental math. Every screen that shows or edits a rental total
 * must call these functions — do not re-derive the formula elsewhere.
 * Mirrored (not duplicated) by the DB check constraints / RPC in
 * supabase/migrations/0001_init_schema.sql, which is the enforcement layer.
 */

export interface RentalInput {
  startDate: string; // ISO date, e.g. "2026-08-13"
  returnDate: string; // ISO date
  dailyRate: number;
  quantity: number;
  advance: number;
  /**
   * Amount waived off the calculated rent (e.g. "took for 4 days at ₹100/day
   * = ₹400, but we only collected ₹300"). Optional and defaults to 0 — most
   * rentals have no discount. Varies rental to rental; there's no fixed
   * percentage or rule, so this is always a plain entered amount.
   */
  discount?: number;
}

export interface RentalTotals {
  rentalDays: number;
  /** Calculated rent before any discount: dailyRate * rentalDays * quantity. */
  totalRental: number;
  /** totalRental minus discount — this is what balance is measured against. */
  netRental: number;
  balance: number;
}

export type RentalValidationError =
  | "RETURN_BEFORE_START"
  | "QUANTITY_NOT_POSITIVE"
  | "RATE_NEGATIVE"
  | "ADVANCE_NEGATIVE"
  | "ADVANCE_EXCEEDS_TOTAL";

const VALIDATION_MESSAGES: Record<RentalValidationError, string> = {
  RETURN_BEFORE_START:
    "Return date cannot be earlier than the rental start date.",
  QUANTITY_NOT_POSITIVE: "Quantity must be greater than zero.",
  RATE_NEGATIVE: "Daily rental price cannot be negative.",
  ADVANCE_NEGATIVE: "Advance cannot be negative.",
  ADVANCE_EXCEEDS_TOTAL: "Advance cannot exceed the total rental amount.",
};

export function describeRentalError(code: RentalValidationError): string {
  return VALIDATION_MESSAGES[code];
}

/** Inclusive day count: 13 Aug -> 15 Aug = 3 days. */
export function calculateRentalDays(startDate: string, returnDate: string): number {
  const start = new Date(startDate + "T00:00:00");
  const end = new Date(returnDate + "T00:00:00");
  const msPerDay = 1000 * 60 * 60 * 24;
  const diff = Math.round((end.getTime() - start.getTime()) / msPerDay);
  return diff + 1;
}

export function validateRentalInput(
  input: RentalInput,
  options: { allowAdvanceOverTotal?: boolean } = {},
): RentalValidationError[] {
  // An advance/payment total that ends up bigger than the rental amount is
  // a normal business case (e.g. the customer paid in full up front and
  // the rental was later shortened, or they simply overpaid) — not an
  // input mistake. It's handled at return time by refunding the
  // difference (see `describeBalance` + the "Mark as returned" flow in
  // RentalsList.tsx), so this no longer blocks saving by default. Callers
  // that still want the old strict behavior can opt back in explicitly
  // with `{ allowAdvanceOverTotal: false }`.
  const { allowAdvanceOverTotal = true } = options;
  const errors: RentalValidationError[] = [];

  if (new Date(input.returnDate) < new Date(input.startDate)) {
    errors.push("RETURN_BEFORE_START");
  }
  if (input.quantity <= 0) {
    errors.push("QUANTITY_NOT_POSITIVE");
  }
  if (input.dailyRate < 0) {
    errors.push("RATE_NEGATIVE");
  }
  if (input.advance < 0) {
    errors.push("ADVANCE_NEGATIVE");
  }

  if (!errors.includes("RETURN_BEFORE_START") && !allowAdvanceOverTotal) {
    const { netRental } = calculateRentalTotals(input);
    if (input.advance > netRental) {
      errors.push("ADVANCE_EXCEEDS_TOTAL");
    }
  }

  return errors;
}

export function calculateRentalTotals(input: RentalInput): RentalTotals {
  const rentalDays = calculateRentalDays(input.startDate, input.returnDate);
  const totalRental = rentalDays * input.dailyRate * input.quantity;
  const netRental = Math.max(0, totalRental - (input.discount ?? 0));
  const balance = netRental - input.advance;
  return { rentalDays, totalRental, netRental, balance };
}

/**
 * A negative `balance` means the advance/payments received exceed the
 * total rental amount — money owed back to the customer, not from them.
 * Every screen that renders "Balance due" should go through this instead
 * of assuming balance is always >= 0, so an overpayment reads as a
 * refund rather than a (confusing) negative amount due.
 */
export interface BalanceDescription {
  label: "Balance due" | "Refund due";
  amount: number;
  isRefund: boolean;
}

export function describeBalance(balance: number): BalanceDescription {
  const isRefund = balance < 0;
  return {
    label: isRefund ? "Refund due" : "Balance due",
    amount: Math.abs(balance),
    isRefund,
  };
}

export type RentalDisplayStatus =
  | "active"
  | "due_today"
  | "overdue"
  | "returned"
  | "cancelled";

/**
 * Derives the status a rental should visually show right now, WITHOUT
 * writing anything back to the DB. `due_today` / `overdue` are also written
 * back by `sync_rental_open_statuses()` (0006_due_today_overdue_status_
 * automation.sql), scheduled via pg_cron plus an on-demand admin "Sync
 * statuses" action — but that only runs periodically, so this stays as a
 * same-day, read-only UI approximation from `return_date` for the gap
 * between a return date changing and the next sync.
 */
export function deriveDisplayStatus(
  status: RentalDisplayStatus,
  returnDate: string,
  today: Date = new Date(),
): RentalDisplayStatus {
  if (status !== "active") return status;
  const todayStr = today.toISOString().slice(0, 10);
  if (returnDate < todayStr) return "overdue";
  if (returnDate === todayStr) return "due_today";
  return "active";
}
