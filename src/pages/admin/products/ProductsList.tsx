import {
  CaretDown,
  CaretUp,
  DotsSixVertical,
  DotsThreeVertical,
  PencilSimple,
  Plus,
  Wrench,
} from "@phosphor-icons/react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { useAdminProducts, useAdminCategories, useAdminProduct } from "../../../hooks/useAdminData";
import { usePagination } from "../../../hooks/usePagination";
import {
  deleteProduct,
  updateProductsSortOrder,
  type AdminProductListItem,
} from "../../../services/admin-products.service";
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

// Long-press must clearly beat an ordinary tap/scroll gesture before a drag
// starts, and a small amount of finger jitter shouldn't cancel it early.
const LONG_PRESS_MS = 350;
const PRE_PRESS_CANCEL_PX = 8;

/**
 * Press-and-hold drag handle — an alternative to the up/down arrows for
 * reordering several rows quickly. Only wired up in natural (unfiltered,
 * unsearched) order, same restriction as ReorderControls.
 */
function DragHandle({
  onPointerDown,
  dragging,
  disabled,
}: {
  onPointerDown: (e: React.PointerEvent) => void;
  dragging: boolean;
  disabled: boolean;
}) {
  return (
    <button
      type="button"
      aria-label="Drag to reorder (press and hold, then move)"
      title="Press and hold to drag"
      onPointerDown={onPointerDown}
      onContextMenu={(e) => e.preventDefault()}
      disabled={disabled}
      className={[
        "flex h-6 w-5 flex-shrink-0 touch-none select-none items-center justify-center rounded",
        "text-graphite-300 disabled:opacity-25",
        dragging
          ? "cursor-grabbing text-graphite-700 dark:text-graphite-100"
          : "cursor-grab hover:text-graphite-500 dark:hover:text-graphite-300",
      ].join(" ")}
    >
      <DotsSixVertical className="h-4 w-4" weight="bold" />
    </button>
  );
}

