import { ClipboardText, Plus, CaretRight, PencilSimple, Trash } from "@phosphor-icons/react";
import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAdminPurchaseRequests } from "../../../hooks/useAdminData";
import { usePagination } from "../../../hooks/usePagination";
import { deletePurchaseRequest } from "../../../services/admin-purchase-requests.service";
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
import { ConfirmDialog } from "../../../components/ui/ConfirmDialog";
import { useToast } from "../../../components/ui/Toast";
import { STATUS_LABEL, STATUS_TONE, PRIORITY_LABEL } from "../../../utils/purchase-request-status";
import { Table, TableHead, TableHeaderCell, TableBody, TableRow, TableCell } from "../../../components/ui/Table";

const DEBOUNCE_MS = 300;

const PRIORITY_TONE: Record<PurchaseRequestPriority, "neutral" | "warning" | "danger"> = {
  low: "neutral",
  normal: "neutral",
  high: "danger",
};

// Requests still being worked (requested/sourcing) float to the top, ahead
// of ones already closed out (fulfilled/declined); within a status, higher
// priority requests come first so an urgent one doesn't get lost among
// several low-priority requests filed the same day.
const STATUS_SORT_PRIORITY: Record<PurchaseRequestStatus, number> = {
  requested: 0,
  sourcing: 1,
  fulfilled: 2,
  declined: 3,
};

const PRIORITY_SORT_PRIORITY: Record<PurchaseRequestPriority, number> = {
  high: 0,
  normal: 1,
  low: 2,
};

function CalendarIcon() {
  return <ClipboardText className="h-6 w-6" weight="light" />;
}

/** Small icon-only button for row-level actions (edit / delete). */
function RowIconButton({
  label,
  onClick,
  variant = "ghost",
  children,
}: {
  label: string;
  onClick: (e: React.MouseEvent) => void;
  variant?: "ghost" | "danger";
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      onClick={onClick}
      className={[
        "inline-flex h-8 w-8 flex-shrink-0 items-center justify-center rounded transition-colors duration-150 ease-app",
        variant === "danger"
          ? "text-graphite-400 hover:bg-state-danger/10 hover:text-state-danger-text dark:hover:text-state-danger-text-dark"
          : "text-graphite-400 hover:bg-graphite-100 hover:text-ink dark:hover:bg-graphite-800 dark:hover:text-ink-inverted",
      ].join(" ")}
    >
      {children}
    </button>
  );
}

