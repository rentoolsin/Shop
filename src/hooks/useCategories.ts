import { useAsyncData } from "./useAsyncData";
import { fetchActiveCategories } from "../services/categories.service";

export function useCategories() {
  return useAsyncData(fetchActiveCategories, [], { realtimeTables: ["categories"] });
}
