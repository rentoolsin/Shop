import { supabase } from "../lib/supabase";
import type { PaymentMethod, RentalStatus } from "../types/database";
import { calculateRentalTotals } from "../utils/rental-calculations";

export interface AdminRentalListItem {
  id: string;
  customerId: string;
  customerName: string;
  customerMobile: string;
  productName: string;
  productImageUrl: string | null;
  variantLabel: string;
  variantId: string;
  quantity: number;
  startDate: string;
  returnDate: string;
  dailyRate: number;
  advance: number;
  status: RentalStatus;
  actualReturnDate: string | null;
  /** Amount waived off the calculated rent, e.g. given at return. See rental-calculations.ts. */
  discount: number;
  discountReason: string | null;
  totalRental: number;
  /** totalRental minus discount — the amount actually owed for the rental. */
  netRental: number;
  balance: number;
}

export interface RentalFormValues {
  customerId: string;
  variantId: string;
  quantity: number;
  startDate: string;
  returnDate: string;
  dailyRate: number;
  advance: number;
  /** Set when this rental is created via Enquiry -> Rental conversion (see admin-enquiries.service.ts). */
  enquiryId?: string;
  /**
   * Set when this rental is created by converting one specific line item
   * of a multi-item enquiry (see EnquiryDetail.tsx's item picker). Stamps
   * that `enquiry_items` row with this rental's id once created, so the
   * picker knows it's done even after a refresh — see
   * 0025_enquiry_items_rental_link.sql.
   */
  enquiryItemId?: string;
}

// Shape of a row returned by the joined select below. Cast explicitly
// rather than relying on postgrest-js's nested-select inference — the
// hand-written Database type (src/types/database.ts) has no Relationships
// metadata, and this is a three-level join (rentals -> product_variants ->
// products), which is riskier to infer correctly than the single-level
// joins already used elsewhere in the codebase.
interface RawRentalRow {
  id: string;
  quantity: number;
  start_date: string;
  return_date: string;
  daily_rate: number;
  advance: number;
  status: RentalStatus;
  actual_return_date: string | null;
  discount: number;
  discount_reason: string | null;
  customers: { id: string; name: string; mobile: string } | null;
  product_variants: {
    id: string;
    label: string;
    products: { name: string; image_url: string | null } | null;
  } | null;
}

function toListItem(row: RawRentalRow): AdminRentalListItem {
  const { totalRental, netRental, balance } = calculateRentalTotals({
    startDate: row.start_date,
    returnDate: row.return_date,
    dailyRate: row.daily_rate,
    quantity: row.quantity,
    advance: row.advance,
    discount: row.discount,
  });

  return {
    id: row.id,
    customerId: row.customers?.id ?? "",
    customerName: row.customers?.name ?? "Unknown customer",
    customerMobile: row.customers?.mobile ?? "",
    productName: row.product_variants?.products?.name ?? "Unknown product",
    productImageUrl: row.product_variants?.products?.image_url ?? null,
    variantLabel: row.product_variants?.label ?? "",
    variantId: row.product_variants?.id ?? "",
    quantity: row.quantity,
    startDate: row.start_date,
    returnDate: row.return_date,
    dailyRate: row.daily_rate,
    advance: row.advance,
    status: row.status,
    actualReturnDate: row.actual_return_date,
    discount: row.discount,
    discountReason: row.discount_reason,
    totalRental,
    netRental,
    balance,
  };
}

export async function fetchAllRentals(): Promise<AdminRentalListItem[]> {
  const { data, error } = await supabase
    .from("rentals")
    .select(
      "id, quantity, start_date, return_date, daily_rate, advance, status, actual_return_date, " +
        "discount, discount_reason, " +
        "customers(id, name, mobile), product_variants(id, label, products(name, image_url))",
    )
    .order("created_at", { ascending: false });
  if (error) throw error;
  return ((data ?? []) as unknown as RawRentalRow[]).map(toListItem);
}

/**
 * Creates a rental. Inventory is not checked here — the DB trigger
 * (`rentals_inventory_trigger` in 0001_init_schema.sql) is the enforcement
 * layer and will raise if this would oversell the variant; the caller
 * should surface that error rather than pre-validating availability twice.
 */
export async function createRental(values: RentalFormValues): Promise<string> {
  const { data, error } = await supabase
    .from("rentals")
    .insert({
      customer_id: values.customerId,
      variant_id: values.variantId,
      quantity: values.quantity,
      start_date: values.startDate,
      return_date: values.returnDate,
      daily_rate: values.dailyRate,
      advance: values.advance,
      status: "active",
      enquiry_id: values.enquiryId ?? null,
    })
    .select("id")
    .single();
  if (error) throw error;
  const rentalId = data.id as string;

  if (values.enquiryItemId) {
    // Best-effort: the rental itself is already created at this point, so a
    // failure here shouldn't be surfaced as "the rental wasn't created" —
    // it would only mean the multi-item picker doesn't know this one's
    // done until the admin sets it manually or the row is re-checked.
    const { error: itemError } = await supabase
      .from("enquiry_items")
      .update({ rental_id: rentalId })
      .eq("id", values.enquiryItemId);
    if (itemError) {
      console.error("Couldn't link enquiry item to its new rental:", itemError);
    }
  }

  return rentalId;
}

/** Extension: push out the return date and/or record additional advance. */
export async function extendRental(
  id: string,
  returnDate: string,
  advance: number,
): Promise<void> {
  const { error } = await supabase
    .from("rentals")
    .update({ return_date: returnDate, advance })
    .eq("id", id);
  if (error) throw error;
}

