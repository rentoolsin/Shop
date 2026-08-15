import { useAsyncData } from "./useAsyncData";
import { fetchAllLocations } from "../services/locations.service";

export function useLocations() {
  return useAsyncData(fetchAllLocations, [], { realtimeTables: ["locations"] });
}
