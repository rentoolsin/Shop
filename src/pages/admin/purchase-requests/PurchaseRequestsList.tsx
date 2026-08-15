import { ClipboardText, Plus } from "@phosphor-icons/react";
import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useAdminPurchaseRequests } from "../../../hooks/useAdminData";
import { usePagination } from "../../../hooks/usePagination";
import type {
  AdminPurchaseRequest,
  PurchaseRequestPriority,
} from "../../../services/admin-purchase-requests.service";
import type { PurchaseRequestStatus } from "../../../types/database";
import { Button } from "../../../components/ui/Button";
import { Card } from "../../../components/ui/Card";
import { StatusBadge } from "../../../components/ui/StatusBadge";
import { Select } from "../../../components/ui/Select";
import { SearchBar } from "../../../components/ui/SearchBar";
import { Skeleton } from "../../../components/ui/Skeleton";
import { EmptyState } from "../../../components/ui/EmptyState";
import { ErrorState } from "../../../components/ui/ErrorState";
import { Pagination } from "../../../components/ui/Pagination";
import { STATUS_LABEL, STATUS_TONE, PRIORITY_LABEL } from "../../../utils/purchase-request-status";

const DEBOUNCE_MS = 300;

const PRIORITY_TONE: Record<PurchaseRequestPriority, "neutral" | "warning" | "danger"> = {
  low: "neutral",
  normal: "neutral",
  high: "danger",
};

function CalendarIcon() {
  return <ClipboardText className="h-6 w-6" weight="light" />;
}

export function PurchaseRequestsList() {
  const [input, setInput] = useState("");
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | PurchaseRequestStatus>("all");

  useEffect(() => {
    const timer = window.setTimeout(() => setQuery(input), DEBOUNCE_MS);
    return () => window.clearTimeout(timer);
  }, [input]);

  // Text search runs server-side (see fetchAllPurchaseRequests — matches
  // product/mobile/requester-name columns; an admin-logged request's
  // linked customer *name* isn't matched, only their mobile, since that
  // name only exists via the customers join). Status filtering stays
  // client-side over the already-searched result set.
  const requests = useAdminPurchaseRequests(query);

  const data = useMemo(() => (requests.status === "success" ? requests.data : []), [requests]);

  const rows: AdminPurchaseRequest[] = useMemo(() => {
    return data.filter((r) => statusFilter === "all" || r.status === statusFilter);
  }, [data, statusFilter]);

  const { pageItems, page, pageCount, setPage, totalCount, pageSize } = usePagination(rows, {
    resetKey: `${query}-${statusFilter}`,
  });

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <h1 className="font-display text-[20px] font-bold text-ink dark:text-ink-inverted">
          Purchase Requests
        </h1>
        <Link to="/admin/purchase-requests/new">
          <Button size="sm"><Plus className="h-4 w-4" weight="regular" aria-hidden="true" />New request</Button>
        </Link>
      </div>

      <div className="mb-4 flex flex-col gap-2 sm:flex-row">
        <SearchBar
          value={input}
          onChange={setInput}
          placeholder="Search by customer or product"
          aria-label="Search by product, customer or mobile"
        />
        <Select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value as "all" | PurchaseRequestStatus)}
          className="sm:w-48"
        >
          <option value="all">All statuses</option>
          {(Object.keys(STATUS_LABEL) as PurchaseRequestStatus[]).map((s) => (
            <option key={s} value={s}>{STATUS_LABEL[s]}</option>
          ))}
        </Select>
      </div>

      {requests.status === "loading" && (
        <div className="space-y-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-20 w-full" />
          ))}
        </div>
      )}

      {requests.status === "error" && (
        <ErrorState title="Couldn't load purchase requests" onRetry={requests.refetch} />
      )}

      {requests.status === "success" && rows.length === 0 && (
        <EmptyState
          icon={<CalendarIcon />}
          title={
            rows.length === 0 && !query && statusFilter === "all"
              ? "No purchase requests yet"
              : "No requests matched"
          }
          description={
            !query && statusFilter === "all"
              ? "Log a request when a customer asks for something that isn't in stock."
              : "Try a different search or status filter."
          }
          action={
            !query && statusFilter === "all" ? (
              <Link to="/admin/purchase-requests/new">
                <Button size="sm"><Plus className="h-4 w-4" weight="regular" aria-hidden="true" />New request</Button>
              </Link>
            ) : undefined
          }
        />
      )}

      {requests.status === "success" && rows.length > 0 && (
        <div className="space-y-2">
          {pageItems.map((request) => (
            <Link key={request.id} to={`/admin/purchase-requests/${request.id}`}>
              <Card interactive className="p-4 hover:border-graphite-300 dark:hover:border-graphite-700">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-body text-[14px] font-medium text-ink dark:text-ink-inverted">
                      {request.productRequested}
                    </p>
                    <p className="font-mono text-[12px] text-graphite-400">
                      {request.customerName ?? request.requesterName ?? request.mobile ?? "No contact on file"}
                    </p>
                  </div>
                  <div className="flex flex-shrink-0 flex-col items-end gap-1">
                    <StatusBadge label={STATUS_LABEL[request.status]} tone={STATUS_TONE[request.status]} />
                    {request.priority !== "normal" && (
                      <StatusBadge
                        label={PRIORITY_LABEL[request.priority]}
                        tone={PRIORITY_TONE[request.priority]}
                      />
                    )}
                  </div>
                </div>
                {request.quantity && (
                  <p className="mt-2 font-body text-[13px] text-graphite-600 dark:text-graphite-300">
                    Qty {request.quantity}
                  </p>
                )}
              </Card>
            </Link>
          ))}
        </div>
      )}
      {requests.status === "success" && rows.length > 0 && (
        <Pagination
          page={page}
          pageCount={pageCount}
          onPageChange={setPage}
          totalCount={totalCount}
          pageSize={pageSize}
        />
      )}
      {requests.status === "success" && (
        <p className="mt-3 text-right font-body text-[12px] text-graphite-400">
          <Button variant="ghost" size="sm" onClick={() => requests.refetch()}>
            Refresh
          </Button>
        </p>
      )}
    </div>
  );
}
