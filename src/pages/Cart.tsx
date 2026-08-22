import { ShoppingCart, Tag, Trash } from "@phosphor-icons/react";
import { useMemo, useState, type ReactNode } from "react";
import { Link, useNavigate } from "react-router-dom";
import { PageHeader } from "../components/layout/PageHeader";
import { DesktopContainer } from "../components/layout/DesktopHeader";
import { EmptyState } from "../components/ui/EmptyState";
import { ErrorState } from "../components/ui/ErrorState";
import { Button } from "../components/ui/Button";
import { QuantityStepper } from "../components/ui/QuantityStepper";
import { DaysInput } from "../components/ui/DaysInput";
import { WhatsAppIcon } from "../components/icons/WhatsAppIcon";
import { ProductCard } from "../components/products/ProductCard";
import { useCart } from "../hooks/useCart";
import { useFeaturedProducts } from "../hooks/useProducts";
import { useSiteSettings } from "../hooks/useSiteSettings";
import { SITE_SETTINGS_DEFAULTS } from "../utils/site-settings";
import { formatCurrency } from "../utils/currency";
import { useDocumentMeta } from "../hooks/useDocumentMeta";

function HorizontalScroller({ children }: { children: ReactNode }) {
  return (
    <div className="flex gap-3 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
      {children}
    </div>
  );
}

