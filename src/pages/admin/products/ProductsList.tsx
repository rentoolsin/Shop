import { useState } from "react";
import { Link } from "react-router-dom";
import { useAdminProducts, useAdminCategories } from "../../../hooks/useAdminData";
import { usePagination } from "../../../hooks/usePagination";
import { deleteProduct } from "../../../services/admin-products.service";
import { Button } from "../../../components/ui/Button";
import { StatusBadge } from "../../../components/ui/StatusBadge";
import { Skeleton } from "../../../components/ui/Skeleton";
import { EmptyState } from "../../../components/ui/EmptyState";
import { ErrorState } from "../../../components/ui/ErrorState";
import { ConfirmDialog } from "../../../components/ui/ConfirmDialog";
import { Pagination } from "../../../components/ui/Pagination";
import { useToast } from "../../../components/ui/Toast";

export function ProductsList() {
  const products = useAdminProducts();
  const categories = useAdminCategories();
  const { showToast } = useToast();
  const [pendingDelete, setPendingDelete] = useState<{ id: string; name: string } | null>(null);
  const [deleting, setDeleting] = useState(false);

  const items = products.status === "success" ? products.data : [];
  const { pageItems, page, pageCount, setPage, totalCount, pageSize } = usePagination(items);

  const categoryName = (categoryId: string) =>
    categories.status === "success"
      ? categories.data.find((c) => c.id === categoryId)?.name ?? "—"
      : "—";

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

      {products.status === "success" && products.data.length === 0 && (
        <EmptyState
          title="No products yet"
          description="Add your first product to start renting it out."
          action={
            <Link to="/admin/products/new">
              <Button size="sm">New product</Button>
            </Link>
          }
        />
      )}

      {products.status === "success" && products.data.length > 0 && (
        <div className="divide-y divide-graphite-200 rounded-lg border border-graphite-200 bg-white dark:divide-graphite-800 dark:border-graphite-800 dark:bg-graphite-900">
          {pageItems.map((product) => (
            <div key={product.id} className="flex items-center justify-between gap-3 px-4 py-3">
              <div>
                <p className="font-body text-[14px] font-medium text-ink dark:text-ink-inverted">
                  {product.name}
                </p>
                <p className="font-body text-[12px] text-graphite-400">
                  {categoryName(product.categoryId)} · {product.variantCount}{" "}
                  variant{product.variantCount === 1 ? "" : "s"}
                </p>
              </div>
              <div className="flex items-center gap-2">
                {product.isFeatured && <StatusBadge label="Featured" tone="info" />}
                <StatusBadge
                  label={product.isActive ? "Active" : "Inactive"}
                  tone={product.isActive ? "success" : "neutral"}
                />
                <Link to={`/admin/products/${product.id}/edit`}>
                  <Button variant="ghost" size="sm">Edit</Button>
                </Link>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setPendingDelete({ id: product.id, name: product.name })}
                >
                  Delete
                </Button>
              </div>
            </div>
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
