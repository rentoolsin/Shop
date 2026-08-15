import { ArrowUpDown, Heart } from "lucide-react";
import { useMemo, useState } from "react";
import { useSearchParams, Link } from "react-router-dom";
import { PageHeader } from "../components/layout/PageHeader";
import { ProductCard } from "../components/products/ProductCard";
import { Skeleton } from "../components/ui/Skeleton";
import { EmptyState } from "../components/ui/EmptyState";
import { ErrorState } from "../components/ui/ErrorState";
import { BottomSheet } from "../components/ui/BottomSheet";
import { Button } from "../components/ui/Button";
import { useProducts } from "../hooks/useProducts";
import { useCategories } from "../hooks/useCategories";
import { useSavedProducts } from "../hooks/useSavedProducts";
import { useDocumentMeta } from "../hooks/useDocumentMeta";

type SortKey = "popular" | "price-asc" | "price-desc";

const SORT_LABELS: Record<SortKey, string> = {
  popular: "Popular",
  "price-asc": "Price: Low to high",
  "price-desc": "Price: High to low",
};

export function Products() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [sortOpen, setSortOpen] = useState(false);
  const [sort, setSort] = useState<SortKey>("popular");
  const categoryId = searchParams.get("category") ?? undefined;

  const categories = useCategories();
  const products = useProducts({ categoryId });
  const { ids: savedIds } = useSavedProducts();

  const activeCategoryName = categories.status === "success"
    ? categories.data.find((c) => c.id === categoryId)?.name
    : undefined;

  useDocumentMeta({
    title: activeCategoryName ? `${activeCategoryName} tools` : "Tools",
    description: activeCategoryName
      ? `Browse ${activeCategoryName.toLowerCase()} available for rent in Coimbatore, with daily rates and availability.`
      : "Browse all construction tools and equipment available for rent in Coimbatore, with daily rates and availability.",
  });

  const applyCategory = (id?: string) => {
    const next = new URLSearchParams(searchParams);
    if (id) next.set("category", id);
    else next.delete("category");
    setSearchParams(next);
  };

  const sortedProducts = useMemo(() => {
    if (products.status !== "success") return [];
    const list = [...products.data];
    if (sort === "price-asc") {
      list.sort((a, b) => (a.fromDailyRate ?? Infinity) - (b.fromDailyRate ?? Infinity));
    } else if (sort === "price-desc") {
      list.sort((a, b) => (b.fromDailyRate ?? -Infinity) - (a.fromDailyRate ?? -Infinity));
    } else {
      // "Popular": in-stock tools surfaced first, original order preserved
      // within each group — a lightweight stand-in until real popularity
      // data (rental counts) exists.
      list.sort((a, b) => Number(b.available) - Number(a.available));
    }
    return list;
  }, [products, sort]);

  return (
    <div>
      <PageHeader
        title="Tools"
        action={
          <div className="mr-1 flex items-center">
            <Link
              to="/saved"
              aria-label={`Saved tools${savedIds.length > 0 ? ` (${savedIds.length})` : ""}`}
              className="relative flex h-10 w-10 items-center justify-center rounded-full text-ink hover:bg-graphite-100 dark:text-ink-inverted dark:hover:bg-graphite-800"
            >
              <Heart className="h-[18px] w-[18px]" strokeWidth={1.8} />
              {savedIds.length > 0 && (
                <span className="absolute right-1 top-1 flex h-2 w-2 rounded-full bg-accent-500" />
              )}
            </Link>
            <button
              onClick={() => setSortOpen(true)}
              className="flex h-10 items-center gap-1.5 rounded px-3 font-body text-[13px] font-medium text-ink hover:bg-graphite-100 dark:text-ink-inverted dark:hover:bg-graphite-800"
            >
              <ArrowUpDown className="h-4 w-4" strokeWidth={1.6} />
              Sort
            </button>
          </div>
        }
      />

      {/* Category chips — always visible so switching categories doesn't
          require a separate filter sheet round-trip. */}
      {categories.status === "success" && categories.data.length > 0 && (
        <div className="flex gap-2 overflow-x-auto border-b border-graphite-200/70 px-4 py-3 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden dark:border-graphite-800/70">
          <button
            onClick={() => applyCategory(undefined)}
            className={`spec-tag flex-shrink-0 ${!categoryId ? "spec-tag--accent" : ""}`}
          >
            All
          </button>
          {categories.data.map((category) => (
            <button
              key={category.id}
              onClick={() => applyCategory(category.id)}
              className={`spec-tag flex-shrink-0 ${categoryId === category.id ? "spec-tag--accent" : ""}`}
            >
              {category.name}
            </button>
          ))}
        </div>
      )}

      {products.status === "success" && products.data.length > 0 && (
        <p className="px-4 pt-3 font-body text-[12.5px] text-graphite-500">
          {sortedProducts.length} tool{sortedProducts.length === 1 ? "" : "s"}
          {activeCategoryName ? ` in ${activeCategoryName}` : ""}
        </p>
      )}

      {products.status === "loading" && (
        <div className="grid grid-cols-2 gap-3 p-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i}>
              <Skeleton className="aspect-square w-full rounded-t-lg" />
              <Skeleton className="mt-1 h-4 w-full" />
            </div>
          ))}
        </div>
      )}

      {products.status === "error" && (
        <div className="px-4 pt-4">
          <ErrorState title="Couldn't load tools" onRetry={products.refetch} />
        </div>
      )}

      {products.status === "success" && products.data.length === 0 && (
        <div className="px-4 pt-4">
          <EmptyState
            title="No tools found"
            description="Try a different category or check back once inventory is added."
          />
        </div>
      )}

      {products.status === "success" && sortedProducts.length > 0 && (
        <div className="grid grid-cols-2 gap-3 p-4">
          {sortedProducts.map((product) => (
            <ProductCard key={product.id} {...product} variant="compact" />
          ))}
        </div>
      )}

      <BottomSheet open={sortOpen} onClose={() => setSortOpen(false)} title="Sort by">
        <div className="flex flex-col gap-1">
          {(Object.keys(SORT_LABELS) as SortKey[]).map((key) => (
            <Button
              key={key}
              variant={sort === key ? "primary" : "ghost"}
              fullWidth
              className="justify-start"
              onClick={() => {
                setSort(key);
                setSortOpen(false);
              }}
            >
              {SORT_LABELS[key]}
            </Button>
          ))}
        </div>
      </BottomSheet>
    </div>
  );
}