export function PurchaseRequestsList() {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const [input, setInput] = useState("");
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | PurchaseRequestStatus>("all");
  const [deleteTarget, setDeleteTarget] = useState<AdminPurchaseRequest | null>(null);
  const [deleting, setDeleting] = useState(false);

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
    return data
      .filter((r) => statusFilter === "all" || r.status === statusFilter)
      .sort((a, b) => {
        const statusDiff = STATUS_SORT_PRIORITY[a.status] - STATUS_SORT_PRIORITY[b.status];
        if (statusDiff !== 0) return statusDiff;
        return PRIORITY_SORT_PRIORITY[a.priority] - PRIORITY_SORT_PRIORITY[b.priority];
      });
  }, [data, statusFilter]);

  const { pageItems, page, pageCount, setPage, totalCount, pageSize } = usePagination(rows, {
    resetKey: `${query}-${statusFilter}`,
  });

  const handleDeleteConfirm = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await deletePurchaseRequest(deleteTarget.id);
      showToast("Purchase request deleted.", "success");
      setDeleteTarget(null);
      requests.refetch();
    } catch {
      showToast("Couldn't delete this request. Try again.", "danger");
    } finally {
      setDeleting(false);
    }
  };

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
        <>
          {/* Mobile: stacked cards */}
          <div className="space-y-2 md:hidden">
            {pageItems.map((request) => (
              <Card
                key={request.id}
                interactive
                className="p-4 hover:border-graphite-300 dark:hover:border-graphite-700"
                onClick={() => navigate(`/admin/purchase-requests/${request.id}`)}
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-body text-[14px] font-medium text-ink dark:text-ink-inverted">
                      {request.productRequested}
                    </p>
                    <p className="font-mono text-[12px] text-graphite-400">
                      {request.customerName ?? request.requesterName ?? request.mobile ?? "No contact on file"}
                    </p>
                  </div>
                  <div className="flex flex-shrink-0 items-center gap-1">
                    <div className="flex flex-col items-end gap-1">
                      <StatusBadge label={STATUS_LABEL[request.status]} tone={STATUS_TONE[request.status]} />
                      {request.priority !== "normal" && (
                        <StatusBadge
                          label={PRIORITY_LABEL[request.priority]}
                          tone={PRIORITY_TONE[request.priority]}
                        />
                      )}
                    </div>
                    <Link
                      to={`/admin/purchase-requests/${request.id}/edit`}
                      onClick={(e) => e.stopPropagation()}
                      aria-label="Edit purchase request"
                      title="Edit purchase request"
                      className="inline-flex h-8 w-8 flex-shrink-0 items-center justify-center rounded text-graphite-400 transition-colors duration-150 ease-app hover:bg-graphite-100 hover:text-ink dark:hover:bg-graphite-800 dark:hover:text-ink-inverted"
                    >
                      <PencilSimple className="h-4 w-4" weight="light" />
                    </Link>
                    <RowIconButton
                      label="Delete purchase request"
                      variant="danger"
                      onClick={(e) => {
                        e.stopPropagation();
                        setDeleteTarget(request);
                      }}
                    >
                      <Trash className="h-4 w-4" weight="light" />
                    </RowIconButton>
                  </div>
                </div>
                {request.quantity && (
                  <p className="mt-2 font-body text-[13px] text-graphite-600 dark:text-graphite-300">
                    Qty {request.quantity}
                  </p>
                )}
              </Card>
            ))}
          </div>

          {/* Desktop: dense table */}
          <div className="hidden md:block">
            <Table>
              <TableHead>
                <TableHeaderCell>Product</TableHeaderCell>
                <TableHeaderCell>Contact</TableHeaderCell>
                <TableHeaderCell>Qty</TableHeaderCell>
                <TableHeaderCell>Priority</TableHeaderCell>
                <TableHeaderCell>Status</TableHeaderCell>
                <TableHeaderCell aria-label="Actions" className="w-24" />
              </TableHead>
              <TableBody>
                {pageItems.map((request) => (
                  <TableRow
                    key={request.id}
                    interactive
                    onClick={() => navigate(`/admin/purchase-requests/${request.id}`)}
                  >
                    <TableCell className="font-medium">{request.productRequested}</TableCell>
                    <TableCell className="font-mono text-[12px] text-graphite-500">
                      {request.customerName ?? request.requesterName ?? request.mobile ?? "No contact on file"}
                    </TableCell>
                    <TableCell className="font-mono text-[12px] text-graphite-500">
                      {request.quantity ?? "—"}
                    </TableCell>
                    <TableCell>
                      {request.priority !== "normal" ? (
                        <StatusBadge
                          label={PRIORITY_LABEL[request.priority]}
                          tone={PRIORITY_TONE[request.priority]}
                        />
                      ) : (
                        <span className="font-body text-[12px] text-graphite-400">Normal</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <StatusBadge label={STATUS_LABEL[request.status]} tone={STATUS_TONE[request.status]} />
                    </TableCell>
                    <TableCell className="w-24">
                      <div className="flex items-center justify-end gap-0.5">
                        <Link
                          to={`/admin/purchase-requests/${request.id}/edit`}
                          onClick={(e) => e.stopPropagation()}
                          aria-label="Edit purchase request"
                          title="Edit purchase request"
                          className="inline-flex h-8 w-8 flex-shrink-0 items-center justify-center rounded text-graphite-400 transition-colors duration-150 ease-app hover:bg-graphite-100 hover:text-ink dark:hover:bg-graphite-800 dark:hover:text-ink-inverted"
                        >
                          <PencilSimple className="h-4 w-4" weight="light" />
                        </Link>
                        <RowIconButton
                          label="Delete purchase request"
                          variant="danger"
                          onClick={(e) => {
                            e.stopPropagation();
                            setDeleteTarget(request);
                          }}
                        >
                          <Trash className="h-4 w-4" weight="light" />
                        </RowIconButton>
                        <CaretRight className="h-4 w-4 text-graphite-300" weight="light" aria-hidden="true" />
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </>
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

      <ConfirmDialog
        open={deleteTarget !== null}
        title="Delete purchase request?"
        description={
          deleteTarget
            ? `The request for "${deleteTarget.productRequested}" will be permanently removed.`
            : undefined
        }
        onConfirm={handleDeleteConfirm}
        onCancel={() => setDeleteTarget(null)}
        loading={deleting}
      />
    </div>
  );
}
