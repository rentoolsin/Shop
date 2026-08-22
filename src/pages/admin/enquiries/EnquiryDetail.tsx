import { useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { useAdminEnquiry } from "../../../hooks/useAdminData";
import { updateEnquiryStatus, deleteEnquiry } from "../../../services/admin-enquiries.service";
import type { AdminEnquiryItem } from "../../../services/admin-enquiries.service";
import { useProduct } from "../../../hooks/useProducts";
import { RentalForm } from "../rentals/RentalForm";
import { STATUS_LABEL, STATUS_TONE, ENQUIRY_STATUS_TRANSITIONS, REOPEN_TARGET_STATUS } from "../../../utils/enquiry-status";
import { formatCurrency } from "../../../utils/currency";
import type { EnquiryStatus } from "../../../types/database";
import { Button } from "../../../components/ui/Button";
import { StatusBadge } from "../../../components/ui/StatusBadge";
import { Select } from "../../../components/ui/Select";
import { Skeleton } from "../../../components/ui/Skeleton";
import { ErrorState } from "../../../components/ui/ErrorState";
import { ConfirmDialog } from "../../../components/ui/ConfirmDialog";
import { useToast } from "../../../components/ui/Toast";

/**
 * Options offered by the Status dropdown for a given *current* status —
 * always the current value itself (so the select has something to show)
 * plus whatever it's legally allowed to move to next. "converted" is never
 * included: it's reached only via the Convert to Rental flow and left only
 * via the explicit Reopen action below, never a raw dropdown pick. See
 * ENQUIRY_STATUS_TRANSITIONS.
 */
function statusOptionsFor(current: EnquiryStatus): EnquiryStatus[] {
  if (current === "converted") return ["converted"];
  const next = ENQUIRY_STATUS_TRANSITIONS[current];
  return [current, ...next];
}

/** required_date + number_of_days -> an inclusive return date, for pre-filling the rental form. */
function computeReturnDate(requiredDate: string, numberOfDays: number | null): string {
  if (!numberOfDays || numberOfDays <= 1) return requiredDate;
  const d = new Date(requiredDate + "T00:00:00");
  d.setDate(d.getDate() + numberOfDays - 1);
  return d.toISOString().slice(0, 10);
}

/** "Convert to Rental" screen state. See the state machine notes below. */
type ConvertMode = "closed" | "picking" | "form";

export function EnquiryDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { showToast } = useToast();
  const enquiry = useAdminEnquiry(id);

  const [savingStatus, setSavingStatus] = useState(false);
  const [statusError, setStatusError] = useState(false);
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);
  // Set when the admin picks "Converted to Rental" from the Status dropdown
  // directly, while items are still unconverted — see the confirm dialog
  // below. Not used for any other status change.
  const [confirmingStatusWithPendingItems, setConfirmingStatusWithPendingItems] = useState(false);
  // "Reopen enquiry" — the only way out of "converted". See
  // ENQUIRY_STATUS_TRANSITIONS / REOPEN_TARGET_STATUS in utils/enquiry-status.
  const [confirmingReopen, setConfirmingReopen] = useState(false);

  // Convert to Rental: for a multi-item enquiry there's no single "the"
  // product/quantity/days to carry over, so the admin picks one item at a
  // time to convert, in its own rental. `selectedItem` is null for a
  // legacy single-product enquiry (items.length <= 1), where there's
  // nothing to pick and we go straight to the form.
  // Which items are already converted lives on the server
  // (`enquiry_items.rental_id`, see 0025_enquiry_items_rental_link.sql) so
  // it survives a refresh. `convertedItemIds` is just an optimistic
  // overlay: it marks an item done the instant its rental is created, so
  // the picker updates immediately rather than waiting on a refetch
  // round-trip.
  const [convertMode, setConvertMode] = useState<ConvertMode>("closed");
  const [selectedItem, setSelectedItem] = useState<AdminEnquiryItem | null>(null);
  const [convertedItemIds, setConvertedItemIds] = useState<Set<string>>(new Set());

  const product = useProduct(
    selectedItem?.productId ??
      (enquiry.status === "success" && enquiry.data?.productId ? enquiry.data.productId : undefined) ??
      undefined,
  );

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

  const handleDelete = async () => {
    if (!id) return;
    setDeleting(true);
    try {
      await deleteEnquiry(id);
      showToast("Enquiry deleted.", "success");
      navigate("/admin/enquiries");
    } catch {
      showToast("Couldn't delete this enquiry. Try again.", "danger");
      setDeleting(false);
      setConfirmingDelete(false);
    }
  };

  const finishConversion = async (rentalId: string) => {
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
    try {
      navigate(`/admin/rentals`, { state: { highlightRentalId: rentalId } });
    } catch (navErr) {
      // Shouldn't happen, but if it ever does, don't leave this silent —
      // the rental and status are already saved either way.
      console.error("Rental created and enquiry converted, but redirect to Rentals failed:", navErr);
    }
  };

  /**
   * Called by RentalForm once a rental is actually created. For a legacy
   * single-product enquiry (no `selectedItem`) that's the whole job, same
   * as before: mark converted and hop to the rental. For a multi-item
   * enquiry, only do that once every item has a rental — otherwise stay on
   * the picker so the admin can convert the next item.
   */
  const handleRentalCreated = async (rentalId: string, items: AdminEnquiryItem[]) => {
    if (!selectedItem) {
      await finishConversion(rentalId);
      return;
    }
    const nowConverted = new Set(convertedItemIds).add(selectedItem.id);
    setConvertedItemIds(nowConverted);
    // Not calling enquiry.refetch() here deliberately: that resets state to
    // {status: "loading", data: null} and flashes the whole page back to
    // the loading skeleton mid-flow. The enquiries/enquiry_items tables are
    // already realtime-watched (see useAdminEnquiry), which uses a quiet
    // background refresh that swaps in the new rental_id without disrupting
    // whatever's on screen — that's enough to eventually reflect the stamp.
    const remaining = items.filter((item) => item.rentalId == null && !nowConverted.has(item.id));
    if (remaining.length === 0) {
      await finishConversion(rentalId);
      return;
    }
    showToast(
      `Rental created for ${selectedItem.productName}. ${remaining.length} item${remaining.length === 1 ? "" : "s"} left to convert.`,
      "success",
    );
    setSelectedItem(null);
    setConvertMode("picking");
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
  const isMultiItem = e.items.length > 1;
  const isItemDone = (item: AdminEnquiryItem) => item.rentalId != null || convertedItemIds.has(item.id);
  const pendingItems = e.items.filter((item) => !isItemDone(item));

  const openConvert = () => {
    if (isMultiItem) {
      setConvertMode("picking");
    } else {
      setSelectedItem(e.items[0] ?? null);
      setConvertMode("form");
    }
  };

  const backToDetail = () => {
    setConvertMode("closed");
    setSelectedItem(null);
  };

  if (convertMode === "picking") {
    return (
      <div className="max-w-lg">
        <button
          onClick={backToDetail}
          className="mb-4 font-body text-[13px] font-medium text-graphite-700 hover:text-ink dark:text-graphite-300 dark:hover:text-ink-inverted"
        >
          ← Back to enquiry
        </button>
        <h1 className="mb-1 font-display text-[20px] font-bold text-ink dark:text-ink-inverted">
          Choose an item to convert
        </h1>
        <p className="mb-4 font-body text-[13px] text-graphite-500">
          This enquiry has {e.items.length} items. Convert them one at a time — each becomes its
          own rental.
        </p>
        <ul className="space-y-2">
          {e.items.map((item) => {
            const done = isItemDone(item);
            return (
              <li
                key={item.id}
                className="flex items-center justify-between gap-3 rounded border border-graphite-200 bg-white px-3 py-2.5 dark:border-graphite-800 dark:bg-graphite-900"
              >
                <div className="min-w-0">
                  <p className="truncate font-body text-[14px] text-ink dark:text-ink-inverted">
                    {item.productName}
                  </p>
                  <p className="font-mono text-[12px] text-graphite-500">
                    Qty {item.quantity}
                    {item.numberOfDays ? ` · ${item.numberOfDays} day${item.numberOfDays === 1 ? "" : "s"}` : ""}
                  </p>
                </div>
                {done ? (
                  <span className="flex-shrink-0 font-body text-[12px] font-medium text-state-success-text dark:text-state-success-text-dark">
                    Rental created
                  </span>
                ) : (
                  <Button
                    size="sm"
                    onClick={() => {
                      setSelectedItem(item);
                      setConvertMode("form");
                    }}
                  >
                    Convert
                  </Button>
                )}
              </li>
            );
          })}
        </ul>
        {pendingItems.length === 0 && (
          <p className="mt-4 font-body text-[13px] text-graphite-500">
            All items converted. Marking this enquiry as converted…
          </p>
        )}
      </div>
    );
  }

  if (convertMode === "form") {
    const categoryId = product.status === "success" && product.data ? product.data.categoryId : "";
    const backTarget = isMultiItem ? () => setConvertMode("picking") : backToDetail;
    return (
      <div>
        <button
          onClick={backTarget}
          className="mb-4 font-body text-[13px] font-medium text-graphite-700 hover:text-ink dark:text-graphite-300 dark:hover:text-ink-inverted"
        >
          {isMultiItem ? "← Back to items" : "← Back to enquiry"}
        </button>
        <RentalForm
          enquiryId={e.id}
          enquiryItemId={selectedItem?.id}
          title={selectedItem ? `Convert "${selectedItem.productName}" to rental` : "Convert enquiry to rental"}
          submitLabel="Create rental"
          initialCustomerQuery={e.mobile}
          initialCustomerName={e.name}
          initialCategoryId={categoryId}
          initialProductId={(selectedItem?.productId ?? e.productId) ?? ""}
          initialQuantity={selectedItem?.quantity ?? e.quantity ?? 1}
          initialStartDate={e.requiredDate ?? undefined}
          initialReturnDate={
            e.requiredDate
              ? computeReturnDate(e.requiredDate, selectedItem?.numberOfDays ?? e.numberOfDays)
              : undefined
          }
          onCreated={(rentalId) => handleRentalCreated(rentalId, e.items)}
          onCancel={backTarget}
        />
      </div>
    );
  }

  return (
    <div className="lg:max-w-4xl">
      <Link to="/admin/enquiries" className="mb-4 block font-body text-[13px] font-medium text-graphite-700 hover:text-ink dark:text-graphite-300 dark:hover:text-ink-inverted">
        ← All enquiries
      </Link>

      <div className="mb-4 flex items-start justify-between gap-3">
        <div>
          <h1 className="font-display text-[20px] font-bold text-ink dark:text-ink-inverted">{e.name}</h1>
          <p className="font-mono text-[13px] text-graphite-500">{e.mobile}</p>
        </div>
        <div className="flex flex-shrink-0 items-center gap-2">
          <StatusBadge label={STATUS_LABEL[e.status]} tone={STATUS_TONE[e.status]} />
          <Link to={`/admin/enquiries/${e.id}/edit`}>
            <Button variant="secondary" size="sm">Edit</Button>
          </Link>
          <Button variant="ghost" size="sm" onClick={() => setConfirmingDelete(true)}>
            Delete
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-[1fr_320px] lg:items-start">
        <div className="max-w-lg lg:max-w-none">
          <div className="space-y-3 rounded border border-graphite-200 bg-white p-4 dark:border-graphite-800 dark:bg-graphite-900">
            {e.items.length > 0 ? (
              <div>
                <p className="font-body text-[12px] font-medium uppercase tracking-wide text-graphite-400">
                  Items ({e.items.length})
                </p>
                <ul className="mt-1.5 space-y-1.5">
                  {e.items.map((item) => (
                    <li
                      key={item.id}
                      className="flex items-center justify-between gap-3 rounded border border-graphite-100 px-3 py-2 dark:border-graphite-800"
                    >
                      <div className="min-w-0">
                        <p className="truncate font-body text-[14px] text-ink dark:text-ink-inverted">
                          {item.productName}
                        </p>
                        {item.dailyRate != null && (
                          <p className="font-body text-[12px] text-graphite-500">
                            {formatCurrency(item.dailyRate)}/day
                          </p>
                        )}
                      </div>
                      <div className="flex-shrink-0 text-right font-mono text-[12px] text-graphite-500">
                        <p>Qty {item.quantity}</p>
                        <p>{item.numberOfDays ? `${item.numberOfDays} day${item.numberOfDays === 1 ? "" : "s"}` : "Days not set"}</p>
                        {isItemDone(item) && (
                          <p className="font-body text-state-success-text dark:text-state-success-text-dark">Rental created</p>
                        )}
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            ) : (
              <>
                <Detail label="Product" value={e.productName ?? e.requestedProductText ?? "Not specified"} />
                {e.quantity && <Detail label="Quantity" value={String(e.quantity)} />}
                {e.numberOfDays && <Detail label="Number of days" value={String(e.numberOfDays)} />}
              </>
            )}
            {e.requiredDate && <Detail label="Required from" value={e.requiredDate} />}
            {e.address && <Detail label="Address" value={e.address} />}
            {e.message && <Detail label="Message" value={e.message} />}
            <Detail label="Submitted" value={new Date(e.createdAt).toLocaleString()} />
          </div>
        </div>

        <div className="max-w-lg space-y-5 lg:sticky lg:top-6 lg:max-w-none">
          <div>
            <Select
              label="Status"
              value={e.status}
              onChange={(ev) => {
                const next = ev.target.value as EnquiryStatus;
                if (next === "converted" && pendingItems.length > 0) {
                  setConfirmingStatusWithPendingItems(true);
                } else {
                  handleStatusChange(next);
                }
              }}
              disabled={savingStatus || alreadyConverted}
            >
              {statusOptionsFor(e.status).map((s) => (
                <option key={s} value={s}>{STATUS_LABEL[s]}</option>
              ))}
            </Select>
            {statusError && (
              <p className="mt-1 font-body text-[12px] text-state-danger-text dark:text-state-danger-text-dark">Couldn't save. Try again.</p>
            )}
            {alreadyConverted && (
              <div className="mt-2 flex items-start justify-between gap-3">
                <p className="font-body text-[12px] text-graphite-500">
                  Locked once converted. Reopen to change status or convert remaining items.
                </p>
                <button
                  type="button"
                  onClick={() => setConfirmingReopen(true)}
                  className="flex-shrink-0 font-body text-[12px] font-medium text-graphite-700 underline hover:text-ink dark:text-graphite-300 dark:hover:text-ink-inverted"
                >
                  Reopen enquiry
                </button>
              </div>
            )}
          </div>

          <div className="border-t border-graphite-200 pt-5 dark:border-graphite-800">
            <Button fullWidth onClick={openConvert} disabled={alreadyConverted}>
              {alreadyConverted ? "Already converted to rental" : "Convert to Rental"}
            </Button>
            {!alreadyConverted && (
              <p className="mt-2 font-body text-[12px] text-graphite-500">
                {isMultiItem
                  ? `Carries this enquiry's name and mobile into a new rental, one item at a time (${e.items.length} items). The enquiry is marked "Converted to Rental" once every item has one.`
                  : "Carries this enquiry's name, mobile, product and dates into a new rental. The original enquiry is preserved and marked \"Converted to Rental\" once the rental is created."}
              </p>
            )}
          </div>
        </div>
      </div>

      <ConfirmDialog
        open={confirmingStatusWithPendingItems}
        title="Mark converted with items still pending?"
        description={
          pendingItems.length === e.items.length
            ? `None of the ${e.items.length} items on this enquiry have a rental linked yet. If you set this to "Converted to Rental" now, you won't be able to use the item picker to convert them afterward — you'd need to change the status back first.`
            : `${pendingItems.length} of ${e.items.length} items on this enquiry don't have a rental linked yet. If you set this to "Converted to Rental" now, you won't be able to use the item picker to convert them afterward — you'd need to change the status back first.`
        }
        confirmLabel="Set anyway"
        onConfirm={() => {
          setConfirmingStatusWithPendingItems(false);
          handleStatusChange("converted");
        }}
        onCancel={() => setConfirmingStatusWithPendingItems(false)}
      />

      <ConfirmDialog
        open={confirmingReopen}
        title="Reopen this enquiry?"
        description={
          pendingItems.length > 0
            ? `This moves the status back to "${STATUS_LABEL[REOPEN_TARGET_STATUS]}" so you can use the item picker to convert the ${pendingItems.length} remaining item${pendingItems.length === 1 ? "" : "s"}. Items that already have a rental stay linked and won't be affected.`
            : `This moves the status back to "${STATUS_LABEL[REOPEN_TARGET_STATUS]}". Any rentals already created from this enquiry stay exactly as they are — this only unlocks the status and the Convert to Rental screen.`
        }
        confirmLabel="Reopen"
        confirmVariant="primary"
        onConfirm={() => {
          setConfirmingReopen(false);
          handleStatusChange(REOPEN_TARGET_STATUS);
        }}
        onCancel={() => setConfirmingReopen(false)}
      />

      <ConfirmDialog
        open={confirmingDelete}
        title="Delete enquiry?"
        description={`This enquiry from "${e.name}" will be permanently removed.`}
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
