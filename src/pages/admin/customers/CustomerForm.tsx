import { useEffect, useState, type FormEvent } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useAdminCustomer } from "../../../hooks/useAdminData";
import {
  createCustomer,
  updateCustomer,
  type CustomerFormValues,
} from "../../../services/admin-customers.service";
import { Input } from "../../../components/ui/Input";
import { Button } from "../../../components/ui/Button";
import { Card } from "../../../components/ui/Card";
import { LoadingState } from "../../../components/ui/LoadingState";
import { ErrorState } from "../../../components/ui/ErrorState";
import { useToast } from "../../../components/ui/Toast";

const MOBILE_RE = /^\+?[0-9]{10,13}$/;

const EMPTY: CustomerFormValues = {
  name: "",
  mobile: "",
  address: "",
};

export function CustomerForm() {
  const { id } = useParams<{ id: string }>();
  const isEdit = !!id;
  const navigate = useNavigate();
  const { showToast } = useToast();
  const existing = useAdminCustomer(id);

  const [values, setValues] = useState<CustomerFormValues>(EMPTY);
  const [errors, setErrors] = useState<Partial<Record<keyof CustomerFormValues, string>>>({});
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (existing.status === "success" && existing.data) {
      setValues({
        name: existing.data.name,
        mobile: existing.data.mobile,
        address: existing.data.address ?? "",
      });
    }
  }, [existing.status, existing.data]);

  if (isEdit && existing.status === "loading") return <LoadingState label="Loading customer…" />;
  if (isEdit && existing.status === "error") {
    return <ErrorState title="Couldn't load this customer" onRetry={existing.refetch} />;
  }

  const setField = <K extends keyof CustomerFormValues>(field: K, value: CustomerFormValues[K]) => {
    setValues((v) => ({ ...v, [field]: value }));
  };

  const validate = (): boolean => {
    const next: typeof errors = {};
    if (!values.name.trim()) next.name = "Enter the customer's name.";
    if (!MOBILE_RE.test(values.mobile.trim())) next.mobile = "Enter a valid mobile number.";
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (submitting || !validate()) return;
    setSubmitting(true);
    try {
      const payload: CustomerFormValues = {
        name: values.name.trim(),
        mobile: values.mobile.trim(),
        address: values.address.trim(),
      };
      if (isEdit) {
        await updateCustomer(id!, payload);
        showToast("Customer updated.", "success");
      } else {
        await createCustomer(payload);
        showToast("Customer created.", "success");
      }
      navigate("/admin/customers");
    } catch {
      showToast("Couldn't save this customer. Try again.", "danger");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-md">
      <h1 className="mb-4 font-display text-[20px] font-bold text-ink dark:text-ink-inverted">
        {isEdit ? "Edit customer" : "New customer"}
      </h1>
      <form onSubmit={handleSubmit} className="space-y-4" noValidate>
        <Card className="space-y-4 p-4 sm:p-6">
        <Input
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
        <Input
          label="Address"
          value={values.address}
          onChange={(e) => setField("address", e.target.value)}
          hint="Optional."
        />
        </Card>
        <div className="flex gap-2 pt-2">
          <Button variant="secondary" fullWidth type="button" onClick={() => navigate("/admin/customers")}>
            Cancel
          </Button>
          <Button fullWidth type="submit" disabled={submitting}>
            {submitting ? "Saving…" : "Save"}
          </Button>
        </div>
      </form>
    </div>
  );
}
