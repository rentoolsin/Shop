import { SlidersHorizontal } from "lucide-react";
import { useState } from "react";
import { useSearchParams } from "react-router-dom";
import { PageHeader } from "../components/layout/PageHeader";
import { ProductCard } from "../components/products/ProductCard";
import { Skeleton } from "../components/ui/Skeleton";
import { EmptyState } from "../components/ui/EmptyState";
import { ErrorState } from "../components/ui/ErrorState";
import { BottomSheet } from "../components/ui/BottomSheet";
import { Button } from "../components/ui/Button";
import { useProducts } from "../hooks/useProducts";
import { useCategories } from "../hooks/useCategories";
import { useDocumentMeta } from "../hooks/useDocumentMeta";

export function Products() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [filterOpen, setFilterOpen] = useState(false);
  const categoryId = searchParams.get("category") ?? undefined;

  const categories = useCategories();
  const products = useProducts({ categoryId });

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
    setFilterOpen(false);
  };

  return (
    <div>
      <PageHeader
        title="Tools"
        action={
          <button
            onClick={() => setFilterOpen(true)}
            className="mr-1 flex h-10 items-center gap-1.5 rounded px-3 font-body text-[13px] font-medium text-ink hover:bg-graphite-100 dark:text-ink-inverted dark:hover:bg-graphite-800"
          >
            <SlidersHorizontal className="h-4 w-4" strokeWidth={1.6} />
            Filter
          </button>
        }
      />

      {activeCategoryName && (
        <div className="flex items-center gap-2 px-4 pt-3">
          <span className="spec-tag spec-tag--accent">{activeCategoryName}</span>
          <button
            onClick={() => applyCategory(undefined)}
            className="font-body text-[12px] text-graphite-500 underline"
          >
            Clear
          </button>
        </div>
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
        <div className="px-4">
          <ErrorState title="Couldn't load tools" onRetry={products.refetch} />
        </div>
      )}

      {products.status === "success" && products.data.length === 0 && (
        <div className="px-4">
          <EmptyState
            title="No tools found"
            description="Try a different category or check back once inventory is added."
          />
        </div>
      )}

      {products.status === "success" && products.data.length > 0 && (
        <div className="grid grid-cols-2 gap-3 p-4">
          {products.data.map((product) => (
            <ProductCard key={product.id} {...product} variant="compact" />
          ))}
        </div>
      )}

      <BottomSheet open={filterOpen} onClose={() => setFilterOpen(false)} title="Filter by category">
        <div className="flex flex-col gap-1">
          <Button
            variant={!categoryId ? "primary" : "ghost"}
            fullWidth
            className="justify-start"
            onClick={() => applyCategory(undefined)}
          >
            All categories
          </Button>
          {categories.status === "success" &&
            categories.data.map((category) => (
              <Button
                key={category.id}
                variant={categoryId === category.id ? "primary" : "ghost"}
                fullWidth
                className="justify-start"
                onClick={() => applyCategory(category.id)}
              >
                {category.name}
              </Button>
            ))}
        </div>
      </BottomSheet>
    </div>
  );
}
