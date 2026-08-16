import { Check, DotsSixVertical, FolderSimple, PencilSimple, Trash } from "@phosphor-icons/react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Link } from "react-router-dom";
import {
  updateProductCategory,
  updateProductsSortOrder,
  type AdminProductListItem,
} from "../../../services/admin-products.service";
import type { AdminCategory } from "../../../services/admin-categories.service";
import { Card } from "../../../components/ui/Card";
import { StatusBadge } from "../../../components/ui/StatusBadge";
import { BottomSheet } from "../../../components/ui/BottomSheet";

// How close the pointer needs to get to a column's edge (px, measured from
// the scroll container's own edge) before we start auto-scrolling it. Only
// relevant while a drag is active — this is what makes "drag card 4
// categories over" possible at all, since without it the columns you can't
// see are simply unreachable by drag.
const EDGE_SCROLL_ZONE_PX = 56;
const EDGE_SCROLL_MAX_SPEED = 14;

// Same long-press timing as the list view's drag handle (ProductsList.tsx) —
// kept identical so the two views feel consistent, and mobile touch scrolls
// aren't hijacked by an accidental short tap on the handle.
const LONG_PRESS_MS = 350;
const PRE_PRESS_CANCEL_PX = 8;

type Columns = Record<string, string[]>;

interface ProductsBoardProps {
  /** Full, unfiltered, unpaginated product list in current sort_order. */
  allItems: AdminProductListItem[];
  /** Categories in their own display order — becomes the column order. */
  categoryList: AdminCategory[];
  search: string;
  statusFilter: "all" | "active" | "inactive";
  onRefetch: () => void;
  showToast: (message: string, tone?: "default" | "success" | "danger") => void;
  onDelete: (productId: string, productName: string) => void;
  onView: (productId: string) => void;
}

/**
 * Kanban-style alternative to the products table/card list: one column per
 * category, cards draggable both within a column (reorders `sort_order`)
 * and across columns (moves the product to that category). Works the same
 * way on mobile as on desktop — columns scroll horizontally with snap
 * points, and dragging uses long-press + Pointer Events (not HTML5 drag,
 * which doesn't fire reliably on touch), mirroring ProductsList's existing
 * long-press reorder handle.
 */
