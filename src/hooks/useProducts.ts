import { useAsyncData } from "./useAsyncData";
import {
  fetchFeaturedProducts,
  fetchProductById,
  fetchProducts,
} from "../services/products.service";

export function useFeaturedProducts() {
  return useAsyncData(fetchFeaturedProducts, []);
}

export function useProducts(options: { categoryId?: string; query?: string } = {}) {
  return useAsyncData(() => fetchProducts(options), [options.categoryId, options.query]);
}

export function useProduct(id: string | undefined) {
  return useAsyncData(() => {
    if (!id) return Promise.resolve(null);
    return fetchProductById(id);
  }, [id]);
}
