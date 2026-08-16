import { useEffect, useState, type FormEvent } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useAdminPurchaseRequest, useAdminCustomer } from "../../../hooks/useAdminData";
import {
  createPurchaseRequest,
  updatePurchaseRequest,
  type PurchaseRequestPriority,
} from "../../../services/admin-purchase-requests.service";
import type { AdminCustomer } from "../../../services/admin-customers.service";
import { CustomerPicker } from "../../../components/admin/CustomerPicker";
import { Input } from "../../../components/ui/Input";
import { Textarea } from "../../../components/ui/Textarea";
import { Select } from "../../../components/ui/Select";
import { Button } from "../../../components/ui/Button";
import { LoadingState } from "../../../components/ui/LoadingState";
import { ErrorState } from "../../../components/ui/ErrorState";
import { useToast } from "../../../components/ui/Toast";
import { PRIORITY_LABEL } from "../../../utils/purchase-request-status";

const PRIORITY_OPTIONS: PurchaseRequestPriority[] = ["low", "normal", "high"];

/**
 * Logs a purchase request on a customer's behalf (walk-in / phone call about
 * something not currently in stock), or edits one that already exists
 * (including ones a customer submitted anonymously via the public site,
 * which have no linked customer yet — the CustomerPicker below just starts
 * empty, pre-searched on their mobile number, so the edit doubles as a way
 * to link them to a customer record). Reuses CustomerPicker as-is, same as
 * RentalForm.
 */
export function PurchaseRequestForm() {
  const { id } = useParams<{ id: string }>();
  const isEdit = !!id;
  const navigate = useNavigate();
  const { showToast } = useToast();
  const existing = useAdminPurchaseRequest(id);
  const existingCustomerId =
    existing.status === "success" && existing.data?.customerId ? existing.data.customerId : undefined;
  const existingCustomer = useAdminCustomer(existingCustomerId);

  const [customer, setCustomer] = useState<AdminCustomer | null>(null);
  const [productRequested, setProductRequested] = useState("");
  const [quantity, setQuantity] = useState<number | "">(1);
  const [priority, setPriority] = useState<PurchaseRequestPriority>("normal");
  const [notes, setNotes] = useState("");
  const [initialMobile, setInitialMobile] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [prefilled, setPrefilled] = useState(false);

  // Waits for both the request and (if it has one) its linked customer to
  // resolve before filling the form in one go, so CustomerPicker mounts
  // with its final starting state instead of empty-then-filled.
  const stillLoadingCustomer = !!existingCustomerId && existingCustomer.status === "loading";

  useEffect(() => {
    if (!isEdit || prefilled || existing.status !== "success" || !existing.data || stillLoadingCustomer) return;
    const r = existing.data;
    setProductRequested(r.productRequested);
    setQuantity(r.quantity ?? "");
    setPriority(r.priority);
    setNotes(r.notes ?? "");
    setInitialMobile(r.mobile ?? "");
    if (existingCustomerId && existingCustomer.status === "success" && existingCustomer.data) {
      setCustomer(existingCustomer.data);
    }
    setPrefilled(true);
  }, [isEdit, prefilled, existing.status, existing.data, stillLoadingCustomer, existingCustomerId, existingCustomer.status, existingCustomer.data]);

  if (isEdit && (existing.status === "loading" || stillLoadingCustomer)) {
    return <LoadingState label="Loading purchase request…" />;
  }
  if (isEdit && (existing.status === "error" || (existing.status === "success" && !existing.data))) {
    return <ErrorState title="Couldn't load this purchase request" onRetry={existing.refetch} />;
  }

  const validate = (): boolean => {
    const next: Record<string, string> = {};
    if (!customer) next.customer = "Search for or add a customer.";
    if (!productRequested.trim()) next.productRequested = "Describe what the customer is asking for.";
    if (quantity !== "" && quantity <= 0) next.quantity = "Quantity must be positive.";
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (submitting || !validate()) return;
    setSubmitting(true);
    try {
      const payload = {
        productRequested: productRequested.trim(),
        customerId: customer!.id,
        mobile: customer!.mobile,
        quantity: quantity === "" ? null : quantity,
        priority,
        notes,
      };
      if (isEdit) {
        await updatePurchaseRequest(id!, payload);
        showToast("Purchase request updated.", "success");
        navigate(`/admin/purchase-requests/${id}`);
      } else {
        await createPurchaseRequest(payload);
        showToast("Purchase request logged.", "success");
        navigate("/admin/purchase-requests");
      }
    } catch {
      showToast("Couldn't save this request. Try again.", "danger");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-lg">
      <h1 className="mb-4 font-display text-[20px] font-bold text-ink dark:text-ink-inverted">
        {isEdit ? "Edit purchase request" : "New purchase request"}
      </h1>
      <form onSubmit={handleSubmit} className="space-y-5" noValidate>
        <div>
          <span className="mb-1 block font-body text-[13px] font-medium text-graphite-600 dark:text-graphite-300">
            Customer
          </span>
          <CustomerPicker
            value={customer}
            onChange={setCustomer}
            initialQuery={isEdit ? initialMobile : undefined}
            autoFocus={!isEdit}
          />
          {errors.customer && (
            <p className="mt-1 font-body text-[12px] text-state-danger-text dark:text-state-danger-text-dark">{errors.customer}</p>
          )}
        </div>

        <Textarea
          label="What are they asking for?"
          value={productRequested}
          onChange={(e) => setProductRequested(e.target.value)}
          error={errors.productRequested}
          placeholder="e.g. 12ft aluminium scaffold tower — not currently stocked"
        />

        <div className="grid grid-cols-2 gap-3">
          <Input
            label="Quantity"
            type="number"
            inputMode="numeric"
            min={1}
            value={quantity}
            onChange={(e) => setQuantity(e.target.value === "" ? "" : Number(e.target.value))}
            error={errors.quantity}
          />
          <Select
            label="Priority"
            value={priority}
            onChange={(e) => setPriority(e.target.value as PurchaseRequestPriority)}
          >
            {PRIORITY_OPTIONS.map((p) => (
              <option key={p} value={p}>{PRIORITY_LABEL[p]}</option>
            ))}
          </Select>
        </div>

        <div>
          <Textarea
            label="Notes"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
          />
          <p className="mt-1 font-body text-[12px] text-graphite-400">
            Optional. Sourcing leads, quoted price, supplier contact, etc.
          </p>
        </div>

        <div className="flex gap-2 pt-2">
          <Button
            type="button"
            variant="secondary"
            fullWidth
            onClick={() => navigate(isEdit ? `/admin/purchase-requests/${id}` : "/admin/purchase-requests")}
            disabled={submitting}
          >
            Cancel
          </Button>
          <Button type="submit" fullWidth disabled={submitting}>
            {submitting ? "Saving…" : isEdit ? "Save changes" : "Log request"}
          </Button>
        </div>
      </form>
    </div>
  );
}
