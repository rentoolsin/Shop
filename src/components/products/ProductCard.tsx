import { useState } from "react";
import { Link } from "react-router-dom";
import { Heart, Minus, Plus, ShoppingCart, Star } from "lucide-react";
import { Card } from "../ui/Card";
import { Button } from "../ui/Button";
import { useToast } from "../ui/Toast";
import { useCart } from "../../hooks/useCart";
import { useSavedProducts } from "../../hooks/useSavedProducts";
import { formatCurrency } from "../../utils/currency";

type Variant = "featured" | "compact" | "horizontal";

interface ProductCardProps {
  id: string;
  name: string;
  imageUrl?: string | null;
  /** Lowest daily rate across active variants — "from ₹X/day". */
  fromDailyRate: number | null;
  available: boolean;
  /** Category name for the category tag. Omit/null to hide the tag. */
  categoryName?: string | null;
  /** Average review rating (0–5). Omit/null to hide the rating tag. */
  rating?: number | null;
  /** Review count backing `rating` — shown alongside the rating tag. */
  reviewCount?: number;
  variant?: Variant;
}

export function ProductCard({
  id,
  name,
  imageUrl,
  fromDailyRate,
  available,
  categoryName,
  rating,
  reviewCount = 0,
  variant = "featured",
}: ProductCardProps) {
  const { addItem } = useCart();
  const { isSaved, toggle: toggleSaved } = useSavedProducts();
  const { showToast } = useToast();

  // Local to this card — same "reset to 1 after adding" behavior as the
  // product detail page's quantity stepper.
  const [qty, setQty] = useState(1);
  const saved = isSaved(id);

  const priceTag = (
    <span className={`spec-tag ${available ? "spec-tag--accent" : ""}`}>
      {fromDailyRate != null
        ? `${formatCurrency(fromDailyRate)}/day`
        : "Rate on enquiry"}
    </span>
  );

  const priceLine = (
    <span className="font-body text-[13px] text-graphite-500">
      {fromDailyRate != null ? (
        <>
          <span className="font-semibold text-ink dark:text-ink-inverted">
            {formatCurrency(fromDailyRate)}
          </span>{" "}
          / day
        </>
      ) : (
        "Rate on enquiry"
      )}
    </span>
  );

  // Category + rating live in one wrapping row above the name, kept
  // separate from the availability/heart controls (which anchor the image
  // so they read at a glance even before the text below has loaded/scrolled
  // into view).
  const metaRow = (categoryName || rating != null) && (
    <div className="flex flex-wrap items-center gap-1.5">
      {categoryName && (
        <span className="inline-flex items-center rounded-full bg-graphite-100 px-2 py-0.5 font-body text-[11px] font-medium text-graphite-600 dark:bg-graphite-800 dark:text-graphite-300">
          {categoryName}
        </span>
      )}
      {rating != null && (
        <span className="inline-flex items-center gap-1 font-body text-[11px] font-medium text-graphite-600 dark:text-graphite-300">
          <Star className="h-3 w-3 fill-accent-500 text-accent-500" strokeWidth={1.8} />
          {rating.toFixed(1)}
          {reviewCount > 0 && (
            <span className="text-graphite-400 dark:text-graphite-500">({reviewCount})</span>
          )}
        </span>
      )}
    </div>
  );

  // Light-tint pill anchored to the image's top-right corner — visible
  // the instant the card renders, before any text below it. Heart moves to
  // the opposite (top-left) corner so the two overlays don't collide.
  const availabilityBadge = (
    <span
      className={[
        "absolute right-1.5 top-1.5 inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 font-body text-[11px] font-medium leading-tight shadow-sm backdrop-blur-sm",
        available
          ? "bg-state-success/15 text-state-success-text dark:bg-state-success/25 dark:text-state-success-text-dark"
          : "bg-state-danger/15 text-state-danger-text dark:bg-state-danger/25 dark:text-state-danger-text-dark",
      ].join(" ")}
    >
      <span
        aria-hidden="true"
        className={["h-1.5 w-1.5 flex-shrink-0 rounded-full", available ? "bg-state-success" : "bg-state-danger"].join(" ")}
      />
      {available ? "Available" : "Unavailable"}
    </span>
  );

  // The whole card is a <Link> (tap-anywhere-to-open), so every control
  // stacked on top of it — heart, stepper, add-to-enquiry — has to stop
  // the click from bubbling into a navigation.
  const stop = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const heartButton = (
    <button
      onClick={(e) => {
        stop(e);
        toggleSaved(id);
      }}
      aria-label={saved ? "Remove from saved" : "Save this tool"}
      aria-pressed={saved}
      className={[
        "absolute left-1.5 top-1.5 flex h-7 w-7 items-center justify-center rounded-full bg-white/90 shadow-sm backdrop-blur-sm transition-all duration-150 ease-app active:scale-90 dark:bg-graphite-950/90",
        saved ? "text-accent-500" : "text-graphite-500 dark:text-graphite-300",
      ].join(" ")}
    >
      <Heart className="h-3.5 w-3.5" fill={saved ? "currentColor" : "none"} strokeWidth={1.8} />
    </button>
  );

  const quantityStepper = (
    <div className="flex items-center gap-0.5 rounded-full border border-graphite-200 dark:border-graphite-800">
      <button
        onClick={(e) => {
          stop(e);
          setQty((q) => Math.max(1, q - 1));
        }}
        aria-label="Decrease quantity"
        className="flex h-7 w-7 items-center justify-center rounded-full text-ink transition-all duration-150 ease-app active:scale-90 dark:text-ink-inverted"
      >
        <Minus className="h-3 w-3" strokeWidth={2} />
      </button>
      <span className="w-5 text-center font-body text-[12px] font-medium text-ink dark:text-ink-inverted">
        {qty}
      </span>
      <button
        onClick={(e) => {
          stop(e);
          setQty((q) => q + 1);
        }}
        aria-label="Increase quantity"
        className="flex h-7 w-7 items-center justify-center rounded-full text-ink transition-all duration-150 ease-app active:scale-90 dark:text-ink-inverted"
      >
        <Plus className="h-3 w-3" strokeWidth={2} />
      </button>
    </div>
  );

  const addToEnquiryButton = (
    <Button
      variant="outline"
      size="sm"
      fullWidth
      disabled={!available}
      className="!h-9 border-accent-400 text-[12.5px] text-accent-600 hover:bg-accent-50 dark:border-accent-500 dark:text-accent-400 dark:hover:bg-graphite-800"
      onClick={(e) => {
        stop(e);
        addItem(
          { productId: id, productName: name, dailyRate: fromDailyRate },
          qty,
        );
        showToast(`Added ${qty} × ${name} to enquiry`, "success");
        setQty(1);
      }}
    >
      <span className="inline-flex items-center gap-1.5">
        <ShoppingCart className="h-3.5 w-3.5" strokeWidth={1.8} />
        Add to enquiry
      </span>
    </Button>
  );

  const image = (
    <span className="flex h-full w-full items-center justify-center overflow-hidden bg-graphite-100 dark:bg-graphite-800">
      {imageUrl ? (
        <img src={imageUrl} alt="" className="h-full w-full object-cover" />
      ) : (
        <span className="font-display text-[13px] text-graphite-500">
          {name.charAt(0)}
        </span>
      )}
    </span>
  );

  if (variant === "horizontal") {
    return (
      <Link to={`/products/${id}`}>
        <Card interactive className="flex items-center gap-3 overflow-hidden rounded-xl p-2">
          <span className="relative h-16 w-16 flex-shrink-0 overflow-hidden rounded-lg">
            {image}
          </span>
          <div className="flex min-w-0 flex-1 flex-col gap-1">
            {metaRow}
            <span className="truncate font-body text-[14px] font-medium text-ink dark:text-ink-inverted">
              {name}
            </span>
            {priceTag}
          </div>
          <button
            onClick={(e) => {
              stop(e);
              toggleSaved(id);
            }}
            aria-label={saved ? "Remove from saved" : "Save this tool"}
            aria-pressed={saved}
            className={[
              "flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full transition-all duration-150 ease-app active:scale-90",
              saved ? "text-accent-500" : "text-graphite-400",
            ].join(" ")}
          >
            <Heart className="h-4 w-4" fill={saved ? "currentColor" : "none"} strokeWidth={1.8} />
          </button>
        </Card>
      </Link>
    );
  }

  if (variant === "compact") {
    // Unlike "featured"/"horizontal" (used in horizontally-scrolling strips, where a
    // fixed width is required), "compact" is only ever rendered inside a 2-column CSS
    // grid (Tools, Category, Search, Saved). A fixed w-32 + flex-shrink-0 here fought the
    // grid track width, so cards didn't stretch to fill their column and could end up
    // misaligned/overlapping. Let the grid column control the width instead.
    return (
      <Link to={`/products/${id}`} className="block w-full">
        <Card interactive className="flex flex-col overflow-hidden rounded-xl">
          <span className="relative aspect-square w-full">
            {image}
            {heartButton}
            {availabilityBadge}
          </span>
          <div className="flex flex-col gap-1.5 p-2.5">
            {metaRow}
            <span className="line-clamp-2 font-body text-[13px] font-medium leading-snug text-ink dark:text-ink-inverted">
              {name}
            </span>
            {priceLine}
            <div className="flex items-center justify-between">
              <span className="font-body text-[11px] text-graphite-500">Qty</span>
              {quantityStepper}
            </div>
            {addToEnquiryButton}
          </div>
        </Card>
      </Link>
    );
  }

  // featured (default)
  return (
    <Link to={`/products/${id}`} className="w-40 flex-shrink-0">
      <Card interactive className="flex flex-col overflow-hidden rounded-xl">
        <span className="relative aspect-square w-full">
          {image}
          {heartButton}
          {availabilityBadge}
        </span>
        <div className="flex flex-col gap-1.5 p-3">
          {metaRow}
          <span className="truncate font-body text-[14px] font-medium text-ink dark:text-ink-inverted">
            {name}
          </span>
          {priceLine}
          <div className="flex items-center justify-between">
            <span className="font-body text-[11px] text-graphite-500">Qty</span>
            {quantityStepper}
          </div>
          {addToEnquiryButton}
        </div>
      </Card>
    </Link>
  );
}
