import { useRef, useState, type FormEvent } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { PageHeader } from "../components/layout/PageHeader";
import { DesktopContainer } from "../components/layout/DesktopHeader";
import { Input } from "../components/ui/Input";
import { Textarea } from "../components/ui/Textarea";
import { Button } from "../components/ui/Button";
import { useToast } from "../components/ui/Toast";
import { submitEnquiry, submitCartEnquiry } from "../services/enquiries.service";
import { formatCurrency } from "../utils/currency";
import { useDocumentMeta } from "../hooks/useDocumentMeta";
import { useCart } from "../hooks/useCart";

interface CartLineState {
  productId?: string;
  productName: string;
  variantLabel?: string;
  dailyRate: number | null;
  quantity: number;
}

interface LocationState {
  productId?: string;
  productName?: string;
  dailyRate?: number;
  /** Present when arriving from the Cart page — a multi-item enquiry. */
  cartItems?: CartLineState[];
  numberOfDays?: string;
}

interface FormValues {
  name: string;
  mobile: string;
  quantity: string;
  requiredDate: string;
  numberOfDays: string;
  address: string;
  message: string;
}

function buildEmptyForm(state: LocationState): FormValues {
  return {
    name: "",
    mobile: "",
    quantity: "1",
    requiredDate: "",
    numberOfDays: state.numberOfDays ?? "",
    address: "",
    message: "",
  };
}

function validate(values: FormValues, isCartMode: boolean): Partial<Record<keyof FormValues, string>> {
  const errors: Partial<Record<keyof FormValues, string>> = {};
  if (!values.name.trim()) errors.name = "Enter your name.";
  if (!/^\+?[0-9]{10,13}$/.test(values.mobile.trim())) {
    errors.mobile = "Enter a valid mobile number.";
  }
  if (!isCartMode && values.quantity && Number(values.quantity) <= 0) {
    errors.quantity = "Quantity must be greater than zero.";
  }
  return errors;
}

