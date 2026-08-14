import { useEffect, useState } from "react";
import {
  searchCustomersByMobile,
  createCustomer,
  type AdminCustomer,
  type CustomerFormValues,
} from "../../services/admin-customers.service";
import { Input } from "../ui/Input";
import { Button } from "../ui/Button";

const DEBOUNCE_MS = 300;
const MOBILE_RE = /^\+?[0-9]{10,13}$/;
const EMPTY_NEW: CustomerFormValues = { name: "", mobile: "", address: "" };

interface CustomerPickerProps {
  /** Currently selected customer, or null if none chosen yet. */
  value: AdminCustomer | null;
  onChange: (customer: AdminCustomer | null) => void;
  /**
   * Pre-fills and immediately searches by this mobile number on mount —
   * used by enquiry → rental conversion to jump straight to "does this
   * enquiry's mobile already match a customer?" instead of an empty box.
   */
  initialQuery?: string;
  /** Pre-fills the name field if the admin ends up creating a new customer. */
  initialName?: string;
}

/**
 * Search-by-mobile → select → auto-populate, or create-inline if no match.
 * Implements the customer lookup behavior described in BUSINESS-RULES.md.
 * Kept generic (not rental-specific) — reused as-is for enquiry → rental
 * conversion (see EnquiryDetail.tsx) via `initialQuery`/`initialName`.
 */
export function CustomerPicker({ value, onChange, initialQuery, initialName }: CustomerPickerProps) {
  const [query, setQuery] = useState(initialQuery ?? "");
  const [debounced, setDebounced] = useState(initialQuery ?? "");
  const [results, setResults] = useState<AdminCustomer[]>([]);
  const [searching, setSearching] = useState(false);
  const [searchError, setSearchError] = useState(false);
  const [creating, setCreating] = useState(false);
  const [newValues, setNewValues] = useState<CustomerFormValues>(EMPTY_NEW);
  const [newErrors, setNewErrors] = useState<Partial<Record<keyof CustomerFormValues, string>>>({});
  const [savingNew, setSavingNew] = useState(false);

  useEffect(() => {
    const timer = window.setTimeout(() => setDebounced(query), DEBOUNCE_MS);
    return () => window.clearTimeout(timer);
  }, [query]);

  useEffect(() => {
    if (!debounced.trim()) {
      setResults([]);
      setSearchError(false);
      return;
    }
    let cancelled = false;
    setSearching(true);
    setSearchError(false);
    searchCustomersByMobile(debounced)
      .then((data) => {
        if (!cancelled) setResults(data);
      })
      .catch(() => {
        if (!cancelled) setSearchError(true);
      })
      .finally(() => {
        if (!cancelled) setSearching(false);
      });
    return () => {
      cancelled = true;
    };
  }, [debounced]);

  const handleSelect = (customer: AdminCustomer) => {
    onChange(customer);
    setQuery("");
    setDebounced("");
    setResults([]);
    setCreating(false);
  };

  const startCreate = () => {
    setNewValues({
      name: initialName ?? "",
      mobile: debounced.trim() || initialQuery?.trim() || "",
      address: "",
    });
    setNewErrors({});
    setCreating(true);
  };

  const validateNew = (): boolean => {
    const next: typeof newErrors = {};
    if (!newValues.name.trim()) next.name = "Enter the customer's name.";
    if (!MOBILE_RE.test(newValues.mobile.trim())) next.mobile = "Enter a valid mobile number.";
    setNewErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleCreate = async () => {
    if (savingNew || !validateNew()) return;
    setSavingNew(true);
    try {
      const customer = await createCustomer({
        name: newValues.name.trim(),
        mobile: newValues.mobile.trim(),
        address: newValues.address.trim(),
      });
      handleSelect(customer);
    } catch {
      setNewErrors((e) => ({ ...e, mobile: "Couldn't save this customer. Try again." }));
    } finally {
      setSavingNew(false);
    }
  };

  if (value) {
    return (
      <div className="rounded border border-graphite-200 bg-white p-3 dark:border-graphite-800 dark:bg-graphite-900">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="font-body text-[14px] font-medium text-ink dark:text-ink-inverted">
              {value.name}
            </p>
            <p className="font-mono text-[13px] text-graphite-500">{value.mobile}</p>
            {value.address && (
              <p className="mt-1 font-body text-[12px] text-graphite-400">{value.address}</p>
            )}
          </div>
          <Button type="button" variant="ghost" size="sm" onClick={() => onChange(null)}>
            Change
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div>
      <Input
        label="Customer mobile number"
        type="tel"
        inputMode="tel"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Search by mobile number"
        hint={!creating ? "Type a few digits to find an existing customer." : undefined}
      />

      {searching && (
        <p className="mt-2 font-body text-[13px] text-graphite-500">Searching…</p>
      )}

      {!searching && searchError && (
        <p className="mt-2 font-body text-[13px] text-state-danger">
          Couldn't search customers. Try again.
        </p>
      )}

      {!searching && !searchError && debounced.trim() && results.length > 0 && (
        <div className="mt-2 divide-y divide-graphite-200 rounded border border-graphite-200 dark:divide-graphite-800 dark:border-graphite-800">
          {results.map((customer) => (
            <button
              key={customer.id}
              type="button"
              onClick={() => handleSelect(customer)}
              className="flex w-full items-center justify-between gap-3 px-3 py-2 text-left hover:bg-graphite-50 dark:hover:bg-graphite-800"
            >
              <span>
                <span className="block font-body text-[14px] text-ink dark:text-ink-inverted">
                  {customer.name}
                </span>
                <span className="block font-mono text-[12px] text-graphite-500">
                  {customer.mobile}
                </span>
              </span>
            </button>
          ))}
        </div>
      )}

      {!searching && !searchError && debounced.trim() && results.length === 0 && !creating && (
        <div className="mt-2 flex items-center justify-between gap-3 rounded border border-dashed border-graphite-300 px-3 py-2 dark:border-graphite-700">
          <p className="font-body text-[13px] text-graphite-500">
            No customer matches "{debounced}".
          </p>
          <Button type="button" variant="secondary" size="sm" onClick={startCreate}>
            New customer
          </Button>
        </div>
      )}

      {!creating && !debounced.trim() && (
        <button
          type="button"
          onClick={startCreate}
          className="mt-2 font-body text-[13px] font-medium text-signal-600 dark:text-signal-400"
        >
          + Add a new customer instead
        </button>
      )}

      {creating && (
        <div className="mt-3 space-y-3 rounded border border-graphite-200 p-3 dark:border-graphite-800">
          <Input
            label="Name"
            value={newValues.name}
            onChange={(e) => setNewValues((v) => ({ ...v, name: e.target.value }))}
            error={newErrors.name}
          />
          <Input
            label="Mobile number"
            type="tel"
            inputMode="tel"
            value={newValues.mobile}
            onChange={(e) => setNewValues((v) => ({ ...v, mobile: e.target.value }))}
            error={newErrors.mobile}
          />
          <Input
            label="Address"
            value={newValues.address}
            onChange={(e) => setNewValues((v) => ({ ...v, address: e.target.value }))}
            hint="Optional."
          />
          <div className="flex gap-2">
            <Button
              type="button"
              variant="secondary"
              fullWidth
              onClick={() => setCreating(false)}
              disabled={savingNew}
            >
              Cancel
            </Button>
            <Button type="button" fullWidth onClick={handleCreate} disabled={savingNew}>
              {savingNew ? "Saving…" : "Save customer"}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
