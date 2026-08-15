import { Heart } from "@phosphor-icons/react";
import { Link } from "react-router-dom";
import { PageHeader } from "../components/layout/PageHeader";
import { ProductCard } from "../components/products/ProductCard";
import { Skeleton } from "../components/ui/Skeleton";
import { EmptyState } from "../components/ui/EmptyState";
import { ErrorState } from "../components/ui/ErrorState";
import { Button } from "../components/ui/Button";
import { useProducts } from "../hooks/useProducts";
import { useSavedProducts } from "../hooks/useSavedProducts";
import { useDocumentMeta } from "../hooks/useDocumentMeta";

export function Saved() {
  const { ids } = useSavedProducts();
  // No "fetch by ids" endpoint exists — the full catalog is already a
  // single cheap query (see Products/Search), so filtering client-side
  // avoids adding a new service method for what's a small, local list.
  const products = useProducts();

  useDocumentMeta({ title: "Saved tools", noindex: true });

  const savedProducts =
    products.status === "success" ? products.data.filter((p) => ids.includes(p.id)) : [];

  return (
    <div>
      <PageHeader title="Saved tools" />

      {ids.length === 0 && (
        <div className="px-4 pt-4">
          <EmptyState
            icon={<Heart className="h-5 w-5" weight="regular" />}
            title="Nothing saved yet"
            description="Tap the heart on any tool to keep it here for later."
            action={
              <Link to="/products">
                <Button variant="secondary">Browse tools</Button>
              </Link>
            }
          />
        </div>
      )}

      {ids.length > 0 && products.status === "loading" && (
        <div className="grid grid-cols-2 gap-3 p-4">
          {Array.from({ length: Math.min(ids.length, 4) }).map((_, i) => (
            <div key={i}>
              <Skeleton className="aspect-square w-full rounded-t" />
              <Skeleton className="mt-1 h-4 w-full" />
            </div>
          ))}
        </div>
      )}

      {ids.length > 0 && products.status === "error" && (
        <div className="px-4 pt-4">
          <ErrorState title="Couldn't load your saved tools" onRetry={products.refetch} />
        </div>
      )}

      {ids.length > 0 && products.status === "success" && savedProducts.length > 0 && (
        <div className="grid grid-cols-2 gap-3 p-4">
          {savedProducts.map((product) => (
            <ProductCard key={product.id} {...product} variant="compact" />
          ))}
        </div>
      )}
    </div>
  );
}
