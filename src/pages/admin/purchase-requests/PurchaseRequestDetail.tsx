import { useState } from "react";
import { Link, useParams } from "react-router-dom";
import { useAdminPurchaseRequest } from "../../../hooks/useAdminData";
import {
  updatePurchaseRequestStatus,
  updatePurchaseRequestPriority,
  type PurchaseRequestPriority,
} from "../../../services/admin-purchase-requests.service";
import { STATUS_LABEL, STATUS_TONE, PRIORITY_LABEL } from "../../../utils/purchase-request-status";
import type { PurchaseRequestStatus } from "../../../types/database";
import { StatusBadge } from "../../../components/ui/StatusBadge";
import { Select } from "../../../components/ui/Select";
import { Skeleton } from "../../../components/ui/Skeleton";
import { ErrorState } from "../../../components/ui/ErrorState";
import { useToast } from "../../../components/ui/Toast";

const STATUS_OPTIONS: PurchaseRequestStatus[] = ["requested", "sourcing", "fulfilled", "declined"];
const PRIORITY_OPTIONS: PurchaseRequestPriority[] = ["low", "normal", "high"];

export function PurchaseRequestDetail() {
  const { id } = useParams<{ id: string }>();
  const { showToast } = useToast();
  const request = useAdminPurchaseRequest(id);

  const [savingStatus, setSavingStatus] = useState(false);
  const [statusError, setStatusError] = useState(false);
  const [savingPriority, setSavingPriority] = useState(false);
  const [priorityError, setPriorityError] = useState(false);

  const handleStatusChange = async (status: PurchaseRequestStatus) => {
    if (!id || savingStatus) return;
    setSavingStatus(true);
    setStatusError(false);
    try {
      await updatePurchaseRequestStatus(id, status);
      showToast("Status updated.", "success");
      request.refetch();
    } catch {
      setStatusError(true);
      showToast("Couldn't update status. Try again.", "danger");
    } finally {
      setSavingStatus(false);
    }
  };

  const handlePriorityChange = async (priority: PurchaseRequestPriority) => {
    if (!id || savingPriority) return;
    setSavingPriority(true);
    setPriorityError(false);
    try {
      await updatePurchaseRequestPriority(id, priority);
      showToast("Priority updated.", "success");
      request.refetch();
    } catch {
      setPriorityError(true);
      showToast("Couldn't update priority. Try again.", "danger");
    } finally {
      setSavingPriority(false);
    }
  };

  if (request.status === "loading") {
    return (
      <div className="max-w-lg space-y-2">
        <Skeleton className="h-8 w-40" />
        <Skeleton className="h-40 w-full" />
      </div>
    );
  }

  if (request.status === "error" || !request.data) {
    return (
      <ErrorState
        title="Couldn't load this purchase request"
        description={!request.data && request.status === "success" ? "It may have been removed." : undefined}
        onRetry={request.status === "error" ? request.refetch : undefined}
      />
    );
  }

  const r = request.data;

  return (
    <div className="max-w-lg">
      <Link
        to="/admin/purchase-requests"
        className="mb-4 block font-body text-[13px] font-medium text-signal-600 dark:text-signal-400"
      >
        ← All purchase requests
      </Link>

      <div className="mb-4 flex items-start justify-between gap-3">
        <div>
          <h1 className="font-display text-[20px] font-bold text-ink dark:text-ink-inverted">
            {r.productRequested}
          </h1>
          <p className="font-mono text-[13px] text-graphite-500">
            {r.customerName ?? r.requesterName ?? r.mobile ?? "No contact on file"}
          </p>
        </div>
        <StatusBadge label={STATUS_LABEL[r.status]} tone={STATUS_TONE[r.status]} />
      </div>

      <div className="space-y-3 rounded-lg border border-graphite-200 bg-white p-4 dark:border-graphite-800 dark:bg-graphite-900">
        {r.customerName && <Detail label="Customer" value={r.customerName} />}
        {!r.customerName && r.requesterName && <Detail label="Name" value={r.requesterName} />}
        {r.mobile && <Detail label="Mobile" value={r.mobile} />}
        {r.quantity && <Detail label="Quantity" value={String(r.quantity)} />}
        <Detail label="Priority" value={PRIORITY_LABEL[r.priority]} />
        {r.notes && <Detail label="Notes" value={r.notes} />}
        <Detail label="Logged" value={new Date(r.createdAt).toLocaleString()} />
      </div>

      <div className="mt-5 grid grid-cols-2 gap-3">
        <div>
          <Select
            label="Status"
            value={r.status}
            onChange={(ev) => handleStatusChange(ev.target.value as PurchaseRequestStatus)}
            disabled={savingStatus}
          >
            {STATUS_OPTIONS.map((s) => (
              <option key={s} value={s}>{STATUS_LABEL[s]}</option>
            ))}
          </Select>
          {statusError && (
            <p className="mt-1 font-body text-[12px] text-state-danger">Couldn't save. Try again.</p>
          )}
        </div>
        <div>
          <Select
            label="Priority"
            value={r.priority}
            onChange={(ev) => handlePriorityChange(ev.target.value as PurchaseRequestPriority)}
            disabled={savingPriority}
          >
            {PRIORITY_OPTIONS.map((p) => (
              <option key={p} value={p}>{PRIORITY_LABEL[p]}</option>
            ))}
          </Select>
          {priorityError && (
            <p className="mt-1 font-body text-[12px] text-state-danger">Couldn't save. Try again.</p>
          )}
        </div>
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
