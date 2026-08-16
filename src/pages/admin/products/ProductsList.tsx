import {
  Check,
  DotsThreeVertical,
  FolderSimple,
  ListBullets,
  PencilSimple,
  Plus,
  SquaresFour,
  Trash,
  Wrench,
} from "@phosphor-icons/react";
import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useAdminProducts, useAdminCategories, useAdminProduct } from "../../../hooks/useAdminData";
import { usePagination } from "../../../hooks/usePagination";
import {
  deleteProduct,
  updateProductCategory,
} from "../../../services/admin-products.service";
import { ProductsBoard } from "./ProductsBoard";
import { formatCurrency } from "../../../utils/currency";
import { Button } from "../../../components/ui/Button";
import { Card } from "../../../components/ui/Card";
import { StatusBadge } from "../../../components/ui/StatusBadge";
import { Select } from "../../../components/ui/Select";
import { SearchBar } from "../../../components/ui/SearchBar";
import { Skeleton } from "../../../components/ui/Skeleton";
import { EmptyState } from "../../../components/ui/EmptyState";
import { ErrorState } from "../../../components/ui/ErrorState";
import { ConfirmDialog } from "../../../components/ui/ConfirmDialog";
import { Modal } from "../../../components/ui/Modal";
import { BottomSheet } from "../../../components/ui/BottomSheet";
import { Pagination } from "../../../components/ui/Pagination";
import { useToast } from "../../../components/ui/Toast";

function BoxIcon() {
  return <Wrench className="h-6 w-6" weight="light" />;
}

function PencilIcon() {
  return <PencilSimple className="h-4 w-4" weight="light" />;
}

function MoreIcon() {
  return <DotsThreeVertical className="h-4 w-4" weight="regular" />;
}

function TrashIcon() {
  return <Trash className="h-4 w-4" weight="light" />;
}

/** Right-aligned "Move" button — opens the category picker sheet for a product. */
function MoveButton({ onClick, disabled }: { onClick: () => void; disabled: boolean }) {
  return (
    <button
      type="button"
      aria-label="Move to another category"
      onClick={onClick}
      disabled={disabled}
      className="flex h-9 items-center gap-1 rounded px-1.5 font-body text-[12px] font-medium text-graphite-500 hover:bg-graphite-100 disabled:opacity-40 dark:text-graphite-400 dark:hover:bg-graphite-800"
    >
      <FolderSimple className="h-4 w-4" weight="light" />
      Move
    </button>
  );
}

