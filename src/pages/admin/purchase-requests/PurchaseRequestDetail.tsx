import { useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { useAdminPurchaseRequest } from "../../../hooks/useAdminData";
import {
  updatePurchaseRequestStatus,
  updatePurchaseRequestPriority,
  deletePurchaseRequest,
  type PurchaseRequestPriority,
} from "../../../services/admin-purchase-requests.service";
import { STATUS_LABEL, STATUS_TONE, PRIORITY_LABEL } from "../../../utils/purchase-request-status";
import type { PurchaseRequestStatus } from "../../../types/database";
import { Button } from "../../../components/ui/Button";
import { StatusBadge } from "../../../components/ui/StatusBadge";
import { Select } from "../../../components/ui/Select";
import { Card } from "../../../components/ui/Card";
import { Skeleton } from "../../../components/ui/Skeleton";
import { ErrorState } from "../../../components/ui/ErrorState";
import { ConfirmDialog } from "../../../components/ui/ConfirmDialog";
import { useToast } from "../../../components/ui/Toast";

const STATUS_OPTIONS: PurchaseRequestStatus[] = ["requested", "sourcing", "fulfilled", "declined"];
const PRIORITY_OPTIONS: PurchaseRequestPriority[] = ["low", "normal", "high"];

export function PurchaseRequestDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { showToast } = useToast();
  const request = useAdminPurchaseRequest(id);

  const [savingStatus, setSavingStatus] = useState(false);
  const [statusError, setStatusError] = useState(false);
  const [savingPriority, setSavingPriority] = useState(false);
  const [priorityError, setPriorityError] = useState(false);
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);

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

  const handleDelete = async () => {
    if (!id) return;
    setDeleting(true);
    try {
      await deletePurchaseRequest(id);
      showToast("Purchase request deleted.", "success");
      navigate("/admin/purchase-requests");
    } catch {
      showToast("Couldn't delete this request. Try again.", "danger");
      setDeleting(false);
      setConfirmingDelete(false);
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
    <div className="lg:max-w-4xl">
      <Link
        to="/admin/purchase-requests"
        className="mb-4 block font-body text-[13px] font-medium text-graphite-700 hover:text-ink dark:text-graphite-300 dark:hover:text-ink-inverted"
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
        <div className="flex flex-shrink-0 items-center gap-2">
          <StatusBadge label={STATUS_LABEL[r.status]} tone={STATUS_TONE[r.status]} />
          <Link to={`/admin/purchase-requests/${r.id}/edit`}>
            <Button variant="secondary" size="sm">Edit</Button>
          </Link>
          <Button variant="ghost" size="sm" onClick={() => setConfirmingDelete(true)}>
            Delete
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-[1fr_320px] lg:items-start">
        <Card className="max-w-lg space-y-3 p-4 lg:max-w-none">
          {r.customerName && <Detail label="Customer" value={r.customerName} />}
          {!r.customerName && r.requesterName && <Detail label="Name" value={r.requesterName} />}
          {r.mobile && <Detail label="Mobile" value={r.mobile} />}
          {r.quantity && <Detail label="Quantity" value={String(r.quantity)} />}
          <Detail label="Priority" value={PRIORITY_LABEL[r.priority]} />
          {r.notes && <Detail label="Notes" value={r.notes} />}
          <Detail label="Logged" value={new Date(r.createdAt).toLocaleString()} />
        </Card>

        <div className="max-w-lg space-y-3 lg:sticky lg:top-6 lg:max-w-none">
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
              <p className="mt-1 font-body text-[12px] text-state-danger-text dark:text-state-danger-text-dark">Couldn't save. Try again.</p>
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
              <p className="mt-1 font-body text-[12px] text-state-danger-text dark:text-state-danger-text-dark">Couldn't save. Try again.</p>
            )}
          </div>
        </div>
      </div>

      <ConfirmDialog
        open={confirmingDelete}
        title="Delete purchase request?"
        description={`"${r.productRequested}" will be permanently removed.`}
        onConfirm={handleDelete}
        onCancel={() => setConfirmingDelete(false)}
        loading={deleting}
      />
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
