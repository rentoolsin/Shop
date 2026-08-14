import { useAsyncData } from "./useAsyncData";
import { fetchPublishedHomepageContent } from "../services/homepage-content.service";

export function useHomepageContent() {
  return useAsyncData(fetchPublishedHomepageContent, [], { realtimeTables: ["homepage_content"] });
}