export function Enquire() {
  const location = useLocation();
  const navigate = useNavigate();
  const state = (location.state ?? {}) as LocationState;
  const { showToast } = useToast();
  const { clearCart } = useCart();

  const isCartMode = !!state.cartItems && state.cartItems.length > 0;

  const [values, setValues] = useState<FormValues>(() => buildEmptyForm(state));
  const [errors, setErrors] = useState<Partial<Record<keyof FormValues, string>>>({});
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const nameRef = useRef<HTMLInputElement>(null);
  const mobileRef = useRef<HTMLInputElement>(null);
  const quantityRef = useRef<HTMLInputElement>(null);
  // Order matters here — mirrors the field order on screen, so whichever
  // invalid field appears first visually is also the one that gets focus.
  const fieldRefs: Partial<Record<keyof FormValues, typeof nameRef>> = {
    name: nameRef,
    mobile: mobileRef,
    quantity: quantityRef,
  };

  // Both the form and its post-submit confirmation are per-visitor and
  // carry no distinct content worth indexing — noindex avoids the
  // confirmation screen appearing in search results.
  useDocumentMeta({
    title: submitted ? "Enquiry sent" : "Enquire",
    description: "Send a tool rental enquiry to RenTools in Coimbatore.",
    noindex: true,
  });

  const setField = (field: keyof FormValues, value: string) => {
    setValues((v) => ({ ...v, [field]: value }));
  };

  // Live cost estimate. Single-product mode needs a known rate + quantity +
  // days; cart mode sums each line's own rate/quantity against the shared
  // "number of days" field instead.
  const quantityNum = Number(values.quantity);
  const daysNum = Number(values.numberOfDays);
  const daysValid = values.numberOfDays !== "" && daysNum > 0;

  const singleEstimateValid =
    !isCartMode && typeof state.dailyRate === "number" && values.quantity !== "" && quantityNum > 0 && daysValid;
  const singleEstimatedTotal = singleEstimateValid ? state.dailyRate! * quantityNum * daysNum : null;

  const cartEstimatedTotal =
    isCartMode && daysValid
      ? state.cartItems!.reduce<number | null>((sum, item) => {
          if (sum === null || item.dailyRate == null) return null;
          return sum + item.dailyRate * item.quantity * daysNum;
        }, 0)
      : null;

  const estimatedTotal = isCartMode ? cartEstimatedTotal : singleEstimatedTotal;

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (submitting) return; // prevent duplicate submissions

    const validationErrors = validate(values, isCartMode);
    setErrors(validationErrors);
    if (Object.keys(validationErrors).length > 0) {
      // Move focus (and the viewport) to the first invalid field — without
      // this, a screen-reader user gets no indication anything failed, and
      // a sighted user can miss an error that's scrolled off-screen behind
      // the keyboard.
      const firstErrorField = (Object.keys(validationErrors) as (keyof FormValues)[]).find(
        (field) => fieldRefs[field],
      );
      fieldRefs[firstErrorField ?? "name"]?.current?.focus();
      return;
    }

    setSubmitting(true);
    try {
      if (isCartMode) {
        await submitCartEnquiry({
          name: values.name.trim(),
          mobile: values.mobile.trim(),
          items: state.cartItems!.map((item) => ({
            productId: item.productId,
            productName: item.variantLabel ? `${item.productName} (${item.variantLabel})` : item.productName,
            dailyRate: item.dailyRate,
            quantity: item.quantity,
          })),
          requiredDate: values.requiredDate || undefined,
          numberOfDays: values.numberOfDays ? Number(values.numberOfDays) : undefined,
          address: values.address.trim() || undefined,
          message: values.message.trim() || undefined,
        });
        clearCart();
      } else {
        await submitEnquiry({
          name: values.name.trim(),
          mobile: values.mobile.trim(),
          productId: state.productId,
          requestedProductText: state.productName,
          quantity: values.quantity ? Number(values.quantity) : undefined,
          requiredDate: values.requiredDate || undefined,
          numberOfDays: values.numberOfDays ? Number(values.numberOfDays) : undefined,
          address: values.address.trim() || undefined,
          message: values.message.trim() || undefined,
        });
      }
      setSubmitted(true);
      showToast("Enquiry sent. RenTools will get back to you shortly.", "success");
    } catch {
      showToast("Couldn't send your enquiry. Try again.", "danger");
      // Input values are intentionally preserved (not cleared) so the
      // person doesn't have to retype anything.
    } finally {
      setSubmitting(false);
    }
  };

  if (submitted) {
    const aboutText = isCartMode
      ? ` about your ${state.cartItems!.length}-item order`
      : state.productName
        ? ` about ${state.productName}`
        : " about your enquiry";

    return (
      <div>
        <div className="md:hidden">
          <PageHeader title="Enquiry sent" />
          <div className="flex flex-col items-center gap-4 p-4 pt-10 text-center">
            <span
              aria-hidden="true"
              className="flex h-14 w-14 items-center justify-center rounded-full bg-state-success/10 text-state-success"
            >
              <svg viewBox="0 0 24 24" fill="none" className="h-7 w-7" strokeWidth={2}>
                <path d="M5 12l4.5 4.5L19 7" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </span>
            <p className="font-body text-[14px] text-ink dark:text-ink-inverted">
              Thanks{values.name ? `, ${values.name}` : ""} — RenTools will contact you
              at {values.mobile}{aboutText}.
            </p>
            <div className="mt-2 flex w-full flex-col gap-2">
              <Button variant="accent" fullWidth onClick={() => navigate("/products")}>
                Browse more tools
              </Button>
              <Button variant="ghost" fullWidth onClick={() => navigate("/")}>
                Back to home
              </Button>
            </div>
          </div>
        </div>
        <div className="hidden md:block">
          <DesktopContainer className="flex justify-center py-20">
            <div className="flex w-full max-w-[440px] flex-col items-center gap-4 text-center">
              <span
                aria-hidden="true"
                className="flex h-16 w-16 items-center justify-center rounded-full bg-state-success/10 text-state-success"
              >
                <svg viewBox="0 0 24 24" fill="none" className="h-8 w-8" strokeWidth={2}>
                  <path d="M5 12l4.5 4.5L19 7" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </span>
              <p className="font-body text-[15px] text-ink dark:text-ink-inverted">
                Thanks{values.name ? `, ${values.name}` : ""} — RenTools will contact you
                at {values.mobile}{aboutText}.
              </p>
              <div className="mt-2 flex w-full flex-col gap-2.5">
                <Button variant="accent" size="lg" fullWidth onClick={() => navigate("/products")}>
                  Browse more tools
                </Button>
                <Button variant="ghost" size="lg" fullWidth onClick={() => navigate("/")}>
                  Back to home
                </Button>
              </div>
            </div>
          </DesktopContainer>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="md:hidden">
      <PageHeader title="Enquire" />
      <form onSubmit={handleSubmit} className="space-y-4 p-4" noValidate>
        {!isCartMode && state.productName && (
          <div className="flex items-center justify-between gap-2 rounded border border-graphite-200 px-3.5 py-2.5 dark:border-graphite-800">
            <span className="spec-tag spec-tag--accent">{state.productName}</span>
            {typeof state.dailyRate === "number" && (
              <span className="flex-shrink-0 font-body text-[13px] font-semibold text-ink dark:text-ink-inverted">
                {formatCurrency(state.dailyRate)} / day
              </span>
            )}
          </div>
        )}

        {isCartMode && (
          <div className="space-y-2 rounded border border-graphite-200 p-3.5 dark:border-graphite-800">
            <span className="font-body text-[13px] font-medium text-graphite-500">
              {state.cartItems!.length} item{state.cartItems!.length === 1 ? "" : "s"}
            </span>
            <ul className="space-y-1.5">
              {state.cartItems!.map((item, i) => (
                <li key={i} className="flex items-center justify-between gap-2 font-body text-[13.5px]">
                  <span className="min-w-0 truncate text-ink dark:text-ink-inverted">
                    {item.productName}
                    {item.variantLabel ? ` (${item.variantLabel})` : ""} × {item.quantity}
                  </span>
                  {item.dailyRate != null && (
                    <span className="flex-shrink-0 text-graphite-500">
                      {formatCurrency(item.dailyRate)}/day
                    </span>
                  )}
                </li>
              ))}
            </ul>
          </div>
        )}

        <Input
          ref={nameRef}
          label="Name"
          name="name"
          autoComplete="name"
          required
          value={values.name}
          onChange={(e) => setField("name", e.target.value)}
          error={errors.name}
          placeholder="Your name"
        />

        <Input
          ref={mobileRef}
          label="Mobile number"
          name="mobile"
          type="tel"
          inputMode="tel"
          autoComplete="tel"
          required
          value={values.mobile}
          onChange={(e) => setField("mobile", e.target.value)}
          error={errors.mobile}
          placeholder="10-digit mobile number"
        />

        {isCartMode ? (
          <Input
            label="Number of days"
            name="numberOfDays"
            type="number"
            min={1}
            inputMode="numeric"
            hint="Optional"
            value={values.numberOfDays}
            onChange={(e) => setField("numberOfDays", e.target.value)}
          />
        ) : (
          <div className="grid grid-cols-2 gap-3">
            <Input
              ref={quantityRef}
              label="Quantity"
              name="quantity"
              type="number"
              min={1}
              inputMode="numeric"
              value={values.quantity}
              onChange={(e) => setField("quantity", e.target.value)}
              error={errors.quantity}
            />
            <Input
              label="Number of days"
              name="numberOfDays"
              type="number"
              min={1}
              inputMode="numeric"
              hint="Optional"
              value={values.numberOfDays}
              onChange={(e) => setField("numberOfDays", e.target.value)}
            />
          </div>
        )}

        {estimatedTotal !== null && (
          <div className="flex items-center justify-between rounded border border-accent-200 bg-accent-50 px-3.5 py-3 dark:border-accent-500/30 dark:bg-graphite-900">
            <span className="font-body text-[13px] text-graphite-600 dark:text-graphite-300">
              {isCartMode
                ? `Estimated total (${daysNum} day${daysNum === 1 ? "" : "s"})`
                : `Estimated total (${quantityNum} × ${daysNum} day${daysNum === 1 ? "" : "s"})`}
            </span>
            <span className="font-display text-[16px] font-bold text-ink dark:text-ink-inverted">
              {formatCurrency(estimatedTotal)}
            </span>
          </div>
        )}

        <Input
          label="Required date"
          name="requiredDate"
          type="date"
          hint="Optional"
          value={values.requiredDate}
          onChange={(e) => setField("requiredDate", e.target.value)}
        />

        <Input
          label="Address"
          name="address"
          autoComplete="street-address"
          value={values.address}
          onChange={(e) => setField("address", e.target.value)}
          placeholder="Site address (optional)"
        />

        <Textarea
          label="Message"
          name="message"
          value={values.message}
          onChange={(e) => setField("message", e.target.value)}
          placeholder="Anything else RenTools should know (optional)"
        />

        <Button type="submit" variant="accent" fullWidth disabled={submitting}>
          {submitting ? "Sending…" : "Send enquiry"}
        </Button>

        <p className="text-center font-body text-[11.5px] leading-snug text-graphite-400">
          A refundable security deposit may apply, confirmed when RenTools calls to
          confirm your enquiry.
        </p>
      </form>
      </div>

      {/* Desktop / wide-viewport layout — same form, centered in a card
          so it doesn't stretch full-bleed across a wide viewport. */}
      <div className="hidden md:block">
        <DesktopContainer className="flex justify-center py-14">
          <div className="w-full max-w-[560px]">
            <h1 className="mb-6 text-center font-display text-[26px] font-extrabold text-ink dark:text-ink-inverted">
              Send an enquiry
            </h1>
            <form
              onSubmit={handleSubmit}
              className="space-y-4 rounded-lg border border-graphite-200 bg-white p-8 dark:border-graphite-800 dark:bg-graphite-900"
              noValidate
            >
              {!isCartMode && state.productName && (
                <div className="flex items-center justify-between gap-2 rounded border border-graphite-200 px-3.5 py-2.5 dark:border-graphite-800">
                  <span className="spec-tag spec-tag--accent">{state.productName}</span>
                  {typeof state.dailyRate === "number" && (
                    <span className="flex-shrink-0 font-body text-[13px] font-semibold text-ink dark:text-ink-inverted">
                      {formatCurrency(state.dailyRate)} / day
                    </span>
                  )}
                </div>
              )}

              {isCartMode && (
                <div className="space-y-2 rounded border border-graphite-200 p-3.5 dark:border-graphite-800">
                  <span className="font-body text-[13px] font-medium text-graphite-500">
                    {state.cartItems!.length} item{state.cartItems!.length === 1 ? "" : "s"}
                  </span>
                  <ul className="space-y-1.5">
                    {state.cartItems!.map((item, i) => (
                      <li key={i} className="flex items-center justify-between gap-2 font-body text-[13.5px]">
                        <span className="min-w-0 truncate text-ink dark:text-ink-inverted">
                          {item.productName}
                          {item.variantLabel ? ` (${item.variantLabel})` : ""} × {item.quantity}
                        </span>
                        {item.dailyRate != null && (
                          <span className="flex-shrink-0 text-graphite-500">
                            {formatCurrency(item.dailyRate)}/day
                          </span>
                        )}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <Input
                  label="Name"
                  name="name"
                  autoComplete="name"
                  required
                  value={values.name}
                  onChange={(e) => setField("name", e.target.value)}
                  error={errors.name}
                  placeholder="Your name"
                />
                <Input
                  label="Mobile number"
                  name="mobile"
                  type="tel"
                  inputMode="tel"
                  autoComplete="tel"
                  required
                  value={values.mobile}
                  onChange={(e) => setField("mobile", e.target.value)}
                  error={errors.mobile}
                  placeholder="10-digit mobile number"
                />
              </div>

              {isCartMode ? (
                <Input
                  label="Number of days"
                  name="numberOfDays"
                  type="number"
                  min={1}
                  inputMode="numeric"
                  hint="Optional"
                  value={values.numberOfDays}
                  onChange={(e) => setField("numberOfDays", e.target.value)}
                />
              ) : (
                <div className="grid grid-cols-2 gap-4">
                  <Input
                    label="Quantity"
                    name="quantity"
                    type="number"
                    min={1}
                    inputMode="numeric"
                    value={values.quantity}
                    onChange={(e) => setField("quantity", e.target.value)}
                    error={errors.quantity}
                  />
                  <Input
                    label="Number of days"
                    name="numberOfDays"
                    type="number"
                    min={1}
                    inputMode="numeric"
                    hint="Optional"
                    value={values.numberOfDays}
                    onChange={(e) => setField("numberOfDays", e.target.value)}
                  />
                </div>
              )}

              {estimatedTotal !== null && (
                <div className="flex items-center justify-between rounded border border-accent-200 bg-accent-50 px-3.5 py-3 dark:border-accent-500/30 dark:bg-graphite-950/40">
                  <span className="font-body text-[13px] text-graphite-600 dark:text-graphite-300">
                    {isCartMode
                      ? `Estimated total (${daysNum} day${daysNum === 1 ? "" : "s"})`
                      : `Estimated total (${quantityNum} × ${daysNum} day${daysNum === 1 ? "" : "s"})`}
                  </span>
                  <span className="font-display text-[16px] font-bold text-ink dark:text-ink-inverted">
                    {formatCurrency(estimatedTotal)}
                  </span>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <Input
                  label="Required date"
                  name="requiredDate"
                  type="date"
                  hint="Optional"
                  value={values.requiredDate}
                  onChange={(e) => setField("requiredDate", e.target.value)}
                />
                <Input
                  label="Address"
                  name="address"
                  autoComplete="street-address"
                  value={values.address}
                  onChange={(e) => setField("address", e.target.value)}
                  placeholder="Site address (optional)"
                />
              </div>

              <Textarea
                label="Message"
                name="message"
                value={values.message}
                onChange={(e) => setField("message", e.target.value)}
                placeholder="Anything else RenTools should know (optional)"
              />

              <Button type="submit" variant="accent" size="lg" fullWidth disabled={submitting}>
                {submitting ? "Sending…" : "Send enquiry"}
              </Button>

              <p className="text-center font-body text-[12px] leading-snug text-graphite-400">
                A refundable security deposit may apply, confirmed when RenTools calls to
                confirm your enquiry.
              </p>
            </form>
          </div>
        </DesktopContainer>
      </div>
    </div>
  );
}
