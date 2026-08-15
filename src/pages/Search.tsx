import { Clock, X } from "lucide-react";
import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { PageHeader } from "../components/layout/PageHeader";
import { ProductCard } from "../components/products/ProductCard";
import { Skeleton } from "../components/ui/Skeleton";
import { EmptyState } from "../components/ui/EmptyState";
import { ErrorState } from "../components/ui/ErrorState";
import { SearchBar } from "../components/ui/SearchBar";
import { useProducts } from "../hooks/useProducts";
import { useCategories } from "../hooks/useCategories";
import { useDocumentMeta } from "../hooks/useDocumentMeta";

const DEBOUNCE_MS = 350;
const RECENT_KEY = "rentools:recent-searches";
const RECENT_LIMIT = 6;

function readRecent(): string[] {
  try {
    const raw = window.localStorage.getItem(RECENT_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed.filter((v): v is string => typeof v === "string") : [];
  } catch {
    return [];
  }
}

function writeRecent(terms: string[]) {
  try {
    window.localStorage.setItem(RECENT_KEY, JSON.stringify(terms.slice(0, RECENT_LIMIT)));
  } catch {
    // Storage can be unavailable (private browsing, quota) — recent
    // searches are a convenience, not worth surfacing an error for.
  }
}

export function Search() {
  const [searchParams, setSearchParams] = useSearchParams();
  const urlQuery = searchParams.get("q") ?? "";
  const [input, setInput] = useState(urlQuery);
  const [debounced, setDebounced] = useState(urlQuery);
  const [recent, setRecent] = useState<string[]>(() => readRecent());
  const categories = useCategories();

  // Search-result pages are per-visitor and low-value to index individually —
  // noindex avoids diluting the crawl budget/index with endless "?q=" variants.
  useDocumentMeta({
    title: "Search",
    description: "Search RenTools' tool and equipment rental inventory in Coimbatore.",
    noindex: true,
  });

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setDebounced(input);
      const next = new URLSearchParams(searchParams);
      if (input) next.set("q", input);
      else next.delete("q");
      setSearchParams(next, { replace: true });

      const trimmed = input.trim();
      if (trimmed.length > 1) {
        setRecent((prev) => {
          const updated = [trimmed, ...prev.filter((t) => t.toLowerCase() !== trimmed.toLowerCase())];
          writeRecent(updated);
          return updated.slice(0, RECENT_LIMIT);
        });
      }
    }, DEBOUNCE_MS);
    return () => window.clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [input]);

  const products = useProducts({ query: debounced || undefined });

  const clearRecent = () => {
    setRecent([]);
    writeRecent([]);
  };

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
        <div className="space-y-6 px-4 pb-4">
          {recent.length > 0 && (
            <section>
              <div className="flex items-center justify-between">
                <h2 className="font-body text-[13px] font-medium text-graphite-500">
                  Recent searches
                </h2>
                <button
                  onClick={clearRecent}
                  className="font-body text-[12px] text-graphite-400 underline"
                >
                  Clear
                </button>
              </div>
              <div className="mt-2 flex flex-col gap-1">
                {recent.map((term) => (
                  <button
                    key={term}
                    onClick={() => setInput(term)}
                    className="flex h-11 items-center gap-2.5 rounded px-1 text-left transition-colors active:bg-graphite-100 dark:active:bg-graphite-800"
                  >
                    <Clock className="h-4 w-4 flex-shrink-0 text-graphite-400" strokeWidth={1.7} />
                    <span className="flex-1 truncate font-body text-[14px] text-ink dark:text-ink-inverted">
                      {term}
                    </span>
                    <X
                      onClick={(e) => {
                        e.stopPropagation();
                        setRecent((prev) => {
                          const updated = prev.filter((t) => t !== term);
                          writeRecent(updated);
                          return updated;
                        });
                      }}
                      className="h-3.5 w-3.5 flex-shrink-0 text-graphite-300"
                      strokeWidth={1.8}
                    />
                  </button>
                ))}
              </div>
            </section>
          )}

          {categories.status === "success" && categories.data.length > 0 && (
            <section>
              <h2 className="font-body text-[13px] font-medium text-graphite-500">
                Browse by category
              </h2>
              <div className="mt-2 flex flex-wrap gap-2">
                {categories.data.map((category) => (
                  <Link key={category.id} to={`/categories/${category.id}`} className="spec-tag">
                    {category.name}
                  </Link>
                ))}
              </div>
            </section>
          )}

          {recent.length === 0 && (
            <EmptyState
              title="Search RenTools' inventory"
              description="Try a tool name like “ladder” or “pipe cutter”."
            />
          )}
        </div>
      )}

      {debounced && products.status === "loading" && (
        <div className="grid grid-cols-2 gap-3 p-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="aspect-square w-full rounded" />
          ))}
        </div>
      )}

      {debounced && products.status === "error" && (
        <div className="px-4">
          <ErrorState title="Search failed" onRetry={products.refetch} />
        </div>
      )}

      {debounced && products.status === "success" && products.data.length === 0 && (
        <div className="px-4">
          <EmptyState
            title="No tools matched"
            description={`Nothing found for "${debounced}". Try a different search.`}
          />
        </div>
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
