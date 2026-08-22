import { useEffect, useRef, useState, type FormEvent } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { PageHeader } from "../components/layout/PageHeader";
import { DesktopContainer } from "../components/layout/DesktopHeader";
import { Input } from "../components/ui/Input";
import { Select } from "../components/ui/Select";
import { Textarea } from "../components/ui/Textarea";
import { Button } from "../components/ui/Button";
import { useToast } from "../components/ui/Toast";
import { submitPurchaseRequest } from "../services/purchase-requests.service";
import { fetchOutOfStockProducts, type OutOfStockProduct } from "../services/products.service";
import { validateName, validateMobile, sanitizeMobile } from "../utils/contact-validation";
import { useDocumentMeta } from "../hooks/useDocumentMeta";

interface LocationState {
  productName?: string;
}

/** Value used for the "not listed / general request" dropdown option. */
const OTHER_TOOL_OPTION = "__other__";

interface FormValues {
  name: string;
  mobile: string;
  quantity: string;
  notes: string;
  /** Only used when the "not listed / general request" option is picked. */
  customToolName: string;
  /** Only used when a specific out-of-stock tool is the target of the request. */
  numberOfDays: string;
  rentFrom: string;
  rentTo: string;
}

const EMPTY_FORM: FormValues = {
  name: "",
  mobile: "",
  quantity: "1",
  notes: "",
  customToolName: "",
  numberOfDays: "",
  rentFrom: "",
  rentTo: "",
};

function validate(
  values: FormValues,
  { requireCustomToolName, requireRentalWindow }: { requireCustomToolName: boolean; requireRentalWindow: boolean },
): Partial<Record<keyof FormValues, string>> {
  const errors: Partial<Record<keyof FormValues, string>> = {};
  const nameErr = validateName(values.name);
  if (nameErr) errors.name = nameErr;
  const mobileErr = validateMobile(values.mobile);
  if (mobileErr) errors.mobile = mobileErr;
  if (values.quantity && Number(values.quantity) <= 0) {
    errors.quantity = "Quantity must be greater than zero.";
  }

  if (requireCustomToolName && !values.customToolName.trim()) {
    errors.customToolName = "Tell us which tool you're looking for.";
  }

  if (requireRentalWindow) {
    if (!values.numberOfDays.trim()) {
      errors.numberOfDays = "Enter number of days.";
    } else if (Number(values.numberOfDays) <= 0) {
      errors.numberOfDays = "Must be greater than zero.";
    }
    if (!values.rentFrom) errors.rentFrom = "Pick a start date.";
    if (!values.rentTo) errors.rentTo = "Pick an end date.";
    if (values.rentFrom && values.rentTo && values.rentTo < values.rentFrom) {
      errors.rentTo = "End date can't be before the start date.";
    }
  }

  return errors;
}

/**
 * Public "request when back in stock" form — for a product/size that's
 * currently unavailable (see ProductDetail.tsx). Distinct from Enquire.tsx:
 * writes to `purchase_requests`, not `enquiries` — this is a restocking
 * signal for the business, not a rental enquiry against current stock.
 */
