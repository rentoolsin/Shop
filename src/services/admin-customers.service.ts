import { supabase } from "../lib/supabase";

export interface AdminCustomer {
  id: string;
  name: string;
  mobile: string;
  address: string | null;
  createdAt: string;
}

export interface CustomerFormValues {
  name: string;
  mobile: string;
  address: string;
}

function toAdminCustomer(row: {
  id: string;
  name: string;
  mobile: string;
  address: string | null;
  created_at: string;
}): AdminCustomer {
  return {
    id: row.id,
    name: row.name,
    mobile: row.mobile,
    address: row.address,
    createdAt: row.created_at,
  };
}

/** All customers, optionally text-filtered by name or mobile (admin list/search). */
export async function fetchAllCustomers(query?: string): Promise<AdminCustomer[]> {
  let request = supabase.from("customers").select("id, name, mobile, address, created_at");

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
    .select("id, name, mobile, address, created_at")
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
    .select("id, name, mobile, address, created_at")
    .ilike("mobile", `%${q}%`)
    .order("created_at", { ascending: false })
    .limit(6);
  if (error) throw error;
  return (data ?? []).map(toAdminCustomer);
}

export async function createCustomer(values: CustomerFormValues): Promise<AdminCustomer> {
  const { data, error } = await supabase
    .from("customers")
    .insert({
      name: values.name,
      mobile: values.mobile,
      address: values.address || null,
    })
    .select("id, name, mobile, address, created_at")
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
