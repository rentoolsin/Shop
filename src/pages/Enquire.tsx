import { useRef, useState, type FormEvent } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { PageHeader } from "../components/layout/PageHeader";
import { Input } from "../components/ui/Input";
import { Textarea } from "../components/ui/Textarea";
import { Button } from "../components/ui/Button";
import { useToast } from "../components/ui/Toast";
import { submitEnquiry } from "../services/enquiries.service";
import { formatCurrency } from "../utils/currency";
import { useDocumentMeta } from "../hooks/useDocumentMeta";

interface LocationState {
  productId?: string;
  productName?: string;
  dailyRate?: number;
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

const EMPTY_FORM: FormValues = {
  name: "",
  mobile: "",
  quantity: "1",
  requiredDate: "",
  numberOfDays: "",
  address: "",
  message: "",
};

function validate(values: FormValues): Partial<Record<keyof FormValues, string>> {
  const errors: Partial<Record<keyof FormValues, string>> = {};
  if (!values.name.trim()) errors.name = "Enter your name.";
  if (!/^\+?[0-9]{10,13}$/.test(values.mobile.trim())) {
    errors.mobile = "Enter a valid mobile number.";
  }
  if (values.quantity && Number(values.quantity) <= 0) {
    errors.quantity = "Quantity must be greater than zero.";
  }
  return errors;
}

export function Enquire() {
  const location = useLocation();
  const navigate = useNavigate();
  const state = (location.state ?? {}) as LocationState;
  const { showToast } = useToast();

  const [values, setValues] = useState<FormValues>(EMPTY_FORM);
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

  // Live cost estimate — only shown when we actually know the rate (came
  // through from ProductDetail) and both quantity/days are valid numbers.
  const quantityNum = Number(values.quantity);
  const daysNum = Number(values.numberOfDays);
  const estimateValid =
    typeof state.dailyRate === "number" &&
    values.quantity !== "" &&
    values.numberOfDays !== "" &&
    quantityNum > 0 &&
    daysNum > 0;
  const estimatedTotal = estimateValid ? state.dailyRate! * quantityNum * daysNum : null;

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (submitting) return; // prevent duplicate submissions

    const validationErrors = validate(values);
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
    return (
      <div>
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
            at {values.mobile} about
            {state.productName ? ` ${state.productName}` : " your enquiry"}.
          </p>
          <div className="mt-2 flex w-full flex-col gap-2">
            <Button fullWidth onClick={() => navigate("/products")}>
              Browse more tools
            </Button>
            <Button variant="ghost" fullWidth onClick={() => navigate("/")}>
              Back to home
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div>
      <PageHeader title="Enquire" />
      <form onSubmit={handleSubmit} className="space-y-4 p-4" noValidate>
        {state.productName && (
          <div className="spec-tag spec-tag--accent">{state.productName}</div>
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

        {estimatedTotal !== null && (
          <div className="flex items-center justify-between rounded-lg border border-accent-200 bg-accent-50 px-3.5 py-3 dark:border-accent-500/30 dark:bg-graphite-900">
            <span className="font-body text-[13px] text-graphite-600 dark:text-graphite-300">
              Estimated total ({quantityNum} × {daysNum} day{daysNum === 1 ? "" : "s"})
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

        <Button type="submit" fullWidth disabled={submitting}>
          {submitting ? "Sending…" : "Send enquiry"}
        </Button>

        <p className="text-center font-body text-[11.5px] leading-snug text-graphite-400">
          A refundable security deposit may apply, confirmed when RenTools calls to
          confirm your enquiry.
        </p>
      </form>
    </div>
  );
}
