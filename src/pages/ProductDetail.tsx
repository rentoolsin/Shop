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
import { useProduct } from "../hooks/useProducts";
import { formatCurrency } from "../utils/currency";
import { useSiteSettings } from "../hooks/useSiteSettings";
import { SITE_SETTINGS_DEFAULTS } from "../utils/site-settings";

export function ProductDetail() {
  const { id } = useParams<{ id: string }>();
  const product = useProduct(id);
  const settings = useSiteSettings();
  const phone = settings.status === "success" ? settings.data.phone : SITE_SETTINGS_DEFAULTS.phone;
  const [selectedVariantId, setSelectedVariantId] = useState<string | null>(null);

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

  return (
    <div>
      <PageHeader title={item.name} />

      <div className="flex aspect-[4/3] w-full items-center justify-center bg-graphite-100 dark:bg-graphite-800">
        {item.imageUrl ? (
          <img src={item.imageUrl} alt={item.name} className="h-full w-full object-cover" />
        ) : (
          <span className="font-display text-[24px] text-graphite-400">{item.name.charAt(0)}</span>
        )}
      </div>

      <div className="p-4">
        <h1 className="font-display text-[19px] font-bold text-ink dark:text-ink-inverted">
          {item.name}
        </h1>

        {item.description && (
          <p className="mt-2 font-body text-[14px] text-graphite-600 dark:text-graphite-300">
            {item.description}
          </p>
        )}

        {item.variants.length === 0 && (
          <p className="mt-4 font-body text-[13px] text-graphite-500">
            Rate and availability on enquiry.
          </p>
        )}

        {item.variants.length > 0 && (
          <div className="mt-4">
            <h2 className="font-body text-[13px] font-medium text-graphite-500">Size / variant</h2>
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

        <div className="mt-6 flex gap-2">
          {outOfStock ? (
            <RequestPurchaseButton productName={item.name} fullWidth />
          ) : (
            <EnquiryButton productId={item.id} productName={item.name} fullWidth />
          )}
          <CallButton phone={phone} />
        </div>
      </div>
    </div>
  );
}
