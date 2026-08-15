import { Link, useParams } from "react-router-dom";
import { PageHeader } from "../components/layout/PageHeader";
import { ProductCard } from "../components/products/ProductCard";
import { Skeleton } from "../components/ui/Skeleton";
import { EmptyState } from "../components/ui/EmptyState";
import { ErrorState } from "../components/ui/ErrorState";
import { useProducts } from "../hooks/useProducts";
import { useCategories } from "../hooks/useCategories";
import { useDocumentMeta } from "../hooks/useDocumentMeta";

export function CategoryDetail() {
  const { id } = useParams<{ id: string }>();
  const categories = useCategories();
  const products = useProducts({ categoryId: id });

  const categoryName =
    categories.status === "success"
      ? categories.data.find((c) => c.id === id)?.name
      : undefined;

  useDocumentMeta({
    title: categoryName ?? "Category",
    description: categoryName
      ? `Browse ${categoryName.toLowerCase()} available for rent in Coimbatore, with daily rates and availability.`
      : undefined,
  });

  return (
    <div>
      <PageHeader title={categoryName ?? "Category"} />

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
            title="No tools in this category yet"
            description="Check back soon, or browse all tools instead."
            action={
              <Link
                to="/products"
                className="inline-flex h-10 items-center rounded-lg border border-graphite-300 px-4 font-body text-[13px] font-medium text-ink transition-colors active:bg-graphite-100 dark:border-graphite-700 dark:text-ink-inverted dark:active:bg-graphite-800"
              >
                Browse all tools
              </Link>
            }
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
    </div>
  );
}
