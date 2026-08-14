import { supabase } from "../lib/supabase";

export interface PurchaseRequestInput {
  name: string;
  mobile: string;
  productRequested: string;
  quantity?: number;
  notes?: string;
}

/**
 * Public submission — anonymous, insert-only (see "public can submit
 * purchase requests" RLS policy in 0001_init_schema.sql). No customer_id
 * is set; admins can link it to a customer record later if needed.
 * Always created with priority "normal" and status "requested" — priority
 * triage and status changes are admin-only (see admin-purchase-requests.service.ts).
 */
export async function submitPurchaseRequest(input: PurchaseRequestInput): Promise<void> {
  const { error } = await supabase.from("purchase_requests").insert({
    name: input.name,
    mobile: input.mobile,
    product_requested: input.productRequested,
    quantity: input.quantity ?? null,
    notes: input.notes ?? null,
    priority: "normal",
    status: "requested",
  });

  if (error) throw error;
}
