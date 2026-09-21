import { supabase } from "../lib/supabase";
import { sanitizeMobile } from "../utils/contact-validation";

export interface AdminCustomer {
  id: string;
  name: string;
  mobile: string;
  altMobile: string | null;
  address: string | null;
  createdAt: string;
}

export interface CustomerFormValues {
  name: string;
  mobile: string;
  altMobile: string;
  address: string;
}

function toAdminCustomer(row: {
  id: string;
  name: string;
  mobile: string;
  alt_mobile: string | null;
  address: string | null;
  created_at: string;
}): AdminCustomer {
  return {
    id: row.id,
    name: row.name,
    mobile: row.mobile,
    altMobile: row.alt_mobile,
    address: row.address,
    createdAt: row.created_at,
  };
}

/** All customers, optionally text-filtered by name or mobile (admin list/search). */
export async function fetchAllCustomers(query?: string): Promise<AdminCustomer[]> {
  let request = supabase.from("customers").select("id, name, mobile, alt_mobile, address, created_at");

  const q = query?.trim();
  if (q) {
    request = request.or(`name.ilike.%${q}%,mobile.ilike.%${q}%`);
  }

  const { data, error } = await request.order("created_at", { ascending: false });
  if (error) throw error;
  return (data ?? []).map(toAdminCustomer);
}

export async function fetchCustomerById(id: string): Promise<AdminCustomer | null> {
  const { data, error } = await supabase
    .from("customers")
    .select("id, name, mobile, alt_mobile, address, created_at")
    .eq("id", id)
    .maybeSingle();
  if (error) throw error;
  return data ? toAdminCustomer(data) : null;
}

/**
 * Quick lookup used by the rental-creation flow (see BUSINESS-RULES.md:
 * "selecting an existing customer should auto-populate their info rather
 * than creating a duplicate"). Matches on partial mobile digits.
 */
export async function searchCustomersByMobile(mobile: string): Promise<AdminCustomer[]> {
  const q = mobile.trim();
  if (!q) return [];
  const { data, error } = await supabase
    .from("customers")
    .select("id, name, mobile, alt_mobile, address, created_at")
    .ilike("mobile", `%${q}%`)
    .order("created_at", { ascending: false })
    .limit(6);
  if (error) throw error;
  return (data ?? []).map(toAdminCustomer);
}

/**
 * Customer lookup for the pickers (new rental, purchase request): matches a
 * partial name OR partial mobile number, so the admin can type either
 * "Senthil" or "72006". Returns at most 8, newest first.
 */
export async function searchCustomers(query: string): Promise<AdminCustomer[]> {
  const q = query.trim();
  if (!q) return [];
  // Drop characters that would break PostgREST's or() syntax or act as LIKE
  // wildcards (comma, parens, %, *, _, quotes, backslash).
  const clean = (s: string) => s.replace(/[,()%*_"\\]/g, " ").trim();

  const name = clean(q);
  const digits = clean(sanitizeMobile(q));

  const filters: string[] = [];
  if (name) filters.push(`name.ilike.%${name}%`);
  // Mobile numbers have no letters, so only search them when the text has digits.
  if (/\d/.test(digits)) filters.push(`mobile.ilike.%${digits}%`);
  if (filters.length === 0) return [];

  const { data, error } = await supabase
    .from("customers")
    .select("id, name, mobile, alt_mobile, address, created_at")
    .or(filters.join(","))
    .order("created_at", { ascending: false })
    .limit(8);
  if (error) throw error;
  return (data ?? []).map(toAdminCustomer);
}

/**
 * Exact-match lookup used to block duplicate mobile numbers on create/edit
 * (see BUSINESS-RULES.md — one customer record per mobile number). Pass
 * `excludeId` when editing so a customer isn't flagged as a duplicate of
 * themselves.
 */
export async function findCustomerByMobile(
  mobile: string,
  excludeId?: string,
): Promise<AdminCustomer | null> {
  const q = mobile.trim();
  if (!q) return null;
  let request = supabase
    .from("customers")
    .select("id, name, mobile, alt_mobile, address, created_at")
    .eq("mobile", q);
  if (excludeId) {
    request = request.neq("id", excludeId);
  }
  const { data, error } = await request.limit(1).maybeSingle();
  if (error) throw error;
  return data ? toAdminCustomer(data) : null;
}

export async function createCustomer(values: CustomerFormValues): Promise<AdminCustomer> {
  const { data, error } = await supabase
    .from("customers")
    .insert({
      name: values.name,
      mobile: values.mobile,
      alt_mobile: values.altMobile || null,
      address: values.address || null,
    })
    .select("id, name, mobile, alt_mobile, address, created_at")
    .single();
  if (error) throw error;
  return toAdminCustomer(data);
}

export async function updateCustomer(id: string, values: CustomerFormValues): Promise<void> {
  const { error } = await supabase
    .from("customers")
    .update({
      name: values.name,
      mobile: values.mobile,
      alt_mobile: values.altMobile || null,
      address: values.address || null,
    })
    .eq("id", id);
  if (error) throw error;
}

/** Fails (FK restrict) if the customer has rentals — caller should show a clear message. */
export async function deleteCustomer(id: string): Promise<void> {
  const { error } = await supabase.from("customers").delete().eq("id", id);
  if (error) throw error;
}