export async function returnRental(id: string): Promise<void> {
  const today = new Date().toISOString().slice(0, 10);
  const { error } = await supabase
    .from("rentals")
    .update({ status: "returned", actual_return_date: today })
    .eq("id", id);
  if (error) throw error;
}

/**
 * Adds to a rental's discount — the amount waived off the calculated rent,
 * e.g. "took for 4 days at ₹100/day = ₹400, but we only collected ₹300".
 * `amount` is added to any existing discount rather than replacing it, so
 * calling this more than once (or alongside a manual Edit) accumulates
 * correctly. `reason`, if given, replaces the stored note.
 */
export async function recordRentalDiscount(
  id: string,
  currentDiscount: number,
  amount: number,
  reason?: string,
): Promise<void> {
  if (amount <= 0) return;
  const { error } = await supabase
    .from("rentals")
    .update({
      discount: currentDiscount + amount,
      ...(reason ? { discount_reason: reason } : {}),
    })
    .eq("id", id);
  if (error) throw error;
}

export async function cancelRental(id: string): Promise<void> {
  const { error } = await supabase.from("rentals").update({ status: "cancelled" }).eq("id", id);
  if (error) throw error;
}

export interface RentalUpdateValues {
  quantity: number;
  startDate: string;
  returnDate: string;
  dailyRate: number;
  advance: number;
  /** Optional — omit to leave the stored discount unchanged. */
  discount?: number;
  discountReason?: string | null;
}

/**
 * Full edit of a rental's core terms (quantity, dates, rate, advance).
 * Product/variant/customer are intentionally not editable here — swapping
 * those out from under an existing rental would bypass the inventory
 * trigger's original allocation, so those fields stay fixed for the life
 * of the rental (create a new rental instead if the item itself changed).
 */
export async function updateRental(id: string, values: RentalUpdateValues): Promise<void> {
  const { error } = await supabase
    .from("rentals")
    .update({
      quantity: values.quantity,
      start_date: values.startDate,
      return_date: values.returnDate,
      daily_rate: values.dailyRate,
      advance: values.advance,
      ...(values.discount !== undefined ? { discount: values.discount } : {}),
      ...(values.discountReason !== undefined ? { discount_reason: values.discountReason } : {}),
    })
    .eq("id", id);
  if (error) throw error;
}

/** Permanently removes a rental record (distinct from `cancelRental`, which just changes status). */
export async function deleteRental(id: string): Promise<void> {
  const { error } = await supabase.from("rentals").delete().eq("id", id);
  if (error) throw error;
}

/**
 * Manually triggers the DB-side due_today/overdue automation
 * (`sync_rental_open_statuses()`, 0006_due_today_overdue_status_
 * automation.sql) instead of waiting for its scheduled pg_cron run.
 * Returns how many rentals' status actually changed. `deriveDisplayStatus`
 * in rental-calculations.ts still covers the gap between real-world
 * midnight and whenever this last ran, so this is a convenience, not a
 * correctness requirement.
 */
export async function syncOpenRentalStatuses(): Promise<number> {
  const { data, error } = await supabase.rpc("sync_rental_open_statuses");
  if (error) throw error;
  return (data as number) ?? 0;
}

export interface RentalPayment {
  id: string;
  rentalId: string;
  amount: number;
  paymentDate: string;
  method: PaymentMethod;
  notes: string | null;
  createdAt: string;
}

const PAYMENT_METHOD_LABEL: Record<PaymentMethod, string> = {
  cash: "Cash",
  upi: "UPI",
  card: "Card",
  bank_transfer: "Bank transfer",
  other: "Other",
};

export function paymentMethodLabel(method: PaymentMethod): string {
  return PAYMENT_METHOD_LABEL[method];
}

interface RawRentalPaymentRow {
  id: string;
  rental_id: string;
  amount: number;
  payment_date: string;
  method: PaymentMethod;
  notes: string | null;
  created_at: string;
}

function toPayment(row: RawRentalPaymentRow): RentalPayment {
  return {
    id: row.id,
    rentalId: row.rental_id,
    amount: row.amount,
    paymentDate: row.payment_date,
    method: row.method,
    notes: row.notes,
    createdAt: row.created_at,
  };
}

/** Full payment history for one rental, most recent first. */
export async function fetchRentalPayments(rentalId: string): Promise<RentalPayment[]> {
  const { data, error } = await supabase
    .from("rental_payments")
    .select("id, rental_id, amount, payment_date, method, notes, created_at")
    .eq("rental_id", rentalId)
    .order("payment_date", { ascending: false })
    .order("created_at", { ascending: false });
  if (error) throw error;
  return ((data ?? []) as unknown as RawRentalPaymentRow[]).map(toPayment);
}

export interface RecordPaymentValues {
  rentalId: string;
  amount: number;
  paymentDate: string;
  method: PaymentMethod;
  notes?: string;
}

/**
 * Logs a payment (whenever it happened — before, during, or after the
 * rental) and adds it to the rental's running `advance` total via the
 * `record_rental_payment` RPC (0020_rental_payments.sql), atomically —
 * so the admin never has to recompute the new cumulative total by hand.
 */
export async function recordRentalPayment(values: RecordPaymentValues): Promise<string> {
  const { data, error } = await supabase.rpc("record_rental_payment", {
    p_rental_id: values.rentalId,
    p_amount: values.amount,
    p_payment_date: values.paymentDate,
    p_method: values.method,
    p_notes: values.notes ?? null,
  });
  if (error) throw error;
  return data as string;
}

/** Removes a logged payment and reverses it out of the rental's `advance` total. */
export async function deleteRentalPayment(paymentId: string): Promise<void> {
  const { error } = await supabase.rpc("delete_rental_payment", { p_payment_id: paymentId });
  if (error) throw error;
}
