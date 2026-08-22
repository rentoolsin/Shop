import { supabase } from "../lib/supabase";
import type { EnquiryStatus } from "../types/database";

export interface AdminEnquiryItem {
  id: string;
  productId: string | null;
  productName: string;
  dailyRate: number | null;
  quantity: number;
  numberOfDays: number | null;
  /** Set once this item has been converted to a rental — see 0025_enquiry_items_rental_link.sql. */
  rentalId: string | null;
}

export interface AdminEnquiry {
  id: string;
  name: string;
  mobile: string;
  productId: string | null;
  productName: string | null;
  requestedProductText: string | null;
  quantity: number | null;
  requiredDate: string | null;
  numberOfDays: number | null;
  address: string | null;
  message: string | null;
  status: EnquiryStatus;
  createdAt: string;
  /**
   * Line items for a multi-item (cart/tool-picker) enquiry — see
   * supabase/migrations/0013_enquiry_items.sql. Empty for a single-product
   * enquiry, which keeps using `quantity`/`numberOfDays` above instead.
   * Only populated by `fetchEnquiryById` (below) — `fetchAllEnquiries`
   * leaves this empty since the list view only needs the text summary
   * already in `requestedProductText`.
   */
  items: AdminEnquiryItem[];
}

interface RawEnquiryRow {
  id: string;
  name: string;
  mobile: string;
  product_id: string | null;
  requested_product_text: string | null;
  quantity: number | null;
  required_date: string | null;
  number_of_days: number | null;
  address: string | null;
  message: string | null;
  status: EnquiryStatus;
  created_at: string;
  products: { name: string } | null;
}

const SELECT = "id, name, mobile, product_id, requested_product_text, quantity, required_date, " +
  "number_of_days, address, message, status, created_at, products(name)";

function toAdminEnquiry(row: RawEnquiryRow, items: AdminEnquiryItem[] = []): AdminEnquiry {
  return {
    id: row.id,
    name: row.name,
    mobile: row.mobile,
    productId: row.product_id,
    productName: row.products?.name ?? null,
    requestedProductText: row.requested_product_text,
    quantity: row.quantity,
    requiredDate: row.required_date,
    numberOfDays: row.number_of_days,
    address: row.address,
    message: row.message,
    status: row.status,
    createdAt: row.created_at,
    items,
  };
}

interface RawEnquiryItemRow {
  id: string;
  product_id: string | null;
  product_name: string;
  daily_rate: number | null;
  quantity: number;
  number_of_days: number | null;
  rental_id: string | null;
}

const ITEMS_SELECT = "id, product_id, product_name, daily_rate, quantity, number_of_days, rental_id";

function toAdminEnquiryItem(row: RawEnquiryItemRow): AdminEnquiryItem {
  return {
    id: row.id,
    productId: row.product_id,
    productName: row.product_name,
    dailyRate: row.daily_rate,
    quantity: row.quantity,
    numberOfDays: row.number_of_days,
    rentalId: row.rental_id,
  };
}

/** Line items for one enquiry — see AdminEnquiry.items above. */
export async function fetchEnquiryItems(enquiryId: string): Promise<AdminEnquiryItem[]> {
  const { data, error } = await supabase
    .from("enquiry_items")
    .select(ITEMS_SELECT)
    .eq("enquiry_id", enquiryId)
    .order("created_at", { ascending: true });
  if (error) throw error;
  return ((data ?? []) as unknown as RawEnquiryItemRow[]).map(toAdminEnquiryItem);
}

/**
 * All enquiries, newest first, optionally text-filtered server-side by
 * name / mobile / free-text requested product (matches the
 * `admin-customers.service.ts` `.or()` pattern). Status filtering stays
 * client-side (see EnquiriesList) — it's a small fixed enum, not worth a
 * round trip. Note: this does not match against a *linked* product's name
 * (`products.name`, only reachable via the join) — only the enquiry's own
 * `requested_product_text` column. Fine in practice since most enquiries
 * populate one or the other, not both; revisit if that gap matters once
 * there's real search volume to observe.
 */
export async function fetchAllEnquiries(query?: string): Promise<AdminEnquiry[]> {
  let request = supabase.from("enquiries").select(SELECT);

  const q = query?.trim();
  if (q) {
    request = request.or(`name.ilike.%${q}%,mobile.ilike.%${q}%,requested_product_text.ilike.%${q}%`);
  }

  const { data, error } = await request.order("created_at", { ascending: false });
  if (error) throw error;
  return ((data ?? []) as unknown as RawEnquiryRow[]).map((row) => toAdminEnquiry(row));
}

export async function fetchEnquiryById(id: string): Promise<AdminEnquiry | null> {
  const { data, error } = await supabase
    .from("enquiries")
    .select(SELECT)
    .eq("id", id)
    .maybeSingle();
  if (error) throw error;
  if (!data) return null;
  const items = await fetchEnquiryItems(id);
  return toAdminEnquiry(data as unknown as RawEnquiryRow, items);
}

/**
 * Just the count of "new" (not yet contacted/converted/etc) enquiries —
 * used for the Requests tab badge in AdminMobileNav. `head: true` skips
 * fetching row data, so this stays cheap to poll/refetch on every
 * enquiries change even though the admin nav renders on every screen.
 */
export async function fetchNewEnquiriesCount(): Promise<number> {
  const { count, error } = await supabase
    .from("enquiries")
    .select("id", { count: "exact", head: true })
    .eq("status", "new");
  if (error) throw error;
  return count ?? 0;
}

export interface EnquiryFormValues {
  name: string;
  mobile: string;
  requestedProductText: string;
  quantity: number | null;
  requiredDate: string;
  numberOfDays: number | null;
  address: string;
  message: string;
}

export async function updateEnquiryStatus(id: string, status: EnquiryStatus): Promise<void> {
  const { error } = await supabase.from("enquiries").update({ status }).eq("id", id);
  if (error) throw error;
}

/**
 * Full edit of an enquiry's contact/request details (name, mobile, product
 * text, quantity, dates, address, message). Deliberately does not touch
 * `product_id` — that link is set when the enquiry is submitted (or when
 * it's converted to a rental); changing it here isn't something this form
 * offers, to avoid needing a full product picker for what's meant to be a
 * quick "fix a typo'd name/number" edit. Status stays a separate call
 * (`updateEnquiryStatus` above).
 */
export async function updateEnquiry(id: string, values: EnquiryFormValues): Promise<void> {
  const { error } = await supabase
    .from("enquiries")
    .update({
      name: values.name.trim(),
      mobile: values.mobile.trim(),
      requested_product_text: values.requestedProductText.trim() || null,
      quantity: values.quantity,
      required_date: values.requiredDate || null,
      number_of_days: values.numberOfDays,
      address: values.address.trim() || null,
      message: values.message.trim() || null,
    })
    .eq("id", id);
  if (error) throw error;
}

export async function deleteEnquiry(id: string): Promise<void> {
  const { error } = await supabase.from("enquiries").delete().eq("id", id);
  if (error) throw error;
}
