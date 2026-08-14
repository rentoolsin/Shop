import { useState, type FormEvent } from "react";
import { useLocation } from "react-router-dom";
import { PageHeader } from "../components/layout/PageHeader";
import { Input } from "../components/ui/Input";
import { Textarea } from "../components/ui/Textarea";
import { Button } from "../components/ui/Button";
import { useToast } from "../components/ui/Toast";
import { submitEnquiry } from "../services/enquiries.service";

interface LocationState {
  productId?: string;
  productName?: string;
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
  const state = (location.state ?? {}) as LocationState;
  const { showToast } = useToast();

  const [values, setValues] = useState<FormValues>(EMPTY_FORM);
  const [errors, setErrors] = useState<Partial<Record<keyof FormValues, string>>>({});
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const setField = (field: keyof FormValues, value: string) => {
    setValues((v) => ({ ...v, [field]: value }));
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (submitting) return; // prevent duplicate submissions

    const validationErrors = validate(values);
    setErrors(validationErrors);
    if (Object.keys(validationErrors).length > 0) return;

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
        <div className="p-4">
          <p className="font-body text-[14px] text-ink dark:text-ink-inverted">
            Thanks{values.name ? `, ${values.name}` : ""} — RenTools will contact you
            at {values.mobile} about
            {state.productName ? ` ${state.productName}` : " your enquiry"}.
          </p>
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
          label="Name"
          value={values.name}
          onChange={(e) => setField("name", e.target.value)}
          error={errors.name}
          placeholder="Your name"
        />

        <Input
          label="Mobile number"
          type="tel"
          inputMode="tel"
          value={values.mobile}
          onChange={(e) => setField("mobile", e.target.value)}
          error={errors.mobile}
          placeholder="10-digit mobile number"
        />

        <div className="grid grid-cols-2 gap-3">
          <Input
            label="Quantity"
            type="number"
            min={1}
            inputMode="numeric"
            value={values.quantity}
            onChange={(e) => setField("quantity", e.target.value)}
            error={errors.quantity}
          />
          <Input
            label="Number of days"
            type="number"
            min={1}
            inputMode="numeric"
            value={values.numberOfDays}
            onChange={(e) => setField("numberOfDays", e.target.value)}
          />
        </div>

        <Input
          label="Required date"
          type="date"
          value={values.requiredDate}
          onChange={(e) => setField("requiredDate", e.target.value)}
        />

        <Input
          label="Address"
          value={values.address}
          onChange={(e) => setField("address", e.target.value)}
          placeholder="Site address (optional)"
        />

        <Textarea
          label="Message"
          value={values.message}
          onChange={(e) => setField("message", e.target.value)}
          placeholder="Anything else RenTools should know (optional)"
        />

        <Button type="submit" fullWidth disabled={submitting}>
          {submitting ? "Sending…" : "Send enquiry"}
        </Button>
      </form>
    </div>
  );
}
