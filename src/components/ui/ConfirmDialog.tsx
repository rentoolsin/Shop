import { Modal } from "./Modal";
import { Button } from "./Button";

interface ConfirmDialogProps {
  open: boolean;
  title: string;
  description?: string;
  confirmLabel?: string;
  /**
   * Visual style of the confirm button. Defaults to "danger" since most
   * uses of this dialog so far (delete, set-anyway) are destructive or
   * hard-to-undo. Pass "primary" for confirmations that aren't — e.g.
   * "Reopen enquiry" — so the button doesn't read as a warning.
   */
  confirmVariant?: "danger" | "primary";
  onConfirm: () => void;
  onCancel: () => void;
  loading?: boolean;
}

export function ConfirmDialog({
  open,
  title,
  description,
  confirmLabel = "Delete",
  confirmVariant = "danger",
  onConfirm,
  onCancel,
  loading,
}: ConfirmDialogProps) {
  return (
    <Modal open={open} onClose={onCancel} title={title}>
      {description && (
        <p className="mb-4 font-body text-[14px] text-graphite-600 dark:text-graphite-300">
          {description}
        </p>
      )}
      <div className="flex gap-2">
        <Button variant="secondary" fullWidth onClick={onCancel} disabled={loading}>
          Cancel
        </Button>
        <Button variant={confirmVariant} fullWidth onClick={onConfirm} disabled={loading}>
          {loading ? "Working…" : confirmLabel}
        </Button>
      </div>
    </Modal>
  );
}
