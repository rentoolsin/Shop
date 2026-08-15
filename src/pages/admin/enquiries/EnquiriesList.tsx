import { ChatText } from "@phosphor-icons/react";
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
import { SearchBar } from "../../../components/ui/SearchBar";
import { Skeleton } from "../../../components/ui/Skeleton";
import { EmptyState } from "../../../components/ui/EmptyState";
import { ErrorState } from "../../../components/ui/ErrorState";
import { Pagination } from "../../../components/ui/Pagination";
import { STATUS_LABEL, STATUS_TONE } from "../../../utils/enquiry-status";

const DEBOUNCE_MS = 300;

function EnquiryIcon() {
  return <ChatText className="h-6 w-6" weight="light" />;
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
        <SearchBar
          value={input}
          onChange={setInput}
          placeholder="Search by name or mobile"
          aria-label="Search by name, mobile or product"
        />
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
