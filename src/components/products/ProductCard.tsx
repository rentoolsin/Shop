import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Heart, Star } from "@phosphor-icons/react";
import { Card } from "../ui/Card";
import { QuantityStepper } from "../ui/QuantityStepper";
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
  /** Admin-set "was" rate, shown struck through next to fromDailyRate. Null = no strikethrough. */
  originalFromDailyRate?: number | null;
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
  originalFromDailyRate,
  available,
  categoryName,
  rating,
  reviewCount = 0,
  variant = "featured",
}: ProductCardProps) {
  const { addItem } = useCart();
  const { isSaved, toggle: toggleSaved } = useSavedProducts();
  const { showToast } = useToast();
  const navigate = useNavigate();

  // Local to this card — same "reset to 1 after adding" behavior as the
  // product detail page's quantity stepper.
  const [qty, setQty] = useState(1);
  const saved = isSaved(id);

  const strikethroughPrice = originalFromDailyRate != null && (
    <span className="font-body text-[12px] text-graphite-400 line-through dark:text-graphite-500">
      {formatCurrency(originalFromDailyRate)}
    </span>
  );

  // "Save ₹X/day" badge — only when there's an admin-set original rate
  // that's actually higher than the current rate (never shown for a
  // strikethrough that isn't really a discount).
  const savingsAmount =
    originalFromDailyRate != null && fromDailyRate != null && originalFromDailyRate > fromDailyRate
      ? originalFromDailyRate - fromDailyRate
      : null;

  const saveBadge = savingsAmount != null && (
    <span className="inline-flex w-fit items-center rounded-full border border-savings-border bg-savings-bg px-2 py-0.5 font-body text-[10.5px] font-bold text-savings-text dark:border-savings-border-dark dark:bg-savings-bg-dark dark:text-savings-text-dark">
      Save {formatCurrency(savingsAmount)}/day
    </span>
  );

  const priceTag = (
    <span className="inline-flex items-center gap-1.5">
      <span className={`spec-tag ${available ? "spec-tag--accent" : ""}`}>
        {fromDailyRate != null
          ? `${formatCurrency(fromDailyRate)}/day`
          : "Rate on enquiry"}
      </span>
      {strikethroughPrice}
    </span>
  );

  const priceLine = (
    <span className="flex items-center gap-1.5">
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
      {strikethroughPrice}
    </span>
  );

  // Grayscale the image and stamp "Out of stock" boldly across it — this
  // needs to be unmissable at a glance, since it's the one thing that
  // should stop someone from tapping "Add to enquiry". Smaller badge for
  // the 64px horizontal thumbnail, where the full-size badge would overflow.
  const outOfStockOverlay = (size: "sm" | "lg" = "lg") =>
    !available && (
      <span
        aria-hidden="true"
        className="absolute inset-0 flex items-center justify-center bg-graphite-950/45"
      >
        <span
          className={[
            "rotate-[-8deg] rounded bg-graphite-950/85 font-display font-bold uppercase tracking-wide text-white shadow-sm",
            size === "lg" ? "px-3 py-1 text-[13px]" : "px-1.5 py-0.5 text-[8px] tracking-tight",
          ].join(" ")}
        >
          Out of stock
        </span>
      </span>
    );

  // Category + rating live in one wrapping row above the name, kept
  // separate from the availability/heart controls (which anchor the image
  // so they read at a glance even before the text below has loaded/scrolled
  // into view).
  const metaRow = (categoryName || rating != null) && (
    <div className="flex flex-wrap items-center gap-1.5">
      {categoryName && (
        <span className="inline-flex items-center font-body text-[11px] font-semibold text-accent-600 dark:text-accent-400">
          {categoryName}
        </span>
      )}
      {rating != null && (
        <span className="inline-flex items-center gap-1 font-body text-[11px] font-medium text-graphite-600 dark:text-graphite-300">
          <Star className="h-3 w-3 fill-accent-500 text-accent-500" weight="regular" />
          {rating.toFixed(1)}
          {reviewCount > 0 && (
            <span className="text-graphite-400 dark:text-graphite-500">({reviewCount})</span>
          )}
        </span>
      )}
    </div>
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
      <Heart className="h-3.5 w-3.5" weight={saved ? "fill" : "regular"} />
    </button>
  );

  const quantityStepper = (
    <QuantityStepper
      size="xs"
      quantity={qty}
      onDecrease={(e) => {
        stop(e);
        setQty((q) => Math.max(1, q - 1));
      }}
      onIncrease={(e) => {
        stop(e);
        setQty((q) => q + 1);
      }}
    />
  );

  const handleAddToCart = (e: React.MouseEvent<HTMLButtonElement>) => {
    stop(e);
    addItem(
      { productId: id, productName: name, dailyRate: fromDailyRate, originalDailyRate: originalFromDailyRate },
      qty,
    );
    showToast(`Added ${qty} × ${name} to cart`, "success", {
      action: { label: "View cart", onClick: () => navigate("/cart") },
    });
    setQty(1);
  };

  const handleRequestTool = (e: React.MouseEvent<HTMLButtonElement>) => {
    stop(e);
    navigate("/request-purchase", { state: { productName: name } });
  };

  // Out of stock: there's nothing to add a quantity of, so the whole pill
  // becomes a single "Request" button that sends the person to the
  // out-of-stock request form with this tool's name pre-filled.
  const requestControl = (
    <button
      type="button"
      aria-label={`Request ${name}`}
      onClick={handleRequestTool}
      className="flex h-9 w-full items-center justify-center overflow-hidden rounded border border-graphite-200 bg-accent-500 px-1.5 font-body text-[11.5px] font-semibold text-graphite-950 whitespace-nowrap transition-all duration-150 ease-app active:scale-[0.98] active:bg-accent-600 dark:border-graphite-700"
    >
      Request
    </button>
  );

  // Stepper + Add button as ONE bordered control — a single outer pill
  // (not two separate elements with a gap between them) so the orange
  // "Add" segment sits flush against the pill's own right edge and
  // shares its corner radius, matching the reference design. The
  // stepper's mini bordered buttons sit inside on the left; the Add
  // button is the only flexible part and fills (and stretches to) the
  // rest of the pill, so it never overflows the card on narrow layouts.
  const addControl = (
    <div className="flex h-9 min-w-0 items-center overflow-hidden rounded border border-graphite-200 bg-white dark:border-graphite-700 dark:bg-graphite-900">
      <div className="flex flex-shrink-0 items-center pl-1 pr-1">{quantityStepper}</div>
      <button
        type="button"
        aria-label={`Add ${name} to cart`}
        onClick={handleAddToCart}
        className="flex h-full flex-1 items-center justify-center overflow-hidden bg-accent-500 px-1.5 font-body text-[11.5px] font-semibold text-graphite-950 whitespace-nowrap transition-all duration-150 ease-app active:scale-[0.98] active:bg-accent-600"
      >
        Add
      </button>
    </div>
  );

  const cartControls = available ? addControl : requestControl;

  const image = (
    <span
      className={[
        "flex h-full w-full items-center justify-center overflow-hidden bg-graphite-100 dark:bg-graphite-800",
        !available ? "grayscale" : "",
      ].join(" ")}
    >
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
        <Card interactive className="flex items-center gap-3 overflow-hidden rounded p-2">
          <span className="relative h-16 w-16 flex-shrink-0 overflow-hidden rounded">
            {image}
            {outOfStockOverlay("sm")}
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
            <Heart className="h-4 w-4" weight={saved ? "fill" : "regular"} />
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
        <Card interactive className="flex flex-col overflow-hidden rounded">
          <span className="relative aspect-square w-full">
            {image}
            {heartButton}
            {outOfStockOverlay()}
          </span>
          <div className="flex flex-col gap-1.5 p-2.5">
            {metaRow}
            <span className="line-clamp-2 font-body text-[13px] font-medium leading-snug text-ink dark:text-ink-inverted">
              {name}
            </span>
            {priceLine}
            {saveBadge}
            {cartControls}
          </div>
        </Card>
      </Link>
    );
  }

  // featured (default)
  return (
    <Link to={`/products/${id}`} className="w-40 flex-shrink-0">
      <Card interactive className="flex flex-col overflow-hidden rounded">
        <span className="relative aspect-square w-full">
          {image}
          {heartButton}
          {outOfStockOverlay()}
        </span>
        <div className="flex flex-col gap-1.5 p-3">
          {metaRow}
          <span className="truncate font-body text-[14px] font-medium text-ink dark:text-ink-inverted">
            {name}
          </span>
          {priceLine}
          {saveBadge}
          {cartControls}
        </div>
      </Card>
    </Link>
  );
}
