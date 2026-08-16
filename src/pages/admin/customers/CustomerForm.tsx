import { CaretLeft } from "@phosphor-icons/react";
import { useEffect, useRef, useState, type FocusEvent, type FormEvent } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { useAdminCustomer } from "../../../hooks/useAdminData";
import {
  createCustomer,
  findCustomerByMobile,
  searchCustomersByMobile,
  updateCustomer,
  type AdminCustomer,
  type CustomerFormValues,
} from "../../../services/admin-customers.service";
import { Input } from "../../../components/ui/Input";
import { Button } from "../../../components/ui/Button";
import { Card } from "../../../components/ui/Card";
import { LoadingState } from "../../../components/ui/LoadingState";
import { ErrorState } from "../../../components/ui/ErrorState";
import { useToast } from "../../../components/ui/Toast";

// Indian mobile numbers: 10 digits, first digit 6-9, optional +91/0 prefix.
// (Was `/^\+?[0-9]{10,13}$/`, which only checked digit *count* — it let
// through junk like "888888888888" since that's 12 digits. Anchoring to
// the real national format also catches accidental extra/missing digits.)
const MOBILE_RE = /^(?:\+91|91|0)?[6-9]\d{9}$/;
const ALL_SAME_DIGIT_RE = /^(\d)\1{9}$/;
const HAS_LETTER_RE = /[A-Za-z]/;
const MIN_NAME_LENGTH = 2;
const MATCH_DEBOUNCE_MS = 250;
const MIN_MATCH_DIGITS = 3;

type FieldName = keyof CustomerFormValues;
type FieldErrors = Partial<Record<FieldName, string>>;

const EMPTY: CustomerFormValues = {
  name: "",
  mobile: "",
  altMobile: "",
  address: "",
};

/**
 * Strips spaces, hyphens, dots, and parens — the formatting people paste
 * numbers in with (e.g. "+91 96555 91196", "91-9655591196") — so those
 * still validate. Without this, MOBILE_RE saw the punctuation as an
 * invalid character and rejected an otherwise-correct number, which is
 * exactly what "won't accept the 91" turned out to be.
 */
function sanitizeMobile(mobile: string): string {
  return mobile.trim().replace(/[\s().-]/g, "");
}

/** Sanitizes, then strips a leading +91/91/0 so we always store/compare the bare 10-digit number. */
function normalizeMobile(mobile: string): string {
  return sanitizeMobile(mobile).replace(/^(?:\+91|91|0)/, "");
}

/** Sync checks only — no network. Used on blur/change for instant feedback, and again on submit as the final gate. */
function validateField(field: FieldName, values: CustomerFormValues): string | undefined {
  if (field === "name") {
    const name = values.name.trim();
    if (!name) return "Enter the customer's name.";
    if (name.length < MIN_NAME_LENGTH) return "Name is too short.";
    if (!HAS_LETTER_RE.test(name)) return "Name must contain letters.";
  }
  if (field === "mobile") {
    const mobile = sanitizeMobile(values.mobile);
    if (!mobile) return "Enter a mobile number.";
    if (!MOBILE_RE.test(mobile)) return "Enter a valid 10-digit Indian mobile number.";
    const bare = normalizeMobile(mobile);
    if (ALL_SAME_DIGIT_RE.test(bare)) return "That doesn't look like a real number.";
  }
  if (field === "altMobile") {
    const altMobile = sanitizeMobile(values.altMobile);
    if (!altMobile) return undefined; // optional — no value is fine
    if (!MOBILE_RE.test(altMobile)) return "Enter a valid 10-digit Indian mobile number.";
    const bare = normalizeMobile(altMobile);
    if (ALL_SAME_DIGIT_RE.test(bare)) return "That doesn't look like a real number.";
    if (bare === normalizeMobile(values.mobile)) return "This matches the primary mobile number.";
  }
  return undefined;
}

