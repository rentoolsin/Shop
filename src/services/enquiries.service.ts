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
