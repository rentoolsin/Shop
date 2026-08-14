import { Button } from "./Button";

interface PaginationProps {
  page: number;
  pageCount: number;
  onPageChange: (page: number) => void;
  totalCount: number;
  pageSize: number;
}

/** Prev/Next pager with a "showing X–Y of Z" label. Renders nothing when everything fits on one page. */
export function Pagination({ page, pageCount, onPageChange, totalCount, pageSize }: PaginationProps) {
  if (pageCount <= 1) return null;

  const start = (page - 1) * pageSize + 1;
  const end = Math.min(page * pageSize, totalCount);

  return (
    <nav
      aria-label="Pagination"
      className="mt-4 flex items-center justify-between gap-3 border-t border-graphite-200 pt-3 dark:border-graphite-800"
    >
      <span className="font-body text-[12px] text-graphite-500">
        {start}–{end} of {totalCount}
      </span>
      <div className="flex gap-2">
        <Button
          variant="secondary"
          size="sm"
          disabled={page <= 1}
          onClick={() => onPageChange(page - 1)}
        >
          Previous
        </Button>
        <Button
          variant="secondary"
          size="sm"
          disabled={page >= pageCount}
          onClick={() => onPageChange(page + 1)}
        >
          Next
        </Button>
      </div>
    </nav>
  );
}