export function RequestPurchase() {
  const location = useLocation();
  const navigate = useNavigate();
  const state = (location.state ?? {}) as LocationState;
  const { showToast } = useToast();

  const [values, setValues] = useState<FormValues>(EMPTY_FORM);
  const [errors, setErrors] = useState<Partial<Record<keyof FormValues, string>>>({});
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  // Only relevant for a *general* request (no specific product handed in
  // via state, e.g. coming from the footer link or the home page CTA) — a
  // request against a known out-of-stock product already carries its name
  // via `state.productName` and shows the read-only tag instead.
  const isGeneralRequest = !state.productName;
  const [toolOptions, setToolOptions] = useState<OutOfStockProduct[]>([]);
  const [toolOptionsLoading, setToolOptionsLoading] = useState(isGeneralRequest);
  const [selectedToolId, setSelectedToolId] = useState<string>(OTHER_TOOL_OPTION);

  useEffect(() => {
    if (!isGeneralRequest) return;
    let cancelled = false;
    setToolOptionsLoading(true);
    fetchOutOfStockProducts()
      .then((products) => {
        if (!cancelled) setToolOptions(products);
      })
      .catch(() => {
        // Non-fatal — the dropdown just falls back to "not listed" and the
        // person can still describe the tool in Notes instead.
      })
      .finally(() => {
        if (!cancelled) setToolOptionsLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [isGeneralRequest]);

  const selectedToolName =
    selectedToolId === OTHER_TOOL_OPTION
      ? undefined
      : toolOptions.find((p) => p.id === selectedToolId)?.name;

  // "Not listed / general request" is picked — ask them to type the tool
  // name instead, since we don't have a product to attach the request to.
  const isOtherToolSelected = isGeneralRequest && selectedToolId === OTHER_TOOL_OPTION;

  // Whenever the request targets a known out-of-stock tool — either handed
  // in directly via state (from a product page) or picked from the
  // dropdown — ask how long they'd like to rent it for and the date
  // window they need it in, so RentTools can prioritise outreach.
  const isSpecificToolRequest = !isOtherToolSelected;

  const nameRef = useRef<HTMLInputElement>(null);
  const mobileRef = useRef<HTMLInputElement>(null);
  const quantityRef = useRef<HTMLInputElement>(null);
  const customToolNameRef = useRef<HTMLInputElement>(null);
  const numberOfDaysRef = useRef<HTMLInputElement>(null);
  const rentFromRef = useRef<HTMLInputElement>(null);
  const rentToRef = useRef<HTMLInputElement>(null);
  const fieldRefs: Partial<Record<keyof FormValues, typeof nameRef>> = {
    name: nameRef,
    mobile: mobileRef,
    quantity: quantityRef,
    customToolName: customToolNameRef,
    numberOfDays: numberOfDaysRef,
    rentFrom: rentFromRef,
    rentTo: rentToRef,
  };

  useDocumentMeta({
    title: submitted ? "Request sent" : "Request a tool",
    description: "Ask RenTools to notify you when an out-of-stock tool is available to rent again.",
    noindex: true,
  });

  const setField = (field: keyof FormValues, value: string) => {
    setValues((v) => ({ ...v, [field]: value }));
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (submitting) return; // prevent duplicate submissions

    const validationErrors = validate(values, {
      requireCustomToolName: isOtherToolSelected,
      requireRentalWindow: isSpecificToolRequest,
    });
    setErrors(validationErrors);
    if (Object.keys(validationErrors).length > 0) {
      const firstErrorField = (Object.keys(validationErrors) as (keyof FormValues)[]).find(
        (field) => fieldRefs[field],
      );
      fieldRefs[firstErrorField ?? "name"]?.current?.focus();
      return;
    }

    setSubmitting(true);
    try {
      await submitPurchaseRequest({
        name: values.name.trim(),
        mobile: sanitizeMobile(values.mobile),
        productRequested:
          state.productName ?? selectedToolName ?? values.customToolName.trim() ?? "Not specified",
        quantity: values.quantity ? Number(values.quantity) : undefined,
        notes: values.notes.trim() || undefined,
        numberOfDays:
          isSpecificToolRequest && values.numberOfDays ? Number(values.numberOfDays) : undefined,
        rentFrom: isSpecificToolRequest ? values.rentFrom || undefined : undefined,
        rentTo: isSpecificToolRequest ? values.rentTo || undefined : undefined,
      });
      setSubmitted(true);
      showToast("Request sent. RenTools will let you know when it's available.", "success");
    } catch {
      showToast("Couldn't send your request. Try again.", "danger");
      // Input values are intentionally preserved (not cleared) so the
      // person doesn't have to retype anything.
    } finally {
      setSubmitting(false);
    }
  };

  // What we tell the person we're notifying them about — the specific
  // product passed in via state, whichever tool they picked from the
  // dropdown on a general request, or the tool name they typed in.
  const confirmedProductName =
    state.productName ?? selectedToolName ?? (values.customToolName.trim() || undefined);

  if (submitted) {
    return (
      <div>
        <div className="md:hidden">
          <PageHeader title="Request sent" />
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
              at {values.mobile}
              {confirmedProductName ? ` when ${confirmedProductName} is available` : " about your request"}.
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
                at {values.mobile}
                {confirmedProductName ? ` when ${confirmedProductName} is available` : " about your request"}.
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

  // General requests (no specific out-of-stock product handed in) let the
  // person pick which tool they mean from what's currently out of stock —
  // or leave it as a general request if their tool isn't listed yet.
  const toolNameField = isGeneralRequest && (
    <Select
      label="Tool name"
      name="toolName"
      value={selectedToolId}
      disabled={toolOptionsLoading}
      onChange={(e) => setSelectedToolId(e.target.value)}
    >
      <option value={OTHER_TOOL_OPTION}>
        {toolOptionsLoading ? "Loading tools…" : "Not listed / general request"}
      </option>
      {toolOptions.map((product) => (
        <option key={product.id} value={product.id}>
          {product.name}
        </option>
      ))}
    </Select>
  );

  // Shown only when "Not listed / general request" is selected — free-text
  // field so we still know what tool they're after.
  const customToolNameField = isOtherToolSelected && (
    <Input
      ref={customToolNameRef}
      label="What tool are you looking for?"
      name="customToolName"
      required
      value={values.customToolName}
      onChange={(e) => setField("customToolName", e.target.value)}
      error={errors.customToolName}
      placeholder="e.g. Concrete mixer"
    />
  );

  // Shown whenever the request targets a known out-of-stock tool — asks
  // how many days they need it for and the date window.
  const rentalWindowFields = isSpecificToolRequest && (
    <>
      <Input
        ref={numberOfDaysRef}
        label="Number of days"
        name="numberOfDays"
        type="number"
        min={1}
        inputMode="numeric"
        required
        value={values.numberOfDays}
        onChange={(e) => setField("numberOfDays", e.target.value)}
        error={errors.numberOfDays}
        placeholder="e.g. 3"
      />
      <div className="grid grid-cols-2 gap-3">
        <Input
          ref={rentFromRef}
          label="From"
          name="rentFrom"
          type="date"
          required
          value={values.rentFrom}
          onChange={(e) => setField("rentFrom", e.target.value)}
          error={errors.rentFrom}
        />
        <Input
          ref={rentToRef}
          label="To"
          name="rentTo"
          type="date"
          required
          min={values.rentFrom || undefined}
          value={values.rentTo}
          onChange={(e) => setField("rentTo", e.target.value)}
          error={errors.rentTo}
        />
      </div>
    </>
  );

  return (
    <div>
      <div className="md:hidden">
      <PageHeader title="Request a tool" />
      <form onSubmit={handleSubmit} className="space-y-4 p-4" noValidate>
        {state.productName && (
          <div className="spec-tag spec-tag--accent">{state.productName}</div>
        )}
        <p className="font-body text-[13px] text-graphite-500">
          Not currently in stock. Leave your details and RenTools will reach out once it's
          available.
        </p>

        {toolNameField}
        {customToolNameField}

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

        {rentalWindowFields}

        <Textarea
          label="Notes"
          name="notes"
          value={values.notes}
          onChange={(e) => setField("notes", e.target.value)}
          placeholder="Anything else RenTools should know (optional)"
        />

        <Button type="submit" variant="accent" fullWidth disabled={submitting}>
          {submitting ? "Sending…" : "Send request"}
        </Button>
      </form>
      </div>

      {/* Desktop / wide-viewport layout — simple form, so just a centered,
          narrower card rather than a two-column split. */}
      <div className="hidden md:block">
        <DesktopContainer className="flex justify-center py-14">
          <div className="w-full max-w-[480px]">
            <h1 className="mb-6 text-center font-display text-[26px] font-extrabold text-ink dark:text-ink-inverted">
              Request a tool
            </h1>
            <form
              onSubmit={handleSubmit}
              className="space-y-4 rounded-lg border border-graphite-200 bg-white p-8 dark:border-graphite-800 dark:bg-graphite-900"
              noValidate
            >
              {state.productName && (
                <div className="spec-tag spec-tag--accent">{state.productName}</div>
              )}
              <p className="font-body text-[13.5px] text-graphite-500">
                Not currently in stock. Leave your details and RenTools will reach out once
                it's available.
              </p>

              {toolNameField}
              {customToolNameField}

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

              {rentalWindowFields}

              <Textarea
                label="Notes"
                name="notes"
                value={values.notes}
                onChange={(e) => setField("notes", e.target.value)}
                placeholder="Anything else RenTools should know (optional)"
              />

              <Button type="submit" variant="accent" size="lg" fullWidth disabled={submitting}>
                {submitting ? "Sending…" : "Send request"}
              </Button>
            </form>
          </div>
        </DesktopContainer>
      </div>
    </div>
  );
}
