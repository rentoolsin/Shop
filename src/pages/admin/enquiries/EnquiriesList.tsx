import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useAdminEnquiries } from "../../../hooks/useAdminData";
import { usePagination } from "../../../hooks/usePagination";
import type { AdminEnquiry } from "../../../services/admin-enquiries.service";
import type { EnquiryStatus } from "../../../types/database";
import { Button } from "../../../components/ui/Button";
import { Card } from "../../../components/ui/Card";
import { StatusBadge } from "../../../components/ui/StatusBadge";
import { Select } from "../../../components/ui/Select";
import { Skeleton } from "../../../components/ui/Skeleton";
import { EmptyState } from "../../../components/ui/EmptyState";
import { ErrorState } from "../../../components/ui/ErrorState";
import { Pagination } from "../../../components/ui/Pagination";
import { STATUS_LABEL, STATUS_TONE } from "../../../utils/enquiry-status";

const DEBOUNCE_MS = 300;

function EnquiryIcon() {
  return (
    <svg viewBox="0 0 20 20" fill="none" className="h-6 w-6">
      <path
        d="M3.5 5.5A1.5 1.5 0 0 1 5 4h10a1.5 1.5 0 0 1 1.5 1.5v7A1.5 1.5 0 0 1 15 14H8l-3.5 2.5V14H5A1.5 1.5 0 0 1 3.5 12.5v-7Z"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function EnquiriesList() {
  const [input, setInput] = useState("");
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | EnquiryStatus>("all");

  useEffect(() => {
    const timer = window.setTimeout(() => setQuery(input), DEBOUNCE_MS);
    return () => window.clearTimeout(timer);
  }, [input]);

  // Text search runs server-side (see fetchAllEnquiries); status filtering
  // stays client-side over the already-searched result set.
  const enquiries = useAdminEnquiries(query);

  const data = useMemo(() => (enquiries.status === "success" ? enquiries.data : []), [enquiries]);

  const rows: AdminEnquiry[] = useMemo(() => {
    return data.filter((e) => statusFilter === "all" || e.status === statusFilter);
  }, [data, statusFilter]);

  const { pageItems, page, pageCount, setPage, totalCount, pageSize } = usePagination(rows, {
    resetKey: `${query}-${statusFilter}`,
  });

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <h1 className="font-display text-[20px] font-bold text-ink dark:text-ink-inverted">
          Enquiries
        </h1>
      </div>

      <div className="mb-4 flex flex-col gap-2 sm:flex-row">
        <div className="flex h-11 min-w-0 flex-1 items-center gap-2 rounded-lg border border-graphite-200 bg-white px-3 shadow-card dark:border-graphite-800 dark:bg-graphite-900">
          <svg viewBox="0 0 24 24" fill="none" strokeWidth={1.6} aria-hidden="true" className="h-4 w-4 flex-shrink-0 text-graphite-400">
            <circle cx="10.5" cy="10.5" r="6.5" stroke="currentColor" />
            <path d="M20 20l-4.3-4.3" stroke="currentColor" strokeLinecap="round" />
          </svg>
          <input
            type="search"
            inputMode="search"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Search by name or mobile"
            aria-label="Search by name, mobile or product"
            className="h-full min-w-0 flex-1 overflow-hidden text-ellipsis bg-transparent font-body text-[14px] text-ink outline-none placeholder:text-graphite-400 dark:text-ink-inverted"
          />
          {input && (
            <button onClick={() => setInput("")} aria-label="Clear search" className="text-graphite-400">
              ✕
            </button>
          )}
        </div>
        <Select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value as "all" | EnquiryStatus)}
          className="sm:w-48"
        >
          <option value="all">All statuses</option>
          {(Object.keys(STATUS_LABEL) as EnquiryStatus[]).map((s) => (
            <option key={s} value={s}>{STATUS_LABEL[s]}</option>
          ))}
        </Select>
      </div>

      {enquiries.status === "loading" && (
        <div className="space-y-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-20 w-full" />
          ))}
        </div>
      )}

      {enquiries.status === "error" && (
        <ErrorState title="Couldn't load enquiries" onRetry={enquiries.refetch} />
      )}

      {enquiries.status === "success" && rows.length === 0 && (
        <EmptyState
          icon={<EnquiryIcon />}
          title={
            rows.length === 0 && !query && statusFilter === "all"
              ? "No enquiries yet"
              : "No enquiries matched"
          }
          description={
            !query && statusFilter === "all"
              ? "Enquiries submitted from the public site will show up here."
              : "Try a different search or status filter."
          }
        />
      )}

      {enquiries.status === "success" && rows.length > 0 && (
        <div className="space-y-2">
          {pageItems.map((enquiry) => (
            <Link key={enquiry.id} to={`/admin/enquiries/${enquiry.id}`}>
              <Card interactive className="p-4 hover:border-graphite-300 dark:hover:border-graphite-700">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-body text-[14px] font-medium text-ink dark:text-ink-inverted">
                      {enquiry.name}
                    </p>
                    <p className="font-mono text-[12px] text-graphite-400">{enquiry.mobile}</p>
                  </div>
                  <StatusBadge label={STATUS_LABEL[enquiry.status]} tone={STATUS_TONE[enquiry.status]} />
                </div>
                <p className="mt-2 font-body text-[13px] text-graphite-600 dark:text-graphite-300">
                  {enquiry.productName ?? enquiry.requestedProductText ?? "No specific product"}
                  {enquiry.quantity ? ` · Qty ${enquiry.quantity}` : ""}
                </p>
                <p className="font-mono text-[12px] text-graphite-400">
                  {enquiry.requiredDate ? `Needed from ${enquiry.requiredDate}` : "No date specified"}
                  {enquiry.numberOfDays ? ` · ${enquiry.numberOfDays} day${enquiry.numberOfDays === 1 ? "" : "s"}` : ""}
                </p>
              </Card>
            </Link>
          ))}
        </div>
      )}
      {enquiries.status === "success" && rows.length > 0 && (
        <Pagination
          page={page}
          pageCount={pageCount}
          onPageChange={setPage}
          totalCount={totalCount}
          pageSize={pageSize}
        />
      )}
      {enquiries.status === "success" && (
        <p className="mt-3 text-right font-body text-[12px] text-graphite-400">
          <Button variant="ghost" size="sm" onClick={() => enquiries.refetch()}>
            Refresh
          </Button>
        </p>
      )}
    </div>
  );
}
