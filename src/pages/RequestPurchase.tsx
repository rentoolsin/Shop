import { useRef, useState, type FormEvent } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { PageHeader } from "../components/layout/PageHeader";
import { Input } from "../components/ui/Input";
import { Textarea } from "../components/ui/Textarea";
import { Button } from "../components/ui/Button";
import { useToast } from "../components/ui/Toast";
import { submitPurchaseRequest } from "../services/purchase-requests.service";
import { useDocumentMeta } from "../hooks/useDocumentMeta";

interface LocationState {
  productName?: string;
}

interface FormValues {
  name: string;
  mobile: string;
  quantity: string;
  notes: string;
}

const EMPTY_FORM: FormValues = { name: "", mobile: "", quantity: "1", notes: "" };

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

  const nameRef = useRef<HTMLInputElement>(null);
  const mobileRef = useRef<HTMLInputElement>(null);
  const quantityRef = useRef<HTMLInputElement>(null);
  const fieldRefs: Partial<Record<keyof FormValues, typeof nameRef>> = {
    name: nameRef,
    mobile: mobileRef,
    quantity: quantityRef,
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

    const validationErrors = validate(values);
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
        mobile: values.mobile.trim(),
        productRequested: state.productName ?? "Not specified",
        quantity: values.quantity ? Number(values.quantity) : undefined,
        notes: values.notes.trim() || undefined,
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

  if (submitted) {
    return (
      <div>
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
            {state.productName ? ` when ${state.productName} is available` : " about your request"}.
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
      <PageHeader title="Request a tool" />
      <form onSubmit={handleSubmit} className="space-y-4 p-4" noValidate>
        {state.productName && (
          <div className="spec-tag spec-tag--accent">{state.productName}</div>
        )}
        <p className="font-body text-[13px] text-graphite-500">
          Not currently in stock. Leave your details and RenTools will reach out once it's
          available.
        </p>

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

        <Textarea
          label="Notes"
          name="notes"
          value={values.notes}
          onChange={(e) => setField("notes", e.target.value)}
          placeholder="Anything else RenTools should know (optional)"
        />

        <Button type="submit" fullWidth disabled={submitting}>
          {submitting ? "Sending…" : "Send request"}
        </Button>
      </form>
    </div>
  );
}
