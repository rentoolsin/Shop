import { useEffect, useState, type FormEvent } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useAdminLocation } from "../../../hooks/useAdminData";
import { createLocation, updateLocation, type LocationFormValues } from "../../../services/admin-locations.service";
import { Input } from "../../../components/ui/Input";
import { Switch } from "../../../components/ui/Switch";
import { Button } from "../../../components/ui/Button";
import { LoadingState } from "../../../components/ui/LoadingState";
import { ErrorState } from "../../../components/ui/ErrorState";
import { useToast } from "../../../components/ui/Toast";

const EMPTY: LocationFormValues = {
  name: "",
  state: "",
  isAvailable: false,
  sortOrder: 0,
};

export function LocationForm() {
  const { id } = useParams<{ id: string }>();
  const isEdit = !!id;
  const navigate = useNavigate();
  const { showToast } = useToast();
  const existing = useAdminLocation(id);

  const [values, setValues] = useState<LocationFormValues>(EMPTY);
  const [errors, setErrors] = useState<Partial<Record<keyof LocationFormValues, string>>>({});
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (existing.status === "success" && existing.data) {
      setValues({
        name: existing.data.name,
        state: existing.data.state,
        isAvailable: existing.data.isAvailable,
        sortOrder: existing.data.sortOrder,
      });
    }
  }, [existing.status, existing.data]);

  if (isEdit && existing.status === "loading") return <LoadingState label="Loading location…" />;
  if (isEdit && existing.status === "error") {
    return <ErrorState title="Couldn't load this location" onRetry={existing.refetch} />;
  }

  const setField = <K extends keyof LocationFormValues>(field: K, value: LocationFormValues[K]) => {
    setValues((v) => ({ ...v, [field]: value }));
  };

  const validate = (): boolean => {
    const next: typeof errors = {};
    if (!values.name.trim()) next.name = "Enter a city name.";
    if (!values.state.trim()) next.state = "Enter a state.";
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (submitting || !validate()) return;
    setSubmitting(true);
    try {
      if (isEdit) {
        await updateLocation(id!, values);
        showToast("Location updated.", "success");
      } else {
        await createLocation(values);
        showToast("Location created.", "success");
      }
      navigate("/admin/locations");
    } catch {
      showToast("Couldn't save this location. Try again.", "danger");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-md">
      <h1 className="mb-4 font-display text-[20px] font-bold text-ink dark:text-ink-inverted">
        {isEdit ? "Edit location" : "New location"}
      </h1>
      <form onSubmit={handleSubmit} className="space-y-4" noValidate>
        <Input
          label="City"
          value={values.name}
          onChange={(e) => setField("name", e.target.value)}
          error={errors.name}
          placeholder="e.g. Chennai"
        />
        <Input
          label="State"
          value={values.state}
          onChange={(e) => setField("state", e.target.value)}
          error={errors.state}
          placeholder="e.g. Tamil Nadu"
        />
        <Input
          label="Sort order"
          type="number"
          value={values.sortOrder}
          onChange={(e) => setField("sortOrder", Number(e.target.value))}
          hint="Lower numbers appear first in the picker."
        />
        <Switch
          label="Available (we actually deliver here)"
          checked={values.isAvailable}
          onChange={(checked) => setField("isAvailable", checked)}
        />
        <p className="-mt-2 font-body text-[12px] text-graphite-400">
          Off shows "Coming soon" when a customer selects this location instead of switching to it.
        </p>
        <div className="flex gap-2 pt-2">
          <Button variant="secondary" fullWidth type="button" onClick={() => navigate("/admin/locations")}>
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
