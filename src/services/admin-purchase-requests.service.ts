import { supabase } from "../lib/supabase";
import type { PurchaseRequestStatus } from "../types/database";

export type PurchaseRequestPriority = "low" | "normal" | "high";

export interface AdminPurchaseRequest {
  id: string;
  productRequested: string;
  customerId: string | null;
  customerName: string | null;
  requesterName: string | null;
  mobile: string | null;
  quantity: number | null;
  priority: PurchaseRequestPriority;
  notes: string | null;
  status: PurchaseRequestStatus;
  createdAt: string;
}

export interface PurchaseRequestFormValues {
  productRequested: string;
  customerId: string | null;
  mobile: string;
  quantity: number | null;
  priority: PurchaseRequestPriority;
  notes: string;
}

interface RawPurchaseRequestRow {
  id: string;
  product_requested: string;
  customer_id: string | null;
  name: string | null;
  mobile: string | null;
  quantity: number | null;
  priority: PurchaseRequestPriority;
  notes: string | null;
  status: PurchaseRequestStatus;
  created_at: string;
  customers: { name: string } | null;
}

const SELECT =
  "id, product_requested, customer_id, name, mobile, quantity, priority, notes, status, created_at, customers(name)";

function toAdminPurchaseRequest(row: RawPurchaseRequestRow): AdminPurchaseRequest {
  return {
    id: row.id,
    productRequested: row.product_requested,
    customerId: row.customer_id,
    customerName: row.customers?.name ?? null,
    requesterName: row.name,
    mobile: row.mobile,
    quantity: row.quantity,
    priority: row.priority,
    notes: row.notes,
    status: row.status,
    createdAt: row.created_at,
  };
}

/**
 * All purchase requests, newest first, optionally text-filtered
 * server-side by product requested / mobile / requester name (matches the
 * `admin-customers.service.ts` `.or()` pattern). Status filtering stays
 * client-side (see PurchaseRequestsList) — small fixed enum, not worth a
 * round trip. Note: `name` is only populated for anonymous public
 * submissions (`0004_purchase_requests_name.sql`) — an admin-logged
 * request's linked customer name lives in the `customers` join, not a
 * plain column, so it isn't matched here. `mobile` IS copied onto every
 * row regardless of how it was created (see `PurchaseRequestForm.tsx`),
 * so mobile-based search — the primary lookup method used throughout this
 * app's admin, same as Customers — still covers every request either way.
 */
export async function fetchAllPurchaseRequests(query?: string): Promise<AdminPurchaseRequest[]> {
  let request = supabase.from("purchase_requests").select(SELECT);

  const q = query?.trim();
  if (q) {
    request = request.or(`product_requested.ilike.%${q}%,mobile.ilike.%${q}%,name.ilike.%${q}%`);
  }

  const { data, error } = await request.order("created_at", { ascending: false });
  if (error) throw error;
  return ((data ?? []) as unknown as RawPurchaseRequestRow[]).map(toAdminPurchaseRequest);
}

export async function fetchPurchaseRequestById(id: string): Promise<AdminPurchaseRequest | null> {
  const { data, error } = await supabase
    .from("purchase_requests")
    .select(SELECT)
    .eq("id", id)
    .maybeSingle();
  if (error) throw error;
  return data ? toAdminPurchaseRequest(data as unknown as RawPurchaseRequestRow) : null;
}

/** Admin-logged purchase request (e.g. a walk-in or phone request for a product not currently in stock). */
export async function createPurchaseRequest(
  values: PurchaseRequestFormValues,
): Promise<AdminPurchaseRequest> {
  const { data, error } = await supabase
    .from("purchase_requests")
    .insert({
      product_requested: values.productRequested.trim(),
      customer_id: values.customerId,
      mobile: values.mobile.trim() || null,
      quantity: values.quantity,
      priority: values.priority,
      notes: values.notes.trim() || null,
    })
    .select(SELECT)
    .single();
  if (error) throw error;
  return toAdminPurchaseRequest(data as unknown as RawPurchaseRequestRow);
}

/**
 * Full edit of an existing purchase request — product, linked customer,
 * quantity, priority and notes. Status stays a separate call
 * (`updatePurchaseRequestStatus` below), same split as the detail page's
 * "editable fields vs. status" distinction.
 */
export async function updatePurchaseRequest(
  id: string,
  values: PurchaseRequestFormValues,
): Promise<void> {
  const { error } = await supabase
    .from("purchase_requests")
    .update({
      product_requested: values.productRequested.trim(),
      customer_id: values.customerId,
      mobile: values.mobile.trim() || null,
      quantity: values.quantity,
      priority: values.priority,
      notes: values.notes.trim() || null,
    })
    .eq("id", id);
  if (error) throw error;
}

export async function deletePurchaseRequest(id: string): Promise<void> {
  const { error } = await supabase.from("purchase_requests").delete().eq("id", id);
  if (error) throw error;
}

export async function updatePurchaseRequestStatus(
  id: string,
  status: PurchaseRequestStatus,
): Promise<void> {
  const { error } = await supabase.from("purchase_requests").update({ status }).eq("id", id);
  if (error) throw error;
}

export async function updatePurchaseRequestPriority(
  id: string,
  priority: PurchaseRequestPriority,
): Promise<void> {
  const { error } = await supabase.from("purchase_requests").update({ priority }).eq("id", id);
  if (error) throw error;
}
