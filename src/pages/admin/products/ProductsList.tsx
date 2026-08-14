import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useAdminProducts, useAdminCategories } from "../../../hooks/useAdminData";
import { usePagination } from "../../../hooks/usePagination";
import { deleteProduct } from "../../../services/admin-products.service";
import { Button } from "../../../components/ui/Button";
import { Card } from "../../../components/ui/Card";
import { StatusBadge } from "../../../components/ui/StatusBadge";
import { Select } from "../../../components/ui/Select";
import { Skeleton } from "../../../components/ui/Skeleton";
import { EmptyState } from "../../../components/ui/EmptyState";
import { ErrorState } from "../../../components/ui/ErrorState";
import { ConfirmDialog } from "../../../components/ui/ConfirmDialog";
import { Pagination } from "../../../components/ui/Pagination";
import { useToast } from "../../../components/ui/Toast";

function BoxIcon() {
  return (
    <svg viewBox="0 0 20 20" fill="none" className="h-6 w-6">
      <path d="M10 3 3.5 6.5 10 10l6.5-3.5L10 3Z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
      <path d="M3.5 6.5V13L10 16.5M16.5 6.5V13L10 16.5M10 10v6.5" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
    </svg>
  );
}

function PencilIcon() {
  return (
    <svg viewBox="0 0 20 20" fill="none" className="h-4 w-4">
      <path
        d="M12.9 3.9a1.6 1.6 0 0 1 2.26 2.26L6.4 14.9l-3.05.76.76-3.05 8.79-8.72Z"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function MoreIcon() {
  return (
    <svg viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4">
      <circle cx="10" cy="4.5" r="1.4" />
      <circle cx="10" cy="10" r="1.4" />
      <circle cx="10" cy="15.5" r="1.4" />
    </svg>
  );
}

export function ProductsList() {
  const products = useAdminProducts();
  const categories = useAdminCategories();
  const { showToast } = useToast();
  const [pendingDelete, setPendingDelete] = useState<{ id: string; name: string } | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);

  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "inactive">("all");

  const allItems = products.status === "success" ? products.data : [];
  const categoryList = categories.status === "success" ? categories.data : [];

  const categoryName = (categoryId: string) =>
    categoryList.find((c) => c.id === categoryId)?.name ?? "—";

  const items = useMemo(() => {
    const q = search.trim().toLowerCase();
    return allItems.filter((product) => {
      if (categoryFilter !== "all" && product.categoryId !== categoryFilter) return false;
      if (statusFilter === "active" && !product.isActive) return false;
      if (statusFilter === "inactive" && product.isActive) return false;
      if (!q) return true;
      return (
        product.name.toLowerCase().includes(q) ||
        categoryName(product.categoryId).toLowerCase().includes(q)
      );
    });
  }, [allItems, search, categoryFilter, statusFilter, categoryList]);

  const { pageItems, page, pageCount, setPage, totalCount, pageSize } = usePagination(items, {
    resetKey: `${search}-${categoryFilter}-${statusFilter}`,
  });

  const handleDelete = async () => {
    if (!pendingDelete) return;
    setDeleting(true);
    try {
      await deleteProduct(pendingDelete.id);
      showToast("Product deleted.", "success");
      setPendingDelete(null);
      products.refetch();
    } catch {
      showToast(
        "Couldn't delete this product — it may have rental history tied to it.",
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
          Products
        </h1>
        <Link to="/admin/products/new">
          <Button size="sm">New product</Button>
        </Link>
      </div>

      <div className="mb-4 flex flex-col gap-2 sm:flex-row">
        <div className="flex h-11 flex-1 items-center gap-2 rounded-lg border border-graphite-200 bg-white px-3 shadow-card dark:border-graphite-800 dark:bg-graphite-900">
          <svg viewBox="0 0 24 24" fill="none" strokeWidth={1.6} aria-hidden="true" className="h-4 w-4 flex-shrink-0 text-graphite-400">
            <circle cx="10.5" cy="10.5" r="6.5" stroke="currentColor" />
            <path d="M20 20l-4.3-4.3" stroke="currentColor" strokeLinecap="round" />
          </svg>
          <input
            type="search"
            inputMode="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name or category"
            aria-label="Search by name or category"
            className="h-full flex-1 bg-transparent font-body text-[14px] text-ink outline-none placeholder:text-graphite-400 dark:text-ink-inverted"
          />
          {search && (
            <button onClick={() => setSearch("")} aria-label="Clear search" className="text-graphite-400">
              ✕
            </button>
          )}
        </div>
        <Select
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
          className="sm:w-44"
        >
          <option value="all">All categories</option>
          {categoryList.map((c) => (
            <option key={c.id} value={c.id}>{c.name}</option>
          ))}
        </Select>
        <Select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value as "all" | "active" | "inactive")}
          className="sm:w-36"
        >
          <option value="all">All</option>
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
        </Select>
      </div>

      {products.status === "loading" && (
        <div className="space-y-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-16 w-full" />
          ))}
        </div>
      )}

      {products.status === "error" && (
        <ErrorState title="Couldn't load products" onRetry={products.refetch} />
      )}

      {products.status === "success" && allItems.length === 0 && (
        <EmptyState
          icon={<BoxIcon />}
          title="No products yet"
          description="Add your first product to start renting it out."
          action={
            <Link to="/admin/products/new">
              <Button size="sm">New product</Button>
            </Link>
          }
        />
      )}

      {products.status === "success" && allItems.length > 0 && items.length === 0 && (
        <EmptyState
          icon={<BoxIcon />}
          title="No products matched"
          description="Try a different search or filter."
        />
      )}

      {products.status === "success" && items.length > 0 && (
        <div className="space-y-2">
          {pageItems.map((product) => (
            <Card key={product.id} className="flex items-center justify-between gap-3 p-4">
              <div className="min-w-0">
                <p className="truncate font-body text-[14px] font-medium text-ink dark:text-ink-inverted">
                  {product.name}
                </p>
                <p className="truncate font-body text-[12px] text-graphite-400">
                  {categoryName(product.categoryId)} · {product.variantCount}{" "}
                  variant{product.variantCount === 1 ? "" : "s"}
                </p>
              </div>
              <div className="flex flex-shrink-0 items-center gap-2">
                {product.isFeatured && <StatusBadge label="Featured" tone="info" />}
                <StatusBadge
                  label={product.isActive ? "Active" : "Inactive"}
                  tone={product.isActive ? "success" : "neutral"}
                />
                <Link
                  to={`/admin/products/${product.id}/edit`}
                  aria-label={`Edit ${product.name}`}
                  className="flex h-9 w-9 items-center justify-center rounded-lg text-graphite-500 hover:bg-graphite-100 dark:text-graphite-400 dark:hover:bg-graphite-800"
                >
                  <PencilIcon />
                </Link>
                <div className="relative">
                  <button
                    type="button"
                    aria-label={`More actions for ${product.name}`}
                    onClick={() => setOpenMenuId((id) => (id === product.id ? null : product.id))}
                    className="flex h-9 w-9 items-center justify-center rounded-lg text-graphite-500 hover:bg-graphite-100 dark:text-graphite-400 dark:hover:bg-graphite-800"
                  >
                    <MoreIcon />
                  </button>
                  {openMenuId === product.id && (
                    <>
                      <button
                        type="button"
                        aria-label="Close menu"
                        className="fixed inset-0 z-10 cursor-default"
                        onClick={() => setOpenMenuId(null)}
                      />
                      <div className="absolute right-0 top-10 z-20 w-36 overflow-hidden rounded-lg border border-graphite-200 bg-white py-1 shadow-raised dark:border-graphite-800 dark:bg-graphite-900">
                        <button
                          type="button"
                          onClick={() => {
                            setOpenMenuId(null);
                            setPendingDelete({ id: product.id, name: product.name });
                          }}
                          className="block w-full px-3 py-2 text-left font-body text-[13px] font-medium text-state-danger hover:bg-graphite-100 dark:hover:bg-graphite-800"
                        >
                          Delete
                        </button>
                      </div>
                    </>
                  )}
                </div>
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
        title="Delete product?"
        description={pendingDelete ? `"${pendingDelete.name}" and its variants will be permanently removed.` : undefined}
        onConfirm={handleDelete}
        onCancel={() => setPendingDelete(null)}
        loading={deleting}
      />
    </div>
  );
}
