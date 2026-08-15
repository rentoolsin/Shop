import { useAsyncData } from "./useAsyncData";
import { fetchProductReviews, type ReviewSummary } from "../services/reviews.service";

const EMPTY_SUMMARY: ReviewSummary = { reviews: [], averageRating: null, count: 0 };

/** Reviews + star rollup for a single product, live-synced like the rest of the catalog. */
export function useProductReviews(productId: string | undefined) {
  return useAsyncData<ReviewSummary>(
    () => (productId ? fetchProductReviews(productId) : Promise.resolve(EMPTY_SUMMARY)),
    [productId],
    { realtimeTables: productId ? ["product_reviews"] : [] },
  );
}
