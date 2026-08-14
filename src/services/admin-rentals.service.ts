import { supabase } from "../lib/supabase";
import type { RentalStatus } from "../types/database";
import { calculateRentalTotals } from "../utils/rental-calculations";

export interface AdminRentalListItem {
  id: string;
  customerId: string;
  customerName: string;
  customerMobile: string;
  productName: string;
  variantLabel: string;
  variantId: string;
  quantity: number;
  startDate: string;
  returnDate: string;
  dailyRate: number;
  advance: number;
  status: RentalStatus;
  actualReturnDate: string | null;
  totalRental: number;
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
  customers: { id: string; name: string; mobile: string } | null;
  product_variants: { id: string; label: string; products: { name: string } | null } | null;
}

function toListItem(row: RawRentalRow): AdminRentalListItem {
  const { totalRental, balance } = calculateRentalTotals({
    startDate: row.start_date,
    returnDate: row.return_date,
    dailyRate: row.daily_rate,
    quantity: row.quantity,
    advance: row.advance,
  });

  return {
    id: row.id,
    customerId: row.customers?.id ?? "",
    customerName: row.customers?.name ?? "Unknown customer",
    customerMobile: row.customers?.mobile ?? "",
    productName: row.product_variants?.products?.name ?? "Unknown product",
    variantLabel: row.product_variants?.label ?? "",
    variantId: row.product_variants?.id ?? "",
    quantity: row.quantity,
    startDate: row.start_date,
    returnDate: row.return_date,
    dailyRate: row.daily_rate,
    advance: row.advance,
    status: row.status,
    actualReturnDate: row.actual_return_date,
    totalRental,
    balance,
  };
}

export async function fetchAllRentals(): Promise<AdminRentalListItem[]> {
  const { data, error } = await supabase
    .from("rentals")
    .select(
      "id, quantity, start_date, return_date, daily_rate, advance, status, actual_return_date, " +
        "customers(id, name, mobile), product_variants(id, label, products(name))",
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
  return data.id as string;
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

export async function cancelRental(id: string): Promise<void> {
  const { error } = await supabase.from("rentals").update({ status: "cancelled" }).eq("id", id);
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
