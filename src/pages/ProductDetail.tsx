import { Check, Heart, Minus, Plus, ShieldCheck, ShoppingCart, Truck } from "lucide-react";
import { useState, type FormEvent } from "react";
import { Link, useParams } from "react-router-dom";
import { PageHeader } from "../components/layout/PageHeader";
import { Skeleton } from "../components/ui/Skeleton";
import { ErrorState } from "../components/ui/ErrorState";
import { EmptyState } from "../components/ui/EmptyState";
import { StatusBadge } from "../components/ui/StatusBadge";
import { BottomSheet } from "../components/ui/BottomSheet";
import { Button } from "../components/ui/Button";
import { Input } from "../components/ui/Input";
import { Textarea } from "../components/ui/Textarea";
import { StarRatingDisplay, StarRatingPicker } from "../components/ui/StarRating";
import { useToast } from "../components/ui/Toast";
import { EnquiryButton } from "../components/actions/EnquiryButton";
import { RequestPurchaseButton } from "../components/actions/RequestPurchaseButton";
import { ImageCarousel } from "../components/products/ImageCarousel";
import { useProduct, useProducts } from "../hooks/useProducts";
import { ProductCard } from "../components/products/ProductCard";
import { formatCurrency } from "../utils/currency";
import { formatRelativeTime } from "../utils/relative-time";
import { parseProductDescription } from "../utils/product-features";
import { useBottomBarHeight } from "../hooks/useBottomBarHeight";
import { useSavedProducts } from "../hooks/useSavedProducts";
import { useCart } from "../hooks/useCart";
import { useProductReviews } from "../hooks/useProductReviews";
import { submitReview } from "../services/reviews.service";
import { useDocumentMeta } from "../hooks/useDocumentMeta";
// Aliased — this file's own component is also named ProductDetail.
import type { ProductDetail as ProductDetailData } from "../services/products.service";

function HeartIcon({ filled }: { filled: boolean }) {
  return <Heart fill={filled ? "currentColor" : "none"} strokeWidth={1.8} className="h-5 w-5" />;
}

interface ReviewFormValues {
  name: string;
  rating: number;
  comment: string;
}

