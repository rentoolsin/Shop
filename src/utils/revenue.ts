import type { PaymentKind } from "../types/database";

/** The few ledger fields revenue math needs (a subset of `RentalPayment`). */
export interface LedgerEntry {
  rentalId: string;
  amount: number;
  paymentDate: string;
  kind: PaymentKind;
}

/** Minimum shape needed to date and sign a ledger entry. */
type DatedEntry = Pick<LedgerEntry, "amount" | "kind" | "paymentDate">;

/**
 * Revenue is CASH-BASIS: money counts in the period it was actually entered
 * (the ledger's `paymentDate`), not the period the rental started or was
 * returned. A payment adds its amount; a refund subtracts it.
 */
export function signedAmount(entry: Pick<LedgerEntry, "amount" | "kind">): number {
  return entry.kind === "refund" ? -entry.amount : entry.amount;
}

/** Ledger entries whose payment date falls in [from, to] (inclusive ISO dates). */
export function entriesBetween<T extends DatedEntry>(entries: T[], from: string, to: string): T[] {
  return entries.filter((e) => e.paymentDate >= from && e.paymentDate <= to);
}

/** Net money collected (payments minus refunds) dated within [from, to]. */
export function collectedBetween(entries: DatedEntry[], from: string, to: string): number {
  return entriesBetween(entries, from, to).reduce((sum, e) => sum + signedAmount(e), 0);
}
