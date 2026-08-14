import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useAdminCustomers } from "../../../hooks/useAdminData";
import { usePagination } from "../../../hooks/usePagination";
import { deleteCustomer } from "../../../services/admin-customers.service";
import { Button } from "../../../components/ui/Button";
import { Card } from "../../../components/ui/Card";
import { Skeleton } from "../../../components/ui/Skeleton";
import { EmptyState } from "../../../components/ui/EmptyState";
import { ErrorState } from "../../../components/ui/ErrorState";
import { ConfirmDialog } from "../../../components/ui/ConfirmDialog";
import { Pagination } from "../../../components/ui/Pagination";
import { useToast } from "../../../components/ui/Toast";

const DEBOUNCE_MS = 300;

function CustomerIcon() {
  return (
    <svg viewBox="0 0 20 20" fill="none" className="h-6 w-6">
      <circle cx="10" cy="7" r="2.75" stroke="currentColor" strokeWidth="1.5" />
      <path d="M4 16c0-2.9 2.7-5 6-5s6 2.1 6 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

export function CustomersList() {
  const [input, setInput] = useState("");
  const [debounced, setDebounced] = useState("");
  const customers = useAdminCustomers(debounced);
  const { showToast } = useToast();
  const [pendingDelete, setPendingDelete] = useState<{ id: string; name: string } | null>(null);
  const [deleting, setDeleting] = useState(false);

  const items = customers.status === "success" ? customers.data : [];
  const { pageItems, page, pageCount, setPage, totalCount, pageSize } = usePagination(items, {
    resetKey: debounced,
  });

  useEffect(() => {
    const timer = window.setTimeout(() => setDebounced(input), DEBOUNCE_MS);
    return () => window.clearTimeout(timer);
  }, [input]);

  const handleDelete = async () => {
    if (!pendingDelete) return;
    setDeleting(true);
    try {
      await deleteCustomer(pendingDelete.id);
      showToast("Customer deleted.", "success");
      setPendingDelete(null);
      customers.refetch();
    } catch {
      showToast(
        "Couldn't delete this customer — they may still have rental history.",
        "danger",
      );
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <h1 className="font-display text-[20px] font-bold text-ink dark:text-ink-inverted">
          Customers
        </h1>
        <Link to="/admin/customers/new">
          <Button size="sm"><svg viewBox="0 0 20 20" fill="none" className="h-4 w-4" aria-hidden="true"><path d="M10 4.5v11M4.5 10h11" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" /></svg>New customer</Button>
        </Link>
      </div>

      <div className="mb-4 flex h-11 min-w-0 items-center gap-2 rounded-lg border border-graphite-200 bg-white px-3 shadow-card dark:border-graphite-800 dark:bg-graphite-900">
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
          aria-label="Search by name or mobile number"
          className="h-full min-w-0 flex-1 overflow-hidden text-ellipsis bg-transparent font-body text-[14px] text-ink outline-none placeholder:text-graphite-400 dark:text-ink-inverted"
        />
        {input && (
          <button onClick={() => setInput("")} aria-label="Clear search" className="text-graphite-400">
            ✕
          </button>
        )}
      </div>

      {customers.status === "loading" && (
        <div className="space-y-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-16 w-full" />
          ))}
        </div>
      )}

      {customers.status === "error" && (
        <ErrorState title="Couldn't load customers" onRetry={customers.refetch} />
      )}

      {customers.status === "success" && customers.data.length === 0 && (
        <EmptyState
          icon={<CustomerIcon />}
          title={debounced ? "No customers matched" : "No customers yet"}
          description={
            debounced
              ? `Nothing found for "${debounced}".`
              : "Customers are added automatically when you create a rental, or you can add one here."
          }
          action={
            !debounced ? (
              <Link to="/admin/customers/new">
                <Button size="sm"><svg viewBox="0 0 20 20" fill="none" className="h-4 w-4" aria-hidden="true"><path d="M10 4.5v11M4.5 10h11" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" /></svg>New customer</Button>
              </Link>
            ) : undefined
          }
        />
      )}

      {customers.status === "success" && customers.data.length > 0 && (
        <div className="space-y-2">
          {pageItems.map((customer) => (
            <Card key={customer.id} className="flex items-center justify-between gap-3 p-4">
              <div>
                <p className="font-body text-[14px] font-medium text-ink dark:text-ink-inverted">
                  {customer.name}
                </p>
                <p className="font-mono text-[12px] text-graphite-400">{customer.mobile}</p>
              </div>
              <div className="flex items-center gap-2">
                <Link to={`/admin/customers/${customer.id}/edit`}>
                  <Button variant="ghost" size="sm">Edit</Button>
                </Link>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setPendingDelete({ id: customer.id, name: customer.name })}
                >
                  Delete
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}

      <Pagination
        page={page}
        pageCount={pageCount}
        onPageChange={setPage}
        totalCount={totalCount}
        pageSize={pageSize}
      />

      <ConfirmDialog
        open={!!pendingDelete}
        title="Delete customer?"
        description={pendingDelete ? `"${pendingDelete.name}" will be permanently removed.` : undefined}
        onConfirm={handleDelete}
        onCancel={() => setPendingDelete(null)}
        loading={deleting}
      />
    </div>
  );
}