export function CustomerForm() {
  const { id } = useParams<{ id: string }>();
  const isEdit = !!id;
  const navigate = useNavigate();
  const { showToast } = useToast();
  const existing = useAdminCustomer(id);

  const [values, setValues] = useState<CustomerFormValues>(EMPTY);
  const [errors, setErrors] = useState<FieldErrors>({});
  const [touched, setTouched] = useState<Partial<Record<FieldName, boolean>>>({});
  const [submitting, setSubmitting] = useState(false);
  const [checkingMobile, setCheckingMobile] = useState(false);

  const [mobileMatches, setMobileMatches] = useState<AdminCustomer[]>([]);
  const [matchesLoading, setMatchesLoading] = useState(false);
  const [showMatches, setShowMatches] = useState(false);

  const nameRef = useRef<HTMLInputElement>(null);
  const mobileRef = useRef<HTMLInputElement>(null);
  const altMobileRef = useRef<HTMLInputElement>(null);
  // Guards against a slow duplicate-check response landing after the user
  // has already typed a different number.
  const mobileCheckToken = useRef(0);
  const matchesToken = useRef(0);

  useEffect(() => {
    if (existing.status === "success" && existing.data) {
      setValues({
        name: existing.data.name,
        mobile: existing.data.mobile,
        altMobile: existing.data.altMobile ?? "",
        address: existing.data.address ?? "",
      });
    }
  }, [existing.status, existing.data]);

  // New customer (not editing an existing one): put the cursor in Mobile
  // number — the first field in the form — as soon as the page is ready,
  // so admins can start typing immediately.
  useEffect(() => {
    if (!isEdit) mobileRef.current?.focus();
  }, [isEdit]);

  // Live "people who already exist" lookup as the mobile number is typed —
  // separate from checkMobileAvailability, which only fires on blur and
  // only flags an *exact* duplicate. This runs on every keystroke (once
  // there's enough to search on) so the admin sees possible matches before
  // they've even finished typing.
  useEffect(() => {
    const digits = sanitizeMobile(values.mobile);
    if (digits.length < MIN_MATCH_DIGITS) {
      setMobileMatches([]);
      setMatchesLoading(false);
      return;
    }
    const token = ++matchesToken.current;
    setMatchesLoading(true);
    const timer = window.setTimeout(() => {
      searchCustomersByMobile(digits)
        .then((data) => {
          if (token !== matchesToken.current) return;
          setMobileMatches(isEdit ? data.filter((c) => c.id !== id) : data);
        })
        .catch(() => {
          if (token === matchesToken.current) setMobileMatches([]);
        })
        .finally(() => {
          if (token === matchesToken.current) setMatchesLoading(false);
        });
    }, MATCH_DEBOUNCE_MS);
    return () => window.clearTimeout(timer);
  }, [values.mobile, isEdit, id]);

  if (isEdit && existing.status === "loading") return <LoadingState label="Loading customer…" />;
  if (isEdit && existing.status === "error") {
    return <ErrorState title="Couldn't load this customer" onRetry={existing.refetch} />;
  }

  const setField = <K extends FieldName>(field: K, value: CustomerFormValues[K]) => {
    setValues((v) => ({ ...v, [field]: value }));
    // Once a field has been touched, clear/update its error as the user
    // types rather than making them wait for the next blur or submit.
    if (touched[field]) {
      setErrors((prev) => ({ ...prev, [field]: validateField(field, { ...values, [field]: value }) }));
    }
    if (field === "mobile") setShowMatches(true);
  };

  const handleBlur = (field: FieldName) => (_e: FocusEvent<HTMLInputElement>) => {
    setTouched((t) => ({ ...t, [field]: true }));
    setErrors((prev) => ({ ...prev, [field]: validateField(field, values) }));

    if (field === "mobile") {
      void checkMobileAvailability();
      // Delay so a click on a suggestion (which blurs the input first)
      // still registers before the dropdown disappears.
      window.setTimeout(() => setShowMatches(false), 150);
    }
  };

  /** Jump straight to editing a matched existing customer instead of creating a duplicate. */
  const handleSelectMatch = (customer: AdminCustomer) => {
    setShowMatches(false);
    navigate(`/admin/customers/${customer.id}/edit`);
  };

  /** Live duplicate check, run on blur so the person finds out before they hit Save. */
  const checkMobileAvailability = async () => {
    const mobile = sanitizeMobile(values.mobile);
    if (!MOBILE_RE.test(mobile)) return; // format error already shown; don't also hit the network

    const token = ++mobileCheckToken.current;
    setCheckingMobile(true);
    try {
      const duplicate = await findCustomerByMobile(normalizeMobile(mobile), isEdit ? id : undefined);
      if (token !== mobileCheckToken.current) return; // number changed since this check started
      if (duplicate) {
        setErrors((prev) => ({ ...prev, mobile: `This number is already used by ${duplicate.name}.` }));
      }
    } catch {
      // Silent — this is a best-effort early warning. The submit-time
      // check (and the DB's own unique constraint) still catch it.
    } finally {
      if (token === mobileCheckToken.current) setCheckingMobile(false);
    }
  };

  const validate = (): FieldErrors => {
    const next: FieldErrors = {
      name: validateField("name", values),
      mobile: validateField("mobile", values),
      altMobile: validateField("altMobile", values),
    };
    setErrors(next);
    setTouched({ name: true, mobile: true, altMobile: true, address: true });
    return next;
  };

  // Focus order here must match the visual/tab order of the fields
  // (Mobile → Name → Address → Alt mobile) so the first error focused
  // is always the first one the user would actually tab to.
  const focusFirstError = (errs: FieldErrors) => {
    if (errs.mobile) mobileRef.current?.focus();
    else if (errs.name) nameRef.current?.focus();
    else if (errs.altMobile) altMobileRef.current?.focus();
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (submitting) return;
    const fieldErrors = validate();
    if (fieldErrors.name || fieldErrors.mobile || fieldErrors.altMobile) {
      focusFirstError(fieldErrors);
      return;
    }
    setSubmitting(true);
    try {
      const payload: CustomerFormValues = {
        name: values.name.trim(),
        mobile: normalizeMobile(values.mobile),
        altMobile: values.altMobile.trim() ? normalizeMobile(values.altMobile) : "",
        address: values.address.trim(),
      };

      const duplicate = await findCustomerByMobile(payload.mobile, isEdit ? id : undefined);
      if (duplicate) {
        setErrors((prev) => ({
          ...prev,
          mobile: `This number is already used by ${duplicate.name}.`,
        }));
        mobileRef.current?.focus();
        setSubmitting(false);
        return;
      }

      if (isEdit) {
        await updateCustomer(id!, payload);
        showToast("Customer updated.", "success");
      } else {
        await createCustomer(payload);
        showToast("Customer created.", "success");
      }
      navigate("/admin/customers");
    } catch (err) {
      const code = (err as { code?: string } | null)?.code;
      if (code === "23505") {
        setErrors((prev) => ({ ...prev, mobile: "This number is already used by another customer." }));
        mobileRef.current?.focus();
      } else {
        showToast("Couldn't save this customer. Try again.", "danger");
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-md">
      <div className="mb-4 flex items-center gap-2">
        <Link
          to="/admin/customers"
          aria-label="Back to customers"
          className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded text-graphite-500 hover:bg-graphite-100 dark:text-graphite-400 dark:hover:bg-graphite-800"
        >
          <CaretLeft className="h-5 w-5" weight="bold" />
        </Link>
        <h1 className="font-display text-[20px] font-bold text-ink dark:text-ink-inverted">
          {isEdit ? "Edit customer" : "New customer"}
        </h1>
      </div>
      <form onSubmit={handleSubmit} className="space-y-4" noValidate>
        <Card className="space-y-4 p-4 sm:p-6">
          <div className="relative">
            <Input
              ref={mobileRef}
              label="Mobile number"
              type="tel"
              inputMode="tel"
              value={values.mobile}
              onChange={(e) => setField("mobile", e.target.value)}
              onFocus={() => setShowMatches(true)}
              onBlur={handleBlur("mobile")}
              error={touched.mobile ? errors.mobile : undefined}
              hint={checkingMobile ? "Checking number…" : undefined}
              autoComplete="tel"
            />
            {showMatches && (matchesLoading || mobileMatches.length > 0) && (
              <div className="absolute z-10 mt-1 w-full overflow-hidden rounded border border-graphite-200 bg-white shadow-md dark:border-graphite-800 dark:bg-graphite-900">
                {matchesLoading && (
                  <p className="px-3 py-2 font-body text-[13px] text-graphite-500">Searching…</p>
                )}
                {!matchesLoading &&
                  mobileMatches.map((customer) => (
                    <button
                      key={customer.id}
                      type="button"
                      // onMouseDown (not onClick) fires before the input's onBlur,
                      // so the selection registers before the dropdown closes.
                      onMouseDown={(e) => {
                        e.preventDefault();
                        handleSelectMatch(customer);
                      }}
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
          </div>
          <Input
            ref={nameRef}
            label="Name"
            value={values.name}
            onChange={(e) => setField("name", e.target.value)}
            onBlur={handleBlur("name")}
            error={touched.name ? errors.name : undefined}
            autoComplete="name"
          />
          <Input
            label="Address"
            value={values.address}
            onChange={(e) => setField("address", e.target.value)}
            hint="Optional."
            autoComplete="street-address"
          />
          <Input
            ref={altMobileRef}
            label="Additional mobile number"
            type="tel"
            inputMode="tel"
            value={values.altMobile}
            onChange={(e) => setField("altMobile", e.target.value)}
            onBlur={handleBlur("altMobile")}
            error={touched.altMobile ? errors.altMobile : undefined}
            hint={touched.altMobile && errors.altMobile ? undefined : "Optional."}
            autoComplete="tel"
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
