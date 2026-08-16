import { ChatText, PencilSimple, Trash, CaretRight } from "@phosphor-icons/react";
import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAdminEnquiries } from "../../../hooks/useAdminData";
import { usePagination } from "../../../hooks/usePagination";
import { deleteEnquiry } from "../../../services/admin-enquiries.service";
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
import { ConfirmDialog } from "../../../components/ui/ConfirmDialog";
import { useToast } from "../../../components/ui/Toast";
import { STATUS_LABEL, STATUS_TONE } from "../../../utils/enquiry-status";
import { Table, TableHead, TableHeaderCell, TableBody, TableRow, TableCell } from "../../../components/ui/Table";

const DEBOUNCE_MS = 300;

function EnquiryIcon() {
  return <ChatText className="h-6 w-6" weight="light" />;
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

export function EnquiriesList() {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const [input, setInput] = useState("");
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | EnquiryStatus>("all");
  const [deleteTarget, setDeleteTarget] = useState<AdminEnquiry | null>(null);
  const [deleting, setDeleting] = useState(false);

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

  const handleDeleteConfirm = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await deleteEnquiry(deleteTarget.id);
      showToast("Enquiry deleted.", "success");
      setDeleteTarget(null);
      enquiries.refetch();
    } catch {
      showToast("Couldn't delete this enquiry. Try again.", "danger");
    } finally {
      setDeleting(false);
    }
  };

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
        <>
          {/* Mobile: stacked cards */}
          <div className="space-y-2 md:hidden">
            {pageItems.map((enquiry) => (
              <Card
                key={enquiry.id}
                interactive
                className="p-4 hover:border-graphite-300 dark:hover:border-graphite-700"
                onClick={() => navigate(`/admin/enquiries/${enquiry.id}`)}
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-body text-[14px] font-medium text-ink dark:text-ink-inverted">
                      {enquiry.name}
                    </p>
                    <p className="font-mono text-[12px] text-graphite-400">{enquiry.mobile}</p>
                  </div>
                  <div className="flex flex-shrink-0 items-center gap-1">
                    <StatusBadge label={STATUS_LABEL[enquiry.status]} tone={STATUS_TONE[enquiry.status]} />
                    <Link
                      to={`/admin/enquiries/${enquiry.id}/edit`}
                      onClick={(e) => e.stopPropagation()}
                      aria-label="Edit enquiry"
                      title="Edit enquiry"
                      className="inline-flex h-8 w-8 flex-shrink-0 items-center justify-center rounded text-graphite-400 transition-colors duration-150 ease-app hover:bg-graphite-100 hover:text-ink dark:hover:bg-graphite-800 dark:hover:text-ink-inverted"
                    >
                      <PencilSimple className="h-4 w-4" weight="light" />
                    </Link>
                    <RowIconButton
                      label="Delete enquiry"
                      variant="danger"
                      onClick={(e) => {
                        e.stopPropagation();
                        setDeleteTarget(enquiry);
                      }}
                    >
                      <Trash className="h-4 w-4" weight="light" />
                    </RowIconButton>
                  </div>
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
            ))}
          </div>

          {/* Desktop: dense table */}
          <div className="hidden md:block">
            <Table>
              <TableHead>
                <TableHeaderCell>Name</TableHeaderCell>
                <TableHeaderCell>Mobile</TableHeaderCell>
                <TableHeaderCell>Product</TableHeaderCell>
                <TableHeaderCell>Needed</TableHeaderCell>
                <TableHeaderCell>Status</TableHeaderCell>
                <TableHeaderCell aria-label="Actions" className="w-24" />
              </TableHead>
              <TableBody>
                {pageItems.map((enquiry) => (
                  <TableRow
                    key={enquiry.id}
                    interactive
                    onClick={() => navigate(`/admin/enquiries/${enquiry.id}`)}
                  >
                    <TableCell className="font-medium">{enquiry.name}</TableCell>
                    <TableCell className="font-mono text-[12px] text-graphite-500">{enquiry.mobile}</TableCell>
                    <TableCell>
                      <span className="text-graphite-600 dark:text-graphite-300">
                        {enquiry.productName ?? enquiry.requestedProductText ?? "No specific product"}
                      </span>
                      {enquiry.quantity ? (
                        <span className="ml-1 font-mono text-[11.5px] text-graphite-400">
                          Qty {enquiry.quantity}
                        </span>
                      ) : null}
                    </TableCell>
                    <TableCell>
                      <span className="font-mono text-[12px] text-graphite-500">
                        {enquiry.requiredDate ?? "No date"}
                        {enquiry.numberOfDays ? ` · ${enquiry.numberOfDays}d` : ""}
                      </span>
                    </TableCell>
                    <TableCell>
                      <StatusBadge label={STATUS_LABEL[enquiry.status]} tone={STATUS_TONE[enquiry.status]} />
                    </TableCell>
                    <TableCell className="w-24">
                      <div className="flex items-center justify-end gap-0.5">
                        <Link
                          to={`/admin/enquiries/${enquiry.id}/edit`}
                          onClick={(e) => e.stopPropagation()}
                          aria-label="Edit enquiry"
                          title="Edit enquiry"
                          className="inline-flex h-8 w-8 flex-shrink-0 items-center justify-center rounded text-graphite-400 transition-colors duration-150 ease-app hover:bg-graphite-100 hover:text-ink dark:hover:bg-graphite-800 dark:hover:text-ink-inverted"
                        >
                          <PencilSimple className="h-4 w-4" weight="light" />
                        </Link>
                        <RowIconButton
                          label="Delete enquiry"
                          variant="danger"
                          onClick={(e) => {
                            e.stopPropagation();
                            setDeleteTarget(enquiry);
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

      <ConfirmDialog
        open={deleteTarget !== null}
        title="Delete enquiry?"
        description={deleteTarget ? `This enquiry from "${deleteTarget.name}" will be permanently removed.` : undefined}
        onConfirm={handleDeleteConfirm}
        onCancel={() => setDeleteTarget(null)}
        loading={deleting}
      />
    </div>
  );
}