export function ProductsBoard({
  allItems,
  categoryList,
  search,
  statusFilter,
  onRefetch,
  showToast,
  onDelete,
  onView,
}: ProductsBoardProps) {
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [liveColumns, setLiveColumns] = useState<Columns | null>(null);
  const [busy, setBusy] = useState(false);
  const [dragPos, setDragPos] = useState<{ x: number; y: number } | null>(null);
  const [dropTarget, setDropTarget] = useState<{ columnId: string; cardId: string | null } | null>(null);
  // Product currently showing its "Move to…" sheet — the no-drag path for
  // jumping a card straight to a category, which is the main affordance now
  // (dragging several columns over, especially on mobile, is unreliable no
  // matter how good the auto-scroll/preview get).
  const [moveMenuProductId, setMoveMenuProductId] = useState<string | null>(null);
  const dragSessionRef = useRef<{ pointerId: number; timer: ReturnType<typeof setTimeout> | null } | null>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const draggedProductRef = useRef<AdminProductListItem | null>(null);
  const autoScrollFrameRef = useRef<number | null>(null);
  const autoScrollSpeedRef = useRef(0);

  const itemsById = useMemo(() => new Map(allItems.map((p) => [p.id, p])), [allItems]);

  const filteredItems = useMemo(() => {
    const q = search.trim().toLowerCase();
    return allItems.filter((product) => {
      if (statusFilter === "active" && !product.isActive) return false;
      if (statusFilter === "inactive" && product.isActive) return false;
      if (!q) return true;
      const categoryName = categoryList.find((c) => c.id === product.categoryId)?.name ?? "";
      return product.name.toLowerCase().includes(q) || categoryName.toLowerCase().includes(q);
    });
  }, [allItems, search, statusFilter, categoryList]);

  // Dragging swaps positions in the true (unfiltered, unsearched) order and
  // renumbers sort_order globally, same as ProductsList.handleMove — so, to
  // avoid silently dropping hidden rows out of that order, dragging is only
  // wired up when nothing is filtered/searched. Matches the equivalent
  // `naturalOrder` gate in ProductsList.
  const naturalOrder = !search.trim() && statusFilter === "all";

  const staticColumns = useMemo<Columns>(() => {
    const map: Columns = {};
    for (const c of categoryList) map[c.id] = [];
    for (const product of filteredItems) {
      if (!map[product.categoryId]) map[product.categoryId] = [];
      map[product.categoryId].push(product.id);
    }
    return map;
  }, [filteredItems, categoryList]);

  const displayColumns = liveColumns ?? staticColumns;

  const stopAutoScroll = useCallback(() => {
    autoScrollSpeedRef.current = 0;
    if (autoScrollFrameRef.current !== null) {
      cancelAnimationFrame(autoScrollFrameRef.current);
      autoScrollFrameRef.current = null;
    }
  }, []);

  const finishDrag = useCallback(
    async (commit: boolean) => {
      dragSessionRef.current = null;
      document.body.style.removeProperty("user-select");
      stopAutoScroll();
      const finalColumns = liveColumns;
      const draggedId = draggingId;
      setDraggingId(null);
      setLiveColumns(null);
      setDragPos(null);
      setDropTarget(null);
      draggedProductRef.current = null;
      if (!commit || !finalColumns || !draggedId) return;

      const draggedProduct = itemsById.get(draggedId);
      if (!draggedProduct) return;

      const newCategoryId = Object.keys(finalColumns).find((cid) => finalColumns[cid].includes(draggedId));
      const categoryChanged = !!newCategoryId && newCategoryId !== draggedProduct.categoryId;

      const newFullOrder = categoryList
        .flatMap((c) => finalColumns[c.id] ?? [])
        .map((id) => itemsById.get(id))
        .filter((p): p is AdminProductListItem => !!p);

      const changes = newFullOrder
        .map((p, i) => ({ id: p.id, sortOrder: i, prevSortOrder: p.sortOrder }))
        .filter((change) => change.sortOrder !== change.prevSortOrder)
        .map(({ id, sortOrder }) => ({ id, sortOrder }));

      if (!categoryChanged && changes.length === 0) return;

      setBusy(true);
      try {
        if (categoryChanged && newCategoryId) {
          await updateProductCategory(draggedId, newCategoryId);
        }
        if (changes.length > 0) {
          await updateProductsSortOrder(changes);
        }
        onRefetch();
      } catch {
        showToast("Couldn't move this product. Try again.", "danger");
      } finally {
        setBusy(false);
      }
    },
    [liveColumns, draggingId, categoryList, itemsById, onRefetch, showToast, stopAutoScroll],
  );

  useEffect(() => {
    if (!draggingId) return;

    const runAutoScroll = () => {
      const container = scrollContainerRef.current;
      if (container && autoScrollSpeedRef.current !== 0) {
        container.scrollLeft += autoScrollSpeedRef.current;
      }
      autoScrollFrameRef.current = requestAnimationFrame(runAutoScroll);
    };

    const handlePointerMove = (e: PointerEvent) => {
      setDragPos({ x: e.clientX, y: e.clientY });

      // Edge auto-scroll: speed ramps up the closer the pointer gets to the
      // scroll container's left/right edge, so a card can be dragged from
      // column 1 to column 4 without the target column ever needing to
      // already be on-screen.
      const container = scrollContainerRef.current;
      if (container) {
        const rect = container.getBoundingClientRect();
        const distFromLeft = e.clientX - rect.left;
        const distFromRight = rect.right - e.clientX;
        if (distFromLeft < EDGE_SCROLL_ZONE_PX && distFromLeft > -40) {
          const strength = 1 - Math.max(distFromLeft, 0) / EDGE_SCROLL_ZONE_PX;
          autoScrollSpeedRef.current = -strength * EDGE_SCROLL_MAX_SPEED;
        } else if (distFromRight < EDGE_SCROLL_ZONE_PX && distFromRight > -40) {
          const strength = 1 - Math.max(distFromRight, 0) / EDGE_SCROLL_ZONE_PX;
          autoScrollSpeedRef.current = strength * EDGE_SCROLL_MAX_SPEED;
        } else {
          autoScrollSpeedRef.current = 0;
        }
      }

      const el = document.elementFromPoint(e.clientX, e.clientY);
      const overColumnId = el?.closest<HTMLElement>("[data-col-id]")?.getAttribute("data-col-id");
      if (!overColumnId) {
        setDropTarget(null);
        return;
      }
      const overCardId = el?.closest<HTMLElement>("[data-card-id]")?.getAttribute("data-card-id") ?? null;
      setDropTarget({ columnId: overColumnId, cardId: overCardId === draggingId ? null : overCardId });

      setLiveColumns((current) => {
        if (!current) return current;
        let fromColumnId: string | null = null;
        let fromIndex = -1;
        for (const cid of Object.keys(current)) {
          const idx = current[cid].indexOf(draggingId);
          if (idx !== -1) {
            fromColumnId = cid;
            fromIndex = idx;
            break;
          }
        }
        if (fromColumnId === null) return current;

        const next: Columns = {};
        for (const cid of Object.keys(current)) next[cid] = current[cid].slice();
        next[fromColumnId].splice(fromIndex, 1);

        let toIndex = next[overColumnId]?.length ?? 0;
        if (overCardId && overCardId !== draggingId) {
          const idx = next[overColumnId].indexOf(overCardId);
          if (idx !== -1) toIndex = idx;
        }
        next[overColumnId].splice(toIndex, 0, draggingId);

        if (fromColumnId === overColumnId && fromIndex === toIndex) return current;
        return next;
      });
    };
    const handlePointerUp = () => finishDrag(true);
    const handlePointerCancel = () => finishDrag(false);

    autoScrollFrameRef.current = requestAnimationFrame(runAutoScroll);
    window.addEventListener("pointermove", handlePointerMove);
    window.addEventListener("pointerup", handlePointerUp);
    window.addEventListener("pointercancel", handlePointerCancel);
    return () => {
      window.removeEventListener("pointermove", handlePointerMove);
      window.removeEventListener("pointerup", handlePointerUp);
      window.removeEventListener("pointercancel", handlePointerCancel);
      if (autoScrollFrameRef.current !== null) cancelAnimationFrame(autoScrollFrameRef.current);
      autoScrollFrameRef.current = null;
      autoScrollSpeedRef.current = 0;
    };
  }, [draggingId, finishDrag]);

  const handleHandlePointerDown = (e: React.PointerEvent, id: string) => {
    if (!naturalOrder || busy) return;
    e.preventDefault();
    const startX = e.clientX;
    const startY = e.clientY;

    const cancelPending = () => {
      window.removeEventListener("pointermove", onPreMove);
      window.removeEventListener("pointerup", onPreUp);
      if (dragSessionRef.current?.timer) clearTimeout(dragSessionRef.current.timer);
      dragSessionRef.current = null;
    };
    const onPreMove = (ev: PointerEvent) => {
      if (Math.hypot(ev.clientX - startX, ev.clientY - startY) > PRE_PRESS_CANCEL_PX) cancelPending();
    };
    const onPreUp = () => cancelPending();

    window.addEventListener("pointermove", onPreMove);
    window.addEventListener("pointerup", onPreUp);

    const timer = setTimeout(() => {
      window.removeEventListener("pointermove", onPreMove);
      window.removeEventListener("pointerup", onPreUp);
      dragSessionRef.current = { pointerId: e.pointerId, timer: null };
      document.body.style.setProperty("user-select", "none");
      if (typeof navigator !== "undefined" && navigator.vibrate) navigator.vibrate(12);
      draggedProductRef.current = itemsById.get(id) ?? null;
      setDragPos({ x: startX, y: startY });
      setDraggingId(id);
      setLiveColumns(staticColumns);
    }, LONG_PRESS_MS);

    dragSessionRef.current = { pointerId: e.pointerId, timer };
  };

  const moveProductToCategory = useCallback(
    async (productId: string, categoryId: string) => {
      const product = itemsById.get(productId);
      setMoveMenuProductId(null);
      if (!product || product.categoryId === categoryId) return;
      setBusy(true);
      try {
        await updateProductCategory(productId, categoryId);
        onRefetch();
        const categoryName = categoryList.find((c) => c.id === categoryId)?.name ?? "category";
        showToast(`Moved "${product.name}" to ${categoryName}.`, "success");
      } catch {
        showToast("Couldn't move this product. Try again.", "danger");
      } finally {
        setBusy(false);
      }
    },
    [itemsById, categoryList, onRefetch, showToast],
  );

  return (
    <div className="space-y-2">
      {!naturalOrder && (
        <p className="font-body text-[12px] text-graphite-400">
          Clear the search and status filter to reorder by dragging, or use each card's "Move" button to change its
          category.
        </p>
      )}
      <div
        ref={scrollContainerRef}
        className="flex snap-x snap-mandatory gap-3 overflow-x-auto pb-3 sm:snap-none"
      >
        {categoryList.map((category) => {
          const ids = displayColumns[category.id] ?? [];
          const isDropColumn = draggingId !== null && dropTarget?.columnId === category.id;
          return (
            <div
              key={category.id}
              data-col-id={category.id}
              className={[
                "flex w-[82vw] max-w-[300px] flex-shrink-0 snap-start flex-col rounded-lg border bg-graphite-50/60 transition-colors duration-100 dark:bg-graphite-900/40 sm:w-72",
                isDropColumn
                  ? "border-accent-500 ring-2 ring-accent-500/30"
                  : "border-graphite-200 dark:border-graphite-800",
              ].join(" ")}
            >
              <div className="flex items-center justify-between border-b border-graphite-200 px-3 py-2.5 dark:border-graphite-800">
                <p className="truncate font-body text-[13px] font-semibold text-ink dark:text-ink-inverted">
                  {category.name}
                </p>
                <span className="flex-shrink-0 rounded-full bg-graphite-200 px-1.5 py-0.5 font-body text-[11px] font-medium text-graphite-600 dark:bg-graphite-800 dark:text-graphite-300">
                  {ids.length}
                </span>
              </div>

              <div className="flex min-h-[96px] flex-1 flex-col gap-2 p-2">
                {ids.length === 0 && (
                  <p className="px-1 py-6 text-center font-body text-[12px] text-graphite-300 dark:text-graphite-700">
                    {naturalOrder ? "Drop here" : "No products"}
                  </p>
                )}
                {ids.map((id) => {
                  const product = itemsById.get(id);
                  if (!product) return null;
                  const isDropCard =
                    draggingId !== null && dropTarget?.columnId === category.id && dropTarget.cardId === id;
                  return (
                    <div key={id} className="relative">
                      {isDropCard && (
                        <div className="absolute -top-1.5 left-0 right-0 h-0.5 rounded-full bg-accent-500" />
                      )}
                    <Card
                      data-card-id={naturalOrder ? id : undefined}
                      className={[
                        "p-2.5 transition-opacity duration-100",
                        draggingId === id ? "opacity-40" : "",
                      ].join(" ")}
                    >
                      <div className="flex items-start gap-2">
                        {naturalOrder && (
                          <button
                            type="button"
                            aria-label={`Drag to move ${product.name}`}
                            onPointerDown={(e) => handleHandlePointerDown(e, id)}
                            onContextMenu={(e) => e.preventDefault()}
                            disabled={busy}
                            className={[
                              "mt-0.5 flex h-5 w-5 flex-shrink-0 touch-none select-none items-center justify-center rounded text-graphite-300 disabled:opacity-25",
                              draggingId === id
                                ? "cursor-grabbing text-graphite-700 dark:text-graphite-100"
                                : "cursor-grab hover:text-graphite-500 dark:hover:text-graphite-300",
                            ].join(" ")}
                          >
                            <DotsSixVertical className="h-4 w-4" weight="bold" />
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => onView(id)}
                          aria-label={`View details for ${product.name}`}
                          className="flex h-9 w-9 flex-shrink-0 items-center justify-center overflow-hidden rounded bg-graphite-100 dark:bg-graphite-800"
                        >
                          {product.imageUrl ? (
                            <img src={product.imageUrl} alt="" className="h-full w-full object-cover" />
                          ) : (
                            <span className="font-display text-[12px] text-graphite-400">
                              {product.name.charAt(0)}
                            </span>
                          )}
                        </button>
                        <div className="min-w-0 flex-1">
                          <button
                            type="button"
                            onClick={() => onView(id)}
                            className="block truncate text-left font-body text-[13px] font-medium text-ink hover:underline dark:text-ink-inverted"
                          >
                            {product.name}
                          </button>
                          <p className="truncate font-body text-[11px] text-graphite-400">
                            {product.variantCount} variant{product.variantCount === 1 ? "" : "s"}
                          </p>
                          <div className="mt-1 flex flex-wrap items-center gap-1">
                            {product.isFeatured && <StatusBadge label="Featured" tone="info" />}
                            <StatusBadge
                              label={product.isActive ? "Active" : "Inactive"}
                              tone={product.isActive ? "success" : "neutral"}
                            />
                          </div>
                        </div>
                      </div>
                      <div className="mt-2 flex items-center justify-between gap-1 border-t border-graphite-100 pt-2 dark:border-graphite-800">
                        <button
                          type="button"
                          aria-label={`Move ${product.name} to another category`}
                          onClick={() => setMoveMenuProductId(id)}
                          disabled={busy}
                          className="flex h-8 items-center gap-1 rounded px-1.5 font-body text-[11px] font-medium text-graphite-500 hover:bg-graphite-100 disabled:opacity-40 dark:text-graphite-400 dark:hover:bg-graphite-800"
                        >
                          <FolderSimple className="h-4 w-4" weight="light" />
                          Move
                        </button>
                        <div className="flex gap-1">
                          <Link
                            to={`/admin/products/${id}/edit`}
                            aria-label={`Edit ${product.name}`}
                            className="flex h-8 w-8 items-center justify-center rounded text-graphite-500 hover:bg-graphite-100 dark:text-graphite-400 dark:hover:bg-graphite-800"
                          >
                            <PencilSimple className="h-4 w-4" weight="light" />
                          </Link>
                          <button
                            type="button"
                            aria-label={`Delete ${product.name}`}
                            onClick={() => onDelete(id, product.name)}
                            className="flex h-8 w-8 items-center justify-center rounded text-state-danger-text hover:bg-graphite-100 dark:text-state-danger-text-dark dark:hover:bg-graphite-800"
                          >
                            <Trash className="h-4 w-4" weight="light" />
                          </button>
                        </div>
                      </div>
                    </Card>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      {draggingId &&
        dragPos &&
        draggedProductRef.current &&
        createPortal(
          <div
            className="pointer-events-none fixed z-50 w-[260px] -translate-x-1/2 -translate-y-1/2 rotate-2 rounded-lg border border-graphite-200 bg-white p-2.5 shadow-lg dark:border-graphite-700 dark:bg-graphite-900"
            style={{ left: dragPos.x, top: dragPos.y }}
          >
            <div className="flex items-center gap-2">
              <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center overflow-hidden rounded bg-graphite-100 dark:bg-graphite-800">
                {draggedProductRef.current.imageUrl ? (
                  <img src={draggedProductRef.current.imageUrl} alt="" className="h-full w-full object-cover" />
                ) : (
                  <span className="font-display text-[12px] text-graphite-400">
                    {draggedProductRef.current.name.charAt(0)}
                  </span>
                )}
              </div>
              <p className="truncate font-body text-[13px] font-medium text-ink dark:text-ink-inverted">
                {draggedProductRef.current.name}
              </p>
            </div>
          </div>,
          document.body,
        )}

      <BottomSheet
        open={moveMenuProductId !== null}
        onClose={() => setMoveMenuProductId(null)}
        title={moveMenuProductId ? `Move "${itemsById.get(moveMenuProductId)?.name ?? ""}" to…` : undefined}
      >
        <div className="flex flex-col gap-0.5">
          {categoryList.map((category) => {
            const product = moveMenuProductId ? itemsById.get(moveMenuProductId) : undefined;
            const isCurrent = product?.categoryId === category.id;
            return (
              <button
                key={category.id}
                type="button"
                disabled={isCurrent || busy}
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
