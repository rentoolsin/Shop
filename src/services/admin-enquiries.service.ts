import { supabase } from "../lib/supabase";
import type { EnquiryStatus } from "../types/database";

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

function toAdminEnquiry(row: RawEnquiryRow): AdminEnquiry {
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
  };
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
  return ((data ?? []) as unknown as RawEnquiryRow[]).map(toAdminEnquiry);
}

export async function fetchEnquiryById(id: string): Promise<AdminEnquiry | null> {
  const { data, error } = await supabase
    .from("enquiries")
    .select(SELECT)
    .eq("id", id)
    .maybeSingle();
  if (error) throw error;
  return data ? toAdminEnquiry(data as unknown as RawEnquiryRow) : null;
}

export async function updateEnquiryStatus(id: string, status: EnquiryStatus): Promise<void> {
  const { error } = await supabase.from("enquiries").update({ status }).eq("id", id);
  if (error) throw error;
}
