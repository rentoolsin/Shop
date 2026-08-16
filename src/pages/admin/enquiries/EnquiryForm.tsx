import { useEffect, useRef, useState, type FormEvent } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { useAdminEnquiry } from "../../../hooks/useAdminData";
import { updateEnquiry, type EnquiryFormValues } from "../../../services/admin-enquiries.service";
import { Input } from "../../../components/ui/Input";
import { Textarea } from "../../../components/ui/Textarea";
import { Button } from "../../../components/ui/Button";
import { LoadingState } from "../../../components/ui/LoadingState";
import { ErrorState } from "../../../components/ui/ErrorState";
import { useToast } from "../../../components/ui/Toast";

const EMPTY: EnquiryFormValues = {
  name: "",
  mobile: "",
  requestedProductText: "",
  quantity: null,
  requiredDate: "",
  numberOfDays: null,
  address: "",
  message: "",
};

/**
 * Edit-only — enquiries only ever get created by a customer submitting the
 * public enquiry form (see `pages/Enquire.tsx`), there's no "New enquiry"
 * admin flow to mirror. This just lets an admin fix a typo'd name/mobile or
 * adjust the request details after the fact. `product_id` (the *linked*
 * product, if the enquiry was made from a product page) is intentionally
 * not editable here — see `updateEnquiry`'s docstring.
 */
export function EnquiryForm() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { showToast } = useToast();
  const existing = useAdminEnquiry(id);

  const [values, setValues] = useState<EnquiryFormValues>(EMPTY);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const nameRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (existing.status === "success" && existing.data) {
      const e = existing.data;
      setValues({
        name: e.name,
        mobile: e.mobile,
        requestedProductText: e.requestedProductText ?? "",
        quantity: e.quantity,
        requiredDate: e.requiredDate ?? "",
        numberOfDays: e.numberOfDays,
        address: e.address ?? "",
        message: e.message ?? "",
      });
    }
  }, [existing.status, existing.data]);

  useEffect(() => {
    nameRef.current?.focus();
  }, []);

  if (existing.status === "loading") return <LoadingState label="Loading enquiry…" />;
  if (existing.status === "error" || (existing.status === "success" && !existing.data)) {
    return (
      <ErrorState
        title="Couldn't load this enquiry"
        description={existing.status === "success" ? "It may have been removed." : undefined}
        onRetry={existing.status === "error" ? existing.refetch : undefined}
      />
    );
  }

  const setField = <K extends keyof EnquiryFormValues>(field: K, value: EnquiryFormValues[K]) => {
    setValues((v) => ({ ...v, [field]: value }));
  };

  const validate = (): boolean => {
    const next: Record<string, string> = {};
    if (!values.name.trim()) next.name = "Enter a name.";
    if (!values.mobile.trim()) next.mobile = "Enter a mobile number.";
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (submitting || !validate() || !id) return;
    setSubmitting(true);
    try {
      await updateEnquiry(id, values);
      showToast("Enquiry updated.", "success");
      navigate(`/admin/enquiries/${id}`);
    } catch {
      showToast("Couldn't save this enquiry. Try again.", "danger");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-lg">
      <Link
        to={`/admin/enquiries/${id}`}
        className="mb-4 block font-body text-[13px] font-medium text-graphite-700 hover:text-ink dark:text-graphite-300 dark:hover:text-ink-inverted"
      >
        ← Back to enquiry
      </Link>
      <h1 className="mb-4 font-display text-[20px] font-bold text-ink dark:text-ink-inverted">
        Edit enquiry
      </h1>
      <form onSubmit={handleSubmit} className="space-y-4" noValidate>
        <Input
          ref={nameRef}
          label="Name"
          value={values.name}
          onChange={(e) => setField("name", e.target.value)}
          error={errors.name}
        />
        <Input
          label="Mobile number"
          type="tel"
          inputMode="tel"
          value={values.mobile}
          onChange={(e) => setField("mobile", e.target.value)}
          error={errors.mobile}
        />
        <div>
          <Textarea
            label="Product requested"
            value={values.requestedProductText}
            onChange={(e) => setField("requestedProductText", e.target.value)}
            placeholder="e.g. 20ft extension ladder"
          />
          <p className="mt-1 font-body text-[12px] text-graphite-400">
            Optional — free text, separate from any linked catalog product.
          </p>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <Input
            label="Quantity"
            type="number"
            inputMode="numeric"
            min={1}
            value={values.quantity ?? ""}
            onChange={(e) => setField("quantity", e.target.value === "" ? null : Number(e.target.value))}
          />
          <Input
            label="Number of days"
            type="number"
            inputMode="numeric"
            min={1}
            value={values.numberOfDays ?? ""}
            onChange={(e) => setField("numberOfDays", e.target.value === "" ? null : Number(e.target.value))}
          />
        </div>
        <Input
          label="Required from"
          type="date"
          value={values.requiredDate}
          onChange={(e) => setField("requiredDate", e.target.value)}
        />
        <Input
          label="Address"
          value={values.address}
          onChange={(e) => setField("address", e.target.value)}
          hint="Optional."
        />
        <div>
          <Textarea
            label="Message"
            value={values.message}
            onChange={(e) => setField("message", e.target.value)}
          />
          <p className="mt-1 font-body text-[12px] text-graphite-400">Optional.</p>
        </div>

        <div className="flex gap-2 pt-2">
          <Button
            type="button"
            variant="secondary"
            fullWidth
            onClick={() => navigate(`/admin/enquiries/${id}`)}
            disabled={submitting}
          >
            Cancel
          </Button>
          <Button type="submit" fullWidth disabled={submitting}>
            {submitting ? "Saving…" : "Save changes"}
          </Button>
        </div>
      </form>
    </div>
  );
}
