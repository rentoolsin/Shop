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
import { useProduct } from "../hooks/useProducts";
import { formatCurrency } from "../utils/currency";
import { useSiteSettings } from "../hooks/useSiteSettings";
import { SITE_SETTINGS_DEFAULTS } from "../utils/site-settings";
import { parseProductDescription } from "../utils/product-features";

function HeartIcon({ filled }: { filled: boolean }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill={filled ? "currentColor" : "none"}
      strokeWidth={1.8}
      className="h-5 w-5"
    >
      <path
        d="M12 20.2c-.2 0-.4-.1-.6-.2C7.9 17.6 3 14 3 9.6 3 6.8 5.2 4.6 8 4.6c1.6 0 3 .7 4 1.9 1-1.2 2.4-1.9 4-1.9 2.8 0 5 2.2 5 5 0 4.4-4.9 8-8.4 10.4-.2.1-.4.2-.6.2Z"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function CheckIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" className="h-4 w-4 flex-shrink-0">
      <circle cx="12" cy="12" r="10" fill="currentColor" className="text-accent-500" />
      <path
        d="M8 12.5l2.5 2.5L16 9.5"
        stroke="white"
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function ProductDetail() {
  const { id } = useParams<{ id: string }>();
  const product = useProduct(id);
  const settings = useSiteSettings();
  const phone = settings.status === "success" ? settings.data.phone : SITE_SETTINGS_DEFAULTS.phone;
  const [selectedVariantId, setSelectedVariantId] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  if (product.status === "loading") {
    return (
      <div>
        <PageHeader title="Tool" />
        <Skeleton className="aspect-[4/3] w-full" />
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

  return (
    <div>
      <PageHeader
        title=""
        action={
          <button
            onClick={() => setSaved((v) => !v)}
            aria-label={saved ? "Remove from saved" : "Save this tool"}
            className={[
              "flex h-10 w-10 items-center justify-center rounded",
              saved ? "text-accent-500" : "text-ink hover:bg-graphite-100",
              "dark:text-ink-inverted dark:hover:bg-graphite-800",
            ].join(" ")}
          >
            <HeartIcon filled={saved} />
          </button>
        }
      />

      <ImageCarousel images={item.imageUrl ? [item.imageUrl] : []} alt={item.name} />

      <div className="p-4">
        <h1 className="font-display text-[19px] font-bold text-ink dark:text-ink-inverted">
          {item.name}
        </h1>

        {item.variants.length === 0 && (
          <p className="mt-4 font-body text-[13px] text-graphite-500">
            Rate and availability on enquiry.
          </p>
        )}

        {item.variants.length > 0 && (
          <div className="mt-4">
            <h2 className="font-body text-[13px] font-medium text-graphite-500">Size / Variant</h2>
            <div className="mt-2 flex flex-wrap gap-2">
              {item.variants.map((variant) => (
                <button
                  key={variant.id}
                  onClick={() => setSelectedVariantId(variant.id)}
                  className={[
                    "spec-tag",
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

        {(intro || highlights.length > 0) && (
          <div className="mt-5">
            <h2 className="font-body text-[15px] font-semibold text-ink dark:text-ink-inverted">
              About this tool
            </h2>
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

      <div className="sticky bottom-0 flex gap-2 border-t border-graphite-200 bg-graphite-50/95 p-3 pb-safe-b backdrop-blur-sm dark:border-graphite-800 dark:bg-graphite-950/95">
        {outOfStock ? (
          <RequestPurchaseButton productName={item.name} fullWidth />
        ) : (
          <EnquiryButton productId={item.id} productName={item.name} fullWidth />
        )}
        <CallButton phone={phone} fullWidth />
      </div>
    </div>
  );
}
