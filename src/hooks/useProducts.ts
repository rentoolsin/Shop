import { useAsyncData } from "./useAsyncData";
import {
  fetchFeaturedProducts,
  fetchProductById,
  fetchProducts,
} from "../services/products.service";

const PRODUCT_TABLES = ["products", "product_variants", "product_images"];

export function useFeaturedProducts() {
  return useAsyncData(fetchFeaturedProducts, [], { realtimeTables: PRODUCT_TABLES });
}

export function useProducts(options: { categoryId?: string; query?: string } = {}) {
  return useAsyncData(() => fetchProducts(options), [options.categoryId, options.query], {
    realtimeTables: PRODUCT_TABLES,
  });
}

export function useProduct(id: string | undefined) {
  return useAsyncData(
    () => {
      if (!id) return Promise.resolve(null);
      return fetchProductById(id);
    },
    [id],
    { realtimeTables: PRODUCT_TABLES },
  );
}
