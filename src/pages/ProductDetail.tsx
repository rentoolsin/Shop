import { Check, Heart, ShieldCheck, Truck } from "lucide-react";
import { useState } from "react";
import { useParams } from "react-router-dom";
import { PageHeader } from "../components/layout/PageHeader";
import { Skeleton } from "../components/ui/Skeleton";
import { ErrorState } from "../components/ui/ErrorState";
import { EmptyState } from "../components/ui/EmptyState";
import { StatusBadge } from "../components/ui/StatusBadge";
import { CallButton } from "../components/actions/CallButton";
import { EnquiryButton } from "../components/actions/EnquiryButton";
import { RequestPurchaseButton } from "../components/actions/RequestPurchaseButton";
import { ImageCarousel } from "../components/products/ImageCarousel";
import { useProduct, useProducts } from "../hooks/useProducts";
import { ProductCard } from "../components/products/ProductCard";
import { formatCurrency } from "../utils/currency";
import { useSiteSettings } from "../hooks/useSiteSettings";
import { SITE_SETTINGS_DEFAULTS } from "../utils/site-settings";
import { parseProductDescription } from "../utils/product-features";
import { useBottomBarHeight } from "../hooks/useBottomBarHeight";
import { useSavedProducts } from "../hooks/useSavedProducts";
import { useDocumentMeta } from "../hooks/useDocumentMeta";
// Aliased — this file's own component is also named ProductDetail.
import type { ProductDetail as ProductDetailData } from "../services/products.service";

function HeartIcon({ filled }: { filled: boolean }) {
  return <Heart fill={filled ? "currentColor" : "none"} strokeWidth={1.8} className="h-5 w-5" />;
}

function CheckIcon() {
  return (
    <span className="flex h-4 w-4 flex-shrink-0 items-center justify-center rounded-full bg-accent-500">
      <Check className="h-2.5 w-2.5 text-white" strokeWidth={3} />
    </span>
  );
}

/** JSON-LD Product/Offer structured data for search engines and share previews. */
function buildProductStructuredData(item: ProductDetailData) {
  const images = [item.imageUrl, ...item.galleryImageUrls].filter(
    (url, index, all): url is string => !!url && all.indexOf(url) === index,
  );
  return {
    "@context": "https://schema.org",
    "@type": "Product",
    name: item.name,
    ...(images.length > 0 ? { image: images } : {}),
    ...(item.description ? { description: item.description } : {}),
    ...(item.variants.length > 0
      ? {
          offers: item.variants.map((variant) => ({
            "@type": "Offer",
            name: variant.label,
            price: variant.dailyRate,
            priceCurrency: "INR",
            availability:
              variant.availableQuantity > 0
                ? "https://schema.org/InStock"
                : "https://schema.org/OutOfStock",
          })),
        }
      : {}),
  };
}

