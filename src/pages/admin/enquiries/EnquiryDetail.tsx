import { useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { useAdminEnquiry } from "../../../hooks/useAdminData";
import { updateEnquiryStatus } from "../../../services/admin-enquiries.service";
import { useProduct } from "../../../hooks/useProducts";
import { RentalForm } from "../rentals/RentalForm";
import { STATUS_LABEL, STATUS_TONE } from "../../../utils/enquiry-status";
import type { EnquiryStatus } from "../../../types/database";
import { Button } from "../../../components/ui/Button";
import { StatusBadge } from "../../../components/ui/StatusBadge";
import { Select } from "../../../components/ui/Select";
import { Skeleton } from "../../../components/ui/Skeleton";
import { ErrorState } from "../../../components/ui/ErrorState";
import { useToast } from "../../../components/ui/Toast";

const STATUS_OPTIONS: EnquiryStatus[] = ["new", "contacted", "converted", "not_available", "closed"];

/** required_date + number_of_days -> an inclusive return date, for pre-filling the rental form. */
function computeReturnDate(requiredDate: string, numberOfDays: number | null): string {
  if (!numberOfDays || numberOfDays <= 1) return requiredDate;
  const d = new Date(requiredDate + "T00:00:00");
  d.setDate(d.getDate() + numberOfDays - 1);
  return d.toISOString().slice(0, 10);
}

export function EnquiryDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { showToast } = useToast();
  const enquiry = useAdminEnquiry(id);
  const product = useProduct(
    enquiry.status === "success" && enquiry.data?.productId ? enquiry.data.productId : undefined,
  );

  const [savingStatus, setSavingStatus] = useState(false);
  const [statusError, setStatusError] = useState(false);
  const [converting, setConverting] = useState(false);

  const handleStatusChange = async (status: EnquiryStatus) => {
    if (!id || savingStatus) return;
    setSavingStatus(true);
    setStatusError(false);
    try {
      await updateEnquiryStatus(id, status);
      showToast("Enquiry status updated.", "success");
      enquiry.refetch();
    } catch {
      setStatusError(true);
      showToast("Couldn't update status. Try again.", "danger");
    } finally {
      setSavingStatus(false);
    }
  };

  const handleRentalCreated = async (rentalId: string) => {
    if (!id) return;
    try {
      await updateEnquiryStatus(id, "converted");
      showToast("Rental created and enquiry marked converted.", "success");
    } catch {
      // The rental itself was created successfully — surface the follow-up
      // failure separately so the admin knows to update the status by hand,
      // rather than implying the whole conversion failed.
      showToast(
        "Rental created, but the enquiry status couldn't be updated. Set it to \"Converted to Rental\" manually.",
        "danger",
      );
    }
    navigate(`/admin/rentals`, { state: { highlightRentalId: rentalId } });
  };

  if (enquiry.status === "loading") {
    return (
      <div className="max-w-lg space-y-2">
        <Skeleton className="h-8 w-40" />
        <Skeleton className="h-40 w-full" />
      </div>
    );
  }

  if (enquiry.status === "error" || !enquiry.data) {
    return (
      <ErrorState
        title="Couldn't load this enquiry"
        description={!enquiry.data && enquiry.status === "success" ? "It may have been removed." : undefined}
        onRetry={enquiry.status === "error" ? enquiry.refetch : undefined}
      />
    );
  }

  const e = enquiry.data;
  const alreadyConverted = e.status === "converted";

  if (converting) {
    const categoryId = product.status === "success" && product.data ? product.data.categoryId : "";
    return (
      <div>
        <button
          onClick={() => setConverting(false)}
          className="mb-4 font-body text-[13px] font-medium text-graphite-700 hover:text-ink dark:text-graphite-300 dark:hover:text-ink-inverted"
        >
          ← Back to enquiry
        </button>
        <RentalForm
          enquiryId={e.id}
          title="Convert enquiry to rental"
          submitLabel="Create rental"
          initialCustomerQuery={e.mobile}
          initialCustomerName={e.name}
          initialCategoryId={categoryId}
          initialProductId={e.productId ?? ""}
          initialQuantity={e.quantity ?? 1}
          initialStartDate={e.requiredDate ?? undefined}
          initialReturnDate={
            e.requiredDate ? computeReturnDate(e.requiredDate, e.numberOfDays) : undefined
          }
          onCreated={handleRentalCreated}
          onCancel={() => setConverting(false)}
        />
      </div>
    );
  }

  return (
    <div className="max-w-lg">
      <Link to="/admin/enquiries" className="mb-4 block font-body text-[13px] font-medium text-graphite-700 hover:text-ink dark:text-graphite-300 dark:hover:text-ink-inverted">
        ← All enquiries
      </Link>

      <div className="mb-4 flex items-start justify-between gap-3">
        <div>
          <h1 className="font-display text-[20px] font-bold text-ink dark:text-ink-inverted">{e.name}</h1>
          <p className="font-mono text-[13px] text-graphite-500">{e.mobile}</p>
        </div>
        <StatusBadge label={STATUS_LABEL[e.status]} tone={STATUS_TONE[e.status]} />
      </div>

      <div className="space-y-3 rounded border border-graphite-200 bg-white p-4 dark:border-graphite-800 dark:bg-graphite-900">
        <Detail label="Product" value={e.productName ?? e.requestedProductText ?? "Not specified"} />
        {e.quantity && <Detail label="Quantity" value={String(e.quantity)} />}
        {e.requiredDate && <Detail label="Required from" value={e.requiredDate} />}
        {e.numberOfDays && <Detail label="Number of days" value={String(e.numberOfDays)} />}
        {e.address && <Detail label="Address" value={e.address} />}
        {e.message && <Detail label="Message" value={e.message} />}
        <Detail label="Submitted" value={new Date(e.createdAt).toLocaleString()} />
      </div>

      <div className="mt-5">
        <Select
          label="Status"
          value={e.status}
          onChange={(ev) => handleStatusChange(ev.target.value as EnquiryStatus)}
          disabled={savingStatus}
        >
          {STATUS_OPTIONS.map((s) => (
            <option key={s} value={s}>{STATUS_LABEL[s]}</option>
          ))}
        </Select>
        {statusError && (
          <p className="mt-1 font-body text-[12px] text-state-danger-text dark:text-state-danger-text-dark">Couldn't save. Try again.</p>
        )}
      </div>

      <div className="mt-5 border-t border-graphite-200 pt-5 dark:border-graphite-800">
        <Button fullWidth onClick={() => setConverting(true)} disabled={alreadyConverted}>
          {alreadyConverted ? "Already converted to rental" : "Convert to Rental"}
        </Button>
        {!alreadyConverted && (
          <p className="mt-2 font-body text-[12px] text-graphite-500">
            Carries this enquiry's name, mobile, product and dates into a new rental. The
            original enquiry is preserved and marked "Converted to Rental" once the rental is
            created.
          </p>
        )}
      </div>
    </div>
  );
}

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="font-body text-[12px] font-medium uppercase tracking-wide text-graphite-400">{label}</p>
      <p className="font-body text-[14px] text-ink dark:text-ink-inverted">{value}</p>
    </div>
  );
}
