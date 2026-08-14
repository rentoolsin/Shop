import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { PageHeader } from "../components/layout/PageHeader";
import { ProductCard } from "../components/products/ProductCard";
import { Skeleton } from "../components/ui/Skeleton";
import { EmptyState } from "../components/ui/EmptyState";
import { ErrorState } from "../components/ui/ErrorState";
import { SearchBar } from "../components/ui/SearchBar";
import { useProducts } from "../hooks/useProducts";

const DEBOUNCE_MS = 350;

export function Search() {
  const [searchParams, setSearchParams] = useSearchParams();
  const urlQuery = searchParams.get("q") ?? "";
  const [input, setInput] = useState(urlQuery);
  const [debounced, setDebounced] = useState(urlQuery);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setDebounced(input);
      const next = new URLSearchParams(searchParams);
      if (input) next.set("q", input);
      else next.delete("q");
      setSearchParams(next, { replace: true });
    }, DEBOUNCE_MS);
    return () => window.clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [input]);

  const products = useProducts({ query: debounced || undefined });

  return (
    <div>
      <PageHeader title="Search" />

      <div className="p-4">
        <SearchBar
          autoFocus
          value={input}
          onChange={setInput}
          placeholder="Search ladders, cutters, motors…"
          aria-label="Search products"
        />
      </div>

      {!debounced && (
        <EmptyState
          title="Search RenTools' inventory"
          description="Try a tool name like “ladder” or “pipe cutter”."
        />
      )}

      {debounced && products.status === "loading" && (
        <div className="grid grid-cols-2 gap-3 p-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="aspect-[4/3] w-full rounded-lg" />
          ))}
        </div>
      )}

      {debounced && products.status === "error" && (
        <ErrorState title="Search failed" onRetry={products.refetch} />
      )}

      {debounced && products.status === "success" && products.data.length === 0 && (
        <EmptyState
          title="No tools matched"
          description={`Nothing found for "${debounced}". Try a different search.`}
        />
      )}

      {debounced && products.status === "success" && products.data.length > 0 && (
        <div className="grid grid-cols-2 gap-3 p-4">
          {products.data.map((product) => (
            <ProductCard key={product.id} {...product} variant="compact" />
          ))}
        </div>
      )}
    </div>
  );
}
