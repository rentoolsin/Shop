import { supabase } from "../lib/supabase";

export interface EnquiryInput {
  name: string;
  mobile: string;
  productId?: string;
  requestedProductText?: string;
  quantity?: number;
  requiredDate?: string;
  numberOfDays?: number;
  address?: string;
  message?: string;
}

export async function submitEnquiry(input: EnquiryInput): Promise<void> {
  const { error } = await supabase.from("enquiries").insert({
    name: input.name,
    mobile: input.mobile,
    product_id: input.productId ?? null,
    requested_product_text: input.requestedProductText ?? null,
    quantity: input.quantity ?? null,
    required_date: input.requiredDate ?? null,
    number_of_days: input.numberOfDays ?? null,
    address: input.address ?? null,
    message: input.message ?? null,
    status: "new",
  });

  if (error) throw error;
}

export interface CartEnquiryItemInput {
  productId?: string;
  productName: string;
  dailyRate?: number | null;
  quantity: number;
  /**
   * Per-line rental duration — every line (cart checkout and the general
   * tool picker alike) carries its own, since different tools often need
   * different durations. `CartEnquiryInput.numberOfDays` is no longer
   * used for cart checkout and is kept only for backward compatibility.
   */
  numberOfDays?: number;
}

export interface CartEnquiryInput {
  name: string;
  mobile: string;
  items: CartEnquiryItemInput[];
  requiredDate?: string;
  /** @deprecated Cart lines now each carry their own `numberOfDays` — this shared value is no longer set by the client. */
  numberOfDays?: number;
  address?: string;
  message?: string;
}

/**
 * Submits a multi-item cart as one enquiry (the shared name/mobile/etc.
 * envelope) plus one `enquiry_items` row per line — see
 * supabase/migrations/0013_enquiry_items.sql for why this is a separate
 * table rather than reshaping `enquiries` itself. `requested_product_text`
 * gets a human-readable summary so the existing admin enquiries list still
 * shows something meaningful without needing to open the item detail.
 */
export async function submitCartEnquiry(input: CartEnquiryInput): Promise<void> {
  const summary =
    input.items.length === 1
      ? input.items[0].productName
      : `${input.items.length} items: ${input.items.map((i) => i.productName).join(", ")}`;

  const { data, error } = await supabase
    .from("enquiries")
    .insert({
      name: input.name,
      mobile: input.mobile,
      requested_product_text: summary,
      required_date: input.requiredDate ?? null,
      number_of_days: input.numberOfDays ?? null,
      address: input.address ?? null,
      message: input.message ?? null,
      status: "new",
    })
    .select("id")
    .single();

  if (error) throw error;

  const { error: itemsError } = await supabase.from("enquiry_items").insert(
    input.items.map((item) => ({
      enquiry_id: data.id,
      product_id: item.productId ?? null,
      product_name: item.productName,
      daily_rate: item.dailyRate ?? null,
      quantity: item.quantity,
      number_of_days: item.numberOfDays ?? null,
    })),
  );

  if (itemsError) throw itemsError;
}