export function Cart() {
  const { items, setQuantity, setItemDays, removeItem } = useCart();
  const navigate = useNavigate();
  const [promoCode, setPromoCode] = useState("");
  // Turns true the moment someone tries to continue without every line's
  // day count filled in — flips the missing fields red and shows a
  // message, rather than silently doing nothing or guessing a duration.
  const [showDaysErrors, setShowDaysErrors] = useState(false);
  const settings = useSiteSettings();
  const { whatsapp } = settings.status === "success" ? settings.data : SITE_SETTINGS_DEFAULTS;
  const featured = useFeaturedProducts();

  useDocumentMeta({ title: "Cart", noindex: true });

  // Each line has its own day count now — different tools are often
  // needed for different durations (e.g. a ladder for one day, a pipe
  // cutter for three), so a single cart-wide "number of days" field
  // couldn't express that. `daysValidFor`/`daysNumFor` read straight off
  // the item itself instead of a shared piece of state.
  const daysNumFor = (item: (typeof items)[number]) => Number(item.numberOfDays);
  const daysValidFor = (item: (typeof items)[number]) =>
    item.numberOfDays != null && item.numberOfDays !== "" && daysNumFor(item) > 0;

  const lineTotals = useMemo(
    () =>
      items.map((item) =>
        daysValidFor(item) && item.dailyRate != null ? item.dailyRate * item.quantity * daysNumFor(item) : null,
      ),
    [items],
  );
  // Only meaningful once every line has its own valid day count — a
  // partial sum (skipping lines with no days set yet) would understate
  // the order and look like a price, not an estimate.
  const allDaysValid = items.length > 0 && items.every(daysValidFor);
  const grandTotal = allDaysValid
    ? lineTotals.reduce<number | null>((sum, t) => (sum === null || t === null ? null : sum + t), 0)
    : null;

  // Total savings across all lines with a valid day count (quantity- and
  // duration-aware) — only counted where an admin-set "was" rate is
  // actually higher than the current rate, same rule as the per-card
  // "Save ₹X/day" badge on Products/ProductDetail.
  const totalSavingsPerDay = items.reduce((sum, item) => {
    const saving =
      item.originalDailyRate != null && item.dailyRate != null && item.originalDailyRate > item.dailyRate
        ? (item.originalDailyRate - item.dailyRate) * item.quantity
        : 0;
    return sum + saving;
  }, 0);
  const totalSavingsAmount = items.reduce((sum, item) => {
    if (!daysValidFor(item)) return sum;
    const saving =
      item.originalDailyRate != null && item.dailyRate != null && item.originalDailyRate > item.dailyRate
        ? (item.originalDailyRate - item.dailyRate) * item.quantity * daysNumFor(item)
        : 0;
    return sum + saving;
  }, 0);

  const handleCheckout = () => {
    if (!allDaysValid) {
      // Stop here rather than sending an incomplete order through —
      // flip on the per-line red borders and a message instead.
      setShowDaysErrors(true);
      return;
    }
    navigate("/enquire", {
      state: {
        cartItems: items.map((i) => ({
          productId: i.productId,
          productName: i.productName,
          variantLabel: i.variantLabel,
          dailyRate: i.dailyRate,
          quantity: i.quantity,
          numberOfDays: i.numberOfDays || undefined,
        })),
      },
    });
  };

  // No coupon system exists behind this app — rather than a fake "Apply"
  // field that silently does nothing, a promo code goes straight to
  // WhatsApp with the cart contents attached, so a real person can confirm
  // it. Keeps the field honest about what it actually does.
  const cartSummaryLines = items
    .map((i) => `- ${i.productName}${i.variantLabel ? ` (${i.variantLabel})` : ""} × ${i.quantity}`)
    .join("\n");
  const promoWaHref = `https://wa.me/${whatsapp}?text=${encodeURIComponent(
    `Hi RenTools, I have a promo code${promoCode.trim() ? ` (${promoCode.trim()})` : ""} — could you check it against this order?\n${cartSummaryLines}`,
  )}`;

  const cartProductIds = new Set(items.map((i) => i.productId));
  const crossSellProducts =
    featured.status === "success" ? featured.data.filter((p) => !cartProductIds.has(p.id)).slice(0, 8) : [];

  if (items.length === 0) {
    return (
      <div>
        <div className="md:hidden">
          <PageHeader title="Cart" />
          <div className="px-4 pt-4">
            <EmptyState
              icon={<ShoppingCart className="h-5 w-5" weight="regular" />}
              title="Your cart is empty"
              description="Add a tool from its page to build a multi-item enquiry."
              action={
                <Link to="/products">
                  <Button variant="secondary">Browse tools</Button>
                </Link>
              }
            />
          </div>
        </div>
        <div className="hidden md:block">
          <DesktopContainer className="py-16">
            <EmptyState
              icon={<ShoppingCart className="h-5 w-5" weight="regular" />}
              title="Your cart is empty"
              description="Add a tool from its page to build a multi-item enquiry."
              action={
                <Link to="/products">
                  <Button variant="secondary">Browse tools</Button>
                </Link>
              }
            />
          </DesktopContainer>
        </div>
      </div>
    );
  }

  return (
    <div>
      {/* Mobile / narrow-viewport layout */}
      <div className="md:hidden">
      <PageHeader title="Cart" />

      <div className="space-y-3 p-4">
        {items.map((item, index) => (
          <div
            key={item.productId}
            className="rounded border border-graphite-200 p-3.5 dark:border-graphite-800"
          >
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <Link
                  to={`/products/${item.productId}`}
                  className="truncate font-body text-[14px] font-medium text-ink hover:underline dark:text-ink-inverted"
                >
                  {item.productName}
                </Link>
                {item.variantLabel && (
                  <span className="mt-1 block font-body text-[12px] text-graphite-500">
                    {item.variantLabel}
                  </span>
                )}
                {item.dailyRate != null && (
                  <span className="mt-1 flex flex-wrap items-center gap-1.5">
                    <span className="font-body text-[13px] text-graphite-600 dark:text-graphite-300">
                      {formatCurrency(item.dailyRate)} / day
                    </span>
                    {item.originalDailyRate != null && item.originalDailyRate > item.dailyRate && (
                      <span className="font-body text-[12px] text-graphite-400 line-through dark:text-graphite-500">
                        {formatCurrency(item.originalDailyRate)}
                      </span>
                    )}
                    {item.originalDailyRate != null && item.originalDailyRate > item.dailyRate && (
                      <span className="inline-flex w-fit items-center rounded-full border border-savings-border bg-savings-bg px-2 py-0.5 font-body text-[10px] font-bold text-savings-text dark:border-savings-border-dark dark:bg-savings-bg-dark dark:text-savings-text-dark">
                        Save {formatCurrency(item.originalDailyRate - item.dailyRate)}/day
                      </span>
                    )}
                  </span>
                )}
              </div>
              <button
                onClick={() => removeItem(item.productId)}
                aria-label={`Remove ${item.productName} from cart`}
                className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full text-graphite-400 transition-all duration-150 ease-app hover:bg-graphite-100 hover:text-state-danger active:scale-90 dark:hover:bg-graphite-800"
              >
                <Trash className="h-4 w-4" weight="regular" />
              </button>
            </div>

            <div className="mt-3 flex items-center justify-between gap-2">
              <span className="flex items-center gap-1.5 font-body text-[12px] text-graphite-500">
                Days
                <DaysInput
                  value={item.numberOfDays}
                  onChange={(value) => setItemDays(item.productId, value)}
                  label={`Number of days for ${item.productName}`}
                  error={showDaysErrors && !daysValidFor(item)}
                />
              </span>
              <QuantityStepper
                size="sm"
                quantity={item.quantity}
                onDecrease={() => setQuantity(item.productId, item.quantity - 1)}
                onIncrease={() => setQuantity(item.productId, item.quantity + 1)}
              />
              {lineTotals[index] !== null && (
                <span className="font-body text-[13.5px] font-semibold text-ink dark:text-ink-inverted">
                  {formatCurrency(lineTotals[index]!)}
                </span>
              )}
            </div>
          </div>
        ))}

        {showDaysErrors && !allDaysValid ? (
          <p className="px-0.5 font-body text-[12px] text-state-danger-text dark:text-state-danger-text-dark">
            Enter the number of days for every tool before continuing.
          </p>
        ) : (
          <p className="px-0.5 font-body text-[12px] text-graphite-500">
            Set the number of days for each tool above to see its line total. Note: some tools may have a minimum
            rental period — we'll confirm when you enquire.
          </p>
        )}

        {/* No automated coupon system — a code goes to a real person on
            WhatsApp along with the cart, rather than a field that "applies"
            nothing. */}
        <div className="rounded border border-dashed border-graphite-300 p-3.5 dark:border-graphite-700">
          <label className="mb-1.5 flex items-center gap-1.5 font-body text-[13px] font-medium text-graphite-600 dark:text-graphite-300">
            <Tag className="h-4 w-4 flex-shrink-0" weight="regular" />
            Have a promo code?
          </label>
          <div className="flex gap-2">
            <input
              type="text"
              value={promoCode}
              onChange={(e) => setPromoCode(e.target.value)}
              placeholder="Enter code"
              className="h-10 flex-1 min-w-0 rounded border border-graphite-300 bg-white px-3 font-body text-[13.5px] text-ink outline-none focus:border-accent-500 dark:border-graphite-700 dark:bg-graphite-900 dark:text-ink-inverted"
            />
            <a
              href={promoWaHref}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex h-10 flex-shrink-0 items-center gap-1.5 rounded bg-accent-500 px-3.5 font-body text-[13px] font-semibold text-graphite-950 transition-all active:scale-[0.97]"
            >
              <WhatsAppIcon className="h-4 w-4" />
              Ask
            </a>
          </div>
        </div>

        {totalSavingsPerDay > 0 && (
          <div className="rounded border border-savings-border bg-savings-bg px-3.5 py-2.5 dark:border-savings-border-dark dark:bg-savings-bg-dark">
            <div className="flex items-center justify-between">
              <span className="font-body text-[12.5px] font-medium text-savings-text dark:text-savings-text-dark">
                You're saving
              </span>
              <span className="font-display text-[14px] font-bold text-savings-text dark:text-savings-text-dark">
                {formatCurrency(totalSavingsPerDay)}/day
              </span>
            </div>
            {totalSavingsAmount > 0 && (
              <div className="mt-1 flex items-center justify-between border-t border-savings-border/60 pt-1 dark:border-savings-border-dark/60">
                <span className="font-body text-[11.5px] text-savings-text dark:text-savings-text-dark">
                  Total savings
                </span>
                <span className="font-body text-[12.5px] font-bold text-savings-text dark:text-savings-text-dark">
                  {formatCurrency(totalSavingsAmount)}
                </span>
              </div>
            )}
          </div>
        )}

        {grandTotal !== null && (
          <div className="flex items-center justify-between rounded border border-accent-200 bg-accent-50 px-3.5 py-3 dark:border-accent-500/30 dark:bg-graphite-900">
            <span className="font-body text-[13px] text-graphite-600 dark:text-graphite-300">
              Estimated total
            </span>
            <span className="font-display text-[16px] font-bold text-ink dark:text-ink-inverted">
              {formatCurrency(grandTotal)}
            </span>
          </div>
        )}

        <Button variant="accent" fullWidth onClick={handleCheckout}>
          Continue to enquiry ({items.reduce((n, i) => n + i.quantity, 0)} item
          {items.reduce((n, i) => n + i.quantity, 0) === 1 ? "" : "s"})
        </Button>
      </div>

      {/* Cross-sell — surfaces a few more tools without derailing checkout;
          filtered so nothing already in the cart shows up again. */}
      {featured.status === "error" && (
        <div className="px-4 pb-4">
          <ErrorState title="Couldn't load suggestions" onRetry={featured.refetch} />
        </div>
      )}
      {crossSellProducts.length > 0 && (
        <section className="pb-6 pt-1">
          <h2 className="mb-2 px-4 font-display text-[13px] font-semibold text-ink dark:text-ink-inverted">
            You might also need
          </h2>
          <div className="px-4">
            <HorizontalScroller>
              {crossSellProducts.map((product) => (
                <ProductCard key={product.id} {...product} variant="featured" />
              ))}
            </HorizontalScroller>
          </div>
        </section>
      )}
      </div>

      {/* Desktop / wide-viewport layout — classic cart pattern: line
          items in a wide left column, order summary in a sticky card on
          the right, cross-sell as a full-width grid below. */}
      <div className="hidden md:block">
        <DesktopContainer className="py-10">
          <h1 className="font-display text-[28px] font-extrabold text-ink dark:text-ink-inverted">
            Your cart
          </h1>

          <div className="mt-8 grid grid-cols-[1fr_380px] items-start gap-10">
            {/* Line items */}
            <div className="space-y-3">
              {items.map((item, index) => (
                <div
                  key={item.productId}
                  className="flex items-center gap-4 rounded border border-graphite-200 p-4 dark:border-graphite-800"
                >
                  <div className="min-w-0 flex-1">
                    <Link
                      to={`/products/${item.productId}`}
                      className="truncate font-body text-[15px] font-medium text-ink hover:underline dark:text-ink-inverted"
                    >
                      {item.productName}
                    </Link>
                    {item.variantLabel && (
                      <span className="mt-1 block font-body text-[12.5px] text-graphite-500">
                        {item.variantLabel}
                      </span>
                    )}
                    {item.dailyRate != null && (
                      <span className="mt-1 flex flex-wrap items-center gap-1.5">
                        <span className="font-body text-[13.5px] text-graphite-600 dark:text-graphite-300">
                          {formatCurrency(item.dailyRate)} / day
                        </span>
                        {item.originalDailyRate != null && item.originalDailyRate > item.dailyRate && (
                          <span className="font-body text-[12.5px] text-graphite-400 line-through dark:text-graphite-500">
                            {formatCurrency(item.originalDailyRate)}
                          </span>
                        )}
                        {item.originalDailyRate != null && item.originalDailyRate > item.dailyRate && (
                          <span className="inline-flex w-fit items-center rounded-full border border-savings-border bg-savings-bg px-2 py-0.5 font-body text-[10.5px] font-bold text-savings-text dark:border-savings-border-dark dark:bg-savings-bg-dark dark:text-savings-text-dark">
                            Save {formatCurrency(item.originalDailyRate - item.dailyRate)}/day
                          </span>
                        )}
                      </span>
                    )}
                  </div>

                  <span className="flex flex-shrink-0 items-center gap-1.5 font-body text-[12px] text-graphite-500">
                    Days
                    <DaysInput
                      value={item.numberOfDays}
                      onChange={(value) => setItemDays(item.productId, value)}
                      label={`Number of days for ${item.productName}`}
                      error={showDaysErrors && !daysValidFor(item)}
                    />
                  </span>

                  <QuantityStepper
                    size="sm"
                    quantity={item.quantity}
                    onDecrease={() => setQuantity(item.productId, item.quantity - 1)}
                    onIncrease={() => setQuantity(item.productId, item.quantity + 1)}
                  />

                  {lineTotals[index] !== null && (
                    <span className="w-24 flex-shrink-0 text-right font-body text-[14.5px] font-semibold text-ink dark:text-ink-inverted">
                      {formatCurrency(lineTotals[index]!)}
                    </span>
                  )}

                  <button
                    onClick={() => removeItem(item.productId)}
                    aria-label={`Remove ${item.productName} from cart`}
                    className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full text-graphite-400 transition-all duration-150 ease-app hover:bg-graphite-100 hover:text-state-danger dark:hover:bg-graphite-800"
                  >
                    <Trash className="h-4 w-4" weight="regular" />
                  </button>
                </div>
              ))}

              {/* Cross-sell */}
              {featured.status === "error" && (
                <ErrorState title="Couldn't load suggestions" onRetry={featured.refetch} />
              )}
              {crossSellProducts.length > 0 && (
                <section className="pt-6">
                  <h2 className="mb-4 font-display text-[15px] font-semibold text-ink dark:text-ink-inverted">
                    You might also need
                  </h2>
                  <div className="grid grid-cols-3 gap-5">
                    {crossSellProducts.slice(0, 6).map((product) => (
                      <ProductCard key={product.id} {...product} variant="compact" />
                    ))}
                  </div>
                </section>
              )}
            </div>

            {/* Order summary — sticky */}
            <div className="sticky top-28 space-y-4 rounded-lg border border-graphite-200 bg-white p-5 dark:border-graphite-800 dark:bg-graphite-900">
              <h2 className="font-display text-[16px] font-semibold text-ink dark:text-ink-inverted">
                Order summary
              </h2>

              {showDaysErrors && !allDaysValid ? (
                <p className="font-body text-[12.5px] text-state-danger-text dark:text-state-danger-text-dark">
                  Enter the number of days for every tool before continuing.
                </p>
              ) : (
                <p className="font-body text-[12.5px] text-graphite-500">
                  Set the number of days for each tool in the list to see an estimated total. We'll confirm any
                  minimum rental period when you enquire.
                </p>
              )}

              <div className="rounded border border-dashed border-graphite-300 p-3.5 dark:border-graphite-700">
                <label className="mb-1.5 flex items-center gap-1.5 font-body text-[13px] font-medium text-graphite-600 dark:text-graphite-300">
                  <Tag className="h-4 w-4 flex-shrink-0" weight="regular" />
                  Have a promo code?
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={promoCode}
                    onChange={(e) => setPromoCode(e.target.value)}
                    placeholder="Enter code"
                    className="h-10 flex-1 min-w-0 rounded border border-graphite-300 bg-white px-3 font-body text-[13.5px] text-ink outline-none focus:border-accent-500 dark:border-graphite-700 dark:bg-graphite-900 dark:text-ink-inverted"
                  />
                  <a
                    href={promoWaHref}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex h-10 flex-shrink-0 items-center gap-1.5 rounded bg-accent-500 px-3.5 font-body text-[13px] font-semibold text-graphite-950 transition-all hover:bg-accent-400 active:scale-[0.97]"
                  >
                    <WhatsAppIcon className="h-4 w-4" />
                    Ask
                  </a>
                </div>
              </div>

              {totalSavingsPerDay > 0 && (
                <div className="rounded border border-savings-border bg-savings-bg px-3.5 py-2.5 dark:border-savings-border-dark dark:bg-savings-bg-dark">
                  <div className="flex items-center justify-between">
                    <span className="font-body text-[12.5px] font-medium text-savings-text dark:text-savings-text-dark">
                      You're saving
                    </span>
                    <span className="font-display text-[14px] font-bold text-savings-text dark:text-savings-text-dark">
                      {formatCurrency(totalSavingsPerDay)}/day
                    </span>
                  </div>
                  {totalSavingsAmount > 0 && (
                    <div className="mt-1 flex items-center justify-between border-t border-savings-border/60 pt-1 dark:border-savings-border-dark/60">
                      <span className="font-body text-[11.5px] text-savings-text dark:text-savings-text-dark">
                        Total savings
                      </span>
                      <span className="font-body text-[12.5px] font-bold text-savings-text dark:text-savings-text-dark">
                        {formatCurrency(totalSavingsAmount)}
                      </span>
                    </div>
                  )}
                </div>
              )}

              {grandTotal !== null && (
                <div className="flex items-center justify-between rounded border border-accent-200 bg-accent-50 px-3.5 py-3 dark:border-accent-500/30 dark:bg-graphite-950/40">
                  <span className="font-body text-[13px] text-graphite-600 dark:text-graphite-300">
                    Estimated total
                  </span>
                  <span className="font-display text-[16px] font-bold text-ink dark:text-ink-inverted">
                    {formatCurrency(grandTotal)}
                  </span>
                </div>
              )}

              <Button variant="accent" size="lg" fullWidth onClick={handleCheckout}>
                Continue to enquiry ({items.reduce((n, i) => n + i.quantity, 0)} item
                {items.reduce((n, i) => n + i.quantity, 0) === 1 ? "" : "s"})
              </Button>
            </div>
          </div>
        </DesktopContainer>
      </div>
    </div>
  );
}
