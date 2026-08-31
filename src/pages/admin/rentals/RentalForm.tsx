import { useEffect, useRef, useState, type FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { useCategories } from "../../../hooks/useCategories";
import { useProducts, useProduct } from "../../../hooks/useProducts";
import { createRental, type RentalFormValues } from "../../../services/admin-rentals.service";
import type { AdminCustomer } from "../../../services/admin-customers.service";
import {
  calculateRentalTotals,
  validateRentalInput,
  describeRentalError,
  describeBalance,
} from "../../../utils/rental-calculations";
import { formatCurrency } from "../../../utils/currency";
import { CustomerPicker } from "../../../components/admin/CustomerPicker";
import { Input } from "../../../components/ui/Input";
import { Select } from "../../../components/ui/Select";
import { DatePicker } from "../../../components/ui/DatePicker";
import { Button } from "../../../components/ui/Button";
import { useToast } from "../../../components/ui/Toast";

function todayIso(): string {
  return new Date().toISOString().slice(0, 10);
}

export interface RentalFormProps {
  /** Enquiry this rental is being created from (see EnquiryDetail.tsx "Convert to Rental"). */
  enquiryId?: string;
  /** Specific line item being converted, for a multi-item enquiry — see admin-rentals.service.ts. */
  enquiryItemId?: string;
  /** Pre-selects a customer (e.g. matched or newly created from an enquiry's mobile/name). */
  initialCustomer?: AdminCustomer | null;
  /** Forwarded to CustomerPicker when no `initialCustomer` is matched yet. */
  initialCustomerQuery?: string;
  initialCustomerName?: string;
  initialCategoryId?: string;
  initialProductId?: string;
  initialQuantity?: number;
  initialStartDate?: string;
  initialReturnDate?: string;
  /** Heading shown above the form. Defaults to "New rental". */
  title?: string;
  submitLabel?: string;
  /** Overrides the default "toast + navigate to /admin/rentals" success behavior. */
  onCreated?: (rentalId: string) => void | Promise<void>;
  onCancel?: () => void;
}

export function RentalForm({
  enquiryId,
  enquiryItemId,
  initialCustomer = null,
  initialCustomerQuery,
  initialCustomerName,
  initialCategoryId = "",
  initialProductId = "",
  initialQuantity = 1,
  initialStartDate,
  initialReturnDate,
  title = "New rental",
  submitLabel = "Create rental",
  onCreated,
  onCancel,
}: RentalFormProps = {}) {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const categories = useCategories();

  const [customer, setCustomer] = useState<AdminCustomer | null>(initialCustomer);
  const [categoryId, setCategoryId] = useState(initialCategoryId);
  const [productId, setProductId] = useState(initialProductId);
  const [variantId, setVariantId] = useState("");
  // Kept as free-typed text (not number) so the field can be fully cleared
  // while editing — a controlled number input whose state defaults to 0
  // can never show as empty, since deleting the last digit just re-renders
  // "0" right back in. Parsed to a number below for calculations/submit.
  const [quantityInput, setQuantityInput] = useState(String(initialQuantity));
  const [startDate, setStartDate] = useState(initialStartDate ?? todayIso());
  const [returnDate, setReturnDate] = useState(initialReturnDate ?? initialStartDate ?? todayIso());
  const [dailyRateInput, setDailyRateInput] = useState("0");
  const [advanceInput, setAdvanceInput] = useState("0");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [skipProductReset, setSkipProductReset] = useState(!!initialProductId);
  // Set right before a product->category auto-sync (see below) so the
  // category-reset effect that follows knows this categoryId change came
  // from picking a product, not from the admin touching the Category
  // dropdown, and shouldn't wipe the product/variant back out.
  const syncingCategoryFromProduct = useRef(false);

  const parseNumeric = (value: string): number => {
    const n = Number(value);
    return Number.isFinite(n) ? n : 0;
  };
  const quantity = parseNumeric(quantityInput);
  const dailyRate = parseNumeric(dailyRateInput);
  const advance = parseNumeric(advanceInput);

  const products = useProducts({ categoryId: categoryId || undefined });
  const product = useProduct(productId || undefined);

  const variants = product.status === "success" && product.data ? product.data.variants : [];
  const selectedVariant = variants.find((v) => v.id === variantId) ?? null;

  // Category changed -> the product/variant chosen under it no longer applies.
  // Skipped on the very first run so an `initialCategoryId` (enquiry conversion
  // pre-fill) isn't immediately wiped out before the admin touches anything,
  // and skipped when the change came from the product->category auto-sync
  // below (that sync should never itself clear the product it's syncing to).
  useEffect(() => {
    if (skipProductReset) {
      setSkipProductReset(false);
      return;
    }
    if (syncingCategoryFromProduct.current) {
      syncingCategoryFromProduct.current = false;
      return;
    }
    setProductId("");
    setVariantId("");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [categoryId]);

  // Product picked directly (e.g. while "All categories" is selected) ->
  // reflect its actual category in the Category field, instead of leaving
  // it showing "All categories" / a stale category.
  useEffect(() => {
    if (product.status === "success" && product.data && product.data.categoryId !== categoryId) {
      syncingCategoryFromProduct.current = true;
      setCategoryId(product.data.categoryId);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [product.status, product.data]);

  // Product changed -> the variant chosen under it no longer applies.
  useEffect(() => {
    setVariantId("");
  }, [productId]);

  // Picking a variant prefills its rate; the field stays editable afterward
  // in case of a negotiated rate.
  useEffect(() => {
    if (selectedVariant) setDailyRateInput(String(selectedVariant.dailyRate));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [variantId]);

  const totals = calculateRentalTotals({ startDate, returnDate, dailyRate, quantity, advance });

  const validate = (): boolean => {
    const next: Record<string, string> = {};
    if (!customer) next.customer = "Search for or add a customer.";
    if (!variantId) next.variant = "Choose a product and size.";
    if (selectedVariant && quantity > selectedVariant.availableQuantity) {
      next.quantity = `Only ${selectedVariant.availableQuantity} available.`;
    }

    validateRentalInput({ startDate, returnDate, dailyRate, quantity, advance }).forEach((code) => {
      if (code === "RETURN_BEFORE_START") next.returnDate = describeRentalError(code);
      if (code === "QUANTITY_NOT_POSITIVE" && !next.quantity) next.quantity = describeRentalError(code);
      if (code === "RATE_NEGATIVE") next.dailyRate = describeRentalError(code);
      if (code === "ADVANCE_NEGATIVE" || code === "ADVANCE_EXCEEDS_TOTAL") {
        next.advance = describeRentalError(code);
      }
    });

    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (submitting || !validate()) return;
    setSubmitting(true);
    try {
      const values: RentalFormValues = {
        customerId: customer!.id,
        variantId,
        quantity,
        startDate,
        returnDate,
        dailyRate,
        advance,
        enquiryId,
        enquiryItemId,
      };
      const rentalId = await createRental(values);
      if (onCreated) {
        // Awaited (and separately try/caught) so that any error thrown by
        // the caller's follow-up work — e.g. EnquiryDetail's status update
        // and navigate() after a multi-item conversion — surfaces instead
        // of failing silently as an unhandled promise rejection. The
        // rental itself is already created at this point, so a failure
        // here must not show "couldn't create this rental" (that would be
        // wrong) — just log it, since the caller is responsible for its
        // own user-facing messaging around that follow-up step.
        try {
          await onCreated(rentalId);
        } catch (followUpErr) {
          console.error("Rental created, but its onCreated follow-up failed:", followUpErr);
        }
      } else {
        showToast("Rental created.", "success");
        navigate("/admin/rentals");
      }
    } catch (err) {
      const message = err instanceof Error ? err.message.toLowerCase() : "";
      showToast(
        message.includes("inventory") || message.includes("not enough")
          ? "Not enough stock available for that size and quantity."
          : "Couldn't create this rental. Try again.",
        "danger",
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-lg">
      <h1 className="mb-4 font-display text-[20px] font-bold text-ink dark:text-ink-inverted">
        {title}
      </h1>
      <form onSubmit={handleSubmit} className="space-y-5" noValidate>
        <div>
          <span className="mb-1 block font-body text-[13px] font-medium text-graphite-600 dark:text-graphite-300">
            Customer
          </span>
          <CustomerPicker
            value={customer}
            onChange={setCustomer}
            initialQuery={initialCustomerQuery}
            initialName={initialCustomerName}
            autoFocus
          />
          {errors.customer && (
            <span className="mt-1 block font-body text-[12px] text-state-danger-text dark:text-state-danger-text-dark">{errors.customer}</span>
          )}
        </div>

        <div className="space-y-3 border-t border-graphite-200 pt-4 dark:border-graphite-800">
          <Select label="Category" value={categoryId} onChange={(e) => setCategoryId(e.target.value)}>
            <option value="">All categories</option>
            {categories.status === "success" &&
              categories.data.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
          </Select>

          <Select
            label="Product"
            value={productId}
            onChange={(e) => setProductId(e.target.value)}
            disabled={products.status !== "success"}
          >
            <option value="">Choose a product…</option>
            {products.status === "success" &&
              products.data.map((p) => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
          </Select>

          <div>
            <Select
              label="Size / variant"
              value={variantId}
              onChange={(e) => setVariantId(e.target.value)}
              error={errors.variant}
              disabled={!productId || product.status !== "success"}
            >
              <option value="">{productId ? "Choose a size…" : "Choose a product first"}</option>
              {variants.map((v) => (
                <option key={v.id} value={v.id} disabled={v.availableQuantity <= 0}>
                  {v.label} — {formatCurrency(v.dailyRate)}/day ({v.availableQuantity} available)
                </option>
              ))}
            </Select>
            {productId && product.status === "success" && variants.length === 0 && (
              <p className="mt-1 font-body text-[12px] text-graphite-500">
                This product has no active sizes to rent.
              </p>
            )}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <Input
            label="Quantity"
            type="number"
            min={1}
            inputMode="numeric"
            value={quantityInput}
            onChange={(e) => setQuantityInput(e.target.value)}
            error={errors.quantity}
            hint={selectedVariant ? `${selectedVariant.availableQuantity} available` : undefined}
          />
          <Input
            label="Daily rate (₹)"
            type="number"
            min={0}
            value={dailyRateInput}
            onChange={(e) => setDailyRateInput(e.target.value)}
            error={errors.dailyRate}
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <DatePicker
            label="Start date"
            value={startDate}
            onChange={setStartDate}
          />
          <DatePicker
            label="Return date"
            value={returnDate}
            onChange={setReturnDate}
            error={errors.returnDate}
          />
        </div>

        <Input
          label="Advance received (₹)"
          type="number"
          min={0}
          value={advanceInput}
          onChange={(e) => setAdvanceInput(e.target.value)}
          error={errors.advance}
        />

        <div className="rounded border border-graphite-300 bg-graphite-100 p-3 dark:border-graphite-700 dark:bg-graphite-800">
          <div className="flex items-center justify-between font-mono text-[13px] text-ink dark:text-ink-inverted">
            <span>{totals.rentalDays} day{totals.rentalDays === 1 ? "" : "s"}</span>
            <span>{formatCurrency(totals.totalRental)}</span>
          </div>
          <div className="mt-1 flex items-center justify-between font-mono text-[13px] font-semibold text-ink dark:text-ink-inverted">
            <span>{describeBalance(totals.balance).label}</span>
            <span
              className={
                describeBalance(totals.balance).isRefund
                  ? "text-state-success-text dark:text-state-success-text-dark"
                  : undefined
              }
            >
              {formatCurrency(describeBalance(totals.balance).amount)}
            </span>
          </div>
          {describeBalance(totals.balance).isRefund && (
            <p className="mt-1 font-body text-[12px] text-graphite-500">
              Advance received is more than the rental amount — the difference will be refunded when this rental
              is marked as returned.
            </p>
          )}
        </div>

        <div className="flex gap-2 pt-2">
          <Button
            variant="secondary"
            fullWidth
            type="button"
            onClick={onCancel ?? (() => navigate("/admin/rentals"))}
          >
            Cancel
          </Button>
          <Button fullWidth type="submit" disabled={submitting}>
            {submitting ? "Saving…" : submitLabel}
          </Button>
        </div>
      </form>
    </div>
  );
}
