import { Plus, Users } from "@phosphor-icons/react";
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useAdminCustomers } from "../../../hooks/useAdminData";
import { usePagination } from "../../../hooks/usePagination";
import { deleteCustomer } from "../../../services/admin-customers.service";
import { Button } from "../../../components/ui/Button";
import { Card } from "../../../components/ui/Card";
import { SearchBar } from "../../../components/ui/SearchBar";
import { Skeleton } from "../../../components/ui/Skeleton";
import { EmptyState } from "../../../components/ui/EmptyState";
import { ErrorState } from "../../../components/ui/ErrorState";
import { ConfirmDialog } from "../../../components/ui/ConfirmDialog";
import { Pagination } from "../../../components/ui/Pagination";
import { useToast } from "../../../components/ui/Toast";
import { Table, TableHead, TableHeaderCell, TableBody, TableRow, TableCell } from "../../../components/ui/Table";

const DEBOUNCE_MS = 300;

function CustomerIcon() {
  return <Users className="h-6 w-6" weight="light" />;
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
          <Button size="sm"><Plus className="h-4 w-4" weight="regular" aria-hidden="true" />New customer</Button>
        </Link>
      </div>

      <div className="mb-4">
        <SearchBar
          value={input}
          onChange={setInput}
          placeholder="Search by name or mobile"
          aria-label="Search by name or mobile number"
        />
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
                <Button size="sm"><Plus className="h-4 w-4" weight="regular" aria-hidden="true" />New customer</Button>
              </Link>
            ) : undefined
          }
        />
      )}

      {customers.status === "success" && customers.data.length > 0 && (
        <>
          {/* Mobile: stacked cards */}
          <div className="space-y-2 md:hidden">
            {pageItems.map((customer) => (
              <Card key={customer.id} className="flex items-center justify-between gap-3 p-4">
                <div className="min-w-0 flex-1">
                  <p className="font-body text-[14px] font-medium text-ink dark:text-ink-inverted">
                    {customer.name}
                  </p>
                  <p className="font-mono text-[12px] text-graphite-400">{customer.mobile}</p>
                  <p className="mt-0.5 truncate font-body text-[12px] text-graphite-400">
                    {customer.address || "No address"}
                  </p>
                </div>
                <div className="flex flex-shrink-0 items-center gap-2">
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

          {/* Desktop: dense table */}
          <div className="hidden md:block">
            <Table>
              <TableHead>
                <TableHeaderCell>Name</TableHeaderCell>
                <TableHeaderCell>Mobile</TableHeaderCell>
                <TableHeaderCell>Address</TableHeaderCell>
                <TableHeaderCell className="text-right">Actions</TableHeaderCell>
              </TableHead>
              <TableBody>
                {pageItems.map((customer) => (
                  <TableRow key={customer.id}>
                    <TableCell className="font-medium">{customer.name}</TableCell>
                    <TableCell className="font-mono text-[12px] text-graphite-500">{customer.mobile}</TableCell>
                    <TableCell className="max-w-[280px] truncate text-graphite-500 dark:text-graphite-400">
                      {customer.address || "—"}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1.5">
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
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </>
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