export function ProductDetail() {
  const { id } = useParams<{ id: string }>();
  const product = useProduct(id);
  const settings = useSiteSettings();
  const phone = settings.status === "success" ? settings.data.phone : SITE_SETTINGS_DEFAULTS.phone;
  const [selectedVariantId, setSelectedVariantId] = useState<string | null>(null);
  const { isSaved, toggle: toggleSaved } = useSavedProducts();
  const bottomBarHeight = useBottomBarHeight();
  const loadedProduct = product.status === "success" ? product.data : null;
  // Same-category picks, shown once the product itself has loaded — a
  // rental app dead-ends hard at "unavailable" or "that's not quite it";
  // this keeps the visit going instead of bouncing back to search.
  const related = useProducts({ categoryId: loadedProduct?.categoryId });

  useDocumentMeta({
    title: loadedProduct?.name ?? "Tool",
    description: loadedProduct
      ? `Rent ${loadedProduct.name} in Coimbatore — check daily rates and availability, then enquire by call or WhatsApp.`
      : undefined,
    structuredData: loadedProduct ? buildProductStructuredData(loadedProduct) : undefined,
  });

  if (product.status === "loading") {
    return (
      <div>
        <PageHeader title="Tool" />
        <Skeleton className="aspect-square w-full" />
        <div className="space-y-2 p-4">
          <Skeleton className="h-5 w-2/3" />
          <Skeleton className="h-4 w-1/3" />
        </div>
      </div>
    );
  }

  if (product.status === "error") {
    return (
      <div>
        <PageHeader title="Tool" />
        <ErrorState title="Couldn't load this tool" onRetry={product.refetch} />
      </div>
    );
  }

  if (!product.data) {
    return (
      <div>
        <PageHeader title="Tool" />
        <EmptyState title="Tool not found" description="It may have been removed." />
      </div>
    );
  }

  const item = product.data;
  const activeVariant =
    item.variants.find((v) => v.id === selectedVariantId) ?? item.variants[0];
  const outOfStock = !!activeVariant && activeVariant.availableQuantity <= 0;
  const { intro, highlights } = parseProductDescription(item.description ?? null);
  // Cover photo first, then gallery photos — de-duped in case the same URL
  // was also added to the gallery.
  const galleryImages = [item.imageUrl, ...item.galleryImageUrls].filter(
    (url, index, all): url is string => !!url && all.indexOf(url) === index,
  );

  return (
    <div>
      <PageHeader
        title={item.name}
        action={
          <button
            onClick={() => toggleSaved(item.id)}
            aria-label={isSaved(item.id) ? "Remove from saved" : "Save this tool"}
            className={[
              "mr-1 flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full transition-all duration-150 ease-app active:scale-90",
              isSaved(item.id)
                ? "text-accent-500 hover:bg-graphite-100 dark:hover:bg-graphite-800"
                : "text-ink hover:bg-graphite-100 dark:text-ink-inverted dark:hover:bg-graphite-800",
            ].join(" ")}
          >
            <HeartIcon filled={isSaved(item.id)} />
          </button>
        }
      />

      <ImageCarousel images={galleryImages} alt={item.name} />

      <div className="p-4">
        <h2 className="font-display text-[19px] font-bold text-ink dark:text-ink-inverted">
          {item.name}
        </h2>

        {item.variants.length === 0 && (
          <p className="mt-4 font-body text-[13px] text-graphite-500">
            Rate and availability on enquiry.
          </p>
        )}

        {item.variants.length > 0 && (
          <div className="mt-4">
            <h3 className="font-body text-[13px] font-medium text-graphite-500">Size / Variant</h3>
            <div className="mt-2 flex flex-wrap gap-2">
              {item.variants.map((variant) => (
                <button
                  key={variant.id}
                  onClick={() => setSelectedVariantId(variant.id)}
                  aria-pressed={activeVariant?.id === variant.id}
                  className={[
                    "spec-tag min-h-[40px] px-3.5",
                    activeVariant?.id === variant.id ? "spec-tag--accent" : "",
                  ].join(" ")}
                >
                  {variant.label}
                </button>
              ))}
            </div>

            {activeVariant && (
              <div className="mt-4 flex items-center gap-2">
                <span className="font-display text-[20px] font-bold text-ink dark:text-ink-inverted">
                  {formatCurrency(activeVariant.dailyRate)}
                </span>
                <span className="font-body text-[13px] text-graphite-500">/ day</span>
                <StatusBadge
                  label={activeVariant.availableQuantity > 0 ? "Available" : "Unavailable"}
                  tone={activeVariant.availableQuantity > 0 ? "success" : "danger"}
                />
              </div>
            )}
          </div>
        )}

        {/* Rental policy reassurance — generic across all tools (no
            per-tool deposit/delivery data exists yet), phrased as general
            business practice rather than a specific promised figure. */}
        <div className="mt-4 grid grid-cols-2 gap-2 rounded-lg border border-graphite-200 bg-graphite-50 px-3.5 py-3 dark:border-graphite-800 dark:bg-graphite-900/50">
          <div className="flex items-center gap-2">
            <Truck className="h-4 w-4 flex-shrink-0 text-graphite-400" strokeWidth={1.8} />
            <span className="font-body text-[11.5px] leading-tight text-graphite-500">
              Pickup or delivery available
            </span>
          </div>
          <div className="flex items-center gap-2">
            <ShieldCheck className="h-4 w-4 flex-shrink-0 text-graphite-400" strokeWidth={1.8} />
            <span className="font-body text-[11.5px] leading-tight text-graphite-500">
              Deposit refunded on return
            </span>
          </div>
        </div>

        {(intro || highlights.length > 0) && (
          <div className="mt-5">
            <h3 className="font-body text-[15px] font-semibold text-ink dark:text-ink-inverted">
              About this tool
            </h3>
            {intro && (
              <p className="mt-1.5 font-body text-[14px] leading-relaxed text-graphite-600 dark:text-graphite-300">
                {intro}
              </p>
            )}
            {highlights.length > 0 && (
              <ul className="mt-3 space-y-2.5">
                {highlights.map((highlight, index) => (
                  <li
                    key={index}
                    className="flex items-start gap-2 font-body text-[14px] text-graphite-600 dark:text-graphite-300"
                  >
                    <span className="mt-0.5">
                      <CheckIcon />
                    </span>
                    {highlight}
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}
      </div>

      {loadedProduct && related.status === "success" && (
        <>
          {(() => {
            const picks = related.data.filter((p) => p.id !== loadedProduct.id).slice(0, 8);
            if (picks.length === 0) return null;
            return (
              <div className="mb-4">
                <h3 className="px-4 font-body text-[15px] font-semibold text-ink dark:text-ink-inverted">
                  You might also need
                </h3>
                <div className="mt-3 flex gap-3 overflow-x-auto px-4 pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                  {picks.map((p) => (
                    <ProductCard key={p.id} {...p} variant="featured" />
                  ))}
                </div>
              </div>
            );
          })()}
        </>
      )}

      {/* Sticky above the floating bottom nav, not behind it — `sticky
          bottom-0` alone would pin this to the true bottom of the
          viewport, the exact same space the fixed, higher-z-index nav
          dock occupies, hiding the two most important buttons on this
          page (Enquire/Request, Call) underneath it once scrolled. */}
      <div
        className="sticky z-20 flex gap-2 border-t border-graphite-200 bg-graphite-50/95 p-3 backdrop-blur-sm dark:border-graphite-800 dark:bg-graphite-950/95"
        style={{
          bottom:
            bottomBarHeight > 0
              ? bottomBarHeight
              : "calc(5.25rem + env(safe-area-inset-bottom))",
        }}
      >
        {outOfStock ? (
          <RequestPurchaseButton productName={item.name} fullWidth />
        ) : (
          <EnquiryButton
            productId={item.id}
            productName={item.name}
            dailyRate={activeVariant?.dailyRate}
            fullWidth
          />
        )}
        <CallButton phone={phone} fullWidth />
      </div>
    </div>
  );
}
