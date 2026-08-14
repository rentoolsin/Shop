import { useEffect, useState } from "react";

const DEFAULT_PAGE_SIZE = 20;

/**
 * Paginates an already-fetched, already-filtered array for rendering.
 * This project's admin lists all use the established fetch-all-then-
 * derive-client-side pattern (see CURRENT-STATE.md) — real server-side
 * pagination would need to move status filters and, for Rentals,
 * `deriveDisplayStatus()` itself server-side, which isn't safe to do
 * without losing same-day accuracy. Slicing the rendered rows here still
 * delivers the actual performance win this is for (bounding DOM size as
 * a list grows) without touching any of that.
 *
 * `resetKey` should be anything that changes when the caller's filters/
 * search change (e.g. a search query or status filter value) — pass it
 * so the page resets to 1 instead of silently showing an empty page
 * after a filter change shrinks the result set.
 */
export function usePagination<T>(
  items: T[],
  options?: { pageSize?: number; resetKey?: unknown },
) {
  const pageSize = options?.pageSize ?? DEFAULT_PAGE_SIZE;
  const [page, setPage] = useState(1);

  useEffect(() => {
    setPage(1);
  }, [options?.resetKey]);

  const totalCount = items.length;
  const pageCount = Math.max(1, Math.ceil(totalCount / pageSize));
  // Defensive clamp: if the result set shrinks (e.g. a refetch returns
  // fewer rows) without resetKey changing, don't render a page past the end.
  const clampedPage = Math.min(page, pageCount);
  const start = (clampedPage - 1) * pageSize;
  const pageItems = items.slice(start, start + pageSize);

  return {
    pageItems,
    page: clampedPage,
    pageCount,
    setPage,
    totalCount,
    pageSize,
  };
}