export function ProductsList() {
  const products = useAdminProducts();
  const categories = useAdminCategories();
  const { showToast } = useToast();
  const [pendingDelete, setPendingDelete] = useState<{ id: string; name: string } | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const [viewingId, setViewingId] = useState<string | null>(null);
  const viewingProduct = useAdminProduct(viewingId ?? undefined);

  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "inactive">("all");
  const [view, setView] = useState<"list" | "board">("list");
  const [movingId, setMovingId] = useState<string | null>(null);
  // Product currently showing its "Move to…" category-picker sheet.
  const [moveMenuProductId, setMoveMenuProductId] = useState<string | null>(null);

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

  const displayItems = pageItems;

  const moveProductToCategory = async (productId: string, categoryId: string) => {
    const product = allItems.find((p) => p.id === productId);
    setMoveMenuProductId(null);
    if (!product || product.categoryId === categoryId) return;
    setMovingId(productId);
    try {
      await updateProductCategory(productId, categoryId);
      products.refetch();
      showToast(`Moved "${product.name}" to ${categoryName(categoryId)}.`, "success");
    } catch {
      showToast("Couldn't move this product. Try again.", "danger");
    } finally {
      setMovingId(null);
    }
  };

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
      <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
        <h1 className="font-display text-[20px] font-bold text-ink dark:text-ink-inverted">
          Products
        </h1>
        <div className="flex items-center gap-2">
          <div className="inline-flex overflow-hidden rounded-lg border border-graphite-200 dark:border-graphite-800">
            <button
              type="button"
              aria-pressed={view === "list"}
              aria-label="List view"
              onClick={() => setView("list")}
              className={[
                "flex items-center gap-1.5 px-3 py-1.5 font-body text-[13px] font-medium transition-colors duration-150",
                view === "list"
                  ? "bg-ink text-ink-inverted dark:bg-ink-inverted dark:text-ink"
                  : "text-graphite-500 hover:bg-graphite-100 dark:text-graphite-400 dark:hover:bg-graphite-800",
              ].join(" ")}
            >
              <ListBullets className="h-4 w-4" weight={view === "list" ? "fill" : "regular"} aria-hidden="true" />
              <span className="hidden sm:inline">List</span>
            </button>
            <button
              type="button"
              aria-pressed={view === "board"}
              aria-label="Board view"
              onClick={() => setView("board")}
              className={[
                "flex items-center gap-1.5 border-l border-graphite-200 px-3 py-1.5 font-body text-[13px] font-medium transition-colors duration-150 dark:border-graphite-800",
                view === "board"
                  ? "bg-ink text-ink-inverted dark:bg-ink-inverted dark:text-ink"
                  : "text-graphite-500 hover:bg-graphite-100 dark:text-graphite-400 dark:hover:bg-graphite-800",
              ].join(" ")}
            >
              <SquaresFour className="h-4 w-4" weight={view === "board" ? "fill" : "regular"} aria-hidden="true" />
              <span className="hidden sm:inline">Board</span>
            </button>
          </div>
          <Link to="/admin/products/new">
            <Button size="sm"><Plus className="h-4 w-4" weight="regular" aria-hidden="true" />New product</Button>
          </Link>
        </div>
      </div>

      <div className="mb-4 flex flex-col gap-2 sm:flex-row">
        <SearchBar
          value={search}
          onChange={setSearch}
          placeholder="Search by name or category"
          aria-label="Search by name or category"
        />
        {view === "list" && (
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
        )}
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

      {view === "board" && products.status === "success" && allItems.length > 0 && (
        <ProductsBoard
          allItems={allItems}
          categoryList={categoryList}
          search={search}
          statusFilter={statusFilter}
          onRefetch={products.refetch}
          showToast={showToast}
          onDelete={(productId, name) => setPendingDelete({ id: productId, name })}
          onView={(productId) => setViewingId(productId)}
        />
      )}

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
              <Button size="sm"><Plus className="h-4 w-4" weight="regular" aria-hidden="true" />New product</Button>
            </Link>
          }
        />
      )}

      {view === "list" && products.status === "success" && allItems.length > 0 && items.length === 0 && (
        <EmptyState
          icon={<BoxIcon />}
          title="No products matched"
          description="Try a different search or filter."
        />
      )}

      {view === "list" && products.status === "success" && items.length > 0 && (
        <div className="space-y-2 sm:hidden">
          {displayItems.map((product, i) => (
            <Card key={product.id} className="p-3">
              <div className="flex items-center gap-3">
                <span className="w-5 flex-shrink-0 text-right font-body text-[12px] tabular-nums text-graphite-400">
                  {(page - 1) * pageSize + i + 1}
                </span>
                <button
                  type="button"
                  onClick={() => setViewingId(product.id)}
                  aria-label={`View details for ${product.name}`}
                  className="flex h-11 w-11 flex-shrink-0 items-center justify-center overflow-hidden rounded bg-graphite-100 dark:bg-graphite-800"
                >
                  {product.imageUrl ? (
                    <img src={product.imageUrl} alt="" className="h-full w-full object-cover" />
                  ) : (
                    <span className="font-display text-[14px] text-graphite-400">
                      {product.name.charAt(0)}
                    </span>
                  )}
                </button>
                <div className="min-w-0 flex-1">
                  <button
                    type="button"
                    onClick={() => setViewingId(product.id)}
                    className="block truncate text-left font-body text-[14px] font-medium text-ink hover:underline dark:text-ink-inverted"
                  >
                    {product.name}
                  </button>
                  <p className="truncate font-body text-[12px] text-graphite-400">
                    {categoryName(product.categoryId)} · {product.variantCount}{" "}
                    variant{product.variantCount === 1 ? "" : "s"}
                  </p>
                </div>
                <div className="flex flex-shrink-0 items-center gap-1">
                  <MoveButton onClick={() => setMoveMenuProductId(product.id)} disabled={movingId === product.id} />
                  <Link
                    to={`/admin/products/${product.id}/edit`}
                    aria-label={`Edit ${product.name}`}
                    className="flex h-9 w-9 items-center justify-center rounded text-graphite-500 hover:bg-graphite-100 dark:text-graphite-400 dark:hover:bg-graphite-800"
                  >
                    <PencilIcon />
                  </Link>
                  <button
                    type="button"
                    aria-label={`Delete ${product.name}`}
                    onClick={() => setPendingDelete({ id: product.id, name: product.name })}
                    className="flex h-9 w-9 items-center justify-center rounded text-state-danger-text hover:bg-graphite-100 dark:text-state-danger-text-dark dark:hover:bg-graphite-800"
                  >
                    <TrashIcon />
                  </button>
                </div>
              </div>
              <div className="mt-2 flex flex-wrap items-center gap-1.5 pl-8">
                {product.isFeatured && <StatusBadge label="Featured" tone="info" />}
                <StatusBadge
                  label={product.isActive ? "Active" : "Inactive"}
                  tone={product.isActive ? "success" : "neutral"}
                />
              </div>
            </Card>
          ))}
        </div>
      )}

      {view === "list" && products.status === "success" && items.length > 0 && (
        <Card className="hidden overflow-x-auto sm:block">
          <table className="w-full min-w-[860px] border-collapse">
            <thead>
              <tr className="border-b border-graphite-200 dark:border-graphite-800">
                <th className="px-4 py-3 text-right font-body text-[11px] font-semibold uppercase tracking-wide text-graphite-400">
                  S.No
                </th>
                <th className="px-4 py-3 text-left font-body text-[11px] font-semibold uppercase tracking-wide text-graphite-400">
                  Product
                </th>
                <th className="px-4 py-3 text-left font-body text-[11px] font-semibold uppercase tracking-wide text-graphite-400">
                  Category
                </th>
                <th className="px-4 py-3 text-left font-body text-[11px] font-semibold uppercase tracking-wide text-graphite-400">
                  Variants
                </th>
                <th className="px-4 py-3 text-left font-body text-[11px] font-semibold uppercase tracking-wide text-graphite-400">
                  Flags
                </th>
                <th className="px-4 py-3 text-left font-body text-[11px] font-semibold uppercase tracking-wide text-graphite-400">
                  Status
                </th>
                <th className="px-4 py-3 text-right font-body text-[11px] font-semibold uppercase tracking-wide text-graphite-400">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {displayItems.map((product, i) => (
                <tr
                  key={product.id}
                  className="border-b border-graphite-100 last:border-b-0 hover:bg-graphite-50 dark:border-graphite-800 dark:hover:bg-graphite-900/60"
                >
                  <td className="px-4 py-4 align-middle text-right font-body text-[13px] tabular-nums text-graphite-400">
                    {(page - 1) * pageSize + i + 1}
                  </td>
                  <td className="max-w-[260px] px-4 py-4 align-middle">
                    <div className="flex min-w-0 items-center gap-3">
                      <button
                        type="button"
                        onClick={() => setViewingId(product.id)}
                        aria-label={`View details for ${product.name}`}
                        className="flex h-9 w-9 flex-shrink-0 items-center justify-center overflow-hidden rounded bg-graphite-100 dark:bg-graphite-800"
                      >
                        {product.imageUrl ? (
                          <img src={product.imageUrl} alt="" className="h-full w-full object-cover" />
                        ) : (
                          <span className="font-display text-[13px] text-graphite-400">
                            {product.name.charAt(0)}
                          </span>
                        )}
                      </button>
                      <button
                        type="button"
                        onClick={() => setViewingId(product.id)}
                        className="truncate text-left font-body text-[14px] font-medium text-ink hover:underline dark:text-ink-inverted"
                      >
                        {product.name}
                      </button>
                    </div>
                  </td>
                  <td className="px-4 py-4 align-middle font-body text-[13px] text-graphite-500 dark:text-graphite-400">
                    {categoryName(product.categoryId)}
                  </td>
                  <td className="px-4 py-4 align-middle font-body text-[13px] text-graphite-500 dark:text-graphite-400">
                    {product.variantCount}
                  </td>
                  <td className="px-4 py-4 align-middle">
                    {product.isFeatured ? (
                      <StatusBadge label="Featured" tone="info" />
                    ) : (
                      <span className="font-body text-[13px] text-graphite-300 dark:text-graphite-700">—</span>
                    )}
                  </td>
                  <td className="px-4 py-4 align-middle">
                    <StatusBadge
                      label={product.isActive ? "Active" : "Inactive"}
                      tone={product.isActive ? "success" : "neutral"}
                    />
                  </td>
                  <td className="px-4 py-4 align-middle">
                    <div className="flex items-center justify-end gap-2">
                      <MoveButton
                        onClick={() => setMoveMenuProductId(product.id)}
                        disabled={movingId === product.id}
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
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      )}

      {view === "list" && (
        <Pagination
          page={page}
          pageCount={pageCount}
          onPageChange={setPage}
          totalCount={totalCount}
          pageSize={pageSize}
        />
      )}

      <ConfirmDialog
        open={!!pendingDelete}
        title="Delete product?"
        description={pendingDelete ? `"${pendingDelete.name}" and its variants will be permanently removed.` : undefined}
        onConfirm={handleDelete}
        onCancel={() => setPendingDelete(null)}
        loading={deleting}
      />

      <Modal open={!!viewingId} onClose={() => setViewingId(null)} title="Product details">
        {viewingProduct.status === "loading" && (
          <div className="space-y-2">
            <Skeleton className="h-16 w-16 rounded" />
            <Skeleton className="h-4 w-2/3" />
            <Skeleton className="h-4 w-1/2" />
          </div>
        )}

        {viewingProduct.status === "error" && (
          <p className="font-body text-[13px] text-state-danger-text dark:text-state-danger-text-dark">
            Couldn't load this product.
          </p>
        )}

        {viewingProduct.status === "success" && viewingProduct.data && (
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <span className="flex h-16 w-16 flex-shrink-0 items-center justify-center overflow-hidden rounded bg-graphite-100 dark:bg-graphite-800">
                {viewingProduct.data.imageUrl ? (
                  <img src={viewingProduct.data.imageUrl} alt="" className="h-full w-full object-cover" />
                ) : (
                  <span className="font-display text-[18px] text-graphite-400">
                    {viewingProduct.data.name.charAt(0)}
                  </span>
                )}
              </span>
              <div className="min-w-0">
                <p className="truncate font-body text-[15px] font-semibold text-ink dark:text-ink-inverted">
                  {viewingProduct.data.name}
                </p>
                <p className="truncate font-body text-[12px] text-graphite-400">
                  {categoryName(viewingProduct.data.categoryId)}
                </p>
                <div className="mt-1 flex items-center gap-1.5">
                  {viewingProduct.data.isFeatured && <StatusBadge label="Featured" tone="info" />}
                  <StatusBadge
                    label={viewingProduct.data.isActive ? "Active" : "Inactive"}
                    tone={viewingProduct.data.isActive ? "success" : "neutral"}
                  />
                </div>
              </div>
            </div>

            {viewingProduct.data.description && (
              <p className="font-body text-[13px] text-graphite-600 dark:text-graphite-300">
                {viewingProduct.data.description}
              </p>
            )}

            {viewingProduct.data.variants.length > 0 && (
              <div className="space-y-1.5">
                <p className="font-body text-[12px] font-medium text-graphite-500">Sizes / variants</p>
                <div className="divide-y divide-graphite-100 rounded border border-graphite-200 dark:divide-graphite-800 dark:border-graphite-800">
                  {viewingProduct.data.variants.map((v, i) => (
                    <div
                      key={v.id ?? i}
                      className="flex items-center justify-between gap-2 px-3 py-2 font-mono text-[12.5px] text-ink dark:text-ink-inverted"
                    >
                      <span className="truncate">
                        {v.label}
                        {!v.isActive && <span className="ml-1 text-graphite-400">(inactive)</span>}
                      </span>
                      <span className="flex-shrink-0">
                        {formatCurrency(v.dailyRate)}/day · {v.quantityTotal} qty
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="flex gap-2 pt-1">
              <Link to={`/admin/products/${viewingProduct.data.id}/edit`} className="flex-1">
                <Button variant="secondary" fullWidth onClick={() => setViewingId(null)}>
                  Edit
                </Button>
              </Link>
              <Button
                variant="ghost"
                fullWidth
                className="flex-1 text-state-danger-text dark:text-state-danger-text-dark"
                onClick={() => {
                  const data = viewingProduct.data!;
                  setViewingId(null);
                  setPendingDelete({ id: data.id, name: data.name });
                }}
              >
                Delete
              </Button>
            </div>
          </div>
        )}
      </Modal>

      <BottomSheet
        open={moveMenuProductId !== null}
        onClose={() => setMoveMenuProductId(null)}
        title={
          moveMenuProductId
            ? `Move "${allItems.find((p) => p.id === moveMenuProductId)?.name ?? ""}" to…`
            : undefined
        }
      >
        <div className="flex flex-col gap-0.5">
          {categoryList.map((category) => {
            const product = moveMenuProductId ? allItems.find((p) => p.id === moveMenuProductId) : undefined;
            const isCurrent = product?.categoryId === category.id;
            return (
              <button
                key={category.id}
                type="button"
                disabled={isCurrent || !!movingId}
                onClick={() => moveMenuProductId && moveProductToCategory(moveMenuProductId, category.id)}
                className={[
                  "flex items-center justify-between rounded-lg px-3 py-2.5 text-left font-body text-[14px]",
                  isCurrent
                    ? "text-graphite-300 dark:text-graphite-700"
                    : "text-ink hover:bg-graphite-100 dark:text-ink-inverted dark:hover:bg-graphite-800",
                ].join(" ")}
              >
                {category.name}
                {isCurrent && <Check className="h-4 w-4" weight="bold" />}
              </button>
            );
          })}
        </div>
      </BottomSheet>
    </div>
  );
}