const EMPTY_REVIEW_FORM: ReviewFormValues = { name: "", rating: 0, comment: "" };

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
  const [selectedVariantId, setSelectedVariantId] = useState<string | null>(null);
  const { isSaved, toggle: toggleSaved } = useSavedProducts();
  const { addItem, totalItems: cartCount } = useCart();
  const { showToast } = useToast();
  const [cartQty, setCartQty] = useState(1);
  const bottomBarHeight = useBottomBarHeight();

  const reviews = useProductReviews(id);
  const [reviewSheetOpen, setReviewSheetOpen] = useState(false);
  const [reviewForm, setReviewForm] = useState<ReviewFormValues>(EMPTY_REVIEW_FORM);
  const [reviewErrors, setReviewErrors] = useState<Partial<Record<keyof ReviewFormValues, string>>>({});
  const [submittingReview, setSubmittingReview] = useState(false);
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

  const handleAddToCart = () => {
    addItem(
      {
        productId: item.id,
        productName: item.name,
        variantLabel: activeVariant?.label,
        dailyRate: activeVariant?.dailyRate ?? null,
      },
      cartQty,
    );
    showToast(`Added ${cartQty} × ${item.name} to cart`, "success");
    setCartQty(1);
  };

  const handleReviewSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (submittingReview) return;

    const errors: Partial<Record<keyof ReviewFormValues, string>> = {};
    if (!reviewForm.name.trim()) errors.name = "Enter your name.";
    if (reviewForm.rating < 1) errors.rating = "Pick a star rating.";
    setReviewErrors(errors);
    if (Object.keys(errors).length > 0) return;

    setSubmittingReview(true);
    try {
      await submitReview({
        productId: item.id,
        name: reviewForm.name.trim(),
        rating: reviewForm.rating,
        comment: reviewForm.comment.trim() || undefined,
      });
      showToast("Thanks for your review!", "success");
      setReviewForm(EMPTY_REVIEW_FORM);
      setReviewErrors({});
      setReviewSheetOpen(false);
      reviews.refetch();
    } catch {
      showToast("Couldn't submit your review. Try again.", "danger");
    } finally {
      setSubmittingReview(false);
    }
  };

  return (
    <div>
      <PageHeader
        title={item.name}
        action={
          <div className="mr-1 flex items-center">
            <Link
              to="/cart"
              aria-label={`Cart${cartCount > 0 ? ` (${cartCount})` : ""}`}
              className="relative flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full text-ink hover:bg-graphite-100 dark:text-ink-inverted dark:hover:bg-graphite-800"
            >
              <ShoppingCart className="h-5 w-5" strokeWidth={1.8} />
              {cartCount > 0 && (
                <span className="absolute right-1.5 top-1.5 flex h-2 w-2 rounded-full bg-accent-500" />
              )}
            </Link>
            <button
              onClick={() => toggleSaved(item.id)}
              aria-label={isSaved(item.id) ? "Remove from saved" : "Save this tool"}
              className={[
                "flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full transition-all duration-150 ease-app active:scale-90",
                isSaved(item.id)
                  ? "text-accent-500 hover:bg-graphite-100 dark:hover:bg-graphite-800"
                  : "text-ink hover:bg-graphite-100 dark:text-ink-inverted dark:hover:bg-graphite-800",
              ].join(" ")}
            >
              <HeartIcon filled={isSaved(item.id)} />
            </button>
          </div>
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

            {!outOfStock && (
              <div className="mt-3 flex items-center gap-2">
                <div className="flex items-center gap-1 rounded-full border border-graphite-200 dark:border-graphite-800">
                  <button
                    onClick={() => setCartQty((q) => Math.max(1, q - 1))}
                    aria-label="Decrease quantity"
                    className="flex h-9 w-9 items-center justify-center rounded-full text-ink transition-all duration-150 ease-app active:scale-90 dark:text-ink-inverted"
                  >
                    <Minus className="h-3.5 w-3.5" strokeWidth={2} />
                  </button>
                  <span className="w-6 text-center font-body text-[13px] font-medium text-ink dark:text-ink-inverted">
                    {cartQty}
                  </span>
                  <button
                    onClick={() => setCartQty((q) => q + 1)}
                    aria-label="Increase quantity"
                    className="flex h-9 w-9 items-center justify-center rounded-full text-ink transition-all duration-150 ease-app active:scale-90 dark:text-ink-inverted"
                  >
                    <Plus className="h-3.5 w-3.5" strokeWidth={2} />
                  </button>
                </div>
                <Button variant="secondary" className="flex-1" onClick={handleAddToCart}>
                  <span className="inline-flex items-center gap-2">
                    <ShoppingCart className="h-4 w-4" strokeWidth={1.8} />
                    Add to cart
                  </span>
                </Button>
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

        <div className="mt-6">
          <div className="flex items-center justify-between">
            <h3 className="font-body text-[15px] font-semibold text-ink dark:text-ink-inverted">
              Ratings & Reviews
            </h3>
            <button
              onClick={() => setReviewSheetOpen(true)}
              className="font-body text-[13px] font-medium text-accent-500 hover:underline"
            >
              Write a review
            </button>
          </div>

          {reviews.status === "loading" && (
            <div className="mt-2 space-y-2">
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-16 w-full" />
            </div>
          )}

          {reviews.status === "success" && reviews.data.count === 0 && (
            <p className="mt-2 font-body text-[13px] text-graphite-500">
              No reviews yet — be the first to rate this tool.
            </p>
          )}

          {reviews.status === "success" && reviews.data.count > 0 && (
            <>
              <div className="mt-2 flex items-center gap-2">
                <StarRatingDisplay value={reviews.data.averageRating ?? 0} size="md" />
                <span className="font-body text-[14px] font-semibold text-ink dark:text-ink-inverted">
                  {reviews.data.averageRating!.toFixed(1)}
                </span>
                <span className="font-body text-[13px] text-graphite-500">
                  ({reviews.data.count} review{reviews.data.count === 1 ? "" : "s"})
                </span>
              </div>

              <ul className="mt-4 space-y-4">
                {reviews.data.reviews.map((review) => (
                  <li
                    key={review.id}
                    className="border-b border-graphite-200 pb-4 last:border-b-0 last:pb-0 dark:border-graphite-800"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-body text-[13.5px] font-medium text-ink dark:text-ink-inverted">
                        {review.name}
                      </span>
                      <span className="font-body text-[11.5px] text-graphite-400">
                        {formatRelativeTime(review.createdAt)}
                      </span>
                    </div>
                    <StarRatingDisplay value={review.rating} className="mt-1" />
                    {review.comment && (
                      <p className="mt-1.5 font-body text-[13.5px] leading-relaxed text-graphite-600 dark:text-graphite-300">
                        {review.comment}
                      </p>
                    )}
                  </li>
                ))}
              </ul>
            </>
          )}
        </div>
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
          dock occupies, hiding the most important button on this
          page (Enquire/Request) underneath it once scrolled. */}
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
      </div>

      <BottomSheet
        open={reviewSheetOpen}
        onClose={() => setReviewSheetOpen(false)}
        title={`Review ${item.name}`}
      >
        <form onSubmit={handleReviewSubmit} className="space-y-4" noValidate>
          <Input
            label="Name"
            value={reviewForm.name}
            onChange={(e) => setReviewForm((f) => ({ ...f, name: e.target.value }))}
            error={reviewErrors.name ? reviewErrors.name : undefined}
            placeholder="Your name"
          />
          <StarRatingPicker
            value={reviewForm.rating}
            onChange={(rating) => setReviewForm((f) => ({ ...f, rating }))}
            error={reviewErrors.rating}
          />
          <Textarea
            label="Comment"
            value={reviewForm.comment}
            onChange={(e) => setReviewForm((f) => ({ ...f, comment: e.target.value }))}
            placeholder="How was the tool and the rental experience? (optional)"
          />
          <Button type="submit" fullWidth disabled={submittingReview}>
            {submittingReview ? "Submitting…" : "Submit review"}
          </Button>
        </form>
      </BottomSheet>
    </div>
  );
}
