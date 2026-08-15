import { MoreVertical, Pencil, Plus, Wrench } from "lucide-react";
import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useAdminProducts, useAdminCategories } from "../../../hooks/useAdminData";
import { usePagination } from "../../../hooks/usePagination";
import { deleteProduct } from "../../../services/admin-products.service";
import { Button } from "../../../components/ui/Button";
import { Card } from "../../../components/ui/Card";
import { StatusBadge } from "../../../components/ui/StatusBadge";
import { Select } from "../../../components/ui/Select";
import { SearchBar } from "../../../components/ui/SearchBar";
import { Skeleton } from "../../../components/ui/Skeleton";
import { EmptyState } from "../../../components/ui/EmptyState";
import { ErrorState } from "../../../components/ui/ErrorState";
import { ConfirmDialog } from "../../../components/ui/ConfirmDialog";
import { Pagination } from "../../../components/ui/Pagination";
import { useToast } from "../../../components/ui/Toast";

function BoxIcon() {
  return <Wrench className="h-6 w-6" strokeWidth={1.5} />;
}

function PencilIcon() {
  return <Pencil className="h-4 w-4" strokeWidth={1.5} />;
}

function MoreIcon() {
  return <MoreVertical className="h-4 w-4" strokeWidth={1.8} />;
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
          <Button size="sm"><Plus className="h-4 w-4" strokeWidth={1.8} aria-hidden="true" />New product</Button>
        </Link>
      </div>

      <div className="mb-4 flex flex-col gap-2 sm:flex-row">
        <SearchBar
          value={search}
          onChange={setSearch}
          placeholder="Search by name or category"
          aria-label="Search by name or category"
        />
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
              <Button size="sm"><Plus className="h-4 w-4" strokeWidth={1.8} aria-hidden="true" />New product</Button>
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
                  className="flex h-9 w-9 items-center justify-center rounded text-graphite-500 hover:bg-graphite-100 dark:text-graphite-400 dark:hover:bg-graphite-800"
                >
                  <PencilIcon />
                </Link>
                <div className="relative">
                  <button
                    type="button"
                    aria-label={`More actions for ${product.name}`}
                    onClick={() => setOpenMenuId((id) => (id === product.id ? null : product.id))}
                    className="flex h-9 w-9 items-center justify-center rounded text-graphite-500 hover:bg-graphite-100 dark:text-graphite-400 dark:hover:bg-graphite-800"
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
                      <div className="absolute right-0 top-10 z-20 w-36 overflow-hidden rounded border border-graphite-200 bg-white py-1 shadow-raised dark:border-graphite-800 dark:bg-graphite-900">
                        <button
                          type="button"
                          onClick={() => {
                            setOpenMenuId(null);
                            setPendingDelete({ id: product.id, name: product.name });
                          }}
                          className="block w-full px-3 py-2 text-left font-body text-[13px] font-medium text-state-danger-text hover:bg-graphite-100 dark:text-state-danger-text-dark dark:hover:bg-graphite-800"
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
