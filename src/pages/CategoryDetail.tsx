import { Link, useParams } from "react-router-dom";
import { PageHeader } from "../components/layout/PageHeader";
import { DesktopContainer } from "../components/layout/DesktopHeader";
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

  const category =
    categories.status === "success" ? categories.data.find((c) => c.id === id) : undefined;
  const otherCategories =
    categories.status === "success" ? categories.data.filter((c) => c.id !== id) : [];
  const availableCount =
    products.status === "success" ? products.data.filter((p) => p.available).length : undefined;

  useDocumentMeta({
    title: category?.name ?? "Category",
    description: category
      ? `Browse ${category.name.toLowerCase()} available for rent in Coimbatore, with daily rates and availability.`
      : undefined,
  });

  return (
    <div>
      {/* Mobile / narrow-viewport layout */}
      <div className="md:hidden">
        <PageHeader title={category?.name ?? "Category"} />

        {/* Hero — mirrors the icon-circle language from CategoryCard, blown up,
            plus a live count so the page reads as more than a bare grid. */}
        <section className="flex items-center gap-3.5 border-b border-graphite-200/70 px-4 py-4 dark:border-graphite-800/70">
          <span className="flex h-14 w-14 flex-shrink-0 items-center justify-center overflow-hidden rounded bg-accent-50 dark:bg-graphite-800">
            {category?.imageUrl ? (
              <img src={category.imageUrl} alt="" className="h-full w-full object-cover" />
            ) : (
              <span className="font-display text-[20px] font-semibold text-graphite-500">
                {(category?.name ?? "?").charAt(0)}
              </span>
            )}
          </span>
          <div className="min-w-0">
            <h2 className="truncate font-display text-[17px] font-semibold text-ink dark:text-ink-inverted">
              {category?.name ?? "Category"}
            </h2>
            <p className="mt-0.5 font-body text-[13px] text-graphite-500">
              {products.status === "success"
                ? `${products.data.length} tool${products.data.length === 1 ? "" : "s"}${
                    availableCount ? ` · ${availableCount} available now` : ""
                  }`
                : "Tools for rent in this category"}
            </p>
          </div>
        </section>

        {/* Cross-category chips — a plain grid was a dead end once you'd
            landed on a category; this keeps browsing going without a back-tap. */}
        {otherCategories.length > 0 && (
          <div className="flex gap-2 overflow-x-auto px-4 py-3 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {otherCategories.map((c) => (
              <Link key={c.id} to={`/categories/${c.id}`} className="spec-tag flex-shrink-0">
                {c.name}
              </Link>
            ))}
          </div>
        )}

        {products.status === "loading" && (
          <div className="grid grid-cols-2 gap-3 p-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i}>
                <Skeleton className="aspect-square w-full rounded-t" />
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
                  className="inline-flex h-10 items-center rounded border border-graphite-300 px-4 font-body text-[13px] font-medium text-ink transition-colors active:bg-graphite-100 dark:border-graphite-700 dark:text-ink-inverted dark:active:bg-graphite-800"
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

      {/* Desktop / wide-viewport layout */}
      <div className="hidden md:block">
        <DesktopContainer className="py-10">
          <div className="flex items-center gap-5 border-b border-graphite-200 pb-8 dark:border-graphite-800">
            <span className="flex h-20 w-20 flex-shrink-0 items-center justify-center overflow-hidden rounded-lg bg-accent-50 dark:bg-graphite-800">
              {category?.imageUrl ? (
                <img src={category.imageUrl} alt="" className="h-full w-full object-cover" />
              ) : (
                <span className="font-display text-[28px] font-semibold text-graphite-500">
                  {(category?.name ?? "?").charAt(0)}
                </span>
              )}
            </span>
            <div className="min-w-0">
              <h1 className="font-display text-[28px] font-extrabold text-ink dark:text-ink-inverted">
                {category?.name ?? "Category"}
              </h1>
              <p className="mt-1 font-body text-[14.5px] text-graphite-500">
                {products.status === "success"
                  ? `${products.data.length} tool${products.data.length === 1 ? "" : "s"}${
                      availableCount ? ` · ${availableCount} available now` : ""
                    }`
                  : "Tools for rent in this category"}
              </p>
            </div>
          </div>

          <div className="mt-8 grid grid-cols-[220px_1fr] gap-10">
            {otherCategories.length > 0 && (
              <aside className="sticky top-28 self-start">
                <h2 className="font-display text-[12.5px] font-semibold uppercase tracking-[0.06em] text-graphite-400">
                  Other categories
                </h2>
                <div className="mt-3 flex flex-col gap-0.5">
                  {otherCategories.map((c) => (
                    <Link
                      key={c.id}
                      to={`/categories/${c.id}`}
                      className="rounded px-2.5 py-2 font-body text-[14px] text-graphite-600 transition-colors hover:bg-graphite-100 dark:text-graphite-300 dark:hover:bg-graphite-800"
                    >
                      {c.name}
                    </Link>
                  ))}
                </div>
              </aside>
            )}

            <div className={otherCategories.length === 0 ? "col-span-2" : ""}>
              {products.status === "loading" && (
                <div className="grid grid-cols-4 gap-5">
                  {Array.from({ length: 8 }).map((_, i) => (
                    <div key={i}>
                      <Skeleton className="aspect-square w-full rounded-t" />
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
                  action={
                    <Link
                      to="/products"
                      className="inline-flex h-10 items-center rounded border border-graphite-300 px-4 font-body text-[13px] font-medium text-ink transition-colors hover:bg-graphite-100 dark:border-graphite-700 dark:text-ink-inverted dark:hover:bg-graphite-800"
                    >
                      Browse all tools
                    </Link>
                  }
                />
              )}

              {products.status === "success" && products.data.length > 0 && (
                <div className="grid grid-cols-4 gap-5">
                  {products.data.map((product) => (
                    <ProductCard key={product.id} {...product} variant="compact" />
                  ))}
                </div>
              )}
            </div>
          </div>
        </DesktopContainer>
      </div>
    </div>
  );
}
