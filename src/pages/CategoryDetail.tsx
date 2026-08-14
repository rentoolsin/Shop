import { useParams } from "react-router-dom";
import { PageHeader } from "../components/layout/PageHeader";
import { ProductCard } from "../components/products/ProductCard";
import { Skeleton } from "../components/ui/Skeleton";
import { EmptyState } from "../components/ui/EmptyState";
import { ErrorState } from "../components/ui/ErrorState";
import { useProducts } from "../hooks/useProducts";
import { useCategories } from "../hooks/useCategories";

export function CategoryDetail() {
  const { id } = useParams<{ id: string }>();
  const categories = useCategories();
  const products = useProducts({ categoryId: id });

  const categoryName =
    categories.status === "success"
      ? categories.data.find((c) => c.id === id)?.name
      : undefined;

  return (
    <div>
      <PageHeader title={categoryName ?? "Category"} />

      {products.status === "loading" && (
        <div className="grid grid-cols-2 gap-3 p-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i}>
              <Skeleton className="aspect-[4/3] w-full rounded-t-lg" />
              <Skeleton className="mt-1 h-4 w-full" />
            </div>
          ))}
        </div>
      )}

      {products.status === "error" && (
        <ErrorState title="Couldn't load tools" onRetry={products.refetch} />
      )}

      {products.status === "success" && products.data.length === 0 && (
        <EmptyState
          title="No tools in this category yet"
          description="Check back soon, or browse all tools instead."
        />
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