/** Up/down arrow pair for reordering a row — used in both the mobile card and desktop table layouts. */
function ReorderControls({
  onMoveUp,
  onMoveDown,
  disableUp,
  disableDown,
  busy,
}: {
  onMoveUp: () => void;
  onMoveDown: () => void;
  disableUp: boolean;
  disableDown: boolean;
  busy: boolean;
}) {
  return (
    <div className="flex flex-shrink-0 flex-col">
      <button
        type="button"
        aria-label="Move up"
        onClick={onMoveUp}
        disabled={busy || disableUp}
        className="flex h-4 w-5 items-center justify-center text-graphite-400 hover:text-ink disabled:opacity-25 disabled:hover:text-graphite-400 dark:hover:text-ink-inverted dark:disabled:hover:text-graphite-400"
      >
        <CaretUp className="h-3 w-3" weight="bold" />
      </button>
      <button
        type="button"
        aria-label="Move down"
        onClick={onMoveDown}
        disabled={busy || disableDown}
        className="flex h-4 w-5 items-center justify-center text-graphite-400 hover:text-ink disabled:opacity-25 disabled:hover:text-graphite-400 dark:hover:text-ink-inverted dark:disabled:hover:text-graphite-400"
      >
        <CaretDown className="h-3 w-3" weight="bold" />
      </button>
    </div>
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
  const [reorderingId, setReorderingId] = useState<string | null>(null);
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [dragOrderIds, setDragOrderIds] = useState<string[] | null>(null);
  const dragSessionRef = useRef<{ pointerId: number; timer: ReturnType<typeof setTimeout> | null } | null>(
    null,
  );

  const allItems = products.status === "success" ? products.data : [];
  const categoryList = categories.status === "success" ? categories.data : [];

  // `allItems` is already fetched in sort_order/created_at order — the same
  // order the storefront home page uses — so the S.No shown here already
  // *is* the sort order; there's no separate field to hand-edit. This map
  // gives O(1) lookup of a product's position in that true (unfiltered,
  // unpaginated) order, so Move up/down still finds the right neighbour
  // even when the list is filtered, searched, or paginated.
  const orderIndex = useMemo(() => new Map(allItems.map((p, i) => [p.id, i])), [allItems]);
  // Reordering swaps positions in the *true* order above. If the list is
  // filtered or searched, the row shown directly above/below on screen
  // isn't necessarily the true neighbour, so we only offer the controls
  // when viewing the full, unfiltered list.
  const naturalOrder = !search.trim() && categoryFilter === "all" && statusFilter === "all";

  const handleMove = async (id: string, direction: "up" | "down") => {
    if (reorderingId) return;
    const index = orderIndex.get(id);
    if (index === undefined) return;
    const swapWith = direction === "up" ? index - 1 : index + 1;
    if (swapWith < 0 || swapWith >= allItems.length) return;

    const reordered = allItems.slice();
    [reordered[index], reordered[swapWith]] = [reordered[swapWith], reordered[index]];

    // Renumber sequentially and only push rows whose sort_order actually
    // changes. Must compare each row's new position against *that row's
    // own* previous sort_order (p.sortOrder) — not against whatever value
    // used to sit at that array index. Once sort_order values are unique,
    // a swap makes both rows' new values equal the old value that used to
    // occupy their new slot, so an index-based comparison filters out both
    // real changes and no update ever reaches the database. Most products
    // share sort_order 0 until the first reorder, so this also resolves
    // that tie for the whole list, not just the pair being swapped — see
    // updateProductsSortOrder's docstring.
    const changes = reordered
      .map((p, i) => ({ id: p.id, sortOrder: i, prevSortOrder: p.sortOrder }))
      .filter((change) => change.sortOrder !== change.prevSortOrder)
      .map(({ id, sortOrder }) => ({ id, sortOrder }));
    if (changes.length === 0) return;

    setReorderingId(id);
    try {
      await updateProductsSortOrder(changes);
      products.refetch();
    } catch {
      showToast("Couldn't reorder products. Try again.", "danger");
    } finally {
      setReorderingId(null);
    }
  };

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

  // --- Long-press drag reordering (alternative to the up/down arrows) ---
  // `dragOrderIds` holds the *visual* order of the current page's rows
  // while a drag is in progress; it's local-only until drop, when it's
  // translated back into full-list sort_order changes and persisted the
  // same way handleMove does.
  const pageItemsById = useMemo(() => new Map(pageItems.map((p) => [p.id, p])), [pageItems]);
  const displayItems: AdminProductListItem[] = dragOrderIds
    ? (dragOrderIds.map((id) => pageItemsById.get(id)).filter(Boolean) as AdminProductListItem[])
    : pageItems;

  const finishDrag = useCallback(
    async (commit: boolean) => {
      dragSessionRef.current = null;
      document.body.style.removeProperty("user-select");
      const finalOrderIds = dragOrderIds;
      const draggedId = draggingId;
      setDraggingId(null);
      setDragOrderIds(null);
      if (!commit || !finalOrderIds || !draggedId) return;

      const originalIds = pageItems.map((p) => p.id);
      if (finalOrderIds.join(",") === originalIds.join(",")) return;

      const idToProduct = new Map(pageItems.map((p) => [p.id, p]));
      const newSlice = finalOrderIds.map((id) => idToProduct.get(id)).filter(Boolean) as AdminProductListItem[];
      if (newSlice.length !== pageItems.length) return;

      const offset = (page - 1) * pageSize;
      const newFullOrder = allItems.slice();
      newFullOrder.splice(offset, newSlice.length, ...newSlice);

      const changes = newFullOrder
        .map((p, i) => ({ id: p.id, sortOrder: i, prevSortOrder: p.sortOrder }))
        .filter((change) => change.sortOrder !== change.prevSortOrder)
        .map(({ id, sortOrder }) => ({ id, sortOrder }));
      if (changes.length === 0) return;

      setReorderingId(draggedId);
      try {
        await updateProductsSortOrder(changes);
        products.refetch();
      } catch {
        showToast("Couldn't reorder products. Try again.", "danger");
      } finally {
        setReorderingId(null);
      }
    },
    [dragOrderIds, draggingId, page, pageSize, pageItems, allItems, products, showToast],
  );

  // Active drag: track pointer movement globally (the pointer travels well
  // outside the handle itself) and swap the hovered row into the dragged
  // row's slot as soon as they differ.
  useEffect(() => {
    if (!draggingId) return;

    const handlePointerMove = (e: PointerEvent) => {
      const el = document.elementFromPoint(e.clientX, e.clientY);
      const overId = el?.closest<HTMLElement>("[data-drag-id]")?.getAttribute("data-drag-id");
      if (!overId) return;
      setDragOrderIds((current) => {
        if (!current) return current;
        const from = current.indexOf(draggingId);
        const to = current.indexOf(overId);
        if (from === -1 || to === -1 || from === to) return current;
        const next = current.slice();
        const [moved] = next.splice(from, 1);
        next.splice(to, 0, moved);
        return next;
      });
    };
    const handlePointerUp = () => finishDrag(true);
    const handlePointerCancel = () => finishDrag(false);

    window.addEventListener("pointermove", handlePointerMove);
    window.addEventListener("pointerup", handlePointerUp);
    window.addEventListener("pointercancel", handlePointerCancel);
    return () => {
      window.removeEventListener("pointermove", handlePointerMove);
      window.removeEventListener("pointerup", handlePointerUp);
      window.removeEventListener("pointercancel", handlePointerCancel);
    };
  }, [draggingId, finishDrag]);

  // Pending press: waits out LONG_PRESS_MS before a drag actually starts,
  // so a normal tap or a scroll gesture that starts on the handle doesn't
  // get hijacked.
  const handleDragHandlePointerDown = (e: React.PointerEvent, id: string) => {
    if (!naturalOrder || reorderingId) return;
    e.preventDefault();
    const startX = e.clientX;
    const startY = e.clientY;
    const pointerId = e.pointerId;

    const cancelPending = () => {
      window.removeEventListener("pointermove", onPreMove);
      window.removeEventListener("pointerup", onPreUp);
      if (dragSessionRef.current?.timer) clearTimeout(dragSessionRef.current.timer);
      dragSessionRef.current = null;
    };
    const onPreMove = (ev: PointerEvent) => {
      if (Math.hypot(ev.clientX - startX, ev.clientY - startY) > PRE_PRESS_CANCEL_PX) {
        cancelPending();
      }
    };
    const onPreUp = () => cancelPending();

    window.addEventListener("pointermove", onPreMove);
    window.addEventListener("pointerup", onPreUp);

    const timer = setTimeout(() => {
      window.removeEventListener("pointermove", onPreMove);
      window.removeEventListener("pointerup", onPreUp);
      dragSessionRef.current = { pointerId, timer: null };
      document.body.style.setProperty("user-select", "none");
      if (typeof navigator !== "undefined" && navigator.vibrate) navigator.vibrate(12);
      setDraggingId(id);
      setDragOrderIds(pageItems.map((p) => p.id));
    }, LONG_PRESS_MS);

    dragSessionRef.current = { pointerId, timer };
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
      <div className="mb-4 flex items-center justify-between">
        <h1 className="font-display text-[20px] font-bold text-ink dark:text-ink-inverted">
          Products
        </h1>
        <Link to="/admin/products/new">
          <Button size="sm"><Plus className="h-4 w-4" weight="regular" aria-hidden="true" />New product</Button>
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

      {!naturalOrder && products.status === "success" && allItems.length > 0 && (
        <p className="mb-3 font-body text-[12px] text-graphite-400">
          Clear the search and filters to reorder products — this is also the order they'll appear in on the home page.
        </p>
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

      {products.status === "success" && allItems.length > 0 && items.length === 0 && (
        <EmptyState
          icon={<BoxIcon />}
          title="No products matched"
          description="Try a different search or filter."
        />
      )}

      {products.status === "success" && items.length > 0 && (
        <div className="space-y-2 sm:hidden">
          {displayItems.map((product, i) => (
            <Card
              key={product.id}
              data-drag-id={naturalOrder ? product.id : undefined}
              className={[
                "p-3 transition-opacity duration-100",
                draggingId === product.id ? "opacity-50" : "",
              ].join(" ")}
            >
              <div className="flex items-center gap-3">
                <span className="w-5 flex-shrink-0 text-right font-body text-[12px] tabular-nums text-graphite-400">
                  {(page - 1) * pageSize + i + 1}
                </span>
                {naturalOrder && (
                  <div className="flex flex-shrink-0 items-center gap-1">
                    <DragHandle
                      onPointerDown={(e) => handleDragHandlePointerDown(e, product.id)}
                      dragging={draggingId === product.id}
                      disabled={!!reorderingId}
                    />
                    <ReorderControls
                      onMoveUp={() => handleMove(product.id, "up")}
                      onMoveDown={() => handleMove(product.id, "down")}
                      disableUp={orderIndex.get(product.id) === 0}
                      disableDown={orderIndex.get(product.id) === allItems.length - 1}
                      busy={reorderingId === product.id}
                    />
                  </div>
                )}
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
                <div className="relative flex-shrink-0">
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
                        <Link
                          to={`/admin/products/${product.id}/edit`}
                          onClick={() => setOpenMenuId(null)}
                          className="block w-full px-3 py-2 text-left font-body text-[13px] font-medium text-ink hover:bg-graphite-100 dark:text-ink-inverted dark:hover:bg-graphite-800"
                        >
                          Edit
                        </Link>
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

      {products.status === "success" && items.length > 0 && (
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
                  data-drag-id={naturalOrder ? product.id : undefined}
                  className={[
                    "border-b border-graphite-100 last:border-b-0 hover:bg-graphite-50 dark:border-graphite-800 dark:hover:bg-graphite-900/60",
                    "transition-opacity duration-100",
                    draggingId === product.id ? "opacity-50" : "",
                  ].join(" ")}
                >
                  <td className="px-4 py-4 align-middle">
                    <div className="flex items-center justify-end gap-2">
                      {naturalOrder && (
                        <DragHandle
                          onPointerDown={(e) => handleDragHandlePointerDown(e, product.id)}
                          dragging={draggingId === product.id}
                          disabled={!!reorderingId}
                        />
                      )}
                      {naturalOrder && (
                        <ReorderControls
                          onMoveUp={() => handleMove(product.id, "up")}
                          onMoveDown={() => handleMove(product.id, "down")}
                          disableUp={orderIndex.get(product.id) === 0}
                          disableDown={orderIndex.get(product.id) === allItems.length - 1}
                          busy={reorderingId === product.id}
                        />
                      )}
                      <span className="font-body text-[13px] tabular-nums text-graphite-400">
                        {(page - 1) * pageSize + i + 1}
                      </span>
                    </div>
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
    </div>
  );
}
