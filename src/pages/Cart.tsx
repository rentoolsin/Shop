import { Minus, Plus, ShoppingCart, Trash2 } from "lucide-react";
import { useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { PageHeader } from "../components/layout/PageHeader";
import { EmptyState } from "../components/ui/EmptyState";
import { Button } from "../components/ui/Button";
import { Input } from "../components/ui/Input";
import { useCart } from "../hooks/useCart";
import { formatCurrency } from "../utils/currency";
import { useDocumentMeta } from "../hooks/useDocumentMeta";

export function Cart() {
  const { items, setQuantity, removeItem } = useCart();
  const navigate = useNavigate();
  const [numberOfDays, setNumberOfDays] = useState("");

  useDocumentMeta({ title: "Cart", noindex: true });

  const daysNum = Number(numberOfDays);
  const daysValid = numberOfDays !== "" && daysNum > 0;

  const lineTotals = useMemo(
    () =>
      items.map((item) =>
        daysValid && item.dailyRate != null ? item.dailyRate * item.quantity * daysNum : null,
      ),
    [items, daysValid, daysNum],
  );
  const grandTotal = daysValid
    ? lineTotals.reduce<number | null>((sum, t) => (sum === null || t === null ? null : sum + t), 0)
    : null;

  const handleCheckout = () => {
    navigate("/enquire", {
      state: {
        cartItems: items.map((i) => ({
          productId: i.productId,
          productName: i.productName,
          variantLabel: i.variantLabel,
          dailyRate: i.dailyRate,
          quantity: i.quantity,
        })),
        numberOfDays: daysValid ? numberOfDays : undefined,
      },
    });
  };

  if (items.length === 0) {
    return (
      <div>
        <PageHeader title="Cart" />
        <div className="px-4 pt-4">
          <EmptyState
            icon={<ShoppingCart className="h-5 w-5" strokeWidth={1.8} />}
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
    );
  }

  return (
    <div>
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
                  <span className="mt-1 block font-body text-[13px] text-graphite-600 dark:text-graphite-300">
                    {formatCurrency(item.dailyRate)} / day
                  </span>
                )}
              </div>
              <button
                onClick={() => removeItem(item.productId)}
                aria-label={`Remove ${item.productName} from cart`}
                className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full text-graphite-400 transition-all duration-150 ease-app hover:bg-graphite-100 hover:text-state-danger active:scale-90 dark:hover:bg-graphite-800"
              >
                <Trash2 className="h-4 w-4" strokeWidth={1.8} />
              </button>
            </div>

            <div className="mt-3 flex items-center justify-between">
              <div className="flex items-center gap-1 rounded-full border border-graphite-200 dark:border-graphite-800">
                <button
                  onClick={() => setQuantity(item.productId, item.quantity - 1)}
                  aria-label="Decrease quantity"
                  className="flex h-8 w-8 items-center justify-center rounded-full text-ink transition-all duration-150 ease-app active:scale-90 dark:text-ink-inverted"
                >
                  <Minus className="h-3.5 w-3.5" strokeWidth={2} />
                </button>
                <span className="w-6 text-center font-body text-[13px] font-medium text-ink dark:text-ink-inverted">
                  {item.quantity}
                </span>
                <button
                  onClick={() => setQuantity(item.productId, item.quantity + 1)}
                  aria-label="Increase quantity"
                  className="flex h-8 w-8 items-center justify-center rounded-full text-ink transition-all duration-150 ease-app active:scale-90 dark:text-ink-inverted"
                >
                  <Plus className="h-3.5 w-3.5" strokeWidth={2} />
                </button>
              </div>
              {lineTotals[index] !== null && (
                <span className="font-body text-[13.5px] font-semibold text-ink dark:text-ink-inverted">
                  {formatCurrency(lineTotals[index]!)}
                </span>
              )}
            </div>
          </div>
        ))}

        <div className="pt-1">
          <Input
            label="Number of days"
            type="number"
            min={1}
            inputMode="numeric"
            hint="Optional — shows an estimated total"
            value={numberOfDays}
            onChange={(e) => setNumberOfDays(e.target.value)}
          />
        </div>

        {grandTotal !== null && (
          <div className="flex items-center justify-between rounded border border-accent-200 bg-accent-50 px-3.5 py-3 dark:border-accent-500/30 dark:bg-graphite-900">
            <span className="font-body text-[13px] text-graphite-600 dark:text-graphite-300">
              Estimated total ({daysNum} day{daysNum === 1 ? "" : "s"})
            </span>
            <span className="font-display text-[16px] font-bold text-ink dark:text-ink-inverted">
              {formatCurrency(grandTotal)}
            </span>
          </div>
        )}

        <Button fullWidth onClick={handleCheckout}>
          Continue to enquiry ({items.reduce((n, i) => n + i.quantity, 0)} item
          {items.reduce((n, i) => n + i.quantity, 0) === 1 ? "" : "s"})
        </Button>
      </div>
    </div>
  );
}
