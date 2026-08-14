import { useState, type FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { createPurchaseRequest } from "../../../services/admin-purchase-requests.service";
import type { PurchaseRequestPriority } from "../../../services/admin-purchase-requests.service";
import type { AdminCustomer } from "../../../services/admin-customers.service";
import { CustomerPicker } from "../../../components/admin/CustomerPicker";
import { Input } from "../../../components/ui/Input";
import { Textarea } from "../../../components/ui/Textarea";
import { Select } from "../../../components/ui/Select";
import { Button } from "../../../components/ui/Button";
import { useToast } from "../../../components/ui/Toast";
import { PRIORITY_LABEL } from "../../../utils/purchase-request-status";

const PRIORITY_OPTIONS: PurchaseRequestPriority[] = ["low", "normal", "high"];

/**
 * Logs a purchase request on a customer's behalf (walk-in / phone call about
 * something not currently in stock). There's no public submission form yet
 * (see docs/ROUTES.md "Not yet built"), so this is currently the only way
 * requests get created. Reuses CustomerPicker as-is, same as RentalForm.
 */
export function PurchaseRequestForm() {
  const navigate = useNavigate();
  const { showToast } = useToast();

  const [customer, setCustomer] = useState<AdminCustomer | null>(null);
  const [productRequested, setProductRequested] = useState("");
  const [quantity, setQuantity] = useState<number | "">(1);
  const [priority, setPriority] = useState<PurchaseRequestPriority>("normal");
  const [notes, setNotes] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);

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
      await createPurchaseRequest({
        productRequested: productRequested.trim(),
        customerId: customer!.id,
        mobile: customer!.mobile,
        quantity: quantity === "" ? null : quantity,
        priority,
        notes,
      });
      showToast("Purchase request logged.", "success");
      navigate("/admin/purchase-requests");
    } catch {
      showToast("Couldn't save this request. Try again.", "danger");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-lg">
      <h1 className="mb-4 font-display text-[20px] font-bold text-ink dark:text-ink-inverted">
        New purchase request
      </h1>
      <form onSubmit={handleSubmit} className="space-y-5" noValidate>
        <div>
          <span className="mb-1 block font-body text-[13px] font-medium text-graphite-600 dark:text-graphite-300">
            Customer
          </span>
          <CustomerPicker value={customer} onChange={setCustomer} />
          {errors.customer && (
            <p className="mt-1 font-body text-[12px] text-state-danger">{errors.customer}</p>
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
            onClick={() => navigate("/admin/purchase-requests")}
            disabled={submitting}
          >
            Cancel
          </Button>
          <Button type="submit" fullWidth disabled={submitting}>
            {submitting ? "Saving…" : "Log request"}
          </Button>
        </div>
      </form>
    </div>
  );
}
