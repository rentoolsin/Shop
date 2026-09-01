import { useEffect, useRef, useState, type FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { Trash } from "@phosphor-icons/react";
import { useCategories } from "../../../hooks/useCategories";
import { useProducts, useProduct } from "../../../hooks/useProducts";
import {
  createRental,
  createRentalCheckout,
  type RentalFormValues,
} from "../../../services/admin-rentals.service";
import type { AdminCustomer } from "../../../services/admin-customers.service";
import type { CategoryListItem } from "../../../services/categories.service";
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

function parseNumeric(value: string): number {
  const n = Number(value);
  return Number.isFinite(n) ? n : 0;
}

/** One tool being taken in this rental/checkout. See `RentalLineFields` for the fields it fetches itself. */
interface RentalLine {
  key: string;
  categoryId: string;
  productId: string;
  variantId: string;
  // Kept as free-typed text (not number) so the field can be fully cleared
  // while editing — a controlled number input whose state defaults to 0
  // can never show as empty, since deleting the last digit just re-renders
  // "0" right back in. Parsed to a number via parseNumeric for calculations/submit.
  quantityInput: string;
  dailyRateInput: string;
  startDate: string;
  returnDate: string;
  /**
   * Denormalized up from the selected variant by `RentalLineFields` (which
   * is the only place that actually fetches it), purely so this parent
   * component can validate "quantity ≤ available" and show a per-line hint
   * without needing to run a second, duplicate product query up here.
   */
  availableQuantity: number | null;
}

function makeLine(overrides: Partial<Pick<RentalLine, "categoryId" | "productId" | "startDate" | "returnDate">> & {
  quantity?: number;
} = {}): RentalLine {
  const startDate = overrides.startDate ?? todayIso();
  return {
    key: crypto.randomUUID(),
    categoryId: overrides.categoryId ?? "",
    productId: overrides.productId ?? "",
    variantId: "",
    quantityInput: String(overrides.quantity ?? 1),
    dailyRateInput: "0",
    startDate,
    returnDate: overrides.returnDate ?? startDate,
    availableQuantity: null,
  };
}

interface LineErrors {
  variant?: string;
  quantity?: string;
  dailyRate?: string;
  returnDate?: string;
}

interface RentalLineFieldsProps {
  line: RentalLine;
  index: number;
  categories: CategoryListItem[];
  errors: LineErrors;
  onChange: (patch: Partial<RentalLine>) => void;
  onRemove?: () => void;
}

/**
 * One tool's product/size/quantity/rate/dates. Its own component (rather
 * than inlined in a `.map()` inside RentalForm) because it needs to run its
 * own `useProducts`/`useProduct` queries scoped to this line's category and
 * product — calling those conditionally inside a loop at the parent would
 * break the rules of hooks once there's more than one line.
 */
function RentalLineFields({ line, index, categories, errors, onChange, onRemove }: RentalLineFieldsProps) {
  // Mirrors the single-line form's original behavior: an initial
  // categoryId/productId (from enquiry-conversion prefill) shouldn't be
  // immediately wiped out by the "category changed -> clear product"
  // effect below before the admin has actually touched anything. Each
  // line component only mounts once, so seeding this from the line's
  // starting props is enough — no cross-line coordination needed.
  const [skipProductReset, setSkipProductReset] = useState(() => !!line.productId);
  // Set right before a product->category auto-sync (see below) so the
  // category-reset effect that follows knows this categoryId change came
  // from picking a product, not from the admin touching the Category
  // dropdown, and shouldn't wipe the product/variant back out.
  const syncingCategoryFromProduct = useRef(false);

  const quantity = parseNumeric(line.quantityInput);
  const dailyRate = parseNumeric(line.dailyRateInput);

  const products = useProducts({ categoryId: line.categoryId || undefined });
  const product = useProduct(line.productId || undefined);

  const variants = product.status === "success" && product.data ? product.data.variants : [];
  const selectedVariant = variants.find((v) => v.id === line.variantId) ?? null;

  // Category changed -> the product/variant chosen under it no longer
  // applies, unless the change came from the product->category auto-sync
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
    onChange({ productId: "", variantId: "" });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [line.categoryId]);

  // Product picked directly (e.g. while "All categories" is selected) ->
  // reflect its actual category in the Category field, instead of leaving
  // it showing "All categories" / a stale category.
  useEffect(() => {
    if (product.status === "success" && product.data && product.data.categoryId !== line.categoryId) {
      syncingCategoryFromProduct.current = true;
      onChange({ categoryId: product.data.categoryId });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [product.status, product.data]);

  // Product changed -> the variant chosen under it no longer applies.
  useEffect(() => {
    onChange({ variantId: "" });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [line.productId]);

  // Picking a variant prefills its rate and lifts its availableQuantity up
  // to the parent (for cross-line validation); the rate field stays
  // editable afterward in case of a negotiated rate.
  useEffect(() => {
    if (selectedVariant) {
      onChange({ dailyRateInput: String(selectedVariant.dailyRate), availableQuantity: selectedVariant.availableQuantity });
    } else {
      onChange({ availableQuantity: null });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [line.variantId, selectedVariant?.availableQuantity]);

  const lineTotals = calculateRentalTotals({
    startDate: line.startDate,
    returnDate: line.returnDate,
    dailyRate,
    quantity,
    advance: 0,
  });

  return (
    <div className="space-y-3 rounded border border-graphite-200 p-3 dark:border-graphite-800">
      <div className="flex items-center justify-between">
        <span className="font-body text-[12px] font-semibold uppercase tracking-wide text-graphite-500">
          Tool {index + 1}
        </span>
        {onRemove && (
          <button
            type="button"
            onClick={onRemove}
            className="flex items-center gap-1 font-body text-[12px] font-medium text-state-danger-text hover:underline dark:text-state-danger-text-dark"
          >
            <Trash className="h-4 w-4" weight="light" aria-hidden="true" />
            Remove
          </button>
        )}
      </div>

      <Select label="Category" value={line.categoryId} onChange={(e) => onChange({ categoryId: e.target.value })}>
        <option value="">All categories</option>
        {categories.map((c) => (
          <option key={c.id} value={c.id}>{c.name}</option>
        ))}
      </Select>

      <Select
        label="Product"
        value={line.productId}
        onChange={(e) => onChange({ productId: e.target.value })}
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
          value={line.variantId}
          onChange={(e) => onChange({ variantId: e.target.value })}
          error={errors.variant}
          disabled={!line.productId || product.status !== "success"}
        >
          <option value="">{line.productId ? "Choose a size…" : "Choose a product first"}</option>
          {variants.map((v) => (
            <option key={v.id} value={v.id} disabled={v.availableQuantity <= 0}>
              {v.label} — {formatCurrency(v.dailyRate)}/day ({v.availableQuantity} available)
            </option>
          ))}
        </Select>
        {line.productId && product.status === "success" && variants.length === 0 && (
          <p className="mt-1 font-body text-[12px] text-graphite-500">
            This product has no active sizes to rent.
          </p>
        )}
      </div>

      <div className="grid grid-cols-2 gap-3">
        <Input
          label="Quantity"
          type="number"
          min={1}
          inputMode="numeric"
          value={line.quantityInput}
          onChange={(e) => onChange({ quantityInput: e.target.value })}
          error={errors.quantity}
          hint={line.availableQuantity != null ? `${line.availableQuantity} available` : undefined}
        />
        <Input
          label="Daily rate (₹)"
          type="number"
          min={0}
          value={line.dailyRateInput}
          onChange={(e) => onChange({ dailyRateInput: e.target.value })}
          error={errors.dailyRate}
        />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <DatePicker label="Start date" value={line.startDate} onChange={(v) => onChange({ startDate: v })} />
        <DatePicker
          label="Return date"
          value={line.returnDate}
          onChange={(v) => onChange({ returnDate: v })}
          error={errors.returnDate}
        />
      </div>

      <div className="flex items-center justify-between font-mono text-[12px] text-graphite-500">
        <span>{lineTotals.rentalDays} day{lineTotals.rentalDays === 1 ? "" : "s"}</span>
        <span>{formatCurrency(lineTotals.totalRental)}</span>
      </div>
    </div>
  );
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
  /** Overrides the default "toast + navigate to /admin/rentals" success behavior. Receives the *first* rental created when multiple tools were added at once. */
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

  const [lines, setLines] = useState<RentalLine[]>(() => [
    makeLine({
      categoryId: initialCategoryId,
      productId: initialProductId,
      quantity: initialQuantity,
      startDate: initialStartDate ?? todayIso(),
      returnDate: initialReturnDate ?? initialStartDate ?? todayIso(),
    }),
  ]);
  const [advanceInput, setAdvanceInput] = useState("0");
  const advance = parseNumeric(advanceInput);

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [lineErrors, setLineErrors] = useState<Record<string, LineErrors>>({});
  const [submitting, setSubmitting] = useState(false);

  // Converting a specific enquiry item is inherently a single tool — the
  // variant/quantity/dates come from that one enquiry line, so there's
  // nothing sensible to "add another tool" to here. Multi-tool checkouts
  // are for building a rental from scratch.
  const allowMultipleTools = !enquiryId;

  const updateLine = (key: string, patch: Partial<RentalLine>) => {
    setLines((ls) => ls.map((l) => (l.key === key ? { ...l, ...patch } : l)));
  };

  const addLine = () => {
    const first = lines[0];
    setLines((ls) => [...ls, makeLine({ startDate: first?.startDate, returnDate: first?.returnDate })]);
  };

  const removeLine = (key: string) => {
    setLines((ls) => (ls.length > 1 ? ls.filter((l) => l.key !== key) : ls));
  };

  const lineTotalsList = lines.map((line) =>
    calculateRentalTotals({
      startDate: line.startDate,
      returnDate: line.returnDate,
      dailyRate: parseNumeric(line.dailyRateInput),
      quantity: parseNumeric(line.quantityInput),
      advance: 0,
    }),
  );
  const combinedTotalRental = lineTotalsList.reduce((sum, t) => sum + t.totalRental, 0);
  const combinedBalance = combinedTotalRental - advance;

  const validate = (): boolean => {
    const nextErrors: Record<string, string> = {};
    const nextLineErrors: Record<string, LineErrors> = {};

    if (!customer) nextErrors.customer = "Search for or add a customer.";
    if (advance < 0) nextErrors.advance = describeRentalError("ADVANCE_NEGATIVE");

    lines.forEach((line) => {
      const quantity = parseNumeric(line.quantityInput);
      const dailyRate = parseNumeric(line.dailyRateInput);
      const le: LineErrors = {};
      if (!line.variantId) le.variant = "Choose a product and size.";
      if (line.availableQuantity != null && quantity > line.availableQuantity) {
        le.quantity = `Only ${line.availableQuantity} available.`;
      }
      validateRentalInput({
        startDate: line.startDate,
        returnDate: line.returnDate,
        dailyRate,
        quantity,
        advance: 0,
      }).forEach((code) => {
        if (code === "RETURN_BEFORE_START") le.returnDate = describeRentalError(code);
        if (code === "QUANTITY_NOT_POSITIVE" && !le.quantity) le.quantity = describeRentalError(code);
        if (code === "RATE_NEGATIVE") le.dailyRate = describeRentalError(code);
      });
      if (Object.keys(le).length > 0) nextLineErrors[line.key] = le;
    });

    setErrors(nextErrors);
    setLineErrors(nextLineErrors);
    return Object.keys(nextErrors).length === 0 && Object.keys(nextLineErrors).length === 0;
  };

  const finishCreated = async (rentalId: string, count: number) => {
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
      showToast(count > 1 ? `${count} rentals created.` : "Rental created.", "success");
      navigate("/admin/rentals");
    }
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (submitting || !validate()) return;
    setSubmitting(true);
    try {
      if (lines.length === 1) {
        const line = lines[0];
        const values: RentalFormValues = {
          customerId: customer!.id,
          variantId: line.variantId,
          quantity: parseNumeric(line.quantityInput),
          startDate: line.startDate,
          returnDate: line.returnDate,
          dailyRate: parseNumeric(line.dailyRateInput),
          advance,
          enquiryId,
          enquiryItemId,
        };
        const rentalId = await createRental(values);
        await finishCreated(rentalId, 1);
      } else {
        const { rentalIds } = await createRentalCheckout(
          customer!.id,
          lines.map((line) => ({
            variantId: line.variantId,
            quantity: parseNumeric(line.quantityInput),
            startDate: line.startDate,
            returnDate: line.returnDate,
            dailyRate: parseNumeric(line.dailyRateInput),
            advance,
          })),
        );
        await finishCreated(rentalIds[0], rentalIds.length);
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

  const categoryList = categories.status === "success" ? categories.data : [];

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
          {lines.map((line, index) => (
            <RentalLineFields
              key={line.key}
              line={line}
              index={index}
              categories={categoryList}
              errors={lineErrors[line.key] ?? {}}
              onChange={(patch) => updateLine(line.key, patch)}
              onRemove={allowMultipleTools && lines.length > 1 ? () => removeLine(line.key) : undefined}
            />
          ))}

          {allowMultipleTools && (
            <Button variant="secondary" fullWidth type="button" onClick={addLine}>
              + Add another tool
            </Button>
          )}
        </div>

        <Input
          label="Advance received (₹)"
          type="number"
          min={0}
          value={advanceInput}
          onChange={(e) => setAdvanceInput(e.target.value)}
          error={errors.advance}
          hint={lines.length > 1 ? "One payment, covers all tools in this checkout." : undefined}
        />

        <div className="rounded border border-graphite-300 bg-graphite-100 p-3 dark:border-graphite-700 dark:bg-graphite-800">
          {lines.length === 1 ? (
            <div className="flex items-center justify-between font-mono text-[13px] text-ink dark:text-ink-inverted">
              <span>{lineTotalsList[0].rentalDays} day{lineTotalsList[0].rentalDays === 1 ? "" : "s"}</span>
              <span>{formatCurrency(lineTotalsList[0].totalRental)}</span>
            </div>
          ) : (
            <div className="flex items-center justify-between font-mono text-[13px] text-ink dark:text-ink-inverted">
              <span>{lines.length} tools · combined total</span>
              <span>{formatCurrency(combinedTotalRental)}</span>
            </div>
          )}
          <div className="mt-1 flex items-center justify-between font-mono text-[13px] font-semibold text-ink dark:text-ink-inverted">
            <span>{describeBalance(combinedBalance).label}</span>
            <span
              className={
                describeBalance(combinedBalance).isRefund
                  ? "text-state-success-text dark:text-state-success-text-dark"
                  : undefined
              }
            >
              {formatCurrency(describeBalance(combinedBalance).amount)}
            </span>
          </div>
          {describeBalance(combinedBalance).isRefund && (
            <p className="mt-1 font-body text-[12px] text-graphite-500">
              Advance received is more than the rental amount — the difference will be refunded when
              {lines.length > 1 ? " these rentals are" : " this rental is"} marked as returned.
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
