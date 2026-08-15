import { supabase } from "../lib/supabase";

export interface ProductReview {
  id: string;
  productId: string;
  name: string;
  rating: number;
  comment: string | null;
  createdAt: string;
}

export interface ReviewSummary {
  reviews: ProductReview[];
  averageRating: number | null;
  count: number;
}

/** Approved reviews for a product, most recent first, plus the rollup used for the star summary. */
export async function fetchProductReviews(productId: string): Promise<ReviewSummary> {
  const { data, error } = await supabase
    .from("product_reviews")
    .select("id, product_id, name, rating, comment, created_at")
    .eq("product_id", productId)
    .order("created_at", { ascending: false });

  if (error) throw error;

  const reviews: ProductReview[] = (data ?? []).map((row) => ({
    id: row.id,
    productId: row.product_id,
    name: row.name,
    rating: row.rating,
    comment: row.comment,
    createdAt: row.created_at,
  }));

  const count = reviews.length;
  const averageRating =
    count > 0 ? reviews.reduce((sum, r) => sum + r.rating, 0) / count : null;

  return { reviews, averageRating, count };
}

export interface SubmitReviewInput {
  productId: string;
  name: string;
  rating: number;
  comment?: string;
}

export async function submitReview(input: SubmitReviewInput): Promise<void> {
  const { error } = await supabase.from("product_reviews").insert({
    product_id: input.productId,
    name: input.name,
    rating: input.rating,
    comment: input.comment ?? null,
  });

  if (error) throw error;
}
